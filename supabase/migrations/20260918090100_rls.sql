-- ============================================================================
-- NutriBoost — 002: bảo mật cấp hàng (RLS)
--
-- Nguyên tắc:
--   1. Mọi bảng có dữ liệu người dùng đều BẬT RLS. Không có ngoại lệ.
--   2. Hàm phụ trợ là SECURITY DEFINER để tránh đệ quy chính sách.
--   3. `ai_calls`, `ai_cache`, `ai_rate_limits` KHÔNG có chính sách cho người dùng:
--      chỉ service role (chạy ở server) ghi được. Rò rỉ các bảng này sẽ lộ prompt
--      và chi phí, nên chúng cố tình không truy cập được từ trình duyệt.
--   4. Ghi nhật ký ăn uống vẫn dùng phiên của chính người dùng, KHÔNG dùng service role,
--      để RLS luôn là hàng rào cuối.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Hàm phụ trợ
-- ---------------------------------------------------------------------------

-- Không đặt tên `current_role` vì trùng hàm dựng sẵn của PostgreSQL.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'client')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

create or replace function public.is_pt_of(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pt_clients
    where pt_id = auth.uid()
      and client_id = target_client
      and status = 'active'
  )
$$;

comment on function public.is_pt_of(uuid) is
  'SECURITY DEFINER để chính sách trên pt_clients không đệ quy vào chính nó.';

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_pt_of(uuid) from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_pt_of(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Quyền truy cập bảng ở mức thô (RLS vẫn lọc tiếp từng hàng)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.health_profiles,
  public.consents,
  public.body_metrics,
  public.energy_targets,
  public.meal_logs,
  public.meal_log_items,
  public.activity_logs,
  public.plans,
  public.plan_items,
  public.chat_threads,
  public.chat_messages,
  public.ai_insights,
  public.daily_summaries,
  public.analytics_events,
  public.pt_clients
to authenticated;

-- Danh mục thực phẩm: mọi người dùng đã đăng nhập đọc được, chỉ admin ghi.
grant select on public.foods, public.food_aliases, public.dish_components to authenticated;

-- ai_calls: người dùng chỉ được đọc bản ghi của chính mình.
grant select on public.ai_calls to authenticated;

-- Không cấp quyền nào cho `anon`: sản phẩm yêu cầu đăng nhập.

-- ---------------------------------------------------------------------------
-- Bật RLS trên toàn bộ bảng
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.health_profiles   enable row level security;
alter table public.consents          enable row level security;
alter table public.body_metrics      enable row level security;
alter table public.energy_targets    enable row level security;
alter table public.foods             enable row level security;
alter table public.food_aliases      enable row level security;
alter table public.dish_components   enable row level security;
alter table public.ai_calls          enable row level security;
alter table public.meal_logs         enable row level security;
alter table public.meal_log_items    enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.plans             enable row level security;
alter table public.plan_items        enable row level security;
alter table public.chat_threads      enable row level security;
alter table public.chat_messages     enable row level security;
alter table public.ai_insights       enable row level security;
alter table public.daily_summaries   enable row level security;
alter table public.ai_rate_limits    enable row level security;
alter table public.ai_cache          enable row level security;
alter table public.pt_clients        enable row level security;
alter table public.analytics_events  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles — khoá theo `id`, không phải `user_id`
-- ---------------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.is_pt_of(id));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Bảng khoá theo `user_id` — dùng chung một khuôn chính sách
-- ---------------------------------------------------------------------------
create policy health_profiles_select on public.health_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy health_profiles_insert on public.health_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy health_profiles_update on public.health_profiles
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy health_profiles_delete on public.health_profiles
  for delete to authenticated using (user_id = auth.uid());

create policy consents_select on public.consents
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy consents_insert on public.consents
  for insert to authenticated with check (user_id = auth.uid());
create policy consents_update on public.consents
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy body_metrics_select on public.body_metrics
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy body_metrics_insert on public.body_metrics
  for insert to authenticated with check (user_id = auth.uid());
create policy body_metrics_update on public.body_metrics
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy body_metrics_delete on public.body_metrics
  for delete to authenticated using (user_id = auth.uid());

create policy energy_targets_select on public.energy_targets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy energy_targets_insert on public.energy_targets
  for insert to authenticated with check (user_id = auth.uid());
create policy energy_targets_update on public.energy_targets
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy energy_targets_delete on public.energy_targets
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Nhật ký ăn uống
-- PT được đọc nhật ký của khách hàng đang hoạt động (chuẩn bị cho Release 2).
-- ---------------------------------------------------------------------------
create policy meal_logs_select on public.meal_logs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy meal_logs_insert on public.meal_logs
  for insert to authenticated with check (user_id = auth.uid());
create policy meal_logs_update on public.meal_logs
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meal_logs_delete on public.meal_logs
  for delete to authenticated using (user_id = auth.uid());

-- Không có `user_id`: quyền suy ra từ bản ghi cha.
create policy meal_log_items_select on public.meal_log_items
  for select to authenticated
  using (
    exists (
      select 1 from public.meal_logs m
      where m.id = meal_log_id
        and (m.user_id = auth.uid() or public.is_admin() or public.is_pt_of(m.user_id))
    )
  );

create policy meal_log_items_insert on public.meal_log_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.meal_logs m
      where m.id = meal_log_id and m.user_id = auth.uid()
    )
  );

create policy meal_log_items_update on public.meal_log_items
  for update to authenticated
  using (
    exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid())
  );

create policy meal_log_items_delete on public.meal_log_items
  for delete to authenticated
  using (
    exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid())
  );

create policy activity_logs_select on public.activity_logs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy activity_logs_insert on public.activity_logs
  for insert to authenticated with check (user_id = auth.uid());
create policy activity_logs_update on public.activity_logs
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy activity_logs_delete on public.activity_logs
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Kế hoạch
-- ---------------------------------------------------------------------------
create policy plans_select on public.plans
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy plans_insert on public.plans
  for insert to authenticated with check (user_id = auth.uid());
create policy plans_update on public.plans
  for update to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id))
  with check (user_id = auth.uid() or public.is_pt_of(user_id));
create policy plans_delete on public.plans
  for delete to authenticated using (user_id = auth.uid());

create policy plan_items_select on public.plan_items
  for select to authenticated
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and (p.user_id = auth.uid() or public.is_admin() or public.is_pt_of(p.user_id))
    )
  );

create policy plan_items_write on public.plan_items
  for all to authenticated
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and (p.user_id = auth.uid() or public.is_pt_of(p.user_id))
    )
  )
  with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and (p.user_id = auth.uid() or public.is_pt_of(p.user_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Hội thoại với trợ lý
-- ---------------------------------------------------------------------------
create policy chat_threads_select on public.chat_threads
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy chat_threads_insert on public.chat_threads
  for insert to authenticated with check (user_id = auth.uid());
create policy chat_threads_update on public.chat_threads
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy chat_threads_delete on public.chat_threads
  for delete to authenticated using (user_id = auth.uid());

create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.chat_threads t
      where t.id = thread_id and (t.user_id = auth.uid() or public.is_admin())
    )
  );

create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.chat_threads t where t.id = thread_id and t.user_id = auth.uid())
  );

create policy chat_messages_delete on public.chat_messages
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Insight và tổng hợp ngày
-- ---------------------------------------------------------------------------
create policy ai_insights_select on public.ai_insights
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy ai_insights_insert on public.ai_insights
  for insert to authenticated with check (user_id = auth.uid());

create policy daily_summaries_select on public.daily_summaries
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
create policy daily_summaries_write on public.daily_summaries
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ai_calls: chỉ đọc được bản ghi của mình; KHÔNG tự chèn được.
-- Việc ghi do server thực hiện bằng service role, sau khi đã kiểm tra hạn mức.
-- ---------------------------------------------------------------------------
create policy ai_calls_select_own on public.ai_calls
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- ai_rate_limits và ai_cache: KHÔNG tạo chính sách nào.
-- RLS đã bật nên mặc định là từ chối toàn bộ với vai trò người dùng.
-- Service role bỏ qua RLS và là đường ghi duy nhất.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Danh mục thực phẩm
-- ---------------------------------------------------------------------------
create policy foods_select_all on public.foods
  for select to authenticated using (true);

create policy foods_write_admin on public.foods
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy food_aliases_select_all on public.food_aliases
  for select to authenticated using (true);

create policy food_aliases_write_admin on public.food_aliases
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy dish_components_select_all on public.dish_components
  for select to authenticated using (true);

create policy dish_components_write_admin on public.dish_components
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- PT ↔ khách hàng
-- Người dùng thấy quan hệ của chính mình; PT thấy danh sách khách của mình.
-- Chỉ admin được tạo/kết thúc quan hệ.
-- ---------------------------------------------------------------------------
create policy pt_clients_select on public.pt_clients
  for select to authenticated
  using (pt_id = auth.uid() or client_id = auth.uid() or public.is_admin());

create policy pt_clients_write_admin on public.pt_clients
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Sự kiện phân tích: người dùng chỉ ghi và đọc sự kiện của mình.
-- ---------------------------------------------------------------------------
create policy analytics_events_insert_own on public.analytics_events
  for insert to authenticated with check (user_id = auth.uid() or user_id is null);

create policy analytics_events_select_own on public.analytics_events
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
