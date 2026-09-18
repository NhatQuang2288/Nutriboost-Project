'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { CheckIcon, EditIcon, InfoIcon } from '@/components/icons'
import { decidePlanAction } from '@/lib/actions/plans'

/**
 * Duyệt thực đơn, hoặc yêu cầu chỉnh lại.
 *
 * Trước đây hai nút này nói thẳng là "chưa nối cơ sở dữ liệu" — trung thực, nhưng hàng đợi
 * duyệt khi đó không có gì để duyệt vì chưa có gì ghi ra `plans`. Nay bộ dựng thực đơn lưu
 * thật (xem `lib/actions/plans.ts`), nên hai nút này cũng phải lưu thật.
 *
 * Ô nhận xét chỉ hiện khi bấm "Yêu cầu chỉnh lại", và bắt buộc phải có nội dung: một yêu cầu
 * chỉnh lại không nói chỉnh chỗ nào thì không giúp được ai, mà lại làm thực đơn rời khỏi hàng
 * đợi như thể đã xử lý xong.
 */
export function ApprovalActions({ planId, clientName }: { planId: string; clientName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [revising, setRevising] = useState(false)
  const [note, setNote] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function submit(decision: 'approve' | 'revise', noteValue?: string): void {
    const form = new FormData()
    form.set('planId', planId)
    form.set('decision', decision)
    if (noteValue !== undefined) form.set('note', noteValue)

    startTransition(async () => {
      const outcome = await decidePlanAction(form)
      setResult(outcome)
      if (outcome.ok) {
        setRevising(false)
        setNote('')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {revising ? (
        <div className="flex flex-col gap-2">
          <label className="border-line bg-surface focus-within:border-forest-600 flex flex-col gap-1 rounded-lg border px-3 py-2">
            <span className="text-caption text-ink-muted">
              Cần chỉnh lại chỗ nào? ({clientName} không thấy nội dung này)
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={400}
              aria-label="Nhận xét cho khách"
              placeholder="Ví dụ: bữa sáng nhiều tinh bột quá, đổi sang trứng hoặc sữa chua."
              className="text-body text-ink w-full resize-none bg-transparent outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || note.trim().length === 0}
              onClick={() => submit('revise', note)}
              className="border-line bg-surface text-ink text-label flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-5 font-semibold disabled:opacity-60"
            >
              <EditIcon size={16} />
              {pending ? 'Đang gửi…' : 'Gửi yêu cầu chỉnh lại'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setRevising(false)
                setNote('')
              }}
              className="text-ink-muted text-label flex min-h-11 items-center justify-center px-4"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit('approve')}
            className="bg-forest-600 text-ink-inverse text-label flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-5 font-semibold transition-colors duration-(--duration-fast) disabled:opacity-60"
          >
            <CheckIcon size={16} />
            {pending ? 'Đang lưu…' : 'Duyệt thực đơn'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setRevising(true)
              setResult(null)
            }}
            className="border-line bg-surface text-ink text-label flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-5 font-semibold transition-colors duration-(--duration-fast) disabled:opacity-60"
          >
            <EditIcon size={16} />
            Yêu cầu chỉnh lại
          </button>
        </div>
      )}

      {result === null ? null : (
        <p
          role="status"
          className={`text-caption flex items-start gap-2 rounded-lg border px-3 py-2 ${
            result.ok
              ? 'border-success/30 bg-success-surface text-success-text'
              : 'border-danger/30 bg-danger-surface text-danger-text'
          }`}
        >
          <InfoIcon size={14} className="mt-0.5 shrink-0" />
          {result.message}
        </p>
      )}
    </div>
  )
}
