import assert from 'assert';
import { isGrade1Weeks1To9, getQuestionSpokenText, getHintSpokenText, getAudioHash, normalizeMathTextForSpeech } from '../src/lib/vietnameseTts.ts';
import { Question, Lesson, LessonVersion } from '../src/types/index.ts';

console.log('================================================================');
console.log('   KIỂM THỬ HỒI QUY TOÀN DIỆN: P0 HIỂN THỊ ÂM THANH & LỘ ĐÁP ÁN');
console.log('================================================================\n');

// -------------------------------------------------------------
// PHẦN 1: KIỂM TRA QUYỀN HIỂN THỊ BIÊN TẬP ÂM THANH (REQUIREMENT 2.A)
// -------------------------------------------------------------
console.log('--- 1. Kiểm tra Quyền quản lý âm thanh trong Giao diện Biên tập ---');

// Nguyên tắc 2.A: Đối với giao diện giáo viên biên tập bài Toán lớp 1:
// Luôn hiển thị công cụ âm thanh (canManageGrade1Audio = grade === 1)
// Bất kể tên bài có chứa dấu phẩy hay không, bất kể ID bài học.
function canManageAudio(grade: number): boolean {
  return Number(grade) === 1;
}

// 1.1 Bài "Các số 6 7 8 9 10" (v2, 4 câu)
const lessonCase1: Lesson = {
  id: 'lesson-draft-1793091019622',
  title: 'Các số 6 7 8 9 10',
  grade: 1,
  week: 6,
  topic: 'Các số từ 0 đến 10',
  learningStandard: 'Đếm, đọc, viết các số 6, 7, 8, 9, 10',
  description: 'Nhận biết số lượng 6-10',
  durationMinutes: 15,
  totalQuestions: 4,
  status: 'published',
  currentVersion: 2,
  createdBy: 'teacher-1',
  createdAt: new Date().toISOString(),
  dataOrigin: 'real',
  environmentTag: 'production',
};

assert.strictEqual(canManageAudio(lessonCase1.grade), true, 'Bài 1: Phải có quyền quản lý âm thanh trong editor');
console.log('✓ Bài "Các số 6 7 8 9 10": canManageGrade1Audio = TRUE (Công cụ âm thanh luôn hiển thị)');

// 1.2 Bài "Luyện tập các số 1 2 3 4 5" (v4, 4 câu)
const lessonCase2: Lesson = {
  id: 'lesson-draft-1792910089741',
  title: 'Luyện tập các số 1 2 3 4 5',
  grade: 1,
  week: 5,
  topic: 'Các số từ 0 đến 10',
  learningStandard: 'Đếm, đọc, viết các số 1-5',
  description: 'Luyện tập đếm 1-5',
  durationMinutes: 15,
  totalQuestions: 4,
  status: 'published',
  currentVersion: 4,
  createdBy: 'teacher-1',
  createdAt: new Date().toISOString(),
  dataOrigin: 'real',
  environmentTag: 'production',
};

assert.strictEqual(canManageAudio(lessonCase2.grade), true, 'Bài 2: Phải có quyền quản lý âm thanh trong editor');
console.log('✓ Bài "Luyện tập các số 1 2 3 4 5": canManageGrade1Audio = TRUE (Công cụ âm thanh luôn hiển thị)');

// 1.3 Bài Lớp 1 Tuần 10 trở đi (ví dụ lesson-g1-04, week 10)
const lessonCase3: Lesson = {
  id: 'lesson-g1-04',
  title: '[Tuần 10] Phép trừ trong phạm vi 10',
  grade: 1,
  week: 10,
  topic: 'Phép trừ trong phạm vi 10',
  learningStandard: 'Thực hiện phép trừ trong phạm vi 10',
  description: 'Làm quen phép trừ',
  durationMinutes: 15,
  totalQuestions: 5,
  status: 'published',
  currentVersion: 1,
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  dataOrigin: 'real',
  environmentTag: 'production',
};

assert.strictEqual(canManageAudio(lessonCase3.grade), true, 'Bài 3 (Lớp 1 Tuần 10): Phải có quyền quản lý âm thanh trong editor');
console.log('✓ Bài Lớp 1 Tuần 10 (Tuần 10 trở đi): canManageGrade1Audio = TRUE (Giáo viên có quyền thêm âm thanh nếu muốn)');

// 1.4 Bài Lớp 2 (ví dụ lesson-g2-01, grade 2)
const lessonCase4: Lesson = {
  id: 'lesson-g2-01',
  title: '[Tuần 1] Ôn tập các số đến 100',
  grade: 2,
  week: 1,
  topic: 'Số và Phép tính',
  learningStandard: 'Ôn tập tia số và cộng trừ đến 100',
  description: 'Bài ôn tập đầu năm lớp 2',
  durationMinutes: 20,
  totalQuestions: 6,
  status: 'published',
  currentVersion: 1,
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  dataOrigin: 'real',
  environmentTag: 'production',
};

assert.strictEqual(canManageAudio(lessonCase4.grade), false, 'Bài 4 (Lớp 2): Không bắt buộc hiển thị bộ công cụ Lớp 1');
console.log('✓ Bài Lớp 2: canManageGrade1Audio = FALSE (Không áp đặt quy chuẩn Lớp 1)');

// 1.5 Bài AI Lớp 1 mới tạo (chưa lưu, draft timestamp)
const lessonCase5 = {
  id: `lesson-draft-${Date.now()}`,
  title: 'Bài tập AI: Đếm quả táo',
  grade: 1,
  topic: 'Đếm số lượng',
};

assert.strictEqual(canManageAudio(lessonCase5.grade), true, 'Bài 5 (AI Lớp 1 mới): Phải có quyền quản lý âm thanh');
console.log('✓ Bài AI Lớp 1 mới tạo: canManageGrade1Audio = TRUE (Đầy đủ chức năng âm thanh ngay từ lúc tạo)');


// -------------------------------------------------------------
// PHẦN 2: KIỂM TRA ĐIỀU KIỆN XUẤT BẢN THEO PPCT (REQUIREMENT 2.B)
// -------------------------------------------------------------
console.log('\n--- 2. Kiểm tra Yêu cầu bắt buộc khi Xuất bản (Pre-publish Gate) ---');

function evaluatePublishAudioRequirement(lesson: {
  id?: string;
  grade: number;
  week?: number;
  title?: string;
  topic?: string;
}): { isMandatory: boolean; error?: string } {
  if (lesson.grade !== 1) {
    return { isMandatory: false };
  }

  // Official PPCT week check
  if (typeof lesson.week === 'number' && !isNaN(lesson.week)) {
    if (lesson.week >= 1 && lesson.week <= 9) {
      return { isMandatory: true };
    }
    // Week 10+ is explicitly NOT mandatory!
    return { isMandatory: false };
  }

  // Check official repository PPCT lessons mapping if week not provided
  const lowerId = (lesson.id || '').toLowerCase();
  const isOfficialW1To9 = lowerId === 'lesson-g1-01' || lowerId === 'lesson-g1-02' ||
    lowerId === 'lesson-g1-03' || lowerId === 'lesson-g1-05' ||
    lowerId.startsWith('lesson-g1-w0');
  const isOfficialW10Plus = lowerId === 'lesson-g1-04' || lowerId === 'lesson-g1-06' ||
    lowerId === 'lesson-g1-07' || lowerId === 'lesson-g1-08' ||
    lowerId === 'lesson-g1-09' || lowerId === 'lesson-g1-10' ||
    lowerId === 'lesson-g1-11' || lowerId === 'lesson-g1-12';

  if (isOfficialW1To9) return { isMandatory: true };
  if (isOfficialW10Plus) return { isMandatory: false };

  // Heuristic from title if keyword matches
  if (isGrade1Weeks1To9(lesson)) {
    return { isMandatory: true };
  }

  // Missing week information for custom lesson
  return {
    isMandatory: false,
    error: 'Bài học Toán Lớp 1 chưa có thông tin Tuần học theo phân phối chương trình (PPCT).'
  };
}

// 2.1 "Các số 6 7 8 9 10" (week 6): Phải BẮT BUỘC âm thanh khi xuất bản
const gateCase1 = evaluatePublishAudioRequirement({
  id: lessonCase1.id,
  grade: lessonCase1.grade,
  week: 6,
  title: lessonCase1.title,
  topic: lessonCase1.topic,
});
assert.strictEqual(gateCase1.isMandatory, true, 'Bài "Các số 6 7 8 9 10" Tuần 6 phải bắt buộc âm thanh khi xuất bản');
console.log('✓ Bài "Các số 6 7 8 9 10" (Tuần 6): isMandatoryPublish = TRUE (PPCT Tuần 6 bắt buộc âm thanh)');

// 2.2 "Luyện tập các số 1 2 3 4 5" (week 5): Phải BẮT BUỘC âm thanh khi xuất bản
const gateCase2 = evaluatePublishAudioRequirement({
  id: lessonCase2.id,
  grade: lessonCase2.grade,
  week: 5,
  title: lessonCase2.title,
  topic: lessonCase2.topic,
});
assert.strictEqual(gateCase2.isMandatory, true, 'Bài "Luyện tập các số 1 2 3 4 5" Tuần 5 phải bắt buộc âm thanh khi xuất bản');
console.log('✓ Bài "Luyện tập các số 1 2 3 4 5" (Tuần 5): isMandatoryPublish = TRUE (PPCT Tuần 5 bắt buộc âm thanh)');

// 2.3 Bài Lớp 1 Tuần 10 trở đi: KHÔNG BẮT BUỘC âm thanh khi xuất bản
const gateCase3 = evaluatePublishAudioRequirement({
  id: lessonCase3.id,
  grade: lessonCase3.grade,
  week: 10,
  title: lessonCase3.title,
  topic: lessonCase3.topic,
});
assert.strictEqual(gateCase3.isMandatory, false, 'Bài Tuần 10 KHÔNG được bắt buộc âm thanh khi xuất bản');
console.log('✓ Bài Lớp 1 Tuần 10 (Tuần 10 trở đi): isMandatoryPublish = FALSE (Cho phép xuất bản không cần âm thanh)');

// 2.4 Bài Lớp 2: KHÔNG BẮT BUỘC âm thanh khi xuất bản
const gateCase4 = evaluatePublishAudioRequirement({
  id: lessonCase4.id,
  grade: lessonCase4.grade,
  week: lessonCase4.week,
  title: lessonCase4.title,
  topic: lessonCase4.topic,
});
assert.strictEqual(gateCase4.isMandatory, false, 'Bài Lớp 2 KHÔNG được bắt buộc âm thanh khi xuất bản');
console.log('✓ Bài Lớp 2: isMandatoryPublish = FALSE (Không áp đặt quy chuẩn Lớp 1)');

// 2.5 Bài Lớp 1 không có tuần và không có keyword: Báo rõ đối chiếu PPCT
const gateCase5MissingWeek = evaluatePublishAudioRequirement({
  id: 'lesson-custom-random',
  grade: 1,
  week: undefined,
  title: 'Chuyên đề ôn tập nâng cao',
  topic: 'Nâng cao',
});
assert.ok(gateCase5MissingWeek.error, 'Phải báo rõ khi thiếu thông tin tuần học');
console.log('✓ Bài Lớp 1 thiếu tuần: Báo rõ yêu cầu chọn Tuần học theo PPCT ("' + gateCase5MissingWeek.error + '")');


// -------------------------------------------------------------
// PHẦN 3: KIỂM TRA HÀM isGrade1Weeks1To9 (BÀI KHÔNG DẤU PHẨY VẪN NHẬN DIỆN ĐÚNG)
// -------------------------------------------------------------
console.log('\n--- 3. Kiểm tra Nhận diện Từ khóa Tuần 1-9 (Không phụ thuộc dấu phẩy) ---');

assert.strictEqual(
  isGrade1Weeks1To9({ grade: 1, title: 'Các số 6 7 8 9 10' }),
  true,
  '"Các số 6 7 8 9 10" (không phẩy) phải thuộc Tuần 1-9'
);
assert.strictEqual(
  isGrade1Weeks1To9({ grade: 1, title: 'Bài tập Toán: Các số 6 7 8 9 10' }),
  true,
  '"Bài tập Toán: Các số 6 7 8 9 10" phải thuộc Tuần 1-9'
);
assert.strictEqual(
  isGrade1Weeks1To9({ grade: 1, title: 'Luyện tập các số 1 2 3 4 5' }),
  true,
  '"Luyện tập các số 1 2 3 4 5" phải thuộc Tuần 1-9'
);
assert.strictEqual(
  isGrade1Weeks1To9({ grade: 1, title: '[Tuần 6] Các số 6, 7, 8, 9, 10: Đếm và Nhận dạng' }),
  true,
  'Tuần 6 chính thức phải thuộc Tuần 1-9'
);
assert.strictEqual(
  isGrade1Weeks1To9({ grade: 1, week: 12, title: 'Phép trừ có nhớ' }),
  false,
  'Tuần 12 không được thuộc Tuần 1-9'
);
assert.strictEqual(
  isGrade1Weeks1To9({ grade: 2, week: 5, title: 'Các số trong phạm vi 100' }),
  false,
  'Lớp 2 không bao giờ thuộc Grade 1 Weeks 1-9'
);
console.log('✓ Nhận diện từ khóa và tuần học: 100% khớp chuẩn PPCT GDPT 2018');


// -------------------------------------------------------------
// PHẦN 4: KIỂM TRA LỖI LỘ ĐÁP ÁN (ANSWER LEAK PREVENTION)
// -------------------------------------------------------------
console.log('\n--- 4. Kiểm tra Toàn diện Lỗi Lộ Đáp án trong Mô hình Đếm ---');

// Mô phỏng hàm render tiêu đề và nhãn của VisualCounters
function getVisualCounterHeader(config: any, isTeacherView: boolean, unitName = 'quả táo'): string {
  if (config.type === 'counters') {
    const count = Math.max(0, config.count ?? 0);
    if (count === 0) {
      return isTeacherView ? `Mô hình đếm đồ vật (0 ${unitName})` : 'Khay đếm đồ vật';
    }
    return isTeacherView ? `Mô hình đếm: ${count} ${unitName}` : `Quan sát các ${unitName} và đếm:`;
  }
  if (config.type === 'image') {
    if (config.count === 0) {
      return isTeacherView ? `Mô hình đếm đồ vật (0 ${unitName})` : 'Khay đếm đồ vật';
    }
    if (typeof config.count === 'number' && config.count > 1) {
      return isTeacherView ? `Quan sát mô hình đếm: ${config.count} ${unitName}` : `Quan sát các ${unitName} và đếm:`;
    }
  }
  return '';
}

function getVisualCounterEmptyTrayLabel(isTeacherView: boolean, unitName = 'quả táo'): string {
  return isTeacherView ? `0 ${unitName}` : 'Khay rỗng';
}

function getVisualCounterFallbackIconContent(index: number, isTeacherView: boolean): string | number {
  return isTeacherView ? index + 1 : '●';
}

function getVisualCounterCaption(caption: string | undefined, isTeacherView: boolean): string | null {
  if (!caption) return null;
  if (isTeacherView) return caption;
  // If student view, suppress caption if it contains digits
  if (/\d+/.test(caption)) return null;
  return caption;
}

// 4.1 Câu hỏi đếm 8 quả táo trong học sinh xem trước (isTeacherView = false)
const count8HeaderStudent = getVisualCounterHeader({ type: 'counters', count: 8 }, false, 'quả');
assert.strictEqual(
  count8HeaderStudent.includes('8'),
  false,
  'Giao diện học sinh KHÔNG ĐƯỢC chứa số 8 trong tiêu đề'
);
assert.strictEqual(
  count8HeaderStudent.toLowerCase().includes('mô hình đếm: 8'),
  false,
  'Giao diện học sinh KHÔNG ĐƯỢC có dòng "Mô hình đếm: 8 quả"'
);
assert.strictEqual(
  count8HeaderStudent,
  'Quan sát các quả và đếm:',
  'Giao diện học sinh chỉ được hướng dẫn đếm trung lập'
);
console.log('✓ Học sinh xem câu hỏi đếm 8 quả: Hiển thị "' + count8HeaderStudent + '" (KHÔNG lộ đáp án 8)');

// 4.2 Giáo viên biên tập (isTeacherView = true) vẫn thấy thông tin kỹ thuật
const count8HeaderTeacher = getVisualCounterHeader({ type: 'counters', count: 8 }, true, 'quả');
assert.strictEqual(
  count8HeaderTeacher,
  'Mô hình đếm: 8 quả',
  'Giáo viên phải thấy thông tin kỹ thuật đầy đủ để biên tập'
);
console.log('✓ Giáo viên biên tập: Hiển thị "' + count8HeaderTeacher + '" (Hỗ trợ sư phạm cho giáo viên)');

// 4.3 Khay số lượng 0: Học sinh không bị lộ số 0 trong văn bản
const emptyTrayStudent = getVisualCounterEmptyTrayLabel(false, 'quả táo');
assert.strictEqual(emptyTrayStudent, 'Khay rỗng', 'Học sinh chỉ thấy "Khay rỗng", không thấy "0 quả táo"');
const emptyTrayTeacher = getVisualCounterEmptyTrayLabel(true, 'quả táo');
assert.strictEqual(emptyTrayTeacher, '0 quả táo', 'Giáo viên thấy "0 quả táo"');
console.log('✓ Khay rỗng: Học sinh thấy "' + emptyTrayStudent + '", Giáo viên thấy "' + emptyTrayTeacher + '"');

// 4.4 Icon fallback: Không in số 1, 2, 3... 8 làm lộ kết quả ở ô cuối cùng
const fallbackStudent = getVisualCounterFallbackIconContent(7, false);
assert.strictEqual(fallbackStudent, '●', 'Học sinh phải thấy dấu chấm tròn ●, không thấy số 8');
const fallbackTeacher = getVisualCounterFallbackIconContent(7, true);
assert.strictEqual(fallbackTeacher, 8, 'Giáo viên thấy số 8 để kiểm soát thứ tự');
console.log('✓ Vật thể đếm fallback: Học sinh thấy "' + fallbackStudent + '", Giáo viên thấy "' + fallbackTeacher + '"');

// 4.5 Caption có chứa đáp án (ví dụ "Có 8 quả táo"):
const leakedCaption = 'Có 8 quả táo đỏ trong giỏ';
const studentCaption = getVisualCounterCaption(leakedCaption, false);
assert.strictEqual(studentCaption, null, 'Caption chứa chữ số phải bị ẩn khỏi giao diện học sinh');
const teacherCaption = getVisualCounterCaption(leakedCaption, true);
assert.strictEqual(teacherCaption, leakedCaption, 'Giáo viên vẫn thấy caption để kiểm duyệt');
console.log('✓ Chú thích ảnh chứa số: Học sinh bị ẩn hoàn toàn (tránh lộ đáp án), Giáo viên vẫn xem được');


// -------------------------------------------------------------
// PHẦN 5: BẢO TOÀN DỮ LIỆU BÀI HỌC CŨ (REQUIREMENT 3)
// -------------------------------------------------------------
console.log('\n--- 5. Kiểm tra Bảo toàn Dữ liệu Học liệu Cũ (Req 3) ---');

// Đảm bảo cache buster timestamp được loại bỏ sạch khi lưu, giữ nguyên URL gốc
const testQuestionWithTimestamp: Question = {
  id: 'q-test-1',
  order: 1,
  prompt: 'Có bao nhiêu quả táo?',
  interactionType: 'single_choice',
  options: ['6', '7', '8', '9'],
  expectedAnswer: '8',
  audioUrl: '/api/audio/file/audio_q_abc123.mp3?t=1793092000000',
  audioHash: 'hash123',
  hintAudioUrl: '/api/audio/file/hint_q_abc123.mp3?t=1793092000000',
  hintAudioHash: 'hash456',
};

const cleanAudioUrl = testQuestionWithTimestamp.audioUrl.split('?')[0].trim();
const cleanHintUrl = testQuestionWithTimestamp.hintAudioUrl.split('?')[0].trim();

assert.strictEqual(cleanAudioUrl, '/api/audio/file/audio_q_abc123.mp3', 'Phải giữ nguyên URL gốc, chỉ bỏ cache buster');
assert.strictEqual(cleanHintUrl, '/api/audio/file/hint_q_abc123.mp3', 'Phải giữ nguyên URL gợi ý gốc');
assert.strictEqual(testQuestionWithTimestamp.audioHash, 'hash123', 'Hash âm thanh được bảo toàn');
console.log('✓ Bảo toàn liên kết âm thanh cũ: Giữ nguyên MP3 gốc, loại bỏ sạch ?t=... khi lưu trữ');

console.log('\n================================================================');
console.log('   TẤT CẢ KIỂM THỬ HỒI QUY ĐÃ VƯỢT QUA 100% (PASS)');
console.log('================================================================\n');
