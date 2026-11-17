// GLUP — la pausa. El pantano se queda quieto: el mundo se apaga, pierde color y se nubla con una trama,
// una viñeta oscura lo rodea, salen luciérnagas y la luna. Un cartel de madera y pergamino baja colgado
// de dos cuerdas, rebota, se estira y se mece hasta quedarse quieto; encima, «PAUSA» cae letra a letra en
// la letra GLUP y tiembla, y Nila se asoma por el borde. Dentro: el sitio (sello de lacre y nombre), las
// crías de aquí en sus burbujas y las de casa, el tiempo y el récord, los trucos de Bigotes (sus bocados en
// marquitos, siluetas los que faltan, el último que aprendió brillando) y una pista que se escribe sola
// (los trucos que piden las crías escondidas, el maestro del sitio, los carteles y Ruca; ←/→ pasan hoja).
// Las opciones son tablillas; Bigotes nada hasta la elegida (que se levanta y brilla) y, si nadie toca
// nada, se duerme. Al seguir, el cartel sube de un tirón y el juego sigue en el acto.
'use strict';
const Pausa = (() => {
  const M = MUNDO, OUT = '#140e18';
  const WD = ['#24160f', '#3e2718', '#5c3c24', '#7e5634', '#a47444', '#c8965a'];   // wood, dark to light
  const INK = '#3a2418', INK2 = '#7a5a3a', INKR = '#a8342a', INKG = '#3e6a2a', INKY = '#9a6410', INKF = '#b09a74';
  const B = { x: 30, y: 27, w: 260, h: 138 };                      // the board, at rest
  const ROWS = [73, 92, 111], PL = { x: 66, w: 94, h: 15 };          // the option planks: centre lines, left edge, size
  const CX = 172, CR = 280;                                          // the right column
  const TIP = { x: 41, y: 130, w: 238, h: 27 };                      // the note with the hint
  const CLOSE = 11;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, sm = v => { v = cl(v, 0, 1); return v * v * (3 - 2 * v); };
  const RR = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const P = { on: false, t: 0, closing: 0, leaving: false, y: 0, vy: 0, landed: true, landT: 0, sq: 0, a: 0, av: 0, cy: ROWS[0], cvy: 0, idle: 0, pop: [0, 0, 0], munch: 0,
    tips: [], tip: 0, tipT: 0, flip: 0, bubbles: [], notes: [], flies: [], letters: 0 };

  // ---------------------------------------------------------------- Lienzos (se pintan una vez)
  let back = null, vig = null, grain = null;
  // The board: a wooden frame with nails and a knot round a sheet of parchment, singed at the edges.
  function board() {
    if (back) return back;
    const b = M.Buf(B.w, B.h), r = ART.rng(11);
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
      const e = Math.min(x, y, B.w - 1 - x, B.h - 1 - y);
      if (e === 0) { if ((x === 0 || x === B.w - 1) && (y === 0 || y === B.h - 1)) continue; M.put(b, x, y, OUT); continue; }
      if (e < 5) { const n = M.noise(x / 11, y * 1.7, 4), seam = (x + (y >> 2) * 7) % 29 === 0; M.put(b, x, y, e === 1 ? WD[4] : e === 4 ? WD[1] : n > .64 || seam ? WD[2] : n < .2 ? WD[4] : WD[3]); continue; }
      if (e === 5) { M.put(b, x, y, '#6a5030'); continue; }
      const n = M.noise(x / 15, y / 7, 6) * .6 + M.noise(x / 3, y / 2, 7) * .4, edge = Math.max(0, 1 - (e - 6) / 6);
      M.put(b, x, y, M.pick([M.rgb('#b89660'), M.rgb('#c8a870'), M.rgb('#d8bf8c'), M.rgb('#e6d2a4'), M.rgb('#efdfb6')], cl(.9 - edge * .75 + (n - .5) * .45, 0, 1), x, y));
    }
    // Coffee rings and stains, a knot in the frame, nails at the corners and where the ropes hold.
    for (let i = 0; i < 6; i++) { const sx = 20 + r() * (B.w - 40), sy = 14 + r() * (B.h - 28), rr = 3 + r() * 6; for (let y = -rr; y <= rr; y++) for (let x = -rr * 1.5; x <= rr * 1.5; x++) if ((x / 1.5) ** 2 + y * y < rr * rr && M.dith(x | 0, y | 0) < .28) M.put(b, sx + x, sy + y, '#c0a070', .45); }
    for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283, x = 212 + Math.cos(an) * 7, y = 104 + Math.sin(an) * 5; if (M.dith(a, 3) < .6) M.put(b, x, y, '#c4a26c', .6); }
    for (const [kx, ky] of [[B.w - 3, 40], [2, 96]]) { M.put(b, kx, ky, WD[1]); M.put(b, kx, ky + 1, WD[1]); M.put(b, kx, ky - 1, WD[2]); M.put(b, kx, ky + 2, WD[2]); }
    for (const [x, y] of [[2, 2], [B.w - 4, 2], [2, B.h - 4], [B.w - 4, B.h - 4], [22, 2], [B.w - 24, 2], [B.w >> 1, B.h - 3]]) { M.put(b, x, y, '#d8d0c0'); M.put(b, x + 1, y, '#a8a090'); M.put(b, x + 1, y + 1, '#3a2a20'); }
    return back = M.toCanvas(b);
  }
  // The dark round the edges, dithered in four steps, and a checker that softens the frozen world like a blur.
  function vignette() {
    if (vig) return vig;
    const b = M.Buf(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W * .56), dy = (y - H / 2) / (H * .6), d = Math.sqrt(dx * dx + dy * dy), v = sm((d - .5) / .55);
      const q = Math.floor(v * 4 + M.dith(x, y)) / 4; if (q > 0) M.put(b, x, y, '#06060e', q * .85);
    }
    vig = M.toCanvas(b);
    const c = M.Buf(W, H); for (let y = 0; y < H; y++) for (let x = (y & 1); x < W; x += 2) M.put(c, x, y, '#0c0e1c');
    grain = M.toCanvas(c);
    return vig;
  }

  // ---------------------------------------------------------------- Pistas
  const ART_ = { ventosa: 'la' };
  function tipsFor() {
    const d = L.def, out = [], allHome = L.pearlsTotal > 0 && L.pearls >= L.pearlsTotal, fits = s => ART.wrap(s, TIP.w - 29).length <= 2;
    const crias = n => n === 1 ? 'una cría escondida' : n + ' crías escondidas';
    if (allHome) out.push({ icon: 'cria', text: '¡Todas las crías de este sitio están a salvo en casa!' });
    else {
      // The hidden crías (as on the map): one hint per trick Bigotes already has, one for all the ones he still lacks.
      const by = {}; let lack = 0, lackPw = null;
      for (const s of d.secretos || []) { if (!(s.crias > 0) || !POWERS[s.poder]) continue; if (Game.has(s.poder)) by[s.poder] = (by[s.poder] || 0) + s.crias; else { lack += s.crias; lackPw = lackPw || s.poder; } }
      for (const pw in by) out.push({ icon: pw, text: 'Con ' + (ART_[pw] || 'el') + ' ' + POWERS[pw].name + ' llegarás a ' + crias(by[pw]) + ' de este sitio.' });
      if (lack) out.push({ icon: lackPw, lock: true, text: 'Hay ' + crias(lack) + ' que ' + (lack === 1 ? 'pide' : 'piden') + ' trucos que Bigotes aún no sabe. Ya volverás.' });
    }
    const m = d.maestro, q = m && Maestros.QUIEN[m.quien];
    if (q && POWERS[m.poder] && !Game.has(m.poder)) out.push({ icon: 'maestro', who: m.quien, text: 'Por aquí vive ' + q.name + ', que le enseñará a Bigotes un truco nuevo.' });
    (d.signs || []).forEach((s, i) => { const t = Game.signText(i); if (t && fits(t)) out.push({ icon: 'sign', text: t }); });
    (d.ruca || []).forEach(s => { const t = Game.signText(null, s); if (t && fits(t)) out.push({ icon: 'ruca', who: 'ruca', text: t }); });
    out.push({ icon: 'farol', text: 'Los faroles guardan tu sitio: si Nila se cae, vuelve al último encendido.' });
    if (d.boss) out.unshift({ icon: 'cria', text: 'La Garza guarda crías en el buche: cada golpe que le das suelta una.' });
    out.push({ icon: 'cria', text: 'Cuantas más crías haya en casa, más fuerte cantan: así se abre el muro del nido.' });
    return out.filter(o => fits(o.text));
  }

  // ---------------------------------------------------------------- Abrir, cerrar, mover
  function open() {
    Object.assign(P, { on: true, t: 0, closing: 0, leaving: false, y: Game.still ? 0 : -(B.y + B.h + 14), vy: 0, landed: !!Game.still, landT: Game.still ? -99 : 0, hitT: Game.still ? -99 : -1, sq: 0, a: 0, av: 0,
      cy: ROWS[Game.pauseSel] || ROWS[0], cvy: 0, idle: 0, pop: [0, 0, 0], munch: 0, tips: tipsFor(), tip: 0, tipT: 0, flip: 0, bubbles: [], notes: [], letters: Game.still ? 99 : 0 });
    if (!P.flies.length) for (let i = 0; i < 14; i++) P.flies.push({ x: Math.random() * W, y: 20 + Math.random() * (H - 30), ph: Math.random() * 6.28, sp: .4 + Math.random() * .6 });
  }
  function close() { P.on = false; P.closing = Game.still ? 1 : CLOSE; }
  function leave() { P.on = false; P.leaving = true; }
  function showing() { return P.on || P.closing > 0 || (P.leaving && !!Game.fadeTo); }
  function move(dir) { P.idle = 0; P.av += dir * .004; P.pop[Game.pauseSel] = 1; for (let i = 0; i < 3; i++) P.bubbles.push({ x: PL.x - 20 + Math.random() * 6, y: P.cy - 3, vy: -.3 - Math.random() * .4, t: 0, life: 30 + Math.random() * 20 }); Sound.play('tick', [7, 4, 2][Game.pauseSel] || 0); }
  function press(i) {
    P.idle = 0; P.munch = 14; P.pop[i] = 1.6; P.av += .006;
    if (i === 1) for (let k = 0; k < 4; k++) P.notes.push({ x: PL.x + 8, y: ROWS[1] - 2, vx: .3 + Math.random() * .9, vy: -.6 - Math.random() * .8, t: -k * 4, life: 40 });
  }
  function flip(d) { if (P.tips.length < 2) return; P.tip = (P.tip + d + P.tips.length) % P.tips.length; P.tipT = 0; P.flip = 8; P.idle = 0; Sound.play('text'); }
  // Taps: an option plank (or Bigotes beside it), or the note (next hint).
  function hit(pt) {
    const oy = P.y;
    for (let i = 0; i < ROWS.length; i++) if (pt.x >= PL.x - 28 && pt.x < PL.x + PL.w + 6 && pt.y >= ROWS[i] - 9 + oy && pt.y < ROWS[i] + 10 + oy) return i;
    if (pt.x >= TIP.x && pt.x < TIP.x + TIP.w && pt.y >= TIP.y + oy && pt.y < TIP.y + TIP.h + oy) return 'tip';
    return -1;
  }
  function update() {
    if (!P.on) { P.leaving = false; if (P.closing > 0) P.closing--; return; }   // (called every frame of play, too)
    P.t++; P.idle++; P.tipT = P.landed ? P.tipT + 1 : 0;
    if (!P.landed) {
      P.vy += 1.25; P.y += P.vy;
      if (P.y >= 0) { const v = P.vy; P.y = 0; if (P.hitT < 0) P.hitT = P.t; if (v > 3) { P.vy = -v * .28; P.sq = Math.min(.09, v * .007); P.av += v * .0009; if (v > 9) { Sound.play('thud'); Input.rumble(60, .2, .1); } } else { P.vy = 0; P.landed = true; P.landT = P.t; } }
    }
    P.sq *= .8; P.av += -P.a * .07; P.av *= .9; P.a += P.av; if (Game.still) P.a = 0;
    if (P.hitT >= 0 && P.letters < 5 && P.t - P.hitT >= P.letters * 4 + 4) { Sound.play('bloop', P.letters); P.letters++; }
    const ty = ROWS[Game.pauseSel] || ROWS[0]; P.cvy += (ty - P.cy) * .2; P.cvy *= .64; P.cy += P.cvy; if (Game.still) { P.cy = ty; P.cvy = 0; }
    for (let i = 0; i < 3; i++) P.pop[i] *= .8;
    if (P.munch > 0) P.munch--; if (P.flip > 0) P.flip--;
    if (P.tipT > 420 && P.tips.length > 1) { P.tip = (P.tip + 1) % P.tips.length; P.tipT = 0; P.flip = 8; }
    if (P.t % 50 === 17 && P.idle < 600) P.bubbles.push({ x: PL.x - 3, y: P.cy - 4, vy: -.25, t: 0, life: 40 });
    for (let i = P.bubbles.length - 1; i >= 0; i--) { const b = P.bubbles[i]; b.t++; b.y += b.vy; if (b.t > b.life) P.bubbles.splice(i, 1); }
    for (let i = P.notes.length - 1; i >= 0; i--) { const n = P.notes[i]; if (++n.t > 0) { n.x += n.vx; n.y += n.vy; n.vy += .03; } if (n.t > n.life) P.notes.splice(i, 1); }
  }

  // ---------------------------------------------------------------- Dibujo
  // The frozen world: desaturated, darkened towards night blue, dithered and vignetted; the moon and fireflies over it.
  function dim(g, k) {
    if (k <= 0) return; vignette();
    g.save(); g.globalCompositeOperation = 'saturation'; g.globalAlpha = .6 * k; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); g.restore();
    g.globalAlpha = .5 * k; g.fillStyle = '#0c1024'; g.fillRect(0, 0, W, H);
    g.globalAlpha = .45 * k; g.drawImage(grain, 0, 0); g.globalAlpha = k; g.drawImage(vig, 0, 0); g.globalAlpha = 1;
    const t = Game.t, cave = L.def && L.def.theme === 'cave';
    if (!cave) { const mx = 20, my = 16; g.globalAlpha = .1 * k; g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(mx, my, 13, 0, 7); g.fill(); g.globalAlpha = .16 * k; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill(); g.globalAlpha = k;
      for (let dy = -6; dy <= 6; dy++) { const hw = Math.round(Math.sqrt(42 - dy * dy)); RR(g, mx - hw, my + dy, hw * 2 + 1, 1, dy < -3 ? '#fffbe6' : '#f4ecc8'); RR(g, mx + hw - 1, my + dy, 2, 1, '#d8cca0'); }
      RR(g, mx - 2, my - 3, 3, 2, '#e0d4aa'); RR(g, mx + 2, my + 1, 2, 2, '#e0d4aa'); RR(g, mx - 4, my + 2, 2, 1, '#e0d4aa'); RR(g, mx - 1, my + 4, 1, 1, '#e0d4aa'); g.globalAlpha = 1; }
    for (const f of P.flies) {
      const x = Math.round(f.x + Math.sin(t * .011 * f.sp + f.ph) * 22), y = Math.round(f.y + Math.sin(t * .017 * f.sp + f.ph * 2) * 10), on = .5 + .5 * Math.sin(t * .06 + f.ph * 3);
      if (x > B.x && x < B.x + B.w && y > B.y + P.y && y < B.y + B.h + P.y) continue;
      g.globalAlpha = k * on * .35; RR(g, x - 1, y, 3, 1, cave ? '#8fe0d0' : '#ffe36a'); RR(g, x, y - 1, 1, 3, cave ? '#8fe0d0' : '#ffe36a'); g.globalAlpha = k * (.4 + on * .6); RR(g, x, y, 1, 1, cave ? '#d8fff4' : '#fff8c0'); g.globalAlpha = 1;
    }
  }
  // A rope from the top of the screen to a nail on the board: twisted in two browns.
  // It leans when the board swings (x0 at the top, x1 at the board), so the swing never rotates the pixels.
  function rope(g, x0, x1, y1) { for (let y = -2; y < y1; y++) { const x = Math.round(x0 + (x1 - x0) * cl(y / Math.max(1, y1), 0, 1)); RR(g, x - 1, y, 1, 1, OUT); RR(g, x + 2, y, 1, 1, OUT); RR(g, x, y, 2, 1, ((y + 40) >> 1) % 2 ? '#b89868' : '#8a6a44'); } RR(g, x1 - 2, y1 - 1, 6, 3, OUT); RR(g, x1 - 1, y1, 4, 1, '#c8a878'); }
  function waxSeal(g, x, y, n) {
    RR(g, x - 5, y - 4, 11, 9, OUT); RR(g, x - 4, y - 5, 9, 11, OUT); RR(g, x - 4, y - 4, 9, 9, '#b8342a'); RR(g, x - 3, y - 4, 3, 1, '#e8685a'); RR(g, x - 4, y - 3, 1, 3, '#e8685a'); RR(g, x + 3, y + 3, 2, 1, '#7a1e18');
    ART.text(g, String(n), x + 1, y - 3, '#fff0d0', 'center');
  }
  // The little pictures on the planks: a play arrow, a speaker (with waves, or crossed out), a rolled map.
  function icon(g, i, x, y, on, t) {
    if (i === 0) { for (let k = 0; k < 5; k++) { RR(g, x + 1 + k, y + k - 1, 1, 11 - k * 2, OUT); } for (let k = 0; k < 4; k++) RR(g, x + 2 + k, y + k + 1, 1, 7 - k * 2, k ? '#7ac850' : '#c8f098'); return; }
    if (i === 1) {
      const mute = Sound.isMuted(); RR(g, x, y + 2, 4, 5, OUT); RR(g, x + 3, y, 3, 9, OUT); RR(g, x + 1, y + 3, 2, 3, '#e6d2a4'); RR(g, x + 4, y + 1, 1, 7, '#e6d2a4'); RR(g, x + 3, y + 3, 1, 3, '#e6d2a4');
      if (mute) { for (let k = 0; k < 5; k++) { RR(g, x + 7 + k, y + 2 + k, 1, 1, '#e0402a'); RR(g, x + 11 - k, y + 2 + k, 1, 1, '#e0402a'); } }
      else { const w = on ? (t >> 3) % 3 : 2; RR(g, x + 7, y + 3, 1, 3, '#fff6d6'); if (w >= 1) { RR(g, x + 9, y + 1, 1, 1, '#fff6d6'); RR(g, x + 10, y + 2, 1, 5, '#fff6d6'); RR(g, x + 9, y + 7, 1, 1, '#fff6d6'); } if (w >= 2) { RR(g, x + 12, y, 1, 9, '#e6d2a4'); } }
      return;
    }
    RR(g, x - 1, y, 13, 9, OUT); RR(g, x, y + 1, 11, 7, '#e6d2a4'); RR(g, x, y + 1, 11, 1, '#fff4dc'); RR(g, x + 3, y + 1, 1, 7, '#c8a870'); RR(g, x + 7, y + 1, 1, 7, '#c8a870');
    RR(g, x + 1, y + 6, 1, 1, '#5a8ab0'); RR(g, x + 2, y + 5, 2, 1, '#5a8ab0'); RR(g, x + 4, y + 4, 2, 1, '#5a8ab0'); RR(g, x + 6, y + 5, 1, 1, '#5a8ab0');
    RR(g, x + 8, y + 2, 1, 1, '#b8342a'); RR(g, x + 10, y + 2, 1, 1, '#b8342a'); RR(g, x + 9, y + 3, 1, 1, '#b8342a'); RR(g, x + 8, y + 4, 1, 1, '#b8342a'); RR(g, x + 10, y + 4, 1, 1, '#b8342a');
  }
  function plank(g, i, t) {
    const sel = i === Game.pauseSel, lift = sel ? 2 + Math.round(P.pop[i] * 2) : Math.round(P.pop[i]), x = PL.x - (sel ? 1 : 0), w = PL.w + (sel ? 2 : 0), y = ROWS[i] - 7 - lift, h = PL.h;
    RR(g, x + 1, ROWS[i] - 7 + h + 1, w - 1, 1, 'rgba(58,36,24,.3)'); if (sel) RR(g, x + 3, ROWS[i] - 7 + h, w - 4, 1, 'rgba(58,36,24,.3)');
    if (sel) { const pulse = .55 + .45 * Math.sin(t * .15); g.globalAlpha = pulse; RR(g, x - 2, y - 1, w + 4, h + 2, '#ffd052'); RR(g, x - 1, y - 2, w + 2, h + 4, '#ffd052'); g.globalAlpha = 1; }
    RR(g, x - 1, y, w + 2, h, OUT); RR(g, x, y - 1, w, h + 2, OUT);
    RR(g, x, y, w, h, sel ? WD[4] : WD[3]); RR(g, x, y, w, 1, sel ? WD[5] : WD[4]); RR(g, x, y + h - 1, w, 1, sel ? WD[2] : WD[1]);
    RR(g, x + w - 18 - (i * 5) % 9, y + h - 3, 11, 1, sel ? WD[3] : WD[2]); RR(g, x + 3, y + h - 3, 1, 1, sel ? WD[3] : WD[2]);
    RR(g, x + 2, y + 2, 1, 1, '#d8d0c0'); RR(g, x + w - 3, y + 2, 1, 1, '#d8d0c0');
    icon(g, i, x + 5, y + 3, sel, t);
    const label = i === 0 ? 'Seguir' : i === 1 ? 'Sonido: ' + (Sound.isMuted() ? 'no' : 'sí') : 'Salir al mapa';
    Letra.text(g, label, x + 21, y + 3, { color: sel ? '#fff6d6' : '#ecdcb4', light: sel ? '#ffffff' : null, shadow: sel ? '#5a3418' : '#3e2718' });
  }
  // Bigotes, the cursor: swims to the chosen plank, tilts as he goes, opens his mouth on a press and dozes if left alone.
  function cursor(g, t) {
    const F = ART.fish, sleep = P.idle > 480, spr = P.munch > 6 ? F.open : P.munch > 0 ? F.full : F.closed;
    const x = PL.x - 26 + (Game.still ? 0 : Math.round(Math.sin(t * .09) * 1.5)) + (P.munch > 0 ? 2 : 0), y = Math.round(P.cy - 6 + (sleep || Game.still ? 0 : Math.sin(t * .07) * 1));
    g.save(); g.translate(x + 11, y + 6); g.rotate(Game.still ? 0 : cl(P.cvy * .06, -.35, .35)); g.drawImage(spr, -11, -6);
    Player.fishOverlay(g, spr, -11, -6, t, { mood: sleep ? 'sleep' : P.munch > 0 || Math.abs(P.cvy) > .5 ? 'happy' : null, lx: 1 }); g.restore();
    for (const b of P.bubbles) { const k = b.t / b.life; g.globalAlpha = 1 - k * .7; const bx = Math.round(b.x + Math.sin(b.t * .2) * 1), by = Math.round(b.y); if (b.t < b.life - 4) { RR(g, bx, by - 1, 1, 1, '#5f9ab8'); RR(g, bx - 1, by, 1, 1, '#5f9ab8'); RR(g, bx + 1, by, 1, 1, '#5f9ab8'); RR(g, bx, by + 1, 1, 1, '#5f9ab8'); RR(g, bx, by, 1, 1, '#e8fbff'); } else { RR(g, bx - 1, by - 1, 1, 1, '#a8dcea'); RR(g, bx + 1, by + 1, 1, 1, '#a8dcea'); } g.globalAlpha = 1; }
  }
  function crias(g, t) {
    const n = L.pearlsTotal, got = L.pearls, all = Save.criasAll(), done = n > 0 && got >= n;
    ART.text(g, 'Crías de aquí', CX, 59, INK, 'left'); ART.text(g, got + '/' + n, CR, 59, done ? INKG : INKY, 'right');
    const per = n > 14 ? Math.ceil(n / 2) : 7;
    for (let i = 0; i < n; i++) {
      const x = CX + (i % per) * 10, y = 69 + Math.floor(i / per) * 10;
      if (i < got) { const bob = Game.still ? 0 : Math.round(Math.sin(t * .08 + i * .9) * .6); g.drawImage(ART.cria[((t >> 4) + i) % 3], x, y + bob); }
      else { RR(g, x + 2, y, 5, 1, INKF); RR(g, x + 2, y + 8, 5, 1, INKF); RR(g, x, y + 2, 1, 5, INKF); RR(g, x + 8, y + 2, 1, 5, INKF); RR(g, x + 1, y + 1, 1, 1, INKF); RR(g, x + 7, y + 1, 1, 1, INKF); RR(g, x + 1, y + 7, 1, 1, INKF); RR(g, x + 7, y + 7, 1, 1, INKF);
        g.globalAlpha = .35; RR(g, x + 1, y + 2, 7, 5, '#c8b088'); RR(g, x + 2, y + 1, 5, 7, '#c8b088'); g.globalAlpha = 1; RR(g, x + 2, y + 2, 1, 1, '#fff4dc'); }
    }
    // Home: every cría rescued so far, all levels together.
    const hx = CX + Math.min(n, per) * 10 + 6;
    if (hx < CR - 26) { ART.text(g, 'En casa', CR, 69, INK2, 'right'); const tx = ART.text(g, all.got + '/' + all.all, CR, 80, INK2, 'right'); g.drawImage(ART.cria[(t >> 5) % 3], CR - tx - 11, 79); }
  }
  function times(g) {
    const y = 93, cur = Math.floor(L.time / 60), best = Save.data.best[L.def.id];
    RR(g, CX + 1, y, 5, 7, INK); RR(g, CX, y + 1, 7, 5, INK); RR(g, CX + 1, y + 1, 5, 5, '#f4e8c8'); RR(g, CX + 3, y + 2, 1, 2, INK); RR(g, CX + 4, y + 3, 1, 1, INK);
    ART.text(g, Game.fmtTime(cur), CX + 10, y, INK, 'left');
    const rl = best !== undefined ? 'Récord ' + Game.fmtTime(best) : 'Sin récord aún'; ART.text(g, rl, CR, y, best !== undefined && cur <= best ? INKG : INK2, 'right');
    if (best !== undefined) { const x = CR - ART.textWidth(rl) - 9; RR(g, x + 1, y + 1, 5, 4, OUT); RR(g, x + 2, y + 2, 3, 2, '#f2c43a'); RR(g, x, y + 1, 1, 2, OUT); RR(g, x + 6, y + 1, 1, 2, OUT); RR(g, x + 3, y + 5, 1, 1, OUT); RR(g, x + 2, y + 6, 3, 1, OUT); }
  }
  function tricks(g, t) {
    const known = POWER_ORDER.filter(Game.has), m = L.def.maestro, hl = m && Game.has(m.poder) ? m.poder : known[known.length - 1];
    ART.text(g, 'Trucos', CX, 105, INK, 'left'); ART.text(g, hl ? POWERS[hl].name : known.length + '/' + POWER_ORDER.length, CR, 105, hl ? INKY : INK2, 'right');
    POWER_ORDER.forEach((pw, i) => {
      const x = CX + i * 14 - 1, y = 115, have = Game.has(pw), on = pw === hl, spr = ART.morsels[pw];
      RR(g, x, y, 13, 13, on ? '#7a4418' : have ? INK2 : INKF); RR(g, x + 1, y + 1, 11, 11, on ? '#fff0c0' : have ? '#f4e6c0' : '#d0b888'); RR(g, x + 1, y + 11, 11, 1, on ? '#f2c43a' : have ? '#e0cc9c' : '#c0a878');
      if (on) { const p = .5 + .5 * Math.sin(t * .12); g.globalAlpha = p; RR(g, x - 1, y - 1, 15, 1, '#ffd052'); RR(g, x - 1, y + 13, 15, 1, '#ffd052'); RR(g, x - 1, y, 1, 13, '#ffd052'); RR(g, x + 13, y, 1, 13, '#ffd052'); g.globalAlpha = 1; }
      if (!spr) return;
      if (have) g.drawImage(spr, x + 2, y + 2 + (on && !Game.still ? Math.round(Math.sin(t * .1) - .4) : 0));
      else { g.globalAlpha = .55; g.drawImage(ART.tint(spr, '#8a6e4a'), x + 2, y + 2); g.globalAlpha = 1; }
      if (on && (t % 90) < 30) { const k = (t % 90) / 30, sx = x + 11, sy = y + 1; g.globalAlpha = 1 - k; RR(g, sx, sy - 1, 1, 3, '#ffffff'); RR(g, sx - 1, sy, 3, 1, '#ffffff'); g.globalAlpha = 1; }
    });
  }
  function tip(g, t) {
    const T = TIP, tp = P.tips[P.tip]; if (!tp) return;
    const fl = P.flip / 8, lift = Math.round(fl * 3);
    RR(g, T.x + 2, T.y + 2, T.w, T.h, 'rgba(58,36,24,.25)');
    RR(g, T.x, T.y - lift, T.w, T.h + lift, '#f6ead0'); RR(g, T.x, T.y - lift, T.w, 1, '#fffaf0'); RR(g, T.x, T.y + T.h - 1, T.w, 1, '#d8c498');
    for (let x = T.x; x < T.x + T.w; x += 3) RR(g, x, T.y + T.h, 2, 1, '#e6d6b0');
    RR(g, T.x + T.w - 7, T.y - lift, 7, 7, '#e0cfa6'); RR(g, T.x + T.w - 7, T.y - lift, 1, 7, '#c8b488'); RR(g, T.x + T.w - 7, T.y + 6 - lift, 7, 1, '#c8b488');
    // The pin, and the icon of whoever gives the hint.
    const px = T.x + 9, py = T.y + 1 - lift; RR(g, px - 1, py - 1, 5, 4, OUT); RR(g, px, py - 2, 3, 6, OUT); RR(g, px, py - 1, 3, 3, '#d8403a'); RR(g, px, py - 1, 1, 1, '#ff9a8a'); RR(g, px + 1, py + 2, 1, 2, '#9a9a9a');
    const ix = T.x + 4, iy = T.y + 6 - lift;
    if (tp.who) { RR(g, ix - 1, iy - 3, 18, 18, OUT); RR(g, ix, iy - 2, 16, 16, Maestros.QUIEN[tp.who].fondo); g.save(); g.beginPath(); g.rect(ix, iy - 2, 16, 16); g.clip(); Maestros.portrait(g, tp.who, ix, iy - 2, 16, 16, P.tipT < 60 && (t >> 3) % 2 === 0, t); g.restore(); }
    else if (tp.icon === 'sign') g.drawImage(ART.sign, ix + 1, iy + 1);
    else if (tp.icon === 'cria') g.drawImage(ART.cria[(t >> 4) % 3], ix + 3, iy + 2);
    else if (tp.icon === 'farol') g.drawImage(ART.lantern.on, ix + 3, iy - 3);
    else if (ART.morsels[tp.icon]) { RR(g, ix + 1, iy, 13, 13, INK2); RR(g, ix + 2, iy + 1, 11, 11, tp.lock ? '#d0b888' : '#f4e6c0'); if (tp.lock) { g.globalAlpha = .55; g.drawImage(ART.tint(ART.morsels[tp.icon], '#8a6e4a'), ix + 3, iy + 3); g.globalAlpha = 1; } else g.drawImage(ART.morsels[tp.icon], ix + 3, iy + 3); }
    const lines = ART.wrap(tp.text, T.w - 29), shown = Game.still ? Infinity : Math.floor(P.tipT * 1.4); let used = 0;
    lines.slice(0, 2).forEach((ln, k) => { Letra.text(g, ln, T.x + 24, T.y + 4 + k * 11 - lift, { color: INK, shown: Math.max(0, shown - used) }); used += ln.length + 1; });
    if (P.tips.length > 1) for (let k = 0; k < Math.min(P.tips.length, 12); k++) RR(g, T.x + T.w - 4 - (Math.min(P.tips.length, 12) - k) * 3, T.y + T.h - 3, 2, 1, k === P.tip % 12 ? INKY : '#d8c498');
  }
  // Nila peeks over the top edge of the board; drawn before it, so the board hides the rest of her.
  function nila(g, t, by) {
    const e = P.hitT >= 0 ? sm((P.t - P.hitT - 20) / 16) : 0; if (e <= 0) return;
    const x = B.x + B.w - 64, spr = ART.nila.idle[(t >> 5) % 2 && !Game.still ? 1 : 0], y = by - 15 + Math.round((1 - e) * 16) + (Game.still ? 0 : Math.round(Math.sin(t * .05) * .6));
    g.drawImage(spr, x, y);
  }
  function hands(g, by) {
    const e = P.hitT >= 0 ? sm((P.t - P.hitT - 30) / 8) : 0; if (e <= 0) return;
    const x = B.x + B.w - 64; g.drawImage(ART.hand, x + 1, by - 3); g.drawImage(ART.hand, x + 10, by - 3);
  }
  function title(g, t, by) {
    ART.glup(g, 'PAUSA', W / 2, by - 12, { size: 'mid', pal: 'oro', align: 'center', shadow: true, each: i => {
      if (i >= P.letters) return false;
      const age = Game.still ? 99 : P.t - P.hitT - 4 - i * 4, f = cl(age / 7, 0, 1), fall = Math.round((1 - f * f) * -22);
      const land = age >= 7 && age < 19 ? Math.sin((age - 7) / 12 * Math.PI) * Math.exp(-(age - 7) / 8) : 0;
      const wob = Game.still ? 0 : Math.sin(t * .09 + i * 1.3);
      return { y: fall + Math.round(wob * 1.2), sx: 1 + land * .35 + wob * .03, sy: 1 - land * .3 - wob * .03, drips: Game.still ? 1 : Math.max(0, Math.round(1.5 + Math.sin(t * .05 + i * 2.1) * 2.5)) };
    } });
  }
  function draw(g) {
    const t = Game.t, k = P.on ? sm(P.t / 9) : P.leaving ? 1 : P.closing / CLOSE;
    dim(g, k);
    let oy = P.y; if (!P.on && !P.leaving) { const u = 1 - P.closing / CLOSE; oy = -u * u * (B.y + B.h + 20) + Math.sin(u * 3.14) * 3; }
    const by = Math.round(B.y + oy);
    g.save();
    const sw = Math.round(P.a * 160);
    rope(g, B.x + 22, B.x + 22 + sw, by + 3); rope(g, B.x + B.w - 24, B.x + B.w - 24 + sw, by + 3);
    g.translate(sw, 0); if (P.sq) { g.translate(W / 2, by); g.scale(1 - P.sq * .5, 1 + P.sq); g.translate(-W / 2, -by); }
    nila(g, t, by);
    g.drawImage(board(), B.x, by);
    hands(g, by);
    g.translate(0, by - B.y);
    title(g, t, B.y);
    // The place: its number on a wax seal and its name, with a painted rule underneath.
    const name = L.def.name, nw = Letra.boldWidth(name.toUpperCase()), nx = Math.round(W / 2 - nw / 2 + 7);
    waxSeal(g, nx - 12, B.y + 19, Game.level + 1); ART.title(g, name, nx, B.y + 15, '#f2c46a');
    for (let x = B.x + 12; x < B.x + B.w - 12; x += 2) RR(g, x, B.y + 27, 1, 1, INKF);
    RR(g, W / 2 - 3, B.y + 26, 7, 3, INKF); RR(g, W / 2 - 1, B.y + 25, 3, 5, INKF); RR(g, W / 2, B.y + 27, 1, 1, '#fff4dc');
    for (let y = B.y + 31; y < TIP.y - 4; y += 2) RR(g, CX - 8, y, 1, 1, '#c8b088');
    for (let i = 0; i < 3; i++) plank(g, i, t);
    cursor(g, t);
    for (const n of P.notes) if (n.t > 0) { g.globalAlpha = 1 - n.t / n.life; Letra.text(g, '♪', Math.round(n.x), Math.round(n.y), { color: '#fff6d6', shadow: INK }); g.globalAlpha = 1; }
    crias(g, t); times(g); tricks(g, t); tip(g, t);
    // How to drive it, on a tag hanging under the board.
    const hint = (Input.mode === 'pad' || Input.mode === 'puretv') ? 'A vale · Start sigue' : Touch.enabled ? 'Toca una opción' : '↑↓ elige · Z vale · Esc sigue', hw = ART.textWidth(hint) + 12, hx = Math.round(W / 2 - hw / 2), hy = B.y + B.h + 2;
    RR(g, hx + 5, hy - 2, 1, 3, '#8a6a44'); RR(g, hx + hw - 6, hy - 2, 1, 3, '#8a6a44');
    RR(g, hx - 1, hy + 1, hw + 2, 12, OUT); RR(g, hx, hy + 2, hw, 10, WD[2]); RR(g, hx, hy + 2, hw, 1, WD[4]);
    ART.text(g, hint, W / 2, hy + 3, '#f4e6c0', 'center', OUT);
    g.restore();
  }
  return { open, close, leave, showing, update, move, press, flip, hit, draw, ROWS, get state() { return P; } };
})();
