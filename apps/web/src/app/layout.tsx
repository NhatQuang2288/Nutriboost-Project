import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Nunito } from 'next/font/google'

import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'

import './globals.css'

/**
 * Hai họ chữ theo docs/DESIGN-SYSTEM.md §4.1:
 *   • Nunito        — tiêu đề và số liệu lớn, đầu nét bo tròn khớp dáng chữ trong logo
 *   • Be Vietnam Pro — nội dung, thiết kế cho tiếng Việt nên dấu xếp đúng ở cỡ nhỏ
 *
 * Cả hai nạp qua `next/font` nên được tự host, không gọi Google Fonts lúc chạy.
 * Tập con bắt buộc có `vietnamese`, nếu thiếu thì dấu tiếng Việt sẽ vỡ.
 */
const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  // Be Vietnam Pro không phải font biến thiên trên Google Fonts nên phải khai báo
  // đúng các weight dùng trong design system (400 nội dung, 500 nhãn, 600 nhấn).
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'NutriBoost — trợ lý dinh dưỡng của bạn',
    template: '%s · NutriBoost',
  },
  description:
    'NutriBoost là trợ lý dinh dưỡng cho người Việt: ghi bữa ăn bằng một câu, nhận gợi ý phù hợp, theo dõi tiến độ. Không thay thế tư vấn y khoa.',
  applicationName: 'NutriBoost',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NutriBoost',
    statusBarStyle: 'default',
  },
  // iOS chỉ nhận `apple-touch-icon` dạng PNG — SVG bị bỏ qua. Tệp này do
  // `npm run icons:generate` sinh ra.
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Cần cho thiết bị có tai thỏ và thanh home.
  viewportFit: 'cover',
  // Trên iOS, bàn phím phải đẩy nội dung lên thay vì che mất ô nhập của trợ lý.
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#151f13' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${nunito.variable} ${beVietnamPro.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
