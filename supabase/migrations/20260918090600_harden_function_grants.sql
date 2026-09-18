-- ============================================================================
-- NutriBoost — 006: siết quyền gọi hàm
--
-- PostgreSQL cấp `EXECUTE` cho `PUBLIC` trên **mọi hàm mới theo mặc định**. Với hàm
-- `security definer`, điều đó có nghĩa là bất kỳ ai cũng gọi được chúng qua PostgREST,
-- kể cả khi không có quyền nào trên những bảng mà chúng đọc ghi — vì hàm chạy bằng quyền
-- của chủ sở hữu.
--
-- Bốn hàm dưới đây rơi đúng vào trường hợp đó. Không hàm nào trong chúng kiểm tra người
-- gọi có phải là người mà tham số trỏ tới hay không.
--
-- Vì sao không sửa thẳng migration cũ: chúng đã chạy trên CSDL phát triển của mỗi người.
-- Một migration mới là cách duy nhất sửa được mà vẫn chạy lại được từ đầu bằng `db:reset`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Gói dịch vụ của bất kỳ PT nào
--
-- `active_subscription(p_owner)` nhận owner_id tuỳ ý và trả về **cả hàng** `subscriptions`:
-- bậc gói, giá đã chốt, hạn mức khách, ngày hết hạn. Hệ quả: một người dùng bất kỳ đọc
-- được điều khoản thương mại của mọi PT khác, và dò được một uuid có phải PT hay không.
--
-- Không phải dữ liệu sức khoẻ, nhưng vẫn là rò rỉ giữa các tài khoản.
--
-- Chỉ các hàm `security definer` khác dùng nó, nên không cần cấp cho vai trò nào.
-- ---------------------------------------------------------------------------
revoke all on function public.active_subscription(uuid) from public, anon, authenticated;

comment on function public.active_subscription(uuid) is
  'Nội bộ. KHÔNG cấp cho anon/authenticated: nhận owner_id tuỳ ý nên sẽ lộ điều khoản gói của PT khác.';

-- ---------------------------------------------------------------------------
-- 2. Hạn mức AI — hai lỗ trong một hàm
--
-- `claim_ai_quota(p_user_id, p_purpose, p_limit)` nhận **cả người dùng lẫn hạn mức** từ
-- người gọi. Hai hệ quả, cái thứ hai nghiêm trọng hơn nhiều:
--
--   a. Đốt hết lượt AI trong ngày của người khác — từ chối dịch vụ.
--   b. **Tự nâng hạn mức của chính mình** bằng cách truyền `p_limit` lớn. Trần lượt AI là
--      ràng buộc kinh tế trung tâm của docs/PRICING.md; gọi hàm này trực tiếp là vô hiệu
--      hoá nó hoàn toàn.
--
-- Tầng ứng dụng gọi qua khoá service role (xem `AiStore` trong packages/ai), nên chỉ cấp
-- cho `service_role`.
-- ---------------------------------------------------------------------------
revoke all on function public.claim_ai_quota(uuid, public.ai_purpose, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_quota(uuid, public.ai_purpose, integer)
  to service_role;

comment on function public.claim_ai_quota(uuid, public.ai_purpose, integer) is
  'Chỉ service_role. Nhận user_id và hạn mức từ người gọi nên không được để lộ ra ngoài.';

-- ---------------------------------------------------------------------------
-- 3. Tổng hợp ngày của người dùng bất kỳ
--
-- `refresh_daily_summary(p_user_id, p_local_date)` là `security definer` và **không kiểm tra
-- người gọi có phải `p_user_id`**. Một người dùng gọi thẳng hàm này sẽ ghi đè
-- `daily_summaries` của người khác: chuỗi ngày, độ tuân thủ, kcal nạp vào.
--
-- Không đọc trộm được gì (RLS trên `daily_summaries` vẫn chặn đọc), nhưng sửa được số liệu
-- của người khác — và đó là loại lỗi người dùng phát hiện muộn nhất.
--
-- Chỉ service_role gọi trực tiếp. `complete_workout_session` gọi nó từ bên trong: hàm đó
-- đã kiểm tra `auth.uid()` và là `security definer`, nên vẫn chạy được sau khi siết quyền.
-- ---------------------------------------------------------------------------
revoke all on function public.refresh_daily_summary(uuid, date) from public, anon, authenticated;
grant execute on function public.refresh_daily_summary(uuid, date) to service_role;

comment on function public.refresh_daily_summary(uuid, date) is
  'Chỉ service_role hoặc hàm đã kiểm tra chủ sở hữu. Không kiểm tra người gọi nên không cấp trực tiếp.';

-- ---------------------------------------------------------------------------
-- 4. Tính lại chỉ số của bất kỳ món nào
--
-- `recompute_dish_nutrients(p_dish_id)` là `security definer` nên bỏ qua RLS: người dùng
-- thường sửa được dữ liệu của bảng mà chính sách chỉ cho quản trị viên ghi.
--
-- Phép tính là tất định nên không tạo ra số liệu sai tuỳ ý, nhưng vẫn là một đường ghi
-- không cần thiết. Chỉ công cụ seed và quản trị viên dùng.
-- ---------------------------------------------------------------------------
revoke all on function public.recompute_dish_nutrients(uuid) from public, anon, authenticated;
grant execute on function public.recompute_dish_nutrients(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Ghi chú về những hàm CỐ TÌNH không siết
--
--   • `touch_updated_at()` chạy như hàm trigger **theo quyền người gọi**. Thu hồi EXECUTE
--     khỏi nó sẽ làm mọi lệnh insert/update của người dùng đổ lỗi "permission denied for
--     function", vì đó là một phần của quá trình ghi bảng. Đây là cái bẫy dễ mắc nhất khi
--     siết quyền hàm trong PostgreSQL.
--   • `purge_user_data()` lấy người dùng từ `auth.uid()`, không từ tham số. Không có gì để
--     lợi dụng.
--   • `complete_workout_session(uuid[], date)` lọc `p.user_id = auth.uid()` trong truy vấn,
--     nên chỉ ghi được vào kế hoạch tập của chính người gọi.
--   • `search_foods(text, integer)` chỉ đọc danh mục thực phẩm — thứ mọi người dùng đã
--     đăng nhập đều đọc được qua RLS (`foods_select_all`).
-- ---------------------------------------------------------------------------
