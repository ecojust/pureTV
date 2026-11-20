import { getCar } from '../../src/data/cars.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTING_CASH, prizeFor, killBonus, repairCost, purchaseUpgrade, purchaseWeapon, sellWeapon, buyAmmo, repairCar, chooseCar, applyRaceResult } from '../../src/data/economy.js';
import { defaultSave } from '../../src/data/saveStore.js';

test('prizes & bills', () => {
  assert.equal(STARTING_CASH, 5000);
  assert.equal(killBonus, 500);
  assert.equal(prizeFor(1, 5, 4000), 4000);
  assert.ok(prizeFor(1, 5, 4000) > prizeFor(2, 5, 4000));
  assert.equal(prizeFor(6, 5, 4000), 0);
  assert.equal(prizeFor(0, 5, 4000), 0);
  assert.equal(repairCost(0, 60), 0);
  assert.ok(repairCost(1, 60) > 0 && repairCost(0.5, 60) * 2 === repairCost(1, 60));
});
test('balance: first upgrade affordable from start, second within ~2 races', () => {
  let s = defaultSave();
  assert.equal(s.cash, 5000);
  s = purchaseUpgrade(s, 'engine').save; // 1200
  assert.equal(s.cash, 3800);
  // a 3rd-place finish on scrapyard still funds a level-2 upgrade soon
  assert.ok(prizeFor(3, 5, 4000) + s.cash >= 2800);
});
test('upgrades are immutable and bounded', () => {
  const s0 = defaultSave();
  const r = purchaseUpgrade(s0, 'armor');
  assert.ok(r.ok);
  assert.equal(s0.cash, 5000);
  assert.equal(r.save.upgrades.armor, 1);
  assert.equal(r.save.cash, 3800);
  let s = { ...s0, cash: 99999 };
  for (let i = 0; i < 3; i++) s = purchaseUpgrade(s, 'tyres').save;
  assert.equal(s.upgrades.tyres, 3);
  const over = purchaseUpgrade(s, 'tyres');
  assert.equal(over.ok, false); assert.equal(over.error, 'max-level');
  assert.equal(purchaseUpgrade({ ...s0, cash: 10 }, 'armor').error, 'insufficient-cash');
  assert.equal(purchaseUpgrade(s0, 'zzz').error, 'unknown-upgrade');
});
test('weapons, slots, ammo', () => {
  let s = defaultSave(); // wasp: 1 slot used by MG
  assert.equal(purchaseWeapon(s, 'rocket').error, 'no-slots');
  assert.equal(purchaseWeapon(s, 'machinegun').error, 'already-owned');
  const sold = sellWeapon(s, 'machinegun');
  assert.ok(sold.ok); assert.equal(sold.save.cash, 5400);
  s = purchaseWeapon(sold.save, 'rocket').save;
  assert.equal(s.cash, 5400 - 1800);
  assert.deepEqual(s.weapons, [{ id: 'rocket', ammo: 10 }]);
  const a = buyAmmo(s, 'rocket', 5);
  assert.equal(a.save.weapons[0].ammo, 15); assert.equal(a.save.cash, s.cash - 60);
  assert.equal(buyAmmo(s, 'rocket', 100).units, 20); // clamped to maxAmmo 30
  assert.equal(buyAmmo(a.save, 'caltrops', 1).error, 'not-owned');
  assert.equal(buyAmmo({ ...s, cash: 0 }, 'rocket', 1).error, 'insufficient-cash');
  const h = chooseCar(defaultSave(), 'hammer').save;
  assert.ok(purchaseWeapon({ ...h, cash: 20000 }, 'terminator').ok); // 1 + 2 = 3 slots
});
test('repair', () => {
  const s = { ...defaultSave(), damage: 0.5 };
  const r = repairCar(s);
  assert.ok(r.ok); assert.equal(r.save.damage, 0); assert.equal(r.save.cash, 5000 - repairCost(0.5, getCar('wasp').base.armor));
  assert.equal(repairCar(defaultSave()).error, 'nothing-to-repair');
  assert.equal(repairCar({ ...s, cash: 1 }).error, 'insufficient-cash');
});
test('applyRaceResult', () => {
  const res = (pos, kills, extra = {}) => ({ trackId: 'scrapyard', finishOrder: [1, 2, 3, 4, 5].map(() => ({})), player: { position: pos, time: 200, kills, damageFraction: 0.25, ammoLeft: [{ id: 'machinegun', ammo: 77 }], ...extra } });
  const s0 = defaultSave();
  const r = applyRaceResult(s0, res(1, 2));
  assert.equal(r.prize, 4000); assert.equal(r.killBonus, 1000);
  assert.equal(r.save.cash, 10000); assert.equal(r.save.damage, 0.25);
  assert.equal(r.save.wins, 1); assert.equal(r.save.races, 1); assert.equal(r.save.kills, 2);
  assert.deepEqual(r.save.passedTracks, ['scrapyard']); assert.equal(r.passedTrack, 'scrapyard');
  assert.equal(r.save.weapons[0].ammo, 77); assert.equal(r.save.bestTimes.scrapyard, 200);
  const r2 = applyRaceResult(s0, res(3, 0));
  assert.deepEqual(r2.save.passedTracks, ['scrapyard']); assert.equal(r2.save.wins, 0);
  assert.equal(applyRaceResult(s0, res(1, 5), { mode: 'practice' }).save, s0);
  assert.equal(s0.cash, 5000);
});

test('a track is passed by a top-three finish without a wreck; any other result leaves it unpassed', () => {
  const res = (pos, wrecked = false) => ({ trackId: 'strip', finishOrder: [1, 2, 3, 4, 5].map(() => ({})), player: { position: pos, time: 200, kills: 0, wrecked, damageFraction: 0, ammoLeft: [] } });
  const s0 = defaultSave();
  for (const pos of [1, 2, 3]) assert.equal(applyRaceResult(s0, res(pos)).passedTrack, 'strip', `position ${pos} passes`);
  assert.equal(applyRaceResult(s0, res(4)).passedTrack, null, 'fourth place does not pass');
  assert.equal(applyRaceResult(s0, res(2, true)).passedTrack, null, 'a wreck does not pass, even in the top three');
  assert.deepEqual(applyRaceResult(s0, res(2, true)).save.passedTracks, [], 'nothing is recorded');
  const passed = applyRaceResult(s0, res(1)).save;
  const again = applyRaceResult(passed, res(2));
  assert.equal(again.passedTrack, null, 'a track is passed once');
  assert.deepEqual(again.save.passedTracks, ['strip']);
});

test('every track can be raced: passing one does not unlock or lock the others', () => {
  const res = { trackId: 'strip', finishOrder: [1, 2, 3, 4, 5].map(() => ({})), player: { position: 1, time: 200, kills: 0, wrecked: false, damageFraction: 0, ammoLeft: [] } };
  const out = applyRaceResult(defaultSave(), res).save;
  assert.deepEqual(out.passedTracks, ['strip']);
  assert.equal(out.unlockedTracks, undefined, 'the unlock ladder is gone');
});
