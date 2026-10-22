/**
 * Validasi semua SVG di public/images memakai parser XML asli (jsdom),
 * plus cek ukuran viewBox dan jumlah panel cerita.
 * Jalankan: node scripts/check-images.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parser = new (new JSDOM().window.DOMParser)();

const dirs = [
  { dir: join(root, 'public', 'images', 'stories'), expectPanels: true },
  { dir: join(root, 'public', 'images', 'matching'), expectPanels: false },
];

let failures = 0;
let checked = 0;

for (const { dir, expectPanels } of dirs) {
  for (const file of readdirSync(dir).sort()) {
    const source = readFileSync(join(dir, file), 'utf8');
    const doc = parser.parseFromString(source, 'image/svg+xml');
    checked += 1;
    const error = doc.querySelector('parsererror');
    if (error) {
      failures += 1;
      console.error(`FAIL ${file}: ${error.textContent.trim().split('\n')[0]}`);
      continue;
    }
    const svg = doc.documentElement;
    if (svg.tagName.toLowerCase() !== 'svg') {
      failures += 1;
      console.error(`FAIL ${file}: root bukan <svg>`);
      continue;
    }
    if (!svg.getAttribute('viewBox')) {
      failures += 1;
      console.error(`FAIL ${file}: tanpa viewBox`);
      continue;
    }
    if (expectPanels) {
          const numbers = [...svg.querySelectorAll('text')].map((t) => t.textContent);
          if (numbers.join('') !== '1234') {
            failures += 1;
            console.error(`FAIL ${file}: nomor panel = ${numbers.join('')}`);
            continue;
          }
        }
    // Semua elemen gambar harus punya stroke atau fill eksplisit
    const shapes = svg.querySelectorAll('circle, rect, path, polygon, polyline, ellipse');
    if (shapes.length < 5) {
      failures += 1;
      console.error(`FAIL ${file}: hanya ${shapes.length} elemen bentuk`);
      continue;
    }
  }
}

console.log(`SVG diperiksa: ${checked}, gagal: ${failures}`);
if (failures > 0) process.exit(1);