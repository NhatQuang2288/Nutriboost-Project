import { defineConfig, devices } from '@playwright/test'

/**
 * Cấu hình kiểm thử đầu-cuối.
 *
 * Đặc tả trợ lý có những con số chỉ đúng ở màn hình lớn (panel 400px, cột 768px,
 * thanh hỏi 680px), nên có hai dự án: `desktop` để đo hình học, `mobile` để kiểm
 * hành vi tấm trượt từ đáy.
 *
 * Trình duyệt được cài vào thư mục trong workspace (`PLAYWRIGHT_BROWSERS_PATH`)
 * vì một số môi trường chặn ghi vào thư mục cache của hệ điều hành.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI === 'true',
  retries: process.env.CI === 'true' ? 1 : 0,
  workers: process.env.CI === 'true' ? 1 : undefined,
  reporter: [['list']],

  use: {
    baseURL: 'http://127.0.0.1:3210',
    trace: 'on-first-retry',
    // Câu trả lời của trợ lý chảy theo từng mẩu; chờ hơi lâu hơn mặc định.
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
      testIgnore: /mobile\.spec\.ts$/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts$/,
    },
  ],

  webServer: {
    command: 'npx next start --port 3210',
    cwd: 'apps/web',
    url: 'http://127.0.0.1:3210/hom-nay',
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 180_000,
    env: {
      // Chạy E2E với công tắc dừng AI: đường giả cho ra kết quả tất định,
      // nên test không phụ thuộc dịch vụ ngoài và không tốn tiền.
      AI_KILL_SWITCH: 'true',
      GEMINI_API_KEY: '',
    },
  },
})
