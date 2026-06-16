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

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateName(value, label = "Name") {
  if (!value) return `${label} is required`;
  if (value.length > CONTACT_LIMITS.name) {
    return `${label} cannot exceed ${CONTACT_LIMITS.name} characters`;
  }
  return "";
}

export function validateEmail(value, { required = false } = {}) {
  if (!value) return required ? "Email is required" : "";
  if (value.length > CONTACT_LIMITS.email || !isValidEmail(value)) {
    return "Enter a valid email address";
  }
  return "";
}

export function validatePhone(value, { required = false } = {}) {
  if (!value) return required ? "Phone number is required" : "";
  const digitCount = value.replace(/\D/g, "").length;
  if (!/^\+?[\d\s().-]+$/.test(value) || digitCount < 7 || digitCount > 15) {
    return "Enter a valid phone number with 7 to 15 digits";
  }
  return "";
}
