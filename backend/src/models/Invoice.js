import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const lineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    hsn: { type: String, trim: true, maxlength: 20, default: "" },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 0, min: 0, max: 100 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true },
    number: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    lines: { type: [lineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    stockPosted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);
tenantScope(schema, ["invoiceId", "number"]);
cleanJson(schema);
export default mongoose.model("Invoice", schema);
