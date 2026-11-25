// GLUP — el final. Una cinemática en planos, como la de entrada (bandas negras, fundidos, rótulos
// y música), que cuenta la vuelta a casa: la Garza huye cruzando la luna, amanece por primera vez
// en el pantano, las crías vuelven nadando y saltando, Nila rema de vuelta (la barca flota de
// verdad: cabeceo, estela, ondas del remo y reflejo), Ruca y los maestros la esperan en el muelle
// y al fin todos se duermen al sol. Luego los créditos: el reparto con retratos y trucos, el viaje
// (crías, trucos, tiempo), el cartel de gavilanbe y el FIN. Tocar pasa de plano, mantener acelera.
// Todo es función del tiempo, así que se puede capturar cualquier fotograma (tools/captura.sh final T).
'use strict';
const Final = (() => {
  const BAR = 18;
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const clamp01 = k => Math.max(0, Math.min(1, k));
  const lerp = (a, b, k) => a + (b - a) * k;
  const outBack = k => { if (k >= 1) return 1; const c = 1.8; k -= 1; return 1 + (c + 1) * k * k * k + c * k * k; };
  const R = v => Math.round(v);

  // ---------------------------------------------------------------- Lienzos
  const bufs = {};
  function buf(name, w = W, h = H) {
    let b = bufs[name]; if (!b) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; b = bufs[name] = { c, g }; }
    b.g.setTransform(1, 0, 0, 1, 0, 0); b.g.globalAlpha = 1; return b;
  }
  // Draw `fn` off screen, then show the rectangle around (cx, cy) at full size: a camera zoom.
  function zoomed(g, zoom, cx, cy, fn) {
    const b = buf('zoom'); fn(b.g); b.g.setTransform(1, 0, 0, 1, 0, 0); b.g.globalAlpha = 1;
    const w = W / zoom, h = H / zoom, x = Math.max(0, Math.min(W - w, cx - w / 2)), y = Math.max(0, Math.min(H - h, cy - h / 2));
    g.drawImage(b.c, x, y, w, h, 0, 0, W, H);
  }

  // ---------------------------------------------------------------- El amanecer
  // The first sunrise of the game: a sky that goes from lilac to peach, hills and trees lit from behind,
  // and water that takes the colour of the sky. Registered as one more theme of the world's backgrounds.
  let themed = false;
  function themes() {
    if (themed) return; themed = true;
    MUNDO.BG.dawn = { sky: ['#2e3a6c', '#3e4a80', '#56608e', '#786c98', '#a07896', '#c8868e', '#e49c88', '#f2b486', '#f8cc98', '#fce2b4'], stars: .15,
      cloud: { top: '#6c6a9c', mid: '#b28298', lit: '#ffd4a0', below: true },
      hills: ['#b88a96', '#9a7288'], far: '#7e5e84', farRim: '#f2ba96', mist: '#f4d0b8', water: '#ffe0a8',
      mid: '#3e2e4c', midRim: '#e49c7c', moss: '#6e566c', reeds: '#241a2a', reedRim: '#c07a5e', head: '#3a2222' };
    MUNDO.AGUA.dawn = { body: ['#16263a', '#1c3246', '#243e52', '#2e4c5c', '#3a5c66', '#4a6e70', '#5e8278'], line: '#ffd8a8', foam: '#fff4e0', glint: '#fff0c0' };
  }
  const WATER = { tint: '#26405a', shine: '#ffe6b8', far: '#ffd6a0' };

  // The sun: a pale core, a warm rim and a halo in dithered steps, with slow rays turning around it.
  function sun(g, x, y, t, a = 1) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    for (const [r, al] of [[46, .06], [34, .08], [24, .12], [17, .18]]) { g.globalAlpha = a * al; g.fillStyle = '#ffe2a0'; g.beginPath(); g.arc(x, y, Math.max(.5, r), 0, 7); g.fill(); }
    g.globalAlpha = a * .22; g.fillStyle = '#fff2c8';
    for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2 + t / 400, len = 30 + (i % 3) * 10 + Math.sin(t / 30 + i) * 4; for (let d = 14; d < len; d += 2) g.fillRect(R(x + Math.cos(an) * d), R(y + Math.sin(an) * d), 1, 1); }
    g.globalAlpha = a; const r = 10;
    for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); g.fillStyle = Math.abs(dy) > r - 3 || hw < 4 ? '#ffd27a' : '#ffe9a8'; g.fillRect(R(x) - hw, R(y) + dy, hw * 2 + 1, 1); }
    g.fillStyle = '#fffbe8'; for (let dy = -6; dy <= 4; dy++) { const hw = Math.round(Math.sqrt(36 - dy * dy) * .8); g.fillRect(R(x) - hw - 1, R(y) + dy - 1, hw * 2, 1); }
    g.restore();
  }
  // The land above the water: the night and the dawn backgrounds mixed by `day`, the sun in between.
  function land(g, t, o) {
    themes();
    const day = o.day === undefined ? 1 : o.day, cx = o.camX || 0, cy = o.camY === undefined ? 44 : o.camY;
    if (day < 1) MUNDO.drawBackground(g, cx, cy, ART.background('night'), t, W, H, null);
    if (day > 0) {
      const b = day < 1 ? buf('day') : { g, c: null };
      MUNDO.drawBackground(b.g, cx, cy, ART.background('dawn'), t, W, H, gg => { if (o.sunY !== undefined) sun(gg, o.sunX, o.sunY, t); });
      if (b.c) { g.globalAlpha = day; g.drawImage(b.c, 0, 0); g.globalAlpha = 1; }
    }
  }
  // Open water from `hz` down: the picture above it (in `src`) mirrored with a ripple, tinted with depth,
  // with streaks of light drifting on it and the sun's glitter.
  function lake(g, src, hz, t, o = {}) {
    const x0 = o.x0 || 0, x1 = o.x1 === undefined ? W : o.x1, wd = x1 - x0, depth = H - hz, cam = o.camX || 0;
    if (wd <= 0) return;
    g.fillStyle = '#1c3246'; g.fillRect(x0, hz, wd, depth);
    for (let y = hz; y < H; y++) {
      const d = y - hz, sy = Math.max(0, hz - 1 - Math.floor(d * 1.05)), dx = R(Math.sin(d * .55 - t * .07) * Math.min(2.5, .4 + d * .05));
      g.drawImage(src, x0, sy, wd, 1, x0 + dx, y, wd, 1);
    }
    g.fillStyle = o.tint || WATER.tint;
    for (let y = hz; y < H; y++) { const d = (y - hz) / depth; g.globalAlpha = .22 + d * .5; g.fillRect(x0, y, wd, 1); } g.globalAlpha = 1;
    // The far shore: a line of light where the water meets the land.
    g.fillStyle = o.far || WATER.far; for (let x = x0; x < x1; x++) if (hash((x + R(cam * .3)) * .37) < .7) { g.globalAlpha = .55; g.fillRect(x, hz, 1, 1); } g.globalAlpha = 1;
    // Streaks of light, longer and slower close up.
    for (let i = 0; i < 46; i++) {
      const d = Math.pow(hash(i + 3), 1.6), y = R(hz + 2 + d * (depth - 4)), len = R(2 + d * 12 + hash(i + 5) * 6), sp = .05 + d * .25, span = wd + 80;
      const x = x0 - 40 + (((hash(i) * span - t * sp - cam * (.3 + d * .7)) % span) + span) % span, a = Math.sin(t / (30 + hash(i + 9) * 40) + i * 2);
      if (a < 0) continue; g.globalAlpha = a * (.25 + (1 - d) * .35); g.fillStyle = hash(i + 7) < .4 ? '#ffffff' : (o.shine || WATER.shine); g.fillRect(R(x), y, len, 1);
    }
    g.globalAlpha = 1;
    // The sun's road on the water.
    if (o.sunX !== undefined) for (let i = 0; i < 16; i++) {
      const y = hz + 2 + i * 3 + (i > 8 ? i - 8 : 0); if (y >= H) break;
      const f = hash(i * 13 + (t >> 3)), w = R((4 + i * 1.6) * (.5 + f * .7)), off = R(Math.sin(t / 17 + i * 1.7) * (2 + i * .4));
      g.globalAlpha = .45 + f * .45; g.fillStyle = f > .6 ? '#ffffff' : '#fff0b8'; g.fillRect(R(o.sunX - w / 2) + off, y, w, 1);
    }
    g.globalAlpha = 1;
  }
  // A wide view over the water: land above `hz`, the lake below.
  function vista(g, t, o) {
    const b = buf('land'); land(b.g, t, o);
    g.drawImage(b.c, 0, 0, W, o.hz, 0, 0, W, o.hz);
    lake(g, b.c, o.hz, t, { sunX: o.day === undefined || o.day > .3 ? o.sunX : undefined, camX: o.camX });
    return b.c;
  }

  // ---------------------------------------------------------------- Piezas
  // La Garza: the same living puppet as in the fight (garza.js), placed where the old sprite's top left was.
  function heron(g, t, x, y, left, scale = 1, wing, tint) {
    const wf = wing === undefined ? undefined : [-1, 0, 1, 0][wing % 4];
    Boss.figura(g, { x: x + 16 * scale, y: y + 11 * scale, t, dir: left ? -1 : 1, scale, tint, wing: wf, state: 'return' });
  }

  let moonBig = null;
  function bigMoon() {
    if (moonBig) return moonBig;
    const r = 30, c = document.createElement('canvas'); c.width = c.height = r * 2 + 2; const g = c.getContext('2d');
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y); if (d > r) continue;
      let col = d > r - 1 ? '#e8c98a' : (x + 6) * (x + 6) + (y - 4) * (y - 4) < (r - 4) * (r - 4) ? '#fffbe8' : '#fff1c4';
      for (const [cx, cy, cr] of [[-8, -6, 6], [9, 4, 4], [-2, 12, 5], [12, -10, 3], [-14, 8, 3]]) if ((x - cx) ** 2 + (y - cy) ** 2 < cr * cr) col = (x - cx) + (y - cy) > 0 ? '#f0dca6' : '#e6cf96';
      g.fillStyle = col; g.fillRect(x + r + 1, y + r + 1, 1, 1);
    }
    moonBig = c; return c;
  }
  // A spray of drops that depends only on the time since `t0`, so any frame can be drawn on its own.
  function burst(g, x, y, t0, t, n, seed, cols, spd, grav = .12) {
    const k = t - t0; if (k < 0 || k > 60) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (hash(seed + i) - .5) * 1.8, v = spd * (.35 + hash(seed + i * 3) * .9), life = 16 + hash(seed + i * 7) * 26;
      if (k > life) continue;
      g.fillStyle = cols[i % cols.length]; g.fillRect(R(x + Math.cos(a) * v * k), R(y + Math.sin(a) * v * k + grav * k * k / 2), 1, hash(seed + i * 5) < .3 ? 2 : 1);
    }
  }
  // A flat ring on the water, drawn in dots.
  function ring(g, x, y, r, a, col = '#fff4e0') {
    if (a <= 0 || r <= 0) return; g.globalAlpha = Math.min(1, a); g.fillStyle = col;
    const n = Math.max(8, R(r * 2.4)); for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; if (Math.sin(an) < -.2) continue; g.fillRect(R(x + Math.cos(an) * r), R(y + Math.sin(an) * r * .28), 1, 1); }
    g.globalAlpha = 1;
  }
  function fireflies(g, t, a, n = 26, top = 30, bot = 140) {
    if (a <= 0) return;
    for (let i = 0; i < n; i++) {
      const x = (hash(i + 20) * 360 + Math.sin(t / (40 + i) + i) * 20 + t * .1) % 360 - 20, y = top + hash(i + 21) * (bot - top) + Math.sin(t / (30 + i * 2) + i) * 8 - t * .03 * hash(i + 22);
      const glow = Math.max(0, Math.sin(t / 12 + i * 1.7)) * a; if (glow < .05) continue;
      g.globalAlpha = glow * .3; g.fillStyle = '#f2f5a0'; g.fillRect(R(x) - 1, R(y) - 1, 3, 3); g.globalAlpha = glow; g.fillStyle = '#ffffe0'; g.fillRect(R(x), R(y), 1, 1);
    }
    g.globalAlpha = 1;
  }
  // A small bird: two wings that flap as a little "v".
  function bird(g, x, y, t, i, col = '#3a2a3a') {
    const f = ((t >> 3) + i) % 4, x0 = R(x), y0 = R(y); g.fillStyle = col;
    if (f === 0) { g.fillRect(x0 - 3, y0 - 2, 1, 1); g.fillRect(x0 - 2, y0 - 1, 2, 1); g.fillRect(x0 + 1, y0 - 1, 2, 1); g.fillRect(x0 + 3, y0 - 2, 1, 1); }
    else if (f === 2) { g.fillRect(x0 - 3, y0 + 1, 1, 1); g.fillRect(x0 - 2, y0, 2, 1); g.fillRect(x0 + 1, y0, 2, 1); g.fillRect(x0 + 3, y0 + 1, 1, 1); }
    else g.fillRect(x0 - 3, y0, 7, 1);
    g.fillRect(x0, y0, 1, 1);
  }
  // Foreground reeds swaying at the edges of the frame, out of focus and dark.
  function reeds(g, t, list, col = '#140e1a') {
    for (const [x, h, bend, ph] of list) {
      g.fillStyle = col; const sw = Math.sin(t / 50 + ph) * 3;
      for (let k = 0; k < h; k++) { const u = k / h, sx = x + u * u * (bend + sw); g.fillRect(R(sx), H - k, u < .7 ? 3 : 2, 1); }
      const hx = R(x + bend + sw), hy = H - h; g.fillRect(hx - 2, hy - 16, 6, 16); g.fillRect(hx - 1, hy - 18, 4, 2); g.fillRect(hx, hy - 24, 1, 6);
      g.fillStyle = '#2c1e26'; g.fillRect(hx - 1, hy - 15, 1, 13);
    }
  }
  // Crías with a dark outline, so they read against the sky when they leap.
  const outl = new Map();
  function outlined(sp) {
    let c = outl.get(sp); if (c) return c;
    c = document.createElement('canvas'); c.width = sp.width + 2; c.height = sp.height + 2; const g = c.getContext('2d'), d = ART.tint(sp, '#1d1826');
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(d, dx, dy); g.drawImage(sp, 1, 1); outl.set(sp, c); return c;
  }
  const crSpr = i => outlined(ART.criaFree[i % 2]);
  // A cría with just its head out of the water, bobbing, with a ring around it.
  function peek(g, x, sy, t, i) {
    const k = (t + i * 37) % 240; if (k > 200) return;
    const up = Math.min(1, k / 12, (200 - k) / 12), bob = R(Math.sin(t / 14 + i) * .6), sp = crSpr(i), y = R(sy + 2 - up * 5) + bob;
    g.save(); g.beginPath(); g.rect(x - 8, sy - 12, 16, 13); g.clip(); g.translate(R(x), 0); if (i % 3 === 0) g.scale(-1, 1); g.drawImage(sp, -5, y); g.restore();
    ring(g, x, sy + 1, 3 + ((t + i * 9) % 50) * .12, .6 - ((t + i * 9) % 50) / 90);
  }
  function cria(g, x, y, a, flip, t, i, s = 1) { const sp = crSpr((t >> 3) + i); g.save(); g.translate(R(x), R(y)); g.rotate(a); g.scale(flip ? -s : s, s); g.drawImage(sp, -sp.width / 2, -sp.height / 2); g.restore(); }
  // A cría that swims just under the surface and now and then leaps in an arc, with a splash and a ring at each end.
  function leaper(g, t, i, x, sy, o = {}) {
    const P = (o.period || 120) + R(hash(i + 40) * 70), L = o.leap || 34, ph = R(hash(i + 41) * P), k = (t + ph) % P, dir = o.dir || 1, hgt = (o.h || 16) + hash(i + 42) * 10;
    const t0 = t - k, s = o.s || 1;
    if (k < L) {
      const u = k / L, lx = x + dir * (u - .5) * 22 * s, ly = sy - Math.sin(u * Math.PI) * hgt * s;
      cria(g, lx, ly, Math.atan2(-Math.cos(u * Math.PI) * hgt, 22 * dir) * .9 * dir, dir < 0, t, i, s);
      if (u > .3 && u < .7 && o.sparkle !== false) { g.fillStyle = '#fffbe0'; g.fillRect(R(lx) - 5 * dir, R(ly) - 1, 1, 1); }
    } else if (!o.hide) {
      // Under the surface: a dark back and a little wake.
      const bx = R(x + Math.sin((t + i * 30) / 40) * 6), sw = (t + i * 7) % 30 < 20;
      g.fillStyle = '#2a3a3a'; g.fillRect(bx - 2, sy + 1, 4, 1); if (sw) g.fillRect(bx - 1, sy, 2, 1);
      g.globalAlpha = .5; g.fillStyle = '#fff4e0'; g.fillRect(bx - 5 * dir, sy, 2, 1); g.globalAlpha = 1;
    }
    const x0 = x - dir * 11 * s, xe = x + dir * 11 * s;
    burst(g, x0, sy, t0, t, 8, i * 17 + t0, ['#fff4e0', '#c8f2ea', '#ffffff'], 1.1 * s);
    burst(g, xe, sy, t0 + L, t, 10, i * 19 + t0, ['#fff4e0', '#c8f2ea', '#ffffff'], 1.3 * s);
    const r0 = t - t0, r1 = t - t0 - L; if (r0 >= 0 && r0 < 30) ring(g, x0, sy + 1, 1 + r0 * .4, 1 - r0 / 30); if (r1 >= 0 && r1 < 36) ring(g, xe, sy + 1, 1 + r1 * .45, 1 - r1 / 36);
  }

  // ---------------------------------------------------------------- La barca
  // The boat, Nila and the oar drawn together in a small canvas: the same picture is used for the boat
  // and, flipped and rippled, for its reflection. Surface `sy` crosses the hull two rows over the keel.
  const BW = 64, BH = 56, BX = 16, BY = 38;
  function boatPic(t, o) {
    const b = buf('boat', BW, BH), g = b.g; g.clearRect(0, 0, BW, BH);
    const S = Barca.sprite(), N = ART.nila, nx = BX + 11, ny = BY - 9, look = Object.assign({ mood: o.mood || 'happy', lx: 1 }, o.look || {});
    g.drawImage(S, 0, 0, 32, 7, BX, BY, 32, 7);   // lantern, flag and the back of the gunwale behind her
    if (o.nila !== false) { Player.carryLook = look; Player.drawCarry(g, nx, ny, o.spr || N.idle[(t % 190) < 6 ? 1 : 0], o.fish || ART.fish.closed, o.row ? (t >> 4) % 2 : 0); Player.carryLook = null; }
    g.drawImage(S, 0, 6, 32, 6, BX, BY + 6, 32, 6);   // the hull in front of her boots
    if (o.nila !== false && o.row) o.blade = Barca.oar(g, nx + 10, ny + 12, t, 1, o.speed || 1);   // the oar on the near side, over the gunwale
    return b.c;
  }
  // Everything the boat does on the water; x is the boat's left edge on screen.
  function boatOn(g, x, sy, t, o = {}) {
    const bob = Math.sin(t / 22) * 1.2 + (o.bump ? o.bump : 0), by = R(sy - 10 + bob), pic = boatPic(t, o), px = R(x) - BX, py = by - BY, tint = o.tint || WATER.tint;
    // The reflection: every row above the surface, mirrored below it and rippled.
    g.globalAlpha = .32;
    for (let ly = 0; ly < BH; ly++) { const yy = py + ly; if (yy >= sy) break; const ry = 2 * sy - yy + 1, d = ry - sy; if (ry >= H) continue; const dx = R(Math.sin(d * .7 - t * .1) * Math.min(2, d * .15)); g.drawImage(pic, 0, ly, BW, 1, px + dx, ry, BW, 1); }
    g.globalAlpha = 1;
    // The wake: foam streaks trailing off the stern, fanning out and fading.
    if (o.moving) for (let d = 2; d < 70; d += 2) {
      const f = 1 - d / 70, spread = d * .09, wob = Math.sin(d * .4 - t * .25) * .8;
      g.globalAlpha = f * .75; g.fillStyle = d % 6 === 0 ? '#ffffff' : '#fff0d8';
      g.fillRect(R(x - d + wob), R(sy + spread), d < 12 ? 2 : 1, 1); if (d > 6) g.fillRect(R(x - d - wob), R(sy - spread * .35), 1, 1);
    }
    g.globalAlpha = 1;
    // Ripples left by the oar strokes: one ring for each of the last strokes, where the blade went in.
    if (o.row && o.moving) {
      const sp = .22 * (o.speed || 1), per = Math.PI * 2 / sp;
      for (let n = 0; n < 4; n++) { const age = ((t % per) + n * per); if (age > 90) continue; const bx = x + 21 - 10 - (o.vx || 0) * age - age * .05; ring(g, bx, sy + 1, 2 + age * .35, (1 - age / 90) * .9); }
    }
    // Under the surface the hull (and the blade) are seen through the water: tint only what is drawn there.
    const pg = buf('boat', BW, BH).g; pg.globalCompositeOperation = 'source-atop'; pg.globalAlpha = .55; pg.fillStyle = tint; pg.fillRect(0, sy + 1 - py, BW, BH); pg.globalAlpha = 1; pg.globalCompositeOperation = 'source-over';
    g.drawImage(pic, px, py);
    // The waterline: a bright seam hugging the hull, and foam curling at the bow.
    g.fillStyle = '#fff4e0'; for (let xx = 2; xx < 31; xx++) if ((xx + (t >> 2)) % 5) g.fillRect(R(x) + xx, sy, 1, 1);
    g.fillStyle = '#ffffff'; const f = (t >> 2) % 3; g.fillRect(R(x) + 30 + f, sy - 1, 1, 1); g.fillRect(R(x) + 31, sy, 2 + f, 1); g.fillRect(R(x) - 1 - f, sy, 2, 1);
    // Drips off the blade as it comes out of the water.
    if (o.row && o.blade) { const u = (t * .22 * (o.speed || 1)) % (Math.PI * 2); if (u > 2.2 && u < 3.6) { g.fillStyle = '#e8fbff'; for (let i = 0; i < 3; i++) g.fillRect(R(px + o.blade.x) - 1 + i, R(py + o.blade.y) + ((t + i * 3) % 6), 1, 1); } }
    return { by, nx: R(x) + 11, ny: by - 9 };
  }

  // ---------------------------------------------------------------- El muelle
  // The jetty of the first level: water on the left, the bank on the right with the teachers.
  const JET = { sy: 131, x0: 256, x1: 352 };
  const DOCK = (() => { const r = []; for (let y = 0; y < 12; y++) r.push(y < 8 ? '.'.repeat(32) : '~'.repeat(22) + '#'.repeat(10)); return r; })();
  // Who stands where: x on the jetty or the bank, feet on the boards.
  const CAST = [['ruca', 300], ['lumi', 328], ['lapa', 368], ['olga', 390], ['anselmo', 412], ['canto', 434], ['pinzas', 456], ['alga', 480]];
  function teacherSprite(id, t, talking, seed, sleep) {
    if (typeof Maestros === 'undefined' || !Maestros.QUIEN || !Maestros.QUIEN[id] || !Maestros.frame) return null;
    try { return Maestros.frame(Maestros.QUIEN[id], t, talking, seed, sleep); } catch (e) { return null; }
  }
  function teacher(g, id, x, y, t, o = {}) {
    const f = teacherSprite(id, t, o.talk, o.seed || 0, o.sleep); if (!f) return;
    const img = o.left ? ART.flip(f) : f, fl = id === 'lumi' ? R(Math.sin(t / 20) * 2) - 6 : 0, hop = o.hop || 0;
    if (id === 'lumi') { g.globalAlpha = .22 + Math.sin(t / 9) * .06; g.fillStyle = '#ffe36a'; g.beginPath(); g.arc(R(x), R(y - f.height / 2 + fl - hop), 11, 0, 7); g.fill(); g.globalAlpha = 1; }
    else { g.fillStyle = 'rgba(8,6,14,.3)'; g.fillRect(R(x - f.width / 2) + 2, R(y) - 1, f.width - 4, 2); }
    if (o.sleep) { g.save(); g.translate(R(x), R(y)); g.scale(1 + Math.sin(t / 40) * .02, 1 - Math.sin(t / 40) * .02); g.drawImage(img, -R(f.width / 2), -f.height + fl); g.restore(); }
    else g.drawImage(img, R(x - f.width / 2), R(y - f.height + fl - hop));
  }
  function dockScene(g, t, cam, o = {}) {
    themes();
    const S = MUNDO.tiles('dawn'), T = MUNDO.sceneTerrain('final-muelle', DOCK, 'dawn'), b = buf('land'), sy = JET.sy;
    land(b.g, t, { camX: cam * .6 + 200, camY: 44, day: 1, sunX: o.sunX === undefined ? 120 : o.sunX, sunY: o.sunY === undefined ? 70 : o.sunY });
    // The terrain, the jetty and the people on it go into the picture the water mirrors.
    b.g.save(); b.g.translate(-R(cam), 0);
    T.chunks.forEach((c, i) => b.g.drawImage(c, i * 256, 0));
    for (let x = JET.x0; x < JET.x1; x += 16) b.g.drawImage(x === JET.x0 ? S.planks.left : S.planks.mid[(x >> 4) & 1], x, 128);
    for (const x of [JET.x0 + 2, JET.x0 + 50]) b.g.drawImage(S.post, x, 132);
    b.g.drawImage(S.reed, 470, 113); b.g.drawImage(S.reed, 484, 115); b.g.drawImage(S.tuft, 432, 121); b.g.drawImage(S.shroom, 506, 122);
    b.g.drawImage(ART.lantern.on, 356, 110);
    if (o.people) o.people(b.g);
    b.g.restore();
    g.drawImage(b.c, 0, 0, W, sy, 0, 0, W, sy);
    lake(g, b.c, sy, t, { camX: cam });
    // The posts go down into the water and show through it; foam laps at the foot of the bank.
    g.save(); g.translate(-R(cam), 0);
    g.fillStyle = '#fff4e0'; for (let i = 0; i < 7; i++) { const fx = JET.x1 - 1 - ((i * 5 + (t >> 3)) % 9), fy = sy + (i % 3); g.globalAlpha = .8 - i * .1; g.fillRect(fx, fy, i < 3 ? 2 : 1, 1); } g.globalAlpha = 1;
    for (const x of [JET.x0 + 2, JET.x0 + 50]) { g.drawImage(S.post, x, 132); g.globalAlpha = .5; g.fillStyle = WATER.tint; g.fillRect(x, sy + 1, S.post.width, H - sy); g.globalAlpha = 1; }
    const lil = S.lilies; if (lil) { g.drawImage(lil[0], 40, sy - 1); g.drawImage(lil[1], 118, sy); g.drawImage(lil[2], 168, sy - 1); if (S.lotus) g.drawImage(S.lotus, 120, sy - 7); }
    g.restore();
    // Lantern glow.
    g.globalAlpha = .12 + Math.sin(t / 9) * .03; g.fillStyle = '#ffcf5a'; g.beginPath(); g.arc(R(361 - cam), 115, 18, 0, 7); g.fill(); g.globalAlpha = 1;
  }
  // Nila standing on land (feet at y), Bigotes in her arms.
  function nilaAt(g, x, y, t, o = {}) {
    const N = ART.nila, spr = o.spr || N.idle[(t % 200) < 6 ? 1 : 0];
    g.save(); if (o.sx || o.rot) { g.translate(R(x) + 5, R(y)); if (o.rot) g.rotate(o.rot); g.scale(o.sx || 1, o.sy || 1); g.translate(-R(x) - 5, -R(y)); }
    Player.carryLook = Object.assign({ mood: o.mood || null }, o.look || {}); Player.drawCarry(g, R(x), R(y) - 18, spr, o.fish || ART.fish.closed, o.bob || 0); Player.carryLook = null;
    g.restore();
  }
  // Lily pads and a lotus floating by at different distances, to feel the boat moving.
  function drift(g, t, cam, rows) {
    const S = MUNDO.tiles('dawn'), lil = S.lilies; if (!lil) return;
    rows.forEach(([y, k], j) => { for (let i = 0; i < 3; i++) { const span = 420, x = ((hash(j * 7 + i) * span - cam * k) % span + span) % span - 50, sp = lil[(i + j) % lil.length]; g.drawImage(sp, R(x), y - (sp.height >> 1) + R(Math.sin(t / 30 + i + j) * .5)); if ((i + j) % 3 === 0 && S.lotus) g.drawImage(S.lotus, R(x) + 2, y - (sp.height >> 1) - 6); } });
  }
  function petals(g, t, a = 1, n = 30) {
    const cols = ['#f8c8d8', '#fff4e0', '#ffd27a', '#f4a8b8', '#e8fbff'];
    for (let i = 0; i < n; i++) {
      const sp = .25 + hash(i + 70) * .35, y = ((hash(i + 71) * 220 + t * sp) % 220) - 20, x = (hash(i + 72) * 380 + Math.sin(t / 30 + i) * 12 - t * .15 * hash(i + 73)) % 380 - 30;
      g.globalAlpha = a; g.fillStyle = cols[i % cols.length]; const w = Math.abs(Math.sin(t / 10 + i)) > .5 ? 2 : 1; g.fillRect(R((x + 380) % 380 - 30), R(y), w, 3 - w);
    }
    g.globalAlpha = 1;
  }
  function zzz(g, x, y, t, rise = 30) {
    for (let i = 0; i < 3; i++) { const k = ((t + i * 50) % 150) / 150; g.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 1.6); ART.text(g, k > .45 ? 'Z' : 'z', R(x + k * 18 + Math.sin(k * 8 + i) * 2), R(y - k * rise), '#fff6d6', 'left', '#3a2a3a'); }
    g.globalAlpha = 1;
  }
  function bubble(g, x, y, text, a = 1) {
    if (a <= 0) return; const w = ART.textWidth(text) + 10, h = 13, bx = R(x - w / 2), by = R(y - h);
    g.globalAlpha = a; g.fillStyle = '#1a1420'; g.fillRect(bx - 1, by, w + 2, h); g.fillRect(bx, by - 1, w, h + 2);
    g.fillStyle = '#fff6e0'; g.fillRect(bx, by, w, h); g.fillStyle = '#e8d8b8'; g.fillRect(bx, by + h - 2, w, 2);
    g.fillStyle = '#1a1420'; g.fillRect(R(x) - 2, by + h + 1, 4, 1); g.fillRect(R(x) - 1, by + h + 2, 2, 1); g.fillStyle = '#fff6e0'; g.fillRect(R(x) - 1, by + h, 3, 1);
    ART.text(g, text, R(x), by + 3, '#3a2a30', 'center'); g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- Planos
  // Each shot: len (frames), fade in ('black' | 'white' | 0), music on entry, captions [[from, text, to]], draw and cue(a, b).
  const at = (a, b, k) => a < k && k <= b;
  const MOON = { x: 236, y: 52 };
  const SHOTS = [
    { len: 380, fadeIn: 'black', music: 'alba', amb: 'alba', caps: [[150, 'La Garza huyó muy lejos, a otro río.', 370]], draw(g, t) {
      // Night. The Heron leaves the dead cypress and crosses the moon, smaller and smaller, until she is gone.
      const bgN = ART.background('night'), push = t / 1100, camY = 30 + t * .03;
      MUNDO.drawBackground(g, 40 + t * .06, camY, bgN, t, W, H, gg => {
        const mz = 1.5 + push, m = bigMoon(); gg.save(); gg.translate(MOON.x, MOON.y); gg.scale(mz, mz);
        for (const [r, a] of [[52, .06], [42, .08], [36, .1]]) { gg.globalAlpha = a; gg.fillStyle = '#fff1c4'; gg.beginPath(); gg.arc(0, 0, r, 0, 7); gg.fill(); }
        gg.globalAlpha = 1; gg.drawImage(m, -m.width / 2, -m.height / 2); gg.restore();
      });
      // The Heron: a dark shape against the moon, her wings slower as she goes.
      const k = ease(clamp01((t - 20) / 320)), sc = lerp(1.8, .08, Math.pow(k, .55)), cx = lerp(20, MOON.x + 4, k), cy = lerp(118, MOON.y + 4, k) - Math.sin(k * Math.PI) * 30;
      if (k < 1) heron(g, t, cx - 18 * sc, cy - 8 * sc, false, sc, [0, 1, 2, 1][(t >> (k > .6 ? 4 : 3)) % 4], '#140a18');
      if (t > 330) { const u = (t - 330) / 50, s = R(Math.sin(u * Math.PI) * 3); g.fillStyle = '#fffbe8'; g.fillRect(MOON.x + 4 - s, MOON.y + 4, s * 2 + 1, 1); g.fillRect(MOON.x + 4, MOON.y + 4 - s, 1, s * 2 + 1); }
      // Two feathers see-sawing down in front of us.
      for (let i = 0; i < 2; i++) { const u = (t - 60 - i * 90) / 260; if (u < 0 || u > 1) continue; const x = 90 + i * 120 + Math.sin(u * 14 + i) * 14, y = 20 + u * 150, a = Math.sin(u * 14 + i) * .6; g.save(); g.translate(R(x), R(y)); g.rotate(a); g.fillStyle = '#e9eef2'; g.fillRect(-4, 0, 9, 2); g.fillStyle = '#a9b8c9'; g.fillRect(-4, 1, 9, 1); g.fillStyle = '#6a7890'; g.fillRect(-5, 1, 2, 1); g.restore(); }
      // The dead cypress, close and black, on the left.
      const snag = ART.background('nest').snag; if (snag) { const sx = -60 - t * .05; g.drawImage(ART.tint(snag, '#08060e'), R(sx), H - snag.height + 16); }
      reeds(g, t, [[292, 70, -8, 0], [304, 52, -4, 2], [12, 40, 6, 1]], '#08060e');
    }, cue(a, b) { if (at(a, b, 24)) Sound.play('swoop'); if (at(a, b, 120)) Sound.play('heron'); } },
    { len: 520, fadeIn: 'black', caps: [[210, 'Y entonces, por primera vez, amaneció en el pantano.', 500]], draw(g, t) {
      // Dawn: the night gives way, the sun comes up behind the far trees, fireflies go out and birds wake.
      const day = ease(clamp01((t - 30) / 320)), sunY = lerp(150, 88, ease(clamp01((t - 40) / 440)));
      const lift = lerp(26, 0, ease(clamp01(t / 380)));
      render(g, gg => vista(gg, t, { camX: 90 + t * .06, camY: 44, day, sunX: 168, sunY, hz: 134 }), -lift);
      g.save(); g.translate(0, -lift);
      fireflies(g, t, 1 - day * 1.2, 30, 60, 160);
      // Morning mist lying on the water, warming up.
      for (let i = 0; i < 9; i++) { const y = 128 + i * 3, x = ((hash(i) * 400 + t * (.1 + i * .02)) % 400) - 60; g.globalAlpha = day * .16; g.fillStyle = '#fff0e0'; g.fillRect(R(x), y, 60 + R(hash(i + 3) * 60), 2); g.fillRect(R(x) - 200, y, 50, 2); }
      g.globalAlpha = 1;
      if (t > 250) for (let i = 0; i < 6; i++) { const u = (t - 250 - i * 9) / 300; if (u < 0 || u > 1) continue; bird(g, -20 + u * 360 + (i % 2) * 8, 70 - u * 40 + [0, 5, -4, 9, -8, 12][i] + Math.sin(u * 10 + i), t, i, '#4a3040'); }
      g.restore();
      reeds(g, t, [[-6, 90, 10, 0], [10, 64, 6, 2], [296, 80, -10, 1], [312, 56, -6, 3]], day > .5 ? '#1a1220' : '#0a0810');
    }, cue(a, b) { if (at(a, b, 280) || at(a, b, 330) || at(a, b, 410)) Sound.play('chirp'); } },
    { len: 460, fadeIn: 'black', caps: [[40, 'Las crías volvieron nadando a casa...', 220], [240, '...y no paraban de saltar de alegría.', 450]], draw(g, t) {
      // At the waterline: the dawn above, the school below, and crías leaping from one to the other.
      const SY = 96, cam = 200 + t * .45;
      const b = buf('land'); land(b.g, t, { camX: cam, camY: 44, day: 1, sunX: 150, sunY: 76 }); g.drawImage(b.c, 0, 0, W, 134, 0, SY - 134, W, 134);
      underwater(g, t, SY, cam);
      for (let i = 0; i < 18; i++) { const x = ((hash(i + 5) * 420 + t * (.35 + hash(i + 6) * .25)) % 420) - 50, y = SY + 14 + hash(i + 7) * 52 + Math.sin(t / 26 + i) * 3; cria(g, x, y, Math.sin(t / 14 + i) * .12, false, t, i, 2); }
      // Surface from the side: a bright seam with a darker band under it.
      for (let x = 0; x < W; x++) { const y = SY + R(Math.sin((x + t * .8) / 9) * .8); g.fillStyle = '#fff4e0'; g.fillRect(x, y, 1, 1); g.fillStyle = '#8cc8b8'; g.fillRect(x, y + 1, 1, 1); }
      for (let i = 0; i < 7; i++) leaper(g, t, i, 30 + i * 44 + Math.sin(t / 60 + i) * 6, SY, { period: 90, h: 11, s: 2, leap: 40, hide: true });
    }, cue(a, b) { for (let i = 0; i < 7; i++) { const P = 90 + R(hash(i + 40) * 70), ph = R(hash(i + 41) * P); for (let k = a + 1; k <= b; k++) if ((k + ph) % P === 0 && i % 2 === 0) Sound.play('bloop', i); } } },
    { len: 600, fadeIn: 'black', caps: [[30, 'Nila remó de vuelta al embarcadero.', 250], [300, 'Bigotes no dejaba de sonreír.', 590]], draw(g, t) {
      // Rowing home: the swamp slides past, the boat rides the water, the crías follow in the wake.
      const z = lerp(1, 2.2, ease(clamp01((t - 250) / 300))), bx = 110 + t * .04, sy = 150, cam = 320 + t * .7;
      zoomed(g, z, bx + 18, sy - 18, b => {
        vista(b, t, { camX: cam, camY: 44, day: 1, sunX: 250, sunY: 64, hz: 126 });
        drift(b, t, cam, [[130, .5], [138, .7]]);
        for (let i = 0; i < 6; i++) leaper(b, t, i, bx - 18 - i * 16 + Math.sin(t / 30 + i) * 3, sy + (i % 2), { period: 110, h: 12, dir: 1 });
        const r = boatOn(b, bx, sy, t, { row: true, moving: true, speed: 1.1, vx: .7, mood: 'happy', look: { lx: t > 360 ? -1 : 1 }, fish: ART.fish.closed });
        drift(b, t, cam, [[161, 1.2], [173, 1.6]]);
        if (t > 380) { const k = t - 380; if (k < 90) { b.globalAlpha = Math.min(1, (90 - k) / 20); b.drawImage(ART.heart, r.nx + 12, r.ny - 4 - (k >> 3)); b.globalAlpha = 1; } }
        for (let i = 0; i < 3; i++) { const u = ((t + i * 200) % 600) / 600; bird(b, 330 - u * 380, 40 + i * 9 + Math.sin(u * 20) * 2, t, i, '#5a3a4a'); }
      });
      if (t < 300) reeds(g, t, [[330 - t * 1.6, 110, -8, 0], [520 - t * 1.6, 84, -6, 2], [140 - t * 1.6, 70, -4, 1]], '#150e18');
    }, cue(a, b) { const per = Math.PI * 2 / (.22 * 1.1); for (let k = a + 1; k <= b; k++) if (k % Math.round(per) === 5) Sound.play('step'); if (at(a, b, 380)) Sound.play('heart'); } },
    { len: 720, fadeIn: 'black', caps: [[20, 'En el muelle la esperaban Ruca y los maestros.', 250], [520, '"¡Bienvenida a casa, Nila!"', 710]], draw(g, t) {
      // The jetty: the teachers wait, the camera finds the boat, it bumps, Nila jumps and everyone cheers.
      const ARR = 440, JUMP = 470, LAND = 500, k1 = ease(clamp01((t - 150) / 110)), k2 = ease(clamp01((t - 260) / 200));
      const cam = t < 260 ? lerp(190, 0, k1) : lerp(0, 170, k2);
      const bx = t < ARR ? lerp(-60, JET.x0 - 30, 1 - Math.pow(1 - clamp01((t - 150) / (ARR - 150)), 2)) : JET.x0 - 30 - Math.min(3, (t - ARR) * .08);
      const bump = t >= ARR && t < ARR + 20 ? Math.sin((t - ARR) / 2) * (1 - (t - ARR) / 20) * 1.5 : 0, cheer = t > LAND;
      dockScene(g, t, cam, { people: pg => {
        for (const [id, x] of CAST) {
          const hop = cheer ? Math.max(0, Math.sin((t + x) / 7)) * (id === 'lapa' ? 1 : 4) : 0, talk = id === 'ruca' && t > 520 && t < 640;
          teacher(pg, id, x, JET.sy - 3, t, { left: true, hop, talk, seed: x });
        }
        if (t >= LAND) { const d = t - LAND, sq = d < 14 ? Math.exp(-d / 4) * Math.cos(d / 1.8) : 0; nilaAt(pg, JET.x0 + 16, JET.sy - 3, t, { sx: 1 + sq * .25, sy: 1 - sq * .25, mood: 'happy', spr: d > 30 && (d >> 4) % 2 ? ART.nila.win : ART.nila.idle[0], fish: d > 30 && (d % 64) < 20 ? ART.fish.open : ART.fish.closed }); }
      } });
      g.save(); g.translate(-R(cam), 0);
      for (let i = 0; i < 5; i++) leaper(g, t, i + 20, (t < ARR ? bx : JET.x0 - 30) - 20 - i * 17, JET.sy + 3 + (i % 2) * 2, { period: cheer ? 60 : 120, h: cheer ? 18 : 10 });
      boatOn(g, bx, JET.sy + 4, t, { row: t < ARR - 20, moving: t < ARR, speed: 1.2, vx: .5, bump, nila: t < JUMP, mood: t > ARR - 10 ? 'shock' : 'happy', look: { lx: 1 } });
      if (t >= JUMP && t < LAND) { const k = (t - JUMP) / (LAND - JUMP), x0 = bx + 11, y0 = JET.sy + 4 - 9 + 12, x = lerp(x0, JET.x0 + 16, k), y = lerp(y0, JET.sy - 3, k) - Math.sin(k * Math.PI) * 30; nilaAt(g, x, y, t, { spr: k < .5 ? ART.nila.jump : ART.nila.fall, fish: ART.fish.open, mood: 'happy', rot: Math.sin(k * Math.PI) * .15 }); }
      if (cheer) { const d = t - LAND; if (d < 100) { g.globalAlpha = Math.min(1, (100 - d) / 20); g.drawImage(ART.heart, JET.x0 + 14, JET.sy - 40 - (d >> 3)); g.globalAlpha = 1; } }
      if (t > 520 && t < 700) bubble(g, 308, JET.sy - 22, '¡Bienvenida!', Math.min(1, (t - 520) / 10, (700 - t) / 10));
      g.restore();
      if (cheer) petals(g, t - LAND, Math.min(1, (t - LAND) / 30), 40);
    }, cue(a, b) { if (at(a, b, 440)) { Sound.play('thud'); } if (at(a, b, 470)) Sound.play('jump'); if (at(a, b, 500)) { Sound.play('land', .8); Sound.play('fanfare'); } if (at(a, b, 522)) Sound.play('heart'); } },
    { len: 720, fadeIn: 'white', caps: [[400, 'Y por fin, todo el pantano pudo descansar.', 700]], draw(g, t) {
      // The last picture: asleep in the sun at the end of the jetty, the crías keeping watch in the water.
      const z = lerp(2.1, 1, ease(clamp01((t - 60) / 440))), cam = 170, nx = JET.x0 + 10, fy = JET.sy - 3;
      zoomed(g, z, nx - cam + 14, fy - 12, b => {
        dockScene(b, t + 900, cam, { sunX: 120, sunY: 46, people: pg => {
          for (const [id, x] of CAST) if (id !== 'ruca') teacher(pg, id, x, fy, t, { left: true, sleep: id !== 'olga' && id !== 'anselmo', seed: x });
          teacher(pg, 'ruca', nx + 30, fy, t, { left: true, sleep: true });
          Player.carryLook = { mood: 'sleep' }; Player.drawCarry(pg, nx, fy - 18 + 1, ART.nila.tuck, ART.fish.closed, 0); Player.carryLook = null;
        } });
        b.save(); b.translate(-cam, 0);
        zzz(b, nx + 8, fy - 22, t); zzz(b, nx + 36, fy - 12, t + 70);
        boatOn(b, JET.x0 - 36, JET.sy + 4, t, { nila: false });
        // The crías peek out of the water in a row, watching them sleep; now and then one leaps.
        for (let i = 0; i < 7; i++) peek(b, JET.x0 - 52 - i * 13 - (i > 3 ? 40 : 0), JET.sy + 1, t, i);
        leaper(b, t, 40, JET.x0 - 150, JET.sy + 2, { period: 170, h: 14 });
        leaper(b, t + 60, 41, JET.x0 - 100, JET.sy + 2, { period: 190, h: 10, dir: -1 });
        // A dragonfly hovering over the water.
        const dx = JET.x0 - 70 + Math.sin(t / 50) * 40, dy = JET.sy - 30 + Math.sin(t / 23) * 6; b.fillStyle = '#3a8ab0'; b.fillRect(R(dx), R(dy), 6, 1); b.fillStyle = (t >> 1) % 2 ? '#e8fbff' : '#a8d8f0'; b.fillRect(R(dx) + 1, R(dy) - 1, 2, 1); b.fillRect(R(dx) + 1, R(dy) + 1, 2, 1);
        b.restore();
        petals(b, t, .7, 16);
      });
      // Close on them with a circle, like the end of a cartoon.
      if (t > 610) { const k = ease((t - 610) / 90), r = lerp(240, 0, k); g.fillStyle = '#05050b'; g.beginPath(); g.rect(0, 0, W, H); g.arc(nx - cam + 12, fy - 10, Math.max(.5, r), 0, Math.PI * 2, true); g.fill(); }
    }, cue(a, b) { if (at(a, b, 150) || at(a, b, 420)) Sound.play('chirp'); } }];
  // Draw into a buffer and paste it shifted (a camera tilt).
  function render(g, fn, dy = 0) { const b = buf('tilt'); fn(b.g); b.g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(b.c, 0, R(dy)); if (dy < 0) { g.drawImage(b.c, 0, H - 1, W, 1, 0, H + R(dy) - 1, W, -R(dy) + 1); } }
  // Under the water at dawn: warm rays, silt, reeds and the muddy bottom.
  let uwBg = null;
  function underwater(g, t, sy, cam) {
    if (!uwBg) {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const bg = c.getContext('2d');
      const cols = ['#5e9a86', '#4a8a7a', '#3a7670', '#2d6264', '#234e58', '#1b3c4a', '#152c3c', '#10202e'];
      for (let y = 0; y < H; y++) { const f = y / H * (cols.length - 1), i = Math.min(cols.length - 2, f | 0), fr = f - i; for (let x = 0; x < W; x++) { bg.fillStyle = (fr > .5 && ((x ^ y) & 1)) || fr > .85 ? cols[i + 1] : cols[i]; bg.fillRect(x, y, 1, 1); } }
      for (let x = 0; x < W; x++) { const h = 12 + Math.sin(x / 23) * 4 + Math.sin(x / 7) * 1.5; bg.fillStyle = '#0c1418'; bg.fillRect(x, H - h, 1, h); bg.fillStyle = '#1e3030'; bg.fillRect(x, H - h, 1, 1); }
      uwBg = c;
    }
    g.drawImage(uwBg, 0, 0, W, H - sy, 0, sy, W, H - sy);
    for (let i = 0; i < 6; i++) { const x = 20 + i * 60 + Math.sin(t / 60 + i) * 10 - (cam * .3) % 60, a = .08 + Math.sin(t / 30 + i * 2) * .03; g.globalAlpha = Math.max(0, a); g.fillStyle = '#ffe6a0'; g.beginPath(); g.moveTo(x, sy); g.lineTo(x + 14, sy); g.lineTo(x + 60, H); g.lineTo(x + 34, H); g.fill(); } g.globalAlpha = 1;
    for (let i = 0; i < 20; i++) { const bx = ((hash(i + 7) * 420 - cam * .8) % 420 + 420) % 420 - 50, h = 20 + hash(i + 8) * 40; g.fillStyle = i % 3 ? '#1c3a30' : '#285040'; for (let k = 0; k < h; k++) { const sx = bx + Math.sin(t / 40 + i + k / 14) * k / 12; g.fillRect(R(sx), H - 8 - k, k < h * .7 ? 2 : 1, 1); } }
    for (let i = 0; i < 40; i++) { const x = (hash(i) * W + t * (.1 + hash(i + 1) * .2)) % W, y = sy + 6 + (hash(i + 2) * (H - sy - 12) + Math.sin(t / 50 + i) * 4); g.fillStyle = hash(i + 3) < .5 ? '#cfe8c8' : '#fff4d0'; g.globalAlpha = .3 + hash(i + 4) * .4; g.fillRect(x | 0, y | 0, 1, 1); } g.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const period = 120 + hash(i) * 100, k = ((t + hash(i + 5) * period) % period) / period, x = hash(i + 6) * W + Math.sin(k * 20 + i) * 2, y = H - 10 - k * (H - sy - 14); g.fillStyle = '#e8fbff'; g.globalAlpha = .7; g.fillRect(R(x), R(y), 1, 1); if (i % 3 === 0) { g.fillRect(R(x) - 1, R(y) + 1, 1, 1); g.fillRect(R(x) + 1, R(y) + 1, 1, 1); } g.globalAlpha = 1; }
  }
  const CINE = SHOTS.reduce((a, s) => a + s.len, 0);
  const STARTS = SHOTS.reduce((a, s, i) => (a.push(i ? a[i - 1] + SHOTS[i - 1].len : 0), a), []);

  // ---------------------------------------------------------------- Créditos
  // A roll over the lake in the morning: logo, cast, the journey, the signpost and thanks, then FIN.
  const ROLE = { ruca: 'la tortuga del embarcadero', lumi: 'la luciérnaga de los juncos', lapa: 'la lapa del bosque de raíces', olga: 'la molinera', anselmo: 'el pescador del muelle', canto: 'el topo de la turbera', pinzas: 'el cocinero de la cueva', alga: 'la del río subterráneo' };
  function frame(g, x, y, w, h, edge, fondo) {
    g.fillStyle = '#1a1420'; g.fillRect(x - 2, y - 1, w + 4, h + 2); g.fillRect(x - 1, y - 2, w + 2, h + 4);
    g.fillStyle = edge; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = fondo; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y, w, 2);
  }
  function portrait(g, id, x, y, t) {
    const Q = typeof Maestros !== 'undefined' && Maestros.QUIEN ? Maestros.QUIEN[id] : null, box = 30;
    if (Q) { frame(g, x, y, box, box, Q.edge, Q.fondo); try { Maestros.portrait(g, Q, x, y, box, box, false, t); } catch (e) { /* the art may be changing */ } return; }
    const pal = { nila: ['#f2c46a', '#3a3048'], bigotes: ['#b6b04e', '#243e52'], crias: ['#8fd9d0', '#1e3a3c'], garza: ['#a9b8c9', '#3a1f3a'] }[id] || ['#888', '#222'];
    frame(g, x, y, box, box, pal[0], pal[1]);
    g.save(); g.beginPath(); g.rect(x, y, box, box); g.clip();
    if (id === 'nila') { const s = ART.nila.idle[(t % 200) < 6 ? 1 : 0]; g.drawImage(s, 0, 0, s.width, 14, x + box / 2 - s.width, y + 3, s.width * 2, 28); }
    else if (id === 'bigotes') { g.save(); g.translate(x + box / 2, y + box / 2 + 2); g.scale(-1, 1); g.drawImage(ART.fish.closed, -11, -6); Player.fishOverlay(g, ART.fish.closed, -11, -6, t, { mood: 'happy', lx: 1 }); g.restore(); }
    else if (id === 'crias') { for (let i = 0; i < 4; i++) cria(g, x + 8 + (i % 2) * 14, y + 9 + (i >> 1) * 11 + Math.sin(t / 12 + i) * 1.5, 0, i % 2 === 1, t, i, 1); }
    else if (id === 'garza') { heron(g, t, x + 1, y + 10, true, .7, [0, 1, 2, 1][(t >> 4) % 4]); }
    g.restore();
  }
  // The wooden sign of the title's credit, hanging from its post.
  function plank(g, x, y, text, t, big) {
    const tw = ART.textWidth(text), w = tw + 16, h = 13, ang = Math.sin(t / 55) * .03;
    g.save(); g.translate(R(x), R(y)); g.rotate(ang);
    const px = -R(w / 2);
    g.fillStyle = '#1a1420'; g.fillRect(px - 1, -1, w + 2, h + 2); g.fillRect(px - 2, 1, w + 4, h - 2);
    g.fillStyle = '#8a5a34'; g.fillRect(px, 0, w, h); g.fillStyle = '#a56f38'; g.fillRect(px, 0, w, 2); g.fillRect(px, 6, w, 1); g.fillStyle = '#6b4a30'; g.fillRect(px, h - 2, w, 2);
    g.fillStyle = '#7a4e2c'; for (let i = 5; i < w - 3; i += 9) g.fillRect(px + i, 3 + (i % 2), 3, 1);
    g.fillStyle = '#5e8a2e'; for (let i = 0; i < w; i += 4) g.fillRect(px + i + ((i * 7) % 3), -1, 2 + (i % 2), 1); g.fillStyle = '#8fbf4a'; g.fillRect(px + 3, -1, 1, 1); g.fillRect(px + w - 8, -1, 1, 1);
    g.fillStyle = '#c9b08a'; g.fillRect(px + 2, 2, 1, 1); g.fillRect(px + w - 3, 2, 1, 1);
    ART.text(g, text, -1, 2, '#2a1810', 'center'); ART.text(g, text, 0, 3, '#fff3b8', 'center', '#4a2e1a');
    const sh = ((t + 90) % 260) / 50; if (sh < 1) { g.globalAlpha = .45; g.fillStyle = '#fff6d6'; g.fillRect(R(px + sh * w), 1, 2, h - 2); g.globalAlpha = 1; }
    g.restore();
  }
  // The plank on its post, driven into a little mound of mud with grass, like the title's credit.
  function signpost(g, x, y, text, t) {
    const px = R(x), top = y + 8, foot = y + 40;
    g.fillStyle = '#1a1420'; g.fillRect(px - 2, top, 5, foot - top); g.fillStyle = '#6b4a30'; g.fillRect(px - 1, top, 3, foot - top); g.fillStyle = '#8a5a34'; g.fillRect(px - 1, top, 1, foot - top);
    g.fillStyle = '#1a1420'; g.fillRect(px - 8, foot - 1, 17, 4); g.fillRect(px - 6, foot - 2, 13, 1); g.fillStyle = '#3a2a22'; g.fillRect(px - 7, foot, 15, 2); g.fillStyle = '#4e382a'; g.fillRect(px - 5, foot - 1, 10, 1);
    g.fillStyle = '#5e8a2e'; for (const [dx, hh] of [[-7, 4], [-5, 6], [5, 5], [7, 3], [-2, 3]]) g.fillRect(px + dx, foot - 1 - hh, 1, hh); g.fillStyle = '#8fbf4a'; g.fillRect(px - 5, foot - 7, 1, 2); g.fillRect(px + 5, foot - 6, 1, 2);
    plank(g, x, y, text, t);
    // The year on a tin tag hanging from it.
    const yr = '2026', yw = ART.textWidth(yr) + 6, ta = Math.sin(t / 32 + 1) * .12;
    g.save(); g.translate(px, y + 14); g.rotate(ta);
    g.fillStyle = '#b8a888'; for (let i = 0; i < 4; i++) { g.fillRect(-yw / 2 + 2, i, 1, 1); g.fillRect(yw / 2 - 3, i, 1, 1); }
    g.fillStyle = '#1a1420'; g.fillRect(-yw / 2 - 1, 3, yw + 2, 11); g.fillStyle = '#d8d0c0'; g.fillRect(-yw / 2, 4, yw, 9); g.fillStyle = '#f2ecdc'; g.fillRect(-yw / 2, 4, yw, 1); g.fillStyle = '#a89c88'; g.fillRect(-yw / 2, 12, yw, 1);
    ART.text(g, yr, 0, 5, '#4a3a30', 'center'); g.restore();
  }
  // The GLUP of the title: its letters, and the G's eye.
  function logo(g, cx, y, t) {
    if (typeof Title === 'undefined' || !Title.build) { const l = ART.logo(); g.drawImage(l, R(cx - l.width / 2), y); return; }
    const L = Title.build(), x0 = L[0].slotX, x1 = L[L.length - 1].slotX + L[L.length - 1].w, dx = R(cx - (x0 + x1) / 2);
    L.forEach((b, i) => { const bob = R(Math.sin((t + i * 23) / 28) * 1.2); g.drawImage(b.c, b.slotX + dx, y + bob); });
    const b = L[0], bob = R(Math.sin(t / 28) * 1.2), ex = b.slotX + dx + 4 + 24, ey = y + bob + 4 + 10, blink = (t % 210) < 6;
    g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey - 3, 7, 7); g.fillRect(ex - 2, ey - 4, 5, 9); g.fillRect(ex - 4, ey - 2, 9, 5);
    if (blink) { g.fillStyle = '#9ca044'; g.fillRect(ex - 3, ey - 2, 7, 5); g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey, 7, 1); }
    else { g.fillStyle = '#fffbe6'; g.fillRect(ex - 2, ey - 2, 5, 5); g.fillRect(ex - 3, ey - 1, 7, 3); g.fillRect(ex - 1, ey - 3, 3, 7); g.fillStyle = '#1a1420'; g.fillRect(ex, ey - 1, 2, 3); g.fillStyle = '#ffffff'; g.fillRect(ex, ey - 1, 1, 1); }
  }
  // Credits text with a dark outline all round, so it reads over the bright sky.
  function txt(g, str, x, y, col, al = 'center') {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ART.text(g, str, x + dx, y + dy, '#1b1420', al);
    ART.text(g, str, x, y, col, al);
  }
  function header(g, y, text) {
    const w = 26 + (text.length * 6); ART.title(g, text, W / 2, y, '#f2c46a', 'center');
    g.fillStyle = '#f2c46a'; g.globalAlpha = .7; g.fillRect(W / 2 - w - 14, y + 4, 14, 1); g.fillRect(W / 2 + w, y + 4, 14, 1); g.globalAlpha = 1;
    g.fillStyle = '#fff6d6'; g.fillRect(W / 2 - w - 17, y + 3, 1, 3); g.fillRect(W / 2 + w + 16, y + 3, 1, 3);
  }
  function stats() {
    const c = Save.criasAll(), tricks = POWER_ORDER.filter(k => Save.has(k)).length, best = Save.data.best || {};
    let secs = 0, all = true; for (const d of LEVELS) { if (best[d.id] === undefined || best[d.id] === null) all = false; else secs += best[d.id]; }
    return { got: c.got, all: c.all, tricks, secs: all ? secs : null };
  }
  let rollList = null;
  function roll() {
    if (rollList) return rollList;
    const list = [], add = (h, draw) => list.push({ h, draw });
    add(64, (g, y, t) => { logo(g, W / 2, y, t); });
    add(34, (g, y, t) => { plank(g, W / 2, y + 4, 'Nila y el pez gato', t); });
    add(34, (g, y) => header(g, y + 8, 'Reparto'));
    let side = 0;
    const person = (id, name, col, role, trick) => { const left = side++ % 2 === 0; add(44, (g, y, t) => {
      const px = left ? 70 : 220, tx = left ? 108 : 212, al = left ? 'left' : 'right';
      portrait(g, id, px, y, t);
      txt(g, name, tx, y + 4, col, al); txt(g, role, tx, y + 14, '#e8e0f4', al);
      if (trick) { const m = ART.morsels && ART.morsels[trick]; const label = 'enseñó: ' + POWERS[trick].name, lw = ART.textWidth(label); const lx = left ? tx + 11 : tx - lw; if (m) g.drawImage(m, left ? tx : tx - lw - 11, y + 23); txt(g, label, lx, y + 24, '#f2c46a', 'left'); }
    }); };
    person('nila', 'Nila', '#f7c843', 'la niña del chubasquero amarillo');
    person('bigotes', 'Bigotes', '#d8f58a', 'un pez gato con mucha hambre');
    const Q = typeof Maestros !== 'undefined' && Maestros.QUIEN ? Maestros.QUIEN : {};
    for (const d of LEVELS) { const m = d.maestro; if (!m || !m.quien) continue; const q = Q[m.quien]; person(m.quien, q ? q.name : m.quien, q ? q.tag : '#fff6d6', ROLE[m.quien] || d.name, m.poder && POWERS[m.poder] ? m.poder : null); }
    person('crias', 'Las crías', '#8fd9d0', 'de vuelta en casa, todas juntas');
    person('garza', 'La Garza', '#e9eef2', 'ahora pesca en otro río');
    add(30, () => { });
    add(34, (g, y) => header(g, y + 8, 'Tu viaje'));
    add(86, (g, y, t) => {
      const s = stats(), x0 = 88, x1 = 232; let yy = y + 4;
      const row = (label, val, icon) => { txt(g, label, x0, yy, '#e8e0f4', 'left'); txt(g, val, x1, yy, '#fff6d6', 'right'); g.fillStyle = '#6a5a7a'; for (let x = x0 + ART.textWidth(label) + 4; x < x1 - ART.textWidth(val) - 4; x += 3) g.fillRect(x, yy + 6, 1, 1); if (icon) icon(yy); yy += 16; };
      row('Crías rescatadas', s.got + ' / ' + s.all, yy2 => cria(g, x0 - 10, yy2 + 4, 0, false, t, 0, 1));
      row('Trucos aprendidos', s.tricks + ' / ' + POWER_ORDER.length, yy2 => { if (ART.morsels) g.drawImage(ART.morsels.soplido, x0 - 14, yy2 - 1); });
      row('Lugares', LEVELS.length + ' / ' + LEVELS.length, yy2 => { g.fillStyle = '#f2c46a'; g.fillRect(x0 - 12, yy2 + 1, 5, 5); g.fillStyle = '#1b1420'; g.fillRect(x0 - 11, yy2 + 2, 3, 3); });
      if (s.secs !== null) row('Tiempo (mejores marcas)', Game.fmtTime(s.secs), yy2 => { g.fillStyle = '#fff6d6'; g.fillRect(x0 - 12, yy2, 5, 7); g.fillStyle = '#1b1420'; g.fillRect(x0 - 11, yy2 + 1, 3, 5); g.fillStyle = '#fff6d6'; g.fillRect(x0 - 10, yy2 + 2, 1, 2); });
      if (s.got >= s.all && s.all) txt(g, '¡Todas las crías en casa!', W / 2, yy + 2, '#f2c46a');
    });
    add(40, () => { });
    add(20, (g, y) => txt(g, 'Un juego de', W / 2, y + 4, '#e8e0f4'));
    add(58, (g, y, t) => signpost(g, W / 2, y + 2, 'gavilanbe', t));
    add(40, (g, y) => { txt(g, 'Dibujos, música y código hechos a mano,', W / 2, y, '#d8d0e8'); txt(g, 'píxel a píxel, sin librerías.', W / 2, y + 11, '#d8d0e8'); });
    add(60, () => { });
    add(40, (g, y) => ART.title(g, '¡Gracias por jugar!', W / 2, y + 4, '#fff6d6', 'center'));
    add(120, () => { });
    rollList = list; rollList.H = list.reduce((a, it) => a + it.h, 0); return rollList;
  }
  const SPEED = .45;
  const ROLL = () => Math.ceil((roll().H + H) / SPEED);
  // The morning lake behind the credits: the boat moored and rocking, Nila asleep in it, the crías about.
  function backdrop(g, t, k = 0) {
    vista(g, t, { camX: 600 + t * .12, camY: 44, day: 1, sunX: 70, sunY: lerp(66, 30, k), hz: 128 });
    const bx = 214 + Math.sin(t / 200) * 6, sy = 156;
    for (let i = 0; i < 4; i++) leaper(g, t, i + 60, bx - 30 - i * 24, sy + (i % 2), { period: 160, h: 12, dir: i % 2 ? -1 : 1 });
    boatOn(g, bx, sy, t, { spr: ART.nila.tuck, mood: 'sleep', look: { lx: 1 } });
    zzz(g, bx + 18, sy - 30, t, 12);
    for (let i = 0; i < 2; i++) { const u = ((t + i * 500) % 1000) / 1000; bird(g, 340 - u * 400, 30 + i * 12 + Math.sin(u * 30) * 2, t, i, '#6a4a5a'); }
  }
  const TOP = 6, BOT = 134;
  function drawRoll(g, lt, t) {
    backdrop(g, t, lt / ROLL());
    // A soft shade over the sky so the words read.
    g.fillStyle = '#140e22'; for (let y = 0; y < BOT; y++) { g.globalAlpha = .16 * (1 - Math.max(0, y - 80) / (BOT - 80)); g.fillRect(0, y, W, 1); } g.globalAlpha = 1;
    // The words are drawn apart and pasted row by row, fading in at the water and out at the top.
    const b = buf('roll'); b.g.clearRect(0, 0, W, H);
    const list = roll(); let y = H - lt * SPEED;
    for (const it of list) { if (y + it.h > -40 && y < BOT + 10) it.draw(b.g, R(y), t); y += it.h; }
    for (let yy = 0; yy < BOT; yy++) { const a = Math.min(1, (yy - TOP) / 18, (BOT - yy) / 26); if (a <= 0) continue; g.globalAlpha = a; g.drawImage(b.c, 0, yy, W, 1, 0, yy, W, 1); }
    g.globalAlpha = 1;
  }
  // FIN: three big letters drop in one by one and bounce, then the way back.
  function drawFin(g, lt, t) {
    backdrop(g, t, 1);
    g.globalAlpha = Math.min(.28, lt / 60); g.fillStyle = '#140e22'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    // In golden goo (the Letra GLUP): each letter drops, splats, wobbles like jelly and then breathes.
    const L = Glup.layout('FIN', 'huge', 'oro'), off = R(W / 2 - L.w / 2);
    for (const it of L.items) {
      const i = it.i, t0 = 20 + i * 14, k = clamp01((lt - t0) / 22); if (k <= 0) continue;
      const d = lt - t0 - 22, sq = d >= 0 && d < 40 ? Math.exp(-d / 6) * Math.cos(d / 1.5) : 0, br = lt > 120 ? Math.sin(lt / 20 - i) * .03 : 0;
      const y = lerp(-60, 36, outBack(k)), bob = lt > 120 ? Math.sin((lt + i * 20) / 24) * 1.5 : 0;
      Glup.letter(g, it.gl, off + it.x, R(y + bob) - it.gl.top, { sx: 1 + sq * .3 - br, sy: 1 - sq * .26 + br, drips: lt > 90 ? Math.max(0, Math.sin(lt / 50 + i * 2) * 4) : 0 });
    }
    if (lt > 70) { const a = clamp01((lt - 70) / 30); g.globalAlpha = a; plank(g, W / 2, 104, 'Nila y el pez gato', t); g.globalAlpha = 1; }
    for (let i = 0; i < 12; i++) { const k = ((lt + i * 23) % 120) / 120; if (lt < 60) continue; const an = i / 12 * Math.PI * 2 + lt / 200, r = 30 + k * 60, x = W / 2 + Math.cos(an) * r * 1.6, y = 64 + Math.sin(an) * r * .6; g.globalAlpha = Math.sin(k * Math.PI) * .8; g.fillStyle = i % 3 ? '#fff4a8' : '#ffffff'; const s = R(Math.sin(k * Math.PI) * 2); g.fillRect(R(x) - s, R(y), s * 2 + 1, 1); g.fillRect(R(x), R(y) - s, 1, s * 2 + 1); }
    g.globalAlpha = 1;
    if (lt > 140 && (lt >> 5) % 2 === 0) ART.text(g, Touch.enabled ? 'Toca para volver al mapa' : 'Pulsa Z para volver al mapa', W / 2, 160, '#fff6d6', 'center', '#1b1420');
  }

  // ---------------------------------------------------------------- Tiempo y mando
  const S = { T: 0, on: false, shot: -1, down: 0, fast: 0, hint: 0 };
  function phase(T) {
    if (T < CINE) { let i = SHOTS.length - 1; while (STARTS[i] > T) i--; return { name: 'cine', i, lt: T - STARTS[i] }; }
    const r = ROLL(); if (T < CINE + r) return { name: 'roll', lt: T - CINE };
    return { name: 'fin', lt: T - CINE - r };
  }
  function start() { S.T = 0; S.on = true; S.shot = -1; S.down = 0; S.fast = 0; S.hint = 0; Sound.stopMusic(); }
  function advance(to) {
    const a = S.T; S.T = to; const p0 = phase(a), p1 = phase(to);
    // Sounds for the frames we went through, and the music of a shot we entered.
    if (p1.name === 'cine' && p0.name === 'cine' && p0.i === p1.i && SHOTS[p1.i].cue) SHOTS[p1.i].cue(p0.lt, p1.lt);
    if (p1.name === 'cine' && p1.i !== S.shot) { S.shot = p1.i; const m = SHOTS[p1.i].music; if (m) Sound.playMusic(m); if (SHOTS[p1.i].amb !== undefined) Sound.ambiente(SHOTS[p1.i].amb); }
    if (p1.name === 'roll' && p0.name !== 'roll') Sound.playMusic('creditos');
    if (p1.name === 'fin' && p0.name !== 'fin') Sound.play('bell');
  }
  function update() {
    const held = Input.held.jump || Input.held.fish || Input.held.confirm, press = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm, tap = Game.tapped;
    Game.tapped = false;
    const p = phase(S.T);
    // A short press (or a tap) is a "next"; holding the button runs the film fast.
    let next = !!tap;
    if (press) S.down = 1; else if (held && S.down) S.down++; else if (S.down) { if (S.down <= 12) next = true; S.down = 0; }
    const fast = S.down > 12;
    if (S.hint > 0) S.hint--;
    if (p.name === 'cine') {
      if (Input.pressed.pause && S.T > 30) { advance(CINE); return; }
      if (next && p.lt > 30) { advance(p.i + 1 < SHOTS.length ? STARTS[p.i + 1] : CINE); S.hint = 90; return; }
      advance(S.T + (fast && p.lt > 20 ? 4 : 1));
    } else if (p.name === 'roll') {
      if (next) { S.fast = 150; S.hint = 90; }
      if (S.fast > 0) S.fast--;
      advance(S.T + (fast || S.fast > 0 ? 5 : 1));
    } else {
      advance(S.T + 1);
      if (next && p.lt > 100 && S.on) { S.on = false; Sound.play('confirm'); Game.transition(() => Game.select()); }
    }
  }
  function caption(g, text, t, len) {
    const a = Math.min(1, t / 15, (len - t) / 15); if (a <= 0) return;
    const shown = text.slice(0, Math.max(0, Math.floor((t - 6) * .8)));
    g.globalAlpha = a; ART.text(g, shown, W / 2 - ART.textWidth(text) / 2, H - BAR + 5, '#fff3d0', 'left'); g.globalAlpha = 1;
  }
  function draw(g) {
    const p = phase(S.T), t = S.T;
    g.save();
    if (p.name === 'cine') {
      const sh = SHOTS[p.i], lt = p.lt; sh.draw(g, lt); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      const next = SHOTS[p.i + 1];
      if (sh.fadeIn && lt < 24) { g.globalAlpha = 1 - lt / 24; g.fillStyle = sh.fadeIn === 'white' ? '#ffffff' : '#05050b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      if (next && next.fadeIn && sh.len - lt < 20) { g.globalAlpha = 1 - (sh.len - lt) / 20; g.fillStyle = next.fadeIn === 'white' ? '#ffffff' : '#05050b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      g.fillStyle = '#05050b'; g.fillRect(0, 0, W, BAR); g.fillRect(0, H - BAR, W, BAR);
      for (const [a, text, b] of sh.caps || []) if (lt >= a && lt < b) caption(g, text, lt - a, b - a);
      if ((S.hint > 0 || (p.i === 0 && lt > 40 && lt < 300))) { g.globalAlpha = .45; ART.text(g, Touch.enabled ? 'Toca: siguiente' : 'Z: siguiente · mantén: deprisa', W - 4, 5, '#6a6688', 'right'); g.globalAlpha = 1; }
    } else if (p.name === 'roll') {
      drawRoll(g, p.lt, t);
      if (p.lt < 40) { g.globalAlpha = 1 - p.lt / 40; g.fillStyle = '#05050b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      if (S.fast > 0 || S.down > 12) { const k = (t >> 3) % 3; for (let i = 0; i < 3; i++) { g.globalAlpha = i === k ? 1 : .45; txt(g, '›', W - 16 + i * 4, H - 12, '#fff6d6', 'left'); } g.globalAlpha = 1; }
      else if (S.hint > 0 || p.lt < 300) { g.globalAlpha = .7; txt(g, Touch.enabled ? 'Toca para ir más deprisa' : 'Mantén Z para ir más deprisa', W - 5, H - 11, '#d8d0e8', 'right'); g.globalAlpha = 1; }
    } else drawFin(g, p.lt, t);
    g.restore();
  }
  // ?escena=final&t=T: the ending at frame T, with a finished journey for the numbers.
  function capture(c) {
    Save.data = Save.fresh(); Save.data.mute = true; Save.data.finished = true;
    LEVELS.forEach((def, i) => { Save.open(i); const ks = NIVEL.criasDe(def); ks.slice(0, Math.ceil(ks.length * (i % 3 ? 1 : .6))).forEach(k => { Save.criasSet(def.id)[k] = 1; }); Save.data.best[def.id] = 150 + i * 23; if (def.maestro) Save.data.powers[def.maestro.poder] = true; });
    Game.state = 'ending'; Game.endT = 1; start(); S.T = Math.max(0, c.t); S.shot = phase(S.T).i === undefined ? -1 : phase(S.T).i; Game.frozen = true;
  }
  return { start, update, draw, capture, SHOTS, CINE, get total() { return CINE + ROLL(); }, get state() { return S; }, phase: () => phase(S.T) };
})();
