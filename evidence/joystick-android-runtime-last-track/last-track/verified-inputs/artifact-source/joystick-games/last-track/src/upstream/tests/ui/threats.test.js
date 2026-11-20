import test from 'node:test';
import assert from 'node:assert/strict';
import { threatsFor, AIM_RANGE, LOCK_RANGE } from '../../src/ui/threats.js';

const car = (over = {}) => ({ id: 0, isPlayer: true, x: 0, y: 0, heading: 0, wrecked: false, ...over });
/** A projectile at (x,y) flying along `heading`; ownerId 1 is a rival. */
const shot = (over = {}) => ({ id: 7, type: 'guided', ownerId: 1, targetId: null, x: 0, y: 0, heading: 0, ...over });
const snap = (projectiles, cars = [car()]) => ({ cars, projectiles });

test('a rocket aimed at the player from ahead is a threat, dead ahead', () => {
  const [t] = threatsFor(snap([shot({ type: 'rocket', x: 80, y: 0, heading: Math.PI })]));
  assert.equal(t.label, 'ROCKET');
  assert.ok(Math.abs(t.bearing) < 1e-9, 'straight ahead');
  assert.equal(t.lock, false);
});

test('the bearing says which side the threat comes from: right is positive, left negative', () => {
  const right = threatsFor(snap([shot({ x: 0, y: 50, heading: -Math.PI / 2 })]))[0];
  const left = threatsFor(snap([shot({ x: 0, y: -50, heading: Math.PI / 2 })]))[0];
  assert.ok(Math.abs(right.bearing - Math.PI / 2) < 1e-9, `right ${right.bearing}`);
  assert.ok(Math.abs(left.bearing + Math.PI / 2) < 1e-9, `left ${left.bearing}`);
});

test('a drone runs ahead: a terminator aimed back at the player from in front is named as one', () => {
  const [t] = threatsFor(snap([shot({ type: 'terminator', x: 60, y: 0, heading: Math.PI })]));
  assert.equal(t.label, 'TERMINATOR DRONE');
});

test('no warning for the player\'s own shots, shots pointed elsewhere, or distant aimed shots', () => {
  assert.deepEqual(threatsFor(snap([shot({ ownerId: 0, type: 'rocket', x: 60, y: 0, heading: Math.PI })])), [], 'own shot');
  assert.deepEqual(threatsFor(snap([shot({ type: 'rocket', x: 60, y: 0, heading: 0 })])), [], 'flying away');
  assert.deepEqual(threatsFor(snap([shot({ type: 'rocket', x: AIM_RANGE + 40, y: 0, heading: Math.PI })])), [], 'out of aim range');
});

test('a missile already locked on the player warns even when it is not pointed at the car, and comes first', () => {
  const locked = shot({ id: 9, x: 150, y: 30, heading: 0, targetId: 0, type: 'guided' });
  const near = shot({ id: 8, type: 'rocket', x: 40, y: 0, heading: Math.PI });
  const [first, second] = threatsFor(snap([near, locked]));
  assert.equal(first.id, 9, 'locked first');
  assert.equal(first.lock, true);
  assert.equal(second.id, 8);
  assert.ok(first.dist < LOCK_RANGE);
});

test('no threats once the player is wrecked, or with no player in the snapshot', () => {
  const s = (over) => snap([shot({ type: 'rocket', x: 60, y: 0, heading: Math.PI })], [car(over)]);
  assert.deepEqual(threatsFor(s({ wrecked: true })), []);
  assert.deepEqual(threatsFor({ cars: [car({ isPlayer: false })], projectiles: [shot({ type: 'rocket', x: 60, y: 0, heading: Math.PI })] }), []);
  assert.deepEqual(threatsFor(null), []);
});
