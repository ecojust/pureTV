// Usage: node tools/plotTracks.mjs [trackId...] [--svg]   (ASCII to stdout; --svg also writes tools/out/<id>.svg)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRACKS } from '../src/data/tracks/index.js';
import { buildTrack, analyzeTrack } from '../src/core/trackModel.js';

const args = process.argv.slice(2);
const svg = args.includes('--svg');
const ids = args.filter((a) => !a.startsWith('--'));
const here = dirname(fileURLToPath(import.meta.url));

for (const def of TRACKS) {
  if (ids.length && !ids.includes(def.id)) continue;
  const t = buildTrack(def);
  const a = analyzeTrack(t);
  console.log(`\n== ${def.id} (${def.name}) length=${a.length.toFixed(0)} m, minRadius=${a.minRadius.toFixed(1)} m (need ${(1.5 * def.width / 2).toFixed(1)}), minSep=${a.minSeparation.toFixed(1)} m, crossings=${a.crossings}`);
  const xs = t.samples.map((p) => p.x), ys = t.samples.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 100, sc = (maxX - minX) / (W - 1), H = Math.ceil((maxY - minY) / (sc * 2)) + 1;
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));
  const put = (x, y, c) => { const gx = Math.round((x - minX) / sc), gy = Math.round((y - minY) / (sc * 2)); if (grid[gy]) grid[gy][gx] = c; };
  t.samples.forEach((p) => put(p.x, p.y, Math.abs(p.curv) > 1 / 40 ? '#' : '.'));
  const g = t.startGrid(1)[0]; put(g.x, g.y, 'S');
  for (const p of t.pickups) put(p.x, p.y, p.type[0].toUpperCase());
  console.log(grid.map((r) => r.join('').trimEnd()).join('\n'));
  if (svg) {
    const pts = t.samples.map((p) => `${(p.x - minX + 50).toFixed(1)},${(p.y - minY + 50).toFixed(1)}`).join(' ');
    const out = join(here, 'out'); mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `${def.id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX - minX + 100} ${maxY - minY + 100}"><rect width="100%" height="100%" fill="#0b0b14"/><polygon points="${pts}" fill="none" stroke="#c2c3c7" stroke-width="${def.width}" stroke-linejoin="round"/><polygon points="${pts}" fill="none" stroke="#ffa300" stroke-width="1"/></svg>`);
  }
}
