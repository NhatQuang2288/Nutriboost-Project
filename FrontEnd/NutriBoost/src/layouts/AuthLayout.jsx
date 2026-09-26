const BG_IMAGE =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=1800&fit=crop&auto=format';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-brand-black)' }}>
      {/* Left panel — branding / image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-center justify-center gap-12 overflow-hidden">
        <img
          src={BG_IMAGE}
          alt="Gym athlete in training"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.45)' }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(8,11,14,0.7) 0%, rgba(184,255,53,0.08) 100%)' }}
        />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 flex items-center justify-center rounded-lg"
              style={{ background: 'var(--color-brand-lime)' }}
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                <path d="M6 4v16M18 4v16M3 12h5M16 12h5M8 8h8M8 16h8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span
              className="text-2xl tracking-widest uppercase font-black"
              style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
            >
              NutriBoost
            </span>
          </div>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 text-center flex flex-col items-center">
          <p
            className="font-black leading-none mb-8"
            style={{
              fontFamily: 'var(--font-display)',
              color: '#ffffff',
              fontSize: 'clamp(4.5rem, 7vw, 8.5rem)',
              letterSpacing: '-3px',
            }}
          >
            Push Your<br />
            <span style={{ color: '#c7f9a4' }}>Limits</span>
          </p>
          <p className="text-xl max-w-lg leading-relaxed" style={{ color: '#e4f6e7' }}>
            Hành trình ngàn dặm bắt đầu từ một bước chạy. Đăng ký hôm nay và biến mục tiêu thành kết quả.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="w-full lg:w-1/2 relative flex flex-col justify-center overflow-hidden px-6 sm:px-12 lg:px-20 py-12"
      >
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(14px) brightness(1.08)', transform: 'scale(1.08)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(239, 250, 240, 0.84), rgba(221, 244, 225, 0.72))' }}
        />

        {/* Mobile logo */}
        <div className="relative z-10 flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-7 h-7 flex items-center justify-center"
            style={{ background: 'var(--color-brand-lime)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M6 4v16M18 4v16M3 12h5M16 12h5M8 8h8M8 16h8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="text-lg tracking-widest uppercase font-black"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-brand-heading)' }}
          >
            NutriBoost
          </span>
        </div>

        <div className="relative z-10 w-full mx-auto" style={{ maxWidth: '32rem' }}>{children}</div>
      </div>
    </div>
  );
}
