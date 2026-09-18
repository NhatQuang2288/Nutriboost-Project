import type { Metadata } from 'next'

import { CalendarIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState, SectionTitle } from '@/components/ui'

export const metadata: Metadata = { title: 'Kế hoạch' }
export const dynamic = 'force-dynamic'

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Kế hoạch tuần</h1>
        <p className="text-caption text-ink-muted">Bơ dựng kế hoạch 7 ngày từ hồ sơ của bạn.</p>
      </header>

      <EmptyState
        icon={<CalendarIcon size={32} />}
        title="Tuần này chưa có kế hoạch"
        description="Bơ sẽ dựng thực đơn 7 ngày dựa trên mục tiêu calo và khẩu vị của bạn. Bạn duyệt bằng một lần chạm."
      />

      <Card>
        <SectionTitle>Bơ cần gì để dựng kế hoạch</SectionTitle>
        <ul className="text-body text-ink-muted flex flex-col gap-2">
          <li>· Mục tiêu calo và đa lượng — đã có</li>
          <li>· Món bạn không ăn hoặc dị ứng — cập nhật ở mục “Tôi”</li>
          <li>· Số bữa mỗi ngày — mặc định 3 bữa chính và 1 bữa phụ</li>
        </ul>
      </Card>

      <Disclaimer />
    </div>
  )
}
