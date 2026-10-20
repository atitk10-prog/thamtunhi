# DANH MỤC DỮ LIỆU MẪU KHẢO NGHIỆM (DEMO DATA MANIFEST)
## DỰ ÁN: THÁM TỬ TOÁN NHÍ

Mọi bản ghi thử nghiệm dưới đây được tạo trực tiếp trên Cloud Firestore của dự án `indigo-lotus-2nmq3` với cờ đánh dấu `dataOrigin: 'simulation'` và `environmentTag: 'demo'`.

---

### 1. Danh Sách Tài Khoản Thử Nghiệm

#### A. Quản Trị Viên (Admin)
- **Họ và tên**: Ban Quản Trị Hệ Thống
- **Email**: `admin@thamtutoannhi.edu.vn`
- **Mật khẩu**: *[Được quản lý theo quy chế bảo mật tài khoản quản trị]*
- **Vai trò**: Quản trị toàn hệ thống, giám sát sức khỏe hạ tầng, kiểm tra phiên đăng nhập, xem audit log.

#### B. Giáo Viên Bộ Môn
1. **Giáo viên Khối 1**:
   - **Họ và tên**: Cô Mai Lan (Khối 1)
   - **Email**: `giaovien1@thamtutoannhi.edu.vn`
   - **Mật khẩu**: *[Cấp riêng theo danh sách giáo viên]*
   - **Phụ trách**: Lớp 1A và Lớp 1B.
2. **Giáo viên Khối 2**:
   - **Họ và tên**: Thầy Quốc Huy (Khối 2)
   - **Email**: `giaovien2@thamtutoannhi.edu.vn`
   - **Mật khẩu**: *[Cấp riêng theo danh sách giáo viên]*
   - **Phụ trách**: Lớp 2A và Lớp 2B.

#### C. Học Sinh Khảo Nghiệm (48 học sinh mô phỏng)
- **Cơ chế truy cập**: Học sinh đăng nhập bằng Mã học sinh và mật khẩu được giáo viên bộ môn cấp phát.
- **Lớp 1A (12 học sinh)**: `HS1A01`, `HS1A02`, `HS1A03`, `HS1A04`, `HS1A05`, `HS1A06`, `HS1A07`, `HS1A08`, `HS1A09`, `HS1A10`, `HS1A11`, `HS1A12`
- **Lớp 1B (12 học sinh)**: `HS1B01`, `HS1B02`, `HS1B03`, `HS1B04`, `HS1B05`, `HS1B06`, `HS1B07`, `HS1B08`, `HS1B09`, `HS1B10`, `HS1B11`, `HS1B12`
- **Lớp 2A (12 học sinh)**: `HS2A01`, `HS2A02`, `HS2A03`, `HS2A04`, `HS2A05`, `HS2A06`, `HS2A07`, `HS2A08`, `HS2A09`, `HS2A10`, `HS2A11`, `HS2A12`
- **Lớp 2B (12 học sinh)**: `HS2B01`, `HS2B02`, `HS2B03`, `HS2B04`, `HS2B05`, `HS2B06`, `HS2B07`, `HS2B08`, `HS2B09`, `HS2B10`, `HS2B11`, `HS2B12`

---

### 2. Danh Mục 24 Bài Học Chuẩn Mực GDPT 2018 (192 Câu Hỏi)

#### Khối Lớp 1 (12 bài học):
1. `lesson-g1-01`: Các số từ 1 đến 5: Đếm và Nhận biết (8 câu hỏi, đếm que tính, số liền trước sau)
2. `lesson-g1-02`: Các số từ 6 đến 10 và Tách - Gộp số (8 câu hỏi, mô hình tách gộp)
3. `lesson-g1-03`: Phép cộng trong phạm vi 10 (8 câu hỏi, bảng cộng, trục số)
4. `lesson-g1-04`: Phép trừ trong phạm vi 10 (8 câu hỏi, bớt que tính, toán lời văn)
5. `lesson-g1-05`: Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật (8 câu hỏi, hình học thực tế)
6. `lesson-g1-06`: Các số trong phạm vi 20 và Số Mười (1 chục) (8 câu hỏi, cấu tạo chục và đơn vị)
7. `lesson-g1-07`: Phép cộng không nhớ trong phạm vi 20 (8 câu hỏi, dạng 12 + 3)
8. `lesson-g1-08`: Phép trừ không nhớ trong phạm vi 20 (8 câu hỏi, dạng 17 - 4)
9. `lesson-g1-09`: Đo độ dài và Xăng-ti-mét (cm) (8 câu hỏi, dùng thước có vạch chia)
10. `lesson-g1-10`: Các số tròn chục từ 10 đến 90 (8 câu hỏi, cộng trừ nhẩm số tròn chục)
11. `lesson-g1-11`: Các số có hai chữ số đến 100 (8 câu hỏi, so sánh, giá trị vị trí)
12. `lesson-g1-12`: Đồng hồ và Xem giờ đúng (8 câu hỏi, kim phút chỉ số 12)

#### Khối Lớp 2 (12 bài học):
13. `lesson-g2-01`: Phép cộng có nhớ trong phạm vi 20 (Qua 10) (8 câu hỏi, tách số để được 10)
14. `lesson-g2-02`: Phép trừ có nhớ trong phạm vi 20 (Trừ qua 10) (8 câu hỏi, trừ để được 10 rồi trừ tiếp)
15. `lesson-g2-03`: Đề-xi-mét (dm) và Đo độ dài (8 câu hỏi, mối quan hệ 1 dm = 10 cm)
16. `lesson-g2-04`: Phép cộng có nhớ trong phạm vi 100 (8 câu hỏi, đặt tính thẳng cột dạng 38 + 25)
17. `lesson-g2-05`: Phép trừ có nhớ trong phạm vi 100 (8 câu hỏi, mượn 1 chục dạng 52 - 28)
18. `lesson-g2-06`: Khối trụ và Khối cầu (8 câu hỏi, nhận biết đồ vật thực tế)
19. `lesson-g2-07`: Làm quen với Phép nhân và Dấu nhân (×) (8 câu hỏi, tổng các số hạng bằng nhau)
20. `lesson-g2-08`: Bảng nhân 2 và Bảng nhân 5 (8 câu hỏi, đếm cách đều 2 và 5)
21. `lesson-g2-09`: Làm quen với Phép chia và Bảng chia 2, chia 5 (8 câu hỏi, chia đều đồ vật)
22. `lesson-g2-10`: Các số trong phạm vi 1000 và Hàng trăm (8 câu hỏi, cấu tạo số 3 chữ số)
23. `lesson-g2-11`: Đo lường: Ki-lô-gam (kg) và Lít (l) (8 câu hỏi, giải toán thực tế)
24. `lesson-g2-12`: Xem lịch, Ngày - Tháng và Xem đồng hồ (8 câu hỏi, giờ rưỡi, giờ 15 phút)

---

### 3. Phân Phối Mẫu Lỗi Được Mô Phỏng Trong 144 Lượt Làm Bài
- `COUNTING_OFF_BY_ONE`: Đếm lệch 1 đơn vị khi đếm nhanh (28 lượt)
- `WRONG_OPERATOR`: Nhầm dấu `+` và `-` trong bài toán thêm/bớt (24 lượt)
- `CROSS_TEN_ERROR`: Khó khăn khi tách số qua 10 (30 lượt)
- `PLACE_VALUE_SWAP`: Viết ngược số hàng chục và hàng đơn vị (vd: 35 thành 53) (22 lượt)
- `COMPARISON_INVERSION`: Đảo ngược hướng dấu `>` và `<` (20 lượt)
- `NUMBER_ORDER_CONFUSION`: Nhầm thứ tự trước sau trên trục số (20 lượt)
- Sau khi nhận được gợi ý trực quan, học sinh được trao cơ hội làm lại lần 2, tỷ lệ khắc phục thành công đạt trên 78%.
