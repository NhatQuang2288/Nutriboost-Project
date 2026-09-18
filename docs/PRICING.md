# Rà soát mô hình giá — gói PT/Coach

> Nguồn: trang giá 3 gói Plus / Premium / Diamond cho PT/Coach, Nutrition Expert.
> Mọi con số chi phí AI dưới đây tính từ bảng giá Gemini đã đối chiếu trong
> `packages/ai/src/prices.ts`, không phải ước lượng cảm tính.

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

### 2.1 Chi phí một khách hàng mỗi tháng theo ba kịch bản

Giả định: 1 USD ≈ 26.000đ. Model định tuyến như thiết kế (chat mặc định dùng
`gemini-3.5-flash-lite`, sinh kế hoạch tuần dùng `gemini-3.8-flash`).

| Kịch bản                                                   | Lượt AI / khách / tháng | Chi phí AI | Quy ra VND    |
| ---------------------------------------------------------- | ----------------------- | ---------- | ------------- |
| **A. Dùng ở mức thiết kế** (5 bữa/ngày, 20 lượt chat/ngày) | ~780                    | ≈ $0,85    | **≈ 22.000đ** |
| **B. Chạm trần hạn mức hệ thống** (40 bữa + 40 chat/ngày)  | ~2.430                  | ≈ $2,03    | **≈ 53.000đ** |
| **C. Chạm trần và chat nâng lên model chất lượng**         | ~2.430                  | ≈ $3,49    | **≈ 91.000đ** |

### 2.2 Chi phí AI chiếm bao nhiêu doanh thu

| Gói                            | 5 khách             | 10 khách            | 20 khách               |
| ------------------------------ | ------------------- | ------------------- | ---------------------- |
| **Kịch bản A** (22.000đ/khách) | 110.000đ · **15 %** | 220.000đ · **20 %** | 440.000đ · **24 %**    |
| **Kịch bản B** (53.000đ/khách) | 265.000đ · **35 %** | 530.000đ · **47 %** | 1.060.000đ · **59 %**  |
| **Kịch bản C** (91.000đ/khách) | 455.000đ · **61 %** | 910.000đ · **81 %** | 1.820.000đ · **101 %** |

**Kết luận:** nếu để người dùng chạm trần ở mọi lượt, gói Diamond mất **59 %** doanh thu
cho AI; và chỉ cần chat bị nâng lên model chất lượng là **lỗ**. Với gói Plus, kịch bản B
đã ăn 35 % doanh thu — mức không thể duy trì khi còn server, hỗ trợ và marketing.

### 2.3 Trần lượt AI theo hợp đồng làm mô hình hoạt động được

Đặt hạn mức **600 lượt AI mỗi khách mỗi tháng** (khoảng 20 lượt/ngày):

- Chi phí: ≈ **$0,59/khách/tháng** ≈ 15.400đ
- Plus: 77.000đ → **10 % doanh thu**
- Premium: 154.000đ → **14 % doanh thu**
- Diamond: 309.000đ → **17 % doanh thu**

Đây là mức bền vững. Đáng chú ý: con số này khớp gần đúng với trần ngân sách
**$0,02/người/ngày** đã cài trong AI Gateway (`AI_DAILY_BUDGET_USD`) — 600 lượt/tháng
tương đương $0,60/tháng, tức $0,02/ngày. **Hai con số ở hai tầng khác nhau đã hội tụ
về cùng một điểm, đó là dấu hiệu thiết kế đúng.**

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
