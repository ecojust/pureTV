// Ruta del bot · 7 · La cueva de barro (llega con todo menos guindilla y resbalón). Don Pinzas quiere
// el fogón y la olla apagados (encargo «apagar»): dos viajes a la charca, uno escupiendo hacia arriba.
// `repaso`: con todos los trucos, todas las crías (los dos secretos piden el resbalón).
'use strict';
const { hookFrames, hangingAt, R, D, DO, HOVER, WATER, near, TALK } = require('./comun');
const TS = 16;
// Jump straight up, let go, then {down}+{jump} in the air: a belly flop onto the floor below.
const POUND = [{ hold: { jump: 1 }, n: 8 }, { hold: {}, n: 1 }, { hold: { down: 1, jump: 1 }, n: 2 }, { hold: { down: 1 }, n: 40 }, { wait: 10 }];
// Keep sucking (with `inp` held too) until Bigotes has bitten the hook at column `col` and Nila hangs from it.
const HANG = (col, inp = {}) => DO('colgada del anzuelo ' + col, g => {
  const r = hookFrames(g, hangingAt(col), { keys: inp, n: 400, dir: inp.left ? -1 : 1, stop: a => Math.floor((a.x + 5) / TS) === col });
  return r === true || r.replace('anzuelo', 'anzuelo ' + col);
});
// Keep sucking until Bigotes has bitten the hook at column `col` (still reeling in).
const BITE = (col, dir = 1) => DO('pica el anzuelo ' + col, g => {
  const r = hookFrames(g, g => { const a = g.P.grapple; return !!(a && Math.floor((a.x + 5) / TS) === col); }, { n: 300, dir, stop: a => Math.floor((a.x + 5) / TS) === col });
  return r === true || 'no picó el anzuelo ' + col;
});
// Let go of the hook jumping toward `dir`, holding it for `n` frames.
const HOP = (dir, n = 30) => [{ hold: {}, n: 1 }, { hold: Object.assign({ jump: 1 }, dir < 0 ? { left: 1 } : { right: 1 }), n }];
// Breathe out at a pinwheel: face `dir` and puff, then check that it spins.
const PUFF = dir => [D('puff', dir), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0) || 'el molinillo no gira' }];
// Hold a charged spit straight up (the aim is latched by {up}).
const CHARGE_UP = [{ hold: { fish: 1, up: 1 }, n: 52 }, { hold: { up: 1 }, n: 1 }, { wait: 20 }];
// Hop onto the mushroom at column `col`, ride the bounce straight up through the hole over it and, once
// above the floor of row `row`, drift `dir` onto it.
const BOUNCE = (col, dir, row) => DO('seta hasta la fila ' + row, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 }, cx = col * TS + 8;
  const steer = mid => mid < cx - 2 ? { right: 1 } : mid > cx + 2 ? { left: 1 } : {};
  let bounced = false;
  for (let n = 0; n < 600; n++) {
    const P = g.P, mid = P.x + 5;
    // Off the cap on the way down (a few pixels decide it): back to the mushroom and try again.
    if (bounced && P.onGround) { if (Math.floor((P.y + P.h + 1) / TS) === row) return true; bounced = false; }
    if (P.vy < -6) bounced = true;
    // First a full jump, steering over the cap so the fall lands on it; then up through the hole.
    if (!bounced) g.frame(Object.assign(P.onGround && n % 2 ? {} : { jump: 1 }, steer(mid)));
    else g.frame(P.y + P.h > row * TS ? steer(mid) : d);
  }
  return 'no llegó a la fila ' + row + ' (aterrizó en la fila ' + Math.floor((g.P.y + g.P.h + 1) / TS) + ')';
});
// Run `dir` until past column `col` with both feet down, slide, and keep going for `n` frames.
const SLIDE = (col, dir, n = 200) => DO('resbalón desde ' + col, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 }, px = col * TS + 8;
  for (let k = 0; k < 300 && !((dir > 0 ? g.P.x + 5 >= px : g.P.x + 5 <= px) && g.P.onGround && Math.abs(g.P.vx) > 1.2); k++) g.frame(d);
  g.frame(Object.assign({ down: 1 }, d)); if (!(g.P.slide > 0)) return 'no resbala en x=' + Math.round(g.P.x);
  g.run(d, n);
});
const gone = (x, y) => ({ check: g => g.tileAt(x, y) === '.' || 'sigue ahí ' + x + ',' + y + ': ' + g.tileAt(x, y) });
// The cría at (x, y) is home.
const CRIA = (x, y) => ({ check: g => g.L.taken.has(x + ',' + y) || 'falta la cría ' + x + ',' + y });
// Section by section, so that the review route (repaso) can reuse them.
const S = {
  // The entrance and the cracked floor into the low gallery; the first chimney of roots.
  entrada: [R(12, 11), R(25, 8), R(28, 8), ...POUND, R(33, 11), R(44, 11), R(52, 4), R(62, 4)],
  // Three hooks over the flooded pit.
  anzuelos: [R(63, 4), D('face', 1), HANG(75), ...HOP(1), R(79, 4)],
  // Down to the charca, water, and the jet over the thorns.
  chorro: [R(84, 11), WATER(1), ...HOVER(1, 120), R(98, 8)],
  // Don Pinzas: the pot on the shelf (spat upward) and the stove (spat across).
  cocina: [R(101, 11), TALK({ learns: false }),
    R(102, 11), WATER(1), R(110, 11), D('spit', 0, true), { wait: 30 }, gone(110, 6),
    R(102, 11), WATER(1), R(112, 11), D('spit', 1), { wait: 30 }, gone(117, 10),
    TALK({ side: -2 })],
  // The reinforced wall.
  muro: [near('rock', -2, 119), D('face', 1), D('suck', 40), R(120, 11), D('charge', 1), { wait: 20 }, gone(121, 5)],
  // One charged stone through the three crabs and the reinforced stone at the end of their corridor.
  cangrejos: [near('rock', -2, 136), D('face', 1), D('suck', 40), R(140, 11), D('charge', 1), { wait: 40 }, gone(158, 9),
    { check: g => !g.L.ents.some(e => e.kind === 'crab' && !e.dead && e.x < 2540 && !e.flipped) || 'queda algún cangrejo' },
    R(160, 11)],
  // The plug in the roof: a charged stone straight up, then the hook behind it.
  tapon: [near('rock', -2, 163), D('face', 1), D('suck', 40), R(167, 11), ...CHARGE_UP, gone(167, 7),
    HANG(167, { up: 1 }), ...HOP(1), R(170, 5)],
  // The pinwheel's clock: three pillars over the water before the gate drops.
  pilares: [R(172, 5), ...PUFF(1), R(196, 5), R(199, 5)],
  // Belly flop through the cracked floor, up the second chimney, over the gap; the hooks over the lake,
  // the island, water, and the jet to the shore.
  lago: [R(202, 5), ...POUND, R(205, 11), R(209, 11), R(212, 3), R(219, 3),
    D('face', 1), HANG(234), ...HOP(1, 40), R(237, 9), WATER(1), ...HOVER(1, 120), R(251, 9)],
  // The far target behind the crabs opens the roof over the mushroom.
  diana: [near('rock', -2, 254), D('face', 1), D('suck', 40), R(261, 11), D('charge', 1), { wait: 40 },
    { check: g => g.L.hitTargets.size === 1 || 'la diana no se abrió' }, { wait: 40 }],
  seta: [R(257, 11), BOUNCE(258, 1, 4)],
  // The upper corridor and the cracked floor down to the river.
  bajada: [R(281, 4), ...POUND, R(288, 11)],
  barca: [R(300, 11), R(313, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }],
};
const main = [...S.entrada, ...S.anzuelos, ...S.chorro, ...S.cocina, ...S.muro, ...S.cangrejos, ...S.tapon, ...S.pilares,
  ...S.lago, ...S.diana, ...S.seta, ...S.bajada, ...S.barca];
// With every trick, every cría: the one under the middle hook, the one over the pot, the two under the
// kitchen (resbalón against the pinwheel) and the two under the crabs (the same, from the river).
const repaso = [
  ...S.entrada, CRIA(33, 10), CRIA(47, 6),
  // Hooks: bite the second while hanging from the first, arrive looking up (so the third is not bitten),
  // let go onto the cría and bite the same hook again from below.
  R(63, 4), D('face', 1), BITE(71), HANG(71, { up: 1 }), { wait: 14 }, HANG(71, { up: 1 }), CRIA(71, 5), HANG(75), ...HOP(1), R(79, 4),
  R(84, 11), WATER(1), ...HOVER(1, 120, 0, [15, 35]), CRIA(91, 6), R(98, 8), ...S.cocina,   // the jet holds her over the cría: {down} to sink onto it
  // The pot's cría: onto the shelf, a flap straight up.
  R(110, 7), { hold: { jump: 1 }, n: 16 }, { hold: {}, n: 1 }, { hold: { jump: 1 }, n: 14 }, { wait: 30 }, CRIA(110, 4),
  // Secret 1: blow the pinwheel, drop into the hole and slide under the kitchen to the chamber; up through the plank.
  R(105, 11), ...PUFF(1), SLIDE(108, 1), CRIA(125, 12), CRIA(135, 12),
  R(137, 11),
  // The X wall from behind is not in the way any more; on through the crabs.
  ...S.cangrejos, CRIA(159, 10), ...S.tapon, CRIA(167, 6),
  // The cría over the gap between pillars 187 and 191: a jump and a flap through it (it used to be caught by chance).
  R(172, 5), ...PUFF(1), R(187, 5), DO('salto por la cría 189,2', g => { g.run({ right: 1, jump: 1 }, 8); for (let i = 8; i < 20; i++) g.frame({ right: 1 }); g.run({ right: 1, jump: 1 }, 12); for (let n = 0; n < 80 && !g.P.onGround; n++) g.frame({ right: 1 }); g.run({}, 4); return (g.P.onGround && Math.floor((g.P.x + 5) / TS) === 191) || 'no aterrizó en el pilar 191'; }), R(196, 5), R(199, 5), CRIA(189, 2), ...S.lago, CRIA(209, 5), ...S.diana,
  // The cría behind the crabs, then the mushroom.
  R(262, 11), R(273, 11), CRIA(273, 10), ...S.seta, ...S.bajada,
  // Secret 2: blow the pinwheel by the river, drop into the hole and slide back under the crabs.
  R(298, 11), ...PUFF(-1), SLIDE(293, -1, 220), CRIA(266, 12), CRIA(264, 12),
];
module.exports = { id: 'cueva', steps: main, repaso: { powers: 'todos', steps: repaso } };
