import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    outstanding: { type: Number, default: 0, min: 0 },
    totalBilled: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);
tenantScope(schema, ["customerId"]);
cleanJson(schema);
export default mongoose.model("Customer", schema);
