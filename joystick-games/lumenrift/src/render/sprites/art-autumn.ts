// Autumn campaign art (Hallows' Eve): the Great Lantern core, open-grave rifts, and registration of
// the structures (art-autumn-buildings.ts), the hollow host (art-autumn-enemies.ts) and raised zombies.
import { CORE_X, CORE_Y } from '../../game/config';
import type { Game } from '../../game/game';
import {
  C,
  IRON,
  LEAF,
  OUT,
  PUMPKIN,
  SHADOW,
  STONE,
  STONE_D,
  STONE_L,
  STRAW,
  TAU,
  VIOLET,
  WITCH,
  addGlow,
  candleStick,
  circle,
  cyl,
  ell,
  flicker,
  fo,
  lgrad,
  line,
  pumpkin,
  pumpkinFace,
} from './art-autumn-common';
import { autumnIconTall, drawAutumnBuilding } from './art-autumn-buildings';
import { AUTUMN_ENEMIES, drawAutumnAlly } from './art-autumn-enemies';
import { registerArt } from './realm-art';
import { cached, glow, hash, pxOf, rgba, shade, TRng } from './util';

// ------------------------------------------------------------------ the Great Lantern (core)

const SMALL: [number, number, number, number][] = [
  // dx, dy, r, hue — around the straw mound (back ones have dy < -0.35)
  [-0.95, -0.55, 0.2, 1],
  [0.9, -0.6, 0.18, 2],
  [-1.15, 0.1, 0.22, 0],
  [1.12, 0.05, 0.24, 1],
  [-0.7, 0.55, 0.2, 2],
  [0.65, 0.6, 0.22, 0],
  [-0.15, 0.78, 0.16, 1],
  [0.3, 0.85, 0.14, 2],
  [-1.25, -0.25, 0.14, 2],
  [1.28, -0.3, 0.15, 0],
];

function smallCount(L: number) {
  return [4, 5, 7, 8, 10][L];
}

function moundCanvas(c: C, L: number) {
  return cached(`alantern-mound|${L}`, pxOf(c), -1.6, -1.2, 3.2, 2.5, (g) => {
    g.fillStyle = SHADOW;
    ell(g, 0.1, 0.32, 1.5, 0.95);
    g.fill();
    // earth hill
    ell(g, 0, 0.2, 1.42, 0.92);
    fo(g, lgrad(g, 0, -0.7, 0, 1.1, [
      [0, '#4a3a30'],
      [1, '#241a16'],
    ]), 0.025);
    // straw bed
    ell(g, 0, 0.08, 1.08, 0.66);
    fo(g, lgrad(g, -1, -0.5, 1, 0.7, [
      [0, shade(STRAW, 0.15)],
      [1, shade(STRAW, -0.35)],
    ]), 0.02);
    const r = new TRng(77 + L);
    g.lineCap = 'round';
    for (let i = 0; i < 140; i++) {
      const a = r.next() * TAU,
        d = Math.sqrt(r.next());
      const x = Math.cos(a) * d * 1.05,
        y = 0.08 + Math.sin(a) * d * 0.64;
      const ang = r.next() * Math.PI;
      g.strokeStyle = r.next() < 0.5 ? 'rgba(255,230,150,0.55)' : 'rgba(120,80,30,0.55)';
      g.lineWidth = 0.012;
      line(g, x, y, x + Math.cos(ang) * 0.08, y + Math.sin(ang) * 0.04);
    }
    // fallen leaves on the hill
    const cols = ['#c8541a', '#e08a2a', '#a8361a', '#d8a63a'];
    for (let i = 0; i < 18 + L * 4; i++) {
      const a = r.next() * TAU,
        d = 0.8 + r.next() * 0.5;
      const x = Math.cos(a) * d * 1.2,
        y = 0.22 + Math.sin(a) * d * 0.72;
      if (Math.abs(x) > 1.45 || y > 1.08) continue;
      g.save();
      g.translate(x, y);
      g.rotate(r.next() * TAU);
      g.fillStyle = cols[i % 4];
      ell(g, 0, 0, 0.05, 0.025);
      g.fill();
      g.restore();
    }
    // back small pumpkins
    for (let i = 0; i < smallCount(L); i++) {
      const [x, y, rr, hue] = SMALL[i];
      if (y < -0.35) pumpkin(g, x, y, rr, 0, 0, 0, hue);
    }
  });
}

function frontCanvas(c: C, L: number) {
  return cached(`alantern-front|${L}`, pxOf(c), -1.6, -0.6, 3.2, 1.8, (g) => {
    // curling vines over the straw
    g.strokeStyle = LEAF;
    g.lineWidth = 0.035;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-1.1, 0.3);
    g.bezierCurveTo(-0.7, 0.6, -0.3, 0.3, 0.0, 0.62);
    g.bezierCurveTo(0.3, 0.9, 0.7, 0.4, 1.1, 0.4);
    g.stroke();
    g.lineWidth = 0.015;
    for (const [x, y] of [
      [-0.55, 0.52],
      [0.45, 0.64],
      [0.95, 0.36],
    ]) {
      g.beginPath();
      g.arc(x, y, 0.05, 0, Math.PI * 1.6);
      g.stroke();
    }
    for (const [x, y, rot] of [
      [-0.85, 0.42, 0.4],
      [0.15, 0.7, -0.5],
      [0.8, 0.5, 2.2],
    ] as const) {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(0.08, -0.1, 0.18, -0.03, 0.16, 0.05);
      g.bezierCurveTo(0.12, 0.12, 0.03, 0.1, 0, 0);
      fo(g, '#3e6a26', 0.012, 'rgba(10,20,6,0.8)');
      g.restore();
    }
    for (let i = 0; i < smallCount(L); i++) {
      const [x, y, rr, hue] = SMALL[i];
      if (y >= -0.35) pumpkin(g, x, y, rr, 0, 0, 0, hue);
    }
  });
}

/** Lantern post: an iron post with a hanging pumpkin lantern. */
function lanternPost(c: C, x: number, y: number, t: number, seed: number, hot: string) {
  c.fillStyle = SHADOW;
  ell(c, x + 0.03, y + 0.01, 0.08, 0.03);
  c.fill();
  c.beginPath();
  c.rect(x - 0.02, y - 0.75, 0.04, 0.75);
  fo(c, cyl(c, x - 0.02, x + 0.02, '#4a4858', 0.3), 0.01, '#000');
  c.strokeStyle = IRON;
  c.lineWidth = 0.02;
  c.beginPath();
  c.moveTo(x, y - 0.7);
  c.quadraticCurveTo(x + 0.1, y - 0.82, x + 0.18, y - 0.72);
  c.stroke();
  const sw = Math.sin(t * 1.3 + seed) * 0.03;
  c.lineWidth = 0.008;
  line(c, x + 0.18, y - 0.72, x + 0.18 + sw, y - 0.64);
  pumpkin(c, x + 0.18 + sw, y - 0.58, 0.07, 1, 0.9 * flicker(t, seed), 0, 2);
  addGlow(c, x + 0.18 + sw, y - 0.58, 0.3, hot, 0.3);
}

function drawLantern(ctx: C, game: Game, t: number) {
  const L = Math.max(0, Math.min(4, game.coreLevel | 0));
  const cx = CORE_X + 0.5,
    cy = CORE_Y + 0.5;
  const hpk = Math.max(0, Math.min(1, game.coreHp / Math.max(1, game.coreMaxHp)));
  const hurt = Math.max(0, Math.min(1, game.coreHurt * 4));
  const hot = hurt > 0 ? '#ff3a2a' : '#ffa030';
  const f = flicker(t, 3.7);
  ctx.save();
  ctx.drawImage(moundCanvas(ctx, L), cx - 1.6, cy - 1.2, 3.2, 2.5);
  // the warm pool of light around the lantern
  addGlow(ctx, cx, cy - 0.1, 1.9 + L * 0.15, hot, (0.16 + L * 0.03) * f * (0.6 + 0.4 * hpk));
  // back candles / lanterns
  const candles: [number, number][] = [];
  if (L >= 1) {
    const n = 5 + (L >= 3 ? 3 : 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.35;
      candles.push([cx + Math.cos(a) * 0.98, cy + 0.12 + Math.sin(a) * 0.58]);
    }
  }
  const back = candles.filter(([, y]) => y < cy + 0.05);
  const front = candles.filter(([, y]) => y >= cy + 0.05);
  back.forEach(([x, y], i) => candleStick(ctx, x, y, 0.16 + hash(i * 5) * 0.08, 0.05, t, i * 3 + 1, 0, '#efe6cf', hot, 0.7 + L * 0.1));
  if (L >= 2) {
    lanternPost(ctx, cx - 1.25, cy - 0.35, t, 1, hot);
    lanternPost(ctx, cx + 1.1, cy - 0.4, t, 2, hot);
  }
  // ---- the Great Lantern
  const R = 0.78 + L * 0.04;
  const py = cy - 0.3;
  const look = Math.cos(game.coreAngle) * 0.75;
  const lookY = Math.sin(game.coreAngle) * 0.8;
  pumpkin(ctx, cx, py, R, 0, 0, 0, 0);
  // curling stem tendril and leaves
  ctx.strokeStyle = '#4a6a2a';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(cx + 0.12 * R, py - 0.95 * R);
  ctx.bezierCurveTo(cx + 0.45 * R, py - 1.25 * R, cx + 0.7 * R, py - 0.9 * R, cx + 0.5 * R, py - 0.85 * R);
  ctx.bezierCurveTo(cx + 0.35 * R, py - 0.82 * R, cx + 0.4 * R, py - 1.0 * R, cx + 0.52 * R, py - 0.98 * R);
  ctx.stroke();
  for (const [dx, dy, rot, s] of [
    [-0.25, -0.88, -2.6, 1],
    [0.32, -0.86, -0.3, 0.85],
  ] as const) {
    ctx.save();
    ctx.translate(cx + dx * R, py + dy * R);
    ctx.rotate(rot);
    ctx.scale(s * R, s * R);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0.1, -0.16, 0.3, -0.1, 0.34, 0.0);
    ctx.bezierCurveTo(0.28, 0.12, 0.1, 0.12, 0, 0);
    fo(ctx, lgrad(ctx, 0, -0.15, 0, 0.12, [
      [0, '#6a9a3a'],
      [1, '#2e5a1e'],
    ]), 0.02, 'rgba(10,20,6,0.85)');
    ctx.strokeStyle = 'rgba(20,40,10,0.7)';
    ctx.lineWidth = 0.015;
    line(ctx, 0, 0, 0.28, 0.0);
    ctx.restore();
  }
  // carved face, glowing from inside; it flickers red when hurt
  const lit = (0.65 + L * 0.08) * f * (0.55 + 0.45 * hpk) * (hurt > 0 ? 0.75 + 0.25 * Math.sin(t * 40) : 1);
  pumpkinFace(ctx, cx, py, R, 2, lit, look, lookY, hot);
  // cracks when badly hurt
  if (hpk < 0.5) {
    ctx.strokeStyle = 'rgba(40,14,0,0.9)';
    ctx.lineWidth = 0.025;
    ctx.beginPath();
    ctx.moveTo(cx - 0.55 * R, py - 0.55 * R);
    ctx.lineTo(cx - 0.45 * R, py - 0.35 * R);
    ctx.lineTo(cx - 0.6 * R, py - 0.2 * R);
    if (hpk < 0.25) {
      ctx.moveTo(cx + 0.6 * R, py + 0.1 * R);
      ctx.lineTo(cx + 0.45 * R, py + 0.3 * R);
      ctx.lineTo(cx + 0.55 * R, py + 0.48 * R);
    }
    ctx.stroke();
  }
  // L3+: a crown of vines with tiny glowing gourds
  if (L >= 3) {
    const cyc = py - 0.72 * R;
    ctx.strokeStyle = '#3e6a26';
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.ellipse(cx, cyc, 0.55 * R, 0.16 * R, 0, Math.PI * 1.02, Math.PI * 1.98);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + 0.15 + (i / 6) * (Math.PI - 0.3);
      const x = cx + Math.cos(a) * 0.55 * R,
        y = cyc + Math.sin(a) * 0.16 * R;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2 + (i % 2 ? 0.4 : -0.4));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0.05, -0.08, 0, -0.14);
      ctx.quadraticCurveTo(-0.05, -0.08, 0, 0);
      fo(ctx, i % 2 ? '#5a8a2e' : '#7aa83a', 0.01, 'rgba(10,20,6,0.8)');
      ctx.restore();
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 ? VIOLET : '#ffd040';
        circle(ctx, x, y - 0.02, 0.028);
        ctx.fill();
        addGlow(ctx, x, y - 0.02, 0.1, i % 4 ? VIOLET : '#ffd040', 0.5 * f);
      }
    }
  }
  // L4: a crooked witch hat
  if (L >= 4) {
    const hx = cx - 0.05,
      hy = py - 0.8 * R;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-0.12);
    ell(ctx, 0, 0, 0.62, 0.16);
    fo(ctx, lgrad(ctx, -0.6, 0, 0.6, 0, [
      [0, '#3e2a5a'],
      [1, '#160e24'],
    ]), 0.025);
    const sw = Math.sin(t * 1.1) * 0.03;
    ctx.beginPath();
    ctx.moveTo(-0.34, -0.04);
    ctx.quadraticCurveTo(-0.22, -0.55, -0.02, -0.82);
    ctx.quadraticCurveTo(0.12, -0.95, 0.42 + sw, -0.9);
    ctx.quadraticCurveTo(0.2, -0.82, 0.14, -0.6);
    ctx.quadraticCurveTo(0.3, -0.3, 0.34, -0.04);
    ctx.quadraticCurveTo(0, 0.04, -0.34, -0.04);
    ctx.closePath();
    fo(ctx, lgrad(ctx, -0.35, 0, 0.35, 0, [
      [0, '#4a3470'],
      [0.5, '#2a1c44'],
      [1, '#120a20'],
    ]), 0.025);
    // band + buckle
    ctx.beginPath();
    ctx.moveTo(-0.32, -0.08);
    ctx.quadraticCurveTo(0, 0.0, 0.32, -0.08);
    ctx.lineTo(0.3, -0.18);
    ctx.quadraticCurveTo(0, -0.11, -0.3, -0.18);
    ctx.closePath();
    fo(ctx, '#7a3aa8', 0.014);
    ctx.strokeStyle = '#ffd040';
    ctx.lineWidth = 0.025;
    ctx.strokeRect(-0.06, -0.16, 0.12, 0.09);
    ctx.restore();
    // orbiting wisps
    for (let i = 0; i < 5; i++) {
      const a = t * 0.8 + (i / 5) * TAU;
      const x = cx + Math.cos(a) * 1.25,
        y = cy - 0.5 + Math.sin(a) * 0.4 - Math.sin(t * 2 + i) * 0.1;
      ctx.fillStyle = rgba(i % 2 ? WITCH : '#ffd27a', 0.85);
      circle(ctx, x, y, 0.03);
      ctx.fill();
      addGlow(ctx, x, y, 0.15, i % 2 ? WITCH : '#ffb040', 0.45);
    }
  }
  ctx.drawImage(frontCanvas(ctx, L), cx - 1.6, cy - 0.6, 3.2, 1.8);
  front.forEach(([x, y], i) => candleStick(ctx, x, y, 0.16 + hash(i * 7 + 2) * 0.08, 0.05, t, i * 5 + 2, 0, '#efe6cf', hot, 0.7 + L * 0.1));
  // a few small grinning pumpkins with faces lit (dynamic glow)
  for (const i of [3, 5, 6].filter((k) => k < smallCount(L))) {
    const [x, y, rr] = SMALL[i];
    pumpkinFace(ctx, cx + x, cy + y, rr, 1, 0.6 * flicker(t, i), -x * 0.3, 0, hot);
  }
  if (hurt > 0) glow(ctx, cx, py, 1.4, '#ff2020', hurt * 0.35);
  ctx.restore();
}

// ------------------------------------------------------------------ open grave (rift)

function graveCanvas(c: C) {
  return cached('agrave', pxOf(c), -0.2, -0.45, 1.4, 1.6, (g) => {
    // churned earth
    const sg = g.createRadialGradient(0.5, 0.55, 0, 0.5, 0.55, 0.7);
    sg.addColorStop(0, 'rgba(40,28,24,0.75)');
    sg.addColorStop(1, 'rgba(40,28,24,0)');
    g.fillStyle = sg;
    g.fillRect(-0.2, -0.2, 1.4, 1.4);
    // dirt mound beside the hole
    ell(g, 0.84, 0.66, 0.15, 0.24, 0.15);
    fo(g, lgrad(g, 0.7, 0.3, 1.0, 0.9, [
      [0, '#5a4434'],
      [1, '#2a1e18'],
    ]), 0.018);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(30,20,14,0.8)';
      circle(g, 0.78 + hash(i) * 0.12, 0.45 + hash(i + 9) * 0.35, 0.015);
      g.fill();
    }
    // the hole
    g.beginPath();
    g.moveTo(0.3, 0.3);
    g.lineTo(0.66, 0.28);
    g.lineTo(0.7, 0.86);
    g.lineTo(0.32, 0.88);
    g.closePath();
    fo(g, lgrad(g, 0, 0.3, 0, 0.88, [
      [0, '#000000'],
      [0.6, '#0e0a10'],
      [1, '#2a1e1a'],
    ]), 0.022);
    // inner front wall (earth face)
    g.beginPath();
    g.moveTo(0.32, 0.88);
    g.lineTo(0.7, 0.86);
    g.lineTo(0.69, 0.78);
    g.lineTo(0.33, 0.8);
    g.closePath();
    g.fillStyle = '#3a2a22';
    g.fill();
    // a shovel stuck in the mound
    g.strokeStyle = '#6a4a2a';
    g.lineWidth = 0.025;
    line(g, 0.86, 0.55, 0.98, 0.15);
    g.fillStyle = '#5a5a68';
    g.beginPath();
    g.moveTo(0.84, 0.55);
    g.lineTo(0.9, 0.56);
    g.lineTo(0.88, 0.7);
    g.lineTo(0.81, 0.68);
    g.closePath();
    g.fill();
    g.strokeStyle = '#6a4a2a';
    g.lineWidth = 0.02;
    line(g, 0.95, 0.15, 1.02, 0.17);
    // cracked tombstone at the head of the grave
    const tx = 0.48,
      ty = 0.27;
    g.fillStyle = SHADOW;
    ell(g, tx + 0.05, ty + 0.01, 0.2, 0.05);
    g.fill();
    g.save();
    g.translate(tx, ty);
    g.rotate(-0.1);
    g.beginPath();
    g.moveTo(-0.16, 0);
    g.lineTo(-0.16, -0.36);
    g.arc(0, -0.36, 0.16, Math.PI, 0);
    g.lineTo(0.16, 0);
    g.closePath();
    fo(g, cyl(g, -0.16, 0.16, STONE_L, 0.2), 0.02);
    g.beginPath();
    g.moveTo(0.16, 0);
    g.lineTo(0.2, -0.02);
    g.lineTo(0.2, -0.36);
    g.arc(0.04, -0.37, 0.16, 0, -0.35, true);
    g.lineTo(0.16, -0.36);
    g.closePath();
    fo(g, STONE_D, 0.014);
    // engraved lines (a simple epitaph tablet)
    g.strokeStyle = 'rgba(20,20,40,0.6)';
    g.lineWidth = 0.014;
    line(g, -0.08, -0.38, 0.08, -0.38);
    line(g, -0.08, -0.3, 0.08, -0.3);
    line(g, -0.06, -0.22, 0.06, -0.22);
    // crack
    g.strokeStyle = 'rgba(10,8,20,0.95)';
    g.lineWidth = 0.016;
    g.beginPath();
    g.moveTo(-0.04, -0.52);
    g.lineTo(0.02, -0.42);
    g.lineTo(-0.02, -0.34);
    g.lineTo(0.05, -0.2);
    g.lineTo(0.02, -0.08);
    g.stroke();
    // moss
    g.fillStyle = 'rgba(80,120,60,0.7)';
    ell(g, -0.1, -0.03, 0.07, 0.03);
    g.fill();
    g.restore();
    void STONE;
  });
}

function drawGrave(ctx: C, x: number, y: number, t: number, state: 'open' | 'forming') {
  const cx = x + 0.5,
    cy = y + 0.5;
  ctx.save();
  if (state === 'forming') {
    // the earth cracks; a faint mist seeps out
    ctx.globalAlpha *= 0.5 + 0.3 * Math.abs(Math.sin(t * 2.7) * Math.sin(t * 1.3));
    ctx.fillStyle = 'rgba(40,28,24,0.55)';
    ell(ctx, cx, cy + 0.05, 0.42, 0.32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(14,8,10,0.9)';
    ctx.lineWidth = 0.025;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 0.05);
      ctx.lineTo(cx + Math.cos(a) * 0.18, cy + 0.05 + Math.sin(a) * 0.14);
      ctx.lineTo(cx + Math.cos(a + 0.35) * 0.38, cy + 0.05 + Math.sin(a + 0.35) * 0.28);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.3 + i / 3) % 1;
      ctx.fillStyle = rgba('#9affb0', 0.25 * Math.sin(p * Math.PI));
      circle(ctx, cx + Math.sin(t + i * 2) * 0.15, cy - p * 0.5, 0.06 + p * 0.08);
      ctx.fill();
    }
    addGlow(ctx, cx, cy, 0.5, '#7aff8a', 0.12);
    ctx.restore();
    return;
  }
  ctx.drawImage(graveCanvas(ctx), x - 0.2, y - 0.45, 1.4, 1.6);
  // eerie light from the depths
  const hg = ctx.createRadialGradient(cx, cy + 0.15, 0, cx, cy + 0.15, 0.35);
  hg.addColorStop(0, rgba('#8aff9a', 0.55 + 0.15 * Math.sin(t * 2.3)));
  hg.addColorStop(1, rgba('#8aff9a', 0));
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = hg;
  ctx.fillRect(cx - 0.35, cy - 0.2, 0.7, 0.7);
  ctx.globalCompositeOperation = 'source-over';
  // swirling ghostly mist rising up
  for (let i = 0; i < 8; i++) {
    const p = (t * 0.28 + i / 8) % 1;
    const a = t * 1.6 + i * 2.2;
    const r = 0.06 + p * 0.25;
    const mx = cx + Math.cos(a + p * 4) * r,
      my = cy + 0.25 - p * 1.0;
    glow(ctx, mx, my, 0.12 + p * 0.16, i % 3 ? '#9affc0' : '#c8ffe0', 0.4 * Math.sin(p * Math.PI));
  }
  // a faint curling wisp ribbon
  ctx.strokeStyle = rgba('#b8ffd0', 0.35);
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  for (let k = 0; k <= 16; k++) {
    const p = k / 16;
    const px = cx + Math.sin(t * 2 + p * 7) * 0.12 * p,
      py = cy + 0.2 - p * 0.85;
    k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  addGlow(ctx, cx, cy - 0.1, 0.8, '#6aff8a', 0.18 + 0.05 * Math.sin(t * 2));
  ctx.restore();
  void OUT;
  void PUMPKIN;
}

registerArt('autumn', {
  building: drawAutumnBuilding,
  iconTall: autumnIconTall,
  enemies: AUTUMN_ENEMIES,
  core: drawLantern,
  rift: drawGrave,
  ally: drawAutumnAlly,
});
