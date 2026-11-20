import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseWeapon, sellWeapon } from '../../src/data/economy.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { getWeapon } from '../../src/data/weapons.js';

const rich = (carId, weapons) => ({ ...defaultSave(), carId, cash: 1_000_000, ...(weapons ? { weapons } : {}) });

test('terminator: expensive, one slot, and every car can fit it once its slot is free', () => {
  const t = getWeapon('terminator'), g = getWeapon('guided');
  assert.ok(t.price >= 9000 && t.price > g.price * 2, `price ${t.price}`);
  assert.equal(t.slot, 1);
  for (const carId of ['wasp', 'hammer', 'bulwark']) {
    assert.equal(purchaseWeapon(rich(carId, []), 'terminator').ok, true, `${carId} fits a terminator into a free slot`);
  }
});

test('terminator: only one fits per car, and the wasp (one slot) must sell its machinegun first', () => {
  const full = rich('wasp');                                    // the wasp starts with its machinegun in its only slot
  assert.equal(purchaseWeapon(full, 'terminator').error, 'no-slots');
  const sold = sellWeapon(full, 'machinegun').save;
  assert.equal(purchaseWeapon(sold, 'terminator').ok, true, 'a freed slot takes the terminator');
  const owned = rich('hammer', [{ id: 'terminator', ammo: 1 }]);
  assert.equal(purchaseWeapon(owned, 'terminator').error, 'already-owned', 'a second terminator never fits');
});
