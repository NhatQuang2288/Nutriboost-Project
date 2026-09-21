import { InMemoryAiStore, gatewayMessage } from '@nutriboost/ai'
import { describe, expect, it } from 'vitest'

import { checkChatAllowance, recordChatCall } from './chat-usage'

const USER = 'aaaaaaaa-0000-0000-0000-000000000001'

function info(model = 'deepseek-flash') {
  return { inputTokens: 1000, outputTokens: 500, cachedTokens: 0, model }
}

describe('checkChatAllowance', () => {
  it('cho qua khi chưa có kho lưu trữ (chế độ dữ liệu mẫu)', async () => {
    const result = await checkChatAllowance({
      store: null,
      userId: USER,
      dailyChatLimit: 1,
      dailyBudgetUsd: 0,
    })

    expect(result.allowed).toBe(true)
    expect(result.message).toBeNull()
  })

  it('cho qua khi không biết người dùng', async () => {
    const result = await checkChatAllowance({
      store: new InMemoryAiStore(),
      userId: null,
      dailyChatLimit: 0,
      dailyBudgetUsd: 0,
    })

    expect(result.allowed).toBe(true)
  })

  it('chặn khi đã dùng hết lượt trong ngày', async () => {
    const store = new InMemoryAiStore()
    const args = { store, userId: USER, dailyChatLimit: 2, dailyBudgetUsd: 100 }

    expect((await checkChatAllowance(args)).allowed).toBe(true)
    expect((await checkChatAllowance(args)).allowed).toBe(true)

    const third = await checkChatAllowance(args)
    expect(third.allowed).toBe(false)
    expect(third.status).toBe('rate_limited')
    // Dùng chung câu chữ với cổng, để hai đường không nói hai kiểu khác nhau.
    expect(third.message).toBe(gatewayMessage('rate_limited'))
  })

  it('chặn khi đã chạm trần chi phí trong ngày', async () => {
    const store = new InMemoryAiStore()
    await store.logCall({
      userId: USER,
      purpose: 'chat',
      model: 'deepseek-flash',
      promptVersion: 'chat-system@v1',
      usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
      costUsd: 0.05,
      latencyMs: 10,
      status: 'ok',
      errorCode: null,
      cacheHit: false,
    })

    const result = await checkChatAllowance({
      store,
      userId: USER,
      dailyChatLimit: 40,
      dailyBudgetUsd: 0.02,
    })

    expect(result.allowed).toBe(false)
    expect(result.status).toBe('budget_exceeded')
    expect(result.message).toBe(gatewayMessage('budget_exceeded'))
  })

  it('trần chi phí tính theo từng người, không phải toàn hệ thống', async () => {
    const store = new InMemoryAiStore()
    await store.logCall({
      userId: 'nguoi-khac',
      purpose: 'chat',
      model: 'deepseek-flash',
      promptVersion: 'chat-system@v1',
      usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
      costUsd: 5,
      latencyMs: 10,
      status: 'ok',
      errorCode: null,
      cacheHit: false,
    })

    const result = await checkChatAllowance({
      store,
      userId: USER,
      dailyChatLimit: 40,
      dailyBudgetUsd: 0.02,
    })

    expect(result.allowed).toBe(true)
  })

  it('hạn mức bằng 0 khoá hoàn toàn', async () => {
    const result = await checkChatAllowance({
      store: new InMemoryAiStore(),
      userId: USER,
      dailyChatLimit: 0,
      dailyBudgetUsd: 100,
    })

    expect(result.allowed).toBe(false)
  })
})

describe('recordChatCall', () => {
  it('ghi đủ trường vào nhật ký, kèm chi phí tính từ bảng giá', async () => {
    const store = new InMemoryAiStore()

    const id = await recordChatCall({ store, userId: USER, info: info(), latencyMs: 1234 })

    expect(id).not.toBeNull()
    const record = store.recordedCalls()[0]
    expect(record).toBeDefined()
    expect(record?.purpose).toBe('chat')
    expect(record?.userId).toBe(USER)
    expect(record?.model).toBe('deepseek-flash')
    expect(record?.promptVersion).toBe('chat-system@v1')
    expect(record?.usage).toEqual({ inputTokens: 1000, outputTokens: 500, cachedTokens: 0 })
    expect(record?.latencyMs).toBe(1234)
    expect(record?.status).toBe('ok')
    expect(record?.costUsd).toBeGreaterThan(0)
  })

  it('model chưa khai báo giá vẫn ghi nhật ký, chi phí 0 kèm mã lỗi', async () => {
    // Thiếu bảng giá không được làm hỏng lượt gọi — người dùng vẫn cần câu trả lời. Nhưng
    // phải để lại dấu vết, nếu không con số tổng chi phí sẽ âm thầm sai.
    const store = new InMemoryAiStore()

    await recordChatCall({
      store,
      userId: USER,
      info: info('model-không-có-trong-bảng-giá'),
      latencyMs: 10,
    })

    const record = store.recordedCalls()[0]
    expect(record?.costUsd).toBe(0)
    expect(record?.errorCode).toBe('unknown_model_price')
    expect(record?.status).toBe('ok')
  })

  it('không có kho lưu trữ thì không ghi gì và không ném lỗi', async () => {
    await expect(
      recordChatCall({ store: null, userId: USER, info: info(), latencyMs: 10 }),
    ).resolves.toBeNull()
  })
})
