import { getCar } from '../../src/data/cars.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceConfig, fieldFor, tracksFor, DRIVERS_BY_DIFFICULTY } from '../../src/data/raceConfig.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { chooseCar, purchaseUpgrade } from '../../src/data/economy.js';

test('race config', () => {
  let s = chooseCar(defaultSave(), 'hammer').save;
  s = purchaseUpgrade(s, 'engine').save;
  s = { ...s, damage: 0.5 };
  const c = createRaceConfig({ mode: 'race', trackId: 'strip', save: s });
  assert.equal(c.mode, 'race'); assert.equal(c.trackId, 'strip'); assert.equal(c.laps, 3);
  assert.equal(c.player.carId, 'hammer');
  assert.ok(Math.abs(c.player.stats.maxSpeed - 56 * 1.08) < 1e-9);
  assert.equal(c.player.armor, Math.round(getCar('hammer').base.armor * 0.5));
  assert.deepEqual(c.rivals.map((r) => r.driverId), fieldFor('strip', 1));
  for (const r of c.rivals) assert.ok(r.stats.maxSpeed > 0 && r.loadout.length && r.skill && r.favoriteWeapon);
  assert.deepEqual(createRaceConfig({ mode: 'race', trackId: 'strip', save: s }), c); // deterministic
  assert.equal(createRaceConfig({ trackId: 'strip', save: s, laps: 5 }).laps, 5);
});
test('practice', () => {
  const s = { ...defaultSave(), damage: 0.9 };
  const c = createRaceConfig({ mode: 'practice', trackId: 'mojave', save: s });
  assert.equal(c.rivals.length, 0);
  assert.equal(c.player.armor, c.player.stats.armor);
  assert.deepEqual(createRaceConfig({ mode: 'practice', trackId: 'mojave', save: s, rivalIds: ['kane'] }).rivals.map((r) => r.driverId), ['kane']);
});

test('fieldFor: 4 distinct rivals per track, harder on later tracks, every driver races somewhere', () => {
  const diff = (id) => DRIVERS_BY_DIFFICULTY.indexOf(DRIVERS.find((d) => d.id === id));
  let prev = -1;
  TRACKS.forEach((t, i) => {
    const f = fieldFor(t.id, i);
    assert.equal(f.length, 4); assert.equal(new Set(f).size, 4);
    assert.deepEqual(fieldFor(t.id, i), f);
    const avg = f.reduce((n, id) => n + diff(id), 0) / 4;
    assert.ok(avg >= prev, `${t.id} not easier than previous`); prev = avg;
  });
  assert.equal(DRIVERS.length, 11);
  assert.deepEqual(new Set(TRACKS.flatMap((t, i) => fieldFor(t.id, i))), new Set(DRIVERS.map((d) => d.id)));
  for (const d of DRIVERS) assert.ok(tracksFor(d.id).length >= 1, d.id);
  assert.ok(fieldFor('x', 0).includes('rust') && fieldFor('x', TRACKS.length - 1).includes('kane'));
});
