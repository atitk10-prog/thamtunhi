# BÁO CÁO NGHIỆM THU PHÂN HỆ GIÁO VIÊN G1 – LỚP HỌC & HỌC SINH
**Dự án:** THÁM TỬ TOÁN NHÍ (Lớp 1–2 GDPT 2018)  
**Repository:** `atitk10-prog/thamtunhi` | **Nhánh:** `main`  
**Commit mới nhất:** `c2f469e` (đã đồng bộ với GitHub `origin/main`)  
**Production URL:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app/)  
**Thời điểm nghiệm thu:** 21/10/2026  
**Trạng thái nghiệm thu G1:** **PASS 100% (HOÀN TẤT VÀ ĐẠT TOÀN DIỆN MỤC TIÊU)**

---

## 1. BẢNG KIỂM TOÁN CHỨC NĂNG PHÂN HỆ GIÁO VIÊN G1

| STT | Chức năng / Thao tác | Thành phần mã nguồn | Trạng thái trước G1 | Kết quả sau hoàn thiện G1 | Đánh giá |
|:---:|:---|:---|:---|:---|:---:|
| 1 | Xem danh sách lớp được phân công | `TeacherPortal.tsx`, `server.ts` | Trả về toàn bộ lớp nếu không lọc kỹ | Lọc nghiêm ngặt `teacherId == user.uid`, không hiển thị lớp chưa được phân công | **PASS** |
| 2 | Giao diện rỗng khi chưa có lớp | `TeacherPortal.tsx` | Thiếu hướng dẫn thân thiện | Bổ sung thẻ Empty State với Thám Tử Fox, thông báo rõ ràng, nút xem kho học liệu | **PASS** |
| 3 | Xử lý lỗi API & Nút thử lại | `TeacherPortal.tsx` | Dùng alert trình duyệt | Thẻ lỗi giao diện màu đỏ + nút "Thử lại" tải lại dữ liệu an toàn | **PASS** |
| 4 | Xem danh sách học sinh theo lớp | `ClassRosterView.tsx`, `server.ts` | Hiển thị dữ liệu tĩnh / demo cũ | Tính từ tài khoản vận hành thực tế (12 HS/lớp), niên khóa chuẩn 2026 - 2027 | **PASS** |
| 5 | Tìm kiếm học sinh theo Mã/Tên | `ClassRosterView.tsx` | Có ô tìm kiếm cơ bản | Tìm kiếm tức thời theo mã học sinh (HS1A...) hoặc họ tên tiếng Việt | **PASS** |
| 6 | Lọc trạng thái học sinh | `ClassRosterView.tsx` | Cơ bản | Lọc Tất cả, Đang học, Bị khóa kèm số lượng real-time | **PASS** |
| 7 | Sắp xếp danh sách học sinh | `ClassRosterView.tsx` | Chưa có | Dropdown sắp xếp theo: Mã HS (A-Z/Z-A), Họ tên (A-Z/Z-A), Điểm TB, Tiến độ | **PASS** |
| 8 | Xem chi tiết học sinh & Tiến độ | `ClassRosterView.tsx` | Chưa có modal riêng | Modal chi tiết học sinh (icon Con mắt & click tên): Profile, 4 thẻ thống kê, bảng trạng thái từng bài giao | **PASS** |
| 9 | Giao bài tập cho cả lớp / cá nhân | `AssignModal.tsx`, `TeacherPortal.tsx` | Đã có | Khớp bài học, hỗ trợ giao bài cho cả lớp hoặc riêng cho học sinh được chọn | **PASS** |
| 10 | Khóa / Mở khóa tài khoản học sinh | `ClassRosterView.tsx`, `server.ts` | Dùng `window.confirm` trình duyệt | Thay thế 100% bằng Modal cảnh báo chuyên nghiệp + Toast thông báo | **PASS** |
| 11 | Đặt lại mật khẩu học sinh | `ClassRosterView.tsx`, `server.ts` | Dùng alert | Modal đặt lại mật khẩu an toàn, không hiển thị mật khẩu cũ ra màn hình | **PASS** |
| 12 | Chuyển lớp an toàn cho học sinh | `ClassRosterView.tsx`, `server.ts` | Chưa có toast | Modal chuyển lớp có danh sách lớp lựa chọn, cập nhật className và grade đồng bộ | **PASS** |
| 13 | Bảo mật ABAC (Chặn xem chéo lớp) | `server.ts` | Còn thiếu chặn backend | Trả về HTTP 403 Forbidden ngay từ tầng API nếu giáo viên gọi lớp không phụ trách | **PASS** |
| 14 | Bảo mật thông tin cá nhân (Zero leak)| `server.ts`, `ClassRosterView.tsx` | Có nguy cơ lộ secret | Loại bỏ hoàn toàn `accessSecret`, `passwordHash` khỏi payload danh sách học sinh | **PASS** |

---

## 2. ĐỐI SOÁT LỚP VÀ PHÂN CÔNG VỚI QUẢN TRỊ VIÊN (ADMIN)

### 2.1. Cấu hình Niên khóa và Sĩ số lớp thực tế
- **Niên khóa vận hành:** `year-2026-2027` (Hiển thị giao diện: `2026 - 2027`).
- **Danh sách 4 lớp chính khóa:**
  1. **Lớp 1A** (Khối 1): Sĩ số **12 học sinh** (`HS1A01` – `HS1A12`).
  2. **Lớp 1B** (Khối 1): Sĩ số **12 học sinh** (`HS1B01` – `HS1B12`).
  3. **Lớp 2A** (Khối 2): Sĩ số **12 học sinh** (`HS2A01` – `HS2A12`).
  4. **Lớp 2B** (Khối 2): Sĩ số **12 học sinh** (`HS2B01` – `HS2B12`).
  - **Tổng sĩ số học sinh toàn trường:** 48 học sinh chính khóa.

### 2.2. Giải trình chênh lệch 13 so với 12 học sinh Lớp 1A
- **Nguyên nhân gốc:** Bản ghi `student-test6382-6614` (`TEST6382`) là dữ liệu sinh ra trong quá trình kiểm thử tự động giai đoạn A2 trước khi cơ chế xóa/lưu trữ hoàn thiện, khiến trạng thái còn `isDeleted: false` và `status: active`.
- **Hành động khắc phục:** Đã thực hiện `scripts/archive_test6382.ts`, cập nhật bản ghi kiểm thử thành `isDeleted: true, status: 'inactive'`. Không xóa vật lý dữ liệu Firebase, đưa tài khoản kiểm thử vào diện lưu trữ audit.
- **Kết quả đối soát hiện tại:** Cả 4 lớp học đều đạt chuẩn chính xác **12 học sinh/lớp**.

### 2.3. Ma trận Phân công Giáo viên Thực tế

| Giáo viên | Tài khoản / UID | Lớp được phân công | Quyền truy cập thực tế | Ghi chú |
|:---|:---|:---:|:---|:---|
| **Cô Mai Lan** | `teacher-1` (`giaovien1@thamtutoannhi.edu.vn`) | **1A, 1B** | Xem & quản trị học sinh Lớp 1A, 1B. Bị từ chối HTTP 403 khi vào 2A, 2B. | Đúng quy hoạch Khối 1 |
| **Thầy Quốc Huy** | `teacher-2` (`giaovien2@thamtutoannhi.edu.vn`) | **2A, 2B** | Xem & quản trị học sinh Lớp 2A, 2B. Bị từ chối HTTP 403 khi vào 1A, 1B. | Đúng quy hoạch Khối 2 |
| **Trần Thanh Thanh** | `user-1792533985096` (`thanhthanh@gmail.com`) | **Chưa có lớp** (0 lớp) | Thấy Empty State card hướng dẫn; bị chặn HTTP 403 khi gọi API danh sách học sinh của cả 4 lớp. | Không tự cấp lớp |

---

## 3. KẾT QUẢ KIỂM THỬ BẢO MẬT ABAC VÀ LIÊN THÔNG VỚI ADMIN

Bộ kiểm thử tự động `scripts/test_teacher_g1.ts` và `scripts/verify_prod_g1.ts` đã kiểm tra nghiêm ngặt:

### 3.1. Bằng chứng HTTP 403 Forbidden khi truy cập trái quyền
```text
--- KIỂM TRA BẢO MẬT TRUY CẬP TRỰC TIẾP API (ABAC) ---
[PASS] Giáo viên 1 truy cập GET /api/teacher/classes/class-2a/students -> HTTP 403 Forbidden
[PASS] Giáo viên 1 truy cập GET /api/teacher/classes/class-2b/students -> HTTP 403 Forbidden
[PASS] Giáo viên 1 POST /api/teacher/classes/class-2a/students (thêm HS) -> HTTP 403 Forbidden
[PASS] Giáo viên 1 PATCH /api/teacher/students/:id (khóa HS lớp 2A) -> HTTP 403 Forbidden
[PASS] Giáo viên 2 truy cập GET /api/teacher/classes/class-1a/students -> HTTP 403 Forbidden
[PASS] Giáo viên 2 truy cập GET /api/teacher/classes/class-1b/students -> HTTP 403 Forbidden
[PASS] GV Trần Thanh Thanh truy cập GET /api/teacher/classes/class-1a/students -> HTTP 403 Forbidden
[PASS] GV Trần Thanh Thanh truy cập GET /api/teacher/classes/class-2a/students -> HTTP 403 Forbidden
```

### 3.2. Kiểm thử Liên thông Admin phân công động & Thu hồi quyền tức thì
1. **Bước 1:** Admin gọi `PATCH /api/admin/classes/class-1b/teacher` chuyển Lớp 1B cho cô **Trần Thanh Thanh**.
2. **Bước 2:** Cô Trần Thanh Thanh gọi `GET /api/teacher/classes` -> Lập tức hiển thị Lớp 1B; gọi `GET /api/teacher/classes/class-1b/students` -> Trả về HTTP 200 OK với 12 học sinh.
3. **Bước 3:** Cô Mai Lan (Giáo viên cũ) gọi `GET /api/teacher/classes/class-1b/students` -> Bị chặn ngay lập tức với **HTTP 403 Forbidden**.
4. **Bước 4:** Admin chuyển lại Lớp 1B cho cô Mai Lan -> Quyền hạn của cô Mai Lan được khôi phục, cô Trần Thanh Thanh trở về trạng thái 0 lớp được phân công.
- **Kết luận:** Cơ chế phân công phân quyền liên thông thời gian thực giữa Admin và Giáo viên hoạt động hoàn hảo.

---

## 4. HÌNH ẢNH MINH CHỨNG TRẢI NGHIỆM GIAO DIỆN (PLAYWRIGHT E2E)

Các kiểm thử Playwright tự động đã chạy qua Desktop (1366x768), Tablet (768x1024) và Mobile (390x844). Toàn bộ ảnh chụp màn hình được bảo lưu trong artifact:

### 4.1. Desktop (1366px) – Danh sách Lớp Học & Roster Lớp 1A
![Danh sách Lớp Học Giáo Viên 1](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-01-desktop-classes.png)

![Danh sách Học Sinh Lớp 1A với Tìm kiếm, Sắp xếp và Tiến độ](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-02-desktop-roster-1a.png)

### 4.2. Desktop (1366px) – Modal Chi Tiết Học Sinh & Modal Khóa Tài Khoản
![Modal Chi Tiết Học Sinh và Tiến Độ Từng Bài](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-03-desktop-student-detail-modal.png)

![Modal Xác Nhận Khóa Tài Khoản An Toàn](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-04-desktop-lock-modal.png)

### 4.3. Desktop (1366px) – Giao diện Giáo viên Chưa Phân Công Lớp (Empty State)
![Giao diện Hướng dẫn khi Giáo viên Chưa Có Lớp](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-05-desktop-empty-state.png)

### 4.4. Tablet (768px) và Mobile (390px) Responsive
````carousel
![Giao diện Roster trên Tablet 768px](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-06-tablet-roster-1a.png)
<!-- slide -->
![Giao diện Roster trên Mobile 390px](file:///C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/teacher-07-mobile-roster-1a.png)
````

---

## 5. KẾT QUẢ KIỂM TRA HỒI QUY ADMIN & BẢO MẬT DỮ LIỆU

1. **Chức năng Admin CRUD (A2 & A3):**
   - Đã chạy trọn vẹn `test-admin-closeout.ts` và `test-admin-a2-a3.ts`.
   - Kết quả: **20/20 PASS** (Closeout) và **28/28 PASS** (A2 & A3). Thao tác Thêm/Sửa/Khóa/Xóa/Lưu trữ Giáo viên, Học sinh và Lớp học hoàn toàn không bị ảnh hưởng.
2. **Kiểm tra sao lưu Git & Rò rỉ thông tin:**
   - Chạy `git ls-files backups/` -> Kết quả **RỖNG** (0 file backup JSON bị đưa lên Git).
   - Quy tắc `.gitignore` bảo vệ nghiêm ngặt các thư mục `backup/`, `backups/`, `*.backup.json`.
3. **Firestore Security Rules trên Cloud:**
   - File `firestore.rules` đang áp dụng cho database `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`.
   - Chặn người dùng nặc danh đọc `users`, `classes`, `academicYears`. Chặn học sinh sửa đổi bài đã nộp hoặc mạo danh người khác.

---

## 6. KẾT QUẢ KIỂM THỬ TRÊN PRODUCTION ([https://thamtunhi.vercel.app](https://thamtunhi.vercel.app/))

Kết quả thực thi `scripts/verify_prod_g1.ts` gọi trực tiếp vào Production Serverless:
```text
=== KIỂM THỬ KHẢO SÁT PRODUCTION G1 (https://thamtunhi.vercel.app) ===
1. Health probe HTTP: 200 (healthy, named database: ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2)
Authenticating 3 teachers on Production...
✓ Successfully obtained production tokens for all 3 teachers.

2. Teacher 1 Classes HTTP: 200 | Classes: [ '1A (12 HS)', '1B (12 HS)' ]
3. Teacher 1 Roster 1A HTTP: 200 | Students count: 12
4. Teacher 1 access 2A (ABAC Forbidden test) HTTP: 403 Forbidden
5. Teacher 2 Classes HTTP: 200 | Classes: [ '2A (12 HS)', '2B (12 HS)' ]
6. Teacher 2 access 1A (ABAC Forbidden test) HTTP: 403 Forbidden
7. Teacher Trần Thanh Thanh Classes HTTP: 200 | Classes count: 0 (Thấy giao diện Empty State)
8. Teacher Trần Thanh Thanh access 1A (ABAC Forbidden test) HTTP: 403 Forbidden

=== HOÀN TẤT KIỂM THỬ KHẢO SÁT PRODUCTION G1: 100% PASS ===
```

---

## 7. TỔNG KẾT VÀ KIẾN NGHỊ BÀN GIAO G1

- **Đánh giá tổng thể G1:** **PASS 100%**.
- **Không có dữ liệu vượt quyền:** Giáo viên chỉ thấy đúng các lớp được phân công; các truy vấn trực tiếp bằng API sang lớp của giáo viên khác đều bị từ chối với HTTP 403.
- **Không có dữ liệu nhạy cảm bị rò rỉ:** Mã học sinh, họ tên, tiến độ được hiển thị rõ ràng; mật khẩu và passwordHash bị ẩn triệt để.
- **Trạng thái sẵn sàng:** Phân hệ Giáo viên G1 (Lớp học & Học sinh) đã hoàn thiện và sẵn sàng cho việc nghiệm thu, trước khi chuyển giao tiếp tục sang G2 (Học liệu, Soạn bài & Phân tích lỗi sai).
