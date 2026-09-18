import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, InfoIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'

import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
}

/**
 * Đăng nhập — nằm ngoài nhóm `(app)` nên không có thanh điều hướng và lớp trợ lý.
 *
 * Màn này có hai nhánh thật, không phải giả lập:
 *   • Supabase đã cấu hình → hiện form magic link.
 *   • Chưa cấu hình → nói thẳng là chưa gửi được liên kết, và cho vào chế độ dữ liệu mẫu.
 *
 * Nhánh thứ hai tồn tại có chủ ý: cả đội phải dựng và kiểm thử được sản phẩm trước khi
 * có tài khoản Supabase.
 */
export default function SignInPage() {
  const configured = isSupabaseConfigured()

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-[var(--width-content)] flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-forest-600 flex size-14 items-center justify-center rounded-full bg-olive-100">
          <BoIcon size={30} />
        </span>
        <h1 className="text-h1">
          <span className="text-forest-600">Nutri</span>
          <span className="text-olive-500">boost</span>
        </h1>
        <p className="text-body text-ink-muted">Đăng nhập để Bơ nhớ hồ sơ và nhật ký của bạn.</p>
      </header>

      {configured ? (
        <SignInForm />
      ) : (
        <div className="border-warning/30 bg-warning-surface flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex gap-3">
            <span className="text-warning-text mt-0.5 shrink-0">
              <InfoIcon size={18} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-body text-warning-text font-semibold">Chưa cấu hình Supabase</p>
              <p className="text-caption text-warning-text">
                Ứng dụng đang chạy bằng dữ liệu mẫu nên chưa gửi được liên kết đăng nhập. Điền khoá
                Supabase vào <code>.env.local</code> rồi tải lại trang này.
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
      )}

      {configured ? (
        <p className="text-caption text-ink-faint text-center">
          Chưa có tài khoản? Cứ nhập email, hệ thống tự tạo cho bạn.
        </p>
      ) : null}

      <Disclaimer />
    </main>
  )
}
