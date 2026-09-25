import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Qua nhieu lan thu, vui long doi 15 phut" },
    standardHeaders: true,
    legacyHeaders: false,
});