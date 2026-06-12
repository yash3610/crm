import { ApiError } from "../utils/ApiError.js";

const DEFAULT_SECRET = "change-this-secret-in-production";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_SECRET || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be a unique value of at least 32 characters",
    );
  }
  return secret;
}

export const jwtOptions = {
  algorithms: ["HS256"],
  issuer: "billpro-api",
  audience: "billpro-web",
};

export function securityHeaders(req, res, next) {
  res.set({
    "Content-Security-Policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
  });
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function noStore(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

export function createRateLimiter({
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    res.set("RateLimit-Limit", String(max));
    res.set(
      "RateLimit-Reset",
      String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
    );

    if (current.count > max) {
      res.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
      );
      return next(new ApiError(429, message));
    }

    next();
  };
}

function assertSafeKeys(value) {
  if (!value || typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      key.startsWith("$") ||
      key.includes(".") ||
      ["__proto__", "constructor", "prototype"].includes(key)
    ) {
      throw new ApiError(400, "Request contains an invalid field");
    }
    assertSafeKeys(nestedValue);
  }
}

export function sanitizeRequest(req, res, next) {
  void res;
  assertSafeKeys(req.body);
  assertSafeKeys(req.query);
  assertSafeKeys(req.params);
  next();
}
