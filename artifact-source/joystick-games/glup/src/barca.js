// GLUP — la barca. Un bote de remos de verdad (tablones, cuadernas, proa levantada, farolillo y
// banderín) y la llegada a cada nivel: la barca entra por una ensenada al borde izquierdo del
// mapa, choca con el embarcadero y Nila salta a tierra; al irse del nivel, rema y se va.
'use strict';
const Barca = (() => {
  // ---------------------------------------------------------------- El bote
  let boat = null;
  function sprite() {
    if (boat) return boat;
    const C = { o: '#1d1420', d: '#4a2e22', m: '#6e4630', w: '#8e5e3a', W: '#b07848', L: '#c99058', H: '#e8b878', Y: '#fff2b8', y: '#ffc84a', r: '#d9503a', R: '#f07a5a', s: '#d8d0c0' };
    const rows = [
      '...oo.......................o...',
      '..oYYo......................oRo.',
      '..oyyo......................oRRo',
      '...oo.......................ooo.',
      '...os.......................os..',
      'oo.os......................oHo..',
      'oLooooooooooooooooooooooooooHLo.',
      '.oHHHHHHHHHHHHHHHHHHHHHHHHHHHLo.',
      '..oWmWWWWWWmWWWWWWmWWWWWWmWWWo..',
      '...oLLLLLLLLLLLLLLLLLLLLLLLLLo..',
      '....oommmmmmmmmmmmmmmmmmmmmoo...',
      '......oooooooooooooooooooooo....'];
    boat = ART.sprite(rows.map(r => r.padEnd(32, '.').slice(0, 32)), C, 'barca');
    return boat;
  }
  // The oar: a pole from Nila's hands down into the water, sweeping back and forth.
  function oar(g, hx, hy, t, dir = 1, speed = 1) {
    const a = .9 + Math.sin(t * .22 * speed) * .5, len = 18, ex = hx - dir * Math.cos(a) * len * .55, ey = hy + Math.sin(a) * len;
    g.fillStyle = '#1d1420'; const n = Math.ceil(len);
    for (let i = 0; i <= n; i++) { const k = i / n, x = hx + (ex - hx) * k, y = hy + (ey - hy) * k; g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); }
    for (let i = 0; i <= n; i++) { const k = i / n, x = hx + (ex - hx) * k, y = hy + (ey - hy) * k; g.fillStyle = k > .8 ? '#e8b878' : '#b07848'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    g.fillStyle = '#e8b878'; g.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
    return { x: ex, y: ey, dip: Math.sin(t * .22 * speed) > .6 };
  }

  // ---------------------------------------------------------------- La llegada
  // Water at the foot of the level's left edge: a little cove with a jetty the boat moors against.
  const A = { t: 0, on: false };
  const SAIL = 60, BUMP = 60, JUMP0 = 72, LAND = 100, END = 150;
  function start() {
    const s = L.start; A.on = true; A.t = 0; A.sx = s.x; A.sy = s.y; A.surf = s.y + 18 + 6; A.bx = -170; A.hopped = false;
    Player.x = s.x; Player.y = s.y; Player.vx = 0; Player.vy = 0;
    Cam.x = -120; Cam.y = Math.max(0, Math.min(L.h * TS - H, s.y - H / 2 + 20)); Game.arrival = A;
  }
  function active() { return A.on; }
  function update() {
    const t = ++A.t, go = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Game.tapped;
    if (go && t > 10) { Game.tapped = false; A.t = END; }
    // The boat glides in and bumps the jetty.
    const k = Math.min(1, t / SAIL), e = 1 - (1 - k) * (1 - k); A.bx = -170 + e * 136;
    if (t === BUMP) { Sound.play('thud'); Cam.shake(2, 6); spawnParts(10, A.bx + 30, A.surf, { color: ['#8fd9d0', '#c8f2ea', '#ffffff'], angle: -Math.PI / 2, spread: 1, speed: [.6, 2], life: [10, 20], g: .12, kind: 'spray' }); }
    if (t > BUMP) A.bx -= Math.min(1.1, (t - BUMP) * .02) * (t > LAND ? 1 : .2);
    if (t % 4 === 0 && t < BUMP) L.parts.push({ x: A.bx + 2, y: A.surf, vx: 0, vy: 0, life: 18, color: '#c8f2ea', size: 1, g: 0, kind: 'ripple' });
    if (t === JUMP0) Sound.play('jump');
    if (t === LAND) { Sound.play('land', .8); spawnParts(8, A.sx + 5, A.sy + 18, { color: ['#c9b08a', '#a08a6a'], angle: -Math.PI / 2, spread: 1.2, speed: [.4, 1.4], life: [10, 18], g: .06 }); Player.x = A.sx; Player.y = A.sy; Player.sx = 1.2; Player.sy = .82; }
    // Camera: from the cove to Nila's usual framing.
    const target = Math.max(0, Math.min(L.w * TS - W, A.sx - W / 3)), ck = Math.max(0, Math.min(1, (t - 70) / 60));
    Cam.x = -120 + (target + 120) * (ck * ck * (3 - 2 * ck));
    if (t >= END) { A.on = false; Game.arrival = null; Player.x = A.sx; Player.y = A.sy; Game.banner = 190; Cam.snap && Cam.snap(); }
  }
  // Behind the tiles: the water of the cove and the jetty.
  function drawBack(g) {
    const x1 = Math.round(-Cam.x); if (x1 <= 0) return;
    const sy = Math.round(A.surf - Cam.y), T = Game.t;
    g.fillStyle = '#17394a'; g.fillRect(0, sy, x1, H - sy); g.fillStyle = '#1f4a5a'; g.fillRect(0, sy + 3, x1, 4); g.fillStyle = '#122a38'; g.fillRect(0, sy + 18, x1, H - sy - 18);
    g.fillStyle = '#8cc8c0'; for (let x = 0; x < x1; x += 2) g.fillRect(x, sy + Math.round(Math.sin((x + T) / 7)), 1, 1);
    for (let i = 0; i < 5; i++) { g.fillStyle = '#e8fbff'; g.fillRect(Math.round((i * 53 + T * .4) % Math.max(1, x1)), sy + 6 + i * 4, 4, 1); }
    // The jetty: two planks on posts at the very edge of the land.
    const jx = x1 - 18, jy = sy - 6;
    g.fillStyle = '#1d1420'; g.fillRect(jx - 1, jy - 1, 20, 5); g.fillStyle = '#b07848'; g.fillRect(jx, jy, 18, 3); g.fillStyle = '#e8b878'; g.fillRect(jx, jy, 18, 1);
    for (const px of [jx + 2, jx + 13]) { g.fillStyle = '#1d1420'; g.fillRect(px - 1, jy + 3, 4, 24); g.fillStyle = '#6e4630'; g.fillRect(px, jy + 3, 2, 24); }
  }
  // In front: the boat with Nila rowing, then her jump to the shore.
  function drawFront(g) {
    const t = A.t, T = Game.t, bob = Math.round(Math.sin(T / 20) * 1.2), bx = Math.round(A.bx - Cam.x), by = Math.round(A.surf - Cam.y - 8 + bob);
    const S = sprite(), fade = t > LAND ? Math.max(0, 1 - (t - LAND) / 50) : 1;
    g.globalAlpha = fade; g.drawImage(S, bx, by);
    const N = ART.nila;
    if (t < JUMP0) {
      // Rowing in the boat.
      const nx = bx + 11, ny = by - 12; Player.carryLook = { mood: t > BUMP - 6 ? 'shock' : null, lx: 1 };
      Player.drawCarry(g, nx, ny, N.idle[0], ART.fish.closed, (T >> 4) % 2); Player.carryLook = null;
      if (t < BUMP) oar(g, nx + 10, ny + 12, T, 1, 1.2);
      g.drawImage(S, 0, 6, 32, 6, bx, by + 6, 32, 6);   // the hull in front of her boots
    }
    g.globalAlpha = 1;
    if (t >= JUMP0 && t < LAND) {
      const k = (t - JUMP0) / (LAND - JUMP0), x0 = A.bx + 11, y0 = A.surf - 20, x = x0 + (A.sx - x0) * k, y = y0 + (A.sy - y0) * k - Math.sin(k * Math.PI) * 56;
      Player.carryLook = { mood: 'happy' }; Player.drawCarry(g, Math.round(x - Cam.x), Math.round(y - Cam.y), k < .5 ? N.jump : N.fall, ART.fish.open, 0); Player.carryLook = null;
    }
    if (t >= LAND) { A.on = false; Player.draw(g); A.on = true; }   // on shore: the usual Nila
  }
  return { sprite, oar, start, active, update, drawBack, drawFront };
})();

// The rowing boat replaces the old boat everywhere (levels, map, screens).
ART.boat = Barca.sprite();
