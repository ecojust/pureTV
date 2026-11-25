// Ruta del bot · 5 · El muelle del pescador (llega con soplido, aleteo, ventosa y chorro). Don Anselmo pide
// su caja de aparejos (encargo «entregar»): se sube en la boca por la chimenea de raíces. Con el mordisco,
// el caladero: cadenas de anzuelos, morder al vuelo, flotar y morder, y el pozo de los anzuelos.
'use strict';
const { hookFrames, settled, R, D, DO, FLAP, WATER, UNTIL, near, TALK } = require('./comun');
const LOG = label => DO('pos ' + label, g => { if (process.argv.includes('-v')) console.log('   ·', label, 'x', (g.P.x / 16).toFixed(1), 'y', ((g.P.y + g.P.h) / 16).toFixed(1), 'crías', g.L.pearls, 'hp', g.P.hp); });

// Jump, flap and hover right holding {fish} until Nila lands (then let go at once, so she doesn't walk off).
const FLOAT = (flapAt = 16) => DO('flota', g => {
  const hp0 = g.P.hp;
  g.frame({ right: 1 }); g.run({ right: 1, jump: 1 }, flapAt); g.run({ right: 1 }, 1); g.run({ right: 1, jump: 1 }, 12);
  for (let n = 0; n < 300 && !g.P.onGround && !g.P.dead; n++) g.frame({ right: 1, fish: 1 });
  g.run({}, 6); return g.P.hp < hp0 ? 'daño flotando' : g.P.onGround || 'no aterrizó';
});
// Ride the raft right, puffing backwards; hop for the cría overhead when no mosquito is about; stop at the far bank.
const BALSA = DO('balsa', g => {
  const raft = g.L.ents.find(e => e.kind === 'raft'); if (!raft) return 'sin balsa'; const hp0 = g.P.hp;
  // A raft standing still drops whoever stands on it when it bobs up (an engine quirk): board as it starts to
  // bob down and get it moving at once.
  if (g.P.carrier !== raft) {
    for (let n = 0; n < 4 && g.P.held; n++) { g.frame({ left: 1 }); g.run({}, 2); g.run({ fish: 1 }, 2); g.run({}, 20); }   // a full mouth can't puff
    let prev = raft.y; for (let n = 0; n < 300; n++) { g.frame({}); if (prev === 171 && raft.y === 172) break; prev = raft.y; }
    for (let n = 0; n < 60 && !(g.P.onGround && g.P.carrier === raft); n++) { const t = raft.x + 7; g.frame(Object.assign(n < 10 ? { jump: 1 } : {}, g.P.x < t - 1 ? { right: 1 } : g.P.x > t + 1 ? { left: 1 } : {})); }
    g.frame({ left: 1 }); g.frame({ puff: 1 }); g.run({}, 8);
  }
  for (let n = 0; n < 1500; n++) {
    const P = g.P; if (P.dead || P.hp < hp0) return 'Nila se hizo daño en la balsa';
    if (P.onGround && P.carrier === raft && Math.abs(raft.vx) < .3 && raft.x > 101 * 16) return true;
    if (!P.onGround) { const t = raft.x + 7; g.frame(P.x < t - 1 ? { right: 1 } : P.x > t + 1 ? { left: 1 } : {}); continue; }
    const bug = g.L.ents.some(e => e.kind === 'mosquito' && !e.dead && Math.abs(e.x - P.x) < 60);
    const cria = g.L.ents.find(e => e.kind === 'pearl' && e.y < P.y && Math.abs(e.x + 4 - (P.x + 5)) < 12);
    const ahead = g.L.ents.some(e => e.kind === 'pearl' && e.y < P.y && e.x + 4 - (P.x + 5) > 0 && e.x + 4 - (P.x + 5) < 70);
    if (cria && !bug && raft.vx < 1.2) { g.run({ jump: 1 }, 12); continue; }
    if (ahead && raft.vx < .3 && P.x + 11 < raft.x + raft.w) { g.frame({ right: 1 }); continue; }
    const near = g.L.ents.find(e => e.kind === 'pearl' && e.y < P.y && e.x + 4 - (P.x + 5) > 0 && e.x + 4 - (P.x + 5) < 30);
    if (near && raft.vx < .1 && !bug) { g.run({ jump: 1, right: 1 }, 8); g.run({ jump: 1 }, 4); continue; }   // a hop forward and back
    if (raft.vx < (ahead ? .1 : .7) && raft.x < 101 * 16) { g.frame({ left: 1 }); g.run({}, 3); g.frame({ puff: 1 }); g.run({}, 8); continue; }
    g.frame({});
  }
  return 'la balsa no llegó';
});
// Hold {fish} (plus `keys`) until Bigotes hangs from the hook at column `col` (auto-chaining from hook to hook).
const at = (a, col, row) => Math.floor(a.x / 16) === col && (row === undefined || Math.floor(a.y / 16) === row);
const HANG = (col, keys = {}, n = 500, row) => DO('cuelga del anzuelo ' + col, g => {
  const r = hookFrames(g, g => !!(g.P.hanging && g.P.grapple && at(g.P.grapple, col, row) && settled(g.P)), { keys, n, dir: keys.left ? -1 : keys.right ? 1 : 0, stop: a => at(a, col, row) });
  return r === true || r.replace('anzuelo', 'anzuelo ' + col);
});
// Jump (right), flap after `flap` frames if given, and bite the hook at `col` on the way.
const BITE = (col, o = {}) => DO('salta y muerde ' + col, g => {
  const d = o.dir < 0 ? { left: 1 } : { right: 1 }, hp0 = g.P.hp;
  g.run(Object.assign({ jump: 1 }, d), 1);
  for (let k = 1; k < 300; k++) {
    const inp = Object.assign({}, d);
    if (k < (o.hold || 14)) inp.jump = 1;
    if (o.flap && k === o.flap) { inp.jump = 1; } else if (o.flap && k === o.flap - 1) delete inp.jump;
    // Like a player: press Bigotes once the sight is on the hook we want (and keep holding while he lunges).
    const P = g.P; if (k >= (o.fishAt || 4) && (P.castTo || P.grapple || (P.target && at(P.target, col, o.row)))) inp.fish = 1;
    if (o.up) inp.up = 1;
    g.frame(inp);
    if (g.P.dead || g.P.hp < hp0) return 'daño saltando a ' + col;
    if (g.P.grapple && at(g.P.grapple, col, o.row)) return true;
    if (g.P.onGround && k > 10) return 'aterrizó sin morder ' + col;
  }
  return 'no mordió ' + col;
});
// Timing, like a player waiting for the right moment: wait k frames holding `still` (hanging: {fish}) (k = 0, 4, 8…), then play `steps`;
// keep the first k for which every step works.
const TIMED = (label, steps, max = 400, still = {}) => DO('a tiempo: ' + label, g => {
  const s0 = g.snapshot(); let why = '';
  for (let k = 0; k <= max; k += 4) {
    g.restore(s0); g.run(still, k); let ok = true;
    for (const s of steps) { const r = s.check(g); if (r !== true) { ok = false; why = r; break; } }
    if (ok) return true;
  }
  g.restore(s0); return 'nunca sale bien: ' + why;
});
// Water in the mouth: jump, flap and hover right holding {fish}; when the jet runs dry Bigotes goes on sucking
// and bites the hook ahead (column `col`). The jet holds her height: `dip` = [y, until] sinks her with {down} to
// feet at y (pixels) until she is past column `until` (for a cría below the line of flight).
const FLOAT_BITE = (col, flapAt = 16, dip) => DO('flota y muerde ' + col, g => {
  const hp0 = g.P.hp;
  g.frame({ right: 1 }); g.run({ right: 1, jump: 1 }, flapAt); g.run({ right: 1 }, 1); g.run({ right: 1, jump: 1 }, 12);
  for (let n = 0; n < 400; n++) {
    g.frame(Object.assign({ right: 1, fish: 1 }, dip && g.P.hover && g.P.y + g.P.h < dip[0] && g.P.x < dip[1] * 16 ? { down: 1 } : {}));
    if (g.P.dead || g.P.hp < hp0) return 'daño flotando';
    if (g.P.grapple && Math.floor(g.P.grapple.x / 16) === col) return true;
    if (g.P.onGround) return 'aterrizó';
  }
  return 'no mordió ' + col;
});
// A search step usable inside TIMED.
const GO = (x, y, o = {}) => DO('a ' + x + ',' + y, g => { const r = require('../bot').search([x, y], o); return !r.fail || 'no llega a ' + x + ',' + y; });
// Belly flop from where Nila stands: hop, then {down}+{jump} in the air, and wait for the landing.
const POUND = DO('panzazo', g => { g.run({ jump: 1 }, 8); g.frame({}); g.run({ down: 1, jump: 1 }, 2); for (let n = 0; n < 90 && (g.P.pound || !g.P.onGround); n++) g.frame({ down: 1 }); g.run({}, 6); return g.P.onGround || 'no aterrizó'; });
// The cría at column x, row y is home.
const GOT = (x, y) => ({ check: g => g.L.taken.has(x + ',' + y) || 'falta la cría de ' + x + ',' + y, label: 'cría ' + x + ',' + y });

// ---- The shore, the planks, the lilies and the crab.
const orilla = [
  R(11, 7), R(21, 11), R(25, 9), R(33, 9), ...FLAP(0), { wait: 30 }, R(37, 9), R(41, 11), LOG('nenúfares'),
  R(44, 11), R(47, 11), R(50, 11), DO('borde del nenúfar', g => { for (let n = 0; n < 20 && g.P.x < 806; n++) g.frame({ right: 1 }); g.run({}, 4); }), UNTIL('mosquito lejos', g => g.L.ents.filter(e => e.kind === 'mosquito' && Math.abs(e.x - g.P.x) < 150).every(e => e.x < 730 && e.dir < 0)), ...FLAP(0), { wait: 30 }, R(53, 11), R(57, 11), LOG('cangrejo'),
  near('rock', -2), D('face', 1), D('suck', 40), R(61, 11), D('face', 1),
  TIMED('cangrejo', [DO('pedrada', g => { g.run({}, 1); g.run({ fish: 1 }, 2); g.run({}, 30); return !g.L.ents.some(e => e.kind === 'crab' && !e.dead && !e.flipped && e.x < 74 * 16) || 'el cangrejo sigue ahí'; })])];
// ---- The river (hover), the mosquito, the raft.
const rio = [
  R(73, 11), LOG('orilla'), WATER(1), LOG('agua'), TIMED('mosquito del islote', [FLOAT()]), R(86, 11), LOG('balsa'),
  DO('el mosquito de la balsa', g => {
    const bug = () => g.L.ents.find(e => e.kind === 'mosquito' && !e.dead && Math.abs(e.x - g.P.x) < 160);
    if (!bug()) return true;
    for (let n = 0; n < 3000 && bug() && !(Math.abs(bug().x - g.P.x) < 12); n++) g.frame({});
    if (!bug()) return true;
    for (let n = 0; n < 50 && !g.P.held; n++) g.frame({ fish: 1, up: 1 });
    g.run({}, 14); if (!g.P.held) return 'sin mosquito';
    g.frame({ left: 1 }); g.run({}, 2); g.run({ fish: 1 }, 2); g.run({}, 30); return !g.P.held || 'no lo escupió';
  }), R(87, 11), BALSA, R(106, 11), LOG('caseta')];
// ---- Don Anselmo's crate, up the root chimney.
const anselmo = [
  near('crate', 2), D('face', -1), D('suck', 40), { check: g => g.P.held && g.P.held.kind === 'crate' || 'sin caja' },
  R(111, 3), LOG('arriba'), D('drop'), { wait: 20 }, TALK({ side: -2 })];
// ---- The fishing ground: the first chain and the pillar; then the mosquito, the planks and the crab.
const cadena1 = [R(118, 3), D('face', 1), HANG(127), LOG('B'), R(131, 6), LOG('pilote')];
const cadena2 = [
  TIMED('mosquito del caladero', [BITE(136, { fishAt: 6 }), HANG(146, { right: 1 })]), LOG('E'), R(150, 6), R(152, 6), LOG('tablones'),
  R(148, 11), near('rock', -1), D('face', 1), D('suck', 40),
  TIMED('cangrejo', [DO('pedrada', g => { g.run({}, 1); g.run({ fish: 1 }, 2); g.run({}, 30); return !g.L.ents.some(e => e.kind === 'crab' && !e.flipped) || 'el cangrejo sigue'; })]),
  R(162, 11), LOG('orilla'), WATER(1), FLOAT_BITE(179, 16, [6 * 16 + 6, 172]), HANG(184, { right: 1 }), LOG('G'), R(188, 11), LOG('cobertizo')];
// ---- The shed, the hook well, the last chain and the frogs.
const pozo = [
  TIMED('caracol', [GO(197, 7)]), R(203, 11), LOG('pozo'),
  BITE(209, { row: 8 }), HANG(209, {}, 240, 8), BITE(204, { dir: -1, row: 5 }), HANG(204, {}, 240, 5),
  BITE(209, { row: 2 }), HANG(209, {}, 240, 2), LOG('arriba del pozo'), R(213, 2), R(219, 2), LOG('última cadena'),
  D('face', 1), HANG(228),
  TIMED('mosquitos', [BITE(236), HANG(246, { right: 1 })], 400, { fish: 1 }), LOG('H5'), R(252, 11), LOG('ranas'),
  TIMED('ranas', [GO(264, 11), GO(268, 11), DO('salto a la cría', g => { const c = g.L.pearls; g.run({ right: 1, jump: 1 }, 16); g.run({ right: 1 }, 1); g.run({ right: 1, jump: 1 }, 10); for (let n = 0; n < 80 && !g.P.onGround; n++) g.frame({}); return g.L.pearls > c || 'sin cría'; }), GO(272, 11), GO(276, 11), GO(280, 11)])];
const barca = [R(292, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }];

// ---- Repaso (every trick): the four hidden crías.
// The sky walk: into the mushroom pit, belly flop on the way down from the first bounce, and the big bounce
// reaches the planks up in the sky.
const pasarela = [
  R(61, 11), DO('seta y panzazo', g => {
    g.run({}, 4); for (let n = 0; n < 40 && g.P.x < 993; n++) g.frame({ right: 1 });   // off the edge, into the pit
    for (let n = 0; n < 80 && !(g.P.vy < -7); n++) g.frame({});           // first bounce
    for (let n = 0; n < 80 && g.P.vy < 0; n++) g.frame({});                // up to the top
    g.run({}, 6); g.run({ down: 1, jump: 1 }, 2);
    for (let n = 0; n < 200 && !(g.P.vy < -9); n++) g.frame({ down: 1 });  // the big bounce
    for (let n = 0; n < 200 && !g.P.onGround; n++) g.frame(g.P.vy > -2 ? { right: 1 } : {});
    return g.P.onGround && g.P.y < 20 || 'no subió a la pasarela (y ' + g.P.y.toFixed(0) + ')';
  }), R(76, 1), GOT(76, 0), R(66, 1), R(60, 11, { tol: 1 }), R(72, 11)];
// Behind the reinforced stone at the foot of the stilts: a charged crate breaks it (and lands in the doorway:
// Bigotes sucks it back up and takes it to Don Anselmo).
const bajoCaseta = [near('crate', 2), D('face', -1), D('suck', 40), R(107, 11), D('charge', 1), { wait: 40 }, R(110, 11), R(111, 11), GOT(111, 9),
  D('face', -1), D('suck', 40), { check: g => g.P.held && g.P.held.kind === 'crate' || 'la caja no volvió a la boca' }, R(111, 3), D('drop'), { wait: 20 }, TALK({ side: -2 })];
// The cellar in the pillar: belly flop through the cracked stone, then out over the rim.
const bodega = [POUND, GOT(131, 8), R(133, 6)];
// The shed: a charged rock through its reinforced door.
const cobertizo = [near('rock', -1), D('face', 1), D('suck', 40), R(194, 11), D('charge', 1), { wait: 40 }, R(197, 11), GOT(197, 10), R(193, 11)];

module.exports = { id: 'muelle', steps: [...orilla, ...rio, ...anselmo, ...cadena1, ...cadena2, ...pozo, ...barca],
  repaso: { powers: 'todos', steps: [...orilla, ...pasarela, ...rio, ...bajoCaseta, ...cadena1, ...bodega, ...cadena2, ...cobertizo, ...pozo] } };
