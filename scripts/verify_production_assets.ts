const PROD_BASE = 'https://thamtunhi.vercel.app';

const urls = [
  '/api/health',
  '/assets/toan-nhi/money-100-front.png',
  '/assets/toan-nhi/money-100-back.png',
  '/assets/toan-nhi/money-200-front.png',
  '/assets/toan-nhi/money-500-front.png',
  '/assets/toan-nhi/money-1000-front.png',
  '/assets/toan-nhi/money-10000.png',
  '/assets/toan-nhi/money-20000.png',
  '/assets/toan-nhi/money-50000.png',
  '/assets/toan-nhi/money-100000.png',
  '/assets/toan-nhi/money-200000.png',
  '/assets/toan-nhi/money-500000.png',
  '/assets/toan-nhi/clock-1h.png',
  '/assets/toan-nhi/clock-6h.png',
  '/assets/toan-nhi/clock-12h.png',
  '/assets/toan-nhi/clock-1h30.png',
  '/assets/toan-nhi/clock-3h30.png',
  '/assets/toan-nhi/clock-6h30.png',
  '/assets/toan-nhi/clock-9h30.png',
  '/assets/toan-nhi/counting-stick-single.png',
  '/assets/toan-nhi/counting-stick-bundle10.png',
  '/assets/toan-nhi/counting-dot-blue.png',
  '/assets/toan-nhi/apple-red.png',
  '/assets/toan-nhi/carrot-orange.png',
  '/assets/toan-nhi/assets_manifest.json',
  '/assets/toan-nhi/assets_manifest_math.json',
  '/assets/toan-nhi/assets_manifest_money_sgk.json',
];

async function verifyProdAssets() {
  console.log('--- TESTING VERCEL PRODUCTION ASSETS ---');
  let successCount = 0;
  let failCount = 0;

  for (const path of urls) {
    const fullUrl = `${PROD_BASE}${path}`;
    try {
      const res = await fetch(fullUrl, { method: 'HEAD' });
      const len = res.headers.get('content-length') || 'chunked';
      const type = res.headers.get('content-type');
      if (res.ok) {
        successCount++;
        console.log(`✓ [${res.status}] ${path} (${len} B, ${type})`);
      } else {
        failCount++;
        console.error(`❌ [${res.status}] ${path}`);
      }
    } catch (err: any) {
      failCount++;
      console.error(`❌ [NETWORK ERROR] ${path}:`, err.message);
    }
  }

  console.log(`\nProduction URL check: ${successCount} PASS / ${failCount} FAIL`);
  if (failCount > 0) process.exit(1);
}

verifyProdAssets();
