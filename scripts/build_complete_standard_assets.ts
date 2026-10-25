import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets/toan-nhi');

function getFileSize(filename: string): number {
  const p = path.join(assetsDir, filename);
  if (fs.existsSync(p)) return fs.statSync(p).size;
  return 1000;
}

// Generate the complete standardAssets.ts content
const fileHeader = `/**
 * THÁM TỬ TOÁN NHÍ - THƯ VIỆN ĐỒ HỌA CHUẨN TOÁN TIỂU HỌC LỚP 1–2
 * 
 * Quản lý danh mục đầy đủ các tài nguyên đồ họa chất lượng cao (PNG + SVG)
 * tại /assets/toan-nhi/ phục vụ chương trình Toán Kết Nối Tri Thức GDPT 2018.
 * 
 * Các nhóm:
 * 1. food: Trái cây và thực phẩm (15 ảnh)
 * 2. animals: Động vật (12 ảnh)
 * 3. school: Đồ dùng học tập & đồ chơi (10 ảnh)
 * 4. nature: Thiên nhiên (8 ảnh)
 * 5. counting_sticks: Que tính đơn & bó chục que tính (4 tài nguyên)
 * 6. geometry: Hình học phẳng & chấm tròn (9 tài nguyên)
 * 7. clock_time: Đồng hồ giờ đúng và giờ rưỡi (18 tài nguyên)
 * 8. money_measurement: Tiền tệ Việt Nam chuẩn SGK & Polymer (14 tài nguyên)
 * 9. backgrounds: Phông cảnh minh họa ngữ cảnh (5 ảnh)
 */

import { MediaCategory, MediaItem } from '../types';

export interface StandardAssetGroup {
  id: MediaCategory;
  label: string;
  icon: string;
  count: number;
  countable: boolean;
}

export const STANDARD_ASSET_GROUPS: StandardAssetGroup[] = [
  { id: 'food', label: 'Trái cây – Thực phẩm', icon: '🍎', count: 15, countable: true },
  { id: 'animals', label: 'Động vật', icon: '🐶', count: 12, countable: true },
  { id: 'school', label: 'Đồ dùng học tập', icon: '🎒', count: 10, countable: true },
  { id: 'nature', label: 'Thiên nhiên', icon: '🌿', count: 8, countable: true },
  { id: 'counting_sticks', label: 'Que tính', icon: '🥢', count: 4, countable: true },
  { id: 'geometry', label: 'Hình học', icon: '📐', count: 9, countable: true },
  { id: 'clock_time', label: 'Đồng hồ – Thời gian', icon: '⏰', count: 18, countable: false },
  { id: 'money_measurement', label: 'Tiền Việt Nam', icon: '💵', count: 14, countable: false },
  { id: 'backgrounds', label: 'Phông cảnh', icon: '🏞️', count: 5, countable: false },
];

export interface StandardAssetItem extends MediaItem {
  file: string;
  countable: boolean;
  isStandardAsset: true;
  denomination?: number;
  side?: 'front' | 'back';
  hour?: number;
  minute?: number;
}
`;

// Helper to format an asset item
function fmtAsset(item: any): string {
  const lines = ['  {'];
  for (const [k, v] of Object.entries(item)) {
    if (typeof v === 'string') {
      lines.push(`    ${k}: ${JSON.stringify(v)},`);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`    ${k}: ${v},`);
    } else if (Array.isArray(v)) {
      lines.push(`    ${k}: ${JSON.stringify(v)},`);
    }
  }
  lines.push('  },');
  return lines.join('\n');
}

// 1. Existing 60 assets (load from current standardAssets.ts or defined cleanly)
// Let's read current standardAssets.ts items
const currentContent = fs.readFileSync(path.resolve('src/lib/standardAssets.ts'), 'utf8');

// Match everything from `export const STANDARD_ASSETS: StandardAssetItem[] = [` to `// Map from iconName`
const matchAssets = currentContent.match(/export const STANDARD_ASSETS: StandardAssetItem\[\] = \[([\s\S]*?)\];\s*\/\/ Map from iconName/);
if (!matchAssets) {
  console.error('Could not match STANDARD_ASSETS array in current file!');
  process.exit(1);
}

const existing60Code = matchAssets[1].trim();

// Now define the new assets:
const newAssets: any[] = [
  // --- COUNTING STICKS PNG (2 items) ---
  {
    id: 'toan-nhi-counting-stick-single',
    file: 'counting-stick-single.png',
    title: 'Một que tính (PNG)',
    description: 'Hình que tính rời màu cam dùng trong bài tập đếm que tính và tách gộp số.',
    category: 'counting_sticks',
    mimeType: 'image/png',
    sizeBytes: getFileSize('counting-stick-single.png'),
    url: '/assets/toan-nhi/counting-stick-single.png',
    width: 64,
    height: 128,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Que tính', 'que tính rời', 'đơn vị'],
    aliases: ['que tính', 'que rời', 'stick'],
    countUnit: 'que',
    countable: true,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-counting-stick-bundle10',
    file: 'counting-stick-bundle10.png',
    title: 'Bó 1 chục que tính (PNG)',
    description: 'Bó mười que tính buộc dây đỏ dùng cho cấu trúc số có hai chữ số (1 chục = 10 đơn vị).',
    category: 'counting_sticks',
    mimeType: 'image/png',
    sizeBytes: getFileSize('counting-stick-bundle10.png'),
    url: '/assets/toan-nhi/counting-stick-bundle10.png',
    width: 128,
    height: 128,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Que tính', 'bó chục', '10 que tính'],
    aliases: ['bó que', 'bó chục', 'bundle10'],
    countUnit: 'bó',
    countable: true,
    isStandardAsset: true,
  },

  // --- GEOMETRY BLUE DOT (1 item) ---
  {
    id: 'toan-nhi-counting-dot-blue',
    file: 'counting-dot-blue.png',
    title: 'Chấm tròn xanh rời',
    description: 'Hình chấm tròn xanh rời cho hoạt động đếm vật thể trực quan không dùng khung cố định.',
    category: 'geometry',
    mimeType: 'image/png',
    sizeBytes: getFileSize('counting-dot-blue.png'),
    url: '/assets/toan-nhi/counting-dot-blue.png',
    width: 64,
    height: 64,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Hình học', 'chấm tròn', 'dot'],
    aliases: ['chấm tròn', 'chấm xanh', 'dot'],
    countUnit: 'chấm',
    countable: true,
    isStandardAsset: true,
  },

  // --- CLOCK FACES (17 items) ---
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => ({
    id: `toan-nhi-clock-${h}h`,
    file: `clock-${h}h.png`,
    title: `Đồng hồ ${h} giờ đúng`,
    description: `Hình mặt đồng hồ kim chỉ chính xác ${h} giờ đúng (kim dài chỉ số 12, kim ngắn chỉ số ${h}). Không in sẵn đáp án.`,
    category: 'clock_time',
    mimeType: 'image/png',
    sizeBytes: getFileSize(`clock-${h}h.png`),
    url: `/assets/toan-nhi/clock-${h}h.png`,
    width: 256,
    height: 256,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Đồng hồ', 'giờ đúng', `${h} giờ`],
    aliases: [`${h} giờ`, `đồng hồ ${h} giờ`, `clock-${h}h`],
    countUnit: 'chiếc',
    countable: false,
    hour: h,
    minute: 0,
    isStandardAsset: true,
  })),
  ...[
    { h: 1, file: 'clock-1h30.png', label: '1 giờ 30 phút (1 giờ rưỡi)' },
    { h: 3, file: 'clock-3h30.png', label: '3 giờ 30 phút (3 giờ rưỡi)' },
    { h: 6, file: 'clock-6h30.png', label: '6 giờ 30 phút (6 giờ rưỡi)' },
    { h: 9, file: 'clock-9h30.png', label: '9 giờ 30 phút (9 giờ rưỡi)' },
  ].map(item => ({
    id: `toan-nhi-clock-${item.h}h30`,
    file: item.file,
    title: `Đồng hồ ${item.label}`,
    description: `Hình đồng hồ kim chỉ chính xác ${item.label} (kim phút chỉ số 6, kim giờ ở giữa số ${item.h} và ${item.h + 1}). Không in sẵn đáp án.`,
    category: 'clock_time',
    mimeType: 'image/png',
    sizeBytes: getFileSize(item.file),
    url: `/assets/toan-nhi/${item.file}`,
    width: 256,
    height: 256,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Đồng hồ', 'giờ rưỡi', `${item.h} giờ 30`, `${item.h} giờ rưỡi`],
    aliases: [`${item.h} giờ 30`, `${item.h} giờ rưỡi`, `clock-${item.h}h30`],
    countUnit: 'chiếc',
    countable: false,
    hour: item.h,
    minute: 30,
    isStandardAsset: true,
  })),
  {
    id: 'toan-nhi-clock-face-blank-png',
    file: 'clock-face-blank.png',
    title: 'Mặt đồng hồ trống (PNG)',
    description: 'Mặt đồng hồ có đầy đủ 12 số không có kim dùng để vẽ kim giờ và kim phút.',
    category: 'clock_time',
    mimeType: 'image/png',
    sizeBytes: getFileSize('clock-face-blank.png'),
    url: '/assets/toan-nhi/clock-face-blank.png',
    width: 256,
    height: 256,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Đồng hồ', 'mặt đồng hồ trống'],
    aliases: ['mặt đồng hồ', 'clock blank'],
    countUnit: 'chiếc',
    countable: false,
    isStandardAsset: true,
  },

  // --- VIETNAM MONEY SGK (8 items: 100, 200, 500, 1000 front & back) ---
  {
    id: 'toan-nhi-money-100-front',
    file: 'money-100-front.png',
    title: 'Tờ 100 đồng (Mặt trước - SGK)',
    description: 'Tờ tiền 100 đồng Việt Nam mặt trước trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-100-front.png'),
    url: '/assets/toan-nhi/money-100-front.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '100 đồng', 'SGK', 'mặt trước'],
    aliases: ['100 đồng', '100đ', 'tiền 100'],
    countUnit: 'tờ',
    countable: true,
    denomination: 100,
    side: 'front',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-100-back',
    file: 'money-100-back.png',
    title: 'Tờ 100 đồng (Mặt sau - SGK)',
    description: 'Tờ tiền 100 đồng Việt Nam mặt sau trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-100-back.png'),
    url: '/assets/toan-nhi/money-100-back.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '100 đồng', 'SGK', 'mặt sau'],
    aliases: ['100 đồng mặt sau', '100đ sau'],
    countUnit: 'tờ',
    countable: false,
    denomination: 100,
    side: 'back',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-200-front',
    file: 'money-200-front.png',
    title: 'Tờ 200 đồng (Mặt trước - SGK)',
    description: 'Tờ tiền 200 đồng Việt Nam mặt trước trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-200-front.png'),
    url: '/assets/toan-nhi/money-200-front.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '200 đồng', 'SGK', 'mặt trước'],
    aliases: ['200 đồng', '200đ', 'tiền 200'],
    countUnit: 'tờ',
    countable: true,
    denomination: 200,
    side: 'front',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-200-back',
    file: 'money-200-back.png',
    title: 'Tờ 200 đồng (Mặt sau - SGK)',
    description: 'Tờ tiền 200 đồng Việt Nam mặt sau trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-200-back.png'),
    url: '/assets/toan-nhi/money-200-back.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '200 đồng', 'SGK', 'mặt sau'],
    aliases: ['200 đồng mặt sau', '200đ sau'],
    countUnit: 'tờ',
    countable: false,
    denomination: 200,
    side: 'back',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-500-front',
    file: 'money-500-front.png',
    title: 'Tờ 500 đồng (Mặt trước - SGK)',
    description: 'Tờ tiền 500 đồng Việt Nam mặt trước trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-500-front.png'),
    url: '/assets/toan-nhi/money-500-front.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '500 đồng', 'SGK', 'mặt trước'],
    aliases: ['500 đồng', '500đ', 'tiền 500'],
    countUnit: 'tờ',
    countable: true,
    denomination: 500,
    side: 'front',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-500-back',
    file: 'money-500-back.png',
    title: 'Tờ 500 đồng (Mặt sau - SGK)',
    description: 'Tờ tiền 500 đồng Việt Nam mặt sau trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-500-back.png'),
    url: '/assets/toan-nhi/money-500-back.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '500 đồng', 'SGK', 'mặt sau'],
    aliases: ['500 đồng mặt sau', '500đ sau'],
    countUnit: 'tờ',
    countable: false,
    denomination: 500,
    side: 'back',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-1000-front',
    file: 'money-1000-front.png',
    title: 'Tờ 1.000 đồng (Mặt trước - SGK)',
    description: 'Tờ tiền 1.000 đồng Việt Nam mặt trước trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-1000-front.png'),
    url: '/assets/toan-nhi/money-1000-front.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '1.000 đồng', '1000 đồng', 'SGK', 'mặt trước'],
    aliases: ['1000 đồng', '1.000 đồng', '1k', '1000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 1000,
    side: 'front',
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-1000-back',
    file: 'money-1000-back.png',
    title: 'Tờ 1.000 đồng (Mặt sau - SGK)',
    description: 'Tờ tiền 1.000 đồng Việt Nam mặt sau trích từ SGK Toán 2 chuẩn GDPT 2018.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-1000-back.png'),
    url: '/assets/toan-nhi/money-1000-back.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '1.000 đồng', '1000 đồng', 'SGK', 'mặt sau'],
    aliases: ['1000 đồng mặt sau', '1000đ sau'],
    countUnit: 'tờ',
    countable: false,
    denomination: 1000,
    side: 'back',
    isStandardAsset: true,
  },

  // --- POLYMER MONEY BILLS (6 items: 10k, 20k, 50k, 100k, 200k, 500k) ---
  {
    id: 'toan-nhi-money-10000',
    file: 'money-10000.png',
    title: 'Tờ tiền 10.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 10.000 đồng Việt Nam màu vàng nâu.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-10000.png'),
    url: '/assets/toan-nhi/money-10000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '10.000 đồng', '10000 đồng', 'polymer'],
    aliases: ['10.000 đồng', '10000 đồng', '10k', '10000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 10000,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-20000',
    file: 'money-20000.png',
    title: 'Tờ tiền 20.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 20.000 đồng Việt Nam màu xanh dương.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-20000.png'),
    url: '/assets/toan-nhi/money-20000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '20.000 đồng', '20000 đồng', 'polymer'],
    aliases: ['20.000 đồng', '20000 đồng', '20k', '20000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 20000,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-50000',
    file: 'money-50000.png',
    title: 'Tờ tiền 50.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 50.000 đồng Việt Nam màu hồng tím.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-50000.png'),
    url: '/assets/toan-nhi/money-50000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '50.000 đồng', '50000 đồng', 'polymer'],
    aliases: ['50.000 đồng', '50000 đồng', '50k', '50000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 50000,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-100000',
    file: 'money-100000.png',
    title: 'Tờ tiền 100.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 100.000 đồng Việt Nam màu xanh lá cây.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-100000.png'),
    url: '/assets/toan-nhi/money-100000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '100.000 đồng', '100000 đồng', 'polymer'],
    aliases: ['100.000 đồng', '100000 đồng', '100k', '100000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 100000,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-200000',
    file: 'money-200000.png',
    title: 'Tờ tiền 200.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 200.000 đồng Việt Nam màu đỏ cam.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-200000.png'),
    url: '/assets/toan-nhi/money-200000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '200.000 đồng', '200000 đồng', 'polymer'],
    aliases: ['200.000 đồng', '200000 đồng', '200k', '200000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 200000,
    isStandardAsset: true,
  },
  {
    id: 'toan-nhi-money-500000',
    file: 'money-500000.png',
    title: 'Tờ tiền 500.000 đồng (Polymer)',
    description: 'Tờ tiền polymer 500.000 đồng Việt Nam màu xanh lơ.',
    category: 'money_measurement',
    mimeType: 'image/png',
    sizeBytes: getFileSize('money-500000.png'),
    url: '/assets/toan-nhi/money-500000.png',
    width: 320,
    height: 160,
    uploadedBy: 'system',
    uploadedAt: '2026-10-25T00:00:00.000Z',
    tags: ['Tiền Việt Nam', '500.000 đồng', '500000 đồng', 'polymer'],
    aliases: ['500.000 đồng', '500000 đồng', '500k', '500000đ'],
    countUnit: 'tờ',
    countable: true,
    denomination: 500000,
    isStandardAsset: true,
  },
];

const newAssetsCode = newAssets.map(a => fmtAsset(a)).join('\n');

const fullAssetsArray = `export const STANDARD_ASSETS: StandardAssetItem[] = [\n${existing60Code}\n\n  // --- BỔ SUNG ĐỒ HỌA TOÁN TIỂU HỌC TÍCH HỢP (QUE TÍNH, ĐỒNG HỒ, TIỀN TỆ, HÌNH HỌC) ---\n${newAssetsCode}\n];`;

// Remaining helper functions and maps
const footerCode = `
// Map from iconName (e.g. apple, fish, bird) to StandardAssetItem
export const ICON_NAME_TO_ASSET: Record<string, string> = {
  apple: 'apple-red.png',
  orange: 'orange-fruit.png',
  banana: 'banana-yellow.png',
  pear: 'pear-green.png',
  watermelon: 'watermelon-slice.png',
  strawberry: 'strawberry-red.png',
  grapes: 'grapes-purple.png',
  carrot: 'carrot-orange.png',
  candy: 'candy-wrapped.png',
  cupcake: 'cupcake-small.png',
  bread: 'bread-loaf.png',
  egg: 'egg-white.png',
  tomato: 'tomato-red.png',
  peach: 'peach-pink.png',
  cookie: 'cookie-round.png',
  bird: 'bird-sparrow.png',
  fish: 'fish-gold.png',
  rabbit: 'rabbit-white.png',
  bunny: 'rabbit-white.png',
  cat: 'cat-orange.png',
  dog: 'dog-brown.png',
  chick: 'chick-yellow.png',
  duck: 'duck-yellow.png',
  butterfly: 'butterfly-blue.png',
  bee: 'bee-yellow.png',
  frog: 'frog-green.png',
  turtle: 'turtle-green.png',
  ladybug: 'ladybug-red.png',
  pencil: 'pencil-yellow.png',
  book: 'book-open.png',
  eraser: 'eraser-pink.png',
  backpack: 'backpack-blue.png',
  notebook: 'notebook-green.png',
  ruler: 'ruler-wood.png',
  crayon: 'crayon-box.png',
  football: 'football-soccer.png',
  ball: 'football-soccer.png',
  bell: 'school-bell.png',
  scissors: 'scissors-safe.png',
  flower: 'flower-red.png',
  leaf: 'leaf-green.png',
  tree: 'tree-small.png',
  mushroom: 'mushroom-red.png',
  cloud: 'cloud-white.png',
  star: 'star-gold.png',
  pinecone: 'pinecone-brown.png',
  sun: 'sun-bright.png',
  // Math & counting mappings
  stick: 'counting-stick-single.png',
  'counting-stick': 'counting-stick-single.png',
  bundle: 'counting-stick-bundle10.png',
  bundle10: 'counting-stick-bundle10.png',
  dot: 'counting-dot-blue.png',
  // Money
  money100: 'money-100-front.png',
  money200: 'money-200-front.png',
  money500: 'money-500-front.png',
  money1000: 'money-1000-front.png',
  money10k: 'money-10000.png',
  money20k: 'money-20000.png',
  money50k: 'money-50000.png',
  money100k: 'money-100000.png',
  money200k: 'money-200000.png',
  money500k: 'money-500000.png',
};

/**
 * Normalizes any image URL or file path to ensure safety and prevent 404:
 * - Converts Windows paths (C:\\...) to relative static URL
 * - Maps legacy media IDs (/api/media/file/media-fruit-apple-red) to /assets/toan-nhi/apple-red.png
 * - Guarantees clean /assets/toan-nhi/<filename>
 */
export function normalizeAssetUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const clean = rawUrl.trim();
  if (!clean) return undefined;

  // 1. Direct standard asset path
  if (clean.startsWith('/assets/toan-nhi/')) {
    return clean;
  }

  // 2. Relative file name (e.g. "apple-red.png")
  const matchedByFile = STANDARD_ASSETS.find((a) => a.file === clean);
  if (matchedByFile) {
    return matchedByFile.url;
  }

  // 3. Map legacy media IDs
  const legacyMap: Record<string, string> = {
    'media-fruit-apple-red': '/assets/toan-nhi/apple-red.png',
    'media-fruit-orange': '/assets/toan-nhi/orange-fruit.png',
    'media-fruit-banana': '/assets/toan-nhi/banana-yellow.png',
    'media-fruit-watermelon': '/assets/toan-nhi/watermelon-slice.png',
    'media-animal-goldfish': '/assets/toan-nhi/fish-gold.png',
    'media-animal-rabbit': '/assets/toan-nhi/rabbit-white.png',
    'media-animal-duck': '/assets/toan-nhi/duck-yellow.png',
    'media-item-backpack': '/assets/toan-nhi/backpack-blue.png',
    'media-item-ruler': '/assets/toan-nhi/ruler-wood.png',
    'media-frame-five': '/assets/toan-nhi/math-tenframe-empty.svg',
    'media-frame-ten': '/assets/toan-nhi/math-tenframe-empty.svg',
    'media-stick-single': '/assets/toan-nhi/counting-stick-single.png',
    'media-stick-bundle-10': '/assets/toan-nhi/counting-stick-bundle10.png',
    'media-geo-square': '/assets/toan-nhi/math-shape-square-red.svg',
    'media-geo-circle': '/assets/toan-nhi/math-shape-circle-blue.svg',
    'media-geo-triangle': '/assets/toan-nhi/math-shape-triangle-yellow.svg',
    'media-clock-8am': '/assets/toan-nhi/clock-8h.png',
  };

  for (const [legacyId, targetUrl] of Object.entries(legacyMap)) {
    if (clean.includes(legacyId)) {
      return targetUrl;
    }
  }

  // 4. Windows drive paths stripped
  if (clean.includes('toan-nhi') || clean.includes('toan_nhi')) {
    const filename = clean.split(/[/\\\\]/).pop();
    if (filename) {
      const found = STANDARD_ASSETS.find((a) => a.file === filename);
      if (found) return found.url;
    }
  }

  return clean;
}

/**
 * Find standard asset by URL, ID, or file name
 */
export function findStandardAsset(urlOrId?: string): StandardAssetItem | undefined {
  if (!urlOrId) return undefined;
  const norm = normalizeAssetUrl(urlOrId) || urlOrId;
  return STANDARD_ASSETS.find((a) => a.url === norm || a.id === urlOrId || a.file === urlOrId);
}

/**
 * Find standard asset by icon name (e.g. 'apple', 'fish', 'pencil')
 */
export function findStandardAssetByIcon(iconName?: string): StandardAssetItem | undefined {
  if (!iconName) return undefined;
  const lower = iconName.toLowerCase().trim();
  const file = ICON_NAME_TO_ASSET[lower];
  if (file) {
    return STANDARD_ASSETS.find((a) => a.file === file);
  }
  // Try direct match by file or aliases
  return STANDARD_ASSETS.find(
    (a) => a.file.includes(lower) || (a.aliases && a.aliases.includes(lower)) || a.id.includes(lower)
  );
}

/**
 * Search and filter standard assets
 */
export function searchStandardAssets(query = '', category = 'all'): StandardAssetItem[] {
  let list = [...STANDARD_ASSETS];

  if (category && category !== 'all') {
    let targetCat = category;
    if (category === 'fruits') targetCat = 'food';
    else if (category === 'items') targetCat = 'school';
    else if (category === 'counters_frames') targetCat = 'counting_sticks';
    else if (category === 'math') {
      list = list.filter((a) => ['counting_sticks', 'geometry', 'clock_time', 'money_measurement', 'math'].includes(a.category));
      targetCat = '';
    }

    if (targetCat) {
      list = list.filter((a) => a.category === targetCat);
    }
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((a) => {
      return (
        a.title.toLowerCase().includes(q) ||
        a.file.toLowerCase().includes(q) ||
        (Array.isArray(a.aliases) && a.aliases.some((alias) => alias.toLowerCase().includes(q))) ||
        (Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  return list;
}

/**
 * Returns accurate counting unit for a given asset (e.g. 'quả', 'con', 'chiếc', 'bông', 'chùm', 'hộp', 'tờ', 'que', 'bó')
 */
export function getAssetCountUnit(assetOrUrl?: string, fallback = 'vật thể'): string {
  if (!assetOrUrl) return fallback;
  const asset = findStandardAsset(assetOrUrl) || findStandardAssetByIcon(assetOrUrl);
  return asset?.countUnit || fallback;
}
`;

const completeFile = `${fileHeader}\n${fullAssetsArray}\n${footerCode}`;
fs.writeFileSync(path.resolve('src/lib/standardAssets.ts'), completeFile, 'utf8');
console.log('✓ SUCCESS: Updated src/lib/standardAssets.ts with full standard asset catalog!');
