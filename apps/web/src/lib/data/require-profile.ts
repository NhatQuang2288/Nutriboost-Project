import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/supabase/server'

/**
 * Đã đăng nhập mà hồ sơ chưa thiết lập xong thì đưa qua onboarding.
 *
 * Vì sao cần: khi `/auth/callback` thấy `profiles.onboarded_at` là null, nó đưa người dùng qua
 * onboarding. Nhưng người dùng có thể vào thẳng `/hom-nay` bằng liên kết cũ hoặc bằng nút
 * Back — lúc đó lớp dữ liệu không đọc được hồ sơ nào nên rơi về **dữ liệu mẫu**, và người
 * dùng thấy số liệu của một người khác mà không có gì cho biết điều đó.
 *
 * Chưa cấu hình Supabase thì không làm gì: không có phiên, không có hồ sơ nào để thiết lập, và
 * chế độ dữ liệu mẫu là trạng thái đúng — bộ kiểm thử đầu-cuối chạy đúng ở chế độ này.
 *
 * Nhận `source` chứ không nhận cả `TodayView`: màn `/ke-hoach` và `/lich-tap` cần cùng hàng rào
 * này nhưng dữ liệu của chúng có hình dạng khác.
 */
export async function ensureProfileReady(source: 'demo' | 'live'): Promise<void> {
  if (source === 'live') return

  const user = await getSessionUser()
  if (user === null) return

  redirect('/onboarding')
}
