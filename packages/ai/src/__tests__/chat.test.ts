import { describe, expect, it } from 'vitest'
import type { UIMessageChunk } from 'ai'

import { bridgeToolOutputsToDataParts } from '../chat'
import { GENERATIVE_COMPONENTS } from '../schemas'
import { ASSISTANT_TOOL_NAMES, TOOL_TO_COMPONENT, type AssistantToolName } from '../tools'

/**
 * Cầu nối giữa đầu ra công cụ và giao diện sinh sẵn.
 *
 * Vì sao có tệp này: model phát ra phần `tool-*` còn giao diện chỉ vẽ từ `data-*`.
 * Khi cầu nối thiếu, công cụ vẫn chạy và vẫn tính đúng nhưng người dùng không thấy
 * thẻ nào — hỏng hoàn toàn im lặng, không lỗi, không log. Đã xảy ra thật một lần.
 * Bộ test dưới đây khoá đúng chỗ đó lại.
 */

/** Chạy danh sách chunk qua cầu nối rồi gom kết quả. */
async function runBridge(chunks: readonly UIMessageChunk[]): Promise<UIMessageChunk[]> {
  const source = new ReadableStream<UIMessageChunk>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })

  const output: UIMessageChunk[] = []
  const reader = bridgeToolOutputsToDataParts(source).getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    output.push(value)
  }
  return output
}

/** Các phần `data-*` trong kết quả, kèm id và dữ liệu thô. */
function dataParts(
  chunks: readonly UIMessageChunk[],
): { type: string; id?: string; data: unknown }[] {
  return chunks
    .filter((chunk) => chunk.type.startsWith('data-'))
    .map((chunk) => chunk as { type: string; id?: string; data: unknown })
}

/** Cặp chunk mà SDK thật phát ra cho một lần gọi công cụ. */
function toolCallChunks(
  toolName: AssistantToolName,
  output: unknown,
  toolCallId = 'call_1',
): UIMessageChunk[] {
  return [
    { type: 'start' },
    { type: 'tool-input-start', toolCallId, toolName },
    {
      type: 'tool-input-available',
      toolCallId,
      toolName,
      input: {},
    },
    { type: 'tool-output-available', toolCallId, output },
    { type: 'finish' },
  ] as UIMessageChunk[]
}

describe('bridgeToolOutputsToDataParts', () => {
  it('biến đầu ra công cụ thành phần data-* cùng tên component', async () => {
    const output = await runBridge(
      toolCallChunks('estimate_meal', { title: 'Mình hiểu bữa ăn như sau' }),
    )

    expect(dataParts(output)).toEqual([
      {
        type: 'data-meal_confirm_card',
        id: 'bo-call_1',
        data: { title: 'Mình hiểu bữa ăn như sau' },
      },
    ])
  })

  it('giữ nguyên các phần tool-* gốc để còn soi lại được', async () => {
    const chunks = toolCallChunks('search_food', { candidates: [] })
    const output = await runBridge(chunks)

    // Phần giao diện được chèn NGAY SAU đầu ra công cụ, nên bỏ nó đi là phải còn
    // nguyên chuỗi gốc, đúng thứ tự.
    const withoutData = output.filter((chunk) => !chunk.type.startsWith('data-'))
    expect(withoutData).toEqual(chunks)

    // Và nó nằm ngay sau đầu ra công cụ, trước `finish`.
    expect(output.map((chunk) => chunk.type)).toEqual([
      'start',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
      'data-food_candidate_chips',
      'finish',
    ])
  })

  it('nối đúng mọi công cụ trong sổ đăng ký', async () => {
    for (const toolName of ASSISTANT_TOOL_NAMES) {
      const output = await runBridge(toolCallChunks(toolName, { marker: toolName }))
      const parts = dataParts(output)

      expect(parts, `công cụ ${toolName} không sinh ra phần giao diện nào`).toHaveLength(1)
      expect(parts[0]?.type).toBe(`data-${TOOL_TO_COMPONENT[toolName]}`)
      expect(parts[0]?.id).toBe('bo-call_1')
      expect(parts[0]?.data).toEqual({ marker: toolName })
    }
  })

  it('mọi component mà công cụ nhắm tới đều có schema', () => {
    // Nếu một công cụ trỏ tới component không tồn tại, giao diện sẽ rơi về thẻ dự phòng
    // và người dùng thấy "thành phần lạ" — lỗi cấu hình, phải bắt ở đây.
    for (const component of Object.values(TOOL_TO_COMPONENT)) {
      expect(GENERATIVE_COMPONENTS).toHaveProperty(component)
    }
  })

  it('bỏ qua công cụ lạ, không dựng giao diện tuỳ tiện', async () => {
    const output = await runBridge([
      { type: 'tool-input-start', toolCallId: 'call_9', toolName: 'len_lich_hop' },
      { type: 'tool-output-available', toolCallId: 'call_9', output: { evil: true } },
    ] as UIMessageChunk[])

    expect(dataParts(output)).toEqual([])
  })

  it('bỏ qua đầu ra công cụ không rõ nguồn gốc', async () => {
    // Không có `tool-input-start` đi trước thì không biết đây là công cụ nào.
    const output = await runBridge([
      { type: 'tool-output-available', toolCallId: 'call_mo_coi', output: { a: 1 } },
    ] as UIMessageChunk[])

    expect(dataParts(output)).toEqual([])
  })

  it('ghép đúng tên công cụ khi nhiều công cụ chạy trong cùng một lượt', async () => {
    const output = await runBridge([
      { type: 'tool-input-start', toolCallId: 'call_a', toolName: 'search_food' },
      { type: 'tool-input-start', toolCallId: 'call_b', toolName: 'estimate_meal' },
      { type: 'tool-output-available', toolCallId: 'call_b', output: { from: 'b' } },
      { type: 'tool-output-available', toolCallId: 'call_a', output: { from: 'a' } },
    ] as UIMessageChunk[])

    expect(dataParts(output)).toEqual([
      { type: 'data-meal_confirm_card', id: 'bo-call_b', data: { from: 'b' } },
      { type: 'data-food_candidate_chips', id: 'bo-call_a', data: { from: 'a' } },
    ])
  })

  it('không dựng thẻ khi công cụ từ chối', async () => {
    /*
     * Từ chối phải chỉ hiện ra bằng lời. Nếu dựng thẻ, giao diện sẽ nhận một payload
     * không khớp schema và hiện "thành phần lạ" — người dùng thấy một cái thẻ vô nghĩa
     * ngay lúc hệ thống vừa thú nhận là không làm được gì.
     */
    const output = await runBridge(
      toolCallChunks('log_meal', {
        refused: true,
        message: 'CHƯA ghi được: bản này chưa nối cơ sở dữ liệu.',
      }),
    )

    expect(dataParts(output)).toEqual([])

    // Nhưng model vẫn phải đọc được lý do, nếu không nó sẽ tự bịa.
    const toolResult = output.find((chunk) => chunk.type === 'tool-output-available')
    expect(toolResult).toMatchObject({ output: { refused: true } })
  })

  it('đánh dấu sai tên công cụ thì không lọt ra ngoài', async () => {
    // `tool-input-start` không khai báo công cụ nào đã biết.
    const output = await runBridge([
      { type: 'tool-input-start', toolCallId: 'call_x' },
      { type: 'tool-output-available', toolCallId: 'call_x', output: { a: 1 } },
    ] as UIMessageChunk[])

    expect(dataParts(output)).toEqual([])
  })
})
