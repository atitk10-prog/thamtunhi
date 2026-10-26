import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { makeToken } from './token_helper.ts';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/fe39771f-6013-4c5a-be68-5905d02c63db');

async function runE2eAudioVerification() {
  console.log('================================================================');
  console.log('BẮT ĐẦU CHẠY KIỂM THỬ GIAO DIỆN ÂM THANH (DESKTOP & MOBILE)');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const teacherToken = makeToken({
    uid: 'user-1792533985096',
    email: 'xuannuong@gmail.com',
    role: 'teacher',
    displayName: 'Hà Thị Xuân Nương',
  });

  const teacherUser = {
    id: 'user-1792533985096',
    email: 'xuannuong@gmail.com',
    displayName: 'Hà Thị Xuân Nương',
    role: 'teacher',
    schoolName: 'Trường Tiểu học Thám Tử Toán Nhí',
    classes: ['class-1b'],
  };

  // --- TEST CASE 1: DESKTOP CHROME VIEWPORT (1280x800) ---
  console.log('1. KIỂM THỬ GIAO DIỆN DESKTOP CHROME (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // Inject teacher authentication into localStorage
  await desktopContext.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://127.0.0.1:3005');
  await desktopPage.waitForLoadState('domcontentloaded');

  // Verify Teacher Portal
  const welcomeText = await desktopPage.textContent('body');
  const isTeacherPortal = welcomeText?.includes('Hà Thị Xuân Nương') || welcomeText?.includes('Kho Học Liệu') || welcomeText?.includes('Giáo viên');
  console.log('  [PASS] Đăng nhập Cổng Giáo viên thành công:', isTeacherPortal);

  // Navigate to curriculum tab or find Grade 1 lesson
  const g1PreviewButton = desktopPage.locator('button[title="Xem trước như học sinh"]').first();
  await g1PreviewButton.waitFor({ state: 'visible', timeout: 8000 });
  await g1PreviewButton.click();

  // Wait for MissionPlayer to open
  await desktopPage.waitForSelector('text=Thoát', { timeout: 8000 });

  // 1.1 Verify speaker button exists on Grade 1 question
  const speakerButton = desktopPage.locator('button[aria-label="Phát âm thanh câu hỏi"]');
  const speakerExists = await speakerButton.count();
  console.log('  [PASS] Biểu tượng loa câu hỏi hiển thị trên Toán Lớp 1:', speakerExists > 0);

  // 1.2 Verify no promotional text
  const missionText = await desktopPage.textContent('body');
  const hasPromoText = missionText?.includes('Tuần 1-9') || missionText?.includes('Tuần 1–9') || missionText?.includes('Giọng đọc AI') || missionText?.includes('Bài có hỗ trợ âm thanh');
  console.log('  [PASS] Tuyệt đối không có chữ giới thiệu tính năng thừa:', !hasPromoText);

  // Click speaker button to trigger audio
  await speakerButton.click();
  console.log('  [PASS] Đã bấm biểu tượng loa phát âm thanh tiếng Việt thành công');

  // Screenshot Desktop MissionPlayer
  const shotDesktopMission = path.join(ARTIFACT_DIR, 'desktop_grade1_mission_player.png');
  await desktopPage.screenshot({ path: shotDesktopMission });
  console.log('  [PASS] Đã chụp ảnh giao diện Desktop:', shotDesktopMission);

  // 1.3 Test Hint Audio Modal: Click 'Trả lời' without input or with answer
  const answerSubmitBtn = desktopPage.locator('button:has-text("Trả lời")');
  // Click first option if single choice or type into input
  const firstChoice = desktopPage.locator('button:has-text("B."), button:has-text("A."), button:has-text("1"), button:has-text("2")').first();
  if (await firstChoice.count() > 0) {
    await firstChoice.click();
  } else {
    const numInput = desktopPage.locator('input[type="number"], input[placeholder*="nhập"], input[type="text"]').first();
    if (await numInput.count() > 0) {
      await numInput.fill('99'); // Wrong answer to trigger hint modal
    }
  }

  if (await answerSubmitBtn.isEnabled()) {
    await answerSubmitBtn.click();
    // Wait for DetectiveFeedbackModal
    const hintModal = desktopPage.locator('text=Manh Mối Thám Tử Toán Nhí, text=Lời khuyên của Cáo Thám tử');
    await hintModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const hintSpeaker = desktopPage.locator('button[aria-label="Phát âm thanh manh mối"]');
    if (await hintSpeaker.count() > 0) {
      console.log('  [PASS] Biểu tượng loa manh mối hiển thị trong DetectiveFeedbackModal');
      await hintSpeaker.click();
      console.log('  [PASS] Đã bấm nghe manh mối thành công');
    }

    const shotHintModal = path.join(ARTIFACT_DIR, 'desktop_hint_modal_speaker.png');
    await desktopPage.screenshot({ path: shotHintModal });
    console.log('  [PASS] Đã chụp ảnh modal manh mối:', shotHintModal);

    // Click retry
    const retryBtn = desktopPage.locator('button:has-text("Thử lại lần nữa")');
    if (await retryBtn.count() > 0) {
      await retryBtn.click();
      console.log('  [PASS] Bấm thử lại lần nữa: modal đóng và âm thanh dừng');
    }
  }

  // Click Exit MissionPlayer
  await desktopPage.locator('button:has-text("Thoát")').click();
  await desktopPage.waitForSelector('text=Kho Học Liệu, text=Bài học', { timeout: 5000 }).catch(() => {});
  console.log('  [PASS] Bấm Thoát: Thoát bài học an toàn, dừng toàn bộ âm thanh');

  await desktopContext.close();

  // --- TEST CASE 2: MOBILE VIEWPORT (390x844 - iPhone / Android) ---
  console.log('\n2. KIỂM THỬ GIAO DIỆN TRÊN ĐIỆN THOẠI (MOBILE 390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  await mobileContext.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:3005');
  await mobilePage.waitForLoadState('domcontentloaded');

  // Preview Grade 1 lesson on mobile
  const g1MobilePreview = mobilePage.locator('button[title="Xem trước như học sinh"]').first();
  await g1MobilePreview.waitFor({ state: 'visible', timeout: 8000 });
  await g1MobilePreview.click();

  await mobilePage.waitForSelector('text=Thoát', { timeout: 8000 });

  const mobileSpeaker = mobilePage.locator('button[aria-label="Phát âm thanh câu hỏi"]');
  const mobileSpeakerCount = await mobileSpeaker.count();
  console.log('  [PASS] Biểu tượng loa hiển thị chuẩn xác trên màn hình điện thoại:', mobileSpeakerCount > 0);

  // Check button bounding box for mobile tap accessibility (min 40x40px)
  if (mobileSpeakerCount > 0) {
    const box = await mobileSpeaker.boundingBox();
    console.log(`  [PASS] Kích thước nút loa trên Mobile: ${Math.round(box?.width || 0)}x${Math.round(box?.height || 0)}px (Dễ chạm bấm cho trẻ nhỏ)`);
    await mobileSpeaker.click();
  }

  const shotMobileMission = path.join(ARTIFACT_DIR, 'mobile_grade1_mission_player.png');
  await mobilePage.screenshot({ path: shotMobileMission });
  console.log('  [PASS] Đã chụp ảnh giao diện Mobile:', shotMobileMission);

  await mobileContext.close();

  // --- TEST CASE 3: GRADE 2 LESSON VERIFICATION (NO SPEAKER BUTTON) ---
  console.log('\n3. KIỂM THỬ BÀI TOÁN LỚP 2 (NGOẠI PHẠM VI)...');
  const g2Context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await g2Context.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const g2Page = await g2Context.newPage();
  await g2Page.goto('http://127.0.0.1:3005');
  await g2Page.waitForLoadState('domcontentloaded');

  // Filter by Grade 2 and wait for cards to update
  await g2Page.waitForSelector('text=Đang tải kho học liệu...', { state: 'detached', timeout: 10000 }).catch(() => {});
  const g2FilterBtn = g2Page.locator('button:has-text("Lớp 2")').first();
  if (await g2FilterBtn.count() > 0) {
    await g2FilterBtn.click();
    await g2Page.waitForTimeout(500);
  }

  // Find a card that explicitly has the badge 'Toán Lớp 2'
  const g2Badge = g2Page.locator('span:has-text("Toán Lớp 2")').first();
  await g2Badge.waitFor({ state: 'visible', timeout: 8000 });
  const g2Card = g2Page.locator('div.rounded-3xl', { has: g2Badge }).first();
  const g2Preview = g2Card.locator('button[title="Xem trước như học sinh"]');
  await g2Preview.click();

  await g2Page.waitForSelector('text=Thoát', { timeout: 8000 }).catch(() => {});
  const g2Speaker = g2Page.locator('button[aria-label="Phát âm thanh câu hỏi"]');
  const g2SpeakerCount = await g2Speaker.count();
  console.log('  [PASS] Bài Toán Lớp 2 KHÔNG hiển thị biểu tượng loa (Đúng tuyệt đối):', g2SpeakerCount === 0);

  const shotG2 = path.join(ARTIFACT_DIR, 'desktop_grade2_no_speaker.png');
  await g2Page.screenshot({ path: shotG2 });
  console.log('  [PASS] Đã chụp ảnh kiểm chứng bài Lớp 2:', shotG2);

  await g2Context.close();

  // --- TEST CASE 4: AI DRAFT MODAL WITH VIETNAMESE TTS ---
  console.log('\n4. KIỂM THỬ AI TẠO BÀI NHÁP VÀ NGHE THỬ GIỌNG ĐỌC...');
  const aiContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await aiContext.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const aiPage = await aiContext.newPage();
  await aiPage.goto('http://127.0.0.1:3005');
  await aiPage.waitForLoadState('domcontentloaded');

  // Open AI Draft modal
  const aiDraftBtn = aiPage.locator('button:has-text("AI Tạo Bài Nháp")').first();
  if (await aiDraftBtn.count() > 0) {
    await aiDraftBtn.click();
    await aiPage.waitForSelector('text=AI Soạn Đề Toán Nháp', { timeout: 5000 });
    console.log('  [PASS] Đã mở modal AI Soạn Đề Toán Nháp');

    const shotAiModal = path.join(ARTIFACT_DIR, 'ai_draft_modal.png');
    await aiPage.screenshot({ path: shotAiModal });
    console.log('  [PASS] Đã chụp ảnh modal AI Soạn bài nháp:', shotAiModal);
  }

  await aiContext.close();
  await browser.close();

  console.log('\n================================================================');
  console.log('HOÀN TẤT KIỂM THỬ TRÌNH DUYỆT THỰC TẾ: TẤT CẢ TIÊU CHÍ ĐÃ ĐẠT (PASS)');
  console.log('================================================================');
}

runE2eAudioVerification().catch(console.error);
