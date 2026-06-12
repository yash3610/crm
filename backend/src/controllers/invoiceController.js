import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { createCrudController } from "./crudController.js";

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

async function validateInvoiceOwnership(payload, req) {
  if (payload.customer && mongoose.isValidObjectId(payload.customer)) {
    const customerExists = await Customer.exists({
      _id: payload.customer,
      tenantId: req.tenantId,
    });
    if (!customerExists) throw new ApiError(400, "Invalid customer");
  }

  const productIds = (payload.lines || [])
    .map((line) => line.product)
    .filter((id) => mongoose.isValidObjectId(id));
  if (productIds.length) {
    const productCount = await Product.countDocuments({
      _id: { $in: productIds },
      tenantId: req.tenantId,
    });
    if (productCount !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, "One or more products are invalid");
    }
  }

  return calculateInvoice(payload);
}

export const invoiceController = createCrudController({
  Model: Invoice,
  idField: "invoiceId",
  prefix: "I",
  searchFields: ["number", "customerName"],
  transform: (item) => ({ ...item, customer: item.customerName }),
  beforeCreate: validateInvoiceOwnership,
  beforeUpdate: validateInvoiceOwnership,
});
