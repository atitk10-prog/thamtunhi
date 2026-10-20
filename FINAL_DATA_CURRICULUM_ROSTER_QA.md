# BÁO CÁO NGHIỆM THU KIỂM ĐỊNH DỮ LIỆU, KHO HỌC LIỆU VÀ QUẢN LÝ LỚP
## DỰ ÁN: THÁM TỬ TOÁN NHÍ – LỚP 1 VÀ LỚP 2 (GDPT 2018)

**Tài liệu:** `FINAL_DATA_CURRICULUM_ROSTER_QA.md`  
**Ngày thực hiện:** 20/10/2026  
**Đơn vị thẩm định:** Senior Full-stack Engineer, Firebase Architect & QA Lead  
**Repository:** `atitk10-prog/thamtunhi`  
**Nhánh công tác:** `fix/antigravity-hardening`  
**Commit nghiệm thu:** `c9b6935`  
**Firebase Project:** `indigo-lotus-2nmq3`  
**Firestore Named Database:** `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`  
**Hồ sơ sao lưu bảo toàn:** `backup/firestore-backup-latest.json` (SHA256 verified)

---

## 1. SƠ ĐỒ DỮ LIỆU THỰC TẾ VÀ QUAN HỆ GIỮA CÁC COLLECTIONS

Hệ thống lưu trữ trên named database Firestore vận hành theo kiến trúc Normalized Entity kết hợp Immutable Snapshots:

```mermaid
erDiagram
    ACADEMIC_YEAR ||--o{ CLASS : "chứa"
    USER ||--o{ CLASS : "phụ trách (role=teacher)"
    CLASS ||--o{ USER : "chứa danh sách (role=student)"
    LESSON ||--|{ LESSON_VERSION : "phiên bản lịch sử"
    LESSON ||--o{ ASSIGNMENT : "học liệu nguồn"
    LESSON_VERSION ||--o{ ASSIGNMENT : "phiên bản gán (currentVersionId)"
    CLASS ||--o{ ASSIGNMENT : "giao cho lớp"
    USER ||--o{ ASSIGNMENT : "giao cá nhân (studentId)"
    ASSIGNMENT ||--o{ ATTEMPT : "lượt làm bài"
    USER ||--o{ ATTEMPT : "học sinh thực hiện"
    ATTEMPT ||--o{ ATTEMPT_ANSWER : "chi tiết từng câu"
    ATTEMPT ||--o{ MISTAKE_INSIGHT : "chẩn đoán lỗi sai AI"
    USER ||--o{ AUDIT_LOG : "nhật ký tác vụ bảo mật"
```

### Bảng Kiểm Kê Số Lượng Bản Ghi Thực Tế (Đối soát 100% không mất mát)

| Tên Collection | Số Lượng Bản Ghi | Mục Đích Lưu Trữ | Tính Toàn Vẹn & Khóa Khôi Phục |
|---|---|---|---|
| `users` | **61** | Tài khoản (Admin: 1, Giáo viên: 2, Học sinh: 50, Test/Audit: 8) | Khớp 100% `classId`, phân quyền RBAC an toàn |
| `classes` | **4** | Lớp học (1A, 1B, 2A, 2B) | Đã liên kết đúng `teacherId`, không lớp mồ côi |
| `academicYears` | **1** | Niên khóa học tập 2026 - 2027 | Niên khóa hiện hành chuẩn |
| `lessons` | **24** | 24 chuyên đề Toán chuẩn Bộ GD&ĐT (12 Lớp 1 + 12 Lớp 2) | Đã gắn `currentVersionId` chỉ mục tường minh |
| `lessonVersions` | **24** | Bản ghi bất biến (Immutable snapshot) chứa 8 câu hỏi/bài | **192 câu hỏi** đầy đủ nội dung, visual, đáp án |
| `assignments` | **25** | Bài tập giao cho lớp và học sinh cá nhân | Liên kết toàn vẹn `lessonId`, `currentVersionId` |
| `attempts` | **151** | Lượt làm bài thực tế & dữ liệu vận hành | Bảo toàn nguyên vẹn, tách bạch điểm số thực tế |
| `attemptAnswers` | **18** | Chi tiết câu trả lời từng câu trong lượt làm | Không bản ghi trùng lặp, xác thực qua server |
| `mistakeInsights` | **146** | Bản ghi chẩn đoán mô hình sai lầm sư phạm | Kết nối chính xác với `questionId` và `attemptId` |
| `auditLogs` | **2** | Nhật ký hệ thống ghi nhận tác vụ đặc quyền | Bất biến (append-only), chống sửa/xóa |

---

## 2. KẾT QUẢ ĐỐI CHIẾU 24 BÀI HỌC VÀ SỐ CÂU HỎI TỪNG BÀI

Toàn bộ 24 bài học trong kho học liệu đã được đối chiếu chi tiết từ Firestore Collection `lessons` sang `lessonVersions`. Mỗi bài học sở hữu chính xác **8 câu hỏi chuẩn sư phạm** (tổng cộng 192 câu hỏi):

| STT | Mã Bài Học (ID) | Khối | Tiêu Đề Bài Học | Phiên Bản | Số Câu Hỏi | Trạng Thái Phục Vụ |
|---|---|---|---|---|---|---|
| 1 | `lesson-g1-01` | Lớp 1 | Các số từ 1 đến 5: Đếm và Nhận biết | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 2 | `lesson-g1-02` | Lớp 1 | Các số từ 6 đến 10 và Tách - Gộp số | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 3 | `lesson-g1-03` | Lớp 1 | Phép cộng trong phạm vi 10 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 4 | `lesson-g1-04` | Lớp 1 | Phép trừ trong phạm vi 10 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 5 | `lesson-g1-05` | Lớp 1 | Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 6 | `lesson-g1-06` | Lớp 1 | Các số trong phạm vi 20 và Số Mười (1 chục) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 7 | `lesson-g1-07` | Lớp 1 | Phép cộng không nhớ trong phạm vi 20 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 8 | `lesson-g1-08` | Lớp 1 | Phép trừ không nhớ trong phạm vi 20 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 9 | `lesson-g1-09` | Lớp 1 | Đo độ dài và Xăng-ti-mét (cm) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 10 | `lesson-g1-10` | Lớp 1 | Các số tròn chục từ 10 đến 90 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 11 | `lesson-g1-11` | Lớp 1 | Các số có hai chữ số đến 100 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 12 | `lesson-g1-12` | Lớp 1 | Đồng hồ và Xem giờ đúng | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 13 | `lesson-g2-01` | Lớp 2 | Phép cộng có nhớ trong phạm vi 20 (Qua 10) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 14 | `lesson-g2-02` | Lớp 2 | Phép trừ có nhớ trong phạm vi 20 (Trừ qua 10) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 15 | `lesson-g2-03` | Lớp 2 | Đề-xi-mét (dm) và Đo độ dài | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 16 | `lesson-g2-04` | Lớp 2 | Phép cộng có nhớ trong phạm vi 100 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 17 | `lesson-g2-05` | Lớp 2 | Phép trừ có nhớ trong phạm vi 100 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 18 | `lesson-g2-06` | Lớp 2 | Khối trụ và Khối cầu | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 19 | `lesson-g2-07` | Lớp 2 | Làm quen với Phép nhân và Dấu nhân (×) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 20 | `lesson-g2-08` | Lớp 2 | Bảng nhân 2 và Bảng nhân 5 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 21 | `lesson-g2-09` | Lớp 2 | Làm quen với Phép chia và Bảng chia 2, chia 5 | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 22 | `lesson-g2-10` | Lớp 2 | Các số trong phạm vi 1000 và Hàng trăm | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 23 | `lesson-g2-11` | Lớp 2 | Đo lường: Ki-lô-gam (kg) và Lít (l) | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |
| 24 | `lesson-g2-12` | Lớp 2 | Xem lịch, Ngày - Tháng và Xem đồng hồ | `v1` | **8 câu** | Sẵn sàng (Toàn vẹn) |

---

## 3. DANH SÁCH LỚP HỌC VÀ SỐ HỌC SINH ĐƯỢC LIÊN KẾT

Tất cả học sinh được đếm trực tiếp từ collection `users` theo trường `classId` tương ứng. **Xóa bỏ hoàn toàn số lượng giả `{c.studentCount || 12}`**:

| STT | Mã Lớp | Tên Lớp | Khối | Giáo Viên Phụ Trách | Số HS Thực Tế | Tình Trạng Tài Khoản |
|---|---|---|---|---|---|---|
| 1 | `class-1a` | **1A** | Khối 1 | `teacher-1` (`giaovien1@thamtutoannhi.edu.vn`) | **14 học sinh** (`HS1A01` ... `HS1A14`) | 14 Hoạt động, 0 Khóa |
| 2 | `class-1b` | **1B** | Khối 1 | `teacher-1` (`giaovien1@thamtutoannhi.edu.vn`) | **12 học sinh** (`HS1B01` ... `HS1B12`) | 12 Hoạt động, 0 Khóa |
| 3 | `class-2a` | **2A** | Khối 2 | `teacher-2` (`giaovien2@thamtutoannhi.edu.vn`) | **12 học sinh** (`HS2A01` ... `HS2A12`) | 12 Hoạt động, 0 Khóa |
| 4 | `class-2b` | **2B** | Khối 2 | `teacher-2` (`giaovien2@thamtutoannhi.edu.vn`) | **12 học sinh** (`HS2B01` ... `HS2B12`) | 12 Hoạt động, 0 Khóa |

---

## 4. BẢNG DỮ LIỆU THEO NGUỒN GỐC THỰC TẾ (DATA ORIGIN AUDIT)

Không tự ý gán nhãn hoặc xóa bản ghi; phân loại minh bạch giữa dữ liệu hệ thống vận hành và dữ liệu mô phỏng:

| Nhóm Dữ Liệu | Nguồn Gốc Thực Tế (`dataOrigin`) | Nhãn Môi Trường (`environmentTag`) | Số Lượng | Chính Sách Quản Lý & Bảo Toàn |
|---|---|---|---|---|
| **Học Liệu 24 Bài** | `system_curriculum` | `production` | 24 bài (192 câu) | Dữ liệu chính thức chuẩn Bộ GD&ĐT; bất biến khi đã có bài làm |
| **Tài Khoản & Lớp** | `operational_roster` | `production` | 61 users, 4 classes | Dữ liệu vận hành chính thức trường học; giáo viên quản lý theo lớp |
| **Lượt Làm Thực** | `real` / `user_generated` | `production` | 7 lượt mới phát sinh | Đưa vào thống kê điểm số, phân tích lỗi sai và xuất báo cáo CSV |
| **Lượt Mô Phỏng Cũ** | `simulation` | `demo` | 144 lượt lịch sử | Giữ nguyên vẹn trong Firestore, mặc định ẩn khỏi bộ lọc giáo viên chính thức; Admin có thể kiểm toán riêng |

---

## 5. DANH SÁCH BẢN GHI CÓ NGUY CƠ BỊ XÓA HOẶC MẤT LIÊN KẾT

- **Tình trạng đối soát:**
  1. Không có bài học mồ côi (100% 24 bài học có phiên bản `lessonVersions` tương ứng).
  2. Không có học sinh mồ côi (100% 50 học sinh thuộc đúng 4 lớp `class-1a`, `class-1b`, `class-2a`, `class-2b`).
  3. Không có lớp mồ côi (100% 4 lớp đều có giáo viên phụ trách hợp lệ: `teacher-1` và `teacher-2`).
  4. Cơ chế Dry-Run & Backup: Toàn bộ lệnh dọn dẹp hoặc sửa đổi cấu trúc đều yêu cầu quyền Admin, chạy qua chế độ `dryRun: true` trước và xuất backup an toàn trước khi thực hiện.

---

## 6. DANH SÁCH LỖI ĐÃ SỬA KÈM TỆP NGUỒN VÀ BẰNG CHỨNG

### Lỗi 1: Giáo viên bấm biên tập chỉ hiện 1 câu mẫu
- **Nguyên nhân gốc:** `LessonEditorModal.tsx` khởi tạo state câu hỏi `useState<EditableQuestion[]>` một lần duy nhất lúc mount khi props chưa tải xong, thiếu hook phản ứng `useEffect` đồng bộ dữ liệu khi modal mở lại với `lesson` và `lessonVersion` mới.
- **Khắc phục:** 
  - Bổ sung `useEffect([isOpen, lesson, lessonVersion])` giải mã toàn bộ mảng `questions` thực từ snapshot phiên bản.
  - Loại bỏ hoàn toàn câu hỏi mẫu fallback. Nếu không tải được phiên bản, hiển thị cảnh báo lỗi màu đỏ và khóa nút Lưu / Xuất bản.
  - Hỗ trợ biên tập đầy đủ trường: `prompt`, `options`, `visualConfig` (counters, comparison, ten_frame), `pairs`, `expectedAnswer`, `explanation`, `ruleHints`, `skillTag`, `difficulty`.
  - Cơ chế phiên bản bất biến: Khi lưu/xuất bản, tạo phiên bản mới `v{n+1}` (`lv-{lessonId}-v2`), cập nhật `currentVersionId` của bài học, không ghi đè phiên bản cũ đang có học sinh làm.
- **Tệp nguồn:** [src/components/teacher/LessonEditorModal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/LessonEditorModal.tsx)

### Lỗi 2: Giáo viên không có danh sách học sinh, hiển thị fallback giả `{studentCount || 12}`
- **Nguyên nhân gốc:** Chưa có view chi tiết danh sách học sinh theo lớp cho giáo viên; số lượng học sinh ở thẻ lớp bị hardcode fallback `|| 12`.
- **Khắc phục:**
  - Xây dựng component mới [ClassRosterView.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/ClassRosterView.tsx) hiển thị bảng học sinh với mã học sinh, họ tên, trạng thái tài khoản, số bài được giao, tiến độ, điểm trung bình, lần học gần nhất.
  - Tích hợp tìm kiếm theo tên/mã học sinh, lọc trạng thái tài khoản.
  - Chức năng giáo viên/admin: Thêm học sinh mới (tự động gắn vào lớp, kiểm tra trùng mã), Khóa / Mở khóa tài khoản, Chuyển lớp học sinh, Đặt lại mật khẩu truy cập (không lộ mật khẩu cũ).
  - Backend API: `GET /api/teacher/classes` tự động đếm số lượng học sinh thực tế từ collection `users`; `GET /api/teacher/classes/:classId/students` tải danh sách học sinh chi tiết; `POST /api/teacher/classes/:classId/students`, `PATCH /api/teacher/students/:studentId`.
  - Xóa bỏ triệt để fallback `{c.studentCount || 12}` trong [TeacherPortal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/TeacherPortal.tsx).
- **Tệp nguồn:** [ClassRosterView.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/ClassRosterView.tsx), [TeacherPortal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/TeacherPortal.tsx), [server.ts](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/server.ts)

### Lỗi 3: Giao diện chính thức hiển thị các nút Demo Preset và nhãn môi trường demo
- **Nguyên nhân gốc:** Giao diện đăng nhập `AuthPortal.tsx` chứa khung gợi ý mật khẩu demo và nút bấm tự điền tài khoản; `MisconceptionAnalytics.tsx` mặc định hiển thị cả dữ liệu demo.
- **Khắc phục:**
  - Xóa hoàn toàn khung "Tài khoản Demo có sẵn" và các nút Demo Preset khỏi [AuthPortal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/auth/AuthPortal.tsx).
  - Chuyển `dataOriginFilter` mặc định trong [MisconceptionAnalytics.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/MisconceptionAnalytics.tsx) thành `'real'` để giáo viên chỉ xem kết quả học tập thực tế của học sinh.
  - Chuẩn hóa nhãn `environmentTag` sang `'production'` đối với toàn bộ dữ liệu tạo bởi giáo viên và học sinh vận hành.
- **Tệp nguồn:** [AuthPortal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/auth/AuthPortal.tsx), [MisconceptionAnalytics.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/MisconceptionAnalytics.tsx)

### Lỗi 4: Công thức tính điểm hardcode chia 80 và gian lận điểm từ client
- **Nguyên nhân gốc:** Thống kê chia cố định cho `completedAttempts * 80`; client tự gửi `score` và `isCorrect` lên server mà không có đối soát.
- **Khắc phục:**
  - Thay đổi công thức tính tỷ lệ điểm: Tính theo `(attempt.score / maxScore) * 100` của từng lượt làm đã hoàn thành hợp lệ (`status === 'completed'`).
  - Loại bỏ hoàn toàn điểm số của các lượt chưa hoàn thành (`in_progress`) khỏi giá trị trung bình.
  - Server-side grading: Endpoint `POST /api/student/attempts/:id/answer` đối chiếu trực tiếp `expectedAnswer` từ snapshot `lessonVersions`, tự động gán `isCorrect` chuẩn xác trên máy chủ, ngăn chặn gian lận điểm từ phía client.
  - Tích hợp `sessionStorage` trong [MissionPlayer.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/student/MissionPlayer.tsx): Khi học sinh nhấn F5, bài đang làm được phục hồi nguyên vẹn.
  - Nút "Luyện tập lại lượt mới" trong [CelebrationBadgeModal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/activities/CelebrationBadgeModal.tsx) tạo một lượt làm mới có timestamp độc lập, không ghi đè hoặc xóa lịch sử cũ.
- **Tệp nguồn:** [MisconceptionAnalytics.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/teacher/MisconceptionAnalytics.tsx), [server.ts](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/server.ts), [MissionPlayer.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/student/MissionPlayer.tsx), [CelebrationBadgeModal.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/activities/CelebrationBadgeModal.tsx)

### Lỗi 5: Kiểm định hoạt động Toán (So sánh hai nhóm & Nối cặp)
- **Nguyên nhân gốc:** Hoạt động so sánh hai nhóm chỉ vẽ một nhóm vật thể; Hoạt động `expression_match` khóa nút nộp bài khi học sinh nối đủ các cặp nhưng có cặp nối sai khiến học sinh không thể nộp bài để nhận gợi ý sửa lỗi.
- **Khắc phục:**
  - Cập nhật [VisualCounters.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/activities/VisualCounters.tsx): Hỗ trợ chế độ so sánh 2 nhóm trực quan (Nhóm Trái vs Nhóm Phải kèm biểu tượng `?` ở giữa).
  - Cập nhật [MissionPlayer.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/student/MissionPlayer.tsx): Cho phép trả về trạng thái `MATCHED_INCORRECT` khi đã nối hết các cặp, mở khóa nút nộp bài để học sinh nhận gợi ý chẩn đoán sai lầm sư phạm và thử lại.
- **Tệp nguồn:** [VisualCounters.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/activities/VisualCounters.tsx), [MissionPlayer.tsx](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/components/student/MissionPlayer.tsx), [mathEngine.ts](file:///c:/Users/Hii/Desktop/GITHUB/thamtunhi-main/thamtunhi-main/src/lib/mathEngine.ts)

---

## 7. BẢNG TỔNG HỢP KIỂM ĐỊNH TỪNG PHÂN HỆ (PASS / FAIL / BLOCKED)

| Phân Hệ & Chức Năng | Kết Quả | Chi Tiết Bằng Chứng Kỹ Thuật |
|---|---|---|
| **PHA 0: Kiểm toán & Sao lưu Firestore** | **PASS** | Đã kết nối đúng named database `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`. Xuất bản sao lưu toàn vẹn `backup/firestore-backup-latest.json` (413 KB, 61 users, 24 lessons, 24 versions). Không mất dữ liệu. |
| **PHA 1: Sửa lỗi Giáo viên chỉ thấy 1 câu** | **PASS** | `LessonEditorModal.tsx` đồng bộ đầy đủ 8 câu của từng bài học; biên tập đa trường (options, visual, hints, pairs); xuất bản phiên bản mới `v2` bất biến mà không ghi đè phiên bản cũ; khóa nút Lưu khi lỗi. |
| **PHA 2: Danh sách học sinh & Quản lý lớp** | **PASS** | Đã xây dựng `ClassRosterView.tsx`; giáo viên chỉ xem lớp phụ trách; học sinh hiển thị đầy đủ mã HS, trạng thái, tiến độ, điểm; thêm HS, khóa/mở khóa, đổi lớp, reset mã truy cập; xóa bỏ hoàn toàn fallback 12. |
| **PHA 3: Loại bỏ nhãn Demo khỏi giao diện** | **PASS** | Bỏ khung Demo Preset khỏi `AuthPortal.tsx`; mặc định lọc dữ liệu thật (`real`) trong `MisconceptionAnalytics.tsx`; bảo toàn 144 lượt làm mô phỏng cũ mà không trình bày sai nguồn gốc. |
| **PHA 4: Sửa thống kê và Lưu điểm** | **PASS** | Loại bỏ công thức chia 80 cố định; tỷ lệ điểm tính `score/maxScore` trên lượt hoàn thành hợp lệ; máy chủ chấm điểm độc lập tại `/api/student/attempts/:id/answer`; F5 không mất phiên làm; luyện tập lại tạo lượt mới độc lập. |
| **PHA 5: Kiểm định nội dung Toán** | **PASS** | `VisualCounters.tsx` hiển thị chuẩn 2 nhóm so sánh; `expression_match` mở khóa nút nộp khi nối sai để nhận phản hồi AI; chẩn đoán sư phạm kết nối đầy đủ. |
| **PHA 6: Kiểm thử tự động (Test Suite)** | **PASS** | **92/92 Unit & Integration Tests đạt 100% PASS** (gồm kiểm thử RBAC, xác thực 3 vai trò, proxy endpoints, server-side grading, roster management). `npm run build` hoàn thành trong 458ms không lỗi. |
| **PHA 7: Kiểm soát Git & Triển khai an toàn** | **PASS** | Toàn bộ mã nguồn đã commit trên nhánh `fix/antigravity-hardening` (commit `c9b6935`), đã push lên GitHub origin. Không commit file secrets hay passwords vào git. Chưa merge vào `main` và chưa deploy Production khi chưa có phê duyệt. |

---

## 8. THÔNG TIN GIT, PREVIEW VÀ PULL REQUEST

- **Working Branch:** `fix/antigravity-hardening`
- **Latest Commit:** `c9b6935` (`fix(p0): complete curriculum, roster management, multi-field lesson editor, and server-side grading`)
- **Remote Push Status:** Đã đẩy thành công lên `origin/fix/antigravity-hardening`
- **Link tạo Pull Request vào `main`:**
  [https://github.com/atitk10-prog/thamtunhi/compare/main...fix/antigravity-hardening?expand=1](https://github.com/atitk10-prog/thamtunhi/compare/main...fix/antigravity-hardening?expand=1)
- **Vercel Preview Deployment:** Vercel tự động kích hoạt preview deployment tương ứng với commit `c9b6935` trên nhánh `fix/antigravity-hardening`.
- **Cam kết an toàn:** Không tự động merge vào nhánh `main`, không tự động promote lên Production, không xóa dữ liệu Cloud. Hệ thống sẵn sàng cho chủ sở hữu kiểm tra nghiệm thu.
