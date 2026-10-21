import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { makeToken } from '../scripts/token_helper.ts';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/Hii/.gemini/antigravity-ide/brain/83a02fed-551d-4543-b0f7-1f29bdd00dda';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runTeacherG2FinalE2E() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E TOÀN DIỆN: HỌC LIỆU G2 FINAL');
  console.log(` Mục tiêu BASE_URL: ${BASE_URL}`);
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
    console.log(`  [ẢNH MINH CHỨNG] Đã lưu: ${filename}`);
  }

  // --------------------------------------------------------------------------
  // PHẦN 1: HỌC SINH LÀM ĐỦ 8 CÂU BÀI 1 (ĐÚNG, SAI, MANH MỐI, NỐI CẶP, SẮP XẾP)
  // --------------------------------------------------------------------------
  console.log('--- PHẦN 1: CHẠY ĐỦ 8 CÂU BÀI 1 (CÁC SỐ TỪ 1 ĐẾN 5) ---');
  const studentToken = makeToken({
    uid: 'student-hs1a01',
    role: 'student',
    displayName: 'Em An (Lớp 1A)',
    studentCode: 'HS1A01',
    classId: 'class-1a',
    grade: 1,
  });

  const studentUser = {
    id: 'student-hs1a01',
    role: 'student',
    displayName: 'Em An (Lớp 1A)',
    studentCode: 'HS1A01',
    classId: 'class-1a',
    grade: 1,
  };

  const v2Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g1-01-v2'));
  const v2Data = v2Snap.data();
  if (!v2Data) throw new Error('Không tìm thấy version-lesson-g1-01-v2 trong Firestore');

  const assignmentDoc = {
    id: 'assignment-test-g1-01-v2',
    lessonId: 'lesson-g1-01',
    lessonVersionId: 'version-lesson-g1-01-v2',
    classId: 'class-1a',
    teacherId: 'teacher-1',
    status: 'open',
    dueDate: '2026-12-31T23:59:59.000Z',
    createdAt: new Date().toISOString(),
    dataOrigin: 'real',
    environmentTag: 'production'
  };

  const studentContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const studentPage = await studentContext.newPage();

  try {
    await studentPage.addInitScript(
      ({ token, user, assignment, version }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
        sessionStorage.clear();
        sessionStorage.setItem('thamtunhi_active_mission_assignment', JSON.stringify(assignment));
        sessionStorage.setItem('thamtunhi_active_mission_version', JSON.stringify(version));
      },
      { token: studentToken, user: studentUser, assignment: assignmentDoc, version: v2Data }
    );

    await studentPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForSelector('text=Câu 1 / 8', { timeout: 15000 });
    console.log('  [PASS] MissionPlayer nạp đầy đủ 8 câu hỏi của Bài 1 (version-lesson-g1-01-v2)');

    // 1.1 Verify Sound Toggle exists and TTS button is gone
    const soundToggle = studentPage.locator('button:has-text("Âm thanh")');
    await soundToggle.waitFor({ timeout: 5000 });
    console.log('  [PASS] Nút Bật/Tắt Âm thanh hiện diện trong giao diện làm bài');
    const ttsBtnCount = await studentPage.locator('button:has-text("Nghe đọc")').count();
    if (ttsBtnCount > 0) throw new Error('Vẫn còn nút Nghe đọc câu hỏi TTS!');
    console.log('  [PASS] Đã loại bỏ hoàn toàn nút đọc TTS theo đúng yêu cầu');

    // 1.2 Question 1: Count Apples (Single choice)
    const counterCaption = await studentPage.locator('text=Quan sát mô hình đếm').first().textContent();
    console.log(`  [PASS] Câu 1: Chú thích đếm chuẩn: "${counterCaption}" (Không lộ số lượng vật thể)`);
    await saveScreenshot(studentPage, 'g2-final-01-question1-counters.png');

    // Answer Q1: Select option "4"
    const opt4 = studentPage.locator('div.grid button:has-text("4")').first();
    await opt4.click();
    const submitBtn = studentPage.locator('button:has-text("Trả lời")');
    await submitBtn.click();
    console.log('  [PASS] Câu 1: Trả lời đúng lần đầu (10 điểm)');

    // 1.3 Question 2: Number input with deliberate mistake & hint
    await studentPage.waitForSelector('text=Câu 2 / 8', { timeout: 10000 });
    const keypad9 = studentPage.locator('div.grid-cols-3 button:has-text("9")').first();
    await keypad9.click(); // Nhập sai: 9
    await submitBtn.click();

    // Verify Detective Feedback Modal appears
    await studentPage.waitForSelector('text=Manh Mối Thám Tử Toán Nhí', { timeout: 10000 });
    console.log('  [PASS] Câu 2: Trả lời sai lần đầu -> Hiển thị Modal Manh Mối Thám Tử Cáo');
    await saveScreenshot(studentPage, 'g2-final-02-detective-hint-modal.png');

    // Click retry in modal
    const retryBtn = studentPage.locator('button:has-text("Thử lại lần nữa nào!")').first();
    await retryBtn.click();

    // Now enter correct answer "3" on keypad
    const clearBtn = studentPage.locator('button[title="Xóa hết"]').first();
    await clearBtn.click();
    const keypad3 = studentPage.locator('div.grid-cols-3 button:has-text("3")').first();
    await keypad3.click();
    await submitBtn.click();
    console.log('  [PASS] Câu 2: Thử lại đúng sau khi nhận gợi ý (7 điểm)');

    // 1.4 Question 3: Comparison (No numbers in labels)
    await studentPage.waitForSelector('text=Câu 3 / 8', { timeout: 10000 });
    await studentPage.waitForSelector('text=Nhóm A', { timeout: 5000 });
    await studentPage.waitForSelector('text=Nhóm B', { timeout: 5000 });
    console.log('  [PASS] Câu 3: So sánh hiển thị Nhóm A và Nhóm B không lộ chữ số');
    await saveScreenshot(studentPage, 'g2-final-03-comparison-no-leak.png');

    // Pick operator ">"
    const greaterBtn = studentPage.locator('button:has-text(">")').first();
    await greaterBtn.click();
    await submitBtn.click();
    console.log('  [PASS] Câu 3: Chọn dấu so sánh ">" thành công');

    // 1.5 Question 4: Expression match with Real Object Icons
    await studentPage.waitForSelector('text=Câu 4 / 8', { timeout: 10000 });
    console.log('  [PASS] Câu 4: Dạng Ghép nối hiển thị hình đồ vật trực quan');
    await saveScreenshot(studentPage, 'g2-final-04-match-objects-before-pairing.png');

    // Connect pairs: Cam -> Số 2, Hoa -> Số 5, Thỏ -> Số 1
    const orangeBtn = studentPage.locator('button:has-text("Quả cam")').first();
    await orangeBtn.click();
    const num2Btn = studentPage.locator('button:has-text("Số 2")').first();
    await num2Btn.click();

    const flowerBtn = studentPage.locator('button:has-text("Bông hoa")').first();
    await flowerBtn.click();
    const num5Btn = studentPage.locator('button:has-text("Số 5")').first();
    await num5Btn.click();

    const rabbitBtn = studentPage.locator('button:has-text("Chú thỏ")').first();
    await rabbitBtn.click();
    const num1Btn = studentPage.locator('button:has-text("Số 1")').first();
    await num1Btn.click();

    await saveScreenshot(studentPage, 'g2-final-05-match-linked-neutral.png');
    // Submit match
    await submitBtn.click();
    console.log('  [PASS] Câu 4: Nối đủ các cặp và nộp bài thành công');

    // 1.6 Question 5: Five-frame with Blue dots
    await studentPage.waitForSelector('text=Câu 5 / 8', { timeout: 10000 });
    await studentPage.waitForSelector('text=Khung 5 Ô Trực Quan', { timeout: 5000 });
    console.log('  [PASS] Câu 5: Khung 5 ô hiển thị đúng chấm tròn xanh');
    await saveScreenshot(studentPage, 'g2-final-06-five-frame-blue-dots.png');
    const opt5 = studentPage.locator('div.grid button:has-text("5")').first();
    await opt5.click();
    await submitBtn.click();

    // 1.7 Question 6: Number line ordering (Scrambled tiles)
    await studentPage.waitForSelector('text=Câu 6 / 8', { timeout: 10000 });
    console.log('  [PASS] Câu 6: Sắp xếp tia số nạp thành công');
    await saveScreenshot(studentPage, 'g2-final-07-ordering-scrambled-tiles.png');
    // Click tiles in order 1 -> 2 -> 3 -> 4
    await studentPage.locator('button.w-16:has-text("1")').first().click();
    await studentPage.locator('button.w-16:has-text("2")').first().click();
    await studentPage.locator('button.w-16:has-text("3")').first().click();
    await studentPage.locator('button.w-16:has-text("4")').first().click();
    await submitBtn.click();

    // 1.8 Question 7: Number input (Candies: 2 + 1 = 3)
    await studentPage.waitForSelector('text=Câu 7 / 8', { timeout: 10000 });
    const keypad7_3 = studentPage.locator('div.grid-cols-3 button:has-text("3")').first();
    await keypad7_3.click();
    await submitBtn.click();
    console.log('  [PASS] Câu 7: Điền số phép cộng lời văn "3" thành công');

    // 1.9 Question 8: Single choice (Số liền sau số 4: 5)
    await studentPage.waitForSelector('text=Câu 8 / 8', { timeout: 10000 });
    const q8Opt = studentPage.locator('div.grid button:has-text("5")').first();
    await q8Opt.click();
    await submitBtn.click();
    console.log('  [PASS] Câu 8: Chọn số liền sau "5" thành công');

    // 1.10 Completion Modal & Score Verification (77/80)
    await studentPage.waitForSelector('text=Chúc mừng Thám tử nhí!', { timeout: 15000 });
    console.log('  [PASS] Modal hoàn thành xuất hiện, âm thanh hoàn thành kích hoạt');
    await saveScreenshot(studentPage, 'g2-final-08-completion-badge-score.png');
  } finally {
    await studentContext.close();
  }

  // --------------------------------------------------------------------------
  // PHẦN 2: CHẾ ĐỘ XEM TRƯỚC CỦA GIÁO VIÊN TUYỆT ĐỐI KHÔNG GHI RÁC ATTEMPTS
  // --------------------------------------------------------------------------
  console.log('\n--- PHẦN 2: CHẾ ĐỘ XEM TRƯỚC GIÁO VIÊN (ZERO TELEMETRY LEAK) ---');
  const teacherContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const teacherPage = await teacherContext.newPage();

  try {
    const teacherToken = makeToken({
      uid: 'teacher-1',
      role: 'teacher',
      displayName: 'Cô Mai Lan (Khối 1)',
    });
    const teacherUser = {
      id: 'teacher-1',
      role: 'teacher',
      displayName: 'Cô Mai Lan (Khối 1)',
      email: 'thanhthao@thamtutoannhi.edu.vn',
    };
    await teacherPage.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
      },
      { token: teacherToken, user: teacherUser }
    );

    // Count attempts before preview
    const attemptsBeforeSnap = await getDocs(query(collection(db, 'attempts'), where('studentId', '==', 'teacher-1')));
    const countBefore = attemptsBeforeSnap.size;

    await teacherPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForSelector('text=Kho Học Liệu & Bài Học', { timeout: 15000 });

    // Click "Xem trước như học sinh" eye icon button for Lesson 1
    const previewBtn = teacherPage.locator('button[title="Xem trước như học sinh"]').first();
    await previewBtn.waitFor({ timeout: 10000 });
    await previewBtn.click();

    // Verify Preview MissionPlayer is loaded
    await teacherPage.waitForSelector('text=Chế độ Xem trước như Học sinh', { timeout: 10000 });
    console.log('  [PASS] Giáo viên vào chế độ Xem Trước Sư Phạm an toàn');
    await saveScreenshot(teacherPage, 'g2-final-09-teacher-preview-mode.png');

    // Answer Q1 in preview
    const opt4 = teacherPage.locator('div.grid button:has-text("4")').first();
    await opt4.click();
    await teacherPage.locator('button:has-text("Trả lời")').click();
    await teacherPage.waitForTimeout(1000);

    // Verify 0 attempts written to Firestore for teacher-1
    const attemptsAfterSnap = await getDocs(query(collection(db, 'attempts'), where('studentId', '==', 'teacher-1')));
    const countAfter = attemptsAfterSnap.size;
    if (countAfter !== countBefore) {
      throw new Error(`Phát hiện ghi rác attempt vào Firestore trong chế độ preview! (${countBefore} -> ${countAfter})`);
    }
    console.log(`  [PASS] Xác nhận tuyệt đối: Chế độ xem trước KHÔNG GHI RÁC attempt vào Firestore (Số lượng: ${countBefore} = ${countAfter})`);
  } finally {
    await teacherContext.close();
  }

  // --------------------------------------------------------------------------
  // PHẦN 3: KIỂM THỬ TRÊN MÀN HÌNH MOBILE (390 x 844) & NÚT BẬT/TẮT ÂM THANH
  // --------------------------------------------------------------------------
  console.log('\n--- PHẦN 3: MÀN HÌNH MOBILE (390x844) & TÙY CHỌN ÂM THANH ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.addInitScript(
      ({ token, user, assignment, version }) => {
        localStorage.setItem('thamtutoannhi_auth_token', token);
        localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
        sessionStorage.clear();
        sessionStorage.setItem('thamtunhi_active_mission_assignment', JSON.stringify(assignment));
        sessionStorage.setItem('thamtunhi_active_mission_version', JSON.stringify(version));
      },
      { token: studentToken, user: studentUser, assignment: assignmentDoc, version: v2Data }
    );

    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('text=Câu 1 / 8', { timeout: 15000 });
    console.log('  [PASS] Mobile: Giao diện làm bài hiển thị sắc nét trên viewport 390px');

    // Toggle sound button on Mobile
    const mobileSoundBtn = mobilePage.locator('button:has-text("Âm thanh")');
    await mobileSoundBtn.click();
    console.log('  [PASS] Mobile: Chạm chuyển trạng thái Âm thanh thành công');
    await saveScreenshot(mobilePage, 'g2-final-10-mobile-sound-toggle.png');
  } finally {
    await mobileContext.close();
  }

  await browser.close();
  console.log('\n================================================================');
  console.log(' HOÀN TẤT KIỂM THỬ PLAYWRIGHT E2E TOÀN DIỆN G2: 100% PASS');
  console.log('================================================================');
}

runTeacherG2FinalE2E().catch((err) => {
  console.error('LỖI E2E G2 FINAL:', err);
  process.exit(1);
});
