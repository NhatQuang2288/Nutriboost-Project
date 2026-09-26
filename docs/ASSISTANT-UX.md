# Đặc tả lớp Trợ lý AI-Native — 3 tầng leo thang

> Hợp đồng thi hành cho `apps/web/src/components/assistant/**`.
> Mọi con số trong tài liệu này đều có test E2E tương ứng (xem §11).

---

## 1. Định danh

| Hạng mục        | Giá trị                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| Tên             | **Bơ** (hằng số `ASSISTANT.name`)                                                           |
| Câu mở đầu      | "Mình là Bơ. Bạn muốn ăn gì hôm nay?"                                                       |
| Chữ ký bắt buộc | "Bơ có thể sai. Không thay thế tư vấn y khoa."                                              |
| Icon            | `<BoIcon state="idle" \| "thinking" \| "speaking" />` — SVG tự vẽ, không dùng thư viện icon |

### 1.1 BoIcon

- Grid 24×24 nhưng render ở `1em` để ăn theo `font-size`, `fill="currentColor"`.
- Hình: đầu robot có **mặt kính xanh rừng**, hai mắt cong `^^`, hai tai bo tròn và **mầm hai lá**
  trên đỉnh — lấy đúng linh vật trong logo. Một `<path>` cho đầu, hai cho lá, hai cho mắt.
- Ba trạng thái chạy bằng CSS keyframes trên class, **không** bằng JS animation:
  - `idle` — mắt cong như logo, nhịp thở nhẹ, 4s.
  - `thinking` — một mắt biến thành đồng hồ quay + mầm lá đung đưa, 1.2s.
  - `speaking` — mắt mở tròn, mầm lá vươn lên, 0.8s.
- Màu mặc định `forest-600`; `prefers-reduced-motion: reduce` → tắt keyframe, giữ hình tĩnh.
- `aria-hidden="true"` khi icon đứng cạnh nhãn chữ; có `aria-label="Bơ"` khi đứng một mình.

**Linh vật trong logo chính là trợ lý Bơ — không tạo nhân vật thứ hai.**
Chi tiết token, thang chữ và linh vật đầy đủ: `docs/DESIGN-SYSTEM.md` §10.

### 1.2 Bộ icon còn lại

`apps/web/src/components/icons/` chứa toàn bộ SVG tự viết: grid 24×24, `stroke-width: 1.5`,
`stroke="currentColor"`, `fill="none"`, `aria-hidden="true"`.
ESLint `no-restricted-imports` chặn `lucide-react`, `@heroicons/*`, `react-icons`,
`@radix-ui/react-icons`, `phosphor-react`. Đây là cổng kiểm soát trong CI.

---

## 2. Máy trạng thái

```ts
type AssistantMode = 'bar' | 'sidebar' | 'fullscreen'
```

State nằm trong `apps/web/src/stores/assistant.ts` (zustand), **sống ngoài panel**.
`mode` **không** lưu localStorage.

| Từ           | Sự kiện                                                 | Đến          | Ghi chú                                             |
| ------------ | ------------------------------------------------------- | ------------ | --------------------------------------------------- |
| `bar`        | Gõ nội dung + `Enter`                                   | `sidebar`    | **Mở sidebar VÀ gửi luôn**                          |
| `bar`        | Ô trống, bấm nút phải **"Mở rộng"**                     | `sidebar`    | Không gửi gì                                        |
| `bar`        | Phím `/` khi focus ngoài input/textarea/contenteditable | `bar`        | Focus ô chat + hiện gợi ý theo ngữ cảnh             |
| `bar`        | Click vào ô chat                                        | `bar`        | Hiện gợi ý theo ngữ cảnh                            |
| `sidebar`    | Nút toàn màn hình ở header                              | `fullscreen` |                                                     |
| `sidebar`    | Nút X                                                   | `bar`        | Giữ nguyên hội thoại                                |
| `sidebar`    | `Esc`                                                   | `bar`        | Quy ước bổ sung (spec gốc chưa nói)                 |
| `fullscreen` | `Esc`                                                   | `sidebar`    | **KHÔNG đóng panel**                                |
| `fullscreen` | Nút thu nhỏ                                             | `sidebar`    |                                                     |
| `fullscreen` | Nút X                                                   | `bar`        | Thoát hẳn                                           |
| bất kỳ       | Đổi route                                               | không đổi    | Panel ở `(app)/layout.tsx` nên không unmount        |
| bất kỳ       | Tải lại trang                                           | `bar`        | **Luôn bắt đầu ở tầng 1**; chỉ khôi phục `threadId` |

### 2.1 Khôi phục sau khi tải lại

| Khoá localStorage       | Nội dung           | Khôi phục?                      |
| ----------------------- | ------------------ | ------------------------------- |
| `nb.assistant.threadId` | Hội thoại gần nhất | **Có**, sau hydration           |
| `nb.assistant.mode`     | —                  | **Không.** Luôn bắt đầu ở `bar` |

---

## 3. Cấu trúc DOM

```tsx
// apps/web/src/app/(app)/layout.tsx
<AssistantProvider>
  {' '}
  {/* zustand store + 1 Chat instance */}
  <div className="app-shell">
    <main className="main-column">{children}</main>

    <aside id="assistant-dock" data-mode={mode} aria-hidden={mode === 'bar'} inert={mode === 'bar'}>
      <div className="dock-inner">{/* rộng cố định 400px */}</div>
    </aside>
  </div>
  {mode === 'bar' && <AskBar />}
</AssistantProvider>
```

`AssistantProvider` không bao giờ trả `null`. **Panel không bao giờ unmount.**

---

## 4. Tầng 1 — AskBar

| Thuộc tính                   | Giá trị                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| Vị trí                       | Nổi ở đáy **vùng nội dung** (`main`), `position: sticky; bottom: 16px` |
| Canh ngang                   | Căn giữa trong cột nội dung                                            |
| `max-width`                  | **680px** ở viewport ≥ 1024px                                          |
| Ô nhập                       | `<textarea>` 1 dòng tự giãn, tối đa 4 dòng                             |
| `Enter`                      | Gửi + chuyển sang `sidebar`                                            |
| `Shift+Enter`                | Xuống dòng                                                             |
| Nút phải khi **ô trống**     | **"Mở rộng"** → chuyển sang `sidebar`, không gửi                       |
| Nút phải khi **có nội dung** | **"Gửi"**                                                              |
| Phím `/`                     | Focus + hiện gợi ý theo ngữ cảnh màn hình                              |
| Draft                        | Giữ nguyên khi đổi tầng                                                |

### 4.1 Bàn phím trên iOS

- `height: 100dvh` cho shell, không dùng `100vh`.
- Listener `visualViewport.resize` để nâng AskBar khi bàn phím mở.
- Viewport meta: `viewport-fit=cover`, `interactive-widget=resizes-content`.

### 4.2 Gợi ý theo ngữ cảnh

Sổ đăng ký `apps/web/src/components/assistant/suggestions.ts`, tra theo `usePathname()`
(tránh lệch hydration). Hook `useScreenSuggestions()` cho màn hình đẩy thêm gợi ý động.

| Route       | Gợi ý mặc định                                                                          |
| ----------- | --------------------------------------------------------------------------------------- |
| `/hom-nay`  | "Hôm nay tôi còn bao nhiêu calo?" · "Gợi ý bữa tối nhẹ" · "Giải thích mục tiêu của tôi" |
| `/ghi-nhan` | "Sáng nay tôi ăn phở bò" · "Lặp lại bữa sáng hôm qua"                                   |
| `/ke-hoach` | "Đổi món tối thứ 4" · "Kế hoạch này đủ đạm chưa?"                                       |
| `/tien-do`  | "Vì sao cân tuần này tăng?" · "Tóm tắt tuần"                                            |
| `/toi`      | "Giải thích cách tính TDEE của tôi"                                                     |
| `mặc định`  | "Hôm nay tôi ăn gì?" · "Phân tích bữa gần nhất"                                         |

---

## 5. Tầng 2 — Sidebar

| Thuộc tính           | Giá trị                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| Bề rộng              | **400px**                                                                 |
| Hướng                | Trượt vào từ mép **phải**                                                 |
| Thời lượng           | **320ms**, `cubic-bezier(.32, .72, 0, 1)`                                 |
| Mở sẵn khi tải trang | **Không bao giờ**                                                         |
| Vai trò ARIA         | `role="complementary"`, **không** modal → vẫn tương tác được với nội dung |

### 5.1 Luật "chỉ animate width"

- Panel **luôn mount**. Thu gọn = `width: 0` + `overflow: hidden` + `inert` + `aria-hidden`.
- **Cấm** `display: none`. **Cấm** unmount. **Cấm** trả `null` — sẽ mất state hội thoại.
- `.dock-inner` rộng **cố định 400px** để chữ bên trong không reflow khi animate.
- `will-change: width` chỉ bật trong lúc chuyển, gỡ ở `transitionend`.
- `main` có `contain: layout paint` để giới hạn phạm vi reflow.
- `prefers-reduced-motion: reduce` → `transition-duration: 0ms`.

### 5.2 Mount lười phần nặng (bắt buộc)

State hội thoại nằm ở store, nên trước lần mở đầu tiên chỉ render khung rỗng.
Từ lần mở đầu tiên trở đi, `MessageList` và markdown **mount và ở lại mãi**.
Vừa giữ state, vừa không trả giá lúc tải trang.

### 5.3 Phương án dự phòng đã ghi nhận (ADR)

Animate `width` gây layout mỗi frame. Nếu đo FPS < 50 trên Android tầm trung:
chuyển `main` sang `transform: translateX()` + `padding-inline-end`, giữ nguyên hình ảnh và thời lượng.

---

## 6. Tầng 3 — Fullscreen

| Thuộc tính   | Giá trị                                        |
| ------------ | ---------------------------------------------- |
| Kích hoạt    | Nút trong header ở tầng 2                      |
| Kích thước   | `position: fixed; inset: 0`                    |
| Cột nội dung | **768px**, căn giữa                            |
| `Esc`        | Về `sidebar`. **KHÔNG đóng panel**             |
| Vai trò ARIA | `role="dialog" aria-modal="true"` + focus trap |
| Khi thu tầng | Trả focus về AskBar                            |

Không animate `width` tới `100vw` (gây jank) — dùng `position: fixed` + fade 180ms.

---

## 7. Điều chỉnh cho mobile

Spec gốc mang hình dạng desktop; sản phẩm là **mobile website**, nên 400px không tồn tại trên viewport 390px.

| Viewport       | AskBar                       | Tầng 2                                     | Tầng 3                               |
| -------------- | ---------------------------- | ------------------------------------------ | ------------------------------------ |
| **≥ 1024px**   | 680px, căn giữa cột nội dung | dock 400px **đẩy nội dung**                | fixed, cột 768px                     |
| **768–1023px** | `min(680px, 100% − 32px)`    | overlay 400px + scrim (không đẩy nội dung) | fixed, cột `min(768px, 100% − 32px)` |
| **< 768px**    | `calc(100% − 24px)`          | **bottom sheet `92dvh`**, trượt lên 280ms  | full-screen, header thu gọn          |

Trên mobile không có `Esc` → nút X + **vuốt xuống để hạ một tầng**
(ngưỡng: 25% chiều cao hoặc vận tốc > 500px/s).

---

## 8. Quản lý nhiều đoạn hội thoại

| Hạng mục               | Thiết kế                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bảng                   | `chat_threads(id, user_id, title, title_source, pinned, last_message_at, archived_at)` · `chat_messages(id, thread_id, role, parts jsonb, ai_call_id, created_at)` |
| Tiêu đề                | Sau lượt trao đổi đầu, `gemini-3.5-flash-lite` sinh tiêu đề tiếng Việt ≤ 6 từ, `title_source = 'ai'`; người dùng đổi tên được                                      |
| Bộ chuyển hội thoại    | Dropdown ở header dock: danh sách + tìm kiếm + ghim + đổi tên + xoá + lưu trữ                                                                                      |
| Đồng bộ URL            | `history.replaceState('?c=<threadId>')` — **không** dùng `router.push` để tránh remount                                                                            |
| Chuyển khi đang stream | **Khoá**, hiện cảnh báo thay vì cắt ngầm stream                                                                                                                    |
| Lưu khi huỷ            | Persist ở `onFinish` **và** `onAbort`                                                                                                                              |
| RLS                    | `chat_threads.user_id = auth.uid()`; `chat_messages` kiểm qua thread cha                                                                                           |

---

## 9. Generative UI

### 9.1 Nguyên tắc bất di bất dịch

**Mọi con số đến từ tool, không bao giờ từ lời văn của model.**
Model đóng vai người điều phối; tool giữ sự thật.

### 9.2 Sổ đăng ký component

Chỉ key có trong `generative/registry.ts` mới render được.
**Không `eval`**, **không** dynamic import theo tên do model sinh.

| Tool                         | Part type                 | Component                       | Tương tác                             |
| ---------------------------- | ------------------------- | ------------------------------- | ------------------------------------- |
| `search_food(query, limit)`  | `tool-search_food`        | `FoodCandidateChips`            | Chọn 1 món → gửi kết quả tool         |
| `estimate_meal(text)`        | `tool-estimate_meal`      | `MealConfirmCard`               | Sửa gram → xác nhận → ghi `meal_logs` |
| `log_meal(items)`            | `tool-log_meal`           | `MealLoggedReceipt`             | Hoàn tất                              |
| `compute_targets()`          | `tool-compute_targets`    | `TargetSummaryCard`             | Giải thích BMR/TDEE/macro             |
| `get_progress(range)`        | `tool-get_progress`       | `ProgressChartCard`             | Recharts, thu gọn được                |
| `generate_plan(weekStart)`   | `tool-generate_plan`      | `PlanPreviewWeek`               | Duyệt / đổi món                       |
| `show_safety_notice(reason)` | `tool-show_safety_notice` | `SafetyNoticeCard`              | Chuyển hướng chuyên gia               |
| `ask_user_choice(options)`   | `tool-ask_user_choice`    | `ChoiceChips` + `addToolOutput` | Tool phía client                      |

### 9.3 Render theo `part.state` (API AI SDK v7)

| `part.state`                                | Render                               |
| ------------------------------------------- | ------------------------------------ |
| `input-streaming`                           | Skeleton                             |
| `input-available`                           | Card có nút, chờ người dùng          |
| `output-available`                          | Card kết quả                         |
| `output-error`                              | Card lỗi + nút "thử lại"             |
| `approval-requested` / `approval-responded` | Luồng xác nhận trước khi ghi dữ liệu |

- Client tools: `onToolCall` + `addToolOutput`. **Luôn kiểm tra `if (toolCall.dynamic)` trước.**
- Server tools: có `execute`. Dùng `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`.
- Props do model sinh **validate lại bằng zod ở client** trước khi render (an toàn 2 lớp).
- Tên component lạ → **card dự phòng**, không render tuỳ ý.

### 9.4 Chi phí & hiệu năng

- Payload tool result ≤ **300 token** (chỉ id + số, không nhồi danh sách).
- Lịch sử: **12 tin nhắn gần nhất** + bản tóm tắt cuộn cho phần cũ.
- Markdown qua `streamdown`, **không bật HTML thô**.
- Chip nối tiếp lấy từ custom data part `data-suggestions`.

---

## 10. Phím tắt

| Phím               | Hành vi                                                                                |
| ------------------ | -------------------------------------------------------------------------------------- |
| `/`                | Focus AskBar + hiện gợi ý (bỏ qua khi đang focus trong input/textarea/contenteditable) |
| `Enter`            | Gửi                                                                                    |
| `Shift+Enter`      | Xuống dòng                                                                             |
| `Esc` (fullscreen) | Về sidebar, **không đóng panel**                                                       |
| `Esc` (sidebar)    | Về AskBar                                                                              |
| `Esc` (bar)        | Bỏ focus                                                                               |
| `Ctrl/Cmd + J`     | Bật/tắt sidebar                                                                        |

---

## 11. Tiêu chí nghiệm thu (mỗi dòng là một test E2E)

1. Panel **không unmount**: mở sidebar → gửi tin → điều hướng qua 3 route → hội thoại còn nguyên.
2. **Không tự mở khi tải trang**: `goto` 6 route, `dock` width = `0px` mỗi lần.
3. `Esc` ở fullscreen → `data-mode="sidebar"`, panel **vẫn mở**.
4. `transition-duration` của dock = **320ms ± 20ms**.
5. Cột nội dung fullscreen = **768px**, căn giữa.
6. AskBar `max-width` = **680px** ở viewport ≥ 1024px.
7. Ô trống → nút phải là "Mở rộng"; có chữ → nút phải là "Gửi".
8. `Enter` khi có chữ → `data-mode="sidebar"` **và** tin nhắn đã gửi.
9. Phím `/` → gợi ý đúng theo route; **không** kích hoạt khi focus trong input.
10. Draft không mất khi đổi tầng.
11. `prefers-reduced-motion: reduce` → duration `0ms`.
12. Generative UI: tên component lạ → card dự phòng; props sai zod → không crash.
13. CI chặn import icon library.
14. Không màn nào có > 1 CTA chính.
15. Mọi output AI đều có chuỗi "Không thay thế tư vấn y khoa".
