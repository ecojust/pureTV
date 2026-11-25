// GLUP — la gramola: index.html?gramola=1 (o ?escena=gramola). Escucha cada canción, cada
// ambiente, cada instrumento y cada efecto del juego; muestra la sección y el compás que suenan. Con el
// teclado: ←→ pestaña, ↑↓ elegir, Z/Enter tocar o parar, Esc para todo. En el móvil, tocar.
'use strict';
const Gramola = (() => {
  const TABS = ['Canciones', 'Ambientes', 'Instrum.', 'Efectos'], NT = TABS.length, ROW = 10, TOP = 32, ROWS = 12;
  const INFO = {}, S = { tab: 0, sel: [0, 0, 0, 0], scroll: [0, 0, 0, 0], t: 0, playing: null, amb: null, flash: 0 };
  function items(tab) {
    if (tab === 0) return Sound.canciones().filter(c => c.nombre !== 'prueba' && !c.nombre.startsWith('__')).map(c => ({ key: c.nombre, label: c.titulo, sub: c.nombre }));
    if (tab === 1) return Sound.ambientes().map(a => ({ key: a, label: a, sub: '' }));
    if (tab === 3) return Sound.efectos().map(e => ({ key: e.nombre, arg: e.arg, label: e.nombre + (e.arg === null ? '' : ' ' + e.arg), sub: 'efecto', desc: e.desc }));
    return Sound.instrumentos().map(i => ({ key: i.nombre, label: i.nombre, sub: i.rango, desc: i.desc })).concat(Sound.percusion().map(d => ({ key: d, label: d, sub: 'percusión', drum: true })));
  }
  function start() { Game.state = 'gramola'; Sound.setMuted(false); }
  function activate(tab, i) {
    const it = items(tab)[i]; if (!it) return; Sound.init(); Sound.setMuted(false);
    if (tab === 0) { if (S.playing === it.key) { Sound.stopMusic(); S.playing = null; } else { Sound.playMusic(it.key); S.playing = it.key; } }
    else if (tab === 1) { if (S.amb === it.key) { Sound.ambiente(null); S.amb = null; } else { Sound.ambiente(it.key); S.amb = it.key; } }
    else if (tab === 3) { Sound.efecto(it.key, it.arg ?? undefined); S.flash = 30; }
    else { Sound.demo(it.key); S.flash = 30; }
  }
  function stopAll() { Sound.stopMusic(); Sound.ambiente(null); S.playing = null; S.amb = null; }
  function move(d) { const n = items(S.tab).length, t = S.tab; S.sel[t] = (S.sel[t] + d + n) % n; if (S.sel[t] < S.scroll[t]) S.scroll[t] = S.sel[t]; if (S.sel[t] >= S.scroll[t] + ROWS) S.scroll[t] = S.sel[t] - ROWS + 1; }
  function update() {
    S.t++; if (S.flash > 0) S.flash--; const p = Input.pressed;
    if (p.up) move(-1); if (p.down) move(1);
    if (p.left) S.tab = (S.tab + NT - 1) % NT; if (p.right) S.tab = (S.tab + 1) % NT;
    if (p.jump || p.confirm || p.fish) activate(S.tab, S.sel[S.tab]);
    if (p.pause) stopAll();
    if (Game.tapped) Game.tapped = false;
  }
  function tap(pt) {
    Sound.init();
    if (pt.y < TOP - 4) { const i = Math.floor(pt.x / (320 / NT)); if (i >= 0 && i < NT) S.tab = i; return; }
    if (pt.y >= 156) { stopAll(); return; }
    if (pt.x < 168) { const i = S.scroll[S.tab] + Math.floor((pt.y - TOP) / ROW), n = items(S.tab).length; if (i >= 0 && i < n) { S.sel[S.tab] = i; activate(S.tab, i); } return; }
    // The right column scrolls the list on a phone: top half up, bottom half down.
    move(pt.y < 94 ? -ROWS : ROWS);
  }
  const T = (g, s, x, y, c, al, sh = '#05050b') => ART.text(g, s, x, y, c, al || 'left', sh);
  const clip = (s, w) => { s = String(s); while (s.length > 1 && ART.textWidth(s) > w) s = s.slice(0, -4) + '..'; return s; };
  function draw(g) {
    Game.drawScene(g, S.t, S.tab === 1 && S.amb ? ({ noche: 'night', tormenta: 'storm', cueva: 'cave', rio: 'cave', nido: 'nest' }[S.amb] || 'dusk') : 'dusk');
    g.fillStyle = 'rgba(6,8,14,.78)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < NT; i++) { const on = i === S.tab, x = i * W / NT; g.fillStyle = on ? '#2b3a52' : '#141a26'; g.fillRect(x + 2, 3, W / NT - 4, 14); T(g, TABS[i], x + W / NT / 2, 7, on ? '#fff3b8' : '#6f7f99', 'center'); }
    const list = items(S.tab), t = S.tab, st = Sound.estado();
    for (let r = 0; r < ROWS; r++) {
      const i = S.scroll[t] + r, it = list[i]; if (!it) break; const y = TOP + r * ROW, sel = i === S.sel[t], on = (t === 0 && it.key === S.playing) || (t === 1 && it.key === S.amb);
      if (sel) { g.fillStyle = '#26324a'; g.fillRect(4, y - 2, 162, ROW); }
      T(g, (on ? '→ ' : '') + clip(it.label, on ? 140 : 150), 8, y, on ? '#a8f0a0' : sel ? '#ffffff' : '#b8c2d6');
    }
    if (list.length > ROWS) { const h = Math.max(6, ROWS / list.length * ROWS * ROW), y = TOP + S.scroll[t] / list.length * ROWS * ROW; g.fillStyle = '#3a4a66'; g.fillRect(167, TOP - 2, 2, ROWS * ROW); g.fillStyle = '#8fa6cc'; g.fillRect(167, Math.round(y) - 2, 2, Math.round(h)); }
    // Right column: what the selected entry is, or where the song is.
    const x = 176, it = list[S.sel[t]];
    g.fillStyle = 'rgba(20,26,38,.9)'; g.fillRect(x - 4, TOP - 2, W - x, 122);
    if (t === 0 && st.seccion) {
      T(g, clip(st.titulo, 136), x, TOP + 2, '#fff3b8');
      T(g, st.seccion + (st.vez ? ' (' + (st.vez + 1) + ')' : '') + ' · ' + st.compas + '/' + st.compases, x, TOP + 14, '#a8f0a0');
      T(g, Math.floor(st.t / 60) + ':' + String(Math.floor(st.t % 60)).padStart(2, '0') + (st.vueltas ? ' · vuelta ' + (st.vueltas + 1) : ''), x, TOP + 26, '#8fa6cc');
      st.forma.forEach((n, k) => { if (k > 14) return; const cx = x + (k % 5) * 27, cy = TOP + 42 + Math.floor(k / 5) * 12, cur = k === st.idx; g.fillStyle = cur ? '#4a7a3a' : '#222c40'; g.fillRect(cx, cy - 2, 25, 10); T(g, clip(n, 22), cx + 12, cy, cur ? '#ffffff' : '#7f8fab', 'center', null); });
    } else if (it && t === 0) {   // a song not playing: its tempo, length and form
      const inf = INFO[it.key] || (INFO[it.key] = Sound.info(it.key) || {}), s = Math.round(inf.primeraVuelta || 0);
      T(g, clip(it.label, 136), x, TOP + 2, '#fff3b8'); T(g, it.key + ' · ' + inf.tempo + ' bpm', x, TOP + 14, '#8fa6cc');
      T(g, Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' · ' + (inf.compases || 0) + ' compases', x, TOP + 26, '#8fa6cc');
      (inf.secciones || []).forEach((sc, k) => { if (k > 14) return; const cx = x + (k % 5) * 27, cy = TOP + 42 + Math.floor(k / 5) * 12; g.fillStyle = '#222c40'; g.fillRect(cx, cy - 2, 25, 10); T(g, clip(sc.nombre, 22), cx + 12, cy, '#7f8fab', 'center', null); });
      if (inf.vuelveA) T(g, 'vuelve a ' + inf.vuelveA, x, TOP + 82, '#6f7f99');
    } else if (it) {
      T(g, clip(it.label, 136), x, TOP + 2, '#fff3b8'); if (it.sub) T(g, it.sub, x, TOP + 14, '#8fa6cc');
      if (it.desc) ART.wrap(it.desc, 132).slice(0, 7).forEach((ln, k) => T(g, ln, x, TOP + 28 + k * 10, '#b8c2d6'));
      if (t >= 2 && S.flash) T(g, '★', W - 12, TOP + 2, '#a8f0a0');
    }
    // Bottom: what plays, and how to stop it.
    g.fillStyle = '#0c1018'; g.fillRect(0, 156, W, 24);
    T(g, '→ ' + (S.playing ? clip(st.titulo || S.playing, 150) : '-') + '   ~ ' + (S.amb || '-'), 6, 160, '#b8c2d6');
    T(g, Touch.enabled ? 'Toca aquí para parar todo' : '←→ pestaña · ↑↓ · Z toca · Esc para todo', 6, 170, '#5f7899');
  }
  return { start, update, draw, tap };
})();
