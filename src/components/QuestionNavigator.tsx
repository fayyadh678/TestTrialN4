import type { Choice, Question } from '../lib/types';
import { CATEGORY_BADGES } from '../lib/constants';

type Props = {
  questions: Question[];
  answers: Record<string, Choice>;
  currentIndex: number;
  onJump: (index: number) => void;
  open: boolean;
  onClose: () => void;
};

/** Grid mini-navigasi nomor soal, dibuka lewat tombol "Daftar soal" pada mobile. */
export function QuestionNavigator({ questions, answers, currentIndex, onJump, open, onClose }: Props) {
  const unanswered = questions.filter((q) => answers[String(q.id)] == null).length;

  let lastType: string | null = null;

  return (
    <nav
      className={open ? 'navigator navigator--open' : 'navigator'}
      aria-label="Daftar soal"
      data-testid="question-navigator"
    >
      <div className="navigator__head">
        <p className="navigator__summary" data-testid="navigator-summary">
          Dijawab {questions.length - unanswered} dari {questions.length} • belum dijawab {unanswered}
        </p>
        <button type="button" className="button button--ghost" onClick={onClose} data-testid="close-navigator">
          Tutup
        </button>
      </div>
      <ol className="navigator__grid">
        {questions.map((question, index) => {
          const showHeader = question.type !== lastType;
          lastType = question.type;
          const answered = answers[String(question.id)] != null;
          const classes = ['navigator__item'];
          if (answered) classes.push('navigator__item--answered');
          if (index === currentIndex) classes.push('navigator__item--current');
          return (
            <li key={question.id}>
              {showHeader && <p className="navigator__group">{CATEGORY_BADGES[question.type]}</p>}
              <button
                type="button"
                className={classes.join(' ')}
                aria-current={index === currentIndex ? 'true' : undefined}
                aria-label={`Soal ${question.id}${answered ? ' (sudah dijawab)' : ' (belum dijawab)'}`}
                onClick={() => onJump(index)}
                data-testid={`nav-${question.id}`}
              >
                {question.id}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}