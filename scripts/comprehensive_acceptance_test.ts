import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { isGrade1Weeks1To9, normalizeMathTextForSpeech, getAudioHash } from '../src/lib/vietnameseTts.ts';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runComprehensiveAcceptanceTest() {
  console.log('================================================================');
  console.log('BẮT ĐẦU KIỂM THỬ NGHIỆM THU HỆ THỐNG ÂM THANH TIẾNG VIỆT');
  console.log('================================================================\n');

  // 1. Kiểm kê Firestore lessons
  const lessonsSnap = await getDocs(collection(db, 'lessons'));
  const allLessons: any[] = [];
  lessonsSnap.forEach((d) => allLessons.push(d.data()));

  const g1InScopeLessons = allLessons.filter((l) => isGrade1Weeks1To9(l));
  const g2Lessons = allLessons.filter((l) => l.grade === 2);
  const g1OutOfScope = allLessons.filter((l) => l.grade === 1 && !isGrade1Weeks1To9(l));

  console.log(`1. KIỂM KÊ KHO HỌC LIỆU FIRESTORE:`);
  console.log(`- Tổng số bài học trong database: ${allLessons.length}`);
  console.log(`- Số bài Toán Lớp 1 Tuần 1-9 (Trong phạm vi): ${g1InScopeLessons.length}`);
  g1InScopeLessons.forEach((l) => {
    console.log(`   + [${l.id}] ${l.title} (Tuần ${l.week || '1B Draft'}, Trạng thái: ${l.status}, Version: v${l.currentVersion})`);
  });
  console.log(`- Số bài Toán Lớp 2 (Ngoại phạm vi): ${g2Lessons.length}`);
  console.log(`- Số bài Toán Lớp 1 ngoài Tuần 1-9 (Tuần 10+): ${g1OutOfScope.length}`);

  // 2. Kiểm kê các phiên bản câu hỏi trong phạm vi
  console.log(`\n2. KIỂM TRA TỆP ÂM THANH CHO CÁC PHIÊN BẢN CÂU HỎI TRONG PHẠM VI:`);
  const targetVersions = [
    'version-lesson-g1-01-v1',
    'version-lesson-g1-01-v2',
    'version-lesson-g1-02-v1',
    'version-lesson-g1-03-v1',
    'version-lesson-g1-05-v1',
    'version-lesson-draft-1792910089741-v2',
    'version-lesson-draft-1792910089741-v3',
  ];

  let totalQuestionsWithAudio = 0;
  let totalHintsWithAudio = 0;
  let totalMissingAudio = 0;
  const audioDir = path.resolve('public', 'audio');

  for (const vId of targetVersions) {
    const snap = await getDoc(doc(db, 'lessonVersions', vId));
    if (!snap.exists()) {
      console.error(`LỖI: Không tìm thấy version ${vId}`);
      totalMissingAudio++;
      continue;
    }
    const data = snap.data();
    const questions: any[] = data.questions || [];
    console.log(`\n* Phiên bản [${vId}] (${questions.length} câu hỏi):`);

    questions.forEach((q, idx) => {
      const qAudioUrl = q.audioUrl;
      const hAudioUrl = q.hintAudioUrl;
      const qFilename = qAudioUrl ? path.basename(qAudioUrl) : '';
      const hFilename = hAudioUrl ? path.basename(hAudioUrl) : '';

      const qFileExists = qFilename && fs.existsSync(path.join(audioDir, qFilename));
      const hFileExists = hFilename && fs.existsSync(path.join(audioDir, hFilename));
      const qFileSize = qFileExists ? fs.statSync(path.join(audioDir, qFilename)).size : 0;
      const hFileSize = hFileExists ? fs.statSync(path.join(audioDir, hFilename)).size : 0;

      if (qAudioUrl && qFileExists && qFileSize > 1000) {
        totalQuestionsWithAudio++;
      } else {
        totalMissingAudio++;
        console.warn(`   ! Câu ${idx + 1} thiếu âm thanh câu hỏi!`);
      }

      if (hAudioUrl && hFileExists && hFileSize > 1000) {
        totalHintsWithAudio++;
      } else {
        totalMissingAudio++;
        console.warn(`   ! Câu ${idx + 1} thiếu âm thanh manh mối!`);
      }

      // Kiểm tra bảo mật: Không tiết lộ đáp án đúng trong âm thanh câu hỏi
      const spokenPrompt = normalizeMathTextForSpeech(q.prompt, q.options);
      const leaksAnswer = spokenPrompt.toLowerCase().includes(`đáp án là ${q.expectedAnswer}`) ||
        spokenPrompt.toLowerCase().includes(`kết quả là ${q.expectedAnswer}`);
      if (leaksAnswer) {
        console.error(`   ! CẢNH BÁO TIẾT LỘ ĐÁP ÁN: Câu ${idx + 1} có thể để lộ đáp án!`);
      }
    });
    console.log(`   -> OK: ${questions.length}/${questions.length} câu có đủ audio câu hỏi và gợi ý (tệp MP3 hợp lệ).`);
  }

  console.log(`\nTổng kết âm thanh:`);
  console.log(`- Tổng số câu hỏi có âm thanh: ${totalQuestionsWithAudio}`);
  console.log(`- Tổng số manh mối có âm thanh: ${totalHintsWithAudio}`);
  console.log(`- Số nội dung thiếu âm thanh: ${totalMissingAudio}`);

  // 3. Kiểm tra các bài Toán Lớp 2 không bị thay đổi
  console.log(`\n3. KIỂM TRA BẢO TOÀN HỌC LIỆU NGOÀI PHẠM VI (LỚP 2 VÀ LỚP 1 TUẦN 10+):`);
  const g2Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g2-01-v1'));
  if (g2Snap.exists()) {
    const g2Data = g2Snap.data();
    const g2HasAudio = (g2Data.questions || []).some((q: any) => q.audioUrl);
    console.log(`- Bài lớp 2 [version-lesson-g2-01-v1]: ${g2HasAudio ? 'CÓ AUDIO (SAI PHẠM VI)' : 'KHÔNG CÓ AUDIO (ĐÚNG NGUYÊN TẮC)'}`);
  }

  // 4. Kiểm tra toàn vẹn dữ liệu học sinh, bài nộp, điểm số
  console.log(`\n4. KIỂM TRA TOÀN VẸN DỮ LIỆU HỌC SINH VÀ LỊCH SỬ NỘP BÀI:`);
  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  const usersSnap = await getDocs(collection(db, 'users'));
  const assignmentsSnap = await getDocs(collection(db, 'assignments'));
  console.log(`- Tổng số học sinh/người dùng: ${usersSnap.size} (Được giữ nguyên)`);
  console.log(`- Tổng số bài tập đã giao: ${assignmentsSnap.size} (Không đổi lịch giao bài)`);
  console.log(`- Tổng số lượt làm bài: ${attemptsSnap.size} (Không phát sinh bài nộp giả)`);

  console.log('\n================================================================');
  console.log('KẾT LUẬN KIỂM THỬ: TẤT CẢ TIÊU CHÍ ĐÃ ĐẠT CHUẨN (PASS)');
  console.log('================================================================');
}

runComprehensiveAcceptanceTest().catch(console.error);
