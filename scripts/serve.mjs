import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const root = new URL('../app/', import.meta.url);
const port = Number(process.argv[2] ?? 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer(async (req, res) => {
  const requested = decodeURIComponent(req.url.split('?')[0]);
  const fileName = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');

  try {
    const body = await readFile(new URL(fileName, root));
    res.writeHead(200, { 'content-type': mimeTypes[extname(fileName)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving app/ on http://127.0.0.1:${port}`);
});
