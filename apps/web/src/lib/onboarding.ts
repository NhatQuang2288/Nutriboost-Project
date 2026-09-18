/**
 * Hằng số dùng chung giữa màn onboarding (client) và Server Action lưu hồ sơ.
 *
 * Vì sao cần một tệp riêng: tốc độ giảm/tăng cân mặc định của onboarding là một **quyết định
 * sản phẩm** — 0,35 kg mỗi tuần, mức nhẹ nhàng — chứ không phải hằng số của lõi dinh dưỡng
 * (`DEFAULT_RATE_KG_PER_WEEK` trong `@nutriboost/nutrition` là 0,5).
 *
 * Hai bên từng lệch nhau, và hậu quả là người dùng nhìn thấy một con số rồi ứng dụng lưu một
 * con số khác: màn kết quả onboarding tính bằng 0,35, còn Server Action mặc định 0,5. Không
 * test nào bắt được, vì bộ E2E chạy ở chế độ dữ liệu mẫu nên Server Action trả về sớm.
 *
 * Đặt ở đây để chỉ còn **một** chỗ khai báo, và cả hai phía đều đọc nó.
 */
export const ONBOARDING_RATE_KG_PER_WEEK = 0.35

/** `maintain` bỏ qua tốc độ, nên gửi 0 cho gọn thay vì `undefined`. */
export function rateForGoal(goal: 'lose' | 'maintain' | 'gain'): number {
  return goal === 'maintain' ? 0 : ONBOARDING_RATE_KG_PER_WEEK
}
