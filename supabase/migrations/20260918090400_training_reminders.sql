-- ============================================================================
-- NutriBoost — 005: lịch tập và nhắc nhở khách hàng
--
-- Hai tính năng này nằm trong bảng giá PT: "Quản lý lịch tập" (600.000đ/tháng) và
-- "Nhắc nhở tự động" (220.000đ/tháng). Xem docs/PRICING.md.
--
-- Cùng nguyên tắc với dữ liệu món ăn: kcal đốt của buổi tập lưu vào bảng để cộng được
-- vào ngân sách năng lượng trong ngày, và **thời điểm nhắc là dữ liệu**, không phải
-- logic nằm rải rác trong mã.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Danh mục bài tập
--
-- Cùng mô hình với `foods`: dữ liệu tham chiếu, mọi người đọc được, chỉ admin ghi.
-- ---------------------------------------------------------------------------
create type public.muscle_group as enum (
  'chest', 'back', 'legs', 'glutes', 'shoulders', 'arms',
  'core', 'cardio', 'mobility', 'full_body'
);

create type public.exercise_equipment as enum (
  'bodyweight', 'dumbbell', 'barbell', 'machine', 'band', 'cardio_machine'
);

create type public.exercise_level as enum ('beginner', 'intermediate', 'advanced');

create type public.exercise_measure as enum ('reps', 'time');

create type public.injury_area as enum ('knee', 'lower_back', 'shoulder', 'wrist', 'ankle');

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_vi text not null,
  muscle_group public.muscle_group not null,
  equipment public.exercise_equipment not null default 'bodyweight',
  level public.exercise_level not null default 'beginner',
  measure public.exercise_measure not null default 'reps',

  -- MET là nguồn chân lý để tính kcal đốt; không được để model tự đoán.
  met numeric(4, 1) not null check (met > 1 and met <= 20),

  contraindications public.injury_area[] not null default '{}',
  cue text,
  source_ref text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_group_idx on public.exercises (muscle_group);
create index exercises_equipment_idx on public.exercises (equipment);

create trigger exercises_touch
  before update on public.exercises
  for each row execute function public.touch_updated_at();

comment on column public.exercises.contraindications is
  'Vùng chấn thương cần tránh bài này. Bộ dựng lịch tập lọc tất định theo trường này.';

-- ---------------------------------------------------------------------------
-- Lịch tập
-- ---------------------------------------------------------------------------
create type public.workout_plan_status as enum ('draft', 'active', 'archived');

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  status public.workout_plan_status not null default 'draft',

  /** Số buổi mỗi tuần đã dùng để dựng — cần cho việc dựng lại và đối chiếu. */
  days_per_week integer not null check (days_per_week between 2 and 6),
  session_minutes integer not null check (session_minutes between 15 and 120),

  /** Tổng kcal đốt cả tuần, tính sẵn để cộng vào ngân sách năng lượng. */
  weekly_kcal integer not null default 0 check (weekly_kcal >= 0),

  notes text[] not null default '{}',
  generated_by text not null default 'deterministic'
    check (generated_by in ('deterministic', 'ai')),
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.workout_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  scheduled_on date not null,
  /** 1 = buổi thứ nhất trong ngày, dùng khi có hai buổi cùng ngày. */
  session_index integer not null default 1 check (session_index >= 1),
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  sets integer not null default 1 check (sets between 1 and 10),
  reps text,
  seconds integer check (seconds is null or seconds between 5 and 3600),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 600),
  estimated_kcal integer not null default 0 check (estimated_kcal >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index workout_plan_items_plan_date_idx
  on public.workout_plan_items (plan_id, scheduled_on, session_index, position);

comment on table public.workout_plan_items is
  'kcal đốt lưu sẵn ở đây để cộng vào daily_summaries.kcal_out mà không phải tính lại.';

-- ---------------------------------------------------------------------------
-- Nhắc nhở
--
-- Thời điểm là DỮ LIỆU, không phải logic trong mã: PT đổi giờ nhắc thì chỉ sửa một dòng.
-- ---------------------------------------------------------------------------
create type public.reminder_kind as enum (
  'log_meal', 'weigh_in', 'workout', 'hydration', 'weekly_checkin'
);

create type public.reminder_channel as enum ('push', 'email', 'in_app');

create type public.reminder_status as enum ('sent', 'failed', 'skipped');

create table public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reminder_kind not null,

  /** Giờ địa phương dạng HH:mm, theo profiles.timezone. */
  time_of_day text not null check (time_of_day ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),

  /** 0 = Chủ nhật … 6 = Thứ bảy. */
  days smallint[] not null default '{1,2,3,4,5,6,0}'
    check (array_length(days, 1) between 1 and 7),

  enabled boolean not null default true,
  channel public.reminder_channel not null default 'push',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, channel)
);

create trigger reminder_rules_touch
  before update on public.reminder_rules
  for each row execute function public.touch_updated_at();

comment on column public.reminder_rules.time_of_day is
  'Giờ địa phương. Hàm decideReminder trong packages/ai quyết định gửi hay không, kèm lý do.';

create table public.reminder_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reminder_kind not null,
  local_date date not null,
  status public.reminder_status not null,
  /** Lý do khi bỏ qua, hoặc thông báo lỗi khi gửi thất bại. */
  reason text,
  message text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Chỉ mục này là thứ chống gửi trùng: mỗi luật chỉ gửi tối đa một lần mỗi ngày.
create unique index reminder_log_once_per_day_idx
  on public.reminder_log (user_id, kind, local_date)
  where status = 'sent';

create index reminder_log_user_date_idx on public.reminder_log (user_id, local_date desc);

comment on index public.reminder_log_once_per_day_idx is
  'Ràng buộc chống gửi trùng ở tầng CSDL, không phụ thuộc vào việc bộ lập lịch nhớ được.';

-- ---------------------------------------------------------------------------
-- Ghi hoạt động tập luyện vào nhật ký vận động
--
-- Buổi tập đã hoàn thành phải chảy vào `activity_logs` để kcal đốt được cộng vào
-- ngân sách năng lượng trong ngày. Hàm này làm việc đó một cách nguyên tử.
-- ---------------------------------------------------------------------------
create or replace function public.complete_workout_session(
  p_plan_item_ids uuid[],
  p_local_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_kcal integer;
  v_minutes integer;
  v_met numeric;
begin
  if v_user is null then
    raise exception 'Cần đăng nhập';
  end if;

  select
    coalesce(sum(i.estimated_kcal), 0)::integer,
    coalesce(sum(i.sets * (coalesce(i.seconds, 45) + i.rest_seconds)), 0)::integer / 60,
    coalesce(avg(e.met), 3.5)
  into v_kcal, v_minutes, v_met
  from public.workout_plan_items i
  join public.workout_plans p on p.id = i.plan_id
  join public.exercises e on e.id = i.exercise_id
  where i.id = any (p_plan_item_ids)
    and p.user_id = v_user;

  if v_kcal = 0 then
    return 0;
  end if;

  update public.workout_plan_items
  set completed_at = now()
  where id = any (p_plan_item_ids)
    and completed_at is null;

  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, now(), p_local_date, 'strength', greatest(v_minutes, 1), v_met, v_kcal, 'manual'
  );

  perform public.refresh_daily_summary(v_user, p_local_date);
  return v_kcal;
end;
$$;

grant execute on function public.complete_workout_session(uuid[], date) to authenticated;

-- ---------------------------------------------------------------------------
-- Bảo mật cấp hàng
-- ---------------------------------------------------------------------------
alter table public.exercises           enable row level security;
alter table public.workout_plans       enable row level security;
alter table public.workout_plan_items  enable row level security;
alter table public.reminder_rules      enable row level security;
alter table public.reminder_log        enable row level security;

grant select on public.exercises to authenticated;
grant select, insert, update, delete on
  public.workout_plans,
  public.workout_plan_items,
  public.reminder_rules
to authenticated;
grant select on public.reminder_log to authenticated;

-- Danh mục bài tập: đọc cho mọi người, ghi chỉ admin.
create policy exercises_select_all on public.exercises
  for select to authenticated using (true);

create policy exercises_write_admin on public.exercises
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Lịch tập: chủ sở hữu và PT phụ trách.
create policy workout_plans_select on public.workout_plans
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));

create policy workout_plans_insert on public.workout_plans
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_pt_of(user_id));

create policy workout_plans_update on public.workout_plans
  for update to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id))
  with check (user_id = auth.uid() or public.is_pt_of(user_id));

create policy workout_plans_delete on public.workout_plans
  for delete to authenticated using (user_id = auth.uid());

create policy workout_plan_items_select on public.workout_plan_items
  for select to authenticated
  using (
    exists (
      select 1 from public.workout_plans p
      where p.id = plan_id
        and (p.user_id = auth.uid() or public.is_admin() or public.is_pt_of(p.user_id))
    )
  );

create policy workout_plan_items_write on public.workout_plan_items
  for all to authenticated
  using (
    exists (
      select 1 from public.workout_plans p
      where p.id = plan_id and (p.user_id = auth.uid() or public.is_pt_of(p.user_id))
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans p
      where p.id = plan_id and (p.user_id = auth.uid() or public.is_pt_of(p.user_id))
    )
  );

-- Nhắc nhở: người dùng tự quản luật của mình; PT được xem để hỗ trợ khách.
create policy reminder_rules_select on public.reminder_rules
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));

create policy reminder_rules_write on public.reminder_rules
  for all to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id))
  with check (user_id = auth.uid() or public.is_pt_of(user_id));

-- Lịch sử gửi: người dùng đọc được để biết vì sao có hay không có nhắc.
-- Việc ghi do tiến trình nền thực hiện bằng service role, nên không có chính sách insert.
create policy reminder_log_select on public.reminder_log
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_pt_of(user_id));
