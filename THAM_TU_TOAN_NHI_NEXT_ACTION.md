# THÁM TỬ TOÁN NHÍ — CHỐT FIREBASE AUTH VÀ PHÁT HÀNH AN TOÀN

## Bối cảnh đã xác định
- Workspace hiện tại: `c:\Users\Hii\Desktop\GITHUB\thamtunhi-main\thamtunhi-main`.
- Repo: `https://github.com/atitk10-prog/thamtunhi`.
- Vercel Production: `https://thamtunhi.vercel.app` (không đẩy ngay).
- Git local nhánh `fix/antigravity-hardening`, commit báo cáo: `71cbedc`, `91174f1`; remote chưa được push.
- Firebase project ID: `indigo-lotus-2nmq3`.
- Firestore named database: `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`.
- Vercel Preview lần cuối Agent báo: `https://thamtunhi-nfyshyz79-tinhs-projects-2f14d110.vercel.app`.
- Agent báo 56/56 tests PASS, nhưng xung đột HMAC session / Firestore `request.auth.uid` CHƯA GIẢI QUYẾT. Gemini chưa cấu hình. Rules Cloud chưa deploy. Kết quả báo cáo chưa thay cho E2E sau khi triển khai Rules.

## NHIỆM VỤ CHO ANTIGRAVITY AGENT

Bạn là kỹ sư trưởng full-stack và bảo mật Firebase. Sửa TRỰC TIẾP workspace hiện tại, không tạo lại dự án. Đọc `FINAL_CLOUD_RELEASE_GATE.md`, `RECOVERY_STATUS.md`, `server.ts`, `src/lib/authSession.ts`, `src/firebase/` (nếu có), `firestore.rules`, `firebase.json`, `api/index.ts`, `vercel.json`, `package.json`, các trang Admin/Teacher/Student, cùng toàn bộ đường đọc ghi Firestore.

### A. Bảo toàn và kiểm toán
1. `git status` trước khi sửa; sao lưu không ghi đè; KHÔNG `git reset --hard`, `git clean`, xóa Cloud hoặc chạy seed/cleanup production.
2. Kiểm tra secret đã lộ trong README, demo manifest, frontend, tests, logs, nhánh Git và lịch sử repository; chuẩn bị phương án đổi mật khẩu admin, giáo viên, demo student; thu hồi Vercel Protection Bypass token từng hiển thị log. Không xuất secrets trong kết quả.
3. Kiểm tra Firestore Cloud đang dùng Rules nào; nếu rules công khai, báo rủi ro P0 ngay và không khai thác/xử lý học sinh thật trước khi khóa an toàn. Sao lưu dữ liệu và rules Cloud trước thao tác có thay đổi.

### B. Sửa triệt để XUNG ĐỘT XÁC THỰC P0
- Login hiện tại: API cấp token HMAC, nhưng client dùng Firestore SDK trực tiếp; HMAC token không có giá trị với `request.auth` Firestore.
- Ưu tiên giữ UX đăng nhập bằng MÃ HỌC SINH + MẬT KHẨU và email/mật khẩu cho giáo viên, admin; không buộc học sinh có email.
- Áp dụng một kiến trúc hoàn chỉnh, nhất quán: sau khi backend xác thực thông tin người dùng bằng mật khẩu băm, dùng Firebase Admin SDK tạo Firebase Custom Token cho đúng UID/role; frontend gọi `signInWithCustomToken(auth, customToken)` để có phiên Firebase Auth hợp lệ, đồng thời dùng ID Token hợp lệ khi gọi các API phù hợp. Đối chiếu và chuẩn hóa UID Firestore/Auth, vai trò và dữ liệu thuộc lớp; không tự thay đổi định danh/cấp quyền. Nếu chọn phương án backend-only thay vì custom token, phải di chuyển toàn bộ truy cập Firestore qua API có Firebase Admin SDK + kiểm tra phân quyền server, không để client Firestore SDK dựa vào HMAC.
- TUYỆT ĐỐI không cho frontend tự gán role, không dùng mật khẩu plaintext trong Firestore, không tái tạo hardcoded account, không tiết lộ Firebase service account hoặc Gemini key trong client/log/Git. Dùng biến môi trường an toàn ở Vercel. Bảo vệ API Admin; kiểm tra vai trò từ nguồn tin cậy.
- Kiểm thử sau login phải xác nhận có `auth.currentUser?.uid` thật, `request.auth.uid` hợp lệ; học sinh chỉ đọc bài của lớp và bài làm của mình; giáo viên không sửa lớp khác; Admin đúng quyền; logout và F5 còn đúng phiên; không còn PERMISSION_DENIED trái ý.
- Bật Email/Password **chỉ nếu** kiến trúc đã chọn dùng `signInWithEmailAndPassword`; chỉ bật provider không tự sửa lỗi nếu vẫn dùng token HMAC. Firebase Custom Token không yêu cầu học sinh cung cấp email.

### C. Rules đúng database
- Chuẩn hóa Rules deny-by-default; test bằng Firebase Emulator Rules Unit Testing với trường hợp được phép và bị cấm, tránh tình trạng chỉ kiểm tra chuỗi nguồn; kiểm tra tất cả query phù hợp điều kiện rules.
- Xác định database thực có tên `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`, không deploy nhầm `(default)`.
- Không deploy Cloud Rules khi chưa kiểm chứng Auth và chưa có phương án khôi phục. Chuẩn bị quy trình deploy và rollback chính xác. Nếu cần người dùng phê duyệt một thao tác có thể ảnh hưởng dữ liệu, dừng ở bước đó.

### D. Vercel, AI, GitHub
- Kiểm tra `AUTH_SECRET` nếu cơ chế HMAC còn được sử dụng phải có giá trị random bền vững và bắt buộc; không dùng fallback thiếu an toàn. Biến `GEMINI_API_KEY` dùng duy nhất server side, giới hạn quyền và rate limit; nếu thiếu thì đánh dấu BLOCKED, không báo PASS AI.
- Tránh dùng cùng dữ liệu Cloud thực cho tests có ghi; dùng bản thử nghiệm được phân tách, không tạo seed mới trên production.
- Chạy `npm run lint`, `npm run build`, `npm test`, test firebase rules, API, E2E trên browser desktop + mobile, kiểm tra trên Preview mới với ENV mới; health 200 chưa đủ, phải kiểm tra CREATE/READ/UPDATE/ASSIGN/SUBMIT/REVIEW thật.
- Rà soát Git changes, `.gitignore` và secrets; tạo commit trên nhánh `fix/antigravity-hardening`. KHÔNG push lên `main` hoặc promote Production khi chưa được người dùng chấp thuận. Nếu được phép đẩy nhánh sau kiểm tra, đảm bảo GitHub không chứa tài khoản demo cũ, mật khẩu hoặc secret trong HEAD hoặc lịch sử công khai (báo rõ nếu lịch sử cũ vẫn lộ và phải rotate).

### E. Bằng chứng và điểm dừng
- Tạo `FINAL_READY_TO_PUBLISH.md` có bảng PASS/FAIL/BLOCKED/NOT TESTED kèm bằng chứng, Firebase projectId, named database, Preview deployment ID, commit, danh sách ENV chỉ theo TÊN biến (không kèm giá trị), bộ kiểm thử 3 vai trò và 6 dạng Toán, hướng dẫn các bước cần tôi thao tác thủ công theo thứ tự.
- Chỉ đề xuất lệnh `npx vercel deploy --prod` khi Rules Cloud đã được xác nhận, xác thực đầu cuối chạy đúng, bảo mật PASS, Preview PASS, và tôi phê duyệt. Không khẳng định Production đã hoạt động nếu chưa chạy nghiệm thu trên URL thật.

BẮT ĐẦU NGAY: khắc phục mâu thuẫn Firebase Auth/Firestore P0 trước mọi bước cấu hình/deploy. Không dừng ở phân tích mà sửa, kiểm thử và báo cáo thực tế; chờ xác nhận của tôi trước thao tác Cloud rủi ro hoặc phát hành Production.
