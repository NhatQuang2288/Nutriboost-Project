import type { Metadata } from 'next'

import { safeNextPath } from '@/lib/auth/redirect'

import { OnboardingFlow } from './OnboardingFlow'

export const metadata: Metadata = {
  title: 'Thiết lập hồ sơ',
  robots: { index: false, follow: false },
}

/**
 * Onboarding — nằm NGOÀI nhóm `(app)` để không có thanh điều hướng và lớp trợ lý.
 * Đây là luồng tập trung: năm câu hỏi, mỗi lần một câu, không có gì gây nhiễu.
 *
 * `tiep` là nơi cần tới sau khi xong. `/auth/callback` đặt nó khi người dùng vừa đăng nhập
 * lần đầu qua một liên kết sâu — quan trọng nhất là liên kết mời khách
 * `/tham-gia?ma=…`: không giữ lại thì mã mời rơi mất giữa luồng.
 *
 * Lọc qua `safeNextPath` vì đây là tham số đến từ URL.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tiep?: string }>
}) {
  const { tiep } = await searchParams
  const next = tiep === undefined ? undefined : safeNextPath(tiep)

  return <OnboardingFlow {...(next === undefined ? {} : { next })} />
}
