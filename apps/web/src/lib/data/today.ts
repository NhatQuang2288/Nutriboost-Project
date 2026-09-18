import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type ActivityLevel,
  type BmiResult,
  type EnergyTargets,
  type Goal,
  type MedicalFlag,
  type SafetyAssessment,
  type ScaledNutrients,
  type Sex,
  assessSafety,
  computeBmi,
  computeEnergyTargets,
  macroDriftKcal,
  sumNutrients,
} from '@nutriboost/nutrition'

import { DEFAULT_TIMEZONE, ageFromIsoDate, localDateIn } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

/**
 * Lớp dữ liệu cho màn "Hôm nay".
 *
 * HAI chế độ, và chế độ được ghi thẳng vào kết quả qua trường `source`:
 *   • `live` — đọc từ Supabase, dùng khi có phiên và hồ sơ đã thiết lập xong.
 *   • `demo` — dữ liệu mẫu, dùng khi chưa cấu hình Supabase, hoặc khi hồ sơ chưa hoàn tất.
 *
 * Trường `source` tồn tại để giao diện nói được sự thật. Trước đây không có nó, nên một
 * người dùng đã đăng nhập vẫn thấy số liệu mẫu của "Minh" mà không có gì cho biết đó không
 * phải dữ liệu của họ.
 *
 * Mọi con số đều đi qua `@nutriboost/nutrition` — hàm thuần. Không phép tính nào ở đây do
 * model sinh ra, và mục tiêu năng lượng đọc từ `energy_targets` đã được tính phía máy chủ
 * lúc thiết lập hồ sơ.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_LABELS: Readonly<Record<MealType, string>> = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
}

export const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export interface LoggedItem {
  id: string
  nameVi: string
  grams: number
  /** Nguồn khớp: tất định, AI, hay người dùng tự nhập. Hiển thị để tạo niềm tin. */
  matchMethod: 'exact' | 'trigram' | 'ai' | 'user'
  nutrients: ScaledNutrients
}

export interface LoggedMeal {
  id: string
  mealType: MealType
  timeLabel: string
  source: 'ai_chat' | 'quick_chip' | 'repeat' | 'manual'
  items: LoggedItem[]
  total: ScaledNutrients
}

export interface DailyInsight {
  headline: string
  action: string
  severity: 'info' | 'warning' | 'refer'
}

export interface TodayView {
  localDate: string
  /** `demo` = dữ liệu mẫu. Giao diện phải nói rõ điều này. */
  source: 'demo' | 'live'
  profile: {
    fullName: string
    sex: Sex
    age: number
    heightCm: number
    weightKg: number
    goal: Goal
    activityLevel: ActivityLevel
  }
  targets: EnergyTargets
  bmi: BmiResult
  safety: SafetyAssessment
  meals: LoggedMeal[]
  consumed: ScaledNutrients
  kcalBurned: number
  remainingKcal: number
  streakDays: number
  insight: DailyInsight
  isEmpty: boolean
}

/* ---------------------------------------------------------------------------
 * Đọc dữ liệu thật
 * ------------------------------------------------------------------------- */

export async function getTodayView(now: Date = new Date()): Promise<TodayView> {
  const live = await readLiveView(now)
  return live ?? buildDemoView(now)
}

/**
 * Trả về `null` khi không đọc được dữ liệu thật, và nơi gọi rơi về dữ liệu mẫu.
 *
 * Bốn điều kiện phải cùng đúng: đã cấu hình Supabase, có phiên, hồ sơ sức khoẻ đã có, và có
 * ít nhất một lần đo cân nặng. Thiếu cân nặng thì không tính được BMR — và bịa một con số
 * ở đây sẽ làm mọi thứ phía sau sai theo.
 */
async function readLiveView(now: Date): Promise<TodayView | null> {
  const user = await getSessionUser()
  if (user === null) return null

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return null

  const timezone = await readTimezone(supabase, user.id)
  const localDate = localDateIn(timezone, now)

  const [health, metric, storedTargets, meals, kcalBurned, streakDays] = await Promise.all([
    readHealthProfile(supabase, user.id),
    readLatestWeight(supabase, user.id),
    readStoredTargets(supabase, user.id, localDate),
    readMeals(supabase, user.id, localDate, timezone),
    readKcalBurned(supabase, user.id, localDate),
    readStreak(supabase, user.id, localDate),
  ])

  if (health === null || metric === null) return null

  const age = ageFromIsoDate(health.dateOfBirth, localDate)

  // Mục tiêu đọc từ CSDL khi có: đó là con số đã cam kết với người dùng lúc thiết lập, và
  // tính lại bằng công thức hiện hành có thể ra số khác nếu hằng số dinh dưỡng đổi.
  const targets =
    storedTargets ??
    computeEnergyTargets({
      weightKg: metric,
      heightCm: health.heightCm,
      age,
      sex: health.sex,
      activityLevel: health.activityLevel,
      goal: health.goal,
      rateKgPerWeek: health.rateKgPerWeek,
    })

  const bmi = computeBmi(metric, health.heightCm, 'asia')
  const safety = assessSafety({
    bmi: bmi.bmi,
    age,
    goal: health.goal,
    medicalFlags: health.medicalFlags,
  })

  const consumed = sumNutrients(meals.map((meal) => meal.total))

  return {
    localDate,
    source: 'live',
    profile: {
      fullName: health.fullName,
      sex: health.sex,
      age,
      heightCm: health.heightCm,
      weightKg: metric,
      goal: health.goal,
      activityLevel: health.activityLevel,
    },
    targets,
    bmi,
    safety,
    meals,
    consumed,
    kcalBurned,
    remainingKcal: targets.targetKcal + kcalBurned - consumed.kcal,
    streakDays,
    insight: buildInsight(consumed, targets),
    isEmpty: meals.length === 0,
  }
}

interface LiveHealthProfile {
  fullName: string
  sex: Sex
  dateOfBirth: string
  heightCm: number
  activityLevel: ActivityLevel
  goal: Goal
  rateKgPerWeek: number
  medicalFlags: MedicalFlag[]
}

async function readTimezone(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('timezone, full_name')
    .eq('id', userId)
    .maybeSingle()

  const row = data as { timezone: string | null } | null
  return row?.timezone ?? DEFAULT_TIMEZONE
}

async function readHealthProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<LiveHealthProfile | null> {
  const [{ data: profile }, { data: health }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase
      .from('health_profiles')
      .select(
        'sex, date_of_birth, height_cm, activity_level, goal, rate_kg_per_week, medical_flags',
      )
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (health === null) return null

  const healthRow = health as {
    sex: Sex
    date_of_birth: string
    height_cm: number | string
    activity_level: ActivityLevel
    goal: Goal
    rate_kg_per_week: number | string
    medical_flags: MedicalFlag[]
  }
  const profileRow = profile as { full_name: string | null } | null

  return {
    // Chưa đặt tên thì gọi bằng "bạn" — không bịa một cái tên nào.
    fullName: profileRow?.full_name ?? 'bạn',
    sex: healthRow.sex,
    dateOfBirth: String(healthRow.date_of_birth).slice(0, 10),
    heightCm: Number(healthRow.height_cm),
    activityLevel: healthRow.activity_level,
    goal: healthRow.goal,
    rateKgPerWeek: Number(healthRow.rate_kg_per_week),
    medicalFlags: healthRow.medical_flags ?? [],
  }
}

/** Cân nặng mới nhất. `numeric` trả về dạng chuỗi qua PostgREST nên phải đổi. */
async function readLatestWeight(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('body_metrics')
    .select('weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data === null) return null
  const weight = Number((data as { weight_kg: number | string }).weight_kg)
  return Number.isFinite(weight) && weight > 0 ? weight : null
}

async function readStoredTargets(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
): Promise<EnergyTargets | null> {
  const { data } = await supabase
    .from('energy_targets')
    .select('bmr_kcal, tdee_kcal, target_kcal, protein_g, carb_g, fat_g, formula_version')
    .eq('user_id', userId)
    .lte('effective_from', localDate)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data === null) return null

  const row = data as {
    bmr_kcal: number
    tdee_kcal: number
    target_kcal: number
    protein_g: number
    carb_g: number
    fat_g: number
    formula_version: string
  }

  return {
    bmrKcal: row.bmr_kcal,
    tdeeKcal: row.tdee_kcal,
    targetKcal: row.target_kcal,
    proteinG: row.protein_g,
    carbG: row.carb_g,
    fatG: row.fat_g,
    formulaVersion: row.formula_version,
    /*
     * Độ lệch giữa mục tiêu kcal và năng lượng suy ra từ macro đã làm tròn. Không lưu trong
     * CSDL vì nó suy ra được từ ba con số đã lưu — tính lại ở đây thì không có hai nguồn sự
     * thật, và đổi cách làm tròn là mọi hồ sơ nhận kết quả mới ngay.
     */
    macroDriftKcal: macroDriftKcal(row.target_kcal, {
      proteinG: row.protein_g,
      carbG: row.carb_g,
      fatG: row.fat_g,
    }),
    // `floorsApplied` chỉ dùng để giải thích cho người dùng, và nó đã được ghi kèm ở
    // `energy_targets.inputs`. Đọc lại toàn bộ ở đây là thừa cho màn "Hôm nay".
    floorsApplied: [],
  }
}

interface DayMealRow {
  id: string
  mealType: MealType
  eatenAt: string
  items: {
    id: string
    displayName: string
    grams: number | string
    kcal: number | string
    proteinG: number | string
    carbG: number | string
    fatG: number | string
    fiberG: number | string
    sugarG: number | string
    sodiumMg: number | string
    matchMethod: LoggedItem['matchMethod']
  }[]
}

async function readMeals(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
  timezone: string,
): Promise<LoggedMeal[]> {
  // Một lời gọi trả về bữa ăn kèm món: màn này luôn cần cả hai, nên gộp ở CSDL thay vì N+1.
  const { data } = await supabase.rpc('read_day_meals', {
    p_user_id: userId,
    p_local_date: localDate,
  })

  const rows = (data ?? []) as DayMealRow[]

  return rows.map((meal) => {
    const items: LoggedItem[] = meal.items.map((item) => ({
      id: item.id,
      nameVi: item.displayName,
      grams: Number(item.grams),
      matchMethod: item.matchMethod,
      nutrients: {
        kcal: Number(item.kcal),
        proteinG: Number(item.proteinG),
        carbG: Number(item.carbG),
        fatG: Number(item.fatG),
        fiberG: Number(item.fiberG),
        sugarG: Number(item.sugarG),
        sodiumMg: Number(item.sodiumMg),
      },
    }))

    return {
      id: meal.id,
      mealType: meal.mealType,
      timeLabel: formatTime(meal.eatenAt, timezone),
      source: 'ai_chat',
      items,
      total: sumNutrients(items.map((item) => item.nutrients)),
    }
  })
}

async function readKcalBurned(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
): Promise<number> {
  const { data } = await supabase
    .from('activity_logs')
    .select('kcal_burned')
    .eq('user_id', userId)
    .eq('local_date', localDate)

  return ((data ?? []) as { kcal_burned: number }[]).reduce(
    (sum, row) => sum + Number(row.kcal_burned),
    0,
  )
}

/**
 * Chuỗi ngày ghi nhật ký liên tiếp.
 *
 * Đọc hàng `daily_summaries` gần nhất **tính đến hôm nay**, chứ không đọc đúng hàng của hôm
 * nay: hàng của hôm nay chỉ tồn tại sau khi có món đầu tiên được ghi, nên đọc đúng ngày sẽ
 * trả về 0 cho tới lúc người dùng ghi món — đúng lúc họ cần thấy chuỗi ngày của mình nhất.
 */
async function readStreak(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
): Promise<number> {
  const { data } = await supabase
    .from('daily_summaries')
    .select('streak_days')
    .eq('user_id', userId)
    .lte('local_date', localDate)
    .order('local_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data === null) return 0
  return (data as { streak_days: number }).streak_days
}

/** Giờ địa phương dạng `HH:mm`, dùng chung một cách hiển thị với dữ liệu mẫu. */
function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/**
 * Nhận xét trong ngày — tất định, không gọi AI.
 *
 * Cùng lý do với bộ dựng thực đơn: màn "Hôm nay" mở ra mỗi ngày nên nhận xét phải luôn có,
 * kể cả khi hết hạn mức AI hay mất mạng. Bản do AI viết, khi có, sẽ thay thế phần này.
 */
function buildInsight(consumed: ScaledNutrients, targets: EnergyTargets): DailyInsight {
  const proteinRatio = targets.proteinG > 0 ? consumed.proteinG / targets.proteinG : 1

  if (consumed.kcal === 0) {
    return {
      headline: 'Hôm nay bạn chưa ghi bữa nào.',
      action: 'Kể cho Bơ một bữa bạn vừa ăn, mình ghi lại giúp.',
      severity: 'info',
    }
  }

  if (proteinRatio < 0.6) {
    return {
      headline: 'Hôm nay bạn đang thiếu đạm so với mục tiêu.',
      action: `Còn thiếu khoảng ${Math.max(0, Math.round(targets.proteinG - consumed.proteinG))} g đạm. Thêm một hộp sữa chua hoặc 100 g ức gà là gần đủ.`,
      severity: 'info',
    }
  }

  if (consumed.kcal > targets.targetKcal) {
    return {
      headline: 'Hôm nay bạn đã vượt mục tiêu năng lượng.',
      action: `Vượt ${consumed.kcal - targets.targetKcal} kcal. Đi bộ 30 phút hoặc bữa tối nhẹ hơn là đủ để cân lại.`,
      severity: 'warning',
    }
  }

  return {
    headline: 'Bạn đang đi đúng hướng.',
    action: 'Giữ nhịp này tới hết ngày là đạt mục tiêu.',
    severity: 'info',
  }
}

/* ---------------------------------------------------------------------------
 * Dữ liệu mẫu
 * ------------------------------------------------------------------------- */

interface MockFood {
  id: string
  nameVi: string
  grams: number
  matchMethod: LoggedItem['matchMethod']
  per100g: {
    kcal: number
    proteinG: number
    carbG: number
    fatG: number
    fiberG?: number
    sodiumMg?: number
  }
}

const MOCK_PROFILE = {
  fullName: 'Minh',
  sex: 'male' as Sex,
  birthYear: 1994,
  heightCm: 172,
  weightKg: 74,
  activityLevel: 'light' as ActivityLevel,
  goal: 'lose' as Goal,
  rateKgPerWeek: 0.35,
  medicalFlags: [] as MedicalFlag[],
}

const MOCK_MEALS: { mealType: MealType; timeLabel: string; items: MockFood[] }[] = [
  {
    mealType: 'breakfast',
    timeLabel: '07:15',
    items: [
      {
        id: 'pho-bo',
        nameVi: 'Phở bò',
        grams: 500,
        matchMethod: 'trigram',
        per100g: { kcal: 92, proteinG: 5.4, carbG: 11.8, fatG: 2.8, fiberG: 0.6, sodiumMg: 420 },
      },
      {
        id: 'ca-phe-sua-da',
        nameVi: 'Cà phê sữa đá',
        grams: 200,
        matchMethod: 'ai',
        per100g: { kcal: 55, proteinG: 1.2, carbG: 9.5, fatG: 1.4, sodiumMg: 25 },
      },
    ],
  },
  {
    mealType: 'lunch',
    timeLabel: '12:05',
    items: [
      {
        id: 'com-tam',
        nameVi: 'Cơm tấm sườn',
        grams: 420,
        matchMethod: 'ai',
        per100g: { kcal: 168, proteinG: 7.6, carbG: 24.2, fatG: 4.6, fiberG: 0.9, sodiumMg: 380 },
      },
      {
        id: 'canh-rau',
        nameVi: 'Canh rau ngót',
        grams: 250,
        matchMethod: 'trigram',
        per100g: { kcal: 22, proteinG: 1.4, carbG: 2.8, fatG: 0.5, fiberG: 1.6, sodiumMg: 210 },
      },
    ],
  },
  {
    mealType: 'snack',
    timeLabel: '16:40',
    items: [
      {
        id: 'sua-chua',
        nameVi: 'Sữa chua không đường',
        grams: 100,
        matchMethod: 'exact',
        per100g: { kcal: 61, proteinG: 4.1, carbG: 5.4, fatG: 2.6, sodiumMg: 45 },
      },
    ],
  },
]

const MOCK_ACTIVITY = [{ code: 'walking', minutes: 35, met: 3.5 }]

export function buildDemoView(now: Date = new Date()): TodayView {
  const localDate = localDateIn(DEFAULT_TIMEZONE, now)
  const age = Math.max(0, now.getFullYear() - MOCK_PROFILE.birthYear)

  // Mọi con số đều đi qua lõi tất định — không có phép tính nào do AI sinh ra.
  const targets = computeEnergyTargets({
    weightKg: MOCK_PROFILE.weightKg,
    heightCm: MOCK_PROFILE.heightCm,
    age,
    sex: MOCK_PROFILE.sex,
    activityLevel: MOCK_PROFILE.activityLevel,
    goal: MOCK_PROFILE.goal,
    rateKgPerWeek: MOCK_PROFILE.rateKgPerWeek,
  })

  const bmi = computeBmi(MOCK_PROFILE.weightKg, MOCK_PROFILE.heightCm, 'asia')

  const safety = assessSafety({
    bmi: bmi.bmi,
    age,
    goal: MOCK_PROFILE.goal,
    medicalFlags: MOCK_PROFILE.medicalFlags,
  })

  const meals: LoggedMeal[] = MOCK_MEALS.map((meal, index) => {
    const items: LoggedItem[] = meal.items.map((food) => ({
      id: food.id,
      nameVi: food.nameVi,
      grams: food.grams,
      matchMethod: food.matchMethod,
      nutrients: {
        kcal: Math.round((food.per100g.kcal * food.grams) / 100),
        proteinG: round1((food.per100g.proteinG * food.grams) / 100),
        carbG: round1((food.per100g.carbG * food.grams) / 100),
        fatG: round1((food.per100g.fatG * food.grams) / 100),
        fiberG: round1(((food.per100g.fiberG ?? 0) * food.grams) / 100),
        sugarG: 0,
        sodiumMg: Math.round(((food.per100g.sodiumMg ?? 0) * food.grams) / 100),
      },
    }))
    return {
      id: `meal-${index}`,
      mealType: meal.mealType,
      timeLabel: meal.timeLabel,
      source: 'ai_chat',
      items,
      total: sumNutrients(items.map((item) => item.nutrients)),
    }
  })

  const consumed = sumNutrients(meals.map((meal) => meal.total))
  const kcalBurned = MOCK_ACTIVITY.reduce(
    (sum, entry) =>
      sum + Math.round((entry.met * 3.5 * MOCK_PROFILE.weightKg * entry.minutes) / 200),
    0,
  )

  return {
    localDate,
    source: 'demo',
    profile: {
      fullName: MOCK_PROFILE.fullName,
      sex: MOCK_PROFILE.sex,
      age,
      heightCm: MOCK_PROFILE.heightCm,
      weightKg: MOCK_PROFILE.weightKg,
      goal: MOCK_PROFILE.goal,
      activityLevel: MOCK_PROFILE.activityLevel,
    },
    targets,
    bmi,
    safety,
    meals,
    consumed,
    kcalBurned,
    remainingKcal: targets.targetKcal + kcalBurned - consumed.kcal,
    streakDays: 4,
    insight: {
      headline: 'Hôm nay bạn đang thiếu đạm so với mục tiêu.',
      action: 'Thêm một hộp sữa chua hoặc 100 g ức gà vào bữa tối là đủ.',
      severity: 'info',
    },
    isEmpty: meals.length === 0,
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
