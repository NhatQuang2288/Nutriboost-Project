-- ============================================================================
-- NutriBoost — 001: phần mở rộng, kiểu enum, bảng, chỉ mục
--
-- Quy ước:
--   • Mọi bảng chứa dữ liệu người dùng đều có `user_id` để RLS áp được chính sách đơn giản.
--   • Thời điểm lưu bằng `timestamptz`; `local_date` được tính theo `profiles.timezone`
--     để tránh lỗi lệch ngày khi qua nửa đêm.
--   • Số liệu dinh dưỡng lưu theo 100 g, khớp `packages/nutrition`.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Hàm bọc unaccent để dùng được trong cột sinh (generated column).
--
-- `unaccent()` mặc định không phải IMMUTABLE nên không dùng trực tiếp được.
-- Thay thêm `đ/Đ` tường minh để không phụ thuộc vào bảng luật của từng phiên bản.
-- ---------------------------------------------------------------------------
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.unaccent('public.unaccent', $1)
$$;

create or replace function public.vietnamese_key(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select lower(public.immutable_unaccent(replace(replace($1, 'đ', 'd'), 'Đ', 'D')))
$$;

comment on function public.vietnamese_key(text) is
  'Khoá tìm kiếm tiếng Việt: bỏ dấu, đ→d, chữ thường. Phải khớp normalizeVi() trong packages/nutrition.';

-- ---------------------------------------------------------------------------
-- Kiểu enum
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('client', 'pt', 'admin');

create type public.sex_type as enum ('male', 'female');

create type public.activity_level as enum (
  'sedentary', 'light', 'moderate', 'active', 'very_active'
);

create type public.goal_type as enum ('lose', 'maintain', 'gain');

create type public.medical_flag as enum (
  'diabetes', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease',
  'pregnancy', 'breastfeeding', 'eating_disorder', 'gout', 'thyroid'
);

create type public.food_kind as enum ('ingredient', 'dish');

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create type public.log_source as enum (
  'ai_chat', 'quick_chip', 'repeat', 'manual', 'photo', 'voice'
);

create type public.match_method as enum ('exact', 'trigram', 'ai', 'user');

create type public.plan_status as enum ('draft', 'active', 'archived');

create type public.plan_item_status as enum ('suggested', 'accepted', 'swapped', 'skipped');

create type public.ai_purpose as enum (
  'parse_meal', 'estimate_meal', 'generate_plan', 'chat', 'insight', 'title'
);

create type public.ai_call_status as enum (
  'ok', 'error', 'rate_limited', 'blocked', 'timeout'
);

create type public.consent_kind as enum ('terms', 'health_data', 'ai_processing');

create type public.chat_role as enum ('user', 'assistant', 'system', 'tool');

-- ---------------------------------------------------------------------------
-- Cập nhật `updated_at` tự động
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hồ sơ người dùng
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  locale text not null default 'vi',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.timezone is
  'Múi giờ dùng để tính local_date cho nhật ký ăn uống. Mặc định Asia/Ho_Chi_Minh.';

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Hồ sơ sức khoẻ
-- Lưu ngày sinh thay vì tuổi — tuổi được suy ra ở tầng ứng dụng để không bị lệch theo thời gian.
-- ---------------------------------------------------------------------------
create table public.health_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  sex public.sex_type not null,
  date_of_birth date not null check (date_of_birth > '1900-01-01'),
  height_cm numeric(5, 1) not null check (height_cm between 80 and 250),
  activity_level public.activity_level not null default 'light',
  goal public.goal_type not null default 'maintain',
  target_weight_kg numeric(5, 1) check (target_weight_kg between 20 and 400),
  rate_kg_per_week numeric(3, 2) not null default 0.50
    check (rate_kg_per_week >= 0 and rate_kg_per_week <= 1),
  dietary_prefs text[] not null default '{}',
  allergies text[] not null default '{}',
  medical_flags public.medical_flag[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger health_profiles_touch
  before update on public.health_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Đồng ý xử lý dữ liệu
-- Bắt buộc trước lần gọi AI đầu tiên, vì dữ liệu sức khoẻ là dữ liệu cá nhân nhạy cảm.
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.consent_kind not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, kind, version)
);

-- ---------------------------------------------------------------------------
-- Chỉ số cơ thể theo thời gian
-- ---------------------------------------------------------------------------
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 400),
  waist_cm numeric(5, 1) check (waist_cm between 30 and 300),
  source public.log_source not null default 'manual',
  created_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create index body_metrics_user_date_idx
  on public.body_metrics (user_id, measured_on desc);

-- ---------------------------------------------------------------------------
-- Mục tiêu năng lượng — có hiệu lực theo ngày, giữ lại lịch sử
-- ---------------------------------------------------------------------------
create table public.energy_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  effective_from date not null,
  bmr_kcal integer not null check (bmr_kcal > 0),
  tdee_kcal integer not null check (tdee_kcal > 0),
  target_kcal integer not null check (target_kcal > 0),
  protein_g integer not null check (protein_g >= 0),
  carb_g integer not null check (carb_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  formula_version text not null,
  inputs jsonb not null default '{}'::jsonb,
  floors_applied text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, effective_from)
);

comment on column public.energy_targets.floors_applied is
  'Các yếu tố biên đã can thiệp (deficit_cap, bmr_floor, …). Dùng để giải thích cho người dùng.';

-- ---------------------------------------------------------------------------
-- Thực phẩm: nguyên liệu thô và món ăn
-- ---------------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_vi text not null,
  name_en text,
  kind public.food_kind not null default 'ingredient',
  category text,
  serving_name text,
  serving_grams numeric(6, 1) check (serving_grams > 0),
  kcal_per_100g numeric(6, 1) not null check (kcal_per_100g >= 0),
  protein_g numeric(5, 1) not null default 0 check (protein_g >= 0),
  carb_g numeric(5, 1) not null default 0 check (carb_g >= 0),
  fat_g numeric(5, 1) not null default 0 check (fat_g >= 0),
  fiber_g numeric(5, 1) not null default 0 check (fiber_g >= 0),
  sugar_g numeric(5, 1) not null default 0 check (sugar_g >= 0),
  sodium_mg numeric(8, 1) not null default 0 check (sodium_mg >= 0),
  source_ref text,
  verified boolean not null default false,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.foods
  add column name_key text
  generated always as (public.vietnamese_key(name_vi)) stored;

create index foods_name_key_trgm_idx on public.foods using gin (name_key gin_trgm_ops);
create index foods_kind_idx on public.foods (kind);
create index foods_category_idx on public.foods (category);

create trigger foods_touch
  before update on public.foods
  for each row execute function public.touch_updated_at();

comment on column public.foods.source_ref is
  'Nguồn số liệu, ví dụ "Bảng thành phần dinh dưỡng thực phẩm Việt Nam 2007, tr. 42".';

-- ---------------------------------------------------------------------------
-- Bí danh tên món — nơi xử lý các biến thể địa phương, không nhồi vào code
-- ---------------------------------------------------------------------------
create table public.food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  alias text not null,
  alias_key text generated always as (public.vietnamese_key(alias)) stored,
  unique (food_id, alias)
);

create index food_aliases_key_trgm_idx
  on public.food_aliases using gin (alias_key gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Thành phần của món ăn
-- Món Việt được biểu diễn bằng thành phần × gram để tính được calo một cách tất định.
-- ---------------------------------------------------------------------------
create table public.dish_components (
  dish_id uuid not null references public.foods (id) on delete cascade,
  ingredient_id uuid not null references public.foods (id) on delete restrict,
  grams numeric(6, 1) not null check (grams > 0),
  primary key (dish_id, ingredient_id),
  constraint dish_not_self check (dish_id <> ingredient_id)
);

-- ---------------------------------------------------------------------------
-- Nhật ký ăn uống
-- ---------------------------------------------------------------------------
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  purpose public.ai_purpose not null,
  model text not null,
  prompt_version text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cached_tokens integer not null default 0 check (cached_tokens >= 0),
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  status public.ai_call_status not null default 'ok',
  error_code text,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create index ai_calls_user_created_idx on public.ai_calls (user_id, created_at desc);
create index ai_calls_purpose_created_idx on public.ai_calls (purpose, created_at desc);

comment on table public.ai_calls is
  'Mọi lời gọi AI đều ghi ở đây. Đây là nguồn dữ liệu duy nhất cho bảng chi phí.';

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  local_date date not null,
  meal_type public.meal_type not null,
  source public.log_source not null default 'manual',
  raw_input text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  ai_confidence numeric(3, 2) check (ai_confidence between 0 and 1),
  total_kcal integer not null default 0 check (total_kcal >= 0),
  total_protein_g numeric(6, 1) not null default 0 check (total_protein_g >= 0),
  total_carb_g numeric(6, 1) not null default 0 check (total_carb_g >= 0),
  total_fat_g numeric(6, 1) not null default 0 check (total_fat_g >= 0),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index meal_logs_user_date_idx on public.meal_logs (user_id, local_date);
create index meal_logs_user_eaten_idx on public.meal_logs (user_id, eaten_at desc);

create table public.meal_log_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs (id) on delete cascade,
  food_id uuid references public.foods (id) on delete set null,
  display_name text not null,
  grams numeric(6, 1) not null check (grams >= 0),
  kcal numeric(7, 1) not null default 0 check (kcal >= 0),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  carb_g numeric(6, 1) not null default 0 check (carb_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  match_method public.match_method not null default 'user',
  match_score numeric(4, 3) check (match_score between 0 and 1),
  created_at timestamptz not null default now()
);

create index meal_log_items_log_idx on public.meal_log_items (meal_log_id);
create index meal_log_items_food_idx on public.meal_log_items (food_id);

comment on column public.meal_log_items.food_id is
  'NULL khi người dùng nhập món chưa có trong CSDL. Dòng này được ghi lại để bổ sung dữ liệu sau.';

-- ---------------------------------------------------------------------------
-- Nhật ký vận động
-- ---------------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  performed_at timestamptz not null default now(),
  local_date date not null,
  activity_code text not null,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  met numeric(4, 2) not null check (met > 0),
  kcal_burned integer not null check (kcal_burned >= 0),
  source public.log_source not null default 'manual',
  created_at timestamptz not null default now()
);

create index activity_logs_user_date_idx on public.activity_logs (user_id, local_date);

-- ---------------------------------------------------------------------------
-- Kế hoạch tuần do AI sinh
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  status public.plan_status not null default 'draft',
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  plan_date date not null,
  meal_type public.meal_type not null,
  food_id uuid references public.foods (id) on delete set null,
  display_name text not null,
  grams numeric(6, 1) not null check (grams > 0),
  kcal numeric(7, 1) not null default 0 check (kcal >= 0),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  carb_g numeric(6, 1) not null default 0 check (carb_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  status public.plan_item_status not null default 'suggested',
  rationale text,
  created_at timestamptz not null default now()
);

create index plan_items_plan_date_idx on public.plan_items (plan_id, plan_date, meal_type);

-- ---------------------------------------------------------------------------
-- Hội thoại với trợ lý Bơ
-- ---------------------------------------------------------------------------
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Cuộc trò chuyện mới',
  title_source text not null default 'default' check (title_source in ('default', 'ai', 'user')),
  pinned boolean not null default false,
  last_message_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index chat_threads_user_idx
  on public.chat_threads (user_id, pinned desc, last_message_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.chat_role not null,
  parts jsonb not null default '[]'::jsonb,
  text_content text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  created_at timestamptz not null default now()
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

comment on table public.chat_messages is
  'Lưu dạng `parts` giống UIMessage của AI SDK để dựng lại được generative UI khi mở lại hội thoại.';

-- ---------------------------------------------------------------------------
-- Insight hằng ngày — mỗi người dùng tối đa một bản ghi mỗi ngày
-- ---------------------------------------------------------------------------
create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  headline text not null,
  action_text text,
  severity text not null default 'info' check (severity in ('info', 'warning', 'refer')),
  payload jsonb not null default '{}'::jsonb,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

-- ---------------------------------------------------------------------------
-- Tổng hợp theo ngày — bảng đọc nhanh cho dashboard
-- ---------------------------------------------------------------------------
create table public.daily_summaries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  kcal_in integer not null default 0,
  kcal_out integer not null default 0,
  protein_g numeric(7, 1) not null default 0,
  carb_g numeric(7, 1) not null default 0,
  fat_g numeric(7, 1) not null default 0,
  target_kcal integer,
  adherence_pct numeric(5, 1),
  streak_days integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

-- ---------------------------------------------------------------------------
-- Hạn mức và cache cho AI — nằm trong CSDL để không cần thêm hạ tầng
-- ---------------------------------------------------------------------------
create table public.ai_rate_limits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  purpose public.ai_purpose not null,
  window_start timestamptz not null,
  used integer not null default 0 check (used >= 0),
  primary key (user_id, purpose, window_start)
);

create table public.ai_cache (
  cache_key text primary key,
  purpose public.ai_purpose not null,
  response jsonb not null,
  model text not null,
  prompt_version text not null,
  hits integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index ai_cache_expires_idx on public.ai_cache (expires_at);

-- ---------------------------------------------------------------------------
-- Quan hệ PT ↔ khách hàng — tạo sẵn cho Release 2
-- ---------------------------------------------------------------------------
create table public.pt_clients (
  pt_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('pending', 'active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  primary key (pt_id, client_id),
  constraint pt_not_self check (pt_id <> client_id)
);

-- ---------------------------------------------------------------------------
-- Sự kiện phân tích — chỉ lưu thứ cần cho funnel, không lưu dữ liệu sức khoẻ
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_created_idx
  on public.analytics_events (name, created_at desc);
