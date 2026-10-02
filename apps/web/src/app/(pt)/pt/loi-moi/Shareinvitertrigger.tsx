'use client'

import { useState } from 'react'

import { copyText, useQuickInvite } from './Quickinvite'

/**
 * Bọc quanh thẻ "Chia sẻ": bấm vào thẻ thì hiện mã hiện có và sao chép liên kết.
 * Nếu chưa có mã nào, tạo luôn một mã mới. Không cần đăng nhập.
 */
export function ShareInviteTrigger({ children }: { children: React.ReactNode }) {
  const { ensure } = useQuickInvite()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function share() {
    const invite = ensure()
    const copied = await copyText(invite.link)
    setMessage(
      copied
        ? { ok: true, text: 'Đã sao chép liên kết mời. Gửi cho khách nhé.' }
        : {
            ok: false,
            text: 'Trình duyệt chặn việc sao chép. Bạn chép thủ công ở khung bên dưới nhé.',
          },
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => void share()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            void share()
          }
        }}
        className="flex-1 cursor-pointer [&>div]:h-full"
      >
        {children}
      </div>

      <div role="status" aria-live="polite">
        {message !== null && (
          <p className={`text-[12px] ${message.ok ? 'text-[#3f6b2a]' : 'text-red-700'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
