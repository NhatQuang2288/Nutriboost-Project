import {
  type InviteCodeView,
  type InviteContext,
  type InviteReason,
  type PtPlanView,
} from '@/lib/invites'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import { TIER_LABELS } from './pt'

/**
 * Lớp dữ liệu của mã mời.
 *
 * Đây là phần **đọc thật từ Supabase** đầu tiên của console PT. Phần còn lại của
 * `lib/data/pt.ts` vẫn dựng từ dữ liệu mẫu — mã mời được làm thật trước vì nó là thứ duy
 * nhất trong console có tác dụng phụ thật (tạo quan hệ PT ↔ khách), nên không thể giả lập.
 */

interface InviteStatusRow {
  id: string
  code: string
  note: string | null
  created_at: string
  expires_at: string
  max_uses: number
  used_count: number
  revoked_at: string | null
  usable: boolean
  reason: InviteReason
  remaining_slots: number
}

/**
 * Đọc mã mời và gói hiện tại của PT đang đăng nhập.
 *
 * Hai câu hỏi này luôn được hỏi cùng nhau trên giao diện — "mã nào còn dùng được" và "tôi
 * còn mời được mấy người" — nên gom vào một hàm để không có chỗ nào chỉ đọc một nửa.
 */
export async function getInviteContext(): Promise<InviteContext> {
  const user = await getSessionUser()
  if (user === null) {
    // Chưa cấu hình Supabase, hoặc phiên không đọc được. Cả hai đều dẫn tới cùng một việc
    // phải làm trên giao diện: nói thẳng là chưa dùng được.
    return { state: 'demo', codes: [], plan: null }
  }

  if (user.role !== 'pt') {
    return { state: 'not_pt', codes: [], plan: null }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { state: 'demo', codes: [], plan: null }
  }

  // Một lời gọi, không phải N+1: hàm trong CSDL nhận `p_code_id` mặc định null nên trả về
  // toàn bộ mã của người gọi kèm trạng thái đã tính sẵn.
  const { data, error } = await supabase.rpc('invite_code_status')
  if (error !== null) {
    return { state: 'ready', codes: [], plan: null }
  }

  const rows = (data ?? []) as InviteStatusRow[]
  const remainingSlots = rows[0]?.remaining_slots ?? 0

  return {
    state: 'ready',
    codes: rows.map(toView),
    plan: await readPlan(supabase, remainingSlots),
  }
}

function toView(row: InviteStatusRow): InviteCodeView {
  return {
    id: row.id,
    code: row.code,
    note: row.note,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    revoked: row.revoked_at !== null,
    usable: row.usable,
    reason: row.reason,
    remainingSlots: row.remaining_slots,
  }
}

/**
 * Gói đang hiệu lực của PT.
 *
 * `subscriptions` chứa cả lịch sử — mỗi lần gia hạn là một hàng — nên phải lấy hàng có
 * `current_period_end` xa nhất. RLS đã giới hạn về đúng chủ sở hữu.
 */
async function readPlan(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  remainingSlots: number,
): Promise<PtPlanView | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, client_limit, current_period_end, status')
    .in('status', ['trialing', 'active', 'past_due'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error !== null || data === null) return null

  const row = data as { tier: string; client_limit: number; current_period_end: string }

  return {
    tierLabel: TIER_LABELS[row.tier as keyof typeof TIER_LABELS] ?? row.tier,
    clientLimit: row.client_limit,
    remainingSlots,
    renewsOn: row.current_period_end,
  }
}
