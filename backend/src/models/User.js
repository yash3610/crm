import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { cleanJson } from "./plugins.js";

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, sparse: true },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      validate: {
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid email address",
      },
    },
    password: { type: String, required: true, minlength: 8, select: false },
    authVersion: { type: Number, default: 0, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    role: {
      type: String,
      enum: ["Owner", "Admin", "Accountant", "Sales", "Viewer"],
      default: "Viewer",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastSeen: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1, userId: 1 }, { unique: true, sparse: true });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

cleanJson(userSchema);

export default mongoose.model("User", userSchema);
