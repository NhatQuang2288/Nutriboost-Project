import { describe, expect, it } from 'vitest'

import { computeMacros, kcalFromMacros, macroDriftKcal, roundToStep } from '../macros'
import { computeEnergyTargets } from '../energy'
import { ROUNDING } from '../constants'

describe('computeMacros', () => {
  it('lấy đạm theo cân nặng của mục tiêu giảm cân', () => {
    const result = computeMacros(2000, 70, 'lose')
    // 1,8 g/kg × 70 = 126 g → làm tròn 5 thành 125
    expect(result.split.proteinG).toBe(125)
    expect(result.floors).toEqual([])
  })

  it('kẹp đạm ở 40 % năng lượng và ghi nhận yếu tố biên', () => {
    const result = computeMacros(1500, 100, 'lose')
    // Mong muốn 1,8 × 100 = 180 g, nhưng trần 1500 × 0,4 / 4 = 150 g
    expect(result.floors).toContain('protein_cap')
    expect(result.split.proteinG).toBe(150)
  })

  it('áp sàn chất béo khi 25 % năng lượng xuống dưới 0,6 g/kg', () => {
    const result = computeMacros(1000, 100, 'lose')
    // 25 % của 1000 kcal = 27,8 g, sàn là 0,6 × 100 = 60 g
    expect(result.floors).toContain('fat_floor')
    expect(result.split.fatG).toBe(60)
  })

  it('để sàn chất béo thắng trần 40 % khi hai ràng buộc xung đột', () => {
    const result = computeMacros(800, 100, 'lose')
    // Sàn 60 g > trần 800 × 0,4 / 9 = 35,6 g. Sàn phải thắng, và phải được ghi nhận.
    expect(result.floors).toContain('fat_floor')
    expect(result.split.fatG).toBeGreaterThanOrEqual(60)
  })

  it('không bao giờ để carbohydrate âm', () => {
    const cases = [
      { kcal: 1200, kg: 100, goal: 'lose' as const },
      { kcal: 800, kg: 90, goal: 'maintain' as const },
      { kcal: 1500, kg: 120, goal: 'gain' as const },
    ]
    for (const item of cases) {
      const result = computeMacros(item.kcal, item.kg, item.goal)
      expect(result.split.carbG).toBeGreaterThanOrEqual(0)
      expect(result.split.proteinG).toBeGreaterThan(0)
      expect(result.split.fatG).toBeGreaterThan(0)
    }
  })

  it('từ chối đầu vào không hợp lệ', () => {
    expect(() => computeMacros(0, 70, 'lose')).toThrow(RangeError)
    expect(() => computeMacros(2000, 0, 'lose')).toThrow(RangeError)
  })

  it('làm tròn về bội số 5 g', () => {
    const result = computeMacros(2000, 70, 'maintain')
    for (const value of Object.values(result.split)) {
      expect(value % ROUNDING.macroG).toBe(0)
    }
  })
})

describe('macroDriftKcal', () => {
  it('khớp phép trừ giữa mục tiêu và năng lượng của macro', () => {
    const split = { proteinG: 125, carbG: 250, fatG: 55 }
    expect(kcalFromMacros(split)).toBe(1995)
    expect(macroDriftKcal(2010, split)).toBe(15)
  })

  it('độ lệch luôn nằm trong ±20 kcal trên một lưới hồ sơ rộng', () => {
    const goals = ['lose', 'maintain', 'gain'] as const
    const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
    const rates = [0, 0.25, 0.5, 1] as const

    let checked = 0
    for (const sex of ['male', 'female'] as const) {
      for (let weight = 40; weight <= 120; weight += 10) {
        for (let height = 150; height <= 190; height += 10) {
          for (let age = 18; age <= 70; age += 20) {
            for (const activityLevel of levels) {
              for (const goal of goals) {
                for (const rateKgPerWeek of rates) {
                  const result = computeEnergyTargets({
                    weightKg: weight,
                    heightCm: height,
                    age,
                    sex,
                    activityLevel,
                    goal,
                    rateKgPerWeek,
                  })
                  expect(
                    Math.abs(result.macroDriftKcal),
                    `lệch quá lớn: ${sex} ${weight}kg ${height}cm ${age}t ${activityLevel} ${goal} ${rateKgPerWeek}`,
                  ).toBeLessThanOrEqual(20)
                  expect(result.proteinG).toBeGreaterThanOrEqual(0)
                  expect(result.carbG).toBeGreaterThanOrEqual(0)
                  expect(result.fatG).toBeGreaterThanOrEqual(0)
                  checked += 1
                }
              }
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(5000)
  })
})

describe('roundToStep', () => {
  it('làm tròn về bội số gần nhất', () => {
    expect(roundToStep(2010, 10)).toBe(2010)
    expect(roundToStep(2006.4, 10)).toBe(2010)
    expect(roundToStep(126, 5)).toBe(125)
    expect(roundToStep(250.875, 5)).toBe(250)
  })
})
