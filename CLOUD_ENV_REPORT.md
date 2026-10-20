# BÁO CÁO MÔI TRƯỜNG CLOUD (CLOUD ENVIRONMENT REPORT)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ

### 1. Thông Tin Định Danh Firebase & Google Cloud
- **Firebase Project ID**: `indigo-lotus-2nmq3`
- **Firestore Database ID**: `ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2`
- **Firebase Web App ID**: `1:585905017075:web:dc40838af79ac22d5aa786`
- **OAuth Client ID**: `585905017075-seus3i44vvb1omrfdk3hn7tecjh8je4i.apps.googleusercontent.com`
- **Cloud Run Hosting Target**: `https://ais-dev-4jc6soji4x4y7herqbvi44-223098287749.asia-east1.run.app`
- **Pre-release Hosting URL**: `https://ais-pre-4jc6soji4x4y7herqbvi44-223098287749.asia-east1.run.app`
- **Admin Bootstrapped Email**: `AT.IT.K10@gmail.com`

### 2. Tình Trạng Kích Hoạt Dịch Vụ
- **Cloud Firestore**: **ĐÃ KÍCH HOẠT & TRIỂN KHAI**
  - Trạng thái Rules: Đã Deploy thành công lên dự án thật qua RPC `DeployRules`.
  - Quy tắc bảo mật: Áp dụng nghiêm ngặt ABAC (Attribute-Based Access Control), mặc định Deny-by-default.
- **Firebase Authentication**: **ĐÃ KÍCH HOẠT**
  - Providers: Google Sign-in & Email/Password kỹ thuật.
  - Cổng học sinh: Mã học sinh + Mật khẩu cá nhân không thu thập email/số điện thoại của trẻ nhỏ.
- **Google GenAI / Gemini API**:
  - Model chỉ định: `gemini-2.5-flash`
  - Cơ chế thực thi: Server-side proxy tại `/api/teacher/generate-draft` và `/api/teacher/summarize-insights`.
  - Quản lý khóa: Bảo mật qua biến môi trường `GEMINI_API_KEY`, không để lộ trong frontend code hoặc git repository.

### 3. Số Lượng Bản Ghi Trong Cơ Sở Dữ Liệu Cloud Firestore
- **Học liệu & Bài học (`lessons`)**: 24 bài chuẩn mực GDPT 2018 (12 bài Lớp 1, 12 bài Lớp 2)
- **Phiên bản bài học (`lessonVersions`)**: 24 snapshots bất biến (192 câu hỏi toán học)
- **Lớp học (`classes`)**: 4 lớp học (1A, 1B, 2A, 2B)
- **Học sinh (`users`)**: 48 học sinh mô phỏng (12 em/lớp)
- **Giáo viên (`users`)**: 2 giáo viên bộ môn
- **Quản trị viên (`users`)**: 1 quản trị viên hệ thống
- **Đợt giao bài (`assignments`)**: 24 đợt giao bài
- **Lượt làm bài (`attempts`)**: 144 lượt làm bài mô phỏng phân phối đa dạng các lỗi sai
- **Bản ghi chẩn đoán (`mistakeInsights`)**: 144 bản ghi mẫu lỗi phân loại theo taxonomy

### 4. Phân Tách Nguồn Dữ Liệu
- Mọi bản ghi khảo nghiệm thử nghiệm được gắn nhãn bắt buộc:
  - `dataOrigin: 'simulation'`
  - `environmentTag: 'demo'`
- Mọi dữ liệu thực tế phát sinh trong quá trình học sinh làm bài được gắn:
  - `dataOrigin: 'real'`
- Báo cáo và bảng phân tích luôn có cờ lọc để người nghiên cứu không nhầm lẫn giữa dữ liệu thử nghiệm kỹ thuật và dữ liệu thực nghiệm giáo dục.
