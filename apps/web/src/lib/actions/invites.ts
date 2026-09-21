'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { INVITE_REASON_MESSAGES, type InviteReason } from '@/lib/invites'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import type { ActionResult } from './types'

/**
 * Server Action cho mã mời.
 *
 * Server Action chứ không phải route API: chúng chạy bằng phiên của người dùng, nên RLS áp
 * dụng đúng như khi đọc — không có thêm một bề mặt API nào phải tự bảo vệ, và không có nguy
 * cơ quên kiểm tra quyền ở đó.
 */

const createSchema = z.object({
  note: z
    .string()
    .trim()
    .max(80, 'Ghi chú dài tối đa 80 ký tự.')
    .optional()
    .transform((value) => (value === undefined || value.length === 0 ? null : value)),
  maxUses: z.coerce
    .number()
    .int('Số lượt phải là số nguyên.')
    .min(1, 'Một mã phải dùng được ít nhất 1 lần.')
    .max(100, 'Một mã dùng được tối đa 100 lần.'),
  expiresInDays: z.coerce
    .number()
    .int('Số ngày phải là số nguyên.')
    .min(1, 'Mã phải có hiệu lực ít nhất 1 ngày.')
    .max(90, 'Mã có hiệu lực tối đa 90 ngày.'),
})

/** Chỉ PT mới phát hành mã — khớp chính sách insert trên `invite_codes`. */
async function requirePt(): Promise<
  { ok: true; userId: string } | { ok: false; result: ActionResult }
> {
  const user = await getSessionUser()
  if (user === null) {
    return {
      ok: false,
      result: { ok: false, message: 'Cần đăng nhập để quản lý mã mời.' },
    }
  }
  if (user.role !== 'pt') {
    return {
      ok: false,
      result: { ok: false, message: 'Chỉ tài khoản PT mới phát hành được mã mời.' },
    }
  }
  return { ok: true, userId: user.id }
}

export async function createInviteAction(formData: FormData): Promise<ActionResult> {
  const auth = await requirePt()
  if (!auth.ok) return auth.result

  const parsed = createSchema.safeParse({
    note: String(formData.get('note') ?? ''),
    maxUses: formData.get('maxUses') ?? 1,
    expiresInDays: formData.get('expiresInDays') ?? 14,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.',
    }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase nên chưa tạo được mã mời.' }
  }

  // Sinh mã ở CSDL, không ở tầng ứng dụng: bảng chữ cái và việc kiểm tra trùng nằm cùng
  // một chỗ với ràng buộc `check` cưỡng chế nó.
  const generated = await supabase.rpc('generate_invite_code')
  if (generated.error !== null || generated.data === null) {
    return { ok: false, message: 'Không sinh được mã mời. Bạn thử lại nhé.' }
  }

  const code = generated.data as string
  const inserted = await supabase.from('invite_codes').insert({
    code,
    pt_id: auth.userId,
    note: parsed.data.note,
    max_uses: parsed.data.maxUses,
    expires_at: new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString(),
  })

  if (inserted.error !== null) {
    return { ok: false, message: `Không tạo được mã: ${inserted.error.message}` }
  }

  revalidatePath('/pt/loi-moi')
  return { ok: true, message: `Đã tạo mã ${code}.`, code }
}

export async function revokeInviteAction(formData: FormData): Promise<ActionResult> {
  const auth = await requirePt()
  if (!auth.ok) return auth.result

  const id = String(formData.get('id') ?? '')
  if (id.length === 0) {
    return { ok: false, message: 'Thiếu mã cần thu hồi.' }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase.' }
  }

  /*
   * Thu hồi chứ không xoá. Giữ lại mã đã phát hành để còn đối chiếu khi khách hỏi vì sao
   * không vào được — xoá đi là mất bằng chứng, mà cũng chẳng được lợi gì.
   *
   * Điều kiện `pt_id` không thừa: chính sách RLS đã chặn, nhưng viết ra thì hàng rào đọc
   * được ngay tại chỗ gọi.
   */
  const updated = await supabase
    .from('invite_codes')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('pt_id', auth.userId)
    .is('revoked_at', null)
    .select('id')

  if (updated.error !== null) {
    return { ok: false, message: `Không thu hồi được mã: ${updated.error.message}` }
  }
  if ((updated.data ?? []).length === 0) {
    return { ok: false, message: 'Không tìm thấy mã này, hoặc mã đã bị thu hồi trước đó.' }
  }

  revalidatePath('/pt/loi-moi')
  return { ok: true, message: 'Đã thu hồi mã.' }
}

/**
 * Đổi mã mời.
 *
 * Mọi phán quyết nằm trong `redeem_invite_code()` ở CSDL: mã còn hạn không, còn lượt không,
 * gói còn chỗ không. Tầng này chỉ dịch kết quả thành câu tiếng Việt — nếu tự kiểm tra lại ở
 * đây thì có hai nơi quyết định, và chúng sẽ lệch nhau.
 */
export async function redeemInviteAction(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (user === null) {
    return { ok: false, message: 'Cần đăng nhập để dùng mã mời.' }
  }

  const raw = String(formData.get('code') ?? '')
  if (raw.trim().length === 0) {
    return { ok: false, message: INVITE_REASON_MESSAGES.empty }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase nên chưa dùng được mã mời.' }
  }

  const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: raw })

  if (error !== null) {
    /*
     * Lỗi tới từ trigger hạn mức gói, và thông báo đã là tiếng Việt sẵn sàng để hiển thị
     * ("Đã đạt giới hạn 5 khách hàng của gói hiện tại." hoặc "Tài khoản PT chưa có gói đang
     * hiệu lực."). Không bọc lại bằng câu chung chung — người dùng cần biết vì sao.
     */
    return { ok: false, message: error.message }
  }

  const result = data as { ok: boolean; reason?: InviteReason } | null
  if (result === null || !result.ok) {
    const reason = result?.reason ?? 'not_found'
    return { ok: false, message: INVITE_REASON_MESSAGES[reason] }
  }

  revalidatePath('/tham-gia')
  revalidatePath('/hom-nay')
  return { ok: true, message: 'Xong! Bạn đã trở thành khách của PT này.' }
}
