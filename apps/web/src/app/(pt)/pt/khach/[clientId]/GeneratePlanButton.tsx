'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { BoIcon, InfoIcon } from '@/components/icons'
import { generatePlanAction } from '@/lib/actions/plans'

/**
 * Dựng thực đơn tuần này cho một khách.
 *
 * Đây là bước đầu của vòng duyệt: PT dựng bản nháp, xem qua ở màn Duyệt thực đơn, rồi duyệt.
 * Bản nháp lưu vào `plans` với `status = 'draft'` nên khách chưa thấy.
 *
 * Bộ dựng là **tất định** — cùng hồ sơ thì cùng thực đơn. Nút này vì thế không phải "sinh ngẫu
 * nhiên": bấm lại sau khi khách đổi cân nặng sẽ ra bản khác, còn bấm lại mà hồ sơ không đổi
 * thì ra đúng bản cũ. Nói rõ điều đó trên giao diện để PT không tưởng mỗi lần bấm là một bản mới.
 */
export function GeneratePlanButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function generate(): void {
    const form = new FormData()
    form.set('clientId', clientId)

    startTransition(async () => {
      const outcome = await generatePlanAction(form)
      setResult(outcome)
      if (outcome.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={generate}
        className="border-forest-600/30 text-accent-text text-label flex min-h-11 items-center justify-center gap-2 rounded-md border bg-olive-50 px-5 font-semibold transition-colors duration-(--duration-fast) disabled:opacity-60"
      >
        <BoIcon size={18} />
        {pending ? 'Đang dựng…' : `Dựng thực đơn tuần này cho ${clientName}`}
      </button>

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
