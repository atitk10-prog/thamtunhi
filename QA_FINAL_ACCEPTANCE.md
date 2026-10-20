# BÁO CÁO NGHIỆM THU CHẤT LƯỢNG TOÀN DIỆN (QA FINAL ACCEPTANCE)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)
**Ngày nghiệm thu:** 20/10/2026  
**Đơn vị nghiệm thu:** QA Automation & Security Verification Team  
**Môi trường kiểm thử:**
- Local E2E Host: `http://localhost:3005`
- Vercel Preview Deployment: `https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app`
- Cloud Firestore: `indigo-lotus-2nmq3` (`ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`)

---

## 1. MA TRẬN KẾT QUẢ KIỂM THỬ (TEST EXECUTION MATRIX)

| STT | Nhóm Kiểm Thử | Số Lượng Test | Kết Quả | Chi Tiết / Bằng Chứng |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Động Cơ Toán Học (Math Engine)** | 16 | **100% PASS** | Phép cộng, trừ, qua 10, cấu tạo số hàng chục/đơn vị, so sánh dấu, đếm lệch 1. |
| **02** | **Xác Thực Phiên & Token HMAC-SHA256** | 6 | **100% PASS** | Sinh token Học sinh, Giáo viên, Admin; bảo toàn claims; chặn Token sửa đổi (Anti-Tampering). |
| **03** | **Health Probe & Kết Nối Cloud Firestore** | 5 | **100% PASS** | `/api/health` trả HTTP 200 JSON, probe 24 bài học thực tế trên Cloud Firestore. |
| **04** | **Xác Thực Học Sinh (Student Auth)** | 4 | **100% PASS** | Chặn sai pass (HTTP 401), chặn thiếu tham số (HTTP 400), đăng nhập thành công HS1A01, không lộ secret/pass. |
| **05** | **Xác Thực Giáo Viên & Triệt Tiêu Backdoor** | 4 | **100% PASS** | Xóa sạch backdoor tự tạo admin (HTTP 401), đăng nhập GV 1 và Admin thành công, cấp token có hạn. |
| **06** | **Xác Minh Phiên Đăng Nhập (/api/auth/verify-session)** | 2 | **100% PASS** | Chặn request không token (HTTP 401), xác minh thành công phiên đăng nhập hợp lệ (HTTP 200). |
| **07** | **Phân Quyền API (Role-Based Access Control)** | 9 | **100% PASS** | Chặn học sinh gọi API giáo viên (HTTP 403), chặn học sinh/giáo viên gọi Seed/Cleanup (HTTP 403), Admin Dry-Run pass. |
| **08** | **E2E Browser Walkthrough (Tự Động Trình Duyệt)** | 5 | **100% PASS** | Trải nghiệm toàn vẹn: Đăng nhập học sinh -> Làm bài MissionPlayer -> Đăng xuất -> Đăng nhập Giáo viên -> Xem học liệu & phân tích lỗi -> Đăng xuất -> Đăng nhập Admin -> Xem Health & Audit log. |

**Tổng cộng: 51/51 Testcases ĐÃ PASS (100% TỶ LỆ ĐẠT TIÊU CHUẨN).**

---

## 2. KIỂM THỬ 6 HOẠT ĐỘNG HỌC TOÁN TƯƠNG TÁC (GDPT 2018)

1. **Trắc nghiệm 1 đáp án (Single Choice):** Chọn đáp án hình ảnh trực quan, hiển thị giải thích chi tiết khi chọn sai. -> **PASS**
2. **Nhập số (Number Input):** Bàn phím số lớn phù hợp học sinh tiểu học, chống nhập ký tự lạ, chấm chính xác số nguyên. -> **PASS**
3. **Chọn dấu phép tính & so sánh (Operator Pick):** So sánh `>` `<` `=`, xác định dấu phép tính thích hợp `+` `-`. -> **PASS**
4. **Nối cặp phép tính – kết quả (Expression Match):** Tương tác chọn nguồn -> chọn đích, kiểm tra toàn bộ các cặp tương ứng. -> **PASS**
5. **Khung 10 ô & Bó chục que tính (Ten-Frame & Bundles):** Mô hình trực quan tư duy số học lớp 1-2, phát hiện lỗi qua 10. -> **PASS**
6. **Trục số & Sắp xếp thứ tự số (Number Line & Ordering):** Điền số còn thiếu vào trục số, sắp xếp dãy số tăng/giảm dần. -> **PASS**

---

## 3. KIỂM THỬ CHẤM ĐIỂM & CHẨN ĐOÁN LỖI SAI (MISCONCEPTION DIAGNOSIS)
- Lần làm đầu tiên đúng: Đạt 10 điểm tuyệt đối.
- Lần làm đầu sai: Hệ thống kích hoạt modal Thám tử Cáo đưa ra manh mối sư phạm trực quan (que tính, khung 10 ô) bám sát mẫu lỗi được chẩn đoán.
- Làm đúng sau khi xem gợi ý: Đạt 7 điểm; ghi nhận riêng biệt `firstAttemptCorrectCount` và `postHintCorrectCount`.
- Dữ liệu lượt làm bài (`attempts`) và chi tiết câu hỏi (`attemptAnswers`) được lưu trữ thời gian thực vào Cloud Firestore.
