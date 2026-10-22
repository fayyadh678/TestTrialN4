import type { Choice } from '../lib/types';
import { AssetImage } from './AssetImage';

export type ImageOption = {
  choice: Choice;
  src: string;
  /** Alt netral, tidak menyebut isi detail jawaban. */
  alt: string;
};

type Props = {
  options: ImageOption[];
  selected: Choice | undefined;
  onSelect: (choice: Choice) => void;
  name: string;
};

const COLUMN_ORDER: Choice[] = ['A', 'B', 'C', 'D'];

/** Empat gambar opsi yang dapat diklik dengan label A-D. */
export function ImageChoiceCard({ options, selected, onSelect, name }: Props) {
  const ordered = COLUMN_ORDER.map((choice) => options.find((o) => o.choice === choice)).filter(
    (o): o is ImageOption => Boolean(o),
  );

  return (
    <ul className="image-choice-list" role="radiogroup" aria-label="Pilihan gambar">
      {ordered.map((option) => {
        const isSelected = selected === option.choice;
        return (
          <li key={option.choice}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={isSelected ? 'image-choice image-choice--selected' : 'image-choice'}
              onClick={() => onSelect(option.choice)}
              data-testid={`image-choice-${name}-${option.choice}`}
            >
              <span className="image-choice__badge" aria-hidden="true">
                {option.choice}
              </span>
              <AssetImage src={option.src} alt={option.alt} className="image-choice__image" />
              <span className="sr-only">Pilihan {option.choice}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}