# HƯỚNG DẪN DÀNH CHO GIÁO VIÊN (TEACHER GUIDE)
## NỀN TẢNG: THÁM TỬ TOÁN NHÍ

Chào mừng Quý Thầy/Cô đến với **THÁM TỬ TOÁN NHÍ** – nền tảng học Toán Lớp 1 và Lớp 2 với triết lý: *"Mỗi lỗi sai – Một cơ hội khám phá"*.

---

### 1. Đăng Nhập Cổng Giáo Viên
1. Tại màn hình chính, chọn thẻ **Giáo Viên**.
2. Nhập email và mật khẩu (hoặc nhấn nút đăng nhập nhanh **Giáo viên 1** để thử nghiệm ngay).
3. Hoặc nhấn nút **Đăng nhập nhanh với Google** để liên kết tài khoản Gmail cá nhân.

---

### 2. Quản Lý Kho Học Liệu & Bài Học
- **Tìm kiếm & Lọc**: Sử dụng thanh tìm kiếm hoặc nút chuyển đổi **Khối 1** / **Khối 2** để tìm bài học theo chủ đề GDPT 2018.
- **Xem trước như học sinh (Preview)**:
  - Nhấn biểu tượng con mắt (👁️) trên thẻ bài học.
  - Thầy/Cô có thể trải nghiệm trực tiếp 6 dạng tương tác toán học mà **không tạo dữ liệu attempt giả** làm sai lệch thống kê của học sinh.
- **Biên tập bài học (v1 ➔ v2)**:
  - Nhấn biểu tượng cây bút (✏️) để mở bảng soạn thảo.
  - Thầy/Cô có thể thêm, bớt, nhân bản, kéo đổi thứ tự câu hỏi và chỉnh sửa đáp án chuẩn, lời giải thích và gợi ý sư phạm.
  - Nút **Lưu bản nháp**: Giữ phiên bản đang chỉnh sửa.
  - Nút **Duyệt & Xuất bản**: Đóng gói phiên bản bất biến (v2) sẵn sàng để giao cho học sinh.

---

### 3. Sử Dụng "AI Tạo Bài Nháp" (Gemini 2.5 Flash)
1. Nhấn nút **AI Tạo Bài Nháp** (có biểu tượng lấp lánh ✨).
2. Chọn:
   - Khối lớp: Lớp 1 hoặc Lớp 2.
   - Chủ đề bài học: Ví dụ *"Phép cộng có nhớ trong phạm vi 20"*.
   - Mẫu lỗi muốn rèn luyện: Ví dụ *"Sai bước qua 10"* hoặc *"Đảo vị trí Chục và Đơn vị"*.
   - Số lượng câu hỏi và độ khó.
3. Nhấn **AI Tạo Bài Nháp**:
   - Hệ thống phía server sẽ kích hoạt Gemini tạo các câu hỏi bám sát chuẩn GDPT 2018.
   - Thầy/Cô kiểm tra lại các câu hỏi sinh ra. Nếu hài lòng, nhấn **Đưa vào bài giảng** để tiếp tục tùy chỉnh trước khi xuất bản.
   - *Lưu ý*: Nếu hệ thống chưa thiết lập `GEMINI_API_KEY`, ứng dụng sẽ thông báo rõ ràng mà không gây lỗi màn hình trắng; Thầy/Cô vẫn có thể tự soạn thủ công hoàn toàn bình thường.

---

### 4. Giao Bài Tập Cho Lớp Học
1. Trên thẻ bài học đã xuất bản, nhấn nút **Giao bài**.
2. Tích chọn một hoặc nhiều lớp nhận bài (ví dụ: Lớp 1A, Lớp 1B).
3. Chọn hạn hoàn thành bài tập.
4. Nhấn **Xác nhận giao bài**. Cơ chế *Idempotency* bảo đảm không bị tạo trùng đợt giao khi bấm nhiều lần.

---

### 5. Phân Tích Mẫu Lỗi & Xuất Báo Cáo
1. Chuyển sang thẻ **Phân Tích Mẫu Lỗi & Củng Cố**.
2. Quan sát các chỉ số:
   - **Tỷ lệ đúng ngay lần đầu**: Đánh giá mức độ hiểu bài ngay từ câu hỏi đầu tiên.
   - **Tiến bộ sau khi nhận gợi ý**: Đánh giá hiệu quả của manh mối trực quan của Thám tử Cáo.
   - **Biểu đồ phân phối 9 nhóm lỗi toán học**: Chỉ ra học sinh hay nhầm lẫn ở điểm nào nhất (nhầm chục đơn vị, sai dấu, sai bước qua 10...).
3. **AI Tóm Tắt Khắc Phục Lỗi**:
   - Nhấn nút để nhận văn bản tóm tắt sư phạm và các bài tập thực hành trên lớp do AI gợi ý.
4. **Xuất Báo Cáo CSV (UTF-8 BOM)**:
   - Nhấn **Xuất Báo Cáo CSV** để tải file bảng tính mở được ngay trên Excel mà không bị lỗi font tiếng Việt.
   - Luôn sử dụng bộ lọc **Dữ liệu thật** khi báo cáo thực tế cho ban giám hiệu.
