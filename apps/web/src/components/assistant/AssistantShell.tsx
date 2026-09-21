'use client'

import type { ReactNode } from 'react'

import { AskBar } from '@/components/assistant/AskBar'
import { AssistantDock } from '@/components/assistant/AssistantDock'
import { AssistantProvider } from '@/components/assistant/AssistantProvider'
import { BottomNav } from '@/components/shell/BottomNav'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Khung ứng dụng đã đăng nhập, có lớp trợ lý.
 *
 * Khách hàng dùng bố cục cũ.
 * Console PT dùng bố cục riêng với sidebar bên trái.
 */
export function AssistantShell({
  children,
  nav,
  wide,
  ptLayout = false,
  sidebar,
}: {
  children: ReactNode
  nav?: ReactNode
  /** Cột nội dung rộng hơn cho bảng biểu của console PT. */
  wide?: boolean
  /** Bật bố cục riêng cho console PT. */
  ptLayout?: boolean
  /** Nội dung sidebar riêng của console PT. */
  sidebar?: ReactNode
}) {
  const mode = useAssistantStore((state) => state.mode)

  return (
    <AssistantProvider>
      <div className="bg-bg flex min-h-dvh">
        {ptLayout && sidebar ? (
          <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white lg:block">
            <div className="sticky top-0 h-dvh overflow-y-auto p-5">{sidebar}</div>
          </aside>
        ) : null}

        <main className="safe-top min-w-0 flex-1">
          <div
            className={`mx-auto w-full px-4 pt-4 pb-44 ${
              wide === true ? 'max-w-[var(--width-console)]' : 'max-w-[var(--width-content)]'
            }`}
          >
            {children}
          </div>
        </main>

        <AssistantDock />
      </div>

      {mode === 'bar' ? <AskBar /> : null}

      {nav === undefined ? <BottomNav /> : nav}
    </AssistantProvider>
  )
}
