# Phân công 5 người — NutriBoost (bản điều chỉnh)

> Bản gốc có 5 vai trò. Tài liệu này giữ nguyên 5 vai trò nhưng sửa **phạm vi** và **ranh giới sở hữu**
> để không ai chờ ai và không có hạng mục nào vô chủ.

---

## 1. Bảng phân công điều chỉnh

| Vai trò | Tên gọi                            | Trách nhiệm chính (R1)                                                                                                                                                                                               | Thay đổi so với bản gốc                                                                                                                 |
| ------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **TV1** | Lead / Kiến trúc sư                | Khung dự án, schema DB, migration, `CODEOWNERS`, ADR, **CI + QA owner**, hợp đồng types/zod dùng chung, review bảo mật                                                                                               | **Bỏ** "review & merge tất cả PR". Chỉ bắt buộc duyệt `packages/db`, `packages/ai`, `supabase/migrations`. PR khác cần 1 reviewer chéo  |
| **TV2** | Auth & Dữ liệu nền                 | Đăng nhập/mã hoá, hạn mức API, RLS, `profiles`/`consents`, quyền xoá dữ liệu, **công cụ import + ràng buộc DB cho dữ liệu món**, lưu trữ hội thoại (`chat_threads`/`chat_messages`)                                  | **Bỏ** "300 món Việt" (chuyển sang TV3). **Thêm** hạn mức API (rate limit) và tầng lưu trữ chat                                         |
| **TV3** | AI & Nghiệp vụ dinh dưỡng          | Công thức BMI/BMR/TDEE, **tính đúng của toàn bộ dữ liệu món Việt**, **Food understanding pipeline**, AI Gateway, prompt, **eval owner**, cost tracking, guardrail an toàn, **bộ dựng lịch tập** và **luật nhắc nhở** | **Nhận thêm** quyền sở hữu dữ liệu dinh dưỡng; **thêm** eval, guardrail, lịch tập và nhắc nhở là hạng mục bắt buộc, không phải tuỳ chọn |
| **TV4** | Giao diện người dùng               | **Console PT** (quản lý khách, duyệt thực đơn AI, theo dõi tiến độ khách), Onboarding, **Ghi nhận**, **Hôm nay**, **Kế hoạch**, **Coach** (gồm các component generative UI trong chat), **Lịch tập**                 | **Đảo ngược**: console PT trở lại Release 1 thay vì lùi sang R2 — PT là người trả tiền, xem `docs/PRICING.md`                           |
| **TV5** | Design System & Trợ lý & Analytics | Design tokens, mobile-first shell, biểu đồ, **toàn bộ lớp trợ lý 3 tầng** (AskBar/dock/fullscreen/đa hội thoại), **icon SVG tự vẽ**, PWA, accessibility, **analytics + funnel**                                      | **Bỏ** "seed data". **Nhận thêm** lớp trợ lý và analytics là hạng mục có chủ                                                            |

---

## 2. Ranh giới sở hữu theo thư mục

Được cưỡng chế bằng `.github/CODEOWNERS`, không phải bằng quy ước miệng.

| Đường dẫn                               | Chủ sở hữu                    | Bắt buộc duyệt bởi |
| --------------------------------------- | ----------------------------- | ------------------ |
| `supabase/migrations/**`                | TV1                           | TV1                |
| `packages/db/**`                        | TV1 + TV2                     | TV1                |
| `packages/nutrition/**`                 | TV3                           | TV3                |
| `packages/ai/**`                        | TV3                           | TV1 + TV3          |
| `packages/seed/**`                      | TV2 (tooling) + TV3 (dữ liệu) | TV3                |
| `apps/web/src/components/icons/**`      | TV5                           | TV5                |
| `apps/web/src/components/assistant/**`  | TV5                           | TV5                |
| `apps/web/src/components/generative/**` | TV4                           | TV5                |
| `apps/web/src/app/api/**`               | người viết                    | TV1                |
| `docs/**`                               | TV1                           | —                  |

---

## 3. Định nghĩa "Xong" (Definition of Done) — áp dụng cho mọi story

Một story chỉ được coi là xong khi:

1. Có **test** đi kèm (unit cho logic, E2E cho luồng người dùng).
2. Có **RLS policy** nếu chạm dữ liệu người dùng, và policy đó có test.
3. Có **trạng thái rỗng + trạng thái lỗi**, không chỉ trạng thái có dữ liệu.
4. Chữ tiếng Việt **có dấu đúng**, không viết tắt tuỳ tiện trong UI.
5. Mọi output AI đều có **disclaimer** và **đường sửa trong ≤ 1 tap**.
6. `npm run typecheck && npm run lint && npm run test` xanh.
7. Không thêm dependency icon library (CI chặn).

---

## 4. Lộ trình R1a + R1b

### Tuần 0 — chốt hợp đồng (2 ngày, cả đội, TV1 dẫn)

Monorepo → CI → migration khung + types sinh tự động → `packages/nutrition` interface + test vector →
zod schema dùng chung → **mock fixtures + MSW handler mock Gemini**.

**Cổng kiểm soát:** TV4/TV5 chạy được toàn bộ UI trợ lý với mock, không cần Supabase hay Gemini thật.

### R1a — vòng lặp sức khoẻ (Tuần 1–3)

| Tuần | TV1                                     | TV2                                               | TV3                                                 | TV4                              | TV5                                         |
| ---- | --------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | -------------------------------- | ------------------------------------------- |
| 1    | Schema + RLS + CODEOWNERS + CI          | Auth, `profiles`, `consents`, seed tooling        | `packages/nutrition` + test vector; 120 nguyên liệu | Onboarding + "Hôm nay" trên mock | Design tokens, 5 tab, khung 8 màn, `BoIcon` |
| 2    | Review migration, test RLS 2 người dùng | Hạn mức API, `refresh_daily_summary`, xoá dữ liệu | AI Gateway + `estimate_meal` + eval 100 câu         | `/ghi-nhan` nối API thật         | PWA, biểu đồ, accessibility                 |
| 3    | ADR deploy, review bảo mật              | 180 món + alias                                   | `generate_plan` + `insight` + guardrail             | `/ke-hoach`                      | Trạng thái rỗng/lỗi, analytics              |

### R1b — trợ lý AI-Native (Tuần 3–5, song song từ tuần 3)

| Tuần | Việc                                                                                 | Chủ       |
| ---- | ------------------------------------------------------------------------------------ | --------- |
| 3    | Provider + store zustand + AskBar tầng 1                                             | TV5       |
| 3    | Kiểm chứng 0.5h API `Chat`/`setMessages` trên `ai@7.0.105`                           | TV1 + TV3 |
| 4    | Dock 400px luôn mount + animate width 320ms + Esc ở fullscreen → sidebar + cột 768px | TV5       |
| 4    | `chat` streaming + 8 tool + registry generative UI + custom part `data-suggestions`  | TV3 + TV4 |
| 5    | Đa hội thoại (threads, tiêu đề AI, ghim/xoá, `?c=`)                                  | TV2 + TV4 |
| 5    | Bottom sheet mobile + bàn phím iOS; E2E; Lighthouse                                  | TV5 + TV1 |

**Điểm chốt:** sau Tuần 3 có bản dùng được (ghi bữa ăn + insight). Sau Tuần 5 có trợ lý 3 tầng đầy đủ.

---

## 5. Quy tắc làm việc nhóm

- **PR tối đa 400 dòng thay đổi.** PR lớn hơn phải tách.
- **Nhánh:** `feat/<tvX>-<mô-tả>`, `fix/...`, `docs/...`. Conventional commits, commitlint chặn ở hook.
- **Không tự đổi hợp đồng types/zod** — đề xuất qua PR vào `packages/db` và cần TV1 duyệt.
- **Không gọi SDK AI trực tiếp** ở bất kỳ đâu ngoài `packages/ai`. Có ESLint rule chặn.
- **Không thêm dependency mới** mà không nêu lý do trong PR description.

---

## 6. Trạng thái hiện tại so với bảng phân công gốc

> Cập nhật lần cuối sau khi nối xong tầng dữ liệu thật và mở rộng danh mục món. Đây là chỗ để
> không ai phải đoán.

### Đã xong

| Vai trò   | Hạng mục                                         | Ghi chú                                                                                  |
| --------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| TV1       | Khung dự án, schema, migration, `CLAUDE.md`, CI  | 10 migration; CI 3 job xanh                                                              |
| TV1       | Test RLS hai người dùng                          | `packages/db/src/__tests__/` trên PGlite — 55 test, có kiểm chứng ngược                  |
| TV2       | Đăng nhập magic link                             | `/auth/callback`, `middleware.ts` làm mới phiên và bảo vệ route, `/dang-xuat`            |
| TV2       | Quyền xoá dữ liệu                                | `DELETE /api/tai-khoan`, xác nhận hai bước, xoá `auth.users` để cascade dọn hết          |
| TV2       | Mã mời                                           | Bảng + hàm + RLS + màn `/pt/loi-moi` + màn `/tham-gia`. Xem `docs/INVITES.md`            |
| TV2       | Hạn mức API                                      | `claim_ai_quota` cưỡng chế trong CSDL, gọi qua `SupabaseAiStore`                         |
| TV2 + TV4 | **Console PT đọc dữ liệu thật**                  | Cả năm màn: `/pt`, `/pt/khach/[clientId]`, `/pt/loi-moi`, `/pt/duyet`, `/pt/goi`         |
| TV3       | BMI/BMR/TDEE, prompt, guardrail, eval            | 461 test đơn vị; eval 50/50 và 9/9                                                       |
| TV3       | Cost tracking                                    | `SupabaseAiStore` ghi `ai_calls` cho từng lượt chat, kèm chi phí tính từ bảng giá        |
| TV3       | Nhật ký bữa ăn bằng AI                           | `log_meal` ghi thật vào `meal_logs` + `meal_log_items`                                   |
| TV3       | Lịch tập, luật nhắc nhở                          | Bộ dựng tất định + 34 test; console đọc luật nhắc thật từ `reminder_rules`               |
| TV4       | Toàn bộ 8 màn khách hàng + console PT            | Giao diện đầy đủ, có trạng thái rỗng và lỗi                                              |
| TV5       | Design system, lớp trợ lý 3 tầng, icon SVG tự vẽ | Xem `docs/DESIGN-SYSTEM.md`, `docs/ASSISTANT-UX.md`                                      |
| TV5       | Biểu đồ                                          | `LineChart` + `BarChart` SVG tự vẽ, có bảng dữ liệu ẩn cho trình đọc màn hình            |
| TV5       | PWA                                              | 4 cỡ icon sinh từ `scripts/generate-icons.mjs`, service worker chỉ cache tài nguyên tĩnh |

### Còn thiếu, và ai quyết định

| #   | Việc                                  | Ai       | Vì sao chưa làm                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`generate_plan` chưa ghi vào CSDL** | TV3      | Đây là thứ chặn hàng đợi duyệt thực đơn. `/pt/duyet` **đã** đọc dữ liệu thật (`plans` có `status = 'draft'`), nên nó trống một cách trung thực — nhưng chưa có gì tạo ra hàng `draft`, vì bộ dựng thực đơn mới chạy ở tầng ứng dụng và trả về đối tượng trong bộ nhớ. Nối nó vào `plans` + `plan_items` mở khoá luôn thực đơn lưu trữ cho khách.            |
| 2   | **Nguyên liệu chưa đối chiếu nguồn**  | TV3      | 33 nguyên liệu, và mọi dòng đều ghi rõ là số liệu tham chiếu để phát triển. Cần đối chiếu _Bảng thành phần dinh dưỡng thực phẩm Việt Nam_ (Bộ Y tế, 2007) rồi đặt `verified = true`. Món ăn thì đã đi trước: chúng định nghĩa bằng **thành phần × gram**, nên chỉ số trên 100 g do CSDL tính ra — thêm món không cần bịa số liệu, thêm nguyên liệu thì cần. |
| 3   | **Trạng thái "tạm dừng" của khách**   | TV1      | `pt_clients.status` chỉ có `pending \| active \| ended`, nên console thật **không** sinh ra được `'paused'`. Muốn có thì phải thêm giá trị vào kiểu enum. `deriveClientStatus` ghi rõ điều này trong comment.                                                                                                                                               |
| 4   | **Lưu hội thoại vào `chat_threads`**  | TV2      | Đa hội thoại hiện giữ trong `localStorage`. Đổi máy là mất. Bảng đã có sẵn trong CSDL.                                                                                                                                                                                                                                                                      |
| 5   | **Một PT mới lấy gói ở đâu**          | sản phẩm | Chưa có trang quản trị và chưa có cổng thanh toán. `docs/INVITES.md` §3 nêu ba hướng kèm đánh đổi. Console nay hiện thẳng "Chưa có gói đang hiệu lực" thay vì bịa ra gói Plus.                                                                                                                                                                              |
| 6   | **Trang quản trị**                    | TV1      | Chưa có. Đổi vai trò và tạo gói phải làm bằng SQL.                                                                                                                                                                                                                                                                                                          |
| 7   | **Nhắc nhở gửi thật**                 | TV3      | Console đọc được luật nhắc thật, nhưng chưa có đường **gửi**: chưa có tiến trình nền, chưa có đăng ký push.                                                                                                                                                                                                                                                 |
| 8   | **Analytics**                         | TV5      | Bảng `analytics_events` có, chưa có code ghi.                                                                                                                                                                                                                                                                                                               |

### Danh mục món Việt

| Chỉ số             | Hiện tại | Mục tiêu trong `packages/seed` |
| ------------------ | -------- | ------------------------------ |
| Nguyên liệu        | 33       | 120                            |
| Món ăn             | 58       | 180                            |
| Tổng bản ghi       | 91       | 300                            |
| Thành phần của món | 245      | —                              |

Món ăn đã đi được phần lớn đường (18 → 58) mà **không cần một con số dinh dưỡng bịa nào**, vì
chỉ số của món được tính từ thành phần. Chặng còn lại nằm ở nguyên liệu, và nó chờ bản gốc của
bảng thành phần dinh dưỡng — xem mục còn thiếu số 2.

### Hai việc nên làm trước khi phát hành

1. **Đối chiếu `packages/seed` với bản gốc** và đặt `verified = true` cho từng dòng đã kiểm.
   Hiện toàn bộ là số liệu tham chiếu để phát triển, ghi rõ trong comment đầu
   `packages/seed/src/data/ingredients.ts`.
2. **Chuyển Gemini sang gói trả tiền.** Gói miễn phí cho phép Google dùng nội dung để cải thiện
   sản phẩm — không chấp nhận được với dữ liệu sức khoẻ.
