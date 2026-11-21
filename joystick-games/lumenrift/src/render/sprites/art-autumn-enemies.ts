// Autumn enemies: the hollow host. Local units: 1 = the enemy's radius; ctx is centred on the body.
// 'body' draws under the night lighting, 'glow' (additive) only the glowing bits.
import type { EnemyId } from '../../game/config';
import type { Ally, Enemy } from '../../game/game';
import { BONE, C, TAU, circle, ell, line, pumpkin } from './art-autumn-common';
import { eye, fillBody, type Mode, type Pose } from './enemies';
import { glow, mix, rgba, shade } from './util';

type Fill = (p: Path2D, base: string, lw?: number) => void;

/** A bone: dark outline under a pale stroke, with knobbly ends. */
function bone(c: C, x0: number, y0: number, x1: number, y1: number, w: number, col = BONE) {
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(14,8,18,0.9)';
  c.lineWidth = w + 0.09;
  line(c, x0, y0, x1, y1);
  c.strokeStyle = col;
  c.lineWidth = w;
  line(c, x0, y0, x1, y1);
}

// ------------------------------------------------------------------ skeleton

function skull(c: C, e: Enemy, t: number, x: number, y: number, s: number, jaw: number) {
  const p = new Path2D();
  p.ellipse(x, y, 0.34 * s, 0.3 * s, 0, 0, TAU);
  p.moveTo(x + 0.26 * s, y + 0.1 * s);
  p.rect(x - 0.12 * s, y + 0.12 * s + jaw, 0.36 * s, 0.13 * s);
  fillBody(c, p, e, t, e.def.color, 0.07);
  // sockets
  c.fillStyle = '#1a0c10';
  ell(c, x + 0.02 * s, y - 0.01 * s, 0.085 * s, 0.1 * s);
  c.fill();
  ell(c, x + 0.22 * s, y - 0.01 * s, 0.07 * s, 0.09 * s);
  c.fill();
  // nose & teeth
  c.beginPath();
  c.moveTo(x + 0.13 * s, y + 0.06 * s);
  c.lineTo(x + 0.1 * s, y + 0.12 * s);
  c.lineTo(x + 0.16 * s, y + 0.12 * s);
  c.fill();
  c.strokeStyle = 'rgba(30,16,20,0.7)';
  c.lineWidth = 0.025;
  for (let i = 0; i < 4; i++) line(c, x - 0.06 * s + i * 0.08 * s, y + 0.13 * s + jaw, x - 0.06 * s + i * 0.08 * s, y + 0.22 * s + jaw);
}

function skeletonPile(c: C, e: Enemy, t: number, P: Pose, mode: Mode, p: number) {
  const sh = (0.02 + p * 0.07) * Math.sin(t * 40 + P.ph);
  const lift = Math.max(0, p - 0.6) / 0.4;
  if (mode === 'body') {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    ell(c, 0, 0.75, 0.85, 0.25);
    c.fill();
    const bones: [number, number, number, number][] = [
      [-0.7, 0.75, 0.2, 0.55],
      [-0.3, 0.5, 0.65, 0.8],
      [-0.55, 0.62, 0.45, 0.6],
      [0.1, 0.8, 0.75, 0.62],
    ];
    bones.forEach(([x0, y0, x1, y1], i) => {
      const k = Math.sin(t * 37 + i * 2.1) * sh;
      bone(c, x0 + k, y0 - lift * 0.2 * (i % 2), x1 - k, y1 - lift * 0.25, 0.1);
    });
    // ribcage half
    c.strokeStyle = BONE;
    c.lineWidth = 0.06;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(0.05 + sh, 0.55 - lift * 0.3, 0.2 + i * 0.08, Math.PI * 1.05, Math.PI * 1.8);
      c.stroke();
    }
    skull(c, e, t, -0.1 - sh, 0.42 - lift * 0.45, 0.85, 0.03);
  }
  // eyes kindle as it reassembles
  const ea = 0.15 + 0.85 * p;
  c.globalAlpha *= ea;
  eye(c, mode, -0.08 - sh, 0.41 - lift * 0.45, 0.05, e.def.eye, 0, 1);
  eye(c, mode, 0.09 - sh, 0.41 - lift * 0.45, 0.045, e.def.eye, 0, 1);
}

function skeleton(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  if (e.reviveT && e.reviveT > 0) {
    const p = Math.max(0, Math.min(1, 1 - e.reviveT / (e.def.boss ? 3 : 2.2)));
    return skeletonPile(c, e, t, P, mode, p);
  }
  c.scale(P.flip, 1);
  const w = t * 9 + P.ph;
  const bob = Math.abs(Math.sin(w)) * 0.06;
  if (mode === 'body') {
    const col = e.def.color;
    // back leg & arm
    const leg = (ph: number, shadeK: number) => {
      const sw = Math.sin(w + ph);
      const hx = -0.02,
        hy = 0.25 - bob;
      const kx = hx + sw * 0.18 + 0.05,
        ky = 0.55 - bob * 0.5;
      const fx = hx + sw * 0.35,
        fy = 0.88 - Math.max(0, -Math.cos(w + ph)) * 0.08;
      bone(c, hx, hy, kx, ky, 0.09, shade(col, shadeK));
      bone(c, kx, ky, fx, fy, 0.085, shade(col, shadeK));
      bone(c, fx, fy, fx + 0.13, fy + 0.01, 0.07, shade(col, shadeK));
    };
    const arm = (ph: number, shadeK: number) => {
      const sw = Math.sin(w + ph);
      const sx = 0.0,
        sy = -0.28 - bob;
      const ex = sx + sw * 0.18,
        ey = 0.0 - bob;
      bone(c, sx, sy, ex, ey, 0.07, shade(col, shadeK));
      bone(c, ex, ey, ex + 0.12 + sw * 0.1, ey + 0.2, 0.065, shade(col, shadeK));
    };
    leg(Math.PI, -0.3);
    arm(0, -0.3);
    // spine + pelvis
    bone(c, 0, 0.25 - bob, 0.02, -0.35 - bob, 0.07, col);
    const pel = new Path2D();
    pel.ellipse(0, 0.25 - bob, 0.16, 0.08, 0, 0, TAU);
    fillBody(c, pel, e, t, col, 0.05);
    // ribcage
    const rib = new Path2D();
    rib.ellipse(0.04, -0.17 - bob, 0.24, 0.2, 0, 0, TAU);
    c.globalAlpha *= 0.999;
    c.strokeStyle = 'rgba(14,8,18,0.9)';
    c.lineWidth = 0.1;
    c.stroke(rib);
    c.fillStyle = 'rgba(14,8,18,0.55)';
    c.fill(rib);
    c.strokeStyle = col;
    c.lineWidth = 0.055;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.ellipse(0.04, -0.17 - bob + (i - 1) * 0.11, 0.22 - Math.abs(i - 1) * 0.04, 0.05, 0, 0, TAU);
      c.stroke();
    }
    leg(0, 0);
    // head
    const jaw = Math.max(0, Math.sin(t * 6 + P.ph)) * 0.05;
    skull(c, e, t, 0.08, -0.62 - bob, 1, jaw);
    arm(Math.PI, 0.05);
  }
  eye(c, mode, 0.1, -0.63 - bob, 0.055, e.def.eye, 0, 1);
  eye(c, mode, 0.3, -0.63 - bob, 0.045, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ gremlin

function gremlin(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const w = t * 18 + P.ph;
  const hop = Math.abs(Math.sin(w)) * 0.12;
  const col = e.def.color;
  if (mode === 'body') {
    // legs scampering
    c.lineCap = 'round';
    for (const [ph, k] of [
      [Math.PI, -0.3],
      [0, 0],
    ] as const) {
      const sw = Math.sin(w + ph);
      c.strokeStyle = 'rgba(10,6,14,0.9)';
      c.lineWidth = 0.22;
      line(c, -0.05, 0.35 - hop, -0.05 + sw * 0.35, 0.82 - Math.max(0, Math.cos(w + ph)) * 0.12);
      c.strokeStyle = shade(col, k - 0.1);
      c.lineWidth = 0.14;
      line(c, -0.05, 0.35 - hop, -0.05 + sw * 0.35, 0.82 - Math.max(0, Math.cos(w + ph)) * 0.12);
    }
    // tail
    c.strokeStyle = shade(col, -0.3);
    c.lineWidth = 0.08;
    c.beginPath();
    c.moveTo(-0.45, 0.25 - hop);
    c.quadraticCurveTo(-0.9, 0.2 + Math.sin(w) * 0.1, -0.85, -0.15);
    c.stroke();
    // ears (big!)
    const earFlop = Math.sin(w * 0.5) * 0.08;
    const ear = (s: number) => {
      const p = new Path2D();
      p.moveTo(0.05 + s * 0.05, -0.55 - hop);
      p.quadraticCurveTo(-0.35 + s * 0.2, -1.1 - hop + earFlop, -0.85 + s * 0.15, -0.95 - hop + earFlop * s);
      p.quadraticCurveTo(-0.4 + s * 0.15, -0.6 - hop, -0.05 + s * 0.08, -0.35 - hop);
      p.closePath();
      fillBody(c, p, e, t, shade(col, s > 0 ? 0 : -0.25), 0.08);
      c.fillStyle = rgba('#d08080', 0.6);
      c.beginPath();
      c.moveTo(-0.05 + s * 0.06, -0.52 - hop);
      c.quadraticCurveTo(-0.3 + s * 0.2, -0.92 - hop + earFlop, -0.65 + s * 0.15, -0.88 - hop + earFlop * s);
      c.quadraticCurveTo(-0.35 + s * 0.15, -0.62 - hop, -0.05 + s * 0.08, -0.45 - hop);
      c.fill();
    };
    ear(-1);
    // body
    const p = new Path2D();
    p.ellipse(-0.05, 0.12 - hop, 0.48, 0.4, -0.2, 0, TAU);
    p.moveTo(0.75, -0.45 - hop);
    p.ellipse(0.25, -0.45 - hop, 0.5, 0.4, 0, 0, TAU);
    fillBody(c, p, e, t, col, 0.09);
    // belly
    c.fillStyle = rgba(mix(col, '#d8e0a0', 0.4), 0.6);
    ell(c, 0.05, 0.2 - hop, 0.25, 0.2);
    c.fill();
    ear(1);
    // grin with pointy teeth
    c.fillStyle = '#1a0a0a';
    c.beginPath();
    c.moveTo(0.18, -0.28 - hop);
    c.quadraticCurveTo(0.45, -0.12 - hop, 0.72, -0.35 - hop);
    c.quadraticCurveTo(0.45, -0.24 - hop, 0.18, -0.28 - hop);
    c.fill();
    c.fillStyle = '#f0ecd8';
    for (const x of [0.3, 0.42, 0.55, 0.65]) {
      c.beginPath();
      c.moveTo(x - 0.03, -0.26 - hop + (x - 0.45) * (x - 0.45) * 0.4);
      c.lineTo(x, -0.2 - hop);
      c.lineTo(x + 0.03, -0.27 - hop + (x - 0.45) * (x - 0.45) * 0.4);
      c.fill();
    }
    // claws (arm reaching forward)
    c.strokeStyle = shade(col, -0.15);
    c.lineWidth = 0.11;
    line(c, 0.2, 0.05 - hop, 0.6, 0.15 - hop + Math.sin(w) * 0.08);
  }
  eye(c, mode, 0.26, -0.56 - hop, 0.1, e.def.eye, 0, 1);
  eye(c, mode, 0.56, -0.56 - hop, 0.085, e.def.eye, 0, 1);
  if (mode === 'body') {
    c.fillStyle = '#100808';
    circle(c, 0.29, -0.55 - hop, 0.04);
    c.fill();
    circle(c, 0.59, -0.55 - hop, 0.035);
    c.fill();
  }
}

// ------------------------------------------------------------------ vampire bat

function bat(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const f = Math.sin(t * 16 + P.ph);
  const col = e.def.color;
  if (mode === 'body') {
    const wing = (s: number) => {
      const tipY = -0.75 * f - 0.1;
      const p = new Path2D();
      p.moveTo(s * 0.15, -0.15);
      p.quadraticCurveTo(s * 0.6, -0.6 * f - 0.4, s * 1.25, tipY);
      // scalloped trailing edge
      const pts = 3;
      for (let i = 1; i <= pts; i++) {
        const k = i / pts;
        const x = s * (1.25 - k * 1.1),
          y = tipY * (1 - k) + 0.15 * k + 0.1;
        p.quadraticCurveTo(s * (1.25 - (k - 0.5 / pts) * 1.1), y - 0.18 + Math.abs(f) * 0.05, x, y);
      }
      p.closePath();
      fillBody(c, p, e, t, shade(col, s > 0 ? 0.05 : -0.15), 0.07);
      // finger bones
      c.strokeStyle = rgba(shade(col, -0.5), 0.8);
      c.lineWidth = 0.035;
      for (let i = 1; i <= 2; i++) {
        const k = i / 3;
        line(c, s * 0.3, -0.25 - 0.2 * f, s * (1.25 - k * 1.1), tipY * (1 - k) + 0.25 * k);
      }
    };
    wing(-1);
    const b = new Path2D();
    b.ellipse(0, 0, 0.3, 0.38, 0, 0, TAU);
    // ears
    b.moveTo(-0.2, -0.3);
    b.lineTo(-0.22, -0.68);
    b.lineTo(-0.02, -0.38);
    b.moveTo(0.05, -0.36);
    b.lineTo(0.22, -0.7);
    b.lineTo(0.26, -0.28);
    fillBody(c, b, e, t, col, 0.08);
    wing(1);
    // fangs
    c.fillStyle = '#f4f0e8';
    for (const x of [0.04, 0.16]) {
      c.beginPath();
      c.moveTo(x - 0.03, 0.08);
      c.lineTo(x, 0.2);
      c.lineTo(x + 0.03, 0.08);
      c.fill();
    }
    // feet
    c.strokeStyle = shade(col, -0.4);
    c.lineWidth = 0.05;
    line(c, -0.08, 0.35, -0.12, 0.5);
    line(c, 0.08, 0.35, 0.1, 0.5);
  }
  eye(c, mode, 0.0, -0.08, 0.07, e.def.eye, 0, 1);
  eye(c, mode, 0.18, -0.08, 0.065, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ zombie (enemy + allied)

interface ZombieLook {
  skin: string;
  shirt: string;
  pants: string;
  eyeCol: string;
}

function zombieFigure(c: C, t: number, ph: number, mode: Mode, fill: Fill, look: ZombieLook, swipe: number, eyeFn: (x: number, y: number, r: number) => void) {
  const w = t * 3.2 + ph;
  const lurch = Math.sin(w) * 0.05;
  const bob = Math.abs(Math.sin(w)) * 0.05;
  if (mode === 'body') {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // legs: a dragging shuffle
    const leg = (p: number, k: number) => {
      const sw = Math.sin(w + p);
      const x0 = -0.12,
        y0 = 0.3 - bob;
      const fx = x0 + sw * 0.25,
        fy = 0.88;
      c.strokeStyle = 'rgba(10,6,14,0.9)';
      c.lineWidth = 0.32;
      line(c, x0, y0, fx, fy);
      c.strokeStyle = shade(look.pants, k);
      c.lineWidth = 0.23;
      line(c, x0, y0, fx, fy);
      // ragged cuff + foot
      c.fillStyle = shade(look.skin, k - 0.1);
      ell(c, fx + 0.08, fy + 0.02, 0.15, 0.07);
      c.fill();
    };
    leg(Math.PI, -0.35);
    // back arm (reaching forward)
    const armUp = swipe;
    const arm = (k: number, off: number) => {
      const a = -0.15 - armUp * (0.9 + Math.sin(t * 14 + off) * 0.4) + Math.sin(w + off) * 0.08;
      const sx = 0.15,
        sy = -0.38 - bob;
      const ex = sx + Math.cos(a) * 0.55,
        ey = sy + Math.sin(a) * 0.55;
      c.strokeStyle = 'rgba(10,6,14,0.9)';
      c.lineWidth = 0.26;
      line(c, sx, sy, ex, ey);
      c.strokeStyle = shade(look.shirt, k);
      c.lineWidth = 0.19;
      line(c, sx, sy, sx + Math.cos(a) * 0.28, sy + Math.sin(a) * 0.28);
      c.strokeStyle = shade(look.skin, k);
      c.lineWidth = 0.15;
      line(c, sx + Math.cos(a) * 0.28, sy + Math.sin(a) * 0.28, ex, ey);
      // hand
      c.fillStyle = shade(look.skin, k);
      circle(c, ex, ey, 0.1);
      c.fill();
    };
    arm(-0.35, 1.3);
    // hulking hunched torso
    const body = new Path2D();
    body.moveTo(-0.34, 0.35 - bob);
    body.quadraticCurveTo(-0.42, -0.1 - bob, -0.46, -0.48 - bob + lurch);
    body.quadraticCurveTo(-0.3, -0.72 - bob + lurch, 0.1, -0.7 - bob + lurch);
    body.quadraticCurveTo(0.42, -0.68 - bob + lurch, 0.4, -0.4 - bob + lurch);
    body.quadraticCurveTo(0.38, 0.0 - bob, 0.3, 0.35 - bob);
    body.closePath();
    fill(body, look.shirt);
    // torn hem & patches
    c.fillStyle = shade(look.shirt, -0.35);
    c.beginPath();
    c.moveTo(-0.4, 0.33 - bob);
    for (let i = 0; i <= 5; i++) c.lineTo(-0.4 + i * 0.14, 0.33 - bob + (i % 2 ? 0.1 : 0));
    c.lineTo(0.3, 0.33 - bob);
    c.fill();
    c.fillStyle = mix(look.shirt, '#c8a060', 0.4);
    c.fillRect(-0.25, -0.2 - bob, 0.16, 0.14);
    c.strokeStyle = 'rgba(20,10,10,0.7)';
    c.lineWidth = 0.02;
    c.strokeRect(-0.25, -0.2 - bob, 0.16, 0.14);
    // a tear showing skin
    c.fillStyle = look.skin;
    c.beginPath();
    c.moveTo(0.1, -0.05 - bob);
    c.lineTo(0.25, -0.15 - bob);
    c.lineTo(0.22, 0.08 - bob);
    c.closePath();
    c.fill();
    // head jutting forward, low
    const hx = 0.42,
      hy = -0.62 - bob + lurch * 1.5;
    const head = new Path2D();
    head.ellipse(hx, hy, 0.25, 0.23, 0.2, 0, TAU);
    fill(head, look.skin, 0.07);
    // messy hair tufts
    c.strokeStyle = '#2a2a1a';
    c.lineWidth = 0.05;
    for (let i = 0; i < 4; i++) line(c, hx - 0.15 + i * 0.08, hy - 0.2, hx - 0.18 + i * 0.09, hy - 0.32 - (i % 2) * 0.05);
    // stitches across the brow
    c.strokeStyle = 'rgba(30,20,20,0.8)';
    c.lineWidth = 0.02;
    line(c, hx - 0.12, hy - 0.1, hx + 0.1, hy - 0.14);
    for (let i = 0; i < 4; i++) line(c, hx - 0.1 + i * 0.06, hy - 0.15, hx - 0.09 + i * 0.06, hy - 0.08);
    // slack jaw
    c.fillStyle = '#1a1010';
    ell(c, hx + 0.12, hy + 0.12, 0.08, 0.04 + Math.abs(Math.sin(w * 0.7)) * 0.03);
    c.fill();
    leg(0, -0.05);
    arm(0, 0);
  }
  const hx = 0.42,
    hy = -0.62 - bob + lurch * 1.5;
  eyeFn(hx + 0.02, hy - 0.02, 0.055);
  eyeFn(hx + 0.17, hy - 0.03, 0.045);
}

function zombie(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const col = e.def.color;
  const fill: Fill = (p, base, lw = 0.09) => fillBody(c, p, e, t, base, lw);
  zombieFigure(
    c,
    t,
    P.ph,
    mode,
    fill,
    { skin: col, shirt: '#5a3a5a', pants: '#3a3448', eyeCol: e.def.eye },
    e.attacking >= 0 ? 0.5 + 0.5 * Math.sin(t * 8) : 0,
    (x, y, r) => eye(c, mode, x, y, r, e.def.eye, 0, 1),
  );
}

// ------------------------------------------------------------------ ghost (translucent sheet)

function ghostPath(t: number, ph: number, wob: number) {
  const p = new Path2D();
  p.moveTo(-0.72, 0.2);
  p.bezierCurveTo(-0.8, -0.6, -0.4, -0.98, 0, -0.98);
  p.bezierCurveTo(0.4, -0.98, 0.8, -0.6, 0.72, 0.2);
  const n = 5;
  const tail = Math.sin(t * 2 + ph) * 0.12;
  p.lineTo(0.75 + tail * 0.3, 0.7);
  for (let i = 0; i < n; i++) {
    const x0 = 0.75 - (i / n) * 1.5 + tail * 0.3,
      x1 = 0.75 - ((i + 1) / n) * 1.5 + tail * 0.3;
    const d = 0.98 + wob * Math.sin(t * 6 + ph + i * 1.4);
    p.quadraticCurveTo((x0 + x1) / 2, d, x1, 0.7 + 0.06 * Math.sin(t * 5 + i + ph));
  }
  p.closePath();
  return p;
}

function ghost(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  c.rotate(Math.sin(t * 2.2 + P.ph) * 0.08);
  const p = ghostPath(t, P.ph, 0.1);
  if (mode === 'body') {
    c.save();
    c.globalAlpha *= 0.62;
    fillBody(c, p, e, t, e.def.color, 0.07);
    c.restore();
    // bright rim
    c.strokeStyle = rgba('#e8f6ff', 0.7);
    c.lineWidth = 0.05;
    c.stroke(p);
    // little arms
    c.fillStyle = rgba(e.def.color, 0.6);
    c.beginPath();
    c.ellipse(0.72, -0.05, 0.22, 0.1, -0.6, 0, TAU);
    c.fill();
    // hollow eyes & mouth
    c.fillStyle = 'rgba(14,20,40,0.85)';
    ell(c, 0.05, -0.38, 0.13, 0.18);
    c.fill();
    ell(c, 0.42, -0.38, 0.11, 0.16);
    c.fill();
    const m = 0.08 + Math.abs(Math.sin(t * 3 + P.ph)) * 0.06;
    ell(c, 0.25, -0.02, 0.09, m);
    c.fill();
  } else {
    // soft spectral glow + eye glints
    glow(c, 0, -0.1, 1.5, '#9ad8ff', 0.35);
    c.strokeStyle = rgba('#bfefff', 0.35);
    c.lineWidth = 0.08;
    c.stroke(p);
  }
  eye(c, mode, 0.07, -0.42, 0.045, e.def.eye, 0, 1);
  eye(c, mode, 0.43, -0.42, 0.04, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ spiders (top-down)

function spiderLegs(c: C, t: number, ph: number, col: string, speed: number, reach: number, lw: number) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const xs = [0.38, 0.14, -0.1, -0.32];
  for (let i = 0; i < 4; i++)
    for (const s of [-1, 1]) {
      const sw = Math.sin(t * speed + ph + i * 1.7 + (s > 0 ? Math.PI : 0)) * 0.22;
      const x = xs[i];
      const kx = x + (i < 2 ? 0.2 : -0.1) + sw * 0.4,
        ky = s * 0.62 * reach;
      const fx = x + (i - 1.5) * -0.32 + sw,
        fy = s * 1.12 * reach;
      c.strokeStyle = 'rgba(8,4,10,0.95)';
      c.lineWidth = lw + 0.06;
      c.beginPath();
      c.moveTo(x, s * 0.15);
      c.lineTo(kx, ky);
      c.lineTo(fx, fy);
      c.stroke();
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.stroke();
    }
}

function spidermother(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const col = e.def.color;
  if (mode === 'body') {
    spiderLegs(c, t, P.ph, shade(col, 0.15), 14, 1, 0.1);
    // egg sac carried on the back
    const sac = new Path2D();
    sac.ellipse(-0.95, 0, 0.32, 0.3, 0, 0, TAU);
    c.fillStyle = '#e8e4f0';
    c.fill(sac);
    c.strokeStyle = 'rgba(20,10,20,0.8)';
    c.lineWidth = 0.05;
    c.stroke(sac);
    c.strokeStyle = 'rgba(160,150,180,0.7)';
    c.lineWidth = 0.02;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(-0.95, 0, 0.3 - i * 0.02, 0.1 + i * 0.06, i * 0.7, 0, TAU);
      c.stroke();
    }
    // abdomen + cephalothorax
    const p = new Path2D();
    p.ellipse(-0.38, 0, 0.58, 0.5, 0, 0, TAU);
    p.moveTo(0.62, 0);
    p.ellipse(0.35, 0, 0.3, 0.27, 0, 0, TAU);
    fillBody(c, p, e, t, col, 0.09);
    // hairs
    c.strokeStyle = shade(col, 0.25);
    c.lineWidth = 0.025;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      const x = -0.38 + Math.cos(a) * 0.56,
        y = Math.sin(a) * 0.48;
      line(c, x, y, x + Math.cos(a) * 0.08, y + Math.sin(a) * 0.08);
    }
    // red hourglass
    c.fillStyle = '#e02a3a';
    c.beginPath();
    c.moveTo(-0.6, -0.16);
    c.lineTo(-0.16, -0.16);
    c.lineTo(-0.38, 0);
    c.lineTo(-0.16, 0.16);
    c.lineTo(-0.6, 0.16);
    c.lineTo(-0.38, 0);
    c.closePath();
    c.fill();
    // fangs
    c.fillStyle = '#3a1a2a';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(0.66, s * 0.09, 0.08, 0.04, s * 0.4, 0, TAU);
      c.fill();
    }
  }
  for (const [x, y, r] of [
    [0.52, -0.08, 0.055],
    [0.52, 0.08, 0.055],
    [0.44, -0.16, 0.04],
    [0.44, 0.16, 0.04],
  ])
    eye(c, mode, x, y, r, e.def.eye, 0, 1);
}

function spiderling(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.rotate(e.facing);
  const col = e.def.color;
  if (mode === 'body') {
    spiderLegs(c, t, P.ph, shade(col, 0.3), 26, 0.95, 0.14);
    const p = new Path2D();
    p.ellipse(-0.25, 0, 0.5, 0.42, 0, 0, TAU);
    p.moveTo(0.62, 0);
    p.ellipse(0.38, 0, 0.26, 0.24, 0, 0, TAU);
    fillBody(c, p, e, t, col, 0.1);
    c.fillStyle = '#e02a3a';
    circle(c, -0.3, 0, 0.12);
    c.fill();
  }
  eye(c, mode, 0.5, -0.08, 0.08, e.def.eye, 0, 1);
  eye(c, mode, 0.5, 0.08, 0.08, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ witch on a broom

function witch(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const col = e.def.color;
  const bob = Math.sin(t * 3 + P.ph) * 0.05;
  c.rotate(-0.08 + bob * 0.5);
  if (mode === 'body') {
    c.lineCap = 'round';
    // cape streaming behind
    const cw = Math.sin(t * 9 + P.ph);
    const cape = new Path2D();
    cape.moveTo(-0.05, -0.55);
    cape.quadraticCurveTo(-0.6, -0.5 + cw * 0.08, -1.15, -0.25 + cw * 0.15);
    cape.lineTo(-1.0, -0.05 + cw * 0.1);
    cape.lineTo(-1.1, 0.12 + cw * 0.12);
    cape.quadraticCurveTo(-0.5, 0.05, -0.1, 0.0);
    cape.closePath();
    fillBody(c, cape, e, t, shade(col, -0.25), 0.07);
    // broom stick
    c.strokeStyle = 'rgba(10,6,14,0.9)';
    c.lineWidth = 0.13;
    line(c, -0.75, 0.28, 1.05, 0.12);
    c.strokeStyle = '#8a6038';
    c.lineWidth = 0.07;
    line(c, -0.75, 0.28, 1.05, 0.12);
    // bristles
    const br = new Path2D();
    br.moveTo(-0.7, 0.2);
    br.lineTo(-1.25, 0.05);
    br.lineTo(-1.3, 0.3);
    br.lineTo(-1.2, 0.52);
    br.lineTo(-0.7, 0.36);
    br.closePath();
    fillBody(c, br, e, t, '#b08a3a', 0.06);
    c.strokeStyle = 'rgba(80,50,20,0.7)';
    c.lineWidth = 0.02;
    for (let i = 0; i < 4; i++) line(c, -0.75, 0.25 + i * 0.03, -1.25, 0.1 + i * 0.12);
    c.strokeStyle = '#5a3a5a';
    c.lineWidth = 0.05;
    line(c, -0.72, 0.18, -0.72, 0.38);
    // robe / body seated on the broom
    const body = new Path2D();
    body.moveTo(-0.32, 0.25);
    body.quadraticCurveTo(-0.35, -0.3, -0.05, -0.6);
    body.quadraticCurveTo(0.22, -0.55, 0.28, -0.2);
    body.quadraticCurveTo(0.3, 0.12, 0.45, 0.3);
    body.lineTo(0.1, 0.4);
    body.closePath();
    fillBody(c, body, e, t, col, 0.08);
    // dangling boot
    c.fillStyle = '#1a1420';
    ell(c, 0.42, 0.42, 0.12, 0.06, 0.2);
    c.fill();
    c.strokeStyle = '#7a3a8a';
    c.lineWidth = 0.05;
    line(c, 0.15, 0.32, 0.36, 0.4);
    // arm holding a potion forward
    c.strokeStyle = shade(col, 0.1);
    c.lineWidth = 0.1;
    line(c, 0.1, -0.35, 0.45, -0.18);
    c.fillStyle = '#8ac070';
    circle(c, 0.48, -0.17, 0.05);
    c.fill();
    // head: green face, long nose
    const face = new Path2D();
    face.ellipse(0.08, -0.72, 0.17, 0.17, 0, 0, TAU);
    face.moveTo(0.22, -0.74);
    face.lineTo(0.42, -0.66);
    face.lineTo(0.22, -0.64);
    fillBody(c, face, e, t, '#7aa060', 0.06);
    // hair
    c.fillStyle = '#2a1a2a';
    c.beginPath();
    c.moveTo(-0.08, -0.8);
    c.quadraticCurveTo(-0.35, -0.6, -0.3, -0.4 + cw * 0.04);
    c.quadraticCurveTo(-0.15, -0.55, -0.02, -0.62);
    c.fill();
    // pointy hat
    const hat = new Path2D();
    hat.moveTo(-0.3, -0.84);
    hat.quadraticCurveTo(0.08, -0.78, 0.42, -0.86);
    hat.quadraticCurveTo(0.1, -0.94, 0.12, -0.96);
    hat.quadraticCurveTo(0.0, -1.25, -0.42, -1.3 + cw * 0.04);
    hat.quadraticCurveTo(-0.15, -1.1, -0.1, -0.94);
    hat.quadraticCurveTo(-0.15, -0.9, -0.3, -0.84);
    hat.closePath();
    fillBody(c, hat, e, t, shade(col, -0.1), 0.06);
    c.fillStyle = '#7a3aa8';
    c.beginPath();
    c.moveTo(-0.12, -0.93);
    c.lineTo(0.12, -0.95);
    c.lineTo(0.11, -1.0);
    c.lineTo(-0.1, -0.99);
    c.fill();
  }
  // potion glow & eyes
  if (mode === 'glow') glow(c, 0.52, -0.2, 0.35, '#a0ff5a', 0.6 + 0.2 * Math.sin(t * 5));
  else {
    c.fillStyle = '#b8ff7a';
    ell(c, 0.53, -0.2, 0.07, 0.08);
    c.fill();
    c.fillStyle = '#304030';
    c.fillRect(0.51, -0.32, 0.04, 0.05);
  }
  eye(c, mode, 0.13, -0.75, 0.04, e.def.eye, 0, 1);
}

// ------------------------------------------------------------------ the Headless Horseman (boss)

function horseman(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const dash = (e.dashT ?? 0) > 0;
  const sp = dash ? 13 : 7;
  const w = t * sp + P.ph;
  const bob = Math.sin(w * 2) * (dash ? 0.06 : 0.035);
  const tilt = dash ? 0.1 : 0;
  c.rotate(tilt);
  const col = e.def.color;
  // pumpkin head held aloft
  const hx = 0.32 + (dash ? 0.12 : 0),
    hy = -1.18 + bob;
  if (mode === 'body') {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // legs: gallop gait
    const leg = (x: number, p: number, k: number) => {
      const s = Math.sin(w + p),
        cc = Math.cos(w + p);
      const amp = dash ? 0.42 : 0.26;
      const kx = x + s * amp * 0.5,
        ky = 0.48 + bob;
      const fx = x + s * amp,
        fy = 0.92 - Math.max(0, cc) * (dash ? 0.22 : 0.12);
      for (const [w0, w1, col] of [
        [0.24, 0.14, 'rgba(6,3,8,0.95)'],
        [0.17, 0.08, shade('#2a2026', k)],
      ] as const) {
        c.strokeStyle = col;
        c.lineWidth = w0;
        line(c, x, 0.1 + bob, kx, ky);
        c.lineWidth = w1;
        line(c, kx, ky, fx, fy);
      }
      c.fillStyle = '#0a0608';
      ell(c, fx + 0.04, fy + 0.02, 0.08, 0.045);
      c.fill();
    };
    leg(-0.62, Math.PI * 0.6, -0.4);
    leg(0.55, Math.PI * 1.6, -0.4);
    // tail streaming
    c.strokeStyle = '#0a0608';
    c.lineWidth = 0.12;
    c.beginPath();
    c.moveTo(-0.85, -0.05 + bob);
    c.quadraticCurveTo(-1.15, 0.0 + Math.sin(w) * 0.1, -1.25, dash ? -0.15 : 0.35);
    c.stroke();
    // horse body + neck + head
    const horse = new Path2D();
    horse.moveTo(-0.85, -0.2 + bob);
    horse.bezierCurveTo(-1.04, -0.15 + bob, -1.02, 0.25 + bob, -0.72, 0.32 + bob);
    horse.quadraticCurveTo(0.0, 0.44 + bob, 0.5, 0.3 + bob);
    horse.bezierCurveTo(0.76, 0.24 + bob, 0.82, 0.0 + bob, 0.76, -0.15 + bob);
    horse.quadraticCurveTo(0.86, -0.33 + bob, 1.02, -0.36 + bob);
    horse.lineTo(1.26, -0.22 + bob);
    horse.quadraticCurveTo(1.36, -0.28 + bob, 1.31, -0.38 + bob);
    horse.lineTo(1.1, -0.66 + bob);
    horse.quadraticCurveTo(1.0, -0.76 + bob, 0.9, -0.69 + bob);
    horse.quadraticCurveTo(0.66, -0.6 + bob, 0.5, -0.3 + bob);
    horse.quadraticCurveTo(0.1, -0.22 + bob, -0.3, -0.25 + bob);
    horse.quadraticCurveTo(-0.7, -0.3 + bob, -0.85, -0.2 + bob);
    horse.closePath();
    fillBody(c, horse, e, t, '#241a20', 0.08);
    // muscle highlights
    c.strokeStyle = 'rgba(120,100,140,0.35)';
    c.lineWidth = 0.03;
    c.beginPath();
    c.arc(-0.62, 0.02 + bob, 0.22, Math.PI * 1.1, Math.PI * 1.6);
    c.moveTo(0.62, -0.05 + bob);
    c.arc(0.5, 0.02 + bob, 0.15, -0.6, 0.4);
    c.stroke();
    // ear
    c.fillStyle = '#140c10';
    c.beginPath();
    c.moveTo(0.96, -0.7 + bob);
    c.lineTo(0.95, -0.88 + bob);
    c.lineTo(1.05, -0.7 + bob);
    c.fill();
    // flowing mane along the crest
    c.strokeStyle = '#0a0608';
    c.lineWidth = 0.07;
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const x = 0.92 - k * 0.4,
        y = -0.68 + k * 0.38 + bob;
      line(c, x, y, x - 0.2 - (dash ? 0.12 : 0), y - 0.02 + Math.sin(w + i) * 0.06);
    }
    // saddle & barding
    c.fillStyle = '#5a1a1a';
    c.beginPath();
    c.ellipse(-0.1, -0.22 + bob, 0.3, 0.1, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#a07a3a';
    c.lineWidth = 0.03;
    line(c, 0.65, -0.3 + bob, 1.05, -0.4 + bob);
    leg(-0.42, 0, 0);
    leg(0.38, Math.PI, 0);
    // rider: tattered cape
    const cw = Math.sin(w * 0.5) * 0.08;
    const cape = new Path2D();
    cape.moveTo(0.05, -0.85 + bob);
    cape.quadraticCurveTo(-0.6, -0.8 + cw, dash ? -1.25 : -0.85, (dash ? -0.75 : -0.25) + cw);
    cape.lineTo(dash ? -1.1 : -0.75, (dash ? -0.55 : -0.12) + cw);
    cape.lineTo(dash ? -1.15 : -0.65, (dash ? -0.4 : 0.0) + cw);
    cape.quadraticCurveTo(-0.4, -0.3 + bob, -0.15, -0.3 + bob);
    cape.closePath();
    fillBody(c, cape, e, t, '#3a1020', 0.07);
    // torso (headless, high collar)
    const torso = new Path2D();
    torso.moveTo(-0.25, -0.25 + bob);
    torso.quadraticCurveTo(-0.3, -0.7 + bob, -0.12, -0.88 + bob);
    torso.lineTo(0.14, -0.9 + bob);
    torso.quadraticCurveTo(0.25, -0.6 + bob, 0.15, -0.25 + bob);
    torso.closePath();
    fillBody(c, torso, e, t, col, 0.07);
    // collar
    c.fillStyle = '#4a2a2a';
    c.beginPath();
    c.moveTo(-0.15, -0.88 + bob);
    c.lineTo(-0.08, -1.0 + bob);
    c.lineTo(0.0, -0.9 + bob);
    c.lineTo(0.1, -1.0 + bob);
    c.lineTo(0.16, -0.88 + bob);
    c.closePath();
    c.fill();
    // leg in stirrup
    c.strokeStyle = '#140c10';
    c.lineWidth = 0.12;
    line(c, 0.0, -0.3 + bob, 0.12, 0.05 + bob);
    // arm raised holding the head
    c.strokeStyle = 'rgba(6,3,8,0.95)';
    c.lineWidth = 0.14;
    line(c, 0.08, -0.78 + bob, hx - 0.02, hy + 0.2);
    c.strokeStyle = shade(col, 0.15);
    c.lineWidth = 0.09;
    line(c, 0.08, -0.78 + bob, hx - 0.02, hy + 0.2);
    pumpkin(c, hx, hy, 0.24, 2, 0.9, 0.6, 0);
  } else {
    // flames licking off the head + molten face glow
    glow(c, hx, hy, 0.75, '#ff8a1a', 0.6 + 0.15 * Math.sin(t * 11));
    for (let i = 0; i < 4; i++) {
      const p = (t * (dash ? 2.5 : 1.5) + i / 4 + P.ph) % 1;
      const x = hx - p * (dash ? 1.4 : 0.3) + Math.sin(t * 7 + i * 2) * 0.05,
        y = hy - 0.22 - p * (dash ? 0.2 : 0.5);
      glow(c, x, y, 0.16 * (1 - p) + 0.05, i % 2 ? '#ffd040' : '#ff6a10', 0.8 * (1 - p));
    }
    if (dash) {
      // a fiery streak behind the charge
      const g = c.createLinearGradient(-2.2, 0, -0.8, 0);
      g.addColorStop(0, 'rgba(255,90,10,0)');
      g.addColorStop(1, 'rgba(255,140,30,0.22)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(-1.5, -0.1, 0.7, 0.25, 0, 0, TAU);
      c.fill();
    }
  }
  // the horse's ember eye
  eye(c, mode, 1.08, -0.55 + bob, 0.045, '#ff5a1a', 0, 1);
}

// ------------------------------------------------------------------ the Banshee (boss, air)

function banshee(c: C, e: Enemy, t: number, P: Pose, mode: Mode) {
  c.scale(P.flip, 1);
  const col = e.def.color;
  const sway = Math.sin(t * 1.5 + P.ph);
  const wail = 0.5 + 0.5 * Math.sin(t * 2.4 + P.ph);
  // streaming hair strands
  const hair = (k: number) => {
    const p = new Path2D();
    const y0 = -0.75 + k * 0.08;
    p.moveTo(0.05, y0 - 0.15);
    for (let i = 1; i <= 6; i++) {
      const x = 0.05 - i * 0.22;
      const y = y0 - 0.1 + Math.sin(t * 4 + i * 0.9 + k * 1.3 + P.ph) * 0.06 * i + k * 0.04 * i;
      p.lineTo(x, y);
    }
    return p;
  };
  // figure: shoulders, raised arms, a body trailing into wisps
  const body = new Path2D();
  body.moveTo(-0.2, -0.55);
  body.quadraticCurveTo(-0.55, -0.6, -0.85, -0.95 + sway * 0.05); // left arm up
  body.quadraticCurveTo(-0.7, -0.6, -0.4, -0.3);
  body.quadraticCurveTo(-0.5, 0.2, -0.9, 0.7 + sway * 0.1);
  for (let i = 0; i < 6; i++) {
    const x = -0.9 + (i + 1) * 0.28;
    body.quadraticCurveTo(x - 0.14, 0.5 + 0.12 * Math.sin(t * 5 + i + P.ph), x, 0.9 + 0.15 * Math.sin(t * 4 + i * 1.7 + P.ph));
  }
  body.quadraticCurveTo(0.6, 0.2, 0.42, -0.3);
  body.quadraticCurveTo(0.75, -0.6, 0.95, -0.9 - sway * 0.05); // right arm up
  body.quadraticCurveTo(0.6, -0.62, 0.25, -0.55);
  body.closePath();
  const head = new Path2D();
  head.ellipse(0.03, -0.72, 0.2, 0.24, 0, 0, TAU);
  if (mode === 'body') {
    c.save();
    c.globalAlpha *= 0.55;
    c.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      c.strokeStyle = rgba(mix(col, '#ffffff', 0.25), 0.7);
      c.lineWidth = 0.09 - k * 0.008;
      c.stroke(hair(k));
    }
    fillBody(c, body, e, t, col, 0.07);
    c.restore();
    c.strokeStyle = rgba('#e8f4ff', 0.65);
    c.lineWidth = 0.04;
    c.stroke(body);
    c.save();
    c.globalAlpha *= 0.85;
    fillBody(c, head, e, t, mix(col, '#ffffff', 0.35), 0.05);
    c.restore();
    // dark wailing mouth & hollow eyes
    c.fillStyle = 'rgba(10,14,30,0.92)';
    ell(c, 0.05, -0.58, 0.07, 0.07 + wail * 0.07);
    c.fill();
    ell(c, -0.04, -0.78, 0.05, 0.035, 0.2);
    c.fill();
    ell(c, 0.11, -0.78, 0.05, 0.035, -0.2);
    c.fill();
  } else {
    glow(c, 0, -0.2, 1.7, '#a8d0ff', 0.4);
    c.strokeStyle = rgba('#cfe6ff', 0.3);
    c.lineWidth = 0.1;
    c.stroke(body);
    // wail rings rippling from the mouth
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.9 + k / 3 + P.ph) % 1;
      c.strokeStyle = rgba('#d8ecff', 0.45 * (1 - p) * (0.4 + wail * 0.6));
      c.lineWidth = 0.05;
      c.beginPath();
      c.arc(0.05, -0.58, 0.15 + p * 0.9, -0.7, 0.7);
      c.stroke();
    }
  }
  eye(c, mode, -0.04, -0.78, 0.035, e.def.eye, 0, 1);
  eye(c, mode, 0.11, -0.78, 0.035, e.def.eye, 0, 1);
}

export const AUTUMN_ENEMIES: Partial<Record<EnemyId, (c: C, e: Enemy, t: number, P: Pose, mode: Mode) => void>> = {
  skeleton,
  gremlin,
  bat,
  zombie,
  ghost,
  spidermother,
  spiderling,
  witch,
  horseman,
  banshee,
} as Partial<Record<EnemyId, (c: C, e: Enemy, t: number, P: Pose, mode: Mode) => void>>;

// ------------------------------------------------------------------ allied raised zombie

const ALLY_R = 0.3;

export function drawAutumnAlly(ctx: C, a: Ally, t: number) {
  if (a.kind !== 'zombie') return;
  const flip = Math.cos(a.facing) < -0.1 ? -1 : 1;
  const ph = a.uid * 1.618;
  const busy = (a.busy ?? 0) > 0 ? 1 : 0;
  ctx.save();
  // shadow + green aura ring on the ground
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ell(ctx, a.x, a.y + ALLY_R * 0.6, ALLY_R * 0.9, ALLY_R * 0.35);
  ctx.fill();
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, a.x, a.y, ALLY_R * 2.2, '#7aff5a', 0.22 + 0.06 * Math.sin(t * 3 + ph));
  ctx.strokeStyle = rgba('#9aff7a', 0.45);
  ctx.lineWidth = 0.02;
  ell(ctx, a.x, a.y + ALLY_R * 0.62, ALLY_R * 0.85, ALLY_R * 0.32);
  ctx.stroke();
  ctx.globalCompositeOperation = op;
  ctx.translate(a.x, a.y);
  ctx.scale(ALLY_R * flip, ALLY_R);
  const fill: Fill = (p, base, lw = 0.09) => {
    const g = ctx.createRadialGradient(-0.3, -0.45, 0.05, 0, 0, 1.35);
    g.addColorStop(0, shade(base, 0.2));
    g.addColorStop(0.45, base);
    g.addColorStop(1, shade(base, -0.75));
    ctx.fillStyle = g;
    ctx.fill(p);
    ctx.strokeStyle = 'rgba(6,3,14,0.85)';
    ctx.lineWidth = lw;
    ctx.stroke(p);
    ctx.strokeStyle = rgba('#9aff7a', 0.5);
    ctx.lineWidth = lw * 0.45;
    ctx.stroke(p);
  };
  const look = { skin: '#7aa070', shirt: '#3a5a4a', pants: '#2e3a3a', eyeCol: '#7aff5a' };
  zombieFigure(ctx, t, ph, 'body', fill, look, busy ? 0.6 + 0.4 * Math.sin(t * 10) : 0, (x, y, r) => eye(ctx, 'body', x, y, r, '#9aff6a', 0, 1));
  ctx.globalCompositeOperation = 'lighter';
  zombieFigure(ctx, t, ph, 'glow', fill, look, 0, (x, y, r) => eye(ctx, 'glow', x, y, r, '#7aff5a', 0, 1));
  ctx.globalCompositeOperation = op;
  ctx.restore();
}
