import { isSupabaseConfigured } from '@nutriboost/db'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, InfoIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'
import { getSessionUser } from '@/lib/supabase/server'

import { RedeemForm } from './RedeemForm'

export const metadata: Metadata = {
  title: 'Nhập mã mời',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/**
 * Màn nhập mã mời — nằm ngoài nhóm `(app)` nên không có thanh điều hướng và lớp trợ lý.
 *
 * Khách nhận được liên kết dạng `/tham-gia?ma=ABCD2345` từ PT. Mã đi kèm trong URL nên màn
 * này điền sẵn cho họ: đúng một thao tác để xác nhận thay vì phải gõ lại tám ký tự.
 *
 * Route này nằm trong danh sách bảo vệ, nên khách chưa đăng nhập sẽ được middleware đưa qua
 * `/dang-nhap` **kèm cả `?ma=`** trong `next`, và sau khi đăng nhập thì quay lại đúng đây.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string }>
}) {
  const { ma } = await searchParams
  const configured = isSupabaseConfigured()
  const user = await getSessionUser()

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-[var(--width-content)] flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-forest-600 flex size-14 items-center justify-center rounded-full bg-olive-100">
          <BoIcon size={30} />
        </span>
        <h1 className="text-h1">Nhập mã mời</h1>
        <p className="text-body text-ink-muted">
          PT của bạn gửi mã này để hai bên được kết nối với nhau.
        </p>
      </header>

      {!configured ? (
        <Notice title="Chưa cấu hình Supabase">
          Mã mời cần cơ sở dữ liệu thật. Điền khoá Supabase vào{' '}
          <code className="text-caption">.env.local</code> rồi tải lại trang này.
        </Notice>
      ) : user === null ? (
        <Notice title="Bạn cần đăng nhập trước">
          <Link
            href={`/dang-nhap?next=${encodeURIComponent(`/tham-gia${ma === undefined ? '' : `?ma=${ma}`}`)}`}
            className="text-caption underline"
          >
            Đăng nhập rồi quay lại đây
          </Link>
        </Notice>
      ) : (
        <RedeemForm initialCode={ma ?? ''} />
      )}

      <Disclaimer />
    </main>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-warning/30 bg-warning-surface text-warning-text flex gap-3 rounded-lg border p-4">
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
