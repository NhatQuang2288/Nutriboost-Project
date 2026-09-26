import type { Metadata } from 'next'

import { BoIcon, ChatIcon, HistoryIcon, SearchIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState, SectionTitle } from '@/components/ui'

export const metadata: Metadata = { title: 'Trợ lý Bơ' }
export const dynamic = 'force-dynamic'

/**
 * Quản lý nhiều đoạn hội thoại với trợ lý Bơ.
 *
 * Bản thân khung chat nằm ở lớp trợ lý ba tầng (`docs/ASSISTANT-UX.md`) và luôn
 * được mount trong khung ứng dụng — không phải một tab riêng. Màn này chỉ liệt kê
 * và quản lý các đoạn hội thoại đã có.
 */
export default function CoachPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Trợ lý Bơ</h1>
          <p className="text-caption text-ink-muted">
            Hỏi bất cứ lúc nào, hoặc để Bơ tự nhắc khi cần.
          </p>
        </div>
        <span className="text-forest-600 flex size-11 items-center justify-center rounded-full bg-olive-100">
          <BoIcon size={26} />
        </span>
      </header>

      <EmptyState
        icon={<ChatIcon size={32} />}
        title="Chưa có đoạn hội thoại nào"
        description="Mở thanh hỏi ở đáy màn hình, gõ một câu rồi Enter — Bơ sẽ mở panel bên phải và trả lời ngay."
      />

      <Card>
        <SectionTitle>Bơ có thể giúp gì</SectionTitle>
        <ul className="text-body text-ink-muted flex flex-col gap-2.5">
          <li>· Ghi bữa ăn: “trưa nay tôi ăn cơm tấm sườn”</li>
          <li>· Giải thích con số: “vì sao mục tiêu của tôi là 2 010 kcal?”</li>
          <li>· Đổi món trong kế hoạch: “đổi món tối thứ tư sang món ít béo hơn”</li>
          <li>· Xem tiến độ: “tuần này tôi có đều không?”</li>
        </ul>
      </Card>

      <Card>
        <SectionTitle>Quản lý hội thoại</SectionTitle>
        <div className="flex flex-col gap-2">
          <Feature icon={<HistoryIcon size={18} />} label="Xem lại và đổi tên hội thoại cũ" />
          <Feature icon={<SearchIcon size={18} />} label="Tìm trong lịch sử trò chuyện" />
          <Feature icon={<ChatIcon size={18} />} label="Bắt đầu hội thoại mới" />
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-body text-ink-muted flex items-center gap-3">
      <span className="text-ink-faint">{icon}</span>
      {label}
    </div>
  )
}
