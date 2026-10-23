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
  // Frame senyap harus memakai header yang SAMA dengan output TTS, kalau tidak
  // decoder kehilangan sinkronisasi dan audio terdengar rusak/terpotong.
  // TTS menghasilkan: FF F3 64 C4 (MPEG-2 Layer III, 48 kbps, 24 kHz, mono).
  // Frame size = 72 * 48000 / 24000 = 144 byte; 576 sampel / 24 kHz = 24 ms.
  const frame = Buffer.alloc(144);
  frame[0] = 0xff;
  frame[1] = 0xf3;
  frame[2] = 0x64; // bitrate index 6 (48 kbps), sample rate index 1 (24 kHz)
  frame[3] = 0xc4; // mono, mode extension 2 (sama seperti TTS)
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

/**
 * Inspeksi berkas MP3: hitung frame valid, total durasi, dan byte yang tidak
 * terparse. Byte sisa > 0 berarti ada frame dengan header rusak/inkonsisten.
 * Dipakai untuk memvalidasi hasil gabungan sebelum ditulis.
 */
function inspectMp3(buffer) {
  const BITRATES_MPEG2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const SAMPLE_RATES = [22050, 24000, 16000];
  let offset = 0;
  let frames = 0;
  let seconds = 0;
  let unparsedBytes = 0;

  // Lewati ID3v2 bila ada.
  if (buffer.length > 10 && buffer.toString('ascii', 0, 3) === 'ID3') {
    const size =
      ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
    offset = 10 + size;
  }

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] === 0xff && (buffer[offset + 1] & 0xe0) === 0xe0) {
      const version = (buffer[offset + 1] >> 3) & 0x03;
      const layer = (buffer[offset + 1] >> 1) & 0x03;
      const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
      const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
      const padding = (buffer[offset + 2] >> 1) & 0x01;

      if (version === 2 && layer === 1 && bitrateIndex > 0 && bitrateIndex < 15 && sampleRateIndex < 3) {
        const bitrate = BITRATES_MPEG2_L3[bitrateIndex] * 1000;
        const sampleRate = SAMPLE_RATES[sampleRateIndex];
        const frameLength = Math.floor((72 * bitrate) / sampleRate) + padding;
        if (frameLength > 0 && offset + frameLength <= buffer.length) {
          frames += 1;
          seconds += 576 / sampleRate;
          offset += frameLength;
          continue;
        }
      }
    }
    unparsedBytes += 1;
    offset += 1;
  }
  unparsedBytes += Math.max(0, buffer.length - offset);

  return { frames, seconds, unparsedBytes };
}

function voiceForSpeaker(speaker) {
  if (speaker && MALE_LABELS.has(speaker)) return MALE_VOICE;
  if (speaker && TEACHER_LABELS.has(speaker)) return MALE_VOICE;
  return FEMALE_VOICE;
}

async function synthesize(text, voice, outPath, attempt = 1) {
  const tts = new EdgeTTS({
    voice,
    lang: JP_LANG,
    rate: RATE,
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    timeout: 30000,
  });
  try {
    await tts.ttsPromise(text, outPath);
  } catch (error) {
    // 429 = rate limit dari layanan TTS. Tunggu lalu coba lagi.
    const isRateLimit = /429/.test(String(error?.message ?? error));
    if (attempt <= 6) {
      const waitMs = isRateLimit ? attempt * 15000 : attempt * 2000;
      process.stdout.write(
        `    ${isRateLimit ? 'Rate limit' : 'Gagal'} (percobaan ${attempt}), tunggu ${waitMs / 1000}s…\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return synthesize(text, voice, outPath, attempt + 1);
    }
    throw error;
  }
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
            // Pakai ulang segmen yang sudah valid supaya tidak memanggil TTS berulang
            // (menghemat kuota dan waktu saat regenerasi).
            let buffer;
            if (existsSync(partPath) && statSync(partPath).size > 0) {
              const cached = readFileSync(partPath);
              if (inspectMp3(cached).unparsedBytes === 0) buffer = cached;
            }
            if (!buffer) {
              buffer = await synthesize(segment.text, voice, partPath);
            }

            // Setiap segmen TTS harus bersih; kalau tidak, gabungan akan rusak.
            const segCheck = inspectMp3(buffer);
            if (segCheck.unparsedBytes > 0) {
              throw new Error(
                `${item.id} segmen ${s + 1}: ${segCheck.unparsedBytes} byte tidak terparse di output TTS`,
              );
            }

            buffers.push(buffer);
            previousVoice = voice;
            process.stdout.write(
              `  ${item.id} segmen ${s + 1}/${segments.length} (${voice}) ${buffer.length} bytes, ${segCheck.seconds.toFixed(2)}s\n`,
            );
          }

    const outPath = join(outDir, item.file.replace(/^audio\//, ''));
        const combined = Buffer.concat(buffers);
        writeFileSync(outPath, combined);

        // Validasi wajib: seluruh berkas harus terparse habis menjadi frame MPEG
        // yang konsisten. Ini menangkap frame jeda dengan header salah.
        const check = inspectMp3(combined);
        if (check.unparsedBytes > 0) {
          throw new Error(
            `${item.file}: ${check.unparsedBytes} byte tidak terparse (frame header tidak konsisten)`,
          );
        }
        const expected = segments.length;
        if (check.frames < expected) {
          throw new Error(`${item.file}: hanya ${check.frames} frame, mencurigakan`);
        }

        const size = statSync(outPath).size;
        summary.push({ file: item.file, segments: segments.length, size, seconds: check.seconds, voices: [...new Set(segments.map((x) => voiceForSpeaker(x.speaker)))].join(',') });
        process.stdout.write(`${item.file} -> ${size} bytes, ${check.seconds.toFixed(2)}s, ${check.frames} frame\n`);
      }

      console.log('\nRingkasan audio:');
      for (const row of summary) {
        console.log(`${row.file} | ${row.segments} segmen | ${row.seconds.toFixed(2)}s | ${row.size} bytes | ${row.voices}`);
      }
    }

main().catch((error) => {
  console.error('Gagal membuat audio:', error);
  process.exit(1);
});