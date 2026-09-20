'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { localHourIn, mealTypeForHour } from '@/lib/ai/meal-time'
import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import type { ActionResult } from './types'

/**
 * Lưu một bữa ăn vào nhật ký.
 *
 * Vì sao cần action này: trước đây **không có đường nào** để người dùng tự lưu bữa ăn. Đường
 * ghi duy nhất là công cụ `log_meal` do model gọi, nên nút "Lưu bữa này" trên thẻ xác nhận chỉ
 * đổi state cục bộ rồi tự hiện chữ "Đã lưu" — giao diện nói dối người dùng. Đó đúng là lỗi mà
 * `CLAUDE.md` đã ghi là từng xảy ra và đã sửa ở đường công cụ, nhưng nút này thì chưa.
 *
 * Quyền kiểm ở hai tầng: ở đây để trả về câu đọc được, và trong hàm CSDL
 * `log_meal_with_items` (lấy người dùng từ `auth.uid()`) vì đó mới là hàng rào thật.
 *
 * Bữa trong ngày được **suy từ giờ**, không hỏi người dùng: màn ghi bữa ăn đặt mục tiêu ≤ 2 lần
 * chạm, hỏi thêm một câu là phá mục tiêu đó.
 */

const itemSchema = z.object({
  foodId: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(1, 'Món phải có tên.').max(160),
  grams: z.number().finite().min(0).max(5000),
  kcal: z.number().finite().min(0).max(10_000),
  proteinG: z.number().finite().min(0).max(1000),
  carbG: z.number().finite().min(0).max(1000),
  fatG: z.number().finite().min(0).max(1000),
  fiberG: z.number().finite().min(0).max(1000).optional(),
  sugarG: z.number().finite().min(0).max(1000).optional(),
  sodiumMg: z.number().finite().min(0).max(100_000).optional(),
  /** Độ chắc của bước khớp tên món; lưu lại để sau này biết chỗ nào hay khớp sai. */
  confidence: z.number().min(0).max(1).optional(),
})

const saveMealSchema = z.object({
  rawInput: z.string().trim().max(400).optional(),
  items: z.array(itemSchema).min(1, 'Bữa ăn phải có ít nhất một món.'),
})

export type SaveMealInput = z.input<typeof saveMealSchema>

export async function saveMealAction(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser()
  if (user === null) {
    return { ok: false, message: 'Cần đăng nhập để lưu bữa ăn.' }
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return { ok: false, message: 'Chưa cấu hình Supabase nên chưa lưu được bữa ăn.' }
  }

  const parsed = saveMealSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dữ liệu bữa ăn chưa hợp lệ.' }
  }

  /*
   * Ngày và bữa tính ở phía máy chủ theo múi giờ Việt Nam. Không nhận từ trình duyệt: đồng hồ
   * máy khách có thể sai, và một bữa ăn ghi vào sai ngày thì không sửa lại được.
   */
  const localDate = localDateIn(DEFAULT_TIMEZONE)
  const mealType = mealTypeForHour(localHourIn(DEFAULT_TIMEZONE))

  const { error } = await supabase.rpc('log_meal_with_items', {
    p_local_date: localDate,
    p_meal_type: mealType,
    p_raw_input: parsed.data.rawInput ?? '',
    p_items: parsed.data.items.map((item) => ({
      foodId: item.foodId ?? null,
      displayName: item.displayName,
      grams: item.grams,
      kcal: item.kcal,
      proteinG: item.proteinG,
      carbG: item.carbG,
      fatG: item.fatG,
      fiberG: item.fiberG ?? 0,
      sugarG: item.sugarG ?? 0,
      sodiumMg: item.sodiumMg ?? 0,
      // Người dùng đã nhìn thẻ rồi mới bấm lưu, nên nguồn khớp là `user`, không phải model.
      matchMethod: 'user',
      matchScore: item.confidence ?? null,
    })),
  })

  if (error !== null) {
    return { ok: false, message: `Chưa lưu được bữa ăn: ${error.message}` }
  }

  // Ba màn hình đọc nhật ký hôm nay; thiếu `revalidatePath` thì chúng vẫn hiện số cũ.
  revalidatePath('/hom-nay')
  revalidatePath('/tien-do')
  revalidatePath('/ghi-nhan')

  return { ok: true, message: 'Đã lưu bữa ăn vào nhật ký hôm nay.' }
}
