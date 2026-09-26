'use client'

import { useState } from 'react'

import { AuthAlert, AuthButton, AuthField } from '@/components/auth'

/**
 * Xin liên kết đặt lại mật khẩu.
 *
 * Câu báo thành công cố ý viết "nếu email này có tài khoản": máy chủ trả thành công cho mọi
 * email để không ai dò được email nào đã đăng ký, nên giao diện cũng không được khẳng định.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function submit(): Promise<void> {
    if (busy) return
    if (!valid) {
      setError('Email không hợp lệ.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(payload.error ?? 'Không gửi được liên kết. Bạn thử lại nhé.')
        setBusy(false)
        return
      }

      setSentTo(email.trim())
    } catch {
      setError('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
    }
    setBusy(false)
  }

  if (sentTo !== null) {
    return (
      <AuthAlert tone="success">
        <p className="font-semibold">Kiểm tra hộp thư của bạn</p>
        <p className="mt-1">
          Nếu <strong>{sentTo}</strong> có tài khoản NutriBoost, Bơ đã gửi liên kết đặt lại mật khẩu
          tới đó. Liên kết dùng được trong một giờ. Không thấy thư thì bạn xem thêm mục Spam nhé.
        </p>
      </AuthAlert>
    )
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
      {error === null ? null : <AuthAlert tone="error">{error}</AuthAlert>}

      <AuthField
        id="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="email@example.com"
        value={email}
        onChange={(value) => {
          setEmail(value)
          setError(null)
        }}
      />

      <AuthButton loading={busy} loadingLabel="Đang gửi…">
        Gửi liên kết đặt lại
      </AuthButton>
    </form>
  )
}
