import cors from "cors";
import express from "express";
import morgan from "morgan";

import {
  createRateLimiter,
  sanitizeRequest,
  securityHeaders,
} from "./config/security.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import apiRoutes from "./routes/apiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", process.env.TRUST_PROXY);
}
app.set("query parser", "simple");
app.use(securityHeaders);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new ApiError(403, "Origin is not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(sanitizeRequest);
app.use(
  "/api",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.API_RATE_LIMIT) || 500,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BillPro CRM API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
