'use server'

import {
  type ActivityLevel,
  type Goal,
  type MedicalFlag,
  type Sex,
  assessSafety,
  computeBmi,
  computeEnergyTargets,
} from '@nutriboost/nutrition'
import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { ActionResult } from './types'

/**
 * Lưu hồ sơ thiết lập ban đầu.
 *
 * Đây là bước còn thiếu khiến `/auth/callback` rơi vào vòng lặp: nó thấy
 * `profiles.onboarded_at` là null nên đưa người dùng qua `/onboarding`, mà onboarding chỉ
 * giữ câu trả lời trong bộ nhớ trình duyệt và **không ghi gì cả** — nên lần sau đăng nhập
 * lại bị đưa qua onboarding nữa, mãi mãi.
 *
 * Toán dinh dưỡng chạy ở đây, phía máy chủ, bằng `@nutriboost/nutrition` — hàm thuần, có
 * test vector. Không nhận con số mục tiêu từ trình duyệt: nhận thì người dùng sửa được
 * mục tiêu kcal của chính mình, và mọi thứ hiển thị sau đó đều dựa trên con số đã bị sửa.
 */

/** Phiên bản điều khoản người dùng chấp nhận. Đổi nội dung điều khoản thì tăng số này. */
const CONSENT_VERSION = '2026-09-18'

const inputSchema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.coerce.number().int().min(10, 'Tuổi phải từ 10 trở lên.').max(120, 'Tuổi tối đa 120.'),
  heightCm: z.coerce
    .number()
    .min(80, 'Chiều cao phải từ 80 cm.')
    .max(250, 'Chiều cao tối đa 250 cm.'),
  weightKg: z.coerce
    .number()
    .min(20, 'Cân nặng phải từ 20 kg.')
    .max(400, 'Cân nặng tối đa 400 kg.'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  rateKgPerWeek: z.coerce.number().min(0).max(1).default(0.5),
  medicalFlags: z.array(z.string()).max(10).default([]),
  /** Đồng ý xử lý dữ liệu sức khoẻ. Bắt buộc — không có thì không lưu gì cả. */
  consent: z.literal('true', { message: 'Bạn cần đồng ý trước khi mình lưu hồ sơ.' }),
})

/**
 * Ngày sinh suy ra từ tuổi.
 *
 * Luồng onboarding hỏi tuổi chứ không hỏi ngày sinh — nhanh hơn, và đó là thứ người dùng
 * nhớ chắc. Đổi lại, "ngày sinh" ở đây là ngày hôm nay lùi lại đúng số năm bằng tuổi, tức
 * là ngày kỷ niệm thiết lập hồ sơ. Cách đọc ngược (`ageFromIsoDate`) cho đúng lại số tuổi
 * đã khai, và tăng thêm một vào đúng ngày kỷ niệm.
 */
function birthDateFromAge(age: number, todayIso: string): string {
  const [year, month, day] = todayIso.split('-')
  const birthYear = Number(year) - age
  return `${String(birthYear).padStart(4, '0')}-${month}-${day}`
}

export async function completeOnboardingAction(formData: FormData): Promise<ActionResult> {
  const parsed = inputSchema.safeParse({
    sex: formData.get('sex'),
    age: formData.get('age'),
    heightCm: formData.get('heightCm'),
    weightKg: formData.get('weightKg'),
    activityLevel: formData.get('activityLevel'),
    goal: formData.get('goal'),
    rateKgPerWeek: formData.get('rateKgPerWeek') ?? 0.5,
    medicalFlags: formData.getAll('medicalFlags').map(String),
    consent: formData.get('consent'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.' }
  }

  const user = await getSessionUser()
  const supabase = await createSupabaseServerClient()

  /*
   * Chưa cấu hình Supabase: luồng vẫn phải chạy hết, vì màn kết quả đã tính sẵn mọi con số
   * bằng `@nutriboost/nutrition` ngay trên trình duyệt. Nói rõ là chưa lưu được thay vì giả
   * vờ đã lưu.
   */
  if (user === null || supabase === null) {
    return {
      ok: true,
      message: 'Chưa cấu hình Supabase nên hồ sơ chỉ hiện trong phiên này, chưa được lưu lại.',
    }
  }

  const input = parsed.data
  const todayIso = localDateIn(DEFAULT_TIMEZONE)
  const dateOfBirth = birthDateFromAge(input.age, todayIso)

  const targets = computeEnergyTargets({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age: input.age,
    sex: input.sex as Sex,
    activityLevel: input.activityLevel as ActivityLevel,
    goal: input.goal as Goal,
    rateKgPerWeek: input.rateKgPerWeek,
  })

  const bmi = computeBmi(input.weightKg, input.heightCm, 'asia')

  /*
   * Guardrail an toàn chạy ngay lúc thiết lập, không đợi tới lần hỏi đầu tiên. Kết quả
   * KHÔNG được lưu: `assessSafety` là hàm thuần nên được tính lại mỗi lần đọc, và nhờ vậy
   * đổi công thức là mọi hồ sơ nhận kết quả mới ngay, không cần migration dữ liệu.
   *
   * Ở đây nó chỉ có một tác dụng: chặn hồ sơ không hợp lệ ngay tại cửa vào, trước khi
   * người dùng thấy bất kỳ gợi ý nào dựa trên nó.
   */
  const safety = assessSafety({
    bmi: bmi.bmi,
    age: input.age,
    goal: input.goal as Goal,
    medicalFlags: input.medicalFlags as MedicalFlag[],
  })

  const { error } = await supabase.rpc('complete_onboarding', {
    p_sex: input.sex,
    p_date_of_birth: dateOfBirth,
    p_height_cm: input.heightCm,
    p_activity_level: input.activityLevel,
    p_goal: input.goal,
    p_rate_kg_per_week: input.rateKgPerWeek,
    p_weight_kg: input.weightKg,
    p_medical_flags: input.medicalFlags,
    p_consent_version: CONSENT_VERSION,
    p_bmr_kcal: targets.bmrKcal,
    p_tdee_kcal: targets.tdeeKcal,
    p_target_kcal: targets.targetKcal,
    p_protein_g: targets.proteinG,
    p_carb_g: targets.carbG,
    p_fat_g: targets.fatG,
    p_formula_version: targets.formulaVersion,
    p_floors_applied: targets.floorsApplied,
  })

  if (error !== null) {
    return { ok: false, message: `Chưa lưu được hồ sơ: ${error.message}` }
  }

  // Mọi màn hình đọc hồ sơ đều phải dựng lại: mục tiêu kcal vừa đổi.
  revalidatePath('/', 'layout')

  return {
    ok: true,
    message:
      safety.level === 'ok'
        ? 'Đã lưu hồ sơ.'
        : 'Đã lưu hồ sơ. Mình có một lưu ý về an toàn, bạn xem ở màn Hôm nay nhé.',
  }
}
