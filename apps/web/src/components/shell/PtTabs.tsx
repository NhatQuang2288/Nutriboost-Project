'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BoIcon, CalendarIcon, CheckIcon, ChartIcon, UserPlusIcon } from '@/components/icons'

interface Tab {
  href: '/pt' | '/pt/duyet' | '/pt/loi-moi' | '/pt/goi'
  label: string
  description: string
  Icon: typeof ChartIcon
}

const TABS: readonly Tab[] = [
  {
    href: '/pt',
    label: 'Tổng quan',
    description: 'Theo dõi hoạt động',
    Icon: ChartIcon,
  },
  {
    href: '/pt/duyet',
    label: 'Duyệt thực đơn',
    description: 'Thực đơn chờ duyệt',
    Icon: CheckIcon,
  },
  {
    href: '/pt/loi-moi',
    label: 'Mời khách',
    description: 'Quản lý lời mời',
    Icon: UserPlusIcon,
  },
  {
    href: '/pt/goi',
    label: 'Gói dịch vụ',
    description: 'Gói PT hiện tại',
    Icon: CalendarIcon,
  },
]

export function PtTabs() {
  const pathname = usePathname()

  return (
    <aside className="w-full">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <span className="text-forest-600 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-olive-100">
          <BoIcon size={22} />
        </span>

        <div className="min-w-0">
          <p className="text-ink text-sm leading-tight font-bold">NutriBoost</p>

          <p className="text-ink-muted mt-0.5 text-xs">PT Console</p>
        </div>
      </div>

      {/* Điều hướng chính */}
      <div className="mb-3 px-2">
        <p className="text-ink-faint text-[10px] font-bold tracking-wider uppercase">Quản lý</p>
      </div>

      <nav aria-label="Điều hướng console PT">
        <ul className="space-y-1.5">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)

            const { href, label, description, Icon } = tab

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'group flex items-center gap-3 rounded-2xl px-3 py-3',
                    'transition-all duration-200',
                    active
                      ? 'bg-forest-600 text-white shadow-sm'
                      : 'text-ink-muted hover:text-forest-700 hover:bg-olive-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex size-9 shrink-0 items-center justify-center rounded-xl',
                      active ? 'bg-white/15' : 'bg-olive-50 group-hover:bg-white',
                    ].join(' ')}
                  >
                    <Icon size={18} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>

                    <span
                      className={[
                        'mt-0.5 block truncate text-[11px]',
                        active ? 'text-white/70' : 'text-ink-faint',
                      ].join(' ')}
                    >
                      {description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Khu vực AI */}
      <div className="mt-8">
        <p className="text-ink-faint mb-3 px-2 text-[10px] font-bold tracking-wider uppercase">
          Trợ lý
        </p>

        <button
          type="button"
          className="border-line-subtle text-forest-700 flex w-full items-center gap-3 rounded-2xl border bg-olive-50 p-3 text-left transition-colors hover:bg-olive-100"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <BoIcon size={18} />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold">Bơ AI</span>

            <span className="text-ink-faint mt-0.5 block text-[11px]">Trợ lý cho PT</span>
          </span>

          <span className="ml-auto size-2 rounded-full bg-green-500" />
        </button>
      </div>

      {/* Cuối sidebar */}
      <div className="mt-8 border-t border-black/5 pt-5">
        <div className="rounded-2xl bg-olive-50 p-3">
          <p className="text-ink text-xs font-semibold">NutriBoost cho PT</p>

          <p className="text-ink-faint mt-1 text-[11px] leading-relaxed">
            Quản lý khách hàng và thực đơn
          </p>
        </div>
      </div>
    </aside>
  )
}
