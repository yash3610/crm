import mongoose from "mongoose";

import { cleanJson } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "premium"],
      default: "starter",
    },
  },
  { timestamps: true },
);

cleanJson(schema);

export default mongoose.model("Tenant", schema);
