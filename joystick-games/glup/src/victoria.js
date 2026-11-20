// GLUP — la victoria. Dos tiempos, como el final de acto de Sonic y el de Rayman:
//  1. En el nivel: la música se corta y suena la fanfarria, la cámara se acerca, Nila salta a la
//     barca dando una vuelta, Bigotes asoma feliz, las crías rescatadas saltan del agua alrededor
//     en arcos y chapuzones, llueve confeti de gotas y luciérnagas, y la barca se va con estela
//     mientras Nila saluda.
//  2. El recuento: «¡NIVEL SUPERADO!» en la letra GLUP: cada letra cuelga como una gota, se suelta,
//     cae estirada, se aplasta con un ¡plof! que sube de tono y tiembla como gelatina; la palabra
//     respira, gotea, echa burbujas y brilla, y el ojo de Bigotes asoma en la O. Luego la cinta con el nombre del nivel, y las
//     líneas cuentan con tic-tic: crías (cada una salta a su hueco), tiempo contra el par, trucos
//     aprendidos (los bocados se estampan) y los puntos; al final cae el sello con la medalla.
//     Nila baila a un lado con Bigotes. Al estilo Sonic, las bonificaciones se vacían a la vez en los
//     puntos. Una pulsación adelanta la cuenta y otra sigue; si no, sigue solo al cabo de unos segundos.
'use strict';
const Victoria = (() => {
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const outBack = k => { if (k >= 1) return 1; const c = 1.8; k -= 1; return 1 + (c + 1) * k * k * k + c * k * k; };
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const CONFETTI = ['#f7c843', '#fff4a8', '#8fd9d0', '#e8fbff', '#d8f58a', '#f07080', '#dc8a2c'];
  const V = { run: null, clear: null };
  // A leaping cría, bigger and outlined so it reads against the water: a Bigotes in miniature.
  let fry = null;
  function frySprites() {
    if (fry) return fry;
    const C = { o: '#1d1826', B: '#b0a458', b: '#6e6238', C: '#f4e1a4', W: '#ffffff', E: '#1d1826', F: '#e0a45a' };
    fry = [ART.sprite(['.....ooo...', 'o..ooBBBoo.', 'oooBBBBBWEo', 'obBbCCCCCCo', 'o.ooCCCCFFo', '.....oooF..'], C, 'fry0'),
      ART.sprite(['.....ooo...', '...ooBBBoo.', 'oooBBBBBWEo', 'obBbCCCCCCo', 'oooooCCCFFo', '.....oooF..'], C, 'fry1')];
    return fry;
  }

  // ================================================================ 1. En el nivel
  const LEAP0 = 8, LAND = 38, CRIA0 = 46, GAP = 6;
  function surfaceOf(b) {
    for (let y = b.y - 12; y < b.y + 40; y++) if (waterAt(b.x + 16, y)) return (y >> 4) * 16 + 3;
    return b.y + 3;
  }
  function start(boat) {
    const p = Player, n = Math.min(L.pearls, 12);
    const sail = LAND + 18;   // she takes the oar and goes; the crías jump around the moving boat
    V.run = { t: 0, boat, x0: p.x, y0: p.y, bx0: boat.x, by0: boat.y, surf: surfaceOf(boat), n, sail, end: sail + 105, crias: [], conf: [], sailV: 0, dip: 0, dipV: 0, pop: 0, popV: 0,
      camX: Cam.x, camY: Cam.y, zoom: 1, fx: null, fy: null, flash: 0, finished: false, nx: p.x, ny: p.y, time: L.time };
    Sound.stopMusic(); Sound.play('fanfare'); Sound.duck(false);
    Input.rumble(160, .5, .5);
    return V.run;
  }
  function active() { return Player.win && !!V.run; }

  // A cría leaps out of the water somewhere around the boat; if that spot is dry land, it tries the other side.
  function launchCria(r, i) {
    const b = r.boat, cx = b.x + 16;
    let side = i % 2 ? 1 : -1, x = cx;
    for (let k = 0; k < 6; k++) { const tx = cx + side * R(20, 54); if (waterAt(tx, r.surf + 4)) { x = tx; break; } side = -side; }
    const c = { x, y: r.surf + 2, vx: -side * R(.5, 1.25), vy: -R(3.4, 4.6), air: true, wait: 0, hops: 0, i, ph: R(0, 6) };
    r.crias.push(c); splash(r, x, 1);
    Sound.play('bloop', i);
  }
  function splash(r, x, k) {
    spawnParts(Math.round(6 + k * 6), x, r.surf, { color: ['#8fd9d0', '#c8f2ea', '#e8fbff'], angle: -Math.PI / 2, spread: .9, speed: [.6, 1.6 + k * 1.4], life: [12, 26], g: .14, kind: 'spray' });
    L.parts.push({ x, y: r.surf + 1, vx: 0, vy: 0, life: 16, color: '#c8f2ea', size: 1, g: 0, kind: 'ripple' });
  }
  function confetti(r, x, y, n, up) {
    for (let i = 0; i < n; i++) r.conf.push({ x: x + R(-6, 6), y: y + R(-4, 4), vx: up ? R(-2.2, 2.2) : R(-.3, .3), vy: up ? -R(1.8, 4.6) : R(.2, .6), rot: R(0, 6), vr: R(-.3, .3), col: pick(CONFETTI), life: R(90, 160), drop: Math.random() < .3 });
  }

  function update() {
    const r = V.run || start(L.exit || { x: Player.x - 10, y: Player.y + Player.h, t: 0 });
    const p = Player, b = r.boat, t = ++r.t;
    Game.winT = t; L.time = r.time;   // the clock stops at the boat
    // ---- Nila: crouch, spinning leap, landing, dance in the boat.
    if (t === LEAP0) { Sound.play('whoosh'); spawnParts(8, r.x0 + 5, r.y0 + 18, { color: ['#c9b08a', '#a08a6a', '#e0c8a0'], angle: -Math.PI / 2, spread: 1.3, speed: [.4, 1.6], life: [10, 20], g: .06 }); }
    if (t === LAND) {
      Sound.play('splash'); Sound.play('land', 1); Cam.shake(3, 10); r.dipV = 3.2; r.pop = -7; r.popV = 0; r.flash = 6; Input.rumble(200, .8, .6);
      splash(r, b.x + 2, 1.2); splash(r, b.x + 30, 1.2);
      confetti(r, b.x + 16, b.y - 16, 46, true);
    }
    if (t > LAND) { r.dipV += -r.dip * .22; r.dipV *= .8; r.dip += r.dipV; r.popV += -r.pop * .25; r.popV *= .78; r.pop += r.popV; }
    b.y = r.by0 + Math.round(r.dip);
    const bob = Math.round(Math.sin(b.t / 22) * 1.5), seatX = b.x + 10, seatY = b.y - 14 + bob;
    if (t < LEAP0) { r.nx = r.x0; r.ny = r.y0; }
    else if (t < LAND) {
      const k = (t - LEAP0) / (LAND - LEAP0);
      r.nx = r.x0 + (seatX - r.x0) * ease(k); r.ny = r.y0 + (seatY - r.y0) * k - Math.sin(k * Math.PI) * 26;
      if (t % 2 === 0) L.parts.push({ x: r.nx + 5, y: r.ny + 9, vx: 0, vy: 0, life: 14, color: pick(['#fff4a8', '#f7c843', '#e8fbff']), size: 1, g: -.02, kind: 'dot' });
    } else { r.nx = seatX; r.ny = seatY; }
    p.x = r.nx; p.y = r.ny;
    // ---- The crías burst out of the water one after another, then hop along after the boat.
    for (let i = 0; i < r.n; i++) if (t === CRIA0 + i * GAP) launchCria(r, i);
    for (const c of r.crias) {
      if (c.air) {
        c.vy += .17; c.x += c.vx; c.y += c.vy;
        if (c.vy > 0 && c.y >= r.surf + 1) { c.air = false; c.y = r.surf + 2; c.wait = R(8, 26); splash(r, c.x, .5); if (Math.random() < .5) Sound.play('blub'); }
        if (c.vy < 0 && c.vy > -.3 && Math.random() < .6) { L.parts.push({ x: c.x, y: c.y - 6, vx: 0, vy: -.4, life: 30, color: '#f05070', size: 1, g: 0, kind: 'dot' }); }
      } else {
        c.x += r.sailV * .92 + Math.sin((t + c.ph * 20) / 9) * .15;
        if (--c.wait <= 0 && (c.hops < 2 || t > r.sail)) {
          let target = t > r.sail ? b.x - 8 - (c.i % 6) * 9 : b.x + 16 + (c.x < b.x + 16 ? -1 : 1) * R(18, 46);
          if (!waterAt(target, r.surf + 4)) target = 2 * (b.x + 16) - target;
          c.hops++; c.air = true; c.vy = -R(2.4, 3.6); c.vx = Math.max(-1.4, Math.min(1.4 + r.sailV, (target - c.x) / 36 + r.sailV)); splash(r, c.x, .4);
        }
      }
    }
    // ---- Confetti of drops and petals, fireflies around the boat.
    if (t > LAND && t < r.sail + 50 && t % 3 === 0) confetti(r, Cam.x + R(0, W), Cam.y - 4, 1, false);
    if (t > LAND && t % 4 === 0) L.parts.push({ x: b.x + R(-30, 60), y: b.y - R(10, 50), vx: R(-.15, .15), vy: R(-.2, 0), life: 120, color: '#f2f5a0', size: 1, g: 0, kind: 'fly', ph: R(0, 6) });
    for (let i = r.conf.length - 1; i >= 0; i--) { const q = r.conf[i]; q.vy = Math.min(q.vy + .07, q.drop ? 2.4 : .9); q.vx *= .97; q.x += q.vx + Math.sin(q.rot) * .3; q.y += q.vy; q.rot += q.vr; if (--q.life <= 0 || q.y > r.surf + 2) { if (q.y > r.surf && q.drop && waterAt(q.x, r.surf + 4)) L.parts.push({ x: q.x, y: r.surf + 1, vx: 0, vy: 0, life: 10, color: '#c8f2ea', size: 1, g: 0, kind: 'ripple' }); r.conf.splice(i, 1); } }
    // ---- Sail away with a wake.
    if (t === r.sail) Sound.play('whoosh');
    if (t > r.sail) {
      r.sailV = Math.min(2.4, r.sailV + .045); b.x += r.sailV; p.x = r.nx = b.x + 10;
      if (t % 3 === 0) { L.parts.push({ x: b.x + 4, y: r.surf + 1, vx: 0, vy: 0, life: 18, color: '#c8f2ea', size: 1, g: 0, kind: 'ripple' }); spawnParts(2, b.x + 1, r.surf, { color: ['#8fd9d0', '#e8fbff'], angle: -Math.PI / 2 - .7, spread: .4, speed: [.5, 1.6], life: [10, 18], g: .12, kind: 'spray' }); }
      if (t % 5 === 0) spawnParts(2, b.x + 31, r.surf, { color: ['#c8f2ea', '#ffffff'], angle: -Math.PI / 2 + .6, spread: .4, speed: [.5, 1.2], life: [8, 14], g: .12, kind: 'spray' });
    }
    // ---- Camera: close in on the boat, then hold still and let it sail out of frame.
    const zt = Game.still ? 1.2 : t < 40 ? 1 + .45 * ease(t / 40) : t < r.sail ? 1.45 : 1.45 - .3 * ease((t - r.sail) / 60);
    r.zoom = zt;
    if (t <= r.sail + 28) {
      r.camX += (Math.max(0, Math.min(L.w * TS - W, b.x + 16 - W / 2)) - r.camX) * .12;
      r.camY += (Math.max(0, Math.min(L.h * TS - H, b.y - 24 - H / 2 + 20)) - r.camY) * .12;
      r.fwx = b.x + 16; r.fwy = b.y - 14;
    }
    Cam.x = r.camX; Cam.y = r.camY; Cam.zoom = r.zoom;
    const hw = W / (2 * r.zoom), hh = H / (2 * r.zoom);
    Cam.fx = Math.max(hw, Math.min(W - hw, r.fwx - Cam.x)); Cam.fy = Math.max(hh, Math.min(H - hh, r.fwy - Cam.y));
    if (r.flash > 0) r.flash--;
    // ---- Off to the tally. A press after the landing hurries it along.
    const press = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Game.tapped;
    const gone = t > r.sail + 30 && b.x - Cam.x > W / r.zoom + 8;
    if (!r.finished && (gone || t >= r.end || (t > LAND + 10 && press))) { r.finished = true; Game.tapped = false; Game.finishLevel(); }
  }

  // Nila with Bigotes at (x, y) (hitbox corner, screen); optional spin, squash, a waving arm.
  function drawNila(g, x, y, o) {
    const N = ART.nila, cx = x + 5, pivY = o.rot ? y + 9 : y + 18;
    g.save(); g.translate(cx, pivY); if (o.rot) g.rotate(o.rot); g.scale(o.sx || 1, o.sy || 1); g.translate(-cx, -pivY);
    Player.carryLook = { mood: o.mood }; Player.drawCarry(g, x, y, o.spr || N.win, o.fish || ART.fish.full, o.bob || 0); Player.carryLook = null;
    if (o.wave !== undefined) drawArm(g, x - 2, y + 8, o.wave);
    g.restore();
  }
  // The free arm raised and waving: a yellow sleeve with its outline and a little hand.
  function drawArm(g, sx, sy, a) {
    const n = 8, pts = []; for (let k = 0; k <= n; k++) pts.push([Math.round(sx + Math.cos(a) * k), Math.round(sy + Math.sin(a) * k)]);
    g.fillStyle = '#3b2335'; for (const [px, py] of pts) g.fillRect(px - 1, py - 1, 3, 3);
    g.fillStyle = '#f7c843'; for (const [px, py] of pts.slice(0, n - 1)) g.fillRect(px, py, 1, 1);
    const [hx, hy] = pts[n]; g.fillStyle = '#3b2335'; g.fillRect(hx - 2, hy - 2, 4, 4); g.fillStyle = '#fcdcbc'; g.fillRect(hx - 1, hy - 1, 2, 2); g.fillStyle = '#fff4e0'; g.fillRect(hx - 1, hy - 1, 1, 1);
  }
  function drawWorld(g) {
    const r = V.run; if (!r) return;
    const t = r.t, b = r.boat, N = ART.nila;
    // Crías that are under water show only a head bump and bubbles.
    for (const c of r.crias) if (!c.air) { g.fillStyle = '#665a36'; const x = Math.round(c.x - Cam.x), y = Math.round(r.surf - Cam.y); if ((t + c.i * 7) % 20 < 14) g.fillRect(x - 1, y, 3, 1); }
    let o;
    if (t < LEAP0) { const k = t / LEAP0; o = { spr: N.idle[0], sy: 1 - .22 * k, sx: 1 + .16 * k, mood: 'shock' }; }
    else if (t < LAND) { const k = (t - LEAP0) / (LAND - LEAP0); o = { spr: k < .5 ? N.jump : N.fall, rot: Game.still ? 0 : ease(k) * Math.PI * 2, sx: k < .2 ? .88 : 1, sy: k < .2 ? 1.14 : 1, mood: 'shock', fish: ART.fish.open }; }
    else {
      const d = t - LAND, squash = d < 14 ? Math.exp(-d / 4) * Math.cos(d / 1.8) : 0, sail = t > r.sail;
      const hop = !sail && d > 30 && (d % 48) < 14 ? Math.sin((d % 48) / 14 * Math.PI) * 5 : 0;
      o = { spr: hop > 0 ? N.jump : (t >> 3) % 2 ? N.win : N.idle[0], sx: 1 + squash * .3, sy: 1 - squash * .3, mood: 'happy', fish: (d % 48) < 16 && d > 4 ? ART.fish.open : ART.fish.full, bob: Math.round(r.pop), hopY: hop };
      if (sail) { o.hopY = 0; o.spr = N.idle[0]; o.oar = true; }
    }
    drawNila(g, Math.round(r.nx - Cam.x), Math.round(r.ny - Cam.y - (o.hopY || 0)), o);
    if (o.oar) Barca.oar(g, Math.round(r.nx - Cam.x) + 10, Math.round(r.ny - Cam.y) + 12, t, 1, 1.6);
    // The front of the hull over her boots, so she stands inside the boat.
    const bob = Math.round(Math.sin(b.t / 22) * 1.5), bx = Math.round(b.x - Cam.x), by = Math.round(b.y - Cam.y - 7 + bob);
    if (t >= LAND - 2) g.drawImage(ART.boat, 0, 6, 32, 6, bx, by + 6, 32, 6);
    // Leaping crías, bent along their arc.
    for (const c of r.crias) if (c.air) {
      const spr = frySprites()[((t >> 2) + c.i) % 2];
      g.save(); g.translate(Math.round(c.x - Cam.x), Math.round(c.y - Cam.y)); g.scale(c.vx < 0 ? -1 : 1, 1); g.rotate(Math.atan2(c.vy, Math.abs(c.vx) + .01) * .8); g.drawImage(spr, -6, -3); g.restore();
    }
    // Confetti: flat petals that flutter and turn, and falling drops.
    for (const q of r.conf) {
      const x = Math.round(q.x - Cam.x), y = Math.round(q.y - Cam.y); g.fillStyle = q.col; g.globalAlpha = Math.min(1, q.life / 20);
      if (q.drop) { g.fillStyle = '#c8f2ea'; g.fillRect(x, y, 1, 2); } else { const w = Math.abs(Math.cos(q.rot)) > .5 ? 2 : 1; g.fillRect(x, y, w, 3 - w); }
      g.globalAlpha = 1;
    }
    if (r.flash > 0 && !Game.still) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = r.flash / 6 * .45; g.fillStyle = '#fffbe0'; g.fillRect(0, 0, W, H); g.restore(); }
  }

  // ================================================================ 2. El recuento
  // «¡NIVEL SUPERADO!» in the Letra GLUP (letra.js): every letter swells as a drop hanging from the top of the screen,
  // lets go, falls stretched and lands with a splat, wobbles like jelly and settles; then the word breathes, drips,
  // blows bubbles and shines, and Bigotes' eye peeks out of the O and follows the count.
  const TITLE = '¡NIVEL SUPERADO!', TY = 6, FALL = 7;
  function titleLayout() {
    const L = Glup.layout(TITLE, 'big', 'musgo'), off = Math.round((W - L.w) / 2);
    return L.items.map(it => ({ ch: it.ch, gl: it.gl, x: off + it.x, cx: off + it.cx, i: it.i, y: TY - it.gl.top }));
  }
  // A letter plopping in: it falls h pixels in n frames, stretched, then lands squashed and wobbles back (false before it starts).
  function plop(d, h = 14, n = 5) {
    if (d < 0) return false;
    if (d < n) { const k = d / n; return { y: -h * (1 - k * k), sx: 1 - .25 * k, sy: 1 + .4 * k }; }
    const e = d - n, q = e < 30 ? Math.exp(-e / 5) * Math.cos(e / 1.4) : 0; return { y: 0, sx: 1 + q * .45, sy: 1 - q * .4 };
  }
  const MEDALS = {
    bronce: { name: 'BRONCE', stars: 1, rim: '#7a4424', face: '#c07a44', hi: '#f0b27a', lo: '#8e5230' },
    plata: { name: 'PLATA', stars: 2, rim: '#5a6474', face: '#b8c4d0', hi: '#f2f6fa', lo: '#7d8a9a' },
    oro: { name: 'ORO', stars: 3, rim: '#7a5a14', face: '#f2c43a', hi: '#fff4a8', lo: '#c08a1c' },
    perfecto: { name: '¡PERFECTO!', stars: 3, rim: '#6a2a6a', face: '#f2c43a', hi: '#ffffff', lo: '#c08a1c', rainbow: true } };

  const LT0 = 6, LGAP = 3, CGAP = 6, TGAP = 14;
  function startClear() {
    const s = Game.clearStats || { name: '', pearls: 0, total: 0, secs: 0, last: false };
    const par = s.par || 200, fast = s.secs <= par, ratio = s.total ? s.pearls / s.total : 1;
    const rank = ratio >= 1 && fast ? 'perfecto' : ratio >= 1 || (ratio >= .75 && fast) ? 'oro' : ratio >= .5 ? 'plata' : 'bronce';
    const tricks = s.tricks || [], boss = !!s.boss;
    const items = titleLayout(), titleEnd = LT0 + items.length * LGAP + 8;
    const T = { banner: titleEnd, crias0: titleEnd + 16 };
    T.criasEnd = T.crias0 + Math.max(1, s.pearls) * CGAP + 8;
    T.time0 = T.criasEnd + 2; T.timeEnd = T.time0 + 30; T.bonus = T.timeEnd + 4;
    T.tricks0 = T.bonus + 12; T.tricksEnd = T.tricks0 + Math.max(1, boss ? 1 : tricks.length) * TGAP + 4;
    const pts = { crias: s.pearls * 100, time: fast ? (par - s.secs) * 10 : 0, tricks: tricks.length * 500, all: s.total && s.pearls >= s.total ? 1000 : 0, boss: boss ? 5000 : 0 };
    // Sonic-style: the rows give way to a page of bonuses that all drain into the score at once.
    const bank = { crias: pts.crias + pts.all, time: pts.time, tricks: pts.tricks + pts.boss }, sum = bank.crias + bank.time + bank.tricks;
    const rate = Math.max(10, Math.ceil(sum / 80)), D = Math.ceil(Math.max(bank.crias, bank.time, bank.tricks, 1) / rate);
    T.total = T.tricksEnd + 20; T.page = T.total; T.drain0 = T.page + 40; T.drainEnd = T.drain0 + D; T.rank = T.drainEnd + 18; T.end = T.rank + 40; T.auto = T.end + 170;
    V.clear = { s, par, fast, rank, tricks, boss, items, T, pts, bank, rate, target: 0, shown: 0, shake: 0, parts: [], rings: [], jig: {}, flash: 0, record: s.prevBest !== undefined && s.prevBest !== null && s.secs < s.prevBest, skipped: false, doneT: -1,
      goo: [], bubs: [], punch: null, drip: items.map(() => ({ a: 0, len: -R(20, 150), max: R(6, 11), v: R(.05, .11) })), eye: { lx: 0, ly: .5, tx: 0, ty: .5, blink: -99, glance: 0 },
      bannerW: ART.textWidth((Game.level + 1) + ' · ' + s.name) + 30 };
  }
  // How much of each bonus has drained into the score by frame t, and what's left in each.
  function drained(c, t) { const k = Math.max(0, t - c.T.drain0) * c.rate, b = c.bank; return { crias: Math.min(b.crias, k), time: Math.min(b.time, k), tricks: Math.min(b.tricks, k) }; }
  function scoreAt(c, t) { const d = drained(c, t); return d.crias + d.time + d.tricks; }
  function burst(c, x, y, n, cols, spd, up, kind) { for (let i = 0; i < n; i++) { const a = up ? -Math.PI / 2 + R(-.9, .9) : R(0, Math.PI * 2), v = spd * R(.4, 1.2); c.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: R(16, 34), max: 34, col: pick(cols), g: kind === 'spark' ? .02 : .12, kind: kind || 'dot', rot: R(0, 6) }); } }
  const medalPos = { x: 280, y: 92 };
  const ROW = { x0: 88, x1: 238, crias: 60, time: 86, tricks: 108, total: 134 };

  function updateClear() {
    if (!V.clear) startClear();
    const c = V.clear; if (Game.frozen) return;
    Game.clearT++;
    const t = Game.clearT, T = c.T, s = c.s;
    // Title letters splat in, each a note higher; the last one lands with a punch and the whole word jumps.
    for (const it of c.items) if (t === LT0 + it.i * LGAP + FALL) splatLetter(c, it, t);
    if (t === T.banner - 4) {
      Sound.play('clear'); Sound.play('glup', 1.3); c.flash = 5; c.hopT = t; c.shake = Math.max(c.shake, 5); c.punch = { t, x: W / 2, y: TY + 16, a: .07 }; Input.rumble(160, .7, .4);
      burst(c, W / 2, 20, 20, CONFETTI, 2.6, false, 'conf');
      for (const it of c.items) for (let k = 0; k < 2; k++) c.goo.push({ x: it.cx + R(-3, 3), y: TY + R(0, 10), vx: R(-1.2, 1.2), vy: -R(1.5, 3.2), r: Math.random() < .4 ? 1 : 0, life: R(30, 60) });
    }
    updateGoo(c, t);
    if (t === T.banner + 2) Sound.play('whoosh');
    // Crías hop into their slots.
    for (let i = 0; i < s.pearls; i++) if (t === T.crias0 + i * CGAP) { Sound.play('tick', i); const q = slotPos(c, i); burst(c, q.x + 4, q.y + 4, 6, ['#e8fbff', '#8fd9d0', '#ffffff'], 1.4, false, 'spark'); }
    if (s.total && s.pearls >= s.total && t === T.criasEnd - 4) { Sound.play('stamp', 0); c.shake = 4; burst(c, ROW.x1 - 10, ROW.crias + 3, 14, CONFETTI, 2, false, 'conf'); }
    // The clock runs up with ticks.
    if (t >= T.time0 && t < T.timeEnd && (t - T.time0) % 3 === 0) Sound.play('tick', 4 + ((t - T.time0) / 3 | 0) % 5);
    if (t === T.bonus) { if (c.fast) { Sound.play('kaching'); burst(c, ROW.x1 - 16, ROW.time + 12, 12, ['#ffe36a', '#fff6d6'], 1.8, true, 'spark'); } else Sound.play('thud'); if (c.record) c.shake = 3; }
    // Morsels stamp in.
    const nt = c.boss ? 1 : c.tricks.length;
    for (let i = 0; i < nt; i++) if (t === T.tricks0 + i * TGAP + 6) { Sound.play('slam', 8 + i); c.shake = 4; const x = trickX(i) + 8; burst(c, x, ROW.tricks + 12, 10, ['#ffe36a', '#fff6d6', '#e79b3f'], 1.8, false, 'spark'); c.rings.push({ x, y: ROW.tricks + 8, t: 0 }); }
    // The score rolls up to whatever has been revealed.
    c.target = c.shown = scoreAt(c, t);
    if (t === T.page) Sound.play('whoosh');
    for (const [i, key] of ['crias', 'time', 'tricks'].entries()) if (t === T.page + 8 + i * 6) Sound.play('slam', 3 + i);
    if (t > T.drain0 && t <= T.drainEnd) { Sound.play('tick', (t - T.drain0) % 12); for (const key of ['crias', 'time', 'tricks']) { const b = c.bank[key]; if (b && Math.min(b, (t - T.drain0) * c.rate) === b && Math.min(b, (t - 1 - T.drain0) * c.rate) < b) { c.zero = c.zero || {}; c.zero[key] = t; } } }
    if (t === T.drainEnd + 1) { Sound.play('kaching'); c.flash = 4; c.totalPop = t; burst(c, ROW.x1 - 20, 124, 18, ['#ffe36a', '#fff6d6', '#ffffff'], 2.2, false, 'spark'); }
    // The medal stamp.
    if (t === T.rank) landMedal(c);
    for (let i = 0; i < MEDALS[c.rank].stars; i++) if (t === T.rank + 10 + i * 8) { Sound.play('kaching'); burst(c, medalPos.x + (i - (MEDALS[c.rank].stars - 1) / 2) * 13, medalPos.y - 32, 8, ['#ffe36a', '#ffffff'], 1.6, false, 'spark'); }
    // (the +1000 for all crías and the Heron's +5000 are inside the bonus page now)
    // Nila's dance: a few notes and hearts.
    if (t % 26 === 0) c.parts.push({ x: 44 + R(-8, 8), y: 80, vx: R(-.2, .2), vy: -.45, life: 60, max: 60, col: pick(['#fff6d6', '#ffe36a', '#8fd9d0']), g: 0, kind: 'note', rot: R(0, 6) });
    if (t > T.rank && t % 40 === 0) burst(c, medalPos.x + R(-16, 16), medalPos.y + R(-16, 16), 3, ['#ffffff', '#fff4a8'], .6, false, 'spark');
    // Particles.
    for (let i = c.parts.length - 1; i >= 0; i--) { const p = c.parts[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += .2; if (p.kind === 'conf') { p.vx *= .96; p.vy = Math.min(p.vy, 1.2); } if (p.kind === 'note') p.x += Math.sin(p.life / 8) * .3; if (--p.life <= 0) c.parts.splice(i, 1); }
    for (const q of c.rings) q.t++; c.rings = c.rings.filter(q => q.t < 16);
    if (c.shake > 0) c.shake--; if (c.flash > 0) c.flash--;
    // A first press fast-forwards the count; the next one moves on.
    const press = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Game.tapped || (t >= T.auto && !c.left);
    if (press) {
      Game.tapped = false; if (t >= T.auto) c.left = true;
      if (t < T.rank) { Game.clearT = T.rank; c.shown = c.target = scoreAt(c, T.end); landMedal(c); }
      else if (t > T.rank + 10) {
        Sound.play('confirm');
        if (s.last) Game.transition(() => { Game.state = 'ending'; Game.endT = 0; Sound.playMusic('dock'); });
        else Game.transition(() => Game.select(Game.level, Game.level + 1));
      }
    }
  }
  function landMedal(c) {
    if (c.landed) return; c.landed = true;
    Sound.play('stamp', 1); Sound.play('splash'); c.shake = 8; c.flash = 4; c.punch = { t: Game.clearT, x: medalPos.x, y: medalPos.y, a: .05 }; c.splat = splatCanvas();
    for (let k = 0; k < 12; k++) { const a = R(0, Math.PI * 2), v = R(1.2, 3); c.goo.push({ x: medalPos.x + Math.cos(a) * 14, y: medalPos.y + Math.sin(a) * 14, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, r: Math.random() < .5 ? 1 : 0, life: R(30, 55) }); }
    burst(c, medalPos.x, medalPos.y, 26, ['#ffffff', '#fff4a8', MEDALS[c.rank].face], 2.6, false, 'spark');
    if (c.rank === 'perfecto' || c.rank === 'oro') burst(c, medalPos.x, medalPos.y - 10, 30, CONFETTI, 3, true, 'conf');
    c.rings.push({ x: medalPos.x, y: medalPos.y, t: 0, big: true });
    Input.rumble(220, 1, .6);
  }
  function slotPos(c, i) {
    const n = Math.max(1, c.s.total), span = ROW.x1 - ROW.x0 - 34, step = Math.min(10, Math.floor(span / n));
    return { x: ROW.x0 + i * step, y: ROW.crias + 10 };
  }
  const trickX = i => ROW.x0 + 42 + i * 22;

  // ---- drawing
  function panelBox(g, x, y, w, h) {
    g.fillStyle = 'rgba(20,26,38,.86)'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = '#e79b3f'; g.fillRect(x + 2, y, w - 4, 1); g.fillRect(x + 2, y + h - 1, w - 4, 1);
    g.fillStyle = '#3a4a5e'; g.fillRect(x, y + 2, 1, h - 4); g.fillRect(x + w - 1, y + 2, 1, h - 4);
  }
  // ---- the goo: landing splats, drips that let go and splash where they land, bubbles
  const BANNER_Y = 41, PANEL_Y = 54;
  function splatLetter(c, it, t) {
    Sound.play('bloop', Math.round(it.i * 9 / Math.max(1, c.items.length - 1))); Sound.play('pop');
    c.shake = Math.max(c.shake, 2); c.jig[it.i - 1] = t; c.jig[it.i + 1] = t;
    const by = it.y + it.gl.base - 2;
    for (let k = 0; k < 7; k++) { const s = k % 2 ? 1 : -1; c.goo.push({ x: it.cx + s * R(2, 8), y: by - R(0, 5), vx: s * R(.5, 2.2), vy: -R(.8, 2.8), r: Math.random() < .3 ? 1 : 0, life: R(24, 40) }); }
    burst(c, it.cx, by, 4, ['#fff3b8', '#dccd68', '#ffffff'], 1.3, true);
    c.rings.push({ x: it.cx, y: by + 2, t: 0, splat: true });
  }
  // Where a falling drop lands: on the ribbon, on the panel, or off the bottom.
  function floorAt(c, x, t) {
    if (t >= c.T.banner + 12 && Math.abs(x - W / 2) < c.bannerW / 2) return BANNER_Y;
    if (t >= c.T.crias0 - 2 && x > ROW.x0 - 6 && x < ROW.x1 + 6) return PANEL_Y;
    return H + 8;
  }
  function updateGoo(c, t) {
    const T = c.T;
    // Drips swell under the landed letters and let go; the letter springs back a hair.
    for (const it of c.items) {
      const q = c.drip[it.i], n = it.gl.drips.length; if (!n || t < LT0 + it.i * LGAP + FALL + 14) continue;
      q.len += q.len > q.max * .75 ? q.v * 2.5 : q.v;
      if (q.len >= q.max) {
        const a = it.gl.drips[q.a] || it.gl.drips[0]; c.goo.push({ x: it.x + a.x, y: it.y + a.y + q.len - 1, vx: 0, vy: .6, r: 1, life: 400, drop: true });
        c.jig[it.i] = t; q.len = -R(40, 160); q.a = (Math.random() * n) | 0; q.max = R(6, 11); q.v = R(.05, .11);
      }
    }
    Glup.gooStep(c.goo, x => floorAt(c, x, t));
    // Bubbles rise off the letters now and then and pop.
    if (t > T.banner + 10 && t % 29 === 0) { const it = pick(c.items); c.bubs.push({ x: it.cx + R(-3, 3), y: TY + R(0, 6), vy: -R(.22, .4), r: 0, max: R(1.2, 2.8), t: 0, life: R(50, 95), ph: R(0, 6) }); }
    for (let i = c.bubs.length - 1; i >= 0; i--) { const b = c.bubs[i]; b.t++; b.y += b.vy; b.r = Math.min(b.max, b.t / 10); if (b.t > b.life + 5 || b.y < -6) c.bubs.splice(i, 1); }
    // Bigotes' eye in the O: it follows the count, then glances about; it blinks.
    const e = c.eye;
    if (t < T.crias0) { e.tx = -.2; e.ty = .8; }
    else if (t < T.page) { e.tx = -.7; e.ty = 1; }
    else if (t < T.rank - 4) { e.tx = .5; e.ty = 1; }
    else if (t < T.rank + 70) { e.tx = 1; e.ty = .6; }
    else if (t % 90 === 0) { const L = [[-1, .8], [1, .6], [0, -1], [0, 0], [-.6, -.6], [.8, 1]]; [e.tx, e.ty] = pick(L); }
    e.lx += (e.tx - e.lx) * .2; e.ly += (e.ty - e.ly) * .2;
    if (t % 150 === 70 || (t % 150 === 80 && (t / 150 | 0) % 3 === 0) || t === T.rank + 2) e.blink = t;
  }
  // The splat of goo behind the medal: a blob with spokes and beads, drawn once.
  function splatCanvas() {
    const S = 90, c = ART.canvas(S, S), g = c.getContext('2d'), P = Glup.PAL.musgo, m = S / 2;
    const spokes = []; for (let i = 0; i < 9; i++) spokes.push({ a: i / 9 * Math.PI * 2 + R(-.25, .25), len: R(6, 20), r: R(2, 4.2) });
    const disc = (x, y, r) => { const R2 = Math.max(0, r); for (let dy = -Math.ceil(R2); dy <= Math.ceil(R2); dy++) { const hw = Math.round(Math.sqrt(Math.max(0, R2 * R2 - dy * dy))); g.fillRect(Math.round(x - hw), Math.round(y + dy), hw * 2 + 1, 1); } };
    const shape = (grow, dy) => { disc(m, m + dy, 23 + grow); for (const s of spokes) { const n = 8; for (let k = 0; k <= n; k++) { const d = 18 + s.len * k / n, r = (4 - 2.2 * k / n) * (k === n ? s.r / 3 + .6 : 1); disc(m + Math.cos(s.a) * d, m + Math.sin(s.a) * d + dy, r + grow); } } };
    g.fillStyle = Glup.OUT; shape(1, 0); g.fillStyle = P.ext[0]; shape(0, 0); g.fillStyle = P.drip[1]; shape(-1, -1); g.fillStyle = P.drip[0]; shape(-2, -2);
    g.fillStyle = P.drip[2]; for (const s of spokes) { const d = 18 + s.len; g.fillRect(Math.round(m + Math.cos(s.a) * d - 1), Math.round(m + Math.sin(s.a) * d - 2), 1, 1); }
    return c;
  }
  function drawGoo(g, c) { Glup.gooDraw(g, c.goo); for (const b of c.bubs) Glup.bubble(g, b); }
  // Bigotes' eye set in the O, like the G of the logo: a round eyeball whose pupil follows the count, and a lid of goo.
  function drawEye(g, gl, c, t, landT) {
    const H = gl.hole; if (!H) return; const d = t - landT; if (d < 0) return;
    const e = c.eye, bd = t - e.blink, ex = Math.round((H.x0 + H.x1) / 2), ey = H.y0 + 5;
    let lid = d < 8 ? 1 : d < 14 ? 1 - (d - 8) / 6 : 0; if (bd >= 0 && bd < 8) lid = Math.max(lid, 1 - Math.abs(bd - 3.5) / 4);
    g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey - 3, 7, 7); g.fillRect(ex - 2, ey - 4, 5, 9); g.fillRect(ex - 4, ey - 2, 9, 5);
    g.fillStyle = '#fffbe6'; g.fillRect(ex - 2, ey - 2, 5, 5); g.fillRect(ex - 3, ey - 1, 7, 3); g.fillRect(ex - 1, ey - 3, 3, 7);
    g.fillStyle = '#d8d0b8'; g.fillRect(ex - 1, ey + 3, 3, 1); g.fillRect(ex + 2, ey + 1, 1, 2);
    const lx = Math.max(-1, Math.min(1, Math.round(e.lx * 1.3))), ly = Math.max(-1, Math.min(1, Math.round(e.ly * 1.3)));
    g.fillStyle = '#1a1420'; g.fillRect(ex - 1 + lx, ey - 1 + ly, 2, 3); g.fillStyle = '#ffffff'; g.fillRect(ex - 1 + lx, ey - 1 + ly, 1, 1);
    if (lid > .05) { const rows = Math.max(1, Math.round(7 * lid)); g.fillStyle = gl.P.fill[4]; g.fillRect(ex - 3, ey - 3, 7, rows); g.fillRect(ex - 2, ey - 4, 5, 1); g.fillStyle = gl.P.fill[1]; g.fillRect(ex - 2, ey - 4, 5, 1); g.fillStyle = '#1a1420'; g.fillRect(ex - 3, ey - 4 + rows, 7, 1); }
  }
  // One title letter: falling stretched, splatting, wobbling, nudged by its neighbours, hopping and breathing.
  function letterPose(c, it, t) {
    const T = c.T, d = t - (LT0 + it.i * LGAP), side = it.i % 2 ? 1 : -1;
    if (d < 0) return null;
    if (d < FALL) { const k = d / FALL; return { y: -70 * (1 - k * k), sx: 1 - .3 * k, sy: 1 + .55 * k, rot: (1 - k) * .3 * side }; }
    const dd = d - FALL, sq = dd < 40 ? Math.exp(-dd / 6) * Math.cos(dd / 1.45) : 0;
    let y = 0, sx = 1 + sq * .55, sy = 1 - sq * .45, rot = dd < 40 ? Math.exp(-dd / 9) * Math.sin(dd / 2.3) * .09 * side : 0;
    const jd = c.jig[it.i] !== undefined ? t - c.jig[it.i] : 99; if (jd >= 0 && jd < 16) { const j = Math.exp(-jd / 4) * Math.cos(jd / 1.3) * .14; sy -= j; sx += j * .8; }
    // The word jumps for joy together, then now and then again as a wave.
    const hopK = c.hopT !== undefined ? t - c.hopT - 8 : -1, hk = hopK >= 0 ? (hopK - it.i * 2) / 16 : -1;
    if (hk >= 0 && hk < 1) { y -= Math.sin(hk * Math.PI) * 9; if (hk < .5) { sy += .14; sx -= .1; } }
    else if (hk >= 1 && hk < 1.6) { const q = Math.sin((hk - 1) / .6 * Math.PI); sy -= q * .25; sx += q * .2; }
    const idle = t > T.banner + 60 ? (t - T.banner) % 240 : -1, ik = idle >= 0 ? (idle - it.i * 3) / 14 : -1;
    if (ik >= 0 && ik < 1) { y -= Math.sin(ik * Math.PI) * 5; if (ik < .5) { sy += .08; sx -= .06; } }
    else if (ik >= 1 && ik < 1.5) { const q = Math.sin((ik - 1) * 2 * Math.PI); sy -= q * .16; sx += q * .12; }
    // Breathing: a slow wave runs along the word.
    if (t > T.banner) { const b = Math.sin(t / 16 - it.i * .55) * .04; sy += b; sx -= b * .7; y += Math.round(Math.sin((t + it.i * 9) / 24)); }
    return { y, sx, sy, rot };
  }
  function drawTitle(g, c, t) {
    const T = c.T;
    // Each letter first swells as a drop hanging from the top of the screen, then lets go.
    for (const it of c.items) { const d = t - (LT0 + it.i * LGAP); if (d >= -9 && d < 4) Glup.drip(g, Math.round(it.cx), 0, d < 0 ? (d + 9) / 9 * 13 : 6 * (1 - d / 4), it.gl.P); }
    // A shine sweeps along the word every few seconds.
    const sk = t > T.banner + 20 ? ((t - T.banner - 20) % 200) / 45 : 2, sweep = sk < 1 ? -40 + sk * (W + 80) : null;
    const poses = c.items.map(it => letterPose(c, it, t));
    c.items.forEach((it, k) => { const p = poses[k]; if (p && p.y > -20) Glup.letter(g, it.gl, it.x + 2, it.y + p.y + 3, { sx: p.sx, sy: p.sy, rot: p.rot, tint: '#140c1c', alpha: .35 }); });
    c.items.forEach((it, k) => {
      const p = poses[k]; if (!p) return; const q = c.drip[it.i], dr = []; if (q.len > 0) dr[q.a] = q.len;
      const landT = LT0 + it.i * LGAP + FALL;
      Glup.letter(g, it.gl, it.x, it.y + p.y, { sx: p.sx, sy: p.sy, rot: p.rot, drips: dr, shine: sweep === null ? null : sweep - it.x, extra: it.ch === 'O' ? (gg, gl) => drawEye(gg, gl, c, t, landT) : null });
    });
  }
  function drawBanner(g, c, t) {
    const d = t - c.T.banner, k = ease(d / 14); if (k <= 0) return;
    const label = (Game.level + 1) + ' · ' + c.s.name, tw = ART.textWidth(label), w = Math.round((tw + 30) * k), x = Math.round(W / 2 - w / 2), y = BANNER_Y;
    // The band gulps open: it overshoots, squashes and springs back like the letters.
    const j = d > 10 && d < 44 ? Math.exp(-(d - 10) / 6) * Math.sin((d - 10) / 1.6) : 0;
    g.save(); g.translate(W / 2, y + 6); g.scale(1 - j * .05, 1 + j * .4); g.translate(-W / 2, -(y + 6));
    // Folded ribbon tails, then the band.
    g.fillStyle = '#8a3a2a'; g.fillRect(x - 8, y + 3, 10, 9); g.fillRect(x + w - 2, y + 3, 10, 9);
    g.fillStyle = '#1b2430'; g.fillRect(x - 8, y + 7, 3, 1); g.fillRect(x - 7, y + 6, 1, 3); g.fillRect(x + w + 5, y + 7, 3, 1); g.fillRect(x + w + 6, y + 6, 1, 3);
    g.fillStyle = '#5a2418'; g.fillRect(x, y + 11, 3, 1); g.fillRect(x + w - 3, y + 11, 3, 1);
    g.fillStyle = '#c8543a'; g.fillRect(x, y, w, 11); g.fillStyle = '#e8785a'; g.fillRect(x, y, w, 1); g.fillStyle = '#9a3a28'; g.fillRect(x, y + 10, w, 1);
    // The name types itself in, each letter popping up from below.
    if (k > .8) Letra.text(g, label, Math.round(W / 2 - tw / 2), y + 2, { color: '#fff6d6', shadow: '#5a2418', shown: Game.still ? undefined : Math.max(0, (d - 11) * 1.5) });
    g.restore();
  }
  // A value that gulps in: squashed flat when it changes, then it springs back taller and settles.
  function gulpText(g, str, x, y, col, align, d, amp = 1, shadow = '#1b2430') {
    const w = ART.textWidth(str), ax = Math.round(align === 'right' ? x - w / 2 : align === 'center' ? x : x + w / 2);
    const q = d >= 0 && d < 18 ? Math.exp(-d / 4) * Math.cos(d / 1.3) * amp : 0;
    if (!q) { ART.text(g, str, ax, y, col, 'center', shadow); return; }
    g.save(); g.translate(ax, y + 7); g.scale(1 + q * .4, 1 - q * .4); ART.text(g, str, 0, -7, col, 'center', shadow); g.restore();
  }
  function drawRows(g, c, t) {
    const T = c.T, s = c.s, x0 = ROW.x0, x1 = ROW.x1;
    if (t < T.crias0 - 12) return;
    const k = ease((t - (T.crias0 - 12)) / 10);
    g.save(); g.globalAlpha = k; panelBox(g, x0 - 6, 54, x1 - x0 + 12, 98); g.restore();
    if (k < 1) return;
    // Page two: the rows slide out to the left and the bonus page takes over.
    if (t >= T.page) { const out = Math.min(1, (t - T.page) / 10); g.save(); g.beginPath(); g.rect(x0 - 5, 55, x1 - x0 + 10, 96); g.clip(); if (out < 1) { g.translate(-Math.round(ease(out) * 180), 0); g.globalAlpha = 1 - out; drawRowsBody(g, c, t); g.globalAlpha = 1; g.translate(Math.round(ease(out) * 180), 0); } drawBonusPage(g, c, t); g.restore(); return; }
    drawRowsBody(g, c, t);
  }
  // The Sonic-style bonus page: each bonus counts down while the score counts up, all at once. Headings and numbers
  // plop in letter by letter in the Letra GLUP; the numbers wobble while they drain and gulp when they hit zero.
  function drawBonusPage(g, c, t) {
    const T = c.T, x0 = ROW.x0, x1 = ROW.x1, d = drained(c, t), rolling = t > T.drain0 && t <= T.drainEnd;
    const rows = [['crias', 'CRÍAS', 62], ['time', 'TIEMPO', 79], ['tricks', c.boss ? 'GARZA' : 'TRUCOS', 96]];
    rows.forEach(([key, label, y], i) => {
      const dt = t - (T.page + 4 + i * 6); if (dt < 0) return;
      const left = c.bank[key] - d[key], zd = c.zero && c.zero[key] ? t - c.zero[key] : 99, empty = !left && t > T.drain0;
      const q = zd >= 0 && zd < 18 ? Math.exp(-zd / 4) * Math.cos(zd / 1.3) : 0;
      if (dt > 3) ART.text(g, 'bonus', x0, y + 5, '#5f7899');
      ART.glup(g, label, x0 + 27, y, { size: 'small', pal: empty ? 'gris' : 'musgo', each: k => plop(dt - k * 1.5, 12, 4) });
      ART.glup(g, String(left), x1, y, { size: 'small', pal: empty ? 'gris' : 'oro', align: 'right', each: k => {
        const p = plop(dt - 6 - k * 1.5, 10, 4); if (!p) return false;
        if (rolling && left) p.y += ((t >> 1) + k) % 3 === 0 ? -1 : 0;
        p.sx += q * .45; p.sy -= q * .45; return p; } });
    });
    if (t >= T.page + 22) {
      const dt = t - (T.page + 22), pd = c.totalPop ? t - c.totalPop : 99, pop = pd >= 0 && pd < 24 ? Math.exp(-pd / 5) * Math.cos(pd / 1.4) : 0;
      g.fillStyle = '#3a4a5e'; for (let x = x0; x <= x1; x += 3) g.fillRect(x, 115, 2, 1);
      ART.glup(g, 'PUNTOS', x0, 126, { size: 'small', pal: 'oro', each: k => plop(dt - k * 1.5, 12, 4) });
      ART.glup(g, String(Math.floor(c.shown)).padStart(5, '0'), x1, 120, { size: 'mid', pal: 'oro', align: 'right', shadow: true, each: k => {
        const p = plop(dt - 4 - k * 2, 14, 5); if (!p) return false;
        if (rolling) { const w = Math.sin(t / 2 + k * 1.3); p.y += Math.round(w); p.sy += w * .06; p.sx -= w * .04; }
        p.sx += pop * .35; p.sy -= pop * .35; return p; } });
    }
  }
  function drawRowsBody(g, c, t) {
    const T = c.T, s = c.s, x0 = ROW.x0, x1 = ROW.x1;
    // Crías.
    const got = Math.min(s.pearls, Math.max(0, Math.floor((t - T.crias0) / CGAP) + 1) * (t >= T.crias0 ? 1 : 0));
    ART.text(g, 'Crías', x0, ROW.crias, '#9fc0cc');
    gulpText(g, got + '/' + s.total, x1, ROW.crias, got >= s.total && s.total ? '#ffe36a' : '#e8fbff', 'right', got ? t - (T.crias0 + (got - 1) * CGAP) : 99, 1, null);
    for (let i = 0; i < s.total; i++) {
      const q = slotPos(c, i), d = t - (T.crias0 + i * CGAP);
      if (i < got) {
        const sc = d < 10 ? outBack(d / 10) * (1 + .4 * Math.exp(-d / 4)) : 1, hop = d >= 10 ? Math.max(0, Math.sin((t + i * 11) / 9)) * (t > T.rank ? 2 : 0) : 0;
        g.save(); g.translate(q.x + 4.5, q.y + 4.5 - hop); g.scale(sc, sc); g.drawImage(ART.cria[((t >> 4) + i) % 3], -4.5, -4.5); g.restore();
      } else { g.globalAlpha = .35; g.drawImage(ART.tint(ART.cria[0], '#5f7899'), q.x, q.y); g.globalAlpha = 1; }
    }
    if (s.total && s.pearls >= s.total && t >= T.criasEnd - 4) stampText(g, '¡TODAS!', x1, ROW.crias + 11, t - (T.criasEnd - 4), '#ffe36a', -.12, 'right');
    // Time against the par.
    if (t >= T.time0) {
      const secs = Math.round(s.secs * Math.min(1, (t - T.time0) / (T.timeEnd - T.time0)));
      ART.text(g, 'Tiempo', x0, ROW.time, '#9fc0cc'); gulpText(g, Game.fmtTime(secs), x1, ROW.time, '#e8fbff', 'right', t < T.timeEnd ? (t - T.time0) % 3 : t - T.timeEnd + 30, .45, null);
      ART.text(g, 'Par ' + Game.fmtTime(c.par), x0, ROW.time + 10, '#5f7899');
      if (t >= T.bonus) {
        const d = t - T.bonus;
        if (c.fast) stampText(g, '¡RÁPIDO! +' + c.pts.time, x1, ROW.time + 10, d, '#ffe36a', 0, 'right');
        else ART.text(g, 'sin prisa', x1, ROW.time + 10, '#5f7899', 'right');
        if (c.record) stampText(g, '¡RÉCORD!', x0 + 76, ROW.time + 10, d - 6, '#f07080', .1);
      }
    }
    // Tricks learned here (or the Heron beaten).
    if (t >= T.tricks0) {
      ART.text(g, c.boss ? 'Garza' : 'Trucos', x0, ROW.tricks + 4, '#9fc0cc');
      if (c.boss) { const d = t - T.tricks0 - 6; if (d >= 0) stampText(g, '¡VENCIDA!', x1, ROW.tricks + 4, d, '#ffe36a', -.1, 'right'); }
      else {
        const all = s.tricksAll || c.tricks;
        all.forEach((pw, i) => {
          const have = c.tricks.includes(pw), d = t - (T.tricks0 + i * TGAP + 6), x = trickX(i), y = ROW.tricks;
          const spr = ART.morsels[pw]; if (!spr) return;
          if (have && d >= -6) {
            const k = d < 0 ? (d + 6) / 6 : 1, sc = d < 0 ? 4 - 2 * k : 2 * (1 + (d < 10 ? Math.exp(-d / 3) * Math.cos(d / 1.5) * .25 : 0));
            g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.translate(x + 8, y + 8); g.rotate(d < 0 ? (1 - k) * .8 : 0); g.scale(sc, sc); g.drawImage(spr, -4, -4); g.restore();
          } else if (!have) { g.globalAlpha = .3; g.drawImage(ART.tint(spr, '#5f7899'), x, y, 16, 16); g.globalAlpha = 1; }
          // One teacher per level: name the trick beside its morsel.
          if (all.length === 1 && d >= 4 && POWERS[pw]) ART.text(g, POWERS[pw].name, x + 22, y + 4, have ? '#ffe36a' : '#5f7899', 'left');
        });
        if (t >= T.tricksEnd - 6) ART.text(g, c.tricks.length + '/' + all.length, x1, ROW.tricks + 4, '#e8fbff', 'right');
      }
    }
    // Points (page two shows them now).
    if (false) {
      g.fillStyle = '#3a4a5e'; for (let x = x0; x <= x1; x += 3) g.fillRect(x, ROW.total - 5, 2, 1);
      ART.text(g, 'Puntos', x0, ROW.total, '#f2c46a');
      const str = String(Math.floor(c.shown)).padStart(5, '0'), rolling = c.shown < c.target;
      ART.text(g, str, x1, ROW.total + (rolling && (t & 2) ? -1 : 0), rolling ? '#fff6d6' : '#ffe36a', 'right', '#1b2430');
    }
  }
  // A word that slams down like a rubber stamp: big and tilted, then settles with a wobble.
  function stampText(g, str, x, y, d, col, tilt = 0, align = 'left') {
    if (d < 0) return;
    const w = ART.textWidth(str), ax = align === 'right' ? x - w / 2 : align === 'center' ? x : x + w / 2;
    const s = d < 6 ? 3 - 2 * (d / 6) : 1 + (d < 16 ? Math.exp(-(d - 6) / 3) * Math.cos((d - 6) / 1.4) * .25 : 0);
    g.save(); g.globalAlpha = Math.min(1, d / 3 + .2); g.translate(Math.round(ax), y + 3); g.rotate(tilt * (d < 6 ? 2 : 1)); g.scale(s, s); ART.text(g, str, 0, -3, col, 'center', '#1b2430'); g.restore();
  }
  function drawMedal(g, c, t) {
    const T = c.T, M = MEDALS[c.rank], d = t - T.rank; if (d < -10) return;
    let s = 1, rot = 0, a = 1;
    if (d < 0) { const k = (d + 10) / 10; s = 4 - 3 * k * k; rot = (1 - k) * -1.2; a = k; }
    else if (d < 20) { s = 1 + Math.exp(-d / 4) * Math.cos(d / 1.3) * .22; }
    rot += Math.sin(t / 30) * .05;
    const { x, y } = medalPos, r = 20;
    // The splat of goo it landed in: it bursts out with the stamp, wobbles and then breathes.
    if (c.splat && d >= 0) { const k = d < 10 ? outBack(d / 10) : 1, j = d < 30 ? Math.exp(-d / 6) * Math.sin(d / 1.5) * .12 : 0, b = Math.sin(t / 22) * .02; g.save(); g.translate(x, y + 4); g.scale(k * (1 + j + b), k * (1 - j - b)); g.drawImage(c.splat, -45, -45); g.restore(); }
    g.save(); g.globalAlpha = Math.max(0, Math.min(1, a)); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    // Ribbon tails behind.
    g.fillStyle = '#2a5a9a'; g.fillRect(-12, 10, 8, 20); g.fillStyle = '#c8543a'; g.fillRect(4, 10, 8, 20);
    g.fillStyle = '#1b2430'; for (let i = 0; i < 4; i++) { g.fillRect(-12 + i, 29 - i, 1, 1 + i); g.fillRect(-4 - i - 1, 29 - i, 1, 1 + i); g.fillRect(4 + i, 29 - i, 1, 1 + i); g.fillRect(12 - i - 1, 29 - i, 1, 1 + i); }
    // Rays behind a rainbow medal.
    if (M.rainbow) { const cols = ['#f07080', '#ffe36a', '#8fd9d0', '#a0a8ff']; for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2 + t / 40; g.fillStyle = cols[i % 4]; g.globalAlpha = .55 * Math.max(0, Math.min(1, a)); for (let k = r + 2; k < r + 9; k++) g.fillRect(Math.round(Math.cos(an) * k), Math.round(Math.sin(an) * k), 2, 2); } g.globalAlpha = Math.max(0, Math.min(1, a)); }
    const disc = (rr, col) => { g.fillStyle = col; for (let dy = -rr; dy <= rr; dy++) { const hw = Math.round(Math.sqrt(rr * rr - dy * dy)); g.fillRect(-hw, dy, hw * 2 + 1, 1); } };
    disc(r + 1, '#1b2430'); disc(r, M.rim); disc(r - 2, M.lo); disc(r - 3, M.face);
    // Shine: an upper-left crescent and a sweeping glint.
    g.fillStyle = M.hi; for (let dy = -r + 4; dy < -2; dy++) { const hw = Math.round(Math.sqrt((r - 4) * (r - 4) - dy * dy)); g.fillRect(-hw, dy, Math.max(1, Math.round(hw * .5)), 1); }
    const sweep = ((t - T.rank) % 120) / 20; if (sweep < 1) { g.fillStyle = '#ffffff'; g.globalAlpha *= .7; for (let k = -r; k < r; k++) { const sx = Math.round(-r + sweep * r * 2 + k * .4); if (sx * sx + k * k < (r - 3) * (r - 3)) g.fillRect(sx, k, 2, 1); } g.globalAlpha = Math.max(0, Math.min(1, a)); }
    // A big embossed star in the middle.
    const st = ART.glyph('★', M.hi), sd = ART.glyph('★', M.rim);
    if (sd && st) { g.drawImage(sd, -7, -6, 15, 21); g.drawImage(sd, -8, -7, 15, 21); g.drawImage(sd, -6, -7, 15, 21); g.drawImage(st, -7, -7, 15, 21); }
    g.restore();
    // The rating stars pop in above the medal one by one.
    for (let i = 0; i < M.stars; i++) {
      const sd2 = d - 10 - i * 8; if (sd2 < 0) continue;
      const sc = sd2 < 8 ? outBack(sd2 / 8) * 2 : 2, sx = x + (i - (M.stars - 1) / 2) * 13, sy = y - 32 + (M.stars === 3 && i === 1 ? -3 : 0);
      const big = ART.glyph('★', '#ffe36a'), rim = ART.glyph('★', '#1b2430');
      g.save(); g.translate(Math.round(sx), Math.round(sy)); g.rotate(sd2 < 8 ? (1 - sd2 / 8) * 1.5 : Math.sin(t / 20 + i) * .08); g.scale(sc, sc);
      if (rim) { g.drawImage(rim, -2.5, -1.5); g.drawImage(rim, -3.5, -2.5); g.drawImage(rim, -1.5, -2.5); } if (big) g.drawImage(big, -2.5, -2.5); g.restore();
    }
    // The medal's name plops in in goo of its own metal (a rainbow of goo for a perfect run).
    if (d >= 0) {
      const lab = c.rank === 'perfecto' ? 'PERFECTO' : M.name, pal = { bronce: 'cobre', plata: 'gris', oro: 'oro' }[c.rank] || 'oro', w = Glup.width(lab, 'small', 0);
      ART.glup(g, lab, Math.min(x, W - 1 - w / 2), y + 30, { size: 'small', pal, align: 'center', gap: 0, shadow: true, each: i => {
        const p = plop(d - 2 - i * 2, 16, 5); if (!p) return false;
        if (M.rainbow) p.pal = ['fresa', 'oro', 'agua', 'lila'][(i + (t >> 3)) % 4];
        p.y += Math.round(Math.sin(t / 10 + i * .8) * .8); return p; } });
    }
  }
  function drawDancer(g, c, t) {
    // Nila and Bigotes at 2×, dancing on the bank: bounce, crouch, jump with a spin, waves.
    const N = ART.nila, k = t % 128, x = 9, feet = 64;
    let spr = (t >> 3) % 2 ? N.win : N.idle[0], hy = 0, rot = 0, sx = 1, sy = 1, fish = ART.fish.full, wave;
    if (k < 24) { spr = (k >> 3) % 2 ? N.win : N.idle[0]; hy = Math.abs(Math.sin(k / 24 * Math.PI * 2)) * 2; }
    else if (k < 32) { const q = (k - 24) / 8; sy = 1 - .2 * Math.sin(q * Math.PI); sx = 1 + .15 * Math.sin(q * Math.PI); spr = N.idle[0]; }
    else if (k < 56) { const q = (k - 32) / 24; hy = Math.sin(q * Math.PI) * 18; spr = q < .5 ? N.jump : N.fall; fish = ART.fish.open; if ((t >> 7) % 2) rot = q * Math.PI * 2; }
    else if (k < 64) { const q = (k - 56) / 8; sy = 1 - .25 * Math.sin(q * Math.PI); sx = 1 + .2 * Math.sin(q * Math.PI); }
    else if (k < 96) { spr = N.win; wave = -Math.PI / 2 - .55 + Math.sin(t * .3) * .4; fish = (k >> 3) % 2 ? ART.fish.open : ART.fish.full; }
    else { spr = (k >> 2) % 2 ? N.win : N.idle[0]; hy = Math.abs(Math.sin((k - 96) / 32 * Math.PI * 4)) * 3; }
    // A round shadow on the bank.
    g.fillStyle = 'rgba(10,8,20,.35)'; const sw = 22 - Math.round(hy * .6); g.fillRect(x * 2 + 22 - sw / 2 + 4, feet * 2 - 1, sw, 2);
    g.save(); g.scale(2, 2);
    drawNila(g, x, feet - 18 - hy, { spr, rot, sx, sy, fish, mood: 'happy', wave });
    g.restore();
  }
  function drawClear(g) {
    if (!V.clear) startClear();
    const c = V.clear, t = Game.clearT, T = c.T;
    const theme = L.def ? L.def.theme : 'dusk';
    const sh = c.shake > 0 && !Game.still ? c.shake * .6 : 0, ox = Math.round(R(-sh, sh)), oy = Math.round(R(-sh, sh));
    g.save(); g.translate(ox, oy);
    // A punch: the picture jumps closer around the hit (the last letter, the medal) and eases back.
    const pd = c.punch ? t - c.punch.t : 99; if (pd >= 0 && pd < 24 && !Game.still) { const z = 1 + c.punch.a * Math.exp(-pd / 5); g.translate(c.punch.x, c.punch.y); g.scale(z, z); g.translate(-c.punch.x, -c.punch.y); }
    Game.drawScene(g, Game.t, theme);
    g.fillStyle = 'rgba(8,10,16,.5)'; g.fillRect(-4, -4, W + 8, H + 8);
    // Sunburst behind the title.
    g.save(); g.translate(W / 2, 22); g.globalAlpha = .07; g.fillStyle = '#fff4a8';
    for (let i = 0; i < 14; i++) { const a0 = i / 14 * Math.PI * 2 + t / 200; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * 260, Math.sin(a0) * 260); g.lineTo(Math.cos(a0 + .18) * 260, Math.sin(a0 + .18) * 260); g.fill(); }
    g.restore();
    drawDancer(g, c, t);
    drawRows(g, c, t);
    drawMedal(g, c, t);
    drawBanner(g, c, t);
    drawTitle(g, c, t);
    drawGoo(g, c);
    for (const q of c.rings) if (q.splat) { const k = q.t / 16, rx = 4 + k * 16; g.globalAlpha = (1 - k) * .8; g.fillStyle = '#dccd68'; for (let a = 0; a < 28; a++) { const an = a / 28 * Math.PI * 2; g.fillRect(Math.round(q.x + Math.cos(an) * rx), Math.round(q.y + Math.sin(an) * rx * .25), 1, 1); } g.globalAlpha = 1; }
    for (const q of c.rings) if (!q.splat) { const rr = (q.big ? 8 : 4) + q.t * (q.big ? 2.4 : 1.2); g.strokeStyle = '#fff4a8'; g.globalAlpha = 1 - q.t / 16; g.beginPath(); g.arc(q.x, q.y, rr, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    for (const p of c.parts) {
      const x = Math.round(p.x), y = Math.round(p.y); g.globalAlpha = Math.min(1, p.life / 12); g.fillStyle = p.col;
      if (p.kind === 'spark') { g.fillRect(x, y, 1, 1); if (p.life > 12) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
      else if (p.kind === 'conf') { const w = Math.abs(Math.cos(p.rot)) > .5 ? 2 : 1; g.fillRect(x, y, w, 3 - w); }
      else if (p.kind === 'txt') ART.text(g, p.txt, x, y, p.col, 'center', '#1b2430');
      else if (p.kind === 'note') { g.fillRect(x, y, 1, 5); g.fillRect(x - 2, y + 4, 3, 2); g.fillRect(x + 1, y, 2, 1); g.fillRect(x + 2, y + 1, 1, 1); }
      else g.fillRect(x, y, 1, 1);
      g.globalAlpha = 1;
    }
    g.restore();
    if (c.flash > 0 && !Game.still) { g.globalAlpha = c.flash / 6 * .35; g.fillStyle = '#fffbe0'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t > T.rank + 10) { const k = Math.min(1, (t - T.end) / (T.auto - T.end)); if (k > 0) { g.fillStyle = '#1b2430'; g.fillRect(150, 175, 100, 3); g.fillStyle = '#f2c46a'; g.fillRect(151, 176, Math.round(98 * k), 1); } }
    if (t > T.rank + 10 && (t >> 5) % 2 === 0) { const msg = (Touch.enabled ? 'Toca · ' : '') + (c.s.last ? 'Continuar →' : 'Al mapa →'); ART.text(g, msg, 200, 166, '#fff6d6', 'center', '#1b2430'); }
    else if (t < T.rank && t > 30) ART.text(g, Touch.enabled ? 'Toca para adelantar' : 'Z adelanta', W - 6, 170, '#5f7899', 'right');
  }

  // ================================================================ Captura
  // ?escena=victoria&n=nivel&t=fotogramas&x=crías que faltan (fase de nivel y luego el recuento).
  function capture(c) {
    Game.startLevel(c.n); Game.banner = 0;
    if (!L.exit && L.def.boss && typeof Boss !== 'undefined' && Boss.won) { if (L.boss) L.boss.dead = true; Boss.won(); }
    const b = L.exit || (() => { const e = Item.boat((L.w - 5) * TS + 4, (L.h - 3) * TS + 14); L.ents.push(e); return e; })();
    L.pearls = Math.max(0, L.pearlsTotal - Math.max(0, c.x)); L.time = 60 * 150;
    Player.x = b.x - 14; Player.y = b.y - 20; Player.onGround = true; Cam.snap();
    Game.levelClear(b);
    for (let i = 0; i < c.t; i++) { Input.held = {}; Input.pressed = {}; Game.update(); }
    Game.frozen = true;
  }

  return { start, active, update, drawWorld, startClear, updateClear, drawClear, capture, get run() { return V.run; }, reset() { V.run = null; V.clear = null; } };
})();
