'use client'

import { useState } from 'react'

import { AuthAlert, AuthButton, AuthField } from '@/components/auth'
import { validateSignUpForm, type FieldErrors, type SignUpIntent } from '@/lib/auth/credentials'

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword'

/**
 * Form đăng ký, chuyển từ `Register.jsx` của bản thử Vite.
 *
 * Khác bản gốc:
 *   • "Username" thành "Tên của bạn" — Supabase Auth đăng nhập bằng email, còn tên là thứ Bơ
 *     dùng để chào ("Chào Minh").
 *   • "Mã phòng" thành "Mã mời của PT" và **không bắt buộc** — khách vẫn tự dùng NutriBoost
 *     mà không cần PT. Mã được đổi ở `/tham-gia`, không phải ở đây.
 *   • Chọn "Personal Trainer" **không cấp quyền PT** — xem ghi chú ở `/api/auth/sign-up`.
 */
export function SignUpForm({
  next,
  initialInviteCode,
}: {
  next?: string
  initialInviteCode?: string
}) {
  const [intent, setIntent] = useState<SignUpIntent>('client')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: initialInviteCode ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  function set(field: keyof typeof form) {
    return (value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      if (field !== 'inviteCode' && errors[field] !== undefined) {
        setErrors((current) => ({ ...current, [field]: undefined }))
      }
    }
  }

  async function submit(): Promise<void> {
    if (busy) return
    const found = validateSignUpForm(form)
    setErrors(found)
    if (Object.values(found).some((message) => message !== undefined)) return

    setBusy(true)
    setGlobalError(null)
    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          intent,
          ...(intent === 'client' && form.inviteCode.trim().length > 0
            ? { inviteCode: form.inviteCode.trim() }
            : {}),
          ...(next === undefined ? {} : { next }),
        }),
      })
      const payload = (await response.json()) as {
        redirectTo?: string
        needsConfirmation?: boolean
        error?: string
      }

      if (!response.ok) {
        setGlobalError(payload.error ?? 'Không tạo được tài khoản. Bạn thử lại nhé.')
        setBusy(false)
        return
      }

      if (payload.redirectTo !== undefined) {
        window.location.assign(payload.redirectTo)
        return
      }

      setConfirmationSentTo(form.email.trim())
      setBusy(false)
    } catch {
      setGlobalError('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
      setBusy(false)
    }
  }

  if (confirmationSentTo !== null) {
    return (
      <AuthAlert tone="success">
        <p className="font-semibold">Còn một bước nữa: xác nhận email</p>
        <p className="mt-1">
          Bơ đã gửi liên kết xác nhận tới <strong>{confirmationSentTo}</strong>. Bạn mở hộp thư và
          bấm vào liên kết, tài khoản sẽ được kích hoạt và bạn vào thẳng NutriBoost.
        </p>
      </AuthAlert>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <IntentSwitch intent={intent} onChange={setIntent} />

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
          id="ho-ten"
          label="Tên của bạn"
          autoComplete="name"
          placeholder="Minh"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          description="Bơ chỉ dùng email này để bạn đăng nhập và nhận thông báo về tài khoản."
        />

        <AuthField
          id="mat-khau"
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />

        <AuthField
          id="nhap-lai-mat-khau"
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
        />

        {intent === 'client' ? (
          <AuthField
            id="ma-moi"
            label="Mã mời của PT"
            required={false}
            autoComplete="off"
            placeholder="ABCD2345"
            value={form.inviteCode}
            onChange={set('inviteCode')}
            description="Có PT hướng dẫn thì nhập mã PT gửi bạn. Không có thì bỏ trống, bạn vẫn dùng NutriBoost bình thường."
          />
        ) : (
          <AuthAlert tone="info">
            Tài khoản PT được mở sau khi gói dịch vụ được xác nhận thanh toán. Tạo tài khoản xong,
            bạn xem được ba gói và thử console PT với dữ liệu mẫu.
          </AuthAlert>
        )}

        <div className="mt-1">
          <AuthButton loading={busy} loadingLabel="Đang tạo tài khoản…">
            {intent === 'pt' ? 'Tạo tài khoản PT' : 'Tạo tài khoản'}
          </AuthButton>
        </div>
      </form>
    </div>
  )
}

/** Công tắc hai lựa chọn, nền trượt theo lựa chọn — giữ đúng dáng `RoleSwitch` của bản gốc. */
function IntentSwitch({
  intent,
  onChange,
}: {
  intent: SignUpIntent
  onChange: (intent: SignUpIntent) => void
}) {
  const options: readonly { value: SignUpIntent; label: string }[] = [
    { value: 'client', label: 'Thành viên tập' },
    { value: 'pt', label: 'Personal Trainer' },
  ]

  return (
    <div
      role="radiogroup"
      aria-label="Bạn tham gia với vai trò nào?"
      className="border-line-strong bg-surface relative grid grid-cols-2 rounded-xl border p-1"
    >
      <span
        aria-hidden="true"
        className={[
          'bg-forest-600 absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-[0_4px_12px_rgb(50_75_46/0.25)]',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          intent === 'pt' ? 'translate-x-full' : 'translate-x-0',
        ].join(' ')}
      />
      {options.map((option) => {
        const selected = option.value === intent
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative z-10 rounded-lg py-3 text-sm font-semibold transition-colors duration-200 ${
              selected ? 'text-ink-inverse' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
