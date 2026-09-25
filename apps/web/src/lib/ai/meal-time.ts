/**
 * Suy bữa trong ngày và giờ địa phương — hai hàm thuần, tách ra để test được.
 *
 * Vì sao cần: khi người dùng bấm "Lưu bữa này", không ai hỏi họ đây là bữa sáng hay bữa tối.
 * Hỏi thêm một câu là vi phạm mục tiêu "≤ 2 lần chạm" của màn ghi bữa ăn. Nên bữa được suy từ
 * giờ, và quy tắc suy phải nằm ở một chỗ có test chứ không rải trong Server Action.
 */

/** Khớp enum `meal_type` trong CSDL. */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/**
 * Bữa nào theo giờ địa phương (0–23).
 *
 * Mốc chia theo nếp ăn Việt Nam, không theo bữa của phương Tây:
 *   • 04:00–09:59 bữa sáng
 *   • 10:00–14:59 bữa trưa
 *   • 15:00–16:59 bữa xế
 *   • 17:00–20:59 bữa tối
 *   • 21:00–03:59 ăn đêm — gộp vào `snack` vì CSDL không có bữa riêng cho nó
 */
export function mealTypeForHour(hour: number): MealSlot {
  if (!Number.isFinite(hour)) return 'snack'
  if (hour >= 4 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 15) return 'lunch'
  if (hour >= 15 && hour < 17) return 'snack'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'snack'
}

/**
 * Giờ địa phương (0–23) tại một múi giờ.
 *
 * Dùng `Intl` chứ không `getHours()`: máy chủ chạy ở UTC, còn người dùng ở Việt Nam. Lấy giờ
 * của máy chủ sẽ khiến bữa trưa 12:00 của người dùng bị ghi thành bữa sáng.
 */
export function localHourIn(timeZone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(now)

  const parsed = Number(hour)
  return Number.isFinite(parsed) ? parsed % 24 : 0
}
