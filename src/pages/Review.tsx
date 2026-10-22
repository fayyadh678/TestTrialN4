import { useMemo, useState } from 'react';
import type { Choice, ExamState, Question } from '../lib/types';
import { CATEGORY_BADGES } from '../lib/constants';
import { questions } from '../lib/dataset';
import { audioPathForQuestion, getListeningScript, getMatchingScene, getPassage, getStoryScene, matchingNumber } from '../lib/dataset';
import { questionStatusFor } from '../lib/score';
import { AssetImage } from '../components/AssetImage';
import { AudioPlayer } from '../components/AudioPlayer';

type Filter = 'all' | 'wrong' | 'unanswered' | 'correct';

type Props = {
  state: ExamState;
  onBackToResults: () => void;
  onRestart: () => void;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'wrong', label: 'Salah' },
  { id: 'unanswered', label: 'Belum dijawab' },
  { id: 'correct', label: 'Benar' },
];

function statusLabel(status: 'correct' | 'wrong' | 'unanswered'): string {
  if (status === 'correct') return 'Benar';
  if (status === 'wrong') return 'Salah';
  return 'Tidak diisi';
}

/**
 * Halaman review setelah ujian selesai: kunci, pembahasan, transkrip listening,
 * dan pemutaran audio tanpa batas. Tidak boleh diakses dari layar ujian.
 */
export function Review({ state, onBackToResults, onRestart }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(
    () =>
      questions
        .map((question) => ({ question, status: questionStatusFor(question, state.answers) }))
        .filter((row) => (filter === 'all' ? true : row.status === filter)),
    [filter, state.answers],
  );

  return (
    <main className="page page--review">
      <header className="review__head">
        <h1 className="review__title">Kunci Jawaban &amp; Pembahasan</h1>
        <p className="review__note">
          Kunci, pembahasan, dan transkrip kini boleh ditampilkan karena simulasi sudah
          diselesaikan.
        </p>
      </header>

      <div className="review__toolbar">
        <div className="review__filters" role="group" aria-label="Filter review">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'chip chip--active' : 'chip'}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              data-testid={`filter-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="review__toolbar-actions">
          <button type="button" className="button button--secondary" onClick={onBackToResults} data-testid="back-to-results">
            Kembali ke hasil
          </button>
          <button type="button" className="button button--secondary" onClick={onRestart} data-testid="restart-from-review">
            Ulangi latihan
          </button>
        </div>
      </div>

      <p className="review__count" data-testid="review-count">
        Menampilkan {rows.length} soal.
      </p>

      <ol className="review__list" data-testid="review-list">
        {rows.map(({ question, status }) => (
          <ReviewRow key={question.id} question={question} status={status} answer={state.answers[String(question.id)]} />
        ))}
      </ol>
    </main>
  );
}

function ReviewRow({
  question,
  status,
  answer,
}: {
  question: Question;
  status: 'correct' | 'wrong' | 'unanswered';
  answer: Choice | undefined;
}) {
  const passage = getPassage(question.passageId);
  const story = getStoryScene(question.sceneId);
  const matching = getMatchingScene(question.matchingId);
  const matchingNo = matchingNumber(question.matchingId);
  const listening = getListeningScript(question.audioId);
  const audioPath = audioPathForQuestion(question);

  return (
    <li className={`review-card review-card--${status}`} data-testid={`review-${question.id}`}>
      <header className="review-card__head">
        <h2 className="review-card__title">
          Soal {question.id}
          <span className="review-card__badge">{CATEGORY_BADGES[question.type]}</span>
        </h2>
        <span className={`tag tag--${status}`} data-testid={`review-status-${question.id}`}>
          {statusLabel(status)}
        </span>
      </header>

      {passage && (
        <details className="review-card__passage">
          <summary>Bacaan: {passage.title}</summary>
          <div lang="ja">
            {passage.text.split('\n').map((line, i) => (
              <p key={`${passage.id}-r-${i}`}>{line}</p>
            ))}
          </div>
        </details>
      )}

      {story && (
        <AssetImage
          src={story.path}
          alt={`Ilustrasi cerita untuk soal ${question.id}: empat panel berurutan.`}
          className="review-card__story"
        />
      )}

      {matching && <p className="review-card__stimulus" lang="ja">{matching.prompt}</p>}

      {matching && matchingNo != null && (
        <ul className="review-card__images">
          {(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => (
            <li key={choice}>
              <AssetImage
                src={`images/matching/m${matchingNo}-${choice.toLowerCase()}.svg`}
                alt={matching.images[choice]}
                className="review-card__image"
              />
              <p className="review-card__image-caption">
                <span className={choice === question.answer ? 'tag tag--correct' : 'tag'}>{choice}</span>{' '}
                {matching.images[choice]}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="review-card__prompt" lang="ja">
        {question.prompt}
      </p>

      <ul className="review-card__options">
        {(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => {
          const classes = ['review-option'];
          if (choice === question.answer) classes.push('review-option--correct');
          if (choice === answer && choice !== question.answer) classes.push('review-option--wrong');
          return (
            <li key={choice} className={classes.join(' ')}>
              <span className="review-option__label">{choice}</span>
              <span lang="ja">{question.options[choice]}</span>
              {choice === question.answer && <span className="tag tag--correct">Kunci</span>}
              {choice === answer && choice !== question.answer && <span className="tag tag--wrong">Jawabanmu</span>}
            </li>
          );
        })}
      </ul>

      <p className="review-card__answer">
        Jawabanmu: <strong>{answer ?? 'Tidak diisi'}</strong> • Kunci: <strong>{question.answer}</strong>
      </p>

      <p className="review-card__explanation">{question.explanation}</p>

      {listening && (
        <section className="review-card__audio" aria-label={`Audio dan transkrip soal ${question.id}`}>
          {audioPath && (
            <AudioPlayer
              src={audioPath}
              playsUsed={0}
              onPlayStarted={() => undefined}
              unlimited
              label={`Audio soal ${question.id} (review)`}
            />
          )}
          <h3 className="review-card__transcript-title">Transkrip (Bahasa Jepang)</h3>
          <blockquote className="review-card__transcript" lang="ja">
            {listening.script.split('\n').map((line, i) => (
              <p key={`${listening.id}-${i}`}>{line}</p>
            ))}
          </blockquote>
        </section>
      )}
    </li>
  );
}