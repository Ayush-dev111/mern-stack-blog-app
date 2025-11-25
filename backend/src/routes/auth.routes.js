import express from "express";
import { checkAuth, login, logout, resetPassword, signup, verifyOtp } from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.post("/verify-email", verifyOtp);

router.get("/check-auth", protectRoute, checkAuth);

router.post("/reset-password", protectRoute, resetPassword);

export default router;
