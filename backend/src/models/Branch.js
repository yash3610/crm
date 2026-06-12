import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    branchId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    team: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);
tenantScope(schema, ["branchId"]);
cleanJson(schema);
export default mongoose.model("Branch", schema);
