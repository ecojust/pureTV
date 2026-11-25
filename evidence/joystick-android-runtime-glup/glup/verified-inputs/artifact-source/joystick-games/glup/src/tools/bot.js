// GLUP — bot de pruebas. Recorre cada nivel siguiendo su ruta (tools/rutas/NN.js): los
// desplazamientos ({ reach }) los resuelve una búsqueda best-first sobre bloques de
// fotogramas; las acciones de Bigotes se escriben a mano. Cada nivel empieza con los trucos
// de los maestros de los niveles anteriores, y al acabar tiene que saber el de su maestro.
// Así se comprueba que todos los niveles se pueden terminar con lo que se tiene en ese punto.
//   node tools/bot.js            todos los niveles, en paralelo
//   node tools/bot.js 3 -v       sólo el nivel 3 (o su id: node tools/bot.js raices), contando cada paso
//
// Pasos de una ruta:
//   { reach: [col, fila], tol?, crouch?, hang?, extra?, nodes? }   ir hasta pisar esa celda (búsqueda)
//   { do: 'suck'|'spit'|'charge'|'puff'|'drop'|'face'|'hold', args: [...] }   acciones de Bigotes (ver A)
//   { hold: { right: 1, jump: 1 }, n }   mantener unas teclas n fotogramas     { wait: n }   no tocar nada
//   { check: g => true | 'por qué falla', label }   comprobar (o hacer cualquier cosa fotograma a fotograma)
//   { talk: { side: -2, learns: true } }   ir junto al maestro, hablar (↑), leerlo todo y, si learns, comprobar el truco
'use strict';
const { load } = require('./sim');
const g = load();
const TS = 16;

// ---------------------------------------------------------------- Búsqueda
// A node is a snapshot plus the frames that led to it. Actions are held for STEP frames.
const STEP = 5;
const ACTIONS = [];
for (const dir of [-1, 0, 1]) for (const jump of [0, 1]) for (const down of [0, 1]) if (!(down && !jump)) ACTIONS.push({ dir, jump, down });
for (const dir of [-1, 0, 1]) ACTIONS.push({ dir, jump: 1, keep: 1 });
const CROUCH = [{ dir: -1, crouch: 1 }, { dir: 1, crouch: 1 }];
function inputOf(a, prevJump, k) {
  const o = {}; if (a.dir < 0) o.left = 1; if (a.dir > 0) o.right = 1;
  if (a.jump) o.jump = 1; if (a.down && k === 0) o.down = 1; if (a.crouch) o.down = 1; if (a.hold) Object.assign(o, a.hold);
  return o;
}
function feetTile() { const P = g.P; return { tx: Math.floor((P.x + P.w / 2) / TS), ty: Math.floor((P.y + P.h + 1) / TS) }; }
function search(goal, opts = {}) {
  const maxNodes = opts.nodes || 12000;
  const start = g.snapshot(); const hp0 = g.P.hp;
  const tx = goal[0] * TS + 8, ty = goal[1] * TS;
  const h = () => { const P = g.P; return Math.abs(P.x + P.w / 2 - tx) + Math.abs(P.y + P.h - ty) * 1.2; };
  const done = () => { const P = g.P; if (P.win) return true; if (!(P.onGround || (opts.hang && P.hanging))) return false; const f = feetTile(); return Math.abs(f.tx - goal[0]) <= (opts.tol || 0) && f.ty === goal[1]; };
  if (done()) return { frames: 0 };
  const open = [{ snap: start, f: 0, h: h(), jump: false }]; const seen = new Set(); let best = null, n = 0;
  while (open.length && n < maxNodes) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].h + open[i].f * .35 < open[bi].h + open[bi].f * .35) bi = i;
    const node = open.splice(bi, 1)[0]; n++;
    for (const a of ACTIONS.concat(opts.crouch ? CROUCH : [], opts.extra || [])) {
      g.restore(node.snap); g.setPrev(node.jump ? { jump: 1 } : {});
      let ok = true;
      for (let k = 0; k < STEP; k++) {
        const inp = inputOf(a, node.jump, k);
        // A fresh jump press needs the key up first.
        if (a.jump && node.jump && k === 0 && !a.keep) { delete inp.jump; }
        g.frame(inp);
        if (g.P.dead || g.P.hp < hp0 || g.Game.fadeTo) { ok = false; break; }
        if (done()) break;
      }
      if (!ok) continue;
      const P = g.P;
      const key = [Math.round(P.x / 4), Math.round(P.y / 4), Math.round(P.vx), Math.round(P.vy / 2), P.onGround ? 1 : 0, P.airJumps, P.onWall, P.hanging ? 1 : 0, a.jump, g.L.solids.map(o => Math.round(o.x / 8) + ':' + Math.round(o.y / 8) + (o.ghost ? 'g' : '')).join('|')].join(',');
      if (seen.has(key)) continue; seen.add(key);
      const child = { snap: g.snapshot(), f: node.f + STEP, h: h(), jump: !!a.jump };
      if (done()) { g.restore(child.snap); return { frames: child.f, nodes: n }; }
      if (!best || child.h < best.h) best = child;
      open.push(child);
    }
  }
  g.restore(start);
  return { fail: true, nodes: n, best: best && (g.restore(best.snap), { x: Math.round(g.P.x), y: Math.round(g.P.y) }) };
}

// ---------------------------------------------------------------- Acciones
const A = {
  hold(inp, n) { g.run(inp, n); },
  suck(n = 40, up = false) { g.run(up ? { fish: 1, up: 1 } : { fish: 1 }, n); g.run({}, 2); },
  spit(dir, up = false) { if (dir) g.run(dir < 0 ? { left: 1 } : { right: 1 }, 2); g.run({}, 1); g.run(up ? { fish: 1, up: 1 } : { fish: 1 }, 2); g.run({}, 10); },
  charge(dir, up = false) { if (dir) g.run(dir < 0 ? { left: 1 } : { right: 1 }, 2); g.run({}, 1); g.run(up ? { fish: 1, up: 1 } : { fish: 1 }, 50); g.run({}, 10); },
  puff(dir) { if (dir) g.run(dir < 0 ? { left: 1 } : { right: 1 }, 2); g.run({}, 1); g.run({ puff: 1 }, 2); g.run({}, 20); },
  drop() { g.run({}, 1); g.run({ down: 1, fish: 1 }, 2); g.run({}, 10); },
  face(dir) { g.run(dir < 0 ? { left: 1 } : { right: 1 }, 1); g.run({}, 4); }
};

function runStep(s, v) {
  const before = { x: Math.round(g.P.x), y: Math.round(g.P.y) };
  if (s.reach) {
    if (typeof s.reach === 'function') s = Object.assign({}, s, { reach: s.reach(g) });
    const r = search(s.reach, s);
    if (r.fail) throw new Error('no llega a ' + s.reach + ' desde ' + JSON.stringify(before) + ' (mejor ' + JSON.stringify(r.best) + ', ' + r.nodes + ' nodos)');
    if (v) console.log('  reach', s.reach.join(','), '←', before.x, before.y, r.frames + 'f', (r.nodes || 0) + 'n');
  } else if (s.do) { A[s.do](...(s.args || [])); if (v) console.log('  ' + s.do, JSON.stringify(s.args || []), '→', g.P.held ? g.P.held.kind : '-'); }
  else if (s.hold) { g.run(s.hold, s.n || 1); }
  else if (s.wait) g.run({}, s.wait);
  else if (s.talk) talk(s.talk, v);
  else if (s.check) { const why = s.check(g); if (why !== true) throw new Error('comprobación: ' + (why || s.label || 'falló')); if (v) console.log('  ok', s.label || ''); }
  if (g.P.dead) throw new Error('Nila murió tras ' + JSON.stringify(s));
}

// Walk up to the teacher, talk, read everything (the gift and the learning card run on their own).
function talk(o, v) {
  const e = g.L.maestro; if (!e) throw new Error('este nivel no tiene maestro');
  // Two tiles' worth to the side of the teacher's middle (side -2: to the left), on the ground they stand on.
  const r = search([Math.floor((e.x + e.w / 2 + o.side * 12) / TS), Math.floor((e.y + e.h + 1) / TS)], { tol: 0 });
  if (r.fail) throw new Error('no llega junto al maestro (mejor ' + JSON.stringify(r.best) + ')');
  g.run({}, 2); g.frame({ up: 1 }); g.frame({});
  if (!g.Charla.active()) throw new Error('el maestro no quiere hablar (near=' + e.near + ')');
  for (let n = 0; n < 3000 && (g.Maestros.busy() || g.Game.learning); n++) g.frame(n % 4 === 0 ? { confirm: 1 } : {});
  g.run({}, 4);
  const pw = e.def.poder;
  if (v) console.log('  talk', e.who.id, pw, g.Save.has(pw) ? 'aprendido' : 'sin dar');
  if (o.learns && !g.Save.has(pw)) throw new Error(e.who.name + ' no le ha dado el ' + pw + ' (¿encargo sin cumplir?)');
}

// --repaso: the level's `repaso` route, with every trick, must rescue every cría (secrets included).
const REPASO = process.argv.includes('--repaso');
const ALL_POWERS = ['soplido', 'aleteo', 'ventosa', 'chorro', 'mordisco', 'panzazo', 'guindilla', 'resbalon'];
function runLevel(i, route, v) {
  const t0 = Date.now();
  const powers = route.powers === 'todos' ? ALL_POWERS : route.powers || g.NIVEL.poderesAntes(i);
  g.start(i, powers);
  for (const s of route.steps) runStep(s, v);
  const won = g.P.win || g.Game.state === 'clear';
  g.run({}, 90);
  const pearls = g.L.pearls, total = g.L.pearlsTotal;
  const taught = g.NIVEL.poderDe(g.LEVELS[i]), learned = !taught || g.Save.has(taught);
  return { won: (won || g.Game.state === 'clear') && learned, learned, taught, start: powers, pearls, total, secs: ((Date.now() - t0) / 1000).toFixed(1), powers: Object.keys(g.Save.data.powers) };
}

// Tile beside the nearest live entity of a kind: side -1 = to its left, +1 = to its right.
function beside(kind, side, fromX) {
  return gg => {
    const P = gg.P; let best = null;
    for (const e of gg.L.ents) if (!e.dead && e.kind === kind && (!best || Math.abs(e.x - (fromX === undefined ? P.x : fromX * TS)) < Math.abs(best.x - (fromX === undefined ? P.x : fromX * TS)))) best = e;
    if (!best) throw new Error('no hay ' + kind);
    const tx = Math.floor((best.x + best.w / 2) / TS) + side, ty = Math.floor((best.y + best.h + 1) / TS);
    return [tx, ty];
  };
}
module.exports = { g, search, A, runLevel, beside };

if (require.main === module) {
  const ROUTES = require('./rutas');
  const arg = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : null, v = process.argv.includes('-v');
  const only = arg === null ? null : /^\d+$/.test(arg) ? +arg - 1 : g.LEVELS.findIndex(l => l.id === arg);
  if (only === null && !process.argv.includes('--serie')) {
    // Every level in its own process, a few at a time.
    const { spawn } = require('child_process'), max = Math.max(1, Math.min(g.LEVELS.length, require('os').cpus().length - 1));
    const out = new Array(g.LEVELS.length); let next = 0, running = 0, fails = 0;
    const launch = () => {
      while (running < max && next < g.LEVELS.length) {
        const i = next++; running++; let buf = '';
        const ch = spawn(process.execPath, [__filename, String(i + 1)].concat(REPASO ? ['--repaso'] : []), { stdio: ['ignore', 'pipe', 'pipe'] });
        ch.stdout.on('data', d => { buf += d; }); ch.stderr.on('data', d => { buf += d; });
        ch.on('close', code => { out[i] = buf.trim(); if (code) fails++; running--; if (next < g.LEVELS.length) launch(); else if (!running) done(); });
      }
    };
    const done = () => { console.log(out.join('\n')); console.log(fails ? fails + ' niveles fallan' : 'Todos los niveles se pueden terminar.'); process.exit(fails ? 1 : 0); };
    launch();
  } else {
    let fails = 0;
    g.LEVELS.forEach((lv, i) => {
      if (only !== null && only !== i) return;
      const r0 = ROUTES[lv.id], r = r0 && (REPASO ? r0.repaso : r0);
      if (!r) { if (REPASO && r0 && lv.boss) return; fails++; console.log('FAIL nivel ' + (i + 1) + ' ' + lv.name + ': no hay ruta' + (REPASO ? ' de repaso (export repaso: { powers: \'todos\', steps })' : ' (tools/rutas/)')); return; }
      try { const res = runLevel(i, REPASO ? Object.assign({ powers: 'todos' }, r) : r, v); if (REPASO) { const ok = res.pearls === res.total; console.log((ok ? 'OK  ' : 'FAIL') + ' repaso ' + (i + 1) + ' ' + lv.name + ' · crías ' + res.pearls + '/' + res.total + ' · ' + res.secs + 's'); if (!ok) fails++; return; } console.log((res.won ? 'OK  ' : 'FAIL') + ' nivel ' + (i + 1) + ' ' + lv.name + ' · crías ' + res.pearls + '/' + res.total + ' · al llegar: ' + (res.start.join(',') || '-') + (res.taught ? ' · aprende ' + res.taught + (res.learned ? '' : ' (¡NO!)') : '') + ' · ' + res.secs + 's'); if (!res.won) fails++; }
      catch (e) { fails++; console.log('FAIL nivel ' + (i + 1) + ' ' + lv.name + ': ' + e.message + ' · x=' + Math.round(g.P.x) + ' y=' + Math.round(g.P.y) + ' tile ' + Math.floor(g.P.x / 16) + ',' + Math.floor(g.P.y / 16)); }
    });
    process.exit(fails ? 1 : 0);
  }
}
