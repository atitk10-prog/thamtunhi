# LỆNH DUY NHẤT – CHỐT THÁM TỬ TOÁN NHÍ TRONG HÔM NAY

Bạn là người chịu trách nhiệm phát hành dự án đang mở trong Antigravity, nhánh `fix/antigravity-hardening`. Tiếp tục từ commit mới nhất, KHÔNG tạo lại dự án, KHÔNG chạy seed, KHÔNG xóa dữ liệu, KHÔNG mở thêm tính năng, KHÔNG khởi động lại quy trình sửa từ đầu.

Tôi đã nhận báo cáo `FINAL_DATA_CURRICULUM_ROSTER_QA.md`: Agent báo 92/92 test PASS, Firestore có 24 lessonVersions x 8 câu, 4 lớp và 50 học sinh. Nhưng Browser Subagent CDP thất bại; báo cáo chưa chứng minh toàn bộ quy trình end-to-end. Lần này phải KIỂM THỬ THẬT và sửa lỗi phát hiện ngay trong cùng lượt.

## A. CHẠY PLAYWRIGHT HEADLESS ĐỘC LẬP

1. Không dùng lại Browser Subagent/CDP lỗi. Sử dụng Playwright Node/CLI trực tiếp, headless Chromium qua `npx playwright test` (cấu hình / cài trình duyệt nếu cần). Khởi động ứng dụng với backend thực, test ở localhost rồi ở Vercel Preview mới, ghi video/screenshot/trace và log lỗi.
2. Kiểm tra `npm ci`, `npm run lint`, `npm run build`, `npm test` và lưu kết quả thật. Nếu build lỗi, sửa rồi chạy lại.
3. Không báo PASS nếu chỉ kiểm tra mã trả HTTP 200 hoặc trang hiển thị. Mọi bước cần assertion về DOM, kết quả API và bản ghi dữ liệu.

## B. BẢY BÀI KIỂM TRA END-TO-END BẮT BUỘC

**E2E-01 Auth và phân quyền:** Đăng nhập bằng Học sinh, Giáo viên, Admin trên Preview; kiểm tra lưu phiên sau F5, logout, khóa tài khoản, không thể truy cập API khác vai trò. Đảm bảo không còn đăng nhập Google chỉ bằng UID/email do client tự khai; không dùng mật khẩu/secret mặc định trên Production.

**E2E-02 Quản trị:** Admin xem 4 lớp, đối chiếu 50 học sinh từ Firestore; kiểm tra tạo, đọc, sửa, khóa, mở khóa, phân công lớp của tài khoản QA có ID duy nhất. Chỉ dọn chính bản ghi QA sau khi đã đối soát, không xóa bất kỳ tài khoản/hồ sơ cũ nào. Kiểm tra status khóa chặn đăng nhập thực sự.

**E2E-03 Danh sách học sinh:** Giáo viên 1 nhìn thấy lớp 1A, 1B theo phân công; mở lớp thấy danh sách từng học sinh đúng Firebase; tìm kiếm, xem tiến độ và chọn học sinh giao bài. Không hardcode số lượng 12. Không đọc được lớp của giáo viên 2 nếu không được phân quyền.

**E2E-04 Học liệu và biên tập:** Tất cả 24 bài đều truy xuất được currentVersionId và 8/8 câu; giáo viên mở modal phải thấy cả 8 câu, không có fallback một câu mẫu. Mở bài này rồi bài khác không dính state. Test lưu nháp và tạo phiên bản mới trên dữ liệu QA an toàn, so sánh toàn bộ fields của câu hỏi, không ghi đè bản bài đã giao.

**E2E-05 Học sinh và điểm:** Làm một bài lớp 1 và một bài lớp 2 với 6 kiểu tương tác, gồm câu sai lần 1, đúng lần 2, nối cặp sai rồi sửa, so sánh 4 sao và 2 sao phải hiển thị hai nhóm, không khóa nút nộp khi đã chọn đủ. Điểm hiển thị đầy đủ tử/mẫu, ví dụ 10/80; không có `10 /`. F5 giữa bài khôi phục đúng câu/điểm; luyện lại tạo attempt mới mà không ghi đè lượt cũ.

**E2E-06 Kiểm soát gian lận và số liệu:** Gửi request cố tình khai `isCorrect: true`, `score: 999`, `maxScore: 999` với đáp án sai; server phải từ chối hoặc tự tính lại từ snapshot đáp án đã duyệt. Đối chiếu điểm hoàn thành và CSV/thống kê với dữ liệu attempts/answers; không chia cứng cho 80 khi bài khác số câu. Rà soát 144 lượt gắn `simulation`: không đổi nguồn gốc thành học thật, không xóa nếu chưa có phê duyệt; giao diện chính không hiển thị Demo gây nhầm lẫn.

**E2E-07 Vercel Production readiness:** Kiểm tra `/api/health`, backend, Auth, named Firestore DB, Vercel env cần có; Gemini `GEMINI_API_KEY` nếu chưa có ghi BLOCKED và hướng dẫn chủ sở hữu cấp key; nếu có phải test tạo bài bằng AI thật. Quét secrets trong Git và log; thay/bắt buộc cấu hình `AUTH_SECRET` ngẫu nhiên và vô hiệu hóa mật khẩu Demo/bypass secret đã công khai trước khi xuất bản.

## C. BẢO VỆ DỮ LIỆU VÀ TRIỂN KHAI

- Dữ liệu cần giữ: 24 bài học, phiên bản, 4 lớp, học sinh, giao bài, bài đã làm, các bản ghi audit. Không tự sửa nguồn gốc dữ liệu, không xóa hàng loạt; backup ở nơi riêng tư, không commit/tải công khai backup có dữ liệu cá nhân hoặc mật khẩu.
- Mọi lỗi phát hiện: ghi FAIL -> sửa tại tệp nguồn -> thêm regression test -> chạy lại E2E liên quan -> PASS kèm bằng chứng. Không dừng chỉ vì CDP lỗi; dùng cách headless độc lập.
- Mục tiêu một Preview CUỐI CÙNG từ commit mới nhất, không tạo Preview liên tiếp khi chưa hoàn thành QA.
- Sau khi toàn bộ P0 PASS, tạo PR từ nhánh sửa vào main; soát diff/secrets, không force-push. Chưa tự merge main, thay đổi Rules Cloud hoặc deploy Production khi chưa có phê duyệt chủ sở hữu.

## D. BÀN GIAO DUY NHẤT

Tạo `RELEASE_TODAY_GATE.md` gồm:
- Phiên bản SHA, URL Preview, kết quả 7 E2E với ảnh/video/trace và mã HTTP.
- Danh sách file sửa, test bổ sung, kết quả lint/build/unit/integration.
- Số câu đúng từng bài (24 x 8), số học sinh theo lớp, thống kê Firebase trước/sau, chứng minh không xóa nhầm.
- Chức năng còn FAIL/BLOCKED; thao tác người dùng cần làm (biến môi trường, xác nhận Rules, duyệt PR/Production).
- Cuối báo cáo kết luận duy nhất `READY FOR PRODUCTION` hoặc `NOT READY`; không ghi READY khi P0, bảo mật hoặc E2E còn FAIL.

BẮT ĐẦU CHẠY PLAYWRIGHT HEADLESS NGAY, chủ động sửa các lỗi được phát hiện, không chỉ trả lời bằng kế hoạch.
