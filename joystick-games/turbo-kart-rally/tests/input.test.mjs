import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InputController } from '../src/upstream/input.js';
import { Kart } from '../src/upstream/kart.js';
import { bus } from '../src/upstream/events.js';

test('independent held controls and a single item press across physics substeps', () => {
  const input = new InputController({ target: null });
  input.tvFrame = { pollCount: 1, buttons: { UP: true, RIGHT: true, A: true, X: true }, pressed: { B: true } };
  assert.equal(input.peekThrottle(), 1);
  const first = input.getInput();
  assert.equal(first.throttle, 1);
  assert.equal(first.drift, true);
  assert.equal(first.lookBack, true);
  assert.equal(first.item, true);
  assert.equal(input.getInput().item, false);
  input.tvFrame = { pollCount: 2, buttons: { DOWN: true }, pressed: { B: true } };
  const next = input.getInput();
  assert.equal(next.brake, 1);
  assert.equal(next.item, true);
  assert.equal(next.throttle, 0);
  input.reset();
  assert.deepEqual(input.getInput(), { throttle: 0, brake: 0, steer: 0, drift: false, item: false, lookBack: false });
  input.dispose();
});

test('cancelling an earned drift keeps progress and never fires the mini-turbo', () => {
  const kart = Object.assign(Object.create(Kart.prototype), {
    drifting: true, driftLevel: 2, driftCharge: 3.2, driftTime: 1.4, _prevDrift: true,
    _driftPending: 0.2, boostTimer: 0.8, speed: 24, trackT: 0.23, input: { drift: true, item: true }
  });
  let end;
  const off = bus.on('kart:driftEnd', event => { end = event; });
  kart.cancelDrivingInput();
  off();
  assert.equal(end.fired, false);
  assert.equal(kart.boostTimer, 0.8);
  assert.equal(kart.speed, 24);
  assert.equal(kart.trackT, 0.23);
  assert.equal(kart.driftLevel, 0);
  assert.equal(kart.input.drift, false);
  assert.equal(kart.input.item, false);
});
