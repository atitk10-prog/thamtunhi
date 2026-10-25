import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkLinkage() {
  const [attSnap, assSnap, lesSnap, verSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'lessons')),
    getDocs(collection(db, 'lessonVersions')),
  ]);

  const attempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignments = assSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const lessons = lesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const versions = verSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  const assMap = new Map<string, any>(assignments.map(a => [a.id, a]));
  const lesMap = new Map<string, any>(lessons.map(l => [l.id, l]));
  const verMap = new Map<string, any>(versions.map(v => [v.id, v]));

  console.log(`Loaded: ${attempts.length} attempts, ${assignments.length} assignments, ${lessons.length} lessons, ${versions.length} versions`);

  let missingLessonIdCount = 0;
  let canResolveFromAssignment = 0;
  let canResolveFromVersion = 0;
  let unresolvable = 0;

  const fixPlan: Array<{ attemptId: string; lessonId: string; source: string }> = [];

  for (const att of attempts) {
    if (!att.lessonId) {
      missingLessonIdCount++;
      const ass = assMap.get(att.assignmentId);
      if (ass && ass.lessonId) {
        canResolveFromAssignment++;
        fixPlan.push({ attemptId: att.id, lessonId: ass.lessonId, source: `assignment (${att.assignmentId})` });
        continue;
      }
      const ver = verMap.get(att.lessonVersionId);
      if (ver && ver.lessonId) {
        canResolveFromVersion++;
        fixPlan.push({ attemptId: att.id, lessonId: ver.lessonId, source: `version (${att.lessonVersionId})` });
        continue;
      }
      // Check if assignmentId contains lessonId (e.g. att-assign-lesson-draft-1792910089741...)
      if (att.assignmentId && att.assignmentId.includes('lesson-')) {
        const match = att.assignmentId.match(/lesson-[a-z0-9-]+/);
        if (match) {
          fixPlan.push({ attemptId: att.id, lessonId: match[0], source: `assignmentId-regex (${match[0]})` });
          continue;
        }
      }
      unresolvable++;
      console.log(`Unresolvable attempt: ${att.id}, assId: ${att.assignmentId}, verId: ${att.lessonVersionId}`);
    }
  }

  console.log(`\nMissing lessonId: ${missingLessonIdCount}`);
  console.log(`Resolvable from assignment: ${canResolveFromAssignment}`);
  console.log(`Resolvable from version: ${canResolveFromVersion}`);
  console.log(`Total that can be linked: ${fixPlan.length}`);
  console.log(`Unresolvable: ${unresolvable}`);

  console.log('\nSample fix plan (first 10):');
  console.table(fixPlan.slice(0, 10));

  // If there are attempts to link, perform safe non-destructive updateDoc to backfill lessonId
  if (fixPlan.length > 0) {
    console.log(`\nBackfilling lessonId for ${fixPlan.length} attempts...`);
    let updated = 0;
    for (const item of fixPlan) {
      await updateDoc(doc(db, 'attempts', item.attemptId), {
        lessonId: item.lessonId,
      });
      updated++;
    }
    console.log(`✓ Successfully backfilled lessonId for ${updated} attempts!`);
  }
}

checkLinkage().catch(console.error);
