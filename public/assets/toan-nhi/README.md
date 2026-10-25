# Bộ đồ họa Thám Tử Toán Nhí — 60 tài nguyên

Bộ tài nguyên độc lập để đưa vào ứng dụng Toán lớp 1–2 và sử dụng khi quay video minh họa. **Chưa tích hợp vào Vercel/production**; ứng dụng chỉ hiển thị khi người phát triển đưa các tệp vào mã nguồn và triển khai.

## Danh mục

| Nhóm | Số lượng | Định dạng | Mục đích |
| --- | ---: | --- | --- |
| Trái cây và thực phẩm | 15 | PNG RGBA | Minh họa đếm, cộng, trừ |
| Động vật | 12 | PNG RGBA | Minh họa số lượng, phân loại |
| Đồ dùng học tập | 10 | PNG RGBA | Minh họa tình huống học tập |
| Thiên nhiên | 8 | PNG RGBA | Minh họa số lượng, so sánh |
| Phông cảnh | 5 | PNG RGB 16:9 | Nền lớp học, vườn, ao, chợ, sân chơi |
| Toán học | 10 | SVG | Que tính, bó chục, khung 10, thẻ số, phép tính, đồng hồ, hình học |

**Tổng cộng: 60 tệp ảnh (50 PNG + 10 SVG).** Kích thước PNG đồ vật: 1254 × 1254 px; nền: 1672 × 941 px. Đồ vật nền trong suốt, nền cảnh phủ kín khung.

## Tích hợp an toàn vào ứng dụng

1. Chép nguyên các tệp PNG/SVG vào `public/assets/toan-nhi/` của dự án.
2. Đưa `assets_manifest.json` vào thư mục quản lý thư viện (hoặc dùng nó ở `public/assets/toan-nhi/`). Giữ nguyên tên tệp và dấu gạch nối.
3. Xây dựng thư viện chọn hình theo 6 `groups` trong manifest. Trên giao diện giáo viên hiển thị thumbnail, tên tiếng Việt, ô tìm kiếm, bộ lọc và chỉ báo hình đang chọn.
4. Khi dựng bài tập, đọc `visualConfig` và **lặp lại một sprite đúng số lượng do đề bài quy định**. Không suy số vật thể từ đáp án nếu đề không cung cấp đủ dữ kiện. Ví dụ `2 + 3`: hai quả táo bên trái và ba quả bên phải, không hiển thị tổng bằng năm trước khi học sinh trả lời.
5. Với bài trừ, dựng trạng thái ban đầu và thao tác bớt đi theo đúng đề. `5 - 5 = 0` không có nghĩa ban đầu khay rỗng.
6. SVG `math-counting-stick-bundle10.svg` biểu diễn **đúng 10 que**; `math-tenframe-empty.svg` **đúng 2 × 5 ô**. Đồng hồ không có kim, cần vẽ hai kim theo thời gian trong dữ liệu câu hỏi. Thẻ số không chứa chữ số, cần thêm số ở lớp giao diện.
7. `grapes-purple.png` là **một chùm nho**, `crayon-box.png` là **một hộp bút màu**, không phải một quả nho hay một cây bút màu. Dùng `countUnit` để diễn đạt đơn vị đếm.
8. Không đưa ảnh nền cảnh vào tập các vật đếm; loại `backgrounds` có `countable:false`.
9. Một yêu cầu ảnh lỗi HTTP 404 hoặc giải mã thất bại phải hiển thị placeholder/ô báo lỗi trong màn giáo viên để họ sửa liên kết; ghi lỗi chi tiết cho người phát triển. Không tự âm thầm thay bằng đồ vật khác vì có thể sai đề toán.
10. Cho giáo viên xem trước trên điện thoại và máy tính trước khi giao bài; học sinh không được xem đáp án hay gợi ý tiết lộ đáp án.

## Kiểm tra trước khi quay video và triển khai

- [ ] Cả 60 tệp trong manifest có URL truy cập được (HTTP 200, đúng MIME `image/png`/`image/svg+xml`).
- [ ] 50 PNG giải mã được, 45 sprite có nền trong suốt, 5 nền cảnh đúng tỷ lệ ngang.
- [ ] Mỗi thumbnail trong thư viện hiển thị, không có khung ảnh hỏng, không lỗi 404.
- [ ] Câu hỏi dùng đúng đồ vật, đúng đơn vị đếm, đúng lượng ban đầu và phép tính.
- [ ] Quy trình giáo viên chọn hình → lưu bản nháp → mở lại → xuất bản → giao lớp → học sinh xem/làm bài vẫn giữ đúng URL hình ảnh.
- [ ] Ảnh hiển thị phù hợp trên desktop lẫn điện thoại; hình không che chữ hoặc đáp án.
- [ ] Không chạy seed/reset dữ liệu, không khôi phục tài khoản đã xóa, không thay đổi phân công lớp.
- [ ] Không sử dụng Gemini API để kiểm thử tự động; chủ dự án trực tiếp nghiệm thu trên tài khoản của mình.

## Lưu ý

Các hình minh họa do AI tạo, không dùng làm căn cứ kiểm chứng sự vật thực tế hoặc thông số toán học. Tính đúng đắn của số lượng, dấu phép tính và điểm đánh giá phải do mã nguồn quyết định. Các SVG toán được dựng theo hình học cố định. Bản đóng gói này chỉ chứa đồ họa và tài liệu, không chứa khóa API, tài khoản hay dữ liệu học sinh.
