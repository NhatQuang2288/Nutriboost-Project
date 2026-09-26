import { describe, expect, it } from 'vitest'

import {
  GENERIC_AUTH_ERROR,
  PASSWORD_MIN_LENGTH,
  authErrorMessage,
  nextPathAfterSignUp,
  signInSchema,
  signUpSchema,
  validateNewPasswordForm,
  validateSignUpForm,
} from './credentials'

const VALID_FORM = {
  fullName: 'Minh',
  email: 'minh@example.com',
  password: 'mat-khau-du-dai',
  confirmPassword: 'mat-khau-du-dai',
}

describe('validateSignUpForm', () => {
  it('form hợp lệ thì không có lỗi', () => {
    expect(validateSignUpForm(VALID_FORM)).toEqual({})
  })

  it(`mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`, () => {
    const short = 'a'.repeat(PASSWORD_MIN_LENGTH - 1)
    const errors = validateSignUpForm({ ...VALID_FORM, password: short, confirmPassword: short })
    expect(errors.password).toContain(String(PASSWORD_MIN_LENGTH))

    const exact = 'a'.repeat(PASSWORD_MIN_LENGTH)
    expect(
      validateSignUpForm({ ...VALID_FORM, password: exact, confirmPassword: exact }).password,
    ).toBeUndefined()
  })

  it('bắt được mật khẩu nhập lại không khớp', () => {
    const errors = validateSignUpForm({ ...VALID_FORM, confirmPassword: 'khac-han' })
    expect(errors.confirmPassword).toBe('Mật khẩu nhập lại không khớp.')
  })

  it('bắt được email sai và tên trống cùng lúc, mỗi ô một câu', () => {
    const errors = validateSignUpForm({ ...VALID_FORM, fullName: '   ', email: 'khong-phai-email' })
    expect(errors.fullName).toBeDefined()
    expect(errors.email).toBe('Email không hợp lệ.')
  })
})

describe('signUpSchema', () => {
  it('chuẩn hoá email về chữ thường và bỏ khoảng trắng', () => {
    const parsed = signUpSchema.parse({ ...VALID_FORM, email: '  Minh@Example.COM ' })
    expect(parsed.email).toBe('minh@example.com')
  })

  it('mặc định là khách tập, và mã mời không bắt buộc', () => {
    const parsed = signUpSchema.parse(VALID_FORM)
    expect(parsed.intent).toBe('client')
    expect(parsed.inviteCode).toBeUndefined()
  })

  it('không nhận vai trò ngoài danh sách — không tự cấp quyền qua API được', () => {
    expect(signUpSchema.safeParse({ ...VALID_FORM, intent: 'admin' }).success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('không áp luật độ dài khi đăng nhập — tài khoản cũ có thể đặt mật khẩu ngắn hơn', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: '123' }).success).toBe(true)
  })

  it('từ chối mật khẩu rỗng', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false)
  })
})

describe('validateNewPasswordForm', () => {
  it('kiểm cả độ dài lẫn ô nhập lại', () => {
    expect(validateNewPasswordForm({ password: 'ngan', confirmPassword: 'khac' })).toEqual({
      password: expect.any(String),
      confirmPassword: 'Mật khẩu nhập lại không khớp.',
    })
    expect(
      validateNewPasswordForm({ password: 'du-dai-roi', confirmPassword: 'du-dai-roi' }),
    ).toEqual({})
  })
})

describe('authErrorMessage', () => {
  it('không phân biệt sai email với sai mật khẩu', () => {
    expect(authErrorMessage('invalid_credentials')).toBe('Email hoặc mật khẩu không đúng.')
  })

  it('mã lạ hoặc thiếu mã thì rơi về câu chung, không lộ câu tiếng Anh của Supabase', () => {
    expect(authErrorMessage('ma_chua_tung_thay')).toBe(GENERIC_AUTH_ERROR)
    expect(authErrorMessage(undefined)).toBe(GENERIC_AUTH_ERROR)
  })
})

describe('nextPathAfterSignUp', () => {
  it('có mã mời thì đưa tới trang nhập mã, kèm mã đã mã hoá URL', () => {
    expect(nextPathAfterSignUp('client', 'AB CD', undefined)).toBe('/tham-gia?ma=AB%20CD')
  })

  it('chọn PT thì tới trang gói — không cấp quyền PT', () => {
    expect(nextPathAfterSignUp('pt', undefined, undefined)).toBe('/pt/goi')
  })

  it('giữ đích đến mang từ màn đăng nhập sang', () => {
    expect(nextPathAfterSignUp('client', undefined, '/tham-gia?ma=X1')).toBe('/tham-gia?ma=X1')
  })

  it('không cho đích đến trỏ ra ngoài tên miền', () => {
    expect(nextPathAfterSignUp('client', '', 'https://evil.example')).toBe('/hom-nay')
    expect(nextPathAfterSignUp('client', undefined, '//evil.example')).toBe('/hom-nay')
  })
})
