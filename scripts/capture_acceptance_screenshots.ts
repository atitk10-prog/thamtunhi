import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/69b51a7c-2640-45f8-9c9e-9d645159ff47');

// Credentials sourced via environment variables to prevent secret leakage
const STUDENT_CODE = process.env.TEST_STUDENT_CODE || 'HS1B12';
const STUDENT_SECRET = process.env.TEST_STUDENT_SECRET || '';
const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'xuannuong@gmail.com';
const TEACHER_PASS = process.env.TEST_TEACHER_PASS || '';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@thamtutoannhi.edu.vn';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || '';

async function captureAcceptanceScreenshots() {
  console.log('=== TIẾN HÀNH CHỤP TOÀN BỘ BỘ ẢNH NGHIỆM THU PRODUCTION ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  const baseUrl = 'https://thamtunhi.vercel.app';

  // 1. CHỤP GIAO DIỆN HỌC SINH (QUÂN - HS1B12)
  console.log('1. Đăng nhập học sinh Quân (HS1B12)...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  if (STUDENT_CODE && STUDENT_SECRET) {
    await page.fill('input[placeholder*="HS1A01"], input[type="text"]', STUDENT_CODE);
    await page.fill('input[type="password"]', STUDENT_SECRET);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4500);

    const studentPic = path.join(ARTIFACT_DIR, '01_student_portal_clean.png');
    await page.screenshot({ path: studentPic, fullPage: false });
    console.log('-> Đã chụp ảnh Học sinh:', studentPic);

    // Đăng xuất học sinh
    const logoutBtn = page.locator('button:has-text("Đăng xuất")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  // 2. CHỤP GIAO DIỆN GIÁO VIÊN (HÀ THỊ XUÂN NƯƠNG)
  console.log('2. Đăng nhập Giáo viên Hà Thị Xuân Nương...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (TEACHER_EMAIL && TEACHER_PASS) {
    const teacherTab = page.locator('button:has-text("Giáo Viên")').first();
    await teacherTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[type="email"]', TEACHER_EMAIL);
    await page.fill('input[type="password"]', TEACHER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    // Tab 2: Lớp Học & Học Sinh (Quản lý bài giao)
    console.log('3. Chuyển sang Tab 2: Lớp Học & Học Sinh...');
    const tabAssign = page.locator('button:has-text("Lớp Học & Học Sinh")').first();
    if (await tabAssign.isVisible()) {
      await tabAssign.click();
      await page.waitForTimeout(2000);
    }
    const teacherAssignPic = path.join(ARTIFACT_DIR, '02_teacher_assignments_clean.png');
    await page.screenshot({ path: teacherAssignPic, fullPage: false });
    console.log('-> Đã chụp ảnh Quản lý bài giao (gỡ bỏ mô phỏng):', teacherAssignPic);

    // Mở modal Xem tiến độ bài "Luyện tập các số 1 2 3 4 5"
    console.log('4. Mở modal Xem tiến độ...');
    const progressBtn = page.locator('button[title*="tiến độ"]').first();
    if (await progressBtn.isVisible()) {
      await progressBtn.click();
      await page.waitForTimeout(2000);
      const modalPic = path.join(ARTIFACT_DIR, '03_teacher_progress_modal_clean.png');
      await page.screenshot({ path: modalPic, fullPage: false });
      console.log('-> Đã chụp modal tiến độ (gỡ bỏ mô phỏng):', modalPic);

      // Đóng modal
      const closeBtn = page.locator('button:has-text("✕"), svg.lucide-x').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // Tab 3: Phân Tích Mẫu Lỗi & Củng Cố
    console.log('5. Chuyển sang Tab 3: Phân Tích Mẫu Lỗi...');
    const tabStats = page.locator('button:has-text("Phân Tích Mẫu Lỗi")').first();
    if (await tabStats.isVisible()) {
      await tabStats.click();
      await page.waitForTimeout(2500);
      const statsPic = path.join(ARTIFACT_DIR, '04_teacher_analytics_clean.png');
      await page.screenshot({ path: statsPic, fullPage: false });
      console.log('-> Đã chụp Thống kê & Nhầm lẫn (Năm học 2026-2027, gỡ mô phỏng):', statsPic);
    }

    // Đăng xuất giáo viên
    const teacherLogout = page.locator('button:has-text("Đăng xuất")').first();
    if (await teacherLogout.isVisible()) {
      await teacherLogout.click();
      await page.waitForTimeout(1500);
    }
  }

  // 3. CHỤP GIAO DIỆN QUẢN TRỊ VIÊN (CÀI ĐẶT & HẠ TẦNG)
  console.log('6. Đăng nhập Quản trị viên...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (ADMIN_EMAIL && ADMIN_PASS) {
    const adminTab = page.locator('button:has-text("Quản Trị")').first();
    await adminTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    // Click menu Cài đặt & Hạ tầng
    console.log('7. Chuyển sang Cài đặt & Hạ tầng...');
    const settingsTab = page.locator('button:has-text("Cài đặt & Hạ tầng")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(2000);
    }

    const adminPic = path.join(ARTIFACT_DIR, '05_admin_settings_clean.png');
    await page.screenshot({ path: adminPic, fullPage: false });
    console.log('-> Đã chụp Quản trị Cài đặt & Hạ tầng (gỡ bỏ nhật ký):', adminPic);
  }

  await browser.close();
  console.log('=== HOÀN TẤT CHỤP TOÀN BỘ 5 ẢNH NGHIỆM THU ===');
}

captureAcceptanceScreenshots().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
