// Summer campaign art: the Sunwell oasis, its sandstone-and-bronze defences and the sand vortices
// the dune swarm crawls out of. World ctx (1 unit = 1 tile), tile (x,y) spans [x,x+1]×[y,y+1].
import { CORE_X, CORE_Y } from '../../game/config';
import type { Building, Game } from '../../game/game';
import { SUMMER_ENEMIES } from './art-summer-enemies';
import { registerArt } from './realm-art';
import { cached, facet, glow, hash, ngon, poly, pxOf, rgba, shade } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// palette: sun-baked sandstone, terracotta, glazed turquoise, bronze and sun-gold
const SAND = '#efd6a2';
const SAND_MID = '#d8b47a';
const SAND_DARK = '#a8814c';
const TERRA = '#c8653a';
const TERRA_DARK = '#86391c';
const GOLD = '#f4c03c';
const GOLD_LIGHT = '#ffe98e';
const GOLD_DARK = '#94641a';
const TURQ = '#2fc2b6';
const TURQ_LIGHT = '#92f4e2';
const TURQ_DARK = '#12707a';
const BRONZE = '#bb7838';
const BRONZE_LIGHT = '#f0bb7c';
const BRONZE_DARK = '#663e18';
const DEEP = '#263450';
const LEAF = '#5f9c3e';
const OUT = 'rgba(62,34,12,0.9)';
const SHADOW = 'rgba(92,52,18,0.28)';

// ------------------------------------------------------------------ small helpers

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

/** Horizontal gradient for an upright surface spanning x0..x1, lit from the left. */
function hGrad(c: C, x0: number, x1: number, base: string, k = 0.2) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(base, k));
  g.addColorStop(0.45, base);
  g.addColorStop(1, shade(base, -k * 1.3));
  return g;
}

function metal(c: C, x0: number, y0: number, x1: number, y1: number, light: string, mid: string, dark: string) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, light);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, dark);
  return g;
}
const bronze = (c: C, x0: number, y0: number, x1: number, y1: number) => metal(c, x0, y0, x1, y1, BRONZE_LIGHT, BRONZE, BRONZE_DARK);
const goldG = (c: C, x0: number, y0: number, x1: number, y1: number) => metal(c, x0, y0, x1, y1, GOLD_LIGHT, GOLD, GOLD_DARK);

/** Abstract sun glyph: a disc with alternating triangular rays. */
function sunGlyph(c: C, x: number, y: number, r: number, rays: number, col: string, dark = GOLD_DARK, sy = 1) {
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU;
    const r1 = r * (i % 2 ? 1.55 : 1.9);
    c.moveTo(x + Math.cos(a - 0.22) * r * 1.05, y + Math.sin(a - 0.22) * r * 1.05 * sy);
    c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * sy);
    c.lineTo(x + Math.cos(a + 0.22) * r * 1.05, y + Math.sin(a + 0.22) * r * 1.05 * sy);
  }
  c.fill();
  ell(c, x, y, r, r * sy);
  fo(c, col, Math.max(0.006, r * 0.18), dark);
}

/** A four-point sparkle. */
function sparkle(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  c.fillStyle = rgba(col, a);
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

/** Date palm, foot at (x,y), `h` tall, its crown leaning by `lean`. */
function palm(c: C, x: number, y: number, h: number, lean: number, t: number, seed: number) {
  const tx = x + lean,
    ty = y - h;
  const qx = x + lean * 0.15,
    qy = y - h * 0.55;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(qx, qy, tx, ty);
  c.strokeStyle = OUT;
  c.lineWidth = h * 0.09 + 0.02;
  c.stroke();
  c.strokeStyle = '#9a6a3c';
  c.lineWidth = h * 0.09;
  c.stroke();
  // bark rings
  c.strokeStyle = 'rgba(70,40,18,0.7)';
  c.lineWidth = 0.008;
  c.beginPath();
  for (let k = 1; k < 8; k++) {
    const s = k / 8;
    const px = (1 - s) * (1 - s) * x + 2 * (1 - s) * s * qx + s * s * tx;
    const py = (1 - s) * (1 - s) * y + 2 * (1 - s) * s * qy + s * s * ty;
    const w = h * 0.05;
    c.moveTo(px - w, py - w * 0.3);
    c.lineTo(px + w, py + w * 0.3);
  }
  c.stroke();
  // dates
  c.fillStyle = '#c0652a';
  for (const [dx, dy] of [
    [-0.03, 0.03],
    [0.03, 0.035],
    [0, 0.05],
  ]) {
    circle(c, tx + dx, ty + dy, 0.022);
    c.fill();
  }
  // fronds
  const sway = Math.sin(t * 1.3 + seed) * 0.06;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * Math.PI * 1.55 + sway;
    const len = h * (0.42 + 0.08 * Math.cos(i * 1.7 + seed));
    const ex = tx + Math.cos(a) * len,
      ey = ty + Math.sin(a) * len * 0.55 + len * 0.42;
    const mx = tx + Math.cos(a) * len * 0.55,
      my = ty + Math.sin(a) * len * 0.55 * 0.9 - len * 0.12;
    const nx = -Math.sin(a) * len * 0.13,
      ny = Math.cos(a) * len * 0.13;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(mx + nx, my + ny, ex, ey);
    c.quadraticCurveTo(mx - nx, my - ny, tx, ty);
    c.fillStyle = i % 2 ? LEAF : shade(LEAF, 0.15);
    c.fill();
    c.strokeStyle = 'rgba(30,50,16,0.8)';
    c.lineWidth = 0.01;
    c.stroke();
    c.strokeStyle = 'rgba(210,230,140,0.55)';
    c.lineWidth = 0.007;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(mx, my, ex, ey);
    c.stroke();
  }
}

/**
 * Axes of an upright round mirror/dish of radius R facing ground angle `a`, leaning back by `tilt`
 * (so its face also looks a little skyward). Point (p,q) of the unit disc maps to C + p·u + q·v;
 * `n` is the projected face normal; `front` = the reflective face is turned toward the viewer.
 */
function dishAxes(R: number, a: number, tilt: number) {
  const s = Math.sin(tilt),
    co = Math.cos(tilt);
  const ux = -Math.sin(a) * R,
    uy = 0.6 * Math.cos(a) * R;
  const vx = -Math.cos(a) * s * R,
    vy = (-0.6 * Math.sin(a) * s - 0.8 * co) * R;
  const nx = Math.cos(a) * co,
    ny = 0.6 * Math.sin(a) * co - 0.8 * s;
  return { ux, uy, vx, vy, nx, ny, front: ux * vy - uy * vx > 0 };
}
type Axes = ReturnType<typeof dishAxes>;

function discPath(c: C, X: number, Y: number, A: Axes, k = 1) {
  c.save();
  c.transform(A.ux * k, A.uy * k, A.vx * k, A.vy * k, X, Y);
  c.beginPath();
  c.arc(0, 0, 1, 0, TAU);
  c.restore();
}

/** Mirror disc with rim thickness: bright polished face, or the ribbed bronze back. */
function mirrorDisc(c: C, X: number, Y: number, A: Axes, thick: number, rim: string, gem: boolean, flash: number) {
  const ox = A.nx * thick,
    oy = A.ny * thick;
  // far side first (rim edge)
  const far = A.front ? [X, Y] : [X + ox, Y + oy];
  const near = A.front ? [X + ox, Y + oy] : [X, Y];
  discPath(c, far[0], far[1], A);
  fo(c, BRONZE_DARK, 0.02);
  discPath(c, near[0], near[1], A);
  c.save();
  c.transform(A.ux, A.uy, A.vx, A.vy, near[0], near[1]);
  if (A.front) {
    const g = c.createRadialGradient(-0.3, 0.35, 0.05, 0, 0, 1.05);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, flash > 0 ? '#ffffff' : '#fff4c8');
    g.addColorStop(0.65, GOLD_LIGHT);
    g.addColorStop(1, '#d69a48');
    c.fillStyle = g;
    c.fill();
    // concentric polish rings and a sky reflection band
    c.strokeStyle = 'rgba(160,100,40,0.35)';
    c.lineWidth = 0.035;
    c.beginPath();
    c.arc(0, 0, 0.62, 0, TAU);
    c.moveTo(0.3, 0);
    c.arc(0, 0, 0.3, 0, TAU);
    c.stroke();
    c.fillStyle = 'rgba(150,220,255,0.35)';
    c.beginPath();
    c.ellipse(0.25, -0.35, 0.55, 0.16, 0.5, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.ellipse(-0.42, 0.45, 0.18, 0.07, -0.7, 0, TAU);
    c.fill();
  } else {
    const g = c.createRadialGradient(-0.35, 0.4, 0.05, 0, 0, 1.05);
    g.addColorStop(0, BRONZE_LIGHT);
    g.addColorStop(0.55, BRONZE);
    g.addColorStop(1, BRONZE_DARK);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = 'rgba(70,40,14,0.6)';
    c.lineWidth = 0.05;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      c.moveTo(Math.cos(a) * 0.22, Math.sin(a) * 0.22);
      c.lineTo(Math.cos(a) * 0.95, Math.sin(a) * 0.95);
    }
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 0.22, 0, TAU);
    c.fillStyle = BRONZE_LIGHT;
    c.fill();
  }
  c.restore();
  // rim ring (uniform line width)
  discPath(c, near[0], near[1], A);
  c.strokeStyle = OUT;
  c.lineWidth = 0.05;
  c.stroke();
  c.strokeStyle = rim;
  c.lineWidth = 0.03;
  c.stroke();
  if (gem) {
    c.fillStyle = TURQ_LIGHT;
    for (const [p, q] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      circle(c, near[0] + A.ux * p + A.vx * q, near[1] + A.uy * p + A.vy * q, 0.022);
      fo(c, TURQ, 0.008, TURQ_DARK);
    }
  }
}

// ------------------------------------------------------------------ sandstone plinth, pips, fx

function plinthCanvas(c: C, L: number) {
  return cached(`splinth|${L}`, pxOf(c), -0.05, -0.05, 1.15, 1.15, (g) => {
    const top: [number, number][] = [
      [0.17, 0.13],
      [0.83, 0.13],
      [0.92, 0.22],
      [0.92, 0.7],
      [0.83, 0.79],
      [0.17, 0.79],
      [0.08, 0.7],
      [0.08, 0.22],
    ];
    g.fillStyle = SHADOW;
    poly(
      g,
      top.map(([x, y]) => [x + 0.07, y + 0.17]),
    );
    g.fill();
    // front skirt
    poly(g, [
      [0.08, 0.7],
      [0.17, 0.79],
      [0.83, 0.79],
      [0.92, 0.7],
      [0.92, 0.8],
      [0.83, 0.89],
      [0.17, 0.89],
      [0.08, 0.8],
    ]);
    fo(g, hGrad(g, 0.08, 0.92, SAND_DARK, 0.15), 0.02);
    // block joints on the skirt
    g.strokeStyle = 'rgba(70,40,14,0.35)';
    g.lineWidth = 0.008;
    g.beginPath();
    for (const x of [0.32, 0.55, 0.76]) {
      g.moveTo(x, 0.8);
      g.lineTo(x, 0.885);
    }
    g.stroke();
    if (L >= 1) {
      // glazed turquoise tile band
      for (let i = 0; i < 9; i++) {
        const x = 0.19 + i * 0.07;
        g.fillStyle = i % 2 ? TURQ : TURQ_LIGHT;
        g.fillRect(x, 0.815, 0.055, 0.045);
      }
      g.strokeStyle = 'rgba(10,60,64,0.6)';
      g.lineWidth = 0.006;
      g.strokeRect(0.19, 0.815, 0.615, 0.045);
    }
    // top face
    const tg = g.createLinearGradient(0.1, 0.1, 0.9, 0.8);
    tg.addColorStop(0, shade(SAND, 0.25));
    tg.addColorStop(0.6, SAND);
    tg.addColorStop(1, SAND_MID);
    poly(g, top);
    fo(g, tg, 0.022);
    // paving slabs
    g.strokeStyle = 'rgba(140,100,50,0.4)';
    g.lineWidth = 0.008;
    g.beginPath();
    g.moveTo(0.5, 0.14);
    g.lineTo(0.5, 0.78);
    g.moveTo(0.09, 0.46);
    g.lineTo(0.91, 0.46);
    g.moveTo(0.3, 0.46);
    g.lineTo(0.3, 0.78);
    g.moveTo(0.72, 0.14);
    g.lineTo(0.72, 0.46);
    g.stroke();
    // inset border
    g.strokeStyle = L >= 2 ? rgba(GOLD, 0.95) : rgba(TERRA, 0.55);
    g.lineWidth = L >= 2 ? 0.022 : 0.014;
    poly(
      g,
      top.map(([x, y]) => [0.5 + (x - 0.5) * 0.86, 0.46 + (y - 0.46) * 0.84]),
    );
    g.stroke();
    if (L >= 2) {
      for (const [x, y] of [
        [0.16, 0.2],
        [0.84, 0.2],
        [0.16, 0.72],
        [0.84, 0.72],
      ]) {
        circle(g, x, y, 0.028);
        fo(g, goldG(g, x - 0.03, y - 0.03, x + 0.03, y + 0.03), 0.008, GOLD_DARK);
      }
    }
  });
}

function plinth(c: C, b: Building) {
  c.drawImage(plinthCanvas(c, b.level), b.x - 0.05, b.y - 0.05, 1.15, 1.15);
}

function pips(c: C, cx: number, y: number, level: number) {
  for (let i = 0; i <= level; i++) {
    const x = cx + (i - level / 2) * 0.1;
    poly(c, [
      [x, y - 0.035],
      [x + 0.032, y],
      [x, y + 0.035],
      [x - 0.032, y],
    ]);
    fo(c, TURQ_LIGHT, 0.012, GOLD_DARK);
  }
}

function heatSparkles(c: C, b: Building, t: number, col: string) {
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.6 + i / 4 + hash(b.uid * 13 + i) * 0.3) % 1;
    const x = b.x + 0.2 + hash(b.uid * 7 + i) * 0.6;
    const y = b.y + 0.75 - p * 0.9;
    sparkle(c, x, y, 0.045, col, 0.9 * Math.sin(p * Math.PI));
  }
}

function cracks(c: C, b: Building) {
  const r = (k: number) => hash(b.uid * 31 + k);
  c.strokeStyle = 'rgba(60,30,10,0.85)';
  c.lineWidth = 0.018;
  c.lineCap = 'round';
  c.beginPath();
  const x = b.x + 0.25 + r(1) * 0.5,
    y = b.y + 0.35 + r(2) * 0.3;
  c.moveTo(x, y);
  c.lineTo(x + 0.07, y + 0.08);
  c.lineTo(x + 0.03, y + 0.17);
  c.moveTo(x + 0.07, y + 0.08);
  c.lineTo(x + 0.15, y + 0.1);
  c.stroke();
  c.fillStyle = SAND_DARK;
  for (let i = 0; i < 3; i++) {
    circle(c, b.x + 0.2 + r(5 + i) * 0.6, b.y + 0.84 + r(9 + i) * 0.06, 0.025);
    c.fill();
  }
}

// ------------------------------------------------------------------ sandstone wall

function wallCanvas(c: C, mask: number, L: number) {
  return cached(`swall|${mask}|${L}`, pxOf(c), -0.05, -0.36, 1.2, 1.5, (g) => {
    const N = mask & 1,
      E = mask & 2,
      S = mask & 4,
      W = mask & 8;
    const h = 0.3,
      ins = 0.13;
    const x0 = W ? 0 : ins,
      x1 = E ? 1 : 1 - ins;
    const fy0 = N ? 0 : ins,
      fy1 = S ? 1 : 1 - ins;
    const y0 = fy0 - h,
      y1 = fy1 - h;
    g.fillStyle = SHADOW;
    g.fillRect(x0 + 0.08, fy0 + 0.05, x1 - x0, fy1 - fy0 + 0.05);
    if (!S) {
      // front face: courses of sun-baked blocks
      const fg = g.createLinearGradient(0, y1, 0, fy1);
      fg.addColorStop(0, SAND_MID);
      fg.addColorStop(1, SAND_DARK);
      g.fillStyle = fg;
      g.fillRect(x0, y1, x1 - x0, h);
      const rows = 3,
        rh = h / rows;
      g.strokeStyle = 'rgba(80,46,16,0.45)';
      g.lineWidth = 0.008;
      g.beginPath();
      for (let r = 1; r < rows; r++) {
        g.moveTo(x0, y1 + r * rh);
        g.lineTo(x1, y1 + r * rh);
      }
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? 0.125 : 0;
        for (let x = off; x < 1.01; x += 0.25) {
          if (x <= x0 + 0.02 || x >= x1 - 0.02) continue;
          g.moveTo(x, y1 + r * rh);
          g.lineTo(x, y1 + (r + 1) * rh);
        }
      }
      g.stroke();
      // sunlit top edge of each course
      g.strokeStyle = 'rgba(255,240,200,0.35)';
      g.beginPath();
      for (let r = 0; r < rows; r++) {
        g.moveTo(x0, y1 + r * rh + 0.008);
        g.lineTo(x1, y1 + r * rh + 0.008);
      }
      g.stroke();
      if (L >= 1) {
        // carved chevron band in terracotta
        const by = y1 + rh * 1.5;
        g.fillStyle = rgba(TERRA_DARK, 0.25);
        g.fillRect(x0, y1 + rh, x1 - x0, rh);
        g.strokeStyle = TERRA;
        g.lineWidth = 0.016;
        g.beginPath();
        let up = true;
        for (let x = x0; x <= x1 + 0.001; x += 0.0625) {
          const yy = by + (up ? -rh * 0.3 : rh * 0.3);
          if (x === x0) g.moveTo(x, yy);
          else g.lineTo(x, yy);
          up = !up;
        }
        g.stroke();
      }
      if (L >= 2) {
        g.fillStyle = goldG(g, 0, y1, 0, y1 + 0.03);
        g.fillRect(x0, y1, x1 - x0, 0.026);
        g.fillStyle = TURQ;
        for (let x = 0.125; x < 1; x += 0.25) {
          if (x <= x0 || x >= x1) continue;
          g.fillRect(x - 0.02, y1 + rh * 2 + 0.03, 0.04, 0.04);
        }
      }
      g.strokeStyle = OUT;
      g.lineWidth = 0.018;
      g.strokeRect(x0, y1, x1 - x0, h);
    }
    // top face
    const tg = g.createLinearGradient(0, y0, 0, y1);
    tg.addColorStop(0, shade(SAND, 0.3));
    tg.addColorStop(1, SAND);
    g.fillStyle = tg;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.strokeStyle = 'rgba(140,96,48,0.45)';
    g.lineWidth = 0.008;
    g.beginPath();
    for (let x = 0.5; x < 1; x += 0.5) {
      if (x <= x0 || x >= x1) continue;
      g.moveTo(x, y0);
      g.lineTo(x, y1);
    }
    for (let y = -h + 0.5; y < 1 - h; y += 0.5) {
      if (y <= y0 || y >= y1) continue;
      g.moveTo(x0, y);
      g.lineTo(x1, y);
    }
    g.stroke();
    // wind-worn speckles
    g.fillStyle = 'rgba(150,104,56,0.35)';
    for (let i = 0; i < 6; i++) {
      const px = x0 + hash(mask * 17 + i) * (x1 - x0),
        py = y0 + hash(mask * 23 + i + 9) * (y1 - y0);
      g.fillRect(px, py, 0.02, 0.012);
    }
    if (L >= 2) {
      g.strokeStyle = rgba(GOLD, 0.95);
      g.lineWidth = 0.018;
      g.beginPath();
      if (!N) {
        g.moveTo(x0 + 0.04, y0 + 0.045);
        g.lineTo(x1 - 0.04, y0 + 0.045);
      }
      if (!S) {
        g.moveTo(x0 + 0.04, y1 - 0.045);
        g.lineTo(x1 - 0.04, y1 - 0.045);
      }
      if (!W) {
        g.moveTo(x0 + 0.045, y0 + 0.04);
        g.lineTo(x0 + 0.045, y1 - 0.04);
      }
      if (!E) {
        g.moveTo(x1 - 0.045, y0 + 0.04);
        g.lineTo(x1 - 0.045, y1 - 0.04);
      }
      g.stroke();
    }
    // corner capstones on exposed corners
    const caps: [number, number][] = [];
    if (!N && !W) caps.push([x0 + 0.075, y0 + 0.075]);
    if (!N && !E) caps.push([x1 - 0.075, y0 + 0.075]);
    if (!S && !W) caps.push([x0 + 0.075, y1 - 0.075]);
    if (!S && !E) caps.push([x1 - 0.075, y1 - 0.075]);
    if (L >= 1)
      for (const [x, y] of caps) {
        g.beginPath();
        g.rect(x - 0.06, y - 0.06, 0.12, 0.12);
        fo(g, shade(SAND, 0.4), 0.012);
        if (L >= 2) sunGlyph(g, x, y, 0.025, 8, GOLD_LIGHT);
        else {
          circle(g, x, y, 0.025);
          fo(g, TERRA, 0.008);
        }
      }
    g.strokeStyle = OUT;
    g.lineWidth = 0.018;
    g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  });
}

function sandwall(c: C, b: Building, game: Game, t: number) {
  const nb = (dx: number, dy: number) =>
    typeof game?.buildingAtTile === 'function' && game.buildingAtTile(b.x + dx, b.y + dy)?.def.id === 'sandwall';
  const mask = (nb(0, -1) ? 1 : 0) | (nb(1, 0) ? 2 : 0) | (nb(0, 1) ? 4 : 0) | (nb(-1, 0) ? 8 : 0);
  c.drawImage(wallCanvas(c, mask, b.level), b.x - 0.05, b.y - 0.36, 1.2, 1.5);
  if (b.level >= 2) glow(c, b.x + 0.5, b.y + 0.25, 0.5, GOLD_LIGHT, 0.08 + 0.03 * Math.sin(t * 2 + b.x));
  if (b.hp < b.maxHp * 0.5) {
    c.strokeStyle = 'rgba(70,36,12,0.9)';
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(b.x + 0.32, b.y + 0.0);
    c.lineTo(b.x + 0.4, b.y + 0.18);
    c.lineTo(b.x + 0.34, b.y + 0.34);
    c.lineTo(b.x + 0.42, b.y + 0.5);
    c.stroke();
    c.fillStyle = SAND_DARK;
    circle(c, b.x + 0.62, b.y + 0.93, 0.03);
    c.fill();
    circle(c, b.x + 0.7, b.y + 0.9, 0.02);
    c.fill();
  }
}

// ------------------------------------------------------------------ slinger post

function slingTower(c: C, L: number) {
  // local origin = tile centre
  return cached(`sling|${L}`, pxOf(c), -0.35, -0.75, 0.7, 1.05, (g) => {
    const by = 0.24,
      ty = -0.2 - L * 0.05;
    // tapered tower body
    g.beginPath();
    g.moveTo(-0.24, by);
    g.lineTo(-0.2, ty);
    g.lineTo(0.2, ty);
    g.lineTo(0.24, by);
    g.closePath();
    fo(g, hGrad(g, -0.24, 0.24, SAND_MID), 0.02);
    g.strokeStyle = 'rgba(80,46,16,0.4)';
    g.lineWidth = 0.008;
    g.beginPath();
    const rows = 4 + L;
    for (let r = 1; r < rows; r++) {
      const y = ty + ((by - ty) * r) / rows;
      const w = 0.2 + 0.04 * ((y - ty) / (by - ty));
      g.moveTo(-w, y);
      g.lineTo(w, y);
      const off = r % 2 ? 0.07 : -0.05;
      g.moveTo(off, y);
      g.lineTo(off, y + (by - ty) / rows);
    }
    g.stroke();
    // arched window slit
    g.beginPath();
    g.moveTo(-0.035, by - 0.08);
    g.lineTo(-0.035, by - 0.2);
    g.arc(0, by - 0.2, 0.035, Math.PI, 0);
    g.lineTo(0.035, by - 0.08);
    g.closePath();
    fo(g, DEEP, 0.012);
    if (L >= 1) {
      // striped hanging banner
      const bx = -0.13,
        bw = 0.08;
      for (let i = 0; i < 5; i++) {
        g.fillStyle = i % 2 ? '#f6ead0' : TERRA;
        g.fillRect(bx, ty + 0.06 + i * 0.045, bw, 0.045);
      }
      g.beginPath();
      g.moveTo(bx, ty + 0.06);
      g.lineTo(bx + bw, ty + 0.06);
      g.lineTo(bx + bw, ty + 0.285);
      g.lineTo(bx + bw / 2, ty + 0.25);
      g.lineTo(bx, ty + 0.285);
      g.closePath();
      g.strokeStyle = OUT;
      g.lineWidth = 0.01;
      g.stroke();
    }
    // platform top
    g.beginPath();
    g.rect(-0.23, ty - 0.15, 0.46, 0.15);
    const pg = g.createLinearGradient(0, ty - 0.15, 0, ty);
    pg.addColorStop(0, shade(SAND, 0.2));
    pg.addColorStop(1, SAND_MID);
    fo(g, pg, 0.018);
    // back merlons
    for (const x of [-0.2, -0.06, 0.08]) {
      g.beginPath();
      g.rect(x, ty - 0.21, 0.11, 0.07);
      fo(g, hGrad(g, x, x + 0.11, SAND_MID), 0.012);
    }
    if (L >= 2) {
      // pennant pole with a sun disc
      g.strokeStyle = BRONZE_DARK;
      g.lineWidth = 0.018;
      g.beginPath();
      g.moveTo(0.19, ty - 0.14);
      g.lineTo(0.19, ty - 0.52);
      g.stroke();
      sunGlyph(g, 0.19, ty - 0.55, 0.03, 10, GOLD_LIGHT);
    }
  });
}

function slingParapet(c: C, L: number) {
  return cached(`slingp|${L}`, pxOf(c), -0.3, -0.42, 0.6, 0.2, (g) => {
    const ty = -0.2 - L * 0.05;
    g.beginPath();
    g.rect(-0.24, ty - 0.035, 0.48, 0.04);
    fo(g, SAND_MID, 0.014);
    for (const x of [-0.24, -0.06, 0.13]) {
      g.beginPath();
      g.rect(x, ty - 0.1, 0.11, 0.08);
      fo(g, hGrad(g, x, x + 0.11, shade(SAND, 0.05)), 0.013);
      if (L >= 1) {
        g.fillStyle = TURQ;
        g.fillRect(x + 0.04, ty - 0.075, 0.03, 0.03);
      }
    }
  });
}

function slinger(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const ty = cy - 0.2 - L * 0.05;
  c.drawImage(slingTower(c, L), cx - 0.35, cy - 0.75, 0.7, 1.05);
  if (L >= 2) {
    // pennant flutter
    const px = cx + 0.19,
      py = ty - 0.5;
    const w = Math.sin(t * 5 + b.uid) * 0.03;
    c.beginPath();
    c.moveTo(px, py);
    c.quadraticCurveTo(px - 0.1, py + 0.02 + w, px - 0.2, py + 0.04 + w * 1.5);
    c.lineTo(px, py + 0.09);
    c.closePath();
    fo(c, TURQ, 0.01);
  }
  // the slinger: robed figure on the platform
  const facing = Math.cos(b.angle) >= 0 ? 1 : -1;
  const fx = cx - facing * 0.02,
    fy = ty - 0.06;
  c.beginPath();
  c.moveTo(fx - 0.06, fy);
  c.quadraticCurveTo(fx - 0.075, fy - 0.1, fx - 0.04, fy - 0.17);
  c.lineTo(fx + 0.04, fy - 0.17);
  c.quadraticCurveTo(fx + 0.075, fy - 0.1, fx + 0.06, fy);
  c.closePath();
  fo(c, hGrad(c, fx - 0.07, fx + 0.07, TERRA), 0.014);
  // sash
  c.strokeStyle = TURQ;
  c.lineWidth = 0.018;
  c.beginPath();
  c.moveTo(fx - 0.05, fy - 0.15);
  c.lineTo(fx + 0.05, fy - 0.07);
  c.stroke();
  // head with wrapped headcloth
  circle(c, fx, fy - 0.215, 0.05);
  fo(c, '#b8794a', 0.012);
  c.beginPath();
  c.arc(fx, fy - 0.225, 0.054, Math.PI * 0.95, Math.PI * 2.05);
  c.closePath();
  fo(c, '#f6ecd6', 0.012);
  c.fillStyle = '#f6ecd6';
  c.beginPath();
  c.moveTo(fx - facing * 0.04, fy - 0.23);
  c.quadraticCurveTo(fx - facing * 0.1, fy - 0.2, fx - facing * 0.09, fy - 0.15);
  c.lineTo(fx - facing * 0.06, fy - 0.19);
  c.closePath();
  c.fill();
  // sling arm
  const sx = fx + facing * 0.045,
    sy = fy - 0.15;
  c.lineCap = 'round';
  if (b.recoil > 0.05) {
    // just let fly: arm thrown out toward the target, cord trailing
    const dx = Math.cos(b.angle),
      dy = Math.sin(b.angle) * 0.6;
    const hx = sx + dx * 0.12,
      hy = sy + dy * 0.12 - 0.02;
    c.strokeStyle = '#b8794a';
    c.lineWidth = 0.028;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(hx, hy);
    c.stroke();
    c.strokeStyle = '#5a3a1a';
    c.lineWidth = 0.009;
    c.beginPath();
    c.moveTo(hx, hy);
    c.quadraticCurveTo(hx + dx * 0.08, hy + 0.06, hx + dx * 0.02, hy + 0.12);
    c.stroke();
    glow(c, hx + dx * 0.1, hy + dy * 0.1, 0.12, GOLD_LIGHT, b.recoil * 0.5);
  } else {
    // whirling overhead
    const hx = sx,
      hy = sy - 0.11;
    c.strokeStyle = '#b8794a';
    c.lineWidth = 0.028;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(hx, hy);
    c.stroke();
    const w = t * 13 + b.uid;
    const rx = 0.15,
      ry = 0.05;
    c.strokeStyle = 'rgba(255,240,210,0.35)';
    c.lineWidth = 0.012;
    c.beginPath();
    c.ellipse(hx, hy - 0.02, rx, ry, 0, w - 1.6, w);
    c.stroke();
    const px = hx + Math.cos(w) * rx,
      py = hy - 0.02 + Math.sin(w) * ry;
    c.strokeStyle = '#5a3a1a';
    c.lineWidth = 0.009;
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(px, py);
    c.stroke();
    circle(c, px, py, 0.026);
    fo(c, '#8a8070', 0.008);
  }
  c.drawImage(slingParapet(c, L), cx - 0.3, cy - 0.42, 0.6, 0.2);
}

// ------------------------------------------------------------------ quicksand pit (trap)

function quicksandCanvas(c: C, L: number) {
  return cached(`qsand|${L}`, pxOf(c), 0, 0, 1, 1, (g) => {
    const cx = 0.5,
      cy = 0.5;
    // damp sunken sand, lighter dry lip
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * TAU;
      const r = 0.43 * (1 + 0.06 * (hash(i % 20 + 40) - 0.5));
      const x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r * 0.86;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    g.fillStyle = shade(SAND, 0.2);
    g.fill();
    ell(g, cx, cy + 0.01, 0.36, 0.3);
    const pg = g.createRadialGradient(cx, cy + 0.02, 0.02, cx, cy, 0.37);
    pg.addColorStop(0, '#5a3e20');
    pg.addColorStop(0.45, '#9a7444');
    pg.addColorStop(1, '#c49c62');
    g.fillStyle = pg;
    g.fill();
    g.strokeStyle = 'rgba(100,64,28,0.6)';
    g.lineWidth = 0.014;
    g.stroke();
    if (L >= 1) {
      // half-buried rocks round the rim
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.3;
        const x = cx + Math.cos(a) * 0.42,
          y = cy + Math.sin(a) * 0.36;
        ell(g, x, y, 0.045, 0.03);
        fo(g, i % 2 ? SAND_MID : shade(SAND_MID, -0.12), 0.01);
      }
    }
    if (L >= 2) {
      // bronze warning stakes topped with turquoise
      for (const [x, y] of [
        [0.1, 0.12],
        [0.9, 0.12],
        [0.1, 0.84],
        [0.9, 0.84],
      ]) {
        g.strokeStyle = BRONZE_DARK;
        g.lineWidth = 0.022;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x, y + 0.04);
        g.lineTo(x, y - 0.06);
        g.stroke();
        circle(g, x, y - 0.07, 0.022);
        fo(g, TURQ, 0.008, TURQ_DARK);
      }
    }
  });
}

function spiral(c: C, cx: number, cy: number, r0: number, r1: number, arms: number, phase: number, turn: number, sy: number) {
  c.beginPath();
  for (let i = 0; i < arms; i++) {
    const a0 = phase + (i / arms) * TAU;
    for (let s = 0; s <= 10; s++) {
      const k = s / 10;
      const r = r1 - (r1 - r0) * k;
      const a = a0 + k * turn;
      const x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r * sy;
      s ? c.lineTo(x, y) : c.moveTo(x, y);
    }
  }
}

function quicksand(c: C, b: Building, t: number) {
  c.drawImage(quicksandCanvas(c, b.level), b.x, b.y, 1, 1);
  const cx = b.x + 0.5,
    cy = b.y + 0.51;
  const f = Math.min(1, b.firing * 2);
  c.lineCap = 'round';
  // slow ever-present swirl
  spiral(c, cx, cy, 0.05, 0.33, 3, t * 1.1 + b.uid, 2.6, 0.83);
  c.strokeStyle = 'rgba(70,44,18,0.45)';
  c.lineWidth = 0.03;
  c.stroke();
  spiral(c, cx - 0.01, cy - 0.01, 0.05, 0.33, 3, t * 1.1 + b.uid, 2.6, 0.83);
  c.strokeStyle = 'rgba(240,215,160,0.45)';
  c.lineWidth = 0.012;
  c.stroke();
  if (f > 0) {
    // churning hard while something sinks
    spiral(c, cx, cy, 0.03, 0.36, 4, t * 5.5, 3.4, 0.83);
    c.strokeStyle = rgba('#fff0c8', 0.55 * f);
    c.lineWidth = 0.016;
    c.stroke();
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.6 + i / 6) % 1;
      const a = i * 1.7 + p * 5;
      const r = 0.34 * (1 - p);
      c.fillStyle = rgba(SAND, 0.8 * f * (1 - p * 0.5));
      circle(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.83, 0.016);
      c.fill();
    }
  }
  // the sucking centre
  ell(c, cx, cy, 0.07 + f * 0.02, 0.05 + f * 0.015);
  c.fillStyle = 'rgba(40,24,8,0.7)';
  c.fill();
}

// ------------------------------------------------------------------ cistern with a shaduf (eco)

function cisternBody(c: C, L: number) {
  // local origin = tile centre
  return cached(`cistern|${L}`, pxOf(c), -0.5, -0.25, 1.0, 0.65, (g) => {
    const rx = 0.34 + L * 0.02,
      ry = 0.19 + L * 0.01,
      ty = 0.08,
      h = 0.14;
    g.fillStyle = SHADOW;
    ell(g, 0.06, ty + h + 0.04, rx + 0.04, ry * 0.8);
    g.fill();
    // cylinder wall
    g.beginPath();
    g.ellipse(0, ty + h, rx, ry, 0, 0, Math.PI);
    g.lineTo(-rx, ty);
    g.ellipse(0, ty, rx, ry, 0, Math.PI, 0, true);
    g.closePath();
    fo(g, hGrad(g, -rx, rx, SAND_MID), 0.02);
    // stone courses on the wall
    g.strokeStyle = 'rgba(80,46,16,0.4)';
    g.lineWidth = 0.008;
    g.beginPath();
    g.ellipse(0, ty + h * 0.5, rx, ry, 0, 0.1, Math.PI - 0.1);
    g.stroke();
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = 0.25 + (i / 5) * (Math.PI - 0.5);
      const x = Math.cos(a) * rx,
        y = Math.sin(a) * ry;
      const off = i % 2 ? 0 : h * 0.5;
      g.moveTo(x, ty + y + off);
      g.lineTo(x, ty + y + off + h * 0.5);
    }
    g.stroke();
    if (L >= 1) {
      // glazed tile band
      for (let i = 0; i < 12; i++) {
        const a0 = 0.12 + (i / 12) * (Math.PI - 0.24),
          a1 = a0 + (Math.PI - 0.24) / 12;
        g.beginPath();
        g.ellipse(0, ty + h * 0.32, rx * 1.002, ry, 0, a0, a1);
        g.ellipse(0, ty + h * 0.62, rx * 1.002, ry, 0, a1, a0, true);
        g.closePath();
        g.fillStyle = i % 2 ? TURQ : TURQ_LIGHT;
        g.fill();
      }
    }
    // rim
    ell(g, 0, ty, rx, ry);
    fo(g, L >= 2 ? goldG(g, -rx, ty - ry, rx, ty + ry) : shade(SAND, 0.2), 0.02);
    // water
    ell(g, 0, ty + 0.01, rx - 0.05, ry - 0.035);
    const wg = g.createRadialGradient(-0.05, ty, 0.02, 0, ty, rx);
    wg.addColorStop(0, TURQ_LIGHT);
    wg.addColorStop(0.5, TURQ);
    wg.addColorStop(1, TURQ_DARK);
    fo(g, wg, 0.014, 'rgba(10,60,64,0.8)');
  });
}

function cistern(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  if (L >= 2) palm(c, cx + 0.34, cy + 0.05, 0.72, -0.06, t, b.uid);
  // shaduf post at the back left
  const px = cx - 0.27,
    pyTop = cy - 0.46 - L * 0.03;
  c.strokeStyle = OUT;
  c.lineWidth = 0.05;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px, cy + 0.04);
  c.lineTo(px, pyTop);
  c.stroke();
  c.strokeStyle = '#a8743e';
  c.lineWidth = 0.034;
  c.stroke();
  c.drawImage(cisternBody(c, L), cx - 0.5, cy - 0.25, 1.0, 0.65);
  const wy = cy + 0.09;
  // glints and ripples
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.5 + i / 3 + hash(b.uid + i) * 0.2) % 1;
    c.strokeStyle = rgba('#ffffff', 0.5 * (1 - p));
    c.lineWidth = 0.008;
    ell(c, cx + 0.04, wy, 0.04 + p * 0.2, (0.04 + p * 0.2) * 0.5);
    c.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const a = Math.max(0, Math.sin(t * 2.3 + i * 2.1 + b.uid));
    sparkle(c, cx - 0.15 + i * 0.12, wy - 0.03 + (i % 2) * 0.05, 0.03, '#ffffff', a * 0.9);
  }
  // swinging beam, bucket on the long arm
  const phi = 0.05 + 0.32 * Math.sin(t * 1.2 + b.uid);
  const dx = Math.cos(phi),
    dy = Math.sin(phi);
  const ex = px + dx * 0.55,
    ey = pyTop + dy * 0.55;
  const wx = px - dx * 0.2,
    wyy = pyTop - dy * 0.2;
  c.strokeStyle = OUT;
  c.lineWidth = 0.034;
  c.beginPath();
  c.moveTo(wx, wyy);
  c.lineTo(ex, ey);
  c.stroke();
  c.strokeStyle = '#c08a4e';
  c.lineWidth = 0.02;
  c.stroke();
  circle(c, px, pyTop, 0.022);
  fo(c, BRONZE, 0.008);
  // counterweight stone
  circle(c, wx - 0.01, wyy + 0.04, 0.05);
  fo(c, '#8a7a66', 0.012);
  // rope and bucket
  const bx = ex,
    by = ey + 0.2;
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = 0.008;
  c.beginPath();
  c.moveTo(ex, ey);
  c.lineTo(bx, by);
  c.stroke();
  c.beginPath();
  c.moveTo(bx - 0.045, by);
  c.lineTo(bx + 0.045, by);
  c.lineTo(bx + 0.035, by + 0.065);
  c.lineTo(bx - 0.035, by + 0.065);
  c.closePath();
  fo(c, L >= 1 ? bronze(c, bx - 0.04, by, bx + 0.04, by) : '#8a5a2e', 0.01);
  // drips falling from the rising bucket
  if (Math.cos(t * 1.2 + b.uid) < 0) {
    for (let i = 0; i < 2; i++) {
      const p = (t * 2.5 + i * 0.5) % 1;
      c.fillStyle = rgba(TURQ_LIGHT, 0.9 * (1 - p));
      circle(c, bx + (i - 0.5) * 0.03, by + 0.07 + p * 0.12, 0.012);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ sun mirror

function mirror(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const hy = cy - 0.4 - L * 0.03;
  // tripod
  c.lineCap = 'round';
  for (const [lw, col] of [
    [0.04, OUT],
    [0.026, BRONZE],
  ] as const) {
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.beginPath();
    for (const [dx, dy] of [
      [-0.24, 0.14],
      [0.24, 0.14],
      [0.02, 0.24],
    ]) {
      c.moveTo(cx, hy + 0.14);
      c.lineTo(cx + dx, cy + dy);
    }
    c.moveTo(cx, hy + 0.14);
    c.lineTo(cx, hy);
    c.stroke();
  }
  circle(c, cx, hy + 0.14, 0.035);
  fo(c, bronze(c, cx - 0.03, hy + 0.1, cx + 0.03, hy + 0.18), 0.01);
  const A = dishAxes(0.23 + L * 0.03, b.angle, 0.35);
  const f = Math.min(1, b.firing * 3);
  mirrorDisc(c, cx, hy, A, 0.035, L >= 2 ? GOLD : BRONZE_LIGHT, L >= 2, f);
  if (L >= 1) {
    const top = hy + A.vy * 1.12,
      tx = cx + A.vx * 1.12;
    sunGlyph(c, tx, top, 0.03, 10, GOLD_LIGHT);
  }
  if (f > 0) {
    const gx = cx + A.nx * 0.05,
      gy = hy + A.ny * 0.05;
    glow(c, gx, gy, 0.45, '#fff6c0', 0.75 * f);
    sparkle(c, gx, gy, 0.22 * f + 0.05, '#ffffff', f);
  } else if (A.front) {
    sparkle(c, cx - 0.06, hy - 0.04, 0.05, '#ffffff', 0.5 + 0.5 * Math.sin(t * 2.6 + b.uid));
  }
}

// ------------------------------------------------------------------ sandblaster

function sandblaster(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const ty = cy - 0.06;
  const f = Math.min(1, b.firing * 2);
  // turntable
  ell(c, cx, ty + 0.05, 0.3, 0.16);
  fo(c, SAND_DARK, 0.016);
  ell(c, cx, ty, 0.3, 0.16);
  fo(c, hGrad(c, cx - 0.3, cx + 0.3, '#a8743e'), 0.016);
  c.strokeStyle = rgba(BRONZE_DARK, 0.7);
  c.lineWidth = 0.01;
  ell(c, cx, ty, 0.24, 0.125);
  c.stroke();
  c.save();
  c.translate(cx, ty - 0.08);
  c.rotate(b.angle);
  // bellows: two boards hinged at the front, pleated leather between, pumping
  const pump = 0.5 + 0.5 * Math.sin(t * (4 + f * 8) + b.uid);
  const open = 0.09 + pump * (0.04 + f * 0.05);
  c.beginPath();
  c.moveTo(-0.08, -0.05);
  c.lineTo(-0.36, -open - 0.02);
  c.lineTo(-0.36, open + 0.02);
  c.lineTo(-0.08, 0.05);
  c.closePath();
  fo(c, '#7a4a26', 0.016);
  c.strokeStyle = 'rgba(30,14,4,0.6)';
  c.lineWidth = 0.008;
  c.beginPath();
  for (let i = 1; i <= 4; i++) {
    const x = -0.08 - i * 0.056;
    const w = 0.05 + (open + 0.02 - 0.05) * (i / 5);
    c.moveTo(x, -w);
    c.lineTo(x, w);
  }
  c.stroke();
  // boards (top board seen)
  c.beginPath();
  c.moveTo(-0.08, -0.04);
  c.lineTo(-0.38, -open * 0.45);
  c.lineTo(-0.38, open * 0.45);
  c.lineTo(-0.08, 0.04);
  c.closePath();
  fo(c, hGrad(c, -0.38, -0.08, '#c89458'), 0.014);
  // handles
  c.strokeStyle = BRONZE_DARK;
  c.lineWidth = 0.02;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-0.38, 0);
  c.lineTo(-0.46, 0);
  c.stroke();
  // grit hopper drum
  circle(c, 0, 0, 0.12);
  fo(c, bronze(c, -0.12, -0.12, 0.12, 0.12), 0.016);
  circle(c, 0, 0, 0.08);
  const sg = c.createRadialGradient(-0.02, -0.02, 0.01, 0, 0, 0.08);
  sg.addColorStop(0, shade(SAND, 0.2));
  sg.addColorStop(1, SAND_DARK);
  fo(c, sg, 0.01);
  if (L >= 2) {
    c.strokeStyle = GOLD;
    c.lineWidth = 0.014;
    circle(c, 0, 0, 0.1);
    c.stroke();
  }
  // flaring nozzle horn
  const mw = 0.1 + L * 0.012;
  c.beginPath();
  c.moveTo(0.08, -0.04);
  c.quadraticCurveTo(0.28, -0.04, 0.42, -mw);
  c.lineTo(0.42, mw);
  c.quadraticCurveTo(0.28, 0.04, 0.08, 0.04);
  c.closePath();
  fo(c, bronze(c, 0, -mw, 0, mw), 0.016);
  if (L >= 1) {
    c.strokeStyle = GOLD_DARK;
    c.lineWidth = 0.014;
    c.beginPath();
    c.moveTo(0.2, -0.05);
    c.lineTo(0.2, 0.05);
    c.moveTo(0.3, -0.065);
    c.lineTo(0.3, 0.065);
    c.stroke();
  }
  ell(c, 0.42, 0, 0.025, mw);
  fo(c, L >= 2 ? GOLD_LIGHT : BRONZE_LIGHT, 0.012);
  c.fillStyle = 'rgba(30,14,4,0.8)';
  ell(c, 0.425, 0, 0.012, mw * 0.7);
  c.fill();
  // swirling grit at the mouth
  if (f > 0) {
    for (let i = 0; i < 9; i++) {
      const p = (t * 2.2 + i / 9) % 1;
      const sw = Math.sin(t * 9 + i * 2.3);
      const x = 0.45 + p * 0.4,
        y = sw * (0.04 + p * 0.18);
      c.fillStyle = rgba(i % 3 ? SAND : '#fff3d8', 0.75 * f * (1 - p));
      circle(c, x, y, 0.03 + p * 0.06);
      c.fill();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ naphtha thrower

function naphtha(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.02;
  // oil jars at the base
  const jars: [number, number][] =
    L >= 1
      ? [
          [-0.27, 0.14],
          [0.29, 0.12],
          [0.2, 0.22],
        ]
      : [
          [-0.27, 0.14],
          [0.29, 0.12],
        ];
  for (const [jx, jy] of jars) {
    const x = cx + jx,
      y = cy + jy;
    c.beginPath();
    c.moveTo(x - 0.03, y - 0.13);
    c.quadraticCurveTo(x - 0.1, y - 0.08, x - 0.07, y);
    c.quadraticCurveTo(x, y + 0.04, x + 0.07, y);
    c.quadraticCurveTo(x + 0.1, y - 0.08, x + 0.03, y - 0.13);
    c.closePath();
    fo(c, hGrad(c, x - 0.08, x + 0.08, TERRA), 0.012);
    c.strokeStyle = rgba(TERRA_DARK, 0.7);
    c.lineWidth = 0.008;
    c.beginPath();
    c.moveTo(x - 0.075, y - 0.06);
    c.lineTo(x + 0.075, y - 0.06);
    c.stroke();
    circle(c, x, y - 0.14, 0.025);
    fo(c, '#ffb04a', 0.008);
  }
  // stone pedestal
  ell(c, cx, by + 0.1, 0.22, 0.1);
  fo(c, SAND_DARK, 0.016);
  c.beginPath();
  c.rect(cx - 0.22, by - 0.02, 0.44, 0.12);
  c.fillStyle = hGrad(c, cx - 0.22, cx + 0.22, SAND_MID);
  c.fill();
  ell(c, cx, by - 0.02, 0.22, 0.1);
  fo(c, shade(SAND, 0.1), 0.016);
  c.strokeStyle = OUT;
  c.lineWidth = 0.016;
  c.beginPath();
  c.moveTo(cx - 0.22, by - 0.02);
  c.lineTo(cx - 0.22, by + 0.1);
  c.moveTo(cx + 0.22, by - 0.02);
  c.lineTo(cx + 0.22, by + 0.1);
  c.stroke();
  // stout mortar pot, kicked back on recoil
  const a = b.angle;
  const dx = Math.cos(a),
    dy = Math.sin(a);
  const kick = b.recoil * 0.06;
  const px = cx - dx * kick,
    py = by - 0.08 - dy * kick * 0.6 + b.recoil * 0.02;
  const mx = px + dx * 0.11,
    my = py - 0.15 + dy * 0.06;
  const w = 0.13 + L * 0.012;
  // barrel body: a fat rounded stroke from foot to mouth
  c.lineCap = 'round';
  c.strokeStyle = OUT;
  c.lineWidth = w * 2 + 0.03;
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(mx, my);
  c.stroke();
  c.strokeStyle = bronze(c, px - w, py - w, px + w, py + w);
  c.lineWidth = w * 2;
  c.stroke();
  // bands
  c.strokeStyle = L >= 1 ? GOLD_DARK : BRONZE_DARK;
  c.lineWidth = 0.018;
  for (const k of [0.25, 0.65]) {
    const bx = px + (mx - px) * k,
      byy = py + (my - py) * k;
    ell(c, bx, byy, w * 1.02, w * 0.38, Math.atan2(my - py, mx - px) + Math.PI / 2);
    c.stroke();
  }
  if (L >= 2) sunGlyph(c, px - 0.02, py - 0.02, 0.035, 10, GOLD_LIGHT);
  // mouth with glowing oil
  const ma = Math.atan2(my - py, mx - px) + Math.PI / 2;
  ell(c, mx, my, w * 0.95, w * 0.5, ma);
  fo(c, BRONZE_DARK, 0.016);
  ell(c, mx, my, w * 0.72, w * 0.35, ma);
  const og = c.createRadialGradient(mx, my, 0, mx, my, w * 0.75);
  og.addColorStop(0, '#fff2a0');
  og.addColorStop(0.5, '#ff9a30');
  og.addColorStop(1, '#a8300c');
  c.fillStyle = og;
  c.fill();
  glow(c, mx, my, 0.35, '#ff8a30', 0.35 + 0.12 * Math.sin(t * 7 + b.uid) + b.recoil * 0.4);
  // smoke puff after a lob
  if (b.recoil > 0) {
    for (let i = 0; i < 3; i++) {
      const p = 1 - b.recoil;
      c.fillStyle = rgba('#5a4a40', 0.5 * b.recoil);
      circle(c, mx + dx * 0.05 + (i - 1) * 0.05, my - 0.06 - p * 0.2 - i * 0.03, 0.05 + p * 0.06);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ sundial plaza (support)

function sundialCanvas(c: C, L: number) {
  return cached(`sundial|${L}`, pxOf(c), -0.08, -0.06, 1.16, 1.14, (g) => {
    const cx = 0.5,
      cy = 0.5;
    g.fillStyle = SHADOW;
    ell(g, cx + 0.06, cy + 0.08, 0.47, 0.41);
    g.fill();
    // low round platform
    ell(g, cx, cy + 0.06, 0.46, 0.4);
    fo(g, SAND_DARK, 0.02);
    ell(g, cx, cy, 0.46, 0.4);
    const pg = g.createLinearGradient(0, 0.1, 0, 0.9);
    pg.addColorStop(0, shade(SAND, 0.3));
    pg.addColorStop(1, SAND);
    fo(g, pg, 0.02);
    // outer ring
    g.strokeStyle = L >= 2 ? GOLD : TERRA;
    g.lineWidth = 0.02;
    ell(g, cx, cy, 0.4, 0.345);
    g.stroke();
    if (L >= 1) {
      // turquoise tile ring
      for (let i = 0; i < 24; i++) {
        const a0 = (i / 24) * TAU,
          a1 = ((i + 1) / 24) * TAU;
        g.beginPath();
        g.ellipse(cx, cy, 0.38, 0.33, 0, a0, a1);
        g.ellipse(cx, cy, 0.32, 0.275, 0, a1, a0, true);
        g.closePath();
        g.fillStyle = i % 2 ? TURQ : TURQ_LIGHT;
        g.fill();
      }
    }
    // hour marks
    g.strokeStyle = 'rgba(90,50,18,0.85)';
    g.lineWidth = 0.014;
    g.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r0 = i % 3 ? 0.25 : 0.2;
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.86);
      g.lineTo(cx + Math.cos(a) * 0.3, cy + Math.sin(a) * 0.3 * 0.86);
    }
    g.stroke();
    // little sun glyphs at the quarters
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      sunGlyph(g, cx + Math.cos(a) * 0.43, cy + Math.sin(a) * 0.43 * 0.86, 0.018, 8, L >= 2 ? GOLD_LIGHT : GOLD, GOLD_DARK, 0.86);
    }
    // inner dial
    g.strokeStyle = 'rgba(120,80,40,0.5)';
    g.lineWidth = 0.01;
    ell(g, cx, cy, 0.16, 0.14);
    g.stroke();
    if (L >= 2) {
      for (const [x, y] of [
        [0.08, 0.16],
        [0.92, 0.16],
        [0.08, 0.84],
        [0.92, 0.84],
      ]) {
        g.beginPath();
        g.rect(x - 0.04, y - 0.1, 0.08, 0.1);
        fo(g, hGrad(g, x - 0.04, x + 0.04, SAND_MID), 0.012);
        ell(g, x, y - 0.1, 0.045, 0.02);
        fo(g, GOLD_LIGHT, 0.01, GOLD_DARK);
      }
    }
  });
}

function sundial(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(sundialCanvas(c, L), b.x - 0.08, b.y - 0.06, 1.16, 1.14);
  const f = Math.min(1, b.firing);
  if (f > 0) {
    // High Noon: the dial blazes gold
    ell(c, cx, cy, 0.42, 0.36);
    c.fillStyle = rgba(GOLD_LIGHT, 0.55 * f);
    c.fill();
    glow(c, cx, cy - 0.1, 1.0, GOLD_LIGHT, 0.6 * f);
    c.save();
    c.translate(cx, cy);
    c.scale(1, 0.86);
    c.rotate(t * 0.6);
    c.fillStyle = rgba('#fff6c8', 0.5 * f);
    c.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.moveTo(Math.cos(a - 0.08) * 0.18, Math.sin(a - 0.08) * 0.18);
      c.lineTo(Math.cos(a) * (0.5 + 0.1 * f), Math.sin(a) * (0.5 + 0.1 * f));
      c.lineTo(Math.cos(a + 0.08) * 0.18, Math.sin(a + 0.08) * 0.18);
    }
    c.fill();
    c.restore();
  }
  // the gnomon's shadow sweeps the dial (it vanishes at noon)
  const s = b.spin;
  const sk = 1 - f;
  if (sk > 0) {
    const tx = cx + Math.cos(s) * 0.36,
      ty = cy + Math.sin(s) * 0.31;
    const nx = -Math.sin(s) * 0.035,
      ny = Math.cos(s) * 0.03;
    c.fillStyle = rgba('#3a2410', 0.4 * sk);
    poly(c, [
      [cx + nx, cy + ny],
      [tx, ty],
      [cx - nx, cy - ny],
    ]);
    c.fill();
  }
  // gnomon: an upright bronze blade
  const gh = 0.3 + L * 0.04;
  c.beginPath();
  c.moveTo(cx - 0.11, cy + 0.02);
  c.lineTo(cx + 0.11, cy + 0.02);
  c.lineTo(cx - 0.09, cy - gh);
  c.closePath();
  fo(c, f > 0 ? goldG(c, cx - 0.1, cy - gh, cx + 0.1, cy) : bronze(c, cx - 0.1, cy - gh, cx + 0.1, cy), 0.016);
  c.strokeStyle = 'rgba(255,230,170,0.6)';
  c.lineWidth = 0.008;
  c.beginPath();
  c.moveTo(cx - 0.085, cy - gh + 0.04);
  c.lineTo(cx + 0.08, cy + 0.0);
  c.stroke();
  ell(c, cx, cy + 0.03, 0.12, 0.04);
  fo(c, BRONZE_DARK, 0.012);
  if (L >= 1) sunGlyph(c, cx - 0.09, cy - gh - 0.03, 0.03 + f * 0.01, 10, GOLD_LIGHT);
  if (f > 0) sparkle(c, cx - 0.09, cy - gh - 0.03, 0.18 * f, '#ffffff', f);
}

// ------------------------------------------------------------------ djinn lamp

function djinnBase(c: C, L: number) {
  // local origin = tile centre
  return cached(`djinnb|${L}`, pxOf(c), -0.42, -0.62, 0.84, 0.86, (g) => {
    const top = -0.22 - L * 0.04;
    // column pedestal
    g.beginPath();
    g.rect(-0.1, top, 0.2, 0.36 - top - 0.2 + 0.0);
    fo(g, hGrad(g, -0.1, 0.1, SAND_MID), 0.016);
    g.fillStyle = TURQ;
    g.fillRect(-0.1, top + 0.08, 0.2, 0.035);
    g.fillStyle = TURQ_LIGHT;
    for (let i = 0; i < 4; i++) g.fillRect(-0.09 + i * 0.05, top + 0.087, 0.025, 0.02);
    ell(g, 0, 0.16, 0.15, 0.06);
    fo(g, SAND_DARK, 0.014);
    ell(g, 0, top, 0.15, 0.055);
    fo(g, L >= 2 ? goldG(g, -0.15, top, 0.15, top) : shade(SAND, 0.2), 0.014);
    // the lamp
    const ly = top - 0.07;
    const lampCol = L >= 2 ? GOLD : '#d9a040';
    // handle loop (left)
    g.strokeStyle = OUT;
    g.lineWidth = 0.035;
    g.beginPath();
    g.arc(-0.17, ly - 0.02, 0.06, Math.PI * 0.4, Math.PI * 1.7);
    g.stroke();
    g.strokeStyle = lampCol;
    g.lineWidth = 0.02;
    g.stroke();
    // spout (right)
    g.beginPath();
    g.moveTo(0.08, ly - 0.02);
    g.quadraticCurveTo(0.22, ly - 0.0, 0.3, ly - 0.1);
    g.lineTo(0.31, ly - 0.075);
    g.quadraticCurveTo(0.22, ly + 0.05, 0.08, ly + 0.04);
    g.closePath();
    fo(g, goldG(g, 0.08, ly - 0.1, 0.3, ly + 0.05), 0.014);
    // body
    g.beginPath();
    g.moveTo(-0.17, ly);
    g.quadraticCurveTo(-0.17, ly + 0.08, 0, ly + 0.08);
    g.quadraticCurveTo(0.17, ly + 0.08, 0.17, ly);
    g.quadraticCurveTo(0.12, ly - 0.06, 0, ly - 0.06);
    g.quadraticCurveTo(-0.12, ly - 0.06, -0.17, ly);
    g.closePath();
    const bg = g.createLinearGradient(-0.17, ly - 0.06, 0.17, ly + 0.08);
    bg.addColorStop(0, GOLD_LIGHT);
    bg.addColorStop(0.45, lampCol);
    bg.addColorStop(1, GOLD_DARK);
    fo(g, bg, 0.016);
    // foot
    g.beginPath();
    g.moveTo(-0.06, ly + 0.075);
    g.lineTo(-0.08, ly + 0.11);
    g.lineTo(0.08, ly + 0.11);
    g.lineTo(0.06, ly + 0.075);
    g.closePath();
    fo(g, GOLD_DARK, 0.01);
    // lid and finial
    g.beginPath();
    g.ellipse(-0.01, ly - 0.055, 0.07, 0.05, 0, Math.PI, 0);
    g.closePath();
    fo(g, goldG(g, -0.08, ly - 0.1, 0.06, ly - 0.05), 0.012);
    circle(g, -0.01, ly - 0.12, 0.018);
    fo(g, L >= 1 ? TURQ : GOLD_LIGHT, 0.008);
    // engraved band and gem
    g.strokeStyle = rgba(GOLD_DARK, 0.8);
    g.lineWidth = 0.008;
    g.beginPath();
    g.moveTo(-0.15, ly + 0.02);
    g.quadraticCurveTo(0, ly + 0.06, 0.15, ly + 0.02);
    g.stroke();
    if (L >= 1) {
      ell(g, 0, ly + 0.03, 0.025, 0.018);
      fo(g, TURQ_LIGHT, 0.008, TURQ_DARK);
    }
  });
}

function djinn(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const facing = Math.cos(b.angle) >= 0 ? 1 : -1;
  c.save();
  c.translate(cx, cy);
  c.scale(facing, 1);
  c.drawImage(djinnBase(c, L), -0.42, -0.62, 0.84, 0.86);
  const top = -0.22 - L * 0.04,
    ly = top - 0.07;
  const sx = 0.3,
    sy = ly - 0.1;
  const f = Math.min(1, b.firing * 1.5);
  const size = 1 + 0.12 * L + 0.35 * f;
  // the smoke-spirit coils up from the spout
  const hx = 0.08 + Math.sin(t * 1.3 + b.uid) * 0.04,
    hy = ly - (0.5 + L * 0.05) * size - 0.05;
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = sx + (hx - sx) * k + Math.sin(k * 5 - t * 3 + b.uid) * 0.09 * Math.sin(k * Math.PI) * size;
    const y = sy + (hy - sy) * k;
    const r = (0.02 + 0.075 * k * k) * size;
    c.fillStyle = rgba(i % 2 ? '#7ae0d8' : '#4ab8e0', 0.35 + 0.45 * k);
    circle(c, x, y, r);
    c.fill();
  }
  // head wisp: a teardrop flame of smoke
  const hr = 0.12 * size;
  c.beginPath();
  c.moveTo(hx, hy - hr * 2.1 + Math.sin(t * 4) * 0.02);
  c.quadraticCurveTo(hx + hr * 1.3, hy - hr * 0.6, hx + hr * 0.9, hy + hr * 0.3);
  c.quadraticCurveTo(hx, hy + hr * 1.1, hx - hr * 0.9, hy + hr * 0.3);
  c.quadraticCurveTo(hx - hr * 1.3, hy - hr * 0.6, hx, hy - hr * 2.1 + Math.sin(t * 4) * 0.02);
  const hg = c.createRadialGradient(hx - hr * 0.3, hy - hr * 0.3, 0.01, hx, hy, hr * 1.6);
  hg.addColorStop(0, 'rgba(210,255,250,0.95)');
  hg.addColorStop(0.5, 'rgba(110,220,220,0.85)');
  hg.addColorStop(1, 'rgba(40,140,190,0.75)');
  fo(c, hg, 0.014, 'rgba(20,80,110,0.7)');
  // little curling arm wisps
  c.strokeStyle = 'rgba(140,235,230,0.7)';
  c.lineWidth = 0.02 * size;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(hx + s * hr * 0.8, hy + hr * 0.2);
    c.quadraticCurveTo(hx + s * hr * 1.9, hy + hr * 0.2, hx + s * hr * 1.7, hy - hr * (0.7 + 0.3 * Math.sin(t * 3 + s)));
    c.stroke();
  }
  glow(c, hx, hy, 0.45 * size, '#7ae0d8', 0.3 + 0.4 * f);
  // two glowing eyes
  for (const s of [-1, 1]) {
    ell(c, hx + s * hr * 0.38 + 0.01, hy - hr * 0.15, hr * 0.17, hr * 0.27);
    c.fillStyle = '#ffffff';
    c.fill();
    glow(c, hx + s * hr * 0.38 + 0.01, hy - hr * 0.15, hr * 0.6, '#c0fff8', 0.6);
  }
  if (f > 0) {
    // a whirl ring spinning around the spirit
    c.strokeStyle = rgba('#c8fff6', 0.7 * f);
    c.lineWidth = 0.018;
    c.beginPath();
    c.ellipse(hx, hy + hr * 0.6, hr * 2.2, hr * 0.6, 0, t * 9, t * 9 + 4);
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ stinger ballista

function stinger(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const ty = cy - 0.06;
  const a = b.angle,
    rec = b.recoil;
  const shell = '#7a3a22';
  // segmented tail rising from the back of the turret, arching over toward the aim
  const tail = () => {
    const dx = Math.cos(a),
      dy = Math.sin(a);
    const rx = cx - dx * 0.22,
      ry = ty - 0.1 - dy * 0.12;
    const fd = dx >= 0 ? 1 : -1;
    const strike = rec * 0.5;
    const pts: [number, number][] = [];
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const ang = Math.PI * (0.08 + k * (0.78 + strike * 0.3));
      const R = 0.2 + L * 0.02;
      pts.push([rx + fd * (1 - Math.cos(ang)) * R * 0.55, ry - Math.sin(ang) * R * 1.5 - k * 0.08]);
    }
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = OUT;
    c.lineWidth = 0.09;
    c.lineCap = 'round';
    c.stroke();
    c.strokeStyle = shade(shell, -0.2);
    c.lineWidth = 0.06;
    c.stroke();
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      const r = 0.06 - i * 0.006;
      ell(c, x, y, r, r * 0.85);
      fo(c, i % 2 ? shell : shade(shell, 0.1), 0.014);
      c.fillStyle = 'rgba(255,200,150,0.35)';
      ell(c, x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.2);
      c.fill();
    }
    // venom bulb and barb
    const [bx, by] = pts[n];
    ell(c, bx, by, 0.055, 0.045);
    fo(c, '#9a5a2a', 0.014);
    c.beginPath();
    c.moveTo(bx + fd * 0.03, by - 0.02);
    c.quadraticCurveTo(bx + fd * 0.11, by - 0.0, bx + fd * 0.1, by + 0.09);
    c.lineTo(bx + fd * 0.04, by + 0.03);
    c.closePath();
    fo(c, '#2a1a10', 0.01);
    const drip = (t * 0.8 + b.uid * 0.1) % 1;
    c.fillStyle = rgba('#a8ff3a', 0.9 * (1 - drip));
    circle(c, bx + fd * 0.1, by + 0.1 + drip * 0.08, 0.014);
    c.fill();
    glow(c, bx + fd * 0.08, by + 0.07, 0.12, '#a8ff3a', 0.4);
  };
  // turntable
  ell(c, cx, ty + 0.05, 0.3, 0.16);
  fo(c, SAND_DARK, 0.016);
  ell(c, cx, ty, 0.3, 0.16);
  fo(c, hGrad(c, cx - 0.3, cx + 0.3, SAND_MID), 0.016);
  if (L >= 1) {
    c.strokeStyle = TURQ;
    c.lineWidth = 0.014;
    ell(c, cx, ty, 0.25, 0.13);
    c.stroke();
  }
  const behind = Math.sin(a) > 0;
  if (behind) tail();
  c.save();
  c.translate(cx, ty - 0.06);
  c.rotate(a);
  // carapace stock: overlapping plates
  for (let i = 0; i < 4; i++) {
    const x = -0.24 + i * 0.13;
    ell(c, x, 0, 0.09, 0.07 - i * 0.005);
    fo(c, shell, 0.014);
    c.fillStyle = 'rgba(255,200,150,0.3)';
    ell(c, x - 0.01, -0.03, 0.06, 0.025);
    c.fill();
  }
  // bow arms ending in pincers
  const span = 0.4 + L * 0.05;
  const flex = 0.07 + (1 - rec) * 0.05;
  c.strokeStyle = OUT;
  c.lineWidth = 0.06;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0.04, -span);
  c.quadraticCurveTo(0.2, -span * 0.4, 0.14, 0);
  c.quadraticCurveTo(0.2, span * 0.4, 0.04, span);
  c.stroke();
  c.strokeStyle = metal(c, 0, -span, 0, span, shade(shell, 0.35), shell, shade(shell, 0.35));
  c.lineWidth = 0.04;
  c.stroke();
  for (const s of [-1, 1]) {
    const px = 0.04,
      py = s * span;
    c.fillStyle = shade(shell, -0.1);
    c.beginPath();
    c.moveTo(px, py);
    c.quadraticCurveTo(px + 0.1, py + s * 0.03, px + 0.12, py - s * 0.05);
    c.quadraticCurveTo(px + 0.06, py - s * 0.0, px + 0.02, py - s * 0.03);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(px, py);
    c.quadraticCurveTo(px - 0.08, py + s * 0.06, px - 0.04, py + s * 0.1);
    c.lineTo(px + 0.01, py + s * 0.03);
    c.closePath();
    c.fill();
    c.strokeStyle = OUT;
    c.lineWidth = 0.01;
    c.stroke();
  }
  // string
  const sx = 0.04 - flex - (1 - rec) * 0.12;
  c.strokeStyle = 'rgba(240,225,190,0.95)';
  c.lineWidth = 0.012;
  c.beginPath();
  c.moveTo(0.04, -span);
  c.lineTo(sx, 0);
  c.lineTo(0.04, span);
  c.stroke();
  // venom-tipped bolt
  if (rec < 0.4) {
    c.strokeStyle = '#d8c090';
    c.lineWidth = 0.022;
    c.beginPath();
    c.moveTo(sx, 0);
    c.lineTo(0.42, 0);
    c.stroke();
    c.fillStyle = '#9aff3a';
    poly(c, [
      [0.42, -0.04],
      [0.55, 0],
      [0.42, 0.04],
    ]);
    c.fill();
    c.strokeStyle = '#3a6a10';
    c.lineWidth = 0.008;
    c.stroke();
    glow(c, 0.48, 0, 0.12, '#a8ff3a', 0.5);
  }
  if (L >= 2) {
    c.fillStyle = GOLD_LIGHT;
    circle(c, -0.24, 0, 0.025);
    c.fill();
  }
  c.restore();
  if (!behind) tail();
}

// ------------------------------------------------------------------ great sun mirror

function zigguratCanvas(c: C, L: number) {
  // local origin = tile centre
  return cached(`zig|${L}`, pxOf(c), -0.72, -0.62, 1.44, 1.14, (g) => {
    g.fillStyle = SHADOW;
    g.fillRect(-0.58, -0.3, 1.3, 0.82);
    for (let i = 0; i < 3; i++) {
      const hw = 0.62 - i * 0.15;
      const yb = 0.44 - i * 0.17;
      const fh = 0.12;
      const depth = 0.62 - i * 0.14;
      const yt = yb - fh;
      // top face
      g.beginPath();
      g.rect(-hw, yt - depth, hw * 2, depth);
      const tg = g.createLinearGradient(0, yt - depth, 0, yt);
      tg.addColorStop(0, shade(SAND, 0.3));
      tg.addColorStop(1, SAND);
      fo(g, tg, 0.018);
      // front face
      g.beginPath();
      g.rect(-hw, yt, hw * 2, fh);
      fo(g, hGrad(g, -hw, hw, SAND_MID, 0.12), 0.018);
      g.strokeStyle = 'rgba(80,46,16,0.4)';
      g.lineWidth = 0.008;
      g.beginPath();
      g.moveTo(-hw, yt + fh / 2);
      g.lineTo(hw, yt + fh / 2);
      for (let x = -hw + 0.12; x < hw; x += 0.16) {
        g.moveTo(x, yt);
        g.lineTo(x, yt + fh / 2);
        g.moveTo(x + 0.08, yt + fh / 2);
        g.lineTo(x + 0.08, yt + fh);
      }
      g.stroke();
      // trim bands
      if (i === 2 || L >= 1) {
        g.fillStyle = i === 2 ? TURQ : TERRA;
        g.fillRect(-hw, yt + 0.012, hw * 2, 0.022);
        if (i === 2) {
          g.fillStyle = TURQ_LIGHT;
          for (let x = -hw + 0.02; x < hw - 0.02; x += 0.06) g.fillRect(x, yt + 0.016, 0.03, 0.014);
        }
      }
      if (L >= 2) {
        g.fillStyle = goldG(g, 0, yt - 0.01, 0, yt + 0.01);
        g.fillRect(-hw, yt - 0.012, hw * 2, 0.016);
      }
    }
    // central stair
    const sw = 0.12;
    for (let k = 0; k < 7; k++) {
      const y0 = 0.44 - k * 0.07;
      g.beginPath();
      g.rect(-sw, y0 - 0.07, sw * 2, 0.07);
      g.fillStyle = k % 2 ? shade(SAND, 0.15) : SAND_MID;
      g.fill();
    }
    g.strokeStyle = OUT;
    g.lineWidth = 0.016;
    g.strokeRect(-sw, 0.44 - 0.49, sw * 2, 0.49);
    g.strokeStyle = 'rgba(80,46,16,0.45)';
    g.lineWidth = 0.007;
    g.beginPath();
    for (let k = 1; k < 7; k++) {
      g.moveTo(-sw, 0.44 - k * 0.07);
      g.lineTo(sw, 0.44 - k * 0.07);
    }
    g.stroke();
    // corner braziers on the bottom step
    if (L >= 1) {
      for (const s of [-1, 1]) {
        const x = s * 0.5,
          y = 0.2;
        g.beginPath();
        g.rect(x - 0.04, y - 0.1, 0.08, 0.1);
        fo(g, hGrad(g, x - 0.04, x + 0.04, SAND_MID), 0.012);
        ell(g, x, y - 0.1, 0.06, 0.025);
        fo(g, bronze(g, x - 0.06, y - 0.12, x + 0.06, y - 0.08), 0.01);
      }
    }
  });
}

function greatmirror(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(zigguratCanvas(c, L), cx - 0.72, cy - 0.62, 1.44, 1.14);
  if (L >= 1) {
    for (const s of [-1, 1]) {
      const x = cx + s * 0.5,
        y = cy + 0.08;
      glow(c, x, y - 0.02, 0.18, '#ffb050', 0.5);
      c.fillStyle = rgba('#ffd070', 0.9);
      c.beginPath();
      c.moveTo(x - 0.035, y);
      c.quadraticCurveTo(x, y - 0.12 - 0.03 * Math.sin(t * 9 + s), x + 0.035, y);
      c.closePath();
      c.fill();
    }
  }
  const topY = cy - 0.36;
  // pivot drum
  ell(c, cx, topY + 0.03, 0.17, 0.07);
  fo(c, BRONZE_DARK, 0.016);
  ell(c, cx, topY, 0.17, 0.07);
  fo(c, bronze(c, cx - 0.17, topY, cx + 0.17, topY), 0.016);
  const R = 0.5 + L * 0.04;
  const Y = cy - 0.88 - L * 0.05;
  const A = dishAxes(R, b.spin, 0.42);
  // post and fork
  c.beginPath();
  c.rect(cx - 0.045, Y + 0.05, 0.09, topY - Y - 0.05);
  fo(c, bronze(c, cx - 0.045, 0, cx + 0.045, 0), 0.014);
  const fork = () => {
    c.strokeStyle = OUT;
    c.lineWidth = 0.05;
    c.lineCap = 'round';
    c.beginPath();
    for (const s of [-1, 1]) {
      c.moveTo(cx, Y + 0.12);
      c.quadraticCurveTo(cx + A.ux * s * 0.9, Y + 0.25 + A.uy * s * 0.3, cx + A.ux * s * 1.02, Y + A.uy * s * 1.02);
    }
    c.stroke();
    c.strokeStyle = BRONZE;
    c.lineWidth = 0.032;
    c.stroke();
  };
  const arm = () => {
    const fx = cx + A.nx * R * 0.95,
      fy = Y + A.ny * R * 0.95;
    c.strokeStyle = rgba(BRONZE_DARK, 0.95);
    c.lineWidth = 0.016;
    c.beginPath();
    for (const [p, q] of [
      [0.85, 0],
      [-0.85, 0],
      [0, 0.85],
    ]) {
      c.moveTo(cx + A.ux * p + A.vx * q, Y + A.uy * p + A.vy * q);
      c.lineTo(fx, fy);
    }
    c.stroke();
    // focal sun-crystal
    glow(c, fx, fy, 0.35, '#fff2a0', 0.55 + 0.15 * Math.sin(t * 5 + b.uid));
    poly(c, [
      [fx, fy - 0.07],
      [fx + 0.04, fy],
      [fx, fy + 0.06],
      [fx - 0.04, fy],
    ]);
    fo(c, '#fffbe0', 0.01, GOLD_DARK);
  };
  if (!A.front) arm();
  fork();
  mirrorDisc(c, cx, Y, A, 0.06, L >= 2 ? GOLD : BRONZE_LIGHT, L >= 1, 0);
  if (A.front) {
    // concentric mirror tiles on the face
    c.save();
    c.transform(A.ux, A.uy, A.vx, A.vy, cx + A.nx * 0.06, Y + A.ny * 0.06);
    c.strokeStyle = 'rgba(170,110,40,0.3)';
    c.lineWidth = 0.025;
    c.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.moveTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3);
      c.lineTo(Math.cos(a) * 0.98, Math.sin(a) * 0.98);
    }
    c.stroke();
    c.restore();
    glow(c, cx + A.nx * 0.1, Y + A.ny * 0.1, R * 1.1, '#fff4c0', 0.3);
    arm();
  }
  if (L >= 2) {
    // gold crest
    const top = Y + A.vy * 1.1,
      tx = cx + A.vx * 1.1;
    sunGlyph(c, tx, top, 0.045, 12, GOLD_LIGHT);
  }
}

// ------------------------------------------------------------------ dispatch

const FLAT = new Set(['quicksand']);
const NO_PLINTH = new Set(['sandwall', 'quicksand', 'cistern', 'sundial', 'greatmirror']);

function building(ctx: C, b: Building, t: number, game: Game) {
  const id = b.def.id;
  const cx = b.x + 0.5,
    cy = b.y + 0.5;
  ctx.save();
  if (!NO_PLINTH.has(id)) plinth(ctx, b);
  if (id !== 'sandwall' && b.hp < b.maxHp * 0.5 && !FLAT.has(id)) cracks(ctx, b);
  switch (id) {
    case 'sandwall':
      sandwall(ctx, b, game, t);
      break;
    case 'slinger':
      slinger(ctx, b, cx, cy, t);
      break;
    case 'quicksand':
      quicksand(ctx, b, t);
      break;
    case 'cistern':
      cistern(ctx, b, cx, cy, t);
      break;
    case 'mirror':
      mirror(ctx, b, cx, cy, t);
      break;
    case 'sandblaster':
      sandblaster(ctx, b, cx, cy, t);
      break;
    case 'naphtha':
      naphtha(ctx, b, cx, cy, t);
      break;
    case 'sundial':
      sundial(ctx, b, cx, cy, t);
      break;
    case 'djinn':
      djinn(ctx, b, cx, cy, t);
      break;
    case 'stinger':
      stinger(ctx, b, cx, cy, t);
      break;
    case 'greatmirror':
      greatmirror(ctx, b, cx, cy, t);
      break;
  }
  if (id !== 'sandwall') pips(ctx, cx, b.y + (FLAT.has(id) ? 0.94 : 0.92), b.level);
  if (b.buff > 0 && b.def.kind === 'tower') heatSparkles(ctx, b, t, '#bff6ff');
  if ((b.noonT ?? 0) > 0) heatSparkles(ctx, b, t + 0.37, GOLD_LIGHT);
  if (b.hurt > 0) glow(ctx, cx, cy - 0.1, 0.65, '#ff3030', Math.min(1, b.hurt * 5) * 0.65);
  ctx.restore();
}

function iconTall(id: string): number {
  if (id === 'greatmirror') return 1.25;
  if (id === 'djinn') return 1;
  if (id === 'slinger' || id === 'mirror' || id === 'cistern' || id === 'stinger') return 0.5;
  return 0;
}

// ------------------------------------------------------------------ the Sunwell (core)

function sunwellBase(c: C, L: number) {
  return cached(`sunwell|${L}`, pxOf(c), -1.75, -1.55, 3.5, 3.3, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.12, 0.3, 1.55, 1.25);
    g.fill();
    // stepped sandstone plaza
    const steps: [number, string][] = [
      [1.5, SAND_MID],
      [1.32, shade(SAND, -0.04)],
      [1.12, SAND],
    ];
    steps.forEach(([r, col], i) => {
      const y = -i * 0.07;
      ell(g, 0, y + 0.1, r, r * 0.8);
      g.fillStyle = shade(col, -0.25);
      g.fill();
      ell(g, 0, y, r, r * 0.8);
      const gr = g.createLinearGradient(-r, y - r, r, y + r);
      gr.addColorStop(0, shade(col, 0.2));
      gr.addColorStop(1, shade(col, -0.06));
      g.fillStyle = gr;
      g.fill();
      g.strokeStyle = OUT;
      g.lineWidth = 0.022;
      g.stroke();
    });
    // mosaic ring on the middle step
    const n = 32;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU,
        a1 = ((i + 1) / n) * TAU;
      g.beginPath();
      g.ellipse(0, -0.07, 1.28, 1.28 * 0.8, 0, a0, a1);
      g.ellipse(0, -0.07, 1.17, 1.17 * 0.8, 0, a1, a0, true);
      g.closePath();
      g.fillStyle = L >= 1 ? (i % 2 ? TURQ : TERRA) : i % 2 ? shade(SAND, -0.12) : TERRA;
      g.fill();
    }
    // radiating paving on the top
    const fy = -0.14;
    g.strokeStyle = 'rgba(140,96,48,0.45)';
    g.lineWidth = 0.01;
    g.beginPath();
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU;
      g.moveTo(Math.cos(a) * 0.7, fy + Math.sin(a) * 0.56);
      g.lineTo(Math.cos(a) * 1.08, fy + Math.sin(a) * 0.86);
    }
    g.stroke();
    if (L >= 2) {
      g.strokeStyle = rgba(GOLD, 0.85);
      g.lineWidth = 0.02;
      ell(g, 0, fy, 1.0, 0.8);
      g.stroke();
    }
    if (L >= 3) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.PI / 8;
        sunGlyph(g, Math.cos(a) * 0.9, fy + Math.sin(a) * 0.72, 0.035, 10, GOLD_LIGHT, GOLD_DARK, 0.8);
      }
    }
    // the well: octagonal basin of glazed tiles
    const wy = -0.16;
    const outer = ngon(0, wy, 0.68, 8, Math.PI / 8, 0.8);
    // front faces
    for (let i = 0; i < 8; i++) {
      const [x1, y1] = outer[i],
        [x2, y2] = outer[(i + 1) % 8];
      if (y1 + y2 < 2 * wy - 0.05) continue;
      poly(g, [
        [x1, y1],
        [x2, y2],
        [x2, y2 + 0.16],
        [x1, y1 + 0.16],
      ]);
      const fg = g.createLinearGradient(x1, y1, x2, y2);
      fg.addColorStop(0, i % 2 ? TURQ : shade(TURQ, -0.1));
      fg.addColorStop(1, shade(TURQ, -0.3));
      fo(g, fg, 0.016, 'rgba(10,50,56,0.9)');
      // tile grid
      g.strokeStyle = 'rgba(200,255,245,0.5)';
      g.lineWidth = 0.006;
      g.beginPath();
      g.moveTo(x1, y1 + 0.08);
      g.lineTo(x2, y2 + 0.08);
      for (let k = 1; k < 3; k++) {
        const xx = x1 + ((x2 - x1) * k) / 3,
          yy = y1 + ((y2 - y1) * k) / 3;
        g.moveTo(xx, yy);
        g.lineTo(xx, yy + 0.16);
      }
      g.stroke();
    }
    // rim
    poly(g, outer);
    fo(g, L >= 2 ? goldG(g, -0.6, wy - 0.5, 0.6, wy + 0.5) : shade(SAND, 0.25), 0.02);
    const inner = ngon(0, wy + 0.01, 0.56, 8, Math.PI / 8, 0.8);
    poly(g, inner);
    g.fillStyle = TURQ_DARK;
    g.fill();
    // water
    const water = ngon(0, wy + 0.03, 0.54, 8, Math.PI / 8, 0.78);
    poly(g, water);
    const wg = g.createRadialGradient(-0.1, wy, 0.05, 0, wy + 0.03, 0.6);
    wg.addColorStop(0, '#b8fff0');
    wg.addColorStop(0.45, TURQ);
    wg.addColorStop(1, '#0e5a6a');
    fo(g, wg, 0.016, 'rgba(10,50,56,0.9)');
    // bronze arm sockets on the rim
    const arms = L >= 2 ? 4 : 3;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * TAU - Math.PI / 2 + (arms === 3 ? 0 : Math.PI / 4);
      const x = Math.cos(a) * 0.62,
        y = wy + Math.sin(a) * 0.5;
      ell(g, x, y, 0.06, 0.035);
      fo(g, bronze(g, x - 0.06, y, x + 0.06, y), 0.012);
    }
  });
}

function pillar(c: C, x: number, y: number, h: number, L: number) {
  const w = 0.14;
  ell(c, x, y + 0.01, w * 0.9, w * 0.4);
  fo(c, SAND_DARK, 0.014);
  c.beginPath();
  c.rect(x - w / 2, y - h, w, h);
  fo(c, hGrad(c, x - w / 2, x + w / 2, SAND_MID), 0.014);
  c.fillStyle = TERRA;
  c.fillRect(x - w / 2, y - h * 0.62, w, 0.03);
  if (L >= 2) {
    c.fillStyle = TURQ;
    c.fillRect(x - w / 2, y - h * 0.62 + 0.035, w, 0.02);
  }
  c.beginPath();
  c.rect(x - w * 0.75, y - h - 0.045, w * 1.5, 0.05);
  fo(c, L >= 4 ? GOLD_LIGHT : shade(SAND, 0.2), 0.012, L >= 4 ? GOLD_DARK : OUT);
}

function pennant(c: C, x: number, y: number, t: number, col: string, seed: number) {
  c.strokeStyle = BRONZE_DARK;
  c.lineWidth = 0.014;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - 0.3);
  c.stroke();
  const w = Math.sin(t * 4 + seed) * 0.03;
  c.beginPath();
  c.moveTo(x, y - 0.3);
  c.quadraticCurveTo(x + 0.1, y - 0.28 + w, x + 0.2, y - 0.25 + w * 1.6);
  c.lineTo(x, y - 0.18);
  c.closePath();
  fo(c, col, 0.01);
}

function core(ctx: C, game: Game, t: number) {
  const L = Math.max(0, Math.min(4, game.coreLevel | 0));
  const cx = CORE_X + 0.5,
    cy = CORE_Y + 0.5;
  const hpk = Math.max(0, Math.min(1, game.coreHp / game.coreMaxHp));
  const gk = 0.45 + 0.55 * hpk;
  const hurt = Math.max(0, Math.min(1, game.coreHurt * 4));
  ctx.save();
  ctx.drawImage(sunwellBase(ctx, L), cx - 1.75, cy - 1.55, 3.5, 3.3);
  const wy = cy - 0.13;
  // ripples and sun glints on the well water
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.35 + i / 3) % 1;
    ctx.strokeStyle = rgba('#ffffff', 0.4 * (1 - p));
    ctx.lineWidth = 0.012;
    ell(ctx, cx, wy, 0.08 + p * 0.42, (0.08 + p * 0.42) * 0.75);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.max(0, Math.sin(t * 1.9 + i * 1.7));
    const ang = i * 2.4;
    sparkle(ctx, cx + Math.cos(ang) * 0.32, wy + Math.sin(ang) * 0.24, 0.045, '#ffffff', a * 0.85);
  }
  // reflection of the crystal
  glow(ctx, cx, wy, 0.5, GOLD_LIGHT, 0.35 * gk);
  if (hpk < 0.5) {
    ctx.strokeStyle = 'rgba(60,30,10,0.85)';
    ctx.lineWidth = 0.022;
    ctx.beginPath();
    ctx.moveTo(cx - 1.1, cy + 0.2);
    ctx.lineTo(cx - 0.9, cy + 0.35);
    ctx.lineTo(cx - 0.95, cy + 0.55);
    ctx.moveTo(cx + 0.8, cy + 0.6);
    ctx.lineTo(cx + 0.95, cy + 0.45);
    ctx.lineTo(cx + 1.15, cy + 0.5);
    ctx.stroke();
  }

  // pillars and palms around the plaza
  const nP = [0, 4, 6, 6, 8][L];
  const colH = 0.5 + L * 0.05;
  const pillars = Array.from({ length: nP }, (_, i) => {
    const a = (i / nP) * TAU + Math.PI / nP + (nP === 4 ? Math.PI / 4 - Math.PI / nP : 0);
    return { a, x: cx + Math.cos(a) * 1.22, y: cy - 0.06 + Math.sin(a) * 0.98 };
  });
  const palms = (
    L >= 2
      ? [
          { x: cx - 1.3, y: cy - 0.55, lean: -0.08, h: 1.05 },
          { x: cx + 1.32, y: cy - 0.5, lean: 0.1, h: 1.15 },
          { x: cx - 1.38, y: cy + 0.45, lean: -0.12, h: 0.95 },
          { x: cx + 1.36, y: cy + 0.5, lean: 0.12, h: 0.9 },
        ]
      : []
  ).slice(0, L >= 3 ? 4 : 2);
  const drawPillar = (p: { a: number; x: number; y: number }, i: number) => {
    pillar(ctx, p.x, p.y, colH, L);
    if (L >= 3) pennant(ctx, p.x, p.y - colH - 0.05, t, i % 2 ? TURQ : TERRA, i * 1.3);
  };
  palms.forEach((p, i) => p.y < cy && palm(ctx, p.x, p.y, p.h, p.lean, t, i * 2.1));
  pillars.forEach((p, i) => Math.sin(p.a) < 0 && drawPillar(p, i));

  // bronze arms rising from the rim to cradle the crystal
  const arms = L >= 2 ? 4 : 3;
  const cradleY = wy - 0.55 - L * 0.07;
  const armPts = Array.from({ length: arms }, (_, i) => {
    const a = (i / arms) * TAU - Math.PI / 2 + (arms === 3 ? 0 : Math.PI / 4);
    return { a, x: cx + Math.cos(a) * 0.62, y: wy - 0.03 + Math.sin(a) * 0.5 };
  });
  const arm = (p: { a: number; x: number; y: number }) => {
    const tx = cx + Math.cos(p.a) * 0.12,
      ty = cradleY + 0.12 + Math.sin(p.a) * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.bezierCurveTo(p.x + (p.x - cx) * 0.25, p.y - 0.45, tx + (tx - cx) * 1.5, ty + 0.1, tx, ty);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 0.065;
    ctx.stroke();
    ctx.strokeStyle = L >= 4 ? GOLD : BRONZE;
    ctx.lineWidth = 0.042;
    ctx.stroke();
    ctx.strokeStyle = rgba(L >= 4 ? GOLD_LIGHT : BRONZE_LIGHT, 0.8);
    ctx.lineWidth = 0.012;
    ctx.stroke();
  };
  armPts.forEach((p) => Math.sin(p.a) < 0 && arm(p));

  // the sun-crystal
  const bob = Math.sin(t * 1.4) * 0.03;
  const H = 0.72 + L * 0.1,
    w = 0.21 + L * 0.025;
  const by = cradleY + 0.08 + bob;
  const pulse = 1 + 0.06 * Math.sin(t * 2.2);
  const crystalCol = hurt > 0 ? '#ff9a80' : '#ffe48a';
  glow(ctx, cx, by - H * 0.45, (1.1 + L * 0.12) * pulse, crystalCol, 0.45 * gk);
  if (L >= 3) {
    // slow halo of sun rays
    ctx.save();
    ctx.translate(cx, by - H * 0.45);
    ctx.rotate(t * 0.2);
    const nr = 16;
    for (let i = 0; i < nr; i++) {
      const a = (i / nr) * TAU;
      const len = (i % 2 ? 0.5 : 0.7) * pulse * (1 + (L - 3) * 0.2);
      ctx.fillStyle = rgba(i % 2 ? '#fff4c8' : GOLD, 0.55 * gk);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.06) * 0.3, Math.sin(a - 0.06) * 0.3);
      ctx.lineTo(Math.cos(a) * (0.3 + len), Math.sin(a) * (0.3 + len));
      ctx.lineTo(Math.cos(a + 0.06) * 0.3, Math.sin(a + 0.06) * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  const pts: [number, number][] = [
    [cx, by - H],
    [cx + w, by - H * 0.62],
    [cx + w * 0.8, by - H * 0.2],
    [cx, by + 0.1],
    [cx - w * 0.8, by - H * 0.2],
    [cx - w, by - H * 0.62],
  ];
  ctx.globalAlpha *= 0.6 + 0.4 * gk;
  facet(ctx, pts, cx - w * 0.2, by - H * 0.5, hurt > 0 ? '#ffb8a0' : '#ffe27a', 0.45, 'rgba(150,90,20,0.9)', 0.022);
  ctx.globalAlpha = 1;
  // inner fire
  ctx.strokeStyle = rgba('#ffffff', 0.85 * gk);
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(cx, by - H * 0.9);
  ctx.lineTo(cx, by - 0.02);
  ctx.moveTo(cx - w * 0.5, by - H * 0.55);
  ctx.lineTo(cx + w * 0.5, by - H * 0.55);
  ctx.stroke();
  glow(ctx, cx, by - H * 0.5, 0.35, '#ffffff', 0.5 * gk);
  // cradle ring
  ell(ctx, cx, cradleY + 0.13, 0.15, 0.05);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 0.045;
  ctx.stroke();
  ctx.strokeStyle = L >= 4 ? GOLD : BRONZE;
  ctx.lineWidth = 0.028;
  ctx.stroke();
  // gun glint: the crystal flashes toward its target
  const ga = game.coreAngle;
  const gx = cx + Math.cos(ga) * w * 0.9,
    gy = by - H * 0.45 + Math.sin(ga) * H * 0.35;
  glow(ctx, gx, gy, 0.22, '#ffffff', 0.7 * gk);
  sparkle(ctx, gx, gy, 0.12, '#ffffff', 0.9 * gk);
  ctx.strokeStyle = rgba('#fffbe0', 0.6 * gk);
  ctx.lineWidth = 0.015;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(ga) * 0.22, gy + Math.sin(ga) * 0.22);
  ctx.stroke();

  armPts.forEach((p) => Math.sin(p.a) >= 0 && arm(p));
  pillars.forEach((p, i) => Math.sin(p.a) >= 0 && drawPillar(p, i));
  palms.forEach((p, i) => p.y >= cy && palm(ctx, p.x, p.y, p.h, p.lean, t, i * 2.1));
  if (hurt > 0) glow(ctx, cx, cy - 0.3, 1.6, '#ff3030', hurt * 0.5);
  ctx.restore();
}

// ------------------------------------------------------------------ sand vortex (rift)

function rift(ctx: C, x: number, y: number, t: number, state: 'open' | 'forming') {
  const cx = x + 0.5,
    cy = y + 0.5;
  ctx.save();
  if (state !== 'open') {
    // sand beginning to slide: rippling rings creeping inward
    ctx.globalAlpha *= 0.5 + 0.3 * Math.abs(Math.sin(t * 2.3) * Math.sin(t * 1.1));
    ctx.fillStyle = 'rgba(120,80,36,0.25)';
    ell(ctx, cx, cy, 0.5, 0.4);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.3 + i / 3) % 1;
      const r = 0.5 * (1 - p) + 0.05;
      ctx.strokeStyle = rgba('#6a4520', 0.6 * Math.sin(p * Math.PI));
      ctx.lineWidth = 0.02;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * TAU;
        const rr = r * (1 + 0.06 * Math.sin(a * 5 + t * 2 + i));
        const px = cx + Math.cos(a) * rr,
          py = cy + Math.sin(a) * rr * 0.8;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const p = (t * 0.25 + hash(i * 7 + x * 3 + y)) % 1;
      const a = hash(i * 11 + y) * TAU + p * 2;
      const r = 0.45 * (1 - p);
      ctx.fillStyle = rgba(SAND, 0.8 * (1 - p));
      circle(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 0.014);
      ctx.fill();
    }
    ell(ctx, cx, cy, 0.06, 0.045);
    ctx.fillStyle = 'rgba(50,30,10,0.6)';
    ctx.fill();
    ctx.restore();
    return;
  }
  // wide funnel of sand sinking into the dark
  const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1.15);
  sg.addColorStop(0, 'rgba(20,10,4,1)');
  sg.addColorStop(0.18, 'rgba(70,44,20,0.95)');
  sg.addColorStop(0.5, 'rgba(160,116,62,0.6)');
  sg.addColorStop(1, 'rgba(200,160,100,0)');
  ctx.translate(cx, cy);
  ctx.scale(1, 0.8);
  ctx.fillStyle = sg;
  circle(ctx, 0, 0, 1.15);
  ctx.fill();
  // spiral sand streams pouring in
  ctx.lineCap = 'round';
  const arms = 6;
  for (let i = 0; i < arms; i++) {
    const a0 = -t * 1.4 + (i / arms) * TAU;
    for (const [lw, col, al, off] of [
      [0.07, '#5a3a18', 0.45, 0.02],
      [0.035, '#f2d9a6', 0.7, 0],
    ] as const) {
      ctx.strokeStyle = rgba(col, al);
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let s = 0; s <= 14; s++) {
        const k = s / 14;
        const r = 0.12 + (1 - k) * 0.68;
        const a = a0 + k * 2.6;
        const px = Math.cos(a) * r,
          py = Math.sin(a) * r + off;
        s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
  }
  // grains spiralling down
  for (let i = 0; i < 16; i++) {
    const p = (t * 0.45 + hash(i * 13 + x * 5 + y)) % 1;
    const a = hash(i * 7 + y * 3) * TAU - p * 6 - t;
    const r = 0.85 * (1 - p) + 0.08;
    ctx.fillStyle = rgba(i % 3 ? SAND : '#fff0cc', 0.9 * Math.min(1, (1 - p) * 2.5));
    circle(ctx, Math.cos(a) * r, Math.sin(a) * r, 0.018 + 0.012 * (1 - p));
    ctx.fill();
  }
  // the dark throat
  const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.18);
  tg.addColorStop(0, '#000000');
  tg.addColorStop(0.7, '#1a0e04');
  tg.addColorStop(1, 'rgba(60,36,14,0)');
  ctx.fillStyle = tg;
  circle(ctx, 0, 0, 0.18);
  ctx.fill();
  ctx.setTransform(ctx.getTransform().scale(1, 1.25));
  // dust lifting off the rim
  for (let i = 0; i < 5; i++) {
    const p = (t * 0.3 + i / 5) % 1;
    const a = i * 1.3 + t * 0.2;
    const px = Math.cos(a) * 0.6,
      py = Math.sin(a) * 0.45 - p * 0.45;
    const r = 0.1 + p * 0.18;
    const dg = ctx.createRadialGradient(px, py, 0, px, py, r);
    dg.addColorStop(0, rgba('#e8cc98', 0.35 * Math.sin(p * Math.PI)));
    dg.addColorStop(1, rgba('#e8cc98', 0));
    ctx.fillStyle = dg;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}

registerArt('summer', { building, iconTall, enemies: SUMMER_ENEMIES, core, rift });
