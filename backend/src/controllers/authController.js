import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { getJwtSecret, jwtOptions } from "../config/security.js";
import Setting from "../models/Setting.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/generateCode.js";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
  }
  if (!PASSWORD_PATTERN.test(password)) {
    throw new ApiError(
      400,
      "Password must include uppercase, lowercase and number characters",
    );
  }
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      tenantId: user.tenantId,
      role: user.role,
      authVersion: user.authVersion || 0,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: jwtOptions.issuer,
      audience: jwtOptions.audience,
      algorithm: "HS256",
    },
  );
}

function authResponse(user, tenant) {
  return {
    user: { ...user.toJSON(), tenant: tenant?.toJSON() },
    token: signToken(user),
  };
}

function createSlug(name) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "workspace";
  return `${base}-${Date.now().toString(36)}`;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;
  if (
    ![name, email, password, company].every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    throw new ApiError(400, "Name, company, email and password are required");
  }
  if (name.length > 100 || company.length > 120 || email.length > 254) {
    throw new ApiError(400, "One or more fields are too long");
  }
  validatePassword(password);
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(400, "Enter a valid email address");
  }

  const exists = await User.exists({ email: normalizedEmail });
  if (exists) throw new ApiError(409, "Email already registered");

  const tenant = await Tenant.create({
    name: company.trim(),
    slug: createSlug(company),
  });

  try {
    const user = await User.create({
      tenantId: tenant._id,
      userId: generateCode("U"),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "Owner",
      lastSeen: new Date(),
    });

    await Setting.create({
      tenantId: tenant._id,
      key: "company",
      value: { name: company, displayName: company },
    });

    res.status(201).json({
      success: true,
      message: "Workspace created",
      data: authResponse(user, tenant),
    });
  } catch (error) {
    await Promise.all([
      User.deleteMany({ tenantId: tenant._id }),
      Setting.deleteMany({ tenantId: tenant._id }),
      Tenant.findByIdAndDelete(tenant._id),
    ]);
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password +authVersion");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status !== "active") throw new ApiError(403, "Account is inactive");

  const tenant = await Tenant.findById(user.tenantId);
  if (!tenant || tenant.status !== "active") {
    throw new ApiError(403, "Workspace is not active");
  }

  user.lastSeen = new Date();
  await user.save();
  user.password = undefined;

  res.json({
    success: true,
    message: "Signed in successfully",
    data: authResponse(user, tenant),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { ...req.user.toJSON(), tenant: req.tenant.toJSON() },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new ApiError(400, "Enter a valid email address");
  }

  let developmentResetUrl;
  const user = await User.findOne({ email, status: "active" }).select(
    "+passwordResetToken +passwordResetExpires",
  );
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      const resetUrl = await sendPasswordResetEmail({
        email: user.email,
        resetToken,
      });
      if (process.env.NODE_ENV !== "production") {
        developmentResetUrl = resetUrl;
      }
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Failed to send password reset email:", error.message);
    }
  }

  res.json({
    success: true,
    message:
      "If an account exists for this email, password reset instructions will be sent.",
    ...(developmentResetUrl ? { data: { developmentResetUrl } } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = typeof req.params.token === "string" ? req.params.token : "";
  const { password } = req.body;
  validatePassword(password);

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new ApiError(400, "Password reset link is invalid or expired");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
    status: "active",
  }).select("+password +authVersion +passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "Password reset link is invalid or expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully",
  });
});
