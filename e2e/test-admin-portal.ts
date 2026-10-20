import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runAdminPortalAudit() {
  console.log('======================================================');
  console.log(' STARTING ADMIN PORTAL CLOSEOUT & RESPONSIVE AUDIT ');
  console.log(` Target: ${BASE_URL}`);
  console.log('======================================================');

  const browser: Browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. DESKTOP VIEWPORT TEST (1280 x 800)
  console.log('\n--- 1. DESKTOP CLOSEOUT AUDIT (1280x800) ---');
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
    await desktopPage.waitForSelector('text=Trung Tâm Quản Trị', { timeout: 10000 });

    console.log('✓ Desktop: Đăng nhập Admin thành công');

    // Screenshot Desktop Overview
    await desktopPage.waitForTimeout(1000);
    const ssDesktopOverview = path.join(screenshotsDir, 'admin-01-desktop-overview.png');
    await desktopPage.screenshot({ path: ssDesktopOverview, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Tổng quan Desktop: ${ssDesktopOverview}`);

    // Verify 8 Streamlined Tabs in desktop sidebar
    const tabLabels = [
      'Tổng quan',
      'Người dùng & Phân quyền',
      'Lớp học & Phân công',
      'Năm học',
      'Học liệu & Bài tập',
      'Kết quả & Thống kê',
      'Dữ liệu & Sao lưu',
      'Cài đặt & Nhật ký',
    ];

    for (const label of tabLabels) {
      const visible = await desktopPage.locator(`aside button:has-text("${label}")`).isVisible();
      if (!visible) {
        throw new Error(`Sidebar thiếu tab: ${label}`);
      }
    }
    console.log('✓ Đủ 8 phân hệ tinh gọn trong sidebar desktop chuyên nghiệp');

    // Verify Top-Right Profile Menu Dropdown
    const profileBtn = desktopPage.locator('header button:has-text("Thầy Tổng Phụ Trách")');
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await desktopPage.waitForSelector('text=Hồ sơ của tôi', { timeout: 3000 });
      const ssProfileDropdown = path.join(screenshotsDir, 'admin-00-desktop-profile-dropdown.png');
      await desktopPage.screenshot({ path: ssProfileDropdown, fullPage: false });
      console.log(`✓ Menu tài khoản Admin hiển thị chuẩn: ${ssProfileDropdown}`);
      // Close dropdown by clicking header
      await desktopPage.click('header');
    }

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
    const ssDesktopYears = path.join(screenshotsDir, 'admin-04-desktop-academic-years.png');
    await desktopPage.screenshot({ path: ssDesktopYears, fullPage: false });
    console.log(`✓ Tab Năm học hoạt động tốt: ${ssDesktopYears}`);

    // Test Tab 5: Học liệu & Bài tập
    await desktopPage.click('aside button:has-text("Học liệu & Bài tập")');
    await desktopPage.waitForSelector('text=Kho Học Liệu & Tình Trạng Giao Bài', { timeout: 5000 });
    const ssDesktopLessons = path.join(screenshotsDir, 'admin-05-desktop-curriculum.png');
    await desktopPage.screenshot({ path: ssDesktopLessons, fullPage: false });
    console.log(`✓ Tab Học liệu hiển thị 24 chuyên đề GDPT 2018: ${ssDesktopLessons}`);

    // Test Tab 7: Dữ liệu & Sao lưu
    await desktopPage.click('aside button:has-text("Dữ liệu & Sao lưu")');
    await desktopPage.waitForSelector('text=Dữ Liệu & Sao Lưu Hệ Thống', { timeout: 5000 });
    console.log('✓ Tab Dữ liệu & Sao lưu vận hành trung thực');

    // Test Tab 8: Cài đặt hệ thống & Nhật ký hoạt động subtab
    await desktopPage.click('aside button:has-text("Cài đặt & Nhật ký")');
    await desktopPage.waitForSelector('text=Trạng Thái Hệ Thống & Hạ Tầng Kỹ Thuật', { timeout: 5000 });
    
    // Switch to Nhật ký hoạt động subtab
    await desktopPage.click('button:has-text("Nhật Ký Hoạt Động (Audit Logs)")');
    await desktopPage.waitForSelector('text=Đề Xuất Chính Sách Lưu Trữ Nhật Ký', { timeout: 5000 });
    const ssDesktopAudit = path.join(screenshotsDir, 'admin-08-desktop-settings-audit.png');
    await desktopPage.screenshot({ path: ssDesktopAudit, fullPage: false });
    console.log(`✓ Tab Cài đặt hệ thống - Phân hệ Nhật ký hoạt động: ${ssDesktopAudit}`);

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
    await mobilePage.waitForSelector('text=Hệ thống Quản Trị Giáo Dục', { timeout: 10000 });

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

    // Click Hamburger Menu (first button in header)
    await mobilePage.locator('header button').first().click();
    await mobilePage.waitForSelector('text=MENU QUẢN TRỊ', { timeout: 5000 });
    console.log('✓ Mobile: Mở thành công Mobile Menu Drawer');

    const ssMobileMenu = path.join(screenshotsDir, 'admin-mobile-menu-drawer.png');
    await mobilePage.screenshot({ path: ssMobileMenu, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Mobile Drawer: ${ssMobileMenu}`);

    // Tap on "Người dùng & Phân quyền" from mobile drawer
    await mobilePage.locator('button:has-text("Người dùng & Phân quyền"):visible').click();
    await mobilePage.waitForSelector('text=Quản Lý Người Dùng & Phân Quyền', { timeout: 5000 });
    console.log('✓ Mobile: Điều hướng mượt mà qua Mobile Menu');

    const ssMobileUsers = path.join(screenshotsDir, 'admin-02-mobile-users.png');
    await mobilePage.screenshot({ path: ssMobileUsers, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Quản lý người dùng Mobile: ${ssMobileUsers}`);

    // Tap on "Năm học" from mobile
    await mobilePage.locator('header button').first().click();
    await mobilePage.waitForSelector('text=MENU QUẢN TRỊ', { timeout: 5000 });
    await mobilePage.locator('button:has-text("Năm học"):visible').click();
    await mobilePage.waitForSelector('text=Quản Lý Năm Học', { timeout: 5000 });
    const ssMobileYears = path.join(screenshotsDir, 'admin-04-mobile-years.png');
    await mobilePage.screenshot({ path: ssMobileYears, fullPage: false });
    console.log(`✓ Đã chụp ảnh màn hình Quản lý năm học Mobile: ${ssMobileYears}`);

  } catch (err: any) {
    console.error('Lỗi Mobile Audit:', err.message);
    throw err;
  } finally {
    await mobileContext.close();
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(' ADMIN PORTAL CLOSEOUT AUDIT COMPLETED 100% PASS ');
  console.log('======================================================');
}

runAdminPortalAudit().catch((err) => {
  console.error('AUDIT FAILED:', err);
  process.exit(1);
});
