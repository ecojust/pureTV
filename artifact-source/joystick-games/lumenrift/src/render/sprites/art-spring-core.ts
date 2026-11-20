// Spring campaign art: the Heartseed (core) and the burrow mouths the pests crawl out of (rifts).
import { CORE_X, CORE_Y } from '../../game/config';
import type { Game } from '../../game/game';
import {
  BARK,
  ballGrad,
  type C,
  circle,
  dropShadow,
  ell,
  flower,
  fo,
  leaf,
  OUT,
  PETAL,
  PETAL_WHITE,
  POLLEN,
  POLLEN_LIGHT,
  SOIL,
  SOIL_DARK,
  stone,
  TAU,
} from './art-spring-kit';
import { cached, glow, hash, mix, pxOf, rgba, shade } from './util';

// ------------------------------------------------------------------ the Heartseed

function heartBase(c: C, L: number) {
  return cached(`sp-heart-base|${L}`, pxOf(c), -1.7, -1.5, 3.4, 3.1, (g) => {
    dropShadow(g, 0.1, 0.25, 1.5, 1.15);
    // soft clover lawn ring
    const lg = g.createRadialGradient(0, 0.1, 0.3, 0, 0.1, 1.5);
    lg.addColorStop(0, 'rgba(120,180,70,0)');
    lg.addColorStop(0.7, 'rgba(120,180,70,0.25)');
    lg.addColorStop(1, 'rgba(120,180,70,0)');
    g.fillStyle = lg;
    g.fillRect(-1.6, -1.4, 3.2, 3);
    // soil mound
    ell(g, 0, 0.12, 1.05, 0.82);
    const sg = g.createRadialGradient(-0.2, -0.05, 0.1, 0, 0.12, 1.05);
    sg.addColorStop(0, shade(SOIL, 0.2));
    sg.addColorStop(0.7, SOIL);
    sg.addColorStop(1, SOIL_DARK);
    fo(g, sg, 0.025);
    // big roots snaking from the seed out under the stones
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.3;
      const ex = Math.cos(a) * 1.25,
        ey = 0.12 + Math.sin(a) * 0.98;
      const mx = Math.cos(a + 0.25) * 0.65,
        my = 0.08 + Math.sin(a + 0.25) * 0.5;
      g.strokeStyle = OUT;
      g.lineWidth = 0.08;
      g.beginPath();
      g.moveTo(Math.cos(a) * 0.25, -0.05 + Math.sin(a) * 0.2);
      g.quadraticCurveTo(mx, my, ex, ey);
      g.stroke();
      g.strokeStyle = BARK;
      g.lineWidth = 0.055;
      g.stroke();
      g.strokeStyle = rgba('#c09a6a', 0.55);
      g.lineWidth = 0.016;
      g.stroke();
    }
    // golden root-light veins for higher levels
    if (L >= 2) {
      g.strokeStyle = rgba(POLLEN_LIGHT, 0.45);
      g.lineWidth = 0.015;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + 0.3;
        g.beginPath();
        g.moveTo(Math.cos(a) * 0.3, -0.05 + Math.sin(a) * 0.24);
        g.quadraticCurveTo(Math.cos(a + 0.25) * 0.65, 0.08 + Math.sin(a + 0.25) * 0.5, Math.cos(a) * 1.0, 0.12 + Math.sin(a) * 0.8);
        g.stroke();
      }
    }
    // ring of mossy standing stones (all of it is static, so the front half lives here too;
    // the seed is drawn on top and its lower half is hidden by the soil lip drawn afterwards)
    const n = 14 + L * 2;
    const st: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.1;
      st.push([Math.cos(a) * 1.18, 0.12 + Math.sin(a) * 0.92, i]);
    }
    st.sort((p, q) => p[1] - q[1]);
    for (const [x, y, i] of st) {
      const k = 0.8 + hash(i * 7 + 3) * 0.45;
      stone(g, x, y, 0.13 * k, 0.1 * k, i * 13, true);
    }
    // flowers and clover tufts in the ring
    const nf = L === 0 ? 4 : 8 + L * 5;
    for (let i = 0; i < nf; i++) {
      const a = hash(i * 31 + 7) * TAU;
      const r = 1.18 + (hash(i * 17) - 0.5) * 0.3;
      const x = Math.cos(a) * r,
        y = 0.12 + Math.sin(a) * r * 0.78 - 0.04;
      if (i % 3 === 0) {
        for (let k = 0; k < 3; k++) leaf(g, x, y + 0.03, -Math.PI / 2 + (k - 1) * 0.7, 0.07, 0.03, '#6ab040', 0.008, false);
      } else flower(g, x, y, 0.05, L >= 2 && i % 2 ? PETAL : i % 5 === 1 ? '#ffe066' : PETAL_WHITE, POLLEN, a);
    }
  });
}

/** Front soil lip that buries the lower half of the seed. */
function soilLip(c: C) {
  return cached(`sp-heart-lip2`, pxOf(c), -0.75, -0.3, 1.5, 0.55, (g) => {
    // clods and moss tufts heaped along the front arc where the seed meets the mound
    for (let i = 0; i < 13; i++) {
      const a = 0.12 + (i / 12) * (Math.PI - 0.24);
      const x = Math.cos(a) * 0.66,
        y = 0.14 + Math.sin(a) * 0.19 + (hash(i * 3) - 0.5) * 0.03;
      const r = 0.035 + hash(i * 7) * 0.03;
      circle(g, x, y, r);
      fo(g, ballGrad(g, x, y, r, i % 4 === 0 ? '#7a9a4a' : shade(SOIL, 0.12)), 0.01);
    }
    for (let i = 0; i < 3; i++) {
      const a = 0.5 + i * 1.0;
      const x = Math.cos(a) * 0.62,
        y = 0.12 + Math.sin(a) * 0.17;
      for (let k = 0; k < 3; k++) leaf(g, x, y, -Math.PI / 2 + (k - 1) * 0.6, 0.08, 0.025, '#7cc04a', 0.008, false);
    }
  });
}

export function drawHeartseed(ctx: C, game: Game, t: number): void {
  const L = Math.max(0, Math.min(4, game.coreLevel | 0));
  const cx = CORE_X + 0.5,
    cy = CORE_Y + 0.5;
  const hpk = Math.max(0, Math.min(1, game.coreHp / Math.max(1, game.coreMaxHp)));
  const gk = 0.45 + 0.55 * hpk;
  const hurt = Math.max(0, Math.min(1, game.coreHurt * 4));
  const pulse = 1 + 0.06 * Math.sin(t * 2.1);
  ctx.save();
  ctx.drawImage(heartBase(ctx, L), cx - 1.7, cy - 1.5, 3.4, 3.1);

  // the seed: a big glowing kernel half buried in the mound
  const sx = cx,
    sy = cy - 0.02;
  const rx = 0.46,
    ry = 0.52;
  glow(ctx, sx, sy - 0.2, 1.3 * pulse, hurt > 0 ? '#ff6a5a' : '#d8ff70', 0.28 * gk);
  // bury the lower part of the seed: clip it above the front arc of the mound
  const bY = sy + 0.14,
    bRx = 0.68,
    bRy = 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx - 2, sy - 3);
  ctx.lineTo(sx + 2, sy - 3);
  ctx.lineTo(sx + 2, bY);
  ctx.lineTo(sx + bRx, bY);
  ctx.ellipse(sx, bY, bRx, bRy, 0, 0, Math.PI);
  ctx.lineTo(sx - 2, bY);
  ctx.closePath();
  ctx.clip();
  ctx.translate(sx, sy - 0.05);
  ctx.rotate(-0.12);
  ctx.scale(1.2, 1.2);
  ell(ctx, 0, -0.08, rx, ry);
  const seedG = ctx.createRadialGradient(-0.16, -0.3, 0.04, 0, -0.08, ry * 1.05);
  seedG.addColorStop(0, '#f2d08a');
  seedG.addColorStop(0.45, '#c8904a');
  seedG.addColorStop(1, '#6a4222');
  fo(ctx, seedG, 0.026);
  // shell ridges
  ctx.strokeStyle = 'rgba(90,55,25,0.55)';
  ctx.lineWidth = 0.014;
  for (const k of [-0.6, -0.25, 0.25, 0.6]) {
    ctx.beginPath();
    ctx.ellipse(0, -0.08, rx * Math.abs(k), ry * 0.98, 0, -Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9);
    if (k < 0) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.stroke();
      ctx.restore();
    } else ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,245,210,0.45)';
  ell(ctx, -0.18, -0.34, 0.11, 0.06, -0.6);
  ctx.fill();
  // glowing crack, wider with level
  const cw = 0.03 + L * 0.012;
  const crack: [number, number][] = [
    [-0.02, -0.6],
    [0.06, -0.46],
    [-0.05, -0.32],
    [0.05, -0.18],
    [-0.02, -0.04],
  ];
  ctx.beginPath();
  crack.forEach(([x, y], i) => (i ? ctx.lineTo(x - cw, y) : ctx.moveTo(x - cw * 0.3, y)));
  for (let i = crack.length - 1; i >= 0; i--) ctx.lineTo(crack[i][0] + cw, crack[i][1]);
  ctx.closePath();
  ctx.fillStyle = hurt > 0 ? '#ffb0a0' : hpk < 0.35 ? '#c8c890' : '#fdffd0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,10,0.8)';
  ctx.lineWidth = 0.012;
  ctx.stroke();
  // damage: extra dark cracks
  if (hpk < 0.6) {
    ctx.strokeStyle = 'rgba(50,30,15,0.85)';
    ctx.lineWidth = 0.014;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.25);
    ctx.lineTo(-0.2, -0.15);
    ctx.lineTo(-0.26, -0.02);
    if (hpk < 0.3) {
      ctx.moveTo(0.3, -0.35);
      ctx.lineTo(0.22, -0.22);
      ctx.lineTo(0.3, -0.1);
    }
    ctx.stroke();
  }
  ctx.restore();
  // contact shade and churned clods along the burial line
  ctx.strokeStyle = 'rgba(40,24,10,0.45)';
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.ellipse(sx, bY, bRx * 0.92, bRy * 0.9, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.drawImage(soilLip(ctx), cx - 0.75, cy - 0.3, 1.5, 0.55);

  // the sapling of light sprouting from the crack
  const bx = sx - 0.09,
    by = sy - 0.76;
  const H = [0.38, 0.62, 0.85, 1.05, 1.25][L];
  const sway = Math.sin(t * 1.1) * 0.03;
  const tx = bx + sway,
    ty = by - H;
  const leafCol = mix('#9ae05a', '#a08040', (1 - hpk) * 0.6);
  const lightCol = hurt > 0 ? '#ffb0a0' : '#f4ffb0';
  glow(ctx, bx, by - H * 0.4, 0.5 + H * 0.4, '#e8ff90', 0.35 * gk * pulse);
  // trunk: woody at the bottom when grown, light at the core
  ctx.lineCap = 'round';
  const tw = 0.04 + L * 0.018;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = tw + 0.03;
  ctx.beginPath();
  ctx.moveTo(bx, by + 0.04);
  ctx.quadraticCurveTo(bx - 0.06, by - H * 0.5, tx, ty);
  ctx.stroke();
  const trg = ctx.createLinearGradient(0, by, 0, ty);
  trg.addColorStop(0, L >= 3 ? '#9a7a4a' : '#8ac850');
  trg.addColorStop(1, '#c8f080');
  ctx.strokeStyle = trg;
  ctx.lineWidth = tw;
  ctx.stroke();
  ctx.strokeStyle = rgba(lightCol, 0.85 * gk);
  ctx.lineWidth = tw * 0.35;
  ctx.stroke();
  // branches
  const branches: [number, number, number][] = []; // (q along trunk, side, length)
  if (L >= 1) branches.push([0.55, -1, 0.22 + L * 0.04], [0.7, 1, 0.2 + L * 0.04]);
  if (L >= 3) branches.push([0.4, 1, 0.3], [0.82, -1, 0.26]);
  const tpt = (q: number) => {
    // point on the trunk quad curve
    const x0 = bx,
      y0 = by + 0.04,
      x1 = bx - 0.06,
      y1 = by - H * 0.5;
    const u = 1 - q;
    return [u * u * x0 + 2 * u * q * x1 + q * q * tx, u * u * y0 + 2 * u * q * y1 + q * q * ty] as const;
  };
  const tips: [number, number][] = [[tx, ty]];
  for (const [q, s, len] of branches) {
    const [x, y] = tpt(q);
    const ex = x + s * len + sway,
      ey = y - len * 0.6;
    ctx.strokeStyle = OUT;
    ctx.lineWidth = tw * 0.6 + 0.025;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + s * len * 0.5, y - 0.02, ex, ey);
    ctx.stroke();
    ctx.strokeStyle = L >= 3 ? '#a08050' : '#9ad060';
    ctx.lineWidth = tw * 0.6;
    ctx.stroke();
    tips.push([ex, ey]);
  }
  // foliage
  if (L <= 2) {
    // individual leaves of light
    const nl = [2, 5, 7][L];
    for (let i = 0; i < nl; i++) {
      const [px, py] = tips[i % tips.length];
      const a = -Math.PI / 2 + (i % 2 ? 0.9 : -0.9) + Math.sin(t * 1.6 + i) * 0.12 + (i >= tips.length ? 0.5 * (i % 2 ? 1 : -1) : 0);
      leaf(ctx, px, py, a, 0.2 + L * 0.03, 0.07, leafCol, 0.014);
    }
    if (L === 0) leaf(ctx, tx, ty, -Math.PI / 2, 0.14, 0.05, leafCol, 0.012);
    if (L === 2) for (let i = 0; i < tips.length; i++) flower(ctx, tips[i][0], tips[i][1] - 0.02, 0.07, i % 2 ? PETAL_WHITE : PETAL, POLLEN, t * 0.2 + i);
  } else {
    // a small flowering crown of leaf clumps
    const R = L === 3 ? 0.6 : 0.8;
    const ccx = tx,
      ccy = ty + 0.05;
    const clumps: [number, number, number][] = [];
    const n = L === 3 ? 9 : 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      clumps.push([ccx + Math.cos(a) * R * 0.62 + Math.sin(t * 1.3 + i) * 0.012, ccy + Math.sin(a) * R * 0.42, R * 0.36]);
    }
    clumps.push([ccx, ccy - R * 0.12, R * 0.45]);
    ctx.fillStyle = OUT;
    for (const [x, y, r] of clumps) {
      circle(ctx, x, y, r + 0.022);
      ctx.fill();
    }
    for (const [x, y, r] of clumps) {
      circle(ctx, x, y, r);
      ctx.fillStyle = ballGrad(ctx, x, y, r, mix('#5fb83e', '#a08040', (1 - hpk) * 0.6), 0.35, -0.35);
      ctx.fill();
    }
    // glowing inner light through the leaves
    glow(ctx, ccx, ccy, R * 1.1, '#f4ffb0', 0.3 * gk * pulse);
    for (let i = 0; i < (L === 3 ? 7 : 12); i++) {
      const a = hash(i * 13 + 1) * TAU,
        d = hash(i * 7) * R * 0.75;
      const x = ccx + Math.cos(a) * d,
        y = ccy + Math.sin(a) * d * 0.6;
      if (L >= 4 || i % 2) flower(ctx, x, y, 0.06, i % 3 ? PETAL : PETAL_WHITE, POLLEN, i + t * 0.1);
      else leaf(ctx, x, y, a, 0.08, 0.03, '#b8ec70', 0.008, false);
    }
  }
  // the gun: a little seed-pod on the trunk that turns toward the target
  {
    const [px, py] = tpt(0.3);
    const a = game.coreAngle;
    const dx = Math.cos(a),
      dy = Math.sin(a) * 0.7;
    const ex = px + dx * 0.16,
      ey = py + dy * 0.16;
    ctx.strokeStyle = '#4a8a32';
    ctx.lineWidth = 0.025;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + dx * 0.07, py + dy * 0.07);
    ctx.stroke();
    ell(ctx, px + dx * 0.11, py + dy * 0.11, 0.08, 0.045, Math.atan2(dy, dx));
    fo(ctx, ballGrad(ctx, px + dx * 0.11, py + dy * 0.11, 0.08, '#8acb4e'), 0.014);
    glow(ctx, ex, ey, 0.14, '#fdffd0', 0.7 * gk);
  }
  // drifting light motes and, at the top, falling petals
  const motes = 4 + L * 2;
  for (let i = 0; i < motes; i++) {
    const q = (t * 0.22 + i / motes + hash(i * 3)) % 1;
    const a = hash(i * 11) * TAU;
    const r = 0.25 + hash(i * 5) * 0.9;
    const x = cx + Math.cos(a) * r + Math.sin(t * 1.2 + i) * 0.06,
      y = cy - 0.1 + Math.sin(a) * r * 0.5 - q * (0.9 + L * 0.2);
    ctx.fillStyle = rgba(i % 2 ? POLLEN_LIGHT : '#e8ffb0', 0.85 * Math.sin(q * Math.PI) * gk);
    circle(ctx, x, y, 0.022);
    ctx.fill();
  }
  if (L >= 4) {
    for (let i = 0; i < 6; i++) {
      const q = (t * 0.15 + i / 6) % 1;
      const x = cx + (hash(i * 9) - 0.5) * 2 + Math.sin(t + i * 2) * 0.15,
        y = ty - 0.1 + q * 1.6;
      ctx.save();
      ctx.globalAlpha *= Math.sin(q * Math.PI);
      ctx.fillStyle = i % 2 ? PETAL : PETAL_WHITE;
      ell(ctx, x, y, 0.03, 0.018, t * 2 + i);
      ctx.fill();
      ctx.restore();
    }
  }
  if (hurt > 0) glow(ctx, cx, cy - 0.3, 1.6, '#ff3030', hurt * 0.5);
  ctx.restore();
}

// ------------------------------------------------------------------ burrow (spawn point)

function burrowCanvas(c: C, seed: number) {
  return cached(`sp-burrow|${seed}`, pxOf(c), -0.7, -0.7, 1.4, 1.4, (g) => {
    // torn turf and scattered earth
    const sg = g.createRadialGradient(0, 0.05, 0.1, 0, 0.05, 0.68);
    sg.addColorStop(0, 'rgba(70,45,22,0.7)');
    sg.addColorStop(0.7, 'rgba(90,60,30,0.35)');
    sg.addColorStop(1, 'rgba(90,60,30,0)');
    g.fillStyle = sg;
    g.fillRect(-0.7, -0.7, 1.4, 1.4);
    // churned mound (bumpy ring)
    g.beginPath();
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const r = 0.46 * (1 + (hash(seed + (i % n)) - 0.5) * 0.25);
      const x = Math.cos(a) * r,
        y = 0.04 + Math.sin(a) * r * 0.75;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    const mg = g.createRadialGradient(-0.12, -0.1, 0.05, 0, 0.04, 0.5);
    mg.addColorStop(0, '#9a6a3e');
    mg.addColorStop(0.6, '#7a5030');
    mg.addColorStop(1, '#4a3018');
    g.fillStyle = mg;
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 0.022;
    g.stroke();
    // soil texture
    for (let i = 0; i < 14; i++) {
      const a = hash(seed + i * 3) * TAU,
        d = 0.24 + hash(seed + i * 7) * 0.18;
      g.fillStyle = i % 2 ? 'rgba(50,30,15,0.5)' : 'rgba(180,130,80,0.45)';
      circle(g, Math.cos(a) * d, 0.04 + Math.sin(a) * d * 0.75, 0.015 + hash(i) * 0.012);
      g.fill();
    }
    // tunnel mouth
    ell(g, 0, 0.0, 0.24, 0.17);
    const hg = g.createRadialGradient(0.02, 0.04, 0, 0, 0, 0.25);
    hg.addColorStop(0, '#000000');
    hg.addColorStop(0.6, '#1a0e06');
    hg.addColorStop(1, '#3a2210');
    g.fillStyle = hg;
    g.fill();
    g.strokeStyle = 'rgba(20,10,4,0.9)';
    g.lineWidth = 0.02;
    g.stroke();
    // lit inner rim at the back
    g.strokeStyle = 'rgba(160,110,60,0.7)';
    g.lineWidth = 0.02;
    g.beginPath();
    g.ellipse(0, 0.0, 0.22, 0.15, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    // roots dangling over the rim
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (1.1 + i * 0.25);
      const x = Math.cos(a) * 0.23,
        y = Math.sin(a) * 0.16;
      g.strokeStyle = '#c8a070';
      g.lineWidth = 0.014;
      g.beginPath();
      g.moveTo(x, y - 0.02);
      g.quadraticCurveTo(x * 0.8 + 0.02, y + 0.05, x * 0.7, y + 0.1);
      g.stroke();
    }
    // dirt clods around
    for (let i = 0; i < 9; i++) {
      const a = hash(seed * 3 + i) * TAU,
        d = 0.48 + hash(seed + i * 11) * 0.14;
      const x = Math.cos(a) * d,
        y = 0.04 + Math.sin(a) * d * 0.75;
      const r = 0.03 + hash(i * 5 + seed) * 0.025;
      circle(g, x, y, r);
      fo(g, ballGrad(g, x, y, r, '#8a5a32'), 0.01);
    }
    // torn grass tufts
    for (let i = 0; i < 5; i++) {
      const a = hash(seed + i * 29) * TAU,
        d = 0.46;
      const x = Math.cos(a) * d,
        y = 0.04 + Math.sin(a) * d * 0.75;
      g.strokeStyle = '#4a8a32';
      g.lineWidth = 0.014;
      g.beginPath();
      for (let k = -1; k <= 1; k++) {
        g.moveTo(x, y);
        g.lineTo(x + k * 0.03, y - 0.07);
      }
      g.stroke();
    }
  });
}

export function drawBurrow(ctx: C, x: number, y: number, t: number, state: 'open' | 'forming'): void {
  const cx = x + 0.5,
    cy = y + 0.5;
  const seed = (x * 31 + y * 17) & 7;
  ctx.save();
  if (state === 'forming') {
    // trembling cracked soil, a few clods popping up
    const sh = Math.sin(t * 37) * 0.012 * (0.5 + 0.5 * Math.sin(t * 3));
    ctx.translate(sh, 0);
    ctx.fillStyle = 'rgba(80,52,26,0.45)';
    ell(ctx, cx, cy, 0.42, 0.32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,10,0.85)';
    ctx.lineWidth = 0.022;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 0.18, cy + Math.sin(a) * 0.14);
      ctx.lineTo(cx + Math.cos(a + 0.35) * 0.36, cy + Math.sin(a + 0.35) * 0.28);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.9 + i / 4) % 1;
      const a = hash(i * 7 + seed) * TAU;
      const px = cx + Math.cos(a) * (0.1 + q * 0.15),
        py = cy + Math.sin(a) * 0.1 - Math.sin(q * Math.PI) * 0.22;
      circle(ctx, px, py, 0.03);
      fo(ctx, '#8a5a32', 0.01);
    }
    ctx.restore();
    return;
  }
  ctx.drawImage(burrowCanvas(ctx, seed), cx - 0.7, cy - 0.7, 1.4, 1.4);
  // dust puffs and a tumbling clod now and then
  for (let i = 0; i < 3; i++) {
    const q = (t * 0.5 + i / 3) % 1;
    const a = Math.PI * (1.2 + i * 0.3);
    ctx.fillStyle = rgba('#c8a878', 0.4 * (1 - q));
    circle(ctx, cx + Math.cos(a) * 0.2 * (1 + q), cy - q * 0.25, 0.04 + q * 0.06);
    ctx.fill();
  }
  {
    const q = (t * 0.7) % 1;
    const a = hash(Math.floor(t * 0.7) + seed) * TAU;
    const px = cx + Math.cos(a) * (0.05 + q * 0.4),
      py = cy + Math.sin(a) * q * 0.3 - Math.sin(q * Math.PI) * 0.25;
    circle(ctx, px, py, 0.028);
    fo(ctx, '#7a4e2a', 0.01);
  }
  ctx.restore();
}
