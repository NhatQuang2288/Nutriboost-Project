import { describe, expect, it } from 'vitest'

import {
  createMealEstimator,
  detectServingMultiplier,
  dishNameKeyFromClause,
} from '../meal-estimator'

/**
 * Test đơn vị cho bộ ước lượng, dùng một danh mục nhỏ tự dựng.
 *
 * Nhờ danh mục được tiêm vào, test ở đây không phụ thuộc `@nutriboost/seed`: nó kiểm
 * đúng logic, còn test tích hợp với danh mục thật nằm ở `apps/web`.
 */
const CATALOGUE = [
  {
    slug: 'pho-bo',
    nameVi: 'Phở bò',
    aliases: ['phở', 'pho'],
    servingGrams: 353,
    kcalPer100g: 137,
    proteinG: 7.2,
    carbG: 22.5,
    fatG: 1.9,
  },
  {
    slug: 'com-tam-suon',
    nameVi: 'Cơm tấm sườn',
    aliases: ['cơm tấm'],
    servingGrams: 413,
    kcalPer100g: 132,
    proteinG: 5.4,
    carbG: 16.2,
    fatG: 4.6,
  },
  {
    slug: 'ca-phe-sua-da',
    nameVi: 'Cà phê sữa đá',
    servingGrams: 175,
    kcalPer100g: 47,
    proteinG: 1.3,
    carbG: 8,
    fatG: 1.2,
  },
]

const estimator = createMealEstimator(CATALOGUE)

describe('detectServingMultiplier', () => {
  it('mặc định là một khẩu phần', () => {
    expect(detectServingMultiplier('phở bò')).toBe(1)
  })

  it('nhận chữ số khi đi liền trước đơn vị', () => {
    expect(detectServingMultiplier('2 bát phở bò')).toBe(2)
    expect(detectServingMultiplier('3 quả trứng')).toBe(3)
  })

  it('nhận số viết bằng chữ khi đi liền trước đơn vị', () => {
    expect(detectServingMultiplier('hai bát cơm')).toBe(2)
    expect(detectServingMultiplier('ba ly sữa')).toBe(3)
  })

  it('nhận phân số', () => {
    expect(detectServingMultiplier('1/2 tô phở')).toBe(0.5)
    expect(detectServingMultiplier('3/4 bát cơm')).toBe(0.75)
  })

  it('nhận "nửa" khi đi liền trước đơn vị', () => {
    expect(detectServingMultiplier('nửa tô phở')).toBe(0.5)
    expect(detectServingMultiplier('một nửa bát cơm')).toBe(0.5)
  })

  it('bỏ qua số vô lý', () => {
    expect(detectServingMultiplier('25 gam đậu phộng')).toBe(1)
  })

  // Hồi quy: "tấm" trong "cơm tấm" từng bị hiểu là "tám" và nhân 8 khẩu phần.
  it('KHÔNG hiểu "tấm" trong "cơm tấm" là số tám', () => {
    expect(detectServingMultiplier('cơm tấm sườn')).toBe(1)
    expect(detectServingMultiplier('trưa nay mình ăn cơm tấm sườn')).toBe(1)
  })

  it('số từ đứng một mình không bị coi là số lượng', () => {
    expect(detectServingMultiplier('thịt ba chỉ')).toBe(1)
  })
})

describe('dishNameKeyFromClause', () => {
  it('bỏ từ ngữ cảnh, số lượng và đơn vị', () => {
    expect(dishNameKeyFromClause('sáng nay mình ăn phở bò')).toBe('pho bo')
    expect(dishNameKeyFromClause('hai bát cơm tấm sườn')).toBe('com tam suon')
    expect(dishNameKeyFromClause('phở bò')).toBe('pho bo')
  })

  it('giữ nguyên khoá khi bỏ hết sẽ ra rỗng', () => {
    expect(dishNameKeyFromClause('ăn')).toBe('an')
  })
})

describe('createMealEstimator', () => {
  it('khớp được câu nói đầy đủ có ngữ cảnh', () => {
    const result = estimator.estimate('sáng nay mình ăn phở bò')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.foodId).toBe('pho-bo')
  })

  it('tách được nhiều món trong một câu', () => {
    const result = estimator.estimate('mình ăn phở bò và uống cà phê sữa đá')
    expect(result.items.map((item) => item.foodId)).toEqual(['pho-bo', 'ca-phe-sua-da'])
  })

  it('nhân khẩu phần theo số lượng nói ra', () => {
    const mot = estimator.estimate('một tô phở bò')
    const hai = estimator.estimate('hai tô phở bò')
    expect(hai.items[0]!.grams).toBe(mot.items[0]!.grams * 2)
    // Năng lượng được làm tròn ở từng mục, nên tổng gấp đôi có thể lệch 1–2 kcal.
    expect(Math.abs(hai.total.kcal - mot.total.kcal * 2)).toBeLessThanOrEqual(2)
  })

  it('ghi nhận món không khớp thay vì bỏ im lặng', () => {
    const result = estimator.estimate('mình ăn pizza hải sản')
    expect(result.unmatched).toHaveLength(1)
    expect(result.needsConfirmation).toBe(true)
  })

  it('mọi con số đến từ danh mục, không phải từ model', () => {
    const result = estimator.estimate('phở bò')
    // 353 g × 137 kcal/100 g ≈ 484 kcal
    expect(result.total.kcal).toBe(Math.round((137 * 353) / 100))
  })

  it('danh mục rỗng thì không khớp được gì, không ném lỗi', () => {
    const empty = createMealEstimator([])
    const result = empty.estimate('phở bò')
    expect(result.items[0]?.foodId).toBeNull()
    expect(empty.size()).toBe(0)
  })

  it('suggest trả về ứng viên cho một phần tên món', () => {
    const candidates = estimator.suggest('phở', 5)
    expect(candidates.some((food) => food.slug === 'pho-bo')).toBe(true)
    expect(estimator.suggest('')).toEqual([])
  })

  it('size phản ánh kích thước danh mục', () => {
    expect(estimator.size()).toBe(CATALOGUE.length)
  })
})
