import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import questions from '../src/data/questions.json';
import listeningScripts from '../src/data/listeningScripts.json';
import storyScenes from '../src/data/storyScenes.json';
import type { Question } from '../src/lib/types';

const publicDir = join(__dirname, '..', 'public');
const read = (relative: string) => join(publicDir, relative.replace(/^\/+/, ''));

const bank = questions as unknown as Question[];
const listening = listeningScripts as { id: string; file: string }[];
const stories = storyScenes as { id: string; path: string }[];

/** Frame header MPEG untuk memastikan berkas benar-benar audio, bukan file kosong. */
function hasMp3Frame(buffer: Buffer): boolean {
  for (let i = 0; i + 3 < buffer.length && i < 8192; i += 1) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
      const layer = (buffer[i + 1] >> 1) & 0x03;
      const bitrate = (buffer[i + 2] >> 4) & 0x0f;
      const sampleRate = (buffer[i + 2] >> 2) & 0x03;
      if (layer !== 0 && bitrate > 0 && bitrate < 15 && sampleRate < 3) return true;
    }
  }
  return false;
}

describe('Aset publik ada dan valid di disk', () => {
  it('menyediakan tepat 10 berkas MP3 listening yang playable', () => {
    const audioDir = read('audio');
    const files = readdirSync(audioDir).filter((f) => f.endsWith('.mp3')).sort();
    expect(files).toEqual(Array.from({ length: 10 }, (_, i) => `q${61 + i}.mp3`));

    for (const script of listening) {
      const file = read(script.file);
      expect(existsSync(file), `${script.file} harus ada`).toBe(true);
      const size = statSync(file).size;
      expect(size, `${script.file} tidak boleh kosong`).toBeGreaterThan(2000);
      const buffer = readFileSync(file);
      expect(hasMp3Frame(buffer), `${script.file} harus berisi frame MP3 valid`).toBe(true);
    }
  });

  it('menyediakan 5 SVG cerita empat panel', () => {
    for (const story of stories) {
      const file = read(story.path);
      expect(existsSync(file), `${story.path} harus ada`).toBe(true);
      const svg = readFileSync(file, 'utf8');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('viewBox');
      // Nomor panel 1..4 harus ada dan berurutan
      const numbers = [...svg.matchAll(/>(\d)<\/text>/g)].map((m) => m[1]);
      expect(numbers).toEqual(['1', '2', '3', '4']);
    }
  });

  it('menyediakan 20 SVG opsi matching yang berbeda satu sama lain', () => {
    const dir = read('images/matching');
    const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
    expect(files).toHaveLength(20);

    for (let m = 1; m <= 5; m += 1) {
      const group = ['a', 'b', 'c', 'd'].map((c) => {
        const file = join(dir, `m${m}-${c}.svg`);
        expect(existsSync(file), `m${m}-${c}.svg harus ada`).toBe(true);
        return readFileSync(file, 'utf8');
      });
      // Semua opsi dalam satu set harus berbeda secara isi
      expect(new Set(group).size, `opsi M${m} harus berbeda`).toBe(4);
      for (const svg of group) {
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain('viewBox');
      }
    }
  });

  it('setiap soal membaca aset yang benar-benar ada', () => {
    for (const question of bank) {
      if (question.type === 'listening') {
        const script = listening.find((s) => s.id === question.audioId);
        expect(script, `audioId ${question.audioId} harus terdaftar`).toBeDefined();
        expect(existsSync(read(script!.file))).toBe(true);
      }
      if (question.type === 'story_image') {
        const story = stories.find((s) => s.id === question.sceneId);
        expect(story, `sceneId ${question.sceneId} harus terdaftar`).toBeDefined();
        expect(existsSync(read(story!.path))).toBe(true);
      }
      if (question.type === 'match_image') {
        const number = Number(question.matchingId!.replace('M', ''));
        for (const choice of ['a', 'b', 'c', 'd']) {
          expect(existsSync(read(`images/matching/m${number}-${choice}.svg`))).toBe(true);
        }
      }
    }
  });
});