import test from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';
import { getWeapon } from '../../src/data/weapons.js';

const IDLE = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
const FIRE = { ...IDLE, fire: true };

/** Player (a) and one stationary rival (b) on the strip; a holds the terminator drone. */
function setup(gap) {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0);
  place(sim, b, 400 + gap, 0, 0);
  b.aiControlled = false;
  b.armor = b.armorMax = 200;
  a.weapons = [{ id: 'terminator', ammo: 2 }]; a.cooldowns = [0]; a.activeWeapon = 0;
  return { sim, a, b };
}

test('the terminator is a fast drone: one slot, a blast on impact, and a hard hit', () => {
  const t = getWeapon('terminator');
  assert.equal(t.drone, true);
  assert.ok(t.speed > getWeapon('guided').speed, 'faster than a guided missile');
  assert.ok(t.radius >= 5, `carries a blast (${t.radius} m)`);
  assert.equal(t.slot, 1, 'one slot, so every car can carry it');
  assert.ok(t.damage >= 44, `direct hit ${t.damage}`);
});

test('the drone runs ahead and rams the car in front for significant damage', () => {
  const { sim, a, b } = setup(60);
  sim.step(FIRE);
  for (let i = 0; i < 120 * 4 && b.armor >= 200; i++) sim.step(IDLE);
  assert.ok(b.armor <= 200 - 35, `armour ${b.armor} after the ram`);
  assert.ok(sim.result().player.wrecked === false && a.weapons[0].ammo === 1, 'one drone spent, the player is unhurt');
});

test('the drone does not hit a car that is not in front of it', () => {
  const { sim, b } = setup(-60);       // the rival is behind the shooter: nothing to ram ahead
  sim.step(FIRE);
  for (let i = 0; i < 120 * 3; i++) sim.step(IDLE);
  assert.equal(b.armor, 200, 'a drone fired forward ignores a car behind');
});
