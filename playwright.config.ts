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
    /*
     * Build lại ngay trong webServer, có chủ ý.
     *
     * `NEXT_PUBLIC_*` được nhúng vào bundle LÚC BUILD, không phải lúc chạy. Nếu dùng bản
     * build sẵn trên máy — bản đó mang cấu hình Supabase thật trong `.env.local` — thì
     * các test kiểm hành vi "chưa cấu hình Supabase" sẽ hỏng. Tự build với biến giả ở
     * dưới khiến bộ test không phụ thuộc vào trạng thái máy của từng người.
     */
    command: 'npx next build && npx next start --port 3210',
    cwd: 'apps/web',
    url: 'http://127.0.0.1:3210/hom-nay',
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 180_000,
    env: {
      // Chạy E2E với công tắc dừng AI: đường giả cho ra kết quả tất định,
      // nên test không phụ thuộc dịch vụ ngoài và không tốn tiền.
      AI_KILL_SWITCH: 'true',
      GEMINI_API_KEY: '',
      /*
       * Phải khai báo RỖNG, không được bỏ trống hai dòng này.
       *
       * `@next/env` chỉ lấy biến từ `.env.local` khi biến đó CHƯA có trong `process.env`.
       * Không khai báo gì thì file `.env.local` của máy — vốn tồn tại thật nhờ
       * `npm run env:link` — sẽ được nạp, và ba test "nói thẳng là chưa cấu hình
       * Supabase" sẽ đỏ ngay trên máy đã cấu hình, trong khi vẫn xanh trên CI.
       * Khai báo rỗng thì `readSupabaseConfig()` coi như chưa cấu hình, đúng ý định.
       */
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  },
})
