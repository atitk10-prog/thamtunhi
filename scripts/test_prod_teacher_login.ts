import https from 'https';

async function test(email: string, pass: string) {
  const payload = JSON.stringify({ email, password: pass });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'thamtunhi.vercel.app',
      port: 443,
      path: '/api/auth/teacher-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ email, status: res.statusCode, data }));
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  if (process.env.TEST_TEACHER_PASSWORD) {
    console.log(await test('xuannuong@gmail.com', process.env.TEST_TEACHER_PASSWORD));
  }
  if (process.env.TEST_TEACHER_PASSWORD) {
    console.log(await test('xuannuong@thamtunhi.edu.vn', process.env.TEST_TEACHER_PASSWORD));
  }
  if (process.env.ADMIN_PASSWORD) {
    console.log(await test('admin@thamtutoannhi.edu.vn', process.env.ADMIN_PASSWORD));
  }
}
run();
