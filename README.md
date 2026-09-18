# NutriBoost

Trợ lý dinh dưỡng AI-Native cho người Việt. Mobile-first PWA, lấy AI làm trung tâm và tối thiểu hoá
thao tác người dùng.

> Trợ lý tên **Bơ**. Ba tầng leo thang: thanh hỏi nổi → sidebar 400px → toàn màn hình.

## Bắt đầu nhanh

```bash
# 1. Cài phụ thuộc
npm install

# 2. Tạo file môi trường và điền khoá
cp .env.example .env.local

# 3. BẮT BUỘC: nối file đó vào thư mục app
#    Next.js chỉ đọc .env.local trong apps/web, không đọc ở gốc monorepo.
#    Bỏ bước này thì web vẫn chạy nhưng không thấy khoá nào và trợ lý Bơ
#    im lặng trả lời mặc định — không có lỗi nào hiện ra.
npm run env:link

# 4. Kiểm tra mọi thứ chạy được (không cần Supabase hay Gemini thật)
npm run typecheck && npm run lint && npm run test

# 5. Chạy web
npm run dev
```

Nếu `npm install` báo `EPERM`, xem mục "Cạm bẫy môi trường" trong `CLAUDE.md`.
Nếu trợ lý Bơ trả lời chung chung, chạy `npm run env:check` trước tiên.

## Cấu trúc

```
apps/web                  Next.js 16 — PWA mobile-first + lớp trợ lý Bơ
packages/nutrition        Toán dinh dưỡng tất định, 100 % có test
packages/db               Kiểu dữ liệu Supabase, schema dùng chung, helper RLS
packages/ai               AI Gateway, tool, prompt, guardrail, eval
packages/seed             Dữ liệu món Việt + công cụ import
supabase/migrations       Schema, RLS, hàm
docs                      Review MVP, phân công, đặc tả trợ lý, ADR
```

## Tài liệu phải đọc

| File                    | Nội dung                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `docs/REVIEW-MVP.md`    | Rà soát bản User Story Mapping: 7 lỗi và cách sửa                     |
| `docs/roles.md`         | Phân công 5 người đã điều chỉnh, ranh giới sở hữu, Definition of Done |
| `docs/DESIGN-SYSTEM.md` | Bảng màu trích từ logo, thang chữ, khoảng cách, số đo WCAG, linh vật  |
| `docs/ASSISTANT-UX.md`  | Hợp đồng thi hành của lớp trợ lý 3 tầng                               |
| `docs/PRICING.md`       | Rà soát 3 gói PT và phân tích chi phí AI trên doanh thu               |
| `docs/INVITES.md`       | Mã mời: luồng đầy đủ, ba quyết định CSDL, cách nâng vai trò PT        |
| `CLAUDE.md`             | Quy ước code và cạm bẫy môi trường                                    |

## Nguyên tắc kiến trúc

1. **Toán dinh dưỡng là code, không phải AI.** BMR/TDEE/macro/kcal đốt nằm trong
   `packages/nutrition`, có test vector. Model chỉ hiểu ngôn ngữ và chọn món.
2. **Một cửa cho AI.** Mọi lời gọi đi qua `packages/ai`; ở đó có hạn mức, cache,
   cost tracking, retry và guardrail an toàn.
3. **Hiểu bữa ăn theo hai bước.** Tìm tất định bằng `pg_trgm` trước; chỉ gọi AI khi
   thật sự mơ hồ. Vừa chính xác hơn vừa rẻ hơn.
4. **Không thư viện icon.** Toàn bộ SVG tự vẽ.

## Màn hình hiện có

**Khách hàng**

| Đường dẫn     | Nội dung                                 |
| ------------- | ---------------------------------------- |
| `/`           | Trang giới thiệu                         |
| `/dang-nhap`  | Đăng nhập bằng magic link                |
| `/onboarding` | 5 câu hỏi, ra mục tiêu năng lượng ngay   |
| `/tham-gia`   | Nhập mã mời của PT để được kết nối       |
| `/hom-nay`    | Vòng calo, bữa ăn, gợi ý của Bơ mỗi ngày |
| `/ghi-nhan`   | Ghi bữa ăn                               |
| `/ke-hoach`   | Thực đơn 7 ngày, dựng tất định           |
| `/lich-tap`   | Lịch tập tuần kèm kcal đốt từng buổi     |
| `/coach`      | Quản lý các đoạn hội thoại với Bơ        |
| `/tien-do`    | Cân nặng và năng lượng theo thời gian    |
| `/toi`        | Hồ sơ, mục tiêu, quyền xoá dữ liệu       |

**Console PT** (sản phẩm bán cho PT/Coach — xem `docs/PRICING.md`)

| Đường dẫn              | Nội dung                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `/pt`                  | Tổng quan: chỗ ngồi, khách cần chú ý, danh sách khách — **dữ liệu thật** |
| `/pt/loi-moi`          | Tạo và thu hồi mã mời — **dữ liệu thật**                                 |
| `/pt/khach/[clientId]` | Hồ sơ một khách: thực đơn, lịch tập — **dữ liệu thật**                   |
| `/pt/duyet`            | Hàng đợi duyệt thực đơn do Bơ dựng (dữ liệu mẫu)                         |
| `/pt/goi`              | Ba gói dịch vụ kèm hạn mức lượt trợ lý (bảng giá tĩnh)                   |

> Mọi màn đọc dữ liệu đều có hai chế độ và nói rõ đang ở chế độ nào: chưa cấu hình Supabase
> hoặc tài khoản không phải PT thì hiện một dòng "đang hiện dữ liệu mẫu". `/pt/duyet` chưa có
> dữ liệu thật vì chưa có gì sinh ra thực đơn nháp — xem `docs/roles.md` §6.

## Kiểm chứng

```bash
npm run typecheck   # kiểu toàn workspace
npm run lint        # có luật cấm thư viện icon và cấm gọi thẳng SDK AI
npm run db:check    # chạy 10 migration + seed trên PostgreSQL thật (PGlite, không cần Docker)
npm run env:link    # nối apps/web/.env.local → .env.local ở gốc (chạy một lần)
npm run env:check   # kiểm tra .env.local và kết nối Supabase (cần Supabase đang chạy)
npm run check:live  # kiểm chứng đường dữ liệu thật qua PostgREST + RLS thật (cần Supabase)
npm run test        # 454 test đơn vị, trong đó 55 test RLS chạy trên PostgreSQL thật
npm run eval        # độ chính xác hiểu bữa ăn (hiện 100 % khớp món, 100 % không khớp bừa)
npm run e2e         # 78 test Playwright, desktop + mobile
npm run icons:generate  # sinh lại icon PWA (chỉ cần khi đổi hình)
```

`npm run db:check` là bước bắt buộc trước khi chạy `supabase db reset`: nó dựng một
PostgreSQL thật trong bộ nhớ, chạy cả 10 migration rồi nạp seed và kiểm số dòng. Nhờ vậy
lỗi cú pháp PL/pgSQL và lỗi ràng buộc dữ liệu lộ ra ở CI thay vì ở máy từng người.

`npm run db:check` **không** kiểm được RLS: `auth.uid()` trong đó luôn là `null`, nên mọi
policy đều "đúng" một cách vô nghĩa. Việc đó do `packages/db/src/__tests__/` làm, trên cùng
PGlite nhưng có đổi được danh tính giữa các lời gọi — xem `CLAUDE.md`.

`npm run env:check` chạy sau khi điền `.env.local`: nó xác nhận khoá hợp lệ, seed đã nạp,
và **RLS đang chặn đúng** — service role đọc được 91 món trong khi người chưa đăng nhập
đọc được 0 dòng. Lệnh này cần Supabase đang chạy nên chỉ dùng ở máy, không đưa vào CI.

## Việc còn lại của nhóm

### Bổ sung workflow CI

`.github/workflows/ci.yml` **chưa được đẩy lên** vì token GitHub đang dùng thiếu scope
`workflow`. File vẫn nằm trong thư mục làm việc, chỉ chưa được theo dõi.

Cách 1 — cấp lại scope cho token rồi đẩy:

```bash
# Vào GitHub → Settings → Developer settings → Personal access tokens
# bật scope `workflow`, rồi:
git add .github/workflows/ci.yml
git commit -m "ci: thêm workflow kiểm tra chất lượng và kiểm thử đầu-cuối"
git push
```

Cách 2 — dùng SSH thay cho HTTPS:

```bash
git remote set-url origin git@github.com:NhatQuang2288/Nutriboost-Project.git
git add .github/workflows/ci.yml && git commit -m "ci: thêm workflow CI" && git push
```

Cách 3 — tạo file trực tiếp trên giao diện web GitHub, dán nội dung từ máy.

### Nhánh theo vai trò

Remote đã có sẵn các nhánh `AI-&-Nghiệp-vụ-dinh-dưỡng`, `Auth-&-Dữ-liệu-nền`,
`Giao-diện-PT`, `Giao-diện-khách-&-Design-System`. Tên nhánh có ký tự `&` gây khó cho
một số công cụ CI, nên cân nhắc đổi sang dạng không dấu, ví dụ `feat/ai-nutrition`.

## Trạng thái

Đang ở Release 1. Xem lộ trình R1a/R1b trong `docs/roles.md`.
