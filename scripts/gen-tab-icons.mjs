/**
 * Rasterize the tab-bar Phosphor icons to PNG assets for the native UITabBar.
 *
 * Native tabs render icons from static image sources (not SVG components / not the
 * async VectorIcon font path), so we pre-render Phosphor SVGs to @1x/@2x/@3x PNGs.
 * Rendered black on transparent so the native bar template-tints them (gray inactive,
 * emerald active). Regular weight = inactive, fill weight = active.
 *
 * Run: npm run gen:tab-icons   (after adding icons to ICONS below)
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ICONS = ['house', 'compass', 'road-horizon', 'chat-text'];
const WEIGHTS = [
  { dir: 'regular', srcSuffix: '', outSuffix: '' },
  { dir: 'fill', srcSuffix: '-fill', outSuffix: '-fill' },
];
const BASE_PT = 28;
const SCALES = [1, 2, 3];
const CORE = 'node_modules/@phosphor-icons/core/assets';
const OUT = 'assets/icons/tabs';

mkdirSync(OUT, { recursive: true });

let count = 0;
for (const name of ICONS) {
  for (const w of WEIGHTS) {
    const svg = readFileSync(join(CORE, w.dir, `${name}${w.srcSuffix}.svg`), 'utf8').replace(
      /currentColor/g,
      '#000000',
    );
    for (const scale of SCALES) {
      const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: BASE_PT * scale } });
      const png = resvg.render().asPng();
      const suffix = scale === 1 ? '' : `@${scale}x`;
      writeFileSync(join(OUT, `${name}${w.outSuffix}${suffix}.png`), png);
      count++;
    }
  }
}
console.log(`generated ${count} PNGs in ${OUT}`);
