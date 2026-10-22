import { describe, expect, it, beforeEach } from 'vitest';
import { createInitialState, loadState, saveState, clearState, STORAGE_KEY, SCHEMA_VERSION } from '../src/lib/persistence';
import { formatClock, isExpired } from '../src/lib/timer';
import type { ExamState } from '../src/lib/types';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe('Persistensi state', () => {
  it('menyimpan dan memuat state lengkap', () => {
    const state: ExamState = {
      ...createInitialState(1000),
      deadlineAt: 1000 + 115 * 60 * 1000,
      answers: { '1': 'B', '61': 'B' },
      audioPlayCount: { L1: 2 },
      lastIndex: 60,
    };
    saveState(storage, state);
    const loaded = loadState(storage);
    expect(loaded).toEqual(state);
  });

  it('mengabaikan JSON rusak', () => {
    storage.setItem(STORAGE_KEY, '{bukan json');
    expect(loadState(storage)).toBeNull();
  });

  it('mengabaikan versi schema yang tidak dikenal', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, status: 'in_progress' }));
    expect(loadState(storage)).toBeNull();
  });

  it('membersihkan nilai tidak valid (opsi di luar A-D, id di luar 1..70)', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        status: 'in_progress',
        answers: { '1': 'B', '2': 'E', '0': 'A', '71': 'A', abc: 'C', '3': 5 },
        audioPlayCount: { L1: 3, 'bad key!': 2, L2: 'x', L3: -1 },
        startedAt: 10,
        deadlineAt: 20,
        completedAt: null,
        lastIndex: 999,
      }),
    );
    const loaded = loadState(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.answers).toEqual({ '1': 'B' });
    expect(loaded!.audioPlayCount).toEqual({ L1: 3 });
    expect(loaded!.lastIndex).toBe(0);
  });

  it('status tidak dikenal diperlakukan sebagai in_progress', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, status: 'weird' }));
    expect(loadState(storage)!.status).toBe('in_progress');
  });

  it('clearState menghapus data', () => {
    saveState(storage, createInitialState(1));
    clearState(storage);
    expect(loadState(storage)).toBeNull();
  });

  it('tidak menyimpan data pribadi: hanya field yang ditentukan', () => {
    const state = createInitialState(5);
    saveState(storage, state);
    const raw = JSON.parse(storage.getItem(STORAGE_KEY)!);
    expect(Object.keys(raw).sort()).toEqual(
      ['answers', 'audioPlayCount', 'completedAt', 'deadlineAt', 'lastIndex', 'schemaVersion', 'startedAt', 'status'].sort(),
    );
  });
});

describe('Countdown berbasis waktu absolut', () => {
  it('format MM:SS saat kurang dari 1 jam', () => {
    expect(formatClock(115 * 60 * 1000)).toBe('115:00');
    expect(formatClock(65_000)).toBe('01:05');
    expect(formatClock(0)).toBe('00:00');
  });

  it('memakai format total menit:detik (MM:SS) konsisten', () => {
      expect(formatClock(5999 * 60 * 1000)).toBe('5999:00');
      expect(formatClock(6000 * 60 * 1000)).toBe('6000:00');
    });

  it('tidak pernah menampilkan waktu negatif', () => {
    expect(formatClock(-5000)).toBe('00:00');
  });

  it('isExpired benar setelah deadline terlewat', () => {
    expect(isExpired(1000, 999)).toBe(false);
    expect(isExpired(1000, 1000)).toBe(true);
    expect(isExpired(1000, 5000)).toBe(true);
    expect(isExpired(null, 9999)).toBe(false);
  });

  it('sisa waktu setelah reload dihitung dari deadlineAt, bukan dari awal', () => {
    const startedAt = 1_000_000;
    const state: ExamState = {
      ...createInitialState(startedAt),
      deadlineAt: startedAt + 115 * 60 * 1000,
    };
    saveState(storage, state);
    const loaded = loadState(storage)!;
    const now = startedAt + 30 * 60 * 1000; // 30 menit berjalan
    expect(loaded.deadlineAt! - now).toBe(85 * 60 * 1000);
    expect(formatClock(loaded.deadlineAt! - now)).toBe('85:00');
  });
});