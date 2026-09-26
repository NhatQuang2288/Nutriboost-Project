import Link from 'next/link'

import { BoMascot, CheckIcon } from '@/components/icons'

const HIGHLIGHTS = [
  'Ghi một bữa ăn bằng đúng một câu, không cần chọn món',
  'Mục tiêu calo tính theo công thức, không phải do AI đoán',
  'Một gợi ý nhỏ mỗi ngày để bạn không bỏ giữa đường',
]

export default function LandingPage() {
  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-between px-6 py-8">
      <div className="content-column flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <BoMascot size={168} className="drop-shadow-md" />

        <div className="flex flex-col gap-3">
          <h1 className="text-display-lg">
            <span className="text-forest-600">Nutri</span>
            <span className="text-olive-500">boost</span>
          </h1>
          <p className="text-body-lg text-ink-muted text-balance">
            Trợ lý dinh dưỡng cho người Việt. Bạn kể, <strong className="text-ink">Bơ</strong> lo
            phần còn lại.
          </p>
        </div>

        <ul className="flex w-full flex-col gap-3 text-left">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="bg-accent-surface text-accent-text mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <CheckIcon size={13} />
              </span>
              <span className="text-body text-ink-muted">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="content-column flex w-full flex-col items-center gap-4">
        <Link
          href="/dang-ky"
          className="bg-forest-600 text-label text-ink-inverse hover:bg-forest-700 active:bg-forest-700 flex min-h-12 w-full items-center justify-center rounded-md px-6 font-semibold transition-colors duration-(--duration-fast)"
        >
          Bắt đầu
        </Link>

        <p className="text-body text-ink-muted">
          Đã có tài khoản?{' '}
          <Link href="/dang-nhap" className="text-accent-text font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>

        <p className="text-caption text-ink-faint max-w-[42ch] text-center">
          NutriBoost đưa ra gợi ý tham khảo và không thay thế tư vấn y khoa. Hãy hỏi bác sĩ hoặc
          chuyên gia dinh dưỡng trước khi thay đổi chế độ ăn.
        </p>
      </div>
    </main>
  )
}
