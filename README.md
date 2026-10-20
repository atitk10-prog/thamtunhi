# THÁM TỬ TOÁN NHÍ 🦊🔍
### ỨNG DỤNG AI PHÂN TÍCH LỖI SAI & CỦNG CỐ TRỰC QUAN | TOÁN LỚP 1–2 GDPT 2018 | FIREBASE CLOUD-FIRST

> **Khẩu hiệu**: *"Mỗi lỗi sai – Một cơ hội khám phá"*

Ứng dụng web full-stack hỗ trợ dạy và học môn Toán Lớp 1 và Lớp 2 theo Chương trình Giáo dục Phổ thông 2018. Ứng dụng tập trung vào phương pháp sư phạm khác biệt: **nhận diện mẫu lỗi toán học (Math Misconception Analysis)** qua thuật toán xác định và củng cố bằng mô hình trực quan (khung 10 ô, que tính, trục số), kết hợp AI phía máy chủ hỗ trợ giáo viên thiết kế hoạt động giảng dạy.

---

## 🌟 ĐIỂM NỔI BẬT

1. **Cloud-First Ngay Từ Đầu**:
   - Sử dụng **Google Cloud Firestore** thực tế làm nguồn sự thật duy nhất (Single Source of Truth) trên project `indigo-lotus-2nmq3`.
   - Bảo mật qua **Firestore Security Rules (ABAC)** tuân thủ 8 trụ cột an ninh, deny-by-default, bảo vệ quyền riêng tư bài làm của học sinh.
2. **Bộ Máy Toán Học Xác Định (Deterministic Math Engine)**:
   - Tính toán số nguyên tuyệt đối, không sai số float.
   - Taxonomy 9 mẫu lỗi điển hình: Đếm lệch 1, nhầm dấu phép tính, sai bước qua 10, đảo vị trí chục - đơn vị, đảo chiều so sánh, nhầm thứ tự số, nhầm hình khối, đơn vị đo.
3. **6 Dạng Tương Tác Trực Quan Dành Cho Trẻ 6–8 Tuổi**:
   - (a) Chọn 1 đáp án trắc nghiệm hình ảnh
   - (b) Nhập số trực tiếp với bàn phím ảo lớn
   - (c) Chọn dấu phép tính & so sánh
   - (d) Nối cặp phép tính – kết quả (chạm vật nguồn, chạm vật đích)
   - (e) Khung 10 ô (Ten-Frame) & Bó que tính chục - đơn vị
   - (f) Trục số nhảy bước & Sắp xếp thứ tự số
4. **AI Đồng Hành Cùng Giáo Viên (Server-side Gemini 2.5 Flash)**:
   - Giáo viên dùng AI tạo bài tập nháp theo chuẩn GDPT 2018 có kiểm định số học.
   - AI tóm tắt xu hướng lỗi của lớp học và đề xuất hoạt động củng cố bằng que tính/khung 10 ô.
   - Không gọi AI trong vòng lặp chấm bài học sinh; không dán nhãn tâm lý cố định.
5. **Hạ Tầng 3 Cổng Độc Lập**:
   - **Học Sinh**: Vào bằng Mã học sinh + Mật khẩu (không thu email/số điện thoại của trẻ), có phát âm tiếng Việt, nhận manh mối thám tử khi sai để làm lại, trao huy hiệu.
   - **Giáo Viên**: Quản lý học liệu, xem trước như học sinh, biên tập v1 ➔ v2 bất biến, giao bài chống trùng (idempotent), phân tích lỗi sai và xuất CSV UTF-8 BOM.
   - **Quản Trị Viên (Admin)**: Giám sát sức khỏe hệ thống (Health Check), quản lý lớp học/giáo viên, chạy seed demo idempotency (--dry-run / --apply) và dọn dẹp scoped demo.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### 1. Yêu Cầu Môi Trường
- Node.js >= 20.x
- NPM hoặc Bun

### 2. Cài Đặt Thư Viện
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường
Sao chép tệp `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Cấu hình các biến môi trường nếu cần:
- `GEMINI_API_KEY`: Khóa API Gemini cho tính năng trợ lý giáo viên phía server.
- `PORT`: Cổng máy chủ (mặc định 3000).

### 4. Khởi Chạy Máy Chủ Phát Triển (Full-Stack Dev)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:3000` (hoặc domain Google AI Studio Preview).

### 5. Chạy Bộ Kiểm Thử Unit Test
```bash
npx tsx run-tests.ts
```

### 6. Đóng Gói Sản Xuất (Build)
```bash
npm run build
```

---

## 🔑 TÀI KHOẢN TRẢI NGHIỆM HỆ THỐNG (ACCESS DIRECTORY)

| Vai trò | Thông tin tài khoản | Trạng thái mật khẩu |
| :--- | :--- | :--- |
| **Quản trị viên** | `admin@thamtutoannhi.edu.vn` | *Cấp phát riêng cho quản trị viên, không lưu công khai* |
| **Giáo viên 1 (Khối 1)** | `giaovien1@thamtutoannhi.edu.vn` | *Cấp phát riêng theo tài khoản giáo viên bộ môn* |
| **Giáo viên 2 (Khối 2)** | `giaovien2@thamtutoannhi.edu.vn` | *Cấp phát riêng theo tài khoản giáo viên bộ môn* |
| **Học sinh Lớp 1A** | Mã: `HS1A01` ... `HS1A12` | *Cấp phát theo phiếu nhiệm vụ học sinh lớp 1A* |
| **Học sinh Lớp 2B** | Mã: `HS2B01` ... `HS2B12` | *Cấp phát theo phiếu nhiệm vụ học sinh lớp 2B* |

*Ghi chú*: Trong môi trường phát triển cục bộ (`localhost`) hoặc URL kèm tham số thử nghiệm (`?demo=true`), hệ thống cung cấp các nút kiểm thử tự động để hỗ trợ hội đồng đánh giá mà không để lộ mật khẩu trên môi trường sản xuất.

---

## 📁 BỘ HỒ SƠ MINH CHỨNG KỸ THUẬT
- `FEATURE_MATRIX.md`: Ma trận trạng thái chức năng chi tiết từng nút bấm (100% PASS).
- `CLOUD_ENV_REPORT.md`: Báo cáo hạ tầng Firebase Cloud thật, số lượng bản ghi và thông số kỹ thuật.
- `SECURITY_AUDIT.md`: Kiểm toán an ninh ABAC, chống giả mạo quyền và bảo mật dữ liệu học sinh.
- `DEMO_DATA_MANIFEST.md`: Danh mục 24 bài học, 48 học sinh, 4 lớp và 144 lượt làm bài mẫu.
- `TEACHER_GUIDE.md`: Sổ tay hướng dẫn dành cho Giáo viên.
- `STUDENT_GUIDE.md`: Sổ tay hướng dẫn dành cho Học sinh & Phụ huynh.
- `FAST_RESEARCH_REPORT.md`: Báo cáo phân định giữa thử nghiệm kỹ thuật và thực nghiệm giáo dục.
- `QA_ACCEPTANCE.md`: Biên bản nghiệm thu kiểm thử kỹ thuật.

---

## 📜 GIẤY PHÉP BẢN QUYỀN
Được phát triển trong chương trình Google AI Studio Build. Mã nguồn tuân thủ giấy phép Apache-2.0.
