// Ruta del bot · 3 · El bosque de raíces (llega con soplido y aleteo; Tía Lapa da la ventosa para las chimeneas).
// `repaso`, con todos los trucos: la percha del anzuelo (mordisco), la cueva tapiada (guindilla), la cámara
// bajo la piedra rajada (panzazo) y la cueva del fuego fatuo (chorro).
'use strict';
const { R, D, WATER, near, TALK } = require('./comun');
const { CLEAR, BITE, got } = require('./01').ayudas;
const CLIMB = { nodes: 40000 };

const canopy = [R(11, 8), CLEAR(80), R(28, 6), R(34, 4), CLEAR(90), R(44, 5), R(54, 4)];
const pinwheel = [R(57, 11), D('face', 1), D('puff', 1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 250) || 'el molinillo no gira' },
  R(78, 11)];
// The crate on the branch: sucked down from below, carried to the plate.
const crate = [R(81, 11), R(86, 11), { hold: { fish: 1, up: 1 }, n: 60 }, { wait: 4 }, { check: g => (g.P.held && g.P.held.kind === 'crate') || 'no sorbe la caja' },
  R(92, 11), D('drop'), { wait: 30 }, R(100, 11)];
const chimney1 = [R(122, 11), R(125, 2, CLIMB), R(127, 2), R(142, 11)];
const chimney2 = [R(148, 11), R(152, 2, CLIMB), R(153, 2)];
const pond = [R(163, 2), R(165, 11), R(172, 11), R(176, 8), R(181, 11)];
const chimney3 = [R(185, 11), R(190, 2, CLIMB)];
const end = [R(203, 2), R(210, 4), R(218, 3), R(226, 3), R(232, 11), R(242, 11), R(268, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }];

module.exports = { id: 'raices',
  steps: [...canopy, ...pinwheel, ...crate, TALK(), ...chimney1, ...chimney2, ...pond, ...chimney3, ...end],
  repaso: { powers: 'todos', steps: [
    ...canopy,
    // Mordisco: the hook over the pinwheel, and the perch.
    R(69, 11), ...BITE, { hold: { right: 1, jump: 1 }, n: 12 }, R(72, 3), got(4),
    ...pinwheel, ...crate, ...chimney1,
    // Guindilla: the stone by the mass, a charged spit into the reinforced stone.
    near('rock', -2), D('face', 1), D('suck', 40), D('charge', -1), { wait: 30 }, { check: g => g.tileAt(137, 10) !== 'X' || 'la piedra reforzada sigue ahí' },
    R(135, 11), R(142, 11),
    ...chimney2,
    // Panzazo: a belly flop through the cracked stone on top of the mass.
    R(155, 2), { hold: { jump: 1 }, n: 8 }, { hold: {}, n: 1 }, { hold: { down: 1, jump: 1 }, n: 2 }, { hold: { down: 1 }, n: 40 },
    R(157, 5), R(159, 2),
    // Chorro: water from the puddle, onto the will-o'-the-wisp at the cave mouth.
    R(163, 2), R(166, 11), WATER(1), R(165, 11), D('spit', -1), { wait: 40 }, { check: g => g.tileAt(163, 10) !== 'F' || 'el fuego sigue' }, R(160, 11),
    R(172, 11), R(176, 8), R(181, 11), ...chimney3, ...end] } };
