import express from "express";
import { createPayment, getPaymentStatus } from "../controllers/paymentController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js"; // ← sửa đường dẫn + tên hàm

const router = express.Router();

router.post("/create-payment", protectedRoute, createPayment);
router.get("/payment-status/:code", protectedRoute, getPaymentStatus);

export default router;