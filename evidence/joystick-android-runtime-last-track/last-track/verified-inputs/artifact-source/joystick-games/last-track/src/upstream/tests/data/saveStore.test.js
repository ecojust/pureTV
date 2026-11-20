import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveStore, defaultSave, normalizeSave, SAVE_KEY } from '../../src/data/saveStore.js';
import { createMemoryStorage } from '../../src/core/storage.js';

test('default, roundtrip, reset', () => {
  const st = createMemoryStorage();
  const store = createSaveStore(st);
  assert.deepEqual(store.load(), defaultSave());
  const s = { ...defaultSave(), cash: 1234, wins: 2, bestTimes: { strip: 99.5 } };
  store.save(s);
  assert.deepEqual(createSaveStore(st).load(), s);
  assert.deepEqual(store.reset(), defaultSave());
  assert.equal(st.getItem(SAVE_KEY), null);
});
test('corrupt / hostile data never throws', () => {
  const st = createMemoryStorage({ [SAVE_KEY]: '{not json' });
  assert.deepEqual(createSaveStore(st).load(), defaultSave());
  assert.equal(st.getItem(SAVE_KEY + '.corrupt'), '{not json');
  const n = normalizeSave({ cash: -5, carId: 'tank', upgrades: { armor: 9, engine: 'x' }, damage: 7,
    weapons: [{ id: 'rocket', ammo: 999 }, { id: 'rocket', ammo: 1 }, { id: 'bogus' }, { id: 'machinegun', ammo: 5 }],
    bestTimes: { strip: -1, mojave: '88' }, passedTracks: ['mojave', 'zzz'], wins: 'many' });
  assert.equal(n.cash, 0); assert.equal(n.carId, 'wasp'); assert.equal(n.upgrades.armor, 3); assert.equal(n.upgrades.engine, 0);
  assert.equal(n.damage, 1);
  assert.deepEqual(n.weapons, [{ id: 'rocket', ammo: 30 }]); // wasp: one slot only
  assert.deepEqual(n.bestTimes, { mojave: 88 });
  assert.deepEqual(n.passedTracks, ['mojave']);
  assert.equal(n.wins, 0);
  for (const bad of [null, 5, 'x', [], undefined]) assert.deepEqual(normalizeSave(bad), defaultSave());
});
