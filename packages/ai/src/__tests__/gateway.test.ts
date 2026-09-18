import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  ModelCallError,
  type StructuredCallArgs,
  type StructuredCallResult,
  type StructuredModelClient,
} from '../client'
import type { TokenUsage } from '../cost'
import type { AiEnv } from '../env'
import { createAiGateway } from '../gateway'
import { InMemoryAiStore } from '../store'

const USAGE: TokenUsage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
const AT = new Date('2026-09-18T10:00:00Z')
const schema = z.object({ title: z.string() })

function makeEnv(overrides: Partial<AiEnv> = {}): AiEnv {
  return {
    apiKey: 'test-key',
    models: { fast: 'gemini-3.5-flash-lite', quality: 'gemini-3.8-flash' },
    dailyBudgetUsd: 1,
    killSwitch: false,
    limits: { parse_meal: 5, estimate_meal: 5, generate_plan: 2, chat: 5, insight: 1, title: 5 },
    ...overrides,
  }
}

/** Cổng giả ghi lại model đã được gọi, để kiểm tra định tuyến. */
function makeClient(response: unknown = { title: 'Tiêu đề hội thoại' }) {
  const models: string[] = []
  const client: StructuredModelClient = {
    async generate<T>(args: StructuredCallArgs<T>): Promise<StructuredCallResult<T>> {
      models.push(args.model)
      return {
        object: args.schema.parse(response) as T,
        usage: USAGE,
        finishReason: 'stop',
      }
    },
  }
  return { client, models }
}

function makeFailingClient(error: unknown) {
  const client: StructuredModelClient = {
    generate<T>(): Promise<StructuredCallResult<T>> {
      return Promise.reject(error)
    },
  }
  return { client }
}

function setup(overrides: { env?: Partial<AiEnv>; client?: StructuredModelClient } = {}) {
  const store = new InMemoryAiStore(() => AT)
  const generated = overrides.client === undefined ? makeClient() : null
  const client = overrides.client ?? generated!.client
  const gateway = createAiGateway({
    store,
    client,
    env: makeEnv(overrides.env),
    now: () => AT,
  })
  return { store, gateway, models: generated?.models ?? [] }
}

const BASE_ARGS = {
  purpose: 'chat' as const,
  userId: 'user-1',
  promptVersion: 'chat-system@v1',
  system: 'system',
  user: 'user',
  schema,
}

describe('createAiGateway — chặn trước khi gọi', () => {
  it('công tắc dừng khẩn cấp chặn mọi lời gọi', async () => {
    const { gateway, models } = setup({ env: { killSwitch: true } })
    const result = await gateway.generateStructured(BASE_ARGS)

    expect(result.status).toBe('blocked')
    expect(result.data).toBeNull()
    expect(models).toHaveLength(0)
    expect(result.message).not.toBeNull()
  })

  it('thiếu khoá API cũng bị chặn', async () => {
    const { gateway, models } = setup({ env: { apiKey: null } })
    const result = await gateway.generateStructured(BASE_ARGS)

    expect(result.status).toBe('blocked')
    expect(models).toHaveLength(0)
  })

  it('isAvailable phản ánh đúng cấu hình', () => {
    expect(setup().gateway.isAvailable()).toBe(true)
    expect(setup({ env: { killSwitch: true } }).gateway.isAvailable()).toBe(false)
    expect(setup({ env: { apiKey: null } }).gateway.isAvailable()).toBe(false)
  })
})

describe('createAiGateway — định tuyến model', () => {
  it('chat mặc định dùng model rẻ', async () => {
    const { gateway, models } = setup()
    await gateway.generateStructured(BASE_ARGS)
    expect(models).toEqual(['gemini-3.5-flash-lite'])
  })

  it('sinh kế hoạch dùng model chất lượng', async () => {
    const { gateway, models } = setup()
    await gateway.generateStructured({ ...BASE_ARGS, purpose: 'generate_plan' })
    expect(models).toEqual(['gemini-3.8-flash'])
  })

  it('chỉ nâng cấp khi được yêu cầu rõ ràng', async () => {
    const { gateway, models } = setup()
    await gateway.generateStructured({ ...BASE_ARGS, escalate: true })
    expect(models).toEqual(['gemini-3.8-flash'])
  })
})

describe('createAiGateway — lượt gọi thành công', () => {
  it('trả về dữ liệu, chi phí và id nhật ký', async () => {
    const { gateway, store } = setup()
    const result = await gateway.generateStructured(BASE_ARGS)

    expect(result.status).toBe('ok')
    expect(result.data).toEqual({ title: 'Tiêu đề hội thoại' })
    expect(result.costUsd).toBeGreaterThan(0)
    expect(result.callId).not.toBeNull()
    expect(result.usage.inputTokens).toBe(1000)
    expect(store.recordedCalls()).toHaveLength(1)
  })

  it('ghi nhật ký đủ trường cần cho việc theo dõi chi phí', async () => {
    const { gateway, store } = setup()
    await gateway.generateStructured(BASE_ARGS)

    const call = store.recordedCalls()[0]
    expect(call).toMatchObject({
      userId: 'user-1',
      purpose: 'chat',
      model: 'gemini-3.5-flash-lite',
      promptVersion: 'chat-system@v1',
      status: 'ok',
      cacheHit: false,
      errorCode: null,
    })
  })
})

describe('createAiGateway — cache', () => {
  it('trúng cache ở lần gọi thứ hai và không gọi model lại', async () => {
    const { gateway, models } = setup()
    const args = { ...BASE_ARGS, cacheKey: 'insight:user-1:2026-09-18' }

    const first = await gateway.generateStructured(args)
    const second = await gateway.generateStructured(args)

    expect(first.status).toBe('ok')
    expect(second.status).toBe('cache_hit')
    expect(second.costUsd).toBe(0)
    expect(models).toHaveLength(1)
  })

  it('trúng cache không tiêu hạn mức', async () => {
    const { gateway } = setup({ env: { limits: { ...makeEnv().limits, insight: 1 } } })
    const args = {
      ...BASE_ARGS,
      purpose: 'insight' as const,
      cacheKey: 'insight:user-1:2026-09-18',
    }

    await gateway.generateStructured(args)
    const second = await gateway.generateStructured(args)
    expect(second.status).toBe('cache_hit')
  })

  it('bỏ qua cache hỏng và gọi lại model', async () => {
    const store = new InMemoryAiStore(() => AT)
    await store.setCached({
      cacheKey: 'k',
      purpose: 'chat',
      model: 'gemini-3.5-flash-lite',
      promptVersion: 'chat-system@v1',
      response: { title: 123 },
      ttlSeconds: 60,
    })
    const { client, models } = makeClient()
    const gateway = createAiGateway({ store, client, env: makeEnv(), now: () => AT })

    const result = await gateway.generateStructured({ ...BASE_ARGS, cacheKey: 'k' })
    expect(result.status).toBe('ok')
    expect(models).toHaveLength(1)
  })
})

describe('createAiGateway — hạn mức và ngân sách', () => {
  it('chặn khi vượt hạn mức trong ngày', async () => {
    const { gateway } = setup({ env: { limits: { ...makeEnv().limits, insight: 1 } } })
    const args = { ...BASE_ARGS, purpose: 'insight' as const }

    const first = await gateway.generateStructured(args)
    const second = await gateway.generateStructured(args)

    expect(first.status).toBe('ok')
    expect(second.status).toBe('rate_limited')
    expect(second.quotaExhausted).toBe(true)
    expect(second.data).toBeNull()
  })

  it('chặn khi vượt trần chi phí trong ngày', async () => {
    const { gateway } = setup({ env: { dailyBudgetUsd: 0.0000001 } })

    const first = await gateway.generateStructured(BASE_ARGS)
    const second = await gateway.generateStructured(BASE_ARGS)

    expect(first.status).toBe('ok')
    expect(second.status).toBe('budget_exceeded')
  })

  it('không áp hạn mức cho tác vụ hệ thống không có người dùng', async () => {
    const { gateway } = setup({ env: { limits: { ...makeEnv().limits, title: 0 } } })
    const result = await gateway.generateStructured({
      ...BASE_ARGS,
      purpose: 'title',
      userId: null,
    })
    expect(result.status).toBe('ok')
  })
})

describe('createAiGateway — xử lý lỗi', () => {
  it('ánh xạ lỗi hết giờ thành trạng thái timeout', async () => {
    const { client } = makeFailingClient(new ModelCallError('timeout', 'timeout', 'hết giờ'))
    const { gateway } = setup({ client })
    const result = await gateway.generateStructured(BASE_ARGS)

    expect(result.status).toBe('timeout')
    expect(result.message).not.toBeNull()
  })

  it('ánh xạ lỗi đầu ra sai schema', async () => {
    const { client } = makeFailingClient(
      new ModelCallError('invalid_output', 'no_object', 'không khớp schema'),
    )
    const { gateway } = setup({ client })
    const result = await gateway.generateStructured(BASE_ARGS)
    expect(result.status).toBe('invalid_output')
  })

  it('ánh xạ lỗi không rõ thành trạng thái error', async () => {
    const { client } = makeFailingClient(new Error('mạng hỏng'))
    const { gateway } = setup({ client })
    const result = await gateway.generateStructured(BASE_ARGS)
    expect(result.status).toBe('error')
  })

  it('vẫn ghi nhật ký khi lời gọi thất bại', async () => {
    const { client } = makeFailingClient(new ModelCallError('timeout', 'timeout', 'hết giờ'))
    const store = new InMemoryAiStore(() => AT)
    const gateway = createAiGateway({ store, client, env: makeEnv(), now: () => AT })

    await gateway.generateStructured(BASE_ARGS)

    expect(store.recordedCalls()).toHaveLength(1)
    expect(store.recordedCalls()[0]).toMatchObject({ status: 'timeout', errorCode: 'timeout' })
  })

  it('model thiếu bảng giá KHÔNG làm hỏng lượt gọi — chỉ ghi chi phí 0 kèm mã lỗi', async () => {
    const { client } = makeClient()
    const store = new InMemoryAiStore(() => AT)
    const gateway = createAiGateway({
      store,
      client,
      // Ép model chất lượng sang một tên chưa có trong bảng giá.
      env: makeEnv({ models: { fast: 'gemini-3.5-flash-lite', quality: 'model-chua-khai-bao' } }),
      now: () => AT,
    })

    const result = await gateway.generateStructured({ ...BASE_ARGS, escalate: true })

    expect(result.status).toBe('ok')
    expect(result.data).toEqual({ title: 'Tiêu đề hội thoại' })
    expect(result.costUsd).toBe(0)
    expect(store.recordedCalls()[0]?.errorCode).toBe('unknown_model_price')
  })

  it('không tính chi phí cho lượt gọi thất bại', async () => {
    const { client } = makeFailingClient(new Error('hỏng'))
    const { gateway } = setup({ client })
    const result = await gateway.generateStructured(BASE_ARGS)
    expect(result.costUsd).toBe(0)
  })
})
