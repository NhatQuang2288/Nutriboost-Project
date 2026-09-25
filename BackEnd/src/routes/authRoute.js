import express from "express";
import { forgotPassword, LogIn, refreshAccessToken, signOut, signUp } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/signup",authLimiter,signUp)

router.post("/login",authLimiter,LogIn)

router.post("/signout",signOut)

router.post("/refresh",refreshAccessToken);

router.post("/forgotpassword", authLimiter, forgotPassword);

export default router ;