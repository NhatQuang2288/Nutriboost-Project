/**
 * Danh mục bài tập.
 *
 * Cùng triết lý với danh mục món ăn: đây là **dữ liệu tham chiếu**, không phải thứ model
 * tự nghĩ ra. Nhờ vậy kcal đốt của buổi tập tính được bằng công thức, và model chỉ có
 * nhiệm vụ chọn bài và diễn giải.
 *
 * MET theo 2011 Compendium of Physical Activities — cùng nguồn với
 * `MET_VALUES` trong `@nutriboost/nutrition`, nên hai bên khớp nhau.
 */

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'glutes'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'mobility'
  | 'full_body'

export type Equipment =
  'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'band' | 'cardio_machine'

export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced'

/** Vùng cơ thể dễ gặp chấn thương — dùng để loại bài không phù hợp. */
export type InjuryArea = 'knee' | 'lower_back' | 'shoulder' | 'wrist' | 'ankle'

export type Measure = 'reps' | 'time'

export interface ExerciseRecord {
  slug: string
  nameVi: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  level: ExerciseLevel
  measure: Measure
  /** MET của bài, dùng để tính kcal đốt. */
  met: number
  /** Chấn thương cần tránh bài này. */
  contraindications?: readonly InjuryArea[]
  /** Hướng dẫn ngắn, một câu. */
  cue: string
}

const SOURCE = 'MET theo 2011 Compendium of Physical Activities'

export const EXERCISES: readonly ExerciseRecord[] = [
  // --- Thân dưới ---
  {
    slug: 'squat-bodyweight',
    nameVi: 'Squat không tạ',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    cue: 'Hạ hông như ngồi xuống ghế, đầu gối hướng theo mũi chân.',
  },
  {
    slug: 'squat-goblet',
    nameVi: 'Goblet squat',
    muscleGroup: 'legs',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    cue: 'Ôm tạ trước ngực, giữ thân trên thẳng.',
  },
  {
    slug: 'lunge',
    nameVi: 'Chùng chân (lunge)',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    contraindications: ['knee'],
    cue: 'Bước tới, hạ gối sau gần sàn rồi đẩy về.',
  },
  {
    slug: 'deadlift-romanian',
    nameVi: 'Romanian deadlift',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    level: 'intermediate',
    measure: 'reps',
    met: 6,
    contraindications: ['lower_back'],
    cue: 'Đẩy hông ra sau, giữ lưng thẳng, cảm nhận căng mặt sau đùi.',
  },
  {
    slug: 'hip-thrust',
    nameVi: 'Hip thrust',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    level: 'intermediate',
    measure: 'reps',
    met: 5,
    cue: 'Tựa lưng trên ghế, siết mông ở đỉnh rồi hạ chậm.',
  },
  {
    slug: 'calf-raise',
    nameVi: 'Nhón gót',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 3.5,
    cue: 'Lên hết cỡ rồi hạ chậm, không nảy.',
  },
  {
    slug: 'leg-press',
    nameVi: 'Đạp đùi máy',
    muscleGroup: 'legs',
    equipment: 'machine',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    cue: 'Không khoá khớp gối ở đỉnh.',
  },

  // --- Đẩy ---
  {
    slug: 'push-up',
    nameVi: 'Hít đất',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 4.3,
    contraindications: ['wrist', 'shoulder'],
    cue: 'Thân người thành một đường thẳng, khuỷu tay hơi khép.',
  },
  {
    slug: 'bench-press',
    nameVi: 'Đẩy ngực ghế ngang',
    muscleGroup: 'chest',
    equipment: 'barbell',
    level: 'intermediate',
    measure: 'reps',
    met: 5,
    contraindications: ['shoulder'],
    cue: 'Siết vai về sau, hạ tạ tới ngang ngực.',
  },
  {
    slug: 'dumbbell-shoulder-press',
    nameVi: 'Đẩy vai tạ đơn',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    contraindications: ['shoulder'],
    cue: 'Đẩy thẳng lên, không ưỡn lưng.',
  },
  {
    slug: 'lateral-raise',
    nameVi: 'Nâng vai ngang',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 4,
    cue: 'Nâng tới ngang vai, khuỷu hơi cong.',
  },
  {
    slug: 'triceps-dip',
    nameVi: 'Chống xà kép',
    muscleGroup: 'arms',
    equipment: 'bodyweight',
    level: 'intermediate',
    measure: 'reps',
    met: 5,
    contraindications: ['shoulder', 'wrist'],
    cue: 'Hạ tới khi khuỷu vuông góc rồi đẩy lên.',
  },

  // --- Kéo ---
  {
    slug: 'pull-up',
    nameVi: 'Hít xà',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    level: 'advanced',
    measure: 'reps',
    met: 8,
    contraindications: ['shoulder', 'wrist'],
    cue: 'Kéo bằng lưng, không đung đưa người.',
  },
  {
    slug: 'lat-pulldown',
    nameVi: 'Kéo xô máy',
    muscleGroup: 'back',
    equipment: 'machine',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    cue: 'Kéo thanh về ngực trên, siết xô ở cuối.',
  },
  {
    slug: 'seated-row',
    nameVi: 'Kéo cáp ngồi',
    muscleGroup: 'back',
    equipment: 'machine',
    level: 'beginner',
    measure: 'reps',
    met: 5,
    cue: 'Giữ lưng thẳng, kéo khuỷu ra sau.',
  },
  {
    slug: 'band-row',
    nameVi: 'Kéo dây kháng lực',
    muscleGroup: 'back',
    equipment: 'band',
    level: 'beginner',
    measure: 'reps',
    met: 4,
    cue: 'Siết bả vai lại với nhau ở cuối động tác.',
  },
  {
    slug: 'biceps-curl',
    nameVi: 'Cuốn tay trước',
    muscleGroup: 'arms',
    equipment: 'dumbbell',
    level: 'beginner',
    measure: 'reps',
    met: 3.5,
    cue: 'Giữ khuỷu cố định, không vung người.',
  },

  // --- Thân giữa ---
  {
    slug: 'plank',
    nameVi: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 3.5,
    cue: 'Siết bụng và mông, giữ hông không võng.',
  },
  {
    slug: 'dead-bug',
    nameVi: 'Dead bug',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'reps',
    met: 3,
    cue: 'Giữ lưng dưới áp sàn suốt động tác.',
  },
  {
    slug: 'russian-twist',
    nameVi: 'Xoay người kiểu Nga',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'intermediate',
    measure: 'reps',
    met: 4,
    contraindications: ['lower_back'],
    cue: 'Xoay từ thân trên, không kéo bằng tay.',
  },
  {
    slug: 'hanging-leg-raise',
    nameVi: 'Treo xà nâng chân',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    level: 'advanced',
    measure: 'reps',
    met: 5,
    contraindications: ['shoulder', 'lower_back'],
    cue: 'Nâng chân có kiểm soát, không đung đưa.',
  },

  // --- Tim mạch ---
  {
    slug: 'walking-brisk',
    nameVi: 'Đi bộ nhanh',
    muscleGroup: 'cardio',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 4.3,
    cue: 'Đi nhanh tới mức nói được nhưng không hát được.',
  },
  {
    slug: 'running',
    nameVi: 'Chạy bộ',
    muscleGroup: 'cardio',
    equipment: 'bodyweight',
    level: 'intermediate',
    measure: 'time',
    met: 9.8,
    contraindications: ['knee', 'ankle'],
    cue: 'Tiếp đất bằng giữa bàn chân, nhịp thở đều.',
  },
  {
    slug: 'cycling',
    nameVi: 'Đạp xe',
    muscleGroup: 'cardio',
    equipment: 'cardio_machine',
    level: 'beginner',
    measure: 'time',
    met: 7.5,
    cue: 'Giữ nhịp đều, điều chỉnh lực cản vừa sức.',
  },
  {
    slug: 'rowing',
    nameVi: 'Chèo thuyền máy',
    muscleGroup: 'full_body',
    equipment: 'cardio_machine',
    level: 'intermediate',
    measure: 'time',
    met: 7,
    contraindications: ['lower_back'],
    cue: 'Đẩy bằng chân trước, rồi mới kéo tay.',
  },
  {
    slug: 'jump-rope',
    nameVi: 'Nhảy dây',
    muscleGroup: 'cardio',
    equipment: 'bodyweight',
    level: 'intermediate',
    measure: 'time',
    met: 10,
    contraindications: ['knee', 'ankle'],
    cue: 'Nhảy thấp, tiếp đất nhẹ bằng mũi chân.',
  },
  {
    slug: 'burpee',
    nameVi: 'Burpee',
    muscleGroup: 'full_body',
    equipment: 'bodyweight',
    level: 'advanced',
    measure: 'time',
    met: 8,
    contraindications: ['knee', 'lower_back', 'wrist'],
    cue: 'Giữ nhịp đều, hạ xuống bằng tay chắc.',
  },
  {
    slug: 'mountain-climber',
    nameVi: 'Leo núi tại chỗ',
    muscleGroup: 'full_body',
    equipment: 'bodyweight',
    level: 'intermediate',
    measure: 'time',
    met: 8,
    contraindications: ['wrist'],
    cue: 'Hông giữ thấp, đổi chân nhanh.',
  },
  {
    slug: 'kettlebell-swing',
    nameVi: 'Vung tạ ấm',
    muscleGroup: 'full_body',
    equipment: 'dumbbell',
    level: 'intermediate',
    measure: 'reps',
    met: 9.8,
    contraindications: ['lower_back'],
    cue: 'Lực phát ra từ hông, tay chỉ giữ tạ.',
  },

  // --- Khởi động và giãn cơ ---
  {
    slug: 'arm-circle',
    nameVi: 'Xoay vai khởi động',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
    cue: 'Xoay chậm, tăng dần biên độ.',
  },
  {
    slug: 'cat-cow',
    nameVi: 'Mèo–bò giãn cột sống',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
    cue: 'Phối hợp hơi thở với chuyển động.',
  },
  {
    slug: 'hip-opener',
    nameVi: 'Giãn hông',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
    cue: 'Giữ 30 giây mỗi bên, không nảy.',
  },
  {
    slug: 'hamstring-stretch',
    nameVi: 'Giãn mặt sau đùi',
    muscleGroup: 'mobility',
    equipment: 'bodyweight',
    level: 'beginner',
    measure: 'time',
    met: 2.3,
    cue: 'Giữ thẳng lưng, gập từ hông.',
  },
]

export const EXERCISE_BY_SLUG: ReadonlyMap<string, ExerciseRecord> = new Map(
  EXERCISES.map((exercise) => [exercise.slug, exercise]),
)

export const EXERCISE_SOURCE = SOURCE
