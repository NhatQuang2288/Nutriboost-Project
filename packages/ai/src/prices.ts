/**
 * Bảng giá model — nguồn chân lý cho `ai_calls.cost_usd`.
 *
 * Số liệu lấy từ trang giá chính thức của Gemini Developer API, đã đối chiếu ngày
 * 18/09/2026. **Giá thay đổi theo thời gian**, nên bảng này mã hoá cả ngày hiệu lực
 * thay vì chỉ một con số. Nhờ vậy chi phí lịch sử vẫn tính đúng sau khi giá đổi.
 *
 * Nếu giá thay đổi: thêm một mốc mới vào `tiers`, KHÔNG sửa mốc cũ.
 */

export interface PriceTier {
  /** Mốc thời gian (ISO, UTC) từ đó mức giá này có hiệu lực. */
  effectiveFrom: string
  /** USD trên 1 triệu token đầu vào. */
  inputPerMillion: number
  /** USD trên 1 triệu token đầu ra, đã gồm token suy luận. */
  outputPerMillion: number
  /** USD trên 1 triệu token đầu vào đọc từ cache ngữ cảnh. */
  cachedInputPerMillion: number
  /** USD trên 1 triệu token lưu cache mỗi giờ. */
  cacheStoragePerMillionHour: number
}

export interface ModelPrice {
  model: string
  /** Các mốc giá, sắp xếp tăng dần theo `effectiveFrom`. */
  tiers: readonly PriceTier[]
}

const STANDARD_CACHE_STORAGE = 1.0

export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
  /**
   * Model chất lượng cao — dùng cho sinh kế hoạch tuần và chat nâng cao.
   * Chú ý: giá tăng gấp đôi từ 01/01/2027. Đã mã hoá sẵn mốc thứ hai.
   */
  'gemini-3.8-flash': {
    model: 'gemini-3.8-flash',
    tiers: [
      {
        effectiveFrom: '2026-01-01T00:00:00Z',
        inputPerMillion: 0.75,
        outputPerMillion: 3.75,
        cachedInputPerMillion: 0.075,
        cacheStoragePerMillionHour: 0.5,
      },
      {
        effectiveFrom: '2027-01-01T00:00:00Z',
        inputPerMillion: 1.5,
        outputPerMillion: 7.5,
        cachedInputPerMillion: 0.15,
        cacheStoragePerMillionHour: 1.0,
      },
    ],
  },

  /** Model chạy khối lượng lớn: hiểu bữa ăn, insight, đặt tiêu đề hội thoại, chat mặc định. */
  'gemini-3.5-flash-lite': {
    model: 'gemini-3.5-flash-lite',
    tiers: [
      {
        effectiveFrom: '2026-01-01T00:00:00Z',
        inputPerMillion: 0.3,
        outputPerMillion: 2.5,
        cachedInputPerMillion: 0.03,
        cacheStoragePerMillionHour: STANDARD_CACHE_STORAGE,
      },
    ],
  },

  /** Model rẻ nhất — dự phòng khi cần tiết kiệm tối đa. */
  'gemini-3.1-flash-lite': {
    model: 'gemini-3.1-flash-lite',
    tiers: [
      {
        effectiveFrom: '2026-01-01T00:00:00Z',
        inputPerMillion: 0.25,
        outputPerMillion: 1.5,
        cachedInputPerMillion: 0.025,
        cacheStoragePerMillionHour: STANDARD_CACHE_STORAGE,
      },
    ],
  },
}

/** Mốc giá đang áp dụng cho một model tại một thời điểm. */
export function priceFor(model: string, at: Date = new Date()): PriceTier {
  const entry = MODEL_PRICES[model]
  if (entry === undefined) {
    throw new Error(`Chưa có bảng giá cho model "${model}". Thêm vào MODEL_PRICES trước khi dùng.`)
  }

  const timestamp = at.getTime()
  let chosen = entry.tiers[0]
  for (const tier of entry.tiers) {
    if (new Date(tier.effectiveFrom).getTime() <= timestamp) {
      chosen = tier
    }
  }
  if (chosen === undefined) {
    throw new Error(`Model "${model}" không có mốc giá nào hợp lệ.`)
  }
  return chosen
}

export function isKnownModel(model: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODEL_PRICES, model)
}

export function knownModels(): string[] {
  return Object.keys(MODEL_PRICES)
}
