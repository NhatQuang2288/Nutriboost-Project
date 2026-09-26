'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AuthAlert, AuthButton, AuthField } from '@/components/auth'
import { MailIcon } from '@/components/icons'

import { MagicLinkForm } from './MagicLinkForm'

/**
 * Màn đăng nhập: email + mật khẩu là đường chính, liên kết qua email là lối phụ.
 */
export function SignInPanel({ next }: { next?: string }) {
  const [method, setMethod] = useState<'password' | 'magic'>('password')

  return (
    <div className="flex flex-col gap-6">
      {method === 'password' ? <PasswordForm next={next} /> : <MagicLinkForm next={next} />}

      <div className="text-ink-faint flex items-center gap-3 text-sm" aria-hidden="true">
        <span className="bg-line h-px flex-1" />
        hoặc
        <span className="bg-line h-px flex-1" />
      </div>

      <button
        type="button"
        onClick={() => setMethod(method === 'password' ? 'magic' : 'password')}
        className="border-line-strong text-ink hover:bg-surface-sunken flex min-h-12 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition-colors duration-(--duration-fast)"
      >
        {method === 'password' ? (
          <>
            <MailIcon size={16} />
            Đăng nhập bằng liên kết qua email
          </>
        ) : (
          'Đăng nhập bằng mật khẩu'
        )}
      </button>
    </div>
  )
}

function PasswordForm({ next }: { next: string | undefined }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    if (busy) return
    if (email.trim().length === 0 || password.length === 0) {
      setError('Bạn nhập đủ email và mật khẩu nhé.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next === undefined ? { email, password } : { email, password, next }),
      })
      const payload = (await response.json()) as { redirectTo?: string; error?: string }

      if (!response.ok || payload.redirectTo === undefined) {
        setError(payload.error ?? 'Không đăng nhập được. Bạn thử lại nhé.')
        setBusy(false)
        return
      }

      // Tải lại hẳn trang đích để Server Component đọc cookie phiên vừa được ghi.
      window.location.assign(payload.redirectTo)
    } catch {
      setError('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
      setBusy(false)
    }
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
        onChange={setEmail}
      />

      <div className="flex flex-col gap-2">
        <AuthField
          id="mat-khau"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
        />
        <Link
          href="/quen-mat-khau"
          className="text-ink-muted self-end text-sm transition-colors hover:text-olive-600"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <AuthButton loading={busy}>Đăng nhập</AuthButton>
    </form>
  )
}
