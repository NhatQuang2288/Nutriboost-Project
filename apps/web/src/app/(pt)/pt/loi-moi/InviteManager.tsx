'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { CopyIcon, InfoIcon, PlusIcon, TicketIcon, TrashIcon } from '@/components/icons'
import { Card, EmptyState, SectionTitle } from '@/components/ui'
import { createInviteAction, revokeInviteAction } from '@/lib/actions/invites'
import { formatIsoDate } from '@/lib/date'
import { INVITE_REASON_LABELS, type InviteCodeView, type InviteContext } from '@/lib/invites'

/**
 * Quản lý mã mời.
 *
 * Chỉ những gì cần tương tác mới là client component; phần khung và tiêu đề nằm ở server
 * component cha. Trạng thái thông báo là chuỗi chứ không phải ngoại lệ: Server Action trả về
 * `ActionResult` nên không có màn hình lỗi nào của Next.js xuất hiện vì một mã sai.
 */
export function InviteManager({ context, origin }: { context: InviteContext; origin: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function run(
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
    form: FormData,
  ) {
    startTransition(async () => {
      const result = await action(form)
      setNotice({ ok: result.ok, text: result.message })
      if (result.ok) router.refresh()
    })
  }

  if (context.state === 'demo') {
    return (
      <Notice tone="warning" title="Chưa cấu hình Supabase">
        Mã mời cần cơ sở dữ liệu thật vì nó tạo quan hệ giữa PT và khách hàng — không thể giả lập.
        Điền khoá Supabase vào <code className="text-caption">.env.local</code> rồi tải lại trang
        này.
      </Notice>
    )
  }

  if (context.state === 'not_pt') {
    return (
      <Notice tone="warning" title="Tài khoản này không phải PT">
        Chỉ tài khoản có vai trò PT mới phát hành được mã mời. Vai trò được đặt bởi quản trị viên
        sau khi gói dịch vụ được xác nhận thanh toán.
      </Notice>
    )
  }

  return (
    <>
      {notice === null ? null : (
        <p
          role="status"
          className={`text-caption rounded-lg border px-3 py-2 ${
            notice.ok
              ? 'border-success/30 bg-success-surface text-success-text'
              : 'border-danger/30 bg-danger-surface text-danger-text'
          }`}
        >
          {notice.text}
        </p>
      )}

      {context.plan === null ? (
        <Notice tone="danger" title="Chưa có gói đang hiệu lực">
          Tài khoản chưa có gói nên chưa mời được khách nào: hạn mức khách của gói là thứ quyết định
          số người bạn nhận được. Mã đã tạo vẫn hiển thị bên dưới nhưng khách nhập sẽ bị từ chối.
        </Notice>
      ) : (
        <Card>
          <SectionTitle>Gói {context.plan.tierLabel}</SectionTitle>
          <dl className="flex flex-col">
            <Row
              label="Khách đang theo"
              value={`${context.plan.clientLimit - context.plan.remainingSlots}/${context.plan.clientLimit}`}
              strong
            />
            <Row label="Còn mời được" value={`${context.plan.remainingSlots} khách`} />
            <Row label="Gia hạn ngày" value={formatIsoDate(context.plan.renewsOn)} />
          </dl>
        </Card>
      )}

      <Card>
        <SectionTitle>Tạo mã mới</SectionTitle>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            event.currentTarget.reset()
            run(createInviteAction, form)
          }}
        >
          <Field
            label="Ghi chú (không bắt buộc)"
            name="note"
            placeholder="Ví dụ: chị Lan"
            maxLength={80}
          />

          <div className="flex gap-3">
            <Field
              label="Số lượt"
              name="maxUses"
              type="number"
              defaultValue="1"
              min={1}
              max={100}
            />
            <Field
              label="Hiệu lực (ngày)"
              name="expiresInDays"
              type="number"
              defaultValue="14"
              min={1}
              max={90}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-forest-600 text-ink-inverse text-label flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            <PlusIcon size={16} />
            {pending ? 'Đang tạo…' : 'Tạo mã mời'}
          </button>
        </form>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-h2">Mã đã phát hành</h2>

        {context.codes.length === 0 ? (
          <EmptyState
            icon={<TicketIcon size={32} />}
            title="Chưa có mã nào"
            description="Tạo mã đầu tiên rồi gửi liên kết cho khách. Khách mở liên kết, đăng nhập, và trở thành khách hàng của bạn."
          />
        ) : (
          context.codes.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              link={`${origin}/tham-gia?ma=${invite.code}`}
              copied={copied}
              onCopy={setCopied}
              pending={pending}
              onRevoke={() => {
                const form = new FormData()
                form.set('id', invite.id)
                run(revokeInviteAction, form)
              }}
            />
          ))
        )}
      </section>
    </>
  )
}

function InviteRow({
  invite,
  link,
  copied,
  onCopy,
  onRevoke,
  pending,
}: {
  invite: InviteCodeView
  link: string
  copied: string | null
  onCopy: (code: string) => void
  onRevoke: () => void
  pending: boolean
}) {
  return (
    <Card as="article" className={invite.usable ? undefined : 'opacity-80'}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-h3 text-ink font-mono tracking-widest">{invite.code}</span>
        <span
          className={`text-caption rounded-full px-3 py-1 ${
            invite.usable ? 'bg-accent-surface text-accent-text' : 'text-ink-muted bg-neutral-100'
          }`}
        >
          {INVITE_REASON_LABELS[invite.reason]}
        </span>
      </div>

      {invite.note === null ? null : (
        <p className="text-caption text-ink-muted mb-1">{invite.note}</p>
      )}

      <p className="text-caption text-ink-faint">
        Đã dùng {invite.usedCount}/{invite.maxUses} · hết hạn {formatIsoDate(invite.expiresAt)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void copy(link).then((ok) => {
              if (ok) onCopy(invite.code)
            })
          }}
          className="border-line bg-surface text-ink text-label flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 font-semibold transition-colors duration-(--duration-fast)"
        >
          <CopyIcon size={15} />
          {copied === invite.code ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}
        </button>

        {invite.revoked ? null : (
          <button
            type="button"
            disabled={pending}
            onClick={onRevoke}
            className="border-danger/40 text-danger-text text-label flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 font-semibold disabled:opacity-60"
          >
            <TrashIcon size={15} />
            Thu hồi
          </button>
        )}
      </div>
    </Card>
  )
}

/**
 * Sao chép vào bộ nhớ tạm. Trả về `false` khi trình duyệt chặn.
 *
 * `navigator.clipboard` chỉ có trên HTTPS hoặc `localhost`; trên HTTP qua địa chỉ IP nó là
 * `undefined`. Không kiểm tra thì lời gọi sẽ ném ra và nút bấm im lặng không làm gì.
 */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'danger'
  title: string
  children: React.ReactNode
}) {
  const styles =
    tone === 'warning'
      ? 'border-warning/30 bg-warning-surface text-warning-text'
      : 'border-danger/30 bg-danger-surface text-danger-text'

  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${styles}`}>
      <span className="mt-0.5 shrink-0">
        <InfoIcon size={18} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-body font-semibold">{title}</p>
        <p className="text-caption">{children}</p>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="border-line-subtle flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0">
      <dt className="text-body text-ink-muted">{label}</dt>
      <dd
        className={`text-body tabular-nums ${strong === true ? 'text-ink font-semibold' : 'text-ink'}`}
      >
        {value}
      </dd>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  ...rest
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  defaultValue?: string
  min?: number
  max?: number
  maxLength?: number
}) {
  return (
    <label className="border-line bg-surface focus-within:border-forest-600 flex flex-1 flex-col gap-1 rounded-lg border px-3 py-2">
      <span className="text-caption text-ink-muted">{label}</span>
      <input
        type={type}
        name={name}
        className="text-body text-ink w-full bg-transparent outline-none"
        {...rest}
      />
    </label>
  )
}
