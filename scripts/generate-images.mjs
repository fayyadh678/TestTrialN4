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
    wood: '#C8A27A',
    woodDark: '#A67C52',
    dogBrown: '#7C4A21',
    dogMuzzle: '#E8CDA8',
    catGrey: '#8E9AAB',
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

/** Celemek: menutupi bagian depan tubuh, dengan tali leher. */
function apron(x, y, scale = 1, color = C.white) {
  return group(
    `translate(${x} ${y}) scale(${scale})`,
    `<path d="M -7 -50 L 7 -50 L 10 -14 L -10 -14 Z" ${s(color, 'stroke-width="1.8"')} />
     <path d="M -7 -50 L -7 -58 M 7 -50 L 7 -58" fill="none" stroke="${C.ink}" stroke-width="1.8" />
     <path d="M -4 -30 L 4 -30" fill="none" stroke="${C.greyMid}" stroke-width="1.5" />`,
  );
}

/* --------------------------------------------------------------- props */
/** Origin payung terbuka = titik pegangan tangan. Tinggi kanopi ~100 unit. */
function umbrellaOpen(x, y, scale, color, tilt = 0) {
  const inner = `
    <path d="M -46 -60 Q 0 -104 46 -60 Q 34 -67 23 -60 Q 12 -67 0 -60 Q -12 -67 -23 -60 Q -34 -67 -46 -60 Z" ${s(color, 'stroke-width="2.5"')} />
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

/** Garis lantai netral. Ditandai dekoratif agar tidak memengaruhi auto-fit. */
function floorLine(width = 116) {
  return `<path d="M ${-width} -2 L ${width} -2" fill="none" stroke="${C.greyMid}" stroke-width="3" stroke-linecap="round" data-decor="1" />`;
}

/** Garis lantai yang digambar setelah auto-fit, tepat di bawah isi gambar. */
function groundUnder(box, padding = 10) {
  const y = box.y1 + 4;
  return `<path d="M ${(box.x0 - padding).toFixed(1)} ${y.toFixed(1)} L ${(box.x1 + padding).toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${C.greyMid}" stroke-width="3" stroke-linecap="round" data-decor="1" />`;
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

/** Origin = garis lantai di bawah kursi. Kursi dilihat dari samping. */
function chair(x, y, scale, color = C.wood) {
  const seatY = -62; // tinggi permukaan kursi
  const inner = `
    ${roundRect(-46, seatY - 10, 92, 12, 3, color)}
    <path d="M -40 ${seatY + 2} L -42 0" fill="none" stroke="${C.woodDark}" stroke-width="8" stroke-linecap="round" />
    <path d="M 40 ${seatY + 2} L 42 0" fill="none" stroke="${C.woodDark}" stroke-width="8" stroke-linecap="round" />
    <path d="M -40 ${seatY - 10} L -42 -118" fill="none" stroke="${C.woodDark}" stroke-width="8" stroke-linecap="round" />
    <path d="M 40 ${seatY - 10} L 42 -118" fill="none" stroke="${C.woodDark}" stroke-width="8" stroke-linecap="round" />
    ${roundRect(-46, -130, 92, 14, 3, color)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/**
 * Kucing tidur meringkuk, dilihat dari samping. Origin = dasar (lantai).
 * Ciri pembeda utama: telinga SEGITIGA menghadap ke atas.
 */
function catSleeping(x, y, scale, fill = C.catGrey) {
  const inner = `
    <ellipse cx="10" cy="-20" rx="40" ry="19" ${s(fill)} />
    <path d="M 48 -22 Q 70 -32 62 -52" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" />
    <path d="M -30 -44 L -36 -66 L -14 -52 Z" ${s(fill, 'stroke-width="2.5"')} />
    <path d="M -4 -52 L 6 -70 L 18 -48 Z" ${s(fill, 'stroke-width="2.5"')} />
    <circle cx="-14" cy="-34" r="20" ${s(fill)} />
    <path d="M -24 -36 Q -19 -30 -14 -36" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M -8 -36 Q -3 -30 2 -36" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M -13 -27 L -11 -24 L -8 -27" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" />
    ${line(-28, -30, -40, -33, C.ink, 1.8)}${line(-28, -26, -40, -25, C.ink, 1.8)}
    ${line(1, -30, 13, -33, C.ink, 1.8)}${line(1, -26, 13, -25, C.ink, 1.8)}`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/**
 * Anjing tidur meringkuk. Origin = dasar (lantai).
 * Ciri pembeda utama: telinga TEBAL MENGGANTUNG di sisi kepala.
 */
function dogSleeping(x, y, scale, fill = C.dogBrown) {
  const inner = `
    <ellipse cx="10" cy="-20" rx="42" ry="19" ${s(fill)} />
    <path d="M 50 -22 Q 72 -30 64 -50" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" />
    <circle cx="-16" cy="-34" r="20" ${s(fill)} />
    <path d="M -30 -44 Q -46 -40 -44 -22 Q -42 -12 -30 -16 Z" ${s(C.line, 'stroke-width="2.5"')} />
    <path d="M -4 -44 Q 10 -40 8 -22 Q 6 -12 -6 -16 Z" ${s(C.line, 'stroke-width="2.5"')} />
    <ellipse cx="-24" cy="-26" rx="12" ry="8.5" ${s(C.dogMuzzle, 'stroke-width="2"')} />
    <ellipse cx="-29" cy="-27" rx="3.4" ry="2.8" fill="${C.ink}" stroke="none" />
    <path d="M -22 -22 Q -18 -19 -14 -22" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" />
    <path d="M -27 -38 Q -22 -33 -17 -38" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round" />`;
  return group(`translate(${x} ${y}) scale(${scale})`, inner);
}

/** Meja, dilihat dari samping. Origin = garis lantai. Lebih lebar & tinggi dari kursi. */
function lowTable(x, y, scale) {
  const topY = -92;
  const inner = `
    ${roundRect(-92, topY - 14, 184, 16, 4, C.wood)}
    <path d="M -76 ${topY + 2} L -78 0" fill="none" stroke="${C.woodDark}" stroke-width="9" stroke-linecap="round" />
    <path d="M 76 ${topY + 2} L 78 0" fill="none" stroke="${C.woodDark}" stroke-width="9" stroke-linecap="round" />
    <path d="M -76 ${topY - 14} L -78 0" fill="none" stroke="${C.woodDark}" stroke-width="9" stroke-linecap="round" />
    <path d="M 76 ${topY - 14} L 78 0" fill="none" stroke="${C.woodDark}" stroke-width="9" stroke-linecap="round" />`;
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

/* ------------------------------------------- perhitungan bounding box

   Setiap gambar digambar dalam koordinat "manusia" (~92 unit tinggi), lalu
   viewBox-nya dihitung otomatis dari isi gambar supaya ilustrasi selalu
   memenuhi bingkai. Tanpa ini, figur hanya mengisi ~30% frame dan sulit dilihat.
   Elemen dekoratif (garis lantai) ditandai data-decor="1" dan diabaikan saat
   menghitung, sehingga tidak memaksa viewBox jadi terlalu lebar.
------------------------------------------------------------------------- */

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function multiply(m, n) {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  };
}

function parseTransform(value) {
  let m = { ...IDENTITY };
  for (const part of value.matchAll(/(translate|scale|rotate)\s*\(([^)]+)\)/g)) {
    const [kind, rawArgs] = [part[1], part[2]];
    const args = rawArgs.split(/[\s,]+/).filter(Boolean).map(Number);
    if (kind === 'translate') {
      m = multiply(m, { ...IDENTITY, e: args[0] ?? 0, f: args[1] ?? 0 });
    } else if (kind === 'scale') {
      const sx = args[0] ?? 1;
      const sy = args[1] ?? sx;
      m = multiply(m, { ...IDENTITY, a: sx, d: sy });
    } else if (kind === 'rotate') {
      const rad = ((args[0] ?? 0) * Math.PI) / 180;
      m = multiply(m, {
        a: Math.cos(rad),
        b: Math.sin(rad),
        c: -Math.sin(rad),
        d: Math.cos(rad),
        e: 0,
        f: 0,
      });
    }
  }
  return m;
}

function applyMatrix(m, x, y) {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}

function numbersOf(text) {
  return (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Kotak batas lokal sebuah elemen, atau null bila tidak dikenali. */
function localBox(tag, attrText) {
  const get = (name) => {
    const match = new RegExp(`\\b${name}="([^"]*)"`).exec(attrText);
    return match ? Number(match[1]) : null;
  };
  const pointsBox = () => {
    const raw = /\bpoints="([^"]*)"/.exec(attrText);
    if (!raw) return null;
    const nums = numbersOf(raw[1]);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    if (!xs.length) return null;
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  };

  if (tag === 'circle') {
    const cx = get('cx') ?? 0;
    const cy = get('cy') ?? 0;
    const r = get('r') ?? 0;
    return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r };
  }
  if (tag === 'ellipse') {
    const cx = get('cx') ?? 0;
    const cy = get('cy') ?? 0;
    const rx = get('rx') ?? 0;
    const ry = get('ry') ?? 0;
    return { x0: cx - rx, y0: cy - ry, x1: cx + rx, y1: cy + ry };
  }
  if (tag === 'rect') {
    const x = get('x') ?? 0;
    const y = get('y') ?? 0;
    const w = get('width') ?? 0;
    const h = get('height') ?? 0;
    return { x0: x, y0: y, x1: x + w, y1: y + h };
  }
  if (tag === 'line') {
    const x1 = get('x1') ?? 0;
    const y1 = get('y1') ?? 0;
    const x2 = get('x2') ?? 0;
    const y2 = get('y2') ?? 0;
    return { x0: Math.min(x1, x2), y0: Math.min(y1, y2), x1: Math.max(x1, x2), y1: Math.max(y1, y2) };
  }
  if (tag === 'polygon' || tag === 'polyline') {
    return pointsBox();
  }
  if (tag === 'path') {
    const raw = /\bd="([^"]*)"/.exec(attrText);
    if (!raw) return null;
    const nums = numbersOf(raw[1]);
    if (nums.length < 2) return null;
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  if (tag === 'text') {
    const x = get('x') ?? 0;
    const y = get('y') ?? 0;
    return { x0: x, y0: y - 12, x1: x + 20, y1: y + 4 };
  }
  return null;
}

/**
 * Hitung bounding box seluruh bentuk dalam markup SVG.
 * Hanya transform translate/scale/rotate yang dipakai generator ini.
 */
function computeBounds(markup) {
  const stack = [{ matrix: { ...IDENTITY }, decor: 0 }];
  let box = null;
  const tagPattern = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let match;

  const extend = (transformed) => {
    for (const point of transformed) {
      if (!box) box = { x0: point.x, y0: point.y, x1: point.x, y1: point.y };
      else {
        box.x0 = Math.min(box.x0, point.x);
        box.y0 = Math.min(box.y0, point.y);
        box.x1 = Math.max(box.x1, point.x);
        box.y1 = Math.max(box.y1, point.y);
      }
    }
  };

  while ((match = tagPattern.exec(markup))) {
    const [, closing, tag, attrText, selfClosing] = match;
    const current = stack[stack.length - 1];

    if (tag === 'g') {
      if (closing === '/') {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const transform = /\btransform="([^"]*)"/.exec(attrText);
      const decor = /\bdata-decor="1"/.test(attrText);
      stack.push({
        matrix: transform ? multiply(current.matrix, parseTransform(transform[1])) : { ...current.matrix },
        decor: current.decor + (decor ? 1 : 0),
      });
      if (selfClosing === '/') stack.pop();
      continue;
    }

    if (current.decor > 0) continue;
    if (tag === 'defs' || tag === 'clipPath' || tag === 'style') continue;

    const local = localBox(tag, attrText);
    if (!local) continue;

    const pad = 1.5;
    const corners = [
      { x: local.x0 - pad, y: local.y0 - pad },
      { x: local.x1 + pad, y: local.y0 - pad },
      { x: local.x0 - pad, y: local.y1 + pad },
      { x: local.x1 + pad, y: local.y1 + pad },
    ].map((p) => applyMatrix(current.matrix, p.x, p.y));
    extend(corners);
  }

  return box;
}

/**
   * Hitung viewBox yang SELALU persegi dan memuat seluruh isi gambar.
   * Persegi penting agar semua panel tampil dengan skala dan bingkai yang sama.
   */
  function contentViewBox(body, { padding = 14 } = {}) {
    const box = computeBounds(body);
    if (!box) return { x: -50, y: -100, size: 200 };

    const contentW = box.x1 - box.x0;
    const contentH = box.y1 - box.y0;
    const size = Math.max(contentW, contentH, 1) + padding * 2;

    // Pusatkan isi di dalam kotak persegi.
    const centerX = (box.x0 + box.x1) / 2;
    const centerY = (box.y0 + box.y1) / 2;

    return {
      x: centerX - size / 2,
      y: centerY - size / 2,
      size,
    };
  }

  function viewBoxString(vb) {
    return `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.size.toFixed(2)} ${vb.size.toFixed(2)}`;
  }

  /** Bungkus konten dalam SVG persegi dengan viewBox ketat (tanpa transform manual). */
  function fittedSvg({ width, height, body, background = C.offWhite, padding = 14, badge = null }) {
    const vb = contentViewBox(body, { padding });
    const unit = vb.size;

    const badgeMarkup =
      badge == null
        ? ''
        : `<g><circle cx="${(vb.x + unit * 0.085).toFixed(2)}" cy="${(vb.y + unit * 0.085).toFixed(2)}" r="${(unit * 0.062).toFixed(2)}" fill="${C.white}" stroke="${C.ink}" stroke-width="${(unit * 0.008).toFixed(2)}" />
  <text x="${(vb.x + unit * 0.085).toFixed(2)}" y="${(vb.y + unit * 0.085 + unit * 0.026).toFixed(2)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${(unit * 0.075).toFixed(1)}" font-weight="600" fill="${C.ink}">${badge}</text></g>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxString(vb)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" role="img">
  <rect x="${vb.x.toFixed(2)}" y="${vb.y.toFixed(2)}" width="${unit.toFixed(2)}" height="${unit.toFixed(2)}" fill="${background}" />
  ${body}
  ${badgeMarkup}
  <rect x="${vb.x.toFixed(2)}" y="${vb.y.toFixed(2)}" width="${unit.toFixed(2)}" height="${unit.toFixed(2)}" fill="none" stroke="${C.ink}" stroke-width="${(unit * 0.009).toFixed(2)}" />
  </svg>`;
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
  // Setiap panel memakai auto-fit supaya isi cerita selalu memenuhi bingkai.
  const bounds = computeBounds(body);
  const box = bounds ?? { x0: -size / 2, y0: -size, x1: size / 2, y1: 0 };
  const padding = 16;
  const contentW = Math.max(1, box.x1 - box.x0);
  const contentH = Math.max(1, box.y1 - box.y0);
  const scale = Math.min((size - padding * 2) / contentW, (size - padding * 2) / contentH);
  const centerX = (box.x0 + box.x1) / 2;
  const centerY = (box.y0 + box.y1) / 2;
  const tx = size / 2 - centerX * scale;
  const ty = size / 2 - centerY * scale;

  const inner = `
    ${roundRect(0, 0, size, size, 14, background, 'stroke-width="2"')}
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${body}</g>
    <circle cx="26" cy="26" r="14" fill="${C.white}" stroke="${C.ink}" stroke-width="2" />
    <text x="26" y="32" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="${C.ink}">${number}</text>
    <rect x="0" y="0" width="${size}" height="${size}" rx="14" fill="none" stroke="${C.ink}" stroke-width="2.5" />`;
  return group(`translate(${x} ${y})`, inner);
}

/**
 * Satu panel cerita sebagai SVG mandiri (300x300). Dipakai aplikasi supaya
 * setiap panel bisa ditampilkan besar (grid), bukan diperkecil jadi 1/4 lebar.
 */
function singlePanelSvg(number, body) {
  const size = 300;
  return fittedSvg({
    width: size,
    height: size,
    body,
    background: C.offWhite,
    padding: 12,
    badge: number,
  });
}

/** Versi gabungan 2x2, dipakai sebagai fallback / pratinjau cepat. */
function storySvg(panels) {
  const size = 300;
  const gap = 16;
  const totalW = size * 2 + gap * 3;
  const totalH = size * 2 + gap * 3;
  const positions = [
    [gap, gap],
    [gap * 2 + size, gap],
    [gap, gap * 2 + size],
    [gap * 2 + size, gap * 2 + size],
  ];
  const body = panels
    .map((content, i) => panel(i + 1, positions[i][0], positions[i][1], size, content))
    .join('');
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


/* -------------------------------------------------------------- scenes
 * Setiap cerita terdiri dari 4 panel. Panel ditulis sebagai file terpisah
 * (sN-M.svg) agar tiap panel bisa ditampilkan besar, plus gabungan sN.svg.
 *
 * ATURAN KOMPOSISI (penting): auto-fit menormalkan seluruh bounding box, jadi
 * subjek utama harus MENDOMINASI panel. Gunakan skala figur besar (1.3-1.7)
 * dan letakkan properti berdekatan supaya tidak ada ruang kosong yang membuat
 * semuanya mengecil.
 */

const storyPanels = {};

function storyScene1() {
  // 1. Pagi: anak berseragam di rumah, awan gelap di jendela.
  const p1 = [
    person({ x: 18, y: 0, scale: 1.45, shirt: C.blueLight }),
    group('translate(78 -104)', houseWindow(0, 0, 0.72, { dark: true })),
    group('translate(-42 0)', schoolBag(0, 0, 0.92, C.red)),
  ].join('');

  // 2. Ibu menyerahkan payung terlipat; anak memasukkannya ke tas.
  const p2 = [
    person({
      x: -56,
      y: 0,
      scale: 1.4,
      shirt: C.purple,
      hair: C.hairAlt,
      hairStyle: 'bun',
      armRight: [[13, -52], [24, -46], [32, -42]],
    }),
    umbrellaFolded(-17, -60, 1.15, C.blue, -6),
    person({
      x: 62,
      y: 0,
      scale: 1.4,
      shirt: C.blueLight,
      armLeft: [[-13, -52], [-24, -46], [-32, -42]],
    }),
    group('translate(17 0)', schoolBag(0, 0, 0.86, C.red)),
  ].join('');

  // 3. Hujan turun; anak mengeluarkan payung dari tas.
    const p3 = [
      group('translate(-34 -196)', cloudShape(1.0, C.greyDark)),
      rain(30, -190, 1.0, 5),
      person({
        x: 30,
        y: 0,
        scale: 1.4,
        shirt: C.blueLight,
        armRight: [[13, -52], [24, -56], [34, -60]],
      }),
      umbrellaOpen(78, -84, 1.2, C.blue, -6),
      group('translate(-42 0)', schoolBag(0, 0, 0.86, C.red)),
    ].join('');

    // 4. Tiba di gerbang sekolah sambil memegang payung terbuka.
    const p4 = [
      group('translate(86 0)', schoolBuilding(0, 0, 0.72, { gate: true })),
      person({
        x: -46,
        y: 0,
        scale: 1.4,
        shirt: C.blueLight,
        armRight: [[13, -52], [24, -56], [34, -60]],
      }),
      umbrellaOpen(4, -78, 1.1, C.blue, -4),
    ].join('');

  storyPanels.s1 = [p1, p2, p3, p4];
  return [p1, p2, p3, p4];
}

function storyScene2() {
  const apronWoman = (opts) =>
    [
      person({ shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', ...opts }),
      apron(opts.x ?? 0, opts.y ?? 0, opts.scale ?? 1, C.white),
    ].join('');

  // 1. Mencuci tomat di wastafel.
  const p1 = [
    group('translate(56 -74)', counter(0, 0, 0.88, 190)),
    group('translate(70 -74)', sink(0, 0, 0.8)),
    tomato(70, -92, 0.62),
    apronWoman({ x: -52, y: 0, scale: 1.4, armRight: [[13, -52], [36, -58], [66, -70]] }),
  ].join('');

  // 2. Memotong tomat dengan pisau.
  const p2 = [
    group('translate(56 -74)', counter(0, 0, 0.88, 190)),
    group('translate(40 -74)', cuttingBoard(0, 0, 0.8)),
    tomato(24, -88, 0.62),
    tomato(70, -86, 0.38),
    group('translate(66 -140)', knife(0, 0, 0.8, 16)),
    apronWoman({ x: -52, y: 0, scale: 1.4, armRight: [[13, -52], [36, -60], [68, -72]] }),
  ].join('');

  // 3. Memasukkan tomat dan selada ke mangkuk.
  const p3 = [
    group('translate(56 -74)', counter(0, 0, 0.88, 190)),
    group('translate(76 -74)', bowlSalad(0, 0, 0.8)),
    circle(22, -90, 10, C.greenLight),
    apronWoman({ x: -52, y: 0, scale: 1.4, armRight: [[13, -52], [36, -60], [66, -70]] }),
  ].join('');

  // 4. Memakan salad dengan garpu.
  const p4 = [
    group('translate(54 -72)', table(0, 0, 0.66)),
    group('translate(54 -98)', bowlSalad(0, 0, 0.62)),
    group('translate(82 -138)', fork(0, 0, 0.72, 22)),
    apronWoman({ x: -52, y: 0, scale: 1.4, face: 'smile', armRight: [[13, -52], [34, -64], [70, -96]] }),
  ].join('');

  storyPanels.s2 = [p1, p2, p3, p4];
  return [p1, p2, p3, p4];
}

function storyScene3() {
  // 1. Mencari kunci di pintu rumah, saku kosong.
  const p1 = [
    group('translate(84 0)', doorProp(0, 0, 0.9)),
    person({
      x: -34,
      y: 0,
      scale: 1.4,
      shirt: C.green,
      headTilt: 6,
      armRight: [[13, -52], [26, -38], [26, -18]],
    }),
  ].join('');

  // 2. Mengecek isi tas; kunci tidak ada.
  const p2 = [
    group('translate(76 0)', schoolBag(0, 0, 1.05, C.blue)),
    person({
      x: -34,
      y: 0,
      scale: 1.4,
      shirt: C.green,
      headTilt: 8,
      armLeft: [[-13, -52], [-28, -50], [-42, -46]],
      armRight: [[13, -52], [46, -52], [76, -48]],
    }),
  ].join('');

  // 3. Berjongkok, menemukan kunci kuning di bawah meja.
  const p3 = [
    group('translate(-6 -62)', table(0, 0, 0.7)),
    keyProp(24, -32, 0.78),
    person({
      x: 88,
      y: 0,
      scale: 0.95,
      shirt: C.green,
      headTilt: 14,
      legLeft: [[-8, -30], [-24, -16], [-30, -2]],
      legRight: [[8, -30], [12, -10], [14, 0]],
      armLeft: [[-13, -52], [-36, -44], [-58, -30]],
    }),
  ].join('');

  // 4. Keluar dengan kunci di tangan.
  const p4 = [
    group('translate(88 0)', doorProp(0, 0, 0.88)),
    person({
      x: -34,
      y: 0,
      scale: 1.4,
      shirt: C.green,
      face: 'smile',
      armRight: [[13, -52], [30, -62], [44, -78]],
    }),
    group('translate(30 -100)', keyProp(0, 0, 0.9)),
  ].join('');

  storyPanels.s3 = [p1, p2, p3, p4];
  return [p1, p2, p3, p4];
}

function storyScene4() {
  // 1. Menunggu bus di halte.
  const p1 = [
    group('translate(72 0)', busStop(0, 0, 0.86)),
    person({
      x: -38,
      y: 0,
      scale: 1.35,
      shirt: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
    }),
    handBag(-70, -30, 0.76, C.purple),
  ].join('');

  // 2. Bus berhenti di depan perpustakaan.
  const p2 = [
    group('translate(26 -12)', libraryBuilding(0, 0, 0.54)),
    group('translate(-24 0)', bus(0, 0, 0.56)),
  ].join('');

  // 3. Meminjam buku di meja pustakawan.
  const p3 = [
    group('translate(26 0)', deskCounter(0, 0, 0.62)),
    group('translate(38 -52)', book(0, 0, 0.7, C.red)),
    person({ x: 84, y: 0, scale: 0.92, shirt: C.white, hair: C.hairGrey, hairStyle: 'bun' }),
    person({
      x: -62,
      y: 0,
      scale: 1.3,
      shirt: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
      armRight: [[13, -52], [34, -54], [60, -50]],
    }),
  ].join('');

  // 4. Membaca buku itu di rumah.
  const p4 = [
    group('translate(44 -74)', table(0, 0, 0.62)),
    group('translate(44 -96)', book(0, 0, 0.64, C.red)),
    person({
      x: -50,
      y: 0,
      scale: 1.3,
      shirt: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
      face: 'smile',
      armRight: [[13, -52], [30, -58], [48, -68]],
    }),
  ].join('');

  storyPanels.s4 = [p1, p2, p3, p4];
  return [p1, p2, p3, p4];
}

function storyScene5() {
  // 1. Ayah mengambil keranjang kosong di pintu supermarket.
  const p1 = [
    group('translate(82 0)', doorProp(0, 0, 0.86)),
    person({
      x: -38,
      y: 0,
      scale: 1.35,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [26, -46], [34, -40]],
    }),
    group('translate(30 -52)', basket(0, 0, 0.78)),
  ].join('');

  // 2. Memasukkan kotak susu ke keranjang.
  const p2 = [
    person({
      x: -54,
      y: 0,
      scale: 1.35,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [30, -54], [46, -58]],
    }),
    group('translate(6 -66)', basket(0, 0, 0.84)),
    group('translate(76 -66)', milkCarton(0, 0, 0.88)),
  ].join('');

  // 3. Menaruh kotak telur ke keranjang yang sudah berisi susu.
  const p3 = [
    person({
      x: -54,
      y: 0,
      scale: 1.35,
      shirt: C.orange,
      hair: C.hairGrey,
      armRight: [[13, -52], [30, -54], [46, -60]],
    }),
    group('translate(6 -66)', basket(0, 0, 0.86)),
    group('translate(6 -98)', milkCarton(0, 0, 0.52)),
    group('translate(78 -68)', eggCarton(0, 0, 0.86)),
  ].join('');

  // 4. Membayar di kasir; susu dan telur di konter.
  const p4 = [
    group('translate(30 0)', deskCounter(0, 0, 0.66)),
    group('translate(-8 -46)', milkCarton(0, 0, 0.74)),
    group('translate(42 -46)', eggCarton(0, 0, 0.74)),
    group('translate(88 -46)', cashRegister(0, 0, 0.8)),
    person({ x: -74, y: 0, scale: 1.15, shirt: C.blueLight, hair: C.hairAlt, hairStyle: 'bun' }),
  ].join('');

  storyPanels.s5 = [p1, p2, p3, p4];
  return [p1, p2, p3, p4];
}
/* --------------------------------------------------- matching pictures */
const MATCH_SIZE = 280;

function matchSvg(body, { withGround = false } = {}) {
  const bounds = computeBounds(body);
  // Garis lantai ikut digambar di dalam viewBox, sedikit di bawah isi gambar.
  const groundMarkup = withGround && bounds ? groundUnder(bounds, 12) : '';
  return fittedSvg({ width: MATCH_SIZE, height: MATCH_SIZE, body: body + groundMarkup });
}

const ground = `<g data-decor="1"><path d="M -110 0 L 110 0" fill="none" stroke="${C.greyMid}" stroke-width="3" /></g>`;

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
  return matchSvg(walkerWithUmbrella({ x: -40, shirt: C.green, umbrella: C.blue }), { withGround: true });
}
function m1b() {
  return matchSvg(
    walkerWithUmbrella({
      x: -40,
      shirt: C.purple,
      umbrella: C.red,
      hair: C.hairAlt,
      hairStyle: 'long',
      skirt: true,
    }),
    { withGround: true },
  );
}
function m1c() {
  return matchSvg(walkerWithUmbrella({ x: -40, shirt: C.green, umbrella: C.red }), { withGround: true });
}
function m1d() {
  return matchSvg(
    person({
      x: -40,
      y: 0,
      scale: 1,
      shirt: C.green,
      pants: C.line,
      armRight: [[13, -52], [24, -44], [30, -34]],
    }) + handBag(10, -64, 0.95, C.red),
    { withGround: true },
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

/** Satu set gambar M3: hewan tidur di posisi tertentu. */
function m3Scene(body) {
  return matchSvg(body, { withGround: true });
}

// Kursi: permukaan duduk di y=-62, jadi hewan "di atas kursi" diletakkan di y=-72.
const SEAT_TOP = -72;

function m3a() {
  // Kucing tidur DI ATAS kursi.
  return m3Scene(chair(0, 0, 1, C.wood) + catSleeping(0, SEAT_TOP, 0.52));
}
function m3b() {
  // Anjing tidur DI BAWAH kursi.
  return m3Scene(chair(0, 0, 1, C.wood) + dogSleeping(4, 0, 0.8));
}
function m3c() {
  // Kucing tidur DI BAWAH MEJA (bukan kursi).
  return m3Scene(lowTable(0, 0, 1) + catSleeping(4, 0, 0.8));
}
function m3d() {
  // Kucing tidur DI BAWAH kursi — jawaban benar.
  return m3Scene(chair(0, 0, 1, C.wood) + catSleeping(4, 0, 0.8));
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
    bicycleWithRider({ x: -52, shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', skirt: true }) +
      person({ x: 74, y: 0, scale: 0.85, shirt: C.blueLight, pants: C.line }),
    { withGround: true },
  );
}
function m4b() {
  return matchSvg(
    bicycleWithRider({ x: -52, shirt: C.blueLight }) +
      person({ x: 76, y: 0, scale: 0.85, shirt: C.purple, pants: C.line, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
    { withGround: true },
  );
}
function m4c() {
  return matchSvg(
    bicycleWithRider({ x: -74, scale: 0.58, shirt: C.blueLight }) +
      bicycleWithRider({ x: 44, scale: 0.58, shirt: C.purple, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
    { withGround: true },
  );
}
function m4d() {
  return matchSvg(
    person({ x: -48, y: 0, scale: 0.85, shirt: C.blueLight, pants: C.line }) +
      person({ x: 44, y: 0, scale: 0.85, shirt: C.purple, pants: C.line, hair: C.hairAlt, hairStyle: 'long', skirt: true }),
    { withGround: true },
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

let written = 0;

for (const [name, build] of Object.entries(scenes)) {
  // Satu file per panel: s1-1.svg .. s5-4.svg agar tiap panel tampil besar.
  const panels = build();
  panels.forEach((content, index) => {
    const panelSvg = singlePanelSvg(index + 1, content);
    assertXml(`${name}-${index + 1}.svg`, panelSvg);
    writeFileSync(join(storiesDir, `${name}-${index + 1}.svg`), panelSvg, 'utf8');
    written += 1;
  });

  // Gabungan 2x2 tetap tersedia sebagai pratinjau/review.
  const combined = storySvg(panels);
  assertXml(`${name}.svg`, combined);
  writeFileSync(join(storiesDir, `${name}.svg`), combined, 'utf8');
  written += 1;
}

for (const [name, build] of Object.entries(matching)) {
  const svg = build();
  assertXml(`${name}.svg`, svg);
  writeFileSync(join(matchingDir, `${name}.svg`), svg, 'utf8');
  written += 1;
}
console.log(
  `Total gambar: ${written} (${Object.keys(scenes).length * 5} story + ${Object.keys(matching).length} matching)`,
);


