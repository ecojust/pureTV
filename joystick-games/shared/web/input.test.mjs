import test from 'node:test';
import assert from 'node:assert/strict';
import { createInputReducer, BUTTONS } from './input.js';

const player = (buttons = {}, extra = {}) => ({ id: 1, transport: 'wifi', connected: true, controllerId: 'esp32-001122334455', session: 's1', cancelSeq: 0, buttons, ...extra });
const sample = (...players) => ({ players });

test('all nine keys remain independent and short pulses have one edge', () => {
  const reducer = createInputReducer();
  reducer.read(sample(player()));
  for (const key of BUTTONS) {
    const down = reducer.read(sample(player({ [key]: true })));
    assert.deepEqual(Object.keys(down.buttons).filter(k => down.buttons[k]), [key]);
    assert.equal(down.pressed[key], true);
    assert.equal(reducer.read(sample(player({ [key]: true }))).pressed[key], false);
    assert.equal(reducer.read(sample(player())).released[key], true);
  }
});

test('disconnect cancels held controls without creating rewarded release', () => {
  const reducer = createInputReducer();
  reducer.read(sample(player({ A: true, LEFT: true })));
  const frame = reducer.read(sample());
  assert.equal(frame.cancelled, true);
  assert.ok(BUTTONS.every(key => !frame.buttons[key] && !frame.released[key]));
  assert.equal(reducer.read(sample()).cancelled, false);
});

test('reconnected held input waits for release and fresh press', () => {
  const reducer = createInputReducer();
  reducer.read(sample(player({ A: true })));
  reducer.read(sample());
  assert.equal(reducer.read(sample(player({ A: true }, { session: 's2' }))).buttons.A, false);
  assert.equal(reducer.read(sample(player({ A: true }, { session: 's2' }))).buttons.A, false);
  reducer.read(sample(player({}, { session: 's2' })));
  assert.equal(reducer.read(sample(player({ A: true }, { session: 's2' }))).pressed.A, true);
});

test('native cancellation epoch and explicit suspend quarantine stale input', () => {
  const reducer = createInputReducer();
  reducer.read(sample(player({ START: true })));
  const cancelled = reducer.read(sample(player({ START: true }, { cancelSeq: 1 })));
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.buttons.START, false);
  reducer.read(sample(player({}, { cancelSeq: 1 })));
  reducer.cancel();
  const reset = reducer.read(sample(player({ X: true }, { cancelSeq: 1 })));
  assert.equal(reset.cancelled, true);
  assert.equal(reset.pressed.X, false);
});

test('single-player selection is stable and does not combine different devices', () => {
  const reducer = createInputReducer();
  const second = player({ B: true }, { id: 2, controllerId: 'other', session: 's2' });
  const frame = reducer.read(sample(second, player({ X: true })));
  assert.equal(frame.buttons.X, true); assert.equal(frame.buttons.B, false);
  assert.equal(frame.players.length, 2);
  const replacement = reducer.read(sample(second));
  assert.equal(replacement.cancelled, true); assert.equal(replacement.buttons.B, false);
});

test('native TV remote works without an online Wi-Fi player', () => {
  const frame = createInputReducer().read(sample(), { UP: true, A: true });
  assert.equal(frame.connected, false);
  assert.equal(frame.pressed.UP, true); assert.equal(frame.pressed.A, true);
});

test('diagnostic copies cannot change the next frame', () => {
  const reducer = createInputReducer(), original = sample(player({ A: true }));
  const frame = reducer.read(original);
  frame.players[0].buttons.A = false;
  assert.equal(original.players[0].buttons.A, true);
  assert.equal(reducer.read(original).pressed.A, false);
});

test('disabled native input and malformed empty snapshots are neutral', () => {
  const reducer = createInputReducer();
  assert.equal(reducer.read({ ...sample(player({ A: true })), inputActive: false }).buttons.A, false);
  assert.equal(reducer.read(null).connected, false);
});
