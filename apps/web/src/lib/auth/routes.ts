/**
 * Danh sách route bảo vệ, tách khỏi `middleware.ts` để kiểm thử được.
 *
 * Đây là biên bảo mật của ứng dụng. Một lỗi ở đây không làm test nào đỏ trước khi có file
 * test này: chỉ cần quên một màn hình trong danh sách là màn đó mở công khai, im lặng.
 */

/** Màn hình bắt buộc phải đăng nhập. */
export const PROTECTED_PREFIXES = [
  '/hom-nay',
  '/ghi-nhan',
  '/ke-hoach',
  '/lich-tap',
  '/tien-do',
  '/toi',
  '/coach',
  '/pt',
  '/onboarding',
  // Nhập mã mời cần biết "ai đang đổi mã" — hàm `redeem_invite_code` lấy người dùng từ
  // `auth.uid()`. Chưa đăng nhập thì middleware đưa qua `/dang-nhap` kèm cả `?ma=` trong
  // `next`, nên mã không bị mất trên đường.
  '/tham-gia',
] as const

/** API bắt buộc phải đăng nhập — trả 401 JSON, không redirect. */
export const PROTECTED_API_PREFIXES = ['/api/ai'] as const

/**
 * Khớp theo tiền tố đường dẫn, không phải tiền tố chuỗi.
 *
 * Phân biệt này quan trọng: so khớp chuỗi thô sẽ khiến `/hom-nay-cua-toi` khớp `/hom-nay`.
 * Ở đây chỉ nhận khi bằng đúng, hoặc khi ký tự tiếp theo là dấu `/`.
 */
export function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isProtectedPage(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_PREFIXES)
}

export function isProtectedApi(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_API_PREFIXES)
}
