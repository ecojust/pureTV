import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack } from '../../src/core/trackModel.js';
import { getTrack } from '../../src/data/tracks/index.js';
import { lapSpeed, wrapDistance, victorySnapshot, LAP_SECONDS } from '../../src/render/victoryLap.js';

const race = () => ({
  phase: 'finished', tick: 812, countdown: 0,
  cars: [
    { id: 0, isPlayer: true, x: 1, y: 2, heading: 0, speed: 0, color: 9, livery: { paint: 'gold' }, armor: 4, armorMax: 10, wrecked: false, finished: true, surface: 'kerb', weapons: [{ id: 'mg', ammo: 3 }] },
    { id: 1, isPlayer: false, x: 50, y: 50, heading: 2, speed: 30, color: 4, wrecked: true },
  ],
  projectiles: [{ id: 7 }], hazards: [{ type: 'wreck' }], pickups: [{ id: 1 }], events: [{ type: 'hit' }],
});

test('lap speed and distance wrap: one lap of the length in LAP_SECONDS, and distances stay on the lap', () => {
  assert.equal(lapSpeed(1080, 36), 30);
  assert.equal(lapSpeed(1080), 1080 / LAP_SECONDS);
  assert.equal(wrapDistance(0, 100), 0);
  assert.equal(wrapDistance(250, 100), 50);
  assert.equal(wrapDistance(-5, 100), 95);
  assert.ok(Math.abs(wrapDistance(-300.5, 100) - 99.5) < 1e-9);
});

test('a full lap of the centreline closes on the start', () => {
  for (const id of ['neonloop', 'foundry', 'daylite']) {
    const track = buildTrack(getTrack(id));
    const a = track.pointAt(0), b = track.pointAt(track.length - 0.01);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1, `${id} lap closes`);
    let worst = 0, prev = track.pointAt(0);
    for (let s = 1; s <= track.length; s += 2) {
      const p = track.pointAt(s);
      worst = Math.max(worst, Math.hypot(p.x - prev.x, p.y - prev.y));
      prev = p;
    }
    assert.ok(worst < 2.5, `${id} steps are smooth (${worst.toFixed(2)} m)`);
  }
});

test('victorySnapshot: only the player car, placed on the pose, rolling at the lap speed, no race leftovers', () => {
  const t = race();
  const pose = { x: 30, y: -4, heading: 1.2 };
  const snap = victorySnapshot(t, pose, 30);
  assert.equal(snap.cars.length, 1);
  const car = snap.cars[0];
  assert.equal(car.id, 0); assert.equal(car.isPlayer, true);
  assert.equal(car.x, 30); assert.equal(car.y, -4); assert.equal(car.heading, 1.2);
  assert.ok(Math.abs(car.vx - 30 * Math.cos(1.2)) < 1e-9 && Math.abs(car.vy - 30 * Math.sin(1.2)) < 1e-9);
  assert.equal(car.speed, 30); assert.equal(car.steer, 0); assert.equal(car.braking, false);
  assert.equal(car.wrecked, false); assert.equal(car.finished, false); assert.equal(car.surface, 'tarmac');
  assert.equal(car.color, 9); assert.deepEqual(car.livery, { paint: 'gold' }); assert.deepEqual(car.weapons, [{ id: 'mg', ammo: 3 }]);
  assert.equal(snap.phase, 'racing', 'a racing phase, so the TV camera holds (not the finish orbit)');
  assert.deepEqual([snap.events, snap.projectiles, snap.hazards, snap.pickups], [[], [], [], []]);
  assert.equal(t.cars[0].x, 1, 'the race snapshot is not changed');
  assert.equal(t.cars.length, 2);
});
