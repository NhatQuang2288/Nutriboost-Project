-- ============================================================================
-- NutriBoost — 003: hàm nghiệp vụ
--
-- Ba nhóm:
--   A. Vòng đời người dùng (tạo hồ sơ khi đăng ký)
--   B. Tìm món ăn tiếng Việt bằng pg_trgm — bước khớp TẤT ĐỊNH, không gọi AI
--   C. Tổng hợp theo ngày + hạn mức AI (nguyên tử, chống đua)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A. Tạo hồ sơ tự động khi có người dùng mới
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'Asia/Ho_Chi_Minh'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- B. Tìm món ăn
--
-- Trả về ứng viên đã xếp hạng cho một truy vấn tiếng Việt.
-- Dùng bởi tầng ứng dụng để quyết định: khớp tất định, hay đưa danh sách cho AI.
--
-- Ngưỡng lấy theo `pg_trgm.similarity_threshold` (mặc định 0,3) — khớp hằng số
-- FOOD_CANDIDATE_THRESHOLD trong packages/nutrition/src/similarity.ts.
-- ---------------------------------------------------------------------------
create or replace function public.search_foods(query text, match_limit integer default 20)
returns table (
  food_id uuid,
  name_vi text,
  kind public.food_kind,
  category text,
  serving_name text,
  serving_grams numeric,
  kcal_per_100g numeric,
  protein_g numeric,
  carb_g numeric,
  fat_g numeric,
  score real,
  matched_on text
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select public.vietnamese_key(trim(coalesce(query, ''))) as key
  ),
  candidates as (
    select f.id, similarity(f.name_key, q.key) as score, 'name'::text as matched_on
    from public.foods f, q
    where q.key <> '' and f.name_key % q.key

    union all

    select a.food_id, similarity(a.alias_key, q.key) as score, 'alias'::text as matched_on
    from public.food_aliases a, q
    where q.key <> '' and a.alias_key % q.key
  ),
  best as (
    select
      c.id,
      max(c.score) as score,
      (array_agg(c.matched_on order by c.score desc))[1] as matched_on
    from candidates c
    group by c.id
  )
  select
    f.id,
    f.name_vi,
    f.kind,
    f.category,
    f.serving_name,
    f.serving_grams,
    f.kcal_per_100g,
    f.protein_g,
    f.carb_g,
    f.fat_g,
    b.score,
    b.matched_on
  from best b
  join public.foods f on f.id = b.id
  order by b.score desc, f.name_vi asc
  limit greatest(1, least(coalesce(match_limit, 20), 50));
$$;

comment on function public.search_foods(text, integer) is
  'Bước 1 của pipeline hiểu bữa ăn: tìm tất định bằng trigram. Chỉ khi không đủ tự tin mới gọi AI.';

-- ---------------------------------------------------------------------------
-- Dinh dưỡng thực tế của món ăn, suy ra từ thành phần
--
-- `security_invoker = true` để view tôn trọng RLS của người gọi, thay vì chạy
-- bằng quyền của chủ sở hữu view.
-- ---------------------------------------------------------------------------
create or replace view public.dish_nutrients
with (security_invoker = true)
as
select
  c.dish_id,
  sum(c.grams) as total_grams,
  round(sum(c.grams * i.kcal_per_100g / 100), 1) as kcal,
  round(sum(c.grams * i.protein_g / 100), 1) as protein_g,
  round(sum(c.grams * i.carb_g / 100), 1) as carb_g,
  round(sum(c.grams * i.fat_g / 100), 1) as fat_g,
  round(sum(c.grams * i.fiber_g / 100), 1) as fiber_g,
  round(sum(c.grams * i.sodium_mg / 100), 1) as sodium_mg
from public.dish_components c
join public.foods i on i.id = c.ingredient_id
group by c.dish_id;

comment on view public.dish_nutrients is
  'Tổng dinh dưỡng của một món, tính từ thành phần × gram. Nguồn chân lý cho dữ liệu món Việt.';

-- Ghi lại chỉ số trên 100 g của món từ thành phần của nó.
-- Dùng trong công cụ seed và khi kiểm tra tính toàn vẹn dữ liệu.
create or replace function public.recompute_dish_nutrients(p_dish_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_kcal numeric;
  v_protein numeric;
  v_carb numeric;
  v_fat numeric;
  v_fiber numeric;
  v_sodium numeric;
begin
  select total_grams, kcal, protein_g, carb_g, fat_g, fiber_g, sodium_mg
  into v_total, v_kcal, v_protein, v_carb, v_fat, v_fiber, v_sodium
  from public.dish_nutrients
  where dish_id = p_dish_id;

  if v_total is null or v_total = 0 then
    return;
  end if;

  update public.foods
  set
    serving_grams = coalesce(serving_grams, v_total),
    kcal_per_100g = round(v_kcal * 100 / v_total, 1),
    protein_g = round(v_protein * 100 / v_total, 1),
    carb_g = round(v_carb * 100 / v_total, 1),
    fat_g = round(v_fat * 100 / v_total, 1),
    fiber_g = round(v_fiber * 100 / v_total, 1),
    sodium_mg = round(v_sodium * 100 / v_total, 1)
  where id = p_dish_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- C. Tổng hợp theo ngày
--
-- Được gọi sau mỗi lần ghi nhật ký. Không phụ thuộc pg_cron để giảm hạ tầng.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_daily_summary(p_user_id uuid, p_local_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kcal_in integer;
  v_protein numeric;
  v_carb numeric;
  v_fat numeric;
  v_kcal_out integer;
  v_target integer;
  v_adherence numeric;
  v_streak integer;
begin
  select
    coalesce(sum(total_kcal), 0)::integer,
    coalesce(sum(total_protein_g), 0),
    coalesce(sum(total_carb_g), 0),
    coalesce(sum(total_fat_g), 0)
  into v_kcal_in, v_protein, v_carb, v_fat
  from public.meal_logs
  where user_id = p_user_id and local_date = p_local_date;

  select coalesce(sum(kcal_burned), 0)::integer
  into v_kcal_out
  from public.activity_logs
  where user_id = p_user_id and local_date = p_local_date;

  select et.target_kcal
  into v_target
  from public.energy_targets et
  where et.user_id = p_user_id and et.effective_from <= p_local_date
  order by et.effective_from desc
  limit 1;

  v_adherence := case
    when v_target is null or v_target = 0 then null
    else round(v_kcal_in::numeric * 100 / v_target, 1)
  end;

  -- Chuỗi ngày liên tiếp có ghi nhật ký, tính ngược từ p_local_date.
  -- Nếu chính ngày đó chưa ghi gì thì chuỗi bằng 0.
  with days as (
    select
      d::date as day,
      exists (
        select 1 from public.meal_logs m
        where m.user_id = p_user_id and m.local_date = d::date
      ) as has_log
    from generate_series(p_local_date - interval '59 days', p_local_date, interval '1 day') as d
  ),
  grouped as (
    select
      day,
      has_log,
      sum(case when has_log then 0 else 1 end) over (order by day desc) as breaks
    from days
  )
  select count(*)::integer
  into v_streak
  from grouped
  where has_log and breaks = 0;

  insert into public.daily_summaries (
    user_id, local_date, kcal_in, kcal_out, protein_g, carb_g, fat_g,
    target_kcal, adherence_pct, streak_days, updated_at
  )
  values (
    p_user_id, p_local_date, v_kcal_in, v_kcal_out, v_protein, v_carb, v_fat,
    v_target, v_adherence, coalesce(v_streak, 0), now()
  )
  on conflict (user_id, local_date) do update
  set
    kcal_in = excluded.kcal_in,
    kcal_out = excluded.kcal_out,
    protein_g = excluded.protein_g,
    carb_g = excluded.carb_g,
    fat_g = excluded.fat_g,
    target_kcal = excluded.target_kcal,
    adherence_pct = excluded.adherence_pct,
    streak_days = excluded.streak_days,
    updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Hạn mức AI — nguyên tử, chống đua giữa các request đồng thời
--
-- Trả về true nếu còn lượt (và đã trừ), false nếu đã chạm trần.
-- Nhờ `on conflict ... where`, hai request đồng thời không thể cùng vượt trần.
-- ---------------------------------------------------------------------------
create or replace function public.claim_ai_quota(
  p_user_id uuid,
  p_purpose public.ai_purpose,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('day', now());
  v_used integer;
begin
  if p_limit <= 0 then
    return false;
  end if;

  insert into public.ai_rate_limits (user_id, purpose, window_start, used)
  values (p_user_id, p_purpose, v_window, 1)
  on conflict (user_id, purpose, window_start) do update
    set used = public.ai_rate_limits.used + 1
    where public.ai_rate_limits.used < p_limit
  returning used into v_used;

  return v_used is not null;
end;
$$;

comment on function public.claim_ai_quota(uuid, public.ai_purpose, integer) is
  'Trừ một lượt gọi AI. Trả về false khi đã chạm trần trong ngày.';

-- ---------------------------------------------------------------------------
-- Xoá toàn bộ dữ liệu của một người dùng (quyền được xoá dữ liệu)
-- Giữ lại bản ghi `profiles` để tài khoản vẫn tồn tại; phần còn lại bị xoá theo.
-- ---------------------------------------------------------------------------
create or replace function public.purge_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Cần đăng nhập';
  end if;

  delete from public.chat_threads where user_id = v_user;
  delete from public.meal_logs where user_id = v_user;
  delete from public.activity_logs where user_id = v_user;
  delete from public.body_metrics where user_id = v_user;
  delete from public.plans where user_id = v_user;
  delete from public.energy_targets where user_id = v_user;
  delete from public.daily_summaries where user_id = v_user;
  delete from public.ai_insights where user_id = v_user;
  delete from public.analytics_events where user_id = v_user;
  delete from public.health_profiles where user_id = v_user;

  update public.profiles
  set onboarded_at = null, full_name = null
  where id = v_user;
end;
$$;

grant execute on function public.refresh_daily_summary(uuid, date) to authenticated;
grant execute on function public.purge_user_data() to authenticated;
