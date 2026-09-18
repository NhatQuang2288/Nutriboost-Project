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
| `CLAUDE.md`             | Quy ước code và cạm bẫy môi trường                                    |

## Nguyên tắc kiến trúc

1. **Toán dinh dưỡng là code, không phải AI.** BMR/TDEE/macro/kcal đốt nằm trong
   `packages/nutrition`, có test vector. Model chỉ hiểu ngôn ngữ và chọn món.
2. **Một cửa cho AI.** Mọi lời gọi đi qua `packages/ai`; ở đó có hạn mức, cache,
   cost tracking, retry và guardrail an toàn.
3. **Hiểu bữa ăn theo hai bước.** Tìm tất định bằng `pg_trgm` trước; chỉ gọi AI khi
   thật sự mơ hồ. Vừa chính xác hơn vừa rẻ hơn.
4. **Không thư viện icon.** Toàn bộ SVG tự vẽ.

## Trạng thái

Đang ở Release 1. Xem lộ trình R1a/R1b trong `docs/roles.md`.
