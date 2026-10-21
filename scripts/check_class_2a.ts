import { db } from '../src/lib/firebase.ts';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

async function check2a() {
  const d = await getDoc(doc(db, 'classes', 'class-2a'));
  console.log('Class 2A data:', d.data());
  const cData: any = d.data();
  if (cData && cData.teacherId !== 'teacher-2') {
    console.log(`Updating class-2a teacherId from ${cData.teacherId} to teacher-2...`);
    await updateDoc(doc(db, 'classes', 'class-2a'), {
      teacherId: 'teacher-2',
      teacherName: 'Thầy Quốc Huy',
      updatedAt: new Date().toISOString()
    });
    console.log('Updated class-2a successfully to teacher-2.');
  }
}
check2a();
