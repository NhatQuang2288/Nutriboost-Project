'use client'

import { useState } from 'react'

import { AuthAlert, AuthButton, AuthField } from '@/components/auth'

/**
 * Đăng nhập bằng liên kết gửi qua email (magic link) — lối phụ của màn đăng nhập.
 *
 * Giữ lại vì tài khoản tạo trước khi có mật khẩu chưa có mật khẩu nào, và vì
 * `npm run check:live:ui` kiểm luồng đăng nhập thật qua đường này.
 */
export function MagicLinkForm({ next }: { next?: string }) {
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
        body: JSON.stringify(next === undefined ? { email } : { email, next }),
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
    return <AuthAlert tone="success">{message}</AuthAlert>
  }

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {status === 'error' && message !== null ? (
        <AuthAlert tone="error">{message}</AuthAlert>
      ) : null}

      <AuthField
        id="email-lien-ket"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="email@example.com"
        value={email}
        onChange={(value) => {
          setEmail(value)
          if (status === 'error') setStatus('idle')
        }}
        description="Bơ gửi một liên kết, bấm vào là đăng nhập — không cần mật khẩu."
      />

      <AuthButton loading={busy} disabled={!valid} loadingLabel="Đang gửi…">
        Gửi liên kết đăng nhập
      </AuthButton>
    </form>
  )
}
