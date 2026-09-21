import { normalizeVi } from './normalize-vi'

/**
 * So khớp chuỗi gần đúng, mô phỏng `pg_trgm.similarity()` của PostgreSQL.
 *
 * Lưu ý về phạm vi sử dụng:
 * - **Nguồn chân lý khi chạy thật là SQL** (`similarity()` + chỉ mục GIN `pg_trgm`).
 * - Bản trong TypeScript này dùng cho: (a) script eval chạy ngoài CSDL,
 *   (b) test, (c) đường dự phòng khi không truy vấn được CSDL.
 *
 * Cách tạo trigram giống pg_trgm: mỗi từ được đệm 2 dấu cách bên trái và
 * 1 dấu cách bên phải, rồi cắt mọi chuỗi con dài 3.
 *
 * Điểm khác biệt có chủ ý: bản này không bỏ qua ký tự không phải chữ-số như
 * pg_trgm; vì đầu vào đã đi qua `normalizeVi()` nên phần khác biệt không đáng kể.
 */

const PAD_LEFT = '  '
const PAD_RIGHT = ' '

/** Sinh danh sách trigram (có giữ số lần lặp) của một chuỗi. */
export function trigrams(input: string): string[] {
  const result: string[] = []
  const words = input.split(/\s+/).filter((word) => word.length > 0)
  for (const word of words) {
    const padded = `${PAD_LEFT}${word}${PAD_RIGHT}`
    for (let i = 0; i + 3 <= padded.length; i += 1) {
      result.push(padded.slice(i, i + 3))
    }
  }
  return result
}

/**
 * Độ tương đồng trong [0, 1]: `|giao| / (|A| + |B| − |giao|)`.
 * Trùng khớp hoàn toàn cho ra 1; không có trigram chung cho ra 0.
 */
export function similarity(a: string, b: string): number {
  const left = trigrams(a)
  const right = trigrams(b)
  if (left.length === 0 || right.length === 0) {
    return a === b ? 1 : 0
  }
  const remaining = new Map<string, number>()
  for (const gram of left) {
    remaining.set(gram, (remaining.get(gram) ?? 0) + 1)
  }
  let common = 0
  for (const gram of right) {
    const available = remaining.get(gram) ?? 0
    if (available > 0) {
      common += 1
      remaining.set(gram, available - 1)
    }
  }
  return common / (left.length + right.length - common)
}

/**
 * Ngưỡng khớp tất định: từ mức này trở lên, hệ thống tự khớp món mà **không gọi AI**.
 * Giá trị này là một phần của hợp đồng chi phí — đổi nó phải chạy lại bộ eval.
 */
export const FOOD_MATCH_THRESHOLD = 0.72

/** Ngưỡng đưa vào danh sách ứng viên gửi cho AI. */
export const FOOD_CANDIDATE_THRESHOLD = 0.3

export interface FoodCandidateInput {
  id: string
  nameVi: string
  aliases?: readonly string[]
}

export interface FoodCandidate<T extends FoodCandidateInput = FoodCandidateInput> {
  food: T
  score: number
  /** Chuỗi nào khớp tốt nhất: tên chính hay một bí danh. */
  matchedOn: 'name' | 'alias'
}

/**
 * Tìm ứng viên món ăn theo khoá tìm kiếm.
 *
 * Trả về danh sách đã sắp xếp giảm dần theo điểm. Hàm thuần, không truy vấn CSDL —
 * nhờ vậy chạy được trong test và trong script eval.
 */
export function findFoodCandidates<T extends FoodCandidateInput>(
  query: string,
  foods: readonly T[],
  options: { threshold?: number; limit?: number } = {},
): FoodCandidate<T>[] {
  const threshold = options.threshold ?? FOOD_CANDIDATE_THRESHOLD
  const limit = options.limit ?? 20
  const queryKey = normalizeVi(query)
  if (queryKey.length === 0) return []

  const scored: FoodCandidate<T>[] = []
  for (const food of foods) {
    const nameScore = similarity(queryKey, normalizeVi(food.nameVi))
    let best = nameScore
    let matchedOn: 'name' | 'alias' = 'name'
    for (const alias of food.aliases ?? []) {
      const aliasScore = similarity(queryKey, normalizeVi(alias))
      if (aliasScore > best) {
        best = aliasScore
        matchedOn = 'alias'
      }
    }
    if (best >= threshold) {
      scored.push({ food, score: round4(best), matchedOn })
    }
  }

  scored.sort((a, b) => b.score - a.score || a.food.nameVi.localeCompare(b.food.nameVi, 'vi'))
  return scored.slice(0, limit)
}

/**
 * Quyết định khớp tất định: chỉ khớp khi điểm cao VÀ khoảng cách với ứng viên
 * kế tiếp đủ xa. Nếu hai món gần như bằng điểm, phải để AI phân xử.
 */
export function deterministicMatch<T extends FoodCandidateInput>(
  query: string,
  foods: readonly T[],
  options: { threshold?: number; minimumGap?: number } = {},
): FoodCandidate<T> | null {
  const threshold = options.threshold ?? FOOD_MATCH_THRESHOLD
  const minimumGap = options.minimumGap ?? 0.08
  const candidates = findFoodCandidates(query, foods, { threshold, limit: 2 })
  const best = candidates[0]
  if (best === undefined) return null
  const runnerUp = candidates[1]
  if (runnerUp !== undefined && best.score - runnerUp.score < minimumGap) return null
  return best
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000
}
