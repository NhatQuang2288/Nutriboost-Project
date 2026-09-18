/**
 * Chuẩn hoá tham số `next` trước khi chuyển hướng.
 *
 * `next` đến từ chuỗi truy vấn, tức là do người dùng kiểm soát. Nếu đưa thẳng vào
 * `NextResponse.redirect` thì kẻ tấn công gửi một liên kết trông như của NutriBoost
 * (`/dang-nhap?next=https://evil.example`) và sau khi đăng nhập thật, người dùng bị đưa
 * sang trang của kẻ tấn công — đúng khuôn mẫu open redirect.
 *
 * Ba trường hợp bị chặn:
 *   • URL tuyệt đối (`https://evil.example`, `javascript:…`)
 *   • đường dẫn giao thức-tương-đối (`//evil.example`) — trình duyệt hiểu là tên miền khác
 *   • chuỗi rỗng
 */

export const DEFAULT_AFTER_SIGN_IN = '/hom-nay'

/**
 * Cookie mang đích đến qua vòng email.
 *
 * Vì sao không nhét `next` vào `emailRedirectTo`: danh sách URL được phép của Supabase khớp
 * **chính xác**, nên `…/auth/callback?next=%2Fhom-nay` không khớp `…/auth/callback`. Supabase
 * từ chối và lặng lẽ trả người dùng về `site_url` — liên kết đổ vào trang chủ kèm `?code=…`
 * và không ai đổi mã đó thành phiên. Giữ `emailRedirectTo` là một hằng chuỗi thì nó khớp được.
 *
 * Cookie sống sót qua vòng email vì trình duyệt mở liên kết ở cùng máy. Mở liên kết ở máy
 * khác thì không có cookie, và người dùng về `/hom-nay` — mất đích đến sâu nhưng vẫn đăng
 * nhập được.
 */
export const NEXT_COOKIE = 'nb_tiep_theo'

export function safeNextPath(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return DEFAULT_AFTER_SIGN_IN
  if (raw.length === 0) return DEFAULT_AFTER_SIGN_IN
  if (!raw.startsWith('/')) return DEFAULT_AFTER_SIGN_IN
  if (raw.startsWith('//')) return DEFAULT_AFTER_SIGN_IN
  // `/\evil.example` được một số trình duyệt hiểu như `//evil.example`.
  if (raw.startsWith('/\\')) return DEFAULT_AFTER_SIGN_IN
  return raw
}
