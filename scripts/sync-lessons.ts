import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

async function syncLessonVersionIds() {
  const cfgPath = path.resolve('./firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const backup = JSON.parse(fs.readFileSync('./backup/firestore-backup-latest.json', 'utf8'));
  const lessons = backup.lessons || [];

  console.log(`Setting currentVersionId on all ${lessons.length} lessons...`);
  for (const l of lessons) {
    const versionId = `version-${l._id}-v${l.currentVersion || 1}`;
    await updateDoc(doc(db, 'lessons', l._id), {
      currentVersionId: versionId,
      currentVersion: l.currentVersion || 1
    });
    console.log(`Updated lesson ${l._id} -> currentVersionId: ${versionId}`);
  }

  // Update lesson-g1-01 Q3 visualConfig to include both groups (4 stars and 2 stars)
  console.log('Updating lesson-g1-01-v1 Q3 visualConfig with dual-group comparison (4 stars and 2 stars)...');
  const v1DocRef = doc(db, 'lessonVersions', 'version-lesson-g1-01-v1');
  const v1Snap = await getDoc(v1DocRef);
  if (v1Snap.exists()) {
    const vData = v1Snap.data();
    const questions = vData.questions || [];
    const q3 = questions.find((q: any) => q.order === 3);
    if (q3) {
      q3.visualConfig = {
        type: 'comparison',
        leftCount: 4,
        rightCount: 2,
        iconName: 'star',
        leftLabel: '4 ngôi sao',
        rightLabel: '2 ngôi sao'
      };
      await updateDoc(v1DocRef, { questions });
      console.log('Successfully updated lesson-g1-01 Q3 visualConfig with dual group comparison!');
    }
  }

  console.log('Data synchronization completed safely!');
}

syncLessonVersionIds().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
