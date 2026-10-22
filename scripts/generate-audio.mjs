/**
 * Produksi 10 file MP3 listening (q61.mp3 ... q70.mp3) dari naskah L1-L10.
 *
 * - Label pembicara (女の人：/男の人：/先生：/学生：) tidak dibacakan; dipakai untuk
 *   memilih suara dan memisahkan segmen.
 * - Setiap segmen dihasilkan terpisah lalu disambung dengan jeda senyap 500-800 ms.
 * - Suara: ja-JP-NanamiNeural (perempuan) dan ja-JP-KeitaNeural (laki-laki),
 *   rate -10% (sekitar 0,9x percakapan normal), tanpa musik latar.
 *
 * Jalankan: npm run assets:audio
 */
import { EdgeTTS } from 'node-edge-tts';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const outDir = join(projectRoot, 'public', 'audio');

const FEMALE_VOICE = 'ja-JP-NanamiNeural';
const MALE_VOICE = 'ja-JP-KeitaNeural';
const RATE = '-10%';
const JP_LANG = 'ja-JP';

const FEMALE_LABELS = new Set(['女の人', '女の子', '女', '学生']);
const MALE_LABELS = new Set(['男の人', '男の子', '男']);
const TEACHER_LABELS = new Set(['先生']);

/** Jeda antar penutur, sesuai spec 500-800 ms. */
function pauseMsFor(femaleToMale) {
  return femaleToMale ? 700 : 600;
}

function silentMp3(durationMs) {
  // Frame MPEG-2 Layer III, 24 kHz, 48 kbps, mono => 144 byte per frame,
  // 576 sampel / 24 kHz = 24 ms per frame. Header harus sama dengan file TTS.
  const frame = Buffer.alloc(144);
  frame[0] = 0xff;
  frame[1] = 0xf3; // MPEG-2, Layer III
  frame[2] = 0b10010000; // bitrate index 9 (48 kbps), sample rate index 0 (24 kHz)
  frame[3] = 0b11000000; // mono, no mode extension
  const frames = Math.max(1, Math.round(durationMs / 24));
  return Buffer.concat(Array.from({ length: frames }, () => frame));
}

function parseSegments(script) {
  const segments = [];
  for (const rawLine of script.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = /^([^：:]+)[：:]\s*(.*)$/.exec(line);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      if (text) segments.push({ speaker, text });
    } else {
      segments.push({ speaker: null, text: line });
    }
  }
  return segments;
}

function voiceForSpeaker(speaker) {
  if (speaker && MALE_LABELS.has(speaker)) return MALE_VOICE;
  if (speaker && TEACHER_LABELS.has(speaker)) return MALE_VOICE;
  return FEMALE_VOICE;
}

async function synthesize(text, voice, outPath) {
  const tts = new EdgeTTS({
    voice,
    lang: JP_LANG,
    rate: RATE,
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    timeout: 30000,
  });
  await tts.ttsPromise(text, outPath);
  if (!existsSync(outPath) || statSync(outPath).size === 0) {
    throw new Error(`Audio kosong: ${outPath}`);
  }
  return readFileSync(outPath);
}

async function main() {
  const scripts = JSON.parse(
    readFileSync(join(projectRoot, 'src', 'data', 'listeningScripts.json'), 'utf8'),
  );
  mkdirSync(outDir, { recursive: true });
  const tmpDir = join(projectRoot, '.tts-tmp');
  mkdirSync(tmpDir, { recursive: true });

  const summary = [];
  for (let i = 0; i < scripts.length; i++) {
    const item = scripts[i];
    const segments = parseSegments(item.script);
    const buffers = [];
    let previousVoice = null;

    for (let s = 0; s < segments.length; s++) {
      const segment = segments[s];
      const voice = voiceForSpeaker(segment.speaker);
      if (previousVoice && s > 0) {
        buffers.push(silentMp3(pauseMsFor(previousVoice === FEMALE_VOICE)));
      }
      const partPath = join(tmpDir, `${item.id}-${s}.mp3`);
      const buffer = await synthesize(segment.text, voice, partPath);
      buffers.push(buffer);
      previousVoice = voice;
      process.stdout.write(`  ${item.id} segmen ${s + 1}/${segments.length} (${voice}) ${buffer.length} bytes\n`);
    }

    const outPath = join(outDir, item.file.replace(/^audio\//, ''));
    writeFileSync(outPath, Buffer.concat(buffers));
    const size = statSync(outPath).size;
    summary.push({ file: item.file, segments: segments.length, size, voices: [...new Set(segments.map((x) => voiceForSpeaker(x.speaker)))].join(',') });
    process.stdout.write(`${item.file} -> ${size} bytes\n`);
  }

  console.log('\nRingkasan audio:');
  for (const row of summary) {
    console.log(`${row.file} | ${row.segments} segmen | ${row.size} bytes | ${row.voices}`);
  }
}

main().catch((error) => {
  console.error('Gagal membuat audio:', error);
  process.exit(1);
});