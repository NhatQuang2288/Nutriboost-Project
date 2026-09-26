
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import { useAuthStore } from '@/stores/useAuthStore';

function ProtectedRoute() {
  const accessToken = useAuthStore(s => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// --- Guard theo role (pt / member) ---
function RoleRoute({ allow }) {
  const role = useAuthStore(s => s.user?.role);

  // role chưa xác định (user chưa load xong / token lỗi) -> về login,
  // tránh vòng lặp redirect vô hạn nếu để rơi xuống nhánh bên dưới
  if (!role) return <Navigate to="/login" replace />;

  if (!allow.includes(role)) {
    return <Navigate to={role === 'pt' ? '/pt/dashboard' : '/member/dashboard'} replace />;
  }
  return <Outlet />;
}

// --- Route gốc "/": khách chưa đăng nhập thấy trang Landing,
// user đã đăng nhập bị đưa thẳng vào dashboard tương ứng với role ---
function RootRoute() {
  const accessToken = useAuthStore(s => s.accessToken);
  const role = useAuthStore(s => s.user?.role);

  if (!accessToken) return <Landing />;
  return <Navigate to={role === 'pt' ? '/pt/dashboard' : '/member/dashboard'} replace />;
}

// --- Điều hướng cho các URL không khớp bất kỳ route nào, tùy theo trạng thái đăng nhập ---
function RootRedirect() {
  const accessToken = useAuthStore(s => s.accessToken);
  const role = useAuthStore(s => s.user?.role);

  if (!accessToken) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'pt' ? '/pt/dashboard' : '/member/dashboard'} replace />;
}


export const router = createBrowserRouter([
  // { index: true, element: <RootRoute /> },
  { index: true, element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgotpassword', element: <ForgotPassword /> },

  // {
  //   element: <ProtectedRoute />, // phải đăng nhập mới vào được các route bên dưới
  //   children: [
  //     {
  //       element: <MainLayout />, // layout dùng chung, bên trong render <Outlet />
  //       children: [
  //         {
  //           path: 'pt',
  //           element: <RoleRoute allow={['pt']} />,
  //           children: [
  //             { path: 'dashboard', element: <PTDashboard /> },
  //             { path: 'members', element: <Members /> },
  //             { path: 'members/:id', element: <MemberDetail /> },
  //             ...sharedChildren,
  //             { path: '*', element: <Navigate to="dashboard" replace /> },
  //           ],
  //         },
  //         {
  //           path: 'member',
  //           element: <RoleRoute allow={['member']} />,
  //           children: [
  //             { path: 'dashboard', element: <MemberDashboard /> },
  //             ...sharedChildren,
  //             { path: '*', element: <Navigate to="dashboard" replace /> },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },

  { path: '*', element: <RootRedirect /> },
]);