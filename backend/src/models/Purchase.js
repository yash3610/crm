import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    purchaseId: { type: String, required: true },
    number: { type: String, required: true },
    supplier: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);
tenantScope(schema, ["purchaseId", "number"]);
cleanJson(schema);
export default mongoose.model("Purchase", schema);
