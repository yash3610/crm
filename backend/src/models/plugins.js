import mongoose from "mongoose";

export function cleanJson(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc, result) {
      void doc;
      delete result._id;
      delete result.password;
      delete result.authVersion;
      delete result.passwordResetToken;
      delete result.passwordResetExpires;
      return result;
    },
  });
}

export function tenantScope(schema, uniqueFields = []) {
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
  });

  uniqueFields.forEach((field) => {
    schema.index({ tenantId: 1, [field]: 1 }, { unique: true });
  });
}
