import test from 'node:test';
import assert from 'node:assert/strict';
import { weaponSpec } from '../../src/ui/screens/shop.js';
import { WEAPONS } from '../../src/data/weapons.js';

test('armory describes every weapon with slot count', () => {
  assert.equal(WEAPONS.length, 9);
  for (const w of WEAPONS) assert.match(weaponSpec(w), new RegExp(`slots ${w.slot}`));
  assert.match(weaponSpec(WEAPONS.find((w) => w.id === 'ramplate')), /no ammo/);
  assert.match(weaponSpec(WEAPONS.find((w) => w.id === 'flamethrower')), /burns ammo fast/);
});
