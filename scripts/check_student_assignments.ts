import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'indigo-lotus-2nmq3',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2');

async function check() {
  const assignSnap = await getDocs(query(collection(db, 'assignments'), where('classId', 'in', ['class-1b', 'class-2a'])));
  console.log('Total assignments for 1B and 2A:', assignSnap.size);
  const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  for (const a of assignments) {
    console.log(`[ASSIGN] ${a.id} | ${a.classId} | ${a.title} | lessonId: ${a.lessonId} | assignedAt: ${a.assignedAt || a.createdAt}`);
  }

  const attSnap = await getDocs(collection(db, 'attempts'));
  console.log('\nTotal attempts in DB:', attSnap.size);
  const allAtts = attSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  const hs1bAtts = allAtts.filter((a: any) => a.studentId === 'hs1b01' || a.studentId === 'student-hs1b01');
  console.log('Attempts for hs1b01 / student-hs1b01:', hs1bAtts.length);
  for (const at of hs1bAtts) {
    console.log(`  att: ${at.id} | assignId: ${at.assignmentId} | lessonId: ${at.lessonId} | status: ${at.status} | score: ${at.score} | completedAt: ${at.completedAt}`);
  }
}

check().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
