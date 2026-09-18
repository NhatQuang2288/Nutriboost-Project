import { type SafetyAssessment } from '@nutriboost/nutrition'
import { describe, expect, it, vi } from 'vitest'

import { createMealEstimator, type MealCatalogueEntry } from '../meal-estimator'
import { parseGenerativePayload } from '../schemas'
import {
  ASSISTANT_TOOL_NAMES,
  TOOL_TO_COMPONENT,
  createAssistantTools,
  weekdayLabelVi,
  type LoggedMealRequest,
} from '../tools/index'

const CATALOGUE: readonly MealCatalogueEntry[] = [
  {
    slug: 'pho-bo',
    nameVi: 'Phở bò',
    kind: 'dish',
    servingGrams: 353,
    kcalPer100g: 137,
    proteinG: 7.2,
    carbG: 22.5,
    fatG: 1.9,
  },
  {
    slug: 'com-tam-suon',
    nameVi: 'Cơm tấm sườn',
    kind: 'dish',
    servingGrams: 413,
    kcalPer100g: 132,
    proteinG: 5.4,
    carbG: 16.2,
    fatG: 4.6,
  },
  {
    slug: 'goi-cuon',
    nameVi: 'Gỏi cuốn',
    kind: 'dish',
    servingGrams: 170,
    kcalPer100g: 98,
    proteinG: 7.6,
    carbG: 12.4,
    fatG: 2.1,
  },
]

const SAFETY_OK: SafetyAssessment = { level: 'ok', reasons: [], blockWeightLoss: false }
const SAFETY_REFER: SafetyAssessment = {
  level: 'refer',
  reasons: ['BMI ở mức béo phì độ II — nên được bác sĩ đánh giá trước.'],
  blockWeightLoss: false,
}

function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    catalogue: CATALOGUE,
    estimator: createMealEstimator(CATALOGUE),
    targets: {
      bmrKcal: 1618,
      tdeeKcal: 2508,
      targetKcal: 2010,
      proteinG: 125,
      carbG: 250,
      fatG: 55,
      floorsApplied: ['deficit_cap'],
    },
    safety: SAFETY_OK,
    today: '2026-09-21',
    ...overrides,
  }
}

type Runnable = { execute?: (input: unknown, options: unknown) => Promise<unknown> }

async function run(tool: unknown, input: unknown): Promise<unknown> {
  const candidate = tool as Runnable
  if (typeof candidate.execute !== 'function') {
    throw new Error('Tool không có execute — đây là tool phía client.')
  }
  return candidate.execute(input, { toolCallId: 'test-call', messages: [] })
}

describe('bộ công cụ', () => {
  it('có đủ tám công cụ, tên khớp bảng ánh xạ component', () => {
    const tools = createAssistantTools(makeContext())
    expect(Object.keys(tools).sort()).toEqual([...ASSISTANT_TOOL_NAMES].sort())
    expect(ASSISTANT_TOOL_NAMES).toHaveLength(8)
  })

  it('mọi đầu ra đều dựng được thành giao diện', async () => {
    const tools = createAssistantTools(
      makeContext({ safety: SAFETY_REFER, logMeal: async () => ({ remainingKcal: 1500 }) }),
    )

    const cases: [keyof typeof TOOL_TO_COMPONENT, unknown][] = [
      ['search_food', { query: 'phở' }],
      ['estimate_meal', { text: 'sáng nay mình ăn phở bò' }],
      ['log_meal', { mealType: 'breakfast', items: [{ foodId: 'pho-bo', grams: 353 }] }],
      ['compute_targets', {}],
      ['get_progress', {}],
      ['generate_plan', {}],
      ['show_safety_notice', {}],
    ]

    for (const [name, input] of cases) {
      const output = await run(tools[name], input)
      const parsed = parseGenerativePayload(TOOL_TO_COMPONENT[name], output)
      expect(parsed.ok, `${name} sinh ra payload không hợp lệ`).toBe(true)
    }
  })
})

describe('search_food', () => {
  it('trả về ứng viên khớp', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.search_food, { query: 'phở' })) as {
      candidates: { foodId: string }[]
    }
    expect(output.candidates.some((item) => item.foodId === 'pho-bo')).toBe(true)
  })

  it('không tìm thấy thì trả về danh sách rỗng kèm lời nhắn, không ném lỗi', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.search_food, { query: 'zzzzz' })) as {
      candidates: unknown[]
      promptText: string
    }
    expect(output.candidates).toEqual([])
    expect(output.promptText).toContain('chưa tìm thấy')
  })
})

describe('estimate_meal', () => {
  it('khớp món và tính calo từ danh mục', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.estimate_meal, { text: 'sáng nay mình ăn phở bò' })) as {
      items: { foodId: string | null; kcal: number }[]
      total: { kcal: number }
    }
    expect(output.items[0]?.foodId).toBe('pho-bo')
    expect(output.total.kcal).toBe(Math.round((137 * 353) / 100))
  })

  it('đánh dấu cần xác nhận khi không khớp được món', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.estimate_meal, { text: 'mình ăn pizza' })) as {
      needsConfirmation: boolean
    }
    expect(output.needsConfirmation).toBe(true)
  })
})

describe('log_meal — model không thể bịa con số', () => {
  it('tính lại toàn bộ dinh dưỡng từ danh mục, bỏ qua mọi con số model đưa', async () => {
    const logMeal = vi.fn(async (_request: LoggedMealRequest) => ({ remainingKcal: 1500 }))
    const tools = createAssistantTools(makeContext({ logMeal }))

    const output = (await run(tools.log_meal, {
      mealType: 'breakfast',
      // Model cố tình gửi kèm calo sai; schema không có trường đó nên bị bỏ qua.
      items: [{ foodId: 'pho-bo', grams: 353, kcal: 99999 }],
    })) as { total: { kcal: number } }

    expect(output.total.kcal).toBe(Math.round((137 * 353) / 100))
  })

  it('từ chối món không có trong danh mục', async () => {
    const tools = createAssistantTools(makeContext({ logMeal: async () => ({ remainingKcal: 0 }) }))
    await expect(
      run(tools.log_meal, { mealType: 'lunch', items: [{ foodId: 'khong-ton-tai', grams: 100 }] }),
    ).rejects.toThrow(/Không có món/)
  })

  it('báo rõ khi chưa nối cơ sở dữ liệu', async () => {
    const tools = createAssistantTools(makeContext())
    await expect(
      run(tools.log_meal, { mealType: 'lunch', items: [{ foodId: 'pho-bo', grams: 200 }] }),
    ).rejects.toThrow(/Chưa nối cơ sở dữ liệu/)
  })

  it('chuyển yêu cầu ghi xuống lớp dưới với số liệu đã tính', async () => {
    const logMeal = vi.fn(async (_request: LoggedMealRequest) => ({ remainingKcal: 1234 }))
    const tools = createAssistantTools(makeContext({ logMeal }))

    await run(tools.log_meal, {
      mealType: 'dinner',
      rawInput: 'tối mình ăn phở bò',
      items: [{ foodId: 'pho-bo', grams: 353 }],
    })

    expect(logMeal).toHaveBeenCalledOnce()
    expect(logMeal.mock.calls[0]?.[0]).toMatchObject({
      mealType: 'dinner',
      rawInput: 'tối mình ăn phở bò',
      items: [{ foodId: 'pho-bo', grams: 353, kcal: 484 }],
    })
  })
})

describe('compute_targets', () => {
  it('trả về số đã tính sẵn, không tính lại', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.compute_targets, {})) as {
      targetKcal: number
      macros: { proteinG: number }
    }
    expect(output.targetKcal).toBe(2010)
    expect(output.macros.proteinG).toBe(125)
  })

  it('giải thích được vì sao mục tiêu bị điều chỉnh', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.compute_targets, {})) as { explanation: string }
    expect(output.explanation).toContain('deficit_cap')
  })
})

describe('get_progress', () => {
  it('trả về biểu đồ rỗng khi chưa nối dữ liệu, không bịa số', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.get_progress, {})) as {
      points: unknown[]
      trendLabel: string
    }
    expect(output.points).toEqual([])
    expect(output.trendLabel).toContain('Chưa đủ dữ liệu')
  })

  it('đọc dữ liệu qua lớp được tiêm vào', async () => {
    const readProgress = vi.fn(async () => [
      { label: 'T2', value: 1900 },
      { label: 'T3', value: 2100 },
    ])
    const tools = createAssistantTools(makeContext({ readProgress }))
    const output = (await run(tools.get_progress, { days: 7 })) as {
      points: unknown[]
      trendLabel: string
    }
    expect(readProgress).toHaveBeenCalledWith(7)
    expect(output.points).toHaveLength(2)
    expect(output.trendLabel).toContain('tăng')
  })
})

describe('generate_plan', () => {
  it('dựng kế hoạch 7 ngày, mỗi ngày có nhãn thứ bằng tiếng Việt', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_plan, { weekStart: '2026-09-21' })) as {
      weekStart: string
      days: { dayLabel: string; meals: unknown[] }[]
    }
    expect(output.weekStart).toBe('2026-09-21')
    expect(output.days).toHaveLength(7)
    // 21/09/2026 là thứ Hai.
    expect(output.days[0]?.dayLabel).toBe('Thứ hai')
    expect(output.days[0]?.meals.length).toBeGreaterThan(0)
  })

  it('mặc định lấy hôm nay khi không truyền ngày', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_plan, {})) as { weekStart: string }
    expect(output.weekStart).toBe('2026-09-21')
  })
})

describe('show_safety_notice', () => {
  it('từ chối dựng cảnh báo khi hồ sơ không có gì đáng lo', async () => {
    const tools = createAssistantTools(makeContext())
    await expect(run(tools.show_safety_notice, {})).rejects.toThrow(
      /không có điểm nào cần cảnh báo/,
    )
  })

  it('dựng cảnh báo đúng mức độ khi hồ sơ cần chuyển hướng', async () => {
    const tools = createAssistantTools(makeContext({ safety: SAFETY_REFER }))
    const output = (await run(tools.show_safety_notice, {})) as {
      severity: string
      reasons: string[]
    }
    expect(output.severity).toBe('refer')
    expect(output.reasons).toHaveLength(1)
  })
})

describe('ask_user_choice', () => {
  it('là tool phía client — không có execute', () => {
    const tools = createAssistantTools(makeContext())
    expect((tools.ask_user_choice as Runnable).execute).toBeUndefined()
  })
})

describe('weekdayLabelVi', () => {
  it('trả về nhãn thứ đúng', () => {
    expect(weekdayLabelVi('2026-09-21')).toBe('Thứ hai')
    expect(weekdayLabelVi('2026-09-27')).toBe('Chủ nhật')
  })

  it('trả về nguyên chuỗi khi ngày sai định dạng', () => {
    expect(weekdayLabelVi('không-phải-ngày')).toBe('không-phải-ngày')
  })
})
