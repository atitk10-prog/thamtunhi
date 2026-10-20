# HƯỚNG DẪN SỬ DỤNG NHANH (QUICK USER GUIDE)
## NỀN TẢNG THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)

---

## 1. CỔNG HỌC SINH (PHÁ ÁN TOÁN HỌC)
- **Đăng nhập:** Nhập **Mã học sinh** (Ví dụ: `HS1A01`, `HS2B05`) và **Mật khẩu** do nhà trường cấp.
- **Bàn nhiệm vụ:** Hiển thị danh sách các bài luyện tập Toán được giáo viên giao cho lớp.
- **Làm bài tương tác:**
  - Nghe đọc câu hỏi bằng giọng đọc tiếng Việt ấm áp (biểu tượng loa).
  - Trải nghiệm 6 dạng bài học trực quan: Chọn đáp án, Nhập số, Chọn dấu, Nối cặp, Khung 10 ô / que tính, Trục số.
  - Khi làm sai: Thám tử Cáo sẽ xuất hiện hướng dẫn manh mối trực quan để bé thử sức lại lần thứ 2.
  - Hoàn thành bài: Nhận huy hiệu Thám tử Toán học xuất sắc và xem lại kết quả.

---

## 2. CỔNG GIÁO VIÊN (QUẢN LÝ & SOẠN HỌC LIỆU)
- **Đăng nhập:** Email giáo viên (Ví dụ: `giaovien1@thamtutoannhi.edu.vn`) và Mật khẩu, hoặc đăng nhập nhanh bằng Google.
- **Quản lý học liệu (Kho 24 bài chuẩn GDPT 2018):**
  - Xem trước bài học với vai trò học sinh để thẩm định nội dung.
  - Biên soạn và chỉnh sửa câu hỏi trực quan.
  - Sử dụng **AI Soạn bài nháp (Gemini)**: Chỉ định khối lớp, chủ đề và mẫu lỗi cần củng cố, AI sẽ tạo đề Toán chuẩn mực.
- **Giao bài:** Giao bài tập cho từng lớp theo thời hạn quy định.
- **Phân tích mẫu lỗi:**
  - Theo dõi tỷ lệ tiến bộ sau khi xem gợi ý của học sinh trong lớp.
  - Xem biểu đồ các dạng lỗi hay gặp nhất và nhận gợi ý sư phạm củng cố bài học từ AI.
  - Xuất báo cáo kết quả định dạng CSV (hỗ trợ tiếng Việt UTF-8 BOM).

---

## 3. CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL)
- **Đăng nhập:** Tài khoản quản trị hệ thống (`admin@thamtutoannhi.edu.vn`).
- **Giám sát sức khỏe hệ thống (System Health):**
  - Kiểm tra trạng thái thực tế của Cloud Firestore, số lượng bài học, đợt giao bài, lượt làm bài.
- **Quản lý người dùng & lớp học:**
  - Thêm mới giáo viên, học sinh, phân lớp học theo năm học.
- **Nhật ký an toàn (Audit Logs):**
  - Kiểm tra nhật ký các thao tác quan trọng trong hệ thống để bảo đảm an toàn dữ liệu.
