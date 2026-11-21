import assert from 'node:assert/strict';
import test from 'node:test';
import { freshCarry, encodePassword, decodePassword } from '../src/campaign.js';
import { newRun } from '../src/core.js';

test('a mission password restores the pilot and loadout after TV restart', () => {
  const carry = { ...freshCarry('hard'), lives: 2, bombs: 1, laser: 2, max140: true, score: 3000 };
  const password = encodePassword(1, carry);
  assert.deepEqual(decodePassword(password.toLowerCase()), { stage: 1, carry });
  assert.equal(decodePassword(password.slice(0, -1)), null);
});

test('a fresh sortie has its own weapon counters', () => {
  const old = newRun('normal');
  old.bombs--; old.shots++;
  const fresh = newRun('normal');
  assert.equal(fresh.bombs, 3);
  assert.equal(fresh.shots, 0);
});
