import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dumbbell, Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    try {
      await forgotPassword(email);
      setStep("reset"); 
    } catch {
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await resetPassword(email, otp, newPassword);
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7f4]">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="font-['Outfit'] font-bold text-xl text-emerald-700">NutriBoost</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
          {step === "request" && (
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-emerald-600" />
              </div>
              <h1 className="font-['Outfit'] text-2xl font-[700] text-slate-900 mb-1">Quên mật khẩu?</h1>
              <p className="text-slate-500 text-sm mb-6">Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.</p>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                    placeholder="ban@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <KeyRound size={22} className="text-emerald-600" />
              </div>
              <h1 className="font-['Outfit'] text-2xl font-[700] text-slate-900 mb-1">Nhập mã OTP</h1>
              <p className="text-slate-500 text-sm mb-6">
                Mã OTP đã được gửi tới <strong>{email}</strong>. Nhập mã và mật khẩu mới bên dưới.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.5em] font-semibold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                    placeholder="------"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Chưa nhận được mã? Gửi lại
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound size={24} className="text-emerald-600" />
              </div>
              <h2 className="font-['Outfit'] text-xl font-[700] text-slate-900 mb-2">Đặt lại mật khẩu thành công!</h2>
              <p className="text-slate-500 text-sm mb-6">Vui lòng đăng nhập lại bằng mật khẩu mới.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Về trang đăng nhập
              </button>
            </div>
          )}

          {step !== "done" && (
            <Link to="/login" className="flex items-center gap-2 justify-center text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors">
              <ArrowLeft size={14} />
              Quay lại đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}