import type { MealType } from '@nutriboost/db'
import { normalizeVi, stripDiacritics } from '@nutriboost/nutrition'

import type { MealCatalogueEntry } from './meal-estimator'
import { MEAL_SHARE, isSuitableForMeal, scaleDishToTarget, type PlanItem } from './plan-builder'

/**
 * Gợi ý món cho MỘT bữa — TẤT ĐỊNH.
 *
 * Trả lời câu hỏi phổ biến nhất với Bơ: "tối nay ăn gì?". Model không được tự nghĩ ra món
 * kèm con số calo từ trí nhớ; nó chỉ quyết định ngân sách kcal và danh sách món cần tránh,
 * còn việc chọn món và nhân khẩu phần là của hàm này.
 *
 * Tiêu chí xếp hạng, theo thứ tự quan trọng:
 *   1. Sát ngân sách kcal của bữa (sau khi nhân khẩu phần trong khoảng hợp lý).
 *   2. Tỉ lệ năng lượng từ đạm cao hơn — người Việt thường thiếu đạm hơn thiếu tinh bột.
 */

export interface SuggestMealsInput {
  catalogue: readonly MealCatalogueEntry[]
  mealType: MealType
  budgetKcal: number
  count?: number
  /** Tên món hoặc nguyên liệu phải tránh, người dùng nói tự do ("hải sản", "thịt bò"). */
  avoid?: readonly string[]
  /**
   * Chuỗi hạt giống để xoay vòng trong nhóm món tốt nhất — thường là ngày hôm nay. Cùng hạt
   * giống thì cùng kết quả (kiểm thử được), khác ngày thì gợi ý khác đi, đỡ nhàm.
   */
  seed?: string
}

export interface SuggestMealsResult {
  options: PlanItem[]
  /** Số món bị loại vì trùng danh sách tránh. */
  excludedCount: number
}

/** Khoảng nhân khẩu phần cho gợi ý: hẹp hơn thực đơn tuần để không ra "1,9 tô phở". */
const SUGGEST_BOUNDS: readonly [number, number] = [0.6, 1.5]

/** Lệch quá mức này so với ngân sách thì không gợi ý. */
const MAX_GAP = 0.35

/** Số món tốt nhất được đưa vào vòng xoay theo hạt giống. */
const ROTATION_POOL_FACTOR = 3

export function suggestMeals(input: SuggestMealsInput): SuggestMealsResult {
  const count = Math.min(5, Math.max(1, input.count ?? 3))
  const budget = Math.max(50, Math.round(input.budgetKcal))
  const avoided = findAvoidedSlugs(input.catalogue, input.avoid ?? [])

  const scored = input.catalogue
    .filter((entry) => (entry.kind ?? 'dish') === 'dish')
    .filter((entry) => entry.kcalPer100g > 0)
    .filter((entry) => !avoided.has(entry.slug))
    // "Bữa tối nhẹ 350 kcal" không được ra trà sữa trân châu chỉ vì nó cũng 330 kcal.
    .filter((entry) => isSuitableForMeal(entry, input.mealType))
    .map((entry) => {
      const item = scaleDishToTarget(entry, budget, SUGGEST_BOUNDS[0], SUGGEST_BOUNDS[1])
      const gap = Math.abs(item.kcal - budget) / budget
      const proteinShare = item.kcal > 0 ? (item.proteinG * 4) / item.kcal : 0
      return { item, gap, score: gap - 0.3 * proteinShare }
    })
    .filter((candidate) => candidate.gap <= MAX_GAP)
    .sort((a, b) => a.score - b.score || a.item.slug.localeCompare(b.item.slug))
    // Danh mục có món trùng tên khác slug (hai "Cơm gà"): thẻ hiện hai dòng y hệt trông như lỗi.
    // Giữ bản xếp hạng cao nhất của mỗi tên.
    .filter((candidate, index, all) => {
      const key = normalizeVi(candidate.item.nameVi)
      return all.findIndex((other) => normalizeVi(other.item.nameVi) === key) === index
    })

  const pool = scored.slice(0, count * ROTATION_POOL_FACTOR)
  const offset = pool.length === 0 ? 0 : hashString(input.seed ?? '') % pool.length
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)]

  // Sau khi xoay, vẫn đưa món sát ngân sách nhất lên đầu để thẻ dễ đọc.
  const options = rotated
    .slice(0, count)
    .sort((a, b) => a.score - b.score)
    .map((candidate) => candidate.item)

  return { options, excludedCount: avoided.size }
}

/**
 * Ngân sách mặc định của một bữa khi model không nêu con số.
 *
 * Lấy phần của bữa trong mục tiêu ngày, nhưng không vượt quá số kcal còn lại — gợi ý một bữa
 * 700 kcal khi người dùng chỉ còn 300 kcal là gợi ý sai.
 */
export function defaultMealBudget(
  mealType: MealType,
  targetKcal: number,
  remainingKcal: number | null,
): number {
  const share = Math.round(targetKcal * MEAL_SHARE[mealType])
  if (remainingKcal === null) return share
  // Sàn 150 kcal: đã vượt mục tiêu thì vẫn gợi ý được một món nhẹ, không trả về rỗng.
  return Math.max(150, Math.min(share, remainingKcal))
}

/**
 * Tìm các món trùng danh sách tránh.
 *
 * So trên chuỗi đã chuẩn hoá (bỏ dấu, chữ thường), khớp theo tên và bí danh. Một số cụm từ
 * chỉ nhóm thực phẩm ("hải sản") được mở rộng thành các từ cụ thể, vì tên món không bao giờ
 * chứa chữ "hải sản".
 */
export function findAvoidedSlugs(
  catalogue: readonly MealCatalogueEntry[],
  avoid: readonly string[],
): Set<string> {
  /*
   * Hai cách so. Người dùng gõ CÓ dấu ("cá") thì so trên chữ có dấu, vì bỏ dấu đi "cá" trùng
   * với "cà phê", "cà chua". Gõ KHÔNG dấu ("ca") thì đành so trên chữ đã bỏ dấu.
   */
  const accented: string[] = []
  const plain: string[] = []

  for (const raw of avoid) {
    const key = normalizeVi(raw)
    const group = FOOD_GROUP_TERMS[key]
    if (group !== undefined) {
      accented.push(...group)
      continue
    }
    const lowered = raw.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
    // "thịt bò" phải loại cả "phở bò", "bò kho": tên món hiếm khi viết đủ chữ "thịt".
    const meat = /^thịt (.+)$/.exec(lowered)?.[1]
    if (stripDiacritics(lowered) !== lowered)
      accented.push(lowered, ...(meat === undefined ? [] : [meat]))
    else plain.push(key, ...(key.startsWith('thit ') ? [key.slice('thit '.length)] : []))
  }

  const result = new Set<string>()
  if (accented.length === 0 && plain.length === 0) return result

  for (const entry of catalogue) {
    const names = [entry.nameVi, ...(entry.aliases ?? [])]
    const accentedNames = names.map((name) => ` ${name.normalize('NFC').toLowerCase()} `)
    const plainNames = names.map((name) => ` ${normalizeVi(name)} `)

    const hit =
      accented.some((term) => accentedNames.some((name) => name.includes(` ${term} `))) ||
      plain
        .filter((term) => term.length >= 2)
        .some((term) => plainNames.some((name) => name.includes(` ${term} `)))

    if (hit) result.add(entry.slug)
  }

  return result
}

/**
 * Nhóm thực phẩm → từ xuất hiện trong tên món, viết CÓ dấu. Khoá là dạng đã chuẩn hoá bằng
 * `normalizeVi` nên người dùng gõ có dấu hay không đều khớp.
 */
const FOOD_GROUP_TERMS: Readonly<Record<string, readonly string[]>> = {
  // Gồm cả cá: người Việt nói "dị ứng hải sản" thường tránh luôn cá. Tránh dư an toàn hơn thiếu.
  'hai san': ['tôm', 'cua', 'mực', 'ghẹ', 'nghêu', 'sò', 'ốc', 'hàu', 'hến', 'cá', 'hải sản'],
  thit: ['thịt', 'bò', 'heo', 'lợn', 'gà', 'vịt', 'sườn', 'chả', 'nem', 'xúc xích', 'lạp xưởng'],
  'thit do': ['bò', 'heo', 'lợn', 'sườn', 'dê', 'cừu'],
  sua: ['sữa', 'phô mai', 'kem', 'sữa chua'],
  'do chien': ['chiên', 'rán', 'quay'],
  'do ngot': ['chè', 'bánh ngọt', 'kem', 'trà sữa', 'nước ngọt'],
}

/** Băm chuỗi đơn giản (FNV-1a 32-bit) — chỉ để xoay vòng tất định, không dùng cho bảo mật. */
function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
