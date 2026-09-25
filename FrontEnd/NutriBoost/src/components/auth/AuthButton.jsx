export default function AuthButton({ children, type = 'submit', loading = false, onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="w-full py-4 text-base font-bold tracking-wide transition-all duration-200 rounded-lg relative overflow-hidden group"
      style={{
        background: 'var(--color-brand-lime)',
        color: '#ffffff',
        fontFamily: 'var(--font-body)',
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.background = 'var(--color-brand-lime-dim)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 8px 18px rgba(47,168,79,0.25)';
        }
      }}
      onMouseLeave={e => {
        if (!loading) {
          e.currentTarget.style.background = 'var(--color-brand-lime)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Đang xử lý…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
