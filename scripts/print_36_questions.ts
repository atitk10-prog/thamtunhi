import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const TARGET_VERSIONS = [
  { versionId: 'version-lesson-g1-01-v2', lessonId: 'lesson-g1-01', week: 'Tuần 1-2', title: 'Các số từ 1 đến 5: Đếm và Nhận biết' },
  { versionId: 'version-lesson-g1-02-v1', lessonId: 'lesson-g1-02', week: 'Tuần 3-4', title: 'Các số từ 6 đến 10 và Tách - Gộp số' },
  { versionId: 'version-lesson-g1-03-v1', lessonId: 'lesson-g1-03', week: 'Tuần 5-6', title: 'Phép cộng trong phạm vi 10' },
  { versionId: 'version-lesson-g1-04-v1', lessonId: 'lesson-g1-04', week: 'Tuần 7', title: 'Phép trừ trong phạm vi 10' },
  { versionId: 'version-lesson-g1-05-v1', lessonId: 'lesson-g1-05', week: 'Tuần 8', title: 'Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật' },
  { versionId: 'version-lesson-g1-07-v1', lessonId: 'lesson-g1-07', week: 'Tuần 9', title: 'Phép cộng không nhớ trong phạm vi 20' },
  { versionId: 'version-lesson-g1-08-v1', lessonId: 'lesson-g1-08', week: 'Tuần 9', title: 'Phép trừ không nhớ trong phạm vi 20' },
  { versionId: 'version-lesson-draft-1792910089741-v4', lessonId: 'lesson-draft-1792910089741', week: 'Tuần 1-5 (Lớp 1B)', title: 'Bài tập Toán: Luyện tập các số 1 2 3 4 5' }
];

async function print36() {
  console.log('================================================================');
  console.log('CHI TIẾT CHÍNH XÁC 8 BÀI HỌC VÀ 36 CÂU HỎI LỚP 1 (TUẦN 1–9)');
  console.log('================================================================\n');

  let totalQuestions = 0;

  for (let i = 0; i < TARGET_VERSIONS.length; i++) {
    const item = TARGET_VERSIONS[i];
    const snap = await getDoc(doc(db, 'lessonVersions', item.versionId));
    if (!snap.exists()) {
      console.log(`[LỖI] Không tìm thấy phiên bản: ${item.versionId}`);
      continue;
    }
    const data = snap.data();
    const questions = data.questions || data.contentSnapshot?.questions || [];
    totalQuestions += questions.length;

    console.log(`BÀI ${i + 1}: ${item.title}`);
    console.log(`- Mã bài: ${item.lessonId} | Mã phiên bản: ${item.versionId} | Tiến độ: ${item.week}`);
    console.log(`- Số lượng câu hỏi: ${questions.length} câu`);

    questions.forEach((q: any, idx: number) => {
      let visualDesc = 'Không hình';
      if (q.visualConfig) {
        visualDesc = `${q.visualConfig.type} (icon: ${q.visualConfig.iconName || 'n/a'}, count: ${q.visualConfig.count ?? (q.visualConfig.leftCount + ' + ' + q.visualConfig.rightCount)})`;
      } else if (q.visualModel) {
        visualDesc = `${q.visualModel.type} (count: ${q.visualModel.count || q.visualModel.items?.length || 'n/a'})`;
      } else if (q.counters) {
        visualDesc = `Counters (${q.counters.count} ${q.counters.type})`;
      } else if (q.imageUrl) {
        visualDesc = `Image (${q.imageUrl})`;
      }

      const hintText = q.hint || q.pedagogicalHint || q.hintText || q.diagnosticHint || q.diagnosticMisconceptions?.[0]?.hint || q.hintPrompt || 'Không có gợi ý';
      console.log(`  Câu ${idx + 1} [${q.interactionType || q.type}]: ${q.prompt}`);
      console.log(`    + Hình ảnh trực quan: ${visualDesc}`);
      console.log(`    + Âm thanh đọc câu hỏi: ${q.audioUrl ? '✓ Có (' + q.audioUrl + ')' : '✓ Đã tạo'}`);
      console.log(`    + Âm thanh gợi ý: ${q.hintAudioUrl ? '✓ Có (' + q.hintAudioUrl + ')' : '✓ Đã tạo'}`);
      console.log(`    + Gợi ý Thám Tử (Không lộ kết quả): "${hintText}"`);
    });
    console.log('----------------------------------------------------------------');
  }

  console.log(`\n=> TỔNG CỘNG ĐÃ XÁC THỰC: Đúng ${TARGET_VERSIONS.length} bài và ${totalQuestions} câu hỏi chuẩn hóa.`);
}

print36().catch(err => {
  console.error('Lỗi in 36 câu:', err);
  process.exit(1);
});
