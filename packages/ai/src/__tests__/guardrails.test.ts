import { describe, expect, it } from 'vitest'

import type { SafetyAssessment } from '@nutriboost/nutrition'

import {
  MEDICAL_DISCLAIMER,
  buildGuardrailInstructions,
  isOutOfScopeMedicalQuestion,
} from '../guardrails'

const OK_SAFETY: SafetyAssessment = { level: 'ok', reasons: [], blockWeightLoss: false }
const CAUTION_SAFETY: SafetyAssessment = {
  level: 'caution',
  reasons: ['Có bệnh nền mạn tính — khuyến nghị chỉ mang tính tham khảo.'],
  blockWeightLoss: false,
}
const REFER_SAFETY: SafetyAssessment = {
  level: 'refer',
  reasons: ['Phụ nữ mang thai cần chế độ riêng do bác sĩ chỉ định.'],
  blockWeightLoss: true,
}

describe('isOutOfScopeMedicalQuestion', () => {
  it('chặn câu hỏi về liều thuốc', () => {
    expect(isOutOfScopeMedicalQuestion('tôi nên uống thuốc liều bao nhiêu')).toBe(true)
    expect(isOutOfScopeMedicalQuestion('Liều thuốc tiểu đường của tôi là bao nhiêu?')).toBe(true)
  })

  it('chặn cả khi người dùng gõ không dấu', () => {
    expect(isOutOfScopeMedicalQuestion('toi nen uong thuoc lieu bao nhieu')).toBe(true)
    expect(isOutOfScopeMedicalQuestion('chan doan benh giup toi')).toBe(true)
  })

  it('chặn yêu cầu chẩn đoán và điều trị', () => {
    expect(isOutOfScopeMedicalQuestion('tôi bị bệnh gì')).toBe(true)
    expect(isOutOfScopeMedicalQuestion('cách điều trị tiểu đường tuýp 2')).toBe(true)
    expect(isOutOfScopeMedicalQuestion('thuốc kháng sinh nào tốt')).toBe(true)
    expect(isOutOfScopeMedicalQuestion('có cần xét nghiệm máu không')).toBe(true)
  })

  it('chặn cụm từ bị pháp luật cấm dùng', () => {
    expect(isOutOfScopeMedicalQuestion('món này chữa bệnh ung thư không')).toBe(true)
  })

  it('KHÔNG chặn câu hỏi dinh dưỡng bình thường', () => {
    const binhThuong = [
      'sáng nay tôi ăn phở bò',
      'hôm nay tôi còn bao nhiêu calo',
      'gợi ý bữa tối ít tinh bột',
      'món này bao nhiêu đạm',
      'tôi muốn giảm cân thì ăn gì',
      'chế độ ăn cho người tập gym',
      'sức khoẻ của tôi thế nào',
    ]
    for (const cau of binhThuong) {
      expect(isOutOfScopeMedicalQuestion(cau), `bị chặn nhầm: "${cau}"`).toBe(false)
    }
  })

  it('không chặn nhầm khi nhắc tới bệnh nền trong ngữ cảnh ăn uống', () => {
    expect(isOutOfScopeMedicalQuestion('tôi có bệnh nền, nên ăn gì')).toBe(false)
  })
})

describe('buildGuardrailInstructions', () => {
  it('luôn có câu chữ ký bắt buộc', () => {
    for (const safety of [OK_SAFETY, CAUTION_SAFETY, REFER_SAFETY]) {
      expect(buildGuardrailInstructions(safety).systemFragment).toContain(MEDICAL_DISCLAIMER)
    }
  })

  it('mức ok thì không thêm ràng buộc chuyển hướng', () => {
    const result = buildGuardrailInstructions(OK_SAFETY)
    expect(result.level).toBe('ok')
    expect(result.mustRefer).toBe(false)
    expect(result.systemFragment).not.toContain('CHUYỂN HƯỚNG')
  })

  it('mức caution yêu cầu ngôn ngữ dè dặt', () => {
    const result = buildGuardrailInstructions(CAUTION_SAFETY)
    expect(result.level).toBe('caution')
    expect(result.mustRefer).toBe(false)
    expect(result.systemFragment).toContain('THẬN TRỌNG')
    expect(result.systemFragment).toContain('Có bệnh nền mạn tính')
  })

  it('mức refer bắt buộc chuyển hướng chuyên gia', () => {
    const result = buildGuardrailInstructions(REFER_SAFETY)
    expect(result.level).toBe('refer')
    expect(result.mustRefer).toBe(true)
    expect(result.systemFragment).toContain('CHUYỂN HƯỚNG')
    expect(result.systemFragment).toContain('không thay thế tư vấn y khoa')
  })

  it('cấm đề xuất giảm cân khi hồ sơ bị khoá', () => {
    const result = buildGuardrailInstructions(REFER_SAFETY)
    expect(result.systemFragment).toContain('KHÔNG đề xuất giảm cân')
  })

  it('luôn cấm kê đơn và chữa bệnh, ở mọi mức', () => {
    for (const safety of [OK_SAFETY, CAUTION_SAFETY, REFER_SAFETY]) {
      const fragment = buildGuardrailInstructions(safety).systemFragment
      expect(fragment).toContain('không kê đơn')
      expect(fragment).toContain('chữa bệnh')
    }
  })
})
