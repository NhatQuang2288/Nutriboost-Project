import type { Metadata } from 'next'

import { DeleteAccountCard } from '@/components/account/DeleteAccountCard'
import { InfoIcon, LeafIcon, LogOutIcon, MailIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { ACTIVITY_LABELS } from '@nutriboost/nutrition'
import { ensureProfileReady } from '@/lib/data/require-profile'
import { getTodayView } from '@/lib/data/today'
import { getSessionUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Tôi' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

export default async function ProfilePage() {
  const view = await getTodayView()
  await ensureProfileReady(view.source)
  const { profile, targets } = view
  const user = await getSessionUser()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Tôi</h1>
        <p className="text-caption text-ink-muted">Hồ sơ quyết định mọi con số trong ứng dụng.</p>
      </header>

      <Card>
        <SectionTitle>Hồ sơ</SectionTitle>
        <dl className="flex flex-col">
          <Row label="Giới tính" value={profile.sex === 'male' ? 'Nam' : 'Nữ'} />
          <Row label="Tuổi" value={`${profile.age}`} />
          <Row label="Chiều cao" value={`${profile.heightCm} cm`} />
          <Row label="Cân nặng" value={`${profile.weightKg} kg`} />
          <Row label="Mức vận động" value={ACTIVITY_LABELS[profile.activityLevel]} />
          <Row label="Mục tiêu" value={GOAL_LABELS[profile.goal]} />
        </dl>
      </Card>

      <Card>
        <SectionTitle>Mục tiêu năng lượng</SectionTitle>
        <dl className="flex flex-col">
          <Row label="Chuyển hoá cơ bản (BMR)" value={`${targets.bmrKcal} kcal`} />
          <Row label="Tiêu hao mỗi ngày (TDEE)" value={`${targets.tdeeKcal} kcal`} />
          <Row label="Mục tiêu mỗi ngày" value={`${targets.targetKcal} kcal`} strong />
          <Row
            label="Đa lượng"
            value={`${targets.proteinG} đạm · ${targets.carbG} tinh bột · ${targets.fatG} béo`}
          />
        </dl>
        <p className="text-caption text-ink-faint mt-3 flex items-start gap-1.5">
          <LeafIcon size={14} className="mt-0.5 shrink-0" />
          Tính bằng phương trình Mifflin–St Jeor, không phải do AI đoán.
        </p>
      </Card>

      <Card>
        <SectionTitle>Tài khoản</SectionTitle>
        {user === null ? (
          <p className="text-body text-ink-muted">
            Bạn đang dùng ở chế độ dữ liệu mẫu nên chưa có tài khoản. Điền khoá Supabase vào{' '}
            <code className="text-caption">.env.local</code> rồi đăng nhập để Bơ nhớ hồ sơ của bạn.
          </p>
        ) : (
          <div className="flex flex-col">
            <div className="border-line-subtle flex items-center gap-2.5 border-b py-2.5">
              <MailIcon size={16} className="text-ink-faint shrink-0" />
              <span className="text-body text-ink truncate">{user.email ?? 'Không rõ email'}</span>
            </div>
            <form action="/dang-xuat" method="post" className="pt-3">
              <button
                type="submit"
                className="border-line bg-surface text-ink text-label flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 font-semibold transition-colors duration-(--duration-fast)"
              >
                <LogOutIcon size={16} />
                Đăng xuất
              </button>
            </form>
          </div>
        )}
      </Card>

      {user === null ? (
        <Card className="border-warning/30 bg-warning-surface">
          <div className="flex gap-3">
            <span className="text-warning-text mt-0.5 shrink-0">
              <InfoIcon size={18} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-body text-warning-text font-semibold">Quyền riêng tư dữ liệu</p>
              <p className="text-caption text-warning-text">
                Dữ liệu sức khoẻ của bạn chỉ dùng để tạo gợi ý trong ứng dụng. Ở chế độ dữ liệu mẫu
                không có dữ liệu nào của bạn được lưu, nên không có gì để xoá.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <DeleteAccountCard />
      )}

      <Disclaimer />
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="border-line-subtle flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-body text-ink-muted">{label}</dt>
      <dd
        className={`text-body text-right tabular-nums ${strong === true ? 'text-ink font-semibold' : 'text-ink'}`}
      >
        {value}
      </dd>
    </div>
  )
}
