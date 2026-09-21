import { describe, expect, it } from 'vitest'

import { inspectStreamHead } from './stream-guard'

/** Một dòng SSE mang phần tử của giao thức UI message stream. */
function part(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

function start(): string {
  return part({ type: 'start', messageId: 'm1' })
}

/**
 * Stream phát ra đúng các đoạn đã cho, mỗi đoạn một lần đọc.
 *
 * Chia nhỏ như vậy là để kiểm được cạm bẫy thật: trình duyệt và mạng không bảo đảm một phần tử
 * SSE nằm trọn trong một lần đọc.
 */
function streamOf(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

async function drain(body: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(body).text()
}

describe('inspectStreamHead', () => {
  it('nhận ra model hỏng ngay khi chưa trả chữ nào', async () => {
    // Đây là hình dạng thật của một lượt gọi với khoá sai, lấy từ stream của DeepSeek.
    const result = await inspectStreamHead(
      streamOf([
        start(),
        part({ type: 'error', errorText: 'An error occurred.' }),
        'data: [DONE]\n\n',
      ]),
    )

    expect(result.failedEarly).toBe(true)
  })

  it('nhận ra lỗi kể cả khi phần tử `error` bị cắt ngang giữa hai lần đọc', async () => {
    // Lần đọc đầu dừng giữa chữ `error`, nên chưa phân tích được thành JSON. Kết luận vội ở
    // đây sẽ cho rằng model trả lời bình thường và lỗi sẽ lọt ra trình duyệt.
    const whole = start() + part({ type: 'error', errorText: 'An error occurred.' })
    const cut = Math.floor(whole.length / 2)

    const result = await inspectStreamHead(streamOf([whole.slice(0, cut), whole.slice(cut)]))

    expect(result.failedEarly).toBe(true)
  })

  it('chuyển tiếp nguyên vẹn khi model trả lời bình thường', async () => {
    const chunks = [
      start(),
      part({ type: 'text-start', id: 't1' }),
      part({ type: 'text-delta', id: 't1', delta: 'Chào ' }),
      part({ type: 'text-delta', id: 't1', delta: 'bạn' }),
      part({ type: 'finish' }),
      'data: [DONE]\n\n',
    ]

    const result = await inspectStreamHead(streamOf(chunks))
    expect(result.failedEarly).toBe(false)

    if (result.failedEarly) throw new Error('không thể tới đây')

    // Không được mất byte nào: byte đã đọc để soi phải được ghép lại trước phần còn lại.
    expect(await drain(result.body)).toBe(chunks.join(''))
  })

  it('KHÔNG coi lỗi giữa dòng là lỗi sớm', async () => {
    // Đã có chữ hiển thị cho người dùng thì không thể thay bằng câu trả lời khác nữa; thay vào
    // đó lỗi phải đi tiếp tới giao diện như trước.
    const chunks = [
      start(),
      part({ type: 'text-start', id: 't1' }),
      part({ type: 'text-delta', id: 't1', delta: 'Mình nhận ra 2 món' }),
      part({ type: 'error', errorText: 'An error occurred.' }),
    ]

    const result = await inspectStreamHead(streamOf(chunks))
    expect(result.failedEarly).toBe(false)

    if (result.failedEarly) throw new Error('không thể tới đây')

    expect(await drain(result.body)).toBe(chunks.join(''))
  })

  it('coi `error` đứng một mình là lỗi sớm', async () => {
    // Không có `start` vẫn phải kết luận đúng, vì đó cũng là hỏng trước khi có nội dung.
    const result = await inspectStreamHead(
      streamOf([part({ type: 'error', errorText: 'An error occurred.' })]),
    )

    expect(result.failedEarly).toBe(true)
  })

  it('để lỗi đọc đi ra ngoài cho tầng gọi rơi về đường tất định', async () => {
    // Mất mạng trước khi nhận được byte nào: không có gì để chuyển tiếp, tầng gọi phải biết.
    const broken = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('mất mạng'))
      },
    })

    await expect(inspectStreamHead(broken)).rejects.toThrow('mất mạng')
  })

  it('không treo khi stream kết thúc mà chỉ có `start`', async () => {
    const result = await inspectStreamHead(streamOf([start()]))

    expect(result.failedEarly).toBe(false)
  })
})
