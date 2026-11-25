import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE, COLOR, paletteHex } from '../../src/data/palette.js';
import { CARS, getCar } from '../../src/data/cars.js';
import { WEAPONS, getWeapon } from '../../src/data/weapons.js';
import { UPGRADES, getUpgrade, upgradeCost, applyUpgrades } from '../../src/data/upgrades.js';
import { DRIVERS, getDriver } from '../../src/data/drivers.js';
import { TRACKS, getTrack } from '../../src/data/tracks/index.js';

test('palette', () => {
  assert.equal(PALETTE.length, 16);
  assert.ok(PALETTE.every((h) => /^#[0-9a-f]{6}$/.test(h)));
  assert.equal(COLOR.red, 8);
  assert.equal(paletteHex(COLOR.sand), '#ffccaa');
});
test('cars/weapons/drivers consistent', () => {
  assert.deepEqual(CARS.map((c) => c.id), ['wasp', 'hammer', 'bulwark', 'gullwing', 'rhino']);
  assert.deepEqual(WEAPONS.map((w) => w.id), ['machinegun', 'rocket', 'guided', 'caltrops', 'terminator', 'mine', 'oil', 'flamethrower', 'ramplate']);
  assert.deepEqual(DRIVERS.map((d) => d.id), ['vex', 'rust', 'fuse', 'kane', 'grave', 'slick', 'cinder', 'dolores', 'glass', 'ruin', 'kit']);
  assert.equal(getCar('nope'), null);
  for (const c of CARS) for (const w of c.startWeapons) assert.ok(getWeapon(w.id) && w.ammo <= getWeapon(w.id).maxAmmo);
  for (const d of DRIVERS) {
    const car = getCar(d.carId);
    assert.ok(car);
    assert.ok(d.skill >= 0.6 && d.skill <= 1 && d.aggression >= 0 && d.aggression <= 1);
    assert.ok(d.loadout.some((w) => w.id === d.favoriteWeapon));
    const slots = d.loadout.reduce((n, w) => n + getWeapon(w.id).slot, 0);
    assert.ok(slots <= car.base.slots, `${d.id} slots`);
    for (const k of ['seed', 'skin', 'hair', 'accent']) assert.ok(Number.isInteger(d.portrait[k]));
    for (const c of [d.color, d.helmet, d.portrait.skin, d.portrait.hair, d.portrait.accent]) assert.ok(c >= 0 && c < 16);
  }
  assert.equal(new Set(DRIVERS.map((d) => d.favoriteWeapon)).size, WEAPONS.length, 'every weapon has a pilot who favours it');
  assert.equal(new Set(DRIVERS.map((d) => d.name)).size, DRIVERS.length);
  assert.equal(getWeapon('ramplate').kind, 'passive'); assert.equal(getWeapon('flamethrower').kind, 'flame');
  assert.equal(getWeapon('terminator').slot, 1, 'one slot: every car can carry it');
  assert.equal(getWeapon('terminator').price, 9000);
  assert.equal(getWeapon('terminator').homing, 2.6);
});
test('upgrades', () => {
  assert.deepEqual(UPGRADES.map((u) => u.id), ['armor', 'engine', 'tyres']);
  assert.deepEqual([1, 2, 3].map((l) => upgradeCost('armor', l)), [1200, 2800, 5500]);
  assert.equal(upgradeCost('armor', 4), null);
  assert.equal(getUpgrade('x'), null);
  const base = getCar('wasp').base;
  const s = applyUpgrades(base, { armor: 2, engine: 1, tyres: 3 });
  assert.equal(s.armor, base.armor * 1.5);
  assert.ok(Math.abs(s.maxSpeed - 62 * 1.08) < 1e-9);
  assert.ok(Math.abs(s.accel - 24 * 1.08) < 1e-9);
  assert.ok(Math.abs(s.grip - 1.3) < 1e-9 && Math.abs(s.turn - 1.3) < 1e-9);
  assert.deepEqual(applyUpgrades(base, {}).maxSpeed, base.maxSpeed);
});
test('tracks index', () => {
  assert.deepEqual(TRACKS.map((t) => t.id), ['scrapyard', 'strip', 'mojave', 'bayou', 'lakeshore', 'badlands', 'spillway', 'rustbelt', 'harbor', 'liberty']);
  assert.equal(getTrack('strip').city, 'Las Vegas');
  for (const t of TRACKS) {
    assert.ok(t.laps === 3 || (t.id === 'liberty' && t.laps === 4));
    assert.ok(t.prize > 0 && t.width >= 14 && t.width <= 18 && t.control.length >= 16);
    assert.ok(t.pickups.every((p) => p.s >= 0 && p.s < 1 && ['ammo', 'repair', 'cash'].includes(p.type)));
  }
});
test('track progression: prizes escalate, ids unique', () => {
  assert.equal(new Set(TRACKS.map((t) => t.id)).size, TRACKS.length);
  for (let i = 1; i < TRACKS.length; i++) assert.ok(TRACKS[i].prize > TRACKS[i - 1].prize);
  assert.equal(TRACKS[TRACKS.length - 1].id, 'liberty');
  assert.ok(TRACKS[TRACKS.length - 1].prize >= 40000 && TRACKS[3].prize >= 12000);
});
