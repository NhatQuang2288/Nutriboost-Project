import { useState } from "react";
import { Link } from "react-router";
import { Dumbbell, Mail, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const loading = useAuthStore((s) => s.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // lỗi đã được toast trong store, không cần xử lý thêm ở đây
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
          {!sent ? (
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-emerald-600" />
              </div>
              <h1 className="font-['Outfit'] text-2xl font-[700] text-slate-900 mb-1">Quên mật khẩu?</h1>
              <p className="text-slate-500 text-sm mb-6">Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-emerald-600" />
              </div>
              <h2 className="font-['Outfit'] text-xl font-[700] text-slate-900 mb-2">Email đã được gửi!</h2>
              <p className="text-slate-500 text-sm mb-6">Vui lòng kiểm tra hộp thư của <strong>{email}</strong> và làm theo hướng dẫn.</p>
            </div>
          )}

          <Link to="/login" className="flex items-center gap-2 justify-center text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors">
            <ArrowLeft size={14} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}