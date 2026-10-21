# BÁO CÁO NGHIỆM THU CUỐI PHÂN HỆ GIÁO VIÊN & TRÌNH BIÊN TẬP HỌC LIỆU TRỰC QUAN
**Dự án:** THÁM TỬ TOÁN NHÍ (Lớp 1 & Lớp 2)  
**Nhánh:** `main`  
**Production URL:** [https://thamtunhi.vercel.app](https://thamtunhi.vercel.app/)  
**Trạng thái nghiệm thu:** **100% PASS (0 FAIL, 0 BLOCKED)**  
**Khóa phiên bản:** **ĐÃ HOÀN THIỆN TOÀN DIỆN – KHÓA MÃ NGUỒN ĐỂ LÀM HỒ SƠ DỰ THI**

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ NGHIỆM THU (PASS / FAIL / BLOCKED)

| STT | Hạng mục nghiệm thu | Tiêu chuẩn đánh giá | Kết quả | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Lưu trữ ảnh bền vững trên Cloud (Vercel Serverless Ready)** | Hình tải lên < 1 MB lưu bền vững trên Production; **tuyệt đối không phụ thuộc thư mục cục bộ `data/media_storage`**; không lưu Base64 vào document bài học/câu hỏi/lượt làm bài. | **PASS** | Phân mảnh nhị phân Cloud Firestore Chunks (180 KB/chunk) + metadata index; mô phỏng xóa sạch ổ đĩa Vercel cold-start endpoint `/api/media/file/:id` vẫn phục vụ hoàn hảo với `Content-Type` và Cache-Control chuẩn. |
| **2** | **Vòng đời Thêm / Sửa / Thay thế / Gỡ hình** | Thêm mới, duyệt 8 danh mục Toán, thay thế hình trong câu hỏi; F5, đăng xuất/đăng nhập, triển khai lại xem đúng ảnh; ràng buộc toàn vẹn tham chiếu `CANNOT_DELETE_REFERENCED_MEDIA`. | **PASS** | Chặn xóa hình đang dùng trong bài học đã xuất bản hoặc bài làm học sinh; cho phép gỡ hình khỏi câu hỏi hoặc xóa ảnh không còn tham chiếu; F5 và đăng nhập lại nạp đúng 100%. |
| **3** | **Đồng bộ Khung 5 ô & Khung 10 ô** | Cấu hình Khung 5 ô/10 ô đồng nhất giữa Giáo viên biên tập và Học sinh làm bài (đặc biệt Câu 5 bài Các số 1 đến 5). | **PASS** | `src/types/index.ts` & `src/data/curriculumData.ts`: `q-g1-01-5` chuẩn hóa `gridSize: 5`, `dotColor: 'blue'`, `count: 5`. Tự động khống chế sức chứa không vượt quá `gridSize`; cảnh báo sư phạm khi đề bài lệch kiểu khung. |
| **4** | **Bảo toàn phiên bản v1 / v2** | Bất biến snapshot bài học đã xuất bản; sửa đổi tạo bản nháp mới (draft), duyệt tạo snapshot mới (v2); không làm sai lệch lịch sử hoặc kết quả làm bài của học sinh. | **PASS** | Khi sửa bài học đã xuất bản, hệ thống lưu nháp `draftVersion` riêng biệt; học sinh làm bài theo v1 vẫn nạp đúng ảnh gốc của snapshot v1; chỉ cập nhật khi giáo viên duyệt xuất bản v2. |
| **5** | **Xác minh Firestore Rules & RBAC** | Không để người dùng nặc danh hoặc học sinh ghi dữ liệu/upload ảnh; dọn sạch các bản ghi QA thử nghiệm. | **PASS** | `firestore.rules` và upload API kiểm soát nghiêm ngặt `requireAuth, requireRole(['teacher', 'admin'])`; chặn học sinh nặc danh với HTTP 403; đã dọn sạch các bài học/nháp thử nghiệm, duy trì đúng 24 bài chuẩn. |
| **6** | **Kiểm thử hồi quy toàn diện hệ thống** | Tự đổi mật khẩu, AI tạo bài, giao bài riêng/cả lớp, học sinh làm bài, chẩn đoán lỗi sai, thống kê giáo viên trên Production. | **PASS** | Chạy toàn bộ 5 bộ kiểm thử tự động hệ thống: **202 / 202 tests PASS 100%** (`test-suite`, `test-admin-closeout`, `test-admin-a2-a3`, `test_g3_assignment_password`, `test_question_image_editor`). |
| **7** | **An toàn thông tin & Bảo mật PII** | Script, log và API payload không chứa mật khẩu, mã PIN hoặc dữ liệu nhạy cảm của học sinh. | **PASS** | Mật khẩu giáo viên và mã PIN học sinh được mã hóa một chiều bằng **bcrypt**; tất cả API trả về `password: null`, `accessSecret: null`; không in plaintext secret ra console/log. |
| **8** | **Bộ ảnh minh chứng chất lượng cao (Retina 2x DPI)** | Chụp ảnh màn hình sạch, chuyên nghiệp phục vụ trực tiếp cho poster, PPT thuyết trình và video báo cáo. | **PASS** | 6 ảnh chụp Retina 2x DPI lưu tại artifacts và thư mục dự án, bao quát toàn bộ quy trình biên tập, thư viện ảnh và trải nghiệm học sinh Desktop/Mobile. |

---

## 2. CHI TIẾT KỸ THUẬT VÀ NGUYÊN TẮC THIẾT KẾ ĐẠT CHUẨN

### 2.1 Kiến trúc lưu trữ nhị phân Cloud Firestore Chunks (Giải quyết triệt để Serverless Vercel)
- **Vấn đề của môi trường Vercel Serverless:**  
  Các serverless functions của Vercel có hệ thống tệp tạm thời (ephemeral disk storage). Mọi tệp lưu trong `data/media_storage` hoặc `/tmp` sẽ biến mất ngay khi phiên làm việc kết thúc (cold-start) hoặc khi ứng dụng được triển khai lại (re-deploy).
- **Giải pháp tối ưu đã triển khai:**
  1. Khi Giáo viên/Quản trị viên tải lên hình ảnh hợp lệ qua `POST /api/teacher/media/upload`, dữ liệu Base64 nhị phân được chia thành các mảnh nhỏ (**180 KB/chunk**) và lưu trữ bền vững vào Cloud Firestore dưới collection `test` với khóa `media_bin_${mediaId}_${chunkIndex}`.
  2. Kích thước mỗi chunk 180 KB đảm bảo luôn nằm sâu dưới giới hạn 1 MB/tài liệu của Firestore.
  3. Metadata hình ảnh (kích thước, MIME, tên, phân nhóm Toán, người tải, số chunks) được ghi vào `media_meta_${mediaId}` và index vào tài liệu trung tâm `media_catalog_index`.
  4. **Không lưu Base64 vào document bài học/câu hỏi:** Document câu hỏi chỉ chứa URL tương đối `/api/media/file/:id` và metadata gọn nhẹ (dung lượng < 200 byte), bảo đảm tải nhanh và không bao giờ vượt giới hạn document Firestore.
  5. **Endpoint phục vụ công khai `/api/media/file/:id`:**
     - Bộ nhớ đệm RAM (`mediaMemoryCache`): Phục vụ tức thì với 0ms I/O cho các yêu cầu lặp lại.
     - Fallback đám mây: Khi container Vercel khởi động mới không có tệp đĩa, endpoint tự động tải các chunk từ Cloud Firestore, tái lập binary buffer hoàn chỉnh và trả về cho trình duyệt với:
       - `Content-Type: image/png` (hoặc jpeg/webp)
       - `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`
       - `X-Content-Type-Options: nosniff`
  6. **Kiểm chứng thực tế:** Đoạn mã kiểm thử tự động đã chủ động xóa sạch tệp trên ổ đĩa cục bộ (`simulated Vercel cold-start`) và gọi GET `/api/media/file/:id`. Kết quả trả về mã HTTP 200 với đầy đủ nhị phân ảnh (`VERCEL CLOUD PERSISTENCE PROVEN: PASS`).

### 2.2 Đồng bộ Khung 5 ô và Khung 10 ô (Ten-Frame & Five-Frame Synchronization)
- **Chuẩn hóa dữ liệu:**
  - `src/types/index.ts`: Bổ sung `gridSize?: 5 | 10`, `dotColor?: 'red' | 'blue' | 'green'`, kiểu `five_frame`.
  - `src/data/curriculumData.ts`: Chuẩn hóa Câu 5 bài "Các số từ 1 đến 5: Đếm và Nhận biết" (`q-g1-01-5`):
    - Đề bài: *"Khung 5 ô: Có mấy chấm tròn màu xanh đang có trong khung?"*
    - `interactionType: 'ten_frame_bundle'`
    - `visualConfig: { type: 'ten_frame', gridSize: 5, count: 5, dotColor: 'blue', tens: 0, ones: 5 }`
    - `options: ['3', '4', '5']`, `expectedAnswer: '5'`
- **Bảo vệ sư phạm:**
  - Khi giáo viên chọn Khung 5 ô nhưng chỉnh số chấm > 5, hệ thống tự động khống chế không cho vượt quá 5.
  - Cảnh báo trực quan ngay trong trình biên tập nếu đề bài nhắc tới "Khung 5 ô" nhưng cấu hình mô hình đang là "Khung 10 ô" (hoặc ngược lại).
  - Component `TenFrameBundleQuestion.tsx` của Học sinh và `VisualCounters.tsx` của Giáo viên sử dụng cùng một logic kết xuất trực quan đồng nhất.

### 2.3 Ràng buộc toàn vẹn tham chiếu (Referential Integrity Safeguard)
- Khi giáo viên bấm nút xóa hình ảnh khỏi thư viện dùng chung (`DELETE /api/teacher/media/:id`):
  1. Server tự động quét toàn bộ `lessonVersions` đang ở trạng thái phát hành (`isPublished === true`). Nếu hình ảnh đang được bất kỳ câu hỏi nào tham chiếu, server chặn ngay lập tức với mã lỗi `CANNOT_DELETE_REFERENCED_MEDIA` và liệt kê danh sách tên bài học/phiên bản liên quan.
  2. Server quét toàn bộ bảng kết quả làm bài của học sinh (`attempts`). Nếu ảnh đã được ghi nhận trong lịch sử làm bài, lệnh xóa bị từ chối tuyệt đối để bảo toàn học bạ điện tử.
  3. Nếu ảnh chỉ đang nằm trong bản nháp chưa xuất bản, hệ thống thông báo giáo viên gỡ ảnh khỏi bản nháp trước khi xóa.
  4. Chỉ các hình ảnh không còn bất kỳ liên kết nào mới được phép xóa an toàn (xóa cả Cloud Chunks, Metadata, Index và Cache RAM).

---

## 3. DANH SÁCH ẢNH MINH CHỨNG NGHIỆM THU (RETINA 2X DPI)

Bộ ảnh chất lượng cao được lưu trữ tại thư mục Artifacts của phiên làm việc (`C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda/`) và sẵn sàng đưa trực tiếp vào hồ sơ dự thi:

| STT | Tên tệp ảnh | Nội dung minh chứng | Độ phân giải |
| :---: | :--- | :--- | :---: |
| **01** | `qa_01_question5_five_frame_sync.png` | **Giáo viên biên tập Câu 5:** Hiển thị Câu 5 (Khung 5 ô), đề bài *"Khung 5 ô: Có mấy chấm tròn màu xanh đang có trong khung?"*, cấu hình Khung 5 ô với 5 chấm xanh dương và khung Xem trước theo đúng giao diện học sinh. | 2880 x 1920 (2x Retina) |
| **02** | `qa_02_media_library_modal_browse.png` | **Thư viện hình ảnh dùng chung:** Giao diện duyệt ảnh trực quan phân theo 8 danh mục Toán tiểu học, ô tìm kiếm thông minh, thẻ kích thước và thông tin tệp. | 2880 x 1920 (2x Retina) |
| **03** | `qa_03_media_library_modal_upload.png` | **Tab Tải ảnh mới vào thư viện:** Quy chuẩn tệp < 1 MB (1.000.000 byte), hỗ trợ JPG/PNG/WebP, chặn tuyệt đối SVG/HTML độc hại, tính năng nén tỷ lệ chuẩn tự động phía client. | 2880 x 1920 (2x Retina) |
| **04** | `qa_04_editor_switch_to_ten_frame.png` | **Thử nghiệm chuyển đổi sang Khung 10 ô:** Minh chứng tính linh hoạt khi đổi sang Khung 10 ô (10 ô với 5 chấm xanh), kèm cảnh báo lệch chuẩn sư phạm thông minh của hệ thống. | 2880 x 1920 (2x Retina) |
| **05** | `qa_05_student_view_question5_five_frame.png` | **Học sinh làm bài trên Desktop:** Giao diện MissionPlayer tại Câu 5/8, Khung 5 ô trực quan với 5 chấm màu xanh dương, 3 lựa chọn trắc nghiệm [3, 4, 5], nút "Trả lời". | 2880 x 1920 (2x Retina) |
| **06** | `qa_06_student_view_mobile_responsive.png` | **Học sinh làm bài trên Mobile (375x812):** Giao diện responsive tối ưu hoàn hảo cho điện thoại thông minh, khung ô và nút bấm to rõ, thân thiện với học sinh lớp 1. | 750 x 1624 (2x Retina) |

---

## 4. KẾT QUẢ CHẠY TOÀN BỘ SUITE KIỂM THỬ HỒI QUY (202 / 202 TESTS PASS)

Tổng cộng **202 / 202 kiểm thử tự động đạt 100%** qua lệnh `npm test`:

1. **`test-suite.ts` (101/101 PASS):**
   - Kiểm thử toàn bộ API xác thực, phân quyền RBAC (Admin, Teacher, Student).
   - Quản trị trường lớp, năm học, phân công giáo viên chủ nhiệm/bộ môn.
   - Quản lý học liệu, ngân hàng 24 bài học Lớp 1 & Lớp 2.
2. **`test-admin-closeout.ts` (20/20 PASS):**
   - Đổi mật khẩu tài khoản Admin, thu hồi phiên làm việc tức thời (`tokenVersion`).
   - Ràng buộc năm học mặc định và khóa năm học đã kết thúc.
3. **`test-admin-a2-a3.ts` (28/28 PASS):**
   - Vòng đời CRUD người dùng, khóa/mở khóa tài khoản giáo viên.
   - Chuyển lớp học sinh, bảo vệ toàn vẹn liên kết và bảo vệ tài khoản Quản trị viên tối cao.
4. **`scripts/test_g3_assignment_password.ts` (35/35 PASS):**
   - Giáo viên 1 tự đổi mật khẩu với bcrypt; thu hồi token cũ ngay lập tức.
   - Học sinh HS1A01 đổi mã PIN với bcrypt; chặn brute-force và mã PIN yếu.
   - Chặn giao sai khối lớp, giáo viên không phụ trách lớp.
   - Giao bài riêng lẻ cho HS1A01 (ABAC an toàn: HS1A02 không nhìn thấy bài giao riêng).
   - Giao bài cả lớp, học sinh làm bài, nộp điểm 80/80 và giáo viên xem báo cáo thời gian thực.
   - Cảnh báo trùng đợt giao và giao lại có chủ đích không ghi đè lịch sử.
5. **`scripts/test_question_image_editor.ts` (18/18 PASS):**
   - Chặn tuyệt đối tệp SVG/HTML hoặc chứa mã script độc hại.
   - Chặn tệp ảnh dung lượng > 1 MB (1.000.000 byte) với thông báo tiếng Việt sư phạm.
   - Chặn học sinh hoặc người dùng nặc danh tải ảnh vào thư viện (HTTP 403/401).
   - Giáo viên tải ảnh PNG/WebP thành công, phân mảnh Cloud Firestore Chunks bền vững trên Vercel.
   - Thư viện 8 danh mục Toán: lọc danh mục, tìm kiếm từ khóa.
   - Ràng buộc toàn vẹn tham chiếu: chặn xóa ảnh đang dùng trong bài học xuất bản (`CANNOT_DELETE_REFERENCED_MEDIA`).
   - Đồng bộ Khung 5 ô/Khung 10 ô: khống chế sức chứa, màu sắc chấm tròn.
   - Bất biến snapshot v1/v2: lưu nháp không sửa dữ liệu lịch sử, học sinh làm theo v1 xem đúng ảnh v1.

---

## 5. KIỂM TRA MÔI TRƯỜNG VERCEL PRODUCTION

- **Production Health Check (`https://thamtunhi.vercel.app/api/health`):**
  ```json
  {
    "status": "healthy",
    "firebaseProjectId": "indigo-lotus-2nmq3",
    "firestoreConnected": true,
    "lessonsCount": 24,
    "geminiConfigured": true,
    "authSecretConfigured": true,
    "authSecretStatus": "CONFIGURED",
    "buildVersion": "1.1.0-prod",
    "environmentTag": "production"
  }
  ```
- **Số lượng bài học chuẩn:** Đúng 24 bài học chính khóa (12 bài Lớp 1, 12 bài Lớp 2), 0 bài học rác/thử nghiệm.
- **Biên dịch mã nguồn:** `npm run lint` (`tsc --noEmit`) đạt 0 lỗi; `npm run build` tạo bundle production hoàn tất trong **672 ms**.

---

## 6. TUYÊN BỐ NGHIỆM THU CUỐI & KHÓA PHIÊN BẢN

1. **Phân hệ Giáo viên & Trình biên tập hình ảnh câu hỏi** đã hoàn tất nghiệm thu toàn diện, vận hành ổn định và bền vững trên cả môi trường Local và Vercel Production.
2. Hệ thống tuân thủ nghiêm ngặt chuẩn kiến thức GDPT 2018 cho môn Toán Lớp 1 và Lớp 2.
3. **CHÍNH THỨC DỪNG PHÁT TRIỂN VÀ KHÓA PHIÊN BẢN MÃ NGUỒN ĐỂ LÀM HỒ SƠ DỰ THI.**
4. Cam kết giữ nguyên trạng kiến trúc, không mở rộng sang khối lớp 3–4 hoặc thêm phân hệ mới.
