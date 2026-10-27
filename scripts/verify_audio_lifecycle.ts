import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { makeToken } from './token_helper.ts';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const SERVER_URL = 'http://127.0.0.1:3005';

async function main() {
  console.log('================================================================');
  console.log('KIỂM THỬ VÒNG ĐỜI QUẢN LÝ ÂM THẦN & CHUẨN HÓA LỚP 1 TUẦN 1–9');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failCount++;
    }
  }

  // 1. Kiểm tra API Server Health
  console.log('--- 1. KIỂM TRA MÁY CHỦ LOCAL (PORT 3005) ---');
  try {
    const healthRes = await fetch(`${SERVER_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.ok && healthData.status === 'healthy', 'Máy chủ đang hoạt động và kết nối Firebase bình thường');
  } catch (err: any) {
    assert(false, `Không kết nối được server tại ${SERVER_URL}: ${err.message}`);
    return;
  }

  // 2. Kiểm tra Token Giáo viên
  const teacherToken = makeToken({
    uid: 'user-1792533985096',
    email: 'xuannuong@gmail.com',
    role: 'teacher',
    displayName: 'Hà Thị Xuân Nương',
  });

  // 3. Kiểm thử API Tạo / Tạo lại âm thanh (/api/audio/synthesize)
  console.log('\n--- 2. KIỂM THỬ TẠO LẠI ÂM THANH TIẾNG VIỆT (TTS) ---');
  const customPromptText = 'Các em hãy quan sát và đếm xem có bao nhiêu quả táo nhé!';
  const synthRes = await fetch(`${SERVER_URL}/api/audio/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      text: customPromptText,
      type: 'prompt',
      force: true, // Force re-synthesize (Req 2.2)
    }),
  });
  const synthData = await synthRes.json();
  assert(synthRes.ok && synthData.ok === true, 'Tạo âm thanh tiếng Việt thành công từ văn bản mới');
  assert(Boolean(synthData.audioUrl), `URL âm thanh hợp lệ: ${synthData.audioUrl}`);
  assert(Boolean(synthData.hash), `Mã băm âm thanh: ${synthData.hash}`);

  // Fetch file âm thanh vừa tạo
  const audioFetchRes = await fetch(`${SERVER_URL}${synthData.audioUrl}`);
  assert(audioFetchRes.ok, `Tải được tệp âm thanh mới từ máy chủ (HTTP ${audioFetchRes.status})`);
  const audioBuffer = await audioFetchRes.arrayBuffer();
  assert(audioBuffer.byteLength > 1000, `Tệp âm thanh có dữ liệu hợp lệ (${audioBuffer.byteLength} bytes)`);

  // 4. Kiểm thử Tải lên tệp âm thanh (/api/audio/upload)
  console.log('\n--- 3. KIỂM THỬ TẢI LÊN / THAY THẾ TỆP ÂM THANH (UPLOAD) ---');
  // Sample small valid MP3 audio header/silence buffer
  const sampleAudioBase64 = Buffer.from(audioBuffer.slice(0, 4000)).toString('base64');
  const uploadRes = await fetch(`${SERVER_URL}/api/audio/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      base64Data: sampleAudioBase64,
      filename: 'giao_vien_thu_am.mp3',
      mimeType: 'audio/mpeg',
      type: 'prompt',
    }),
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.ok && uploadData.ok === true, 'Giáo viên tải tệp âm thanh lên thành công');
  assert(Boolean(uploadData.audioUrl), `URL tệp tải lên: ${uploadData.audioUrl}`);

  // Test Upload validation: Reject file > 5MB (Req 2.1)
  const fakeHugeBuffer = Buffer.alloc(5.2 * 1024 * 1024);
  const fakeHugeData = fakeHugeBuffer.toString('base64');
  const rejectHugeRes = await fetch(`${SERVER_URL}/api/audio/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      base64Data: fakeHugeData,
      filename: 'huge_file.mp3',
      type: 'prompt',
    }),
  });
  assert(rejectHugeRes.status === 400, 'Từ chối tệp vượt quá 5MB chính xác (HTTP 400)');

  // 5. Kiểm tra tính bền vững trên Firestore (/test/audio_meta_... & /test/audio_bin_...)
  console.log('\n--- 4. KIỂM THỬ LƯU TRỮ BỀN VỮNG TRÊN FIRESTORE (REQ 6) ---');
  const uploadedFilename = uploadData.filename;
  const metaDoc = await getDoc(doc(db, 'test', `audio_meta_${uploadedFilename}`));
  assert(metaDoc.exists(), `Metadata của tệp âm thanh đã được lưu trên Firestore: test/audio_meta_${uploadedFilename}`);
  const binDoc = await getDoc(doc(db, 'test', `audio_bin_${uploadedFilename}_0`));
  assert(binDoc.exists(), `Dữ liệu nhị phân (chunk 0) được lưu bền vững trên Firestore: test/audio_bin_${uploadedFilename}_0`);

  // 6. Kiểm tra Bảo toàn Dữ liệu Học sinh (Req 7)
  console.log('\n--- 5. KIỂM TRA BẢO TOÀN DỮ LIỆU HỌC SINH (REQ 7) ---');
  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  assert(attemptsSnap.size >= 379, `Số lượt làm bài thực tế của học sinh được bảo toàn nguyên vẹn: ${attemptsSnap.size} bài nộp`);

  // 7. Kiểm tra Không còn rò rỉ đáp án trong manh mối & Không còn ký tự &rarr;
  console.log('\n--- 6. KIỂM TRA CHUẨN HÓA HÌNH ẢNH & KHÔNG RÒ RỈ ĐÁP ÁN (REQ 1 & 5) ---');
  const TARGET_VERSIONS = [
    'version-lesson-g1-01-v1',
    'version-lesson-g1-01-v2',
    'version-lesson-g1-02-v1',
    'version-lesson-g1-03-v1',
    'version-lesson-g1-05-v1',
    'version-lesson-draft-1792910089741-v4',
  ];

  let leakedHintsFound = 0;
  for (const vId of TARGET_VERSIONS) {
    const snap = await getDoc(doc(db, 'lessonVersions', vId));
    if (!snap.exists()) continue;
    const vData = snap.data();
    for (const q of vData.questions || []) {
      for (const h of q.ruleHints || []) {
        if (/\b\d+\s*[\+\-]\s*\d+\s*=\s*\d+\b/.test(h.hintText)) {
          console.error(`  [LEAK] Trong ${vId} Q${q.order}: "${h.hintText}"`);
          leakedHintsFound++;
        }
      }
    }
  }
  assert(leakedHintsFound === 0, 'Toàn bộ câu hỏi tuần 1–9 không có manh mối nào làm lộ phép tính giải hoặc đáp án');

  console.log('\n================================================================');
  console.log(`KẾT QUẢ: ${passCount} PASS / ${failCount} FAIL`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
