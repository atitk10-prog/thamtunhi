import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

interface MediaClassification {
  id: string;
  title: string;
  category: string;
  sizeBytes: number;
  diskExists: boolean;
  diskSize: number;
  cloudMetaExists: boolean;
  cloudBinExists: boolean;
  referencedByLessons: string[];
  status: 'ACTIVE_HEALTHY' | 'BROKEN_ORPHAN' | 'LOCAL_ONLY' | 'CORRUPTED';
}

async function classifyAllMedia() {
  console.log('=== PHÂN LOẠI TOÀN BỘ CÁC BẢN GHI HÌNH ẢNH TRONG HỆ THỐNG ===\n');

  // 1. Gather all unique IDs from:
  // a) local data/media_storage
  // b) local data/media_library.json
  // c) cloud test/media_catalog_index
  const allIds = new Set<string>();

  const mediaStorageDir = path.resolve('data/media_storage');
  if (fs.existsSync(mediaStorageDir)) {
    fs.readdirSync(mediaStorageDir).forEach(f => allIds.add(f));
  }

  const mediaLibPath = path.resolve('data/media_library.json');
  let localItems: any[] = [];
  if (fs.existsSync(mediaLibPath)) {
    localItems = JSON.parse(fs.readFileSync(mediaLibPath, 'utf8'));
    localItems.forEach(i => allIds.add(i.id));
  }

  const catSnap = await getDoc(doc(db, 'test', 'media_catalog_index'));
  let cloudItems: any[] = [];
  if (catSnap.exists() && Array.isArray(catSnap.data().items)) {
    cloudItems = catSnap.data().items;
    cloudItems.forEach(i => allIds.add(i.id));
  }

  // 2. Scan all lessonVersions for references
  const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
  const lessonRefMap = new Map<string, string[]>();
  versionsSnap.docs.forEach(d => {
    const questions = d.data().questions || [];
    questions.forEach((q: any) => {
      const url = q.visualConfig?.imageUrl || '';
      if (url.includes('/api/media/file/')) {
        const mId = url.split('/api/media/file/')[1]?.split('?')[0];
        if (mId) {
          const list = lessonRefMap.get(mId) || [];
          list.push(`${d.id} (Câu ${q.order || '?'})`);
          lessonRefMap.set(mId, list);
        }
      }
    });
  });

  // 3. Classify each ID
  const classifications: MediaClassification[] = [];

  for (const id of allIds) {
    const diskPath = path.join(mediaStorageDir, id);
    const diskExists = fs.existsSync(diskPath);
    let diskSize = 0;
    if (diskExists) {
      diskSize = fs.statSync(diskPath).size;
    }

    const cloudMetaSnap = await getDoc(doc(db, 'test', `media_meta_${id}`));
    const cloudBinSnap = await getDoc(doc(db, 'test', `media_bin_${id}_0`));
    const cloudMetaExists = cloudMetaSnap.exists();
    const cloudBinExists = cloudBinSnap.exists();

    const matchedMeta = cloudMetaExists
      ? cloudMetaSnap.data()
      : localItems.find(i => i.id === id) || { title: id, category: 'unknown', sizeBytes: diskSize };

    const refs = lessonRefMap.get(id) || [];

    let status: 'ACTIVE_HEALTHY' | 'BROKEN_ORPHAN' | 'LOCAL_ONLY' | 'CORRUPTED' = 'BROKEN_ORPHAN';
    if (cloudMetaExists && cloudBinExists && (matchedMeta.sizeBytes > 100 || diskSize > 100)) {
      status = 'ACTIVE_HEALTHY';
    } else if (diskExists && diskSize > 100 && (!cloudMetaExists || !cloudBinExists)) {
      status = 'LOCAL_ONLY';
    } else if (diskSize <= 100 && (!cloudBinExists || cloudMetaSnap.data()?.sizeBytes <= 100)) {
      status = 'BROKEN_ORPHAN';
    }

    classifications.push({
      id,
      title: matchedMeta.title || id,
      category: matchedMeta.category || 'unknown',
      sizeBytes: matchedMeta.sizeBytes || diskSize,
      diskExists,
      diskSize,
      cloudMetaExists,
      cloudBinExists,
      referencedByLessons: refs,
      status,
    });
  }

  // Summary
  console.log(`Tổng số mã định danh ảnh quét được: ${classifications.length}\n`);

  const healthy = classifications.filter(c => c.status === 'ACTIVE_HEALTHY');
  const broken = classifications.filter(c => c.status === 'BROKEN_ORPHAN');
  const localOnly = classifications.filter(c => c.status === 'LOCAL_ONLY');

  console.log(`1. NHÓM HOẠT ĐỘNG KHỎE MẠNH (ACTIVE_HEALTHY): ${healthy.length} ảnh`);
  healthy.forEach(c => {
    console.log(`   [OK] ${c.id.padEnd(28)} | ${c.category.padEnd(14)} | ${c.sizeBytes} bytes | ${c.title} (Cloud Bin: YES)`);
  });

  console.log(`\n2. NHÓM ẢNH HỎNG / DUMMY TEST CŨ (BROKEN_ORPHAN): ${broken.length} ảnh`);
  broken.forEach(c => {
    const isUsed = c.referencedByLessons.length > 0 ? `[ĐANG DÙNG BỞI: ${c.referencedByLessons.join(', ')}]` : '[KHÔNG DÙNG - MỒ CÔI]';
    console.log(`   [BROKEN] ${c.id.padEnd(32)} | disk: ${c.diskSize}B | cloudBin: ${c.cloudBinExists} | ${isUsed} | ${c.title}`);
  });

  if (localOnly.length > 0) {
    console.log(`\n3. NHÓM CHỈ CÓ Ở LOCAL (LOCAL_ONLY): ${localOnly.length} ảnh`);
    localOnly.forEach(c => {
      console.log(`   [LOCAL] ${c.id.padEnd(28)} | disk: ${c.diskSize}B | ${c.title}`);
    });
  }

  // Save report JSON
  fs.writeFileSync('./scripts/media_classification_result.json', JSON.stringify(classifications, null, 2), 'utf8');
  console.log('\n=> Đã lưu kết quả phân loại chi tiết vào scripts/media_classification_result.json');
}

classifyAllMedia().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
