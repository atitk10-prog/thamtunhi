import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectAllMatchQuestions() {
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  console.log(`Inspecting ${versionsSnap.size} lesson versions...`);

  for (const docSnap of versionsSnap.docs) {
    const v = docSnap.data();
    for (const q of v.questions || []) {
      if (q.interactionType === 'expression_match') {
        console.log(`[${docSnap.id}] Order ${q.order}: Prompt="${q.prompt}"`);
        console.log('  Pairs:', JSON.stringify(q.pairs));
      }
    }
  }
}

inspectAllMatchQuestions().catch(console.error);
