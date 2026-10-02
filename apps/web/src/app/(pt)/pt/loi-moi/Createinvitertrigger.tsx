'use client'

import { useState } from 'react'

import { copyText, useQuickInvite } from './Quickinvite'

/**
 * Bọc quanh thẻ "Tạo lời mời": bấm vào thẻ thì hiện ngay một mã mới (và tự sao chép liên kết).
 * Không cần đăng nhập, không gọi Server Action. Giao diện thẻ do `StepCard` vẽ, truyền qua `children`.
 */
export function CreateInviteTrigger({ children }: { children: React.ReactNode }) {
  const { generate } = useQuickInvite()
  const [message, setMessage] = useState<string | null>(null)

  async function create() {
    const invite = generate()
    const copied = await copyText(invite.link)
    setMessage(
      copied ? `Đã tạo mã ${invite.code} và sao chép liên kết.` : `Đã tạo mã ${invite.code}.`,
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => void create()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            void create()
          }
        }}
        className="flex-1 cursor-pointer [&>div]:h-full"
      >
        {children}
      </div>

      <div role="status" aria-live="polite">
        {message !== null && <p className="text-[12px] text-[#3f6b2a]">{message}</p>}
      </div>
    </div>
  )
}
