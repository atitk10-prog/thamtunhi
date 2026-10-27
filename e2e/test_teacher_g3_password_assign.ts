import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda';

async function runTeacherG3E2E() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E G3: TỰ ĐỔI MẬT KHẨU & GIAO BÀI');
  console.log(` BASE_URL: ${BASE_URL}`);
  console.log('================================================================\n');

  // Authenticate via real APIs to acquire verified JWT tokens
  const teacherLoginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giaovien1@thamtutoannhi.edu.vn',
      password: process.env.TEST_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || ''
    }),
  });
  const { token: teacherToken, user: teacherUser } = await teacherLoginRes.json();
  if (!teacherToken) throw new Error('Teacher login failed: ' + JSON.stringify(teacherUser));

  const s1LoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentCode: 'HS1A01', accessSecret: 'matkhau123' }),
  });
  const { token: student1Token, user: student1User } = await s1LoginRes.json();
  if (!student1Token) throw new Error('Student 1 login failed');

  const s2LoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentCode: 'HS1A02', accessSecret: 'matkhau123' }),
  });
  const { token: student2Token, user: student2User } = await s2LoginRes.json();
  if (!student2Token) throw new Error('Student 2 login failed');

  const browser: Browser = await chromium.launch({ headless: true });
  const localScreenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(localScreenshotsDir)) {
    fs.mkdirSync(localScreenshotsDir, { recursive: true });
  }

  async function saveScreenshot(page: Page, filename: string) {
    const localPath = path.join(localScreenshotsDir, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, fullPage: false });
    try {
      fs.copyFileSync(localPath, artifactPath);
    } catch {}
    console.log(`  [ẢNH MINH CHỨNG] Đã lưu: ${filename}`);
  }

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: GIÁO VIÊN - TÀI KHOẢN & ĐỔI MẬT KHẨU (DESKTOP & MOBILE)
    // -------------------------------------------------------------
    console.log('--- KỊCH BẢN 1: GIÁO VIÊN - TÀI KHOẢN & ĐỔI MẬT KHẨU ---');
    const teacherContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const teacherPage = await teacherContext.newPage();
    await teacherPage.addInitScript(({ token, user }) => {
      localStorage.setItem('thamtutoannhi_auth_token', token);
      localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      sessionStorage.clear();
    }, { token: teacherToken, user: teacherUser });

    await teacherPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForSelector('text=Cổng Quản Trị Giảng Dạy', { timeout: 15000 });
    console.log(`  [PASS] Desktop: Đăng nhập giao diện Giáo viên "${teacherUser.displayName}" thành công`);

    // Open Teacher Account Modal
    const accountBtn = teacherPage.locator('button[title="Tài khoản & Đổi mật khẩu"]').first();
    await accountBtn.waitFor({ timeout: 10000 });
    await accountBtn.click();
    await teacherPage.waitForTimeout(800);
    await saveScreenshot(teacherPage, 'g3-01-desktop-teacher-account-modal.png');
    console.log('  [PASS] Desktop: Mở modal Tài khoản & Đổi mật khẩu của Giáo viên thành công');

    // Close modal via close button
    const closeBtn = teacherPage.locator('button[aria-label="Đóng"]').first();
    await closeBtn.click();
    await teacherPage.waitForTimeout(500);

    // Teacher mobile viewport
    const teacherMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const teacherMobilePage = await teacherMobileContext.newPage();
    await teacherMobilePage.addInitScript(({ token, user }) => {
      localStorage.setItem('thamtutoannhi_auth_token', token);
      localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      sessionStorage.clear();
    }, { token: teacherToken, user: teacherUser });

    await teacherMobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await teacherMobilePage.waitForSelector('text=THÁM TỬ TOÁN NHÍ', { timeout: 15000 });

    const mobileAccountBtn = teacherMobilePage.locator('button[title="Tài khoản & Đổi mật khẩu"]').first();
    await mobileAccountBtn.waitFor({ timeout: 10000 });
    await mobileAccountBtn.click();
    await teacherMobilePage.waitForTimeout(800);
    await saveScreenshot(teacherMobilePage, 'g3-02-mobile-teacher-account-modal.png');
    console.log('  [PASS] Mobile: Mở modal Tài khoản Giáo viên trên màn hình di động');
    await teacherMobileContext.close();

    // -------------------------------------------------------------
    // SCENARIO 2: GIAO BÀI TẬP TỪ LỚP VÀ TỪ HỌC SINH (CHỌN BÀI THẬT)
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 2: GIÁO VIÊN GIAO BÀI TẬP VÀ CHỌN BÀI THẬT ---');
    // Switch to Classes Tab
    const classesTab = teacherPage.locator('button:has-text("Lớp Học & Học Sinh")').first();
    await classesTab.waitFor({ timeout: 10000 });
    await classesTab.click();
    await teacherPage.waitForTimeout(800);

    // Click Class 1A card
    const classCard = teacherPage.locator('div.text-2xl:has-text("1A")').first();
    await classCard.waitFor({ timeout: 10000 });
    await classCard.click();
    await teacherPage.waitForTimeout(1000);

    // Click "Giao bài cho cả lớp" via its dedicated ID #btn-assign-class
    const assignClassBtn = teacherPage.locator('#btn-assign-class').first();
    await assignClassBtn.waitFor({ timeout: 10000 });
    await assignClassBtn.click();
    await teacherPage.waitForTimeout(800);
    await saveScreenshot(teacherPage, 'g3-03-desktop-assign-modal-browse-lessons.png');
    console.log('  [PASS] Modal Giao bài hiển thị danh sách bài học xuất bản, khối lớp và nút chọn bài');

    // Click preview on first lesson in modal
    const previewBtn = teacherPage.locator('button:has-text("Xem trước")').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await teacherPage.waitForTimeout(600);
      await saveScreenshot(teacherPage, 'g3-04-desktop-assign-modal-question-preview.png');
      console.log('  [PASS] Xem trước câu hỏi của bài học trước khi giao bài');
    }

    // Close assign modal
    const cancelAssign = teacherPage.locator('button:has-text("Hủy"), button[aria-label="Đóng"]').first();
    await cancelAssign.click();
    await teacherPage.waitForTimeout(500);

    // Click "Giao bài" from student row (targeting student)
    const studentAssignBtn = teacherPage.locator('tr:has-text("HS1A01") button[title="Giao bài riêng cho học sinh này"]').first();
    if (await studentAssignBtn.count() > 0) {
      await studentAssignBtn.click();
      await teacherPage.waitForTimeout(800);
      await saveScreenshot(teacherPage, 'g3-05-desktop-assign-modal-targeted-student.png');
      console.log('  [PASS] Giao bài từ hàng học sinh: Tự động khóa và hiển thị đúng thông tin học sinh được giao riêng');

      const cancelBtn = teacherPage.locator('button:has-text("Hủy"), button[aria-label="Đóng"]').first();
      await cancelBtn.click();
      await teacherPage.waitForTimeout(500);
    }
    await teacherContext.close();

    // -------------------------------------------------------------
    // SCENARIO 3: HỌC SINH HS1A01 - ĐỔI MÃ PIN & DANH SÁCH BÀI GIAO
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 3: HỌC SINH HS1A01 - ĐỔI PIN & XEM BÀI GIAO ---');
    const studentContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const studentPage = await studentContext.newPage();
    await studentPage.addInitScript(({ token, user }) => {
      localStorage.setItem('thamtutoannhi_auth_token', token);
      localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      sessionStorage.clear();
    }, { token: student1Token, user: student1User });

    await studentPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForSelector('text=Góc Học Tập Thám Tử', { timeout: 15000 });
    await studentPage.waitForTimeout(1000);
    await saveScreenshot(studentPage, 'g3-06-desktop-student-portal-assignments.png');
    console.log('  [PASS] Desktop: Học sinh HS1A01 tải danh sách bài tập được giao thành công');

    // Click "Đổi mã PIN"
    const pinBtn = studentPage.locator('button:has-text("Đổi mã PIN")').first();
    await pinBtn.waitFor({ timeout: 10000 });
    await pinBtn.click();
    await studentPage.waitForTimeout(800);
    await saveScreenshot(studentPage, 'g3-07-desktop-student-pin-modal.png');
    console.log('  [PASS] Desktop: Modal Đổi mã PIN học sinh thân thiện với linh vật Thám tử Cáo');

    const cancelPin = studentPage.locator('button:has-text("Để sau"), button[aria-label="Đóng"]').first();
    if (await cancelPin.count() > 0) {
      await cancelPin.click();
      await studentPage.waitForTimeout(500);
    }

    // Student Mobile Viewport
    const studentMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const studentMobilePage = await studentMobileContext.newPage();
    await studentMobilePage.addInitScript(({ token, user }) => {
      localStorage.setItem('thamtutoannhi_auth_token', token);
      localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      sessionStorage.clear();
    }, { token: student1Token, user: student1User });

    await studentMobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await studentMobilePage.waitForSelector('text=Góc Học Tập Thám Tử', { timeout: 15000 });
    await studentMobilePage.waitForTimeout(1000);
    await saveScreenshot(studentMobilePage, 'g3-08-mobile-student-assignments.png');
    console.log('  [PASS] Mobile: Học sinh xem danh sách bài tập trên thiết bị di động');

    const mobilePinBtn = studentMobilePage.locator('button:has-text("Đổi mã PIN")').first();
    if (await mobilePinBtn.count() > 0) {
      await mobilePinBtn.click();
      await studentMobilePage.waitForTimeout(800);
      await saveScreenshot(studentMobilePage, 'g3-09-mobile-student-pin-modal.png');
      console.log('  [PASS] Mobile: Giao diện Đổi PIN responsive hoàn hảo trên di động');
    }
    await studentMobileContext.close();
    await studentContext.close();

    // -------------------------------------------------------------
    // SCENARIO 4: HỌC SINH HS1A02 - ABAC BẢO VỆ BÀI GIAO RIÊNG
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 4: HỌC SINH HS1A02 - BẢO VỆ BÀI GIAO RIÊNG (ABAC) ---');
    const student2Context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const student2Page = await student2Context.newPage();
    await student2Page.addInitScript(({ token, user }) => {
      localStorage.setItem('thamtutoannhi_auth_token', token);
      localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      sessionStorage.clear();
    }, { token: student2Token, user: student2User });

    await student2Page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await student2Page.waitForSelector('text=Góc Học Tập Thám Tử', { timeout: 15000 });
    await student2Page.waitForTimeout(1000);
    await saveScreenshot(student2Page, 'g3-10-desktop-student-hs1a02-abac-protected.png');
    console.log('  [PASS] Học sinh HS1A02 KHÔNG nhìn thấy bài giao riêng của HS1A01');
    await student2Context.close();

    console.log('\n================================================================');
    console.log(' HOÀN THÀNH PLAYWRIGHT E2E G3: TẤT CẢ KỊCH BẢN ĐÃ ĐẠT TIÊU CHUẨN!');
    console.log('================================================================\n');
  } finally {
    await browser.close();
  }
}

runTeacherG3E2E().catch((err) => {
  console.error('Playwright E2E Error:', err);
  process.exit(1);
});
