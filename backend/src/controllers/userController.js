import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { createCrudController } from "./crudController.js";

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
  if (req.user._id.equals(target._id)) {
    if (payload.status === "inactive" || payload.role !== undefined) {
      throw new ApiError(400, "You cannot disable or change your own role");
    }
  }
  return target;
}

export const userController = createCrudController({
  Model: User,
  idField: "userId",
  prefix: "U",
  searchFields: ["name", "email", "role", "branch"],
  beforeCreate: async (payload, req) => {
    if (req.user.role === "Admin" && payload.role === "Owner") {
      throw new ApiError(403, "Admins cannot create an owner account");
    }
    return {
      ...payload,
      password: payload.password || "Welcome@123",
    };
  },
  beforeUpdate: async (payload, req) => {
    await assertCanManageUser(req, payload);
    if (payload.password) {
      return { ...payload, password: await bcrypt.hash(payload.password, 12) };
    }
    delete payload.password;
    return payload;
  },
  beforeRemove: async (req) => {
    const target = await assertCanManageUser(req);
    if (req.user._id.equals(target._id)) {
      throw new ApiError(400, "You cannot delete your own account");
    }
  },
});
