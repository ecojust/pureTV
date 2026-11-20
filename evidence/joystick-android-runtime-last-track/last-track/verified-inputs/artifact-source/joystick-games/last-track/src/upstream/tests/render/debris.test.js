import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { DebrisField, SHAPE, SHAPE_CAP, DEBRIS_MAX, DEBRIS, planPart, chunkCount, createDebris, PART_SPEC } from '../../src/render/debris.js';
import { PART_IDS } from '../../src/sim/parts.js';
import { mulberry32 } from '../../src/core/mathUtil.js';
import { eventImpact, TimeScaler } from '../../src/render/impactFx.js';

const spawnOne = (f, vy = 8) => f.spawn(SHAPE.PANEL, 0, 0, 1, 0, 6, vy, 2, 1.5, 0.07, 1.2, 6, 0);

test('debris physics: gravity pulls, ground bounces lose energy, pieces come to rest on the ground and expire', () => {
  const f = new DebrisField(); f.reseed(3);
  const i = spawnOne(f);
  const o = i * 3;
  let bounces = 0, peak = 0, maxPeakAfter = 0;
  const hits = [];
  for (let t = 0; t < 12 && !f.rest[i]; t += 1 / 120) {
    f.step(1 / 120, (x, y, z, imp) => { bounces++; hits.push(imp); }, null);
    peak = Math.max(peak, f.p[o + 1]);
    assert.ok(f.p[o + 1] >= f.hr[i] - 1e-6, 'never below the ground');
    assert.ok(Number.isFinite(f.p[o]) && Number.isFinite(f.r[o]));
  }
  assert.ok(peak > 2, `it flew: ${peak}`);
  assert.ok(bounces >= 1, 'bounced');
  for (let k = 1; k < hits.length; k++) assert.ok(hits[k] < hits[k - 1] + 1e-6, 'each bounce is weaker than the last');
  assert.equal(f.rest[i], 1, 'came to rest');
  assert.ok(Math.abs(f.p[o + 1] - f.hr[i]) < 1e-6);
  const q = Math.PI / 2;
  assert.ok(Math.abs(f.r[o] / q - Math.round(f.r[o] / q)) < 1e-6, 'lies flat (quarter-turn roll)');
  const n0 = f.count;
  for (let t = 0; t < DEBRIS.restLife + 1; t += 0.5) f.step(0.5, null, null);
  assert.equal(f.alive[i], 0);
  assert.equal(f.count, n0 - 1);
});

test('debris pools: bounded, oldest slot is reused, burning pieces emit trail callbacks', () => {
  const f = new DebrisField(); f.reseed(1);
  for (let k = 0; k < SHAPE_CAP[SHAPE.CHUNK] * 2; k++) f.spawn(SHAPE.CHUNK, 1, 0, 1, 0, 1, 1, 1, 0.2, 0.2, 0.2, 5, 0);
  assert.ok(f.count <= DEBRIS_MAX);
  let alive = 0; for (let k = 0; k < f.n; k++) alive += f.alive[k]; assert.equal(alive, f.count);
  assert.ok(f.count <= SHAPE_CAP[SHAPE.CHUNK]);
  const g = new DebrisField(); g.reseed(1);
  g.spawn(SHAPE.WHEEL, 3, 0, 1, 0, 3, 5, 0, 1, 1, 1, 10, 4);
  let trails = 0; for (let k = 0; k < 120; k++) g.step(1 / 60, null, () => trails++);
  assert.ok(trails > 20, `trail callbacks: ${trails}`);
});

test('debris is deterministic for a seed and allocation-free in step()', () => {
  const run = (seed) => { const f = new DebrisField(); f.reseed(seed); for (let k = 0; k < 20; k++) f.spawn(SHAPE.CHUNK, 1, 0, 1, 0, 3, 6, 1, 0.3, 0.3, 0.3, 9, 0); for (let k = 0; k < 600; k++) f.step(1 / 120, null, null); return Array.from(f.r.slice(40 * 3, 40 * 3 + 60)); };
  assert.deepEqual(run(5), run(5)); assert.notDeepEqual(run(5), run(6));
  const f = new DebrisField(); f.reseed(2); for (let k = 0; k < 60; k++) f.spawn(SHAPE.CHUNK, 1, 0, 1, 0, 3, 6, 1, 0.3, 0.3, 0.3, 9, 3);
  f.step(1 / 60, () => {}, () => {});                      // warm up
  if (global.gc) { global.gc(); const before = process.memoryUsage().heapUsed; for (let k = 0; k < 2000; k++) f.step(1 / 120, () => {}, () => {}); assert.ok(process.memoryUsage().heapUsed - before < 2e6); }
});

test('planPart: launches away from the car, scaled by power; every sim part has a debris spec', () => {
  for (const id of PART_IDS) assert.ok(PART_SPEC[id], id);
  const ev = { part: 'doorR', x: 10, y: 5, dx: 0, dy: 1, vx: 20, vy: 0, power: 1, wreck: false };
  const a = planPart(ev, mulberry32(1), {}), b = planPart({ ...ev, wreck: true, power: 1.5 }, mulberry32(1), {});
  assert.ok(a.vz > 3, 'thrown out of the right side');
  assert.ok(Math.abs(a.vx - 17) < 12, 'inherits the car speed');
  assert.ok(Math.hypot(b.vx - 17, b.vz) > Math.hypot(a.vx - 17, a.vz), 'a wreck throws harder');
  assert.ok(a.vy > 0);
  assert.ok(chunkCount(0) >= 4 && chunkCount(10) <= 34);
});

test('createDebris renders headlessly: spawn, update, instanced matrices move, dispose', () => {
  const scene = new THREE.Scene();
  const calls = { b: 0, t: 0 };
  const d = createDebris(scene, { soft: true, onBounce: () => calls.b++, onTrail: () => calls.t++ });
  assert.equal(d.meshes.length, 4);
  const slot = d.spawnPart({ part: 'hood', x: 0, y: 0, dx: 1, dy: 0, vx: 0, vy: 0, power: 1, wreck: true, seed: 9, carId: 0 }, [0.8, 0.1, 0.1]);
  d.spawnBurst(0, 0, 12, 1, 4, [0.8, 0.1, 0.1], 0.5);
  const m0 = new THREE.Matrix4(); d.meshes[SHAPE.PANEL].getMatrixAt(slot, m0);
  for (let k = 0; k < 60; k++) d.update(1 / 60);
  const m1 = new THREE.Matrix4(); d.meshes[SHAPE.PANEL].getMatrixAt(slot, m1);
  assert.ok(!m0.equals(m1), 'the hood moved');
  assert.ok(d.field.count >= 13);
  assert.ok(calls.b + calls.t > 0);
  d.dispose();
  assert.equal(scene.children.length, 0);
});

test('impact feel: wrecks of the camera car slow time and shake hard, distant events barely register, nothing for no camera car', () => {
  const me = { id: 0, x: 0, y: 0 };
  const own = eventImpact({ type: 'explosion', kind: 'wreck', carId: 0, x: 0, y: 0, radius: 5 }, me);
  assert.ok(own.shake > 1 && own.slowDur > 1 && own.slowScale < 0.4 && own.hitStop > 0.05);
  const near = { ...eventImpact({ type: 'explosion', kind: 'wreck', carId: 3, x: 10, y: 0, radius: 5 }, me) };
  const far = { ...eventImpact({ type: 'explosion', kind: 'wreck', carId: 3, x: 200, y: 0, radius: 5 }, me) };
  assert.ok(near.shake > far.shake && far.shake === 0 && far.slowDur === 0 && near.slowDur > 0);
  assert.ok(eventImpact({ type: 'hit', carId: 0, weaponId: 'rocket', dmg: 20 }, me).hitStop > 0);
  assert.equal(eventImpact({ type: 'hit', carId: 0, weaponId: 'machinegun', dmg: 1 }, me).hitStop, 0);
  assert.equal(eventImpact({ type: 'bump', carId: 0, strength: 3 }, null).shake, 0);
  assert.ok(eventImpact({ type: 'bump', carId: 0, strength: 20 }, me).hitStop > 0);
});

test('TimeScaler: hit-stop freezes briefly, slow-mo holds then eases back to real time, stacking takes the strongest', () => {
  const t = new TimeScaler();
  assert.equal(t.update(1 / 60), 1);
  t.trigger(0.05, 0.3, 1.0);
  assert.ok(t.update(1 / 60) < 0.1, 'frozen');
  let s = 1, steps = 0; const seen = [];
  while (t.hitT > 0) t.update(1 / 60);
  for (let k = 0; k < 140; k++) { s = t.update(1 / 60); seen.push(s); steps++; }
  assert.ok(Math.min(...seen) <= 0.31 && Math.min(...seen) >= 0.05, `slow ${Math.min(...seen)}`);
  assert.ok(seen.every((v) => v >= 0.05 && v <= 1));
  assert.equal(seen[seen.length - 1], 1);
  for (let k = 1; k < seen.length - 1; k++) if (seen[k] > 0.31) assert.ok(seen[k] >= seen[k - 1] - 1e-9, 'monotone ease back');
  t.trigger(0, 0.6, 0.5); t.trigger(0, 0.3, 0.2);
  assert.ok(t.update(0.01) <= 0.31);
});
