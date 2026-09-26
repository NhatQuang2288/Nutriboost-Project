import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata, Route } from 'next'

import { AuthAlert, AuthCard, AuthLayout, AuthSwitch, NotConfiguredNotice } from '@/components/auth'

import { SignInPanel } from './SignInPanel'

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
 * Hai nhánh thật, không phải giả lập:
 *   • Supabase đã cấu hình → form email + mật khẩu, kèm lối phụ đăng nhập bằng liên kết.
 *   • Chưa cấu hình → nói thẳng là chưa đăng nhập được, và cho vào chế độ dữ liệu mẫu.
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
  const signUpHref = (
    next === undefined ? '/dang-ky' : `/dang-ky?next=${encodeURIComponent(next)}`
  ) as Route

  return (
    <AuthLayout>
      {xong === undefined ? null : (
        <AuthAlert tone="success">
          Đã xoá toàn bộ dữ liệu và tài khoản của bạn. Cảm ơn bạn đã dùng NutriBoost.
        </AuthAlert>
      )}

      {loi === undefined ? null : (
        <AuthAlert tone="error">{SIGN_IN_ERRORS[loi] ?? SIGN_IN_ERRORS['']}</AuthAlert>
      )}

      <AuthCard
        eyebrow="Chào mừng trở lại"
        title="Đăng nhập"
        subtitle="Tiếp tục hành trình ăn uống lành mạnh cùng Bơ."
      >
        {configured ? (
          <>
            <SignInPanel {...(next === undefined ? {} : { next })} />
            <AuthSwitch prompt="Chưa có tài khoản?" href={signUpHref} label="Đăng ký ngay" />
          </>
        ) : (
          <NotConfiguredNotice action="đăng nhập" />
        )}
      </AuthCard>
    </AuthLayout>
  )
}
