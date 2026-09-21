import type { Metadata } from 'next'

import { AssistantShell } from '@/components/assistant/AssistantShell'

export const metadata: Metadata = {
  // Trang trong ứng dụng không cần được lập chỉ mục.
  robots: { index: false, follow: false },
}

/**
 * Khung ứng dụng đã đăng nhập.
 *
 * Cột nội dung tối đa 680px — cùng bề rộng với thanh hỏi của trợ lý
 * (docs/DESIGN-SYSTEM.md §7), để mắt không phải đổi trục khi panel mở ra.
 *
 * Toàn bộ khung nằm trong một thành phần phía client vì lớp trợ lý cần trạng thái
 * dùng chung; nội dung trang vẫn là server component và được truyền vào qua `children`.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AssistantShell>{children}</AssistantShell>
}
