// Spring campaign art: shared palette and small drawing helpers (storybook cottage garden).
import { cached, hash, pxOf, rgba, shade } from './util';

export type C = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;

// palette
export const LEAF = '#5fae4a';
export const LEAF_LIGHT = '#9ad65a';
export const LEAF_DARK = '#2f6a2a';
export const MOSS = '#7a9a4a';
export const SOIL = '#6b4a2e';
export const SOIL_DARK = '#3e2a18';
export const BARK = '#7a5636';
export const BARK_DARK = '#4a321e';
export const STONE = '#a8a594';
export const TERRA = '#c86a42';
export const PETAL = '#ffb6cf';
export const PETAL_WHITE = '#fff6f2';
export const POLLEN = '#ffd23a';
export const POLLEN_LIGHT = '#fff2a0';
export const BRASS = '#d0a040';
export const OUT = 'rgba(38,32,18,0.9)';
export const SHADOW = 'rgba(30,50,16,0.28)';

export function circle(c: C, x: number, y: number, r: number) {
  c.beginPath();
  c.arc(x, y, Math.max(0.0005, r), 0, TAU);
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.0005, rx), Math.max(0.0005, ry), rot, 0, TAU);
}

/** Fill + crisp outline. */
export function fo(c: C, fill: string | CanvasGradient, lw = 0.02, stroke: string = OUT) {
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = lw;
  c.stroke();
}

export function dropShadow(c: C, x: number, y: number, rx: number, ry: number) {
  c.fillStyle = SHADOW;
  ell(c, x, y, rx, ry);
  c.fill();
}

/** Radial "lit from upper-left" gradient for a round body. */
export function ballGrad(c: C, x: number, y: number, r: number, base: string, hi = 0.35, lo = -0.4) {
  const g = c.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.1);
  g.addColorStop(0, shade(base, hi));
  g.addColorStop(0.5, base);
  g.addColorStop(1, shade(base, lo));
  return g;
}

export function hGrad(c: C, x0: number, x1: number, base: string, hi = 0.18, lo = -0.3) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(base, hi));
  g.addColorStop(0.45, base);
  g.addColorStop(1, shade(base, lo));
  return g;
}

/** A pointed leaf from (x,y) along angle a, length len, width w. */
export function leaf(c: C, x: number, y: number, a: number, len: number, w: number, col: string, lw = 0.012, vein = true) {
  const dx = Math.cos(a),
    dy = Math.sin(a);
  const nx = -dy,
    ny = dx;
  const tx = x + dx * len,
    ty = y + dy * len;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + dx * len * 0.45 + nx * w, y + dy * len * 0.45 + ny * w, tx, ty);
  c.quadraticCurveTo(x + dx * len * 0.45 - nx * w, y + dy * len * 0.45 - ny * w, x, y);
  c.closePath();
  if ((c.canvas as HTMLCanvasElement).isConnected) fo(c, col, lw); // live frame: keep it cheap
  else {
    const g = c.createLinearGradient(x + nx * w, y + ny * w, x - nx * w, y - ny * w);
    g.addColorStop(0, shade(col, 0.18));
    g.addColorStop(1, shade(col, -0.22));
    fo(c, g, lw);
  }
  if (vein) {
    c.strokeStyle = rgba(shade(col, -0.45), 0.55);
    c.lineWidth = lw * 0.6;
    c.beginPath();
    c.moveTo(x + dx * len * 0.08, y + dy * len * 0.08);
    c.lineTo(x + dx * len * 0.8, y + dy * len * 0.8);
    c.stroke();
  }
}

/** A tiny five-petal flower. */
export function flower(c: C, x: number, y: number, r: number, petal: string, centre = POLLEN, rot = 0) {
  c.fillStyle = petal;
  c.strokeStyle = rgba(shade(petal, -0.5), 0.7);
  c.lineWidth = r * 0.18;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rot + (i / 5) * TAU;
    const px = x + Math.cos(a) * r * 0.55,
      py = y + Math.sin(a) * r * 0.55;
    c.moveTo(px + r * 0.45, py);
    c.arc(px, py, r * 0.45, 0, TAU);
  }
  c.stroke();
  c.fill();
  c.fillStyle = centre;
  circle(c, x, y, r * 0.32);
  c.fill();
}

/** Mossy stone. */
export function stone(c: C, x: number, y: number, rx: number, ry: number, seed: number, mossy = true, col = STONE) {
  ell(c, x, y + ry * 0.35, rx, ry);
  c.fillStyle = shade(col, -0.4);
  c.fill();
  ell(c, x, y, rx, ry * 0.92, (hash(seed) - 0.5) * 0.4);
  const g = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
  g.addColorStop(0, shade(col, 0.25));
  g.addColorStop(1, shade(col, -0.2));
  fo(c, g, Math.min(0.016, rx * 0.2));
  if (mossy) {
    c.fillStyle = rgba(MOSS, 0.9);
    ell(c, x - rx * 0.2, y - ry * 0.4, rx * 0.55, ry * 0.35, -0.2);
    c.fill();
    c.fillStyle = rgba('#a8c86a', 0.8);
    ell(c, x - rx * 0.3, y - ry * 0.5, rx * 0.25, ry * 0.15, -0.2);
    c.fill();
  }
}

/** Garden bed under a plant tower: soil mound ringed with mossy stones, flowers with level. */
export function bedCanvas(c: C, level: number, r = 0.4) {
  return cached(`sp-bed|${level}|${r}`, pxOf(c), -0.1, -0.05, 1.2, 1.2, (g) => {
    const cx = 0.5,
      cy = 0.6;
    dropShadow(g, cx + 0.05, cy + 0.08, r + 0.04, (r + 0.04) * 0.62);
    // soil
    ell(g, cx, cy, r * 0.92, r * 0.58);
    const sg = g.createRadialGradient(cx - 0.08, cy - 0.06, 0.02, cx, cy, r);
    sg.addColorStop(0, shade(SOIL, 0.15));
    sg.addColorStop(1, SOIL_DARK);
    fo(g, sg, 0.02);
    // soil crumbs
    g.fillStyle = rgba(SOIL_DARK, 0.7);
    for (let i = 0; i < 9; i++) {
      const a = hash(i * 7 + level) * TAU,
        d = hash(i * 13) * r * 0.6;
      circle(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 0.012);
      g.fill();
    }
    // stone ring (back stones first)
    const n = 9 + level * 2;
    const stones: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.2;
      stones.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.62, a]);
    }
    stones.sort((p, q) => p[1] - q[1]);
    for (const [x, y, a] of stones) {
      const k = 0.85 + hash(Math.round(a * 100)) * 0.3;
      if (level >= 2 && Math.sin(a) > 0.2) {
        // terracotta edging tiles at the front on the grandest bed
        g.beginPath();
        g.roundRect(x - 0.05, y - 0.05, 0.1, 0.09, 0.02);
        fo(g, hGrad(g, x - 0.05, x + 0.05, TERRA), 0.012);
      } else stone(g, x, y, 0.065 * k, 0.045 * k, Math.round(a * 100), true);
    }
    if (level >= 1) {
      for (let i = 0; i < 3 + level * 2; i++) {
        const a = hash(i * 31 + 5) * TAU;
        const x = cx + Math.cos(a) * (r + 0.02),
          y = cy + Math.sin(a) * (r + 0.02) * 0.62;
        flower(g, x, y - 0.03, 0.035, i % 3 === 0 && level >= 2 ? PETAL : PETAL_WHITE, POLLEN, a);
      }
    }
  });
}

export function bed(c: C, x: number, y: number, level: number, r = 0.4) {
  c.drawImage(bedCanvas(c, level, r), x - 0.1, y - 0.05, 1.2, 1.2);
}

/** Level pips: small flowers in a row. */
export function pips(c: C, cx: number, y: number, level: number) {
  const cv = cached(`sp-pips|${level}`, pxOf(c), -0.2, -0.06, 0.4, 0.12, (g) => {
    for (let i = 0; i <= level; i++) flower(g, (i - level / 2) * 0.1, 0, 0.045, level >= 2 ? PETAL : PETAL_WHITE, POLLEN, 0.3);
  });
  c.drawImage(cv, cx - 0.2, y - 0.06, 0.4, 0.12);
}

/** Fallen brown leaves around a damaged plant. */
export function wilt(c: C, x: number, y: number, seed: number) {
  for (let i = 0; i < 4; i++) {
    const a = hash(seed + i) * TAU;
    leaf(c, x + Math.cos(a) * 0.28, y + Math.sin(a) * 0.15, a + 1.2, 0.09, 0.03, i % 2 ? '#a07a3a' : '#8a6030', 0.008, false);
  }
}
