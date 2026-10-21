import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'e2e', 'screenshots');
const destDir = 'C:\\Users\\Hii\\.gemini\\antigravity-ide\\brain\\83a02fed-551d-4543-b0f7-1f29bdd00dda';

const files = [
  'teacher-01-desktop-classes.png',
  'teacher-02-desktop-roster-1a.png',
  'teacher-03-desktop-student-detail-modal.png',
  'teacher-04-desktop-lock-modal.png',
  'teacher-05-desktop-empty-state.png',
  'teacher-06-tablet-roster-1a.png',
  'teacher-07-mobile-roster-1a.png',
];

for (const f of files) {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${f} to artifact directory.`);
  } else {
    console.warn(`File ${src} does not exist.`);
  }
}
