import fs from 'fs';
const s = fs.readFileSync('server.ts', 'utf8');
const lines = s.split('\n');
const results: Array<{ line: number; text: string }> = [];
lines.forEach((l, i) => {
  if (l.includes("app.get('/api") || l.includes("app.post('/api") || l.includes("attempts") || l.includes("attempt")) {
    if (l.includes('/api/') || l.includes('collection(db, \'attempts\'')) {
      results.push({ line: i + 1, text: l.trim() });
    }
  }
});
console.log('Found matches:', results.length);
results.slice(0, 30).forEach(r => console.log(`${r.line}: ${r.text}`));
