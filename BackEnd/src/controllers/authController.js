import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../libs/supabase.js";
import { cookieOptions } from "../libs/cookie.js";
import { createRefreshToken, hashToken } from "../libs/token.js";
import { signUpSchema } from "../libs/validation.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
    try {
        const result = signUpSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Du lieu khong hop le",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const { username, email, password, role, groupCode } = result.data;

        const { data: duplicate } = await supabase
            .from("users")
            .select("id")
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        if (duplicate) {
            return res.status(409).json({ message: "Username hoac email da duoc dung" });
        }

        let group = null;

        // Neu la thanh vien, bat buoc xac thuc ma phong
        if (role === "member") {
            const { data: foundGroup, error: groupError } = await supabase
                .from("pt_groups")
                .select("id, is_active")
                .eq("code", groupCode)
                .maybeSingle();

            if (groupError) throw groupError;
            if (!foundGroup || !foundGroup.is_active) {
                return res.status(400).json({ message: "Ma phong khong hop le hoac da ngung hoat dong" });
            }
            group = foundGroup;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from("users")
            .insert({ username, email, hashed_password: hashedPassword, role })
            .select("id, username, email, role")
            .single();

        if (error) throw error;

        // Neu la thanh vien, ghi vao group_members
        if (role === "member" && group) {
            const { error: memberError } = await supabase
                .from("group_members")
                .insert({ group_id: group.id, user_id: newUser.id });

            if (memberError) throw memberError;
        }

        return res.status(201).json({
            message: "Dang ky thanh cong",
            user: newUser,
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "Username hoac email da duoc dung" });
        }
        console.error("Fail SignUp", error);
        return res.status(500).json({ message: "System Error" });
    }
};

export const LogIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Khong duoc de trong" });
        }

        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (userError) throw userError;
        if (!user) {
            return res.status(401).json({ message: "Username hoac Password khong chinh xac" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashed_password);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Username hoac Password khong chinh xac" });
        }

        const accessToken = jwt.sign(
            { userId: user.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        const refreshToken = createRefreshToken();

        const { error: sessionError } = await supabase.from("sessions").insert({
            user_id: user.id,
            token_hash: hashToken(refreshToken),
            expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL).toISOString(),
        });

        if (sessionError) throw sessionError;

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: REFRESH_TOKEN_TTL,
        });

        return res.status(200).json({
            message: `User ${user.username} da login thanh cong`,
            accessToken,
            user:{
                id:user.id,
                username:user.username,
                email:user.email,
                role:user.role,
            }
        });

    } catch (error) {
        console.error("Fail Sign In", error);
        return res.status(500).json({ message: "System Error" });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.sendStatus(401);

        const { data: session, error } = await supabase
            .from("sessions")
            .select("*")
            .eq("token_hash", hashToken(token))
            .maybeSingle();

        if (error) throw error;

        if (!session) {
            res.clearCookie("refreshToken", cookieOptions);
            return res.sendStatus(403);
        }

        if (new Date(session.expires_at) < new Date()) {
            await supabase.from("sessions").delete().eq("id", session.id);
            res.clearCookie("refreshToken", cookieOptions);
            return res.sendStatus(403);
        }

        const newRefreshToken = createRefreshToken();

        const { error: updateError } = await supabase
            .from("sessions")
            .update({
                token_hash: hashToken(newRefreshToken),
                expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL).toISOString(),
            })
            .eq("id", session.id);

        if (updateError) throw updateError;

        res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: REFRESH_TOKEN_TTL,
        });

        const accessToken = jwt.sign(
            { userId: session.user_id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        return res.status(200).json({ accessToken });

    } catch (error) {
        console.error("Refresh token error", error);
        return res.status(500).json({ message: "System Error" });
    }
};

export const signOut = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await supabase.from("sessions").delete().eq("token_hash", hashToken(token));
            res.clearCookie("refreshToken", cookieOptions);
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error("Fail Sign Out", error);
        return res.status(500).json({ message: "System Error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Vui long nhap email" });
        }

        const { data: user } = await supabase
            .from("users")
            .select("id, username")
            .eq("email", email)
            .maybeSingle();

        // Luôn trả về thành công dù email có tồn tại hay không,
        // để tránh lộ thông tin email nào đã đăng ký (chống dò email)
        if (!user) {
            return res.status(200).json({ message: "Neu email ton tai, link dat lai da duoc gui" });
        }

        const resetToken = createRefreshToken(); // tái dùng hàm sinh token ngẫu nhiên có sẵn
        const RESET_TOKEN_TTL = 30 * 60 * 1000; // 30 phút

        await supabase.from("password_resets").insert({
            user_id: user.id,
            token_hash: hashToken(resetToken),
            expires_at: new Date(Date.now() + RESET_TOKEN_TTL).toISOString(),
        });

        // TODO: gửi email thật chứa link, ví dụ:
        // const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        // await sendEmail(email, "Đặt lại mật khẩu", resetLink);

        console.log("Reset link (dev only):", `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`);

        return res.status(200).json({ message: "Neu email ton tai, link dat lai da duoc gui" });
    } catch (error) {
        console.error("Fail forgotPassword", error);
        return res.status(500).json({ message: "System Error" });
    }
};