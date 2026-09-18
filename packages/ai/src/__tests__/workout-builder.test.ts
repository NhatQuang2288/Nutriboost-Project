import { describe, expect, it } from 'vitest'

import {
  type WorkoutExerciseEntry,
  blockKcal,
  blockMinutes,
  buildWorkoutPlan,
  withKcal,
} from '../workout-builder'

const EXERCISES: readonly WorkoutExerciseEntry[] = [
  // Thân dưới
  {
    slug: 'squat-bodyweight',
    nameVi: 'Squat không tạ',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 5,
  },
  {
    slug: 'lunge',
    nameVi: 'Chùng chân',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    contraindications: ['knee'],
  },
  {
    slug: 'hip-thrust',
    nameVi: 'Hip thrust',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    level: 'intermediate',
    measure: 'reps',
    met: 5,
  },
  // Đẩy
  {
    slug: 'push-up',
    nameVi: 'Hít đất',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 4.3,
    contraindications: ['wrist'],
  },
  {
    slug: 'bench-press',
    nameVi: 'Đẩy ngực',
    muscleGroup: 'chest',
    equipment: 'barbell',
    level: 'intermediate',
    measure: 'reps',
    met: 5,
  },
  {
    slug: 'shoulder-press',
    nameVi: 'Đẩy vai',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 5,
  },
  {
    slug: 'biceps-curl',
    nameVi: 'Cuốn tay trước',
    muscleGroup: 'arms',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 3.5,
  },
  // Kéo
  {
    slug: 'band-row',
    nameVi: 'Kéo dây',
    muscleGroup: 'back',
    equipment: 'band',
    level: 'beginner',
    measure: 'reps',
    met: 4,
  },
  {
    slug: 'lat-pulldown',
    nameVi: 'Kéo xô máy',
    muscleGroup: 'back',
    equipment: 'machine',
    level: 'beginner',
    measure: 'reps',
    met: 5,
  },
  // Thân giữa
  {
    slug: 'plank',
    nameVi: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 3.5,
  },
  // Tim mạch
  {
    slug: 'walking-brisk',
    nameVi: 'Đi bộ nhanh',
    muscleGroup: 'cardio',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 4.3,
  },
  // Khởi động và giãn cơ
  {
    slug: 'arm-circle',
    nameVi: 'Xoay vai',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
  },
  {
    slug: 'cat-cow',
    nameVi: 'Mèo–bò',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
  },
  {
    slug: 'hip-opener',
    nameVi: 'Giãn hông',
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

const BASE = {
  weekStart: '2026-09-21',
  goal: 'lose' as const,
  level: 'beginner' as const,
  daysPerWeek: 3,
  sessionMinutes: 45,
  weightKg: 70,
  exercises: EXERCISES,
}

describe('blockMinutes', () => {
  it('tính thời gian từ số hiệp, thời gian làm và thời gian nghỉ', () => {
    // 3 hiệp × (45 giây làm + 60 giây nghỉ) = 5,25 phút
    expect(
      blockMinutes({
        sets: 3,
        seconds: null,
        restSeconds: 60,
        met: 5,
        exerciseSlug: 'x',
        nameVi: 'x',
        reps: '10',
        estimatedKcal: 0,
      }),
    ).toBeCloseTo(5.25)
  })

  it('dùng số giây của bài đo bằng thời gian', () => {
    // 2 hiệp × (40 + 20) = 2 phút
    expect(
      blockMinutes({
        sets: 2,
        seconds: 40,
        restSeconds: 20,
        met: 5,
        exerciseSlug: 'x',
        nameVi: 'x',
        reps: null,
        estimatedKcal: 0,
      }),
    ).toBeCloseTo(2)
  })
})

describe('blockKcal', () => {
  it('theo đúng công thức MET × 3,5 × kg / 200 × phút', () => {
    const block = {
      sets: 1,
      seconds: 60,
      restSeconds: 0,
      met: 10,
      exerciseSlug: 'x',
      nameVi: 'x',
      reps: null,
      estimatedKcal: 0,
    }
    // 10 × 3,5 × 70 / 200 × 1 phút = 12,25 → 12
    expect(blockKcal(block, 70)).toBe(12)
  })

  it('tăng theo cân nặng', () => {
    const block = {
      sets: 3,
      seconds: null,
      restSeconds: 60,
      met: 5,
      exerciseSlug: 'x',
      nameVi: 'x',
      reps: '10',
      estimatedKcal: 0,
    }
    expect(blockKcal(block, 90)).toBeGreaterThan(blockKcal(block, 50))
  })
})

describe('buildWorkoutPlan', () => {
  it('dựng đúng số buổi theo số ngày mỗi tuần', () => {
    for (const daysPerWeek of [2, 3, 4, 5, 6]) {
      const plan = buildWorkoutPlan({ ...BASE, daysPerWeek })
      expect(plan.sessions, `daysPerWeek = ${daysPerWeek}`).toHaveLength(daysPerWeek)
    }
  })

  it('mỗi buổi đều có khởi động và giãn cơ', () => {
    const plan = buildWorkoutPlan(BASE)
    for (const session of plan.sessions) {
      expect(session.blocks.length).toBeGreaterThanOrEqual(3)
      const first = session.blocks[0]
      const last = session.blocks[session.blocks.length - 1]
      expect(['arm-circle', 'cat-cow', 'hip-opener']).toContain(first?.exerciseSlug)
      expect(['hamstring-stretch', 'hip-opener']).toContain(last?.exerciseSlug)
    }
  })

  it('buổi tập rơi vào các ngày rải đều trong tuần', () => {
    const plan = buildWorkoutPlan({ ...BASE, daysPerWeek: 3 })
    expect(plan.sessions.map((session) => session.date)).toEqual([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
    ])
  })

  it('tính kcal đốt cho từng buổi và cả tuần', () => {
    const plan = buildWorkoutPlan(BASE)
    for (const session of plan.sessions) {
      expect(session.estimatedKcal).toBeGreaterThan(0)
    }
    const sum = plan.sessions.reduce((total, session) => total + session.estimatedKcal, 0)
    expect(plan.weeklyKcal).toBe(sum)
  })

  it('LOẠI bài không phù hợp với chấn thương đã khai', () => {
    const plan = buildWorkoutPlan({ ...BASE, injuries: ['knee', 'wrist'] })
    const slugs = plan.sessions.flatMap((session) =>
      session.blocks.map((block) => block.exerciseSlug),
    )
    expect(slugs).not.toContain('lunge')
    expect(slugs).not.toContain('push-up')
    expect(plan.notes.join(' ')).toContain('chấn thương')
  })

  it('LOẠI bài cần thiết bị không có', () => {
    const plan = buildWorkoutPlan({ ...BASE, equipment: [] })
    const slugs = plan.sessions.flatMap((session) =>
      session.blocks.map((block) => block.exerciseSlug),
    )
    expect(slugs).not.toContain('bench-press')
    expect(slugs).not.toContain('lat-pulldown')
    expect(slugs).not.toContain('band-row')
  })

  it('dùng được bài có thiết bị khi khai báo thiết bị đó', () => {
    const plan = buildWorkoutPlan({
      ...BASE,
      level: 'intermediate',
      equipment: ['barbell', 'dumbbell'],
    })
    const slugs = plan.sessions.flatMap((session) =>
      session.blocks.map((block) => block.exerciseSlug),
    )
    expect(slugs.some((slug) => ['bench-press', 'hip-thrust'].includes(slug))).toBe(true)
  })

  it('người mới tập thì chia buổi toàn thân, người có kinh nghiệm thì chia đẩy kéo chân', () => {
    const beginner = buildWorkoutPlan({ ...BASE, level: 'beginner', daysPerWeek: 3 })
    expect(beginner.sessions[0]?.focus).toContain('Toàn thân')

    const intermediate = buildWorkoutPlan({ ...BASE, level: 'intermediate', daysPerWeek: 3 })
    expect(intermediate.sessions.map((session) => session.focus)).toEqual(['Đẩy', 'Kéo', 'Chân'])
  })

  it('cùng đầu vào cho cùng kế hoạch', () => {
    const a = buildWorkoutPlan(BASE)
    const b = buildWorkoutPlan({ ...BASE, exercises: [...EXERCISES].reverse() })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('cảnh báo khi chỉ tập 2 buổi mỗi tuần', () => {
    const plan = buildWorkoutPlan({ ...BASE, daysPerWeek: 2 })
    expect(plan.notes.join(' ')).toContain('2 buổi')
  })

  it('cảnh báo khi buổi tập đốt quá ít năng lượng', () => {
    const plan = buildWorkoutPlan({
      ...BASE,
      weightKg: 30,
      sessionMinutes: 20,
      exercises: EXERCISES.filter((exercise) => exercise.muscleGroup === 'mobility'),
    })
    // Chỉ còn bài mobility thì hoặc không dựng được buổi, hoặc đốt rất ít.
    expect(plan.sessions.length === 0 || plan.notes.join(' ').length > 0).toBe(true)
  })

  it('trả về kế hoạch rỗng kèm lý do khi mọi bài đều bị loại', () => {
    const plan = buildWorkoutPlan({
      ...BASE,
      injuries: ['knee', 'wrist'],
      equipment: [],
      exercises: EXERCISES.filter(
        (exercise) =>
          (exercise.contraindications ?? []).length > 0 || exercise.equipment !== 'bodyweight',
      ),
    })
    expect(plan.sessions).toEqual([])
    expect(plan.notes.at(-1)).toContain('Không còn bài tập nào phù hợp')
  })

  it('thời lượng buổi tập xấp xỉ thời lượng yêu cầu', () => {
    const plan = buildWorkoutPlan({ ...BASE, sessionMinutes: 45 })
    const session = plan.sessions[0]!
    expect(session.totalMinutes).toBeGreaterThan(20)
    expect(session.totalMinutes).toBeLessThan(80)
  })
})

describe('withKcal', () => {
  it('tính lại kcal khi cân nặng thay đổi', () => {
    const plan = buildWorkoutPlan(BASE)
    const session = plan.sessions[0]!
    const heavier = withKcal(session, 100)
    expect(heavier.estimatedKcal).toBeGreaterThan(session.estimatedKcal)
  })
})
