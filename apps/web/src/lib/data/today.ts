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
  scaleNutrients,
  sumNutrients,
} from '@nutriboost/nutrition'

import { DEFAULT_TIMEZONE, ageAt, localDateIn } from '@/lib/date'

/**
 * Lớp dữ liệu cho màn "Hôm nay".
 *
 * HIỆN TẠI ĐỌC TỪ DỮ LIỆU MẪU.
 * Đây là chủ ý trong Tuần 0 của lộ trình (docs/roles.md): TV4 và TV5 phải dựng được
 * toàn bộ giao diện trước khi Supabase sẵn sàng. Khi nối CSDL thật, chỉ thay phần
 * đọc dữ liệu ở cuối file; mọi con số vẫn đi qua `@nutriboost/nutrition`.
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

/**
 * Số liệu tham chiếu theo *Bảng thành phần dinh dưỡng thực phẩm Việt Nam*
 * (Bộ Y tế / Viện Dinh dưỡng). Đây là dữ liệu mẫu để dựng giao diện,
 * chưa phải bộ dữ liệu đã kiểm định.
 */
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

/* ---------------------------------------------------------------------------
 * Điểm đọc dữ liệu
 * ------------------------------------------------------------------------- */

export function getTodayView(now: Date = new Date()): TodayView {
  const localDate = localDateIn(DEFAULT_TIMEZONE, now)
  const age = ageAt(MOCK_PROFILE.birthYear, now)

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
      nutrients: scaleNutrients(food.per100g, food.grams),
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
