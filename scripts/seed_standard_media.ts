import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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

export function createPng(
  width: number,
  height: number,
  rgbaDrawFn: (x: number, y: number) => [number, number, number, number]
): Buffer {
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
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
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

interface SeedMediaDef {
  id: string;
  title: string;
  category: string;
  description: string;
  width: number;
  height: number;
  draw: (x: number, y: number) => [number, number, number, number];
}

const ASSET_DEFS: SeedMediaDef[] = [
  // 1. FRUITS
  {
    id: 'media-fruit-apple-red',
    title: 'Quả Táo Đỏ Mọng',
    category: 'fruits',
    description: 'Hình minh họa quả táo đỏ tươi dùng cho bài tập đếm và phép tính cộng trừ.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      const dx = x - 80;
      const dy = y - 85;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 55) {
        // Red apple with shading
        const shade = Math.max(0, 1 - dist / 60);
        return [220 + Math.floor(shade * 35), 35, 35, 255];
      }
      // Stem
      if (x >= 77 && x <= 83 && y >= 18 && y <= 32) return [120, 65, 25, 255];
      // Leaf
      if (x >= 84 && x <= 108 && y >= 20 && y <= 35) return [40, 175, 60, 255];
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-fruit-orange',
    title: 'Quả Cam Tươi Mọng',
    category: 'fruits',
    description: 'Hình minh họa quả cam mọng nước đếm số lượng lớp 1.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      const dx = x - 80;
      const dy = y - 85;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 54) {
        return [255, 145, 10, 255];
      }
      if (x >= 78 && x <= 82 && y >= 22 && y <= 32) return [110, 60, 20, 255];
      if (x >= 82 && x <= 102 && y >= 22 && y <= 36) return [30, 160, 45, 255];
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-fruit-banana',
    title: 'Quả Chuối Chín Vàng',
    category: 'fruits',
    description: 'Hình quả chuối chín vàng đếm số lượng bài toán GDPT 2018.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      // Crescent banana
      const dx = x - 75;
      const dy = y - 80;
      const curve = Math.pow(dx / 55, 2) + Math.pow(dy / 45, 2);
      if (curve <= 1.0 && (dx > -40 || dy > -20)) {
        return [250, 215, 25, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-fruit-watermelon',
    title: 'Miếng Dưa Hấu Đỏ',
    category: 'fruits',
    description: 'Hình miếng dưa hấu đỏ mát lành cho bé học toán phân số hoặc đếm hạt.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      // Semi circle
      const dx = x - 80;
      const dy = y - 75;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (y >= 75 && dist < 65) {
        if (dist > 56) return [40, 150, 50, 255]; // green rind
        if (dist > 50) return [240, 245, 230, 255]; // white layer
        return [235, 45, 55, 255]; // red pulp
      }
      return [0, 0, 0, 0];
    },
  },

  // 2. ANIMALS
  {
    id: 'media-animal-goldfish',
    title: 'Chú Cá Vàng Bơi Lội',
    category: 'animals',
    description: 'Hình chú cá vàng bơi lội sinh động cho bài toán đếm cá trong bể.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      const dx = (x - 70) / 45;
      const dy = (y - 80) / 32;
      // Body
      if (dx * dx + dy * dy <= 1) {
        // Eye
        if (Math.hypot(x - 48, y - 75) <= 5) return [25, 25, 25, 255];
        return [255, 120, 20, 255];
      }
      // Tail
      if (x >= 105 && x <= 145 && Math.abs(y - 80) <= (x - 105) * 0.7) {
        return [255, 150, 50, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-animal-rabbit',
    title: 'Chú Thỏ Trắng Dễ Thương',
    category: 'animals',
    description: 'Hình chú thỏ trắng dễ thương bài toán thỏ ăn cà rốt.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      // Head
      if (Math.hypot(x - 80, y - 95) <= 42) {
        // Eyes
        if (Math.hypot(x - 68, y - 92) <= 4 || Math.hypot(x - 92, y - 92) <= 4) return [30, 30, 30, 255];
        // Pink nose
        if (Math.hypot(x - 80, y - 105) <= 3) return [245, 120, 160, 255];
        return [250, 250, 252, 255];
      }
      // Left ear
      if (x >= 60 && x <= 74 && y >= 25 && y <= 65) return [245, 245, 248, 255];
      // Right ear
      if (x >= 86 && x <= 100 && y >= 25 && y <= 65) return [245, 245, 248, 255];
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-animal-duck',
    title: 'Chú Vịt Vàng Tinh Nghịch',
    category: 'animals',
    description: 'Hình chú vịt con màu vàng bài toán đếm đàn vịt bơi dưới ao.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      // Body
      if (Math.hypot((x - 85) / 40, (y - 95) / 32) <= 1) {
        return [255, 220, 30, 255];
      }
      // Head
      if (Math.hypot(x - 55, y - 65) <= 22) {
        // Eye
        if (Math.hypot(x - 50, y - 62) <= 3) return [20, 20, 20, 255];
        return [255, 225, 35, 255];
      }
      // Beak
      if (x >= 30 && x <= 45 && y >= 65 && y <= 75) return [255, 130, 20, 255];
      return [0, 0, 0, 0];
    },
  },

  // 3. ITEMS
  {
    id: 'media-item-backpack',
    title: 'Balo Học Sinh Tiểu Học',
    category: 'items',
    description: 'Hình chiếc balo đi học xinh xắn cho bài toán đồ dùng học tập.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      if (x >= 45 && x <= 115 && y >= 45 && y <= 135) {
        if (x >= 55 && x <= 105 && y >= 80 && y <= 125) return [255, 140, 30, 255]; // Pocket
        return [45, 130, 230, 255]; // Main body
      }
      if (x >= 65 && x <= 95 && y >= 32 && y <= 45) return [30, 90, 180, 255]; // Handle
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-item-ruler',
    title: 'Thước Kẻ Học Sinh 15cm',
    category: 'items',
    description: 'Thước kẻ thẳng chia vạch xăng-ti-mét bài toán đo độ dài lớp 1 và lớp 2.',
    width: 180,
    height: 90,
    draw: (x, y) => {
      if (x >= 15 && x <= 165 && y >= 30 && y <= 60) {
        // Ticks
        if (y <= 42 && (x - 20) % 10 === 0 && x >= 20 && x <= 160) {
          return [30, 30, 30, 255];
        }
        return [255, 215, 60, 255];
      }
      return [0, 0, 0, 0];
    },
  },

  // 4. COUNTERS & FRAMES
  {
    id: 'media-frame-five',
    title: 'Khung 5 Ô Chuẩn Trực Quan',
    category: 'counters_frames',
    description: 'Khung 5 ô chấm tròn chuẩn giáo cụ trực quan GDPT 2018.',
    width: 220,
    height: 90,
    draw: (x, y) => {
      // Outer border
      if (x >= 10 && x <= 210 && y >= 20 && y <= 70) {
        if (x <= 13 || x >= 207 || y <= 23 || y >= 67) return [14, 116, 144, 255];
        // Grid lines
        if (x % 40 >= 38 && x <= 200) return [14, 116, 144, 255];
        // 3 blue dots in cells 0, 1, 2
        for (let cell = 0; cell < 3; cell++) {
          const cx = 30 + cell * 40;
          const cy = 45;
          if (Math.hypot(x - cx, y - cy) <= 12) return [2, 132, 199, 255];
        }
        return [255, 255, 255, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-frame-ten',
    title: 'Khung 10 Ô Trực Quan GDPT 2018',
    category: 'counters_frames',
    description: 'Khung 10 ô (Ten-Frame) 2 hàng 5 cột minh họa số lượng và phép tính.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [30, 64, 175, 255];
        if (Math.abs(y - 60) <= 1) return [30, 64, 175, 255];
        if (x % 40 >= 38 && x <= 200) return [30, 64, 175, 255];

        // 7 filled red dots (5 on top row, 2 on bottom row)
        for (let i = 0; i < 7; i++) {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const cx = 30 + col * 40;
          const cy = row === 0 ? 38 : 82;
          if (Math.hypot(x - cx, y - cy) <= 13) return [225, 29, 72, 255];
        }
        return [255, 255, 255, 255];
      }
      return [0, 0, 0, 0];
    },
  },

  // 5. COUNTING STICKS
  {
    id: 'media-stick-single',
    title: 'Một Que Tính Rời',
    category: 'counting_sticks',
    description: 'Một que tính màu xanh lá minh họa hàng đơn vị.',
    width: 120,
    height: 160,
    draw: (x, y) => {
      if (x >= 54 && x <= 66 && y >= 15 && y <= 145) {
        return [34, 197, 94, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-stick-bundle-10',
    title: 'Bó 10 Que Tính (1 Chục)',
    category: 'counting_sticks',
    description: 'Bó 10 que tính buộc nơ đỏ minh họa 1 chục que tính.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      // Bundle of sticks
      if (x >= 40 && x <= 120 && y >= 20 && y <= 140) {
        // Red tie ribbon in center
        if (y >= 72 && y <= 88) return [220, 38, 38, 255];
        // Vertical stick lines
        if (x % 8 >= 6) return [180, 83, 9, 255];
        return [245, 158, 11, 255];
      }
      return [0, 0, 0, 0];
    },
  },

  // 6. GEOMETRY
  {
    id: 'media-geo-square',
    title: 'Hình Vuông Màu Xanh',
    category: 'geometry',
    description: 'Hình vuông phẳng có 4 cạnh bằng nhau và 4 góc vuông.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      if (x >= 30 && x <= 130 && y >= 30 && y <= 130) {
        if (x <= 34 || x >= 126 || y <= 34 || y >= 126) return [2, 132, 199, 255];
        return [56, 189, 248, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-geo-circle',
    title: 'Hình Tròn Màu Vàng Cam',
    category: 'geometry',
    description: 'Hình tròn phẳng khép kín dùng trong nhận biết hình học lớp 1.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      const dist = Math.hypot(x - 80, y - 80);
      if (dist <= 52) {
        if (dist >= 48) return [217, 119, 6, 255];
        return [251, 191, 36, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-geo-triangle',
    title: 'Hình Tam Giác Màu Đỏ',
    category: 'geometry',
    description: 'Hình tam giác có 3 cạnh và 3 đỉnh.',
    width: 160,
    height: 160,
    draw: (x, y) => {
      if (y >= 30 && y <= 130) {
        const halfWidth = ((y - 30) / 100) * 55;
        if (Math.abs(x - 80) <= halfWidth) {
          return [244, 63, 94, 255];
        }
      }
      return [0, 0, 0, 0];
    },
  },

  // 7. CLOCK TIME
  {
    id: 'media-clock-8am',
    title: 'Đồng Hồ Kim 8 Giờ Đúng',
    category: 'clock_time',
    description: 'Mặt đồng hồ kim chỉ 8 giờ đúng cho bài học xem giờ lớp 1-2.',
    width: 180,
    height: 180,
    draw: (x, y) => {
      const dist = Math.hypot(x - 90, y - 90);
      if (dist <= 75) {
        if (dist >= 70) return [14, 116, 144, 255]; // Border
        if (dist <= 4) return [220, 38, 38, 255]; // Center pin

        // Hour hand pointing to 8 (240 deg from 12)
        const angle8 = (240 - 90) * (Math.PI / 180);
        const hx = (x - 90);
        const hy = (y - 90);
        const projH = hx * Math.cos(angle8) + hy * Math.sin(angle8);
        const perpH = Math.abs(-hx * Math.sin(angle8) + hy * Math.cos(angle8));
        if (projH >= -5 && projH <= 40 && perpH <= 3) return [30, 41, 59, 255];

        // Minute hand pointing to 12 (0 deg from 12 = up)
        if (y <= 90 && y >= 32 && Math.abs(x - 90) <= 2) return [225, 29, 72, 255];

        return [255, 255, 255, 255];
      }
      return [0, 0, 0, 0];
    },
  },

  // 8. MONEY & MEASUREMENT (VIETNAM DONG VND - CHUẨN GDPT 2018)
  {
    id: 'media-money-1000',
    title: 'Tờ Tiền 1.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền 1.000 đồng Việt Nam màu vàng nâu nhạt.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [180, 83, 9, 255];
        // Star circle
        if (Math.hypot(x - 50, y - 60) <= 18) {
          if (Math.hypot(x - 50, y - 60) >= 16) return [180, 83, 9, 255];
          return [254, 243, 199, 255];
        }
        return [255, 251, 235, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-2000',
    title: 'Tờ Tiền 2.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền 2.000 đồng Việt Nam màu xám bạc / nâu sẫm.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [115, 115, 115, 255];
        if (Math.hypot(x - 50, y - 60) <= 18) {
          if (Math.hypot(x - 50, y - 60) >= 16) return [115, 115, 115, 255];
          return [245, 245, 245, 255];
        }
        return [245, 245, 244, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-5000',
    title: 'Tờ Tiền 5.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền 5.000 đồng Việt Nam màu xanh lam đậm.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [29, 78, 216, 255];
        if (Math.hypot(x - 50, y - 60) <= 18) {
          if (Math.hypot(x - 50, y - 60) >= 16) return [29, 78, 216, 255];
          return [239, 246, 255, 255];
        }
        return [239, 246, 255, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-10000',
    title: 'Tờ Tiền 10.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền polymer 10.000 đồng màu vàng nâu giàn khoan.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [161, 98, 7, 255];
        if (Math.hypot(x - 170, y - 60) <= 14) return [254, 240, 138, 255]; // Polymer clear window
        return [254, 252, 232, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-20000',
    title: 'Tờ Tiền 20.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền polymer 20.000 đồng màu xanh dương Chùa Cầu.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [3, 105, 161, 255];
        if (Math.hypot(x - 170, y - 60) <= 14) return [186, 230, 253, 255]; // Polymer clear window
        return [240, 249, 255, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-50000',
    title: 'Tờ Tiền 50.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền polymer 50.000 đồng màu hồng tím Nghênh Lương Đình.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [190, 24, 93, 255];
        if (Math.hypot(x - 170, y - 60) <= 14) return [251, 207, 232, 255]; // Polymer clear window
        return [253, 242, 248, 255];
      }
      return [0, 0, 0, 0];
    },
  },
  {
    id: 'media-money-100000',
    title: 'Tờ Tiền 100.000 Đồng (VNĐ)',
    category: 'money_measurement',
    description: 'Tờ tiền polymer 100.000 đồng màu xanh lá cây Văn Miếu.',
    width: 220,
    height: 120,
    draw: (x, y) => {
      if (x >= 10 && x <= 210 && y >= 15 && y <= 105) {
        if (x <= 13 || x >= 207 || y <= 18 || y >= 102) return [21, 128, 61, 255];
        if (Math.hypot(x - 170, y - 60) <= 14) return [187, 247, 208, 255]; // Polymer clear window
        return [240, 253, 244, 255];
      }
      return [0, 0, 0, 0];
    },
  },
];

async function seed() {
  const mediaStorageDir = path.resolve('data/media_storage');
  if (!fs.existsSync(mediaStorageDir)) {
    fs.mkdirSync(mediaStorageDir, { recursive: true });
  }

  const catalogItems: any[] = [];

  for (const def of ASSET_DEFS) {
    const pngBuf = createPng(def.width, def.height, def.draw);
    const filePath = path.join(mediaStorageDir, def.id);
    fs.writeFileSync(filePath, pngBuf);

    catalogItems.push({
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      mimeType: 'image/png',
      sizeBytes: pngBuf.length,
      url: `/api/media/file/${def.id}`,
      width: def.width,
      height: def.height,
      totalChunks: 1,
      uploadedBy: 'system',
      uploadedByName: 'Hệ thống Thám Tử Toán Nhí (Chuẩn GDPT 2018)',
      uploadedAt: '2026-10-24T12:00:00.000Z',
      dataOrigin: 'real',
      environmentTag: 'production',
    });

    console.log(`[SEED] Created ${def.title} (${pngBuf.length} bytes) -> ${def.id}`);
  }

  // Save to data/media_library.json
  const mediaLibPath = path.resolve('data/media_library.json');
  fs.writeFileSync(mediaLibPath, JSON.stringify(catalogItems, null, 2), 'utf8');
  console.log(`\n=> Successfully seeded ${catalogItems.length} educational media items into ${mediaLibPath}`);
}

seed().catch(console.error);
