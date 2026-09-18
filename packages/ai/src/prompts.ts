import type { ActivityLevel, Goal, MedicalFlag, Sex } from '@nutriboost/nutrition'

import type { GuardrailInstructions } from './guardrails'
import { ASSISTANT } from './identity'

/**
 * Prompt — có phiên bản, một nguồn duy nhất.
 *
 * Quy tắc:
 *   • Mỗi prompt có một hằng `..._VERSION`. Đổi nội dung thì TĂNG phiên bản.
 *     Phiên bản được ghi vào `ai_calls.prompt_version`, nhờ đó đối chiếu được
 *     chất lượng và chi phí theo từng phiên bản.
 *   • Prompt nhận dữ kiện đã tính sẵn. Model KHÔNG bao giờ được yêu cầu tự tính
 *     calo, BMR hay TDEE — đó là việc của `@nutriboost/nutrition`.
 *   • Mọi prompt đều yêu cầu tiếng Việt có dấu đầy đủ.
 */

export const PARSE_MEAL_VERSION = 'parse-meal@v1'
export const GENERATE_PLAN_VERSION = 'generate-plan@v1'
export const INSIGHT_VERSION = 'insight@v1'
export const THREAD_TITLE_VERSION = 'thread-title@v1'
export const CHAT_SYSTEM_VERSION = 'chat-system@v1'

export interface PromptBundle {
  version: string
  system: string
  user: string
}

/* ---------------------------------------------------------------------------
 * Chung
 * ------------------------------------------------------------------------- */

const BASE_SYSTEM = [
  `Bạn là ${ASSISTANT.name}, trợ lý dinh dưỡng cho người Việt.`,
  `Giọng điệu: ${ASSISTANT.voice}.`,
  'Luôn trả lời bằng tiếng Việt có dấu đầy đủ.',
  'Tuyệt đối không tự tính calo, BMR hay TDEE. Mọi con số dinh dưỡng do hệ thống cung cấp.',
  'Không chẩn đoán bệnh, không kê đơn, không nhắc tới liều lượng thuốc.',
  'Không khẳng định thực phẩm nào có tác dụng chữa bệnh.',
].join('\n')

/* ---------------------------------------------------------------------------
 * Hiểu bữa ăn
 * ------------------------------------------------------------------------- */

export interface FoodCandidateForPrompt {
  foodId: string
  nameVi: string
  kind: 'ingredient' | 'dish'
  servingName: string | null
  servingGrams: number | null
  kcalPer100g: number
}

export interface ParseMealPromptInput {
  text: string
  candidates: readonly FoodCandidateForPrompt[]
  mealTypeHint: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  nowLabel: string
}

/**
 * Prompt hiểu bữa ăn — bước 2 của pipeline (bước 1 là tìm trigram trong CSDL).
 *
 * Điểm mấu chốt: model chỉ được CHỌN trong danh sách ứng viên, không được sinh id mới.
 * Nhờ vậy calo luôn suy ra từ dữ liệu thật, không phải từ trí nhớ của model.
 */
export function buildParseMealPrompt(input: ParseMealPromptInput): PromptBundle {
  const candidateLines = input.candidates.map((candidate) => {
    const serving =
      candidate.servingName === null || candidate.servingGrams === null
        ? ''
        : ` · 1 ${candidate.servingName} ≈ ${candidate.servingGrams} g`
    return `- ${candidate.foodId} | ${candidate.nameVi} (${candidate.kind})${serving} | ${candidate.kcalPer100g} kcal/100g`
  })

  const system = [
    BASE_SYSTEM,
    '',
    'Nhiệm vụ: đọc câu người dùng kể về bữa ăn và chọn đúng món trong DANH SÁCH ỨNG VIÊN.',
    '',
    'QUY TẮC BẮT BUỘC:',
    '1. `foodId` chỉ được là một trong các id có trong danh sách ứng viên. KHÔNG được bịa id.',
    '2. Nếu không món nào trong danh sách khớp, đặt `foodId = null` và ghi tên vào `unmatched`.',
    '3. Ước lượng `grams` theo khẩu phần Việt Nam thông thường. Ví dụ: một tô phở ≈ 500 g,',
    '   một bát cơm ≈ 200 g, một ly cà phê sữa đá ≈ 200 g, một quả trứng ≈ 50 g.',
    '4. Nếu người dùng nói rõ số lượng ("hai bát", "nửa tô"), nhân tương ứng và đặt',
    '   `quantityBasis = "explicit"`. Nếu dùng khẩu phần chuẩn, đặt `quantityBasis = "serving"`.',
    '   Nếu phải suy đoán, đặt `quantityBasis = "inferred"`.',
    '5. `confidence` phản ánh mức chắc chắn thật. Câu mơ hồ như "ăn chút gì đó" phải dưới 0,5.',
    '6. Chỉ đặt `needsClarification = true` khi thiếu thông tin tới mức không thể ước lượng,',
    '   và khi đó viết đúng MỘT câu hỏi ngắn vào `clarifyingQuestion`.',
    '7. `mealType` suy ra từ ngữ cảnh và giờ nếu đoán được, ngược lại để null.',
  ].join('\n')

  const candidateBlock =
    input.candidates.length === 0
      ? '(danh sách ứng viên rỗng — mọi món đều phải vào `unmatched`)'
      : candidateLines.join('\n')

  const user = [
    `Thời điểm hiện tại: ${input.nowLabel}`,
    input.mealTypeHint === null ? '' : `Bữa dự kiến: ${input.mealTypeHint}`,
    '',
    'DANH SÁCH ỨNG VIÊN:',
    candidateBlock,
    '',
    'CÂU CỦA NGƯỜI DÙNG:',
    input.text,
  ]
    .filter((line) => line !== '')
    .join('\n')

  return { version: PARSE_MEAL_VERSION, system, user }
}

/* ---------------------------------------------------------------------------
 * Kế hoạch tuần
 * ------------------------------------------------------------------------- */

export interface PlanPromptProfile {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  dietaryPrefs: readonly string[]
  allergies: readonly string[]
  medicalFlags: readonly MedicalFlag[]
}

export interface GeneratePlanPromptInput {
  profile: PlanPromptProfile
  /** Mục tiêu đã tính sẵn bởi lõi tất định — model chỉ dùng, không tính lại. */
  targets: {
    bmrKcal: number
    tdeeKcal: number
    targetKcal: number
    proteinG: number
    carbG: number
    fatG: number
  }
  candidates: readonly FoodCandidateForPrompt[]
  weekStartLabel: string
  mealsPerDay: readonly ('breakfast' | 'lunch' | 'dinner' | 'snack')[]
  guardrails: GuardrailInstructions
}

export function buildGeneratePlanPrompt(input: GeneratePlanPromptInput): PromptBundle {
  const { profile, targets, guardrails } = input

  const system = [
    BASE_SYSTEM,
    '',
    guardrails.systemFragment,
    '',
    'Nhiệm vụ: dựng thực đơn 7 ngày cho người dùng Việt Nam.',
    '',
    'QUY TẮC BẮT BUỘC:',
    '1. `foodId` chỉ được là id có trong DANH SÁCH MÓN. Không bịa id.',
    '2. Tổng năng lượng mỗi ngày phải nằm trong khoảng ±7 % so với mục tiêu kcal đã cho.',
    '3. Tổng đạm mỗi ngày không thấp hơn 90 % mục tiêu đạm đã cho.',
    '4. Mỗi ngày có đúng các bữa được liệt kê. Không thêm bữa ngoài danh sách.',
    '5. Không dùng món trùng với dị ứng. Tôn trọng mọi yêu cầu ăn uống đã nêu.',
    '6. Không lặp y nguyên một món cho hai ngày liên tiếp.',
    '7. `grams` phải là khối lượng thực tế cho MỘT khẩu phần của người này.',
    '8. `rationale` tối đa 140 ký tự, nói lý do ngắn gọn, không dùng từ ngữ y khoa.',
  ].join('\n')

  const foodLines = input.candidates.map((candidate) => {
    const serving =
      candidate.servingName === null || candidate.servingGrams === null
        ? ''
        : ` · 1 ${candidate.servingName} ≈ ${candidate.servingGrams} g`
    return `- ${candidate.foodId} | ${candidate.nameVi}${serving} | ${candidate.kcalPer100g} kcal/100g`
  })

  const user = [
    `Tuần bắt đầu: ${input.weekStartLabel}`,
    '',
    'HỒ SƠ:',
    `- Giới tính: ${profile.sex === 'male' ? 'nam' : 'nữ'}, ${profile.age} tuổi`,
    `- Chiều cao ${profile.heightCm} cm, cân nặng ${profile.weightKg} kg`,
    `- Mức vận động: ${profile.activityLevel}`,
    `- Mục tiêu: ${profile.goal}`,
    `- Yêu cầu ăn uống: ${profile.dietaryPrefs.length > 0 ? profile.dietaryPrefs.join(', ') : 'không có'}`,
    `- Dị ứng: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'không có'}`,
    `- Cờ sức khoẻ: ${profile.medicalFlags.length > 0 ? profile.medicalFlags.join(', ') : 'không có'}`,
    '',
    'MỤC TIÊU ĐÃ TÍNH SẴN (dùng nguyên số, không tính lại):',
    `- BMR ${targets.bmrKcal} kcal · TDEE ${targets.tdeeKcal} kcal`,
    `- Mục tiêu mỗi ngày: ${targets.targetKcal} kcal`,
    `- Đa lượng mỗi ngày: đạm ${targets.proteinG} g · tinh bột ${targets.carbG} g · béo ${targets.fatG} g`,
    '',
    `BỮA MỖI NGÀY: ${input.mealsPerDay.join(', ')}`,
    '',
    'DANH SÁCH MÓN ĐƯỢC PHÉP DÙNG:',
    foodLines.join('\n'),
  ].join('\n')

  return { version: GENERATE_PLAN_VERSION, system, user }
}

/* ---------------------------------------------------------------------------
 * Insight hằng ngày
 * ------------------------------------------------------------------------- */

export interface InsightPromptInput {
  consumed: { kcal: number; proteinG: number; carbG: number; fatG: number }
  targets: { kcal: number; proteinG: number; carbG: number; fatG: number }
  streakDays: number
  mealsLogged: number
  guardrails: GuardrailInstructions
}

export function buildInsightPrompt(input: InsightPromptInput): PromptBundle {
  const system = [
    BASE_SYSTEM,
    '',
    input.guardrails.systemFragment,
    '',
    'Nhiệm vụ: viết nhận xét ngắn cho hôm nay.',
    '',
    'QUY TẮC:',
    '1. `headline` tối đa 90 ký tự, nêu ĐÚNG MỘT quan sát quan trọng nhất.',
    '2. `action` tối đa 140 ký tự, là MỘT việc làm được ngay hôm nay, có con số cụ thể.',
    '3. Không dùng từ ngữ y khoa. Không mắng, không gây cảm giác tội lỗi.',
    '4. Nếu các chỉ số đều ổn, hãy ghi nhận điều đó thay vì bịa ra vấn đề.',
    '5. `severity` là "info" bình thường, "warning" khi lệch nhiều, "refer" khi cần chuyên gia.',
  ].join('\n')

  const user = [
    `Đã ghi: ${input.consumed.kcal} kcal · đạm ${input.consumed.proteinG} g · tinh bột ${input.consumed.carbG} g · béo ${input.consumed.fatG} g`,
    `Mục tiêu: ${input.targets.kcal} kcal · đạm ${input.targets.proteinG} g · tinh bột ${input.targets.carbG} g · béo ${input.targets.fatG} g`,
    `Số bữa đã ghi hôm nay: ${input.mealsLogged}`,
    `Chuỗi ngày ghi liên tiếp: ${input.streakDays}`,
  ].join('\n')

  return { version: INSIGHT_VERSION, system, user }
}

/* ---------------------------------------------------------------------------
 * Tiêu đề hội thoại
 * ------------------------------------------------------------------------- */

export function buildThreadTitlePrompt(firstUserMessage: string): PromptBundle {
  const system = [
    `Bạn đặt tiêu đề cho một đoạn hội thoại với trợ lý ${ASSISTANT.name}.`,
    'Tiêu đề bằng tiếng Việt có dấu, tối đa 6 từ, không dấu chấm cuối câu.',
    'Nêu đúng chủ đề chính, không dùng từ chung chung như "Hỏi đáp" hay "Trò chuyện".',
  ].join('\n')

  const user = `Tin nhắn đầu tiên của người dùng:\n${firstUserMessage}`

  return { version: THREAD_TITLE_VERSION, system, user }
}

/* ---------------------------------------------------------------------------
 * Chat
 * ------------------------------------------------------------------------- */

export interface ChatPromptInput {
  /** Dữ kiện đã tính sẵn: mục tiêu, đã nạp, còn lại. Model chỉ đọc, không tính. */
  facts: readonly string[]
  guardrails: GuardrailInstructions
  screen: string | null
  /** Tóm tắt cuộn cho phần hội thoại đã cũ. */
  rollingSummary: string | null
}

export function buildChatSystemPrompt(input: ChatPromptInput): PromptBundle {
  const system = [
    BASE_SYSTEM,
    '',
    input.guardrails.systemFragment,
    '',
    'Bạn có các công cụ để tra cứu món ăn, tính mục tiêu năng lượng, ghi nhật ký và xem tiến độ.',
    'QUY TẮC VỀ SỐ LIỆU:',
    '- Mọi con số calo, đạm, BMR, TDEE phải lấy từ kết quả công cụ. Không được tự tính hay ước lượng.',
    '- Khi người dùng kể về bữa ăn, hãy gọi công cụ để tra món, rồi dựng thẻ xác nhận cho họ duyệt.',
    '- Không ghi nhật ký khi người dùng chưa xác nhận.',
    '',
    'QUY TẮC TRÌNH BÀY:',
    '- Trả lời ngắn: tối đa 3 câu, trừ khi người dùng hỏi để giải thích.',
    '- Dùng giao diện dựng sẵn khi phù hợp thay vì mô tả bằng lời.',
    `- Luôn kết thúc bằng câu: "${ASSISTANT.signature}"`,
  ].join('\n')

  const contextLines: string[] = []
  if (input.screen !== null) {
    contextLines.push(`Người dùng đang ở màn hình: ${input.screen}`)
  }
  if (input.facts.length > 0) {
    contextLines.push('SỐ LIỆU HIỆN TẠI CỦA NGƯỜI DÙNG:')
    for (const fact of input.facts) contextLines.push(`- ${fact}`)
  }
  if (input.rollingSummary !== null) {
    contextLines.push('', `TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ: ${input.rollingSummary}`)
  }

  return {
    version: CHAT_SYSTEM_VERSION,
    system,
    user: contextLines.join('\n'),
  }
}
