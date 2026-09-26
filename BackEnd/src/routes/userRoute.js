import express from "express";
import { authMe } from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me",protectedRoute , authMe) ; //dung neu muon bao ve don le

export default router ;