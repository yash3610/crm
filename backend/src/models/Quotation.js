import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    quotationId: { type: String, required: true },
    number: { type: String, required: true },
    customer: { type: String, required: true },
    date: { type: Date, required: true },
    validTill: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "expired"],
      default: "draft",
    },
  },
  { timestamps: true },
);
tenantScope(schema, ["quotationId", "number"]);
cleanJson(schema);
export default mongoose.model("Quotation", schema);
