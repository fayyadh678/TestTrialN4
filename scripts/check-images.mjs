/**
 * Validasi semua SVG di public/images memakai parser XML asli (jsdom).
 * - sN.svg      : gabungan 4 panel, nomor panel harus 1,2,3,4
 * - sN-M.svg    : panel tunggal, nomor panel harus M
 * - mN-x.svg    : gambar opsi matching
 * Jalankan: node scripts/check-images.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parser = new new JSDOM().window.DOMParser();

let failures = 0;
let checked = 0;

function fail(file, message) {
  failures += 1;
  console.error(`FAIL ${file}: ${message}`);
}

function validate(file, source, expectedNumbers) {
  checked += 1;
  const doc = parser.parseFromString(source, 'image/svg+xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    fail(file, (parseError.textContent ?? '').trim().split('\n')[0]);
    return;
  }

  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') {
    fail(file, 'root bukan <svg>');
    return;
  }
  if (!svg.getAttribute('viewBox')) {
    fail(file, 'tanpa viewBox');
    return;
  }

  if (expectedNumbers !== null) {
    const numbers = [...svg.querySelectorAll('text')].map((node) => node.textContent);
    if (numbers.join('') !== expectedNumbers) {
      fail(file, `nomor panel = "${numbers.join('')}" (harus "${expectedNumbers}")`);
      return;
    }
  }

  const shapes = svg.querySelectorAll('circle, rect, path, polygon, polyline, ellipse');
  if (shapes.length < 5) {
    fail(file, `hanya ${shapes.length} elemen bentuk`);
  }
}

const storiesDir = join(root, 'public', 'images', 'stories');
for (const file of readdirSync(storiesDir).sort()) {
  const source = readFileSync(join(storiesDir, file), 'utf8');
  if (/^s[1-5]\.svg$/.test(file)) {
    validate(file, source, '1234');
  } else if (/^s[1-5]-\d\.svg$/.test(file)) {
    const expected = (file.match(/^s[1-5]-(\d)\.svg$/) ?? [])[1] ?? null;
    validate(file, source, expected);
  } else {
    fail(file, 'nama berkas cerita tidak dikenali');
  }
}

const matchingDir = join(root, 'public', 'images', 'matching');
const matchingFiles = readdirSync(matchingDir).sort();
if (matchingFiles.length !== 20) {
  fail('images/matching', `harus 20 berkas, ditemukan ${matchingFiles.length}`);
}
for (const file of matchingFiles) {
  if (!/^m[1-5]-[a-d]\.svg$/.test(file)) {
    fail(file, 'nama berkas matching tidak dikenali');
    continue;
  }
  validate(file, readFileSync(join(matchingDir, file), 'utf8'), null);
}

console.log(`SVG diperiksa: ${checked}, gagal: ${failures}`);
if (failures > 0) process.exit(1);