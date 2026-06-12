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

const schema = new mongoose.Schema(
  {
    quotationId: { type: String, required: true },
    number: { type: String, required: true },
    customer: { type: String, required: true },
    customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    date: { type: Date, required: true },
    validTill: { type: Date, required: true },
    lines: { type: [lineSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "expired"],
      default: "draft",
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    terms: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);
tenantScope(schema, ["quotationId", "number"]);
cleanJson(schema);
export default mongoose.model("Quotation", schema);
