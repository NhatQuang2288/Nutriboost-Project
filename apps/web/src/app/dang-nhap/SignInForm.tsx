'use client'

import { useState } from 'react'

import { CheckIcon, SendIcon } from '@/components/icons'

/**
 * Form đăng nhập bằng magic link.
 *
 * Một ô nhập, một nút. Không mật khẩu, không bước xác nhận thứ hai — đúng nguyên tắc
 * "hạn chế thao tác cho người dùng".
 */
export function SignInForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const busy = status === 'sending'

  async function submit(): Promise<void> {
    if (!valid || busy) return
    setStatus('sending')
    setMessage(null)

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setStatus('error')
        setMessage(payload.error ?? 'Không gửi được liên kết đăng nhập.')
        return
      }

      setStatus('sent')
      setMessage(`Mình đã gửi liên kết đăng nhập tới ${email}. Bạn mở hộp thư nhé.`)
    } catch {
      setStatus('error')
      setMessage('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-olive-200 bg-olive-50 p-4">
        <span className="text-accent-text mt-0.5 shrink-0">
          <CheckIcon size={18} />
        </span>
        <p className="text-body text-ink">{message}</p>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <label className="border-line bg-surface focus-within:border-forest-600 flex flex-col gap-1 rounded-lg border px-4 py-3">
        <span className="text-caption text-ink-muted">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          aria-label="Email"
          placeholder="ban@example.com"
          onChange={(event) => {
            setEmail(event.target.value)
            if (status === 'error') setStatus('idle')
          }}
          className="text-body text-ink w-full bg-transparent outline-none"
        />
      </label>

      {message === null ? null : (
        <p className="text-caption text-danger-text" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || busy}
        className="bg-forest-600 text-ink-inverse text-label flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-6 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        <SendIcon size={18} />
        {busy ? 'Đang gửi…' : 'Gửi liên kết đăng nhập'}
      </button>
    </form>
  )
}
