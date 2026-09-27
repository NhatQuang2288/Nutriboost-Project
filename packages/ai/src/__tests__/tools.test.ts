import { type SafetyAssessment } from '@nutriboost/nutrition'
import { describe, expect, it, vi } from 'vitest'

import { createMealEstimator, type MealCatalogueEntry } from '../meal-estimator'
import type { WorkoutExerciseEntry } from '../workout-builder'
import { parseGenerativePayload } from '../schemas'
import {
  ASSISTANT_TOOL_NAMES,
  TOOL_TO_COMPONENT,
  createAssistantTools,
  weekdayLabelVi,
  type LoggedMealRequest,
  type ToolRefusal,
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
    // Ba chỉ số này có trong danh mục thật; fixture cũng phải có để test được rằng công cụ
    // chuyển tiếp chúng, thay vì để chúng rơi thành 0 một cách im lặng.
    fiberG: 0.6,
    sugarG: 1.1,
    sodiumMg: 420,
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

const EXERCISES: readonly WorkoutExerciseEntry[] = [
  {
    slug: 'squat-bodyweight',
    nameVi: 'Squat không tạ',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    contraindications: ['knee'],
  },
  {
    slug: 'glute-bridge',
    nameVi: 'Cầu mông',
    muscleGroup: 'glutes',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 3.5,
  },
  {
    slug: 'push-up-knee',
    nameVi: 'Hít đất chống gối',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 3.8,
    contraindications: ['wrist'],
  },
  {
    slug: 'superman',
    nameVi: 'Superman',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 3,
  },
  {
    slug: 'dumbbell-row',
    nameVi: 'Chèo tạ đơn',
    muscleGroup: 'back',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 5,
  },
  {
    slug: 'plank',
    nameVi: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 3.8,
  },
  {
    slug: 'arm-circle',
    nameVi: 'Xoay tay',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
  },
  {
    slug: 'hamstring-stretch',
    nameVi: 'Giãn đùi sau',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
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
    remainingKcal: 900,
    profile: { goal: 'lose' as const, weightKg: 60 },
    exercises: EXERCISES,
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
  it('có đủ mười một công cụ, tên khớp bảng ánh xạ component', () => {
    const tools = createAssistantTools(makeContext())
    expect(Object.keys(tools).sort()).toEqual([...ASSISTANT_TOOL_NAMES].sort())
    expect(ASSISTANT_TOOL_NAMES).toHaveLength(11)
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
      ['generate_workout', {}],
      ['suggest_meals', { mealType: 'dinner' }],
      ['lookup_food', { query: 'phở bò' }],
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

  it('từ chối món không có trong danh mục, và nói rõ lý do cho model', async () => {
    const tools = createAssistantTools(makeContext({ logMeal: async () => ({ remainingKcal: 0 }) }))
    const output = (await run(tools.log_meal, {
      mealType: 'lunch',
      items: [{ foodId: 'khong-ton-tai', grams: 100 }],
    })) as ToolRefusal

    // Trả về chứ không ném: lỗi bị ném sẽ bị AI SDK che, model không biết vì sao và
    // sẽ bịa ra lý do. Đây là bài học từ một lỗi đã xảy ra thật.
    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/khong-ton-tai/)
    expect(output.message).toMatch(/search_food/)
  })

  it('nói thẳng là chưa nối cơ sở dữ liệu và bữa ăn CHƯA được lưu', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.log_meal, {
      mealType: 'lunch',
      items: [{ foodId: 'pho-bo', grams: 200 }],
    })) as ToolRefusal

    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/chưa nối cơ sở dữ liệu/)
    expect(output.message).toMatch(/CHƯA được lưu/)
    // Không được gợi ý thử lại: thử lại cũng không được, nói vậy là nói dối.
    expect(output.message).toMatch(/đừng bảo họ thử lại/)
  })

  it('tầng ứng dụng ném lỗi thì đổi thành từ chối, không để lỗi thoát ra', async () => {
    /*
     * Đây là hành vi quan trọng nhất của công cụ này. Tầng ứng dụng ghi vào PostgreSQL và có
     * thể ném lỗi (mất mạng, RLS từ chối, ràng buộc). Nếu lỗi đó thoát ra khỏi `execute`, AI
     * SDK che nội dung trước khi nó tới model — model không biết vì sao và sẽ bịa ra lý do.
     *
     * Đã xảy ra thật: Bơ nói "lỗi hệ thống tạm thời, bạn thử lại sau" trong khi thử lại bao
     * nhiêu lần cũng không được.
     */
    const tools = createAssistantTools(
      makeContext({
        logMeal: async () => {
          throw new Error('permission denied for function log_meal_with_items')
        },
      }),
    )

    const output = (await run(tools.log_meal, {
      mealType: 'dinner',
      items: [{ foodId: 'pho-bo', grams: 400 }],
    })) as ToolRefusal

    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/CHƯA ghi được/)
    // Chi tiết kỹ thuật đi kèm để model không phải đoán, và để người đọc log biết đường lần.
    expect(output.message).toMatch(/permission denied/)
    // Và phải nói rõ là chưa lưu, không để model hiểu thành đã lưu.
    expect(output.message).toMatch(/CHƯA được lưu/)
  })

  it('chuyển tiếp chất xơ, đường và natri cho tầng ghi', async () => {
    // Ba chỉ số này từng bị bỏ ở ranh giới công cụ, nên mọi bữa ăn qua trợ lý đều hiện chất
    // xơ và natri bằng 0 — sai im lặng, vì danh mục có đủ ba cột.
    const captured: LoggedMealRequest[] = []
    const tools = createAssistantTools(
      makeContext({
        logMeal: async (request: LoggedMealRequest) => {
          captured.push(request)
          return { remainingKcal: 100 }
        },
      }),
    )

    await run(tools.log_meal, {
      mealType: 'breakfast',
      items: [{ foodId: 'pho-bo', grams: 500 }],
    })

    const item = captured[0]?.items[0]
    // 500 g phở: 0,6 g chất xơ và 420 mg natri trên 100 g, nhân hệ số 5.
    expect(item?.fiberG).toBe(3)
    expect(item?.sugarG).toBe(5.5)
    expect(item?.sodiumMg).toBe(2100)
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

describe('generate_plan — tham số model chọn', () => {
  it('dựng thực đơn một ngày khi được yêu cầu', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_plan, { days: 1 })) as {
      days: { totalKcal: number }[]
      targetKcal: number
    }
    expect(output.days).toHaveLength(1)
    expect(output.targetKcal).toBe(2010)
    // Tổng kcal của ngày do code tính, thẻ hiển thị được luôn.
    expect(output.days[0]?.totalKcal).toBeGreaterThan(0)
  })

  it('chỉ dựng những bữa được yêu cầu', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_plan, { days: 2, meals: ['lunch', 'dinner'] })) as {
      days: { meals: { mealType: string }[] }[]
    }
    const types = new Set(output.days.flatMap((day) => day.meals.map((meal) => meal.mealType)))
    expect([...types].sort()).toEqual(['dinner', 'lunch'])
  })

  it('loại món người dùng muốn tránh, và nói ra điều đó', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_plan, { avoid: ['phở'] })) as {
      days: { meals: { displayName: string }[] }[]
      notes: string[]
    }
    const names = output.days.flatMap((day) => day.meals.map((meal) => meal.displayName))
    expect(names).not.toContain('Phở bò')
    expect(output.notes[0]).toMatch(/Đã bỏ 1 món/)
  })
})

describe('generate_workout', () => {
  it('dựng lịch tập mặc định 3 buổi, có kcal đốt tính bằng MET', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_workout, {})) as {
      sessions: { dayLabel: string; estimatedKcal: number; blocks: { dose: string }[] }[]
      weeklyKcal: number
      levelLabel: string
    }
    expect(output.sessions).toHaveLength(3)
    expect(output.levelLabel).toBe('Người mới tập')
    // 21/09/2026 là thứ Hai — buổi đầu rơi vào hôm nay.
    expect(output.sessions[0]?.dayLabel).toBe('Thứ hai')
    expect(output.weeklyKcal).toBe(
      output.sessions.reduce((sum, session) => sum + session.estimatedKcal, 0),
    )
    expect(output.sessions[0]?.blocks[0]?.dose).toBe('2 phút')
  })

  it('không bao giờ xếp bài chống chỉ định với chấn thương đã khai', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.generate_workout, { injuries: ['knee', 'wrist'] })) as {
      sessions: { blocks: { nameVi: string }[] }[]
    }
    const names = output.sessions.flatMap((session) => session.blocks.map((block) => block.nameVi))
    expect(names).not.toContain('Squat không tạ')
    expect(names).not.toContain('Hít đất chống gối')
  })

  it('chỉ dùng tạ khi người dùng nói có tạ', async () => {
    const tools = createAssistantTools(makeContext())
    const atHome = (await run(tools.generate_workout, { daysPerWeek: 2 })) as {
      sessions: { blocks: { nameVi: string }[] }[]
    }
    const names = atHome.sessions.flatMap((session) => session.blocks.map((block) => block.nameVi))
    expect(names).not.toContain('Chèo tạ đơn')
  })

  it('từ chối, nói rõ lý do, khi chưa có danh mục bài tập', async () => {
    const tools = createAssistantTools(makeContext({ exercises: undefined }))
    const output = (await run(tools.generate_workout, {})) as ToolRefusal
    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/chưa nạp danh mục bài tập/)
  })

  it('từ chối khi chưa có hồ sơ, vì không tính được kcal đốt', async () => {
    const tools = createAssistantTools(makeContext({ profile: undefined }))
    const output = (await run(tools.generate_workout, {})) as ToolRefusal
    expect(output.refused).toBe(true)
  })
})

describe('suggest_meals', () => {
  it('không gợi ý bữa vượt quá số kcal còn lại', async () => {
    const tools = createAssistantTools(makeContext({ remainingKcal: 300 }))
    const output = (await run(tools.suggest_meals, { mealType: 'dinner' })) as {
      budgetKcal: number
      options: { kcal: number }[]
    }
    // Phần bữa tối là 30 % × 2010 = 603 kcal, nhưng chỉ còn 300 kcal.
    expect(output.budgetKcal).toBe(300)
    for (const option of output.options) {
      expect(option.kcal).toBeLessThanOrEqual(300 * 1.35)
    }
  })

  it('tôn trọng ngân sách model đặt khi người dùng nói "nhẹ"', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.suggest_meals, { mealType: 'dinner', budgetKcal: 350 })) as {
      budgetKcal: number
    }
    expect(output.budgetKcal).toBe(350)
  })

  it('bỏ món cần tránh', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.suggest_meals, {
      mealType: 'lunch',
      avoid: ['phở bò'],
      count: 5,
    })) as { options: { foodId: string }[]; note: string | null }
    expect(output.options.map((option) => option.foodId)).not.toContain('pho-bo')
    expect(output.note).toMatch(/Đã bỏ 1 món/)
  })
})

describe('lookup_food', () => {
  it('tính dinh dưỡng cho một khẩu phần chuẩn từ danh mục', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.lookup_food, { query: 'phở bò' })) as {
      foodId: string
      grams: number
      kcal: number
      portionLabel: string
      sodiumMg: number
    }
    expect(output.foodId).toBe('pho-bo')
    expect(output.grams).toBe(353)
    expect(output.kcal).toBe(Math.round(137 * 3.53))
    expect(output.sodiumMg).toBe(Math.round(420 * 3.53))
    expect(output.portionLabel).toBe('1 khẩu phần (353 g)')
  })

  it('dùng số gram người dùng nói', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.lookup_food, { query: 'gỏi cuốn', grams: 100 })) as {
      kcal: number
    }
    expect(output.kcal).toBe(98)
  })

  it('bỏ qua số lượng và đơn vị trong câu hỏi', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.lookup_food, { query: '1 tô phở bò' })) as { foodId: string }
    expect(output.foodId).toBe('pho-bo')
  })

  it('không nhận món gần đúng nhưng khác — "trà sữa" không phải "sữa chua"', async () => {
    const catalogue: readonly MealCatalogueEntry[] = [
      ...CATALOGUE,
      {
        slug: 'sua-chua-trai-cay',
        nameVi: 'Sữa chua trái cây',
        kind: 'dish',
        servingGrams: 150,
        kcalPer100g: 95,
        proteinG: 3,
        carbG: 16,
        fatG: 2,
      },
    ]
    const tools = createAssistantTools(
      makeContext({ catalogue, estimator: createMealEstimator(catalogue) }),
    )
    const output = (await run(tools.lookup_food, { query: 'trà sữa' })) as ToolRefusal
    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/KHÔNG tự đưa ra con số calo/)
  })

  it('từ chối thay vì bịa khi danh mục không có món', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.lookup_food, { query: 'pizza hải sản' })) as ToolRefusal
    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/KHÔNG tự đưa ra con số calo/)
  })
})

describe('show_safety_notice', () => {
  it('từ chối dựng cảnh báo khi hồ sơ không có gì đáng lo', async () => {
    const tools = createAssistantTools(makeContext())
    const output = (await run(tools.show_safety_notice, {})) as ToolRefusal

    // Không có gì đáng lo không phải là lỗi — chỉ là không có gì để hiện.
    expect(output.refused).toBe(true)
    expect(output.message).toMatch(/không có điểm nào cần lưu ý/)
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
