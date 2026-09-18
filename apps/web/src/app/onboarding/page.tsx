import type { Metadata } from 'next'

import { OnboardingFlow } from './OnboardingFlow'

export const metadata: Metadata = {
  title: 'Thiết lập hồ sơ',
  robots: { index: false, follow: false },
}

/**
 * Onboarding — nằm NGOÀI nhóm `(app)` để không có thanh điều hướng và lớp trợ lý.
 * Đây là luồng tập trung: năm câu hỏi, mỗi lần một câu, không có gì gây nhiễu.
 */
export default function OnboardingPage() {
  return <OnboardingFlow />
}
