import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function runBackup() {
  console.log('--- STARTING FINAL COMPREHENSIVE BACKUP ---');
  const cols = [
    'academicYears',
    'classes',
    'users',
    'assignments',
    'attempts',
    'lessons',
    'lessonVersions',
    'auditLogs'
  ];

  const backupData: Record<string, any> = {};
  for (const c of cols) {
    try {
      const snap = await getDocs(collection(db, c));
      backupData[c] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      console.log(`- Collection [${c}]: ${backupData[c].length} documents`);
    } catch (err: any) {
      console.warn(`- Collection [${c}] skip/error:`, err.message);
    }
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const catSnap = await getDoc(doc(db, 'test', 'media_catalog_index'));
    if (catSnap.exists()) {
      backupData['media_catalog_index'] = catSnap.data();
      console.log('- test/media_catalog_index backed up');
    }
  } catch (err: any) {
    console.warn('- media_catalog_index error:', err.message);
  }

  const backupDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-final-mission-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✓ COMPREHENSIVE BACKUP SAVED: ${backupFile}`);
}

runBackup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
