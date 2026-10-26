import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const TARGET_VERSIONS = [
  'version-lesson-g1-01-v1',
  'version-lesson-g1-01-v2',
  'version-lesson-g1-02-v1',
  'version-lesson-g1-03-v1',
  'version-lesson-g1-05-v1',
  'version-lesson-draft-1792910089741-v2',
  'version-lesson-draft-1792910089741-v3',
  'version-lesson-draft-1792910089741-v4',
];

async function auditAllInScopeLessons() {
  const auditReport: any[] = [];

  for (const vId of TARGET_VERSIONS) {
    const snap = await getDoc(doc(db, 'lessonVersions', vId));
    if (!snap.exists()) continue;
    const data = snap.data();
    const questions: any[] = data.questions || [];

    const vReport: any = {
      versionId: vId,
      title: data.title,
      grade: data.grade,
      topic: data.topic,
      questionCount: questions.length,
      questions: [],
    };

    questions.forEach((q, idx) => {
      const issues: string[] = [];
      const prompt = q.prompt || '';
      const expAns = String(q.expectedAnswer ?? '').trim();
      const options = q.options || [];
      const vc = q.visualConfig || {};
      const hint = q.ruleHints && q.ruleHints[0] ? q.ruleHints[0].hintText : '';

      // Check 1: Single choice has expectedAnswer in options
      if (q.interactionType === 'single_choice' && options.length > 0) {
        if (!options.map((o: any) => String(o).trim()).includes(expAns)) {
          issues.push(`Đáp án đúng '${expAns}' không nằm trong các lựa chọn [${options.join(', ')}]`);
        }
      }

      // Check 2: Hint leaks answer directly
      if (hint) {
        const hintLower = hint.toLowerCase();
        if (
          hintLower.includes(`đáp án là ${expAns.toLowerCase()}`) ||
          hintLower.includes(`kết quả là ${expAns.toLowerCase()}`) ||
          hintLower.includes(`= ${expAns}`) ||
          hintLower.includes(`bằng ${expAns}`) ||
          hintLower.includes(`chọn ${expAns}`)
        ) {
          issues.push(`Manh mối có nguy cơ làm lộ đáp án: "${hint}" (đáp án: ${expAns})`);
        }
      }

      // Check 3: Visual consistency
      if (vc.type === 'counters' && vc.count !== undefined) {
        const numAns = parseInt(expAns, 10);
        if (!isNaN(numAns) && numAns !== vc.count && prompt.toLowerCase().includes('đếm')) {
          issues.push(`Số lượng hình (${vc.count}) không khớp với đáp án đếm (${numAns})`);
        }
      }

      if (vc.type === 'addition') {
        const sum = (vc.leftCount || 0) + (vc.rightCount || 0);
        const numAns = parseInt(expAns, 10);
        if (!isNaN(numAns) && numAns !== sum) {
          issues.push(`Hình phép cộng (${vc.leftCount} + ${vc.rightCount} = ${sum}) không khớp đáp án (${numAns})`);
        }
      }

      vReport.questions.push({
        index: idx + 1,
        id: q.id,
        prompt,
        expectedAnswer: expAns,
        options,
        visualConfig: vc,
        hint,
        issues,
      });
    });

    auditReport.push(vReport);
  }

  fs.writeFileSync('scripts/in_scope_audit_report.json', JSON.stringify(auditReport, null, 2));
  console.log('Audited all in-scope lessons. Written to scripts/in_scope_audit_report.json');
}

auditAllInScopeLessons().catch(console.error);
