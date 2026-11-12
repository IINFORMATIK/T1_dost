import { createServer } from 'node:http';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const directory = resolve(process.env.CATALOG_DATA_DIR || fileURLToPath(new URL('local-data/', root)));
mkdirSync(directory, { recursive: true });
const database = resolve(directory, 'achievements.json');
let records;
try {
  records = JSON.parse(readFileSync(database, 'utf8'));
  if (!Array.isArray(records)) throw new Error('Expected an array in achievements.json');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  records = [];
}
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
function recordSummary({ documentData, ...record }) {
  return { ...record, hasDocument: Boolean(documentData) };
}

const required = ['category', 'year', 'name', 'title', 'level', 'result', 'region'];
const fields = [...required, 'detail', 'subject', 'department'];
const departments = new Set(['', 'math', 'science', 'language', 'foreign', 'history', 'arts', 'primary', 'unassigned']);

createServer(async (req, res) => {
  const json = (status, body) => res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  }).end(JSON.stringify(body));
  try {
    if (req.url === '/api/records' && req.method === 'GET') return json(200, records);
    if (req.url === '/api/records?summary=1' && req.method === 'GET') {
      return json(200, records.map(recordSummary));
    }
    const documentMatch = req.method === 'GET' && /^\/api\/records\/(\d+)\/document\?revision=(\d+)$/.exec(req.url);
    if (documentMatch) {
      const record = records.find(record => record.id === Number(documentMatch[1]) &&
        record.revision === Number(documentMatch[2]));
      if (!record?.documentData) return json(404, {});
      const bytes = Buffer.from(record.documentData.split(',')[1], 'base64');
      return res.writeHead(200, {
        'Content-Type': record.documentType,
        'Content-Length': bytes.length,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      }).end(bytes);
    }
    if (req.url === '/api/records' && req.method === 'POST') {
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return json(415, {});
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 3 * 1024 * 1024) { json(413, {}); return; }
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks)); } catch { return json(400, {}); }
      if (!input || required.some(key => typeof input[key] !== 'string' || !input[key].trim()) ||
          fields.some(key => input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > 4096)) ||
          !departments.has(input.department ?? '') ||
          !['student', 'vsosh', 'teacher', 'school'].includes(input.category)) return json(400, {});
      const previous = input.id == null ? null : records.find(record => record.id === input.id);
      if (input.id != null && (!previous || previous.revision !== input.revision)) return json(409, {});
      const entry = Object.fromEntries(fields.map(key => [key, input[key] || '']));
      if (input.documentData != null) {
        const match = typeof input.documentData === 'string' &&
          /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.documentData);
        if (!match || match[1] !== input.documentType || Buffer.from(match[2], 'base64').length > 2 * 1024 * 1024 ||
            typeof input.documentName !== 'string' || input.documentName.length > 512) return json(400, {});
        Object.assign(entry, { documentData: input.documentData, documentType: input.documentType, documentName: input.documentName });
      } else if (input.keepDocument === true && previous?.documentData) {
        const { documentData, documentType, documentName } = previous;
        Object.assign(entry, { documentData, documentType, documentName });
      }
      entry.id = previous?.id ?? records.reduce((max, record) => Math.max(max, record.id), 0) + 1;
      entry.date = previous?.date ?? new Date().toISOString().slice(0, 10);
      entry.revision = (previous?.revision ?? 0) + 1;
      const next = previous ? records.map(record => record.id === entry.id ? entry : record) : [...records, entry];
      writeFileSync(database + '.tmp', JSON.stringify(next), { mode: 0o600 });
      renameSync(database + '.tmp', database);
      records = next;
      return json(previous ? 200 : 201, input.summary === true ? recordSummary(entry) : entry);
    }
    const asset = req.method === 'GET' && assets.get(req.url);
    if (!asset) return json(404, {});
    let content = readFileSync(new URL('dist/' + asset[0], root));
    if (asset[0] === 'index.html') content = content.toString('utf8').replace('<body>', '<body data-shared-catalog>');
    res.writeHead(200, { 'Content-Type': asset[1], 'X-Content-Type-Options': 'nosniff' }).end(content);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(500, {});
    else res.end();
  }
}).listen(Number(process.env.PORT || 8080), process.env.HOST || '127.0.0.1', function () {
  console.log('Catalog listening on', this.address());
});
