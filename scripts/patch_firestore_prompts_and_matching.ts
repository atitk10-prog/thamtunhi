import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function cleanPrompt(p: string): string {
  if (!p) return p;
  let res = p;
  res = res.replace(/^\[ĐÃ SỬA BỞI GIÁO VIÊN\]\s*/i, '');
  res = res.replace(/^Khung\s*5\s*ô\s*:\s*Có mấy chấm tròn màu xanh đang có trong khung\?/i, 'Có mấy chấm tròn màu xanh?');
  res = res.replace(/^Khung\s*10\s*ô\s*:\s*Cần thêm mấy chấm tròn nữa để khung 10 ô được lấp đầy \(hiện có 8 chấm\)\?/i, 'Cần thêm mấy chấm tròn nữa để có tất cả 10 chấm tròn (hiện có 8 chấm)?');
  res = res.replace(/^Khung\s*10\s*ô\s*:\s*5 chấm đỏ và 4 chấm xanh\. Có tất cả mấy chấm tròn\?/i, '5 chấm đỏ và 4 chấm xanh. Có tất cả mấy chấm tròn?');
  res = res.replace(/^Khung\s*10\s*ô có 7 chấm tròn\. Gạch bớt đi 3 chấm tròn thì còn lại mấy chấm\?/i, 'Có 7 chấm tròn. Gạch bớt đi 3 chấm tròn thì còn lại mấy chấm?');
  res = res.replace(/^Khung\s*10\s*ô\s*:\s*Khung thứ nhất có 8 chấm đỏ,\s*khung thứ hai có 5 chấm xanh\.\s*Chuyển 2 chấm sang để đầy khung 10\.\s*Tổng cộng có bao nhiêu chấm\?/i, 'Nhóm thứ nhất có 8 chấm đỏ, nhóm thứ hai có 5 chấm xanh. Gộp 2 chấm sang để thành 10. Tổng cộng có bao nhiêu chấm tròn?');
  res = res.replace(/^Khung\s*10\s*ô\s*:\s*Có 1 khung đầy \(10 chấm\) và 2 chấm rời \(tổng là 12 chấm\)\.\s*Gạch bớt 7 chấm thì còn mấy chấm\?/i, 'Có 12 chấm tròn (gồm 1 chục và 2 chấm rời). Bớt đi 7 chấm tròn thì còn mấy chấm tròn?');
  res = res.replace(/^(?:Trong\s*)?khung\s*10\s*ô có đúng 7 chấm tròn màu đỏ\.\s*Đúng hay Sai\?/i, 'Có đúng 7 chấm tròn màu đỏ. Đúng hay Sai?');
  res = res.replace(/^Khung\s*(?:5|10)\s*ô\s*:\s*/i, '');
  return res.trim();
}

async function patchPromptsAndMatching() {
  const vSnap = await getDocs(collection(db, 'lessonVersions'));
  console.log(`Auditing ${vSnap.size} lessonVersions in Firestore...`);

  let updatedCount = 0;

  for (const vDoc of vSnap.docs) {
    const v = vDoc.data() as any;
    const questions = v.questions || [];
    let hasChanges = false;

    const newQuestions = questions.map((q: any) => {
      let qModified = false;
      let newPrompt = cleanPrompt(q.prompt);
      if (newPrompt !== q.prompt) {
        qModified = true;
      }

      let newPairs = q.pairs;
      if (q.interactionType === 'expression_match' && Array.isArray(q.pairs)) {
        newPairs = q.pairs.map((pair: any) => {
          // If pair has rich metadata, ensure clean label
          if (pair.left === '2 quả cam' || pair.left === '🍊 🍊 (Quả cam)') {
            qModified = true;
            return {
              ...pair,
              left: '🍊 🍊 (Quả cam)',
              label: 'Quả cam',
              count: 2,
              icon: 'orange',
              image: '/assets/images/standard/food_orange.png'
            };
          }
          if (pair.left === '5 bông hoa' || pair.left === '🌸 🌸 🌸 🌸 🌸 (Bông hoa)') {
            qModified = true;
            return {
              ...pair,
              left: '🌸 🌸 🌸 🌸 🌸 (Bông hoa)',
              label: 'Bông hoa',
              count: 5,
              icon: 'flower',
              image: '/assets/images/standard/nature_flower.png'
            };
          }
          if (pair.left === '1 chú thỏ' || pair.left === '🐰 (Chú thỏ)') {
            qModified = true;
            return {
              ...pair,
              left: '🐰 (Chú thỏ)',
              label: 'Chú thỏ',
              count: 1,
              icon: 'rabbit',
              image: '/assets/images/standard/animals_rabbit.png'
            };
          }
          return pair;
        });
      }

      if (qModified) {
        hasChanges = true;
        return {
          ...q,
          prompt: newPrompt,
          pairs: newPairs,
        };
      }
      return q;
    });

    if (hasChanges) {
      console.log(`Updating version: ${vDoc.id}`);
      // Sanitize undefined fields which Firestore rejects
      const sanitizedQuestions = JSON.parse(JSON.stringify(newQuestions));
      await updateDoc(doc(db, 'lessonVersions', vDoc.id), {
        questions: sanitizedQuestions,
        updatedAt: new Date().toISOString()
      });
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} lessonVersions in Firestore without breaking existing data.`);
}

patchPromptsAndMatching().catch(console.error);
