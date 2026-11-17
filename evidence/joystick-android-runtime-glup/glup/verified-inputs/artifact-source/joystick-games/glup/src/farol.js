// GLUP — el farol: el punto de guardado. Un farolillo de papel colgado de un poste torcido con musgo.
// Apagado, el papel está oscuro y una brasa late abajo, con una polilla dando vueltas; encendido, el papel
// se ilumina con sus varillas, la llama tiembla, se mece con la brisa, echa un charco de luz y lo rondan
// luciérnagas. Al tocarlo: un toquecito, la brasa se aviva, prende la mecha, destello, anillo de luz,
// luciérnagas en espiral, el farol se balancea y ¡GUARDADO! en letra GLUP de oro. Al volver a él tras
// caer, Nila sale de su luz: las luciérnagas se juntan y la forman.
'use strict';
const Farol = (() => {
  const OUT = '#1e1418', WOOD = '#6b4a30', WOODL = '#8a6440', WOODD = '#3f2a1c', MOSS = '#5e8a2e', MOSSL = '#8cba48', CAP = '#4a3020', TASSEL = '#c0463a';
  const CATCH = 8, GROW = 12;   // frames from the touch to the wick catching, and for the paper to light from bottom to top
  const px = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // Where things are, from the entity (x, y as Item.lantern places it: 10×18 standing on the ground).
  const geo = e => { const gy = Math.round(e.y) + 18, x0 = Math.round(e.x) - 1, ax = x0 + 7, ay = gy - 25; return { gy, x0, ax, ay }; };
  const center = e => { const q = geo(e); return { x: q.ax + Math.round(e.sw || 0) + .5, y: q.ay + 8 }; };
  const flick = e => .86 + Math.sin(e.t / 3.1 + e.ph) * .06 + Math.sin(e.t / 7.3 + e.ph * 2) * .05 + (Math.random() < .06 ? -.08 : 0);
  // The fireflies that live round a lit lantern (lissajous paths) and the moth round a dark one.
  function firefly(g, x, y, a) { if (a <= .05) return; x = Math.round(x); y = Math.round(y); g.globalAlpha = a * .28; px(g, x - 1, y - 1, '#ffe36a', 3, 3); g.globalAlpha = a * .5; px(g, x - 2, y, '#ffe36a', 5, 1); px(g, x, y - 2, '#ffe36a', 1, 5); g.globalAlpha = a; px(g, x, y, '#fffbd0'); g.globalAlpha = 1; }
  function make(x, y, id) {
    return { kind: 'lantern', x, y, w: 10, h: 18, id, t: 0, ph: Math.random() * 6, sw: 0, sv: 0, go: -1, ring: -1, burst: [], brushT: 0, update, draw };
  }
  function lightUp(e) {
    const p = Player; L.lit.add(e.id); L.checkpoint = { x: e.x - 1, y: e.y, lantern: e.id };
    e.go = 0; e.sv += (p.vx > .2 ? 1 : p.vx < -.2 ? -1 : p.x + 5 < e.x + 5 ? 1 : -1) * .9;   // her tap jolts it
    Sound.play('pop'); Input.rumble(30, .1, .2);
  }
  function update(e) {
    e.t++; const p = Player, c = center(e);
    if (!L.lit.has(e.id) && overlap({ x: e.x - 4, y: e.y, w: 18, h: 18 }, p.rect()) && !p.dead) lightUp(e);
    // Anticipation: the ember swells and crackles up the wick; then it catches.
    if (e.go >= 0) {
      e.go++;
      if (e.go < CATCH && e.go % 2 === 0) spawnParts(1, c.x, c.y + 3, { color: ['#ffb04a', '#fff2b8'], angle: -Math.PI / 2, spread: .8, speed: [.3, .8], life: [6, 12], g: 0, jitter: 1 });
      if (e.go === CATCH) {
        Sound.play('lantern'); Cam.punch(1.04); Input.rumble(80, .3, .4); e.ring = 0; e.sv += (e.sv >= 0 ? 1 : -1) * 1.6;
        spawnParts(14, c.x, c.y, { color: ['#ffcf5a', '#fff2b8', '#ffffff'], speed: [.6, 2.2], life: [14, 30], g: -.02 });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.random() * .4; e.burst.push({ a, r: 2, vr: 1.2 + Math.random() * .9, va: (i % 2 ? 1 : -1) * (.07 + Math.random() * .05), h: 0, vh: -.15 - Math.random() * .25, life: 0, max: 60 + (Math.random() * 40 | 0), ph: Math.random() * 6 }); }
        saved(e);
      }
      if (e.go > CATCH + 120) e.go = -1;
    }
    if (e.ring >= 0 && ++e.ring > 26) e.ring = -1;
    for (let i = e.burst.length - 1; i >= 0; i--) { const f = e.burst[i]; f.life++; f.a += f.va; f.r += f.vr; f.vr *= .93; f.h += f.vh; f.vh -= .006; if (f.life > f.max) e.burst.splice(i, 1); }
    // The swing: a damped pendulum; Nila brushing past a lit lantern nudges it.
    if (L.lit.has(e.id) && e.brushT <= 0 && Math.abs(p.vx) > 1.2 && overlap({ x: e.x - 2, y: e.y - 8, w: 14, h: 26 }, p.rect())) { e.sv += p.vx * .25; e.brushT = 40; }
    if (e.brushT > 0) e.brushT--;
    e.sv += -e.sw * .05; e.sv *= .955; e.sw = clamp(e.sw + e.sv, -4, 4);
    if (L.lit.has(e.id) && e.go < 0 && e.t % 9 === 0 && Math.random() < .5) spawnParts(1, c.x + rnd(-2, 2), c.y - 4, { color: ['#ffcf5a', '#fff2b8'], angle: -Math.PI / 2, spread: .4, speed: [.1, .35], life: [16, 30], g: -.01, jitter: 1 });
    if (L.arrive && L.arrive.id === e.id) arriveUpdate(e);
  }
  const litNow = e => L.lit.has(e.id) && !(e.go >= 0 && e.go < CATCH);
  function draw(e, g) {
    const q = geo(e), cx0 = Cam.x, cy0 = Cam.y, t = e.t, lit = litNow(e);
    const gy = q.gy - Math.round(cy0), x0 = q.x0 - Math.round(cx0), ax = q.ax - Math.round(cx0), ay = q.ay - Math.round(cy0);
    const breeze = L.def && L.def.theme === 'storm' ? 1.2 : .5, dx = clamp(Math.round(e.sw + Math.sin(t / 47 + e.ph) * breeze), -4, 4), bx = ax + dx, bt = ay + 3;
    const k = !L.lit.has(e.id) ? 0 : e.go >= 0 && e.go < CATCH + GROW ? clamp((e.go - CATCH) / GROW, 0, 1) : 1;   // how much of the paper is alight
    const fl = flick(e), cy = bt + 5;
    // The pool of light on the ground and the halo round the paper.
    if (k > 0) {
      const b = k * fl; g.fillStyle = '#ffcf5a';
      g.globalAlpha = .1 * b; g.beginPath(); g.ellipse(bx, gy, 30, 6, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = .14 * b; g.beginPath(); g.ellipse(bx, gy, 17, 3.5, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = .08 * b; g.beginPath(); g.arc(bx + .5, cy, 20, 0, Math.PI * 2); g.fill();
      g.globalAlpha = .13 * b; g.beginPath(); g.arc(bx + .5, cy, 11, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    } else {
      const pu = .5 + .5 * Math.sin(t / 14 + e.ph), sw = e.go >= 0 ? 1 + e.go / CATCH * 2 : 1;
      g.globalAlpha = (.08 + .1 * pu) * sw; g.fillStyle = '#ff9a4a'; g.beginPath(); g.arc(bx + .5, bt + 8, 4 + 2 * pu * sw, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    // The crooked post and its arm, one outlined shape: a kink halfway, a dead twig at the top with a leaf,
    // the arm reaching out to the hook and drooping at the tip, moss at its foot and on the kink.
    const shape = [];
    for (let y = gy - 26; y < gy; y++) { const o = y > gy - 9 ? 0 : y > gy - 18 ? 1 : 0; shape.push([x0 + o, y, WOODL], [x0 + o + 1, y, (y * 7 + e.id.length) % 5 === 0 ? WOODD : WOOD]); }
    for (let x = x0; x <= x0 + 6; x++) shape.push([x, gy - 27, x < x0 + 2 ? WOODL : WOOD]);
    shape.push([x0 + 7, gy - 26, WOOD], [x0 - 1, gy - 27, WOOD], [x0 - 2, gy - 28, WOOD], [x0 - 3, gy - 29, MOSSL], [x0 - 2, gy - 29, MOSS]);
    for (let x = x0 - 3; x <= x0 + 4; x++) shape.push([x, gy - 1, (x & 1) ? MOSS : MOSSL]);
    shape.push([x0 - 2, gy - 2, MOSSL], [x0 + 2, gy - 2, MOSS], [x0 + 3, gy - 2, MOSSL], [x0 + 2, gy - 3, MOSSL], [x0 + 3, gy - 12, MOSS], [x0 + 3, gy - 13, MOSSL]);
    g.fillStyle = OUT; for (const [x, y] of shape) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    for (const [x, y, c] of shape) px(g, x, y, c);
    // Moss hanging from the arm, stirring a touch.
    const hang = Math.round(Math.sin(t / 40 + e.ph) * .6);
    px(g, x0 + 1, gy - 28, MOSSL, 3, 1); px(g, x0 + 2, gy - 26, MOSS); px(g, x0 + 2 + hang, gy - 25, MOSS); px(g, x0 + 4, gy - 26, MOSSL); px(g, x0 + 4 + hang, gy - 25, MOSS); px(g, x0 + 4 + hang, gy - 24, MOSSL);
    // The string.
    for (let i = 0; i < 3; i++) px(g, Math.round(ax + dx * i / 3), ay + i, '#2a2024');
    // The paper lantern: caps of dark wood, eight rows of paper, ribs, a tassel lagging behind the swing.
    const rows = [2, 3, 3, 3, 3, 3, 3, 2];
    px(g, bx - 2, bt, OUT, 5, 1); px(g, bx - 1, bt, CAP, 3, 1);
    for (let r = 0; r < 8; r++) {
      const hw = rows[r], y = bt + 1 + r; px(g, bx - hw - 1, y, OUT, hw * 2 + 3, 1);
      const on = k > 0 && (7 - r) / 8 < k * 1.15, front = k > 0 && k < 1 && Math.abs((7 - r) / 8 - k) < .16;
      for (let xx = -hw; xx <= hw; xx++) {
        const rib = r === 2 || r === 5, vein = Math.abs(xx) === 2 && r > 0 && r < 7, d = Math.hypot(xx / 3.4, (r - 4.2) / 4.2);
        let col;
        if (e.go >= CATCH && e.go < CATCH + 3) col = '#ffffff';
        else if (on) col = front ? '#fff6d6' : rib || vein ? (fl > .9 ? '#d87a2c' : '#c86a28') : d < .38 ? '#fffbe0' : d < .7 ? '#ffe08a' : d < .95 ? '#f8b84c' : '#e8923a';
        else col = rib || vein ? '#262430' : xx === -hw ? '#4e4b60' : xx === hw ? '#2e2c3c' : '#3c3a4c';
        px(g, bx + xx, y, col);
      }
    }
    px(g, bx - 2, bt + 9, OUT, 5, 1); px(g, bx - 1, bt + 9, CAP, 3, 1);
    const tl = clamp(Math.round(-e.sv * 1.5), -1, 1); px(g, bx, bt + 10, TASSEL); px(g, bx + tl, bt + 11, TASSEL); px(g, bx + tl, bt + 12, '#8e2e28');
    // The flame (lit) or the ember (dark) inside.
    if (k >= 1 || (k > 0 && e.go >= CATCH)) {
      const hgt = fl > .92 ? 3 : 2; px(g, bx, cy + 2 - hgt, '#ffffff', 1, hgt); if (fl > .88) px(g, bx + ((t >> 3) % 2 ? 1 : -1), cy + 1, '#fff6d6');
    } else {
      const pu = .5 + .5 * Math.sin(t / 14 + e.ph), sw = e.go >= 0 ? e.go / CATCH : 0, a = clamp(.35 + .65 * pu + sw, 0, 1);
      g.globalAlpha = a; px(g, bx, bt + 7, sw > .5 ? '#ffe08a' : '#ff8a3a'); if (pu > .7 || sw > 0) { g.globalAlpha = a * .5; px(g, bx - 1, bt + 7, '#8a4a3a'); px(g, bx + 1, bt + 7, '#8a4a3a'); px(g, bx, bt + 6, '#6a3e3a'); } g.globalAlpha = 1;
      if (sw > .3) { g.globalAlpha = sw; px(g, bx, bt + 6, '#ffcf5a'); g.globalAlpha = 1; }
    }
    // Company: a moth round the dark one, fireflies round the lit one.
    if (!L.lit.has(e.id)) {
      const mx = Math.round(bx + Math.cos(t / 13 + e.ph) * 7), my = Math.round(cy + Math.sin(t / 9 + e.ph) * 5 - 2);
      px(g, mx, my, '#5a4a40'); if ((t >> 2) & 1) { px(g, mx - 1, my - 1, '#d8c8a8'); px(g, mx + 1, my - 1, '#d8c8a8'); } else { px(g, mx - 1, my, '#b8a888'); px(g, mx + 1, my, '#b8a888'); }
    } else if (k >= 1) {
      for (let i = 0; i < 3; i++) { const ph = e.ph + i * 2.1; firefly(g, bx + Math.sin(t / 61 + ph) * 18, cy - 8 + Math.sin(t / 43 + ph * 2) * 11, Math.max(0, Math.sin(t / 23 + ph * 3)) * .9); }
    }
    // The lighting: a ring of light and the burst of fireflies spiralling up.
    if (e.ring >= 0) {
      const rk = e.ring / 26, r = Math.max(1, 4 + (1 - (1 - rk) * (1 - rk)) * 34);
      g.strokeStyle = '#ffe08a'; g.lineWidth = 1; g.globalAlpha = (1 - rk) * .85; g.beginPath(); g.arc(bx + .5, cy + .5, r, 0, Math.PI * 2); g.stroke();
      if (e.ring > 4) { const r2 = Math.max(1, r * .6); g.globalAlpha = (1 - rk) * .45; g.strokeStyle = '#fff6d6'; g.beginPath(); g.arc(bx + .5, cy + .5, r2, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1;
    }
    for (const f of e.burst) firefly(g, bx + Math.cos(f.a) * f.r, cy + f.h + Math.sin(f.a) * f.r * .45, Math.min(1, (f.max - f.life) / 20) * (.55 + .45 * Math.sin(f.life / 3 + f.ph)));
    if (L.arrive && L.arrive.id === e.id) arriveDraw(e, g);
  }
  // ¡GUARDADO! in gold goo letters above the lantern: they drop in one by one with a squash, hold, then float off.
  function saved(e) {
    const text = '¡GUARDADO!', life = 78;
    L.words.push({ t: 0, life, x: e.x + 7, y: e.y - 22, draw(g, w) {
      const wd = ART.glupWidth(text, 'small'), sx = clamp(Math.round(w.x - Cam.x), wd / 2 + 4, W - wd / 2 - 4), rise = w.t > life - 20 ? (w.t - life + 20) * .5 : 0;
      const sy = clamp(Math.round(w.y - Cam.y - 16 - rise), 6, H - 40), fade = w.t > life - 16 ? (life - w.t) / 16 : 1;
      ART.glup(g, text, sx, sy, { size: 'small', pal: 'oro', align: 'center', shadow: true, each: i => {
        const kk = w.t - i * 2; if (kk < 0) return false;
        const drop = Math.max(0, 6 - kk), land = kk >= 6 && kk < 12 ? Math.sin((kk - 6) / 6 * Math.PI) * .3 : 0;
        return { y: Math.round(-drop * drop * .3 + Math.sin(w.t / 8 + i * .8) * 1), alpha: Math.min(1, kk / 3) * fade, sx: 1 + land, sy: 1 - land + (drop ? .2 : 0) };
      } });
    } });
    if (L.words.length > 12) L.words.shift();
  }
  // ---- Coming back: the fireflies gather where Nila will stand, a warm glow swells and she steps out of it.
  const SHOW = 18;
  function arrive() {
    const ck = L.checkpoint; L.arrive = ck && ck.lantern ? { id: ck.lantern, t: 0, lv: L.def, at: Game.t, flies: Array.from({ length: 12 }, (_, i) => ({ a: i / 12 * Math.PI * 2 + Math.random() * .3, r: 26 + Math.random() * 16, ph: Math.random() * 6 })) } : null;
  }
  function arriveUpdate(e) {
    const A = L.arrive, p = Player; A.t++;
    if (A.t === SHOW) {
      Sound.play('shing'); spawnParts(12, p.x + 5, p.y + 9, { color: ['#ffe08a', '#fff6d6', '#ffffff'], speed: [.4, 1.6], life: [12, 24], g: -.02 });
      const s = ART.nila.idle[0]; L.ghosts.push({ sprite: p.dir > 0 ? s : ART.flip(s), x: p.x - 3, y: p.y - 4, life: 5, grow: .1 }); p.sx = .8; p.sy = 1.2;
    }
    if (A.t > SHOW + 30) L.arrive = null;
  }
  function arriveDraw(e, g) {
    const A = L.arrive, p = Player, tx = p.x + 5 - Cam.x, ty = p.y + 9 - Cam.y, k = clamp(A.t / SHOW, 0, 1);
    // The glow she comes out of.
    const gl = A.t < SHOW ? k : Math.max(0, 1 - (A.t - SHOW) / 26);
    if (gl > 0) { g.fillStyle = '#ffcf5a'; g.globalAlpha = .18 * gl; g.beginPath(); g.ellipse(tx, ty, Math.max(1, 6 + 8 * gl), Math.max(1, 10 + 8 * gl), 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = .3 * gl; g.fillStyle = '#fff6d6'; g.beginPath(); g.ellipse(tx, ty, Math.max(1, 3 + 4 * gl), Math.max(1, 6 + 6 * gl), 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    if (A.t < SHOW) for (const f of A.flies) { const r = f.r * (1 - k * k), a = f.a + k * 2.4; firefly(g, tx + Math.cos(a) * r, ty + Math.sin(a) * r * .8, Math.min(1, A.t / 4) * (.6 + .4 * Math.sin(A.t / 2 + f.ph))); }
  }
  // While she forms out of the light she isn't drawn.
  const hidden = () => !!(L.arrive && L.arrive.lv === L.def && L.arrive.t < SHOW && Game.t - L.arrive.at < 90);
  // The dark levels: a lit lantern opens a wide pool (bigger while it flares), a dark one just a glint of its ember.
  function light(e, hole, fl) {
    const c = center(e);
    if (litNow(e)) { const f = e.go >= CATCH ? Math.max(0, 1 - (e.go - CATCH) / 24) : 0; hole(c.x, c.y, 50 * fl * (1 + f * .6)); }
    else hole(c.x, c.y + 3, 9 + (e.go >= 0 ? e.go : 0), .55);
    if (L.arrive && L.arrive.id === e.id) hole(Player.x + 5, Player.y + 9, 30 * (1 - Math.min(1, Math.abs(L.arrive.t - SHOW) / 30)) + 1, .8);
  }
  return { make, arrive, hidden, light, center };
})();
