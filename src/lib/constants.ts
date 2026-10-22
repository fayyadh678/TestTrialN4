import type { QuestionType } from './types';

export const EXAM_DURATION_MINUTES = 115;
export const EXAM_DURATION_MS = EXAM_DURATION_MINUTES * 60 * 1000;
export const TOTAL_QUESTIONS = 70;
/** Maksimum pemutaran audio per nomor listening pada mode simulasi. */
export const MAX_AUDIO_PLAYS = 2;

export const CATEGORY_LABELS: Record<QuestionType, string> = {
  vocabulary: 'Kosakata & Kanji',
  grammar: 'Tata Bahasa',
  reading: 'Bacaan',
  story_image: 'Cerita Bergambar',
  match_image: 'Cocokkan Gambar',
  listening: 'Mendengarkan',
};

/** Badge kategori singkat yang netral (bukan status berwarna). */
export const CATEGORY_BADGES: Record<QuestionType, string> = {
  vocabulary: 'Kosakata',
  grammar: 'Grammar',
  reading: 'Reading',
  story_image: 'Gambar',
  match_image: 'Gambar',
  listening: 'Listening',
};

export const CATEGORY_ORDER: QuestionType[] = [
  'vocabulary',
  'grammar',
  'reading',
  'story_image',
  'match_image',
  'listening',
];

export const CATEGORY_RANGES: { type: QuestionType; from: number; to: number }[] = [
  { type: 'vocabulary', from: 1, to: 20 },
  { type: 'grammar', from: 21, to: 35 },
  { type: 'reading', from: 36, to: 50 },
  { type: 'story_image', from: 51, to: 55 },
  { type: 'match_image', from: 56, to: 60 },
  { type: 'listening', from: 61, to: 70 },
];