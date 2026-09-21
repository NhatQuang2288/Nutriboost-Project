'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { CalendarIcon, ChartIcon, HomeIcon, PlusIcon, UserIcon } from '@/components/icons'

interface Tab {
  href: '/hom-nay' | '/ke-hoach' | '/tien-do' | '/toi'
  label: string
  Icon: typeof HomeIcon
}

const TABS: readonly Tab[] = [
  { href: '/hom-nay', label: 'Hôm nay', Icon: HomeIcon },
  { href: '/ke-hoach', label: 'Kế hoạch', Icon: CalendarIcon },
  { href: '/tien-do', label: 'Tiến độ', Icon: ChartIcon },
  { href: '/toi', label: 'Tôi', Icon: UserIcon },
]

/**
 * Thanh điều hướng dưới, 5 vị trí.
 *
 * Nút ghi nhận nằm chính giữa và nổi lên — đây là hành động được dùng nhiều nhất,
 * nên nó phải là thứ dễ chạm nhất trên màn hình.
 */
export function BottomNav() {
  const pathname = usePathname()
  const left = TABS.slice(0, 2)
  const right = TABS.slice(2)

  return (
    <nav
      aria-label="Điều hướng chính"
      className="safe-bottom border-line-subtle bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md"
    >
      <div className="mx-auto flex h-(--height-nav) w-full max-w-[560px] items-stretch justify-between px-2">
        {left.map((tab) => (
          <NavTab key={tab.href} tab={tab} active={pathname === tab.href} />
        ))}

        <div className="flex w-16 items-center justify-center">
          <Link
            href="/ghi-nhan"
            aria-label="Ghi bữa ăn"
            className="bg-forest-600 text-ink-inverse -mt-6 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform duration-(--duration-fast) active:scale-95"
          >
            <PlusIcon size={26} />
          </Link>
        </div>

        {right.map((tab) => (
          <NavTab key={tab.href} tab={tab} active={pathname === tab.href} />
        ))}
      </div>
    </nav>
  )
}

function NavTab({ tab, active }: { tab: Tab; active: boolean }) {
  const { href, label, Icon } = tab
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`touch-target text-micro flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-(--duration-fast) ${
        active ? 'text-forest-600' : 'text-ink-faint'
      }`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </Link>
  )
}
