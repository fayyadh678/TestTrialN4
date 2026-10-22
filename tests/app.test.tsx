import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { SCHEMA_VERSION, STORAGE_KEY } from '../src/lib/persistence';
import { EXAM_DURATION_MS } from '../src/lib/constants';

function seedProgress(overrides: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      status: 'in_progress',
      answers: {},
      startedAt: Date.now() - 60_000,
      deadlineAt: Date.now() + EXAM_DURATION_MS - 60_000,
      audioPlayCount: {},
      completedAt: null,
      lastIndex: 0,
      ...overrides,
    }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('Landing', () => {
  it('menampilkan judul, label 70 soal, dan komposisi seksi', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Simulasi JLPT N4' })).toBeTruthy();
    expect(screen.getByTestId('landing-meta').textContent).toContain('70 Soal');
    expect(screen.getByTestId('landing-meta').textContent).toContain('115 Menit');
    expect(screen.getByTestId('landing-meta').textContent).toContain('4 Pilihan');
    expect(screen.getByTestId('landing-composition').textContent).toContain('Kosakata & Kanji');
    expect(screen.getByTestId('landing-composition').textContent).toContain('Mendengarkan');
    expect(screen.getByText('Simulasi tidak resmi')).toBeTruthy();
    expect(screen.getByTestId('start-exam')).toBeTruthy();
  });

  it('menampilkan tombol lanjutkan/mulai dari awal jika ada progres tersimpan', () => {
    seedProgress();
    render(<App />);
    expect(screen.getByTestId('resume-exam')).toBeTruthy();
    expect(screen.getByTestId('restart-exam')).toBeTruthy();
    expect(screen.queryByTestId('start-exam')).toBeNull();
  });
});

describe('Halaman ujian', () => {
  it('memulai dari soal 1 dan menampilkan countdown berbasis deadline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start-exam'));

    expect(screen.getByTestId('question-1')).toBeTruthy();
    expect(screen.getByTestId('header-progress').textContent).toContain('1/70');
    expect(screen.getByTestId('header-timer').textContent).toMatch(/^\d{2,3}:\d{2}$/);
    expect(screen.getByTestId('question-badge').textContent).toBe('Kosakata');
  });

  it('menyimpan jawaban dan tidak kehilangan saat maju/mundur', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start-exam'));

    await user.click(screen.getByTestId('choice-1-C'));
    await user.click(screen.getByTestId('next-question'));
    expect(screen.getByTestId('question-2')).toBeTruthy();

    await user.click(screen.getByTestId('prev-question'));
    expect(screen.getByTestId('choice-1-C').getAttribute('aria-checked')).toBe('true');
  });

  it('jawaban bertahan setelah reload (localStorage)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByTestId('start-exam'));
    await user.click(screen.getByTestId('choice-1-B'));

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).toContain('"1":"B"');
    });

    unmount();
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    expect(screen.getByTestId('choice-1-B').getAttribute('aria-checked')).toBe('true');
  });

  it('countdown tidak reset setelah reload', async () => {
    const user = userEvent.setup();
    const deadline = Date.now() + 60 * 60 * 1000;
    seedProgress({ deadlineAt: deadline });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));

    const text = screen.getByTestId('header-timer').textContent!;
    const [minutes] = text.split(':').map(Number);
    // Sekitar 60 menit tersisa, bukan 115:00
    expect(minutes).toBeLessThanOrEqual(60);
    expect(minutes).toBeGreaterThan(55);
  });

  it('menampilkan dialog konfirmasi dengan jumlah soal belum dijawab', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start-exam'));
    await user.click(screen.getByTestId('finish-exam'));

    const dialog = screen.getByTestId('confirm-dialog');
    expect(dialog.textContent).toContain('Masih ada 70 soal belum dijawab.');
    expect(screen.getByTestId('confirm-back')).toBeTruthy();
    expect(screen.getByTestId('confirm-finish')).toBeTruthy();
  });

  it('dialog menampilkan pesan berbeda saat semua terjawab', async () => {
    const user = userEvent.setup();
    const answers: Record<string, string> = {};
    for (let id = 1; id <= 70; id += 1) answers[String(id)] = 'A';
    seedProgress({ answers });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    await user.click(screen.getByTestId('finish-exam'));
    expect(screen.getByTestId('confirm-dialog').textContent).toContain('Semua soal sudah dijawab.');
  });

  it('menampilkan passage pada soal reading', async () => {
    const user = userEvent.setup();
    seedProgress({ lastIndex: 35 });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    expect(screen.getByTestId('question-36')).toBeTruthy();
    expect(screen.getByText('アルバイト')).toBeTruthy();
  });

  it('menampilkan empat gambar opsi pada soal match_image', async () => {
    const user = userEvent.setup();
    seedProgress({ lastIndex: 55 });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    expect(screen.getByTestId('question-56')).toBeTruthy();
    for (const choice of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`image-choice-56-${choice}`)).toBeTruthy();
    }
  });

  it('tidak menampilkan kunci, pembahasan, atau transkrip selama ujian', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start-exam'));

    expect(screen.queryByText(/berarti/)).toBeNull();
    // Navigasi ke soal listening tanpa transkrip
    await user.click(screen.getByTestId('open-navigator'));
    await user.click(screen.getByTestId('nav-61'));
    expect(screen.getByTestId('question-61')).toBeTruthy();
    expect(screen.queryByText(/transkrip/i)).toBeNull();
    expect(document.body.textContent).not.toContain('パンと卵を買おうと思いました');
  });

  it('menampilkan batas pemutaran audio 2 kali untuk listening', async () => {
    const user = userEvent.setup();
    seedProgress({ lastIndex: 60 });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    expect(screen.getByTestId('audio-counter').textContent).toContain('Sisa pemutaran: 2 dari 2');
  });

  it('navigator menampilkan jumlah soal belum dijawab', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start-exam'));
    await user.click(screen.getByTestId('open-navigator'));
    expect(screen.getByTestId('navigator-summary').textContent).toContain('belum dijawab 70');
  });
});

describe('Hasil dan review', () => {
  it('menghitung skor dan menampilkan ringkasan per kategori', async () => {
    const user = userEvent.setup();
    const answers: Record<string, string> = { '1': 'B', '2': 'C', '3': 'A', '61': 'D' };
    seedProgress({ answers, startedAt: Date.now() - 120_000, completedAt: null });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    await user.click(screen.getByTestId('finish-exam'));
    await user.click(screen.getByTestId('confirm-finish'));

    expect(screen.getByTestId('result-score').textContent).toContain('3');
    expect(screen.getByTestId('result-percent').textContent).toBe('4.3%');
    expect(screen.getByTestId('result-stats').textContent).toContain('Kosong');
    expect(screen.getByTestId('result-categories').textContent).toContain('Kosakata & Kanji');
  });

  it('menampilkan kunci, pembahasan, dan transkrip di review', async () => {
    const user = userEvent.setup();
    seedProgress({ answers: { '1': 'A' } });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    await user.click(screen.getByTestId('finish-exam'));
    await user.click(screen.getByTestId('confirm-finish'));
    await user.click(screen.getByTestId('go-review'));

    expect(screen.getByTestId('review-status-1').textContent).toBe('Salah');
    expect(screen.getByTestId('review-1').textContent).toContain('駅（えき）');
    expect(document.body.textContent).toContain('パンと卵を買おうと思いました');
  });

  it('filter review berfungsi', async () => {
    const user = userEvent.setup();
    seedProgress({ answers: { '1': 'B' } });
    render(<App />);
    await user.click(screen.getByTestId('resume-exam'));
    await user.click(screen.getByTestId('finish-exam'));
    await user.click(screen.getByTestId('confirm-finish'));
    await user.click(screen.getByTestId('go-review'));

    await user.click(screen.getByTestId('filter-unanswered'));
    expect(screen.getByTestId('review-count').textContent).toContain('69');
    await user.click(screen.getByTestId('filter-correct'));
    expect(screen.getByTestId('review-count').textContent).toContain('1');
    await user.click(screen.getByTestId('filter-wrong'));
    expect(screen.getByTestId('review-count').textContent).toContain('0');
  });

  it('membuka langsung halaman review saat sesi sudah completed', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        status: 'completed',
        answers: { '1': 'B' },
        startedAt: Date.now() - 60_000,
        deadlineAt: Date.now() - 1000,
        audioPlayCount: {},
        completedAt: Date.now(),
        lastIndex: 0,
      }),
    );
    render(<App />);
    expect(screen.getByTestId('review-list')).toBeTruthy();
    expect(screen.queryByTestId('start-exam')).toBeNull();
  });

  it('auto-submit saat waktu habis setelah reload', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        status: 'in_progress',
        answers: { '1': 'B' },
        startedAt: Date.now() - 200_000,
        deadlineAt: Date.now() - 1000,
        audioPlayCount: {},
        completedAt: null,
        lastIndex: 0,
      }),
    );
    render(<App />);
    await screen.findByTestId('result-score');
    expect(screen.getByTestId('result-score').textContent).toContain('1');
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).status).toBe('completed');
    });
  });
});