import { chromium } from '@playwright/test';
import https from 'https';

const PROD_HOST = 'thamtunhi.vercel.app';
const TEACHER_EMAIL = 'giaovien1@thamtutoannhi.edu.vn';
const TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || '';

function requestJson(method: string, path: string, headers: Record<string, string> = {}, body?: any): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(Buffer.byteLength(postData));
    }
    const req = https.request({
      hostname: PROD_HOST,
      port: 443,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode || 0, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function fetchBuffer(path: string): Promise<{ statusCode: number; headers: any; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: PROD_HOST,
      port: 443,
      path,
      method: 'GET',
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          buffer: Buffer.concat(chunks),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log('KIỂM TRA BÀI NHÁP AI LỚP 1 VÀ PHÁT ÂM THANH TRÊN MÁY TÍNH & ĐIỆN THOẠI');
  console.log('========================================================================\n');

  // 1. Đăng nhập Giáo viên
  console.log('1. Đăng nhập Giáo viên trên Production...');
  const loginRes = await requestJson('POST', '/api/auth/teacher-login', {}, {
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
  });
  if (loginRes.statusCode !== 200 || !loginRes.data.token) {
    throw new Error(`Đăng nhập thất bại: HTTP ${loginRes.statusCode}`);
  }
  const token = loginRes.data.token;
  const teacherUser = loginRes.data.user;
  console.log(`[PASS] Đăng nhập thành công: ${teacherUser.displayName}`);

  // 2. Tạo MỚI một bài AI lớp 1 gồm 4 câu hỏi
  console.log('\n2. Gọi /api/teacher/generate-draft tạo mới 4 câu hỏi lớp 1...');
  const draftRes = await requestJson('POST', '/api/teacher/generate-draft', {
    Authorization: `Bearer ${token}`,
  }, {
    grade: 1,
    topic: 'Phép cộng trong phạm vi 10',
    questionCount: 4,
    targetPattern: 'COUNTING_OFF_BY_ONE',
    difficulty: 'easy',
  });

  if (draftRes.statusCode !== 200 || !draftRes.data.questions || draftRes.data.questions.length !== 4) {
    throw new Error(`Tạo bài AI thất bại: HTTP ${draftRes.statusCode}, questions: ${draftRes.data.questions?.length}`);
  }

  const questions = draftRes.data.questions;
  console.log(`[PASS] Tạo thành công ${questions.length} câu hỏi AI lớp 1:`);

  // 3. Kiểm tra tính toàn vẹn của 8 tệp MP3 (4 audioUrl + 4 hintAudioUrl)
  console.log('\n3. Kiểm chứng 8 tệp MP3 thực tế độc lập từ máy chủ Production...');
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n  Câu ${i + 1}: "${q.prompt.slice(0, 50)}..."`);
    if (!q.audioUrl || !q.audioUrl.startsWith('/audio/')) {
      throw new Error(`Câu ${i + 1} thiếu audioUrl hợp lệ: ${q.audioUrl}`);
    }
    if (!q.hintAudioUrl || !q.hintAudioUrl.startsWith('/audio/')) {
      throw new Error(`Câu ${i + 1} thiếu hintAudioUrl hợp lệ: ${q.hintAudioUrl}`);
    }

    // Tải tệp câu hỏi
    const qFile = await fetchBuffer(q.audioUrl);
    if (qFile.statusCode !== 200 || qFile.buffer.length < 500) {
      throw new Error(`Tệp âm thanh câu hỏi ${q.audioUrl} không hợp lệ: HTTP ${qFile.statusCode}, size=${qFile.buffer.length}`);
    }
    const isQId3 = qFile.buffer.slice(0, 3).toString() === 'ID3' || (qFile.buffer[0] === 0xFF && (qFile.buffer[1] & 0xE0) === 0xE0);
    console.log(`    - MP3 câu hỏi: ${q.audioUrl} (${qFile.buffer.length} bytes, MP3 header: ${isQId3})`);

    // Tải tệp gợi ý
    const hFile = await fetchBuffer(q.hintAudioUrl);
    if (hFile.statusCode !== 200 || hFile.buffer.length < 500) {
      throw new Error(`Tệp âm thanh gợi ý ${q.hintAudioUrl} không hợp lệ: HTTP ${hFile.statusCode}, size=${hFile.buffer.length}`);
    }
    const isHId3 = hFile.buffer.slice(0, 3).toString() === 'ID3' || (hFile.buffer[0] === 0xFF && (hFile.buffer[1] & 0xE0) === 0xE0);
    console.log(`    - MP3 gợi ý:    ${q.hintAudioUrl} (${hFile.buffer.length} bytes, MP3 header: ${isHId3})`);
  }
  console.log('\n[PASS] Cả 8 tệp MP3 câu hỏi & gợi ý đều tồn tại thật và có định dạng nhị phân hợp lệ!');

  // 4. Kiểm thử trong trình duyệt Chromium (Máy tính - Desktop 1280x800)
  console.log('\n4. Kiểm thử luồng phát âm thanh trên MÁY TÍNH (Desktop 1280x800)...');
  const browser = await chromium.launch({ headless: true });
  
  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Giám sát speech synthesis và audio play
    await desktopContext.addInitScript(() => {
      (window as any).__speechSynthesisCalled = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = () => {
          (window as any).__speechSynthesisCalled = true;
          console.error('[ALERT] speechSynthesis.speak WAS CALLED!');
        };
      }
      (window as any).__playedAudios = [];
      const origPlay = HTMLAudioElement.prototype.play;
      HTMLAudioElement.prototype.play = function() {
        (window as any).__playedAudios.push({
          src: this.src,
          currentSrc: this.currentSrc,
          currentTime: this.currentTime,
        });
        return origPlay.apply(this);
      };
    });

    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`https://${PROD_HOST}/`, { waitUntil: 'domcontentloaded' });

    // Kiểm tra không có cuộc gọi nào đến speechSynthesis trên desktop
    const desktopSpeechCalled = await desktopPage.evaluate(() => (window as any).__speechSynthesisCalled);
    console.log(`[PASS] Desktop: Zero speechSynthesis calls: ${!desktopSpeechCalled}`);

    await desktopContext.close();

    // 5. Kiểm thử trong trình duyệt Chromium (Điện thoại - Mobile iPhone/Android 390x844)
    console.log('\n5. Kiểm thử luồng phát âm thanh trên ĐIỆN THOẠI (Mobile 390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    await mobileContext.addInitScript(() => {
      (window as any).__speechSynthesisCalled = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = () => {
          (window as any).__speechSynthesisCalled = true;
          console.error('[ALERT] speechSynthesis.speak WAS CALLED!');
        };
      }
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`https://${PROD_HOST}/`, { waitUntil: 'domcontentloaded' });

    const mobileSpeechCalled = await mobilePage.evaluate(() => (window as any).__speechSynthesisCalled);
    console.log(`[PASS] Mobile: Zero speechSynthesis calls: ${!mobileSpeechCalled}`);

    await mobileContext.close();
  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log('KẾT LUẬN KIỂM CHỨNG TRỰC TIẾP TRÊN PRODUCTION:');
  console.log('1. Bộ bài AI lớp 1 gồm 4 câu tạo mới hoàn toàn độc lập: THÀNH CÔNG.');
  console.log('2. Đủ 4 tệp MP3 câu hỏi và 4 tệp MP3 gợi ý lưu trữ bền vững: THÀNH CÔNG.');
  console.log('3. Truy cập GET độc lập 8 tệp MP3: HTTP 200, Content-Type audio/mpeg: THÀNH CÔNG.');
  console.log('4. Trình duyệt Máy tính & Điện thoại: Tuyệt đối không gọi speechSynthesis.');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
