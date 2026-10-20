# PROMPT DUY NHẤT — ANTIGRAVITY AUDIT + FIX + VERCEL ACCEPTANCE

Bạn là Lead Full-stack Engineer (React 19, Vite 8, TypeScript, Express, Firebase Auth/Firestore, Gemini, Vercel), Security Engineer và QA Automation Engineer. HÃY LẬP TRÌNH VÀ SỬA TRỰC TIẾP workspace hiện đang mở: `thamtunhi-main`, dự án **THÁM TỬ TOÁN NHÍ** lớp 1–2.

**Repository đối chiếu:** https://github.com/atitk10-prog/thamtunhi  
**URL cần nghiệm thu:** https://thamtunhi.vercel.app  
**Bối cảnh:** Frontend hiển thị trang đăng nhập trên Vercel nhưng luồng hoạt động online chưa được chứng minh. Mã nguồn có `server.ts`, `vite.config.ts`, `package.json`, `firestore.rules`, `firebase-applet-config.json`, `seed-firestore.ts`, `run-tests.ts`, cùng tài liệu PROGRESS/QA/SECURITY. Không tạo ứng dụng mới; không đổi giao diện, tên ứng dụng, hình linh vật, quy trình học đặc trưng nếu không bắt buộc để sửa lỗi.

## Nguyên tắc an toàn trước tiên (P0 — bắt buộc)

1. **KHÔNG TỰ XÓA, RESET HAY GHI ĐÈ FIRESTORE/AUTH PRODUCTION; KHÔNG chạy seed, cleanup, migration có ghi hoặc integration test ghi dữ liệu trên Cloud Production.** Không `git reset --hard`, không `git clean -fd`, không đẩy bí mật lên GitHub. Không tái tạo dự án Firebase hay Vercel.
2. Đọc `git status`, nhánh/commit, file cấu hình Vercel và repo, đối chiếu deployment hiện tại; ghi trạng thái ban đầu. Tạo nhánh sửa chữa an toàn `fix/vercel-auth-security` nếu repository sẵn Git; backup những file sẽ sửa. Nếu dự án chưa có Git, không tự `git init`.
3. **Bảo mật khẩn cấp:** Code trong `server.ts` đang kiểm tra `users.accessSecret`/`users.password` và mật khẩu fallback, có tài khoản Admin fallback cố định. Repository README công khai các thông tin đăng nhập demo. Phải loại bỏ cơ chế fallback, thay đổi/thu hồi mọi thông tin xác thực đã lộ trên Firebase Auth nếu có, dùng xác thực có trạng thái bằng Firebase Authentication và backend verify token. Không ghi mật khẩu đã lộ vào báo cáo, logs hay commit mới. Nếu cần đổi quyền hoặc credential Cloud, xuất yêu cầu rõ cho chủ sở hữu thao tác; không giả vờ đã hoàn tất.
4. **Firestore Rules trong repo hiện chứa nhiều dòng `allow read/write: if true`** cho `users`, `academicYears`, `classes`, `lessons`, `lessonVersions`, `assignments`, `attempts`, `attemptAnswers`, `mistakeInsights`, `auditLogs`, `test`. ĐÂY LÀ P0. Kiểm tra rules THỰC ĐANG TRIỂN KHAI trên đúng Firebase project + đúng database (Firestore có thể dùng database ID không phải `(default)`), không suy luận chỉ từ file; chụp/trích bằng chứng quyền đọc ghi. Sửa deny-by-default, khóa quyền sửa vai trò, tự cấp Admin, đọc thông tin cá nhân hoặc ghi bài làm thay người khác. Viết test Rules, chặn mọi đọc/ghi nhạy cảm khi chưa đăng nhập. Phải xác thực lại nghiệp vụ sau khi siết quyền.
5. **Endpoint `/api/admin/seed-demo` và `/api/admin/cleanup-demo`:** không được tin `{actorId: 'admin'}` trong request. Bắt buộc `Authorization: Bearer <Firebase ID token>`, xác minh bằng Firebase Admin SDK ở backend, kiểm tra role/claims Admin đáng tin, CSRF/origin khi có session cookie, rate limit, bảo vệ chi phí. Mặc định KHÓA cleanup/seed trên production; nếu yêu cầu thực sự thì dry-run + explicit confirmation + scoped IDs + backup + server audit, nhưng KHÔNG thực thi thao tác có tính phá hủy trong nhiệm vụ này.
6. Các API dành cho giáo viên gọi Gemini (`/api/teacher/generate-draft`, `/api/teacher/summarize-insights`) phải xác minh token và quyền teacher/admin, validate input/schema, giới hạn số lần và kích thước, không nhận số liệu từ client như nguồn sự thật nếu có thể đọc từ server. Không để Gemini secret trong `VITE_*`, client bundle, `firebase-applet-config.json`, Git hoặc log.
7. Không tuyên bố đã xác minh Cloud, AI hoặc auth nếu chưa gọi chức năng thật và có bằng chứng. Không chia sẻ tên/điện thoại của học sinh hoặc báo cáo cá nhân lên công khai. Dữ liệu `simulation` khác dữ liệu thực và phải được ghi nhãn minh bạch.

## Pha A — Kiểm toán và xác định lỗi thực tế

- Đọc toàn bộ `package.json`, Vite config, `server.ts`, toàn bộ `src`, khởi tạo Firebase, đường đi đăng nhập, `firestore.rules`, seed, các báo cáo hiện có, `git status`; đối chiếu phát biểu trong `CLOUD_ENV_REPORT.md` với CODE THỰC TẾ. Đặc biệt code rules đang mở rộng trái với tuyên bố "deny-by-default".
- Phân biệt rõ **màn login render** với **API/Auth/Firestore/AI hoạt động**.
- Kiểm tra Vercel Project Settings: Root Directory chính xác (tránh 2 thư mục `thamtunhi-main` lồng nhau), Framework Preset, Node version, package manager/lockfile, Build Command, Output Directory, Function runtime, miền production, Environment Variables, git branch/commit đã deploy. Không tự ý thay cấu hình không rõ.
- Lấy `vercel logs`, build logs, network status, response body content-type (phân biệt 200 JSON thật với 200 `index.html` SPA), browser console. Nếu chưa có CLI auth hoặc quyền truy cập, ghi `BLOCKED` kèm bước chủ sở hữu cần làm. Không in secret.
- Kiểm tra `https://thamtunhi.vercel.app/api/health` có HTTP 200 + `application/json` thật; health không được hardcode `authConnected:true` nếu chưa probe được dịch vụ. Health public chỉ trả trạng thái tối thiểu, không lộ cấu hình nội bộ.
- Ghi `AUDIT_P0_VERCEL.md` theo format: vấn đề, file:line, cách tái hiện, tác động, mức P0/P1/P2, phương án sửa, trạng thái/bằng chứng.

## Pha B — Sửa kiến trúc Vercel đúng cách, giữ 1 domain frontend + API

- Hiện tại `package.json` có `build: vite build`, `dev/start: tsx server.ts` và `server.ts` chạy Express/Vite middleware trong `startServer()` rồi `app.listen()`. Kiểm chứng Vercel đã nhận/triển khai backend Express hay chỉ phục vụ Vite tĩnh; không chọn lời giải theo suy đoán.
- Chọn **một** kiến trúc phù hợp Vercel thực tế: (a) Vercel Express full-stack được nhận diện với export Express app chuẩn, hoặc (b) Vite static + Vercel Functions trong `api/` + rewrite API ưu tiên trước SPA. Giữ logic API chung, tránh 2 server/2 môi trường tách rời. Không sử dụng Node server chạy thường trực như trên VPS.
- Nếu dùng option (b): Tách router/app không gọi `listen()` khi import serverless; local dev có entry riêng; đưa endpoints vào function hợp lệ, `vercel.json` routing bảo đảm `/api/*` không bị rewrite thành `index.html`. Với SPA, thiết lập fallback cho client routes. Dựa trên docs Vercel hiện hành, không bịa `vercel.json`.
- Bảo đảm `npm run lint`, `npx tsc --noEmit`, `npm run build`, unit tests và `vercel dev`/Preview chạy được. Kiểm tra lockfile `bun.lock` và version runtime, quyết định package manager nhất quán, không xóa bừa dependencies.
- Các cấu hình environment: Firebase web config có thể ở client, nhưng service account, admin credentials, GEMINI_API_KEY là server-only. Thiếu env phải báo tiếng Việt rõ, không chuyển âm thầm sang mock. Sau thay đổi env Vercel, cần redeploy.

## Pha C — Firebase xác thực thật và quyền truy cập

- Kiểm tra Firebase project ID/Firestore database ID theo **đang triển khai**, không lấy từ hardcode README mà xem config & Firebase Console. Hỗ trợ named database đúng ID. Sao lưu/đối soát số bản ghi read-only trước bất kỳ thay đổi nào; không tạo dữ liệu fake lên production.
- Admin/Teacher: đăng nhập Firebase Auth thực (Email/Password hoặc Google provider đã cấu hình), ID token/cookie phiên hợp lệ; role lấy từ custom claims được gán bởi backend tin cậy. Không tin `role` trong `localStorage` hoặc trong body API. Thử refresh/logout/relogin.
- Student: giao diện vẫn nhập **Mã học sinh + Mật khẩu**, KHÔNG yêu cầu trẻ có Gmail. Triển khai phương án xác thực an toàn có token: mapping nội bộ hợp lệ tới Firebase Auth hoặc mật khẩu băm Argon2id/scrypt tại backend rồi cấp custom token; không giữ mật khẩu plaintext trong Firestore, không trả secret hay answerKey về client. Rate limit, generic error để tránh dò mã, chính sách reset mật khẩu bởi GV/Admin theo quyền sở hữu. Không triển khai demo mặc định dùng lại mật khẩu công khai. Ẩn nút chọn nhanh tài khoản demo/Admin trên trang đăng nhập Production; chỉ cho thấy trong môi trường demo cô lập và tài khoản tạm không có quyền đặc biệt.
- Backend dùng `firebase-admin` cho tác vụ đặc quyền, chỉ sau verifyIdToken và kiểm quyền/tài nguyên; Admin SDK bypass Rules nên BẮT BUỘC tự kiểm tra quyền ở từng route. Không đưa SDK/service account ra frontend.
- Firestore rules: chỉ Admin được quản lý giáo viên/năm học theo đúng vai trò; GV chỉ quản lý lớp/bài/giao bài sở hữu; HS chỉ đọc bài được giao, kết quả của mình và chỉ nộp bài cho mình. Không cho client sửa claim/role, answerKey, auditLog; khóa chỉnh sửa lesson published version. Tách public metadata nếu cần; dùng server-side marking chấm bài. Bắt buộc chạy tests cho unauthorized users, cross-teacher, cross-class, student accessing others, role escalation, deletions and immutable versions.
- Tránh lỗi đồng bộ giữa hai Firebase projects/databases, F5 mất phiên hay app tự rơi vào demo mode. Quyết định single source of truth.

## Pha D — Chức năng nghiệp vụ bắt buộc kiểm thật

A. **Admin:** đăng nhập, không trắng màn hình, dashboard thống kê Firestore đúng số thực tế, xem/sửa GV/lớp/năm học theo quyền, lọc `simulation` / `real`, xem nhật ký an toàn, không có quyền ngầm từ frontend. UI CRUD phải có xử lý loading/errors và chính sách delete/archive an toàn.

B. **Giáo viên:** đăng nhập, chỉ thấy lớp của mình, tạo bài Toán lớp 1/2 thủ công, AI tạo bản nháp thực (nếu env hợp lệ), tự sửa câu hỏi và đáp án, validation theo kiểu câu hỏi, xuất bản phiên bản bất biến v1/v2, xem trước không tạo attempt, giao bài chống trùng, chọn đợt luyện tập mới, xem báo cáo lỗi và xuất CSV UTF-8 BOM. AI lỗi phải báo lỗi, không trả bộ JSON mẫu ngụy trang AI.

C. **Học sinh:** đăng nhập mã HS, thấy đúng bài được giao, 6 dạng bài tương tác thật (trắc nghiệm, nhập số, chọn dấu/so sánh, nối cặp, ten-frame/que tính, trục số/sắp xếp), chấm theo thuật toán, lần trả lời đầu và sau gợi ý lưu riêng, gợi ý nhận diện mẫu lỗi chính xác, không lộ đáp án trước khi được xem lại, hoàn thành/tiến độ/Huy hiệu/làm lại, F5 không mất bài. Mobile 360–430px sử dụng được, không nút chết.

D. **Dữ liệu:** thống kê theo grade/class/assignment/version và nguồn `dataOrigin`, biểu đồ không hardcode số. Dataset 4 lớp/48 HS/24 bài/192 câu/24 đợt/144 lượt chỉ được xác nhận nếu truy vấn Firestore trả số như vậy; dữ liệu mô phỏng là dữ liệu kỹ thuật, KHÔNG được báo là kết quả học sinh thực nghiệm.

## Pha E — Kiểm thử và khắc phục đến nơi đến chốn

1. Unit: math engine (cộng, trừ, qua 10, hàng chục-đơn vị, dấu so sánh, đếm lệch 1), 6 interaction types, JSON/schema AI, scoring lần đầu vs gợi ý.
2. Integration/Auth: đăng nhập đúng/sai, tài khoản khóa, không dùng password fallback, teacher A không đọc/sửa teacher B, HS không truy cập dữ liệu khác, user không tự nâng lên admin, API không token trả 401, thiếu role trả 403, seed/cleanup không được chạy anonymous.
3. Firestore Rules tests trên môi trường kiểm thử cô lập, trước khi áp dụng rules production; kiểm tra database ID đúng; ngăn public read/write dữ liệu học sinh và đáp án.
4. E2E thực với tài khoản thử nghiệm RIÊNG: Admin login → tạo lớp/kiểm tra quyền; GV tạo nháp/AI/sửa/xuất bản/giao; HS login/làm sai/nhận gợi ý/làm đúng/nộp/F5/xem lại; GV xem kết quả; thử màn desktop và mobile.
5. Kiểm thử đặc thù Production/Preview: `/` trả HTML, `/api/health` trả JSON, `/api/auth/*` trả JSON hợp lệ, `/api/teacher/*` không 404/405/HTML, refresh URL sâu không 404, Gemini chạy khi đã cấp secret và model hợp lệ, Firestore thực có đủ bản ghi được phép truy cập. Test từ Preview trước; test phá dữ liệu tuyệt đối không chạy vào production.
6. Với mỗi lỗi, sửa nguyên nhân gốc rồi chạy lại toàn bộ những test liên quan; cập nhật `QA_FINAL_ACCEPTANCE.md` với PASS/FAIL/BLOCKED/NOT TESTED, testcase, bằng chứng (ảnh/log đã che dữ liệu), commit, URL deployment.

## Pha F — GitHub, Vercel và bàn giao

- Chỉ commit các file mã nguồn đã rà soát; bỏ `.env`, token, tài khoản hoặc mật khẩu demo thật. Nếu phát hiện secret trong lịch sử Git, báo chủ sở hữu ROTATE/REVOKE ngay; không coi xóa dòng mới là đã thu hồi lộ lọt.
- Tạo `VERCEL_DEPLOY_CHECKLIST.md` với Root Directory, Build/Output, env var NAMES (không values), bước Firebase Authorized Domains và cách xác minh. Không cần thiết phải đổi từ Vercel sang Cloud Run trong đợt này; **mục tiêu là sửa bản Vercel đang có**.
- Push nhánh / tạo PR nếu đã có ủy quyền Git; chạy Preview deployment trước, xác minh commit SHA, API, Auth, Firestore, AI. Chỉ triển khai Production sau khi có sự phê duyệt rõ của chủ sở hữu và các P0 bảo mật đã PASS. Không tạo Vercel project mới nếu project cũ sửa được.
- Cuối cùng tạo `P0_SECURITY_FIX_REPORT.md`, `VERCEL_RUNTIME_FIX_REPORT.md`, `QA_FINAL_ACCEPTANCE.md`, `RECOVERY_STATUS.md`, `VERCEL_DEPLOY_CHECKLIST.md` và `QUICK_USER_GUIDE.md`. Mỗi file nêu thực tế, không viết cam kết chung chung.
- Kết luận phải trả lời: (1) Vercel đang chạy frontend+API thật chưa? (2) Firebase Auth và Rules còn mở không? (3) đủ 3 vai trò + 6 hoạt động hoạt động chưa? (4) những test nào PASS, còn BLOCKED gì? (5) deployment/commit nào được nghiệm thu? (6) người dùng cần thao tác gì tiếp theo?

**THỨ TỰ ƯU TIÊN KHÔNG THAY ĐỔI:** P0 bảo mật và sao lưu → xác định lỗi online thực → sửa backend Vercel → sửa Firebase Auth & Rules → nghiệm thu workflow → Preview → Production khi được duyệt. Nếu không thể truy cập Vercel/Firebase hoặc thiếu secret, không đoán và không tuyên bố PASS; dừng phần phụ thuộc, báo hướng dẫn cụ thể, tiếp tục các phần sửa code/test có thể làm.

**BẮT ĐẦU NGAY:** phân tích repo đang mở và in bảng 10 lỗi/điểm rủi ro ưu tiên cao nhất kèm file:line, sau đó sửa từng nhóm, chạy test lại thật. Không chỉ trả lời lý thuyết.
