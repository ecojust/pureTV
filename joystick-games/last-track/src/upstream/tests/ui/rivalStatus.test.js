import test from 'node:test';
import assert from 'node:assert/strict';
import { rivalHealth } from '../../src/ui/hud.js';

test('rival status: armour fraction, with FIN and OUT labels', () => {
  assert.deepEqual(rivalHealth({ armor: 30, armorMax: 60 }), { pct: 0.5, label: '50%' });
  assert.deepEqual(rivalHealth({ armor: 0, armorMax: 60, wrecked: true }), { pct: 0, label: 'OUT' });
  assert.equal(rivalHealth({ armor: 20, armorMax: 60, finished: true }).label, 'FIN', 'finished beats low armour');
  assert.equal(rivalHealth({ armor: 90, armorMax: 60 }).pct, 1, 'clamped to full');
  assert.equal(rivalHealth({ armor: 0, armorMax: 0 }).pct, 0, 'no armour max gives an empty bar');
});
