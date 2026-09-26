/**
 * Đọc cấu hình từ biến môi trường.
 *
 * Nguyên tắc: **đọc lười, không ném lỗi lúc import.**
 * `next build` chạy trong môi trường không có khoá thật; nếu module này ném lỗi ở
 * cấp cao nhất thì build sẽ đổ, dù ứng dụng chỉ cần khoá lúc chạy.
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey: string | null
}

function clean(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

/** Cấu hình Supabase công khai (được phép lộ ra trình duyệt). */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (url === null || anonKey === null) return null
  return { url, anonKey, serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY) }
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null
}

/**
 * Khoá service role chỉ được dùng ở server.
 * Dùng cho các việc người dùng không được phép tự làm: ghi `ai_calls`, hạn mức, cache.
 */
export function readServiceRoleConfig(): SupabaseConfig {
  const config = readSupabaseConfig()
  if (config === null) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (config.serviceRoleKey === null) {
    throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY — bắt buộc cho tác vụ phía server')
  }
  return config
}
