// Small hand-made boards checking each rule in the design's "Rules (exact)".
import * as R from '../src/rules.js';
import { solve } from '../src/solver.js';

let failed = 0, passed = 0;
function ok(cond, msg) {
  if (cond) passed++; else { failed++; console.log('FAIL:', msg); }
}
function throws(fn, msg) {
  try { fn(); ok(false, msg + ' (did not throw)'); } catch { ok(true, msg); }
}
const lvl = o => ({ w: 6, h: 6, turtles: [], beetles: [], fish: [], reeds: [], ...o });

// Hop lands on the first pad in line; passes water; range 3.
{
  const L = lvl({ pads: [[0, 0, 1], [2, 0, 1], [3, 0, 1], [0, 4, 1]] });
  const s = R.initState(L);
  const t = R.hopTarget(L, s, 'R');
  ok(t && t.x === 2 && t.dist === 2, 'hop lands on the first pad in line');
  ok(R.hopTarget(L, s, 'D') === null, 'nothing within 3 cells: no hop');
  ok(R.hopTarget(L, s, 'L') === null, 'off the grid: no hop');
  const s2 = R.apply(L, s, 'R');
  ok(s2.pips[0] === 0 && s2.fx === 2 && !(s2.flies & 2), 'leaving a 1-pip pad sinks it; fly eaten');
  ok(R.hopTarget(L, s2, 'L') === null, 'sunk pad is not landable');
  ok(R.apply(L, s2, 'R').status === 'play', 'hop to the next pad');
}
// Hopping over a sunk pad.
{
  const L = lvl({ pads: [[0, 0, 2], [1, 0, 1], [3, 0, 1]] });
  let s = R.initState(L);
  s = R.apply(L, s, 'R'); // to (1,0)
  s = R.apply(L, s, 'L'); // back to start, (1,0) sinks
  ok(s.pips[1] === 0 && s.pips[0] === 1, 'pip loss on departure only');
  const t = R.hopTarget(L, s, 'R');
  ok(t && t.x === 3, 'sunk pads are hopped over');
  s = R.apply(L, s, 'R');
  ok(s.status === 'won', 'all flies eaten = won');
}
// Beetles block hops; flicks move them; wobble throws and costs nothing.
{
  const L = lvl({ pads: [[0, 0, 1], [1, 0, 1], [3, 0, 1], [0, 2, 1]], beetles: [1] });
  const s = R.initState(L);
  const h = R.hopTarget(L, s, 'R');
  ok(h && h.blocked && h.blocked.pad === 1, 'beetle pad blocks the hop');
  throws(() => R.apply(L, s, 'R'), 'hop into beetle is illegal');
  const f = R.flickInfo(L, s, 'R');
  ok(f && f.beetle === 1 && f.to === 2, 'flick finds the beetle and its destination');
  const s2 = R.apply(L, s, 'tR');
  ok(s2.beetles[0] === 2 && s2.turn === 1 && s2.fx === 0, 'flick moves the beetle and costs a turn');
  const s3 = R.apply(L, s2, 'R');
  ok(s3.fx === 1 && !(s3.flies & 2), 'freed pad can be landed on, its fly eaten');
  // Wobble: nothing beyond.
  const L2 = lvl({ pads: [[0, 0, 1], [1, 0, 1], [0, 1, 1]], beetles: [1] });
  const w = R.flickInfo(L2, R.initState(L2), 'R');
  ok(w && w.to === -1, 'no pad beyond: wobble');
  throws(() => R.apply(L2, R.initState(L2), 'tR'), 'apply throws on a wobble');
  ok(!R.legalMoves(L2, R.initState(L2)).includes('tR'), 'wobble is not a legal move');
  // Tongue passes over pads to reach a beetle.
  const L3 = lvl({ pads: [[0, 0, 1], [1, 0, 1], [2, 0, 1], [4, 0, 1]], beetles: [2] });
  const f3 = R.flickInfo(L3, R.initState(L3), 'R');
  ok(f3 && f3.beetle === 2 && f3.to === 3, 'tongue passes over free pads');
}
// Turtles: rhythm, hold count, landable only when up, dunk.
{
  const t = [2, 0, 2, 2, 0];
  ok(R.turtleUp(t, 0) && R.turtleUp(t, 1) && !R.turtleUp(t, 2) && R.turtleUp(t, 4), 'turtle rhythm formula');
  ok(R.turtleHold(t, 0) === 1 && R.turtleHold(t, 1) === 0, 'turtleHold counts moves it will hold you');
  const L = lvl({ pads: [[0, 0, 2], [3, 0, 1]], turtles: [t] });
  let s = R.initState(L);
  const h = R.hopTarget(L, s, 'R');
  ok(h && h.turtle === 0 && h.x === 2, 'surfaced turtle is landable');
  s = R.apply(L, s, 'R');
  ok(s.status === 'play' && s.pips[0] === 1, 'land on a turtle (up at T+1)');
  ok(R.isDunkMove(L, R.initState(L), 'R') === false, 'not a dunk move');
  const s1 = R.apply(L, s, 'L'); // back to start at turn 2: turtle down now
  ok(s1.status === 'play' && s1.fx === 0, 'leaving a turtle costs nothing');
  const t2 = R.hopTarget(L, s1, 'R');
  ok(t2 && t2.x === 3, 'dived turtle is hopped over');
  // Dunk: land when it dives next turn.
  const Ld = lvl({ pads: [[0, 0, 2], [4, 0, 1]], turtles: [[2, 0, 2, 2, 1]] });
  ok(R.isDunkMove(Ld, R.initState(Ld), 'R'), 'landing on a turtle that dives next turn is a dunk move');
  ok(R.apply(Ld, R.initState(Ld), 'R').status === 'dunked', 'dunked status');
  ok(!R.legalMoves(Ld, R.initState(Ld)).includes('R'), 'dunk moves are excluded by default');
}
// Fish: lowest index first, only on pads, full slot waits; Mend limits.
{
  const L = lvl({ pads: [[0, 0, 1], [1, 0, 2], [2, 0, 1], [3, 0, 2], [5, 5, 1]],
    fish: [[1, 1, 'mend'], [2, 1, 'leap']] });
  let s = R.initState(L);
  s = R.apply(L, s, 'R');
  ok(s.slot === 'mend' && s.fishUsed === 1 && s.gotFish === 0, 'fish gives its power-up on landing next to it');
  s = R.apply(L, s, 'R');
  ok(s.slot === 'mend' && !(s.fishUsed & 2), 'full slot: the fish waits');
  ok(R.canMend(L, s), 'mend usable on a 1-pip pad');
  s = R.apply(L, s, 'M');
  ok(s.pips[2] === 2 && s.slot === null && s.turn === 2, 'mend adds a pip, costs no turn');
  s = R.apply(L, s, 'L');
  s = R.apply(L, s, 'R');
  ok(s.slot === 'leap', 'the waiting fish gives its gift on a later landing');
  ok(R.canArmLeap(L, s), 'leap can be armed');
  s = R.apply(L, s, 'E');
  throws(() => R.apply(L, s, 'R'), 'no hop while leap is armed');
  const back = R.apply(L, s, 'X');
  ok(!back.leapArmed && back.slot === 'leap', 'cancel keeps the power-up');
  const targets = R.leapTargets(L, s, 'R');
  ok(targets.length === 1 && targets[0].x === 3, 'leap targets are landable cells up to 6 away');
  s = R.apply(L, s, 'JR1');
  ok(s.fx === 3 && s.slot === null && !s.leapArmed, 'leap lands and empties the slot');
}
// Stuck.
{
  const L = lvl({ pads: [[0, 0, 1], [1, 0, 1], [5, 5, 1]] });
  const s = R.apply(L, R.initState(L), 'R');
  ok(R.isStuck(L, s), 'no moves and flies left = stuck');
}
// Solver: turtle cycle returns.
{
  const L = lvl({ pads: [[0, 0, 1], [5, 5, 1]], turtles: [[1, 0, 3, 1, 0], [2, 0, 3, 1, 0]] });
  const r = solve(L);
  ok(r.solvable === false, 'solver terminates on a turtle cycle level');
}
// Symmetries keep solutions valid.
{
  const L = lvl({ pads: [[0, 0, 2], [1, 0, 1], [3, 0, 1], [3, 2, 1]], solution: 'R L R D' });
  for (let k = 0; k < 8; k++) {
    const T = R.transformLevel(L, k);
    ok(R.replay(T, R.parse(T.solution)).status === 'won', 'symmetry ' + k + ' replays to won');
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
