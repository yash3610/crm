import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      validate: {
        validator: (value) =>
          !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid email address",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      validate: {
        validator: (value) => {
          if (!value) return true;
          if (!/^\+?[\d\s().-]+$/.test(value)) return false;
          const digitCount = value.replace(/\D/g, "").length;
          return digitCount >= 7 && digitCount <= 15;
        },
        message: "Enter a valid phone number with 7 to 15 digits",
      },
    },
    city: { type: String, trim: true, maxlength: 100 },
    outstanding: { type: Number, default: 0, min: 0 },
    totalBilled: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);
tenantScope(schema, ["customerId"]);
cleanJson(schema);
export default mongoose.model("Customer", schema);
