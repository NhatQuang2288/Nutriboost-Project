import type { MealType } from '@nutriboost/db'
import { normalizeVi } from '@nutriboost/nutrition'

import type { MealEstimator } from './meal-estimator'
import type { SuggestFilters, SuggestGoal } from './suggest-meals'

/**
 * Nhận diện ý định của một câu chat — TẤT ĐỊNH, không gọi AI.
 *
 * Tồn tại vì đường dự phòng (khi chưa có khoá AI, hết hạn mức hay model hỏng) từng coi MỌI câu
 * là một bữa ăn cần ghi. Hỏi "bạn có đề xuất món gì cho hôm nay không" nhận lại "mình chưa nhận
 * ra món nào trong câu này" — người dùng thấy Bơ vô dụng. Có bộ nhận diện này, các câu hỏi gợi ý,
 * hỏi thành phần và hỏi còn bao nhiêu kcal vẫn được trả lời mà không cần model.
 *
 * Cố ý bảo thủ: không chắc thì rơi về `meal` như trước, để không làm hỏng luồng ghi bữa ăn.
 */

export type ChatIntent =
  | {
      kind: 'suggest'
      mealType?: MealType
      goal?: SuggestGoal
      filters: SuggestFilters
    }
  | { kind: 'detail'; slug: string; grams?: number }
  | { kind: 'remaining' }
  | { kind: 'meal' }

const SUGGEST_TRIGGERS = [
  'goi y',
  'de xuat',
  'tu van',
  'nen an gi',
  'an gi',
  'mon nao',
  'mon gi',
  'an mon gi',
  'cho minh mon',
  'cho toi mon',
]

/**
 * Câu nói ý MUỐN ăn ("nay tôi muốn ăn thịt") — nhờ tư vấn chứ không phải kể một bữa đã ăn.
 * Phần đứng sau cụm này là thứ khách đang thèm, và thành bộ lọc cho gợi ý.
 *
 * Không đưa "thêm" vào: "thêm cơm" là ghi bữa ăn. Không có "thèm" không dấu vì trùng "thêm".
 */
const DESIRE_LEAD = /(?:^|\s)(?:muon an|thich an|them an|dinh an|can an|hay la an)(?:\s+(.*))?$/

/** Món khách thèm theo nhóm chứ không theo tên: ánh xạ sang nhóm món trong danh mục. */
const CRAVING_CATEGORIES: Readonly<Record<string, readonly string[]>> = {
  'do ngot': ['trang mieng', 'an vat', 'che'],
  'do an vat': ['an vat'],
  'trang mieng': ['trang mieng'],
  'mon nuoc': ['bun', 'pho', 'canh', 'chao', 'mien', 'hu tieu', 'lau'],
  'do nuoc': ['bun', 'pho', 'canh', 'chao', 'mien', 'hu tieu', 'lau'],
  'mon kho': ['kho'],
}

const DESIRE_STOPWORDS = new Set([
  'nay',
  'hom',
  'toi',
  'mon',
  'gi',
  'nao',
  'nhe',
  'nha',
  'nhi',
  'di',
  'mot',
  'chut',
  'it',
  'nua',
  'that',
  'la',
  'khong',
  'duoc',
  'qua',
  'lam',
  'luon',
  'ngay',
  'bay',
  'gio',
])

const DETAIL_TRIGGERS = [
  'nguyen lieu',
  'thanh phan',
  'gom gi',
  'gom nhung gi',
  'lam tu',
  'dinh duong cua',
  'chi tiet',
  'bao nhieu calo',
  'bao nhieu kcal',
  'bao nhieu dam',
  'calo cua',
  'kcal cua',
]

/** Phải đứng ngay sau "món" thì mới là nhóm món; "cơm"/"cá"/"gỏi" riêng lẻ quá dễ trùng chữ khác. */
const CATEGORY_AFTER_MON: Readonly<Record<string, readonly string[]>> = {
  com: ['com'],
  ca: ['ca'],
  goi: ['goi'],
  cuon: ['cuon'],
  rau: ['rau'],
  mien: ['mien'],
  'hu tieu': ['hu tieu'],
  mi: ['mi'],
  nuoc: ['bun', 'pho', 'canh', 'chao', 'mien', 'hu tieu', 'lau'],
  'trang mieng': ['trang mieng'],
  'an vat': ['an vat'],
  'hai san': ['hai san'],
}

const CATEGORY_STANDALONE: Readonly<Record<string, string>> = {
  bun: 'bun',
  pho: 'pho',
  chao: 'chao',
  xoi: 'xoi',
  lau: 'lau',
  canh: 'canh',
}

const EXCLUDE_LEAD = /(?:khong an|ko an|khong co|khong dung|khong muon|tranh|kieng|di ung)\s+/

/** Từ không phải nguyên liệu, bỏ khỏi cụm vừa bắt được sau "không ăn". */
const EXCLUDE_STOPWORDS = new Set(['mon', 'cac', 'nhung', 'cai', 'gi', 'nao', 'nua', 'da', 'duoc'])

/** Chỗ cụm loại trừ kết thúc. */
const EXCLUDE_END = /\s+(?:nhung|nhe|nha|ma|thi|cho|de|vi)\b|[,.;!?]|$/

function foldText(text: string): string {
  return normalizeVi(text).replace(/\s+/g, ' ').trim()
}

function hasPhrase(folded: string, phrase: string): boolean {
  return ` ${folded} `.includes(` ${phrase} `)
}

/** Giữ dấu để phân biệt "tối" (buổi tối) với "tôi" (đại từ). */
function accentedTokens(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0)
}

function parseMealType(text: string, folded: string): MealType | undefined {
  const tokens = accentedTokens(text)
  if (hasPhrase(folded, 'bua sang') || tokens.includes('sáng')) return 'breakfast'
  if (hasPhrase(folded, 'bua trua') || tokens.includes('trưa')) return 'lunch'
  if (hasPhrase(folded, 'bua toi') || tokens.includes('tối')) return 'dinner'
  if (
    hasPhrase(folded, 'bua phu') ||
    hasPhrase(folded, 'an vat') ||
    hasPhrase(folded, 'bua chieu') ||
    tokens.includes('xế')
  ) {
    return 'snack'
  }
  return undefined
}

function parseGoal(text: string, folded: string): { goal?: SuggestGoal; light: boolean } {
  if (
    hasPhrase(folded, 'tang can') ||
    hasPhrase(folded, 'tang co') ||
    hasPhrase(folded, 'tang kg')
  ) {
    return { goal: 'gain', light: false }
  }
  if (hasPhrase(folded, 'giu can')) return { goal: 'maintain', light: false }
  if (
    hasPhrase(folded, 'giam can') ||
    hasPhrase(folded, 'giam mo') ||
    hasPhrase(folded, 'an kieng')
  ) {
    return { goal: 'lose', light: false }
  }
  // "nhẹ" (bữa nhẹ) và "nhé" (cuối câu) cùng thành "nhe" khi bỏ dấu — "gợi ý món nhé" từng bị hiểu
  // là xin món nhẹ. Có dấu thì tin; không dấu chỉ nhận trong cụm "bữa … nhẹ" ("bữa tối nhẹ").
  const light =
    accentedTokens(text).includes('nhẹ') ||
    /\bbua\s+(?:\w+\s+)?nhe\b/.test(folded) ||
    hasPhrase(folded, 'it calo') ||
    hasPhrase(folded, 'it kcal')
  if (light) return { goal: 'lose', light: true }
  return { light: false }
}

function parseExclusions(folded: string): string[] {
  const lead = EXCLUDE_LEAD.exec(folded)
  if (lead === null) return []

  const rest = folded.slice(lead.index + lead[0].length)
  const end = EXCLUDE_END.exec(rest)
  const phrase = end === null ? rest : rest.slice(0, end.index)

  return phrase
    .split(/\s+(?:va|hoac)\s+|,/)
    .map((part) =>
      part
        .split(' ')
        .filter((word) => word.length > 0 && !EXCLUDE_STOPWORDS.has(word))
        .join(' ')
        .trim(),
    )
    .filter((part) => part.length > 0 && part.length <= 30)
    .slice(0, 6)
}

function parseCategories(folded: string): string[] {
  const found = new Set<string>()

  for (const [word, keyword] of Object.entries(CATEGORY_STANDALONE)) {
    if (hasPhrase(folded, word)) found.add(keyword)
  }
  for (const [word, keywords] of Object.entries(CATEGORY_AFTER_MON)) {
    if (hasPhrase(folded, `mon ${word}`)) for (const keyword of keywords) found.add(keyword)
  }
  return [...found]
}

/**
 * Ngữ cảnh thời tiết thành mức ưu tiên MỀM: "trời mưa" → món nước nóng. Không loại món nào khác,
 * vì khách chỉ nêu hoàn cảnh chứ không cấm món.
 *
 * "mưa" phải đọc có dấu: "mua" (mua đồ) khớp hết các câu như "mình mua cơm". Không dấu thì chỉ nhận
 * cả cụm "trời mưa".
 */
const HOT_SOUPY = ['canh', 'pho', 'bun', 'chao', 'lau', 'mien', 'hu tieu']
// Chỉ nhóm món, không dùng "rau": gần như món nước nào cũng có rau sống trong thành phần.
const LIGHT_COOL = ['goi', 'cuon', 'che', 'trang mieng']

function parseWeather(text: string, folded: string): { prefer: string[]; label: string } | null {
  const tokens = accentedTokens(text)
  const rainyOrCold =
    tokens.includes('mưa') ||
    tokens.includes('lạnh') ||
    tokens.includes('rét') ||
    hasPhrase(folded, 'troi mua') ||
    hasPhrase(folded, 'troi lanh') ||
    hasPhrase(folded, 'troi ret')
  if (rainyOrCold) return { prefer: HOT_SOUPY, label: 'món nước nóng cho ngày mưa, lạnh' }

  const hot =
    hasPhrase(folded, 'troi nong') ||
    hasPhrase(folded, 'nong buc') ||
    hasPhrase(folded, 'oi buc') ||
    hasPhrase(folded, 'nang nong')
  if (hot) return { prefer: LIGHT_COOL, label: 'món thanh mát cho ngày nóng' }

  return null
}

function parseSuggestFilters(text: string, folded: string): SuggestFilters {
  const filters: SuggestFilters = {}

  const exclude = parseExclusions(folded)
  if (exclude.length > 0) filters.exclude = exclude

  const categories = parseCategories(folded)
  if (categories.length > 0) filters.categories = categories

  // "chay" không dấu cũng là "chạy": loại trừ cụm "chạy bộ" quen thuộc.
  if (hasPhrase(folded, 'chay') && !hasPhrase(folded, 'chay bo') && !text.includes('chạy')) {
    filters.vegetarian = true
  }

  if (
    hasPhrase(folded, 'nhieu dam') ||
    hasPhrase(folded, 'giau dam') ||
    hasPhrase(folded, 'tang dam')
  ) {
    filters.minProteinG = 20
  }
  if (hasPhrase(folded, 'it beo')) filters.maxFatG = 12

  const weather = parseWeather(text, folded)
  if (weather !== null) {
    filters.prefer = weather.prefer
    filters.preferLabel = weather.label
  }

  const cap = /(?:duoi|toi da|khong qua)\s+(\d{2,4})(?:\s*(?:kcal|calo|cal))?/.exec(folded)
  if (cap?.[1] !== undefined) filters.maxKcal = Number(cap[1])

  return filters
}

/** Bỏ từ hỏi để còn lại tên món: "phở bò chín gồm nguyên liệu gì" → "pho bo chin". */
function stripDetailWords(folded: string): string {
  let rest = ` ${folded} `
  for (const phrase of [...DETAIL_TRIGGERS, 'bao nhieu', 'xem', 'cho minh', 'cho toi', 'cho hoi']) {
    rest = rest.replaceAll(` ${phrase} `, ' ')
  }
  rest = rest.replace(/\d+(?:[.,]\d+)?\s*(?:kg|gam|gram|gr|g)\b/g, ' ')
  const filler = new Set([
    'gi',
    'nao',
    'cua',
    'la',
    'ma',
    'nhe',
    'nha',
    'vay',
    'the',
    'khong',
    'hoi',
  ])
  return rest
    .split(' ')
    .filter((word) => word.length > 0 && !filler.has(word))
    .join(' ')
}

/**
 * Đọc thứ khách muốn ăn thành bộ lọc: "thịt" → phải có thịt; "phở bò" → phải có phở bò;
 * "thịt hoặc cá" → một trong hai nhóm; "đồ ngọt" → nhóm tráng miệng, ăn vặt.
 */
function parseDesire(folded: string): SuggestFilters | null {
  const lead = DESIRE_LEAD.exec(folded)
  if (lead === null) return null

  const rest = lead[1] ?? ''
  const end = EXCLUDE_END.exec(rest)
  const phrase = end === null ? rest : rest.slice(0, end.index)
  const cleaned = ` ${phrase} `
    .replace(/\s+(?:hom nay|toi nay|bua nay)\s+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && !DESIRE_STOPWORDS.has(word))
    .join(' ')
    .trim()

  const filters: SuggestFilters = {}
  if (cleaned.length === 0) return filters

  const craving = CRAVING_CATEGORIES[cleaned]
  if (craving !== undefined) {
    filters.categories = [...craving]
    return filters
  }

  const alternatives = cleaned
    .split(/\s+hoac\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  if (alternatives.length > 1) {
    filters.categories = alternatives.slice(0, 4)
    return filters
  }

  const required = cleaned
    .split(/\s+va\s+|,/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.length <= 30)
  if (required.length > 0) filters.include = required.slice(0, 3)
  return filters
}

function parseGrams(folded: string): number | undefined {
  const kg = /(\d+(?:[.,]\d+)?)\s*kg\b/.exec(folded)
  if (kg?.[1] !== undefined) {
    const value = Number(kg[1].replace(',', '.')) * 1000
    if (Number.isFinite(value) && value > 0) return value
  }
  const grams = /(\d+(?:[.,]\d+)?)\s*(?:g|gam|gram|gr)\b/.exec(folded)
  if (grams?.[1] !== undefined) {
    const value = Number(grams[1].replace(',', '.'))
    if (Number.isFinite(value) && value > 0) return value
  }
  return undefined
}

export function classifyIntent(text: string, estimator: MealEstimator): ChatIntent {
  const folded = foldText(text)

  const desire = parseDesire(folded)

  if (desire !== null || SUGGEST_TRIGGERS.some((trigger) => hasPhrase(folded, trigger))) {
    const filters = parseSuggestFilters(text, folded)
    if (desire?.include !== undefined) filters.include = desire.include
    if (desire?.categories !== undefined) {
      filters.categories = [...new Set([...(filters.categories ?? []), ...desire.categories])]
    }
    const { goal, light } = parseGoal(text, folded)
    if (light && filters.maxKcal === undefined) filters.maxKcal = 450
    const mealType = parseMealType(text, folded)

    return {
      kind: 'suggest',
      ...(mealType === undefined ? {} : { mealType }),
      ...(goal === undefined ? {} : { goal }),
      filters,
    }
  }

  // "Hôm nay mình còn bao nhiêu calo?" — câu hỏi về ngân sách, không có tên món nào.
  if (
    hasPhrase(folded, 'con bao nhieu') &&
    (hasPhrase(folded, 'calo') || hasPhrase(folded, 'kcal') || hasPhrase(folded, 'nang luong'))
  ) {
    return { kind: 'remaining' }
  }

  if (DETAIL_TRIGGERS.some((trigger) => hasPhrase(folded, trigger))) {
    const estimate = estimator.estimate(stripDetailWords(folded))
    const slug = estimate.items.find((item) => item.foodId !== null)?.foodId
    if (slug !== null && slug !== undefined) {
      // Đọc từ câu gốc: `normalizeVi` đổi "kg" thành "khong" (teencode) và bỏ dấu phẩy thập phân.
      const grams = parseGrams(text.toLowerCase())
      return { kind: 'detail', slug, ...(grams === undefined ? {} : { grams }) }
    }
  }

  return { kind: 'meal' }
}
