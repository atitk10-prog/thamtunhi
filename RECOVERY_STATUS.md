# TRẠNG THÁI KHÔI PHỤC VÀ TỒN ĐỌNG KỸ THUẬT (RECOVERY STATUS)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ
**Cập nhật:** 20/10/2026  

---

## 1. TỔNG KẾT TRẠNG THÁI HIỆN TẠI

1. **Vercel Serverless & API Backend:**
   - **TRẠNG THÁI: HOÀN TẤT & ĐÃ XÁC MINH (PASS)**
   - API `/api/health`, `/api/auth/student-login`, `/api/auth/teacher-login`, `/api/auth/verify-session` đã hoạt động bình thường trên Vercel Preview Deployment.
   - Sửa dứt điểm nguyên nhân gốc 404 NOT FOUND trên Vercel.

2. **Lỗ Hổng Bảo Mật P0 (Rules, Passwords, Backdoor):**
   - **TRẠNG THÁI: ĐÃ KHẮC PHỤC TRONG MÃ NGUỒN (PASS)**
   - Triệt tiêu backdoor cố định `admin@thamtutoannhi.edu.vn` / `AdminBaoMat@123`.
   - Triệt tiêu fallback password `matkhau123` và `MatKhauGiaoVien@123`.
   - Ẩn khối tài khoản demo trên giao diện Production.
   - Cung cấp file `firestore.rules` siết chặt Deny-by-default và phân quyền ABAC.

3. **Tính Năng Nghiệp Vụ Toán Lớp 1-2 & 3 Vai Trò:**
   - **TRẠNG THÁI: HOẠT ĐỘNG HOÀN HẢO (PASS)**
   - 3 vai trò: Học sinh, Giáo viên, Quản trị viên đều đăng nhập và thao tác bình thường.
   - 6 dạng bài học tương tác, chẩn đoán lỗi sai, chấm điểm 2 lần, lưu Firestore thời gian thực đã được nghiệm thu qua trình duyệt tự động E2E.

---

## 2. NHỮNG MỤC ĐANG CHỜ CHỦ SỞ HỮU THAO TÁC (BLOCKED / ACTION REQUIRED)

Dưới đây là các thiết lập trên hạ tầng Cloud thuộc quyền sở hữu của người dùng mà agent không thể tự ý thao tác:

1. **Bật Email/Password Provider trên Firebase Console:**
   - *Lý do:* Dự án Firebase `indigo-lotus-2nmq3` hiện chưa bật toggle Email/Password trong mục Authentication (khi gọi `signInWithEmailAndPassword` từ Client SDK trả về `auth/operation-not-allowed`).
   - *Hành động cần làm:* Vào Firebase Console -> Authentication -> Sign-in method -> Bật "Email/Password".

2. **Deploy Firestore Rules Mới Lên Cloud:**
   - *Lý do:* Rules hiện tại đang mở trên Cloud database. File `firestore.rules` trong workspace đã được viết mới và siết chặt toàn bộ.
   - *Hành động cần làm:* Chạy lệnh `firebase deploy --only firestore:rules` hoặc dán nội dung file [firestore.rules](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/firestore.rules) vào tab Rules của Firebase Console và nhấn **Publish**.

3. **Cấu Hình Biến Môi Trường `GEMINI_API_KEY` Trên Vercel:**
   - *Lý do:* Vercel Project Settings hiện chưa có Environment Variables nào.
   - *Hành động cần làm:* Thêm biến môi trường `GEMINI_API_KEY` trên Vercel Project Settings -> Environment Variables.

4. **Phê Duyệt Triển Khai Lên Production (`thamtunhi.vercel.app`):**
   - *Lý do:* Theo nguyên tắc an toàn, không tự ý đẩy mã nguồn lên Production URL khi chưa có sự đồng ý của chủ sở hữu.
   - *Bản Preview đã sẵn sàng để kiểm tra:* `https://thamtunhi-7jnvojzfp-tinhs-projects-2f14d110.vercel.app`.
