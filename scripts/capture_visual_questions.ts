import { chromium } from '@playwright/test';
import path from 'path';
import { makeToken } from './token_helper.ts';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/fe39771f-6013-4c5a-be68-5905d02c63db');

async function captureVisualQuestions() {
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

  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('thamtutoannhi_auth_token', token);
    localStorage.setItem('thamtutoannhi_user', JSON.stringify(user));
  }, { token: teacherToken, user: teacherUser });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3005');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('text=Hà Thị Xuân Nương', { timeout: 10000 });

  const draftCard = page.locator('div.rounded-3xl', {
    has: page.locator('text=Luyện tập các số 1 2 3 4 5'),
  }).first();

  await draftCard.waitFor({ state: 'visible', timeout: 10000 });

  // Preview student
  const previewBtn = draftCard.locator('button[title*="Xem trước"]').first();
  await previewBtn.click();
  await page.waitForTimeout(600);

  // Click "Bắt đầu làm bài"
  const startBtn = page.locator('button', { hasText: 'Bắt đầu làm bài' }).first();
  await startBtn.click();
  await page.waitForTimeout(600);

  // Câu 1: 4 Quả táo
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'visual_q1_apples.png') });
  console.log('✓ visual_q1_apples.png');

  // Submit Answer Q1 (4)
  const opt4 = page.locator('button:has-text("4")').first();
  await opt4.click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Trả lời")').first().click();
  await page.waitForTimeout(800);

  // Câu 2: 2 + 3 Con chim
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'visual_q2_birds.png') });
  console.log('✓ visual_q2_birds.png');

  // Submit Answer Q2 (5)
  const opt5 = page.locator('button:has-text("5")').first();
  await opt5.click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Trả lời")').first().click();
  await page.waitForTimeout(800);

  // Câu 3: So sánh 3 ... 5 (Sao)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'visual_q3_stars.png') });
  console.log('✓ visual_q3_stars.png');

  // Submit Answer Q3 (<)
  const optLess = page.locator('button:has-text("<")').first();
  await optLess.click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Trả lời")').first().click();
  await page.waitForTimeout(800);

  // Câu 4: 5 Củ cà rốt trong khung 5 ô
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'visual_q4_carrots.png') });
  console.log('✓ visual_q4_carrots.png');

  await browser.close();
  console.log('--- HOÀN TẤT CHỤP ẢNH CÂU HỎI TRỰC QUAN ---');
}

captureVisualQuestions().catch(console.error);
