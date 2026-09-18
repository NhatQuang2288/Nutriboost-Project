'use client'

import { useState } from 'react'

import { CheckIcon, EditIcon, InfoIcon } from '@/components/icons'

/**
 * Nút duyệt thực đơn.
 *
 * Chưa nối cơ sở dữ liệu nên hành động không lưu được. Thay vì để nút bấm im lặng không
 * làm gì, hoặc giả vờ đã lưu, màn này nói thẳng lý do — cùng cách xử lý với màn đăng nhập.
 * Khi nối Supabase, chỉ cần thay phần thân của hai hàm bên dưới bằng lời gọi thật.
 */
export function ApprovalActions({ clientName }: { clientName: string }) {
  const [notice, setNotice] = useState<string | null>(null)

  const handle = (action: 'approve' | 'revise'): void => {
    setNotice(
      action === 'approve'
        ? `Chưa nối cơ sở dữ liệu nên chưa lưu được quyết định duyệt thực đơn cho ${clientName}.`
        : `Chưa nối cơ sở dữ liệu nên chưa gửi được yêu cầu chỉnh lại cho ${clientName}.`,
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handle('approve')}
          className="bg-forest-600 text-ink-inverse text-label flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-5 font-semibold transition-colors duration-(--duration-fast)"
        >
          <CheckIcon size={16} />
          Duyệt thực đơn
        </button>
        <button
          type="button"
          onClick={() => handle('revise')}
          className="border-line bg-surface text-ink text-label flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-5 font-semibold transition-colors duration-(--duration-fast)"
        >
          <EditIcon size={16} />
          Yêu cầu chỉnh lại
        </button>
      </div>

      {notice === null ? null : (
        <p
          role="status"
          className="border-warning/30 bg-warning-surface text-warning-text text-caption flex items-start gap-2 rounded-lg border px-3 py-2"
        >
          <InfoIcon size={14} className="mt-0.5 shrink-0" />
          {notice}
        </p>
      )}
    </div>
  )
}
