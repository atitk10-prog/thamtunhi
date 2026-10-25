import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function auditLiveQuestions() {
  const [lSnap, vSnap] = await Promise.all([
    getDocs(collection(db, 'lessons')),
    getDocs(collection(db, 'lessonVersions'))
  ]);

  console.log(`Firestore has ${lSnap.size} lessons, ${vSnap.size} lessonVersions.`);
  const lessons = lSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const versions = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  let totalQuestions = 0;
  const matchQuestions: any[] = [];
  const counterQuestions: any[] = [];
  const frameQuestions: any[] = [];
  const dotQuestions: any[] = [];

  for (const v of versions) {
    const qs = v.questions || [];
    totalQuestions += qs.length;
    for (const q of qs) {
      if (q.interactionType === 'expression_match') {
        matchQuestions.push({
          versionId: v.id,
          lessonId: v.lessonId,
          order: q.order,
          prompt: q.prompt,
          pairs: q.pairs,
          visualConfig: q.visualConfig
        });
      }
      if (q.visualConfig) {
        const vc = q.visualConfig;
        if (vc.type === 'ten_frame' || vc.displayMode === 'five_frame' || vc.displayMode === 'ten_frame') {
          frameQuestions.push({
            versionId: v.id,
            lessonId: v.lessonId,
            order: q.order,
            prompt: q.prompt,
            visualConfig: vc
          });
        }
        if (vc.itemType === 'dots' || vc.itemType === 'dot' || vc.type === 'dots') {
          dotQuestions.push({
            versionId: v.id,
            lessonId: v.lessonId,
            order: q.order,
            prompt: q.prompt,
            itemType: vc.itemType,
            visualConfig: vc
          });
        }
        if (vc.type === 'counters' || vc.count !== undefined || vc.groups !== undefined) {
          counterQuestions.push({
            versionId: v.id,
            lessonId: v.lessonId,
            order: q.order,
            prompt: q.prompt,
            visualConfig: vc
          });
        }
      }
    }
  }

  console.log(`Total questions across all versions: ${totalQuestions}`);
  console.log(`Matching questions found: ${matchQuestions.length}`);
  console.log(`Ten-frame / Five-frame questions found: ${frameQuestions.length}`);
  console.log(`Dot questions found: ${dotQuestions.length}`);

  console.log('\n--- MATCHING QUESTIONS SAMPLE ---');
  matchQuestions.forEach(m => {
    console.log(`[${m.versionId} Q${m.order}] Prompt: "${m.prompt}"`);
    console.log('   Pairs:', JSON.stringify(m.pairs));
    if (m.visualConfig) console.log('   Visual:', JSON.stringify(m.visualConfig));
  });

  console.log('\n--- FRAME QUESTIONS ---');
  frameQuestions.forEach(f => {
    console.log(`[${f.versionId} Q${f.order}] Prompt: "${f.prompt}" | Config:`, JSON.stringify(f.visualConfig));
  });

  console.log('\n--- DOT QUESTIONS (checking if prompt asks for dots or other items) ---');
  dotQuestions.forEach(d => {
    console.log(`[${d.versionId} Q${d.order}] Prompt: "${d.prompt}" | ItemType: ${d.itemType}`);
  });
}

auditLiveQuestions().catch(console.error);
