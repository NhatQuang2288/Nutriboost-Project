import { useState } from 'react';
import { Link , useNavigate} from 'react-router';
import AuthLayout from '@/layouts/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Login() {
  // Them vào ngày 20/9
  const navigate = useNavigate();
  const logIn = useAuthStore(s => s.logIn);
  const loading = useAuthStore(s => s.loading);


  const [form, setForm] = useState({ email: '', password: '' });
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await logIn(form.email, form.password);
      navigate('/dashboard', { replace: true }); // đổi thành trang chính của bạn
    } catch (err) {
      setError(err?.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }

  };

  return (
    <AuthLayout>
      <div
        className="rounded-2xl border px-7 py-9 sm:px-10 sm:py-11"
        style={{
          background: 'rgba(255, 255, 255, 0.62)',
          borderColor: 'rgba(255, 255, 255, 0.78)',
          boxShadow: '0 20px 50px rgba(23, 61, 36, 0.16)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div className="mb-10">
          <div
            className="text-base tracking-wide font-semibold mb-3"
            style={{ color: 'var(--color-brand-lime)' }}
          >
            Chào mừng trở lại
          </div>
          <h1
            className="text-5xl font-black leading-none"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-brand-heading)', letterSpacing: '-1.5px' }}
          >
            Đăng Nhập
          </h1>
          <p className="text-base mt-3" style={{ color: 'var(--color-brand-muted)' }}>
            Tiếp tục hành trình fitness của bạn
          </p>
        </div>

        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-lg text-sm border"
            style={{
              background: 'rgba(216,60,77,0.08)',
              borderColor: 'rgba(216,60,77,0.25)',
              color: 'var(--color-brand-red)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          

          <AuthInput
            label="Email"
            id="email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />

          <AuthInput
            label="Mật khẩu"
            id="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              to="/forgotpassword"
              className="text-sm transition-colors"
              style={{ color: "var(--color-brand-muted)" }}
              onMouseEnter={(e) =>(e.target.style.color = "var(--color-brand-lime)")}
              onMouseLeave={(e) =>(e.target.style.color = "var(--color-brand-muted)")}
            >
              Quên mật khẩu?
            </Link>
          </div>

          <AuthButton loading={loading}>Đăng Nhập</AuthButton>
        </form>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-brand-border)' }}>
          <p className="text-center text-base" style={{ color: 'var(--color-brand-muted)' }}>
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-semibold transition-colors"
              style={{ color: 'var(--color-brand-lime)' }}
              onMouseEnter={e => (e.target.style.color = 'var(--color-brand-lime-dim)')}
              onMouseLeave={e => (e.target.style.color = 'var(--color-brand-lime)')}
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
