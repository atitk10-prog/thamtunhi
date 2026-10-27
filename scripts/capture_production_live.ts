import { chromium } from '@playwright/test';
import path from 'path';
import https from 'https';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/fe39771f-6013-4c5a-be68-5905d02c63db');
const PROD_URL = 'https://thamtunhi.vercel.app';

function loginTeacher(): Promise<{ token: string; user: any }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: 'giaovien1@thamtutoannhi.edu.vn',
      password: process.env.TEST_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || ''
    });
    const req = https.request({
      hostname: 'thamtunhi.vercel.app',
      port: 443,
      path: '/api/auth/teacher-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve({ token: parsed.token, user: parsed.user });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function captureProductionLive() {
  console.log('--- ĐĂNG NHẬP VÀ CHỤP ẢNH XÁC THỰC TRỰC TIẾP TRÊN PRODUCTION ---');
  const { token, user } = await loginTeacher();
  console.log('✓ Lấy token production thành công cho:', user.displayName);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  await context.addInitScript(({ t, u }) => {
    localStorage.setItem('thamtutoannhi_auth_token', t);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(u));
  }, { t: token, u: user });

  const page = await context.newPage();

  console.log('Đang truy cập Production:', PROD_URL);
  await page.goto(PROD_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  console.log('✓ Trang Cổng Giáo viên tải thành công');

  // 1. Chụp ảnh danh sách bài học và tìm bài Luyện tập các số 1 2 3 4 5
  const draftCard = page.locator('div.rounded-3xl', {
    has: page.locator('text=Luyện tập các số 1 2 3 4 5'),
  }).first();

  const isDraftVisible = await draftCard.isVisible().catch(() => false);
  let targetCard = draftCard;
  if (!isDraftVisible) {
    targetCard = page.locator('div.rounded-3xl', {
      has: page.locator('text=Các số từ 1 đến 5: Đếm và Nhận biết'),
    }).first();
  }

  await targetCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Tìm thấy thẻ bài học mục tiêu');

  // Bấm nút Sửa bài học
  const editBtn = targetCard.locator('button[title="Chỉnh sửa bài học"]').first();
  await editBtn.click();
  await page.waitForSelector('text=Biên Tập:', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Chụp ảnh giao diện Giáo viên thêm/sửa/xóa âm thanh trực tiếp trên Production
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'prod_teacher_editor_audio.png'),
  });
  console.log('✓ Đã lưu prod_teacher_editor_audio.png');

  // Đóng modal biên tập
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 2. Bấm Xem trước bài học như học sinh
  const previewBtn = targetCard.locator('button[title="Xem trước như học sinh"]').first();
  await previewBtn.click();
  await page.waitForTimeout(1000);

  // Chụp ảnh Splash Screen kích hoạt âm thanh
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'prod_student_splash.png'),
  });
  console.log('✓ Đã lưu prod_student_splash.png');

  // Bấm "Bắt đầu làm bài"
  const startBtn = page.locator('button', { hasText: 'Bắt đầu làm bài' }).first();
  await startBtn.click();
  await page.waitForTimeout(1000);

  // Chụp ảnh Câu 1 có hình ảnh
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'prod_student_question_1_apples.png'),
  });
  console.log('✓ Đã lưu prod_student_question_1_apples.png');

  // Bấm chọn đáp án đầu tiên hoặc tiếp tục
  const optButtons = page.locator('button.w-full');
  if (await optButtons.count() > 0) {
    await optButtons.first().click().catch(() => {});
  }
  await page.waitForTimeout(500);

  const nextBtn1 = page.locator('button', { hasText: 'Tiếp tục' }).first();
  if (await nextBtn1.isVisible()) {
    await nextBtn1.click();
    await page.waitForTimeout(1000);

    // Chụp ảnh Câu 2 có hình ảnh
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'prod_student_question_2_birds.png'),
    });
    console.log('✓ Đã lưu prod_student_question_2_birds.png');
  }

  await browser.close();
  console.log('--- HOÀN TẤT CHỤP ẢNH PRODUCTION TOÀN DIỆN ---');
}

captureProductionLive().catch(err => {
  console.error('Lỗi chụp ảnh production:', err);
  process.exit(1);
});
