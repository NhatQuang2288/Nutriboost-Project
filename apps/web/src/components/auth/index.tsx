import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { AlertIcon, BoIcon, CheckIcon, InfoIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'

/**
 * Bộ khung cho các màn tài khoản: đăng nhập, đăng ký, quên và đặt lại mật khẩu.
 *
 * Chuyển từ thiết kế của bản thử Vite (nhánh `archive/ban-beta`, `AuthLayout.jsx`,
 * `AuthInput.jsx`, `AuthButton.jsx`): màn chia đôi, ảnh vận động bên trái, thẻ kính mờ bên
 * phải. Khác bản gốc ở ba chỗ, đều có lý do:
 *   • màu lấy từ token của design system thay vì mã hex rời, để chế độ tối vẫn đọc được
 *   • logo là Bơ thay vì quả tạ — linh vật trong logo chính là trợ lý, không tạo biểu tượng thứ hai
 *   • ảnh nằm trong `public/` thay vì gọi Unsplash lúc chạy, để trang không phụ thuộc máy chủ ngoài
 */

const HERO_IMAGE = '/images/auth/auth-hero.jpg'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg flex min-h-dvh">
      {/* Bên trái — ảnh và thông điệp, chỉ hiện ở màn hình lớn */}
      <aside className="relative hidden flex-col items-center justify-center gap-12 overflow-hidden lg:flex lg:w-1/2 xl:w-3/5">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 60vw, 50vw"
          className="object-cover object-[70%_center] brightness-[0.55]"
        />
        <div className="from-forest-900/75 via-forest-900/40 absolute inset-0 bg-gradient-to-br to-olive-500/15" />

        <div className="relative z-10">
          <BrandMark tone="light" size="lg" />
        </div>

        <div className="relative z-10 flex max-w-xl flex-col items-center px-8 text-center">
          <p className="font-display text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.95] font-black tracking-[-0.04em] text-white">
            Vượt qua
            <br />
            <span className="text-olive-200">giới hạn</span>
          </p>
          <p className="mt-8 text-lg leading-relaxed text-white/85">
            Hành trình ngàn dặm bắt đầu từ một bước chạy. Đăng ký hôm nay và biến mục tiêu thành kết
            quả.
          </p>
        </div>
      </aside>

      {/* Bên phải — form trên nền ảnh làm mờ */}
      <main className="safe-top safe-bottom relative flex w-full flex-col justify-center overflow-clip px-5 py-10 sm:px-12 lg:w-1/2 lg:px-16 xl:w-2/5">
        {/*
          Nền nằm trong lớp bọc riêng. Ảnh phóng 110% để giấu mép mờ của `blur`, nên nó rộng hơn
          khung. Để thẳng trong `main` thì `main` có phần tràn, và khi một ô nhập nhận focus trình
          duyệt cuộn `main` sang ngang — kể cả khi `overflow: hidden` — làm lộ một dải ảnh chưa phủ
          màu ở mép phải.
        */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover blur-[14px]"
          />
          <div className="from-bg/90 to-surface-sunken/80 absolute inset-0 bg-gradient-to-br" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-6">
          <div className="mb-2 lg:hidden">
            <BrandMark tone="dark" size="sm" />
          </div>
          {children}
          <Disclaimer />
        </div>
      </main>
    </div>
  )
}

function BrandMark({ tone, size }: { tone: 'light' | 'dark'; size: 'sm' | 'lg' }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="NutriBoost — về trang chủ">
      <span
        className={`flex items-center justify-center rounded-xl bg-olive-500 text-white ${
          size === 'lg' ? 'size-12' : 'size-9'
        }`}
      >
        <BoIcon size={size === 'lg' ? 28 : 21} />
      </span>
      <span
        className={`font-display font-black tracking-[0.18em] uppercase ${
          size === 'lg' ? 'text-2xl' : 'text-lg'
        } ${tone === 'light' ? 'text-white' : 'text-forest-700'}`}
      >
        NutriBoost
      </span>
    </Link>
  )
}

/** Thẻ kính mờ chứa tiêu đề và form. */
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  centered = false,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  centered?: boolean
  children: ReactNode
}) {
  return (
    <section className="border-surface/80 bg-surface/70 rounded-2xl border px-6 py-8 shadow-[0_20px_50px_rgb(23_61_36/0.16)] backdrop-blur-xl sm:px-10 sm:py-10">
      <header className={`mb-8 flex flex-col ${centered ? 'items-center text-center' : ''}`}>
        <p className="mb-3 text-base font-semibold tracking-wide text-olive-600">{eyebrow}</p>
        <h1 className="font-display text-forest-700 text-[40px] leading-none font-black tracking-[-0.03em] sm:text-5xl">
          {title}
        </h1>
        {subtitle === undefined ? null : (
          <p className="text-ink-muted mt-3 text-base">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  )
}

/**
 * Ô nhập có nhãn, lỗi và dòng mô tả.
 *
 * Lỗi được nối vào `aria-describedby` để trình đọc màn hình đọc ngay khi ô nhận focus, và ô
 * được đánh dấu `aria-invalid` — bản gốc chỉ tô đỏ chữ nên người không nhìn thấy không biết.
 */
export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  error,
  description,
  inputMode,
}: {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  error?: string | undefined
  description?: string
  inputMode?: 'email' | 'text'
}) {
  const errorId = `${id}-loi`
  const descriptionId = `${id}-mo-ta`
  const describedBy =
    [error === undefined ? null : errorId, description === undefined ? null : descriptionId]
      .filter((part) => part !== null)
      .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-semibold tracking-wide">
        {label}
        {required ? null : (
          <span className="text-ink-faint ml-2 text-xs font-normal">(tuỳ chọn)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'bg-surface text-ink placeholder:text-ink-faint w-full rounded-lg border px-4 py-3.5 text-base outline-none',
          'transition-all duration-(--duration-fast)',
          'focus:ring-4 focus:ring-olive-100',
          error === undefined
            ? 'border-line-strong focus:border-olive-500'
            : 'border-danger focus:border-danger',
        ].join(' ')}
      />
      {error === undefined ? null : (
        <p id={errorId} className="text-danger-text text-sm">
          {error}
        </p>
      )}
      {description === undefined ? null : (
        <p id={descriptionId} className="text-ink-muted text-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

/** Nút chính của form. Đang xử lý thì hiện vòng quay và khoá lại để không gửi hai lần. */
export function AuthButton({
  children,
  loading = false,
  disabled = false,
  loadingLabel = 'Đang xử lý…',
}: {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  loadingLabel?: string
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      aria-busy={loading}
      className={[
        'bg-forest-600 text-ink-inverse flex min-h-13 w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold tracking-wide',
        'transition-all duration-(--duration-fast)',
        'hover:bg-forest-700 hover:-translate-y-px hover:shadow-[0_8px_18px_rgb(50_75_46/0.25)]',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none',
      ].join(' ')}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8v8z" fill="currentColor" className="opacity-75" />
    </svg>
  )
}

/** Hộp báo lỗi hoặc báo thành công ở đầu form. */
export function AuthAlert({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const styles = {
    error: {
      box: 'border-danger/30 bg-danger-surface text-danger-text',
      icon: <AlertIcon size={18} />,
      role: 'alert' as const,
    },
    success: {
      box: 'border-success/30 bg-success-surface text-success-text',
      icon: <CheckIcon size={18} />,
      role: 'status' as const,
    },
    info: {
      box: 'border-info/30 bg-info-surface text-info-text',
      icon: <InfoIcon size={18} />,
      role: 'status' as const,
    },
  }[tone]

  return (
    <div
      role={styles.role}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${styles.box}`}
    >
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

/** Dòng chuyển qua lại giữa đăng nhập và đăng ký, ở chân thẻ. */
export function AuthSwitch({
  prompt,
  href,
  label,
}: {
  prompt: string
  href: Route
  label: string
}) {
  return (
    <p className="border-line text-ink-muted mt-8 border-t pt-6 text-center text-base">
      {prompt}{' '}
      <Link
        href={href}
        className="hover:text-forest-700 font-semibold text-olive-600 transition-colors"
      >
        {label}
      </Link>
    </p>
  )
}

/**
 * Chưa cấu hình Supabase: nói thẳng, và cho vào chế độ dữ liệu mẫu.
 *
 * Không hiện form giả — form không gửi được gì mà vẫn hiện ra là giả vờ. Bộ kiểm thử đầu-cuối
 * chạy ở chế độ này và khoá lại điều đó.
 */
export function NotConfiguredNotice({ action }: { action: string }) {
  return (
    <div className="border-warning/30 bg-warning-surface flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex gap-3">
        <span className="text-warning-text mt-0.5 shrink-0">
          <InfoIcon size={18} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-body text-warning-text font-semibold">Chưa cấu hình Supabase</p>
          <p className="text-caption text-warning-text">
            Ứng dụng đang chạy bằng dữ liệu mẫu nên chưa {action} được. Điền khoá Supabase vào{' '}
            <code>.env.local</code> rồi tải lại trang này.
          </p>
        </div>
      </div>

      <Link
        href="/onboarding"
        className="bg-forest-600 text-ink-inverse text-label flex min-h-12 items-center justify-center rounded-md px-6 font-semibold transition-colors duration-(--duration-fast)"
      >
        Tiếp tục với dữ liệu mẫu
      </Link>
    </div>
  )
}
