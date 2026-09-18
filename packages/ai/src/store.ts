import type { AiCallStatus } from '@nutriboost/db'

import type { TokenUsage } from './cost'
import type { AiPurpose } from './models'

/**
 * Lớp lưu trữ mà AI Gateway cần.
 *
 * Tách thành giao diện để gateway kiểm thử được mà không cần CSDL, và để bản
 * Supabase có thể nằm ở tầng ứng dụng.
 *
 * Lưu ý bảo mật: `ai_calls`, `ai_cache` và `ai_rate_limits` **không** có chính sách
 * RLS cho người dùng (xem migration 002). Chỉ service role ghi được.
 */

export interface AiCallRecord {
  userId: string | null
  purpose: AiPurpose
  model: string
  promptVersion: string
  usage: TokenUsage
  costUsd: number
  latencyMs: number
  status: AiCallStatus
  errorCode: string | null
  cacheHit: boolean
}

export interface CachedResponse {
  response: unknown
  model: string
  promptVersion: string
}

export interface AiStore {
  /**
   * Trừ một lượt trong hạn mức ngày. Trả về `false` khi đã chạm trần.
   * Phải nguyên tử — xem `claim_ai_quota` trong migration 003.
   */
  claimQuota(userId: string, purpose: AiPurpose, limit: number): Promise<boolean>

  getCached(cacheKey: string): Promise<CachedResponse | null>

  setCached(entry: {
    cacheKey: string
    purpose: AiPurpose
    model: string
    promptVersion: string
    response: unknown
    ttlSeconds: number
  }): Promise<void>

  /** Ghi nhật ký lời gọi. Trả về id bản ghi nếu lấy được. */
  logCall(record: AiCallRecord): Promise<string | null>

  /** Tổng chi phí đã dùng trong ngày của một người dùng, USD. */
  dailyCostUsd(userId: string, at: Date): Promise<number>
}

/** Khoá ngày theo UTC — khớp `date_trunc('day', now())` trong `claim_ai_quota`. */
export function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10)
}

/**
 * Bản lưu trữ trong bộ nhớ — dùng cho test và cho chế độ chạy không có CSDL.
 *
 * Chi phí được cộng dồn theo khoá ngày ngay lúc ghi, thay vì tính lại bằng cách
 * quét lịch sử: bản đầu tiên quét lịch sử nhưng so sánh nhầm nên cộng dồn cả
 * những lời gọi của ngày khác.
 */
export class InMemoryAiStore implements AiStore {
  private readonly quotas = new Map<string, number>()
  private readonly cache = new Map<string, { entry: CachedResponse; expiresAt: number }>()
  private readonly calls: AiCallRecord[] = []
  private readonly costByUserDay = new Map<string, number>()

  constructor(private readonly now: () => Date = () => new Date()) {}

  async claimQuota(userId: string, purpose: AiPurpose, limit: number): Promise<boolean> {
    if (limit <= 0) return false
    const key = `${userId}:${purpose}:${dayKey(this.now())}`
    const used = this.quotas.get(key) ?? 0
    if (used >= limit) return false
    this.quotas.set(key, used + 1)
    return true
  }

  async getCached(cacheKey: string): Promise<CachedResponse | null> {
    const hit = this.cache.get(cacheKey)
    if (hit === undefined) return null
    if (hit.expiresAt <= this.now().getTime()) {
      this.cache.delete(cacheKey)
      return null
    }
    return hit.entry
  }

  async setCached(entry: {
    cacheKey: string
    purpose: AiPurpose
    model: string
    promptVersion: string
    response: unknown
    ttlSeconds: number
  }): Promise<void> {
    this.cache.set(entry.cacheKey, {
      entry: {
        response: entry.response,
        model: entry.model,
        promptVersion: entry.promptVersion,
      },
      expiresAt: this.now().getTime() + entry.ttlSeconds * 1000,
    })
  }

  async logCall(record: AiCallRecord): Promise<string | null> {
    this.calls.push(record)
    if (record.userId !== null) {
      const key = `${record.userId}:${dayKey(this.now())}`
      this.costByUserDay.set(key, (this.costByUserDay.get(key) ?? 0) + record.costUsd)
    }
    return `call-${this.calls.length}`
  }

  async dailyCostUsd(userId: string, at: Date): Promise<number> {
    return this.costByUserDay.get(`${userId}:${dayKey(at)}`) ?? 0
  }

  /** Chỉ dùng cho test. */
  recordedCalls(): readonly AiCallRecord[] {
    return this.calls
  }
}
