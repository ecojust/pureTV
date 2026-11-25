import test from 'node:test';
import assert from 'node:assert/strict';
import { spikeLayout, wheelSpikeLayout, buildZoneSpikes, buildWheelSpikes, SPIKE_LEN } from '../../src/render/pbr/spikeGear.js';

test('spike layout: counts per car, longer at tier 2, empty at tier 0, front spikes point forward and rear spikes back', () => {
  for (const car of ['hammer', 'wasp', 'bulwark']) {
    assert.equal(spikeLayout(car, 'front', 0).length, 0);
    const f1 = spikeLayout(car, 'front', 1), f2 = spikeLayout(car, 'front', 2), r1 = spikeLayout(car, 'rear', 1);
    assert.ok(f1.length >= 5 && f1.length === f2.length && r1.length >= 5);
    assert.ok(f2[0].len > f1[0].len && SPIKE_LEN[2] > SPIKE_LEN[1]);
    assert.ok(f1.every((s) => s.d[0] > 0.8) && r1.every((s) => s.d[0] < -0.8));
    assert.ok(f1.some((s) => s.p[2] < 0) && f1.some((s) => s.p[2] > 0), 'spread across the width');
  }
  assert.ok(spikeLayout('bulwark', 'front', 1).length > spikeLayout('wasp', 'front', 1).length);
});

test('wheel hubs: centre spike + 6 studs, longer at tier 2', () => {
  assert.equal(wheelSpikeLayout(0).length, 0);
  assert.equal(wheelSpikeLayout(1).length, 7);
  assert.ok(wheelSpikeLayout(2)[0].len > wheelSpikeLayout(1)[0].len);
});

test('geometry: steel always, glowing tips only at tier 2, nothing at tier 0', () => {
  assert.equal(buildZoneSpikes('hammer', 'front', 0).steel, null);
  const a = buildZoneSpikes('hammer', 'front', 1), b = buildZoneSpikes('wasp', 'rear', 2);
  assert.ok(a.steel && a.tip === null); assert.ok(b.steel && b.tip);
  assert.ok(a.steel.index.count > 100 && a.steel.attributes.position.count > 0);
  const w1 = buildWheelSpikes(1), w2 = buildWheelSpikes(2);
  assert.ok(w1.steel && !w1.tip && w2.steel && w2.tip);
  assert.equal(buildWheelSpikes(0).steel, null);
});
