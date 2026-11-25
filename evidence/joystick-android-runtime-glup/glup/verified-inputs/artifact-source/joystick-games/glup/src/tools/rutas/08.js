// Ruta del bot · 8 · El río subterráneo (llega con todo menos el resbalón; Alga lo da a mitad).
// Dos balsas a soplidos (la segunda contra la compuerta del molinillo), nenúfares, anzuelos, cangrejos y
// piedra reforzada, el chorro, la chimenea y tres túneles resbalando.
// `repaso`: con todos los trucos, todas las crías (el rincón del fuego y la repisa de la seta incluidos).
'use strict';
const { hookFrames, hangingAt, R, D, DO, HOVER, WATER, SLIDE_AT, near, TALK } = require('./comun');
const TS = 16;
// Keep sucking (with `inp` held too) until Nila hangs from the hook at column `col`.
const HANG = (col, inp = {}) => DO('colgada del anzuelo ' + col, g => {
  const r = hookFrames(g, hangingAt(col), { keys: inp, n: 400, dir: inp.left ? -1 : 1, stop: a => Math.floor((a.x + 5) / TS) === col });
  return r === true || r.replace('anzuelo', 'anzuelo ' + col);
});
// Keep sucking until Bigotes has bitten the hook at column `col` (still reeling in).
const BITE = (col, dir = 1) => DO('pica el anzuelo ' + col, g => {
  const r = hookFrames(g, g => { const a = g.P.grapple; return !!(a && Math.floor((a.x + 5) / TS) === col); }, { n: 300, dir, stop: a => Math.floor((a.x + 5) / TS) === col });
  return r === true || 'no picó el anzuelo ' + col;
});
const HOP = (dir, n = 30) => [{ hold: {}, n: 1 }, { hold: Object.assign({ jump: 1 }, dir < 0 ? { left: 1 } : { right: 1 }), n }];
// Before the timed gate of the last tunnel: turn until really facing it (a hit-stop can swallow the turning frames), wait until
// the puff is ready, and puff again if the wheel did not catch the gust.
const PUFF = dir => [D('puff', dir), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0) || 'el molinillo no gira' }];
const PUFF_GO = dir => [DO('sopla al molinillo', g => {
  // The wheel in front of her (another one down the river may still be spinning from before).
  const d = dir < 0 ? { left: 1 } : { right: 1 }, spins = () => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0 && Math.abs(e.x - g.P.x) < 96);
  for (let t = 0; t < 3 && !spins(); t++) {
    for (let n = 0; n < 20 && g.P.dir !== dir; n++) g.frame(d);
    for (let n = 0; n < 30 && g.P.puffCd > 0; n++) g.frame({});
    g.run({ puff: 1 }, 2); for (let n = 0; n < 24 && !spins(); n++) g.frame({});   // go the moment it catches: the gate is on a timer
  }
  return spins() || 'el molinillo no gira';
})];
const gone = (x, y) => ({ check: g => g.tileAt(x, y) === '.' || 'sigue ahí ' + x + ',' + y + ': ' + g.tileAt(x, y) });
const CRIA = (x, y) => ({ check: g => g.L.taken.has(x + ',' + y) || 'falta la cría ' + x + ',' + y });
// Jump straight up and flap at the top (for a cría overhead), then wait to land.
const FLAP_UP = [{ hold: { jump: 1 }, n: 16 }, { hold: {}, n: 1 }, { hold: { jump: 1 }, n: 14 }, { wait: 40 }];
// Ride the raft Nila stands on to the right: face back and puff whenever it slows, until it rests against
// the bank past column `col`. Over each column in `hops` she jumps (for a cría overhead) and steers back onto
// the raft in the air.
const RIDE = (col, hops = []) => DO('balsa hasta ' + col, g => {
  const raft = g.P.carrier; if (!raft || raft.kind !== 'raft') return 'no está en la balsa';
  g.frame({ left: 1 }); g.frame({});
  const todo = hops.slice(); let last = false;
  for (let n = 0; n < 3000; n++) {
    const P = g.P, mid = P.x + 5, rc = raft.x + 12;
    if (P.dead || P.y + P.h > raft.y + 6) return 'se cayó de la balsa (y=' + Math.round(P.y + P.h) + ' balsa ' + Math.round(raft.y) + ')';
    if (!P.onGround) { g.frame(Object.assign(P.vy < 0 ? { jump: 1 } : {}, rc > mid + 1 ? { right: 1 } : rc < mid - 1 ? { left: 1 } : {})); continue; }
    if (Math.abs(mid - rc) > 24) return 'se bajó de la balsa (x=' + Math.round(mid) + ' balsa ' + Math.round(rc) + ')';
    if (raft.x > col * TS && Math.abs(raft.vx) < .2) return true;
    const h = todo.findIndex(c => Math.abs(mid - (c * TS + 8)) < 10);
    if (h >= 0) { todo.splice(h, 1); g.frame({ jump: 1 }); last = false; continue; }
    const inp = {};
    const soon = todo.some(c => c * TS + 8 - mid > 0 && c * TS + 8 - mid < 90);
    if (raft.x < col * TS && raft.vx < (soon ? 1 : 2.2) && P.puffCd === 0 && !(P.puffWind > 0) && !last) { if (P.dir > 0) { g.frame({ left: 1 }); g.frame({}); } inp.puff = 1; }
    last = !!inp.puff; g.frame(inp);
  }
  return 'la balsa no llegó a ' + col;
});
// With water in the mouth: jump, flap and hold the jet drifting `dir` until Nila is nearly over column
// `col`, then let go and steer the fall onto it.
const JET_TO = (col, dir = 1) => DO('chorro hasta ' + col, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 }, cx = col * TS + 8;
  g.run(Object.assign({ jump: 1 }, d), 16); g.run(d, 1); g.run(Object.assign({ jump: 1 }, d), 12);
  let n = 0;
  for (; n < 200 && (dir > 0 ? g.P.x + 5 < cx - 28 : g.P.x + 5 > cx + 28); n++) g.frame(Object.assign({ fish: 1 }, d));
  for (n = 0; n < 200 && !g.P.onGround && !g.P.dead; n++) { const mid = g.P.x + 5, v = g.P.vx, want = (cx - mid) / 12; g.frame(Math.abs(want - v) < .15 ? {} : (want > v ? { right: 1 } : { left: 1 })); }
  return (g.P.onGround && Math.floor((g.P.x + 5) / TS) === col) || 'no cayó en la columna ' + col + ' (x=' + Math.round(g.P.x) + ')';
});
// Walk into the pit onto the mushroom at column `col`; after its first bounce, belly-flop back onto it,
// rise straight up on the big bounce and, once above the floor of row `row`, drift `dir` onto it.
const POUND_BOUNCE = (col, dir, row) => DO('panzazo en la seta ' + col, g => {
  const cx = col * TS + 8, d = dir < 0 ? { left: 1 } : { right: 1 };
  const steer = mid => mid < cx - 2 ? { right: 1 } : mid > cx + 2 ? { left: 1 } : {};
  let bounced = false, pounded = false;
  for (let n = 0; n < 600; n++) {
    const P = g.P, mid = P.x + 5;
    if (pounded && !P.pound && P.vy < -9) break;
    if (P.vy < -6) bounced = true;
    if (bounced && !pounded && P.vy > 0) { g.frame({}); g.frame({ down: 1, jump: 1 }); g.frame({ down: 1 }); pounded = g.P.pound; continue; }
    // Before the first bounce: full jumps steered over the cap, so the fall lands on it.
    g.frame(bounced ? steer(mid) : Object.assign(P.onGround && n % 2 ? {} : { jump: 1 }, steer(mid)));
  }
  if (!pounded) return 'no hizo el panzazo';
  // Rising, hug the side of the free column next to the cap, just short of the ledge, so the drift is short.
  const hug = dir > 0 ? (col + 2) * TS - 8 : (col - 1) * TS + 8;
  const near = mid => mid < hug - 1 ? { right: 1 } : mid > hug + 1 ? { left: 1 } : {};
  for (let n = 0; n < 200; n++) {
    const P = g.P, mid = P.x + 5;
    if (P.onGround) return Math.floor((P.y + P.h + 1) / TS) === row || 'aterrizó en la fila ' + Math.floor((P.y + P.h + 1) / TS);
    g.frame(P.y + P.h > row * TS ? near(mid) : d);
  }
  return 'no llegó a la fila ' + row;
});
const S = {
  // The first raft, under the rock of thorns (no jumping there).
  balsa: [R(12, 11), R(14, 10), RIDE(40), R(47, 11)],
  // Lily pads (and the frog), then the hooks over the rapids.
  nenufares: [R(56, 11), R(64, 11), R(68, 11), R(72, 11)],
  anzuelos: [D('face', 1), HANG(74, { up: 1 }), HANG(84), ...HOP(1), R(88, 6)],
  // The crabs on the shelf and the reinforced stone: one charged stone.
  // Plant her on column 87: solid ground (82–86 is a gap) with the stone a tile and a half ahead.
  repisa: [R(88, 6), DO('ante la piedra', g => { for (let n = 0; n < 60 && !(g.P.onGround && g.P.x >= 1390 && g.P.x <= 1396); n++) g.frame(g.P.x > 1396 ? { left: 1 } : g.P.x < 1390 ? { right: 1 } : {}); g.run({}, 6); return (g.P.onGround && g.P.x >= 1388 && g.P.x <= 1398) || 'no se plantó ante la piedra (x=' + Math.round(g.P.x) + ')'; }), D('face', 1), D('suck', 40), R(90, 6), D('charge', 1), { wait: 40 }, gone(102, 3)],
  // Down to the bank, water, and the jet over the river to the chimney; up the chimney.
  rio: [R(105, 6), R(108, 11), WATER(1), ...HOVER(1, 120), R(123, 11)],
  chimenea: [R(126, 11), R(130, 3)],
  // Alga's grotto.
  alga: [R(134, 11), R(136, 11), TALK()],
  // The practice tunnel, then the long one against the pinwheel.
  tunel: [R(152, 11), R(159, 11, { crouch: true }), R(158, 11), ...PUFF(1), SLIDE_AT(160 * TS, 1, 200), R(188, 11)],
  // The crab tunnel.
  cangrejos: [R(191, 11), SLIDE_AT(193 * TS, 1, 160), R(217, 11)],
  // The second raft: the pinwheel opens the river gate.
  compuerta: [...PUFF(-1), R(221, 10), RIDE(252), R(257, 11)],
  // The last tunnel.
  ultimo: [R(260, 11), ...PUFF_GO(1), SLIDE_AT(262 * TS, 1, 200), R(291, 11)],
  // The last water: jet to the lily, jet to the bank, the boat.
  final: [R(292, 11), WATER(1), JET_TO(300), WATER(1), JET_TO(309), R(315, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }],
};
const main = [...S.balsa, ...S.nenufares, ...S.anzuelos, ...S.repisa, ...S.rio, ...S.chimenea, ...S.alga, ...S.tunel,
  ...S.cangrejos, ...S.compuerta, ...S.ultimo, ...S.final];
const repaso = [
  // A hop from the first raft for the cría over the river.
  R(12, 11), R(14, 10), RIDE(40, [39]), CRIA(39, 7), R(47, 11),
  R(56, 11), R(64, 11), ...FLAP_UP, CRIA(64, 6), R(68, 11), R(72, 11),
  // Hang from the middle hook looking up, let go onto the cría and bite it again.
  D('face', 1), HANG(74, { up: 1 }), BITE(79), HANG(79, { up: 1 }), { wait: 16 }, HANG(79, { up: 1 }), CRIA(79, 8), HANG(84), ...HOP(1), R(88, 6),
  // Over the river the jet holds her above the cría: sink onto it with {down}, then hold on to the far bank.
  ...S.repisa, R(105, 6), R(108, 11), WATER(1), ...HOVER(1, 120, 0, [15, 35]), CRIA(115, 6), R(123, 11),
  // The fire at the top of the chimney: water from the river, up the roots with it, spit it at the fire.
  D('face', -1), WATER(-1), ...S.chimenea, CRIA(126, 5), R(124, 3), D('spit', -1), { wait: 20 }, gone(123, 2), R(120, 3), CRIA(120, 2), CRIA(121, 2),
  R(130, 3), ...S.alga,
  // The mushroom in Alga's pit: a belly flop on it throws Nila up to the ledge under the roof.
  R(138, 11), POUND_BOUNCE(141, 1, 3), R(147, 3), CRIA(145, 2), CRIA(146, 2), R(143, 3), R(139, 13), R(137, 11), R(150, 11),
  ...S.tunel, CRIA(174, 10), ...S.cangrejos, CRIA(205, 10),
  ...PUFF(-1), R(221, 10), RIDE(252, [250]), CRIA(250, 7), R(257, 11),
  ...S.ultimo, CRIA(280, 10),
  R(292, 11), WATER(1), JET_TO(300), ...FLAP_UP, CRIA(300, 6),
];
module.exports = { id: 'rio', steps: main, repaso: { powers: 'todos', steps: repaso } };
