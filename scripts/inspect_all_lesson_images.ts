import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function inspectAllLessonImages() {
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  console.log('Total lesson versions in Firestore:', versionsSnap.size);

  const referencedImages = new Set<string>();
  const counterPrompts: Array<{ versionId: string; qIndex: number; prompt: string; imageUrl?: string; counterType?: string; count?: number }> = [];

  versionsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const questions = data.questions || [];
    questions.forEach((q: any, idx: number) => {
      if (q.imageUrl) referencedImages.add(q.imageUrl);
      if (q.illustrationUrl) referencedImages.add(q.illustrationUrl);
      if (q.pairs) {
        q.pairs.forEach((p: any) => {
          if (p.leftImageUrl) referencedImages.add(p.leftImageUrl);
          if (p.rightImageUrl) referencedImages.add(p.rightImageUrl);
        });
      }
      if (
        q.interactionType === 'counting_stick' ||
        q.interactionType === 'visual_counters' ||
        q.visualSupportType ||
        /đếm|táo|cà rốt|que tính|cam|bút|gà|vịt|kẹo|bánh/i.test(q.prompt || '')
      ) {
        counterPrompts.push({
          versionId: docSnap.id,
          qIndex: idx,
          prompt: q.prompt,
          imageUrl: q.imageUrl,
          counterType: q.visualSupportType || q.interactionType,
          count: q.counterCount || q.count || q.expectedAnswer,
        });
      }
    });
  });

  console.log('\n--- ALL REFERENCED IMAGES IN LESSON VERSIONS ---');
  Array.from(referencedImages).sort().forEach((img) => console.log('  ', img));

  console.log(`\n--- ALL COUNTING / VISUAL QUESTIONS (${counterPrompts.length}) ---`);
  counterPrompts.forEach((cp) => {
    console.log(`Version: ${cp.versionId} Q${cp.qIndex + 1} | prompt: "${cp.prompt}" | img: ${cp.imageUrl} | type: ${cp.counterType} | count: ${cp.count}`);
  });
}

inspectAllLessonImages().then(() => process.exit(0)).catch(console.error);
