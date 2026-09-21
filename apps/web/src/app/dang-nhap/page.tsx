import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, CheckIcon, InfoIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'

import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
}

/**
 * Lời giải thích cho từng mã lỗi mà `/auth/callback` có thể trả về.
 *
 * Dùng mã chứ không truyền thẳng câu chữ qua URL: thông báo lỗi hiển thị cho người dùng
 * không được phép do URL quyết định.
 */
const SIGN_IN_ERRORS: Readonly<Record<string, string>> = {
  '': 'Không đăng nhập được. Bạn thử lại nhé.',
  'chua-cau-hinh': 'Chưa cấu hình Supabase nên chưa đăng nhập được.',
  'link-khong-dung':
    'Liên kết này không dùng được. Có thể liên kết đã hết hạn, hoặc đã được dùng rồi. Bạn yêu cầu một liên kết mới nhé.',
  'link-thieu-ma': 'Liên kết thiếu mã xác nhận. Bạn yêu cầu một liên kết mới nhé.',
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
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; loi?: string; xong?: string }>
}) {
  const { next, loi, xong } = await searchParams
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

      {xong === undefined ? null : (
        <div
          role="status"
          className="border-success/30 bg-success-surface flex items-start gap-3 rounded-lg border p-4"
        >
          <span className="text-success-text mt-0.5 shrink-0">
            <CheckIcon size={18} />
          </span>
          <p className="text-caption text-success-text">
            Đã xoá toàn bộ dữ liệu và tài khoản của bạn. Cảm ơn bạn đã dùng NutriBoost.
          </p>
        </div>
      )}

      {loi === undefined ? null : (
        <div
          role="alert"
          className="border-danger/30 bg-danger-surface flex items-start gap-3 rounded-lg border p-4"
        >
          <span className="text-danger-text mt-0.5 shrink-0">
            <InfoIcon size={18} />
          </span>
          <p className="text-caption text-danger-text">
            {SIGN_IN_ERRORS[loi] ?? SIGN_IN_ERRORS['']}
          </p>
        </div>
      )}

      {configured ? (
        <SignInForm {...(next === undefined ? {} : { next })} />
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
