-- ============================================================================
-- NutriBoost — 009: siết nốt hai hàm nhận `owner_id` tuỳ ý
--
-- Migration 006 siết bốn hàm `security definer`. Rà lại lần nữa thì còn **hai** hàm cùng
-- dạng: nhận một uuid của người khác và trả về thông tin về người đó. Cả hai được cấp cho
-- `authenticated`, nên bất kỳ người dùng nào cũng gọi được qua PostgREST.
--
-- Mức độ nhẹ hơn bốn hàm trước — không lộ dữ liệu sức khoẻ, chỉ lộ thông tin thương mại —
-- nhưng cùng một loại lỗi, và cùng một cách sửa. Sửa một nửa là để lại một nửa.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. remaining_client_slots(p_owner) — số chỗ trống của bất kỳ PT nào
--
-- Hệ quả: dò được một PT đang có bao nhiêu khách và gói của họ còn chỗ hay không. Là thông
-- tin thương mại giữa hai tài khoản, và cũng là cách dò xem một uuid có phải PT hay không.
--
-- Tầng ứng dụng KHÔNG cần hàm này: nó đã đọc `client_limit` từ `subscriptions` và đếm khách
-- đang hoạt động từ `pt_clients`, nên tự trừ được. `invite_code_status` gọi nó từ bên trong
-- và hàm đó là `security definer`, nên vẫn chạy được sau khi siết.
-- ---------------------------------------------------------------------------
revoke all on function public.remaining_client_slots(uuid) from public, anon, authenticated;
grant execute on function public.remaining_client_slots(uuid) to service_role;

comment on function public.remaining_client_slots(uuid) is
  'Nội bộ. KHÔNG cấp cho anon/authenticated: nhận owner_id tuỳ ý nên lộ tình trạng chỗ của PT khác.';

-- ---------------------------------------------------------------------------
-- 2. ai_turn_allowance(p_owner, p_client) — hạn mức AI của một cặp bất kỳ
--
-- Hàm trả 0 khi khách không thuộc PT, nên nó không lộ dữ liệu của người lạ hoàn toàn. Nhưng
-- nó vẫn cho phép dò: "uuid này có phải khách đang hoạt động của PT kia không, và hạn mức
-- của họ là bao nhiêu". Không có gì trong ứng dụng gọi nó.
-- ---------------------------------------------------------------------------
revoke all on function public.ai_turn_allowance(uuid, uuid) from public, anon, authenticated;
grant execute on function public.ai_turn_allowance(uuid, uuid) to service_role;

comment on function public.ai_turn_allowance(uuid, uuid) is
  'Nội bộ. KHÔNG cấp cho anon/authenticated: cho phép dò quan hệ PT ↔ khách của người khác.';

-- ---------------------------------------------------------------------------
-- Ghi chú: những hàm còn lại đã rà và CỐ TÌNH để mở
--
--   • `search_foods(text, integer)` — chỉ đọc danh mục thực phẩm, thứ mọi người dùng đã
--     đăng nhập đều đọc được qua `foods_select_all`.
--   • `purge_user_data()` — lấy người dùng từ `auth.uid()`.
--   • `complete_onboarding(...)`, `log_meal_with_items(...)`, `read_day_meals(...)`,
--     `complete_workout_session(...)` — tất cả lấy người dùng từ `auth.uid()` hoặc kiểm
--     quyền trong `where`.
--   • `generate_invite_code()`, `redeem_invite_code(text)`, `invite_code_status(uuid)` —
--     đã giới hạn vào chính người gọi.
--   • `current_user_role()`, `is_admin()`, `is_pt_of(uuid)` — hàm đọc vai trò của CHÍNH người
--     gọi, dùng trong chính sách RLS nên buộc phải gọi được.
-- ---------------------------------------------------------------------------
