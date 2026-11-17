// GLUP — pantalla de título. El logotipo está dibujado a trazos gordos con la piel de
// Bigotes (oliva moteado, relieve y brillo) y la G es su cabeza: la abertura es la boca,
// con ojo y bigotes. Sigue a la cinemática: Nila llega corriendo a un otero sobre el pantano,
// la cámara sube al cielo y Bigotes, en alto, escupe las letras una a una: caen estiradas, se aplastan
// salpicando babas y tiemblan como gelatina; luego respiran, gotean, echan burbujas, y el ojo de la G mira
// a todas partes. Al pulsar para empezar, las letras se agachan y saltan.
'use strict';
const Title = (() => {
  const INTRO = 170;                 // frames until everything is in place
  const ARRIVE = 46, RAISE = 70, SPIT0 = 80, SPIT_GAP = 9, FLY = 22, LOWER = 126;
  const TOP = 12, M = 4, EXT = 4;    // logo top, canvas margin, extrusion depth

  // ---------------------------------------------------------------- Letras
  // Each letter is a set of strokes stamped with a round brush, so the shapes come out chunky and soft.
  const R = 5.2;
  const seg = (x0, y0, x1, y1) => ({ seg: [x0, y0, x1, y1] });
  const arc = (cx, cy, r, a0, a1) => ({ arc: [cx, cy, r, a0, a1] });
  const D = Math.PI / 180;
  const LETTERS = [
    { ch: 'G', w: 42, strokes: [arc(21, 23, 15, -52 * D, -336 * D), seg(34.5, 28, 35, 25), seg(35, 25, 26, 25)] },
    { ch: 'L', w: 30, strokes: [seg(8, 7, 8, 38), seg(8, 38, 26, 38)] },
    { ch: 'U', w: 40, strokes: [seg(8, 7, 8, 25), arc(20, 25, 12, Math.PI, 0), seg(32, 25, 32, 7)] },
    { ch: 'P', w: 35, strokes: [seg(8, 7, 8, 38), seg(8, 7, 20, 7), arc(20, 15.5, 8.5, -Math.PI / 2, Math.PI / 2), seg(20, 24, 8, 24)] }];
  const LH = 46;
  const FILL = ['#fff3b8', '#f2e08a', '#dccd68', '#bdb452', '#9ca044', '#7c883a', '#5f6e30'];

  function stamp(mask, w, h, x, y) {
    for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++) for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      const px = Math.round(x + dx) + M, py = Math.round(y + dy) + M; if (px >= 0 && py >= 0 && px < w && py < h) mask[py * w + px] = 1;
    }
  }
  function buildLetter(L, seed) {
    const w = L.w + M * 2, h = LH + M * 2 + EXT, mask = new Uint8Array(w * h);
    for (const s of L.strokes) {
      if (s.seg) { const [x0, y0, x1, y1] = s.seg, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) stamp(mask, w, h, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); }
      else { const [cx, cy, r, a0, a1] = s.arc, n = Math.ceil(Math.abs(a1 - a0) * r * 2); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; stamp(mask, w, h, cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
    }
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
    const ext = (x, y) => { if (at(x, y)) return 0; for (let k = 1; k <= EXT; k++) if (at(x, y - k)) return k; return 0; };
    const solid = (x, y) => at(x, y) || ext(x, y) > 0;
    // Distance to the edge, for spots that stay inside the stroke.
    const inner = (x, y) => { for (let d = 1; d <= 3; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) if (!at(x + dx, y + dy)) return d - 1; return 3; };
    let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const spots = new Set(); for (let i = 0; i < 9; i++) { const x = (rnd() * w) | 0, y = (rnd() * h) | 0; if (at(x, y) && inner(x, y) >= 2) { spots.add(y * w + x); spots.add(y * w + x + 1); if (rnd() < .5) spots.add((y + 1) * w + x); } }
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    let top = h, bottom = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y)) {
        const f = (y - top) / Math.max(1, bottom - top) * (FILL.length - 1), i = Math.min(FILL.length - 2, f | 0), fr = f - i;
        let col = fr > .66 || (fr > .33 && ((x + y) & 1)) ? FILL[i + 1] : FILL[i];
        if (spots.has(y * w + x)) col = '#6a7430';
        if (!at(x, y - 1)) col = '#fffbe6'; else if (!at(x, y - 2) && y - top < 12) col = FILL[0];
        else if (!at(x - 1, y)) col = y - top < (bottom - top) * .6 ? '#f6ea9c' : FILL[3];
        else if (!at(x + 1, y) || !at(x, y + 1)) col = '#4f5c28';
        px(x, y, col);
      } else if (ext(x, y)) px(x, y, ext(x, y) <= 2 ? '#48522a' : '#2f3820');
      else { let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) if (dx * dx + dy * dy <= 5 && solid(x + dx, y + dy)) near = true; if (near) px(x, y, '#1a1420'); }
    }
    // A little gloss on the upper left of the stroke.
    g.fillStyle = '#ffffff'; for (let y = top + 2; y < top + 4; y++) for (let x = 0; x < w; x++) if (at(x, y) && inner(x, y) >= 1 && x < w * .45 && (x + y) % 5 !== 0) { g.fillRect(x, y, 1, 1); break; }
    // Drip points: bottom edges that hang over air.
    const drips = []; for (let x = 2; x < w - 2; x++) { let y = h - 1; while (y > 0 && !solid(x, y)) y--; if (y > 0 && solid(x, y) && !solid(x - 1, y + 1) && !solid(x + 1, y + 1) && at(x, y - EXT) && rnd() < .08) drips.push({ x, y: y + 2 }); }
    // The shape used by the shine sweep: the face of the letter only.
    const face = document.createElement('canvas'); face.width = w; face.height = h; const fg = face.getContext('2d'); fg.fillStyle = '#fffbe6'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y)) fg.fillRect(x, y, 1, 1);
    return { c, face, w, h, drips, mask, at };
  }
  let letters = null;
  function build() {
    if (letters) return letters;
    const total = LETTERS.reduce((a, l) => a + l.w, 0) + 1 * (LETTERS.length - 1);
    let x = Math.round((W - total) / 2) - 16;   // a little left, so the moon shows beside the P
    letters = LETTERS.map((L, i) => { const b = buildLetter(L, 97 + i * 31); b.slotX = x - M; b.slotY = TOP - M; x += L.w + 1; b.i = i; return b; });
    return letters;
  }


  // ---------------------------------------------------------------- Coreografía
  // Nila runs in from the left, skids at the edge of the knoll and holds Bigotes up to spit the letters.
  const NILA = { x: 120, y: 118 }, GROUND = 136;
  function nilaAt(t) { if (t >= ARRIVE) return NILA.x; const k = t / ARRIVE; return -30 + (NILA.x + 30) * (1 - (1 - k) * (1 - k)); }
  function mouth() { return { x: NILA.x + 14, y: NILA.y - 12 }; }
  function camY(t) { return 34 * (1 - Math.min(1, Math.max(0, (t - 30) / 50)) ** 2 * (3 - 2 * Math.min(1, Math.max(0, (t - 30) / 50)))); }
  function letterAt(b, t) {
    const t0 = SPIT0 + b.i * SPIT_GAP, k = (t - t0) / FLY;
    if (t < t0) return null;
    if (k < 1) {
      const m = mouth(), mx = m.x - b.w / 2, my = m.y - b.h / 2, e = k * (2 - k), st = k > .5 ? (k - .5) * 2 : 0;
      // Stretched along the drop as it comes down on its slot.
      return { x: mx + (b.slotX - mx) * e, y: my + (b.slotY - my) * e - Math.sin(k * Math.PI) * 30, s: .3 + .7 * k, rot: (1 - k) * (b.i % 2 ? 1 : -1) * 2.4, sx: 1 - .22 * st, sy: 1 + .34 * st };
    }
    // The landing: a splat flat, then a jelly wobble that takes its time to settle.
    const land = t - t0 - FLY, sq = land < 44 ? Math.exp(-land / 6.5) * Math.cos(land / 1.5) : 0, wob = land < 44 ? Math.exp(-land / 9) * Math.sin(land / 2.2) * .06 * (b.i % 2 ? 1 : -1) : 0;
    const bob = t > INTRO ? Math.round(Math.sin((t + b.i * 23) / 28) * 1.2) : 0;
    const j = S.jig[b.i] * Math.exp(-(t - S.jigT[b.i]) / 8) * Math.cos((t - S.jigT[b.i]) / 1.5);
    // A hop: stretched on the way up, squashed when it lands.
    const amp = S.hopAmp[b.i], hk = (t - S.hop[b.i]) / 16; let hy = 0, hs = 0; if (hk >= 0 && hk < 1) { hy = -Math.sin(hk * Math.PI) * 9 * amp; hs = (hk < .5 ? .14 : .08) * amp; } else if (hk >= 1 && hk < 1.5) hs = -.22 * amp * Math.sin((hk - 1) * 2 * Math.PI);
    // A press: the letters crouch together before they jump.
    const pk = t - S.pressT; if (pk >= 0 && pk < 5) hs -= Math.sin(pk / 5 * Math.PI) * .3;
    const breath = t > INTRO ? Math.sin(t / 34 + b.i * 1.3) * .035 : 0;
    return { x: b.slotX, y: b.slotY + bob + hy, s: 1, rot: (hk >= 0 && hk < 1 ? Math.sin(hk * Math.PI * 2) * .06 * (b.i % 2 ? 1 : -1) : 0) + wob, sx: 1 + sq * .45 + j * .22 - hs * .7 - breath, sy: 1 - sq * .4 - j * .22 + hs + breath };
  }

  // ---------------------------------------------------------------- Partículas y sonido
  const S = { parts: [], goo: [], hang: [], bubs: [], lastT: -1, whiteIn: false, jig: [0, 0, 0, 0], jigT: [0, 0, 0, 0], hop: [-99, -99, -99, -99], hopAmp: [1, 1, 1, 1], pressT: -99, shake: 0, flash: 0, rings: [], sparks: [], bubbles: [], sign: null,
    eye: { lx: 1, ly: 0, tx: 1, ty: 0, blink: -99 } };
  // The top of the knoll at x, where falling goo lands (the camera is down by the time any falls).
  const groundAt = x => GROUND + Math.round(Math.max(0, (x - 190) * .35) + Math.max(0, (40 - x) * .15) + Math.sin(x / 13) * 1.5) - 1;
  function splat(x, y, n, spd) { for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; S.goo.push({ x: x + s * Math.random() * 10, y: y - Math.random() * 4, vx: s * (.4 + Math.random() * spd), vy: -(.8 + Math.random() * spd * 1.3), r: Math.random() < .35 ? 1 : 0, life: 60 + Math.random() * 30 }); } }
  // A letter jiggles like jelly after a hit, and hops when a wave runs along the word.
  function jiggle(i, amp, t) { S.jig[i] = Math.max(S.jig[i] * Math.exp(-(t - S.jigT[i]) / 8), amp); S.jigT[i] = t; }
  function hop(i, t, amp = 1) { S.hop[i] = t; S.hopAmp[i] = amp; }
  function burst(x, y, n, col, spd, up) { for (let i = 0; i < n; i++) { const a = up ? -Math.PI / 2 + (Math.random() - .5) * 1.6 : Math.random() * Math.PI * 2, v = spd * (.4 + Math.random() * .8); S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 16 + Math.random() * 16, col: col[(Math.random() * col.length) | 0], g: .12 }); } }
  function update(t) {
    if (t === 1 || t < S.lastT) { S.parts = []; S.goo = []; S.hang = []; S.bubs = []; S.rings = []; S.sparks = []; S.bubbles = []; S.sign = null; S.hop = [-99, -99, -99, -99]; S.hopAmp = [1, 1, 1, 1]; S.jig = [0, 0, 0, 0]; S.pressT = -99; }
    S.lastT = t; const L = build();
    if (t < ARRIVE && t % 5 === 0) Sound.play('step');
    if (t === ARRIVE) { Sound.play('land', .8); burst(NILA.x + 4, GROUND, 10, ['#c9b08a', '#a08a6a', '#e0c8a0'], 1.6, true); }
    if (t === RAISE) Sound.play('charge');
    for (let i = 0; i < 4; i++) { const t0 = SPIT0 + i * SPIT_GAP; if (t === t0) { Sound.play('spit', .5 + i * .2); const m = mouth(); burst(m.x, m.y, 6, ['#fff3b8', '#dccd68'], 1.4, false); } if (t === t0 + FLY) { Sound.play('thud'); Sound.play('bloop', i * 2); const b = L[i]; burst(b.slotX + b.w / 2, b.slotY + b.h - 4, 14, ['#fff3b8', '#9ca044', '#ffffff'], 1.9, true); splat(b.slotX + b.w / 2, b.slotY + b.h - 6, 6, 1.8); S.shake = 5; S.rings.push({ x: b.slotX + b.w / 2, y: b.slotY + b.h - 3, t: 0 }); jiggle(i, 1, t); if (i > 0) jiggle(i - 1, .55, t); if (i < 3 && t >= SPIT0 + (i + 1) * SPIT_GAP + FLY) jiggle(i + 1, .55, t); } }
    // The last letter home: the whole word jumps for joy with a flash.
    if (t === SPIT0 + 3 * SPIT_GAP + FLY + 6) { Sound.play('glup', 1.2); S.flash = 6; S.shake = 7; for (let i = 0; i < 4; i++) hop(i, t + i * 3); }
    if (t > INTRO) {
      const k = (t - INTRO) % 320; if (k === 200) for (let i = 0; i < 4; i++) hop(i, t + i * 5);
      if ((t - INTRO) % 230 === 90) S.bubbles.push({ t: 0 });
      if (t % 22 === 0) { const b = L[(Math.random() * 4) | 0]; for (let n = 0; n < 20; n++) { const x = (Math.random() * b.w) | 0, y = (Math.random() * b.h * .5) | 0; if (b.at(x, y) && !b.at(x, y - 2)) { S.sparks.push({ b, x, y, t: 0 }); break; } } }
    }
    for (let i = S.hop.length - 1; i >= 0; i--) if (t - S.hop[i] === 16) { const b = L[i]; burst(b.slotX + b.w / 2, b.slotY + b.h - 2, 5, ['#fff3b8', '#dccd68'], 1, true); }
    for (const r of S.rings) r.t++; S.rings = S.rings.filter(r => r.t < 18);
    for (const sp of S.sparks) sp.t++; S.sparks = S.sparks.filter(sp => sp.t < 18);
    for (const bu of S.bubbles) bu.t++; S.bubbles = S.bubbles.filter(bu => bu.t < 110);
    if (S.shake > 0) S.shake--; if (S.flash > 0) S.flash--;
    // The sign: dropped on springy ropes, then a pendulum in the breeze.
    if (t === INTRO - 30) S.sign = { y: 30, vy: 0, a: .22, va: 0 };
    if (S.sign) { const q = S.sign; q.vy += (66 - q.y) * .09; q.vy *= .84; q.y += q.vy; q.va += -q.a * .03 - q.va * .06 + Math.sin(t / 70) * .0009; q.a += q.va; }
    if (t === LOWER) Sound.play('glup', 1);
    // After the intro, now and then a drip swells under a letter until it lets go; the letter springs back
    // and the drop splashes on the knoll.
    if (t > INTRO && S.hang.length < 3 && Math.random() < .015) { const i = (Math.random() * 4) | 0, b = L[i]; if (b.drips.length) { const d = b.drips[(Math.random() * b.drips.length) | 0]; if (!S.hang.some(h => h.d === d)) S.hang.push({ i, d, len: 0, max: 7 + Math.random() * 5, v: .06 + Math.random() * .06 }); } }
    for (let k = S.hang.length - 1; k >= 0; k--) {
      const h = S.hang[k]; h.len += h.len > h.max * .75 ? h.v * 2.5 : h.v; if (h.len < h.max) continue;
      const b = L[h.i], st = letterAt(b, t); S.hang.splice(k, 1); jiggle(h.i, .3, t);
      if (st) S.goo.push({ x: st.x + h.d.x, y: st.y + h.d.y + h.len - 2, vx: 0, vy: .6, r: 1, life: 400, drop: true });
    }
    Glup.gooStep(S.goo, groundAt);
    // Bubbles of swamp gas rise off the letters.
    if (t > INTRO && t % 41 === 0) { const b = L[(Math.random() * 4) | 0]; S.bubs.push({ x: b.slotX + M + 6 + Math.random() * (b.w - M * 2 - 12), y: b.slotY + M + 2, vy: -(.2 + Math.random() * .2), r: 0, max: 1.2 + Math.random() * 1.6, t: 0, life: 50 + Math.random() * 50, ph: Math.random() * 6 }); }
    for (let k = S.bubs.length - 1; k >= 0; k--) { const u = S.bubs[k]; u.t++; u.y += u.vy; u.r = Math.min(u.max, u.t / 10); if (u.t > u.life + 5) S.bubs.splice(k, 1); }
    // The G's eye looks about: at Nila, at the moon, at the sign, at a bubble; it blinks, sometimes twice.
    const e = S.eye; if (t > INTRO && t % 110 === 0) { const L2 = [[-1, 1], [1, -1], [0, 1], [1, 0], [-1, -1], [1, 1]]; [e.tx, e.ty] = L2[(Math.random() * L2.length) | 0]; }
    if (t < INTRO) { e.tx = -1; e.ty = 1; }
    e.lx += (e.tx - e.lx) * .25; e.ly += (e.ty - e.ly) * .25;
    if (t % 190 === 100 || (t % 570 === 110)) e.blink = t;
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; if (--p.life <= 0) S.parts.splice(i, 1); }
  }

  // ---------------------------------------------------------------- El otero
  // The vista: the swamp at dusk, the river winding off to the dead cypress where the Heron nests.
  function vista(g, t, cy) {
    const bg = ART.background('dusk'), W2 = W;
    const L = (c, k, y, drift = 0) => { if (!c) return; const w = c.width, ox = -Math.floor(((200 * k + drift) % w + w) % w); for (let x = ox; x < W2; x += w) g.drawImage(c, x, Math.round(y + cy * k)); if (ox > 0) g.drawImage(c, ox - w, Math.round(y + cy * k)); };
    g.drawImage(bg.sky, 0, Math.round(cy * .05));
    if (bg.stars) for (const s of bg.stars) { const a = Math.sin(t * s.sp + s.ph); if (a > .55) { g.globalAlpha = (a - .55) * 2.2; g.fillStyle = s.c; g.fillRect(s.x, s.y + Math.round(cy * .05), 1, 1); g.globalAlpha = 1; } }
    L(bg.clouds, .08, 6, t * .05); L(bg.hills, .15, 84);
    // The dead cypress on the horizon, with the nest and the Heron circling it.
    const nest = ART.background('nest').snag;
    if (nest) { const sx = 222, sy = 118 + cy * .2; g.save(); g.globalAlpha = .9; g.drawImage(ART.tint(nest, '#4a3050'), sx, Math.round(sy - nest.height * .45), Math.round(nest.width * .45), Math.round(nest.height * .45)); g.restore(); const a = t / 70; g.save(); g.translate(Math.round(sx + nest.width * .22 + Math.cos(a) * 22), Math.round(sy - nest.height * .45 - 6 + Math.sin(a) * 5)); g.restore(); Boss.figura(g, { x: Math.round(sx + nest.width * .22 + Math.cos(a) * 22), y: Math.round(sy - nest.height * .45 - 6 + Math.sin(a) * 5), t, dir: Math.sin(a) > 0 ? -1 : 1, scale: .26, tint: '#2a1830' }); }
    L(bg.far, .22, 128 - bg.far.gy);
    // Below the far shore, the dark water that fills the gap as the camera rises.
    g.fillStyle = '#2a2038'; g.fillRect(0, Math.round(146 + cy * .3), W, H);
    L(bg.mistA, .3, 104, t * .1);
    L(bg.mid, .5, 150 - bg.mid.gy);
    // The knoll under Nila: a dark hump with a lit rim of grass.
    const ky = GROUND + Math.round(cy);
    for (let x = 0; x < W; x++) {
      const top = ky + Math.round(Math.max(0, (x - 190) * .35) + Math.max(0, (40 - x) * .15) + Math.sin(x / 13) * 1.5);
      g.fillStyle = '#281b25'; g.fillRect(x, top, 1, H - top); g.fillStyle = '#35222a'; g.fillRect(x, top + 2, 1, 4);
      const blade = 2 + ((x * 7) % 5), sway = Math.round(Math.sin(t / 25 + x * .3) * (blade > 4 ? 1 : 0));
      g.fillStyle = (x * 13) % 7 < 3 ? '#e2a05c' : '#7fb040'; g.fillRect(x + sway, top - blade, 1, blade); g.fillStyle = '#5e8a2e'; g.fillRect(x, top - 1, 1, 2);
    }
    // Cattails framing the right edge, swaying.
    for (let i = 0; i < 4; i++) { const x = 286 + i * 9, h = 40 + (i % 2) * 14, sw = Math.sin(t / 30 + i) * 2; g.fillStyle = '#120c18'; for (let k = 0; k < h; k++) g.fillRect(Math.round(x + sw * k / h), ky + 14 - k, 2, 1); g.fillRect(Math.round(x + sw) - 1, ky + 14 - h - 8, 4, 9); }
  }

  // ---------------------------------------------------------------- Dibujo
  function drawLetter(g, b, st, t) {
    g.save(); g.translate(Math.round(st.x + b.w / 2), Math.round(st.y + b.h)); if (st.rot) g.rotate(st.rot); g.scale(st.s * st.sx, st.s * st.sy);
    g.drawImage(b.c, -b.w / 2, -b.h);
    // Shine: a slanted band sweeps across the faces every few seconds.
    const sw = (t - INTRO) % 300; if (t > INTRO && sw < 60) {
      const bx = (sw / 60) * (W + 80) - 40 - (b.slotX - (letters[0].slotX)) - 20;
      g.save(); g.beginPath(); for (let y = 0; y < b.h; y++) g.rect(-b.w / 2 + bx + y * .5, -b.h + y, 5, 1); g.clip(); g.globalAlpha = .75; g.drawImage(b.face, -b.w / 2, -b.h); g.restore();
    }
    // Drips: a nub under every drip point, and the ones swelling now, bead and all, in the letter's own squash.
    if (st.s >= 1) {
      const P = Glup.PAL.musgo; for (const d of b.drips) { const h = S.hang.find(q => q.d === d); Glup.drip(g, -b.w / 2 + d.x, -b.h + d.y - 1, 1 + (d.x % 2) + (h ? h.len : 0), P); }
      if (b.i === 0) { g.save(); g.translate(-b.w / 2, -b.h); drawFace(g, b, { x: 0, y: 0, s: 1, rot: 0 }, t); g.restore(); }
    }
    g.restore();
  }
  // The G is Bigotes' head: an eye over the mouth and two whiskers hanging from its corners.
  function drawFace(g, b, st, t) {
    if (st.s < 1) return;
    const ox = Math.round(st.x), oy = Math.round(st.y), ex = ox + M + 24, ey = oy + M + 10, e = S.eye, bd = t - e.blink, blink = bd >= 0 && bd < 6;
    const happy = t - S.pressT >= 0 && t - S.pressT < 60 || t - (SPIT0 + 3 * SPIT_GAP + FLY + 6) >= 0 && t - (SPIT0 + 3 * SPIT_GAP + FLY + 6) < 34;
    g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey - 3, 7, 7); g.fillRect(ex - 2, ey - 4, 5, 9); g.fillRect(ex - 4, ey - 2, 9, 5);
    if (happy) { g.fillStyle = '#9ca044'; g.fillRect(ex - 3, ey - 2, 7, 5); g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey + 1, 1, 1); g.fillRect(ex - 2, ey, 1, 1); g.fillRect(ex - 1, ey - 1, 3, 1); g.fillRect(ex + 2, ey, 1, 1); g.fillRect(ex + 3, ey + 1, 1, 1); }
    else if (blink) { const k = bd < 3 ? bd : 5 - bd; g.fillStyle = '#fffbe6'; g.fillRect(ex - 2, ey - 2, 5, 5); g.fillStyle = '#9ca044'; g.fillRect(ex - 3, ey - 3, 7, 2 + k * 2); g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey - 2 + k * 2, 7, 1); }
    else { g.fillStyle = '#fffbe6'; g.fillRect(ex - 2, ey - 2, 5, 5); g.fillRect(ex - 3, ey - 1, 7, 3); g.fillRect(ex - 1, ey - 3, 3, 7); const lx = Math.max(-1, Math.min(1, Math.round(e.lx * 1.3))), ly = Math.max(-1, Math.min(1, Math.round(e.ly * 1.3))); g.fillStyle = '#1a1420'; g.fillRect(ex - 1 + lx, ey - 1 + ly, 2, 3); g.fillStyle = '#ffffff'; g.fillRect(ex - 1 + lx, ey - 1 + ly, 1, 1); }
    // Whiskers: pixel chains that curl down and sway.
    const whisk = (x, y, len, ph, a0) => {
      const pts = []; let px = x, py = y; for (let i = 0; i < len; i++) { const a = a0 + i * .1 + Math.sin(t / 24 + ph + i * .22) * (.05 + i * .012); px += Math.cos(a); py += Math.sin(a); pts.push([Math.round(px), Math.round(py), i]); }
      g.fillStyle = '#1a1420'; for (const [x, y, i] of pts) { const k = i < len * .5 ? 4 : 3; g.fillRect(x - 1, y - 1, k, k); }
      for (const [x, y, i] of pts) { const k = i < len * .5 ? 2 : 1; g.fillStyle = i > len - 5 ? '#b8743a' : '#f0c070'; g.fillRect(x, y, k, k); }
    };
    whisk(ox + M + 33, oy + M + 12, 22, 0, -.15); whisk(ox + M + 37, oy + M + 30, 16, 1.7, .45);
  }
  // Nila holds Bigotes up high, head to the sky: the sprite drawn rotated with his life on top.
  function raised(g, t, x, y) {
    const spitting = t >= SPIT0 && t < SPIT0 + SPIT_GAP * 4 && (t - SPIT0) % SPIT_GAP < 4, spr = spitting ? ART.fish.spit : ART.fish.open;
    g.drawImage(ART.nila.win, x - 3, y + 18 - ART.nila.win.height);
    g.save(); g.translate(x + 9, y - 2 + (spitting ? 1 : 0)); g.rotate(-1.05 + (spitting ? .08 : 0)); g.drawImage(spr, -spr.width / 2, -spr.height / 2); Player.fishOverlay(g, spr, -spr.width / 2, -spr.height / 2, t, { mood: 'mad', lx: 1, ly: -1 }); g.restore();
    g.drawImage(ART.hand, x + 2, y - 2); g.drawImage(ART.hand, x + 7, y - 1);
  }
  // The sign hangs from two ropes tied under the L and the U; it springs, sways and settles.
  function drawSign(g, t, q) {
    const L = build(), text = 'Nila y el pez gato', tw = ART.textWidth(text), w = tw + 16, h = 13, pivY = TOP + LH - 4;
    const a1 = { x: L[1].slotX + M + 10, y: pivY }, a2 = { x: L[2].slotX + M + 30, y: pivY }, cx = (a1.x + a2.x) / 2;
    const y = q.y, ang = q.a, ca = Math.cos(ang), sa = Math.sin(ang);
    const corner = dx => ({ x: cx + dx * ca, y: y + dx * sa });
    const c1 = corner(-w / 2 + 6), c2 = corner(w / 2 - 7);
    // Ropes with a little sag.
    for (const [a, c] of [[a1, c1], [a2, c2]]) { const n = 14; for (let i = 0; i <= n; i++) { const k = i / n, x = a.x + (c.x - a.x) * k, yy = a.y + (c.y - a.y) * k + Math.sin(k * Math.PI) * 2; g.fillStyle = i % 3 ? '#8a6a4a' : '#6b4a30'; g.fillRect(Math.round(x), Math.round(yy), 1, 1); } }
    g.save(); g.translate(Math.round(cx), Math.round(y)); g.rotate(ang);
    const x = -Math.round(w / 2);
    g.fillStyle = '#1a1420'; g.fillRect(x - 1, -1, w + 2, h + 2); g.fillStyle = '#8a5a34'; g.fillRect(x, 0, w, h); g.fillStyle = '#a56f38'; g.fillRect(x, 0, w, 2); g.fillRect(x, 6, w, 1); g.fillStyle = '#6b4a30'; g.fillRect(x, h - 2, w, 2);
    g.fillStyle = '#5e8a2e'; for (let i = 0; i < w; i += 5) g.fillRect(x + i + ((i * 7) % 3), -1, 2 + (i % 2), 1);
    g.fillStyle = '#4a2e1a'; g.fillRect(x + 2, 2, 1, 1); g.fillRect(x + w - 3, 2, 1, 1);
    ART.text(g, text, 0, 3, '#fff3b8', 'center', '#4a2e1a');
    const sh = (t % 200) / 40; if (sh < 1) { g.globalAlpha = .6; g.fillStyle = '#fff6d6'; g.fillRect(Math.round(x + sh * w), 1, 3, h - 2); g.globalAlpha = 1; }
    g.restore();
  }
  // The credit: a little signpost stuck in the bank, the name carved in the plank and the year on a tin
  // tag that swings from two strings. It springs up out of the mud once the title is in place.
  function drawCredit(g, t) {
    const T0 = INTRO + 24; if (t < T0) return;
    const k = Math.min(1, (t - T0) / 26), c = 1.9, kk = k - 1, rise = k >= 1 ? 0 : (1 - (1 + (c + 1) * kk * kk * kk + c * kk * kk)) * 34;
    if (t === T0 + 12 && !Game.still) Sound.play('land', .5);
    const name = 'gavilanbe', tw = ART.textWidth(name), w = tw + 14, h = 13, px = W - 8 - Math.round(w / 2), top = H - 30 + Math.round(rise);
    // The post, driven into the mud with a little mound and a tuft of grass.
    g.fillStyle = '#1a1420'; g.fillRect(px - 2, top + 4, 5, H - top); g.fillStyle = '#6b4a30'; g.fillRect(px - 1, top + 4, 3, H - top); g.fillStyle = '#8a5a34'; g.fillRect(px - 1, top + 4, 1, H - top);
    g.fillStyle = '#1a1420'; g.fillRect(px - 6, H - 3, 13, 3); g.fillStyle = '#3a2a22'; g.fillRect(px - 5, H - 2, 11, 2);
    g.fillStyle = '#5e8a2e'; for (const [dx, hh] of [[-6, 4], [-4, 6], [4, 5], [6, 3]]) g.fillRect(px + dx, H - 2 - hh, 1, hh); g.fillStyle = '#8fbf4a'; g.fillRect(px - 4, H - 8, 1, 2); g.fillRect(px + 4, H - 7, 1, 2);
    // The plank sways a hair around its nail on the post.
    const ang = Math.sin(t / 55) * .025 + (k < 1 ? Math.sin(k * 9) * (1 - k) * .12 : 0);
    g.save(); g.translate(px + .5, top + 6); g.rotate(ang);
    const x = -Math.round(w / 2), y = -6;
    g.fillStyle = '#1a1420'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillRect(x - 2, y + 1, w + 4, h - 2);
    g.fillStyle = '#8a5a34'; g.fillRect(x, y, w, h); g.fillStyle = '#a56f38'; g.fillRect(x, y, w, 2); g.fillRect(x, y + 6, w, 1); g.fillStyle = '#6b4a30'; g.fillRect(x, y + h - 2, w, 2);
    g.fillStyle = '#7a4e2c'; for (let i = 5; i < w - 3; i += 9) g.fillRect(x + i, y + 3 + (i % 2), 3, 1);
    g.fillStyle = '#5e8a2e'; for (let i = 0; i < w; i += 4) g.fillRect(x + i + ((i * 7) % 3), y - 1, 2 + (i % 2), 1); g.fillStyle = '#8fbf4a'; g.fillRect(x + 3, y - 1, 1, 1); g.fillRect(x + w - 8, y - 1, 1, 1);
    g.fillStyle = '#c9b08a'; g.fillRect(x + 2, y + 2, 1, 1); g.fillRect(x + w - 3, y + 2, 1, 1);
    // Carved letters filled with cream paint: the dark groove shows above and to the left.
    ART.text(g, name, -1, y + 2, '#2a1810', 'center'); ART.text(g, name, 0, y + 3, '#fff3b8', 'center', '#4a2e1a');
    const sh = ((t + 90) % 260) / 50; if (sh < 1) { g.globalAlpha = .45; g.fillStyle = '#fff6d6'; g.fillRect(Math.round(x + sh * w), y + 1, 2, h - 2); g.globalAlpha = 1; }
    // The year on a tin tag, hanging from two strings and swinging on its own.
    const yr = '2026', yw = ART.textWidth(yr) + 6, ta = Math.sin(t / 32 + 1) * .12 + (k < 1 ? Math.sin(k * 7) * (1 - k) * .5 : 0), ty = y + h + 1;
    g.save(); g.translate(0, ty); g.rotate(ta);
    g.fillStyle = '#b8a888'; for (let i = 0; i < 4; i++) { g.fillRect(-yw / 2 + 2, i, 1, 1); g.fillRect(yw / 2 - 3, i, 1, 1); }
    g.fillStyle = '#1a1420'; g.fillRect(-yw / 2 - 1, 3, yw + 2, 11); g.fillStyle = '#d8d0c0'; g.fillRect(-yw / 2, 4, yw, 9); g.fillStyle = '#f2ecdc'; g.fillRect(-yw / 2, 4, yw, 1); g.fillStyle = '#a89c88'; g.fillRect(-yw / 2, 12, yw, 1);
    ART.text(g, yr, 0, 5, '#4a3a30', 'center');
    g.restore();
    g.restore();
    // Now and then a firefly comes to rest on the plank.
    const f = (t - T0) % 420; if (f > 120 && f < 330) {
      const land = f > 180 && f < 280, u = land ? 0 : f <= 180 ? 1 - (f - 120) / 60 : (f - 280) / 50;
      const fx = Math.round(px + w / 2 - 5 + Math.sin(f / 7) * 10 * u + u * 16), fy = Math.round(top - 1 - u * 22 + Math.cos(f / 9) * 4 * u), glow = land ? .6 + Math.sin(f / 6) * .4 : 1;
      g.globalAlpha = .25 * glow; g.fillStyle = '#f2f5a0'; g.fillRect(fx - 2, fy - 2, 5, 5); g.globalAlpha = glow; g.fillStyle = '#ffffe0'; g.fillRect(fx, fy, 1, 1); g.globalAlpha = 1;
    }
  }
  // A press on the title: the letters crouch, then jump high flinging goo, the G grins and the sign swings before the fade.
  function press(t) {
    S.pressT = t; for (let i = 0; i < 4; i++) hop(i, t + 4 + i * 2, 1.6); if (S.sign) S.sign.va += .05; S.flash = 4; S.shake = 4;
    Sound.play('glup', .7); for (const b of build()) splat(b.slotX + b.w / 2, b.slotY + b.h - 6, 5, 1.6);
  }
  function draw(g, t) {
    const L = build(), cy = camY(t);
    vista(g, t, cy);
    // Nila: running in, skidding, holding Bigotes up to spit, then hugging him again.
    const nx = nilaAt(t), ny = NILA.y + Math.round(cy), blink = (t % 200) < 6;
    if (t < ARRIVE) { const run = ART.nila.run[Math.floor(t / 3) % 6]; Player.drawCarry(g, Math.round(nx), ny + ((t >> 2) % 2 ? -1 : 0), run, ART.fish.closed, 0); }
    else if (t < RAISE) { const k = t - ARRIVE, sq = k < 12 ? Math.exp(-k / 4) * Math.cos(k / 1.3) : 0; g.save(); g.translate(nx + 5, ny + 18); g.scale(1 + sq * .15, 1 - sq * .15); g.translate(-(nx + 5), -(ny + 18)); Player.carryLook = { lx: 1, ly: -1 }; Player.drawCarry(g, nx, ny, k < 10 ? ART.nila.skid : ART.nila.idle[blink ? 1 : 0], ART.fish.closed, 0); Player.carryLook = null; g.restore(); }
    else if (t < LOWER) raised(g, t, nx, ny);
    else { const k = t - LOWER, sq = k < 14 ? Math.exp(-k / 4) * Math.cos(k / 1.4) : 0; g.save(); g.translate(nx + 5, ny + 18); g.scale(1 + sq * .2, 1 - sq * .2); g.translate(-(nx + 5), -(ny + 18)); Player.carryLook = { mood: k < 60 ? 'happy' : null, lx: 1, ly: -1 }; Player.drawCarry(g, nx, ny, ART.nila.idle[blink ? 1 : 0], ART.fish.closed, (t >> 5) % 2); Player.carryLook = null; g.restore(); }
    // Fireflies.
    for (const f of Game.titleParts || []) { const a = Math.max(0, Math.sin(f.t / 8)), x = Math.round(f.x), y = Math.round(f.y + cy * .5); g.fillStyle = '#f2f5a0'; g.globalAlpha = a * .3; g.fillRect(x - 1, y - 1, 3, 3); g.globalAlpha = .3 + a * .7; g.fillStyle = '#ffffe0'; g.fillRect(x, y, 1, 1); } g.globalAlpha = 1;
    // Letters, the G's face, drops and sparks.
    g.save(); if (S.shake) g.translate(Math.round((Math.random() - .5) * S.shake), Math.round((Math.random() - .5) * S.shake * .6));
    // Soft shadows on the sky first, then the letters.
    for (const b of L) { const st = letterAt(b, t); if (st && st.s >= 1) { g.save(); g.globalAlpha = .28; g.translate(Math.round(st.x + b.w / 2) + 3, Math.round(st.y + b.h) + 4); g.scale(st.sx, st.sy); g.drawImage(ART.tint(b.face, '#140c1c'), -b.w / 2, -b.h); g.restore(); } }
    for (const b of L) { const st = letterAt(b, t); if (st) drawLetter(g, b, st, t); }
    for (const r of S.rings) { const k = r.t / 18, rad = 4 + k * 26; g.globalAlpha = (1 - k) * .8; g.fillStyle = '#fff3b8'; for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; g.fillRect(Math.round(r.x + Math.cos(an) * rad), Math.round(r.y + Math.sin(an) * rad * .3), 1, 1); } g.globalAlpha = 1; }
    for (const sp of S.sparks) { const st = letterAt(sp.b, t); if (!st) continue; const k = sp.t / 18, r = Math.round(Math.sin(k * Math.PI) * 3), x = Math.round(st.x + sp.x), y = Math.round(st.y + sp.y); g.fillStyle = '#ffffff'; g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1); if (r > 1) { g.fillStyle = '#fff3b8'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); } }
    // The G blows a bubble that drifts up and pops.
    for (const bu of S.bubbles) { const st = letterAt(L[0], t); if (!st) continue; const bx = st.x + M + 38 + Math.sin(bu.t / 9) * 3, by = st.y + M + 20 - Math.max(0, bu.t - 30) * .6, r = Math.min(4, bu.t / 8); if (bu.t < 100) { g.strokeStyle = '#cfeef8'; g.globalAlpha = .9; g.beginPath(); g.arc(bx, by, r, 0, 7); g.stroke(); g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(Math.round(bx - r * .5), Math.round(by - r * .5), 1, 1); } else { g.fillStyle = '#cfeef8'; for (let a = 0; a < 6; a++) g.fillRect(Math.round(bx + Math.cos(a) * (bu.t - 98)), Math.round(by + Math.sin(a) * (bu.t - 98)), 1, 1); } }
    Glup.gooDraw(g, S.goo); for (const u of S.bubs) Glup.bubble(g, u);
    g.restore();
    if (S.flash) { g.globalAlpha = S.flash / 6 * .5; g.fillStyle = '#fff6d6'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    for (const p of S.parts) { g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y + (p.col === '#c9b08a' || p.col === '#a08a6a' || p.col === '#e0c8a0' ? cy : 0)), 1, 1); }
    // The sign drops in on its ropes once the letters are home.
    if (S.sign) drawSign(g, t, S.sign);
    if (t > INTRO && !(Touch.enabled && Touch.portrait)) {   // upright on a phone, the big button below says it
      const msg = Input.mode === 'puretv' ? 'Pulsa A o START' : Touch.enabled ? 'Toca para empezar' : 'Pulsa Z o espacio', a = .55 + Math.sin(t / 14) * .45;
      const mw = ART.textWidth(msg) + 24, mx = Math.round((W - mw) / 2);
      g.fillStyle = 'rgba(16,12,24,.72)'; g.fillRect(mx, 157, mw, 13); g.fillRect(mx + 1, 156, mw - 2, 15);
      g.globalAlpha = .7 + a * .3; ART.text(g, msg, W / 2 + 4, 160, '#fff6d6', 'center', '#1b2430'); g.globalAlpha = 1;
      const bx = mx + 6 + Math.round(Math.sin(t / 8) * 1.5); g.fillStyle = '#f2c46a'; g.fillRect(bx, 160, 1, 5); g.fillRect(bx + 1, 161, 1, 3); g.fillRect(bx + 2, 162, 1, 1);
    }
    drawCredit(g, t);
    // Coming straight from the cinematic: the white flash fades into the vista.
    if (S.whiteIn && t < 30) { g.globalAlpha = 1 - t / 30; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }
  return { INTRO, update, draw, build, press, fromCine() { S.whiteIn = true; } };
})();
