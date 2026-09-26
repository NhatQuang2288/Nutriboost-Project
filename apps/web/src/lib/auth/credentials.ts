import { z } from 'zod'

import { safeNextPath } from '@/lib/auth/redirect'

/**
 * Luật cho đăng nhập bằng email + mật khẩu, dùng chung cho form (trình duyệt) và route
 * (máy chủ).
 *
 * Kiểm ở cả hai nơi là có chủ ý: form kiểm để báo lỗi ngay khi người dùng gõ, route kiểm vì
 * ai cũng gọi thẳng được API mà không qua form.
 */

/**
 * Độ dài tối thiểu của mật khẩu.
 *
 * Nguồn: NIST SP 800-63B §5.1.1.2 — mật khẩu do người dùng tự chọn phải dài ít nhất 8 ký tự.
 * `supabase/config.toml` đặt cùng con số này để máy chủ Auth cũng từ chối mật khẩu ngắn hơn.
 */
export const PASSWORD_MIN_LENGTH = 8

/**
 * Độ dài tối đa. bcrypt — thuật toán Supabase Auth dùng để băm — chỉ đọc 72 byte đầu, nên
 * phần dài hơn không làm mật khẩu mạnh thêm mà chỉ gây hiểu nhầm.
 */
export const PASSWORD_MAX_LENGTH = 72

/** Trang đặt mật khẩu mới, nơi liên kết "quên mật khẩu" đưa người dùng tới. */
export const RESET_PASSWORD_PATH = '/dat-lai-mat-khau'

const email = z.string().trim().toLowerCase().email('Email không hợp lệ.')

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`)
  .max(PASSWORD_MAX_LENGTH, `Mật khẩu dài tối đa ${PASSWORD_MAX_LENGTH} ký tự.`)

export const signInSchema = z.object({
  email,
  // Đăng nhập không áp luật độ dài: tài khoản cũ có thể đã đặt mật khẩu theo luật cũ.
  password: z.string().min(1, 'Bạn chưa nhập mật khẩu.'),
  /** Đường dẫn quay lại sau khi đăng nhập. Chỉ nhận đường dẫn nội bộ — xem `safeNextPath`. */
  next: z.string().optional(),
})

/** Người đăng ký là khách tập hay PT. Chỉ quyết định màn hình tiếp theo, không cấp quyền gì. */
export const SIGN_UP_INTENTS = ['client', 'pt'] as const
export type SignUpIntent = (typeof SIGN_UP_INTENTS)[number]

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Bạn cho Bơ biết tên nhé.')
    .max(60, 'Tên dài tối đa 60 ký tự.'),
  email,
  password: newPassword,
  intent: z.enum(SIGN_UP_INTENTS).default('client'),
  /** Mã mời của PT. Không bắt buộc: khách vẫn tự dùng NutriBoost mà không cần PT. */
  inviteCode: z.string().trim().max(32).optional(),
  /**
   * Đích đến mang từ màn đăng nhập sang, ví dụ khách mở liên kết mời `/tham-gia?ma=…` khi
   * chưa có tài khoản. Chỉ nhận đường dẫn nội bộ — xem `safeNextPath`.
   */
  next: z.string().optional(),
})

/**
 * Màn hình sau khi tạo tài khoản. Chỉ là đường dẫn nội bộ, không mang quyền gì.
 *
 * Thứ tự ưu tiên: mã mời gõ ở form → vai trò đã chọn → đích đến mang từ màn đăng nhập sang.
 */
export function nextPathAfterSignUp(
  intent: SignUpIntent,
  inviteCode: string | undefined,
  requestedNext: string | undefined,
): string {
  if (inviteCode !== undefined && inviteCode.length > 0) {
    return `/tham-gia?ma=${encodeURIComponent(inviteCode)}`
  }
  if (intent === 'pt') return '/pt/goi'
  return safeNextPath(requestedNext)
}

export const forgotPasswordSchema = z.object({ email })

export const updatePasswordSchema = z.object({ password: newPassword })

/** Lỗi ở từng ô của form, khoá theo tên ô. */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

/**
 * Kiểm form đăng ký phía trình duyệt, kể cả ô "nhập lại mật khẩu" — ô này không gửi lên máy
 * chủ nên chỉ kiểm ở đây.
 */
export function validateSignUpForm(form: {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors<'fullName' | 'email' | 'password' | 'confirmPassword'> {
  const errors: FieldErrors<'fullName' | 'email' | 'password' | 'confirmPassword'> = {}
  const parsed = signUpSchema.safeParse({ ...form, intent: 'client' })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (field === 'fullName' || field === 'email' || field === 'password') {
        errors[field] ??= issue.message
      }
    }
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp.'
  }
  return errors
}

export function validateNewPasswordForm(form: {
  password: string
  confirmPassword: string
}): FieldErrors<'password' | 'confirmPassword'> {
  const errors: FieldErrors<'password' | 'confirmPassword'> = {}
  const parsed = updatePasswordSchema.safeParse({ password: form.password })
  if (!parsed.success) errors.password = parsed.error.issues[0]?.message
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp.'
  }
  return errors
}

/**
 * Câu tiếng Việt cho mã lỗi của Supabase Auth.
 *
 * Không đưa thẳng `error.message` của Supabase ra giao diện: câu đó bằng tiếng Anh, và một số
 * câu lộ chi tiết không nên lộ. Mã lạ rơi về câu chung.
 *
 * Nguồn danh sách mã: `@supabase/auth-js` — `lib/error-codes.d.ts`.
 */
const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  // Cố ý không phân biệt "sai email" với "sai mật khẩu" để không lộ email nào đã có tài khoản.
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  email_not_confirmed:
    'Bạn chưa xác nhận email. Mở hộp thư và bấm liên kết xác nhận, rồi đăng nhập lại nhé.',
  user_already_exists:
    'Email này đã có tài khoản. Bạn đăng nhập, hoặc dùng "Quên mật khẩu" nếu không nhớ mật khẩu.',
  email_exists:
    'Email này đã có tài khoản. Bạn đăng nhập, hoặc dùng "Quên mật khẩu" nếu không nhớ mật khẩu.',
  weak_password: `Mật khẩu quá dễ đoán. Bạn chọn mật khẩu dài hơn, ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
  same_password: 'Mật khẩu mới phải khác mật khẩu đang dùng.',
  over_email_send_rate_limit:
    'Bơ vừa gửi email cho địa chỉ này rồi. Bạn đợi vài phút rồi thử lại nhé.',
  over_request_rate_limit: 'Bạn thử quá nhiều lần. Đợi vài phút rồi thử lại nhé.',
  signup_disabled: 'Hiện chưa mở đăng ký tài khoản mới.',
  email_provider_disabled: 'Hiện chưa bật đăng nhập bằng email.',
  email_address_invalid: 'Email không hợp lệ.',
  session_not_found:
    'Phiên đặt lại mật khẩu đã hết hạn. Bạn yêu cầu một liên kết mới ở trang "Quên mật khẩu" nhé.',
}

export const GENERIC_AUTH_ERROR = 'Có lỗi khi xử lý tài khoản. Bạn thử lại sau một chút nhé.'

export function authErrorMessage(code: string | undefined): string {
  if (code === undefined) return GENERIC_AUTH_ERROR
  return AUTH_ERROR_MESSAGES[code] ?? GENERIC_AUTH_ERROR
}
