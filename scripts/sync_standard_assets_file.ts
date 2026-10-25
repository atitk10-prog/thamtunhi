import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets/toan-nhi');
const mathManifest = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_math.json'), 'utf8'));
const sgkMoneyManifest = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest_money_sgk.json'), 'utf8'));
const basicManifest = JSON.parse(fs.readFileSync(path.join(assetsDir, 'assets_manifest.json'), 'utf8'));

// Read existing standardAssets.ts to preserve existing 60 items perfectly
const existingContent = fs.readFileSync(path.resolve('src/lib/standardAssets.ts'), 'utf8');

console.log('Math assets count:', mathManifest.assets.length);
console.log('SGK Money count:', sgkMoneyManifest.assets.length);
console.log('Basic groups count:', basicManifest.groups.length);
