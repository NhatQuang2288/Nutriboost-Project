import { z } from 'zod'

/**
 * Schema dùng chung cho cả server, client và định nghĩa tool của AI.
 * Một nguồn duy nhất — tránh tình trạng mỗi tầng kiểm tra một kiểu.
 */

export const sexSchema = z.enum(['male', 'female'])

export const activityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
])

export const goalSchema = z.enum(['lose', 'maintain', 'gain'])

export const bmiStandardSchema = z.enum(['who', 'asia'])

export const activityCodeSchema = z.enum([
  'walking',
  'brisk_walking',
  'running',
  'cycling',
  'swimming',
  'strength',
  'yoga',
  'badminton',
  'football',
  'housework',
])

export const medicalFlagSchema = z.enum([
  'diabetes',
  'hypertension',
  'heart_disease',
  'kidney_disease',
  'liver_disease',
  'pregnancy',
  'breastfeeding',
  'eating_disorder',
  'gout',
  'thyroid',
])

export const bodyInputSchema = z.object({
  weightKg: z.number().positive().max(400),
  heightCm: z.number().positive().min(80).max(250),
  age: z.number().int().positive().max(120),
  sex: sexSchema,
})

export const energyInputSchema = bodyInputSchema.extend({
  activityLevel: activityLevelSchema,
  goal: goalSchema,
  rateKgPerWeek: z.number().min(0).max(1).optional(),
})

export const foodNutrientsPer100gSchema = z.object({
  kcal: z.number().min(0).max(1000),
  proteinG: z.number().min(0).max(100),
  carbG: z.number().min(0).max(100),
  fatG: z.number().min(0).max(100),
  fiberG: z.number().min(0).max(100).optional(),
  sugarG: z.number().min(0).max(100).optional(),
  sodiumMg: z.number().min(0).max(50000).optional(),
})

export const safetyInputSchema = z.object({
  bmi: z.number().positive().max(100),
  age: z.number().int().positive().max(120),
  goal: goalSchema,
  medicalFlags: z.array(medicalFlagSchema).max(10),
})

export type BodyInputSchema = z.infer<typeof bodyInputSchema>
export type EnergyInputSchema = z.infer<typeof energyInputSchema>
export type ActivityCodeSchema = z.infer<typeof activityCodeSchema>
export type MedicalFlagSchema = z.infer<typeof medicalFlagSchema>
