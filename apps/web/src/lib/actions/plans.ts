'use server'

import { buildPlan } from '@nutriboost/ai'
import { buildDataset } from '@nutriboost/seed'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { readClientTargets } from '@/lib/data/pt-live'
import { startOfWeekIso } from '@/lib/data/plan'
import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import type { ActionResult } from './types'

/**
 * Vòng duyệt thực đơn.
 *
 * Trước đây `/pt/duyet` đọc `plans` có `status = 'draft'` mà **không có gì ghi ra chúng**: bộ
 * dựng thực đơn chạy ở tầng ứng dụng rồi trả về một đối tượng trong bộ nhớ, và màn kế hoạch
 * của khách cũng dựng lại từ đầu mỗi lần mở. Không có bản lưu thì không có gì để duyệt, không
 * có gì để PT chỉnh, và không có gì để đối chiếu về sau.
 *
 * Quyền kiểm ở hai chỗ và đó là chủ ý: ở đây để trả về câu đọc được cho người dùng, và trong
 * hàm CSDL (`save_plan`, `decide_plan`) vì đó mới là hàng rào thật — tầng ứng dụng có thể bị
 * gọi vòng qua, còn `security definer` thì không.
 */

const generateSchema = z.object({
  /** Bỏ trống nghĩa là dựng cho chính người gọi. */
  clientId: z.string().uuid('Mã khách không hợp lệ.').optional(),
})

export async function generatePlanAction(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (user === null) {
    return { ok: false, message: 'Cần đăng nhập để dựng thực đơn.' }
  }

  const parsed = generateSchema.safeParse({
    clientId: formData.get('clientId') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.' }
  }

  const targetUserId = parsed.data.clientId ?? user.id
  if (targetUserId !== user.id && user.role !== 'pt') {
    return { ok: false, message: 'Chỉ tài khoản PT mới dựng được thực đơn cho người khác.' }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase nên chưa lưu được thực đơn.' }
  }

  const today = localDateIn(DEFAULT_TIMEZONE)
  const weekStart = startOfWeekIso(today)

  const targets = await readClientTargets(supabase, targetUserId, today)
  const catalogue = buildDataset().all

  // Không loại trừ món nào: `health_profiles.dietary_prefs` là chữ tự do ("không ăn hải sản")
  // nên chưa đối chiếu được với `foods.slug`. Ghi rõ ở đây để không ai tưởng là đã xử lý.
  const plan = buildPlan({ weekStart, targets, catalogue, excludedSlugs: [] })

  const slugs = [
    ...new Set(
      plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.items.map((item) => item.slug))),
    ),
  ]

  const { data: foods, error: lookupError } = await supabase
    .from('foods')
    .select('id, slug')
    .in('slug', slugs)

  if (lookupError !== null) {
    return { ok: false, message: `Không tra được danh mục món: ${lookupError.message}` }
  }

  const idBySlug = new Map(
    ((foods ?? []) as { id: string; slug: string }[]).map((row) => [row.slug, row.id]),
  )

  /*
   * Món không tra được vẫn được ghi với `foodId: null` — hàm trong CSDL giữ lại tên món. Mất
   * một liên kết danh mục không đáng để mất cả thực đơn.
   */
  const items = plan.days.flatMap((day) =>
    day.meals.flatMap((meal) =>
      meal.items.map((item) => ({
        planDate: day.date,
        mealType: meal.mealType,
        foodId: idBySlug.get(item.slug) ?? null,
        displayName: item.nameVi,
        grams: item.grams,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbG: item.carbG,
        fatG: item.fatG,
      })),
    ),
  )

  if (items.length === 0) {
    return { ok: false, message: 'Bộ dựng không ra món nào — bạn báo giúp mình nhé.' }
  }

  const { error } = await supabase.rpc('save_plan', {
    p_user_id: targetUserId,
    p_week_start: weekStart,
    p_items: items,
    // Bản do PT dựng luôn là nháp: khách chưa nên thấy trước khi PT xem qua. Khách tự dựng cho
    // mình thì dùng được ngay.
    p_status: targetUserId === user.id ? 'active' : 'draft',
  })

  if (error !== null) {
    return { ok: false, message: `Không lưu được thực đơn: ${error.message}` }
  }

  revalidatePath('/ke-hoach')
  revalidatePath('/pt/duyet')
  revalidatePath(`/pt/khach/${targetUserId}`)

  return {
    ok: true,
    message:
      targetUserId === user.id
        ? `Đã dựng thực đơn ${items.length} món cho tuần này.`
        : `Đã dựng thực đơn nháp ${items.length} món. Xem ở mục Duyệt thực đơn.`,
  }
}

const decideSchema = z.object({
  planId: z.string().uuid('Mã thực đơn không hợp lệ.'),
  decision: z.enum(['approve', 'revise']),
  note: z.string().trim().max(400, 'Nhận xét dài tối đa 400 ký tự.').optional(),
})

export async function decidePlanAction(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (user === null) {
    return { ok: false, message: 'Cần đăng nhập để duyệt thực đơn.' }
  }

  const parsed = decideSchema.safeParse({
    planId: formData.get('planId'),
    decision: formData.get('decision'),
    note: formData.get('note') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.' }
  }

  if (parsed.data.decision === 'revise' && (parsed.data.note ?? '').length === 0) {
    return { ok: false, message: 'Bạn ghi giúp mình cần chỉnh lại chỗ nào nhé.' }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase.' }
  }

  const { data, error } = await supabase.rpc('decide_plan', {
    p_plan_id: parsed.data.planId,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note ?? null,
  })

  if (error !== null) {
    return { ok: false, message: error.message }
  }

  const result = data as { ok: boolean; reason?: string } | null
  if (result === null || !result.ok) {
    return {
      ok: false,
      message:
        result?.reason === 'not_found'
          ? 'Không tìm thấy thực đơn này.'
          : 'Không duyệt được thực đơn này.',
    }
  }

  revalidatePath('/pt/duyet')
  revalidatePath('/ke-hoach')

  return {
    ok: true,
    message:
      parsed.data.decision === 'approve'
        ? 'Đã duyệt. Khách thấy thực đơn này ở màn Kế hoạch.'
        : 'Đã ghi nhận yêu cầu chỉnh lại.',
  }
}
