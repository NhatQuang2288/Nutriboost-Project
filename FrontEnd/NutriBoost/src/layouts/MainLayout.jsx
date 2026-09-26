import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router";
import {
  LayoutDashboard, Users, Activity, Salad, CalendarDays, Dumbbell,
  Bot, Bell, CreditCard, Settings, ChevronDown, LogOut, UserCircle,
  Shield, HelpCircle, Menu, X, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

const ptNav = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/pt/dashboard" },
  { icon: Users, label: "Members", to: "/pt/members" },
  { icon: Activity, label: "Body Metrics", to: "/pt/body-metrics" },
  { icon: Salad, label: "Nutrition", to: "/pt/nutrition" },
  { icon: CalendarDays, label: "Meal Plans", to: "/pt/meal-plans" },
  { icon: Dumbbell, label: "Workout Plans", to: "/pt/workout-plans" },
  { icon: Bot, label: "AI Assistant", to: "/pt/ai-assistant" },
  { icon: Bell, label: "Notifications", to: "/pt/notifications" },
  { icon: CreditCard, label: "Subscription", to: "/pt/subscription" },
  { icon: Settings, label: "Settings", to: "/pt/settings" },
];

const memberNav = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/member/dashboard" },
  { icon: Activity, label: "Body Metrics", to: "/member/body-metrics" },
  { icon: Salad, label: "Nutrition", to: "/member/nutrition" },
  { icon: CalendarDays, label: "Meal Plans", to: "/member/meal-plans" },
  { icon: Dumbbell, label: "Workout Plans", to: "/member/workout-plans" },
  { icon: Bot, label: "AI Assistant", to: "/member/ai-assistant" },
  { icon: Bell, label: "Notifications", to: "/member/notifications" },
  { icon: Settings, label: "Settings", to: "/member/settings" },
];

export default function MainLayout() {
  const user = useAuthStore((s) => s.user);
  const logOutFromStore = useAuthStore((s) => s.logOut);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const notifications = 4; // TODO: thay bằng dữ liệu thật từ API sau này

  const navItems = user?.role === "pt" ? ptNav : memberNav;
  const prefix = user?.role === "pt" ? "/pt" : "/member";
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "U")}&background=2fa84f&color=fff`;

  const logout = async () => {
    await logOutFromStore();   // gọi API /auth/signout + xóa accessToken khỏi store
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f7f4]">
      <aside
        className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-white border-r border-emerald-100 flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-50">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-['Outfit'] font-[700] text-lg text-emerald-700 tracking-tight">
              NutriBoost
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-slate-400 hover:text-emerald-600 transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Đã bỏ toggle "Chế độ xem PT/Member" — role phải lấy từ tài khoản thật, không cho tự chuyển */}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-emerald-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>NutriBoost</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-medium">
              {user?.role === "pt" ? "Personal Trainer" : "Hội Viên"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => navigate(`${prefix}/notifications`)}
            >
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <img
                  src={user?.avatar || avatarFallback}
                  alt={user?.username || "User"}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-100"
                />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {user?.username}
                  </div>
                  {user?.plan && <div className="text-xs text-emerald-600">{user.plan}</div>}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  {[
                    { icon: UserCircle, label: "My Profile", to: `${prefix}/profile` },
                    { icon: Settings, label: "Settings", to: `${prefix}/settings` },
                    { icon: CreditCard, label: "Subscription", to: `${prefix}/subscription` },
                    { icon: Shield, label: "Privacy & Security", to: `${prefix}/privacy` },
                    { icon: HelpCircle, label: "Help & Support", to: `${prefix}/help` },
                  ].map(({ icon: Icon, label, to }) => (
                    <button
                      key={to}
                      onClick={() => { navigate(to); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}