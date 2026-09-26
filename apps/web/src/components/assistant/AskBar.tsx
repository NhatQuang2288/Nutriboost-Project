'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { BoIcon, ExpandIcon, SendIcon } from '@/components/icons'
import { useAssistant } from '@/components/assistant/AssistantProvider'
import { suggestionsFor } from '@/components/assistant/suggestions'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Tầng 1 — thanh hỏi nổi ở đáy vùng nội dung.
 *
 * Hợp đồng (docs/ASSISTANT-UX.md §4) — mỗi dòng có test E2E ở `e2e/assistant.spec.ts`:
 *   • nổi ở đáy `main`, căn giữa ngang, rộng tối đa 680px
 *   • gõ nội dung + Enter → mở panel VÀ gửi luôn
 *   • ô trống → nút bên phải là "Mở rộng"; có nội dung → nút "Gửi"
 *   • phím `/` hoặc bấm vào ô → hiện gợi ý theo ngữ cảnh màn hình
 *
 * Đừng thu thanh này về một nút tròn chỉ để mở panel: ghi bữa ăn bằng một câu gõ ngay tại
 * màn hình đang xem là thao tác chính của sản phẩm, và một nút tròn bắt người dùng bấm thêm
 * một lần cho mọi câu hỏi.
 */
export function AskBar({
  aboveBottomNav = true,
  besideSidebar = false,
}: {
  /** Chừa chỗ cho thanh điều hướng dưới của khách hàng. */
  aboveBottomNav?: boolean
  /** Console PT có sidebar trái 16rem ở màn hình lớn; căn giữa theo cột nội dung, không theo cả khung. */
  besideSidebar?: boolean
}) {
  const pathname = usePathname()
  const draft = useAssistantStore((state) => state.draft)
  const setDraft = useAssistantStore((state) => state.setDraft)
  const submitFromBar = useAssistantStore((state) => state.submitFromBar)
  const expandFromBar = useAssistantStore((state) => state.expandFromBar)
  const suggestionsVisible = useAssistantStore((state) => state.suggestionsVisible)
  const setSuggestionsVisible = useAssistantStore((state) => state.setSuggestionsVisible)

  const { send } = useAssistant()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listId = useId()

  const suggestions = suggestionsFor(pathname)
  const hasContent = draft.trim().length > 0
  const showSuggestions = suggestionsVisible && !hasContent

  // Ô nhập tự giãn theo nội dung, tối đa 4 dòng.
  useEffect(() => {
    const element = inputRef.current
    if (element === null) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`
  }, [draft])

  const handleSubmit = useCallback(() => {
    const text = draft.trim()
    if (text.length === 0) {
      expandFromBar()
      return
    }
    submitFromBar()
    setDraft('')
    send(text)
  }, [draft, expandFromBar, send, setDraft, submitFromBar])

  const pickSuggestion = useCallback(
    (message: string) => {
      submitFromBar()
      setSuggestionsVisible(false)
      send(message)
    },
    [send, setSuggestionsVisible, submitFromBar],
  )

  return (
    <div
      className={[
        'pointer-events-none fixed inset-x-0 bottom-0 z-20',
        aboveBottomNav ? 'pb-24' : 'pb-5 lg:pb-7',
        besideSidebar ? 'lg:pl-64' : '',
      ].join(' ')}
    >
      <div
        className="pointer-events-auto mx-auto w-full max-w-[var(--width-content)] px-4"
        data-testid="ask-bar"
      >
        {showSuggestions ? (
          <div
            id={listId}
            role="listbox"
            aria-label="Gợi ý cho màn hình này"
            className="mb-2 flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                role="option"
                aria-selected={false}
                // Chặn blur của ô nhập, nếu không danh sách gợi ý biến mất trước khi kịp bấm.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pickSuggestion(suggestion.message ?? suggestion.label)}
                className="text-caption text-ink rounded-full border border-olive-200 bg-white px-3.5 py-1.5 shadow-sm transition-all duration-200 hover:bg-olive-50 active:scale-[0.98]"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={[
            'border-line-subtle flex items-end gap-2 rounded-2xl border bg-white p-2',
            'shadow-[0_10px_30px_rgba(20,50,30,0.14)]',
            'transition-all duration-200',
            'focus-within:border-olive-300 focus-within:ring-4 focus-within:ring-olive-100/70',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            className="bg-forest-600 mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
          >
            <BoIcon size={22} />
          </span>

          <textarea
            id="ask-bar-input"
            ref={inputRef}
            rows={1}
            value={draft}
            placeholder="Hỏi Bơ, hoặc kể mình nghe bữa ăn của bạn…"
            aria-label="Hỏi trợ lý Bơ"
            aria-controls={showSuggestions ? listId : undefined}
            className="text-body text-ink placeholder:text-ink-faint max-h-24 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 outline-none"
            onChange={(event) => setDraft(event.target.value)}
            onFocus={() => setSuggestionsVisible(true)}
            onBlur={() => setSuggestionsVisible(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
              }
            }}
          />

          <button
            type="button"
            onClick={handleSubmit}
            aria-label={hasContent ? 'Gửi tin nhắn' : 'Mở rộng trợ lý'}
            title={hasContent ? 'Gửi' : 'Mở rộng'}
            data-action={hasContent ? 'send' : 'expand'}
            className="touch-target bg-forest-600 hover:bg-forest-700 flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-200 active:scale-95"
          >
            {hasContent ? <SendIcon size={18} /> : <ExpandIcon size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
