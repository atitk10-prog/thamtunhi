import https from 'https';
export * from './vietnameseTts';

/**
 * Downloads a single chunk (< 180 chars) from Google TTS (Vietnamese voice)
 */
function fetchTtsChunk(textChunk: string): Promise<Buffer> {
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' + encodeURIComponent(textChunk);
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Google TTS request failed with status code ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Google TTS request timed out.'));
    });
  });
}

/**
 * Splits longer text into polite sentence fragments of <= 160 characters
 */
function splitTextIntoChunks(text: string, maxLen = 160): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    if ((cur + ' ' + s).trim().length <= maxLen) {
      cur = (cur ? cur + ' ' : '') + s.trim();
    } else {
      if (cur) chunks.push(cur);
      if (s.trim().length <= maxLen) {
        cur = s.trim();
      } else {
        const words = s.trim().split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub ? sub + ' ' : '') + w;
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        cur = sub;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}

/**
 * Synthesizes natural, gentle Vietnamese speech into MP3 buffer
 */
export async function synthesizeVietnameseSpeech(text: string): Promise<Buffer> {
  const clean = text.trim();
  if (!clean) {
    throw new Error('TTS text cannot be empty');
  }

  const chunks = splitTextIntoChunks(clean);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const buf = await fetchTtsChunk(chunk);
    audioBuffers.push(buf);
    if (chunks.length > 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return Buffer.concat(audioBuffers);
}
