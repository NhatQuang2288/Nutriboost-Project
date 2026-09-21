import {
  type ScaledNutrients,
  FOOD_MATCH_THRESHOLD,
  findFoodCandidates,
  foodNameKey,
  isUnitWord,
  normalizeVi,
  scaleNutrients,
  sumNutrients,
} from '@nutriboost/nutrition'

/**
 * Ước lượng bữa ăn — TẤT ĐỊNH, không gọi AI.
 *
 * Đây là bước 1 và 2 của pipeline hiểu bữa ăn (docs/REVIEW-MVP.md §0):
 * chuẩn hoá tiếng Việt → tìm trigram trong danh mục → khớp khi đủ tự tin → tính calo bằng code.
 *
 * Vì sao không gọi model ngay: phần lớn câu người dùng gõ là món quen thuộc và khớp được
 * tất định. Cách này vừa rẻ hơn vừa chính xác hơn — và quan trọng nhất, **model không bao
 * giờ tự sinh ra con số calo**.
 *
 * Danh mục được TIÊM VÀO chứ không import trực tiếp: nhờ vậy gói này chạy được trong
 * bộ đánh giá mà không cần CSDL, và khi có Supabase thật chỉ cần truyền danh mục lấy từ
 * `search_foods` (pg_trgm) vào là xong.
 */

/** Một mục trong danh mục món. `FoodRecord` của `@nutriboost/seed` khớp cấu trúc này. */
export interface MealCatalogueEntry {
  slug: string
  nameVi: string
  /** Phân biệt nguyên liệu và món — dùng để phá thế hoà khi hai bên cùng điểm. */
  kind?: 'ingredient' | 'dish'
  aliases?: readonly string[]
  servingGrams?: number
  kcalPer100g: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
}

/**
 * Khoảng điểm được coi là hoà.
 *
 * Khi một câu khớp cả một nguyên liệu lẫn một món ở cùng mức điểm, chọn **món**:
 * người dùng nói "bánh mì" thì gần như chắc chắn là ăn một chiếc bánh mì, không phải
 * nguyên liệu bánh mì. Quy tắc này chỉ áp cho thế hoà giữa nguyên liệu và món;
 * hoà giữa hai món khác nhau vẫn trả về "không khớp" để hỏi lại người dùng.
 */
const TIE_GAP = 0.08

export interface EstimatedItem {
  foodId: string | null
  displayName: string
  grams: number
  nutrients: ScaledNutrients
  matchMethod: 'exact' | 'trigram' | 'ai' | 'user'
  confidence: number
}

export interface MealEstimate {
  items: EstimatedItem[]
  unmatched: string[]
  needsConfirmation: boolean
  total: ScaledNutrients
  /** Câu gốc, giữ lại để lưu `meal_logs.raw_input`. */
  rawInput: string
}

/**
 * Từ nối tách các món trong một câu.
 *
 * KHÔNG dùng `\b` ở đây: trong JavaScript, `\b` chỉ hiểu ký tự ASCII, nên `\bvà\b`
 * không bao giờ khớp vì ký tự sau "à" là dấu cách chứ không phải biên từ.
 * Dùng `\s+` bao hai bên — đúng với một từ nối đứng giữa câu.
 *
 * Cố tình KHÔNG đưa "kèm/kem" vào danh sách: "kem" vừa là từ nối vừa là tên món,
 * tách theo nó sẽ phá tên món.
 */
const CLAUSE_SEPARATORS = /,|;|\+|\s+(?:và|va|với|voi|cùng|cung)\s+/i

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
  muoi: 10,
  nua: 0.5,
}

/**
 * Suy ra bội số khẩu phần từ câu.
 *
 * Chỉ nhận các bội số rời rạc để tránh ước lượng tuỳ tiện: số nguyên 1–10,
 * "nửa"/"một nửa" = 0,5, và phân số dạng "1/2", "3/4".
 *
 * Một số từ **chỉ** được coi là số lượng khi đi liền trước một đơn vị.
 * Nếu không, "tấm" trong "cơm tấm sườn" sẽ bị hiểu là "tám" và nhân 8 khẩu phần —
 * lỗi này từng xảy ra thật và bị test đầu-cuối bắt được.
 */
export function detectServingMultiplier(text: string): number {
  const normalized = normalizeVi(text)
  const tokens = normalized.split(' ').filter((token) => token.length > 0)

  // Phân số viết dạng 1/2 hoặc 3/4 — luôn là số lượng, không cần đơn vị đi kèm.
  const fraction = /(\d+)\s*\/\s*(\d+)/.exec(normalized)
  if (fraction !== null) {
    const numerator = Number(fraction[1])
    const denominator = Number(fraction[2])
    if (denominator > 0 && numerator > 0) return numerator / denominator
  }

  const followedByUnit = (index: number): boolean => isUnitWord(tokens[index + 1] ?? '')

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? ''

    // "nửa tô", "một nửa bát"
    if (token === 'nua' && followedByUnit(index)) return 0.5

    // Chữ số Ả Rập: "2 bát", "1,5 tô"
    if (/^\d+([.,]\d+)?$/.test(token) && followedByUnit(index)) {
      const value = Number(token.replace(',', '.'))
      if (Number.isFinite(value) && value > 0 && value <= 10) return value
    }

    // Số viết bằng chữ: "hai bát", "ba ly"
    const wordValue = NUMBER_WORDS[token]
    if (wordValue !== undefined && followedByUnit(index)) return wordValue
  }

  return 1
}

/**
 * Từ ngữ cảnh cần bỏ trước khi khớp tên món.
 *
 * Người dùng nói cả câu ("sáng nay mình ăn phở bò") chứ không gõ đúng tên món.
 * `foodNameKey` chỉ bỏ số lượng và đơn vị, nên phần ngữ cảnh này phải bỏ ở đây.
 *
 * CHỈ bỏ ở ĐẦU câu, không bỏ ở giữa. Nếu bỏ ở mọi vị trí, rất nhiều tên món sẽ bị phá
 * vì từ chức năng trùng âm với nguyên liệu — lỗi có thật, đo được bằng `npm run eval`:
 *
 *   "thu"   ↔ cá thu        "toi"  ↔ tỏi
 *   "khong" ↔ không đường   "goi"  ↔ gỏi
 *   "cua"   ↔ cua           "bot"  ↔ bột
 *   "kem"   ↔ kem           "ba"/"chi" ↔ ba chỉ
 *
 * Cố tình KHÔNG đưa "bo" (bò), "ga" (gà), "ca" (cá) vào danh sách: chúng là tên món.
 */
const CONTEXT_TOKENS = new Set([
  // Thời gian
  'sang',
  'trua',
  'chieu',
  'toi',
  'dem',
  'hom',
  'nay',
  'qua',
  'khuya',
  'som',
  'truoc',
  'sau',
  'moi',
  'vua',
  'dang',
  'se',
  'da',
  'xong',
  // Đại từ
  'minh',
  'toi',
  'em',
  'anh',
  'chi',
  'ong',
  'ba',
  'con',
  'chung',
  'ban',
  'nha',
  // Động từ
  'an',
  'uong',
  'lam',
  'nau',
  'mua',
  'dat',
  'them',
  // Loại từ và hư từ
  'mon',
  'cai',
  'chiec',
  'phan',
  'suat',
  'thu',
  'chut',
  'it',
  'nhieu',
  'khoang',
  'vao',
  'cho',
  'nhu',
  'co',
  'khong',
  'nhi',
])

/**
 * Những từ đã bị loại khỏi `CONTEXT_TOKENS` vì trùng âm với tên món:
 *
 *   'goi' (gọi) ↔ gỏi        'kem' (kèm) ↔ kem
 *   'ba'  (ba)  ↔ ba chỉ     'chi' (chị) ↔ ba chỉ
 *   'cua' (của) ↔ cua        'bot' (bớt) ↔ bột
 *   'thu' (thứ) ↔ cá thu     'la'  (là)  ↔ lá
 *
 * Giữ lại 'toi' (tôi) dù trùng với "tỏi": đại từ "tôi" đứng đầu câu thường xuyên hơn
 * nhiều so với "tỏi" đứng đầu câu, và "tỏi" trong tên món luôn nằm ở cuối
 * ("rau muống xào tỏi") nên quy tắc chỉ-cắt-ở-đầu không đụng tới.
 */

/**
 * Bỏ phần số lượng, đơn vị và từ ngữ cảnh ở ĐẦU câu để còn lại tên món.
 *
 * Ví dụ: `"sáng nay mình ăn phở bò"` → `"pho bo"`.
 *
 * Chỉ cắt chuỗi từ ngữ cảnh ở đầu, dừng ngay khi gặp token đầu tiên không phải ngữ cảnh.
 * Nhờ vậy "cá thu", "rau muống xào tỏi", "sữa tươi không đường" không bị cắt cụt.
 */
export function dishNameKeyFromClause(clause: string): string {
  const key = foodNameKey(clause)
  const tokens = key.split(' ').filter((token) => token.length > 0)

  let start = 0
  while (start < tokens.length && CONTEXT_TOKENS.has(tokens[start] ?? '')) {
    start += 1
  }

  const stripped = tokens.slice(start).join(' ')
  // Nếu bỏ hết mà không còn gì, giữ nguyên khoá gốc để không mất thông tin.
  return stripped.length > 0 ? stripped : key
}

export interface MealEstimator {
  /** Ước lượng một bữa ăn từ câu người dùng. */
  estimate: (text: string) => MealEstimate
  /** Gợi ý ứng viên cho một đoạn văn bản, dùng cho thẻ chọn món trong chat. */
  suggest: (text: string, limit?: number) => MealCatalogueEntry[]
  /** Số mục trong danh mục đang dùng. */
  size: () => number
}

/**
 * Tạo bộ ước lượng với một danh mục cụ thể.
 *
 * Việc tiêm danh mục khiến hàm này thuần khiết: cùng đầu vào luôn cho cùng đầu ra,
 * không phụ thuộc thời điểm import hay trạng thái toàn cục. Bộ đánh giá dựa vào đó.
 */
export function createMealEstimator(catalogue: readonly MealCatalogueEntry[]): MealEstimator {
  const bySlug = new Map(catalogue.map((item) => [item.slug, item]))

  // Cầu nối sang `findFoodCandidates` của `@nutriboost/nutrition`, vốn dùng `id`
  // thay vì `slug`. Giữ danh sách ứng viên riêng để không phải ép kiểu.
  const candidates = catalogue.map((item) => ({
    id: item.slug,
    nameVi: item.nameVi,
    aliases: item.aliases ?? [],
  }))

  /**
   * Chọn món khớp nhất cho một khoá tìm kiếm, có phá thế hoà giữa nguyên liệu và món.
   *
   * Trả `null` khi không có ứng viên nào vượt ngưỡng — nghĩa là câu này cần hỏi lại
   * người dùng hoặc gọi model, chứ không được đoán bừa.
   */
  function pickBestMatch(key: string): { foodId: string; score: number } | null {
    const scored = findFoodCandidates(key, candidates, {
      threshold: FOOD_MATCH_THRESHOLD,
      limit: 5,
    })

    const best = scored[0]
    if (best === undefined) return null

    const nearTies = scored.filter((candidate) => best.score - candidate.score < TIE_GAP)
    const dishTie = nearTies.find((candidate) => bySlug.get(candidate.food.id)?.kind === 'dish')

    const chosen = dishTie ?? best
    return { foodId: chosen.food.id, score: chosen.score }
  }

  function estimate(text: string): MealEstimate {
    const clauses = text
      .split(CLAUSE_SEPARATORS)
      .map((clause) => clause.trim())
      .filter((clause) => clause.length > 0)

    const items: EstimatedItem[] = []
    const unmatched: string[] = []

    for (const clause of clauses) {
      const key = dishNameKeyFromClause(clause)
      if (key.length === 0) continue

      const chosen = pickBestMatch(key)

      if (chosen === null) {
        // Không đủ tự tin để khớp: ghi nhận để người dùng xác nhận hoặc nhập tay.
        unmatched.push(clause)
        items.push({
          foodId: null,
          displayName: clause,
          grams: 0,
          nutrients: scaleNutrients({ kcal: 0, proteinG: 0, carbG: 0, fatG: 0 }, 0),
          matchMethod: 'user',
          confidence: 0,
        })
        continue
      }

      const food = bySlug.get(chosen.foodId)
      if (food === undefined) continue

      const multiplier = detectServingMultiplier(clause)
      const servingGrams = food.servingGrams ?? 100
      const grams = Math.max(1, Math.round(servingGrams * multiplier))

      items.push({
        foodId: food.slug,
        displayName: food.nameVi,
        grams,
        nutrients: scaleNutrients(
          {
            kcal: food.kcalPer100g,
            proteinG: food.proteinG,
            carbG: food.carbG,
            fatG: food.fatG,
            fiberG: food.fiberG,
            sugarG: food.sugarG,
            sodiumMg: food.sodiumMg,
          },
          grams,
        ),
        matchMethod: chosen.score >= 0.99 ? 'exact' : 'trigram',
        confidence: chosen.score,
      })
    }

    const total = sumNutrients(items.map((item) => item.nutrients))
    const weakMatches = items.some((item) => item.confidence < 0.6)

    return {
      items,
      unmatched,
      // Bắt buộc người dùng xác nhận khi có món không khớp hoặc khớp không chắc.
      needsConfirmation: unmatched.length > 0 || weakMatches,
      total,
      rawInput: text,
    }
  }

  function suggest(text: string, limit = 5): MealCatalogueEntry[] {
    const key = dishNameKeyFromClause(text)
    if (key.length === 0) return []
    return findFoodCandidates(key, candidates, { limit })
      .map((candidate) => bySlug.get(candidate.food.id))
      .filter((food): food is MealCatalogueEntry => food !== undefined)
  }

  return { estimate, suggest, size: () => catalogue.length }
}
