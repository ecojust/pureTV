// Winter campaign creatures: the Frost Horde (enemies) and the war mammoth (ally + the pen's resident).
// Enemy conventions as in enemies.ts: ctx translated to the body centre and scaled so 1 unit = radius;
// 'body' draws the creature, 'glow' only its glowing bits for the additive pass.
import type { EnemyId } from '../../game/config';
import type { Ally, Enemy } from '../../game/game';
import { eye, fillBody, type Mode, type Pose } from './enemies';
import type { EnemyDraw } from './realm-art';
import { hash, mix, rgba, shade } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const INK = 'rgba(10,14,30,0.88)';
const COAL = '#15171f';
const TWIG = '#5a3a22';

function softGlow(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A coal lump with a glowing eye in it. */
function coalEye(c: C, mode: Mode, x: number, y: number, r: number, col: string) {
  if (mode === 'body') {
    c.fillStyle = COAL;
    c.beginPath();
    c.arc(x, y, r * 1.35, 0, TAU);
    c.fill();
  }
  eye(c, mode, x, y, r * 0.75, col, 0, 1);
}

function twig(c: C, x: number, y: number, a: number, len: number, w: number) {
  const ex = x + Math.cos(a) * len,
    ey = y + Math.sin(a) * len;
  c.strokeStyle = TWIG;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(ex, ey);
  const mx = x + Math.cos(a) * len * 0.6,
    my = y + Math.sin(a) * len * 0.6;
  c.moveTo(mx, my);
  c.lineTo(mx + Math.cos(a - 0.7) * len * 0.35, my + Math.sin(a - 0.7) * len * 0.35);
  c.moveTo(ex, ey);
  c.lineTo(ex + Math.cos(a + 0.6) * len * 0.25, ey + Math.sin(a + 0.6) * len * 0.25);
  c.lineTo(ex, ey);
  c.lineTo(ex + Math.cos(a - 0.5) * len * 0.22, ey + Math.sin(a - 0.5) * len * 0.22);
  c.stroke();
}

// ------------------------------------------------------------------ snowling: a living snowman imp

function snowling(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const w = Math.sin(t * 9 + P.ph);
  c.translate(0, -Math.abs(w) * 0.08);
  c.rotate(w * 0.1);
  const hx = P.flip * 0.06;
  if (mode === 'body') {
    // twig arms (behind)
    const wave = Math.sin(t * 7 + P.ph * 2) * 0.35;
    twig(c, -0.45, 0.05, Math.PI + 0.5 + wave, 0.62, 0.09);
    twig(c, 0.45, 0.05, -0.5 - wave, 0.62, 0.09);
    const p = new Path2D();
    p.arc(0, 0.32, 0.62, 0, TAU);
    p.moveTo(hx + 0.44, -0.42);
    p.arc(hx, -0.42, 0.44, 0, TAU);
    fillBody(c, p, e, t, e.def.color, 0.09);
    // snow sparkle highlights
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    c.ellipse(-0.2, 0.08, 0.16, 0.08, -0.5, 0, TAU);
    c.ellipse(hx - 0.15, -0.6, 0.12, 0.06, -0.5, 0, TAU);
    c.fill();
    // coal buttons and grin
    c.fillStyle = COAL;
    for (const y of [0.15, 0.42]) {
      c.beginPath();
      c.arc(P.flip * 0.1, y, 0.07, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.2 + i * 0.15);
      c.beginPath();
      c.arc(hx + P.flip * 0.08 + Math.cos(a) * 0.2, -0.36 + Math.sin(a) * 0.12, 0.035, 0, TAU);
      c.fill();
    }
    // icicle nose
    c.fillStyle = '#9fdcff';
    c.beginPath();
    c.moveTo(hx + P.flip * 0.1, -0.48);
    c.lineTo(hx + P.flip * 0.42, -0.42);
    c.lineTo(hx + P.flip * 0.1, -0.38);
    c.closePath();
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.03;
    c.stroke();
    // frosty spikes of hair
    c.fillStyle = '#d8ecff';
    c.beginPath();
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.35;
      c.moveTo(hx + Math.cos(a - 0.15) * 0.4, -0.42 + Math.sin(a - 0.15) * 0.4);
      c.lineTo(hx + Math.cos(a) * (0.62 + (i % 2) * 0.08), -0.42 + Math.sin(a) * (0.62 + (i % 2) * 0.08));
      c.lineTo(hx + Math.cos(a + 0.15) * 0.4, -0.42 + Math.sin(a + 0.15) * 0.4);
    }
    c.fill();
    c.strokeStyle = 'rgba(40,70,120,0.7)';
    c.lineWidth = 0.025;
    c.stroke();
  }
  coalEye(c, mode, hx - 0.15 + P.flip * 0.06, -0.52, 0.09, e.def.eye);
  coalEye(c, mode, hx + 0.15 + P.flip * 0.06, -0.52, 0.09, e.def.eye);
}

// ------------------------------------------------------------------ frost wolf: lean, running

function wolf(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const g = t * 15 + P.ph;
  const gal = Math.sin(g);
  c.translate(0, -Math.abs(Math.cos(g)) * 0.1);
  c.rotate(gal * 0.06);
  const base = e.def.color;
  if (mode === 'body') {
    // legs: gallop — front pair and hind pair swing in opposition
    const legs = new Path2D();
    const leg = (x: number, a: number) => {
      const kx = x + Math.sin(a) * 0.3,
        ky = 0.62;
      legs.moveTo(x - 0.07, 0.15);
      legs.lineTo(x + 0.07, 0.15);
      legs.lineTo(kx + 0.05, ky);
      legs.lineTo(kx + 0.12, ky + 0.05);
      legs.lineTo(kx - 0.08, ky + 0.07);
      legs.closePath();
    };
    leg(-0.55, g);
    leg(-0.42, g + 0.5);
    leg(0.42, g + Math.PI);
    leg(0.55, g + Math.PI + 0.5);
    fillBody(c, legs, e, t, shade(base, -0.25), 0.06);
    // bushy tail
    const tail = new Path2D();
    const tw = Math.sin(g * 0.5) * 0.1;
    tail.moveTo(-0.7, -0.1);
    tail.quadraticCurveTo(-1.15, -0.35 + tw, -1.3, 0.05 + tw);
    tail.quadraticCurveTo(-1.05, 0.08 + tw, -0.72, 0.12);
    tail.closePath();
    fillBody(c, tail, e, t, shade(base, 0.12), 0.06);
    // lean body, deep chest
    const p = new Path2D();
    p.moveTo(-0.8, -0.05);
    p.quadraticCurveTo(-0.6, -0.4, 0, -0.32);
    p.quadraticCurveTo(0.45, -0.35, 0.65, -0.3);
    p.quadraticCurveTo(0.75, 0.15, 0.5, 0.28);
    p.quadraticCurveTo(0, 0.12, -0.55, 0.22);
    p.quadraticCurveTo(-0.85, 0.2, -0.8, -0.05);
    p.closePath();
    // head and long snout
    p.moveTo(0.5, -0.32);
    p.quadraticCurveTo(0.7, -0.62, 0.95, -0.5);
    p.lineTo(1.32, -0.32);
    p.quadraticCurveTo(1.3, -0.2, 1.05, -0.17);
    p.quadraticCurveTo(0.8, -0.05, 0.6, 0.0);
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // pointed ears
    c.fillStyle = shade(base, -0.3);
    c.beginPath();
    c.moveTo(0.68, -0.52);
    c.lineTo(0.72, -0.85);
    c.lineTo(0.86, -0.56);
    c.closePath();
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.04;
    c.stroke();
    // pale frosted ruff and back hackles
    c.strokeStyle = rgba('#f0f8ff', 0.8);
    c.lineWidth = 0.05;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -0.5 + i * 0.18;
      c.moveTo(x, -0.3 - (i > 3 ? 0.04 : 0));
      c.lineTo(x - 0.1, -0.44 - (i % 2) * 0.06);
    }
    c.moveTo(0.55, -0.05);
    c.lineTo(0.42, 0.15);
    c.moveTo(0.62, -0.1);
    c.lineTo(0.55, 0.14);
    c.stroke();
    // nose & bared fangs
    c.fillStyle = COAL;
    c.beginPath();
    c.arc(1.3, -0.3, 0.05, 0, TAU);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(1.1, -0.2);
    c.lineTo(1.13, -0.1);
    c.lineTo(1.16, -0.2);
    c.fill();
  } else {
    // frosty breath streaming back
    for (let i = 0; i < 3; i++) {
      const p = (t * 2 + i / 3 + P.ph) % 1;
      softGlow(c, 1.35 + p * 0.3, -0.25 - p * 0.15, 0.12 + p * 0.15, '#bfefff', 0.25 * (1 - p));
    }
  }
  eye(c, mode, 0.9, -0.4, 0.07, e.def.eye, -0.3, 0.6);
}

// ------------------------------------------------------------------ snow owl: front view, wings beating

function owl(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const f = Math.sin(t * 10 + P.ph);
  const base = e.def.color;
  if (mode === 'body') {
    for (const s of [-1, 1]) {
      const w = new Path2D();
      const tipY = -0.25 - f * 0.65,
        tipX = s * (1.35 - Math.abs(f) * 0.15);
      w.moveTo(s * 0.3, -0.25);
      w.quadraticCurveTo(s * 0.8, -0.55 - f * 0.4, tipX, tipY);
      // scalloped trailing edge
      const n = 4;
      let px = tipX,
        py = tipY;
      for (let i = 1; i <= n; i++) {
        const k = i / n;
        const nx = tipX + (s * 0.35 - tipX) * k,
          ny = tipY + (0.25 - tipY) * k;
        w.quadraticCurveTo((px + nx) / 2, Math.max(py, ny) + 0.16, nx, ny);
        px = nx;
        py = ny;
      }
      w.closePath();
      fillBody(c, w, e, t, shade(base, -0.05), 0.07);
      // dark bars on the flight feathers
      c.strokeStyle = 'rgba(60,62,80,0.55)';
      c.lineWidth = 0.05;
      c.beginPath();
      for (let k = 1; k <= 3; k++) {
        const q = k / 4;
        const x = s * 0.35 + (tipX - s * 0.35) * q,
          y = 0.2 + (tipY - 0.2) * q;
        c.moveTo(x - s * 0.08, y - 0.02);
        c.lineTo(x + s * 0.06, y + 0.12);
      }
      c.stroke();
    }
    // plump body
    const b = new Path2D();
    b.ellipse(0, 0.08, 0.5, 0.72, 0, 0, TAU);
    fillBody(c, b, e, t, base, 0.08);
    // speckles
    c.fillStyle = 'rgba(70,72,90,0.6)';
    for (let i = 0; i < 9; i++) {
      const x = (hash(i * 7 + 3) - 0.5) * 0.6,
        y = 0.1 + hash(i * 11 + 5) * 0.5;
      c.beginPath();
      c.ellipse(x, y, 0.05, 0.025, 0, 0, TAU);
      c.fill();
    }
    // face disc
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(-0.17, -0.3, 0.22, 0.2, 0, 0, TAU);
    c.ellipse(0.17, -0.3, 0.22, 0.2, 0, 0, TAU);
    c.fill();
    // beak
    c.fillStyle = '#3a3428';
    c.beginPath();
    c.moveTo(-0.06, -0.24);
    c.lineTo(0.06, -0.24);
    c.lineTo(0, -0.1);
    c.closePath();
    c.fill();
    // talons
    c.strokeStyle = '#3a3428';
    c.lineWidth = 0.05;
    c.lineCap = 'round';
    c.beginPath();
    for (const s of [-1, 1]) {
      c.moveTo(s * 0.15, 0.75);
      c.lineTo(s * 0.1, 0.9);
      c.moveTo(s * 0.15, 0.75);
      c.lineTo(s * 0.22, 0.9);
    }
    c.stroke();
    c.fillStyle = '#1a1408';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(s * 0.17, -0.33, 0.11, 0, TAU);
      c.fill();
    }
  }
  eye(c, mode, -0.17, -0.33, 0.085, e.def.eye, 0, 1);
  eye(c, mode, 0.17, -0.33, 0.085, e.def.eye, 0, 1);
  if (mode === 'body') {
    c.fillStyle = COAL;
    c.beginPath();
    c.arc(-0.17 + P.flip * 0.02, -0.33, 0.04, 0, TAU);
    c.arc(0.17 + P.flip * 0.02, -0.33, 0.04, 0, TAU);
    c.fill();
  }
}

// ------------------------------------------------------------------ yeti: hulking wall-pounder

function yeti(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const pounding = e.attacking >= 0;
  const step = Math.sin(t * 5 + P.ph);
  const pound = pounding ? Math.sin(t * 9 + P.ph) : 0;
  c.scale(P.flip, 1);
  c.translate(0, pounding ? Math.max(0, pound) * 0.06 : -Math.abs(step) * 0.05);
  const base = e.def.color;
  const face = '#4a8ac8';
  // arm geometry: walking swing, or both fists raised then slammed
  const armA = pounding ? -0.4 - (pound * 0.5 + 0.5) * 1.9 : step * 0.35;
  if (mode === 'body') {
    const legs = new Path2D();
    legs.ellipse(-0.35, 0.72 + Math.max(0, step) * -0.06, 0.24, 0.26, 0, 0, TAU);
    legs.moveTo(0.59, 0.72);
    legs.ellipse(0.35, 0.72 + Math.max(0, -step) * -0.06, 0.24, 0.26, 0, 0, TAU);
    fillBody(c, legs, e, t, shade(base, -0.12), 0.06);
    // back arm
    const arm = (side: number, a: number, shade_: number) => {
      const sx = side * 0.6,
        sy = -0.35;
      const ex = sx + Math.sin(a) * 0.75 * side,
        ey = sy + Math.cos(a) * 0.75;
      const p = new Path2D();
      p.moveTo(sx - 0.18, sy);
      p.lineTo(ex - 0.16, ey);
      p.arc(ex, ey, 0.24, Math.PI, 0, true);
      p.lineTo(sx + 0.18, sy);
      p.closePath();
      fillBody(c, p, e, t, shade(base, shade_), 0.07);
      // knuckles
      c.fillStyle = mix(face, '#20304a', 0.3);
      c.beginPath();
      c.ellipse(ex, ey + 0.12 * Math.sign(Math.cos(a) + 0.01), 0.14, 0.07, 0, 0, TAU);
      c.fill();
    };
    arm(-1, -armA * (pounding ? -1 : 1), -0.15);
    // shaggy body
    const p = new Path2D();
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * TAU;
      const shag = i % 2 ? 1 : 1.1;
      const r = shag * (Math.sin(a) < 0 ? 0.85 : 0.78);
      const x = Math.cos(a) * r * 0.9,
        y = Math.sin(a) * r * 0.92;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // fur strokes
    c.strokeStyle = rgba(shade(base, -0.35), 0.6);
    c.lineWidth = 0.04;
    c.beginPath();
    for (let i = 0; i < 7; i++) {
      const x = -0.5 + i * 0.17,
        y = 0.05 + (i % 2) * 0.2;
      c.moveTo(x, y);
      c.lineTo(x - 0.06, y + 0.18);
    }
    c.stroke();
    // blue face with brow and fangs
    const f = new Path2D();
    f.ellipse(0.22, -0.38, 0.36, 0.3, 0, 0, TAU);
    fillBody(c, f, e, t, face, 0.05);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0.12, -0.28);
    c.lineTo(0.16, -0.17);
    c.lineTo(0.2, -0.28);
    c.moveTo(0.3, -0.28);
    c.lineTo(0.34, -0.17);
    c.lineTo(0.38, -0.28);
    c.fill();
    c.fillStyle = '#122036';
    c.beginPath();
    c.ellipse(0.25, -0.29, 0.15, 0.04, 0, 0, TAU);
    c.fill();
    // little curled horns
    c.strokeStyle = '#8a8a96';
    c.lineWidth = 0.08;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-0.02, -0.72);
    c.quadraticCurveTo(-0.25, -0.95, -0.12, -1.05);
    c.moveTo(0.42, -0.72);
    c.quadraticCurveTo(0.6, -0.95, 0.5, -1.05);
    c.stroke();
    arm(1, armA, 0.05);
  }
  eye(c, mode, 0.13, -0.45, 0.055, e.def.eye, 0.2, 0.8);
  eye(c, mode, 0.33, -0.45, 0.055, e.def.eye, -0.2, 0.8);
}

// ------------------------------------------------------------------ snowball roller

const ROLL_BITS = [
  { a: 0.3, k: 'face' },
  { a: 2.3, k: 'arm' },
  { a: 3.4, k: 'face' },
  { a: 4.6, k: 'arm' },
  { a: 5.5, k: 'boot' },
] as const;

function roller(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const rot = (-(e.dist ?? 0) / Math.max(0.05, P.s * 0.95)) * P.flip + P.ph;
  c.translate(0, 0.05);
  if (mode === 'body') {
    // bits sticking out (behind the ball outline so they protrude)
    c.save();
    c.rotate(rot);
    for (const b of ROLL_BITS) {
      if (b.k === 'arm') twig(c, Math.cos(b.a) * 0.75, Math.sin(b.a) * 0.75, b.a + 0.2, 0.55, 0.08);
      if (b.k === 'boot') {
        c.fillStyle = '#3a2a1e';
        c.beginPath();
        c.ellipse(Math.cos(b.a) * 0.98, Math.sin(b.a) * 0.98, 0.2, 0.12, b.a, 0, TAU);
        c.fill();
      }
    }
    c.restore();
    // lumpy snow ball
    const p = new Path2D();
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU + rot;
      const r = 0.92 + 0.07 * (hash(i % n) - 0.5) * 2;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    fillBody(c, p, e, t, e.def.color, 0.09);
    c.save();
    c.rotate(rot);
    // packed-snow swirl layers
    c.strokeStyle = 'rgba(120,150,200,0.45)';
    c.lineWidth = 0.05;
    c.beginPath();
    c.arc(0, 0, 0.6, 0.2, 2.2);
    c.moveTo(Math.cos(3.2) * 0.4, Math.sin(3.2) * 0.4);
    c.arc(0, 0, 0.4, 3.2, 5.0);
    c.moveTo(Math.cos(4.0) * 0.78, Math.sin(4.0) * 0.78);
    c.arc(0, 0, 0.78, 4.0, 5.6);
    c.stroke();
    c.restore();
    // static highlight (lit from upper-left regardless of spin)
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.ellipse(-0.35, -0.42, 0.25, 0.12, -0.6, 0, TAU);
    c.fill();
  }
  // trapped snowling faces roll around with the ball
  c.rotate(rot);
  for (const b of ROLL_BITS) {
    if (b.k !== 'face') continue;
    const fx = Math.cos(b.a) * 0.55,
      fy = Math.sin(b.a) * 0.55;
    const ox = Math.cos(b.a + Math.PI / 2) * 0.13,
      oy = Math.sin(b.a + Math.PI / 2) * 0.13;
    coalEye(c, mode, fx + ox, fy + oy, 0.08, e.def.eye);
    coalEye(c, mode, fx - ox, fy - oy, 0.08, e.def.eye);
    if (mode === 'body') {
      c.fillStyle = COAL;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.arc(fx + Math.cos(b.a) * 0.18 + ox * k * 0.7, fy + Math.sin(b.a) * 0.18 + oy * k * 0.7, 0.035, 0, TAU);
        c.fill();
      }
    }
  }
}

// ------------------------------------------------------------------ ice golem: chunky blocks

function golem(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const st = Math.sin(t * 4 + P.ph);
  c.translate(0, -Math.abs(st) * 0.05);
  const base = e.def.color;
  if (mode === 'body') {
    const quad = (p: Path2D, pts: number[]) => {
      p.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
      p.closePath();
    };
    const legs = new Path2D();
    quad(legs, [-0.5, 0.45, -0.12, 0.45, -0.14 + st * 0.05, 0.98, -0.55 + st * 0.05, 0.95]);
    quad(legs, [0.12, 0.45, 0.5, 0.45, 0.55 - st * 0.05, 0.95, 0.14 - st * 0.05, 0.98]);
    fillBody(c, legs, e, t, shade(base, -0.2), 0.06);
    const arms = new Path2D();
    const sw = st * 0.1;
    quad(arms, [-0.95, -0.35, -0.6, -0.4, -0.62 + sw, 0.35, -1.05 + sw, 0.3]);
    quad(arms, [-1.08 + sw, 0.32, -0.6 + sw, 0.36, -0.58 + sw, 0.68, -1.1 + sw, 0.66]);
    fillBody(c, arms, e, t, shade(base, -0.12), 0.06);
    // torso: a big irregular crystal block
    const p = new Path2D();
    quad(p, [-0.72, -0.55, -0.2, -0.75, 0.6, -0.62, 0.78, -0.1, 0.6, 0.55, -0.62, 0.58, -0.8, 0.0]);
    // head block
    quad(p, [-0.05, -0.68, -0.08, -1.08, 0.42, -1.12, 0.5, -0.66]);
    fillBody(c, p, e, t, base, 0.08);
    // inner facet edges and frosted highlights
    c.strokeStyle = 'rgba(235,252,255,0.7)';
    c.lineWidth = 0.035;
    c.beginPath();
    c.moveTo(-0.72, -0.55);
    c.lineTo(-0.1, -0.15);
    c.lineTo(0.6, -0.62);
    c.moveTo(-0.1, -0.15);
    c.lineTo(0.0, 0.58);
    c.moveTo(-0.1, -0.15);
    c.lineTo(0.78, -0.1);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.moveTo(-0.72, -0.55);
    c.lineTo(-0.2, -0.75);
    c.lineTo(0.6, -0.62);
    c.lineTo(-0.1, -0.15);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(20,60,110,0.25)';
    c.beginPath();
    c.moveTo(0.78, -0.1);
    c.lineTo(0.6, 0.55);
    c.lineTo(0.0, 0.58);
    c.lineTo(-0.1, -0.15);
    c.closePath();
    c.fill();
    // front arm
    const fa = new Path2D();
    quad(fa, [0.62, -0.42, 0.98, -0.36, 1.06 - sw, 0.3, 0.64 - sw, 0.34]);
    quad(fa, [0.6 - sw, 0.36, 1.1 - sw, 0.32, 1.12 - sw, 0.7, 0.58 - sw, 0.7]);
    fillBody(c, fa, e, t, shade(base, 0.05), 0.06);
    // snow caps on the shoulders and head
    c.fillStyle = '#f6fbff';
    c.beginPath();
    c.ellipse(-0.82, -0.38, 0.18, 0.07, 0.1, 0, TAU);
    c.ellipse(0.8, -0.4, 0.18, 0.07, -0.1, 0, TAU);
    c.ellipse(0.17, -1.1, 0.25, 0.07, -0.05, 0, TAU);
    c.fill();
    // a frozen core visible inside
    c.fillStyle = 'rgba(200,250,255,0.55)';
    c.beginPath();
    c.moveTo(0.05, -0.35);
    c.lineTo(0.22, -0.1);
    c.lineTo(0.05, 0.15);
    c.lineTo(-0.12, -0.1);
    c.closePath();
    c.fill();
  } else {
    softGlow(c, 0.05, -0.1, 0.45, e.def.eye, 0.18 + 0.08 * Math.sin(t * 3 + P.ph));
  }
  eye(c, mode, 0.1, -0.9, 0.06, e.def.eye, 0, 0.6);
  eye(c, mode, 0.32, -0.9, 0.06, e.def.eye, 0, 0.6);
}

// ------------------------------------------------------------------ frost wraith: hooded swirl of mist

function frostwraith(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const sway = Math.sin(t * 2.5 + P.ph);
  c.rotate(sway * 0.06);
  const base = e.def.color;
  if (mode === 'body') {
    // swirling mist behind
    for (let i = 0; i < 3; i++) {
      const a = t * 1.8 + (i / 3) * TAU + P.ph;
      c.strokeStyle = rgba('#dff4ff', 0.35);
      c.lineWidth = 0.1;
      c.lineCap = 'round';
      c.beginPath();
      c.ellipse(0, 0.1, 0.95, 0.45, 0, a, a + 1.6);
      c.stroke();
    }
    // reaching sleeves
    for (const s of [-1, 1]) {
      const sl = new Path2D();
      const ry = -0.1 + Math.sin(t * 3 + s + P.ph) * 0.08;
      sl.moveTo(s * 0.3, -0.3);
      sl.quadraticCurveTo(s * 0.8, -0.35, s * 1.0, ry);
      sl.lineTo(s * 0.85, ry + 0.25);
      sl.quadraticCurveTo(s * 0.6, 0.0, s * 0.3, 0.05);
      sl.closePath();
      fillBody(c, sl, e, t, shade(base, -0.1), 0.06);
      // icy claws
      c.strokeStyle = '#d8f4ff';
      c.lineWidth = 0.04;
      c.beginPath();
      for (let k = 0; k < 3; k++) {
        c.moveTo(s * 0.95, ry + 0.08 + k * 0.06);
        c.lineTo(s * (1.18 + k * 0.03), ry + 0.15 + k * 0.1);
      }
      c.stroke();
    }
    // cloak: hood narrowing at the top, tattered hem fluttering
    const p = new Path2D();
    p.moveTo(0, -1.0);
    p.quadraticCurveTo(0.55, -0.9, 0.5, -0.35);
    p.quadraticCurveTo(0.65, 0.2, 0.6, 0.6);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = 0.6 - (i / n) * 1.2,
        x1 = 0.6 - ((i + 1) / n) * 1.2;
      const tip = 0.95 + 0.15 * Math.sin(t * 7 + P.ph + i * 1.7);
      p.lineTo((x0 + x1) / 2, tip);
      p.lineTo(x1, 0.62 + 0.05 * Math.sin(t * 5 + i));
    }
    p.quadraticCurveTo(-0.65, 0.2, -0.5, -0.35);
    p.quadraticCurveTo(-0.55, -0.9, 0, -1.0);
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // frost rime on the cloak
    c.strokeStyle = rgba('#e8f8ff', 0.55);
    c.lineWidth = 0.035;
    c.beginPath();
    c.moveTo(-0.45, -0.3);
    c.quadraticCurveTo(0, -0.12, 0.45, -0.3);
    c.moveTo(-0.15, 0.0);
    c.lineTo(-0.2, 0.7);
    c.moveTo(0.18, 0.0);
    c.lineTo(0.25, 0.7);
    c.stroke();
    // dark hood opening
    c.fillStyle = '#060a18';
    c.beginPath();
    c.ellipse(P.flip * 0.05, -0.5, 0.27, 0.3, 0, 0, TAU);
    c.fill();
  } else {
    softGlow(c, 0, 0.1, 1.1, '#9fe8ff', 0.12 + 0.05 * Math.sin(t * 2 + P.ph));
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.5 + i / 5 + P.ph) % 1;
      const a = (i / 5) * TAU + t;
      softGlow(c, Math.cos(a) * 0.8, 0.2 + Math.sin(a) * 0.35 - p * 0.3, 0.1, '#e8fbff', 0.5 * (1 - p));
    }
  }
  eye(c, mode, P.flip * 0.05 - 0.1, -0.52, 0.06, e.def.eye, 0.3, 0.55);
  eye(c, mode, P.flip * 0.05 + 0.1, -0.52, 0.06, e.def.eye, -0.3, 0.55);
}

// ------------------------------------------------------------------ the Frost Giant (ground boss)

function frostgiant(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  const st = Math.sin(t * 2.6 + P.ph);
  const attacking = e.attacking >= 0;
  const swing = attacking ? Math.sin(t * 5 + P.ph) : st * 0.3;
  c.scale(P.flip, 1);
  c.translate(0, -Math.abs(st) * 0.05);
  const base = e.def.color;
  const stone = '#6e7484';
  if (mode === 'body') {
    // pillar legs of stone wrapped in ice
    const legs = new Path2D();
    legs.rect(-0.5, 0.45, 0.34, 0.55 + st * 0.05);
    legs.rect(0.16, 0.45, 0.34, 0.55 - st * 0.05);
    fillBody(c, legs, e, t, stone, 0.06);
    // back arm
    const ba = new Path2D();
    ba.ellipse(-0.85, 0.05 - st * 0.08, 0.2, 0.45, 0.25, 0, TAU);
    ba.moveTo(-0.72, 0.5);
    ba.arc(-0.92, 0.5 - st * 0.08, 0.22, 0, TAU);
    fillBody(c, ba, e, t, shade(base, -0.2), 0.06);
    // massive torso
    const p = new Path2D();
    p.moveTo(-0.85, -0.35);
    p.quadraticCurveTo(-0.9, -0.85, -0.3, -0.85);
    p.lineTo(0.35, -0.88);
    p.quadraticCurveTo(0.95, -0.85, 0.85, -0.3);
    p.quadraticCurveTo(0.8, 0.45, 0.55, 0.6);
    p.lineTo(-0.55, 0.6);
    p.quadraticCurveTo(-0.85, 0.45, -0.85, -0.35);
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // stone plates set into the ice
    c.fillStyle = rgba(stone, 0.85);
    c.strokeStyle = 'rgba(20,24,36,0.7)';
    c.lineWidth = 0.025;
    for (const pts of [
      [-0.7, -0.6, -0.35, -0.7, -0.3, -0.35, -0.65, -0.25],
      [0.35, 0.05, 0.7, -0.05, 0.62, 0.4, 0.3, 0.42],
      [-0.6, 0.15, -0.3, 0.1, -0.35, 0.45, -0.62, 0.42],
    ]) {
      c.beginPath();
      c.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // ice spikes on the shoulders
    c.fillStyle = '#d8f4ff';
    c.strokeStyle = INK;
    c.lineWidth = 0.03;
    for (const [x, y, a, l] of [
      [-0.75, -0.72, -2.3, 0.35],
      [-0.55, -0.85, -2.0, 0.42],
      [0.55, -0.86, -1.1, 0.42],
      [0.78, -0.7, -0.8, 0.35],
    ]) {
      c.beginPath();
      c.moveTo(x + Math.cos(a + 1.5) * 0.08, y + Math.sin(a + 1.5) * 0.08);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.lineTo(x + Math.cos(a - 1.5) * 0.08, y + Math.sin(a - 1.5) * 0.08);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // craggy head
    const h = new Path2D();
    h.moveTo(-0.08, -0.72);
    h.lineTo(-0.12, -1.06);
    h.lineTo(0.12, -1.2);
    h.lineTo(0.5, -1.15);
    h.lineTo(0.64, -0.86);
    h.lineTo(0.5, -0.68);
    h.closePath();
    fillBody(c, h, e, t, '#5e7894', 0.06);
    // heavy brow
    c.fillStyle = stone;
    c.beginPath();
    c.moveTo(0.05, -1.02);
    c.lineTo(0.52, -1.0);
    c.lineTo(0.5, -0.92);
    c.lineTo(0.05, -0.94);
    c.closePath();
    c.fill();
    // icy crown
    c.fillStyle = '#bff0ff';
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const x = 0.0 + i * 0.14;
      c.moveTo(x, -1.12 + i * 0.01);
      c.lineTo(x + 0.06, -1.36 - (i % 2) * 0.08);
      c.lineTo(x + 0.12, -1.12);
    }
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.025;
    c.stroke();
    // great frost beard down the chest
    const bd = new Path2D();
    bd.moveTo(0.02, -0.84);
    bd.lineTo(0.55, -0.84);
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const x = 0.55 - (i / n) * 0.55;
      const y = i % 2 ? -0.35 : -0.1 + Math.sin(t * 2 + i) * 0.03;
      bd.lineTo(x, y);
    }
    bd.closePath();
    c.fillStyle = '#f4fbff';
    c.fill(bd);
    c.strokeStyle = 'rgba(80,120,170,0.8)';
    c.lineWidth = 0.03;
    c.stroke(bd);
    c.strokeStyle = 'rgba(150,190,230,0.7)';
    c.beginPath();
    c.moveTo(0.18, -0.8);
    c.lineTo(0.15, -0.3);
    c.moveTo(0.38, -0.8);
    c.lineTo(0.4, -0.3);
    c.stroke();
    // front arm swinging an ice-spiked club
    c.save();
    c.translate(0.72, -0.45);
    c.rotate(-0.4 - swing * 0.9);
    const club = new Path2D();
    club.moveTo(0.04, 0.0);
    club.lineTo(0.12, 1.05);
    club.quadraticCurveTo(0.0, 1.35, -0.2, 1.1);
    club.lineTo(-0.06, 0.0);
    club.closePath();
    fillBody(c, club, e, t, '#6a4a30', 0.05);
    c.fillStyle = '#d8f4ff';
    c.strokeStyle = INK;
    c.lineWidth = 0.025;
    for (const [x, y, a] of [
      [0.1, 0.85, 0.2],
      [-0.18, 0.95, Math.PI - 0.3],
      [0.05, 1.18, 1.2],
      [-0.14, 1.12, 2.3],
    ]) {
      c.beginPath();
      c.moveTo(x + Math.cos(a + 1.5) * 0.05, y + Math.sin(a + 1.5) * 0.05);
      c.lineTo(x + Math.cos(a) * 0.2, y + Math.sin(a) * 0.2);
      c.lineTo(x + Math.cos(a - 1.5) * 0.05, y + Math.sin(a - 1.5) * 0.05);
      c.closePath();
      c.fill();
      c.stroke();
    }
    const arm = new Path2D();
    arm.ellipse(0, 0.12, 0.2, 0.32, 0, 0, TAU);
    arm.moveTo(0.18, 0.35);
    arm.arc(0, 0.35, 0.18, 0, TAU);
    fillBody(c, arm, e, t, shade(base, 0.05), 0.06);
    c.restore();
  } else {
    softGlow(c, 0.2, -0.3, 0.9, '#7ae8ff', 0.12 + 0.05 * st);
    // frost breath from under the beard
    for (let i = 0; i < 3; i++) {
      const p = (t * 1.2 + i / 3 + P.ph) % 1;
      softGlow(c, 0.6 + p * 0.5, -0.65 + p * 0.1, 0.12 + p * 0.2, '#cff6ff', 0.3 * (1 - p));
    }
  }
  eye(c, mode, 0.22, -0.9, 0.06, e.def.eye, 0, 0.6);
  eye(c, mode, 0.42, -0.9, 0.06, e.def.eye, 0, 0.6);
}

// ------------------------------------------------------------------ the Ice Wyvern (air boss), top-down

function wyvern(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const f = Math.sin(t * 3.2 + P.ph);
  const span = 1.5 + 0.28 * f;
  const base = e.def.color;
  if (mode === 'body') {
    // tail with spines, curving
    const tw = Math.sin(t * 2 + P.ph) * 0.15;
    c.strokeStyle = shade(base, -0.2);
    c.lineCap = 'round';
    c.lineWidth = 0.16;
    c.beginPath();
    c.moveTo(-0.4, 0);
    c.quadraticCurveTo(-0.95, tw, -1.4, -tw * 0.5);
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 0.025;
    c.stroke();
    c.fillStyle = '#d8f6ff';
    c.beginPath();
    c.moveTo(-1.35, -tw * 0.5);
    c.lineTo(-1.55, -0.14 - tw * 0.5);
    c.lineTo(-1.62, -tw * 0.5);
    c.lineTo(-1.55, 0.14 - tw * 0.5);
    c.closePath();
    c.fill();
    for (const s of [-1, 1]) {
      // wing membrane with finger bones
      const w = new Path2D();
      const sh = 0.25;
      const fingers: [number, number][] = [
        [0.35, s * span * 0.95],
        [-0.15, s * span * 0.98],
        [-0.55, s * span * 0.8],
        [-0.75, s * span * 0.5],
      ];
      const ex = 0.15,
        ey = s * span * 0.5;
      w.moveTo(sh, s * 0.12);
      w.lineTo(ex + 0.2, ey);
      w.lineTo(fingers[0][0], fingers[0][1]);
      for (let i = 1; i < fingers.length; i++) {
        const [px, py] = fingers[i - 1],
          [nx, ny] = fingers[i];
        w.quadraticCurveTo((px + nx) / 2 + 0.05, (py + ny) / 2 - s * 0.18, nx, ny);
      }
      w.quadraticCurveTo(-0.6, s * 0.3, -0.35, s * 0.1);
      w.closePath();
      fillBody(c, w, e, t, mix(base, '#bfe0ff', 0.25), 0.06);
      c.strokeStyle = shade(base, -0.4);
      c.lineWidth = 0.05;
      c.beginPath();
      c.moveTo(sh, s * 0.12);
      c.lineTo(ex + 0.2, ey);
      for (const [x, y] of fingers) {
        c.moveTo(ex + 0.2, ey);
        c.lineTo(x, y);
      }
      c.stroke();
      // frost crust on the leading edge
      c.strokeStyle = 'rgba(235,250,255,0.8)';
      c.lineWidth = 0.035;
      c.beginPath();
      c.moveTo(sh, s * 0.12);
      c.lineTo(ex + 0.2, ey);
      c.lineTo(fingers[0][0], fingers[0][1]);
      c.stroke();
      // tucked hind claws
      c.fillStyle = shade(base, -0.3);
      c.beginPath();
      c.ellipse(-0.42, s * 0.2, 0.12, 0.06, s * 0.4, 0, TAU);
      c.fill();
    }
    // body and neck
    const b = new Path2D();
    b.ellipse(-0.05, 0, 0.5, 0.26, 0, 0, TAU);
    b.moveTo(0.35, -0.1);
    b.quadraticCurveTo(0.65, -0.1, 0.8, -0.07);
    b.lineTo(0.8, 0.07);
    b.quadraticCurveTo(0.65, 0.1, 0.35, 0.1);
    b.closePath();
    fillBody(c, b, e, t, base, 0.07);
    // icy dorsal spines
    c.fillStyle = '#e0f8ff';
    c.strokeStyle = INK;
    c.lineWidth = 0.02;
    for (let i = 0; i < 6; i++) {
      const x = 0.6 - i * 0.2;
      c.beginPath();
      c.moveTo(x + 0.06, -0.04);
      c.lineTo(x - 0.1, 0);
      c.lineTo(x + 0.06, 0.04);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // head with swept-back horns
    const h = new Path2D();
    h.moveTo(0.78, -0.12);
    h.quadraticCurveTo(1.0, -0.16, 1.18, -0.05);
    h.lineTo(1.18, 0.05);
    h.quadraticCurveTo(1.0, 0.16, 0.78, 0.12);
    h.closePath();
    fillBody(c, h, e, t, shade(base, 0.1), 0.05);
    c.fillStyle = '#eefaff';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(0.88, s * 0.1);
      c.quadraticCurveTo(0.75, s * 0.25, 0.6, s * 0.3);
      c.lineTo(0.85, s * 0.05);
      c.closePath();
      c.fill();
      c.stroke();
    }
  } else {
    softGlow(c, 0, 0, 0.7, e.def.eye, 0.15 + 0.06 * f);
    // frosty breath streaming from the jaws
    for (let i = 0; i < 5; i++) {
      const p = (t * 1.4 + i / 5 + P.ph) % 1;
      const sp = Math.sin(i * 2.3 + t) * 0.1 * p;
      softGlow(c, 1.2 + p * 0.7, sp, 0.08 + p * 0.22, '#c8f8ff', 0.4 * (1 - p));
    }
  }
  eye(c, mode, 0.98, -0.07, 0.045, e.def.eye, 0, 1);
  eye(c, mode, 0.98, 0.07, 0.045, e.def.eye, 0, 1);
}

export const WINTER_ENEMIES: Partial<Record<EnemyId, EnemyDraw>> = {
  snowling,
  wolf,
  owl,
  yeti,
  roller,
  golem,
  frostwraith,
  frostgiant,
  wyvern,
} as Partial<Record<EnemyId, EnemyDraw>>;

// ------------------------------------------------------------------ the war mammoth

const WOOL = '#7a4e30';
const WOOL_L = '#a8724a';
const WOOL_D = '#4a2c1a';
const IVORY = '#f2e8d0';
const BLANKET = '#b8322e';
const BLANKET_B = '#2e5a9a';

/**
 * Side view of the woolly war mammoth, facing +x, in local units where the body spans roughly
 * [-1, 1.2] × [-1.1, 1]. `walk` is the gait phase, `stride` its amplitude, `banner` adds a pennant.
 */
export function mammothSide(c: C, t: number, walk: number, stride: number, banner: boolean) {
  const leg = (x: number, ph: number, col: string) => {
    const sw = Math.sin(walk + ph) * stride;
    const lift = Math.max(0, Math.cos(walk + ph)) * stride * 0.25;
    c.beginPath();
    c.moveTo(x - 0.17, 0.2);
    c.lineTo(x + 0.17, 0.2);
    c.lineTo(x + 0.15 + sw * 0.4, 0.92 - lift);
    c.lineTo(x - 0.15 + sw * 0.4, 0.92 - lift);
    c.closePath();
    c.fillStyle = col;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.05;
    c.stroke();
    // toenails
    c.fillStyle = IVORY;
    c.fillRect(x - 0.12 + sw * 0.4, 0.86 - lift, 0.24, 0.06);
  };
  // far legs
  leg(-0.55, Math.PI, WOOL_D);
  leg(0.45, 0, WOOL_D);
  // tail
  c.strokeStyle = WOOL_D;
  c.lineWidth = 0.07;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-0.92, -0.2);
  c.quadraticCurveTo(-1.1, 0.0 + Math.sin(walk) * 0.08, -1.05, 0.25);
  c.stroke();
  // body: high domed shoulders sloping to the rump
  const body = new Path2D();
  body.moveTo(-0.95, 0.2);
  body.quadraticCurveTo(-1.0, -0.45, -0.55, -0.55);
  body.quadraticCurveTo(0.0, -0.62, 0.3, -0.85);
  body.quadraticCurveTo(0.7, -1.05, 0.95, -0.7);
  body.quadraticCurveTo(1.15, -0.4, 1.0, 0.0);
  body.lineTo(0.9, 0.45);
  body.quadraticCurveTo(0.0, 0.6, -0.8, 0.45);
  body.closePath();
  const g = c.createLinearGradient(0, -1, 0, 0.6);
  g.addColorStop(0, WOOL_L);
  g.addColorStop(0.5, WOOL);
  g.addColorStop(1, WOOL_D);
  c.fillStyle = g;
  c.fill(body);
  c.strokeStyle = INK;
  c.lineWidth = 0.06;
  c.stroke(body);
  // shaggy fringe hanging from the belly
  c.fillStyle = WOOL_D;
  c.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -0.75 + i * 0.19;
    const sway = Math.sin(walk * 0.5 + i) * 0.03;
    c.moveTo(x - 0.09, 0.42);
    c.lineTo(x + sway, 0.62 + (i % 2) * 0.06);
    c.lineTo(x + 0.09, 0.42);
  }
  c.fill();
  // blanket with a woven border
  c.beginPath();
  c.moveTo(-0.55, -0.52);
  c.quadraticCurveTo(-0.1, -0.62, 0.25, -0.78);
  c.lineTo(0.35, 0.12);
  c.quadraticCurveTo(-0.1, 0.22, -0.6, 0.12);
  c.closePath();
  c.fillStyle = BLANKET;
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 0.04;
  c.stroke();
  c.strokeStyle = BLANKET_B;
  c.lineWidth = 0.07;
  c.beginPath();
  c.moveTo(-0.6, 0.04);
  c.quadraticCurveTo(-0.1, 0.14, 0.34, 0.04);
  c.stroke();
  c.strokeStyle = '#f4f0e0';
  c.lineWidth = 0.025;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = -0.52 + i * 0.16;
    c.moveTo(x, 0.0);
    c.lineTo(x + 0.06, 0.08);
    c.lineTo(x + 0.12, 0.0);
  }
  c.stroke();
  // saddle
  c.fillStyle = '#5a3a20';
  c.beginPath();
  c.ellipse(-0.12, -0.62, 0.3, 0.1, -0.2, 0, TAU);
  c.fill();
  c.stroke();
  if (banner) {
    c.strokeStyle = '#3a2614';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(-0.3, -0.62);
    c.lineTo(-0.36, -1.45);
    c.stroke();
    const fl = Math.sin(t * 6) * 0.06;
    c.beginPath();
    c.moveTo(-0.36, -1.45);
    c.quadraticCurveTo(-0.65, -1.38 + fl, -0.9, -1.32 - fl);
    c.lineTo(-0.66, -1.22);
    c.lineTo(-0.88, -1.12 + fl);
    c.quadraticCurveTo(-0.6, -1.14, -0.35, -1.18);
    c.closePath();
    c.fillStyle = '#ff8a3a';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.03;
    c.stroke();
  }
  // near legs
  leg(-0.38, 0, WOOL);
  leg(0.65, Math.PI, WOOL);
  // head: domed, with a curling trunk
  const head = new Path2D();
  head.moveTo(0.75, -0.75);
  head.quadraticCurveTo(1.0, -1.08, 1.3, -0.82);
  head.quadraticCurveTo(1.45, -0.55, 1.35, -0.25);
  head.quadraticCurveTo(1.1, -0.15, 0.9, -0.2);
  head.closePath();
  c.fillStyle = WOOL;
  c.fill(head);
  c.strokeStyle = INK;
  c.lineWidth = 0.05;
  c.stroke(head);
  const tr = Math.sin(walk * 0.5) * 0.08;
  c.strokeStyle = INK;
  c.lineWidth = 0.2;
  c.beginPath();
  c.moveTo(1.32, -0.35);
  c.quadraticCurveTo(1.5, 0.1, 1.38 + tr, 0.55);
  c.quadraticCurveTo(1.34 + tr, 0.7, 1.22 + tr, 0.64);
  c.stroke();
  c.strokeStyle = WOOL;
  c.lineWidth = 0.13;
  c.stroke();
  // ear flap
  c.fillStyle = WOOL_D;
  c.beginPath();
  c.ellipse(0.95, -0.6, 0.14, 0.2, 0.2, 0, TAU);
  c.fill();
  // great curved tusks
  c.beginPath();
  c.moveTo(1.25, -0.3);
  c.bezierCurveTo(1.55, 0.2, 2.0, 0.0, 1.85, -0.45);
  c.bezierCurveTo(1.85, -0.1, 1.55, 0.05, 1.32, -0.2);
  c.closePath();
  c.fillStyle = IVORY;
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 0.04;
  c.stroke();
  // eye
  c.fillStyle = '#120a06';
  c.beginPath();
  c.arc(1.15, -0.62, 0.045, 0, TAU);
  c.fill();
}

export function drawMammothAlly(ctx: C, a: Ally, t: number) {
  const charging = !a.home;
  const busy = (a.busy ?? 0) > 0;
  const dir = Math.cos(a.facing) < -0.05 ? -1 : 1;
  const sc = 0.36;
  const walk = t * (charging ? 13 : 6) + a.uid;
  const bob = Math.abs(Math.sin(walk)) * (charging ? 0.03 : 0.015);
  ctx.save();
  // trampled-snow dust behind and under the feet
  if (charging || busy) {
    for (let i = 0; i < (busy ? 7 : 4); i++) {
      const p = (t * 2.2 + i / (busy ? 7 : 4) + a.uid * 0.37) % 1;
      const x = a.x - dir * (0.1 + p * 0.45) + Math.sin(i * 2.7) * 0.15;
      const y = a.y + 0.28 - p * 0.18;
      ctx.fillStyle = rgba('#eef6ff', 0.55 * (1 - p) * (busy ? 1 : 0.7));
      ctx.beginPath();
      ctx.arc(x, y, 0.06 + p * 0.12, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(20,30,60,0.3)';
  ctx.beginPath();
  ctx.ellipse(a.x, a.y + 0.32, 0.5, 0.13, 0, 0, TAU);
  ctx.fill();
  ctx.translate(a.x, a.y - 0.02 - bob);
  ctx.scale(sc * dir, sc);
  if (busy) ctx.rotate(-0.08);
  mammothSide(ctx, t, walk, charging ? 0.5 : 0.3, true);
  ctx.restore();
}
