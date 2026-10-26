import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'indigo-lotus-2nmq3',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2');

async function checkUsers() {
  const userSnap = await getDocs(query(collection(db, 'users'), where('classId', '==', 'class-1b')));
  console.log('Students in class-1b:', userSnap.size);
  userSnap.docs.forEach(d => {
    const u = d.data();
    console.log(`[USER] docId: ${d.id} | id: ${u.id} | studentCode: ${u.studentCode} | name: ${u.displayName} | role: ${u.role}`);
  });
}

checkUsers().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
