import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to compute standard CRC32
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Encode raw RGBA buffer into valid PNG
export function createPng(width: number, height: number, rgbaDrawFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  const scanlines: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = rgbaDrawFn(x, y);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    scanlines.push(row);
  }
  const rawData = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Test generating a sample 120x120 red apple icon
const samplePng = createPng(120, 120, (x, y) => {
  const dx = x - 60;
  const dy = y - 60;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 45) {
    // Red gradient
    const brightness = Math.max(0, 1 - dist / 50);
    return [220 + Math.floor(brightness * 35), 40, 40, 255];
  }
  // Stem
  if (x >= 58 && x <= 62 && y >= 10 && y <= 20) {
    return [110, 60, 20, 255];
  }
  // Leaf
  if (x >= 63 && x <= 78 && y >= 12 && y <= 24) {
    return [34, 160, 50, 255];
  }
  return [255, 255, 255, 0]; // Transparent background
});

console.log('Sample PNG generated! Byte length:', samplePng.length);
console.log('Magic bytes match:', samplePng.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
