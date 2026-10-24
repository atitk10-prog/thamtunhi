import fetch from 'node-fetch';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('verify_prod_g1.ts', 'Kiểm thử khảo sát Production G1');

const PROD_URL = 'https://thamtunhi.vercel.app';

async function login(email: string, pass: string) {
  const res = await fetch(`${PROD_URL}/api/auth/teacher-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(`Login ${email} failed HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function verifyProductionG1() {
  console.log('=== KIỂM THỬ KHẢO SÁT PRODUCTION G1 (https://thamtunhi.vercel.app) ===\n');

  // 1. Health
  const hRes = await fetch(`${PROD_URL}/api/health`);
  console.log('1. Health probe HTTP:', hRes.status, await hRes.json());

  // Logins on Production
  console.log('Authenticating 3 teachers on Production...');
  const t1Token = await login('giaovien1@thamtutoannhi.edu.vn', 'MatKhauGiaoVien@123');
  const t2Token = await login('giaovien2@thamtutoannhi.edu.vn', 'MatKhauGiaoVien@123');
  const ttToken = await login('thanhthanh@gmail.com', '123456');
  console.log('✓ Successfully obtained production tokens for all 3 teachers.\n');

  // 2. Teacher 1 Classes
  const t1Res = await fetch(`${PROD_URL}/api/teacher/classes`, {
    headers: { Authorization: `Bearer ${t1Token}` }
  });
  const t1Data: any = await t1Res.json();
  console.log('2. Teacher 1 Classes HTTP:', t1Res.status, '| Classes:', t1Data.classes?.map((c: any) => `${c.name} (${c.studentCount} HS)`));

  // 3. Teacher 1 Roster 1A
  const r1aRes = await fetch(`${PROD_URL}/api/teacher/classes/class-1a/students`, {
    headers: { Authorization: `Bearer ${t1Token}` }
  });
  const r1aData: any = await r1aRes.json();
  console.log('3. Teacher 1 Roster 1A HTTP:', r1aRes.status, '| Students count:', r1aData.students?.length);

  // 4. Teacher 1 Forbidden 2A
  const t1Access2a = await fetch(`${PROD_URL}/api/teacher/classes/class-2a/students`, {
    headers: { Authorization: `Bearer ${t1Token}` }
  });
  console.log('4. Teacher 1 access 2A (ABAC Forbidden test) HTTP:', t1Access2a.status);

  // 5. Teacher 2 Classes
  const t2Res = await fetch(`${PROD_URL}/api/teacher/classes`, {
    headers: { Authorization: `Bearer ${t2Token}` }
  });
  const t2Data: any = await t2Res.json();
  console.log('5. Teacher 2 Classes HTTP:', t2Res.status, '| Classes:', t2Data.classes?.map((c: any) => `${c.name} (${c.studentCount} HS)`));

  // 6. Teacher 2 Forbidden 1A
  const t2Access1a = await fetch(`${PROD_URL}/api/teacher/classes/class-1a/students`, {
    headers: { Authorization: `Bearer ${t2Token}` }
  });
  console.log('6. Teacher 2 access 1A (ABAC Forbidden test) HTTP:', t2Access1a.status);

  // 7. Teacher Trần Thanh Thanh Classes
  const ttRes = await fetch(`${PROD_URL}/api/teacher/classes`, {
    headers: { Authorization: `Bearer ${ttToken}` }
  });
  const ttData: any = await ttRes.json();
  console.log('7. Teacher Trần Thanh Thanh Classes HTTP:', ttRes.status, '| Classes count:', ttData.classes?.length);

  // 8. Teacher Trần Thanh Thanh Forbidden 1A
  const ttAccess1a = await fetch(`${PROD_URL}/api/teacher/classes/class-1a/students`, {
    headers: { Authorization: `Bearer ${ttToken}` }
  });
  console.log('8. Teacher Trần Thanh Thanh access 1A (ABAC Forbidden test) HTTP:', ttAccess1a.status);

  console.log('\n=== HOÀN TẤT KIỂM THỬ KHẢO SÁT PRODUCTION G1 ===');
}

verifyProductionG1().catch(console.error);
