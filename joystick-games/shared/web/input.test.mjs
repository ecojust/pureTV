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

const phone = (values = {}) => ({
  id: 1, connected: true, x: 0, y: 0, a: false, b: false, start: false, select: false,
  buttonX: false, buttonY: false, cancelSeq: 1, ...values,
});

test('the phone room maps its axes and independent action buttons to the same nine keys', () => {
  const reducer = createInputReducer();
  for (const [key, values] of Object.entries({ UP: {y: -1}, DOWN: {y: 1}, LEFT: {x: -1},
    RIGHT: {x: 1}, START: {start: true}, A: {a: true}, B: {b: true}, X: {buttonX: true}, Y: {buttonY: true} })) {
    reducer.read(sample(phone()));
    const frame = reducer.read(sample(phone(values)));
    assert.equal(frame.transport, 'phone');
    assert.equal(frame.connected, true);
    assert.deepEqual(BUTTONS.filter(k => frame.pressed[k]), [key]);
  }
  reducer.read(sample(phone()));
  const chord = reducer.read(sample(phone({x: -.7, y: .7, buttonX: true, buttonY: true})));
  assert.deepEqual(BUTTONS.filter(key => chord.buttons[key]), ['DOWN', 'LEFT', 'X', 'Y']);
});

test('switching from a phone to an ESP32 cancels held inputs without synthesizing a release', () => {
  const reducer = createInputReducer();
  reducer.read(sample(phone({a: true})));
  const switched = reducer.read(sample(phone({a: true}), player({B: true})));
  assert.equal(switched.cancelled, true);
  assert.equal(switched.transport, 'wifi');
  assert.ok(BUTTONS.every(key => !switched.buttons[key] && !switched.released[key]));
  assert.equal(reducer.read(sample(player({B: true}))).pressed.B, false);
  reducer.read(sample(player()));
  assert.equal(reducer.read(sample(player({B: true}))).pressed.B, true);
});

test('older phone screens can still use Select, and phone cancellation suppresses edges', () => {
  const reducer = createInputReducer();
  assert.equal(reducer.read(sample(phone({select: true}))).pressed.Y, true);
  const cancelled = reducer.read(sample(phone({cancelSeq: 2, a: true})));
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.released.Y, false);
  assert.equal(cancelled.pressed.A, false);
  assert.equal(reducer.read(sample(phone({cancelSeq: 2, a: true}))).buttons.A, false);
});
