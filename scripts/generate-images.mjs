/**
 * Produksi 25 aset SVG:
 *  - public/images/stories/s1.svg .. s5.svg  (5 cerita x 4 panel, 1 file per cerita)
 *  - public/images/matching/m1-a.svg .. m5-d.svg (20 gambar opsi)
 *
 * Gaya: vektor datar, palet terbatas, garis luar tipis, tanpa teks yang membocorkan jawaban.
 * Jalankan: npm run assets:images
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/* ------------------------------------------------------------------ palet */
const C = {
  ink: '#0F172A',
  line: '#334155',
  skin: '#F3C39B',
  hair: '#2F2A26',
  hairAlt: '#4A3B2F',
  hairGrey: '#57534E',
  blue: '#2563EB',
  blueLight: '#93C5FD',
  white: '#FFFFFF',
  offWhite: '#F8FAFC',
  red: '#DC2626',
  yellow: '#FACC15',
  yellowDark: '#EAB308',
  green: '#16A34A',
  greenLight: '#86EFAC',
  grey: '#E2E8F0',
  greyMid: '#CBD5E1',
  greyDark: '#94A3B8',
  brown: '#B45309',
  brownLight: '#D97706',
  purple: '#A855F7',
  orange: '#F97316',
  sky: '#E0F2FE',
};

const STROKE_MAP = {
  stroke: C.ink,
  'stroke-width': '2.5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/**
 * Bangun atribut fill+stroke tanpa duplikasi atribut (XML melarang atribut ganda).
 * Nilai di `extra` menimpa default, mis. 'stroke-width="3"' atau 'stroke="none"'.
 */
function attrs(extra = '') {
  const merged = { ...STROKE_MAP };
  for (const piece of extra.matchAll(/([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    merged[piece[1]] = piece[3] ?? piece[4] ?? '';
  }
  const fill = merged.fill;
  delete merged.fill;
  const pairs = Object.entries(merged).map(([key, value]) => `${key}="${value}"`);
  return `fill="${fill ?? 'none'}" ${pairs.join(' ')}`;
}

const s = (color, extra = '') => attrs(`fill="${color}" ${extra}`);

/* ----------------------------------------------------------- primitives */
function circle(cx, cy, r, fill, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${s(fill, extra)} />`;
}
function rect(x, y, w, h, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ${s(fill, extra)} />`;
}
function roundRect(x, y, w, h, r, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${s(fill, extra)} />`;
}
function path(d, fill, extra = '') {
  return `<path d="${d}" ${s(fill, extra)} />`;
}
function line(x1, y1, x2, y2, color, width = 3) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;
}
function poly(points, fill, extra = '') {
  return `<polygon points="${points}" ${s(fill, extra)} />`;
}
function group(transform, content) {
  return `<g transform="${transform}">${content}</g>`;
}

/* ------------------------------------------------------------- figures */
/**
 * Figur manusia. Origin = titik kaki (0,0); tubuh ke arah atas (y negatif).
 * Tinggi badan ~92 unit, kepala berpusat di (0,-78).
 */
function person(opts = {}) {
  const {
    x = 0,
    y = 0,
    scale = 1,
    shirt = C.blue,
    pants = C.line,
    skin = C.skin,
    hair = C.hair,
    hairStyle = 'short',
    skirt = false,
    armLeft = [[-13, -52], [-22, -34], [-24, -16]],
    armRight = [[13, -52], [22, -34], [24, -16]],
    legLeft = [[-7, -30], [-8, -14], [-8, 0]],
    legRight = [[7, -30], [8, -14], [8, 0]],
    headTilt = 0,
    face = 'neutral',
  } = opts;

  const limb = (points, color, width) =>
    `<polyline points="${points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;

  const feet = (points) => {
    const last = points[points.length - 1];
    return roundRect(last[0] - 9, last[1] - 2, 20, 8, 4, C.ink, 'stroke-width="2"');
  };

  const eyes = () =>
    face === 'closed'
      ? line(-6, -78, -1.5, -78, C.ink, 1.8) + line(1.5, -78, 6, -78, C.ink, 1.8)
      : circle(-4.5, -79, 1.8, C.ink, 'stroke="none"') + circle(4.5, -79, 1.8, C.ink, 'stroke="none"');

  const mouth = () => {
    if (face === 'smile')
      return `<path d="M -4 -71 Q 0 -67 4 -71" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round" />`;
    if (face === 'open') return `<ellipse cx="0" cy="-70" rx="3.5" ry="4.5" fill="${C.ink}" stroke="none" />`;
    return line(-3, -70, 3, -70, C.ink, 1.8);
  };

  const torso = skirt
    ? poly('-13,-54 13,-54 19,-16 -19,-16', shirt, 'stroke-width="2.5"')
    : roundRect(-14, -56, 28, 30, 8, shirt);

  const hairBack =
    hairStyle === 'long'
      ? path(
          'M -15 -24 L -16 -86 Q 0 -100 16 -86 L 15 -24 Q 12 -44 8 -54 L -8 -54 Q -12 -44 -15 -24 Z',
          hair,
          'stroke-width="2"',
        )
      : '';

  const hairFront =
    hairStyle === 'long'
      ? path('M -14 -82 Q 0 -99 14 -82 Q 8 -88 -14 -82 Z', hair, 'stroke-width="2"')
      : hairStyle === 'bun'
        ? circle(0, -95, 8, hair, 'stroke-width="2"') +
          path('M -14 -81 Q 0 -98 14 -81 Q 8 -88 -8 -88 Z', hair, 'stroke-width="2"')
        : path('M -14 -80 Q 0 -99 14 -80 Q 6 -88 -14 -80 Z', hair, 'stroke-width="2"');

  const head = [hairBack, circle(0, -78, 14, skin), hairFront, eyes(), mouth()].join('');

  const content = [
    limb(legLeft, pants, 11),
    limb(legRight, pants, 11),
    feet(legLeft),
    feet(legRight),
    limb(armLeft, skin, 9),
    limb(armRight, skin, 9),
    torso,
    headTilt ? group(`rotate(${headTilt} 0 -72)`, head) : head,
  ].join('');

  return group(`translate(${x} ${y}) scale(${scale})`, content);
}

function apron(x, y, scale = 1, color = C.white) {
  return group(
    `translate(${x} ${y}) scale(${scale})`,
    `<path d="M -12 -56 L 12 -56 L 14 -20 L -14 -20 Z" ${s(color, 'stroke-width="2"')} />
     <path d="M -8 -58 L 8 -58" fill="none" stroke="${C.ink}" stroke-width="2" />`,
  );
}

/* --------------------------------------------------------------- props */
/** Origin payung terbuka = titik pegangan tangan. */
function umbrellaOpen(x, y, scale, color, tilt = 0) {
  const inner = `
    <path d="M -46 -60 Q 0 -106 46 -60 Q 34 -67 23 -60 Q 12 -67 0 -60 Q -12 -67 -23 -60 Q -34 -67 -46 -60 Z" ${s(color, 'stroke-width="2.5"')} />
    <path d="M 0 -100 L 0 -112" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 0 -62 L 0 66" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 0 66 Q 0 76 -10 76" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`, inner);
}

/** Origin payung terlipat = titik pegangan tangan. */
function umbrellaFolded(x, y, scale, color, tilt = 0) {
  const inner = `
    <path d="M 0 -46 L 6 -22 L 0 6 L -6 -22 Z" ${s(color, 'stroke-width="2"')} />
    <path d="M 0 -46 L 0 -54" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 0 6 L 0 20" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 0 20 Q 0 30 -10 30" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M -6 -22 L 6 -22" fill="none" stroke="${C.ink}" stroke-width="1.6" />`;
  return group(`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`, inner);
}

/** Origin = dasar tas. */
function schoolBag(x, y, scale, color = C.red) {
  const inner = `
    ${roundRect(-19, -42, 38, 42, 9, color)}
    ${roundRect(-13, -34, 26, 12, 4, C.offWhite)}
    <path d="M -10 -42 Q -10 -54 0 -54 Q 10 -54 10 -42" fill="none" stroke="${C.ink}" stroke-width="3" />
    <path d="M -6 -42 L -6 -10 M 6 -42 L 6 -10" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity="0.5" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = titik pegangan tas. */
function handBag(x, y, scale, color = C.red) {
  const inner = `
    ${roundRect(-16, -30, 32, 30, 6, color)}
    <path d="M -9 -30 Q 0 -46 9 -30" fill="none" stroke="${C.ink}" stroke-width="3" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function cloudShape(scale, fill) {
  const inner = `
    <circle cx="-16" cy="0" r="12" ${s(fill, 'stroke-width="2"')} />
    <circle cx="0" cy="-7" r="15" ${s(fill, 'stroke-width="2"')} />
    <circle cx="16" cy="0" r="12" ${s(fill, 'stroke-width="2"')} />
    <rect x="-16" y="-2" width="32" height="12" fill="${fill}" stroke="none" />
    <path d="M -28 8 L 28 8" fill="none" stroke="${C.ink}" stroke-width="2" />`;
  return group(`scale(${scale})`, inner);
}

function rain(x, y, scale, count = 5) {
  const lengths = [14, 20, 16, 22, 18, 12, 24, 16];
  const drops = Array.from({ length: count }, (_, i) => {
    const dx = (i % 2) * 30 - 12;
    const dy = Math.floor(i / 2) * 36;
    const len = lengths[i % lengths.length];
    return line(dx, dy, dx - 7, dy + len, C.blue, 3);
  }).join('');
  return group(`translate(${x} ${y}) scale(${scale})`, drops);
}

/** Garis lantai netral, supaya objek tidak tampak melayang. */
function floorLine(width = 116) {
  return `<path d="M ${-width} -2 L ${width} -2" fill="none" stroke="${C.greyMid}" stroke-width="3" stroke-linecap="round" />`;
}

/** Origin = dasar jendela. */
function houseWindow(x, y, scale, { dark = false } = {}) {
  const sky = dark ? C.greyMid : C.sky;
  const inner = `
    ${roundRect(-34, -68, 68, 68, 4, sky, 'stroke-width="3"')}
    <path d="M 0 -68 L 0 0 M -34 -34 L 34 -34" fill="none" stroke="${C.ink}" stroke-width="2.5" />
    ${
      dark
        ? group('translate(-6 -44)', cloudShape(1.05, C.greyDark)) + group('translate(14 -22)', cloudShape(0.72, C.greyDark))
        : `<circle cx="16" cy="-50" r="9" ${s(C.yellow, 'stroke-width="2"')} />`
    }`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar gedung. */
function schoolBuilding(x, y, scale, { gate = false } = {}) {
  const inner = `
    ${rect(-70, -70, 140, 70, C.offWhite, 'stroke-width="3"')}
    ${poly('-78,-70 0,-112 78,-70', C.greyMid, 'stroke-width="3"')}
    ${roundRect(-16, -34, 32, 34, 3, C.brownLight)}
    <circle cx="8" cy="-16" r="2.5" ${s(C.ink, 'stroke-width="1.5"')} />
    ${roundRect(-56, -58, 24, 20, 3, C.blueLight, 'stroke-width="2"')}
    ${roundRect(32, -58, 24, 20, 3, C.blueLight, 'stroke-width="2"')}
    ${roundRect(-24, -100, 48, 26, 3, C.blueLight, 'stroke-width="2"')}
    ${
      gate
        ? `<g><rect x="-96" y="-46" width="10" height="46" ${s(C.greyDark, 'stroke-width="2"')} /><rect x="86" y="-46" width="10" height="46" ${s(C.greyDark, 'stroke-width="2"')} /><path d="M -96 -46 L 96 -46" fill="none" stroke="${C.greyDark}" stroke-width="6" /></g>`
        : ''
    }`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = garis lantai di bawah meja. */
function table(x, y, scale, { items = [] } = {}) {
  const inner = `
    ${roundRect(-62, -8, 124, 12, 3, C.brownLight)}
    <path d="M -50 4 L -52 46 M 50 4 L 52 46" fill="none" stroke="${C.brown}" stroke-width="7" stroke-linecap="round" />
    ${items.join('')}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = garis lantai di bawah kursi. */
function chair(x, y, scale, color = C.brownLight) {
  const inner = `
    ${roundRect(-30, -46, 60, 10, 3, color)}
    <path d="M -28 -46 L -28 0 M 28 -46 L 28 0" fill="none" stroke="${C.brown}" stroke-width="6" stroke-linecap="round" />
    <path d="M -28 -46 L -28 -78 M 28 -46 L 28 -78" fill="none" stroke="${C.brown}" stroke-width="6" stroke-linecap="round" />
    ${roundRect(-30, -84, 60, 10, 3, color)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function apple(x, y, scale) {
  const inner = `
    ${circle(0, 0, 15, C.red)}
    <path d="M 0 -15 Q 2 -24 -6 -26" fill="none" stroke="${C.brown}" stroke-width="3" stroke-linecap="round" />
    <path d="M -1 -18 Q -14 -26 -16 -16 Q -12 -10 -1 -15 Z" ${s(C.green, 'stroke-width="2"')} />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function banana(x, y, scale) {
  const inner = `
    <path d="M -18 -12 Q 4 26 26 -4 Q 20 2 6 4 Q -8 6 -14 -12 Z" ${s(C.yellow)} />
    <path d="M -18 -12 L -22 -18" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 26 -4 L 30 -8" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function catSleeping(x, y, scale, fill = C.greyDark) {
  const inner = `
    <ellipse cx="0" cy="8" rx="34" ry="16" ${s(fill)} />
    <path d="M 30 4 Q 52 -6 46 -22" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" />
    ${circle(-24, 0, 15, fill)}
    ${poly('-36,-8 -32,-24 -22,-12', fill, 'stroke-width="2"')}
    ${poly('-14,-10 -14,-26 -6,-14', fill, 'stroke-width="2"')}
    ${line(-30, 0, -24, 2, C.ink, 2)}
    ${line(-20, 0, -14, 2, C.ink, 2)}
    <path d="M -8 -2 Q -4 2 -8 4" fill="none" stroke="${C.ink}" stroke-width="1.6" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function dogSleeping(x, y, scale, fill = C.brownLight) {
  const inner = `
    <ellipse cx="0" cy="8" rx="36" ry="16" ${s(fill)} />
    <path d="M 32 4 Q 54 0 52 -18" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" />
    ${circle(-26, 2, 15, fill)}
    <path d="M -40 -6 Q -46 8 -34 10 Z" ${s(C.brown, 'stroke-width="2"')} />
    <path d="M -12 -6 Q -6 8 -18 10 Z" ${s(C.brown, 'stroke-width="2"')} />
    <ellipse cx="-32" cy="4" rx="7" ry="5" fill="${C.ink}" stroke="none" />
    ${line(-30, -2, -24, 0, C.ink, 2)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar mangkuk. */
function bowlSalad(x, y, scale) {
  const inner = `
    <path d="M -40 -30 A 40 34 0 0 0 40 -30 Z" ${s(C.offWhite)} />
    <path d="M -40 -30 L 40 -30" fill="none" stroke="${C.ink}" stroke-width="2.5" />
    ${circle(-16, -38, 11, C.red)}
    ${circle(12, -40, 12, C.green)}
    ${circle(0, -46, 10, C.greenLight)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function fork(x, y, scale, tilt = 0) {
  const inner = `
    <path d="M 0 0 L 0 -40" fill="none" stroke="${C.greyMid}" stroke-width="6" stroke-linecap="round" />
    <path d="M -8 -40 L 8 -40 M -8 -40 L -8 -56 M 0 -40 L 0 -58 M 8 -40 L 8 -56" fill="none" stroke="${C.greyMid}" stroke-width="4" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`, inner);
}

function tomato(x, y, scale) {
  const inner = `
    ${circle(0, 0, 17, C.red)}
    <path d="M -8 -14 L 0 -8 L 8 -14 M 0 -16 L 0 -6" fill="none" stroke="${C.green}" stroke-width="4" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar wastafel. */
function sink(x, y, scale) {
  const inner = `
    ${roundRect(-44, -26, 88, 30, 6, C.offWhite)}
    <ellipse cx="0" cy="-22" rx="34" ry="9" fill="${C.sky}" stroke="${C.ink}" stroke-width="2" />
    <path d="M 26 -26 L 26 -60 Q 26 -70 8 -70" fill="none" stroke="${C.greyDark}" stroke-width="7" stroke-linecap="round" />
    ${line(4, -70, -6, -62, C.blue, 3)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = permukaan atas talenan. */
function cuttingBoard(x, y, scale) {
  const inner = `
    ${roundRect(-44, 0, 88, 24, 6, C.brownLight)}
    <path d="M -30 0 L -30 24 M 30 0 L 30 24" fill="none" stroke="${C.brown}" stroke-width="2" opacity="0.6" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

function knife(x, y, scale, tilt = 0) {
  const inner = `
    ${poly('-4,-6 40,-10 40,2 -4,4', C.greyMid, 'stroke-width="2"')}
    ${roundRect(-26, -7, 24, 12, 4, C.ink)}`;
  return group(`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`, inner);
}

/** Origin = tengah kepala kunci. */
function keyProp(x, y, scale, color = C.yellowDark) {
  const inner = `
    ${circle(-14, 0, 9, color, 'stroke-width="2"')}
    <circle cx="-14" cy="0" r="3.5" fill="${C.offWhite}" stroke="none" />
    <path d="M -5 0 L 22 0" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" />
    <path d="M 14 0 L 14 10 M 22 0 L 22 10" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar pintu. */
function doorProp(x, y, scale) {
  const inner = `
    ${roundRect(-40, -96, 80, 96, 4, C.brown, 'stroke-width="3"')}
    ${roundRect(-30, -84, 60, 34, 3, C.brownLight, 'stroke-width="2"')}
    <circle cx="24" cy="-46" r="4" ${s(C.greyDark, 'stroke-width="2"')} />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar kotak susu. */
function milkCarton(x, y, scale) {
  const inner = `
    ${rect(-18, -46, 36, 46, C.white)}
    ${poly('-18,-46 0,-60 18,-46', C.blueLight, 'stroke-width="2.5"')}
    <rect x="-18" y="-30" width="36" height="9" fill="${C.blue}" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar kotak telur. */
function eggCarton(x, y, scale) {
  const domes = [-18, -6, 6, 18]
    .map((dx) => `<path d="M ${dx - 6} -14 Q ${dx} -27 ${dx + 6} -14 Z" ${s(C.offWhite, 'stroke-width="2"')} />`)
    .join('');
  const inner = `
    ${domes}
    ${roundRect(-27, -14, 54, 16, 4, C.greyMid)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar keranjang. */
function basket(x, y, scale) {
  const inner = `
    ${poly('-30,-34 30,-34 22,0 -22,0', C.red, 'stroke-width="2.5"')}
    <path d="M -28 -22 L 28 -22 M -25 -10 L 25 -10" fill="none" stroke="${C.ink}" stroke-width="1.8" opacity="0.5" />
    <path d="M -14 -34 Q 0 -56 14 -34" fill="none" stroke="${C.ink}" stroke-width="3" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = garis lantai sepeda. */
function bicycle(x, y, scale) {
  const inner = `
    ${circle(-30, -14, 15, C.offWhite, 'stroke-width="3"')}
    ${circle(30, -14, 15, C.offWhite, 'stroke-width="3"')}
    <path d="M -30 -14 L -6 -40 L 6 -14 L 30 -14 M -6 -40 L 12 -40 M 12 -40 L 30 -14 M -6 -40 L 6 -14" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" />
    <path d="M 12 -40 L 22 -52" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M 14 -56 L 30 -56" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />
    <path d="M -6 -40 L -10 -50" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar halte. */
function busStop(x, y, scale) {
  const inner = `
    <path d="M -46 -70 L -46 0 M 46 -70 L 46 0" fill="none" stroke="${C.greyDark}" stroke-width="5" stroke-linecap="round" />
    ${roundRect(-56, -84, 112, 16, 3, C.blue, 'stroke-width="2.5"')}
    ${roundRect(-34, -60, 68, 34, 3, C.offWhite, 'stroke-width="2"')}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar bus (bawah roda). */
function bus(x, y, scale) {
  const inner = `
    ${roundRect(-70, -64, 140, 56, 10, C.green)}
    ${roundRect(-56, -54, 30, 20, 3, C.sky, 'stroke-width="2"')}
    ${roundRect(-18, -54, 30, 20, 3, C.sky, 'stroke-width="2"')}
    ${roundRect(20, -54, 34, 32, 3, C.sky, 'stroke-width="2"')}
    ${roundRect(-68, -18, 136, 12, 3, C.offWhite)}
    ${circle(-40, -8, 12, C.ink, 'stroke-width="2"')}
    ${circle(38, -8, 12, C.ink, 'stroke-width="2"')}
    <circle cx="-40" cy="-8" r="5" fill="${C.greyMid}" stroke="none" />
    <circle cx="38" cy="-8" r="5" fill="${C.greyMid}" stroke="none" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar gedung perpustakaan. */
function libraryBuilding(x, y, scale) {
  const inner = `
    ${rect(-84, -78, 168, 78, C.offWhite, 'stroke-width="3"')}
    ${poly('-92,-78 0,-124 92,-78', C.blue, 'stroke-width="3"')}
    ${roundRect(-20, -34, 40, 34, 3, C.brownLight)}
    ${roundRect(-66, -66, 30, 26, 3, C.sky, 'stroke-width="2"')}
    ${roundRect(36, -66, 30, 26, 3, C.sky, 'stroke-width="2"')}
    ${group(
      'translate(0 -100)',
      `${roundRect(-16, -12, 32, 22, 2, C.white, 'stroke-width="2"')}
       <path d="M 0 -12 L 0 10" fill="none" stroke="${C.ink}" stroke-width="2" />`,
    )}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = tengah buku. */
function book(x, y, scale, color = C.red) {
  const inner = `
    ${roundRect(-24, -16, 48, 32, 3, color)}
    ${roundRect(-19, -13, 38, 26, 2, C.offWhite, 'stroke-width="1.5"')}
    <path d="M -19 -6 L 19 -6 M -19 1 L 19 1 M -19 8 L 8 8" fill="none" stroke="${C.greyDark}" stroke-width="2" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = garis lantai di depan konter. */
function deskCounter(x, y, scale) {
  const inner = `
    ${roundRect(-90, -62, 180, 16, 4, C.brownLight)}
    ${rect(-84, -46, 168, 46, C.brown, 'stroke-width="3"')}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Meja kerja dapur; origin = garis lantai. Tinggi permukaan 62 unit. */
function counter(x, y, scale, width = 210) {
  const half = width / 2;
  const inner = `
    ${rect(-half, -62, width, 62, C.offWhite, 'stroke-width="3"')}
    ${roundRect(-half - 4, -68, width + 8, 10, 3, C.brownLight)}
    <path d="M ${-half + 16} -30 L ${half - 16} -30" fill="none" stroke="${C.greyMid}" stroke-width="3" stroke-linecap="round" />
    <path d="M ${-half + 16} -16 L ${half - 16} -16" fill="none" stroke="${C.greyMid}" stroke-width="3" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = dasar mesin kasir. */
function cashRegister(x, y, scale) {
  const inner = `
    ${roundRect(-16, -30, 32, 30, 4, C.greyMid)}
    ${roundRect(-22, -40, 44, 12, 4, C.ink)}
    <path d="M -8 -14 L 8 -14 M -8 -6 L 8 -6" fill="none" stroke="${C.ink}" stroke-width="2" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Origin = tengah kemeja. */
function shirtShape(x, y, scale, color, { onHanger = false } = {}) {
  const inner = `
    ${path('M -34 -40 L -14 -52 Q 0 -44 14 -52 L 34 -40 L 26 -22 L 14 -28 L 14 20 L -14 20 L -14 -28 L -26 -22 Z', color)}
    ${
      onHanger
        ? `<path d="M 0 -52 L 0 -62" fill="none" stroke="${C.ink}" stroke-width="2" /><path d="M -12 -62 L 12 -62 Q 11 -78 0 -78 Q -11 -78 -12 -62 Z" fill="none" stroke="${C.ink}" stroke-width="2" />`
        : ''
    }`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/* -------------------------------------------------------------- layout */
function frame(width, height, background = C.offWhite) {
  return `<rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="${background}" />`;
}

/** Validasi XML minimal: semua tag harus tertutup dan semua atribut punya kutip penutup. */
function assertXml(label, markup) {
  const stack = [];
  const tagPattern = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let match;
  let scanned = 0;
  while ((match = tagPattern.exec(markup))) {
    const [, closing, name, , selfClosing] = match;
    scanned = match.index + match[0].length;
    if (selfClosing === '/') continue;
    if (closing === '/') {
      const open = stack.pop();
      if (open !== name) throw new Error(`${label}: </${name}> tidak cocok dengan <${open}>`);
      continue;
    }
    stack.push(name);
  }
  if (stack.length > 0) throw new Error(`${label}: tag belum tertutup -> ${stack.join(', ')}`);
  if (scanned !== markup.length) {
    throw new Error(`${label}: markup tidak terparse penuh di offset ${scanned}`);
  }
  for (const element of markup.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const text = element[0];
    for (const quote of ['"', "'"]) {
      const count = (text.match(new RegExp(quote, 'g')) || []).length;
      if (count % 2 !== 0) throw new Error(`${label}: kutip tidak seimbang pada ${text.slice(0, 50)}`);
    }
  }
}

function panel(number, x, y, size, body, background = C.offWhite) {
  const inner = `
    ${roundRect(0, 0, size, size, 14, background, 'stroke-width="2"')}
    ${group(`translate(${size / 2} ${Math.round(size * 0.93)})`, body)}
    <circle cx="26" cy="26" r="14" fill="${C.white}" stroke="${C.ink}" stroke-width="2" />
    <text x="26" y="32" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="${C.ink}">${number}</text>
    <rect x="0" y="0" width="${size}" height="${size}" rx="14" fill="none" stroke="${C.ink}" stroke-width="2.5" />`;
  return group(`translate(${x} ${y})`, inner);
}

function storySvg(panels) {
  const size = 300;
  const gap = 20;
  const totalW = size * 4 + gap * 4;
  const totalH = size + gap * 2;
  const body = panels.map((content, i) => panel(i + 1, gap + i * (size + gap), gap, size, content)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" role="img">
${frame(totalW, totalH, C.white)}
${body}
</svg>`;
}

/* -------------------------------------------------------------- scenes */
/* -------------------------------------------------------------- scenes
 * Setiap panel berukuran 300x300; origin konten ada di titik (150, 279) panel
 * (tengah-bawah). Koordinat konten harus berada dalam x âˆˆ [-145, 145] dan
 * y âˆˆ [-275, 0] supaya tidak meluber keluar bingkai panel.
 */

function storyScene1() {
  // 1. Pagi: anak laki-laki berseragam di rumah, awan gelap terlihat di jendela.
  const p1 = [floorLine(120),
    group('translate(88 -160)', houseWindow(0, 0, 0.7, { dark: true })),
    person({ x: -40, y: 0, scale: 1, shirt: C.blueLight }),
    group('translate(-96 0)', schoolBag(0, 0, 0.78, C.red)),
  ].join('');

  // 2. Ibu menyerahkan payung biru terlipat; anak memasukkannya ke tas.
  const p2 = [floorLine(120),
    person({
      x: -92,
      y: 0,
      scale: 0.92,
      shirt: C.purple,
      hair: C.hairAlt,
      hairStyle: 'bun',
      armRight: [[13, -52], [26, -44], [34, -40]],
    }),
    umbrellaFolded(-61, -37, 0.92, C.blue, -6),
    person({
      x: 44,
      y: 0,
      scale: 0.92,
      shirt: C.blueLight,
      armLeft: [[-13, -52], [-26, -44], [-34, -40]],
    }),
    group('translate(4 0)', schoolBag(0, 0, 0.74, C.red)),
  ].join('');

  // 3. Dalam perjalanan hujan turun; anak mengambil payung dari tas.
  const p3 = [floorLine(120),
    group('translate(-24 -252)', cloudShape(0.9, C.greyDark)),
    rain(46, -226, 0.85, 5),
    group('translate(-78 0)', schoolBag(0, 0, 0.68, C.red)),
    person({
      x: 26,
      y: 0,
      scale: 0.94,
      shirt: C.blueLight,
      armRight: [[13, -52], [26, -56], [38, -62]],
    }),
    umbrellaOpen(62, -58, 0.88, C.blue, -6),
  ].join('');

  // 4. Anak tiba di gerbang sekolah sambil memegang payung biru terbuka.
  const p4 = [floorLine(120),
    group('translate(34 -14)', schoolBuilding(0, 0, 0.6, { gate: true })),
    person({
      x: -96,
      y: 0,
      scale: 0.94,
      shirt: C.blueLight,
      armRight: [[13, -52], [26, -56], [36, -60]],
    }),
    umbrellaOpen(-60, -56, 0.86, C.blue, -4),
    group('translate(-92 -244)', cloudShape(0.58, C.greyDark)),
    rain(-52, -222, 0.6, 3),
  ].join('');

  return storySvg([p1, p2, p3, p4]);
}

function storyScene2() {
  const apronWoman = (opts) =>
    [
      person({ shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', ...opts }),
      apron(opts.x ?? 0, opts.y ?? 0, opts.scale ?? 1, C.white),
    ].join('');

  // 1. Perempuan mencuci tomat merah di wastafel yang terpasang di meja kerja.
  const p1 = [floorLine(120),
      group('translate(34 -62)', counter(0, 0, 0.86, 210)),
      group('translate(48 -62)', sink(0, 0, 0.78)),
      tomato(48, -79, 0.62),
      apronWoman({ x: -84, y: 0, scale: 0.92, armRight: [[13, -52], [40, -60], [74, -76]] }),
    ].join('');

    // 2. Perempuan memotong tomat di papan potong dengan pisau.
    const p2 = [floorLine(120),
      group('translate(34 -62)', counter(0, 0, 0.86, 210)),
      group('translate(22 -62)', cuttingBoard(0, 0, 0.78)),
      tomato(6, -76, 0.62),
      tomato(50, -74, 0.38),
      group('translate(44 -132)', knife(0, 0, 0.8, 16)),
      apronWoman({ x: -84, y: 0, scale: 0.92, armRight: [[13, -52], [40, -62], [76, -78]] }),
    ].join('');

    // 3. Perempuan memasukkan tomat dan selada ke dalam mangkuk.
    const p3 = [floorLine(120),
      group('translate(34 -62)', counter(0, 0, 0.86, 210)),
      group('translate(52 -62)', bowlSalad(0, 0, 0.78)),
      circle(-6, -78, 10, C.greenLight),
      apronWoman({ x: -84, y: 0, scale: 0.92, armRight: [[13, -52], [40, -62], [74, -70]] }),
    ].join('');

    // 4. Perempuan memakan salad dari mangkuk dengan garpu.
    const p4 = [floorLine(120),
      group('translate(30 -62)', table(0, 0, 0.62)),
      group('translate(30 -90)', bowlSalad(0, 0, 0.6)),
      group('translate(60 -126)', fork(0, 0, 0.7, 22)),
      apronWoman({ x: -74, y: 0, scale: 0.95, face: 'smile', armRight: [[13, -52], [34, -66], [70, -96]] }),
    ].join('');

  return storySvg([p1, p2, p3, p4]);
}

function storyScene3() {
  // 1. Pria berdiri di pintu rumah mencari kunci dengan saku kosong.
  const p1 = [floorLine(120),
    group('translate(94 0)', doorProp(0, 0, 0.82)),
    person({
      x: -45,
      y: 0,
      scale: 1,
      shirt: C.green,
      headTilt: 6,
      armRight: [[13, -52], [26, -38], [26, -20]],
    }),
  ].join('');

  // 2. Mengecek isi tas; kunci tidak ada.
  const p2 = [floorLine(120),
    group('translate(92 0)', schoolBag(0, 0, 0.88, C.blue)),
    person({
      x: -30,
      y: 0,
      scale: 1,
      shirt: C.green,
      headTilt: 10,
      armLeft: [[-13, -52], [-30, -48], [-44, -42]],
      armRight: [[13, -52], [56, -54], [96, -50]],
    }),
  ].join('');

  // 3. Berjongkok dan menemukan kunci kuning di bawah meja.
  const p3 = [floorLine(120),
    group('translate(0 -52)', table(0, 0, 0.68)),
    keyProp(24, -26, 0.7),
    person({
      x: 104,
      y: 0,
      scale: 0.74,
      shirt: C.green,
      headTilt: 14,
      legLeft: [[-8, -30], [-26, -16], [-34, -2]],
      legRight: [[8, -30], [12, -10], [14, 0]],
      armLeft: [[-13, -52], [-40, -42], [-66, -26]],
    }),
  ].join('');

  // 4. Keluar rumah dengan kunci di tangan.
  const p4 = [floorLine(120),
    group('translate(100 0)', doorProp(0, 0, 0.8)),
    person({
      x: -30,
      y: 0,
      scale: 1,
      shirt: C.green,
      face: 'smile',
      armRight: [[13, -52], [30, -62], [42, -78]],
    }),
    group('translate(46 -80)', keyProp(0, 0, 0.82)),
  ].join('');

  return storySvg([p1, p2, p3, p4]);
}

function storyScene4() {
  // 1. Perempuan muda menunggu bus di halte.
  const p1 = [floorLine(120),
    group('translate(74 0)', busStop(0, 0, 0.8)),
    person({ x: -40, y: 0, scale: 0.9, shirt: C.red, hair: C.hairAlt, hairStyle: 'long' }),
    handBag(-72, -20, 0.7, C.purple),
  ].join('');

  // 2. Bus berhenti di depan gedung perpustakaan yang bertanda ikon buku.
  const p2 = [floorLine(120),
    group('translate(28 -12)', libraryBuilding(0, 0, 0.54)),
    group('translate(-46 0)', bus(0, 0, 0.54)),
  ].join('');

  // 3. Meminjam satu buku di meja pustakawan.
  const p3 = [floorLine(120),
    group('translate(28 0)', deskCounter(0, 0, 0.6)),
    group('translate(38 -48)', book(0, 0, 0.68, C.red)),
    person({ x: 96, y: 0, scale: 0.84, shirt: C.white, hair: C.hairGrey, hairStyle: 'bun' }),
    person({
      x: -78,
      y: 0,
      scale: 0.94,
      shirt: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
      armRight: [[13, -52], [36, -54], [60, -50]],
    }),
  ].join('');

  // 4. Membaca buku tersebut di rumah.
  const p4 = [floorLine(120),
    group('translate(30 -62)', table(0, 0, 0.6)),
    group('translate(30 -76)', book(0, 0, 0.62, C.red)),
    person({
      x: -72,
      y: 0,
      scale: 0.95,
      shirt: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
      face: 'smile',
      armRight: [[13, -52], [30, -60], [46, -70]],
    }),
  ].join('');

  return storySvg([p1, p2, p3, p4]);
}

function storyScene5() {
  // 1. Ayah mengambil keranjang belanja kosong di pintu supermarket.
  const p1 = [floorLine(120),
    group('translate(96 0)', doorProp(0, 0, 0.8)),
    person({
      x: -46,
      y: 0,
      scale: 0.96,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [28, -46], [38, -42]],
    }),
    group('translate(30 -42)', basket(0, 0, 0.7)),
  ].join('');

  // 2. Memasukkan satu kotak susu putih ke keranjang.
  const p2 = [floorLine(120),
    person({
      x: -66,
      y: 0,
      scale: 0.95,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [30, -56], [46, -58]],
    }),
    group('translate(2 -58)', basket(0, 0, 0.76)),
    group('translate(76 -58)', milkCarton(0, 0, 0.82)),
  ].join('');

  // 3. Menaruh kotak berisi telur ke keranjang yang sudah berisi susu.
  const p3 = [floorLine(120),
    person({
      x: -66,
      y: 0,
      scale: 0.95,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [30, -56], [46, -60]],
    }),
    group('translate(2 -58)', basket(0, 0, 0.78)),
    group('translate(2 -88)', milkCarton(0, 0, 0.5)),
    group('translate(80 -60)', eggCarton(0, 0, 0.82)),
  ].join('');

  // 4. Membayar di kasir; susu dan telur terlihat di konter.
  const p4 = [floorLine(120),
    group('translate(24 0)', deskCounter(0, 0, 0.64)),
    group('translate(-14 -40)', milkCarton(0, 0, 0.72)),
    group('translate(36 -40)', eggCarton(0, 0, 0.72)),
    group('translate(78 -40)', cashRegister(0, 0, 0.78)),
    person({ x: -84, y: 0, scale: 0.86, shirt: C.blueLight, hair: C.hairAlt, hairStyle: 'bun' }),
  ].join('');

  return storySvg([p1, p2, p3, p4]);
}

/* --------------------------------------------------- matching pictures */
const MATCH_SIZE = 280;

function matchSvg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MATCH_SIZE} ${MATCH_SIZE}" width="${MATCH_SIZE}" height="${MATCH_SIZE}" role="img">
${frame(MATCH_SIZE, MATCH_SIZE, C.offWhite)}
<g transform="translate(${MATCH_SIZE / 2} ${Math.round(MATCH_SIZE * 0.88)})">${body}</g>
<rect x="0" y="0" width="${MATCH_SIZE}" height="${MATCH_SIZE}" rx="10" fill="none" stroke="${C.ink}" stroke-width="2.5" />
</svg>`;
}

const ground = `<path d="M -110 0 L 110 0" fill="none" stroke="${C.greyMid}" stroke-width="3" />`;

/** Pejalan kaki dengan payung. Origin payung = titik pegangan tangan. */
function walkerWithUmbrella({ x = -40, scale = 1, shirt, umbrella, pants = C.line, hair, hairStyle = 'short', skirt = false }) {
  return [
    person({
      x,
      y: 0,
      scale,
      shirt,
      pants,
      hair,
      hairStyle,
      skirt,
      armRight: [[13, -52], [28, -58], [40, -62]],
    }),
    umbrellaOpen(x + 40 * scale, -62 * scale, scale * 0.95, umbrella, -5),
  ].join('');
}

function m1a() {
  return matchSvg(
    ground + walkerWithUmbrella({ x: -40, shirt: C.green, umbrella: C.blue }),
  );
}
function m1b() {
  return matchSvg(
    ground +
      walkerWithUmbrella({
        x: -40,
        shirt: C.purple,
        umbrella: C.red,
        hair: C.hairAlt,
        hairStyle: 'long',
        skirt: true,
      }),
  );
}
function m1c() {
  return matchSvg(
    ground + walkerWithUmbrella({ x: -40, shirt: C.green, umbrella: C.red }),
  );
}
function m1d() {
  return matchSvg(
    ground +
      person({
        x: -40,
        y: 0,
        scale: 1,
        shirt: C.green,
        pants: C.line,
        armRight: [[13, -52], [24, -44], [30, -34]],
      }) +
      handBag(10, -64, 0.95, C.red),
  );
}

const tableBase = (extraScale = 0.9) => group('translate(0 -41)', table(0, 0, extraScale));

function m2a() {
  return matchSvg(
    tableBase() +
      group('translate(-42 -60)', apple(0, 0, 0.75)) +
      group('translate(-2 -60)', apple(0, 0, 0.75)) +
      group('translate(52 -58)', banana(0, 0, 0.8)),
  );
}
function m2b() {
  return matchSvg(
    tableBase() +
      group('translate(-42 -60)', apple(0, 0, 0.75)) +
      group('translate(-2 -58)', banana(0, 0, 0.8)) +
      group('translate(52 -58)', banana(0, 0, 0.8)),
  );
}
function m2c() {
  return matchSvg(
    tableBase() +
      group('translate(-56 -60)', apple(0, 0, 0.7)) +
      group('translate(-8 -60)', apple(0, 0, 0.7)) +
      group('translate(40 -60)', apple(0, 0, 0.7)),
  );
}
function m2d() {
  return matchSvg(
    tableBase() +
      group('translate(-24 -16)', apple(0, 0, 0.6)) +
      group('translate(4 -16)', apple(0, 0, 0.6)) +
      group('translate(34 -14)', banana(0, 0, 0.6)),
  );
}

function m3a() {
  return matchSvg(
    group('translate(0 0)', chair(0, 0, 1, C.brownLight)) + group('translate(-2 -18)', catSleeping(0, 0, 0.62)),
  );
}
function m3b() {
  return matchSvg(
    group('translate(0 0)', chair(0, 0, 1, C.brownLight)) + group('translate(-2 -18)', dogSleeping(0, 0, 0.62)),
  );
}
function m3c() {
  return matchSvg(
    group('translate(0 -41)', table(0, 0, 0.85, { items: [] })) + group('translate(-6 -20)', catSleeping(0, 0, 0.6)),
  );
}
function m3d() {
  return matchSvg(
    group('translate(0 0)', chair(0, 0, 1, C.brownLight)) + group('translate(-2 -18)', catSleeping(0, 0, 0.62, C.greyMid)),
  );
}

/** Pengendara sepeda: origin sepeda di tanah. */
function bicycleWithRider({ x = -46, scale = 0.8, shirt, hair = C.hair, hairStyle = 'short', skirt = false }) {
  const py = -24;
  const riderScale = 0.6;
  return [
    group(`translate(${x} 0) scale(${scale})`, bicycle(0, 0, 1)),
    person({
      x,
      y: py,
      scale: riderScale,
      shirt,
      hair,
      hairStyle,
      skirt,
      pants: C.line,
      legLeft: [[-7, -30], [-10, -6], [-10.5, 16]],
      legRight: [[7, -30], [11, -24], [13, -16]],
      armLeft: [[-13, -52], [-6, -42], [4, -35]],
      armRight: [[13, -52], [22, -40], [30, -32]],
      headTilt: -4,
    }),
  ].join('');
}

function m4a() {
  return matchSvg(
    ground +
      bicycleWithRider({ x: -52, shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', skirt: true }) +
      person({ x: 74, y: 0, scale: 0.85, shirt: C.blueLight, pants: C.line }),
  );
}
function m4b() {
  return matchSvg(
    ground +
      bicycleWithRider({ x: -52, shirt: C.blueLight }) +
      person({ x: 76, y: 0, scale: 0.85, shirt: C.purple, pants: C.line, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
  );
}
function m4c() {
  return matchSvg(
    ground +
      bicycleWithRider({ x: -74, scale: 0.58, shirt: C.blueLight }) +
      bicycleWithRider({ x: 44, scale: 0.58, shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
  );
}
function m4d() {
  return matchSvg(
    ground +
      person({ x: -48, y: 0, scale: 0.85, shirt: C.blueLight, pants: C.line }) +
      person({ x: 44, y: 0, scale: 0.85, shirt: C.purple, pants: C.line, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
  );
}

function m5body(leftColor, rightColor) {
  return matchSvg(
    group('translate(-64 -150)', shirtShape(0, 0, 0.92, leftColor, { onHanger: true })) +
      group('translate(64 -150)', shirtShape(0, 0, 0.92, rightColor, { onHanger: true })),
  );
}
const m5a = () => m5body(C.white, C.blue);
const m5b = () => m5body(C.red, C.white);
const m5c = () => m5body(C.blue, C.white);
const m5d = () => m5body(C.blue, C.yellow);
/* ---------------------------------------------------------------- write */
const scenes = { s1: storyScene1, s2: storyScene2, s3: storyScene3, s4: storyScene4, s5: storyScene5 };
const matching = {
  'm1-a': m1a,
  'm1-b': m1b,
  'm1-c': m1c,
  'm1-d': m1d,
  'm2-a': m2a,
  'm2-b': m2b,
  'm2-c': m2c,
  'm2-d': m2d,
  'm3-a': m3a,
  'm3-b': m3b,
  'm3-c': m3c,
  'm3-d': m3d,
  'm4-a': m4a,
  'm4-b': m4b,
  'm4-c': m4c,
  'm4-d': m4d,
  'm5-a': m5a,
  'm5-b': m5b,
  'm5-c': m5c,
  'm5-d': m5d,
};

const storiesDir = join(root, 'public', 'images', 'stories');
const matchingDir = join(root, 'public', 'images', 'matching');
mkdirSync(storiesDir, { recursive: true });
mkdirSync(matchingDir, { recursive: true });

for (const [name, build] of Object.entries(scenes)) {
  const svg = build();
  assertXml(`${name}.svg`, svg);
  writeFileSync(join(storiesDir, `${name}.svg`), svg, 'utf8');
}
for (const [name, build] of Object.entries(matching)) {
  const svg = build();
  assertXml(`${name}.svg`, svg);
  writeFileSync(join(matchingDir, `${name}.svg`), svg, 'utf8');
}
console.log('Total gambar:', Object.keys(scenes).length + Object.keys(matching).length);

