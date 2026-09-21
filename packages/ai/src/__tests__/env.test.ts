import { describe, expect, it } from 'vitest'

import { DEFAULT_AI_LIMITS, aiDisabledReason, isAiConfigured, readAiEnv } from '../env'

/**
 * `readAiEnv` đọc từ `process.env` nên test phải tự dựng môi trường. `restoreMocks: true`
 * trong vitest.config.ts lo phần dọn dẹp sau mỗi test.
 */

function withEnv(values: Record<string, string>, run: () => void): void {
  const saved = new Map<string, string | undefined>()
  for (const [key, value] of Object.entries(values)) {
    saved.set(key, process.env[key])
    process.env[key] = value
  }

  try {
    run()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe('readAiEnv', () => {
  it('dùng hạn mức mặc định khi không có biến môi trường', () => {
    const env = readAiEnv()
    expect(env.limits.chat).toBe(DEFAULT_AI_LIMITS.chat)
    expect(env.limits.estimate_meal).toBe(DEFAULT_AI_LIMITS.estimate_meal)
  })

  it('hạn mức ước lượng bữa ăn có biến riêng, không dùng chung với phân tích', () => {
    /*
     * Trước đây cả hai cùng đọc `AI_LIMIT_PARSE_PER_DAY`. Hệ quả: đặt hạn mức cho việc phân
     * tích bữa ăn lại âm thầm đổi luôn hạn mức ước lượng, vì hai dòng cùng trỏ một biến.
     */
    withEnv({ AI_LIMIT_PARSE_PER_DAY: '7' }, () => {
      const env = readAiEnv()
      expect(env.limits.parse_meal).toBe(7)
      expect(env.limits.estimate_meal).toBe(DEFAULT_AI_LIMITS.estimate_meal)
    })
  })

  it('đọc được hạn mức riêng của từng mục đích', () => {
    withEnv({ AI_LIMIT_ESTIMATE_PER_DAY: '11', AI_LIMIT_CHAT_PER_DAY: '12' }, () => {
      const env = readAiEnv()
      expect(env.limits.estimate_meal).toBe(11)
      expect(env.limits.chat).toBe(12)
    })
  })

  it('bỏ qua giá trị không phải số và giá trị âm', () => {
    withEnv({ AI_LIMIT_CHAT_PER_DAY: 'không phải số' }, () => {
      expect(readAiEnv().limits.chat).toBe(DEFAULT_AI_LIMITS.chat)
    })
    withEnv({ AI_LIMIT_CHAT_PER_DAY: '-5' }, () => {
      expect(readAiEnv().limits.chat).toBe(DEFAULT_AI_LIMITS.chat)
    })
  })

  it('coi khoá rỗng là chưa cấu hình', () => {
    withEnv({ DEEPSEEK_API_KEY: '   ' }, () => {
      expect(readAiEnv().apiKey).toBeNull()
      expect(isAiConfigured()).toBe(false)
    })
  })

  it('công tắc dừng khẩn cấp tắt AI dù có khoá', () => {
    withEnv({ DEEPSEEK_API_KEY: 'khoá-thật', AI_KILL_SWITCH: 'true' }, () => {
      expect(isAiConfigured()).toBe(false)
      expect(aiDisabledReason()).toMatch(/tạm nghỉ/)
    })
  })

  it('nói rõ lý do khi chưa có khoá', () => {
    /*
     * Phải đặt CẢ HAI biến, không chỉ xoá khoá.
     *
     * `aiDisabledReason` xét công tắc dừng TRƯỚC khi xét khoá, mà CI đặt
     * `AI_KILL_SWITCH=true` ở cấp job (để `next build` và bộ E2E chạy tất định). Chỉ xoá khoá
     * thì test rơi vào nhánh công tắc và đỏ — đúng như đã xảy ra: xanh ở máy, đỏ ở CI.
     */
    withEnv({ DEEPSEEK_API_KEY: '', AI_KILL_SWITCH: 'false' }, () => {
      expect(aiDisabledReason()).toMatch(/Chưa cấu hình khoá DeepSeek/)
    })
  })

  it('công tắc dừng được xét TRƯỚC khoá thiếu', () => {
    // Khoá lại thứ tự đó, vì nó là lý do test trên từng phụ thuộc môi trường: đặt công tắc
    // mà không có khoá thì thông báo phải nói về bảo trì, không phải về khoá.
    withEnv({ DEEPSEEK_API_KEY: '', AI_KILL_SWITCH: 'true' }, () => {
      expect(aiDisabledReason()).toMatch(/tạm nghỉ/)
    })
  })
})
