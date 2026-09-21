/**
 * Bảng giá model — nguồn chân lý cho `ai_calls.cost_usd`.
 *
 * Số liệu lấy từ trang giá chính thức của DeepSeek API, đối chiếu ngày 21/09/2026:
 * https://api-docs.deepseek.com/quick_start/pricing/
 *
 * **Giá thay đổi theo thời gian**, nên bảng này mã hoá cả ngày hiệu lực thay vì chỉ một con
 * số. Nhờ vậy chi phí lịch sử vẫn tính đúng sau khi giá đổi. Nếu giá thay đổi: thêm một mốc
 * mới vào `tiers`, KHÔNG sửa mốc cũ.
 *
 * ## DeepSeek khác Gemini ở một điểm quan trọng: giá theo GIỜ
 *
 * DeepSeek tính **một nửa giá** ngoài giờ cao điểm. Giờ cao điểm là 01:00–04:00 và
 * 06:00–10:00 UTC, thứ Hai tới thứ Sáu, trừ ngày lễ Trung Quốc; mọi giờ khác — kể cả cả ngày
 * cuối tuần — là thấp điểm.
 *
 * Nên một mốc giá không còn là một con số, mà là hai: `peak` và `offPeak`. Bỏ qua chuyện này
 * thì chi phí ghi vào `ai_calls` lệch tới **gấp đôi**, và phân tích biên lợi nhuận trong
 * `docs/PRICING.md` mất giá trị.
 *
 * ## Vì sao bảng này chỉ có model DeepSeek
 *
 * `computeCostUsd` chỉ dùng bảng này cho lời gọi MỚI. Chi phí của lời gọi cũ đã nằm sẵn trong
 * `ai_calls.cost_usd` tại thời điểm gọi, nên bỏ model cũ khỏi bảng không làm sai số liệu lịch
 * sử. Giữ lại những dòng không ai gọi chỉ làm người đọc tưởng chúng còn được dùng.
 */

/** Đơn giá của một mốc giá, tính bằng USD trên 1 triệu token. */
export interface PriceRate {
  /** Token đầu vào KHÔNG đọc từ cache. */
  inputPerMillion: number
  /** Token đầu ra, đã gồm token suy luận. */
  outputPerMillion: number
  /** Token đầu vào đọc từ cache ngữ cảnh. Rẻ hơn `inputPerMillion` vài chục lần. */
  cachedInputPerMillion: number
  /** USD trên 1 triệu token lưu cache mỗi giờ. DeepSeek không thu khoản này. */
  cacheStoragePerMillionHour: number
}

export interface PriceTier {
  /** Mốc thời gian (ISO, UTC) từ đó mức giá này có hiệu lực. */
  effectiveFrom: string
  /** Giá giờ cao điểm. Cũng là mức dùng khi không xác định được giờ. */
  peak: PriceRate
  /**
   * Giá giờ thấp điểm. Bỏ trống nghĩa là nhà cung cấp không phân biệt giờ — khi đó `peak`
   * được dùng cho mọi thời điểm.
   */
  offPeak?: PriceRate
}

export interface ModelPrice {
  model: string
  /** Các mốc giá, sắp xếp tăng dần theo `effectiveFrom`. */
  tiers: readonly PriceTier[]
}

/**
 * Giờ cao điểm của DeepSeek, theo UTC: 01:00–04:00 và 06:00–10:00.
 *
 * Ngày lễ Trung Quốc được tính là **cao điểm**, dù tài liệu nói lễ là thấp điểm. Đây là chủ ý:
 * danh sách ngày lễ đổi hằng năm và không nằm trong tài liệu API, nên mã hoá nó là chắc chắn
 * sai vào một lúc nào đó. Tính dư vài ngày lễ mỗi năm làm trần chi phí chặn sớm hơn một chút;
 * tính thiếu thì trần chi phí **không chặn** đúng lúc cần chặn.
 */
const PEAK_WINDOWS_UTC: readonly (readonly [number, number])[] = [
  [60, 240], // 01:00–04:00
  [360, 600], // 06:00–10:00
]

export function isOffPeak(at: Date): boolean {
  const weekday = at.getUTCDay()
  // 0 = Chủ nhật, 6 = thứ Bảy. Cả ngày cuối tuần là thấp điểm.
  if (weekday === 0 || weekday === 6) return true

  const minutes = at.getUTCHours() * 60 + at.getUTCMinutes()
  return !PEAK_WINDOWS_UTC.some(([from, to]) => minutes >= from && minutes < to)
}

/** Giá DeepSeek công bố ngày 21/09/2026. Giờ thấp điểm đúng bằng một nửa giờ cao điểm. */
const DEEPSEEK_PRICING_FROM = '2026-09-21T00:00:00Z'

export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
  /**
   * Model chạy khối lượng lớn: hiểu bữa ăn, insight, đặt tiêu đề hội thoại, chat mặc định.
   *
   * Hỗ trợ JSON Output và Tool Calls, nên đường gọi có cấu trúc (AI Gateway) dùng được.
   */
  'deepseek-flash': {
    model: 'deepseek-flash',
    tiers: [
      {
        effectiveFrom: DEEPSEEK_PRICING_FROM,
        peak: {
          inputPerMillion: 0.3,
          outputPerMillion: 1.2,
          cachedInputPerMillion: 0.006,
          cacheStoragePerMillionHour: 0,
        },
        offPeak: {
          inputPerMillion: 0.15,
          outputPerMillion: 0.6,
          cachedInputPerMillion: 0.003,
          cacheStoragePerMillionHour: 0,
        },
      },
    ],
  },

  /**
   * Model chất lượng: sinh kế hoạch tuần, và chat khi người dùng chủ động nâng cấp.
   *
   * Đắt hơn `deepseek-flash` khoảng 4,4 lần ở đầu vào và 3,3 lần ở đầu ra, nên `MODEL_ROUTES`
   * chỉ đưa những việc thật sự cần suy nghĩ lên đây.
   */
  'deepseek-v4-pro': {
    model: 'deepseek-v4-pro',
    tiers: [
      {
        effectiveFrom: DEEPSEEK_PRICING_FROM,
        peak: {
          inputPerMillion: 1.32,
          outputPerMillion: 3.96,
          cachedInputPerMillion: 0.044,
          cacheStoragePerMillionHour: 0,
        },
        offPeak: {
          inputPerMillion: 0.66,
          outputPerMillion: 1.98,
          cachedInputPerMillion: 0.022,
          cacheStoragePerMillionHour: 0,
        },
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

/**
 * Đơn giá áp dụng cho một model tại một thời điểm, đã tính giờ cao điểm / thấp điểm.
 *
 * Tách khỏi `priceFor` vì hai câu hỏi khác nhau: `priceFor` trả lời "mốc giá nào đang hiệu
 * lực", còn hàm này trả lời "thời điểm này trả bao nhiêu". Trộn hai việc vào một hàm thì không
 * kiểm thử được phần chọn mốc mà không kéo theo phần chọn giờ.
 */
export function rateFor(model: string, at: Date = new Date()): PriceRate {
  const tier = priceFor(model, at)
  if (tier.offPeak !== undefined && isOffPeak(at)) return tier.offPeak
  return tier.peak
}

export function isKnownModel(model: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODEL_PRICES, model)
}

export function knownModels(): string[] {
  return Object.keys(MODEL_PRICES)
}
