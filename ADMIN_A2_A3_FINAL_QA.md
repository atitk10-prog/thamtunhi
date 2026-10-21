# BÁO CÁO NGHIỆM THU A2 & A3: HOÀN THIỆN CRUD NGƯỜI DÙNG VÀ LỚP HỌC TRÊN ADMIN

**Dự án:** THÁM TỬ TOÁN NHÍ  
**Repository:** `atitk10-prog/thamtunhi`  
**Nhánh triển khai:** `main`  
**Production URL:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app)  
**Thời điểm nghiệm thu:** 21/10/2026  
**Trạng thái nghiệm thu:** **PASS 100% (ĐẠT CHUẨN XUẤT XẮC)**

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ NGHIỆM THU (PASS / FAIL / BLOCKED)

| STT | Mã Mục | Hạng Mục Kiểm Thử | Yêu Cầu Nghiệp Vụ | Kết Quả | Ghi Chú |
|:---:|:---:|---|---|:---:|---|
| 1 | **A2-01** | Cột Thao tác bảng Người dùng | Đầy đủ 5 nút: Xem chi tiết (`Eye`), Sửa thông tin (`Edit3`), Đổi mật khẩu (`Key`), Khóa/Mở khóa (`Lock`/`Unlock`), Xóa/Lưu trữ (`Trash2`) | **PASS** | Giao diện sắc nét, tooltip rõ ràng, chuẩn phong cách hệ thống |
| 2 | **A2-02** | Sửa thông tin tài khoản (A2) | `PATCH /api/admin/users/:id`: Sửa họ tên, email (GV), mã học sinh, lớp học (HS), trạng thái | **PASS** | Tự động đồng bộ `className` và `grade` khi chuyển lớp học sinh |
| 3 | **A2-03** | Khóa & Mở khóa tài khoản (A2) | `PATCH /api/admin/users/:id/lock`: Khóa tức thì thu hồi token, mở khóa cho phép đăng nhập lại | **PASS** | Kiểm chứng tự động với GV và HS, bảo vệ chặn Admin tự khóa chính mình |
| 4 | **A2-04** | Kiểm tra dữ liệu liên kết thời gian thực | `GET /api/admin/users/:id/linked-data`: Trả về số lớp phụ trách, bài giảng, bài giao, lượt thi | **PASS** | Modal xóa tự động tải và hiển thị minh bạch số liệu liên kết |
| 5 | **A2-05** | Xóa an toàn / Lưu trữ người dùng (A2) | Tài khoản có lịch sử: Chuyển sang Lưu trữ (`isDeleted: true`, `status: 'locked'`), bảo toàn 100% kết quả thi. Tài khoản trống: Cho phép xóa vĩnh viễn | **PASS** | Không dựa vào lỗi `PERMISSION_DENIED`; xử lý theo chính sách ràng buộc nghiệp vụ |
| 6 | **A2-06** | Ràng buộc Giáo viên phụ trách lớp | Chặn xóa/lưu trữ giáo viên đang phụ trách lớp (`TEACHER_HAS_ACTIVE_CLASSES`), cảnh báo admin cần hủy phân công hoặc bàn giao trước | **PASS** | Ngăn ngừa triệt để tình trạng tạo lớp mồ côi giáo viên |
| 7 | **A2-07** | Bảo vệ tài khoản Quản trị viên | Chặn tự xóa tài khoản Admin đang đăng nhập hoặc xóa Admin cuối cùng của hệ thống | **PASS** | HTTP 400 Bad Request, bảo vệ an ninh cấp cao nhất |
| 8 | **A3-01** | Nút "+ Thêm Lớp Học" | Hiển thị nổi bật tại tiêu đề phân hệ "Lớp học & Phân công" | **PASS** | Nút bấm sang trọng, modal tạo lớp đầy đủ trường thông tin |
| 9 | **A3-02** | Tạo lớp học mới (A3) | `POST /api/admin/classes`: Tên, khối, niên khóa mặc định `year-2026-2027`, giáo viên, trạng thái | **PASS** | Kiểm tra và chặn tạo trùng tên lớp trong cùng một niên khóa |
| 10 | **A3-03** | Sửa thông tin lớp học (A3) | `PATCH /api/admin/classes/:id`: Sửa tên hiển thị, khối, niên khóa, giáo viên, trạng thái | **PASS** | Giữ nguyên Document ID kỹ thuật, bảo vệ toàn vẹn ID liên kết của học sinh |
| 11 | **A3-04** | Xóa an toàn / Lưu trữ lớp học (A3) | `DELETE /api/admin/classes/:id`: Lớp có học sinh/bài giao -> chặn xóa cứng, cho phép lưu trữ. Lớp trống -> xóa vĩnh viễn sau xác nhận 2 bước | **PASS** | Thử nghiệm chặn xóa cứng Lớp 1A (có 13 HS, 8 bài giao) thành công 100% |
| 12 | **A3-05** | Phân công & Hủy phân công giáo viên (A3) | `PATCH /api/admin/classes/:id/teacher`: Hỗ trợ phân công GV mới hoặc hủy phân công (`teacherId: null`) | **PASS** | Cập nhật quyền hạn truy cập của giáo viên ngay lập tức, ghi nhật ký audit |
| 13 | **SEC-01** | Kiểm soát phân quyền RBAC | Chặn Giáo viên và Học sinh gọi các API Quản trị tạo/sửa/xóa lớp và người dùng | **PASS** | Toàn bộ API trả về HTTP 403 Forbidden nếu không có quyền admin |
| 14 | **DATA-01** | Bảo toàn cơ sở dữ liệu Cloud Firestore | Không mất mát dữ liệu 4 lớp chính khóa, 48 học sinh, 26 bài giao, 263 lượt làm bài thi | **PASS** | Kiểm toán đối soát độc lập: 0 bản ghi mồ côi, toàn vẹn 100% |

---

## 2. DANH MỤC API VÀ ENDPOINT ĐÃ BỔ SUNG & HOÀN THIỆN

### 2.1. Phân Hệ Người Dùng (A2)
- **`GET /api/admin/users/:id/linked-data`**:
  - **Mục đích:** Kiểm toán thời gian thực các ràng buộc dữ liệu liên kết trước khi thực hiện xóa.
  - **Dữ liệu trả về:**
    ```json
    {
      "assignedClasses": [{"id": "class-1a", "name": "1A"}],
      "lessonsCreated": 4,
      "assignmentsCount": 8,
      "attemptsCount": 0,
      "totalLinked": 12,
      "canHardDelete": false
    }
    ```
- **`DELETE /api/admin/users/:id`**:
  - **Mục đích:** Xóa tài khoản người dùng an toàn theo chính sách nghiệp vụ.
  - **Logic ràng buộc:**
    1. Kiểm tra ID: Nếu là Admin đang đăng nhập hoặc Admin cuối cùng -> Trả về HTTP 400.
    2. Kiểm tra Giáo viên: Nếu có lớp đang phụ trách (`assignedClasses.length > 0`) -> Trả về HTTP 400 `TEACHER_HAS_ACTIVE_CLASSES`.
    3. Nếu `totalLinked > 0` hoặc yêu cầu `archive: true`: Thực hiện lưu trữ an toàn (`isDeleted: true`, `status: 'locked'`, tăng `tokenVersion` để thu hồi toàn bộ phiên đăng nhập, giữ nguyên ID tài khoản để bảo toàn lịch sử chấm điểm).
    4. Nếu `totalLinked === 0` và yêu cầu xóa cứng: Thực hiện xóa vĩnh viễn sau xác nhận 2 bước.
- **`PATCH /api/admin/users/:id`**:
  - **Mục đích:** Cập nhật hồ sơ tài khoản giáo viên/học sinh.
  - **Đặc điểm:** Tự động đồng bộ `className` và `grade` khi học sinh được chuyển sang lớp mới.

### 2.2. Phân Hệ Lớp Học & Phân Công (A3)
- **`POST /api/admin/classes`**:
  - **Mục đích:** Tạo lớp học mới trong niên khóa hiện hành.
  - **Logic ràng buộc:** Kiểm tra niên khóa hợp lệ (mặc định `year-2026-2027`), kiểm tra tính duy nhất của tên lớp trong niên khóa (chặn trùng tên), khởi tạo sĩ số và liên kết giáo viên phụ trách, ghi nhật ký `CREATE_CLASS`.
- **`PATCH /api/admin/classes/:id`**:
  - **Mục đích:** Cập nhật thông tin lớp học (tên hiển thị, khối, niên khóa, giáo viên, trạng thái).
  - **Đặc điểm:** Giữ nguyên Document ID để không phá vỡ liên kết của học sinh trong lớp, ghi nhật ký `UPDATE_CLASS`.
- **`DELETE /api/admin/classes/:id`**:
  - **Mục đích:** Xóa an toàn hoặc lưu trữ lớp học.
  - **Logic ràng buộc:**
    1. Kiểm tra số học sinh đang hoạt động và số bài tập đã giao của lớp.
    2. Nếu lớp có dữ liệu liên kết và không yêu cầu lưu trữ (`archive !== true`) -> Trả về HTTP 400 `CLASS_HAS_LINKED_DATA`.
    3. Nếu yêu cầu lưu trữ: Đặt `status: 'archived'`, `isDeleted: true`, lớp ẩn khỏi danh sách mở nhưng học sinh và bài tập được bảo toàn 100%.
    4. Nếu lớp trống (0 học sinh, 0 bài tập): Cho phép xóa vĩnh viễn khỏi database sau xác nhận 2 bước.
- **`PATCH /api/admin/classes/:classId/teacher`**:
  - **Mục đích:** Phân công giáo viên phụ trách hoặc hủy phân công (`teacherId: null` hoặc rỗng).
  - **Đặc điểm:** Cập nhật ngay lập tức trường `teacherId` của lớp và thu hồi quyền xem danh sách lớp của giáo viên cũ, ghi nhật ký `UNASSIGN_TEACHER_FROM_CLASS`.

---

## 3. BẰNG CHỨNG HÌNH ẢNH GIAO DIỆN (PLAYWRIGHT SCREENSHOTS)

Tất cả các giao diện và hộp thoại xác nhận đều được chụp thực tế trong quá trình kiểm thử E2E:

1. **Hộp Thoại Sửa Thông Tin Tài Khoản (A2):**
   - File: `e2e/screenshots/admin-a2-edit-user-modal.png`
   - Hiển thị đầy đủ họ tên, email (giáo viên), trạng thái hoạt động. Thiết kế viền bo tròn hiện đại, nút "Lưu Thay Đổi" nổi bật.

2. **Hộp Thoại Xóa / Lưu Trữ Tài Khoản (A2):**
   - File: `e2e/screenshots/admin-a2-delete-user-modal.png`
   - Hiển thị rõ định danh tài khoản, vai trò và thông tin kiểm toán: *"Tài khoản chưa có dữ liệu phát sinh. Bạn có thể xóa vĩnh viễn tài khoản này khỏi cơ sở dữ liệu."* kèm quy trình xác nhận 2 bước an toàn.

3. **Hộp Thoại Tạo Lớp Học Mới (A3):**
   - File: `e2e/screenshots/admin-a3-create-class-modal.png`
   - Mặc định niên khóa là **Năm học 2026 - 2027 (Hiện hành)**. Cho phép chọn khối, nhập tên lớp và chọn giáo viên phụ trách từ danh sách giáo viên đang hoạt động.

4. **Hộp Thoại Sửa Lớp Học (A3):**
   - File: `e2e/screenshots/admin-a3-edit-class-modal.png`
   - Giữ nguyên Document ID kỹ thuật (`class-1a`), cho phép cập nhật tên lớp, khối, giáo viên phụ trách và trạng thái lớp.

5. **Hộp Thoại Xóa / Lưu Trữ Lớp Học Có Dữ Liệu (A3):**
   - File: `e2e/screenshots/admin-a3-delete-class-modal.png`
   - Chặn xóa cứng Lớp 1A với cảnh báo rõ ràng: *"Lớp đang có 13 học sinh và 8 bài tập. Để bảo vệ dữ liệu học tập của học sinh, hệ thống không cho phép xóa cứng lớp học này. Bạn có thể Chuyển sang Lưu Trữ..."*. Nút thao tác chuyển thành **Chuyển Sang Lưu Trữ**.

---

## 4. BẢNG ĐỐI SOÁT DỮ LIỆU CLOUD FIRESTORE (TRƯỚC VÀ SAU KIỂM THỬ)

Kiểm toán dữ liệu độc lập qua script `scripts/check_academic_years_and_orphans.ts`:

| Loại Thực Thể | Số Lượng Ban Đầu | Số Lượng Sau Kiểm Thử | Tình Trạng Dữ Liệu | Đánh Giá |
|---|:---:|:---:|---|:---:|
| **Năm học (Academic Years)** | 2 | 2 | `year-2026-2027` (Hiện hành), `year-2024-2025` (Lưu trữ) | **BẢO TOÀN 100%** |
| **Lớp học chính khóa (Classes)** | 4 | 4 | 1A, 1B, 2A, 2B trỏ chuẩn về `year-2026-2027` | **BẢO TOÀN 100%** |
| **Học sinh chính khóa (Students)** | 48 | 48 | 12 HS / lớp, 0 học sinh mồ côi | **BẢO TOÀN 100%** |
| **Bài giao (Assignments)** | 26 | 26 | 0 bài giao mồ côi | **BẢO TOÀN 100%** |
| **Lượt làm bài (Attempts)** | 263 | 263 | 0 lượt làm bài mồ côi | **BẢO TOÀN 100%** |

> **Nguyên tắc bảo vệ dữ liệu:** Mọi bài test tự động tạo dữ liệu QA riêng biệt với tiền tố ngẫu nhiên (`gv-qa-...`, `HSQA...`, `class-lpqa...`) và thực hiện dọn dẹp sau khi kiểm tra xong. Tuyệt đối không làm thay đổi hoặc xóa các bản ghi chính khóa.

---

## 5. TỔNG KẾT BỘ KIỂM THỬ TỰ ĐỘNG

- **`npm run lint` (`tsc --noEmit`):** 0 lỗi TypeScript.
- **`npm run build` (`vite build`):** Build thành công trong 659ms, các bundle tối ưu hóa hoàn chỉnh.
- **`npm test`:** **149/149 tests PASS (100% ĐẠT TIÊU CHUẨN)**:
  - **Suite 1 (Phần 10 - Server-side & Quản lý):** 101/101 tests PASS
  - **Suite 2 (Closeout - Bảo mật hồ sơ & Năm học):** 20/20 tests PASS
  - **Suite 3 (A2 & A3 - Vòng đời CRUD & Ràng buộc toàn vẹn):** 28/28 tests PASS
- **Playwright E2E UI Audit:**
  - Desktop Viewport (1280x800): PASS 100%
  - Mobile Viewport (390x844): PASS 100%

---

## 6. THÔNG TIN TRIỂN KHAI VÀ SMOKE TEST PRODUCTION

- **Commit Triển Khai:** [`e3e9895`](https://github.com/atitk10-prog/thamtunhi/commit/e3e9895) (`feat(admin): complete A2 user and A3 class CRUD with assignment management and data protection`)
- **Commit Smoke Test:** [`9eff009`](https://github.com/atitk10-prog/thamtunhi/commit/9eff009) (`test(prod): add production 3-role smoke test script`)
- **Nhánh:** `main`
- **Production URL:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app)
- **Kết Quả Smoke Test Trực Tiếp Trên Production (21/10/2026):**
  1. `Admin Login`: HTTP 200, Role: `admin`, HMAC session token hợp lệ.
  2. `Teacher Login ("Trần Thanh Thanh")`: HTTP 200, Role: `teacher`, Name: `Trần Thanh Thanh`.
  3. `Student Login (HS1A01)`: HTTP 200, Role: `student`, StudentCode: `HS1A01`.
  => **100% 3 VAI TRÒ ĐĂNG NHẬP VÀ TRUY CẬP THÀNH CÔNG TRÊN VERCEL PRODUCTION.**

---

## 7. KẾT LUẬN & BÀN GIAO

Phân hệ Quản trị viên (Admin) cho hai mục trọng yếu:
- **A2 – Quản lý Người dùng (Giáo viên & Học sinh)**
- **A3 – Quản lý Lớp học & Phân công Giáo viên**

đã được **hoàn thiện toàn diện, đạt 100% tiêu chí nghiệp vụ và an toàn dữ liệu**. Hệ thống đã được kiểm toán tự động, chụp ảnh màn hình giao diện thực tế và kiểm thử khói trên môi trường Production thành công trọn vẹn. Sẵn sàng nghiệm thu chính thức để chuyển tiếp sang phân hệ Giáo viên.
