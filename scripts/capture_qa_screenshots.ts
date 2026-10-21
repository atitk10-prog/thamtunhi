import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda');

async function capture() {
  console.log('=== TIẾN HÀNH CHỤP BỘ ẢNH MINH CHỨNG CHUẨN XÁC DỰ THI ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2, // 2x DPI Retina cho poster & slide thuyết trình
  });
  const page = await context.newPage();

  // 1. Đăng nhập Giáo viên 1
  console.log('1. Đăng nhập Giáo viên 1...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Giáo Viên")');
  await page.fill('input[type="email"]', 'giaovien1@thamtutoannhi.edu.vn');
  await page.fill('input[type="password"]', 'MatKhauGiaoVien@123');
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForTimeout(2000);

  // 2. Mở trình biên tập bài học Bài 1
  console.log('2. Mở trình biên tập bài học Bài 1...');
  const editBtn = page.locator('button:has-text("Biên tập")').first();
  await editBtn.waitFor({ state: 'visible', timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(1500);

  // 3. Cuộn chính xác đến Câu 5 (#question-card-4)
  console.log('3. Cuộn chính xác đến Câu 5 (#question-card-4)...');
  const q5Card = page.locator('#question-card-4');
  await q5Card.waitFor({ state: 'visible', timeout: 5000 });
  await q5Card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Screenshot 1: QA_01 - Câu 5 Khung 5 ô đồng bộ (Teacher Editor View)
  const s1 = path.join(ARTIFACT_DIR, 'qa_01_question5_five_frame_sync.png');
  await page.screenshot({ path: s1 });
  console.log('-> Đã lưu QA_01:', s1);

  // 4. Thử nghiệm chuyển đổi sang Khung 10 ô trên Câu 5
  console.log('4. Thử nghiệm chuyển đổi sang Khung 10 ô trên Câu 5...');
  const modelTypeSelect = q5Card.locator('select:has(option[value="five_frame"])').first();
  if (await modelTypeSelect.isVisible()) {
    await modelTypeSelect.selectOption('ten_frame');
    await page.waitForTimeout(800);
    const s4 = path.join(ARTIFACT_DIR, 'qa_04_editor_switch_to_ten_frame.png');
    await page.screenshot({ path: s4 });
    console.log('-> Đã lưu QA_04 (Khung 10 ô):', s4);

    // Chuyển lại về five_frame để giữ nguyên học liệu chuẩn
    await modelTypeSelect.selectOption('five_frame');
    await page.waitForTimeout(500);
  }

  // 5. Mở Thư viện hình ảnh dùng chung từ Câu 5
  console.log('5. Mở Thư viện hình ảnh dùng chung...');
  const mediaBtn = q5Card.locator('button:has-text("Thư viện ảnh")').first();
  if (await mediaBtn.isVisible()) {
    await mediaBtn.click();
    await page.waitForTimeout(1000);

    // Screenshot 2: QA_02 - Thư viện hình ảnh 8 danh mục Toán
    const s2 = path.join(ARTIFACT_DIR, 'qa_02_media_library_modal_browse.png');
    await page.screenshot({ path: s2 });
    console.log('-> Đã lưu QA_02:', s2);

    // Chuyển sang Tab tải ảnh mới
    console.log('6. Chuyển sang Tab Tải ảnh mới...');
    const uploadTabBtn = page.locator('button:has-text("Tải ảnh mới")').first();
    if (await uploadTabBtn.isVisible()) {
      await uploadTabBtn.click();
      await page.waitForTimeout(600);

      // Screenshot 3: QA_03 - Tab Tải ảnh mới với tiêu chuẩn < 1MB và nén tự động
      const s3 = path.join(ARTIFACT_DIR, 'qa_03_media_library_modal_upload.png');
      await page.screenshot({ path: s3 });
      console.log('-> Đã lưu QA_03:', s3);
    }

    // Đóng Thư viện ảnh
    const closeMediaBtn = page.locator('button[title="Đóng cửa sổ"]').first();
    if (await closeMediaBtn.isVisible()) {
      await closeMediaBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Đóng LessonEditorModal
  console.log('7. Đóng trình biên tập...');
  const closeEditorBtn = page.locator('button[aria-label="Đóng cửa sổ biên tập"]').first();
  if (await closeEditorBtn.isVisible()) {
    await closeEditorBtn.click();
    await page.waitForTimeout(1000);
  }

  // 6. Mở xem trước học sinh (MissionPlayer)
  console.log('8. Mở xem trước học sinh trên Bài 1...');
  const previewEyeBtn = page.locator('button[title="Xem trước như học sinh"]').first();
  await previewEyeBtn.waitFor({ state: 'visible', timeout: 5000 });
  await previewEyeBtn.click();
  await page.waitForTimeout(2000);

  // Câu 1: Single choice (4)
  console.log('-> Giải Câu 1 (Chọn 4)...');
  await page.locator('button:has-text("4")').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Trả lời")').click();
  await page.waitForTimeout(1500);

  // Câu 2: Keypad input (Nhấn phím 3 trên bàn phím ảo)
  console.log('-> Giải Câu 2 (Bàn phím ảo: 3)...');
  await page.locator('button').filter({ hasText: /^3$/ }).first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Trả lời")').click();
  await page.waitForTimeout(1500);

  // Câu 3: Operator pick (Chọn dấu >)
  console.log('-> Giải Câu 3 (Chọn dấu >)...');
  await page.locator('button:has-text(">")').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Trả lời")').click();
  await page.waitForTimeout(1500);

  // Câu 4: Expression match (Ghép 3 cặp)
  console.log('-> Giải Câu 4 (Ghép 3 cặp)...');
  await page.locator('button:has-text("Quả cam")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Số 2")').first().click();
  await page.waitForTimeout(400);

  await page.locator('button:has-text("Bông hoa")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Số 5")').first().click();
  await page.waitForTimeout(400);

  await page.locator('button:has-text("Chú thỏ")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Số 1")').first().click();
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Trả lời")').click();
  await page.waitForTimeout(2000);

  // Đang ở Câu 5: "CÂU 5 / 8" - Khung 5 ô!
  console.log('9. Đang ở Câu 5 (Khung 5 ô) - Chụp Desktop View...');
  const s5 = path.join(ARTIFACT_DIR, 'qa_05_student_view_question5_five_frame.png');
  await page.screenshot({ path: s5 });
  console.log('-> Đã lưu QA_05:', s5);

  // Chuyển sang Viewport Mobile (375x812) cho Câu 5
  console.log('10. Chụp Mobile Responsive View...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(800);
  const s6 = path.join(ARTIFACT_DIR, 'qa_06_student_view_mobile_responsive.png');
  await page.screenshot({ path: s6 });
  console.log('-> Đã lưu QA_06:', s6);

  await browser.close();
  console.log('=== HOÀN TẤT TẤT CẢ ẢNH CHỤP MINH CHỨNG CHẤT LƯỢNG CAO ===');
  process.exit(0);
}

capture().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
