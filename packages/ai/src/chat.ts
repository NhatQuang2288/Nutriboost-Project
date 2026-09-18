import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai'

import { type AiEnv, readAiEnv } from './env'
import type { GuardrailInstructions } from './guardrails'
import { ASSISTANT } from './identity'
import { DEFAULT_MAX_OUTPUT_TOKENS, DEFAULT_TEMPERATURE } from './gateway'
import { buildChatSystemPrompt } from './prompts'

/**
 * Dựng phản hồi chat dạng stream theo giao thức UI message của AI SDK.
 *
 * Vì sao nằm trong `packages/ai`: đây là nơi DUY NHẤT được import SDK AI.
 * Tầng ứng dụng chỉ gọi hàm ở đây và trả `Response` thẳng cho trình duyệt.
 *
 * Có hai đường:
 *   • `buildChatStreamResponse`      — gọi Gemini thật, cần khoá.
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
  /** Ghi nhật ký sau khi stream xong. Lỗi ở đây không được làm hỏng stream. */
  onFinish?: (info: {
    text: string
    inputTokens: number
    outputTokens: number
    cachedTokens: number
    model: string
  }) => Promise<void>
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

/** Cổng AI thật: stream văn bản từ Gemini. */
export async function buildChatStreamResponse(options: ChatStreamOptions): Promise<Response> {
  const env = options.env ?? readAiEnv()
  const apiKey = env.apiKey
  if (apiKey === null) {
    throw new Error(
      'buildChatStreamResponse cần GEMINI_API_KEY — dùng buildMockChatStreamResponse khi chưa có khoá.',
    )
  }

  const provider = createGoogleGenerativeAI({ apiKey })
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
    ...(options.signal === undefined ? {} : { abortSignal: options.signal }),
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

  return result.toUIMessageStreamResponse()
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
export const MOCK_FALLBACK_TEXT = `Mình là ${ASSISTANT.name}. Hiện chưa cấu hình khoá Gemini nên mình chưa trả lời thật được. Bạn vẫn ghi bữa ăn bằng tay được, và mọi con số vẫn được tính đúng. ${ASSISTANT.signature}`
