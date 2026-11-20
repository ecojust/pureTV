import test from 'node:test';
import assert from 'node:assert/strict';
import { CARS, getCar } from '../../src/data/cars.js';
import { applyUpgrades } from '../../src/data/upgrades.js';
import { chooseCar } from '../../src/data/economy.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { STORY } from '../../src/data/story.js';

test('gullwing: three weapon slots, light and fast, with ram spikes fitted by default', () => {
  const g = getCar('gullwing');
  assert.equal(g.base.slots, 3);
  assert.ok(g.base.armor < getCar('hammer').base.armor, 'low armour');
  assert.ok(g.base.maxSpeed > getCar('hammer').base.maxSpeed, 'faster than the hammer');
  assert.deepEqual(g.defaultSpikes, { front: 1, rear: 1 });
});

test('rhino: heavy, slow, armoured, and the only car that keeps its line in the mud', () => {
  const r = getCar('rhino');
  assert.ok(r.base.mass > getCar('bulwark').base.mass, 'heavier than the bulwark');
  assert.ok(r.base.armor > getCar('bulwark').base.armor, 'more armour than the bulwark');
  assert.ok(r.base.maxSpeed < getCar('bulwark').base.maxSpeed, 'slower than the bulwark');
  assert.ok(r.base.offroad > 0.5 && r.base.offroad <= 1, 'offroad trait');
  for (const c of CARS) if (c.id !== 'rhino') assert.ok(!c.base.offroad, `${c.id} has no offroad trait`);
  assert.deepEqual(r.defaultSpikes, { front: 1, rear: 1 });
});

test('the offroad trait flows into the stats block the physics reads', () => {
  assert.equal(applyUpgrades(getCar('rhino').base).offroad, 0.85);
  assert.equal(applyUpgrades(getCar('hammer').base).offroad, undefined);
});

test('choosing a car that comes with ram spikes fits them; the other cars start bare', () => {
  assert.deepEqual(chooseCar(defaultSave(), 'gullwing').save.spikes, { front: 1, rear: 1, wheels: 0 });
  assert.deepEqual(chooseCar(defaultSave(), 'rhino').save.spikes, { front: 1, rear: 1, wheels: 0 });
  assert.deepEqual(chooseCar(defaultSave(), 'hammer').save.spikes, { front: 0, rear: 0, wheels: 0 });
});

test('the new pilots race the new cars and the field has all five cars represented', () => {
  const drivers = Object.fromEntries(DRIVERS.map((d) => [d.id, d]));
  assert.equal(drivers.glass.carId, 'gullwing');
  assert.equal(drivers.ruin.carId, 'rhino');
  assert.equal(drivers.kit.carId, 'wasp');
  assert.equal(new Set(DRIVERS.map((d) => d.carId)).size, CARS.length);
});

test('the story: a premise and four chapters, each with text', () => {
  assert.ok(STORY.premise.length > 40 && STORY.premise.length < 200, 'a short premise');
  assert.equal(STORY.chapters.length, 4);
  for (const c of STORY.chapters) assert.ok(c.heading && c.text.length > 60, c.heading);
});
