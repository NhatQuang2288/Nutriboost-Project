/** Múi giờ mặc định của sản phẩm — quyết định cách tính "hôm nay". */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'

/**
 * Ngày theo múi giờ địa phương, định dạng `YYYY-MM-DD`.
 *
 * Luôn dùng hàm này thay vì `toISOString().slice(0, 10)`: cách sau lấy ngày theo UTC
 * nên từ 00:00 tới 07:00 giờ Việt Nam sẽ trả về nhầm ngày hôm trước.
 */
export function localDateIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Giờ địa phương dạng `HH:mm`. */
export function localTimeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** Nhãn thứ trong tuần bằng tiếng Việt, ví dụ "Thứ Năm". */
export function weekdayLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone, weekday: 'long' }).format(date)
}

/** Tuổi đầy đủ tại một thời điểm. */
export function ageAt(birthYear: number, now: Date = new Date()): number {
  return Math.max(0, now.getFullYear() - birthYear)
}
