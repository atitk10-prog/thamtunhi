import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const downloads = 'C:\\Users\\Hii\\Downloads';
const targetDir = path.resolve('public/assets/toan-nhi');

const zips = [
  'toan_nhi_do_vat_27.zip',
  'toan_nhi_hoc_tap_canhsac_33.zip',
  'toan_nhi_math_29_tich_hop.zip',
  'toan_nhi_tien_sgk_8.zip'
];

console.log('=== VERIFYING ASSET PACKAGES IN DOWNLOADS ===');
for (const z of zips) {
  const zipPath = path.join(downloads, z);
  const exists = fs.existsSync(zipPath);
  console.log(`- ${z}: ${exists ? 'EXISTS (' + (fs.statSync(zipPath).size / 1024).toFixed(1) + ' KB)' : 'NOT FOUND'}`);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Unzip each to a temp folder and inspect/copy missing files
const tempExtract = path.resolve('scratch/asset_extract');
if (!fs.existsSync(tempExtract)) {
  fs.mkdirSync(tempExtract, { recursive: true });
}

for (const z of zips) {
  const zipPath = path.join(downloads, z);
  if (!fs.existsSync(zipPath)) continue;
  const outFolder = path.join(tempExtract, path.basename(z, '.zip'));
  if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder, { recursive: true });
  }
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outFolder}' -Force"`);
    console.log(`✓ Extracted ${z} to ${outFolder}`);
  } catch (err: any) {
    console.error(`Failed to extract ${z}:`, err.message);
  }
}

// List all files in tempExtract recursively and copy into public/assets/toan-nhi
function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const extractedFiles = getFilesRecursively(tempExtract);
console.log(`\nTotal extracted files across all 4 packages: ${extractedFiles.length}`);

let copiedCount = 0;
let skippedCount = 0;

for (const f of extractedFiles) {
  const base = path.basename(f);
  // Skip hidden files, system files
  if (base.startsWith('.') || base.startsWith('__MACOSX')) continue;
  
  const destPath = path.join(targetDir, base);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(f, destPath);
    copiedCount++;
  } else {
    // If destination exists, verify size
    const srcSize = fs.statSync(f).size;
    const destSize = fs.statSync(destPath).size;
    if (srcSize !== destSize && srcSize > 0) {
      fs.copyFileSync(f, destPath);
      copiedCount++;
    } else {
      skippedCount++;
    }
  }
}

console.log(`Copied/Updated: ${copiedCount}, Already up to date: ${skippedCount}`);

// List current public/assets/toan-nhi
const finalFiles = fs.readdirSync(targetDir);
console.log(`Total items in public/assets/toan-nhi: ${finalFiles.length}`);

// Check specific requirements:
console.log('\n--- CHECKING VIETNAM MONEY ---');
const moneyFiles = finalFiles.filter(f => f.includes('money') || f.includes('tien'));
console.log('Money files found:', moneyFiles);

console.log('\n--- CHECKING CLOCKS ---');
const clockFiles = finalFiles.filter(f => f.includes('clock') || f.includes('dong-ho'));
console.log('Clock files count:', clockFiles.length);
console.log('Clock sample:', clockFiles.slice(0, 10));

console.log('\n--- CHECKING COUNTING STICKS ---');
const stickFiles = finalFiles.filter(f => f.includes('stick') || f.includes('que'));
console.log('Stick files found:', stickFiles);

console.log('\n--- CHECKING MANIFESTS ---');
const manifestFiles = finalFiles.filter(f => f.includes('manifest'));
console.log('Manifest files:', manifestFiles);
