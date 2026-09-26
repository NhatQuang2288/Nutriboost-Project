import crypto from "crypto";

// Tạo refresh token thô (gửi về client)
export const createRefreshToken = () => crypto.randomBytes(64).toString("hex");

// Băm token để lưu DB (không lưu token thô)
export const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");