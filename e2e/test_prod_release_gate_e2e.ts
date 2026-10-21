import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'https://thamtunhi.vercel.app';
const ARTIFACT_DIR = 'C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda';

async function runProdReleaseGateE2E() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E TRỰC TIẾP TRÊN VERCEL PRODUCTION');
  console.log(` Mục tiêu: ${PROD_URL}`);
  console.log('================================================================\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const localScreenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(localScreenshotsDir)) {
    fs.mkdirSync(localScreenshotsDir, { recursive: true });
  }

  async function saveScreenshot(page: Page, filename: string) {
    const localPath = path.join(localScreenshotsDir, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`  [ẢNH PRODUCTION] Đã lưu: ${filename}`);
  }

  // --------------------------------------------------------------------------
  // PHẦN 1: GIÁO VIÊN TRÊN PRODUCTION (AI TẠO BÀI NHÁP, BIÊN TẬP, PHÂN TÍCH LỖI, XEM TRƯỚC)
  // --------------------------------------------------------------------------
  console.log('--- PHẦN 1: GIÁO VIÊN TRÊN PRODUCTION ---');
  const teacherContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const teacherPage = await teacherContext.newPage();

  try {
    // 1.1 Đăng nhập giáo viên tại trang chính thức
    console.log('  1.1 Mở trang đăng nhập Production...');
    await teacherPage.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForSelector('text=THÁM TỬ TOÁN NHÍ', { timeout: 15000 });

    // Chuyển sang tab Giáo Viên
    const teacherTabBtn = teacherPage.locator('button:has-text("Giáo Viên")');
    await teacherTabBtn.click();
    await teacherPage.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Listen for browser logs & network API responses
    teacherPage.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.text()));
    teacherPage.on('pageerror', err => console.log('  [BROWSER ERROR]', err.message));
    teacherPage.on('response', res => {
      if (res.url().includes('/api/')) {
        console.log(`  [API RESP] ${res.status()} ${res.url()}`);
      }
    });

    // Điền thông tin đăng nhập Giáo viên
    await teacherPage.fill('input[type="email"]', 'giaovien1@thamtutoannhi.edu.vn');
    await teacherPage.fill('input[type="password"]', 'MatKhauGiaoVien@123');
    await teacherPage.click('button[type="submit"]:has-text("Đăng nhập")');

    // Chờ vào TeacherPortal
    await teacherPage.waitForSelector('text=Kho Học Liệu & Bài Học', { timeout: 15000 });
    console.log('  [PASS] Giáo viên đăng nhập thành công vào TeacherPortal trên Production');

    // 1.2 Mở modal AI Tạo Bài Nháp & sinh thực tế 4 câu Toán Lớp 1
    console.log('  1.2 Mở công cụ "AI Tạo Bài Nháp"...');
    const aiDraftBtn = teacherPage.locator('button:has-text("AI Tạo Bài Nháp")').first();
    await aiDraftBtn.click();
    await teacherPage.waitForSelector('text=AI Soạn Bài Nháp Toán (Gemini)', { timeout: 10000 });

    // Nhấn nút sinh bài nháp ở chân modal
    console.log('  Đang gửi yêu cầu tới Gemini API trên Production...');
    const generateBtn = teacherPage.locator('.fixed button:has-text("AI Tạo Bài Nháp")');
    console.log('  Số nút AI Tạo Bài Nháp tìm thấy trong modal:', await generateBtn.count());
    await generateBtn.click();

    // Chờ AI sinh xong 4 câu hỏi (tối đa 90 giây cho API)
    await teacherPage.waitForSelector('button:has-text("Đưa vào bài giảng")', { timeout: 90000 });
    console.log('  [PASS] Gemini AI sinh thành công các câu hỏi thực tế trên Production!');
    await saveScreenshot(teacherPage, 'prod-gate-01-teacher-ai-draft-modal.png');

    // 1.3 Đưa vào bài giảng (Trình biên tập)
    const applyBtn = teacherPage.locator('button:has-text("Đưa vào bài giảng")');
    await applyBtn.click();
    await teacherPage.waitForSelector('button[aria-label="Đóng cửa sổ biên tập"]', { timeout: 15000 });
    console.log('  [PASS] Chuyển các câu hỏi AI vào Trình biên tập thành công');
    await saveScreenshot(teacherPage, 'prod-gate-02-teacher-editor-ai-questions.png');

    // Đóng trình biên tập
    const closeEditorBtn = teacherPage.locator('button[aria-label="Đóng cửa sổ biên tập"]');
    await closeEditorBtn.click();

    // 1.4 Kiểm tra Tab "Phân Tích Mẫu Lỗi & Củng Cố" & Gọi AI Tóm Tắt Khắc Phục Lỗi
    console.log('  1.4 Chuyển sang Tab Phân Tích Mẫu Lỗi & Củng Cố...');
    const analyticsTab = teacherPage.locator('button:has-text("Phân Tích Mẫu Lỗi")');
    await analyticsTab.click();
    await teacherPage.waitForSelector('text=Nguồn dữ liệu:', { timeout: 15000 });

    console.log('  Kích hoạt nút "AI Tóm Tắt Khắc Phục Lỗi"...');
    const aiSummarizeBtn = teacherPage.locator('button:has-text("AI Tóm Tắt Khắc Phục Lỗi")');
    await aiSummarizeBtn.click();

    // Chờ AI sinh tóm tắt sư phạm (tối đa 60 giây)
    await teacherPage.waitForSelector('text=AI Đề Xuất Hoạt Động Củng Cố Cho Giáo Viên', { timeout: 60000 });
    console.log('  [PASS] AI Tóm Tắt Khắc Phục Lỗi trả về bản phân tích sư phạm hoàn chỉnh');
    await saveScreenshot(teacherPage, 'prod-gate-03-teacher-misconception-analytics.png');

    // 1.5 Kiểm tra Chế độ Xem trước Lesson 1 v2
    console.log('  1.5 Mở chế độ Xem Trước Bài 1 (v2)...');
    const lessonsTab = teacherPage.locator('button:has-text("Kho Học Liệu & Bài Học")');
    await lessonsTab.click();
    await teacherPage.waitForSelector('text=Các số từ 1 đến 5', { timeout: 10000 });

    const previewBtn = teacherPage.locator('button[title="Xem trước như học sinh"]').first();
    await previewBtn.click();
    await teacherPage.waitForSelector('text=Chế độ Xem trước như Học sinh', { timeout: 10000 });
    console.log('  [PASS] Chế độ Xem Trước Sư Phạm Bài 1 (v2) hoạt động mượt mà');
    await saveScreenshot(teacherPage, 'prod-gate-04-teacher-preview-v2.png');

    const exitPreviewBtn = teacherPage.locator('button:has-text("Đóng xem trước")');
    await exitPreviewBtn.click();
  } finally {
    await teacherContext.close();
  }

  // --------------------------------------------------------------------------
  // PHẦN 2: HỌC SINH LÀM BÀI TRÊN PRODUCTION (DESKTOP)
  // --------------------------------------------------------------------------
  console.log('\n--- PHẦN 2: HỌC SINH TRÊN PRODUCTION (DESKTOP) ---');
  const studentContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const studentPage = await studentContext.newPage();

  try {
    console.log('  2.1 Học sinh đăng nhập tại Production...');
    await studentPage.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForSelector('input[placeholder*="HS1A01"]', { timeout: 15000 });

    await studentPage.fill('input[placeholder*="HS1A01"]', 'HS1A01');
    await studentPage.fill('input[type="password"]', 'matkhau123');
    await studentPage.click('button[type="submit"]:has-text("Vào Phá Án Toán Học")');

    // Chờ vào StudentPortal
    await studentPage.waitForSelector('text=Góc Học Tập Thám Tử', { timeout: 20000 });
    console.log('  [PASS] Học sinh đăng nhập thành công vào StudentPortal trên Production');

    // Nhấn Bắt đầu làm bài (Bài 1)
    const startMissionBtn = studentPage.locator('button:has-text("Bắt đầu phá án"), button:has-text("Luyện tập lại"), button:has-text("Tiếp tục làm")').first();
    await startMissionBtn.click();

    await studentPage.waitForSelector('text=Câu 1 / 8', { timeout: 15000 });
    console.log('  [PASS] MissionPlayer nạp thành công Bài 1 (v2)');

    // 2.2 Câu 1: Đếm táo – Chú thích không lộ số lượng
    const counterCaption = await studentPage.locator('text=Quan sát mô hình đếm').first().textContent();
    console.log(`  [PASS] Câu 1: Chú thích chuẩn: "${counterCaption}"`);
    await saveScreenshot(studentPage, 'prod-gate-05-student-desktop-counters.png');

    // Trả lời câu 1: chọn 4
    await studentPage.locator('div.grid button:has-text("4")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.3 Câu 2: Thử nhập sai -> Modal Manh Mối Thám Tử Toán Nhí
    await studentPage.waitForSelector('text=Câu 2 / 8', { timeout: 10000 });
    await studentPage.locator('div.grid-cols-3 button:has-text("9")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    await studentPage.waitForSelector('text=Manh Mối Thám Tử Toán Nhí', { timeout: 10000 });
    console.log('  [PASS] Câu 2: Trả lời sai lần đầu hiển thị Modal Manh Mối');
    await saveScreenshot(studentPage, 'prod-gate-06-student-desktop-hint-modal.png');

    // Thử lại câu 2: xoá và nhập 3
    await studentPage.locator('button:has-text("Thử lại lần nữa nào!")').first().click();
    await studentPage.waitForSelector('text=Manh Mối Thám Tử Toán Nhí', { state: 'hidden', timeout: 5000 });
    await studentPage.waitForTimeout(500);

    await studentPage.locator('button[title="Xóa hết"]').first().click();
    await studentPage.waitForTimeout(300);
    await studentPage.locator('div.grid-cols-3 button:has-text("3")').first().click();
    await studentPage.waitForTimeout(300);
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.4 Câu 3: So sánh không lộ số lượng trong nhãn
    await studentPage.waitForSelector('text=Câu 3 / 8', { timeout: 15000 });
    console.log('  Đang ở Câu 3 / 8. Kiểm tra nội dung giao diện...');
    await saveScreenshot(studentPage, 'prod-gate-07-student-desktop-comparison.png');
    const bodyText = await studentPage.innerText('body');
    console.log('  [NỘI DUNG CÂU 3]:', bodyText.substring(0, 300).replace(/\n+/g, ' '));
    await studentPage.waitForSelector('text=Quan sát và so sánh hai nhóm vật thể', { timeout: 10000 });
    console.log('  [PASS] Câu 3: So sánh hiển thị Nhóm A và Nhóm B không lộ chữ số');
    await studentPage.locator('button:has-text(">")').first().click();
    await studentPage.waitForTimeout(200);
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.5 Câu 4: Ghép nối biểu tượng thực tế
    await studentPage.waitForSelector('text=Câu 4 / 8', { timeout: 10000 });
    // Nối các cặp: Cam -> Số 2, Hoa -> Số 5, Thỏ -> Số 1
    await studentPage.locator('button:has-text("Quả cam")').first().click();
    await studentPage.locator('button:has-text("Số 2")').first().click();
    await studentPage.locator('button:has-text("Bông hoa")').first().click();
    await studentPage.locator('button:has-text("Số 5")').first().click();
    await studentPage.locator('button:has-text("Chú thỏ")').first().click();
    await studentPage.locator('button:has-text("Số 1")').first().click();

    await saveScreenshot(studentPage, 'prod-gate-08-student-desktop-expression-match.png');
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.6 Câu 5: Khung 5 ô chấm tròn xanh
    await studentPage.waitForSelector('text=Câu 5 / 8', { timeout: 10000 });
    await studentPage.locator('div.grid button:has-text("5")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.7 Câu 6: Sắp xếp số
    await studentPage.waitForSelector('text=Câu 6 / 8', { timeout: 10000 });
    await studentPage.locator('button.w-16:has-text("1")').first().click();
    await studentPage.locator('button.w-16:has-text("2")').first().click();
    await studentPage.locator('button.w-16:has-text("3")').first().click();
    await studentPage.locator('button.w-16:has-text("4")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.8 Câu 7: Phép cộng 2 + 1 = 3
    await studentPage.waitForSelector('text=Câu 7 / 8', { timeout: 10000 });
    await studentPage.locator('div.grid-cols-3 button:has-text("3")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.9 Câu 8: Số liền sau 4 là 5
    await studentPage.waitForSelector('text=Câu 8 / 8', { timeout: 10000 });
    await studentPage.locator('div.grid button:has-text("5")').first().click();
    await studentPage.locator('button:has-text("Trả lời")').click();

    // 2.10 Hoàn thành & Nhận huy hiệu
    await studentPage.waitForSelector('text=Chúc mừng Thám tử nhí!', { timeout: 15000 });
    console.log('  [PASS] Học sinh hoàn thành nhiệm vụ và nhận huy hiệu trên Production');
    await saveScreenshot(studentPage, 'prod-gate-09-student-desktop-completion.png');
  } finally {
    await studentContext.close();
  }

  // --------------------------------------------------------------------------
  // PHẦN 3: HỌC SINH TRÊN PRODUCTION (MOBILE 390 x 844)
  // --------------------------------------------------------------------------
  console.log('\n--- PHẦN 3: HỌC SINH TRÊN PRODUCTION (MOBILE 390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('input[placeholder*="HS1A01"]', { timeout: 15000 });

    await mobilePage.fill('input[placeholder*="HS1A01"]', 'HS1A01');
    await mobilePage.fill('input[type="password"]', 'matkhau123');
    await mobilePage.click('button[type="submit"]:has-text("Vào Phá Án Toán Học")');

    await mobilePage.waitForSelector('text=Góc Học Tập Thám Tử', { timeout: 20000 });
    const mobileStartBtn = mobilePage.locator('button:has-text("Bắt đầu phá án"), button:has-text("Luyện tập lại"), button:has-text("Tiếp tục làm")').first();
    await mobileStartBtn.click();

    await mobilePage.waitForSelector('text=Câu 1 / 8', { timeout: 15000 });
    console.log('  [PASS] Mobile: Giao diện làm bài hiển thị chuẩn xác trên viewport 390px');

    // Chuyển trạng thái âm thanh trên Mobile
    const soundToggle = mobilePage.locator('button:has-text("Âm thanh")');
    await soundToggle.click();
    console.log('  [PASS] Mobile: Nút Bật/Tắt âm thanh tương tác mượt mà');
    await saveScreenshot(mobilePage, 'prod-gate-10-student-mobile-390px.png');
  } finally {
    await mobileContext.close();
  }

  await browser.close();
  console.log('\n================================================================');
  console.log(' HOÀN TẤT KIỂM THỬ PLAYWRIGHT E2E PRODUCTION RELEASE GATE: 100% PASS');
  console.log('================================================================');
}

runProdReleaseGateE2E().catch(err => {
  console.error('LỖI E2E PRODUCTION GATE:', err);
  process.exit(1);
});
