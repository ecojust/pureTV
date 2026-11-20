// Spring campaign art: the garden pests. Same conventions as enemies.ts — the ctx is translated to
// the body centre and scaled so 1 local unit = the enemy's radius; `mode` draws the body or only
// the glowing bits (eyes, glints) for the additive pass. Mostly side views mirrored by P.flip.
import type { EnemyId } from '../../game/config';
import type { Enemy } from '../../game/game';
import { eye, fillBody } from './enemies';
import type { EnemyDraw, Mode, Pose } from './realm-art';
import { mix, rgba, shade } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function dot(c: C, x: number, y: number, r: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

/** A glint: a four-point sparkle (glow pass). */
function glint(c: C, x: number, y: number, r: number, a: number) {
  if (a <= 0) return;
  c.fillStyle = rgba('#ffffff', a);
  c.beginPath();
  c.moveTo(x, y - r);
  c.lineTo(x + r * 0.22, y);
  c.lineTo(x, y + r);
  c.lineTo(x - r * 0.22, y);
  c.closePath();
  c.moveTo(x - r, y);
  c.lineTo(x, y + r * 0.22);
  c.lineTo(x + r, y);
  c.lineTo(x, y - r * 0.22);
  c.closePath();
  c.fill();
}

// ------------------------------------------------------------------ slug

function slug(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const w = Math.sin(t * 3 + P.ph);
  c.scale(1 + w * 0.06, 1 - w * 0.04);
  const base = e.def.color;
  if (mode === 'body') {
    // slime trail sheen
    const tg = c.createLinearGradient(-1.7, 0, -0.6, 0);
    tg.addColorStop(0, 'rgba(220,240,200,0)');
    tg.addColorStop(1, 'rgba(220,240,200,0.45)');
    c.fillStyle = tg;
    c.beginPath();
    c.ellipse(-1.0, 0.62, 0.7, 0.1, 0, 0, TAU);
    c.fill();
    const p = new Path2D();
    p.moveTo(-1.2, 0.6);
    p.quadraticCurveTo(-0.9, 0.2, -0.3, 0.0);
    p.quadraticCurveTo(0.2, -0.3, 0.6, -0.2);
    p.quadraticCurveTo(1.05, -0.1, 1.05, 0.3);
    p.quadraticCurveTo(1.05, 0.62, 0.8, 0.64);
    p.lineTo(-1.0, 0.66);
    p.quadraticCurveTo(-1.2, 0.66, -1.2, 0.6);
    p.closePath();
    fillBody(c, p, e, t, base, 0.08);
    // mantle saddle
    const m = new Path2D();
    m.ellipse(0.25, -0.02, 0.48, 0.22, -0.12, 0, TAU);
    fillBody(c, m, e, t, mix(base, '#c0b070', 0.25), 0.04);
    c.fillStyle = rgba(shade(base, -0.4), 0.5);
    for (const [x, y] of [
      [0.05, -0.05],
      [0.3, -0.12],
      [0.5, 0.02],
      [-0.4, 0.25],
      [-0.7, 0.42],
    ] as const)
      dot(c, x, y, 0.04, c.fillStyle as string);
    // breathing pore
    dot(c, 0.55, 0.12, 0.035, 'rgba(30,30,10,0.6)');
    // wet highlight
    c.strokeStyle = 'rgba(255,255,240,0.65)';
    c.lineWidth = 0.05;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-0.7, 0.25);
    c.quadraticCurveTo(-0.2, -0.05, 0.3, -0.2);
    c.stroke();
    // eye stalks
    c.strokeStyle = shade(base, -0.2);
    c.lineWidth = 0.08;
    const bob = Math.sin(t * 2 + P.ph) * 0.06;
    c.beginPath();
    c.moveTo(0.82, -0.05);
    c.quadraticCurveTo(0.95, -0.4, 1.02 + bob, -0.72);
    c.moveTo(0.7, -0.08);
    c.quadraticCurveTo(0.72, -0.4, 0.68 - bob, -0.66);
    c.stroke();
    c.strokeStyle = shade(base, 0.2);
    c.lineWidth = 0.03;
    c.stroke();
    dot(c, 1.02 + bob, -0.74, 0.08, shade(base, -0.3));
    dot(c, 0.68 - bob, -0.68, 0.07, shade(base, -0.3));
    // lower tentacles
    c.strokeStyle = shade(base, -0.25);
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(1.0, 0.4);
    c.lineTo(1.18, 0.5);
    c.stroke();
  }
  const bob = Math.sin(t * 2 + P.ph) * 0.06;
  eye(c, mode, 1.02 + bob, -0.74, 0.05, e.def.eye, 0, 1);
  eye(c, mode, 0.68 - bob, -0.68, 0.045, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ march hare

function hare(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const q = (t * 3.2 + P.ph) % 1;
  const air = Math.sin(q * Math.PI);
  c.translate(0, -air * 0.45 + 0.05);
  c.rotate(-0.25 + q * 0.4);
  const base = e.def.color;
  if (mode === 'body') {
    const dark = shade(base, -0.3);
    // far ear + far legs
    const ear2 = new Path2D();
    ear2.ellipse(0.3, -1.0, 0.13, 0.48, -0.55 - air * 0.3, 0, TAU);
    fillBody(c, ear2, e, t, dark, 0.07);
    // hind leg: tucked on the ground, stretched out in the air
    const hl = new Path2D();
    hl.ellipse(-0.55 - air * 0.35, 0.45 + air * 0.05, 0.5 + air * 0.15, 0.15, 0.15 + air * 0.35, 0, TAU);
    fillBody(c, hl, e, t, shade(base, -0.12), 0.07);
    // front legs reaching forward in the air
    const fl = new Path2D();
    fl.ellipse(0.55 + air * 0.25, 0.42 - air * 0.05, 0.1, 0.3, -0.5 - air * 0.6, 0, TAU);
    fillBody(c, fl, e, t, shade(base, -0.08), 0.06);
    // body
    const b = new Path2D();
    b.ellipse(-0.1, 0.08, 0.78 + air * 0.08, 0.42, -0.1, 0, TAU);
    fillBody(c, b, e, t, base, 0.08);
    // head
    const h = new Path2D();
    h.ellipse(0.62, -0.32, 0.36, 0.28, 0.25, 0, TAU);
    fillBody(c, h, e, t, base, 0.08);
    // near ear (long, pink inside)
    const ear = new Path2D();
    ear.ellipse(0.42, -0.95, 0.15, 0.52, -0.35 - air * 0.3, 0, TAU);
    fillBody(c, ear, e, t, base, 0.07);
    c.fillStyle = 'rgba(240,160,170,0.8)';
    c.beginPath();
    c.ellipse(0.42, -0.95, 0.06, 0.36, -0.35 - air * 0.3, 0, TAU);
    c.fill();
    // cotton tail
    dot(c, -0.86, -0.05, 0.17, '#fbf6ee');
    c.strokeStyle = 'rgba(40,30,20,0.6)';
    c.lineWidth = 0.04;
    c.beginPath();
    c.arc(-0.86, -0.05, 0.17, 0, TAU);
    c.stroke();
    // pale belly, nose & whiskers
    c.fillStyle = 'rgba(250,240,220,0.5)';
    c.beginPath();
    c.ellipse(0.0, 0.32, 0.45, 0.12, -0.1, 0, TAU);
    c.fill();
    dot(c, 0.96, -0.24, 0.06, '#e88a9a');
    c.strokeStyle = 'rgba(250,250,240,0.7)';
    c.lineWidth = 0.025;
    c.beginPath();
    c.moveTo(0.9, -0.2);
    c.lineTo(1.2, -0.28);
    c.moveTo(0.9, -0.18);
    c.lineTo(1.18, -0.08);
    c.stroke();
  }
  eye(c, mode, 0.72, -0.38, 0.075, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ crow (and the rook matriarch)

function bird(c: C, e: Enemy, t: number, P: Pose, mode: Mode, boss: boolean) {
  c.scale(P.flip, 1);
  const f = Math.sin(t * (boss ? 5 : 9) + P.ph);
  const base = e.def.color;
  const wingCol = mix(base, '#3a3a5a', 0.25);
  const wing = (near: boolean) => {
    const up = f * (near ? 1 : 0.8);
    const span = boss ? 1.25 : 1.05;
    const tipX = -0.35 - (1 - Math.abs(up)) * 0.25,
      tipY = -0.15 - up * span;
    const w = new Path2D();
    w.moveTo(0.25, -0.12);
    w.quadraticCurveTo(0.2, -0.15 - up * span * 0.6, tipX + 0.15, tipY);
    // ragged primaries
    const nf = boss ? 6 : 4;
    for (let k = 0; k < nf; k++) {
      const q = (k + 1) / nf;
      const x = tipX + 0.15 - q * 0.6,
        y = tipY + (-0.15 - tipY) * q * 0.85;
      const rag = boss && k % 2 ? 0.12 : 0.18;
      w.lineTo(x - rag, y + rag * 0.4 * Math.sign(-up || 1));
      w.lineTo(x - 0.05, y + 0.02);
    }
    w.lineTo(-0.3, -0.05);
    w.closePath();
    fillBody(c, w, e, t, near ? wingCol : shade(wingCol, -0.3), boss ? 0.06 : 0.07);
    // covert sheen
    c.strokeStyle = rgba('#7a7aaa', near ? 0.4 : 0.2);
    c.lineWidth = boss ? 0.05 : 0.06;
    c.beginPath();
    c.moveTo(0.15, -0.12);
    c.quadraticCurveTo(0.1, -0.15 - up * span * 0.4, tipX + 0.25, tipY * 0.7);
    c.stroke();
  };
  if (mode === 'body') {
    wing(false);
    // tail fan
    const tail = new Path2D();
    tail.moveTo(-0.45, -0.05);
    tail.lineTo(-1.1, -0.18);
    tail.lineTo(-1.15, 0.05);
    tail.lineTo(-1.05, 0.22);
    tail.lineTo(-0.45, 0.15);
    tail.closePath();
    fillBody(c, tail, e, t, shade(base, -0.1), 0.06);
    // body + head
    const b = new Path2D();
    b.ellipse(0, 0.02, 0.62, 0.32, -0.08, 0, TAU);
    b.moveTo(0.9, -0.2);
    b.arc(0.62, -0.2, 0.28, 0, TAU);
    fillBody(c, b, e, t, base, 0.07);
    if (boss) {
      // shaggy "trousers" & throat hackles
      c.fillStyle = shade(base, 0.08);
      for (let k = 0; k < 6; k++) {
        c.beginPath();
        c.moveTo(0.42 + k * 0.04, -0.05);
        c.lineTo(0.38 + k * 0.05, 0.22 + (k % 2) * 0.06);
        c.lineTo(0.5 + k * 0.04, 0.0);
        c.fill();
      }
      for (let k = 0; k < 5; k++) {
        c.beginPath();
        c.moveTo(-0.3 + k * 0.12, 0.25);
        c.lineTo(-0.25 + k * 0.12, 0.45);
        c.lineTo(-0.2 + k * 0.12, 0.25);
        c.fill();
      }
      // bare pale face of a rook
      c.fillStyle = '#b8b0b8';
      c.beginPath();
      c.ellipse(0.84, -0.14, 0.1, 0.12, 0.3, 0, TAU);
      c.fill();
    }
    // feet tucked
    c.strokeStyle = '#2a2a2a';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(0.05, 0.3);
    c.lineTo(-0.05, 0.45);
    c.moveTo(0.15, 0.3);
    c.lineTo(0.08, 0.46);
    c.stroke();
    // beak
    c.fillStyle = boss ? '#8a8a90' : '#2a2a30';
    c.strokeStyle = 'rgba(0,0,0,0.85)';
    c.lineWidth = 0.035;
    c.beginPath();
    c.moveTo(0.82, -0.3);
    c.quadraticCurveTo(1.05, -0.28, 1.22, -0.15);
    c.lineTo(0.84, -0.1);
    c.closePath();
    c.fill();
    c.stroke();
    // feather sheen
    c.strokeStyle = 'rgba(140,150,220,0.35)';
    c.lineWidth = 0.05;
    c.beginPath();
    c.arc(0.05, 0.0, 0.42, -2.4, -1.2);
    c.stroke();
    if (boss) {
      // a string of stolen trinkets around the neck
      c.strokeStyle = '#c8b070';
      c.lineWidth = 0.02;
      c.beginPath();
      c.moveTo(0.42, -0.35);
      c.quadraticCurveTo(0.5, 0.05, 0.8, 0.0);
      c.stroke();
      const tk: [number, number, string][] = [
        [0.46, -0.18, '#e8c048'],
        [0.52, -0.02, '#c8d8e8'],
        [0.65, 0.04, '#ff6a8a'],
        [0.78, 0.0, '#7ad0ff'],
      ];
      for (const [x, y, col] of tk) {
        dot(c, x, y + 0.04, 0.05, col);
        c.strokeStyle = 'rgba(30,20,10,0.8)';
        c.lineWidth = 0.015;
        c.beginPath();
        c.arc(x, y + 0.04, 0.05, 0, TAU);
        c.stroke();
      }
    }
    wing(true);
  } else if (boss) {
    for (let i = 0; i < 4; i++) {
      const x = [0.46, 0.52, 0.65, 0.78][i],
        y = [-0.18, -0.02, 0.04, 0.0][i];
      const k = Math.max(0, Math.sin(t * 2.5 + i * 1.7 + P.ph));
      glint(c, x + 0.02, y + 0.02, 0.12, k * k * 0.9);
    }
  }
  eye(c, mode, 0.7, -0.26, boss ? 0.05 : 0.06, e.def.eye, 0, 1);
}

const crow: EnemyDraw = (c, e, t, P, mode) => bird(c, e, t, P, mode, false);
const rookmother: EnemyDraw = (c, e, t, P, mode) => bird(c, e, t, P, mode, true);

// ------------------------------------------------------------------ badger

function badger(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const trot = Math.sin(t * 7 + P.ph);
  const dig = e.attacking >= 0 ? Math.max(0, Math.sin(t * 9 + P.ph)) : 0;
  c.translate(0, -Math.abs(trot) * 0.03);
  const base = e.def.color;
  if (mode === 'body') {
    // legs
    const legs = new Path2D();
    for (const [x, ph] of [
      [-0.62, 0],
      [-0.35, Math.PI],
      [0.35, Math.PI],
      [0.6, 0],
    ] as const) {
      const sw = Math.sin(t * 7 + P.ph + ph) * 0.1;
      legs.roundRect(x + sw - 0.1, 0.3, 0.2, 0.42, 0.06);
    }
    fillBody(c, legs, e, t, '#1e1e22', 0.06);
    // claws
    c.fillStyle = '#e8e0d0';
    for (const x of [0.35, 0.6]) {
      const sw = Math.sin(t * 7 + P.ph + (x > 0.5 ? 0 : Math.PI)) * 0.1;
      c.beginPath();
      c.moveTo(x + sw + 0.06, 0.7);
      c.lineTo(x + sw + 0.18, 0.74);
      c.lineTo(x + sw + 0.06, 0.66);
      c.fill();
    }
    // stocky body
    const b = new Path2D();
    b.ellipse(-0.12, 0.05, 0.9, 0.5, -0.04, 0, TAU);
    fillBody(c, b, e, t, base, 0.08);
    // grizzled fur ticks
    c.strokeStyle = 'rgba(220,220,215,0.4)';
    c.lineWidth = 0.025;
    c.beginPath();
    for (let i = 0; i < 9; i++) {
      const x = -0.85 + i * 0.17;
      c.moveTo(x, -0.28 + Math.abs(x) * 0.12);
      c.lineTo(x - 0.06, -0.12 + Math.abs(x) * 0.12);
    }
    c.stroke();
    // dark belly
    c.fillStyle = 'rgba(15,15,18,0.55)';
    c.beginPath();
    c.ellipse(-0.1, 0.42, 0.7, 0.13, 0, 0, TAU);
    c.fill();
    // head: white wedge with black stripes
    c.save();
    c.translate(0.68, -0.05 + dig * 0.25);
    c.rotate(0.15 + dig * 0.35);
    const h = new Path2D();
    h.moveTo(-0.15, -0.32);
    h.quadraticCurveTo(0.25, -0.34, 0.55, 0.0);
    h.quadraticCurveTo(0.6, 0.1, 0.5, 0.14);
    h.quadraticCurveTo(0.15, 0.26, -0.18, 0.22);
    h.closePath();
    fillBody(c, h, e, t, '#f2efe6', 0.07);
    c.fillStyle = '#18181c';
    c.beginPath();
    c.moveTo(-0.12, -0.18);
    c.quadraticCurveTo(0.2, -0.16, 0.45, 0.02);
    c.lineTo(0.38, 0.08);
    c.quadraticCurveTo(0.15, -0.04, -0.14, 0.02);
    c.closePath();
    c.fill();
    dot(c, 0.56, 0.06, 0.07, '#18181c');
    // ear
    dot(c, -0.08, -0.3, 0.08, '#2a2a2e');
    dot(c, -0.08, -0.3, 0.04, '#f2efe6');
    c.restore();
  }
  c.save();
  c.translate(0.68, -0.05 + dig * 0.25);
  c.rotate(0.15 + dig * 0.35);
  eye(c, mode, 0.22, -0.06, 0.05, e.def.eye, 0, 1);
  c.restore();
}

// ------------------------------------------------------------------ mole (and the mole king)

function moleBody(c: C, e: Enemy, t: number, P: Pose, mode: Mode, king: boolean) {
  c.scale(P.flip, 1);
  const paddle = Math.sin(t * (king ? 4 : 7) + P.ph);
  const base = e.def.color;
  const pink = '#f0a0b8';
  const claw = (x: number, y: number, s: number, ph: number, front: boolean) => {
    const a = 0.6 + Math.sin(t * (king ? 4 : 7) + P.ph + ph) * 0.45;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    const p = new Path2D();
    p.ellipse(0.0, 0.15 * s, 0.16 * s, 0.24 * s, 0, 0, TAU);
    fillBody(c, p, e, t, front ? pink : shade(pink, -0.2), 0.05);
    // fingers / nails
    c.fillStyle = king ? '#ffe070' : '#fff4e0';
    c.strokeStyle = 'rgba(60,30,20,0.85)';
    c.lineWidth = 0.025;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(k * 0.06 * s - 0.03 * s, 0.34 * s);
      c.lineTo(k * 0.07 * s, 0.52 * s);
      c.lineTo(k * 0.06 * s + 0.03 * s, 0.34 * s);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();
  };
  const cs = king ? 1.5 : 1.15;
  if (mode === 'body') {
    claw(0.3, 0.3, cs, Math.PI, false);
    // velvet body
    const b = new Path2D();
    b.ellipse(-0.1, 0.1 + paddle * 0.02, 0.88, 0.62, 0, 0, TAU);
    fillBody(c, b, e, t, base, king ? 0.07 : 0.08);
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 0.08;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(-0.1, 0.1, 0.62, -2.6, -1.4);
    c.stroke();
    // tiny tail
    c.strokeStyle = pink;
    c.lineWidth = 0.06;
    c.beginPath();
    c.moveTo(-0.95, 0.2);
    c.lineTo(-1.15, 0.12);
    c.stroke();
    // snout
    const sn = new Path2D();
    sn.moveTo(0.6, -0.1);
    sn.quadraticCurveTo(1.1, -0.02, 1.18, 0.12);
    sn.quadraticCurveTo(1.1, 0.25, 0.65, 0.3);
    sn.closePath();
    fillBody(c, sn, e, t, mix(base, pink, 0.35), 0.06);
    dot(c, 1.16, 0.12, 0.08, pink);
    c.strokeStyle = 'rgba(250,240,240,0.6)';
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(1.05, 0.1);
    c.lineTo(1.3, 0.0);
    c.moveTo(1.05, 0.14);
    c.lineTo(1.3, 0.22);
    c.stroke();
    claw(0.6, 0.38, cs, 0, true);
    if (king) {
      // a little red velvet cape over the shoulders
      const cape = new Path2D();
      cape.moveTo(0.45, -0.45);
      cape.quadraticCurveTo(-0.2, -0.75, -0.75, -0.2);
      cape.quadraticCurveTo(-0.6, 0.15, -0.35, 0.05);
      cape.quadraticCurveTo(0.0, -0.2, 0.45, -0.3);
      cape.closePath();
      fillBody(c, cape, e, t, '#a02838', 0.05);
      c.strokeStyle = '#ffe070';
      c.lineWidth = 0.04;
      c.beginPath();
      c.moveTo(-0.72, -0.18);
      c.quadraticCurveTo(-0.6, 0.12, -0.35, 0.03);
      c.stroke();
      // crown
      c.save();
      c.translate(0.32, -0.6);
      c.rotate(-0.15);
      const cr = new Path2D();
      cr.moveTo(-0.3, 0.1);
      cr.lineTo(-0.32, -0.2);
      cr.lineTo(-0.16, -0.06);
      cr.lineTo(0, -0.28);
      cr.lineTo(0.16, -0.06);
      cr.lineTo(0.32, -0.2);
      cr.lineTo(0.3, 0.1);
      cr.closePath();
      c.fillStyle = '#e8b830';
      c.fill(cr);
      c.strokeStyle = 'rgba(80,50,0,0.9)';
      c.lineWidth = 0.04;
      c.stroke(cr);
      c.fillStyle = 'rgba(255,240,160,0.8)';
      c.fillRect(-0.28, 0.0, 0.56, 0.04);
      dot(c, 0, -0.02, 0.05, '#ff6ab0');
      dot(c, -0.18, 0.03, 0.035, '#7ad0ff');
      dot(c, 0.18, 0.03, 0.035, '#7ad0ff');
      c.restore();
    }
  } else if (king) {
    c.save();
    c.translate(0.32, -0.6);
    c.rotate(-0.15);
    glint(c, 0.02, -0.04, 0.16, 0.5 + 0.4 * Math.sin(t * 3 + P.ph));
    c.restore();
  }
  eye(c, mode, 0.62, -0.08, king ? 0.045 : 0.05, e.def.eye, 0, 1);
}

const mole: EnemyDraw = (c, e, t, P, mode) => moleBody(c, e, t, P, mode, false);
const moleking: EnemyDraw = (c, e, t, P, mode) => moleBody(c, e, t, P, mode, true);

// ------------------------------------------------------------------ armoured snail

function snailShell(c: C, e: Enemy, t: number, x: number, y: number, R: number) {
  const shell = '#b07a3a';
  const p = new Path2D();
  p.arc(x, y, R, 0, TAU);
  fillBody(c, p, e, t, shell, 0.08);
  // spiral ridge
  c.strokeStyle = 'rgba(60,30,10,0.75)';
  c.lineWidth = 0.06;
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * TAU * 2.2;
    const r = R * (0.88 - (i / 40) * 0.8);
    const px = x + Math.cos(a + 0.6) * r,
      py = y + Math.sin(a + 0.6) * r;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
  // cream band following the spiral
  c.strokeStyle = 'rgba(250,230,180,0.6)';
  c.lineWidth = 0.05;
  c.beginPath();
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * TAU * 1.8;
    const r = R * (0.72 - (i / 30) * 0.55);
    const px = x + Math.cos(a + 0.9) * r,
      py = y + Math.sin(a + 0.9) * r;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
  // armour studs around the rim
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * 0.95 + (k / 6) * Math.PI * 1.1;
    const sx = x + Math.cos(a) * R * 0.86,
      sy = y + Math.sin(a) * R * 0.86;
    dot(c, sx, sy, 0.07, '#d8c070');
    c.strokeStyle = 'rgba(70,45,10,0.85)';
    c.lineWidth = 0.02;
    c.beginPath();
    c.arc(sx, sy, 0.07, 0, TAU);
    c.stroke();
    dot(c, sx - 0.02, sy - 0.02, 0.025, 'rgba(255,250,220,0.9)');
  }
  // highlight
  c.fillStyle = 'rgba(255,240,200,0.35)';
  c.beginPath();
  c.ellipse(x - R * 0.35, y - R * 0.45, R * 0.3, R * 0.15, -0.6, 0, TAU);
  c.fill();
}

function snail(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const hidden = (e.shellT ?? 0) > 0;
  const base = e.def.color;
  if (hidden) {
    if (mode === 'body') {
      // shell resting on the ground, mouth sealed
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.beginPath();
      c.ellipse(0, 0.62, 0.8, 0.14, 0, 0, TAU);
      c.fill();
      snailShell(c, e, t, 0, 0.0, 0.72);
      c.fillStyle = '#5a3a1a';
      c.beginPath();
      c.ellipse(0.55, 0.38, 0.18, 0.12, -0.4, 0, TAU);
      c.fill();
    } else {
      const k = 0.5 + 0.5 * Math.sin(t * 4 + P.ph);
      glint(c, -0.3, -0.35, 0.25, 0.6 * k);
    }
    return;
  }
  const w = Math.sin(t * 2.5 + P.ph);
  if (mode === 'body') {
    // foot
    const f = new Path2D();
    f.moveTo(-1.1, 0.62);
    f.quadraticCurveTo(-0.9, 0.35, -0.3, 0.32);
    f.lineTo(0.6, 0.25);
    f.quadraticCurveTo(0.85, -0.05 + w * 0.03, 1.0, -0.15 + w * 0.03);
    f.quadraticCurveTo(1.18, 0.0, 1.1, 0.35);
    f.quadraticCurveTo(1.05, 0.66, 0.8, 0.66);
    f.lineTo(-1.0, 0.68);
    f.closePath();
    fillBody(c, f, e, t, base, 0.07);
    // eye stalks
    c.strokeStyle = shade(base, -0.1);
    c.lineWidth = 0.07;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(1.0, -0.1);
    c.quadraticCurveTo(1.12, -0.4, 1.12 + w * 0.04, -0.65);
    c.moveTo(0.9, -0.08);
    c.quadraticCurveTo(0.88, -0.35, 0.82 - w * 0.04, -0.58);
    c.stroke();
    dot(c, 1.12 + w * 0.04, -0.67, 0.07, shade(base, -0.3));
    dot(c, 0.82 - w * 0.04, -0.6, 0.06, shade(base, -0.3));
    snailShell(c, e, t, -0.18, -0.12, 0.66);
  }
  eye(c, mode, 1.12 + w * 0.04, -0.67, 0.045, e.def.eye, 0, 1);
  eye(c, mode, 0.82 - w * 0.04, -0.6, 0.04, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ locust

function locust(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const base = e.def.color;
  const buzz = Math.sin(t * 55 + P.ph);
  if (mode === 'body') {
    // blurred wings
    c.fillStyle = 'rgba(230,240,210,0.45)';
    c.beginPath();
    c.ellipse(-0.25, -0.4 - buzz * 0.18, 0.75, 0.22 + Math.abs(buzz) * 0.12, -0.25, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(200,190,140,0.5)';
    c.beginPath();
    c.ellipse(-0.3, -0.25 + buzz * 0.12, 0.7, 0.16, -0.1, 0, TAU);
    c.fill();
    // big hind leg (zig-zag)
    c.strokeStyle = shade(base, -0.3);
    c.lineWidth = 0.14;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-0.1, 0.1);
    c.lineTo(-0.45, -0.3);
    c.lineTo(-0.75, 0.45);
    c.stroke();
    c.strokeStyle = mix(base, '#c8a040', 0.4);
    c.lineWidth = 0.07;
    c.stroke();
    // body segments
    const b = new Path2D();
    b.ellipse(-0.25, 0.08, 0.75, 0.24, -0.05, 0, TAU);
    b.moveTo(0.85, 0.0);
    b.ellipse(0.62, -0.02, 0.26, 0.26, 0, 0, TAU);
    fillBody(c, b, e, t, base, 0.09);
    c.strokeStyle = rgba(shade(base, -0.5), 0.6);
    c.lineWidth = 0.05;
    c.beginPath();
    for (const x of [-0.65, -0.45, -0.25]) {
      c.moveTo(x, -0.1);
      c.lineTo(x, 0.26);
    }
    c.stroke();
    // front legs
    c.strokeStyle = shade(base, -0.35);
    c.lineWidth = 0.06;
    c.beginPath();
    c.moveTo(0.4, 0.2);
    c.lineTo(0.55, 0.5);
    c.moveTo(0.2, 0.2);
    c.lineTo(0.15, 0.5);
    c.stroke();
    // antennae
    c.lineWidth = 0.04;
    c.beginPath();
    c.moveTo(0.75, -0.2);
    c.quadraticCurveTo(1.0, -0.6, 1.25, -0.55);
    c.stroke();
  }
  eye(c, mode, 0.7, -0.06, 0.09, e.def.eye, 0, 1);
}

export const SPRING_ENEMIES: Partial<Record<EnemyId, EnemyDraw>> = {
  slug,
  hare,
  crow,
  badger,
  mole,
  snail,
  locust,
  moleking,
  rookmother,
} as Partial<Record<EnemyId, EnemyDraw>>;
