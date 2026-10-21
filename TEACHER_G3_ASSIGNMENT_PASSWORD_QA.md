# BÁO CÁO NGHIỆM THU P0: HOÀN THIỆN ĐỔI MẬT KHẨU & GIAO BÀI THẬT
**Dự án:** THÁM TỬ TOÁN NHÍ  
**Repository:** `atitk10-prog/thamtunhi`  
**Nhánh:** `main` (Commit: [`c2e7554`](https://github.com/atitk10-prog/thamtunhi/commit/c2e7554))  
**Production URL:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app/)  
**Trạng thái kiểm thử:** **100% PASS (0 FAIL, 0 BLOCKED)**

---

## 1. NGUYÊN NHÂN CHÍNH XÁC VÌ SAO DANH SÁCH BÀI GIAO BỊ TRỐNG HOẶC LỖI TRƯỚC ĐÂY

Qua rà soát toàn bộ chuỗi dữ liệu từ client (`TeacherPortal.tsx`, `ClassRosterView.tsx`, `AssignModal.tsx`, `StudentPortal.tsx`, `dataService.ts`) đến backend server (`server.ts`) và cơ sở dữ liệu Firestore, chúng tôi đã phát hiện và cô lập **4 nguyên nhân gốc rễ**:

1. **Lỗi gán cứng bài học đầu tiên (`lessons[0]`):**
   - Trong `TeacherPortal.tsx` (dòng 434–447 bản cũ), khi giáo viên bấm "Giao bài" từ thẻ lớp hoặc hàng học sinh trong danh sách, code truyền `lessons[0]` (Bài 1) làm bài mặc định bắt buộc thay vì cho phép giáo viên duyệt và chọn bài học phù hợp. Nếu kho bài học chưa nạp xong, `lessons[0]` bị `undefined`, dẫn đến việc mở modal bị lỗi hoặc không thể chọn bài khác.
2. **AssignModal cũ thiếu khả năng duyệt và tìm kiếm bài học:**
   - Phiên bản cũ của `AssignModal` chỉ nhận một `initialLesson` đơn lẻ và chỉ cho phép chọn lớp/học sinh, hoàn toàn không có danh mục học liệu để giáo viên tìm kiếm, lọc theo khối lớp (Khối 1 / Khối 2), xem trước số câu hỏi và kiểm tra trạng thái xuất bản (`isPublished`) trước khi giao.
3. **Lỗ hổng phân quyền ABAC và bộ lọc học sinh nhận bài:**
   - Endpoint `GET /api/student/assignments` và `fetchStudentAssignments` trước đây chỉ lọc theo `classId`, không kiểm tra trường `studentId` trong bản ghi bài giao. Do đó, khi giáo viên giao một bài bổ trợ riêng cho em A, em B trong cùng lớp cũng nhìn thấy hoặc ngược lại em A bị sót bài giao riêng nếu truy vấn phía client lọc sai.
4. **Fallback nguy hiểm `'class-1a'`:**
   - Cả client và server trước đây sử dụng fallback `'class-1a'` nếu học sinh bị thiếu thông tin lớp, dẫn đến hiện tượng học sinh lớp khác hoặc tài khoản lỗi cấu hình bị nạp nhầm bài tập của lớp 1A hoặc nhận danh sách trống rỗng mà không biết nguyên nhân.

---

## 2. NHỮNG FILE VÀ API ĐÃ SỬA VÀ NÂNG CẤP

| File / Component | Loại thay đổi | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| `server.ts` | **Backend Core** | • Thêm cơ chế Rate Limiting chống dò mật khẩu (`checkPasswordRateLimit`).<br>• Triển khai `POST /api/auth/change-password`: xác thực danh tính từ token JWT (không tin client `userId`), kiểm tra mật khẩu cũ, băm bằng **bcrypt** (cost 10), tăng `tokenVersion` để **thu hồi ngay lập tức toàn bộ phiên cũ**, chặn tài khoản Google OAuth tự đổi pass.<br>• Chuyển đổi trong suốt (transparent migration) mật khẩu cũ sang bcrypt hash khi đăng nhập thành công.<br>• Nâng cấp `GET /api/student/assignments`: thực thi nghiêm ngặt ABAC (`!a.studentId \|\| a.studentId === req.user.uid`), triệt tiêu fallback `class-1a`.<br>• Nâng cấp `POST /api/teacher/assignments`: kiểm tra giáo viên phụ trách lớp, bài đúng khối lớp, đã xuất bản, phiên bản có câu hỏi hợp lệ; cảnh báo trùng đợt giao (`409 ASSIGNMENT_DUPLICATE`) và sinh ID không trùng lặp khi giao lại có chủ đích (`allowReassign: true`).<br>• Băm bcrypt cho mật khẩu học sinh khi giáo viên tạo/đặt lại mã bí mật. |
| `src/types/index.ts` | **Types System** | Bổ sung `phone`, `authProvider`, `name` vào `UserProfile`, thêm `isPublished` vào `Lesson`. |
| `src/lib/authSession.ts` | **Client Session** | Triển khai hàm `changePassword(currentPassword, newPassword)` và `updateStoredUser(updates)`. |
| `src/lib/dataService.ts` | **Data Layer** | Nâng cấp `fetchStudentAssignments`, `saveAssignment` (bắt lỗi chi tiết và mã trùng lặp), thêm `updateTeacherProfile`. |
| `src/components/teacher/AssignModal.tsx` | **UI Component** | Tái thiết kế toàn diện: cho phép tìm kiếm, lọc theo khối, duyệt 24 bài học thật đã xuất bản, xem số câu hỏi (4/6/8 câu), xem trước nội dung, chọn lớp phụ trách hoặc khóa học sinh chỉ định, cảnh báo trùng đợt giao và checkbox giao lại đợt mới. |
| `src/components/teacher/TeacherAccountModal.tsx` | **UI Component Mới** | Tạo modal hồ sơ & đổi mật khẩu chuyên dụng cho Giáo viên: cập nhật họ tên/SĐT, đo độ mạnh mật khẩu (chữ hoa, chữ thường, số, >= 8 ký tự), thông báo bảo vệ đối với tài khoản Google. |
| `src/components/teacher/TeacherPortal.tsx` | **UI Component** | Thêm nút "Tài khoản & Đổi mật khẩu" trên thanh điều hướng; loại bỏ hoàn toàn `lessons[0]` khi mở giao bài từ lớp/học sinh; liên kết mượt mà với `AssignModal` và `TeacherAccountModal`. |
| `src/components/student/StudentPinModal.tsx` | **UI Component Mới** | Tạo modal đổi mã PIN bí mật thân thiện tiểu học với linh vật Thám tử Cáo: kiểm tra PIN 4–20 ký tự, nút bật/tắt ẩn hiện mật khẩu, tự động cập nhật phiên đăng nhập. |
| `src/components/student/StudentPortal.tsx` | **UI Component** | Thêm nút "Đổi mã PIN" trên header; loại bỏ hoàn toàn fallback `'class-1a'`; hiển thị giao diện chẩn đoán chi tiết khi danh sách bài tập trống kèm nút "Thử lại". |
| `scripts/test_g3_assignment_password.ts` | **Automated Suite** | Bộ kiểm thử tự động toàn diện 35 kịch bản kiểm tra từ chối, bảo mật bcrypt, ABAC, giao riêng, giao cả lớp, nộp bài và chống trùng lặp. |
| `e2e/test_teacher_g3_password_assign.ts` | **Playwright E2E** | Kịch bản Playwright E2E kiểm tra toàn bộ giao diện Desktop và Mobile cho cả Giáo viên và Học sinh, chụp ảnh minh chứng. |

---

## 3. KẾT QUẢ KIỂM THỬ ĐỔI MẬT KHẨU CẢ HAI VAI TRÒ (PHẦN A)

Bộ kiểm thử tự động `test_g3_assignment_password.ts` đã chạy thành công 100% trên cả môi trường Local và **Vercel Production**:

### 3.1 Giáo viên 1 (`giaovien1@thamtutoannhi.edu.vn`)
- **Đăng nhập ban đầu:** Thành công (`HTTP 200`).
- **Từ chối sai mật khẩu hiện tại:** Hệ thống trả về `401 Unauthorized`, ghi nhận số lần thử sai chống brute-force.
- **Từ chối mật khẩu không đủ độ phức tạp:** Hệ thống từ chối mật khẩu yếu (`400 Bad Request`).
- **Đổi mật khẩu mới:** Đổi sang mật khẩu mạnh hợp lệ thành công. Mật khẩu mới được băm bằng bcrypt, không ghi plaintext trong Firestore.
- **Thu hồi phiên cũ ngay lập tức:** Token phiên đăng nhập cũ bị từ chối với mã `TOKEN_REVOKED` (`401 Unauthorized`).
- **Xác minh đăng nhập lại:** Mật khẩu cũ bị từ chối (`401`). Mật khẩu mới đăng nhập thành công (`200`).
- **Khôi phục an toàn:** Khôi phục mật khẩu chuẩn của Giáo viên 1 sau kiểm thử (`MatKhauGiaoVien@123`).

### 3.2 Học sinh HS1A01 (`HS1A01`)
- **Đăng nhập ban đầu:** Thành công (`HTTP 200`).
- **Từ chối sai mã bí mật hiện tại:** `401 Unauthorized`.
- **Từ chối mã bí mật ngắn < 4 ký tự:** `400 Bad Request`.
- **Đổi mã bí mật mới:** Đổi thành công, lưu trữ dạng bcrypt hash `accessSecretHash`.
- **Thu hồi phiên cũ:** Phiên cũ bị chặn ngay lập tức (`TOKEN_REVOKED`).
- **Xác minh đăng nhập lại:** Mã bí mật cũ bị từ chối (`401`), mã bí mật mới đăng nhập thành công (`200`).
- **Khôi phục an toàn:** Khôi phục mã bí mật gốc (`matkhau123`).

### 3.3 Chặn tài khoản Google OAuth
- Tài khoản đăng nhập Google (`teacher.google@thamtutoannhi.edu.vn`) khi gọi đổi mật khẩu nội bộ bị chặn chính xác với mã lỗi: `GOOGLE_AUTH_ACCOUNT` (`400 Bad Request`).

---

## 4. KẾT QUẢ GIAO BÀI VÀ BẢO VỆ PHÂN QUYỀN ABAC (PHẦN B)

### 4.1 Kiểm tra các trường hợp từ chối vi phạm nghiệp vụ
- **Sai khối lớp:** Giáo viên giao bài Khối 2 vào lớp 1A $\rightarrow$ Backend từ chối `400 Bad Request` (`GRADE_MISMATCH`).
- **Sai phân công lớp:** Giáo viên 1 (phụ trách Lớp 1A, 1B) cố giao bài cho Lớp 2A $\rightarrow$ Backend từ chối `403 Forbidden`.
- **Phiên bản không tồn tại:** Giao bài với `lessonVersionId` ảo $\rightarrow$ Backend từ chối `404 Not Found`.
- **Học sinh không thuộc lớp:** Giao bài cho học sinh không nằm trong lớp được chọn $\rightarrow$ Backend từ chối `400 Bad Request`.

### 4.2 Giao bài 8 câu đã xuất bản riêng cho học sinh HS1A01
- Giáo viên chọn bài 8 câu "*[Toán 1] Các số từ 6 đến 10 và Tách - Gộp số*" (`lesson-g1-02`, phiên bản `version-lesson-g1-02-v1`) và giao riêng cho học sinh **An (HS1A01)**.
- **HS1A01 đăng nhập:** Nhận được bài giao riêng này ngay lập tức trong danh sách bài tập.
- **HS1A02 đăng nhập (Cùng lớp 1A):** **KHÔNG THẤY** bài giao riêng của HS1A01. Phân quyền ABAC bảo vệ tuyệt đối tính riêng tư giữa các học sinh.

### 4.3 Giao bài chung cho cả lớp 1A
- Giáo viên chọn bài "*[Toán 1] Phép cộng trong phạm vi 10*" (`lesson-g1-03`) giao cho toàn bộ lớp 1A.
- Cả **HS1A01** và **HS1A02** đều nhận được bài tập này trong danh mục bài luyện tập của mình.

### 4.4 Học sinh làm bài, nộp bài và Giáo viên xem kết quả
- Học sinh HS1A01 bắt đầu làm bài tập đã giao qua API `POST /api/student/attempts`.
- Học sinh hoàn thành và nộp bài, điểm số 80/80 được tính toán và lưu an toàn trên Firestore.
- Giáo viên 1 truy vấn danh sách kết quả qua `GET /api/student/attempts?studentId=student-hs1a01` và xác nhận chính xác bài làm đạt 80/80 điểm.

### 4.5 Cảnh báo trùng đợt giao & Giao lại có chủ đích
- Khi giáo viên giao lại cùng bài học cho lớp/học sinh mà không tick chọn giao lại: Backend phát hiện và trả về cảnh báo `409 ASSIGNMENT_DUPLICATE` kèm thông tin đợt bài cũ.
- Khi giáo viên chủ động tick chọn `allowReassign: true`: Hệ thống tạo đợt bài mới với ID độc lập không trùng lặp, bảo lưu nguyên vẹn kết quả và lịch sử làm bài cũ của học sinh.

---

## 5. HÌNH THỨC VÀ HÌNH ẢNH MINH CHỨNG THỰC TẾ (DESKTOP & MOBILE)

Tất cả ảnh minh chứng đã được Playwright E2E chụp thực tế:

- `g3-01-desktop-teacher-account-modal.png`: Modal Tài khoản & Đổi mật khẩu của Giáo viên trên máy tính để bàn.
- `g3-02-mobile-teacher-account-modal.png`: Modal Tài khoản của Giáo viên trên thiết bị di động (iPhone / 390x844).
- `g3-03-desktop-assign-modal-browse-lessons.png`: Giao diện duyệt bài học, chọn bài xuất bản kèm thông tin khối lớp.
- `g3-05-desktop-assign-modal-targeted-student.png`: Giao bài từ hàng học sinh - Khóa tự động học sinh và lớp học.
- `g3-06-desktop-student-portal-assignments.png`: Góc học tập học sinh HS1A01 nhận danh sách bài tập được giao.
- `g3-07-desktop-student-pin-modal.png`: Giao diện đổi mã PIN thân thiện tiểu học với linh vật Thám tử Cáo.
- `g3-08-mobile-student-assignments.png`: Giao diện bài tập học sinh trên thiết bị di động.
- `g3-09-mobile-student-pin-modal.png`: Giao diện đổi PIN học sinh responsive trên di động.
- `g3-10-desktop-student-hs1a02-abac-protected.png`: Học sinh HS1A02 không nhìn thấy bài giao riêng của HS1A01.

---

## 6. TỔNG KẾT BẢNG KIỂM TRA ĐẠT TIÊU CHUẨN (PASS/FAIL/BLOCKED)

| STT | Kịch bản kiểm thử | Môi trường Local | Môi trường Production | Kết quả |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Đăng nhập Giáo viên 1 & kiểm tra mật khẩu hiện tại | PASS | PASS | **PASS** |
| 2 | Từ chối đổi mật khẩu khi sai pass cũ hoặc không đủ độ mạnh | PASS | PASS | **PASS** |
| 3 | Đổi mật khẩu Giáo viên thành công & băm bcrypt | PASS | PASS | **PASS** |
| 4 | Thu hồi ngay lập tức toàn bộ phiên cũ của Giáo viên (`TOKEN_REVOKED`) | PASS | PASS | **PASS** |
| 5 | Đăng nhập Học sinh HS1A01 & kiểm tra PIN hiện tại | PASS | PASS | **PASS** |
| 6 | Đổi mã PIN Học sinh thành công & thu hồi phiên cũ | PASS | PASS | **PASS** |
| 7 | Chặn tài khoản Google OAuth tự đổi mật khẩu nội bộ | PASS | PASS | **PASS** |
| 8 | Từ chối giao sai khối lớp (`GRADE_MISMATCH`) | PASS | PASS | **PASS** |
| 9 | Từ chối giáo viên không được phân công lớp (`403 Forbidden`) | PASS | PASS | **PASS** |
| 10 | Từ chối giao phiên bản bài học không có thật (`404 Not Found`) | PASS | PASS | **PASS** |
| 11 | Từ chối giao bài cho học sinh không thuộc lớp (`400 Bad Request`) | PASS | PASS | **PASS** |
| 12 | Giáo viên giao bài 8 câu xuất bản riêng cho HS1A01 thành công | PASS | PASS | **PASS** |
| 13 | HS1A01 nhận đúng bài giao riêng | PASS | PASS | **PASS** |
| 14 | HS1A02 KHÔNG THẤY bài giao riêng của HS1A01 (ABAC an toàn) | PASS | PASS | **PASS** |
| 15 | Giao bài chung cho cả lớp 1A: cả HS1A01 và HS1A02 đều nhận | PASS | PASS | **PASS** |
| 16 | Học sinh bắt đầu làm bài, nộp bài, điểm 80/80 được lưu chuẩn | PASS | PASS | **PASS** |
| 17 | Giáo viên xem đúng kết quả bài làm và điểm số của học sinh | PASS | PASS | **PASS** |
| 18 | Cảnh báo trùng đợt giao bài (`409 ASSIGNMENT_DUPLICATE`) | PASS | PASS | **PASS** |
| 19 | Giao lại có chủ đích sinh ID mới, không ghi đè lịch sử cũ | PASS | PASS | **PASS** |
| 20 | Kiểm thử hồi quy hệ thống cũ (`test-suite.ts`: 101/101 test) | PASS | PASS | **PASS** |
| 21 | Kiểm thử hồi quy Admin Closeout (`test-admin-closeout.ts`: 20/20 test) | PASS | PASS | **PASS** |
| 22 | Kiểm thử hồi quy Người dùng & Lớp (`test-admin-a2-a3.ts`: 28/28 test) | PASS | PASS | **PASS** |
| 23 | Playwright E2E Desktop & Mobile (`test_teacher_g3_password_assign.ts`) | PASS | PASS | **PASS** |
| 24 | TypeScript Typecheck (`tsc --noEmit`) | 0 Lỗi | 0 Lỗi | **PASS** |
| 25 | Vite Production Build (`vite build`) | Thành công | Thành công | **PASS** |

**Tổng số test tự động thực thi:** **184/184 TESTS PASS (100% ĐẠT TIÊU CHUẨN)**

---

## 7. CAM KẾT BẢO LƯU VÀ BẢN QUYỀN HỆ THỐNG

1. **Chức năng Gemini AI:** Giữ nguyên 100% mã nguồn Gemini sinh bài nháp và phân tích lỗi, không can thiệp hay sửa đổi bất kỳ logic nào đã được xác nhận ở G2.
2. **Tính toàn vẹn dữ liệu:** Không làm thay đổi mật khẩu gốc của tài khoản chính thức hoặc học sinh thật. Toàn bộ mật khẩu thử nghiệm đều được khôi phục an toàn ngay sau khi test.
3. **Môi trường triển khai:** Code đã được merge vào `main` tại commit [`c2e7554`](https://github.com/atitk10-prog/thamtunhi/commit/c2e7554) và triển khai tự động lên Vercel Production tại [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app/).
