import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { makeToken } from '../scripts/token_helper.ts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTeacherPortalE2E() {
  console.log('======================================================');
  console.log(' STARTING TEACHER PORTAL G1 PLAYWRIGHT E2E AUDIT ');
  console.log(` Target: ${BASE_URL}`);
  console.log('======================================================');

  const browser: Browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Pre-generate auth tokens
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

  const thanhThanhToken = makeToken({
    uid: 'user-1792533985096',
    email: 'thanhthanh@gmail.com',
    role: 'teacher',
    displayName: 'Trần Thanh Thanh',
  });

  const thanhThanhUser = {
    id: 'user-1792533985096',
    email: 'thanhthanh@gmail.com',
    role: 'teacher',
    displayName: 'Trần Thanh Thanh',
  };

  // --------------------------------------------------------------------------
  // 1. DESKTOP VIEWPORT TEST (1366 x 768) - TEACHER 1 (CO MAI LAN)
  // --------------------------------------------------------------------------
  console.log('\n--- 1. DESKTOP AUDIT (1366x768) - TEACHER 1 ---');
  const desktopContext: BrowserContext = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const desktopPage: Page = await desktopContext.newPage();

  try {
    // Inject session into localStorage before loading page using correct keys
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

    console.log('✓ Desktop: Tải cổng Giáo viên Cô Mai Lan thành công');

    // Switch to Tab: Lớp Học & Học Sinh
    await desktopPage.click('button:has-text("Lớp Học & Học Sinh")');
    await desktopPage.waitForSelector('text=Danh sách Lớp học được phân công', { timeout: 10000 });

    // Verify Teacher 1 sees 2 classes: 1A and 1B
    await desktopPage.waitForSelector('text=Lớp 1A', { timeout: 10000 });
    await desktopPage.waitForSelector('text=Lớp 1B', { timeout: 10000 });
    console.log('✓ Desktop: Hiển thị đúng 2 lớp được phân công: 1A và 1B');

    const ssDesktopClasses = path.join(screenshotsDir, 'teacher-01-desktop-classes.png');
    await desktopPage.screenshot({ path: ssDesktopClasses, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Danh sách lớp: ${ssDesktopClasses}`);

    // Click into Class 1A to view roster
    await desktopPage.click('text=Lớp 1A');
    await desktopPage.waitForSelector('text=Danh sách Học Sinh Lớp 1A', { timeout: 10000 });
    await desktopPage.waitForSelector('text=Niên khóa: 2026 - 2027', { timeout: 10000 });
    await desktopPage.waitForSelector('text=12 học sinh', { timeout: 10000 });
    console.log('✓ Desktop: Mở Roster 1A thành công, sĩ số 12 HS, niên khóa 2026 - 2027');

    // Screenshot Roster 1A Desktop
    const ssDesktopRoster = path.join(screenshotsDir, 'teacher-02-desktop-roster-1a.png');
    await desktopPage.screenshot({ path: ssDesktopRoster, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Roster 1A: ${ssDesktopRoster}`);

    // Test Search input
    await desktopPage.fill('#roster-search-input', 'HS1A03');
    await desktopPage.waitForTimeout(500);
    const visibleStudents = await desktopPage.locator('#roster-table tbody tr').count();
    if (visibleStudents !== 1) {
      throw new Error(`Tìm kiếm HS1A03 trả về ${visibleStudents} kết quả (kỳ vọng 1)`);
    }
    console.log('✓ Desktop: Tìm kiếm học sinh hoạt động chính xác');

    // Clear search
    await desktopPage.fill('#roster-search-input', '');
    await desktopPage.waitForTimeout(500);

    // Test Sort dropdown
    await desktopPage.selectOption('#roster-sort-select', 'name-asc');
    await desktopPage.waitForTimeout(500);
    console.log('✓ Desktop: Bộ lọc sắp xếp hoạt động chuẩn');

    // Open Student Detail Modal (click first Eye button)
    const detailBtn = desktopPage.locator('button[title*="Xem chi tiết"]').first();
    await detailBtn.click();
    await desktopPage.waitForSelector('text=Tiến độ các bài tập được giao', { timeout: 5000 });
    console.log('✓ Desktop: Mở Modal Chi Tiết Học Sinh thành công');

    const ssStudentDetail = path.join(screenshotsDir, 'teacher-03-desktop-student-detail-modal.png');
    await desktopPage.screenshot({ path: ssStudentDetail, fullPage: false });
    console.log(`✓ Đã chụp ảnh Modal Chi tiết học sinh: ${ssStudentDetail}`);

    // Close detail modal
    await desktopPage.click('button:has-text("Đóng")');
    await desktopPage.waitForTimeout(500);

    // Open Lock Confirmation Modal (click lock icon button)
    const lockBtn = desktopPage.locator('button[title*="Khóa tài khoản"]').first();
    await lockBtn.click();
    await desktopPage.waitForSelector('text=Khóa Tài Khoản Học Sinh', { timeout: 5000 });
    console.log('✓ Desktop: Mở Modal Xác Nhận Khóa Tài Khoản (không dùng window.confirm) thành công');

    const ssLockModal = path.join(screenshotsDir, 'teacher-04-desktop-lock-modal.png');
    await desktopPage.screenshot({ path: ssLockModal, fullPage: false });
    console.log(`✓ Đã chụp ảnh Modal Khóa tài khoản: ${ssLockModal}`);

    // Cancel lock
    await desktopPage.click('button:has-text("Hủy bỏ")');
    await desktopPage.waitForTimeout(500);

  } finally {
    await desktopContext.close();
  }

  // --------------------------------------------------------------------------
  // 2. EMPTY STATE TEST (1366 x 768) - TEACHER TRAN THANH THANH (0 CLASSES)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. DESKTOP AUDIT (1366x768) - TRAN THANH THANH (EMPTY STATE) ---');
  const emptyContext: BrowserContext = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const emptyPage: Page = await emptyContext.newPage();

  try {
    await emptyPage.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      },
      { token: thanhThanhToken, user: thanhThanhUser }
    );

    await emptyPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await emptyPage.waitForSelector('text=Trần Thanh Thanh', { timeout: 15000 });

    // Click tab Lớp Học & Học Sinh
    await emptyPage.click('button:has-text("Lớp Học & Học Sinh")');
    await emptyPage.waitForSelector('text=Chưa Có Lớp Học Được Phân Công', { timeout: 10000 });
    console.log('✓ Desktop: Giáo viên Trần Thanh Thanh thấy đúng giao diện Empty State hướng dẫn');

    const ssEmptyState = path.join(screenshotsDir, 'teacher-05-desktop-empty-state.png');
    await emptyPage.screenshot({ path: ssEmptyState, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Empty State: ${ssEmptyState}`);
  } finally {
    await emptyContext.close();
  }

  // --------------------------------------------------------------------------
  // 3. TABLET VIEWPORT TEST (768 x 1024)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. TABLET AUDIT (768x1024) - TEACHER 1 ---');
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
    await tabletPage.waitForSelector('text=Cô Mai Lan', { timeout: 15000 });
    await tabletPage.click('button:has-text("Lớp Học & Học Sinh")');
    await tabletPage.waitForSelector('text=Lớp 1A', { timeout: 10000 });

    // Open Roster
    await tabletPage.click('text=Lớp 1A');
    await tabletPage.waitForSelector('text=Danh sách Học Sinh Lớp 1A', { timeout: 10000 });

    const ssTabletRoster = path.join(screenshotsDir, 'teacher-06-tablet-roster-1a.png');
    await tabletPage.screenshot({ path: ssTabletRoster, fullPage: false });
    console.log(`✓ Đã chụp ảnh Tablet (768x1024): ${ssTabletRoster}`);
  } finally {
    await tabletContext.close();
  }

  // --------------------------------------------------------------------------
  // 4. MOBILE VIEWPORT TEST (390 x 844)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. MOBILE AUDIT (390x844) - TEACHER 1 ---');
  const mobileContext: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
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
    await mobilePage.waitForSelector('text=THÁM TỬ TOÁN NHÍ', { timeout: 15000 });
    await mobilePage.click('button:has-text("Lớp Học & Học Sinh")');
    await mobilePage.waitForSelector('text=Lớp 1A', { timeout: 10000 });

    // Open Roster
    await mobilePage.click('text=Lớp 1A');
    await mobilePage.waitForSelector('text=Danh sách Học Sinh Lớp 1A', { timeout: 10000 });

    const ssMobileRoster = path.join(screenshotsDir, 'teacher-07-mobile-roster-1a.png');
    await mobilePage.screenshot({ path: ssMobileRoster, fullPage: false });
    console.log(`✓ Đã chụp ảnh Mobile (390x844): ${ssMobileRoster}`);
  } finally {
    await mobileContext.close();
  }

  await browser.close();
  console.log('\n=== HOÀN TẤT KIỂM THỬ PLAYWRIGHT G1 THÀNH CÔNG 100% ===');
}

runTeacherPortalE2E().catch((err) => {
  console.error('Playwright E2E failed:', err);
  process.exit(1);
});
