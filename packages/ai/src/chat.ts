import { createDeepSeek } from '@ai-sdk/deepseek'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
  type UIMessageChunk,
} from 'ai'

import { type AiEnv, readAiEnv } from './env'
import type { GuardrailInstructions } from './guardrails'
import { ASSISTANT } from './identity'
import { DEFAULT_MAX_OUTPUT_TOKENS, DEFAULT_TEMPERATURE } from './gateway'
import { buildChatSystemPrompt } from './prompts'
import { TOOL_TO_COMPONENT, isToolRefusal, type AssistantToolName } from './tools'

/**
 * Dựng phản hồi chat dạng stream theo giao thức UI message của AI SDK.
 *
 * Vì sao nằm trong `packages/ai`: đây là nơi DUY NHẤT được import SDK AI.
 * Tầng ứng dụng chỉ gọi hàm ở đây và trả `Response` thẳng cho trình duyệt.
 *
 * Có hai đường:
 *   • `buildChatStreamResponse`      — gọi DeepSeek thật, cần khoá.
 *   • `buildMockChatStreamResponse`  — dựng stream giả cùng giao thức.
 *
 * Đường thứ hai tồn tại có chủ ý: cả đội phải dựng và kiểm thử được toàn bộ giao diện
 * trợ lý mà không cần khoá. Hai đường cho ra cùng một giao thức, nên đổi từ giả sang
 * thật không đổi một dòng nào ở phía giao diện.
 */

/** Một phần dữ liệu kèm theo để dựng giao diện (generative UI). */
export interface DataPart {
  /** Tên không có tiền tố `data-`, ví dụ `meal_confirm_card`. */
  name: string
  data: unknown
}

export interface ChatStreamOptions {
  messages: UIMessage[]
  userId: string | null
  screen: string | null
  facts: readonly string[]
  guardrails: GuardrailInstructions
  rollingSummary?: string | null
  /** Bộ công cụ của trợ lý. Có tool thì model mới tra cứu và ghi dữ liệu được. */
  tools?: ToolSet
  /** Số vòng model được gọi tool rồi trả lời. Mặc định 4. */
  maxSteps?: number
  /** Ghi nhật ký sau khi stream xong. Lỗi ở đây không được làm hỏng stream. */
  onFinish?: (info: {
    text: string
    inputTokens: number
    outputTokens: number
    cachedTokens: number
    model: string
  }) => Promise<void>
  /**
   * Báo cho tầng gọi biết model đã hỏng, kèm **lý do thật**.
   *
   * Vì sao cần lối riêng: khi DeepSeek từ chối (khoá sai, hết hạn, tài khoản chưa nạp tiền),
   * AI SDK biến lỗi thành một phần `error` trong stream với nội dung chung chung
   * ("An error occurred.") — chi tiết bị lược trước khi tới trình duyệt. Không có lối này thì
   * tầng gọi chỉ biết "model không trả lời" mà không biết vì sao, và lỗi hỏng hoàn toàn im lặng.
   */
  onError?: (info: { message: string; model: string }) => void
  env?: AiEnv
  signal?: AbortSignal
}

export interface MockStreamOptions {
  /** Câu trả lời dạng văn bản. */
  text: string
  /** Các phần dữ liệu kèm theo, ví dụ thẻ xác nhận bữa ăn. */
  dataParts?: readonly DataPart[]
  /** Gợi ý nối tiếp, phát qua part `data-suggestions`. */
  suggestions?: readonly string[]
  /** Chia nhỏ văn bản để mô phỏng cảm giác gõ chữ. */
  chunkSize?: number
}

/**
 * Rút ra câu thông báo dễ đọc từ lỗi của SDK.
 *
 * DeepSeek trả lời bằng JSON có trường `message` rất cụ thể ("Authentication Fails, Your api
 * key: ****-day is invalid"), và SDK gói nó vào `Error.message`. Đó chính là thứ cần cho log.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300)

  try {
    return JSON.stringify(error).slice(0, 300)
  } catch {
    return String(error).slice(0, 300)
  }
}

/** Cổng AI thật: stream văn bản từ DeepSeek. */
export async function buildChatStreamResponse(options: ChatStreamOptions): Promise<Response> {
  const env = options.env ?? readAiEnv()
  const apiKey = env.apiKey
  if (apiKey === null) {
    throw new Error(
      'buildChatStreamResponse cần DEEPSEEK_API_KEY — dùng buildMockChatStreamResponse khi chưa có khoá.',
    )
  }

  const provider = createDeepSeek(
    env.baseURL === null ? { apiKey } : { apiKey, baseURL: env.baseURL },
  )
  const prompt = buildChatSystemPrompt({
    facts: options.facts,
    guardrails: options.guardrails,
    screen: options.screen,
    rollingSummary: options.rollingSummary ?? null,
  })

  // `convertToModelMessages` là hàm bất đồng bộ ở AI SDK v7.
  const modelMessages = await convertToModelMessages(options.messages)

  const result = streamText({
    model: provider(env.models.fast),
    system: `${prompt.system}\n\n${prompt.user}`,
    messages: modelMessages,
    maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    // Có tool thì cho model gọi tool rồi trả lời, tối đa vài vòng. Nhờ vậy mọi con số
    // trong câu trả lời đều đến từ công cụ, không phải từ trí nhớ của model.
    ...(options.tools === undefined
      ? {}
      : { tools: options.tools, stopWhen: stepCountIs(options.maxSteps ?? 4) }),
    ...(options.signal === undefined ? {} : { abortSignal: options.signal }),
    onError: ({ error }) => {
      options.onError?.({ message: describeError(error), model: env.models.fast })
    },
    onFinish: async ({ text, usage }) => {
      if (options.onFinish === undefined) return
      try {
        await options.onFinish({
          text,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          cachedTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
          model: env.models.fast,
        })
      } catch {
        // Nhật ký chi phí không được phép làm hỏng trải nghiệm người dùng.
      }
    },
  })

  /*
   * Chuyển đầu ra công cụ thành phần `data-*` trước khi trả về trình duyệt.
   *
   * Vì sao bắt buộc: model phát ra phần `tool-*`, còn giao diện CHỈ vẽ từ `data-*`
   * (`GenerativePart` trong `AssistantDock`). Thiếu cầu này thì công cụ vẫn chạy và
   * vẫn tính đúng, nhưng người dùng không thấy thẻ nào — hỏng im lặng, không có lỗi
   * nào trong log để lần theo.
   */
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.merge(bridgeToolOutputsToDataParts(result.toUIMessageStream()))
    },
  })

  return createUIMessageStreamResponse({ stream })
}

/**
 * Biến mỗi đầu ra công cụ thành một phần giao diện `data-*`.
 *
 * Phần `tool-*` gốc vẫn được giữ nguyên: nó mang tham số model đã truyền, hữu ích khi
 * cần soi lại, và giao diện vốn bỏ qua nó.
 *
 * Chunk `tool-output-available` KHÔNG kèm tên công cụ, chỉ có `toolCallId` — nên phải
 * nhớ tên từ `tool-input-start`. Đây là chi tiết dễ làm sai nhất trong tệp này.
 *
 * Xuất ra để kiểm thử được trực tiếp, không cần gọi mạng.
 */
export function bridgeToolOutputsToDataParts(
  source: ReadableStream<UIMessageChunk>,
): ReadableStream<UIMessageChunk> {
  const toolByCallId = new Map<string, AssistantToolName>()

  return source.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        controller.enqueue(chunk)

        if (chunk.type === 'tool-input-start') {
          if (chunk.toolName in TOOL_TO_COMPONENT) {
            toolByCallId.set(chunk.toolCallId, chunk.toolName as AssistantToolName)
          }
          return
        }

        if (chunk.type !== 'tool-output-available') return

        const toolName = toolByCallId.get(chunk.toolCallId)
        if (toolName === undefined) return

        // Công cụ từ chối thì chỉ trả lời bằng lời, không dựng thẻ nào cả. Model đã đọc
        // được lý do trong `message` và sẽ nói lại cho người dùng.
        if (isToolRefusal(chunk.output)) return

        // Công cụ đã kiểm payload bằng zod trước khi trả về, nên đầu ra ở đây chính là
        // props của component. Giao diện vẫn kiểm lại lần nữa và có thẻ dự phòng.
        controller.enqueue({
          type: `data-${TOOL_TO_COMPONENT[toolName]}`,
          id: `bo-${chunk.toolCallId}`,
          data: chunk.output,
        } as never)
      },
    }),
  )
}

/**
 * Stream giả, cùng giao thức với stream thật.
 *
 * Dùng khi chưa cấu hình khoá hoặc khi công tắc dừng khẩn cấp đang bật. Nhờ cùng
 * giao thức, giao diện chạy y hệt và test E2E không phụ thuộc dịch vụ ngoài.
 */
export function buildMockChatStreamResponse(options: MockStreamOptions): Response {
  const chunkSize = options.chunkSize ?? 3

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const textId = 'bo-mock-text'
      writer.write({ type: 'start' })
      writer.write({ type: 'start-step' })
      writer.write({ type: 'text-start', id: textId })

      for (let index = 0; index < options.text.length; index += chunkSize) {
        writer.write({
          type: 'text-delta',
          id: textId,
          delta: options.text.slice(index, index + chunkSize),
        })
      }

      writer.write({ type: 'text-end', id: textId })

      for (const part of options.dataParts ?? []) {
        writer.write({
          type: `data-${part.name}`,
          id: `bo-mock-${part.name}`,
          data: part.data,
        } as never)
      }

      if (options.suggestions !== undefined && options.suggestions.length > 0) {
        writer.write({
          type: 'data-suggestions',
          id: 'bo-mock-suggestions',
          data: options.suggestions,
        } as never)
      }

      writer.write({ type: 'finish-step' })
      writer.write({ type: 'finish' })
    },
  })

  return createUIMessageStreamResponse({ stream })
}

/** Câu trả lời mặc định của đường giả, để giao diện luôn có nội dung để hiển thị. */
export const MOCK_FALLBACK_TEXT = `Mình là ${ASSISTANT.name}. Hiện chưa cấu hình khoá DeepSeek nên mình chưa trả lời thật được. Bạn vẫn ghi bữa ăn bằng tay được, và mọi con số vẫn được tính đúng. ${ASSISTANT.signature}`
