// Ruta del bot · 1 · El embarcadero (sin trucos; Ruca da el soplido a mitad).
// `repaso`, con todos los trucos, rescata también las crías escondidas: la tabla alta (aleteo), la chimenea de
// raíces (ventosa), el anzuelo sobre los nenúfares (mordisco) y la cueva tapiada (guindilla).
'use strict';
const { R, D, UNTIL, near, TALK } = require('./comun');
// No mosquito within `d` pixels of Nila.
const CLEAR = (d = 70) => UNTIL('mosquito lejos', g => g.L.ents.every(e => e.dead || e.kind !== 'mosquito' || Math.abs(e.x - g.P.x) > d));
// Hop straight up where she stands (for a cría just over her head).
const HOP = [{ hold: { jump: 1 }, n: 12 }, { wait: 40 }];
// Bite the hook overhead and hang from it.
const BITE = [{ hold: { fish: 1, up: 1 }, n: 140 }, { check: g => g.P.hanging || 'no cuelga del anzuelo' }];
// Run `steps` again and again (at most `n` times) until `cond(g)` holds: for what a hopping frog can spoil.
const RETRY = (label, n, steps, cond) => ({ label, check: g => {
  const { search, A } = require('../bot');
  for (let k = 0; k < n; k++) {
    if (cond(g)) return true;
    for (const s of steps) {
      if (s.reach) { const r = search(typeof s.reach === 'function' ? s.reach(g) : s.reach, s); if (r.fail) break; }
      else if (s.do) A[s.do](...(s.args || [])); else if (s.hold) g.run(s.hold, s.n || 1); else if (s.wait) g.run({}, s.wait);
      else if (s.check) { if (s.check(g) !== true) break; }
      if (g.P.dead) return 'Nila murió: ' + label;
    }
  }
  return cond(g) || 'no pudo: ' + label;
} });
const got = n => ({ check: g => g.L.pearls >= n || 'sólo ' + g.L.pearls + ' crías (faltan hasta ' + n + '; quedan en ' + g.L.ents.filter(e => e.kind === 'pearl' && !e.dead).map(e => (e.x >> 4) + ',' + (e.y >> 4)).join(' ') + ')' });

const start = [R(16, 9),
  // The stone against the cracked rock (the snail goes down with it).
  near('rock', -2), D('face', 1), D('suck', 40), R(29, 11), D('face', 1), D('spit', 1), { wait: 40 },
  { check: g => g.tileAt(34, 8) !== 'x' || 'la roca rajada sigue ahí' }, R(38, 11)];
const burrow = [R(48, 11, { crouch: true }), R(58, 11, { crouch: true })];
const crateAndTarget = [
  near('crate', -2, 63), D('face', 1), D('suck', 40), R(72, 11), D('drop'), R(76, 7),
  R(88, 11), RETRY('abrir la diana', 4, [{ do: 'spit', args: [-1] }, { wait: 20 }, near('rock', -2), D('face', 1), D('suck', 40), R(91, 11), D('face', 1), D('spit', 1), { wait: 40 }],
    g => g.L.hitTargets.size === 1), R(98, 11),
  R(101, 11), R(105, 11), R(108, 11), CLEAR(), ...HOP];
const pads = [R(111, 11), R(114, 11), R(118, 11)];
const plate = [near('crate', -2, 122), D('face', 1), D('suck', 40), R(129, 11), D('drop'), { wait: 30 }, R(138, 11)];
const race = [R(149, 11), D('face', 1), D('puff', 1), R(158, 11),
  R(161, 11), D('face', 1), D('puff', 1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 250) || 'el molinillo no gira' },
  R(182, 11)];
const mound = [R(188, 8), ...HOP];
const end = [R(196, 8), R(203, 8), R(208, 9),
  { hold: { right: 1, jump: 1 }, n: 18 }, { hold: { right: 1 }, n: 30 }, R(214, 11),
  R(232, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }];

// Ride the raft to the right, puffing backwards, hopping for any cría that passes overhead (with a mosquito
// near, wait for it to drift off first); done once the raft rests with its right end past `px`.
const RAFT_TO = px => ({ label: 'balsa', check: g => {
  const raft = g.L.ents.find(e => e.kind === 'raft'); if (!raft) return 'sin balsa';
  for (let n = 0; n < 1500; n++) {
    const P = g.P; if (P.dead) return 'Nila se cayó';
    if (P.onGround && P.carrier === raft && Math.abs(raft.vx) < .3 && raft.x + raft.w > px) return true;
    if (!P.onGround) { const t = raft.x + 7; g.frame(Object.assign({ jump: 1 }, P.x < t - 1 ? { right: 1 } : P.x > t + 1 ? { left: 1 } : {})); continue; }
    const bugE = g.L.ents.find(e => !e.dead && e.kind === 'mosquito' && !(e.stun > 0) && Math.abs(e.x - P.x) < 80), bug = !!bugE;
    // A mosquito close by: turn to it and puff it out of the way (it shoves the raft back a little).
    if (bugE && P.puffCd === 0 && !(P.puffWind > 0)) { const d = bugE.x > P.x ? 1 : -1; g.frame(d > 0 ? { right: 1 } : { left: 1 }); g.run({}, 2); g.frame({ puff: 1 }); g.run({}, 10); continue; }
    const cria = g.L.ents.find(e => e.kind === 'pearl' && !e.dead && e.y < P.y && Math.abs(e.x + 4 - (P.x + 5 + raft.vx * 12)) < 9);
    if (cria && !bug) { g.frame({ jump: 1 }); continue; }
    if (raft.vx < .6 && !(cria && bug)) { g.frame({ left: 1 }); g.run({}, 3); g.frame({ puff: 1 }); g.run({}, 8); continue; }
    g.frame({});
  }
  return 'la balsa no llegó';
} });

module.exports = { id: 'embarcadero', ayudas: { CLEAR, HOP, BITE, RETRY, RAFT_TO, got },
  steps: [...start, ...burrow, ...crateAndTarget, ...pads, ...plate, TALK(), ...race, ...mound, ...end],
  repaso: { powers: 'todos', steps: [
    // Aleteo: the high plank over the dock.
    R(4, 6), got(1),
    ...start, ...burrow,
    // Ventosa: up the hanging roots to the plank at the top.
    R(57, 11), R(56, 3, { tol: 1 }), got(5), R(62, 11),
    ...crateAndTarget,
    // Mordisco: from the middle lily pad, bite the hook and jump to the high plank.
    R(111, 11), CLEAR(), ...BITE, { hold: { right: 1, jump: 1 }, n: 12 }, R(114, 3), got(8), R(118, 11),
    ...plate, ...race, ...mound,
    // Guindilla: a charged spit (the frog will do) through the reinforced stone.
    near('rock', -2, 192), D('face', 1), D('suck', 40), D('charge', 1), { wait: 30 },
    { check: g => g.tileAt(194, 10) !== 'X' || 'la piedra reforzada sigue ahí' }, R(197, 11), got(12),
    ...end] } };
