// GLUP — cinemática de entrada. Planos con cámara (picados, paneos, zooms), parallax,
// cortes con fundido o destello y música que cambia con la acción, a la manera de las
// entradas de Zelda en Game Boy. Cuenta cómo la Garza se llevó a las crías y termina
// con Nila corriendo río arriba con Bigotes bajo el brazo. Todo es función del tiempo,
// así que se puede saltar a cualquier fotograma (tools/captura.sh cine T).
'use strict';
const Cine = (() => {
  const BAR = 18;
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const clamp01 = k => Math.max(0, Math.min(1, k));
  let buf = null, bufG = null;
  function buffer() { if (!buf) { buf = document.createElement('canvas'); buf.width = W; buf.height = H; bufG = buf.getContext('2d'); bufG.imageSmoothingEnabled = false; } return bufG; }
  // Draw `fn` into the offscreen buffer, then show the rectangle (cx, cy) ± view at full screen: a camera zoom.
  function render(fn) { const b = buffer(); b.setTransform(1, 0, 0, 1, 0, 0); fn(b); return buf; }
  function zoomed(g, zoom, cx, cy, fn) {
    render(fn);
    const w = W / zoom, h = H / zoom, x = Math.max(0, Math.min(W - w, cx - w / 2)), y = Math.max(0, Math.min(H - h, cy - h / 2));
    g.drawImage(buf, x, y, w, h, 0, 0, W, H);
  }

  // ---------------------------------------------------------------- Piezas
  // La Garza: the same living puppet as in the fight (garza.js), placed where the old sprite's top left was.
  function heron(g, t, x, y, left, scale = 1, wing, tint) {
    const wf = wing === undefined ? undefined : [-1, 0, 1, 0][wing % 4];
    Boss.figura(g, { x: x + 16 * scale, y: y + 11 * scale, t, dir: left ? -1 : 1, scale, tint, wing: wf, state: 'return' });
  }

  function fish(g, spr, x, y, a = 0, flip = false, s = 1, o) { g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a); g.scale(flip ? -s : s, s); g.drawImage(spr, -spr.width / 2, -spr.height / 2); if (spr.width === 22) Player.fishOverlay(g, spr, -spr.width / 2, -spr.height / 2, Game.t, o || {}); g.restore(); }
  function burst(g, x, y, t0, t, n, seed, cols, spd, up = true, grav = .12) {
    const k = t - t0; if (k < 0 || k > 60) return;
    for (let i = 0; i < n; i++) {
      const a = up ? -Math.PI / 2 + (hash(seed + i) - .5) * 1.8 : hash(seed + i) * Math.PI * 2, v = spd * (.35 + hash(seed + i * 3) * .9), life = 20 + hash(seed + i * 7) * 30;
      if (k > life) continue;
      g.fillStyle = cols[i % cols.length]; g.fillRect(Math.round(x + Math.cos(a) * v * k), Math.round(y + Math.sin(a) * v * k + grav * k * k / 2), hash(seed + i * 5) < .3 ? 2 : 1, hash(seed + i * 5) < .3 ? 2 : 1);
    }
  }
  function caption(g, text, t, len) {
    if (!text) return; const a = Math.min(1, t / 15, (len - t) / 15); if (a <= 0) return;
    const shown = text.slice(0, Math.max(0, Math.floor((t - 6) * .8)));
    g.globalAlpha = a; ART.text(g, shown, W / 2 - ART.textWidth(text) / 2, H - BAR + 5, '#fff3d0', 'left'); g.globalAlpha = 1;
  }
  let skyTall = null;
  function tallSky() {
    if (skyTall) return skyTall;
    const c = document.createElement('canvas'); c.width = W; c.height = 240; const g = c.getContext('2d');
    const cols = ['#05050f', '#080a1a', '#0c0e24', '#10132e', '#141838', '#17183a'];
    for (let y = 0; y < 240; y++) { const f = y / 240 * (cols.length - 1), i = Math.min(cols.length - 2, f | 0), fr = f - i; for (let x = 0; x < W; x++) { g.fillStyle = (fr > .5 && ((x + y) & 1)) || fr > .85 ? cols[i + 1] : cols[i]; g.fillRect(x, y, 1, 1); } }
    // A soft band of Milky Way across the top.
    for (let i = 0; i < 900; i++) { const x = hash(i) * W, y = 40 + (x / W) * 90 + (hash(i + 9) - .5) * 40; g.fillStyle = hash(i + 3) < .5 ? 'rgba(180,170,230,.18)' : 'rgba(240,220,255,.12)'; g.fillRect(x | 0, y | 0, 1, 1); }
    skyTall = c; return c;
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
  // Under the dock: green light, god-rays, posts, silt, reeds and the school of crías.
  let waterBg = null;
  function underwaterBg() {
    if (waterBg) return waterBg;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const cols = ['#4f8a6a', '#3e7a60', '#2f6658', '#255450', '#1d4446', '#17343c', '#122632', '#0e1a26'];
    for (let y = 0; y < H; y++) { const f = y / H * (cols.length - 1), i = Math.min(cols.length - 2, f | 0), fr = f - i; for (let x = 0; x < W; x++) { g.fillStyle = (fr > .5 && ((x ^ y) & 1)) || fr > .85 ? cols[i + 1] : cols[i]; g.fillRect(x, y, 1, 1); } }
    // Mud bottom with stones.
    for (let x = 0; x < W; x++) { const h = 14 + Math.sin(x / 23) * 4 + Math.sin(x / 7) * 1.5; g.fillStyle = '#0c1418'; g.fillRect(x, H - h, 1, h); g.fillStyle = '#18262a'; g.fillRect(x, H - h, 1, 1); }
    for (let i = 0; i < 14; i++) { const x = hash(i + 40) * W | 0, y = H - 10 - (hash(i + 41) * 6 | 0); g.fillStyle = '#1e2e30'; g.fillRect(x, y, 4, 2); g.fillStyle = '#2a3c3c'; g.fillRect(x + 1, y, 2, 1); }
    waterBg = c; return c;
  }
  const POSTS = [70, 232];
  function underwater(g, t, o = {}) {
    g.drawImage(underwaterBg(), 0, 0);
    // God-rays from the surface.
    for (let i = 0; i < 5; i++) { const x = 30 + i * 70 + Math.sin(t / 60 + i) * 10, a = .05 + Math.sin(t / 30 + i * 2) * .025; g.globalAlpha = Math.max(0, a); g.fillStyle = '#f6e2a0'; g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 16, 16); g.lineTo(x + 70, H); g.lineTo(x + 40, H); g.fill(); } g.globalAlpha = 1;
    // Surface seen from below, with the planks of the dock overhead.
    for (let x = 0; x < W; x++) { const y = 14 + Math.round(Math.sin(x / 9 + t / 12) * 1.2); g.fillStyle = '#9fd8b8'; g.fillRect(x, y, 1, 1); g.fillStyle = '#6aa88c'; g.fillRect(x, y + 1, 1, 1); g.fillStyle = '#2a3a4a'; g.fillRect(x, 0, 1, y); }
    g.fillStyle = '#1a1420'; g.fillRect(40, 0, 240, 9); g.fillStyle = '#2e2028'; for (let x = 40; x < 280; x += 16) g.fillRect(x, 0, 15, 7);
    // Reeds swaying at the bottom.
    for (let i = 0; i < 22; i++) { const bx = hash(i + 7) * W, h = 30 + hash(i + 8) * 50; g.fillStyle = i % 3 ? '#16302a' : '#1f4034'; for (let k = 0; k < h; k++) { const sx = bx + Math.sin(t / 40 + i + k / 14) * k / 12; g.fillRect(Math.round(sx), H - 10 - k, k < h * .7 ? 2 : 1, 1); } }
    // Silt drifting.
    for (let i = 0; i < 50; i++) { const x = (hash(i) * W + t * (.1 + hash(i + 1) * .2)) % W, y = 20 + (hash(i + 2) * (H - 30) + Math.sin(t / 50 + i) * 6); g.fillStyle = hash(i + 3) < .5 ? '#8cc8a8' : '#cfe8c8'; g.globalAlpha = .35 + hash(i + 4) * .4; g.fillRect(x | 0, y | 0, 1, 1); } g.globalAlpha = 1;
    if (o.fish) o.fish(g);
    // The posts go in front, so a fish can hide behind one.
    for (const px of POSTS) { g.fillStyle = '#1a1420'; g.fillRect(px - 5, 0, 11, H); g.fillStyle = '#2e2028'; g.fillRect(px - 4, 0, 9, H); g.fillStyle = '#3c2a2c'; g.fillRect(px - 4, 0, 2, H); for (let y = 30; y < H; y += 9) { g.fillStyle = '#2f5a3a'; g.fillRect(px - 5 + ((y >> 3) & 1) * 9, y + Math.round(Math.sin(t / 20 + y) * 1), 2, 5); } }
    // Rising bubbles.
    for (let i = 0; i < 16; i++) { const period = 140 + hash(i) * 120, k = ((t + hash(i + 5) * period) % period) / period, x = hash(i + 6) * W + Math.sin(k * 20 + i) * 2, y = H - 12 - k * (H - 28); g.fillStyle = '#cfeede'; g.globalAlpha = .7; g.fillRect(Math.round(x), Math.round(y), 1, 1); if (i % 3 === 0) { g.fillRect(Math.round(x) - 1, Math.round(y) + 1, 1, 1); g.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); g.fillRect(Math.round(x), Math.round(y) + 2, 1, 1); } g.globalAlpha = 1; }
  }
  // A school of crías swimming around a wandering centre; i=0 is Bigotes.
  function school(t, i) {
    const cx = 160 + Math.sin(t / 90) * 70, cy = 95 + Math.sin(t / 70) * 22;
    const a = hash(i) * 6.28 + t / (40 + hash(i + 1) * 30), r = 16 + hash(i + 2) * 34;
    const x = cx + Math.cos(a) * r * 1.4, y = cy + Math.sin(a) * r * .6;
    const vx = -Math.sin(a) * 1.4 + Math.cos(t / 90) * .8; return { x, y, flip: vx < 0 };
  }
  function drawCria(g, x, y, flip, t, i, s = 2) { fish(g, ART.criaFree[((t >> 3) + i) % 2], x, y, 0, flip, s); }

  // ---------------------------------------------------------------- Planos
  // Each shot: len (frames), fade in/out ('black' | 'white' | 0), music and ambience (amb) on entry, caption, draw(g, t).
  const SHOTS = [
    { len: 170, music: null, draw(g, t) {
      g.fillStyle = '#05050b'; g.fillRect(0, 0, W, H);
      // A firefly draws a line of light, then the credit fades in over it.
      const k = clamp01((t - 20) / 90), x0 = 90, x1 = 230;
      for (let i = 0; i < 40; i++) { const u = k - i * .012; if (u < 0) continue; const x = x0 + (x1 - x0) * u, y = 104 + Math.sin(u * 9) * 3; g.globalAlpha = (1 - i / 40) * .8; g.fillStyle = '#f2f5a0'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
      g.globalAlpha = 1; const fx = x0 + (x1 - x0) * k, fy = 104 + Math.sin(k * 9) * 3 - (k >= 1 ? (t - 110) * .4 : 0);
      if (t > 10) { g.globalAlpha = .25; g.fillStyle = '#f2f5a0'; g.fillRect(Math.round(fx) - 2, Math.round(fy) - 2, 5, 5); g.globalAlpha = 1; g.fillStyle = '#ffffe0'; g.fillRect(Math.round(fx), Math.round(fy), 1, 1); }
      const a = clamp01((t - 60) / 30) * clamp01((165 - t) / 20);
      g.globalAlpha = a; ART.text(g, 'gavilanbe', W / 2, 84, '#fff3d0', 'center'); ART.text(g, 'presenta', W / 2, 112, '#8a86a8', 'center'); g.globalAlpha = 1;
    } },
    { len: 380, fadeIn: 'black', music: 'dock', amb: 'atardecer', caption: 'El pantano de los Juncos Viejos.', capAt: 250, draw(g, t) {
      // Tilt down from the stars to the swamp at dusk.
      const k = ease(clamp01((t - 20) / 250)), top = -220 * (1 - k);
      g.drawImage(tallSky(), 0, Math.round(-240 - top));
      for (let i = 0; i < 60; i++) { const x = hash(i + 100) * W | 0, y = (hash(i + 101) * 220 | 0) - 240 - Math.round(top); const tw = Math.sin(t / (8 + hash(i) * 12) + i); if (y > -2 && y < H && tw > .2) { g.fillStyle = tw > .8 ? '#ffffff' : '#b8b0e0'; g.fillRect(x, y, 1, 1); if (tw > .9 && i % 4 === 0) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } } }
      // A shooting star while we look up.
      if (t > 50 && t < 80) { const u = (t - 50) / 30, sx = 250 - u * 120, sy = 20 + u * 40 - top - 240 + 100; g.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) { g.globalAlpha = (1 - i / 12) * (1 - u); g.fillRect(Math.round(sx + i * 2), Math.round(sy - i * .7), 1, 1); } g.globalAlpha = 1; }
      // The scene sits under the extended sky and rises into view.
      render(b => Game.drawScene(b, t, 'dusk')); g.drawImage(buf, 0, Math.round(-top));
    } },
    { len: 380, fadeIn: 'black', caption: 'Cada verano nacen allí las crías de pez gato.', capAt: 40, draw(g, t) {
      underwater(g, t, { fish: gg => { for (let i = 1; i < 16; i++) { const p = school(t, i); drawCria(gg, p.x, p.y, p.flip, t, i); } const b = school(t, 0); fish(gg, ART.fish[(t % 150) < 5 ? 'blink' : 'closed'], b.x, b.y - 6, Math.sin(t / 20) * .08, b.flip); } });
      if (t % 70 === 0) Sound.play('pop');
    } },
    { len: 330, fadeIn: 'black', caption: 'Nila las cuidaba desde el embarcadero.', capAt: 60, draw(g, t) {
      const z = 2.2 - ease(clamp01(t / 260)) * 1.2;
      zoomed(g, z, 150 + 5, 110, b => {
        Game.drawScene(b, t, 'dusk');
        const blink = (t % 170) < 6; b.drawImage(ART.nila.idle[blink ? 1 : 0], 147, 126 - ART.nila.idle[0].height);
        // Crías hopping out of the water around the dock.
        for (let i = 0; i < 6; i++) { const per = 80 + i * 13, k = ((t + i * 37) % per) / 40; if (k > 1) continue; const x = 104 + i * 19 + k * 8, y = 132 - Math.sin(k * Math.PI) * 16; drawCria(b, x, y, i % 2 === 0, t, i, 1); if (k < .08 || k > .92) { b.fillStyle = '#c8f2ea'; b.fillRect(Math.round(x) - 2, 131, 5, 1); } }
      });
    } },
    { len: 250, fadeIn: 'black', music: 'omen', amb: 'noche', draw(g, t) {
      // The omen: a long-legged shadow crosses the moon.
      g.drawImage(tallSky(), 0, -60);
      for (let i = 0; i < 50; i++) { const x = hash(i + 300) * W | 0, y = hash(i + 301) * H | 0; if (Math.sin(t / 10 + i) > .3) { g.fillStyle = '#9a94c0'; g.fillRect(x, y, 1, 1); } }
      const mz = 2 + t / 700, m = bigMoon(); g.save(); g.translate(W / 2, 84); g.scale(mz, mz); g.globalAlpha = .12; g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill(); g.globalAlpha = 1; g.drawImage(m, -m.width / 2, -m.height / 2); g.restore();
      const k = (t - 60) / 150; if (k > 0 && k < 1) heron(g, t, -140 + k * 560, 52 + Math.sin(k * 3) * 6, false, 2.6, [0, 1, 2, 1][(t >> 4) % 4], '#140c18');
      // Clouds drifting across the lower edge.
      for (let i = 0; i < 7; i++) { const x = ((i * 80 - t * .35) % 480 + 480) % 480 - 80, y = 128 + (i % 3) * 9; for (let k = 0; k < 5; k++) { const r = 7 + ((i * 3 + k * 5) % 6), cx = x + k * 11, cy = y + (k % 2) * 2; g.fillStyle = '#0d0c1c'; for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(Math.round(cx - hw), cy + dy, hw * 2, 1); } g.fillStyle = '#1c1a34'; g.fillRect(Math.round(cx - r + 2), cy - r, r * 2 - 4, 1); } }
      if (t === 110) Sound.play('swoop');
    } },
    { len: 200, fadeIn: 'white', music: 'heron', draw(g, t) {
      // The dive: speed lines, after-images and a big splash.
      const hit = 70, k = clamp01((t - 20) / (hit - 20)), hx = 360 - k * 200, hy = -30 + k * 150;
      const shake = t > hit && t < hit + 20 ? (hash(t) - .5) * 8 * (1 - (t - hit) / 20) : 0;
      zoomed(g, 1.15, 160 + shake, 100 + shake * .6, b => {
        Game.drawScene(b, t, 'dusk');
        const nila = t > hit ? ART.nila.hurt : t > 30 ? (ART.nila.brace || ART.nila.idle[0]) : ART.nila.idle[0];
        b.drawImage(nila, 147, 126 - nila.height); if (t > 30 && t < hit + 40) ART.text(b, '!', 155, 92 - ((t >> 2) % 2), '#f2c46a', 'center', '#1b2430');
        if (t < hit + 4) {
          b.fillStyle = '#fff6e0'; for (let i = 0; i < 16; i++) { const o = (hash(i + 50) - .5) * 60, len = 20 + hash(i + 51) * 30, p = ((t * 9 + i * 40) % 200) / 200; b.globalAlpha = .5; const sx = hx + 20 + o + 200 * (1 - p) * .8, sy = hy + 10 + o * .5 - 150 * (1 - p) * .8; for (let j = 0; j < len; j += 2) b.fillRect(Math.round(sx + j * .8), Math.round(sy - j * .75), 1, 1); } b.globalAlpha = 1;
          for (let gh = 3; gh >= 1; gh--) { const kk = clamp01((t - gh * 3 - 20) / (hit - 20)); b.globalAlpha = .18 * (4 - gh); Boss.figura(b, { x: 360 - kk * 200 + 26, y: -30 + kk * 150 + 18, t, dir: -1, scale: 1.6, tint: '#fff6e0', state: 'plunge' }); } b.globalAlpha = 1;
          Boss.figura(b, { x: hx + 26, y: hy + 18, t, dir: -1, scale: 1.6, state: t < 30 ? 'lock' : 'plunge', st: t });
        }
        burst(b, 190, 132, hit, t, 60, 11, ['#c8f2ea', '#8fd9d0', '#ffffff', '#e6f6e0'], 2.6, true, .1);
        if (t > hit) for (let i = 0; i < 3; i++) { const r = (t - hit) * (1.2 + i * .5); if (r < 70) { b.fillStyle = '#c8f2ea'; b.globalAlpha = 1 - r / 70; b.fillRect(Math.round(190 - r), 131, Math.round(r * .4), 1); b.fillRect(Math.round(190 + r * .6), 131, Math.round(r * .4), 1); b.globalAlpha = 1; } }
      });
      if (t >= hit && t < hit + 10) { g.globalAlpha = 1 - (t - hit) / 10; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      if (t === 24) Sound.play('heron'); if (t === 50) Sound.play('swoop'); if (t === hit) { Sound.play('splash'); Sound.play('crack'); }
    } },
    { len: 250, fadeIn: 0, draw(g, t) {
      // Under the water again: the beak plunges in and the crías are gone, one after another.
      const plunge = [[10, 60], [110, 170]], shake = (t > 10 && t < 30) || (t > 110 && t < 130) ? (hash(t) - .5) * 6 : 0;
      g.save(); g.translate(Math.round(shake), 0);
      let bx = -99, by = -99, open = 0;
      for (const [a, b] of plunge) if (t >= a && t < b) { const k = (t - a) / (b - a), d = Math.sin(k * Math.PI); bx = 220 - d * 70; by = -10 + d * 110; open = k < .5 ? 1 : 0; }
      underwater(g, t, { fish: gg => {
        for (let i = 1; i < 16; i++) {
          const p = school(t * 2.4, i); let x = p.x, y = p.y; const gone = i % 2 ? 120 + i * 2 : 25 + i * 2;
          if (t > gone) continue; if (t > gone - 18 && bx > -50) { const k = (t - gone + 18) / 18; x += (bx - x) * k * k; y += (by + 10 - y) * k * k; }
          drawCria(gg, x, y, p.flip, t, i);
        }
        // Bigotes darts for the post and hides behind it.
        const k = ease(clamp01((t - 20) / 30)), p = school(20 * 2.4, 0), fx = p.x + (POSTS[1] + 4 - p.x) * k, fy = p.y + (120 - p.y) * k;
        fish(gg, t > 60 && (t % 60) < 20 ? ART.fish.open : ART.fish.closed, fx + (t > 60 ? Math.sin(t / 8) : 0), fy, 0, fx > POSTS[1] - 30 ? false : true);
      } });
      if (bx > -50) {
        // The beak: two long yellow blades with a dark gape, and bubbles around the head.
        // Tip first: blades along +x from the tip, head and neck trailing up and out of the water.
        g.save(); g.translate(Math.round(bx), Math.round(by)); g.rotate(-1.05); g.scale(1.4, 1.4);
        g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(-2, 0); g.lineTo(46, -6); g.lineTo(46, 7 + open * 5); g.fill();
        g.fillStyle = '#e2b63c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(46, -4); g.lineTo(46, 0); g.fill();
        g.fillStyle = '#b1852a'; g.beginPath(); g.moveTo(1, 1 + open); g.lineTo(46, 2 + open * 5); g.lineTo(46, 5 + open * 5); g.fill();
        if (open) { g.fillStyle = '#5a2030'; g.beginPath(); g.moveTo(3, 1); g.lineTo(46, 0); g.lineTo(46, 2 + open * 5); g.fill(); }
        g.fillStyle = '#f6d86a'; g.fillRect(14, -2, 24, 1);
        g.fillStyle = '#1a1420'; g.fillRect(44, -12, 26, 26); g.fillRect(60, -8, 90, 16);
        g.fillStyle = '#e9eef2'; g.fillRect(45, -11, 24, 24); g.fillStyle = '#c2cbd5'; g.fillRect(45, 6, 24, 7); g.fillRect(62, -7, 88, 14); g.fillStyle = '#e9eef2'; g.fillRect(62, -7, 88, 8);
        g.fillStyle = '#22262e'; g.fillRect(50, -11, 20, 3); g.fillRect(66, -13, 22, 3);
        g.fillStyle = '#e2b63c'; g.fillRect(52, -5, 5, 5); g.fillStyle = '#1a1a1a'; g.fillRect(53, -4, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(53, -4, 1, 1);
        g.restore();
        burst(g, bx, by, t - (t % 12), t, 10, t - (t % 12), ['#e8fbff', '#cfeede'], 1.2, true, -.06);
      }
      g.restore();
      if (t === 10 || t === 110) Sound.play('splash'); if ([30, 42, 128, 140, 150].includes(t)) Sound.play('glup', .6);
    } },
    { len: 320, fadeIn: 'black', music: 'sad', amb: 'noche', caption: 'La Garza se las llevó a todas, río arriba...', capAt: 60, draw(g, t) {
      // She flies off with a heavy crop, getting smaller against the dusk; a feather or two comes down.
      zoomed(g, 1, W / 2, H / 2, b => {
        Game.drawScene(b, t, 'dusk');
        const k = ease(clamp01(t / 280)), s = 1.8 - k * 1.55; heron(b, t * .7, 180 - k * 150, 60 - k * 40, true, Math.max(.25, s));
        b.drawImage(ART.nila.idle[(t % 150) < 6 ? 1 : 0], 147, 126 - ART.nila.idle[0].height);
        for (let i = 0; i < 3; i++) { const t0 = 30 + i * 60, u = (t - t0) / 160; if (u < 0 || u > 1) continue; const x = 190 - i * 30 + Math.sin(u * 12 + i) * 8, y = 40 + u * 90; b.fillStyle = '#e9eef2'; b.fillRect(Math.round(x), Math.round(y), 3, 1); b.fillStyle = '#a9b8c9'; b.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); }
      });
      if (t === 40) Sound.play('heron');
    } },
    { len: 380, fadeIn: 'black', caption: '...a todas menos a una.', capAt: 20, draw(g, t) {
      // Alone: ripples, then Bigotes peeks out behind the post and leaps into Nila's arms.
      const leap = 240, land = 272;
      zoomed(g, 1.6, 170, 116, b => {
        Game.drawScene(b, t, 'dusk');
        for (let i = 0; i < 3; i++) { const r = ((t + i * 40) % 120) / 4; b.globalAlpha = 1 - r / 30; b.fillStyle = '#c8f2ea'; b.fillRect(Math.round(205 - r), 131, 3, 1); b.fillRect(Math.round(205 + r), 131, 3, 1); } b.globalAlpha = 1;
        if (t < leap) {
          const kneel = t > 150; b.drawImage(kneel ? ART.nila.crouch : ART.nila.idle[(t % 150) < 6 ? 1 : 0], 147, 126 - (kneel ? ART.nila.crouch.height : ART.nila.idle[0].height));
          const rise = clamp01((t - 80) / 30); if (rise > 0) { b.save(); b.beginPath(); b.rect(0, 0, W, 132); b.clip(); fish(b, (t % 90) < 5 ? ART.fish.blink : ART.fish.closed, 196, 138 - rise * 9, -.3, true, 1, { mood: 'sad', lx: 1, ly: -1 }); b.restore(); }
          if (t > 180) ART.text(b, '?', 156, 94, '#9fc0cc', 'center', '#1b2430');
        } else if (t < land) { const k = (t - leap) / (land - leap); b.drawImage(ART.nila.crouch, 147, 126 - ART.nila.crouch.height); fish(b, ART.fish.open, 196 + (158 - 196) * k, 129 + (118 - 129) * k - Math.sin(k * Math.PI) * 26, -.3 - k * 6.28, true); }
        else { const k = t - land, sq = k < 16 ? Math.exp(-k / 5) * Math.cos(k / 1.5) : 0; b.save(); b.translate(155, 126); b.scale(1 + sq * .15, 1 - sq * .15); b.translate(-155, -126); Player.carryLook = { mood: 'happy' }; Player.drawCarry(b, 150, 108, ART.nila.idle[0], ART.fish.closed, 0); Player.carryLook = null; b.restore(); if (k < 60) b.drawImage(ART.heart, 162, 92 - (k >> 2)); }
        burst(b, 196, 131, leap, t, 16, 77, ['#c8f2ea', '#ffffff'], 1.8, true);
      });
      if (t === 110) Sound.play('pop'); if (t === leap) Sound.play('splash'); if (t === land) { Sound.play('glup', 1); Sound.play('heart'); }
    } },
    { len: 200, fadeIn: 'white', music: 'march', amb: 'atardecer', caption: '"Vamos a buscarlas, Bigotes."', capAt: 30, draw(g, t) {
      // Close-up with radiating lines behind: the resolve.
      zoomed(g, 3, 158, 112, b => {
        Game.drawScene(b, t, 'dusk');
        b.save(); b.translate(158, 112); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28 + t / 90, r0 = 16 + hash(i) * 6; b.globalAlpha = .35; b.fillStyle = i % 2 ? '#f6d284' : '#e2905c'; for (let r = r0; r < 70; r += 1.5) b.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 1, 1); } b.restore(); b.globalAlpha = 1;
        Player.drawCarry(b, 150, 108, ART.nila.idle[t > 60 && t < 70 ? 1 : 0], t > 90 ? ART.fish.squint : ART.fish.closed, 0);
      });
      if (t === 90) Sound.play('charged');
    } },
    { len: 460, fadeIn: 'white', draw(g, t) {
      // The run: the swamp rushes past in layers, like the horse ride through Holodrum.
      const cam = t * 4.2, z = 2.1 - ease(clamp01(t / 260)) * .5;
      zoomed(g, z, 136, 116, b => {
        MUNDO.drawBackground(b, cam, 0, ART.background('dusk'), t, W, H, null);
        // Ground: topsoil and grass racing by.
        for (let x = 0; x < W; x++) { const wx = x + cam; b.fillStyle = '#281b25'; b.fillRect(x, 136, 1, 44); b.fillStyle = '#35222a'; b.fillRect(x, 136, 1, 6); const gh = 2 + (hash(Math.floor(wx) * .13) * 4 | 0); b.fillStyle = hash(Math.floor(wx)) < .5 ? '#7fb040' : '#5e8a2e'; b.fillRect(x, 136 - gh, 1, gh + 1); if (hash(Math.floor(wx) + .5) < .04) { b.fillStyle = '#6c4739'; b.fillRect(x, 146 + (hash(wx) * 20 | 0), 3, 2); } }
        const run = ART.nila.run[Math.floor(t / 3) % 6], bob = (Math.floor(t / 3) % 3 === 1) ? -1 : 0;
        Player.drawCarry(b, 120, 118 + bob, run, ART.fish.closed, bob ? 1 : 0);
        burst(b, 120, 136, t - (t % 9), t, 4, t - (t % 9), ['#c9b08a', '#a08a6a'], .7, true, .05);
        // Far ahead on the horizon, the heron.
        if (t > 200) { const k = clamp01((t - 200) / 200); heron(b, t, 300 - k * 30, 70 - k * 10, true, .35, undefined, '#3a1f3a'); }
        // Fireflies streaking past.
        for (let i = 0; i < 10; i++) { const x = ((hash(i + 60) * 600 - t * (5 + hash(i) * 3)) % 400 + 400) % 400 - 40, y = 60 + hash(i + 61) * 70; b.fillStyle = '#f2f5a0'; b.globalAlpha = .7; b.fillRect(Math.round(x), Math.round(y), 5, 1); b.globalAlpha = 1; }
      });
      // Foreground reeds whipping past, out of focus.
      for (let i = 0; i < 5; i++) {
        const x = ((hash(i + 80) * 900 - t * 10) % 560 + 560) % 560 - 120, h = 70 + hash(i + 81) * 50, bend = 6 + hash(i + 82) * 8;
        g.fillStyle = '#120c18';
        for (let k = 0; k < h; k++) { const sx = x + (k / h) * (k / h) * bend; g.fillRect(Math.round(sx), H - k, 3, 1); }
        const hx = x + bend, hy = H - h; g.fillRect(Math.round(hx) - 2, hy - 18, 7, 18); g.fillRect(Math.round(hx) - 1, hy - 20, 5, 2); g.fillRect(Math.round(hx) + 1, hy - 26, 1, 6);
        g.fillStyle = '#2a1a24'; g.fillRect(Math.round(hx) - 1, hy - 17, 1, 15);
        for (let k = 0; k < 40; k++) { const lx = x - 4 - k * .5, ly = H - 20 - k * 1.2; g.fillStyle = '#120c18'; g.fillRect(Math.round(lx), Math.round(ly), 2, 1); }
      }
      if (t % 12 === 0 && t < 440) Sound.play('step');
    } }];
  const TOTAL = SHOTS.reduce((a, s) => a + s.len, 0);
  const S = { t: 0, done: null, lastShot: -1 };
  function locate(t) { let a = 0; for (let i = 0; i < SHOTS.length; i++) { if (t < a + SHOTS[i].len) return { i, lt: t - a }; a += SHOTS[i].len; } return { i: SHOTS.length - 1, lt: SHOTS[SHOTS.length - 1].len - 1 }; }

  function start(done) { S.t = 0; S.done = done; S.lastShot = -1; Game.state = 'cine'; Sound.stopMusic(); }
  // At its natural end the film is already white, so it cuts straight into the title's white fade.
  function finish(natural) { const f = S.done; S.done = null; Save.data.seen = Object.assign(Save.data.seen || {}, { intro: true }); Save.write(); if (f) { if (natural) f(); else Game.transition(f); } }
  function update() {
    const go = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Input.pressed.pause || Game.tapped; Game.tapped = false;
    if (go && S.t > 20) { finish(); return; }
    const { i } = locate(S.t);
    if (i !== S.lastShot) { S.lastShot = i; if (SHOTS[i].music) Sound.playMusic(SHOTS[i].music); if (SHOTS[i].amb !== undefined) Sound.ambiente(SHOTS[i].amb); }
    if (++S.t >= TOTAL) finish(true);
  }
  function draw(g) {
    const { i, lt } = locate(S.t), sh = SHOTS[i];
    g.save(); sh.draw(g, lt); g.restore();
    // Transitions: fade in from black or white, and fade out to black before a black cut.
    const next = SHOTS[i + 1];
    if (sh.fadeIn && lt < 24) { g.globalAlpha = 1 - lt / 24; g.fillStyle = sh.fadeIn === 'white' ? '#ffffff' : '#05050b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (next && next.fadeIn && sh.len - lt < 20) { g.globalAlpha = 1 - (sh.len - lt) / 20; g.fillStyle = next.fadeIn === 'white' ? '#ffffff' : '#05050b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (!next && sh.len - lt < 30) { g.globalAlpha = 1 - (sh.len - lt) / 30; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    // Letterbox and caption.
    g.fillStyle = '#05050b'; g.fillRect(0, 0, W, BAR); g.fillRect(0, H - BAR, W, BAR);
    if (sh.caption) caption(g, sh.caption, lt - (sh.capAt || 0), sh.len - (sh.capAt || 0) - 10);
    if (S.t > 40) { g.globalAlpha = .5; ART.text(g, Input.mode === 'puretv' ? 'A: saltar' : Touch.enabled ? 'Toca para saltar' : 'Z: saltar', W - 4, 5, '#6a6688', 'right'); g.globalAlpha = 1; }
  }
  // A tiny gate so the browser lets the music play: the cinematic starts on the first press.
  const Gate = { t: 0 };
  function gateUpdate() { Gate.t++; if (Gate.t > 10 && (Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Input.anyKey || Game.tapped)) { Game.tapped = false; Input.anyKey = false; start(() => { Game.title(); Title.fromCine(); }); } }
  function gateDraw(g) {
    g.fillStyle = '#05050b'; g.fillRect(0, 0, W, H);
    const t = Gate.t, x = 160 + Math.sin(t / 50) * 60, y = 90 + Math.sin(t / 33) * 20;
    g.globalAlpha = .25; g.fillStyle = '#f2f5a0'; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); g.globalAlpha = 1; g.fillStyle = '#ffffe0'; g.fillRect(Math.round(x), Math.round(y), 1, 1);
    g.globalAlpha = .5 + Math.sin(t / 15) * .4; ART.text(g, Touch.enabled ? 'Toca para empezar' : 'Pulsa una tecla', W / 2, 150, '#8a86a8', 'center'); g.globalAlpha = 1;
  }
  return { start, update, draw, gateUpdate, gateDraw, TOTAL, get state() { return S; }, SHOTS };
})();
