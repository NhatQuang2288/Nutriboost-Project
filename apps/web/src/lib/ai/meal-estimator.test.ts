import { describe, expect, it } from 'vitest'

import { detectServingMultiplier, estimateMeal, suggestFoods } from './meal-estimator'

describe('detectServingMultiplier', () => {
  it('mặc định là một khẩu phần', () => {
    expect(detectServingMultiplier('phở bò')).toBe(1)
  })

  it('nhận chữ số Ả Rập', () => {
    expect(detectServingMultiplier('2 bát phở bò')).toBe(2)
    expect(detectServingMultiplier('3 quả trứng')).toBe(3)
  })

  it('nhận số viết bằng chữ', () => {
    expect(detectServingMultiplier('hai bát cơm')).toBe(2)
    expect(detectServingMultiplier('ba ly sữa')).toBe(3)
  })

  it('nhận phân số', () => {
    expect(detectServingMultiplier('1/2 tô phở')).toBe(0.5)
    expect(detectServingMultiplier('3/4 bát cơm')).toBe(0.75)
  })

  it('nhận "nửa"', () => {
    expect(detectServingMultiplier('nửa tô phở')).toBe(0.5)
    expect(detectServingMultiplier('một nửa bát cơm')).toBe(0.5)
  })

  it('bỏ qua số vô lý', () => {
    // 25 không phải khẩu phần hợp lệ → quay về 1.
    expect(detectServingMultiplier('25 gam đậu phộng')).toBe(1)
  })

  // Hồi quy: "tấm" trong "cơm tấm" từng bị hiểu là "tám" và nhân 8 khẩu phần.
  it('KHÔNG hiểu "tấm" trong "cơm tấm" là số tám', () => {
    expect(detectServingMultiplier('cơm tấm sườn')).toBe(1)
    expect(detectServingMultiplier('trưa nay mình ăn cơm tấm sườn')).toBe(1)
  })

  it('số từ chỉ tính khi đi liền trước một đơn vị', () => {
    expect(detectServingMultiplier('hai bát cơm')).toBe(2)
    // "ba" ở đây là tên món, không phải số lượng.
    expect(detectServingMultiplier('thịt ba chỉ')).toBe(1)
  })
})

describe('estimateMeal', () => {
  it('khớp được câu nói đầy đủ, có ngữ cảnh', () => {
    const result = estimateMeal('sáng nay mình ăn phở bò')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.foodId).toBe('pho-bo')
    expect(result.items[0]?.nutrients.kcal).toBeGreaterThan(300)
  })

  it('bỏ được từ ngữ cảnh ở nhiều vị trí', () => {
    for (const cau of [
      'mình vừa ăn phở bò',
      'trưa nay tôi ăn phở bò',
      'phở bò',
      'hôm qua mình có ăn phở bò',
    ]) {
      const result = estimateMeal(cau)
      expect(result.items[0]?.foodId, `không khớp: "${cau}"`).toBe('pho-bo')
    }
  })

  it('tách được nhiều món trong một câu', () => {
    const result = estimateMeal('sáng nay mình ăn phở bò và uống cà phê sữa đá')
    expect(result.items).toHaveLength(2)
    expect(result.items.map((item) => item.foodId)).toEqual(['pho-bo', 'ca-phe-sua-da'])
  })

  it('nhân khẩu phần theo số lượng nói ra', () => {
    const mot = estimateMeal('một tô phở bò')
    const hai = estimateMeal('hai tô phở bò')
    expect(hai.items[0]!.grams).toBe(mot.items[0]!.grams * 2)
    expect(hai.total.kcal).toBe(mot.total.kcal * 2)
  })

  it('ghi nhận món không khớp thay vì bỏ im lặng', () => {
    const result = estimateMeal('mình ăn pizza hải sản')
    expect(result.unmatched.length).toBe(1)
    expect(result.items.some((item) => item.foodId === null)).toBe(true)
    expect(result.needsConfirmation).toBe(true)
  })

  it('tổng bằng tổng các mục', () => {
    const result = estimateMeal('cơm tấm sườn và canh rau muống')
    const sum = result.items.reduce((total, item) => total + item.nutrients.kcal, 0)
    expect(result.total.kcal).toBe(sum)
  })

  it('giữ nguyên câu gốc để lưu nhật ký', () => {
    const cau = 'sáng nay mình ăn phở bò'
    expect(estimateMeal(cau).rawInput).toBe(cau)
  })

  it('không vỡ với câu rỗng', () => {
    const result = estimateMeal('')
    expect(result.items).toEqual([])
    expect(result.total.kcal).toBe(0)
  })

  it('đánh dấu độ tự tin thấp khi khớp không chắc', () => {
    const result = estimateMeal('mình ăn gì đó')
    expect(result.needsConfirmation).toBe(true)
  })

  it('khớp đúng món có tên trùng số từ', () => {
    const result = estimateMeal('trưa nay mình ăn cơm tấm sườn')
    expect(result.items[0]?.foodId).toBe('com-tam-suon')
    // Một khẩu phần cơm tấm sườn rơi vào khoảng 500–900 kcal, không phải hàng nghìn.
    expect(result.total.kcal).toBeGreaterThan(400)
    expect(result.total.kcal).toBeLessThan(900)
  })
})

describe('suggestFoods', () => {
  it('trả về ứng viên cho một phần tên món', () => {
    const candidates = suggestFoods('phở', 5)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.some((food) => food.slug === 'pho-bo')).toBe(true)
  })

  it('trả về rỗng khi không có gì để tìm', () => {
    expect(suggestFoods('')).toEqual([])
  })
})
