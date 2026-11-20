import test from 'node:test';
import assert from 'node:assert/strict';
import { createCarBody, stepBody, brakeLimit, gripAccel, torqueCurve, slipGrip, gearFor, TUNING } from '../../src/sim/carPhysics.js';
import { surfaceAt, SURFACES } from '../../src/sim/surfaces.js';
import { damageHandling, damageZone, addZoneDamage, damageStage, initDamage } from '../../src/sim/damage.js';
import { buildTrack } from '../../src/core/trackModel.js';
import { getTrack } from '../../src/data/tracks/index.js';
import { getCar } from '../../src/data/cars.js';
import { createRaceSim } from '../../src/sim/raceSim.js';
import { applyDamage } from '../../src/sim/damage.js';
import { makeConfig, goRacing } from '../sim/helpers.js';

const STATS = { ...getCar('hammer').base };
const DT = 1 / 120;
const run = (b, input, secs, mods) => { for (let i = 0; i < secs * 120; i++) stepBody(b, input, DT, mods); return b; };
const cruise = (v) => { const b = createCarBody({ x: 0, y: 0, heading: 0 }, STATS); b.vx = v; b.u = v; b.speed = v; return b; };

test('braking decel is realistic (1.1-1.6 g), not ~4 g', () => {
  const b = cruise(50);
  const s0 = b.speed;
  run(b, { throttle: 0, brake: 1, steer: 0 }, 1);
  const g = (s0 - b.speed) / 9.81;
  assert.ok(g > 1.1 && g < 1.6, `decel ${g.toFixed(2)} g`);
  assert.ok(brakeLimit(STATS) <= gripAccel(STATS) + 1e-9);
});

test('brake force is limited by grip on low-grip surfaces', () => {
  assert.ok(brakeLimit(STATS, 0.5) < brakeLimit(STATS, 1) * 0.6);
});

test('engine: gears shift up through the range, redline respected, torque curve peaks mid-rev', () => {
  const b = createCarBody({ x: 0, y: 0, heading: 0 }, STATS);
  const seen = new Set();
  for (let i = 0; i < 120 * 30; i++) { stepBody(b, { throttle: 1, brake: 0, steer: 0 }, DT); seen.add(b.gear); assert.ok(b.rpm <= 1.06 && b.rpm >= TUNING.idleRpm - 1e-9); }
  assert.deepEqual([...seen].sort(), [1, 2, 3, 4, 5]);
  assert.ok(b.speed <= STATS.maxSpeed * 1.08 && b.speed > STATS.maxSpeed * 0.9, `top ${b.speed}`);   // straight-line boost adds up to +7.5 %
  assert.ok(torqueCurve(0.6) > torqueCurve(0.1) && torqueCurve(0.6) > torqueCurve(1));
  const lo = gearFor(10, 56, 1), hi = gearFor(50, 56, 1);
  assert.ok(hi.gear > lo.gear);
});

test('weight transfer: braking loads the nose, accelerating the tail', () => {
  const b = cruise(40);
  run(b, { throttle: 0, brake: 1, steer: 0 }, 0.6);
  assert.ok(b.load > 0.15, `load under braking ${b.load}`);
  const c = createCarBody({ x: 0, y: 0, heading: 0 }, STATS);
  run(c, { throttle: 1, brake: 0, steer: 0 }, 1);
  assert.ok(c.load < -0.05, `load under power ${c.load}`);
});

test('tyre grip curve peaks then falls off with slip angle', () => {
  assert.equal(slipGrip(0.05), 1);
  assert.ok(slipGrip(0.5) < slipGrip(0.2) && slipGrip(0.2) <= 1);
  assert.ok(slipGrip(0.8) >= 1 - TUNING.slipFall - 1e-9);
});

test('braking while turning gives less cornering than coasting (friction circle) and handbrake kicks the tail out', () => {
  const turn = (input) => { const b = cruise(35); run(b, { throttle: 0, steer: 0.6, ...input }, 1.2); return Math.abs(b.yawRate) * b.speed; };
  const coast = turn({ brake: 0 }), brake = turn({ brake: 1 });
  assert.ok(brake < coast, `${brake} !< ${coast}`);
  const hb = cruise(35); run(hb, { throttle: 0.3, steer: 0.6, handbrake: true }, 1);
  const free = cruise(35); run(free, { throttle: 0.3, steer: 0.6 }, 1);
  assert.ok(Math.abs(hb.w) > Math.abs(free.w) + 0.5, `handbrake slide ${hb.w} vs ${free.w}`);
  assert.ok(hb.slip > free.slip);
});

test('arcade slide recovery: a car stepping out is pulled straight again by itself (no driver input)', () => {
  const b = cruise(30);
  b.w = 12; b.vy = 12;
  const beta0 = Math.abs(Math.atan2(b.w, b.u));
  run(b, { throttle: 0.5, steer: 0 }, 0.2);
  assert.ok(Math.abs(b.yawRate) > 0.05, 'the assist is turning the nose');
  assert.ok(Math.sign(b.yawRate) === 1, `nose rotates toward the direction of travel (w>0 -> yaw right), yaw ${b.yawRate}`);
  run(b, { throttle: 0.5, steer: 0 }, 1.5);
  const beta1 = Math.abs(Math.atan2(b.w, Math.abs(b.u)));
  assert.ok(beta1 < beta0 * 0.2, `slip ${beta0.toFixed(2)} -> ${beta1.toFixed(2)}`);
});

test('wheelspin on a standing start with traction loss on low grip', () => {
  const g = createCarBody({ x: 0, y: 0, heading: 0 }, STATS);
  let spun = 0;
  for (let i = 0; i < 120; i++) { stepBody(g, { throttle: 1, brake: 0, steer: 0 }, DT, { gripMult: 0.5 }); spun = Math.max(spun, g.wheelspin); }
  assert.ok(spun > 0.1, `wheelspin ${spun}`);
});

test('kick impulse is spread over time (no single-tick velocity snap) but is fully delivered', () => {
  const b = cruise(30);
  b.kickX = -8;
  stepBody(b, { throttle: 0, brake: 0, steer: 0 }, DT);
  assert.ok(b.speed > 28.5, 'first tick moves < 1.5 m/s');
  run(b, { throttle: 0, brake: 0, steer: 0 }, 1.5);
  assert.ok(Math.abs(b.kickX) < 0.05);
});

test('surfaces: scrapyard oil / puddle / dirt / kerb zones', () => {
  const tr = buildTrack(getTrack('scrapyard'));
  const L = tr.length, o = tr.def.surfaces.oil[0];
  assert.equal(surfaceAt(tr, o.s * L, o.d), 'oil');
  assert.equal(surfaceAt(tr, 0.0 * L + 300, 0), 'tarmac');
  const p = tr.def.surfaces.puddles[0];
  assert.equal(surfaceAt(tr, p.s * L, p.d), 'puddle');
  const z = tr.def.surfaces.dirt[0];
  assert.equal(surfaceAt(tr, ((z.s0 + z.s1) / 2) * L, z.side * 7.5), 'dirt');
  assert.equal(surfaceAt(tr, 0.4 * L, 7.8), 'kerb');
  assert.ok(SURFACES.oil.grip < SURFACES.dirt.grip && SURFACES.dirt.grip < SURFACES.tarmac.grip);
  const other = buildTrack(getTrack('strip'));
  assert.equal(surfaceAt(other, 100, 7.9), 'tarmac', 'tracks without surfaces stay plain tarmac');
});

test('damage affects handling progressively', () => {
  const ok = damageHandling(0.9), mid = damageHandling(0.4), bad = damageHandling(0.1);
  assert.equal(ok.pull, 0); assert.equal(ok.accel, 1);
  assert.ok(Math.abs(mid.pull) > 0 && mid.accel < 1);
  assert.ok(bad.accel < mid.accel && Math.abs(bad.pull) > Math.abs(mid.pull) && bad.top < 1 && bad.grip < 1);
  assert.equal(Math.sign(damageHandling(0.2, 0).pull), -Math.sign(damageHandling(0.2, 1).pull));
});

test('damage zones and stages', () => {
  const car = { x: 0, y: 0, heading: 0, armorMax: 100 };
  assert.equal(damageZone(car, 5, 0), 0);        // ahead -> front
  assert.equal(damageZone(car, 0, 5), 1);        // +y at heading 0 is the right side
  assert.equal(damageZone(car, -5, 0), 2);
  assert.equal(damageZone(car, 0, -5), 3);
  initDamage(car, 100, 100);
  addZoneDamage(car, 0, 30); addZoneDamage(car, 0, 100);
  assert.ok(car.dmgMap[0] === 1 && car.dmgMap[2] === 0);
  assert.deepEqual([1, 0.5, 0.25, 0.1, 0.5].map((f, i) => damageStage(f, i === 4)), [0, 1, 2, 3, 4]);
});

test('snapshot exposes the dynamics fields and zone damage', () => {
  const sim = createRaceSim(makeConfig('scrapyard', { rivalIds: [] }), { aiPlayer: true });
  goRacing(sim);
  for (let i = 0; i < 240; i++) sim.step(null);
  const c = sim.snapshot().cars[0];
  for (const k of ['gear', 'rpm', 'ax', 'ay', 'load', 'slip', 'wheelspin', 'braking', 'surface', 'throttle', 'limiter']) assert.ok(k in c, k);
  assert.equal(c.dmg.length, 4);
  assert.ok(c.gear >= 1 && c.rpm > 0.1);
});

test('player wreck: the rest of the field keeps racing and the player is ranked behind finishers', () => {
  const sim = createRaceSim(makeConfig('scrapyard', { mode: 'race', rivalIds: ['vex', 'rust'] }), { maxTime: 400 });
  goRacing(sim);
  for (let i = 0; i < 120 * 5; i++) sim.step(null);
  applyDamage(sim.cars[0], 1e6, null, sim.time);
  const t0 = sim.time;
  let n = 0;
  while (!sim.isOver() && n++ < 120 * 400) sim.step(null);
  assert.ok(sim.isOver());
  assert.ok(sim.time - t0 > 60, 'rivals raced on for a long time after the wreck');
  const r = sim.result();
  assert.equal(r.finishOrder[r.finishOrder.length - 1].isPlayer, true);
  assert.equal(r.player.wrecked, true);
  assert.ok(r.finishOrder.filter((f) => f.time != null).length >= 1);
});

test('blast kicks do not teleport speed in one tick', () => {
  const sim = createRaceSim(makeConfig('scrapyard', { rivalIds: [] }), { aiPlayer: true });
  goRacing(sim);
  for (let i = 0; i < 240; i++) sim.step(null);
  const c = sim.cars[0]; c.kickX = 8 * Math.cos(c.heading + 1); c.kickY = 8 * Math.sin(c.heading + 1);
  const v0 = c.speed; sim.step(null);
  assert.ok(Math.abs(c.speed - v0) < 1.6);
});
