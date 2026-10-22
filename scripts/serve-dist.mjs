/**
 * Server statis untuk menjalankan `dist` pada E2E test.
 * Bila `pages` = "true", seluruh permintaan dilayani pada prefix /TestTrialN4/
 * sehingga penanganan base path GitHub Pages ikut terverifikasi.
 * Jalankan: node scripts/serve-dist.mjs [port] [pages]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distRoot = join(here, '..', 'dist');
const port = Number(process.argv[2] ?? 4180);
const pagesPrefix = process.argv[3] === 'true' ? '/TestTrialN4' : '';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

const requests = { total: 0, missing: [] };

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
  let pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/__requests') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(requests));
    return;
  }

  if (pagesPrefix) {
    if (pathname === pagesPrefix) pathname = '/';
    else if (pathname.startsWith(`${pagesPrefix}/`)) pathname = pathname.slice(pagesPrefix.length);
    else {
      response.writeHead(404).end('404');
      return;
    }
  }

  let filePath = join(distRoot, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  const info = await stat(filePath).catch(() => null);

  if (!info || info.isDirectory()) {
    // Fallback SPA ala GitHub Pages audit: layani index.html untuk path tanpa ekstensi.
    if (!extname(filePath)) {
      filePath = join(distRoot, 'index.html');
    }
  }

  requests.total += 1;
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    requests.missing.push(requestUrl.pathname);
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('404');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`dist disajikan di http://127.0.0.1:${port}${pagesPrefix}/`);
});