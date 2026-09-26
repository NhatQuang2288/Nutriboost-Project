import type { Goal } from '@nutriboost/nutrition'

import { addDays } from './plan-builder'

/**
 * Dựng lịch tập tuần — TẤT ĐỊNH.
 *
 * Cùng triết lý với bộ dựng thực đơn: lịch tập là thứ khách hàng nhìn mỗi tuần nên phải
 * luôn có, kể cả khi hết hạn mượt AI hay model lỗi. Và quan trọng hơn: **kcal đốt của
 * buổi tập phải tính được**, vì nó cộng vào ngân sách năng lượng trong ngày.
 *
 * Nguyên tắc an toàn: bài tập có `contraindications` trùng với chấn thương của người tập
 * sẽ bị loại. Đây là bộ lọc tất định, không phụ thuộc vào việc model có "để ý" hay không.
 */

export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutMeasure = 'reps' | 'time'

/** Cấu trúc tối thiểu của một bài tập. `ExerciseRecord` trong `@nutriboost/seed` khớp cấu trúc này. */
export interface WorkoutExerciseEntry {
  slug: string
  nameVi: string
  muscleGroup: string
  equipment: string
  level: WorkoutLevel
  measure: WorkoutMeasure
  /** MET của bài — nguồn chân lý để tính kcal đốt. */
  met: number
  contraindications?: readonly string[]
}

export interface WorkoutBlock {
  exerciseSlug: string
  nameVi: string
  sets: number
  /** Chuỗi hiển thị cho bài đo bằng số lần, ví dụ `12–15`. */
  reps: string | null
  /** Số giây mỗi hiệp cho bài đo bằng thời gian. */
  seconds: number | null
  restSeconds: number
  met: number
  estimatedKcal: number
}

export interface WorkoutSession {
  /** `YYYY-MM-DD`. */
  date: string
  focus: string
  blocks: WorkoutBlock[]
  totalMinutes: number
  estimatedKcal: number
}

export interface BuiltWorkoutPlan {
  weekStart: string
  sessions: WorkoutSession[]
  weeklyKcal: number
  weeklyMinutes: number
  notes: string[]
}

export interface BuildWorkoutInput {
  weekStart: string
  goal: Goal
  level: WorkoutLevel
  /** Số buổi mỗi tuần, 2–6. */
  daysPerWeek: number
  /** Thời lượng mỗi buổi, phút. */
  sessionMinutes: number
  weightKg: number
  /** Thiết bị có sẵn. `bodyweight` luôn được coi là có. */
  equipment?: readonly string[]
  /** Chấn thương cần tránh. */
  injuries?: readonly string[]
  exercises: readonly WorkoutExerciseEntry[]
}

/** Ngày tập trong tuần, 0 = thứ Hai. Chọn để các buổi rải đều, không dồn liền nhau. */
const DAY_OFFSETS: Readonly<Record<number, readonly number[]>> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
}

/** Buổi tập theo số ngày mỗi tuần. Người mới tập ít ngày thì tập toàn thân. */
const SPLITS: Readonly<Record<number, readonly string[]>> = {
  2: ['Toàn thân A', 'Toàn thân B'],
  3: ['Toàn thân A', 'Toàn thân B', 'Toàn thân C'],
  4: ['Thân trên', 'Thân dưới', 'Thân trên', 'Thân dưới'],
  5: ['Đẩy', 'Kéo', 'Chân', 'Thân trên', 'Thân dưới'],
  6: ['Đẩy', 'Kéo', 'Chân', 'Đẩy', 'Kéo', 'Chân'],
}

const SPLIT_FOR_EXPERIENCED: Readonly<Record<number, readonly string[]>> = {
  3: ['Đẩy', 'Kéo', 'Chân'],
  4: ['Thân trên', 'Thân dưới', 'Thân trên', 'Thân dưới'],
}

/** Nhóm cơ chính của từng loại buổi. */
const FOCUS_GROUPS: Readonly<Record<string, readonly string[]>> = {
  Đẩy: ['chest', 'shoulders', 'arms'],
  Kéo: ['back', 'arms'],
  Chân: ['legs', 'glutes'],
  'Thân trên': ['chest', 'back', 'shoulders', 'arms'],
  'Thân dưới': ['legs', 'glutes'],
  'Toàn thân A': ['legs', 'chest', 'back'],
  'Toàn thân B': ['glutes', 'shoulders', 'back'],
  'Toàn thân C': ['legs', 'chest', 'core'],
}

const LEVEL_SETS: Readonly<Record<WorkoutLevel, number>> = {
  beginner: 3,
  intermediate: 3,
  advanced: 4,
}

/** Thứ bậc trình độ — dùng để lọc bài không vượt quá trình độ người tập. */
const LEVEL_RANK: Readonly<Record<WorkoutLevel, number>> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

/** Thời gian khởi động và giãn cơ, tính bằng giây. */
const WARMUP_SECONDS = 120
const COOLDOWN_SECONDS = 180

const GOAL_PRESCRIPTION: Readonly<
  Record<Goal, { reps: string; restSeconds: number; timeSeconds: number }>
> = {
  lose: { reps: '12–15', restSeconds: 45, timeSeconds: 40 },
  maintain: { reps: '10–12', restSeconds: 60, timeSeconds: 45 },
  gain: { reps: '6–10', restSeconds: 90, timeSeconds: 50 },
}

const WARMUP_SLUGS = ['arm-circle', 'cat-cow', 'hip-opener'] as const
const COOLDOWN_SLUGS = ['hamstring-stretch', 'hip-opener'] as const

export function buildWorkoutPlan(input: BuildWorkoutInput): BuiltWorkoutPlan {
  const notes: string[] = []
  const daysPerWeek = Math.min(6, Math.max(2, Math.round(input.daysPerWeek)))
  const sessionMinutes = Math.min(120, Math.max(15, Math.round(input.sessionMinutes)))

  if (daysPerWeek !== input.daysPerWeek) {
    notes.push(`Số buổi mỗi tuần đã được điều chỉnh về ${daysPerWeek} (khuyến nghị từ 2 tới 6).`)
  }

  const equipment = new Set(['bodyweight', ...(input.equipment ?? [])])
  const injuries = new Set(input.injuries ?? [])

  const blocked: string[] = []
  const pool = input.exercises.filter((exercise) => {
    if (!equipment.has(exercise.equipment)) {
      blocked.push(exercise.slug)
      return false
    }
    const risky = (exercise.contraindications ?? []).some((area) => injuries.has(area))
    if (risky) {
      blocked.push(exercise.slug)
      return false
    }
    return true
  })

  if (blocked.length > 0) {
    notes.push(
      `Đã loại ${blocked.length} bài không phù hợp với thiết bị hiện có hoặc chấn thương đã khai.`,
    )
  }

  const mobility = pool.filter((exercise) => exercise.muscleGroup === 'mobility')

  // Nhận mọi bài ở trình độ người tập HOẶC THẤP HƠN.
  //
  // Bản đầu chỉ nhận đúng `level === 'beginner'`, nên người tập trung cấp và cao cấp
  // không bao giờ được đề xuất bài của chính mình — lỗi có thật, bắt bằng test.
  const userRank = LEVEL_RANK[input.level]
  const main = pool.filter(
    (exercise) => exercise.muscleGroup !== 'mobility' && LEVEL_RANK[exercise.level] <= userRank,
  )

  if (main.length === 0) {
    return {
      weekStart: input.weekStart,
      sessions: [],
      weeklyKcal: 0,
      weeklyMinutes: 0,
      notes: [
        ...notes,
        'Không còn bài tập nào phù hợp sau khi lọc. Kiểm tra lại thiết bị và chấn thương đã khai.',
      ],
    }
  }

  const splitKey = Math.min(daysPerWeek, 6)
  const split =
    input.level !== 'beginner' && daysPerWeek >= 3
      ? (SPLIT_FOR_EXPERIENCED[splitKey] ?? SPLITS[splitKey] ?? SPLITS[3]!)
      : (SPLITS[splitKey] ?? SPLITS[3]!)

  const offsets = DAY_OFFSETS[daysPerWeek] ?? DAY_OFFSETS[3]!
  const prescription = GOAL_PRESCRIPTION[input.goal]
  const sets = LEVEL_SETS[input.level]

  // Số bài chính suy từ thời gian THẬT của mỗi bài, không đoán theo cảm giác.
  //
  // Bản đầu chia cho 8 phút mỗi bài, trong khi mỗi bài chỉ chiếm 4,5–6,75 phút, nên
  // buổi 45 phút chỉ ra 20 phút. Sai số đó bị test bắt.
  const minutesPerMain =
    (sets * (Math.max(45, prescription.timeSeconds) + prescription.restSeconds)) / 60
  const setupMinutes = (WARMUP_SECONDS + COOLDOWN_SECONDS) / 60
  const mainCount = Math.min(
    8,
    Math.max(3, Math.round((sessionMinutes - setupMinutes) / minutesPerMain)),
  )

  // Bộ đếm dùng chung cả tuần để không lặp y nguyên một bài ở hai buổi liền nhau.
  let picker = 0
  const used = new Map<string, number>()

  const sessions: WorkoutSession[] = split.map((focus, sessionIndex) => {
    const groups = FOCUS_GROUPS[focus] ?? FOCUS_GROUPS['Thân trên']!
    const blocks: WorkoutBlock[] = []

    // Khởi động
    const warmup = pickFrom(mobility.length > 0 ? mobility : main, picker++, used)
    if (warmup !== null) {
      blocks.push(makeBlock(warmup, 1, prescription, 'warmup', input.weightKg))
    }

    // Bài chính
    for (let index = 0; index < mainCount; index += 1) {
      const candidates = main.filter((exercise) => groups.includes(exercise.muscleGroup))
      const chosen = pickFrom(candidates.length > 0 ? candidates : main, picker++, used)
      if (chosen === null) continue
      blocks.push(makeBlock(chosen, sets, prescription, 'main', input.weightKg))
    }

    // Giãn cơ
    const cooldownCandidates = mobility.filter((exercise) =>
      COOLDOWN_SLUGS.includes(exercise.slug as (typeof COOLDOWN_SLUGS)[number]),
    )
    const cooldown = pickFrom(
      cooldownCandidates.length > 0 ? cooldownCandidates : mobility,
      picker++,
      used,
    )
    if (cooldown !== null) {
      blocks.push(makeBlock(cooldown, 1, prescription, 'cooldown', input.weightKg))
    }

    const totalMinutes = blocks.reduce((sum, block) => sum + blockMinutes(block), 0)
    const estimatedKcal = blocks.reduce((sum, block) => sum + block.estimatedKcal, 0)

    return {
      date: addDays(input.weekStart, offsets[sessionIndex] ?? 0),
      focus,
      blocks,
      totalMinutes: Math.round(totalMinutes),
      estimatedKcal: Math.round(estimatedKcal),
    }
  })

  const weeklyKcal = sessions.reduce((sum, session) => sum + session.estimatedKcal, 0)
  const weeklyMinutes = sessions.reduce((sum, session) => sum + session.totalMinutes, 0)

  if (daysPerWeek < 3) {
    notes.push('Tập 2 buổi mỗi tuần là mức tối thiểu để duy trì; 3 buổi sẽ cho tiến bộ rõ hơn.')
  }

  const averageKcal = sessions.length > 0 ? weeklyKcal / sessions.length : 0
  if (averageKcal < 150) {
    notes.push(
      'Mỗi buổi đốt dưới 150 kcal. Nếu mục tiêu là giảm cân, nên tăng thời lượng hoặc thêm bài tim mạch.',
    )
  }

  return { weekStart: input.weekStart, sessions, weeklyKcal, weeklyMinutes, notes }
}

/** Chọn bài theo bộ đếm, ưu tiên bài ít dùng nhất để cả tuần đa dạng. */
function pickFrom(
  candidates: readonly WorkoutExerciseEntry[],
  offset: number,
  used: Map<string, number>,
): WorkoutExerciseEntry | null {
  if (candidates.length === 0) return null

  const sorted = [...candidates].sort((a, b) => {
    const usedA = used.get(a.slug) ?? 0
    const usedB = used.get(b.slug) ?? 0
    if (usedA !== usedB) return usedA - usedB
    return a.slug.localeCompare(b.slug)
  })

  // Trong nhóm ít dùng nhất, xoay vòng theo bộ đếm để buổi sau không trùng buổi trước.
  const leastUsed = used.get(sorted[0]!.slug) ?? 0
  const tier = sorted.filter((exercise) => (used.get(exercise.slug) ?? 0) === leastUsed)
  const chosen = tier[offset % tier.length] ?? tier[0]!
  used.set(chosen.slug, (used.get(chosen.slug) ?? 0) + 1)
  return chosen
}

type BlockRole = 'warmup' | 'main' | 'cooldown'

function makeBlock(
  exercise: WorkoutExerciseEntry,
  sets: number,
  prescription: { reps: string; restSeconds: number; timeSeconds: number },
  role: BlockRole,
  weightKg: number,
): WorkoutBlock {
  // Khởi động và giãn cơ là một khối liền mạch, không chia hiệp.
  if (role !== 'main') {
    const block: WorkoutBlock = {
      exerciseSlug: exercise.slug,
      nameVi: exercise.nameVi,
      sets: 1,
      reps: null,
      seconds: role === 'warmup' ? WARMUP_SECONDS : COOLDOWN_SECONDS,
      restSeconds: 0,
      met: exercise.met,
      estimatedKcal: 0,
    }
    return { ...block, estimatedKcal: blockKcal(block, weightKg) }
  }

  const block: WorkoutBlock = {
    exerciseSlug: exercise.slug,
    nameVi: exercise.nameVi,
    sets,
    reps: exercise.measure === 'reps' ? prescription.reps : null,
    seconds: exercise.measure === 'time' ? prescription.timeSeconds : null,
    restSeconds: prescription.restSeconds,
    met: exercise.met,
    estimatedKcal: 0,
  }

  return { ...block, estimatedKcal: blockKcal(block, weightKg) }
}

/**
 * Số phút của một khối bài tập.
 *
 * Bài đo bằng số lần: mỗi hiệp tính 45 giây thực hiện. Bài đo bằng thời gian: dùng đúng
 * số giây của hiệp. Cộng thời gian nghỉ giữa các hiệp.
 */
export function blockMinutes(block: WorkoutBlock): number {
  const workSeconds = block.seconds ?? 45
  return (block.sets * (workSeconds + block.restSeconds)) / 60
}

/**
 * Kcal đốt của một khối, theo công thức MET chuẩn:
 *
 *   kcal = MET × 3,5 × cân nặng (kg) / 200 × số phút
 *
 * Cùng công thức với `kcalBurnedForMet` trong `@nutriboost/nutrition`, nhưng ở đây áp cho
 * một khối có thời lượng suy ra từ số hiệp và thời gian nghỉ.
 */
export function blockKcal(block: WorkoutBlock, weightKg: number): number {
  return Math.round(((block.met * 3.5 * weightKg) / 200) * blockMinutes(block))
}

/** Gắn kcal vào từng khối và tính tổng buổi tập. Dùng sau khi đã biết cân nặng. */
export function withKcal(session: WorkoutSession, weightKg: number): WorkoutSession {
  const blocks = session.blocks.map((block) => ({
    ...block,
    estimatedKcal: blockKcal(block, weightKg),
  }))
  return {
    ...session,
    blocks,
    estimatedKcal: blocks.reduce((sum, block) => sum + block.estimatedKcal, 0),
  }
}

export { WARMUP_SLUGS, COOLDOWN_SLUGS }
