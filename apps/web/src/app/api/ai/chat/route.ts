import { NextResponse } from 'next/server'

import {
  ASSISTANT,
  MEDICAL_REDIRECT_MESSAGE,
  MOCK_FALLBACK_TEXT,
  buildChatStreamResponse,
  buildGuardrailInstructions,
  buildMockChatStreamResponse,
  createAssistantTools,
  isOutOfScopeMedicalQuestion,
  readAiEnv,
} from '@nutriboost/ai'
import { assessSafety } from '@nutriboost/nutrition'

import { checkChatAllowance, recordChatCall } from '@/lib/ai/chat-usage'
import { createMealLogger, createProgressReader } from '@/lib/ai/health-tools'
import { MEAL_CATALOGUE, estimateMeal, mealEstimator } from '@/lib/ai/meal-estimator'
import { createSupabaseAiStore } from '@/lib/ai/store'
import { getTodayView } from '@/lib/data/today'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

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
  /** Chỉ có ở phần `file`: ảnh người dùng gửi kèm. `mediaType` có thể là `image/jpeg` hoặc `image`. */
  mediaType?: string
  url?: string
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

/**
 * Tin nhắn người dùng có kèm ảnh không.
 *
 * Ảnh nằm ở phần `file` của tin nhắn — AI SDK đổi `files` của `sendMessage` thành phần đó.
 * `mediaType` có thể là `image/jpeg` hoặc chỉ `image`, nên phải so theo tiền tố chứ không so
 * bằng.
 */
function hasImagePart(messages: readonly IncomingMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      (message.parts ?? []).some(
        (part) => part.type === 'file' && (part.mediaType ?? '').startsWith('image'),
      ),
  )
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
  const hasImage = hasImagePart(messages)

  // Ảnh gửi kèm cũng là nội dung: chụp xong gửi luôn, người dùng không phải gõ gì.
  if (userText.length === 0 && !hasImage) {
    return NextResponse.json({ error: 'Thiếu nội dung tin nhắn.' }, { status: 400 })
  }

  const screen = screenFromReferer(request.headers.get('referer'))
  const view = await getTodayView()

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

  /*
   * Ảnh chỉ đọc được bằng model đa phương thức. Chưa cấu hình khoá AI thì phải NÓI THẲNG.
   *
   * Nếu để rơi xuống nhánh ước lượng bằng chữ, câu trả lời sẽ nói về câu mô tả kèm theo chứ
   * không nhắc gì tới tấm ảnh — người dùng hiểu sai rằng ảnh đã được đọc, rồi thắc mắc vì sao
   * Bơ "nhìn" sai món. Đây đúng loại lỗi `CLAUDE.md` cảnh báo: công cụ không làm được việc thì
   * phải nói thật, không được để model tự bịa lý do.
   */
  if (hasImage && (env.apiKey === null || env.killSwitch)) {
    return buildMockChatStreamResponse({
      text:
        'Mình chưa đọc được ảnh, vì phần đọc ảnh cần khoá AI mà bản này chưa cấu hình. ' +
        'Bạn kể bằng một câu cũng được: “trưa nay mình ăn cơm tấm sườn”.',
      suggestions: ['Hôm nay mình còn bao nhiêu calo?', 'Gợi ý bữa tối nhẹ'],
    })
  }

  /*
   * Danh tính người dùng và kho lưu trữ chi phí.
   *
   * Trước đây chỗ này truyền cứng `userId: null` và không có `onFinish`, nên mọi lượt chat
   * đều không được ghi vào `ai_calls`: bảng chi phí rỗng, và trần lượt AI trong
   * docs/PRICING.md không được cưỡng chế ở đâu cả.
   *
   * Khi chưa cấu hình Supabase, `store` là `null` và `checkChatAllowance` cho qua — chế độ
   * dữ liệu mẫu không có khoá DeepSeek nên cũng không có gì để tiêu.
   */
  const user = await getSessionUser()
  const store = createSupabaseAiStore()
  const sessionClient = await createSupabaseServerClient()

  /*
   * Hai công cụ chạm dữ liệu chỉ tồn tại khi biết người dùng là ai. Thiếu chúng thì `log_meal`
   * trả về `toolRefusal` báo thẳng là chưa ghi được, thay vì giả vờ thành công — hành vi đã
   * kiểm chứng trước đây, khi Bơ nói "đã ghi nhận" mà thực tế không có gì được lưu.
   *
   * Dùng client theo phiên người dùng, không phải khoá service role: bữa ăn phải đi qua RLS
   * như mọi đường ghi khác của người dùng.
   */
  const healthTools =
    user === null || sessionClient === null
      ? {}
      : {
          logMeal: createMealLogger({
            supabase: sessionClient,
            userId: user.id,
            localDate: view.localDate,
            consumedKcalBefore: view.consumed.kcal,
            kcalBurned: view.kcalBurned,
            targetKcal: view.targets.targetKcal,
          }),
          readProgress: createProgressReader({ supabase: sessionClient, userId: user.id }),
        }

  if (env.apiKey !== null && !env.killSwitch) {
    const allowance = await checkChatAllowance({
      store,
      userId: user?.id ?? null,
      dailyChatLimit: env.limits.chat,
      dailyBudgetUsd: env.dailyBudgetUsd,
    })

    if (!allowance.allowed) {
      // Không kèm thẻ giao diện nào: thẻ xác nhận bữa ăn ngay cạnh câu "đã hết lượt" sẽ gợi ý
      // rằng bữa ăn đã được xử lý, trong khi thực tế chưa có gì được ghi.
      return buildMockChatStreamResponse({
        text: allowance.message ?? MOCK_FALLBACK_TEXT,
        suggestions: ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?'],
      })
    }

    const startedAt = Date.now()

    try {
      // Bộ công cụ tra cùng danh mục và cùng mục tiêu với màn hình, nên con số trong
      // chat luôn khớp con số trên giao diện.
      const tools = createAssistantTools({
        catalogue: MEAL_CATALOGUE,
        estimator: mealEstimator,
        targets: view.targets,
        safety,
        today: view.localDate,
        ...healthTools,
      })

      return await buildChatStreamResponse({
        messages: messages as never,
        userId: user?.id ?? null,
        screen,
        facts,
        guardrails,
        tools,
        signal: request.signal,
        onFinish: async (info) => {
          await recordChatCall({
            store,
            userId: user?.id ?? null,
            info,
            latencyMs: Date.now() - startedAt,
          })
        },
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
