import { describe, expect, it } from 'vitest'

import { bmrMifflinStJeor } from '../bmr'
import { tdeeFromBmr } from '../tdee'
import { computeEnergyTargets } from '../energy'
import { KCAL_PER_KG_FAT } from '../constants'

const NAM_30 = { weightKg: 70, heightCm: 170, age: 30, sex: 'male' } as const
const NU_30 = { weightKg: 70, heightCm: 170, age: 30, sex: 'female' } as const

describe('bmrMifflinStJeor', () => {
  it('khớp test vector của phương trình Mifflin–St Jeor', () => {
    // 10×70 + 6,25×170 − 5×30 + 5 = 1617,5 → 1618
    expect(bmrMifflinStJeor(NAM_30)).toBe(1618)
    // 10×70 + 6,25×170 − 5×30 − 161 = 1451,5 → 1452
    expect(bmrMifflinStJeor(NU_30)).toBe(1452)
  })

  it('từ chối dữ liệu không hợp lệ', () => {
    expect(() => bmrMifflinStJeor({ ...NAM_30, weightKg: -1 })).toThrow(RangeError)
    expect(() => bmrMifflinStJeor({ ...NAM_30, age: 0 })).toThrow(RangeError)
    expect(() => bmrMifflinStJeor({ ...NAM_30, age: 130 })).toThrow(RangeError)
  })
})

describe('tdeeFromBmr', () => {
  it('nhân đúng hệ số vận động', () => {
    // 1618 × 1,55 = 2507,9 → 2508
    expect(tdeeFromBmr(1618, 'moderate')).toBe(2508)
    // 1618 × 1,2 = 1941,6 → 1942
    expect(tdeeFromBmr(1618, 'sedentary')).toBe(1942)
  })

  it('hệ số tăng đơn điệu theo mức vận động', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
    const values = levels.map((level) => tdeeFromBmr(1618, level))
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!)
    }
  })
})

describe('computeEnergyTargets', () => {
  it('giữ nguyên TDEE khi mục tiêu là giữ cân', () => {
    const result = computeEnergyTargets({ ...NAM_30, activityLevel: 'moderate', goal: 'maintain' })
    expect(result.bmrKcal).toBe(1618)
    expect(result.tdeeKcal).toBe(2508)
    expect(result.targetKcal).toBe(2510)
    expect(result.floorsApplied).toEqual([])
    expect(result.formulaVersion).toBe('nutriboost-energy-1.0.0')
  })

  it('giới hạn thâm hụt ở 20 % TDEE và ghi nhận yếu tố biên', () => {
    // 0,5 kg/tuần = 550 kcal/ngày → 550/2508 = 21,9 % > 20 % nên bị kẹp.
    const result = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'moderate',
      goal: 'lose',
      rateKgPerWeek: 0.5,
    })
    expect(result.floorsApplied).toContain('deficit_cap')
    // 2508 × 0,8 = 2006,4 → làm tròn 10 thành 2010
    expect(result.targetKcal).toBe(2010)
    expect(result.targetKcal).toBeLessThan(result.tdeeKcal)
  })

  it('không kẹp khi tốc độ giảm cân nằm trong ngưỡng an toàn', () => {
    // 0,25 kg/tuần = 275 kcal/ngày → 275/2508 = 10,96 % < 20 %.
    const result = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'moderate',
      goal: 'lose',
      rateKgPerWeek: 0.25,
    })
    expect(result.floorsApplied).not.toContain('deficit_cap')
    expect(result.targetKcal).toBe(2230)
  })

  it('áp sàn BMR khi mục tiêu bị đẩy quá thấp', () => {
    const result = computeEnergyTargets({
      weightKg: 45,
      heightCm: 155,
      age: 25,
      sex: 'female',
      activityLevel: 'sedentary',
      goal: 'lose',
      rateKgPerWeek: 0.5,
    })
    expect(result.floorsApplied).toContain('deficit_cap')
    expect(result.floorsApplied).toContain('bmr_floor')
    // BMR 1133 × 1,1 = 1246,3 → làm tròn 10 thành 1250
    expect(result.bmrKcal).toBe(1133)
    expect(result.targetKcal).toBe(1250)
  })

  it('áp sàn an toàn tuyệt đối trên cả sàn BMR', () => {
    const result = computeEnergyTargets({
      weightKg: 40,
      heightCm: 150,
      age: 60,
      sex: 'female',
      activityLevel: 'sedentary',
      goal: 'lose',
      rateKgPerWeek: 1,
    })
    expect(result.floorsApplied).toContain('absolute_minimum')
    expect(result.targetKcal).toBe(1200)
  })

  it('áp trần thặng dư khi tăng cân quá nhanh', () => {
    const result = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'moderate',
      goal: 'gain',
      rateKgPerWeek: 1,
    })
    expect(result.floorsApplied).toContain('surplus_cap')
    // 2508 × 1,15 = 2884,2 → làm tròn 10 thành 2880
    expect(result.targetKcal).toBe(2880)
  })

  it('luôn trả về mục tiêu dương và macro không âm', () => {
    const cases = [
      { ...NAM_30, activityLevel: 'very_active', goal: 'gain' },
      { ...NU_30, activityLevel: 'sedentary', goal: 'lose' },
      { ...NU_30, activityLevel: 'light', goal: 'maintain' },
    ] as const
    for (const input of cases) {
      const result = computeEnergyTargets(input)
      expect(result.targetKcal).toBeGreaterThan(0)
      expect(result.proteinG).toBeGreaterThanOrEqual(0)
      expect(result.carbG).toBeGreaterThanOrEqual(0)
      expect(result.fatG).toBeGreaterThanOrEqual(0)
    }
  })

  it('quy đổi kg/tuần sang kcal/ngày đúng hằng số 7700', () => {
    const rate = 0.5
    const expectedDelta = (rate * KCAL_PER_KG_FAT) / 7
    // Ở mức vận động rất cao, tỉ lệ thâm hụt nhỏ hơn 20 % nên không bị kẹp.
    const result = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'very_active',
      goal: 'lose',
      rateKgPerWeek: rate,
    })
    // Mục tiêu được làm tròn 10 kcal nên cho phép sai số tối đa 5 kcal.
    expect(Math.abs(result.tdeeKcal - result.targetKcal - expectedDelta)).toBeLessThanOrEqual(5)
  })

  it('bỏ qua tốc độ khi giữ cân', () => {
    const withRate = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'moderate',
      goal: 'maintain',
      rateKgPerWeek: 1,
    })
    const withoutRate = computeEnergyTargets({
      ...NAM_30,
      activityLevel: 'moderate',
      goal: 'maintain',
    })
    expect(withRate).toEqual(withoutRate)
  })
})
