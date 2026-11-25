import test from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';
import { initWeapons } from '../../src/sim/weapons.js';
import { findLockTarget, updateLock, launchTarget } from '../../src/sim/lockOn.js';
import { getWeapon, WEAPONS } from '../../src/data/weapons.js';

const NO = { throttle: 0, brake: 0, steer: 0, fire: false };
const FIRE = { ...NO, fire: true };
function duel() {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0);
  place(sim, b, 460, 0, 0);
  b.aiControlled = false;
  initWeapons(a, [{ id: 'guided', ammo: 4 }]);
  return { sim, a, b };
}

test('guided: priced between rocket and terminator, one slot, blast + strong homing', () => {
  const g = getWeapon('guided'), r = getWeapon('rocket'), t = getWeapon('terminator');
  assert.ok(g.price > r.price && g.price < t.price);
  assert.ok(r.damage < g.damage && g.damage < t.damage && r.radius < g.radius, 'rocket < guided in damage and blast; the terminator rams instead of blasting');
  assert.ok(r.maxAmmo > g.maxAmmo && g.maxAmmo > t.maxAmmo, 'premium weapons carry fewer shots');
  assert.equal(g.slot, 1); assert.equal(g.kind, 'projectile');
  assert.ok(g.homing > r.homing && g.homing > t.homing && g.radius > r.radius * 1.1);
  assert.ok(g.damage >= r.damage && g.damage <= t.damage + 4 && g.maxAmmo <= 12);
  assert.equal(new Set(WEAPONS.map((w) => w.id)).size, WEAPONS.length);
});

test('lock-on: finds the best target in the cone, ignores wrecks/outside range/outside cone', () => {
  const car = { x: 0, y: 0, heading: 0 };
  const cars = [car, { x: 50, y: 30, heading: 0 }, { x: 80, y: 4, heading: 0 }, { x: 40, y: 0, wrecked: true }, { x: 400, y: 0 }, { x: -50, y: 0 }];
  const f = findLockTarget(car, cars, 0.38, 170);
  assert.equal(f.car, cars[2]);
  assert.equal(findLockTarget(car, [car, cars[4], cars[5]], 0.38, 170), null);
});

test('lock-on: progress builds over lockTime and resets when the target leaves the cone', () => {
  const def = getWeapon('guided');
  const car = { x: 0, y: 0, heading: 0 }, t = { x: 90, y: 2 };
  let lk = updateLock(car, [car, t], def, 0.1);
  assert.equal(lk.target, t); assert.equal(lk.locked, false);
  for (let i = 0; i < 6; i++) lk = updateLock(car, [car, t], def, 0.1);
  assert.equal(lk.locked, true);
  t.y = 90; lk = updateLock(car, [car, t], def, 0.1);
  assert.equal(lk.locked, false); assert.equal(lk.target, null);
  assert.equal(updateLock(car, [car, t], { id: 'rocket' }, 0.1).target, null);
});

test('launchTarget: locked target wins; otherwise nearest ahead in a wide cone', () => {
  const def = getWeapon('guided');
  const car = { x: 0, y: 0, heading: 0, lock: { target: null, t: 0, locked: false } };
  const near = { x: 60, y: 30 }, far = { x: 120, y: 2 };
  assert.equal(launchTarget(car, [car, near, far], def), far);   // smallest angular error preferred
  car.lock = { target: near, t: 1, locked: true };
  assert.equal(launchTarget(car, [car, near, far], def), near);
  assert.equal(launchTarget({ ...car, lock: null }, [car, { x: -40, y: 0 }], def), null);
});

test('guided missile in the sim: acquires, snapshot exposes the lock, steers into a target that moves off-axis and blasts it', () => {
  const { sim, a, b } = duel();
  let sawLock = false;
  for (let i = 0; i < 90; i++) { sim.step(NO); const s = sim.snapshot(); if (s.cars[0].lock && s.cars[0].lock.locked) sawLock = true; }
  assert.ok(sawLock, 'lock acquired within a second');
  const armor0 = b.armor;
  const booms = [];
  sim.events.on('explosion', (e) => booms.push(e));
  sim.step(FIRE);
  assert.equal(a.weapons[0].ammo, 3);
  let snap = sim.snapshot();
  assert.equal(snap.projectiles.length, 1);
  assert.equal(snap.projectiles[0].type, 'guided'); assert.equal(snap.projectiles[0].targetId, b.id);
  // the target dodges sideways: an unguided rocket would miss
  for (let i = 0; i < 360 && !booms.length; i++) { b.y = Math.min(b.y + 0.02, 7); b.vx = b.vy = 0; sim.step(NO); }
  assert.ok(booms.length >= 1, 'exploded');
  assert.ok(b.armor < armor0 - 8, `damage ${armor0 - b.armor}`);
});

test('guided missile is deterministic', () => {
  const run = () => {
    const { sim, b } = duel();
    for (let i = 0; i < 60; i++) sim.step(NO);
    sim.step(FIRE);
    for (let i = 0; i < 240; i++) { b.y = Math.min(b.y + 0.02, 7); b.vx = b.vy = 0; sim.step(NO); }
    const p = sim.snapshot().projectiles[0];
    return JSON.stringify([b.armor, p ? [p.x, p.y, p.heading] : null]);
  };
  assert.equal(run(), run());
});
