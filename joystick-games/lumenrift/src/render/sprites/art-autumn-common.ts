// Autumn (Hallows' Eve) shared palette and drawing helpers: pumpkins, candles, flames, ravens.
import { cached, glow, hash, mix, pxOf, rgba, shade } from './util';

export type C = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;

// palette
export const PUMPKIN = '#ff8a1e';
export const PUMPKIN_L = '#ffb24e';
export const PUMPKIN_D = '#b2470c';
export const CANDLE = '#ffd76a';
export const FLAME_HOT = '#fff4c2';
export const WITCH = '#7aff5a';
export const WITCH_D = '#2f7a24';
export const VIOLET = '#a066ff';
export const VIOLET_D = '#45266e';
export const BONE = '#ece4d0';
export const WAX = '#efe6cf';
export const IRON = '#1e1c26';
export const IRON_L = '#4a4858';
export const STONE = '#6c7288';
export const STONE_L = '#9198ae';
export const STONE_D = '#3c4256';
export const WOOD = '#76522f';
export const WOOD_D = '#3f2a18';
export const STRAW = '#d8b25a';
export const LEAF = '#4f7a2e';
export const SPIRIT = '#9fffd8';
export const OUT = 'rgba(10,6,18,0.9)';
export const SHADOW = 'rgba(6,4,14,0.38)';

export function circle(c: C, x: number, y: number, r: number) {
  c.beginPath();
  c.arc(x, y, Math.max(0.0005, r), 0, TAU);
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.0005, rx), Math.max(0.0005, ry), rot, 0, TAU);
}

/** Fill + crisp outline of the current path. */
export function fo(c: C, fill: string | CanvasGradient, lw = 0.02, stroke = OUT) {
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = lw;
  c.stroke();
}

export function lgrad(c: C, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [k, s] of stops) g.addColorStop(k, s);
  return g;
}

/** Horizontal gradient for a cylinder spanning x0..x1, lit from the left. */
export function cyl(c: C, x0: number, x1: number, base: string, k = 0.25) {
  return lgrad(c, x0, 0, x1, 0, [
    [0, shade(base, k * 0.6)],
    [0.35, shade(base, k)],
    [0.7, base],
    [1, shade(base, -k * 2)],
  ]);
}

export function line(c: C, x0: number, y0: number, x1: number, y1: number) {
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
}

/** Additive radial glow (temporarily switches to 'lighter'). */
export function addGlow(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  glow(c, x, y, r, col, a);
  c.globalCompositeOperation = op;
}

/** Candle-like flicker in [0.75, 1.1]. */
export function flicker(t: number, seed: number) {
  return 0.9 + 0.1 * Math.sin(t * 13.7 + seed * 3.1) + 0.08 * Math.sin(t * 23.3 + seed * 7.7) * Math.sin(t * 3.1 + seed);
}

// ------------------------------------------------------------------ flames

/**
 * A teardrop flame standing at (x, y), `h` tall, leaning by `lean` (−1..1, sideways),
 * outer colour `col`. Draws the flame plus a small additive halo.
 */
export function flame(c: C, x: number, y: number, h: number, t: number, seed: number, lean = 0, col = '#ff9a2a', halo = 1) {
  const f = flicker(t, seed);
  const hh = h * f;
  const w = h * 0.36;
  const sway = Math.sin(t * 9 + seed * 5) * 0.12 + lean * 0.7;
  const tx = x + sway * hh,
    ty = y - hh;
  if (halo > 0) addGlow(c, x + sway * hh * 0.4, y - hh * 0.4, h * 1.6, col, 0.32 * halo * f);
  c.beginPath();
  c.moveTo(tx, ty);
  c.quadraticCurveTo(x + w * 1.15 + sway * hh * 0.3, y - hh * 0.35, x + w * 0.5, y);
  c.arc(x, y - w * 0.02, w * 0.52, 0, Math.PI);
  c.quadraticCurveTo(x - w * 1.15 + sway * hh * 0.3, y - hh * 0.35, tx, ty);
  const g = c.createLinearGradient(x, y, x, ty);
  g.addColorStop(0, shade(col, -0.15));
  g.addColorStop(0.5, col);
  g.addColorStop(1, rgba(col, 0.6));
  c.fillStyle = g;
  c.fill();
  // hot core
  c.beginPath();
  const cx = x + sway * hh * 0.25;
  c.moveTo(x + sway * hh * 0.55, y - hh * 0.62);
  c.quadraticCurveTo(cx + w * 0.55, y - hh * 0.2, cx, y - w * 0.05);
  c.quadraticCurveTo(cx - w * 0.55, y - hh * 0.2, x + sway * hh * 0.55, y - hh * 0.62);
  c.fillStyle = FLAME_HOT;
  c.fill();
}

/** A wax candle standing at (x, y) with drips, a wick and a flame. Returns the flame tip. */
export function candleStick(c: C, x: number, y: number, h: number, w: number, t: number, seed: number, lean = 0, wax = WAX, fl = '#ffa030', bright = 1) {
  // body
  c.beginPath();
  c.rect(x - w / 2, y - h, w, h);
  fo(c, cyl(c, x - w / 2, x + w / 2, wax, 0.15), 0.012);
  // melted top
  ell(c, x, y - h, w / 2, w * 0.2);
  c.fillStyle = shade(wax, 0.12);
  c.fill();
  // drips
  c.fillStyle = shade(wax, 0.05);
  const n = 2 + Math.floor(hash(seed * 7) * 2);
  for (let i = 0; i < n; i++) {
    const dx = (hash(seed * 13 + i) - 0.5) * w * 0.8;
    const dl = h * (0.15 + hash(seed * 5 + i) * 0.35);
    c.beginPath();
    c.moveTo(x + dx - w * 0.12, y - h);
    c.lineTo(x + dx - w * 0.1, y - h + dl);
    c.arc(x + dx, y - h + dl, w * 0.11, Math.PI, 0, true);
    c.lineTo(x + dx + w * 0.12, y - h);
    c.fill();
  }
  // wick
  c.strokeStyle = '#2a1a10';
  c.lineWidth = w * 0.12;
  line(c, x, y - h - w * 0.05, x + lean * w * 0.2, y - h - w * 0.35);
  flame(c, x + lean * w * 0.2, y - h - w * 0.25, w * 2.3, t, seed, lean, fl, bright);
}

// ------------------------------------------------------------------ pumpkins

function pumpkinBody(g: C, hue: number) {
  // unit pumpkin centred at (0,0), radius ~1 wide, ~0.8 tall
  const base = hue === 0 ? PUMPKIN : hue === 1 ? '#f0761a' : '#ff9e3a';
  const lobes: [number, number, number][] = [
    [-0.62, 0.0, 0.45],
    [0.62, 0.0, 0.45],
    [-0.32, 0.0, 0.55],
    [0.32, 0.0, 0.55],
    [0, 0.0, 0.58],
  ];
  // shadow lobes first (sides) then centre on top
  for (const [x, y, rx] of lobes) {
    g.beginPath();
    g.ellipse(x, y, rx, 0.78, 0, 0, TAU);
    const gr = g.createRadialGradient(x - rx * 0.4, y - 0.4, 0.05, x, y, rx * 1.4);
    gr.addColorStop(0, shade(base, 0.32));
    gr.addColorStop(0.5, base);
    gr.addColorStop(1, shade(base, -0.55));
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = rgba(PUMPKIN_D, 0.85);
    g.lineWidth = 0.05;
    g.stroke();
  }
  // outer outline
  g.beginPath();
  g.ellipse(0, 0, 1.06, 0.8, 0, 0, TAU);
  g.strokeStyle = OUT;
  g.lineWidth = 0.08;
  g.stroke();
  // rim light
  g.strokeStyle = 'rgba(255,220,160,0.5)';
  g.lineWidth = 0.05;
  g.beginPath();
  g.ellipse(-0.1, -0.05, 0.4, 0.62, 0, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
  // stem
  g.beginPath();
  g.moveTo(-0.1, -0.68);
  g.quadraticCurveTo(-0.12, -0.95, 0.05, -1.08);
  g.lineTo(0.17, -1.0);
  g.quadraticCurveTo(0.06, -0.9, 0.1, -0.68);
  g.closePath();
  g.fillStyle = '#5a6a2a';
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 0.05;
  g.stroke();
}

/**
 * A pumpkin centred at (x, y), radius r. `face` 0 none, 1 grin, 2 toothy; `lit` 0..1 inner glow;
 * `look` −1..1 shifts the face sideways (turning toward something).
 */
export function pumpkin(c: C, x: number, y: number, r: number, face = 0, lit = 0, look = 0, hue = 0, lookY = 0) {
  const raw = pxOf(c) * r;
  const px = Math.max(4, Math.min(512, Math.pow(2, Math.round(Math.log2(raw) * 4) / 4)));
  const cv = cached(`apump|${hue}`, px, -1.15, -1.15, 2.3, 2.1, (g) => pumpkinBody(g, hue));
  c.drawImage(cv, x - 1.15 * r, y - 1.15 * r, 2.3 * r, 2.1 * r);
  if (face) pumpkinFace(c, x, y, r, face, lit, look, lookY);
}

export function pumpkinFace(c: C, x: number, y: number, r: number, face: number, lit: number, look = 0, lookY = 0, col = '#ffb030') {
  const fx = x + look * r * 0.32,
    fy = y + lookY * r * 0.12;
  const sx = r * (1 - Math.abs(look) * 0.25);
  const holes = new Path2D();
  // eyes: triangles
  for (const s of [-1, 1]) {
    holes.moveTo(fx + s * 0.42 * sx, fy - 0.12 * r);
    holes.lineTo(fx + s * 0.16 * sx, fy - 0.12 * r);
    holes.lineTo(fx + s * 0.3 * sx, fy - 0.42 * r);
    holes.closePath();
  }
  // nose
  holes.moveTo(fx - 0.07 * sx, fy + 0.04 * r);
  holes.lineTo(fx + 0.07 * sx, fy + 0.04 * r);
  holes.lineTo(fx, fy - 0.08 * r);
  holes.closePath();
  // mouth
  const my = fy + 0.18 * r;
  holes.moveTo(fx - 0.55 * sx, my);
  if (face === 2) {
    const teeth = 4;
    for (let i = 0; i <= teeth * 2; i++) {
      const k = i / (teeth * 2);
      const xx = fx + (-0.5 + k) * 1.0 * sx;
      const up = i % 2 ? 0.1 * r : 0;
      holes.lineTo(xx, my + 0.02 * r + up);
    }
    holes.lineTo(fx + 0.55 * sx, my);
    holes.quadraticCurveTo(fx, my + 0.55 * r, fx - 0.55 * sx, my);
  } else {
    holes.quadraticCurveTo(fx, my + 0.22 * r, fx + 0.55 * sx, my);
    holes.quadraticCurveTo(fx, my + 0.48 * r, fx - 0.55 * sx, my);
  }
  holes.closePath();
  if (lit > 0.02) {
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, r * 0.8);
    const k = Math.min(1, 0.55 + lit);
    g.addColorStop(0, rgba('#fffbe0', k));
    g.addColorStop(0.55, rgba(mix(col, '#ffe060', 0.6), k));
    g.addColorStop(1, rgba(col, k));
    c.fillStyle = g;
  } else c.fillStyle = '#2a1408';
  c.fill(holes);
  c.strokeStyle = rgba('#2a0e02', 0.95);
  c.lineWidth = r * 0.06;
  c.stroke(holes);
  if (lit > 0.02) addGlow(c, fx, fy, r * 1.25, col, 0.28 * lit);
}

// ------------------------------------------------------------------ ravens

/** A perched raven (side view) at (x, y) feet, scale s (~0.12 for a tile-sized roost). */
export function ravenPerched(c: C, x: number, y: number, s: number, dir: number, bob: number, eyeCol = '#ffd24a') {
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  // tail
  c.beginPath();
  c.moveTo(-0.5, -0.5);
  c.lineTo(-1.15, -0.05);
  c.lineTo(-0.95, 0.05);
  c.lineTo(-0.3, -0.35);
  c.closePath();
  fo(c, '#15131e', 0.06);
  // body
  c.beginPath();
  c.ellipse(-0.05, -0.62, 0.62, 0.42, -0.35, 0, TAU);
  fo(c, lgrad(c, 0, -1, 0, -0.2, [
    [0, '#3a3450'],
    [1, '#100e18'],
  ]), 0.06);
  // wing sheen
  c.strokeStyle = 'rgba(150,120,220,0.5)';
  c.lineWidth = 0.07;
  c.beginPath();
  c.ellipse(-0.15, -0.66, 0.4, 0.22, -0.35, Math.PI * 1.05, Math.PI * 1.7);
  c.stroke();
  // head (bobbing)
  const hx = 0.45 + bob * 0.08,
    hy = -1.0 + Math.abs(bob) * 0.12;
  circle(c, hx, hy, 0.27);
  fo(c, '#1c1928', 0.06);
  // beak
  c.beginPath();
  c.moveTo(hx + 0.18, hy - 0.06);
  c.lineTo(hx + 0.62, hy + 0.04 + bob * 0.05);
  c.lineTo(hx + 0.18, hy + 0.1);
  c.closePath();
  fo(c, '#3a3640', 0.04);
  // eye
  c.fillStyle = eyeCol;
  circle(c, hx + 0.08, hy - 0.06, 0.07);
  c.fill();
  // legs
  c.strokeStyle = '#2a2630';
  c.lineWidth = 0.08;
  line(c, 0.0, -0.25, -0.02, 0.02);
  line(c, 0.18, -0.25, 0.2, 0.02);
  c.restore();
}

/** A raven in flight at (x, y), scale s, flap phase. */
export function ravenFlying(c: C, x: number, y: number, s: number, dir: number, flap: number, eyeCol = '#ffd24a') {
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  const w = Math.sin(flap);
  for (const back of [1, 0]) {
    c.beginPath();
    const tipY = -w * 0.9 + (back ? -0.15 : 0.1);
    c.moveTo(-0.25, -0.05);
    c.quadraticCurveTo(-0.1, tipY * 0.6 - 0.2, back ? -0.35 : 0.25, tipY - 0.25);
    c.quadraticCurveTo(0.1, tipY * 0.4, 0.25, 0.0);
    c.closePath();
    fo(c, back ? '#0c0a12' : '#1d1a28', 0.05);
  }
  c.beginPath();
  c.ellipse(0, 0.02, 0.55, 0.2, 0, 0, TAU);
  fo(c, '#17141f', 0.05);
  // tail
  c.beginPath();
  c.moveTo(-0.45, 0.0);
  c.lineTo(-0.85, -0.12);
  c.lineTo(-0.85, 0.16);
  c.closePath();
  fo(c, '#15131e', 0.04);
  // head + beak
  circle(c, 0.55, -0.04, 0.17);
  fo(c, '#1c1928', 0.05);
  c.beginPath();
  c.moveTo(0.68, -0.08);
  c.lineTo(0.98, 0.0);
  c.lineTo(0.68, 0.05);
  c.closePath();
  fo(c, '#3a3640', 0.03);
  c.fillStyle = eyeCol;
  circle(c, 0.6, -0.08, 0.05);
  c.fill();
  c.restore();
}

/** Small pumpkin-shaped level pips. */
export function pips(c: C, cx: number, y: number, level: number) {
  for (let i = 0; i <= level; i++) {
    const x = cx + (i - level / 2) * 0.1;
    c.fillStyle = PUMPKIN;
    ell(c, x, y, 0.034, 0.027);
    c.fill();
    c.strokeStyle = 'rgba(40,14,0,0.9)';
    c.lineWidth = 0.008;
    c.stroke();
    c.fillStyle = '#ffe0a0';
    circle(c, x - 0.01, y - 0.008, 0.009);
    c.fill();
    c.strokeStyle = '#4a6a2a';
    c.lineWidth = 0.01;
    line(c, x, y - 0.026, x + 0.008, y - 0.04);
  }
}
