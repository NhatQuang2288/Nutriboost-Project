import type { LoggedMealRequest, LoggedMealResult, ProgressPoint } from '@nutriboost/ai'
import type { SupabaseClient } from '@supabase/supabase-js'

import { formatIsoDate } from '@/lib/date'

/**
 * Hai công cụ của Bơ cần chạm cơ sở dữ liệu: ghi bữa ăn và đọc tiến độ.
 *
 * Vì sao nằm ở tầng ứng dụng: `packages/ai` không được biết gì về Supabase. Gói đó làm việc
 * với `slug` của danh mục thực phẩm, còn CSDL dùng `uuid` — việc đổi khoá là chuyện của tầng
 * ứng dụng, và nó nằm đúng ở đây.
 */

export interface MealLoggerContext {
  supabase: SupabaseClient
  userId: string
  /** Ngày theo múi giờ người dùng, `YYYY-MM-DD`. */
  localDate: string
  /** Năng lượng đã nạp TRƯỚC khi ghi bữa này. */
  consumedKcalBefore: number
  kcalBurned: number
  targetKcal: number
}

/**
 * Ghi bữa ăn vào `meal_logs` + `meal_log_items`.
 *
 * **Ném lỗi khi ghi hỏng** — và đây là chỗ duy nhất trong luồng công cụ được phép làm vậy.
 * Công cụ `log_meal` bọc lời gọi này trong `try` và đổi lỗi thành `toolRefusal`, nên model
 * đọc được lý do thật thay vì tự bịa. Ném ở đây rồi để công cụ bắt là cách duy nhất giữ
 * được thông báo gốc của PostgreSQL.
 */
export function createMealLogger(
  context: MealLoggerContext,
): (request: LoggedMealRequest) => Promise<LoggedMealResult> {
  return async (request) => {
    const slugs = [...new Set(request.items.map((item) => item.foodId))]

    const { data: foods, error: lookupError } = await context.supabase
      .from('foods')
      .select('id, slug')
      .in('slug', slugs)

    if (lookupError !== null) throw new Error(lookupError.message)

    const idBySlug = new Map(
      ((foods ?? []) as { id: string; slug: string }[]).map((row) => [row.slug, row.id]),
    )

    const items = request.items.map((item) => ({
      // Món không tra được trong CSDL vẫn được ghi với `foodId: null` — hàm trong CSDL giữ
      // lại tên món để bổ sung dữ liệu sau, thay vì mất cả bữa ăn.
      foodId: idBySlug.get(item.foodId) ?? null,
      displayName: item.displayName,
      grams: item.grams,
      kcal: item.kcal,
      proteinG: item.proteinG,
      carbG: item.carbG,
      fatG: item.fatG,
      fiberG: item.fiberG ?? 0,
      sugarG: item.sugarG ?? 0,
      sodiumMg: item.sodiumMg ?? 0,
      matchMethod: 'ai',
    }))

    const { error } = await context.supabase.rpc('log_meal_with_items', {
      p_local_date: context.localDate,
      p_meal_type: request.mealType,
      p_raw_input: request.rawInput,
      p_items: items,
    })

    if (error !== null) throw new Error(error.message)

    const loggedKcal = items.reduce((sum, item) => sum + item.kcal, 0)

    return {
      remainingKcal:
        context.targetKcal + context.kcalBurned - context.consumedKcalBefore - loggedKcal,
    }
  }
}

export interface ProgressReaderContext {
  supabase: SupabaseClient
  userId: string
}

/**
 * Đọc năng lượng nạp vào theo ngày từ `daily_summaries` — bảng tổng hợp sẵn, không phải quét
 * lại `meal_logs`.
 *
 * **Không ném lỗi**: trả về mảng rỗng khi đọc hỏng. Công cụ `get_progress` đã có nhánh xử lý
 * "chưa đủ dữ liệu để nói xu hướng", và một biểu đồ rỗng trung thực hơn một lỗi bị AI SDK che.
 */
export function createProgressReader(
  context: ProgressReaderContext,
): (days: number) => Promise<ProgressPoint[]> {
  return async (days) => {
    const { data, error } = await context.supabase
      .from('daily_summaries')
      .select('local_date, kcal_in')
      .eq('user_id', context.userId)
      .order('local_date', { ascending: false })
      .limit(days)

    if (error !== null) return []

    // Truy vấn lấy mới nhất trước để `limit` cắt đúng `days` ngày gần nhất; biểu đồ cần thứ
    // tự thời gian tăng dần nên đảo lại.
    return ((data ?? []) as { local_date: string; kcal_in: number }[])
      .slice()
      .reverse()
      .map((row) => ({ label: formatIsoDate(row.local_date), value: row.kcal_in }))
  }
}
