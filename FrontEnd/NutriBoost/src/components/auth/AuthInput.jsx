export default function AuthInput({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold tracking-wide"
        style={{ color: 'var(--color-brand-text)' }}
      >
        {label}
        {!required && (
          <span className="ml-2 normal-case tracking-normal font-normal text-xs" style={{ color: 'var(--color-brand-muted)' }}>
            (tuỳ chọn)
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-5 py-3.5 rounded-lg text-base outline-none transition-all duration-200 border"
        style={{
          background: 'var(--color-brand-surface)',
          color: 'var(--color-brand-heading)',
          borderColor: 'var(--color-brand-border)',
          fontFamily: 'var(--font-body)',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--color-brand-lime)';
          e.target.style.boxShadow = '0 0 0 3px rgba(47,168,79,0.16)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--color-brand-border)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}