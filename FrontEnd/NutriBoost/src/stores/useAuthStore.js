import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  signUp: async (
    username,
    email,
    password,
    confirmPassword,
    role,
    groupCode,
  ) => {
    try {
      set({ loading: true });
      const data = await authService.signUp(
        username,
        email,
        password,
        confirmPassword,
        role,
        groupCode,
      );
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Đăng ký không thành công";
      toast.error(msg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logIn: async (email, password) => {
    try {
      set({ loading: true });
      const data = await authService.LogIn(email, password);
      set({ accessToken: data.accessToken, user: data.user ?? null });
      toast.success("Đăng nhập thành công");
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Đăng nhập không thành công";
      toast.error(msg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logOut: async () => {
    try {
      await authService.logOut();
    } finally {
      set({ accessToken: null, user: null });
    }
  },

  forgotPassword: async (email) => {
    try {
      set({ loading: true });
      const data = await authService.forgotPassword(email);
      toast.success(data.message);
      return data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setAccessToken: (token) => set({ accessToken: token }),
}));
