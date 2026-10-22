import type { Question, ScoreSummary, CategoryScore, Choice } from './types';
import { CATEGORY_LABELS, CATEGORY_ORDER, TOTAL_QUESTIONS } from './constants';

export type Answers = Record<string | number, Choice | undefined>;

/**
 * Aturan skor latihan:
 * - jawaban benar +1
 * - salah atau tidak dijawab +0
 * - persentase = benar / 70 * 100, 1 desimal
 */
export function calculateScore(
  questions: Question[],
  answers: Answers,
  startedAt: number | null,
  completedAt: number | null,
): ScoreSummary {
  let correct = 0;
  let answered = 0;
  const perCategory: Record<string, CategoryScore> = {};

  for (const type of CATEGORY_ORDER) {
    perCategory[type] = {
      type,
      label: CATEGORY_LABELS[type],
      correct: 0,
      total: 0,
    };
  }

  for (const question of questions) {
    const bucket = perCategory[question.type];
    if (bucket) bucket.total += 1;

    const given = answers[question.id] ?? answers[String(question.id)];
    if (given != null) answered += 1;
    if (given === question.answer) {
      correct += 1;
      if (bucket) bucket.correct += 1;
    }
  }

  const total = questions.length || TOTAL_QUESTIONS;
  const wrong = answered - correct;
  const unanswered = total - answered;
  const percent = Number(((correct / TOTAL_QUESTIONS) * 100).toFixed(1));

  return {
    correct,
    wrong,
    unanswered,
    answered,
    total,
    percent,
    durationMs: startedAt != null && completedAt != null ? Math.max(0, completedAt - startedAt) : null,
    categories: CATEGORY_ORDER.map((type) => perCategory[type]).filter((c) => c.total > 0),
  };
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function questionStatusFor(
  question: Question,
  answers: Answers,
): 'correct' | 'wrong' | 'unanswered' {
  const given = answers[question.id] ?? answers[String(question.id)];
  if (given == null) return 'unanswered';
  return given === question.answer ? 'correct' : 'wrong';
}

export function countUnanswered(questions: Question[], answers: Answers): number {
  return questions.filter((q) => (answers[q.id] ?? answers[String(q.id)]) == null).length;
}