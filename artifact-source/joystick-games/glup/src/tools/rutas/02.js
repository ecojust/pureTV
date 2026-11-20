// Ruta del bot · 2 · Los juncos (llega con el soplido; Lumi da el aleteo cuando están los tres faroles).
// `repaso`, con todos los trucos: la chimenea de raíces (ventosa), la bodega de piedra rajada (panzazo),
// la cueva del fuego fatuo (chorro) y el túnel del molinillo (resbalón).
'use strict';
const { R, D, UP, WATER, SLIDE_AT, near, TALK } = require('./comun');
const { CLEAR, HOP, RETRY, RAFT_TO, got } = require('./01').ayudas;
// The crab between x0 and x1 (pixels) is out of the way: turned over, or gone.
const tamed = (x0, x1) => g => g.L.ents.every(e => e.dead || e.kind !== 'crab' || e.x < x0 || e.x > x1 || e.flipped);

// The crab at the gate: a stone at it, then the crab at the target.
const crabGate = [R(22, 11), RETRY('diana del cangrejo', 5, [
  { do: 'spit', args: [-1] }, { wait: 10 },
  near('rock', -2), D('face', 1), D('suck', 40), R(27, 11), D('face', 1), D('spit', 1), { wait: 30 },
  near('crab', -2), D('face', 1), D('suck', 40), R(29, 11), D('face', 1), D('spit', 1), { wait: 40 }], g => g.L.hitTargets.size === 1), R(38, 11)];
const raft = [R(44, 10, { tol: 1 }), RAFT_TO(57 * 16), R(59, 11)];
// Flip the crab on the plank from below, then up the planks.
const planks = [R(61, 11), RETRY('voltear el cangrejo de la tabla', 5, [
  { do: 'spit', args: [-1] }, { wait: 10 }, near('rock', -2), D('face', 1), D('suck', 40),
  { reach: g => [Math.max(64, Math.min(67, Math.floor((g.L.ents.find(e => e.kind === 'crab' && !e.dead).x + 8) / 16))), 11] }, ...UP, { wait: 20 }], tamed(60 * 16, 80 * 16)),
  R(65, 8, { tol: 1 }), R(72, 5), R(80, 10)];
// The cellar: stand on the hatch, spit up at the target, drop in, light the lantern, out again.
const cellar = [RETRY('trampilla', 4, [near('rock', -2, 82), D('face', 1), D('suck', 40), R(88, 10), ...UP, { wait: 40 }], g => g.L.hitTargets.size === 2),
  R(84, 13), { check: g => g.L.lit.size >= 3 || "farol de la bodega apagado" }, R(92, 13), R(91, 10, { tol: 1 })];
// With the flap: the wall, the thorn pit, the crab on its plank, the target on the post.
const pit = [R(97, 5), R(101, 5), R(107, 8), R(117, 8), R(127, 8, { tol: 2 }),
  CLEAR(60), R(139, 8), D('spit', -1), { wait: 10 }, D('face', 1), D('suck', 40), { check: g => !!g.P.held || 'no coge la piedra del poste' }, R(139, 8), ...UP, { wait: 40 }, { check: g => g.L.hitTargets.size === 3 || 'la diana del poste no se abrió' }, R(145, 11)];
const piles = [R(146, 11), R(152, 8), R(158, 4), CLEAR(70), R(164, 7), R(168, 11)];
const end = [R(174, 8), ...HOP, R(178, 11), R(186, 11), R(192, 8), R(203, 11), R(211, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }];

module.exports = { id: 'juncos',
  steps: [R(14, 8), ...crabGate, ...raft, ...planks,
    TALK({ learns: false }), ...cellar, TALK(), ...pit, ...piles, ...end],
  repaso: { powers: 'todos', steps: [
    // Ventosa: up the root chimney behind the start.
    R(2, 11), R(2, 3, { nodes: 30000 }), got(1), R(6, 11),
    // Panzazo: a belly flop through the cracked stone into the cellar under the floor.
    R(8, 11), { hold: { jump: 1 }, n: 8 }, { hold: {}, n: 1 }, { hold: { down: 1, jump: 1 }, n: 2 }, { hold: { down: 1 }, n: 40 },
    R(11, 13, { crouch: true }), got(2), R(9, 13), R(13, 11),
    R(14, 8), ...crabGate, ...raft, ...planks, ...cellar, ...pit, ...piles,
    // Chorro: water from the pond, onto the fire at the cave mouth.
    WATER(-1), R(169, 11), D('spit', 1), { wait: 40 }, { check: g => g.tileAt(171, 10) !== 'F' || 'el fuego sigue' }, R(175, 11),
    R(174, 8), ...HOP,
    // Resbalón: puff the pinwheel in the hollow and slide the long low tunnel before its gate shuts.
    R(182, 13), D('face', -1), D('puff', -1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 250) || 'el molinillo no gira' },
    SLIDE_AT(182 * 16 + 14, 1, 240), R(208, 13, { crouch: true }), got(13), R(208, 11), R(192, 8), got(14),
    R(203, 11), R(211, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }] } };
