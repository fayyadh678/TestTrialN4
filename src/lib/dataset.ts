import questionsJson from '../data/questions.json';
import passagesJson from '../data/passages.json';
import storyScenesJson from '../data/storyScenes.json';
import matchingScenesJson from '../data/matchingScenes.json';
import listeningScriptsJson from '../data/listeningScripts.json';

import type {
  ListeningScript,
  MatchingScene,
  Passage,
  Question,
  StoryScene,
} from './types';

export const questions = questionsJson as unknown as Question[];
export const passages = passagesJson as unknown as Passage[];
export const storyScenes = storyScenesJson as unknown as StoryScene[];
export const matchingScenes = matchingScenesJson as unknown as MatchingScene[];
export const listeningScripts = listeningScriptsJson as unknown as ListeningScript[];

const passageById = new Map(passages.map((p) => [p.id, p]));
const storyById = new Map(storyScenes.map((s) => [s.id, s]));
const matchingById = new Map(matchingScenes.map((m) => [m.id, m]));
const listeningById = new Map(listeningScripts.map((l) => [l.id, l]));

export function getPassage(id: string | undefined): Passage | undefined {
  return id ? passageById.get(id) : undefined;
}

export function getStoryScene(id: string | undefined): StoryScene | undefined {
  return id ? storyById.get(id) : undefined;
}

export function getMatchingScene(id: string | undefined): MatchingScene | undefined {
  return id ? matchingById.get(id) : undefined;
}

export function getListeningScript(id: string | undefined): ListeningScript | undefined {
  return id ? listeningById.get(id) : undefined;
}

/** Nomor urut 1..5 untuk matchingId "M1".."M5" (dipakai untuk nama file SVG). */
export function matchingNumber(id: string | undefined): number | null {
  if (!id) return null;
  const match = /^M(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

/** Nomor soal 61..70 untuk audioId "L1".."L10" (dipakai untuk path mp3 di question.audioId). */
export function audioPathForQuestion(question: Question): string | null {
  const script = getListeningScript(question.audioId);
  return script ? script.file : null;
}