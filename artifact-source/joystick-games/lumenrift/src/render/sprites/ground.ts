import { CORE_X, CORE_Y, Realm, Season } from '../../game/config';
import { MapData, Terrain } from '../../game/grid';
import { facet, glow, mix, ngon, rgba, rgbOf, shade, TRng } from './util';
import { campaignBase, campaignEco, campaignRockP, campaignSoil, campaignTreeP, isCampaign, renderCampaign } from './ground-campaigns';

const GROUND = ['#141d22', '#161b26', '#181a29', '#13201f', '#171f24'];

export const TAU = Math.PI * 2;

/** Render the static terrain of the whole map to an offscreen canvas at `px` pixels per tile. */
export interface Ground {
  /** The playable field at full resolution (world rect 0,0 – map.w,map.h). */
  inner: HTMLCanvasElement;
  /** The field plus `margin` tiles of scenery on every side, at lower resolution. */
  outer: HTMLCanvasElement;
  margin: number;
  /** Colour the outer scenery fades into at its far edges. */
  base: string;
}

/** Tiles of decorative scenery generated around the playable field. */
export const GROUND_MARGIN = 14;

/**
 * Render the ground so the landscape continues seamlessly past the playable field.
 * Both canvases are painted from the same extended terrain with the same random sequence, so the
 * high-resolution field and the low-resolution surroundings line up exactly at the border.
 */
export function renderGround(map: MapData, px: number, realm: Realm = 'night', season: Season | null = null): Ground {
  const M = GROUND_MARGIN;
  const ext = extendMap(map, M, realm);
  const paint = (cv: HTMLCanvasElement, scale: number, ox: number, oy: number, vis: Vis, lod: boolean) => {
    const c = cv.getContext('2d')!;
    c.scale(scale, scale);
    c.translate(-ox, -oy);
    if (isCampaign(realm)) renderCampaign(c, ext, M, realm, vis, lod);
    else if (realm === 'day') renderDay(c, ext, M, season, vis, lod);
    else renderNight(c, ext, M, season, vis, lod);
    return c;
  };
  // Per-tile detail is only drawn where it can be seen: the field image needs the field (plus a
  // tile of overhang), the scenery image only its outer strips (its middle is never blitted).
  const inField: Vis = (x, y) => x >= M - 1 && y >= M - 1 && x <= M + map.w && y <= M + map.h;
  const inStrips: Vis = (x, y) => !(x > M + 1 && y > M + 1 && x < M + map.w - 2 && y < M + map.h - 2);
  const inner = document.createElement('canvas');
  inner.width = Math.ceil(map.w * px);
  inner.height = Math.ceil(map.h * px);
  paint(inner, px, M, M, inField, false);
  // the surroundings are scenery: render them at a modest resolution to spare memory
  const po = Math.max(12, Math.min(28, Math.round(px * 0.45)));
  const outer = document.createElement('canvas');
  outer.width = Math.ceil(ext.w * po);
  outer.height = Math.ceil(ext.h * po);
  const oc = paint(outer, po, 0, 0, inStrips, true);
  // fade the far rim into the base colour so there is never a hard edge, even fully zoomed out
  const base = isCampaign(realm) ? campaignBase(realm) : realm === 'day' ? dayPal(season).base : nightPal(season).base;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  const W = outer.width,
    H = outer.height,
    f = po * 4;
  const fade = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = oc.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, base);
    g.addColorStop(1, base + '00');
    oc.fillStyle = g;
    oc.fillRect(rx, ry, rw, rh);
  };
  fade(0, 0, 0, f, 0, 0, W, f);
  fade(0, H, 0, H - f, 0, H - f, W, f);
  fade(0, 0, f, 0, 0, 0, f, H);
  fade(W, 0, W - f, 0, W - f, 0, f, H);
  return { inner, outer, margin: M, base };
}

/**
 * Paint one newly sprouted eco tile (the map's terrain at x,y is already Crystal) onto the field
 * in place: a soft patch of bare ground settles it in, then the realm's vein / meadow on top.
 */
export function paintVein(g: Ground, map: MapData, x: number, y: number, realm: Realm, season: Season | null): void {
  const M = g.margin;
  const px = g.inner.width / map.w;
  const c = g.inner.getContext('2d')!;
  // same coordinates as the full render (extended map, margin offset) so the per-tile randomness matches
  const T: TFn = (xx, yy) => {
    const a = xx - M,
      b = yy - M;
    return a < 0 || b < 0 || a >= map.w || b >= map.h ? Terrain.Grass : map.terrain[b * map.w + a];
  };
  const X = x + M,
    Y = y + M;
  c.save();
  c.setTransform(px, 0, 0, px, -M * px, -M * px);
  c.beginPath();
  c.rect(X - 1, Y - 1, 3, 3);
  c.clip();
  // clear the grass tufts beneath with a soft-edged patch of the season's ground colour
  const col = isCampaign(realm) ? campaignSoil(realm) : realm === 'day' ? dayPal(season).fill : nightPal(season).tiles[0];
  const gr = c.createRadialGradient(X + 0.5, Y + 0.52, 0, X + 0.5, Y + 0.52, 0.72);
  gr.addColorStop(0, rgba(col, 0.92));
  gr.addColorStop(0.55, rgba(col, 0.8));
  gr.addColorStop(1, rgba(col, 0));
  c.fillStyle = gr;
  c.fillRect(X - 0.5, Y - 0.5, 2, 2);
  if (isCampaign(realm)) campaignEco(c, X, Y, T, realm);
  else if (realm === 'day') meadow(c, X, Y, T, season);
  else crystalVein(c, X, Y, season);
  c.restore();
}

/**
 * The real map surrounded by generated scenery: open meadow with groves (a forest edge), a few
 * ruins/boulders and ponds. Never crystal, rifts or a core, so nothing outside looks playable.
 */
function extendMap(map: MapData, M: number, realm: Realm): MapData {
  const w = map.w + 2 * M,
    h = map.h + 2 * M;
  const terrain = new Uint8Array(w * h);
  const noise = new Float32Array(w * h);
  const r = new TRng(Math.floor(map.noise[1] * 1e9) ^ 0x0b0e);
  for (let i = 0; i < noise.length; i++) noise[i] = r.next();
  const inside = (x: number, y: number) => x >= M && y >= M && x < M + map.w && y < M + map.h;
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      terrain[(y + M) * w + x + M] = map.terrain[y * map.w + x];
      noise[(y + M) * w + x + M] = map.noise[y * map.w + x];
    }
  // keep a one-tile strip next to the field clear so rifts and paths open onto grass
  const nearField = (x: number, y: number) => x >= M - 2 && y >= M - 2 && x < M + map.w + 2 && y < M + map.h + 2;
  const put = (x: number, y: number, t: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h || inside(x, y) || nearField(x, y)) return;
    terrain[y * w + x] = t;
  };
  const dist = (x: number, y: number) => Math.max(M - x, x - (M + map.w - 1), M - y, y - (M + map.h - 1), 0);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (inside(x, y)) continue;
      // groves get denser further from the field, framing it with a forest edge
      const d = dist(x, y);
      const pTree = isCampaign(realm) ? campaignTreeP(realm, d) : (realm === 'day' ? 0.05 : 0.04) + Math.min(0.32, d * 0.025);
      if (r.next() < pTree * 0.35) {
        const n = 1 + Math.floor(r.next() * 4);
        for (let k = 0; k < n; k++) put(x + Math.floor(r.next() * 3) - 1, y + Math.floor(r.next() * 3) - 1, Terrain.Tree);
      } else if (r.next() < (isCampaign(realm) ? campaignRockP(realm) : 0.012)) put(x, y, Terrain.Rock);
    }
  for (let p = 0; p < 7; p++) {
    let x = Math.floor(r.next() * w),
      y = Math.floor(r.next() * h);
    if (inside(x, y) || nearField(x, y)) continue;
    const size = 3 + Math.floor(r.next() * 6);
    for (let k = 0; k < size; k++) {
      put(x, y, Terrain.Water);
      x += Math.floor(r.next() * 3) - 1;
      y += Math.floor(r.next() * 3) - 1;
    }
  }
  return { w, h, terrain, noise, rifts: map.rifts.map((q) => ({ x: q.x + M, y: q.y + M })) };
}

export type TFn = (x: number, y: number) => number;
export type Vis = (x: number, y: number) => boolean;
export const ALL: Vis = () => true;
type Sn = Season | null;

// ====================================================================== seasons: palettes & shared bits

interface NightPal {
  fill: string;
  tiles: string[];
  tileA: number;
  blobs: [string, string, string];
  dirt: string;
  dirtA: number;
  slab: [string, string];
  grid: string;
  moss: string;
  tufts: [string, string];
  fern: string;
  pebble: [string, string];
  /** Colour the outer scenery fades into. */
  base: string;
}

const NIGHT_LEGACY: NightPal = {
  fill: '#12181f',
  tiles: GROUND,
  tileA: 0.7,
  blobs: ['#20403a', '#2a2445', '#1a2a3e'],
  dirt: '#07090d',
  dirtA: 1,
  slab: ['#262c3c', '#2c3440'],
  grid: 'rgba(180,200,255,0.035)',
  moss: '#2a4a3a',
  tufts: ['#2f5446', '#3b5a52'],
  fern: 'rgba(55,95,80,0.75)',
  pebble: ['#2c3142', '#3c4256'],
  base: '#10161d',
};

const NIGHT_PALS: Record<Season, NightPal> = {
  spring: {
    ...NIGHT_LEGACY,
    fill: '#121d19',
    tiles: ['#14231e', '#152520', '#16261f', '#13241d', '#162420'],
    tileA: 0.6,
    blobs: ['#245a3c', '#2e2a4a', '#1c4232'],
    dirt: '#070b09',
    moss: '#2f603c',
    tufts: ['#367050', '#42805a'],
    fern: 'rgba(70,130,90,0.85)',
    base: '#111b17',
  },
  summer: {
    ...NIGHT_LEGACY,
    fill: '#1b1a16',
    tiles: ['#1e1d18', '#211f19', '#1d1e18', '#221f18', '#1f1d1a'],
    tileA: 0.6,
    blobs: ['#3e3620', '#26382a', '#3a282a'],
    dirt: '#0b0906',
    slab: ['#2e2b2c', '#363234'],
    grid: 'rgba(255,220,180,0.03)',
    moss: '#36482a',
    tufts: ['#3e5634', '#4c5a34'],
    fern: 'rgba(80,100,60,0.75)',
    pebble: ['#38332e', '#48413a'],
    base: '#1a1814',
  },
  autumn: {
    ...NIGHT_LEGACY,
    fill: '#1c1714',
    tiles: ['#211a16', '#221b16', '#201c15', '#231b15', '#1f1a18'],
    tileA: 0.6,
    blobs: ['#4e2c18', '#463820', '#2a2232'],
    dirt: '#0a0706',
    slab: ['#2e2a30', '#363036'],
    grid: 'rgba(255,210,170,0.03)',
    moss: '#4a4428',
    tufts: ['#5a4a2c', '#4e3c2a'],
    fern: 'rgba(120,72,40,0.85)',
    pebble: ['#352f30', '#453c3c'],
    base: '#1a1513',
  },
  winter: {
    ...NIGHT_LEGACY,
    fill: '#56627a',
    tiles: ['#545f75', '#58647a', '#566177', '#5a667c', '#535e73'],
    tileA: 0.45,
    blobs: ['#76849e', '#3e4862', '#8692ac'],
    dirt: '#33405a',
    dirtA: 0.7,
    slab: ['#454d62', '#4d566c'],
    grid: 'rgba(20,30,60,0.07)',
    moss: '#3a4a48',
    tufts: ['#323e3c', '#3c4844'],
    fern: 'rgba(50,60,60,0.7)',
    pebble: ['#3a4256', '#48506a'],
    base: '#4c586c',
  },
};

function nightPal(s: Sn): NightPal {
  return s ? NIGHT_PALS[s] : NIGHT_LEGACY;
}

/** Smooth, low-frequency noise in [0,1] laying out seasonal patches (dry grass, drifts, flower swathes). */
export function patchField(seed: number): TFn {
  const r = new TRng(seed);
  const p = [0, 1, 2, 3, 4].map(() => r.range(0, TAU));
  const f = [r.range(0.24, 0.36), r.range(0.22, 0.32), r.range(0.45, 0.65)];
  return (x, y) => {
    const v =
      Math.sin(x * f[0] + p[0] + Math.sin(y * 0.21 + p[1]) * 1.6) +
      Math.sin(y * f[1] + p[2] + Math.cos(x * 0.17 + p[3]) * 1.6) +
      0.6 * Math.sin((x - y) * f[2] * 0.7 + p[4]);
    return Math.max(0, Math.min(1, 0.5 + v / 4.4));
  };
}

/** Pixels per tile of the swathe bitmap (smoothly upscaled, so a few are plenty). */
export const SW = 4;

/**
 * Soft patches where the field exceeds `thr` (alpha rises with it), merging into continuous
 * swathes. Painted into a tiny bitmap `g` covering (-1,-1)–(W+1,H+1) at SW px per tile.
 */
export function patches(g: CanvasRenderingContext2D, W: number, H: number, F: TFn, thr: number, col: string, a: number, soft = 1) {
  const cw = (W + 2) * SW,
    ch = (H + 2) * SW;
  const img = g.createImageData(cw, ch);
  const [R, G, B] = rgbOf(col);
  const k = 1.6 / soft / (1 - thr);
  for (let j = 0; j < ch; j++)
    for (let i = 0; i < cw; i++) {
      const f = F(i / SW - 1, j / SW - 1);
      if (f <= thr) continue;
      const o = (j * cw + i) * 4;
      img.data[o] = R;
      img.data[o + 1] = G;
      img.data[o + 2] = B;
      img.data[o + 3] = Math.round(255 * a * Math.min(1, (f - thr) * k));
    }
  // composite (putImageData would replace what earlier layers painted)
  const t = document.createElement('canvas');
  t.width = cw;
  t.height = ch;
  t.getContext('2d')!.putImageData(img, 0, 0);
  g.drawImage(t, 0, 0);
}

/**
 * A stand-in 2D context that records small shapes into one path per style, so thousands of leaves,
 * petals and blades cost a handful of fills instead of thousands. Same drawing API subset.
 */
export class Batch {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'round';
  globalAlpha = 1;
  private p = new Path2D();
  private layers = new Map<string, Path2D>();
  beginPath() {
    this.p = new Path2D();
  }
  moveTo(x: number, y: number) {
    this.p.moveTo(x, y);
  }
  lineTo(x: number, y: number) {
    this.p.lineTo(x, y);
  }
  quadraticCurveTo(a: number, b: number, x: number, y: number) {
    this.p.quadraticCurveTo(a, b, x, y);
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean) {
    this.p.arc(x, y, r, a0, a1, ccw);
  }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw?: boolean) {
    this.p.ellipse(x, y, rx, ry, rot, a0, a1, ccw);
  }
  closePath() {
    this.p.closePath();
  }
  private add(key: string) {
    let l = this.layers.get(key);
    if (!l) this.layers.set(key, (l = new Path2D()));
    l.addPath(this.p);
  }
  fill() {
    this.add('f|' + String(this.fillStyle) + '|' + this.globalAlpha.toFixed(2));
  }
  stroke() {
    this.add('s|' + String(this.strokeStyle) + '|' + this.globalAlpha.toFixed(2) + '|' + this.lineWidth.toFixed(4) + '|' + this.lineCap);
  }
  flush(c: CanvasRenderingContext2D) {
    c.save();
    for (const [k, path] of this.layers) {
      const [kind, col, a, w, cap] = k.split('|');
      c.globalAlpha = +a;
      if (kind === 'f') {
        c.fillStyle = col;
        c.fill(path);
      } else {
        c.strokeStyle = col;
        c.lineWidth = +w;
        c.lineCap = cap as CanvasLineCap;
        c.stroke(path);
      }
    }
    c.restore();
    this.layers.clear();
  }
}
export type Pen = CanvasRenderingContext2D | Batch;
/** A pen that draws nothing (keeps the random sequence when the low-res image skips an item). */
export const NOPEN = new (class extends Batch {
  fill() {}
  stroke() {}
})();

/** A small pointed leaf lying at (x,y). */
export function leaf(c: Pen, x: number, y: number, s: number, a: number, col: string, vein?: string) {
  const ca = Math.cos(a),
    sa = Math.sin(a);
  const P = (u: number, v: number): [number, number] => [x + u * ca - v * sa, y + u * sa + v * ca];
  const [ax, ay] = P(-s, 0),
    [bx, by] = P(s, 0),
    [c1x, c1y] = P(0, -s * 0.7),
    [c2x, c2y] = P(0, s * 0.7);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(ax, ay);
  c.quadraticCurveTo(c1x, c1y, bx, by);
  c.quadraticCurveTo(c2x, c2y, ax, ay);
  c.fill();
  if (vein) {
    c.strokeStyle = vein;
    c.lineWidth = s * 0.12;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.stroke();
  }
}

/** A soft wind-sculpted snow drift: shadowed underside, body, and a bright crest. */
export function drift(c: CanvasRenderingContext2D, x: number, y: number, len: number, ht: number, a: number, body: string, hi: string, sh: string) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  // the lee side: a soft blue crescent of shadow just under the crest
  c.strokeStyle = sh;
  c.lineCap = 'round';
  c.lineWidth = ht * 0.55;
  c.beginPath();
  c.moveTo(-len * 0.85, ht * 0.1);
  c.quadraticCurveTo(0, ht * 1.3, len * 0.85, ht * 0.1);
  c.stroke();
  // soft-edged body (no hard outline), then the sunlit crest
  c.scale(1, ht / len);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, len);
  g.addColorStop(0, body);
  g.addColorStop(0.55, body);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(-len, -len, len * 2, len * 2);
  c.fillStyle = hi;
  c.beginPath();
  c.ellipse(-len * 0.1, -len * 0.3, len * 0.6, len * 0.3, 0, 0, TAU);
  c.fill();
  c.restore();
}

/** Bent straw-coloured blades: sun-scorched, tinder-dry grass. */
export function dryTuft(c: Pen, r: TRng, bx: number, by: number, cols: string[], scale = 1) {
  c.lineWidth = 0.02;
  c.lineCap = 'round';
  const blades = 4 + Math.floor(r.next() * 4);
  for (let q = 0; q < blades; q++) {
    const a = -Math.PI / 2 + (q - (blades - 1) / 2) * 0.32 + r.range(-0.15, 0.15);
    const len = r.range(0.1, 0.2) * scale;
    const droop = r.range(0.02, 0.07) * Math.sign(Math.cos(a) || 1);
    c.strokeStyle = cols[Math.floor(r.next() * cols.length)];
    c.beginPath();
    c.moveTo(bx, by);
    c.quadraticCurveTo(bx + Math.cos(a) * len * 0.6, by + Math.sin(a) * len * 0.8, bx + Math.cos(a) * len + droop, by + Math.sin(a) * len * 0.75 + Math.abs(droop) * 0.6);
    c.stroke();
  }
}

export function petal(c: Pen, x: number, y: number, s: number, a: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, s, s * 0.55, a, 0, TAU);
  c.fill();
}

export function sparkle(c: Pen, sx: number, sy: number, ss: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(sx, sy - ss * 1.8);
  c.lineTo(sx + ss * 0.35, sy);
  c.lineTo(sx, sy + ss * 1.8);
  c.lineTo(sx - ss * 0.35, sy);
  c.closePath();
  c.moveTo(sx - ss * 1.8, sy);
  c.lineTo(sx, sy + ss * 0.35);
  c.lineTo(sx + ss * 1.8, sy);
  c.lineTo(sx, sy - ss * 0.35);
  c.closePath();
  c.fill();
}

const SEASON_SEED: Record<Season, number> = { spring: 0x5191, summer: 0x5a2, autumn: 0xa07, winter: 0x3170 };

export function nearTrees(T: TFn, x: number, y: number) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && T(x + dx, y + dy) === Terrain.Tree) n++;
  return n;
}

/** Seasonal life on one open tile (both realms): blossom petals, dry grass, leaf litter, snow. */
export function seasonTile(c: CanvasRenderingContext2D, b: Batch, x: number, y: number, season: Season, realm: Realm, T: TFn, F: TFn, inPlaza: boolean, lod = false) {
  const r = new TRng(x * 5153 + y * 3967 + SEASON_SEED[season]);
  // the low-resolution scenery image draws about half the small things (same positions as the field)
  const lr = new TRng(x * 31 + y * 17 + 5);
  const keep = () => !lod || lr.next() < 0.5;
  const day = realm === 'day';
  const trees = nearTrees(T, x, y);
  const f = F(x, y);
  if (season === 'spring') {
    // wildflowers in swathes, petals blown from blossoming trees
    const flowers = inPlaza ? 0 : r.next() < (day ? 0.25 + f * 0.45 : 0.1 + f * 0.3) ? 1 + Math.floor(r.next() * (day ? 2 + f * 4 : 1 + f * 2.5)) : 0;
    const cols = day ? ['#ffffff', '#ffe680', '#f2a6d0', '#c8a8f4', '#a8c8ff', '#ff8fb0'] : ['#d8d0f0', '#c8b8e8', '#e0c0d8', '#b8d8e8'];
    for (let k = 0; k < flowers; k++) {
      const fx = x + r.range(0.12, 0.88),
        fy = y + r.range(0.15, 0.88),
        pr = r.range(0.018, 0.03);
      const col = cols[Math.floor(r.next() * cols.length)];
      if (!keep()) continue;
      if (!day) {
        b.fillStyle = rgba(col, 0.12);
        b.beginPath();
        b.arc(fx, fy, 0.075, 0, TAU);
        b.fill();
      }
      b.strokeStyle = day ? '#4a8a34' : '#2e5a40';
      b.lineWidth = 0.012;
      b.beginPath();
      b.moveTo(fx, fy + pr * 2.5);
      b.lineTo(fx, fy);
      b.stroke();
      b.fillStyle = col;
      for (let q = 0; q < 5; q++) {
        const a = (q / 5) * TAU + k;
        b.beginPath();
        b.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.72, 0, TAU);
        b.fill();
      }
      b.fillStyle = day ? '#f2c040' : '#e8d890';
      b.beginPath();
      b.arc(fx, fy, pr * 0.5, 0, TAU);
      b.fill();
    }
    const petals = trees ? 3 + trees * 3 : r.next() < 0.12 ? 2 : 0;
    for (let k = 0; k < petals; k++) {
      const col = day ? (r.next() < 0.55 ? 'rgba(255,190,215,0.9)' : 'rgba(255,245,250,0.9)') : r.next() < 0.5 ? 'rgba(230,200,225,0.7)' : 'rgba(240,236,250,0.7)';
      const px = x + r.range(0.05, 0.95),
        py = y + r.range(0.05, 0.95),
        ps = r.range(0.02, 0.03),
        pa = r.range(0, 3);
      if (keep()) petal(b, px, py, ps, pa, col);
    }
    if (!inPlaza && r.next() < 0.3) {
      // fresh young blades
      b.strokeStyle = day ? '#5cb040' : '#3f8058';
      b.lineWidth = 0.02;
      b.lineCap = 'round';
      const bx = x + r.range(0.15, 0.85),
        by = y + r.range(0.25, 0.9);
      for (let q = 0; q < 4; q++) {
        const a = -Math.PI / 2 + (q - 1.5) * 0.3;
        b.beginPath();
        b.moveTo(bx, by);
        b.lineTo(bx + Math.cos(a) * 0.15, by + Math.sin(a) * 0.15);
        b.stroke();
      }
    }
  } else if (season === 'summer') {
    // dry, tinder-like tufts where the grass has bleached, a few lush ones elsewhere
    const dryCols = day ? ['#d8b85a', '#c9a446', '#e6cc7a', '#b8923c'] : ['#6e6036', '#7c6a3a', '#5e5230'];
    const n = inPlaza ? (r.next() < 0.2 ? 1 : 0) : f > 0.5 ? 2 + Math.floor(r.next() * 3) : r.next() < 0.35 ? 1 : 0;
    for (let k = 0; k < n; k++) dryTuft(lod && !keep() ? NOPEN : b, r, x + r.range(0.12, 0.88), y + r.range(0.25, 0.92), dryCols, f > 0.5 ? 1.1 : 0.85);
    if (!inPlaza && f > 0.55 && r.next() < 0.35) {
      // a fallen dry stalk
      const tx = x + r.range(0.2, 0.8),
        ty = y + r.range(0.2, 0.8),
        ta = r.range(0, Math.PI);
      b.strokeStyle = day ? 'rgba(170,130,60,0.8)' : 'rgba(110,90,50,0.8)';
      b.lineWidth = 0.016;
      b.beginPath();
      b.moveTo(tx - Math.cos(ta) * 0.16, ty - Math.sin(ta) * 0.16);
      b.lineTo(tx + Math.cos(ta) * 0.16, ty + Math.sin(ta) * 0.16);
      b.stroke();
    }
    if (!day && !inPlaza && r.next() < 0.05) glow(c, x + r.range(0.2, 0.8), y + r.range(0.2, 0.8), 0.14, '#ffd27a', 0.45); // fireflies
  } else if (season === 'autumn') {
    // leaf litter, drifted deep under the trees
    const cols = day
      ? ['#d8682a', '#c04428', '#e6a838', '#b8562a', '#d89030', '#a83a28', '#c8a040']
      : ['#a4522a', '#b07a34', '#8e3a24', '#8a5a2c', '#b8642c'];
    const n = (inPlaza ? 0 : r.next() < 0.6 ? 2 + Math.floor(r.next() * 3) : 0) + trees * 4 + (f > 0.55 ? 3 : 0);
    for (let k = 0; k < n; k++) {
      const lx = x + r.range(0.03, 0.97),
        ly = y + r.range(0.03, 0.97),
        s = r.range(0.04, 0.065),
        a = r.range(0, TAU);
      const col = cols[Math.floor(r.next() * cols.length)];
      if (!keep()) continue;
      if (!lod) {
        b.fillStyle = 'rgba(0,0,0,0.15)';
        b.beginPath();
        b.ellipse(lx + 0.01, ly + 0.012, s, s * 0.6, a, 0, TAU);
        b.fill();
      }
      leaf(b, lx, ly, s, a, col, lod ? undefined : day ? 'rgba(90,40,20,0.45)' : 'rgba(30,15,10,0.5)');
    }
    if (!inPlaza && r.next() < 0.18) dryTuft(b, r, x + r.range(0.15, 0.85), y + r.range(0.3, 0.9), day ? ['#a08a48', '#8a7a3c', '#b49a50'] : ['#5a4a2c', '#4e402a']);
  } else {
    // snow: a few sparkles, grass tips poking through the thin places, little drifts
    if (!inPlaza && f < 0.42 && r.next() < 0.5) {
      const bx = x + r.range(0.15, 0.85),
        by = y + r.range(0.3, 0.9);
      b.strokeStyle = day ? 'rgba(120,130,90,0.7)' : 'rgba(40,52,50,0.75)';
      b.lineWidth = 0.016;
      b.lineCap = 'round';
      for (let q = 0; q < 3; q++) {
        b.beginPath();
        b.moveTo(bx + (q - 1) * 0.03, by);
        b.lineTo(bx + (q - 1) * 0.05 + r.range(-0.02, 0.02), by - r.range(0.05, 0.1));
        b.stroke();
      }
    }
    if (r.next() < (inPlaza ? 0.04 : 0.04 + Math.max(0, f - 0.5) * 0.4)) {
      // a wind-sculpted drift: long, low, and soft-edged
      const a = r.range(-0.25, 0.25);
      const len = r.range(0.3, 0.55);
      const dx = x + r.range(0.3, 0.7),
        dy = y + r.range(0.3, 0.75);
      if (day) drift(c, dx, dy, len, len * 0.22, a, 'rgba(244,248,253,0.6)', 'rgba(255,255,255,0.55)', 'rgba(140,160,195,0.22)');
      else drift(c, dx, dy, len, len * 0.22, a, 'rgba(118,132,158,0.6)', 'rgba(150,165,192,0.45)', 'rgba(20,28,50,0.25)');
    }
    const sp = r.next() < 0.5 ? 1 + Math.floor(r.next() * 2) : 0;
    for (let k = 0; k < sp; k++) {
      const sx = x + r.range(0.1, 0.9),
        sy = y + r.range(0.1, 0.9),
        ss = r.range(0.012, 0.022);
      if (!keep()) continue;
      if (day) sparkle(b, sx, sy, ss, 'rgba(255,255,255,0.95)');
      else {
        b.fillStyle = 'rgba(207,228,255,0.7)';
        b.beginPath();
        b.arc(sx, sy, 0.014, 0, TAU);
        b.fill();
      }
    }
  }
}

/** Big seasonal swathes on the open ground (painted under the details), all in one upscaled bitmap. */
function seasonSwathes(c: CanvasRenderingContext2D, W: number, H: number, season: Season, realm: Realm, F: TFn, rng: TRng) {
  const day = realm === 'day';
  const cv = document.createElement('canvas');
  cv.width = (W + 2) * SW;
  cv.height = (H + 2) * SW;
  const g = cv.getContext('2d')!;
  const inv: TFn = (x, y) => 1 - F(x, y);
  if (season === 'spring') {
    patches(g, W, H, F, 0.55, day ? '#5aa83c' : '#1f4a30', day ? 0.3 : 0.35);
    patches(g, W, H, inv, 0.6, day ? '#b4e07c' : '#24402e', 0.25);
  } else if (season === 'summer') {
    // sun-bleached, bone-dry grass in big swathes
    patches(g, W, H, F, 0.45, day ? '#dcc271' : '#4c4126', day ? 0.55 : 0.55);
    patches(g, W, H, F, 0.65, day ? '#e8d28a' : '#5a4a2a', day ? 0.35 : 0.3, 0.7);
    patches(g, W, H, inv, 0.65, day ? '#5e9a40' : '#22342a', 0.3);
  } else if (season === 'autumn') {
    patches(g, W, H, F, 0.5, day ? '#c8843a' : '#4a2a16', day ? 0.45 : 0.5);
    patches(g, W, H, inv, 0.6, day ? '#8e8c46' : '#3a3018', 0.35);
  } else {
    // thin snow where the ground shows through, deep drifts and blue hollows elsewhere
    patches(g, W, H, inv, 0.68, day ? '#b0bfb4' : '#3e4a50', day ? 0.25 : 0.35);
    patches(g, W, H, F, 0.55, day ? '#f2f6fb' : '#7c8aa4', day ? 0.5 : 0.4);
    g.save();
    g.scale(SW, SW);
    g.translate(1, 1);
    for (let i = 0; i < (W * H) / 30; i++) {
      const x = rng.range(-1, W + 1),
        y = rng.range(-1, H + 1);
      glow(g, x, y, rng.range(0.6, 1.4), day ? '#9fb2cc' : '#2e3850', rng.range(0.15, 0.3));
    }
    g.restore();
  }
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'low';
  c.drawImage(cv, -1, -1, W + 2, H + 2);
  c.restore();
}

// ====================================================================== night: the dark field

function renderNight(c: CanvasRenderingContext2D, map: MapData, off = 0, season: Sn = null, vis: Vis = ALL, lod = false) {
  const W = map.w,
    H = map.h;
  const T = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? Terrain.Grass : map.terrain[y * W + x]);
  const N = (x: number, y: number) => map.noise[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const rng = new TRng(Math.floor(map.noise[0] * 1e9) ^ 0x5eed);
  const P = nightPal(season);
  const snow = season === 'winter';
  const F = patchField(Math.floor(map.noise[2] * 1e9) ^ 0xf1e1d);

  // 1. base + per-tile tint
  c.fillStyle = P.fill;
  c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      const n = N(x, y);
      c.fillStyle = P.tiles[Math.floor(n * P.tiles.length) % P.tiles.length];
      c.globalAlpha = P.tileA;
      c.fillRect(x - 0.02, y - 0.02, 1.04, 1.04);
    }
  c.globalAlpha = 1;

  // 2. large soft colour blobs blend the tiles into a natural field
  for (let i = 0; i < 90; i++) {
    const x = rng.range(-2, W + 2),
      y = rng.range(-2, H + 2);
    const r = rng.range(1.5, 5);
    const col = rng.next() < 0.55 ? P.blobs[0] : rng.next() < 0.5 ? P.blobs[1] : P.blobs[2];
    glow(c, x, y, r, col, rng.range(0.18, 0.35));
  }
  // darker dirt patches
  for (let i = 0; i < 40; i++) {
    glow(c, rng.range(0, W), rng.range(0, H), rng.range(0.8, 2.2), P.dirt, rng.range(0.15, 0.3) * P.dirtA);
  }
  if (season) seasonSwathes(c, W, H, season, 'night', F, new TRng(Math.floor(map.noise[3] * 1e9) ^ 0x5ea5));

  // 3. flagstone plaza around the Beacon
  const pcx = CORE_X + 0.5 + off,
    pcy = CORE_Y + 0.5 + off;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      const t = T(x, y);
      if (t !== Terrain.Grass && t !== Terrain.Core && t !== Terrain.Crystal) continue;
      const d = Math.hypot(x + 0.5 - pcx, (y + 0.5 - pcy) * 1.15);
      const n = N(x, y);
      const edge = 3.2 + n * 1.8;
      if (d > edge) continue;
      const fade = Math.min(1, (edge - d) / 1.2);
      const r = new TRng(x * 7919 + y * 104729);
      // split some tiles into two or four slabs
      const split = n < 0.35 ? 1 : n < 0.7 ? 2 : 4;
      const slabs: [number, number, number, number][] =
        split === 1
          ? [[0, 0, 1, 1]]
          : split === 2
            ? n < 0.52
              ? [
                  [0, 0, 0.55, 1],
                  [0.55, 0, 0.45, 1],
                ]
              : [
                  [0, 0, 1, 0.45],
                  [0, 0.45, 1, 0.55],
                ]
            : [
                [0, 0, 0.5, 0.5],
                [0.5, 0, 0.5, 0.5],
                [0, 0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5, 0.5],
              ];
      for (const [sx, sy, sw, sh] of slabs) {
        const j = () => r.range(-0.025, 0.025);
        const g = 0.045;
        const pts: [number, number][] = [
          [x + sx + g + j(), y + sy + g + j()],
          [x + sx + sw - g + j(), y + sy + g + j()],
          [x + sx + sw - g + j(), y + sy + sh - g + j()],
          [x + sx + g + j(), y + sy + sh - g + j()],
        ];
        c.globalAlpha = fade * (0.35 + r.next() * 0.25) * (snow ? 1.5 : 1);
        const base = mix(P.slab[0], P.slab[1], r.next());
        c.fillStyle = base;
        c.beginPath();
        pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b)));
        c.closePath();
        c.fill();
        // top-left bevel highlight
        c.strokeStyle = 'rgba(160,170,200,0.10)';
        c.lineWidth = 0.025;
        c.beginPath();
        c.moveTo(pts[3][0], pts[3][1]);
        c.lineTo(pts[0][0], pts[0][1]);
        c.lineTo(pts[1][0], pts[1][1]);
        c.stroke();
        c.strokeStyle = 'rgba(0,0,0,0.35)';
        c.beginPath();
        c.moveTo(pts[1][0], pts[1][1]);
        c.lineTo(pts[2][0], pts[2][1]);
        c.lineTo(pts[3][0], pts[3][1]);
        c.stroke();
        if (r.next() < 0.25) {
          // moss in the cracks (snow in winter)
          c.fillStyle = snow ? 'rgba(150,165,190,0.6)' : 'rgba(60,110,80,0.35)';
          c.beginPath();
          c.ellipse(pts[2][0] - 0.05, pts[2][1] - 0.03, 0.09, 0.04, 0, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  c.globalAlpha = 1;

  // 4. faint tile grid
  c.strokeStyle = P.grid;
  c.lineWidth = 0.02;
  c.beginPath();
  for (let x = 1; x < W; x++) {
    c.moveTo(x, 0);
    c.lineTo(x, H);
  }
  for (let y = 1; y < H; y++) {
    c.moveTo(0, y);
    c.lineTo(W, y);
  }
  c.stroke();

  // 5. decoration on open ground
  const B = new Batch();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      const t = T(x, y);
      if (t !== Terrain.Grass) continue;
      const d = Math.hypot(x + 0.5 - pcx, (y + 0.5 - pcy) * 1.15);
      const r = new TRng(x * 3301 + y * 7727 + 13);
      const inPlaza = d < 3.4;
      if (!inPlaza && r.next() < 0.14 && !snow) {
        // moss patch
        c.fillStyle = rgba(P.moss, 0.45);
        c.beginPath();
        c.ellipse(x + r.range(0.2, 0.8), y + r.range(0.2, 0.8), r.range(0.12, 0.3), r.range(0.07, 0.15), r.range(0, 3), 0, Math.PI * 2);
        c.fill();
      }
      let tufts = inPlaza ? (r.next() < 0.15 ? 1 : 0) : r.next() < 0.45 ? 1 + Math.floor(r.next() * 3) : 0;
      if (snow) tufts = Math.min(tufts, F(x, y) < 0.45 ? 1 : 0);
      for (let k = 0; k < tufts; k++) {
        const bx = x + r.range(0.12, 0.88),
          by = y + r.range(0.2, 0.92);
        const col = r.next() < 0.5 ? P.tufts[0] : P.tufts[1];
        c.strokeStyle = col;
        c.lineWidth = 0.022;
        c.lineCap = 'round';
        const blades = 3 + Math.floor(r.next() * 3);
        for (let q = 0; q < blades; q++) {
          const a = -Math.PI / 2 + (q - (blades - 1) / 2) * 0.35 + r.range(-0.1, 0.1);
          const len = r.range(0.07, 0.15) * (snow ? 0.6 : 1);
          c.beginPath();
          c.moveTo(bx, by);
          c.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.6, bx + Math.cos(a) * len + 0.02, by + Math.sin(a) * len);
          c.stroke();
        }
      }
      if (r.next() < 0.18) {
        // pebbles
        const n = 1 + Math.floor(r.next() * 3);
        for (let k = 0; k < n; k++) {
          const px2 = x + r.range(0.15, 0.85),
            py2 = y + r.range(0.15, 0.85),
            pr = r.range(0.025, 0.055);
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.beginPath();
          c.ellipse(px2 + 0.012, py2 + 0.015, pr, pr * 0.7, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = mix(P.pebble[0], P.pebble[1], r.next());
          c.beginPath();
          c.ellipse(px2, py2, pr, pr * 0.7, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = snow ? 'rgba(170,185,210,0.85)' : 'rgba(200,210,255,0.12)';
          c.beginPath();
          if (snow) c.ellipse(px2, py2 - pr * 0.3, pr * 0.9, pr * 0.4, 0, 0, Math.PI * 2);
          else c.ellipse(px2 - pr * 0.3, py2 - pr * 0.3, pr * 0.4, pr * 0.25, 0, 0, Math.PI * 2);
          c.fill();
        }
      }
      if (r.next() < 0.07 && !snow) {
        // crack
        c.strokeStyle = 'rgba(5,7,12,0.55)';
        c.lineWidth = 0.02;
        let cx2 = x + r.range(0.2, 0.8),
          cy2 = y + r.range(0.2, 0.8);
        c.beginPath();
        c.moveTo(cx2, cy2);
        for (let q = 0; q < 4; q++) {
          cx2 += r.range(-0.14, 0.14);
          cy2 += r.range(-0.14, 0.14);
          c.lineTo(cx2, cy2);
        }
        c.stroke();
      }
      if (!inPlaza && r.next() < (season === 'autumn' ? 0.11 : 0.05) && !snow) {
        // tiny bioluminescent mushrooms
        const col = season === 'autumn' ? (r.next() < 0.6 ? '#ffb86a' : '#b58cff') : r.next() < 0.5 ? '#6fe0c8' : '#b58cff';
        const n = 1 + Math.floor(r.next() * 3);
        const mx = x + r.range(0.25, 0.75),
          my = y + r.range(0.3, 0.8);
        glow(c, mx, my - 0.03, 0.28, col, 0.22);
        for (let k = 0; k < n; k++) {
          const ox = mx + r.range(-0.1, 0.1),
            oy = my + r.range(-0.05, 0.08);
          const s = r.range(0.025, 0.045);
          c.strokeStyle = '#8a8f9e';
          c.lineWidth = 0.012;
          c.beginPath();
          c.moveTo(ox, oy);
          c.lineTo(ox, oy - s * 1.4);
          c.stroke();
          c.fillStyle = col;
          c.beginPath();
          c.ellipse(ox, oy - s * 1.4, s, s * 0.6, 0, Math.PI, 0);
          c.fill();
        }
      }
      if (!inPlaza && r.next() < 0.06) {
        // fallen twig
        const tx = x + r.range(0.2, 0.8),
          ty = y + r.range(0.2, 0.8),
          ta = r.range(0, Math.PI);
        c.strokeStyle = snow ? 'rgba(40,32,36,0.8)' : 'rgba(70,55,50,0.7)';
        c.lineWidth = 0.022;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(tx - Math.cos(ta) * 0.18, ty - Math.sin(ta) * 0.18);
        c.lineTo(tx + Math.cos(ta) * 0.18, ty + Math.sin(ta) * 0.18);
        c.moveTo(tx + Math.cos(ta) * 0.05, ty + Math.sin(ta) * 0.05);
        c.lineTo(tx + Math.cos(ta + 0.7) * 0.14, ty + Math.sin(ta + 0.7) * 0.14);
        c.stroke();
      }
      if (!inPlaza && r.next() < 0.05 && !snow) {
        // little fern curl
        const fx = x + r.range(0.25, 0.75),
          fy = y + r.range(0.35, 0.8);
        c.strokeStyle = P.fern;
        c.lineWidth = 0.02;
        for (const s of [-1, 1]) {
          c.beginPath();
          c.moveTo(fx, fy);
          c.quadraticCurveTo(fx + s * 0.12, fy - 0.12, fx + s * 0.06, fy - 0.2);
          c.stroke();
          for (let q = 1; q <= 3; q++) {
            const k = q / 4;
            const bx = fx + s * 0.1 * k,
              by = fy - 0.17 * k;
            c.beginPath();
            c.moveTo(bx, by);
            c.lineTo(bx + s * 0.06, by - 0.02);
            c.stroke();
          }
        }
      }
      if (!inPlaza && r.next() < 0.012) {
        // old rune stone, faintly glowing
        const sx = x + 0.5,
          sy = y + 0.55;
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.beginPath();
        c.ellipse(sx + 0.03, sy + 0.05, 0.17, 0.08, 0, 0, TAU);
        c.fill();
        facet(c, ngon(sx, sy, 0.15, 6, r.next(), 0.6), sx - 0.04, sy - 0.04, '#3a4054', 0.35);
        glow(c, sx, sy, 0.25, '#9a8cff', 0.18);
        c.strokeStyle = 'rgba(170,160,255,0.55)';
        c.lineWidth = 0.014;
        c.beginPath();
        c.moveTo(sx - 0.05, sy - 0.03);
        c.lineTo(sx, sy + 0.03);
        c.lineTo(sx + 0.05, sy - 0.03);
        c.moveTo(sx, sy - 0.05);
        c.lineTo(sx, sy + 0.03);
        c.stroke();
      }
      if (season) seasonTile(c, B, x, y, season, 'night', T, F, inPlaza, lod);
    }

  B.flush(c);

  // 5b. still, dark pools (frozen over in winter)
  if (snow)
    drawIce(c, map, T, N, {
      rim: '#7a879e',
      rimHi: 'rgba(190,205,230,0.45)',
      ice: '#80b0c8',
      deep: '#5c8cac',
      frost: 'rgba(190,220,240,0.7)',
      crack: 'rgba(20,45,75,0.7)',
      crackHi: 'rgba(205,235,255,0.6)',
      snow: '#93a2ba',
      sheen: 'rgba(215,240,255,0.3)',
    });
  else
    drawWater(c, map, T, N, {
      rim: season === 'autumn' ? '#2c2a30' : season === 'summer' ? '#2c2c30' : '#24323f',
      rimHi: 'rgba(130,175,225,0.38)',
      water: '#163049',
      deep: '#0c1d30',
      shine: 'rgba(160,200,245,0.3)',
    });
  waterDecor(c, map, T, 'night', season);

  // 6. crystal veins
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Crystal && vis(x, y)) crystalVein(c, x, y, season);

  // 7. rocks: shadows first, then boulders back-to-front
  const rocks: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Rock && vis(x, y)) rocks.push([x, y]);
  for (const [x, y] of rocks) {
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath();
    c.ellipse(x + 0.6, y + 0.72, 0.58, 0.36, 0, 0, Math.PI * 2);
    c.fill();
  }
  for (const [x, y] of rocks) {
    const r = new TRng(x * 4099 + y * 2203 + 3);
    const cx = x + 0.5,
      cy = y + 0.45;
    const pts: [number, number][] = [];
    const nv = 7 + Math.floor(r.next() * 3);
    for (let k = 0; k < nv; k++) {
      const a = (k / nv) * Math.PI * 2 + r.range(-0.2, 0.2);
      let rad = r.range(0.42, 0.56);
      const dx = Math.cos(a),
        dy = Math.sin(a);
      // reach toward neighbouring rocks so outcrops merge
      if ((dx > 0.5 && T(x + 1, y) === Terrain.Rock) || (dx < -0.5 && T(x - 1, y) === Terrain.Rock)) rad += 0.14;
      if ((dy > 0.5 && T(x, y + 1) === Terrain.Rock) || (dy < -0.5 && T(x, y - 1) === Terrain.Rock)) rad += 0.14;
      pts.push([cx + dx * rad, cy + dy * rad * 0.9]);
    }
    const base = mix('#363d50', '#433d55', r.next());
    // side/skirt (pseudo height)
    c.fillStyle = shade(base, -0.45);
    c.beginPath();
    pts.forEach(([a, b], i) => (i ? c.lineTo(a, b + 0.1) : c.moveTo(a, b + 0.1)));
    c.closePath();
    c.fill();
    facet(c, pts, cx - 0.1 + r.range(-0.05, 0.05), cy - 0.12, base, 0.45, 'rgba(8,8,16,0.8)', 0.02);
    // secondary smaller facet cap
    const cap = ngon(cx - 0.06, cy - 0.1, r.range(0.16, 0.22), 5, r.range(0, 1), 0.85);
    facet(c, cap, cx - 0.12, cy - 0.18, shade(base, 0.12), 0.4);
    // moss specks on top (rusty lichen in autumn, fresh moss in spring)
    if (r.next() < 0.6) {
      c.fillStyle = season === 'autumn' ? 'rgba(150,90,50,0.55)' : season === 'spring' ? 'rgba(80,150,95,0.6)' : 'rgba(70,120,90,0.55)';
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        c.ellipse(cx + r.range(-0.25, 0.15), cy + r.range(-0.3, -0.05), r.range(0.03, 0.07), r.range(0.02, 0.04), 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (r.next() < 0.5) {
      // pebble beside
      const pxx = cx + r.range(-0.45, 0.45),
        pyy = y + 0.92;
      facet(c, ngon(pxx, pyy, 0.07, 5, r.next(), 0.7), pxx - 0.02, pyy - 0.03, base, 0.4);
    }
    if (snow) snowCap(c, pts, cx, cy, r, '#9aa8c0', '#c4d0e4', 'rgba(20,28,50,0.35)');
  }

  // 7b. gnarled dead trees
  drawTrees(c, map, T, 'night', season, vis, lod);
}

/** Snow resting on the upper part of a boulder outline. */
export function snowCap(c: CanvasRenderingContext2D, pts: [number, number][], cx: number, cy: number, r: TRng, body: string, hi: string, sh: string) {
  const top = Math.min(...pts.map((p) => p[1]));
  const path = new Path2D();
  pts.forEach(([a, b], i) => (i ? path.lineTo(a, b) : path.moveTo(a, b)));
  path.closePath();
  const lump = (dy: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(cx - 0.7, top - 0.1);
    c.lineTo(cx + 0.7, top - 0.1);
    let yy = cy - 0.08 + dy;
    c.lineTo(cx + 0.7, yy);
    for (let k = 0; k <= 8; k++) {
      const xx = cx + 0.7 - (k / 8) * 1.4;
      yy = cy + dy + Math.sin(k * 1.7 + cx * 3) * 0.04 + Math.sin((k / 8) * Math.PI) * 0.08;
      c.lineTo(xx, yy);
    }
    c.closePath();
    c.fill();
  };
  c.save();
  c.clip(path);
  lump(0.05, sh);
  lump(0, body);
  c.fillStyle = hi;
  c.beginPath();
  c.ellipse(cx - 0.12, top + 0.1, 0.22, 0.06, -0.1, 0, TAU);
  c.fill();
  c.restore();
  // a dusting overhanging the top edge
  c.fillStyle = body;
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.ellipse(cx + r.range(-0.25, 0.2), top + 0.04, r.range(0.08, 0.14), 0.045, 0, 0, TAU);
    c.fill();
  }
}

/** A glowing crystal vein on tile (x,y) — the night realm's eco tile. */
function crystalVein(c: CanvasRenderingContext2D, x: number, y: number, season: Sn) {
  const r = new TRng(x * 911 + y * 3571 + 7);
  const cx = x + 0.5,
    cy = y + 0.55;
  if (season === 'winter') {
    // the vein's warmth melts a ring in the snow
    glow(c, cx, cy + 0.02, 0.62, '#a8bcd8', 0.4);
  }
  c.fillStyle = 'rgba(8,24,32,0.75)';
  c.beginPath();
  c.ellipse(cx, cy, 0.46, 0.4, 0, 0, Math.PI * 2);
  c.fill();
  glow(c, cx, cy, 0.8, '#3fd0ff', 0.28);
  // glowing veins spreading out
  c.lineCap = 'round';
  for (let v = 0; v < 3; v++) {
    let vx = cx + r.range(-0.1, 0.1),
      vy = cy + r.range(-0.05, 0.1);
    const a0 = r.range(0, Math.PI * 2);
    c.beginPath();
    c.moveTo(vx, vy);
    for (let q = 0; q < 3; q++) {
      const a = a0 + r.range(-0.5, 0.5);
      vx += Math.cos(a) * 0.11;
      vy += Math.sin(a) * 0.09;
      c.lineTo(vx, vy);
    }
    c.strokeStyle = 'rgba(102,224,255,0.14)';
    c.lineWidth = 0.045;
    c.stroke();
    c.strokeStyle = 'rgba(160,240,255,0.35)';
    c.lineWidth = 0.012;
    c.stroke();
  }
  // shards
  const n = 4 + Math.floor(r.next() * 3);
  const shards: [number, number, number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    {
      const off = r.range(-0.24, 0.24);
      shards.push([cx + off, cy + r.range(0.0, 0.18), off * 1.6 + r.range(-0.2, 0.2), r.range(0.26, 0.5) * (1 - Math.abs(off)), r.range(0.07, 0.1)]);
    }
  }
  shards.sort((a, b) => a[1] - b[1]);
  for (const [sx, sy, ang, len, wd] of shards) crystalShard(c, sx, sy, ang, len, wd, '#66e0ff');
}

/** A single faceted crystal shard standing on (x,y), leaning by `ang`. */
export function crystalShard(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wd: number, col: string) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  const tip = -len;
  // left face
  c.fillStyle = shade(col, 0.55);
  c.beginPath();
  c.moveTo(0, 0.02);
  c.lineTo(-wd, -len * 0.25);
  c.lineTo(-wd * 0.7, tip * 0.8);
  c.lineTo(0, tip);
  c.closePath();
  c.fill();
  // right face
  c.fillStyle = shade(col, -0.15);
  c.beginPath();
  c.moveTo(0, 0.02);
  c.lineTo(wd, -len * 0.25);
  c.lineTo(wd * 0.7, tip * 0.8);
  c.lineTo(0, tip);
  c.closePath();
  c.fill();
  c.strokeStyle = shade(col, 0.8);
  c.lineWidth = 0.012;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, tip);
  c.stroke();
  c.strokeStyle = rgba('#051018', 0.6);
  c.lineWidth = 0.012;
  c.beginPath();
  c.moveTo(0, 0.02);
  c.lineTo(-wd, -len * 0.25);
  c.lineTo(-wd * 0.7, tip * 0.8);
  c.lineTo(0, tip);
  c.lineTo(wd * 0.7, tip * 0.8);
  c.lineTo(wd, -len * 0.25);
  c.closePath();
  c.stroke();
  c.restore();
}

// ====================================================================== shared: ponds

export interface WaterPal {
  rim: string;
  rimHi: string;
  water: string;
  deep: string;
  shine: string;
}

export function waterTiles(map: MapData, T: TFn): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (T(x, y) === Terrain.Water) out.push([x, y]);
  return out;
}

/**
 * Union of rounded blobs over all water tiles so adjacent tiles merge into one organic pond.
 * `grow` inflates the shape (rim / shore), negative values shrink it (deep middle).
 */
function pondPath(map: MapData, T: TFn, N: TFn, grow: number): Path2D {
  // A lattice of overlapping circles (tile centres, edge midpoints, 2x2 centres) gives one smooth,
  // gently scalloped shoreline with no straight tile edges.
  const p = new Path2D();
  const W = (x: number, y: number) => T(x, y) === Terrain.Water;
  const circ = (x: number, y: number, r: number) => {
    if (r <= 0.04) return;
    p.moveTo(x + r, y);
    p.arc(x, y, r, 0, TAU);
  };
  for (const [x, y] of waterTiles(map, T)) {
    const cx = x + 0.5,
      cy = y + 0.5;
    const n = (N(x, y) - 0.5) * 0.08;
    const R = 0.5 + grow + n;
    circ(cx, cy, R);
    if (W(x + 1, y)) circ(cx + 0.5, cy + n * 0.5, R * 0.97);
    if (W(x, y + 1)) circ(cx - n * 0.5, cy + 0.5, R * 0.97);
    if (W(x + 1, y) && W(x, y + 1) && W(x + 1, y + 1)) circ(cx + 0.5, cy + 0.5, R * 1.05);
    // a small wobbly bump on open shores
    const r2 = new TRng(x * 6151 + y * 911);
    const ba = r2.range(0, TAU);
    circ(cx + Math.cos(ba) * 0.2, cy + Math.sin(ba) * 0.2, R * 0.75);
  }
  return p;
}

export function drawWater(c: CanvasRenderingContext2D, map: MapData, T: TFn, N: TFn, pal: WaterPal) {
  if (!waterTiles(map, T).length) return;
  const rim = pondPath(map, T, N, 0.12);
  const body = pondPath(map, T, N, 0);
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.translate(0.03, 0.05);
  c.fill(rim);
  c.translate(-0.03, -0.05);
  c.fillStyle = pal.rim;
  c.fill(rim);
  // light catching the upper shore
  c.fillStyle = pal.rimHi;
  c.translate(-0.02, -0.035);
  c.fill(pondPath(map, T, N, 0.04));
  c.translate(0.02, 0.035);
  c.fillStyle = pal.water;
  c.fill(body);
  c.clip(body);
  // Depth: a blurred copy of the pond's own silhouette, so the water darkens smoothly with distance
  // from the shore as one continuous gradient (per-tile circles left pale seams between them).
  depthShade(c, map, T, body, pal.deep);
  // reflections: soft horizontal glints
  for (const [x, y] of waterTiles(map, T)) {
    const r = new TRng(x * 733 + y * 389 + 5);
    if (r.next() < 0.6) {
      c.strokeStyle = pal.shine;
      c.lineWidth = 0.035;
      c.lineCap = 'round';
      const gx = x + r.range(0.2, 0.6),
        gy = y + r.range(0.25, 0.75);
      c.beginPath();
      c.moveTo(gx, gy);
      c.lineTo(gx + r.range(0.15, 0.3), gy);
      c.stroke();
    }
  }
  c.restore();
}

/** The ponds' bounding box (tile units, one tile of slack) and its size in device pixels. */
function pondBox(c: CanvasRenderingContext2D, map: MapData, T: TFn) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of waterTiles(map, T)) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + 1);
    y1 = Math.max(y1, y + 1);
  }
  const m = c.getTransform();
  const k = Math.hypot(m.a, m.b) || 1;
  // the depth/frost gradients are soft, so their offscreen copies need only a modest resolution
  const sc = Math.min(k, 20);
  // only the part of the canvas that is actually painted (plus a tile, so the blur never sees the cut)
  x0 = Math.max(x0 - 1, Math.floor(-m.e / k) - 1);
  y0 = Math.max(y0 - 1, Math.floor(-m.f / k) - 1);
  x1 = Math.min(x1 + 1, Math.ceil((c.canvas.width - m.e) / k) + 1);
  y1 = Math.min(y1 + 1, Math.ceil((c.canvas.height - m.f) / k) + 1);
  if (x1 <= x0 || y1 <= y0) (x1 = x0 + 1), (y1 = y0 + 1);
  return { x0, y0, x1, y1, sc, cw: Math.max(1, Math.ceil((x1 - x0) * sc)), ch: Math.max(1, Math.ceil((y1 - y0) * sc)) };
}

/** The pond silhouette in `col`, blurred by `blurTiles`: opaque in the middle, fading toward every shore. */
function blurredSilhouette(box: ReturnType<typeof pondBox>, body: Path2D, col: string, blurTiles: number) {
  const { x0, y0, sc, cw, ch } = box;
  const sil = document.createElement('canvas');
  sil.width = cw;
  sil.height = ch;
  const g = sil.getContext('2d')!;
  g.scale(sc, sc);
  g.translate(-x0, -y0);
  g.fillStyle = col;
  g.fill(body);
  const blur = document.createElement('canvas');
  blur.width = cw;
  blur.height = ch;
  const b = blur.getContext('2d')!;
  b.filter = `blur(${(blurTiles * sc).toFixed(1)}px)`;
  b.drawImage(sil, 0, 0);
  return blur;
}

/** Fill `deep` over the pond with alpha rising from the shore to the middle (clipped by the caller). */
function depthShade(c: CanvasRenderingContext2D, map: MapData, T: TFn, body: Path2D, deep: string, alpha = 0.8, box = pondBox(c, map, T)) {
  const blur = blurredSilhouette(box, body, deep, 0.45);
  c.save();
  c.globalAlpha = alpha;
  c.drawImage(blur, box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
  c.restore();
}

/** Frost hugging the shore inside the pond: the inverse of the blurred silhouette (clipped by the caller). */
function shoreFrost(c: CanvasRenderingContext2D, body: Path2D, frost: string, box: ReturnType<typeof pondBox>) {
  const blur = blurredSilhouette(box, body, '#000000', 0.2);
  const f = document.createElement('canvas');
  f.width = box.cw;
  f.height = box.ch;
  const g = f.getContext('2d')!;
  g.fillStyle = frost;
  g.fillRect(0, 0, box.cw, box.ch);
  g.globalCompositeOperation = 'destination-out';
  g.drawImage(blur, 0, 0);
  c.drawImage(f, box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
}

export interface IcePal {
  rim: string;
  rimHi: string;
  ice: string;
  deep: string;
  frost: string;
  crack: string;
  crackHi: string;
  snow: string;
  sheen: string;
}

/** Winter ponds: frozen solid, a snowy bank, frosted edges, cracks, sheen and wind-blown snow. */
export function drawIce(c: CanvasRenderingContext2D, map: MapData, T: TFn, N: TFn, pal: IcePal) {
  const tiles = waterTiles(map, T);
  if (!tiles.length) return;
  const rim = pondPath(map, T, N, 0.14);
  const body = pondPath(map, T, N, 0);
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.translate(0.03, 0.05);
  c.fill(rim);
  c.translate(-0.03, -0.05);
  c.fillStyle = pal.rim;
  c.fill(rim);
  c.fillStyle = pal.rimHi;
  c.translate(-0.02, -0.035);
  c.fill(pondPath(map, T, N, 0.06));
  c.translate(0.02, 0.035);
  c.fillStyle = pal.ice;
  c.fill(body);
  c.clip(body);
  // the snowy bank's shadow along the upper shore, then frost creeping in from every edge
  c.fillStyle = 'rgba(0,10,30,0.12)';
  c.translate(0.04, 0.07);
  c.fill(rim);
  c.translate(-0.04, -0.07);
  c.fillStyle = pal.ice;
  c.translate(0.04, 0.07);
  c.fill(pondPath(map, T, N, -0.02));
  c.translate(-0.04, -0.07);
  // clearer, darker ice toward the middle (same seamless blurred-silhouette gradient as open water)
  const box = pondBox(c, map, T);
  depthShade(c, map, T, body, pal.deep, 0.6, box);
  shoreFrost(c, body, pal.frost, box);
  // broad diagonal sheen
  c.lineCap = 'round';
  for (const [x, y] of tiles) {
    const r = new TRng(x * 733 + y * 389 + 55);
    if (r.next() < 0.45) {
      const gx = x + r.range(0.1, 0.6),
        gy = y + r.range(0.3, 0.8),
        l = r.range(0.25, 0.5);
      c.strokeStyle = pal.sheen;
      c.lineWidth = r.range(0.05, 0.1);
      c.beginPath();
      c.moveTo(gx, gy);
      c.lineTo(gx + l, gy - l * 0.6);
      c.stroke();
    }
  }
  // cracks: jagged lines branching across the sheet
  for (const [x, y] of tiles) {
    const r = new TRng(x * 1237 + y * 4219 + 17);
    const n = 1 + Math.floor(r.next() * 2);
    for (let k = 0; k < n; k++) {
      let px = x + r.range(0, 1),
        py = y + r.range(0, 1);
      let a = r.range(0, TAU);
      const pts: [number, number][] = [[px, py]];
      const seg = 3 + Math.floor(r.next() * 3);
      for (let q = 0; q < seg; q++) {
        a += r.range(-0.7, 0.7);
        const l = r.range(0.1, 0.2);
        px += Math.cos(a) * l;
        py += Math.sin(a) * l;
        pts.push([px, py]);
      }
      const line = (dx: number, dy: number) => {
        c.beginPath();
        pts.forEach(([u, v], i) => (i ? c.lineTo(u + dx, v + dy) : c.moveTo(u + dx, v + dy)));
        c.stroke();
      };
      c.strokeStyle = pal.crackHi;
      c.lineWidth = 0.014;
      line(0.012, 0.014);
      c.strokeStyle = pal.crack;
      c.lineWidth = 0.012;
      line(0, 0);
      // a short branch
      const [bx, by] = pts[1 + Math.floor(r.next() * (pts.length - 1))];
      const ba = a + (r.next() < 0.5 ? 1 : -1) * r.range(0.8, 1.4);
      c.lineWidth = 0.009;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + Math.cos(ba) * 0.14, by + Math.sin(ba) * 0.14);
      c.lineTo(bx + Math.cos(ba + 0.4) * 0.22, by + Math.sin(ba + 0.4) * 0.22);
      c.stroke();
    }
    // wind-blown snow resting on the ice
    if (r.next() < 0.35) {
      const sx = x + r.range(0.2, 0.8),
        sy = y + r.range(0.2, 0.8);
      glow(c, sx, sy, r.range(0.3, 0.5), pal.snow, 0.7);
      c.fillStyle = rgba(pal.snow, 0.75);
      c.beginPath();
      c.ellipse(sx, sy, r.range(0.1, 0.18), r.range(0.04, 0.06), r.range(-0.3, 0.3), 0, TAU);
      c.fill();
    }
  }
  c.restore();
}

/** Things that live in and around ponds: reeds at night; lily pads, sparkles and sand by day. */
export function waterDecor(c: CanvasRenderingContext2D, map: MapData, T: TFn, realm: Realm, season: Sn = null) {
  const winter = season === 'winter';
  for (const [x, y] of waterTiles(map, T)) {
    const r = new TRng(x * 211 + y * 1543 + 99);
    const shore =
      T(x + 1, y) !== Terrain.Water || T(x - 1, y) !== Terrain.Water || T(x, y + 1) !== Terrain.Water || T(x, y - 1) !== Terrain.Water;
    if (season) {
      // seasonal flotsam: petals, floating leaves; glints of light on the ice
      const s = new TRng(x * 977 + y * 1361 + 4);
      if (season === 'spring' && s.next() < 0.5)
        for (let k = 0; k < 3; k++)
          petal(c, x + s.range(0.15, 0.85), y + s.range(0.15, 0.85), 0.025, s.range(0, 3), realm === 'day' ? 'rgba(255,200,222,0.9)' : 'rgba(220,195,220,0.6)');
      if (season === 'autumn' && s.next() < 0.55) {
        const cols = realm === 'day' ? ['#d8682a', '#e6a838', '#c04428'] : ['#8a4628', '#9c6a30'];
        for (let k = 0; k < 2; k++) leaf(c, x + s.range(0.15, 0.85), y + s.range(0.15, 0.85), 0.05, s.range(0, TAU), cols[k % cols.length], 'rgba(60,30,10,0.4)');
      }
      if (winter) {
        if (s.next() < 0.4) {
          const sx = x + s.range(0.2, 0.8),
            sy = y + s.range(0.2, 0.8);
          if (realm === 'day') sparkle(c, sx, sy, s.range(0.025, 0.045), 'rgba(255,255,255,0.95)');
          else glow(c, sx, sy, 0.1, '#d8ecff', 0.5);
        }
        if (shore && s.next() < 0.55) frozenReeds(c, x, y, T, s, realm);
        continue;
      }
    }
    if (realm === 'night') {
      if (shore && r.next() < 0.7) {
        // a clump of reeds on the shore side
        const dirs: [number, number][] = [];
        if (T(x + 1, y) !== Terrain.Water) dirs.push([1, 0]);
        if (T(x - 1, y) !== Terrain.Water) dirs.push([-1, 0]);
        if (T(x, y + 1) !== Terrain.Water) dirs.push([0, 1]);
        if (T(x, y - 1) !== Terrain.Water) dirs.push([0, -1]);
        const [dx, dy] = dirs[Math.floor(r.next() * dirs.length)];
        const bx = x + 0.5 + dx * 0.4 + r.range(-0.15, 0.15) * (dy ? 1 : 0),
          by = y + 0.55 + dy * 0.4 + r.range(-0.15, 0.15) * (dx ? 1 : 0);
        c.lineCap = 'round';
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + r.range(-0.45, 0.45);
          const len = r.range(0.18, 0.34);
          c.strokeStyle = season === 'autumn' ? (k % 2 ? '#4a3a2a' : '#5a4630') : k % 2 ? '#2c3b38' : '#38484a';
          c.lineWidth = 0.022;
          c.beginPath();
          c.moveTo(bx + r.range(-0.06, 0.06), by);
          c.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.5, bx + Math.cos(a) * len, by + Math.sin(a) * len);
          c.stroke();
          if (k === 2) {
            c.fillStyle = '#4a3a30';
            c.beginPath();
            c.ellipse(bx + Math.cos(a) * len, by + Math.sin(a) * len, 0.025, 0.06, a + Math.PI / 2, 0, TAU);
            c.fill();
          }
        }
      }
      if (r.next() < 0.18) {
        // a cold glint of starlight on the water
        const sx = x + r.range(0.3, 0.7),
          sy = y + r.range(0.3, 0.7);
        glow(c, sx, sy, 0.12, '#9ec8ff', 0.4);
      }
    } else {
      if (r.next() < 0.45) {
        // lily pad (maybe flowering)
        const lx = x + r.range(0.25, 0.75),
          ly = y + r.range(0.25, 0.75),
          lr = r.range(0.09, 0.15),
          la = r.range(0, TAU);
        c.fillStyle = 'rgba(20,60,40,0.25)';
        c.beginPath();
        c.ellipse(lx + 0.02, ly + 0.025, lr, lr * 0.85, 0, 0, TAU);
        c.fill();
        c.fillStyle = season === 'autumn' ? mix('#8a8a3a', '#a08a3a', r.next()) : mix('#4f9a3c', '#6ab34a', r.next());
        c.beginPath();
        c.moveTo(lx, ly);
        c.arc(lx, ly, lr, la + 0.35, la + TAU - 0.05);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(30,70,25,0.5)';
        c.lineWidth = 0.01;
        c.stroke();
        if (r.next() < (season === 'spring' || season === 'summer' ? 0.6 : season === 'autumn' ? 0 : 0.4)) {
          const col = r.next() < 0.5 ? '#ffd0e4' : '#fff6f0';
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * TAU;
            c.fillStyle = col;
            c.beginPath();
            c.ellipse(lx + Math.cos(a) * 0.035, ly + Math.sin(a) * 0.035, 0.035, 0.018, a, 0, TAU);
            c.fill();
          }
          c.fillStyle = '#ffd24a';
          c.beginPath();
          c.arc(lx, ly, 0.018, 0, TAU);
          c.fill();
        }
      }
      if (r.next() < 0.5) {
        // sun sparkle
        const sx = x + r.range(0.2, 0.8),
          sy = y + r.range(0.2, 0.8),
          ss = r.range(0.03, 0.06);
        sparkle(c, sx, sy, ss, 'rgba(255,255,255,0.85)');
      }
    }
  }
}

/** Dry, snow-tipped reeds frozen into the ice at the shore. */
function frozenReeds(c: CanvasRenderingContext2D, x: number, y: number, T: TFn, r: TRng, realm: Realm) {
  const dirs: [number, number][] = [];
  if (T(x + 1, y) !== Terrain.Water) dirs.push([1, 0]);
  if (T(x - 1, y) !== Terrain.Water) dirs.push([-1, 0]);
  if (T(x, y + 1) !== Terrain.Water) dirs.push([0, 1]);
  if (T(x, y - 1) !== Terrain.Water) dirs.push([0, -1]);
  if (!dirs.length) return;
  const [dx, dy] = dirs[Math.floor(r.next() * dirs.length)];
  const bx = x + 0.5 + dx * 0.4 + r.range(-0.15, 0.15) * (dy ? 1 : 0),
    by = y + 0.55 + dy * 0.4 + r.range(-0.15, 0.15) * (dx ? 1 : 0);
  const stalk = realm === 'day' ? ['#9a7a50', '#b08c5c'] : ['#3e3a3a', '#4a4444'];
  const snowc = realm === 'day' ? '#f6f9fd' : '#a8b6cc';
  c.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const a = -Math.PI / 2 + r.range(-0.5, 0.5);
    const len = r.range(0.15, 0.3);
    const ex = bx + Math.cos(a) * len,
      ey = by + Math.sin(a) * len;
    c.strokeStyle = stalk[k % 2];
    c.lineWidth = 0.018;
    c.beginPath();
    c.moveTo(bx + r.range(-0.05, 0.05), by);
    c.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.5, ex, ey);
    c.stroke();
    c.fillStyle = snowc;
    c.beginPath();
    c.ellipse(ex, ey, 0.022, 0.016, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = snowc;
  c.beginPath();
  c.ellipse(bx, by + 0.02, 0.1, 0.035, 0, 0, TAU);
  c.fill();
}

// ====================================================================== shared: trees

function drawTrees(c: CanvasRenderingContext2D, map: MapData, T: TFn, realm: Realm, season: Sn = null, vis: Vis = ALL, lod = false) {
  const trees: [number, number][] = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (T(x, y) === Terrain.Tree && vis(x, y)) trees.push([x, y]);
  // shadows first so canopies overlap neighbouring shadows, then trees back-to-front
  for (const [x, y] of trees) {
    const r = new TRng(x * 1999 + y * 271);
    const cx = x + 0.5 + r.range(-0.08, 0.08),
      cy = y + 0.55 + r.range(-0.06, 0.06);
    if (realm === 'day') glowShadow(c, cx + 0.18, cy + 0.22, 0.62, season === 'winter' ? 0.22 : 0.34);
    else glowShadow(c, cx + 0.1, cy + 0.18, 0.55, 0.42);
  }
  // seasonal dress (blossom, leaves, snow) is batched per row: rows are drawn back-to-front anyway
  const B = new Batch();
  let row = -1;
  for (const [x, y] of trees) {
    if (y !== row) B.flush(c), (row = y);
    const r = new TRng(x * 1999 + y * 271);
    const cx = x + 0.5 + r.range(-0.08, 0.08),
      cy = y + 0.55 + r.range(-0.06, 0.06);
    if (realm === 'day') dayTree(c, cx, cy, r, season, x * 31 + y * 7, B, lod);
    else deadTree(c, cx, cy, r, season, false, B, lod);
  }
  B.flush(c);
}

export function glowShadow(c: CanvasRenderingContext2D, x: number, y: number, rx: number, a: number) {
  c.save();
  c.translate(x, y);
  c.scale(1, 0.55);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
}

/**
 * A gnarled leafless tree. At night it is the realm's dead tree (with seasonal blossom, leaves or
 * snow); by day in winter it is a bare brown tree carrying snow.
 */
export function deadTree(c: CanvasRenderingContext2D, cx: number, cy: number, r: TRng, season: Sn, day = false, batch?: Batch, lod = false, noGlow = false) {
  const bark = day ? mix('#6a5444', '#7a604c', r.next()) : mix('#4a4052', '#574a5c', r.next());
  const outline = day ? 'rgba(45,32,24,0.7)' : 'rgba(8,6,12,0.75)';
  const edge = day ? 'rgba(255,245,230,0.3)' : 'rgba(160,175,220,0.22)';
  const segs: [number, number, number, number, number, number, number, number][] = [];
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (season === 'winter') {
    // snow banked around the foot of the trunk
    c.fillStyle = day ? 'rgba(246,249,253,0.9)' : 'rgba(140,154,180,0.85)';
    c.beginPath();
    c.ellipse(cx, cy + 0.14, 0.42, 0.16, 0, 0, TAU);
    c.fill();
  }
  // exposed roots
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + r.range(-0.3, 0.3);
    const len = r.range(0.22, 0.4);
    c.strokeStyle = shade(bark, -0.25);
    c.lineWidth = 0.07;
    c.beginPath();
    c.moveTo(cx, cy + 0.08);
    c.quadraticCurveTo(cx + Math.cos(a) * len * 0.5 + r.range(-0.05, 0.05), cy + 0.1 + Math.sin(a) * len * 0.35, cx + Math.cos(a) * len, cy + 0.1 + Math.sin(a) * len * 0.5);
    c.stroke();
  }
  // trunk
  c.fillStyle = bark;
  c.beginPath();
  c.moveTo(cx - 0.16, cy + 0.12);
  c.quadraticCurveTo(cx - 0.07, cy - 0.1, cx - 0.08, cy - 0.32);
  c.lineTo(cx + 0.08, cy - 0.34);
  c.quadraticCurveTo(cx + 0.08, cy - 0.1, cx + 0.17, cy + 0.12);
  c.closePath();
  c.fill();
  c.strokeStyle = day ? 'rgba(40,28,20,0.8)' : 'rgba(8,6,12,0.8)';
  c.lineWidth = 0.02;
  c.stroke();
  // gnarled branches, recursively
  const branch = (x: number, y: number, a: number, len: number, w: number, d: number) => {
    const bend = r.range(-0.5, 0.5);
    const mx = x + Math.cos(a + bend) * len * 0.5,
      my = y + Math.sin(a + bend) * len * 0.5;
    const ex = x + Math.cos(a) * len,
      ey = y + Math.sin(a) * len;
    segs.push([x, y, mx, my, ex, ey, w, d]);
    c.strokeStyle = outline;
    c.lineWidth = w + 0.025;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(mx, my, ex, ey);
    c.stroke();
    c.strokeStyle = shade(bark, 0.1 + d * 0.05);
    c.lineWidth = w;
    c.stroke();
    // cold moonlit edge
    c.strokeStyle = edge;
    c.lineWidth = w * 0.35;
    c.beginPath();
    c.moveTo(x - w * 0.25, y - w * 0.25);
    c.quadraticCurveTo(mx - w * 0.25, my - w * 0.25, ex - w * 0.25, ey - w * 0.25);
    c.stroke();
    if (d > 0) {
      const n = d > 1 ? 2 : 1 + (r.next() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) branch(ex, ey, a + r.range(-0.75, 0.75), len * r.range(0.55, 0.75), w * 0.6, d - 1);
    }
  };
  const nb = 3 + Math.floor(r.next() * 2);
  for (let i = 0; i < nb; i++) {
    const a = -Math.PI / 2 + (i - (nb - 1) / 2) * 0.9 + r.range(-0.25, 0.25);
    branch(cx + r.range(-0.03, 0.03), cy - 0.3, a, r.range(0.26, 0.38), 0.085, 2);
  }
  if (!day) {
    // pale lichen and a hanging moss strand
    c.fillStyle = 'rgba(150,170,150,0.35)';
    c.beginPath();
    c.ellipse(cx - 0.04, cy - 0.12, 0.035, 0.06, 0.2, 0, TAU);
    c.fill();
    if (r.next() < 0.5 && !noGlow) glow(c, cx + r.range(-0.3, 0.3), cy - r.range(0.3, 0.5), 0.12, '#7fd8c0', 0.25);
  }
  if (season) treeSeason(c, cx, cy, segs, season, day, batch, lod);
}

/** Seasonal dress for a bare tree's branches: blossom, leaf clusters or a load of snow. */
function treeSeason(c: CanvasRenderingContext2D, cx: number, cy: number, segs: [number, number, number, number, number, number, number, number][], season: Season, day: boolean, batch?: Batch, lod = false) {
  const b = batch ?? new Batch();
  const s = new TRng(Math.floor(cx * 7919 + cy * 104729) ^ 0x7ee);
  if (season === 'winter') {
    const body = day ? '#f6f9fd' : '#a2b0c8';
    const sh = day ? 'rgba(150,170,200,0.6)' : 'rgba(30,38,60,0.5)';
    for (const [x, y, mx, my, ex, ey, w] of segs) {
      const horiz = Math.abs(ex - x) / (Math.hypot(ex - x, ey - y) || 1);
      const lw = w * (0.35 + 0.6 * horiz);
      const up = w * 0.42;
      b.lineWidth = lw;
      b.strokeStyle = sh;
      b.beginPath();
      b.moveTo(x, y - up * 0.6);
      b.quadraticCurveTo(mx, my - up * 0.6, ex, ey - up * 0.6);
      b.stroke();
      b.strokeStyle = body;
      b.lineWidth = lw * 0.85;
      b.beginPath();
      b.moveTo(x, y - up);
      b.quadraticCurveTo(mx, my - up, ex, ey - up);
      b.stroke();
    }
    // snow lying in the fork of the trunk
    b.fillStyle = body;
    b.beginPath();
    b.ellipse(cx, cy - 0.33, 0.1, 0.04, 0, 0, TAU);
    b.fill();
    if (!batch) b.flush(c);
    return;
  }
  const tips = segs.filter((g) => g[7] === 0);
  const mids = segs.filter((g) => g[7] === 1);
  if (season === 'spring') {
    // pale blossom clustered at the twig ends
    const cols = day ? ['#f6c8dc', '#fff4f8', '#f0a8c4'] : ['#e8cce0', '#f4eef8', '#d8b8d8'];
    for (const g of [...tips, ...mids]) {
      const [, , , , ex, ey] = g;
      if (!day) {
        b.fillStyle = 'rgba(255,216,240,0.08)';
        b.beginPath();
        b.arc(ex, ey, 0.13, 0, TAU);
        b.fill();
      }
      const n = lod ? 2 : 4 + Math.floor(s.next() * 4);
      for (let k = 0; k < n; k++) {
        b.fillStyle = cols[Math.floor(s.next() * cols.length)];
        b.globalAlpha = day ? 1 : 0.9;
        b.beginPath();
        b.arc(ex + s.range(-0.07, 0.07), ey + s.range(-0.06, 0.05), s.range(0.025, 0.04), 0, TAU);
        b.fill();
      }
      b.globalAlpha = 1;
    }
    // a few petals have fallen
    for (let k = 0; k < 5; k++) petal(b, cx + s.range(-0.5, 0.5), cy + s.range(0.05, 0.4), 0.022, s.range(0, 3), day ? 'rgba(255,215,230,0.9)' : 'rgba(225,200,225,0.7)');
    if (!batch) b.flush(c);
    return;
  }
  // summer: dusky leaf clusters; autumn: sparse rust and ochre leaves
  const cols =
    season === 'summer' ? (day ? ['#3a7a2c', '#4a8a34'] : ['#2a4630', '#34543a', '#3c5a34']) : day ? ['#d8682a', '#e6a838', '#c04428'] : ['#9a5030', '#b07a34', '#8a3a26'];
  const per = season === 'summer' ? 8 : day ? 3 : 4;
  for (const g of day && season === 'autumn' ? tips : [...tips, ...mids]) {
    const [, , , , ex, ey] = g;
    const n = lod ? Math.ceil(per / 3) : per + Math.floor(s.next() * 3);
    for (let k = 0; k < n; k++) leaf(b, ex + s.range(-0.08, 0.08), ey + s.range(-0.07, 0.06), s.range(0.035, 0.05), s.range(0, TAU), cols[Math.floor(s.next() * cols.length)]);
  }
  if (!batch) b.flush(c);
}

const DAY_GREENS: Record<Season | 'legacy', string[]> = {
  legacy: ['#4e8a3a', '#5b9a42', '#4a8040'],
  spring: ['#5aa63e', '#68b046', '#4f9a3c'],
  summer: ['#2f6e2a', '#3a7a2e', '#2a6430'],
  autumn: ['#4e8a3a', '#5b9a42', '#4a8040'],
  winter: ['#2c5a42', '#33604a', '#284f3e'],
};
const AUTUMN_CROWNS = ['#e07a2a', '#d04a28', '#e8b030', '#c8602a', '#b83a2a', '#d89a2c', '#a8a038'];

export function dayTree(c: CanvasRenderingContext2D, cx: number, cy: number, r: TRng, season: Sn = null, id = 0, batch?: Batch, lod = false) {
  const s = new TRng(id * 7919 + 0x7a3);
  if (season === 'winter' && s.next() < 0.45) {
    deadTree(c, cx, cy, r, season, true, batch, lod);
    return;
  }
  let blossom = r.next() < 0.28;
  const greens = DAY_GREENS[season ?? 'legacy'];
  const leaf = greens[Math.floor(r.next() * greens.length)];
  let crown = blossom ? (r.next() < 0.5 ? '#f0a8c4' : '#f6d2e2') : leaf;
  if (season && season !== 'spring' && blossom) {
    blossom = false;
    crown = leaf;
  }
  if (season === 'spring' && !blossom && s.next() < 0.5) {
    blossom = true;
    crown = s.next() < 0.5 ? '#f0a8c4' : '#f6d2e2';
  }
  if (season === 'autumn') crown = AUTUMN_CROWNS[Math.floor(s.next() * AUTUMN_CROWNS.length)];
  // trunk peeking out under the canopy
  c.fillStyle = '#6a4a30';
  c.beginPath();
  c.moveTo(cx - 0.07, cy + 0.12);
  c.lineTo(cx - 0.05, cy - 0.1);
  c.lineTo(cx + 0.05, cy - 0.1);
  c.lineTo(cx + 0.08, cy + 0.12);
  c.closePath();
  c.fill();
  const ccx = cx,
    ccy = cy - 0.24;
  const R = r.range(0.44, 0.54);
  // canopy: overlapping puffs, darker underneath, lit from the upper left
  const puffs: [number, number, number][] = [[ccx, ccy, R * 0.75]];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r.range(-0.3, 0.3);
    puffs.push([ccx + Math.cos(a) * R * 0.5, ccy + Math.sin(a) * R * 0.45, R * r.range(0.42, 0.55)]);
  }
  c.fillStyle = shade(blossom ? leaf : crown, -0.35);
  for (const [x, y, rr] of puffs) {
    c.beginPath();
    c.arc(x + 0.02, y + 0.05, rr, 0, TAU);
    c.fill();
  }
  for (const [x, y, rr] of puffs) {
    const g = c.createRadialGradient(x - rr * 0.4, y - rr * 0.45, rr * 0.1, x, y, rr);
    g.addColorStop(0, shade(crown, 0.28));
    g.addColorStop(0.6, crown);
    g.addColorStop(1, shade(crown, -0.18));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, rr, 0, TAU);
    c.fill();
  }
  c.strokeStyle = rgba(shade(crown, -0.55), 0.45);
  c.lineWidth = 0.018;
  for (const [x, y, rr] of puffs.slice(1)) {
    c.beginPath();
    c.arc(x, y, rr, 0.2, Math.PI - 0.2);
    c.stroke();
  }
  if (season === 'winter') {
    // snow heaped on the top of every puff
    for (const [x, y, rr] of puffs) {
      c.save();
      c.beginPath();
      c.arc(x, y, rr, 0, TAU);
      c.clip();
      c.fillStyle = 'rgba(150,172,200,0.55)';
      c.beginPath();
      c.ellipse(x - rr * 0.1, y - rr * 0.42, rr * 1.05, rr * 0.62, -0.15, 0, TAU);
      c.fill();
      c.fillStyle = '#f4f8fc';
      c.beginPath();
      c.ellipse(x - rr * 0.12, y - rr * 0.52, rr * 1.0, rr * 0.55, -0.15, 0, TAU);
      c.fill();
      c.restore();
    }
  }
  // leaf / petal speckles
  for (let k = 0; k < 9; k++) {
    const a = r.range(0, TAU),
      d = r.range(0, R * 0.85);
    c.fillStyle = blossom ? (r.next() < 0.5 ? '#ffffff' : '#ffc0d8') : season === 'winter' ? 'rgba(255,255,255,0.9)' : rgba(shade(crown, 0.45), 0.8);
    c.beginPath();
    c.arc(ccx + Math.cos(a) * d, ccy + Math.sin(a) * d * 0.9, 0.022, 0, TAU);
    c.fill();
  }
  if (blossom) {
    // fallen petals on the grass
    for (let k = 0; k < 6; k++) {
      c.fillStyle = r.next() < 0.5 ? 'rgba(255,200,220,0.85)' : 'rgba(255,240,245,0.85)';
      c.beginPath();
      c.ellipse(cx + r.range(-0.55, 0.55), cy + r.range(0.1, 0.42), 0.025, 0.014, r.range(0, 3), 0, TAU);
      c.fill();
    }
  }
}

// ====================================================================== day: a sunlit sky-island meadow

const DAY_GRASS = ['#8cbc66', '#86b862', '#92c06c', '#88b964', '#8fbd68'];

interface DayPal {
  fill: string;
  tiles: string[];
  tileA: number;
  blobs: [string, string, string];
  stripe: string;
  tufts: [string, string];
  clover: string;
  grid: string;
  flowers: string[];
  flowerP: number;
  /** Colour the outer scenery fades into. */
  base: string;
}

const DAY_LEGACY: DayPal = {
  fill: '#89b964',
  tiles: DAY_GRASS,
  tileA: 0.28,
  blobs: ['#a5cf7a', '#76a856', '#bccb7c'],
  stripe: 'rgba(255,255,230,0.035)',
  tufts: ['#5f9446', '#6fa651'],
  clover: '#5e9a45',
  grid: 'rgba(40,70,20,0.06)',
  flowers: ['#ffffff', '#fff2a0', '#d8b8f0', '#ffd0e0'],
  flowerP: 0.2,
  base: '#86b862',
};

const DAY_PALS: Record<Season, DayPal> = {
  spring: {
    fill: '#7cc25a',
    tiles: ['#7cc45a', '#84c862', '#78c058', '#88ca66', '#80c25c'],
    tileA: 0.22,
    blobs: ['#a0dc76', '#5ca642', '#c2e486'],
    stripe: 'rgba(255,255,230,0.035)',
    tufts: ['#4f9a3a', '#62ac48'],
    clover: '#4e9a3a',
    grid: 'rgba(40,70,20,0.06)',
    flowers: ['#ffffff', '#fff2a0', '#e0b0f0', '#ffb8d4', '#b8d0ff'],
    flowerP: 0.3,
    base: '#7cc25a',
  },
  summer: {
    fill: '#a2b85e',
    tiles: ['#a6ba62', '#9eb65e', '#acbc66', '#9ab45c', '#a4b860'],
    tileA: 0.22,
    blobs: ['#c6c070', '#78a04a', '#d8c478'],
    stripe: 'rgba(255,250,210,0.03)',
    tufts: ['#5e8a3a', '#6e9640'],
    clover: '#5e8c3c',
    grid: 'rgba(70,60,20,0.07)',
    flowers: ['#ffffff', '#fff2a0', '#ffc060'],
    flowerP: 0.07,
    base: '#a6b862',
  },
  autumn: {
    fill: '#aa9c58',
    tiles: ['#ac9e5a', '#a49858', '#b0a060', '#a09656', '#ae9c58'],
    tileA: 0.22,
    blobs: ['#c8a04c', '#8c8a46', '#c48a44'],
    stripe: 'rgba(255,240,200,0.03)',
    tufts: ['#8a7638', '#9a8240'],
    clover: '#867c3c',
    grid: 'rgba(70,50,20,0.07)',
    flowers: ['#f2e2b0', '#e8c8e0'],
    flowerP: 0.03,
    base: '#a89a58',
  },
  winter: {
    fill: '#d0dbe7',
    tiles: ['#cdd9e6', '#d4deea', '#cad6e4', '#d6e0eb', '#d0dbe7'],
    tileA: 0.3,
    blobs: ['#e6edf5', '#aebed4', '#eef3f9'],
    stripe: 'rgba(0,0,0,0)',
    tufts: ['#848c68', '#949874'],
    clover: '#6a8a5a',
    grid: 'rgba(50,70,110,0.08)',
    flowers: [],
    flowerP: 0,
    base: '#cad6e3',
  },
};

function dayPal(s: Sn): DayPal {
  return s ? DAY_PALS[s] : DAY_LEGACY;
}

function renderDay(c: CanvasRenderingContext2D, map: MapData, off = 0, season: Sn = null, vis: Vis = ALL, lod = false) {
  const W = map.w,
    H = map.h;
  const T = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? Terrain.Grass : map.terrain[y * W + x]);
  const N = (x: number, y: number) => map.noise[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const rng = new TRng(Math.floor(map.noise[0] * 1e9) ^ 0xda7);
  const pcx = CORE_X + 0.5 + off,
    pcy = CORE_Y + 0.5 + off;
  const P = dayPal(season);
  const snow = season === 'winter';
  const F = patchField(Math.floor(map.noise[2] * 1e9) ^ 0xf1e1d);

  // 1. grass base
  c.fillStyle = P.fill;
  c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      c.fillStyle = P.tiles[Math.floor(N(x, y) * P.tiles.length) % P.tiles.length];
      c.globalAlpha = P.tileA;
      c.fillRect(x - 0.02, y - 0.02, 1.04, 1.04);
    }
  c.globalAlpha = 1;
  for (let i = 0; i < 80; i++) {
    const roll = rng.next();
    const col = roll < 0.4 ? P.blobs[0] : roll < 0.75 ? P.blobs[1] : P.blobs[2];
    glow(c, rng.range(-2, W + 2), rng.range(-2, H + 2), rng.range(1.5, 4.5), col, rng.range(0.25, 0.45));
  }
  if (season) seasonSwathes(c, W, H, season, 'day', F, new TRng(Math.floor(map.noise[3] * 1e9) ^ 0x5ea5));
  // mown stripes, very faint, for a cared-for garden feel
  c.fillStyle = P.stripe;
  if (!snow) for (let x = 0; x < W; x += 2) c.fillRect(x, 0, 1, H);

  // 2. a round marble rotunda floor: concentric rings of curved slabs, a curb, and mosaic bands
  const ringR = [0.0, 1.05, 1.75, 2.4, 2.95, 3.45];
  const ry = 1 / 1.08; // very slight perspective squash
  const arcPath = (r0: number, r1: number, a0: number, a1: number) => {
    const p = new Path2D();
    p.ellipse(pcx, pcy, r1, r1 * ry, 0, a0, a1);
    if (r0 > 0) p.ellipse(pcx, pcy, r0, r0 * ry, 0, a1, a0, true);
    else p.lineTo(pcx, pcy);
    p.closePath();
    return p;
  };
  // soft shadow + curb
  glowShadow(c, pcx + 0.1, pcy + 0.18, ringR[5] + 0.5, season === 'winter' ? 0.16 : 0.28);
  c.fillStyle = '#b9b09a';
  c.fill(arcPath(0, ringR[5] + 0.12, 0, TAU));
  const prng = new TRng(31337);
  for (let k = 1; k < ringR.length; k++) {
    const r0 = ringR[k - 1],
      r1 = ringR[k];
    const n = k === 1 ? 1 : Math.max(8, Math.round(((r0 + r1) / 2) * 5.2));
    const off = prng.range(0, TAU);
    for (let q = 0; q < n; q++) {
      const a0 = off + (q / n) * TAU,
        a1 = off + ((q + 1) / n) * TAU;
      const slab = arcPath(r0, r1, a0, a1);
      c.fillStyle = mix('#efe9da', k === 4 ? '#e6dcc2' : '#ded6c2', prng.next());
      c.fill(slab);
      c.strokeStyle = 'rgba(140,128,100,0.55)';
      c.lineWidth = 0.022;
      c.stroke(slab);
      if (prng.next() < 0.35) {
        // faint vein
        const am = (a0 + a1) / 2,
          rm = (r0 + r1) / 2;
        c.strokeStyle = 'rgba(165,155,135,0.35)';
        c.lineWidth = 0.01;
        c.beginPath();
        c.moveTo(pcx + Math.cos(am - 0.1) * (r0 + 0.08), pcy + Math.sin(am - 0.1) * (r0 + 0.08) * ry);
        c.quadraticCurveTo(pcx + Math.cos(am) * rm, pcy + Math.sin(am) * rm * ry, pcx + Math.cos(am + 0.08) * (r1 - 0.08), pcy + Math.sin(am + 0.08) * (r1 - 0.08) * ry);
        c.stroke();
      }
    }
  }
  // highlight on the upper-left rim
  c.strokeStyle = 'rgba(255,255,250,0.55)';
  c.lineWidth = 0.04;
  c.beginPath();
  c.ellipse(pcx, pcy, ringR[5] + 0.06, (ringR[5] + 0.06) * ry, 0, Math.PI * 0.95, Math.PI * 1.7);
  c.stroke();
  // mosaic bands of tesserae
  for (const [rad, cols, size] of [
    [2.07, ['#d0a640', '#e2c070'], 0.1],
    [3.2, ['#5fafa6', '#d0a640', '#8cc6be'], 0.085],
  ] as const) {
    const n = Math.floor((TAU * rad) / (size * 1.55));
    for (let q = 0; q < n; q++) {
      const a = (q / n) * TAU;
      c.save();
      c.translate(pcx + Math.cos(a) * rad, pcy + Math.sin(a) * rad * ry);
      c.rotate(a);
      c.fillStyle = cols[q % cols.length];
      c.fillRect(-size / 2, -size / 2, size, size);
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.fillRect(-size / 2, -size / 2, size, size * 0.3);
      c.restore();
    }
  }
  // gilded sun-ray inlays in the band between
  c.strokeStyle = 'rgba(200,160,70,0.7)';
  c.lineWidth = 0.035;
  c.lineCap = 'round';
  for (let q = 0; q < 24; q++) {
    const a = (q / 24) * TAU;
    const r0 = 2.5,
      r1 = q % 2 ? 2.78 : 2.88;
    c.beginPath();
    c.moveTo(pcx + Math.cos(a) * r0, pcy + Math.sin(a) * r0 * ry);
    c.lineTo(pcx + Math.cos(a) * r1, pcy + Math.sin(a) * r1 * ry);
    c.stroke();
  }
  if (season) plazaSeason(c, pcx, pcy, ringR[5], ry, season);
  // grass tufts nestling against the curb
  for (let q = 0; q < (snow ? 0 : 40); q++) {
    const a = prng.range(0, TAU),
      rr = ringR[5] + prng.range(0.1, 0.25);
    const bx = pcx + Math.cos(a) * rr,
      by = pcy + Math.sin(a) * rr * ry;
    c.strokeStyle = prng.next() < 0.5 ? P.tufts[0] : P.tufts[1];
    c.lineWidth = 0.022;
    for (let b = 0; b < 3; b++) {
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + prng.range(-0.07, 0.07), by - prng.range(0.07, 0.13));
      c.stroke();
    }
  }

  // 3. faint grid so the build grid can still be read
  c.strokeStyle = P.grid;
  c.lineWidth = 0.02;
  c.beginPath();
  for (let x = 1; x < W; x++) {
    c.moveTo(x, 0);
    c.lineTo(x, H);
  }
  for (let y = 1; y < H; y++) {
    c.moveTo(0, y);
    c.lineTo(W, y);
  }
  c.stroke();

  // 4. meadow life: tufts, clover, wildflowers, pebbles, stepping stones
  const B = new Batch();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      if (T(x, y) !== Terrain.Grass) continue;
      const d = Math.hypot(x + 0.5 - pcx, (y + 0.5 - pcy) * 1.08);
      if (d < 3.8) continue;
      const r = new TRng(x * 3301 + y * 7727 + 77);
      let tufts = r.next() < 0.5 ? 1 + Math.floor(r.next() * 3) : 0;
      if (snow) tufts = 0;
      for (let k = 0; k < tufts; k++) {
        const bx = x + r.range(0.12, 0.88),
          by = y + r.range(0.2, 0.92);
        c.strokeStyle = r.next() < 0.5 ? P.tufts[0] : P.tufts[1];
        c.lineWidth = 0.022;
        c.lineCap = 'round';
        const blades = 3 + Math.floor(r.next() * 3);
        for (let q = 0; q < blades; q++) {
          const a = -Math.PI / 2 + (q - (blades - 1) / 2) * 0.35 + r.range(-0.1, 0.1);
          const len = r.range(0.08, 0.16);
          c.beginPath();
          c.moveTo(bx, by);
          c.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.6, bx + Math.cos(a) * len + 0.02, by + Math.sin(a) * len);
          c.stroke();
        }
      }
      if (r.next() < 0.12 && !snow) {
        // clover
        const kx = x + r.range(0.2, 0.8),
          ky = y + r.range(0.2, 0.8);
        c.fillStyle = P.clover;
        for (let q = 0; q < 3; q++) {
          const a = (q / 3) * TAU - Math.PI / 2;
          c.beginPath();
          c.arc(kx + Math.cos(a) * 0.04, ky + Math.sin(a) * 0.04, 0.035, 0, TAU);
          c.fill();
        }
      }
      if (r.next() < P.flowerP) {
        // a few wildflowers
        const cols = P.flowers;
        const n = 1 + Math.floor(r.next() * 3);
        for (let q = 0; q < n; q++) {
          const fx = x + r.range(0.15, 0.85),
            fy = y + r.range(0.15, 0.85);
          const col = cols[Math.floor(r.next() * cols.length)];
          const pr = r.range(0.022, 0.034);
          c.fillStyle = 'rgba(40,70,20,0.25)';
          c.beginPath();
          c.arc(fx + 0.01, fy + 0.015, pr * 1.6, 0, TAU);
          c.fill();
          c.fillStyle = col;
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * TAU;
            c.beginPath();
            c.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.75, 0, TAU);
            c.fill();
          }
          c.fillStyle = col === '#fff2a0' ? '#e0a020' : '#f2c040';
          c.beginPath();
          c.arc(fx, fy, pr * 0.6, 0, TAU);
          c.fill();
        }
      }
      if (r.next() < 0.06 && !snow) {
        // pale pebbles
        const n = 1 + Math.floor(r.next() * 3);
        for (let k = 0; k < n; k++) {
          const px2 = x + r.range(0.15, 0.85),
            py2 = y + r.range(0.15, 0.85),
            pr = r.range(0.025, 0.05);
          c.fillStyle = 'rgba(40,60,20,0.3)';
          c.beginPath();
          c.ellipse(px2 + 0.012, py2 + 0.015, pr, pr * 0.7, 0, 0, TAU);
          c.fill();
          c.fillStyle = mix('#bdb8a4', '#d6d0bf', r.next());
          c.beginPath();
          c.ellipse(px2, py2, pr * 0.8, pr * 0.56, 0, 0, TAU);
          c.fill();
        }
      }
      if (N(x, y) > 0.988 && d > 4.5) {
        // a flat stepping stone
        const sx = x + 0.5,
          sy = y + 0.5;
        c.fillStyle = 'rgba(40,60,20,0.3)';
        c.beginPath();
        c.ellipse(sx + 0.03, sy + 0.04, 0.3, 0.2, 0.2, 0, TAU);
        c.fill();
        c.fillStyle = '#d8d2c0';
        c.beginPath();
        c.ellipse(sx, sy, 0.3, 0.2, 0.2, 0, TAU);
        c.fill();
        c.fillStyle = snow ? 'rgba(246,249,253,0.95)' : 'rgba(255,255,255,0.35)';
        c.beginPath();
        if (snow) c.ellipse(sx - 0.02, sy - 0.04, 0.26, 0.14, 0.2, 0, TAU);
        else c.ellipse(sx - 0.06, sy - 0.05, 0.16, 0.07, 0.2, 0, TAU);
        c.fill();
      }
      if (season) seasonTile(c, B, x, y, season, 'day', T, F, false, lod);
    }

  B.flush(c);

  // 5. ponds (frozen over in winter)
  if (snow)
    drawIce(c, map, T, N, {
      rim: '#eef3f9',
      rimHi: 'rgba(255,255,255,0.8)',
      ice: '#c2e2ee',
      deep: '#8cc0da',
      frost: 'rgba(236,246,252,0.9)',
      crack: 'rgba(50,100,140,0.6)',
      crackHi: 'rgba(255,255,255,0.75)',
      snow: '#f2f6fb',
      sheen: 'rgba(255,255,255,0.4)',
    });
  else
    drawWater(c, map, T, N, {
      rim: season === 'autumn' ? '#cdb88a' : '#d9c79a',
      rimHi: 'rgba(255,250,220,0.6)',
      water: season === 'autumn' ? '#4fb0b4' : '#58c3c6',
      deep: season === 'autumn' ? '#2a8a9c' : '#2f9fb0',
      shine: 'rgba(255,255,255,0.55)',
    });
  waterDecor(c, map, T, 'day', season);

  // 6. golden flower meadows (where Aviaries are built)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Crystal && vis(x, y)) meadow(c, x, y, T, season);

  // 7. marble ruins
  const rocks: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Rock && vis(x, y)) rocks.push([x, y]);
  for (const [x, y] of rocks) glowShadow(c, x + 0.62, y + 0.72, 0.62, snow ? 0.22 : 0.3);
  for (const [x, y] of rocks) ruin(c, x, y, season);

  // 8. groves
  drawTrees(c, map, T, 'day', season, vis, lod);
}

/** Seasonal touches on the marble rotunda: blown petals, fallen leaves, or snow banked at the curb. */
function plazaSeason(c: CanvasRenderingContext2D, pcx: number, pcy: number, R: number, ry: number, season: Season) {
  const s = new TRng(0x91a2a + SEASON_SEED[season]);
  if (season === 'winter') {
    // snow banked against the curb, and thin patches lying on the slabs
    for (let q = 0; q < 56; q++) {
      const a = (q / 56) * TAU + s.range(-0.04, 0.04),
        rr = R + 0.2 + s.range(0, 0.1);
      glow(c, pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, s.range(0.28, 0.4), '#f6f9fd', 0.9);
    }
    for (let q = 0; q < 26; q++) {
      const a = s.range(0, TAU),
        rr = s.range(0.6, R - 0.15);
      const bx = pcx + Math.cos(a) * rr,
        by = pcy + Math.sin(a) * rr * ry;
      glow(c, bx, by, s.range(0.25, 0.5), '#ffffff', 0.55);
    }
    return;
  }
  const n = season === 'autumn' ? 34 : season === 'spring' ? 40 : 0;
  for (let q = 0; q < n; q++) {
    const a = s.range(0, TAU),
      rr = Math.sqrt(s.next()) * (R + 0.1);
    const bx = pcx + Math.cos(a) * rr,
      by = pcy + Math.sin(a) * rr * ry;
    if (season === 'autumn') leaf(c, bx, by, s.range(0.035, 0.05), s.range(0, TAU), AUTUMN_CROWNS[Math.floor(s.next() * AUTUMN_CROWNS.length)], 'rgba(90,40,20,0.45)');
    else petal(c, bx, by, 0.024, s.range(0, 3), s.next() < 0.55 ? 'rgba(255,180,210,0.95)' : 'rgba(255,240,246,0.95)');
  }
}

export function meadow(c: CanvasRenderingContext2D, x: number, y: number, T: TFn, season: Sn = null) {
  if (season === 'winter') {
    winterMeadow(c, x, y, T);
    return;
  }
  const r = new TRng(x * 911 + y * 3571 + 11);
  const cx = x + 0.5,
    cy = y + 0.5;
  // warm golden patch, merging with meadow neighbours
  glow(c, cx, cy, 0.85, '#f0d060', 0.55);
  c.fillStyle = 'rgba(200,170,60,0.35)';
  c.beginPath();
  c.ellipse(cx, cy + 0.04, 0.48, 0.42, 0, 0, TAU);
  c.fill();
  if (T(x + 1, y) === Terrain.Crystal) glow(c, cx + 0.5, cy, 0.5, '#f0d060', 0.4);
  if (T(x, y + 1) === Terrain.Crystal) glow(c, cx, cy + 0.5, 0.5, '#f0d060', 0.4);
  // wheat ears
  c.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    const sx = cx + r.range(-0.38, 0.38),
      sy = cy + r.range(-0.2, 0.4);
    const lean = r.range(-0.15, 0.15);
    c.strokeStyle = '#b8963a';
    c.lineWidth = 0.016;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + lean, sy - 0.22);
    c.stroke();
    c.fillStyle = mix('#e8c050', '#f6dc80', r.next());
    for (let q = 0; q < 3; q++) {
      c.beginPath();
      c.ellipse(sx + lean * (0.75 + q * 0.12) + (q % 2 ? 0.02 : -0.02), sy - 0.16 - q * 0.035, 0.022, 0.035, lean, 0, TAU);
      c.fill();
    }
  }
  // golden blossoms
  for (let k = 0; k < 10; k++) {
    const fx = cx + r.range(-0.42, 0.42),
      fy = cy + r.range(-0.36, 0.42);
    const pr = r.range(0.028, 0.042);
    const col = r.next() < 0.75 ? '#ffcf3a' : r.next() < 0.5 ? '#ffffff' : '#ffb04a';
    c.fillStyle = col;
    for (let q = 0; q < 5; q++) {
      const a = (q / 5) * TAU + k;
      c.beginPath();
      c.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.8, 0, TAU);
      c.fill();
    }
    c.fillStyle = '#b86a10';
    c.beginPath();
    c.arc(fx, fy, pr * 0.5, 0, TAU);
    c.fill();
  }
  if (r.next() < 0.5) {
    // a resting butterfly
    const bx = cx + r.range(-0.25, 0.25),
      by = cy + r.range(-0.25, 0.1);
    const col = r.next() < 0.5 ? '#ffffff' : '#9fd8ff';
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(bx - 0.04, by, 0.045, 0.03, -0.5, 0, TAU);
    c.ellipse(bx + 0.04, by, 0.045, 0.03, 0.5, 0, TAU);
    c.fill();
    c.fillStyle = '#3a2a1a';
    c.fillRect(bx - 0.006, by - 0.03, 0.012, 0.06);
  }
  if (season === 'autumn') {
    const s = new TRng(x * 433 + y * 2027);
    for (let k = 0; k < 3; k++) leaf(c, cx + s.range(-0.4, 0.4), cy + s.range(-0.3, 0.4), 0.045, s.range(0, TAU), AUTUMN_CROWNS[k], 'rgba(90,40,20,0.45)');
  }
}

/** The day eco tile in winter: winter aconites and snowdrops pushing through the snow, still glowing gold. */
function winterMeadow(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 911 + y * 3571 + 11);
  const cx = x + 0.5,
    cy = y + 0.5;
  // melted, sun-warmed hollow with the golden glow of the meadow
  glow(c, cx, cy, 0.95, '#ffc830', 0.6);
  c.fillStyle = 'rgba(150,170,110,0.45)';
  c.beginPath();
  c.ellipse(cx, cy + 0.04, 0.44, 0.38, 0, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(220,180,70,0.4)';
  c.beginPath();
  c.ellipse(cx, cy + 0.04, 0.4, 0.33, 0, 0, TAU);
  c.fill();
  if (T(x + 1, y) === Terrain.Crystal) glow(c, cx + 0.5, cy, 0.5, '#ffc830', 0.4);
  if (T(x, y + 1) === Terrain.Crystal) glow(c, cx, cy + 0.5, 0.5, '#ffc830', 0.4);
  // dry golden stalks of last year's wheat
  c.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const sx = cx + r.range(-0.36, 0.36),
      sy = cy + r.range(-0.15, 0.38);
    const lean = r.range(-0.15, 0.15);
    c.strokeStyle = '#c09a48';
    c.lineWidth = 0.014;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + lean, sy - 0.2);
    c.stroke();
    c.fillStyle = '#e6c25a';
    c.beginPath();
    c.ellipse(sx + lean, sy - 0.2, 0.018, 0.035, lean, 0, TAU);
    c.fill();
  }
  // snowdrops: nodding white bells on green stalks
  for (let k = 0; k < 5; k++) {
    const fx = cx + r.range(-0.38, 0.38),
      fy = cy + r.range(-0.25, 0.4);
    c.strokeStyle = '#4a8a4a';
    c.lineWidth = 0.012;
    c.beginPath();
    c.moveTo(fx, fy);
    c.quadraticCurveTo(fx, fy - 0.12, fx + 0.04, fy - 0.12);
    c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(fx + 0.045, fy - 0.085, 0.02, 0.032, 0.15, 0, TAU);
    c.fill();
    c.fillStyle = '#7ac070';
    c.beginPath();
    c.arc(fx + 0.048, fy - 0.058, 0.008, 0, TAU);
    c.fill();
  }
  // winter aconites: bright golden cups on a green ruff
  for (let k = 0; k < 11; k++) {
    const fx = cx + r.range(-0.4, 0.4),
      fy = cy + r.range(-0.34, 0.4);
    const pr = r.range(0.03, 0.045);
    c.fillStyle = '#3e8a3a';
    for (let q = 0; q < 6; q++) {
      const a = (q / 6) * TAU + k;
      c.beginPath();
      c.ellipse(fx + Math.cos(a) * pr * 1.1, fy + Math.sin(a) * pr * 0.8 + 0.01, pr * 0.7, pr * 0.3, a, 0, TAU);
      c.fill();
    }
    c.fillStyle = r.next() < 0.8 ? '#ffd02a' : '#ffe680';
    c.beginPath();
    c.arc(fx, fy, pr * 0.85, 0, TAU);
    c.fill();
    c.fillStyle = '#f0a010';
    c.beginPath();
    c.arc(fx, fy + pr * 0.15, pr * 0.4, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,220,0.8)';
    c.beginPath();
    c.arc(fx - pr * 0.3, fy - pr * 0.35, pr * 0.25, 0, TAU);
    c.fill();
  }
}

const MARBLE = '#e9e4d6';

function ruin(c: CanvasRenderingContext2D, x: number, y: number, season: Sn = null) {
  const r = new TRng(x * 4099 + y * 2203 + 21);
  const kind = Math.floor(r.next() * 3);
  const cx = x + 0.5,
    cy = y + 0.55;
  const outline = 'rgba(95,85,65,0.7)';
  c.lineJoin = 'round';
  let colH = 0,
    colA = 0,
    blockS = 0;
  if (kind === 0) {
    // standing broken column on a plinth
    c.fillStyle = '#c8c0ac';
    c.fillRect(cx - 0.36, cy + 0.06, 0.72, 0.2);
    c.fillStyle = MARBLE;
    c.fillRect(cx - 0.36, cy - 0.06, 0.72, 0.14);
    c.strokeStyle = outline;
    c.lineWidth = 0.02;
    c.strokeRect(cx - 0.36, cy - 0.06, 0.72, 0.32);
    const h = r.range(0.45, 0.75);
    colH = h;
    const g = c.createLinearGradient(cx - 0.22, 0, cx + 0.22, 0);
    g.addColorStop(0, '#f6f2e8');
    g.addColorStop(0.6, '#e0d9c6');
    g.addColorStop(1, '#bdb49e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx - 0.22, cy);
    c.lineTo(cx - 0.22, cy - h + 0.06);
    // jagged break
    c.lineTo(cx - 0.1, cy - h - 0.04);
    c.lineTo(cx, cy - h + 0.05);
    c.lineTo(cx + 0.1, cy - h - 0.02);
    c.lineTo(cx + 0.22, cy - h + 0.08);
    c.lineTo(cx + 0.22, cy);
    c.closePath();
    c.fill();
    c.strokeStyle = outline;
    c.stroke();
    c.strokeStyle = 'rgba(130,120,95,0.55)';
    c.lineWidth = 0.014;
    c.beginPath();
    for (const fx of [-0.13, -0.04, 0.05, 0.14]) {
      c.moveTo(cx + fx, cy - 0.02);
      c.lineTo(cx + fx, cy - h + 0.1);
    }
    c.stroke();
  } else if (kind === 1) {
    // toppled column lying on its side
    const a = r.range(-0.5, 0.5);
    colA = a;
    c.save();
    c.translate(cx, cy);
    c.rotate(a);
    const g = c.createLinearGradient(0, -0.18, 0, 0.18);
    g.addColorStop(0, '#f6f2e8');
    g.addColorStop(0.5, '#e0d9c6');
    g.addColorStop(1, '#b4ab94');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-0.5, -0.17);
    c.lineTo(0.38, -0.17);
    c.lineTo(0.45, -0.05);
    c.lineTo(0.36, 0.04);
    c.lineTo(0.46, 0.17);
    c.lineTo(-0.5, 0.17);
    c.closePath();
    c.fill();
    c.strokeStyle = outline;
    c.lineWidth = 0.02;
    c.stroke();
    c.fillStyle = '#d4ccb8';
    c.beginPath();
    c.ellipse(-0.5, 0, 0.07, 0.17, 0, 0, TAU);
    c.fill();
    c.stroke();
    c.strokeStyle = 'rgba(130,120,95,0.5)';
    c.lineWidth = 0.012;
    c.beginPath();
    for (const fy of [-0.1, -0.03, 0.04, 0.11]) {
      c.moveTo(-0.45, fy);
      c.lineTo(0.36, fy);
    }
    c.stroke();
    c.restore();
    // a fragment beside it
    facet(c, ngon(cx + r.range(-0.3, 0.3), cy + 0.3, 0.07, 5, r.next(), 0.7), cx, cy + 0.27, MARBLE, 0.4);
  } else {
    // carved block / fallen capital
    const s = r.range(0.32, 0.4);
    blockS = s;
    c.fillStyle = '#c4bba5';
    c.beginPath();
    c.moveTo(cx - s, cy - s * 0.4);
    c.lineTo(cx + s, cy - s * 0.4);
    c.lineTo(cx + s, cy + s * 0.55);
    c.lineTo(cx - s, cy + s * 0.55);
    c.closePath();
    c.fill();
    c.strokeStyle = outline;
    c.lineWidth = 0.02;
    c.stroke();
    c.fillStyle = MARBLE;
    c.beginPath();
    c.moveTo(cx - s, cy - s * 0.4);
    c.lineTo(cx - s * 0.7, cy - s * 0.95);
    c.lineTo(cx + s * 1.25, cy - s * 0.95);
    c.lineTo(cx + s, cy - s * 0.4);
    c.closePath();
    c.fill();
    c.stroke();
    // ionic volutes on the face
    c.strokeStyle = 'rgba(120,108,85,0.7)';
    c.lineWidth = 0.018;
    for (const vx of [cx - s * 0.55, cx + s * 0.55]) {
      c.beginPath();
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * TAU * 1.6;
        const rr = 0.09 - k * 0.0045;
        const px = vx + Math.cos(a) * rr,
          py = cy + 0.06 + Math.sin(a) * rr;
        k ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    }
  }
  // moss and ivy (red in autumn; snow-covered in winter)
  if (season === 'winter') {
    ruinSnow(c, kind, cx, cy, colH, colA, blockS);
    return;
  }
  c.fillStyle = season === 'autumn' ? 'rgba(150,120,60,0.8)' : season === 'spring' ? 'rgba(95,165,65,0.85)' : 'rgba(105,150,70,0.8)';
  for (let k = 0; k < 4; k++) {
    c.beginPath();
    c.ellipse(cx + r.range(-0.3, 0.3), cy + r.range(0.0, 0.25), r.range(0.04, 0.08), r.range(0.025, 0.045), 0, 0, TAU);
    c.fill();
  }
  if (r.next() < 0.6) {
    c.strokeStyle = season === 'autumn' ? 'rgba(110,60,40,0.9)' : 'rgba(70,120,50,0.9)';
    c.lineWidth = 0.018;
    c.beginPath();
    const ix = cx + r.range(-0.15, 0.15);
    c.moveTo(ix, cy + 0.2);
    c.bezierCurveTo(ix + 0.1, cy, ix - 0.1, cy - 0.15, ix + 0.05, cy - 0.3);
    c.stroke();
    for (let k = 0; k < 4; k++) {
      c.fillStyle = season === 'autumn' ? AUTUMN_CROWNS[k % 3] : '#5a9a40';
      c.beginPath();
      c.ellipse(ix + r.range(-0.06, 0.08), cy + 0.15 - k * 0.12, 0.035, 0.022, r.range(0, 3), 0, TAU);
      c.fill();
    }
  }
}

const SNOW = '#f4f8fc';
const SNOW_SH = 'rgba(120,145,180,0.55)';

/** Snow caps on the three kinds of ruin (geometry mirrors `ruin`). */
function ruinSnow(c: CanvasRenderingContext2D, kind: number, cx: number, cy: number, h: number, a: number, s: number) {
  const cap = (pts: [number, number][], th: number) => {
    // a soft pillow of snow following the top edge `pts`, `th` thick
    c.fillStyle = SNOW_SH;
    c.beginPath();
    pts.forEach(([u, v], i) => (i ? c.lineTo(u, v + th * 0.35) : c.moveTo(u, v + th * 0.35)));
    for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] - th * 0.4);
    c.closePath();
    c.fill();
    c.fillStyle = SNOW;
    c.beginPath();
    pts.forEach(([u, v], i) => (i ? c.lineTo(u, v + th * 0.15) : c.moveTo(u, v + th * 0.15)));
    for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] - th * 0.6);
    c.closePath();
    c.fill();
    for (const [u, v] of [pts[0], pts[pts.length - 1]]) {
      c.beginPath();
      c.arc(u, v - th * 0.22, th * 0.38, 0, TAU);
      c.fill();
    }
  };
  if (kind === 0) {
    cap(
      [
        [cx - 0.37, cy - 0.06],
        [cx - 0.23, cy - 0.07],
      ],
      0.07,
    );
    cap(
      [
        [cx + 0.23, cy - 0.07],
        [cx + 0.37, cy - 0.06],
      ],
      0.07,
    );
    cap(
      [
        [cx - 0.22, cy - h + 0.06],
        [cx - 0.1, cy - h - 0.04],
        [cx, cy - h + 0.05],
        [cx + 0.1, cy - h - 0.02],
        [cx + 0.22, cy - h + 0.08],
      ],
      0.08,
    );
  } else if (kind === 1) {
    c.save();
    c.translate(cx, cy);
    c.rotate(a);
    cap(
      [
        [-0.5, -0.17],
        [-0.1, -0.18],
        [0.36, -0.17],
      ],
      0.09,
    );
    c.restore();
  } else {
    c.fillStyle = SNOW;
    c.beginPath();
    c.moveTo(cx - s * 0.98, cy - s * 0.42);
    c.lineTo(cx - s * 0.7, cy - s * 0.97);
    c.lineTo(cx + s * 1.23, cy - s * 0.97);
    c.lineTo(cx + s * 1.0, cy - s * 0.42);
    c.closePath();
    c.fill();
    cap(
      [
        [cx - s, cy - s * 0.4],
        [cx + s, cy - s * 0.4],
      ],
      0.07,
    );
  }
  // snow drifted against the foot
  c.fillStyle = SNOW;
  c.beginPath();
  c.ellipse(cx - 0.05, cy + 0.3, 0.38, 0.08, 0, 0, TAU);
  c.fill();
}
