# Mã mời và đường trở thành PT

> Hạng mục TV2 trong `docs/roles.md`. Đọc trước khi sửa `invite_codes`, `redeem_invite_code`
> hoặc màn `/pt/loi-moi`.

---

## 1. Luồng đầy đủ

```
PT mở /pt/loi-moi  →  tạo mã  →  gửi liên kết  →  khách mở liên kết
                                                          │
                          chưa đăng nhập ─────────────────┤
                                                          ▼
                                          /dang-nhap?next=/tham-gia?ma=…
                                                          │  magic link
                                                          ▼
                                              /auth/callback?next=/tham-gia?ma=…
                                                    │
                        hồ sơ chưa xong ────────────┤
                                                    ▼
                                    /onboarding?tiep=/tham-gia?ma=…
                                                    │  lưu hồ sơ
                                                    ▼
                                        /tham-gia?ma=…  →  nhập mã  →  xong
```

Hai chỗ dễ làm mất mã mời, và cả hai đều đã từng sai:

1. **`/auth/callback` phải mang `next` theo.** Nếu nó luôn trả về `/onboarding` mà bỏ `next`
   thì mã mời rơi mất ở giữa luồng, và khách phải nhờ PT gửi lại.
   → `next` được truyền tiếp thành `/onboarding?tiep=…`, rồi thành đích của nút
   "Vào ứng dụng" ở bước cuối.
2. **`safeNextPath` chỉ nhận đường dẫn nội bộ.** `next` đến từ URL, nên không lọc thì đó là
   lỗ open redirect. Xem `apps/web/src/lib/auth/redirect.ts`.

---

## 2. Ba quyết định trong CSDL

| Quyết định                                                                     | Lý do                                                                                                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Khách **không** đọc được bảng `invite_codes`                                   | Cấp quyền `select` là mọi người dùng đọc được mã đang sống của mọi PT. Khách chỉ gọi được `redeem_invite_code()`, hàm này tra đúng một mã. |
| Bảng chữ cái bỏ `0 O 1 I L`, cưỡng chế bằng `check`                            | Mã được đọc qua điện thoại và gõ tay. `O` và `0` nhìn giống nhau trên hầu hết phông chữ.                                                   |
| Hạn mức khách do trigger `enforce_client_limit` cưỡng chế, không do hàm đổi mã | Viết lại phép đếm trong hàm là có hai nguồn sự thật, và chúng sẽ lệch nhau.                                                                |

Thêm một chi tiết bắt buộc: `select … for update` khi tra mã. Thiếu nó, hai người cùng gõ một
mã dùng-một-lần sẽ cùng đọc `used_count = 0` rồi cùng tăng lên 1 — mã dùng được hai lần.

---

## 3. Làm sao một người trở thành PT

**Chưa có giao diện cho việc này, và đó là chủ ý.** Vai trò PT gắn với một gói đã trả tiền, mà
cổng thanh toán chưa nằm trong phạm vi bản này. Việc nâng vai trò do người vận hành làm bằng
khoá service role.

Vì vậy cần quyết định sản phẩm trước khi phát hành: **một PT mới lấy gói ở đâu?** Ba hướng, và
cả ba đều là quyết định kinh doanh chứ không phải kỹ thuật:

- **Trang quản trị nội bộ** — an toàn nhất, nhưng phải làm thêm một ứng dụng.
- **Dùng thử tự động** — `plan_tier` đã có nhánh `trial` (2 khách, 100 lượt AI mỗi khách). Đây
  là chi phí thu hút khách hàng, nên phải quyết định có chấp nhận hay không.
- **Tự khai vai trò khi đăng ký** — **không nên**: ai cũng thành PT được, và mỗi PT dùng thử lấy
  đi 2 khách × 100 lượt AI miễn phí.

### Công thức chạy ở máy phát triển

```sql
-- 1. Người dùng đăng nhập ít nhất một lần để có hàng trong `profiles`.
-- 2. Nâng vai trò:
update public.profiles set role = 'pt' where id = '<user-uuid>';

-- 3. Cấp gói. `subscriptions` KHÔNG có chính sách insert cho người dùng —
--    chỉ service role ghi được, đúng như thiết kế.
insert into public.subscriptions (
  owner_id, tier, status, price_vnd, client_limit, ai_turns_per_client,
  current_period_start, current_period_end
) values (
  '<user-uuid>', 'plus', 'active', 750000, 5, 600, current_date, current_date + 30
);
```

Thiếu bước 3 thì `enforce_client_limit` ném `Tài khoản PT chưa có gói đang hiệu lực.` — và
thông báo đó hiện thẳng cho khách khi họ nhập mã. Đó là hành vi đúng.

---

## 4. Kiểm thử

```bash
npx vitest run packages/db/src/__tests__/invite-codes.test.ts
```

25 test trên PostgreSQL thật, có RLS thật: không đọc được mã của người khác, không phát hành
mã nhân danh người khác, mã hết hạn/hết lượt/đã thu hồi bị từ chối, gói đầy thì ném lỗi **và
`used_count` không tăng** (giao dịch quay lui hoàn toàn), PT đọc được nhật ký của khách đang
hoạt động, và người lạ thì không.

Khi sửa hàm trong CSDL, hãy kiểm chứng test thật sự bắt được lỗi: bỏ migration ra rồi xem test
có đỏ không. Đã làm vậy với migration 006 — bốn test bảo mật đỏ đúng như mong đợi.
