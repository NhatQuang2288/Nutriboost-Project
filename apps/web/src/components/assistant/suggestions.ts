/**
 * Gợi ý theo ngữ cảnh màn hình.
 *
 * Sổ đăng ký trung tâm, tra theo `usePathname()`. Đặt ở một chỗ để không phân tán
 * chuỗi khắp các trang, và để dễ rà soát giọng điệu.
 */

export interface Suggestion {
  /** Nhãn hiển thị trên chip. */
  label: string
  /** Nội dung thực sự gửi đi khi bấm. Mặc định bằng `label`. */
  message?: string
}

export const DEFAULT_SUGGESTIONS: readonly Suggestion[] = [
  { label: 'Hôm nay tôi ăn gì?', message: 'Hôm nay tôi nên ăn gì?' },
  { label: 'Phân tích bữa gần nhất', message: 'Phân tích giúp mình bữa ăn gần nhất' },
  { label: 'Mình còn bao nhiêu calo?', message: 'Hôm nay mình còn bao nhiêu calo?' },
]

const BY_ROUTE: Readonly<Record<string, readonly Suggestion[]>> = {
  '/hom-nay': [
    { label: 'Hôm nay tôi còn bao nhiêu calo?', message: 'Hôm nay mình còn bao nhiêu calo?' },
    { label: 'Gợi ý bữa tối nhẹ', message: 'Gợi ý cho mình bữa tối nhẹ' },
    {
      label: 'Giải thích mục tiêu của tôi',
      message: 'Giải thích vì sao mục tiêu của mình là như vậy',
    },
  ],
  '/ghi-nhan': [
    { label: 'Sáng nay tôi ăn phở bò', message: 'Sáng nay mình ăn phở bò' },
    { label: 'Lặp lại bữa sáng hôm qua', message: 'Lặp lại bữa sáng hôm qua cho mình' },
    { label: 'Thêm một ly sữa chua', message: 'Thêm cho mình một hộp sữa chua' },
  ],
  '/ke-hoach': [
    { label: 'Đổi món tối thứ 4', message: 'Đổi món tối thứ tư sang món ít béo hơn' },
    { label: 'Kế hoạch này đủ đạm chưa?', message: 'Kế hoạch này đã đủ đạm chưa?' },
  ],
  '/tien-do': [
    { label: 'Vì sao cân tuần này tăng?', message: 'Vì sao cân nặng tuần này lại tăng?' },
    { label: 'Tóm tắt tuần này', message: 'Tóm tắt giúp mình tuần này' },
  ],
  '/toi': [
    { label: 'Giải thích cách tính TDEE', message: 'Giải thích cách tính TDEE của mình' },
    { label: 'Mình dị ứng hải sản', message: 'Ghi nhận mình dị ứng hải sản' },
  ],
  '/coach': [
    { label: 'Bắt đầu hội thoại mới', message: 'Mình muốn bắt đầu một chủ đề mới' },
    {
      label: 'Mình đang ăn uống thế nào?',
      message: 'Đánh giá giúp mình thói quen ăn uống gần đây',
    },
  ],
}

/** Gợi ý cho một đường dẫn. Không khớp thì trả về bộ mặc định. */
export function suggestionsFor(pathname: string): readonly Suggestion[] {
  // Bỏ tiền tố nhóm và dấu gạch chéo cuối.
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return BY_ROUTE[normalized] ?? DEFAULT_SUGGESTIONS
}

export const SUGGESTION_ROUTES: readonly string[] = Object.keys(BY_ROUTE)
