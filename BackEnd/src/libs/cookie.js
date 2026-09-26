const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",   // cookie chỉ gửi tới /api/auth/*
};