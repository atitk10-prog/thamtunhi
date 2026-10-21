import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

interface LessonAuditRow {
  id: string;
  title: string;
  grade: number;
  publishedVersion: string;
  questionCount: number;
  interactionTypes: string[];
  visualTypes: string[];
  issues: string[];
  questions: any[];
}

async function auditCurriculum() {
  console.log('================================================================');
  console.log(' G2.1 – KIỂM TOÁN TOÀN BỘ KHO HỌC LIỆU VÀ PHIÊN BẢN CÂU HỎI');
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log('================================================================\n');

  // 1. Fetch all lessons
  const lessonsSnap = await getDocs(collection(db, 'lessons'));
  const lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`Tìm thấy ${lessons.length} bài học trong collection 'lessons'`);

  // Sort lessons by Grade then ID
  lessons.sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return a.id.localeCompare(b.id);
  });

  // 2. Fetch all lessonVersions
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  const versions = versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`Tìm thấy ${versions.length} bản ghi phiên bản trong collection 'lessonVersions'`);

  const versionMap = new Map<string, any>();
  versions.forEach(v => versionMap.set(v.id, v));

  const auditRows: LessonAuditRow[] = [];
  const mathIssues: string[] = [];

  for (const lesson of lessons) {
    const vId = lesson.currentVersionId || `version-${lesson.id}-v${lesson.currentVersion || 1}`;
    const version = versionMap.get(vId);

    const issues: string[] = [];
    if (!version) {
      issues.push(`KHÔNG TÌM THẤY BẢN GHI PHIÊN BẢN: ${vId}`);
    }

    const questions = version?.questions || [];
    if (questions.length !== 8) {
      issues.push(`Số câu không bằng 8 (hiện có: ${questions.length} câu)`);
    }

    const interactionTypes = Array.from(new Set(questions.map((q: any) => q.interactionType))) as string[];
    const visualTypes = Array.from(new Set(questions.map((q: any) => q.visualConfig?.type || 'none'))) as string[];

    // Detailed math audit for each question
    questions.forEach((q: any, qIdx: number) => {
      const qNum = q.order || (qIdx + 1);

      // Check prompt
      if (!q.prompt || !q.prompt.trim()) {
        issues.push(`Câu ${qNum}: thiếu đề bài (prompt rỗng)`);
      }

      // Check expectedAnswer
      if (!q.expectedAnswer || !q.expectedAnswer.trim()) {
        issues.push(`Câu ${qNum}: thiếu expectedAnswer`);
      }

      // Check single_choice
      if (q.interactionType === 'single_choice') {
        if (!q.options || q.options.length < 2) {
          issues.push(`Câu ${qNum} (single_choice): ít hơn 2 lựa chọn`);
        } else if (!q.options.includes(q.expectedAnswer)) {
          // Check if expectedAnswer matches any option (case / format)
          const trimmedOptions = q.options.map((o: string) => o.trim());
          if (!trimmedOptions.includes(q.expectedAnswer.trim())) {
            issues.push(`Câu ${qNum} (single_choice): expectedAnswer '${q.expectedAnswer}' không nằm trong options [${q.options.join(', ')}]`);
            mathIssues.push(`[${lesson.id} C${qNum}] Option mismatch: expected '${q.expectedAnswer}', options: [${q.options.join(', ')}]`);
          }
        }
      }

      // Check operator_pick
      if (q.interactionType === 'operator_pick') {
        if (!['>', '<', '=', '+', '-'].includes(q.expectedAnswer)) {
          issues.push(`Câu ${qNum} (operator_pick): expectedAnswer '${q.expectedAnswer}' không hợp lệ`);
        }
      }

      // Check expression_match
      if (q.interactionType === 'expression_match') {
        if (!q.pairs || q.pairs.length < 2) {
          issues.push(`Câu ${qNum} (expression_match): số cặp < 2`);
        }
        if (q.expectedAnswer !== 'MATCHED_ALL') {
          issues.push(`Câu ${qNum} (expression_match): expectedAnswer là '${q.expectedAnswer}' (nên là 'MATCHED_ALL')`);
        }
      }

      // Check visualConfig & prompt consistency
      // Issue: comparison 4 sao vs 2 sao
      if (q.visualConfig?.type === 'comparison' || (q.visualConfig?.leftCount !== undefined && q.visualConfig?.rightCount !== undefined)) {
        const left = q.visualConfig.leftCount ?? q.visualConfig.count;
        const right = q.visualConfig.rightCount;
        if (left !== undefined && right !== undefined) {
          let mathOp = '=';
          if (left > right) mathOp = '>';
          else if (left < right) mathOp = '<';

          if (q.interactionType === 'operator_pick' && q.expectedAnswer !== mathOp) {
            issues.push(`Câu ${qNum} (comparison): Left=${left}, Right=${right} nhưng expectedAnswer='${q.expectedAnswer}' (phải là '${mathOp}')`);
            mathIssues.push(`[${lesson.id} C${qNum}] COMPARISON INVERSION: Left=${left}, Right=${right}, expectedAnswer='${q.expectedAnswer}' vs actual '${mathOp}'`);
          }
        }
      }

      // Issue: Text asks for picture/counting but visualConfig is missing
      const promptLower = (q.prompt || '').toLowerCase();
      const needsImagePhrases = ['hình vẽ', 'quan sát hình', 'trong hình', 'bức tranh', 'nhìn hình', 'đếm số', 'hình bên'];
      const hasImagePhrase = needsImagePhrases.some(phrase => promptLower.includes(phrase));
      if (hasImagePhrase && !q.visualConfig) {
        issues.push(`Câu ${qNum}: Lời dẫn yêu cầu hình vẽ ("${promptLower.slice(0, 30)}...") nhưng visualConfig bị thiếu`);
        mathIssues.push(`[${lesson.id} C${qNum}] MISSING VISUAL: Prompt refers to image/diagram but visualConfig is undefined`);
      }
    });

    auditRows.push({
      id: lesson.id,
      title: lesson.title,
      grade: lesson.grade,
      publishedVersion: vId,
      questionCount: questions.length,
      interactionTypes,
      visualTypes,
      issues,
      questions
    });
  }

  // Print Summary Table
  console.log('\n--- BẢNG KIỂM KÊ 24 BÀI HỌC VÀ PHIÊN BẢN ---');
  console.log('| STT | Mã bài | Tên bài học | Lớp | Phiên bản | Số câu | Các dạng tương tác | Tình trạng |');
  console.log('|---|---|---|---|---|---|---|---|');
  auditRows.forEach((row, i) => {
    const status = row.issues.length === 0 ? 'CHUẨN 8/8' : `CÓ ${row.issues.length} LỖI`;
    console.log(`| ${i + 1} | ${row.id} | ${row.title} | Lớp ${row.grade} | ${row.publishedVersion} | ${row.questionCount} | ${row.interactionTypes.join(', ')} | ${status} |`);
  });

  console.log('\n--- CHI TIẾT CÁC VẤN ĐỀ / LỖI PHÁT HIỆN ---');
  let totalIssues = 0;
  auditRows.forEach(row => {
    if (row.issues.length > 0) {
      console.log(`\n[${row.id}] ${row.title} (Lớp ${row.grade}):`);
      row.issues.forEach(iss => {
        totalIssues++;
        console.log(`   - ⚠️ ${iss}`);
      });
    }
  });

  if (totalIssues === 0) {
    console.log('Tuyệt vời! Không phát hiện lỗi cấu trúc dữ liệu.');
  } else {
    console.log(`\nTổng số vấn đề phát hiện: ${totalIssues}`);
  }

  // Save audit data to JSON for deeper inspection
  fs.writeFileSync(
    path.resolve(__dirname, '..', 'audit_curriculum_result.json'),
    JSON.stringify({ auditRows, mathIssues, totalLessons: lessons.length, totalVersions: versions.length }, null, 2),
    'utf8'
  );
  console.log('\nĐã lưu kết quả chi tiết vào audit_curriculum_result.json');
}

auditCurriculum().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
