import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets/toan-nhi');
const mathManifest = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_math.json'), 'utf8'));
const clocks = mathManifest.assets.filter((a: any) => a.group === 'clock_time');
console.log('Math manifest clocks count:', clocks.length);
for (const c of clocks) {
  const p = path.join(assetsDir, c.file);
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  console.log(`- ${c.file}: exists=${exists}, size=${size}B, time=${c.hour || 'blank'}h${c.minute ? c.minute : ''}`);
}

const sgkMoney = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_money_sgk.json'), 'utf8'));
console.log('\nSGK Money count:', sgkMoney.assets.length);
for (const m of sgkMoney.assets) {
  const p = path.join(assetsDir, m.file);
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  console.log(`- ${m.file}: exists=${exists}, size=${size}B, denom=${m.denomination}đ, side=${m.side}`);
}
