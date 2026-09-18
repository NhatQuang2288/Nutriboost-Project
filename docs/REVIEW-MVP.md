# Rà soát User Story Mapping — NutriBoost MVP

> Tài liệu này là kết quả rà soát bản _User Story Mapping – NutriBoost MVP Roadmap_ và bản phân công 5 người.
> Mọi điều chỉnh ở đây đã được phản ánh vào `docs/roles.md` và lộ trình Release 1.

---

## 0. Đảo ngược phạm vi: console PT thuộc Release 1

Mục §1.2 của tài liệu này từng đề xuất **lùi console PT sang Release 2**, với lập luận
"Release 1 chưa có PT nào". Sau khi có bảng giá ba gói Plus/Premium/Diamond, lập luận đó
không còn đúng: **PT/Coach là người trả tiền**, cả ba gói đều lấy _số khách hàng_ làm đơn vị
đo, và hai tính năng khác biệt duy nhất giữa các gói (thêm khách, duyệt thực đơn) chỉ tồn
tại trong console PT.

Hệ quả:

| Hạng mục                                                     | Trước                        | Nay                                                                     |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| Console PT (quản lý khách, duyệt thực đơn, theo dõi tiến độ) | Release 2                    | **Release 1**                                                           |
| Ứng dụng cho khách hàng cuối                                 | Sản phẩm                     | **Kênh phân phối**                                                      |
| Hạn mức khách hàng và hạn mức lượt AI                        | Chưa có                      | **Cưỡng chế ở CSDL** — `supabase/migrations/20260918090300_billing.sql` |
| TV4                                                          | Chỉ màn hình người dùng cuối | Thêm console PT                                                         |

Phân tích định lượng nằm ở `docs/PRICING.md`, gồm cả kết luận rằng **trần lượt AI là ràng buộc
quyết định biên lợi nhuận**: không có trần, gói Diamond mất tới 59 % doanh thu cho chi phí AI.

---

## 1. Bảy lỗi của User Story Mapping

| #   | Vấn đề                                                                                                                                                                                                                                              | Hệ quả thực tế                                                         | Điều chỉnh                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **AI nằm ở cột 7–8 và "Chat với AI" bị đẩy xuống Release 3**, trong khi mục tiêu là "lấy AI làm trung tâm"                                                                                                                                          | AI trở thành tính năng phụ, kiến trúc phải vá lại sau                  | Biến AI thành **lớp xuyên suốt**, không phải một cột. Chat vào thẳng Release 1                                                                                                |
| 2   | **Backbone 8 cột** cho đội 5 người; cột 6 (Monitor progress) và 8 (Reminders) là _hệ quả_ chứ không phải hoạt động lõi                                                                                                                              | Dàn trải, ai cũng làm nửa vời                                          | Rút còn **5 cột**: Onboarding → Mục tiêu & Kế hoạch → Ghi nhận → AI Coach → Tiến độ                                                                                           |
| 3   | **Không có cột nào mô tả "AI hiểu dữ liệu người dùng"** — bước biến câu nói thành món trong DB                                                                                                                                                      | Đây là rủi ro kỹ thuật lớn nhất của sản phẩm, đang **không ai sở hữu** | Thêm hạng mục _Food understanding pipeline_, giao TV3                                                                                                                         |
| 4   | **Release 1 chỉ "ghi" mà không "phản hồi"** (log meals, tính BMI, xem summary)                                                                                                                                                                      | Người dùng không thấy giá trị trong 7 ngày đầu → retention D1 ≈ 0      | Thêm **1 insight AI + 1 hành động nhỏ mỗi ngày** vào R1                                                                                                                       |
| 5   | **Trùng lặp R2 ↔ R3**: "Personalized meal recommendations" (R2) vs "Adaptive meal…suggestions" (R3); "AI nutrition assistant" (R1·cột 7) vs "Chat with AI assistant" (R3·cột 5); "Notifications" (R2) vs "Reminders & notifications" là Key Feature | Không ai biết khi nào một hạng mục là "xong"                           | Chốt ranh giới: **R1 = AI đề xuất theo hồ sơ tĩnh**; **R2 = AI điều chỉnh theo dữ liệu thực tế + PT duyệt + thông báo**; **R3 = coaching dài hạn + ảnh/giọng nói + wearable** |
| 6   | **Thiếu toàn bộ hạng mục phi chức năng**: quyền riêng tư dữ liệu sức khoẻ, disclaimer y khoa, offline/PWA, analytics, accessibility, trần chi phí AI                                                                                                | Rủi ro pháp lý và chi phí không kiểm soát                              | Bổ sung dòng **"Đo lường & An toàn"** xuyên suốt mọi release                                                                                                                  |
| 7   | **Không thiết kế trạng thái rỗng/lỗi**: AI không khớp được món, ngày chưa ghi gì, AI chết thì sao?                                                                                                                                                  | App sập trải nghiệm đúng ở lúc dễ xảy ra nhất                          | Mỗi màn bắt buộc có 3 trạng thái: rỗng · lỗi · AI tin cậy thấp                                                                                                                |

### 1.1 Ba rủi ro chưa được đưa vào bất kỳ dòng nào của bản đồ

1. **Quyền riêng tư dữ liệu sức khoẻ.** Free tier của Gemini API có điều khoản _dùng nội dung để cải thiện sản phẩm của Google_.
   → Dev/test dùng free tier; **production bắt buộc dùng paid tier**; có màn hình xin đồng ý (`consents`) trước lần gọi AI đầu tiên.
2. **Rủi ro pháp lý "tư vấn y khoa".** App dinh dưỡng rất dễ bị hiểu là khám/chữa bệnh.
   → Không chẩn đoán, không kê đơn, không dùng từ "chữa bệnh"; disclaimer ở onboarding + mọi output AI + màn `/toi`; có guardrail chuyển hướng chuyên gia.
   → Đối chiếu **Nghị định 15/2018/NĐ-CP** (an toàn thực phẩm) và **Nghị định 13/2023/NĐ-CP** (bảo vệ dữ liệu cá nhân) trước khi phát hành thật.
3. **Chi phí AI không có trần.** Chat là khoản đắt nhất và tăng theo số lượt, không theo số người dùng.
   → Model routing + context caching + hạn mức cứng/ngày/người + bảng `ai_calls` để nhìn chi phí theo thời gian thực.

### 1.2 Bản đồ MVP điều chỉnh

|                | **Cột 1** Onboarding & Hồ sơ                                                                                       | **Cột 2** Mục tiêu & Kế hoạch             | **Cột 3** Ghi nhận                       | **Cột 4** AI Coach                               | **Cột 5** Tiến độ            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ---------------------------------------- | ------------------------------------------------ | ---------------------------- |
| **R1 (MVP)**   | 5 câu hỏi, không form dài; tính BMR/TDEE ngay                                                                      | AI sinh kế hoạch 7 ngày; 1 tap duyệt      | Gõ 1 câu → AI khớp món; ≤ 2 tap          | Insight 1 câu/ngày + 1 hành động; chat streaming | Vòng calo, biểu đồ 7/30 ngày |
| **R2**         | Sửa hồ sơ bằng chat                                                                                                | AI điều chỉnh theo dữ liệu thực; PT duyệt | Ảnh bữa ăn, giọng nói, template "hay ăn" | Nhắc nhở thông minh, streak                      | Báo cáo tuần, PT dashboard   |
| **R3**         | Nhập từ wearable                                                                                                   | Coaching dài hạn, theo chu kỳ             | Tự động nhận diện                        | Coach đa lượt có trí nhớ dài hạn                 | Dự đoán xu hướng             |
| **Xuyên suốt** | Đo lường · Đồng ý & riêng tư · Disclaimer y khoa · Guardrail AI · Trần chi phí · RLS · PWA/offline · Accessibility |                                           |                                          |                                                  |                              |

---

## 2. Sáu vấn đề của bản phân công 5 người

| #   | Vấn đề                                                                                                                  | Điều chỉnh                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **TV1 là nút cổ chai**: khung dự án + schema DB + CLAUDE.md + _review & merge TẤT CẢ PR_                                | TV1 sở hữu **hợp đồng** (schema, types, CI, ADR, PR template) chứ không phải mọi PR. Dùng `CODEOWNERS`: TV1 bắt buộc duyệt `packages/db`, `packages/ai`, `supabase/migrations`; file khác cần **1 reviewer chéo** bất kỳ |
| 2   | **"300 món Việt" giao cho TV2 (Auth & Dữ liệu nền)** — đây là công việc nội dung dinh dưỡng, cần đối chiếu nguồn y khoa | **Tính đúng** chuyển sang TV3. TV2 chỉ làm **công cụ import + ràng buộc DB + kiểm tra kiểu**. TV5 bỏ hẳn phần "seed data"                                                                                                |
| 3   | **"300 món" mơ hồ** — nếu là 300 công thức nấu ăn thì không ước tính được calo                                          | Định nghĩa lại: **~120 nguyên liệu thô** (số liệu/100g) + **~180 món phổ biến** biểu diễn bằng thành phần × gram; mỗi món có `serving_name` + `serving_grams`                                                            |
| 4   | **TV4 làm PT dashboard + màn duyệt thực đơn AI trong khi R1 chưa có PT nào**                                            | R1: TV4 chuyển sang 3 màn người dùng cuối quan trọng nhất (**Ghi nhận**, **Hôm nay**, **Kế hoạch**). PT dashboard lùi sang R2                                                                                            |
| 5   | **TV4 và TV5 bị TV2 chặn** (chưa có auth/schema thì không code được)                                                    | **Tuần 0 bắt buộc**: TV1 chốt schema + types + zod schema; TV5 tạo **mock fixtures**; TV4/TV5 code song song trên mock, nối API ở Tuần 2                                                                                 |
| 6   | **Thiếu người sở hữu**: QA/CI, eval chất lượng AI, analytics/funnel, trần chi phí AI                                    | Gán kiêm nhiệm rõ: **TV1** = CI + QA owner; **TV3** = eval owner; **TV5** = analytics + accessibility owner; **trần chi phí AI** = TV3 + TV1 cùng chốt                                                                   |

---

## 3. Nguyên tắc sản phẩm rút ra từ rà soát

1. **Một màn = một hành động chính.** Không màn nào có 2 CTA ngang hàng.
2. **Không form nhiều bước.** Onboarding 5 câu, mỗi câu một màn, chỉ 2 câu cần gõ số.
3. **AI điền trước, người dùng xác nhận.** Mọi thứ suy ra được từ hồ sơ/lịch sử thì tự điền.
4. **Ghi một bữa ăn ≤ 2 tap**, mục tiêu ≤ 10 giây.
5. **Toán dinh dưỡng không bao giờ giao cho LLM.** BMR/TDEE/macro/kcal đốt là hàm thuần có test. LLM chỉ làm: hiểu ngôn ngữ, chọn món, diễn giải.
6. **AI luôn có "vì sao" và nút sửa.** Không output AI nào không sửa được trong ≤ 1 tap.

### 3.1 Chỉ số phải đo được

| Chỉ số                                 | Ngưỡng        |
| -------------------------------------- | ------------- |
| Thời gian onboarding                   | < 60 giây     |
| Số tap để ghi 1 bữa ăn                 | ≤ 2           |
| Độ chính xác khớp món (top-1 / top-3)  | ≥ 85% / ≥ 95% |
| p95 độ trễ `parse-meal`                | < 6 giây      |
| First token của chat                   | < 2 giây      |
| Chi phí AI / người / ngày              | < $0.02       |
| Lighthouse mobile (performance + a11y) | ≥ 90          |
