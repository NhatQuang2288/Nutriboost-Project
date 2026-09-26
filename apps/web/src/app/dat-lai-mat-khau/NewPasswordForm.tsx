'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AuthAlert, AuthButton, AuthField } from '@/components/auth'
import { validateNewPasswordForm, type FieldErrors } from '@/lib/auth/credentials'

type Field = 'password' | 'confirmPassword'

export function NewPasswordForm() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  function set(field: Field) {
    return (value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      if (errors[field] !== undefined) setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  async function submit(): Promise<void> {
    if (busy) return
    const found = validateNewPasswordForm(form)
    setErrors(found)
    if (Object.values(found).some((message) => message !== undefined)) return

    setBusy(true)
    setGlobalError(null)
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: form.password }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setGlobalError(payload.error ?? 'Không đổi được mật khẩu. Bạn thử lại nhé.')
      } else {
        setDone(true)
      }
    } catch {
      setGlobalError('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <AuthAlert tone="success">
          Đã đổi mật khẩu. Lần sau bạn đăng nhập bằng mật khẩu mới này nhé.
        </AuthAlert>
        <Link
          href="/hom-nay"
          className="bg-forest-600 text-ink-inverse hover:bg-forest-700 flex min-h-13 items-center justify-center rounded-lg px-6 text-base font-bold transition-colors duration-(--duration-fast)"
        >
          Vào NutriBoost
        </Link>
      </div>
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
      {globalError === null ? null : <AuthAlert tone="error">{globalError}</AuthAlert>}

      <AuthField
        id="mat-khau-moi"
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        placeholder="Tối thiểu 8 ký tự"
        value={form.password}
        onChange={set('password')}
        error={errors.password}
      />

      <AuthField
        id="nhap-lai-mat-khau"
        label="Nhập lại mật khẩu mới"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        error={errors.confirmPassword}
      />

      <AuthButton loading={busy} loadingLabel="Đang lưu…">
        Lưu mật khẩu mới
      </AuthButton>
    </form>
  )
}
