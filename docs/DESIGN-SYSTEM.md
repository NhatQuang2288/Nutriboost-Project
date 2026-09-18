# NutriBoost — Design System

> Bảng màu trong tài liệu này **được trích trực tiếp từ file logo** (phân cụm điểm ảnh),
> không phải phỏng đoán. Mọi cặp màu chữ/nền đều có tỉ lệ tương phản WCAG tính sẵn.
>
> Token được thi hành trong `apps/web/src/app/globals.css` bằng cú pháp `@theme` của Tailwind 4.

---

## 1. Nguồn gốc bảng màu

Phân cụm toàn bộ điểm ảnh có màu của logo cho ra hai màu lõi chiếm **72 %** điểm ảnh có màu:

| Màu           | Hex       | Tỉ lệ  | Vai trò trong logo                    |
| ------------- | --------- | ------ | ------------------------------------- |
| Xanh rừng đậm | `#324B2E` | 31,3 % | Mặt kính robot, chữ "Nutri", quả mầm  |
| Xanh ô-liu    | `#839B4A` | 40,8 % | Vỏ đầu và thân robot, lá, chữ "boost" |

Các sắc độ trung gian quan sát được (`#889F58`, `#90A268`, `#A1B079`, `#ACBB8B`, `#BBC699`,
`#D4E1B8`, `#E4F0D1`) đều nằm trên trục ô-liu → thang màu bên dưới nội suy từ chính các giá trị này.

Nền là trắng ấm, không phải trắng tinh: `#FAFAF7` / `#F5F5F0`.

**Kết luận định hướng:** đây là hệ **duotone xanh** — xanh rừng đậm làm mực, xanh ô-liu làm năng lượng,
trên nền trắng ấm. Không dùng xanh dương, không dùng màu mè.

---

## 2. Bảng màu

### 2.1 Xanh rừng — mực và hành động chính

| Token                    | Hex           | Dùng cho                     |
| ------------------------ | ------------- | ---------------------------- |
| `--color-forest-50`      | `#F1F5EF`     | nền vùng nhấn nhẹ            |
| `--color-forest-100`     | `#E0E9DC`     | nền thẻ chọn                 |
| `--color-forest-200`     | `#C3D5BD`     | viền nhấn                    |
| `--color-forest-300`     | `#9DB796`     | biểu đồ phụ                  |
| `--color-forest-400`     | `#71906B`     | biểu đồ                      |
| `--color-forest-500`     | `#4E6948`     |                              |
| **`--color-forest-600`** | **`#324B2E`** | **mực chính, nền CTA chính** |
| `--color-forest-700`     | `#283C25`     | trạng thái nhấn của CTA      |
| `--color-forest-800`     | `#1E2D1C`     | nền tối                      |
| `--color-forest-900`     | `#151F13`     | nền tối nhất (dark mode)     |

### 2.2 Xanh ô-liu — năng lượng, tiến độ, thành công

| Token                   | Hex           | Dùng cho                                                        |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| `--color-olive-50`      | `#F7FAF0`     | nền vùng nhấn                                                   |
| `--color-olive-100`     | `#E4F0D1`     | nền nút phụ, nền chip                                           |
| `--color-olive-200`     | `#D4E1B8`     | viền chip                                                       |
| `--color-olive-300`     | `#BBC699`     |                                                                 |
| `--color-olive-400`     | `#A1B079`     |                                                                 |
| **`--color-olive-500`** | **`#839B4A`** | **nhấn thị giác: vòng tiến độ, icon, biểu đồ, chữ tiêu đề lớn** |
| `--color-olive-600`     | `#6E8440`     |                                                                 |
| `--color-olive-700`     | `#586A33`     | **nhấn cho chữ cỡ thường**                                      |
| `--color-olive-800`     | `#425027`     |                                                                 |
| `--color-olive-900`     | `#2C361A`     |                                                                 |

### 2.3 Trung tính ấm

| Token                 | Hex       | Dùng cho                                        |
| --------------------- | --------- | ----------------------------------------------- |
| `--color-neutral-0`   | `#FFFFFF` | nền thẻ                                         |
| `--color-neutral-50`  | `#FAFAF7` | **nền ứng dụng**                                |
| `--color-neutral-100` | `#F5F5F0` | nền chìm                                        |
| `--color-neutral-200` | `#E8E8E1` | đường kẻ                                        |
| `--color-neutral-300` | `#D6D6CC` | viền mạnh                                       |
| `--color-neutral-400` | `#A8A89E` | icon tắt                                        |
| `--color-neutral-500` | `#7A7A70` | **chỉ dùng cho icon/viền — KHÔNG dùng cho chữ** |
| `--color-neutral-600` | `#57574E` | **chữ phụ nhỏ nhất được phép**                  |
| `--color-neutral-700` | `#3D3D36` | chữ trên nền sáng                               |
| `--color-neutral-800` | `#26261F` |                                                 |
| `--color-neutral-900` | `#14140F` |                                                 |

### 2.4 Màu ngữ nghĩa

| Nhóm       | Nhấn thị giác         | Nền       | **Chữ**               |
| ---------- | --------------------- | --------- | --------------------- |
| Thành công | `olive-500` `#839B4A` | `#E4F0D1` | `olive-700` `#586A33` |
| Cảnh báo   | `#C98A2E`             | `#FBF0DC` | `#8A5F1C`             |
| Nguy hiểm  | `#B04A32`             | `#FBE7E2` | `#8A3521`             |
| Thông tin  | `#3A6B62`             | `#E3EFEC` | `#2A514A`             |

---

## 3. Quy tắc tương phản (đã đo, không phải ước lượng)

| Cặp màu                         | Tỉ lệ      | AA chữ thường (≥ 4,5) | AA chữ lớn / UI (≥ 3) |
| ------------------------------- | ---------- | --------------------- | --------------------- |
| `forest-600` trên `neutral-50`  | **9,21:1** | đạt                   | đạt                   |
| `forest-600` trên trắng         | **9,63:1** | đạt                   | đạt                   |
| `neutral-600` trên `neutral-50` | **6,98:1** | đạt                   | đạt                   |
| `neutral-500` trên `neutral-50` | 4,14:1     | **KHÔNG**             | đạt                   |
| `olive-500` trên trắng          | 3,11:1     | **KHÔNG**             | đạt                   |
| `olive-500` trên `forest-600`   | 3,10:1     | **KHÔNG**             | đạt                   |
| `olive-700` trên trắng          | **5,96:1** | đạt                   | đạt                   |
| `forest-600` trên `olive-100`   | **8,11:1** | đạt                   | đạt                   |
| trắng trên `forest-600`         | **9,63:1** | đạt                   | đạt                   |
| nguy hiểm `#B04A32` trên trắng  | **5,42:1** | đạt                   | đạt                   |
| cảnh báo `#8A5F1C` trên trắng   | **5,62:1** | đạt                   | đạt                   |
| thông tin `#3A6B62` trên trắng  | **6,07:1** | đạt                   | đạt                   |

### 3.1 Ba luật rút ra

1. **Mực chính luôn là `forest-600`.** Nó đạt 9,2:1 trên nền ứng dụng — thoải mái cho mọi cỡ chữ.
2. **`olive-500` là màu thị giác, không phải màu chữ.** Ở 3,11:1 nó chỉ hợp lệ cho chữ tiêu đề lớn
   (≥ 24 px đậm), icon, viền và vùng tô. Cần chữ ô-liu cỡ thường thì dùng `olive-700`.
3. **Không bao giờ dùng `neutral-500` cho chữ.** Nó chỉ đạt 4,14:1. Chữ phụ nhỏ nhất là `neutral-600`.

### 3.2 Nút bấm — quyết định có chủ ý

Ô-liu là màu của sự "boost", nhưng nó **không** làm được nền nút có chữ cỡ thường (3,10:1).
Vì vậy:

| Nút            | Nền          | Chữ                                        | Tỉ lệ  |
| -------------- | ------------ | ------------------------------------------ | ------ |
| **Chính**      | `forest-600` | trắng                                      | 9,63:1 |
| **Phụ**        | `olive-100`  | `forest-600`                               | 8,11:1 |
| **Nhấn ô-liu** | `olive-500`  | `forest-700`, **chỉ khi nhãn ≥ 18 px đậm** | 3,10:1 |
| **Nguy hiểm**  | `#B04A32`    | trắng                                      | 5,42:1 |
| **Mờ**         | trong suốt   | `forest-600`                               | —      |

---

## 4. Chữ

### 4.1 Hai họ chữ

| Vai trò              | Họ chữ             | Weight          | Lý do                                          |
| -------------------- | ------------------ | --------------- | ---------------------------------------------- |
| Tiêu đề, số liệu lớn | **Nunito**         | 700 / 800 / 900 | Đầu nét bo tròn, khớp dáng chữ trong logo      |
| Nội dung, giao diện  | **Be Vietnam Pro** | 400 / 500 / 600 | Thiết kế cho tiếng Việt, dấu xếp đúng ở cỡ nhỏ |

Cả hai nạp qua `next/font/google` với `subsets: ['latin', 'vietnamese']` và `display: 'swap'`.
Không tự host font, không dùng webfont ngoài luồng này.

### 4.2 Thang chữ (mobile-first)

| Token        | Cỡ / dòng                        | Weight | Họ             | Dùng cho                   |
| ------------ | -------------------------------- | ------ | -------------- | -------------------------- |
| `display-lg` | 32 / 38                          | 800    | Nunito         | số liệu lớn, màn chào mừng |
| `display`    | 28 / 34                          | 800    | Nunito         | con số kcal còn lại        |
| `h1`         | 24 / 30                          | 700    | Nunito         | tiêu đề màn hình           |
| `h2`         | 20 / 26                          | 700    | Nunito         | tiêu đề thẻ                |
| `h3`         | 17 / 23                          | 600    | Be Vietnam Pro | tiêu đề phụ                |
| `body-lg`    | 16 / 25                          | 400    | Be Vietnam Pro | đoạn văn chính             |
| `body`       | 15 / 24                          | 400    | Be Vietnam Pro | mặc định                   |
| `label`      | 14 / 20                          | 500    | Be Vietnam Pro | nhãn, nút                  |
| `caption`    | 12,5 / 18                        | 500    | Be Vietnam Pro | phụ chú                    |
| `micro`      | 11 / 15, tracking 0,06em, IN HOA | 600    | Be Vietnam Pro | nhãn phân vùng             |

**Cỡ nội dung mặc định là 15 px, không phải 14 px.** Chữ Việt có dấu cần thêm chiều cao
để không bị chạm dòng; 14 px làm dấu bị chật trên màn 390 px.

---

## 5. Khoảng cách, bo góc, đổ bóng

### 5.1 Khoảng cách — gốc 4 px

`1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=20 · `6`=24 · `8`=32 · `10`=40 · `12`=48 · `16`=64 · `20`=80

- Lề ngang màn hình: **16 px** (20 px từ 430 px trở lên)
- Khe giữa các thẻ: **12 px**
- Đệm trong thẻ: **16 px**
- Vùng chạm tối thiểu: **44 × 44 px**

### 5.2 Bo góc — bo rộng là đặc trưng thương hiệu

| Token           | Giá trị | Dùng cho              |
| --------------- | ------- | --------------------- |
| `--radius-xs`   | 6 px    | nhãn nhỏ              |
| `--radius-sm`   | 10 px   | ô nhập, chip          |
| `--radius-md`   | 14 px   | nút                   |
| `--radius-lg`   | 20 px   | thẻ                   |
| `--radius-xl`   | 28 px   | tấm trượt, thẻ lớn    |
| `--radius-2xl`  | 36 px   | mép trên bottom sheet |
| `--radius-full` | 9999 px | avatar, vòng tiến độ  |

### 5.3 Đổ bóng — nhuộm xanh rừng

Logo dùng bóng mềm ngả xanh. Bóng trong ứng dụng lấy đúng màu đó thay vì đen:

```
--shadow-sm: 0 1px 2px rgb(50 75 46 / .06), 0 1px 3px rgb(50 75 46 / .04);
--shadow-md: 0 4px 12px rgb(50 75 46 / .08);
--shadow-lg: 0 12px 32px rgb(50 75 46 / .10);
--shadow-xl: 0 24px 64px rgb(50 75 46 / .14);
```

### 5.4 Viền

```
--border-subtle: rgb(50 75 46 / .08);
--border:        rgb(50 75 46 / .14);
--border-strong: rgb(50 75 46 / .24);
```

---

## 6. Chuyển động

| Token             | Thời lượng | Dùng cho                                             |
| ----------------- | ---------- | ---------------------------------------------------- |
| `--duration-fast` | 150 ms     | đổi màu, hover, nhấn                                 |
| `--duration-base` | 220 ms     | thẻ xuất hiện, fade                                  |
| `--duration-slow` | **320 ms** | **trượt panel trợ lý** (khớp `docs/ASSISTANT-UX.md`) |

| Token               | Đường cong                     | Dùng cho              |
| ------------------- | ------------------------------ | --------------------- |
| `--ease-standard`   | `cubic-bezier(.32, .72, 0, 1)` | panel trượt, mặc định |
| `--ease-emphasized` | `cubic-bezier(.2, 0, 0, 1)`    | bottom sheet          |
| `--ease-exit`       | `cubic-bezier(.4, 0, 1, 1)`    | đóng, thu gọn         |

`@media (prefers-reduced-motion: reduce)` đặt mọi thời lượng về `0ms`.

---

## 7. Bố cục

| Hằng số               | Giá trị                         | Nguồn                       |
| --------------------- | ------------------------------- | --------------------------- |
| Bề rộng cột nội dung  | `min(100%, 680px)`              | khớp `max-width` của AskBar |
| Panel trợ lý          | **400 px**                      | `docs/ASSISTANT-UX.md`      |
| Cột toàn màn hình     | **768 px**                      | `docs/ASSISTANT-UX.md`      |
| Điểm ngắt             | 768 px, 1024 px                 |                             |
| Thanh điều hướng dưới | 5 tab, cao 56 px + vùng an toàn |                             |

Vùng an toàn: luôn dùng `env(safe-area-inset-*)`; thanh dưới cộng thêm `safe-area-inset-bottom`.

---

## 8. Thành phần

| Thành phần     | Trạng thái bắt buộc              | Ghi chú                                               |
| -------------- | -------------------------------- | ----------------------------------------------------- |
| `Button`       | mặc định · nhấn · tải · tắt · mờ | 4 biến thể theo §3.2; cao 48 px                       |
| `Card`         | thường · nhấn được · đang tải    | `radius-lg`, `shadow-sm`, `border-subtle`             |
| `Chip`         | chọn · không chọn                | nền `olive-100`, viền `olive-200`                     |
| `TextField`    | trống · có chữ · lỗi · tắt       | `radius-sm`, cao 48 px                                |
| `Sheet`        | mở · đang kéo · đóng             | `radius-2xl` mép trên, có tay nắm                     |
| `ProgressRing` | 0 % · một phần · đủ · vượt       | cung `olive-500`, nền `neutral-200`                   |
| `MacroBar`     | đạm · tinh bột · béo             | ba sắc `olive-500` / `olive-600` / `olive-700`        |
| `Sparkline`    | có dữ liệu · **rỗng**            | trạng thái rỗng là bắt buộc, không được để trắng trơn |
| `EmptyState`   | —                                | dùng mascot + một hành động duy nhất                  |
| `Toast`        | thành công · lỗi · thông tin     |                                                       |
| `Skeleton`     | —                                | nền `neutral-100`, không dùng hiệu ứng nhấp nháy mạnh |

Mọi thành phần đều phải có **trạng thái rỗng và trạng thái lỗi** — đây là mục 7 của
`docs/REVIEW-MVP.md`, được kiểm bằng test E2E.

---

## 9. Biểu tượng — tự vẽ, không thư viện

- Khung 24 × 24, `stroke-width: 1.5`, `stroke-linecap: round`, `stroke-linejoin: round`,
  `fill: none`, `stroke: currentColor`.
- Đặt trong `apps/web/src/components/icons/`, mỗi icon một file, export một component.
- `aria-hidden="true"` khi đứng cạnh nhãn chữ; có `aria-label` khi đứng một mình.
- ESLint `no-restricted-imports` và job `no-icon-libraries` trong CI chặn thư viện icon.

### 9.1 Icon ứng dụng (PWA)

Icon cài lên màn hình chính cũng là hình tự vẽ, không phải tệp thiết kế xuất ra:

- Nền bo góc `forest-600` (`#324b2e`), chiếc lá `olive-100`, sống lá `olive-500`.
- **Bốn cỡ**, sinh bằng `npm run icons:generate` (`scripts/generate-icons.mjs`):
  `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- Bản `maskable` có nền tràn viền và hình nằm trong vùng an toàn 80% ở giữa — Android cắt
  tròn thì không mất hình.
- `apple-touch-icon` phải là PNG: **iOS bỏ qua SVG**. Đây là lý do không thể chỉ có `icon.svg`.
- `icon.svg` ở `public/` là bản vector cùng hình, dùng cho tab trình duyệt.

Đổi hình thì sửa `sample()` trong script rồi chạy lại. **Đừng sửa tay tệp PNG** — lần sinh
sau sẽ ghi đè.

---

## 9b. Biểu đồ

Biểu đồ cũng tự vẽ, không dùng thư viện (dù `recharts` có trong `package.json`):

| Thành phần  | Dùng cho     | Vì sao dạng đó                                                                    |
| ----------- | ------------ | --------------------------------------------------------------------------------- |
| `LineChart` | Cân nặng     | Cột luôn bắt đầu từ 0, nên 3 kg trên nền 70 kg là chênh lệch 4% mà mắt không thấy |
| `BarChart`  | Kcal nạp vào | Gốc 0 có nghĩa; kèm đường mục tiêu nét đứt để biết "nhiều hay ít"                 |

- SVG dùng `preserveAspectRatio="none"` và `viewBox` 320 × 96, nên tự khớp mọi bề rộng.
- **Không dùng `rx`** trên cột: kéo giãn phi đều biến bo góc tròn thành ellipse méo.
- Nét phải có `vectorEffect="non-scaling-stroke"`, nếu không sẽ dày mỏng theo bề rộng màn hình.
- Mọi biểu đồ kèm một **bảng dữ liệu ẩn** (`sr-only`). SVG là hình ảnh trần với trình đọc màn
  hình; thiếu bảng thì người dùng screen reader không nhận được gì.
- `describeSeries()` tạo câu tóm tắt bằng chữ, dùng cho `aria-label` và hiện dưới biểu đồ.

---

## 10. Linh vật và `BoIcon`

Logo là **robot có mầm lá trên đầu và mặt đồng hồ ở thân** — đầu có mặt kính xanh đậm,
hai mắt cong hình chữ U ngược, hai "tai" bo tròn, mầm hai lá mọc trên đỉnh.

**Quyết định:** linh vật trong logo **chính là** trợ lý Bơ. Không tạo nhân vật thứ hai.
Điều này khiến thương hiệu và trợ lý là một, giảm tải nhận diện và làm trợ lý có "mặt".

### 10.1 `BoIcon` — ba trạng thái

| Trạng thái | Mắt                              | Mầm lá         | Dùng khi       |
| ---------- | -------------------------------- | -------------- | -------------- |
| `idle`     | cong `^^` như logo, nhịp thở 4 s | đứng yên       | mặc định       |
| `thinking` | một mắt biến thành đồng hồ quay  | đung đưa 1,2 s | đang chờ model |
| `speaking` | mở tròn, chớp nhẹ                | vươn lên 0,8 s | đang phát chữ  |

- Một `<path>` cho đầu, hai `<path>` cho lá, hai `<path>` cho mắt — không dùng ảnh raster.
- `fill="currentColor"` để ăn theo màu chữ; mặc định `forest-600`.
- `prefers-reduced-motion: reduce` → tắt keyframe, giữ hình tĩnh.

### 10.2 Linh vật đầy đủ

`<BoMascot size="lg" />` = đầu + thân + mặt đồng hồ, dùng ở:
màn chào mừng, trạng thái rỗng, màn hoàn tất onboarding.
Mặt đồng hồ hiển thị đúng tỉ lệ kcal đã nạp trong ngày — cùng một hình, hai chức năng.

---

## 11. Dark mode

Bật bằng `prefers-color-scheme: dark`. Không có công tắc thủ công ở Release 1.

| Token        | Sáng                    | Tối                     |
| ------------ | ----------------------- | ----------------------- |
| Nền ứng dụng | `neutral-50` `#FAFAF7`  | `forest-900` `#151F13`  |
| Nền thẻ      | `neutral-0` `#FFFFFF`   | `forest-800` `#1E2D1C`  |
| Nền chìm     | `neutral-100` `#F5F5F0` | `forest-700` `#283C25`  |
| Mực chính    | `forest-600` `#324B2E`  | `neutral-100` `#F5F5F0` |
| Mực phụ      | `neutral-600` `#57574E` | `neutral-300` `#D6D6CC` |
| Nhấn         | `olive-500` `#839B4A`   | `olive-400` `#A1B079`   |

Tương phản ở dark mode đều vượt 5,4:1 (đã đo) — không có cặp nào cần lưu ý.

---

## 12. Ánh xạ sang Tailwind 4

Tailwind 4 cấu hình bằng CSS, không bằng `tailwind.config.js`:

```css
@import 'tailwindcss';

@theme {
  --color-forest-600: #324b2e;
  --color-olive-500: #839b4a;
  --radius-lg: 20px;
  --shadow-md: 0 4px 12px rgb(50 75 46 / 0.08);
  --ease-standard: cubic-bezier(0.32, 0.72, 0, 1);
  /* … */
}
```

Nhờ vậy các tiện ích như `bg-forest-600`, `text-olive-700`, `rounded-lg`, `shadow-md`
sinh ra trực tiếp từ token, và **không có giá trị màu nào viết thẳng trong JSX**.

Quy tắc này được kiểm bằng lint: cấm `className` chứa mã màu hex.
