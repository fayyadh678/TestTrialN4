import { formatClock } from '../lib/timer';
import { TOTAL_QUESTIONS } from '../lib/constants';

type Props = {
  currentNumber: number;
  answeredCount: number;
  msRemaining: number;
  categoryLabel: string;
  onOpenNavigator: () => void;
  onFinish: () => void;
};

/** Topbar ujian: logo, progress, countdown, aksi utama. */
export function ExamHeader({
  currentNumber,
  answeredCount,
  msRemaining,
  categoryLabel,
  onOpenNavigator,
  onFinish,
}: Props) {
  const urgent = msRemaining <= 5 * 60 * 1000;

  return (
    <header className="exam-header">
      <div className="exam-header__bar">
        <div className="exam-header__brand">
          <span className="exam-header__logo" aria-hidden="true">
            N4
          </span>
          <span className="exam-header__title">Simulasi JLPT N4</span>
        </div>

        <div className="exam-header__meta">
          <p className="exam-header__progress" data-testid="header-progress">
            {currentNumber}/{TOTAL_QUESTIONS} • dijawab {answeredCount}
          </p>
          <p
            className={urgent ? 'exam-header__timer exam-header__timer--urgent' : 'exam-header__timer'}
            aria-live="polite"
            data-testid="header-timer"
          >
            {formatClock(msRemaining)}
          </p>
        </div>

        <div className="exam-header__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onOpenNavigator}
            data-testid="open-navigator"
          >
            Daftar soal
          </button>
          <button type="button" className="button button--primary" onClick={onFinish} data-testid="finish-exam">
            Selesaikan
          </button>
        </div>
      </div>
      <p className="exam-header__category" data-testid="header-category">
        {categoryLabel}
      </p>
    </header>
  );
}