import test from 'node:test';
import assert from 'node:assert/strict';
import { create, step, aiInput } from '../source/model.mjs';
import { makeTrack, sampleTrack } from '../source/tracks.mjs';

const dt = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
function advance(state, seconds, input = {}) {
  for (let f = 0; f < Math.ceil(seconds / dt); f++) step(state, dt, typeof input === 'function' ? input(state) : input);
  return state;
}
function ready(track = 0, seed = 7) {
  const state = create(seed, track);
  advance(state, 3.1);
  return state;
}
function playerOnly(track = 0) { const s = ready(track); s.cars.splice(1); return s; }
function place(state, s, lateral = 0, heading = null) {
  const car = state.player, track = makeTrack(state.trackId), p = sampleTrack(track, s);
  car.trackS = car.lastS = car.safeS = p.s;
  car.progress = car.safeProgress = s;
  car.x = car.lastX = p.x + Math.cos(p.yaw) * lateral;
  car.z = car.lastZ = p.z - Math.sin(p.yaw) * lateral;
  car.y = p.y; car.yaw = car.velocityYaw = heading === null ? p.yaw : heading;
  car.lateral = lateral;
}
function finishByInputs(track, seed = 17, quantized = false) {
  const s = create(seed, track);
  let accumulator = 0, held = {};
  for (let frame = 0; frame < 11000 && s.phase === 'playing'; frame++) {
    let input;
    if (quantized) {
      if (frame % 5 === 0) {
        const desired = aiInput(s);
        accumulator += desired.x;
        const x = accumulator > .5 ? 1 : accumulator < -.5 ? -1 : 0;
        accumulator -= x;
        held = { x, y: desired.y > 0 ? 1 : 0, a: desired.a, bPressed: desired.bPressed };
        // Keyboard diagonals are normalized by the actual shared runtime.
        if (held.x && held.y) { held.x /= Math.SQRT2; held.y /= Math.SQRT2; }
      }
      input = { ...held, bPressed: frame % 5 === 0 && held.bPressed };
    } else input = aiInput(s);
    step(s, dt, input);
  }
  return s;
}

test('grid has six independent seeded competitors and safe finite track selection', () => {
  const s = create(9, 0);
  assert.equal(s.cars.length, 6);
  assert.equal(s.player, s.cars[0]);
  assert.equal(new Set(s.cars.map(c => c.color)).size, 6);
  assert.deepEqual(create(9, 0), s);
  assert.notEqual(create(10).cars[1].skill, s.cars[1].skill);
  assert.equal(create(0, Infinity).trackId, s.trackId);
  assert.equal(create(0, -1).trackId, 'canyon');
});

test('countdown prevents early throttle, steering, nitro and distance gain', () => {
  const s = create(), start = clone(s.cars);
  advance(s, 2.5, { x: 1, y: -1, a: true, bPressed: true });
  assert.deepEqual(s.cars, start);
  assert.equal(s.raceTime, 0);
  assert.ok(s.countdown > 0);
});

test('right/left steering changes real heading and position; unsteered motion is not a rail follower', () => {
  const straight = playerOnly(), right = playerOnly(), left = playerOnly();
  const initialYaw = right.player.yaw;
  advance(straight, 1.2); advance(right, 1.2, { x: 1 }); advance(left, 1.2, { x: -1 });
  assert.ok(right.player.yaw > initialYaw + .15);
  assert.ok(left.player.yaw < initialYaw - .15);
  assert.ok(right.player.lateral > straight.player.lateral + 1);
  assert.ok(left.player.lateral < straight.player.lateral - 1);
  const unattended = playerOnly(); advance(unattended, 90);
  assert.equal(unattended.player.completedLaps, 0);
  assert.ok(unattended.stats.collisions > 0);
});

test('automatic acceleration has a bounded top speed and brake stops without reverse motion', () => {
  const s = playerOnly(); advance(s, 2.2);
  assert.ok(s.player.speed > 20 && s.player.speed <= 36);
  const before = s.player.progress;
  advance(s, 1.3, { y: 1 });
  assert.equal(s.player.speed, 0);
  assert.ok(s.player.progress >= before);
});

test('nitro requires a full charge and a press edge, consumes charge and expires', () => {
  const s = playerOnly(); advance(s, 1);
  step(s, dt, { b: true, bPressed: true });
  assert.equal(s.stats.nitros, 1); assert.equal(s.player.nitro, 0);
  assert.ok(s.player.boostTime > 2);
  const before = s.player.speed;
  advance(s, .8, { b: true, bPressed: true });
  assert.equal(s.stats.nitros, 1); assert.ok(s.player.speed > before + 12);
  advance(s, 1.4);
  assert.equal(s.player.boostTime, 0);
  s.player.nitro = 99;
  step(s, dt, { bPressed: true }); assert.equal(s.stats.nitros, 1);
});

test('holding drift on a straight or at rest grants neither charge nor a mini boost', () => {
  const s = playerOnly(); s.player.nitro = 0;
  advance(s, 1.8, { a: true });
  assert.equal(s.player.nitro, 0); assert.equal(s.stats.drifts, 0);
  step(s, dt, {}); assert.equal(s.stats.miniBoosts, 0);
});

test('a sustained genuine drift charges nitro and a timely release grants a short mini boost', () => {
  const s = playerOnly(); place(s, 22); s.player.speed = 24; s.player.nitro = 0;
  advance(s, .85, { x: .43, a: true });
  assert.ok(s.player.slip > .035); assert.ok(s.player.nitro > 5);
  assert.equal(s.stats.drifts, 1);
  step(s, dt, { x: .25 });
  assert.equal(s.stats.miniBoosts, 1); assert.ok(s.player.miniBoostTime > .6);
  advance(s, .6, {}); assert.equal(s.stats.miniBoosts, 1);
});

test('cancellation invalidates held drift and nitro and cannot synthesize a release reward', () => {
  const s = playerOnly(); place(s, 22); s.player.speed = 24;
  advance(s, .85, { x: .43, a: true });
  step(s, dt, { cancelled: true, cancelEpoch: 2, a: false, bPressed: true });
  assert.equal(s.player.driftTime, 0); assert.equal(s.player.drifting, false);
  assert.equal(s.stats.miniBoosts, 0); assert.equal(s.stats.nitros, 0);
  step(s, dt, { cancelEpoch: 2, b: true, bPressed: true });
  assert.equal(s.stats.nitros, 0);
  step(s, dt, { cancelEpoch: 2 });
  step(s, dt, { cancelEpoch: 2, bPressed: true });
  assert.equal(s.stats.nitros, 1);
});

test('barriers reduce speed and retain the player inside the road without yaw rail-following', () => {
  const s = playerOnly(), track = makeTrack(s.trackId);
  place(s, 32, track.width / 2 - 1.15);
  s.player.speed = 30; s.player.yaw += .8; s.player.velocityYaw = s.player.yaw;
  const beforeYaw = s.player.yaw;
  advance(s, .1);
  assert.ok(s.stats.collisions > 0); assert.ok(s.player.speed < 22);
  assert.ok(Math.abs(s.player.lateral) < track.width / 2);
  assert.ok(Math.abs(s.player.yaw - beforeYaw) < .05);
});

test('a player genuinely stalled against a barrier recovers after four seconds without gate credit', () => {
  const s = playerOnly(), track = makeTrack(s.trackId);
  place(s, 32, track.width / 2 - 1.15);
  s.player.speed = 20;
  s.player.yaw += Math.PI / 2;
  s.player.velocityYaw = s.player.yaw;
  const start = s.raceTime, gate = s.player.nextGate, lap = s.player.completedLaps;
  let recovery = null;
  for (let i = 0; i < 600; i++) {
    const safe = s.player.safeProgress;
    step(s, dt, {});
    if (s.events.some(e => e.type === 'reset')) { recovery = { safe, progress: s.player.progress }; break; }
  }
  assert.ok(recovery, 'Actual stalled player must receive an automatic reset');
  assert.ok(s.raceTime - start >= 4);
  assert.ok(recovery.progress - recovery.safe < .002);
  assert.equal(s.player.nextGate, gate); assert.equal(s.player.completedLaps, lap);
  assert.ok(s.player.stalledTime < .02 && s.player.resetCooldown > 1);
  assert.equal(s.player.airHeight, 0);
  const atRecovery = s.player.progress;
  advance(s, 1, {});
  assert.ok(s.player.speed >= 5 && s.player.progress > atRecovery + 2,
    'Recovery must release the stall timer and allow real driving afterward');
});

test('automatic recovery does not repeat every tick or manufacture progress while braking', () => {
  const s = playerOnly();
  let resets = 0;
  for (let i = 0; i < 600; i++) {
    step(s, dt, { y: 1 });
    if (s.events.some(e => e.type === 'reset')) resets++;
  }
  assert.equal(resets, 2);
  assert.equal(s.player.completedLaps, 0); assert.equal(s.player.nextGate, 1);
  assert.ok(s.player.progress < 0);
  assert.ok(s.raceTime >= 10);
});

test('car contacts separate vehicles and cost speed once per cooldown', () => {
  const s = ready(); s.cars.splice(2);
  const p = s.player, b = s.cars[1];
  b.x = b.lastX = p.x + 1; b.z = b.lastZ = p.z;
  p.speed = 25; b.speed = 5;
  step(s, dt, {});
  assert.ok(Math.hypot(p.x - b.x, p.z - b.z) >= 2.249);
  assert.equal(s.stats.collisions, 1); assert.ok(p.speed < 21);
  step(s, dt, {}); assert.equal(s.stats.collisions, 1);
});

test('crossing a jump pad produces a ballistic arc and landing reward, not a permanent float', () => {
  const s = playerOnly(2), track = makeTrack(s.trackId), pad = track.jumpPads[0];
  place(s, pad.s - .3); s.player.speed = 27;
  advance(s, .12);
  assert.equal(s.stats.jumps, 1); assert.ok(s.player.airHeight > 0);
  let highest = s.player.airHeight;
  for (let i = 0; i < 90; i++) { step(s, dt, aiInput(s)); highest = Math.max(highest, s.player.airHeight); }
  assert.ok(highest > .6); assert.equal(s.player.airHeight, 0); assert.equal(s.player.airVelocity, 0);
  assert.ok(s.stats.miniBoosts >= 1); assert.equal(s.stats.jumps, 1);
});

test('reset during a jump removes ungrounded progress and cannot farm distance or gates', () => {
  const s = playerOnly(2), track = makeTrack(s.trackId), pad = track.jumpPads[0];
  place(s, pad.s - 1); s.player.speed = 28;
  advance(s, .25); assert.ok(s.player.airHeight > 0);
  const before = s.player.progress, safe = s.player.safeProgress, gate = s.player.nextGate;
  step(s, dt, { resetPressed: true });
  assert.ok(s.player.progress < before);
  // The second 120 Hz substep may physically roll forward less than 2 mm.
  assert.ok(s.player.progress >= safe && s.player.progress - safe < .002);
  assert.equal(s.player.nextGate, gate); assert.equal(s.player.airHeight, 0);
  assert.ok(s.player.speed <= 6 && s.player.resetCooldown > 1);
});

test('a position discontinuity does not award a finish-line or checkpoint shortcut', () => {
  const s = playerOnly(), track = makeTrack(s.trackId), end = sampleTrack(track, track.length - 1);
  s.player.x = end.x + 100; s.player.z = end.z + 100; s.player.speed = 40;
  const progress = s.player.progress;
  step(s, dt);
  assert.ok(s.player.progress - progress < .002); assert.equal(s.player.completedLaps, 0);
  assert.equal(s.player.nextGate, 1);
});

test('reverse crossings of the start line cannot create laps', () => {
  const s = playerOnly(), track = makeTrack(s.trackId);
  place(s, .5, 0, sampleTrack(track, 0).yaw + Math.PI); s.player.speed = 20;
  advance(s, .2);
  assert.ok(s.player.progress < .5); assert.equal(s.player.completedLaps, 0);
  assert.equal(s.player.nextGate, 1);
});

test('AI planning does not mutate a detached JSON observation', () => {
  const s = ready(), snapshot = clone(s), before = JSON.stringify(snapshot);
  const input = aiInput(snapshot, snapshot.player);
  assert.equal(JSON.stringify(snapshot), before);
  assert.ok(Number.isFinite(input.x) && Math.abs(input.x) <= 1);
  assert.ok([-1, 1].includes(input.y));
});

test('JSON round-trip state can resume without breaking the player reference', () => {
  const s = ready(), copy = clone(s);
  advance(s, 1); advance(copy, 1);
  assert.equal(copy.player, copy.cars[0]);
  assert.deepEqual(copy, s);
});

for (const track of [0, 1, 2]) test(`track ${track}: ordinary analog inputs complete two ordered laps, with finite AI competition`, () => {
  const s = finishByInputs(track);
  assert.equal(s.phase, 'won'); assert.equal(s.player.completedLaps, 2); assert.equal(s.player.nextGate, 17);
  assert.ok(s.raceTime > 35 && s.raceTime < 100); assert.ok(s.rank >= 1 && s.rank <= 6);
  assert.ok(s.stats.drifts > 0 && s.stats.nitros > 0 && s.stats.miniBoosts > 0);
  for (const car of s.cars) {
    assert.ok(car.progress > 1000); assert.ok(car.speed >= 0 && car.speed <= 52);
    for (const v of Object.values(car)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
  }
  if (track === 2) assert.equal(s.stats.jumps, 2);
});

for (const track of [0, 1, 2]) test(`track ${track}: keyboard-quantized directions and normalized braking can finish`, () => {
  const s = finishByInputs(track, 41, true);
  assert.equal(s.phase, 'won'); assert.equal(s.player.completedLaps, 2);
  assert.ok(s.stats.drifts >= 2 && s.stats.nitros >= 1);
  assert.ok(s.stats.collisions < 5);
});

test('finish is deterministic and freezes the result under every further input', () => {
  const a = finishByInputs(0, 31), b = finishByInputs(0, 31);
  assert.deepEqual(a, b);
  const before = clone(a);
  advance(a, 2, { x: 1, a: true, bPressed: true, resetPressed: true });
  assert.deepEqual(a, before);
});

test('running out of race time produces a frozen result rather than claiming a finish', () => {
  const s = playerOnly(); advance(s, 181, { y: 1 });
  assert.equal(s.phase, 'lost'); assert.equal(s.player.completedLaps, 0);
  const before = clone(s); step(s, dt, { x: 1, bPressed: true }); assert.deepEqual(s, before);
});

test('invalid/large deltas cannot skip a race and out-of-range inputs remain finite', () => {
  const s = ready(), before = s.raceTime;
  step(s, -3); step(s, NaN); assert.equal(s.raceTime, before);
  step(s, 100, { x: Infinity, y: -Infinity });
  assert.ok(s.raceTime - before <= .100001);
  assert.ok(Number.isFinite(s.player.x) && Number.isFinite(s.player.yaw));
});
