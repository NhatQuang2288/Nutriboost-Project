import { formatIsoDate } from '@/lib/date'
import { createSupabaseServerClient, getSessionUser } from '@/lib/supabase/server'

/**
 * Lớp dữ liệu cho màn `/tien-do`.
 *
 * Trước đây màn này chỉ có `EmptyState` cộng hai khối `Skeleton` — không có biểu đồ nào cả,
 * kể cả khi đã có dữ liệu. Đây là hạng mục "biểu đồ" của TV5 trong bảng phân công.
 */

/** Cùng hình dạng với `ChartPoint` của thành phần biểu đồ. */
export interface ProgressPoint {
  label: string
  value: number
}

export interface ProgressView {
  /** `demo` = chưa có dữ liệu thật. Giao diện phải nói rõ. */
  source: 'demo' | 'live'
  weights: ProgressPoint[]
  kcal: ProgressPoint[]
  targetKcal: number | null
}

const WEIGHT_DAYS = 30
const KCAL_DAYS = 14

export async function getProgressView(): Promise<ProgressView> {
  const user = await getSessionUser()
  if (user === null) return emptyView()

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return emptyView()

  const [weights, kcal, targetKcal] = await Promise.all([
    readWeights(supabase, user.id),
    readKcal(supabase, user.id),
    readTargetKcal(supabase, user.id),
  ])

  return { source: 'live', weights, kcal, targetKcal }
}

function emptyView(): ProgressView {
  return { source: 'demo', weights: [], kcal: [], targetKcal: null }
}

/**
 * Cân nặng theo thời gian.
 *
 * Lấy mới nhất trước rồi đảo lại: `limit` phải cắt đúng số lần đo **gần đây nhất**, còn biểu
 * đồ cần thứ tự thời gian tăng dần.
 */
async function readWeights(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
): Promise<ProgressPoint[]> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('measured_on, weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(WEIGHT_DAYS)

  if (error !== null) return []

  return ((data ?? []) as { measured_on: string; weight_kg: number | string }[])
    .slice()
    .reverse()
    .map((row) => ({
      label: formatIsoDate(row.measured_on),
      value: Number(row.weight_kg),
    }))
}

async function readKcal(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
): Promise<ProgressPoint[]> {
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('local_date, kcal_in')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(KCAL_DAYS)

  if (error !== null) return []

  return ((data ?? []) as { local_date: string; kcal_in: number }[])
    .slice()
    .reverse()
    .map((row) => ({ label: formatIsoDate(row.local_date), value: row.kcal_in }))
}

/**
 * Mục tiêu kcal đang hiệu lực, để vẽ đường tham chiếu.
 *
 * Thiếu đường này thì biểu đồ cột chỉ nói "đã ăn bao nhiêu" mà không nói được "nhiều hay ít"
 * — mà đó mới là câu người dùng cần trả lời.
 */
async function readTargetKcal(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('energy_targets')
    .select('target_kcal')
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error !== null || data === null) return null
  return (data as { target_kcal: number }).target_kcal
}
