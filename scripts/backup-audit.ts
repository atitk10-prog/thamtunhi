import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function runAudit() {
  const cfgPath = path.resolve('./firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('Connecting to database:', firebaseConfig.firestoreDatabaseId);
  const collections = [
    'users', 'classes', 'academicYears', 'lessons', 
    'lessonVersions', 'assignments', 'attempts', 
    'attemptAnswers', 'mistakeInsights', 'auditLogs'
  ];

  const backupData: Record<string, any[]> = {};
  const stats: Record<string, number> = {};

  for (const colName of collections) {
    const snap = await getDocs(collection(db, colName));
    stats[colName] = snap.docs.length;
    backupData[colName] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  }

  console.log('\n=== COLLECTION COUNTS ===');
  console.table(stats);

  if (!fs.existsSync('./backup')) {
    fs.mkdirSync('./backup', { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `./backup/firestore-backup-${timestamp}.json`;
  const latestBackupFile = './backup/firestore-backup-latest.json';

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  fs.writeFileSync(latestBackupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log('Successfully written full backup to:');
  console.log('  ->', backupFile);
  console.log('  ->', latestBackupFile);

  // Inspect Lessons & LessonVersions relationship
  console.log('\n=== LESSONS VS LESSON VERSIONS AUDIT ===');
  const lessons = backupData['lessons'] || [];
  const versions = backupData['lessonVersions'] || [];

  console.log(`Total lessons: ${lessons.length}, Total versions: ${versions.length}`);

  let totalQuestionsCount = 0;
  for (const l of lessons) {
    const matchedVersions = versions.filter(v => 
      v.lessonId === l._id || 
      v._id === l.currentVersionId || 
      v._id === `version-${l._id}-v1` ||
      v._id === `version-${l._id}-v${l.currentVersion || 1}`
    );
    console.log(`Lesson [${l._id}] | Grade ${l.grade} | "${l.title?.slice(0, 35)}" | currVer: ${l.currentVersion} | currVerId: ${l.currentVersionId}`);
    if (matchedVersions.length === 0) {
      console.warn(`   ⚠️ WARNING: NO VERSIONS FOUND FOR LESSON ${l._id}!`);
    }
    for (const mv of matchedVersions) {
      const qCount = Array.isArray(mv.questions) ? mv.questions.length : 0;
      totalQuestionsCount += qCount;
      console.log(`   -> Version [${mv._id}]: ${qCount} questions | status: ${mv.status}`);
      if (Array.isArray(mv.questions)) {
        mv.questions.forEach((q: any, idx: number) => {
          if (idx < 2 || idx >= qCount - 1) {
            console.log(`      Q${q.order || idx + 1} [${q.interactionType}]: ${q.prompt?.slice(0, 40)}... (exp: ${q.expectedAnswer})`);
          }
        });
      }
    }
  }

  // Inspect classes vs users
  console.log('\n=== CLASSES VS USERS ROSTER AUDIT ===');
  const classes = backupData['classes'] || [];
  const users = backupData['users'] || [];

  for (const c of classes) {
    const studentsInClass = users.filter(u => u.role === 'student' && (u.classId === c._id || u.className === c.name));
    console.log(`Class [${c._id}] "${c.name}" | Grade ${c.grade} | Teacher: ${c.teacherId || 'None'} | Declared count: ${c.studentCount} | Real student count in DB: ${studentsInClass.length}`);
  }

  // Orphaned or anomaly check
  console.log('\n=== ANOMALY & ORPHAN CHECK ===');
  const assignments = backupData['assignments'] || [];
  for (const a of assignments) {
    const lExists = lessons.some(l => l._id === a.lessonId);
    const vExists = versions.some(v => v._id === a.lessonVersionId);
    const cExists = classes.some(c => c._id === a.classId);
    if (!lExists || !vExists || !cExists) {
      console.warn(`Assignment [${a._id}] has broken link: lesson=${lExists}, version=${vExists}, class=${cExists}`);
    }
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
