import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Các gói nội bộ phát hành thẳng mã TypeScript, để Next biên dịch cùng ứng dụng.
  transpilePackages: [
    '@nutriboost/nutrition',
    '@nutriboost/db',
    '@nutriboost/ai',
    '@nutriboost/seed',
  ],

  // Lint chạy ở bước riêng trong CI (`npm run lint`), không lặp lại trong `next build`.
  // Next 16 đã bỏ khoá `eslint` trong next.config.ts.

  typedRoutes: true,
}

export default nextConfig
