-- ============================================================================
-- NutriBoost — 008: hai đường ghi nguyên tử của vòng lặp sức khoẻ
--
-- Vì sao cần hàm chứ không gọi thẳng PostgREST từ tầng ứng dụng: cả hai việc dưới đây đều
-- chạm nhiều bảng, và trạng thái nửa vời thì **không sửa được về sau**:
--
--   • Hoàn tất onboarding ghi 4 bảng. Nếu `profiles.onboarded_at` được đặt mà
--     `health_profiles` chưa có, thì người dùng bị coi là đã thiết lập xong nhưng ứng dụng
--     không có chiều cao hay cân nặng nào để tính — và không có màn hình nào để nhập lại,
--     vì `/auth/callback` thấy `onboarded_at` khác null nên không đưa qua onboarding nữa.
--
--   • Ghi bữa ăn chèn một hàng `meal_logs` rồi nhiều hàng `meal_log_items`. Thiếu phần thứ
--     hai thì bữa ăn hiện ra với 0 kcal, hoặc tệ hơn: có tổng nhưng không có món nào để
--     người dùng sửa.
--
-- Toán dinh dưỡng vẫn KHÔNG nằm ở đây. `p_targets` được tính bởi `@nutriboost/nutrition`
-- trong Server Action — hàm thuần, có test vector. CSDL chỉ lưu lại kết quả.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Hoàn tất thiết lập hồ sơ
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_sex public.sex_type,
  p_date_of_birth date,
  p_height_cm numeric,
  p_activity_level public.activity_level,
  p_goal public.goal_type,
  p_rate_kg_per_week numeric,
  p_weight_kg numeric,
  p_medical_flags public.medical_flag[],
  p_consent_version text,
  p_bmr_kcal integer,
  p_tdee_kcal integer,
  p_target_kcal integer,
  p_protein_g integer,
  p_carb_g integer,
  p_fat_g integer,
  p_formula_version text,
  p_floors_applied text[] default '{}',
  p_target_weight_kg numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := current_date;
begin
  if v_user is null then
    raise exception 'Cần đăng nhập để lưu hồ sơ.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Hồ sơ được trigger `handle_new_user` tạo khi đăng ký. Thiếu thì tạo, để hàm không phụ
  -- thuộc vào việc trigger đã chạy hay chưa.
  insert into public.profiles (id) values (v_user)
  on conflict (id) do nothing;

  insert into public.health_profiles (
    user_id, sex, date_of_birth, height_cm, activity_level, goal,
    target_weight_kg, rate_kg_per_week, medical_flags, updated_at
  )
  values (
    v_user, p_sex, p_date_of_birth, p_height_cm, p_activity_level, p_goal,
    p_target_weight_kg, p_rate_kg_per_week, coalesce(p_medical_flags, '{}'), now()
  )
  on conflict (user_id) do update set
    sex = excluded.sex,
    date_of_birth = excluded.date_of_birth,
    height_cm = excluded.height_cm,
    activity_level = excluded.activity_level,
    goal = excluded.goal,
    target_weight_kg = excluded.target_weight_kg,
    rate_kg_per_week = excluded.rate_kg_per_week,
    medical_flags = excluded.medical_flags,
    updated_at = now();

  /*
   * Cân nặng hôm nay. `body_metrics` có khoá duy nhất (user_id, measured_on) nên thiết lập
   * lại hồ sơ trong cùng một ngày sẽ ghi đè số cũ thay vì tạo hai hàng cho một ngày.
   */
  insert into public.body_metrics (user_id, measured_on, weight_kg)
  values (v_user, v_today, p_weight_kg)
  on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;

  /*
   * Mục tiêu năng lượng: ghi theo ngày hiệu lực và giữ lịch sử. Đặt lại hồ sơ trong cùng
   * ngày thì cập nhật hàng của ngày đó, không tạo hàng thứ hai.
   */
  insert into public.energy_targets (
    user_id, effective_from, bmr_kcal, tdee_kcal, target_kcal,
    protein_g, carb_g, fat_g, formula_version, inputs, floors_applied
  )
  values (
    v_user, v_today, p_bmr_kcal, p_tdee_kcal, p_target_kcal,
    p_protein_g, p_carb_g, p_fat_g, p_formula_version,
    jsonb_build_object(
      'sex', p_sex,
      'dateOfBirth', p_date_of_birth,
      'heightCm', p_height_cm,
      'weightKg', p_weight_kg,
      'activityLevel', p_activity_level,
      'goal', p_goal,
      'rateKgPerWeek', p_rate_kg_per_week
    ),
    coalesce(p_floors_applied, '{}')
  )
  on conflict (user_id, effective_from) do update set
    bmr_kcal = excluded.bmr_kcal,
    tdee_kcal = excluded.tdee_kcal,
    target_kcal = excluded.target_kcal,
    protein_g = excluded.protein_g,
    carb_g = excluded.carb_g,
    fat_g = excluded.fat_g,
    formula_version = excluded.formula_version,
    inputs = excluded.inputs,
    floors_applied = excluded.floors_applied;

  /*
   * Đồng ý xử lý dữ liệu — ba loại, và đây là bằng chứng pháp lý nên không được bỏ qua.
   * `on conflict do nothing`: đã đồng ý rồi thì giữ nguyên mốc thời gian của lần đầu, không
   * đẩy nó về hiện tại mỗi lần người dùng sửa hồ sơ.
   */
  insert into public.consents (user_id, kind, version)
  select v_user, kind, p_consent_version
  from unnest(array['terms', 'health_data', 'ai_processing']::public.consent_kind[]) as kind
  on conflict (user_id, kind, version) do nothing;

  -- Đặt CUỐI CÙNG: đây là cờ báo "đã thiết lập xong", nên chỉ được bật khi mọi thứ ở trên
  -- đã xong. Cả hàm chạy trong một giao dịch, nên nếu bất kỳ bước nào lỗi thì cờ cũng
  -- không được bật.
  update public.profiles
  set onboarded_at = now()
  where id = v_user and onboarded_at is null;
end;
$$;

revoke all on function public.complete_onboarding(
  public.sex_type, date, numeric, public.activity_level, public.goal_type, numeric, numeric,
  public.medical_flag[], text, integer, integer, integer, integer, integer, integer, text,
  text[], numeric
) from public, anon, authenticated;

grant execute on function public.complete_onboarding(
  public.sex_type, date, numeric, public.activity_level, public.goal_type, numeric, numeric,
  public.medical_flag[], text, integer, integer, integer, integer, integer, integer, text,
  text[], numeric
) to authenticated;

comment on function public.complete_onboarding is
  'Ghi hồ sơ sức khoẻ, cân nặng, mục tiêu năng lượng và ba loại đồng ý trong một giao dịch. Người dùng lấy từ auth.uid().';

-- ---------------------------------------------------------------------------
-- Bổ sung ba chỉ số còn thiếu trên `meal_log_items`
--
-- Bảng này có kcal và ba đa lượng, nhưng `ScaledNutrients` của lõi dinh dưỡng còn mang theo
-- chất xơ, đường và natri — và `foods` có đủ ba cột đó. Thiếu chúng ở đây nghĩa là mọi bữa
-- ăn ghi qua trợ lý đều hiện chất xơ và natri bằng 0, im lặng.
--
-- Cùng lý do với kcal: đây là dữ liệu tính được từ danh mục, không phải thứ model nghĩ ra.
-- ---------------------------------------------------------------------------
alter table public.meal_log_items
  add column fiber_g numeric(6, 1) not null default 0 check (fiber_g >= 0),
  add column sugar_g numeric(6, 1) not null default 0 check (sugar_g >= 0),
  add column sodium_mg numeric(7, 1) not null default 0 check (sodium_mg >= 0);

comment on column public.meal_log_items.fiber_g is
  'Chất xơ của phần đã ăn. Trước đây bị bỏ khi ghi, nên luôn hiện 0.';

-- ---------------------------------------------------------------------------
-- Ghi một bữa ăn kèm các món
--
-- Tổng kcal và macro được tính TỪ các món ngay trong hàm, không nhận từ người gọi. Nhận
-- tổng từ bên ngoài là mở đường cho một hàng `meal_logs` nói 500 kcal trong khi các món
-- cộng lại 900 — và không có cách nào phát hiện về sau.
-- ---------------------------------------------------------------------------
create or replace function public.log_meal_with_items(
  p_local_date date,
  p_meal_type public.meal_type,
  p_raw_input text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_meal_id uuid;
  v_kcal integer;
  v_protein numeric;
  v_carb numeric;
  v_fat numeric;
begin
  if v_user is null then
    raise exception 'Cần đăng nhập để ghi bữa ăn.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Bữa ăn phải có ít nhất một món.'
      using errcode = 'check_violation';
  end if;

  select
    coalesce(sum((item ->> 'kcal')::numeric), 0)::integer,
    coalesce(sum((item ->> 'proteinG')::numeric), 0),
    coalesce(sum((item ->> 'carbG')::numeric), 0),
    coalesce(sum((item ->> 'fatG')::numeric), 0)
  into v_kcal, v_protein, v_carb, v_fat
  from jsonb_array_elements(p_items) as item;

  insert into public.meal_logs (
    user_id, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, p_local_date, p_meal_type, 'ai_chat', p_raw_input,
    v_kcal, v_protein, v_carb, v_fat, now()
  )
  returning id into v_meal_id;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method, match_score
  )
  select
    v_meal_id,
    /*
     * `food_id` có thể trỏ tới món không tồn tại nếu model bịa id. Chuyển thành NULL thay
     * vì để khoá ngoại ném lỗi: cột này vốn cho phép NULL cho món chưa có trong CSDL, và
     * ghi lại tên món vẫn hữu ích.
     */
    case
      when item ->> 'foodId' is null then null
      when exists (select 1 from public.foods f where f.id = (item ->> 'foodId')::uuid)
        then (item ->> 'foodId')::uuid
      else null
    end,
    coalesce(item ->> 'displayName', 'Món chưa rõ tên'),
    coalesce((item ->> 'grams')::numeric, 0),
    coalesce((item ->> 'kcal')::numeric, 0),
    coalesce((item ->> 'proteinG')::numeric, 0),
    coalesce((item ->> 'carbG')::numeric, 0),
    coalesce((item ->> 'fatG')::numeric, 0),
    coalesce((item ->> 'fiberG')::numeric, 0),
    coalesce((item ->> 'sugarG')::numeric, 0),
    coalesce((item ->> 'sodiumMg')::numeric, 0),
    coalesce((item ->> 'matchMethod')::public.match_method, 'user'),
    (item ->> 'matchScore')::numeric
  from jsonb_array_elements(p_items) as item;

  -- Tổng hợp ngày phải khớp ngay sau khi ghi, nếu không thì màn "Hôm nay" hiện số cũ cho
  -- tới lần ghi tiếp theo.
  perform public.refresh_daily_summary(v_user, p_local_date);

  return v_meal_id;
end;
$$;

revoke all on function public.log_meal_with_items(date, public.meal_type, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.log_meal_with_items(date, public.meal_type, text, jsonb)
  to authenticated;

comment on function public.log_meal_with_items(date, public.meal_type, text, jsonb) is
  'Ghi bữa ăn kèm các món trong một giao dịch. Tổng kcal/macro tính từ chính các món.';

-- ---------------------------------------------------------------------------
-- Đọc nhật ký một ngày
--
-- Trả về một mảng jsonb thay vì hai truy vấn (bữa ăn, rồi món của từng bữa) vì màn "Hôm nay"
-- luôn cần cả hai cùng lúc. Gộp ở CSDL thì không có N+1 và không có trạng thái nửa vời khi
-- một trong hai truy vấn hỏng.
--
-- `security definer` để đọc được cả nhật ký của khách khi người gọi là PT của họ, giống hệt
-- chính sách RLS trên `meal_logs` — kiểm tra quyền nằm ngay trong `where`.
-- ---------------------------------------------------------------------------
create or replace function public.read_day_meals(p_user_id uuid, p_local_date date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(entry order by eaten_at), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', m.id,
      'mealType', m.meal_type,
      'eatenAt', m.eaten_at,
      'rawInput', m.raw_input,
      'totalKcal', m.total_kcal,
      'totalProteinG', m.total_protein_g,
      'totalCarbG', m.total_carb_g,
      'totalFatG', m.total_fat_g,
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', i.id,
              'foodId', i.food_id,
              'displayName', i.display_name,
              'grams', i.grams,
              'kcal', i.kcal,
              'proteinG', i.protein_g,
              'carbG', i.carb_g,
              'fatG', i.fat_g,
              'fiberG', i.fiber_g,
              'sugarG', i.sugar_g,
              'sodiumMg', i.sodium_mg,
              'matchMethod', i.match_method,
              'matchScore', i.match_score
            )
            order by i.created_at
          )
          from public.meal_log_items i
          where i.meal_log_id = m.id
        ),
        '[]'::jsonb
      )
    ) as entry,
    m.eaten_at
  from public.meal_logs m
  where m.user_id = p_user_id
    and m.local_date = p_local_date
    and (
      p_user_id = auth.uid()
      or public.is_admin()
      or public.is_pt_of(p_user_id)
    )
  ) as day
$$;

revoke all on function public.read_day_meals(uuid, date) from public, anon, authenticated;
grant execute on function public.read_day_meals(uuid, date) to authenticated;

comment on function public.read_day_meals(uuid, date) is
  'Nhật ký một ngày kèm các món, trong một lời gọi. Quyền kiểm tra trong WHERE, giống chính sách RLS trên meal_logs.';
