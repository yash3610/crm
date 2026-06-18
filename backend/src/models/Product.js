import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    hsn: { type: String, trim: true, maxlength: 20, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "pcs" },
    gst: { type: Number, default: 18, min: 0 },
  },
  { timestamps: true },
);
tenantScope(schema, ["productId", "sku"]);
cleanJson(schema);
export default mongoose.model("Product", schema);
