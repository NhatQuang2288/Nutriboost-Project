import type { MedicalFlag } from './constants'
import type { Goal } from './types'

export type SafetyLevel = 'ok' | 'caution' | 'refer'

export interface SafetyInput {
  bmi: number
  age: number
  goal: Goal
  medicalFlags: readonly MedicalFlag[]
}

export interface SafetyAssessment {
  level: SafetyLevel
  /** Lý do bằng tiếng Việt, hiển thị trực tiếp cho người dùng. */
  reasons: string[]
  /** Khi true, không được phép tạo mục tiêu giảm cân. */
  blockWeightLoss: boolean
}

/**
 * Ngưỡng BMI chuyển hướng chuyên gia: béo phì độ II theo chuẩn châu Á.
 *
 * Định nghĩa tường minh thay vì suy ra từ mảng dải — bản trước lấy `max` của dải
 * cuối cùng, mà dải cuối có `max = Infinity`, khiến điều kiện không bao giờ đúng.
 * Test `safety-thresholds.test.ts` giữ hai hằng số này khớp với `BMI_BANDS`.
 */
const REFER_BMI = 30

/** Ngưỡng BMI cần thận trọng: béo phì độ I theo chuẩn châu Á. */
const CAUTION_BMI = 25

/**
 * Đánh giá an toàn trước khi đưa ra bất kỳ khuyến nghị nào.
 *
 * `refer`  — phải chuyển hướng chuyên gia, trợ lý hạ mức khuyến nghị xuống mức thông tin.
 * `caution`— vẫn đưa khuyến nghị nhưng kèm cảnh báo và ngôn ngữ thận trọng.
 * `ok`     — không có yếu tố cần lưu ý.
 *
 * Quy tắc này là một phần của guardrail: nó phải chạy TRƯỚC khi gọi model,
 * và kết quả được nhét vào prompt dưới dạng dữ kiện không thể thương lượng.
 */
export function assessSafety(input: SafetyInput): SafetyAssessment {
  const reasons: string[] = []
  let level: SafetyLevel = 'ok'
  let blockWeightLoss = false

  const raise = (next: SafetyLevel): void => {
    if (next === 'refer') level = 'refer'
    else if (next === 'caution' && level === 'ok') level = 'caution'
  }

  if (input.age < 18) {
    reasons.push('Người dưới 18 tuổi cần chuyên gia dinh dưỡng nhi khoa.')
    raise('refer')
  }

  if (input.medicalFlags.includes('pregnancy') || input.medicalFlags.includes('breastfeeding')) {
    reasons.push('Phụ nữ mang thai hoặc đang cho con bú cần chế độ riêng do bác sĩ chỉ định.')
    raise('refer')
    blockWeightLoss = true
  }

  if (input.medicalFlags.includes('eating_disorder')) {
    reasons.push(
      'Có tiền sử rối loạn ăn uống cần được đồng hành bởi chuyên gia tâm lý và dinh dưỡng.',
    )
    raise('refer')
    blockWeightLoss = true
  }

  const chronicFlags: readonly MedicalFlag[] = [
    'diabetes',
    'hypertension',
    'heart_disease',
    'kidney_disease',
    'liver_disease',
    'gout',
    'thyroid',
  ]
  const matchedChronic = chronicFlags.filter((flag) => input.medicalFlags.includes(flag))
  if (matchedChronic.length > 0) {
    reasons.push('Có bệnh nền mạn tính — khuyến nghị chỉ mang tính tham khảo, cần bác sĩ xác nhận.')
    raise(matchedChronic.length >= 2 ? 'refer' : 'caution')
  }

  if (input.bmi < 18.5) {
    reasons.push('BMI dưới ngưỡng thiếu cân — không nên giảm cân.')
    raise('caution')
    blockWeightLoss = true
  }

  if (input.bmi >= REFER_BMI) {
    reasons.push('BMI ở mức béo phì độ II — nên được bác sĩ đánh giá trước khi áp dụng chế độ.')
    raise('refer')
  } else if (input.bmi >= CAUTION_BMI) {
    reasons.push('BMI ở mức béo phì độ I — nên theo dõi thêm các chỉ số chuyển hoá.')
    raise('caution')
  }

  if (blockWeightLoss && input.goal === 'lose') {
    reasons.push('Mục tiêu giảm cân đã bị tạm khoá cho hồ sơ này.')
    raise('refer')
  }

  return { level, reasons, blockWeightLoss }
}

/** Câu chuyển hướng bắt buộc gắn vào mọi khuyến nghị khi mức là `refer`. */
export const REFERRAL_SENTENCE =
  'Nội dung này chỉ mang tính tham khảo và không thay thế tư vấn y khoa. Bạn nên trao đổi với bác sĩ hoặc chuyên gia dinh dưỡng trước khi thay đổi chế độ ăn.'
