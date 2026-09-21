import { REFERRAL_SENTENCE, type SafetyAssessment } from '@nutriboost/nutrition'

/**
 * Guardrail an toàn.
 *
 * Hai tầng, cố tình độc lập với model:
 *   1. **Tầng tất định** — chặn trước khi gọi model những câu hỏi thuộc phạm vi y khoa
 *      (liều thuốc, chẩn đoán, điều trị). Không phụ thuộc vào việc model có "nghe lời" hay không.
 *   2. **Tầng chỉ dẫn** — nhét kết quả đánh giá an toàn vào system prompt dưới dạng
 *      dữ kiện không thể thương lượng.
 */

export const MEDICAL_DISCLAIMER = 'Bơ có thể sai. Không thay thế tư vấn y khoa.'

/**
 * Từ khoá thuộc phạm vi y khoa.
 *
 * Danh sách này cố tình hẹp: chỉ gồm hành vi y khoa rõ ràng (kê đơn, liều lượng,
 * chẩn đoán, điều trị). Các từ thông dụng như "bệnh" hay "sức khoẻ" KHÔNG nằm ở đây,
 * vì chặn quá rộng sẽ phá trải nghiệm bình thường.
 */
const MEDICAL_SCOPE_TERMS: readonly string[] = [
  'insulin',
  'lieu thuoc',
  'lieu tieu',
  'uong thuoc',
  'tiem thuoc',
  'ke don',
  'toa thuoc',
  'don thuoc',
  'khang sinh',
  'chan doan',
  'xet nghiem',
  'dieu tri',
  'chua benh',
  'chua khoi',
  'phac do',
  'hoa tri',
  'xac dinh benh',
  'co bi benh gi',
  'toi bi benh gi',
]

/** Câu chuyển hướng trả về khi câu hỏi nằm ngoài phạm vi. */
export const MEDICAL_REDIRECT_MESSAGE =
  'Mình là trợ lý dinh dưỡng, không thể tư vấn chẩn đoán hay thuốc men. ' +
  'Việc này cần bác sĩ trực tiếp thăm khám. ' +
  'Mình có thể giúp bạn phần ăn uống: gợi ý thực đơn, tính khẩu phần, hoặc ghi lại bữa ăn.'

/**
 * Có nằm ngoài phạm vi dinh dưỡng không.
 *
 * Chạy trên văn bản đã bỏ dấu để bắt được cả cách gõ không dấu.
 */
export function isOutOfScopeMedicalQuestion(text: string): boolean {
  const normalized = stripForMatching(text)
  return MEDICAL_SCOPE_TERMS.some((term) => normalized.includes(term))
}

export interface GuardrailInstructions {
  /** Đoạn văn bản chèn vào system prompt. */
  systemFragment: string
  /** Mức độ an toàn đã đánh giá, để tầng gọi quyết định có gọi model hay không. */
  level: SafetyAssessment['level']
  /** Khi true, tầng gọi nên trả thẳng thông báo chuyển hướng, không gọi model. */
  mustRefer: boolean
}

/**
 * Dựng chỉ dẫn an toàn để nhét vào system prompt.
 *
 * Khi mức là `refer`, yêu cầu model hạ giọng: chỉ cung cấp thông tin chung, không
 * đưa khuyến nghị cá nhân hoá, và luôn kết thúc bằng câu chuyển hướng chuyên gia.
 */
export function buildGuardrailInstructions(safety: SafetyAssessment): GuardrailInstructions {
  const lines: string[] = [
    'QUY TẮC AN TOÀN (không được vi phạm):',
    '- Không chẩn đoán bệnh, không kê đơn, không nói tới liều lượng thuốc.',
    '- Không khẳng định bất kỳ thực phẩm nào có tác dụng chữa bệnh.',
    `- Luôn kết thúc câu trả lời bằng câu: "${MEDICAL_DISCLAIMER}"`,
  ]

  if (safety.reasons.length > 0) {
    lines.push('- Hồ sơ người dùng có các điểm cần lưu ý sau:')
    for (const reason of safety.reasons) {
      lines.push(`  • ${reason}`)
    }
  }

  if (safety.level === 'refer') {
    lines.push(
      '- Mức an toàn là CHUYỂN HƯỚNG: chỉ cung cấp thông tin dinh dưỡng chung, không đưa',
      '  khuyến nghị cá nhân hoá, và luôn nhắc người dùng trao đổi với bác sĩ hoặc chuyên gia.',
      `- Câu chuyển hướng bắt buộc: "${REFERRAL_SENTENCE}"`,
    )
  } else if (safety.level === 'caution') {
    lines.push(
      '- Mức an toàn là THẬN TRỌNG: được đưa khuyến nghị nhưng phải dùng ngôn ngữ dè dặt',
      '  ("có thể cân nhắc", "bạn thử xem") thay vì khẳng định.',
    )
  }

  if (safety.blockWeightLoss) {
    lines.push('- KHÔNG đề xuất giảm cân cho hồ sơ này trong bất kỳ trường hợp nào.')
  }

  return {
    systemFragment: lines.join('\n'),
    level: safety.level,
    mustRefer: safety.level === 'refer',
  }
}

/**
 * Bỏ dấu và chuẩn hoá để so khớp từ khoá.
 *
 * Cố tình không import `normalizeVi` của `@nutriboost/nutrition`: hàm đó mở rộng
 * teencode, còn ở đây chỉ cần dạng thô để dò từ khoá y khoa.
 */
function stripForMatching(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
