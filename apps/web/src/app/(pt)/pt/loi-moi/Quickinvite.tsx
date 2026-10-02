'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * Mã mời nhanh: sinh ngay trên trình duyệt, không cần đăng nhập, không gọi Server Action.
 * Hai thẻ "Tạo lời mời" và "Chia sẻ" dùng chung một mã qua context này.
 */

type QuickInvite = { code: string; link: string }

type QuickInviteContextValue = {
  invite: QuickInvite | null
  /** Tạo mã mới và trả về nó. */
  generate: () => QuickInvite
  /** Trả về mã hiện có, chưa có thì tạo mới. */
  ensure: () => QuickInvite
}

const QuickInviteContext = createContext<QuickInviteContextValue | null>(null)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(length = 8): string {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

function buildInvite(code: string): QuickInvite {
  return { code, link: `${window.location.origin}/tham-gia?ma=${encodeURIComponent(code)}` }
}

/** Sao chép vào bộ nhớ tạm, có phương án dự phòng cho HTTP / trình duyệt chặn Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // rơi xuống phương án dự phòng
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function QuickInviteProvider({
  initial = null,
  children,
}: {
  /** Mã còn dùng được từ CSDL (nếu có), để thẻ "Chia sẻ" dùng luôn. */
  initial?: QuickInvite | null
  children: React.ReactNode
}) {
  const [invite, setInvite] = useState<QuickInvite | null>(initial)

  const generate = useCallback(() => {
    const next = buildInvite(randomCode())
    setInvite(next)
    return next
  }, [])

  const ensure = useCallback(() => invite ?? generate(), [invite, generate])

  const value = useMemo(() => ({ invite, generate, ensure }), [invite, generate, ensure])

  return <QuickInviteContext.Provider value={value}>{children}</QuickInviteContext.Provider>
}

export function useQuickInvite(): QuickInviteContextValue {
  const ctx = useContext(QuickInviteContext)
  if (ctx === null) throw new Error('useQuickInvite phải nằm trong <QuickInviteProvider>.')
  return ctx
}

/** Khung hiện mã + liên kết ngay dưới ba thẻ. */
export function QuickInviteResult() {
  const { invite } = useQuickInvite()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  if (invite === null) return null

  async function handleCopy(kind: 'code' | 'link', text: string) {
    if (await copyText(text)) {
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-3 rounded-[21px] border border-[#dcebc9] bg-white p-5"
    >
      <p className="text-[10px] font-bold tracking-[0.13em] text-[#819175] uppercase">
        MÃ MỜI CỦA BẠN
      </p>

      <p className="mt-1 font-mono text-[28px] font-extrabold tracking-[0.25em] text-[#1f402b]">
        {invite.code}
      </p>

      <p className="mt-2 text-[12px] break-all text-[#62745d]">{invite.link}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleCopy('code', invite.code)}
          className="min-h-10 rounded-md border border-[#dcebc9] bg-[#eef7e3] px-4 text-[13px] font-semibold text-[#3f6b2a]"
        >
          {copied === 'code' ? 'Đã sao chép mã' : 'Sao chép mã'}
        </button>
        <button
          type="button"
          onClick={() => void handleCopy('link', invite.link)}
          className="min-h-10 rounded-md border border-[#dcebc9] bg-[#eef7e3] px-4 text-[13px] font-semibold text-[#3f6b2a]"
        >
          {copied === 'link' ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}
        </button>
      </div>
    </div>
  )
}
