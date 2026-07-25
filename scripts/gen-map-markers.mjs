/**
 * Rasterize the discovery-map marker sprites: an emerald chip with a white
 * Phosphor glyph per place category, plus a white teardrop "selected" variant
 * with the glyph and outline in emerald (TripAdvisor-style). Same pipeline as
 * gen-tab-icons (@resvg/resvg-js → PNG at 1x/2x/3x); @rnmapbox/maps resolves
 * the density through the normal RN asset system.
 *
 * Run: npm run gen:map-markers   (after changing CATEGORIES below)
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GREEN = '#12664F';
const WHITE = '#FFFFFF';

// key = icon-image name used by the SymbolLayer ("<key>" / "<key>-selected")
const CATEGORIES = [
  { key: 'mosque', glyph: 'mosque-fill' },
  { key: 'school', glyph: 'graduation-cap-fill' },
  { key: 'halal-food', glyph: 'fork-knife-fill' },
  { key: 'event', glyph: 'calendar-dots-fill' },
  { key: 'place', glyph: 'map-pin-fill' }, // fallback for unknown categories
];

const CORE = 'node_modules/@phosphor-icons/core/assets/fill';
const OUT = 'assets/images/map-markers';
const SCALES = [1, 2, 3];

const CHIP_SIZE = 36; // pt — emerald circle, white ring
const PIN_W = 40; // pt — selected teardrop, white with emerald outline
const PIN_H = 46;

function glyphInner(name) {
  const svg = readFileSync(join(CORE, `${name}.svg`), 'utf8');
  const inner = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (!inner) throw new Error(`could not parse ${name}.svg`);
  return inner;
}

// Phosphor glyphs use viewBox 0 0 256 256; place one at `size`pt centered on (cx, cy).
function placeGlyph(name, size, cx, cy, color) {
  const s = size / 256;
  const inner = glyphInner(name).replace(/currentColor/g, color);
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})" fill="${color}">${inner}</g>`;
}

function chipSvg(glyph) {
  return `<svg width="${CHIP_SIZE}" height="${CHIP_SIZE}" viewBox="0 0 ${CHIP_SIZE} ${CHIP_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16.5" fill="${GREEN}" stroke="${WHITE}" stroke-width="3"/>
  ${placeGlyph(glyph, 19, 18, 18, WHITE)}
</svg>`;
}

// Teardrop: circle of r16 centered at (20, 18.5) tapering to a tip at (20, ~45).
function pinSvg(glyph) {
  const path = [
    'M20 2.5',
    'a16 16 0 0 1 16 16',
    'c0 7.6 -5.4 12.3 -10 17.2',
    'c-2.4 2.6 -4.6 5.4 -6 9',
    'c-1.4 -3.6 -3.6 -6.4 -6 -9',
    'c-4.6 -4.9 -10 -9.6 -10 -17.2',
    'a16 16 0 0 1 16 -16',
    'Z',
  ].join(' ');
  return `<svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="${WHITE}" stroke="${GREEN}" stroke-width="2.5"/>
  ${placeGlyph(glyph, 19, 20, 18.5, GREEN)}
</svg>`;
}

mkdirSync(OUT, { recursive: true });

let count = 0;
for (const { key, glyph } of CATEGORIES) {
  const variants = [
    { name: key, svg: chipSvg(glyph), width: CHIP_SIZE },
    { name: `${key}-selected`, svg: pinSvg(glyph), width: PIN_W },
  ];
  for (const v of variants) {
    for (const scale of SCALES) {
      const resvg = new Resvg(v.svg, { fitTo: { mode: 'width', value: v.width * scale } });
      const png = resvg.render().asPng();
      const suffix = scale === 1 ? '' : `@${scale}x`;
      writeFileSync(join(OUT, `${v.name}${suffix}.png`), png);
      count++;
    }
  }
}
console.log(`generated ${count} PNGs in ${OUT}`);
