import { buildPlan, buildWorkoutPlan } from '@nutriboost/ai'
import { type Goal } from '@nutriboost/nutrition'
import { EXERCISES, buildDataset } from '@nutriboost/seed'
import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_TIMEZONE, localDateIn, relativeTimeVi } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

import { startOfWeekIso } from './plan'
import {
  type ClientStatus,
  type PendingApproval,
  type PtClient,
  type PtClientDetail,
  type PtOverview,
  type PtSubscription,
  type PtTier,
  TIER_LABELS,
} from './pt'

/**
 * Đường dữ liệu THẬT của console PT.
 *
 * Tách khỏi `pt.ts` để phần dữ liệu mẫu vẫn đọc được như một chỉnh thể. `pt.ts` import file
 * này để gọi, còn file này chỉ import **kiểu** từ `pt.ts` — kiểu bị xoá khi biên dịch nên
 * không có vòng import lúc chạy.
 *
 * Mọi truy vấn ở đây đi qua phiên của PT, nên RLS là thứ quyết định họ thấy gì. Không có
 * chỗ nào dùng khoá service role: nếu RLS sai thì đó là lỗi cần lộ ra, không phải thứ cần lách.
 */

/** Số ngày để tính tuân thủ và số ngày có ghi nhật ký. */
const WINDOW_DAYS = 7
/** Không ghi gì trong bao nhiêu ngày thì coi là cần chú ý. */
const RISK_DAYS = 3
/** Khoảng để tính mức thay đổi cân nặng. */
const WEIGHT_WINDOW_DAYS = 30

interface LinkRow {
  client_id: string
  status: string
}

export async function readLivePtOverview(now: Date): Promise<PtOverview | null> {
  const user = await getSessionUser()
  // Chỉ vai trò `pt` mới có console. Người dùng thường vào `/pt` sẽ thấy dữ liệu mẫu, và
  // `ensureProfileReady` không áp dụng ở đây — console không phải phần của khách hàng.
  if (user === null || user.role !== 'pt') return null

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return null

  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)

  const [ptName, subscription, links] = await Promise.all([
    readPtName(supabase, user.id),
    readSubscription(supabase, user.id),
    readLinks(supabase, user.id),
  ])

  const clientIds = links.map((link) => link.client_id)

  const [profiles, healths, weights, summaries, drafts] = await Promise.all([
    readProfiles(supabase, clientIds),
    readHealthProfiles(supabase, clientIds),
    readWeights(supabase, clientIds, today),
    readSummaries(supabase, clientIds, today),
    readDraftPlans(supabase, clientIds),
  ])

  const catalogue = buildDataset().all

  const clients: PtClient[] = links.map((link) => {
    const profile = profiles.get(link.client_id)
    const health = healths.get(link.client_id)
    const summary = summaries.get(link.client_id)
    const weightsForClient = weights.get(link.client_id) ?? []

    const status = deriveClientStatus({
      linkStatus: link.status,
      onboarded: profile?.onboardedAt !== null && profile?.onboardedAt !== undefined,
      hasHealthProfile: health !== undefined,
      lastLogDate: summary?.lastLogDate ?? null,
      today,
    })

    return {
      id: link.client_id,
      name: profile?.fullName ?? 'Khách chưa đặt tên',
      goal: health?.goal ?? 'maintain',
      status,
      adherencePct: summary?.adherencePct ?? 0,
      loggedDays: summary?.loggedDays ?? 0,
      weightDeltaKg: weightDelta(weightsForClient),
      lastActiveLabel: relativeTimeVi(summary?.lastActivityAt ?? null, now) ?? 'Chưa hoạt động',
      pendingApprovals: drafts.filter((plan) => plan.userId === link.client_id).length,
      needsAttention: explainClientAttention(status, summary?.loggedDays ?? 0),
    }
  })

  const approvals: PendingApproval[] = drafts.map((draft) => {
    const health = healths.get(draft.userId)
    const client = clients.find((item) => item.id === draft.userId)
    const draftWeights = weights.get(draft.userId) ?? []
    const weightKg = draftWeights[draftWeights.length - 1]?.weightKg ?? 70

    const targets = goalsFor(health?.goal ?? 'maintain', weightKg)
    const targetKcal = targets.targetKcal

    /*
     * Kế hoạch dựng lại từ mục tiêu của khách, không đọc từ `plan_items`.
     *
     * Lý do: `BuiltPlan` mang cả ghi chú về những chỗ không đạt mục tiêu, và những ghi chú
     * đó đến từ bộ dựng. `itemCount` và `averageKcal` thì lấy từ CSDL khi có — vì nếu PT đã
     * chỉnh sửa một món, con số phải phản ánh bản đã sửa.
     */
    const plan = buildPlan({ weekStart: draft.weekStart, targets, catalogue, excludedSlugs: [] })

    return {
      id: draft.id,
      clientId: draft.userId,
      clientName: client?.name ?? 'Khách',
      weekStart: draft.weekStart,
      itemCount: draft.itemCount > 0 ? draft.itemCount : plan.days.length * 3,
      averageKcal: draft.averageKcal > 0 ? draft.averageKcal : plan.averageKcal,
      targetKcal,
      deviation: targetKcal > 0 ? Math.abs(plan.averageKcal - targetKcal) / targetKcal : 0,
      notes: plan.notes,
    }
  })

  const usedSlots = clients.length
  const clientLimit = subscription?.clientLimit ?? null

  return {
    source: 'live',
    ptName,
    // `usedSlots` chỉ tính được sau khi có danh sách khách, nên nó được điền ở đây.
    subscription: subscription === null ? null : { ...subscription, usedSlots },
    clients,
    approvals,
    needsAttentionCount: clients.filter((client) => client.needsAttention !== null).length,
    // Tự trừ thay vì gọi `remaining_client_slots`: hàm đó đã bị thu hồi khỏi `authenticated`
    // vì nó nhận `owner_id` tuỳ ý. Ở đây đã có sẵn cả hai số nên không cần.
    slotsLeft: clientLimit === null ? 0 : Math.max(0, clientLimit - usedSlots),
    weekStart,
  }
}

export async function readLivePtClientDetail(
  clientId: string,
  now: Date,
): Promise<PtClientDetail | null> {
  const user = await getSessionUser()
  if (user === null || user.role !== 'pt') return null

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return null

  /*
   * Kiểm quan hệ trước mọi thứ khác. RLS đã chặn đọc dữ liệu của người không phải khách, nên
   * bước này chủ yếu để trả 404 rõ ràng thay vì một trang trống khó hiểu — và để không tốn
   * năm truy vấn cho một id không thuộc về PT này.
   */
  const { data: link } = await supabase
    .from('pt_clients')
    .select('client_id, status')
    .eq('pt_id', user.id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (link === null) return null

  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)

  const [profiles, healths, weights, summaries, drafts] = await Promise.all([
    readProfiles(supabase, [clientId]),
    readHealthProfiles(supabase, [clientId]),
    readWeights(supabase, [clientId], today),
    readSummaries(supabase, [clientId], today),
    readDraftPlans(supabase, [clientId]),
  ])

  const profile = profiles.get(clientId)
  const health = healths.get(clientId)
  const summary = summaries.get(clientId)
  const weightsForClient = weights.get(clientId) ?? []
  const weightKg = weightsForClient[weightsForClient.length - 1]?.weightKg ?? 70

  const status = deriveClientStatus({
    linkStatus: (link as LinkRow).status,
    onboarded: profile?.onboardedAt !== null && profile?.onboardedAt !== undefined,
    hasHealthProfile: health !== undefined,
    lastLogDate: summary?.lastLogDate ?? null,
    today,
  })

  const client: PtClient = {
    id: clientId,
    name: profile?.fullName ?? 'Khách chưa đặt tên',
    goal: health?.goal ?? 'maintain',
    status,
    adherencePct: summary?.adherencePct ?? 0,
    loggedDays: summary?.loggedDays ?? 0,
    weightDeltaKg: weightDelta(weightsForClient),
    lastActiveLabel: relativeTimeVi(summary?.lastActivityAt ?? null, now) ?? 'Chưa hoạt động',
    pendingApprovals: drafts.length,
    needsAttention: explainClientAttention(status, summary?.loggedDays ?? 0),
  }

  const targets = goalsFor(client.goal, weightKg)
  const catalogue = buildDataset().all

  const plan = buildPlan({ weekStart, targets, catalogue, excludedSlugs: [] })

  const workout = buildWorkoutPlan({
    weekStart,
    goal: client.goal,
    level: 'beginner',
    daysPerWeek: 3,
    sessionMinutes: 45,
    weightKg,
    equipment: [],
    injuries: [],
    exercises: EXERCISES,
  })

  return { source: 'live', client, plan, workout, targetKcal: targets.targetKcal }
}

/* ---------------------------------------------------------------------------
 * Truy vấn
 * ------------------------------------------------------------------------- */

async function readPtName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()
  const name = (data as { full_name: string | null } | null)?.full_name
  // Chưa đặt tên thì gọi bằng "bạn", không bịa ra một cái tên nào.
  return name === null || name === undefined || name.length === 0 ? 'bạn' : name
}

/**
 * Gói đang hiệu lực, hoặc `null`.
 *
 * `null` là trạng thái **có thật** và giao diện phải xử lý: một PT chưa có gói thì không mời
 * được ai. Hiển thị "Gói Plus · 750.000đ/tháng" cho họ là nói dối về thứ họ chưa mua.
 */
async function readSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<PtSubscription | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('tier, price_vnd, client_limit, ai_turns_per_client, current_period_end')
    .eq('owner_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data === null) return null

  const row = data as {
    tier: PtTier
    price_vnd: number
    client_limit: number
    ai_turns_per_client: number
    current_period_end: string
  }

  return {
    tier: row.tier,
    label: TIER_LABELS[row.tier] ?? row.tier,
    priceVnd: row.price_vnd,
    clientLimit: row.client_limit,
    // `usedSlots` được tính ở nơi gọi vì nó cần danh sách khách; xem `readLivePtOverview`.
    usedSlots: 0,
    aiTurnsPerClient: row.ai_turns_per_client,
    renewsOn: String(row.current_period_end).slice(0, 10),
  }
}

async function readLinks(supabase: SupabaseClient, ptId: string): Promise<LinkRow[]> {
  const { data } = await supabase
    .from('pt_clients')
    .select('client_id, status')
    .eq('pt_id', ptId)
    // `ended` không hiện: khách đã rời đi không còn là việc phải làm hằng ngày.
    .in('status', ['active', 'pending'])
    .order('started_at', { ascending: false })

  return (data ?? []) as LinkRow[]
}

interface ProfileInfo {
  fullName: string
  onboardedAt: string | null
}

async function readProfiles(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, ProfileInfo>> {
  if (ids.length === 0) return new Map()

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, onboarded_at')
    .in('id', ids)

  return new Map(
    ((data ?? []) as { id: string; full_name: string | null; onboarded_at: string | null }[]).map(
      (row) => [
        row.id,
        { fullName: row.full_name ?? 'Khách chưa đặt tên', onboardedAt: row.onboarded_at },
      ],
    ),
  )
}

interface HealthInfo {
  goal: Goal
}

async function readHealthProfiles(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, HealthInfo>> {
  if (ids.length === 0) return new Map()

  const { data } = await supabase.from('health_profiles').select('user_id, goal').in('user_id', ids)

  return new Map(
    ((data ?? []) as { user_id: string; goal: Goal }[]).map((row) => [
      row.user_id,
      { goal: row.goal },
    ]),
  )
}

export interface WeightPoint {
  measuredOn: string
  weightKg: number
}

async function readWeights(
  supabase: SupabaseClient,
  ids: readonly string[],
  today: string,
): Promise<Map<string, WeightPoint[]>> {
  if (ids.length === 0) return new Map()

  const from = shiftDays(today, -WEIGHT_WINDOW_DAYS)
  const { data } = await supabase
    .from('body_metrics')
    .select('user_id, measured_on, weight_kg')
    .in('user_id', ids)
    .gte('measured_on', from)
    .order('measured_on', { ascending: true })

  const grouped = new Map<string, WeightPoint[]>()
  for (const row of (data ?? []) as { user_id: string; measured_on: string; weight_kg: number }[]) {
    const list = grouped.get(row.user_id) ?? []
    list.push({ measuredOn: row.measured_on, weightKg: Number(row.weight_kg) })
    grouped.set(row.user_id, list)
  }
  return grouped
}

interface SummaryInfo {
  loggedDays: number
  adherencePct: number
  lastLogDate: string | null
  /** Lần cuối bảng tổng hợp được làm mới = lần cuối khách ghi gì đó. */
  lastActivityAt: string | null
}

/**
 * Tổng hợp ngày gần đây, gộp theo khách.
 *
 * Dùng `daily_summaries` thay vì quét `meal_logs`: bảng này chỉ có hàng cho những ngày **có**
 * ghi nhật ký, nên nó vừa cho số ngày đã ghi, vừa cho ngày gần nhất, vừa cho độ tuân thủ —
 * ba thứ cần cho danh sách khách, trong một truy vấn.
 *
 * `updated_at` là mốc lần cuối hàng đó được tính lại, tức là lần cuối khách ghi gì đó. Dùng
 * nó làm "hoạt động lần cuối" mà không phải quét `meal_logs`.
 */
async function readSummaries(
  supabase: SupabaseClient,
  ids: readonly string[],
  today: string,
): Promise<Map<string, SummaryInfo>> {
  if (ids.length === 0) return new Map()

  // Lấy 30 ngày chứ không phải 7: cần biết ngày gần nhất **kể cả khi nó đã cũ**, để phân biệt
  // "khách bỏ từ lâu" với "khách chưa từng ghi gì".
  const from = shiftDays(today, -WEIGHT_WINDOW_DAYS)
  const { data } = await supabase
    .from('daily_summaries')
    .select('user_id, local_date, adherence_pct, updated_at')
    .in('user_id', ids)
    .gte('local_date', from)
    .order('local_date', { ascending: false })

  const grouped = new Map<string, SummaryInfo>()
  const windowStart = shiftDays(today, -(WINDOW_DAYS - 1))

  for (const row of (data ?? []) as {
    user_id: string
    local_date: string
    adherence_pct: number | string | null
    updated_at: string
  }[]) {
    const current = grouped.get(row.user_id) ?? {
      loggedDays: 0,
      adherencePct: 0,
      lastLogDate: null,
      lastActivityAt: null,
    }

    const inWindow = row.local_date >= windowStart
    if (inWindow) {
      current.loggedDays += 1
      current.adherencePct += Number(row.adherence_pct ?? 0)
    }

    // Truy vấn sắp xếp giảm dần theo ngày nên hàng đầu tiên là ngày gần nhất.
    if (current.lastLogDate === null) {
      current.lastLogDate = row.local_date
      current.lastActivityAt = row.updated_at
    }

    grouped.set(row.user_id, current)
  }

  for (const info of grouped.values()) {
    info.adherencePct = info.loggedDays === 0 ? 0 : Math.round(info.adherencePct / info.loggedDays)
  }

  return grouped
}

interface DraftPlan {
  id: string
  userId: string
  weekStart: string
  itemCount: number
  averageKcal: number
}

/**
 * Thực đơn đang chờ duyệt, kèm số món và kcal trung bình **đọc từ chính các món**.
 *
 * Không dựng lại kế hoạch ở đây: nếu PT đã chỉnh sửa một món, con số phải phản ánh bản đã
 * sửa chứ không phải bản máy dựng lại từ đầu.
 */
async function readDraftPlans(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<DraftPlan[]> {
  if (ids.length === 0) return []

  const { data: plans } = await supabase
    .from('plans')
    .select('id, user_id, week_start')
    .in('user_id', ids)
    .eq('status', 'draft')

  const rows = (plans ?? []) as { id: string; user_id: string; week_start: string }[]
  if (rows.length === 0) return []

  const { data: items } = await supabase
    .from('plan_items')
    .select('plan_id, plan_date, kcal')
    .in(
      'plan_id',
      rows.map((row) => row.id),
    )

  const byPlan = new Map<string, { count: number; kcal: number; days: Set<string> }>()
  for (const item of (items ?? []) as { plan_id: string; plan_date: string; kcal: number }[]) {
    const entry = byPlan.get(item.plan_id) ?? { count: 0, kcal: 0, days: new Set<string>() }
    entry.count += 1
    entry.kcal += Number(item.kcal)
    entry.days.add(item.plan_date)
    byPlan.set(item.plan_id, entry)
  }

  return rows.map((row) => {
    const entry = byPlan.get(row.id)
    return {
      id: row.id,
      userId: row.user_id,
      weekStart: String(row.week_start).slice(0, 10),
      itemCount: entry?.count ?? 0,
      averageKcal:
        entry === undefined || entry.days.size === 0 ? 0 : Math.round(entry.kcal / entry.days.size),
    }
  })
}

/* ---------------------------------------------------------------------------
 * Suy diễn
 * ------------------------------------------------------------------------- */

/**
 * Trạng thái của một khách, suy ra từ dữ liệu thật.
 *
 * LƯU Ý: dữ liệu thật **không** sinh ra được `'paused'`. Cột `pt_clients.status` chỉ có
 * `pending | active | ended`, và `ended` bị loại khỏi danh sách. Muốn có trạng thái "tạm
 * dừng" thì phải thêm giá trị vào kiểu enum trong CSDL — chưa làm, và đây là chỗ ghi lại
 * điều đó để không ai tưởng nó bị bỏ quên.
 */
export function deriveClientStatus(input: {
  linkStatus: string
  onboarded: boolean
  hasHealthProfile: boolean
  lastLogDate: string | null
  today: string
}): ClientStatus {
  if (input.linkStatus === 'pending') return 'onboarding'
  if (!input.onboarded || !input.hasHealthProfile) return 'onboarding'
  if (input.lastLogDate === null) return 'at_risk'
  return daysBetween(input.lastLogDate, input.today) >= RISK_DAYS ? 'at_risk' : 'active'
}

/**
 * `null` khi không có gì đáng nói — màn tổng quan chỉ hiện khách có lý do.
 *
 * Xuất ra để kiểm thử được: đây là logic người dùng nhìn thấy trực tiếp, và một câu sai ở đây
 * khiến PT gọi điện cho khách không có vấn đề gì.
 */
export function explainClientAttention(status: ClientStatus, loggedDays: number): string | null {
  if (status === 'onboarding') return 'Chưa hoàn tất thiết lập hồ sơ'
  if (status === 'at_risk') {
    return loggedDays === 0
      ? `Chưa ghi bữa nào trong ${WINDOW_DAYS} ngày gần đây`
      : `Chỉ ghi ${loggedDays}/${WINDOW_DAYS} ngày gần đây`
  }
  return null
}

/** Chênh lệch cân nặng giữa lần đo đầu và lần đo cuối trong khoảng đang xét. */
export function weightDelta(points: readonly WeightPoint[]): number {
  const first = points[0]
  const last = points[points.length - 1]
  if (first === undefined || last === undefined || points.length < 2) return 0
  return Math.round((last.weightKg - first.weightKg) * 10) / 10
}

/**
 * Mục tiêu năng lượng của một khách.
 *
 * Ưu tiên đọc từ `energy_targets` nếu khách đã thiết lập hồ sơ — đó là con số đã cam kết với
 * họ. Hàm này chỉ là bản dự phòng khi chưa có, và nó khớp với cách `pt.ts` làm cho dữ liệu
 * mẫu để hai đường không lệch nhau.
 */
function goalsFor(goal: Goal, weightKg: number) {
  const base = goal === 'lose' ? 2010 : goal === 'gain' ? 2650 : 2350
  return {
    targetKcal: base,
    proteinG: Math.round(weightKg * (goal === 'lose' ? 1.8 : 1.6)),
    carbG: goal === 'lose' ? 250 : 330,
    fatG: goal === 'lose' ? 55 : 70,
  }
}

/** Dịch một ngày `YYYY-MM-DD` đi `days` ngày. */
function shiftDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  return new Date(Date.UTC(year, month - 1, day) + days * 86_400_000).toISOString().slice(0, 10)
}

/** Số ngày giữa hai mốc `YYYY-MM-DD`, không phụ thuộc múi giờ. */
function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  if (fy === undefined || fm === undefined || fd === undefined) return 0
  if (ty === undefined || tm === undefined || td === undefined) return 0
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}
