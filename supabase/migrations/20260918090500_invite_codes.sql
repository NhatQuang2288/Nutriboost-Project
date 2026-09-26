-- ============================================================================
-- NutriBoost — 005: mã mời
--
-- Bối cảnh: sản phẩm bán cho PT/Coach. PT trả tiền theo gói, và gói quyết định số khách
-- tối đa (5 / 10 / 20 — xem docs/PRICING.md). Nhưng chưa có cách nào để một khách trở
-- thành khách của PT: bảng `pt_clients` tồn tại từ migration 001 mà không có đường vào.
--
-- Mã mời là đường vào đó, và là hạng mục TV2 trong bảng phân công.
--
-- Ba quyết định thiết kế, mỗi cái đều có lý do:
--
--   1. **Khách KHÔNG đọc được bảng `invite_codes`.** Nếu cấp quyền select, một người dùng
--      bất kỳ đọc được toàn bộ mã đang sống của mọi PT, và mã mời mất hết ý nghĩa. Khách
--      chỉ gọi được hàm `redeem_invite_code` — hàm này tra đúng một mã, và không nói gì
--      về những mã khác.
--
--   2. **Bảng chữ cái của mã bỏ các ký tự dễ đọc nhầm** (0/O, 1/I/L). Mã mời được đọc
--      qua điện thoại và gõ tay; `O` và `0` nhìn giống nhau trên hầu hết phông chữ. Ràng
--      buộc `check` cưỡng chế điều này ở tầng CSDL, không chỉ ở hàm sinh mã.
--
--   3. **Hạn mức khách do trigger cũ cưỡng chế, không phải hàm này.** `enforce_client_limit`
--      đã có từ migration 004 và chạy trên mọi insert/update của `pt_clients`. Viết lại
--      phép đếm ở đây là có hai nguồn sự thật, và chúng sẽ lệch nhau.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bảng mã mời
-- ---------------------------------------------------------------------------
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,

  /** PT phát hành mã. Xoá PT là xoá mã của họ. */
  pt_id uuid not null references public.profiles (id) on delete cascade,

  /** Nhãn để PT tự nhớ đã gửi mã này cho ai. Không bắt buộc. */
  note text,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',

  /** Mặc định 1: một mã cho một người. Tăng lên khi PT muốn một mã cho cả nhóm. */
  max_uses integer not null default 1 check (max_uses between 1 and 100),
  used_count integer not null default 0 check (used_count >= 0),

  revoked_at timestamptz,

  -- Chốt ở tầng CSDL: không thể dùng quá số lần đã khai báo.
  constraint invite_codes_within_max_uses check (used_count <= max_uses),

  -- Bảng chữ cái không có 0, O, 1, I, L. Xem quyết định 2 ở đầu file.
  constraint invite_codes_alphabet check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8,12}$')
);

create index invite_codes_pt_idx on public.invite_codes (pt_id, created_at desc);

comment on table public.invite_codes is
  'Mã PT gửi cho khách để thiết lập quan hệ. Khách chỉ đổi được qua redeem_invite_code(), không đọc được bảng này.';
comment on column public.invite_codes.used_count is
  'Số lần đã đổi thành công. Tăng bên trong redeem_invite_code() nên luôn khớp số quan hệ đã tạo.';

-- ---------------------------------------------------------------------------
-- Gắn mã đã dùng vào quan hệ PT ↔ khách
--
-- Thêm cột thay vì dựng bảng "redemption" riêng: cùng lượng thông tin, ít hơn một bảng
-- phải phân quyền và kiểm thử.
-- ---------------------------------------------------------------------------
alter table public.pt_clients
  add column invite_code_id uuid references public.invite_codes (id) on delete set null;

comment on column public.pt_clients.invite_code_id is
  'Mã mời đã dùng để tạo quan hệ này. NULL với quan hệ do quản trị viên tạo tay.';

-- ---------------------------------------------------------------------------
-- Đổi mã
--
-- Trả về jsonb chứ không ném lỗi cho các trường hợp "mã sai / hết hạn / hết lượt": đây là
-- tình huống bình thường, không phải sự cố, và tầng ứng dụng cần phân biệt chúng để nói
-- đúng lý do cho người dùng. Chỉ ném lỗi khi chính lời gọi sai (chưa đăng nhập) hoặc khi
-- hạn mức gói bị chạm — lúc đó trigger cũ ném ra thông báo tiếng Việt đã sẵn sàng để hiện.
--
-- `for update` khoá hàng mã trong suốt giao dịch. Không có nó, hai người cùng gõ một mã
-- dùng-một-lần sẽ cùng đọc `used_count = 0` rồi cùng tăng lên 1 — mã dùng được hai lần.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.invite_codes;
  v_normalized text;
begin
  if v_uid is null then
    raise exception 'Cần đăng nhập để dùng mã mời.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Người dùng gõ mã hay lẫn chữ thường và khoảng trắng thừa khi dán từ tin nhắn.
  v_normalized := upper(btrim(coalesce(p_code, '')));

  if v_normalized = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  select * into v_code
  from public.invite_codes
  where code = v_normalized
  for update;

  if v_code.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_code.revoked_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;

  if v_code.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'used_up');
  end if;

  -- PT tự gõ mã của mình thì gần như chắc chắn là nhầm, và `pt_clients` cũng đã có ràng
  -- buộc `pt_not_self`. Trả lý do rõ ràng thay vì để ràng buộc ném lỗi khó hiểu.
  if v_code.pt_id = v_uid then
    return jsonb_build_object('ok', false, 'reason', 'own_code');
  end if;

  if exists (
    select 1 from public.pt_clients
    where pt_id = v_code.pt_id and client_id = v_uid and status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_linked');
  end if;

  /*
   * Quan hệ đã từng tồn tại rồi kết thúc (khách quay lại) thì mở lại hàng cũ thay vì
   * thêm hàng mới — khoá chính là (pt_id, client_id) nên không thêm được.
   *
   * Trigger `enforce_client_limit` chạy ở đây và ném lỗi nếu gói đã đầy, hoặc nếu PT chưa
   * có gói đang hiệu lực. Lỗi đó làm cả giao dịch quay lui, nên `used_count` không bị tăng
   * cho một lần đổi thất bại.
   */
  insert into public.pt_clients (pt_id, client_id, status, invite_code_id)
  values (v_code.pt_id, v_uid, 'active', v_code.id)
  on conflict (pt_id, client_id) do update
    set status = 'active',
        ended_at = null,
        invite_code_id = excluded.invite_code_id;

  update public.invite_codes
  set used_count = used_count + 1
  where id = v_code.id;

  return jsonb_build_object(
    'ok', true,
    'pt_id', v_code.pt_id,
    'note', v_code.note
  );
end;
$$;

revoke all on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;

comment on function public.redeem_invite_code(text) is
  'Đổi mã mời thành quan hệ PT ↔ khách. Nguyên tử: khoá hàng mã, và hạn mức gói do trigger pt_clients cưỡng chế.';

-- ---------------------------------------------------------------------------
-- Sinh mã — để CSDL làm, không để tầng ứng dụng tự bịa
--
-- Dùng `gen_random_bytes` (pgcrypto) chứ không `random()`: `random()` là bộ sinh giả ngẫu
-- nhiên có hạt giống, đoán được. Hàm tự thử lại khi trúng mã đã tồn tại.
-- ---------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  -- 31 ký tự, bỏ 0 O 1 I L. Xem quyết định 2 ở đầu file.
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_attempt integer := 0;
begin
  loop
    v_attempt := v_attempt + 1;

    select string_agg(
             substr(v_alphabet, (get_byte(gen_random_bytes(1), 0) % length(v_alphabet)) + 1, 1),
             ''
           )
    into v_code
    from generate_series(1, 8);

    if not exists (select 1 from public.invite_codes where code = v_code) then
      return v_code;
    end if;

    -- 31^8 ≈ 8,5·10^11 tổ hợp. Chạm 10 lần là dấu hiệu bất thường, không phải may rủi.
    if v_attempt >= 10 then
      raise exception 'Không sinh được mã mời không trùng sau 10 lần thử.'
        using errcode = 'unique_violation';
    end if;
  end loop;
end;
$$;

grant execute on function public.generate_invite_code() to authenticated;

comment on function public.generate_invite_code() is
  'Sinh mã 8 ký tự từ bảng chữ cái không gây nhầm lẫn, có kiểm tra trùng.';

-- ---------------------------------------------------------------------------
-- Bảo mật cấp hàng
-- ---------------------------------------------------------------------------
alter table public.invite_codes enable row level security;

-- Chỉ PT sở hữu đọc được mã của mình. Khách KHÔNG có quyền select — xem quyết định 1.
grant select, insert, update on public.invite_codes to authenticated;

create policy invite_codes_select_own on public.invite_codes
  for select to authenticated
  using (pt_id = auth.uid() or public.is_admin());

-- Chỉ tài khoản có vai trò `pt` mới phát hành được mã. Ràng buộc `pt_id = auth.uid()`
-- nghĩa là không ai phát hành mã nhân danh người khác.
create policy invite_codes_insert_pt on public.invite_codes
  for insert to authenticated
  with check (pt_id = auth.uid() and public.current_user_role() = 'pt');

-- Cho phép thu hồi mã (đặt `revoked_at`). Không có quyền delete: giữ lại mã đã phát hành
-- để còn đối chiếu khi khách hỏi vì sao không vào được.
create policy invite_codes_update_own on public.invite_codes
  for update to authenticated
  using (pt_id = auth.uid() or public.is_admin())
  with check (pt_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Mã còn dùng được, kèm số khách còn lại của gói
--
-- Một chỗ duy nhất để giao diện PT trả lời "mã này còn dùng được không" và "tôi còn mời
-- được mấy người", thay vì để tầng ứng dụng ghép ba truy vấn rồi tự suy luận.
-- ---------------------------------------------------------------------------
create or replace function public.invite_code_status(p_code_id uuid)
returns table (
  code text,
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
  v_code public.invite_codes;
  v_remaining integer;
begin
  select * into v_code from public.invite_codes where id = p_code_id;

  if v_code.id is null then
    return;
  end if;

  -- Chỉ chủ sở hữu hoặc quản trị viên xem được trạng thái mã.
  if v_code.pt_id <> auth.uid() and not public.is_admin() then
    return;
  end if;

  v_remaining := public.remaining_client_slots(v_code.pt_id);

  return query
  select
    v_code.code,
    case
      when v_code.revoked_at is not null then false
      when v_code.expires_at <= now() then false
      when v_code.used_count >= v_code.max_uses then false
      when v_remaining <= 0 then false
      else true
    end,
    case
      when v_code.revoked_at is not null then 'revoked'
      when v_code.expires_at <= now() then 'expired'
      when v_code.used_count >= v_code.max_uses then 'used_up'
      when v_remaining <= 0 then 'plan_full'
      else 'ok'
    end,
    v_remaining;
end;
$$;

revoke all on function public.invite_code_status(uuid) from public;
grant execute on function public.invite_code_status(uuid) to authenticated;
