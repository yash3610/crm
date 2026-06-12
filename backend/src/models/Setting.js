import mongoose from "mongoose";
import { cleanJson, tenantScope } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);
tenantScope(schema, ["key"]);
cleanJson(schema);
export default mongoose.model("Setting", schema);
