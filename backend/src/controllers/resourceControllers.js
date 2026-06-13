import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Quotation from "../models/Quotation.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";
import Invoice from "../models/Invoice.js";
import { ApiError } from "../utils/ApiError.js";
import { createCrudController } from "./crudController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { generateCode } from "../utils/generateCode.js";

async function validatePaymentOwnership(payload, req) {
  if (!payload.invoice || !mongoose.isValidObjectId(payload.invoice)) {
    throw new ApiError(400, "Invoice is required");
  }
  if (payload.invoice && mongoose.isValidObjectId(payload.invoice)) {
    const invoice = await Invoice.findOne({
      _id: payload.invoice,
      tenantId: req.tenantId,
    });
    if (!invoice) throw new ApiError(400, "Invalid invoice");

    const paid = await Payment.aggregate([
      {
        $match: {
          tenantId: req.tenantId,
          invoice: invoice._id,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    payload.existingPaid = paid[0]?.total || 0;
    const outstanding = Math.max(0, invoice.amount - (paid[0]?.total || 0));
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "Payment amount must be greater than zero");
    }
    if (amount > outstanding) {
      throw new ApiError(
        400,
        `Payment cannot exceed outstanding amount of ${outstanding}`,
      );
    }

    payload.invoiceNumber = invoice.number;
    payload.customer = invoice.customerName;
  }
  return payload;
}

function preventPaymentMutation() {
  throw new ApiError(409, "Recorded payments cannot be edited");
}

function calculatePurchase(payload) {
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

function calculateQuotation(payload) {
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

function withQuotationStatus(item) {
  const expired =
    !["accepted", "expired"].includes(item.status) &&
    item.validTill &&
    new Date(item.validTill).getTime() < Date.now();
  return { ...item, status: expired ? "expired" : item.status };
}

async function validateQuotation(payload, req) {
  const isUpdate = Boolean(req.params?.id);
  if (payload.customerRef) {
    if (!mongoose.isValidObjectId(payload.customerRef)) {
      throw new ApiError(400, "Invalid customer");
    }
    const customer = await Customer.findOne({
      _id: payload.customerRef,
      tenantId: req.tenantId,
    });
    if (!customer) throw new ApiError(400, "Invalid customer");
    payload.customer = customer.name;
  }
  if (!isUpdate && !payload.customer?.trim()) {
    throw new ApiError(400, "Customer is required");
  }
  if (!isUpdate && !payload.lines?.length) {
    throw new ApiError(400, "Add at least one quotation item");
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
  if (invalidLine) throw new ApiError(400, "Invalid quotation item");

  const productIds = (payload.lines || []).map((line) => line.product);
  if (productIds.length) {
    const count = await Product.countDocuments({
      _id: { $in: productIds },
      tenantId: req.tenantId,
    });
    if (count !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, "One or more products are invalid");
    }
  }
  return calculateQuotation(payload);
}

function withPurchaseStatus(item) {
  const overdue =
    item.status === "pending" &&
    item.dueDate &&
    new Date(item.dueDate).getTime() < Date.now();
  return { ...item, status: overdue ? "overdue" : item.status };
}

async function validatePurchaseOwnership(payload, req) {
  const isUpdate = Boolean(req.params?.id);
  if (payload.supplierRef) {
    if (!mongoose.isValidObjectId(payload.supplierRef)) {
      throw new ApiError(400, "Invalid supplier");
    }
    const supplier = await Supplier.findOne({
      _id: payload.supplierRef,
      tenantId: req.tenantId,
    });
    if (!supplier) throw new ApiError(400, "Invalid supplier");
    payload.supplier = supplier.name;
  }

  if (!isUpdate && !payload.supplier?.trim()) {
    throw new ApiError(400, "Supplier is required");
  }
  if (!isUpdate && !payload.supplierBillNumber?.trim()) {
    throw new ApiError(400, "Supplier bill number is required");
  }
  if (payload.supplierBillNumber?.trim()) {
    const duplicateQuery = {
      tenantId: req.tenantId,
      supplier: payload.supplier,
      supplierBillNumber: payload.supplierBillNumber.trim(),
    };
    if (isUpdate) {
      if (mongoose.isValidObjectId(req.params.id)) {
        duplicateQuery._id = { $ne: req.params.id };
      } else {
        duplicateQuery.purchaseId = { $ne: req.params.id };
      }
    }
    const duplicateBill = await Purchase.exists(duplicateQuery);
    if (duplicateBill) {
      throw new ApiError(409, "This supplier bill number is already recorded");
    }
  }
  if (!isUpdate && !payload.lines?.length) {
    throw new ApiError(400, "Add at least one purchase item");
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
  if (invalidLine) throw new ApiError(400, "Invalid purchase item");

  const productIds = (payload.lines || []).map((line) => line.product);
  if (productIds.length) {
    const productCount = await Product.countDocuments({
      _id: { $in: productIds },
      tenantId: req.tenantId,
    });
    if (productCount !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, "One or more products are invalid");
    }
  }

  if (!isUpdate) {
    payload.status = "pending";
    payload.paidAmount = 0;
    payload.payments = [];
    payload.stockPosted = false;
  }
  return calculatePurchase(payload);
}

async function postPurchaseStock(purchase, req) {
  if (!purchase.lines.length) return;
  const products = await Product.find({
    _id: { $in: purchase.lines.map((line) => line.product) },
    tenantId: req.tenantId,
  });
  const productById = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const quantities = purchase.lines.reduce((map, line) => {
    const key = String(line.product);
    map.set(key, (map.get(key) || 0) + Number(line.qty));
    return map;
  }, new Map());
  try {
    await Product.bulkWrite(
      [...quantities].map(([productId, quantity]) => ({
        updateOne: {
          filter: { _id: productId, tenantId: req.tenantId },
          update: { $inc: { stock: quantity } },
        },
      })),
    );
    await StockMovement.insertMany(
      purchase.lines.map((line) => {
        const product = productById.get(String(line.product));
        return {
          tenantId: req.tenantId,
          movementId: generateCode("M"),
          product: line.product,
          sku: product?.sku || "PURCHASE",
          productName: line.name,
          type: "in",
          qty: Number(line.qty),
          reason: `Purchase bill ${purchase.number}`,
          sourceType: "purchase",
          sourceId: purchase._id,
          sourceNumber: purchase.number,
        };
      }),
    );
    purchase.stockPosted = true;
    await purchase.save();
    if (purchase.supplierRef) {
      await Supplier.updateOne(
        { _id: purchase.supplierRef, tenantId: req.tenantId },
        { $inc: { payable: Number(purchase.amount) } },
      );
    }
    await createNotification({
      tenantId: req.tenantId,
      category: "purchases",
      title: "Purchase bill recorded",
      body: `${purchase.number} recorded for ${purchase.supplier}`,
      actionUrl: `/purchases/${purchase.purchaseId}`,
    });
  } catch (error) {
    await Promise.all(
      [...quantities].map(([productId, quantity]) =>
        Product.updateOne(
          { _id: productId, tenantId: req.tenantId },
          { $inc: { stock: -quantity } },
        ),
      ),
    );
    await StockMovement.deleteMany({
      tenantId: req.tenantId,
      sourceType: "purchase",
      sourceId: purchase._id,
    });
    await Purchase.deleteOne({ _id: purchase._id, tenantId: req.tenantId });
    throw error;
  }
}

async function preventPostedPurchaseUpdate(payload, req) {
  const conditions = [{ purchaseId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  const purchase = await Purchase.findOne({
    tenantId: req.tenantId,
    $or: conditions,
  });
  if (purchase?.stockPosted) {
    throw new ApiError(409, "Posted purchase bills cannot be edited");
  }
  return validatePurchaseOwnership(payload, req);
}

async function preventPurchaseDelete(req) {
  const conditions = [{ purchaseId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  const purchase = await Purchase.findOne({
    tenantId: req.tenantId,
    $or: conditions,
  });
  if (purchase?.stockPosted || purchase?.paidAmount > 0) {
    throw new ApiError(409, "Posted purchase bills cannot be deleted");
  }
}

export const customerController = createCrudController({
  Model: Customer,
  idField: "customerId",
  prefix: "C",
  searchFields: ["name", "email", "phone", "city"],
  afterCreate: async (customer, req) => {
    await createNotification({
      tenantId: req.tenantId,
      category: "sales",
      title: "New customer added",
      body: `${customer.name} was added to your customer directory`,
      actionUrl: "/customers",
    });
  },
});

export const supplierController = createCrudController({
  Model: Supplier,
  idField: "supplierId",
  prefix: "S",
  searchFields: ["name", "contact", "phone", "city"],
});

export const productController = createCrudController({
  Model: Product,
  idField: "productId",
  prefix: "P",
  searchFields: ["name", "sku", "category"],
});

const paymentCrudController = createCrudController({
  Model: Payment,
  idField: "paymentId",
  prefix: "PM",
  searchFields: ["invoiceNumber", "customer", "reference"],
  transform: (item) => ({
    ...item,
    invoiceId: item.invoice,
    invoice: item.invoiceNumber,
  }),
  beforeUpdate: preventPaymentMutation,
});

const createCustomerPayment = asyncHandler(async (req, res) => {
  const payload = await validatePaymentOwnership({ ...req.body }, req);
  const amount = Number(payload.amount);
  await Invoice.updateOne(
    { _id: payload.invoice, tenantId: req.tenantId },
    { $max: { paidAmount: Number(payload.existingPaid || 0) } },
  );
  const invoice = await Invoice.findOneAndUpdate(
    {
      _id: payload.invoice,
      tenantId: req.tenantId,
      status: { $nin: ["draft", "cancelled"] },
      $expr: {
        $gte: [
          { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] },
          amount,
        ],
      },
    },
    { $inc: { paidAmount: amount } },
    { new: true, runValidators: true },
  );
  if (!invoice) {
    throw new ApiError(409, "Outstanding balance changed; please try again");
  }

  let payment;
  try {
    payment = await Payment.create({
      tenantId: req.tenantId,
      paymentId: generateCode("PM"),
      invoice: invoice._id,
      invoiceNumber: invoice.number,
      customer: invoice.customerName,
      amount,
      date: payload.date,
      method: payload.method,
      reference:
        typeof payload.reference === "string" ? payload.reference.trim() : "",
    });
  } catch (error) {
    await Invoice.updateOne(
      { _id: invoice._id, tenantId: req.tenantId },
      { $inc: { paidAmount: -amount } },
    );
    throw error;
  }

  if (invoice.paidAmount >= invoice.amount) {
    invoice.status = "paid";
    await invoice.save();
  }
  if (invoice.customer) {
    await Customer.updateOne(
      { _id: invoice.customer, tenantId: req.tenantId },
      [
        {
          $set: {
            outstanding: {
              $max: [
                0,
                {
                  $subtract: [{ $ifNull: ["$outstanding", 0] }, amount],
                },
              ],
            },
          },
        },
      ],
    );
  }
  await createNotification({
    tenantId: req.tenantId,
    type: "success",
    category: "payments",
    title: "Payment received",
    body: `${invoice.customerName} paid INR ${amount.toLocaleString("en-IN")} for ${invoice.number}`,
    actionUrl: "/payments",
  });
  const item = payment.toJSON();
  item.mongoId = item.id;
  item.id = item.paymentId;
  item.invoiceId = item.invoice;
  item.invoice = item.invoiceNumber;
  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: item,
  });
});

const deleteCustomerPayment = asyncHandler(async (req, res) => {
  const conditions = [{ paymentId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  const payment = await Payment.findOne({
    tenantId: req.tenantId,
    $or: conditions,
  });
  if (!payment) throw new ApiError(404, "Payment not found");

  const amount = Number(payment.amount);
  const invoice = await Invoice.findOneAndUpdate(
    {
      _id: payment.invoice,
      tenantId: req.tenantId,
      paidAmount: { $gte: amount },
    },
    {
      $inc: { paidAmount: -amount },
      $set: { status: "pending" },
    },
    { new: true, runValidators: true },
  );
  if (!invoice) {
    throw new ApiError(409, "Invoice balance changed; please try again");
  }

  if (invoice.customer) {
    await Customer.updateOne(
      { _id: invoice.customer, tenantId: req.tenantId },
      [
        {
          $set: {
            outstanding: {
              $min: [
                { $ifNull: ["$totalBilled", invoice.amount] },
                {
                  $add: [{ $ifNull: ["$outstanding", 0] }, amount],
                },
              ],
            },
          },
        },
      ],
    );
  }

  const deleted = await Payment.deleteOne({
    _id: payment._id,
    tenantId: req.tenantId,
  });
  if (!deleted.deletedCount) {
    await Invoice.updateOne(
      { _id: invoice._id, tenantId: req.tenantId },
      {
        $inc: { paidAmount: amount },
        $set: {
          status:
            Number(invoice.paidAmount) + amount >= Number(invoice.amount)
              ? "paid"
              : "pending",
        },
      },
    );
    if (invoice.customer) {
      await Customer.updateOne(
        { _id: invoice.customer, tenantId: req.tenantId },
        { $inc: { outstanding: -amount } },
      );
    }
    throw new ApiError(409, "Payment deletion conflicted; please try again");
  }

  res.json({
    success: true,
    message: "Payment deleted and balances updated",
    data: {
      invoiceId: invoice.invoiceId,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
    },
  });
});

export const paymentController = {
  ...paymentCrudController,
  create: createCustomerPayment,
  remove: deleteCustomerPayment,
};

export const expenseController = createCrudController({
  Model: Expense,
  idField: "expenseId",
  prefix: "E",
  searchFields: ["category", "vendor", "note"],
  afterCreate: async (expense, req) => {
    await createNotification({
      tenantId: req.tenantId,
      category: "expenses",
      title: "Expense recorded",
      body: `${expense.category} expense of INR ${Number(expense.amount).toLocaleString("en-IN")} recorded for ${expense.vendor}`,
      actionUrl: "/expenses",
    });
  },
});

export const quotationController = createCrudController({
  Model: Quotation,
  idField: "quotationId",
  prefix: "Q",
  searchFields: ["number", "customer"],
  transform: withQuotationStatus,
  beforeCreate: validateQuotation,
  beforeUpdate: validateQuotation,
});

export const purchaseController = createCrudController({
  Model: Purchase,
  idField: "purchaseId",
  prefix: "PO",
  searchFields: ["number", "supplier", "supplierBillNumber"],
  transform: withPurchaseStatus,
  beforeCreate: validatePurchaseOwnership,
  afterCreate: postPurchaseStock,
  beforeUpdate: preventPostedPurchaseUpdate,
  beforeRemove: preventPurchaseDelete,
});

export const recordPurchasePayment = asyncHandler(async (req, res) => {
  const conditions = [{ purchaseId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  const purchase = await Purchase.findOne({
    tenantId: req.tenantId,
    $or: conditions,
  });
  if (!purchase) throw new ApiError(404, "Purchase bill not found");
  if (["cancelled", "draft"].includes(purchase.status)) {
    throw new ApiError(400, "This purchase bill cannot accept payments");
  }

  const amount = Number(req.body.amount);
  const outstanding = Math.max(
    0,
    Number(purchase.amount) - Number(purchase.paidAmount || 0),
  );
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }
  if (amount > outstanding) {
    throw new ApiError(
      400,
      `Payment cannot exceed outstanding amount of ${outstanding}`,
    );
  }

  const method = req.body.method;
  if (!["upi", "bank", "card", "cash", "cheque"].includes(method)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const payment = {
    amount,
    date: req.body.date || new Date(),
    method,
    reference:
      typeof req.body.reference === "string" ? req.body.reference.trim() : "",
  };
  const updated = await Purchase.findOneAndUpdate(
    {
      _id: purchase._id,
      tenantId: req.tenantId,
      $expr: {
        $gte: [
          { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] },
          amount,
        ],
      },
    },
    {
      $push: { payments: payment },
      $inc: { paidAmount: amount },
    },
    { new: true, runValidators: true },
  );
  if (!updated) {
    throw new ApiError(409, "Outstanding balance changed; please try again");
  }
  updated.status = updated.paidAmount >= updated.amount ? "paid" : "pending";
  await updated.save();
  if (updated.supplierRef) {
    await Supplier.updateOne(
      { _id: updated.supplierRef, tenantId: req.tenantId },
      [
        {
          $set: {
            payable: {
              $max: [0, { $subtract: [{ $ifNull: ["$payable", 0] }, amount] }],
            },
          },
        },
      ],
    );
  }
  await createNotification({
    tenantId: req.tenantId,
    type: "success",
    category: "payments",
    title: "Supplier payment recorded",
    body: `INR ${amount.toLocaleString("en-IN")} paid against ${updated.number}`,
    actionUrl: `/purchases/${updated.purchaseId}`,
  });

  res.status(201).json({
    success: true,
    message: "Supplier payment recorded",
    data: updated.toJSON(),
  });
});
