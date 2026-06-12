import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const lineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 0, min: 0, max: 100 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["upi", "bank", "card", "cash", "cheque"],
      required: true,
    },
    reference: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

const schema = new mongoose.Schema(
  {
    purchaseId: { type: String, required: true },
    number: { type: String, required: true },
    supplier: { type: String, required: true },
    supplierRef: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierBillNumber: { type: String, trim: true },
    date: { type: Date, required: true },
    dueDate: { type: Date },
    lines: { type: [lineSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    stockPosted: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0, min: 0 },
    payments: { type: [paymentSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "paid", "pending", "overdue", "cancelled"],
      default: "pending",
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
tenantScope(schema, ["purchaseId", "number"]);
schema.index(
  { tenantId: 1, supplierRef: 1, supplierBillNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      supplierRef: { $type: "objectId" },
      supplierBillNumber: { $type: "string" },
    },
  },
);
cleanJson(schema);
export default mongoose.model("Purchase", schema);
