// Spring campaign art: a sunny cottage garden defended by living plants (structures), with the
// Heartseed core and burrow rifts in art-spring-core.ts and the garden pests in art-spring-enemies.ts.
// World ctx: 1 unit = 1 tile; structure tile (x,y) spans [x,x+1]×[y,y+1].
import type { Building, Game } from '../../game/game';
import {
  BARK,
  BARK_DARK,
  bed,
  BRASS,
  ballGrad,
  type C,
  circle,
  dropShadow,
  ell,
  flower,
  fo,
  hGrad,
  leaf,
  LEAF,
  LEAF_DARK,
  LEAF_LIGHT,
  OUT,
  PETAL,
  PETAL_WHITE,
  pips,
  POLLEN,
  POLLEN_LIGHT,
  SHADOW,
  SOIL,
  SOIL_DARK,
  stone,
  TAU,
  TERRA,
  wilt,
} from './art-spring-kit';
import { drawHeartseed, drawBurrow } from './art-spring-core';
import { SPRING_ENEMIES } from './art-spring-enemies';
import { registerArt } from './realm-art';
import { cached, glow, hash, mix, poly, pxOf, rgba, shade } from './util';

/** Static part of a structure, drawn in tile-local coords (tile = [0,1]²) and cached per zoom. */
function layer(c: C, key: string, x: number, y: number, draw: (g: C) => void) {
  c.drawImage(cached(key, pxOf(c), -0.3, -0.9, 1.6, 2.0, draw), x - 0.3, y - 0.9, 1.6, 2.0);
}

// ------------------------------------------------------------------ hedgerow (wall)

/** Fills and outlines a bumpy leafy blob made of a rect plus scalloped edges on the exposed sides. */
function leafyRect(g: C, x0: number, y0: number, x1: number, y1: number, open: [boolean, boolean, boolean, boolean], col: string, seed: number, bump = 0.07) {
  const [n, e, s, w] = open;
  const blobs: [number, number, number][] = [];
  const step = 0.11;
  const add = (x: number, y: number, i: number) => blobs.push([x, y, bump * (0.8 + hash(seed + i) * 0.45)]);
  let i = 0;
  if (n) for (let x = x0 + 0.06; x <= x1 - 0.05; x += step) add(x, y0 + 0.02, i++);
  if (s) for (let x = x0 + 0.06; x <= x1 - 0.05; x += step) add(x, y1 - 0.02, i++);
  if (w) for (let y = y0 + 0.06; y <= y1 - 0.05; y += step) add(x0 + 0.02, y, i++);
  if (e) for (let y = y0 + 0.06; y <= y1 - 0.05; y += step) add(x1 - 0.02, y, i++);
  const ix0 = x0 + (w ? 0.03 : 0),
    ix1 = x1 - (e ? 0.03 : 0),
    iy0 = y0 + (n ? 0.03 : 0),
    iy1 = y1 - (s ? 0.03 : 0);
  // outline pass
  g.strokeStyle = OUT;
  g.lineWidth = 0.035;
  g.beginPath();
  for (const [x, y, r] of blobs) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, TAU);
  }
  g.stroke();
  // the outline must not run across the connected edges: re-clip by filling body over it
  g.fillStyle = col;
  g.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
  g.beginPath();
  for (const [x, y, r] of blobs) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, TAU);
  }
  g.fill();
  // straight outline only on exposed edges is implicit through the blobs; nothing on connected sides
}

function hedgeCanvas(c: C, mask: number, L: number, hurt: boolean) {
  return cached(`sp-hedge|${mask}|${L}|${hurt ? 1 : 0}`, pxOf(c), -0.1, -0.5, 1.2, 1.62, (g) => {
    const N = !!(mask & 1),
      E = !!(mask & 2),
      S = !!(mask & 4),
      W = !!(mask & 8);
    const h = 0.3 + L * 0.05,
      ins = 0.1 - L * 0.02;
    const x0 = W ? 0 : ins,
      x1 = E ? 1 : 1 - ins;
    const fy0 = N ? 0 : ins + 0.04,
      fy1 = S ? 1 : 1 - ins;
    const y0 = fy0 - h,
      y1 = fy1 - h;
    const seed = mask * 37 + L * 5;
    // shadow on the lawn
    g.fillStyle = SHADOW;
    g.fillRect(x0 + 0.06, fy0 + 0.02, x1 - x0, fy1 - fy0 + 0.07);
    // front face (darker foliage), with twiggy base
    if (!S) {
      leafyRect(g, x0, y1 - 0.05, x1, fy1, [false, !E, true, !W], LEAF_DARK, seed + 100, 0.06);
      const fg = g.createLinearGradient(0, y1, 0, fy1);
      fg.addColorStop(0, rgba('#3f7f34', 0.9));
      fg.addColorStop(1, rgba('#1f4a1e', 0.9));
      g.fillStyle = fg;
      g.fillRect(x0 + (W ? 0 : 0.03), y1, x1 - x0 - (W ? 0 : 0.03) - (E ? 0 : 0.03), fy1 - y1 - 0.04);
      // twigs peeking at the bottom
      g.strokeStyle = BARK_DARK;
      g.lineWidth = 0.02;
      g.beginPath();
      for (let x = x0 + 0.14; x < x1 - 0.08; x += 0.22) {
        g.moveTo(x, fy1 - 0.01);
        g.lineTo(x + 0.02, fy1 - 0.09);
      }
      g.stroke();
      // leaf texture
      for (let k = 0; k < 14; k++) {
        const x = x0 + 0.04 + hash(seed + k * 3) * (x1 - x0 - 0.08),
          y = y1 + 0.04 + hash(seed + k * 3 + 1) * (fy1 - y1 - 0.12);
        g.fillStyle = k % 2 ? rgba('#4f9a3c', 0.8) : rgba('#2a5a24', 0.8);
        ell(g, x, y, 0.04, 0.025, hash(seed + k) * 3);
        g.fill();
      }
      // thorns
      g.fillStyle = '#e8e0c0';
      for (let k = 0; k < 6 + L * 2; k++) {
        const x = x0 + 0.06 + hash(seed + k * 11 + 7) * (x1 - x0 - 0.12),
          y = y1 + 0.06 + hash(seed + k * 11 + 8) * (fy1 - y1 - 0.14);
        const s = k % 2 ? 1 : -1;
        poly(g, [
          [x - 0.012, y],
          [x + s * 0.03, y - 0.012],
          [x - 0.012, y - 0.022],
        ]);
        g.fill();
      }
    }
    // top face
    leafyRect(g, x0, y0, x1, y1, [!N, !E, !S, !W], L >= 2 ? '#5fae4a' : '#58a444', seed);
    const tg = g.createLinearGradient(x0, y0, x1, y1);
    tg.addColorStop(0, rgba('#b6e07a', 0.35));
    tg.addColorStop(1, rgba('#2a6a2a', 0.25));
    g.fillStyle = tg;
    g.fillRect(x0 + (W ? 0 : 0.03), y0 + (N ? 0 : 0.03), x1 - x0 - (W ? 0 : 0.03) - (E ? 0 : 0.03), y1 - y0 - (N ? 0 : 0.03) - (S ? 0 : 0.03));
    // leaf clumps on top
    for (let k = 0; k < 16; k++) {
      const x = x0 + 0.06 + hash(seed + k * 5 + 2) * (x1 - x0 - 0.12),
        y = y0 + 0.06 + hash(seed + k * 5 + 3) * (y1 - y0 - 0.12);
      g.fillStyle = k % 3 === 0 ? rgba('#2e6a2a', 0.55) : rgba('#a4d86a', 0.75);
      ell(g, x, y, 0.045, 0.03, hash(seed + k * 9) * 3);
      g.fill();
    }
    // blossoms with level
    if (L >= 1) {
      const nf = L === 1 ? 4 : 9;
      for (let k = 0; k < nf; k++) {
        const x = x0 + 0.08 + hash(seed + k * 17 + 4) * (x1 - x0 - 0.16),
          y = y0 + 0.06 + hash(seed + k * 17 + 5) * (fy1 - y0 - 0.14);
        flower(g, x, y, L >= 2 ? 0.05 : 0.04, L >= 2 && k % 3 === 0 ? PETAL : PETAL_WHITE, POLLEN, k);
      }
    }
    if (hurt) {
      // bare brown patches
      for (let k = 0; k < 4; k++) {
        const x = x0 + 0.12 + hash(seed + k * 23) * (x1 - x0 - 0.24),
          y = y0 + 0.1 + hash(seed + k * 23 + 1) * (fy1 - y0 - 0.2);
        g.fillStyle = rgba('#8a6a34', 0.8);
        ell(g, x, y, 0.07, 0.045, k);
        g.fill();
        g.strokeStyle = BARK_DARK;
        g.lineWidth = 0.012;
        g.beginPath();
        g.moveTo(x - 0.04, y + 0.02);
        g.lineTo(x + 0.03, y - 0.02);
        g.stroke();
      }
    }
  });
}

function hedge(c: C, b: Building, game: Game, t: number) {
  const at = typeof game?.buildingAtTile === 'function' ? (x: number, y: number) => game.buildingAtTile(x, y) : () => undefined;
  const nb = (dx: number, dy: number) => at(b.x + dx, b.y + dy)?.def.id === 'hedge';
  const mask = (nb(0, -1) ? 1 : 0) | (nb(1, 0) ? 2 : 0) | (nb(0, 1) ? 4 : 0) | (nb(-1, 0) ? 8 : 0);
  c.drawImage(hedgeCanvas(c, mask, b.level, b.hp < b.maxHp * 0.5), b.x - 0.1, b.y - 0.5, 1.2, 1.62);
  if (b.level >= 2) glow(c, b.x + 0.5, b.y + 0.2, 0.5, '#fff0f4', 0.1 + 0.04 * Math.sin(t * 2 + b.x * 1.3));
}

// ------------------------------------------------------------------ seed spitter (pea-pod turret)

function seedBase(c: C, L: number) {
  const cx = 0.5,
    fy = 0.62;
  // base leaves
  for (const [a, len] of [
    [Math.PI + 0.35, 0.3],
    [-0.35, 0.3],
    [Math.PI - 0.1, 0.22],
    [0.1, 0.22],
  ] as const) leaf(c, cx, fy - 0.02, a, len + L * 0.03, 0.08, LEAF, 0.014);
  // side pods (higher levels)
  if (L >= 1) {
    for (const s of [-1, 1]) {
      const px = cx + s * 0.2,
        py = fy - 0.16;
      c.strokeStyle = '#4a8a32';
      c.lineWidth = 0.02;
      c.beginPath();
      c.moveTo(cx, fy - 0.08);
      c.lineTo(px, py - 0.04);
      c.stroke();
      ell(c, px, py, 0.05, 0.1, s * 0.5);
      fo(c, ballGrad(c, px, py, 0.08, '#8acb4e'), 0.012);
      c.strokeStyle = rgba('#2e5a1e', 0.6);
      c.lineWidth = 0.008;
      c.beginPath();
      c.moveTo(px - s * 0.01, py - 0.08);
      c.quadraticCurveTo(px + s * 0.03, py, px - s * 0.01, py + 0.08);
      c.stroke();
    }
  }
}

function seedspitter(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const fy = cy + 0.12;
  const dx = Math.cos(b.angle),
    dy = Math.sin(b.angle) * 0.7;
  const rec = b.recoil;
  const sway = Math.sin(t * 1.8 + b.uid) * 0.015;
  const hx = cx + sway - dx * rec * 0.06,
    hy = cy - 0.3 - L * 0.04 - dy * rec * 0.04;
  // stem
  c.strokeStyle = OUT;
  c.lineWidth = 0.075;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx, fy);
  c.quadraticCurveTo(cx - 0.06, (fy + hy) / 2, hx, hy);
  c.stroke();
  c.strokeStyle = '#5ea83e';
  c.lineWidth = 0.045;
  c.stroke();
  layer(c, `sp-ss|${L}`, b.x, b.y, (g) => seedBase(g, L));
  // head: a fat pod with a nozzle aimed at the target
  const R = 0.15 + L * 0.02;
  const nozzle = () => {
    const nl = 0.17 + L * 0.02 - rec * 0.05;
    const nx = hx + dx * nl,
      ny = hy + dy * nl;
    c.strokeStyle = OUT;
    c.lineWidth = 0.11 + L * 0.01;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(nx, ny);
    c.stroke();
    c.strokeStyle = '#7cc04a';
    c.lineWidth = 0.08 + L * 0.01;
    c.stroke();
    ell(c, nx, ny, 0.05 + L * 0.006 + rec * 0.012, 0.045 + L * 0.006, b.angle);
    fo(c, '#7cc04a', 0.016);
    ell(c, nx + dx * 0.005, ny + dy * 0.005, 0.03 + rec * 0.01, 0.026, b.angle);
    c.fillStyle = '#1e3a12';
    c.fill();
  };
  if (dy < 0) nozzle();
  circle(c, hx, hy, R * (1 + rec * 0.08));
  fo(c, ballGrad(c, hx, hy, R, L >= 2 ? '#8ccf4a' : '#7cc04a'), 0.02);
  // pod seam & spots
  c.strokeStyle = rgba('#2e5a1e', 0.55);
  c.lineWidth = 0.012;
  c.beginPath();
  c.arc(hx, hy, R * 0.75, Math.PI * 0.9, Math.PI * 1.6);
  c.stroke();
  c.fillStyle = rgba('#d8f0a0', 0.8);
  ell(c, hx - R * 0.35, hy - R * 0.45, R * 0.28, R * 0.16, -0.5);
  c.fill();
  // leafy collar behind the head
  if (L >= 1) {
    for (const s of [-1, 1]) leaf(c, hx + s * R * 0.7, hy + R * 0.3, Math.PI / 2 + s * 1.1, 0.13, 0.04, LEAF_DARK, 0.01, false);
  }
  if (dy >= 0) nozzle();
  // a little flower crown at the top level
  if (L >= 2) {
    flower(c, hx - R * 0.15, hy - R * 0.95, 0.06, PETAL, POLLEN, t * 0.3);
    leaf(c, hx + R * 0.1, hy - R * 0.85, -0.6, 0.1, 0.03, LEAF, 0.008, false);
  }
}

// ------------------------------------------------------------------ thistle patch (trap)

function thistleCanvas(c: C, L: number) {
  return cached(`sp-thistle|${L}`, pxOf(c), 0, 0, 1, 1, (g) => {
    // trampled dirt patch
    g.fillStyle = rgba(SOIL, 0.55);
    ell(g, 0.5, 0.55, 0.42, 0.34);
    g.fill();
    // spiny rosettes
    const rosette = (x: number, y: number, r: number, seed: number) => {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + hash(seed) * 2;
        const len = r * (0.8 + hash(seed + i) * 0.4);
        const tx = x + Math.cos(a) * len,
          ty = y + Math.sin(a) * len * 0.7;
        // jagged leaf: zig-zag edges
        g.beginPath();
        g.moveTo(x, y);
        const nx = -Math.sin(a),
          ny = Math.cos(a) * 0.7;
        for (let k = 1; k <= 3; k++) {
          const q = k / 4;
          const w = (k % 2 ? 0.35 : 0.2) * r * (1 - q * 0.6);
          g.lineTo(x + (tx - x) * q + nx * w, y + (ty - y) * q + ny * w);
        }
        g.lineTo(tx, ty);
        for (let k = 3; k >= 1; k--) {
          const q = k / 4;
          const w = (k % 2 ? 0.35 : 0.2) * r * (1 - q * 0.6);
          g.lineTo(x + (tx - x) * q - nx * w, y + (ty - y) * q - ny * w);
        }
        g.closePath();
        fo(g, i % 2 ? '#6a9a5a' : '#7aaa66', 0.01, 'rgba(30,40,20,0.85)');
        g.strokeStyle = 'rgba(230,240,210,0.6)';
        g.lineWidth = 0.006;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(tx, ty);
        g.stroke();
      }
    };
    const heads: [number, number][] = [
      [0.32, 0.42],
      [0.66, 0.36],
      [0.5, 0.66],
      [0.26, 0.7],
      [0.74, 0.68],
    ];
    const nh = 3 + L;
    for (let i = 0; i < nh; i++) rosette(heads[i][0], heads[i][1] + 0.04, 0.17 + L * 0.015, i * 19 + L);
    // flowering heads: spiky green bulb topped with a purple tuft
    for (let i = 0; i < nh; i++) {
      const [x, y] = heads[i];
      const r = 0.055 + L * 0.008;
      g.strokeStyle = '#4a6a3a';
      g.lineWidth = 0.02;
      g.beginPath();
      g.moveTo(x, y + 0.04);
      g.lineTo(x, y - 0.03);
      g.stroke();
      // bulb
      circle(g, x, y - 0.03, r);
      fo(g, ballGrad(g, x, y - 0.03, r, '#6a9a50'), 0.012, 'rgba(30,40,20,0.9)');
      // spines
      g.strokeStyle = '#e8ecd0';
      g.lineWidth = 0.007;
      g.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        g.moveTo(x + Math.cos(a) * r, y - 0.03 + Math.sin(a) * r);
        g.lineTo(x + Math.cos(a) * r * 1.6, y - 0.03 + Math.sin(a) * r * 1.6);
      }
      g.stroke();
      // purple tuft
      g.lineCap = 'round';
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k / 6 - 0.5) * 1.6;
        g.strokeStyle = k % 2 ? '#c88ae8' : '#9a4ac8';
        g.lineWidth = 0.022;
        g.beginPath();
        g.moveTo(x, y - 0.03 - r * 0.6);
        g.lineTo(x + Math.cos(a) * r * 1.5, y - 0.03 - r * 0.6 + Math.sin(a) * r * 1.4);
        g.stroke();
      }
    }
  });
}

function thistle(c: C, b: Building, t: number) {
  const f = Math.min(1, b.firing / 0.15);
  const cx = b.x + 0.5,
    cy = b.y + 0.55;
  c.save();
  c.translate(cx, cy);
  const k = 1 + f * 0.07 + Math.sin(t * 40) * f * 0.02;
  c.scale(k, 2 - k);
  c.drawImage(thistleCanvas(c, b.level), -0.5, -0.55, 1, 1);
  c.restore();
  if (f > 0) {
    // spines flicking out
    c.strokeStyle = rgba('#f4f0d8', f);
    c.lineWidth = 0.014;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + b.uid;
      const r0 = 0.25,
        r1 = 0.32 + (1 - f) * 0.15;
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7);
    }
    c.stroke();
  }
}

// ------------------------------------------------------------------ beehive (skep)

function skepCanvas(c: C, L: number) {
  return cached(`sp-skep|${L}`, pxOf(c), -0.1, -0.6, 1.2, 1.7, (g) => {
    const cx = 0.5,
      base = 0.72;
    dropShadow(g, cx + 0.06, base + 0.12, 0.36, 0.13);
    // wooden stand: a little stool
    g.strokeStyle = OUT;
    g.lineWidth = 0.05;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - 0.22, base + 0.02);
    g.lineTo(cx - 0.26, base + 0.16);
    g.moveTo(cx + 0.22, base + 0.02);
    g.lineTo(cx + 0.26, base + 0.16);
    g.moveTo(cx, base + 0.04);
    g.lineTo(cx, base + 0.18);
    g.stroke();
    g.strokeStyle = BARK;
    g.lineWidth = 0.03;
    g.stroke();
    ell(g, cx, base, 0.32, 0.08);
    fo(g, hGrad(g, cx - 0.32, cx + 0.32, '#9a7046'), 0.016);
    ell(g, cx, base - 0.015, 0.3, 0.065);
    g.fillStyle = shade('#a87a4e', 0.15);
    g.fill();
    // straw skep: stacked coils
    const H = 0.62 + L * 0.1,
      W = 0.27 + L * 0.03;
    const top = base - H;
    const prof = (q: number) => W * Math.sqrt(Math.max(0, 1 - Math.pow(1 - q, 2.2))); // q: 0 top..1 bottom
    const rings = 6 + L * 2;
    g.lineCap = 'butt';
    // body silhouette
    g.beginPath();
    g.moveTo(cx - prof(1), base - 0.01);
    for (let i = 0; i <= 24; i++) {
      const q = 1 - i / 24;
      g.lineTo(cx - prof(q) * (q < 0.02 ? 0.2 : 1), top + H * q);
    }
    for (let i = 0; i <= 24; i++) {
      const q = i / 24;
      g.lineTo(cx + prof(q) * (q < 0.02 ? 0.2 : 1), top + H * q);
    }
    g.closePath();
    const sg = g.createLinearGradient(cx - W, top, cx + W, base);
    sg.addColorStop(0, '#f6d27a');
    sg.addColorStop(0.5, '#d9a64a');
    sg.addColorStop(1, '#94642a');
    fo(g, sg, 0.022);
    // coil bands
    for (let r = 1; r < rings; r++) {
      const q = r / rings;
      const y = top + H * q;
      const w = prof(q);
      g.strokeStyle = 'rgba(110,70,20,0.7)';
      g.lineWidth = 0.014;
      g.beginPath();
      g.ellipse(cx, y, w, 0.03 + q * 0.03, 0, 0.05, Math.PI - 0.05);
      g.stroke();
      g.strokeStyle = 'rgba(255,240,180,0.55)';
      g.lineWidth = 0.008;
      g.beginPath();
      g.ellipse(cx, y - 0.018, w * 0.95, 0.03 + q * 0.03, 0, 0.3, Math.PI * 0.7);
      g.stroke();
    }
    // straw stitching ticks
    g.strokeStyle = 'rgba(120,80,30,0.45)';
    g.lineWidth = 0.007;
    g.beginPath();
    for (let r = 1; r < rings; r++) {
      const q = (r + 0.5) / rings;
      const y = top + H * q;
      const w = prof(q);
      for (let k = -2; k <= 2; k++) {
        const x = cx + (k / 2.6) * w + (r % 2) * 0.03;
        g.moveTo(x, y - 0.025);
        g.lineTo(x + 0.01, y + 0.02);
      }
    }
    g.stroke();
    // little knob on top
    circle(g, cx, top + 0.01, 0.035);
    fo(g, '#e8b85a', 0.012);
    // entrance
    ell(g, cx, base - 0.07, 0.07, 0.045);
    g.fillStyle = '#2a1608';
    g.fill();
    g.strokeStyle = 'rgba(90,50,10,0.9)';
    g.lineWidth = 0.012;
    g.stroke();
    // honey drips
    if (L >= 1) {
      g.fillStyle = '#ffb820';
      g.strokeStyle = 'rgba(140,80,0,0.8)';
      g.lineWidth = 0.008;
      for (const [x, d] of [
        [-0.05, 0.05],
        [0.06, 0.08],
      ] as const) {
        g.beginPath();
        g.moveTo(cx + x - 0.02, base - 0.03);
        g.lineTo(cx + x - 0.012, base - 0.03 + d);
        g.arc(cx + x, base - 0.03 + d, 0.014, Math.PI, 0, true);
        g.lineTo(cx + x + 0.02, base - 0.03);
        g.closePath();
        g.fill();
        g.stroke();
      }
    }
    // flowers growing at the foot of the stand
    if (L >= 1) {
      for (let i = 0; i < 2 + L * 2; i++) {
        const x = cx - 0.36 + hash(i * 7 + 2) * 0.72,
          y = base + 0.12 + hash(i * 5) * 0.06;
        g.strokeStyle = '#4a8a32';
        g.lineWidth = 0.012;
        g.beginPath();
        g.moveTo(x, y + 0.04);
        g.lineTo(x, y);
        g.stroke();
        flower(g, x, y, 0.04, i % 2 ? '#ffe060' : L >= 2 ? PETAL : PETAL_WHITE, i % 2 ? '#c86a20' : POLLEN, i);
      }
    }
    // a wooden roof board at the top level
    if (L >= 2) {
      g.beginPath();
      g.moveTo(cx - 0.36, top + 0.13);
      g.lineTo(cx, top - 0.06);
      g.lineTo(cx + 0.36, top + 0.13);
      g.lineTo(cx + 0.33, top + 0.17);
      g.lineTo(cx, top - 0.01);
      g.lineTo(cx - 0.33, top + 0.17);
      g.closePath();
      fo(g, hGrad(g, cx - 0.36, cx + 0.36, TERRA), 0.016);
    }
  });
}

function beehive(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(skepCanvas(c, L), b.x - 0.1, b.y - 0.6, 1.2, 1.7);
  if (L >= 2) glow(c, cx, cy + 0.05, 0.6, POLLEN, 0.12 + 0.04 * Math.sin(t * 2.5 + b.uid));
  const n = 4 + L * 2;
  const hy = cy - 0.15 - L * 0.05;
  const angry = b.targetUid !== 0;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const ph = hash(b.uid * 17 + i) * TAU;
    const sp = 1.6 + hash(i * 7 + 1) * 1.2;
    const a = t * sp * (i % 2 ? 1 : -1) + ph;
    let rx = 0.36 + hash(i * 3) * 0.12,
      ry = 0.18 + hash(i * 5) * 0.1;
    let ox = 0,
      oy = 0;
    if (angry && i < 3) {
      // darting out at the intruder and back
      const d = 0.25 + 0.35 * Math.abs(Math.sin(t * 5 + ph));
      ox = Math.cos(ph) * d;
      oy = Math.sin(ph) * d * 0.6;
      rx *= 0.3;
      ry *= 0.3;
    }
    const x = cx + Math.cos(a) * rx + ox,
      y = hy + Math.sin(a) * ry + Math.sin(t * 9 + ph) * 0.03 + oy;
    pts.push(x, y);
  }
  // bees, batched: wings, bodies, then stripes
  const flap = 0.3 + Math.abs(Math.sin(t * 40)) * 0.4;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath();
  for (let k = 0; k < pts.length; k += 2) {
    c.moveTo(pts[k] + 0.022, pts[k + 1] - 0.022);
    c.ellipse(pts[k], pts[k + 1] - 0.022, 0.022, 0.025 * flap, 0, 0, TAU);
  }
  c.fill();
  c.beginPath();
  for (let k = 0; k < pts.length; k += 2) {
    c.moveTo(pts[k] + 0.031, pts[k + 1]);
    c.ellipse(pts[k], pts[k + 1], 0.031, 0.021, 0, 0, TAU);
  }
  c.fillStyle = '#ffcc20';
  c.fill();
  c.strokeStyle = '#2a1a08';
  c.lineWidth = 0.008;
  c.stroke();
  c.beginPath();
  for (let k = 0; k < pts.length; k += 2) {
    c.moveTo(pts[k] + 0.004, pts[k + 1] - 0.019);
    c.lineTo(pts[k] + 0.004, pts[k + 1] + 0.019);
  }
  c.stroke();
}

// ------------------------------------------------------------------ sprinkler

function sprinklerBase(c: C, L: number) {
  return cached(`sp-sprk|${L}`, pxOf(c), -0.1, -0.1, 1.2, 1.2, (g) => {
    const cx = 0.5,
      cy = 0.62;
    // wet patch & paving stone
    const wg = g.createRadialGradient(cx, cy, 0.05, cx, cy, 0.48);
    wg.addColorStop(0, 'rgba(70,110,140,0.35)');
    wg.addColorStop(1, 'rgba(70,110,140,0)');
    g.fillStyle = wg;
    g.fillRect(cx - 0.5, cy - 0.5, 1, 1);
    stone(g, cx, cy, 0.3, 0.18, 3, L >= 1, '#b8b2a0');
    // puddle sheen
    ell(g, cx + 0.12, cy + 0.03, 0.12, 0.05, 0.1);
    g.fillStyle = 'rgba(150,210,255,0.55)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 0.008;
    g.beginPath();
    g.ellipse(cx + 0.1, cy + 0.02, 0.07, 0.025, 0.1, Math.PI, TAU);
    g.stroke();
    // a garden hose coiled beside it
    if (L >= 1) {
      g.strokeStyle = '#1e5a2a';
      g.lineWidth = 0.05;
      for (let i = 0; i < 2; i++) {
        ell(g, cx - 0.26, cy + 0.12, 0.13 - i * 0.04, 0.06 - i * 0.02);
        g.stroke();
      }
      g.strokeStyle = '#3a9a4a';
      g.lineWidth = 0.025;
      for (let i = 0; i < 2; i++) {
        ell(g, cx - 0.26, cy + 0.12, 0.13 - i * 0.04, 0.06 - i * 0.02);
        g.stroke();
      }
      g.strokeStyle = '#2a7a3a';
      g.lineWidth = 0.03;
      g.beginPath();
      g.moveTo(cx - 0.14, cy + 0.12);
      g.quadraticCurveTo(cx - 0.04, cy + 0.12, cx - 0.02, cy + 0.02);
      g.stroke();
    }
    // brass post
    const top = cy - 0.42 - L * 0.06;
    g.beginPath();
    g.rect(cx - 0.035, top, 0.07, cy - top);
    fo(g, hGrad(g, cx - 0.035, cx + 0.035, BRASS, 0.4, -0.35), 0.014);
    ell(g, cx, cy, 0.07, 0.03);
    fo(g, hGrad(g, cx - 0.07, cx + 0.07, BRASS, 0.3, -0.35), 0.012);
    // valve wheel
    ell(g, cx, cy - 0.13, 0.06, 0.025);
    g.strokeStyle = '#c03a2a';
    g.lineWidth = 0.02;
    g.stroke();
    // little leaves of ivy climbing the post at the top level
    if (L >= 2) {
      for (let i = 0; i < 4; i++) leaf(g, cx + (i % 2 ? 0.03 : -0.03), cy - 0.05 - i * 0.08, i % 2 ? -0.3 : Math.PI + 0.3, 0.07, 0.025, LEAF, 0.008, false);
    }
  });
}

function sprinkler(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  c.drawImage(sprinklerBase(c, L), b.x - 0.1, b.y - 0.1, 1.2, 1.2);
  const px = cx,
    py = cy + 0.12 - 0.42 - L * 0.06;
  const arms = L + 1;
  const len = 0.15 + L * 0.02;
  const armTip = (k: number) => {
    const a = b.spin + (k / arms) * TAU;
    return { a, x: px + Math.cos(a) * len, y: py + Math.sin(a) * len * 0.5 };
  };
  // spray behind first (arcs pointing up/back), then arm, then front spray
  const spray = (k: number, front: boolean) => {
    const { a, x, y } = armTip(k);
    if (Math.sin(a) >= 0 !== front) return;
    const dx = Math.cos(a),
      dy = Math.sin(a) * 0.5;
    const reach = 0.55 + L * 0.08;
    // misty fan
    c.strokeStyle = 'rgba(200,235,255,0.25)';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + dx * reach * 0.5, y + dy * reach * 0.5 - 0.22, x + dx * reach, y + dy * reach + 0.1);
    c.stroke();
    // droplets travelling along the arc (one batched path)
    c.fillStyle = 'rgba(215,240,255,0.85)';
    c.beginPath();
    for (let i = 0; i < 9; i++) {
      const q = (t * 1.6 + i / 9 + k * 0.13) % 1;
      const sx = (hash(i * 13 + k) - 0.5) * 0.08;
      const qx = x + dx * reach * q + -dy * sx,
        qy = y + dy * reach * q - 4 * 0.2 * q * (1 - q) + q * q * 0.1 + dx * sx * 0.5;
      const r = 0.012 + 0.006 * (1 - q);
      c.moveTo(qx + r, qy);
      c.arc(qx, qy, r, 0, TAU);
    }
    c.fill();
  };
  for (let k = 0; k < arms; k++) spray(k, false);
  // rotating head and arms
  for (let k = 0; k < arms; k++) {
    const { x, y } = armTip(k);
    c.strokeStyle = OUT;
    c.lineWidth = 0.04;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(x, y);
    c.stroke();
    c.strokeStyle = shade(BRASS, 0.2);
    c.lineWidth = 0.022;
    c.stroke();
    circle(c, x, y, 0.022);
    fo(c, '#e8c060', 0.01);
  }
  ell(c, px, py, 0.055, 0.035);
  fo(c, ballGrad(c, px, py, 0.05, BRASS), 0.014);
  for (let k = 0; k < arms; k++) spray(k, true);
}

// ------------------------------------------------------------------ snapjaw (venus flytrap)

/** One flytrap head facing +x from a hinge at (0,0); `gape` radians open; `bulge` when chewing. */
function trapHead(c: C, len: number, w: number, gape: number, bulge: number, t: number, L: number) {
  const inner = '#e0505a';
  for (const s of [-1, 1]) {
    c.save();
    c.rotate(s * gape * 0.5);
    const ww = w * (1 + bulge * (0.25 + 0.06 * Math.sin(t * 9 + s)));
    // lobe: half-ellipse on the outside of the lip line
    c.beginPath();
    c.moveTo(0, 0);
    c.ellipse(len / 2, 0, len / 2, ww, 0, Math.PI, s < 0 ? TAU : 0, s > 0);
    c.closePath();
    const g = c.createLinearGradient(0, -s * ww, 0, 0);
    g.addColorStop(0, '#5ea83e');
    g.addColorStop(0.65, '#8acb4e');
    g.addColorStop(1, '#c8d860');
    fo(c, g, 0.016);
    // red inner face showing when open
    if (gape > 0.15) {
      c.beginPath();
      c.ellipse(len / 2, 0, len * 0.46, ww * 0.42 * Math.min(1, gape), 0, s < 0 ? 0 : Math.PI, s < 0 ? Math.PI : TAU);
      c.fillStyle = inner;
      c.fill();
      c.fillStyle = rgba('#ff9aa0', 0.6);
      for (let k = 0; k < 4; k++) {
        circle(c, len * (0.25 + k * 0.15), s * ww * 0.15, 0.008);
        c.fill();
      }
    }
    // rim cilia
    c.strokeStyle = L >= 2 ? '#f0e0a0' : '#d8e8a0';
    c.lineWidth = 0.008;
    c.beginPath();
    const n = 7;
    for (let k = 1; k < n; k++) {
      const x = (k / n) * len;
      c.moveTo(x, 0);
      c.lineTo(x + len * 0.03, s * (0.045 + 0.01 * (k % 2)));
    }
    c.stroke();
    c.restore();
  }
}

function snapBase(c: C, L: number, face: number) {
  const cx = 0.5,
    fy = 0.64;
  // rosette of little closed traps at the base
  for (let i = 0; i < 5 + L; i++) {
    const a = Math.PI + (i / (4 + L)) * Math.PI;
    leaf(c, cx, fy, a + 0.0, 0.2 + (i % 2) * 0.05, 0.05, i % 2 ? '#6ab040' : '#7cc04a', 0.012);
  }
  // secondary heads (decoration) at higher levels
  const small = (sx: number, sy: number, sf: number, ph: number) => {
    c.strokeStyle = '#4a8a32';
    c.lineWidth = 0.025;
    c.beginPath();
    c.moveTo(cx, fy);
    c.quadraticCurveTo(sx, fy, sx, sy);
    c.stroke();
    c.save();
    c.translate(sx, sy);
    c.scale(sf, 1);
    c.rotate(-0.5);
    trapHead(c, 0.16, 0.045, 0.5 + 0.15 * Math.sin(ph), 0, 0, L);
    c.restore();
  };
  if (L >= 1) small(cx - face * 0.26, fy - 0.2, -face, 1);
  if (L >= 2) small(cx + face * 0.24, fy - 0.12, face, 2.5);
}

function snapper(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const fy = cy + 0.14;
  const rate = b.def.levels[L].rate ?? 0.6;
  const chewing = b.cd > 1 / rate + 0.05;
  const f = Math.min(1, b.firing / 0.4);
  const face = Math.cos(b.angle) >= 0 ? 1 : -1;
  const tilt = Math.max(-0.6, Math.min(0.6, Math.sin(b.angle) * 0.6));
  layer(c, `sp-snap|${L}|${face}`, b.x, b.y, (g) => snapBase(g, L, face));
  // main stalk & head
  const lunge = f * (1 - f) * 4 * 0.12;
  const hx = cx + face * (0.02 + lunge),
    hy = cy - 0.26 - L * 0.04 + Math.sin(b.angle) * lunge * 0.6 + (chewing ? Math.sin(t * 7) * 0.01 : 0);
  c.strokeStyle = OUT;
  c.lineWidth = 0.08;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx, fy);
  c.bezierCurveTo(cx - face * 0.12, fy - 0.12, hx - face * 0.14, hy + 0.14, hx - face * 0.06, hy + 0.02);
  c.stroke();
  c.strokeStyle = '#5ea83e';
  c.lineWidth = 0.05;
  c.stroke();
  let gape: number;
  if (chewing) gape = 0.03;
  else if (f > 0.55) gape = 0.03; // snapped shut on the target
  else gape = (0.95 - f * 1.2) * (1 + 0.08 * Math.sin(t * 2 + b.uid));
  gape = Math.max(0.03, gape);
  c.save();
  c.translate(hx - face * 0.08, hy);
  c.scale(face, 1);
  c.rotate(tilt * face);
  trapHead(c, 0.34 + L * 0.04, 0.1 + L * 0.01, gape, chewing ? 1 : 0, t, L);
  c.restore();
  if (chewing) {
    // munch crumbs
    for (let i = 0; i < 2; i++) {
      const q = (t * 1.5 + i * 0.5) % 1;
      c.fillStyle = rgba('#c8b080', 1 - q);
      circle(c, hx + face * (0.2 + q * 0.05), hy + q * 0.15, 0.012);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ pollen puffer

function puffHead(c: C, x: number, y: number, R: number, t: number, L: number, ph: number) {
  // ragged petal fringe (two layers), then a fuzzy golden dome
  for (const [rr, col, n] of [
    [1.0, '#f0b020', 16],
    [0.82, '#ffd23a', 13],
  ] as const) {
    c.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * TAU + ph;
      const r = R * rr * (i % 2 ? 0.78 : 1.0);
      const px = x + Math.cos(a) * r,
        py = y + Math.sin(a) * r * 0.92;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
    fo(c, col, 0.014, 'rgba(120,70,0,0.85)');
  }
  circle(c, x, y, R * 0.55);
  fo(c, ballGrad(c, x, y, R * 0.55, '#ffe066', 0.5, -0.25), 0.012, 'rgba(140,90,0,0.8)');
  // fuzz dots
  c.fillStyle = rgba('#fff6c0', 0.9);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + ph;
    circle(c, x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, R * 0.06);
    c.fill();
  }
  if (L >= 2) {
    // a halo of white dandelion clocks around the top head
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 0.006;
    c.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + t * 0.1;
      c.moveTo(x + Math.cos(a) * R * 1.05, y + Math.sin(a) * R * 1.0);
      c.lineTo(x + Math.cos(a) * R * 1.3, y + Math.sin(a) * R * 1.25);
    }
    c.stroke();
  }
}

function puffLeaves(c: C) {
  const cx = 0.5,
    fy = 0.64;
  // dandelion leaves (toothed)
  for (const [a, len] of [
    [Math.PI + 0.25, 0.32],
    [-0.25, 0.32],
    [Math.PI - 0.2, 0.25],
    [0.2, 0.25],
  ] as const) {
    const ex = cx + Math.cos(a) * len,
      ey = fy + Math.sin(a) * len * 0.5;
    c.beginPath();
    c.moveTo(cx, fy);
    for (let k = 1; k <= 4; k++) {
      const q = k / 4;
      c.lineTo(cx + (ex - cx) * q, fy + (ey - fy) * q - (k % 2 ? 0.05 : 0.02) * (1 - q * 0.5));
    }
    c.lineTo(ex, ey);
    c.quadraticCurveTo((cx + ex) / 2, fy + 0.04, cx, fy);
    c.closePath();
    fo(c, '#5ea83e', 0.012);
  }
}

function puffBuds(c: C) {
  const cx = 0.5,
    fy = 0.64;
  const stem = (x: number, y: number) => {
    c.strokeStyle = OUT;
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(cx, fy);
    c.quadraticCurveTo(cx, (fy + y) / 2, x, y);
    c.stroke();
    c.strokeStyle = '#6ab040';
    c.lineWidth = 0.028;
    c.stroke();
  };
  {
    stem(cx - 0.22, fy - 0.24);
    puffHead(c, cx - 0.22, fy - 0.24, 0.08, 0, 0, 0.5);
    stem(cx + 0.22, fy - 0.2);
    // a closed bud
    ell(c, cx + 0.22, fy - 0.22, 0.04, 0.06);
    fo(c, '#7cc04a', 0.01);
    c.fillStyle = '#ffd23a';
    ell(c, cx + 0.22, fy - 0.27, 0.025, 0.02);
    c.fill();
  }
}

function puffer(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const fy = cy + 0.14;
  const f = Math.min(1, b.firing / 0.5);
  const dx = Math.cos(b.angle),
    dy = Math.sin(b.angle) * 0.7;
  // bulge, then puff (squeeze)
  const bulge = f > 0.75 ? (1 - f) / 0.25 : f / 0.75;
  const sc = f > 0.75 ? 1 + bulge * 0.18 : 1 - 0.1 * Math.sin(f * Math.PI);
  layer(c, `sp-puff|${L}`, b.x, b.y, (g) => puffLeaves(g));
  const R = (0.17 + L * 0.02) * sc;
  const hx = cx + dx * 0.04,
    hy = cy - 0.34 - L * 0.04 + dy * 0.03;
  // stems (side buds first)
  const stem = (x: number, y: number) => {
    c.strokeStyle = OUT;
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(cx, fy);
    c.quadraticCurveTo(cx, (fy + y) / 2, x, y);
    c.stroke();
    c.strokeStyle = '#6ab040';
    c.lineWidth = 0.028;
    c.stroke();
  };
  if (L >= 1) layer(c, `sp-puffbud`, b.x, b.y, (g) => puffBuds(g));
  stem(hx, hy);
  {
    const R0 = 0.17 + L * 0.02,
      E = R0 * 1.35;
    const cv = cached(`sp-puffhead|${L}`, pxOf(c), -E, -E, E * 2, E * 2, (g) => puffHead(g, 0, 0, R0, 0, L, 0.3));
    const k = R / R0;
    c.drawImage(cv, hx - E * k, hy - E * k, E * 2 * k, E * 2 * k);
  }
  if (f > 0 && f <= 0.75) {
    // pollen puff cloud streaming toward the target
    const q = 1 - f / 0.75;
    for (let i = 0; i < 7; i++) {
      const d = R + q * (0.3 + hash(i) * 0.25);
      const sx = (hash(i * 7) - 0.5) * 0.25 * (0.4 + q);
      const px = hx + dx * d - dy * sx,
        py = hy + dy * d + dx * sx - q * 0.05;
      c.fillStyle = rgba(i % 2 ? POLLEN : POLLEN_LIGHT, 0.75 * (1 - q));
      circle(c, px, py, 0.04 + q * 0.06);
      c.fill();
    }
  }
  // lazy drifting pollen motes
  for (let i = 0; i < 3; i++) {
    const q = (t * 0.4 + i / 3 + hash(b.uid + i)) % 1;
    c.fillStyle = rgba(POLLEN_LIGHT, 0.8 * Math.sin(q * Math.PI));
    circle(c, hx + Math.sin(t + i * 2) * 0.2, hy - q * 0.4, 0.014);
    c.fill();
  }
}

// ------------------------------------------------------------------ toadstool ring (trap)

function toadstool(g: C, x: number, y: number, s: number, seed: number) {
  // stalk
  g.beginPath();
  g.moveTo(x - s * 0.18, y);
  g.quadraticCurveTo(x - s * 0.22, y - s * 0.45, x - s * 0.12, y - s * 0.6);
  g.lineTo(x + s * 0.12, y - s * 0.6);
  g.quadraticCurveTo(x + s * 0.22, y - s * 0.45, x + s * 0.18, y);
  g.closePath();
  fo(g, hGrad(g, x - s * 0.2, x + s * 0.2, '#f4ead8'), 0.01);
  // cap
  g.beginPath();
  g.moveTo(x - s * 0.5, y - s * 0.55);
  g.bezierCurveTo(x - s * 0.5, y - s * 1.15, x + s * 0.5, y - s * 1.15, x + s * 0.5, y - s * 0.55);
  g.quadraticCurveTo(x, y - s * 0.45, x - s * 0.5, y - s * 0.55);
  g.closePath();
  const cg = g.createRadialGradient(x - s * 0.15, y - s * 0.95, s * 0.05, x, y - s * 0.7, s * 0.6);
  cg.addColorStop(0, '#e6a0ff');
  cg.addColorStop(0.55, '#a050d0');
  cg.addColorStop(1, '#5a2080');
  fo(g, cg, 0.012);
  g.fillStyle = 'rgba(255,248,240,0.95)';
  for (let k = 0; k < 4; k++) {
    const a = Math.PI * (1.15 + k * 0.23) + hash(seed) * 0.2;
    circle(g, x + Math.cos(a) * s * 0.3, y - s * 0.62 + Math.sin(a) * s * 0.35, s * (0.06 + 0.02 * (k % 2)));
    g.fill();
  }
}

function mushroomCanvas(c: C, L: number) {
  return cached(`sp-mush|${L}`, pxOf(c), 0, -0.1, 1, 1.1, (g) => {
    // darker fairy-ring grass
    g.strokeStyle = 'rgba(40,80,30,0.35)';
    g.lineWidth = 0.09;
    ell(g, 0.5, 0.56, 0.32, 0.25);
    g.stroke();
    g.fillStyle = 'rgba(60,40,70,0.15)';
    ell(g, 0.5, 0.56, 0.28, 0.21);
    g.fill();
    const n = 6 + L * 2;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.3;
      pts.push([0.5 + Math.cos(a) * 0.33, 0.58 + Math.sin(a) * 0.25, i]);
    }
    if (L >= 2) pts.push([0.5, 0.58, 99]);
    pts.sort((p, q) => p[1] - q[1]);
    for (const [x, y, i] of pts) {
      const s = i === 99 ? 0.3 : (0.15 + L * 0.015) * (0.8 + hash(i * 13 + L) * 0.4);
      g.fillStyle = 'rgba(30,40,20,0.3)';
      ell(g, x + 0.02, y + 0.005, s * 0.4, s * 0.15);
      g.fill();
      toadstool(g, x, y, s, i);
    }
  });
}

function mushroom(c: C, b: Building, t: number) {
  const f = Math.min(1, b.firing / 0.4);
  const cx = b.x + 0.5,
    cy = b.y + 0.58;
  c.save();
  c.translate(cx, cy);
  c.scale(1 + f * 0.06, 1 - f * 0.12);
  c.drawImage(mushroomCanvas(c, b.level), -0.5, -0.68, 1, 1.1);
  c.restore();
  if (b.level >= 1) glow(c, cx, cy - 0.1, 0.4, '#d08aff', 0.08 + 0.04 * Math.sin(t * 2 + b.uid));
  if (f > 0) {
    const q = 1 - f;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + b.uid;
      const r = 0.15 + q * 0.4;
      c.fillStyle = rgba(i % 2 ? '#d8a0ff' : '#b8e070', 0.55 * f);
      circle(c, cx + Math.cos(a) * r, cy - 0.15 + Math.sin(a) * r * 0.6 - q * 0.15, 0.06 + q * 0.07);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ whipping willow

function willowCanvas(c: C, L: number) {
  return cached(`sp-willow-trunk|${L}`, pxOf(c), -0.2, -1.1, 1.4, 2.1, (g) => {
    const cx = 0.5,
      fy = 0.66;
    // gnarled trunk
    const top = fy - 0.55 - L * 0.06;
    g.beginPath();
    g.moveTo(cx - 0.13, fy + 0.02);
    g.quadraticCurveTo(cx - 0.05, fy - 0.15, cx - 0.08, top + 0.1);
    g.lineTo(cx - 0.16, top);
    g.lineTo(cx - 0.02, top + 0.06);
    g.lineTo(cx + 0.06, top - 0.02);
    g.lineTo(cx + 0.08, top + 0.1);
    g.quadraticCurveTo(cx + 0.05, fy - 0.15, cx + 0.14, fy + 0.02);
    g.closePath();
    fo(g, hGrad(g, cx - 0.14, cx + 0.14, BARK), 0.018);
    g.strokeStyle = rgba(BARK_DARK, 0.7);
    g.lineWidth = 0.01;
    g.beginPath();
    g.moveTo(cx - 0.03, fy - 0.02);
    g.quadraticCurveTo(cx + 0.01, fy - 0.2, cx - 0.03, top + 0.12);
    g.moveTo(cx + 0.05, fy - 0.06);
    g.lineTo(cx + 0.04, fy - 0.25);
    g.stroke();
    // crown dome
    const R = 0.36 + L * 0.05;
    const ccy = top - 0.08;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const x = cx + Math.cos(a) * R * 0.8,
        y = ccy + Math.sin(a) * R * 0.5 + 0.05;
      circle(g, x, y, R * 0.36);
      g.fillStyle = OUT;
      g.fill();
    }
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const x = cx + Math.cos(a) * R * 0.8,
        y = ccy + Math.sin(a) * R * 0.5 + 0.05;
      circle(g, x, y, R * 0.36 - 0.018);
      g.fillStyle = ballGrad(g, x, y, R * 0.36, '#86c066', 0.25, -0.25);
      g.fill();
    }
    ell(g, cx, ccy + 0.02, R * 0.85, R * 0.42);
    g.fillStyle = ballGrad(g, cx, ccy, R * 0.8, '#94cc70', 0.3, -0.2);
    g.fill();
  });
}

function willow(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const fy = cy + 0.16;
  dropShadow(c, cx + 0.06, fy + 0.04, 0.42, 0.15);
  bed(c, b.x, b.y, L, 0.3);
  const f = Math.min(1, b.firing / 0.35);
  const lash = Math.sin(f * Math.PI);
  const top = fy - 0.55 - L * 0.06;
  const R = 0.36 + L * 0.05;
  const ccy = top - 0.08;
  const strands = 11 + L * 4;
  const drawStrands = (back: boolean) => {
    // batched: one dark path for all strands, then a lighter inner line
    const p = new Path2D();
    for (let i = 0; i < strands; i++) {
      const u = i / (strands - 1); // 0..1 across the crown
      const a = Math.PI + u * Math.PI;
      const isBack = i % 2 === 1;
      if (isBack !== back) continue;
      const sx = cx + Math.cos(a) * R * (isBack ? 0.6 : 0.85),
        sy = ccy + Math.sin(a) * R * 0.3 + (isBack ? -0.02 : 0.08);
      const out = Math.cos(a);
      const len = 0.45 + L * 0.08 + hash(i * 7 + L) * 0.12;
      const sw = Math.sin(b.spin * 1.7 + i * 0.7) * 0.04 + Math.sin(b.spin * 0.6) * 0.03;
      const ex = sx + out * (0.08 + lash * 0.45) + sw,
        ey = sy + len * (1 - lash * 0.65);
      const mx = sx + out * (0.12 + lash * 0.3) + sw * 0.5,
        my = sy + len * 0.3 - lash * 0.1;
      p.moveTo(sx, sy);
      p.quadraticCurveTo(mx, my, ex, ey);
    }
    c.lineCap = 'round';
    c.strokeStyle = back ? '#3a6a2a' : '#3f7230';
    c.lineWidth = 0.05;
    c.stroke(p);
    c.strokeStyle = back ? '#7aae54' : L >= 2 ? '#a8d870' : '#9ccf6a';
    c.lineWidth = 0.026;
    c.stroke(p);
  };
  drawStrands(true);
  c.drawImage(willowCanvas(c, L), b.x - 0.2, b.y - 1.1 + (fy - (cy + 0.16)), 1.4, 2.1);
  drawStrands(false);
  if (L >= 2) {
    // golden catkins
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.1 + i * 0.2);
      c.fillStyle = '#ffe58a';
      ell(c, cx + Math.cos(a) * R * 0.6, ccy + Math.sin(a) * R * 0.25 + 0.03 + Math.sin(t * 2 + i) * 0.01, 0.018, 0.035);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ bramble catapult

function thornBall(c: C, x: number, y: number, r: number) {
  c.strokeStyle = '#e8dcc0';
  c.lineWidth = 0.01;
  c.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    c.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
    c.lineTo(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5);
  }
  c.stroke();
  circle(c, x, y, r);
  fo(c, ballGrad(c, x, y, r, '#5a6a2a'), 0.012);
  c.strokeStyle = rgba('#2a3a10', 0.7);
  c.lineWidth = 0.008;
  c.beginPath();
  c.arc(x, y, r * 0.6, 0.5, 2.5);
  c.stroke();
}

function bramblerBase(c: C, L: number) {
  return cached(`sp-bram|${L}`, pxOf(c), -0.1, -0.1, 1.2, 1.2, (g) => {
    const cx = 0.5,
      cy = 0.62;
    dropShadow(g, cx + 0.06, cy + 0.08, 0.42, 0.2);
    // log platform
    for (let i = 0; i < 4; i++) {
      const y = cy - 0.15 + i * 0.1;
      g.beginPath();
      g.roundRect(cx - 0.36, y - 0.045, 0.72, 0.09, 0.045);
      const lg = g.createLinearGradient(0, y - 0.045, 0, y + 0.045);
      lg.addColorStop(0, '#b08458');
      lg.addColorStop(1, '#6a4a2a');
      fo(g, lg, 0.014);
      ell(g, cx + 0.33, y, 0.03, 0.04);
      fo(g, '#d8b080', 0.008);
    }
    // blackberry brambles around the edge
    g.strokeStyle = '#3a4a20';
    g.lineWidth = 0.025;
    g.beginPath();
    g.moveTo(cx - 0.4, cy + 0.2);
    g.bezierCurveTo(cx - 0.3, cy + 0.05, cx - 0.48, cy - 0.1, cx - 0.34, cy - 0.22);
    g.moveTo(cx + 0.4, cy + 0.2);
    g.bezierCurveTo(cx + 0.46, cy + 0.05, cx + 0.3, cy - 0.05, cx + 0.38, cy - 0.2);
    g.stroke();
    for (let i = 0; i < 5 + L * 2; i++) {
      const s = i % 2 ? 1 : -1;
      const x = cx + s * (0.34 + hash(i * 3) * 0.08),
        y = cy - 0.2 + hash(i * 5) * 0.4;
      leaf(g, x, y, s > 0 ? -0.4 : Math.PI + 0.4, 0.08, 0.03, LEAF, 0.008, false);
    }
    if (L >= 1) {
      for (let i = 0; i < 3 + L * 2; i++) {
        const s = i % 2 ? 1 : -1;
        const x = cx + s * (0.36 + hash(i * 11) * 0.06),
          y = cy - 0.15 + hash(i * 17) * 0.32;
        if (L >= 2 && i % 3 === 0) flower(g, x, y, 0.035, PETAL_WHITE, POLLEN, i);
        else {
          g.fillStyle = i % 2 ? '#3a1840' : '#6a2050';
          for (const [ox, oy] of [
            [0, 0],
            [0.014, 0.008],
            [-0.01, 0.012],
            [0.004, 0.018],
          ]) {
            circle(g, x + ox, y + oy, 0.011);
            g.fill();
          }
        }
      }
    }
  });
}

function brambler(c: C, b: Building, cx: number, cy: number) {
  const L = b.level;
  c.drawImage(bramblerBase(c, L), b.x - 0.1, b.y - 0.1, 1.2, 1.2);
  const dx = Math.cos(b.angle),
    dy = Math.sin(b.angle);
  const px = -dy,
    py = dx * 0.6; // perpendicular, foreshortened
  const pivX = cx,
    pivY = cy - 0.24 - L * 0.03;
  const baseY = cy + 0.1;
  // arm angle: 0.35 cocked back, 2.2 thrown forward
  const p = b.recoil;
  const psi = 0.35 + 1.85 * Math.pow(p, 0.6);
  const len = 0.46 + L * 0.05;
  const tipX = pivX - Math.cos(psi) * dx * len,
    tipY = pivY - Math.cos(psi) * dy * 0.6 * len - Math.sin(psi) * len * 0.8;
  const cwX = pivX + Math.cos(psi) * dx * 0.12,
    cwY = pivY + Math.cos(psi) * dy * 0.6 * 0.12 + Math.sin(psi) * 0.12 * 0.8;
  const post = (s: number) => {
    const x = pivX + px * 0.17 * s,
      y = pivY + py * 0.17 * s;
    c.lineCap = 'round';
    c.strokeStyle = OUT;
    c.lineWidth = 0.075;
    c.beginPath();
    c.moveTo(x - dx * 0.12, baseY + py * 0.17 * s);
    c.lineTo(x, y - 0.02);
    c.lineTo(x + dx * 0.12, baseY + py * 0.17 * s);
    c.stroke();
    c.strokeStyle = '#8a6036';
    c.lineWidth = 0.04;
    c.stroke();
    // vine wrapping the post
    c.strokeStyle = '#3e5a22';
    c.lineWidth = 0.014;
    c.beginPath();
    for (let k = 0; k <= 8; k++) {
      const q = k / 8;
      const vx = x - dx * 0.12 * (1 - q) + Math.sin(q * 12) * 0.02,
        vy = baseY + py * 0.17 * s + (y - baseY - py * 0.17 * s) * q;
      k ? c.lineTo(vx, vy) : c.moveTo(vx, vy);
    }
    c.stroke();
    leaf(c, x, y + 0.04, -Math.PI / 2 + s * 0.8, 0.07, 0.025, LEAF, 0.008, false);
  };
  const backFirst = py >= 0; // which post is further from the viewer
  post(backFirst ? -1 : 1);
  // axle
  c.strokeStyle = BARK_DARK;
  c.lineWidth = 0.03;
  c.beginPath();
  c.moveTo(pivX - px * 0.17, pivY - py * 0.17);
  c.lineTo(pivX + px * 0.17, pivY + py * 0.17);
  c.stroke();
  // arm (a bent sapling wrapped in brambles)
  c.strokeStyle = OUT;
  c.lineWidth = 0.07;
  c.beginPath();
  c.moveTo(cwX, cwY);
  c.lineTo(tipX, tipY);
  c.stroke();
  c.strokeStyle = '#9a7040';
  c.lineWidth = 0.044;
  c.stroke();
  c.strokeStyle = '#3e5a22';
  c.lineWidth = 0.012;
  c.beginPath();
  for (let k = 0; k <= 10; k++) {
    const q = k / 10;
    const x = cwX + (tipX - cwX) * q + Math.sin(q * 18) * 0.012,
      y = cwY + (tipY - cwY) * q + Math.cos(q * 18) * 0.012;
    k ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();
  // counterweight stone(s)
  stone(c, cwX, cwY + 0.04, 0.07 + L * 0.01, 0.055 + L * 0.008, 5, true);
  // cup + thorn ball when reloaded
  ell(c, tipX, tipY, 0.07, 0.04);
  fo(c, '#6a4a2a', 0.012);
  if (p < 0.35) thornBall(c, tipX, tipY - 0.04, 0.065 + L * 0.008);
  post(backFirst ? 1 : -1);
}

// ------------------------------------------------------------------ elder oak

function oakTrunkCanvas(c: C, L: number) {
  return cached(`sp-oak-trunk|${L}`, pxOf(c), -0.5, -0.9, 2, 1.8, (g) => {
    const cx = 0.5,
      fy = 0.7;
    dropShadow(g, cx + 0.1, fy + 0.04, 0.75, 0.3);
    // great surface roots
    const roots = 7;
    for (let i = 0; i < roots; i++) {
      const a = Math.PI * (0.05 + (i / (roots - 1)) * 0.9) + (hash(i + L) - 0.5) * 0.15;
      const len = 0.42 + hash(i * 3) * 0.2 + L * 0.04;
      const ex = cx + Math.cos(a) * len * 1.25 * (a < Math.PI / 2 ? 1 : 1),
        ey = fy + Math.sin(a) * len * 0.35;
      const sx = cx + Math.cos(a) * 0.14,
        sy = fy - 0.02;
      g.lineCap = 'round';
      g.strokeStyle = OUT;
      g.lineWidth = 0.075;
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo((sx + ex) / 2, sy + 0.02, ex, ey);
      g.stroke();
      g.strokeStyle = BARK;
      g.lineWidth = 0.05;
      g.stroke();
      g.strokeStyle = rgba('#b08a5a', 0.6);
      g.lineWidth = 0.014;
      g.stroke();
    }
    // trunk
    const tw = 0.24 + L * 0.02,
      top = fy - 0.72;
    g.beginPath();
    g.moveTo(cx - tw - 0.08, fy + 0.02);
    g.quadraticCurveTo(cx - tw + 0.04, fy - 0.2, cx - tw * 0.8, top + 0.1);
    g.lineTo(cx - tw * 1.4, top - 0.05);
    g.lineTo(cx - tw * 0.4, top + 0.02);
    g.lineTo(cx, top - 0.08);
    g.lineTo(cx + tw * 0.4, top + 0.02);
    g.lineTo(cx + tw * 1.4, top - 0.05);
    g.lineTo(cx + tw * 0.8, top + 0.1);
    g.quadraticCurveTo(cx + tw - 0.04, fy - 0.2, cx + tw + 0.08, fy + 0.02);
    g.closePath();
    fo(g, hGrad(g, cx - tw, cx + tw, '#86603a', 0.2, -0.4), 0.024);
    // bark furrows
    g.strokeStyle = rgba(BARK_DARK, 0.75);
    g.lineWidth = 0.014;
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const x = cx - tw * 0.8 + (k / 5) * tw * 1.6;
      g.moveTo(x, fy - 0.02);
      g.bezierCurveTo(x + 0.03, fy - 0.2, x - 0.03, fy - 0.4, x + (x - cx) * 0.3, top + 0.08);
    }
    g.stroke();
    // wise bark face
    const fyc = fy - 0.36;
    g.strokeStyle = BARK_DARK;
    g.lineWidth = 0.022;
    g.lineCap = 'round';
    // brows
    g.beginPath();
    g.moveTo(cx - 0.15, fyc - 0.08);
    g.quadraticCurveTo(cx - 0.08, fyc - 0.13, cx - 0.02, fyc - 0.07);
    g.moveTo(cx + 0.15, fyc - 0.08);
    g.quadraticCurveTo(cx + 0.08, fyc - 0.13, cx + 0.02, fyc - 0.07);
    g.stroke();
    // eye hollows (closed, peaceful)
    for (const s of [-1, 1]) {
      ell(g, cx + s * 0.08, fyc - 0.02, 0.05, 0.03);
      g.fillStyle = '#3a2412';
      g.fill();
    }
    // nose ridge & mouth
    g.beginPath();
    g.moveTo(cx, fyc - 0.03);
    g.quadraticCurveTo(cx + 0.03, fyc + 0.06, cx - 0.01, fyc + 0.09);
    g.stroke();
    g.beginPath();
    g.moveTo(cx - 0.08, fyc + 0.15);
    g.quadraticCurveTo(cx, fyc + 0.2, cx + 0.08, fyc + 0.15);
    g.stroke();
    // mossy beard
    g.fillStyle = '#7a9a4a';
    for (let k = 0; k < 7; k++) {
      const x = cx - 0.12 + k * 0.04;
      g.beginPath();
      g.moveTo(x - 0.02, fyc + 0.19);
      g.quadraticCurveTo(x, fyc + 0.3 + (k % 2) * 0.06 + L * 0.03, x + 0.02, fyc + 0.19);
      g.fill();
    }
    // a knot hole with a little mushroom
    ell(g, cx + tw * 0.55, fy - 0.12, 0.035, 0.05);
    g.fillStyle = '#2a1808';
    g.fill();
    toadstool(g, cx - tw * 0.7, fy - 0.03, 0.09, 3);
  });
}

function oakCrownCanvas(c: C, L: number) {
  return cached(`sp-oak-crown|${L}`, pxOf(c), -1.2, -1.15, 2.4, 2.2, (g) => {
    const R = 0.66 + L * 0.08;
    const clumps: [number, number, number][] = [];
    const n = 13 + L * 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = R * (0.6 + hash(i * 7 + L) * 0.15);
      clumps.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.55, R * (0.33 + hash(i * 5) * 0.08)]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.5;
      clumps.push([Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.18 - 0.08, R * 0.38]);
    }
    clumps.push([0, -R * 0.2, R * 0.42]);
    clumps.sort((p, q) => p[1] - q[1]);
    // outline pass then fill pass for a single bold silhouette
    g.fillStyle = OUT;
    for (const [x, y, r] of clumps) {
      circle(g, x, y, r + 0.025);
      g.fill();
    }
    for (const [x, y, r] of clumps) {
      circle(g, x, y, r);
      g.fillStyle = ballGrad(g, x, y, r, L >= 2 ? '#5aa844' : '#4e9a3c', 0.3, -0.35);
      g.fill();
      // leaf texture
      for (let k = 0; k < 5; k++) {
        const a = hash(Math.round((x + y) * 100) + k) * TAU;
        const d = r * 0.55;
        g.fillStyle = k % 2 ? rgba('#a8dc72', 0.55) : rgba('#2e6a28', 0.4);
        ell(g, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.18, r * 0.11, a);
        g.fill();
      }
    }
    // acorns / blossoms / golden leaves with level
    if (L >= 1) {
      for (let i = 0; i < 6 + L * 4; i++) {
        const a = hash(i * 19 + 3) * TAU,
          d = hash(i * 23) * R * 0.85;
        const x = Math.cos(a) * d,
          y = Math.sin(a) * d * 0.55;
        if (L >= 2 && i % 2 === 0) flower(g, x, y, 0.05, i % 4 === 0 ? PETAL : PETAL_WHITE, POLLEN, i);
        else {
          ell(g, x, y + 0.02, 0.025, 0.032);
          fo(g, '#b08040', 0.008);
          ell(g, x, y - 0.01, 0.03, 0.017);
          fo(g, '#6a4a22', 0.008);
        }
      }
    }
  });
}

function elderoak(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const f = Math.min(1, b.firing / 1.2);
  // root ripple across the ground
  if (f > 0) {
    const q = 1 - f;
    c.strokeStyle = rgba('#ffe070', 0.7 * f);
    c.lineWidth = 0.05 * f;
    for (let k = 0; k < 3; k++) {
      const r = 0.4 + (q + k * 0.15) * 1.6;
      ell(c, cx, cy + 0.2, r, r * 0.5);
      c.stroke();
    }
  }
  c.drawImage(oakTrunkCanvas(c, L), b.x - 0.5, b.y - 0.9, 2, 1.8);
  if (f > 0) {
    // glowing veins along the roots, eyes open
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.05 + (i / 6) * 0.9) + (hash(i + L) - 0.5) * 0.15;
      const len = 0.42 + hash(i * 3) * 0.2 + L * 0.04;
      const ex = cx + Math.cos(a) * len * 1.25,
        ey = cy + 0.2 + Math.sin(a) * len * 0.35;
      c.strokeStyle = rgba('#ffd860', 0.8 * f);
      c.lineWidth = 0.02;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 0.14, cy + 0.18);
      c.quadraticCurveTo((cx + ex) / 2, cy + 0.2, ex, ey);
      c.stroke();
    }
    c.restore();
    const fyc = cy + 0.2 - 0.36;
    for (const s of [-1, 1]) glow(c, cx + s * 0.08, fyc - 0.02, 0.12, '#ffe070', 0.9 * f);
  }
  // swaying crown
  const sway = Math.sin(t * 0.9 + b.uid) * 0.012;
  const crY = cy - 1.08 - L * 0.06;
  c.drawImage(oakCrownCanvas(c, L), cx - 1.2 + sway, crY - 1.15, 2.4, 2.2);
  // drifting leaves / light motes
  for (let i = 0; i < 3 + L; i++) {
    const q = (t * 0.25 + i / (3 + L) + hash(b.uid + i)) % 1;
    const x = cx + (hash(i * 7) - 0.5) * 1.4 + Math.sin(t * 1.5 + i) * 0.08,
      y = crY + 0.2 + q * 0.9;
    c.save();
    c.globalAlpha *= Math.sin(q * Math.PI);
    if (L >= 2 && i % 2) flower(c, x, y, 0.03, PETAL, POLLEN, t + i);
    else leaf(c, x, y, t * 2 + i, 0.06, 0.02, i % 2 ? '#8ac850' : '#c8b040', 0.006, false);
    c.restore();
  }
}

// ------------------------------------------------------------------ dispatch

const FLAT = new Set(['thistle', 'mushroom']);
const BEDDED = new Set(['seedspitter', 'snapper', 'puffer']);

function building(ctx: C, b: Building, t: number, game: Game) {
  const id = b.def.id;
  const cx = b.x + 0.5,
    cy = b.y + 0.5;
  ctx.save();
  if (BEDDED.has(id)) bed(ctx, b.x, b.y, b.level);
  switch (id) {
    case 'hedge':
      hedge(ctx, b, game, t);
      break;
    case 'seedspitter':
      seedspitter(ctx, b, cx, cy, t);
      break;
    case 'thistle':
      thistle(ctx, b, t);
      break;
    case 'beehive':
      beehive(ctx, b, cx, cy, t);
      break;
    case 'sprinkler':
      sprinkler(ctx, b, cx, cy, t);
      break;
    case 'snapper':
      snapper(ctx, b, cx, cy, t);
      break;
    case 'puffer':
      puffer(ctx, b, cx, cy, t);
      break;
    case 'mushroom':
      mushroom(ctx, b, t);
      break;
    case 'willow':
      willow(ctx, b, cx, cy, t);
      break;
    case 'brambler':
      brambler(ctx, b, cx, cy);
      break;
    case 'elderoak':
      elderoak(ctx, b, cx, cy, t);
      break;
  }
  if (id !== 'hedge') {
    if (b.hp < b.maxHp * 0.5 && !FLAT.has(id)) wilt(ctx, cx, cy + 0.25, b.uid);
    pips(ctx, cx, b.y + (FLAT.has(id) ? 0.94 : 0.92), b.level);
  }
  if (b.buff > 0 && b.def.kind === 'tower') {
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.6 + i / 4 + hash(b.uid * 13 + i) * 0.3) % 1;
      const x = b.x + 0.2 + hash(b.uid * 7 + i) * 0.6;
      const y = b.y + 0.75 - p * 0.9;
      ctx.fillStyle = rgba('#bff0ff', 0.9 * Math.sin(p * Math.PI));
      circle(ctx, x, y, 0.02);
      ctx.fill();
    }
  }
  if (b.hurt > 0) glow(ctx, cx, cy - 0.1, 0.65, '#ff3030', Math.min(1, b.hurt * 5) * 0.65);
  ctx.restore();
}

function iconTall(id: string): number {
  if (id === 'elderoak') return 1.25;
  if (id === 'willow' || id === 'beehive') return 0.5;
  if (id === 'seedspitter' || id === 'puffer' || id === 'snapper' || id === 'sprinkler') return 0.5;
  return 0;
}

// keep tree-shakers honest about helpers only used in some builds
void [SOIL_DARK, LEAF_LIGHT, mix, ell, TERRA, SOIL];

registerArt('spring', {
  building,
  iconTall,
  enemies: SPRING_ENEMIES,
  core: drawHeartseed,
  rift: drawBurrow,
});
