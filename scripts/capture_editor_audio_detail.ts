import { chromium } from '@playwright/test';
import path from 'path';
import { makeToken } from './token_helper.ts';

const ARTIFACT_DIR = path.resolve('C:/Users/Hii/.gemini/antigravity-ide/brain/fe39771f-6013-4c5a-be68-5905d02c63db');

async function captureDetailedEditorAudio() {
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

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
  const editBtn = draftCard.locator('button[title*="Biên tập"]').first();
  await editBtn.click();

  const editorModal = page.locator('text=Biên Tập:');
  await editorModal.waitFor({ state: 'visible', timeout: 8000 });

  // Scroll editor down to show question 1 audio controls clearly
  const audioSection = page.locator('text=Âm thanh đọc câu hỏi').first();
  await audioSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_teacher_editor_audio_detail.png') });
  console.log('Successfully captured desktop_teacher_editor_audio_detail.png');

  // Scroll down further to hint audio section
  const hintAudioSection = page.locator('text=Âm thanh đọc gợi ý').first();
  await hintAudioSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_teacher_editor_hint_audio_detail.png') });
  console.log('Successfully captured desktop_teacher_editor_hint_audio_detail.png');

  await browser.close();
}

captureDetailedEditorAudio().catch(console.error);
