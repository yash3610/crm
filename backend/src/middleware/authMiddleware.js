import jwt from "jsonwebtoken";

import { getJwtSecret, jwtOptions } from "../config/security.js";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret(), jwtOptions);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  const user = await User.findById(decoded.id).select("+authVersion");

  if (
    !user ||
    user.status !== "active" ||
    !decoded.tenantId ||
    user.tenantId.toString() !== decoded.tenantId ||
    (user.authVersion || 0) !== (decoded.authVersion || 0)
  ) {
    throw new ApiError(401, "User is not available");
  }

  const tenant = await Tenant.findById(user.tenantId);
  if (!tenant || tenant.status !== "active") {
    throw new ApiError(403, "Workspace is not active");
  }

  req.user = user;
  req.tenant = tenant;
  req.tenantId = tenant._id;
  next();
});

export const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission"));
    }
    next();
  };
