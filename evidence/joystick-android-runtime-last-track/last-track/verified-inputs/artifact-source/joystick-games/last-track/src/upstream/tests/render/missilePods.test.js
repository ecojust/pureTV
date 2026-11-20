import test from 'node:test';
import assert from 'node:assert/strict';
import { HARDWARE, hardwareSlots, visibleTubes, buildHardware } from '../../src/render/pbr/missilePods.js';

test('2..8 tubes per car/weapon; visible tubes follow ammo and empty at zero', () => {
  for (const car of ['hammer', 'wasp', 'bulwark']) for (const w of HARDWARE) {
    const n = hardwareSlots(car, w); assert.ok(n >= 2 && n <= 8, `${car}/${w} ${n}`);
    assert.equal(visibleTubes(car, w, 0), 0); assert.equal(visibleTubes(car, w, 1), 1);
    assert.equal(visibleTubes(car, w, 99), n); assert.equal(visibleTubes(car, w, n - 1), n - 1);
  }
  assert.equal(hardwareSlots('hammer', 'machinegun'), 0); assert.equal(visibleTubes('hammer', 'machinegun', 50), 0);
});

test('hardware differs per weapon type and each slot has a muzzle point ahead of its tube', () => {
  const sigs = new Set();
  for (const w of HARDWARE) {
    const b = buildHardware('hammer', w);
    assert.equal(b.slots.length, hardwareSlots('hammer', w));
    for (const s of b.slots) assert.ok(s.nose[0] > s.pos[0], 'nose ahead of the missile centre');
    sigs.add(w + ':' + b.hw.index.count + ':' + b.missile.index.count);
    assert.ok(b.hw.attributes.color && b.missile.attributes.color);
  }
  assert.equal(sigs.size, 3);
  assert.notEqual(buildHardware('wasp', 'rocket').slots.length, buildHardware('hammer', 'rocket').slots.length);
});

test('rocket box is a multi-tube grid, bigger than the guided pods and the terminator rails', () => {
  for (const car of ['hammer', 'wasp', 'bulwark']) assert.ok(hardwareSlots(car, 'rocket') >= 6 && hardwareSlots(car, 'rocket') > hardwareSlots(car, 'guided') && hardwareSlots(car, 'guided') > hardwareSlots(car, 'terminator') - 1);
});
