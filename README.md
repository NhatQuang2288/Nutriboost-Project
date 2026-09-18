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

# 3. Kiểm tra mọi thứ chạy được (không cần Supabase hay Gemini thật)
npm run typecheck && npm run lint && npm run test

# 4. Chạy web
npm run dev
```

Nếu `npm install` báo `EPERM`, xem mục "Cạm bẫy môi trường" trong `CLAUDE.md`.

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
| `CLAUDE.md`             | Quy ước code và cạm bẫy môi trường                                    |

## Nguyên tắc kiến trúc

1. **Toán dinh dưỡng là code, không phải AI.** BMR/TDEE/macro/kcal đốt nằm trong
   `packages/nutrition`, có test vector. Model chỉ hiểu ngôn ngữ và chọn món.
2. **Một cửa cho AI.** Mọi lời gọi đi qua `packages/ai`; ở đó có hạn mức, cache,
   cost tracking, retry và guardrail an toàn.
3. **Hiểu bữa ăn theo hai bước.** Tìm tất định bằng `pg_trgm` trước; chỉ gọi AI khi
   thật sự mơ hồ. Vừa chính xác hơn vừa rẻ hơn.
4. **Không thư viện icon.** Toàn bộ SVG tự vẽ.

## Kiểm chứng

```bash
npm run typecheck   # kiểu toàn workspace
npm run lint        # có luật cấm thư viện icon và cấm gọi thẳng SDK AI
npm run test        # 208 test đơn vị
npm run eval        # độ chính xác hiểu bữa ăn (hiện 100 % khớp món, 100 % không khớp bừa)
npm run e2e         # 33 test Playwright, desktop + mobile
```

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
