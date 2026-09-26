/**
 * Kiểu và nhãn dùng chung cho mã mời.
 *
 * Tách khỏi `lib/data/invites.ts` vì file kia import client Supabase phía server (đi qua
 * `next/headers`). Một client component import **giá trị** từ file đó sẽ kéo cả module server
 * vào bundle trình duyệt và làm hỏng bản dựng. Ở đây không có gì phụ thuộc server.
 */

/** Lý do một mã không dùng được. Khớp nhánh `case` trong `invite_code_status`. */
export type InviteReason =
  | 'ok'
  | 'revoked'
  | 'expired'
  | 'used_up'
  | 'no_plan'
  | 'plan_full'
  | 'not_found'
  | 'empty'
  | 'own_code'
  | 'already_linked'

/**
 * Câu hiển thị cho từng lý do.
 *
 * Viết ở tầng ứng dụng chứ không đọc từ CSDL: hàm `redeem_invite_code` cố ý trả về **mã**
 * lý do chứ không trả câu chữ, để thông báo hiển thị cho người dùng không do CSDL quyết định.
 */
export const INVITE_REASON_MESSAGES: Readonly<Record<InviteReason, string>> = {
  ok: 'Dùng được',
  revoked: 'Mã này đã bị thu hồi.',
  expired: 'Mã này đã hết hạn.',
  used_up: 'Mã này đã hết lượt dùng.',
  no_plan: 'Tài khoản PT này chưa có gói đang hiệu lực.',
  plan_full: 'Gói hiện tại đã đủ số khách.',
  not_found: 'Không tìm thấy mã này. Bạn kiểm tra lại giúp mình nhé.',
  empty: 'Bạn chưa nhập mã.',
  own_code: 'Đây là mã của chính bạn.',
  already_linked: 'Bạn đã là khách của PT này rồi.',
}

/** Nhãn ngắn để hiện trên thẻ trạng thái của mã. */
export const INVITE_REASON_LABELS: Readonly<Record<InviteReason, string>> = {
  ok: 'Dùng được',
  revoked: 'Đã thu hồi',
  expired: 'Hết hạn',
  used_up: 'Hết lượt',
  no_plan: 'Chưa có gói',
  plan_full: 'Gói đã đầy',
  not_found: 'Không tìm thấy',
  empty: 'Chưa nhập',
  own_code: 'Mã của bạn',
  already_linked: 'Đã là khách',
}

export interface InviteCodeView {
  id: string
  code: string
  note: string | null
  createdAt: string
  expiresAt: string
  maxUses: number
  usedCount: number
  revoked: boolean
  usable: boolean
  reason: InviteReason
  remainingSlots: number
}

export interface PtPlanView {
  tierLabel: string
  clientLimit: number
  remainingSlots: number
  renewsOn: string
}

export interface InviteContext {
  /**
   * `demo` — chưa cấu hình Supabase, màn hình phải nói thẳng là chưa dùng được.
   * `not_pt` — đã đăng nhập nhưng tài khoản không có vai trò PT.
   * `ready` — có dữ liệu thật.
   */
  state: 'demo' | 'not_pt' | 'ready'
  codes: InviteCodeView[]
  plan: PtPlanView | null
}
