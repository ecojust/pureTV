import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateProjectiles } from '../../src/render/interp.js';

const m = (id, x, y, heading = 0) => ({ id, type: 'rocket', x, y, heading, ownerId: 1, targetId: null });

test('a missile is drawn between its two snapshots by the same factor as the cars', () => {
  const [p] = interpolateProjectiles([m(7, 0, 0)], [m(7, 10, 4)], 0.5);
  assert.equal(p.x, 5); assert.equal(p.y, 2);
});

test('alpha at the newest snapshot draws the missile where the sim has it; before it, the blend clamps to the older one', () => {
  assert.deepEqual(interpolateProjectiles([m(7, 0, 0)], [m(7, 10, 4)], 1)[0].x, 10);
  assert.equal(interpolateProjectiles([m(7, 0, 0)], [m(7, 10, 4)], -2)[0].x, 0);
});

test('the heading blends the short way round', () => {
  const [p] = interpolateProjectiles([m(7, 0, 0, Math.PI - 0.1)], [m(7, 0, 0, -Math.PI + 0.1)], 0.5);
  assert.ok(Math.abs(Math.abs(p.heading) - Math.PI) < 1e-9, `heading ${p.heading}`);
});

test('a new missile, or no earlier snapshot, is drawn where it is; no projectiles stays empty', () => {
  assert.deepEqual(interpolateProjectiles([m(1, 0, 0)], [m(9, 3, 3)], 0.5)[0].x, 3, 'new id');
  assert.deepEqual(interpolateProjectiles(undefined, [m(9, 3, 3)], 0.5)[0].x, 3, 'no earlier snapshot');
  assert.deepEqual(interpolateProjectiles([], undefined, 0.5), []);
});
