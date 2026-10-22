import type { ExamState, ScoreSummary } from '../lib/types';
import { TOTAL_QUESTIONS } from '../lib/constants';
import { formatDuration } from '../lib/score';

type Props = {
  state: ExamState;
  summary: ScoreSummary;
  autoSubmitted: boolean;
  onReview: () => void;
  onRestart: () => void;
};

/** Halaman hasil: ringkasan skor latihan, bukan scaled score resmi. */
export function Results({ state, summary, autoSubmitted, onReview, onRestart }: Props) {
  return (
    <main className="page page--results">
      <header className="results__head">
        <h1 className="results__title">Hasil Latihan</h1>
        <p className="results__note">
          {autoSubmitted
            ? 'Waktu habis, simulasi otomatis diselesaikan. Jawaban yang belum diisi dihitung tidak dijawab.'
            : 'Simulasi selesai. Hasil ini untuk diagnostik latihan, bukan nilai resmi JLPT.'}
        </p>
      </header>

      <section className="results__score" aria-label="Ringkasan skor">
        <p className="results__big" data-testid="result-score">
          {summary.correct}
          <span className="results__big-total"> / {TOTAL_QUESTIONS}</span>
        </p>
        <p className="results__percent" data-testid="result-percent">
          {summary.percent.toFixed(1)}%
        </p>
      </section>

      <dl className="results__stats" data-testid="result-stats">
        <div>
          <dt>Benar</dt>
          <dd>{summary.correct}</dd>
        </div>
        <div>
          <dt>Salah</dt>
          <dd>{summary.wrong}</dd>
        </div>
        <div>
          <dt>Kosong</dt>
          <dd>{summary.unanswered}</dd>
        </div>
        <div>
          <dt>Durasi</dt>
          <dd>{formatDuration(summary.durationMs)}</dd>
        </div>
      </dl>

      <section className="results__categories" aria-labelledby="results-categories-title">
        <h2 id="results-categories-title" className="section-title">
          Benar per kategori
        </h2>
        <ul className="results__list" data-testid="result-categories">
          {summary.categories.map((category) => (
            <li key={category.type} className="results__item">
              <span className="results__item-label">{category.label}</span>
              <span className="results__item-value">
                {category.correct}/{category.total}
              </span>
              <span className="results__item-bar" aria-hidden="true">
                <span
                  className="results__item-fill"
                  style={{ width: `${category.total ? (category.correct / category.total) * 100 : 0}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="results__disclaimer">
        Skor latihan dihitung sederhana: jawaban benar bernilai 1, salah atau kosong bernilai 0
        (persentase = benar / {TOTAL_QUESTIONS} × 100). Ujian JLPT resmi memakai{' '}
        <em>scaled score</em> dengan ambang kelulusan tersendiri, jadi hasil ini tidak menyatakan
        lulus atau gagal JLPT.
      </p>

      <div className="results__actions">
        <button type="button" className="button button--primary button--lg" onClick={onReview} data-testid="go-review">
          Lihat kunci &amp; pembahasan
        </button>
        <button type="button" className="button button--secondary" onClick={onRestart} data-testid="restart-from-results">
          Ulangi latihan
        </button>
      </div>

      <p className="sr-only">Status sesi: {state.status}</p>
    </main>
  );
}