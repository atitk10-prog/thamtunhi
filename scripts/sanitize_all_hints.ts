import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { normalizeMathTextForSpeech, getAudioHash } from '../src/lib/vietnameseTts.ts';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Dictionary of improved pedagogical hints that never leak answer
const HINT_REPLACEMENTS: Record<string, string> = {
  // g1-01
  'Thêm vào là làm phép tính cộng: 2 + 1 = 3 nhé!':
    'Em hãy gộp số đồ vật ban đầu với số đồ vật thêm vào bằng phép tính cộng nhé!',

  // g1-02
  'Chim bay đi là phép trừ bớt đi: 7 - 2 = 5 chứ không phải 7 + 2 đâu nhé.':
    'Khi chim bay đi, số chim còn lại sẽ giảm đi. Em hãy dùng phép tính trừ để tìm số chim nhé!',

  // g1-03
  'Cần gộp cả hai loại bóng lại nên ta dùng phép cộng: 5 + 3 = 8.':
    'Muốn biết có tất cả bao nhiêu quả bóng, em hãy gộp số bóng đỏ với số bóng xanh bằng phép tính cộng nhé!',
  'Tính 4 + 2 = 6 trước. Vì 6 bé hơn 7 nên 6 < 7.':
    'Em hãy tính kết quả phép cộng ở vế trái trước, sau đó so sánh kết quả đó với số 7 nhé!',
  'Khung 10 ô chỉ còn thiếu 1 ô trống duy nhất, tức là có 9 chấm!':
    'Em hãy đếm tiếp từ 5 chấm đỏ thêm 4 chấm xanh, hoặc quan sát xem khung 10 ô còn thiếu mấy ô trống nhé!',
  '4 bông hoa thêm 4 bông hoa nữa: 4 + 4 = 8.':
    'Được tặng thêm tức là gộp lại để làm phép tính cộng. Em hãy lấy số hoa của Mai cộng với số hoa của Lan nhé!',

  // g1-04
  'Đây là phép trừ (-) bớt đi nhé, 9 - 4 = 5 chứ không phải cộng đâu.':
    'Đề bài yêu cầu bớt đi nên ta làm phép tính trừ (-). Em hãy đếm lùi từ 9 bớt đi 4 đơn vị nhé!',
  'Thỏ ăn mất tức là bớt đi: 8 - 3 = 5.':
    'Thỏ ăn mất cà rốt tức là số cà rốt bị giảm đi. Em hãy dùng phép tính trừ để tìm số cà rốt còn lại nhé!',
  'Lấy ra là phép trừ: 10 - 5 = 5.':
    'Lấy bớt ra đồ vật là phép tính trừ (-). Em hãy đếm lùi từ 10 bớt đi 5 nhé!',

  // g1-07
  'Cộng hàng đơn vị trước: 2 + 3 = 5, ghép với 1 chục là 15.':
    'Em hãy cộng các chữ số ở hàng đơn vị trước, sau đó giữ nguyên chữ số hàng chục nhé!',
  '13 + 2 = 15. 15 bé hơn 16 nên điền dấu <.':
    'Em hãy tính kết quả phép cộng ở vế trái trước, sau đó so sánh kết quả tìm được với 16 nhé!',
  '3 + 4 = 7 que lẻ, cùng 1 bó chục thành 17 que.':
    'Em hãy gộp các que tính rời ở hàng đơn vị trước, rồi gộp cùng bó chục nhé!',
  '12 + 5: 2 + 5 = 7, thêm 1 chục là 17.':
    'Em hãy cộng hàng đơn vị trước (lấy 2 cộng 5), sau đó giữ nguyên hàng chục nhé!',

  // g1-08
  '19 - 4 = 15, hai bên đều bằng 15 nên điền dấu =.':
    'Em hãy tính kết quả phép trừ ở vế trái trước, rồi so sánh với số ở vế phải nhé!',
  '9 - 5 = 4, thêm 1 chục là 14 bạn.':
    'Em hãy lấy chữ số hàng đơn vị trừ đi nhau trước, sau đó giữ nguyên chữ số 1 ở hàng chục nhé!',
  '18 lùi 6 bước: 8 - 6 = 2, còn 12.':
    'Em hãy trừ chữ số hàng đơn vị trước (8 trừ 6), rồi ghép với chữ số hàng chục nhé!',

  // g1-09
  '7 + 2 = 9 cm. 9 cm bé hơn 10 cm nên điền dấu <.':
    'Em hãy tính kết quả phép cộng có đơn vị xăng-ti-mét ở vế trái trước, rồi so sánh với vế phải nhé!',
  'Chú ý: Cục tẩy không bắt đầu từ 0 mà từ vạch 2 cm! Lấy 6 - 2 = 4 cm nhé.':
    'Chú ý quan sát kỹ điểm đầu và điểm cuối của cục tẩy trên thước kẻ để tính độ dài chính xác nhé!',
  'Muốn biết dài hơn bao nhiêu ta làm phép trừ: 12 - 7 = 5 cm.':
    'Muốn so sánh xem vật nào dài hơn bao nhiêu xăng-ti-mét, em hãy lấy độ dài lớn hơn trừ đi độ dài bé hơn nhé!',
  '14 - 4 = 10 cm.':
    'Cắt bớt đi một đoạn tức là làm phép tính trừ (-). Em hãy trừ độ dài đã cắt để tìm đoạn còn lại nhé!',
};

const TARGET_VERSIONS = [
  'version-lesson-g1-01-v1',
  'version-lesson-g1-01-v2',
  'version-lesson-g1-01-v2-draft',
  'version-lesson-g1-02-v1',
  'version-lesson-g1-02-v1-draft',
  'version-lesson-g1-03-v1',
  'version-lesson-g1-03-v1-draft',
  'version-lesson-g1-04-v1',
  'version-lesson-g1-07-v1',
  'version-lesson-g1-08-v1',
  'version-lesson-g1-09-v1',
  'version-lesson-draft-1792910089741-v4',
];

async function run() {
  console.log('--- RÀ SOÁT VÀ CHUẨN HÓA TOÀN BỘ GỢI Ý TUẦN 1–9 KHÔNG LỘ ĐÁP ÁN ---');

  for (const vId of TARGET_VERSIONS) {
    const vRef = doc(db, 'lessonVersions', vId);
    const snap = await getDoc(vRef);
    if (!snap.exists()) continue;

    const data = snap.data();
    let updated = false;

    const questions = (data.questions || []).map((q: any) => {
      let qUpdated = false;
      const ruleHints = (q.ruleHints || []).map((h: any) => {
        let text = h.hintText || '';
        // Check replacements
        for (const [leakKey, safeText] of Object.entries(HINT_REPLACEMENTS)) {
          if (text.includes(leakKey) || text.replace(/["']/g, '') === leakKey.replace(/["']/g, '')) {
            console.log(`[FIXED HINT] ${vId} Q${q.order}: "${text}" -> "${safeText}"`);
            text = safeText;
            qUpdated = true;
            updated = true;
            break;
          }
        }
        return { ...h, hintText: text };
      });

      if (qUpdated) {
        const spokenHint = ruleHints[0]?.hintText ? normalizeMathTextForSpeech(ruleHints[0].hintText) : '';
        const hHash = spokenHint ? getAudioHash(spokenHint) : undefined;
        return {
          ...q,
          ruleHints,
          hintAudioHash: hHash,
          hintAudioUrl: hHash ? `/audio/h_${hHash}.mp3` : undefined,
        };
      }
      return q;
    });

    if (updated) {
      await updateDoc(vRef, { questions });
      console.log(`[UPDATED] ${vId} thành công.`);
    }
  }

  console.log('--- HOÀN TẤT CHUẨN HÓA GỢI Ý ---');
}

run().catch(console.error);
