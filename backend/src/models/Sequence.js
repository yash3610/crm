import mongoose from "mongoose";

import { cleanJson } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    value: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

schema.index({ tenantId: 1, key: 1 }, { unique: true });
cleanJson(schema);

export default mongoose.model("Sequence", schema);
