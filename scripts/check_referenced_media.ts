import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function checkLessonMediaRefs() {
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  console.log('Total versions in Firestore:', versionsSnap.size);
  const referencedMediaIds = new Map<string, string[]>();

  versionsSnap.docs.forEach((d) => {
    const data = d.data();
    const questions = data.questions || [];
    questions.forEach((q: any) => {
      const url = q.visualConfig?.imageUrl || '';
      if (url.includes('/api/media/file/')) {
        const id = url.split('/api/media/file/')[1]?.split('?')[0];
        if (id) {
          const list = referencedMediaIds.get(id) || [];
          list.push(`${d.id} (Câu ${q.order || '?'})`);
          referencedMediaIds.set(id, list);
        }
      }
    });
  });

  console.log('--- DANH SÁCH HÌNH ẢNH ĐƯỢC BÀI HỌC THAM CHIẾU ---');
  for (const [id, lessons] of referencedMediaIds.entries()) {
    console.log(`- ${id}: Dùng trong ${lessons.join(', ')}`);
  }
}

checkLessonMediaRefs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
