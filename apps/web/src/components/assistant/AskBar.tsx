'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { ExpandIcon, SendIcon } from '@/components/icons'
import { useAssistant } from '@/components/assistant/AssistantProvider'
import { suggestionsFor } from '@/components/assistant/suggestions'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Tầng 1 — thanh hỏi nổi ở đáy vùng nội dung.
 *
 * Hợp đồng (docs/ASSISTANT-UX.md §4):
 *   • nổi ở đáy `main`, căn giữa ngang, rộng tối đa 680px
 *   • gõ nội dung + Enter → mở panel VÀ gửi luôn
 *   • ô trống → nút bên phải là "Mở rộng"; có nội dung → nút "Gửi"
 *   • phím `/` hoặc bấm vào ô → hiện gợi ý theo ngữ cảnh màn hình
 */
export function AskBar() {
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 pb-24">
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
                onClick={() => pickSuggestion(suggestion.message ?? suggestion.label)}
                className="bg-surface text-caption text-accent-text rounded-full border border-olive-200 px-3 py-1.5 shadow-sm transition-colors duration-(--duration-fast) hover:bg-olive-50"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-line bg-surface flex items-end gap-2 rounded-xl border p-2 shadow-lg">
          <textarea
            id="ask-bar-input"
            ref={inputRef}
            rows={1}
            value={draft}
            placeholder="Hỏi Bơ, hoặc kể mình nghe bữa ăn của bạn…"
            aria-label="Hỏi trợ lý Bơ"
            aria-controls={showSuggestions ? listId : undefined}
            className="text-body text-ink placeholder:text-ink-faint max-h-24 flex-1 resize-none bg-transparent px-2 py-2 outline-none"
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
            data-action={hasContent ? 'send' : 'expand'}
            className="touch-target bg-forest-600 text-ink-inverse hover:bg-forest-700 flex size-11 shrink-0 items-center justify-center rounded-md transition-colors duration-(--duration-fast)"
          >
            {hasContent ? <SendIcon size={20} /> : <ExpandIcon size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
