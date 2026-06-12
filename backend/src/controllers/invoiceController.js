import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { ApiError } from "../utils/ApiError.js";
import { createCrudController } from "./crudController.js";
import { generateCode } from "../utils/generateCode.js";

function calculateInvoice(payload) {
  if (!payload.lines?.length) return payload;

  const totals = payload.lines.reduce(
    (result, line) => {
      const base = Number(line.qty) * Number(line.price);
      const discount = (base * Number(line.discount || 0)) / 100;
      const taxable = base - discount;
      result.subtotal += taxable;
      result.tax += (taxable * Number(line.gst || 0)) / 100;
      return result;
    },
    { subtotal: 0, tax: 0 },
  );

  return {
    ...payload,
    subtotal: totals.subtotal,
    tax: totals.tax,
    amount: totals.subtotal + totals.tax,
  };
}

function withInvoiceStatus(item) {
  const overdue =
    item.status === "pending" &&
    item.dueDate &&
    new Date(item.dueDate).getTime() < Date.now();
  return {
    ...item,
    customer: item.customerName,
    status: overdue ? "overdue" : item.status,
  };
}

async function validateInvoiceOwnership(payload, req) {
  const isUpdate = Boolean(req.params?.id);
  if (!isUpdate && !mongoose.isValidObjectId(payload.customer)) {
    throw new ApiError(400, "Customer is required");
  }
  if (payload.customer) {
    if (!mongoose.isValidObjectId(payload.customer)) {
      throw new ApiError(400, "Invalid customer");
    }
    const customer = await Customer.findOne({
      _id: payload.customer,
      tenantId: req.tenantId,
    });
    if (!customer) throw new ApiError(400, "Invalid customer");
    payload.customerName = customer.name;
  }

  if (!isUpdate && !payload.lines?.length) {
    throw new ApiError(400, "Add at least one invoice item");
  }
  const invalidLine = (payload.lines || []).find(
    (line) =>
      !mongoose.isValidObjectId(line.product) ||
      !Number.isFinite(Number(line.qty)) ||
      Number(line.qty) <= 0 ||
      !Number.isFinite(Number(line.price)) ||
      Number(line.price) < 0 ||
      Number(line.gst || 0) < 0 ||
      Number(line.gst || 0) > 100 ||
      Number(line.discount || 0) < 0 ||
      Number(line.discount || 0) > 100,
  );
  if (invalidLine) throw new ApiError(400, "Invalid invoice item");

  const productIds = (payload.lines || []).map((line) => line.product);
  if (productIds.length) {
    const products = await Product.find({
      _id: { $in: productIds },
      tenantId: req.tenantId,
    });
    if (products.length !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, "One or more products are invalid");
    }
    if (!isUpdate) {
      const required = payload.lines.reduce((map, line) => {
        const key = String(line.product);
        map.set(key, (map.get(key) || 0) + Number(line.qty));
        return map;
      }, new Map());
      const insufficient = products.find(
        (product) => product.stock < (required.get(String(product._id)) || 0),
      );
      if (insufficient) {
        throw new ApiError(400, `Insufficient stock for ${insufficient.name}`);
      }
    }
  }

  if (!isUpdate) {
    payload.status = "pending";
    payload.paidAmount = 0;
    payload.stockPosted = false;
  }
  return calculateInvoice(payload);
}

async function postInvoiceStock(invoice, req) {
  if (!invoice.lines.length) return;
  const products = await Product.find({
    _id: { $in: invoice.lines.map((line) => line.product) },
    tenantId: req.tenantId,
  });
  const productById = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const required = invoice.lines.reduce((map, line) => {
    const key = String(line.product);
    map.set(key, (map.get(key) || 0) + Number(line.qty));
    return map;
  }, new Map());
  const adjusted = [];
  try {
    for (const [productId, quantity] of required) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          tenantId: req.tenantId,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!product) {
        throw new ApiError(409, "Stock changed; please review the invoice");
      }
      adjusted.push({ productId, quantity });
    }
    await StockMovement.insertMany(
      invoice.lines.map((line) => {
        const product = productById.get(String(line.product));
        return {
          tenantId: req.tenantId,
          movementId: generateCode("M"),
          product: line.product,
          sku: product?.sku || "INVOICE",
          productName: line.name,
          type: "out",
          qty: Number(line.qty),
          reason: `Sale invoice ${invoice.number}`,
          sourceType: "invoice",
          sourceId: invoice._id,
          sourceNumber: invoice.number,
        };
      }),
    );
  } catch (error) {
    await Promise.all(
      adjusted.map(({ productId, quantity }) =>
        Product.updateOne(
          { _id: productId, tenantId: req.tenantId },
          { $inc: { stock: quantity } },
        ),
      ),
    );
    await Invoice.deleteOne({ _id: invoice._id, tenantId: req.tenantId });
    throw error;
  }
  invoice.stockPosted = true;
  await invoice.save();
  await Customer.updateOne(
    { _id: invoice.customer, tenantId: req.tenantId },
    {
      $inc: {
        totalBilled: Number(invoice.amount),
        outstanding: Number(invoice.amount),
      },
    },
  );
}

async function preventPostedInvoiceUpdate(payload, req) {
  const invoice = await Invoice.findOne({
    tenantId: req.tenantId,
    $or: [
      { invoiceId: req.params.id },
      ...(mongoose.isValidObjectId(req.params.id)
        ? [{ _id: req.params.id }]
        : []),
    ],
  });
  if (invoice?.stockPosted) {
    throw new ApiError(409, "Posted invoices cannot be edited");
  }
  return validateInvoiceOwnership(payload, req);
}

async function preventInvoiceDelete(req) {
  const invoice = await Invoice.findOne({
    tenantId: req.tenantId,
    $or: [
      { invoiceId: req.params.id },
      ...(mongoose.isValidObjectId(req.params.id)
        ? [{ _id: req.params.id }]
        : []),
    ],
  });
  if (invoice?.stockPosted) {
    throw new ApiError(409, "Posted invoices cannot be deleted");
  }
}

export const invoiceController = createCrudController({
  Model: Invoice,
  idField: "invoiceId",
  prefix: "I",
  searchFields: ["number", "customerName"],
  transform: withInvoiceStatus,
  beforeCreate: validateInvoiceOwnership,
  afterCreate: postInvoiceStock,
  beforeUpdate: preventPostedInvoiceUpdate,
  beforeRemove: preventInvoiceDelete,
});
