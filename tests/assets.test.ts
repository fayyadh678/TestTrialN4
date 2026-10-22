import { describe, expect, it } from 'vitest';
import { assetUrl, audioUrl, matchingImageUrl, storyImageUrl } from '../src/lib/assets';
import { CATEGORY_RANGES, MAX_AUDIO_PLAYS, TOTAL_QUESTIONS } from '../src/lib/constants';
import { matchingNumber, audioPathForQuestion, questions } from '../src/lib/dataset';

describe('Helper path aset memakai BASE_URL', () => {
  it('assetUrl selalu memakai import.meta.env.BASE_URL', () => {
    const base = import.meta.env.BASE_URL || '/';
    expect(assetUrl('audio/q61.mp3')).toBe(`${base.replace(/\/+$/, '')}/audio/q61.mp3`);
  });

  it('selalu diawali slash, memakai base, dan tanpa slash ganda', () => {
      const base = import.meta.env.BASE_URL || '/';
      const expectedPrefix = `${base.replace(/\/+$/, '')}/`;
      for (const path of ['audio/q61.mp3', '/images/stories/s1.svg', 'images/matching/m1-a.svg']) {
        const result = assetUrl(path);
        expect(result.startsWith(expectedPrefix)).toBe(true);
        expect(result).not.toContain('//');
        expect(result).not.toMatch(/\/\//);
      }
    });

  it('helper khusus membentuk path yang diharapkan', () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    expect(storyImageUrl('images/stories/s3.svg')).toBe(`${base}/images/stories/s3.svg`);
    expect(matchingImageUrl(2, 'C')).toBe(`${base}/images/matching/m2-c.svg`);
    expect(audioUrl('audio/q70.mp3')).toBe(`${base}/audio/q70.mp3`);
  });
});

describe('Pemetaan helper dataset', () => {
  it('matchingNumber membaca M1..M5', () => {
    expect(matchingNumber('M1')).toBe(1);
    expect(matchingNumber('M5')).toBe(5);
    expect(matchingNumber(undefined)).toBeNull();
    expect(matchingNumber('X2')).toBeNull();
  });

  it('audioPathForQuestion memakai file dari listeningScripts', () => {
    const listening = questions.filter((q) => q.type === 'listening');
    expect(listening).toHaveLength(10);
    expect(listening.map((q) => audioPathForQuestion(q))).toEqual(
      Array.from({ length: 10 }, (_, i) => `audio/q${61 + i}.mp3`),
    );
    expect(audioPathForQuestion(questions[0])).toBeNull();
  });

  it('konstanta konsisten dengan bank soal', () => {
    expect(TOTAL_QUESTIONS).toBe(70);
    expect(MAX_AUDIO_PLAYS).toBe(2);
    const total = CATEGORY_RANGES.reduce((sum, r) => sum + (r.to - r.from + 1), 0);
    expect(total).toBe(70);
    expect(CATEGORY_RANGES.map((r) => r.from)).toEqual([1, 21, 36, 51, 56, 61]);
  });
});