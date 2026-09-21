# Rà soát mô hình giá — gói PT/Coach

> Nguồn: trang giá 3 gói Plus / Premium / Diamond cho PT/Coach, Nutrition Expert.
> Mọi con số chi phí AI dưới đây tính từ bảng giá **DeepSeek** đã đối chiếu trong
> `packages/ai/src/prices.ts` và từ trang giá chính thức
> (https://api-docs.deepseek.com/quick_start/pricing/, đối chiếu 21/09/2026) — không phải
> ước lượng cảm tính.

---

## 1. Tóm tắt gói đang bán

|                    | **Plus**     | **Premium**  | **Diamond** |
| ------------------ | ------------ | ------------ | ----------- |
| Giá / tháng        | 750.000đ     | 1.125.000đ   | 1.800.000đ  |
| Khách hàng tối đa  | 5            | 10           | 20          |
| **Giá mỗi khách**  | **150.000đ** | **112.500đ** | **90.000đ** |
| Bước nhảy giá      | —            | +50 %        | +60 %       |
| Bước nhảy số khách | —            | ×2           | ×2          |

Giá mỗi khách **giảm dần** theo gói (150k → 113k → 90k). Đây là cách đóng gói hợp lý:
khuyến khích PT mua gói lớn khi đã có đủ khách, và tránh việc PT mua nhiều gói nhỏ.

---

## 2. Phát hiện quan trọng nhất: chi phí AI quyết định biên lợi nhuận

Trang giá ghi "Hỗ trợ AI" và "Tiết kiệm chi phí dùng AI" ở **cả ba gói** — nghĩa là
AI là quyền lợi mặc định, không phải yếu tố phân hạng. Vì vậy **trần lượt AI chính là
ràng buộc kinh tế của toàn bộ mô hình**, chứ không phải chi tiết kỹ thuật.

### 2.1 Giả định dùng để tính

Mọi con số dưới đây suy ra từ ba giả định, ghi rõ để ai đọc cũng kiểm lại được:

| Giả định                  | Giá trị              | Cơ sở                                                              |
| ------------------------- | -------------------- | ------------------------------------------------------------------ |
| Token mỗi lượt chat       | 1.500 vào · 250 ra   | Prompt hệ thống + dữ kiện trong ngày; trả lời của Bơ ngắn, 1–3 câu |
| Token mỗi kế hoạch tuần   | 3.000 vào · 1.500 ra | Sinh 7 ngày × 4 bữa, model chất lượng                              |
| Tỉ lệ thời gian thấp điểm | **79 %**             | Cao điểm là 7 giờ × 5 ngày = 35 giờ mỗi 168 giờ tuần               |
| Tỉ giá                    | 1 USD ≈ 26.000đ      | Giả định của dự án                                                 |

### 2.2 Vì sao phải tính theo GIỜ, không phải một con số

DeepSeek tính **một nửa giá** ngoài giờ cao điểm. Giờ cao điểm là 01:00–04:00 và
06:00–10:00 UTC, thứ Hai tới thứ Sáu; mọi giờ khác — kể cả trọn ngày cuối tuần — là thấp
điểm. Cộng lại, **79 % thời gian trong tuần là thấp điểm**.

Nên giá phải tính theo tỉ lệ thời gian, không lấy mức cao điểm cho mọi lượt:

| Đơn vị                            | Cao điểm | Thấp điểm | **Trộn theo 79 %**  |
| --------------------------------- | -------- | --------- | ------------------- |
| Một lượt chat (`deepseek-flash`)  | $0,00075 | $0,000375 | **$0,00045** ≈ 12đ  |
| Một lượt chat (`deepseek-v4-pro`) | $0,00297 | $0,00149  | **$0,00179** ≈ 47đ  |
| Một kế hoạch tuần (`v4-pro`)      | $0,0099  | $0,00495  | **$0,00598** ≈ 156đ |

`computeCostUsd` trong `packages/ai/src/cost.ts` nhận tham số thời điểm và chọn đúng mức giá,
nên `ai_calls.cost_usd` phản ánh đúng số này. Bỏ qua chuyện giờ giấc sẽ làm chi phí bị thổi
lên gần gấp đôi và toàn bộ mục này mất giá trị.

### 2.3 Chi phí một khách hàng mỗi tháng theo ba kịch bản

| Kịch bản                                                    | Lượt AI / khách / tháng | Chi phí AI | Quy ra VND     |
| ----------------------------------------------------------- | ----------------------- | ---------- | -------------- |
| **A. Dùng ở mức thiết kế** (5 lượt ghi + 20 lượt chat/ngày) | 750 lượt + 4 kế hoạch   | ≈ $0,36    | **≈ 9.500đ**   |
| **B. Chạm trần hạn mức** (40 lượt ghi + 40 lượt chat/ngày)  | 2.400 lượt + 4 kế hoạch | ≈ $1,11    | **≈ 29.000đ**  |
| **C. Chạm trần và chat nâng lên model chất lượng**          | 2.400 lượt + 4 kế hoạch | ≈ $4,33    | **≈ 113.000đ** |

Hai điểm đáng chú ý so với bảng giá cũ (tính theo Gemini):

- **Rẻ hơn khoảng 2,4 lần ở kịch bản A và 1,8 lần ở kịch bản B.** Đó là toàn bộ phần chênh
  lợi nhuận, và nó đến từ việc chọn nhà cung cấp chứ không từ việc cắt tính năng.
- **Kịch bản C vẫn là kịch bản duy nhất nguy hiểm** — gấp gần 4 lần kịch bản B. Lý do không
  đổi: model chất lượng đắt hơn 4,4 lần ở đầu vào. Đây là lý do `MODEL_ROUTES` để `chat` mặc
  định ở model nhanh và chỉ nâng cấp khi người dùng chủ động yêu cầu.

### 2.4 Chi phí AI chiếm bao nhiêu doanh thu

| Gói                             | 5 khách             | 10 khách               | 20 khách               |
| ------------------------------- | ------------------- | ---------------------- | ---------------------- |
| **Kịch bản A** (9.500đ/khách)   | 47.500đ · **6 %**   | 95.000đ · **8 %**      | 190.000đ · **11 %**    |
| **Kịch bản B** (29.000đ/khách)  | 145.000đ · **19 %** | 290.000đ · **26 %**    | 580.000đ · **32 %**    |
| **Kịch bản C** (113.000đ/khách) | 565.000đ · **75 %** | 1.130.000đ · **100 %** | 2.260.000đ · **126 %** |

**Kết luận:** ở mức dùng thiết kế, AI chỉ chiếm 6–11 % doanh thu — mức bền vững. Nhưng nếu để
người dùng chạm trần ở mọi lượt thì gói Diamond mất **32 %**, và **chỉ cần chat bị nâng lên
model chất lượng là lỗ ở cả ba gói**. Trần lượt AI vì thế vẫn là ràng buộc trung tâm của mô
hình, không phải chi tiết kỹ thuật — chỉ là nó có nhiều khoảng thở hơn so với phương án Gemini.

### 2.5 Trần lượt AI theo hợp đồng làm mô hình hoạt động được

Đặt hạn mức **600 lượt AI mỗi khách mỗi tháng** (khoảng 20 lượt/ngày):

- Chi phí: ≈ **$0,28/khách/tháng** ≈ 7.200đ
- Plus: 36.000đ → **5 % doanh thu**
- Premium: 72.000đ → **6 % doanh thu**
- Diamond: 144.000đ → **8 % doanh thu**

Đây là mức bền vững. Đáng chú ý: con số này khớp gần đúng với trần ngân sách
**$0,02/người/ngày** đã cài trong AI Gateway (`AI_DAILY_BUDGET_USD`) — 600 lượt/tháng
tương đương $0,28/tháng ở mức trộn, tức khoảng $0,01/ngày. Trần ngân sách vì thế còn **rộng
gấp đôi** so với mức dùng theo hợp đồng, nghĩa là nó chỉ chặn được trường hợp bất thường chứ
không chặn nhầm người dùng bình thường. Đó là tỉ lệ đúng cho một hàng rào an toàn.

⇒ **Việc bắt buộc phải làm:** ghi rõ hạn mức lượt AI vào bảng giá, và cưỡng chế nó
ở tầng CSDL (`packages/db`, migration `20260918090300_billing.sql`), không chỉ ở giao diện.

---

## 3. Bảy vấn đề của bảng giá hiện tại

| #   | Vấn đề                                                            | Hệ quả                                                                                                                                 | Đề xuất                                                                                                                                                              |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Yếu tố phân hạng duy nhất là số khách hàng**                    | Dễ bị so giá thuần tuý; đối thủ giảm giá là mất khách                                                                                  | Thêm khác biệt phi số lượng: thương hiệu riêng trên app khách hàng (Premium), nhiều PT trong một tài khoản (Diamond), xuất báo cáo PDF, thư viện thực đơn dùng chung |
| 2   | **Không nêu hạn mức lượt AI**                                     | PT hiểu là "dùng bao nhiêu cũng được" → tranh chấp khi bị chặn, hoặc lỗ nếu không chặn                                                 | Ghi thẳng "600 lượt AI/khách/tháng" vào cả ba gói; nêu rõ phần vượt                                                                                                  |
| 3   | **Không có gói dùng thử**                                         | 750.000đ là rào cản đầu tiên với một PT chưa biết sản phẩm                                                                             | Thêm 14 ngày dùng thử, tối đa 2 khách (đã có sẵn mức `trial` trong schema)                                                                                           |
| 4   | **Không có gói trả theo năm**                                     | LTV thấp, churn cao, dòng tiền không đều                                                                                               | Trả trước 12 tháng tặng 2 tháng (tương đương giảm ~17 %)                                                                                                             |
| 5   | **Không có add-on khách vượt hạn mức**                            | PT có 21 khách buộc phải mua thêm gói Diamond (1.800.000đ cho 20 khách nữa) hoặc từ chối khách                                         | Add-on 90.000đ/khách/tháng, mua lẻ từng khách                                                                                                                        |
| 6   | **Bảng "Giá trị mang lại" cộng hai loại khác bản chất**           | 1.920.000đ tiết kiệm chi phí + 3.200.000đ doanh thu tăng thêm = 5.120.000đ. Cộng gộp dễ bị chất vấn và làm giảm độ tin cậy của cả bảng | Tách hai cột: "Tiết kiệm mỗi tháng" và "Doanh thu tăng thêm mỗi tháng"                                                                                               |
| 7   | **Khoản "+3.200.000đ doanh thu tăng thêm" không kiểm chứng được** | Đây là con số lớn nhất trong bảng và cũng là con số duy nhất không có cơ sở. Nếu không đạt, PT mất niềm tin vào toàn bộ trang giá      | Thay bằng cam kết đo được: "giảm 40 % thời gian tạo thực đơn" — đo được ngay trong ứng dụng và đưa vào báo cáo tháng                                                 |

### 3.1 Hai điểm còn thiếu ở tầng vận hành

- **Chính sách huỷ và hoàn tiền.** Bán B2B mà không nêu thì mỗi lần huỷ là một cuộc đàm phán.
  Đề xuất: huỷ bất kỳ lúc nào, dùng hết kỳ đã trả, không hoàn tiền — ghi rõ trên trang giá.
- **Hoá đơn và thuế.** Khách là PT cá nhân và hộ kinh doanh tại Việt Nam đều cần chứng từ.
  Cần chốt trước khi mở bán, không phải sau.

---

## 4. Bậc thang gói đề xuất

|                              | **Dùng thử** | **Plus**      | **Premium**   | **Diamond**   |
| ---------------------------- | ------------ | ------------- | ------------- | ------------- |
| Giá / tháng                  | 0đ (14 ngày) | 750.000đ      | 1.125.000đ    | 1.800.000đ    |
| Khách hàng                   | 2            | 5             | 10            | 20            |
| Lượt AI / khách / tháng      | 100          | 600           | 600           | 600           |
| Thương hiệu riêng            | —            | —             | ✓             | ✓             |
| Nhiều PT trong một tài khoản | —            | —             | —             | ✓             |
| Báo cáo tuần tự động         | —            | ✓             | ✓             | ✓             |
| Add-on khách vượt hạn mức    | —            | 90.000đ/khách | 90.000đ/khách | 90.000đ/khách |
| Trả theo năm                 | —            | tặng 2 tháng  | tặng 2 tháng  | tặng 2 tháng  |

---

## 5. Hệ quả cho lộ trình sản phẩm

Trang giá này **đảo ngược một quyết định trước đó**. Bản rà soát MVP
(`docs/REVIEW-MVP.md` §1.2) đã đề xuất lùi console PT sang Release 2, vì lập luận khi đó
là "Release 1 chưa có PT nào". Nhưng **PT chính là người trả tiền**, và ba gói dịch vụ
đều lấy số khách hàng làm đơn vị đo. Nghĩa là:

1. **Console PT phải vào Release 1**, không phải Release 2. Ứng dụng cho khách hàng
   là kênh phân phối; console PT là sản phẩm được bán.
2. **Hạn mức khách hàng và hạn mức AI phải cưỡng chế ở CSDL** — đã làm trong
   `supabase/migrations/20260918090300_billing.sql`, gồm cả trigger chặn thêm khách
   vượt gói và hàm `ai_turn_allowance` để cấp đúng số lượt đã mua.
3. **Phân công đổi theo**: TV4 nhận console PT (màn quản lý khách, duyệt thực đơn,
   theo dõi tiến độ), thay vì chỉ làm màn hình người dùng cuối.

Chi tiết điều chỉnh nằm ở `docs/roles.md` và mục mới trong `docs/REVIEW-MVP.md`.

---

## 5b. Lịch tập và nhắc nhở — hai tính năng đã có trong bảng giá trị

Bảng "Giá trị mang lại" của trang giá định giá hai hạng mục mà bản kế hoạch đầu tiên chưa
có: **quản lý lịch tập (600.000đ/tháng)** và **nhắc nhở tự động (220.000đ/tháng)**. Cả hai
đã được đưa vào Release 1.

### Vì sao hai tính năng này rẻ về mặt AI

| Hạng mục           | Tần suất    | Chi phí AI mỗi khách mỗi tháng                               |
| ------------------ | ----------- | ------------------------------------------------------------ |
| Dựng lịch tập tuần | 1 lần/tuần  | **$0** — dựng hoàn toàn tất định từ danh mục bài tập         |
| Viết lời nhắc      | ~4 tin/ngày | ≈ **$0,02** — mỗi tin ~300 token vào, 40 token ra ở model rẻ |

Cộng lại chưa tới **0,1 %** chi phí AI của một khách. Nghĩa là giá trị 820.000đ/tháng mà
trang giá quy cho hai hạng mục này gần như không kèm chi phí biến đổi — đây là phần đóng
góp biên tốt nhất trong cả bảng giá trị.

**Vì sao lịch tập để tất định:** kcal đốt của buổi tập phải cộng được vào ngân sách năng
lượng trong ngày. Nếu để model tự nghĩ ra bài tập thì không có cách nào biết nó đốt bao
nhiêu, và con số đó sẽ trôi khỏi mọi phép tính khác. MET là dữ liệu, kcal là công thức,
model chỉ chọn bài và diễn giải.

**Vì sao thời điểm nhắc là dữ liệu chứ không phải logic:** PT phải đổi được giờ nhắc của
từng khách mà không cần deploy. Luật nằm trong bảng `reminder_rules`; hàm
`decideReminder` chỉ trả lời "có gửi hay không, vì sao". Chống gửi trùng bằng một chỉ mục
duy nhất ở tầng CSDL, không dựa vào việc bộ lập lịch có nhớ hay không.

### Phân hạng đề xuất cho hai tính năng này

|                                            | Plus | Premium | Diamond |
| ------------------------------------------ | ---- | ------- | ------- |
| Lịch tập tất định                          | ✓    | ✓       | ✓       |
| Lịch tập do AI tinh chỉnh theo tiến độ     | —    | ✓       | ✓       |
| Nhắc nhở cơ bản (ghi bữa, cân nặng)        | ✓    | ✓       | ✓       |
| Nhắc nhở thông minh (đổi giờ theo hành vi) | —    | —       | ✓       |

Lý do tách: bản tất định gần như không tốn chi phí nên cho cả ba gói; phần AI tinh chỉnh
mới là thứ tốn token và tạo khác biệt — cũng là thứ hiện đang thiếu để phân hạng ngoài
yếu tố "số khách hàng" (vấn đề #1 ở mục 3).

### Cảnh báo về tần suất nhắc

Bộ luật mặc định giới hạn **tối đa 4 lần nhắc một ngày**. Con số này không phải để tiết
kiệm token mà để giữ chân: người dùng tắt thông báo sau vài ngày bị nhắc quá nhiều, và khi
đã tắt thì không nhắc được gì nữa. Hàm `maxRemindersPerDay` kiểm đúng ngày bận nhất của
tuần, không đếm tổng số luật — vì `weigh_in` chỉ chạy thứ Hai và `weekly_checkin` chỉ chạy
Chủ nhật nên chúng không bao giờ trùng ngày.

---

## 6. Ba việc cần chốt trước khi mở bán

1. **Tỉ giá** dùng trong mọi phép tính chi phí: tài liệu này giả định 1 USD ≈ 26.000đ.
   Cần xác nhận và ghi vào `docs/PRICING.md` để mọi phân tích sau dùng cùng một mốc.
2. **Hạn mức AI có bị tính là "cam kết hợp đồng" không.** Nếu có, nó phải xuất hiện
   trong điều khoản, trong ứng dụng, và trong thông báo khi gần chạm trần.
3. **Có bán cho PT nước ngoài không.** Nếu có, giá VND cố định sẽ bất lợi khi tỉ giá biến động.
