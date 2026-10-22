import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Choice, ExamState, Question } from '../lib/types';
import { CATEGORY_LABELS, EXAM_DURATION_MS, TOTAL_QUESTIONS } from '../lib/constants';
import { questions } from '../lib/dataset';
import { countUnanswered } from '../lib/score';
import { isExpired } from '../lib/timer';
import { ExamHeader } from '../components/ExamHeader';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { QuestionPanel } from '../components/QuestionPanel';

type Props = {
  state: ExamState;
  onChange: (updater: (previous: ExamState) => ExamState) => void;
  onAutoSubmit: () => void;
  onSubmit: () => void;
};

/** Halaman ujian: satu soal aktif, navigasi bebas, countdown berbasis waktu absolut. */
export function Exam({ state, onChange, onAutoSubmit, onSubmit }: Props) {
  const [index, setIndex] = useState(() =>
    state.lastIndex != null && state.lastIndex >= 0 && state.lastIndex < questions.length ? state.lastIndex : 0,
  );
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const question: Question = questions[index];
  const deadlineAt = state.deadlineAt;
  const msRemaining = deadlineAt != null ? Math.max(0, deadlineAt - now) : EXAM_DURATION_MS;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Auto-submit sekali ketika waktu habis (termasuk setelah reload).
  useEffect(() => {
    if (isExpired(state.deadlineAt, now)) onAutoSubmit();
  }, [now, state.deadlineAt, onAutoSubmit]);

  useEffect(() => {
    onChange((previous) => (previous.lastIndex === index ? previous : { ...previous, lastIndex: index }));
  }, [index, onChange]);

  const answeredCount = useMemo(
    () => questions.filter((q) => state.answers[String(q.id)] != null).length,
    [state.answers],
  );

  const handleSelect = useCallback(
    (choice: Choice) => {
      onChange((previous) => ({
        ...previous,
        answers: { ...previous.answers, [String(question.id)]: choice },
      }));
    },
    [onChange, question.id],
  );

  const handleAudioPlayStarted = useCallback(() => {
    const key = question.audioId ?? String(question.id);
    onChange((previous) => ({
      ...previous,
      audioPlayCount: {
        ...previous.audioPlayCount,
        [key]: (previous.audioPlayCount[key] ?? 0) + 1,
      },
    }));
  }, [onChange, question.audioId, question.id]);

  const goTo = useCallback((next: number) => {
    setIndex((current) => Math.min(questions.length - 1, Math.max(0, next === -1 ? current : next)));
    setNavigatorOpen(false);
  }, []);

  const handleFinishClick = useCallback(() => setConfirmOpen(true), []);

  const unanswered = countUnanswered(questions, state.answers);
  const playsUsed = question.audioId ? (state.audioPlayCount[question.audioId] ?? 0) : 0;

  return (
    <div className="exam-layout">
      <ExamHeader
        currentNumber={question.id}
        answeredCount={answeredCount}
        msRemaining={msRemaining}
        categoryLabel={CATEGORY_LABELS[question.type]}
        onOpenNavigator={() => setNavigatorOpen(true)}
        onFinish={handleFinishClick}
      />

      <div className="exam-body">
        <div className="exam-main">
          <div className="progress" aria-hidden="true">
            <div className="progress__bar" style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }} />
          </div>

          <QuestionPanel
            question={question}
            index={index}
            total={questions.length}
            selected={state.answers[String(question.id)]}
            onSelect={handleSelect}
            playsUsed={playsUsed}
            onAudioPlayStarted={handleAudioPlayStarted}
          />

          <nav className="exam-nav" aria-label="Navigasi soal">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={index === 0}
              data-testid="prev-question"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setNavigatorOpen(true)}
              data-testid="open-navigator-bottom"
            >
              Daftar soal
            </button>
            {index === questions.length - 1 ? (
              <button type="button" className="button button--primary" onClick={handleFinishClick} data-testid="finish-bottom">
                Selesaikan
              </button>
            ) : (
              <button
                type="button"
                className="button button--primary"
                onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
                data-testid="next-question"
              >
                Berikutnya
              </button>
            )}
          </nav>
        </div>

        <aside className="exam-side">
          <QuestionNavigator
            questions={questions}
            answers={state.answers}
            currentIndex={index}
            onJump={goTo}
            open={navigatorOpen}
            onClose={() => setNavigatorOpen(false)}
          />
        </aside>
      </div>

      {confirmOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" data-testid="confirm-dialog">
            <h2 id="confirm-title" className="dialog__title">
              Selesaikan simulasi sekarang?
            </h2>
            <p className="dialog__text">
              {unanswered > 0
                ? `Masih ada ${unanswered} soal belum dijawab.`
                : 'Semua soal sudah dijawab.'}
            </p>
            <div className="dialog__actions">
              <button type="button" className="button button--secondary" onClick={() => setConfirmOpen(false)} data-testid="confirm-back">
                Kembali
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setConfirmOpen(false);
                  onSubmit();
                }}
                data-testid="confirm-finish"
              >
                Tetap selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}