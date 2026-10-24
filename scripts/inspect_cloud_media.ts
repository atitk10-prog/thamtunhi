import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function inspectCloudMedia() {
  const catSnap = await getDoc(doc(db, 'test', 'media_catalog_index'));
  if (catSnap.exists()) {
    const items = catSnap.data().items || [];
    console.log('Total items in cloud catalog index:', items.length);
    for (const it of items) {
      const metaSnap = await getDoc(doc(db, 'test', 'media_meta_' + it.id));
      const bin0Snap = await getDoc(doc(db, 'test', 'media_bin_' + it.id + '_0'));
      console.log(it.id, '| metaExists:', metaSnap.exists(), '| binExists:', bin0Snap.exists(), '| size:', it.sizeBytes, '| mime:', it.mimeType, '| title:', it.title);
    }
  } else {
    console.log('media_catalog_index does not exist in Firestore!');
  }
}

inspectCloudMedia().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
