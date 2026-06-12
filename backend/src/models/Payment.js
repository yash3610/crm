import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    invoiceNumber: { type: String, required: true },
    customer: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["upi", "bank", "card", "cash", "cheque"],
      required: true,
    },
    reference: { type: String, trim: true },
  },
  { timestamps: true },
);
tenantScope(schema, ["paymentId"]);
cleanJson(schema);
export default mongoose.model("Payment", schema);
