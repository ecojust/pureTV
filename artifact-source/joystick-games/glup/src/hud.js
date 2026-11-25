// GLUP — el HUD. Corazones que laten, se rompen y se rellenan; un medallón con la cara de
// Bigotes y una burbuja con lo que lleva en la boca (lo que traga vuela hasta ella, el agua
// se mece dentro, la carga es un anillo); las crías vuelan al contador; barra de la Garza.
'use strict';
const Hud = (() => {
  const S = { hp: 3, hearts: [{}, {}, {}], shake: 0, held: null, heldT: 0, fly: [], out: null, pearls: 0, pop: 0, bossHp: 0, bossLag: 0, bossShake: 0, bossRef: null, level: -1 };
  const C = { o: '#2a0f1c', R: '#e2445a', W: '#ffd0d8', r: '#a82a44', eR: '#3a2632', eW: '#4a3440', er: '#2e1e28' };
  const HEART = ['.ooo...ooo.', 'oRRRo.oRRRo', 'oRWRRoRRRRo', 'oRWRRRRRRro', 'oRRRRRRRRro', '.oRRRRRRro.', '..oRRRRro..', '...oRRro...', '....oro....', '.....o.....'];
  let heartFull = null, heartEmpty = null;
  function heartSprites() {
    if (heartFull) return;
    const mk = (map) => { const c = document.createElement('canvas'); c.width = 11; c.height = 10; const g = c.getContext('2d'); HEART.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = map[ch]; g.fillRect(x, y, 1, 1); })); return c; };
    heartFull = mk({ o: C.o, R: C.R, W: C.W, r: C.r }); heartEmpty = mk({ o: C.o, R: C.eR, W: C.eW, r: C.er });
  }
  const ease = k => 1 - (1 - k) * (1 - k);

  // ---------------------------------------------------------------- Estado
  function reset() { S.hp = Player.hp; S.hearts = [{}, {}, {}]; S.held = Player.held; S.fly = []; S.out = null; S.pearls = L.pearls; S.pop = 0; S.shake = 0; S.bossHp = 0; S.bossLag = 0; S.bossRef = null; }
  function update() {
    if (S.level !== Game.level || S.lt > L.time) { S.level = Game.level; reset(); }
    S.lt = L.time;
    const p = Player;
    // Hearts: lost ones break, healed ones pop back in.
    if (p.hp < S.hp) { for (let i = p.hp; i < S.hp && i < 3; i++) S.hearts[i] = { breakT: 1 }; S.shake = 10; }
    else if (p.hp > S.hp) { for (let i = S.hp; i < p.hp && i < 3; i++) S.hearts[i] = { fillT: 1 }; }
    S.hp = p.hp;
    for (const h of S.hearts) { if (h.breakT) h.breakT++; if (h.fillT) h.fillT++; if (h.breakT > 50) delete h.breakT; if (h.fillT > 24) delete h.fillT; }
    if (S.shake > 0) S.shake--;
    // What's in the mouth: a new load flies in from the fish, a spat load shoots out of the bubble.
    if (p.held !== S.held) {
      if (p.held && (!S.held || S.held.kind !== p.held.kind || p.held !== S.held)) { const m = p.mouth(); S.fly.push({ sprite: p.held.sprite, kind: p.held.kind, x: m.x - Cam.x, y: m.y - Cam.y, t: 0, to: 'bubble' }); S.heldT = 0; }
      else if (!p.held && S.held) S.out = { sprite: S.held.sprite, kind: S.held.kind, t: 0 };
      S.held = p.held;
    }
    S.heldT++;
    if (S.out) { S.out.t++; if (S.out.t > 18) S.out = null; }
    // Crías: each one rescued flies to the counter.
    if (L.pearls > S.pearls) { for (let i = S.pearls; i < L.pearls; i++) S.fly.push({ sprite: ART.cria[0], kind: 'cria', x: p.x + 5 - Cam.x, y: p.y + 4 - Cam.y, t: -i * 4 % 12, to: 'crias' }); S.pearls = L.pearls; }
    for (let i = S.fly.length - 1; i >= 0; i--) { const f = S.fly[i]; f.t++; if (f.t >= 22) { if (f.to === 'crias') S.pop = 14; else S.gulp = 12; S.fly.splice(i, 1); } }
    if (S.pop > 0) S.pop--; if (S.gulp > 0) S.gulp--;
    // The heron's bar: a white lag chases the red.
    const b = L.boss; if (b && b !== S.bossRef) { S.bossRef = b; S.bossHp = b.hp; S.bossLag = b.hp; }
    if (b) { if (b.hp < S.bossHp) S.bossShake = 14; S.bossHp = b.hp; if (S.bossLag > b.hp) S.bossLag = Math.max(b.hp, S.bossLag - .03); if (S.bossShake > 0) S.bossShake--; }
  }

  // ---------------------------------------------------------------- Dibujo
  const BUBBLE = { x: 44, y: 32, r: 11 }, MED = { x: 17, y: 32, r: 11 };
  // On phones with room outside the picture (portrait band, landscape side columns) the HUD lives outside it, on its
  // own little canvas (drawExt): the picture stays clean and the flying items head for the screen edge it sits on.
  let EXT = false, ext = null;
  function counterPos() { return EXT ? { x: 7, y: 50 } : { x: (Touch.enabled && !Touch.portrait ? W - 108 : W - 44), y: 5 }; }
  function circle(g, cx, cy, r, col) { g.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); } }
  function ring(g, cx, cy, r, col, from = 0, to = 1, step = 1) { g.fillStyle = col; const n = Math.ceil(r * 7); for (let i = 0; i < n; i++) { const u = i / n; if (u < from || u > to) continue; if (step > 1 && i % step) continue; const a = -Math.PI / 2 + u * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); } }
  function sprIn(g, spr, cx, cy, maxS, rot = 0, sx = 1, sy = 1) {
    if (!spr) return; const s = Math.min(1, maxS / Math.max(spr.width, spr.height)); g.save(); g.translate(Math.round(cx), Math.round(cy)); g.rotate(rot); g.scale(s * sx, s * sy); g.drawImage(spr, -spr.width / 2, -spr.height / 2); g.restore();
  }
  function drawHearts(g, t) {
    heartSprites(); const low = Player.hp === 1 && !Player.dead;
    for (let i = 0; i < 3; i++) {
      const h = S.hearts[i], x = 5 + i * 13, y = 4, full = i < Player.hp;
      // A heartbeat that runs along the row, much faster when only one is left.
      const beatT = low ? (t % 40) : ((t + i * 12) % 150), beat = low && i === 0 ? (beatT < 6 ? 1 - beatT / 6 : beatT > 10 && beatT < 15 ? .6 * (1 - (beatT - 10) / 5) : 0) : (beatT < 8 ? Math.sin(beatT / 8 * Math.PI) * .3 : 0);
      let s = full ? 1 + beat * .28 : 1, dx = 0, dy = 0;
      if (h.fillT) { const k = h.fillT / 24; s = 1 + (1 - ease(k)) * .9 * Math.cos(k * 9); }
      g.drawImage(heartEmpty, x, y);
      if (low && i === 0) { g.globalAlpha = .25 + beat * .35; circle(g, x + 5, y + 5, 8, '#e2445a'); g.globalAlpha = 1; g.drawImage(heartEmpty, x, y); }
      if (h.breakT) {
        // White flash and shiver, then the two halves fall apart with shards.
        const k = h.breakT;
        if (k < 10) { dx = (Math.random() - .5) * 3; g.drawImage(k < 5 ? ART.tint(heartFull, '#ffffff') : heartFull, x + dx, y); }
        else { const f = k - 10, fall = f * f * .08; g.save(); g.globalAlpha = Math.max(0, 1 - f / 40);
          g.save(); g.translate(x + 3, y + 5 + fall); g.rotate(-f * .04); g.drawImage(heartFull, 0, 0, 6, 10, -3 - f * .3, -5, 6, 10); g.restore();
          g.save(); g.translate(x + 8, y + 5 + fall); g.rotate(f * .04); g.drawImage(heartFull, 6, 0, 5, 10, -2 + f * .3, -5, 5, 10); g.restore();
          g.fillStyle = C.R; for (let j = 0; j < 5; j++) g.fillRect(Math.round(x + 5 + Math.cos(j * 1.3) * f * .8), Math.round(y + 5 - 6 + f * .5 + j + fall * .5), 1, 1);
          g.restore(); }
        continue;
      }
      if (!full) continue;
      if (h.fillT) {
        // Refilling from the bottom, with sparkles.
        const k = Math.min(1, h.fillT / 12), rows = Math.ceil(10 * k); g.save(); g.translate(x + 5.5, y + 5); g.scale(s, s); g.drawImage(heartFull, 0, 10 - rows, 11, rows, -5.5, -5 + 10 - rows, 11, rows); g.restore();
        g.fillStyle = '#fff6d6'; for (let j = 0; j < 4; j++) { const a = j * 1.57 + h.fillT * .2, r = 4 + h.fillT * .5; if (h.fillT < 18) g.fillRect(Math.round(x + 5 + Math.cos(a) * r), Math.round(y + 5 + Math.sin(a) * r), 1, 1); }
        continue;
      }
      g.save(); g.translate(x + 5.5, y + 5); g.scale(s, s); g.drawImage(heartFull, -5.5, -5); g.restore();
    }
  }
  function drawMouth(g, t) {
    const p = Player, held = p.held, charge = p.charge || 0, full = charge >= CHARGE_FULL;
    const gulp = S.gulp || 0, gs = gulp ? 1 + Math.sin((12 - gulp) / 12 * Math.PI * 2) * .18 * (gulp / 12) : 1;
    const out = S.out, outK = out ? out.t / 18 : 0;
    // Medallion with Bigotes' face.
    const mx = MED.x, my = MED.y, jit = full ? (Math.random() - .5) * 1.4 : 0;
    circle(g, mx, my, MED.r + 1, '#120c18'); circle(g, mx, my, MED.r, '#1f3a3a'); circle(g, mx, my - 2, MED.r - 3, '#2a4a46');
    const face = p.spitT > 6 ? ART.fish.spit : full ? ART.fish.squint : held ? ART.fish.full : p.sucking ? ART.fish.open : (t % 200) < 6 || p.hurtT > 0 ? ART.fish.blink : ART.fish.closed;
    g.save(); g.beginPath(); g.arc(mx, my, MED.r - .5, 0, 7); g.clip(); const fw = face.width; g.drawImage(face, fw - 15, 0, 15, face.height, Math.round(mx - 8 + jit), Math.round(my - face.height / 2), 15, face.height);
    Player.fishOverlay(g, face, Math.round(mx - 8 + jit) - (fw - 15), Math.round(my - face.height / 2), t, { noWhiskers: true, mood: p.hurtT > 0 || p.dizzyT > 40 ? 'sad' : p.happyT > 0 ? 'happy' : p.sucking || charge > 8 ? 'mad' : p.idleT > 900 ? 'sleep' : null, lx: 1 });
    if (p.sucking && !held) {
      const lv = p.suckLv || 1, n = 2 + lv * 2; g.fillStyle = lv === 3 ? '#fff6d6' : '#cfe8f0';
      for (let i = 0; i < n; i++) { const k = ((t * (.12 + lv * .05) + i / n) % 1); g.fillRect(Math.round(mx + 10 - k * 8), Math.round(my - 4 + (i * 9 / n)), 2 + (lv === 3 ? 1 : 0), 1); }
    }
    g.restore();
    ring(g, mx, my, MED.r + 1, '#f2c46a', 0, 1, 1); ring(g, mx, my, MED.r, '#8a6a3a', 0, 1, 1);
    if (p.sucking && !held) {
      const lv = p.suckLv || 1;
      // The steps of the inhale: little pips that light up one by one, only as many as Bigotes has grown into
      // (one, then two after the 3rd trick, three after the 6th).
      const cap = p.suckCap || 1;
      for (let i = 0; i < cap; i++) { const on = i < lv, px = Math.round(mx - 1 - (cap - 1) * 3 + i * 6), py = Math.round(my + MED.r + 3), pop = on && i === lv - 1 && p.suckPulse > 8 ? 1 : 0;
        g.fillStyle = '#120c18'; g.fillRect(px - 1 - pop, py - 1 - pop, 5 + pop * 2, 5 + pop * 2); g.fillStyle = on ? (lv === 3 ? '#f2c46a' : '#8fe0f0') : '#3a4658'; g.fillRect(px - pop, py - pop, 3 + pop * 2, 3 + pop * 2); if (on) { g.fillStyle = '#ffffff'; g.fillRect(px - pop, py - pop, 1, 1); } }
    }
    // The bubble with what's inside.
    const bx = BUBBLE.x, by = BUBBLE.y, br = BUBBLE.r, deflate = out ? 1 - Math.sin(outK * Math.PI) * .25 : 1;
    g.save(); g.translate(bx, by); g.scale(gs * deflate, (2 - gs) * deflate + (deflate < 1 ? .1 : 0)); g.translate(-bx, -by);
    circle(g, bx, by, br + 1, '#120c18'); g.globalAlpha = .85; circle(g, bx, by, br, '#2a4256'); circle(g, bx, by + 3, br - 3, '#34536a'); circle(g, bx - 2, by - 3, br - 6, '#3e6078'); g.globalAlpha = 1;
    if (held && held.kind === 'agua') {
      // Water sloshing inside, filling as much as is left.
      const lvl = by + br - Math.round((br * 2 - 2) * Math.max(0, held.amount)), low = held.amount < .25;
      g.save(); g.beginPath(); g.arc(bx, by, br - .5, 0, 7); g.clip();
      for (let x = bx - br; x <= bx + br; x++) { const sy = lvl + Math.round(Math.sin(t / 6 + x * .5) * 1.2 + (p.hover ? Math.sin(t / 3 + x) : 0)); g.fillStyle = Water.C.body; g.fillRect(x, sy, 1, by + br - sy + 1); g.fillStyle = Water.C.light; g.fillRect(x, sy, 1, 1); }
      g.fillStyle = Water.C.inner; g.fillRect(bx - br, lvl + 3, br * 2, 2);
      for (let i = 0; i < 3; i++) { const k = ((t * .02 + i * .33) % 1); g.fillStyle = Water.C.shine; g.fillRect(bx - 4 + i * 4, Math.round(by + br - k * (by + br - lvl)), 1, 1); }
      g.restore();
      if (low && (t >> (p.hover ? 2 : 3)) % 2) ring(g, bx, by, br + 1, '#e2445a');   // faster while the jet is on
    } else if (held && !S.fly.some(f => f.to === 'bubble')) {
      // Bugs squirm inside; rocks and crates just sit and rattle when charged.
      const alive = ['snail', 'frog', 'mosquito', 'crab'].includes(held.kind), wig = alive ? Math.sin(t / 4) * .25 : 0, hop = alive ? Math.abs(Math.sin(t / 7)) * -2 : 0;
      sprIn(g, held.sprite, bx + jit + (alive ? Math.sin(t / 9) * 1.5 : 0), by + hop + 1, 15, wig);
    } else if (!held) { ring(g, bx, by, br - 3, p.sucking ? '#9fc0cc' : '#3a4a5a', 0, 1, 3); }
    // Glass shine.
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx - 6, by - 7, 3, 1); g.fillRect(bx - 7, by - 6, 1, 2);
    g.restore();
    // Charge ring around the bubble, crackling when full.
    if (charge > 4 && held) {
      const k = Math.min(1, charge / CHARGE_FULL); ring(g, bx, by, br + 2, '#120c18'); ring(g, bx, by, br + 2, full && (t >> 1) % 2 ? '#fff6d6' : '#e79b3f', 0, k); ring(g, bx, by, br + 3, full ? '#f2c46a' : '#7a4a20', 0, k, 2);
      if (full) { g.fillStyle = '#fff6d6'; for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28; g.fillRect(Math.round(bx + Math.cos(a) * (br + 5)), Math.round(by + Math.sin(a) * (br + 5)), 1, 1); } }
    } else ring(g, bx, by, br + 1, held ? '#8fd9d0' : '#3a4a5a');
    // The name of the load on a small tag.
    if (held && !EXT) { const nm = AMMO_NAMES[held.kind] || held.kind, tw = ART.textWidth(nm), tx = bx + br + 5, ty = by - 4, pop = S.heldT < 10 ? Math.round((1 - S.heldT / 10) * -3) : 0; g.fillStyle = 'rgba(18,12,24,.75)'; g.fillRect(tx - 2, ty - 2 + pop, tw + 4, 11); g.fillStyle = full ? '#f2c46a' : '#2a8a90'; g.fillRect(tx - 2, ty + 8 + pop, tw + 4, 1); ART.text(g, nm, tx, ty + pop, full ? '#fff6d6' : '#e8fbff', 'left'); if (full) ART.text(g, '¡LISTO!', tx, ty + 12, (t >> 2) % 2 ? '#f2c46a' : '#e79b3f', 'left', '#1b2430'); }
    // Spat out: the icon shoots away from the bubble.
    if (out && out.kind !== 'agua') { g.globalAlpha = 1 - outK; sprIn(g, out.sprite, bx + outK * 30 * (Player.dir || 1), by - Math.sin(outK * Math.PI) * 8, 15, outK * 6); g.globalAlpha = 1; }
  }
  function drawCrias(g, t) {
    const c = counterPos(), done = L.pearlsTotal > 0 && L.pearls >= L.pearlsTotal, s = S.pop ? 1 + Math.sin(S.pop / 14 * Math.PI) * .45 : 1;
    const txt = L.pearls + '/' + L.pearlsTotal, tw = ART.textWidth(txt);
    g.fillStyle = 'rgba(18,12,24,.6)'; g.fillRect(c.x - 4, c.y - 2, tw + 18, 12);
    g.save(); g.translate(c.x + 4, c.y + 4); g.scale(s, s); g.drawImage(ART.cria[(t >> 4) % 3], -4.5, -4.5); g.restore();
    g.save(); g.translate(c.x + 12, c.y); if (S.pop) { g.translate(0, -Math.sin(S.pop / 14 * Math.PI) * 2); }
    ART.text(g, txt, 0, 0, S.pop ? '#ffffff' : done ? '#f2c46a' : '#e8fbff', 'left', '#1b2430'); g.restore();
    if (done) { g.fillStyle = '#fff6d6'; const k = (t % 90) / 90; g.globalAlpha = 1 - k; g.fillRect(Math.round(c.x + 12 + k * tw), c.y, 1, 7); g.globalAlpha = 1; }
  }
  // The heron's bar: six blows in three phases, with gold notches between phases and a pip per phase
  // (spent, current, still to come). Hidden until her entrance is over; her name card slides in over it.
  function drawBoss(g, t) {
    const b = L.boss; if (!b || !b.fight) return;
    if (b.card) drawCard(g, b.card);
    if (b.dead || b.lock || ['leave', 'intro', 'trans1', 'trans2'].includes(b.state)) return;
    const bw = 96, max = b.maxHp, x = Math.round(W / 2 - bw / 2 + (S.bossShake ? (Math.random() - .5) * 3 : 0)), y = 6;
    const bounds = Boss.PHASE_HP.slice(1), phase = b.phase || 1, rage = phase >= 3;
    g.fillStyle = '#120c18'; g.fillRect(x - 2, y - 2, bw + 4, 9); g.fillStyle = rage && (t >> 3) % 2 ? '#3a1420' : '#2a1a24'; g.fillRect(x, y, bw, 5);
    g.fillStyle = '#fff6d6'; g.fillRect(x, y, Math.round(bw * S.bossLag / max), 5);
    g.fillStyle = S.bossShake > 8 ? '#ffffff' : rage ? '#ff4a2a' : '#d9503a'; g.fillRect(x, y, Math.round(bw * b.hp / max), 5); g.fillStyle = rage ? '#ffb070' : '#f28b6a'; g.fillRect(x, y, Math.round(bw * b.hp / max), 1);
    for (let i = 1; i < max; i++) { const nx = x + Math.round(bw * i / max); if (bounds.includes(max - i)) { g.fillStyle = '#120c18'; g.fillRect(nx - 1, y - 2, 3, 9); g.fillStyle = '#f2c46a'; g.fillRect(nx, y - 3, 1, 11); } else { g.fillStyle = '#120c18'; g.fillRect(nx, y, 1, 5); } }
    // Her head at the left end (the eye turns red in phase III).
    const hx = x - 12, hy = y - 3; g.fillStyle = '#120c18'; g.fillRect(hx - 1, hy - 1, 10, 10); g.fillStyle = '#e9eef2'; g.fillRect(hx, hy, 8, 8); g.fillStyle = '#22262e'; g.fillRect(hx, hy, 8, 2); g.fillStyle = '#e2b63c'; g.fillRect(hx - 6, hy + 4, 6, 2); g.fillStyle = rage ? '#ff3a2a' : '#1a1a1a'; g.fillRect(hx + 2, hy + 3, 2, 2);
    const nw = ART.title(g, 'La Garza', W / 2 - 12, y + 7, rage ? '#ff9a6a' : '#f2c46a', 'center');
    // Phase pips: spent (dim), current (bright, pulsing), still to come (hollow).
    for (let i = 0; i < 3; i++) {
      const cx = W / 2 - 12 + nw / 2 + 8 + i * 8, cy = y + 11, cur = i + 1 === phase, done = i + 1 < phase;
      const r = cur && (t >> 4) % 2 ? 3 : 2; g.fillStyle = '#120c18'; for (let d = -r - 1; d <= r + 1; d++) g.fillRect(cx - (r + 1 - Math.abs(d)), cy + d, (r + 1 - Math.abs(d)) * 2 + 1, 1);
      g.fillStyle = done ? '#4a3440' : cur ? (rage ? '#ff5a3a' : '#f2c46a') : '#2a1a24'; for (let d = -r; d <= r; d++) g.fillRect(cx - (r - Math.abs(d)), cy + d, (r - Math.abs(d)) * 2 + 1, 1);
      if (!done && !cur) { g.fillStyle = '#8a6a3a'; g.fillRect(cx, cy - r, 1, 1); g.fillRect(cx, cy + r, 1, 1); g.fillRect(cx - r, cy, 1, 1); g.fillRect(cx + r, cy, 1, 1); }
    }
  }
  // A title card that slides in over a dark band: her name at the entrance, the phase at each change.
  function drawCard(g, c) {
    const k = c.t, a = k < 14 ? k / 14 : k > c.life - 30 ? Math.max(0, (c.life - k) / 30) : 1, slide = k < 14 ? Math.round((1 - ease(k / 14)) * -60) : 0, big = c.title.length < 12;
    const by = big ? 112 : 120, bh = big ? 34 : 26;
    g.globalAlpha = a * .8; g.fillStyle = '#0c0810'; g.fillRect(0, by, W, bh); g.globalAlpha = a; g.fillStyle = '#e79b3f'; g.fillRect(0, by, W, 1); g.fillRect(0, by + bh - 1, W, 1);
    if (big) { g.save(); g.translate(W / 2 + slide, by + 4); g.scale(2, 2); ART.text(g, c.title, 0, 0, '#fff6d6', 'center', '#7a2a2a'); g.restore(); ART.text(g, c.sub, W / 2 - slide, by + 22, '#e79b3f', 'center', '#1b2430'); }
    else { ART.text(g, c.title, W / 2 + slide, by + 5, '#fff6d6', 'center', '#7a2a2a'); ART.text(g, c.sub, W / 2 - slide, by + 15, '#e79b3f', 'center', '#1b2430'); }
    g.globalAlpha = 1;
  }
  function drawFly(g, t) {
    for (const f of S.fly) {
      if (f.t < 0) continue; const k = ease(Math.min(1, f.t / 22)), c = counterPos(), out = ext ? (ext === 'abajo' ? { x: 30, y: H + 12 } : { x: -12, y: 40 }) : null, tx = out ? out.x : f.to === 'crias' ? c.x + 4 : BUBBLE.x, ty = out ? out.y : f.to === 'crias' ? c.y + 4 : BUBBLE.y;
      const x = f.x + (tx - f.x) * k, y = f.y + (ty - f.y) * k - Math.sin(k * Math.PI) * 24, s = 1 + Math.sin(k * Math.PI) * .6;
      g.globalAlpha = .4; sprIn(g, f.sprite, x - (tx - f.x) * .04, y + 3, 14 * s); g.globalAlpha = 1;
      sprIn(g, f.sprite, x, y, 14 * s, f.t * .3);
    }
  }
  function draw(g) {
    const t = Game.t;
    // Low health: the edges of the screen pulse red with the heartbeat.
    if (Player.hp === 1 && !Player.dead) { const b = t % 40, a = b < 6 ? .22 * (1 - b / 6) : b > 10 && b < 16 ? .12 * (1 - (b - 10) / 6) : 0; if (a > 0) { g.fillStyle = 'rgba(200,40,60,' + a + ')'; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillRect(0, 0, 6, H); g.fillRect(W - 6, 0, 6, H); } }
    if (!ext) { g.save(); if (S.shake) g.translate(Math.round((Math.random() - .5) * S.shake * .5), Math.round((Math.random() - .5) * S.shake * .3));
      drawHearts(g, t); drawMouth(g, t); g.restore(); drawCrias(g, t); }
    drawBoss(g, t); drawFly(g, t);
  }
  // The HUD on its own canvas (64×60): a little wooden plaque with moss, the hearts, Bigotes' medallion and mouth
  // bubble, and the crías counter; it shakes and pops exactly like the one in the picture.
  let plaque = null;
  function drawExt(c) {
    const g = c.getContext('2d'), t = Game.t; g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
    if (!plaque) { plaque = document.createElement('canvas'); plaque.width = 64; plaque.height = 60; const q = plaque.getContext('2d');
      q.fillStyle = '#1a1420'; q.fillRect(1, 0, 62, 60); q.fillRect(0, 1, 64, 58); q.fillStyle = '#6b4a30'; q.fillRect(1, 1, 62, 58); q.fillStyle = '#8a5a34'; q.fillRect(2, 2, 60, 55);
      q.fillStyle = '#a56f38'; q.fillRect(2, 2, 60, 2); for (let y = 12; y < 56; y += 11) { q.fillStyle = '#7a4e2c'; q.fillRect(2, y, 60, 1); }
      q.fillStyle = 'rgba(18,12,24,.55)'; q.fillRect(3, 17, 58, 29); q.fillRect(3, 47, 58, 11);
      q.fillStyle = '#c9b08a'; q.fillRect(4, 3, 1, 1); q.fillRect(59, 3, 1, 1); q.fillRect(4, 56, 1, 1); q.fillRect(59, 56, 1, 1);
      q.fillStyle = '#1a1420'; q.fillRect(44, 0, 12, 3); q.fillStyle = '#3f7a2a'; q.fillRect(45, 0, 10, 2); q.fillStyle = '#8fbf4a'; q.fillRect(46, 0, 1, 1); q.fillRect(50, 0, 2, 1); q.fillRect(53, 1, 1, 1); }
    const sh = S.shake ? [Math.round((Math.random() - .5) * S.shake * .5), Math.round((Math.random() - .5) * S.shake * .3)] : [0, 0];
    g.save(); g.translate(sh[0], sh[1]); g.drawImage(plaque, 0, 0);
    EXT = true; drawHearts(g, t); drawMouth(g, t); drawCrias(g, t); EXT = false; g.restore();
  }
  return { update, draw, reset, drawExt, set ext(v) { ext = v; }, get ext() { return ext; } };
})();
