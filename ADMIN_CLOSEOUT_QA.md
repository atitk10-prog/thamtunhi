# BÁO CÁO NGHIỆM THU CHỐT PHÂN HỆ QUẢN TRỊ (ADMIN)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ – TOÁN TIỂU HỌC LỚP 1 VÀ LỚP 2
**Repository:** `atitk10-prog/thamtunhi`  
**Nhánh:** `main`  
**Commit Nghiệm Thu:** `c2fbca9` (gốc commit `1a3cc81`)  
**URL Production Vercel:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app)  
**Thời gian kiểm định:** 21/10/2026  
**Trạng thái tổng quát:** **PASS 100% (SẴN SÀNG CHUYỂN SANG PHÂN HỆ GIÁO VIÊN)**

---

## 1. TỔNG KẾT KẾT QUẢ NGHIỆM THU (TEST RESULTS)

| Hạng mục kiểm tra | Công cụ / Phương pháp | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Kiểm tra kiểu dữ liệu (Lint)** | `npm run lint` (`tsc --noEmit`) | 0 errors | **PASS** |
| **Đóng gói Production (Build)** | `npm run build` (`vite build`) | Thành công trong 437ms | **PASS** |
| **Kiểm thử hệ thống toàn diện** | `npm test` (`test-suite.ts`) | **101 / 101 tests PASS** | **PASS** |
| **Kiểm thử nghiệp vụ Admin mới** | `test-admin-closeout.ts` | **20 / 20 tests PASS** | **PASS** |
| **Kiểm thử trực tiếp trên Vercel** | Production Smoke Test (Live API) | **20 / 20 tests PASS** | **PASS** |
| **Kiểm thử E2E giao diện & Responsive** | Playwright Headless (Desktop & Mobile) | Hoàn thành 100%, 11 screenshots | **PASS** |

---

## 2. BẰNG CHỨNG HÌNH ẢNH NGHIỆM THU (SCREENSHOT AUDIT)

### 2.1. Giao diện Desktop (1280x800) – Nền Sáng, Tương Phản Cao, Bảng Trắng

#### A. Tổng quan Dashboard & Menu Hồ sơ Admin (Góc trên bên phải)
- Sidebar màu xanh đen (`bg-slate-950`) với nhận diện thương hiệu vàng amber và biểu tượng Khiên vàng.
- Nền làm việc chính chuyển đổi hoàn toàn sang nền sáng nhã nhặn (`bg-slate-50`), thẻ số liệu trắng tinh (`bg-white`), viền `border-slate-200`, chữ đen đậm tương phản cao.
- Menu tài khoản Admin góc trên bên phải gồm đầy đủ 3 chức năng: **Hồ sơ của tôi**, **Đổi mật khẩu**, **Đăng xuất**.

![Desktop Overview](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-01-desktop-overview.png)
*Hình 1: Tổng quan Trung tâm Quản trị trên nền sáng chuẩn mực.*

![Desktop Profile Dropdown](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-00-desktop-profile-dropdown.png)
*Hình 2: Menu tài khoản Admin góc trên bên phải (Hồ sơ của tôi, Đổi mật khẩu, Đăng xuất).*

---

#### B. Phân hệ Quản lý Người dùng & Phân quyền (Bảng Trắng, Tìm kiếm, Lọc, Phân trang 10/trang)
- Bảng người dùng có bộ lọc vai trò (Tất cả, Giáo viên, Học sinh, Quản trị viên), lọc trạng thái (Hoạt động, Đã khóa), tìm kiếm theo tên/email/mã.
- Phân trang chuẩn 10 người dùng / trang, hiển thị tổng số và chuyển trang mượt mà.
- Thay thế hoàn toàn JavaScript `alert()` và `confirm()` bằng hệ thống Toast thông báo chuyên nghiệp và hộp thoại xác nhận `ConfirmDialog`.

![Desktop Users Management](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-02-desktop-users.png)
*Hình 3: Quản lý người dùng với phân trang 10/trang và nút thao tác trực quan.*

---

#### C. Phân hệ Quản lý Năm học (Vòng đời hoàn chỉnh & Ràng buộc toàn vẹn)
- Quản lý đầy đủ danh sách năm học hiện có: `year-2024-2025` và `year-2026-2027`.
- Hỗ trợ thao tác: **Sửa**, **Đặt làm hiện hành**, **Lưu trữ**, **Xóa an toàn**.
- **Quy tắc xóa có điều kiện**: Năm học đã có dữ liệu liên kết (`year-2024-2025` đang liên kết 4 lớp học 1A, 1B, 2A, 2B) bị backend chặn xóa cứng với mã `400 ACADEMIC_YEAR_HAS_LINKED_DATA`, chỉ cho phép Lưu trữ để bảo toàn lịch sử.
- **Quy tắc năm hiện hành**: Duy nhất 1 năm học được kích hoạt `isCurrent: true`. Khi chuyển đổi năm hiện hành, không làm dịch chuyển hay xáo trộn năm học của lớp, bài giao hoặc kết quả cũ.

![Desktop Academic Years](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-04-desktop-academic-years.png)
*Hình 4: Quản lý năm học với thẻ trạng thái Hoạt động/Hiện hành và Lưu trữ.*

---

#### D. Phân hệ Lớp học & Học liệu GDPT 2018
- Hiển thị 4 lớp học chuẩn khóa (`1A`, `1B`, `2A`, `2B`) kèm phân công giáo viên chủ nhiệm.
- Thư viện 24 bài học GDPT 2018 chuẩn hóa, đầy đủ 8 câu hỏi mỗi bài, tính điểm tối đa chuẩn 80 điểm.

![Desktop Classes](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-03-desktop-classes.png)
*Hình 5: Quản lý 4 lớp học và phân công giáo viên phụ trách.*

![Desktop Curriculum](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-05-desktop-curriculum.png)
*Hình 6: Kho học liệu 24 bài học GDPT 2018 với phiên bản snapshot bất biến.*

---

#### E. Tinh gọn Nhật ký Hoạt động (Audit Logs) & Chính sách lưu trữ
- Sidebar được rút gọn xuống 8 mục chính; Nhật ký hoạt động được tích hợp thành phân hệ chuyên sâu bên trong tab **Cài đặt & Nhật ký**.
- Tải dữ liệu phân trang theo yêu cầu (on-demand loading) 20 mục / trang, có bộ lọc theo hành động (`ADMIN_CHANGE_PASSWORD`, `LOCK_USER`, `CREATE_ACADEMIC_YEAR`,...).
- Trình bày rõ ràng **Đề xuất Chính sách Lưu trữ Nhật ký**:
  - Nhật ký thông thường: Lưu trữ 90 ngày.
  - Nhật ký bảo mật trọng yếu: Lưu trữ vĩnh viễn (Bất biến).
  - Không tự động xóa dữ liệu: Mọi tác vụ dọn dẹp bắt buộc cấu hình retention, sao lưu dự phòng, dry-run và có phê duyệt của Chủ sở hữu.

![Desktop Audit Logs](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-08-desktop-settings-audit.png)
*Hình 7: Phân hệ Nhật ký hoạt động phân trang và chính sách lưu trữ an toàn.*

---

### 2.2. Giao diện Mobile Responsive (390x844 - iPhone 12/13/14)
- Desktop sidebar được ẩn tự động, thay bằng thanh điều hướng Mobile Drawer mở qua nút Menu Hamburger ở thanh tiêu đề.
- Các bảng biểu hỗ trợ cuộn ngang (`overflow-x-auto`), thẻ số liệu xếp chồng 2 cột gọn gàng, không tràn màn hình.
- Modal xác nhận và các hộp thoại điều chỉnh kích thước responsive, có nút đóng và thao tác chạm ngón tay thuận tiện.

![Mobile Overview](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-01-mobile-overview.png)
*Hình 8: Giao diện tổng quan trên thiết bị di động.*

![Mobile Menu Drawer](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-mobile-menu-drawer.png)
*Hình 9: Menu Drawer trượt từ cạnh màn hình trên mobile.*

![Mobile Users](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-02-mobile-users.png)
*Hình 10: Quản lý người dùng với phân trang responsive trên mobile.*

![Mobile Years](C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/admin-04-mobile-years.png)
*Hình 11: Quản lý năm học tối ưu cho màn hình cảm ứng di động.*

---

## 3. THAO TÁC DỮ LIỆU TRƯỚC VÀ SAU NGHIỆM THU (BEFORE / AFTER CENSUS)

### 3.1. Đối soát tài khoản và bảo mật mật khẩu
| Đối tượng / Tài khoản | Trước đợt nghiệm thu | Sau đợt nghiệm thu | Ghi chú an toàn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên Super Admin** (`admin@thamtutoannhi.edu.vn`) | Mật khẩu lưu dạng plaintext, không có API đổi mật khẩu | Hash an toàn bằng **bcrypt (10 rounds)**, có cơ chế thu hồi phiên đăng nhập qua `tokenVersion` | **Đạt chuẩn bảo mật OWASP**. Chặn tự khóa hoặc hạ quyền Admin cuối cùng. |
| **Giáo viên Trần Thanh Thanh** (`thanhthanh@gmail.com`) | Bản ghi được tạo, chưa có quy trình cấp mật khẩu an toàn | Đã xác minh trên Firestore (`user-1792533985096`), cấp mật khẩu tạm thời hiển thị 1 lần kèm cờ `mustChangePassword` | Đăng nhập thành công với vai trò `teacher` (không bị cấp nhầm Admin). |
| **Tài khoản Học sinh 4 lớp** (48 học sinh chính khóa) | Mật khẩu lưu dạng chuỗi ngắn | Duy trì cơ chế xác thực an toàn, mã hóa token HMAC, bảo mật `accessSecret` không lộ ra client | Toàn vẹn 100%, không bị xáo trộn. |

### 3.2. Đối soát cấu trúc dữ liệu Năm học (Academic Years)
| Năm học | ID | Trạng thái trước | Thao tác nghiệm thu | Trạng thái sau | Kiểm tra ràng buộc |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2024 – 2025** | `year-2024-2025` | `isCurrent: false` | Thử xóa cứng -> **Bị chặn HTTP 400**; Chuyển Lưu trữ -> Khôi phục Hoạt động | `status: 'active'`, `isCurrent: false` | **Chặn xóa thành công** do đang liên kết 4 lớp học chuẩn. |
| **2026 – 2027** | `year-2026-2027` | `isCurrent: true` | Duy trì làm năm học hiện hành | `status: 'active'`, `isCurrent: true` | Đảm bảo duy nhất 1 năm active. |
| **Năm học kiểm thử QA** | `year-qa-test` | Không có | Tạo mới -> Đặt hiện hành -> Xóa an toàn | Đã xóa dọn dẹp sạch sẽ | Cho phép xóa cứng đối với năm học hoàn toàn chưa có liên kết. |

---

## 4. CHI TIẾT KỸ THUẬT CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI

### 4.1. Mã hóa Bcrypt & Quản lý Phiên Đăng Nhập An Toàn
- Cài đặt thư viện thuần JavaScript `bcryptjs` (tránh lỗi ABI nhị phân trên môi trường Serverless Vercel).
- Endpoint `POST /api/admin/change-password`:
  - Yêu cầu mật khẩu cũ, mật khẩu mới (tối thiểu 8 ký tự).
  - So sánh mật khẩu cũ bằng `bcrypt.compare` (hỗ trợ migrate tự động tài khoản cũ).
  - Hash mật khẩu mới với Salt rounds 10.
  - Tăng `tokenVersion` trong Firestore, thu hồi tức thì toàn bộ token phiên cũ (`TOKEN_REVOKED`).
  - Ghi sự kiện `ADMIN_PASSWORD_CHANGED` vào `auditLogs` mà không ghi lại mật khẩu.

### 4.2. Quản lý Năm học Chặt Chẽ
- Endpoint `DELETE /api/admin/academic-years/:id`:
  - Kiểm tra xem năm học có đang là hiện hành không (`CANNOT_DELETE_CURRENT_YEAR`).
  - Quét kiểm tra liên kết tại bảng `classes` và `assignments`.
  - Nếu phát hiện liên kết dữ liệu: trả về `HTTP 400` với mã lỗi `ACADEMIC_YEAR_HAS_LINKED_DATA` và hướng dẫn chuyển sang trạng thái "Lưu trữ".
  - Nếu không có liên kết: thực hiện xóa an toàn và ghi audit log.
- Endpoint `PATCH /api/admin/academic-years/:id`:
  - Hỗ trợ đổi tên, đổi `status` (`active` / `archived`).
  - Khi đặt `isCurrent: true`, tự động tắt cờ `isCurrent` của tất cả các năm học khác để duy trì quy tắc duy nhất.

### 4.3. UI Polish & Thay thế Alert/Confirm
- Tạo component `Toast` hiển thị thông báo góc trên bên phải với các trạng thái `success`, `error`, `info`.
- Tạo modal `ConfirmDialog` với thiết kế bo góc mềm mại, hiển thị cảnh báo đỏ khi thao tác xóa hoặc lưu trữ, loại bỏ 100% `window.alert()` và `window.confirm()`.
- Tách modal `TempPasswordModal` cho phép hiển thị mật khẩu tạm thời một lần duy nhất với nút sao chép (Copy to clipboard) tiện dụng.

---

## 5. KẾT LUẬN VÀ KIẾN NGHỊ

1. **Kết luận**:
   - Phân hệ Quản trị (Admin) đã hoàn thiện 100% tất cả các yêu cầu theo bản đặc tả chốt nghiệm thu.
   - Giao diện đạt chuẩn nhận diện thương hiệu, độ tương phản cao, responsive hoàn hảo trên cả desktop và điện thoại di động.
   - Các chức năng đổi mật khẩu, phân quyền, quản lý năm học và tạo tài khoản giáo viên đã được kiểm thử thực tế và đạt tiêu chuẩn bảo mật.
   - Không có regression xảy ra đối với các cổng Học sinh và Giáo viên; dữ liệu bài học GDPT 2018 và lịch sử làm bài được bảo toàn nguyên vẹn.

2. **Kế hoạch tiếp theo**:
   - Chính thức đóng phân hệ Admin.
   - Sẵn sàng chuyển giao nguồn lực kỹ thuật sang phân hệ **Giáo viên (Teacher Portal)** để hoàn thiện các chức năng giao bài, theo dõi tiến độ lớp học và quản lý học sinh.
