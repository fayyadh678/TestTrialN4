export type Choice = 'A' | 'B' | 'C' | 'D';

export type QuestionType =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'story_image'
  | 'match_image'
  | 'listening';

export type Question = {
  id: number;
  type: QuestionType;
  prompt: string;
  options: Record<Choice, string>;
  answer: Choice;
  explanation: string;
  passageId?: string;
  sceneId?: string;
  matchingId?: string;
  audioId?: string;
};

export type Passage = {
  id: string;
  title: string;
  text: string;
};

export type StoryScene = {
  id: string;
  path: string;
  name: string;
  panels: string[];
  visualQuestion: string;
};

export type MatchingScene = {
  id: string;
  prompt: string;
  images: Record<Choice, string>;
};

export type ListeningScript = {
  id: string;
  file: string;
  task: string;
  script: string;
  speakerNotes: string;
};

export type ExamStatus = 'in_progress' | 'completed';

/** State yang disimpan di localStorage. Tidak ada data pribadi. */
export type ExamState = {
  schemaVersion: number;
  status: ExamStatus;
  answers: Record<string, Choice>;
  startedAt: number | null;
  deadlineAt: number | null;
  audioPlayCount: Record<string, number>;
  completedAt: number | null;
  /** Kategori soal terakhir yang dibuka, dipakai agar refresh kembali ke soal yang sama. */
  lastIndex?: number;
};

export type CategoryScore = {
  type: QuestionType;
  label: string;
  correct: number;
  total: number;
};

export type ScoreSummary = {
  correct: number;
  wrong: number;
  unanswered: number;
  answered: number;
  total: number;
  percent: number;
  durationMs: number | null;
  categories: CategoryScore[];
};