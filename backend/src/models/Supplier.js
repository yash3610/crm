import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    supplierId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    payable: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
tenantScope(schema, ["supplierId"]);
cleanJson(schema);
export default mongoose.model("Supplier", schema);
