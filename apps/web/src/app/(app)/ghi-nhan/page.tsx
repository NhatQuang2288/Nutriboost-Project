import type { Metadata } from 'next'

import { CameraIcon, HistoryIcon, MicIcon, RepeatIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'

export const metadata: Metadata = { title: 'Ghi bữa ăn' }
export const dynamic = 'force-dynamic'

/**
 * Màn ghi nhận bữa ăn.
 *
 * Mục tiêu của màn này là **≤ 2 lần chạm** để ghi xong một bữa:
 * gõ một câu, rồi xác nhận thẻ do trợ lý dựng ra.
 *
 * Ô nhập tự do và thẻ xác nhận thuộc lớp trợ lý (xem docs/ASSISTANT-UX.md).
 * Phần dưới đây là các lối vào nhanh bổ trợ.
 */
export default function LogMealPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Ghi bữa ăn</h1>
        <p className="text-caption text-ink-muted">
          Kể bằng một câu là đủ. Ví dụ: “sáng nay tôi ăn phở bò và một ly cà phê sữa”.
        </p>
      </header>

      <Card>
        <SectionTitle>Lối vào nhanh</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction icon={<RepeatIcon size={20} />} label="Lặp bữa hôm qua" />
          <QuickAction icon={<HistoryIcon size={20} />} label="Món hay ăn" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 opacity-50">
          <QuickAction icon={<CameraIcon size={20} />} label="Chụp ảnh (sắp có)" disabled />
          <QuickAction icon={<MicIcon size={20} />} label="Nói (sắp có)" disabled />
        </div>
        <p className="text-caption text-ink-faint mt-3">
          Chụp ảnh và nhập bằng giọng nói nằm trong Release 2.
        </p>
      </Card>

      <Disclaimer />
    </div>
  )
}

function QuickAction({
  icon,
  label,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="touch-target border-line bg-surface-sunken flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors duration-(--duration-fast) disabled:cursor-not-allowed"
    >
      <span className="text-forest-600">{icon}</span>
      <span className="text-caption text-ink">{label}</span>
    </button>
  )
}
