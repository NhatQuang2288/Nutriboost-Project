import { type Goal } from '@nutriboost/nutrition'
import { buildPlan, buildWorkoutPlan, type BuiltPlan, type BuiltWorkoutPlan } from '@nutriboost/ai'
import { EXERCISES, buildDataset } from '@nutriboost/seed'

import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'

import { startOfWeekIso } from './plan'

/**
 * Lớp dữ liệu của console PT.
 *
 * HIỆN ĐỌC TỪ DỮ LIỆU MẪU — chủ ý, giống phần còn lại của Release 1. Khi nối Supabase,
 * các hàm ở đây chỉ đổi phần đọc dữ liệu; phần tính toán vẫn đi qua `@nutriboost/ai`
 * và `@nutriboost/nutrition`.
 *
 * Điểm đáng chú ý về nghiệp vụ: gói dịch vụ quyết định **số khách tối đa** và **số lượt AI
 * mỗi khách**. Cả hai đều hiển thị được cho PT, vì đó là thứ họ đang trả tiền.
 */

export type ClientStatus = 'onboarding' | 'active' | 'at_risk' | 'paused'

export const CLIENT_STATUS_LABELS: Readonly<Record<ClientStatus, string>> = {
  onboarding: 'Đang thiết lập',
  active: 'Đang theo',
  at_risk: 'Cần chú ý',
  paused: 'Tạm dừng',
}

export type PtTier = 'trial' | 'plus' | 'premium' | 'diamond'

export interface PtSubscription {
  tier: PtTier
  label: string
  priceVnd: number
  clientLimit: number
  usedSlots: number
  /** Số lượt gọi AI đi kèm mỗi khách mỗi tháng. */
  aiTurnsPerClient: number
  renewsOn: string
}

export interface PtClient {
  id: string
  name: string
  goal: Goal
  status: ClientStatus
  /** Tỉ lệ ngày đạt mục tiêu năng lượng trong 7 ngày qua. */
  adherencePct: number
  /** Số ngày có ghi nhật ký trong 7 ngày qua. */
  loggedDays: number
  weightDeltaKg: number
  lastActiveLabel: string
  /** Số thực đơn đang chờ PT duyệt. */
  pendingApprovals: number
  /** Lý do cần chú ý, `null` nếu không có gì. */
  needsAttention: string | null
}

export interface PendingApproval {
  id: string
  clientId: string
  clientName: string
  weekStart: string
  itemCount: number
  averageKcal: number
  targetKcal: number
  /** Chênh lệch so với mục tiêu, tính theo tỉ lệ. */
  deviation: number
  notes: readonly string[]
}

export interface PtOverview {
  ptName: string
  subscription: PtSubscription
  clients: readonly PtClient[]
  approvals: readonly PendingApproval[]
  /** Số khách đang cần chú ý. */
  needsAttentionCount: number
  /** Số khách đã dùng hết hạn mức. */
  slotsLeft: number
  weekStart: string
}

export interface PtClientDetail {
  client: PtClient
  plan: BuiltPlan
  workout: BuiltWorkoutPlan
  targetKcal: number
}

/**
 * Nhãn tiếng Việt của ba gói. Xuất ra ngoài để màn mã mời dùng chung — hai bảng nhãn cho
 * cùng một khái niệm là cách chắc chắn nhất để chúng lệch nhau.
 */
export const TIER_LABELS: Readonly<Record<PtTier, string>> = {
  trial: 'Dùng thử',
  plus: 'Plus',
  premium: 'Premium',
  diamond: 'Diamond',
}

/** Giá và hạn mức theo bảng giá hiện hành. Xem docs/PRICING.md. */
const TIER_CONFIG: Readonly<Record<PtTier, { priceVnd: number; clientLimit: number }>> = {
  trial: { priceVnd: 0, clientLimit: 2 },
  plus: { priceVnd: 750_000, clientLimit: 5 },
  premium: { priceVnd: 1_125_000, clientLimit: 10 },
  diamond: { priceVnd: 1_800_000, clientLimit: 20 },
}

const PT_NAME = 'Coach Linh'
const CURRENT_TIER: PtTier = 'plus'

/** Hồ sơ mẫu của 5 khách hàng — đúng bằng hạn mức gói Plus. */
const CLIENTS: readonly PtClient[] = [
  {
    id: 'minh',
    name: 'Nguyễn Minh',
    goal: 'lose',
    status: 'active',
    adherencePct: 86,
    loggedDays: 6,
    weightDeltaKg: -1.4,
    lastActiveLabel: '2 giờ trước',
    pendingApprovals: 0,
    needsAttention: null,
  },
  {
    id: 'huong',
    name: 'Trần Hương',
    goal: 'lose',
    status: 'at_risk',
    adherencePct: 41,
    loggedDays: 2,
    weightDeltaKg: 0.3,
    lastActiveLabel: '3 ngày trước',
    pendingApprovals: 1,
    needsAttention: 'Chỉ ghi 2/7 ngày và đang tăng cân nhẹ',
  },
  {
    id: 'tuan',
    name: 'Lê Tuấn',
    goal: 'gain',
    status: 'active',
    adherencePct: 92,
    loggedDays: 7,
    weightDeltaKg: 0.8,
    lastActiveLabel: 'Hôm nay',
    pendingApprovals: 1,
    needsAttention: null,
  },
  {
    id: 'ngoc',
    name: 'Phạm Ngọc',
    goal: 'maintain',
    status: 'onboarding',
    adherencePct: 0,
    loggedDays: 0,
    weightDeltaKg: 0,
    lastActiveLabel: 'Chưa bắt đầu',
    pendingApprovals: 0,
    needsAttention: 'Chưa hoàn tất thiết lập hồ sơ',
  },
  {
    id: 'dung',
    name: 'Vũ Dũng',
    goal: 'lose',
    status: 'paused',
    adherencePct: 12,
    loggedDays: 1,
    weightDeltaKg: 0,
    lastActiveLabel: '12 ngày trước',
    pendingApprovals: 0,
    needsAttention: 'Đang tạm dừng theo yêu cầu',
  },
]

function goalsFor(goal: Goal, weightKg: number) {
  // Mục tiêu năng lượng tính từ lõi tất định; đây là dữ liệu mẫu nên dùng hồ sơ giả định.
  const base = goal === 'lose' ? 2010 : goal === 'gain' ? 2650 : 2350
  return {
    targetKcal: base,
    proteinG: Math.round(weightKg * (goal === 'lose' ? 1.8 : 1.6)),
    carbG: goal === 'lose' ? 250 : 330,
    fatG: goal === 'lose' ? 55 : 70,
  }
}

const CLIENT_WEIGHTS: Readonly<Record<string, number>> = {
  minh: 74,
  huong: 58,
  tuan: 62,
  ngoc: 55,
  dung: 80,
}

export function getPtOverview(now: Date = new Date()): PtOverview {
  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)
  const config = TIER_CONFIG[CURRENT_TIER]
  const catalogue = buildDataset().all

  const approvals: PendingApproval[] = []

  for (const client of CLIENTS) {
    if (client.pendingApprovals === 0) continue

    const targets = goalsFor(client.goal, CLIENT_WEIGHTS[client.id] ?? 70)
    const plan = buildPlan({
      weekStart,
      targets: {
        targetKcal: targets.targetKcal,
        proteinG: targets.proteinG,
        carbG: targets.carbG,
        fatG: targets.fatG,
      },
      catalogue,
    })

    approvals.push({
      id: `plan-${client.id}-${weekStart}`,
      clientId: client.id,
      clientName: client.name,
      weekStart,
      itemCount: plan.days.reduce((sum, day) => sum + day.meals.length, 0),
      averageKcal: plan.averageKcal,
      targetKcal: targets.targetKcal,
      deviation:
        targets.targetKcal > 0
          ? Math.abs(plan.averageKcal - targets.targetKcal) / targets.targetKcal
          : 0,
      notes: plan.notes,
    })
  }

  const usedSlots = CLIENTS.filter((client) => client.status !== 'paused').length
  const renews = new Date(
    Date.UTC(Number(weekStart.slice(0, 4)), Number(weekStart.slice(5, 7)), 1) + 30 * 86_400_000,
  )

  return {
    ptName: PT_NAME,
    subscription: {
      tier: CURRENT_TIER,
      label: TIER_LABELS[CURRENT_TIER],
      priceVnd: config.priceVnd,
      clientLimit: config.clientLimit,
      usedSlots,
      aiTurnsPerClient: 600,
      renewsOn: renews.toISOString().slice(0, 10),
    },
    clients: CLIENTS,
    approvals,
    needsAttentionCount: CLIENTS.filter((client) => client.needsAttention !== null).length,
    slotsLeft: Math.max(0, config.clientLimit - usedSlots),
    weekStart,
  }
}

export function getPtClientDetail(clientId: string, now: Date = new Date()): PtClientDetail | null {
  const client = CLIENTS.find((item) => item.id === clientId)
  if (client === undefined) return null

  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)
  const weightKg = CLIENT_WEIGHTS[client.id] ?? 70
  const targets = goalsFor(client.goal, weightKg)

  const plan = buildPlan({
    weekStart,
    targets: {
      targetKcal: targets.targetKcal,
      proteinG: targets.proteinG,
      carbG: targets.carbG,
      fatG: targets.fatG,
    },
    catalogue: buildDataset().all,
  })

  const workout = buildWorkoutPlan({
    weekStart,
    goal: client.goal,
    level: 'beginner',
    daysPerWeek: 3,
    sessionMinutes: 45,
    weightKg,
    exercises: EXERCISES,
  })

  return { client, plan, workout, targetKcal: targets.targetKcal }
}

/** Danh sách gói để hiển thị ở tab Gói dịch vụ. */
export interface TierOffer {
  tier: PtTier
  label: string
  priceVnd: number
  clientLimit: number
  pricePerClient: number
  aiTurnsPerClient: number
  current: boolean
}

export function getTierOffers(): TierOffer[] {
  return (['plus', 'premium', 'diamond'] as const).map((tier) => {
    const config = TIER_CONFIG[tier]
    return {
      tier,
      label: TIER_LABELS[tier],
      priceVnd: config.priceVnd,
      clientLimit: config.clientLimit,
      pricePerClient: Math.round(config.priceVnd / config.clientLimit),
      aiTurnsPerClient: 600,
      current: tier === CURRENT_TIER,
    }
  })
}

export function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`
}
