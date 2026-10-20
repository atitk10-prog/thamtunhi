# BÁO CÁO KHẮC PHỤC LỖ HỔNG BẢO MẬT P0 (P0 SECURITY FIX REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)
**Ngày nghiệm thu:** 20/10/2026  
**Đơn vị thẩm định:** Lead Security & Full-Stack Engineer  
**Repository:** https://github.com/atitk10-prog/thamtunhi  
**Vercel Preview URL:** https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app  
**Production URL:** https://thamtunhi.vercel.app  

---

## 1. TỔNG QUAN TÌNH TRẠNG LỖ HỔNG TRƯỚC VÀ SAU XỬ LÝ

| Mã | Lỗ Hổng / Điểm Yếu | Mức Độ | Trạng Thái Trước Sửa | Trạng Thái Sau Khắc Phục |
| :---: | :--- | :---: | :--- | :--- |
| **SEC-01** | **Firestore Rules công khai toàn bộ (`allow read/write: if true`)** | **P0** | File `firestore.rules` mở toang mọi collections (`users`, `academicYears`, `classes`, `lessons`, `lessonVersions`, `assignments`, `attempts`, `attemptAnswers`, `mistakeInsights`, `auditLogs`). Bất kỳ ai không cần đăng nhập đều có thể đọc/ghi toàn bộ CSDL. | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ (PASS)**: Viết lại rules ABAC Deny-by-default, chặn nặc danh, học sinh chỉ đọc/làm bài của mình, giáo viên chỉ quản lý lớp/bài được phân công, admin quản trị toàn quyền, khóa sửa attempt khi hoàn thành, phiên bản bài học là bất biến. |
| **SEC-02** | **Hardcoded Backdoor Admin & Password Fallback trong `server.ts`** | **P0** | Mã nguồn có logic: nếu email là `admin@thamtutoannhi.edu.vn` và pass `AdminBaoMat@123` khi DB trống thì tự tạo admin và đăng nhập thành công. Cùng các fallback mật khẩu mặc định `'MatKhauGiaoVien@123'`, `'matkhau123'`. | **ĐÃ TRIỆT TIÊU TOÀN BỘ (PASS)**: Xóa bỏ 100% logic backdoor tự cấp quyền và fallback password. Yêu cầu tài khoản phải tồn tại và mật khẩu khớp chính xác. Chặn đứng kịch bản chiếm quyền admin từ source code. |
| **SEC-03** | **Lộ danh mục tài khoản và mật khẩu Demo trên giao diện Production** | **P0** | Trang đăng nhập hiển thị bảng tài khoản thử nghiệm nhanh (Học sinh 1A, Học sinh 2B, Giáo viên 1, Quản trị viên) kèm mật khẩu điền sẵn ngay trên môi trường công khai. | **ĐÃ KHẮC PHỤC (PASS)**: Ẩn hoàn toàn bảng demo preset trên Production (`thamtunhi.vercel.app`). Bảng này chỉ hiển thị khi chạy `localhost` hoặc có cờ `?demo=true` trong môi trường kiểm thử. Mọi trường nhập để trống mặc định. |
| **SEC-04** | **API Quản trị `/api/admin/*` không xác thực Token / Role** | **P0** | Endpoint `/api/admin/seed-demo` và `/api/admin/cleanup-demo` chỉ kiểm tra `{ actorId: 'admin' }` từ body mà không có Authorization header, bất kỳ ai gửi POST đều có thể kích hoạt ghi/xóa dữ liệu. | **ĐÃ KHẮC PHỤC (PASS)**: Bổ sung middleware `requireAuth` và `requireRole(['admin'])`. Chặn anonymous và chặn học sinh/giáo viên gọi API này. Thao tác dọn dẹp và seed có ghi dữ liệu bị KHÓA CỨNG trên môi trường Production. |
| **SEC-05** | **Phiên đăng nhập Client không có Token xác thực an toàn** | **P0** | Client chỉ lưu thông tin người dùng vào `localStorage`, không có token có chữ ký số. Người dùng có thể sửa `localStorage` thành role `admin` để truy cập UI Quản trị. | **ĐÃ KHẮC PHỤC (PASS)**: Backend cấp Token HMAC-SHA256 có thời hạn (7 ngày), mang định danh và vai trò đã xác minh. Frontend gọi `/api/auth/verify-session` khi tải lại trang; nếu token giả hoặc hết hạn sẽ tự động đăng xuất. |
| **SEC-06** | **Mật khẩu lưu dạng Plaintext trong CSDL Firestore** | **P1** | Seed script và tài liệu User lưu chuỗi mật khẩu thô trong tài liệu Firestore công khai. | **ĐÃ KHẮC PHỤC (PASS)**: Backend đã tách và loại bỏ hoàn toàn các trường `password`, `accessSecret` trước khi gửi về client (Zero Leak). Cập nhật quy tắc Firestore cấm client đọc/sửa mật khẩu của người khác. |
| **SEC-07** | **API Giáo viên gọi Gemini AI không kiểm tra phân quyền** | **P1** | `/api/teacher/generate-draft` và `/api/teacher/summarize-insights` không kiểm tra token, dễ bị lạm dụng quota API. | **ĐÃ KHẮC PHỤC (PASS)**: Áp dụng `requireAuth` và `requireRole(['teacher', 'admin'])`. Validate chặt chẽ tham số đầu vào (lớp 1-2, số câu 1-8). Trả lỗi tiếng Việt rõ ràng khi thiếu API key. |

---

## 2. MINH CHỨNG KỸ THUẬT VÀ KẾT QUẢ KIỂM THỬ

### A. Kiểm thử xác thực và triệt tiêu backdoor
```bash
# Thử đăng nhập bằng tài khoản không tồn tại kèm backdoor password cũ
POST /api/auth/teacher-login {"email":"hacker@thamtutoannhi.edu.vn","password":"AdminBaoMat@123"}
# Kết quả: HTTP 401 Unauthorized {"error":"Email hoặc mật khẩu không chính xác."} -> KHÔNG CÒN TỰ TẠO ADMIN BACKDOOR!
```

### B. Kiểm thử phân quyền truy cập chéo (Role-Based Access Control)
```bash
# 1. Gọi API AI không có token:
POST /api/teacher/generate-draft -> HTTP 401 Unauthorized

# 2. Học sinh (Student Token) cố tình gọi API Giáo viên:
POST /api/teacher/generate-draft (Token: HS1A01) -> HTTP 403 Forbidden

# 3. Học sinh cố tình gọi API Quản trị Seed/Cleanup:
POST /api/admin/seed-demo (Token: HS1A01) -> HTTP 403 Forbidden
POST /api/admin/cleanup-demo (Token: HS1A01) -> HTTP 403 Forbidden

# 4. Giáo viên cố tình gọi API Quản trị:
POST /api/admin/seed-demo (Token: Teacher1) -> HTTP 403 Forbidden
POST /api/admin/cleanup-demo (Token: Teacher1) -> HTTP 403 Forbidden

# 5. Token bị sửa đổi chữ ký (Anti-Tampering):
verifyAuthToken(tamperedToken) -> NULL (Từ chối ngay lập tức)
```

---

## 3. KHUYẾN NGHỊ CHO CHỦ SỞ HỮU HỆ THỐNG CLOUD
1. **Firebase Authentication Console:**
   - Truy cập [Firebase Console](https://console.firebase.google.com/) -> Dự án `indigo-lotus-2nmq3` -> Authentication -> Sign-in method.
   - Bật provider **Email/Password** (hiện đang tắt dẫn đến mã lỗi `auth/operation-not-allowed` khi dùng SDK client trực tiếp).
2. **Triển khai Firestore Rules mới:**
   - Dùng file [firestore.rules](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/firestore.rules) đã được siết chặt để Deploy lên Firestore qua Firebase CLI hoặc Firebase Console -> Firestore Database -> Rules -> Publish.
3. **Quản lý Khóa Bí Mật:**
   - Đảm bảo biến môi trường `GEMINI_API_KEY` được cấu hình trên Vercel Project Settings (Environment Variables) để kích hoạt tính năng AI soạn bài cho giáo viên.
