import test from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';
import { pointInCarBox, BODY_HALF_LENGTH, BODY_HALF_WIDTH } from '../../src/sim/collisions.js';

const IDLE = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
const FIRE = { ...IDLE, fire: true };

test('the hit zone is the drawn body box: inside registers, just outside does not, and it turns with the car', () => {
  const car = { x: 10, y: 5, heading: 0 };
  assert.ok(pointInCarBox(car, 10 + BODY_HALF_LENGTH - 0.01, 5), 'nose');
  assert.ok(!pointInCarBox(car, 10 + BODY_HALF_LENGTH + 0.2, 5), 'past the nose');
  assert.ok(pointInCarBox(car, 10, 5 + BODY_HALF_WIDTH - 0.01), 'side');
  assert.ok(!pointInCarBox(car, 10, 5 + BODY_HALF_WIDTH + 0.2), 'past the side');
  const turned = { ...car, heading: Math.PI / 2 };             // nose now points along +y
  assert.ok(pointInCarBox(turned, 10, 5 + BODY_HALF_LENGTH - 0.01), 'turned nose');
  assert.ok(!pointInCarBox(turned, 10 + 3.19, 5 + 2.5), 'beside a turned car, where the nose used to point');
});

/** A rocket fired straight down the strip at a parked rival whose centre line is `lat` metres off the shooter's. */
function rocketAt(lat, { gap = 40, speed = 0, away = true, weapon = 'rocket' } = {}) {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0);
  place(sim, b, 400 + gap, lat, speed);
  if (!away && speed) { b.heading = Math.PI; b.vx = -speed; b.vy = 0; }
  b.aiControlled = false; b.armor = b.armorMax = 500;
  a.aiControlled = false;
  a.weapons = [{ id: weapon, ammo: 5 }]; a.cooldowns = [0]; a.activeWeapon = 0;
  let hit = false;
  sim.events.on('hit', (ev) => { if (ev.carId === b.id) hit = true; });
  sim.step(FIRE);
  for (let i = 0; i < 120 * 3 && !hit; i++) sim.step(IDLE);
  return hit;
}

test('a rocket registers on a parked car within the drawn width, and misses outside it', () => {
  assert.equal(rocketAt(1.5), true, 'inside the body');
  assert.equal(rocketAt(2.0), false, 'clear of the body');
});

test('a moving car is hit the same way, running away or head-on', () => {
  assert.equal(rocketAt(1.0, { speed: 40, away: true }), true, 'away at 40 m/s');
  assert.equal(rocketAt(1.0, { speed: 40, away: false }), true, 'head-on at 40 m/s');
  assert.equal(rocketAt(2.0, { speed: 40, away: false }), false, 'head-on, outside the body');
});
