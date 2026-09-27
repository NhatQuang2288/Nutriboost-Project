import type { ActivityLevel, Goal } from '@nutriboost/nutrition'

import { MEAL_LABELS, type TodayView } from '@/lib/data/today'

/**
 * Dữ kiện đưa vào prompt chat.
 *
 * Bản đầu chỉ có bốn dòng (mục tiêu, đã nạp, còn lại, BMI), nên Bơ không biết người dùng là
 * nam hay nữ, đang muốn giảm hay tăng cân, sáng nay đã ăn gì, hay bây giờ là mấy giờ. Hỏi "tối
 * nay ăn gì" nhận về câu trả lời chung chung như cho một người lạ — đó là phần lớn cảm giác
 * "Bơ chưa thông minh".
 *
 * Mọi con số ở đây đều ĐÃ TÍNH SẴN bởi `@nutriboost/nutrition` qua `getTodayView`; model chỉ đọc.
 */

const GOAL_LABELS: Readonly<Record<Goal, string>> = {
  lose: 'giảm cân',
  maintain: 'giữ cân',
  gain: 'tăng cân',
}

const ACTIVITY_LABELS: Readonly<Record<ActivityLevel, string>> = {
  sedentary: 'ít vận động',
  light: 'vận động nhẹ',
  moderate: 'vận động vừa',
  active: 'vận động nhiều',
  very_active: 'vận động rất nhiều',
}

export interface ChatFactsClock {
  /** Nhãn thứ, ví dụ "thứ bảy". */
  weekday: string
  /** `HH:mm` theo giờ địa phương. */
  time: string
}

export function buildChatFacts(view: TodayView, clock: ChatFactsClock): string[] {
  const { profile, targets, consumed } = view

  const facts = [
    `Bây giờ: ${clock.weekday}, ${clock.time} (giờ Việt Nam), ngày ${view.localDate}`,
    `Hồ sơ: ${profile.sex === 'male' ? 'nam' : 'nữ'}, ${profile.age} tuổi, ` +
      `${profile.heightCm} cm, ${profile.weightKg} kg, ${ACTIVITY_LABELS[profile.activityLevel]}, ` +
      `mục tiêu ${GOAL_LABELS[profile.goal]}`,
    `BMI: ${view.bmi.bmi} (${view.bmi.label})`,
    `Mục tiêu mỗi ngày: ${targets.targetKcal} kcal · đạm ${targets.proteinG} g · ` +
      `tinh bột ${targets.carbG} g · béo ${targets.fatG} g`,
    `Đã nạp hôm nay: ${consumed.kcal} kcal · đạm ${consumed.proteinG} g · ` +
      `tinh bột ${consumed.carbG} g · béo ${consumed.fatG} g`,
    `Đã đốt khi tập hôm nay: ${view.kcalBurned} kcal`,
    `Còn lại hôm nay: ${view.remainingKcal} kcal`,
  ]

  if (view.meals.length === 0) {
    facts.push('Bữa đã ghi hôm nay: chưa có')
  } else {
    for (const meal of view.meals) {
      const items = meal.items.map((item) => `${item.nameVi} (${item.grams} g)`).join(', ')
      facts.push(
        `${MEAL_LABELS[meal.mealType]} lúc ${meal.timeLabel}: ${items} — ${meal.total.kcal} kcal`,
      )
    }
  }

  if (view.streakDays > 0) {
    facts.push(`Chuỗi ngày ghi liên tiếp: ${view.streakDays} ngày`)
  }

  if (view.source === 'demo') {
    // Hợp đồng "hai chế độ dữ liệu phải nói ra" trong CLAUDE.md: không được để model trình bày
    // hồ sơ mẫu như thể là của người dùng.
    facts.push(
      'LƯU Ý: đây là HỒ SƠ MẪU vì người dùng chưa đăng nhập hoặc chưa thiết lập hồ sơ. ' +
        'Khi nhắc tới số liệu cá nhân, nói rõ đó là số mẫu và mời họ thiết lập hồ sơ.',
    )
  }

  return facts
}
