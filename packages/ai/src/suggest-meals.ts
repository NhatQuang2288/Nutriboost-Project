import type { MealType } from '@nutriboost/db'
import type { SafetyAssessment } from '@nutriboost/nutrition'

import type { MealCatalogueEntry } from './meal-estimator'
import { MEAL_SHARE, scaleDishToTarget } from './plan-builder'

/**
 * Gợi ý món theo lượng kcal còn lại và mục tiêu cân nặng — TẤT ĐỊNH, không gọi AI.
 *
 * Model chỉ làm hai việc ở phía trước: hiểu câu của khách thành bộ lọc có cấu trúc
 * (`SuggestFilters`), và diễn giải kết quả. Việc chọn món, chọn khẩu phần và mọi con số
 * đều ở đây, nên cùng đầu vào luôn cho cùng danh sách và model không thể bịa calo.
 */

export type SuggestGoal = 'lose' | 'maintain' | 'gain'

export interface SuggestFilters {
  /** Trần kcal của MỘT khẩu phần được gợi ý. */
  maxKcal?: number
  minProteinG?: number
  maxFatG?: number
  /** Từ khoá nhóm món hoặc tên món phải khớp ("bún", "cháo", "canh"). Khớp một trong số đó. */
  categories?: readonly string[]
  /** Món phải có TẤT CẢ các từ này (trong tên hoặc nguyên liệu). */
  include?: readonly string[]
  /** Món không được có BẤT KỲ từ nào trong số này (dị ứng, kiêng). */
  exclude?: readonly string[]
  vegetarian?: boolean
  /**
   * Ưu tiên (không loại trừ): món khớp một trong các từ này được cộng điểm. Dùng cho ngữ cảnh mềm
   * như "trời mưa" → món nước nóng — loại hết món khác thì danh sách có thể rỗng hoặc đơn điệu.
   */
  prefer?: readonly string[]
  /** Lý do ưu tiên, hiện trên thẻ gợi ý: "trời mưa nên ưu tiên món nước nóng". */
  preferLabel?: string
}

export interface MealSuggestion {
  slug: string
  nameVi: string
  category: string | null
  servingName: string | null
  /** Khối lượng gợi ý, đã co giãn cho vừa ngân sách kcal. */
  grams: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  reason: string
}

export interface SuggestMealsInput {
  catalogue: readonly MealCatalogueEntry[]
  goal: SuggestGoal
  /** Ngân sách kcal cho bữa đang xét. */
  budgetKcal: number
  filters?: SuggestFilters
  limit?: number
  /** Món đã gợi ý rồi — dùng khi khách bấm "gợi ý món khác". */
  skipSlugs?: readonly string[]
}

export interface SuggestMealsResult {
  suggestions: MealSuggestion[]
  budgetKcal: number
  /** Điều cần nói thẳng với khách: ngân sách bị nâng, bộ lọc quá chặt, lưu ý món chay… */
  notes: string[]
  /** Bộ lọc đã áp dụng, để hiển thị lại cho khách kiểm tra. */
  appliedFilters: string[]
}

/** Ngân sách kcal tối thiểu để còn gợi ý được một món nhẹ. */
const MIN_BUDGET_KCAL = 150

/** Điểm cộng khi món hợp ngữ cảnh khách nêu (trời mưa, trời nóng…). */
const PREFER_BONUS = 0.3

/** Giảm cân thì nhắm thấp hơn ngân sách một chút: dùng hết sạch kcal còn lại không phải mục tiêu. */
const LOSE_TARGET_SHARE = 0.85

/** Mỗi nhóm món tối đa bấy nhiêu món trong danh sách, để không toàn cơm tấm hay toàn bún. */
const MAX_PER_CATEGORY = 2

/** Một bữa hiếm khi vượt tỉ lệ này của mục tiêu cả ngày. */
const MAX_SINGLE_MEAL_SHARE = 0.45

export const SERVING_BOUNDS: Readonly<Record<SuggestGoal, readonly [number, number]>> = {
  lose: [0.5, 1.2],
  maintain: [0.5, 1.5],
  gain: [0.75, 2],
}

/**
 * Ngân sách kcal cho một lần gợi ý.
 *
 * Có chỉ định bữa thì lấy phần của bữa đó, nhưng không vượt số kcal còn lại. Không chỉ định
 * thì coi như một bữa còn lại trong ngày, tối đa 45 % mục tiêu — để "còn 1.500 kcal" không
 * thành một bữa 1.500 kcal.
 */
export function mealBudgetKcal(input: {
  remainingKcal: number
  targetKcal: number
  mealType?: MealType
}): number {
  const remaining = Math.max(0, input.remainingKcal)
  const share = input.mealType === undefined ? MAX_SINGLE_MEAL_SHARE : MEAL_SHARE[input.mealType]
  return Math.round(Math.min(remaining, input.targetKcal * share))
}

/* ------------------------------------------------------------------------- */
/* Từ khoá loại trừ                                                           */
/* ------------------------------------------------------------------------- */

const SEAFOOD = [
  'hải sản',
  'cá',
  'tôm',
  'cua',
  'ghẹ',
  'mực',
  'sò',
  'ốc',
  'nghêu',
  'ngao',
  'hến',
  'tép',
  'bạch tuộc',
  'sứa',
  'cá linh',
  // Lươn và chạch là cá nhưng tên không có chữ "cá".
  'lươn',
  'chạch',
]

const MEAT = [
  'thịt',
  'bò',
  'heo',
  'lợn',
  'gà',
  'vịt',
  'ngan',
  'sườn',
  'giò',
  'chả',
  'nem',
  'lòng',
  'tiết',
  'gan',
  'chim',
  'bồ câu',
  'dê',
  'ba chỉ',
  'ba rọi',
  'mọc',
  'xá xíu',
  'lạp xưởng',
  'nạm',
  'bì',
  'chân giò',
  'dồi',
  'pate',
  'lươn',
  'chạch',
  'ếch',
  'chà bông',
  'ruốc',
  'tim',
  'cật',
  'phèo',
  'dạ dày',
]

const FERMENTED_FISH = ['mắm tôm', 'mắm cá', 'mắm ruốc', 'mắm nêm', 'mắm tép', 'mắm thái']

/**
 * Khoá (đã bỏ dấu) → các từ CÓ DẤU cần tìm.
 *
 * Phải khớp có dấu vì bỏ dấu làm "cá" trùng "cà" (cà chua) và "cả": người dùng nói
 * "không ăn cá" không muốn mất món cà chua.
 */
const KEYWORD_GROUPS: Readonly<Record<string, readonly string[]>> = {
  'hai san': SEAFOOD,
  ca: ['cá', 'lươn', 'chạch'],
  tom: ['tôm'],
  cua: ['cua', 'ghẹ'],
  muc: ['mực'],
  oc: ['ốc'],
  thit: MEAT,
  bo: ['bò'],
  'thit bo': ['bò'],
  heo: ['heo', 'lợn', 'sườn', 'ba chỉ', 'ba rọi', 'giò', 'chân giò'],
  lon: ['heo', 'lợn', 'sườn', 'ba chỉ', 'ba rọi', 'giò', 'chân giò'],
  'thit heo': ['heo', 'lợn', 'sườn', 'ba chỉ', 'ba rọi', 'giò', 'chân giò'],
  'thit lon': ['heo', 'lợn', 'sườn', 'ba chỉ', 'ba rọi', 'giò', 'chân giò'],
  ga: ['gà'],
  'thit ga': ['gà'],
  vit: ['vịt'],
  trung: ['trứng'],
  sua: ['sữa'],
  lac: ['đậu phộng', 'lạc'],
  'dau phong': ['đậu phộng', 'lạc'],
  'dau hu': ['đậu hũ', 'đậu hủ', 'đậu phụ'],
  mam: FERMENTED_FISH,
}

/** Nhãn hiển thị có dấu cho từ khoá đã bỏ dấu ("thit" → "thịt"), để thẻ gợi ý không hiện chữ cụt. */
const KEYWORD_LABELS: Readonly<Record<string, string>> = {
  'hai san': 'hải sản',
  ca: 'cá',
  tom: 'tôm',
  cua: 'cua',
  muc: 'mực',
  oc: 'ốc',
  thit: 'thịt',
  bo: 'bò',
  'thit bo': 'thịt bò',
  heo: 'heo',
  'thit heo': 'thịt heo',
  lon: 'lợn',
  'thit lon': 'thịt lợn',
  ga: 'gà',
  'thit ga': 'thịt gà',
  vit: 'vịt',
  trung: 'trứng',
  sua: 'sữa',
  lac: 'lạc',
  'dau phong': 'đậu phộng',
  'dau hu': 'đậu hũ',
  mam: 'mắm',
  bun: 'bún',
  pho: 'phở',
  'pho bo': 'phở bò',
  chao: 'cháo',
  com: 'cơm',
  xoi: 'xôi',
  lau: 'lẩu',
  canh: 'canh',
  rau: 'rau',
  mien: 'miến',
  'hu tieu': 'hủ tiếu',
  cuon: 'cuốn',
  goi: 'gỏi',
  che: 'chè',
  kho: 'kho',
  'trang mieng': 'tráng miệng',
  'an vat': 'ăn vặt',
}

function label(keyword: string): string {
  return KEYWORD_LABELS[fold(keyword)] ?? keyword
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Chuỗi chữ thường GIỮ DẤU, ký tự lạ thành dấu cách, bọc dấu cách hai đầu để so khớp theo từ. */
function accented(value: string): string {
  return ` ${value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `
}

function haystack(entry: MealCatalogueEntry): { accented: string; folded: string } {
  const parts = [
    entry.nameVi,
    entry.category ?? '',
    ...(entry.components ?? []).map((component) => component.name),
  ].join(' | ')
  return { accented: accented(parts), folded: ` ${fold(parts)} ` }
}

function matchesKeyword(text: { accented: string; folded: string }, keyword: string): boolean {
  const group = KEYWORD_GROUPS[fold(keyword)]
  if (group !== undefined) {
    return group.some((word) => text.accented.includes(accented(word)))
  }
  const folded = fold(keyword)
  if (folded.length === 0) return false
  // Từ do khách đặt tên riêng: so không dấu, theo từ nguyên vẹn.
  return text.folded.includes(` ${folded} `)
}

/* ------------------------------------------------------------------------- */
/* Chấm điểm                                                                  */
/* ------------------------------------------------------------------------- */

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function goalScore(
  goal: SuggestGoal,
  entry: MealCatalogueEntry,
  kcal: number,
  proteinG: number,
  fatG: number,
) {
  const proteinShare = kcal > 0 ? (proteinG * 4) / kcal : 0
  const fatShare = kcal > 0 ? (fatG * 9) / kcal : 0
  const density = entry.kcalPer100g / 100 // kcal trên mỗi gram

  if (goal === 'lose') {
    // Nhiều đạm, mật độ năng lượng thấp: no lâu mà ít kcal.
    return 0.5 * clamp01(proteinShare / 0.3) + 0.5 * (1 - clamp01(density / 2.5))
  }
  if (goal === 'gain') {
    // Đậm đặc năng lượng, vẫn đủ đạm để tăng cơ chứ không chỉ tăng mỡ.
    return 0.5 * clamp01(density / 2) + 0.5 * clamp01(proteinShare / 0.25)
  }
  // Giữ cân: cân đối quanh 20 % đạm, 30 % béo.
  return clamp01(1 - (Math.abs(proteinShare - 0.2) + Math.abs(fatShare - 0.3)))
}

function reasonFor(
  goal: SuggestGoal,
  proteinShare: number,
  density: number,
  kcal: number,
  budget: number,
): string {
  const protein = `${Math.round(proteinShare * 100)} % năng lượng từ đạm`
  const fits = `${kcal} kcal, vừa với ${budget} kcal còn lại`
  if (goal === 'lose') {
    return `${fits}; ${protein}${density <= 1.2 ? ', ít năng lượng trên mỗi gram nên no lâu' : ''}.`
  }
  if (goal === 'gain') {
    return `${fits}; ${protein}${density >= 1.5 ? ', giàu năng lượng để dễ tăng cân' : ''}.`
  }
  return `${fits}; ${protein}, cân đối.`
}

/* ------------------------------------------------------------------------- */

export function suggestMeals(input: SuggestMealsInput): SuggestMealsResult {
  const notes: string[] = []
  const applied: string[] = []
  const filters = input.filters ?? {}
  const limit = Math.min(8, Math.max(1, input.limit ?? 5))
  const skip = new Set(input.skipSlugs ?? [])

  let budget = Math.round(input.budgetKcal)
  if (!Number.isFinite(budget) || budget < MIN_BUDGET_KCAL) {
    budget = MIN_BUDGET_KCAL
    notes.push(
      'Hôm nay bạn gần đủ hoặc đã đủ kcal mục tiêu, nên mình chỉ gợi ý những món nhẹ khoảng ' +
        `${MIN_BUDGET_KCAL} kcal.`,
    )
  }

  const [minBound, maxBound] = SERVING_BOUNDS[input.goal]
  const exclude = [...(filters.exclude ?? [])]
  if (filters.vegetarian === true) {
    exclude.push('thịt', 'hải sản', 'mắm')
    applied.push('món chay')
    notes.push(
      'Lọc món chay dựa trên tên và nguyên liệu trong danh mục; một số món có thể dùng nước mắm hoặc nước dùng xương.',
    )
  }
  for (const word of filters.exclude ?? []) applied.push(`không có ${label(word)}`)
  for (const word of filters.include ?? []) applied.push(`có ${label(word)}`)
  for (const word of filters.categories ?? []) applied.push(`nhóm ${label(word)}`)
  const prefer = filters.prefer ?? []
  if (prefer.length > 0 && filters.preferLabel !== undefined) {
    applied.push(`ưu tiên ${filters.preferLabel}`)
  }
  if (filters.maxKcal !== undefined) applied.push(`tối đa ${filters.maxKcal} kcal`)
  if (filters.minProteinG !== undefined) applied.push(`đạm từ ${filters.minProteinG} g`)
  if (filters.maxFatG !== undefined) applied.push(`béo tối đa ${filters.maxFatG} g`)

  const scored: { suggestion: MealSuggestion; score: number }[] = []

  for (const entry of input.catalogue) {
    if ((entry.kind ?? 'dish') !== 'dish' || entry.kcalPer100g <= 0) continue
    if (skip.has(entry.slug)) continue

    const text = haystack(entry)
    if (exclude.some((word) => matchesKeyword(text, word))) continue
    if ((filters.include ?? []).some((word) => !matchesKeyword(text, word))) continue
    const categories = filters.categories ?? []
    if (categories.length > 0 && !categories.some((word) => matchesKeyword(text, word))) continue

    const targetKcal = input.goal === 'lose' ? budget * LOSE_TARGET_SHARE : budget
    const item = scaleDishToTarget(entry, targetKcal, minBound, maxBound)

    // Không vừa ngân sách ngay cả ở khẩu phần nhỏ nhất thì không gợi ý.
    if (item.kcal > budget * 1.15) continue
    // Khách đặt trần riêng cho món thì tôn trọng trần đó.
    if (filters.maxKcal !== undefined && item.kcal > filters.maxKcal) continue
    if (filters.minProteinG !== undefined && item.proteinG < filters.minProteinG) continue
    if (filters.maxFatG !== undefined && item.fatG > filters.maxFatG) continue

    const proteinShare = item.kcal > 0 ? (item.proteinG * 4) / item.kcal : 0
    const fit = clamp01(1 - Math.abs(item.kcal - targetKcal) / budget)
    const bonus = prefer.some((word) => matchesKeyword(text, word)) ? PREFER_BONUS : 0
    const score =
      0.5 * fit + 0.5 * goalScore(input.goal, entry, item.kcal, item.proteinG, item.fatG) + bonus

    scored.push({
      score,
      suggestion: {
        slug: entry.slug,
        nameVi: entry.nameVi,
        category: entry.category ?? null,
        servingName: entry.servingName ?? null,
        grams: item.grams,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbG: item.carbG,
        fatG: item.fatG,
        reason: reasonFor(input.goal, proteinShare, entry.kcalPer100g / 100, item.kcal, budget),
      },
    })
  }

  // Điểm bằng nhau thì theo slug, để cùng đầu vào luôn ra cùng thứ tự.
  scored.sort((a, b) => b.score - a.score || a.suggestion.slug.localeCompare(b.suggestion.slug))

  // Chọn theo điểm nhưng mỗi nhóm món tối đa MAX_PER_CATEGORY; thiếu thì mới nới để đủ số lượng.
  const picked: MealSuggestion[] = []
  const perCategory = new Map<string, number>()
  for (const { suggestion } of scored) {
    if (picked.length >= limit) break
    const key = suggestion.category ?? ''
    if ((perCategory.get(key) ?? 0) >= MAX_PER_CATEGORY) continue
    perCategory.set(key, (perCategory.get(key) ?? 0) + 1)
    picked.push(suggestion)
  }
  for (const { suggestion } of scored) {
    if (picked.length >= limit) break
    if (!picked.includes(suggestion)) picked.push(suggestion)
  }
  const suggestions = picked

  if (suggestions.length === 0) {
    notes.push(
      applied.length > 0
        ? 'Chưa có món nào trong danh mục khớp hết các yêu cầu này. Bạn thử nới bớt một yêu cầu nhé.'
        : 'Chưa có món nào vừa với số kcal còn lại.',
    )
  }

  return { suggestions, budgetKcal: budget, notes, appliedFilters: applied }
}

/* ------------------------------------------------------------------------- */

const GOAL_TITLES: Readonly<Record<SuggestGoal, string>> = {
  lose: 'Gợi ý món cho mục tiêu giảm cân',
  maintain: 'Gợi ý món cho mục tiêu giữ cân',
  gain: 'Gợi ý món cho mục tiêu tăng cân',
}

/**
 * Chọn mục tiêu thật sự dùng để gợi ý.
 *
 * Đánh giá an toàn có quyền chặn giảm cân (BMI thấp, tuổi, cờ sức khoẻ). Khách có nói "gợi ý món
 * giảm cân" thì cũng không được gợi ý như thể được phép giảm: chuyển về giữ cân và nói rõ.
 */
export function resolveSuggestGoal(
  requested: SuggestGoal,
  safety: Pick<SafetyAssessment, 'blockWeightLoss'>,
): { goal: SuggestGoal; note: string | null } {
  if (requested === 'lose' && safety.blockWeightLoss) {
    return {
      goal: 'maintain',
      note: 'Hiện chưa nên giảm cân với chỉ số của bạn, nên mình gợi ý món cho mục tiêu giữ cân.',
    }
  }
  return { goal: requested, note: null }
}

/** Props của thẻ `meal_suggestion_card`, dùng chung cho tool và đường dự phòng. */
export function toSuggestionCard(
  goal: SuggestGoal,
  result: SuggestMealsResult,
  extraNotes: readonly string[] = [],
) {
  return {
    title: GOAL_TITLES[goal],
    goal,
    budgetKcal: result.budgetKcal,
    suggestions: result.suggestions.map((item) => ({
      foodId: item.slug,
      nameVi: item.nameVi,
      category: item.category,
      servingName: item.servingName,
      grams: item.grams,
      kcal: item.kcal,
      proteinG: item.proteinG,
      carbG: item.carbG,
      fatG: item.fatG,
      reason: item.reason,
    })),
    appliedFilters: result.appliedFilters,
    notes: [...extraNotes, ...result.notes].slice(0, 4),
  }
}
