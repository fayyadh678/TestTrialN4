import type { Choice, Question, QuestionType } from '../lib/types';

export function choiceLabel(question: Question, choice: Choice): string {
  return question.options[choice];
}

export function categoryBadgeText(type: QuestionType): string {
  const map: Record<QuestionType, string> = {
    vocabulary: 'Kosakata',
    grammar: 'Grammar',
    reading: 'Reading',
    story_image: 'Gambar',
    match_image: 'Gambar',
    listening: 'Listening',
  };
  return map[type];
}