import { describe, expect, it } from 'vitest';
import { calculateScore, countUnanswered, formatDuration, questionStatusFor } from '../src/lib/score';
import questions from '../src/data/questions.json';
import type { Choice, Question } from '../src/lib/types';

const bank = questions as unknown as Question[];
const CHOICES: Choice[] = ['A', 'B', 'C', 'D'];

function answersWith(pick: (question: Question, index: number) => Choice | undefined) {
  const answers: Record<string, Choice> = {};
  bank.forEach((question, index) => {
    const choice = pick(question, index);
    if (choice) answers[String(question.id)] = choice;
  });
  return answers;
}

describe('Perhitungan skor latihan', () => {
  it('semua benar => 70 dari 70 dan 100.0%', () => {
    const summary = calculateScore(bank, answersWith((q) => q.answer), 0, 60_000);
    expect(summary.correct).toBe(70);
    expect(summary.wrong).toBe(0);
    expect(summary.unanswered).toBe(0);
    expect(summary.percent).toBe(100);
    expect(summary.durationMs).toBe(60_000);
  });

  it('semua kosong => 0 benar, 70 kosong, 0.0%', () => {
    const summary = calculateScore(bank, {}, 0, 1000);
    expect(summary.correct).toBe(0);
    expect(summary.wrong).toBe(0);
    expect(summary.unanswered).toBe(70);
    expect(summary.answered).toBe(0);
    expect(summary.percent).toBe(0);
  });

  it('membulatkan persentase ke 1 desimal', () => {
    const answers = answersWith((q, index) => (index < 1 ? q.answer : undefined));
    const summary = calculateScore(bank, answers, 0, 0);
    expect(summary.correct).toBe(1);
    expect(summary.percent).toBe(1.4);
  });

  it('jawaban salah tidak menambah skor tetapi dihitung sebagai salah', () => {
    const answers = answersWith((q) => CHOICES.find((c) => c !== q.answer));
    const summary = calculateScore(bank, answers, null, null);
    expect(summary.correct).toBe(0);
    expect(summary.wrong).toBe(70);
    expect(summary.unanswered).toBe(0);
    expect(summary.percent).toBe(0);
  });

  it('ringkasan benar per kategori mengikuti urutan 6 kategori', () => {
    const summary = calculateScore(bank, answersWith((q) => q.answer), 0, 0);
    expect(summary.categories.map((c) => c.total)).toEqual([20, 15, 15, 5, 5, 10]);
    expect(summary.categories.map((c) => c.correct)).toEqual([20, 15, 15, 5, 5, 10]);
    expect(summary.categories[0].label).toContain('Kosakata');
  });

  it('durasi null bila sesi belum selesai', () => {
    const summary = calculateScore(bank, {}, 1000, null);
    expect(summary.durationMs).toBeNull();
    expect(formatDuration(null)).toBe('—');
  });

  it('formatDuration memakai MM:SS dan HH:MM:SS saat perlu', () => {
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(115 * 60 * 1000)).toBe('1:55:00');
  });

  it('questionStatusFor dan countUnanswered konsisten', () => {
    const first = bank[0];
    const second = bank[1];
    const bad: Choice = CHOICES.find((c) => c !== second.answer)!;
    const answers = { [String(first.id)]: first.answer, [String(second.id)]: bad };
    expect(questionStatusFor(first, answers)).toBe('correct');
    expect(questionStatusFor(second, answers)).toBe('wrong');
    expect(questionStatusFor(bank[2], answers)).toBe('unanswered');
    expect(countUnanswered(bank, answers)).toBe(68);
  });
});