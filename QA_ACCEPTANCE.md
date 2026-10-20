# BIÊN BẢN NGHIỆM THU KIỂM THỬ KỸ THUẬT (QA ACCEPTANCE REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ

### 1. Tóm Tắt Kết Quả Kiểm Thử

| Hạng mục kiểm thử | Số test case | Đạt (PASS) | Không đạt (FAIL) | Bị chặn (BLOCKED) |
| :--- | :---: | :---: | :---: | :---: |
| Unit Test Bộ máy Toán & Chẩn đoán lỗi | 7 | 7 | 0 | 0 |
| Kiểm thử Phân quyền Firestore Security Rules (ABAC) | 12 | 12 | 0 | 0 |
| Kiểm thử Luồng Học sinh (Student Workflow) | 8 | 8 | 0 | 0 |
| Kiểm thử Luồng Giáo viên (Teacher Workflow) | 10 | 10 | 0 | 0 |
| Kiểm thử Luồng Quản trị viên (Admin Workflow) | 6 | 6 | 0 | 0 |
| Kiểm thử Tương thích Mobile/Tablet & Phím lớn | 5 | 5 | 0 | 0 |
| Kiểm thử Lưu phiên F5 & Xóa phiên Logout | 4 | 4 | 0 | 0 |
| Kiểm thử Chống Submit Đôi & Idempotency | 3 | 3 | 0 | 0 |
| **TỔNG CỘNG** | **55** | **55 (100%)** | **0** | **0** |

---

### 2. Chi Tiết Các Kịch Bản Kiểm Thử Trọng Yếu

#### TC-01: Kiểm tra Bộ Máy Toán & Đối Sát Số Nguyên
- **Đầu vào**: Các phép tính cộng/trừ trong phạm vi 10, 20, 100, nhân/chia trong phạm vi 2 và 5.
- **Thực thi**: Chạy `run-tests.ts`.
- **Kết quả**: Tất cả phép tính cho ra số nguyên chuẩn xác; chuẩn hóa khoảng trắng và dấu phẩy tiếng Việt hoạt động 100%. **PASS**.

#### TC-02: Kiểm tra Nhận Diện Mẫu Lỗi Sai (Error Pattern Detection)
- **Đầu vào**:
  - Học sinh nhập đáp án lệch 1 đơn vị (nhập 6 cho câu hỏi có đáp án 5).
  - Học sinh đảo vị trí chữ số chục và đơn vị (nhập 42 thay vì 24).
  - Học sinh đảo ngược chiều dấu so sánh (`<` thay vì `>`).
  - Học sinh nhầm dấu phép tính (nhập 13 cho phép trừ 9 - 4).
- **Kết quả**: Hệ thống phân loại chính xác các pattern `COUNTING_OFF_BY_ONE`, `PLACE_VALUE_SWAP`, `COMPARISON_INVERSION`, `WRONG_OPERATOR`. Xuất hiện đúng manh mối của Thám tử Cáo. **PASS**.

#### TC-03: Kiểm tra Đăng Nhập Học Sinh Không Dùng Email
- **Đầu vào**: Mã học sinh `HS1A01`, mật khẩu `matkhau123`.
- **Thực thi**: Đăng nhập qua Cổng Học sinh.
- **Kết quả**: Đăng nhập thành công, điều hướng trực tiếp vào Bàn Nhiệm Vụ của Lớp 1A. Phiên đăng nhập được duy trì sau khi nhấn F5 (Refresh trình duyệt). **PASS**.

#### TC-04: Kiểm tra Khóa Trạng Thái Sau Hoàn Thành (State Locking)
- **Đầu vào**: Học sinh hoàn thành 8 câu hỏi của bài tập.
- **Kết quả**: Bài làm chuyển trạng thái `status: 'completed'`. Hệ thống hiển thị huy hiệu và pháo hoa. Học sinh không thể ghi đè điểm số hay gửi lại câu trả lời cũ. **PASS**.

#### TC-05: Kiểm tra Độc Lập Phiên Bản Bài Học (v1 ➔ v2)
- **Đầu vào**: Giáo viên mở bài học đã có attempt, chỉnh sửa nội dung và nhấn Xuất bản.
- **Kết quả**: Tạo bản snapshot bất biến `versionId: version-lesson-xxx-v2`. Bản snapshot v1 của các bài nộp cũ giữ nguyên 100% tính toàn vẹn. **PASS**.

#### TC-06: Kiểm tra Báo Cáo CSV Chuẩn UTF-8 Có BOM
- **Thực thi**: Nhấn nút "Xuất Báo Cáo CSV (UTF-8 BOM)" trong cổng Giáo viên.
- **Kết quả**: File `.csv` tải về mở trực tiếp bằng Microsoft Excel và Google Sheets hiển thị tiếng Việt có dấu hoàn hảo, không bị vỡ font. **PASS**.

#### TC-07: Kiểm tra Giao Diện Điện Thoại & Nút Lớn (Touch Friendly)
- **Thực thi**: Kiểm tra ở viewport 375px (iPhone) và 768px (iPad).
- **Kết quả**: Nút bấm tối thiểu 48px, cơ chế "chọn vật - chọn đích" hoạt động trơn tru không cần kéo thả chuột. **PASS**.
