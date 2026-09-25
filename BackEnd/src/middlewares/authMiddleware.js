import jwt from "jsonwebtoken";
import { supabase } from "../libs/supabase.js";

export const protectedRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        if (!token) return res.status(401).json({ message: "Thieu access token" });

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const { data: user, error } = await supabase
            .from("users")
            .select("id, username, email, avatar_url, bio, phone, created_at")
            .eq("id", decoded.userId)
            .maybeSingle();

        if (error) throw error;
        if (!user) return res.status(401).json({ message: "Nguoi dung khong ton tai" });

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token khong hop le hoac het han" });
        }
        console.error("authMiddleware error", error);
        return res.status(500).json({ message: "System Error" });
    }
};