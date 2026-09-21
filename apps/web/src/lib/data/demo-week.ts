import {
  type ActivityLevel,
  type Goal,
  type Sex,
  computeEnergyTargets,
} from '@nutriboost/nutrition'
import { buildDataset } from '@nutriboost/seed'

import { DEFAULT_TIMEZONE, formatIsoDate, localDateIn } from '../date'

/**
 * Dữ liệu mẫu **một tuần của một khách hàng**.
 *
 * Vì sao có tệp này: `/tien-do` chỉ vẽ được biểu đồ khi có ít nhất hai điểm dữ liệu. Ở chế độ
 * dữ liệu mẫu (chưa cấu hình Supabase) nhánh demo trước đây trả về mảng rỗng, nên biểu đồ
 * vĩnh viễn hiện "chưa đủ dữ liệu" — không ai nhìn thấy biểu đồ thật trong lúc phát triển.
 *
 * Ba nguyên tắc của tệp:
 *
 *   1. Con số đến từ danh mục món thật trong `@nutriboost/seed`, không phải số bịa. Nhờ vậy
 *      dữ liệu mẫu cũng đổi theo khi danh mục được sửa.
 *   2. Mục tiêu năng lượng đi qua `@nutriboost/nutrition` — hàm thuần, có test vector. Không
 *      có phép tính dinh dưỡng nào ở đây do model sinh ra.
 *   3. Không gọi `Math.random()` hay `Date.now()` bên trong: cùng một `now` cho ra đúng cùng
 *      một tuần. Test và ảnh chụp giao diện vì thế tái lập được.
 *
 * Tệp này là **nguồn sự thật duy nhất** cho tuần mẫu: `scripts/make-week.mjs` đọc chính nó để
 * nạp cùng dữ liệu đó vào Supabase thật, nên hai đường không thể lệch nhau.
 */

export const DEMO_WEEK_DAYS = 7

export type DemoMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface DemoWeekProfile {
  fullName: string
  sex: Sex
  birthYear: number
  heightCm: number
  /** Cân nặng đầu tuần; các ngày sau đi theo xu hướng quanh mốc này. */
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  rateKgPerWeek: number
}

/** Trùng hồ sơ với `MOCK_PROFILE` trong `today.ts` để màn "Hôm nay" và "Tiến độ" khớp nhau. */
export const DEMO_WEEK_PROFILE: DemoWeekProfile = {
  fullName: 'Minh',
  sex: 'male',
  birthYear: 1994,
  heightCm: 172,
  weightKg: 74.2,
  activityLevel: 'light',
  goal: 'lose',
  rateKgPerWeek: 0.35,
}

/**
 * Cân nặng 7 ngày, **cũ nhất trước**.
 *
 * Cố tình cho dao động lên xuống thay vì giảm đều: cân thật không giảm theo đường thẳng, và
 * một biểu đồ giảm đều sẽ che mất chính thứ cần kiểm tra — đường xu hướng có bám được nhiễu
 * hay không. Xu hướng ròng ở đây là −0,4 kg/tuần, gần với `rateKgPerWeek` 0,35 của hồ sơ.
 */
const WEIGHTS_KG: readonly number[] = [74.2, 74.0, 74.1, 73.9, 74.0, 73.8, 73.8]

/**
 * Hệ số khẩu phần theo ngày.
 *
 * Không có hệ số này thì ba ngày mẫu lặp lại và biểu đồ năng lượng thành ba cột giống hệt
 * nhau — trông như dữ liệu hỏng. Hệ số là hằng số, không phải ngẫu nhiên.
 */
const PORTION_FACTORS: readonly number[] = [1, 0.92, 1.06, 0.96, 1.08, 0.9, 1.02]

interface TemplateItem {
  slug: string
  grams: number
}

interface TemplateMeal {
  mealType: DemoMealType
  timeLabel: string
  /** Câu người dùng sẽ nói với Bơ, dùng làm `raw_input`. */
  rawInput: string
  items: readonly TemplateItem[]
}

interface TemplateActivity {
  code: string
  minutes: number
  met: number
}

/**
 * Ba ngày mẫu, xoay vòng qua bảy ngày.
 *
 * Món lấy từ danh mục seed (`packages/seed`) nên khối lượng và chỉ số đều có thật trong
 * `foods`; script nạp vào Supabase vì thế gắn được `meal_log_items.food_id` theo `slug`.
 */
const DAY_TEMPLATES: readonly (readonly TemplateMeal[])[] = [
  [
    {
      mealType: 'breakfast',
      timeLabel: '07:00',
      rawInput: 'Sáng nay mình ăn phở bò với cà phê sữa đá',
      items: [
        { slug: 'pho-bo', grams: 400 },
        { slug: 'ca-phe-sua-da', grams: 200 },
      ],
    },
    {
      mealType: 'lunch',
      timeLabel: '12:00',
      rawInput: 'Trưa ăn cơm tấm sườn và canh rau muống',
      items: [
        { slug: 'com-tam-suon', grams: 350 },
        { slug: 'canh-rau-muong', grams: 250 },
      ],
    },
    {
      mealType: 'snack',
      timeLabel: '16:00',
      rawInput: 'Xế chiều làm hũ sữa chua chuối',
      items: [{ slug: 'sua-chua-chuoi', grams: 130 }],
    },
    {
      mealType: 'dinner',
      timeLabel: '18:30',
      rawInput: 'Tối ăn cơm với cá basa kho và rau muống xào tỏi',
      items: [
        { slug: 'com-trang', grams: 150 },
        { slug: 'ca-basa', grams: 150 },
        { slug: 'rau-muong-xao-toi', grams: 150 },
      ],
    },
  ],
  [
    {
      mealType: 'breakfast',
      timeLabel: '07:15',
      rawInput: 'Sáng ăn bánh mì thịt, uống sinh tố chuối sữa',
      items: [
        { slug: 'banh-mi-thit', grams: 150 },
        { slug: 'sinh-to-chuoi-sua', grams: 200 },
      ],
    },
    {
      mealType: 'lunch',
      timeLabel: '12:10',
      rawInput: 'Trưa ăn bún bò Huế, thêm hai cuốn gỏi cuốn',
      items: [
        { slug: 'bun-bo-hue', grams: 380 },
        { slug: 'goi-cuon', grams: 150 },
      ],
    },
    {
      mealType: 'snack',
      timeLabel: '15:30',
      rawInput: 'Chiều luộc một củ khoai lang',
      items: [{ slug: 'khoai-lang-luoc', grams: 150 }],
    },
    {
      mealType: 'dinner',
      timeLabel: '19:00',
      rawInput: 'Tối ăn cơm gà và rau muống xào tỏi',
      items: [
        { slug: 'com-ga', grams: 300 },
        { slug: 'rau-muong-xao-toi', grams: 150 },
      ],
    },
  ],
  [
    {
      mealType: 'breakfast',
      timeLabel: '06:45',
      rawInput: 'Sáng ăn cơm rang trứng, uống sữa tươi không đường',
      items: [
        { slug: 'com-rang-trung', grams: 250 },
        { slug: 'sua-tuoi-khong-duong', grams: 200 },
      ],
    },
    {
      mealType: 'lunch',
      timeLabel: '12:20',
      rawInput: 'Trưa ăn cơm trứng với đậu hũ chiên',
      items: [
        { slug: 'com-trung', grams: 300 },
        { slug: 'dau-hu-chien', grams: 120 },
      ],
    },
    {
      mealType: 'snack',
      timeLabel: '16:15',
      rawInput: 'Chiều ăn sữa chua chuối',
      items: [{ slug: 'sua-chua-chuoi', grams: 130 }],
    },
    {
      mealType: 'dinner',
      timeLabel: '18:45',
      rawInput: 'Tối ăn cơm với thịt gà ta và canh rau muống',
      items: [
        { slug: 'com-trang', grams: 150 },
        { slug: 'thit-ga-ta', grams: 150 },
        { slug: 'canh-rau-muong', grams: 250 },
      ],
    },
  ],
]

/** Vận động theo ngày, `null` là ngày nghỉ. Cũ nhất trước. */
const ACTIVITY_BY_DAY: readonly (TemplateActivity | null)[] = [
  { code: 'walking', minutes: 35, met: 3.5 },
  null,
  { code: 'walking', minutes: 45, met: 3.5 },
  { code: 'cycling', minutes: 30, met: 6.8 },
  null,
  { code: 'walking', minutes: 40, met: 3.5 },
  { code: 'strength', minutes: 45, met: 5.0 },
]

export interface DemoWeekItem {
  slug: string
  displayName: string
  grams: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
}

export interface DemoWeekTotals {
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
}

export interface DemoWeekMeal {
  mealType: DemoMealType
  timeLabel: string
  rawInput: string
  items: readonly DemoWeekItem[]
  total: DemoWeekTotals
}

export interface DemoWeekDay {
  localDate: string
  weightKg: number
  meals: readonly DemoWeekMeal[]
  activity: TemplateActivity | null
  kcalBurned: number
  /** Tổng nạp vào của cả ngày — cũng là giá trị cột năng lượng trên biểu đồ. */
  total: DemoWeekTotals
  targetKcal: number
  /** Tỉ lệ đạt mục tiêu, `null` nếu chưa có mục tiêu. */
  adherencePct: number | null
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Danh mục tra theo `slug`, dựng lười một lần.
 *
 * Dựng ở cấp module sẽ chạy `buildDataset()` ngay khi tệp được import — kể cả ở màn không
 * dùng tới dữ liệu mẫu. Dựng lười giữ nguyên chi phí chỉ trả khi thật sự cần.
 */
let catalogue: ReadonlyMap<string, ReturnType<typeof buildDataset>['all'][number]> | null = null

function lookupFood(slug: string) {
  if (catalogue === null) {
    catalogue = new Map(buildDataset().all.map((food) => [food.slug, food]))
  }

  const food = catalogue.get(slug)
  if (food === undefined) {
    // Danh mục bị sửa mà quên cập nhật tuần mẫu: nói thẳng ra thay vì im lặng bỏ món.
    throw new Error(`Tuần mẫu tham chiếu món "${slug}" không có trong danh mục seed.`)
  }
  return food
}

/** Nhân chỉ số trên 100 g cho khối lượng thật của phần ăn. */
function scaleItem(slug: string, grams: number): DemoWeekItem {
  const food = lookupFood(slug)
  const ratio = grams / 100

  return {
    slug,
    displayName: food.nameVi,
    grams,
    kcal: Math.round(food.kcalPer100g * ratio),
    proteinG: round1(food.proteinG * ratio),
    carbG: round1(food.carbG * ratio),
    fatG: round1(food.fatG * ratio),
    fiberG: round1((food.fiberG ?? 0) * ratio),
    sugarG: round1((food.sugarG ?? 0) * ratio),
    sodiumMg: Math.round((food.sodiumMg ?? 0) * ratio),
  }
}

function sumTotals(items: readonly DemoWeekItem[]): DemoWeekTotals {
  let kcal = 0
  let proteinG = 0
  let carbG = 0
  let fatG = 0

  for (const item of items) {
    kcal += item.kcal
    proteinG += item.proteinG
    carbG += item.carbG
    fatG += item.fatG
  }

  return { kcal, proteinG: round1(proteinG), carbG: round1(carbG), fatG: round1(fatG) }
}

/** Ngày `YYYY-MM-DD` lùi `days` ngày so với hôm nay, theo giờ Việt Nam. */
function dateBackFrom(todayIso: string, days: number): string {
  const [year, month, day] = todayIso.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return todayIso

  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() - days)
  return shifted.toISOString().slice(0, 10)
}

/** Mục tiêu năng lượng của khách mẫu, tính bằng lõi tất định. */
export function demoEnergyTargets(now: Date = new Date()) {
  return computeEnergyTargets({
    weightKg: DEMO_WEEK_PROFILE.weightKg,
    heightCm: DEMO_WEEK_PROFILE.heightCm,
    age: Math.max(0, now.getFullYear() - DEMO_WEEK_PROFILE.birthYear),
    sex: DEMO_WEEK_PROFILE.sex,
    activityLevel: DEMO_WEEK_PROFILE.activityLevel,
    goal: DEMO_WEEK_PROFILE.goal,
    rateKgPerWeek: DEMO_WEEK_PROFILE.rateKgPerWeek,
  })
}

/**
 * Bảy ngày dữ liệu mẫu, **cũ nhất trước, hôm nay ở cuối**.
 *
 * `now` truyền vào được để test khoá được ngày; không truyền thì lấy giờ hệ thống.
 */
export function buildDemoWeekDays(now: Date = new Date()): DemoWeekDay[] {
  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const targets = demoEnergyTargets(now)
  const days: DemoWeekDay[] = []

  for (let index = 0; index < DEMO_WEEK_DAYS; index += 1) {
    const template = DAY_TEMPLATES[index % DAY_TEMPLATES.length]
    const factor = PORTION_FACTORS[index] ?? 1
    const weightKg = WEIGHTS_KG[index] ?? DEMO_WEEK_PROFILE.weightKg

    if (template === undefined) continue

    const meals: DemoWeekMeal[] = template.map((meal) => {
      // Khẩu phần chính đổi theo ngày; món phụ giữ nguyên để bữa ăn vẫn ra hồn.
      const items = meal.items.map((item) => scaleItem(item.slug, Math.round(item.grams * factor)))
      return {
        mealType: meal.mealType,
        timeLabel: meal.timeLabel,
        rawInput: meal.rawInput,
        items,
        total: sumTotals(items),
      }
    })

    const total = sumTotals(meals.flatMap((meal) => meal.items))
    const activity = ACTIVITY_BY_DAY[index] ?? null
    const kcalBurned =
      activity === null ? 0 : Math.round((activity.met * 3.5 * weightKg * activity.minutes) / 200)

    days.push({
      localDate: dateBackFrom(today, DEMO_WEEK_DAYS - 1 - index),
      weightKg,
      meals,
      activity,
      kcalBurned,
      total,
      targetKcal: targets.targetKcal,
      adherencePct: targets.targetKcal > 0 ? round1((total.kcal * 100) / targets.targetKcal) : null,
    })
  }

  return days
}

/**
 * Hình dạng mà `/tien-do` cần, dựng từ tuần mẫu ở trên.
 *
 * Nhãn dùng `formatIsoDate` — **cùng hàm** mà nhánh dữ liệu thật dùng, nên biểu đồ ở hai chế
 * độ không lệch nhau về cách viết ngày.
 */
export function buildDemoProgress(now: Date = new Date()): {
  weights: { label: string; value: number }[]
  kcal: { label: string; value: number }[]
  targetKcal: number
} {
  const days = buildDemoWeekDays(now)

  return {
    weights: days.map((day) => ({ label: formatIsoDate(day.localDate), value: day.weightKg })),
    kcal: days.map((day) => ({ label: formatIsoDate(day.localDate), value: day.total.kcal })),
    targetKcal: demoEnergyTargets(now).targetKcal,
  }
}
