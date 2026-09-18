-- ============================================================================
-- NutriBoost — 010: vòng duyệt thực đơn
--
-- Bối cảnh: `/pt/duyet` đã đọc `plans` có `status = 'draft'` từ trước, nhưng **chưa có gì
-- ghi ra chúng** — bộ dựng thực đơn chạy ở tầng ứng dụng rồi trả về một đối tượng trong bộ
-- nhớ. Nên hàng đợi duyệt luôn rỗng, và một thực đơn được duyệt cũng không có chỗ nào để
-- nhìn lại.
--
-- Hai hàm dưới đây khép vòng đó lại: PT dựng thực đơn cho khách và lưu thành bản nháp, PT
-- duyệt hoặc yêu cầu chỉnh lại, khách đọc được bản đã duyệt.
--
-- Vì sao là hàm chứ không gọi thẳng PostgREST: cả hai việc đều phải kiểm quyền theo một cách
-- mà chính sách RLS không diễn đạt được.
--   • `plans_insert` đòi `user_id = auth.uid()`, tức là **chỉ khách tự ghi được kế hoạch của
--     mình**. PT dựng thực đơn cho khách thì không lọt qua chính sách đó, và nới chính sách ra
--     thành "PT ghi được cho khách" sẽ mở luôn đường cho khách tự ghi hộ nhau.
--   • Ghi một kế hoạch là xoá rồi chèn lại toàn bộ món của tuần đó. Làm hai bước từ tầng ứng
--     dụng thì có lúc kế hoạch nằm ở trạng thái không có món nào.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ghi chú của PT khi yêu cầu chỉnh lại
--
-- Cần một cột riêng: `plan_items.rationale` giải thích cho từng món, còn đây là nhận xét cho
-- cả tuần. Không có nó thì nút "Yêu cầu chỉnh lại" không lưu được gì, tức là một nút chết.
-- ---------------------------------------------------------------------------
alter table public.plans add column review_note text;

comment on column public.plans.review_note is
  'Nhận xét của PT khi yêu cầu chỉnh lại. Xoá khi thực đơn được duyệt.';

-- ---------------------------------------------------------------------------
-- Lưu một thực đơn cho một người dùng
--
-- Người gọi được phép khi là chính người đó, là PT của họ, hoặc quản trị viên — cùng điều
-- kiện với chính sách đọc trên `plans`, nên không ai ghi được vào chỗ mình không đọc được.
-- ---------------------------------------------------------------------------
create or replace function public.save_plan(
  p_user_id uuid,
  p_week_start date,
  p_items jsonb,
  p_status public.plan_status default 'draft'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_plan_id uuid;
begin
  if v_caller is null then
    raise exception 'Cần đăng nhập để lưu thực đơn.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_user_id <> v_caller and not public.is_pt_of(p_user_id) and not public.is_admin() then
    raise exception 'Không có quyền dựng thực đơn cho người dùng này.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Thực đơn phải có ít nhất một món.'
      using errcode = 'check_violation';
  end if;

  /*
   * `on conflict (user_id, week_start)` khớp khoá duy nhất có sẵn trên bảng, nên dựng lại
   * thực đơn của cùng một tuần là ghi đè chứ không tạo hàng thứ hai.
   */
  insert into public.plans (user_id, week_start, status, accepted_at, review_note)
  values (
    p_user_id,
    p_week_start,
    p_status,
    case when p_status = 'active' then now() else null end,
    null
  )
  on conflict (user_id, week_start) do update set
    status = excluded.status,
    accepted_at = excluded.accepted_at,
    review_note = null
  returning id into v_plan_id;

  -- Xoá rồi chèn lại: thực đơn là một chỉnh thể, không phải danh sách để vá từng dòng.
  delete from public.plan_items where plan_id = v_plan_id;

  insert into public.plan_items (
    plan_id, plan_date, meal_type, food_id, display_name, grams,
    kcal, protein_g, carb_g, fat_g, status, rationale
  )
  select
    v_plan_id,
    (item ->> 'planDate')::date,
    (item ->> 'mealType')::public.meal_type,
    /*
     * `food_id` có thể trỏ tới món không tồn tại nếu bên gọi gửi slug thay vì uuid, hoặc gửi
     * một uuid đã bị xoá. Chuyển thành NULL thay vì để khoá ngoại ném lỗi: cột này vốn cho
     * phép NULL cho món chưa có trong CSDL, và giữ lại tên món vẫn hữu ích.
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
    coalesce((item ->> 'status')::public.plan_item_status, 'suggested'),
    item ->> 'rationale'
  from jsonb_array_elements(p_items) as item;

  return v_plan_id;
end;
$$;

revoke all on function public.save_plan(uuid, date, jsonb, public.plan_status)
  from public, anon, authenticated;
grant execute on function public.save_plan(uuid, date, jsonb, public.plan_status) to authenticated;

comment on function public.save_plan(uuid, date, jsonb, public.plan_status) is
  'Ghi thực đơn của một tuần cho một người dùng. Cho phép chính họ, PT của họ, hoặc quản trị viên.';

-- ---------------------------------------------------------------------------
-- Duyệt, hoặc yêu cầu chỉnh lại
--
-- `approve`  → `active`, khách nhìn thấy.
-- `revise`   → giữ `draft` và ghi lại nhận xét để PT nhớ mình đã yêu cầu sửa gì.
-- ---------------------------------------------------------------------------
create or replace function public.decide_plan(
  p_plan_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_plan public.plans;
begin
  if v_caller is null then
    raise exception 'Cần đăng nhập để duyệt thực đơn.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_decision not in ('approve', 'revise') then
    return jsonb_build_object('ok', false, 'reason', 'unknown_decision');
  end if;

  select * into v_plan from public.plans where id = p_plan_id for update;

  if v_plan.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_plan.user_id <> v_caller and not public.is_pt_of(v_plan.user_id) and not public.is_admin() then
    raise exception 'Không có quyền duyệt thực đơn này.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_decision = 'approve' then
    update public.plans
    set status = 'active', accepted_at = now(), review_note = null
    where id = p_plan_id;

    return jsonb_build_object('ok', true, 'status', 'active');
  end if;

  update public.plans
  set status = 'draft', accepted_at = null, review_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_plan_id;

  return jsonb_build_object('ok', true, 'status', 'draft');
end;
$$;

revoke all on function public.decide_plan(uuid, text, text) from public, anon, authenticated;
grant execute on function public.decide_plan(uuid, text, text) to authenticated;

comment on function public.decide_plan(uuid, text, text) is
  'Duyệt (active) hoặc yêu cầu chỉnh lại (giữ draft, ghi nhận xét). Kiểm quyền trong hàm.';

-- ---------------------------------------------------------------------------
-- Đọc thực đơn đã lưu, kèm món — một lời gọi, để màn Kế hoạch không phải ghép hai truy vấn
-- ---------------------------------------------------------------------------
create or replace function public.read_plan(p_user_id uuid, p_week_start date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'id', p.id,
        'weekStart', p.week_start,
        'status', p.status,
        'reviewNote', p.review_note,
        'items', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'planDate', i.plan_date,
                'mealType', i.meal_type,
                'foodId', i.food_id,
                'slug', f.slug,
                'displayName', i.display_name,
                'grams', i.grams,
                'kcal', i.kcal,
                'proteinG', i.protein_g,
                'carbG', i.carb_g,
                'fatG', i.fat_g,
                'status', i.status
              )
              order by i.plan_date, i.meal_type
            )
            from public.plan_items i
            left join public.foods f on f.id = i.food_id
            where i.plan_id = p.id
          ),
          '[]'::jsonb
        )
      )
      from public.plans p
      where p.user_id = p_user_id
        and p.week_start = p_week_start
        and (
          p_user_id = auth.uid()
          or public.is_admin()
          or public.is_pt_of(p_user_id)
        )
    ),
    'null'::jsonb
  )
$$;

revoke all on function public.read_plan(uuid, date) from public, anon, authenticated;
grant execute on function public.read_plan(uuid, date) to authenticated;

comment on function public.read_plan(uuid, date) is
  'Thực đơn của một tuần kèm món, trong một lời gọi. Quyền kiểm trong WHERE, giống RLS trên plans.';
