import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    expenseId: { type: String, required: true },
    category: { type: String, required: true },
    vendor: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);
tenantScope(schema, ["expenseId"]);
cleanJson(schema);
export default mongoose.model("Expense", schema);
