import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function findAppleAndCarrotQuestions() {
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  versionsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    (data.questions || []).forEach((q: any, idx: number) => {
      const p = (q.prompt || '').toLowerCase();
      const cfg = JSON.stringify(q.visualConfig || {});
      const img = q.imageUrl || '';
      if (p.includes('táo') || p.includes('cà rốt') || cfg.includes('apple') || cfg.includes('carrot') || img.includes('apple') || img.includes('carrot')) {
        console.log(`\nVersion: ${docSnap.id} | Q${idx + 1}`);
        console.log(`  prompt: "${q.prompt}"`);
        console.log(`  type: ${q.interactionType}`);
        console.log(`  imageUrl: ${q.imageUrl}`);
        console.log(`  visualConfig:`, q.visualConfig);
        console.log(`  options:`, q.options);
        console.log(`  expectedAnswer:`, q.expectedAnswer);
      }
    });
  });
}

findAppleAndCarrotQuestions().then(() => process.exit(0)).catch(console.error);
