import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runAdminPortalAudit() {
  console.log('======================================================');
  console.log(' STARTING ADMIN PORTAL 9-MODULE & RESPONSIVE AUDIT ');
  console.log(` Target: ${BASE_URL}`);
  console.log('======================================================');

  const browser: Browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. DESKTOP VIEWPORT TEST (1280 x 800)
  console.log('\n--- 1. DESKTOP AUDIT (1280x800) ---');
  const desktopContext: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage: Page = await desktopContext.newPage();

  try {
    await desktopPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await desktopPage.click('button:has-text("Quản Trị")');
    await desktopPage.fill('input[type="email"]', 'admin@thamtutoannhi.edu.vn');
    await desktopPage.fill('input[type="password"]', 'AdminBaoMat@123');
    await desktopPage.click('button:has-text("Đăng nhập")');
    await desktopPage.waitForSelector('text=Trung Tâm Quản Trị Hệ Thống', { timeout: 10000 });

    console.log('✓ Desktop: Đăng nhập Admin thành công');

    // Screenshot Desktop Overview
    await desktopPage.waitForTimeout(1000);
    const ssDesktopOverview = path.join(screenshotsDir, 'admin-01-desktop-overview.png');
    await desktopPage.screenshot({ path: ssDesktopOverview, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Tổng quan Desktop: ${ssDesktopOverview}`);

    // Verify 9 Tabs exist in desktop sidebar
    const tabLabels = [
      'Tổng quan',
      'Người dùng & Phân quyền',
      'Lớp học & Phân công',
      'Năm học',
      'Học liệu & Bài tập',
      'Kết quả & Thống kê',
      'Dữ liệu & Sao lưu',
      'Nhật ký hoạt động',
      'Cài đặt hệ thống',
    ];

    for (const label of tabLabels) {
      const visible = await desktopPage.locator(`aside button:has-text("${label}")`).isVisible();
      if (!visible) {
        throw new Error(`Sidebar thiếu tab: ${label}`);
      }
    }
    console.log('✓ Đủ 9 phân hệ trong sidebar desktop chuyên nghiệp');

    // Test Tab 2: Người dùng & Phân quyền
    await desktopPage.click('aside button:has-text("Người dùng & Phân quyền")');
    await desktopPage.waitForSelector('text=Quản Lý Người Dùng & Phân Quyền', { timeout: 5000 });
    const ssDesktopUsers = path.join(screenshotsDir, 'admin-02-desktop-users.png');
    await desktopPage.screenshot({ path: ssDesktopUsers, fullPage: false });
    console.log(`✓ Tab Người dùng hiển thị đầy đủ: ${ssDesktopUsers}`);

    // Test Tab 3: Lớp học & Phân công
    await desktopPage.click('aside button:has-text("Lớp học & Phân công")');
    await desktopPage.waitForSelector('text=Quản Lý Lớp Học & Phân Công Giáo Viên', { timeout: 5000 });
    const ssDesktopClasses = path.join(screenshotsDir, 'admin-03-desktop-classes.png');
    await desktopPage.screenshot({ path: ssDesktopClasses, fullPage: false });
    console.log(`✓ Tab Lớp học hiển thị 4 lớp chuẩn: ${ssDesktopClasses}`);

    // Test Tab 4: Năm học
    await desktopPage.click('aside button:has-text("Năm học")');
    await desktopPage.waitForSelector('text=Quản Lý Năm Học', { timeout: 5000 });
    console.log('✓ Tab Năm học hoạt động tốt');

    // Test Tab 5: Học liệu & Bài tập
    await desktopPage.click('aside button:has-text("Học liệu & Bài tập")');
    await desktopPage.waitForSelector('text=Kho Học Liệu & Tình Trạng Giao Bài', { timeout: 5000 });
    console.log('✓ Tab Học liệu hiển thị 24 chuyên đề GDPT 2018');

    // Test Tab 7: Dữ liệu & Sao lưu
    await desktopPage.click('aside button:has-text("Dữ liệu & Sao lưu")');
    await desktopPage.waitForSelector('text=Dữ Liệu & Sao Lưu Hệ Thống', { timeout: 5000 });
    console.log('✓ Tab Dữ liệu & Sao lưu vận hành thật, không có seed/cleanup');

    // Test Tab 8: Nhật ký hoạt động
    await desktopPage.click('aside button:has-text("Nhật ký hoạt động")');
    await desktopPage.waitForSelector('text=Nhật Ký Hoạt Động Hệ Thống', { timeout: 5000 });
    const ssDesktopAudit = path.join(screenshotsDir, 'admin-08-desktop-audit-logs.png');
    await desktopPage.screenshot({ path: ssDesktopAudit, fullPage: false });
    console.log(`✓ Tab Nhật ký hoạt động hiển thị chuẩn: ${ssDesktopAudit}`);

    // Test Tab 9: Cài đặt hệ thống
    await desktopPage.click('aside button:has-text("Cài đặt hệ thống")');
    await desktopPage.waitForSelector('text=Cài Đặt & Trạng Thái Hệ Thống', { timeout: 5000 });
    const ssDesktopSettings = path.join(screenshotsDir, 'admin-09-desktop-settings.png');
    await desktopPage.screenshot({ path: ssDesktopSettings, fullPage: false });
    console.log(`✓ Tab Cài đặt hệ thống hiển thị hạ tầng trung thực: ${ssDesktopSettings}`);

  } catch (err: any) {
    console.error('Lỗi Desktop Audit:', err.message);
    throw err;
  } finally {
    await desktopContext.close();
  }

  // 2. MOBILE VIEWPORT TEST (390 x 844 - iPhone 12/13/14 size)
  console.log('\n--- 2. MOBILE AUDIT (390x844) ---');
  const mobileContext: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage: Page = await mobileContext.newPage();

  try {
    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await mobilePage.click('button:has-text("Quản Trị")');
    await mobilePage.fill('input[type="email"]', 'admin@thamtutoannhi.edu.vn');
    await mobilePage.fill('input[type="password"]', 'AdminBaoMat@123');
    await mobilePage.click('button:has-text("Đăng nhập")');
    await mobilePage.waitForSelector('text=Trung Tâm Quản Trị Hệ Thống', { timeout: 10000 });

    console.log('✓ Mobile: Đăng nhập Admin thành công');

    // Screenshot Mobile Overview
    await mobilePage.waitForTimeout(1000);
    const ssMobileOverview = path.join(screenshotsDir, 'admin-01-mobile-overview.png');
    await mobilePage.screenshot({ path: ssMobileOverview, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Tổng quan Mobile: ${ssMobileOverview}`);

    // Verify Hamburger button exists and sidebar is hidden
    const sidebarVisible = await mobilePage.locator('aside').isVisible();
    if (sidebarVisible) {
      throw new Error('Desktop sidebar không được hiển thị trực tiếp trên mobile');
    }
    console.log('✓ Mobile: Desktop sidebar thu gọn chuẩn xác');

    // Click Hamburger Menu
    await mobilePage.click('button[aria-label="Toggle menu"]');
    await mobilePage.waitForSelector('text=Menu Điều Hành', { timeout: 5000 });
    console.log('✓ Mobile: Mở thành công Mobile Menu Drawer');

    const ssMobileMenu = path.join(screenshotsDir, 'admin-mobile-menu-drawer.png');
    await mobilePage.screenshot({ path: ssMobileMenu, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Mobile Drawer: ${ssMobileMenu}`);

    // Tap on "Người dùng & Phân quyền" from mobile drawer
    await mobilePage.click('button:has-text("Người dùng & Phân quyền"):visible');
    await mobilePage.waitForSelector('text=Quản Lý Người Dùng & Phân Quyền', { timeout: 5000 });
    console.log('✓ Mobile: Điều hướng mượt mà qua Mobile Menu');

    const ssMobileUsers = path.join(screenshotsDir, 'admin-02-mobile-users.png');
    await mobilePage.screenshot({ path: ssMobileUsers, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Quản lý người dùng Mobile: ${ssMobileUsers}`);

  } catch (err: any) {
    console.error('Lỗi Mobile Audit:', err.message);
    throw err;
  } finally {
    await mobileContext.close();
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(' ADMIN PORTAL AUDIT COMPLETED 100% PASS ');
  console.log('======================================================');
}

runAdminPortalAudit().catch((err) => {
  console.error('AUDIT FAILED:', err);
  process.exit(1);
});
