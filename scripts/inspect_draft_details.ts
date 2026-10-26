import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const lSnap = await getDoc(doc(db, 'lessons', 'lesson-draft-1792910089741'));
  const v2Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-draft-1792910089741-v2'));
  const v3Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-draft-1792910089741-v3'));
  const asgSnap = await getDoc(doc(db, 'assignments', 'assign-lesson-draft-1792910089741-class-1b-122978'));

  const attSnap = await getDocs(query(collection(db, 'attempts'), where('assignmentId', '==', 'assign-lesson-draft-1792910089741-class-1b-122978')));
  const attempts = attSnap.docs.map(d => ({ id: d.id, lessonVersionId: d.data().lessonVersionId, studentId: d.data().studentId, score: d.data().score }));

  const out = {
    lesson: lSnap.data(),
    v2: v2Snap.data(),
    v3: v3Snap.data(),
    assignment: asgSnap.data(),
    attemptsCount: attempts.length,
    attemptsSample: attempts.slice(0, 5)
  };

  fs.writeFileSync('scripts/draft_inspection_output.json', JSON.stringify(out, null, 2));
  console.log('Inspection complete. Wrote scripts/draft_inspection_output.json. Attempts count:', attempts.length);
}

run().catch(console.error);
