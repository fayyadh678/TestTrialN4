import { describe, expect, it } from 'vitest';
import questions from '../src/data/questions.json';
import passages from '../src/data/passages.json';
import storyScenes from '../src/data/storyScenes.json';
import matchingScenes from '../src/data/matchingScenes.json';
import listeningScripts from '../src/data/listeningScripts.json';
import type { Choice, Question } from '../src/lib/types';

const CHOICES: Choice[] = ['A', 'B', 'C', 'D'];
const bank = questions as unknown as Question[];
const passageList = passages as { id: string; title: string; text: string }[];
const stories = storyScenes as { id: string; path: string; panels: string[] }[];
const matchings = matchingScenes as { id: string; prompt: string; images: Record<string, string> }[];
const listening = listeningScripts as { id: string; file: string; script: string }[];

describe('Bank soal 70 butir', () => {
  it('berisi tepat 70 soal dengan ID unik berurutan 1..70', () => {
    expect(bank).toHaveLength(70);
    const ids = bank.map((q) => q.id);
    expect(ids).toEqual(Array.from({ length: 70 }, (_, i) => i + 1));
    expect(new Set(ids).size).toBe(70);
  });

  it('setiap soal punya 4 opsi A-D yang non-kosong dan tidak duplikat', () => {
    for (const question of bank) {
      expect(Object.keys(question.options).sort()).toEqual(['A', 'B', 'C', 'D']);
      const values = CHOICES.map((c) => question.options[c]);
      for (const value of values) {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(values).size).toBe(4);
      expect(CHOICES).toContain(question.answer);
      expect(question.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('distribusi tipe tepat [20,15,15,5,5,10] sesuai urutan kategori', () => {
    const order = ['vocabulary', 'grammar', 'reading', 'story_image', 'match_image', 'listening'];
    const counts = order.map((type) => bank.filter((q) => q.type === type).length);
    expect(counts).toEqual([20, 15, 15, 5, 5, 10]);

    const expectedTypeFor = (id: number) => {
      if (id <= 20) return 'vocabulary';
      if (id <= 35) return 'grammar';
      if (id <= 50) return 'reading';
      if (id <= 55) return 'story_image';
      if (id <= 60) return 'match_image';
      return 'listening';
    };
    for (const question of bank) {
      expect(question.type).toBe(expectedTypeFor(question.id));
    }
  });

  it('semua referensi passage, scene, matching, dan audio valid', () => {
    const passageIds = new Set(passageList.map((p) => p.id));
    const storyIds = new Set(stories.map((s) => s.id));
    const matchingIds = new Set(matchings.map((m) => m.id));
    const listeningIds = new Set(listening.map((l) => l.id));

    for (const question of bank) {
      if (question.type === 'reading') {
        expect(question.passageId).toBeDefined();
        expect(passageIds.has(question.passageId!)).toBe(true);
      } else {
        expect(question.passageId).toBeUndefined();
      }

      if (question.type === 'story_image') {
        expect(storyIds.has(question.sceneId!)).toBe(true);
      }
      if (question.type === 'match_image') {
        expect(matchingIds.has(question.matchingId!)).toBe(true);
        expect(['A', 'B', 'C', 'D']).toContain(question.answer);
      }
      if (question.type === 'listening') {
        expect(listeningIds.has(question.audioId!)).toBe(true);
      }
    }
  });

  it('reading memakai 7 passage dengan 1-3 soal per passage', () => {
    const reading = bank.filter((q) => q.type === 'reading');
      expect(passageList).toHaveLength(7);
    expect(reading).toHaveLength(15);

      const counts = passageList.map((passage) => reading.filter((q) => q.passageId === passage.id).length);
      for (const [index, count] of counts.entries()) {
        expect(count, `passage ${passageList[index].id} harus punya 1-3 soal`).toBeGreaterThanOrEqual(1);
        expect(count, `passage ${passageList[index].id} harus punya 1-3 soal`).toBeLessThanOrEqual(3);
      }
      expect(counts.reduce((sum, n) => sum + n, 0)).toBe(15);
      // Ada variasi jumlah soal, bukan semua sama
      expect(new Set(counts).size).toBeGreaterThan(1);

      // Soal untuk passage yang sama tampil berurutan (tidak selang-seling).
      const seen = new Set<string>();
      let previous: string | undefined;
      for (const question of reading) {
        if (question.passageId !== previous) {
          expect(seen.has(question.passageId!), `passage ${question.passageId} muncul dua kali terpisah`).toBe(false);
          seen.add(question.passageId!);
          previous = question.passageId;
        }
      }
    });

    it('setiap bacaan cukup panjang untuk level N4', () => {
      for (const passage of passageList) {
        // Bacaan pendek membuat soal terlalu mudah ditebak; jaga panjang minimum.
        expect(passage.text.length, `${passage.id} terlalu pendek`).toBeGreaterThanOrEqual(120);
        expect(passage.title.trim().length).toBeGreaterThan(0);
      }
    });

  it('story_image punya 5 scene dengan 4 panel cerita masing-masing', () => {
    expect(stories).toHaveLength(5);
    for (const story of stories) {
      expect(story.panels).toHaveLength(4);
      expect(story.path).toMatch(/^images\/stories\/s[1-5]\.svg$/);
    }
    const storyQuestions = bank.filter((q) => q.type === 'story_image');
    expect(storyQuestions.map((q) => q.sceneId)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);
  });

  it('match_image punya 5 set dengan 4 deskripsi gambar berbeda', () => {
    expect(matchings).toHaveLength(5);
    for (const matching of matchings) {
      expect(Object.keys(matching.images).sort()).toEqual(['A', 'B', 'C', 'D']);
      const values = CHOICES.map((c) => matching.images[c]);
      expect(new Set(values).size).toBe(4);
      expect(matching.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it('listening punya 10 naskah dengan file audio q61..q70', () => {
    expect(listening).toHaveLength(10);
    const files = listening.map((l) => l.file).sort();
    expect(files).toEqual(Array.from({ length: 10 }, (_, i) => `audio/q${61 + i}.mp3`));

    const listeningQuestions = bank.filter((q) => q.type === 'listening');
    const audioIds = listeningQuestions.map((q) => q.audioId);
    expect(new Set(audioIds).size).toBe(10);
  });

  it('tidak menyertakan label pembicara sebagai teks yang dibacakan', () => {
    // Label tetap ada di data (untuk produksi audio), tetapi prompt soal tidak boleh memuatnya.
    for (const question of bank) {
      expect(question.prompt).not.toMatch(/^(女の人|男の人|先生|学生)：/);
    }
  });
});