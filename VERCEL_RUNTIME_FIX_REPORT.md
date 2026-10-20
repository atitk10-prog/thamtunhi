# BÁO CÁO KHẮC PHỤC SỰ CỐ VERCEL RUNTIME & ROUTING (VERCEL RUNTIME FIX REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ
**Ngày nghiệm thu:** 20/10/2026  
**Vercel Production:** https://thamtunhi.vercel.app  
**Vercel Preview Đã Nghiệm Thu:** https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app  

---

## 1. NGUYÊN NHÂN GỐC CỦA SỰ CỐ "GIAO DIỆN HIỂN THỊ NHƯNG CHỨC NĂNG CHẾT"

1. **Vercel Build Thiếu Serverless Backend Functions:**
   - Dự án được cấu hình bằng `vite build`, xuất ra thư mục tĩnh `dist`.
   - File `server.ts` chứa Express app không được Vercel tự động nhận diện hay thực thi nếu không có tệp cấu hình serverless function hoặc `vercel.json`.
   - Kết quả: Toàn bộ request tới `/api/health`, `/api/auth/student-login`, `/api/auth/teacher-login` đều bị Vercel Edge Server trả về `HTTP 404 Not Found` dạng văn bản `"The page could not be found NOT_FOUND"`.
   - Khi frontend gọi `fetch('/api/auth/...').then(r => r.json())`, trình duyệt gặp lỗi phân tích JSON cú pháp:
     `SyntaxError: Unexpected token 'T', "The page c"... is not valid JSON`
     khiến toàn bộ các chức năng online hoàn toàn tê liệt.

2. **Lỗi Node.js 24 ESM Import Attribute trên Vercel Serverless Function:**
   - Khi chuyển đổi Express sang Vercel Function trên môi trường runtime `Node.js 24.x`, cú pháp nhập JSON chuẩn ESM:
     `import firebaseConfig from './firebase-applet-config.json';`
     bị Node.js 24 chặn lại với lỗi:
     `TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]: Module needs an import attribute of "type: json"`
     dẫn đến lỗi `FUNCTION_INVOCATION_FAILED`.

3. **Cấu Trúc Thư Mục Lồng Nhau:**
   - Archive ban đầu chứa 2 cấp thư mục: `thamtunhi-main/thamtunhi-main`. Khi kéo cài đặt tự động dễ làm sai lệch Root Directory của Vercel Project.

---

## 2. GIẢI PHÁP ĐÃ THỰC THI & HOÀN THÀNH

1. **Xây Dựng Cấu Hình Định Tuyến `vercel.json` Chuẩn:**
   - Tạo file `vercel.json` thiết lập định tuyến ưu tiên:
     ```json
     {
       "$schema": "https://openapi.vercel.sh/vercel.json",
       "version": 2,
       "rewrites": [
         { "source": "/api/(.*)", "destination": "/api/index" },
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
   - Định tuyến `/api/*` trực tiếp vào Serverless Function `api/index.ts`.
   - Định tuyến fallback các route SPA về `index.html` (chống lỗi 404 khi người dùng F5 hoặc truy cập link sâu).

2. **Xây Dựng Entrypoint Serverless Function `api/index.ts`:**
   - Xuất Express app để Vercel Node runtime xử lý request một cách tối ưu, hỗ trợ Serverless Cold Start nhanh chóng.

3. **Tương Thích Đa Phiên Bản Node.js (Node 18 -> 24):**
   - Thay thế cú pháp import JSON bằng `fs.readFileSync` kết hợp `path.resolve(__dirname, 'firebase-applet-config.json')`.
   - Triệt tiêu hoàn toàn lỗi `ERR_IMPORT_ATTRIBUTE_MISSING`.

4. **Tách Biệt Môi Trường Chạy Độc Lập:**
   - Khi chạy local (`tsx server.ts`): Express tự động khởi động server HTTP trên cổng quy định (mặc định 3000 hoặc biến môi trường `PORT`).
   - Khi chạy trên Vercel Serverless: Không gọi `app.listen()` mà ủy quyền xử lý trực tiếp cho Vercel Function handler.

---

## 3. KẾT QUẢ NGHIỆM THU TRÊN VERCEL PREVIEW THỰC TẾ

- **Deployment ID:** `dpl_CiuqFSffz8FfMMd7VK6WfKFofcGg`
- **URL Preview:** https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app
- **Kiểm tra `/api/health`:**
  ```json
  HTTP/1.1 200 OK
  Content-Type: application/json
  {
    "status": "healthy",
    "firebaseProjectId": "indigo-lotus-2nmq3",
    "databaseId": "ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2",
    "firestoreConnected": true,
    "lessonsCount": 24,
    "geminiConfigured": false,
    "buildVersion": "1.1.0-prod",
    "environmentTag": "demo",
    "timestamp": "2026-10-20T12:55:10.820Z"
  }
  ```
- **Kiểm tra đăng nhập học sinh `/api/auth/student-login`:** HTTP 200 OK, cấp token hợp lệ, trả về hồ sơ học sinh.
- **Kiểm tra đăng nhập giáo viên `/api/auth/teacher-login`:** HTTP 200 OK, cấp token hợp lệ, trả về hồ sơ giáo viên.
