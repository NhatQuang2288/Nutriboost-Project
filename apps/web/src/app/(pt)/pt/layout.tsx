import type { Metadata } from 'next'

import { AssistantShell } from '@/components/assistant/AssistantShell'
import { PtTabs } from '@/components/shell/PtTabs'

export const metadata: Metadata = {
  title: 'Console PT',
  robots: { index: false, follow: false },
}

/**
 * Khung console PT.
 *
 * Dùng chung lớp trợ lý với ứng dụng khách hàng — PT cũng cần hỏi Bơ ("khách này tuần rồi
 * thế nào?"). Nhưng điều hướng thì khác: tab ngang ở đầu trang thay vì thanh dưới, và cột
 * nội dung rộng hơn để chứa bảng biểu.
 */
export default function PtLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssistantShell nav={null} wide>
      <PtTabs />
      {children}
    </AssistantShell>
  )
}
