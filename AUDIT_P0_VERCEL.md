# BÁO CÁO KIỂM TOÁN LỖ HỔNG P0 & SỰ CỐ VERCEL RUNTIME (AUDIT P0 & VERCEL REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)
**Ngày kiểm toán:** 20/10/2026  
**Repository:** https://github.com/atitk10-prog/thamtunhi  
**Production URL:** https://thamtunhi.vercel.app  

---

## 1. TỔNG QUAN TÌNH TRẠNG HỆ THỐNG BAN ĐẦU
- **Mặt hiển thị (Frontend):** Ứng dụng đã render giao diện đăng nhập trên Vercel.
- **Hoạt động thực tế (API/Auth/Firestore/AI):** **HOÀN TOÀN TÊ LIỆT ONLINE**.
  - Toàn bộ các API `/api/*` trả về `HTTP 404 NOT FOUND` từ Vercel Edge Server (`X-Vercel-Error: NOT_FOUND`), do ứng dụng được deploy dưới dạng Vite SPA tĩnh mà không có Vercel Functions hay cấu hình routing API.
  - Khi học sinh hoặc giáo viên bấm nút đăng nhập, trình duyệt gọi `/api/auth/*` nhận 404 HTML/text, dẫn đến `SyntaxError: Unexpected token 'T', "The page c"... is not valid JSON` và báo lỗi "Lỗi kết nối máy chủ xác thực.".
  - Quy tắc bảo mật `firestore.rules` đang để mở `allow read, write: if true` cho toàn bộ 10 collections (trái ngược hoàn toàn với báo cáo lý thuyết trong `SECURITY_AUDIT.md` và `CLOUD_ENV_REPORT.md`).
  - Mã nguồn `server.ts` chứa tài khoản backdoor `admin@thamtutoannhi.edu.vn` với mật khẩu hardcoded `AdminBaoMat@123` tự cấp quyền Admin trong cơ sở dữ liệu.
  - Các endpoint `/api/admin/seed-demo` và `/api/admin/cleanup-demo` không có kiểm tra Authorization Bearer token, có thể bị gọi nặc danh từ bên ngoài.

---

## 2. BẢNG 10 LỖI VÀ ĐIỂM RỦI RO ƯU TIÊN CAO NHẤT

| STT | Vấn Đề | File : Line | Cách Tái Hiện | Tác Động Thực Tế | Mức Độ | Phương Án Sửa Chữa | Trạng Thái / Bằng Chứng |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | **Firestore Rules công khai toàn bộ (`allow read/write: if true`)** | `firestore.rules:29-96` | Gửi request đọc/ghi từ client chưa xác thực tới bất kỳ collection nào (`users`, `attempts`, `lessons`,...). | Bất kỳ ai trên Internet đều có thể đọc dữ liệu học sinh, lộ thông tin cá nhân, sửa điểm, tự nâng lên Admin, xóa dữ liệu. | **P0** | Viết lại rules ABAC Deny-by-default nghiêm ngặt: chỉ Admin quản lý user/năm học, GV chỉ quản lý lớp/bài của mình, HS chỉ đọc bài được giao và làm bài của mình, khóa sửa attempt completed. | **ĐÃ PHÁT HIỆN** (Xem file `firestore.rules`) |
| **02** | **Vercel triển khai thiếu API backend (Toàn bộ `/api/*` bị 404 NOT FOUND)** | `package.json:8`, Vercel deploy | `curl.exe -i https://thamtunhi.vercel.app/api/health` hoặc bấm Đăng nhập trên web. | Người dùng không thể đăng nhập, không thể gọi AI, không kiểm tra được health check. Frontend báo lỗi kết nối. | **P0** | Xây dựng entrypoint Vercel Serverless Function `api/index.ts` xuất Express app, cấu hình `vercel.json` định tuyến `/api/(.*)` sang Function và SPA fallback cho các route còn lại. | **ĐÃ XÁC NHẬN** (`curl` trả 404 NOT_FOUND, video browser test lưu tại artifacts) |
| **03** | **Hardcoded Admin Backdoor & Mật Khẩu Fallback trong server.ts** | `server.ts:111-123`, `server.ts:80,129` | Đăng nhập bằng `admin@thamtutoannhi.edu.vn` với pass `AdminBaoMat@123` khi DB trống. | Tự động tạo và cấp quyền Admin cho tài khoản có sẵn trong mã nguồn. Bất kỳ ai đọc repo đều chiếm quyền quản trị. | **P0** | Loại bỏ hoàn toàn khối mã backdoor fallback trong `server.ts`. Sử dụng Firebase Auth có trạng thái, không hardcode credentials trong source code. | **ĐÃ PHÁT HIỆN** (Code `server.ts:111-123`) |
| **04** | **Lộ danh sách tài khoản và mật khẩu Demo trên giao diện Production** | `src/components/auth/AuthPortal.tsx:358-396` | Mở https://thamtunhi.vercel.app, xem mục "Tài Khoản Thử Nghiệm Nhanh". | Bất kỳ người ngoài nào cũng thấy mã học sinh và mật khẩu được điền sẵn, vi phạm bảo mật môi trường sản xuất. | **P0** | Ẩn khối demo presets trên môi trường Production; chỉ hiển thị trong sandbox kiểm thử riêng biệt có cờ kiểm soát. | **ĐÃ PHÁT HIỆN** (Render thực tế trên web) |
| **05** | **Endpoint Quản Trị `/api/admin/*` không xác thực Token / Role** | `server.ts:250-251`, `server.ts:520-522` | Gửi HTTP POST tới `/api/admin/cleanup-demo` với body `{}`. | Bất kỳ ai cũng có thể xóa sạch dữ liệu bảng `attempts`, `mistakeInsights`, hoặc kích hoạt ghi dữ liệu ngoài tầm kiểm soát. | **P0** | Bổ sung middleware xác minh Firebase ID Token, kiểm tra quyền Admin từ token, khóa cứng thao tác xóa trên Production, yêu cầu dry-run explicit. | **ĐÃ PHÁT HIỆN** (Code `server.ts:250,520`) |
| **06** | **Xác thực Client chỉ lưu localStorage, không có phiên Firebase Auth thực** | `src/components/auth/AuthPortal.tsx:75,108`, `src/App.tsx:11-17,30-36` | Đăng nhập học sinh hoặc giáo viên, kiểm tra `auth.currentUser`. | `auth.currentUser` là `null`. Khi bật Security Rules chuẩn, toàn bộ client Firestore SDK sẽ bị `PERMISSION_DENIED` vì `request.auth == null`. Sửa localStorage có thể mạo danh role Admin ở client. | **P0** | Triển khai xác thực Firebase Auth thực tế (Email/Password hoặc Custom Token cho Học sinh) để client mang token hợp lệ tương tác với Cloud Firestore theo đúng Security Rules. | **ĐÃ PHÁT HIỆN** (Client không gọi `signInWithCredential`/`signInWithCustomToken`) |
| **07** | **API Giáo Viên gọi AI Gemini không kiểm tra xác thực và hạn mức** | `server.ts:144-246` | Gửi HTTP POST tới `/api/teacher/generate-draft` không kèm token. | Bất kỳ ai cũng có thể lạm dụng làm cạn kiệt Quota và chi phí API Gemini; không validate kỹ payload đầu vào. | **P1** | Thêm xác thực giáo viên/admin, validate giới hạn số câu (tối đa 10 câu), bắt lỗi API rõ ràng bằng tiếng Việt. | **ĐÃ PHÁT HIỆN** (Endpoint công khai không guard) |
| **08** | **Mặt nạ che giấu lỗi trong AdminPortal và tài liệu báo cáo không đúng thực tế** | `src/components/admin/AdminPortal.tsx:120-137`, `SECURITY_AUDIT.md:8-16` | Gọi `/api/health` lỗi 404, AdminPortal tự gán `status: 'healthy'`, `authConnected: true`. | Gây hiểu nhầm hệ thống hoạt động tốt trong khi toàn bộ API backend đang chết; tài liệu báo cáo ABAC đã pass trong khi rules mở toang. | **P1** | Sửa `AdminPortal` hiển thị trung thực lỗi kết nối; đồng bộ tài liệu báo cáo đúng với thực tế mã nguồn sau khi sửa. | **ĐÃ PHÁT HIỆN** (Code `AdminPortal.tsx:120-137`) |
| **09** | **Lưu trữ mật khẩu dạng Plaintext trong cơ sở dữ liệu Firestore** | `seed-firestore.ts:47,90`, `server.ts:309,352` | Đọc tài liệu `/users/{id}` trong Firestore. | Các trường `password` và `accessSecret` bị lưu chuỗi rõ trong cơ sở dữ liệu, vi phạm nguyên tắc bảo mật thông tin người dùng. | **P1** | Loại bỏ lưu mật khẩu plaintext trong Firestore document; chuyển sang xác thực Firebase Auth hoặc lưu trữ mã băm an toàn trên server. | **ĐÃ PHÁT HIỆN** (Tài liệu User lưu `accessSecret`, `password`) |
| **10** | **Cấu hình Root Directory và định tuyến Vercel Serverless Function** | Root repository & `package.json` | Triển khai trực tiếp từ root repo bị lồng 2 thư mục `thamtunhi-main`. | Vercel không tìm thấy file cấu hình hoặc build sai thư mục dẫn đến lỗi triển khai. | **P1** | Chuẩn hóa cấu hình `vercel.json`, tài liệu hóa `VERCEL_DEPLOY_CHECKLIST.md` chỉ dẫn Root Directory chính xác cho Vercel. | **ĐÃ PHÁT HIỆN** (Cấu trúc thư mục zip lồng nhau) |

---

## 3. BẰNG CHỨNG THỰC TẾ TRÊN MÔI TRƯỜNG PRODUCTION (https://thamtunhi.vercel.app)

1. **Kiểm tra `/api/health`:**
   ```bash
   curl.exe -i https://thamtunhi.vercel.app/api/health
   # Kết quả:
   HTTP/1.1 404 Not Found
   Server: Vercel
   X-Vercel-Error: NOT_FOUND
   Content-Type: text/plain; charset=utf-8
   The page could not be found NOT_FOUND
   ```

2. **Kiểm tra đăng nhập thực tế trên trình duyệt:**
   - URL: `https://thamtunhi.vercel.app`
   - Hành vi: Chọn học sinh `HS1A01`, click "Vào Phá Án Toán Học".
   - Console: `SyntaxError: Unexpected token 'T', "The page c"... is not valid JSON`
   - Giao diện: Hiển thị thanh cảnh báo đỏ: `Lỗi kết nối máy chủ xác thực.`
   - Video minh chứng đã ghi lại trong thư mục artifacts.

---
**Kết luận:** Cần khắc phục dứt điểm theo đúng thứ tự ưu tiên: Backup mã nguồn -> Sửa Firestore Rules chuẩn ABAC -> Sửa cấu trúc Vercel Serverless & Express -> Sửa cơ chế Firebase Auth -> Chạy lại kiểm thử tự động.
