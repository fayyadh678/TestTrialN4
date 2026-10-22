import type { Choice, Question } from '../lib/types';
import { CATEGORY_BADGES } from '../lib/constants';
import {
  audioPathForQuestion,
  getMatchingScene,
  getPassage,
  getStoryScene,
  matchingNumber,
} from '../lib/dataset';
import { ChoiceCard } from './ChoiceCard';
import { ImageChoiceCard } from './ImageChoiceCard';
import { AssetImage } from './AssetImage';
import { AudioPlayer } from './AudioPlayer';

type Props = {
  question: Question;
  index: number;
  total: number;
  selected: Choice | undefined;
  onSelect: (choice: Choice) => void;
  playsUsed: number;
  onAudioPlayStarted: () => void;
};

/**
 * Menampilkan stimulus + opsi sesuai tipe soal.
 * Tidak pernah menampilkan kunci, pembahasan, atau transkrip sebelum ujian selesai.
 */
export function QuestionPanel({
  question,
  index,
  total,
  selected,
  onSelect,
  playsUsed,
  onAudioPlayStarted,
}: Props) {
  const passage = getPassage(question.passageId);
  const story = getStoryScene(question.sceneId);
  const matching = getMatchingScene(question.matchingId);
  const matchingNo = matchingNumber(question.matchingId);
  const audioPath = audioPathForQuestion(question);

  return (
    <article className="question" data-testid={`question-${question.id}`}>
      <header className="question__head">
        <span className="badge" data-testid="question-badge">
          {CATEGORY_BADGES[question.type]}
        </span>
        <h2 className="question__number">
          Soal {question.id}
          <span className="question__of"> / {total}</span>
          <span className="sr-only"> (posisi {index + 1})</span>
        </h2>
      </header>

      {passage && (
        <section className="passage" aria-label={`Bacaan ${passage.id}`} lang="ja">
          <h3 className="passage__title" lang="ja">
            {passage.title}
          </h3>
          <div className="passage__body">
            {passage.text.split('\n').map((line, lineIndex) => (
              <p key={`${passage.id}-${lineIndex}`}>{line}</p>
            ))}
          </div>
        </section>
      )}

      {story && (
        <figure className="story">
          <AssetImage
            src={story.path}
            alt={`Ilustrasi cerita ${story.id}: empat panel berurutan dari kiri ke kanan.`}
            className="story__image"
          />
          <figcaption className="story__caption">
            Empat panel berurutan (1 → 4). Perhatikan urutan kejadiannya.
          </figcaption>
        </figure>
      )}

      {matching && <p className="question__stimulus" lang="ja">{matching.prompt}</p>}

      <p className="question__prompt" lang="ja">
        {question.prompt}
      </p>

      {question.type === 'listening' && audioPath && (
        <AudioPlayer
          src={audioPath}
          playsUsed={playsUsed}
          onPlayStarted={onAudioPlayStarted}
          label={`Audio soal ${question.id}`}
        />
      )}

      {question.type === 'match_image' && matching && matchingNo != null ? (
        <ImageChoiceCard
          name={String(question.id)}
          selected={selected}
          onSelect={onSelect}
          options={(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => ({
            choice,
            src: `images/matching/m${matchingNo}-${choice.toLowerCase()}.svg`,
            alt: `Pilihan gambar ${choice} untuk soal ${question.id}.`,
          }))}
        />
      ) : (
        <ChoiceCard question={question} selected={selected} onSelect={onSelect} name={String(question.id)} />
      )}

      <p className="sr-only" aria-live="polite">
        {selected ? `Jawaban soal ${question.id}: ${selected}.` : `Soal ${question.id} belum dijawab.`}
      </p>
    </article>
  );
}