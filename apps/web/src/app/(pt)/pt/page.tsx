import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ChevronRightIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'

import { CLIENT_STATUS_LABELS, getPtOverview, type ClientStatus } from '@/lib/data/pt'

export const metadata: Metadata = {
  title: 'Tổng quan',
}

export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

export default async function PtOverviewPage() {
  const overview = await getPtOverview()

  const { clients } = overview

  return (
    <div className="min-h-full bg-[#f7f9f5] pb-10">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="mb-5">
        <div>
          <p className="text-[23px] leading-tight font-medium tracking-[-0.03em] text-[#202f25]">
            Hello {overview.ptName},<span className="ml-1">🌱</span>
          </p>

          <p className="mt-1 text-[11px] text-[#899088]">
            Let&apos;s start a healthy day for your clients
          </p>
        </div>
      </header>

      {/* =========================================================
          MAIN DASHBOARD
      ========================================================= */}

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[1.05fr_0.82fr]">
        {/* =======================================================
            LEFT COLUMN
        ======================================================= */}

        <div className="grid gap-3.5">
          {/* =====================================================
              HERO
          ===================================================== */}

          <div className="relative min-h-[225px] overflow-hidden rounded-[23px] bg-[#dff0bd] p-5">
            <div className="absolute inset-0 bg-gradient-to-r from-[#dff0bd] via-[#dff0bd]/70 to-transparent" />
            <Image src="/images/pt/Ảnh 1.jpg" alt="" fill className="object-cover object-center" />
            <div className="absolute -bottom-16 -left-12 size-40 rounded-full border-[18px] border-[#c8e39b]/60" />

            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-[#edf7d9]/60" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-1 items-center">
                <div>
                  <p className="mb-2 text-[9px] font-medium tracking-[0.12em] text-[#66775d] uppercase">
                    Healthy lifestyle
                  </p>

                  <h2 className="max-w-[280px] text-[29px] leading-[1.12] font-bold tracking-[-0.04em] text-[#263d29]">
                    Health is not a goal.
                    <br />
                    It&apos;s a way of life.
                  </h2>

                  <p className="mt-3 max-w-[230px] text-[9px] leading-relaxed text-[#65735f]">
                    Small healthy habits today can create a better tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              CLIENT CHECK-IN
          ===================================================== */}

          <div className="min-h-[225px] rounded-[23px] border border-[#e8ebe4] bg-white p-5 shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-medium tracking-[0.08em] text-[#929990] uppercase">
                  Today
                </p>

                <h2 className="mt-1 text-[16px] font-medium text-[#354139]">Client Check-in</h2>

                <p className="mt-1 text-[8px] text-[#929990]">Today&apos;s client updates</p>
              </div>

              <span className="rounded-full bg-[#eef4df] px-2.5 py-1 text-[8px] font-medium text-[#718942]">
                {clients.length} clients
              </span>
            </div>

            {/* CHECK-IN SUMMARY */}

            <div className="mt-5 grid grid-cols-3 gap-2">
              {/* CHECKED IN */}

              <div className="rounded-[15px] bg-[#f1f6e8] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#9ed36a]" />

                  <span className="text-[17px] font-semibold text-[#465541]">8</span>
                </div>

                <p className="mt-1 text-[7px] text-[#7e887b]">Checked in</p>
              </div>

              {/* NEED REVIEW */}

              <div className="rounded-[15px] bg-[#fff7df] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#d9b64c]" />

                  <span className="text-[17px] font-semibold text-[#665b37]">3</span>
                </div>

                <p className="mt-1 text-[7px] text-[#8f8461]">Need review</p>
              </div>

              {/* NOT UPDATED */}

              <div className="rounded-[15px] bg-[#f3f4f1] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#aeb5ae]" />

                  <span className="text-[17px] font-semibold text-[#5d655e]">4</span>
                </div>

                <p className="mt-1 text-[7px] text-[#858c85]">Not updated</p>
              </div>
            </div>

            {/* CHECK-IN RATE */}

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[8px] text-[#929990]">Check-in rate</span>

                <span className="text-[9px] font-semibold text-[#53614f]">53%</span>
              </div>

              <div className="h-[5px] overflow-hidden rounded-full bg-[#edf0e9]">
                <div className="h-full w-[53%] rounded-full bg-[#91ad57]" />
              </div>
            </div>

            {/* FOOTER */}

            <div className="mt-4 flex items-center justify-between border-t border-[#eef0eb] pt-3">
              <span className="text-[7px] text-[#a0a69d]">Updated today</span>

              <span className="text-[7px] font-medium text-[#718942]">Client activity</span>
            </div>
          </div>
        </div>

        {/* =======================================================
            RIGHT COLUMN — WORK SCHEDULE
        ======================================================= */}

        <div className="grid gap-3.5">
          <div className="flex min-h-[455px] flex-col rounded-[23px] border border-[#e8ebe4] bg-white p-4 shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[8px] font-medium tracking-[0.1em] text-[#9aa097] uppercase">
                  Schedule
                </p>

                <h2 className="mt-0.5 text-[14px] font-medium tracking-[-0.02em] text-[#303a32]">
                  Work schedule
                </h2>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-[#f3f6ee] px-2.5 py-1.5 text-[7px] font-medium text-[#68775d] transition-colors hover:bg-[#e8efdc]"
              >
                September
                <span className="text-[10px]">+</span>
              </button>
            </div>

            {/* =================================================
                DATE SELECTOR
            ================================================= */}

            <div className="mt-3 flex gap-1.5">
              {[
                { day: '24', label: 'Wed' },
                { day: '25', label: 'Thu', active: true },
                { day: '26', label: 'Fri' },
                { day: '27', label: 'Sat' },
                { day: '28', label: 'Sun' },
                { day: '29', label: 'Mon' },
                { day: '30', label: 'Tue' },
              ].map((item) => (
                <div
                  key={item.day}
                  className={`flex min-w-0 flex-1 flex-col items-center rounded-xl py-1.5 ${
                    item.active
                      ? 'bg-[#27302d] text-white shadow-sm'
                      : 'bg-[#f7f8f5] text-[#7d857d]'
                  }`}
                >
                  <span className="text-[6px] font-medium opacity-60">{item.label}</span>

                  <span className="mt-0.5 text-[9px] font-semibold">{item.day}</span>

                  {item.active && <span className="mt-1 size-1 rounded-full bg-[#9ed36a]" />}
                </div>
              ))}
            </div>

            {/* =================================================
                TODAY
            ================================================= */}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[6px] font-medium tracking-[0.1em] text-[#a0a69d] uppercase">
                  Today
                </p>

                <p className="mt-0.5 text-[9px] font-medium text-[#354139]">
                  Thursday, September 25
                </p>
              </div>

              <span className="rounded-full bg-[#e8f2d7] px-2.5 py-1 text-[6px] font-semibold text-[#718942]">
                3 tasks
              </span>
            </div>

            {/* =================================================
                TIMELINE
            ================================================= */}

            <div className="mt-3 space-y-2">
              <ScheduleItem
                time="09:00"
                title="Check client progress"
                description="3 clients"
                color="green"
              />

              <ScheduleItem
                time="14:00"
                title="Review meal plans"
                description="2 pending"
                color="yellow"
              />

              <ScheduleItem
                time="17:30"
                title="Client consultation"
                description="Nguyễn A"
                color="blue"
              />
            </div>

            {/* =================================================
                QUICK SUMMARY
            ================================================= */}

            <div className="mt-3 grid grid-cols-3 gap-2">
              {/* COMPLETED */}

              <div className="rounded-[14px] bg-[#f1f7e7] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#91bd55]" />

                  <span className="text-[8px] font-semibold text-[#66863b]">1</span>
                </div>

                <p className="mt-1 text-[6px] text-[#7e887b]">Completed</p>
              </div>

              {/* PENDING */}

              <div className="rounded-[14px] bg-[#fff8e7] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#d9b64c]" />

                  <span className="text-[8px] font-semibold text-[#a88428]">1</span>
                </div>

                <p className="mt-1 text-[6px] text-[#8f8461]">Pending</p>
              </div>

              {/* MEETING */}

              <div className="rounded-[14px] bg-[#eef7f8] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#86aeb7]" />

                  <span className="text-[8px] font-semibold text-[#628d96]">1</span>
                </div>

                <p className="mt-1 text-[6px] text-[#7d8e92]">Meeting</p>
              </div>
            </div>

            {/* =================================================
                SCHEDULE NOTE
            ================================================= */}

            <div className="mt-auto border-t border-[#eef0eb] pt-3">
              <p className="text-[7px] leading-relaxed text-[#9aa097]">
                Keep track of your daily tasks and client appointments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          CUSTOMER LIST
      ========================================================= */}

      {clients.length > 0 && (
        <section className="mt-6">
          {/* SECTION HEADER */}

          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.08em] text-[#7d867b] uppercase">
                Quản lý khách hàng
              </p>

              <h2 className="mt-1 text-[19px] font-medium tracking-[-0.02em] text-[#354139]">
                Khách hàng của bạn
              </h2>
            </div>

            <span className="text-[10px] text-[#91978f]">{clients.length} khách</span>
          </div>

          {/* CUSTOMER LIST */}

          <div className="overflow-hidden rounded-[20px] border border-[#e8ebe4] bg-white shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
            {clients.map((client, index) => (
              <Link
                key={client.id}
                href={`/pt/khach/${client.id}`}
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f8faf5] ${
                  index !== clients.length - 1 ? 'border-b border-[#eef0eb]' : ''
                }`}
              >
                {/* AVATAR */}

                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0d4] text-[12px] font-semibold text-[#66803e]">
                  {client.name.charAt(0)}
                </div>

                {/* NAME + GOAL */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#354139]">{client.name}</p>

                  <p className="mt-0.5 text-[9px] text-[#90978e]">
                    {GOAL_LABELS[client.goal]}
                    <span className="mx-1">·</span>
                    {client.adherencePct}% tuân thủ
                  </p>
                </div>

                {/* STATUS */}

                <StatusChip status={client.status} />

                {/* ARROW */}

                <ChevronRightIcon
                  size={14}
                  className="shrink-0 text-[#a1a79f] transition-transform group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          DISCLAIMER
      ========================================================= */}

      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  )
}

/* ================================================================
   SCHEDULE ITEM
================================================================ */

function ScheduleItem({
  time,
  title,
  description,
  color,
}: {
  time: string
  title: string
  description: string
  color: 'green' | 'yellow' | 'blue'
}) {
  const styles = {
    green: {
      card: 'bg-[#f1f7e7] border-[#e3eed2]',
      dot: 'bg-[#91bd55]',
      icon: 'bg-[#dcecc2] text-[#66863b]',
    },

    yellow: {
      card: 'bg-[#fff8e7] border-[#f2e7c5]',
      dot: 'bg-[#d9b64c]',
      icon: 'bg-[#fff0c9] text-[#a88428]',
    },

    blue: {
      card: 'bg-[#eef7f8] border-[#dcebed]',
      dot: 'bg-[#86aeb7]',
      icon: 'bg-[#d9edf0] text-[#628d96]',
    },
  }

  const style = styles[color]

  return (
    <div className={`flex items-center gap-2.5 rounded-[15px] border px-2.5 py-2 ${style.card}`}>
      {/* TIME */}

      <span className="w-[30px] shrink-0 text-[7px] font-semibold text-[#68736b]">{time}</span>

      {/* TIMELINE */}

      <div className="relative flex h-7 w-2 shrink-0 items-center justify-center">
        <span className={`absolute h-full w-[2px] rounded-full ${style.dot}`} />

        <span
          className={`relative size-2 rounded-full border-2 border-white shadow-sm ${style.dot}`}
        />
      </div>

      {/* ICON */}

      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold ${style.icon}`}
      >
        {color === 'green' && '✓'}

        {color === 'yellow' && '!'}

        {color === 'blue' && '•'}
      </div>

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[8px] font-semibold text-[#465248]">{title}</p>

        <p className="mt-0.5 text-[6px] text-[#8d968d]">{description}</p>
      </div>
    </div>
  )
}

/* ================================================================
   STATUS
================================================================ */

const STATUS_TONES: Readonly<Record<ClientStatus, string>> = {
  active: 'bg-[#e8f1d7] text-[#617d35]',

  at_risk: 'bg-[#fff0d7] text-[#a87524]',

  onboarding: 'bg-[#f0f1ed] text-[#777d74]',

  paused: 'bg-[#f0f1ed] text-[#92978e]',
}

function StatusChip({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[8px] font-medium whitespace-nowrap ${STATUS_TONES[status]}`}
    >
      {CLIENT_STATUS_LABELS[status]}
    </span>
  )
}
