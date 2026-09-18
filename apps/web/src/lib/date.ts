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

/**
 * `YYYY-MM-DD` → `dd/mm/yyyy`, nếp viết ngày của người Việt.
 *
 * Cắt chuỗi thay vì `new Date(iso)`: `new Date('2026-09-18')` được hiểu là nửa đêm UTC, nên
 * ở múi giờ +07 nó vẫn đúng, nhưng ở múi giờ âm nó lùi mất một ngày. Cắt chuỗi thì không
 * phụ thuộc múi giờ của máy chạy.
 */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (year === undefined || month === undefined || day === undefined) return iso
  return `${day}/${month}/${year}`
}

/**
 * Tuổi đầy đủ tính từ ngày sinh, theo hai chuỗi `YYYY-MM-DD`.
 *
 * So sánh ngày trong cùng một năm là chỗ dễ sai nhất: sinh ngày 20/12 thì ngày 18/09 vẫn
 * chưa đủ tuổi, còn sinh ngày 01/01 thì đã đủ. Vì vậy phải so cả tháng lẫn ngày, không chỉ
 * lấy hiệu hai năm.
 */
export function ageFromIsoDate(dateOfBirth: string, todayIso: string): number {
  const [birthYear, birthMonth, birthDay] = dateOfBirth.slice(0, 10).split('-').map(Number)
  const [nowYear, nowMonth, nowDay] = todayIso.split('-').map(Number)

  if (
    birthYear === undefined ||
    birthMonth === undefined ||
    birthDay === undefined ||
    nowYear === undefined ||
    nowMonth === undefined ||
    nowDay === undefined ||
    Number.isNaN(birthYear)
  ) {
    return 0
  }

  let age = nowYear - birthYear
  if (nowMonth < birthMonth || (nowMonth === birthMonth && nowDay < birthDay)) {
    age -= 1
  }
  return Math.max(0, age)
}
