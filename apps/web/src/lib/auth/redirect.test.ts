import { describe, expect, it } from 'vitest'

import { DEFAULT_AFTER_SIGN_IN, safeNextPath } from './redirect'

describe('safeNextPath', () => {
  it('giữ nguyên đường dẫn nội bộ', () => {
    expect(safeNextPath('/ke-hoach')).toBe('/ke-hoach')
    expect(safeNextPath('/pt/khach/abc')).toBe('/pt/khach/abc')
    expect(safeNextPath('/hom-nay?v=1')).toBe('/hom-nay?v=1')
  })

  it('trả về mặc định khi không có tham số', () => {
    expect(safeNextPath(null)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeNextPath(undefined)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeNextPath('')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('chặn URL tuyệt đối — đây là open redirect', () => {
    expect(safeNextPath('https://evil.example')).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeNextPath('http://evil.example/hom-nay')).toBe(DEFAULT_AFTER_SIGN_IN)
    // Không có giao thức nhưng vẫn là URL tuyệt đối.
    expect(safeNextPath('evil.example')).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeNextPath('javascript:alert(1)')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('chặn đường dẫn giao thức-tương-đối', () => {
    expect(safeNextPath('//evil.example')).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeNextPath('//evil.example/hom-nay')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('chặn dạng lách qua dấu gạch chéo ngược', () => {
    // Một số trình duyệt hiểu `/\evil.example` như `//evil.example`.
    expect(safeNextPath('/\\evil.example')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('không nhầm đường dẫn nội bộ có hai dấu chéo ở giữa', () => {
    expect(safeNextPath('/pt//khach')).toBe('/pt//khach')
  })
})
