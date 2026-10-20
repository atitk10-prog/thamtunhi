# HƯỚNG DẪN TRIỂN KHAI VÀ CHECKLIST VERCEL (VERCEL DEPLOY CHECKLIST)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ

---

## 1. THÔNG SỐ CẤU HÌNH DỰ ÁN VERCEL (PROJECT SETTINGS)

- **Project Name:** `thamtunhi`
- **Framework Preset:** `Vite`
- **Root Directory:** `./` (hoặc thư mục chứa `package.json` và `vite.config.ts`, tránh trỏ vào thư mục cha trống)
- **Node.js Version:** `24.x` (đã hỗ trợ tương thích an toàn)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## 2. BIẾN MÔI TRƯỜNG CẦN CẤU HÌNH TRÊN VERCEL (ENVIRONMENT VARIABLES)

| Tên Biến | Môi Trường | Mục Đích Sử Dụng |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Production, Preview, Development | Khóa API gọi Google GenAI để kích hoạt tính năng Giáo viên tạo bài nháp và phân tích tổng hợp lớp học. |
| `AUTH_SECRET` | Production, Preview, Development | Chuỗi bí mật ký số Token HMAC-SHA256 phiên đăng nhập (tùy chọn; mặc định hệ thống có khóa an toàn). |
| `NODE_ENV` | Production, Preview | Đặt `production` cho bản phát hành chính thức. |

*(Lưu ý: Tuyệt đối không đưa các biến trên vào tiền tố `VITE_*` để tránh bị lộ vào bundle client).*

---

## 3. CÁC BƯỚC ĐẨY BẢN NGHIỆM THU LÊN PRODUCTION

Sau khi chủ sở hữu xem xét bản Preview [https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app](https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app) và đồng ý nghiệm thu:

1. **Cách 1: Triển khai trực tiếp qua Vercel CLI:**
   ```bash
   cd c:\Users\Hii\Desktop\GITHUB\thamtunhi-main\thamtunhi-main
   npx vercel deploy --prebuilt --prod
   ```
2. **Cách 2: Đẩy Git lên repository:**
   - Commit toàn bộ các file đã sửa:
     - `vercel.json`
     - `api/index.ts`
     - `server.ts`
     - `firestore.rules`
     - `src/App.tsx`
     - `src/lib/authSession.ts`
     - `src/components/auth/AuthPortal.tsx`
     - `src/components/admin/AdminPortal.tsx`
     - `src/components/teacher/AiDraftModal.tsx`
     - `src/components/teacher/MisconceptionAnalytics.tsx`
     - `package.json`
     - `test-suite.ts`
   - Đẩy nhánh `main` lên `https://github.com/atitk10-prog/thamtunhi`.
   - Vercel sẽ tự động kích hoạt Production Deployment.
