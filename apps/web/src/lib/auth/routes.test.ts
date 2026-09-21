import { describe, expect, it } from 'vitest'

import {
  PROTECTED_API_PREFIXES,
  PROTECTED_PREFIXES,
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
    for (const path of ['/dang-nhap', '/auth/callback', '/dang-xuat']) {
      expect(isProtectedPage(path), `${path} không được chặn`).toBe(false)
    }
  })

  it('bảo vệ API trợ lý nhưng không bảo vệ API gửi liên kết đăng nhập', () => {
    expect(isProtectedApi('/api/ai/chat')).toBe(true)
    expect(isProtectedApi('/api/auth/magic-link')).toBe(false)
  })

  it('danh sách API nằm trong hằng số đã xuất', () => {
    expect(PROTECTED_API_PREFIXES).toContain('/api/ai')
  })
})
