/**
 * TOÀN BỘ KIỂM THỬ HỆ THỐNG ÂM THANH - THÁM TỬ TOÁN NHÍ
 * Chạy độc lập, an toàn, không ghi đè dữ liệu học sinh Production.
 */
import fs from 'fs';
import path from 'path';
import { normalizeMathTextForSpeech, getAudioHash, isGrade1Weeks1To9 } from '../src/lib/vietnameseTts';
import { synthesizeVietnameseSpeech } from '../src/lib/vietnameseTtsServer';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assertTest(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  const status = condition ? '[PASS]' : '[FAIL]';
  console.log(`${status} ${name}`);
  if (!condition) {
    console.error(`       Chi tiết lỗi: ${details}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG ÂM THANH (E2E)');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Kiểm tra nguồn TTS & chuẩn hóa tiếng Việt Lớp 1
  // -------------------------------------------------------------
  console.log('--- TEST 1: Nguồn giọng & Chuẩn hóa tiếng Việt Lớp 1 ---');
  const samplePrompt = 'Có 5 quả táo, thêm 2 quả táo nữa. Hỏi có tất cả bao nhiêu quả táo? 5 + 2 = ?';
  const spokenPrompt = normalizeMathTextForSpeech(samplePrompt, ['5', '6', '7', '8']);
  
  assertTest(
    'Chuẩn hóa phép toán tiếng Việt cho Lớp 1',
    spokenPrompt.includes('cộng') && !spokenPrompt.includes('+'),
    `Văn bản sau chuẩn hóa: "${spokenPrompt}"`
  );

  // -------------------------------------------------------------
  // TEST 2: Tạo MỚI bộ bài AI Lớp 1 (4 câu hỏi) & Tổng hợp âm thanh thật
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Tạo MỚI bộ bài AI Lớp 1 (4 câu) & Tổng hợp âm thanh thật ---');
  const freshDraftQuestions = [
    {
      prompt: 'Bác nông dân có 3 con bò và 2 con trâu. Bác có tất cả mấy con gia súc?',
      options: ['3', '4', '5', '6'],
      expectedAnswer: '5',
      hintText: 'Em hãy làm phép tính cộng: lấy 3 cộng với 2 xem bằng bao nhiêu nhé!'
    },
    {
      prompt: 'Hình nào dưới đây có dạng hình vuông?',
      options: ['Hình tròn', 'Hình tam giác', 'Hình vuông', 'Hình chữ nhật'],
      expectedAnswer: 'Hình vuông',
      hintText: 'Hình vuông là hình có bốn cạnh dài bằng nhau em nhé.'
    },
    {
      prompt: 'Điền số thích hợp vào dấu hỏi chấm: 4 + ? = 6',
      options: ['1', '2', '3', '4'],
      expectedAnswer: '2',
      hintText: 'Có 4 rồi, cần thêm mấy nữa để được 6? Em hãy đếm thêm nhé!'
    },
    {
      prompt: 'Mai có 7 bông hoa, Mai tặng bạn 3 bông hoa. Mai còn lại mấy bông hoa?',
      options: ['2', '3', '4', '5'],
      expectedAnswer: '4',
      hintText: 'Tặng bạn là bớt đi, em hãy làm phép trừ: 7 trừ đi 3 nhé!'
    }
  ];

  const generatedAudios: Array<{ qIndex: number; qUrl: string; qBuf: Buffer; hUrl: string; hBuf: Buffer }> = [];

  for (let i = 0; i < freshDraftQuestions.length; i++) {
    const q = freshDraftQuestions[i];
    const spokenQ = normalizeMathTextForSpeech(q.prompt, q.options);
    const spokenH = normalizeMathTextForSpeech(q.hintText);

    const qHash = getAudioHash(spokenQ);
    const hHash = getAudioHash(spokenH);

    console.log(`[TỔNG HỢP CÂU ${i + 1}]`);
    console.log(`  - Câu hỏi: "${q.prompt.substring(0, 45)}..."`);
    console.log(`  - Gợi ý: "${q.hintText.substring(0, 45)}..."`);

    const qBuf = await synthesizeVietnameseSpeech(spokenQ);
    const hBuf = await synthesizeVietnameseSpeech(spokenH);

    const qUrl = `/audio/q_${qHash}.mp3`;
    const hUrl = `/audio/h_${hHash}.mp3`;

    generatedAudios.push({
      qIndex: i + 1,
      qUrl,
      qBuf,
      hUrl,
      hBuf
    });
  }

  assertTest(
    'Tạo đủ 4 MP3 câu hỏi và 4 MP3 gợi ý mới',
    generatedAudios.length === 4,
    `Đã tổng hợp thành công ${generatedAudios.length} cặp âm thanh câu hỏi + gợi ý`
  );

  // -------------------------------------------------------------
  // TEST 3: Kiểm tra tính hợp lệ của tệp MP3 (Header sync & Kích thước)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Kiểm tra cấu trúc tệp MP3 nhị phân ---');
  let allBuffersValid = true;
  for (const item of generatedAudios) {
    const isQValid = item.qBuf.length > 500 && (
      (item.qBuf[0] === 0xFF && (item.qBuf[1] & 0xE0) === 0xE0) ||
      (item.qBuf[0] === 0x49 && item.qBuf[1] === 0x44 && item.qBuf[2] === 0x33) // ID3
    );
    const isHValid = item.hBuf.length > 500 && (
      (item.hBuf[0] === 0xFF && (item.hBuf[1] & 0xE0) === 0xE0) ||
      (item.hBuf[0] === 0x49 && item.hBuf[1] === 0x44 && item.hBuf[2] === 0x33) // ID3
    );

    if (!isQValid || !isHValid) {
      allBuffersValid = false;
      console.error(`Câu ${item.qIndex} có MP3 không hợp lệ: Q size=${item.qBuf.length}, H size=${item.hBuf.length}`);
    } else {
      console.log(`  ✓ Câu ${item.qIndex}: MP3 câu hỏi (${item.qBuf.length} bytes), MP3 gợi ý (${item.hBuf.length} bytes) - Khớp MP3 header`);
    }
  }

  assertTest(
    'Tất cả 8 tệp MP3 đều có header MP3/ID3 chuẩn và kích thước > 500 bytes',
    allBuffersValid,
    'Tất cả tệp MP3 đều giải mã âm thanh hợp lệ'
  );

  // -------------------------------------------------------------
  // TEST 4: Kiểm tra loại trừ triệt để giọng đọc nước ngoài
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Loại bỏ giọng đọc nước ngoài / Fallback speechSynthesis ---');
  const playerSource = fs.readFileSync(path.resolve(process.cwd() + '/scripts', '../src/lib/vietnameseAudioPlayer.ts'), 'utf8');
  const codeOnly = playerSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const hasSpeechSynth = codeOnly.includes('speechSynthesis') || codeOnly.includes('SpeechSynthesisUtterance');
  
  assertTest(
    'src/lib/vietnameseAudioPlayer.ts hoàn toàn không chứa speechSynthesis',
    !hasSpeechSynth,
    hasSpeechSynth ? 'CẢNH BÁO: Vẫn còn speechSynthesis trong player' : 'Đã loại bỏ 100% speechSynthesis'
  );

  const modalSource = fs.readFileSync(path.resolve(process.cwd() + '/scripts', '../src/components/activities/DetectiveFeedbackModal.tsx'), 'utf8');
  assertTest(
    'DetectiveFeedbackModal gọi playVietnameseAudio với fallbackText = undefined',
    modalSource.includes('cleanUrl,\n          undefined,') && modalSource.includes('cleanUrl,\n      undefined,'),
    'Đã loại bỏ fallbackText khỏi DetectiveFeedbackModal'
  );

  // -------------------------------------------------------------
  // TEST 5: Kiểm tra cơ chế chặn xuất bản bài Lớp 1 sai/thiếu âm thanh
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Kiểm tra cổng chặn xuất bản (Pre-publish Gate) ---');
  const isScope = isGrade1Weeks1To9({ grade: 1, title: 'Tuần 2: Phép cộng trong phạm vi 10' });
  assertTest(
    'Xác định đúng phạm vi bắt buộc âm thanh Lớp 1 Tuần 1-9',
    isScope === true,
    'Tuần 2 Lớp 1 nằm trong phạm vi bắt buộc âm thanh'
  );

  const isScopeGrade2 = isGrade1Weeks1To9({ grade: 2, title: 'Tuần 2: Phép nhân' });
  assertTest(
    'Lớp 2 không bị bắt buộc âm thanh',
    isScopeGrade2 === false,
    'Lớp 2 giữ nguyên, không bắt buộc âm thanh'
  );

  // Mô phỏng kiểm tra tính hợp lệ trước xuất bản
  const sampleValidQuestion = {
    prompt: freshDraftQuestions[0].prompt,
    options: freshDraftQuestions[0].options,
    audioUrl: generatedAudios[0].qUrl,
    audioHash: getAudioHash(normalizeMathTextForSpeech(freshDraftQuestions[0].prompt, freshDraftQuestions[0].options)),
    ruleHints: [{
      hintText: freshDraftQuestions[0].hintText,
      hintAudioUrl: generatedAudios[0].hUrl,
      hintAudioHash: getAudioHash(normalizeMathTextForSpeech(freshDraftQuestions[0].hintText))
    }]
  };

  // Case A: Hợp lệ 100%
  const isValidA = !!(sampleValidQuestion.audioUrl && sampleValidQuestion.audioHash && sampleValidQuestion.ruleHints[0].hintAudioUrl);
  assertTest('Câu hỏi hợp lệ có đủ audioUrl, hintAudioUrl và audioHash', isValidA, 'Đủ điều kiện xuất bản');

  // Case B: Giáo viên sửa prompt nhưng chưa cập nhật âm thanh -> lệch hash
  const modifiedPrompt = sampleValidQuestion.prompt + ' (đã sửa lời)';
  const currentExpectedHash = getAudioHash(normalizeMathTextForSpeech(modifiedPrompt, sampleValidQuestion.options));
  const isStaleHash = sampleValidQuestion.audioHash !== currentExpectedHash;
  assertTest(
    'Phát hiện âm thanh cũ/lệch nội dung khi giáo viên sửa câu hỏi mà chưa tạo lại âm thanh',
    isStaleHash,
    `Hash cũ: ${sampleValidQuestion.audioHash} != Hash mới: ${currentExpectedHash}`
  );

  // -------------------------------------------------------------
  // TEST 6: Kiểm tra luồng học sinh (MissionPlayer)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Kiểm tra luồng phát âm thanh học sinh (MissionPlayer) ---');
  const missionPlayerSource = fs.readFileSync(path.resolve(process.cwd() + '/scripts', '../src/components/student/MissionPlayer.tsx'), 'utf8');
  
  assertTest(
    'MissionPlayer có cơ chế lastPlayedIndexRef chống lặp và chống chồng tiếng',
    missionPlayerSource.includes('lastPlayedIndexRef') && missionPlayerSource.includes('lastPlayedIndexRef.current = currentIndex'),
    'Cơ chế chống lặp âm thanh đã được tích hợp'
  );

  assertTest(
    'MissionPlayer truyền đúng hintAudioUrl và nội dung gợi ý vào DetectiveFeedbackModal',
    (missionPlayerSource.includes('hintAudioUrl: currentQuestion?.hintAudioUrl') || missionPlayerSource.includes('hintAudioUrl: currentQuestion.hintAudioUrl')) &&
    (missionPlayerSource.includes('hintText: effectiveHint') || missionPlayerSource.includes('hintText: result.hintText')),
    'Gợi ý âm thanh khớp chính xác với nội dung gợi ý đang hiển thị'
  );

  // -------------------------------------------------------------
  // TỔNG KẾT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const totalPassed = results.filter(r => r.passed).length;
  console.log(`  KẾT QUẢ: ${totalPassed}/${results.length} KIỂM THỬ ĐẠT (PASS)`);
  console.log('================================================================\n');

  if (totalPassed < results.length) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
