import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS, PART_IDS, newlyLost, remainingParts, PART_ORIGIN } from '../../src/sim/parts.js';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';
import { applyDamage } from '../../src/sim/damage.js';

test('parts: pure thresholds — nothing at full health, zone hits take the nearest panel first, everything at the end', () => {
  assert.deepEqual(newlyLost([0, 0, 0, 0], 1, []), []);
  assert.deepEqual(newlyLost([0.6, 0, 0, 0], 0.9, []), ['bumperF']);
  assert.ok(newlyLost([0.85, 0, 0, 0], 0.9, []).includes('hood'));
  assert.ok(!newlyLost([0, 0.5, 0, 0], 0.9, []).includes('doorL'));
  assert.deepEqual(newlyLost([0.6, 0, 0, 0], 0.9, ['bumperF']), [], 'a part is lost only once');
  assert.deepEqual(newlyLost([0, 0, 0, 0], 0.01, []).sort(), [...PART_IDS].sort(), 'a nearly dead car sheds everything');
  assert.deepEqual(remainingParts(['hood', 'turret']).sort(), PART_IDS.filter((p) => p !== 'hood' && p !== 'turret').sort());
  for (const p of PARTS) assert.ok(PART_ORIGIN[p.id], `origin for ${p.id}`);
  // monotonic in damage
  let prev = 0;
  for (let f = 1; f >= 0; f -= 0.05) { const n = newlyLost([0, 0, 0, 0], f, []).length; assert.ok(n >= prev); prev = n; }
});

test('sim: progressive damage emits one partLost per part with launch data, a wreck sheds the rest, deterministically', () => {
  const run = () => {
    const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'], seed: 11 }), {});
    goRacing(sim);
    const [a, b] = sim.cars;
    place(sim, a, 400, 0, 0); place(sim, b, 440, 0, 0); b.aiControlled = false;
    const lost = [], wrecks = [], expl = [];
    sim.events.on('partLost', (e) => lost.push(e)); sim.events.on('wreck', (e) => wrecks.push(e)); sim.events.on('explosion', (e) => expl.push(e));
    // chip the target from the front with rockets' worth of damage
    const dmg = (amount) => { b.armor -= 0; applyDamage(b, 0, 0, 0); };
    void dmg;
    a.weapons = [{ id: 'machinegun', ammo: 999 }]; a.cooldowns = [0]; a.activeWeapon = 0;
    for (let i = 0; i < 120 * 12 && !b.wrecked; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
    for (let i = 0; i < 10; i++) sim.step(null);
    return { lost, wrecks, expl, b };
  };
  const r1 = run(), r2 = run();
  assert.ok(r1.b.wrecked);
  const ids = r1.lost.map((e) => e.part);
  assert.equal(new Set(ids).size, ids.length, 'each part once');
  assert.equal(ids.length, PART_IDS.length, 'all parts are gone by the time the car is wrecked');
  const early = r1.lost.filter((e) => !e.wreck);
  assert.ok(early.length >= 2, 'some panels peel off before the wreck');
  assert.ok(early.every((e) => Number.isFinite(e.x) && Number.isFinite(e.dx) && e.seed > 0 && e.carId === 1));
  assert.equal(r1.wrecks.length, 1);
  assert.ok(Number.isFinite(r1.wrecks[0].x) && r1.wrecks[0].seed > 0);
  const big = r1.expl.find((e) => e.kind === 'wreck');
  assert.ok(big && big.big === true && big.carId === 1, 'wreck explosion is tagged');
  assert.deepEqual(r1.lost.map((e) => [e.part, e.seed]), r2.lost.map((e) => [e.part, e.seed]), 'seeds are deterministic');
});

test('sim: rocket explosions carry their weapon kind', () => {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0); place(sim, b, 440, 0, 0); b.aiControlled = false;
  a.weapons = [{ id: 'rocket', ammo: 5 }]; a.cooldowns = [0]; a.activeWeapon = 0;
  const kinds = []; sim.events.on('explosion', (e) => kinds.push(e.kind));
  for (let i = 0; i < 240; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: i < 3 });
  assert.ok(kinds.includes('rocket'), JSON.stringify(kinds));
});

test('snapshot: new fields are present and the old shape is untouched', () => {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const s = sim.snapshot(), c = s.cars[0];
  for (const k of ['nitro', 'nitroOn', 'drift', 'boost', 'parts', 'wreckT', 'x', 'y', 'heading', 'armor', 'wrecked']) assert.ok(k in c, k);
  assert.ok(c.nitro >= 0 && c.nitro <= 1);
});
