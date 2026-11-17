// GLUP — el mundo: la tierra del pantano con autotiles, el agua, las piezas del
// decorado y los fondos en capas. Se carga después de art.js y reemplaza sus
// versiones sencillas de esas piezas; los personajes siguen viviendo en art.js.
// Luz de la luna (o del sol) desde arriba a la izquierda: bordes superiores e
// izquierdos iluminados, bajos y derechos en sombra. Nada de negro puro.
'use strict';
const MUNDO = (() => {
  // ---------------------------------------------------------------- Color y ruido
  const rgbCache = new Map();
  function rgb(c) {
    if (typeof c !== 'string') return c;
    let v = rgbCache.get(c); if (v) return v;
    let h = c.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&');
    const n = parseInt(h, 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; rgbCache.set(c, v); return v;
  }
  function mix(a, b, t) { a = rgb(a); b = rgb(b); return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  const css = c => { c = rgb(c); return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1); };
  // Evenly spaced colours through a list of key colours.
  function ramp(keys, n) {
    const out = []; for (let i = 0; i < n; i++) { const t = i / (n - 1) * (keys.length - 1), k = Math.min(keys.length - 2, t | 0); out.push(mix(keys[k], keys[k + 1], t - k)); }
    return out;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  const dith = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];
  // Pick from a ramp with an ordered dither between neighbouring steps; t in 0..1.
  function pick(r, t, x, y) { const n = r.length - 1; let i = Math.floor(t * n + dith(x, y)); return r[i < 0 ? 0 : i > n ? n : i]; }
  // White noise from a 1024×1024 table (a real hash per pixel is too slow for whole levels on phones).
  const RT = new Float32Array(1 << 20);
  { let h = 2463534242; for (let i = 0; i < RT.length; i++) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; RT[i] = (h >>> 0) / 4294967296; } }
  const hash = (x, y, s) => RT[((x + s * 97) & 1023) | (((y + s * 57) & 1023) << 10)];
  function noise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = (xi + s * 97) & 1023, x1 = (x0 + 1) & 1023, y0 = ((yi + s * 57) & 1023) << 10, y1 = ((yi + 1 + s * 57) & 1023) << 10;
    const a = RT[x0 | y0], b = RT[x1 | y0], c = RT[x0 | y1], d = RT[x1 | y1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };

  // ---------------------------------------------------------------- Lienzos de píxeles
  function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.w = w; c.h = h; return c; }
  function Buf(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4) }; }
  function put(b, x, y, c, a) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
    c = rgb(c); const i = (y * b.w + x) * 4, d = b.d;
    if (a === undefined || a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    const sa = d[i + 3] / 255, oa = a + sa * (1 - a); if (oa <= 0) return;
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * sa * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }
  const alphaAt = (b, x, y) => x < 0 || y < 0 || x >= b.w || y >= b.h ? 0 : b.d[(y * b.w + x) * 4 + 3];
  function rect(b, x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(b, x + i, y + j, c, a); }
  function toCanvas(b, x0 = 0, w = b.w) {
    const c = newCanvas(w, b.h), g = c.getContext('2d'), img = g.createImageData(w, b.h);
    if (x0 === 0 && w === b.w) img.data.set(b.d);
    else for (let y = 0; y < b.h; y++) img.data.set(b.d.subarray((y * b.w + x0) * 4, (y * b.w + x0 + w) * 4), y * w * 4);
    g.putImageData(img, 0, 0); return c;
  }
  function paint(w, h, fn) { const b = Buf(w, h); fn(b); return toCanvas(b); }
  // Dark outline around everything drawn so far (only on transparent pixels); sides picks which neighbours count.
  function outline(b, col, diag) {
    const src = new Uint8Array(b.w * b.h); for (let i = 0; i < src.length; i++) src[i] = b.d[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      if (src[y * b.w + x]) continue;
      const at = (i, j) => i >= 0 && j >= 0 && i < b.w && j < b.h && src[j * b.w + i];
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || (diag && (at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1)))) put(b, x, y, col);
    }
  }
  const sprite = (rows, pal, name) => ART.sprite(rows, pal, name);

  // ---------------------------------------------------------------- Paletas del mundo
  const OUT = '#1a1420';
  const STONE = ramp(['#16141e', '#262532', '#383846', '#4e4e5c', '#686874', '#86848a', '#aaa49c'], 8);
  const ROOT = ramp(['#130d13', '#21161a', '#33221f', '#482f26', '#624232', '#7e5a40'], 7);
  const BONE = ramp(['#241d24', '#4c4346', '#7c7068', '#aa9e8a', '#d4c8ac', '#eee4ca'], 6);
  const SHELL = ramp(['#241d24', '#5c4248', '#966a6a', '#ca9c88', '#ecc8a8', '#fbe8cc'], 6);
  const TERRA = {
    dusk: { peat: ['#140f19', '#1d1520', '#281b25', '#35222a', '#452c2e', '#573833', '#6c4739', '#835840', '#9c6c4a'],
      moss: ['#1c2626', '#27392d', '#355030', '#476a32', '#5f8836', '#7fa43e', '#a4c050', '#cad86a'], flowers: ['#f2d36b', '#ee9fb8', '#f6f0dc', '#b9a4e8'], cap: '#c8583e', grass: 1 },
    night: { peat: ['#0e1018', '#141722', '#1b1e2a', '#252632', '#302f3a', '#3e3a44', '#4e484e', '#605854', '#746a5e'],
      moss: ['#122024', '#18302e', '#1f4034', '#2a5438', '#386a3e', '#4a8446', '#64a052', '#86bc68'], flowers: ['#bcd8f8', '#f0f4ff', '#c4b0f0', '#9ae0d0'], cap: '#9a5a7a', grass: 1 },
    storm: { peat: ['#0f1116', '#15171e', '#1e2028', '#282830', '#34333a', '#433f45', '#534c50', '#655c5c', '#786e6a'],
      moss: ['#131b1c', '#1a2824', '#23362a', '#2e4630', '#3b5834', '#4c6c3a', '#628244', '#7e9a56'], flowers: ['#e8ecf0', '#d0d8a0'], cap: '#a85a40', grass: 1 },
    cave: { peat: ['#110c16', '#18111e', '#211727', '#2c1e31', '#38263b', '#473046', '#583c52', '#6b4a60', '#80596e'],
      moss: ['#111a22', '#15242c', '#1a3036', '#203e40', '#284e4a', '#325e52', '#407260', '#528a70'], flowers: ['#5fe8d6'], cap: '#5fe8d6', grass: 0 },
    nest: { peat: ['#170e16', '#22131c', '#2e1a22', '#3c2228', '#4d2c2c', '#613830', '#784636', '#90563c', '#a86a46'],
      moss: ['#2a1c22', '#3a2a26', '#4e3a2a', '#66502e', '#826a34', '#a0863c', '#c0a24a', '#e2c464'], flowers: ['#f6d890', '#f4f0e0', '#e88a5a'], cap: '#c04a3a', grass: 1 } };
  for (const k in TERRA) {
    const p = TERRA[k]; p.peatR = p.peat.map(rgb); p.mossR = ramp(p.moss, 10);
    // Roots, shells and bones borrow some of the earth's colour so they sit inside it.
    const tie = (R, k2) => R.map((c, i) => mix(c, p.peatR[Math.min(8, Math.round(i / (R.length - 1) * 8))], k2));
    p.rootR = tie(ROOT, .5); p.boneR = tie(BONE, .3); p.shellR = tie(SHELL, .35); p.stoneR = tie(STONE, .25);
  }

  // ---------------------------------------------------------------- Tierra
  // Builds the whole terrain of a level (the '#' tiles) as a few wide canvases: rounded
  // corners, a moss lip with loose blades, dark topsoil, strata, roots, pebbles, shells
  // and bones, all getting darker and calmer with the distance to open air.
  const CHUNK = 256;
  function buildTerrain(grid, theme, seed = 1) {
    const P = TERRA[theme] || TERRA.dusk, PEAT = P.peatR, MOSS = P.mossR, grassy = !!P.grass;
    const TW = grid[0].length, TH = grid.length, PW = TW * 16, PH = TH * 16, N = PW * PH;
    const ch = (tx, ty) => tx < 0 || tx >= TW ? '#' : ty < 0 ? '.' : ty >= TH ? '#' : grid[ty][tx];
    // Gates and cracked stone can go away, so the earth behind them is finished as if open.
    const kind = c => c === '#' ? 2 : c === 'X' || c === 'M' ? 1 : c === '~' || c === 'w' ? 3 : 0;
    const tk = (tx, ty) => kind(ch(tx, ty));
    const solid = k => k === 1 || k === 2;
    // m: 0 air, 1 other solid, 2 terrain, 3 water.
    const m = new Uint8Array(N);
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) { const k = tk(tx, ty); if (k) for (let y = 0; y < 16; y++) m.fill(k, (ty * 16 + y) * PW + tx * 16, (ty * 16 + y) * PW + tx * 16 + 16); }
    const setPx = (x, y, v) => { if (x >= 0 && y >= 0 && x < PW && y < PH) m[y * PW + x] = v; };
    const getPx = (x, y) => x < 0 || x >= PW || y >= PH ? 2 : y < 0 ? 0 : m[y * PW + x];
    const corner = (tx, ty, sx, sy, r, v, fill) => {
      for (let j = 0; j < r; j++) for (let i = 0; i < r; i++) {
        const dx = r - i - .5, dy = r - j - .5; if (dx * dx + dy * dy <= r * r) continue;
        const x = tx * 16 + (sx < 0 ? i : 15 - i), y = ty * 16 + (sy < 0 ? j : 15 - j);
        if (fill ? getPx(x, y) !== 1 : getPx(x, y) === 2) setPx(x, y, v);
      }
    };
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      const k = tk(tx, ty), L = tk(tx - 1, ty), R = tk(tx + 1, ty), U = tk(tx, ty - 1), D = tk(tx, ty + 1);
      if (k === 2) {
        if (!solid(L) && !solid(U) && !solid(tk(tx - 1, ty - 1))) corner(tx, ty, -1, -1, 5, U === 3 ? 3 : L, false);
        if (!solid(R) && !solid(U) && !solid(tk(tx + 1, ty - 1))) corner(tx, ty, 1, -1, 5, U === 3 ? 3 : R, false);
        if (!solid(L) && !solid(D) && !solid(tk(tx - 1, ty + 1))) corner(tx, ty, -1, 1, 6, D === 3 ? 3 : L, false);
        if (!solid(R) && !solid(D) && !solid(tk(tx + 1, ty + 1))) corner(tx, ty, 1, 1, 6, D === 3 ? 3 : R, false);
      } else if (k === 0) {
        // Concave corners get a small fillet of earth.
        if (L === 2 && D === 2 && tk(tx - 1, ty + 1) === 2) corner(tx, ty, -1, 1, 4, 2, true);
        if (R === 2 && D === 2 && tk(tx + 1, ty + 1) === 2) corner(tx, ty, 1, 1, 4, 2, true);
        if (L === 2 && U === 2 && tk(tx - 1, ty - 1) === 2) corner(tx, ty, -1, -1, 3, 2, true);
        if (R === 2 && U === 2 && tk(tx + 1, ty - 1) === 2) corner(tx, ty, 1, -1, 3, 2, true);
      }
    }
    // Ragged undersides and a little wobble on the walls.
    const ragged = new Float32Array(PW); for (let x = 0; x < PW; x++) ragged[x] = noise(x / 4, 0, seed + 3);
    for (const th of [.3, .55, .78]) for (let y = 1; y < PH - 1; y++) for (let x = 0, i = y * PW; x < PW; x++, i++) {
      if (m[i] === 2 && m[i + PW] === 0 && m[i - PW] === 2 && ragged[x] > th) m[i] = 0;
    }
    const m0 = m.slice(), get0 = (x, y) => x < 0 || x >= PW || y >= PH ? 2 : y < 0 ? 0 : m0[y * PW + x];
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const i = y * PW + x; if (m0[i] !== 2 || get0(x, y - 1) !== 2) continue;
      const lft = get0(x - 1, y), rgt = get0(x + 1, y);
      if ((lft === 0 && noise(y / 3, x * .37, seed + 5) > .62) || (rgt === 0 && noise(y / 3, x * .37, seed + 6) > .62)) m[i] = 0;
    }
    // Distances to open air: straight up, down, left, right, and a chamfer distance.
    const up = new Uint8Array(N), dn = new Uint8Array(N), lf = new Uint8Array(N), rt = new Uint8Array(N), D = new Uint16Array(N);
    for (let x = 0; x < PW; x++) {
      let r = 0; for (let y = 0, i = x; y < PH; y++, i += PW) { const v = m[i]; r = v === 2 ? (r < 250 ? r + 1 : 250) : v === 1 ? 250 : 0; up[i] = r; }
      r = 250; for (let y = PH - 1, i = y * PW + x; y >= 0; y--, i -= PW) { const v = m[i]; r = v === 2 ? (r < 250 ? r + 1 : 250) : v === 1 ? 250 : 0; dn[i] = r; }
    }
    for (let y = 0; y < PH; y++) {
      let r = 250; for (let x = 0, i = y * PW; x < PW; x++, i++) { const v = m[i]; r = v === 2 ? (r < 250 ? r + 1 : 250) : v === 1 ? 250 : 0; lf[i] = r; }
      r = 250; for (let x = PW - 1, i = y * PW + x; x >= 0; x--, i--) { const v = m[i]; r = v === 2 ? (r < 250 ? r + 1 : 250) : v === 1 ? 250 : 0; rt[i] = r; }
    }
    for (let i = 0; i < N; i++) D[i] = m[i] === 1 || m[i] === 2 ? 9999 : 0;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const i = y * PW + x; if (!D[i]) continue; let v = D[i];
      const a = y > 0 ? D[i - PW] + 3 : 3; if (a < v) v = a;
      if (x > 0) { const b = D[i - 1] + 3; if (b < v) v = b; }
      if (y > 0 && x > 0) { const c = D[i - PW - 1] + 4; if (c < v) v = c; } else if (y === 0 && 4 < v) v = 4;
      if (y > 0 && x < PW - 1) { const c = D[i - PW + 1] + 4; if (c < v) v = c; }
      D[i] = v;
    }
    for (let y = PH - 1; y >= 0; y--) for (let x = PW - 1; x >= 0; x--) {
      const i = y * PW + x; if (!D[i]) continue; let v = D[i];
      if (x < PW - 1) { const b = D[i + 1] + 3; if (b < v) v = b; }
      if (y < PH - 1) { const a = D[i + PW] + 3; if (a < v) v = a; if (x < PW - 1) { const c = D[i + PW + 1] + 4; if (c < v) v = c; } if (x > 0) { const c = D[i + PW - 1] + 4; if (c < v) v = c; } }
      D[i] = v;
    }
    // Features stamped into the earth: material (1 stone, 2 root, 3 bone, 4 shell, 5 shade) and a value.
    const fm = new Uint8Array(N), fv = new Uint8Array(N);
    const stamp = (x, y, mat, v, minD = 3) => { if (x < 0 || y < 0 || x >= PW || y >= PH) return; const i = y * PW + x; if (m[i] !== 2 || D[i] < minD * 3) return; fm[i] = mat; fv[i] = Math.round(clamp01(v) * 255); };
    const surfTop = i => { const u = up[i]; if (u >= 250) return -1; const j = i - u * PW; return j < 0 ? 0 : m[j]; };
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      if (tk(tx, ty) !== 2) continue;
      const r = rng((tx * 7919 + ty * 104729 + seed * 31) >>> 0), bx = tx * 16, by = ty * 16;
      const nearTop = !solid(tk(tx, ty - 1)) || !solid(tk(tx, ty - 2));
      // Pebbles, lit from the top-left, with a shadow under them.
      const np = (r() < .45 ? 1 : 0) + (r() < .15 ? 1 : 0);
      for (let k = 0; k < np; k++) {
        const cx = bx + 2 + r() * 12, cy = by + 3 + r() * 11, rw = 1.2 + r() * 2.2, rh = rw * (.55 + r() * .3), tone = r() * .12;
        for (let y = Math.floor(cy - rh - 1); y <= cy + rh + 1; y++) for (let x = Math.floor(cx - rw - 1); x <= cx + rw + 1; x++) {
          const dx = (x + .5 - cx) / rw, dy = (y + .5 - cy) / rh, e = dx * dx + dy * dy;
          if (e <= 1) stamp(x, y, 1, (dx + dy < -.7 ? .66 : dx + dy > .55 ? .28 : .46) + tone, 4);
          else if (e <= 1.9 && dy > .3 && dx > -.5) stamp(x, y, 5, .1, 4);
        }
      }
      // Roots creeping down from the surface.
      if (nearTop && surfTop(by * PW + bx + 8) === 0) {
        const nr = r() * 2.2 | 0;
        for (let k = 0; k < nr; k++) {
          let x = bx + (r() * 16 | 0), y = by + 5 + (r() * 5 | 0); const len = 6 + r() * 20 | 0;
          for (let s = 0; s < len; s++) {
            stamp(x, y, 2, s < len * .4 ? .7 : .58, 2); if (s < len * .3) stamp(x + 1, y, 2, .45, 2);
            if (s < len * .5 && s % 2 === 0) stamp(x - 1, y, 2, .82, 2);
            y++; const q = r(); if (q < .22) x--; else if (q > .78) x++;
            if (r() < .08) { let bx2 = x, by2 = y; const d = r() < .5 ? -1 : 1; for (let t = 0; t < 3 + r() * 4; t++) { bx2 += d; if (r() < .6) by2++; stamp(bx2, by2, 2, .55, 2); } }
          }
        }
      }
      // A snail shell now and then, and old bones deeper down.
      if (r() < .07) {
        const x = bx + 3 + (r() * 9 | 0), y = by + 4 + (r() * 9 | 0);
        const sh = ['.aa.', 'abca', '.bb.']; const val = { a: .78, b: .5, c: .25 };
        sh.forEach((row, j) => [...row].forEach((c2, i2) => { if (c2 !== '.') stamp(x + i2, y + j, 4, val[c2], 4); }));
      }
      if (!nearTop && r() < .1) {
        const x = bx + 2 + (r() * 5 | 0), y = by + 4 + (r() * 8 | 0);
        const fish = r() < .5;
        const rows = fish ? ['..a.a.a...', 'aaaaaaaaab', '..c.c.c...'] : ['a.....a', 'aaaaaaa', 'c.....c'];
        const val = { a: .72, b: .5, c: .42 };
        rows.forEach((row, j) => [...row].forEach((c2, i2) => { if (c2 !== '.') stamp(x + i2, y + j, 3, val[c2], 4); }));
      }
    }
    // Shade every earth pixel.
    const out = Buf(PW, PH), d = out.d;
    const setc = (i, c) => { if (typeof c === 'string') c = rgb(c); const k = i * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; };
    // Per-column noise, computed once: moss thickness, topsoil depth and the wobble of the strata.
    const MT = new Uint8Array(PW), TS = new Float32Array(PW), SW = [];
    for (let x = 0; x < PW; x++) { MT[x] = 3 + Math.floor(noise(x / 5, 0, seed + 11) * 3.4); TS[x] = noise(x / 7, 1, seed + 2) * 5; }
    for (let k = 0; k <= PH >> 6; k++) { const a = new Float32Array(PW); for (let x = 0; x < PW; x++) a[x] = noise(x / 23, k, seed + 3) * 9; SW.push(a); }
    const mossT = x => MT[x];
    const MATS = [null, P.stoneR, P.rootR, P.boneR, P.shellR];
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const i = y * PW + x; if (m[i] !== 2) continue;
      const dd = D[i] / 3, dk = smooth((dd - 4) / 24), con = 1 - .68 * dk;
      const u = up[i], l = lf[i], r = rt[i], b = dn[i];
      const top = surfTop(i), open = top === 0, wet = top === 3;
      const mt = grassy ? mossT(x) : 2;
      // Moss lip on open tops, draped a little down the walls near the corners.
      const faceL = l <= 2, faceR = r <= 2;
      const drape = open && u <= 14 && (faceL || faceR) ? 3 + Math.floor(hash(faceL ? x - l : x + r, (y - u) >> 4, seed + 17) * 9) - (faceL ? l : r) * 2 : 0;
      if (open && (u <= mt || u <= drape)) {
        let t = u <= mt ? .98 - (u - 1) / mt * .6 : .6 - u / drape * .35;
        if (u === mt && hash(x, y, seed) < .45) { setc(i, PEAT[1]); continue; }
        if (faceR && r === 1) t -= .3; else if (faceL && l === 1) t += .06;
        t += (hash(x, y, seed + 1) - .5) * .12;
        setc(i, pick(MOSS, t, x, y)); continue;
      }
      if (fm[i]) {
        const f = fm[i]; let t = fv[i] / 255 - .5 * dk;
        setc(i, f === 5 ? PEAT[Math.max(0, Math.round(1 - dk))] : pick(MATS[f], t, x, y)); continue;
      }
      let t;
      if (open && u <= mt + 1) t = .05;
      else if (wet && u <= 2) t = .6 - u * .08;
      else {
        const soil = .5 - .36 * dk;
        const topsoil = (open || wet) ? mt + 7 + TS[x] : 0;
        if (u <= topsoil) t = .27 + (noise(x / 3, y / 2, seed + 4) - .5) * .12 - (u < mt + 4 ? .05 : 0);
        else if (u <= topsoil + 3) t = .28 + (soil - .28) * (u - topsoil) / 3;
        else t = soil;
        // Strata that follow the surface above.
        const ly = (u < 250 ? u : y) + SW[y >> 6][x], band = Math.floor(ly / 7);
        t += (hash(band, 0, seed + 9) - .5) * .16 * con;
        if (ly - band * 7 < 1 && hash(band, 1, seed + 9) < .45) t -= .08 * con;
        if (dk < .97) t += (noise(x / 9, y / 6, seed + 1) - .5) * .22 * con + (noise(x / 3, y / 2, seed + 7) - .5) * .1 * con;
        t += (hash(x, y, seed + 2) - .5) * .035 * con;
      }
      // Rim light on the left walls, shadow on the right walls and undersides.
      if (l === 1) t += .2; else if (l === 2) t += .09; else if (l === 3 && (x + y) & 1) t += .06;
      if (r === 1) t = Math.min(t, .06); else if (r === 2) t -= .08; else if (r < 14) t -= .1 * (1 - r / 14);
      if (b === 1) t = .0; else if (b === 2) t = Math.min(t, .12); else if (b <= 4) t -= .08;
      setc(i, pick(PEAT, t, x, y));
    }
    // Things that grow out into the air: blades, flowers, fungi, hanging roots and moss.
    const glow = [];
    const air = (x, y, c, onlyWater) => { if (x < 0 || y < 0 || x >= PW || y >= PH) return false; const v = m[y * PW + x]; if (onlyWater ? v !== 3 : v !== 0) return false; const k = (y * PW + x) * 4; if (d[k + 3]) return false; setc(y * PW + x, c); return true; };
    const airAny = (x, y, c) => { if (x < 0 || y < 0 || x >= PW || y >= PH) return; const v = m[y * PW + x]; if (v === 1 || v === 2) return; setc(y * PW + x, c); };
    for (let y = 1; y < PH; y++) for (let x = 0; x < PW; x++) {
      const i = y * PW + x; if (m[i] !== 2) continue;
      const above = m[i - PW];
      if (above === 0 && grassy) {
        const dens = noise(x / 11, y / 16, seed + 4), p = .3 + dens * .66;
        if (hash(x, y, seed + 5) < p) {
          let h = 1 + Math.floor(hash(x, y, seed + 6) * (1.5 + dens * 5)); if (hash(x, y, seed + 8) < .07) h += 3;
          const lean = hash(x, y, seed + 7), lx = lean < .33 ? -1 : lean > .67 ? 1 : 0;
          for (let k = 1; k <= h; k++) air(x + (h >= 3 && k >= h - 1 ? lx : 0), y - k, pick(MOSS, .42 + .55 * k / h, x, y - k));
        }
      } else if (above === 0) {
        if (hash(x, y, seed + 5) < .35) air(x, y - 1, pick(MOSS, .5 + hash(x, y, 3) * .3, x, y));
      } else if (above === 3 && hash(x, y, seed + 12) < .22) {
        // Water weeds swaying up from drowned banks.
        const h = 2 + Math.floor(hash(x, y, seed + 13) * 7);
        for (let k = 1; k <= h; k++) air(x + ((k >> 2) & 1), y - k, pick(MOSS, .2 + .3 * k / h, x, y - k), true);
      }
      const below = y < PH - 1 ? m[i + PW] : 2;
      if (below === 0) {
        const q = hash(x, y, seed + 14);
        if (q < .075) {
          let rx = x; const len = 3 + Math.floor(hash(x, y, seed + 15) * 11);
          for (let k = 1; k <= len; k++) { airAny(rx, y + k, pick(ROOT, k % 3 === 0 ? .55 : .3, rx, y + k)); if (hash(x, k, seed + 16) < .25) rx += hash(x, k, 9) < .5 ? -1 : 1; }
        } else if (q < .075 + (grassy ? .16 : .1)) {
          const len = 1 + Math.floor(hash(x, y, seed + 18) * 4);
          for (let k = 1; k <= len; k++) airAny(x, y + k, pick(MOSS, .22 + .3 * k / len, x, y + k));
        } else if (!grassy && q < .3) {
          const len = 2 + Math.floor(hash(x, y, seed + 19) * 5);
          for (let k = 1; k <= len; k++) airAny(x, y + k, PEAT[k < len - 1 ? 3 : 5]);
        }
      }
      // Roots poking out of the walls.
      const lft = x > 0 ? m[i - 1] : 2, rgt = x < PW - 1 ? m[i + 1] : 2;
      if ((lft === 0 || rgt === 0) && hash(x, y, seed + 20) < .045 && up[i] > 6) {
        const s = lft === 0 ? -1 : 1, len = 2 + Math.floor(hash(x, y, seed + 21) * 3);
        let rx = x, ry = y;
        for (let k = 0; k < len + 2; k++) { if (k < len) rx += s; else ry++; airAny(rx, ry, pick(ROOT, s < 0 ? .6 : .32, rx, ry)); }
      }
      // Moss hanging over the lip of a ledge.
      if (grassy && (lft === 0 || rgt === 0) && up[i] <= 2 && surfTop(i) === 0 && hash(x, y, seed + 22) < .7) {
        const s = lft === 0 ? -1 : 1, len = 2 + Math.floor(hash(x, y, seed + 23) * 7);
        for (let k = 0; k < len; k++) airAny(x + s, y + k, pick(MOSS, .6 - .4 * k / len, x, y + k));
      }
    }
    // Little plants on top of each open tile.
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      if (tk(tx, ty) !== 2 || tk(tx, ty - 1) !== 0) continue;
      const r = rng((tx * 3571 + ty * 1597 + seed * 13) >>> 0);
      const n = theme === 'cave' ? (r() < .55 ? 1 + (r() * 2 | 0) : 0) : (r() < .7 ? 1 : 0) + (r() < .25 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const x = tx * 16 + 2 + (r() * 12 | 0); let y = ty * 16 - 4;
        while (y < ty * 16 + 8 && getPx(x, y) !== 2) y++;
        if (getPx(x, y) !== 2 || getPx(x, y - 1) !== 0) continue;
        const kind2 = r();
        if (theme === 'cave') {
          // Glowing fungi: a few small caps on thin pale stems.
          const caps = 1 + (r() * 3 | 0);
          for (let c = 0; c < caps; c++) {
            const cx = x + c * 2 - caps + 1, h = 1 + (r() * 3 | 0);
            for (let s = 1; s <= h; s++) airAny(cx, y - s, '#8a7c9a');
            airAny(cx - 1, y - h - 1, '#2fa89a'); airAny(cx, y - h - 1, '#8ff4e2'); airAny(cx + 1, y - h - 1, '#3cc4b0'); airAny(cx, y - h - 2, '#d8fff6');
          }
          glow.push({ x, y: y - 3 });
        } else if (kind2 < .42) {
          const h = 2 + (r() * 3 | 0), col = P.flowers[r() * P.flowers.length | 0];
          for (let s = 1; s <= h; s++) airAny(x, y - s, pick(MOSS, .35, x, y - s));
          airAny(x, y - h - 1, '#f6e27a'); airAny(x - 1, y - h - 1, col); airAny(x + 1, y - h - 1, col); airAny(x, y - h - 2, col); airAny(x, y - h, mix(col, OUT, .35));
          if (r() < .5) { airAny(x + 1, y - 2, pick(MOSS, .6, x, y)); airAny(x + 2, y - 3, pick(MOSS, .75, x, y)); }
        } else if (kind2 < .62) {
          const cap = rgb(P.cap), hi = mix(cap, '#fff0d0', .45), lo = mix(cap, OUT, .45);
          airAny(x, y - 1, '#d8ccb4'); airAny(x, y - 2, '#b8aa94');
          airAny(x - 1, y - 3, cap); airAny(x, y - 3, hi); airAny(x + 1, y - 3, cap); airAny(x - 1, y - 2, lo); airAny(x + 1, y - 2, lo);
          if (r() < .5) { airAny(x + 3, y - 1, '#d8ccb4'); airAny(x + 2, y - 2, lo); airAny(x + 3, y - 2, hi); airAny(x + 4, y - 2, lo); }
        } else if (kind2 < .85) {
          // A fern: two arching fronds.
          const fr = [[0, 1], [0, 2], [-1, 3], [-2, 3], [-3, 2], [1, 3], [2, 4], [3, 4], [4, 3], [-1, 2], [1, 2]];
          for (const [ox, oy] of fr) airAny(x + ox, y - oy, pick(MOSS, .5 + oy * .1, x + ox, y - oy));
        } else {
          airAny(x, y - 1, STONE[5]); airAny(x + 1, y - 1, STONE[4]); airAny(x + 2, y - 1, STONE[3]); airAny(x + 1, y - 2, STONE[6]); airAny(x + 2, y - 2, STONE[5]);
        }
      }
    }
    const chunks = []; for (let x0 = 0; x0 < PW; x0 += CHUNK) chunks.push(toCanvas(out, x0, Math.min(CHUNK, PW - x0)));
    return { chunks, PW, PH, glow };
  }
  const rng = ART.rng;

  // Terrain of the level being played, rebuilt only if its earth or water change.
  const terrCache = new Map();
  function sigOf(t) { return t.map(r => r.join ? r.join('') : r).join('\n').replace(/[^#~wxXMG\n]/g, '.'); }
  function levelTerrain(L) {
    const k = L.index + ':' + L.def.theme; let T = terrCache.get(k);
    if (T && T.rows !== L.t) {
      // Same level loaded again: keep the cache if the layout matches.
      const s = sigOf(L.t); if (s === T.sig) T.rows = L.t; else T = null;
    }
    if (!T) { const t0 = performance.now(); T = buildTerrain(L.t.map(r => r.slice()), L.def.theme, 1 + L.index * 17); T.sig = sigOf(L.t); T.rows = L.t; T.snap = L.t.map(r => r.map(c => c === '#' || c === '~' ? c : '.')); terrCache.set(k, T); if (window.location && /debug/.test(location.search)) console.log('TERRENO', k, Math.round(performance.now() - t0) + 'ms'); }
    return T;
  }
  function drawTerrain(g, L, camX, camY, W, H) {
    let T = levelTerrain(L);
    // Earth or water that changed in view (the flood at the end of the heron's fight) means a rebuild.
    const x0 = Math.max(0, camX >> 4), x1 = Math.min(L.w - 1, (camX + W) >> 4), y0 = Math.max(0, camY >> 4), y1 = Math.min(L.h - 1, (camY + H) >> 4);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = L.t[ty][tx], s = T.snap[ty][tx];
      if ((c === '#' || c === '~' ? c : '.') !== s) { terrCache.delete(L.index + ':' + L.def.theme); T.rows = null; T = levelTerrain(L); ty = y1 + 1; break; }
    }
    const k0 = Math.max(0, Math.floor(camX / CHUNK)), k1 = Math.min(T.chunks.length - 1, Math.floor((camX + W) / CHUNK));
    for (let k = k0; k <= k1; k++) g.drawImage(T.chunks[k], k * CHUNK - camX, -camY);
    return T;
  }
  // Small terrain pieces for the title and menu scenes.
  const sceneCache = {};
  function sceneTerrain(name, rows, theme) { return sceneCache[name + theme] || (sceneCache[name + theme] = buildTerrain(rows.map(r => r.split('')), theme, 5)); }


  // ---------------------------------------------------------------- Agua
  const AGUA = {
    dusk: { body: ['#0e1a26', '#122632', '#17343c', '#1d4446', '#255450', '#2f6658', '#3e7a60'], line: '#8cc8a8', foam: '#e6f6e0', glint: '#ffe2b0' },
    night: { body: ['#08111c', '#0b1828', '#0f2234', '#142c40', '#1a384a', '#214656', '#2a5662'], line: '#74aac0', foam: '#dcf2ff', glint: '#ffffff' },
    storm: { body: ['#0b1116', '#0f181e', '#142028', '#1a2a32', '#21343c', '#2a4046', '#344c52'], line: '#86a2ac', foam: '#d6e2e8', glint: '#eef4f8' },
    cave: { body: ['#0b0c1a', '#0e1224', '#12192e', '#162238', '#1b2e44', '#223a4e', '#2a4858'], line: '#62b4c0', foam: '#c4f4f0', glint: '#d8fff6' },
    nest: { body: ['#151126', '#1b1830', '#22223a', '#2b2c44', '#35384c', '#424654', '#52545a'], line: '#f0a878', foam: '#ffe8c8', glint: '#fff0c8' } };
  const SURF = 3;
  const waterCache = {};
  function water(theme) {
    if (waterCache[theme]) return waterCache[theme];
    const A = AGUA[theme] || AGUA.dusk, body = ramp(A.body, 9);
    // Opaque body, darker with depth, with specks of silt and faint light streaks near the top.
    const back = [0, 1, 2, 3].map(row => [0, 1].map(v => paint(16, 16, b => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const wy = row * 16 + y; if (wy <= SURF) continue;
        let t = .9 - (wy - SURF) / 44; if (t < .06) t = .06;
        let c = pick(body, t, x, y);
        const sp = hash(x + v * 16, wy, 41), n = body.length - 1, k = Math.round(t * n);
        if (sp < .014) c = body[Math.min(n, k + 3)];
        else if (wy < 22 && noise((x + v * 16) / 5, wy / 1.6, 42) > .74) c = body[Math.min(n, k + 1)];
        put(b, x, y, c);
      }
    })));
    // Translucent front: the moving surface line and a tint over whatever is under water.
    const tint = body[3];
    const front = []; for (let f = 0; f < 8; f++) front.push(paint(16, 16, b => {
      for (let x = 0; x < 16; x++) {
        const ph = (x / 16 + f / 8) * Math.PI * 2, w = Math.sin(ph) * .9 + Math.sin(ph * 2 - f * .8) * .45, y0 = SURF + Math.round(w);
        for (let y = y0 + 2; y < 16; y++) put(b, x, y, tint, .34);
        put(b, x, y0, w < -.6 ? A.foam : A.line); put(b, x, y0 + 1, body[7], .9);
        if (y0 + 2 <= SURF + 1) put(b, x, y0 + 2, body[6], .8);
        if (w < -1) put(b, x, y0 - 1, A.foam, .55);
      }
      const gx = (f * 2 + 3) % 16; put(b, gx, 7, A.glint, .75); put(b, (gx + 1) % 16, 7, A.glint, .45);
      const gx2 = (21 - f * 2) % 16; put(b, gx2, 11, A.line, .45); put(b, (gx2 + 1) % 16, 11, A.line, .3);
    }));
    const deepFront = paint(16, 16, b => rect(b, 0, 0, 16, 16, tint, .34));
    // Foam where the water laps against a bank (for a bank on the left; flipped for the right).
    const foam = []; for (let f = 0; f < 4; f++) foam.push(paint(8, 9, b => {
      const r = rng(7 + f * 13);
      for (let k = 0; k < 9; k++) { const x = (r() * r() * 7) | 0, y = SURF - 1 + ((r() * 3) | 0); put(b, x, y, k < 5 ? A.foam : A.line, k < 5 ? 1 : .8); }
      put(b, 0, SURF, A.foam); put(b, 1, SURF, A.foam); put(b, 0, SURF + 1, A.foam, .8); put(b, 0, SURF + 2, A.line, .6);
      put(b, 2 + (f % 3), SURF + 3 + (f & 1), A.foam, .5); put(b, 1 + (f % 2), SURF + 5, A.line, .4);
    }));
    return waterCache[theme] = { back, front, deepFront, foam, A, body, tint };
  }

  // ---------------------------------------------------------------- Piezas del decorado
  const WOOD = ramp(['#1c1218', '#35222a', '#533428', '#744a32', '#96643e', '#b8824e', '#dcac6c'], 7);
  const MUD = ramp(['#1c1820', '#2c2830', '#3e383e', '#544b4e', '#6c6060', '#877a74', '#a6968a'], 7);
  const IRON = ramp(['#16141c', '#2a2832', '#403e4a', '#5a5864', '#787682', '#a09ea8'], 6);
  const RUST = ['#5a2a20', '#8a4428', '#b86a38'];
  const VINE = ramp(['#1e1020', '#3a1c2c', '#5c2c38', '#84464a'], 4);
  const CAP = ramp(['#2a1020', '#5a1a2c', '#8a2834', '#b83c3c', '#dc5c44', '#f08c5c', '#fcc088'], 7);
  const tileCache = {};
  function tiles(theme) {
    if (tileCache[theme]) return tileCache[theme];
    const P = TERRA[theme] || TERRA.dusk, MOSS = P.mossR;
    // Planks of the boardwalk: a lit top, grain, seams with nails, moss here and there.
    const plank = (v, endL, endR) => paint(16, 9, b => {
      for (let x = 0; x < 16; x++) for (let y = 0; y < 6; y++) {
        if ((endL && x === 0 || endR && x === 15) && (y === 0 || y === 5)) continue;
        let c;
        if (y === 5 || endL && x === 0 || endR && x === 15) c = OUT;
        else if (y === 0) c = WOOD[hash(x, v, 3) < .18 ? 5 : 6];
        else if (y === 4) c = WOOD[2];
        else { const gr = noise(x / 4 + v * 5, y * 1.9, 5); c = WOOD[gr > .64 ? 3 : gr < .3 ? 5 : 4]; }
        put(b, x, y, c);
      }
      const seam = v ? 9 : 4; if (!(endL && seam < 2)) { for (let y = 1; y < 5; y++) put(b, seam, y, WOOD[1]); put(b, seam - 1, 1, WOOD[6]); put(b, seam + 1, 2, IRON[5]); put(b, seam - 2, 2, IRON[4]); }
      const r = rng(55 + v * 9 + (endL ? 3 : 0) + (endR ? 7 : 0));
      for (let k = 0; k < 3; k++) { const x = r() * 16 | 0; if (r() < .6) { put(b, x, 0, pick(MOSS, .8, x, 0)); put(b, x + 1, 0, pick(MOSS, .6, x, 1)); } }
      if (v === 1 || endR) { const x = 3 + (r() * 10 | 0), len = 1 + (r() * 3 | 0); for (let k = 0; k < len; k++) put(b, x, 6 + k, pick(MOSS, .5 - k * .12, x, k)); put(b, x + 1, 6, pick(MOSS, .3, x, 1)); }
      if (endL) { put(b, 1, 1, WOOD[6]); put(b, 1, 2, WOOD[5]); }
    });
    const planks = { mid: [plank(0), plank(1)], left: plank(0, true, false), right: plank(1, false, true), one: plank(0, true, true) };
    // A post driven into the water under the boardwalk.
    const post = paint(5, 30, b => {
      for (let y = 0; y < 30; y++) { put(b, 0, y, OUT); put(b, 1, y, WOOD[5]); put(b, 2, y, WOOD[4]); put(b, 3, y, WOOD[2]); put(b, 4, y, OUT); if (hash(0, y, 9) < .2) put(b, 2, y, WOOD[3]); }
      for (const y of [2, 3]) { put(b, 1, y, '#c8b48a'); put(b, 2, y, '#a8946a'); put(b, 3, y, '#6a5a44'); }
      for (let y = 12; y < 30; y++) if (hash(1, y, 4) < .5) put(b, 1 + (y & 1), y, pick(MOSS, .35, 1, y));
    });
    // Brambles: looping briar canes studded with pale thorns, a few red berries and leaves.
    const thorn = v => { const b = Buf(16, 8);
      for (let x = 0; x < 16; x++) for (let y = 6; y < 8; y++) put(b, x, y, hash(x, y, v + 20) < .45 ? VINE[0] : VINE[1]);
      const arcs = v ? [[2, 4.5, 5.5], [9, 5, 6.5], [14.5, 3.5, 4.5]] : [[4, 5, 6.5], [11, 4.5, 5.5], [-1, 3.5, 4]];
      const tips = [];
      for (const [cx, rx, ry] of arcs) for (let a = 0; a <= Math.PI; a += .06) {
        const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(7 - Math.sin(a) * ry);
        put(b, x, y, a > .6 && a < 2.5 ? VINE[3] : VINE[2]); put(b, x, y + 1, VINE[1]);
      }
      for (const [cx, rx, ry] of arcs) for (let a = .35; a < Math.PI; a += .55) {
        const nx = Math.cos(a), ny = -Math.sin(a), x = cx + nx * rx, y = 7 + ny * ry;
        tips.push([Math.round(x + nx * 1.4), Math.round(y + ny * 1.4)]);
        put(b, Math.round(x + nx * 1.2), Math.round(y + ny * 1.2), '#c8b494');
      }
      for (const [x, y] of tips) put(b, x, y, '#f6ecd8');
      const r = rng(71 + v);
      for (let k = 0; k < 2; k++) { const x = 3 + (r() * 10 | 0), y = 4 + (r() * 2 | 0); put(b, x, y, '#ff8a9a'); put(b, x + 1, y, '#c8304a'); put(b, x, y + 1, '#a8203c'); put(b, x + 1, y + 1, '#6a1028'); }
      const lx = 6 + v * 3; put(b, lx, 5, '#4e7a34'); put(b, lx + 1, 5, '#6a9a3c'); put(b, lx + 1, 4, '#8fb448');
      outline(b, OUT); return toCanvas(b); };
    const thorns = [thorn(0), thorn(1)];
    // Cracked mudstone blocks laid in a running bond, with cracks that say "this breaks".
    const cracked = v => paint(16, 16, b => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = y < 8 ? 0 : 1, jx = row === 0 ? (v & 1 ? 5 : 0) : (v & 1 ? 13 : 8), ly = y - row * 8, lx = (x - jx + 16) % 16;
        let c;
        if (ly === 7 || lx === 15) c = MUD[0];
        else if (ly === 0 || lx === 0) c = MUD[5];
        else if (ly === 6 || lx === 14) c = MUD[2];
        else c = pick(MUD, .5 + (noise(x / 3 + v * 7, y / 3, 13) - .5) * .35, x, y);
        put(b, x, y, c);
      }
      const r = rng(101 + v * 17);
      for (let k = 0; k < 2; k++) {
        let x = 3 + (r() * 10 | 0), y = 1 + (r() * 5 | 0) + k * 8; const dx = r() < .5 ? -1 : 1;
        for (let s = 0; s < 7 + (r() * 5 | 0); s++) { put(b, x, y, MUD[0]); put(b, x + 1, y, MUD[6]); y++; if (r() < .55) x += dx; if (r() < .2) { put(b, x - dx, y, MUD[1]); } if (y > 15) break; }
      }
      for (let k = 0; k < 4; k++) { const x = r() * 16 | 0, y = r() * 16 | 0; put(b, x, y, MUD[1]); }
    });
    // Reinforced stone: big blocks strapped with iron, rivets and rust.
    const hard = v => paint(16, 16, b => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c;
        if (y === 15 || x === 15) c = STONE[0]; else if (y === 0 || x === 0) c = STONE[5]; else if (y === 14 || x === 14) c = STONE[2];
        else c = pick(STONE, .42 + (noise(x / 4 + v * 5, y / 4, 17) - .5) * .3, x, y);
        put(b, x, y, c);
      }
      for (const by of [3, 11]) {
        for (let x = 0; x < 16; x++) { put(b, x, by - 1, STONE[0]); put(b, x, by, IRON[4]); put(b, x, by + 1, IRON[2]); put(b, x, by + 2, IRON[1]); }
        for (const rx of [2, 7, 12]) { put(b, rx, by, IRON[5]); put(b, rx + 1, by + 1, IRON[0]); }
        const r = rng(by * 7 + v * 3); for (let k = 0; k < 2; k++) { const x = 1 + (r() * 14 | 0), len = 1 + (r() * 3 | 0); for (let s = 0; s < len; s++) put(b, x, by + 3 + s, RUST[s === 0 ? 1 : 0]); put(b, x, by + 2, RUST[2]); }
      }
    });
    // Root walls: three twisted roots and a crossing root every tile to hold on to.
    const roots = (v, top, bottom) => paint(16, 16, b => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) put(b, x, y, hash(x, y + v * 16, 30) < .06 ? pick(MOSS, .2, x, y) : ROOT[hash(x, y, 31) < .5 ? 0 : 1]);
      for (let k = 0; k < 3; k++) {
        const w = k === 1 ? 5 : 4;
        for (let y = 0; y < 16; y++) {
          const cx = 2.6 + k * 5.2 + Math.sin(((y + v * 8) / 16 + k * .37) * Math.PI * 2) * 1.5, x0 = Math.round(cx - w / 2);
          if (top && y < 2 && k !== 1) continue;
          for (let i = 0; i < w; i++) {
            const rel = i / (w - 1); let t = rel < .25 ? .95 : rel < .55 ? .75 : rel < .85 ? .55 : .3;
            if (noise(x0 + i, (y + v * 16) / 2.5, 32 + k) > .72) t -= .2;
            const narrow = bottom && y > 11 ? (y - 11) : 0; if (i < narrow / 2 || i >= w - narrow / 2) continue;
            put(b, x0 + i, y, pick(ROOT, t, x0 + i, y));
          }
          put(b, x0 - 1, y, OUT); put(b, x0 + w, y, ROOT[0]);
        }
      }
      const ry = 7 + (v & 1) * 2;
      for (let x = 0; x < 16; x++) { const yy = ry + Math.round(Math.sin(x / 16 * Math.PI * 2) * .8); put(b, x, yy - 1, OUT); put(b, x, yy, ROOT[6]); put(b, x, yy + 1, ROOT[4]); put(b, x, yy + 2, ROOT[1]); }
      for (let k = 0; k < 3; k++) { const x = hash(k, v, 33) * 16 | 0, y = hash(k, v, 34) * 16 | 0; put(b, x, y, pick(MOSS, .55, x, y)); put(b, x, y + 1, pick(MOSS, .35, x, y)); }
    });
    const rootWall = { mid: [roots(0), roots(1)], top: roots(0, true), bottom: roots(1, false, true) };
    // A moss lip with blades for the tops of stone, root and gate tiles (drawn 4px above the tile).
    const cap = v => paint(16, 9, b => {
      const mt = 3;
      for (let x = 0; x < 16; x++) {
        const d = mt + (hash(x, v, 40) < .35 ? 1 : 0);
        for (let y = 0; y < d; y++) put(b, x, 4 + y, pick(MOSS, .95 - y / d * .6, x, y));
        if (hash(x, v, 41) < .5) { const h = 1 + (hash(x, v, 42) * 4 | 0); for (let k = 1; k <= h; k++) put(b, x, 4 - k, pick(MOSS, .45 + .5 * k / h, x, k)); }
        if (hash(x, v, 43) < .2) put(b, x, 4 + d, pick(MOSS, .3, x, 0));
      }
    });
    const caps = [cap(0), cap(1), cap(2)];
    // Sluice gate: a door of stacked planks with two iron straps and rivets that slides in iron rails; the top
    // piece carries the lifting band, the bottom one the iron shoe, slime and the damp of the swamp.
    const door = (top, bottom, v) => paint(12, 16, b => {
      // Three upright boards (lit left edge, grain, a dark seam between them)...
      for (let y = 0; y < 16; y++) for (let x = 0; x < 12; x++) {
        const board = x < 4 ? 0 : x < 8 ? 1 : 2, bx = x - [1, 5, 8][board]; let c;
        if (x === 0 || x === 11) c = OUT;
        else if (x === 4 || x === 7) c = WOOD[1];
        else { let k = bx === 0 ? 5 : bx === 1 ? 4 : 3; const n = noise(x * .7 + board * 3, y / 3.5 + v * 7 + board * 5, 51); if (n > .72) k--; else if (n < .22) k++; c = WOOD[Math.max(1, Math.min(6, k))]; }
        put(b, x, y, c);
      }
      for (let k = 0; k < 3; k++) { const x = [2, 6, 9][k], y = (hash(k, v, 53) * 12 | 0) + 2; put(b, x, y, WOOD[2]); put(b, x, y + 1, WOOD[2]); }
      // ...held by an iron band with a rivet on every board, rust weeping under it.
      for (const by of [7]) for (let x = 0; x < 12; x++) { const e = x === 0 || x === 11; put(b, x, by - 1, OUT); put(b, x, by, e ? OUT : IRON[4]); put(b, x, by + 1, e ? OUT : IRON[2]); put(b, x, by + 2, e ? OUT : WOOD[1]); if (x === 2 || x === 5 || x === 9) { put(b, x, by, IRON[5]); put(b, x + 1, by + 1, IRON[1]); } if (!e && hash(x, by + v, 57) < .2) { put(b, x, by + 2, RUST[1]); if (hash(x, v, 58) < .5) put(b, x, by + 3, RUST[0]); } }
      if (top) for (let x = 0; x < 12; x++) { const e = x === 0 || x === 11; put(b, x, 0, OUT); put(b, x, 1, e ? OUT : x === 4 || x === 7 ? WOOD[3] : WOOD[6]); }
      if (bottom) {
        for (let x = 1; x < 11; x++) for (let y = 10; y < 13; y++) put(b, x, y, '#16262a', (y - 8) / 12);
        for (let x = 1; x < 11; x++) if (hash(x, v, 54) < .55) { put(b, x, 12, pick(MOSS, .35 + hash(x, v, 55) * .4, x, 12)); if (hash(x, v, 56) < .4) put(b, x, 11, pick(MOSS, .6, x, 11)); }
        for (let x = 0; x < 12; x++) { const e = x === 0 || x === 11; put(b, x, 13, e ? OUT : IRON[3]); put(b, x, 14, e ? OUT : IRON[1]); put(b, x, 15, OUT); }
      }
    });
    // A gate lying flat is a trapdoor: thick planks across, strapped with iron hinges.
    const hatch = v => paint(16, 16, b => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const ly = y % 5; let c;
        if (y === 0 || y === 15 || x === 0 || x === 15) c = OUT; else if (ly === 0) c = WOOD[1];
        else { let k = ly === 1 ? 6 : ly === 2 ? 5 : ly === 3 ? 4 : 3; const n = noise(x / 3.5 + v * 9, y * .9, 59); if (n > .72) k--; else if (n < .2) k++; c = WOOD[Math.max(1, Math.min(6, k))]; }
        put(b, x, y, c);
      }
      for (const sx of v ? [10] : [3]) for (let y = 1; y < 15; y++) { put(b, sx, y, IRON[4]); put(b, sx + 1, y, IRON[3]); put(b, sx + 2, y, IRON[1]); if (y % 5 === 2) put(b, sx + 1, y, IRON[5]); }
      for (let x = 1; x < 15; x++) if (hash(x, v, 60) < .4) put(b, x, 1, pick(MOSS, .5 + hash(x, v, 61) * .4, x, 1));
    });
    const gates = { top: door(true, false, 0), mid: [door(false, false, 1), door(false, false, 2)], bottom: door(false, true, 3), one: door(true, true, 4), hatch: [hatch(0), hatch(1)] };
    // Target: a painted wooden bullseye with a rim nailed on, chipped paint and a tuft of moss. Its back is
    // painted green with a tick, and that is the face it ends on once it has been hit.
    const face = on => paint(13, 13, b => {
      const pc = on ? ['#dff6c0', '#6cbf4e', '#3f8a3a'] : ['#efe0c0', '#d0443a', '#9a2c30'];
      for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
        const dx = x - 6, dy = y - 6, d = Math.hypot(dx, dy); if (d > 6.6) continue;
        const lit = dx + dy < -2.5, dark = dx + dy > 2.5; let c;
        if (d > 5.7) c = OUT;
        else if (d > 4.6) c = WOOD[lit ? 6 : dark ? 3 : 5];
        else if (on) c = d > 3.6 ? pc[1] : d > 2.6 ? pc[2] : pc[1];
        else c = d > 3.6 ? pc[0] : d > 2.4 ? pc[1] : d > 1.3 ? pc[0] : '#e8584a';
        if (d <= 4.6 && dark) c = mix(c, '#3a2030', .28);
        if (d <= 4.6 && d > 1.3 && hash(x, y, on ? 61 : 60) < .07) c = mix(c, WOOD[3], .6);
        put(b, x, y, c);
      }
      for (const [x, y] of [[2, 2], [10, 2], [2, 10], [10, 10]]) put(b, x, y, IRON[5]);
      for (const [x, y] of [[1, 5], [1, 4], [2, 3], [3, 1], [4, 1]]) put(b, x, y, pick(MOSS, .55 + hash(x, y, 62) * .3, x, y));
      if (on) for (const [x, y] of [[3, 6], [4, 7], [5, 8], [6, 7], [7, 6], [8, 5], [9, 4]]) { put(b, x, y, pc[0]); put(b, x, y + 1, '#2a5a2e'); }
      else { put(b, 5, 5, '#ffb0a0'); put(b, 4, 3, '#ffffff'); }
    });
    const targets = { off: face(false), on: face(true) };
    // Bouncy toadstool.
    const toad = squash => paint(16, squash ? 6 : 10, b => {
      const capH = squash ? 3 : 6, h = squash ? 6 : 10;
      for (let y = 0; y < capH; y++) {
        const f = (capH - y - .3) / capH, hw = Math.round(Math.sqrt(Math.max(0, 1 - f * f)) * 6.6 + .4);
        for (let x = 8 - hw; x < 8 + hw; x++) {
          const lx = (x - 8 + .5) / 7, t = .72 - lx * .3 - (y / capH) * .25 + (y === 0 ? .12 : 0);
          put(b, x, y, pick(CAP, t, x, y));
        }
      }
      for (const [sx, sy] of squash ? [[4, 1], [9, 0], [11, 1]] : [[4, 2], [8, 1], [11, 3], [6, 4], [2, 4]]) if (alphaAt(b, sx, sy)) { put(b, sx, sy, '#f6ead0'); if (alphaAt(b, sx + 1, sy)) put(b, sx + 1, sy, '#d8c4a8'); }
      for (let x = 2; x < 14; x++) put(b, x, capH, x % 2 ? '#c89c80' : '#e8c8a8');
      for (let y = capH + 1; y < h; y++) for (let x = 5; x < 11; x++) put(b, x, y, x === 5 ? '#fff4dc' : x < 8 ? '#e8dcc0' : x < 10 ? '#c8b89c' : '#9a8a78');
      outline(b, OUT);
    });
    const mushroom = toad(false), mushroomSquash = toad(true);
    // Lily pads seen at a slight angle: a round leaf with its notch, veins from the centre, a lit rim,
    // a darker underside and a wet shine; three variants. The water lily has layered petals.
    const lilyPad = (seed, notch) => { const c = document.createElement('canvas'); c.width = 18; c.height = 9; const g = c.getContext('2d'); const cx = 9, cy = 4, rx = 8.2, ry = 3.6;
      const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
      for (let y = 0; y < 9; y++) for (let x = 0; x < 18; x++) {
        const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
        const ang = Math.atan2(dy, dx), da = Math.abs(((ang - notch + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (da > Math.PI - .38 && d > .08) continue;   // the notch
        let col = dy < -.25 ? '#8ec050' : dy < .35 ? '#6a9a3c' : '#4a7a34';
        const vein = [0, 1, 2, 3, 4, 5].some(k => Math.abs(((ang - k * 1.047 - seed) % 1.047 + 1.047) % 1.047) < .09) && d > .12 && d < .8; if (vein) col = dy < 0 ? '#b8d468' : '#8ab850';
        if (d > .72) col = dy < 0 ? '#c8e07a' : '#2e5030';
        P(x, y, col);
      }
      // Outline underneath, and a wet glint.
      g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#15261e'; g.beginPath(); g.ellipse(cx, cy + .6, rx + .8, ry + 1, 0, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
      P(5 + (seed * 3 | 0) % 3, 2, '#f4ffd8'); P(6 + (seed * 3 | 0) % 3, 2, '#dff0a0');
      return c; };
    const lilies = [lilyPad(.2, 1.9), lilyPad(.7, 1.2), lilyPad(.45, 2.6)];
    const lotus = sprite([
      '....w.w....',
      '...wWpWw...',
      '.w.pWWWp.w.',
      'wWpWWYWWpWw',
      '.pWpYYYpWp.',
      '..pppYppp..',
      '...ooooo...'], { w: '#ffe6ee', W: '#ffffff', p: '#e89ab4', Y: '#ffd24a', o: '#6a8a3a' }, 'lotus');
    // Decorations: a grass clump, cattails, a cluster of little mushrooms.
    const tuft = paint(11, 8, b => {
      for (let k = 0; k < 9; k++) { const bx = 1 + k, h = 2 + Math.round(Math.sin(k * 1.3) * 1.5 + 2.5); const lean = k < 3 ? -1 : k > 6 ? 1 : 0; for (let s = 0; s < h; s++) put(b, bx + (s > h - 3 ? lean : 0), 7 - s, pick(MOSS, .35 + .6 * s / h, bx, s)); }
      if (theme !== 'cave') { const fc = P.flowers[0]; put(b, 3, 1, fc); put(b, 8, 2, P.flowers[P.flowers.length > 1 ? 1 : 0]); put(b, 3, 2, pick(MOSS, .4, 3, 2)); }
    });
    const reed = paint(11, 16, b => {
      const stems = [[3, 1, -1], [6, 0, 0], [8, 4, 1]];
      for (const [sx, top, lean] of stems) {
        for (let y = top + 6; y < 16; y++) put(b, sx + (y < top + 9 ? lean : 0), y, pick(MOSS, .3 + (y & 1) * .1, sx, y));
        for (let y = top + 1; y < top + 6; y++) { put(b, sx - 1, y, WOOD[3]); put(b, sx, y, WOOD[y < top + 3 ? 4 : 3]); put(b, sx - 1, y, y === top + 1 ? WOOD[5] : WOOD[3]); }
        put(b, sx, top, pick(MOSS, .4, sx, 0));
      }
      for (let y = 8; y < 16; y++) { put(b, 1 + ((16 - y) >> 2), y, pick(MOSS, .6, 0, y)); put(b, 10 - ((16 - y) >> 2), y, pick(MOSS, .45, 1, y)); }
    });
    const shroom = paint(9, 7, b => {
      const glowy = theme === 'cave';
      const caps = glowy ? ['#2fa89a', '#8ff4e2', '#d8fff6'] : [css(mix(P.cap, OUT, .4)), P.cap, css(mix(P.cap, '#fff0d0', .5))];
      for (const [cx, h, w] of [[2, 3, 3], [5, 5, 4], [7, 2, 2]]) {
        for (let y = 7 - h; y < 7; y++) put(b, cx, y, glowy ? '#8a7c9a' : '#dccfb8');
        const y0 = 7 - h - 1; for (let i = -((w - 1) >> 1); i <= (w >> 1); i++) put(b, cx + i, y0, i < 0 ? caps[2] : i === 0 ? caps[1] : caps[0]);
        if (w > 2) { put(b, cx, y0 - 1, caps[2]); put(b, cx + 1, y0 - 1, caps[1]); }
      }
    });
    return tileCache[theme] = { planks, post, thorns, cracked: [cracked(0), cracked(1)], hard: [hard(0), hard(1)], rootWall, caps, gates, targets, mushroom, mushroomSquash, lilies, lotus, tuft, reed, shroom };
  }

  const WC = WOOD.map(css), IC = IRON.map(css);
  // A pixel line (ropes, chains) from (x0, y0) to (x1, y1), alternating two colours.
  function pline(g, x0, y0, x1, y1, c0, c1) { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) { g.fillStyle = i & 1 ? c1 : c0; g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); } }
  // The bullseye hangs on a rope from whatever is above it, from an arm out of a wall, or stands on a stake.
  // Idle it sways; hit, it wobbles, flashes a ring and spins round to its green back, which it keeps showing.
  function drawTarget(g, L, S, tx, ty, px, py, t, at, solidC) {
    const k = tx + ',' + ty, hit = L.hitTargets.has(k), h0 = L.hitAt && L.hitAt.get(k), f = hit ? (h0 === undefined ? 999 : (L.time || 0) - h0) : -1;
    const up = solidC(at(tx, ty - 1)), wl = solidC(at(tx - 1, ty)), wr = solidC(at(tx + 1, ty)), dn = solidC(at(tx, ty + 1));
    const mount = up ? 'rope' : dn ? 'post' : wl || wr ? 'arm' : 'rope', hang = mount !== 'post';
    let sway = hang ? Math.sin(t / 34 + tx * 1.7 + ty) * .8 : 0;
    if (f >= 0 && f < 60) sway += Math.sin(f * .45) * 3.2 * Math.exp(-f / 16);
    const cx = px + 8, cy = py + (hang ? 9 : 6), ox = cx + Math.round(sway);
    if (mount === 'post') { g.fillStyle = OUT; g.fillRect(px + 6, py + 11, 4, 5); g.fillStyle = WC[5]; g.fillRect(px + 7, py + 11, 1, 5); g.fillStyle = WC[3]; g.fillRect(px + 8, py + 11, 1, 5); g.fillStyle = IC[4]; g.fillRect(px + 6, py + 13, 4, 1); }
    else {
      let ay = py;
      if (mount === 'arm') { const x0 = wr ? cx - 2 : px, x1 = wr ? px + 16 : cx + 3; g.fillStyle = OUT; g.fillRect(x0, py, x1 - x0, 4); g.fillStyle = WC[5]; g.fillRect(x0 + (wr ? 1 : 0), py + 1, x1 - x0 - 1, 1); g.fillStyle = WC[3]; g.fillRect(x0 + (wr ? 1 : 0), py + 2, x1 - x0 - 1, 1); ay = py + 4; }
      else { g.fillStyle = IC[4]; g.fillRect(cx - 1, py, 3, 1); g.fillStyle = OUT; g.fillRect(cx - 1, py + 1, 3, 1); ay = py + 1; }
      pline(g, cx, ay, ox, cy - 7, '#c8b08a', '#7a6048');
    }
    // Spinning on its rope (or its stake): the face narrows to its edge and comes round the other side.
    let img = S.targets.off, w = 13;
    if (hit) { const a = f < 44 ? (1 - Math.pow(1 - f / 44, 3)) * Math.PI * 3 : Math.PI, cs = Math.cos(a); img = cs >= 0 ? S.targets.off : S.targets.on; w = Math.max(1, Math.round(13 * Math.abs(cs))); }
    if (f >= 0 && f < 3) img = ART.tint(img, '#ffffff');
    if (w <= 3) { g.fillStyle = OUT; g.fillRect(ox - 2, cy - 6, 4, 13); g.fillStyle = WC[5]; g.fillRect(ox - 1, cy - 5, 1, 11); g.fillStyle = WC[3]; g.fillRect(ox, cy - 5, 1, 11); }
    else g.drawImage(img, Math.round(ox - w / 2), cy - 6, w, 13);
    g.fillStyle = IC[5]; g.fillRect(ox, cy - 7, 1, 1);
    if (!hit && t % 150 < 8) { g.fillStyle = '#ffffff'; g.fillRect(ox - 4 + (t % 150), cy - 4 + (t % 150), 1, 1); }
    if (f >= 0 && f < 14) { g.globalAlpha = 1 - f / 14; g.strokeStyle = f < 5 ? '#ffffff' : '#b8ff9a'; g.lineWidth = 1; g.beginPath(); g.arc(ox + .5, cy + .5, Math.max(0, 4 + f * 1.4), 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (hit && f > 44 && (t + tx * 13) % 90 < 10) { const s = (t + tx * 13) % 90, a = s / 10 * Math.PI; g.fillStyle = '#e8ffd0'; g.fillRect(Math.round(ox + Math.cos(a) * 7), Math.round(cy + Math.sin(a) * 7) - 1, 1, 1); }
  }
  // Sluice gates: the door runs in iron rails under a beam with a lamp, and a counterweight on a chain rises
  // as it sinks into the slot at its foot. It sinks piece by piece in step with the tiles that open
  // (Game.setGate: the top one first), and shoots back up when it closes. Gates lying flat just drop away.
  function drawGates(g, L, S, camX, camY, W, H, at, solidC) {
    if (!L.gates || !L.gates.length) return;
    const now = L.time || 0;
    for (const gate of L.gates) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const c of gate) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); }
      if ((x1 + 2) * 16 < camX || (x0 - 2) * 16 > camX + W || (y1 + 2) * 16 < camY || (y0 - 2) * 16 > camY + H) continue;
      const vert = x0 === x1, f = gate.t === undefined ? 1e9 : now - gate.t, fs = gate.shutT === undefined ? 1e9 : now - gate.shutT;
      const jx = gate.open ? (f < 6 ? (f & 1 ? 1 : -1) : 0) : fs < 8 ? (fs & 1 ? 1 : -1) * (fs < 4 ? 1 : 0) : 0;
      let sinkV = 0, fullV = 16, moving = false;
      for (let tx = x0; tx <= x1; tx++) {
        const col = gate.filter(c => c.x === tx).sort((a, b) => a.y - b.y); if (!col.length) continue;
        const n = col.length, full = n * 16, px = tx * 16 - camX, py = col[0].y * 16 - camY;
        let cleared = 0; while (cleared < n && at(tx, col[cleared].y) !== 'G') cleared++;
        let sink;
        if (gate.open) {
          // It jolts loose, then each piece is below the slot by the time its tile opens.
          let s = full, pf = 5, ps = 0;
          for (let j = 0; j < n; j++) { const d = 8 + gate.indexOf(col[j]) * 6; if (f <= d) { s = ps + (16 * (j + 1) - ps) * Math.max(0, f - pf) / Math.max(1, d - pf); break; } pf = d; ps = 16 * (j + 1); }
          sink = cleared < n ? Math.min(Math.max(s, cleared * 16), cleared * 16 + 12) : full; if (cleared < n) moving = true;
        } else sink = fs < 6 ? full * Math.pow(1 - fs / 6, 2) : 0;
        if (sink < full) {
          g.save(); g.beginPath(); g.rect(px + (vert ? 1 : 0), py, vert ? 14 : 16, full); g.clip();
          for (let j = 0; j < n; j++) { const y = py + j * 16 + Math.round(sink); if (y >= py + full) break; if (!vert) g.drawImage(S.gates.hatch[tx === x0 ? 0 : 1], px + jx, y); else g.drawImage(n === 1 ? S.gates.one : j === 0 ? S.gates.top : j === n - 1 ? S.gates.bottom : S.gates.mid[j & 1], px + 2 + jx, y); }
          g.restore();
        }
        if (vert) { sinkV = sink; fullV = full; }
      }
      if (!vert) continue;
      const px = x0 * 16 - camX, top = y0 * 16 - camY, bot = (y1 + 1) * 16 - camY;
      // Rails, the sill with its slot, and the beam.
      g.fillStyle = OUT; g.fillRect(px, top, 1, bot - top); g.fillRect(px + 15, top, 1, bot - top);
      g.fillStyle = IC[4]; g.fillRect(px + 1, top, 1, bot - top); g.fillStyle = IC[2]; g.fillRect(px + 14, top, 1, bot - top);
      g.fillStyle = IC[5]; for (let y = top + 6; y < bot - 2; y += 16) { g.fillRect(px + 1, y, 1, 1); g.fillRect(px + 14, y + 8, 1, 1); }
      g.fillStyle = OUT; g.fillRect(px - 1, bot - 1, 18, 2); g.fillStyle = IC[3]; g.fillRect(px - 1, bot + 1, 18, 1); g.fillStyle = IC[1]; g.fillRect(px + 2, bot - 1, 12, 1);
      // Shut, the swamp seeps under it: a drop now and then runs out of the slot.
      if (!gate.open && sinkV === 0) for (let i = 0; i < 2; i++) { const k = (now + i * 37 + x0 * 11) % 70; if (k < 12) { g.fillStyle = k < 8 ? '#8fd9d0' : '#4a8a90'; g.fillRect(px + 4 + i * 7, bot - 3 + (k >> 2), 1, 1); } }
      const bx = px - 3, by = top - 6;
      g.fillStyle = OUT; g.fillRect(bx, by, 22, 6); g.fillStyle = WC[6]; g.fillRect(bx + 1, by + 1, 20, 1); g.fillStyle = WC[4]; g.fillRect(bx + 1, by + 2, 20, 1); g.fillStyle = WC[3]; g.fillRect(bx + 1, by + 3, 20, 1); g.fillStyle = WC[2]; g.fillRect(bx + 1, by + 4, 20, 1);
      g.fillStyle = IC[5]; g.fillRect(bx + 2, by + 2, 1, 1); g.fillRect(bx + 19, by + 2, 1, 1); g.fillStyle = IC[1]; g.fillRect(bx + 2, by + 3, 1, 1); g.fillRect(bx + 19, by + 3, 1, 1);
      // Counterweight on the open side: low while the gate is shut, up under the beam when it is down.
      const side = !solidC(at(x0 + 1, y0)) ? 1 : !solidC(at(x0 - 1, y0)) ? -1 : 0;
      if (side) {
        const chx = side > 0 ? px + 17 : px - 2, cwy = Math.round(top + 1 + (fullV - 12) * (1 - sinkV / fullV)), rat = moving || fs < 8 ? (now >> 1) & 1 : 0;
        pline(g, chx + rat * side, by + 6, chx, cwy, IC[4], IC[1]);
        g.fillStyle = OUT; g.fillRect(chx - 2, cwy, 5, 7); g.fillStyle = IC[3]; g.fillRect(chx - 1, cwy + 1, 3, 5); g.fillStyle = IC[5]; g.fillRect(chx - 1, cwy + 1, 1, 2); g.fillStyle = IC[1]; g.fillRect(chx + 1, cwy + 4, 1, 2);
      }
      // The signal lamp on a bracket low on the rail (on the beam if walled in): dim red while shut, blinking
      // while it moves, green when open. Game.setGate aims the trigger's spark at it.
      const ls = side ? -side : 0, lx = ls > 0 ? px + 19 : ls < 0 ? px - 4 : px + 8, ly = ls ? Math.max(top + 3, bot - 30) : by - 5;
      gate.lamp = { x: lx + camX, y: ly + 2 + camY };
      if (ls) { g.fillStyle = OUT; g.fillRect(ls > 0 ? px + 15 : lx + 2, ly + 1, ls > 0 ? lx - px - 16 : px - lx - 2, 3); g.fillStyle = IC[4]; g.fillRect(ls > 0 ? px + 15 : lx + 2, ly + 2, ls > 0 ? lx - px - 16 : px - lx - 2, 1); }
      const arrive = gate.open && f >= 5 && f < 10, col = gate.open ? (arrive ? '#ffffff' : moving && (now >> 2) & 1 ? '#3f8a3a' : '#8ff0a0') : '#7a2a24';
      if (gate.open && !moving) { g.globalAlpha = .16 + Math.sin(now / 20) * .04; g.fillStyle = '#8ff0a0'; g.beginPath(); g.arc(lx + .5, ly + 2, 8, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = OUT; g.fillRect(lx - 1, ly - 2, 3, 1); g.fillRect(lx - 2, ly - 1, 5, 6); g.fillStyle = IC[4]; g.fillRect(lx - 2, ly - 1, 5, 1); g.fillStyle = IC[3]; g.fillRect(lx - 2, ly + 4, 5, 1);
      g.fillStyle = col; g.fillRect(lx - 1, ly, 3, 4); g.fillStyle = gate.open ? '#e8ffe8' : '#b8504a'; g.fillRect(lx - 1, ly, 1, 1); g.fillStyle = OUT; g.fillRect(lx, ly, 1, 4);
    }
  }
  // A spark flies from what was triggered to the gate's lamp, so the link between them reads.
  function drawLinks(g, L, camX, camY) {
    if (!L.links || !L.links.length) return;
    const now = L.time || 0;
    for (const k of L.links) {
      const f = now - k.t0; if (f < 0 || f > 16) continue;
      const pt = u => ({ x: k.x0 + (k.x1 - k.x0) * u - camX, y: k.y0 + (k.y1 - k.y0) * u - Math.sin(u * Math.PI) * (10 + Math.abs(k.x1 - k.x0) * .15) - camY });
      if (f <= 6) for (let i = 5; i >= 0; i--) { const u = f / 6 - i * .045; if (u < 0) continue; const p = pt(Math.min(1, u)); g.globalAlpha = 1 - i * .15; g.fillStyle = i === 0 ? '#ffffff' : i < 3 ? '#b8ff9a' : '#6cbf4e'; const s = i === 0 ? 3 : i < 3 ? 2 : 1; g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); }
      else { const p = pt(1), r = 2 + (f - 6) * 1.4; g.globalAlpha = 1 - (f - 6) / 10; g.strokeStyle = '#b8ff9a'; g.lineWidth = 1; g.beginPath(); g.arc(Math.round(p.x) + .5, Math.round(p.y) + .5, Math.max(0, r), 0, 7); g.stroke(); }
      g.globalAlpha = 1;
    }
  }
  // Draws the non-earth tiles of one layer ('back' or 'front').
  function drawTiles(g, L, camX, camY, layer, W, H, t) {
    const x0 = Math.max(0, camX >> 4), x1 = Math.min(L.w - 1, (camX + W) >> 4), y0 = Math.max(0, camY >> 4), y1 = Math.min(L.h - 1, (camY + H) >> 4);
    const th = L.def.theme, S = tiles(th), A = water(th), at = (x, y) => x < 0 || x >= L.w ? '#' : y < 0 ? '.' : y >= L.h ? '#' : L.t[y][x];
    const wet = c => c === '~' || c === 'w', solidC = c => c === '#' || c === 'x' || c === 'X' || c === 'M' || c === 'G';
    const wf = (t >> 3) % 8;
    if (layer === 'back') {
      const T = drawTerrain(g, L, camX, camY, W, H);
      const posts = [];
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = L.t[ty][tx]; if (ch === '.' || ch === '#') continue; const px = tx * 16 - camX, py = ty * 16 - camY, h = hash(tx, ty, 3);
        switch (ch) {
          case '=': { const l = at(tx - 1, ty) === '=', r = at(tx + 1, ty) === '='; g.drawImage(!l && !r ? S.planks.one : !l ? S.planks.left : !r ? S.planks.right : S.planks.mid[tx & 1], px, py);
            const dn = at(tx, ty + 1); if (dn === '~' && (!l || !r || tx % 3 === 0)) posts.push([px + (!l ? 2 : !r ? 9 : 5), py + 4]); break; }
          case 'w': {
            const top = !wet(at(tx, ty - 1)); g.drawImage(A.back[top ? 0 : 1][tx & 1], px, py);
            const bob = Math.round(Math.sin((t + tx * 9) / 20)) + (L.lily.has(tx + ',' + ty) ? 2 : 0);
            // A ring of water around the pad, and ripples when someone steps on it.
            const sunk = L.lily.has(tx + ',' + ty), rr = 9 + Math.sin((t + tx * 13) / 16) * .8; g.globalAlpha = .35; g.strokeStyle = '#cfeede'; g.beginPath(); g.ellipse(px + 8, py + 5 + bob, rr, 3.2, 0, 0, 7); g.stroke(); g.globalAlpha = 1;
            if (sunk) { const k = (t % 24) / 24; g.globalAlpha = 1 - k; g.strokeStyle = '#e8fbff'; g.beginPath(); g.ellipse(px + 8, py + 5 + bob, 9 + k * 10, 3 + k * 2, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
            g.drawImage(S.lilies[(tx * 7 + ty) % 3], px - 1, py + bob); if (h < .4) g.drawImage(S.lotus, px + 3 + (tx & 1) * 3, py - 5 + bob); break; }
          case 'F': fire.tile(g, L, tx, ty, px, py); break;
          case '^': g.drawImage(S.thorns[tx & 1], px, py + 8); break;
          case 'x': g.drawImage(S.cracked[(tx + ty) & 1], px, py); if (!solidC(at(tx, ty - 1))) g.drawImage(S.caps[tx % 3], px, py - 4); break;
          case 'X': g.drawImage(S.hard[ty & 1], px, py); if (!solidC(at(tx, ty - 1))) g.drawImage(S.caps[(tx + 1) % 3], px, py - 4); break;
          case 'M': { const u = at(tx, ty - 1) === 'M', d = at(tx, ty + 1) === 'M'; g.drawImage(!u ? S.rootWall.top : !d && !solidC(at(tx, ty + 1)) ? S.rootWall.bottom : S.rootWall.mid[ty & 1], px, py); if (!solidC(at(tx, ty - 1))) g.drawImage(S.caps[tx % 3], px, py - 4); break; }
          case 'T': drawTarget(g, L, S, tx, ty, px, py, t, at, solidC); break;
          case '%': { if (L.mush.get(tx + ',' + ty)) g.drawImage(S.mushroomSquash, px, py + 10); else g.drawImage(S.mushroom, px, py + 6); break; }
          case ',': g.drawImage(S.tuft, px + 2 + (h * 4 | 0), py + 9); break;
          case "'": g.drawImage(S.reed, px + 2 + (h * 3 | 0), py + 1); break;
          case '"': g.drawImage(S.shroom, px + 3 + (h * 4 | 0), py + 10); break;
          case '~': { const u = at(tx, ty - 1); let row = 0; if (wet(u)) { row = 1; if (wet(at(tx, ty - 2))) row = wet(at(tx, ty - 3)) ? 3 : 2; } g.drawImage(A.back[row][(tx + ty) & 1], px, py); break; }
        }
      }
      for (const [x, y] of posts) g.drawImage(S.post, x, y);
      fire.back(g, L, camX, camY, W, H);
      drawGates(g, L, S, camX, camY, W, H, at, solidC);
      return T;
    }
    drawLinks(g, L, camX, camY);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = L.t[ty][tx]; if (ch !== '~') continue; const px = tx * 16 - camX, py = ty * 16 - camY;
      if (wet(at(tx, ty - 1))) { g.drawImage(A.deepFront, px, py); continue; }
      g.drawImage(A.front[(wf + tx) % 8], px, py);
      const fr = ((t >> 3) + tx) % 4;
      if (solidC(at(tx - 1, ty))) g.drawImage(A.foam[fr], px, py);
      if (solidC(at(tx + 1, ty))) g.drawImage(ART.flip(A.foam[(fr + 2) % 4]), px + 8, py);
    }
  }

  // ---------------------------------------------------------------- Objetos
  const WP = { o: OUT, d: css(WOOD[1]), m: css(WOOD[2]), w: css(WOOD[3]), W: css(WOOD[4]), L: css(WOOD[5]), H: css(WOOD[6]), i: css(IRON[2]), I: css(IRON[4]), n: css(IRON[5]), g: '#4e7a34', G: '#8fb448' };
  const props = {
    crate: sprite([
      '.oooooooooooo.',
      'oIHHGgHHHHHHIo',
      'oHLLLLLLLLLLwo',
      'oLmmmmmmmmmmmo',
      'oLWWWWWWWLLWmo',
      'oLWwwwwwLLmWmo',
      'oLWwwwwLLmwWmo',
      'oLWwwwLLmwwWmo',
      'oLWwwLLmwwwWmo',
      'oLWwLLmwwwwWmo',
      'oLmmmmmmmmmmmo',
      'oLWWWWWWWWWWmo',
      'oImmmmmmmmmmIo',
      '.oooooooooooo.'], WP, 'crate'),
    rock: sprite([
      '....oGgGo...',
      '..ooHGLLSoo.',
      '.oHHLLLSSSso',
      'oHLLLSSSSSso',
      'oLLSSSSSSsso',
      'oLSSSSSSssdo',
      'oSSSSsSsssdo',
      '.osssssssddo',
      '..oodddddoo.',
      '....ooooo...'], { o: OUT, H: css(STONE[6]), L: css(STONE[5]), S: css(STONE[4]), s: css(STONE[3]), d: css(STONE[2]), G: '#8fb448', g: '#4e7a34' }, 'rock'),
    heart: sprite(['.oo...oo.', 'oRRo.oRRo', 'oRWRoRRro', 'oRRRRRRro', '.oRRRRro.', '..oRRro..', '...oro...', '....o....'], { o: '#3a1428', R: '#e8445a', W: '#ffd8de', r: '#a82848' }, 'heart'),
    sign: sprite([
      '.oooooooooooo.',
      'oHGgHHHHHGHHwo',
      'oHLLLLLLLLLLmo',
      'oHLddddddLLLmo',
      'oHLLLLLLLLLLmo',
      'oHLdddLddddLmo',
      'oHWWWWWWWWWWmo',
      'ommmmmmmmmmmmo',
      '.oooooooooooo.',
      '.....oLmo.....',
      '.....oLmo.....',
      '....ooWmoo....'], WP, 'sign'),
    raft: sprite([
      '.oooooooooooooooooooooo.',
      'oHLHHLHHHLHHLHHHLHHLHHWo',
      'oLWnLWWLWWLnWLWWLWnLWWmo',
      'oWmiWmmWmmWimWmmWmiWmmdo',
      'odddddddddddddddddddddd.',
      '.oooooooooooooooooooooo.',
      '..oddo..........oddo....',
      '..oooo..........oooo....'], WP, 'raft'),
    boat: sprite([
      '.............oo.................',
      '............oYYo................',
      '............oyyo................',
      '.............oo.................',
      '.............ow.................',
      'oo...........ow...............oo',
      'oLHooooooooooooooooooooooooooHLo',
      '.oLHHHHHHHHHHHHHHHHHHHHHHHHHHLo.',
      '..oWLLLLLLLLLLLLLLLLLLLLLLLLWo..',
      '...omWWWWWWWWWWWWWWWWWWWWWWmo...',
      '....oommmmmmmmmmmmmmmmmmmmoo....',
      '......oooooooooooooooooooo......'], Object.assign({ Y: '#fff2b8', y: '#ffc84a' }, WP), 'boat'),
    plate: { off: sprite(['..oooooooooooo..', '.oHLLLLLLLLLLSo.', '.oLSSrrrrrrSSso.', 'oossssssssssssoo', 'oooooooooooooooo'], { o: OUT, H: css(STONE[6]), L: css(STONE[5]), S: css(STONE[4]), s: css(STONE[2]), r: '#c8583e' }, 'plate'),
      on: sprite(['................', '................', '..oooooooooooo..', 'ooLLGGGGGGGGLLoo', 'oooooooooooooooo'], { o: OUT, L: css(STONE[5]), G: '#8ff0a0' }, 'plate-on') } };
  // The lantern (the save point) as a small still, for icons and scenes: a paper lantern hanging from a
  // crooked, mossy post. The one in the levels is drawn live by farol.js (it sways, glows and flickers).
  const lanternRows = [
    '.oooooo...',
    'oppppppo..',
    'opnoooPo..',
    'opPo..o...',
    'opPo.oCo..',
    'onPooCCCo.',
    'opPoGLLLGo',
    'opPoGLWLGo',
    'opmoGLWLGo',
    'opPoGLLLGo',
    'opPoGGGGGo',
    'opPooCCCo.',
    'omPo.oRo..',
    'opPo..R...',
    'opPo......',
    'npPmo.....',
    'mnmnmo....',
    'oooooo....'];
  const LANT = { o: OUT, P: css(WOOD[3]), p: css(WOOD[5]), C: css(WOOD[1]), R: '#c0463a', m: '#5e8a2e', n: '#8cba48' };
  props.lantern = { off: sprite(lanternRows, Object.assign({ G: '#2e2c3c', L: '#3c3a4c', W: '#c0603a' }, LANT), 'lantern'),
    on: sprite(lanternRows, Object.assign({ G: '#f4a83c', L: '#ffe08a', W: '#fffbe0' }, LANT), 'lantern-on') };

  // ---------------------------------------------------------------- Fondos
  // Sky gradients run top to horizon; hills, far trees, bald cypresses and reeds get
  // closer to the sky colour the farther away they are.
  const BG = {
    dusk: { sky: ['#17183a', '#232450', '#352c5c', '#523866', '#78456a', '#a25666', '#c86c5c', '#e2905c', '#f0b66a', '#f6d284'],
      moon: { x: 244, y: 32, r: 11, dark: '#caa87a', base: '#f2e0b0', light: '#fffae6', halo: '#fbe0a8' }, stars: 1,
      cloud: { top: '#40325e', mid: '#6a4468', lit: '#ec9e7a', below: true },
      hills: ['#9a5a70', '#7a4c6c'], far: '#553a64', farRim: '#9a6072', mist: '#c88480', water: '#f0b070',
      mid: '#2e2444', midRim: '#6e4a6e', moss: '#5c5474', reeds: '#1b1629', reedRim: '#4e3652', head: '#3e2228' },
    night: { sky: ['#060914', '#0a1022', '#0e1830', '#12213c', '#172c48', '#1c3852', '#22465c', '#2a5664'],
      moon: { x: 250, y: 34, r: 12, dark: '#9ab0c0', base: '#e2eef4', light: '#ffffff', halo: '#a8d0e8' }, stars: 1.6, milky: 1,
      cloud: { top: '#20304a', mid: '#18243a', lit: '#6a8aa8', below: false },
      hills: ['#1e3448', '#18293e'], far: '#142438', farRim: '#34566e', mist: '#2e5266', water: '#7ab0c8',
      mid: '#0d1727', midRim: '#35587a', moss: '#2a4256', reeds: '#09101a', reedRim: '#224058', head: '#1e1814' },
    storm: { sky: ['#0b0d13', '#10131b', '#161a24', '#1c222e', '#232b37', '#2b3440', '#343f4a', '#3e4a54'],
      stars: 0, cloud: null,
      hills: ['#26303c', '#1e2632'], far: '#1a212c', farRim: '#34404e', mist: '#3e4a58', water: '#6a7a88',
      mid: '#10161e', midRim: '#2e3a48', moss: '#28343e', reeds: '#0a0e14', reedRim: '#22303a', head: '#1e1a16' },
    cave: { sky: ['#0a0810', '#0e0b16', '#130f1d', '#181224', '#1d162b', '#221a31', '#281e37'], stars: 0, cave: 1,
      rock: ['#140f1b', '#1c1526', '#261c31', '#30243c', '#3c2e48', '#4c3c5a', '#5e4c6c'], mist: '#3a2e52', glow: ['#2fa89a', '#8ff4e2', '#e0fff8'], worm: '#8ad0ff',
      mid: '#161020', midRim: '#4a3a60', reeds: '#120d19', reedRim: '#4a3a60' },
    nest: { sky: ['#24122e', '#3a1a3c', '#5a2446', '#7e2e4a', '#a43c4a', '#c8524a', '#e0704c', '#ee9452', '#f6b862', '#fad68a'],
      moon: { x: 74, y: 96, r: 16, dark: '#f8b060', base: '#ffd88a', light: '#fff4d0', halo: '#ffc070', sun: 1 }, stars: .25,
      cloud: { top: '#5a2442', mid: '#8a3448', lit: '#f8b070', below: true },
      hills: ['#b25a5a', '#8e4452'], far: '#6c3048', farRim: '#d8805c', mist: '#e8966c', water: '#f8c080',
      mid: '#3a1a30', midRim: '#c06050', moss: '#6a3a44', reeds: '#1f0e19', reedRim: '#7a3432', head: '#2a1414', snag: '#2a1226', snagRim: '#e88a60' } };

  function skyLayer(p) {
    const b = Buf(320, 180), R = ramp(p.sky, 28), M = p.moon;
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) put(b, x, y, pick(R, Math.min(1, y / 150), x, y));
    const twinkle = [];
    if (p.milky) for (let y = 0; y < 130; y++) for (let x = 0; x < 320; x++) {
      const d = Math.abs((x - 40) * .42 - y + 10) / 26; if (d > 1) continue;
      const n = noise(x / 14, y / 10, 5) * (1 - d);
      if (n > .38 && dith(x, y) < (n - .38) * 2.4) put(b, x, y, '#6a7aa8', .22);
      if (hash(x, y, 6) < .03 * (1 - d)) put(b, x, y, '#9ab0d8', .7);
    }
    if (p.stars) {
      const r = rng(77);
      for (let i = 0; i < 90 * p.stars; i++) {
        const x = r() * 320 | 0, y = (r() * r()) * 130 | 0; if (M && Math.hypot(x - M.x, y - M.y) < M.r * 3) continue;
        const k = r(), sky = R[Math.round(Math.min(1, y / 150) * 27)];
        if (k < .08) { put(b, x, y, '#fffbe8'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(b, x + dx, y + dy, mix(sky, '#e8ecff', .45)); twinkle.push({ x, y, c: '#ffffff', ph: r() * 6, sp: .03 + r() * .05 }); }
        else put(b, x, y, mix(sky, '#f0f0ff', .35 + k * .55));
        if (k > .8) twinkle.push({ x, y, c: '#ffffff', ph: r() * 6, sp: .04 + r() * .06 });
      }
    }
    if (M) {
      const HR = M.r * (M.sun ? 5 : 3.8);
      for (let y = Math.max(0, M.y - HR | 0); y < Math.min(180, M.y + HR); y++) for (let x = Math.max(0, M.x - HR | 0); x < Math.min(320, M.x + HR); x++) {
        const d = Math.hypot(x - M.x, y - M.y); if (d <= M.r || d > HR) continue;
        const s = Math.pow(1 - (d - M.r) / (HR - M.r), 1.7), lv = Math.floor(s * 5 + dith(x, y) * .999) / 5;
        if (lv > 0) put(b, x, y, M.halo, lv * (M.sun ? .6 : .42));
      }
      for (let y = -M.r; y <= M.r; y++) for (let x = -M.r; x <= M.r; x++) {
        const d = Math.hypot(x, y); if (d > M.r + .3) continue;
        const lit = (-x - y) / (M.r * 1.4);
        let t = .55 + lit * .5; if (!M.sun && noise((x + 40) / 3.2, (y + 40) / 3.2, 8) > .66) t -= .35;
        if (d > M.r - 1.2 && x + y > 0) t -= .3;
        const col = pick([rgb(M.dark), rgb(M.base), rgb(M.light)], clamp01(t), x, y);
        put(b, M.x + x, M.y + y, col);
      }
      if (M.sun) for (const [yy, w] of [[M.y + 5, 44], [M.y + 9, 30], [M.y - 3, 22]]) for (let x = M.x - w; x < M.x + w; x++) if (hash(x, yy, 3) < .9) put(b, x, yy, mix(p.sky[4], M.halo, .25));
    }
    const c = toCanvas(b); c.twinkle = twinkle; return c;
  }
  // Puffy clouds with flat bellies, lit from below at sunset and from above by the moon,
  // plus a few long thin streaks.
  function cloudLayer(p, seed) {
    const W = 480, H = 70, M = Mask(W, H), r = rng(seed);
    for (let i = 0; i < 6; i++) {
      const cx = r() * W, by = 16 + r() * 44, w = 24 + r() * 60, n = 3 + (r() * 4 | 0);
      for (let k = 0; k < n; k++) {
        const px = cx + (k / (n - 1) - .5) * w, rad = (4 + r() * 7) * (1 - Math.abs(k / (n - 1) - .5) * .8), py = by - rad * .5;
        for (let y = Math.floor(py - rad); y <= by; y++) for (let x = Math.floor(px - rad * 1.5); x <= px + rad * 1.5; x++) {
          const dx = (x - px) / (rad * 1.5), dy = (y - py) / rad, e = dx * dx + dy * dy;
          if (e > 1 || e > .7 && noise(x / 2, y / 2, seed) < (e - .7) * 2.5) continue;
          mset(M, x, y, 1);
        }
      }
      for (let x = Math.floor(cx - w * .7); x < cx + w * .7; x++) if (r() < .8) mset(M, x, by, 1);
    }
    for (let i = 0; i < 5; i++) { const x0 = r() * W, y = 8 + r() * 58 | 0, len = 20 + r() * 70; for (let x = x0; x < x0 + len; x++) if (noise(x / 6, y, seed) > .35) mset(M, x, y, 3); }
    const b = Buf(W, H), C = p.cloud;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = mget(M, x, y); if (!v) continue;
      if (v === 3) { put(b, x, y, C.below ? C.lit : C.mid, .8); continue; }
      const dn1 = !mget(M, x, y + 1), dn2 = !mget(M, x, y + 2), dn3 = !mget(M, x, y + 3), up1 = !mget(M, x, y - 1), up2 = !mget(M, x, y - 2);
      let c;
      if (C.below) c = dn1 ? C.lit : dn2 ? (dith(x, y) < .75 ? C.lit : C.mid) : dn3 ? (dith(x, y) < .3 ? C.lit : C.mid) : up1 || (up2 && dith(x, y) < .5) ? C.top : C.mid;
      else c = up1 ? C.lit : up2 ? (dith(x, y) < .5 ? C.lit : C.mid) : dn1 ? C.top : C.mid;
      put(b, x, y, c);
    }
    return toCanvas(b);
  }
  function hillLayer(p, seed) {
    const W = 640, H = 60, b = Buf(W, H), tau = Math.PI * 2;
    for (let x = 0; x < W; x++) {
      const u = x / W * tau;
      const y1 = 20 + Math.sin(u * 2 + seed) * 7 + Math.sin(u * 5 + 1) * 3 + Math.sin(u * 13) * 1.2;
      const y2 = 32 + Math.sin(u * 3 + 2) * 5 + Math.sin(u * 7 + seed) * 2.5 + Math.sin(u * 17) * 1;
      for (let y = Math.round(y1); y < H; y++) put(b, x, y, p.hills[0]);
      for (let y = Math.round(y2); y < H; y++) put(b, x, y, p.hills[1]);
      if (hash(x, 0, seed) < .06) { const h = 2 + hash(x, 1, seed) * 5 | 0, top = Math.round(y2) - h; for (let y = top; y < y2; y++) { put(b, x, y, p.hills[1]); if (y > top + 1) { put(b, x - 1, y, p.hills[1]); put(b, x + 1, y, p.hills[1]); } } }
    }
    return toCanvas(b);
  }
  // Silhouettes are drawn into a mask (1 wood, 2 moss) and coloured afterwards with a rim light.
  function Mask(w, h) { return { w, h, m: new Uint8Array(w * h) }; }
  function mset(M, x, y, v) { y = Math.round(y); if (y < 0 || y >= M.h) return; x = ((Math.round(x) % M.w) + M.w) % M.w; if (v === 2 && M.m[y * M.w + x]) return; M.m[y * M.w + x] = v; }
  const mget = (M, x, y) => y < 0 || y >= M.h ? 0 : M.m[y * M.w + (((x % M.w) + M.w) % M.w)];
  function blob(M, cx, cy, rw, rh, s) {
    for (let y = Math.floor(cy - rh - 2); y <= cy + rh; y++) for (let x = Math.floor(cx - rw - 1); x <= cx + rw + 1; x++) {
      const dx = (x - cx) / rw, dy = (y - cy) / (y < cy ? rh + 1.5 * noise(x / 3, 0, s) : rh);
      if (dx * dx + dy * dy <= 1) mset(M, x, y, 1);
    }
  }
  function thick(M, x0, y0, x1, y1, w0, w1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = w0 + (w1 - w0) * t; for (let dy = -w / 2; dy <= w / 2; dy += .5) for (let dx = -w / 2; dx <= w / 2; dx += .5) mset(M, x + dx, y + dy, 1); }
  }
  // A bald cypress: flared trunk with knees, a broad clumpy crown lit from the top-left,
  // and curtains of Spanish moss. Mask values: 1 wood, 3 leaves, 4 lit leaves, 2 moss.
  function clump(M, cx, cy, rw, rh, s) {
    for (let y = Math.floor(cy - rh - 1); y <= cy + rh + 1; y++) for (let x = Math.floor(cx - rw - 1); x <= cx + rw + 1; x++) {
      const dx = (x - cx) / rw, dy = (y - cy) / rh, e = dx * dx + dy * dy;
      if (e > 1.15) continue;
      if (e > .55 && noise(x / 2.2, y / 2, s) < (e - .55) * 1.6) continue;
      const cur = mget(M, x, y), lit = dx + dy * 1.3 < -.55 && e < .9;
      if (cur === 1) continue;
      mset(M, x, y, lit ? 4 : cur === 4 ? 4 : 3);
    }
  }
  function cypress(M, x0, gy, h, r, opt = {}) {
    const tw = opt.tw || Math.max(2, h / 14), lean = (r() - .5) * .2, flare = opt.flare || tw * 1.5;
    const top = gy - h;
    for (let y = gy + 2; y >= top + h * .12; y--) {
      const t = (gy - y) / h, half = tw / 2 * (1 - t * .5) + flare * Math.pow(Math.max(0, 1 - t * 3.4), 2.2), cx = x0 + lean * (gy - y);
      for (let x = Math.floor(cx - half); x <= cx + half; x++) mset(M, x, y, 1);
    }
    for (let k = 0; k < 3; k++) { const kx = x0 + (r() - .5) * flare * 6, kh = 2 + r() * Math.max(2, h / 16); for (let y = 0; y < kh; y++) { const w = (1 - y / kh) * 1.6; for (let x = Math.floor(kx - w); x <= kx + w; x++) mset(M, x, gy - y, 1); } }
    if (opt.dead) return;
    const sc = h / 70, crownW = (opt.crown || 16 + r() * 12) * sc, pads = [];
    const n = Math.round(5 + h / 9);
    for (let k = 0; k < n; k++) {
      const t = .5 + r() * .48, y = gy - h * t, tx = x0 + lean * h * t;
      const spread = crownW * (.35 + .65 * (t - .45) / .55), cx = tx + (r() * 2 - 1) * spread;
      const rw = (3 + r() * 5) * Math.max(.7, sc), rh = (1.6 + r() * 2.2) * Math.max(.7, sc);
      thick(M, tx, y + rh + 2, cx, y + rh * .5, Math.max(1, 2 * sc), 1);
      pads.push([cx, y, rw, rh]);
    }
    const tx = x0 + lean * h;
    pads.push([tx, top + 2 * sc, crownW * .45, 2.5 * Math.max(.8, sc)]);
    pads.sort((a, b) => b[1] - a[1]);
    for (const [cx, cy, rw, rh] of pads) clump(M, cx, cy, rw, rh, (cx * 7 + cy) | 0);
    for (const [cx, cy, rw, rh] of pads) for (let x = Math.floor(cx - rw * .8); x <= cx + rw * .8; x++) {
      if (r() > .42) continue;
      let y = Math.round(cy); while (mget(M, x, y + 1) >= 3 || mget(M, x, y + 1) === 1 && mget(M, x, y) >= 3) y++;
      if (mget(M, x, y + 1) === 1) continue;
      const len = (2 + r() * (opt.moss || 10) * (1 - Math.abs(x - cx) / rw)) | 0;
      for (let k = 1; k <= len; k++) mset(M, x + (opt.wind && k > 3 ? Math.round(k * opt.wind) : 0), y + k, 2);
    }
  }
  // Colours a mask: wood and leaves with a rim light on top-left edges; moss lighter, darker at its tips.
  function colourMask(M, body, rim, moss, fog, fogFrom, leaf) {
    const b = Buf(M.w, M.h), mossDark = moss ? mix(moss, body, .5) : null, leafC = leaf || body, leafLit = mix(leafC, rim || leafC, .45);
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
      const v = M.m[y * M.w + x]; if (!v) continue;
      let c;
      if (v === 2) c = mget(M, x, y + 1) !== 2 || mget(M, x, y + 2) !== 2 && dith(x, y) < .5 ? mossDark : moss;
      else {
        const edge = !mget(M, x, y - 1) || mget(M, x, y - 1) === 2 || !mget(M, x - 1, y) && (y & 1);
        c = rim && edge ? rim : v === 4 ? (dith(x, y) < .55 ? leafLit : leafC) : v === 3 ? leafC : body;
      }
      if (fog && y > fogFrom) { const f = (y - fogFrom) / (M.h - fogFrom); c = mix(c, fog, Math.floor(f * 4 + dith(x, y) * .5) / 4 * .45); }
      put(b, x, y, c);
    }
    return b;
  }
  function farLayer(p, seed) {
    const W = 480, H = 96, gy = 82, M = Mask(W, H), r = rng(seed);
    for (let x = 0; x < W; x++) for (let y = gy + Math.round(Math.sin(x / 17 + seed) * 1.2); y < gy + 3; y++) mset(M, x, y, 1);
    for (let x = 4; x < W; x += 12 + r() * 22) cypress(M, x, gy, 16 + r() * 30, r, { moss: 5, crown: 12 + r() * 10, wind: p === BG.storm ? .5 : 0 });
    const b = colourMask(M, p.far, p.farRim, mix(p.far, p.mist, .3), p.mist, gy - 30, mix(p.far, p.farRim, .15));
    // Still water under the far bank, mirroring it.
    for (let y = gy + 3; y < H; y++) for (let x = 0; x < W; x++) {
      const my = 2 * (gy + 2) - y, refl = mget(M, x + Math.round(Math.sin(y * 1.7) * 1.2), my);
      let c = mix(p.far, p.water, .2 + (y - gy) * .012);
      if (refl && (y & 1) === 0) c = mix(p.far, p.water, .06);
      if ((y & 1) && hash(x >> 3, y, 5) < .07) c = mix(p.water, p.mist, .35);
      put(b, x, y, c);
    }
    const c = toCanvas(b); c.gy = gy; return c;
  }
  function midLayer(p, seed) {
    const W = 640, H = 160, gy = 148, M = Mask(W, H), r = rng(seed);
    for (let x = 0; x < W; x++) for (let y = gy + Math.round(Math.sin(x / 23 + seed) * 2); y < H; y++) mset(M, x, y, 1);
    // Shrubs along the bank.
    for (let x = 0; x < W; x += 6 + r() * 10) blob(M, x, gy - 1, 5 + r() * 9, 2 + r() * 4, x);
    const n = 6; for (let k = 0; k < n; k++) cypress(M, k * W / n + r() * 50, gy, (k % 2 ? 50 : 70) + r() * 40, r, { moss: 16, wind: p === BG.storm ? .6 : 0 });
    const c = toCanvas(colourMask(M, p.mid, p.midRim, p.moss, p.mist, gy - 16, mix(p.mid, p.midRim, .18))); c.gy = gy; return c;
  }
  // The dead bald cypress where the heron nests.
  function snagLayer(p) {
    const W = 200, H = 190, gy = 186, M = Mask(W, H), r = rng(404), cx = 96;
    for (let y = gy; y > 34; y--) {
      const t = (gy - y) / 152, half = 8 * (1 - t * .55) + 16 * Math.pow(Math.max(0, 1 - t * 3), 2.4), sx = cx + Math.sin(t * 3) * 4;
      for (let x = Math.floor(sx - half); x <= sx + half; x++) mset(M, x, y, 1);
    }
    const limbs = [[.35, -1, 38, .5], [.48, 1, 44, .35], [.6, -1, 30, .7], [.7, 1, 26, .9], [.8, -1, 20, .4], [.9, 1, 16, .6]];
    for (const [t, side, len, up] of limbs) {
      const y0 = gy - 152 * t, x0 = cx + Math.sin(t * 3) * 4; let x = x0, y = y0, w = 4.5 * (1.1 - t * .6);
      const steps = len / 2;
      for (let s = 0; s < steps; s++) { const nx = x + side * 2, ny = y - 2 * up + (r() - .5) * 2; thick(M, x, y, nx, ny, w, w * .9); x = nx; y = ny; w = Math.max(1, w * .93); if (r() < .15) { let bx = x, by = y; for (let q = 0; q < 6; q++) { bx += side * (r() < .5 ? 1 : 0); by -= 1; mset(M, bx, by, 1); } } }
      for (let q = 0; q < 6; q++) mset(M, x + side * q * .6, y - q, 1);
    }
    // Moss rags on the limbs.
    for (let x = 0; x < W; x++) for (let y = 30; y < gy - 60; y++) if (mget(M, x, y) === 1 && !mget(M, x, y + 1) && r() < .35) { const len = 2 + r() * 9 | 0; for (let k = 1; k <= len; k++) mset(M, x, y + k, 2); }
    const b = colourMask(M, p.snag, p.snagRim, p.moss, p.mist, gy - 40);
    // The nest: a bowl of sticks on top of the trunk.
    for (let y = 18; y < 40; y++) for (let x = cx - 28; x < cx + 28; x++) {
      const dx = (x - cx) / 26, dy = (y - 32) / 8; if (dx * dx + dy * dy > 1 || y < 25 - Math.abs(dx) * -2) continue;
      put(b, x, y, (x + y * 2) % 5 === 0 ? mix(p.snag, p.snagRim, .5) : (x - y) % 7 === 0 ? mix(p.snag, '#000', .2) : p.snag);
    }
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI, len = 8 + r() * 12, x0 = cx + (r() - .5) * 46, y0 = 26 + r() * 8; for (let s = 0; s < len; s++) put(b, x0 + Math.cos(a) * s * (r() < .5 ? 1 : -1), y0 - Math.sin(a) * s * .25, s < 2 ? mix(p.snag, p.snagRim, .6) : p.snag); }
    for (let x = cx - 25; x < cx + 25; x++) if (hash(x, 1, 7) < .6) put(b, x, 24 + Math.round(Math.abs(x - cx) / 8), p.snagRim);
    const c = toCanvas(b); c.gy = gy; return c;
  }
  function reedLayer(p, seed) {
    const W = 320, H = 56, b = Buf(W, H), r = rng(seed);
    for (let i = 0; i < 70; i++) {
      const x = r() * W | 0, dens = noise(x / 30, 0, seed); if (r() > dens * 1.4) continue;
      const h = 14 + r() * 36 | 0, lean = (r() - .5) * .3, top = H - h;
      for (let y = H - 1; y > top; y--) { const xx = Math.round(x + lean * (H - y)); put(b, xx, y, p.reeds); if (y < H - 4 && y % 3 === 0) put(b, xx - 1, y, p.reedRim); }
      const hx = Math.round(x + lean * h);
      if (r() < .55) { for (let y = top + 2; y < top + 9; y++) { put(b, hx - 1, y, y < top + 4 ? p.reedRim : p.head); put(b, hx, y, p.head); put(b, hx + 1, y, p.reeds); } put(b, hx, top, p.reeds); put(b, hx, top + 1, p.reeds); }
      for (let k = 0; k < 2; k++) { const side = k ? 1 : -1, len = 8 + r() * 16 | 0; let lx = x, ly = H - 2; for (let s = 0; s < len; s++) { put(b, lx, ly, p.reeds); if (s < len * .4) put(b, lx + side, ly, p.reeds); ly--; if (s > len * .4 && s % 2) lx += side; } put(b, lx, ly, p.reedRim); }
    }
    const c = toCanvas(b); c.gy = H; return c;
  }
  function mistLayer(color, seed, alpha) {
    const W = 320, H = 26, b = Buf(W, H), tau = Math.PI * 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bell = Math.sin(y / H * Math.PI), wave = .65 + .35 * Math.sin(x / W * tau * 3 + seed + y * .1) * Math.sin(x / W * tau * 2 + 1);
      const dens = bell * bell * wave, lv = Math.floor(dens * 4 + dith(x, y) * .6) / 4;
      if (lv > 0) put(b, x, y, color, alpha * lv);
    }
    return toCanvas(b);
  }
  // Storm clouds: a low, heavy bank with bellies lit by the lightning.
  function stormLayer(seed) {
    const W = 480, H = 70, M = Mask(W, H), r = rng(seed);
    for (let i = 0; i < 16; i++) { const x = r() * W, y = 10 + r() * 28, n = 3 + (r() * 4 | 0), rad = 7 + r() * 8; for (let k = 0; k < n; k++) blob(M, x + k * rad, y + r() * 5, rad * (.8 + r() * .5), rad * (.5 + r() * .3), i * 9 + k); }
    for (let x = 0; x < W; x++) for (let y = 0; y < 12 + Math.sin(x / W * Math.PI * 8) * 3 + noise(x / 7, 0, seed) * 4; y++) mset(M, x, y, 1);
    const b = Buf(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mget(M, x, y)) continue;
      const dn = !mget(M, x, y + 1), dn2 = !mget(M, x, y + 2), up = !mget(M, x, y - 1);
      put(b, x, y, dn ? '#4a5868' : dn2 && dith(x, y) < .5 ? '#34404e' : up ? '#2a3440' : noise(x / 10, y / 4, seed) > .6 ? '#1c242e' : '#141a22');
    }
    return toCanvas(b);
  }
  function millLayer() {
    return paint(40, 72, b => {
      const body = '#0e141c', rim = '#2c3a4a';
      for (let y = 0; y < 52; y++) { const hw = 6 + (y * 7 / 52) | 0; for (let x = 20 - hw; x < 20 + hw; x++) put(b, x, 18 + y, x === 20 - hw ? rim : body); }
      rect(b, 12, 14, 16, 5, body); rect(b, 14, 11, 12, 3, body); rect(b, 17, 9, 6, 2, body); rect(b, 12, 14, 16, 1, rim); rect(b, 14, 11, 12, 1, rim);
      rect(b, 18, 40, 3, 4, '#f2c46a'); put(b, 18, 40, '#fff0c0'); rect(b, 18, 44, 3, 1, '#8a6a3a');
      for (let y = 22; y < 68; y += 7) put(b, 16 + (y % 3), y, rim);
    });
  }
  // Cave: layered rock with stalactites, glow-worms on the ceiling and glowing fungi.
  function fungus(b, x, y, p, big) {
    const n = big ? 3 + (hash(x, y, 1) * 3 | 0) : 2 + (hash(x, y, 1) * 2 | 0), out = [];
    for (let k = 0; k < n; k++) {
      const fx = x + Math.round((k - (n - 1) / 2) * (big ? 4 : 3) + (hash(x, k, 2) - .5) * 2), h = (big ? 3 : 1) + (hash(x, k, 3) * (big ? 6 : 3) | 0), w = big ? 2 + (hash(k, x, 4) * 2 | 0) : 1;
      for (let s = 0; s < h; s++) put(b, fx, y - s, '#7a6a90');
      const cy = y - h;
      for (let i = -w; i <= w; i++) put(b, fx + i, cy, i < 0 ? p.glow[1] : p.glow[0]);
      for (let i = -w + 1; i <= w - 1; i++) put(b, fx + i, cy - 1, i < 0 ? p.glow[2] : p.glow[1]);
      if (w > 1) put(b, fx, cy - 2, p.glow[2]);
      out.push([fx, cy]);
    }
    for (let dy = -9; dy <= 6; dy++) for (let dx = -12; dx <= 12; dx++) { const d = Math.hypot(dx, dy * 1.4); if (d < 12 && dith(x + dx, y + dy) < (1 - d / 12) * .6) put(b, x + dx, y + dy - 3, p.glow[0], .3); }
    return out;
  }
  function caveFar(p) {
    const W = 480, H = 200, b = Buf(W, H), R = ramp(p.rock, 8), tau = Math.PI * 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const wob = Math.sin(x / W * tau * 3) * 5 + Math.sin(x / W * tau * 7 + 1) * 2, band = Math.floor((y + wob) / 9);
      const pocket = Math.sin(x / W * tau * 4 + 1) * Math.sin(y / 26 + 1) + (noise(x / 20, y / 14, 2) - .5) * .8;
      if (y > 40 && y < 170 && pocket > .55) { put(b, x, y, pick(R, .04, x, y)); continue; }
      let t = .3 + hash(band, 0, 3) * .3;
      if (((y + wob) % 9) < 1) t -= .2; else if (((y + wob) % 9) < 2) t += .12;
      t += (noise(x / 8, y / 5, 4) - .5) * .2 - (pocket > .4 ? .15 : 0);
      put(b, x, y, pick(R, t, x, y));
    }
    const r = rng(9);
    for (let i = 0; i < 46; i++) {
      const x = r() * W | 0, len = 8 + r() * 34, w = 2 + r() * 4;
      for (let y = 0; y < len; y++) { const hw = w * (1 - y / len); for (let xx = Math.floor(x - hw); xx <= x + hw; xx++) put(b, (xx + W) % W, 10 + y, xx < x - hw + 1 ? R[6] : xx > x + hw - 1 ? R[1] : R[3]); }
    }
    for (let i = 0; i < 160; i++) { const x = r() * W | 0, y = 6 + r() * r() * 90 | 0; put(b, x, y, p.worm, .45 + r() * .55); if (r() < .15) { put(b, x + 1, y, p.worm, .3); put(b, x, y + 1, p.worm, .3); } }
    const c = toCanvas(b); c.gy = H; return c;
  }
  function caveMid(p, seed) {
    const W = 640, H = 200, M = Mask(W, H), r = rng(seed), gy = 160;
    for (let x = 0; x < W; x++) for (let y = 0; y < 8 + Math.sin(x / 13) * 3 + Math.sin(x / 41) * 5; y++) mset(M, x, y, 1);
    for (let i = 0; i < 18; i++) { const x = r() * W, len = 16 + r() * 56, w = 3 + r() * 8; for (let y = 0; y < len; y++) { const hw = w * Math.pow(1 - y / len, .8); for (let xx = Math.floor(x - hw); xx <= x + hw; xx++) mset(M, xx, y, 1); } }
    for (let x = 0; x < W; x++) for (let y = gy + Math.round(Math.sin(x / 19) * 3); y < H; y++) mset(M, x, y, 1);
    const tips = [];
    for (let i = 0; i < 12; i++) { const x = r() * W, len = 14 + r() * 46, w = 4 + r() * 8; for (let y = 0; y < len; y++) { const hw = w * Math.pow(1 - y / len, .7); for (let xx = Math.floor(x - hw); xx <= x + hw; xx++) mset(M, xx, gy - y, 1); } tips.push([Math.round(x + w * .6), Math.round(gy - len * .35)]); }
    for (let i = 0; i < 3; i++) { const x = 80 + i * 210 + r() * 40; for (let y = 0; y < H; y++) { const hw = 6 + Math.sin(y / 20 + i) * 2 + Math.pow(Math.abs(y - gy / 2) / (gy / 2), 3) * 14; for (let xx = Math.floor(x - hw); xx <= x + hw; xx++) mset(M, xx, y, 1); } }
    const b = colourMask(M, p.mid, p.midRim, null, null, 0);
    for (let i = 0; i < 50; i++) { const x = r() * W | 0; let y = 0; while (y < H && mget(M, x, y)) y++; if (y > 90) continue; const len = 3 + r() * 18 | 0; for (let k = 0; k < len; k++) put(b, x, y + k, p.midRim, .5); put(b, x, y + len, p.worm); put(b, x, y + len + 1, p.worm, .5); }
    const glows = [];
    for (let i = 0; i < 16; i++) {
      const x = 10 + r() * (W - 20) | 0; let y = gy - 40; while (y < H - 1 && !mget(M, x, y + 1)) y++;
      if (y > gy + 4) continue;
      for (const q of fungus(b, x, y, p, r() < .4)) glows.push(q);
    }
    const c = toCanvas(b); c.gy = H; c.glows = glows.filter((q, i) => i % 2 === 0); return c;
  }
  function caveNear(p, seed) {
    const W = 320, H = 70, b = Buf(W, H), r = rng(seed), glows = [];
    for (let i = 0; i < 5; i++) {
      const x = 20 + r() * (W - 40) | 0, h = 14 + r() * 22 | 0, cw = 5 + r() * 5 | 0;
      for (let y = H - h; y < H; y++) { put(b, x - 1, y, p.reedRim); put(b, x, y, '#4a3a5c'); put(b, x + 1, y, p.reeds); }
      for (let dx = -cw; dx <= cw; dx++) {
        const f = dx / (cw + .5), yy = H - h - Math.round(Math.sqrt(Math.max(0, 1 - f * f)) * 4);
        for (let y = yy; y <= H - h; y++) put(b, x + dx, y, y === yy ? p.glow[2] : y === yy + 1 || dx < -cw / 2 ? p.glow[1] : p.glow[0]);
        put(b, x + dx, H - h + 1, dx % 2 ? '#1c6a64' : '#2a8a80');
      }
      glows.push([x, H - h - 2]);
    }
    const c = toCanvas(b); c.gy = H; c.glows = glows; return c;
  }
  function raysLayer(p) {
    return paint(320, 180, b => {
      for (const [x0, w] of [[70, 16], [150, 10], [250, 22]]) for (let y = 0; y < 180; y++) {
        const x1 = x0 + y * .35;
        for (let x = Math.floor(x1); x < x1 + w + y * .08; x++) { const f = (1 - y / 180) * .9; if (dith(x, y) < f * .45) put(b, x, y, '#b8a8e8', .16); }
      }
    });
  }
  const bgCache = {};
  function background(theme) {
    if (bgCache[theme]) return bgCache[theme];
    const p = BG[theme] || BG.dusk, cave = !!p.cave;
    const bg = { theme: p, name: theme, fog: p.mist, ground: '#10141c', sky: skyLayer(p) };
    bg.stars = bg.sky.twinkle;
    if (cave) { bg.far = caveFar(p); bg.mid = caveMid(p, 23); bg.reeds = caveNear(p, 31); bg.rays = raysLayer(p); bg.mistA = mistLayer(p.mist, 3, .5); }
    else {
      bg.clouds = p.cloud ? cloudLayer(p, 41) : null; bg.hills = hillLayer(p, 5); bg.far = farLayer(p, 11); bg.mid = midLayer(p, theme === 'nest' ? 29 : 23); bg.reeds = reedLayer(p, 31);
      bg.mistA = mistLayer(p.mist, 3, .45); bg.mistB = mistLayer(mix(p.mist, p.mid, .3), 7, .35);
      if (theme === 'storm') { bg.storm = stormLayer(57); bg.mill = millLayer(); }
      if (theme === 'nest') bg.snag = snagLayer(p);
    }
    return bgCache[theme] = bg;
  }
  // Parallax: every layer scrolls slower the farther it is; H is the screen height.
  function drawBackground(g, camX, camY, bg, t, W, H, bolt) {
    g.drawImage(bg.sky, 0, 0);
    const dy = 44 - camY;
    const layer = (c, k, y, drift = 0) => { if (!c) return; const w = c.width; let ox = -Math.floor(((camX * k + drift) % w + w) % w); for (let x = ox; x < W; x += w) g.drawImage(c, x, Math.round(y)); if (ox > 0) g.drawImage(c, ox - w, Math.round(y)); };
    if (bg.stars) for (const s of bg.stars) { const a = Math.sin(t * s.sp + s.ph); if (a > .55) { g.globalAlpha = (a - .55) * 2.2; g.fillStyle = s.c; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); g.globalAlpha = 1; } }
    if (bg.name === 'cave') {
      bg.glowScreen = [];
      const glowAt = (c, k, y, rad) => { const w = c.width, ox = -Math.floor(((camX * k) % w + w) % w); for (const [gx, gy] of c.glows) for (let x = ox; x < W + w; x += w) { const sx = x + gx, sy = Math.round(y) + gy; if (sx > -20 && sx < W + 20 && sy > -20 && sy < H + 20) bg.glowScreen.push([sx, sy, rad]); } };
      layer(bg.far, .1, -14 + dy * .1);
      g.drawImage(bg.rays, 0, 0);
      layer(bg.mistA, .15, 100 + dy * .15, t * .08);
      layer(bg.mid, .3, -24 + dy * .2); glowAt(bg.mid, .3, -24 + dy * .2, 9);
      layer(bg.reeds, .6, 176 - bg.reeds.gy + dy * .45); glowAt(bg.reeds, .6, 176 - bg.reeds.gy + dy * .45, 16);
      return;
    }
    layer(bg.clouds, .04, 6 + dy * .02, t * .05);
    if (bolt) bolt(g);
    if (bg.storm) layer(bg.storm, .08, -6, t * .25);
    layer(bg.hills, .07, 88 + dy * .05);
    if (bg.mill) {
      const px = camX * .1; for (let k = Math.floor(px / 700); k <= Math.floor((px + W) / 700) + 1; k++) {
        const mx = Math.round(k * 700 + 180 - px), my = 62 + Math.round(dy * .06); if (mx < -60 || mx > W + 60) continue;
        g.drawImage(bg.mill, mx - 20, my); const a0 = t * .02, cx = mx, cy = my + 15; g.fillStyle = '#0e141c';
        for (let s = 0; s < 4; s++) { const a = a0 + s * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); for (let d = 2; d < 26; d++) { g.fillRect(Math.round(cx + ca * d), Math.round(cy + sa * d), 1, 1); if (d > 8) g.fillRect(Math.round(cx + ca * d - sa * 3), Math.round(cy + sa * d + ca * 3), 2, 1); } }
        g.fillRect(cx - 1, cy - 1, 3, 3);
      }
    }
    layer(bg.far, .14, 128 - bg.far.gy + dy * .1);
    layer(bg.mistA, .18, 104 + dy * .1, t * .1);
    if (bg.snag) g.drawImage(bg.snag, Math.round(250 - camX * .3 - 96), Math.round(166 - bg.snag.gy + dy * .18));
    layer(bg.mid, .36, 150 - bg.mid.gy + dy * .22);
    layer(bg.mistB, .5, 128 + dy * .25, t * .2);
    layer(bg.reeds, .62, 166 - bg.reeds.gy + dy * .42);
  }

  // ---------------------------------------------------------------- Escena del embarcadero
  // Title, level select and the end: two mossy banks, a boardwalk over still water, a lantern.
  const DOCK = ['....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................',
    '######~~~~~~~~######', '######~~~~~~~~######', '######~~~~~~~~######', '######~~~~~~~~######'];
  function drawScene(g, t, theme, W, H) {
    const A = water(theme), S = tiles(theme), T = sceneTerrain('dock', DOCK, theme), p = BG[theme] || BG.dusk, wf = (t >> 3) % 8;
    for (let x = 96; x < 224; x += 16) for (let r = 0; r < 4; r++) g.drawImage(A.back[r][(x >> 4) & 1], x, 128 + r * 16);
    // The moon (or sun) laid on the water in broken bands.
    if (p.moon && p.moon.x > 90 && p.moon.x < 230) { g.fillStyle = p.moon.light; for (let i = 0; i < 9; i++) { const y = 136 + i * 4, w = 16 - i * 1.4, off = Math.round(Math.sin((t + i * 30) / 15) * 3); if (i % 2 === 0) g.fillRect(Math.round(p.moon.x - w / 2 + off), y, Math.round(w), 1); } }
    else { g.fillStyle = A.A.glint; for (let i = 0; i < 5; i++) { const y = 138 + i * 6, off = Math.round(Math.sin((t + i * 40) / 18) * 4); g.fillRect(150 - 8 + i + off, y, 14 - i * 2, 1); } }
    for (const c of T.chunks.map((c, i) => [c, i])) g.drawImage(c[0], c[1] * CHUNK, 0);
    for (let x = 96; x < 224; x += 16) g.drawImage(x === 96 ? S.planks.left : x === 208 ? S.planks.right : S.planks.mid[(x >> 4) & 1], x, 128);
    for (const x of [98, 150, 214]) g.drawImage(S.post, x, 132);
    for (let x = 96; x < 224; x += 16) { g.drawImage(A.front[(wf + (x >> 4)) % 8], x, 128); for (let r = 1; r < 4; r++) g.drawImage(A.deepFront, x, 128 + r * 16); }
    g.drawImage(A.foam[(t >> 3) % 4], 96, 128); g.drawImage(ART.flip(A.foam[((t >> 3) + 2) % 4]), 216, 128);
    g.drawImage(ART.lantern.on, 205, 110);
    g.globalAlpha = .15 + Math.sin(t / 9) * .03; g.fillStyle = '#ffcf5a'; g.beginPath(); g.arc(210, 115, 20, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    g.drawImage(S.reed, 232, 113); g.drawImage(S.reed, 244, 115); g.drawImage(S.tuft, 60, 121); g.drawImage(S.shroom, 30, 122); g.drawImage(S.reed, 72, 114);
  }


  // ---------------------------------------------------------------- Fuego
  // The bonfire (F): banded noise flames (a white-yellow heart, yellow and orange tongues, red and dark-red
  // edges) over two crossed logs with glowing cracks; embers and sparks on the wind, a thin smoke column, heat
  // shimmer and a flickering warm light. Water makes it duck and hiss; doused, the flames collapse under a
  // billow of steam and the charred, wet logs stay, smoking now and then. All cosmetic: the rules of the tile
  // (it hurts; water puts it out at once) live in game.js. Flames are cached loops (N frames) read at an
  // uneven speed, two layers with their own phase and swayed in bands, so no two moments repeat.
  const fire = (() => {
    const N = 32, FC = ['#3a0d14', '#74190f', '#b8321a', '#e4661e', '#f99c2c', '#ffd24c', '#fff6c8'], FR = FC.map(rgb);
    const band = I => I > 1 ? 6 : I > .8 ? 5 : I > .63 ? 4 : I > .47 ? 3 : I > .33 ? 2 : I > .21 ? 1 : I > .13 ? 0 : -1;
    // Value noise that wraps every py lattice rows (the flame wall tiles vertically).
    const pn = (x, y, s, py) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
      const a = hash(xi, y0, s), b = hash(xi + 1, y0, s), c = hash(xi, y1, s), d = hash(xi + 1, y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    // Rising turbulence that loops over N frames: two scrolls cross-faded, keeping the contrast.
    const CA = [], SA = []; for (let f = 0; f < N; f++) { CA.push(Math.cos(f / N * 1.5708)); SA.push(Math.sin(f / N * 1.5708)); }
    const turb = (x, y, f, sx, sy, P, s, py) => { const k = f / N, y0 = (y + k * P) * sy, y1 = (y + (k - 1) * P) * sy;
      return .5 + ((py ? pn(x * sx, y0, s, py) : noise(x * sx, y0, s)) - .5) * CA[f] + ((py ? pn(x * sx, y1, s, py) : noise(x * sx, y1, s)) - .5) * SA[f]; };
    // A tongue of fire standing on row `base`, `len` tall, hw0 half-wide at the foot (a neck pinches it at the logs).
    const flame = (w, base, len, hw0, neck, s, heat) => (x, y, f) => {
      const u = (base - y) / len; if (u < -.25) return -1;
      const uu = clamp01(u), n1 = turb(x, y, f, .32, .13, 36, s), n2 = turb(x, y, f, .55, .3, 54, s + 7);
      const cx = w / 2 + (n2 - .5) * 2.4 * uu, hw = hw0 * Math.pow(1 - uu * .92, .62) * (neck ? Math.min(1, .7 + uu * 2.4) : 1) + .35, b = 1 - Math.abs(x + .5 - cx) / hw;
      return b * 1.05 - uu * .8 + (n1 - .5) * 1.3 * (.4 + uu) + (n2 - .5) * .35 + .22 + heat + (u < 0 ? u * 3 : 0);
    };
    const wall = (s, heat) => (x, y, f) => { const n1 = turb(x, y, f, .26, .1875, 36, s, 3), n2 = turb(x, y, f, .6, .375, 54, s + 7, 6), b = 1 - Math.abs(x + .5 - 10 + (n2 - .5) * 4) / 9.6; return b * .95 + (n1 - .5) * 1.45 + (n2 - .5) * .35 - .02 + heat; };
    // Frames are painted the first time they are shown (about a millisecond each), never all at once.
    const seq = (w, h, fn, cut = -1) => { const out = []; return f => out[f] || (out[f] = paint(w, h, b => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const l = band(fn(x, y, f)); if (l > cut) put(b, x, y, FR[l]); } })); };
    // Two crossed logs (and two stones), seen from the front; lit from the fire above, or charred and wet.
    const logs = kind => paint(24, 10, b => {
      const ch = kind === 'ash';
      const bark = ch ? ['#0e090c', '#181114', '#231a1e', '#342a2c', '#40363a'] : ['#140b0d', '#2a1510', '#43241a', '#643a24', '#8e5630'];
      const cut = ch ? ['#1e1619', '#3a2e2e', '#2a2024'] : ['#6a4026', '#d8a064', '#a8703e'];
      for (const [sx, sy, c] of [[0, 9, 0], [1, 8, 1], [2, 9, 0], [1, 9, 0], [22, 9, 0], [23, 9, 0], [21, 9, 0], [22, 8, 1], [3, 9, 0], [20, 9, 0]]) put(b, sx, sy, c ? '#7a7680' : '#45414d');
      const log = (x0, y0, x1, y1, sd, sh) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
        for (let y = 0; y < 10; y++) for (let x = 0; x < 24; x++) { const qx = x + .5 - x0, qy = y + .5 - y0, t = (qx * dx + qy * dy) / (l * l), d = qx * nx + qy * ny; if (t < 0 || t > 1 || Math.abs(d) > 1.7) continue;
          const top = ny > 0 ? d < -.6 : d > .6, bot = ny > 0 ? d > .6 : d < -.6, far = t;   // the raised end (the first) shows its cut
          let c = far * l < 1.6 ? (Math.abs(d) < .7 ? cut[1] : cut[0]) : bark[(top ? 3 : bot ? 1 : 2) + sh];
          if (far * l >= 1.6 && !top && hash(x, y, sd) < .14) c = bark[sh];   // knots and bark cracks
          if (ch && top && hash(x, y, sd + 3) < .35) c = '#6a7886';   // the wet shine
          if (ch && !top && hash(x, y, sd + 4) < .1) c = '#5a5456';   // grey ash flecks
          put(b, x, y, c); } };
      log(21.5, 3, 2.5, 8.5, 6, 0); log(2.5, 3, 21.5, 8.5, 5, 1);
      outline(b, OUT);
    });
    // Glowing cracks on the hot logs and the bed of coals between them; what still glows once doused.
    const cracks = few => paint(24, 10, b => {
      for (const [x, y, c] of [[9, 8, 3], [10, 9, 5], [11, 9, 6], [12, 9, 6], [13, 9, 5], [14, 8, 3], [8, 9, 3], [15, 9, 4], [11, 8, 4], [12, 8, 5], [10, 8, 4], [13, 8, 3]]) if (!few || c > 4) put(b, x, y, FC[c]);
      for (const [x, y, c] of [[6, 4, 4], [7, 5, 3], [17, 4, 4], [16, 5, 5], [5, 4, 2], [18, 4, 2], [8, 6, 5], [15, 6, 3], [9, 6, 3], [14, 6, 4], [4, 4, 3], [19, 4, 3]]) if (!few || c > 3) put(b, x, y, FC[c]);
    });
    // A warm pool of light: dithered bands, drawn additively.
    const glowC = paint(120, 84, b => { for (let y = 0; y < 84; y++) for (let x = 0; x < 120; x++) { const dx = (x + .5 - 60) / 60, dy = (y + .5 - 50) / 44, d = Math.sqrt(dx * dx + dy * dy); if (d >= 1) continue; const v = Math.pow(1 - d, 1.6) * 4 + dith(x, y) * .9, k = Math.min(4, Math.floor(v)); if (k > 0) put(b, x, y, [0, '#2a0e04', '#4a1c06', '#6e2e0c', '#8e4012'][k]); } });
    let A = null;
    const art = () => A || (A = { bon: seq(24, 34, flame(24, 31, 25, 7.2, true, 11, 0)), core: seq(24, 34, flame(24, 31, 18, 4.6, true, 23, 0), 3), weak: seq(24, 34, flame(24, 31, 17, 6.2, true, 11, -.3)),
      wall: seq(20, 16, wall(31, 0)), wallW: seq(20, 16, wall(31, -.32)), crown: seq(20, 18, flame(20, 16, 16, 8.2, false, 41, 0)), crownW: seq(20, 18, flame(20, 16, 11, 7.6, false, 41, -.3)),
      logs: [logs('hot'), logs('ash')], cracks: cracks(false), embers: cracks(true), glow: glowC });

    // ---- state: particles, and per-tile hits (water), pops (crackles) and the fires going out
    let T = 0, grid = null, lastHiss = -99; const P = [], st = new Map(), dying = [];
    const reset = L => { if (grid !== L.t) { grid = L.t; P.length = 0; st.clear(); dying.length = 0; } };
    const isF = (L, x, y) => y >= 0 && y < L.h && x >= 0 && x < L.w && L.t[y][x] === 'F';
    const solidAt = (L, x, y) => y >= 0 && y < L.h && x >= 0 && x < L.w && '#xXMG'.includes(L.t[y][x]);
    const wind = L => L.def.theme === 'storm' ? -.32 : Math.sin(T / 190) * .12;
    const r = (a, b) => a + Math.random() * (b - a);
    const S = (tx, ty) => { const k = tx + ',' + ty; let s = st.get(k); if (!s) st.set(k, s = { hitT: -99, hitK: 0, dir: 0, popT: -99 }); return s; };
    const recoil = s => s ? s.hitK * Math.exp(-(T - s.hitT) / 9) : 0;
    const popK = s => s ? Math.max(0, 1 - (T - s.popT) / 6) : 0;
    const fi = (s, sp) => { const v = Math.floor(T * sp + Math.sin(T * .043 + s) * 3 + Math.sin(T * .017 + s * 2.3) * 5 + s * 5); return ((v % N) + N) % N; };
    const flick = (tx, ty) => { const s = (tx * 7 + ty * 13) % 17; return 1 + Math.sin(T * .31 + s) * .04 + Math.sin(T * .13 + s * 2) * .05 + (Math.random() - .5) * .04 + popK(st.get(tx + ',' + ty)) * .15 - recoil(st.get(tx + ',' + ty)) * .25; };
    const push = p => { if (P.length < 500) P.push(p); };
    const steam = (x, y, n, big, vy = -.8) => { for (let i = 0; i < n; i++) { const m = r(big ? 44 : 18, big ? 90 : 34) | 0; push({ k: 'st', x: x + r(-4, 4), y: y + r(-3, 2), vx: r(-.55, .55), vy: vy * r(.6, 1.5), life: m, max: m, r: r(1, 2), gr: big ? r(.06, .12) : r(.05, .09) }); } };
    const WATERC = new Set(['#8fd9d0', '#c8f2ea', '#e8fbff', '#f2fffb']);
    // Water hits a burning tile (or lands by it): the flames duck away from it, and it hisses.
    function sizzle(tx, ty, x, y, k, dir, sound) {
      const s = S(tx, ty); s.hitK = Math.min(1, recoil(s) + k); s.hitT = T; s.dir = dir || (x < tx * 16 + 8 ? 1 : -1);
      steam(x, y - 2, k > .2 ? 3 : 1, false, -.6);
      for (let i = 0; i < (k > .2 ? 3 : 1); i++) push({ k: 'sp', x, y: y - 2, vx: r(-1, 1), vy: -r(.6, 1.6), life: 8, max: 8, c: '#e8fbff' });
      if (sound && T - lastHiss > 20 && typeof Sound !== 'undefined') { lastHiss = T; Sound.play('hiss', null, { x }); }
    }

    return {
      flick,
      update(L, cx, cy, W, H) {
        reset(L); T++; if (!L.ashes) L.ashes = [];
        const w = wind(L), x0 = Math.max(0, (cx >> 4) - 1), x1 = Math.min(L.w - 1, ((cx + W) >> 4) + 1), y0 = Math.max(0, (cy >> 4) - 1), y1 = Math.min(L.h - 1, ((cy + H) >> 4) + 2);
        let any = false;
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
          if (L.t[ty][tx] !== 'F') continue; any = true;
          const up = isF(L, tx, ty - 1), dn = isF(L, tx, ty + 1), X = tx * 16, Y = ty * 16, s = st.get(tx + ',' + ty), low = recoil(s) > .4;
          if (!up) {
            if (Math.random() < (low ? .08 : .2)) { const m = r(26, 64) | 0; push({ k: 'em', x: X + 8 + r(-5, 5), y: Y + (dn ? -2 : 4) + r(-4, 2), vx: r(-.3, .3), vy: -r(.5, 1.3), life: m, max: m, ph: r(0, 6) }); }
            if ((T + tx * 5) % 6 === 0 && !solidAt(L, tx, ty - 1)) { const m = r(70, 110) | 0; push({ k: 'sm', x: X + 8 + r(-1.5, 1.5), y: Y - (dn ? 12 : 6), vx: 0, vy: -r(.3, .45), life: m, max: m, r: .6, ph: r(0, 6) }); }
          } else if (Math.random() < .05) { const m = r(20, 40) | 0; push({ k: 'em', x: X + r(1, 15), y: Y + r(0, 14), vx: r(-.4, .4), vy: -r(.4, 1), life: m, max: m, ph: r(0, 6) }); }
          // A crackle: a knot pops, the fire flares and throws a fan of sparks.
          if (!dn && Math.random() < .009) { S(tx, ty).popT = T; const n = 4 + (Math.random() * 5 | 0); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + r(-1.1, 1.1), sp = r(1, 2.6), m = r(10, 22) | 0; push({ k: 'sp', x: X + 8 + r(-3, 3), y: Y + 9, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: m, max: m, c: Math.random() < .5 ? '#fff6c8' : '#ffd24c' }); } }
        }
        // Rain, spray and the jet's drops hiss where they fall into the flames.
        if (any) for (const p of L.parts) {
          if (p.life <= 0 || !(p.kind === 'rain' || p.kind === 'spray' || p.kind === 'drip' || (p.kind === 'dot' && WATERC.has(p.color)))) continue;
          const tx = Math.floor(p.x) >> 4, ty = Math.floor(p.y) >> 4; if (!isF(L, tx, ty) || (Math.floor(p.y) & 15) < 3) continue;
          p.life = 0; sizzle(tx, ty, p.x, p.y, p.kind === 'rain' ? .1 : .3, Math.sign(p.vx) || 0, p.kind !== 'rain');
        }
        // Fires going out: the big hiss, then steam keeps billowing off them for a while.
        for (let i = dying.length - 1; i >= 0; i--) {
          const d = dying[i], f = T - d.t0, X = d.x * 16, Y = d.y * 16;
          if (f === 0) {
            steam(X + 8, Y + (d.base ? 8 : 6), d.base ? 16 : 9, true, -1.1);
            for (let k = 0; k < (d.top ? 7 : 3); k++) { const m = r(24, 50) | 0; push({ k: 'em', x: X + 8 + r(-5, 5), y: Y + r(0, 12), vx: r(-1, 1), vy: -r(1, 2.2), life: m, max: m, ph: r(0, 6) }); }
            if (d.base) for (let k = 0; k < 5; k++) push({ k: 'dr', x: X + 8 + r(-6, 6), y: Y + r(0, 8), vx: r(-1.2, 1.2), vy: -r(.5, 2), fy: Y + 12 + r(0, 2), b: 0, life: 40, max: 40 });
          } else if (f > 0 && f < 18 && f % 2 === 0) steam(X + 8, Y + (d.base ? 10 : 8), 1, true, -1.1);
          if (f > 24) dying.splice(i, 1);
        }
        // Charred logs: a thin wisp for a good while, then a puff now and then; the last embers pop.
        for (const a of L.ashes) {
          const X = a.x * 16, Y = a.y * 16, age = T - a.t0; if (X < cx - 32 || X > cx + W + 16 || Y < cy - 16 || Y > cy + H + 32) continue;
          if (age < 420 ? (T + a.x) % (age < 200 ? 4 : 8) === 0 : Math.random() < .012) { const m = r(60, 100) | 0; push({ k: 'sm', x: X + 8 + r(-2, 2), y: Y + 11, vx: 0, vy: -r(.25, .4), life: m, max: m, r: .5, ph: r(0, 6), pale: 1 }); }
          if (age < 150 && Math.random() < .03) { const m = r(16, 30) | 0; push({ k: 'em', x: X + 8 + r(-5, 5), y: Y + 11, vx: r(-.2, .2), vy: -r(.3, .8), life: m, max: m, ph: r(0, 6) }); }
        }
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i]; if (--p.life <= 0) { P.splice(i, 1); continue; }
          if (p.k === 'em') { p.vx += (w - p.vx) * .04 + Math.sin(T * .13 + p.ph) * .045; p.vy = Math.max(-1.5, p.vy - .004); }
          else if (p.k === 'sp') { p.vy += .06; p.vx *= .96; }
          else if (p.k === 'sm') { p.vx += (w * .9 - p.vx) * .03 + Math.sin(T * .05 + p.ph) * .012; p.r += .028; }
          else if (p.k === 'st') { p.vx = p.vx * .96 + w * .02; p.vy = p.vy * .965 - .012; p.r += p.gr; }
          else if (p.k === 'dr') { p.vy += .16; if (p.y + p.vy > p.fy) { p.y = p.fy; p.vy *= -.3; p.vx *= .5; if (!p.b++) { steam(p.x, p.y, 1, false, -.5); p.life = Math.min(p.life, 8); } } }
          p.x += p.vx; p.y += p.vy;
        }
      },
      // Water landed at (x, y): anything burning (or still hot) within reach ducks and hisses.
      splash(L, x, y, dir) {
        reset(L); const tx0 = (x - 14) >> 4, tx1 = (x + 14) >> 4, ty0 = (y - 14) >> 4, ty1 = (y + 14) >> 4; let hit = false;
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (isF(L, tx, ty)) { const d = Math.hypot(tx * 16 + 8 - x, ty * 16 + 8 - y); if (d < 24) { sizzle(tx, ty, x, y, .7 * (1 - d / 30), dir, !hit); hit = true; } }
        if (!hit && L.ashes) for (const a of L.ashes) if (T - a.t0 < 200 && Math.abs(a.x * 16 + 8 - x) < 14 && Math.abs(a.y * 16 + 10 - y) < 12) { steam(x, y - 2, 3, false, -.7); if (T - lastHiss > 20 && typeof Sound !== 'undefined') { lastHiss = T; Sound.play('hiss', null, { x }); } break; }
      },
      // The tiles of one fire just went out (the rules already cleared them): hit = where the water struck.
      doused(L, list, hit) {
        reset(L); if (!L.ashes) L.ashes = []; lastHiss = T;
        const has = (x, y) => list.some(q => q[0] === x && q[1] === y), hx = hit ? hit.x : list[0][0] * 16 + 8, hy = hit ? hit.y : list[0][1] * 16 + 8;
        for (const [x, y] of list) {
          const d = Math.hypot(x * 16 + 8 - hx, y * 16 + 8 - hy) / 16, base = !has(x, y + 1), top = !has(x, y - 1) && !solidAt(L, x, y - 1), s = st.get(x + ',' + y);
          dying.push({ x, y, t0: T + Math.round(d * 2), base, top, up: has(x, y - 1), dir: hit && hit.vx ? Math.sign(hit.vx) : 0, s: (x * 7 + y * 13) % 17, k0: recoil(s) });
          if (base) L.ashes.push({ x, y, t0: T + Math.round(d * 2) });
        }
      },
      // Live fire, drawn with the back tiles.
      tile(g, L, tx, ty, px, py) {
        const a = art(), up = isF(L, tx, ty - 1), dn = isF(L, tx, ty + 1), s = (tx * 7 + ty * 13) % 17, ss = st.get(tx + ',' + ty);
        drawFire(g, a, px, py, s, !dn, up, !up && !solidAt(L, tx, ty - 1), recoil(ss), popK(ss), wind(L) * 4 + (ss ? ss.dir * 5 * recoil(ss) : 0), -1, tx);
      },
      // Fires going out and the charred logs, drawn with the back tiles after the live ones.
      back(g, L, camX, camY, W, H) {
        if (!dying.length && !(L.ashes && L.ashes.length)) return; reset(L); const a = art();
        for (const d of dying) { const px = d.x * 16 - camX, py = d.y * 16 - camY; if (px < -24 || px > W + 8 || py < -32 || py > H + 16) continue; const f = T - d.t0;
          drawFire(g, a, px, py, d.s, d.base, d.up, d.top, f < 0 ? Math.max(d.k0, .8) : 1, 0, d.dir * 4, f, d.x); }
        if (L.ashes) for (const q of L.ashes) {
          if (L.t[q.y][q.x] === 'F') continue; const px = q.x * 16 - camX, py = q.y * 16 - camY, age = T - q.t0; if (px < -24 || px > W + 8 || py < -16 || py > H + 16) continue;
          const fl = q.x & 1 ? ART.flip : c => c;
          if (age < 36) { g.drawImage(fl(a.logs[0]), px - 4, py + 6); g.globalAlpha = clamp01(age / 36); }
          g.drawImage(fl(a.logs[1]), px - 4, py + 6); g.globalAlpha = 1;
          if (age < 36) { g.globalAlpha = 1 - clamp01(age / 20); g.drawImage(fl(a.cracks), px - 4, py + 6); }
          const e = age < 0 ? 1 : clamp01(1 - age / 300); if (e > 0) { g.globalAlpha = e * (.55 + Math.sin(T * .09 + q.x) * .35 + Math.sin(T * .23) * .1); g.drawImage(fl(a.embers), px - 4, py + 6); }
          g.globalAlpha = 1;
        }
      },
      // Sparks, embers, smoke, steam, and the heat shimmer over each blaze (only when not zoomed).
      front(g, L, camX, camY, W, H, flat) {
        reset(L);
        if (flat && g.canvas && g.canvas.width === W) {
          const x0 = Math.max(0, camX >> 4), x1 = Math.min(L.w - 1, (camX + W) >> 4), y0 = Math.max(0, camY >> 4), y1 = Math.min(L.h - 1, ((camY + H) >> 4) + 1);
          for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
            if (L.t[ty][tx] !== 'F' || isF(L, tx, ty - 1) || solidAt(L, tx, ty - 1)) continue;
            const bx = tx * 16 - camX - 4, top = ty * 16 - camY - (isF(L, tx, ty + 1) ? 30 : 30);
            for (let j = 0; j < 22; j++) { const y = top + j; if (y < 0 || y >= H || bx < 0 || bx + 24 > W) continue; const o = Math.round(Math.sin(T * .31 + j * .75 + tx) * (j / 22) * 1.2); if (o) g.drawImage(g.canvas, bx, y, 24, 1, bx + o, y, 24, 1); }
          }
        }
        for (const p of P) {
          const x = Math.round(p.x - camX), y = Math.round(p.y - camY), k = p.life / p.max; if (x < -12 || x > W + 12 || y < -12 || y > H + 12) continue;
          if (p.k === 'em') { const c = k > .78 ? FC[6] : k > .55 ? FC[5] : k > .35 ? FC[4] : k > .18 ? FC[3] : FC[2]; if (k < .12 && (T & 2)) continue; g.fillStyle = c; if (k > .55) { g.globalAlpha = .3; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.globalAlpha = 1; } g.fillRect(x, y, 1, 1); }
          else if (p.k === 'sp') { g.fillStyle = p.c || FC[6]; g.fillRect(x, y, 1, 1); g.globalAlpha = .6; g.fillStyle = FC[4]; g.fillRect(Math.round(x - p.vx), Math.round(y - p.vy), 1, 1); g.globalAlpha = 1; }
          else if (p.k === 'sm') { g.globalAlpha = (p.pale ? .45 : .3) * k * Math.min(1, (1 - k) * 8); g.fillStyle = p.pale ? '#a0a4ac' : '#6a626c'; disc(g, x, y, p.r); g.globalAlpha = 1; }
          else if (p.k === 'st') { const a = .7 * Math.pow(k, .8) * Math.min(1, (1 - k) * 12); g.globalAlpha = a; g.fillStyle = '#b4c0c8'; disc(g, x, y, p.r); g.fillStyle = '#f0f6f8'; disc(g, x - Math.round(p.r * .3), y - Math.round(p.r * .35), p.r * .62); g.globalAlpha = 1; }
          else if (p.k === 'dr') { g.fillStyle = '#8fd9d0'; g.fillRect(x, y, 1, 1); g.fillStyle = '#e8fbff'; g.fillRect(x, y - 1, 1, 1); }
        }
      },
      // The warm light: an additive pool round every blaze (and what is left glowing).
      glow(g, L, camX, camY, W, H) {
        const a = art(), x0 = Math.max(0, (camX >> 4) - 3), x1 = Math.min(L.w - 1, ((camX + W) >> 4) + 3), y0 = Math.max(0, (camY >> 4) - 2), y1 = Math.min(L.h - 1, ((camY + H) >> 4) + 3);
        const k = L.def.theme === 'cave' || L.def.theme === 'night' ? .5 : .38; let on = false;
        const pool = (x, y, v) => { if (v <= .01) return; if (!on) { g.globalCompositeOperation = 'lighter'; on = true; } g.globalAlpha = Math.min(1, v); g.drawImage(a.glow, Math.round(x - camX - 60), Math.round(y - camY - 50)); };
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (L.t[ty][tx] === 'F') { const n = isF(L, tx, ty - 1) + isF(L, tx, ty + 1); pool(tx * 16 + 8, ty * 16 + 6, k * flick(tx, ty) * (n ? .6 : 1)); }
        for (const d of dying) { const f = T - d.t0; pool(d.x * 16 + 8, d.y * 16 + 8, k * (f < 0 ? .8 : clamp01(1 - f / 18))); }
        if (L.ashes) for (const q of L.ashes) { const age = T - q.t0; if (age >= 0 && age < 300 && L.t[q.y][q.x] !== 'F') pool(q.x * 16 + 8, q.y * 16 + 14, k * .22 * (1 - age / 300) * (.7 + Math.sin(T * .09 + q.x) * .3)); }
        if (on) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
      },
      // How much a hot ember bed still lights the dark (0..1), for the light mask.
      ember(q) { return clamp01(1 - (T - q.t0) / 300); }
    };
    // A crisp pixel disc.
    function disc(g, x, y, r) { r = Math.max(.5, r); const n = Math.ceil(r - .5); for (let j = -n; j <= n; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); if (w > 0 || j === 0) g.fillRect(x - Math.max(w, 1) + 1, y + j, Math.max(w, 1) * 2 - 1, 1); } }
    // One blaze: the flames (bonfire, flame wall, crown above the wall) and the logs under a bonfire.
    // f >= 0: going out, f frames since the water; the flames flash white, then collapse into the logs.
    function drawFire(g, a, px, py, s, base, up, crownOk, rec, pop, lean, f, tx) {
      const out = f >= 0, k = out ? clamp01((f - 1) / 17) : 0, weak = out ? f > 2 : rec > .35;
      if (out && k >= 1) return;
      const fs = 1 + Math.sin(T * .13 + s) * .06 + Math.sin(T * .29 + s * 3) * .04 + pop * .14 - rec * .45, sx = 1 - rec * .12 + Math.sin(T * .2 + s) * .03 - k * .35, sy = out ? (f < 2 ? .95 : Math.pow(1 - k, 1.3)) : fs;
      const white = out && f < 3 ? c => ART.tint(c, f < 1 ? '#ffffff' : f < 2 ? '#e8f4f8' : '#fff6c8') : c => c, sway = out ? .6 : 1.2;
      if (base && !up) {
        strips(g, white((weak ? a.weak : a.bon)(fi(s, .5))), px + 8, py + 16, sx, sy, lean, sway, s);
        if (!weak) strips(g, a.core(fi(s + 5, .62)), px + 8, py + 16, sx, fs * (1 - rec * .4), lean * .6, sway * .7, s + 2);
      } else {
        strips(g, white((weak ? a.wallW : a.wall)(fi(s, .5))), px + 8, py + 16, sx, out ? sy : 1, lean * .25, .5, s);
        if (crownOk && !up) strips(g, white((weak ? a.crownW : a.crown)(fi(s + 3, .55))), px + 8, py + 6, sx, out ? sy : fs, lean, sway, s + 1);
      }
      if (base && !out) { const fl = tx & 1 ? ART.flip : c => c; g.drawImage(fl(a.logs[0]), px - 4, py + 6); g.globalAlpha = .7 + Math.sin(T * .21 + s) * .15 + pop * .3; g.drawImage(fl(a.cracks), px - 4, py + 6); g.globalAlpha = 1; }
    }
    // A flame canvas with its foot at (cx, foot), squashed by sx/sy; each band of rows swayed and leaned more the higher it is.
    function strips(g, c, cx, foot, sx, sy, lean, sway, ph) {
      const w = c.width, h = c.height, dw = Math.max(1, Math.round(w * sx)); if (sy <= .02) return;
      for (let j = 0; j < h; j += 3) { const n = Math.min(3, h - j), u = (h - j) / h, y0 = Math.round(foot - (h - j) * sy), y1 = Math.round(foot - (h - j - n) * sy); if (y1 <= y0) continue;
        const off = Math.round(lean * u * u + Math.sin(ph + T * .11 - j * .45) * sway * u); g.drawImage(c, 0, j, w, n, Math.round(cx - dw / 2) + off, y0, dw, y1 - y0); }
    }
  })();
  return { rgb, mix, css, ramp, pick, dith, hash, noise, Buf, put, rect, paint, toCanvas, outline, newCanvas, alphaAt,
    TERRA, AGUA, BG, STONE, ROOT, WOOD, OUT, buildTerrain, levelTerrain, drawTerrain, sceneTerrain, water, tiles, drawTiles, props, background, drawBackground, drawScene, fire };
})();
// The world pieces replace the simple ones in ART; characters are left alone.
Object.assign(ART, MUNDO.props, { background: MUNDO.background });
