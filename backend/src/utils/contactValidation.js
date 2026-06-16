import { ApiError } from "./ApiError.js";

export const CONTACT_LIMITS = {
  name: 50,
  email: 30,
  phone: 15,
  city: 50,
};

export function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizePhone(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function assertName(value, label = "Name") {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${label} is required`);
  }
  const clean = normalizeName(value);
  if (clean.length > CONTACT_LIMITS.name) {
    throw new ApiError(
      400,
      `${label} cannot exceed ${CONTACT_LIMITS.name} characters`,
    );
  }
  return clean;
}

export function assertEmail(value, { required = false } = {}) {
  if (typeof value !== "string") {
    throw new ApiError(400, "Enter a valid email address");
  }
  const clean = normalizeEmail(value);
  if (!clean) {
    if (required) throw new ApiError(400, "Email is required");
    return "";
  }
  if (
    clean.length > CONTACT_LIMITS.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
  ) {
    throw new ApiError(400, "Enter a valid email address");
  }
  return clean;
}

export function assertPhone(value, { required = false } = {}) {
  if (typeof value !== "string") {
    throw new ApiError(400, "Enter a valid phone number");
  }
  const clean = normalizePhone(value);
  if (!clean) {
    if (required) throw new ApiError(400, "Phone number is required");
    return "";
  }
  const digitCount = clean.replace(/\D/g, "").length;
  if (!/^\+?[\d\s().-]+$/.test(clean) || digitCount < 7 || digitCount > 15) {
    throw new ApiError(400, "Enter a valid phone number with 7 to 15 digits");
  }
  return clean;
}
