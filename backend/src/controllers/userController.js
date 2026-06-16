import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { assertEmail, assertName } from "../utils/contactValidation.js";
import { createCrudController } from "./crudController.js";

const MANAGEABLE_ROLES = ["Owner", "Admin", "Accountant", "Sales", "Viewer"];

async function findTargetUser(req) {
  const conditions = [{ userId: req.params.id }];
  if (mongoose.isValidObjectId(req.params.id)) {
    conditions.push({ _id: req.params.id });
  }
  return User.findOne({ tenantId: req.tenantId, $or: conditions });
}

async function assertCanManageUser(req, payload = {}) {
  const target = await findTargetUser(req);
  if (!target) throw new ApiError(404, "Resource not found");
  if (req.user.role === "Admin" && target.role === "Owner") {
    throw new ApiError(403, "Admins cannot manage an owner account");
  }
  if (
    target.role === "Owner" &&
    (payload.status === "inactive" ||
      (payload.role !== undefined && payload.role !== "Owner"))
  ) {
    throw new ApiError(
      400,
      "The workspace owner cannot be disabled or reassigned",
    );
  }
  if (req.user._id.equals(target._id)) {
    if (
      payload.status === "inactive" ||
      (payload.role !== undefined && payload.role !== target.role)
    ) {
      throw new ApiError(400, "You cannot disable or change your own role");
    }
  }
  return target;
}

async function validateUserPayload(payload, req, target) {
  const clean = { ...payload };

  if (clean.name !== undefined) clean.name = assertName(clean.name);
  if (clean.email !== undefined) {
    clean.email = assertEmail(clean.email, { required: true });
  }

  if (clean.role !== undefined && !MANAGEABLE_ROLES.includes(clean.role)) {
    throw new ApiError(400, "Select a valid role");
  }
  if (!clean.name && (!target || clean.name !== undefined)) {
    throw new ApiError(400, "Name is required");
  }
  if (!clean.email && (!target || clean.email !== undefined)) {
    throw new ApiError(400, "Email is required");
  }
  return clean;
}

export const userController = createCrudController({
  Model: User,
  idField: "userId",
  prefix: "U",
  searchFields: ["name", "email", "role"],
  beforeCreate: async (payload, req) => {
    const clean = await validateUserPayload(payload, req);
    if (clean.role === "Owner") {
      throw new ApiError(400, "This workspace already has an owner");
    }
    if (clean.password && clean.password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    return {
      ...clean,
      password: clean.password || "Welcome@123",
    };
  },
  beforeUpdate: async (payload, req) => {
    const target = await assertCanManageUser(req, payload);
    const clean = await validateUserPayload(payload, req, target);
    if (clean.role === "Owner" && target.role !== "Owner") {
      throw new ApiError(400, "This workspace already has an owner");
    }
    if (clean.password) {
      if (clean.password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
      }
      return { ...clean, password: await bcrypt.hash(clean.password, 12) };
    }
    delete clean.password;
    return clean;
  },
  beforeRemove: async (req) => {
    const target = await assertCanManageUser(req);
    if (target.role === "Owner") {
      throw new ApiError(400, "The workspace owner cannot be deleted");
    }
    if (req.user._id.equals(target._id)) {
      throw new ApiError(400, "You cannot delete your own account");
    }
  },
});
