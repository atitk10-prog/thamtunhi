import fs from 'fs';
import path from 'path';

function checkMedia() {
  const libraryPath = path.resolve('./data/media_library.json');
  const media = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
  console.log(`=== KIỂM TOÁN TÍNH TOÀN VẸN THƯ VIỆN HÌNH ẢNH DÙNG CHUNG (${media.length} ẢNH) ===`);

  let validCount = 0;
  let zeroCount = 0;
  let missingCount = 0;

  for (const m of media) {
    const storagePath = path.resolve('./data/media_storage', m.id);
    const exists = fs.existsSync(storagePath);
    if (!exists) {
      console.error(`[THIẾU TỆP] ${m.id} (${m.filename}) - Không tìm thấy tệp trên đĩa: ${storagePath}`);
      missingCount++;
      continue;
    }
    const stat = fs.statSync(storagePath);
    if (stat.size === 0 || m.sizeBytes === 0) {
      console.error(`[ẢNH 0 KB] ${m.id} (${m.filename}) - Dung lượng 0 byte!`);
      zeroCount++;
      continue;
    }
    const buf = fs.readFileSync(storagePath);
    const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const isWebp = buf.length >= 12 && buf.toString('ascii', 8, 12) === 'WEBP';
    const isJpg = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8;

    if (!isPng && !isWebp && !isJpg) {
      console.error(`[SAI ĐỊNH DẠNG] ${m.id} (${m.filename}) - Không phải PNG/WebP/JPG hợp lệ`);
      continue;
    }

    validCount++;
    console.log(`[HỢP LỆ] ${m.id.padEnd(28)} | ${m.category.padEnd(14)} | ${stat.size.toString().padStart(5)} bytes | ${m.mimeType} | ${m.filename}`);
  }

  console.log(`\nKết quả: ${validCount} hợp lệ, ${zeroCount} ảnh 0 byte, ${missingCount} thiếu file.`);
  if (zeroCount > 0 || missingCount > 0) {
    process.exit(1);
  }
}

checkMedia();
