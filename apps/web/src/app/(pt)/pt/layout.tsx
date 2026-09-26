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
 * Sidebar PT được truyền riêng vào AssistantShell.
 * Nội dung từng trang PT sẽ nằm ở khu vực chính bên phải.
 */
export default function PtLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssistantShell nav={null} wide sidebar={<PtTabs />}>
      {children}
    </AssistantShell>
  )
}
