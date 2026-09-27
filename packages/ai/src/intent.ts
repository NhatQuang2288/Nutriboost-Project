import type { MealType } from '@nutriboost/db'
import { normalizeVi } from '@nutriboost/nutrition'

/**
 * Nhận diện ý định — TẤT ĐỊNH, dùng cho đường dự phòng khi không có model.
 *
 * Vì sao cần: khi chưa có khoá, hết lượt AI, hay DeepSeek lỗi, route rơi về đường tất định.
 * Trước đây đường đó chỉ biết ước lượng bữa ăn, nên người dùng xin "thực đơn tuần này" lại
 * nhận câu "Mình chưa nhận ra món nào trong câu này" — trông như Bơ không hiểu tiếng Việt.
 *
 * Danh sách từ khoá cố tình hẹp và so trên chuỗi đã bỏ dấu, nên bắt được cả cách gõ không dấu.
 * Thứ tự kiểm tra quan trọng: "lịch tập" đứng trước "thực đơn" vì câu "lên lịch tập và thực
 * đơn" nên ưu tiên phần hiếm hơn; "gợi ý ăn gì" đứng trước "ghi bữa" vì câu hỏi có từ "ăn".
 */

export type ChatIntent =
  | { kind: 'workout' }
  | { kind: 'plan'; days: number }
  | { kind: 'suggest'; mealType: MealType | null; light: boolean }
  | { kind: 'targets' }
  | { kind: 'other' }

const WORKOUT_TERMS = [
  'lich tap',
  'bai tap',
  'tap gym',
  'tap the duc',
  'tap luyen',
  'workout',
  'tap gi',
]
const PLAN_TERMS = ['thuc don', 'ke hoach an', 'meal plan', 'len menu', 'menu']
const SUGGEST_TERMS = ['an gi', 'goi y', 'nen an', 'an mon gi', 'an sao']
const TARGET_TERMS = ['bmr', 'tdee', 'muc tieu cua minh', 'muc tieu cua toi', 'vi sao muc tieu']

const MEAL_TERMS: readonly (readonly [MealType, readonly string[]])[] = [
  ['breakfast', ['bua sang', 'an sang', 'sang nay', 'sang mai']],
  ['lunch', ['bua trua', 'an trua', 'trua nay', 'trua mai']],
  ['dinner', ['bua toi', 'an toi', 'toi nay', 'toi mai']],
  ['snack', ['bua phu', 'an vat', 'an xe', 'an khuya']],
]

export function detectChatIntent(text: string): ChatIntent {
  const key = ` ${normalizeVi(text)} `
  const has = (terms: readonly string[]) => terms.some((term) => key.includes(` ${term} `))

  if (has(WORKOUT_TERMS)) return { kind: 'workout' }

  if (has(PLAN_TERMS)) {
    const oneDay = has(['hom nay', 'ngay mai', '1 ngay', 'mot ngay'])
    return { kind: 'plan', days: oneDay ? 1 : 7 }
  }

  if (has(SUGGEST_TERMS)) {
    const meal = MEAL_TERMS.find(([, terms]) => has(terms))?.[0] ?? null
    return { kind: 'suggest', mealType: meal, light: has(['nhe', 'it calo', 'it kcal', 'healthy']) }
  }

  if (has(TARGET_TERMS)) return { kind: 'targets' }

  return { kind: 'other' }
}
