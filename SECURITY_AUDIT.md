# BÁO CÁO KIỂM TOÁN AN NINH (SECURITY AUDIT)
## HỆ THỐNG: THÁM TỬ TOÁN NHÍ

### 1. Kiến Trúc An Ninh Tổng Thể
Hệ thống tuân thủ mô hình **Zero-Trust & Attribute-Based Access Control (ABAC)** kết hợp cùng Firestore Security Rules v2.

#### A. Nguyên Tắc Cốt Lõi
1. **Deny-by-Default**: Mọi collection đều bị chặn đọc/ghi mặc định bằng khối catch-all:
   ```javascript
   match /{document=**} { allow read, write: if false; }
   ```
2. **Không Tin Cậy Dữ Liệu Client**: Mọi quyền hạn (roles) được kiểm tra trực tiếp từ tài liệu `/users/{uid}` trong Firestore hoặc token quản trị được bảo vệ; không dựa vào claims tùy ý do client gửi lên.
3. **Bảo Vệ Tính Toàn Vẹn Bản Ghi Lượt Làm Bài (Attempt Immutability)**:
   Khi học sinh đã nộp bài (`status: 'completed'`), quy tắc khóa hoàn toàn quyền cập nhật điểm số hay sửa câu trả lời.
4. **Không Để Lộ Đáp Án Trước Cho Học Sinh**:
   Học sinh chỉ được cấp phép nhận câu hỏi và tương tác. Toàn bộ logic chấm và phân loại lỗi sai được xử lý qua engine chuẩn hoặc đối soát logic server.

### 2. Đánh Giá Khả Năng Kháng Cự 12 Tình Huống Tấn Công (The "Dirty Dozen")

| Mã | Tình Huống Tấn Công | Cơ Chế Bảo Vệ (Defense) | Kết Quả Kiểm Thử |
| :---: | :--- | :--- | :---: |
| **01** | Học sinh tự nâng quyền `role: 'admin'` trong Firestore | Rules chỉ cho phép Bootstrapped Admin được cập nhật collection `users`. Học sinh chỉ được đọc thông tin của chính mình. | **BLOCKED (PERMISSION_DENIED)** |
| **02** | Học sinh đọc bài làm (`attempts`) của bạn khác | Quy tắc kiểm tra `resource.data.studentId == request.auth.uid`. Chặn hoàn toàn truy cập chéo. | **BLOCKED (PERMISSION_DENIED)** |
| **03** | Học sinh sửa điểm số sau khi hoàn thành | Khóa trạng thái: `resource.data.status != 'completed'` chỉ cho phép cập nhật khi đang làm bài. | **BLOCKED (PERMISSION_DENIED)** |
| **04** | Người dùng nặc danh (chưa đăng nhập) đọc bài học hoặc bài giao | Kiểm tra `isSignedIn()` bắt buộc trên toàn bộ các collection `lessons`, `assignments`, `classes`. | **BLOCKED (PERMISSION_DENIED)** |
| **05** | Giáo viên trường A sửa bài của Giáo viên trường B | Kiểm tra quyền tác giả hoặc vai trò quản trị viên. | **BLOCKED (PERMISSION_DENIED)** |
| **06** | Tấn công Denial-of-Wallet bằng cách bơm chuỗi rác 1MB vào ID | Hàm `isValidId(id)` giới hạn độ dài ký tự `<= 128` và kiểm tra regex ký tự hợp lệ. | **BLOCKED (INVALID_ARGUMENT)** |
| **07** | Học sinh xóa lớp học hoặc bài tập đã giao | Quyền `delete` trên `classes` và `assignments` chỉ dành cho giáo viên và quản trị viên. | **BLOCKED (PERMISSION_DENIED)** |
| **08** | Bơm trường ma (Ghost Fields) vào bản ghi | Kiểm tra cấu trúc trường qua schema Zod và ABAC rules. | **BLOCKED (PERMISSION_DENIED)** |
| **09** | Xâm nhập trái phép tài khoản học sinh | Mã học sinh ngẫu nhiên kèm mật khẩu truy cập riêng; không dùng chung mã định danh; xác thực server-side. | **BLOCKED** |
| **10** | Giả mạo sự kiện trong Audit Log | Quyền ghi audit log độc lập, không cho phép sửa đổi hoặc xóa (`allow update, delete: if false`). | **BLOCKED (IMMUTABLE)** |
| **11** | Chỉnh sửa trường bất biến như `createdAt` | Quy tắc cập nhật bảo toàn trường khởi tạo. | **BLOCKED** |
| **12** | Rò rỉ khóa bí mật API (GEMINI_API_KEY) ra client | Gọi AI hoàn toàn qua proxy phía server (`/api/teacher/*`). Không có biến môi trường private nào lọt vào bundle Vite. | **SECURED (ZERO LEAK)** |
