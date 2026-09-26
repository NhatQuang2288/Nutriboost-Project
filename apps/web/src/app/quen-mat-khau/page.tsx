import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata } from 'next'

import { AuthCard, AuthLayout, AuthSwitch, NotConfiguredNotice } from '@/components/auth'

import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  robots: { index: false, follow: false },
}

// Đọc cấu hình Supabase lúc chạy, không đóng băng trạng thái của lúc build vào trang tĩnh.
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured()

  return (
    <AuthLayout>
      <AuthCard
        eyebrow="Khôi phục tài khoản"
        title="Quên mật khẩu?"
        subtitle="Nhập email của bạn, Bơ gửi liên kết để đặt mật khẩu mới."
      >
        {configured ? <ForgotPasswordForm /> : <NotConfiguredNotice action="gửi liên kết" />}
        <AuthSwitch prompt="Nhớ ra rồi?" href="/dang-nhap" label="Quay lại đăng nhập" />
      </AuthCard>
    </AuthLayout>
  )
}
