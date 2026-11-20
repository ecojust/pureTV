// Autumn structures: the haunted pumpkin-hill's defences. World ctx, 1 unit = 1 tile, tile (x,y)–(x+1,y+1).
import type { Building, Game } from '../../game/game';
import {
  BONE,
  C,
  CANDLE,
  IRON,
  IRON_L,
  LEAF,
  OUT,
  PUMPKIN,
  PUMPKIN_D,
  SHADOW,
  SPIRIT,
  STONE,
  STONE_D,
  STONE_L,
  TAU,
  VIOLET,
  WITCH,
  WITCH_D,
  WOOD,
  WOOD_D,
  addGlow,
  candleStick,
  circle,
  cyl,
  ell,
  flame,
  flicker,
  fo,
  lgrad,
  line,
  pips,
  pumpkin,
  ravenFlying,
  ravenPerched,
} from './art-autumn-common';
import { cached, glow, hash, ngon, poly, pxOf, rgba, shade, TRng } from './util';

// ------------------------------------------------------------------ plinth: a weathered flagstone with fallen leaves

const LEAF_COLS = ['#c8541a', '#e08a2a', '#a8361a', '#d8a63a', '#8a3a1a'];

function leafAt(g: C, x: number, y: number, s: number, rot: number, col: string) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(-s, 0);
  g.quadraticCurveTo(0, -s * 0.7, s, 0);
  g.quadraticCurveTo(0, s * 0.7, -s, 0);
  g.fillStyle = col;
  g.fill();
  g.strokeStyle = 'rgba(40,16,6,0.6)';
  g.lineWidth = s * 0.15;
  g.beginPath();
  g.moveTo(-s, 0);
  g.lineTo(s * 0.8, 0);
  g.stroke();
  g.restore();
}

function plinthCanvas(c: C, level: number, v: number) {
  return cached(`aplinth|${level}|${v}`, pxOf(c), -0.08, -0.05, 1.2, 1.25, (g) => {
    const top = ngon(0.5, 0.48, 0.44, 8, Math.PI / 8, 0.84).map(([x, y], i) => [x + (hash(v * 31 + i) - 0.5) * 0.04, y + (hash(v * 17 + i) - 0.5) * 0.03] as [number, number]);
    g.fillStyle = SHADOW;
    poly(g, top.map(([x, y]) => [x + 0.06, y + 0.14]));
    g.fill();
    // skirt
    poly(g, top.map(([x, y]) => [x, y + 0.1]));
    fo(g, STONE_D, 0.022);
    // top slab
    poly(g, top);
    const gr = g.createLinearGradient(0.1, 0.1, 0.9, 0.9);
    gr.addColorStop(0, shade(STONE, 0.18));
    gr.addColorStop(1, shade(STONE, -0.18));
    fo(g, gr, 0.024);
    // flagstone seams
    g.strokeStyle = 'rgba(20,18,34,0.5)';
    g.lineWidth = 0.012;
    g.beginPath();
    g.moveTo(0.14, 0.44);
    g.lineTo(0.48, 0.5);
    g.lineTo(0.86, 0.42);
    g.moveTo(0.48, 0.5);
    g.lineTo(0.44, 0.82);
    g.moveTo(0.5, 0.14);
    g.lineTo(0.56, 0.3);
    g.stroke();
    // moss
    g.fillStyle = 'rgba(80,110,60,0.45)';
    ell(g, 0.2 + hash(v) * 0.2, 0.7, 0.1, 0.04);
    g.fill();
    if (level >= 1) {
      // iron band studs
      g.strokeStyle = IRON_L;
      g.lineWidth = 0.022;
      poly(g, ngon(0.5, 0.48, 0.37, 8, Math.PI / 8, 0.84));
      g.stroke();
      for (const [x, y] of ngon(0.5, 0.48, 0.37, 8, Math.PI / 8, 0.84)) {
        g.fillStyle = '#8a8898';
        circle(g, x, y, 0.016);
        g.fill();
      }
    }
    if (level >= 2) {
      // carved violet runes (moons & dots)
      g.strokeStyle = rgba(VIOLET, 0.75);
      g.lineWidth = 0.012;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.PI / 8;
        const x = 0.5 + Math.cos(a) * 0.31,
          y = 0.48 + Math.sin(a) * 0.31 * 0.84;
        g.beginPath();
        if (i % 2) g.arc(x, y, 0.022, 0.6, 0.6 + Math.PI * 1.3);
        else g.arc(x, y, 0.01, 0, TAU);
        g.stroke();
      }
    }
    // fallen leaves
    const r = new TRng(v * 97 + 5);
    const n = 3 + level;
    for (let i = 0; i < n; i++) {
      const a = r.next() * TAU;
      const d = 0.22 + r.next() * 0.2;
      leafAt(g, 0.5 + Math.cos(a) * d, 0.5 + Math.sin(a) * d * 0.8, 0.035 + r.next() * 0.015, r.next() * TAU, LEAF_COLS[i % 5]);
    }
  });
}

function plinth(c: C, b: Building) {
  const v = b.uid < 0 ? 0 : (b.x * 7 + b.y * 3) % 4;
  c.drawImage(plinthCanvas(c, b.level, v), b.x - 0.08, b.y - 0.05, 1.2, 1.25);
}

function cracks(c: C, b: Building) {
  const r = new TRng(b.uid * 7 + 1);
  c.strokeStyle = 'rgba(5,5,10,0.85)';
  c.lineWidth = 0.02;
  const n = b.hp < b.maxHp * 0.25 ? 3 : 1;
  for (let k = 0; k < n; k++) {
    let x = b.x + r.range(0.2, 0.8),
      y = b.y + r.range(0.55, 0.8);
    c.beginPath();
    c.moveTo(x, y);
    for (let i = 0; i < 3; i++) {
      x += r.range(-0.08, 0.08);
      y += r.range(-0.08, 0.06);
      c.lineTo(x, y);
    }
    c.stroke();
  }
}

// ------------------------------------------------------------------ 1. graveyard fence (wall)

function finialBar(g: C, x: number, yb: number, h: number) {
  g.strokeStyle = IRON;
  g.lineWidth = 0.03;
  line(g, x, yb, x, yb - h);
  g.strokeStyle = 'rgba(140,140,170,0.55)';
  g.lineWidth = 0.008;
  line(g, x - 0.007, yb - 0.01, x - 0.007, yb - h + 0.02);
  // spear tip
  g.beginPath();
  g.moveTo(x, yb - h - 0.07);
  g.lineTo(x + 0.028, yb - h + 0.005);
  g.lineTo(x, yb - h - 0.01);
  g.lineTo(x - 0.028, yb - h + 0.005);
  g.closePath();
  g.fillStyle = IRON;
  g.fill();
}

function headstone(g: C, x: number, y: number, s: number, tilt: number) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  g.fillStyle = SHADOW;
  ell(g, 0.03, 0.01, s * 0.7, s * 0.2);
  g.fill();
  g.beginPath();
  g.moveTo(-s * 0.45, 0);
  g.lineTo(-s * 0.45, -s * 0.8);
  g.arc(0, -s * 0.8, s * 0.45, Math.PI, 0);
  g.lineTo(s * 0.45, 0);
  g.closePath();
  fo(g, cyl(g, -s * 0.45, s * 0.45, STONE_L, 0.2), 0.018);
  g.strokeStyle = 'rgba(30,30,50,0.55)';
  g.lineWidth = 0.01;
  line(g, -s * 0.2, -s * 0.85, s * 0.2, -s * 0.85);
  line(g, -s * 0.2, -s * 0.65, s * 0.2, -s * 0.65);
  g.fillStyle = 'rgba(80,110,60,0.6)';
  ell(g, -s * 0.2, -s * 0.03, s * 0.25, s * 0.08);
  g.fill();
  g.restore();
}

function stonePillar(g: C, x: number, yb: number, w: number, h: number, L: number) {
  // body
  g.beginPath();
  g.rect(x - w / 2, yb - h, w, h);
  fo(g, cyl(g, x - w / 2, x + w / 2, STONE, 0.22), 0.02);
  // block seams
  g.strokeStyle = 'rgba(20,20,40,0.45)';
  g.lineWidth = 0.008;
  for (let k = 1; k < 3; k++) line(g, x - w / 2, yb - (h * k) / 3, x + w / 2, yb - (h * k) / 3);
  // cap
  g.beginPath();
  g.rect(x - w * 0.65, yb - h - 0.04, w * 1.3, 0.045);
  fo(g, STONE_L, 0.016);
  if (L >= 2) {
    // pyramidal top
    g.beginPath();
    g.moveTo(x - w * 0.5, yb - h - 0.04);
    g.lineTo(x, yb - h - 0.15);
    g.lineTo(x + w * 0.5, yb - h - 0.04);
    g.closePath();
    fo(g, lgrad(g, x - w / 2, 0, x + w / 2, 0, [
      [0, STONE_L],
      [1, STONE_D],
    ]), 0.014);
  }
}

function fenceCanvas(c: C, mask: number, L: number, v: number) {
  return cached(`afence|${mask}|${L}|${v}`, pxOf(c), -0.05, -0.6, 1.1, 1.65, (g) => {
    const N = mask & 1,
      E = mask & 2,
      S = mask & 4,
      W = mask & 8;
    const cx = 0.5,
      cy = 0.62;
    const fh = 0.1; // footing height
    const barH = 0.36 + L * 0.04;
    // shadow
    g.fillStyle = SHADOW;
    g.fillRect((W ? 0 : 0.36) + 0.05, cy - 0.08 + 0.06, (E ? 1 : 0.64) - (W ? 0 : 0.36), 0.18);
    if (N || S) g.fillRect(cx - 0.08 + 0.05, (N ? 0 : cy - 0.1) + 0.06, 0.18, (S ? 1 : cy + 0.1) - (N ? 0 : cy - 0.1));
    // headstone behind for character
    if (L >= 1 && !N && hash(v * 11 + mask) > 0.35) headstone(g, 0.25 + hash(v * 5) * 0.5, cy - 0.14, 0.2 + L * 0.02, (hash(v * 9) - 0.5) * 0.25);
    // ---- N–S run: footing column and bars receding up the screen (drawn back to front)
    const nsFoot = (y0: number, y1: number) => {
      g.beginPath();
      g.rect(cx - 0.08, y0 - fh, 0.16, y1 - y0);
      fo(g, lgrad(g, cx - 0.08, 0, cx + 0.08, 0, [
        [0, shade(STONE, 0.15)],
        [1, shade(STONE, -0.15)],
      ]), 0.016);
    };
    if (N) {
      nsFoot(0, cy);
      g.strokeStyle = IRON;
      g.lineWidth = 0.022;
      line(g, cx, 0 - fh - barH * 0.85, cx, cy - fh - barH * 0.85);
      line(g, cx, 0 - fh - barH * 0.25, cx, cy - fh - barH * 0.25);
      for (let y = 0.06; y < cy - 0.05; y += 0.12) finialBar(g, cx, y - fh, barH);
    }
    // ---- E–W run
    const x0 = W ? 0 : cx - 0.12,
      x1 = E ? 1 : cx + 0.12;
    // footing top + front
    g.beginPath();
    g.rect(x0, cy - fh - 0.07, x1 - x0, 0.07);
    fo(g, shade(STONE, 0.12), 0.016);
    g.beginPath();
    g.rect(x0, cy - fh, x1 - x0, fh);
    fo(g, lgrad(g, 0, cy - fh, 0, cy, [
      [0, STONE],
      [1, STONE_D],
    ]), 0.016);
    g.strokeStyle = 'rgba(20,20,40,0.4)';
    g.lineWidth = 0.008;
    for (let x = 0.25; x < 1; x += 0.25) if (x > x0 && x < x1) line(g, x, cy - fh, x, cy);
    if (W || E) {
      const yb = cy - fh - 0.035;
      g.strokeStyle = IRON;
      g.lineWidth = 0.022;
      line(g, x0, yb - barH * 0.85, x1, yb - barH * 0.85);
      line(g, x0, yb - barH * 0.25, x1, yb - barH * 0.25);
      for (let x = 0.04; x < 1; x += 0.09) {
        if (x < x0 || x > x1 || Math.abs(x - cx) < 0.09) continue;
        finialBar(g, x, yb, barH + (Math.abs(x - 0.5) < 0.3 ? 0 : 0) + Math.sin(x * 12) * 0.012);
      }
      // little iron curls between the rails
      if (L >= 1) {
        g.strokeStyle = IRON;
        g.lineWidth = 0.012;
        for (let x = 0.085; x < 1; x += 0.18) {
          if (x < x0 || x > x1 || Math.abs(x - cx) < 0.12) continue;
          g.beginPath();
          g.arc(x, yb - barH * 0.72, 0.03, 0.4, Math.PI * 1.8);
          g.stroke();
        }
      }
    }
    // ---- S run (in front)
    if (S) {
      nsFoot(cy, 1.0 + fh);
      g.strokeStyle = IRON;
      g.lineWidth = 0.022;
      line(g, cx, cy - fh - barH * 0.85, cx, 1 - fh - barH * 0.85);
      line(g, cx, cy - fh - barH * 0.25, cx, 1 - fh - barH * 0.25);
      for (let y = cy + 0.1; y < 1.02; y += 0.12) finialBar(g, cx, y - fh, barH);
    }
    // ---- centre post
    if (L === 0) {
      g.beginPath();
      g.rect(cx - 0.035, cy - fh - barH - 0.04, 0.07, barH + 0.04);
      fo(g, IRON, 0.012, '#000');
      g.fillStyle = IRON;
      circle(g, cx, cy - fh - barH - 0.06, 0.035);
      g.fill();
      g.strokeStyle = 'rgba(140,140,170,0.6)';
      g.lineWidth = 0.008;
      line(g, cx - 0.015, cy - fh - 0.02, cx - 0.015, cy - fh - barH);
    } else {
      stonePillar(g, cx, cy, 0.17, barH + 0.12 + L * 0.03, L);
      if (L >= 2) {
        // iron lantern bracket
        g.strokeStyle = IRON;
        g.lineWidth = 0.016;
        g.beginPath();
        g.moveTo(cx + 0.085, cy - barH - 0.05);
        g.quadraticCurveTo(cx + 0.18, cy - barH - 0.09, cx + 0.2, cy - barH - 0.02);
        g.stroke();
      }
    }
  });
}

function fence(c: C, b: Building, game: Game, t: number) {
  const nb = (dx: number, dy: number) => game?.buildingAtTile?.(b.x + dx, b.y + dy)?.def.id === 'fence';
  const mask = b.uid < 0 ? 10 : (nb(0, -1) ? 1 : 0) | (nb(1, 0) ? 2 : 0) | (nb(0, 1) ? 4 : 0) | (nb(-1, 0) ? 8 : 0);
  const v = b.uid < 0 ? 0 : (b.x * 5 + b.y * 11) % 3;
  c.drawImage(fenceCanvas(c, mask, b.level, v), b.x - 0.05, b.y - 0.6, 1.1, 1.65);
  if (b.level >= 2) {
    const barH = 0.44;
    const lx = b.x + 0.7,
      ly = b.y + 0.62 - barH + 0.02;
    c.strokeStyle = IRON;
    c.lineWidth = 0.008;
    line(c, lx, ly - 0.05, lx, ly);
    c.beginPath();
    c.rect(lx - 0.035, ly, 0.07, 0.08);
    fo(c, rgba(CANDLE, 0.85 * flicker(t, b.x + b.y)), 0.012, IRON);
    c.fillStyle = IRON;
    poly(c, [
      [lx - 0.045, ly + 0.005],
      [lx, ly - 0.03],
      [lx + 0.045, ly + 0.005],
    ]);
    c.fill();
    addGlow(c, lx, ly + 0.04, 0.3, '#ffb040', 0.35 * flicker(t, b.x * 3 + b.y));
  }
  if (b.hp < b.maxHp * 0.5) {
    c.strokeStyle = 'rgba(10,8,20,0.9)';
    c.lineWidth = 0.02;
    c.beginPath();
    c.moveTo(b.x + 0.32, b.y + 0.46);
    c.lineTo(b.x + 0.38, b.y + 0.52);
    c.lineTo(b.x + 0.34, b.y + 0.6);
    c.stroke();
    if (b.hp < b.maxHp * 0.25) {
      c.beginPath();
      c.moveTo(b.x + 0.62, b.y + 0.3);
      c.lineTo(b.x + 0.58, b.y + 0.4);
      c.stroke();
    }
  }
}

// ------------------------------------------------------------------ 2. candle tower

function candelabraBase(c: C, L: number) {
  return cached(`acandleb|${L}`, pxOf(c), -0.35, -0.5, 0.7, 0.6, (g) => {
    // stone stub
    const w = 0.34 + L * 0.03,
      h = 0.16 + L * 0.03;
    ell(g, 0, 0.0, w * 0.55, w * 0.2);
    fo(g, STONE_D, 0.018);
    g.beginPath();
    g.rect(-w / 2, -h, w, h);
    fo(g, cyl(g, -w / 2, w / 2, STONE, 0.22), 0.018);
    ell(g, 0, -h, w / 2, w * 0.18);
    fo(g, shade(STONE, 0.2), 0.016);
    // wax pooled over the top and dripping down the sides
    g.fillStyle = '#f2e9d2';
    ell(g, 0, -h, w * 0.42, w * 0.14);
    g.fill();
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 0.03 + (i / 4) * (w - 0.06);
      const dl = 0.03 + hash(i * 7 + L) * 0.08;
      g.beginPath();
      g.moveTo(x - 0.018, -h);
      g.lineTo(x - 0.014, -h + dl);
      g.arc(x, -h + dl, 0.014, Math.PI, 0, true);
      g.lineTo(x + 0.018, -h);
      g.fill();
    }
    // iron candelabra ring
    g.strokeStyle = IRON;
    g.lineWidth = 0.02;
    ell(g, 0, -h - 0.02, w * 0.42, w * 0.13);
    g.stroke();
  });
}

function candle(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.15;
  const w = 0.34 + L * 0.03,
    h = 0.16 + L * 0.03;
  c.drawImage(candelabraBase(c, L), cx - 0.35, by - 0.5, 0.7, 0.6);
  const fire = Math.min(1, b.firing * 3);
  const lean = Math.cos(b.angle) * fire * 0.9;
  const top = by - h - 0.02;
  // candles: back row first
  const n = 3 + L;
  const cs: { x: number; y: number; hh: number; ww: number; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / n) * TAU + 0.3;
    const rr = i === 0 ? 0 : w * 0.3;
    cs.push({
      x: cx + (i === 0 ? 0 : Math.cos(a) * rr),
      y: top + (i === 0 ? 0 : Math.sin(a) * rr * 0.35),
      hh: i === 0 ? 0.42 + L * 0.06 : 0.2 + hash(i * 3 + L) * 0.12 + L * 0.03,
      ww: i === 0 ? 0.085 : 0.06,
      s: i + b.uid * 7,
    });
  }
  cs.sort((p, q) => p.y - q.y);
  for (const k of cs) candleStick(c, k.x, k.y, k.hh, k.ww, t, k.s, lean, '#efe6cf', '#ffa030', 0.8 + fire * 0.6);
  if (fire > 0) addGlow(c, cx + Math.cos(b.angle) * 0.25, top - 0.4 + Math.sin(b.angle) * 0.1, 0.45, '#ffb040', 0.4 * fire);
}

// ------------------------------------------------------------------ 3. salt circle (flat trap)

function saltCanvas(c: C, L: number, v: number) {
  return cached(`asalt|${L}|${v}`, pxOf(c), 0, 0, 1, 1, (g) => {
    const r = new TRng(v * 131 + L * 7 + 3);
    const ring = (R: number, wdt: number, n: number) => {
      // dark ground stain under the salt
      g.strokeStyle = 'rgba(10,10,20,0.35)';
      g.lineWidth = wdt * 1.6;
      ell(g, 0.5, 0.52, R, R * 0.82);
      g.stroke();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + r.next() * 0.05;
        const rr = R + (r.next() - 0.5) * wdt;
        const x = 0.5 + Math.cos(a) * rr,
          y = 0.52 + Math.sin(a) * rr * 0.82;
        g.fillStyle = r.next() < 0.3 ? '#ffffff' : r.next() < 0.5 ? '#e8eef8' : '#cfd8e8';
        circle(g, x, y, 0.008 + r.next() * 0.012);
        g.fill();
      }
    };
    ring(0.36, 0.05, 220);
    if (L >= 1) ring(0.24, 0.035, 120);
    if (L >= 2) {
      // little moon-and-star marks of salt between the rings
      g.fillStyle = '#eef3fb';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        const x = 0.5 + Math.cos(a) * 0.3,
          y = 0.52 + Math.sin(a) * 0.3 * 0.82;
        if (i % 2) {
          g.beginPath();
          g.arc(x, y, 0.028, 0, TAU);
          g.arc(x + 0.014, y - 0.006, 0.022, 0, TAU, true);
          g.fill();
        } else {
          poly(g, ngon(x, y, 0.022, 4, a));
          g.fill();
        }
      }
    }
    // scattered grains
    for (let i = 0; i < 40; i++) {
      const a = r.next() * TAU,
        d = r.next() * 0.42;
      g.fillStyle = 'rgba(235,240,250,0.6)';
      circle(g, 0.5 + Math.cos(a) * d, 0.52 + Math.sin(a) * d * 0.82, 0.006);
      g.fill();
    }
  });
}

function saltring(c: C, b: Building, t: number) {
  const v = b.uid < 0 ? 0 : (b.x * 3 + b.y * 7) % 3;
  const fire = Math.min(1, b.firing * 3);
  if (fire > 0) {
    c.strokeStyle = rgba('#bfe6ff', 0.6 * fire);
    c.lineWidth = 0.08;
    ell(c, b.x + 0.5, b.y + 0.52, 0.36, 0.3);
    c.stroke();
  }
  c.drawImage(saltCanvas(c, b.level, v), b.x, b.y, 1, 1);
  // twinkling crystals
  const n = 5 + b.level * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash(i + v * 9) * 0.5;
    const R = i % 2 && b.level >= 1 ? 0.24 : 0.36;
    const x = b.x + 0.5 + Math.cos(a) * R,
      y = b.y + 0.52 + Math.sin(a) * R * 0.82;
    const tw = Math.max(0, Math.sin(t * 2.3 + i * 2.7 + b.x));
    const s = 0.012 + tw * 0.025 + fire * 0.02;
    c.fillStyle = rgba('#ffffff', 0.4 + tw * 0.6);
    c.beginPath();
    c.moveTo(x, y - s * 1.6);
    c.lineTo(x + s * 0.35, y);
    c.lineTo(x, y + s * 1.6);
    c.lineTo(x - s * 0.35, y);
    c.closePath();
    c.moveTo(x - s * 1.6, y);
    c.lineTo(x, y + s * 0.35);
    c.lineTo(x + s * 1.6, y);
    c.lineTo(x, y - s * 0.35);
    c.closePath();
    c.fill();
  }
  if (fire > 0) {
    addGlow(c, b.x + 0.5, b.y + 0.52, 0.65, '#bfe6ff', 0.55 * fire);
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba('#e0f4ff', 0.8 * fire);
    c.lineWidth = 0.03;
    ell(c, b.x + 0.5, b.y + 0.52, 0.36, 0.3);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
}

// ------------------------------------------------------------------ 4. pumpkin patch (eco)

const PATCH_SPOTS: [number, number, number, number, number][] = [
  // x, y, r, face, hue (drawn back to front)
  [0.3, 0.42, 0.12, 0, 1],
  [0.68, 0.4, 0.14, 1, 0],
  [0.42, 0.66, 0.17, 2, 0],
  [0.76, 0.72, 0.11, 0, 2],
  [0.2, 0.74, 0.1, 1, 2],
  [0.56, 0.84, 0.09, 0, 1],
];

function patchCanvas(c: C, L: number) {
  return cached(`apatch|${L}`, pxOf(c), -0.05, -0.15, 1.1, 1.2, (g) => {
    // tilled earth
    g.fillStyle = SHADOW;
    ell(g, 0.53, 0.62, 0.46, 0.36);
    g.fill();
    ell(g, 0.5, 0.58, 0.46, 0.36);
    fo(g, lgrad(g, 0, 0.2, 0, 0.95, [
      [0, '#4a3424'],
      [1, '#2a1c14'],
    ]), 0.02);
    g.strokeStyle = 'rgba(20,10,6,0.5)';
    g.lineWidth = 0.014;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(0.5, 0.58, 0.38 - k * 0.08, 0.28 - k * 0.06, 0, Math.PI * 0.1, Math.PI * 0.9);
      g.stroke();
    }
    // vines
    g.strokeStyle = LEAF;
    g.lineWidth = 0.022;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0.1, 0.6);
    g.bezierCurveTo(0.3, 0.4, 0.5, 0.8, 0.7, 0.5);
    g.bezierCurveTo(0.8, 0.35, 0.9, 0.6, 0.86, 0.75);
    g.moveTo(0.3, 0.42);
    g.bezierCurveTo(0.4, 0.55, 0.3, 0.75, 0.45, 0.85);
    g.stroke();
    g.lineWidth = 0.01;
    for (const [x, y] of [
      [0.16, 0.52],
      [0.62, 0.58],
      [0.88, 0.62],
      [0.36, 0.8],
    ]) {
      g.beginPath();
      g.arc(x, y, 0.025, 0, Math.PI * 1.6);
      g.stroke();
    }
    // big leaves
    for (const [x, y, rot] of [
      [0.14, 0.56, -0.4],
      [0.54, 0.52, 0.5],
      [0.9, 0.56, 1.8],
      [0.3, 0.88, 2.6],
      [0.66, 0.92, -2.4],
    ] as const) {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(0.05, -0.06, 0.1, -0.02, 0.09, 0.03);
      g.bezierCurveTo(0.07, 0.07, 0.02, 0.06, 0, 0);
      fo(g, '#3e6a26', 0.01, 'rgba(10,20,6,0.8)');
      g.restore();
    }
    // signpost with a candy sign
    g.fillStyle = WOOD_D;
    g.fillRect(0.12, 0.22, 0.035, 0.36);
    g.strokeStyle = OUT;
    g.lineWidth = 0.012;
    g.strokeRect(0.12, 0.22, 0.035, 0.36);
    g.save();
    g.translate(0.135, 0.27);
    g.rotate(-0.08);
    g.beginPath();
    g.rect(-0.12, -0.06, 0.24, 0.1);
    fo(g, WOOD, 0.012);
    // a wrapped sweet painted on the sign
    g.fillStyle = '#ff5aa0';
    ell(g, 0, -0.01, 0.035, 0.022);
    g.fill();
    poly(g, [
      [-0.035, -0.01],
      [-0.07, -0.035],
      [-0.07, 0.015],
    ]);
    g.fill();
    poly(g, [
      [0.035, -0.01],
      [0.07, -0.035],
      [0.07, 0.015],
    ]);
    g.fill();
    g.restore();
    // candy wrappers peeking out of the soil
    const wr: [number, number, string][] = [
      [0.6, 0.62, '#ff5aa0'],
      [0.28, 0.6, '#5ad0ff'],
      [0.86, 0.86, '#ffe04a'],
      [0.12, 0.86, '#b05aff'],
    ];
    for (const [x, y, col] of wr.slice(0, 2 + L)) {
      g.save();
      g.translate(x, y);
      g.rotate(x * 7);
      g.fillStyle = col;
      ell(g, 0, 0, 0.022, 0.014);
      g.fill();
      poly(g, [
        [-0.02, 0],
        [-0.045, -0.018],
        [-0.045, 0.018],
      ]);
      g.fill();
      poly(g, [
        [0.02, 0],
        [0.045, -0.018],
        [0.045, 0.018],
      ]);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)';
      ell(g, -0.006, -0.005, 0.008, 0.004);
      g.fill();
      g.restore();
    }
  });
}

function pumpkinpatch(c: C, b: Building, cx: number, cy: number, t: number) {
  c.drawImage(patchCanvas(c, b.level), b.x - 0.05, b.y - 0.15, 1.1, 1.2);
  const n = 3 + b.level + (b.level >= 2 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const [x, y, r, face, hue] = PATCH_SPOTS[i];
    const grow = b.level >= 2 && i === 2 ? 1.25 : 1;
    const lit = face ? 0.55 * flicker(t, i + b.uid) : 0;
    pumpkin(c, b.x + x, b.y + y, r * grow, face, lit, (hash(i * 3) - 0.5) * 0.6, hue);
  }
  if (b.level >= 1) addGlow(c, cx, cy + 0.1, 0.55, '#ff9a30', 0.12 + 0.04 * Math.sin(t * 3 + b.x));
}

// ------------------------------------------------------------------ 5. pumpkin catapult

function catapult(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const dx = Math.cos(b.angle),
    dy = Math.sin(b.angle);
  const px = -dy,
    py = dx;
  const by = cy + 0.12;
  const P = (u: number, v: number, h: number): [number, number] => [cx + u * dx + v * px, by + (u * dy + v * py) * 0.6 - h];
  const len = 0.3 + L * 0.03,
    half = 0.17 + L * 0.015;
  const beam = (a: [number, number], bb: [number, number], w: number, col: string) => {
    c.strokeStyle = OUT;
    c.lineWidth = w + 0.022;
    line(c, a[0], a[1], bb[0], bb[1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    line(c, a[0], a[1], bb[0], bb[1]);
  };
  c.lineCap = 'round';
  // wheels (back pair drawn first: the ones whose screen y is smaller)
  const wheels = [
    [-len, -half],
    [len, -half],
    [-len, half],
    [len, half],
  ].map(([u, v]) => ({ u, v, p: P(u, v * 1.1, 0) }));
  wheels.sort((a, q) => a.p[1] - q.p[1]);
  const wheel = (p: [number, number]) => {
    ell(c, p[0], p[1] - 0.06, 0.035 + Math.abs(px) * 0.04, 0.075, 0);
    fo(c, WOOD_D, 0.016);
    c.fillStyle = IRON_L;
    circle(c, p[0], p[1] - 0.06, 0.015);
    c.fill();
  };
  for (const w of wheels.slice(0, 2)) wheel(w.p);
  // base frame
  c.fillStyle = SHADOW;
  ell(c, cx + 0.04, by + 0.03, 0.4, 0.2);
  c.fill();
  const corners = [P(-len, -half, 0.05), P(len, -half, 0.05), P(len, half, 0.05), P(-len, half, 0.05)];
  poly(c, corners);
  fo(c, shade(WOOD, -0.1), 0.02);
  beam(corners[0], corners[1], 0.04, WOOD);
  beam(corners[3], corners[2], 0.04, WOOD);
  beam(corners[0], corners[3], 0.035, WOOD);
  beam(corners[1], corners[2], 0.035, WOOD);
  // a few spare pumpkins on the cart at higher levels
  if (L >= 1) {
    const sp = P(-len * 0.7, 0, 0.07);
    pumpkin(c, sp[0], sp[1], 0.06, 0, 0, 0, 1);
  }
  if (L >= 2) {
    const sp = P(-len * 0.5, half * 0.6, 0.07);
    pumpkin(c, sp[0], sp[1], 0.055, 1, 0.4 * flicker(t, b.uid), 0, 2);
  }
  // uprights and the cross-bar stop
  const upH = 0.32 + L * 0.03;
  const pivU = 0.02;
  const pivots = [-1, 1].map((s) => ({ base: P(pivU + 0.08, s * half * 0.8, 0.05), top: P(pivU, s * half * 0.8, upH), s }));
  pivots.sort((a, q) => a.base[1] - q.base[1]);
  const drawUp = (pv: (typeof pivots)[0]) => {
    beam(pv.base, pv.top, 0.04, shade(WOOD, 0.08));
    const brace = P(-0.15, pv.s * half * 0.8, 0.05);
    beam(brace, P(pivU - 0.02, pv.s * half * 0.8, upH * 0.7), 0.025, WOOD_D);
  };
  drawUp(pivots[0]);
  // throwing arm: rests pulled back (low behind), swings forward when recoil is high
  const rest = -2.55,
    fwd = -1.2;
  const sw = b.recoil > 0 ? fwd + (rest - fwd) * Math.pow(1 - b.recoil, 2) : rest;
  const armL = 0.42 + L * 0.04;
  const pv = P(pivU, 0, upH);
  const tip = (k: number): [number, number] => {
    // arm in the vertical plane of the aim direction, angle sw from horizontal (forward = +u)
    const u = Math.cos(sw) * armL * k,
      h = -Math.sin(sw) * armL * k;
    return [pv[0] + u * dx, pv[1] + u * dy * 0.6 - h];
  };
  const tail = (k: number): [number, number] => {
    const u = -Math.cos(sw) * 0.12 * k,
      h = Math.sin(sw) * 0.12 * k;
    return [pv[0] + u * dx, pv[1] + u * dy * 0.6 - h];
  };
  // counterweight (an iron-banded crate) at the short end
  const cw = tail(1);
  beam(tail(1), tip(1), 0.04, '#8a6038');
  c.beginPath();
  c.rect(cw[0] - 0.06, cw[1] - 0.02, 0.12, 0.09);
  fo(c, lgrad(c, 0, cw[1] - 0.02, 0, cw[1] + 0.07, [
    [0, shade(WOOD_D, 0.2)],
    [1, WOOD_D],
  ]), 0.016);
  c.strokeStyle = IRON_L;
  c.lineWidth = 0.012;
  line(c, cw[0] - 0.06, cw[1] + 0.025, cw[0] + 0.06, cw[1] + 0.025);
  // bucket + loaded pumpkin
  const bk = tip(1);
  ell(c, bk[0], bk[1], 0.07, 0.04);
  fo(c, WOOD_D, 0.016);
  const loaded = b.recoil < 0.35;
  if (loaded) {
    const k = b.recoil > 0 ? 1 - b.recoil / 0.35 : 1;
    pumpkin(c, bk[0], bk[1] - 0.06 * k, 0.085 * k, 2, 0.7 * flicker(t, b.uid + 3), dx * 0.6, 0, 0);
  }
  // rope
  c.strokeStyle = '#c8a870';
  c.lineWidth = 0.01;
  const rp = P(-len, 0, 0.06);
  const mid = tip(0.55);
  line(c, rp[0], rp[1], mid[0], mid[1]);
  // pivot axle
  c.fillStyle = IRON_L;
  circle(c, pv[0], pv[1], 0.022);
  c.fill();
  drawUp(pivots[1]);
  for (const w of wheels.slice(2)) wheel(w.p);
  if (b.firing > 0) addGlow(c, bk[0], bk[1], 0.4, '#ff8a20', 0.5 * Math.min(1, b.firing * 3));
}

// ------------------------------------------------------------------ 6. spirit lantern (support)

function lanternPost(c: C, L: number) {
  return cached(`aspost|${L}`, pxOf(c), -0.4, -1.25, 0.8, 1.3, (g) => {
    const h = 0.88 + L * 0.1;
    // base block
    g.beginPath();
    g.rect(-0.1, -0.12, 0.2, 0.12);
    fo(g, cyl(g, -0.1, 0.1, STONE, 0.2), 0.016);
    ell(g, 0, -0.12, 0.1, 0.035);
    fo(g, STONE_L, 0.012);
    // post
    g.beginPath();
    g.rect(-0.035, -h, 0.07, h - 0.12);
    fo(g, cyl(g, -0.035, 0.035, '#34323e', 0.35), 0.014, '#000');
    // decorative ring knobs
    for (const k of [0.3, 0.62]) {
      ell(g, 0, -h * k - 0.1, 0.04, 0.018);
      fo(g, IRON_L, 0.01, '#000');
    }
    // crook arm(s)
    g.strokeStyle = IRON;
    g.lineWidth = 0.025;
    g.lineCap = 'round';
    const arm = (s: number) => {
      g.beginPath();
      g.moveTo(0, -h + 0.06);
      g.quadraticCurveTo(s * 0.12, -h - 0.1, s * 0.24, -h - 0.02);
      g.stroke();
      // curl
      g.lineWidth = 0.015;
      g.beginPath();
      g.arc(s * 0.08, -h + 0.04, 0.04, 0, TAU * 0.75);
      g.stroke();
      g.lineWidth = 0.025;
    };
    arm(1);
    if (L >= 2) arm(-1);
    // finial
    g.fillStyle = IRON;
    g.beginPath();
    g.moveTo(0, -h - 0.12);
    g.lineTo(0.025, -h);
    g.lineTo(-0.025, -h);
    g.closePath();
    g.fill();
    if (L >= 1) {
      // iron scroll work at the foot
      g.lineWidth = 0.012;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(0, -0.2);
        g.quadraticCurveTo(s * 0.09, -0.24, s * 0.08, -0.32);
        g.arc(s * 0.06, -0.32, 0.02, 0, TAU * 0.8);
        g.stroke();
      }
    }
  });
}

function hangingLantern(c: C, x: number, y: number, sw: number, t: number, seed: number, s: number) {
  c.save();
  c.translate(x, y);
  c.rotate(sw);
  c.strokeStyle = IRON;
  c.lineWidth = 0.01;
  line(c, 0, 0, 0, 0.05 * s);
  c.translate(0, 0.05 * s);
  const w = 0.11 * s,
    h = 0.16 * s;
  const f = flicker(t, seed);
  // light inside glass
  const g = c.createRadialGradient(0, h * 0.55, 0, 0, h * 0.55, w);
  g.addColorStop(0, '#f4fff8');
  g.addColorStop(0.5, rgba(SPIRIT, 0.95));
  g.addColorStop(1, rgba('#3a9a8a', 0.9));
  c.beginPath();
  c.moveTo(-w * 0.45, h * 0.12);
  c.lineTo(w * 0.45, h * 0.12);
  c.lineTo(w * 0.5, h * 0.9);
  c.lineTo(-w * 0.5, h * 0.9);
  c.closePath();
  c.fillStyle = g;
  c.fill();
  // ghost flame wisp
  flame(c, 0, h * 0.8, h * 0.45, t * 0.7, seed, Math.sin(t * 2 + seed) * 0.3, '#b8fff0', 0);
  // cage
  c.strokeStyle = IRON;
  c.lineWidth = 0.014 * s;
  c.stroke();
  line(c, 0, h * 0.12, 0, h * 0.9);
  // roof
  c.beginPath();
  c.moveTo(-w * 0.62, h * 0.14);
  c.lineTo(0, -h * 0.12);
  c.lineTo(w * 0.62, h * 0.14);
  c.closePath();
  fo(c, IRON, 0.008, '#000');
  c.beginPath();
  c.rect(-w * 0.58, h * 0.88, w * 1.16, h * 0.1);
  fo(c, IRON, 0.008, '#000');
  c.restore();
  addGlow(c, x + Math.sin(sw) * -0.1 * s, y + 0.15 * s, 0.55 * s, SPIRIT, 0.45 * f);
}

function spiritlantern(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.2;
  // ghostly ground mist ring
  addGlow(c, cx, by, 0.6 + L * 0.08, SPIRIT, 0.12 + 0.04 * Math.sin(t * 1.7 + b.x));
  c.drawImage(lanternPost(c, L), cx - 0.4, by - 1.25, 0.8, 1.3);
  const h = 0.88 + L * 0.1;
  const sw = Math.sin(b.spin * 1.3 + t * 0.4) * 0.25;
  hangingLantern(c, cx + 0.24, by - h - 0.02, sw, t, b.uid, 1.35 + L * 0.1);
  if (L >= 2) hangingLantern(c, cx - 0.24, by - h - 0.02, -sw * 0.8, t + 1.3, b.uid + 5, 1.4);
  // drifting wisps
  for (let i = 0; i < 2 + L; i++) {
    const p = (t * 0.25 + i / (2 + L) + hash(b.uid + i) * 0.3) % 1;
    const a = i * 2.4 + t * 0.6;
    const x = cx + Math.cos(a) * (0.25 + p * 0.15),
      y = by - 0.1 - p * 0.7;
    c.fillStyle = rgba(SPIRIT, 0.7 * Math.sin(p * Math.PI));
    circle(c, x, y, 0.018);
    c.fill();
  }
}

// ------------------------------------------------------------------ 7. witch's cauldron

function cauldronPot(c: C, L: number) {
  return cached(`acauld|${L}`, pxOf(c), -0.45, -0.55, 0.9, 0.7, (g) => {
    const r = 0.27 + L * 0.025;
    // stone fire ring
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const x = Math.cos(a) * r * 1.15,
        y = 0.04 + Math.sin(a) * r * 0.45;
      if (Math.sin(a) > 0) continue;
      ell(g, x, y, 0.05, 0.035);
      fo(g, shade(STONE, (hash(i) - 0.5) * 0.3), 0.012);
    }
    // logs
    g.lineCap = 'round';
    for (const [a, bb] of [
      [-0.25, 0.25],
      [0.2, -0.2],
    ]) {
      g.strokeStyle = OUT;
      g.lineWidth = 0.065;
      line(g, a, 0.07, bb, 0.0);
      g.strokeStyle = WOOD_D;
      g.lineWidth = 0.045;
      line(g, a, 0.07, bb, 0.0);
    }
    // legs
    g.fillStyle = IRON;
    for (const s of [-1, 1]) {
      poly(g, [
        [s * r * 0.55, -0.12],
        [s * r * 0.75, 0.02],
        [s * r * 0.6, 0.02],
        [s * r * 0.4, -0.1],
      ]);
      g.fill();
    }
    // pot body
    const cy = -0.2;
    g.beginPath();
    g.moveTo(-r * 0.92, cy - r * 0.32);
    g.bezierCurveTo(-r * 1.15, cy + r * 0.3, -r * 0.7, cy + r * 0.85, 0, cy + r * 0.85);
    g.bezierCurveTo(r * 0.7, cy + r * 0.85, r * 1.15, cy + r * 0.3, r * 0.92, cy - r * 0.32);
    g.closePath();
    const pg = g.createRadialGradient(-r * 0.35, cy - r * 0.1, 0.02, 0, cy + r * 0.2, r * 1.2);
    pg.addColorStop(0, '#5a5870');
    pg.addColorStop(0.45, '#26242f');
    pg.addColorStop(1, '#0a0910');
    fo(g, pg, 0.022, '#000');
    // fire glow on the pot bottom
    g.strokeStyle = 'rgba(255,140,40,0.55)';
    g.lineWidth = 0.02;
    g.beginPath();
    g.ellipse(0, cy + r * 0.3, r * 0.8, r * 0.5, 0, Math.PI * 0.25, Math.PI * 0.75);
    g.stroke();
    if (L >= 2) {
      // engraved violet runes
      g.strokeStyle = rgba(VIOLET, 0.85);
      g.lineWidth = 0.012;
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * r * 0.5,
          y = cy + r * 0.25;
        g.beginPath();
        g.arc(x, y, 0.025, 0.5, 0.5 + Math.PI * 1.3);
        g.stroke();
      }
    }
    // handles
    g.strokeStyle = IRON_L;
    g.lineWidth = 0.02;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(s * r * 1.0, cy - r * 0.1, 0.045, s > 0 ? -1.2 : Math.PI - 1.9, s > 0 ? 1.9 : Math.PI + 1.2);
      g.stroke();
    }
    // rim
    ell(g, 0, cy - r * 0.32, r * 0.95, r * 0.3);
    fo(g, '#3a3848', 0.022, '#000');
  });
}

function cauldron(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.18;
  const r = 0.27 + L * 0.025;
  const fire = Math.min(1, b.firing * 2.5);
  // fire under the pot
  for (let i = 0; i < 3 + L; i++) {
    const x = cx + (i / (2 + L) - 0.5) * r * 1.2;
    flame(c, x, by + 0.04, 0.12 + (i % 2) * 0.04, t, b.uid * 5 + i, 0, '#ff7a20', 0.6);
  }
  if (L >= 1) {
    // a broom leaning on the pot
    c.strokeStyle = WOOD;
    c.lineWidth = 0.025;
    line(c, cx - r * 1.05, by - 0.02, cx - r * 0.55, by - 0.62);
    c.fillStyle = STRAW_D;
    poly(c, [
      [cx - r * 1.05 - 0.05, by + 0.04],
      [cx - r * 1.05 + 0.06, by + 0.04],
      [cx - r * 0.98 + 0.02, by - 0.1],
      [cx - r * 0.98 - 0.03, by - 0.1],
    ]);
    c.fill();
  }
  c.drawImage(cauldronPot(c, L), cx - 0.45, by - 0.55, 0.9, 0.7);
  // brew surface
  const sy = by - 0.2 - r * 0.32;
  const bg = c.createRadialGradient(cx - r * 0.2, sy, 0, cx, sy, r * 0.9);
  bg.addColorStop(0, '#d8ff8a');
  bg.addColorStop(0.5, WITCH);
  bg.addColorStop(1, WITCH_D);
  ell(c, cx, sy + 0.005, r * 0.82, r * 0.24);
  c.fillStyle = bg;
  c.fill();
  // bubbles
  for (let i = 0; i < 4 + L; i++) {
    const p = (b.spin * 0.35 + t * 0.2 + hash(i * 7 + b.uid)) % 1;
    const a = hash(i * 13) * TAU;
    const rr = hash(i * 5) * r * 0.6;
    const x = cx + Math.cos(a) * rr,
      y = sy + Math.sin(a) * rr * 0.28;
    c.strokeStyle = rgba('#efffc8', 0.9 * (1 - p));
    c.lineWidth = 0.008;
    circle(c, x, y - p * 0.02, 0.012 + p * 0.025);
    c.stroke();
  }
  addGlow(c, cx, sy, r * 1.6, WITCH, 0.3 + fire * 0.35);
  // steam wisps
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.3 + i / 3 + hash(b.uid + i)) % 1;
    const x = cx + Math.sin(t * 1.2 + i * 2) * 0.08 + (i - 1) * 0.08,
      y = sy - 0.05 - p * 0.5;
    c.fillStyle = rgba('#b8ffa0', 0.28 * Math.sin(p * Math.PI));
    circle(c, x, y, 0.04 + p * 0.06);
    c.fill();
  }
  // splash on firing
  if (fire > 0) {
    const k = 1 - fire;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.35;
      const v = 0.35 + hash(i + b.uid) * 0.2;
      const x = cx + Math.cos(a) * v * k * 0.8,
        y = sy + Math.sin(a) * v * k + k * k * 0.5;
      c.fillStyle = rgba('#b6ff6a', fire);
      circle(c, x, y, 0.025);
      c.fill();
    }
  }
}
const STRAW_D = '#b08a3a';

// ------------------------------------------------------------------ 8. raven roost

function deadTree(c: C, L: number) {
  return cached(`atree|${L}`, pxOf(c), -0.55, -1.25, 1.1, 1.35, (g) => {
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const trunk = new Path2D();
    const s = 1 + L * 0.1;
    trunk.moveTo(-0.16, 0.02);
    trunk.quadraticCurveTo(-0.08, -0.2 * s, -0.1, -0.45 * s);
    trunk.quadraticCurveTo(-0.14, -0.6 * s, -0.04, -0.72 * s);
    trunk.lineTo(0.04, -0.7 * s);
    trunk.quadraticCurveTo(0.0, -0.55 * s, 0.06, -0.42 * s);
    trunk.quadraticCurveTo(0.08, -0.2 * s, 0.17, 0.02);
    trunk.closePath();
    // roots
    g.fillStyle = SHADOW;
    ell(g, 0.03, 0.02, 0.3, 0.09);
    g.fill();
    g.strokeStyle = '#2a2026';
    g.lineWidth = 0.045;
    for (const [x1, y1] of [
      [-0.28, 0.06],
      [0.27, 0.05],
      [0.05, 0.08],
    ]) {
      g.beginPath();
      g.moveTo(0, -0.05);
      g.quadraticCurveTo(x1 * 0.5, 0.0, x1, y1);
      g.stroke();
    }
    g.fillStyle = lgrad(g, -0.15, 0, 0.15, 0, [
      [0, '#5a4a52'],
      [0.5, '#3a2e36'],
      [1, '#1a1418'],
    ]);
    g.fill(trunk);
    g.strokeStyle = OUT;
    g.lineWidth = 0.02;
    g.stroke(trunk);
    // knot hole
    g.fillStyle = '#0a060a';
    ell(g, -0.01, -0.3 * s, 0.035, 0.05);
    g.fill();
    // branches
    const br = (pts: number[], w: number) => {
      g.strokeStyle = OUT;
      g.lineWidth = w + 0.02;
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
      g.stroke();
      g.strokeStyle = '#3a2e36';
      g.lineWidth = w;
      g.stroke();
    };
    br([-0.08, -0.5 * s, -0.25, -0.62 * s, -0.36, -0.58 * s, -0.42, -0.62 * s, -0.46, -0.75 * s], 0.035);
    br([0.03, -0.62 * s, 0.2, -0.72 * s, 0.38, -0.66 * s], 0.032);
    br([-0.02, -0.7 * s, -0.04, -0.88 * s, 0.06, -1.0 * s], 0.026);
    if (L >= 1) br([0.04, -0.4 * s, 0.22, -0.42 * s, 0.32, -0.5 * s], 0.026);
    if (L >= 2) br([-0.3, -0.6 * s, -0.36, -0.42 * s, -0.42, -0.4 * s], 0.018);
    // twigs
    g.strokeStyle = '#2a2026';
    g.lineWidth = 0.012;
    for (const [x, y, x2, y2] of [
      [-0.42, -0.62, -0.48, -0.55],
      [0.3, -0.69, 0.34, -0.8],
      [0.05, -0.97, 0.12, -1.05],
    ]) {
      g.beginPath();
      g.moveTo(x, y * s);
      g.lineTo(x2, y2 * s);
      g.stroke();
    }
  });
}

function ravens(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.22;
  const s = 1 + L * 0.1;
  c.drawImage(deadTree(c, L), cx - 0.55, by - 1.25, 1.1, 1.35);
  const perches: [number, number, number][] = [
    [-0.38, -0.6, 1],
    [0.33, -0.68, -1],
    [0.04, -0.98, 1],
    [0.28, -0.48, -1],
  ];
  const n = 2 + L;
  const fire = Math.min(1, b.firing * 2);
  for (let i = 0; i < n; i++) {
    const [px, py, dir] = perches[i];
    const x = cx + px,
      y = by + py * s;
    const flyK = fire * (i % 2 === 0 ? 1 : 0.8);
    if (flyK > 0.05) {
      // take off and circle up toward the target
      const a = t * 4 + i * 2;
      const fx = x + Math.cos(b.angle) * flyK * 0.35 + Math.cos(a) * 0.1 * flyK,
        fy = y - flyK * 0.35 + Math.sin(b.angle) * flyK * 0.2;
      ravenFlying(c, fx, fy, 0.1, Math.cos(b.angle) >= 0 ? 1 : -1, t * 18 + i * 1.7);
    } else {
      const ph = b.spin + i * 1.9;
      const bob = Math.sin(ph * 2) * (Math.sin(ph * 0.37) > 0.4 ? 1 : 0.15);
      ravenPerched(c, x, y, 0.1, dir, bob);
    }
  }
  if (L >= 2) {
    // a little lantern hung on a branch
    const lx = cx - 0.42,
      ly = by - 0.6 * s;
    c.strokeStyle = IRON;
    c.lineWidth = 0.008;
    line(c, lx, ly, lx, ly + 0.08);
    pumpkin(c, lx, ly + 0.12, 0.05, 1, 0.8 * flicker(t, b.uid), 0, 0);
  }
}

// ------------------------------------------------------------------ 9. reanimator coil

function reanimatorBody(c: C, L: number) {
  return cached(`areanim|${L}`, pxOf(c), -0.45, -1.2, 0.9, 1.3, (g) => {
    // brass machine box
    const w = 0.5,
      h = 0.2;
    g.beginPath();
    g.rect(-w / 2, -h, w, h);
    fo(g, lgrad(g, 0, -h, 0, 0, [
      [0, '#6a5a4a'],
      [1, '#2a221c'],
    ]), 0.018);
    g.beginPath();
    g.moveTo(-w / 2, -h);
    g.lineTo(-w / 2 + 0.06, -h - 0.07);
    g.lineTo(w / 2 - 0.06, -h - 0.07);
    g.lineTo(w / 2, -h);
    g.closePath();
    fo(g, '#8a7a62', 0.016);
    // rivets & gauge
    g.fillStyle = '#c8a060';
    for (let i = 0; i < 5; i++) {
      circle(g, -w / 2 + 0.05 + i * 0.1, -0.03, 0.01);
      g.fill();
    }
    circle(g, -0.13, -0.11, 0.04);
    fo(g, '#e8e0c8', 0.01);
    g.strokeStyle = '#a01a1a';
    g.lineWidth = 0.008;
    line(g, -0.13, -0.11, -0.1, -0.14);
    // coil column
    const ch = 0.48 + L * 0.1;
    g.beginPath();
    g.rect(0.02, -h - 0.07 - ch, 0.06, ch);
    fo(g, cyl(g, 0.02, 0.08, '#4a4450', 0.3), 0.012, '#000');
    const rings = 5 + L;
    for (let i = 0; i < rings; i++) {
      const y = -h - 0.1 - (i / rings) * (ch - 0.08);
      const rx = 0.13 - (i / rings) * 0.06;
      ell(g, 0.05, y + 0.012, rx, 0.03);
      g.fillStyle = '#5a2a10';
      g.fill();
      ell(g, 0.05, y, rx, 0.028);
      g.fillStyle = lgrad(g, 0.05 - rx, 0, 0.05 + rx, 0, [
        [0, '#ffc080'],
        [0.4, '#d07a36'],
        [1, '#6a3410'],
      ]);
      g.fill();
      g.strokeStyle = 'rgba(30,10,0,0.8)';
      g.lineWidth = 0.008;
      g.stroke();
    }
    // top sphere socket
    ell(g, 0.05, -h - 0.07 - ch, 0.05, 0.02);
    fo(g, IRON_L, 0.01, '#000');
  });
}

function jar(c: C, x: number, y: number, s: number, t: number, seed: number, fire: number) {
  const w = 0.11 * s,
    h = 0.22 * s;
  // fluid
  c.beginPath();
  c.rect(x - w / 2, y - h * 0.82, w, h * 0.82);
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, rgba('#9affc8', 0.95));
  g.addColorStop(0.5, rgba('#3ad08a', 0.9));
  g.addColorStop(1, rgba('#147a4a', 0.95));
  c.fillStyle = g;
  c.fill();
  // bubbles
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + hash(seed + i)) % 1;
    c.fillStyle = 'rgba(230,255,240,0.8)';
    circle(c, x + (hash(seed * 3 + i) - 0.5) * w * 0.6, y - p * h * 0.75, 0.008 * s);
    c.fill();
  }
  // a little floating... pickled pumpkin seedling
  c.fillStyle = 'rgba(40,90,40,0.8)';
  ell(c, x, y - h * 0.4 + Math.sin(t * 1.5 + seed) * 0.01, w * 0.2, w * 0.14);
  c.fill();
  // glass
  c.beginPath();
  c.rect(x - w / 2, y - h, w, h);
  c.fillStyle = 'rgba(200,255,240,0.12)';
  c.fill();
  c.strokeStyle = 'rgba(200,240,230,0.8)';
  c.lineWidth = 0.01;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = 0.008;
  line(c, x - w * 0.3, y - h * 0.9, x - w * 0.3, y - h * 0.15);
  // brass caps
  c.beginPath();
  c.rect(x - w * 0.6, y - h - 0.025 * s, w * 1.2, 0.03 * s);
  fo(c, '#b8904a', 0.008);
  c.beginPath();
  c.rect(x - w * 0.6, y - 0.01, w * 1.2, 0.025 * s);
  fo(c, '#b8904a', 0.008);
  addGlow(c, x, y - h * 0.45, 0.2 * s, '#7affc0', 0.3 + fire * 0.4);
}

function sparkBolt(c: C, x0: number, y0: number, x1: number, y1: number, rng: TRng, w: number, col: string) {
  const n = 5;
  c.beginPath();
  c.moveTo(x0, y0);
  for (let i = 1; i < n; i++) {
    const k = i / n;
    c.lineTo(x0 + (x1 - x0) * k + rng.range(-0.05, 0.05), y0 + (y1 - y0) * k + rng.range(-0.05, 0.05));
  }
  c.lineTo(x1, y1);
  c.strokeStyle = rgba(col, 0.6);
  c.lineWidth = w * 2.4;
  c.stroke();
  c.strokeStyle = '#f0fff8';
  c.lineWidth = w;
  c.stroke();
}

function reanimator(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.2;
  const fire = Math.min(1, b.firing * 2.5);
  c.fillStyle = SHADOW;
  ell(c, cx + 0.04, by + 0.02, 0.32, 0.1);
  c.fill();
  c.drawImage(reanimatorBody(c, L), cx - 0.45, by - 1.2, 0.9, 1.3);
  // jars on the box
  jar(c, cx - 0.15, by - 0.24, 0.9, t, b.uid, fire);
  if (L >= 1) jar(c, cx + 0.2, by - 0.24, 0.75, t + 2, b.uid + 3, fire);
  // the big lever on the side: thrown down when firing
  const la = -1.1 + fire * 1.0;
  const lx = cx + 0.27,
    ly = by - 0.1;
  c.lineCap = 'round';
  c.strokeStyle = OUT;
  c.lineWidth = 0.04;
  line(c, lx, ly, lx + Math.cos(la) * 0.22, ly + Math.sin(la) * 0.22);
  c.strokeStyle = '#8a8898';
  c.lineWidth = 0.022;
  line(c, lx, ly, lx + Math.cos(la) * 0.22, ly + Math.sin(la) * 0.22);
  c.fillStyle = '#c02a2a';
  circle(c, lx + Math.cos(la) * 0.23, ly + Math.sin(la) * 0.23, 0.03);
  fo(c, '#c02a2a', 0.01);
  c.fillStyle = IRON_L;
  circle(c, lx, ly, 0.02);
  c.fill();
  // top orb + crackle
  const ch = 0.48 + L * 0.1;
  const ox = cx + 0.05,
    oy = by - 0.2 - 0.07 - ch - 0.06;
  const og = c.createRadialGradient(ox - 0.02, oy - 0.02, 0, ox, oy, 0.07);
  og.addColorStop(0, '#ffffff');
  og.addColorStop(0.4, '#b8ffdc');
  og.addColorStop(1, '#2a9a6a');
  circle(c, ox, oy, 0.065);
  fo(c, og, 0.012, '#103a2a');
  addGlow(c, ox, oy, 0.35 + fire * 0.3, '#7affc0', 0.4 + fire * 0.5);
  const rng = new TRng(Math.floor(t * 16) * 131 + b.uid * 977);
  const n = fire > 0 ? 4 + L : 1 + (rng.next() < 0.5 ? 1 : 0);
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) {
    const a = rng.next() * TAU;
    const len = (fire > 0 ? 0.25 : 0.12) + rng.next() * 0.15;
    sparkBolt(c, ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len * 0.8, rng, 0.012, '#7affc0');
  }
  // arc from the coil down to the jar
  if (fire > 0 || rng.next() < 0.25) sparkBolt(c, ox - 0.06, by - 0.5, cx - 0.15, by - 0.45, rng, 0.008, '#7affc0');
  c.globalCompositeOperation = 'source-over';
}

// ------------------------------------------------------------------ 10. reaper's scythe

function pedestal(c: C, L: number) {
  return cached(`aped|${L}`, pxOf(c), -0.35, -0.4, 0.7, 0.5, (g) => {
    const w = 0.4,
      h = 0.18;
    ell(g, 0, 0, w * 0.6, w * 0.2);
    fo(g, STONE_D, 0.016);
    g.beginPath();
    g.rect(-w / 2, -h, w, h);
    fo(g, cyl(g, -w / 2, w / 2, STONE, 0.22), 0.018);
    ell(g, 0, -h, w / 2, w * 0.17);
    fo(g, shade(STONE, 0.2), 0.016);
    // ivy
    g.strokeStyle = '#3e5a2a';
    g.lineWidth = 0.012;
    g.beginPath();
    g.moveTo(-w / 2 + 0.02, 0);
    g.bezierCurveTo(-0.1, -0.05, -0.18, -0.1, -0.05, -h);
    g.stroke();
    // engraved ring
    g.strokeStyle = rgba('#c0c8ff', L >= 1 ? 0.7 : 0.35);
    g.lineWidth = 0.01;
    ell(g, 0, -h, w * 0.36, w * 0.11);
    g.stroke();
  });
}

function reaper(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.2;
  const col = '#c0c8ff';
  const fire = Math.min(1, b.firing * 2);
  c.drawImage(pedestal(c, L), cx - 0.35, by - 0.4, 0.7, 0.5);
  // ghostly light pooling on the pedestal
  addGlow(c, cx, by - 0.2, 0.4, col, 0.2);
  const dir = Math.cos(b.angle) >= 0 ? 1 : -1;
  const hover = Math.sin(t * 1.6 + b.uid) * 0.03;
  const s = 1 + L * 0.1;
  const fy = by - 0.32 + hover; // hem height
  c.save();
  c.translate(cx, fy);
  c.scale(dir * s, s);
  // scythe behind the cloak when idle, sweeping in front when firing
  const sweep = fire > 0 ? Math.sin((1 - fire) * Math.PI) : 0;
  const drawScythe = () => {
    c.save();
    c.translate(0.12, -0.38);
    c.rotate(-0.35 + sweep * 1.9 - (1 - fire) * 0 + (fire > 0 ? (Math.sin(b.angle) * 0.3) : 0));
    // staff
    c.lineCap = 'round';
    c.strokeStyle = OUT;
    c.lineWidth = 0.04;
    line(c, 0, 0.32, 0, -0.42);
    c.strokeStyle = '#4a3a3a';
    c.lineWidth = 0.024;
    line(c, 0, 0.32, 0, -0.42);
    // blade
    c.beginPath();
    c.moveTo(0, -0.42);
    c.quadraticCurveTo(-0.22, -0.52, -0.42, -0.3);
    c.quadraticCurveTo(-0.22, -0.4, 0.0, -0.34);
    c.closePath();
    const bg = c.createLinearGradient(0, -0.5, -0.3, -0.3);
    bg.addColorStop(0, '#f0f4ff');
    bg.addColorStop(1, '#8a92b8');
    fo(c, bg, 0.014, '#1a1a2a');
    if (L >= 1 || fire > 0) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(col, 0.5 + fire * 0.5);
      c.lineWidth = 0.02;
      c.beginPath();
      c.moveTo(0, -0.42);
      c.quadraticCurveTo(-0.22, -0.52, -0.42, -0.3);
      c.stroke();
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  };
  if (fire <= 0) drawScythe();
  // cloak
  const wv = (k: number) => Math.sin(t * 3 + k * 2 + b.uid) * 0.03;
  const cloak = new Path2D();
  cloak.moveTo(-0.08, -0.68);
  cloak.quadraticCurveTo(-0.2, -0.65, -0.21, -0.45);
  cloak.quadraticCurveTo(-0.24, -0.2, -0.22, 0.02 + wv(0));
  // tattered hem
  for (let i = 0; i < 5; i++) {
    const x0 = -0.22 + (i + 0.5) * 0.088,
      x1 = -0.22 + (i + 1) * 0.088;
    cloak.lineTo(x0, -0.06 + wv(i));
    cloak.lineTo(x1, 0.04 + wv(i + 1) + (i % 2) * 0.03);
  }
  cloak.quadraticCurveTo(0.24, -0.25, 0.18, -0.48);
  cloak.quadraticCurveTo(0.14, -0.66, 0.0, -0.69);
  cloak.closePath();
  const cg = c.createLinearGradient(-0.2, -0.7, 0.2, 0.0);
  cg.addColorStop(0, '#3a3a5a');
  cg.addColorStop(0.6, '#1a1a2c');
  cg.addColorStop(1, rgba('#1a1a2c', 0.4));
  c.fillStyle = cg;
  c.fill(cloak);
  c.strokeStyle = rgba(col, 0.55);
  c.lineWidth = 0.014;
  c.stroke(cloak);
  // folds
  c.strokeStyle = 'rgba(0,0,0,0.5)';
  c.lineWidth = 0.012;
  line(c, -0.06, -0.45, -0.1, -0.05);
  line(c, 0.06, -0.42, 0.08, -0.04);
  // sleeve/arm reaching to the scythe
  c.beginPath();
  c.moveTo(0.02, -0.5);
  c.quadraticCurveTo(0.14, -0.42, 0.16, -0.34);
  c.lineTo(0.09, -0.32);
  c.quadraticCurveTo(0.06, -0.4, -0.02, -0.44);
  c.closePath();
  fo(c, '#26263c', 0.01, rgba(col, 0.5));
  // hood: dark void with two faint eyes
  c.beginPath();
  c.moveTo(0.0, -0.84);
  c.quadraticCurveTo(0.17, -0.8, 0.15, -0.6);
  c.quadraticCurveTo(0.03, -0.52, -0.12, -0.58);
  c.quadraticCurveTo(-0.16, -0.78, 0.0, -0.84);
  c.closePath();
  fo(c, '#2c2c48', 0.012, rgba(col, 0.6));
  ell(c, 0.04, -0.66, 0.08, 0.075);
  c.fillStyle = '#05040a';
  c.fill();
  const ef = 0.7 + 0.3 * Math.sin(t * 2.2 + b.uid) + fire * 0.4;
  c.fillStyle = rgba('#e0ecff', Math.min(1, ef));
  circle(c, 0.01, -0.67, 0.014);
  c.fill();
  circle(c, 0.07, -0.67, 0.014);
  c.fill();
  if (fire > 0) drawScythe();
  c.restore();
  addGlow(c, cx + dir * 0.04 * s, fy - 0.67 * s, 0.12, '#cfe0ff', 0.5 * ef);
  // sweep arc
  if (fire > 0) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(col, 0.55 * fire);
    c.lineWidth = 0.05 * fire;
    c.beginPath();
    c.ellipse(cx, by - 0.3, 0.45, 0.25, 0, b.angle - 1.2, b.angle + 1.2);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
  if (L >= 2) {
    for (let i = 0; i < 3; i++) {
      const a = t * 1.2 + (i / 3) * TAU;
      const x = cx + Math.cos(a) * 0.3,
        y = by - 0.4 + Math.sin(a) * 0.1;
      c.fillStyle = rgba(col, 0.6);
      circle(c, x, y, 0.02);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ 11. midnight clock (colossal)

function clockBody(c: C, L: number) {
  return cached(`aclock|${L}`, pxOf(c), -0.6, -2.05, 1.2, 2.15, (g) => {
    const H = 1.25 + L * 0.12; // body height to the eaves
    const lean = 0.06; // crooked: the top leans right
    const w0 = 0.46,
      w1 = 0.38;
    g.fillStyle = SHADOW;
    ell(g, 0.08, 0.03, 0.48, 0.15);
    g.fill();
    // stepped base
    g.beginPath();
    g.rect(-0.3, -0.14, 0.6, 0.14);
    fo(g, cyl(g, -0.3, 0.3, STONE_D, 0.25), 0.018);
    // tower body (a trapezoid leaning right)
    const body = new Path2D();
    body.moveTo(-w0 / 2, -0.12);
    body.lineTo(-w1 / 2 + lean, -H);
    body.lineTo(w1 / 2 + lean, -H);
    body.lineTo(w0 / 2, -0.12);
    body.closePath();
    g.fillStyle = lgrad(g, -w0 / 2, 0, w0 / 2, 0, [
      [0, shade(STONE, 0.12)],
      [0.4, STONE],
      [1, STONE_D],
    ]);
    g.fill(body);
    // stone courses
    g.save();
    g.clip(body);
    g.strokeStyle = 'rgba(20,20,40,0.35)';
    g.lineWidth = 0.008;
    for (let y = -0.2; y > -H; y -= 0.09) {
      line(g, -0.4, y, 0.5, y);
      const off = (Math.round(y * 100) % 2 ? 0.05 : 0) - 0.1;
      for (let x = off; x < 0.4; x += 0.14) line(g, x + lean * (-y / H), y, x + lean * (-y / H), y + 0.09);
    }
    // ivy on the left
    g.fillStyle = 'rgba(60,90,40,0.75)';
    for (let i = 0; i < 18; i++) {
      const y = -0.15 - hash(i * 3 + L) * H * 0.6;
      ell(g, -w0 / 2 + 0.03 + hash(i * 7) * 0.06, y, 0.03, 0.02, hash(i) * 3);
      g.fill();
    }
    g.restore();
    g.strokeStyle = OUT;
    g.lineWidth = 0.022;
    g.stroke(body);
    // arched door
    g.beginPath();
    g.moveTo(-0.07, -0.12);
    g.lineTo(-0.07, -0.26);
    g.arc(0.0, -0.26, 0.07, Math.PI, 0);
    g.lineTo(0.07, -0.12);
    g.closePath();
    fo(g, '#1a1014', 0.014);
    g.strokeStyle = WOOD;
    g.lineWidth = 0.008;
    line(g, 0, -0.13, 0, -0.32);
    // lit lancet windows
    const win = (x: number, y: number) => {
      g.beginPath();
      g.moveTo(x - 0.03, y);
      g.lineTo(x - 0.03, y - 0.07);
      g.quadraticCurveTo(x, y - 0.12, x + 0.03, y - 0.07);
      g.lineTo(x + 0.03, y);
      g.closePath();
      fo(g, '#ffc04a', 0.01);
    };
    win(-0.05 + lean * 0.4, -0.55 - L * 0.04);
    if (L >= 1) win(0.08 + lean * 0.4, -0.5 - L * 0.04);
    // clock housing (round panel near the top)
    const fy = -H + 0.24,
      fx = lean * (1 - 0.24 / H);
    circle(g, fx, fy, 0.2);
    fo(g, STONE_L, 0.02);
    circle(g, fx, fy, 0.17);
    fo(g, '#2a2420', 0.016);
    // eaves / belfry
    const ex = lean;
    g.beginPath();
    g.rect(-w1 / 2 - 0.04 + ex, -H - 0.04, w1 + 0.08, 0.05);
    fo(g, STONE_L, 0.016);
    const bh = 0.24;
    g.beginPath();
    g.rect(-w1 / 2 + 0.02 + ex, -H - 0.04 - bh, w1 - 0.04, bh);
    fo(g, STONE, 0.016);
    // belfry opening with a bell
    g.beginPath();
    g.moveTo(ex - 0.08, -H - 0.06);
    g.lineTo(ex - 0.08, -H - 0.04 - bh * 0.6);
    g.arc(ex, -H - 0.04 - bh * 0.6, 0.08, Math.PI, 0);
    g.lineTo(ex + 0.08, -H - 0.06);
    g.closePath();
    fo(g, '#0e0a14', 0.012);
    if (L >= 1) {
      g.beginPath();
      g.moveTo(ex - 0.05, -H - 0.08);
      g.quadraticCurveTo(ex - 0.045, -H - 0.18, ex, -H - 0.19);
      g.quadraticCurveTo(ex + 0.045, -H - 0.18, ex + 0.05, -H - 0.08);
      g.closePath();
      fo(g, '#c8a04a', 0.01);
    }
    // crooked spire roof
    const ry = -H - 0.04 - bh;
    const tipX = ex + 0.12,
      tipY = ry - 0.5 - L * 0.08;
    g.beginPath();
    g.moveTo(-w1 / 2 - 0.06 + ex, ry + 0.02);
    g.quadraticCurveTo(ex - 0.06, ry - 0.2, tipX, tipY);
    g.quadraticCurveTo(ex + 0.1, ry - 0.18, w1 / 2 + 0.06 + ex, ry + 0.02);
    g.closePath();
    fo(g, lgrad(g, ex - 0.2, 0, ex + 0.25, 0, [
      [0, '#4a3a6a'],
      [0.5, '#2e2448'],
      [1, '#16122a'],
    ]), 0.02);
    // shingle lines
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.lineWidth = 0.008;
    for (let k = 1; k < 4; k++) {
      const yy = ry - k * 0.11;
      line(g, ex - 0.2 + k * 0.05, yy + 0.02, ex + 0.2 - k * 0.02, yy + 0.02);
    }
    // weathervane: a crescent moon
    g.strokeStyle = IRON;
    g.lineWidth = 0.012;
    line(g, tipX, tipY, tipX + 0.01, tipY - 0.1);
    g.fillStyle = '#e8d890';
    g.beginPath();
    g.arc(tipX + 0.01, tipY - 0.14, 0.04, 0, TAU);
    g.arc(tipX + 0.03, tipY - 0.15, 0.033, 0, TAU, true);
    g.fill();
    if (L >= 2) {
      // little pinnacles at the eaves corners
      for (const s of [-1, 1]) {
        const x = ex + s * (w1 / 2 + 0.02);
        g.beginPath();
        g.moveTo(x - 0.03, -H - 0.04);
        g.lineTo(x, -H - 0.2);
        g.lineTo(x + 0.03, -H - 0.04);
        g.closePath();
        fo(g, '#2e2448', 0.01);
      }
    }
  });
}

function clocktower(c: C, b: Building, cx: number, cy: number, t: number) {
  const L = b.level;
  const by = cy + 0.25;
  const fire = Math.min(1, b.firing * 1.5);
  c.drawImage(clockBody(c, L), cx - 0.6, by - 2.05, 1.2, 2.15);
  const H = 1.25 + L * 0.12;
  const lean = 0.06;
  const fx = cx + lean * (1 - 0.24 / H),
    fy = by - H + 0.24;
  // glowing face
  const R = 0.155;
  const fg = c.createRadialGradient(fx - 0.03, fy - 0.03, 0, fx, fy, R);
  fg.addColorStop(0, '#fffbe6');
  fg.addColorStop(0.6, fire > 0 ? '#fff0b0' : '#ffe8a0');
  fg.addColorStop(1, '#d8a040');
  circle(c, fx, fy, R);
  c.fillStyle = fg;
  c.fill();
  // hour marks
  c.strokeStyle = '#3a2a18';
  c.lineWidth = 0.01;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const r0 = i % 3 ? 0.125 : 0.11;
    line(c, fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, fx + Math.cos(a) * 0.145, fy + Math.sin(a) * 0.145);
  }
  // hands
  const ha = b.spin * 0.083 - Math.PI / 2,
    ma = b.spin - Math.PI / 2;
  c.lineCap = 'round';
  c.strokeStyle = '#1a120a';
  c.lineWidth = 0.022;
  line(c, fx, fy, fx + Math.cos(ha) * 0.08, fy + Math.sin(ha) * 0.08);
  c.lineWidth = 0.014;
  line(c, fx, fy, fx + Math.cos(ma) * 0.125, fy + Math.sin(ma) * 0.125);
  c.fillStyle = '#1a120a';
  circle(c, fx, fy, 0.016);
  c.fill();
  addGlow(c, fx, fy, 0.45 + fire * 0.6, '#ffe8a0', 0.35 + fire * 0.55);
  // windows glow
  addGlow(c, cx - 0.05 + lean * 0.4, by - 0.6 - L * 0.04, 0.15, '#ffb040', 0.3);
  if (fire > 0) {
    // ghostly chime rings pulsing out from the face
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++) {
      const p = (1 - fire + k * 0.35) % 1;
      c.strokeStyle = rgba('#fff0c0', 0.7 * (1 - p) * fire);
      c.lineWidth = 0.03;
      circle(c, fx, fy, R + p * 0.9);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  }
  if (L >= 1) {
    // bats circling the spire
    const n = L + 1;
    for (let i = 0; i < n; i++) {
      const a = t * 1.3 + (i / n) * TAU + b.uid;
      const x = cx + lean + Math.cos(a) * 0.45,
        y = by - H - 0.55 + Math.sin(a) * 0.12;
      const fl = Math.sin(t * 16 + i * 2);
      c.fillStyle = '#120e1a';
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x - 0.03, y - 0.03 * fl - 0.01, x - 0.06, y - 0.02 * fl);
      c.quadraticCurveTo(x - 0.03, y + 0.005, x, y + 0.012);
      c.quadraticCurveTo(x + 0.03, y + 0.005, x + 0.06, y - 0.02 * fl);
      c.quadraticCurveTo(x + 0.03, y - 0.03 * fl - 0.01, x, y);
      c.fill();
    }
  }
}

// ------------------------------------------------------------------ dispatch

const NO_PLINTH = new Set(['fence', 'saltring', 'pumpkinpatch']);

export function drawAutumnBuilding(ctx: C, b: Building, t: number, game: Game): void {
  const id = b.def.id;
  const cx = b.x + 0.5,
    cy = b.y + 0.5;
  ctx.save();
  if (!NO_PLINTH.has(id)) plinth(ctx, b);
  if (b.hp < b.maxHp * 0.5 && id !== 'fence' && id !== 'saltring') cracks(ctx, b);
  switch (id) {
    case 'fence':
      fence(ctx, b, game, t);
      break;
    case 'candle':
      candle(ctx, b, cx, cy, t);
      break;
    case 'saltring':
      saltring(ctx, b, t);
      break;
    case 'pumpkinpatch':
      pumpkinpatch(ctx, b, cx, cy, t);
      break;
    case 'catapult':
      catapult(ctx, b, cx, cy, t);
      break;
    case 'spiritlantern':
      spiritlantern(ctx, b, cx, cy, t);
      break;
    case 'cauldron':
      cauldron(ctx, b, cx, cy, t);
      break;
    case 'ravens':
      ravens(ctx, b, cx, cy, t);
      break;
    case 'reanimator':
      reanimator(ctx, b, cx, cy, t);
      break;
    case 'reaper':
      reaper(ctx, b, cx, cy, t);
      break;
    case 'clocktower':
      clocktower(ctx, b, cx, cy, t);
      break;
  }
  if (id !== 'fence') pips(ctx, cx, b.y + (id === 'saltring' || id === 'pumpkinpatch' ? 0.95 : 0.92), b.level);
  if (b.hurt > 0) glow(ctx, cx, cy - 0.1, 0.65, '#ff3030', Math.min(1, b.hurt * 5) * 0.65);
  ctx.restore();
}

export function autumnIconTall(id: string): number {
  if (id === 'clocktower') return 1.25;
  if (id === 'spiritlantern' || id === 'ravens' || id === 'reanimator') return 1;
  if (id === 'candle' || id === 'reaper' || id === 'catapult') return 0.5;
  return 0;
}

// silence unused-import lint for palette entries kept for consistency
void BONE;
void PUMPKIN;
void PUMPKIN_D;
