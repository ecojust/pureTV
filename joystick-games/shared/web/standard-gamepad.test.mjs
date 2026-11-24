import assert from 'node:assert/strict';
import test from 'node:test';
import { readStandardPad, mergeGamepadFrames } from './standard-gamepad.js';
const host = { connected: false, transport: null, buttons: {}, cancelled: false };
const pad = (x, y, ...pressed) => ({ mapping: 'standard', connected: true, index: 0, id: 'test pad',
  axes: [x, y], buttons: Array.from({length: 17}, (_, index) => ({pressed: pressed.includes(index)})) });
test('standard left stick, D-pad, four face buttons and Start map independently', () => {
  const mapped = readStandardPad([null, pad(-0.8, 0.8, 0, 1, 2, 3, 9, 12, 15)]);
  assert.ok(Object.values(mapped.buttons).every(Boolean));
  assert.equal(readStandardPad([{...pad(0,0), mapping:''}]), null);
});
test('mixed keyboard and gamepad holds emit one press and one release', () => {
  const merge = mergeGamepadFrames();
  const held = readStandardPad([pad(0,0,0)]);
  assert.equal(merge(host, held).pressed.A, true);
  assert.equal(merge({...host, buttons:{A:true}}, held).pressed.A, false);
  assert.equal(merge({...host, buttons:{A:true}}, readStandardPad([pad(0,0)])).released.A, false);
  assert.equal(merge(host, readStandardPad([pad(0,0)])).released.A, true);
});
test('native takeover cancels held actions and waits for a fresh press', () => {
  let cancels = 0;
  const merge = mergeGamepadFrames(() => { cancels++; });
  const held = readStandardPad([pad(0,0,9)]);
  merge(host, held);
  const wifi = {...host, connected:true, transport:'wifi', buttons:{START:true}};
  const changed = merge(wifi, held);
  assert.equal(changed.transport, 'wifi');
  assert.equal(changed.cancelled, true);
  assert.equal(changed.pressed.START, false);
  assert.equal(cancels, 1);
  assert.equal(merge(wifi, held).buttons.START, false);
  merge({...wifi, buttons:{}}, held);
  assert.equal(merge(wifi, held).pressed.START, true);
});
test('reconnecting while Start is held requires releasing it first', () => {
  const merge = mergeGamepadFrames();
  const held = readStandardPad([pad(0,0,9)]);
  merge(host, held);
  assert.ok(merge(host, null).cancelled);
  assert.equal(merge(host, held).buttons.START, false);
  assert.equal(merge(host, held).pressed.START, false);
  merge(host, readStandardPad([pad(0,0)]));
  assert.ok(merge(host, held).pressed.START);
});
