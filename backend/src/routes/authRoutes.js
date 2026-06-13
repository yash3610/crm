import { Router } from "express";

import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createRateLimiter, noStore } from "../config/security.js";

const router = Router();
const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT) || 20,
  message: "Too many authentication attempts. Please try again later.",
});

router.use(noStore);
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password/:token", authRateLimit, resetPassword);
router.get("/me", protect, me);

export default router;
