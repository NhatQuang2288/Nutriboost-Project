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
npm run dev              # chạy web ở http://localhost:3000
npm run typecheck        # kiểm tra kiểu toàn workspace
npm run lint
npm run db:check         # chạy migration + seed trên PostgreSQL thật (không cần Docker)
npm run env:link         # nối apps/web/.env.local → .env.local ở gốc (bắt buộc, chạy một lần)
npm run env:check        # kiểm tra .env.local và kết nối Supabase (cần Supabase đang chạy)
npm run check:live       # kiểm chứng đường dữ liệu THẬT qua PostgREST + RLS thật
npm run check:live:ui    # walkthrough thật trong trình duyệt (cần Supabase + npm run dev)
npm run make:pt          # nâng một tài khoản thành PT kèm gói — dựng cảnh thử console PT
npm run icons:generate   # sinh lại icon PWA trong apps/web/public/
npm run test             # vitest
npm run e2e              # playwright (cần cài trình duyệt trước)
npm run db:start         # khởi động Supabase local (cần Docker Desktop)
npm run db:stop          # dừng Supabase local — BẮT BUỘC sau khi sửa supabase/config.toml
npm run db:status        # cổng dịch vụ, khoá, và hộp thư bắt mail
npm run db:reset         # nạp lại schema + seed vào Supabase local (XOÁ dữ liệu local)
npm run seed             # nạp dữ liệu món Việt
npm run eval             # chạy bộ đánh giá AI
```

### Bộ test RLS chạy trên PostgreSQL thật

`packages/db/src/__tests__/` dựng một PGlite (PostgreSQL biên dịch sang WASM), chạy toàn bộ
migration rồi **nạp cả `supabase/seed.sql`**, và thay `auth.uid()` bằng một biến phiên để đổi
được danh tính giữa các lời gọi.

Vì sao cần: `scripts/check-migrations.mjs` chỉ chứng minh policy viết đúng cú pháp — `auth.uid()`
trong đó luôn là `null`, mà `null` thì không khớp hàng nào, nên mọi policy đều "đúng" một cách
vô nghĩa. Ba tệp trong `__tests__/` là chỗ duy nhất chứng minh policy **chặn đúng người**.

```bash
npx vitest run packages/db/src/__tests__/     # chỉ chạy bộ test RLS
```

Khi thêm bảng hoặc hàm mới, thêm test vào đây. Và hãy kiểm chứng test của bạn thật sự bắt được
lỗi: bỏ thứ mình vừa viết ra rồi xem test có đỏ không. Một test RLS không bao giờ đỏ là một test
vô dụng.

### Bốn tầng kiểm chứng, và mỗi tầng bắt được một loại lỗi khác nhau

| Tầng      | Lệnh                    | Bắt được gì                                                        | KHÔNG bắt được gì                                |
| --------- | ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| Migration | `npm run db:check`      | Cú pháp PL/pgSQL, ràng buộc, số dòng seed                          | RLS (vì `auth.uid()` luôn `null`)                |
| RLS       | `npm run test`          | Policy chặn đúng người, hàm ghi nguyên tử                          | PostgREST, và `grant`/`revoke` trên vai trò thật |
| Tích hợp  | `npm run check:live`    | PostgREST chuyển tham số mảng, JWT thật, quyền gọi hàm thật        | Chỉ chạy được khi Supabase đang bật              |
| Giao diện | `npm run check:live:ui` | Luồng đăng nhập thật, quy tắc chuyển hướng, dữ liệu hiện khớp CSDL | Cần dev server đang chạy                         |

`check:live` tồn tại vì **PostgREST không chuyển tham số giống trình điều khiển thô**. Một hàm
nhận `text[]` có thể chạy tốt trên PGlite mà hỏng qua PostgREST — `complete_onboarding` nhận hai
tham số mảng, nên nó là chỗ dễ vỡ nhất. Script tự tạo một người dùng tạm, chạy qua toàn bộ vòng
lặp sức khoẻ và sáu kiểm tra bảo mật, rồi xoá người dùng đó.

```bash
npm run db:start && npm run db:reset && npm run check:live
```

`check:live:ui` là tầng **thứ tư**, và nó không thay thế được bằng gì khác: nó mở liên kết
đăng nhập trong Chromium. Hai lỗi thật chỉ lộ ra ở đây — `GOTRUE_URI_ALLOW_LIST` từ chối
`/auth/callback` (Supabase lặng lẽ trả người dùng về trang chủ), và màn kết quả onboarding
tính một con số còn Server Action lưu một con số khác.

```bash
npm run dev            # terminal khác
npm run check:live:ui
```

## Cạm bẫy môi trường (đã gặp thật)

### `.env.local` phải nằm trong `apps/web/` — chạy `npm run env:link`

Next.js **chỉ đọc file env trong thư mục app**, không đọc ở gốc monorepo. Đặt
`.env.local` ở gốc rồi chạy `npm run dev` thì ứng dụng vẫn khởi động, trang vẫn mở,
nhưng **không biến nào được nạp**: Supabase trả về rỗng và trợ lý Bơ im lặng rơi về câu
trả lời mặc định. Không có lỗi nào hiện ra để mà lần theo.

```bash
cp .env.example .env.local   # điền khoá vào file ở gốc
npm run env:link             # nối apps/web/.env.local → ../../.env.local
npm run env:check            # kiểm tra, bao gồm cả symlink này
```

Dùng symlink để chỉ có một file phải sửa. `env:check` báo lỗi nếu thiếu symlink.

### `npm install` lỗi EPERM

Trên máy bình thường, `.npmrc` đã trỏ cache vào `./.npm-cache` nên không sao.

Nếu biến `npm_config_cache` đã được set trong môi trường (một số sandbox làm vậy),
**biến môi trường sẽ thắng `.npmrc`**. Khi đó phải thêm cờ CLI, vì cờ CLI thắng env:

```bash
npm install --cache ./.npm-cache
```

Cách khác: `sudo chown -R 501:20 ~/.npm` để dùng lại cache mặc định.

### Supabase CLI không phải dependency — ba script đi qua `scripts/supabase.mjs`

`db:start`, `db:reset` và `db:types` từng gọi thẳng `supabase`, nhưng CLI đó **không** nằm
trong `dependencies` lẫn PATH. Cả ba đổ ngay lần chạy đầu với `sh: supabase: command not
found`, dù tài liệu vẫn chỉ dẫn dùng chúng.

Nay chúng đi qua `scripts/supabase.mjs`, chạy `npx --yes supabase@<phiên bản>`. Phiên bản
ghim ở **một chỗ** trong tệp đó. Không thêm CLI vào `devDependencies` vì `postinstall` của nó
tải tệp nhị phân vài chục MB — mọi người đóng góp đều phải trả giá, kể cả người chỉ sửa giao
diện.

`supabase db reset` cần **Docker Desktop đang chạy**. Kiểm tra nhanh:

```bash
docker info >/dev/null && echo "docker OK" || echo "Docker chưa chạy"
```

### Sửa `supabase/config.toml` thì phải `db:stop` rồi `db:start`

Cấu hình Supabase được nhúng vào **biến môi trường của container** lúc tạo. `config.toml`
chỉ là nguồn; CLI đọc nó rồi truyền giá trị vào container khi `start`. Nên sửa tệp mà không
khởi động lại thì **không có gì đổi cả**, và triệu chứng sẽ là "sửa rồi mà vẫn hỏng".

Đã trả giá cho việc này: `GOTRUE_URI_ALLOW_LIST` giữ giá trị cũ suốt, khiến liên kết đăng
nhập bị trả về `site_url` thay vì `/auth/callback`.

```bash
npm run db:stop && npm run db:start
```

Kiểm tra giá trị mà container thật sự nhận:

```bash
docker inspect supabase_auth_Nutriboost_Project --format '{{range .Config.Env}}{{println .}}{{end}}' | grep GOTRUE
```

### Test đọc biến môi trường phải kiểm soát MỌI biến nó phụ thuộc

`verify` trong CI đặt bốn biến ở cấp job: `AI_KILL_SWITCH=true`, `GEMINI_API_KEY=''`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ở máy thì những biến đó nằm
trong `.env.local`, mà Vitest **không** nạp tệp đó.

Nghĩa là một test có thể xanh ở máy và đỏ ở CI (hoặc ngược lại) chỉ vì môi trường khác nhau.
Đã xảy ra thật: test "nói rõ lý do khi chưa có khoá" chỉ xoá `GEMINI_API_KEY`, trong khi
`aiDisabledReason` xét công tắc dừng **trước** khoá — nên ở CI nó rơi vào nhánh bảo trì và đỏ.

Cách chạy để bắt được loại lỗi này trước khi đẩy:

```bash
AI_KILL_SWITCH=true GEMINI_API_KEY='' \
  NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-dummy-anon-key \
  npm run test
```

Quy tắc: một test chạm `process.env` thì phải đặt **tất cả** biến mà đường mã nó kiểm tra đọc
tới, không chỉ biến nó đang nhắm.

### Chạy lệnh npm từ ĐÚNG thư mục dự án

Đường dẫn có dấu cách, nên phải bọc trong dấu nháy:

```bash
cd "/Users/lenguyennhatquang/Desktop/Nutriboost Project"
```

Chạy `npm run ...` từ thư mục nhà sẽ đổ với `ENOENT: Could not read package.json:
/Users/<tên>/package.json` — thông báo nói về `package.json` chứ không nói về thư mục, nên
đọc qua rất dễ tưởng là dự án hỏng.

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

### Công cụ của trợ lý Bơ không được ném lỗi

Khi một tool không làm được việc được yêu cầu, **trả về `toolRefusal(message)`** thay vì
`throw`. AI SDK che nội dung lỗi trước khi nó tới model, nên model không biết vì sao và sẽ
tự bịa ra lý do. Đã xảy ra thật: khi chưa nối cơ sở dữ liệu, Bơ nói với người dùng "lỗi hệ
thống tạm thời, bạn thử lại sau" — trong khi thử lại bao nhiêu lần cũng không được.

`message` phải nói thẳng sự thật và chỉ rõ model phải nói gì. Cầu nối trong
`packages/ai/src/chat.ts` bỏ qua kết quả từ chối nên không có thẻ giao diện nào được dựng.

### Đầu ra công cụ phải tới được giao diện

Model phát ra phần `tool-*`, còn giao diện **chỉ vẽ từ `data-*`**. Cầu nối
`bridgeToolOutputsToDataParts` trong `packages/ai/src/chat.ts` làm việc đó. Thêm tool mới
thì phải có tên trong `TOOL_TO_COMPONENT`, nếu không giao diện sẽ im lặng không hiện gì —
không lỗi, không log. `packages/ai/src/__tests__/chat.test.ts` khoá bất biến này lại.

### Hàm `security definer` phải được `revoke` tường minh

PostgreSQL cấp `EXECUTE` cho **`PUBLIC`** trên mọi hàm mới theo mặc định. Với hàm
`security definer`, điều đó nghĩa là bất kỳ ai cũng gọi được nó qua PostgREST, kể cả khi
không có quyền nào trên những bảng mà nó đọc ghi — vì hàm chạy bằng quyền của chủ sở hữu.

Đã có bốn hàm rơi đúng vào trường hợp này, trong đó hai cái gây hậu quả thật:

- `active_subscription(uuid)` nhận `owner_id` tuỳ ý → đọc được điều khoản gói của mọi PT khác.
- `claim_ai_quota(uuid, ai_purpose, integer)` nhận **cả hạn mức** từ người gọi → tự nâng trần
  lượt AI của mình là được, tức là vô hiệu hoá đúng ràng buộc kinh tế trong `docs/PRICING.md`.

Quy tắc: hàm `security definer` nhận tham số trỏ tới người dùng khác **phải** có
`revoke all on function … from public, anon, authenticated`. Migration 006 làm việc đó cho
bốn hàm đầu tiên.

```sql
revoke all on function public.ten_ham(uuid) from public, anon, authenticated;
grant execute on function public.ten_ham(uuid) to service_role;   -- nếu tầng ứng dụng cần
```

**Cái bẫy ngược lại:** hàm trigger chạy theo quyền **người gọi** (như `touch_updated_at`)
thì KHÔNG được thu hồi. Thu hồi sẽ làm mọi `insert`/`update` của người dùng đổ lỗi
`permission denied for function`.

### Hai chế độ dữ liệu phải nói ra, không được đoán

Mọi thành phần đọc dữ liệu đều chạy được ở hai chế độ: **thật** (có Supabase + có phiên) và
**dữ liệu mẫu** (chưa cấu hình). Lớp dữ liệu trả về trường `source: 'demo' | 'live'` và giao
diện có trách nhiệm nói rõ đang ở chế độ nào.

Lý do: trước đây không có trường đó, nên một người dùng **đã đăng nhập nhưng chưa thiết lập
hồ sơ** vẫn thấy "Chào Minh" kèm 2.120 kcal như thể đó là hồ sơ của họ. Màn `/hom-nay` và
`/tien-do` hiện một dòng nói thẳng khi ở chế độ mẫu, và `ensureProfileReady` đưa người dùng
đã đăng nhập về `/onboarding` nếu hồ sơ chưa xong.

Bộ kiểm thử đầu-cuối chạy ở chế độ dữ liệu mẫu (Playwright khai báo ba biến Supabase là chuỗi
rỗng trong `webServer.env`). Đừng làm hỏng chế độ đó.

## Trước khi mở PR

Xem mục "Định nghĩa Xong" trong `docs/roles.md`. Tóm tắt: có test, có RLS nếu chạm dữ liệu
người dùng, có trạng thái rỗng và trạng thái lỗi, và `typecheck` + `lint` + `test` đều xanh.
