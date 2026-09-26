import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata, Route } from 'next'

import { AuthCard, AuthLayout, AuthSwitch, NotConfiguredNotice } from '@/components/auth'

import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Đăng ký',
  robots: { index: false, follow: false },
}

/**
 * Đăng ký tài khoản bằng email + mật khẩu.
 *
 * `next` mang từ màn đăng nhập sang. Khách mở liên kết mời `/tham-gia?ma=…` khi chưa có tài
 * khoản thì mã được điền sẵn vào ô "Mã mời của PT", để không phải gõ lại.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const configured = isSupabaseConfigured()
  const inviteCode = inviteCodeFrom(next)
  const signInHref = (
    next === undefined ? '/dang-nhap' : `/dang-nhap?next=${encodeURIComponent(next)}`
  ) as Route

  return (
    <AuthLayout>
      <AuthCard
        centered
        eyebrow="Tham gia cùng NutriBoost"
        title="Tạo tài khoản"
        subtitle={configured ? 'Bạn tham gia với vai trò nào?' : undefined}
      >
        {configured ? (
          <>
            <SignUpForm
              {...(next === undefined ? {} : { next })}
              {...(inviteCode === undefined ? {} : { initialInviteCode: inviteCode })}
            />
            <AuthSwitch prompt="Đã có tài khoản?" href={signInHref} label="Đăng nhập" />
          </>
        ) : (
          <NotConfiguredNotice action="tạo tài khoản" />
        )}
      </AuthCard>
    </AuthLayout>
  )
}

/** Lấy mã mời khỏi `next` dạng `/tham-gia?ma=ABCD2345`. Không phải thì bỏ qua. */
function inviteCodeFrom(next: string | undefined): string | undefined {
  if (next === undefined || !next.startsWith('/tham-gia')) return undefined
  const code = new URLSearchParams(next.split('?')[1] ?? '').get('ma')
  return code === null || code.length === 0 ? undefined : code
}
