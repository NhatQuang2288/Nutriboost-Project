-- ============================================================================
-- NutriBoost — 004: gói dịch vụ cho PT/Coach
--
-- Bối cảnh: sản phẩm bán cho PT/Coach/Nutrition Expert theo 3 gói Plus / Premium /
-- Diamond, khác nhau ở **số khách hàng tối đa** (5 / 10 / 20) và giá
-- (750.000đ / 1.125.000đ / 1.800.000đ mỗi tháng). Xem docs/PRICING.md.
--
-- Vì hạn mức khách hàng là thứ duy nhất phân biệt ba gói, nó phải được **cưỡng chế
-- ở tầng CSDL**, không chỉ ở giao diện. Nếu chỉ chặn ở UI, một lệnh gọi API trực tiếp
-- sẽ vượt được hạn mức và làm hỏng mô hình doanh thu.
-- ============================================================================

create type public.plan_tier as enum ('trial', 'plus', 'premium', 'diamond');

create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'expired'
);

-- ---------------------------------------------------------------------------
-- Gói đăng ký của PT
--
-- Mỗi chủ tài khoản PT có tối đa một gói đang hiệu lực. Giá và hạn mức được
-- **sao chép vào bản ghi** thay vì tra bảng giá: khi bảng giá đổi, gói cũ giữ
-- nguyên điều khoản đã bán. Đây là cách tránh tranh chấp với khách đã trả tiền.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  tier public.plan_tier not null,
  status public.subscription_status not null default 'trialing',

  -- Điều khoản đã chốt tại thời điểm mua.
  price_vnd integer not null check (price_vnd >= 0),
  client_limit integer not null check (client_limit > 0),
  /** Số lượt gọi AI được bao gồm cho mỗi khách hàng mỗi tháng. */
  ai_turns_per_client integer not null default 0 check (ai_turns_per_client >= 0),

  current_period_start date not null,
  current_period_end date not null,
  trial_ends_at timestamptz,

  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint period_order check (current_period_end > current_period_start)
);

create index subscriptions_owner_idx on public.subscriptions (owner_id, status);
create index subscriptions_period_end_idx on public.subscriptions (current_period_end)
  where status in ('trialing', 'active', 'past_due');

create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

comment on column public.subscriptions.client_limit is
  'Số khách hàng tối đa của gói. Được cưỡng chế bằng trigger trên pt_clients.';
comment on column public.subscriptions.ai_turns_per_client is
  'Hạn mức AI đi kèm mỗi khách hàng. Là ràng buộc kinh tế: xem phân tích biên trong docs/PRICING.md.';

-- ---------------------------------------------------------------------------
-- Bảng giá tham chiếu — dùng khi tạo gói mới, KHÔNG dùng khi đọc gói đã bán
-- ---------------------------------------------------------------------------
create or replace function public.default_client_limit(p_tier public.plan_tier)
returns integer
language sql
immutable
as $$
  select case p_tier
    when 'trial'   then 2
    when 'plus'    then 5
    when 'premium' then 10
    when 'diamond' then 20
  end
$$;

create or replace function public.default_price_vnd(p_tier public.plan_tier)
returns integer
language sql
immutable
as $$
  select case p_tier
    when 'trial'   then 0
    when 'plus'    then 750000
    when 'premium' then 1125000
    when 'diamond' then 1800000
  end
$$;

/**
 * Hạn mức lượt AI đi kèm mỗi khách hàng mỗi tháng.
 *
 * Con số này quyết định biên lợi nhuận. Phân tích trong docs/PRICING.md cho thấy
 * nếu không có trần, chi phí AI ở gói Diamond có thể chiếm hơn một nửa doanh thu.
 * 600 lượt/khách/tháng tương ứng khoảng 20 lượt mỗi ngày — đủ dùng thoải mái.
 */
create or replace function public.default_ai_turns(p_tier public.plan_tier)
returns integer
language sql
immutable
as $$
  select case p_tier
    when 'trial'   then 100
    when 'plus'    then 600
    when 'premium' then 600
    when 'diamond' then 600
  end
$$;

-- ---------------------------------------------------------------------------
-- Gói đang hiệu lực của một chủ tài khoản
-- ---------------------------------------------------------------------------
create or replace function public.active_subscription(p_owner uuid)
returns public.subscriptions
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.subscriptions s
  where s.owner_id = p_owner
    and s.status in ('trialing', 'active', 'past_due')
    and s.current_period_end >= current_date
  order by s.current_period_end desc
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Cưỡng chế hạn mức khách hàng
--
-- Đếm số khách đang hoạt động của PT và từ chối nếu đã chạm trần của gói.
-- Đây là hàng rào bảo vệ doanh thu, nên phải nằm ở CSDL.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_client_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_active integer;
begin
  -- Chỉ áp khi quan hệ đang ở trạng thái hoạt động.
  if new.status <> 'active' then
    return new;
  end if;

  -- Bỏ qua khi cập nhật một quan hệ đã hoạt động từ trước.
  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  v_limit := public.active_subscription(new.pt_id).client_limit;

  if v_limit is null then
    raise exception 'Tài khoản PT chưa có gói đang hiệu lực.'
      using errcode = 'check_violation';
  end if;

  select count(*) into v_active
  from public.pt_clients
  where pt_id = new.pt_id and status = 'active';

  if v_active >= v_limit then
    raise exception 'Đã đạt giới hạn % khách hàng của gói hiện tại.', v_limit
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger pt_clients_enforce_limit
  before insert or update on public.pt_clients
  for each row execute function public.enforce_client_limit();

-- ---------------------------------------------------------------------------
-- Bảo mật cấp hàng
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

grant select on public.subscriptions to authenticated;

-- Chủ tài khoản đọc được gói của mình. Việc tạo và sửa gói do service role thực hiện
-- sau khi cổng thanh toán xác nhận — không có chính sách insert/update cho người dùng.
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Hàm tiện ích cho tầng ứng dụng
-- ---------------------------------------------------------------------------

/** Số khách hàng còn được thêm theo gói hiện tại. Trả về 0 nếu không có gói. */
create or replace function public.remaining_client_slots(p_owner uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_active integer;
begin
  v_limit := public.active_subscription(p_owner).client_limit;
  if v_limit is null then
    return 0;
  end if;

  select count(*) into v_active
  from public.pt_clients
  where pt_id = p_owner and status = 'active';

  return greatest(0, v_limit - v_active);
end;
$$;

grant execute on function public.remaining_client_slots(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lượt AI theo hợp đồng
--
-- Tầng ứng dụng dùng hạn mức này thay cho trần mặc định toàn hệ thống, để PT trả
-- tiền nhận đúng số lượt đã mua.
-- ---------------------------------------------------------------------------
create or replace function public.ai_turn_allowance(p_owner uuid, p_client uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
  v_linked boolean;
begin
  v_sub := public.active_subscription(p_owner);
  if v_sub.client_limit is null then
    return 0;
  end if;

  select exists (
    select 1 from public.pt_clients
    where pt_id = p_owner and client_id = p_client and status = 'active'
  ) into v_linked;

  if not v_linked then
    return 0;
  end if;

  return v_sub.ai_turns_per_client;
end;
$$;

grant execute on function public.ai_turn_allowance(uuid, uuid) to authenticated;

comment on function public.ai_turn_allowance(uuid, uuid) is
  'Hạn mức lượt AI mỗi tháng cho một khách hàng thuộc một PT. Trả 0 nếu không có quan hệ hoạt động.';
