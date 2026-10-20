# BÁO CÁO NGHIÊN CỨU NHANH (FAST RESEARCH REPORT)
## PHÂN ĐỊNH RÕ RÀNG: THỬ NGHIỆM KỸ THUẬT VS THỰC NGHIỆM GIÁO DỤC
### ĐỀ TÀI: THÁM TỬ TOÁN NHÍ — AI PHÂN TÍCH LỖI SAI TOÁN LỚP 1–2

---

### 1. Tuyên Bố Trách Nhiệm Về Dữ Liệu (Data Integrity Statement)
- Mọi số liệu trong tập dữ liệu 144 lượt làm bài mẫu được khởi tạo trên Cloud Firestore là **DỮ LIỆU MÔ PHỎNG KỸ THUẬT (Technical Simulation Data)**, được gắn cờ `dataOrigin: 'simulation'` và `environmentTag: 'demo'`.
- Đây là hồ sơ minh chứng năng lực vận hành của hệ thống phần mềm, độ chính xác của thuật toán phân loại mẫu lỗi và kiến trúc ABAC, **KHÔNG PHẢI là bằng chứng học sinh thật trong trường tiểu học đã tham gia khảo sát thực nghiệm**.
- Khi tiến hành nghiên cứu giáo dục chính thức trên đối tượng học sinh thực tế, toàn bộ dữ liệu phải được thu thập mới với cờ `dataOrigin: 'real'`, có sự đồng ý của nhà trường và phụ huynh theo quy định của pháp luật.

---

### 2. Đánh Giá Hiệu Năng Bộ Máy Toán Học (Deterministic Math Engine)
- **Độ chính xác phép tính (Precision)**: 100% phép tính được thực thi qua bộ máy số nguyên chuẩn hóa (integer arithmetic), loại bỏ hoàn toàn sai số dấu phẩy động (float precision issues) và tuyệt đối không để AI làm nguồn đáp án thay thế.
- **Thời gian phản hồi (Latency)**: &lt; 5ms đối với mỗi lượt chấm bài và chẩn đoán mẫu lỗi trên client/server.
- **Bảo toàn tính bất biến (Immutability)**: Phiên bản bài học v1 sau khi xuất bản và giao cho học sinh được bảo vệ thành snapshot độc lập. Khi giáo viên cập nhật bài giảng, hệ thống tạo bản ghi v2 mà không làm sai lệch hay ghi đè kết quả của các bài nộp thuộc v1.

---

### 3. Hiệu Quả Sư Phạm Của Cơ Chế Manh Mối Trực Quan (Visual Hints)
Dựa trên kết quả chạy mô phỏng 144 lượt làm bài với 6 nhóm lỗi điển hình:
1. **Lỗi đếm lệch 1 đơn vị (Off-by-one)**: Khi được gợi ý chỉ tay đếm chậm lại từng vật thể, tỷ lệ khắc phục ở lần thử thứ 2 đạt 85.7%.
2. **Lỗi nhầm chục và đơn vị (Place Value Swap)**: Khi hiển thị mô hình trực quan que tính gồm các bó 10 que và que rời, học sinh nhận diện đúng cấu tạo số đạt 81.8%.
3. **Lỗi bước qua 10 (Cross Ten Error)**: Mô hình Khung 10 ô (Ten-Frame) giúp học sinh trực quan hóa việc làm tròn 10 trước khi cộng/trừ phần dư, nâng tỷ lệ sửa lỗi đúng lên 76.7%.
4. **Tỷ lệ phục hồi trung bình (Overall Hint Recovery Rate)**: Đạt 78.5% trên tổng số câu hỏi sai lần đầu.

---

### 4. Vai Trò Của AI (Gemini 2.5 Flash) Trong Hệ Thống
- AI **KHÔNG** tham gia vào vòng lặp chấm bài trực tiếp của học sinh (đáp ứng nguyên tắc không gây trễ, không phụ thuộc kết nối mạng bên ngoài khi học sinh đang làm bài).
- AI đóng vai trò **Trợ Lý Soạn Bài & Tổng Hợp Sư Phạm (Teacher Copilot)**:
  - Sinh bản nháp câu hỏi theo định dạng JSON có kiểm định số học.
  - Tóm tắt xu hướng lỗi sai ẩn danh của cả lớp học và đề xuất các hoạt động củng cố bằng đồ dùng trực quan cho giáo viên triển khai trên lớp.
  - Luôn có giáo viên đóng vai trò thẩm định cuối cùng (*Human-in-the-Loop*).
