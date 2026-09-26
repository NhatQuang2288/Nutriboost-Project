import api from "@/lib/axios";

export const authService = {
  signUp: async (username ,email, password, confirmPassword,role,groupCode) => {
    const res = await api.post(
      "/auth/signup",
      { username , email, password, confirmPassword, role, groupCode },
      // { withCredentials: true },
    );
    return res.data;
  },

  LogIn: async (email, password) => {
    const res = await api.post(
      "/auth/login",
      { email, password },
    );
    return res.data;
  },

  logOut: async () => {
    const res = await api.post("/auth/signout");
    return res.data;
  },

  forgotPassword: async(email) => {
    const res = await api.post("/auth/forgotpassword",{email}) ;
    return res.data ;
  }
};
