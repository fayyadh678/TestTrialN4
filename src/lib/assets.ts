/**
 * Helper path aset. Wajib memakai import.meta.env.BASE_URL supaya tidak 404
 * di GitHub Pages project path (/TestTrialN4/).
 */
const base = import.meta.env.BASE_URL || '/';

function join(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `${base.replace(/\/+$/, '')}/${clean}`;
}

export function assetUrl(relativePath: string): string {
  return join(relativePath);
}

export function storyImageUrl(path: string): string {
  // storyScenes.json menyimpan path relatif seperti "images/stories/s1.svg"
  return join(path);
}

export function matchingImageUrl(matchingNumber: number, choice: string): string {
  return join(`images/matching/m${matchingNumber}-${choice.toLowerCase()}.svg`);
}

export function audioUrl(relativePath: string): string {
  // listeningScripts.json menyimpan path relatif seperti "audio/q61.mp3"
  return join(relativePath);
}