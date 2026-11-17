// Ruta del bot · 4 · El molino anegado (llega con soplido, aleteo y ventosa; Olga da el trago de agua
// cuando se acierta la diana de su compuerta: encargo «dianas»).
'use strict';
const { hookFrames, settled, R, D, DO, WATER, UNTIL, near, TALK } = require('./comun');
const TS = 16;
// Mosquitos and frogs move at random: a tricky move is tried from a snapshot and, if Nila gets hurt or it
// fails, the world is rewound, left to run a moment and tried again.
const RETRY = (label, fn, tries = 10) => DO(label, g => {
  let why = 'sin intentos';
  for (let k = 0; k < tries; k++) {
    const snap = g.snapshot(), hp = g.P.hp;
    why = fn(g);
    if (why === undefined) why = true;
    if (why === true && g.P.hp >= hp && !g.P.dead) return true;
    if (why === true) why = 'se hizo daño';
    g.restore(snap); g.run({}, 23 + k * 7);
  }
  return why;
});
// A reach that waits for a clear moment when the bugs are in the way.
const RS = (x, y, o) => RETRY('hasta ' + x + ',' + y, g => { const r = require('../bot').search([x, y], o || {}); return !r.fail || 'no llega'; }, 8);
const side = d => d < 0 ? { left: 1 } : d > 0 ? { right: 1 } : {};
// Turn to face `dir` without walking off (one frame of the key, then let friction stop her).
const faceOn = (g, dir) => { if (g.P.dir !== dir) g.frame(side(dir)); g.run({}, 6); };
// Olga's sluice: with a rock in the mouth, jump from the edge of the bank and spit it at the target high on the
// mill's wall at the top of the jump.
const DIANA_OLGA = DO('diana en la fachada', g => {
  for (let n = 0; n < 200 && g.P.x < 106 * TS + 2; n++) g.frame({ right: 1 });
  g.run({}, 12); g.run({ jump: 1 }, 1);
  for (let n = 0; n < 40 && g.P.vy < -.3; n++) g.frame({ jump: 1 });
  g.frame({ fish: 1 }); g.frame({});
  for (let n = 0; n < 80 && !g.P.onGround; n++) g.frame({});
  g.run({}, 20);
  return g.L.hitTargets.size === 1 || 'la diana no se abrió';
});
// Jump from the ground (flapping at the top if `flap`) and hold the jet drifting `dir`; with a target column `tx`
// (a lily pad), steer onto its middle once close. The jet holds her height: with `low` (a y in pixels) she sinks
// with {down} until her feet are that low, skimming the water.
const JUMP_JET = (label, dir, flap, tx, tol = 0, low) => RETRY(label, g => {
  const d = side(dir);
  g.run(Object.assign({ jump: 1 }, d), flap ? 16 : 10); if (flap) { g.frame(d); g.run(Object.assign({ jump: 1 }, d), 12); }
  for (let n = 0; n < 400 && !g.P.onGround; n++) {
    if (g.P.dead) return 'Nila murió';
    let inp = d;
    if (tx !== undefined) { const c = g.P.x + 5, t = tx * TS + 8, gap = t - c; if (Math.abs(gap) < 40) inp = gap > 2 + g.P.vx * 6 ? { right: 1 } : gap < -2 + g.P.vx * 6 ? { left: 1 } : {}; }
    if (low !== undefined && g.P.hover && g.P.y + g.P.h < low) inp = Object.assign({ down: 1 }, inp);
    g.frame(Object.assign(g.P.held ? { fish: 1 } : {}, inp));
  }
  if (!g.P.onGround) return 'no aterrizó';
  return tx === undefined || Math.abs(Math.floor((g.P.x + 5) / TS) - tx) <= tol || 'no cayó en la columna ' + tx;
});
// The mushroom and the roof: run into the pit, flap at the top of the bounce and hold the jet to the roof.
const SETA = RETRY('seta, aleteo y chorro al tejado', g => {
  let flap = false;
  for (let n = 0; n < 400; n++) {
    if (g.P.dead) return 'Nila murió';
    const inp = { right: 1 };
    if (!g.P.onGround && g.P.vy < -1 && g.P.y < 120) inp.fish = 0;
    if (!flap && !g.P.onGround && g.P.vy > -1 && g.P.y < 110) { inp.jump = 1; flap = true; }
    else if (flap && g.P.vy < 0) inp.jump = 1;
    else if (flap) inp.fish = 1;
    g.frame(inp);
    if (flap && g.P.onGround) break;
  }
  return (g.P.onGround && g.P.y < 60) || 'no llegó al tejado (y=' + Math.round(g.P.y) + ')';
});
const fireOut = (tx, ty) => ({ check: g => g.tileAt(tx, ty) !== 'F' || 'el fuego de ' + tx + ',' + ty + ' sigue encendido' });
// Jump, and belly-flop on the way down (the cracked floor under her breaks).
const HOP_POUND = [{ hold: { jump: 1 }, n: 12 }, { hold: {}, n: 2 }, { hold: { down: 1, jump: 1 }, n: 2 }, { hold: { down: 1 }, n: 40 }, { wait: 10 }];
const FLAP_UP = [{ hold: { jump: 1 }, n: 16 }, { hold: {}, n: 1 }, { hold: { jump: 1 }, n: 12 }];
const onCol = (tx, what) => ({ check: g => Math.floor((g.P.x + 5) / TS) === tx || 'no está en ' + what });
// The hooks of the beam: bite the first one straight up, let the fish reel across to the second, then jump
// straight up off it and drift right onto the ledge.
const VIGA = RETRY('los anzuelos de la viga', g => {
  for (let n = 0; n < 160 && !g.P.hanging; n++) g.frame({ fish: 1, up: 1 });
  if (!g.P.hanging) return 'no picó el primer anzuelo';
  const first = g.P.grapple;
  const r = hookFrames(g, g => !!(g.P.hanging && g.P.grapple && g.P.grapple !== first && settled(g.P)), { dir: 1, n: 300 });
  if (r !== true) return 'no pasó al segundo anzuelo';
  // Up off the hook and a flap; once clear above the beam, drift right onto it.
  const up = inp => Object.assign(inp, g.P.y + g.P.h < 32 ? { right: 1 } : {});
  for (let n = 0; n < 16; n++) g.frame(up({ jump: 1 })); g.frame(up({})); for (let n = 0; n < 12; n++) g.frame(up({ jump: 1 }));
  for (let n = 0; n < 120 && !g.P.onGround; n++) g.frame(up({}));
  return (g.P.onGround && g.P.y < 20) || 'no llegó a la viga (y=' + Math.round(g.P.y) + ')';
});
const A1 = [
  // 1-2 · la orilla y los surcos
  R(10, 9), R(14, 6), R(19, 11), R(29, 9), { hold: { jump: 1 }, n: 12 }, R(30, 9), RS(38, 11),
  // 3 · la chimenea de raíces y la cría de la izquierda
  R(45, 11), R(46, 2), RETRY('salto a la cría de la chimenea', g => { const p0 = g.L.pearls; for (let n = 0; n < 200 && !(n > 10 && g.P.onGround); n++) g.frame({ left: 1 }); return g.L.pearls > p0 || 'no cogió la cría'; }),
  R(46, 2), R(53, 3), R(58, 3), R(66, 11)];
const A2 = [
  // 4-5 · el molinillo y la carrera por el caz
  D('face', 1), D('puff', 1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0) || 'el molinillo no gira' },
  R(70, 11), R(80, 11), R(86, 11),
  // 5 · la esclusa: la caja a la placa alta
  near('crate', -2), D('face', 1), D('suck', 40), R(90, 7), D('drop'), { wait: 30 },
  { check: g => g.tileAt(96, 5) !== 'G' || 'la esclusa no se abrió' },
  ...FLAP_UP, R(91, 7), R(98, 11),
  // 6 · Olga: la diana en la fachada
  TALK({ learns: false }), near('rock', -1), D('face', 1), D('suck', 40), DIANA_OLGA, R(104, 11), TALK({ side: 2 }), R(113, 11), R(119, 11),
  // 7 · la charca y el fuego del molino
  R(124, 11), WATER(1), D('spit', 1), { wait: 30 }, fireOut(129, 8), R(128, 11)];
const A3 = [R(137, 11),
  // 8 · el primer río
  R(143, 11), WATER(1), JUMP_JET('río', 1, true), R(158, 11), R(162, 11), WATER(1)];
const A4 = [
  // 9 · la cortina de fuego: al nenúfar, apagar, beber y a la orilla
  JUMP_JET('al nenúfar', 1, true, 171), onCol(171, 'el nenúfar')];
const A5 = [
  WATER(1), D('spit', 1), { wait: 40 }, fireOut(177, 8), WATER(1), R(178, 11),
  // 10 · el canal de fuego
  R(182, 11), WATER(1), D('spit', 1), { wait: 30 }, fireOut(185, 10), R(190, 11),
];
const A5b = [
  R(193, 11), WATER(1), D('spit', 1), { wait: 30 }, fireOut(197, 10), R(201, 11),
  // 11 · la seta y el tejado
  WATER(1), R(204, 11), SETA, R(215, 3)];
const A6 = [R(222, 3),
  // 12-13 · la gran riada
  R(225, 11), WATER(1), JUMP_JET('al primer nenúfar', 1, false, 235), onCol(235, 'el primer nenúfar'),
  WATER(1), UNTIL('mosquito del segundo nenúfar lejos', g => g.L.ents.filter(e => e.kind === 'mosquito' && Math.abs(e.ox - 3891) < 8).every(e => e.x < 3850 && e.dir < 0)), JUMP_JET('al segundo nenúfar', 1, true, 245), onCol(245, 'el segundo nenúfar'),
  WATER(1), UNTIL('mosquito de la orilla lejos', g => g.L.ents.filter(e => e.kind === 'mosquito' && Math.abs(e.ox - 4003) < 8).every(e => e.x > 4040 && e.dir > 0)), JUMP_JET('a la otra orilla', 1, true, 256, 3)];
const A7 = [RS(262, 11), RS(279, 11),
  // 15 · el nenúfar del molinillo
  R(282, 11), WATER(1), JUMP_JET('al nenúfar del molinillo', 1, false, 290), onCol(290, 'el nenúfar del molinillo'),
  WATER(1), D('spit', 1), { wait: 40 }, fireOut(297, 8), D('puff', 1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0 && e.x > 4600) || 'el molinillo del río no gira' },
  WATER(1), R(293, 11), ...FLAP_UP, R(293, 11), R(297, 11), R(303, 11)];
const END = [
  // 16 · la barca
  R(311, 11), R(313, 11, { tol: 2 }), { hold: { right: 1 }, n: 60 }];
const steps = [...A1, ...A2, ...A3, ...A4, ...A5, ...A5b, ...A6, ...A7, ...END];
// Con todos los trucos: además, los cuatro rincones.
const repaso = { powers: 'todos', steps: [...A1,
  // el nicho de piedra reforzada: la piedra del farol, cargada contra la pared
  near('rock', 2), D('face', -1), D('suck', 40), R(67, 11), D('charge', -1), { wait: 30 }, { check: g => g.tileAt(65, 10) !== 'X' || 'la piedra reforzada aguanta' },
  R(62, 11), R(66, 11),
  ...A2,
  ...A3,
  // la cría baja sobre el río: salto corto y chorro raso hasta el nenúfar
  JUMP_JET('raso al nenúfar', 1, false, 171, 0, 9 * TS + 12), onCol(171, 'el nenúfar'),
  ...A5,
  // el sótano del canal de fuego: panzazo en las losas agrietadas
  R(189, 11), ...HOP_POUND, { check: g => g.tileAt(189, 11) !== 'x' || 'el suelo no se rompió' }, { wait: 20 }, R(189, 13), R(191, 11),
  ...A5b,
  // la cámara del tejado
  R(217, 3), ...HOP_POUND, { check: g => g.tileAt(217, 3) !== 'x' || 'el tejado no se rompió' }, R(216, 6), ...FLAP_UP, R(215, 3),
  ...A6,
  // la viga de los anzuelos
  R(258, 11), D('face', 1), VIGA, R(266, 2),
  ...A7] };
module.exports = { id: 'molino', steps, repaso };
