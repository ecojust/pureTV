// The dune swarm: summer-campaign enemies. Same conventions as enemies.ts — the ctx is translated to
// the body centre and scaled so 1 local unit = the enemy's radius; `mode` draws either the body or
// only its glowing bits (eyes, embers, venom) for the additive pass.
import type { EnemyId } from '../../game/config';
import type { Enemy } from '../../game/game';
import { eye, fillBody, type Mode, type Pose } from './enemies';
import type { EnemyDraw } from './realm-art';
import { mix, rgba, shade } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const DARK = 'rgba(20,10,4,0.85)';

function radial(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(0.4, rgba(col, a * 0.45));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Jointed insect legs (top-down), `n` pairs along x, alternating gait. */
function legs(c: C, xs: number[], spread: number, reach: number, step: number, col: string, lw: number) {
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  xs.forEach((x, i) => {
    for (const s of [-1, 1]) {
      const ph = (i % 2 ? 1 : -1) * s * step;
      const kx = x + ph * 0.1 + (x > 0 ? 0.1 : x < 0 ? -0.08 : 0),
        ky = s * (spread + 0.22);
      c.moveTo(x, s * spread);
      c.lineTo(kx, ky);
      c.lineTo(kx + (x > 0 ? 0.12 : x < 0 ? -0.15 : 0) + ph * 0.12, s * reach);
    }
  });
  c.stroke();
}

/**
 * Side-view wing from shoulder (sx,sy) pointing along `ang`; the trailing edge faces backward/down.
 * `n` finger-feathers at the tip; `flame` makes them tongue-shaped.
 */
function wingPath(sx: number, sy: number, ang: number, span: number, chord: number, n: number, flame: number) {
  const dx = Math.cos(ang),
    dy = Math.sin(ang);
  let nx = -dy,
    ny = dx;
  if (nx * -1 + ny * 0.3 < 0) {
    nx = -nx;
    ny = -ny;
  }
  const p = new Path2D();
  const at = (s: number, o: number): [number, number] => [sx + dx * span * s + nx * chord * o, sy + dy * span * s + ny * chord * o];
  const L0 = at(0, -0.3),
    T0 = at(0, 0.75);
  // fingers radiate from the wrist, fanning from the wing line back toward the trailing edge
  const wx = sx + dx * span * 0.45 + nx * chord * 0.1,
    wy = sy + dy * span * 0.45 + ny * chord * 0.1;
  const tips: [number, number][] = [];
  const notches: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    let fx = dx * (1 - k * 0.6) + nx * k * 0.95,
      fy = dy * (1 - k * 0.6) + ny * k * 0.95;
    const fl = Math.hypot(fx, fy);
    fx /= fl;
    fy /= fl;
    const len = span * (0.58 - k * 0.2) * (1 + flame * 0.08 * Math.sin(i * 2.1));
    tips.push([wx + fx * len, wy + fy * len]);
    if (i < n - 1) {
      const k2 = (i + 0.5) / (n - 1);
      let mx = dx * (1 - k2 * 0.6) + nx * k2 * 0.95,
        my = dy * (1 - k2 * 0.6) + ny * k2 * 0.95;
      const ml = Math.hypot(mx, my);
      mx /= ml;
      my /= ml;
      const nl = span * (0.38 - k2 * 0.12) * (flame ? 0.85 : 1);
      notches.push([wx + mx * nl, wy + my * nl]);
    }
  }
  const c1 = at(0.45, -0.5);
  p.moveTo(...L0);
  p.quadraticCurveTo(c1[0], c1[1], tips[0][0], tips[0][1]);
  for (let i = 1; i < n; i++) {
    const [ax, ay] = notches[i - 1];
    if (flame) {
      p.quadraticCurveTo(ax, ay, ax, ay);
      p.quadraticCurveTo(ax, ay, tips[i][0], tips[i][1]);
    } else {
      p.lineTo(ax, ay);
      p.lineTo(tips[i][0], tips[i][1]);
    }
  }
  const c2 = at(0.25, 1.0);
  p.quadraticCurveTo(c2[0], c2[1], T0[0], T0[1]);
  p.closePath();
  return p;
}

// ------------------------------------------------------------------ scarab: iridescent beetle, top-down

function scarab(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const step = Math.sin(t * 14 + P.ph);
  if (mode === 'body') {
    const base = e.def.color;
    legs(c, [0.32, 0.05, -0.25], 0.3, 0.88, step, '#1a1612', 0.09);
    // elytra
    const b = new Path2D();
    b.ellipse(-0.12, 0, 0.66, 0.62, 0, 0, TAU);
    fillBody(c, b, e, t, base, 0.09);
    // iridescent sheen: teal to violet across the shell
    const g = c.createLinearGradient(-0.6, -0.6, 0.3, 0.6);
    g.addColorStop(0, 'rgba(140,255,220,0.45)');
    g.addColorStop(0.5, 'rgba(60,180,160,0)');
    g.addColorStop(1, 'rgba(140,90,255,0.35)');
    c.fillStyle = g;
    c.fill(b);
    c.fillStyle = 'rgba(220,255,245,0.55)';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(-0.18, s * 0.3, 0.32, 0.07, s * 0.15, 0, TAU);
      c.fill();
    }
    c.strokeStyle = 'rgba(10,30,30,0.85)';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(-0.78, 0);
    c.lineTo(0.3, 0);
    c.stroke();
    // pronotum
    const pr = new Path2D();
    pr.ellipse(0.44, 0, 0.26, 0.44, 0, 0, TAU);
    fillBody(c, pr, e, t, shade(base, -0.15), 0.08);
    c.fillStyle = 'rgba(180,255,235,0.4)';
    c.beginPath();
    c.ellipse(0.4, -0.18, 0.1, 0.12, 0, 0, TAU);
    c.fill();
    // toothed head rake
    const h = new Path2D();
    h.moveTo(0.62, -0.25);
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI;
      const r = i % 2 ? 0.26 : 0.32;
      h.lineTo(0.66 + Math.cos(a) * r, Math.sin(a) * r * 0.95);
    }
    h.closePath();
    fillBody(c, h, e, t, '#1e2a28', 0.06);
  }
  eye(c, mode, 0.72, -0.17, 0.07, e.def.eye, 0, 1);
  eye(c, mode, 0.72, 0.17, 0.07, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ skink: skittering sand lizard

function skink(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const ph = t * 18 + P.ph;
  // spine with travelling S-wave
  const N = 12;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = 1.05 - s * 2.3;
    const y = Math.sin(s * 4.5 - ph) * 0.16 * (0.3 + s);
    const w = s < 0.12 ? 0.12 + s * 1.3 : s < 0.5 ? 0.28 - (s - 0.12) * 0.15 : Math.max(0.02, 0.22 * (1 - (s - 0.5) / 0.5));
    pts.push([x, y, w]);
  }
  if (mode === 'body') {
    const base = e.def.color;
    // splayed legs, alternating
    c.strokeStyle = shade(base, -0.45);
    c.lineWidth = 0.1;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (const [i, side0] of [
      [2, 1],
      [6, -1],
    ] as const) {
      const [x, y] = pts[i];
      for (const s of [-1, 1]) {
        const sw = Math.sin(ph + (s === side0 ? 0 : Math.PI)) * 0.25;
        c.moveTo(x, y + s * 0.15);
        c.lineTo(x + 0.1 + sw * 0.5, y + s * 0.42);
        c.lineTo(x + 0.25 + sw, y + s * 0.5);
      }
    }
    c.stroke();
    const p = new Path2D();
    for (let i = 0; i <= N; i++) {
      const [x, y, w] = pts[i];
      if (i === 0) p.moveTo(x + 0.12, y);
      p.lineTo(x, y - w);
    }
    for (let i = N; i >= 0; i--) {
      const [x, y, w] = pts[i];
      p.lineTo(x, y + w);
    }
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // dark saddle bands
    c.strokeStyle = rgba(shade(base, -0.5), 0.6);
    c.lineWidth = 0.08;
    c.beginPath();
    for (const i of [3, 5, 7, 9]) {
      const [x, y, w] = pts[i];
      c.moveTo(x, y - w * 0.8);
      c.lineTo(x - 0.05, y + w * 0.8);
    }
    c.stroke();
    c.fillStyle = 'rgba(255,245,210,0.4)';
    c.beginPath();
    c.ellipse(pts[2][0], pts[2][1] - 0.08, 0.2, 0.06, 0, 0, TAU);
    c.fill();
  }
  const [hx, hy] = pts[1];
  eye(c, mode, hx + 0.08, hy - 0.13, 0.065, e.def.eye, 0, 1);
  eye(c, mode, hx + 0.08, hy + 0.13, 0.065, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ vulture: bald circling scavenger

function vulture(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const flap = Math.sin(t * 5 + P.ph);
  const ang = -2.95 + flap * 0.95;
  const base = e.def.color;
  if (mode === 'body') {
    // far wing
    const fw = wingPath(0.05, -0.15, ang + 0.25, 1.05, 0.5, 5, 0);
    fillBody(c, fw, e, t, shade(base, -0.35), 0.07);
    // tail fan
    const tl = new Path2D();
    tl.moveTo(-0.35, 0.0);
    tl.lineTo(-0.95, -0.05);
    tl.lineTo(-0.98, 0.18);
    tl.lineTo(-0.35, 0.22);
    tl.closePath();
    fillBody(c, tl, e, t, shade(base, -0.2), 0.07);
    // body
    const b = new Path2D();
    b.ellipse(0, 0.08, 0.55, 0.3, -0.08, 0, TAU);
    fillBody(c, b, e, t, base, 0.08);
    // neck and bald head
    c.strokeStyle = '#c87868';
    c.lineWidth = 0.13;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0.42, -0.02);
    c.quadraticCurveTo(0.62, -0.05, 0.7, -0.22);
    c.stroke();
    // pale ruff collar
    const ruff = new Path2D();
    ruff.ellipse(0.4, -0.02, 0.17, 0.2, 0.3, 0, TAU);
    fillBody(c, ruff, e, t, '#e8dccb', 0.06);
    const h = new Path2D();
    h.ellipse(0.74, -0.27, 0.15, 0.12, 0, 0, TAU);
    fillBody(c, h, e, t, '#d88a78', 0.06);
    // hooked beak
    c.fillStyle = '#e8d080';
    c.beginPath();
    c.moveTo(0.84, -0.32);
    c.quadraticCurveTo(1.04, -0.32, 1.02, -0.16);
    c.lineTo(0.95, -0.2);
    c.quadraticCurveTo(0.92, -0.24, 0.84, -0.2);
    c.closePath();
    c.fill();
    c.strokeStyle = DARK;
    c.lineWidth = 0.03;
    c.stroke();
    // near wing
    const nw = wingPath(0.0, -0.1, ang, 1.15, 0.55, 5, 0);
    fillBody(c, nw, e, t, base, 0.08);
    // pale underwing stripe
    c.strokeStyle = 'rgba(230,215,190,0.4)';
    c.lineWidth = 0.06;
    c.beginPath();
    c.moveTo(0, -0.08);
    c.lineTo(Math.cos(ang) * 0.8, -0.08 + Math.sin(ang) * 0.8);
    c.stroke();
  }
  eye(c, mode, 0.78, -0.3, 0.05, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ ram: dune ram with great curled horns

function ram(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const trot = Math.sin(t * 8 + P.ph);
  c.translate(0, -Math.abs(trot) * 0.05);
  const base = e.def.color;
  if (mode === 'body') {
    // legs
    c.strokeStyle = '#3a2a1a';
    c.lineWidth = 0.13;
    c.lineCap = 'round';
    c.beginPath();
    for (const [x, ph] of [
      [-0.5, 0],
      [-0.3, Math.PI],
      [0.3, Math.PI],
      [0.48, 0],
    ] as const) {
      const sw = Math.sin(t * 8 + P.ph + ph) * 0.12;
      c.moveTo(x, 0.25);
      c.lineTo(x + sw, 0.82);
    }
    c.stroke();
    // woolly body, lumpy outline
    const b = new Path2D();
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const r = 1 + 0.07 * Math.sin(i * 2.7) + 0.05 * (i % 2);
      const x = -0.08 + Math.cos(a) * 0.66 * r,
        y = 0.05 + Math.sin(a) * 0.42 * r;
      i ? b.lineTo(x, y) : b.moveTo(x, y);
    }
    b.closePath();
    fillBody(c, b, e, t, mix(base, '#efe0b8', 0.45), 0.08);
    c.strokeStyle = 'rgba(120,90,50,0.45)';
    c.lineWidth = 0.04;
    for (const [x, y] of [
      [-0.4, -0.05],
      [-0.1, -0.15],
      [0.15, 0.05],
      [-0.25, 0.2],
    ]) {
      c.beginPath();
      c.arc(x, y, 0.09, 0.3, Math.PI * 1.5);
      c.stroke();
    }
    // lowered head
    const h = new Path2D();
    h.moveTo(0.42, -0.2);
    h.quadraticCurveTo(0.72, -0.28, 0.9, 0.05);
    h.quadraticCurveTo(0.95, 0.26, 0.78, 0.28);
    h.quadraticCurveTo(0.55, 0.25, 0.45, 0.1);
    h.closePath();
    fillBody(c, h, e, t, shade(base, -0.05), 0.07);
    // horn: a thick ridged spiral curling round the ear
    const hx = 0.55,
      hy = -0.12;
    const spiralPath = () => {
      c.beginPath();
      for (let i = 0; i <= 26; i++) {
        const k = i / 26;
        const a = -Math.PI * 0.75 - k * Math.PI * 1.7;
        const r = 0.36 * (1 - k * 0.72);
        const x = hx + Math.cos(a) * r * -1,
          y = hy + 0.06 + Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
    };
    spiralPath();
    c.strokeStyle = DARK;
    c.lineWidth = 0.2;
    c.lineCap = 'round';
    c.stroke();
    c.strokeStyle = '#d8c094';
    c.lineWidth = 0.15;
    c.stroke();
    c.strokeStyle = 'rgba(255,245,215,0.6)';
    c.lineWidth = 0.04;
    c.stroke();
    c.strokeStyle = 'rgba(90,64,30,0.55)';
    c.lineWidth = 0.02;
    for (let i = 1; i < 9; i++) {
      const k = i / 10;
      const a = -Math.PI * 0.75 - k * Math.PI * 1.7;
      const r = 0.36 * (1 - k * 0.72);
      const x = hx - Math.cos(a) * r,
        y = hy + 0.06 + Math.sin(a) * r;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * 0.07 * -1, y - Math.sin(a) * 0.07);
      c.lineTo(x + Math.cos(a) * 0.07 * -1, y + Math.sin(a) * 0.07);
      c.stroke();
    }
    // muzzle
    c.fillStyle = 'rgba(40,24,10,0.7)';
    c.beginPath();
    c.arc(0.86, 0.15, 0.03, 0, TAU);
    c.fill();
  }
  eye(c, mode, 0.72, -0.04, 0.05, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ firebug: bloated glowing bomber

function firebug(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const pulse = 0.5 + 0.5 * Math.sin(t * 7 + P.ph);
  const ab = 1 + pulse * 0.07;
  const step = Math.sin(t * 13 + P.ph);
  if (mode === 'body') {
    const base = e.def.color;
    legs(c, [0.42, 0.3, 0.18], 0.16, 0.62, step, '#1a0a04', 0.08);
    // bloated abdomen
    const a = new Path2D();
    a.ellipse(-0.28, 0, 0.66 * ab, 0.6 * ab, 0, 0, TAU);
    fillBody(c, a, e, t, base, 0.08);
    // molten interior showing through
    const g = c.createRadialGradient(-0.3, 0, 0.05, -0.28, 0, 0.6 * ab);
    g.addColorStop(0, rgba('#ffe070', 0.55 + 0.35 * pulse));
    g.addColorStop(0.6, rgba('#ff7a20', 0.35 + 0.25 * pulse));
    g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g;
    c.fill(a);
    // segment plates
    c.strokeStyle = 'rgba(40,10,4,0.75)';
    c.lineWidth = 0.05;
    for (const x of [-0.05, -0.3, -0.55]) {
      c.beginPath();
      c.ellipse(x - 0.15, 0, 0.15, 0.5 * ab * (1 - Math.abs(x + 0.28) * 0.6), 0, -Math.PI / 2, Math.PI / 2);
      c.stroke();
    }
    // thorax and head
    const th = new Path2D();
    th.ellipse(0.36, 0, 0.18, 0.24, 0, 0, TAU);
    fillBody(c, th, e, t, shade(base, -0.35), 0.07);
    const h = new Path2D();
    h.ellipse(0.6, 0, 0.13, 0.16, 0, 0, TAU);
    fillBody(c, h, e, t, '#2a0e06', 0.06);
    c.strokeStyle = '#2a0e06';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(0.7, -0.08);
    c.quadraticCurveTo(0.85, -0.2, 0.92, -0.08);
    c.moveTo(0.7, 0.08);
    c.quadraticCurveTo(0.85, 0.2, 0.92, 0.08);
    c.stroke();
  } else {
    radial(c, -0.28, 0, 1.1 * ab, '#ff8a20', 0.35 + 0.35 * pulse);
    c.strokeStyle = rgba('#ffd050', 0.55 + 0.4 * pulse);
    c.lineWidth = 0.05;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-0.6, -0.2);
    c.lineTo(-0.38, -0.05);
    c.lineTo(-0.45, 0.2);
    c.moveTo(-0.15, -0.35);
    c.lineTo(-0.08, -0.1);
    c.moveTo(-0.2, 0.3);
    c.lineTo(0.0, 0.15);
    c.stroke();
  }
  eye(c, mode, 0.66, -0.09, 0.05, e.def.eye, 0, 1);
  eye(c, mode, 0.66, 0.09, 0.05, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ mirage: a wavering heat-haze spirit

function mirage(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const bob = Math.sin(t * 2.4 + P.ph) * 0.06;
  c.translate(0, bob);
  const n = 9;
  const bands: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const y = -1.0 + k * 1.85;
    // teardrop profile: pointed top, full middle, frayed wisp at the bottom
    const w = k < 0.55 ? 0.12 + Math.sin((k / 0.55) * Math.PI * 0.5) * 0.62 : 0.74 * (1 - (k - 0.55) / 0.45) + 0.08;
    const x = Math.sin(t * 5 + i * 1.1 + P.ph) * 0.13 * (0.4 + k);
    bands.push([x, y, w]);
  }
  if (mode === 'body') {
    const p = new Path2D();
    for (const [x, y, w] of bands) {
      p.moveTo(x + w, y);
      p.ellipse(x, y, w, 0.13, 0, 0, TAU);
    }
    c.save();
    c.globalAlpha *= 0.8;
    fillBody(c, p, e, t, e.def.color, 0.05);
    c.restore();
    // shimmering colour bands
    bands.forEach(([x, y, w], i) => {
      c.fillStyle = rgba(i % 3 === 0 ? '#ffe0f4' : i % 3 === 1 ? '#a8f4ff' : '#fff2c0', 0.35 + 0.2 * Math.sin(t * 6 + i));
      c.beginPath();
      c.ellipse(x + 0.05, y - 0.03, w * 0.7, 0.05, 0, 0, TAU);
      c.fill();
    });
  } else {
    bands.forEach(([x, y, w], i) => {
      c.fillStyle = rgba(e.def.eye, 0.12 + 0.08 * Math.sin(t * 7 + i * 1.3));
      c.beginPath();
      c.ellipse(x, y, w * 1.15, 0.18, 0, 0, TAU);
      c.fill();
    });
  }
  const [hx, hy] = bands[2];
  eye(c, mode, hx - 0.17, hy + 0.04, 0.08, e.def.eye, 0, 0.6);
  eye(c, mode, hx + 0.17, hy + 0.04, 0.08, e.def.eye, 0, 0.6);
}

// ------------------------------------------------------------------ scorpion: armoured, tail raised (side view)

function scorpion(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const walk = t * 10 + P.ph;
  const base = e.def.color;
  const sway = Math.sin(t * 2 + P.ph) * 0.05;
  // tail chain: from the rear, up and arching forward over the back
  const tail: [number, number, number][] = [
    [-0.6, 0.08, 0.17],
    [-0.88, -0.22, 0.16],
    [-0.88, -0.58, 0.15],
    [-0.65, -0.86, 0.14],
    [-0.3, -0.95, 0.13],
  ];
  tail.forEach((p, i) => {
    p[0] += sway * i * 0.4;
    p[1] += Math.abs(sway) * i * 0.2;
  });
  if (mode === 'body') {
    // far legs
    const legPath = (dx: number, far: boolean) => {
      c.beginPath();
      for (let i = 0; i < 4; i++) {
        const x = 0.32 - i * 0.24 + dx;
        const out = i < 2 ? 0.1 : -0.1;
        const sw = Math.sin(walk + i * 1.6 + (far ? Math.PI : 0)) * 0.1;
        c.moveTo(x, 0.2);
        c.lineTo(x + out + sw * 0.5, far ? -0.12 : -0.06);
        c.lineTo(x + out * 2.4 + sw, 0.7);
      }
    };
    c.lineCap = 'round';
    c.lineJoin = 'round';
    legPath(0.07, true);
    c.strokeStyle = shade(base, -0.55);
    c.lineWidth = 0.08;
    c.stroke();
    // body: low plated carapace
    const b = new Path2D();
    b.moveTo(-0.72, 0.3);
    b.quadraticCurveTo(-0.7, -0.22, 0.05, -0.2);
    b.quadraticCurveTo(0.62, -0.18, 0.66, 0.22);
    b.quadraticCurveTo(0.3, 0.5, -0.72, 0.3);
    b.closePath();
    fillBody(c, b, e, t, base, 0.08);
    c.strokeStyle = 'rgba(30,10,4,0.65)';
    c.lineWidth = 0.035;
    for (const x of [-0.45, -0.22, 0.01, 0.24]) {
      c.beginPath();
      c.moveTo(x, -0.18);
      c.quadraticCurveTo(x + 0.07, 0.1, x, 0.4);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,190,150,0.3)';
    c.beginPath();
    c.ellipse(-0.1, -0.08, 0.42, 0.06, 0, 0, TAU);
    c.fill();
    // tail: a continuous jointed arc
    c.beginPath();
    c.moveTo(-0.55, 0.1);
    tail.forEach(([x, y]) => c.lineTo(x, y));
    c.strokeStyle = 'rgba(6,3,14,0.85)';
    c.lineWidth = 0.26;
    c.stroke();
    c.strokeStyle = shade(base, -0.15);
    c.lineWidth = 0.18;
    c.stroke();
    // tail segments and stinger
    tail.forEach(([x, y, r], i) => {
      const s = new Path2D();
      s.ellipse(x, y, r, r * 0.85, 0, 0, TAU);
      fillBody(c, s, e, t, i % 2 ? base : shade(base, 0.1), 0.06);
    });
    const [sx, sy] = tail[4];
    const bulb = new Path2D();
    bulb.ellipse(sx + 0.17, sy + 0.05, 0.13, 0.11, 0.4, 0, TAU);
    fillBody(c, bulb, e, t, shade(base, 0.15), 0.06);
    c.fillStyle = '#1a0a04';
    c.beginPath();
    c.moveTo(sx + 0.25, sy + 0.05);
    c.quadraticCurveTo(sx + 0.42, sy + 0.12, sx + 0.36, sy + 0.32);
    c.lineTo(sx + 0.24, sy + 0.14);
    c.closePath();
    c.fill();
    // pincers
    const snip = 0.12 + 0.1 * Math.max(0, Math.sin(t * 4 + P.ph));
    c.strokeStyle = shade(base, -0.3);
    c.lineWidth = 0.1;
    c.beginPath();
    c.moveTo(0.45, 0.12);
    c.quadraticCurveTo(0.7, -0.05, 0.85, 0.02);
    c.stroke();
    const cl = new Path2D();
    cl.ellipse(0.92, 0.02, 0.2, 0.13, -0.2, 0, TAU);
    fillBody(c, cl, e, t, shade(base, 0.05), 0.06);
    const fg = new Path2D();
    fg.moveTo(1.05, -0.05);
    fg.quadraticCurveTo(1.25, -0.1 - snip, 1.28, -0.02 - snip);
    fg.lineTo(1.1, 0.0);
    fg.moveTo(1.05, 0.08);
    fg.quadraticCurveTo(1.25, 0.12 + snip * 0.5, 1.26, 0.04 + snip * 0.5);
    fg.lineTo(1.1, 0.04);
    fillBody(c, fg, e, t, shade(base, -0.1), 0.05);
    // near legs
    legPath(0, false);
    c.strokeStyle = shade(base, -0.3);
    c.lineWidth = 0.08;
    c.stroke();
  } else {
    const [sx, sy] = tail[4];
    radial(c, sx + 0.33, sy + 0.28, 0.25, '#ff6a4a', 0.35);
  }
  eye(c, mode, 0.5, 0.0, 0.045, e.def.eye, 0, 1);
  eye(c, mode, 0.42, -0.02, 0.04, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ the Sandworm: a toothed maw rearing from the dunes

function sandworm(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const sway = Math.sin(t * 1.6 + P.ph);
  const base = e.def.color;
  const hx = sway * 0.15,
    hy = -0.5 + Math.sin(t * 2.3 + P.ph) * 0.05;
  const gape = 0.8 + 0.12 * Math.sin(t * 3 + P.ph);
  if (mode === 'body') {
    // sand churned up behind
    c.fillStyle = '#9a7848';
    c.beginPath();
    c.ellipse(0, 0.72, 1.15, 0.32, 0, Math.PI, TAU);
    c.fill();
    // segmented column rising out of the sand
    const segs = 6;
    for (let k = 0; k < segs; k++) {
      const s = k / (segs - 1);
      const x = hx * s,
        y = 0.72 - s * (0.72 - hy) * 0.88;
      const rx = 0.58 - s * 0.02,
        ry = 0.22;
      const p = new Path2D();
      p.ellipse(x, y, rx, ry, sway * 0.08 * s, 0, TAU);
      fillBody(c, p, e, t, k % 2 ? base : shade(base, -0.1), 0.07);
      c.strokeStyle = 'rgba(255,230,180,0.3)';
      c.lineWidth = 0.04;
      c.beginPath();
      c.ellipse(x, y - 0.04, rx * 0.8, ry * 0.55, sway * 0.08 * s, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    }
    // the maw: an armoured lip around a ring of teeth
    const lip = new Path2D();
    lip.ellipse(hx, hy, 0.72, 0.58, sway * 0.08, 0, TAU);
    fillBody(c, lip, e, t, shade(base, 0.08), 0.08);
    // lip plates
    c.strokeStyle = 'rgba(60,36,14,0.6)';
    c.lineWidth = 0.035;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      c.moveTo(hx + Math.cos(a) * 0.56, hy + Math.sin(a) * 0.44);
      c.lineTo(hx + Math.cos(a) * 0.71, hy + Math.sin(a) * 0.57);
    }
    c.stroke();
    // throat
    const ir = 0.52 * gape;
    const g = c.createRadialGradient(hx, hy + 0.05, 0, hx, hy, ir);
    g.addColorStop(0, '#1a0402');
    g.addColorStop(0.55, '#5a1408');
    g.addColorStop(1, '#a8402a');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(hx, hy, ir, ir * 0.8, 0, 0, TAU);
    c.fill();
    // teeth rings
    for (const [rr, n, len] of [
      [1, 16, 0.16],
      [0.62, 12, 0.11],
    ] as const) {
      c.fillStyle = rr === 1 ? '#f4ead0' : '#d8ccb0';
      c.strokeStyle = 'rgba(60,30,10,0.8)';
      c.lineWidth = 0.02;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (rr === 1 ? 0 : 0.2) + t * (rr === 1 ? 0.15 : -0.25);
        const r0 = ir * rr,
          r1 = r0 - len;
        c.moveTo(hx + Math.cos(a - 0.14) * r0, hy + Math.sin(a - 0.14) * r0 * 0.8);
        c.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1 * 0.8);
        c.lineTo(hx + Math.cos(a + 0.14) * r0, hy + Math.sin(a + 0.14) * r0 * 0.8);
        c.closePath();
      }
      c.fill();
      c.stroke();
    }
    // front lip of sand spilling around its base
    c.fillStyle = '#c8a46a';
    c.beginPath();
    c.ellipse(0, 0.72, 1.15, 0.32, 0, 0, Math.PI);
    c.fill();
    c.strokeStyle = 'rgba(90,60,24,0.7)';
    c.lineWidth = 0.05;
    c.stroke();
    c.fillStyle = '#e0c48a';
    for (let i = 0; i < 6; i++) {
      const a = t * 2 + i * 1.1;
      c.beginPath();
      c.arc(Math.cos(a) * 0.9, 0.7 - Math.abs(Math.sin(a * 1.4)) * 0.3, 0.05, 0, TAU);
      c.fill();
    }
  } else {
    radial(c, hx, hy, 0.75 * gape, e.def.eye, 0.4 + 0.15 * Math.sin(t * 4 + P.ph));
    radial(c, hx, hy + 0.04, 0.25, '#ffd080', 0.5);
  }
}

// ------------------------------------------------------------------ the Phoenix: a bird of living flame (or its ember egg)

function phoenixEgg(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 6 + P.ph);
  const crack = () => {
    c.beginPath();
    c.moveTo(-0.3, -0.25);
    c.lineTo(-0.1, -0.1);
    c.lineTo(-0.18, 0.12);
    c.lineTo(0.05, 0.25);
    c.moveTo(-0.1, -0.1);
    c.lineTo(0.15, -0.2);
    c.lineTo(0.28, 0.0);
    c.moveTo(0.05, 0.25);
    c.lineTo(0.25, 0.4);
    c.moveTo(-0.18, 0.12);
    c.lineTo(-0.35, 0.3);
  };
  if (mode === 'body') {
    const p = new Path2D();
    p.ellipse(0, 0.1, 0.48, 0.62, 0, 0, TAU);
    fillBody(c, p, e, t, '#3a1a10', 0.08);
    const g = c.createRadialGradient(0, 0.15, 0.05, 0, 0.1, 0.6);
    g.addColorStop(0, rgba('#ff9a30', 0.35 + 0.3 * pulse));
    g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g;
    c.fill(p);
    crack();
    c.strokeStyle = mix('#ffb040', '#fff2a0', pulse);
    c.lineWidth = 0.06;
    c.lineCap = 'round';
    c.stroke();
    // licking flames around the base
    for (let i = 0; i < 5; i++) {
      const x = -0.4 + i * 0.2;
      const h = 0.25 + 0.15 * Math.sin(t * 9 + i * 1.7);
      c.fillStyle = rgba(i % 2 ? '#ff7a20' : '#ffd040', 0.85);
      c.beginPath();
      c.moveTo(x - 0.09, 0.65);
      c.quadraticCurveTo(x, 0.65 - h * 1.4, x + 0.09, 0.65);
      c.closePath();
      c.fill();
    }
  } else {
    radial(c, 0, 0.1, 1.4, '#ff8a20', 0.35 + 0.35 * pulse);
    crack();
    c.strokeStyle = rgba('#fff0a0', 0.5 + 0.5 * pulse);
    c.lineWidth = 0.09;
    c.lineCap = 'round';
    c.stroke();
  }
}

function flameWing(c: C, e: Enemy, sx: number, sy: number, ang: number, span: number, far: boolean) {
  const p = wingPath(sx, sy, ang, span, 0.6, 6, 1);
  const dx = Math.cos(ang),
    dy = Math.sin(ang);
  const g = c.createLinearGradient(sx, sy, sx + dx * span, sy + dy * span);
  g.addColorStop(0, far ? '#7a1a08' : e.def.color);
  g.addColorStop(0.55, far ? '#c05010' : '#ff7a1a');
  g.addColorStop(1, far ? '#e0a030' : '#ffe060');
  c.fillStyle = g;
  c.fill(p);
  if (e.hit > 0) {
    c.fillStyle = rgba('#ffffff', Math.min(1, e.hit / 0.12) * 0.8);
    c.fill(p);
  }
  c.strokeStyle = 'rgba(60,10,4,0.8)';
  c.lineWidth = 0.06;
  c.stroke(p);
  // feather veins
  c.strokeStyle = rgba('#fff0a0', far ? 0.25 : 0.5);
  c.lineWidth = 0.035;
  c.beginPath();
  for (let i = 1; i <= 3; i++) {
    const k = i / 4;
    c.moveTo(sx + dx * span * 0.15, sy + dy * span * 0.15);
    c.lineTo(sx + dx * span * (0.6 + k * 0.3) - dy * 0.3 * k * Math.sign(-dy || 1), sy + dy * span * (0.6 + k * 0.3) + dx * 0.3 * k);
  }
  c.stroke();
  return p;
}

function phoenix(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  if ((e.reviveT ?? 0) > 0) return phoenixEgg(c, e, t, P, mode);
  c.scale(P.flip, 1);
  const flap = Math.sin(t * 4 + P.ph);
  const ang = -2.9 + flap * 1.0;
  if (mode === 'body') {
    // trailing tail plumes
    for (let i = 0; i < 3; i++) {
      const w = Math.sin(t * 5 + i * 1.3 + P.ph) * 0.15;
      const p = new Path2D();
      p.moveTo(-0.35, 0.05 + i * 0.06);
      p.quadraticCurveTo(-0.9, 0.0 + i * 0.2 + w, -1.45 - i * 0.08, 0.15 + i * 0.28 + w * 1.5);
      p.quadraticCurveTo(-0.9, 0.2 + i * 0.22 + w, -0.35, 0.2 + i * 0.05);
      p.closePath();
      const g = c.createLinearGradient(-0.35, 0, -1.45, 0);
      g.addColorStop(0, '#ff7a1a');
      g.addColorStop(0.6, '#ffc040');
      g.addColorStop(1, 'rgba(255,240,140,0.2)');
      c.fillStyle = g;
      c.fill(p);
      c.strokeStyle = 'rgba(90,20,4,0.5)';
      c.lineWidth = 0.04;
      c.stroke(p);
      // eye-spot at the plume tip
      c.fillStyle = 'rgba(80,200,220,0.8)';
      c.beginPath();
      c.arc(-1.2 - i * 0.07, 0.13 + i * 0.26 + w * 1.3, 0.05, 0, TAU);
      c.fill();
    }
    flameWing(c, e, 0.08, -0.18, ang + 0.3, 1.2, true);
    // body
    const b = new Path2D();
    b.ellipse(0, 0.05, 0.52, 0.3, -0.15, 0, TAU);
    fillBody(c, b, e, t, e.def.color, 0.08);
    c.fillStyle = 'rgba(255,200,80,0.55)';
    c.beginPath();
    c.ellipse(0.1, 0.15, 0.32, 0.12, -0.15, 0, TAU);
    c.fill();
    // neck and head
    const h = new Path2D();
    h.moveTo(0.3, -0.1);
    h.quadraticCurveTo(0.55, -0.45, 0.78, -0.4);
    h.quadraticCurveTo(0.9, -0.3, 0.72, -0.18);
    h.quadraticCurveTo(0.55, -0.05, 0.45, 0.1);
    h.closePath();
    fillBody(c, h, e, t, '#e05a1a', 0.07);
    // golden beak
    c.fillStyle = '#ffd040';
    c.beginPath();
    c.moveTo(0.82, -0.4);
    c.quadraticCurveTo(1.02, -0.38, 1.0, -0.26);
    c.lineTo(0.84, -0.3);
    c.closePath();
    c.fill();
    c.strokeStyle = DARK;
    c.lineWidth = 0.03;
    c.stroke();
    // flame crest
    for (let i = 0; i < 3; i++) {
      const w = Math.sin(t * 8 + i * 2 + P.ph) * 0.05;
      c.fillStyle = i % 2 ? '#ffd040' : '#ff8a20';
      c.beginPath();
      c.moveTo(0.66 - i * 0.06, -0.44);
      c.quadraticCurveTo(0.6 - i * 0.14 + w, -0.65 - i * 0.03, 0.48 - i * 0.16 + w, -0.72 + i * 0.05);
      c.quadraticCurveTo(0.62 - i * 0.1, -0.56, 0.74 - i * 0.06, -0.42);
      c.closePath();
      c.fill();
    }
    flameWing(c, e, 0.02, -0.12, ang, 1.35, false);
  } else {
    radial(c, 0, 0, 1.7, '#ff7a20', 0.4 + 0.1 * Math.sin(t * 6 + P.ph));
    radial(c, 0.05, 0.0, 0.7, '#ffe080', 0.35);
    // wingtip flames
    const tx = 0.02 + Math.cos(ang) * 1.35,
      ty = -0.12 + Math.sin(ang) * 1.35;
    radial(c, tx, ty, 0.5, '#ffb040', 0.45);
    // embers drifting off
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.9 + i / 6 + P.ph) % 1;
      c.fillStyle = rgba(i % 2 ? '#ffd060' : '#ff7a20', 0.9 * (1 - p));
      c.beginPath();
      c.arc(-0.4 - p * 1.4 + Math.sin(i * 2.3) * 0.2, 0.2 + Math.sin(t * 4 + i) * 0.3 - p * 0.3, 0.05 * (1 - p) + 0.02, 0, TAU);
      c.fill();
    }
  }
  eye(c, mode, 0.74, -0.33, 0.05, e.def.eye, 0, 1);
}

export const SUMMER_ENEMIES: Partial<Record<EnemyId, EnemyDraw>> = {
  scarab,
  skink,
  vulture,
  ram,
  firebug,
  mirage,
  scorpion,
  sandworm,
  phoenix,
} as Partial<Record<EnemyId, EnemyDraw>>;
