# PROMPT TIẾP TỤC HOÀN THIỆN THÁM TỬ TOÁN NHÍ – SAU BÁO CÁO P0

Bạn là kỹ sư trưởng Full-stack, Firebase Security, Vercel và kiểm thử ứng dụng giáo dục. Hãy **tiếp tục làm việc trên workspace thamtunhi-main đang mở**, KHÔNG tạo dự án mới, KHÔNG làm lại từ đầu.

## Bối cảnh đã có, phải xác minh lại trước khi tin
- Agent trước đã báo `npm test` 36/36 PASS, build/lint PASS, Vercel Preview có `/api/health` HTTP 200 và đăng nhập thử nghiệm HTTP 200.
- Agent nói đã thêm `api/index.ts`, `vercel.json`, mã đăng nhập HMAC-SHA256, Firestore Rules hạn chế quyền; Gemini chưa có khóa hoạt động.
- **CẢNH BÁO:** GitHub `main` còn phiên bản cũ, chưa có tệp Vercel mới và còn Firestore Rules mở. Sửa tệp Rules tại local KHÔNG đồng nghĩa đã deploy Rules lên Cloud. Báo cáo E2E local không tương đương E2E trên Production.
- Nhật ký Agent từng in bypass token Vercel và mật khẩu demo; tuyệt đối KHÔNG sao chép, in lại, đẩy Git hoặc báo cáo các secret đó. Phải hướng dẫn chủ sở hữu xoay/thu hồi secret đã bị lộ.
- Dữ liệu trên Firebase Cloud hiện có phải được giữ nguyên; KHÔNG chạy seed/cleanup/migration ghi vào Production; không dùng dữ liệu học sinh thật khi kiểm thử.

## Quy tắc an toàn và công việc đầu tiên
1. Xác định đúng thư mục repository thực sự (có thể có `thamtunhi-main/thamtunhi-main`), remote, branch, commit HEAD, `git status`, `git diff` và trạng thái chưa commit. Đọc `RECOVERY_STATUS.md`, `QA_FINAL_ACCEPTANCE.md`, `P0_SECURITY_FIX_REPORT.md`, `VERCEL_RUNTIME_FIX_REPORT.md`, `VERCEL_DEPLOY_CHECKLIST.md` và mã nguồn tương ứng; báo cáo tệp nào thực có, tệp nào thiếu.
2. Sao lưu an toàn và tạo branch mới từ trạng thái đã nhận dạng, bảo toàn thay đổi chưa commit; KHÔNG `git reset --hard`, `git clean`, force push, ghi đè backup hay xóa dữ liệu Cloud.
3. Rà soát repository để phát hiện bí mật lộ ở README, source, git history, logs, artifact và .env; **không in giá trị mật khẩu, JWT, khóa API, bypass token hoặc service-account JSON**. Thống kê loại lộ, vị trí, cách thu hồi. Nếu cần thao tác Console mà chưa được ủy quyền, đánh dấu BLOCKED và ghi hướng dẫn chính xác.

## P0-A: CHỐT KIẾN TRÚC XÁC THỰC (KHÔNG CHẤP NHẬN LAI HỎNG)
- Xác định chính xác mọi đường truy cập Firestore từ `src/`, `server.ts` và `api/index.ts`: Firebase Web SDK trực tiếp hay server; lập sơ đồ đường đi đăng nhập -> request -> Rules/backend -> database.
- **Kiểm tra xung đột quan trọng:** Token HMAC-SHA256 do Express ký KHÔNG trở thành Firebase ID token và KHÔNG làm cho `request.auth.uid` trong Firestore Rules có giá trị. Chỉ bật Email/Password trong Firebase Console cũng KHÔNG giải quyết nếu client không đăng nhập Firebase thực.
- Ưu tiên một kiến trúc thống nhất: Firebase Authentication cho cả ba vai trò (học sinh vẫn đăng nhập bằng mã + mật khẩu qua backend), server xác thực thông tin hợp lệ rồi phát hành **Firebase Custom Token bằng Firebase Admin SDK**, client `signInWithCustomToken`, API kiểm tra Firebase ID token bằng Admin SDK. Gắn UID/role/teacher ownership/class membership chuẩn và cấp quyền riêng ở backend + Rules. Nếu chưa thể chuyển đổi an toàn, đề xuất phương án khác: tất cả Firestore chỉ đi qua API backend có xác thực và phân quyền từng tài nguyên; client không được truy cập Firestore trực tiếp. Tuyệt đối không để song song HMAC session và Firebase client trực tiếp thiếu Firebase auth.
- Mật khẩu phải lưu dạng băm có muối (Argon2id/bcrypt hoặc tương đương an toàn). Không tiếp tục dựa vào tài khoản demo có mật khẩu công khai. Hỗ trợ thu hồi/khóa phiên. Không để quyền Admin được tự cấp qua trường client, email hardcode hoặc role do request cung cấp.
- Kiểm thử 401/403 và phân quyền chéo 2 giáo viên/2 lớp/học sinh, xem và sửa bài của người khác, đoán ID, JWT giả, role escalation.

## P0-B: FIREBASE DATABASE CÓ TÊN RIÊNG VÀ RULES THỰC SỰ CÓ HIỆU LỰC
- Đọc `firebase-applet-config.json`, `firebase-blueprint.json`, backend/frontend Firebase initialization, cấu hình Vercel và kiểm tra projectId/databaseId thống nhất giữa client, server và seed; không tự đổi project hoặc database.
- Firestore của dự án có `databaseId` riêng (không mặc định). Kiểm tra đúng tên database đang được sử dụng và thêm cấu hình Rules tương ứng trong `firebase.json` khi cần. Không được báo đã triển khai rules nếu mới sửa file local. Nếu thao tác triển khai đúng database cần phê duyệt người dùng, chuẩn bị lệnh để chủ sở hữu duyệt.
- Rà soát Rules theo đúng schema thật: người dùng không thể tự sửa vai trò, học sinh chỉ đọc nhiệm vụ của lớp và bài làm của mình, GV chỉ thao tác với lớp/bài do mình sở hữu, Admin chỉ dùng quyền xác thực; bảo vệ answer keys, audit logs, bản xuất bản bất biến. Rules deny-by-default.
- Viết test Firebase Security Rules thật (Emulator chỉ để kiểm thử Rules với dữ liệu giả, KHÔNG chuyển dữ liệu từ Emulator lên Cloud), cả trường hợp được phép và bị từ chối. Kiểm tra Rules trong Firebase Console đang có hiệu lực trên đúng database trước khi chứng nhận an toàn.
- Nếu chuyển truy cập Firestore sang Firebase Admin SDK server, nhớ rằng Admin SDK bỏ qua Security Rules: phải bảo đảm API tự kiểm tra identity, role, ownership và validate đầu vào trên mọi thao tác; bảo vệ service account theo least privilege, không đưa secret vào Git/browser.

## P0-C: VERCEL, PREVIEW VÀ GITHUB
- Đảm bảo `/api/*` do đúng Serverless Express entrypoint xử lý; SPA fallback không nuốt API. Health endpoint trả HTTP 200 JSON khi khỏe, trạng thái `degraded` nếu AI cần mà chưa cấu hình, không tiết lộ dữ liệu nhạy cảm trong health công khai.
- `npm install` / `npm run lint` / `npm run build` / `npm test` đều phải thực sự chạy. Kiểm thử Vercel build và một Preview **mới** sử dụng cấu hình môi trường Preview có quyền hạn tối thiểu; nếu Preview dùng chung cơ sở dữ liệu Production thì chỉ đọc hoặc dùng test namespace đã cô lập được phê duyệt, tuyệt đối không tạo/xóa dữ liệu trên tài khoản thực.
- Kiểm tra Environment Variables tách Preview/Production; không log giá trị secrets; không hardcode cấu hình localhost vào frontend production; kiểm tra Node runtime.
- Tạo commit trên branch sửa lỗi và đẩy GitHub **chỉ sau khi quét secrets và được cấp quyền thao tác**. So sánh mã nguồn GitHub với workspace; báo commit SHA. Không ghi PASS cho GitHub nếu chưa thấy commit trên remote.
- KHÔNG promote Production, KHÔNG chạy `vercel --prod`, KHÔNG deploy Firebase Rules Cloud hay cập nhật dữ liệu Production trước khi người dùng chấp thuận riêng. Có thể thực hiện build, tests và Preview an toàn.

## P1: KIỂM THỬ TOÀN BỘ HỌC TẬP / AI
1. Thử đầy đủ ba vai trò từ màn hình đăng nhập đến dashboard và đăng xuất/tải lại F5.
2. Hai lớp 1–2, cả 6 dạng nhiệm vụ: chọn đáp án, nhập số, chọn dấu, nối cặp, khung 10 ô, trục số/sắp xếp. Kiểm thử cảm ứng/điện thoại, đọc tiếng Việt, màn hình nhỏ, lỗi mạng, rời trang, resume.
3. Chấm điểm bằng thuật toán, bảo vệ đáp án trước khi nộp, ghi đúng kết quả lần đầu và sau gợi ý, phát hiện mẫu lỗi có giải thích, không để AI tự chấm kết quả tùy ý.
4. GV tạo/sửa/duyệt/xuất bản bài, phiên bản v1 bất biến khi giao v2, giao bài chống trùng, thống kê có thể đối chiếu với attempt thực, xuất CSV; admin xem/khóa tài khoản không truy cập sai quyền.
5. Đo thực tế chức năng Gemini tạo nháp và phân tích lỗi; khi `GEMINI_API_KEY` chưa có phải đánh dấu **BLOCKED**, không ghi AI PASS. Chỉ gọi Gemini khi đã cấu hình và được chủ sở hữu cho phép; không gửi định danh trẻ em cho mô hình.
6. Rà soát seed demo idempotent, gắn nhãn simulation, không seed trên Production, không gộp số liệu mô phỏng thành bằng chứng hiệu quả thực nghiệm.

## BÁO CÁO BÀN GIAO CHÍNH XÁC
Tạo `FINAL_CLOUD_RELEASE_GATE.md` với bảng `hạng mục | PASS/FAIL/BLOCKED/NOT_TESTED | bằng chứng | URL/commit | việc còn lại`. Cần tối thiểu: GitHub remote commit, bản Preview/deployment ID, live Rules cho **named database**, Firebase Auth và quyền truy cập, health/API, 3 vai trò, 6 tương tác, Gemini thực, dữ liệu F5, an ninh API, E2E Preview. Cung cấp các tệp đã sửa, log đã ẩn secrets và những bước cần tôi bấm trong Firebase/Vercel Console. Nếu không thể đọc quyền truy cập Cloud/secret thật, báo BLOCKED; không suy đoán là đã thành công.

**ĐIỀU KIỆN KẾT THÚC:** Dừng trước khi promote bản Production. Đề xuất một trình tự xuất bản an toàn sau khi chủ sở hữu chấp thuận, kèm kiểm thử lại URL Production, xác nhận rollback và dữ liệu không mất. Không tuyên bố nghiệm thu 100% khi AI key, Firebase Rules Cloud, hoặc E2E Preview chưa được xác minh.
