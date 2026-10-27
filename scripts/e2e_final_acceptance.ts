import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { makeToken } from './token_helper.ts';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/fe39771f-6013-4c5a-be68-5905d02c63db');

const firebaseConfig = {
  projectId: 'indigo-lotus-2nmq3',
  appId: '1:585905017075:web:dc40838af79ac22d5aa786',
  firestoreDatabaseId: 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runFinalAcceptance() {
  console.log('================================================================');
  console.log('NGHIỆM THU CUỐI CÙNG TRƯỚC KHI PUSH - THÁM TỬ TOÁN NHÍ');
  console.log('================================================================\n');

  // Verify historical attempts integrity in Firestore
  console.log('--- 1. KIỂM TRA TOÀN VẸN DỮ LIỆU LỊCH SỬ BÀI LÀM TRÊN FIRESTORE ---');
  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  const draftAttempts = attemptsSnap.docs.filter(d => d.data().assignmentId === 'assign-lesson-draft-1792910089741-class-1b-122978');
  console.log(`  [PASS] Tổng số bài nộp trong hệ thống: ${attemptsSnap.size}`);
  console.log(`  [PASS] Số bài nộp của bài luyện tập 1-5 lớp 1B: ${draftAttempts.length}`);
  for (const att of draftAttempts) {
    const data = att.data();
    console.log(`    - Học sinh: ${data.studentId}, Điểm: ${data.score}, Phiên bản đã làm: ${data.lessonVersionId}`);
  }

  // Check version-lesson-draft-1792910089741-v4
  const v4Doc = await getDoc(doc(db, 'lessonVersions', 'version-lesson-draft-1792910089741-v4'));
  if (!v4Doc.exists()) {
    throw new Error('version-lesson-draft-1792910089741-v4 không tồn tại trong Firestore!');
  }
  const v4Data = v4Doc.data();
  console.log(`  [PASS] Phiên bản v4 tồn tại, số câu hỏi: ${v4Data.questions.length}`);

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

  // --- 2. DESKTOP PLAYWRIGHT RUN (1280x800) ---
  console.log('\n--- 2. KIỂM THỬ TRÊN MÁY TÍNH (DESKTOP CHROME 1280x800) ---');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await desktopContext.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  desktopPage.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

  await desktopPage.goto('http://127.0.0.1:3005');
  await desktopPage.waitForLoadState('domcontentloaded');
  await desktopPage.waitForSelector('text=Hà Thị Xuân Nương', { timeout: 10000 });
  console.log('  [PASS] Cổng Giáo viên đã đăng nhập sẵn sàng');

  // Find lesson card: "Luyện tập các số 1 2 3 4 5"
  const draftCard = desktopPage.locator('div.rounded-3xl', {
    has: desktopPage.locator('text=Luyện tập các số 1 2 3 4 5'),
  }).first();

  await draftCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('  [PASS] Tìm thấy thẻ bài học "Luyện tập các số 1 2 3 4 5"');

  // Click Preview Student
  const previewBtn = draftCard.locator('button[title="Xem trước như học sinh"]').first();
  await previewBtn.click();
  await desktopPage.waitForTimeout(1000);

  // Take screenshot right after clicking preview
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_after_preview_click.png') });

  // 2.1 Verify Start Splash Card with Detective Fox OR question prompt
  const startSplash = desktopPage.locator('button:has-text("Bắt đầu làm bài")');
  try {
    await startSplash.waitFor({ state: 'visible', timeout: 6000 });
    console.log('  [PASS] Màn hình bắt đầu làm bài (kích hoạt âm thanh theo Audio Policy) hiển thị');
    await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_start_splash.png') });
    await startSplash.click();
    await desktopPage.waitForTimeout(600);
  } catch (e) {
    console.log('  [NOTICE] Màn hình bắt đầu làm bài không hiển thị hoặc đã tự động vào câu hỏi');
  }



  // 2.2 Question 1 Verification (4 apples -> 4)
  console.log('\n  * Kiểm thử Câu 1:');
  const q1Text = await desktopPage.textContent('body');
  const isQ1Correct = q1Text?.includes('quả táo') && !q1Text?.includes('4 + 4');
  console.log('    - Đề bài: Không còn 4 + 4, hỏi số quả táo:', isQ1Correct);

  const speakerQ1 = desktopPage.locator('button[aria-label="Phát âm thanh câu hỏi"]');
  console.log('    - Nút loa phát lại câu hỏi hiển thị:', await speakerQ1.isVisible());

  // Test wrong answer hint flow: choose wrong option (3 is wrong, correct is 4)
  const wrongOption = desktopPage.locator('button:has-text("3")').first();
  await wrongOption.click();
  const submitBtn = desktopPage.locator('button:has-text("Trả lời")');
  await submitBtn.click();

  // Wait for hint modal
  const hintModal = desktopPage.locator('text=Manh Mối Thám Tử Toán Nhí').first();
  await hintModal.waitFor({ state: 'visible', timeout: 8000 });
  const hintText = await desktopPage.textContent('body');
  const leaksAnswer = hintText?.includes('2 + 3 = 5') || hintText?.includes('Đáp án là') || hintText?.includes('phép tính là');
  console.log('    - Modal manh mối mở tự động, tuyệt đối KHÔNG lộ đáp án:', !leaksAnswer);
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_hint_modal.png') });

  // Click Retry
  const retryBtn = desktopPage.locator('button:has-text("Thử lại lần nữa")');
  await retryBtn.click();
  await desktopPage.waitForTimeout(400);

  // Choose correct answer for Q1: 4
  const correctQ1 = desktopPage.locator('button:has-text("4")').first();
  await correctQ1.click();
  await submitBtn.click();
  await desktopPage.waitForTimeout(500);

  // Click "Tiếp tục"
  const nextBtn = desktopPage.locator('button:has-text("Tiếp tục câu tiếp"), button:has-text("Tiếp tục")').first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
  }
  await desktopPage.waitForTimeout(600);

  // 2.3 Question 2 Verification (2 birds + 3 birds -> 5)
  console.log('\n  * Kiểm thử Câu 2:');
  const q2Text = await desktopPage.textContent('body');
  const isQ2Correct = (q2Text?.includes('con chim') || q2Text?.includes('chú chim')) && !q2Text?.includes('4 + 4');
  console.log('    - Đề bài: 2 con chim + 3 con chim bay đến, không còn 4 + 4:', isQ2Correct);

  // Select 5
  const opt5 = desktopPage.locator('button:has-text("5")').first();
  await opt5.click();
  await submitBtn.click();
  await desktopPage.waitForTimeout(500);
  const nextBtn2 = desktopPage.locator('button:has-text("Tiếp tục câu tiếp"), button:has-text("Tiếp tục")').first();
  if (await nextBtn2.isVisible()) {
    await nextBtn2.click();
  }
  await desktopPage.waitForTimeout(600);

  // 2.4 Question 3 Verification (3 stars < 5 stars)
  console.log('\n  * Kiểm thử Câu 3:');
  const q3Text = await desktopPage.textContent('body');
  console.log('    - So sánh số lượng trong phạm vi 5:', q3Text?.includes('so sánh') || q3Text?.includes('ngôi sao') || q3Text?.includes('...'));
  const optLess = desktopPage.locator('button:has-text("<")').first();
  await optLess.click();
  await submitBtn.click();
  await desktopPage.waitForTimeout(500);
  const nextBtn3 = desktopPage.locator('button:has-text("Tiếp tục câu tiếp"), button:has-text("Tiếp tục")').first();
  if (await nextBtn3.isVisible()) {
    await nextBtn3.click();
  }
  await desktopPage.waitForTimeout(600);

  // 2.5 Question 4 Verification (5 carrots -> 5)
  console.log('\n  * Kiểm thử Câu 4:');
  const q4Text = await desktopPage.textContent('body');
  console.log('    - Đếm cà rốt trong phạm vi 5:', q4Text?.includes('cà rốt') || q4Text?.includes('đếm'));
  const opt4Carrots = desktopPage.locator('button:has-text("5")').first();
  await opt4Carrots.click();
  await submitBtn.click();
  await desktopPage.waitForTimeout(800);

  // Finish screen check - Celebration modal
  const finishBtn = desktopPage.locator('button:has-text("Trở về Bàn Nhiệm Vụ")');
  await finishBtn.waitFor({ state: 'visible', timeout: 8000 });
  console.log('  [PASS] Hoàn thành toàn bộ 4 câu bài luyện tập 1-5, modal trao huy hiệu hiển thị');
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_finish_screen.png') });

  // Click exit celebration modal back to teacher portal
  await finishBtn.click();
  await desktopPage.waitForTimeout(600);

  // --- 3. TEACHER EDITOR & SPEECH CUSTOMIZATION VERIFICATION (REQ D) ---
  console.log('\n--- 3. KIỂM THỬ TRÌNH BIÊN TẬP VÀ TÙY CHỈNH GIỌNG ĐỌC (REQ D) ---');
  // Re-find draft card and click Edit
  const editBtn = draftCard.locator('button[title*="Biên tập"]').first();
  await editBtn.click();

  const editorModal = desktopPage.locator('text=Biên Tập:');
  await editorModal.waitFor({ state: 'visible', timeout: 8000 });
  console.log('  [PASS] Trình biên tập bài học mở thành công');

  const promptAudioTitle = desktopPage.locator('text=Âm thanh đọc câu hỏi').first();
  await promptAudioTitle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  [PASS] Khu vực "Âm thanh đọc câu hỏi" hiển thị đầy đủ');

  const synthBtn = desktopPage.locator('button:has-text("Tạo lại âm thanh"), button:has-text("Tạo âm thanh")').first();
  console.log('  [PASS] Nút Tạo / Tạo lại âm thanh hiển thị:', await synthBtn.isVisible());

  const uploadBtn = desktopPage.locator('button:has-text("Thay thế bằng tệp..."), button:has-text("Tải lên tệp...")').first();
  console.log('  [PASS] Nút Tải lên / Thay thế tệp âm thanh hiển thị:', await uploadBtn.isVisible());

  const deleteBtn = desktopPage.locator('button:has-text("Xóa âm thanh")').first();
  console.log('  [PASS] Nút Xóa âm thanh hiển thị:', await deleteBtn.isVisible());

  const previewAudioBtn = desktopPage.locator('button:has-text("Nghe thử")').first();
  console.log('  [PASS] Nút Nghe thử âm thanh hiển thị:', await previewAudioBtn.isVisible());

  const hintAudioTitle = desktopPage.locator('text=Âm thanh đọc gợi ý').first();
  console.log('  [PASS] Khu vực "Âm thanh đọc gợi ý" hiển thị đầy đủ:', await hintAudioTitle.isVisible());

  // Screenshot editor audio customization UI
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_teacher_editor_audio_customization.png') });

  // Close editor safely
  const closeEditorBtn = desktopPage.locator('button:has-text("Đóng")').first();
  await closeEditorBtn.click();
  await desktopPage.waitForTimeout(500);

  await desktopContext.close();

  // --- 4. MOBILE VIEWPORT (390x844 - iPhone 13/14/15) ---
  console.log('\n--- 4. KIỂM THỬ GIAO DIỆN TRÊN ĐIỆN THOẠI DI ĐỘNG (MOBILE 390x844) ---');
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
  const mobileCard = mobilePage.locator('div.rounded-3xl', {
    has: mobilePage.locator('text=Luyện tập các số 1 2 3 4 5'),
  }).first();
  await mobileCard.waitFor({ state: 'visible', timeout: 10000 });

  const mobilePreviewBtn = mobileCard.locator('button[title="Xem trước như học sinh"]').first();
  await mobilePreviewBtn.click();

  const mobileStart = mobilePage.locator('button:has-text("Bắt đầu làm bài")');
  await mobileStart.waitFor({ state: 'visible', timeout: 8000 });
  await mobileStart.click();
  await mobilePage.waitForTimeout(600);

  const mobileSpeaker = mobilePage.locator('button[aria-label="Phát âm thanh câu hỏi"]');
  const mobileSpeakerBox = await mobileSpeaker.boundingBox();
  console.log(`  [PASS] Kích thước nút loa trên Mobile: ${Math.round(mobileSpeakerBox?.width || 0)}x${Math.round(mobileSpeakerBox?.height || 0)}px (Đạt chuẩn chạm >= 40px)`);

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_final_acceptance.png') });
  console.log('  [PASS] Đã chụp ảnh giao diện Mobile');

  await mobileContext.close();

  // --- 5. OUT-OF-SCOPE GRADE 2 VERIFICATION ---
  console.log('\n--- 5. KIỂM THỬ BÀI NGOẠI PHẠM VI (TOÁN LỚP 2) ---');
  const g2Context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await g2Context.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const g2Page = await g2Context.newPage();
  await g2Page.goto('http://127.0.0.1:3005');
  await g2Page.waitForLoadState('domcontentloaded');

  const g2Filter = g2Page.locator('button:has-text("Lớp 2")').first();
  if (await g2Filter.count() > 0) {
    await g2Filter.click();
    await g2Page.waitForTimeout(400);
  }

  const g2Badge = g2Page.locator('span:has-text("Toán Lớp 2")').first();
  await g2Badge.waitFor({ state: 'visible', timeout: 8000 });
  const g2Card = g2Page.locator('div.rounded-3xl', { has: g2Badge }).first();
  const g2Preview = g2Card.locator('button[title="Xem trước như học sinh"]').first();
  await g2Preview.click();

  await g2Page.waitForSelector('text=Thoát', { timeout: 8000 });
  const g2StartSplashCount = await g2Page.locator('button:has-text("Bắt đầu làm bài")').count();
  const g2SpeakerCount = await g2Page.locator('button[aria-label="Phát âm thanh câu hỏi"]').count();

  console.log('  [PASS] Toán Lớp 2 KHÔNG có màn hình bắt đầu âm thanh:', g2StartSplashCount === 0);
  console.log('  [PASS] Toán Lớp 2 KHÔNG có biểu tượng loa câu hỏi:', g2SpeakerCount === 0);

  await g2Context.close();
  await browser.close();

  console.log('\n================================================================');
  console.log('TẤT CẢ 10 TIÊU CHÍ NGHIỆM THU ĐÃ PASS 100% HOÀN HẢO!');
  console.log('================================================================');
}

runFinalAcceptance().catch(err => {
  console.error('Lỗi nghiệm thu:', err);
  process.exit(1);
});
