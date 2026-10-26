import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function main() {
  console.log('=== INVENTORY GRADE 1 LESSONS (WEEKS 1-9) FROM REAL FIRESTORE ===');
  
  // 1. All lessons in firestore
  const lessonsSnap = await getDocs(collection(db, 'lessons'));
  const allLessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  console.log(`Total lessons in Firestore: ${allLessons.length}`);
  
  // 2. Filter Grade 1 lessons
  const g1Lessons = allLessons.filter(l => l.grade === 1);
  console.log(`Total Grade 1 lessons in Firestore: ${g1Lessons.length}\n`);

  // 3. For each Grade 1 lesson, fetch its current version to get week and questions
  const g1Weeks1to9 = [];
  const g1Outside = [];
  const g1Drafts = [];

  for (const l of g1Lessons) {
    const vId = l.currentVersionId || (l.currentVersion ? `version-${l.id}-v${l.currentVersion}` : null);
    let vData: any = null;
    if (vId) {
      const vSnap = await getDoc(doc(db, 'lessonVersions', vId));
      if (vSnap.exists()) {
        vData = vSnap.data();
      }
    }
    
    // Also check draft version if present
    let draftVData: any = null;
    if (l.draftVersionId) {
      const dvSnap = await getDoc(doc(db, 'lessonVersions', l.draftVersionId));
      if (dvSnap.exists()) {
        draftVData = dvSnap.data();
      }
    }

    const week = l.week ?? vData?.week ?? (l.title.match(/Tuần\s*(\d+)/i) ? parseInt(l.title.match(/Tuần\s*(\d+)/i)[1], 10) : undefined);
    const questions = vData?.questions || draftVData?.questions || [];

    const info = {
      id: l.id,
      title: l.title,
      week,
      status: l.status,
      currentVersion: l.currentVersion,
      currentVersionId: vId,
      draftVersionId: l.draftVersionId,
      questionCount: questions.length,
      questions: questions.map((q: any) => ({
        id: q.id,
        order: q.order,
        prompt: q.prompt,
        expectedAnswer: q.expectedAnswer,
        ruleHints: q.ruleHints,
        interactionType: q.interactionType,
        hasAudio: !!q.audioUrl
      }))
    };

    if (week !== undefined && week >= 1 && week <= 9) {
      g1Weeks1to9.push(info);
    } else {
      g1Outside.push(info);
    }
  }

  console.log(`=== GRADE 1, WEEKS 1-9 LESSONS FOUND (${g1Weeks1to9.length}) ===`);
  g1Weeks1to9.forEach((l, idx) => {
    console.log(`${idx + 1}. [${l.id}] (Tuần ${l.week}) "${l.title}" - Status: ${l.status} - Questions: ${l.questionCount}`);
  });

  console.log(`\n=== GRADE 1, OUTSIDE WEEKS 1-9 OR UNDEFINED WEEK (${g1Outside.length}) ===`);
  g1Outside.forEach((l, idx) => {
    console.log(`${idx + 1}. [${l.id}] (Tuần: ${l.week}) "${l.title}" - Status: ${l.status} - Questions: ${l.questionCount}`);
  });

  // 4. Assignments for Class 1B / Ha Thi Xuan Nuong
  console.log('\n=== ASSIGNMENTS FOR CLASS 1B / HA THI XUAN NUONG ===');
  const aSnap = await getDocs(collection(db, 'assignments'));
  const class1bAssignments = aSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(a => a.classId === 'class-1b');

  class1bAssignments.forEach((a, idx) => {
    console.log(`${idx + 1}. [${a.id}] "${a.title}" - Lesson: ${a.lessonId} - Status: ${a.status}`);
  });

  fs.writeFileSync('./scripts/inventory_g1_w1_w9_result.json', JSON.stringify({
    g1Weeks1to9,
    g1Outside,
    class1bAssignments
  }, null, 2));

  console.log('\nWrote details to ./scripts/inventory_g1_w1_w9_result.json');
}

main().catch(console.error);
