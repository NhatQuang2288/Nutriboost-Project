import type { Metadata } from 'next'

import { AssistantShell } from '@/components/assistant/AssistantShell'
import { ClientSidebar } from '@/components/shell/ClientSidebar'

/**
 * Màn đã làm lại theo bố cục nhiều cột của console PT, nên cần cột nội dung rộng. Các màn khác
 * vẫn là một cột 680px cho tới khi được làm lại — thêm vào đây khi làm xong từng màn.
 */
const WIDE_ROUTES = ['/hom-nay'] as const

export const metadata: Metadata = {
  // Trang trong ứng dụng không cần được lập chỉ mục.
  robots: { index: false, follow: false },
}

/**
 * Khung ứng dụng đã đăng nhập — cùng bố cục với console PT: sidebar trái ở màn hình lớn, thanh
 * điều hướng dưới ở màn hình nhỏ.
 *
 * Cột nội dung mặc định tối đa 680px — cùng bề rộng với thanh hỏi của trợ lý
 * (docs/DESIGN-SYSTEM.md §7). Màn trong `WIDE_ROUTES` được rộng hơn để chia nhiều cột.
 *
 * Toàn bộ khung nằm trong một thành phần phía client vì lớp trợ lý cần trạng thái
 * dùng chung; nội dung trang vẫn là server component và được truyền vào qua `children`.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssistantShell wide={WIDE_ROUTES} sidebar={<ClientSidebar />}>
      {children}
    </AssistantShell>
  )
}
