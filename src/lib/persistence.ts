import type { Choice, ExamState, ExamStatus } from './types';

export const STORAGE_KEY = 'n4-exam-state-v1';
export const SCHEMA_VERSION = 1;

export function createInitialState(now: number): ExamState {
  return {
    schemaVersion: SCHEMA_VERSION,
    status: 'in_progress',
    answers: {},
    startedAt: now,
    deadlineAt: null,
    audioPlayCount: {},
    completedAt: null,
    lastIndex: 0,
  };
}

const VALID_CHOICES: Choice[] = ['A', 'B', 'C', 'D'];

function sanitizeAnswers(input: unknown): Record<string, Choice> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, Choice> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const numeric = Number(key);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 70) continue;
    if (typeof value === 'string' && VALID_CHOICES.includes(value as Choice)) {
      out[String(numeric)] = value as Choice;
    }
  }
  return out;
}

function sanitizePlayCount(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!/^[A-Za-z0-9_-]+$/.test(key)) continue;
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      out[key] = Math.min(99, Math.floor(value));
    }
  }
  return out;
}

function asFiniteNumber(input: unknown): number | null {
  return typeof input === 'number' && Number.isFinite(input) ? input : null;
}

/**
 * Membaca state dari localStorage dengan validasi ketat.
 * JSON rusak / tidak valid -> dikembalikan null supaya pemanggil bisa memulai sesi baru.
 */
export function loadState(storage: Storage | undefined): ExamState | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const candidate = parsed as Record<string, unknown>;
  const version = asFiniteNumber(candidate.schemaVersion);
  if (version !== SCHEMA_VERSION) return null;

  const status: ExamStatus = candidate.status === 'completed' ? 'completed' : 'in_progress';
  const startedAt = asFiniteNumber(candidate.startedAt);
  const deadlineAt = asFiniteNumber(candidate.deadlineAt);
  const completedAt = asFiniteNumber(candidate.completedAt);
  const lastIndex = asFiniteNumber(candidate.lastIndex);

  return {
    schemaVersion: SCHEMA_VERSION,
    status,
    answers: sanitizeAnswers(candidate.answers),
    startedAt,
    deadlineAt,
    audioPlayCount: sanitizePlayCount(candidate.audioPlayCount),
    completedAt,
    lastIndex: lastIndex != null && lastIndex >= 0 && lastIndex < 70 ? Math.floor(lastIndex) : 0,
  };
}

export function saveState(storage: Storage | undefined, state: ExamState): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage penuh atau diblokir: abaikan supaya ujian tetap jalan.
  }
}

export function clearState(storage: Storage | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function safeStorage(): Storage | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const probe = '__n4_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return undefined;
  }
}