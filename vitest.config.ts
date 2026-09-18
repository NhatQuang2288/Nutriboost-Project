import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const resolvePath = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url))

/**
 * Mặc định là môi trường `node`.
 *
 * Lý do: phần lớn test là logic thuần trong `packages/*` và không cần DOM. Chạy trên
 * jsdom chỉ làm chậm và tạo thêm một phụ thuộc có thể hỏng.
 *
 * Test component đặt `// @vitest-environment jsdom` ở đầu file, ví dụ:
 *   // @vitest-environment jsdom
 *   import '@testing-library/jest-dom/vitest'
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@nutriboost/nutrition': resolvePath('./packages/nutrition/src/index.ts'),
      '@nutriboost/db': resolvePath('./packages/db/src/index.ts'),
      '@nutriboost/ai': resolvePath('./packages/ai/src/index.ts'),
      '@': resolvePath('./apps/web/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts', 'apps/web/src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/e2e/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    },
  },
})
