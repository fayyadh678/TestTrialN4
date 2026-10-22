import type { Choice, Question } from '../lib/types';

type Props = {
  question: Question;
  selected: Choice | undefined;
  onSelect: (choice: Choice) => void;
  name: string;
};

const CHOICES: Choice[] = ['A', 'B', 'C', 'D'];

/** Kartu pilihan A-D untuk soal teks (semantik button, fokus jelas). */
export function ChoiceCard({ question, selected, onSelect, name }: Props) {
  return (
    <ul className="choice-list" role="radiogroup" aria-label="Pilihan jawaban">
      {CHOICES.map((choice) => {
        const isSelected = selected === choice;
        return (
          <li key={choice}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={isSelected ? 'choice choice--selected' : 'choice'}
              onClick={() => onSelect(choice)}
              data-testid={`choice-${name}-${choice}`}
            >
              <span className="choice__label" aria-hidden="true">
                {choice}
              </span>
              <span className="choice__text" lang="ja">
                {question.options[choice]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}