import { NextResponse } from 'next/server'

import {
  ASSISTANT,
  MEDICAL_REDIRECT_MESSAGE,
  buildChatStreamResponse,
  buildGuardrailInstructions,
  buildMockChatStreamResponse,
  isOutOfScopeMedicalQuestion,
  readAiEnv,
} from '@nutriboost/ai'
import { assessSafety } from '@nutriboost/nutrition'

import { estimateMeal } from '@/lib/ai/meal-estimator'
import { getTodayView } from '@/lib/data/today'

export const dynamic = 'force-dynamic'

/**
 * Cửa chat của trợ lý Bơ.
 *
 * Trách nhiệm của route này chỉ là: kiểm tra đầu vào, gom dữ kiện, chạy guardrail
 * tất định, rồi chọn giữa stream thật và stream giả. Mọi thứ liên quan tới SDK AI
 * nằm trong `@nutriboost/ai`.
 */

interface IncomingPart {
  type: string
  text?: string
}

interface IncomingMessage {
  id?: string
  role?: string
  parts?: IncomingPart[]
}

interface ChatRequestBody {
  messages?: IncomingMessage[]
  screen?: string
}

function lastUserText(messages: readonly IncomingMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== 'user') continue
    const text = (message.parts ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join(' ')
      .trim()
    if (text.length > 0) return text
  }
  return ''
}

/**
 * Suy ra màn hình đang mở từ header `referer`.
 *
 * Làm ở server thay vì luồn qua transport của `useChat`: ít dây nối hơn, và không
 * phải giữ đồng bộ một tham chiếu có thể đổi.
 */
function screenFromReferer(referer: string | null): string | null {
  if (referer === null) return null
  try {
    const path = new URL(referer).pathname.replace(/\/+$/, '')
    return path.length === 0 ? '/' : path
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return NextResponse.json({ error: 'Body không phải JSON hợp lệ.' }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const userText = lastUserText(messages)

  if (userText.length === 0) {
    return NextResponse.json({ error: 'Thiếu nội dung tin nhắn.' }, { status: 400 })
  }

  const screen = screenFromReferer(request.headers.get('referer'))
  const view = getTodayView()

  const safety = assessSafety({
    bmi: view.bmi.bmi,
    age: view.profile.age,
    goal: view.profile.goal,
    medicalFlags: [],
  })
  const guardrails = buildGuardrailInstructions(safety)

  // Guardrail tất định chạy TRƯỚC khi gọi model: câu hỏi thuộc phạm vi y khoa
  // không bao giờ được gửi tới model, bất kể model có "nghe lời" hay không.
  if (isOutOfScopeMedicalQuestion(userText)) {
    return buildMockChatStreamResponse({
      text: MEDICAL_REDIRECT_MESSAGE,
      suggestions: ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?'],
    })
  }

  // Ước lượng bữa ăn bằng pipeline tất định — bước 1 và 2, không cần model.
  const estimate = estimateMeal(userText)
  const matched = estimate.items.filter((item) => item.foodId !== null)

  const facts = [
    `Mục tiêu mỗi ngày: ${view.targets.targetKcal} kcal (đạm ${view.targets.proteinG} g)`,
    `Đã nạp hôm nay: ${view.consumed.kcal} kcal (đạm ${view.consumed.proteinG} g)`,
    `Còn lại: ${view.remainingKcal} kcal`,
    `BMI: ${view.bmi.bmi} (${view.bmi.label})`,
  ]

  const dataParts =
    matched.length > 0
      ? [
          {
            name: 'meal_confirm_card',
            data: {
              title: 'Mình hiểu bữa ăn như sau',
              rawInput: userText,
              items: estimate.items.map((item) => ({
                foodId: null,
                displayName: item.displayName,
                grams: item.grams,
                kcal: item.nutrients.kcal,
                proteinG: item.nutrients.proteinG,
                carbG: item.nutrients.carbG,
                fatG: item.nutrients.fatG,
                confidence: item.confidence,
              })),
              total: {
                kcal: estimate.total.kcal,
                proteinG: estimate.total.proteinG,
                carbG: estimate.total.carbG,
                fatG: estimate.total.fatG,
              },
              needsConfirmation: estimate.needsConfirmation,
            },
          },
        ]
      : []

  const env = readAiEnv()

  if (env.apiKey !== null && !env.killSwitch) {
    try {
      return await buildChatStreamResponse({
        messages: messages as never,
        userId: null,
        screen,
        facts,
        guardrails,
        signal: request.signal,
      })
    } catch {
      // Rơi về đường giả thay vì trả lỗi: ứng dụng phải luôn dùng được.
    }
  }

  const missing = estimate.unmatched
  const text = [
    matched.length > 0
      ? `Mình nhận ra ${matched.length} món, tổng khoảng ${estimate.total.kcal} kcal.`
      : 'Mình chưa nhận ra món nào trong câu này.',
    missing.length > 0
      ? `Còn ${missing.length} phần mình chưa chắc: ${missing.join(', ')}. Bạn chỉnh lại giúp mình nhé.`
      : '',
    `Hôm nay bạn còn ${view.remainingKcal} kcal.`,
    ASSISTANT.signature,
  ]
    .filter((line) => line.length > 0)
    .join(' ')

  return buildMockChatStreamResponse({
    text,
    dataParts,
    suggestions: ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?'],
  })
}
