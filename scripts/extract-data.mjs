/**
 * Ekstrak 5 blok JSON dari JLPT_N4_WEBSITE_SPEC.md ke src/data/*.json.
 * Root project = folder induk dari scripts/.
 * Jalankan: node scripts/extract-data.mjs [path-ke-spec]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const defaultSpec = join(root, '..', 'JLPT_N4_WEBSITE_SPEC.md');
const specPath = process.argv[2] ?? defaultSpec;

if (!existsSync(specPath)) {
  console.error('Spec tidak ditemukan:', specPath);
  process.exit(1);
}

const markdown = readFileSync(specPath, 'utf8').replace(/^\uFEFF/, '');
const blocks = [...markdown.matchAll(/```json\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
if (blocks.length !== 5) {
  console.error(`Harus ada 5 blok JSON, ditemukan ${blocks.length}`);
  process.exit(1);
}

const targets = ['questions', 'passages', 'storyScenes', 'matchingScenes', 'listeningScripts'];
const outDir = join(root, 'src', 'data');
mkdirSync(outDir, { recursive: true });

targets.forEach((name, index) => {
  const data = JSON.parse(blocks[index].replace(/^\uFEFF/, ''));
  writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`${name}.json: ${Array.isArray(data) ? data.length : '?'} item`);
});
console.log('Ekstraksi selesai.');