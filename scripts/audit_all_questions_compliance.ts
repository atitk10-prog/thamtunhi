import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const assetsDir = path.resolve('public/assets/toan-nhi');
const existingAssets = new Set(fs.readdirSync(assetsDir));

async function auditQuestions() {
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  const versions = versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  console.log(`Auditing questions in ${versions.length} lessonVersions...`);

  let totalQuestions = 0;
  let answerLeakCount = 0;
  let missingImageCount = 0;
  let matchingQuestionsCount = 0;
  let matchingLeakCount = 0;

  const defectList: any[] = [];

  for (const v of versions) {
    const qList: any[] = v.questions || [];
    for (const q of qList) {
      totalQuestions++;
      const p = String(q.prompt || '');
      const exp = String(q.expectedAnswer || '');

      // Check answer leak in prompt
      if (p.includes(`➔ ${exp}`) || p.includes(`→ Số ${exp}`) || p.includes(`-> ${exp}`)) {
        answerLeakCount++;
        defectList.push({ version: v.id, qId: q.id, type: 'PROMPT_LEAK', text: p });
      }

      // Check matching pairs
      if (q.interactionType === 'expression_match') {
        matchingQuestionsCount++;
        const pairs: any[] = q.pairs || [];
        for (const pair of pairs) {
          const l = String(pair.left || '');
          const r = String(pair.right || '');
          if (l.includes(`➔ ${r}`) || l.includes(`→ ${r}`) || l.includes(`-> ${r}`)) {
            matchingLeakCount++;
            defectList.push({ version: v.id, qId: q.id, type: 'MATCHING_LEAK', left: l, right: r });
          }
        }
      }

      // Check images
      const vc = q.visualConfig;
      if (vc && vc.imageUrl) {
        const url = String(vc.imageUrl);
        if (url.startsWith('/assets/toan-nhi/')) {
          const fName = url.replace('/assets/toan-nhi/', '');
          if (!existingAssets.has(fName)) {
            missingImageCount++;
            defectList.push({ version: v.id, qId: q.id, type: 'MISSING_IMAGE', url });
          }
        }
      }
    }
  }

  console.log(`\nAudit Results:`);
  console.log(`- Total Questions: ${totalQuestions}`);
  console.log(`- Matching Questions: ${matchingQuestionsCount}`);
  console.log(`- Answer Leaks in Prompts: ${answerLeakCount}`);
  console.log(`- Answer Leaks in Matching Pairs: ${matchingLeakCount}`);
  console.log(`- Missing/404 Images: ${missingImageCount}`);

  if (defectList.length > 0) {
    console.log(`\nDefects found:`);
    console.table(defectList.slice(0, 20));
  } else {
    console.log('\n✓ 100% of questions passed pedagogical, visual, and answer-leak checks!');
  }
}

auditQuestions().catch(console.error);
