import { buildPlan, type BuiltPlan, type PlanItem, type PlanMeal } from '@nutriboost/ai'
import { buildDataset } from '@nutriboost/seed'
import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import { getTodayView, type MealType } from './today'

/**
 * Kế hoạch tuần cho màn `/ke-hoach`.
 *
 * Hai nguồn, và thứ tự ưu tiên có chủ ý:
 *
 *   1. **Thực đơn đã lưu** trong `plans` với `status = 'active'` — bản PT đã duyệt. Khi có, đó
 *      là bản duy nhất khách nên thấy, vì nó là bản có người chịu trách nhiệm.
 *   2. **Bản dựng tất định** từ danh mục, khi chưa có bản nào được duyệt.
 *
 * Vì sao vẫn cần nguồn thứ hai: kế hoạch là thứ người dùng mở ra mỗi ngày, nên nó phải luôn
 * có — kể cả khi chưa có PT, khi mất mạng, hay khi bản lưu bị xoá. Bộ dựng tất định chạy được
 * ở mọi trường hợp đó, và cả hai nguồn đều đi qua `@nutriboost/ai`.
 */

/** Thứ Hai của tuần chứa `isoDate` — tuần bắt đầu từ thứ Hai theo nếp Việt Nam. */
export function startOfWeekIso(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate

  const base = Date.UTC(year, month - 1, day)
  // getUTCDay: 0 = Chủ nhật. Lùi về thứ Hai gần nhất.
  const weekday = new Date(base).getUTCDay()
  const offset = (weekday + 6) % 7

  return new Date(base - offset * 86_400_000).toISOString().slice(0, 10)
}

export interface WeeklyPlanView {
  plan: BuiltPlan
  targetKcal: number
  weekLabel: string
  /** `demo` = dữ liệu mẫu. Xem ghi chú trong `today.ts`. */
  source: 'demo' | 'live'
  /** `true` khi đây là thực đơn đã lưu và đã được duyệt, không phải bản dựng tất định. */
  stored: boolean
  /** `true` khi có bản nháp đang chờ PT duyệt. Khách chưa thấy nội dung bản đó. */
  awaitingReview: boolean
}

export async function getWeeklyPlan(now: Date = new Date()): Promise<WeeklyPlanView> {
  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)

  const view = await getTodayView(now)
  const stored = await readStoredPlan(weekStart)

  // Bản đã duyệt thì dùng luôn.
  if (stored?.status === 'active' && stored.items.length > 0) {
    const plan = buildPlanFromRows(weekStart, stored.items)

    return {
      plan,
      targetKcal: view.targets.targetKcal,
      weekLabel: weekLabel(plan, weekStart),
      source: view.source,
      stored: true,
      awaitingReview: false,
    }
  }

  const plan = buildPlan({
    weekStart,
    targets: {
      targetKcal: view.targets.targetKcal,
      proteinG: view.targets.proteinG,
      carbG: view.targets.carbG,
      fatG: view.targets.fatG,
    },
    catalogue: buildDataset().all,
    // `health_profiles.dietary_prefs` là chữ tự do ("không ăn hải sản") nên chưa đối chiếu được
    // với `foods.slug`. Ghi rõ ở đây để không ai tưởng là đã xử lý.
    excludedSlugs: [],
  })

  return {
    plan,
    targetKcal: view.targets.targetKcal,
    weekLabel: weekLabel(plan, weekStart),
    source: view.source,
    stored: false,
    awaitingReview: stored?.status === 'draft',
  }
}

function weekLabel(plan: BuiltPlan, weekStart: string): string {
  const first = plan.days[0]?.date ?? weekStart
  const last = plan.days[plan.days.length - 1]?.date ?? weekStart
  return `${first} → ${last}`
}

interface StoredPlanItem {
  planDate: string
  mealType: MealType
  slug: string | null
  displayName: string
  grams: number | string
  kcal: number | string
  proteinG: number | string
  carbG: number | string
  fatG: number | string
}

interface StoredPlan {
  status: 'draft' | 'active' | 'archived'
  items: StoredPlanItem[]
}

/**
 * Đọc thực đơn đã lưu của tuần.
 *
 * Trả `null` ở **mọi** trường hợp không đọc được — chưa cấu hình Supabase, chưa đăng nhập,
 * chưa có thực đơn, hoặc lỗi mạng. Nơi gọi rơi về bản dựng tất định, nên màn Kế hoạch không
 * bao giờ trống chỉ vì một truy vấn hỏng.
 */
async function readStoredPlan(weekStart: string): Promise<StoredPlan | null> {
  const user = await getSessionUser()
  if (user === null) return null

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return null

  return fetchStoredPlan(supabase, user.id, weekStart)
}

async function fetchStoredPlan(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
): Promise<StoredPlan | null> {
  const { data, error } = await supabase.rpc('read_plan', {
    p_user_id: userId,
    p_week_start: weekStart,
  })

  if (error !== null) return null

  const row = data as { status: StoredPlan['status']; items: StoredPlanItem[] } | null
  if (row === null) return null

  return { status: row.status, items: row.items ?? [] }
}

/** Thứ tự bữa trong ngày, khớp `MEAL_ORDER` của màn Hôm nay. */
const MEAL_SEQUENCE: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

/**
 * Dựng `BuiltPlan` từ các hàng `plan_items`.
 *
 * `plan_items` là danh sách phẳng có `plan_date` và `meal_type`; `BuiltPlan` là cây ngày → bữa →
 * món. Phép gộp nằm ở đây để màn hình không phải biết gì về hình dạng bảng.
 */
export function buildPlanFromRows(weekStart: string, rows: readonly StoredPlanItem[]): BuiltPlan {
  const days = new Map<string, Map<MealType, PlanItem[]>>()

  for (const row of rows) {
    const meals = days.get(row.planDate) ?? new Map<MealType, PlanItem[]>()
    const items = meals.get(row.mealType) ?? []
    items.push({
      // `slug` là null khi món không còn trong danh mục. Dùng tên làm khoá dự phòng để giao
      // diện vẫn dựng được thẻ thay vì bỏ món đi.
      slug: row.slug ?? row.displayName,
      nameVi: row.displayName,
      grams: Number(row.grams),
      kcal: Number(row.kcal),
      proteinG: Number(row.proteinG),
      carbG: Number(row.carbG),
      fatG: Number(row.fatG),
    })
    meals.set(row.mealType, items)
    days.set(row.planDate, meals)
  }

  const planDays = [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, meals]) => {
      const planMeals: PlanMeal[] = MEAL_SEQUENCE.filter((mealType) => meals.has(mealType)).map(
        (mealType) => {
          const items = meals.get(mealType) ?? []
          return {
            mealType,
            targetKcal: 0,
            items,
            totalKcal: items.reduce((sum, item) => sum + item.kcal, 0),
          }
        },
      )

      const protein = planMeals.reduce(
        (sum, meal) => sum + meal.items.reduce((inner, item) => inner + item.proteinG, 0),
        0,
      )

      return {
        date,
        meals: planMeals,
        totalKcal: planMeals.reduce((sum, meal) => sum + meal.totalKcal, 0),
        totalProteinG: Math.round(protein * 10) / 10,
      }
    })

  const dayCount = planDays.length === 0 ? 1 : planDays.length

  return {
    weekStart,
    days: planDays,
    averageKcal: Math.round(planDays.reduce((sum, day) => sum + day.totalKcal, 0) / dayCount),
    averageProteinG:
      Math.round((planDays.reduce((sum, day) => sum + day.totalProteinG, 0) / dayCount) * 10) / 10,
    // Bản đã lưu không mang theo ghi chú của bộ dựng: chúng được tính lúc dựng và không có cột
    // nào lưu lại. Để rỗng thay vì bịa, vì ghi chú sai còn tệ hơn không có ghi chú.
    notes: [],
  }
}
