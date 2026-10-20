# BÁO CÁO NGHIỆM THU CỔNG PHÁT HÀNH CLOUD (FINAL CLOUD RELEASE GATE)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)
**Thời điểm lập:** 20/10/2026  
**Đơn vị thực hiện:** Đội ngũ Kỹ sư Trưởng Full-stack, Firebase Security & QA Automation  
**Hạ tầng khảo nghiệm:**
- **Local Host:** `http://localhost:3005` & `http://localhost:3000`
- **Vercel Project:** `thamtunhi` (`prj_tjlT2DwBQk6mnEJCbaCWkXhlBFWC`, Team: `tinhs-projects-2f14d110`)
- **Vercel Preview Deployment Mới:** `https://thamtunhi-nfyshyz79-tinhs-projects-2f14d110.vercel.app` (ID: `dpl_HLv66qXVDPYMLKNGDT21egEm2oFX`)
- **Production URL:** `https://thamtunhi.vercel.app` (**ĐƯỢC BẢO LƯU NGUYÊN TRẠNG, CHƯA PROMOTE**)
- **Firebase Project:** `indigo-lotus-2nmq3`
- **Firestore Named Database:** `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`
- **GitHub Repository:** `https://github.com/atitk10-prog/thamtunhi` (Base commit: `352143a018d5b7a10e80fb8f5e2e9c29ff0534b8`)

---

## 1. BẢNG TỔNG HỢP TRẠNG THÁI TỪNG HẠNG MỤC (RELEASE GATE MATRIX)

| STT | Hạng Mục Khảo Nghiệm | Trạng Thái | Bằng Chứng Kỹ Thuật Thực Tế | URL / Commit / Định Danh | Việc Còn Lại Cần Thực Hiện |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **01** | **Mã nguồn Git & Commit sửa lỗi an toàn** | **BLOCKED** | Đã tạo branch `fix/antigravity-hardening`, commit `71cbedc` sạch bí mật trên máy cục bộ. Đã rà soát diff chống lộ secret. | Commit: `71cbedc5c44f3c366cfc5673e51c0be3678d1be9` | Chủ sở hữu cấp quyền đẩy nhánh lên GitHub `origin fix/antigravity-hardening`. |
| **02** | **Vercel Serverless Function & API Routing** | **PASS** | `vercel.json` định tuyến `/api/(.*)` -> `api/index.ts`. Build thành công trong 1.15s, Node.js 22/24 tương thích. | `https://thamtunhi-nfyshyz79-tinhs-projects-2f14d110.vercel.app/api/health` | Không còn lỗi 404 NOT FOUND trên Preview. |
| **03** | **Health Probe & Kết nối Named Database** | **PASS** | `/api/health` trả HTTP 200 JSON: `status: 'healthy'`, `databaseId: 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2'`, probe 24 bài học thật. | Deployment: `dpl_HLv66qXVDPYMLKNGDT21egEm2oFX` | Sẵn sàng cho môi trường chính thức. |
| **04** | **Bảo mật P0: Triệt tiêu Backdoor & Fallback Passwords** | **PASS** | Xóa sạch logic tự cấp Admin (`admin@thamtutoannhi.edu.vn` / `AdminBaoMat@123`), xóa mật khẩu mặc định `'matkhau123'`, `'MatKhauGiaoVien@123'`. 6/6 test pass. | File: `server.ts:157-254` | Không tài khoản nào vào được nếu sai pass. |
| **05** | **Bảo mật P0: Thanh lọc Secret trong Tài Liệu & Bundle** | **PASS** | Đã biên tập lại `README.md`, `DEMO_DATA_MANIFEST.md`. Khối quick demo trên web được bọc `import.meta.env.DEV` (0 byte secret trong `dist/assets/*.js`). | File: `dist/assets/index-CFPSqaGs.js` | Không lộ mật khẩu trong bundle phát hành. |
| **06** | **Bảo mật P0: Phân Quyền API RBAC/ABAC** | **PASS** | Endpoint `/api/admin/*` và `/api/teacher/*` được bảo vệ bởi middleware `requireAuth` + `requireRole`. Chặn token giả, token hết hạn, mạo danh. 11/11 test pass. | File: `server.ts:89-111` | Chặn đứng thao tác trái phép. |
| **07** | **Kiến trúc Xác thực HMAC Token (API Backend)** | **PASS** | Hệ thống Token HMAC-SHA256 phiên đăng nhập hoạt động trơn tru cho cả 3 vai trò. Chống sửa đổi chữ ký số (anti-tamper), hỗ trợ kiểm tra phiên F5. | File: `src/lib/authSession.ts` | Backend quản lý phiên an toàn. |
| **08** | **Kiến trúc Xác thực Firebase Auth & Client SDK** | **BLOCKED** | Firebase Console hiện tắt provider Email/Password (`auth/operation-not-allowed`). Client không thể lấy Firebase ID Token từ Client SDK. | Project: `indigo-lotus-2nmq3` | Chủ sở hữu cần bật Email/Password trên Firebase Console (Xem Mục 3). |
| **09** | **Firestore Security Rules trên Cloud Database** | **BLOCKED** | File `firestore.rules` đã siết chặt deny-by-default và cấu hình đúng named database trong `firebase.json`. Tuy nhiên chưa deploy lên Cloud Console để tránh khóa client khi chưa có Firebase Auth. | File: `firestore.rules`, `firebase.json` | Cần bật Firebase Auth trước khi bấm Publish Rules trên Cloud. |
| **10** | **Kiểm thử Ma trận Phân quyền Rules (ABAC Matrix)** | **PASS** | 17/17 testcases kiểm thử logic rules ABAC đạt 100%: chặn học sinh đọc bài bạn, chặn sửa status completed, bất biến snapshot học liệu và audit log. | `test-suite.ts` (Phần 8) | Logic bảo mật đã được chứng minh tự động. |
| **11** | **Trải nghiệm 3 Vai Trò (Student, Teacher, Admin)** | **PASS** | Đăng nhập thực tế trên Vercel Preview HTTP 200: Học sinh `HS1A01`, Giáo viên `giaovien1@...`, Quản trị viên `admin@...`. Duy trì phiên khi F5. | E2E Browser Subagent Log & Node Probes | Đầy đủ luồng người dùng của cả 3 đối tượng. |
| **12** | **6 Hoạt Động Toán Học Tương Tác (GDPT 2018)** | **PASS** | 16/16 Unit test và kiểm thử giao diện thực tế: Trắc nghiệm, Nhập số, Chọn dấu, Nối cặp, Khung 10 ô, Trục số & sắp xếp thứ tự. | `src/lib/mathEngine.test.ts` | Đúng chuẩn sư phạm tiểu học. |
| **13** | **Chấm Điểm 2 Lần & Chẩn Đoán Mẫu Lỗi Sai** | **PASS** | Lần đầu đúng 10 điểm; lần đầu sai bật Thám Tử Cáo gợi ý trực quan; sửa đúng được 7 điểm; ghi nhận `firstAttemptCorrectCount` và `postHintCorrectCount`. | `src/components/student/MissionPlayer.tsx` | Không để AI chấm điểm bừa bãi. |
| **14** | **Học Liệu Bất Biến & Chống Giao Bài Trùng** | **PASS** | Sửa bài học sinh ra version snapshot mới (v1 bất biến). Giao bài dùng idempotency key `assign_{classId}_{versionId}` chống giao trùng lặp. | `src/components/teacher/AssignModal.tsx` | Bảo đảm tính toàn vẹn sư phạm. |
| **15** | **Tích Hợp Google Gemini AI (Soạn Bài & Tổng Hợp)** | **BLOCKED** | Biến môi trường `GEMINI_API_KEY` chưa được thêm trên Vercel. Endpoint `/api/health` báo trung thực `geminiConfigured: false` (không dùng mặt nạ che đậy). | Vercel Settings -> Environment Variables | Chủ sở hữu thêm key `GEMINI_API_KEY` trên Vercel Console. |
| **16** | **Bảo Tồn Dữ Liệu Production Cloud Firestore** | **PASS** | Không chạy seed hay cleanup trên Production. Cờ `apply: false` (Dry-run mode) được cưỡng chế cho mọi môi trường demo. | Cloud Named Database | 100% dữ liệu khảo nghiệm được bảo toàn nguyên vẹn. |
| **17** | **Môi Trường Production (`thamtunhi.vercel.app`)** | **BẢO LƯU** | Giữ nguyên trạng 404 cũ, không tự ý promote khi chưa có sự phê duyệt chính thức của chủ sở hữu. | `https://thamtunhi.vercel.app` | Đợi chủ sở hữu xác nhận trước khi phát hành. |

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG TOÀN BỘ (AUTOMATED TEST SUITE: 56/56 PASS)

Lệnh thực thi kiểm thử: `npx tsx test-suite.ts`

```text
================================================================
 BỘ KIỂM THỬ TỔNG THỂ DỰ ÁN THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)
================================================================

--- PHẦN 1: UNIT TEST MATH ENGINE & 6 DẠNG TƯƠNG TÁC ---
  [PASS] 16 Unit tests thuật toán Toán & chẩn đoán lỗi sai

--- PHẦN 2: BẢO MẬT PHIÊN & TOKEN HMAC-SHA256 ---
  [PASS] Tạo và giải mã Token Học Sinh thành công
  [PASS] Bảo toàn mã định danh học sinh trong claims
  [PASS] Tạo và giải mã Token Giáo Viên thành công
  [PASS] Tạo và giải mã Token Quản Trị thành công
  [PASS] Chặn Token bị làm giả / sửa chữ ký số (Anti-Tampering)
  [PASS] Chặn Token rỗng
  [PASS] Chặn định dạng token dị thường

--- PHẦN 3: KIỂM THỬ HEALTH PROBE & CLOUD FIRESTORE ---
  [PASS] Endpoint /api/health trả về HTTP 200
  [PASS] Trạng thái hệ thống healthy
  [PASS] Kết nối thực tế Cloud Firestore thành công
  [PASS] Đã probe thực tế 24 bài học trên Firestore
  [PASS] Truy vấn đúng named database Firestore

--- PHẦN 4: KIỂM THỬ XÁC THỰC HỌC SINH & CHỐNG LỘ BÍ MẬT ---
  [PASS] Chặn yêu cầu thiếu tham số (HTTP 400)
  [PASS] Chặn mật khẩu sai của học sinh (HTTP 401)
  [PASS] Đăng nhập học sinh HS1A01 thành công (HTTP 200)
  [PASS] Cấp Token định danh an toàn cho học sinh
  [PASS] Không trả về trường mật khẩu/accessSecret trong response (Zero leak)

--- PHẦN 5: KIỂM THỬ XÁC THỰC GIÁO VIÊN & TRIỆT TIÊU BACKDOOR ---
  [PASS] Triệt tiêu hoàn toàn backdoor tự cấp quyền admin (HTTP 401)
  [PASS] Đăng nhập giáo viên 1 thành công (HTTP 200)
  [PASS] Cấp Token cho Giáo viên
  [PASS] Không lộ mật khẩu giáo viên ra client
  [PASS] Đăng nhập Quản trị viên thành công (HTTP 200)
  [PASS] Xác thực đúng vai trò admin

--- PHẦN 6: KIỂM THỬ XÁC MINH PHIÊN ĐĂNG NHẬP (/api/auth/verify-session) ---
  [PASS] Chặn truy cập verify-session khi không có token (HTTP 401)
  [PASS] Xác minh phiên đăng nhập giáo viên thành công (HTTP 200)
  [PASS] Dữ liệu phiên khớp vai trò giáo viên

--- PHẦN 7: KIỂM SOÁT PHÂN QUYỀN API (ROLE-BASED ACCESS CONTROL) ---
  [PASS] Chặn gọi AI soạn bài khi chưa đăng nhập (HTTP 401)
  [PASS] Chặn Học sinh gọi API Giáo viên/AI (HTTP 403 Forbidden)
  [PASS] Chặn gọi Seed khi chưa đăng nhập (HTTP 401)
  [PASS] Chặn Học sinh gọi API Quản trị Seed (HTTP 403 Forbidden)
  [PASS] Chặn Giáo viên gọi API Quản trị Seed (HTTP 403 Forbidden)
  [PASS] Admin gọi Seed chế độ DRY-RUN an toàn, không ghi dữ liệu (HTTP 200)
  [PASS] Chặn gọi Cleanup khi chưa đăng nhập (HTTP 401)
  [PASS] Chặn Học sinh gọi Cleanup Demo (HTTP 403 Forbidden)
  [PASS] Chặn Giáo viên gọi Cleanup Demo (HTTP 403 Forbidden)
  [PASS] Chặn Token đã hết hạn trong verifyAuthToken
  [PASS] Chặn Token hết hạn gọi API bảo vệ (HTTP 401)
  [PASS] Chặn Authorization Header sai định dạng Bearer (HTTP 401)

--- PHẦN 8: KIỂM TOÁN MA TRẬN PHÂN QUYỀN FIRESTORE RULES (ABAC LOGIC) ---
  [PASS] Rules: Cho phép đọc public endpoint test/docId
  [PASS] Rules: Chặn người dùng nặc danh đọc /users/{id}
  [PASS] Rules: Học sinh được đọc profile của chính mình
  [PASS] Rules: Học sinh bị chặn đọc profile của học sinh khác
  [PASS] Rules: Giáo viên được đọc profile của học sinh
  [PASS] Rules: Chặn Học sinh tự nâng quyền role
  [PASS] Rules: Chặn sửa trực tiếp password trong document
  [PASS] Rules: Giáo viên cập nhật lớp của mình
  [PASS] Rules: Chặn Giáo viên sửa lớp của giáo viên khác
  [PASS] Rules: Học sinh đọc bài làm của mình
  [PASS] Rules: Chặn Học sinh đọc bài làm của bạn khác
  [PASS] Rules: Giáo viên được đọc bài làm của học sinh
  [PASS] Rules: Chặn Học sinh tạo bài làm mạo danh mã học sinh khác
  [PASS] Rules: Cho phép Học sinh cập nhật bài đang làm
  [PASS] Rules: Chặn sửa đổi bài thi đã nộp (Status Completed)
  [PASS] Rules: Bất biến phiên bản học liệu lessonVersions (Không ai được sửa snapshot)
  [PASS] Rules: Bất biến nhật ký hệ thống auditLogs (Không ai được sửa/xóa audit log)

================================================================
 TỔNG KẾT KIỂM THỬ: 56/56 TESTS PASS (100% ĐẠT TIÊU CHUẨN)
================================================================
```

---

## 3. PHÂN TÍCH XUNG ĐỘT KIẾN TRÚC P0-A (HMAC TOKEN VS FIREBASE AUTH)

```
[Mô Hình Hiện Tại Sau Khắc Phục]:
Client (React SPA)
   │
   ├── (1) Đăng nhập (Mã HS + mật khẩu / Email + mật khẩu)
   │    └──> POST /api/auth/* (Vercel Serverless Express)
   │          └──> Kiểm tra thông tin trong Firestore DB
   │          └──> Trả về HMAC-SHA256 Session Token
   │
   ├── (2) Gọi các API nhạy cảm (/api/teacher/*, /api/admin/*)
   │    └──> Gửi Header `Authorization: Bearer <HMAC_TOKEN>`
   │          └──> Express Middleware verifyAuthToken() xác minh vai trò & quyền hạn (RBAC/ABAC)
   │
   └── (3) Truy cập Firestore trực tiếp từ Client SDK (lessons, assignments, attempts)
        └──> Hiện thành công trên Cloud vì Rules trên Cloud vẫn đang ở trạng thái mặc định của AI Studio (`allow read, write: if true`).
```

> [!WARNING]
> **CẢNH BÁO XUNG ĐỘT QUAN TRỌNG:**
> Token HMAC-SHA256 do Express ký là token cấp ứng dụng nội bộ, **KHÔNG PHẢI là Firebase ID Token**. Do đó, đối với Firestore Client SDK, biến `request.auth` trong Firestore Rules vẫn mang giá trị `null`.
> Nếu chủ sở hữu bấm Publish file `firestore.rules` mới (vốn yêu cầu `request.auth != null`), thì toàn bộ truy cập từ Client SDK sẽ bị Firestore từ chối ngay lập tức với lỗi `PERMISSION_DENIED`!
>
> **Hai Lộ Trình Giải Quyết Bền Vững:**
> - **Lộ trình A (Khuyến nghị chuẩn Firebase):** Chủ sở hữu vào Firebase Console -> Bật provider Email/Password. Khi đó có thể triển khai Firebase Custom Token từ backend hoặc cho giáo viên/admin đăng nhập trực tiếp qua Firebase Auth.
> - **Lộ trình B (Bảo mật qua API Proxy):** Toàn bộ thao tác đọc/ghi Firestore chuyển qua các endpoint Express (`/api/student/*`, `/api/teacher/*`) sử dụng Firebase Admin SDK (hoặc server-side credentials), Client không cần truy cập trực tiếp Firestore.

---

## 4. HƯỚNG DẪN THU HỒI VÀ XOAY SECRET ĐÃ LỘ TRƯỚC ĐÂY

Trong các bước kiểm thử ban đầu, một số thông tin nhạy cảm đã xuất hiện trong log hệ thống. Cần thực hiện các biện pháp khắc phục sau:

1. **Xoay Vercel Protection Bypass Token:**
   - **Vấn đề:** Vercel CLI debug log từng hiển thị chuỗi `x-vercel-protection-bypass`.
   - **Hành động cần làm:** Truy cập [Vercel Dashboard](https://vercel.com/) -> Dự án `thamtunhi` -> **Settings** -> **Deployment Protection** -> Nhấn **Regenerate** tại mục Protection Bypass for Automation để hủy bỏ token cũ.

2. **Đổi mật khẩu tài khoản Quản trị & Giáo viên:**
   - **Vấn đề:** Các chuỗi mật khẩu demo từng xuất hiện trong tài liệu ban đầu.
   - **Hành động cần làm:** Đổi mật khẩu tài khoản quản trị `admin@thamtutoannhi.edu.vn` và các giáo viên trực tiếp trong cơ sở dữ liệu hoặc cấp mật khẩu riêng trước khi sử dụng chính thức.

---

## 5. CÁC BƯỚC CHỦ SỞ HỮU CẦN THỰC HIỆN TRÊN CONSOLE

### Bước 1: Cấu hình biến môi trường trên Vercel Console
1. Truy cập [Vercel Dashboard](https://vercel.com/) -> Chọn Project `thamtunhi`.
2. Vào tab **Settings** -> **Environment Variables**.
3. Thêm các biến sau:
   - `GEMINI_API_KEY`: *(Nhập khóa API từ Google AI Studio)* -> Tích chọn: `Production`, `Preview`, `Development`.
   - `AUTH_SECRET`: *(Tùy chọn: nhập một chuỗi ngẫu nhiên dài ít nhất 32 ký tự để ký token HMAC phiên đăng nhập)*.
   - `NODE_ENV`: `production`.

### Bước 2: Bật xác thực trên Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/) -> Chọn Project `indigo-lotus-2nmq3`.
2. Vào mục **Build** -> **Authentication** -> Tab **Sign-in method**.
3. Tại danh sách nhà cung cấp, nhấp vào **Email/Password** -> Bật toggle **Enable** -> Nhấn **Save**.

### Bước 3: Đồng bộ Git lên GitHub
Mã nguồn đã được kiểm toán bảo mật và tạo commit cục bộ an toàn `71cbedc`. Để đẩy lên GitHub:
```bash
cd c:\Users\Hii\Desktop\GITHUB\thamtunhi-main\thamtunhi-main
git push origin fix/antigravity-hardening
```
*(Sau đó tạo Pull Request gộp vào nhánh `main` hoặc kiểm tra trên giao diện GitHub).*

### Bước 4: Triển khai chính thức lên Production (Chỉ khi đã nghiệm thu)
Khi chủ sở hữu đã kiểm tra bản Preview `https://thamtunhi-nfyshyz79-tinhs-projects-2f14d110.vercel.app` và xác nhận đạt yêu cầu, chạy lệnh sau để phát hành lên Production domain `https://thamtunhi.vercel.app`:
```bash
cd c:\Users\Hii\Desktop\GITHUB\thamtunhi-main\thamtunhi-main
npx vercel deploy --prod
```

---

## 6. DANH SÁCH TỆP ĐÃ SỬA ĐỔI VÀ BẢO TỒN

| Tên Tệp | Hành Động | Mục Đích |
| :--- | :---: | :--- |
| `vercel.json` | **Tạo mới** | Cấu hình định tuyến API `/api/(.*)` sang Serverless Function và SPA fallback. |
| `api/index.ts` | **Tạo mới** | Entrypoint Serverless Function xuất Express app cho Vercel Edge. |
| `src/lib/authSession.ts` | **Tạo mới** | Quản lý token HMAC, gắn header xác thực và kiểm tra phiên F5. |
| `test-suite.ts` | **Tạo mới & Mở rộng** | Bộ 56 kiểm thử tự động toàn diện (Math, HMAC, RBAC, Health, ABAC Rules). |
| `firebase.json` | **Tạo mới** | Chỉ định chính xác named database `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`. |
| `.firebaserc` | **Tạo mới** | Chỉ định dự án Firebase `indigo-lotus-2nmq3`. |
| `server.ts` | **Sửa đổi** | Loại bỏ hoàn toàn backdoor & fallback password; thêm xác thực HMAC & bảo vệ RBAC. |
| `firestore.rules` | **Sửa đổi** | Siết chặt toàn bộ 10 collection theo chuẩn ABAC Deny-by-default. |
| `src/App.tsx` | **Sửa đổi** | Tự động xác minh phiên đăng nhập khi tải lại trang và hỗ trợ đăng xuất an toàn. |
| `src/components/auth/AuthPortal.tsx` | **Sửa đổi** | Loại bỏ mật khẩu hardcoded, ẩn bảng demo trên production, loại bỏ rò rỉ secret trong bundle. |
| `src/components/admin/AdminPortal.tsx` | **Sửa đổi** | Hiển thị trung thực health probe từ server, bảo vệ các lệnh quản trị bằng Auth headers. |
| `src/components/teacher/AiDraftModal.tsx` | **Sửa đổi** | Gắn Auth headers khi gọi API AI soạn bài. |
| `src/components/teacher/MisconceptionAnalytics.tsx` | **Sửa đổi** | Gắn Auth headers khi gọi API AI tổng hợp phân tích lớp học. |
| `vite.config.ts` | **Sửa đổi** | Dùng `import.meta.dirname` khắc phục cảnh báo deprecation Node.js. |
| `README.md` | **Sửa đổi** | Biên tập lại, loại bỏ bảng mật khẩu công khai. |
| `DEMO_DATA_MANIFEST.md` | **Sửa đổi** | Biên tập lại, loại bỏ mật khẩu plaintext của học sinh và giáo viên. |
| `.gitignore` | **Sửa đổi** | Thêm `.vercel` và `.backup` chống đưa tệp nhạy cảm lên kho mã nguồn. |
