import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('sync_cloud_media.ts', 'Đồng bộ tệp media lên Cloud Firestore');

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function syncToCloud() {
  const mediaLibPath = path.resolve('data/media_library.json');
  const mediaStorageDir = path.resolve('data/media_storage');

  if (!fs.existsSync(mediaLibPath)) {
    console.error('media_library.json not found!');
    return;
  }

  const items = JSON.parse(fs.readFileSync(mediaLibPath, 'utf8'));
  console.log(`Syncing ${items.length} media assets to Cloud Firestore...`);

  for (const item of items) {
    const filePath = path.join(mediaStorageDir, item.id);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} not found on disk, skipping...`);
      continue;
    }

    const buf = fs.readFileSync(filePath);
    const b64 = buf.toString('base64');
    const CHUNK_SIZE = 180 * 1024;
    const totalChunks = Math.ceil(b64.length / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = b64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await setDoc(doc(db, 'test', `media_bin_${item.id}_${i}`), {
          mediaId: item.id,
          chunkIndex: i,
          data: chunkData,
        });
      }
      await setDoc(doc(db, 'test', `media_meta_${item.id}`), {
        ...item,
        totalChunks,
      });
      console.log(`[CLOUD SYNC] Synced ${item.title} -> test/media_meta_${item.id}`);
    } catch (e: any) {
      console.warn(`[CLOUD SYNC WARNING] Failed syncing ${item.id}:`, e.message);
    }
  }

  try {
    const catalogRef = doc(db, 'test', 'media_catalog_index');
    await setDoc(catalogRef, {
      items,
      updatedAt: new Date().toISOString(),
    });
    console.log('=> Cloud master catalog index (media_catalog_index) updated successfully!');
  } catch (e: any) {
    console.warn('Failed updating media_catalog_index:', e.message);
  }
}

syncToCloud().then(() => {
  console.log('Finished cloud media sync.');
  process.exit(0);
}).catch((err) => {
  console.error('Cloud sync error:', err);
  process.exit(1);
});
