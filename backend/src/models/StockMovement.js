import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    movementId: { type: String, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ["in", "out"], required: true },
    qty: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true },
    sourceType: {
      type: String,
      enum: ["invoice", "purchase", "adjustment"],
      default: "adjustment",
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    sourceNumber: { type: String, trim: true },
  },
  { timestamps: true },
);
tenantScope(schema, ["movementId"]);
cleanJson(schema);
export default mongoose.model("StockMovement", schema);
