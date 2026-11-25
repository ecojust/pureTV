// Ruta del bot · 6 · La turbera (llega con soplido, aleteo, ventosa, chorro y mordisco; Canto da el panzazo
// cuando están encendidos los tres faroles: el tercero, en lo alto de la seta).
'use strict';
const { hookFrames, settled, R, D, DO, FLAP, HOVER, WATER, near, TALK } = require('./comun');
const TS = 16;
// Stand on the mushroom at column `col`, hop onto it and, once bounced, drift `off` (1 right, -1 left) until she
// lands on firm ground away from it. Checks that she got above row `row`.
const SETA = (col, row = 3, off = 1) => DO('seta en ' + col, g => {
  for (let n = 0; n < 300 && Math.abs(g.P.x + 5 - (col * TS + 8)) > 2; n++) g.frame(g.P.x + 5 < col * TS + 8 ? { right: 1 } : { left: 1 });
  g.run({}, 6); g.run({ jump: 1 }, 4);
  let top = 1e9;
  for (let n = 0; n < 90; n++) { g.frame({}); top = Math.min(top, g.P.y); }
  const d = off < 0 ? { left: 1 } : { right: 1 };
  for (let n = 0; n < 300; n++) { g.frame(d); top = Math.min(top, g.P.y); if (g.P.onGround && g.tileAt(Math.floor((g.P.x + 5) / TS), Math.floor((g.P.y + g.P.h + 1) / TS)) !== '%' && Math.abs(g.P.x + 5 - (col * TS + 8)) > 16) break; }
  return top < row * TS || 'la seta no la subió (y=' + Math.round(top) + ')';
});
// Hooks: face `dir` (hanging, Bigotes can't turn), bite the first one (upwards, or straight ahead with
// `up: false`), then keep {fish} held so he hops from hook to hook until he hangs from the one at column
// `last`; there, jump off towards `dir`. With `pound`, belly-flop once past that column.
const HOOKS = (last, o = {}) => DO('anzuelos hasta ' + last, g => {
  const dir = o.dir || 1, d = dir < 0 ? { left: 1 } : { right: 1 };
  for (let n = 0; n < 10 && g.P.dir !== dir; n++) g.frame(d);
  g.run({}, 4);
  for (let n = 0; n < 120 && !g.P.grapple; n++) g.frame(o.up === false ? Object.assign({ fish: 1 }, d) : { fish: 1, up: 1 });
  if (!g.P.grapple) return 'no pica el primero';
  hookFrames(g, g => !!(g.P.hanging && g.P.grapple && Math.floor(g.P.grapple.x / TS) === last && settled(g.P)), { dir, n: 900, stop: a => Math.floor(a.x / TS) === last });
  if (!(g.P.hanging && Math.floor(g.P.grapple.x / TS) === last)) return 'no llegó al anzuelo ' + last;
  g.run(Object.assign({ jump: 1 }, d), 14);
  if (o.pound) { for (let n = 0; n < 100 && g.P.x < o.pound * TS && !g.P.onGround; n++) g.frame(d); g.frame({}); g.run({ down: 1, jump: 1 }, 2); for (let n = 0; n < 80 && g.P.pound; n++) g.frame({ down: 1 }); g.run({}, 20); }
  for (let n = 0; n < 200 && !g.P.onGround; n++) g.frame(d);
  return (g.P.onGround && g.P.hp === 3) || 'no aterrizó bien';
});
// Belly flop where she stands: hop, and in the air {down}+{jump}.
const POUND = [{ hold: { jump: 1 }, n: 6 }, { hold: {}, n: 1 }, { hold: { down: 1, jump: 1 }, n: 2 }, { hold: { down: 1 }, n: 40 }, { wait: 20 }];
// Walk right until the nearest live `kind` ahead is close, belly-flop (the blow stuns it) and walk on past it.
const STOMP = (kind, until) => DO('panzazo al ' + kind, g => {
  const ahead = () => g.L.ents.filter(e => !e.dead && e.kind === kind && !e.flipped && !(e.stun > 0) && e.x + e.w / 2 > g.P.x - 4).sort((a, b) => a.x - b.x)[0];
  for (let n = 0; n < 600; n++) { const e = ahead(); if (!e) return 'no hay ' + kind; if (e.x + e.w / 2 - (g.P.x + 5) < (e.dir < 0 ? 26 : 16)) break; g.frame({ right: 1 }); }
  g.run({ jump: 1 }, 5); g.frame({}); g.run({ down: 1, jump: 1 }, 2); for (let n = 0; n < 60 && g.P.pound; n++) g.frame({ down: 1 });
  // On past it, but not into the next one coming (the next STOMP deals with that).
  for (let n = 0; n < 60 && g.P.x < until * TS; n++) { const e = ahead(); if (e && e.x - (g.P.x + g.P.w) < 18) break; g.frame({ right: 1 }); }
  return g.P.hp === 3 || 'le hizo daño';
});
const MAIN = [
  SETA(12, 3), R(20, 11), R(27, 9), R(29, 9), ...FLAP(0), R(36, 11), R(44, 11), HOOKS(60), R(66, 11), R(75, 4),
  R(76, 4), WATER(1), R(82, 4), R(83, 4), ...HOVER(1, 150, 0, [25, 40]), R(99, 7),   // {down} over the cría at 91,0: the jet holds her above it
  R(110, 7), R(114, 7), SETA(115, 2), R(117, 2), R(122, 7), TALK(),
  R(129, 7), ...POUND, R(133, 10), R(129, 10, { tol: 0 }), ...POUND, R(130, 13),
  R(135, 12), STOMP('crab', 144), STOMP('crab', 149), SETA(151, 6), R(155, 7), R(160, 7), HOOKS(175), R(182, 7),
  WATER(1), R(186, 7), ...HOVER(1, 150, 0), R(200, 7), ...POUND, R(201, 13), R(208, 11, { tol: 1 }), R(210, 13), D('face', 1), D('suck', 40), D('spit', 1), { wait: 20 }, SETA(223, 6),
  R(227, 7), R(263, 7), R(270, 3), R(271, 3), HOOKS(285, { up: false, pound: 289 }), R(298, 11)];
// In the 2-wide pit before the tunnel: back to its left wall, run and slide in; the low roof keeps her sliding.
const SLIDE = DO('resbalón por el túnel', g => {
  g.run({}, 4); for (let n = 0; n < 40 && g.P.x > 232 * TS + 1; n++) g.frame({ left: 1 });
  for (let n = 0; n < 30 && g.P.vx < 1.3; n++) g.frame({ right: 1 });
  g.frame({ right: 1, down: 1 }); if (!(g.P.slide > 0)) return 'no resbala';
  g.run({ right: 1 }, 240);
});
// With every trick: the same way, plus the two hidden corners. After the lantern by the pinwheel, blow it and
// slide down the long tunnel before the gate shuts (on all fours it takes too long); the crías wait behind it
// and the plank hatch lets her back up. Then the stone by the walled chamber, spat charged, breaks the
// reinforced stone.
const at = MAIN.findIndex(s => s.reach && s.reach[0] === 227);
const REPASO = [...MAIN.slice(0, at + 1),
  R(228, 7), D('face', 1), D('puff', 1), { check: g => g.L.ents.some(e => e.kind === 'pinwheel' && e.spin > 0) || 'el molinillo no gira' },
  R(232, 10, { tol: 1 }), SLIDE, { check: g => g.P.x > 259 * TS || 'la compuerta se cerró' },
  R(262, 12), R(262, 7),
  near('rock', -2), D('face', 1), D('suck', 40), R(265, 7), D('charge', 1), { wait: 30 }, R(268, 7),
  ...MAIN.slice(MAIN.findIndex(s => s.reach && s.reach[0] === 270))];
module.exports = { id: 'turbera', steps: [...MAIN, R(314, 10, { tol: 2 }), { hold: { right: 1 }, n: 30 }],
  repaso: { powers: 'todos', steps: REPASO } };
