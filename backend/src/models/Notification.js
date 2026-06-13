import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true },
    type: {
      type: String,
      enum: ["success", "warning", "info", "error"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["sales", "payments", "purchases", "inventory", "expenses", "system"],
      default: "system",
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    actionUrl: { type: String, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
tenantScope(schema, ["notificationId"]);
cleanJson(schema);
export default mongoose.model("Notification", schema);
