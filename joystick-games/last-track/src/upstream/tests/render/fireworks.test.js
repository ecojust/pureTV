import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { burstSparks, shellSpark, stepSpark, sparkFade, createFireworks, burstInFrame, FIREWORK_COLORS, WHITE, GRAVITY } from '../../src/render/fireworks.js';

/** A seeded generator, so the burst maths is repeatable. */
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const fakeScene = () => { const kids = []; return { kids, add(o) { kids.push(o); }, remove(o) { kids.splice(kids.indexOf(o), 1); } }; };

test('a burst has the asked number of sparks, all at the centre, moving outward at 45-100% of the speed', () => {
  const c = { x: 5, y: 20, z: -3 };
  const sparks = burstSparks(c, { count: 60, speed: 16, rng: seeded(7) });
  assert.equal(sparks.length, 60);
  for (const p of sparks) {
    assert.deepEqual([p.x, p.y, p.z], [5, 20, -3]);
    const v = Math.hypot(p.vx, p.vy, p.vz);
    assert.ok(v >= 16 * 0.45 - 1e-9 && v <= 16 + 1e-9, `speed ${v}`);
    assert.ok(p.life >= 1.2 && p.life <= 2.1);
    assert.ok(p.color === WHITE || FIREWORK_COLORS.includes(p.color));
    assert.equal(p.shell, false);
  }
  const again = burstSparks(c, { count: 60, speed: 16, rng: seeded(7) });
  assert.deepEqual(again, sparks, 'the same seed gives the same burst');
});

test('a burst spreads over the sphere: sparks go up, down and sideways', () => {
  const sparks = burstSparks({ x: 0, y: 0, z: 0 }, { count: 200, speed: 10, rng: seeded(99) });
  assert.ok(sparks.some((p) => p.vy > 5) && sparks.some((p) => p.vy < -5));
  assert.ok(sparks.some((p) => p.vx > 5) && sparks.some((p) => p.vx < -5));
});

test('a spark falls under gravity and drag, and is spent after its life', () => {
  const p = { x: 0, y: 50, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life: 1.5, color: WHITE, shell: false };
  assert.equal(stepSpark(p, 0.1), true);
  assert.ok(p.vy < 0 && Math.abs(p.vy + GRAVITY * 0.1) < 1e-9, 'gravity pulls down');
  assert.ok(p.y < 50);
  let alive = true, steps = 0;
  while (alive && steps < 1000) { alive = stepSpark(p, 0.05); steps++; }
  assert.equal(alive, false);
  assert.ok(p.age >= 1.5 && p.age < 1.55, 'it dies at its life');
});

test('a shell climbs straight up from the ground under its burst point, with no gravity, and bursts at that height', () => {
  const s = shellSpark({ x: 10, y: 12, z: -4 }, { speed: 20 });
  assert.equal(s.y, 0); assert.equal(s.shell, true);
  assert.ok(Math.abs(s.life - 12 / 20) < 1e-9, 'the fuse is the time to reach the burst height');
  const v = s.vy;
  stepSpark(s, 0.25);
  assert.ok(Math.abs(s.y - v * 0.25) < 1e-9, 'climbs at its speed');
  assert.equal(s.vy, v, 'no gravity on a shell');
  assert.equal(s.x, 10); assert.equal(s.z, -4);
  assert.equal(stepSpark(s, s.life), false, 'the fuse runs out');
  const end = shellSpark({ x: 0, y: 12, z: 0 }, { speed: 20 });
  stepSpark(end, end.life);
  assert.ok(Math.abs(end.y - 12) < 1e-9, 'the shell is at its burst point when it ends');
});

test('a spark that reaches the ground is spent, even before its life is over', () => {
  const p = { x: 0, y: 1, z: 0, vx: 0, vy: -10, vz: 0, age: 0, life: 2, color: WHITE, shell: false };
  assert.equal(stepSpark(p, 0.2), false);
});

test('sparks fade from full brightness to nothing over their life', () => {
  const p = { age: 0, life: 2 };
  assert.equal(sparkFade(p), 1);
  p.age = 1; assert.equal(sparkFade(p), 0.5);
  p.age = 3; assert.equal(sparkFade(p), 0);
});

test('createFireworks: a launched shell bursts when it ends, and the sparks die out', () => {
  const scene = fakeScene();
  const fw = createFireworks(scene, { rng: seeded(11) });
  assert.equal(scene.kids.length, 1, 'the layer is added to the scene');
  fw.launch({ x: 0, y: 10, z: 0 });
  assert.equal(fw.count, 1);
  fw.update(0.1);
  assert.equal(fw.count, 1, 'a shell is one spark while it climbs');
  for (let t = 0; t < 1.4; t += 0.1) fw.update(0.1);
  assert.ok(fw.count > 40, `the shell burst into sparks (${fw.count})`);
  for (let t = 0; t < 4; t += 0.1) fw.update(0.1);
  assert.equal(fw.count, 0, 'every spark is spent');
  fw.dispose();
  assert.equal(scene.kids.length, 0, 'dispose removes the layer');
});

test('createFireworks never holds more than its capacity', () => {
  const fw = createFireworks(fakeScene(), { rng: seeded(5), capacity: 30 });
  for (let i = 0; i < 10; i++) fw.launch({ x: i, y: 10, z: 0 });
  assert.ok(fw.count <= 10);
  for (let t = 0; t < 1.5; t += 0.1) fw.update(0.1);
  assert.ok(fw.count <= 30, `capped at 30 (${fw.count})`);
});

test('burstInFrame: a burst is 35-70 m out, in the upper-middle of the camera frame, and in the air', () => {
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.5, 500);
  cam.position.set(0, 4, 0); cam.lookAt(0, 4, -100);
  for (let i = 1; i <= 200; i++) {
    const p = burstInFrame(cam, seeded(i));
    assert.ok(p, 'a level camera always has air to burst in');
    const d = p.distanceTo(cam.position);
    assert.ok(d >= 35 - 1e-6 && d <= 70 + 1e-6, `distance ${d}`);
    assert.ok(p.y >= 3, `height ${p.y}`);
    const ndc = p.clone().project(cam);
    assert.ok(Math.abs(ndc.x) <= 0.6 + 1e-6 && ndc.y >= 0.15 - 1e-6 && ndc.y <= 0.7 + 1e-6, `in frame at ${ndc.x}, ${ndc.y}`);
  }
});

test('burstInFrame: a camera looking down at the road has no air to burst in', () => {
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.5, 500);
  cam.position.set(0, 4, 0); cam.lookAt(0, 0, -1);
  assert.equal(burstInFrame(cam, seeded(3)), null);
});
