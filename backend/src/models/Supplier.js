import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    supplierId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    contact: { type: String, trim: true, maxlength: 120 },
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
    payable: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
tenantScope(schema, ["supplierId"]);
cleanJson(schema);
export default mongoose.model("Supplier", schema);
