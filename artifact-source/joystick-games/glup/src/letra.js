// GLUP — la letra Glup. Una fuente de píxel propia para las conversaciones: mayúsculas y
// minúsculas de verdad (con ascendentes y descendentes), acentos, eñe, ü, ¡ y ¿; se dibuja con
// borde oscuro, sombra y un tono más claro arriba, y cada letra aparece con un pequeño rebote.
// Y la letra GLUP (Glup, ART.glup): las mayúsculas del logotipo, gordas, blandas y goteando, para
// las palabras grandes de celebración; cada letra se puede aplastar, mover y hacer gotear por separado.
'use strict';
const Letra = (() => {
  // 9 rows: 0-6 up to the baseline (capitals are 7 tall, lowercase x-height rows 2-6), 7-8 descenders.
  // Each glyph: rows separated by '|', starting at `top` (default 0). '#' is ink.
  const G = {
    A: '.##.|#..#|#..#|####|#..#|#..#|#..#', B: '###.|#..#|#..#|###.|#..#|#..#|###.', C: '.###|#...|#...|#...|#...|#...|.###',
    D: '###.|#..#|#..#|#..#|#..#|#..#|###.', E: '####|#...|#...|###.|#...|#...|####', F: '####|#...|#...|###.|#...|#...|#...',
    G: '.###|#...|#...|#.##|#..#|#..#|.###', H: '#..#|#..#|#..#|####|#..#|#..#|#..#', I: '###|.#.|.#.|.#.|.#.|.#.|###',
    J: '..##|...#|...#|...#|#..#|#..#|.##.', K: '#..#|#.#.|##..|#...|##..|#.#.|#..#', L: '#...|#...|#...|#...|#...|#...|####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#..#|##.#|##.#|#.##|#.##|#..#|#..#', O: '.##.|#..#|#..#|#..#|#..#|#..#|.##.',
    P: '###.|#..#|#..#|###.|#...|#...|#...', Q: '.##.|#..#|#..#|#..#|#.##|#..#|.###|...#', R: '###.|#..#|#..#|###.|#.#.|#..#|#..#',
    S: '.###|#...|#...|.##.|...#|...#|###.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#..#|#..#|#..#|#..#|#..#|#..#|.##.',
    V: '#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '####|...#|..#.|.#..|#...|#...|####',
    a: '2:.##.|...#|.###|#..#|.###', b: '#...|#...|###.|#..#|#..#|#..#|###.', c: '2:.##|#..|#..|#..|.##', d: '...#|...#|.###|#..#|#..#|#..#|.###',
    e: '2:.##.|#..#|####|#...|.##.', f: '..#|.#.|###|.#.|.#.|.#.|.#.', g: '2:.###|#..#|#..#|#..#|.###|...#|.##.', h: '#...|#...|###.|#..#|#..#|#..#|#..#',
    i: '#|.|#|#|#|#|#', j: '.#|..|.#|.#|.#|.#|.#|.#|#.', k: '#...|#...|#..#|#.#.|##..|#.#.|#..#', l: '#.|#.|#.|#.|#.|#.|.#',
    m: '2:####.|#.#.#|#.#.#|#.#.#|#.#.#', n: '2:###.|#..#|#..#|#..#|#..#', o: '2:.##.|#..#|#..#|#..#|.##.', p: '2:###.|#..#|#..#|#..#|###.|#...|#...',
    q: '2:.###|#..#|#..#|#..#|.###|...#|...#', r: '2:#.##|##..|#...|#...|#...', s: '2:.###|#...|.##.|...#|###.', t: '.#.|.#.|###|.#.|.#.|.#.|..#',
    u: '2:#..#|#..#|#..#|#..#|.###', v: '2:#...#|#...#|.#.#.|.#.#.|..#..', w: '2:#...#|#.#.#|#.#.#|#.#.#|.#.#.', x: '2:#..#|#..#|.##.|#..#|#..#',
    y: '2:#..#|#..#|#..#|#..#|.###|...#|.##.', z: '2:####|..#.|.#..|#...|####',
    0: '.##.|#..#|#.##|##.#|#..#|#..#|.##.', 1: '.#.|##.|.#.|.#.|.#.|.#.|###', 2: '.##.|#..#|...#|..#.|.#..|#...|####', 3: '###.|...#|...#|.##.|...#|...#|###.',
    4: '#..#|#..#|#..#|####|...#|...#|...#', 5: '####|#...|###.|...#|...#|#..#|.##.', 6: '.##.|#...|#...|###.|#..#|#..#|.##.', 7: '####|...#|..#.|..#.|.#..|.#..|.#..',
    8: '.##.|#..#|#..#|.##.|#..#|#..#|.##.', 9: '.##.|#..#|#..#|.###|...#|...#|.##.',
    '.': '6:#', ',': '6:#|#', ':': '2:#|.|.|.|#', ';': '2:#|.|.|.|#|#', '!': '#|#|#|#|#|.|#', '¡': '#|.|#|#|#|#|#',
    '?': '.##.|#..#|...#|..#.|.#..|....|.#..', '¿': '..#.|....|..#.|.#..|#...|#..#|.##.', '-': '3:###', '+': '2:.#.|###|.#.', '·': '3:#',
    '"': '#.#|#.#', "'": '#|#', '(': '.#|#.|#.|#.|#.|#.|.#', ')': '#.|.#|.#|.#|.#|.#|#.', '/': '...#|..#.|..#.|.#..|.#..|#...|#...',
    '«': '2:.#.#|#.#.|.#.#', '»': '2:#.#.|.#.#|#.#.', '…': '6:#.#.#', '↑': '.#.|###|#.#|.#.|.#.|.#.|.#.', '↓': '.#.|.#.|.#.|.#.|#.#|###|.#.',
    '←': '2:.#...|#####|.#...', '♥': '1:.#.#.|#####|#####|.###.|..#..', '★': '1:..#..|.###.|#####|.###.|#.#.#', '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##', '~': '2:.#..#|#.#.#|#..#.', '=': '2:####|....|####', '[': '##|#.|#.|#.|#.|#.|##', ']': '##|.#|.#|.#|.#|.#|##', '×': '1:#...#|.#.#.|..#..|.#.#.|#...#', '♪': '.##|.#.#|.#|.#|##|##', '→': '2:...#.|#####|...#.', '▲': '3:.#.|###', '▼': '3:###|.#.' };
  const ACC = { á: ['a', 'acute'], é: ['e', 'acute'], í: ['ı', 'acute'], ó: ['o', 'acute'], ú: ['u', 'acute'], ü: ['u', 'diaer'], ñ: ['n', 'tilde'],
    Á: ['A', 'acute'], É: ['E', 'acute'], Í: ['I', 'acute'], Ó: ['O', 'acute'], Ú: ['U', 'acute'], Ü: ['U', 'diaer'], Ñ: ['N', 'tilde'] };
  G['ı'] = '2:#|#|#|#|#';
  const cache = new Map();
  // A glyph as a list of lit pixels, its width and its accent marks.
  function glyph(ch) {
    if (cache.has(ch)) return cache.get(ch);
    let src = G[ch], mark = null, base = ch;
    if (!src && ACC[ch]) { base = ACC[ch][0]; mark = ACC[ch][1]; src = G[base]; }
    if (!src && G[ch.toUpperCase()]) src = G[ch.toUpperCase()];
    let r = null;
    if (src) {
      let top = 0, body = src; const m = /^(\d):(.*)$/.exec(src); if (m) { top = +m[1]; body = m[2]; }
      const rows = body.split('|'), w = Math.max(...rows.map(s => s.length)), px = [];
      rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') px.push([x, y + top]); }));
      if (mark) {
        const upper = base === base.toUpperCase() && base !== 'ı', y0 = upper ? -3 : 0, cx = Math.floor((w - 1) / 2);
        if (mark === 'acute') px.push([cx + 1, y0], [cx, y0 + 1]);
        else if (mark === 'diaer') px.push([0, y0 + 1], [w - 1, y0 + 1]);
        else if (mark === 'tilde') { px.push([0, y0 + 1], [1, y0], [2, y0 + 1], [3, y0]); }
      }
      r = { w, px };
    }
    cache.set(ch, r); return r;
  }
  const SPACE = 3, GAP = 1, LINE = 12;
  function width(str) { let w = 0; for (const ch of str) { if (ch === ' ') { w += SPACE; continue; } const gl = glyph(ch); w += (gl ? gl.w : 3) + GAP; } return Math.max(0, w - GAP); }
  function wrap(str, max) {
    const out = []; let line = '';
    for (const word of str.split(' ')) { const t = line ? line + ' ' + word : word; if (width(t) > max && line) { out.push(line); line = word; } else line = t; }
    if (line) out.push(line); return out;
  }
  // Draw a string. o: { color, light (top rows), shadow, outline, shown (typed chars), bounce (frame counter for the pop), wave }.
  function text(g, str, x, y, o = {}) {
    const col = o.color || '#2a1e2e', light = o.light || null, out = o.outline === undefined ? null : o.outline, sh = o.shadow || null;
    let cx = x; const shown = o.shown === undefined ? Infinity : o.shown, t = o.t || 0; let i = 0;
    for (const ch of str) {
      if (i >= shown) break;
      if (ch === ' ') { cx += SPACE; i++; continue; }
      const gl = glyph(ch); if (!gl) { cx += 3 + GAP; i++; continue; }
      // The newest letters pop up from below and settle.
      const age = shown === Infinity ? 99 : shown - i, pop = age < 4 ? Math.round((4 - age) * .75) : 0;
      const wy = o.wave ? Math.round(Math.sin(t / 6 + i * .7) * 1) : 0, oy = y + wy + pop;
      const P = (dx, dy, c) => { g.fillStyle = c; for (const [px, py] of gl.px) g.fillRect(cx + px + dx, oy + py + dy, 1, 1); };
      if (sh) P(0, 1, sh);
      if (out) { P(-1, 0, out); P(1, 0, out); P(0, -1, out); P(0, 1, out); }
      g.fillStyle = col; for (const [px, py] of gl.px) { g.fillStyle = light && py <= 1 ? light : col; g.fillRect(cx + px, oy + py, 1, 1); }
      cx += gl.w + GAP; i++;
    }
    return cx - x;
  }
  // Letra Gorda: the display letters for shouts, titles and announcements. Capitals only, each stroke
  // doubled sideways, a dark rim, a drop shadow and a lighter top.
  function boldWidth(str) { let w = 0; for (const ch of String(str).toUpperCase()) { if (ch === ' ') { w += 4; continue; } const gl = glyph(ch); w += (gl ? gl.w + 1 : 4) + 1; } return Math.max(0, w - 1); }
  function bold(g, str, x, y, o = {}) {
    str = String(str).toUpperCase(); const col = o.color || '#fff6d6', light = o.light || '#ffffff', out = o.outline || '#1b1420', sh = o.shadow || '#0a0610';
    const w = boldWidth(str); if (o.align === 'center') x -= w >> 1; else if (o.align === 'right') x -= w; x = Math.round(x); y = Math.round(y);
    const pass = (dx, dy, c, top) => { let cx = x; for (const ch of str) { if (ch === ' ') { cx += 4; continue; } const gl = glyph(ch); if (!gl) { cx += 5; continue; } for (const [px, py] of gl.px) { g.fillStyle = top ? (py <= 2 ? light : col) : c; g.fillRect(cx + px + dx, y + py + dy, 2, 1); } cx += gl.w + 2; } };
    pass(0, 2, sh); pass(-1, 0, out); pass(1, 0, out); pass(0, -1, out); pass(0, 1, out); pass(0, 0, null, true);
    return w;
  }
  return { text, width, wrap, glyph, LINE, bold, boldWidth };
})();

// The old 5×7 capitals are retired: every ART.text now draws in the Glup letters (same arguments), and
// ART.glyph builds its bitmaps from them too (the big tally letters use it).
(() => {
  const old = ART.text;
  ART.text = (g, str, x, y, color = '#ffffff', align = 'left', shadow = null) => {
    str = String(str); const w = Letra.width(str); if (align === 'center') x -= w >> 1; else if (align === 'right') x -= w;
    Letra.text(g, str, Math.round(x), Math.round(y), { color, shadow: shadow || null });
    return w;
  };
  ART.textWidth = str => Letra.width(String(str));
  ART.wrap = (str, maxW) => Letra.wrap(String(str), maxW);
  const gc = new Map();
  ART.glyph = (ch, color) => {
    const k = ch + color; if (gc.has(k)) return gc.get(k);
    const gl = Letra.glyph(ch) || Letra.glyph(String(ch).toUpperCase()); if (!gl) { gc.set(k, null); return null; }
    const ys = gl.px.map(p => p[1]), y0 = Math.min(0, ...ys), h = Math.max(7, ...ys.map(y => y + 1)) - y0;
    const c = ART.canvas(gl.w, h), cg = c.getContext('2d'); cg.fillStyle = color; for (const [px, py] of gl.px) cg.fillRect(px, py - y0, 1, 1);
    c.w = gl.w; c.h = h; gc.set(k, c); return c;
  };
  ART.title = (g, str, x, y, color, align = 'left') => Letra.bold(g, str, x, y, { color, align });
  ART.oldText = old;
})();

// ---------------------------------------------------------------- Letra GLUP
// The logo's goo for any word. Every pixel of a Glup capital becomes a node of a stroke painted with a round brush
// that swells towards the bottom, so the letters come out fat, soft and sagging; then they are shaded like the logo
// (cream rim on top, moss gradient, dark rim, extrusion, a bead of gloss at each top-left corner) and cached.
// The drips hang live, and each letter is drawn with its own transform, so every one can squash, wobble and drip.
const Glup = (() => {
  const SIZES = { small: { S: 2, r: 1.25, ext: 1, ring: 2, gap: 1 }, mid: { S: 3, r: 2, ext: 2, ring: 2, gap: 2 }, big: { S: 4, r: 2.65, ext: 3, ring: 2, gap: 2 }, huge: { S: 6, r: 3.3, ext: 4, ring: 5, gap: 3 } };
  const PAL = {
    musgo: { fill: ['#fff3b8', '#f2e08a', '#dccd68', '#bdb452', '#9ca044', '#7c883a', '#5f6e30'], rim: '#fffbe6', lite: '#f6ea9c', dark: '#4f5c28', spot: '#6a7430', ext: ['#48522a', '#2f3820'], drip: ['#9ca044', '#5f6e30', '#fff3b8'] },
    oro: { fill: ['#fff6c8', '#ffe68a', '#ffd052', '#f4b43c', '#e0922c', '#c47424', '#9a561c'], rim: '#fffdf0', lite: '#fff0b0', dark: '#7a4418', spot: '#b86a24', ext: ['#6a3a16', '#42240e'], drip: ['#e0922c', '#9a561c', '#ffe68a'] },
    agua: { fill: ['#f4fffd', '#d2f6ee', '#a8e8dc', '#7fd2c4', '#5cb6ab', '#43958f', '#327472'], rim: '#ffffff', lite: '#e0fbf6', dark: '#24545a', spot: '#3f8a88', ext: ['#1f4a50', '#143238'], drip: ['#5cb6ab', '#327472', '#d2f6ee'] },
    fresa: { fill: ['#fff0ee', '#ffd0cc', '#ffa8a4', '#f58088', '#e0606e', '#bc4658', '#8e3446'], rim: '#ffffff', lite: '#ffe0dc', dark: '#6a2238', spot: '#b04458', ext: ['#5a1c30', '#3a1020'], drip: ['#e0606e', '#8e3446', '#ffd0cc'] },
    lila: { fill: ['#f8f0ff', '#e4d4ff', '#c8b4f4', '#a894e0', '#8a78c8', '#6c5ca8', '#4e4284'], rim: '#ffffff', lite: '#eee4ff', dark: '#3a2e66', spot: '#6a5aa0', ext: ['#30264e', '#1e1834'], drip: ['#8a78c8', '#4e4284', '#e4d4ff'] },
    cobre: { fill: ['#ffe8d0', '#f8c8a0', '#e8a878', '#d08858', '#b06a40', '#8e5230', '#6e3e24'], rim: '#fff4e8', lite: '#ffdcc0', dark: '#4e2a18', spot: '#9a5a34', ext: ['#4a2816', '#2e180c'], drip: ['#b06a40', '#6e3e24', '#f8c8a0'] },
    gris: { fill: ['#eef2f6', '#d4dce4', '#b8c4d0', '#9caab8', '#8290a0', '#6a7888', '#566272'], rim: '#ffffff', lite: '#e4eaf0', dark: '#3a4452', spot: '#7a8898', ext: ['#303846', '#1e2430'], drip: ['#8290a0', '#566272', '#d4dce4'] } };
  const OUT = '#1a1420', HX = new Map();
  const rgb = h => { let v = HX.get(h); if (!v) HX.set(h, v = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]); return v; };
  const cache = new Map();
  function glyph(ch, size = 'big', pal = 'musgo') {
    const key = ch + '|' + size + '|' + pal; if (cache.has(key)) return cache.get(key);
    const Z = SIZES[size] || SIZES.big, P = PAL[pal] || PAL.musgo, S = Z.S, src = Letra.glyph(ch === '0' ? 'O' : ch);   // a plain round zero: the slash turns to mush
    if (!src || !src.px.length) { cache.set(key, null); return null; }
    // The I loses its serifs: a plain fat stick reads better in goo.
    let pts = src.px; if ((ch === 'I' || ch === 'Í') && src.w === 3) pts = pts.filter(([x, y]) => y < 0 || x === 1).map(([x, y]) => [x - 1, y]);
    const on = new Set(pts.map(([x, y]) => x + ',' + y)), lit = (x, y) => on.has(x + ',' + y);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), gx0 = Math.min(...xs), gx1 = Math.max(...xs), gy0 = Math.min(0, ...ys), gy1 = Math.max(6, ...ys);
    const rAt = y => Z.r * (.88 + .3 * Math.max(0, Math.min(1, y / 6)));   // the goo sags: fatter at the bottom
    const pad = Math.ceil(Z.r * 1.2) + 2, w = (gx1 - gx0) * S + pad * 2 + 1, h = (gy1 - gy0) * S + pad * 2 + 1 + Z.ext, ox = pad - gx0 * S, oy = pad - gy0 * S;
    const mask = new Uint8Array(w * h);
    const dot = (cx, cy, r) => { const R = Math.ceil(r), bx = Math.round(cx), by = Math.round(cy); for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { if (dx * dx + dy * dy > r * r + .3) continue; const x = bx + dx, y = by + dy; if (x >= 0 && y >= 0 && x < w && y < h) mask[y * w + x] = 1; } };
    const stroke = (x0, y0, x1, y1) => { const n = S * 2; for (let i = 0; i <= n; i++) { const k = i / n, y = y0 + (y1 - y0) * k; dot(ox + (x0 + (x1 - x0) * k) * S, oy + y * S, rAt(y)); } };
    // Neighbours join with a stroke; a diagonal only where no square neighbour already turns the corner.
    for (const [x, y] of pts) {
      dot(ox + x * S, oy + y * S, rAt(y));
      if (lit(x + 1, y)) stroke(x, y, x + 1, y); if (lit(x, y + 1)) stroke(x, y, x, y + 1);
      for (const dx of [1, -1]) if (lit(x + dx, y + 1) && !lit(x + dx, y) && !lit(x, y + 1)) stroke(x, y, x + dx, y + 1);
    }
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
    const extK = (x, y) => { if (at(x, y)) return 0; for (let k = 1; k <= Z.ext; k++) if (at(x, y - k)) return k; return 0; };
    const solid = (x, y) => at(x, y) || extK(x, y) > 0;
    const nearSolid = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= Z.ring && solid(x + dx, y + dy)) return true; return false; };
    const inner = (x, y) => { for (let d = 1; d <= 3; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) if (!at(x + dx, y + dy)) return d - 1; return 3; };
    const top = oy - Math.round(rAt(0)), bot = oy + 6 * S + Math.round(rAt(6)), F = P.fill;
    let seed = 7; for (const c of ch + size) seed = (seed * 31 + c.charCodeAt(0)) >>> 0; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const spots = new Set(); if (S >= 4) for (let i = 0; i < 8; i++) { const x = (rnd() * w) | 0, y = (rnd() * h) | 0; if (at(x, y) && inner(x, y) >= 2) { spots.add(y * w + x); if (rnd() < .5) spots.add(y * w + x + 1); } }
    const c = ART.canvas(w, h), cg = c.getContext('2d'), img = cg.createImageData(w, h), d = img.data;
    const face = ART.canvas(w, h), fg = face.getContext('2d'), fimg = fg.createImageData(w, h), fd = fimg.data;
    const put = (x, y, col, dd = d) => { const v = rgb(col), i = (y * w + x) * 4; dd[i] = v[0]; dd[i + 1] = v[1]; dd[i + 2] = v[2]; dd[i + 3] = 255; };
    let inkL = w, inkR = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y)) {
        inkL = Math.min(inkL, x); inkR = Math.max(inkR, x);
        const f = Math.max(0, Math.min(1, (y - top) / Math.max(1, bot - top))) * (F.length - 1), i = Math.min(F.length - 2, f | 0), fr = f - i;
        let col = fr > .66 || (fr > .33 && ((x + y) & 1)) ? F[i + 1] : F[i];
        if (spots.has(y * w + x)) col = P.spot;
        if (!at(x, y - 1)) col = P.rim; else if (!at(x, y - 2) && y - top < S * 3) col = F[0];
        else if (!at(x - 1, y)) col = y - top < (bot - top) * .6 ? P.lite : F[3];
        else if (!at(x + 1, y) || !at(x, y + 1)) col = P.dark;
        // Gloss: a white bead tucked into the top-left curve of every blob of goo.
        if (S >= 3 && at(x - 1, y) && at(x, y - 1) && !at(x - 2, y) && !at(x, y - 2) && !at(x - 1, y - 2) && y - top < (bot - top) * .7) col = '#ffffff';
        put(x, y, col); put(x, y, '#fffbe6', fd);
      } else {
        const k = extK(x, y);
        if (k) put(x, y, k <= Math.ceil(Z.ext / 2) ? P.ext[0] : P.ext[1]);
        else if (nearSolid(x, y)) put(x, y, OUT);
      }
    }
    cg.putImageData(img, 0, 0); fg.putImageData(fimg, 0, 0);
    // Where drips can hang: under the bottom of a stroke with nothing below it.
    const drips = [];
    for (const [x, y] of pts) {
      if (y < 2 || lit(x, y + 1) || lit(x - 1, y + 1) || lit(x + 1, y + 1)) continue;
      const px = ox + x * S; let py = oy + y * S; while (py < h - 1 && solid(px, py + 1)) py++;
      if (drips.some(a => Math.abs(a.x - px) < S + 1 && Math.abs(a.y - py - 1) < S)) continue;
      drips.push({ x: px, y: py + 1, nub: rnd() < .5 ? 1 : 2 });
    }
    // The counters (the hole of an O, an A, a D…): pixels walled in by the letter and clear of its outline, for an eye to peek from.
    let hole = null;
    if (S >= 3) {
      const out = new Uint8Array(w * h), st = []; for (let x = 0; x < w; x++) st.push(x, 0, x, h - 1); for (let y = 0; y < h; y++) st.push(0, y, w - 1, y);
      while (st.length) { const y = st.pop(), x = st.pop(); if (x < 0 || y < 0 || x >= w || y >= h || out[y * w + x] || solid(x, y)) continue; out[y * w + x] = 1; st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1); }
      const px = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (!out[y * w + x] && !solid(x, y) && !nearSolid(x, y)) px.push([x, y]);
      if (px.length > 6) {
        const hx = px.map(p => p[0]), hy = px.map(p => p[1]), x0 = Math.min(...hx), y0 = Math.min(...hy), x1 = Math.max(...hx), y1 = Math.max(...hy);
        const hc = ART.canvas(w, h), hg = hc.getContext('2d'); for (const [x, y] of px) { hg.fillStyle = y > y1 - 2 ? '#d8d0b8' : x === x0 && y > y0 + 1 ? '#ece4cc' : '#fffbe6'; hg.fillRect(x, y, 1, 1); }
        hole = { c: hc, x0, y0, x1, y1 };
      }
    }
    const r = { ch, c, face, w, h, top, base: bot + Z.ext, inkL, inkW: inkR - inkL + 1, ox, oy, S, drips, P, Z, hole };
    cache.set(key, r); return r;
  }
  function layout(str, size = 'big', pal = 'musgo', gap) {
    const Z = SIZES[size] || SIZES.big, items = [], gp = gap === undefined ? Z.gap : gap; let x = 0, i = 0;
    for (const ch of String(str).toUpperCase()) {
      if (ch === ' ') { x += Z.S * 2 + Z.gap; continue; }
      const gl = glyph(ch, size, pal); if (!gl) { x += Z.S * 3; continue; }
      items.push({ ch, gl, x: x - gl.inkL, cx: x + gl.inkW / 2, i: i++ }); x += gl.inkW + gp;
    }
    return { items, w: Math.max(0, x - gp) };
  }
  // A hanging drip of goo L pixels long under (x, y); past 5 it swells into a bead.
  function drip(g, x, y, L, P) {
    const n = Math.round(L); if (n < 1) return; const b = n >= 5;
    g.fillStyle = OUT; g.fillRect(x - 1, y, 3, n + 1); if (b) { g.fillRect(x - 2, y + n - 3, 5, 3); g.fillRect(x - 1, y + n - 4, 3, 5); }
    g.fillStyle = P.drip[0]; g.fillRect(x, y, 1, n); if (b) g.fillRect(x - 1, y + n - 3, 3, 3);
    if (b) { g.fillStyle = P.drip[1]; g.fillRect(x + 1, y + n - 2, 1, 2); g.fillRect(x, y + n - 1, 1, 1); g.fillStyle = P.drip[2]; g.fillRect(x - 1, y + n - 3, 1, 1); }
    else if (n >= 2) { g.fillStyle = P.drip[1]; g.fillRect(x, y + n - 1, 1, 1); }
  }
  // A round blob of goo (splashes, falling drops, puddles): outline, body, a shaded belly and a highlight.
  function blob(g, x, y, r, pal = 'musgo') {
    const P = typeof pal === 'string' ? PAL[pal] || PAL.musgo : pal; x = Math.round(x); y = Math.round(y);
    if (r < 1) { g.fillStyle = P.drip[1]; g.fillRect(x, y, 2, 2); g.fillStyle = P.drip[0]; g.fillRect(x, y, 1, 1); return; }
    const disc = (R, col, dy0 = 0) => { g.fillStyle = col; for (let dy = -R; dy <= R; dy++) { const hw = Math.round(Math.sqrt(Math.max(0, R * R - dy * dy))); g.fillRect(x - hw, y + dy + dy0, hw * 2 + 1, 1); } };
    const R = Math.round(r); disc(R + 1, OUT); disc(R, P.drip[1]); if (R >= 2) disc(R - 1, P.drip[0], -1); else { g.fillStyle = P.drip[0]; g.fillRect(x - 1, y - 1, 2, 2); }
    g.fillStyle = P.drip[2]; g.fillRect(x - Math.ceil(R / 2), y - Math.ceil(R / 2), 1, 1);
  }
  // Loose goo: blobs flung by a splat, drops let go by a drip, and the puddles they leave where they land.
  // p: { x, y, vx, vy, r (0 or 1), life, drop, pal }; floorAt(x) gives the surface below (or nothing).
  function gooStep(list, floorAt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.puddle) { if (--p.life <= 0) list.splice(i, 1); continue; }
      p.vy += p.drop ? .14 : .17; p.x += p.vx; p.y += p.vy; p.vx *= .98;
      const fl = floorAt ? floorAt(p.x) : Infinity;
      if (p.vy > 0 && p.y >= fl && p.y - p.vy < fl + 1) {
        list[i] = { x: p.x, y: fl, puddle: true, life: p.drop ? 40 : 22, w: p.drop ? 3 : 2, pal: p.pal };
        if (p.drop) for (let k = 0; k < 4; k++) list.push({ x: p.x, y: fl - 1, vx: (k < 2 ? -1 : 1) * (.3 + Math.random() * .7), vy: -(.8 + Math.random() * .8), r: 0, life: 12 + Math.random() * 8, pal: p.pal });
        continue;
      }
      if (--p.life <= 0 || p.y > 400) list.splice(i, 1);
    }
  }
  function gooDraw(g, list) {
    for (const p of list) {
      const P = PAL[p.pal] || PAL.musgo, x = Math.round(p.x), y = Math.round(p.y);
      if (p.puddle) { g.globalAlpha = Math.min(1, p.life / 12); const w = p.w; g.fillStyle = OUT; g.fillRect(x - w - 1, y - 2, w * 2 + 3, 2); g.fillStyle = P.drip[0]; g.fillRect(x - w, y - 2, w * 2 + 1, 1); g.fillStyle = P.drip[2]; g.fillRect(x - w + 1, y - 2, 1, 1); g.globalAlpha = 1; continue; }
      g.globalAlpha = Math.min(1, p.life / 10);
      if (p.drop) { const st = p.vy > 1.4 ? 1 : 0; g.fillStyle = OUT; g.fillRect(x - 1, y - 2 - st, 3, 5 + st); g.fillRect(x - 2, y - 1, 5, 3); g.fillStyle = P.drip[0]; g.fillRect(x - 1, y - 1, 3, 2); g.fillRect(x, y - 2 - st, 1, 4 + st); g.fillStyle = P.drip[1]; g.fillRect(x + 1, y, 1, 1); g.fillStyle = P.drip[2]; g.fillRect(x - 1, y - 1, 1, 1); }
      else blob(g, x, y, p.r, P);
      g.globalAlpha = 1;
    }
  }
  // A soap-thin bubble of swamp gas: b = { x, y, r, t, life, ph }; it wobbles up and pops into a ring of specks.
  function bubble(g, b) {
    const x = Math.round(b.x + Math.sin(b.t / 7 + (b.ph || 0)) * 1.5), y = Math.round(b.y), r = Math.max(0, b.r);
    if (b.t > b.life) { const k = b.t - b.life; g.fillStyle = '#e8fbff'; for (let a = 0; a < 6; a++) g.fillRect(Math.round(x + Math.cos(a) * (r + k)), Math.round(y + Math.sin(a) * (r + k)), 1, 1); return; }
    g.fillStyle = '#cfeef8'; g.globalAlpha *= .9; const n = Math.max(6, Math.round(r * 7)); for (let a = 0; a < n; a++) { const an = a / n * Math.PI * 2; g.fillRect(Math.round(x + Math.cos(an) * r), Math.round(y + Math.sin(an) * r), 1, 1); }
    g.globalAlpha /= .9; g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - r * .5), Math.round(y - r * .5), 1, 1);
  }
  // One glyph with its box at (x, y), pivoting on the middle of its bottom. o: sx, sy, rot, alpha, drips (extra length:
  // a number for every drip or an array per drip), shine (x of a slanted band, in box pixels), tint (flat colour: shadows).
  function letter(g, gl, x, y, o = {}) {
    const hw = gl.w >> 1, sx = o.sx === undefined ? 1 : o.sx, sy = o.sy === undefined ? 1 : o.sy;
    g.save(); if (o.alpha !== undefined) g.globalAlpha *= Math.max(0, Math.min(1, o.alpha));
    g.translate(Math.round(x) + hw, Math.round(y) + gl.base); if (o.rot) g.rotate(o.rot); if (sx !== 1 || sy !== 1) g.scale(sx, sy); g.translate(-hw, -gl.base);
    if (o.tint) { g.drawImage(ART.tint(gl.face, o.tint), 0, 0); g.restore(); return; }
    g.drawImage(gl.c, 0, 0);
    const dr = o.drips; gl.drips.forEach((a, k) => { const L = a.nub + (typeof dr === 'number' ? dr : dr ? dr[k] || 0 : 0); drip(g, a.x, a.y, L, gl.P); });
    if (o.shine !== undefined && o.shine !== null && o.shine > -gl.h * .5 - 8 && o.shine < gl.w + 2) {
      g.save(); g.beginPath(); for (let yy = 0; yy < gl.h; yy++) { const bx = Math.round(o.shine + (gl.h - yy) * .5); g.rect(bx, yy, 4, 1); g.rect(bx + 6, yy, 1, 1); }
      g.clip(); g.globalAlpha *= .75; g.drawImage(gl.face, 0, 0); g.restore();
    }
    if (o.extra) o.extra(g, gl);
    g.restore();
  }
  // A whole word, cap line at y. o: size, pal, align, shadow, drips, shine (x from the word's left), each(i, ch, item) →
  // per-letter { x, y, sx, sy, rot, alpha, drips, pal } or false to skip it.
  function draw(g, str, x, y, o = {}) {
    const L = layout(str, o.size, o.pal, o.gap); if (o.align === 'center') x -= L.w / 2; else if (o.align === 'right') x -= L.w; x = Math.round(x); y = Math.round(y);
    const es = L.items.map(it => (o.each ? o.each(it.i, it.ch, it) : null));
    const place = (it, e) => { const gl = e.pal ? glyph(it.ch, o.size, e.pal) || it.gl : it.gl; return [gl, x + it.x + (e.x || 0), y - gl.top + (e.y || 0)]; };
    if (o.shadow) L.items.forEach((it, k) => { if (es[k] === false) return; const e = es[k] || {}, [gl, lx, ly] = place(it, e); letter(g, gl, lx + 2, ly + 3, { sx: e.sx, sy: e.sy, rot: e.rot, tint: '#140c1c', alpha: .32 * (e.alpha !== undefined ? e.alpha : 1) }); });
    L.items.forEach((it, k) => { if (es[k] === false) return; const e = es[k] || {}, [gl, lx, ly] = place(it, e); letter(g, gl, lx, ly, { sx: e.sx, sy: e.sy, rot: e.rot, alpha: e.alpha, drips: e.drips !== undefined ? e.drips : o.drips, shine: o.shine !== undefined ? o.shine - it.x : e.shine, extra: e.extra }); });
    return L.w;
  }
  return { glyph, layout, letter, draw, drip, blob, gooStep, gooDraw, bubble, width: (str, size, gap) => layout(str, size, 'musgo', gap).w, PAL, SIZES, OUT };
})();
ART.glup = Glup.draw; ART.glupWidth = Glup.width;
