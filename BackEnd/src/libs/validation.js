import { z } from "zod";

export const signUpSchema = z.object({
    username: z.string().trim().min(3, "Username toi thieu 3 ky tu").max(30),
    email: z.string().trim().toLowerCase().email("Email khong hop le"),
    password: z.string().min(8, "Password toi thieu 8 ky tu"),
    confirmPassword: z.string(),
    role: z.enum(["member", "pt"], { message: "Vui long chon loai nguoi dung" }),
    groupCode: z.string().trim().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mat khau khong khop",
    path: ["confirmPassword"],
}).refine((data) => data.role !== "member" || !!data.groupCode, {
    message: "Vui long nhap ma phong",
    path: ["groupCode"],
});

export const logInSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email khong hop le"),
    password: z.string().min(1, "Password khong duoc de trong"),
});