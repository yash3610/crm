import mongoose from "mongoose";

import Branch from "../models/Branch.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import Quotation from "../models/Quotation.js";
import Supplier from "../models/Supplier.js";
import Invoice from "../models/Invoice.js";
import { ApiError } from "../utils/ApiError.js";
import { createCrudController } from "./crudController.js";

async function validatePaymentOwnership(payload, req) {
  if (payload.invoice && mongoose.isValidObjectId(payload.invoice)) {
    const invoiceExists = await Invoice.exists({
      _id: payload.invoice,
      tenantId: req.tenantId,
    });
    if (!invoiceExists) throw new ApiError(400, "Invalid invoice");
  }
  return payload;
}

export const customerController = createCrudController({
  Model: Customer,
  idField: "customerId",
  prefix: "C",
  searchFields: ["name", "email", "phone", "city"],
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

export const paymentController = createCrudController({
  Model: Payment,
  idField: "paymentId",
  prefix: "PM",
  searchFields: ["invoiceNumber", "customer", "reference"],
  transform: (item) => ({ ...item, invoice: item.invoiceNumber }),
  beforeCreate: validatePaymentOwnership,
  beforeUpdate: validatePaymentOwnership,
});

export const expenseController = createCrudController({
  Model: Expense,
  idField: "expenseId",
  prefix: "E",
  searchFields: ["category", "vendor", "note"],
});

export const quotationController = createCrudController({
  Model: Quotation,
  idField: "quotationId",
  prefix: "Q",
  searchFields: ["number", "customer"],
});

export const purchaseController = createCrudController({
  Model: Purchase,
  idField: "purchaseId",
  prefix: "PO",
  searchFields: ["number", "supplier"],
});

export const branchController = createCrudController({
  Model: Branch,
  idField: "branchId",
  prefix: "B",
  searchFields: ["name", "address", "phone"],
});
