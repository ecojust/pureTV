// GLUP — prueba de humo: dibuja cada nivel, la charla con su maestro (con el encargo cumplido a la
// fuerza), el regalo del bocado y la ceremonia de aprenderlo, el fin de nivel, el final entero (del
// último recuento a la cinemática, los créditos, el FIN y el mapa) y el mapa (con el muro
// de zarzas cerrado y abierto, y la explicación de Ruca). Sólo comprueba que nada revienta.
//   node tools/humo.js
'use strict';
const { load } = require('./sim');
const g = load();
const draw = () => g.ev("Game.draw(document.createElement('canvas').getContext('2d'))");
let fails = 0;
const step = (label, fn) => { try { fn(); console.log('ok   ' + label); } catch (e) { fails++; console.log('FAIL ' + label + ': ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); } };

// The page itself: the inline scripts of index.html must compile (the simulator loads the files on its own and
// would not notice a broken loader), and every file they load must exist and be in the service worker's list.
step('index.html: scripts en línea y lista de archivos', () => {
  const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) throw new Error('no hay scripts en línea');
  for (const src of scripts) new vm.Script(src, { filename: 'index.html' });
  const loader = scripts.find(s => s.includes('document.write')); if (!loader) throw new Error('no encuentro el cargador');
  const written = []; const fake = { location: { protocol: 'https:', search: '' }, navigator: {}, document: { write: t => written.push(/src="([^"?]+)/.exec(t)[1]) }, addEventListener() {} };
  vm.runInNewContext(loader, fake);
  if (written.length < 20) throw new Error('el cargador solo escribe ' + written.length + ' scripts');
  for (const f of written) { if (!fs.existsSync(path.join(root, f))) throw new Error('falta el archivo ' + f); if (!sw.includes("'./" + f + "'")) throw new Error(f + ' no está en SHELL de sw.js'); }
});
g.LEVELS.forEach((lv, i) => {
  step((i + 1) + ' ' + lv.id + ': nivel', () => { g.start(i, g.NIVEL.poderesAntes(i)); for (let n = 0; n < 40; n++) { g.frame({ right: n % 3 === 0 ? 1 : 0 }); if (n % 10 === 0) draw(); } });
  if (!lv.maestro) return;
  step((i + 1) + ' ' + lv.id + ': maestro, regalo y ceremonia', () => {
    g.start(i, g.NIVEL.poderesAntes(i));
    const e = g.L.maestro; if (!e) throw new Error('sin Q');
    g.P.x = e.x + e.w / 2 - 30; g.P.y = e.y + e.h - 18; g.run({}, 10); draw();
    if (!e.near) throw new Error('Nila no queda cerca del maestro');
    if (lv.maestro.encargo) { g.frame({ up: 1 }); for (let n = 0; n < 600 && g.Charla.active(); n++) { g.frame(n % 6 === 0 ? { confirm: 1 } : {}); if (n % 7 === 0) draw(); } g.ev('Maestros.force(true)'); }
    g.frame({}); g.frame({ up: 1 });
    // Read the lines one by one, then watch the gift and the card (the sim skips the card, so drive it by hand here).
    for (let n = 0; n < 900 && (g.Charla.active() || g.Maestros.busy()); n++) { g.ev('Input.held = {}; Input.pressed = ' + (n % 9 === 0 && g.Charla.active() ? '{ confirm: true }' : '{}') + '; Game.update(); Input.pressed = {};'); if (n % 5 === 0) draw(); }
    for (let n = 0; n < 400 && g.Game.learning; n++) { g.ev('Input.pressed = ' + (g.Game.learning.t > 160 ? '{ confirm: true }' : '{}') + '; Game.update();'); if (n % 6 === 0) draw(); }
    if (!g.Save.has(lv.maestro.poder)) throw new Error('no aprendió ' + lv.maestro.poder);
    g.frame({ up: 1 }); for (let n = 0; n < 300 && g.Charla.active(); n++) { g.frame(n % 6 === 0 ? { confirm: 1 } : {}); if (n % 7 === 0) draw(); }
    g.ev('Maestros.force(false)');
  });
});
step('fin de nivel y vuelta al mapa', () => {
  g.start(2, g.NIVEL.poderesAntes(2));
  g.ev("Victoria.capture({ n: 2, t: 0, x: 1 })"); g.ev('Game.frozen = false; Game.capture = null');
  for (let n = 0; n < 900 && g.Game.state !== 'select'; n++) { g.frame(n % 30 === 0 ? { confirm: 1 } : {}); if (n % 9 === 0) draw(); }
  if (g.Game.state !== 'select') throw new Error('no volvió al mapa (' + g.Game.state + ')');
  for (let n = 0; n < 60; n++) { g.frame({}); if (n % 6 === 0) draw(); }
});
step('final: cinemática, créditos, FIN y vuelta al mapa', () => {
  // Enter it the way the last tally does, watch the first shot, then hold to run fast, tap through shots and credits.
  g.start(8, g.NIVEL.poderesAntes(8));
  g.ev("Victoria.capture({ n: 8, t: 0, x: 1 })"); g.ev('Game.frozen = false; Game.capture = null');
  for (let n = 0; n < 3000 && g.Game.state !== 'ending'; n++) g.frame(n % 30 === 0 ? { confirm: 1 } : {});
  if (g.Game.state !== 'ending') throw new Error('el último recuento no lleva al final (' + g.Game.state + ')');
  for (let n = 0; n < 120; n++) { g.frame({}); if (n % 7 === 0) draw(); }
  if (g.ev('Final.phase().name') !== 'cine') throw new Error('no empezó la cinemática');
  for (let n = 0; n < 300; n++) { g.frame({ confirm: 1 }); if (n % 11 === 0) draw(); }
  const t0 = g.ev('Final.state.T'); if (t0 < 900) throw new Error('mantener no acelera (' + t0 + ')');
  g.frame({});
  const seen = new Set();
  for (let n = 0; n < 20000 && g.Game.state === 'ending'; n++) { g.frame(n % 9 < 3 ? { confirm: 1 } : {}); seen.add(g.ev('Final.phase().name')); if (n % 13 === 0) draw(); }
  for (let n = 0; n < 60 && g.Game.state !== 'select'; n++) g.frame({});
  if (!seen.has('roll') || !seen.has('fin')) throw new Error('no pasó por los créditos y el FIN: ' + [...seen]);
  if (g.Game.state !== 'select') throw new Error('no volvió al mapa (' + g.Game.state + ')');
  // Every frame of the film and the credits draws, one in a few.
  g.ev("Game.state = 'ending'; Game.endT = 1; Final.start();");
  const total = g.ev('Final.total'); for (let T = 0; T < total + 400; T += 37) { g.ev('Final.state.T = ' + T); draw(); }
  g.ev('Game.select()');
});
step('mapa: muro cerrado, Ruca lo explica y no deja entrar', () => {
  g.ev("Save.data = Save.fresh(); LEVELS.forEach(d => { Save.data.abiertos[d.id] = true; }); Game.select(7, 8);");
  for (let n = 0; n < 200 && !g.Charla.active(); n++) { g.frame({}); if (n % 9 === 0) draw(); }
  if (!g.Charla.active()) throw new Error('Ruca no explicó el muro');
  for (let n = 0; n < 900 && g.Charla.active(); n++) { g.frame(n % 6 === 0 ? { confirm: 1 } : {}); if (n % 7 === 0) draw(); }
  g.frame({}); g.frame({ confirm: 1 }); g.run({}, 3); draw();
  if (g.Game.fadeTo) throw new Error('entró en el nido sin crías');
  for (let n = 0; n < 900 && g.Charla.active(); n++) g.frame(n % 6 === 0 ? { confirm: 1 } : {});
});
step('mapa: muro abierto', () => {
  g.ev("LEVELS.forEach(d => { const s = Save.criasSet(d.id); NIVEL.criasDe(d).forEach(k => { s[k] = 1; }); }); Game.select();");
  for (let n = 0; n < 40; n++) { g.frame(n === 20 ? { right: 1 } : {}); if (n % 5 === 0) draw(); }
  if (g.ev('Save.locked(8)')) throw new Error('sigue cerrado con todas las crías');
});
step('pausa: cartel, cursor, sonido, pistas, toques, seguir y salir al mapa', () => {
  for (const still of [true, false]) {
    g.start(3, g.NIVEL.poderesAntes(3)); g.ev('Game.still = ' + still); g.run({}, 5); g.setPrev({});
    g.frame({ pause: 1 }); if (!g.Game.paused) throw new Error('no se pausó');
    for (let n = 0; n < 90; n++) { g.frame({}); if (n % 3 === 0) draw(); }
    g.frame({ down: 1 }); g.run({}, 12); draw(); if (g.Game.pauseSel !== 1) throw new Error('el cursor no bajó (' + g.Game.pauseSel + ')');
    const muted = g.ev('Sound.isMuted()'); g.frame({ confirm: 1 }); g.run({}, 6); draw();
    if (g.ev('Sound.isMuted()') === muted || !g.Game.paused) throw new Error('el sonido no cambió o se fue la pausa');
    g.frame({ right: 1 }); g.frame({}); g.frame({ left: 1 }); g.run({}, 20); draw();
    g.ev('Game.tap(Pausa.ROWS.map(y => ({ x: 110, y }))[2])'); g.frame({}); if (g.Game.pauseSel !== 2 && !g.Game.fadeTo) throw new Error('tocar la fila no la eligió');
    if (g.Game.fadeTo) { for (let n = 0; n < 40 && g.Game.state !== 'select'; n++) { g.frame({}); draw(); } if (g.Game.state !== 'select') throw new Error('no salió al mapa'); }
    g.start(3, g.NIVEL.poderesAntes(3)); g.ev('Game.still = ' + still); g.setPrev({}); g.frame({ pause: 1 }); g.run({}, 40);
    g.frame({ up: 1 }); g.frame({}); g.frame({ up: 1 }); g.frame({}); if (g.Game.pauseSel !== 1) throw new Error('el cursor no da la vuelta (' + g.Game.pauseSel + ')');
    g.run({}, 600); draw();   // Bigotes dozes off
    g.frame({ pause: 1 }); if (g.Game.paused) throw new Error('Esc no reanuda');
    for (let n = 0; n < 14; n++) { g.frame({ right: 1 }); draw(); }
    if (g.ev('Pausa.showing()')) throw new Error('el cartel no se fue');
  }
  g.ev('Game.select()');
});
step('partida vieja (v1) migrada', () => {
  g.ev(`localStorage.setItem('glup.v1', JSON.stringify({ unlocked: 2, pearls: { 0: 6, 1: 10 }, totals: { 0: 11, 1: 10 }, best: { 0: 245 }, powers: { aleteo: true, soplido: true }, seen: { intro: true } })); Save.load();`);
  const d = g.Save.data;
  if (!d.abiertos.molino || d.best.embarcadero !== 245 || g.ev('Save.criasGot(0)') !== 6 || g.ev('Save.criasGot(1)') !== 10) throw new Error('migración: ' + JSON.stringify(d));
  g.ev('Game.select()'); for (let n = 0; n < 10; n++) { g.frame({}); draw(); }
});
console.log(fails ? fails + ' fallos' : 'Sin fallos.');
process.exit(fails ? 1 : 0);
