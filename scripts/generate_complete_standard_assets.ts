import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets/toan-nhi');
const files = fs.readdirSync(assetsDir);

// Read manifests
const manifestBasic = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest.json'), 'utf8'));
const manifestMath = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_math.json'), 'utf8'));
const manifestMoneySgk = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_money_sgk.json'), 'utf8'));

console.log('--- MANIFEST ASSETS ---');
console.log('Basic groups:', manifestBasic.groups.length);
console.log('Math assets:', manifestMath.assets.length);
console.log('Money SGK assets:', manifestMoneySgk.assets.length);

// Audit all files in public/assets/toan-nhi
console.log('\n--- TOTAL FILES IN /assets/toan-nhi ---', files.length);

const unmanifested: string[] = [];
for (const f of files) {
  if (f.endsWith('.json') || f.endsWith('.md')) continue;
  let inManifest = false;
  for (const g of manifestBasic.groups) {
    if (g.items.some((it: any) => it.file === f)) inManifest = true;
  }
  if (manifestMath.assets.some((it: any) => it.file === f)) inManifest = true;
  if (manifestMoneySgk.assets.some((it: any) => it.file === f)) inManifest = true;
  if (!inManifest) unmanifested.push(f);
}

console.log('Files in directory not explicitly in the 3 manifests:', unmanifested);
