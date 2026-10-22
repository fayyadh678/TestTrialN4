import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXAM_DURATION_MS } from './lib/constants';
import { questions } from './lib/dataset';
import { calculateScore } from './lib/score';
import { isExpired } from './lib/timer';
import { createInitialState, clearState, loadState, safeStorage, saveState } from './lib/persistence';
import type { ExamState } from './lib/types';
import { Landing } from './pages/Landing';
import { Exam } from './pages/Exam';
import { Results } from './pages/Results';
import { Review } from './pages/Review';

type Screen = 'landing' | 'exam' | 'results' | 'review';

const storage = safeStorage();

export default function App() {
  const [state, setState] = useState<ExamState | null>(null);
  const [restorable, setRestorable] = useState<ExamState | null>(null);
  const [screen, setScreen] = useState<Screen>('landing');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const stateRef = useRef<ExamState | null>(null);
  stateRef.current = state;

  const persist = useCallback((next: ExamState) => {
      stateRef.current = next;
      setState(next);
      saveState(storage, next);
    }, []);

    // Muat progres tersimpan sekali saat aplikasi dibuka.
    useEffect(() => {
      const saved = loadState(storage);
      if (!saved) return;
      if (saved.status === 'completed') {
        setState(saved);
        setScreen('review');
        return;
      }
      // Sesi yang waktunya sudah lewat saat halaman dibuka langsung diselesaikan,
      // supaya tidak ada soal yang dinilai setelah deadline.
      if (isExpired(saved.deadlineAt, Date.now())) {
        setAutoSubmitted(true);
        persist({
          ...saved,
          status: 'completed',
          completedAt: saved.deadlineAt ?? Date.now(),
        });
        setScreen('results');
        return;
      }
      setRestorable(saved);
    }, [persist]);

    const update = useCallback(
    (updater: (previous: ExamState) => ExamState) => {
      const previous = stateRef.current;
      if (!previous) return;
      persist(updater(previous));
    },
    [persist],
  );

  const startFresh = useCallback(() => {
    clearState(storage);
    setRestorable(null);
    setAutoSubmitted(false);
    persist({ ...createInitialState(Date.now()), deadlineAt: Date.now() + EXAM_DURATION_MS });
    setScreen('exam');
  }, [persist]);

  const resume = useCallback(() => {
    if (!restorable) return;
    const next: ExamState = {
      ...restorable,
      deadlineAt: restorable.deadlineAt ?? (restorable.startedAt ?? Date.now()) + EXAM_DURATION_MS,
    };
    setRestorable(null);
    setAutoSubmitted(false);
    persist(next);
    setScreen('exam');
  }, [persist, restorable]);

  const finish = useCallback(
    (auto: boolean) => {
      const previous = stateRef.current;
      if (!previous || previous.status === 'completed') return;
      setAutoSubmitted(auto);
      persist({ ...previous, status: 'completed', completedAt: Date.now() });
      setScreen('results');
    },
    [persist],
  );

  const summary = useMemo(
    () => (state ? calculateScore(questions, state.answers, state.startedAt, state.completedAt) : null),
    [state],
  );

  if (screen === 'landing') {
    return (
      <Landing
        hasSavedProgress={Boolean(restorable)}
        onStart={startFresh}
        onResume={resume}
        onRestart={() => {
          if (!restorable) {
            startFresh();
            return;
          }
          const answered = Object.keys(restorable.answers).length;
          const confirmed =
            answered === 0 ||
            window.confirm(
              `Mulai dari awal akan menghapus ${answered} jawaban yang tersimpan. Lanjutkan?`,
            );
          if (confirmed) startFresh();
        }}
      />
    );
  }

  if (!state) {
    return (
      <main className="page">
        <p>Menyiapkan sesi…</p>
      </main>
    );
  }

  if (screen === 'exam') {
    return (
      <Exam
        state={state}
        onChange={update}
        onAutoSubmit={() => finish(true)}
        onSubmit={() => finish(false)}
      />
    );
  }

  if (screen === 'results' && summary) {
    return (
      <Results
        state={state}
        summary={summary}
        autoSubmitted={autoSubmitted}
        onReview={() => setScreen('review')}
        onRestart={() => {
          const confirmed = window.confirm(
            'Ulangi latihan akan mengosongkan semua jawaban dan memulai waktu dari awal. Lanjutkan?',
          );
          if (confirmed) startFresh();
        }}
      />
    );
  }

  return (
    <Review
      state={state}
      onBackToResults={() => setScreen('results')}
      onRestart={() => {
              const confirmed = window.confirm(
                'Ulangi latihan akan mengosongkan semua jawaban dan memulai waktu dari awal. Lanjutkan?',
              );
              if (confirmed) startFresh();
            }}
          />
        );
      }