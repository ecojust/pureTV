import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlowMachine, STATES, TRANSITIONS, raceEndState } from '../../src/ui/flowMachine.js';

test('every transition target is a known state', () => {
  for (const [from, tos] of Object.entries(TRANSITIONS)) {
    assert.ok(STATES.includes(from));
    for (const to of tos) assert.ok(STATES.includes(to), `${from}->${to}`);
  }
  for (const s of STATES) assert.ok(TRANSITIONS[s], `missing row for ${s}`);
});

test('happy path: new game through race and back to garage', () => {
  const f = createFlowMachine();
  const seen = [];
  f.onChange((a, b) => seen.push(`${a}>${b}`));
  for (const s of ['carSelect', 'garage', 'shop', 'roster', 'garage', 'trackSelect', 'raceSettings', 'loading', 'race', 'paused', 'race', 'results', 'garage']) {
    assert.equal(f.transition(s, { n: s }), true, s);
    assert.equal(f.state, s);
  }
  assert.equal(seen.length, 13);
});

test('continue goes straight to garage; illegal transitions are refused', () => {
  const f = createFlowMachine();
  assert.equal(f.transition('race'), false);
  assert.equal(f.state, 'title');
  assert.equal(f.transition('garage'), true);
  assert.equal(f.transition('results'), false);
  assert.equal(f.canTransition('trackSelect'), true);
});

test('pause menu: restart goes through loading, quit goes to garage', () => {
  const f = createFlowMachine({ initial: 'paused' });
  assert.equal(f.canTransition('loading'), true);
  assert.equal(f.canTransition('garage'), true);
  assert.equal(f.canTransition('results'), false);
});

test('force bypasses the table but rejects unknown states; params carry through', () => {
  const f = createFlowMachine();
  f.force('results', { x: 1 });
  assert.deepEqual(f.params, { x: 1 });
  assert.throws(() => f.force('nope'));
  assert.throws(() => createFlowMachine({ initial: 'nope' }));
});

test('listener errors do not break transitions; unsubscribe works', () => {
  const f = createFlowMachine();
  const origErr = console.error; console.error = () => {};
  f.onChange(() => { throw new Error('boom'); });
  let n = 0;
  const off = f.onChange(() => n++);
  assert.equal(f.transition('garage'), true);
  off();
  f.transition('shop');
  console.error = origErr;
  assert.equal(n, 1);
});

test('a race that completes the last track pass goes to the win screen, then final stats, then the garage', () => {
  assert.equal(raceEndState(true), 'win');
  assert.equal(raceEndState(false), 'results');
  const f = createFlowMachine({ initial: 'race' });
  assert.equal(f.canTransition('win'), true);
  assert.equal(f.transition(raceEndState(true), { won: true }), true);
  assert.equal(f.state, 'win');
  assert.deepEqual(f.params, { won: true });
  assert.equal(f.canTransition('results'), false, 'the win does not show the normal results');
  assert.equal(f.canTransition('garage'), false, 'the win ends in the final stats first');
  assert.equal(f.transition('finalStats'), true);
  assert.equal(f.transition('garage'), true);
  assert.equal(f.state, 'garage');
});

test('final stats only leads to the garage; the win screen cannot be re-entered except from a race', () => {
  const f = createFlowMachine({ initial: 'finalStats' });
  assert.deepEqual(TRANSITIONS.finalStats, ['garage']);
  assert.equal(f.transition('win'), false);
  assert.equal(f.transition('race'), false);
  assert.equal(f.transition('garage'), true);
  assert.equal(createFlowMachine({ initial: 'win' }).canTransition('race'), false);
});
