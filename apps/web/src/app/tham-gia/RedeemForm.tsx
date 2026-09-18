'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { CheckIcon, TicketIcon } from '@/components/icons'
import { redeemInviteAction } from '@/lib/actions/invites'

/**
 * Ô nhập mã mời.
 *
 * Chữ được đưa lên chữ hoa ngay khi gõ: mã chỉ có chữ hoa, và người dùng dán từ tin nhắn
 * hoặc gõ từ ảnh chụp màn hình rất hay để lẫn chữ thường. CSDL cũng tự chuẩn hoá, nhưng làm
 * ở đây thì người dùng **nhìn thấy** mã đúng trước khi bấm.
 */
export function RedeemForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const canSubmit = code.trim().length > 0 && !pending

  function submit(): void {
    if (!canSubmit) return

    const form = new FormData()
    form.set('code', code)

    startTransition(async () => {
      setResult(await redeemInviteAction(form))
    })
  }

  if (result?.ok === true) {
    return (
      <div className="flex flex-col gap-4">
        <div className="border-success/30 bg-success-surface text-success-text flex items-start gap-3 rounded-lg border p-4">
          <span className="mt-0.5 shrink-0">
            <CheckIcon size={18} />
          </span>
          <p className="text-body">{result.message}</p>
        </div>

        <Link
          href="/hom-nay"
          className="bg-forest-600 text-ink-inverse text-label flex min-h-12 w-full items-center justify-center rounded-md px-6 font-semibold transition-colors duration-(--duration-fast)"
        >
          Vào ứng dụng
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <label className="border-line bg-surface focus-within:border-forest-600 flex flex-col items-center gap-1 rounded-lg border px-4 py-4">
        <span className="text-caption text-ink-muted flex items-center gap-1.5">
          <TicketIcon size={14} />
          Mã mời
        </span>
        <input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            if (result?.ok === false) setResult(null)
          }}
          aria-label="Mã mời"
          placeholder="ABCD2345"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          className="text-h1 text-ink w-full bg-transparent text-center font-mono tracking-[0.3em] outline-none"
        />
      </label>

      {result === null ? null : (
        <p className="text-caption text-danger-text" role="alert">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-forest-600 text-ink-inverse text-label flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-6 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        {pending ? 'Đang kiểm tra…' : 'Xác nhận mã'}
      </button>
    </form>
  )
}
