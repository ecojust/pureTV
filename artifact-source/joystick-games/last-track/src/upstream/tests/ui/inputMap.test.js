import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keysToInput, mergeInputs, neutralInput, actionForKey, isGameKey, weaponSlotForKey, isCycleKey } from '../../src/ui/inputMap.js';
import { holdsToInput } from '../../src/ui/touchControls.js';

test('keys map to PlayerInput', () => {
  const i = keysToInput(new Set(['KeyW', 'ArrowRight', 'Space', 'ShiftLeft']));
  assert.deepEqual(i, { throttle: 1, brake: 0, steer: 1, fire: true, cycleWeapon: false, selectWeapon: null, handbrake: true });
  assert.deepEqual(keysToInput(new Set()), neutralInput());
});

test('opposite steer keys cancel; brake maps to S/Down', () => {
  assert.equal(keysToInput(new Set(['KeyA', 'KeyD'])).steer, 0);
  assert.equal(keysToInput(new Set(['KeyA'])).steer, -1);
  assert.equal(keysToInput(new Set(['ArrowDown'])).brake, 1);
});

test('actions and special keys', () => {
  assert.equal(actionForKey('Escape'), 'pause');
  assert.equal(actionForKey('KeyP'), 'pause');
  assert.equal(actionForKey('KeyC'), 'camera');
  assert.equal(actionForKey('KeyM'), 'mute');
  assert.equal(actionForKey('KeyW'), null);
  assert.ok(isGameKey('Space') && !isGameKey('KeyZ'));
  assert.ok(isCycleKey('KeyE') && isCycleKey('Tab'));
  assert.equal(weaponSlotForKey('Digit1'), 0);
  assert.equal(weaponSlotForKey('Digit4'), 3);
  assert.equal(weaponSlotForKey('Digit5'), null);
});

test('mergeInputs: strongest analog, booleans OR, selectWeapon preference', () => {
  const a = { ...neutralInput(), steer: -0.4, throttle: 1, fire: true };
  const b = { ...neutralInput(), steer: 0.9, brake: 0.5, selectWeapon: 2, handbrake: true };
  const m = mergeInputs(a, b);
  assert.equal(m.steer, 0.9); assert.equal(m.throttle, 1); assert.equal(m.brake, 0.5);
  assert.ok(m.fire && m.handbrake); assert.equal(m.selectWeapon, 2);
  assert.equal(mergeInputs(a, null), a);
});

test('touch holds map to PlayerInput', () => {
  assert.deepEqual(holdsToInput({ gas: true, fire: true, left: true }),
    { throttle: 1, brake: 0, steer: -1, fire: true, cycleWeapon: false, selectWeapon: null, handbrake: false });
  assert.equal(holdsToInput({ left: true, right: true }).steer, 0);
});
