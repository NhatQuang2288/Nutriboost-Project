import { describe, expect, it } from 'vitest'

import {
  PROTECTED_API_PREFIXES,
  PROTECTED_PREFIXES,
  isGuestOnlyPage,
  isProtectedApi,
  isProtectedPage,
  matchesPrefix,
} from './routes'

describe('matchesPrefix', () => {
  it('khớp khi bằng đúng', () => {
    expect(matchesPrefix('/hom-nay', PROTECTED_PREFIXES)).toBe(true)
  })

  it('khớp khi có đường dẫn con', () => {
    expect(matchesPrefix('/pt/khach/abc', PROTECTED_PREFIXES)).toBe(true)
    expect(matchesPrefix('/hom-nay/chi-tiet', PROTECTED_PREFIXES)).toBe(true)
  })

  it('KHÔNG khớp tiền tố chuỗi thô', () => {
    // Đây là lý do không dùng `startsWith` trần: `/hom-nay-cua-toi` không phải màn hình
    // được bảo vệ, và cũng không được phép lọt vào nhóm bảo vệ một cách tình cờ.
    expect(matchesPrefix('/hom-nay-cua-toi', PROTECTED_PREFIXES)).toBe(false)
    expect(matchesPrefix('/ptx', PROTECTED_PREFIXES)).toBe(false)
    expect(matchesPrefix('/toi-tro-thanh-nguoi-khac', PROTECTED_PREFIXES)).toBe(false)
  })

  it('không khớp đường dẫn không liên quan', () => {
    expect(matchesPrefix('/dang-nhap', PROTECTED_PREFIXES)).toBe(false)
    expect(matchesPrefix('/auth/callback', PROTECTED_PREFIXES)).toBe(false)
    expect(matchesPrefix('/', PROTECTED_PREFIXES)).toBe(false)
  })
})

describe('danh sách route bảo vệ', () => {
  it('bảo vệ mọi màn hình trong ứng dụng', () => {
    for (const path of [
      '/hom-nay',
      '/ghi-nhan',
      '/ke-hoach',
      '/lich-tap',
      '/tien-do',
      '/toi',
      '/coach',
      '/pt',
      '/onboarding',
      '/tham-gia',
    ]) {
      expect(isProtectedPage(path), `${path} phải được bảo vệ`).toBe(true)
    }
  })

  it('để mở màn đăng nhập và route xác thực', () => {
    for (const path of [
      '/dang-nhap',
      '/dang-ky',
      '/quen-mat-khau',
      '/dat-lai-mat-khau',
      '/auth/callback',
      '/dang-xuat',
    ]) {
      expect(isProtectedPage(path), `${path} không được chặn`).toBe(false)
    }
  })

  it('bảo vệ API trợ lý nhưng không bảo vệ API tài khoản', () => {
    expect(isProtectedApi('/api/ai/chat')).toBe(true)
    for (const path of [
      '/api/auth/magic-link',
      '/api/auth/sign-in',
      '/api/auth/sign-up',
      '/api/auth/forgot-password',
      // Route này tự kiểm phiên và trả 401 kèm lời giải thích về liên kết hết hạn.
      '/api/auth/update-password',
    ]) {
      expect(isProtectedApi(path), `${path} không được chặn`).toBe(false)
    }
  })

  it('danh sách API nằm trong hằng số đã xuất', () => {
    expect(PROTECTED_API_PREFIXES).toContain('/api/ai')
  })
})

describe('màn chỉ dành cho người chưa đăng nhập', () => {
  it('gồm đăng nhập, đăng ký và quên mật khẩu', () => {
    for (const path of ['/dang-nhap', '/dang-ky', '/quen-mat-khau']) {
      expect(isGuestOnlyPage(path), `${path}`).toBe(true)
    }
  })

  it('KHÔNG gồm màn đặt mật khẩu mới — người dùng tới đó nhờ có phiên', () => {
    expect(isGuestOnlyPage('/dat-lai-mat-khau')).toBe(false)
  })
})
