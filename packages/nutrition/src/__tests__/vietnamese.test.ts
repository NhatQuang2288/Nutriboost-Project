import { describe, expect, it } from 'vitest'

import {
  foodNameKey,
  foodNameTokens,
  normalizeVi,
  stripDiacritics,
  tokenizeVi,
} from '../normalize-vi'
import {
  FOOD_CANDIDATE_THRESHOLD,
  FOOD_MATCH_THRESHOLD,
  deterministicMatch,
  findFoodCandidates,
  similarity,
  trigrams,
} from '../similarity'
import type { FoodCandidateInput } from '../similarity'

describe('stripDiacritics', () => {
  it('bỏ toàn bộ dấu thanh và dấu phụ', () => {
    expect(stripDiacritics('Phở Bò Tái')).toBe('Pho Bo Tai')
    expect(stripDiacritics('Đường')).toBe('Duong')
    expect(stripDiacritics('Bữa sáng')).toBe('Bua sang')
  })
})

describe('normalizeVi', () => {
  it('cho ra cùng một khoá cho các cách gõ khác nhau', () => {
    const expected = 'pho bo tai'
    expect(normalizeVi('Phở Bò Tái')).toBe(expected)
    expect(normalizeVi('pho bo tai')).toBe(expected)
    expect(normalizeVi('PHỞ BÒ TÁI')).toBe(expected)
    expect(normalizeVi('  phở   bò   tái  ')).toBe(expected)
  })

  it('mở rộng teencode theo từ nguyên vẹn', () => {
    expect(normalizeVi('Tôi ko ăn')).toBe('toi khong an')
    expect(normalizeVi('mik uống cf')).toBe('minh uong ca phe')
  })

  it('không phá tên món chứa chuỗi giống teencode', () => {
    // "k" trong "kho" không được thay, vì ánh xạ chỉ áp cho từ nguyên vẹn.
    expect(normalizeVi('cá kho tộ')).toBe('ca kho to')
  })

  it('bỏ dấu câu nhưng giữ chữ số và dấu gạch chéo', () => {
    expect(normalizeVi('Sữa chua 100%')).toBe('sua chua 100')
    expect(normalizeVi('1/2 tô phở')).toBe('1/2 to pho')
  })

  it('trả về chuỗi rỗng cho đầu vào rỗng', () => {
    expect(normalizeVi('')).toBe('')
    expect(normalizeVi('   ')).toBe('')
    expect(tokenizeVi('')).toEqual([])
  })
})

describe('foodNameTokens', () => {
  it('tách khẩu phần khỏi tên món', () => {
    expect(foodNameTokens('2 bát phở bò')).toEqual(['pho', 'bo'])
    expect(foodNameKey('2 bát phở bò')).toBe('pho bo')
    expect(foodNameKey('1/2 tô phở')).toBe('pho')
  })

  it('giữ nguyên tên món có từ trùng với đơn vị', () => {
    // "bò" không nằm trong danh sách đơn vị nên không bị bỏ.
    expect(foodNameKey('bò')).toBe('bo')
  })

  it('quay về token đầy đủ khi bỏ hết sẽ ra rỗng', () => {
    // Người dùng chỉ gõ số lượng: khoá rỗng sẽ khớp bừa mọi món.
    expect(foodNameTokens('2 bát')).toEqual(['2', 'bat'])
  })

  /*
   * Hồi quy: từ chỉ số lượng chỉ được bỏ khi đi liền trước một đơn vị.
   *
   * Bản trước bỏ vô điều kiện, nên "tấm" trong "cơm tấm" bị coi là "tám" và bị xoá,
   * khiến câu "trưa nay mình ăn cơm tấm sườn" không khớp được món nào.
   * Lỗi này do test đầu-cuối bắt được.
   */
  it('KHÔNG phá tên món trùng với số từ', () => {
    expect(foodNameKey('cơm tấm sườn')).toBe('com tam suon')
    expect(foodNameKey('nấm hương')).toBe('nam huong')
    expect(foodNameKey('thịt ba chỉ')).toBe('thit ba chi')
  })

  it('vẫn bỏ số từ khi nó đứng trước một đơn vị', () => {
    expect(foodNameKey('hai bát phở bò')).toBe('pho bo')
    expect(foodNameKey('ba tô bún bò')).toBe('bun bo')
    expect(foodNameKey('một nửa bát cơm')).toBe('com')
  })

  it('số từ đứng một mình không bị bỏ', () => {
    expect(foodNameTokens('ba chỉ')).toEqual(['ba', 'chi'])
  })
})

describe('trigrams', () => {
  it('đệm mỗi từ 2 dấu cách trái và 1 dấu cách phải', () => {
    expect(trigrams('pho')).toEqual(['  p', ' ph', 'pho', 'ho '])
  })

  it('tách riêng từng từ', () => {
    expect(trigrams('pho bo')).toHaveLength(7)
  })
})

describe('similarity', () => {
  it('trùng khớp hoàn toàn cho ra 1', () => {
    expect(similarity('pho bo', 'pho bo')).toBe(1)
  })

  it('tính đúng giá trị Jaccard trên trigram', () => {
    // 4 trigram chung / (7 + 7 − 4) = 0,4
    expect(similarity('pho bo', 'pho ga')).toBeCloseTo(0.4, 6)
  })

  it('trả về 0 khi một bên rỗng', () => {
    expect(similarity('', 'pho bo')).toBe(0)
    expect(similarity('', '')).toBe(1)
  })

  it('nằm trong khoảng [0, 1]', () => {
    const samples = ['pho bo', 'com tam', 'banh mi', 'sua chua', 'x']
    for (const a of samples) {
      for (const b of samples) {
        const value = similarity(a, b)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })
})

const FOODS: readonly FoodCandidateInput[] = [
  { id: 'f1', nameVi: 'Phở bò' },
  { id: 'f2', nameVi: 'Phở gà' },
  { id: 'f3', nameVi: 'Cơm tấm' },
  { id: 'f4', nameVi: 'Bánh mì thịt' },
  { id: 'f5', nameVi: 'Hủ tiếu Nam Vang', aliases: ['hu tieu'] },
]

describe('findFoodCandidates', () => {
  it('xếp hạng ứng viên theo điểm giảm dần', () => {
    const candidates = findFoodCandidates('pho bo', FOODS)
    expect(candidates[0]?.food.id).toBe('f1')
    expect(candidates[0]?.score).toBe(1)
  })

  it('khớp được qua bí danh và báo đúng nguồn khớp', () => {
    const candidates = findFoodCandidates('hu tieu', FOODS)
    const top = candidates[0]
    expect(top?.food.id).toBe('f5')
    expect(top?.matchedOn).toBe('alias')
  })

  it('trả về rỗng khi truy vấn rỗng', () => {
    expect(findFoodCandidates('', FOODS)).toEqual([])
  })

  it('tôn trọng ngưỡng ứng viên', () => {
    const strict = findFoodCandidates('pho bo', FOODS, { threshold: 0.99 })
    expect(strict).toHaveLength(1)
    expect(FOOD_CANDIDATE_THRESHOLD).toBeLessThan(FOOD_MATCH_THRESHOLD)
  })

  it('tôn trọng giới hạn số ứng viên', () => {
    expect(findFoodCandidates('com', FOODS, { threshold: 0, limit: 2 })).toHaveLength(2)
  })
})

describe('deterministicMatch', () => {
  it('khớp tất định khi điểm cao và bỏ xa ứng viên kế tiếp', () => {
    const match = deterministicMatch('pho bo', FOODS)
    expect(match?.food.id).toBe('f1')
  })

  it('trả về null khi truy vấn mơ hồ', () => {
    // "pho" khớp cả phở bò và phở gà ở mức thấp → phải để AI phân xử.
    expect(deterministicMatch('pho', FOODS)).toBeNull()
  })

  it('trả về null khi không có ứng viên nào vượt ngưỡng', () => {
    expect(deterministicMatch('pizza hải sản', FOODS)).toBeNull()
  })

  it('ngưỡng mặc định là một phần của hợp đồng chi phí', () => {
    expect(FOOD_MATCH_THRESHOLD).toBe(0.72)
  })
})
