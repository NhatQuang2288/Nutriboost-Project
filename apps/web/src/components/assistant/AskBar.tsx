'use client'

import { useCallback } from 'react'

import { BoIcon } from '@/components/icons/BoIcon'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Tầng 1 — nút mở trợ lý Bơ AI.
 *
 * Khi ở chế độ bar:
 * - Không hiển thị thanh nhập dài.
 * - Chỉ hiển thị logo Bơ AI ở góc phải phía dưới.
 * - Bấm vào logo → mở AssistantDock.
 *
 * Toàn bộ logic chat vẫn nằm trong AssistantDock / AssistantProvider.
 */
export function AskBar() {
  const expandFromBar = useAssistantStore((state) => state.expandFromBar)

  const handleOpen = useCallback(() => {
    expandFromBar()
  }, [expandFromBar])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="pointer-events-auto flex justify-end px-5 pb-5 lg:px-7 lg:pb-7">
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Mở trợ lý Bơ AI"
          title="Mở Bơ AI"
          data-testid="ask-bar"
          className={[
            'group relative flex size-14 items-center justify-center',
            'rounded-2xl',
            'bg-forest-600 text-white',
            'shadow-[0_10px_30px_rgba(20,50,30,0.18)]',
            'transition-all duration-200',
            'hover:-translate-y-1',
            'hover:bg-forest-700',
            'hover:shadow-[0_14px_35px_rgba(20,50,30,0.24)]',
            'active:translate-y-0',
            'active:scale-95',
          ].join(' ')}
        >
          <BoIcon size={27} />

          {/* Chấm online */}
          <span
            aria-hidden="true"
            className={[
              'absolute top-1.5 right-1.5',
              'size-3.5 rounded-full',
              'border-forest-600 border-2',
              'bg-green-400',
            ].join(' ')}
          />

          {/* Tooltip */}
          <span
            className={[
              'pointer-events-none absolute right-full mr-3',
              'whitespace-nowrap',
              'bg-ink rounded-xl px-3 py-2',
              'text-xs font-medium text-white',
              'translate-x-1 opacity-0',
              'shadow-lg',
              'transition-all duration-200',
              'group-hover:translate-x-0 group-hover:opacity-100',
            ].join(' ')}
          >
            Mở Bơ AI
          </span>
        </button>
      </div>
    </div>
  )
}
