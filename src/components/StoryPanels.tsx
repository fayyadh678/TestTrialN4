import { AssetImage } from './AssetImage';

type Props = {
  /** sceneId seperti "S1" -> panel s1-1.svg .. s1-4.svg */
  sceneId: string;
  name: string;
};

/**
 * Empat panel cerita sebagai gambar terpisah, ditata grid.
 * Panel terpisah jauh lebih jelas daripada satu gambar gabungan yang
 * diperkecil menjadi seperempat lebar.
 */
export function StoryPanels({ sceneId, name }: Props) {
  const slug = sceneId.toLowerCase();
  const panels = [1, 2, 3, 4];

  return (
    <div className="story-panels" data-testid={`story-panels-${sceneId}`}>
      {panels.map((number) => (
        <figure key={number} className="story-panel">
          <AssetImage
            src={`images/stories/${slug}-${number}.svg`}
            alt={`Panel ${number} dari cerita ${name}.`}
            className="story-panel__image"
          />
          <figcaption className="story-panel__number">Panel {number}</figcaption>
        </figure>
      ))}
    </div>
  );
}