import express from "express";
import { checkAuth, forgotPassword, login, logout, resendOtp, newPassword, signup, verifyOtp, resetPassword } from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.post("/verify-email", verifyOtp);

router.get("/check-auth", protectRoute, checkAuth);

router.post("/new-password", protectRoute, newPassword);

router.post("/resend-otp", protectRoute, resendOtp)

router.post("/forgot-password", forgotPassword);

router.post("/reset-password:token", resetPassword);

export default router;
