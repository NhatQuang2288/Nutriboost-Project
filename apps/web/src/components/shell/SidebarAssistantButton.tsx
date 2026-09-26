'use client'

import { BoIcon } from '@/components/icons'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Nút "Bơ AI" ở cuối sidebar — mở panel trợ lý (tầng 2).
 *
 * Trước đây nút này nằm thẳng trong `PtTabs` mà không gắn hành động nào: bấm vào không có gì
 * xảy ra. Tách ra để sidebar PT và sidebar khách dùng chung, và để nó thật sự mở panel.
 */
export function SidebarAssistantButton({ subtitle }: { subtitle: string }) {
  const toggleSidebar = useAssistantStore((state) => state.toggleSidebar)
  const mode = useAssistantStore((state) => state.mode)
  const open = mode !== 'bar'

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-pressed={open}
      className="border-line-subtle text-forest-700 flex w-full items-center gap-3 rounded-2xl border bg-olive-50 p-3 text-left transition-colors hover:bg-olive-100"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <BoIcon size={18} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold">Bơ AI</span>

        <span className="text-ink-faint mt-0.5 block text-[11px]">{subtitle}</span>
      </span>

      <span className="ml-auto size-2 rounded-full bg-green-500" />
    </button>
  )
}
