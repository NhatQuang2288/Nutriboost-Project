-- ============================================================================
-- NutriBoost — 007: trạng thái mã mời cho cả danh sách
--
-- `invite_code_status(uuid)` ở migration 005 trả về trạng thái của **một** mã. Giao diện PT
-- cần trạng thái của mọi mã đang có, nên nếu giữ nguyên thì mỗi lần mở trang là N+1 truy vấn.
--
-- Cách sửa: cho `p_code_id` một giá trị mặc định. Gọi không tham số thì trả về toàn bộ mã
-- của người gọi; truyền id thì lọc còn một mã. Một hàm, một nguồn sự thật, hai cách dùng.
--
-- Phải `drop` trước vì `create or replace` không đổi được kiểu trả về (nay có thêm cột).
-- ============================================================================

drop function if exists public.invite_code_status(uuid);

create or replace function public.invite_code_status(p_code_id uuid default null)
returns table (
  id uuid,
  code text,
  note text,
  created_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  used_count integer,
  revoked_at timestamptz,
  usable boolean,
  reason text,
  remaining_slots integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_sub public.subscriptions;
  v_remaining integer;
begin
  if v_caller is null then
    return;
  end if;

  v_sub := public.active_subscription(v_caller);
  v_remaining := public.remaining_client_slots(v_caller);

  /*
   * `where c.pt_id = v_caller` là hàng rào quyền: hàm này là `security definer` nên bỏ qua
   * RLS, và chính điều kiện này mới là thứ ngăn người dùng xem mã của PT khác.
   *
   * Thứ tự các nhánh `case` có nghĩa: một mã đã thu hồi phải báo "đã thu hồi", kể cả khi
   * gói cũng đang đầy — nếu không, PT sẽ không hiểu vì sao mã không dùng được nữa.
   */
  return query
  select
    c.id,
    c.code,
    c.note,
    c.created_at,
    c.expires_at,
    c.max_uses,
    c.used_count,
    c.revoked_at,
    case
      when c.revoked_at is not null then false
      when c.expires_at <= now() then false
      when c.used_count >= c.max_uses then false
      when v_sub.client_limit is null then false
      when v_remaining <= 0 then false
      else true
    end,
    case
      when c.revoked_at is not null then 'revoked'
      when c.expires_at <= now() then 'expired'
      when c.used_count >= c.max_uses then 'used_up'
      -- Phân biệt "chưa mua gói" với "gói đã đầy": hai việc phải làm khác hẳn nhau.
      when v_sub.client_limit is null then 'no_plan'
      when v_remaining <= 0 then 'plan_full'
      else 'ok'
    end,
    v_remaining
  from public.invite_codes c
  where c.pt_id = v_caller
    and (p_code_id is null or c.id = p_code_id)
  order by c.created_at desc;
end;
$$;

revoke all on function public.invite_code_status(uuid) from public, anon, authenticated;
grant execute on function public.invite_code_status(uuid) to authenticated;

comment on function public.invite_code_status(uuid) is
  'Trạng thái mã mời của người gọi. Không tham số thì trả về toàn bộ; có tham số thì lọc một mã.';
