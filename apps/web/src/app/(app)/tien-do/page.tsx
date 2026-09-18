import type { Metadata } from 'next'

import { ChartIcon, ScaleIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState, SectionTitle, Skeleton } from '@/components/ui'

export const metadata: Metadata = { title: 'Tiến độ' }
export const dynamic = 'force-dynamic'

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Tiến độ</h1>
        <p className="text-caption text-ink-muted">Cân nặng và năng lượng theo thời gian.</p>
      </header>

      <EmptyState
        icon={<ChartIcon size={32} />}
        title="Chưa đủ dữ liệu để vẽ biểu đồ"
        description="Cần ít nhất 3 ngày ghi nhật ký. Ghi đều mỗi ngày để thấy xu hướng thật thay vì dao động của một ngày."
      />

      <Card>
        <SectionTitle
          action={
            <span className="text-caption text-ink-faint flex items-center gap-1">
              <ScaleIcon size={14} /> 7 ngày
            </span>
          }
        >
          Cân nặng
        </SectionTitle>
        {/* Trạng thái đang tải phải có hình dạng tương đương nội dung thật. */}
        <div className="flex items-end gap-2" aria-hidden="true">
          <Skeleton className="h-16 flex-1" />
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-20 flex-1" />
          <Skeleton className="h-28 flex-1" />
        </div>
        <p className="sr-only">Đang tải dữ liệu cân nặng.</p>
      </Card>

      <Card>
        <SectionTitle>Năng lượng nạp vào</SectionTitle>
        <div className="flex items-end gap-2" aria-hidden="true">
          <Skeleton className="h-20 flex-1" />
          <Skeleton className="h-28 flex-1" />
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-32 flex-1" />
          <Skeleton className="h-16 flex-1" />
        </div>
        <p className="sr-only">Đang tải dữ liệu năng lượng.</p>
      </Card>

      <Disclaimer />
    </div>
  )
}
