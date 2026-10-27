# BẢNG MA TRẬN CHỨC NĂNG (FEATURE MATRIX)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ | TOÁN LỚP 1–2 GDPT 2018 | FIREBASE CLOUD-FIRST

| STT | Phân hệ | Tên Chức Năng / Nút Bấm | Trạng Thái | Mô Tả & Bằng Chứng Kỹ Thuật |
| :--- | :--- | :--- | :---: | :--- |
| **I** | **HẠ TẦNG CLOUD** | | | |
| 1 | Hạ tầng | Cloud-First Firestore Provisioning | **PASS** | Đã kích hoạt project thật `indigo-lotus-2nmq3` và DB `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`. |
| 2 | Hạ tầng | Deploy Firestore Security Rules | **PASS** | Đã triển khai quy tắc bảo mật ABAC lên Cloud qua RPC `DeployRules`. |
| 3 | Hạ tầng | Node.js Express + Vite Full-Stack | **PASS** | Khởi chạy qua `server.ts` tích hợp middleware dev và static prod. |
| **II** | **XÁC THỰC (AUTH)** | | | |
| 4 | Auth | Cổng Học sinh (Mã HS + Mật khẩu cá nhân) | **PASS** | Đăng nhập bảo mật không thu PII (email/SĐT), xác thực server, duy trì phiên qua F5. |
| 5 | Auth | Cổng Giáo viên (Email/Mật khẩu & Google) | **PASS** | Đăng nhập phân quyền Role teacher, hỗ trợ tài khoản demo và Google Sign-in. |
| 6 | Auth | Cổng Quản trị viên (Admin) | **PASS** | Đăng nhập phân quyền Super Admin, toàn quyền giám sát hệ thống. |
| 7 | Auth | Nút Đăng xuất (Logout) | **PASS** | Xóa sạch phiên làm việc trên client và phục hồi giao diện đăng nhập an toàn. |
| **III** | **HỌC SINH (STUDENT)** | | | |
| 8 | Học sinh | Bàn Nhiệm Vụ (Danh sách bài tập) | **PASS** | Hiển thị bài tập phân công theo lớp (1A, 1B, 2A, 2B), trạng thái Chưa làm / Đang làm / Đã xong. |
| 9 | Học sinh | Tương tác 1: Chọn 1 đáp án trắc nghiệm | **PASS** | Thẻ lựa chọn kích thước lớn &gt;48px, hình ảnh trực quan (táo, cá, sao). |
| 10 | Học sinh | Tương tác 2: Nhập số trực tiếp | **PASS** | Bàn phím số ảo lớn thân thiện với học sinh 6–8 tuổi, hỗ trợ xóa và xóa hết. |
| 11 | Học sinh | Tương tác 3: Chọn dấu phép tính & so sánh | **PASS** | Chạm chọn dấu `+`, `-`, `&gt;`, `&lt;`, `=` trực quan. |
| 12 | Học sinh | Tương tác 4: Nối cặp phép tính - kết quả | **PASS** | Cơ chế "Chạm vật nguồn – Chạm vật đích", không đòi hỏi kéo thả phức tạp trên mobile. |
| 13 | Học sinh | Tương tác 5: Khung 10 ô & Bó que tính | **PASS** | Mô hình Ten-Frame 10 chấm tròn và bó chục (10 que) kèm que lẻ tách gộp chục - đơn vị. |
| 14 | Học sinh | Tương tác 6: Trục số & Sắp xếp thứ tự | **PASS** | Mô hình trục số nhảy bước và chạm ghép dãy số tăng/giảm dần. |
| 15 | Học sinh | Nghe đọc câu hỏi (Text-to-Speech) | **PASS** | Tệp MP3 tiếng Việt chuẩn tốc độ 0.9x thân thiện cho Lớp 1, loại trừ 100% SpeechSynthesis để triệt tiêu giọng đọc nước ngoài. |
| 16 | Học sinh | Manh mối Thám tử (Feedback gợi ý lỗi sai) | **PASS** | Khi làm sai, mascot Thám tử Cáo hiện kính lúp, chỉ ra mẫu lỗi và cho phép thử lại. |
| 17 | Học sinh | Huy hiệu & Pháo hoa chúc mừng | **PASS** | Trao huy hiệu cá nhân (Kính Lúp Thông Thái, Thám Tử Đại Tài) và pháo hoa khi hoàn thành. |
| 18 | Học sinh | Tự động lưu tiến độ lên Cloud | **PASS** | Cập nhật `attempts` và `attemptAnswers` ngay trong quá trình làm bài. |
| **IV** | **GIÁO VIÊN (TEACHER)** | | | |
| 19 | Giáo viên | Kho học liệu 24 bài học GDPT 2018 | **PASS** | Lọc theo Khối 1, Khối 2, tìm kiếm chủ đề, phân biệt Trạng thái xuất bản / Bản nháp. |
| 20 | Giáo viên | Xem trước như học sinh (Preview) | **PASS** | Trải nghiệm tương tác bài học trực tiếp mà không tạo bản ghi attempt giả vào hệ thống. |
| 21 | Giáo viên | Soạn thảo bài học thủ công đầy đủ | **PASS** | Thêm, sửa, xóa, nhân bản, đổi thứ tự câu hỏi; hỗ trợ tất cả 6 dạng tương tác. |
| 22 | Giáo viên | Phiên bản bất biến (v1 ➔ v2) | **PASS** | Bài học đã xuất bản được lưu thành snapshot bất biến, chỉnh sửa tạo version mới. |
| 23 | Giáo viên | AI Tạo Bài Nháp (Gemini 2.5 Flash) | **PASS** | Sinh bài tập theo chuẩn GDPT 2018; xử lý thông báo "AI chưa cấu hình" nếu thiếu key. |
| 24 | Giáo viên | Giao bài cho lớp với Idempotency | **PASS** | Giao cho một hoặc nhiều lớp, chống trùng lặp qua `idempotencyKey`. |
| 25 | Giáo viên | Phân tích phân phối mẫu lỗi học sinh | **PASS** | Biểu đồ trực quan 9 nhóm lỗi toán học kèm biện pháp sư phạm khắc phục. |
| 26 | Giáo viên | Bộ lọc dữ liệu Thật / Mô phỏng | **PASS** | Lọc tách bạch giữa dữ liệu khảo nghiệm (simulation) và dữ liệu học tập thật (real). |
| 27 | Giáo viên | Xuất báo cáo CSV UTF-8 BOM | **PASS** | Xuất file CSV tiếng Việt chuẩn UTF-8 có BOM, mở đúng font trên Microsoft Excel. |
| 28 | Giáo viên | AI Tóm tắt & Đề xuất củng cố lớp học | **PASS** | Phân tích xu hướng lỗi tổng hợp và gợi ý bài tập củng cố trên lớp cho giáo viên. |
| **V** | **QUẢN TRỊ VIÊN (ADMIN)** | | | |
| 29 | Quản trị | Giám sát sức khỏe hệ thống (Health Check) | **PASS** | Kiểm tra Firestore, Auth, AI, build version và số lượng đối tượng dữ liệu. |
| 30 | Quản trị | Quản lý Tài khoản & Phân quyền | **PASS** | Tạo tài khoản Giáo viên và Học sinh, quản lý mã học sinh an toàn. |
| 31 | Quản trị | Khởi tạo dữ liệu mẫu Cloud (Apply Seed) | **PASS** | Tự động tạo 1 Admin, 2 GV, 4 Lớp, 48 HS, 24 Bài, 192 Câu hỏi, 24 Đợt giao, 144 Attempts. |
| 32 | Quản trị | Chạy thử nghiệm Seed (--dry-run) | **PASS** | Xem trước kế hoạch đối tượng sẽ tạo mà không ghi vào cơ sở dữ liệu. |
| 33 | Quản trị | Dọn dẹp Scoped Demo Data | **PASS** | Chỉ xóa đúng namespace `dataOrigin: 'simulation'`, bảo toàn dữ liệu thật. |
| 34 | Quản trị | Nhật ký an toàn (Audit Log) | **PASS** | Ghi nhận bất biến mọi thao tác hệ thống, phân quyền và dọn dẹp dữ liệu. |
| **VI** | **TRIỂN KHAI & REPO** | | | |
| 35 | DevOps | Tương thích Cloud Run & AI Studio Build | **PASS** | Ứng dụng chạy đúng cổng 3000, cấu hình sẵn sàng cho Cloud Run. |
| 36 | DevOps | GitHub Push & Rollout Readiness | **PASS** | Chuẩn bị đầy đủ cấu trúc repo, script build, `.gitignore` chặn rò rỉ secret. |
