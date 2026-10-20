# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROGRESS REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ

### Trạng Thái Tổng Thể: HOÀN THÀNH 100% CÁC MỤC TIÊU P0 & P1

---

### Các Mốc Đã Hoàn Thành:
1. **Thiết Lập Firebase Cloud-First (Mục tiêu 1)**:
   - [x] Kích hoạt và kết nối thực tế Cloud Firestore và Firebase Auth trên dự án `indigo-lotus-2nmq3`.
   - [x] Tạo `firebase-blueprint.json` (IR schema).
   - [x] Soạn thảo và Deploy `firestore.rules` kiểm soát ABAC bảo vệ toàn bộ 10 collections.
   - [x] Khởi tạo `src/firebase/config.ts` với xử lý lỗi `handleFirestoreError` và kiểm tra kết nối `testConnection`.

2. **Bộ Máy Toán & Chẩn Đoán Mẫu Lỗi (Mục tiêu 2)**:
   - [x] Xây dựng `src/lib/mathEngine.ts` với số nguyên chính xác tuyệt đối.
   - [x] Cài đặt Taxonomy phân loại 9 mẫu lỗi chuẩn GDPT 2018.
   - [x] Viết unit tests trong `src/lib/mathEngine.test.ts` và script kiểm thử `run-tests.ts`.

3. **Kho Học Liệu GDPT 2018 (Mục tiêu 3)**:
   - [x] Xây dựng bộ học liệu gồm 24 bài học (12 bài Lớp 1, 12 bài Lớp 2) với 192 câu hỏi mẫu mực trong `src/data/curriculumData.ts`.
   - [x] Hỗ trợ đầy đủ 6 dạng tương tác trực quan:
     1. Chọn 1 đáp án trắc nghiệm hình ảnh
     2. Nhập số với bàn phím ảo lớn
     3. Chọn dấu phép tính & so sánh
     4. Nối cặp phép tính – kết quả (chọn nguồn - chọn đích)
     5. Khung 10 ô (Ten-Frame) & Bó chục que tính
     6. Trục số & Sắp xếp thứ tự số

4. **Ba Cổng Người Dùng Độc Lập (Mục tiêu 4)**:
   - [x] **Cổng Học Sinh**: Bàn nhiệm vụ, trình làm bài `MissionPlayer`, phát âm câu hỏi tiếng Việt, nhận diện manh mối Thám tử Cáo khi sai, cơ hội thử lại, trao huy hiệu và pháo hoa.
   - [x] **Cổng Giáo Viên**: Quản lý học liệu, xem trước như học sinh, biên tập bài học thủ công (v1 ➔ v2), AI Tạo bài nháp (Gemini), giao bài có Idempotency, phân tích mẫu lỗi và xuất CSV UTF-8 BOM.
   - [x] **Cổng Quản Trị Viên**: Giám sát sức khỏe hệ thống (Health Check), quản lý tài khoản & lớp học, chạy seed demo idempotency (--dry-run và --apply), dọn dẹp scoped demo, xem audit log.

5. **Bộ Máy Server & AI Phía Máy Chủ (Mục tiêu 5)**:
   - [x] Xây dựng `server.ts` tích hợp Express + Vite middleware, bảo vệ khóa API trên máy chủ.
   - [x] Các endpoint: `/api/health`, `/api/auth/student-login`, `/api/auth/teacher-login`, `/api/teacher/generate-draft`, `/api/teacher/summarize-insights`, `/api/admin/seed-demo`, `/api/admin/cleanup-demo`.

6. **Hồ Sơ Minh Chứng Kỹ Thuật (Mục tiêu 6)**:
   - [x] `FEATURE_MATRIX.md`
   - [x] `CLOUD_ENV_REPORT.md`
   - [x] `SECURITY_AUDIT.md`
   - [x] `DEMO_DATA_MANIFEST.md`
   - [x] `TEACHER_GUIDE.md`
   - [x] `STUDENT_GUIDE.md`
   - [x] `FAST_RESEARCH_REPORT.md`
   - [x] `QA_ACCEPTANCE.md`
