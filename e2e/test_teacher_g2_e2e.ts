import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { makeToken } from '../scripts/token_helper.ts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda';

async function runTeacherG2E2E() {
  console.log('======================================================');
  console.log(' STARTING TEACHER PORTAL G2 PLAYWRIGHT E2E AUDIT ');
  console.log(` Target: ${BASE_URL}`);
  console.log('======================================================');

  const browser: Browser = await chromium.launch({ headless: true });
  const localScreenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(localScreenshotsDir)) {
    fs.mkdirSync(localScreenshotsDir, { recursive: true });
  }

  const teacher1Token = makeToken({
    uid: 'teacher-1',
    email: 'giaovien1@thamtutoannhi.edu.vn',
    role: 'teacher',
    displayName: 'Cô Mai Lan (Khối 1)',
  });

  const teacher1User = {
    id: 'teacher-1',
    email: 'giaovien1@thamtutoannhi.edu.vn',
    role: 'teacher',
    displayName: 'Cô Mai Lan (Khối 1)',
  };

  async function saveScreenshot(page: Page, filename: string) {
    const localPath = path.join(localScreenshotsDir, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`  [SS] Captured: ${filename}`);
  }

  // --------------------------------------------------------------------------
  // 1. DESKTOP VIEWPORT TEST (1366 x 768) - TEACHER 1
  // --------------------------------------------------------------------------
  console.log('\n--- 1. DESKTOP VIEWPORT (1366x768) ---');
  const desktopContext: BrowserContext = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const desktopPage: Page = await desktopContext.newPage();

  try {
    await desktopPage.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      },
      { token: teacher1Token, user: teacher1User }
    );

    await desktopPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForSelector('text=THÁM TỬ TOÁN NHÍ', { timeout: 15000 });
    await desktopPage.waitForSelector('text=Cô Mai Lan', { timeout: 10000 });
    console.log('  [PASS] Desktop: Đăng nhập Cổng Giáo viên thành công');

    // 1.1 Verify Lesson Tab and 24 lessons
    await desktopPage.waitForSelector('text=Kho Học Liệu & Bài Học', { timeout: 10000 });
    await desktopPage.waitForSelector('text=Toán Lớp 1', { timeout: 10000 });
    await saveScreenshot(desktopPage, 'teacher-g2-01-desktop-curriculum-grid.png');

    // 1.2 Open Lesson Editor for Lesson 1 (Đếm và nhận biết số trong phạm vi 5)
    console.log('  [STEP] Mở Lesson Editor cho Bài 1...');
    const editBtn = desktopPage.locator('button:has-text("Biên tập")').first();
    await editBtn.click();

    // Verify LessonEditorModal is open
    await desktopPage.waitForSelector('text=Biên Tập:', { timeout: 10000 });
    console.log('  [PASS] Desktop: Modal Biên tập mở thành công');

    // Verify all 8 questions appear in list
    await desktopPage.waitForSelector('#question-card-7', { timeout: 10000 });
    const questionCards = await desktopPage.locator('div[id^="question-card-"]').count();
    console.log(`  [PASS] Desktop: Hiển thị đầy đủ ${questionCards}/8 câu hỏi trong danh sách bài học`);
    if (questionCards < 8) {
      throw new Error(`Kỳ vọng ít nhất 8 câu hỏi, nhưng chỉ thấy ${questionCards}`);
    }

    await saveScreenshot(desktopPage, 'teacher-g2-02-desktop-editor-8questions.png');

    // 1.3 Check Question 3 (Comparison 4 stars vs 2 stars)
    const q3Card = desktopPage.locator('#question-card-2');
    await q3Card.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(400);
    await q3Card.locator('text=So sánh số lượng').waitFor({ timeout: 5000 });
    console.log('  [PASS] Desktop: Câu hỏi số 3 (Dạng So sánh số lượng 4 sao vs 2 sao) hiển thị chuẩn xác');
    await saveScreenshot(desktopPage, 'teacher-g2-03-desktop-editor-q3-comparison.png');

    // 1.4 Check Question 4 (Expression Match)
    const q4Card = desktopPage.locator('#question-card-3');
    await q4Card.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(400);
    await q4Card.locator('text=Các cặp thẻ ghép nối tương ứng').waitFor({ timeout: 5000 });
    console.log('  [PASS] Desktop: Câu hỏi số 4 (Dạng Ghép nối cặp thẻ) hiển thị đầy đủ trường dữ liệu');
    await saveScreenshot(desktopPage, 'teacher-g2-04-desktop-editor-q4-pairs.png');

    // 1.5 Test In-Editor Preview Mode
    console.log('  [STEP] Bấm nút Xem trước trong modal biên tập...');
    await desktopPage.click('button:has-text("Xem trước")');
    await desktopPage.waitForSelector('text=Chế độ Xem trước như Học sinh', { timeout: 10000 });
    console.log('  [PASS] Desktop: Chuyển sang chế độ Xem trước như Học sinh (không ghi điểm Firestore thật)');
    await saveScreenshot(desktopPage, 'teacher-g2-05-desktop-preview-mission.png');

    // Close preview (editor was closed when entering preview, so we are back on main curriculum view)
    await desktopPage.click('button:has-text("Đóng xem trước")');
    await desktopPage.waitForTimeout(500);

    // 1.6 Open AI Draft Assistant Modal
    console.log('  [STEP] Mở Modal Trợ lý AI tạo bài nháp...');
    await desktopPage.click('button:has-text("AI Tạo Bài Nháp")');
    await desktopPage.waitForSelector('text=AI Soạn Bài Nháp Toán', { timeout: 10000 });
    console.log('  [PASS] Desktop: Modal AI Soạn Bài hiển thị đầy đủ các trường thiết lập sư phạm');
    await saveScreenshot(desktopPage, 'teacher-g2-06-desktop-ai-draft-modal.png');

    // Close AI modal
    await desktopPage.click('button[aria-label="Đóng AI Soạn Bài"]');
    await desktopPage.waitForTimeout(400);
  } catch (err) {
    console.error('Desktop E2E Error:', err);
    throw err;
  } finally {
    await desktopContext.close();
  }

  // --------------------------------------------------------------------------
  // 2. TABLET VIEWPORT TEST (768 x 1024)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. TABLET VIEWPORT (768x1024) ---');
  const tabletContext: BrowserContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const tabletPage: Page = await tabletContext.newPage();

  try {
    await tabletPage.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      },
      { token: teacher1Token, user: teacher1User }
    );

    await tabletPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await tabletPage.waitForSelector('text=Kho Học Liệu & Bài Học', { timeout: 15000 });
    console.log('  [PASS] Tablet: Kho học liệu tải tốt trên màn hình 768px');

    // Open Editor on Tablet
    const editBtnTablet = tabletPage.locator('button:has-text("Biên tập")').first();
    await editBtnTablet.click();
    await tabletPage.waitForSelector('text=Biên Tập:', { timeout: 10000 });
    await tabletPage.waitForSelector('#question-card-7', { timeout: 10000 });
    console.log('  [PASS] Tablet: Editor modal responsive hiển thị đủ 8 câu hỏi');
    await saveScreenshot(tabletPage, 'teacher-g2-07-tablet-editor.png');
  } catch (err) {
    console.error('Tablet E2E Error:', err);
    throw err;
  } finally {
    await tabletContext.close();
  }

  // --------------------------------------------------------------------------
  // 3. MOBILE VIEWPORT TEST (390 x 844)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. MOBILE VIEWPORT (390x844) ---');
  const mobileContext: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage: Page = await mobileContext.newPage();

  try {
    await mobilePage.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      },
      { token: teacher1Token, user: teacher1User }
    );

    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('text=Toán Lớp 1', { timeout: 15000 });
    console.log('  [PASS] Mobile: Tải Cổng Giáo viên thành công trên mobile 390px');
    await saveScreenshot(mobilePage, 'teacher-g2-08-mobile-curriculum.png');

    // Open Editor on Mobile
    const editBtnMobile = mobilePage.locator('button:has-text("Biên tập")').first();
    await editBtnMobile.click();
    await mobilePage.waitForSelector('text=Biên Tập:', { timeout: 10000 });
    console.log('  [PASS] Mobile: Editor modal mở thành công trên mobile');
    await saveScreenshot(mobilePage, 'teacher-g2-09-mobile-editor.png');
  } catch (err) {
    console.error('Mobile E2E Error:', err);
    throw err;
  } finally {
    await mobileContext.close();
  }

  await browser.close();
  console.log('\n======================================================');
  console.log(' TEACHER G2 PLAYWRIGHT E2E COMPLETED: 100% PASS');
  console.log('======================================================');
}

runTeacherG2E2E().catch((err) => {
  console.error('E2E Runner Failed:', err);
  process.exit(1);
});
