import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'indigo-lotus-2nmq3',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2');

async function checkStudentIds() {
  const attSnap = await getDocs(collection(db, 'attempts'));
  const studentIds = new Set<string>();
  attSnap.docs.forEach(d => {
    studentIds.add(d.data().studentId);
  });
  console.log('Unique studentIds in attempts:', Array.from(studentIds).slice(0, 30));
}

checkStudentIds().then(() => process.exit(0)).catch(console.error);
