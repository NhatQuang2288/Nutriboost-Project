# CLAUDE.md — NutriBoost

Hướng dẫn cho người và cho trợ lý lập trình. Đọc trước khi sửa bất cứ thứ gì.

## Sản phẩm là gì

NutriBoost là **mobile website** (PWA) trợ lý dinh dưỡng cho người Việt.
Trợ lý tên **Bơ**. Sản phẩm lấy AI làm trung tâm và **tối thiểu hoá thao tác người dùng**.

## Ba quy tắc không được vi phạm

1. **Toán dinh dưỡng không bao giờ giao cho LLM.**
   BMI, BMR, TDEE, macro, kcal đốt đều là hàm thuần trong `packages/nutrition`.
   Model chỉ được: hiểu ngôn ngữ, chọn `food_id`, chọn khẩu phần, diễn giải.

2. **Mọi lời gọi AI đi qua `@nutriboost/ai`.**
   Không import `ai` hay `@ai-sdk/google` ở nơi khác. ESLint chặn việc này.

3. **Không dùng thư viện icon.**
   Toàn bộ icon là SVG tự vẽ trong `apps/web/src/components/icons/`. ESLint chặn.

## Điều hướng nhanh

| Cần làm gì                                      | Đọc file nào                                                    |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Hiểu vì sao bản MVP được thiết kế như hiện tại  | `docs/REVIEW-MVP.md`                                            |
| Biết ai sở hữu phần nào                         | `docs/roles.md`                                                 |
| Đụng tới gói dịch vụ, hạn mức khách, hạn mức AI | `docs/PRICING.md` — có phân tích biên lợi nhuận theo chi phí AI |
| Sửa màu, chữ, khoảng cách, thành phần           | `docs/DESIGN-SYSTEM.md` — màu trích từ logo, có số đo WCAG      |
| Sửa lớp trợ lý 3 tầng                           | `docs/ASSISTANT-UX.md` — **đây là hợp đồng, không phải gợi ý**  |
| Đổi công thức dinh dưỡng                        | `packages/nutrition/src/constants.ts` + test vector tương ứng   |
| Đổi model hoặc giá                              | `packages/ai/src/models.ts`, `packages/ai/src/prices.ts`        |
| Đổi schema                                      | `supabase/migrations/` rồi sinh lại types                       |

## Lệnh thường dùng

```bash
npm run dev            # chạy web ở http://localhost:3000
npm run typecheck      # kiểm tra kiểu toàn workspace
npm run lint
npm run test           # vitest
npm run e2e            # playwright (cần cài trình duyệt trước)
npm run db:reset       # nạp lại schema + seed vào Supabase local
npm run seed           # nạp dữ liệu món Việt
npm run eval           # chạy bộ đánh giá AI
```

## Cạm bẫy môi trường (đã gặp thật)

### `npm install` lỗi EPERM

Trên máy bình thường, `.npmrc` đã trỏ cache vào `./.npm-cache` nên không sao.

Nếu biến `npm_config_cache` đã được set trong môi trường (một số sandbox làm vậy),
**biến môi trường sẽ thắng `.npmrc`**. Khi đó phải thêm cờ CLI, vì cờ CLI thắng env:

```bash
npm install --cache ./.npm-cache
```

Cách khác: `sudo chown -R 501:20 ~/.npm` để dùng lại cache mặc định.

### Không có `pnpm` hay `bun`

Dự án dùng **npm workspaces**. Đừng thêm lockfile của trình quản lý khác.

### TypeScript bị ghim ở 5.9.3

`typescript-eslint@8` khai báo peer `typescript >=4.8.4 <6.1.0`.
Nâng lên TypeScript 7 sẽ phá toolchain lint. Chỉ nâng khi `typescript-eslint` hỗ trợ.

## Quy ước code

- TypeScript strict, `noUncheckedIndexedAccess` bật → nhớ xử lý `undefined` khi truy cập mảng.
- `verbatimModuleSyntax` bật → dùng `import type` cho import chỉ có kiểu.
- Import nội bộ **không** kèm đuôi `.js` (moduleResolution là `bundler`).
- Mọi hằng số dinh dưỡng phải kèm nguồn tham chiếu trong comment.
- Comment và chuỗi hiển thị bằng tiếng Việt có dấu đầy đủ.
- Chữ trong UI là tiếng Việt, giọng thân thiện, không dùng từ "chữa bệnh".

## Trước khi mở PR

Xem mục "Định nghĩa Xong" trong `docs/roles.md`. Tóm tắt: có test, có RLS nếu chạm dữ liệu
người dùng, có trạng thái rỗng và trạng thái lỗi, và `typecheck` + `lint` + `test` đều xanh.
