import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthAlert, AuthCard, AuthLayout, NotConfiguredNotice } from '@/components/auth'
import { getSessionUser } from '@/lib/supabase/server'

import { NewPasswordForm } from './NewPasswordForm'

export const metadata: Metadata = {
  title: 'Đặt mật khẩu mới',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Đặt mật khẩu mới. Người dùng tới đây từ liên kết "quên mật khẩu" — `/auth/callback` đã đổi
 * mã trong liên kết thành phiên trước khi đưa sang.
 *
 * Không nằm trong danh sách route bảo vệ: chưa có phiên thì middleware sẽ đẩy về màn đăng
 * nhập, trong khi điều người dùng cần biết là **liên kết đã hết hạn** và phải xin lại.
 */
export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout>
        <AuthCard eyebrow="Khôi phục tài khoản" title="Đặt mật khẩu mới">
          <NotConfiguredNotice action="đổi mật khẩu" />
        </AuthCard>
      </AuthLayout>
    )
  }

  const user = await getSessionUser()

  return (
    <AuthLayout>
      <AuthCard
        eyebrow="Khôi phục tài khoản"
        title="Đặt mật khẩu mới"
        subtitle={
          user?.email === null || user === null
            ? undefined
            : `Mật khẩu mới cho tài khoản ${user.email}.`
        }
      >
        {user === null ? (
          <div className="flex flex-col gap-5">
            <AuthAlert tone="error">
              Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được dùng rồi. Bạn xin một liên kết mới
              nhé.
            </AuthAlert>
            <Link
              href="/quen-mat-khau"
              className="bg-forest-600 text-ink-inverse hover:bg-forest-700 flex min-h-13 items-center justify-center rounded-lg px-6 text-base font-bold transition-colors duration-(--duration-fast)"
            >
              Xin liên kết mới
            </Link>
          </div>
        ) : (
          <NewPasswordForm />
        )}
      </AuthCard>
    </AuthLayout>
  )
}
