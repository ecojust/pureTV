import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/upstream/src/core/Input.js';
import { createInputReducer, BUTTONS } from '../../shared/web/input.js';

function setup() {
  const listeners = {};
  globalThis.window = { addEventListener: (name, fn) => (listeners[name] ||= []).push(fn) };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [] } });
  const input = new Input();
  return { input, fire: (name, code) => listeners[name]?.forEach(fn => fn({ code, preventDefault() {} })) };
}
function frame(keys = []) {
  const buttons = Object.fromEntries(BUTTONS.map(k => [k, keys.includes(k)]));
  return { buttons, pressed: {...buttons} };
}

test('all nine physical keys remain independent; action combinations retain movement', () => {
  const {input} = setup();
  const expected = {
    UP: {accel: 1}, DOWN: {brake: 1}, LEFT: {steer: -1}, RIGHT: {steer: 1},
    A: {jump: true, jumpPressed: true}, B: {itemPressed: true}, X: {lookBack: true}, START: {}, Y: {},
  };
  const neutral = {steer: 0, accel: 0, brake: 0, jump: false, jumpPressed: false, itemPressed: false, lookBack: false};
  for (const key of BUTTONS) {
    input.endFrame(); input.applyPureTV(frame(), true);
    input.applyPureTV(frame([key]), true);
    assert.deepEqual(input.controls(), {...neutral, ...expected[key]}, key);
  }
  input.endFrame(); input.applyPureTV(frame(['UP','LEFT','A','B','X']), true);
  assert.deepEqual(input.controls(), {steer: -1, accel: 1, brake: 0, jump: true, jumpPressed: true, itemPressed: true, lookBack: true});
});

test('menu confirmation does not become race jump until a fresh press', () => {
  const {input} = setup();
  input.applyPureTV(frame(['A']), false);
  input.applyPureTV(frame(['A']), true);
  assert.equal(input.controls().jump, false);
  input.applyPureTV(frame(), true);
  input.applyPureTV(frame(['A']), true);
  assert.equal(input.controls().jumpPressed, true);
});

test('disconnect/reconnect cancellation has no release edge or stale item/jump', () => {
  const {input} = setup(); const reducer = createInputReducer();
  const sample = (session, keys) => ({players:[{id:1,controllerId:'test',session,transport:'wifi',connected:true,buttons:frame(keys).buttons}]});
  input.applyPureTV(reducer.read(sample('a',['UP','A','B'])),true);
  assert.equal(input.controls().itemPressed, true);
  const disconnected = reducer.read({players:[]});
  assert.equal(disconnected.cancelled,true);
  assert.equal(disconnected.released.A,false);
  input.cancel();
  input.applyPureTV(reducer.read(sample('b',['UP','A','B'])),true);
  assert.equal(input.controls().accel,0); assert.equal(input.controls().itemPressed,false);
  input.applyPureTV(reducer.read(sample('b',[])),true);
  input.applyPureTV(reducer.read(sample('b',['UP','A','B'])),true);
  assert.equal(input.controls().accel,1); assert.equal(input.controls().itemPressed,true);
});

test('keyboard cancellation blocks repeated held keys until keyup', () => {
  const {input,fire} = setup(); fire('keydown','Space'); fire('keydown','KeyE');
  input.cancel(); fire('keydown','Space'); fire('keydown','KeyE');
  assert.equal(input.controls().jump,false); assert.equal(input.controls().itemPressed,false);
  fire('keyup','Space'); fire('keydown','Space'); assert.equal(input.controls().jumpPressed,true);
});

test('resume input reset preserves the shared START edge until physical release', () => {
  const {input} = setup(); const reducer = createInputReducer();
  const sample = keys => ({players:[{id:1,controllerId:'resume-test',session:'same',connected:true,transport:'wifi',buttons:frame(keys).buttons}]});
  assert.equal(reducer.read(sample(['START'])).pressed.START, true);
  reducer.cancel(); input.cancel(); // Pause cancels held inputs.
  assert.equal(reducer.read(sample(['START'])).pressed.START, false);
  reducer.read(sample([]));
  const resume = reducer.read(sample(['START']));
  assert.equal(resume.pressed.START, true);
  input.cancel(); // The original input reset on explicit resume is independent of the reducer.
  for (let i = 0; i < 12; i++) {
    const held = reducer.read(sample(['START'])); input.applyPureTV(held, true);
    assert.equal(held.pressed.START, false, `held resume frame ${i}`);
    assert.equal(input.controls().jumpPressed, false);
  }
  reducer.read(sample([]));
  assert.equal(reducer.read(sample(['START'])).pressed.START, true);
});

test('standard Gamepad disconnect cancels rather than synthesizing drift release', () => {
  const {input} = setup();
  let cancelled = 0, connected = true;
  input.onCancel = () => cancelled++;
  const buttons = Array.from({length:16},(_,i) => ({pressed:i===5,value:i===5?1:0}));
  navigator.getGamepads = () => connected ? [{index:0,axes:[0,0],buttons}] : [];
  input.pollGamepad(); assert.equal(input.controls().jump,true);
  connected = false; input.pollGamepad();
  assert.equal(cancelled,1); assert.equal(input.controls().jump,false);
  connected = true; input.pollGamepad(); assert.equal(input.controls().jump,false);
  buttons[5]={pressed:false,value:0}; input.pollGamepad();
  buttons[5]={pressed:true,value:1}; input.pollGamepad(); assert.equal(input.controls().jump,true);
});
