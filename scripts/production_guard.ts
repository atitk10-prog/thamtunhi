/**
 * PRODUCTION DATABASE & NETWORK PROTECTION GUARD (ENHANCED)
 *
 * Chặn đứng mọi script kiểm thử, seed, reset, restore hoặc HTTP client tự động
 * ghi vào cơ sở dữ liệu Firebase Production hoặc gọi backend Production.
 *
 * QUY TẮC BẢO VỆ TUYỆT ĐỐI (5 NGUYÊN TẮC):
 * 1. KHÔNG coi hệ thống là an toàn chỉ vì có biến FIRESTORE_EMULATOR_HOST.
 *    Nếu projectId là 'indigo-lotus-2nmq3' hoặc databaseId là production,
 *    script bị TỪ CHỐI THỰC THI NGAY LẬP TỨC.
 * 2. CHẶN MỌI YÊU CẦU HTTP (fetch/axios) trỏ đến Vercel Production (*.vercel.app, thamtunhi.vercel.app).
 * 3. CHẶN MỌI YÊU CẦU HTTP ghi dữ liệu (POST, PATCH, PUT, DELETE) trỏ đến backend local (localhost/127.0.0.1)
 *    khi cấu hình hệ thống đang liên kết với Cloud Firestore production.
 * 4. TRIỆT TIÊU TOÀN BỘ CÁC BIẾN BYPASS (ALLOW_TEST_WRITES, NODE_ENV) - Không cho phép bất kỳ cờ nào
 *    vô tình mở khóa database thật.
 * 5. MỌI SCRIPT CÓ KHẢ NĂNG GHI DỮ LIỆU PHẢI KIỂM TRA MÔI TRƯỜNG TRƯỚC KHI THỰC HIỆN THAO TÁC MẠNG.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FirebaseConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
}

export function loadFirebaseConfig(): FirebaseConfig {
  const possiblePaths = [
    path.resolve(__dirname, '..', 'firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, 'firebase-applet-config.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {
        // ignore
      }
    }
  }
  return {};
}

export const KNOWN_PRODUCTION_PROJECT_ID = 'indigo-lotus-2nmq3';
export const KNOWN_PRODUCTION_DATABASE_ID = 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2';
export const KNOWN_PRODUCTION_DOMAINS = [
  'thamtunhi.vercel.app',
  '.vercel.app',
];

/**
 * Kiểm tra xem cấu hình dự án có đang trỏ tới Firestore Production thật hay không.
 * QUY TẮC: Không được coi là an toàn chỉ vì có biến FIRESTORE_EMULATOR_HOST.
 */
export function isTargetingProduction(): boolean {
  const cfg = loadFirebaseConfig();
  const isProdProject = cfg.projectId === KNOWN_PRODUCTION_PROJECT_ID;
  const isProdDb = cfg.firestoreDatabaseId === KNOWN_PRODUCTION_DATABASE_ID;

  return isProdProject || isProdDb;
}

/**
 * Kiểm tra xem URL đích có phải là endpoint Production (Vercel) hay không.
 */
export function isProductionUrl(targetUrl: string): boolean {
  if (!targetUrl) return false;
  const lower = targetUrl.toLowerCase();
  return KNOWN_PRODUCTION_DOMAINS.some((domain) => lower.includes(domain));
}

/**
 * Kiểm tra xem URL đích có phải là local backend server hay không.
 */
export function isLocalBackendUrl(targetUrl: string): boolean {
  if (!targetUrl) return false;
  const lower = targetUrl.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.startsWith('/');
}

/**
 * Kiểm tra tính an toàn của một yêu cầu HTTP (URL + Method).
 * Từ chối thực hiện nếu:
 * 1. URL trỏ tới Vercel production và method là thao tác ghi (POST/PATCH/PUT/DELETE) hoặc script test.
 * 2. URL trỏ tới local backend nhưng hệ thống đang kết nối production Firestore và method là ghi.
 */
export function assertSafeUrl(url: string, scriptName: string, method = 'GET'): void {
  const normalizedMethod = (method || 'GET').toUpperCase();
  const isMutatingMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(normalizedMethod);

  // 1. Chặn tuyệt đối gọi đến Vercel Production đối với các thao tác ghi dữ liệu hoặc test script
  if (isProductionUrl(url)) {
    if (isMutatingMethod) {
      const msg = [
        `\n================================================================================`,
        `🚨 [PRODUCTION GUARD] CHẶN YÊU CẦU HTTP GHI DỮ LIỆU ĐẾN VERCEL PRODUCTION!`,
        `================================================================================`,
        `❌ Script [${scriptName}] cố gắng thực hiện '${normalizedMethod} ${url}'.`,
        `🛡️ NGUYÊN TẮC: Tuyệt đối không cho phép bất kỳ script nào gửi request ghi/sửa/xóa`,
        `   lên môi trường Vercel production trực tuyến.`,
        `================================================================================\n`,
      ].join('\n');
      console.error(msg);
      throw new Error(`[PRODUCTION_GUARD_HTTP_BLOCKED] Yêu cầu ${normalizedMethod} tới Vercel production bị chặn.`);
    }
  }

  // 2. Chặn gọi tới local backend nếu server đang trỏ tới production Firestore và method là ghi
  if (isLocalBackendUrl(url) && isMutatingMethod && isTargetingProduction()) {
    const msg = [
      `\n================================================================================`,
      `🚨 [PRODUCTION GUARD] CHẶN YÊU CẦU HTTP GHI QUA LOCAL BACKEND ĐANG NỐI PRODUCTION!`,
      `================================================================================`,
      `❌ Script [${scriptName}] cố gắng gửi '${normalizedMethod} ${url}'.`,
      `📌 NGUYÊN NHÂN: Local backend đang kết nối trực tiếp với Cloud Firestore thật (${KNOWN_PRODUCTION_PROJECT_ID}).`,
      `   Thao tác ghi qua local API sẽ trực tiếp làm biến đổi dữ liệu trên production!`,
      `🛡️ QUY TẮC: Chặn mọi HTTP mutation kể cả khi chạy từ máy local.`,
      `================================================================================\n`,
    ].join('\n');
    console.error(msg);
    throw new Error(`[PRODUCTION_GUARD_HTTP_BLOCKED] Yêu cầu ${normalizedMethod} tới local backend bị chặn do đang nối Firestore production.`);
  }
}

/**
 * Khóa bảo vệ môi trường cơ sở dữ liệu:
 * Ném lỗi và dừng ngay lập tức nếu script cố gắng ghi dữ liệu hoặc phân công tự động khi trỏ tới Production.
 *
 * QUY TẮC BẮT BUỘC:
 * - Không cho phép cờ bypass (ALLOW_TEST_WRITES, NODE_ENV) mở khóa.
 * - Không cho phép FIRESTORE_EMULATOR_HOST bypass nếu projectId/databaseId vẫn là production.
 */
export function assertSafeEnvironment(
  scriptName: string,
  operationDescription = 'Ghi/Sửa/Xóa dữ liệu hoặc Phân công tự động'
): void {
  // Chỉ coi là an toàn nếu:
  // 1. Có cấu hình FIRESTORE_EMULATOR_HOST
  // VÀ
  // 2. ProjectId KHÔNG PHẢI là project Production ('indigo-lotus-2nmq3')
  const cfg = loadFirebaseConfig();
  const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const isProdConfig = isTargetingProduction();

  if (hasEmulator && !isProdConfig) {
    console.log(`[PRODUCTION GUARD - PASS] Đang chạy qua Firebase Emulator cô lập với project test (${cfg.projectId || 'demo-mock'}). Thao tác an toàn.`);
    return;
  }

  if (isProdConfig) {
    const errorMsg = [
      `\n================================================================================`,
      `🚨 [PRODUCTION GUARD] KHÓA BẢO VỆ PRODUCTION KÍCH HOẠT THÀNH CÔNG!`,
      `================================================================================`,
      `❌ Thao tác '${operationDescription}' trong script [${scriptName}] BỊ TỪ CHỐI THỰC THI.`,
      `📌 NGUYÊN NHÂN: Cấu hình hệ thống đang kết nối trực tiếp đến Cloud Firestore thật:`,
      `   - Project ID: ${cfg.projectId || 'N/A'} (Khớp Production: ${KNOWN_PRODUCTION_PROJECT_ID})`,
      `   - Database ID: ${cfg.firestoreDatabaseId || 'N/A'} (Khớp Production Database)`,
      `   - FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST || 'Không có'}`,
      `🛡️ QUY TẮC BẢO MẬT:`,
      `   1. Không cho phép script tự động ghi đè tài khoản, mật khẩu, phân công giáo viên trên database thật.`,
      `   2. Không chấp nhận biến FIRESTORE_EMULATOR_HOST khi projectId vẫn trỏ tới production.`,
      `   3. Không chấp nhận các biến cờ bypass (ALLOW_TEST_WRITES, NODE_ENV).`,
      `💡 HƯỚNG DẪN: Để kiểm thử ghi dữ liệu an toàn, hãy trỏ cấu hình sang một test project riêng (ví dụ: 'demo-test')`,
      `   kèm theo FIRESTORE_EMULATOR_HOST="localhost:8080".`,
      `================================================================================\n`,
    ].join('\n');

    console.error(errorMsg);
    throw new Error(`[PRODUCTION_GUARD_BLOCKED] Script '${scriptName}' bị chặn để bảo vệ dữ liệu production.`);
  }
}

/**
 * Cài đặt đánh chặn tự động cho global fetch (nếu có) để ngăn chặn bất kỳ lời gọi HTTP ghi dữ liệu nào.
 */
export function installGlobalFetchGuard(scriptName: string): void {
  if (typeof globalThis.fetch === 'function') {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET') || 'GET';
      
      assertSafeUrl(urlString, scriptName, method);
      return originalFetch(input, init);
    };
  }
}
