import type { AiCallRecord, AiPurpose, AiStore, CachedResponse } from '@nutriboost/ai'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServiceClient } from '@/lib/supabase/server'

/**
 * Bản Supabase của `AiStore`.
 *
 * Vì sao nằm ở tầng ứng dụng chứ không ở `packages/ai`: gói đó không được phụ thuộc Next.js hay
 * `@supabase/supabase-js`, và `packages/ai/src/store.ts` đã ghi rõ ý định này khi tách giao
 * diện `AiStore` ra khỏi bản dùng trong bộ nhớ.
 *
 * Vì sao dùng **khoá service role** chứ không phải phiên người dùng: `ai_calls`, `ai_cache` và
 * `ai_rate_limits` cố ý không có chính sách RLS cho người dùng (xem migration 002) — người dùng
 * không được tự ghi nhật ký chi phí của mình, và cũng không được tự đọc hạn mức để chỉnh. Chỉ
 * service role ghi được. Vì vậy `claim_ai_quota` cũng chỉ được cấp cho `service_role`
 * (migration 006) — nếu để người dùng gọi trực tiếp thì họ tự nâng trần AI của mình.
 */

export function createSupabaseAiStore(): AiStore | null {
  const client = createSupabaseServiceClient()
  if (client === null) return null
  return new SupabaseAiStore(client)
}

export class SupabaseAiStore implements AiStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async claimQuota(userId: string, purpose: AiPurpose, limit: number): Promise<boolean> {
    if (limit <= 0) return false

    const { data, error } = await this.client.rpc('claim_ai_quota', {
      p_user_id: userId,
      p_purpose: purpose,
      p_limit: limit,
    })

    // Lỗi ở đây phải khoá lại, không mở ra: hạn mức là ràng buộc kinh tế, nên khi không
    // kiểm tra được thì mặc định là "không cho gọi" chứ không phải "cho gọi thoải mái".
    if (error !== null) return false
    return data === true
  }

  async getCached(cacheKey: string): Promise<CachedResponse | null> {
    const { data, error } = await this.client
      .from('ai_cache')
      .select('response, model, prompt_version, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (error !== null || data === null) return null

    const row = data as {
      response: unknown
      model: string
      prompt_version: string
      expires_at: string
    }

    // Kiểm tra hạn ở đây thay vì tin vào việc dọn dẹp định kỳ: hàng hết hạn vẫn nằm trong
    // bảng cho tới khi có tiến trình xoá, và trả về kết quả hết hạn là trả lời sai.
    if (Date.parse(row.expires_at) <= this.now().getTime()) return null

    return { response: row.response, model: row.model, promptVersion: row.prompt_version }
  }

  async setCached(entry: {
    cacheKey: string
    purpose: AiPurpose
    model: string
    promptVersion: string
    response: unknown
    ttlSeconds: number
  }): Promise<void> {
    await this.client.from('ai_cache').upsert(
      {
        cache_key: entry.cacheKey,
        purpose: entry.purpose,
        response: entry.response as never,
        model: entry.model,
        prompt_version: entry.promptVersion,
        expires_at: new Date(this.now().getTime() + entry.ttlSeconds * 1000).toISOString(),
      },
      { onConflict: 'cache_key' },
    )
  }

  async logCall(record: AiCallRecord): Promise<string | null> {
    const { data, error } = await this.client
      .from('ai_calls')
      .insert({
        user_id: record.userId,
        purpose: record.purpose,
        model: record.model,
        prompt_version: record.promptVersion,
        input_tokens: record.usage.inputTokens,
        output_tokens: record.usage.outputTokens,
        cached_tokens: record.usage.cachedTokens,
        cost_usd: record.costUsd,
        latency_ms: record.latencyMs,
        status: record.status,
        error_code: record.errorCode,
        cache_hit: record.cacheHit,
      })
      .select('id')
      .maybeSingle()

    if (error !== null || data === null) return null
    return (data as { id: string }).id
  }

  /**
   * Tổng chi phí trong ngày của một người dùng.
   *
   * Cộng ở tầng ứng dụng chứ không bằng `sum()` của PostgreSQL vì PostgREST không làm được
   * phép gộp nếu không có view hoặc hàm riêng. Số dòng bị chặn trên bởi chính các hạn mức
   * trong `DEFAULT_AI_LIMITS` (khoảng 150 lượt mỗi người mỗi ngày), nên đây là một truy vấn
   * nhỏ. Nếu sau này nâng hạn mức lên hàng nghìn thì phải thay bằng một hàm gộp trong CSDL.
   */
  async dailyCostUsd(userId: string, at: Date): Promise<number> {
    const startOfDay = new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
    ).toISOString()
    const startOfNextDay = new Date(Date.parse(startOfDay) + 86_400_000).toISOString()

    const { data, error } = await this.client
      .from('ai_calls')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('created_at', startOfDay)
      .lt('created_at', startOfNextDay)

    if (error !== null || data === null) return 0

    return (data as { cost_usd: number | string }[]).reduce(
      (sum, row) => sum + Number(row.cost_usd),
      0,
    )
  }
}
