/* Independent shortest-path reference: no production transition helpers imported. */
'use strict';
const assert = require('node:assert/strict');
const model = require('../src/main/assets/game-model.js');

const CASES = [
  { count: 6, capacity: 2, delivery: [4, 1, 5, 2, 6, 3], limit: 24, minimum: 12 },
  { count: 7, capacity: 3, delivery: [5, 2, 7, 1, 4, 6, 3], limit: 28, minimum: 17 },
  { count: 8, capacity: 3, delivery: [8, 1, 7, 2, 6, 3, 5, 4], limit: 32, minimum: 24 }
];
function canonical(bays) {
  return bays.map(b => b.slice()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function identity(s) { return JSON.stringify([s.inbound, s.done, s.held, s.bays]); }
function shortest(spec) {
  const start = { inbound: 0, done: 0, held: null, bays: [[], [], []], parent: null, actions: [], cost: 0 };
  const queue = [start], seen = new Set([identity(start)]);
  let head = 0;
  while (head < queue.length) {
    const s = queue[head++];
    if (s.done === spec.count) {
      const segments = [];
      for (let cursor = s; cursor.parent; cursor = cursor.parent) segments.push(cursor.actions);
      return { cost: s.cost, states: seen.size, actions: segments.reverse().flat() };
    }
    const next = [];
    if (s.held === null) {
      if (s.inbound < spec.count) next.push({ ...s, inbound: s.inbound + 1, held: s.inbound + 1,
        actions: [{ command: 'inbound' }] });
      for (let b = 0; b < 3; b++) {
        if (!s.bays[b].length) continue;
        const bays = s.bays.map(x => x.slice()), original = bays[b].slice(), held = bays[b].pop();
        next.push({ ...s, bays: canonical(bays), held, actions: [{ command: 'bay', stack: original }] });
      }
    } else {
      for (let b = 0; b < 3; b++) {
        if (s.bays[b].length >= spec.capacity) continue;
        const bays = s.bays.map(x => x.slice()), original = bays[b].slice();
        bays[b].push(s.held);
        next.push({ ...s, bays: canonical(bays), held: null, actions: [{ command: 'bay', stack: original }] });
      }
    }
    for (const candidate of next) {
      // Immediately dispatching the required held crate cannot consume capacity
      // or crane moves. It therefore cannot make a shortest route worse.
      if (candidate.held === spec.delivery[candidate.done]) {
        candidate.held = null;
        candidate.done++;
        candidate.actions.push({ command: 'dispatch' });
      }
      const key = identity(candidate);
      if (seen.has(key)) continue;
      seen.add(key); candidate.parent = s; candidate.cost = s.cost + 1; queue.push(candidate);
    }
  }
  throw new Error('Independent search found no solution');
}
function conservation(s, spec) {
  const actual = [...Array.from({ length: spec.count - s.inboundIndex }, (_, i) => i + s.inboundIndex + 1),
    ...s.bays.flat(), ...(s.held === null ? [] : [s.held]), ...s.dispatchReceipts.map(r => r.crate)].sort((a, b) => a - b);
  assert.deepEqual(actual, Array.from({ length: spec.count }, (_, i) => i + 1));
  assert.ok(s.bays.every(b => b.length <= spec.capacity));
  assert.deepEqual(s.dispatchReceipts.map(r => r.crate), spec.delivery.slice(0, s.nextDelivery));
}
function neutral(s) { model.step(s, 1 / 60, {}); }
function command(s, input, spec) {
  neutral(s); model.step(s, 1 / 60, input); conservation(s, spec);
}
function select(s, position, spec) {
  for (let i = 0; s.selected !== position && i < 4; i++) command(s, { x: 1 }, spec);
  assert.equal(s.selected, position);
}
const results = [];
for (const [level, spec] of CASES.entries()) {
  const plan = shortest(spec), s = model.create(748, level);
  assert.equal(plan.cost, spec.minimum);
  assert.equal(s.capacity, spec.capacity); assert.equal(s.moveLimit, spec.limit);
  assert.deepEqual(s.delivery, spec.delivery);
  let snapshots = 0;
  for (const action of plan.actions) {
    if (action.command === 'dispatch') command(s, { b: true }, spec);
    else {
      const position = action.command === 'inbound' ? 0 : s.bays.findIndex(b => JSON.stringify(b) === JSON.stringify(action.stack)) + 1;
      assert.ok(action.command === 'inbound' || position > 0, 'Reference stack must exist');
      select(s, position, spec);
      command(s, { a: true }, spec);
    }
    snapshots++;
    assert.notEqual(s.phase, 'lost');
  }
  assert.equal(s.phase, 'won'); assert.equal(s.score, 100);
  assert.equal(s.movesUsed, plan.cost); assert.equal(s.mistakes, 0);
  assert.equal(s.held, null); assert.ok(s.bays.every(b => b.length === 0));
  assert.equal(s.inboundIndex, spec.count);
  const frozen = JSON.stringify(s);
  model.step(s, 1 / 60, new Proxy({}, { getOwnPropertyDescriptor() { throw Error('Terminal input read'); } }));
  assert.equal(JSON.stringify(s), frozen);
  results.push({ level, minimumMoves: plan.cost, allowance: spec.limit, independentlySearchedStates: plan.states,
    ordinaryCommands: snapshots, phase: s.phase, cargoConservation: true, terminalFrozen: true });
}
console.log(JSON.stringify({ passed: true, method: 'Independent unweighted graph search over pick/place transitions; zero-cost correct dispatch normalized immediately; ordinary input replay with cargo conservation.', layouts: results }, null, 2));
