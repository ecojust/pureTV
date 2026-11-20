// Winter campaign art: a snowbound northern hold under the aurora. Timber, stone, furs and iron,
// warm firelight against cold blue snow. The Hearth (core), its eleven structures, the ice-crevasse
// rifts; the Frost Horde and the war mammoth live in art-winter-creatures.ts.
// World ctx: 1 unit = 1 tile, a structure's tile spans (b.x, b.y)–(b.x+1, b.y+1).
import { CORE_X, CORE_Y } from '../../game/config';
import type { Ally, Building, Game } from '../../game/game';
import { drawMammothAlly, mammothSide, WINTER_ENEMIES } from './art-winter-creatures';
import { registerArt } from './realm-art';
import { cached, facet, glow, hash, mix, poly, pxOf, rgba, shade, TRng } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// palette
const SNOW = '#f4f8ff';
const SNOW_SH = '#c4d4ea';
const ICE = '#bfe6ff';
const ICE_M = '#7fbce6';
const ICE_D = '#3a74ac';
const TIMBER = '#8a5a32';
const TIMBER_L = '#b07a48';
const TIMBER_D = '#4e301a';
const STONE = '#7c8698';
const STONE_L = '#a9b3c4';
const STONE_D = '#4a5264';
const IRON = '#3a404c';
const IRON_L = '#6a7484';
const EMBER = '#ff8a3a';
const FLAME = '#ffd27a';
const AUR_T = '#5affc8';
const AUR_G = '#8aff7a';
const AUR_V = '#b07aff';
const OUT = 'rgba(14,20,38,0.9)';
const SHADOW = 'rgba(28,46,90,0.3)';

function circle(c: C, x: number, y: number, r: number) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
}

function ell(c: C, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), rot, 0, TAU);
}

/** Fill + crisp outline. */
function fo(c: C, fill: string | CanvasGradient, lw = 0.02, stroke = OUT) {
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = lw;
  c.stroke();
}

function hGrad(c: C, x0: number, x1: number, base: string, k = 0.2) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(base, k * 0.7));
  g.addColorStop(0.45, base);
  g.addColorStop(1, shade(base, -k));
  return g;
}

function vGrad(c: C, y0: number, y1: number, a: string, b: string) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

/** A layered, flickering flame with its base at (x, y). */
function flame(c: C, x: number, y: number, w: number, h: number, t: number, seed: number, hot = 1) {
  const layers: [number, string][] = [
    [1, hot < 0.6 ? '#c83a1e' : '#ff5a1e'],
    [0.72, '#ff9a30'],
    [0.45, FLAME],
    [0.22, '#fff6d8'],
  ];
  for (const [k, col] of layers) {
    const ww = w * (0.35 + 0.65 * k),
      hh = h * (0.3 + 0.7 * k);
    const sway = Math.sin(t * 7 + seed) * w * 0.35 + Math.sin(t * 13 + seed * 2) * w * 0.15;
    const tip = hh * (0.9 + 0.12 * Math.sin(t * 11 + seed * 3 + k * 4));
    c.beginPath();
    c.moveTo(x - ww, y);
    c.bezierCurveTo(x - ww * 1.05, y - tip * 0.45, x - ww * 0.2 + sway * 0.5, y - tip * 0.7, x + sway, y - tip);
    c.bezierCurveTo(x + ww * 0.25 + sway * 0.5, y - tip * 0.65, x + ww * 1.05, y - tip * 0.45, x + ww, y);
    c.quadraticCurveTo(x, y + ww * 0.55, x - ww, y);
    c.fillStyle = col;
    c.fill();
    // side tongues on the outer layer
    if (k === 1) {
      for (const s of [-1, 1]) {
        const tx = x + s * ww * 0.7 + Math.sin(t * 9 + seed + s) * w * 0.15;
        const th = hh * (0.45 + 0.15 * Math.sin(t * 12 + seed * 5 + s));
        c.beginPath();
        c.moveTo(tx - ww * 0.3, y - hh * 0.1);
        c.quadraticCurveTo(tx - ww * 0.1, y - th * 0.7, tx + s * ww * 0.15, y - th);
        c.quadraticCurveTo(tx + ww * 0.25, y - th * 0.5, tx + ww * 0.3, y - hh * 0.08);
        c.fill();
      }
    }
  }
}

/** Embers drifting up from (x, y). */
function embers(c: C, x: number, y: number, n: number, spread: number, rise: number, t: number, seed: number) {
  for (let i = 0; i < n; i++) {
    const p = (t * 0.7 + i / n + hash(seed * 31 + i) * 0.5) % 1;
    const ex = x + (hash(seed * 7 + i) - 0.5) * spread + Math.sin(t * 3 + i * 1.9 + seed) * spread * 0.25;
    const ey = y - p * rise;
    const a = Math.sin(p * Math.PI);
    c.fillStyle = rgba(i % 3 ? '#ffc060' : '#fff0b0', 0.95 * a);
    c.fillRect(ex - 0.012, ey - 0.012, 0.024, 0.024);
  }
}

function pips(c: C, cx: number, y: number, level: number) {
  for (let i = 0; i <= level; i++) {
    const x = cx + (i - level / 2) * 0.1;
    c.fillStyle = EMBER;
    poly(c, [
      [x, y - 0.035],
      [x + 0.03, y],
      [x, y + 0.035],
      [x - 0.03, y],
    ]);
    c.fill();
    c.strokeStyle = '#5a2a10';
    c.lineWidth = 0.01;
    c.stroke();
    c.fillStyle = '#ffe0a0';
    c.fillRect(x - 0.008, y - 0.02, 0.012, 0.012);
  }
}

function buffSparkles(c: C, b: Building, t: number) {
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.6 + i / 4 + hash(b.uid * 13 + i) * 0.3) % 1;
    const x = b.x + 0.2 + hash(b.uid * 7 + i) * 0.6;
    const y = b.y + 0.75 - p * 0.9;
    c.fillStyle = rgba('#ffd08a', 0.9 * Math.sin(p * Math.PI));
    poly(c, [
      [x, y - 0.04],
      [x + 0.012, y],
      [x, y + 0.04],
      [x - 0.012, y],
    ]);
    c.fill();
  }
}

/** A snow-capped stone. */
function rock(c: C, x: number, y: number, r: number, seed: number, snow = true) {
  const n = 7;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + seed;
    const rr = r * (0.8 + 0.35 * hash(seed * 13 + i));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.72]);
  }
  facet(c, pts, x - r * 0.2, y - r * 0.25, STONE, 0.4, OUT, 0.016);
  if (snow) {
    c.fillStyle = SNOW;
    ell(c, x - r * 0.1, y - r * 0.35, r * 0.62, r * 0.25);
    c.fill();
  }
}

// ------------------------------------------------------------------ plinth: a stone kerb in packed snow

function plinthCanvas(c: C, level: number) {
  return cached(`wplinth|${level}`, pxOf(c), -0.1, -0.05, 1.25, 1.25, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.56, 0.62, 0.46, 0.34);
    g.fill();
    // packed-snow mound
    ell(g, 0.5, 0.55, 0.45, 0.33);
    fo(g, vGrad(g, 0.25, 0.9, '#ffffff', SNOW_SH), 0.018, 'rgba(60,90,140,0.6)');
    // ring of kerb stones
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      if (Math.sin(a) < -0.2 && level < 1) continue;
      const x = 0.5 + Math.cos(a) * 0.4,
        y = 0.55 + Math.sin(a) * 0.29;
      rock(g, x, y, 0.065 + hash(i + level * 17) * 0.02, i * 1.3 + level, Math.sin(a) < 0.3);
    }
    if (level >= 1) {
      // a timber deck ring inside the kerb
      g.strokeStyle = TIMBER_D;
      g.lineWidth = 0.05;
      ell(g, 0.5, 0.54, 0.31, 0.22);
      g.stroke();
      g.strokeStyle = TIMBER_L;
      g.lineWidth = 0.03;
      g.stroke();
    }
    if (level >= 2) {
      g.fillStyle = IRON_L;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2;
        circle(g, 0.5 + Math.cos(a) * 0.31, 0.54 + Math.sin(a) * 0.22, 0.018);
        g.fill();
      }
    }
  });
}

function plinth(c: C, b: Building) {
  c.drawImage(plinthCanvas(c, b.level), b.x - 0.1, b.y - 0.05, 1.25, 1.25);
}

// ------------------------------------------------------------------ ice wall

function icewallCanvas(c: C, mask: number, L: number) {
  return cached(`icewall|${mask}|${L}`, pxOf(c), -0.06, -0.4, 1.2, 1.5, (g) => {
    const N = mask & 1,
      E = mask & 2,
      S = mask & 4,
      W = mask & 8;
    const h = 0.24 + L * 0.05,
      ins = 0.12 - L * 0.025;
    const x0 = W ? 0 : ins,
      x1 = E ? 1 : 1 - ins;
    const fy0 = N ? 0 : ins,
      fy1 = S ? 1 : 1 - ins;
    const y0 = fy0 - h,
      y1 = fy1 - h;
    g.fillStyle = SHADOW;
    g.fillRect(x0 + 0.07, fy0 + 0.04, x1 - x0, fy1 - fy0 + 0.06);
    const glacier = L >= 2;
    if (!S) {
      // front face: ice blocks in a running bond
      const fg = g.createLinearGradient(0, y1, 0, fy1);
      fg.addColorStop(0, glacier ? '#8ccaf0' : '#cdeeff');
      fg.addColorStop(1, glacier ? '#2f6aa8' : '#7fb8e0');
      g.fillStyle = fg;
      g.fillRect(x0, y1, x1 - x0, h);
      g.strokeStyle = glacier ? 'rgba(20,50,100,0.45)' : 'rgba(60,110,170,0.5)';
      g.lineWidth = 0.01;
      const rows = L >= 1 ? 3 : 2;
      g.beginPath();
      for (let r = 1; r < rows; r++) {
        const y = y1 + (h * r) / rows;
        g.moveTo(x0, y);
        g.lineTo(x1, y);
      }
      for (let r = 0; r < rows; r++) {
        const yA = y1 + (h * r) / rows,
          yB = y1 + (h * (r + 1)) / rows;
        for (let x = (r % 2 ? 0.17 : 0.34); x < 1; x += 0.34) {
          if (x <= x0 + 0.02 || x >= x1 - 0.02) continue;
          g.moveTo(x, yA);
          g.lineTo(x, yB);
        }
      }
      g.stroke();
      // glassy diagonal glints
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 0.014;
      g.beginPath();
      for (let x = x0 + 0.08; x < x1 - 0.05; x += 0.29) {
        g.moveTo(x, y1 + h * 0.8);
        g.lineTo(x + 0.08, y1 + h * 0.25);
      }
      g.stroke();
      g.strokeStyle = OUT;
      g.lineWidth = 0.018;
      g.strokeRect(x0, y1, x1 - x0, h);
    }
    // top: packed snow, lumpy along the front edge
    const tg = g.createLinearGradient(0, y0, 0, y1);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(1, '#dce8f6');
    g.fillStyle = tg;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y0);
    g.lineTo(x1, y1);
    const bumps = Math.max(2, Math.round((x1 - x0) / 0.14));
    for (let i = 1; i <= bumps; i++) {
      const xa = x1 - ((i - 0.5) / bumps) * (x1 - x0),
        xb = x1 - (i / bumps) * (x1 - x0);
      g.quadraticCurveTo(xa, y1 + (S ? 0 : 0.035 + 0.02 * hash(i + mask * 7)), xb, y1);
    }
    g.closePath();
    g.fill();
    // wind-scoured dents and sparkle in the packed snow
    g.save();
    g.clip();
    for (let i = 0; i < 5; i++) {
      const x = x0 + 0.08 + hash(i * 5 + mask * 3 + L) * (x1 - x0 - 0.16),
        y = y0 + 0.08 + hash(i * 9 + mask + L * 7) * (y1 - y0 - 0.16);
      g.fillStyle = 'rgba(150,180,220,0.3)';
      ell(g, x, y, 0.09, 0.035, 0.2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      ell(g, x - 0.01, y - 0.02, 0.06, 0.015, 0.2);
      g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(70,100,150,0.7)';
    g.lineWidth = 0.014;
    g.stroke();
    g.strokeStyle = 'rgba(150,180,215,0.6)';
    g.lineWidth = 0.008;
    g.beginPath();
    for (let x = 0.5; x < 1; x += 0.5) {
      if (x <= x0 || x >= x1) continue;
      g.moveTo(x, y0 + 0.02);
      g.lineTo(x, y1 - 0.02);
    }
    g.stroke();
    // icicles hanging off the front edge
    if (!S && L >= 1) {
      const n = Math.round((x1 - x0) / (L >= 2 ? 0.08 : 0.13));
      for (let i = 0; i < n; i++) {
        const x = x0 + ((i + 0.5) / n) * (x1 - x0);
        const len = (0.05 + hash(i * 3 + mask) * 0.08) * (L >= 2 ? 1.6 : 1);
        g.beginPath();
        g.moveTo(x - 0.022, y1 + 0.02);
        g.lineTo(x, y1 + 0.02 + len);
        g.lineTo(x + 0.022, y1 + 0.02);
        g.closePath();
        g.fillStyle = 'rgba(225,246,255,0.95)';
        g.fill();
        g.strokeStyle = 'rgba(40,90,150,0.7)';
        g.lineWidth = 0.006;
        g.stroke();
      }
    }
    // glacier: crystal shards jutting from exposed corners
    if (glacier) {
      const corners: [number, number][] = [];
      if (!N && !W) corners.push([x0 + 0.08, y0 + 0.07]);
      if (!N && !E) corners.push([x1 - 0.08, y0 + 0.07]);
      if (!S && !W) corners.push([x0 + 0.08, y1 - 0.06]);
      if (!S && !E) corners.push([x1 - 0.08, y1 - 0.06]);
      for (const [x, y] of corners) {
        for (const [dx, hh, w] of [
          [-0.03, 0.18, 0.04],
          [0.03, 0.12, 0.035],
        ]) {
          poly(g, [
            [x + dx - w, y],
            [x + dx, y - hh],
            [x + dx + w, y],
          ]);
          fo(g, dx < 0 ? '#e6f8ff' : '#8ccaf0', 0.01, 'rgba(30,70,130,0.85)');
        }
      }
    }
    g.strokeStyle = OUT;
    g.lineWidth = 0.016;
    g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  });
}

function icewall(c: C, b: Building, game: Game, t: number) {
  const nb = (dx: number, dy: number) => game.buildingAtTile?.(b.x + dx, b.y + dy)?.def.id === 'icewall';
  const mask = (nb(0, -1) ? 1 : 0) | (nb(1, 0) ? 2 : 0) | (nb(0, 1) ? 4 : 0) | (nb(-1, 0) ? 8 : 0);
  c.drawImage(icewallCanvas(c, mask, b.level), b.x - 0.06, b.y - 0.4, 1.2, 1.5);
  if (b.level >= 2) {
    // a glint wandering across the glacier ice
    const p = (t * 0.25 + hash(b.uid) ) % 1;
    glow(c, b.x + 0.1 + p * 0.8, b.y + 0.62 - 0.34, 0.12, '#e8fbff', 0.5 * Math.sin(p * Math.PI));
  }
  if (b.hp < b.maxHp * 0.5) {
    c.strokeStyle = 'rgba(30,60,110,0.85)';
    c.lineWidth = 0.016;
    c.beginPath();
    c.moveTo(b.x + 0.32, b.y + 0.55);
    c.lineTo(b.x + 0.4, b.y + 0.68);
    c.lineTo(b.x + 0.35, b.y + 0.8);
    c.moveTo(b.x + 0.4, b.y + 0.68);
    c.lineTo(b.x + 0.5, b.y + 0.72);
    c.stroke();
  }
}

// ------------------------------------------------------------------ snowball fort

function snowBlock(g: C, x: number, y: number, w: number, h: number) {
  // a cube of packed snow: front face and top
  g.beginPath();
  g.roundRect(x - w / 2, y - h, w, h, 0.015);
  fo(g, vGrad(g, y - h, y, '#e4eefa', '#a8c0dc'), 0.012, 'rgba(40,70,120,0.75)');
  g.beginPath();
  g.roundRect(x - w / 2, y - h - w * 0.35, w, w * 0.4, 0.015);
  fo(g, '#ffffff', 0.012, 'rgba(40,70,120,0.75)');
}

function fortHalf(c: C, L: number, front: boolean) {
  return cached(`fort|${L}|${front ? 1 : 0}`, pxOf(c), -0.55, -0.6, 1.1, 1.0, (g) => {
    const rx = 0.38,
      ry = 0.25,
      cy = 0.12;
    const n = 14;
    const h = 0.1 + L * 0.03;
    if (!front) {
      // trodden floor
      ell(g, 0, cy, rx * 0.95, ry * 0.95);
      g.fillStyle = '#c8d6e8';
      g.fill();
      // snowball stockpile
      const pile: [number, number][] = [
        [-0.17, cy + 0.06],
        [-0.1, cy + 0.08],
        [-0.135, cy + 0.02],
      ];
      if (L >= 2) pile.push([0.16, cy + 0.07], [0.22, cy + 0.06], [0.19, cy + 0.02]);
      for (const [x, y] of pile) {
        circle(g, x, y, 0.045);
        fo(g, vGrad(g, y - 0.05, y + 0.05, '#ffffff', '#b8cce4'), 0.01, 'rgba(40,70,120,0.7)');
      }
    }
    const items: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.1;
      const s = Math.sin(a);
      if (front !== s > 0) continue;
      // a gap in the front wall (the doorway) at the bottom
      if (front && Math.abs(a - Math.PI / 2) < 0.3) continue;
      items.push([Math.cos(a) * rx, cy + s * ry, (i % 3 === 0 ? 1.25 : 1) * h]);
    }
    items.sort((a, b) => a[1] - b[1]);
    for (const [x, y, hh] of items) snowBlock(g, x, y, 0.15, hh);
    if (!front && L >= 1) {
      // pennant pole at the back
      g.strokeStyle = TIMBER_D;
      g.lineWidth = 0.022;
      g.beginPath();
      g.moveTo(-0.28, cy - ry - 0.05);
      g.lineTo(-0.28, cy - ry - 0.5);
      g.stroke();
      poly(g, [
        [-0.28, cy - ry - 0.5],
        [-0.06, cy - ry - 0.44],
        [-0.28, cy - ry - 0.37],
      ]);
      fo(g, L >= 2 ? '#2e5a9a' : '#4a8ad0', 0.01);
    }
  });
}

function snowballer(c: C, b: Building, cx: number, cy: number) {
  const L = b.level;
  c.drawImage(fortHalf(c, L, false), cx - 0.55, cy - 0.6, 1.1, 1.0);
  // catapult: A-frame and an arm swinging in the vertical plane toward the target
  const px = cx,
    py = cy + 0.06;
  const ph = py - 0.13;
  c.strokeStyle = TIMBER_D;
  c.lineWidth = 0.035;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px - 0.1, py + 0.02);
  c.lineTo(px, ph);
  c.lineTo(px + 0.1, py + 0.02);
  c.stroke();
  c.strokeStyle = TIMBER_L;
  c.lineWidth = 0.016;
  c.stroke();
  const rec = Math.sqrt(b.recoil);
  const rest = Math.PI - 0.35,
    fired = 0.55;
  const th = rest + (fired - rest) * rec;
  const ux = Math.cos(b.angle),
    uy = Math.sin(b.angle);
  const len = 0.3 + L * 0.03;
  const ex = px + ux * Math.cos(th) * len,
    ey = ph + uy * Math.cos(th) * len * 0.55 - Math.sin(th) * len;
  const bx = px - ux * Math.cos(th) * len * 0.3,
    by = ph - uy * Math.cos(th) * len * 0.55 * 0.3 + Math.sin(th) * len * 0.3;
  c.strokeStyle = OUT;
  c.lineWidth = 0.05;
  c.beginPath();
  c.moveTo(bx, by);
  c.lineTo(ex, ey);
  c.stroke();
  c.strokeStyle = TIMBER_L;
  c.lineWidth = 0.03;
  c.stroke();
  if (L >= 2) {
    c.strokeStyle = IRON_L;
    c.lineWidth = 0.034;
    c.beginPath();
    for (const k of [0.35, 0.7]) {
      const x = bx + (ex - bx) * k,
        y = by + (ey - by) * k;
      c.moveTo(x - 0.008, y - 0.008);
      c.lineTo(x + 0.008, y + 0.008);
    }
    c.stroke();
  }
  // counterweight: a lashed sack of stones
  circle(c, bx, by + 0.02, 0.05);
  fo(c, STONE, 0.012);
  // cup and snowball
  ell(c, ex, ey, 0.055, 0.035);
  fo(c, TIMBER_D, 0.012);
  if (b.recoil < 0.05) {
    circle(c, ex, ey - 0.04, 0.05);
    fo(c, vGrad(c, ey - 0.09, ey, '#ffffff', '#c0d4ec'), 0.012, 'rgba(40,70,120,0.8)');
  }
  c.drawImage(fortHalf(c, L, true), cx - 0.55, cy - 0.6, 1.1, 1.0);
}

// ------------------------------------------------------------------ icicle field (trap)

function iciclesCanvas(c: C, L: number) {
  return cached(`icicles|${L}`, pxOf(c), 0, -0.2, 1, 1.2, (g) => {
    // a frosted patch of snow
    const rg = g.createRadialGradient(0.5, 0.55, 0.05, 0.5, 0.55, 0.48);
    rg.addColorStop(0, 'rgba(200,232,255,0.75)');
    rg.addColorStop(0.75, 'rgba(160,205,240,0.45)');
    rg.addColorStop(1, 'rgba(160,205,240,0)');
    g.fillStyle = rg;
    ell(g, 0.5, 0.55, 0.48, 0.42);
    g.fill();
    const r = new TRng(4242 + L * 11);
    const n = 6 + L * 3;
    const spikes: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = r.next() * TAU,
        d = Math.sqrt(r.next()) * 0.34;
      spikes.push([0.5 + Math.cos(a) * d, 0.58 + Math.sin(a) * d * 0.8, 0.12 + r.next() * (0.12 + L * 0.04)]);
    }
    spikes.sort((a, b) => a[1] - b[1]);
    for (const [x, y, h] of spikes) {
      const w = 0.035 + h * 0.15;
      g.fillStyle = 'rgba(30,60,110,0.25)';
      ell(g, x + 0.02, y + 0.01, w * 1.3, w * 0.5);
      g.fill();
      const lean = (x - 0.5) * 0.25;
      poly(g, [
        [x - w, y],
        [x + lean, y - h],
        [x, y + w * 0.3],
      ]);
      g.fillStyle = '#eefaff';
      g.fill();
      poly(g, [
        [x, y + w * 0.3],
        [x + lean, y - h],
        [x + w, y],
      ]);
      g.fillStyle = L >= 2 ? '#6aaee0' : '#8ccaf0';
      g.fill();
      poly(g, [
        [x - w, y],
        [x + lean, y - h],
        [x + w, y],
        [x, y + w * 0.3],
      ]);
      g.strokeStyle = 'rgba(25,60,115,0.85)';
      g.lineWidth = 0.01;
      g.stroke();
    }
  });
}

function icicles(c: C, b: Building, t: number) {
  c.drawImage(iciclesCanvas(c, b.level), b.x, b.y - 0.2, 1, 1.2);
  const cx = b.x + 0.5,
    cy = b.y + 0.52;
  // a cold glint hopping between spikes
  const p = (t * 0.8 + hash(b.uid)) % 1;
  glow(c, cx + Math.sin(t * 0.8 + b.uid) * 0.25, cy - 0.1, 0.1, '#ffffff', 0.5 * Math.sin(p * Math.PI));
  const f = Math.min(1, b.firing / 0.15);
  if (f > 0) {
    glow(c, cx, cy, 0.7, '#c8f0ff', 0.75 * f);
    c.strokeStyle = rgba('#ffffff', f);
    c.lineWidth = 0.02;
    c.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + b.uid;
      const r0 = 0.12 + (1 - f) * 0.2,
        r1 = r0 + 0.12;
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.75);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.75);
    }
    c.stroke();
  }
}

// ------------------------------------------------------------------ woodcutter's lodge (eco)

function logEnds(g: C, x: number, y: number, cols: number, rows: number, r: number) {
  for (let row = 0; row < rows; row++) {
    const n = cols - row;
    for (let i = 0; i < n; i++) {
      const lx = x + (i - (n - 1) / 2) * r * 2.05,
        ly = y - row * r * 1.75;
      circle(g, lx, ly, r);
      fo(g, '#d8a868', 0.01, TIMBER_D);
      g.strokeStyle = 'rgba(120,70,30,0.7)';
      g.lineWidth = 0.006;
      circle(g, lx, ly, r * 0.5);
      g.stroke();
    }
  }
}

function lodgeCanvas(c: C, L: number) {
  return cached(`lodge|${L}`, pxOf(c), -0.6, -0.95, 1.2, 1.45, (g) => {
    const s = 1 + L * 0.08;
    const w = 0.27 * s,
      wy = 0.2,
      wh = 0.24 * s,
      top = wy - wh;
    const gable = 0.2 * s,
      depth = 0.2;
    g.fillStyle = SHADOW;
    ell(g, 0.06, wy + 0.06, 0.48, 0.18);
    g.fill();
    // trampled snow yard
    ell(g, 0, wy + 0.05, 0.44, 0.17);
    g.fillStyle = 'rgba(190,205,225,0.8)';
    g.fill();
    if (L >= 2) {
      // lean-to shed with a big woodpile, on the left
      poly(g, [
        [-0.5, wy + 0.02],
        [-0.5, wy - 0.18],
        [-w, top + 0.02],
        [-w, wy + 0.02],
      ]);
      fo(g, TIMBER_D, 0.014);
      logEnds(g, -0.4, wy - 0.01, 3, 3, 0.03);
      poly(g, [
        [-0.53, wy - 0.17],
        [-w, top - 0.02],
        [-w, top - 0.07],
        [-0.55, wy - 0.23],
      ]);
      fo(g, SNOW, 0.012);
    }
    // back roof planes (seen above the gable)
    const ridgeY = top - gable;
    poly(g, [
      [-w - 0.04, top + 0.02],
      [0, ridgeY],
      [0, ridgeY - depth],
      [-w - 0.04, top + 0.02 - depth],
    ]);
    fo(g, vGrad(g, ridgeY - depth, top, '#ffffff', '#d4e2f2'), 0.016);
    poly(g, [
      [w + 0.04, top + 0.02],
      [0, ridgeY],
      [0, ridgeY - depth],
      [w + 0.04, top + 0.02 - depth],
    ]);
    fo(g, vGrad(g, ridgeY - depth, top, '#e8f0fa', '#b4c8e0'), 0.016);
    // stone chimney through the right roof plane
    const chx = w * 0.55,
      chy = top - gable * 0.5 - depth * 0.6;
    g.beginPath();
    g.rect(chx - 0.05, chy - 0.14, 0.1, 0.18);
    fo(g, hGrad(g, chx - 0.05, chx + 0.05, STONE), 0.014);
    g.strokeStyle = 'rgba(30,36,50,0.5)';
    g.lineWidth = 0.006;
    g.beginPath();
    g.moveTo(chx - 0.05, chy - 0.08);
    g.lineTo(chx + 0.05, chy - 0.08);
    g.moveTo(chx - 0.05, chy - 0.02);
    g.lineTo(chx + 0.05, chy - 0.02);
    g.stroke();
    g.fillStyle = SNOW;
    ell(g, chx, chy - 0.145, 0.06, 0.02);
    g.fill();
    // front wall and gable of stacked logs
    g.beginPath();
    g.moveTo(-w, wy);
    g.lineTo(-w, top);
    g.lineTo(0, ridgeY + 0.02);
    g.lineTo(w, top);
    g.lineTo(w, wy);
    g.closePath();
    g.fillStyle = TIMBER;
    g.fill();
    g.save();
    g.clip();
    const logH = 0.045;
    for (let y = wy; y > ridgeY - 0.02; y -= logH) {
      const lg = g.createLinearGradient(0, y - logH, 0, y);
      lg.addColorStop(0, TIMBER_L);
      lg.addColorStop(0.6, TIMBER);
      lg.addColorStop(1, TIMBER_D);
      g.fillStyle = lg;
      g.fillRect(-w - 0.1, y - logH, 2 * w + 0.2, logH);
    }
    g.restore();
    g.strokeStyle = OUT;
    g.lineWidth = 0.016;
    g.stroke();
    // round log ends at the corners
    for (const sx of [-1, 1]) {
      for (let y = wy - logH / 2; y > top; y -= logH) {
        circle(g, sx * w, y, logH * 0.55);
        fo(g, '#d8a868', 0.008, TIMBER_D);
      }
    }
    // snow on the front eaves, dripping
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(sx * (w + 0.05), top + 0.03);
      g.lineTo(0, ridgeY - 0.01);
      g.lineTo(0, ridgeY - 0.05);
      g.lineTo(sx * (w + 0.06), top - 0.02);
      g.closePath();
      fo(g, SNOW, 0.012);
    }
    // door
    g.beginPath();
    g.rect(-0.06 * s, wy - 0.15 * s, 0.12 * s, 0.15 * s);
    fo(g, '#3a2414', 0.012);
    g.strokeStyle = 'rgba(120,80,40,0.8)';
    g.lineWidth = 0.008;
    g.beginPath();
    g.moveTo(0, wy - 0.15 * s);
    g.lineTo(0, wy);
    g.stroke();
    // window frame (glow drawn live)
    g.beginPath();
    g.rect(w * 0.45, wy - 0.15 * s, 0.08, 0.07);
    fo(g, '#2a1a10', 0.012);
    if (L >= 1) {
      // antlers over the door
      g.strokeStyle = '#e8dcc0';
      g.lineWidth = 0.014;
      g.lineCap = 'round';
      g.beginPath();
      for (const sx of [-1, 1]) {
        g.moveTo(0, wy - 0.17 * s);
        g.quadraticCurveTo(sx * 0.06, wy - 0.18 * s, sx * 0.09, wy - 0.25 * s);
        g.moveTo(sx * 0.05, wy - 0.185 * s);
        g.lineTo(sx * 0.04, wy - 0.23 * s);
      }
      g.stroke();
    }
    // woodpile on the right and a stump with an axe on the left
    logEnds(g, w + 0.14, wy + 0.01, L >= 1 ? 3 : 2, L >= 1 ? 3 : 2, 0.028);
    ell(g, -w - 0.06, wy + 0.06, 0.06, 0.03);
    fo(g, '#b88a58', 0.01, TIMBER_D);
    g.beginPath();
    g.rect(-w - 0.12, wy + 0.06, 0.12, 0.04);
    g.fillStyle = TIMBER_D;
    g.fill();
    ell(g, -w - 0.06, wy + 0.06, 0.06, 0.03);
    fo(g, '#d8b080', 0.01, TIMBER_D);
    g.strokeStyle = TIMBER_D;
    g.lineWidth = 0.014;
    g.beginPath();
    g.moveTo(-w - 0.05, wy + 0.05);
    g.lineTo(-w + 0.02, wy - 0.06);
    g.stroke();
    poly(g, [
      [-w - 0.07, wy + 0.04],
      [-w - 0.03, wy + 0.08],
      [-w - 0.1, wy + 0.08],
    ]);
    fo(g, IRON_L, 0.008);
  });
}

function lodge(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const s = 1 + L * 0.08;
  c.drawImage(lodgeCanvas(c, L), cx - 0.6, cy - 0.95, 1.2, 1.45);
  const w = 0.27 * s,
    wy = cy + 0.2,
    top = wy - 0.24 * s;
  // flickering hearth-light in the window
  const fl = 0.8 + 0.2 * Math.sin(t * 9 + b.uid) * Math.sin(t * 5.3);
  c.fillStyle = mix('#ff9a3a', '#ffe0a0', fl - 0.6);
  c.fillRect(cx + w * 0.45 + 0.01, wy - 0.15 * s + 0.01, 0.06, 0.05);
  c.strokeStyle = '#2a1a10';
  c.lineWidth = 0.008;
  c.beginPath();
  c.moveTo(cx + w * 0.45 + 0.04, wy - 0.15 * s);
  c.lineTo(cx + w * 0.45 + 0.04, wy - 0.08 * s);
  c.stroke();
  glow(c, cx + w * 0.45 + 0.04, wy - 0.12 * s, 0.22, '#ffb050', 0.35 * fl);
  if (L >= 1) {
    // lantern by the door
    circle(c, cx - 0.1 * s, wy - 0.12 * s, 0.02);
    fo(c, '#ffd27a', 0.008, '#3a2414');
    glow(c, cx - 0.1 * s, wy - 0.12 * s, 0.15, '#ffc060', 0.4 * fl);
  }
  // chimney smoke
  const chx = cx + w * 0.55,
    chy = top - 0.2 * s * 0.5 - 0.2 * 0.6 - 0.15;
  for (let i = 0; i < 5; i++) {
    const p = (t * 0.35 + i / 5 + hash(b.uid) * 0.2) % 1;
    const x = chx + p * 0.18 + Math.sin(t * 1.3 + i * 2) * 0.03 * p;
    const y = chy - p * 0.55;
    c.fillStyle = rgba('#d8dee8', 0.5 * (1 - p) * Math.min(1, p * 6));
    circle(c, x, y, 0.03 + p * 0.07);
    c.fill();
  }
}

// ------------------------------------------------------------------ harpoon gun

function harpoonBase(c: C, L: number) {
  return cached(`harpbase|${L}`, pxOf(c), -0.5, -0.4, 1.0, 0.8, (g) => {
    // coiled rope tub at the back-left
    const rx = -0.26,
      ry = -0.1;
    ell(g, rx, ry + 0.03, 0.13, 0.07);
    fo(g, TIMBER_D, 0.012);
    for (let i = 0; i < 4; i++) {
      ell(g, rx, ry - i * 0.012, 0.11 - i * 0.02, 0.06 - i * 0.011);
      g.strokeStyle = i % 2 ? '#c8a870' : '#a88850';
      g.lineWidth = 0.02;
      g.stroke();
    }
    if (L >= 2) {
      const rx2 = 0.27;
      ell(g, rx2, ry + 0.03, 0.11, 0.06);
      fo(g, TIMBER_D, 0.012);
      for (let i = 0; i < 3; i++) {
        ell(g, rx2, ry - i * 0.012, 0.09 - i * 0.02, 0.05 - i * 0.011);
        g.strokeStyle = i % 2 ? '#c8a870' : '#a88850';
        g.lineWidth = 0.018;
        g.stroke();
      }
    }
    // timber turntable of planks
    ell(g, 0, 0.07, 0.27, 0.15);
    fo(g, TIMBER_D, 0.014);
    ell(g, 0, 0.04, 0.27, 0.15);
    g.fillStyle = hGrad(g, -0.27, 0.27, TIMBER);
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(40,24,10,0.55)';
    g.lineWidth = 0.008;
    g.beginPath();
    for (let x = -0.2; x <= 0.2; x += 0.08) {
      g.moveTo(x, -0.2);
      g.lineTo(x, 0.3);
    }
    g.stroke();
    g.restore();
    g.strokeStyle = OUT;
    g.lineWidth = 0.014;
    ell(g, 0, 0.04, 0.27, 0.15);
    g.stroke();
    if (L >= 1) {
      g.strokeStyle = IRON_L;
      g.lineWidth = 0.02;
      ell(g, 0, 0.04, 0.22, 0.12);
      g.stroke();
    }
  });
}

function harpoon(c: C, b: Building, cx: number, cy: number) {
  const L = b.level;
  c.drawImage(harpoonBase(c, L), cx - 0.5, cy - 0.4, 1.0, 0.8);
  const rate = b.def.levels[L].rate ?? 0.5;
  const loaded = b.cd < (1 / rate) * 0.6;
  // yoke post
  c.beginPath();
  c.rect(cx - 0.04, cy - 0.1, 0.08, 0.12);
  fo(c, hGrad(c, cx - 0.04, cx + 0.04, TIMBER_D), 0.012);
  c.save();
  c.translate(cx, cy - 0.12);
  c.rotate(b.angle);
  c.scale(1, 0.85);
  const rec = b.recoil * 0.08;
  c.translate(-rec, 0);
  const bl = 0.3 + L * 0.03,
    bw = 0.065 + L * 0.01;
  // stock and handles
  c.beginPath();
  c.rect(-0.26, -0.03, 0.14, 0.06);
  fo(c, TIMBER, 0.012);
  c.strokeStyle = TIMBER_D;
  c.lineWidth = 0.025;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-0.24, 0);
  c.lineTo(-0.3, -0.07);
  c.moveTo(-0.24, 0);
  c.lineTo(-0.3, 0.07);
  c.stroke();
  // iron barrel
  c.beginPath();
  c.rect(-0.14, -bw / 2, bl, bw);
  fo(c, vGrad(c, -bw / 2, bw / 2, IRON_L, IRON), 0.014);
  c.fillStyle = 'rgba(220,230,245,0.35)';
  c.fillRect(-0.12, -bw / 2 + 0.008, bl - 0.04, bw * 0.2);
  // bands & muzzle
  for (const x of L >= 1 ? [-0.08, 0.04, bl - 0.16] : [-0.06, bl - 0.16]) {
    c.beginPath();
    c.rect(x, -bw / 2 - 0.01, 0.025, bw + 0.02);
    fo(c, L >= 2 ? '#c89a40' : IRON, 0.008);
  }
  c.beginPath();
  c.rect(bl - 0.16, -bw / 2 - 0.014, 0.035, bw + 0.028);
  fo(c, IRON, 0.01);
  if (loaded) {
    // harpoon shaft & barbed head sticking out of the muzzle
    c.strokeStyle = '#c8a870';
    c.lineWidth = 0.018;
    c.beginPath();
    c.moveTo(bl - 0.14, 0);
    c.lineTo(bl + 0.05, 0);
    c.stroke();
    poly(c, [
      [bl + 0.03, -0.045],
      [bl + 0.16, 0],
      [bl + 0.03, 0.045],
      [bl + 0.07, 0],
    ]);
    fo(c, '#dfe8f2', 0.01);
  } else {
    // the line pays out from the muzzle
    c.strokeStyle = 'rgba(210,180,120,0.9)';
    c.lineWidth = 0.012;
    c.beginPath();
    c.moveTo(bl - 0.14, 0);
    c.quadraticCurveTo(bl + 0.1, 0.06, bl + 0.3, 0.02);
    c.stroke();
  }
  c.restore();
  if (b.recoil > 0) glow(c, cx + Math.cos(b.angle) * 0.35, cy - 0.12 + Math.sin(b.angle) * 0.3, 0.2, '#ffffff', b.recoil * 0.5);
}

// ------------------------------------------------------------------ fire brazier

function brazierBase(c: C, L: number) {
  return cached(`brazbase|${L}`, pxOf(c), -0.55, -0.4, 1.1, 0.85, (g) => {
    // snow melted into a dark wet ring by the heat
    const rg = g.createRadialGradient(0, 0.18, 0.02, 0, 0.18, 0.46);
    rg.addColorStop(0, 'rgba(60,52,50,0.85)');
    rg.addColorStop(0.55, 'rgba(90,96,110,0.6)');
    rg.addColorStop(1, 'rgba(120,140,170,0)');
    g.fillStyle = rg;
    ell(g, 0, 0.18, 0.46, 0.3);
    g.fill();
    if (L >= 1) {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + 0.3;
        rock(g, Math.cos(a) * 0.3, 0.18 + Math.sin(a) * 0.19, 0.055, i * 2.1 + 5, false);
      }
    }
  });
}

function brazier(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(brazierBase(c, L), cx - 0.55, cy - 0.4, 1.1, 0.85);
  const ph = b.spin + b.uid;
  const by = cy - 0.18 - L * 0.04;
  const bw = 0.17 + L * 0.03;
  // tripod legs
  c.strokeStyle = OUT;
  c.lineWidth = 0.04;
  c.lineCap = 'round';
  const legs: [number, number][] = [
    [-0.2, cy + 0.2],
    [0.2, cy + 0.2],
    [0.02, cy + 0.28],
  ];
  c.beginPath();
  for (const [x, y] of legs) {
    c.moveTo(cx + x * 0.2, by + 0.05);
    c.lineTo(cx + x, y);
  }
  c.stroke();
  c.strokeStyle = IRON_L;
  c.lineWidth = 0.02;
  c.stroke();
  // basket: back rim, coals, flame, front bands
  ell(c, cx, by, bw, bw * 0.38);
  fo(c, '#20160f', 0.016);
  // glowing coals
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const pulse = 0.6 + 0.4 * Math.sin(t * 4 + i * 1.7 + ph);
    c.fillStyle = mix('#c83a10', '#ffb040', pulse);
    circle(c, cx + Math.cos(a) * bw * 0.55, by + Math.sin(a) * bw * 0.2, 0.03);
    c.fill();
  }
  glow(c, cx, by - 0.25, 0.75 + L * 0.1, '#ff9a3a', 0.35 + 0.05 * Math.sin(t * 8 + ph));
  // heat shimmer above
  c.strokeStyle = 'rgba(255,220,180,0.18)';
  c.lineWidth = 0.014;
  c.beginPath();
  for (let k = -1; k <= 1; k++) {
    const x0 = cx + k * 0.08;
    for (let i = 0; i <= 8; i++) {
      const y = by - 0.4 - L * 0.06 - i * 0.04;
      const x = x0 + Math.sin(t * 5 + i * 0.9 + k * 2) * 0.02;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
  }
  c.stroke();
  flame(c, cx, by, bw * 0.75, 0.36 + L * 0.06, t, ph);
  if (L >= 2) {
    flame(c, cx - bw * 0.55, by + 0.01, bw * 0.3, 0.16, t * 1.1, ph + 2);
    flame(c, cx + bw * 0.55, by + 0.01, bw * 0.3, 0.16, t * 1.2, ph + 4);
  }
  // front half of the basket: iron bowl with bands
  c.beginPath();
  c.ellipse(cx, by, bw, bw * 0.38, 0, 0, Math.PI);
  c.lineTo(cx - bw * 0.65, by + bw * 0.55);
  c.ellipse(cx, by + bw * 0.55, bw * 0.65, bw * 0.2, 0, Math.PI, 0, true);
  c.closePath();
  fo(c, vGrad(c, by, by + bw * 0.7, IRON_L, '#1c2028'), 0.016);
  c.strokeStyle = 'rgba(255,160,80,0.5)';
  c.lineWidth = 0.012;
  c.beginPath();
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * bw * 0.36;
    c.moveTo(x, by + bw * 0.36 * Math.sqrt(Math.max(0, 1 - (i * 0.36) ** 2)));
    c.lineTo(cx + i * bw * 0.24, by + bw * 0.7);
  }
  c.stroke();
  c.strokeStyle = IRON;
  c.lineWidth = 0.022;
  c.beginPath();
  c.ellipse(cx, by, bw, bw * 0.38, 0, 0, Math.PI);
  c.stroke();
  if (L >= 2) {
    // spiked crown on the rim
    c.fillStyle = IRON_L;
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * Math.PI;
      const x = cx + Math.cos(a) * bw,
        y = by + Math.sin(a) * bw * 0.38;
      poly(c, [
        [x - 0.015, y],
        [x, y - 0.07],
        [x + 0.015, y],
      ]);
      c.fill();
    }
  }
  embers(c, cx, by - 0.15, 6 + L * 2, bw * 1.6, 0.7 + L * 0.1, t * (1 + (b.firing > 0 ? 0.5 : 0)), b.uid);
}

// ------------------------------------------------------------------ avalanche ledge

function ledgeCanvas(c: C, L: number) {
  return cached(`ledge|${L}`, pxOf(c), -0.55, -0.85, 1.1, 1.3, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.05, 0.3, 0.46, 0.17);
    g.fill();
    const top = -0.36 - L * 0.06;
    // jagged outcrop: a front face and a flat shelf on top
    const face: [number, number][] = [
      [-0.42, 0.3],
      [-0.44, 0.05],
      [-0.36, top + 0.04],
      [-0.12, top],
      [0.18, top - 0.02],
      [0.38, top + 0.05],
      [0.44, 0.0],
      [0.4, 0.3],
    ];
    facet(g, face, -0.05, top + 0.1, STONE, 0.4, OUT, 0.018);
    // strata and cracks
    g.strokeStyle = 'rgba(30,36,52,0.55)';
    g.lineWidth = 0.01;
    g.beginPath();
    g.moveTo(-0.4, -0.05);
    g.lineTo(-0.1, 0.0);
    g.lineTo(0.15, -0.06);
    g.lineTo(0.42, -0.02);
    g.moveTo(-0.38, 0.14);
    g.lineTo(0.05, 0.18);
    g.lineTo(0.4, 0.12);
    g.moveTo(-0.1, top + 0.05);
    g.lineTo(-0.05, -0.1);
    g.moveTo(0.22, top + 0.03);
    g.lineTo(0.25, -0.15);
    g.stroke();
    // shelf
    poly(g, [
      [-0.36, top + 0.04],
      [-0.3, top - 0.1],
      [0.1, top - 0.14],
      [0.36, top - 0.06],
      [0.38, top + 0.05],
      [0.18, top - 0.02],
      [-0.12, top],
    ]);
    fo(g, shade(STONE_L, 0.05), 0.016);
    // snow lying on the foot of the rock
    for (const [x, y, r] of [
      [-0.3, 0.28, 0.12],
      [0.25, 0.29, 0.13],
      [0.0, 0.31, 0.1],
    ]) {
      ell(g, x, y, r, r * 0.35);
      g.fillStyle = SNOW;
      g.fill();
    }
    if (L >= 1) {
      // timber bracing holding the shelf
      g.strokeStyle = TIMBER_D;
      g.lineWidth = 0.035;
      g.beginPath();
      g.moveTo(-0.3, top + 0.1);
      g.lineTo(-0.18, 0.2);
      g.moveTo(0.3, top + 0.1);
      g.lineTo(0.2, 0.2);
      g.stroke();
      g.strokeStyle = TIMBER_L;
      g.lineWidth = 0.016;
      g.stroke();
    }
    if (L >= 2) {
      g.strokeStyle = IRON;
      g.lineWidth = 0.02;
      g.beginPath();
      g.moveTo(-0.35, top + 0.06);
      g.lineTo(0.36, top + 0.07);
      g.stroke();
    }
  });
}

/** The snow cornice on the shelf; k = 0..1 size. */
function cornice(c: C, x: number, y: number, k: number, t: number, seed: number) {
  if (k <= 0.02) return;
  const w = 0.12 + 0.34 * k,
    h = 0.04 + 0.42 * k;
  const over = Math.max(0, k - 0.45) * 0.28; // overhang toward the viewer
  const n = 9;
  c.beginPath();
  c.moveTo(x - w, y);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const r = 1 + 0.12 * (hash(seed + i) - 0.5);
    c.lineTo(x + Math.cos(a) * w * r, y - 0.02 + Math.sin(a) * h * r);
  }
  // overhanging lip curling down the front
  c.quadraticCurveTo(x + w * 1.05, y + over * 0.5, x + w * 0.7, y + over);
  for (let i = 0; i < 4; i++) {
    const xx = x + w * 0.7 - ((i + 1) / 4) * w * 1.5;
    c.quadraticCurveTo(xx + w * 0.18, y + over + 0.04 + 0.02 * Math.sin(i * 2 + seed), xx, y + over * (0.8 + 0.2 * (i % 2)));
  }
  c.quadraticCurveTo(x - w * 1.05, y + over * 0.3, x - w, y);
  c.closePath();
  const g = c.createLinearGradient(x - w, y - h, x + w * 0.5, y + over);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#e6f0fb');
  g.addColorStop(1, '#a8c0de');
  fo(c, g, 0.018, 'rgba(50,80,130,0.8)');
  // wind-carved layers
  c.strokeStyle = 'rgba(140,170,210,0.6)';
  c.lineWidth = 0.01;
  c.beginPath();
  c.ellipse(x, y - 0.02, w * 0.7, h * 0.55, 0, Math.PI * 1.1, Math.PI * 1.85);
  c.ellipse(x, y - 0.02, w * 0.45, h * 0.3, 0, Math.PI * 1.15, Math.PI * 1.8);
  c.stroke();
  void t;
}

function avalanche(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(ledgeCanvas(c, L), cx - 0.55, cy - 0.85, 1.1, 1.3);
  const top = cy - 0.36 - L * 0.06 - 0.06;
  const prime = Math.max(0, Math.min(1, b.prime ?? 0));
  const ready = prime >= 1;
  const k = b.firing > 0 ? prime * 0.3 : prime;
  if (ready) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + b.uid);
    glow(c, cx, top - 0.2, 0.75, '#dff4ff', 0.35 + 0.3 * pulse);
  }
  cornice(c, cx, top, k * (1 + L * 0.06), t, b.uid % 7);
  if (ready) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + b.uid);
    // stress cracks across the cornice
    c.strokeStyle = 'rgba(40,90,160,0.85)';
    c.lineWidth = 0.014;
    c.beginPath();
    c.moveTo(cx - 0.3, top - 0.12);
    c.lineTo(cx - 0.15, top - 0.08);
    c.lineTo(cx - 0.05, top - 0.14);
    c.lineTo(cx + 0.12, top - 0.07);
    c.lineTo(cx + 0.3, top - 0.12);
    c.stroke();
    // trickling snow off the lip
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.3 + i / 6 + hash(b.uid + i)) % 1;
      const x = cx - 0.3 + hash(i * 7 + b.uid) * 0.6;
      const y = top + 0.14 + p * 0.45;
      c.fillStyle = rgba('#ffffff', 0.9 * (1 - p));
      circle(c, x, y, 0.014 + (1 - p) * 0.012);
      c.fill();
    }
    // twinkling star: tap me!
    const sy = top - 0.62 - Math.sin(t * 3) * 0.03;
    const sr = 0.07 + pulse * 0.04;
    glow(c, cx, sy, 0.25, '#ffffff', 0.6 + 0.3 * pulse);
    c.fillStyle = '#ffffff';
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + t * 0.8;
      const r = i % 2 ? sr * 0.3 : sr;
      i ? c.lineTo(cx + Math.cos(a) * r, sy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
  } else if (prime > 0.05 && b.firing <= 0) {
    // gathering: a few flakes settling onto the shelf
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.5 + i / 3 + hash(b.uid * 3 + i)) % 1;
      c.fillStyle = rgba('#ffffff', 0.8 * Math.sin(p * Math.PI));
      circle(c, cx - 0.25 + hash(i + b.uid) * 0.5 + Math.sin(t + i) * 0.04, top - 0.55 + p * 0.45, 0.014);
      c.fill();
    }
  }
  if (b.firing > 0) {
    // the avalanche pouring off the ledge
    const f = Math.min(1, b.firing);
    for (let i = 0; i < 10; i++) {
      const p = (t * 2.5 + i / 10) % 1;
      const x = cx - 0.32 + (i / 9) * 0.64 + Math.sin(i * 3.1) * 0.04;
      const y = top + p * 0.75;
      c.fillStyle = rgba(i % 2 ? '#ffffff' : '#dce8f6', 0.9 * f);
      circle(c, x, y, 0.05 + p * 0.06);
      c.fill();
    }
    c.fillStyle = rgba('#f4f8ff', 0.7 * f);
    ell(c, cx, cy + 0.3, 0.5 + (1 - f) * 0.3, 0.16);
    c.fill();
  }
}

// ------------------------------------------------------------------ snow cannon

function sledCanvas(c: C, L: number) {
  return cached(`sled|${L}`, pxOf(c), -0.5, -0.35, 1.0, 0.8, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.04, 0.2, 0.42, 0.14);
    g.fill();
    // two runners curling up at the front
    for (const y of [0.0, 0.2]) {
      g.strokeStyle = OUT;
      g.lineWidth = 0.04;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-0.36, y);
      g.lineTo(0.28, y);
      g.quadraticCurveTo(0.42, y, 0.4, y - 0.1);
      g.stroke();
      g.strokeStyle = L >= 1 ? IRON_L : TIMBER_L;
      g.lineWidth = 0.022;
      g.stroke();
    }
    // deck
    g.beginPath();
    g.rect(-0.3, -0.06, 0.56, 0.22);
    fo(g, hGrad(g, -0.3, 0.26, TIMBER), 0.014);
    g.strokeStyle = 'rgba(40,24,10,0.5)';
    g.lineWidth = 0.008;
    g.beginPath();
    for (let y = -0.01; y < 0.16; y += 0.055) {
      g.moveTo(-0.3, y);
      g.lineTo(0.26, y);
    }
    g.stroke();
    // a spare snowball or two
    for (const [x, y] of L >= 2 ? [[-0.23, 0.12], [-0.13, 0.13]] : [[-0.22, 0.12]]) {
      circle(g, x, y, 0.05);
      fo(g, vGrad(g, y - 0.05, y + 0.05, '#ffffff', '#b8cce4'), 0.01, 'rgba(40,70,120,0.75)');
    }
    // trunnion block
    g.beginPath();
    g.rect(-0.08, -0.12, 0.16, 0.14);
    fo(g, hGrad(g, -0.08, 0.08, TIMBER_D), 0.014);
  });
}

function snowcannon(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(sledCanvas(c, L), cx - 0.5, cy - 0.35, 1.0, 0.8);
  const rate = b.def.levels[L].rate ?? 0.4;
  const loaded = b.cd < (1 / rate) * 0.7;
  c.save();
  c.translate(cx, cy - 0.16);
  c.rotate(b.angle);
  c.scale(1, 0.85);
  c.translate(-b.recoil * 0.07, 0);
  const len = 0.36 + L * 0.03,
    r = 0.1 + L * 0.012;
  // breech knob
  circle(c, -0.16, 0, r * 0.7);
  fo(c, IRON, 0.014);
  // fat barrel flaring to a wide muzzle
  c.beginPath();
  c.moveTo(-0.16, -r);
  c.lineTo(len - 0.06, -r * 1.05);
  c.lineTo(len, -r * 1.3);
  c.lineTo(len, r * 1.3);
  c.lineTo(len - 0.06, r * 1.05);
  c.lineTo(-0.16, r);
  c.closePath();
  fo(c, vGrad(c, -r, r, IRON_L, '#1e222a'), 0.016);
  c.fillStyle = 'rgba(220,235,255,0.3)';
  c.fillRect(-0.12, -r * 0.8, len - 0.1, r * 0.3);
  for (const x of [0.0, len * 0.5]) {
    c.beginPath();
    c.rect(x, -r * 1.12, 0.03, r * 2.24);
    fo(c, L >= 2 ? '#7ab8e0' : IRON, 0.008);
  }
  // frost rime on the barrel
  c.strokeStyle = 'rgba(230,248,255,0.7)';
  c.lineWidth = 0.012;
  c.beginPath();
  c.moveTo(len - 0.02, -r * 1.25);
  c.lineTo(len - 0.12, -r * 1.0);
  c.moveTo(0.08, -r);
  c.lineTo(0.16, -r * 0.7);
  c.stroke();
  if (loaded) {
    // the giant snowball bulging from the muzzle
    circle(c, len + 0.02, 0, r * 1.15);
    fo(c, vGrad(c, -r, r, '#ffffff', '#b8cce4'), 0.014, 'rgba(40,70,120,0.85)');
    c.fillStyle = 'rgba(255,255,255,0.9)';
    ell(c, len - 0.01, -r * 0.45, r * 0.4, r * 0.2);
    c.fill();
  } else {
    ell(c, len, 0, 0.03, r * 1.2);
    c.fillStyle = '#0e1016';
    c.fill();
  }
  c.restore();
  if (b.recoil > 0) {
    // puff of snow at the muzzle
    const mx = cx + Math.cos(b.angle) * (len + 0.1),
      my = cy - 0.16 + Math.sin(b.angle) * (len + 0.1) * 0.85;
    for (let i = 0; i < 5; i++) {
      const a = b.angle + (i - 2) * 0.5;
      const d = (1 - b.recoil) * 0.15;
      c.fillStyle = rgba('#f4faff', b.recoil * 0.9);
      circle(c, mx + Math.cos(a) * d, my + Math.sin(a) * d * 0.8, 0.05 + (1 - b.recoil) * 0.05);
      c.fill();
    }
  }
  void t;
}

// ------------------------------------------------------------------ aurora spire

function spireCanvas(c: C, L: number) {
  return cached(`spire|${L}`, pxOf(c), -0.5, -1.6, 1.0, 1.95, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.05, 0.18, 0.36, 0.12);
    g.fill();
    // stone socket
    rock(g, -0.18, 0.12, 0.12, 3.1);
    rock(g, 0.2, 0.13, 0.11, 7.7);
    ell(g, 0, 0.1, 0.2, 0.08);
    fo(g, STONE_D, 0.014);
    // small side crystals
    const small: [number, number, number, number][] = [
      [-0.13, 0.12, 0.2, -0.35],
      [0.14, 0.13, 0.16, 0.4],
    ];
    if (L >= 1) small.push([-0.22, 0.17, 0.14, -0.6], [0.24, 0.18, 0.12, 0.65]);
    if (L >= 2) small.push([0.05, 0.2, 0.15, 0.15], [-0.06, 0.21, 0.12, -0.2]);
    const crystal = (x: number, y: number, h: number, w: number, lean: number) => {
      const tx = x + lean * h,
        ty = y - h;
      poly(g, [
        [x - w, y],
        [x - w * 0.9 + lean * h * 0.85, y - h * 0.82],
        [tx, ty],
        [x + lean * h * 0.85, y - h * 0.84],
        [x, y + w * 0.3],
      ]);
      g.fillStyle = '#e6fff8';
      g.fill();
      poly(g, [
        [x, y + w * 0.3],
        [x + lean * h * 0.85, y - h * 0.84],
        [tx, ty],
        [x + w * 0.9 + lean * h * 0.85, y - h * 0.82],
        [x + w, y],
      ]);
      g.fillStyle = '#7ad8c8';
      g.fill();
      poly(g, [
        [x - w, y],
        [x - w * 0.9 + lean * h * 0.85, y - h * 0.82],
        [tx, ty],
        [x + w * 0.9 + lean * h * 0.85, y - h * 0.82],
        [x + w, y],
        [x, y + w * 0.3],
      ]);
      g.strokeStyle = 'rgba(20,60,70,0.85)';
      g.lineWidth = 0.012;
      g.stroke();
    };
    // the slender main spire
    const H = 1.1 + L * 0.14;
    crystal(0, 0.1, H, 0.075 + L * 0.008, 0);
    for (const [x, y, h, lean] of small) crystal(x, y, h, 0.035, lean * 0.4);
    // snow drift around the socket
    ell(g, -0.05, 0.2, 0.2, 0.05);
    g.fillStyle = SNOW;
    g.fill();
  });
}

function ribbon(c: C, cx: number, y: number, r: number, h: number, t: number, ph: number, col: string, front: boolean) {
  const n = 22;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ph + t * 0.9 + (i / n) * TAU * 0.9;
    const s = Math.sin(a);
    if (front !== s > 0) {
      if (pts.length) break;
      continue;
    }
    const wav = Math.sin(a * 2 + t * 2.4 + ph) * 0.05;
    pts.push([cx + Math.cos(a) * r, y + s * r * 0.35 + wav, 0.7 + 0.3 * Math.sin(a * 3 + t * 3)]);
  }
  if (pts.length < 2) return;
  const g = c.createLinearGradient(0, y + r * 0.35, 0, y - h - r * 0.35);
  g.addColorStop(0, rgba(col, front ? 0.8 : 0.45));
  g.addColorStop(0.4, rgba(col, front ? 0.4 : 0.22));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.beginPath();
  pts.forEach(([x, yy], i) => (i ? c.lineTo(x, yy) : c.moveTo(x, yy)));
  for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] - h * pts[i][2]);
  c.closePath();
  c.fill();
  c.strokeStyle = rgba(mix(col, '#ffffff', 0.5), front ? 0.9 : 0.5);
  c.lineWidth = 0.014;
  c.beginPath();
  pts.forEach(([x, yy], i) => (i ? c.lineTo(x, yy) : c.moveTo(x, yy)));
  c.stroke();
}

function aurora(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const H = 1.1 + L * 0.14;
  const tipY = cy + 0.1 - H;
  const cols = [AUR_T, AUR_V, AUR_G];
  const nR = 2 + L;
  const rib = (front: boolean) => {
    for (let i = 0; i < nR; i++) {
      const y = tipY + 0.22 + i * 0.12;
      ribbon(c, cx, y, 0.22 + i * 0.05 + Math.sin(t + i) * 0.02, 0.22 + 0.05 * Math.sin(t * 1.7 + i), t, i * 2.1 + b.uid, cols[i % 3], front);
    }
  };
  const on = b.firing > 0 ? 1 : 0;
  glow(c, cx, tipY + 0.3, 0.8, AUR_T, 0.2 + on * 0.2 + 0.05 * Math.sin(t * 2));
  rib(false);
  c.drawImage(spireCanvas(c, L), cx - 0.5, cy - 1.6, 1.0, 1.95);
  // inner light running up the crystal
  const p = (t * 0.6 + hash(b.uid)) % 1;
  glow(c, cx, cy + 0.05 - p * H, 0.12, '#e8fff8', 0.7 * Math.sin(p * Math.PI));
  rib(true);
  glow(c, cx, tipY, 0.2 + on * 0.1, '#ffffff', 0.55 + on * 0.35);
}

// ------------------------------------------------------------------ mammoth pen

function penCanvas(c: C, L: number, front: boolean) {
  return cached(`pen|${L}|${front ? 1 : 0}`, pxOf(c), -0.55, -0.6, 1.1, 1.05, (g) => {
    const x0 = -0.42,
      x1 = 0.42,
      y0 = -0.2,
      y1 = 0.3;
    const ph = 0.16 + L * 0.03;
    const post = (x: number, y: number, h: number) => {
      g.beginPath();
      g.rect(x - 0.025, y - h, 0.05, h);
      fo(g, hGrad(g, x - 0.025, x + 0.025, TIMBER), 0.01);
      if (L >= 2) {
        poly(g, [
          [x - 0.03, y - h],
          [x, y - h - 0.05],
          [x + 0.03, y - h],
        ]);
        fo(g, TIMBER_L, 0.008);
      } else {
        g.fillStyle = SNOW;
        ell(g, x, y - h, 0.03, 0.012);
        g.fill();
      }
    };
    const rails = (xa: number, ya: number, xb: number, yb: number) => {
      for (const k of [0.4, 0.8]) {
        g.strokeStyle = OUT;
        g.lineWidth = 0.032;
        g.beginPath();
        g.moveTo(xa, ya - ph * k);
        g.lineTo(xb, yb - ph * k);
        g.stroke();
        g.strokeStyle = TIMBER_L;
        g.lineWidth = 0.018;
        g.stroke();
      }
    };
    if (!front) {
      g.fillStyle = SHADOW;
      g.fillRect(x0 + 0.05, y0 + 0.04, x1 - x0, y1 - y0 + 0.04);
      // trodden snow and straw
      g.fillStyle = '#bccbe0';
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = 'rgba(200,170,90,0.75)';
      g.lineWidth = 0.008;
      const r = new TRng(77 + L);
      g.beginPath();
      for (let i = 0; i < 40; i++) {
        const x = x0 + 0.04 + r.next() * (x1 - x0 - 0.08),
          y = y0 + 0.04 + r.next() * (y1 - y0 - 0.08);
        const a = r.next() * Math.PI;
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.025);
      }
      g.stroke();
      // hay bale in the back corner
      g.beginPath();
      g.roundRect(x0 + 0.04, y0 - 0.02, 0.16, 0.1, 0.02);
      fo(g, '#d8b860', 0.01, '#6a5020');
      // back and side fences
      rails(x0, y0, x1, y0);
      for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 4) post(x, y0, ph);
      rails(x0, y0, x0, y1);
      rails(x1, y0, x1, y1);
      post(x0, (y0 + y1) / 2, ph);
      post(x1, (y0 + y1) / 2, ph);
      if (L >= 1) {
        // banner pole in the back corner
        g.strokeStyle = TIMBER_D;
        g.lineWidth = 0.025;
        g.beginPath();
        g.moveTo(x1, y0 - ph);
        g.lineTo(x1, y0 - ph - 0.35);
        g.stroke();
        poly(g, [
          [x1, y0 - ph - 0.35],
          [x1 - 0.2, y0 - ph - 0.3],
          [x1 - 0.12, y0 - ph - 0.25],
          [x1 - 0.2, y0 - ph - 0.2],
          [x1, y0 - ph - 0.2],
        ]);
        fo(g, EMBER, 0.01);
      }
    } else {
      // front fence with a gap for the gate on the right
      const gx = x1 - 0.22;
      rails(x0, y1, gx, y1);
      for (let x = x0; x < gx + 0.001; x += (gx - x0) / 3) post(x, y1, ph);
      post(x1, y1, ph);
      if (L >= 1) {
        // round shields hung on the fence
        for (const [x, col] of [
          [x0 + 0.1, '#b8322e'],
          [x0 + 0.33, '#2e5a9a'],
        ] as const) {
          circle(g, x, y1 - ph * 0.6, 0.055);
          fo(g, col, 0.012);
          circle(g, x, y1 - ph * 0.6, 0.018);
          fo(g, IRON_L, 0.008);
        }
      }
    }
  });
}

function mammothPen(c: C, b: Building, cx: number, cy: number, t: number, game: Game) {
  const L = b.level;
  const out = b.firing > 0 || (game.allies?.some((a) => a.kind === 'mammoth' && a.src === b.uid) ?? false);
  c.drawImage(penCanvas(c, L, false), cx - 0.55, cy - 0.6, 1.1, 1.05);
  const gx0 = cx + 0.2,
    gy = cy + 0.3,
    ph = 0.16 + L * 0.03;
  if (!out) {
    c.save();
    c.translate(cx - 0.04, cy + 0.07);
    const sc = 0.2 + L * 0.015;
    c.scale(sc, sc);
    c.rotate(Math.sin(t * 1.2 + b.uid) * 0.02);
    mammothSide(c, t, Math.sin(t * 0.8 + b.uid) * 0.6, 0.12, L >= 2);
    c.restore();
  } else {
    // hoofprints leading out of the open gate
    c.fillStyle = 'rgba(70,90,130,0.45)';
    for (let i = 0; i < 4; i++) {
      ell(c, cx + 0.05 + i * 0.07, cy + 0.12 + i * 0.07, 0.025, 0.014);
      c.fill();
    }
  }
  c.drawImage(penCanvas(c, L, true), cx - 0.55, cy - 0.6, 1.1, 1.05);
  // the gate: closed across the gap, or swung wide open
  const open = out ? 1 : 0;
  const ang = open * 1.25;
  const gl = 0.22;
  const ex = gx0 + Math.cos(ang) * gl,
    ey = gy + Math.sin(ang) * gl * 0.6;
  for (const k of [0.35, 0.75]) {
    c.strokeStyle = OUT;
    c.lineWidth = 0.034;
    c.beginPath();
    c.moveTo(gx0, gy - ph * k);
    c.lineTo(ex, ey - ph * k);
    c.stroke();
    c.strokeStyle = TIMBER_L;
    c.lineWidth = 0.02;
    c.stroke();
  }
  c.strokeStyle = TIMBER_D;
  c.lineWidth = 0.018;
  c.beginPath();
  c.moveTo(gx0, gy - ph * 0.35);
  c.lineTo(ex, ey - ph * 0.75);
  c.stroke();
}

// ------------------------------------------------------------------ Winter's Heart

function heartPlinth(c: C, L: number) {
  return cached(`wheart|${L}`, pxOf(c), -0.6, -0.5, 1.2, 1.0, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.05, 0.22, 0.52, 0.2);
    g.fill();
    // frost spreading on the ground
    const rg = g.createRadialGradient(0, 0.15, 0.05, 0, 0.15, 0.55);
    rg.addColorStop(0, 'rgba(170,225,255,0.6)');
    rg.addColorStop(1, 'rgba(170,225,255,0)');
    g.fillStyle = rg;
    ell(g, 0, 0.15, 0.55, 0.35);
    g.fill();
    // two stepped hexagonal tiers of dark frozen stone
    const tier = (y: number, r: number, h: number, col: string) => {
      const top: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        top.push([Math.cos(a) * r, y + Math.sin(a) * r * 0.42]);
      }
      // side faces (the front three)
      for (let i = 0; i < 6; i++) {
        const [x1, y1] = top[i],
          [x2, y2] = top[(i + 1) % 6];
        if ((y1 + y2) / 2 < y) continue;
        poly(g, [
          [x1, y1],
          [x2, y2],
          [x2, y2 + h],
          [x1, y1 + h],
        ]);
        fo(g, shade(col, x1 + x2 < 0 ? -0.05 : -0.3), 0.014);
      }
      facet(g, top, -0.05, y - 0.03, shade(col, 0.15), 0.25, OUT, 0.016);
      g.fillStyle = SNOW;
      ell(g, top[3][0] * 0.7, top[3][1] + 0.01, 0.07, 0.02);
      g.fill();
    };
    tier(0.12, 0.44, 0.1, '#3e4c66');
    tier(0.0, 0.3, 0.1, '#4a5a78');
    // glowing frost grooves on the top slab
    g.strokeStyle = 'rgba(160,235,255,0.85)';
    g.lineWidth = 0.014;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.PI / 6;
      g.moveTo(Math.cos(a) * 0.08, Math.sin(a) * 0.08 * 0.42);
      g.lineTo(Math.cos(a) * 0.24, Math.sin(a) * 0.24 * 0.42);
    }
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0, 0.12, 0.05, 0, 0, TAU);
    g.stroke();
    // ice crystals jutting at the corners of the lower tier
    const n = L >= 2 ? 6 : L >= 1 ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.5;
      const x = Math.cos(a) * 0.42,
        y = 0.12 + Math.sin(a) * 0.42 * 0.42;
      const h = 0.14 + hash(i + L * 5) * 0.1;
      poly(g, [
        [x - 0.035, y],
        [x + 0.01, y - h],
        [x + 0.04, y],
      ]);
      fo(g, Math.cos(a) < 0 ? '#e0f6ff' : '#7ab8e8', 0.01, 'rgba(20,50,100,0.85)');
    }
  });
}

function heartCrystal(c: C, x: number, y: number, R: number, H: number, spin: number, flash: number) {
  const n = 6;
  const tilt = 0.32;
  const eq: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * TAU;
    eq.push([x + Math.cos(a) * R, y + Math.sin(a) * R * tilt, a]);
  }
  const top: [number, number] = [x, y - H],
    bot: [number, number] = [x, y + H * 0.7];
  const faces: { pts: [number, number][]; depth: number; lit: number; up: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const p = eq[i],
      q = eq[(i + 1) % n];
    const am = p[2] + Math.PI / n;
    const depth = Math.sin(am);
    const lit = Math.cos(am - Math.PI * 0.85); // light from the upper-left
    faces.push({ pts: [top, [p[0], p[1]], [q[0], q[1]]], depth, lit, up: true });
    faces.push({ pts: [bot, [p[0], p[1]], [q[0], q[1]]], depth, lit, up: false });
  }
  faces.sort((a, b) => a.depth - b.depth);
  for (const f of faces) {
    const k = f.lit * 0.5 + (f.up ? 0.15 : -0.2);
    const col = k >= 0 ? mix('#3a7ad8', '#d8f6ff', k) : mix('#3a7ad8', '#0c2050', -k);
    poly(c, f.pts);
    c.fillStyle = f.depth < 0 ? rgba(col, 0.75) : col;
    c.fill();
    c.strokeStyle = f.depth < 0 ? 'rgba(120,200,255,0.35)' : 'rgba(200,245,255,0.6)';
    c.lineWidth = 0.008;
    c.stroke();
  }
  // outline of the silhouette
  c.strokeStyle = 'rgba(10,26,70,0.85)';
  c.lineWidth = 0.014;
  const left = eq.reduce((m, p) => (p[0] < m[0] ? p : m)),
    right = eq.reduce((m, p) => (p[0] > m[0] ? p : m));
  poly(c, [top, [right[0], right[1]], bot, [left[0], left[1]]]);
  c.stroke();
  if (flash > 0) {
    poly(c, [top, [right[0], right[1]], bot, [left[0], left[1]]]);
    c.fillStyle = rgba('#ffffff', flash * 0.7);
    c.fill();
  }
}

function winterheart(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(heartPlinth(c, L), cx - 0.6, cy - 0.5, 1.2, 1.0);
  const f = Math.max(0, Math.min(1, b.firing / 1.2));
  const bob = Math.sin(t * 1.3 + b.uid) * 0.04;
  const y = cy - 0.75 - L * 0.07 + bob;
  const R = 0.27 + L * 0.03,
    H = 0.52 + L * 0.05;
  // the cold beam between plinth and crystal
  const bg = c.createLinearGradient(0, y + H * 0.7, 0, cy);
  bg.addColorStop(0, rgba('#bff0ff', 0.6));
  bg.addColorStop(1, rgba('#bff0ff', 0.05));
  c.fillStyle = bg;
  c.fillRect(cx - 0.04, y + H * 0.6, 0.08, cy - y - H * 0.6);
  glow(c, cx, y, 0.95 + f * 0.5, '#7ad8ff', 0.3 + f * 0.4 + 0.05 * Math.sin(t * 2));
  const spin = b.spin * 0.6 + b.uid;
  // orbiting shards (behind first, then in front)
  const shards = 3 + L;
  const shard = (i: number, front: boolean) => {
    const a = spin * 1.6 + (i / shards) * TAU;
    if (front !== Math.sin(a) > 0) return;
    const sx = cx + Math.cos(a) * (R + 0.22),
      sy = y + 0.1 + Math.sin(a) * (R + 0.22) * 0.35;
    poly(c, [
      [sx, sy - 0.07],
      [sx + 0.03, sy],
      [sx, sy + 0.05],
      [sx - 0.03, sy],
    ]);
    fo(c, front ? '#d8f6ff' : '#6aa8e0', 0.008, 'rgba(10,30,80,0.8)');
  };
  for (let i = 0; i < shards; i++) shard(i, false);
  heartCrystal(c, cx, y, R, H, spin, f);
  for (let i = 0; i < shards; i++) shard(i, true);
  // heart-light pulsing inside
  glow(c, cx, y, 0.18, '#ffffff', 0.45 + 0.25 * Math.sin(t * 2.2 + b.uid));
  if (f > 0) {
    // freezing shockwave rolling out from the plinth
    const k = 1 - f;
    c.strokeStyle = rgba('#e8fbff', f);
    c.lineWidth = 0.04 * f + 0.01;
    ell(c, cx, cy + 0.1, 0.4 + k * 1.6, (0.4 + k * 1.6) * 0.42);
    c.stroke();
    c.strokeStyle = rgba('#7ad8ff', f * 0.7);
    c.lineWidth = 0.02;
    ell(c, cx, cy + 0.1, 0.25 + k * 1.1, (0.25 + k * 1.1) * 0.42);
    c.stroke();
    // glints flying off
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + b.uid;
      const d = 0.3 + k * 1.2;
      c.fillStyle = rgba('#ffffff', f);
      c.fillRect(cx + Math.cos(a) * d - 0.015, cy + 0.1 + Math.sin(a) * d * 0.42 - 0.015, 0.03, 0.03);
    }
  }
}

// ------------------------------------------------------------------ dispatch

const FLAT = new Set(['icicles']);
const NO_PLINTH = new Set(['icewall', 'icicles', 'lodge', 'brazier', 'avalanche', 'snowcannon', 'aurora', 'mammoth', 'winterheart']);

function building(ctx: C, b: Building, t: number, game: Game) {
  const id = b.def.id;
  const cx = b.x + 0.5,
    cy = b.y + 0.5;
  ctx.save();
  if (!NO_PLINTH.has(id)) plinth(ctx, b);
  switch (id) {
    case 'icewall':
      icewall(ctx, b, game, t);
      break;
    case 'snowballer':
      snowballer(ctx, b, cx, cy);
      break;
    case 'icicles':
      icicles(ctx, b, t);
      break;
    case 'lodge':
      lodge(ctx, b, cx, cy, t);
      break;
    case 'harpoon':
      harpoon(ctx, b, cx, cy);
      break;
    case 'brazier':
      brazier(ctx, b, cx, cy, t);
      break;
    case 'avalanche':
      avalanche(ctx, b, cx, cy, t);
      break;
    case 'snowcannon':
      snowcannon(ctx, b, cx, cy, t);
      break;
    case 'aurora':
      aurora(ctx, b, cx, cy, t);
      break;
    case 'mammoth':
      mammothPen(ctx, b, cx, cy, t, game);
      break;
    case 'winterheart':
      winterheart(ctx, b, cx, cy, t);
      break;
  }
  if (id !== 'icewall') pips(ctx, cx, b.y + (FLAT.has(id) ? 0.94 : 0.92), b.level);
  if (b.buff > 0 && b.def.kind === 'tower') buffSparkles(ctx, b, t);
  if (b.hp < b.maxHp * 0.5 && id !== 'icewall' && !FLAT.has(id)) {
    // scorch & soot smudges on damaged structures
    ctx.fillStyle = 'rgba(30,30,40,0.35)';
    ell(ctx, cx - 0.15, cy + 0.1, 0.1, 0.05);
    ctx.fill();
    ell(ctx, cx + 0.18, cy - 0.05, 0.07, 0.04);
    ctx.fill();
  }
  if (b.hurt > 0) glow(ctx, cx, cy - 0.1, 0.65, '#ff3030', Math.min(1, b.hurt * 5) * 0.65);
  ctx.restore();
}

function iconTall(id: string): number {
  if (id === 'winterheart') return 1.25;
  if (id === 'aurora') return 1;
  if (id === 'brazier' || id === 'avalanche' || id === 'lodge') return 0.5;
  return 0;
}

// ------------------------------------------------------------------ the Hearth (core)

function standingStone(g: C, x: number, y: number, h: number, w: number, seed: number, L: number) {
  const lean = (hash(seed) - 0.5) * 0.04;
  g.beginPath();
  g.moveTo(x - w * 0.55, y);
  g.lineTo(x - w * 0.5 + lean, y - h * 0.85);
  g.quadraticCurveTo(x + lean, y - h * 1.05, x + w * 0.5 + lean, y - h * 0.82);
  g.lineTo(x + w * 0.55, y);
  g.closePath();
  fo(g, hGrad(g, x - w * 0.5, x + w * 0.5, STONE, 0.3), 0.018);
  // lichen and cracks
  g.strokeStyle = 'rgba(30,36,50,0.45)';
  g.lineWidth = 0.008;
  g.beginPath();
  g.moveTo(x - w * 0.2, y - h * 0.6);
  g.lineTo(x - w * 0.05, y - h * 0.45);
  g.lineTo(x - w * 0.15, y - h * 0.3);
  g.stroke();
  if (L >= 2) {
    // carved knotwork band
    g.strokeStyle = 'rgba(120,200,240,0.7)';
    g.lineWidth = 0.012;
    g.beginPath();
    g.moveTo(x - w * 0.35, y - h * 0.5);
    g.quadraticCurveTo(x, y - h * 0.62, x + w * 0.35, y - h * 0.5);
    g.moveTo(x - w * 0.35, y - h * 0.4);
    g.quadraticCurveTo(x, y - h * 0.28, x + w * 0.35, y - h * 0.4);
    g.stroke();
  }
  // snow cap
  g.fillStyle = SNOW;
  g.beginPath();
  g.moveTo(x - w * 0.5 + lean, y - h * 0.84);
  g.quadraticCurveTo(x + lean, y - h * 1.08, x + w * 0.52 + lean, y - h * 0.8);
  g.quadraticCurveTo(x + w * 0.2, y - h * 0.76, x - w * 0.5 + lean, y - h * 0.78);
  g.fill();
  // snow drift at the foot
  ell(g, x, y, w * 0.75, w * 0.22);
  g.fill();
}

function timberPost(g: C, x: number, y: number, h: number, L: number, shield: string | null) {
  g.beginPath();
  g.rect(x - 0.04, y - h, 0.08, h);
  fo(g, hGrad(g, x - 0.04, x + 0.04, TIMBER, 0.3), 0.016);
  // carved bands
  g.strokeStyle = TIMBER_D;
  g.lineWidth = 0.012;
  g.beginPath();
  for (const k of [0.25, 0.7]) {
    g.moveTo(x - 0.04, y - h * k);
    g.lineTo(x + 0.04, y - h * k);
  }
  g.stroke();
  // carved finial
  poly(g, [
    [x - 0.05, y - h],
    [x - 0.03, y - h - 0.08],
    [x, y - h - 0.04],
    [x + 0.03, y - h - 0.08],
    [x + 0.05, y - h],
  ]);
  fo(g, TIMBER_L, 0.012);
  if (shield) {
    circle(g, x, y - h * 0.5, 0.09);
    fo(g, shield, 0.016);
    g.strokeStyle = 'rgba(240,230,210,0.85)';
    g.lineWidth = 0.014;
    g.beginPath();
    g.moveTo(x - 0.09, y - h * 0.5);
    g.lineTo(x + 0.09, y - h * 0.5);
    g.moveTo(x, y - h * 0.5 - 0.09);
    g.lineTo(x, y - h * 0.5 + 0.09);
    g.stroke();
    circle(g, x, y - h * 0.5, 0.028);
    fo(g, IRON_L, 0.008);
  }
  void L;
}

interface HearthPiece {
  x: number;
  y: number;
  kind: 'stone' | 'post';
  i: number;
}

function hearthLayout(L: number): HearthPiece[] {
  const out: HearthPiece[] = [];
  const nS = 6 + L;
  const R = 1.18,
    ry = 0.78;
  for (let i = 0; i < nS; i++) {
    const a = (i / nS) * TAU + Math.PI / nS;
    out.push({ x: Math.cos(a) * R, y: Math.sin(a) * R * ry, kind: 'stone', i });
    if (L >= 1 && (L >= 3 || i % 2 === 0)) {
      const b = a + Math.PI / nS;
      out.push({ x: Math.cos(b) * R * 0.98, y: Math.sin(b) * R * ry * 0.98, kind: 'post', i });
    }
  }
  return out;
}

const SHIELDS = ['#b8322e', '#2e5a9a', '#d8a030', '#3a7a4a'];

function hearthLayer(c: C, L: number, front: boolean) {
  return cached(`hearth|${L}|${front ? 1 : 0}`, pxOf(c), -1.75, -2.1, 3.5, 3.85, (g) => {
    const stoneH = 0.5 + L * 0.05,
      postH = 0.62 + L * 0.06;
    if (!front) {
      g.fillStyle = SHADOW;
      ell(g, 0.1, 0.18, 1.55, 1.12);
      g.fill();
      // trodden snow ring, then flagstones around the pit
      ell(g, 0, 0.05, 1.45, 1.02);
      fo(g, vGrad(g, -1, 1, '#ffffff', '#c8d8ec'), 0.02, 'rgba(60,90,140,0.5)');
      const r = new TRng(909 + L);
      for (let ring = 0; ring < 2; ring++) {
        const rr = 0.62 + ring * 0.24;
        const n = 12 + ring * 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + ring * 0.3;
          const x = Math.cos(a) * rr,
            y = 0.05 + Math.sin(a) * rr * 0.7;
          const s = 0.09 + r.next() * 0.03;
          const pts: [number, number][] = [];
          for (let k = 0; k < 5; k++) {
            const b = a + (k / 5) * TAU;
            pts.push([x + Math.cos(b) * s, y + Math.sin(b) * s * 0.62]);
          }
          facet(g, pts, x - 0.02, y - 0.02, ring ? STONE : STONE_L, 0.3, 'rgba(30,36,52,0.6)', 0.01);
        }
      }
      if (L >= 3) {
        // fur-draped benches between the stones and the pit
        for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
          const x = Math.cos(a) * 0.8,
            y = 0.05 + Math.sin(a) * 0.56;
          g.save();
          g.translate(x, y);
          g.rotate(a + Math.PI / 2);
          g.scale(1, 0.7);
          g.beginPath();
          g.roundRect(-0.2, -0.06, 0.4, 0.12, 0.03);
          fo(g, TIMBER, 0.014);
          g.beginPath();
          g.moveTo(-0.15, -0.07);
          g.quadraticCurveTo(0, -0.12, 0.15, -0.07);
          g.lineTo(0.17, 0.09);
          for (let k = 0; k < 6; k++) g.lineTo(0.15 - k * 0.06, 0.08 + (k % 2) * 0.04);
          g.closePath();
          fo(g, k2(a), 0.012);
          g.restore();
        }
      }
      // the round firepit: a ring of big stones, a bed of embers and logs
      ell(g, 0, 0.0, 0.48, 0.32);
      g.fillStyle = '#1a120c';
      g.fill();
      const pit = g.createRadialGradient(0, 0, 0.02, 0, 0, 0.42);
      pit.addColorStop(0, '#ffb040');
      pit.addColorStop(0.35, '#d0501a');
      pit.addColorStop(0.75, '#40180a');
      pit.addColorStop(1, '#1a120c');
      g.fillStyle = pit;
      ell(g, 0, 0.0, 0.42, 0.27);
      g.fill();
      // crossed logs
      for (const [a, len] of [
        [0.3, 0.36],
        [-0.4, 0.34],
        [1.5, 0.28],
      ]) {
        g.save();
        g.translate(0, 0.0);
        g.rotate(a);
        g.scale(1, 0.7);
        g.beginPath();
        g.roundRect(-len, -0.04, len * 2, 0.08, 0.04);
        fo(g, TIMBER_D, 0.012);
        g.restore();
      }
      // back half of the pit stones
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        if (Math.sin(a) > 0) continue;
        rock(g, Math.cos(a) * 0.48, Math.sin(a) * 0.32, 0.08, i * 1.7 + 2, false);
      }
    }
    const pieces = hearthLayout(L).filter((p) => (p.y > 0) === front);
    pieces.sort((a, b) => a.y - b.y);
    for (const p of pieces) {
      if (p.kind === 'stone') standingStone(g, p.x, p.y + 0.05, stoneH * (0.9 + hash(p.i * 3 + 1) * 0.2), 0.2, p.i * 7 + 3, L);
      else timberPost(g, p.x, p.y + 0.05, postH, L, L >= 1 ? SHIELDS[p.i % 4] : null);
    }
    if (L >= 2) {
      // carved timber arches across the back and front of the ring
      for (const a0 of front ? [Math.PI / 2] : [-Math.PI / 2, ...(L >= 4 ? [-Math.PI / 2 + 1.2, -Math.PI / 2 - 1.2] : [])]) {
        const R = 1.18,
          ry = 0.78;
        const half = 0.3;
        const ax = Math.cos(a0 - half) * R,
          ay = Math.sin(a0 - half) * R * ry + 0.05;
        const bx = Math.cos(a0 + half) * R,
          by = Math.sin(a0 + half) * R * ry + 0.05;
        const h = postH + 0.2;
        timberPost(g, ax, ay, h, L, null);
        timberPost(g, bx, by, h, L, null);
        const mx = (ax + bx) / 2,
          my = Math.min(ay, by) - h - 0.18;
        g.strokeStyle = OUT;
        g.lineWidth = 0.09;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(ax - 0.04, ay - h + 0.02);
        g.quadraticCurveTo(mx, my, bx + 0.04, by - h + 0.02);
        g.stroke();
        g.strokeStyle = TIMBER_L;
        g.lineWidth = 0.06;
        g.stroke();
        // dragon-curl ends
        g.strokeStyle = TIMBER_D;
        g.lineWidth = 0.025;
        for (const [x, y, s] of [
          [ax, ay - h, -1],
          [bx, by - h, 1],
        ]) {
          g.beginPath();
          g.arc(x + s * 0.06, y - 0.06, 0.05, 0, TAU * 0.8);
          g.stroke();
        }
        g.fillStyle = SNOW;
        ell(g, mx, my + 0.1, 0.18, 0.025);
        g.fill();
      }
    }
    if (front) {
      // front half of the pit stones
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        if (Math.sin(a) <= 0) continue;
        rock(g, Math.cos(a) * 0.48, Math.sin(a) * 0.32, 0.085, i * 1.7 + 2, false);
      }
    }
  });
}

function k2(a: number) {
  // fur colours for the benches
  return hash(Math.round(a * 10)) > 0.5 ? '#c8b090' : '#8a6a4a';
}

/** Iron fire-baskets on tall posts (core level 3+): world positions relative to the core centre. */
function basketSpots(L: number): [number, number][] {
  if (L < 3) return [];
  const out: [number, number][] = [];
  const n = L >= 4 ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.PI / 4;
    out.push([Math.cos(a) * 1.42, Math.sin(a) * 1.0 + 0.05]);
  }
  return out;
}

function fireBasket(c: C, x: number, y: number, t: number, seed: number, gk: number) {
  const h = 0.7;
  c.strokeStyle = OUT;
  c.lineWidth = 0.05;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - h);
  c.stroke();
  c.strokeStyle = IRON_L;
  c.lineWidth = 0.025;
  c.stroke();
  const by = y - h;
  ell(c, x, by, 0.09, 0.035);
  fo(c, '#20160f', 0.012);
  glow(c, x, by - 0.1, 0.4, '#ff9a3a', 0.4 * gk);
  flame(c, x, by, 0.065, 0.2 * (0.5 + 0.5 * gk), t, seed, gk);
  c.beginPath();
  c.ellipse(x, by, 0.09, 0.035, 0, 0, Math.PI);
  c.lineTo(x - 0.05, by + 0.08);
  c.lineTo(x + 0.05, by + 0.08);
  c.closePath();
  fo(c, IRON, 0.012);
}

function hearth(ctx: C, game: Game, t: number) {
  const L = game.coreLevel;
  const cx = CORE_X + 0.5,
    cy = CORE_Y + 0.5;
  const hpk = Math.max(0, Math.min(1, game.coreHp / game.coreMaxHp));
  const gk = 0.35 + 0.65 * hpk;
  const hurt = Math.max(0, Math.min(1, game.coreHurt * 4));
  ctx.save();
  ctx.drawImage(hearthLayer(ctx, L, false), cx - 1.75, cy - 2.1, 3.5, 3.85);
  const baskets = basketSpots(L);
  for (const [x, y] of baskets) if (y <= 0) fireBasket(ctx, cx + x, cy + y, t, x * 3, gk);
  // the roaring fire (gutters when the Hearth is hurt)
  const gutter = hurt > 0 ? 1 - hurt * 0.45 : 1;
  const fh = (1.0 + L * 0.15) * gk * gutter;
  const fw = 0.3 + L * 0.03;
  const lean = Math.cos(game.coreAngle) * 0.04;
  glow(ctx, cx, cy - 0.3, 1.6 + L * 0.15, hurt > 0 ? '#ff5a3a' : '#ffa040', (0.4 + 0.08 * Math.sin(t * 6)) * gk);
  ctx.save();
  ctx.translate(cx, cy + 0.02);
  ctx.transform(1, 0, lean * -2, 1, 0, 0);
  flame(ctx, -0.18, 0, fw * 0.55, fh * 0.6, t * 1.1, 1.3, gk);
  flame(ctx, 0.19, 0.01, fw * 0.55, fh * 0.65, t * 0.95, 4.1, gk);
  flame(ctx, 0, 0.03, fw, fh, t, 0.2, gk);
  ctx.restore();
  // embers swirling up into the twilight
  embers(ctx, cx, cy - fh * 0.5, 10 + L * 3, 0.6, 1.4 + L * 0.15, t, 77);
  // the Hearth's flare: a burst of sparks hurled toward its aim
  const sx = cx + Math.cos(game.coreAngle) * 0.25,
    sy = cy - fh * 0.75 + Math.sin(game.coreAngle) * 0.15;
  glow(ctx, sx, sy, 0.3, '#fff0b0', 0.55 * gk);
  for (let i = 0; i < 5; i++) {
    const p = (t * 2.2 + i / 5) % 1;
    const a = game.coreAngle + (hash(i * 17) - 0.5) * 0.7;
    ctx.fillStyle = rgba('#fff4c8', (1 - p) * 0.9 * gk);
    ctx.fillRect(sx + Math.cos(a) * p * 0.35 - 0.014, sy + Math.sin(a) * p * 0.25 - p * 0.1 - 0.014, 0.028, 0.028);
  }
  ctx.drawImage(hearthLayer(ctx, L, true), cx - 1.75, cy - 2.1, 3.5, 3.85);
  for (const [x, y] of baskets) if (y > 0) fireBasket(ctx, cx + x, cy + y, t, x * 3, gk);
  if (hpk < 0.5) {
    // smoke from a struggling fire
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.4 + i / 5) % 1;
      ctx.fillStyle = rgba('#5a5e6a', 0.45 * (1 - p) * (1 - hpk * 2));
      circle(ctx, cx + Math.sin(t + i * 2) * 0.1 + p * 0.2, cy - fh - p * 0.9, 0.08 + p * 0.15);
      ctx.fill();
    }
  }
  if (hurt > 0) glow(ctx, cx, cy - 0.3, 1.6, '#ff3030', hurt * 0.5);
  ctx.restore();
}

// ------------------------------------------------------------------ ice crevasse (rift)

const CREV: [number, number][] = [
  [-0.62, 0.02],
  [-0.42, -0.08],
  [-0.3, -0.04],
  [-0.12, -0.17],
  [0.05, -0.1],
  [0.2, -0.2],
  [0.36, -0.08],
  [0.6, -0.04],
  [0.38, 0.08],
  [0.22, 0.15],
  [0.04, 0.09],
  [-0.14, 0.18],
  [-0.3, 0.08],
  [-0.44, 0.1],
];

function crevasseCanvas(c: C) {
  return cached('crevasse', pxOf(c), -1.3, -1.0, 2.6, 2.0, (g) => {
    // trampled snow scattered with ice chunks around the gash
    const sg = g.createRadialGradient(0, 0, 0.1, 0, 0, 1.2);
    sg.addColorStop(0, 'rgba(120,170,220,0.55)');
    sg.addColorStop(0.6, 'rgba(160,200,240,0.25)');
    sg.addColorStop(1, 'rgba(160,200,240,0)');
    g.fillStyle = sg;
    ell(g, 0, 0, 1.25, 0.95);
    g.fill();
    // radiating frost cracks
    g.strokeStyle = 'rgba(40,100,170,0.6)';
    g.lineWidth = 0.014;
    const r = new TRng(3131);
    g.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + r.next() * 0.4;
      let x = Math.cos(a) * 0.35,
        y = Math.sin(a) * 0.18;
      g.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        const aa = a + (r.next() - 0.5) * 0.8;
        x += Math.cos(aa) * 0.17;
        y += Math.sin(aa) * 0.12;
        g.lineTo(x, y);
      }
    }
    g.stroke();
    // raised snow lips
    poly(
      g,
      CREV.map(([x, y]) => [x * 1.18, y * 1.5 - 0.02]),
    );
    fo(g, vGrad(g, -0.3, 0.3, '#ffffff', '#b8d0ea'), 0.016, 'rgba(50,90,150,0.7)');
    // the crevasse itself: blue ice walls falling into the dark
    poly(g, CREV);
    const dg = g.createLinearGradient(0, -0.2, 0, 0.2);
    dg.addColorStop(0, '#9fd8ff');
    dg.addColorStop(0.35, '#2a68b0');
    dg.addColorStop(0.7, '#0a1a3a');
    dg.addColorStop(1, '#030814');
    fo(g, dg, 0.02, 'rgba(10,30,70,0.95)');
    // inner ledge highlights
    g.strokeStyle = 'rgba(200,240,255,0.8)';
    g.lineWidth = 0.012;
    g.beginPath();
    for (let i = 0; i < 7; i++) {
      const [x, y] = CREV[i];
      g.moveTo(x * 0.8, y * 0.8 + 0.03);
      g.lineTo(x * 0.8, y * 0.4 + 0.06);
    }
    g.stroke();
    // ice chunks heaved up around it
    for (const [x, y, s] of [
      [-0.75, 0.2, 0.08],
      [0.7, -0.22, 0.07],
      [0.5, 0.3, 0.06],
      [-0.5, -0.28, 0.06],
    ]) {
      poly(g, [
        [x - s, y + s * 0.4],
        [x - s * 0.4, y - s],
        [x + s, y - s * 0.4],
        [x + s * 0.6, y + s * 0.5],
      ]);
      fo(g, '#bfe6ff', 0.01, 'rgba(30,70,130,0.85)');
    }
  });
}

function rift(ctx: C, x: number, y: number, t: number, state: 'open' | 'forming') {
  const cx = x + 0.5,
    cy = y + 0.5;
  ctx.save();
  if (state !== 'open') {
    // hairline cracks spreading through the snow, a faint frost
    const k = 0.5 + 0.5 * Math.sin(t * 1.5);
    ctx.globalAlpha *= 0.45 + 0.35 * Math.abs(Math.sin(t * 2.9) * Math.sin(t * 1.3));
    glow(ctx, cx, cy, 0.6, '#bfe6ff', 0.3);
    ctx.strokeStyle = 'rgba(40,100,170,0.9)';
    ctx.lineWidth = 0.016;
    const r = new TRng(x * 131 + y * 7);
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + r.next() * 0.5;
      let px = cx,
        py = cy;
      ctx.moveTo(px, py);
      for (let s = 0; s < 3; s++) {
        const aa = a + (r.next() - 0.5) * 0.9;
        const len = (0.1 + r.next() * 0.08) * (0.7 + 0.3 * k);
        px += Math.cos(aa) * len;
        py += Math.sin(aa) * len * 0.75;
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.6 + i / 4) % 1;
      ctx.fillStyle = rgba('#ffffff', Math.sin(p * Math.PI) * 0.9);
      ctx.fillRect(cx + Math.cos(i * 1.7) * 0.3 - 0.012, cy + Math.sin(i * 2.3) * 0.2 - 0.012, 0.024, 0.024);
    }
    ctx.restore();
    return;
  }
  ctx.drawImage(crevasseCanvas(ctx), cx - 1.3, cy - 1.0, 2.6, 2.0);
  // cold light welling up from the depths
  glow(ctx, cx, cy, 0.8, '#5ab8ff', 0.3 + 0.08 * Math.sin(t * 2.2));
  ctx.strokeStyle = rgba('#bff0ff', 0.4 + 0.25 * Math.sin(t * 3));
  ctx.lineWidth = 0.014;
  ctx.beginPath();
  ctx.moveTo(cx - 0.45, cy + 0.02);
  ctx.lineTo(cx - 0.1, cy - 0.04);
  ctx.lineTo(cx + 0.15, cy + 0.0);
  ctx.lineTo(cx + 0.45, cy - 0.04);
  ctx.stroke();
  // cold mist breathing out
  for (let i = 0; i < 7; i++) {
    const p = (t * 0.3 + i / 7 + hash(i + x * 13) * 0.3) % 1;
    const mx = cx + (hash(i * 7 + y) - 0.5) * 0.9 + Math.sin(t * 0.7 + i) * 0.1 * p;
    const my = cy - p * 0.7;
    const r = 0.1 + p * 0.25;
    const a = 0.35 * Math.sin(p * Math.PI);
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, r);
    g.addColorStop(0, rgba('#e8f6ff', a));
    g.addColorStop(1, rgba('#e8f6ff', 0));
    ctx.fillStyle = g;
    ctx.fillRect(mx - r, my - r, r * 2, r * 2);
  }
  // drifting snowflakes swirling around the gash
  for (let i = 0; i < 6; i++) {
    const a = t * 0.8 + (i / 6) * TAU;
    const rr = 0.5 + 0.1 * Math.sin(t * 2 + i);
    ctx.fillStyle = rgba('#ffffff', 0.8);
    ctx.fillRect(cx + Math.cos(a) * rr - 0.012, cy + Math.sin(a) * rr * 0.5 - 0.2 - 0.012, 0.024, 0.024);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ allies

function ally(ctx: C, a: Ally, t: number) {
  if (a.kind === 'mammoth') drawMammothAlly(ctx, a, t);
}

registerArt('winter', {
  building,
  iconTall,
  enemies: WINTER_ENEMIES,
  core: hearth,
  rift,
  ally,
});

void ICE;
void ICE_M;
void ICE_D;
void STONE_D;
