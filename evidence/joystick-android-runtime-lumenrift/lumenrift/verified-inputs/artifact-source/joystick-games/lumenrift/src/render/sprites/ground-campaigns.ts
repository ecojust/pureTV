// Static landscapes of the four season campaigns: a spring cottage garden, a summer desert oasis,
// a Halloween hillside at night and a snowbound northern hold at twilight.
// Same conventions as ground.ts: tile units, painted once into the ground canvases.
import { CORE_X, CORE_Y, Realm, Season } from '../../game/config';
import { MapData, Terrain } from '../../game/grid';
import {
  ALL,
  Batch,
  dayTree,
  deadTree,
  drawIce,
  drawWater,
  dryTuft,
  glowShadow,
  leaf,
  meadow,
  NOPEN,
  patches,
  patchField,
  petal,
  seasonTile,
  snowCap,
  sparkle,
  SW,
  TAU,
  TFn,
  Vis,
  waterDecor,
  waterTiles,
} from './ground';
import { facet, glow, mix, ngon, rgba, shade, TRng } from './util';

export type Campaign = Season;

export function isCampaign(r: Realm): r is Campaign {
  return r === 'spring' || r === 'summer' || r === 'autumn' || r === 'winter';
}

interface CPal {
  fill: string;
  tiles: string[];
  tileA: number;
  blobs: [string, string, string];
  blobA: [number, number];
  grid: string;
  /** Colour the outer scenery fades into. */
  base: string;
  /** Bare-ground colour settling a newly sprouted eco tile in. */
  soil: string;
}

const PALS: Record<Campaign, CPal> = {
  spring: {
    fill: '#74bf52',
    tiles: ['#76c254', '#7ec65c', '#70bb50', '#82c860', '#7ac058'],
    tileA: 0.22,
    blobs: ['#9cd872', '#58a240', '#bfe384'],
    blobA: [0.22, 0.42],
    grid: 'rgba(30,70,20,0.06)',
    base: '#72bc52',
    soil: '#6cb24c',
  },
  summer: {
    fill: '#e0c288',
    tiles: ['#e2c58c', '#dcbd82', '#e6ca92', '#d8b87e', '#e4c48a'],
    tileA: 0.14,
    blobs: ['#efd8a4', '#c9a06a', '#d9aa74'],
    blobA: [0.25, 0.45],
    grid: 'rgba(110,70,20,0.07)',
    base: '#dcbd84',
    soil: '#d8b87e',
  },
  autumn: {
    fill: '#3b3722',
    tiles: ['#3d3922', '#433c23', '#37351f', '#403725', '#3a3620'],
    tileA: 0.55,
    blobs: ['#55401e', '#2d3721', '#3d2c2e'],
    blobA: [0.25, 0.45],
    grid: 'rgba(255,200,140,0.045)',
    base: '#302d1d',
    soil: '#3d3922',
  },
  winter: {
    fill: '#c6d2e2',
    tiles: ['#c4d0e2', '#cad5e6', '#c0cce0', '#ccd7e7', '#c6d1e3'],
    tileA: 0.4,
    blobs: ['#dbe4f0', '#a4b4cc', '#e2e9f3'],
    blobA: [0.25, 0.45],
    grid: 'rgba(40,60,100,0.075)',
    base: '#bccadc',
    soil: '#c6d2e2',
  },
};

export function campaignBase(r: Campaign): string {
  return PALS[r].base;
}
export function campaignSoil(r: Campaign): string {
  return PALS[r].soil;
}
/** Chance of a grove seed outside the field, `d` tiles from it. */
export function campaignTreeP(r: Campaign, d: number): number {
  if (r === 'summer') return 0.025 + Math.min(0.16, d * 0.012);
  if (r === 'autumn') return 0.06 + Math.min(0.4, d * 0.035);
  if (r === 'winter') return 0.05 + Math.min(0.36, d * 0.03);
  return 0.05 + Math.min(0.32, d * 0.025);
}
export function campaignRockP(r: Campaign): number {
  return r === 'summer' ? 0.035 : r === 'autumn' ? 0.02 : 0.012;
}

/** The eco tile of each campaign, painted at tile (x,y). */
export function campaignEco(c: CanvasRenderingContext2D, x: number, y: number, T: TFn, r: Campaign) {
  if (r === 'spring') springMeadow(c, x, y, T);
  else if (r === 'summer') desertSpring(c, x, y, T);
  else if (r === 'autumn') pumpkinField(c, x, y, T);
  else pineStand(c, x, y, T);
}

// ====================================================================== the shared skeleton

export function renderCampaign(c: CanvasRenderingContext2D, map: MapData, off: number, realm: Campaign, vis: Vis = ALL, lod = false) {
  const W = map.w,
    H = map.h;
  const T: TFn = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? Terrain.Grass : map.terrain[y * W + x]);
  const N: TFn = (x, y) => map.noise[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const rng = new TRng(Math.floor(map.noise[0] * 1e9) ^ 0xca3b);
  const P = PALS[realm];
  const F = patchField(Math.floor(map.noise[2] * 1e9) ^ 0xf1e1d);
  const pcx = CORE_X + 0.5 + off,
    pcy = CORE_Y + 0.5 + off;
  const dist = (x: number, y: number) => Math.hypot(x + 0.5 - pcx, (y + 0.5 - pcy) * 1.1);

  // 1. base, per-tile tint and big soft blobs
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
  for (let i = 0; i < 85; i++) {
    const roll = rng.next();
    const col = roll < 0.4 ? P.blobs[0] : roll < 0.75 ? P.blobs[1] : P.blobs[2];
    glow(c, rng.range(-2, W + 2), rng.range(-2, H + 2), rng.range(1.5, 4.5), col, rng.range(P.blobA[0], P.blobA[1]));
  }

  // 2. large swathes and ground texture
  swathes(c, W, H, realm, F, map);
  if (realm === 'summer') dunes(c, W, H, F, pcx, pcy, map);

  // 3. the plaza under the core
  if (realm === 'spring') springPlaza(c, pcx, pcy);
  else if (realm === 'summer') summerPlaza(c, pcx, pcy);
  else if (realm === 'autumn') autumnPlaza(c, pcx, pcy);
  else winterPlaza(c, pcx, pcy);

  // 4. faint grid so the build grid can still be read
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

  // 5. life on the open ground
  const B = new Batch();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!vis(x, y) || T(x, y) !== Terrain.Grass) continue;
      const d = dist(x, y);
      if (realm === 'spring') springTile(c, B, x, y, T, F, N, d, lod);
      else if (realm === 'summer') summerTile(c, B, x, y, T, F, d, lod);
      else if (realm === 'autumn') autumnTile(c, B, x, y, T, F, d, lod);
      else winterTile(c, B, x, y, T, F, d, lod);
    }
  B.flush(c);

  // 6. ponds
  if (realm === 'winter') {
    drawIce(c, map, T, N, {
      rim: '#dfe7f1',
      rimHi: 'rgba(255,255,255,0.7)',
      ice: '#a6cee2',
      deep: '#7aaaca',
      frost: 'rgba(222,236,248,0.85)',
      crack: 'rgba(40,80,125,0.6)',
      crackHi: 'rgba(255,255,255,0.6)',
      snow: '#e4ebf4',
      sheen: 'rgba(255,255,255,0.35)',
    });
    waterDecor(c, map, T, 'day', 'winter');
  } else if (realm === 'autumn') {
    drawWater(c, map, T, N, { rim: '#2c2a24', rimHi: 'rgba(160,150,180,0.28)', water: '#1f2d2e', deep: '#0b1416', shine: 'rgba(200,205,235,0.22)' });
    waterDecor(c, map, T, 'night', 'autumn');
    moonReflections(c, map, T);
  } else if (realm === 'summer') {
    drawWater(c, map, T, N, { rim: '#c19c62', rimHi: 'rgba(255,240,200,0.55)', water: '#3ccac2', deep: '#13909e', shine: 'rgba(255,255,255,0.6)' });
    shoreReeds(c, map, T, ['#5c8a34', '#6e9a3c', '#4e7a2e'], '#8a5a2a', false);
    waterDecor(c, map, T, 'day', 'summer');
  } else {
    drawWater(c, map, T, N, { rim: '#9aa086', rimHi: 'rgba(255,255,230,0.5)', water: '#4cb8c4', deep: '#2788a8', shine: 'rgba(255,255,255,0.55)' });
    shoreReeds(c, map, T, ['#4f9a3a', '#5eac44', '#3e8a34'], '#7a5230', true);
    waterDecor(c, map, T, 'day', 'spring');
  }

  // 7. mist pooling in the hollows of the haunted hill
  if (realm === 'autumn') mist(c, W, H, map, pcx, pcy);

  // 8. eco tiles
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Crystal && vis(x, y)) campaignEco(c, x, y, T, realm);

  // 9. rocks
  const rocks: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T(x, y) === Terrain.Rock && vis(x, y)) rocks.push([x, y]);
  for (const [x, y] of rocks) glowShadow(c, x + 0.6, y + 0.72, 0.62, realm === 'autumn' ? 0.45 : realm === 'winter' ? 0.22 : 0.3);
  for (const [x, y] of rocks) {
    if (realm === 'spring') springRock(c, x, y, T);
    else if (realm === 'summer') sandstone(c, x, y, T);
    else if (realm === 'autumn') graveRock(c, x, y, T);
    else winterRock(c, x, y, T);
  }

  // 10. groves
  campaignTrees(c, map, T, realm, vis, lod);
}

/** Big soft patches of colour (flower swathes, dry grass, leaf litter, drifts) in one upscaled bitmap. */
function swathes(c: CanvasRenderingContext2D, W: number, H: number, realm: Campaign, F: TFn, map: MapData) {
  const cv = document.createElement('canvas');
  cv.width = (W + 2) * SW;
  cv.height = (H + 2) * SW;
  const g = cv.getContext('2d')!;
  const inv: TFn = (x, y) => 1 - F(x, y);
  const rng = new TRng(Math.floor(map.noise[3] * 1e9) ^ 0x5ea5);
  if (realm === 'spring') {
    patches(g, W, H, F, 0.55, '#4f9e38', 0.3);
    patches(g, W, H, inv, 0.6, '#b6e27e', 0.28);
  } else if (realm === 'summer') {
    // golden dry grass and scrub on the firmer ground; pale wind-blown sand elsewhere
    patches(g, W, H, F, 0.55, '#ccb662', 0.5);
    patches(g, W, H, F, 0.7, '#c2a24c', 0.35, 0.7);
    patches(g, W, H, inv, 0.62, '#f2deb0', 0.4);
  } else if (realm === 'autumn') {
    patches(g, W, H, F, 0.5, '#6e3c1a', 0.5);
    patches(g, W, H, F, 0.7, '#8a4a1c', 0.3, 0.7);
    patches(g, W, H, inv, 0.62, '#26301c', 0.45);
  } else {
    // thin snow where the earth shows through, deep drifts and blue hollows elsewhere
    patches(g, W, H, inv, 0.7, '#aab2b4', 0.25);
    patches(g, W, H, F, 0.55, '#e4ebf4', 0.5);
    g.save();
    g.scale(SW, SW);
    g.translate(1, 1);
    for (let i = 0; i < (W * H) / 28; i++) glow(g, rng.range(-1, W + 1), rng.range(-1, H + 1), rng.range(0.6, 1.5), '#a2b4d2', rng.range(0.1, 0.2));
    g.restore();
  }
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'low';
  c.drawImage(cv, -1, -1, W + 2, H + 2);
  c.restore();
}

// ====================================================================== shared props

/** A smooth closed outline through `pts` (curves through the edge midpoints). */
function smooth(pts: [number, number][]): Path2D {
  const p = new Path2D();
  const n = pts.length;
  const mid = (i: number): [number, number] => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  p.closePath();
  return p;
}

/** Outline of a boulder on tile (x,y), reaching toward neighbouring rocks so outcrops merge. */
function rockOutline(x: number, y: number, T: TFn, r: TRng, cx: number, cy: number, r0 = 0.42, r1 = 0.56): [number, number][] {
  const pts: [number, number][] = [];
  const nv = 7 + Math.floor(r.next() * 3);
  for (let k = 0; k < nv; k++) {
    const a = (k / nv) * TAU + r.range(-0.2, 0.2);
    let rad = r.range(r0, r1);
    const dx = Math.cos(a),
      dy = Math.sin(a);
    if ((dx > 0.5 && T(x + 1, y) === Terrain.Rock) || (dx < -0.5 && T(x - 1, y) === Terrain.Rock)) rad += 0.14;
    if ((dy > 0.5 && T(x, y + 1) === Terrain.Rock) || (dy < -0.5 && T(x, y - 1) === Terrain.Rock)) rad += 0.14;
    pts.push([cx + dx * rad, cy + dy * rad * 0.9]);
  }
  return pts;
}

/** Green reeds (with cattails, and yellow irises in the garden) on the shore side of pond tiles. */
function shoreReeds(c: CanvasRenderingContext2D, map: MapData, T: TFn, cols: string[], head: string, iris: boolean) {
  c.lineCap = 'round';
  for (const [x, y] of waterTiles(map, T)) {
    const r = new TRng(x * 419 + y * 2087 + 5);
    const dirs: [number, number][] = [];
    if (T(x + 1, y) !== Terrain.Water) dirs.push([1, 0]);
    if (T(x - 1, y) !== Terrain.Water) dirs.push([-1, 0]);
    if (T(x, y + 1) !== Terrain.Water) dirs.push([0, 1]);
    if (T(x, y - 1) !== Terrain.Water) dirs.push([0, -1]);
    if (!dirs.length || r.next() > 0.6) continue;
    const [dx, dy] = dirs[Math.floor(r.next() * dirs.length)];
    const bx = x + 0.5 + dx * 0.4 + r.range(-0.15, 0.15) * (dy ? 1 : 0),
      by = y + 0.55 + dy * 0.4 + r.range(-0.15, 0.15) * (dx ? 1 : 0);
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + r.range(-0.45, 0.45);
      const len = r.range(0.18, 0.34);
      const sx = bx + r.range(-0.07, 0.07);
      c.strokeStyle = cols[k % cols.length];
      c.lineWidth = 0.022;
      c.beginPath();
      c.moveTo(sx, by);
      c.quadraticCurveTo(sx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.5, sx + Math.cos(a) * len, by + Math.sin(a) * len);
      c.stroke();
      if (k === 1 || k === 4) {
        c.fillStyle = head;
        c.beginPath();
        c.ellipse(sx + Math.cos(a) * len, by + Math.sin(a) * len, 0.022, 0.055, a + Math.PI / 2, 0, TAU);
        c.fill();
      }
    }
    if (iris && r.next() < 0.6) {
      const fx = bx + r.range(-0.1, 0.1),
        fy = by - r.range(0.12, 0.22);
      c.fillStyle = r.next() < 0.6 ? '#ffd23a' : '#9a7ae0';
      for (let q = 0; q < 3; q++) {
        const a = (q / 3) * TAU - Math.PI / 2;
        c.beginPath();
        c.ellipse(fx + Math.cos(a) * 0.03, fy + Math.sin(a) * 0.03, 0.035, 0.018, a, 0, TAU);
        c.fill();
      }
    }
  }
}

/** A plump pumpkin sitting at (x,y), `s` its radius; `lit` carves a glowing face into it. */
function pumpkin(c: CanvasRenderingContext2D, x: number, y: number, s: number, r: TRng, lit = false, pale = false) {
  const body = pale ? mix('#e6dcc2', '#d8cfae', r.next()) : mix('#e2741a', '#f29a2a', r.next());
  const dark = shade(body, -0.45);
  c.fillStyle = 'rgba(0,0,0,0.38)';
  c.beginPath();
  c.ellipse(x + s * 0.12, y + s * 0.62, s * 1.15, s * 0.42, 0, 0, TAU);
  c.fill();
  c.lineWidth = s * 0.06;
  c.strokeStyle = dark;
  for (const [o, w] of [
    [-0.55, 0.48],
    [0.55, 0.48],
    [-0.28, 0.6],
    [0.28, 0.6],
    [0, 0.62],
  ]) {
    c.fillStyle = shade(body, -Math.abs(o) * 0.35 + (o < 0 ? 0.04 : -0.04));
    c.beginPath();
    c.ellipse(x + o * s, y, w * s, s * 0.8, 0, 0, TAU);
    c.fill();
    c.stroke();
  }
  c.fillStyle = 'rgba(255,236,190,0.4)';
  c.beginPath();
  c.ellipse(x - s * 0.22, y - s * 0.42, s * 0.18, s * 0.09, -0.3, 0, TAU);
  c.fill();
  // stem
  c.strokeStyle = '#5a5a24';
  c.lineWidth = s * 0.17;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y - s * 0.68);
  c.quadraticCurveTo(x + s * 0.04, y - s * 0.95, x + s * 0.2, y - s * 1.02);
  c.stroke();
  if (lit) {
    // carved face, lit from within
    glow(c, x, y + s * 0.2, s * 2.6, '#ff9a2a', 0.22);
    c.fillStyle = '#ffd040';
    const tri = (tx: number, ty: number, w: number, h: number) => {
      c.beginPath();
      c.moveTo(tx - w, ty + h * 0.5);
      c.lineTo(tx + w, ty + h * 0.5);
      c.lineTo(tx, ty - h * 0.5);
      c.closePath();
      c.fill();
    };
    tri(x - s * 0.3, y - s * 0.18, s * 0.17, s * 0.26);
    tri(x + s * 0.3, y - s * 0.18, s * 0.17, s * 0.26);
    tri(x, y + s * 0.06, s * 0.08, s * 0.14);
    c.beginPath();
    c.moveTo(x - s * 0.48, y + s * 0.22);
    for (let k = 0; k <= 6; k++) c.lineTo(x - s * 0.48 + (k / 6) * s * 0.96, y + s * (0.22 + (k % 2 ? 0.1 : 0) + Math.sin((k / 6) * Math.PI) * 0.16));
    for (let k = 6; k >= 0; k--) c.lineTo(x - s * 0.48 + (k / 6) * s * 0.96, y + s * (0.3 + Math.sin((k / 6) * Math.PI) * 0.3));
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,250,200,0.75)';
    c.beginPath();
    c.arc(x - s * 0.3, y - s * 0.14, s * 0.06, 0, TAU);
    c.arc(x + s * 0.3, y - s * 0.14, s * 0.06, 0, TAU);
    c.fill();
  }
}

/** A small iron lantern standing in the grass with a warm glow. */
function lantern(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  glow(c, x, y - s * 0.4, s * 3.2, '#ffb24a', 0.28);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(x + s * 0.15, y + s * 0.08, s * 0.6, s * 0.2, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#ffd772';
  c.fillRect(x - s * 0.3, y - s * 0.95, s * 0.6, s * 0.8);
  c.fillStyle = 'rgba(255,250,215,0.85)';
  c.fillRect(x - s * 0.12, y - s * 0.8, s * 0.2, s * 0.45);
  c.strokeStyle = '#1c1a1e';
  c.lineWidth = s * 0.1;
  c.strokeRect(x - s * 0.3, y - s * 0.95, s * 0.6, s * 0.8);
  c.beginPath();
  c.moveTo(x, y - s * 0.95);
  c.lineTo(x, y - s * 0.15);
  c.stroke();
  c.fillStyle = '#1c1a1e';
  c.beginPath();
  c.moveTo(x - s * 0.42, y - s * 0.95);
  c.lineTo(x + s * 0.42, y - s * 0.95);
  c.lineTo(x, y - s * 1.25);
  c.closePath();
  c.fill();
  c.fillRect(x - s * 0.36, y - s * 0.18, s * 0.72, s * 0.12);
  c.lineWidth = s * 0.07;
  c.beginPath();
  c.arc(x, y - s * 1.32, s * 0.12, 0, TAU);
  c.stroke();
}

/** A young conifer seen from the side: stacked tiers, optionally laden with snow. */
function pine(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, r: TRng, snowy: boolean) {
  const green = mix('#2c5a46', '#356a4c', r.next());
  c.fillStyle = '#5a4030';
  c.fillRect(cx - s * 0.06, cy - s * 0.12, s * 0.12, s * 0.2);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const w = s * (0.6 - i * 0.12),
      by = cy - s * 0.08 - i * s * 0.24,
      top = by - s * 0.36 - (i === tiers - 1 ? s * 0.12 : 0);
    const path = new Path2D();
    path.moveTo(cx, top);
    path.lineTo(cx - w, by);
    for (let k = 1; k <= 4; k++) {
      const xx = cx - w + (k / 4) * w * 2;
      path.quadraticCurveTo(xx - w * 0.25, by + s * 0.07, xx, by);
    }
    path.closePath();
    c.fillStyle = shade(green, -0.25);
    c.fill(path);
    // lit left flank
    c.save();
    c.clip(path);
    c.fillStyle = shade(green, 0.12);
    c.beginPath();
    c.moveTo(cx, top);
    c.lineTo(cx - w * 1.1, by + s * 0.1);
    c.lineTo(cx - w * 0.1, by + s * 0.1);
    c.closePath();
    c.fill();
    if (snowy) {
      c.fillStyle = 'rgba(80,100,140,0.45)';
      c.beginPath();
      c.moveTo(cx, top - 0.02);
      c.lineTo(cx - w * 1.1, by - s * 0.04);
      c.quadraticCurveTo(cx, by - s * 0.2, cx + w * 1.1, by - s * 0.08);
      c.closePath();
      c.fill();
      c.fillStyle = '#eef3f9';
      c.beginPath();
      c.moveTo(cx, top - 0.02);
      c.lineTo(cx - w * 1.1, by - s * 0.08);
      c.quadraticCurveTo(cx - w * 0.5, by - s * 0.2, cx, by - s * 0.16);
      c.quadraticCurveTo(cx + w * 0.5, by - s * 0.24, cx + w * 1.1, by - s * 0.13);
      c.closePath();
      c.fill();
    }
    c.restore();
    c.strokeStyle = 'rgba(10,25,25,0.45)';
    c.lineWidth = s * 0.025;
    c.stroke(path);
  }
}

// ====================================================================== spring: a cottage garden

function springTile(c: CanvasRenderingContext2D, B: Batch, x: number, y: number, T: TFn, F: TFn, N: TFn, d: number, lod: boolean) {
  if (d < 3.1) return;
  const r = new TRng(x * 3301 + y * 7727 + 0x5b);
  const tufts = r.next() < 0.5 ? 1 + Math.floor(r.next() * 3) : 0;
  for (let k = 0; k < tufts; k++) {
    const bx = x + r.range(0.12, 0.88),
      by = y + r.range(0.2, 0.92);
    B.strokeStyle = r.next() < 0.5 ? '#4f9a3a' : '#62ac48';
    B.lineWidth = 0.022;
    B.lineCap = 'round';
    const blades = 3 + Math.floor(r.next() * 3);
    for (let q = 0; q < blades; q++) {
      const a = -Math.PI / 2 + (q - (blades - 1) / 2) * 0.35 + r.range(-0.1, 0.1);
      const len = r.range(0.08, 0.16);
      B.beginPath();
      B.moveTo(bx, by);
      B.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.6, bx + Math.cos(a) * len + 0.02, by + Math.sin(a) * len);
      B.stroke();
    }
  }
  if (r.next() < 0.14) {
    // clover
    const kx = x + r.range(0.2, 0.8),
      ky = y + r.range(0.2, 0.8);
    B.fillStyle = '#4c9838';
    for (let q = 0; q < 3; q++) {
      const a = (q / 3) * TAU - Math.PI / 2;
      B.beginPath();
      B.arc(kx + Math.cos(a) * 0.04, ky + Math.sin(a) * 0.04, 0.035, 0, TAU);
      B.fill();
    }
  }
  if (r.next() < 0.035) {
    // a clump of tulips
    const tx = x + r.range(0.25, 0.75),
      ty = y + r.range(0.35, 0.8);
    const col = ['#e8343a', '#ffcc2a', '#f070a8', '#ffffff', '#b04ad0'][Math.floor(r.next() * 5)];
    for (let k = 0; k < 4; k++) {
      const fx = tx + r.range(-0.12, 0.12),
        fy = ty + r.range(-0.08, 0.08);
      B.strokeStyle = '#3e8a30';
      B.lineWidth = 0.014;
      B.beginPath();
      B.moveTo(fx, fy + 0.1);
      B.lineTo(fx, fy);
      B.stroke();
      B.fillStyle = '#4c9a38';
      B.beginPath();
      B.ellipse(fx + 0.025, fy + 0.07, 0.02, 0.045, 0.4, 0, TAU);
      B.fill();
      B.fillStyle = col;
      B.beginPath();
      B.ellipse(fx, fy - 0.01, 0.026, 0.034, 0, 0, TAU);
      B.fill();
      B.fillStyle = 'rgba(255,255,255,0.35)';
      B.beginPath();
      B.ellipse(fx - 0.008, fy - 0.02, 0.008, 0.016, 0, 0, TAU);
      B.fill();
    }
  }
  if (r.next() < 0.03 && !lod) {
    // dandelion clocks
    const fx = x + r.range(0.2, 0.8),
      fy = y + r.range(0.2, 0.8);
    B.strokeStyle = 'rgba(255,255,255,0.8)';
    B.lineWidth = 0.006;
    for (let q = 0; q < 10; q++) {
      const a = (q / 10) * TAU;
      B.beginPath();
      B.moveTo(fx, fy);
      B.lineTo(fx + Math.cos(a) * 0.045, fy + Math.sin(a) * 0.045);
      B.stroke();
    }
    B.fillStyle = 'rgba(255,255,255,0.55)';
    B.beginPath();
    B.arc(fx, fy, 0.03, 0, TAU);
    B.fill();
  }
  if (N(x, y) > 0.985 && d > 4.5) {
    // a flat garden stepping stone
    const sx = x + 0.5,
      sy = y + 0.5;
    c.fillStyle = 'rgba(30,60,20,0.3)';
    c.beginPath();
    c.ellipse(sx + 0.03, sy + 0.04, 0.3, 0.2, 0.2, 0, TAU);
    c.fill();
    c.fillStyle = '#b8b4a2';
    c.beginPath();
    c.ellipse(sx, sy, 0.3, 0.2, 0.2, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(90,150,60,0.6)';
    c.beginPath();
    c.ellipse(sx + 0.12, sy + 0.08, 0.1, 0.05, 0.2, 0, TAU);
    c.fill();
  }
  if (r.next() < 0.012 && !lod) {
    // a butterfly resting on the grass
    const bx = x + r.range(0.25, 0.75),
      by = y + r.range(0.25, 0.75);
    B.fillStyle = ['#ffffff', '#ffd23a', '#7ab8ff', '#ff9a4a'][Math.floor(r.next() * 4)];
    B.beginPath();
    B.ellipse(bx - 0.035, by, 0.04, 0.026, -0.5, 0, TAU);
    B.ellipse(bx + 0.035, by, 0.04, 0.026, 0.5, 0, TAU);
    B.fill();
  }
  seasonTile(c, B, x, y, 'spring', 'day', T, F, false, lod);
}

/** Golden flower meadow (beehives): the day meadow in spring colours, with bees about. */
function springMeadow(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  meadow(c, x, y, T, 'spring');
  const r = new TRng(x * 727 + y * 1409 + 3);
  const cx = x + 0.5,
    cy = y + 0.5;
  // splashes of colour among the gold
  for (let k = 0; k < 6; k++) {
    const fx = cx + r.range(-0.4, 0.4),
      fy = cy + r.range(-0.35, 0.4),
      pr = r.range(0.022, 0.032);
    c.fillStyle = ['#ff7ab0', '#b48aff', '#7ab8ff', '#ffffff', '#ff5a5a'][Math.floor(r.next() * 5)];
    for (let q = 0; q < 5; q++) {
      const a = (q / 5) * TAU + k;
      c.beginPath();
      c.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.75, 0, TAU);
      c.fill();
    }
    c.fillStyle = '#ffe060';
    c.beginPath();
    c.arc(fx, fy, pr * 0.5, 0, TAU);
    c.fill();
  }
  // bees
  for (let k = 0; k < 2; k++) {
    const bx = cx + r.range(-0.3, 0.3),
      by = cy + r.range(-0.3, 0.2);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.ellipse(bx - 0.012, by - 0.03, 0.024, 0.014, -0.6, 0, TAU);
    c.ellipse(bx + 0.016, by - 0.03, 0.024, 0.014, 0.6, 0, TAU);
    c.fill();
    c.fillStyle = '#ffc020';
    c.beginPath();
    c.ellipse(bx, by, 0.032, 0.022, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#2a1a0a';
    c.fillRect(bx - 0.008, by - 0.02, 0.008, 0.04);
    c.fillRect(bx + 0.012, by - 0.018, 0.007, 0.036);
  }
}

function springPlaza(c: CanvasRenderingContext2D, pcx: number, pcy: number) {
  const s = new TRng(0x59a1);
  const ry = 1 / 1.1;
  // a ring of neatly cut lawn
  glow(c, pcx, pcy, 3.9, '#a6dc7c', 0.5);
  // rich dark soil of the round garden bed
  glowShadow(c, pcx + 0.05, pcy + 0.12, 2.9, 0.18);
  const bed = new Path2D();
  bed.ellipse(pcx, pcy, 2.35, 2.35 * ry, 0, 0, TAU);
  const g = c.createRadialGradient(pcx - 0.3, pcy - 0.3, 0.2, pcx, pcy, 2.4);
  g.addColorStop(0, '#5c3e26');
  g.addColorStop(0.7, '#4e331f');
  g.addColorStop(1, '#3e2818');
  c.fillStyle = g;
  c.fill(bed);
  c.save();
  c.clip(bed);
  // raked furrows and soil crumbs
  for (const rr of [1.55, 1.8, 2.05, 2.28]) {
    c.strokeStyle = 'rgba(30,18,10,0.45)';
    c.lineWidth = 0.05;
    c.beginPath();
    c.ellipse(pcx, pcy + 0.02, rr, rr * ry, 0, 0, TAU);
    c.stroke();
    c.strokeStyle = 'rgba(140,100,70,0.3)';
    c.lineWidth = 0.025;
    c.beginPath();
    c.ellipse(pcx, pcy - 0.03, rr - 0.06, (rr - 0.06) * ry, 0, 0, TAU);
    c.stroke();
  }
  c.fillStyle = 'rgba(120,85,55,0.5)';
  for (let k = 0; k < 160; k++) {
    const a = s.range(0, TAU),
      rr = Math.sqrt(s.next()) * 2.3;
    c.beginPath();
    c.arc(pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, s.range(0.01, 0.025), 0, TAU);
    c.fill();
  }
  c.restore();
  // seedlings along the furrows, flower clumps at the bed's edge
  for (let k = 0; k < 26; k++) {
    const a = s.range(0, TAU),
      rr = [1.68, 1.93, 2.17][k % 3];
    const fx = pcx + Math.cos(a) * rr,
      fy = pcy + Math.sin(a) * rr * ry;
    c.fillStyle = k % 2 ? '#6ac04a' : '#58ac3e';
    c.beginPath();
    c.ellipse(fx - 0.03, fy - 0.02, 0.035, 0.018, -0.5, 0, TAU);
    c.ellipse(fx + 0.03, fy - 0.02, 0.035, 0.018, 0.5, 0, TAU);
    c.fill();
  }
  const fcols = ['#e8343a', '#ffcc2a', '#f070a8', '#ffffff', '#b04ad0', '#ff8a2a'];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU + s.range(-0.15, 0.15),
      rr = 2.12;
    const fx = pcx + Math.cos(a) * rr,
      fy = pcy + Math.sin(a) * rr * ry;
    const col = fcols[k % fcols.length];
    for (let q = 0; q < 4; q++) {
      const ox = fx + s.range(-0.13, 0.13),
        oy = fy + s.range(-0.08, 0.08);
      c.fillStyle = '#3e8a30';
      c.beginPath();
      c.ellipse(ox + 0.02, oy + 0.04, 0.018, 0.04, 0.4, 0, TAU);
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(ox, oy - 0.01, 0.03, 0.036, 0, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.ellipse(ox - 0.01, oy - 0.02, 0.009, 0.016, 0, 0, TAU);
      c.fill();
    }
  }
  // the mossy stone ring
  const n = 22;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + s.range(-0.04, 0.04),
      rr = 2.48;
    const sx = pcx + Math.cos(a) * rr,
      sy = pcy + Math.sin(a) * rr * ry;
    const w = s.range(0.2, 0.26),
      h = s.range(0.14, 0.18);
    c.fillStyle = 'rgba(20,40,10,0.35)';
    c.beginPath();
    c.ellipse(sx + 0.03, sy + 0.05, w, h, a + Math.PI / 2, 0, TAU);
    c.fill();
    const sg = c.createLinearGradient(sx - w, sy - h, sx + w, sy + h);
    sg.addColorStop(0, '#c8c4b2');
    sg.addColorStop(1, '#8a8676');
    c.fillStyle = sg;
    c.beginPath();
    c.ellipse(sx, sy, w, h, a + Math.PI / 2, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(50,50,40,0.5)';
    c.lineWidth = 0.018;
    c.stroke();
    if (s.next() < 0.7) {
      c.fillStyle = s.next() < 0.5 ? 'rgba(92,156,58,0.85)' : 'rgba(110,170,64,0.8)';
      c.beginPath();
      c.ellipse(sx + s.range(-0.06, 0.06), sy - h * 0.35, w * s.range(0.4, 0.7), h * 0.45, a + Math.PI / 2, 0, TAU);
      c.fill();
    }
  }
  // petals blown onto the bed and the lawn
  for (let k = 0; k < 40; k++) {
    const a = s.range(0, TAU),
      rr = s.range(1.5, 3.4);
    petal(c, pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, 0.024, s.range(0, 3), s.next() < 0.55 ? 'rgba(255,180,210,0.95)' : 'rgba(255,240,246,0.95)');
  }
}

/** Mossy boulders with little flowers, or a stretch of old dry-stone garden wall. */
function springRock(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 4099 + y * 2203 + 0x59);
  const wallE = T(x + 1, y) === Terrain.Rock,
    wallW = T(x - 1, y) === Terrain.Rock;
  if ((wallE || wallW) && r.next() < 0.75) {
    // dry-stone wall: two courses of rounded stones running across the tile (and into its neighbours)
    const x0 = wallW ? x - 0.02 : x + 0.12,
      x1 = wallE ? x + 1.02 : x + 0.88;
    const by = y + 0.78;
    c.fillStyle = 'rgba(20,40,10,0.3)';
    c.fillRect(x0, by - 0.02, x1 - x0, 0.12);
    for (let row = 0; row < 3; row++) {
      let xx = x0 + (row % 2) * 0.08;
      const yy = by - 0.12 - row * 0.17;
      while (xx < x1 - 0.06) {
        const w = Math.min(r.range(0.18, 0.3), x1 - xx);
        const col = mix('#a8a492', '#c4c0ac', r.next());
        c.fillStyle = shade(col, -0.3);
        c.beginPath();
        c.ellipse(xx + w / 2, yy + 0.05, w / 2, 0.09, 0, 0, TAU);
        c.fill();
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(xx + w / 2, yy + 0.02, w / 2 - 0.01, 0.08, 0, 0, TAU);
        c.fill();
        c.strokeStyle = 'rgba(50,50,40,0.45)';
        c.lineWidth = 0.014;
        c.stroke();
        xx += w + 0.015;
      }
    }
    // moss along the top and creeping ivy
    c.fillStyle = 'rgba(92,156,58,0.85)';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.ellipse(r.range(x0 + 0.1, x1 - 0.1), by - 0.5 + r.range(-0.02, 0.03), r.range(0.06, 0.12), 0.035, 0, 0, TAU);
      c.fill();
    }
    if (r.next() < 0.7) {
      const ix = r.range(x0 + 0.15, x1 - 0.15);
      c.strokeStyle = '#3e7a2c';
      c.lineWidth = 0.016;
      c.beginPath();
      c.moveTo(ix, by + 0.02);
      c.bezierCurveTo(ix + 0.1, by - 0.15, ix - 0.1, by - 0.3, ix + 0.04, by - 0.48);
      c.stroke();
      c.fillStyle = '#4c9a38';
      for (let k = 0; k < 5; k++) {
        c.beginPath();
        c.ellipse(ix + r.range(-0.06, 0.07), by - 0.04 - k * 0.1, 0.035, 0.022, r.range(0, 3), 0, TAU);
        c.fill();
      }
    }
    smallFlowers(c, r, (x0 + x1) / 2, by + 0.06, (x1 - x0) / 2, 4);
    return;
  }
  // a mossy boulder with a smaller companion
  const cx = x + 0.5,
    cy = y + 0.48;
  const pts = rockOutline(x, y, T, r, cx, cy, 0.36, 0.48);
  const path = smooth(pts);
  c.save();
  c.translate(0, 0.08);
  c.fillStyle = '#6e6a5c';
  c.fill(path);
  c.restore();
  const g = c.createRadialGradient(cx - 0.18, cy - 0.2, 0.05, cx, cy, 0.6);
  g.addColorStop(0, '#d0ccb8');
  g.addColorStop(0.6, '#a8a492');
  g.addColorStop(1, '#868272');
  c.fillStyle = g;
  c.fill(path);
  c.strokeStyle = 'rgba(50,50,40,0.5)';
  c.lineWidth = 0.02;
  c.stroke(path);
  // thick moss cushion on top, speckled, with tiny flowers
  c.save();
  c.clip(path);
  c.fillStyle = '#5c9c3a';
  c.beginPath();
  c.ellipse(cx - 0.05 + r.range(-0.05, 0.05), cy - 0.32, 0.5, 0.28, r.range(-0.2, 0.2), 0, TAU);
  c.fill();
  c.fillStyle = '#74b448';
  c.beginPath();
  c.ellipse(cx - 0.1, cy - 0.38, 0.3, 0.14, -0.1, 0, TAU);
  c.fill();
  c.restore();
  c.fillStyle = 'rgba(40,90,30,0.5)';
  for (let k = 0; k < 10; k++) {
    c.beginPath();
    c.arc(cx + r.range(-0.3, 0.25), cy + r.range(-0.42, -0.15), 0.012, 0, TAU);
    c.fill();
  }
  for (let k = 0; k < 5; k++) {
    const fx = cx + r.range(-0.25, 0.2),
      fy = cy + r.range(-0.4, -0.2);
    c.fillStyle = r.next() < 0.6 ? '#ffffff' : '#ffe060';
    c.beginPath();
    c.arc(fx, fy, 0.016, 0, TAU);
    c.fill();
  }
  if (r.next() < 0.6) {
    const px2 = cx + r.range(-0.4, 0.4),
      py2 = y + 0.9;
    c.fillStyle = '#9a9684';
    c.beginPath();
    c.ellipse(px2, py2, 0.09, 0.06, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#5c9c3a';
    c.beginPath();
    c.ellipse(px2 - 0.01, py2 - 0.03, 0.06, 0.025, 0, 0, TAU);
    c.fill();
  }
  // ferns and flowers at the foot
  c.strokeStyle = '#3e8a34';
  c.lineWidth = 0.018;
  for (const sx of [-1, 1]) {
    if (r.next() < 0.5) continue;
    const fx = cx + sx * 0.38,
      fy = y + 0.86;
    c.beginPath();
    c.moveTo(fx, fy);
    c.quadraticCurveTo(fx + sx * 0.1, fy - 0.1, fx + sx * 0.14, fy - 0.2);
    c.stroke();
    for (let q = 1; q <= 3; q++) {
      const bx = fx + sx * 0.04 * q,
        by = fy - 0.06 * q;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + sx * 0.07, by + 0.01);
      c.moveTo(bx, by);
      c.lineTo(bx - sx * 0.03, by - 0.05);
      c.stroke();
    }
  }
  smallFlowers(c, r, cx, y + 0.88, 0.4, 3);
}

function smallFlowers(c: CanvasRenderingContext2D, r: TRng, cx: number, cy: number, spread: number, n: number) {
  for (let k = 0; k < n; k++) {
    const fx = cx + r.range(-spread, spread),
      fy = cy + r.range(-0.05, 0.06),
      pr = 0.018;
    c.fillStyle = ['#ffffff', '#ffe680', '#f2a6d0', '#a8c8ff'][Math.floor(r.next() * 4)];
    for (let q = 0; q < 5; q++) {
      const a = (q / 5) * TAU;
      c.beginPath();
      c.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.72, 0, TAU);
      c.fill();
    }
    c.fillStyle = '#f2c040';
    c.beginPath();
    c.arc(fx, fy, pr * 0.5, 0, TAU);
    c.fill();
  }
}

// ====================================================================== summer: a desert oasis

/** Wind ripples across the open sand (not on the scrubland or the courtyard) and long wind streaks. */
function dunes(c: CanvasRenderingContext2D, W: number, H: number, F: TFn, pcx: number, pcy: number, map: MapData) {
  const R = patchField(Math.floor(map.noise[4] * 1e9) ^ 0xd00e);
  const sh = new Path2D(),
    hi = new Path2D();
  const step = 0.2;
  for (let j = 0; j < (H + 4) / 0.2; j++) {
    const y0 = -2 + j * 0.2;
    let down = false;
    for (let x = -1; x <= W + 1; x += step) {
      const y = y0 + 0.3 * Math.sin(x * 0.42 + j * 0.21) + 0.05 * Math.sin(x * 2.3 + j * 1.7) + x * 0.12;
      const ok = R(x, y) > 0.42 && F(x, y) < 0.56 && Math.hypot(x - pcx, (y - pcy) * 1.1) > 3.6;
      if (ok) {
        if (!down) {
          sh.moveTo(x, y);
          hi.moveTo(x, y - 0.035);
        } else {
          sh.lineTo(x, y);
          hi.lineTo(x, y - 0.035);
        }
      }
      down = ok;
    }
  }
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(160,110,55,0.2)';
  c.lineWidth = 0.035;
  c.stroke(sh);
  c.strokeStyle = 'rgba(255,246,220,0.32)';
  c.lineWidth = 0.025;
  c.stroke(hi);
  // long faint wind streaks
  const r = new TRng(Math.floor(map.noise[5] * 1e9) ^ 0x3171d);
  for (let i = 0; i < (W * H) / 22; i++) {
    const x = r.range(-1, W + 1),
      y = r.range(-1, H + 1),
      l = r.range(0.8, 2.2);
    c.strokeStyle = r.next() < 0.6 ? 'rgba(255,245,215,0.22)' : 'rgba(170,120,60,0.12)';
    c.lineWidth = r.range(0.03, 0.07);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + l * 0.5, y + l * 0.02, x + l, y + l * 0.12);
    c.stroke();
  }
  c.restore();
}

function summerTile(c: CanvasRenderingContext2D, B: Batch, x: number, y: number, _T: TFn, F: TFn, d: number, lod: boolean) {
  if (d < 3.4) return;
  const r = new TRng(x * 3301 + y * 7727 + 0x5a);
  const lr = new TRng(x * 31 + y * 17 + 5);
  const keep = () => !lod || lr.next() < 0.5;
  const f = F(x, y);
  const dryCols = ['#d8b85a', '#c9a446', '#e6cc7a', '#b8923c', '#a88a3a'];
  const scrub = f > 0.55;
  const n = scrub ? 2 + Math.floor(r.next() * 3) : r.next() < 0.22 ? 1 : 0;
  for (let k = 0; k < n; k++) dryTuft(keep() ? B : NOPEN, r, x + r.range(0.12, 0.88), y + r.range(0.25, 0.92), dryCols, scrub ? 1.2 : 0.8);
  if (r.next() < (scrub ? 0.22 : 0.04)) {
    // a scrubby desert bush
    const bx = x + r.range(0.25, 0.75),
      by = y + r.range(0.3, 0.75),
      s = r.range(0.11, 0.17);
    c.fillStyle = 'rgba(120,80,30,0.3)';
    c.beginPath();
    c.ellipse(bx + 0.04, by + 0.05, s * 1.2, s * 0.6, 0, 0, TAU);
    c.fill();
    const col = mix('#8a9448', '#a0a058', r.next());
    for (let q = 0; q < 6; q++) {
      const a = (q / 6) * TAU + r.range(-0.3, 0.3);
      c.fillStyle = shade(col, q < 3 ? -0.15 : 0.05);
      c.beginPath();
      c.arc(bx + Math.cos(a) * s * 0.5, by + Math.sin(a) * s * 0.35 - 0.02, s * 0.5, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(shade(col, 0.35), 0.8);
    for (let q = 0; q < 5; q++) {
      c.beginPath();
      c.arc(bx + r.range(-s * 0.6, s * 0.4), by + r.range(-s * 0.6, 0), 0.012, 0, TAU);
      c.fill();
    }
  }
  if (r.next() < 0.12) {
    // sandstone pebbles
    const m = 1 + Math.floor(r.next() * 3);
    for (let k = 0; k < m; k++) {
      const px2 = x + r.range(0.15, 0.85),
        py2 = y + r.range(0.15, 0.85),
        pr = r.range(0.025, 0.05);
      if (!keep()) continue;
      B.fillStyle = 'rgba(120,80,30,0.3)';
      B.beginPath();
      B.ellipse(px2 + 0.012, py2 + 0.015, pr, pr * 0.7, 0, 0, TAU);
      B.fill();
      B.fillStyle = mix('#c48a5a', '#dca878', r.next());
      B.beginPath();
      B.ellipse(px2, py2, pr * 0.85, pr * 0.6, 0, 0, TAU);
      B.fill();
    }
  }
  if (r.next() < 0.025 && !scrub) {
    // a squat succulent rosette
    const sx = x + r.range(0.25, 0.75),
      sy = y + r.range(0.3, 0.75);
    for (let q = 0; q < 7; q++) {
      const a = (q / 7) * TAU - Math.PI / 2;
      leaf(B, sx + Math.cos(a) * 0.05, sy + Math.sin(a) * 0.035, 0.05, a, q % 2 ? '#7a9a6a' : '#8eaa72');
    }
    B.fillStyle = '#a4c088';
    B.beginPath();
    B.arc(sx, sy, 0.025, 0, TAU);
    B.fill();
  }
  if (r.next() < 0.006 && !lod) {
    // sun-bleached bones
    const bx = x + 0.5,
      by = y + 0.55,
      a = r.range(0, Math.PI);
    c.strokeStyle = '#f2ead8';
    c.lineWidth = 0.035;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(bx - Math.cos(a) * 0.15, by - Math.sin(a) * 0.15);
    c.lineTo(bx + Math.cos(a) * 0.15, by + Math.sin(a) * 0.15);
    c.stroke();
    c.fillStyle = '#f2ead8';
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.arc(bx + sgn * Math.cos(a) * 0.16 - Math.sin(a) * 0.02, by + sgn * Math.sin(a) * 0.16 + Math.cos(a) * 0.02, 0.025, 0, TAU);
      c.arc(bx + sgn * Math.cos(a) * 0.16 + Math.sin(a) * 0.02, by + sgn * Math.sin(a) * 0.16 - Math.cos(a) * 0.02, 0.025, 0, TAU);
      c.fill();
    }
  }
}

/** A desert spring (cisterns): wet dark sand, a small turquoise seep, reeds and date-palm seedlings. */
function desertSpring(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 911 + y * 3571 + 0x5e);
  const cx = x + 0.5,
    cy = y + 0.52;
  // damp sand darkens around the water, merging with neighbouring springs
  glow(c, cx, cy, 0.85, '#8a6a3c', 0.55);
  if (T(x + 1, y) === Terrain.Crystal) glow(c, cx + 0.5, cy, 0.5, '#8a6a3c', 0.4);
  if (T(x, y + 1) === Terrain.Crystal) glow(c, cx, cy + 0.5, 0.5, '#8a6a3c', 0.4);
  c.fillStyle = 'rgba(120,90,50,0.45)';
  c.beginPath();
  c.ellipse(cx, cy + 0.03, 0.46, 0.38, 0, 0, TAU);
  c.fill();
  glow(c, cx, cy, 0.6, '#5ff0e0', 0.3);
  // fresh green grass ringing the spring
  c.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + r.range(-0.3, 0.3);
    const bx = cx + Math.cos(a) * r.range(0.3, 0.42),
      by = cy + Math.sin(a) * r.range(0.24, 0.34) + 0.04;
    c.strokeStyle = k % 2 ? '#5aa83c' : '#6cba44';
    c.lineWidth = 0.02;
    for (let q = 0; q < 4; q++) {
      const aa = -Math.PI / 2 + (q - 1.5) * 0.35;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + Math.cos(aa) * 0.1, by + Math.sin(aa) * 0.11);
      c.stroke();
    }
  }
  // the seep: an irregular little pool, wet rim, turquoise water deepening to the middle
  const px = cx + r.range(-0.06, 0.06),
    py = cy + r.range(-0.02, 0.06);
  const pts: [number, number][] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU;
    pts.push([px + Math.cos(a) * 0.27 * r.range(0.8, 1.1), py + Math.sin(a) * 0.19 * r.range(0.8, 1.1)]);
  }
  const pool = smooth(pts);
  c.save();
  c.translate(0, 0.03);
  c.lineWidth = 0.08;
  c.strokeStyle = '#6a5030';
  c.stroke(pool);
  c.restore();
  c.lineWidth = 0.05;
  c.strokeStyle = '#a08458';
  c.stroke(pool);
  const g = c.createRadialGradient(px - 0.05, py - 0.03, 0.02, px, py, 0.27);
  g.addColorStop(0, '#1aa2ac');
  g.addColorStop(0.6, '#38cac4');
  g.addColorStop(1, '#6ce0d4');
  c.fillStyle = g;
  c.fill(pool);
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = 0.022;
  c.beginPath();
  c.moveTo(px - 0.14, py - 0.06);
  c.lineTo(px - 0.02, py - 0.08);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 0.012;
  c.beginPath();
  c.ellipse(px + 0.06, py + 0.04, 0.07, 0.035, 0, 0, TAU);
  c.stroke();
  sparkle(c, px + 0.1, py - 0.04, 0.03, 'rgba(255,255,255,0.9)');
  // reeds with cattails on one side
  const side = r.next() < 0.5 ? -1 : 1;
  const bx = px + side * 0.27,
    by = py + 0.06;
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + r.range(-0.4, 0.4) + side * 0.15;
    const len = r.range(0.2, 0.34);
    const sx = bx + r.range(-0.05, 0.05);
    c.strokeStyle = ['#4e8a30', '#5e9a38', '#447a2a'][k % 3];
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(sx, by);
    c.quadraticCurveTo(sx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.5, sx + Math.cos(a) * len, by + Math.sin(a) * len);
    c.stroke();
    if (k % 3 === 1) {
      c.fillStyle = '#7a4a22';
      c.beginPath();
      c.ellipse(sx + Math.cos(a) * len, by + Math.sin(a) * len, 0.02, 0.05, a + Math.PI / 2, 0, TAU);
      c.fill();
    }
  }
  // date palm seedlings
  const m = 1 + (r.next() < 0.6 ? 1 : 0);
  for (let k = 0; k < m; k++) {
    const sx = px - side * r.range(0.22, 0.36),
      sy = py + r.range(-0.18, 0.2);
    palmFronds(c, sx, sy, 0.17, r, 6, 0.06);
  }
}

/** A fan of palm fronds radiating from (x,y): `len` long, drooping by `droop`. */
function palmFronds(c: CanvasRenderingContext2D | Batch, x: number, y: number, len: number, r: TRng, n: number, droop: number, lod = false) {
  c.lineCap = 'round';
  const a0 = r.range(0, TAU);
  for (let k = 0; k < n; k++) {
    const a = a0 + (k / n) * TAU + r.range(-0.2, 0.2);
    const l = len * r.range(0.85, 1.1);
    const col = k % 3 === 0 ? '#3c7e30' : k % 3 === 1 ? '#4c9238' : '#5aa040';
    const P = (t: number): [number, number] => [x + Math.cos(a) * l * t, y + Math.sin(a) * l * t * 0.75 - Math.sin(t * Math.PI * 0.9) * l * 0.25 + t * t * droop * 2];
    // leaflets along the spine
    c.strokeStyle = col;
    c.lineWidth = len * 0.06;
    const steps = lod ? 4 : 7;
    for (let q = 1; q <= steps; q++) {
      const t = q / (steps + 1);
      const [sx, sy] = P(t);
      const ll = len * 0.28 * (1 - t * 0.55);
      for (const sgn of [-1, 1]) {
        const la = a + sgn * 0.75;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + Math.cos(la) * ll, sy + Math.sin(la) * ll * 0.8 + ll * 0.1);
        c.stroke();
      }
    }
    c.strokeStyle = shade(col, -0.3);
    c.lineWidth = len * 0.045;
    c.beginPath();
    let [px, py] = P(0);
    c.moveTo(px, py);
    for (let q = 1; q <= 6; q++) {
      [px, py] = P(q / 6);
      c.lineTo(px, py);
    }
    c.stroke();
  }
}

function summerPlaza(c: CanvasRenderingContext2D, pcx: number, pcy: number) {
  const s = new TRng(0x5a11);
  const R = 3.05;
  // octagonal courtyard laid with half-tile glazed tiles
  const od = (dx: number, dy: number) => Math.max(Math.abs(dx), Math.abs(dy), (Math.abs(dx) + Math.abs(dy)) / 1.32);
  const oct = new Path2D();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + TAU / 16;
    const rr = R / Math.cos(TAU / 16);
    const px = pcx + Math.cos(a) * rr,
      py = pcy + Math.sin(a) * rr;
    k ? oct.lineTo(px, py) : oct.moveTo(px, py);
  }
  oct.closePath();
  // a sandstone kerb under it
  c.save();
  glowShadow(c, pcx + 0.08, pcy + 0.15, R + 0.6, 0.25);
  c.translate(0, 0.08);
  c.fillStyle = '#b08458';
  c.fill(oct);
  c.restore();
  c.fillStyle = '#d8b07c';
  c.save();
  c.translate(pcx, pcy);
  c.scale(1.06, 1.06);
  c.translate(-pcx, -pcy);
  c.fill(oct);
  c.restore();
  c.fillStyle = '#a07a50';
  c.fill(oct);
  c.save();
  c.clip(oct);
  const q = 0.5;
  for (let gy = Math.floor((pcy - R - 1) / q) * q; gy < pcy + R + 1; gy += q)
    for (let gx = Math.floor((pcx - R - 1) / q) * q; gx < pcx + R + 1; gx += q) {
      const dx = gx + q / 2 - pcx,
        dy = gy + q / 2 - pcy;
      const dd = od(dx, dy);
      if (dd > R + 0.4) continue;
      const ring = Math.floor(Math.max(Math.abs(dx), Math.abs(dy)) / q + 0.001);
      let col: string;
      if (ring === 4) col = (Math.round(gx / q) + Math.round(gy / q)) % 2 ? '#2fa8a6' : '#e0b040';
      else if (ring === 2) col = '#3ab8b2';
      else col = mix('#f0dcb0', '#e4c896', s.next());
      if (s.next() < 0.035 && ring > 3) continue; // a missing tile, sand showing through
      const g = 0.025;
      c.fillStyle = col;
      c.fillRect(gx + g, gy + g, q - g * 2, q - g * 2);
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.fillRect(gx + g, gy + g, q - g * 2, 0.06);
      if (ring !== 2 && ring !== 4 && s.next() < 0.35) {
        // a small turquoise star inlay at the tile's corner
        c.fillStyle = '#2fa8a6';
        c.beginPath();
        c.moveTo(gx, gy - 0.07);
        c.lineTo(gx + 0.07, gy);
        c.lineTo(gx, gy + 0.07);
        c.lineTo(gx - 0.07, gy);
        c.closePath();
        c.fill();
      }
      if (s.next() < 0.06) {
        c.strokeStyle = 'rgba(90,60,30,0.5)';
        c.lineWidth = 0.012;
        c.beginPath();
        c.moveTo(gx + s.range(0.05, 0.2), gy + s.range(0.05, 0.45));
        c.lineTo(gx + s.range(0.2, 0.45), gy + s.range(0.05, 0.45));
        c.stroke();
      }
    }
  // sand blown in over the edges
  for (let k = 0; k < 34; k++) {
    const a = s.range(0, TAU),
      rr = R - s.range(0, 0.5);
    glow(c, pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr, s.range(0.3, 0.6), '#e2c58c', 0.75);
  }
  c.restore();
  c.strokeStyle = 'rgba(110,70,35,0.6)';
  c.lineWidth = 0.03;
  c.stroke(oct);
}

/** Sandstone outcrops with wind-cut strata, or a broken sandstone pillar. */
function sandstone(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 4099 + y * 2203 + 0x5a);
  const lone = T(x + 1, y) !== Terrain.Rock && T(x - 1, y) !== Terrain.Rock && T(x, y + 1) !== Terrain.Rock && T(x, y - 1) !== Terrain.Rock;
  const cx = x + 0.5,
    cy = y + 0.5;
  if (lone && r.next() < 0.55) {
    // a broken pillar on its plinth, a fallen drum beside it
    c.fillStyle = '#b07a4a';
    c.fillRect(cx - 0.34, cy + 0.1, 0.68, 0.18);
    c.fillStyle = '#e0aa74';
    c.fillRect(cx - 0.34, cy - 0.02, 0.68, 0.13);
    c.strokeStyle = 'rgba(100,60,30,0.7)';
    c.lineWidth = 0.02;
    c.strokeRect(cx - 0.34, cy - 0.02, 0.68, 0.3);
    const h = r.range(0.45, 0.78);
    const g = c.createLinearGradient(cx - 0.2, 0, cx + 0.2, 0);
    g.addColorStop(0, '#f2c590');
    g.addColorStop(0.6, '#d8a06a');
    g.addColorStop(1, '#a8703e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx - 0.2, cy + 0.04);
    c.lineTo(cx - 0.2, cy - h + 0.06);
    c.lineTo(cx - 0.08, cy - h - 0.03);
    c.lineTo(cx + 0.02, cy - h + 0.06);
    c.lineTo(cx + 0.12, cy - h - 0.01);
    c.lineTo(cx + 0.2, cy - h + 0.08);
    c.lineTo(cx + 0.2, cy + 0.04);
    c.closePath();
    c.fill();
    c.stroke();
    // carved bands
    c.strokeStyle = 'rgba(120,70,35,0.6)';
    c.lineWidth = 0.016;
    c.beginPath();
    for (const fy of [0.12, 0.3]) {
      if (fy > h - 0.1) continue;
      c.moveTo(cx - 0.2, cy - fy);
      c.lineTo(cx + 0.2, cy - fy);
    }
    c.stroke();
    c.fillStyle = '#2fa8a6';
    for (let k = 0; k < 4; k++) c.fillRect(cx - 0.17 + k * 0.1, cy - 0.23, 0.05, 0.05);
    // drum lying in the sand
    const dx = cx + (r.next() < 0.5 ? -0.3 : 0.3),
      dy = cy + 0.36;
    c.fillStyle = '#c48c58';
    c.beginPath();
    c.ellipse(dx, dy, 0.17, 0.09, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#e8b47e';
    c.beginPath();
    c.ellipse(dx - 0.03, dy - 0.02, 0.12, 0.065, 0, 0, TAU);
    c.fill();
    // sand drifted against the plinth
    glow(c, cx + 0.15, cy + 0.3, 0.35, '#e8cc94', 0.8);
    return;
  }
  const pts = rockOutline(x, y, T, r, cx, cy - 0.04, 0.4, 0.54);
  const path = new Path2D();
  pts.forEach(([a, b], i) => (i ? path.lineTo(a, b) : path.moveTo(a, b)));
  path.closePath();
  // a tall cliff skirt below the flat top: the outcrop reads as a little mesa
  c.save();
  for (let k = 3; k >= 1; k--) {
    c.translate(0, 0.045);
    c.fillStyle = k === 3 ? '#8a5430' : k === 2 ? '#a06438' : '#b47444';
    c.fill(path);
  }
  c.restore();
  const g = c.createLinearGradient(cx - 0.5, cy - 0.5, cx + 0.5, cy + 0.4);
  g.addColorStop(0, '#f2c28a');
  g.addColorStop(1, '#cc8c56');
  c.fillStyle = g;
  c.fill(path);
  c.save();
  c.clip(path);
  // strata across the top, wind-cut
  c.strokeStyle = 'rgba(150,90,45,0.45)';
  c.lineWidth = 0.02;
  for (let k = 0; k < 5; k++) {
    const yy = cy - 0.45 + k * 0.18 + r.range(-0.03, 0.03);
    c.beginPath();
    c.moveTo(cx - 0.8, yy);
    c.bezierCurveTo(cx - 0.3, yy + r.range(-0.06, 0.06), cx + 0.2, yy + r.range(-0.06, 0.06), cx + 0.8, yy + r.range(-0.04, 0.04));
    c.stroke();
  }
  c.fillStyle = 'rgba(255,235,200,0.35)';
  c.beginPath();
  c.ellipse(cx - 0.15, cy - 0.25, 0.25, 0.1, -0.2, 0, TAU);
  c.fill();
  c.restore();
  c.strokeStyle = 'rgba(100,55,25,0.65)';
  c.lineWidth = 0.02;
  c.stroke(path);
  if (r.next() < 0.5) {
    const px2 = cx + r.range(-0.42, 0.42),
      py2 = y + 0.95;
    facet(c, ngon(px2, py2, 0.08, 5, r.next(), 0.7), px2 - 0.02, py2 - 0.03, '#d09a66', 0.4);
  }
  glow(c, cx + r.range(-0.3, 0.3), y + 0.98, 0.3, '#e8cc94', 0.7);
}

function palm(c: CanvasRenderingContext2D, cx: number, cy: number, r: TRng, B: Batch, lod: boolean) {
  const lean = r.range(-0.22, 0.22),
    h = r.range(0.55, 0.72);
  const tx = cx + lean,
    ty = cy - h;
  // ringed, gently curving trunk
  c.lineCap = 'round';
  const seg = 7;
  for (let k = 0; k < seg; k++) {
    const t0 = k / seg,
      t1 = (k + 1) / seg;
    const X = (t: number) => cx + lean * t * t,
      Y = (t: number) => cy - h * t;
    c.strokeStyle = k % 2 ? '#8a6a44' : '#9c7a4e';
    c.lineWidth = 0.1 - t0 * 0.035;
    c.beginPath();
    c.moveTo(X(t0), Y(t0));
    c.lineTo(X(t1), Y(t1));
    c.stroke();
    c.strokeStyle = 'rgba(70,45,25,0.6)';
    c.lineWidth = 0.012;
    c.beginPath();
    c.moveTo(X(t1) - 0.045, Y(t1) + 0.01);
    c.lineTo(X(t1) + 0.045, Y(t1) - 0.005);
    c.stroke();
  }
  // dates hanging under the crown
  c.fillStyle = '#b8642a';
  for (let k = 0; k < 6; k++) {
    c.beginPath();
    c.arc(tx + r.range(-0.06, 0.06), ty + r.range(0.0, 0.07), 0.022, 0, TAU);
    c.fill();
  }
  palmFronds(B, tx, ty, r.range(0.56, 0.68), r, 9, 0.08, lod);
  B.flush(c);
  c.fillStyle = '#6a5a2a';
  c.beginPath();
  c.arc(tx, ty, 0.04, 0, TAU);
  c.fill();
}

function acacia(c: CanvasRenderingContext2D, cx: number, cy: number, r: TRng) {
  // forked trunk
  c.strokeStyle = '#5a4030';
  c.lineCap = 'round';
  c.lineWidth = 0.07;
  c.beginPath();
  c.moveTo(cx, cy + 0.1);
  c.lineTo(cx, cy - 0.15);
  c.stroke();
  c.lineWidth = 0.04;
  c.beginPath();
  c.moveTo(cx, cy - 0.12);
  c.quadraticCurveTo(cx - 0.12, cy - 0.25, cx - 0.25, cy - 0.38);
  c.moveTo(cx, cy - 0.12);
  c.quadraticCurveTo(cx + 0.1, cy - 0.28, cx + 0.22, cy - 0.4);
  c.stroke();
  // flat, wide umbrella canopy in layers
  const col = mix('#6e8a3a', '#7e9640', r.next());
  const layers: [number, number, number, number][] = [];
  for (let k = 0; k < 6; k++) layers.push([cx + r.range(-0.36, 0.36), cy - 0.42 + r.range(-0.08, 0.06), r.range(0.24, 0.34), r.range(0.1, 0.14)]);
  c.fillStyle = shade(col, -0.35);
  for (const [x, y, rx, ry] of layers) {
    c.beginPath();
    c.ellipse(x + 0.02, y + 0.05, rx, ry, 0, 0, TAU);
    c.fill();
  }
  for (const [x, y, rx, ry] of layers) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
    c.fillStyle = shade(col, 0.2);
    c.beginPath();
    c.ellipse(x - rx * 0.2, y - ry * 0.35, rx * 0.6, ry * 0.45, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = rgba(shade(col, 0.45), 0.8);
  for (let k = 0; k < 12; k++) {
    c.beginPath();
    c.arc(cx + r.range(-0.5, 0.5), cy - 0.45 + r.range(-0.08, 0.06), 0.016, 0, TAU);
    c.fill();
  }
}

// ====================================================================== autumn: a Halloween hillside at night

const LEAVES = ['#d8682a', '#c04428', '#e6a838', '#b8562a', '#d89030', '#a83a28'];

function autumnTile(c: CanvasRenderingContext2D, B: Batch, x: number, y: number, T: TFn, F: TFn, d: number, lod: boolean) {
  if (d < 3.3) return;
  const r = new TRng(x * 3301 + y * 7727 + 0xa1);
  const lr = new TRng(x * 31 + y * 17 + 5);
  const keep = () => !lod || lr.next() < 0.5;
  const f = F(x, y);
  let trees = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && T(x + dx, y + dy) === Terrain.Tree) trees++;
  // olive grass tufts, going to seed
  const tufts = r.next() < 0.45 ? 1 + Math.floor(r.next() * 2) : 0;
  for (let k = 0; k < tufts; k++) dryTuft(keep() ? B : NOPEN, r, x + r.range(0.12, 0.88), y + r.range(0.25, 0.92), ['#5e5a30', '#6a5e34', '#545028'], 0.9);
  // fallen leaves, drifted deep under the trees and in the litter swathes
  const n = (r.next() < 0.55 ? 1 + Math.floor(r.next() * 3) : 0) + trees * 3 + (f > 0.55 ? 3 : 0);
  for (let k = 0; k < n; k++) {
    const lx = x + r.range(0.03, 0.97),
      ly = y + r.range(0.03, 0.97),
      s = r.range(0.04, 0.065),
      a = r.range(0, TAU);
    const col = LEAVES[Math.floor(r.next() * LEAVES.length)];
    if (!keep()) continue;
    if (!lod) {
      B.fillStyle = 'rgba(0,0,0,0.25)';
      B.beginPath();
      B.ellipse(lx + 0.01, ly + 0.012, s, s * 0.6, a, 0, TAU);
      B.fill();
    }
    leaf(B, lx, ly, s, a, col, lod ? undefined : 'rgba(40,15,8,0.5)');
  }
  if (r.next() < 0.022) {
    // a small pumpkin left in the grass
    pumpkin(c, x + r.range(0.3, 0.7), y + r.range(0.4, 0.75), r.range(0.1, 0.14), r, false, r.next() < 0.15);
  }
  if (r.next() < 0.03 && !lod) {
    // toadstools
    const mx = x + r.range(0.25, 0.75),
      my = y + r.range(0.35, 0.8);
    for (let k = 0; k < 2 + Math.floor(r.next() * 2); k++) {
      const ox = mx + r.range(-0.1, 0.1),
        oy = my + r.range(-0.05, 0.06),
        s = r.range(0.03, 0.05);
      c.fillStyle = '#d8ccb0';
      c.fillRect(ox - s * 0.25, oy - s * 1.2, s * 0.5, s * 1.2);
      c.fillStyle = '#c8302a';
      c.beginPath();
      c.ellipse(ox, oy - s * 1.2, s, s * 0.65, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = '#f4ead8';
      c.beginPath();
      c.arc(ox - s * 0.4, oy - s * 1.45, s * 0.14, 0, TAU);
      c.arc(ox + s * 0.3, oy - s * 1.55, s * 0.12, 0, TAU);
      c.fill();
    }
  }
  if (r.next() < 0.06) {
    // a fallen twig
    const tx = x + r.range(0.2, 0.8),
      ty = y + r.range(0.2, 0.8),
      ta = r.range(0, Math.PI);
    B.strokeStyle = 'rgba(40,30,26,0.9)';
    B.lineWidth = 0.022;
    B.lineCap = 'round';
    B.beginPath();
    B.moveTo(tx - Math.cos(ta) * 0.18, ty - Math.sin(ta) * 0.18);
    B.lineTo(tx + Math.cos(ta) * 0.18, ty + Math.sin(ta) * 0.18);
    B.moveTo(tx + Math.cos(ta) * 0.05, ty + Math.sin(ta) * 0.05);
    B.lineTo(tx + Math.cos(ta + 0.7) * 0.14, ty + Math.sin(ta + 0.7) * 0.14);
    B.stroke();
  }
  if (r.next() < 0.005 && !lod) {
    // a weathered skull half-hidden in the grass
    const sx = x + 0.5,
      sy = y + 0.55;
    c.fillStyle = '#d8d0bc';
    c.beginPath();
    c.ellipse(sx, sy, 0.07, 0.06, 0, 0, TAU);
    c.fill();
    c.fillRect(sx - 0.04, sy + 0.03, 0.08, 0.04);
    c.fillStyle = '#1a1410';
    c.beginPath();
    c.arc(sx - 0.025, sy, 0.016, 0, TAU);
    c.arc(sx + 0.025, sy, 0.016, 0, TAU);
    c.fill();
  }
}

/** A pumpkin field (pumpkin patches): tilled rows of dark soil with curling vines and plump pumpkins. */
function pumpkinField(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 911 + y * 3571 + 0xa7);
  const E = T(x + 1, y) === Terrain.Crystal,
    Wn = T(x - 1, y) === Terrain.Crystal,
    S = T(x, y + 1) === Terrain.Crystal,
    Nn = T(x, y - 1) === Terrain.Crystal;
  const x0 = x + (Wn ? -0.02 : 0.05),
    x1 = x + (E ? 1.02 : 0.95),
    y0 = y + (Nn ? -0.02 : 0.07),
    y1 = y + (S ? 1.02 : 0.95);
  glow(c, x + 0.5, y + 0.55, 0.85, '#ff9a30', 0.14);
  // tilled soil
  const soil = new Path2D();
  soil.roundRect(x0, y0, x1 - x0, y1 - y0, [Nn || Wn ? 0 : 0.14, Nn || E ? 0 : 0.14, S || E ? 0 : 0.14, S || Wn ? 0 : 0.14]);
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.save();
  c.translate(0.02, 0.03);
  c.fill(soil);
  c.restore();
  c.fillStyle = '#4a2e1a';
  c.fill(soil);
  c.save();
  c.clip(soil);
  const rows = [0.26, 0.55, 0.84];
  for (const ry of rows) {
    c.fillStyle = 'rgba(20,10,5,0.55)';
    c.fillRect(x0, y + ry + 0.05, x1 - x0, 0.06);
    c.fillStyle = 'rgba(130,85,50,0.45)';
    c.fillRect(x0, y + ry - 0.06, x1 - x0, 0.05);
  }
  c.fillStyle = 'rgba(110,75,45,0.6)';
  for (let k = 0; k < 18; k++) {
    c.beginPath();
    c.arc(r.range(x0, x1), r.range(y0, y1), 0.012, 0, TAU);
    c.fill();
  }
  c.restore();
  // vines curling along the rows, broad leaves
  c.lineCap = 'round';
  for (const ry of rows) {
    const yy = y + ry;
    c.strokeStyle = '#3e6a26';
    c.lineWidth = 0.022;
    c.beginPath();
    c.moveTo(x0 + 0.04, yy);
    for (let k = 1; k <= 6; k++) c.lineTo(x0 + 0.04 + (k / 6) * (x1 - x0 - 0.08), yy + Math.sin(k * 1.9 + x) * 0.035);
    c.stroke();
    // tendril curls
    c.lineWidth = 0.01;
    for (let k = 0; k < 2; k++) {
      const tx = r.range(x0 + 0.1, x1 - 0.1),
        ty = yy - 0.02;
      c.beginPath();
      for (let q = 0; q < 14; q++) {
        const a = q * 0.75,
          rr = 0.045 - q * 0.003;
        q ? c.lineTo(tx + Math.cos(a) * rr, ty - 0.03 + Math.sin(a) * rr) : c.moveTo(tx + Math.cos(a) * rr, ty - 0.03 + Math.sin(a) * rr);
      }
      c.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const lx = r.range(x0 + 0.08, x1 - 0.08),
        ly = yy + r.range(-0.04, 0.03);
      c.fillStyle = k % 2 ? '#2f5a22' : '#3c6c2a';
      for (let q = 0; q < 3; q++) {
        c.beginPath();
        c.arc(lx + (q - 1) * 0.035, ly - (q === 1 ? 0.025 : 0), 0.035, 0, TAU);
        c.fill();
      }
    }
  }
  // the pumpkins, back to front
  const ps: [number, number, number][] = [];
  const m = 3 + Math.floor(r.next() * 2);
  for (let k = 0; k < m; k++) ps.push([x + r.range(0.2, 0.8), y + rows[k % 3] + r.range(-0.02, 0.04), r.range(0.13, 0.18)]);
  ps.sort((a, b) => a[1] - b[1]);
  for (const [px, py, s] of ps) pumpkin(c, px, py, s, r);
}

function autumnPlaza(c: CanvasRenderingContext2D, pcx: number, pcy: number) {
  const s = new TRng(0xa011);
  const ry = 1 / 1.1;
  // a trampled, straw-strewn hilltop
  glow(c, pcx, pcy, 3.9, '#6a5430', 0.65);
  glow(c, pcx, pcy, 2.8, '#8a6c3a', 0.5);
  const B = new Batch();
  B.lineCap = 'round';
  for (let k = 0; k < 520; k++) {
    const a = s.range(0, TAU),
      rr = Math.pow(s.next(), 0.7) * 3.3;
    const x = pcx + Math.cos(a) * rr,
      y = pcy + Math.sin(a) * rr * ry;
    const ta = s.range(0, Math.PI),
      l = s.range(0.06, 0.13);
    B.strokeStyle = ['#d8b860', '#c4a048', '#e6cc7a', '#a8883c'][k % 4];
    B.lineWidth = 0.014;
    B.beginPath();
    B.moveTo(x - Math.cos(ta) * l, y - Math.sin(ta) * l);
    B.lineTo(x + Math.cos(ta) * l, y + Math.sin(ta) * l);
    B.stroke();
  }
  for (let k = 0; k < 30; k++) {
    const a = s.range(0, TAU),
      rr = s.range(1.4, 3.6);
    leaf(B, pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, s.range(0.04, 0.06), s.range(0, TAU), LEAVES[k % LEAVES.length], 'rgba(40,15,8,0.5)');
  }
  B.flush(c);
  // hay bales and corn shocks around the rim, small pumpkins scattered between
  const props: [number, number, number][] = [];
  const kinds = [0, 1, 0, 2, 0, 1, 2];
  for (let k = 0; k < kinds.length; k++) {
    const a = (k / kinds.length) * TAU + s.range(-0.2, 0.2) + 0.4;
    props.push([pcx + Math.cos(a) * 2.75, pcy + Math.sin(a) * 2.75 * ry, kinds[k]]);
  }
  for (let k = 0; k < 8; k++) {
    const a = s.range(0, TAU),
      rr = s.range(1.85, 2.45);
    props.push([pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, 3]);
  }
  props.sort((a, b) => a[1] - b[1]);
  for (const [x, y, kind] of props) {
    if (kind < 2) {
      c.save();
      c.translate(x, y);
      c.scale(1.5, 1.5);
      if (kind === 0) hayBale(c, 0, 0, s);
      else cornShock(c, 0, 0, s);
      c.restore();
    } else if (kind === 2) pumpkin(c, x, y, 0.2, s, s.next() < 0.6);
    else pumpkin(c, x, y, s.range(0.1, 0.15), s, false, s.next() < 0.15);
  }
}

function hayBale(c: CanvasRenderingContext2D, x: number, y: number, s: TRng) {
  const R = 0.17,
    L = 0.2;
  c.fillStyle = 'rgba(0,0,0,0.4)';
  c.beginPath();
  c.ellipse(x + 0.06, y + 0.05, 0.3, 0.1, 0, 0, TAU);
  c.fill();
  // flank
  c.fillStyle = '#b8903e';
  c.beginPath();
  c.moveTo(x - L / 2, y - R);
  c.lineTo(x + L / 2, y - R);
  c.ellipse(x + L / 2, y, R * 0.45, R, 0, -Math.PI / 2, Math.PI / 2);
  c.lineTo(x - L / 2, y + R);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,225,140,0.35)';
  c.fillRect(x - L / 2, y - R, L + R * 0.3, R * 0.5);
  c.strokeStyle = 'rgba(110,80,30,0.6)';
  c.lineWidth = 0.008;
  for (let k = 0; k < 7; k++) {
    const yy = y - R + 0.03 + (k / 6) * (R * 2 - 0.06);
    c.beginPath();
    c.moveTo(x - L / 2, yy);
    c.lineTo(x + L / 2 + s.range(0, 0.05), yy + s.range(-0.01, 0.01));
    c.stroke();
  }
  // end face with the rolled spiral
  c.fillStyle = '#dcb862';
  c.beginPath();
  c.ellipse(x - L / 2, y, R * 0.55, R, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(130,95,35,0.8)';
  c.lineWidth = 0.01;
  c.beginPath();
  for (let q = 0; q < 40; q++) {
    const a = q * 0.45,
      rr = (q / 40) * 0.95;
    const px = x - L / 2 + Math.cos(a) * R * 0.55 * rr,
      py = y + Math.sin(a) * R * rr;
    q ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
  c.strokeStyle = 'rgba(80,55,20,0.7)';
  c.lineWidth = 0.014;
  c.beginPath();
  c.ellipse(x - L / 2, y, R * 0.55, R, 0, 0, TAU);
  c.stroke();
  // loose straw
  c.strokeStyle = '#e6cc7a';
  c.lineWidth = 0.008;
  for (let k = 0; k < 6; k++) {
    const sx = x + s.range(-0.25, 0.25),
      sy = y + R + s.range(-0.02, 0.04);
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + s.range(-0.06, 0.06), sy + s.range(-0.02, 0.02));
    c.stroke();
  }
}

function cornShock(c: CanvasRenderingContext2D, x: number, y: number, s: TRng) {
  c.fillStyle = 'rgba(0,0,0,0.4)';
  c.beginPath();
  c.ellipse(x + 0.05, y + 0.05, 0.26, 0.1, 0, 0, TAU);
  c.fill();
  c.lineCap = 'round';
  for (let k = 0; k < 13; k++) {
    const bx = x + (k / 12 - 0.5) * 0.44;
    c.strokeStyle = ['#c8a050', '#b08a40', '#d8b860'][k % 3];
    c.lineWidth = 0.03;
    c.beginPath();
    c.moveTo(bx, y + s.range(-0.02, 0.03));
    c.quadraticCurveTo((bx + x) / 2, y - 0.3, x + s.range(-0.03, 0.03), y - 0.56);
    c.stroke();
  }
  // a few drooping leaves and the tie
  c.strokeStyle = '#b89448';
  c.lineWidth = 0.02;
  for (const sgn of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, y - 0.4);
    c.quadraticCurveTo(x + sgn * 0.15, y - 0.45, x + sgn * 0.22, y - 0.3);
    c.stroke();
  }
  c.strokeStyle = '#6a4a2a';
  c.lineWidth = 0.025;
  c.beginPath();
  c.moveTo(x - 0.07, y - 0.36);
  c.lineTo(x + 0.07, y - 0.36);
  c.stroke();
}

function gravestone(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number, r: TRng) {
  const kind = Math.floor(r.next() * 3);
  const col = mix('#6c6c76', '#82808a', r.next());
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.fillStyle = 'rgba(0,0,0,0.4)';
  c.beginPath();
  c.ellipse(w * 0.35, 0.02, w * 0.95, w * 0.32, 0, 0, TAU);
  c.fill();
  // grave mound in front
  c.fillStyle = '#2e2418';
  c.beginPath();
  c.ellipse(0, w * 0.45, w * 0.8, w * 0.38, 0, 0, TAU);
  c.fill();
  const face = new Path2D();
  if (kind === 2) {
    // a stone cross
    const a = w * 0.2;
    face.moveTo(-a, 0);
    face.lineTo(-a, -h * 0.62);
    face.lineTo(-w * 0.5, -h * 0.62);
    face.lineTo(-w * 0.5, -h * 0.8);
    face.lineTo(-a, -h * 0.8);
    face.lineTo(-a, -h);
    face.lineTo(a, -h);
    face.lineTo(a, -h * 0.8);
    face.lineTo(w * 0.5, -h * 0.8);
    face.lineTo(w * 0.5, -h * 0.62);
    face.lineTo(a, -h * 0.62);
    face.lineTo(a, 0);
    face.closePath();
  } else {
    face.moveTo(-w / 2, 0);
    if (kind === 0) {
      face.lineTo(-w / 2, -h + w / 2);
      face.arc(0, -h + w / 2, w / 2, Math.PI, 0);
    } else {
      face.lineTo(-w / 2, -h * 0.85);
      face.lineTo(-w * 0.2, -h);
      face.lineTo(w * 0.2, -h);
      face.lineTo(w / 2, -h * 0.85);
    }
    face.lineTo(w / 2, 0);
    face.closePath();
  }
  // thickness, then the face
  c.save();
  c.translate(w * 0.12, -w * 0.06);
  c.fillStyle = shade(col, -0.45);
  c.fill(face);
  c.restore();
  const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, shade(col, 0.18));
  g.addColorStop(1, shade(col, -0.15));
  c.fillStyle = g;
  c.fill(face);
  c.strokeStyle = 'rgba(10,10,16,0.8)';
  c.lineWidth = 0.016;
  c.stroke(face);
  c.strokeStyle = 'rgba(30,28,36,0.75)';
  c.lineWidth = 0.014;
  c.beginPath();
  if (kind === 0) {
    c.moveTo(0, -h * 0.78);
    c.lineTo(0, -h * 0.42);
    c.moveTo(-w * 0.16, -h * 0.66);
    c.lineTo(w * 0.16, -h * 0.66);
    c.moveTo(-w * 0.28, -h * 0.28);
    c.lineTo(w * 0.28, -h * 0.28);
  } else if (kind === 1) {
    for (const fy of [0.72, 0.56, 0.4]) {
      c.moveTo(-w * 0.28, -h * fy);
      c.lineTo(w * (0.28 - fy * 0.1), -h * fy);
    }
  }
  c.stroke();
  // moss and a crack
  c.fillStyle = 'rgba(80,100,60,0.7)';
  c.beginPath();
  c.ellipse(-w * 0.15, -h * 0.06, w * 0.3, h * 0.08, 0, 0, TAU);
  c.fill();
  if (r.next() < 0.4) {
    c.strokeStyle = 'rgba(15,15,20,0.8)';
    c.lineWidth = 0.01;
    c.beginPath();
    c.moveTo(w * 0.1, -h * 0.95);
    c.lineTo(w * 0.02, -h * 0.75);
    c.lineTo(w * 0.12, -h * 0.6);
    c.stroke();
  }
  c.restore();
}

function fence(c: CanvasRenderingContext2D, x: number, y: number, r: TRng) {
  const wood = '#5a4a3c';
  c.lineCap = 'round';
  const posts: [number, number, number][] = [];
  for (let k = 0; k < 3; k++) posts.push([x - 0.36 + k * 0.36, y + r.range(-0.03, 0.03), r.range(0.26, 0.36) * (k === 2 && r.next() < 0.5 ? 0.5 : 1)]);
  for (const [px, py] of posts) {
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(px + 0.04, py + 0.02, 0.08, 0.03, 0, 0, TAU);
    c.fill();
  }
  c.strokeStyle = shade(wood, -0.3);
  c.lineWidth = 0.05;
  c.beginPath();
  c.moveTo(posts[0][0], posts[0][1] - 0.2);
  c.lineTo(posts[1][0], posts[1][1] - 0.18);
  c.lineTo(posts[1][0] + 0.25, posts[1][1] - 0.02); // a broken rail hanging down
  c.moveTo(posts[0][0], posts[0][1] - 0.1);
  c.lineTo(posts[1][0], posts[1][1] - 0.08);
  c.stroke();
  c.strokeStyle = wood;
  c.lineWidth = 0.032;
  c.stroke();
  for (const [px, py, h] of posts) {
    c.strokeStyle = shade(wood, -0.35);
    c.lineWidth = 0.06;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py - h);
    c.stroke();
    c.strokeStyle = wood;
    c.lineWidth = 0.04;
    c.stroke();
  }
}

/** Dark stones and clusters of old gravestones, sometimes behind a broken fence. */
function graveRock(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 4099 + y * 2203 + 0xa9);
  const cx = x + 0.5,
    cy = y + 0.5;
  const roll = r.next();
  if (roll < 0.6) {
    // a cluster of gravestones, back to front
    const n = 2 + Math.floor(r.next() * 2);
    const st: [number, number][] = [];
    for (let k = 0; k < n; k++) st.push([cx + (k - (n - 1) / 2) * 0.32 + r.range(-0.05, 0.05), cy + r.range(-0.1, 0.25)]);
    st.sort((a, b) => a[1] - b[1]);
    for (const [sx, sy] of st) gravestone(c, sx, sy, r.range(0.25, 0.31), r.range(0.4, 0.56), r.range(-0.18, 0.18), r);
  } else {
    // a dark lichened boulder
    const pts = rockOutline(x, y, T, r, cx, cy - 0.05);
    const base = mix('#3a3a42', '#46424c', r.next());
    c.fillStyle = shade(base, -0.45);
    c.beginPath();
    pts.forEach(([a, b], i) => (i ? c.lineTo(a, b + 0.1) : c.moveTo(a, b + 0.1)));
    c.closePath();
    c.fill();
    facet(c, pts, cx - 0.1, cy - 0.17, base, 0.45, 'rgba(8,8,12,0.8)', 0.02);
    c.fillStyle = 'rgba(140,140,90,0.45)';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.ellipse(cx + r.range(-0.25, 0.15), cy + r.range(-0.35, -0.1), r.range(0.03, 0.07), r.range(0.02, 0.04), 0, 0, TAU);
      c.fill();
    }
    if (r.next() < 0.5) fence(c, cx + r.range(-0.1, 0.1), y + 0.95, r);
    else gravestone(c, cx + r.range(-0.3, 0.3), y + 0.92, 0.18, 0.28, r.range(-0.25, 0.25), r);
  }
  for (let k = 0; k < 4; k++) leaf(c, cx + r.range(-0.45, 0.45), y + r.range(0.75, 0.98), 0.045, r.range(0, TAU), LEAVES[k % LEAVES.length]);
}

/** A pale moon floating on the dark water of every pond. */
function moonReflections(c: CanvasRenderingContext2D, map: MapData, T: TFn) {
  const seen = new Set<number>();
  for (const [x, y] of waterTiles(map, T)) {
    if (seen.has(y * map.w + x)) continue;
    // flood the pond, then put the moon on its most central tile
    const stack: [number, number][] = [[x, y]];
    const tiles: [number, number][] = [];
    seen.add(y * map.w + x);
    while (stack.length) {
      const [a, b] = stack.pop()!;
      tiles.push([a, b]);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const u = a + dx,
          v = b + dy;
        if (T(u, v) === Terrain.Water && !seen.has(v * map.w + u)) {
          seen.add(v * map.w + u);
          stack.push([u, v]);
        }
      }
    }
    let best = tiles[0],
      bn = -1;
    for (const [a, b] of tiles) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (T(a + dx, b + dy) === Terrain.Water) n++;
      if (n > bn) (bn = n), (best = [a, b]);
    }
    const mx = best[0] + 0.5,
      my = best[1] + 0.5;
    const s = bn >= 9 ? 0.2 : 0.14;
    glow(c, mx, my, s * 3.2, '#c8cce8', 0.28);
    c.fillStyle = '#ece8d0';
    c.beginPath();
    c.arc(mx, my, s, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(190,185,160,0.6)';
    c.beginPath();
    c.arc(mx + s * 0.3, my - s * 0.2, s * 0.22, 0, TAU);
    c.arc(mx - s * 0.35, my + s * 0.3, s * 0.15, 0, TAU);
    c.fill();
    // ripples breaking it up
    c.strokeStyle = 'rgba(20,35,40,0.8)';
    c.lineWidth = 0.02;
    for (const dy of [-0.06, 0.05]) {
      c.beginPath();
      c.moveTo(mx - s * 1.1, my + dy);
      c.lineTo(mx + s * 1.1, my + dy);
      c.stroke();
    }
    c.strokeStyle = 'rgba(236,232,208,0.45)';
    for (const dy of [s * 1.4, s * 1.8]) {
      c.beginPath();
      c.moveTo(mx - s * 0.7, my + dy);
      c.lineTo(mx + s * 0.7, my + dy);
      c.stroke();
    }
  }
}

/** Pale mist pooling in the hollows (not over the hilltop). */
function mist(c: CanvasRenderingContext2D, W: number, H: number, map: MapData, pcx: number, pcy: number) {
  const M = patchField(Math.floor(map.noise[6] * 1e9) ^ 0x3157);
  const Fm: TFn = (x, y) => M(x, y) * Math.min(1, Math.max(0, (Math.hypot(x - pcx, (y - pcy) * 1.1) - 3) / 3));
  const cv = document.createElement('canvas');
  cv.width = (W + 2) * SW;
  cv.height = (H + 2) * SW;
  const g = cv.getContext('2d')!;
  patches(g, W, H, Fm, 0.55, '#aaa6c6', 0.2, 1.6);
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'low';
  c.drawImage(cv, -1, -1, W + 2, H + 2);
  c.restore();
}

// ====================================================================== winter: a snowbound hold at twilight

function winterTile(c: CanvasRenderingContext2D, B: Batch, x: number, y: number, T: TFn, F: TFn, d: number, lod: boolean) {
  if (d < 3.4) return;
  const r = new TRng(x * 3301 + y * 7727 + 0x3b);
  if (r.next() < 0.03 && !lod) {
    // a hare's tracks
    const a = r.range(0, TAU);
    let tx = x + 0.5 - Math.cos(a) * 0.4,
      ty = y + 0.5 - Math.sin(a) * 0.4;
    B.fillStyle = 'rgba(110,130,170,0.45)';
    for (let k = 0; k < 3; k++) {
      const nx = -Math.sin(a),
        ny = Math.cos(a);
      B.beginPath();
      B.ellipse(tx + nx * 0.04, ty + ny * 0.04, 0.03, 0.016, a, 0, TAU);
      B.ellipse(tx - nx * 0.04, ty - ny * 0.04, 0.03, 0.016, a, 0, TAU);
      B.ellipse(tx - Math.cos(a) * 0.08, ty - Math.sin(a) * 0.08, 0.018, 0.014, a, 0, TAU);
      B.fill();
      tx += Math.cos(a) * 0.3;
      ty += Math.sin(a) * 0.3;
    }
  }
  if (r.next() < 0.05) {
    // a twig poking out of the snow
    const tx = x + r.range(0.2, 0.8),
      ty = y + r.range(0.2, 0.8),
      ta = r.range(0, Math.PI);
    B.strokeStyle = 'rgba(70,55,50,0.85)';
    B.lineWidth = 0.02;
    B.lineCap = 'round';
    B.beginPath();
    B.moveTo(tx - Math.cos(ta) * 0.15, ty - Math.sin(ta) * 0.15);
    B.lineTo(tx + Math.cos(ta) * 0.15, ty + Math.sin(ta) * 0.15);
    B.moveTo(tx + Math.cos(ta) * 0.04, ty + Math.sin(ta) * 0.04);
    B.lineTo(tx + Math.cos(ta + 0.7) * 0.12, ty + Math.sin(ta + 0.7) * 0.12);
    B.stroke();
  }
  if (r.next() < 0.08) {
    // snow-capped pebbles
    const m = 1 + Math.floor(r.next() * 2);
    for (let k = 0; k < m; k++) {
      const px2 = x + r.range(0.15, 0.85),
        py2 = y + r.range(0.15, 0.85),
        pr = r.range(0.03, 0.055);
      c.fillStyle = 'rgba(60,80,120,0.3)';
      c.beginPath();
      c.ellipse(px2 + 0.012, py2 + 0.015, pr, pr * 0.7, 0, 0, TAU);
      c.fill();
      c.fillStyle = mix('#6a7286', '#7c8496', r.next());
      c.beginPath();
      c.ellipse(px2, py2, pr, pr * 0.7, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#eef3f9';
      c.beginPath();
      c.ellipse(px2, py2 - pr * 0.3, pr * 0.9, pr * 0.42, 0, 0, TAU);
      c.fill();
    }
  }
  seasonTile(c, B, x, y, 'winter', 'day', T, F, false, lod);
}

/** A pine stand (lodges): young pines, stumps and wood chips around a cleared woodcutting spot. */
function pineStand(c: CanvasRenderingContext2D, x: number, y: number, _T: TFn) {
  const r = new TRng(x * 911 + y * 3571 + 0x3c);
  const cx = x + 0.5,
    cy = y + 0.52;
  glow(c, cx, cy, 0.85, '#ffe0b0', 0.22);
  // trodden, cleared snow with sawdust and chips
  c.fillStyle = 'rgba(150,160,180,0.45)';
  c.beginPath();
  c.ellipse(cx, cy + 0.12, 0.44, 0.3, 0, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(200,160,110,0.35)';
  c.beginPath();
  c.ellipse(cx + 0.05, cy + 0.18, 0.28, 0.16, 0, 0, TAU);
  c.fill();
  for (let k = 0; k < 14; k++) {
    c.fillStyle = k % 2 ? '#d8a868' : '#b88850';
    c.save();
    c.translate(cx + r.range(-0.35, 0.35), cy + r.range(0.0, 0.35));
    c.rotate(r.range(0, Math.PI));
    c.fillRect(-0.025, -0.008, 0.05, 0.016);
    c.restore();
  }
  // young pines at the back of the stand
  const pines: [number, number, number][] = [];
  const n = 3 + Math.floor(r.next() * 2);
  for (let k = 0; k < n; k++) pines.push([x + 0.15 + (k / (n - 1)) * 0.7 + r.range(-0.06, 0.06), y + r.range(0.3, 0.5), r.range(0.46, 0.6)]);
  pines.sort((a, b) => a[1] - b[1]);
  for (const [px, py, s] of pines) {
    c.fillStyle = 'rgba(40,60,100,0.3)';
    c.beginPath();
    c.ellipse(px + 0.05, py + 0.03, s * 0.45, s * 0.15, 0, 0, TAU);
    c.fill();
    pine(c, px, py, s, r, true);
  }
  // stumps and a felled log in front
  const stumps: [number, number][] = [
    [cx + r.range(-0.32, -0.12), cy + r.range(0.2, 0.32)],
    [cx + r.range(0.12, 0.32), cy + r.range(0.22, 0.36)],
  ];
  for (const [sx, sy] of stumps) stump(c, sx, sy, r.range(0.08, 0.11), r);
  if (r.next() < 0.5) {
    const lx = cx + r.range(-0.05, 0.05),
      ly = cy + 0.4;
    log(c, lx, ly, 0.2, 0.05, r.range(-0.2, 0.2));
  }
}

function stump(c: CanvasRenderingContext2D, x: number, y: number, s: number, r: TRng) {
  c.fillStyle = 'rgba(40,60,100,0.3)';
  c.beginPath();
  c.ellipse(x + 0.03, y + 0.03, s * 1.4, s * 0.6, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#5e4230';
  c.fillRect(x - s, y - s * 0.9, s * 2, s * 0.9);
  c.beginPath();
  c.ellipse(x, y, s, s * 0.45, 0, 0, Math.PI);
  c.fill();
  c.fillStyle = '#e0bc88';
  c.beginPath();
  c.ellipse(x, y - s * 0.9, s, s * 0.45, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(140,100,60,0.7)';
  c.lineWidth = 0.008;
  for (const k of [0.35, 0.65]) {
    c.beginPath();
    c.ellipse(x, y - s * 0.9, s * k, s * 0.45 * k, 0, 0, TAU);
    c.stroke();
  }
  if (r.next() < 0.5) {
    c.fillStyle = '#eef3f9';
    c.beginPath();
    c.ellipse(x - s * 0.2, y - s * 0.95, s * 0.6, s * 0.25, 0, 0, TAU);
    c.fill();
  }
}

/** A log lying on the ground, end grain toward the viewer's right, with snow along the top. */
function log(c: CanvasRenderingContext2D, x: number, y: number, hl: number, rad: number, a: number, snowy = true) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = 'rgba(40,50,80,0.35)';
  c.beginPath();
  c.ellipse(0.02, rad * 0.9, hl * 1.05, rad * 0.6, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#6a4a32';
  c.fillRect(-hl, -rad, hl * 2, rad * 2);
  c.fillStyle = '#7e5a3c';
  c.fillRect(-hl, -rad, hl * 2, rad * 0.8);
  c.strokeStyle = 'rgba(40,25,15,0.6)';
  c.lineWidth = 0.008;
  c.beginPath();
  c.moveTo(-hl * 0.8, rad * 0.2);
  c.lineTo(hl * 0.6, rad * 0.3);
  c.stroke();
  c.fillStyle = '#d8b07c';
  c.beginPath();
  c.ellipse(hl, 0, rad * 0.5, rad, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(140,100,60,0.7)';
  c.beginPath();
  c.ellipse(hl, 0, rad * 0.25, rad * 0.5, 0, 0, TAU);
  c.stroke();
  if (snowy) {
    c.fillStyle = '#eef3f9';
    c.beginPath();
    c.ellipse(-hl * 0.1, -rad * 0.9, hl * 0.9, rad * 0.4, 0, 0, TAU);
    c.fill();
  }
  c.restore();
}

function winterPlaza(c: CanvasRenderingContext2D, pcx: number, pcy: number) {
  const s = new TRng(0x3011);
  const ry = 1 / 1.1;
  // trodden snow ringing the hearth, packed earth nearer the fire, soot at its heart
  glow(c, pcx, pcy, 3.8, '#9eaabe', 0.55);
  const earth = new Path2D();
  earth.ellipse(pcx, pcy, 2.15, 2.15 * ry, 0, 0, TAU);
  const g = c.createRadialGradient(pcx, pcy, 0.4, pcx, pcy, 2.3);
  g.addColorStop(0, '#4a3c34');
  g.addColorStop(0.5, '#76624f');
  g.addColorStop(0.85, '#8a7a6c');
  g.addColorStop(1, 'rgba(120,110,110,0)');
  c.fillStyle = g;
  c.fill(earth);
  // boot prints and thin snow patches
  c.fillStyle = 'rgba(70,80,105,0.3)';
  for (let k = 0; k < 70; k++) {
    const a = s.range(0, TAU),
      rr = s.range(2.1, 3.4);
    c.beginPath();
    c.ellipse(pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, 0.04, 0.025, a, 0, TAU);
    c.fill();
  }
  for (let k = 0; k < 16; k++) {
    const a = s.range(0, TAU),
      rr = s.range(1.6, 2.2);
    glow(c, pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, s.range(0.2, 0.35), '#c8d2e0', 0.6);
  }
  c.fillStyle = 'rgba(30,25,25,0.5)';
  for (let k = 0; k < 50; k++) {
    const a = s.range(0, TAU),
      rr = s.range(1.2, 2.0);
    c.beginPath();
    c.arc(pcx + Math.cos(a) * rr, pcy + Math.sin(a) * rr * ry, s.range(0.01, 0.025), 0, TAU);
    c.fill();
  }
  // the hearth's ring of snow-capped stones
  const n = 18;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + s.range(-0.05, 0.05),
      rr = 1.9;
    const sx = pcx + Math.cos(a) * rr,
      sy = pcy + Math.sin(a) * rr * ry;
    const w = s.range(0.19, 0.24),
      h = s.range(0.14, 0.17);
    c.fillStyle = 'rgba(20,20,40,0.4)';
    c.beginPath();
    c.ellipse(sx + 0.03, sy + 0.05, w, h, a + Math.PI / 2, 0, TAU);
    c.fill();
    const sg = c.createLinearGradient(sx - w, sy - h, sx + w, sy + h);
    sg.addColorStop(0, '#9aa2b2');
    sg.addColorStop(1, '#5a6070');
    c.fillStyle = sg;
    c.beginPath();
    c.ellipse(sx, sy, w, h, a + Math.PI / 2, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(20,20,30,0.55)';
    c.lineWidth = 0.018;
    c.stroke();
    if (Math.sin(a) < 0.3) {
      // snow on the stones away from the fire's heat
      c.fillStyle = '#eef3f9';
      c.beginPath();
      c.ellipse(sx - 0.02, sy - h * 0.4, w * 0.75, h * 0.42, 0, 0, TAU);
      c.fill();
    }
  }
  // seating logs, a woodpile
  for (const a of [0.9, 2.4, 4.0, 5.4]) {
    const aa = a + s.range(-0.15, 0.15);
    log(c, pcx + Math.cos(aa) * 2.8, pcy + Math.sin(aa) * 2.8 * ry, 0.34, 0.09, aa + Math.PI / 2);
  }
  const wx = pcx + 2.55,
    wy = pcy + 1.6;
  for (let row = 0; row < 3; row++)
    for (let k = 0; k < 3 - row; k++) {
      const lx = wx - 0.15 + k * 0.13 + row * 0.065,
        ly = wy - row * 0.1;
      c.fillStyle = '#5e4230';
      c.beginPath();
      c.arc(lx, ly, 0.065, 0, TAU);
      c.fill();
      c.fillStyle = '#d8b07c';
      c.beginPath();
      c.arc(lx, ly, 0.05, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(140,100,60,0.7)';
      c.lineWidth = 0.008;
      c.beginPath();
      c.arc(lx, ly, 0.025, 0, TAU);
      c.stroke();
    }
  c.fillStyle = '#eef3f9';
  c.beginPath();
  c.ellipse(wx + 0.02, wy - 0.27, 0.14, 0.05, 0, 0, TAU);
  c.fill();
}

/** Snow-capped grey boulders. */
function winterRock(c: CanvasRenderingContext2D, x: number, y: number, T: TFn) {
  const r = new TRng(x * 4099 + y * 2203 + 0x3d);
  const cx = x + 0.5,
    cy = y + 0.45;
  const pts = rockOutline(x, y, T, r, cx, cy);
  const base = mix('#68708a', '#747a90', r.next());
  c.fillStyle = shade(base, -0.4);
  c.beginPath();
  pts.forEach(([a, b], i) => (i ? c.lineTo(a, b + 0.1) : c.moveTo(a, b + 0.1)));
  c.closePath();
  c.fill();
  facet(c, pts, cx - 0.1 + r.range(-0.05, 0.05), cy - 0.12, base, 0.4, 'rgba(20,24,40,0.75)', 0.02);
  snowCap(c, pts, cx, cy, r, '#e2e9f3', '#f6f9fc', 'rgba(80,100,145,0.45)');
  // snow drifted against the foot
  glow(c, cx - 0.1, y + 0.92, 0.4, '#e4ebf4', 0.85);
}

function birch(c: CanvasRenderingContext2D, cx: number, cy: number, r: TRng, B: Batch) {
  const h = r.range(0.6, 0.75);
  // white trunk with dark marks
  c.fillStyle = '#e8e6e0';
  c.beginPath();
  c.moveTo(cx - 0.07, cy + 0.1);
  c.lineTo(cx - 0.035, cy - h);
  c.lineTo(cx + 0.035, cy - h);
  c.lineTo(cx + 0.07, cy + 0.1);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(40,40,50,0.7)';
  c.lineWidth = 0.014;
  c.stroke();
  c.fillStyle = '#2a2a30';
  for (let k = 0; k < 6; k++) {
    const yy = cy + 0.05 - r.range(0, h);
    c.fillRect(cx - r.range(0.0, 0.05), yy, r.range(0.03, 0.06), 0.014);
  }
  // thin dark branches and fine twigs, carrying snow
  const segs: [number, number, number, number, number][] = [];
  const branch = (x: number, y: number, a: number, len: number, w: number, d: number) => {
    const ex = x + Math.cos(a) * len,
      ey = y + Math.sin(a) * len;
    segs.push([x, y, ex, ey, w]);
    if (d > 0) for (let i = 0; i < 2; i++) branch(ex, ey, a + r.range(-0.6, 0.6), len * r.range(0.55, 0.75), w * 0.6, d - 1);
  };
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.55 + r.range(-0.15, 0.15);
    branch(cx, cy - h * r.range(0.55, 0.95), a, r.range(0.2, 0.3), 0.03, 2);
  }
  B.lineCap = 'round';
  for (const [x, y, ex, ey, w] of segs) {
    B.strokeStyle = '#4a4040';
    B.lineWidth = w;
    B.beginPath();
    B.moveTo(x, y);
    B.lineTo(ex, ey);
    B.stroke();
  }
  for (const [x, y, ex, ey, w] of segs) {
    if (w < 0.015) continue;
    B.strokeStyle = '#eef3f9';
    B.lineWidth = w * 0.8;
    B.beginPath();
    B.moveTo(x, y - w * 0.5);
    B.lineTo(ex, ey - w * 0.5);
    B.stroke();
  }
  // a few dry catkins
  B.fillStyle = '#8a6a40';
  for (let k = 0; k < 5; k++) {
    const sg = segs[segs.length - 1 - k];
    if (!sg) break;
    B.beginPath();
    B.ellipse(sg[2], sg[3] + 0.02, 0.008, 0.02, 0, 0, TAU);
    B.fill();
  }
  B.flush(c);
}

// ====================================================================== groves

function campaignTrees(c: CanvasRenderingContext2D, map: MapData, T: TFn, realm: Campaign, vis: Vis, lod: boolean) {
  const trees: [number, number][] = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (T(x, y) === Terrain.Tree && vis(x, y)) trees.push([x, y]);
  for (const [x, y] of trees) {
    const r = new TRng(x * 1999 + y * 271);
    const cx = x + 0.5 + r.range(-0.08, 0.08),
      cy = y + 0.55 + r.range(-0.06, 0.06);
    if (realm === 'autumn') glowShadow(c, cx + 0.1, cy + 0.18, 0.55, 0.45);
    else if (realm === 'summer') glowShadow(c, cx + 0.22, cy + 0.2, 0.6, 0.38);
    else glowShadow(c, cx + 0.18, cy + 0.22, 0.6, realm === 'winter' ? 0.25 : 0.34);
  }
  const B = new Batch();
  let row = -1;
  for (const [x, y] of trees) {
    if (y !== row) B.flush(c), (row = y);
    const r = new TRng(x * 1999 + y * 271);
    const cx = x + 0.5 + r.range(-0.08, 0.08),
      cy = y + 0.55 + r.range(-0.06, 0.06);
    const s = new TRng(x * 7349 + y * 1213 + 0x7ee);
    if (realm === 'spring') dayTree(c, cx, cy, r, 'spring', x * 31 + y * 7, B, lod);
    else if (realm === 'summer') {
      if (s.next() < 0.68) {
        B.flush(c);
        palm(c, cx, cy, r, B, lod);
      } else acacia(c, cx, cy, r);
    } else if (realm === 'winter') {
      if (s.next() < 0.68) {
        // a snow-laden pine with snow banked at its foot
        c.fillStyle = 'rgba(238,243,249,0.9)';
        c.beginPath();
        c.ellipse(cx, cy + 0.12, 0.36, 0.13, 0, 0, TAU);
        c.fill();
        pine(c, cx, cy + 0.12, r.range(1.0, 1.15), r, true);
      } else {
        c.fillStyle = 'rgba(238,243,249,0.9)';
        c.beginPath();
        c.ellipse(cx, cy + 0.12, 0.3, 0.11, 0, 0, TAU);
        c.fill();
        B.flush(c);
        birch(c, cx, cy, r, B);
      }
    } else {
      if (s.next() < 0.5) deadTree(c, cx, cy, r, null, false, B, lod, true);
      else {
        B.flush(c);
        dayTree(c, cx, cy, r, 'autumn', x * 31 + y * 7, B, lod);
      }
      // a carved jack-o'-lantern or a lantern at the foot of some
      const roll = s.next();
      if (roll < 0.2) {
        B.flush(c);
        pumpkin(c, cx + (s.next() < 0.5 ? -0.28 : 0.28), cy + 0.3, 0.16, s, true);
      } else if (roll < 0.3) {
        B.flush(c);
        lantern(c, cx + (s.next() < 0.5 ? -0.3 : 0.3), cy + 0.34, 0.16);
      }
    }
  }
  B.flush(c);
}

