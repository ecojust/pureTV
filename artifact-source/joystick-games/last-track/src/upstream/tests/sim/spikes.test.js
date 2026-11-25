import test from 'node:test';
import assert from 'node:assert/strict';
import { SPIKES, SPIKE_TIERS, MAX_PROTECT, spikeDamage, spikeProtection, contactZone, normalizeSpikes, spikeCost, spikesValue } from '../../src/data/spikes.js';
import { purchaseSpikes, chooseCar, STARTING_CASH } from '../../src/data/economy.js';
import { defaultSave, normalizeSave } from '../../src/data/saveStore.js';
import { WEAPONS } from '../../src/data/weapons.js';
import { feedLine } from '../../src/ui/hud.js';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';

test('spike prices: rear < front < wheels, tier 2 costs more and is stronger; all below the top weapon', () => {
  const p = (id, t) => spikeCost(id, t);
  assert.ok(p('rear', 1) < p('front', 1) && p('front', 1) < p('wheels', 1));
  for (const s of SPIKES) { assert.ok(s.tiers[1].price > s.tiers[0].price && s.tiers[1].dealt > s.tiers[0].dealt && s.tiers[1].taken > s.tiers[0].taken); for (const t of s.tiers) assert.ok(t.taken <= MAX_PROTECT && t.taken > 0); }
  assert.ok(spikesValue({ front: 2, rear: 2, wheels: 2 }) > spikesValue({ front: 1 }));
  assert.equal(spikeCost('front', 3), null); assert.equal(spikeCost('nope', 1), null);
  assert.ok(Math.max(...WEAPONS.map((w) => w.price)) >= p('wheels', 1));
});

test('contact zone: front / rear / side from the owner frame', () => {
  const a = { x: 0, y: 0, heading: 0 };
  assert.equal(contactZone(a, 5, 0.5), 'front'); assert.equal(contactZone(a, -5, 0.5), 'rear');
  assert.equal(contactZone(a, 0.5, 4), 'side'); assert.equal(contactZone(a, 0.5, -4), 'side');
  const b = { x: 0, y: 0, heading: Math.PI / 2 };
  assert.equal(contactZone(b, 0, 5), 'front');
});

test('spike damage scales with closing speed and tier, matches the side, and is zero below the threshold', () => {
  const s1 = { front: 1, rear: 0, wheels: 0 }, s2 = { front: 2, rear: 0, wheels: 0 };
  assert.equal(spikeDamage(s1, 'front', 2), 0); assert.equal(spikeDamage(null, 'front', 20), 0);
  assert.equal(spikeDamage(s1, 'rear', 20), 0, 'front spikes do nothing on a rear contact');
  assert.equal(spikeDamage(s1, 'side', 20), 0);
  assert.ok(spikeDamage(s1, 'front', 12) > spikeDamage(s1, 'front', 6));
  assert.ok(spikeDamage(s2, 'front', 12) > spikeDamage(s1, 'front', 12) * 1.8);
  assert.ok(spikeDamage({ wheels: 1 }, 'side', 10) > 0);
  assert.ok(spikeDamage(s1, 'front', 10, 1.2) > spikeDamage(s1, 'front', 10, 0.8));
});

test('protection: 30-60% less ram damage on the matching side, never immune', () => {
  const full = { front: 2, rear: 2, wheels: 2 };
  assert.equal(spikeProtection(null, 'front'), 1); assert.equal(spikeProtection({ front: 1 }, 'rear'), 1);
  assert.ok(spikeProtection({ front: 1 }, 'front') <= 0.7 + 1e-9 && spikeProtection({ front: 2 }, 'front') >= 1 - MAX_PROTECT - 1e-9);
  for (const z of ['front', 'rear', 'side']) assert.ok(spikeProtection(full, z) > 0.39 && spikeProtection(full, z) < 1);
});

test('purchase: tiers in order, cash deducted, max level, insufficient cash; unaffected otherwise', () => {
  let s = { ...defaultSave(), cash: 10000 };
  let r = purchaseSpikes(s, 'front'); assert.ok(r.ok); assert.equal(r.save.spikes.front, 1); assert.equal(r.save.cash, 10000 - spikeCost('front', 1));
  r = purchaseSpikes(r.save, 'front'); assert.equal(r.save.spikes.front, 2);
  assert.equal(purchaseSpikes(r.save, 'front').error, 'max-level');
  assert.equal(purchaseSpikes({ ...defaultSave(), cash: 10 }, 'rear').error, 'insufficient-cash');
  assert.equal(purchaseSpikes(s, 'x').error, 'unknown-spikes');
  assert.equal(s.spikes.front, 0, 'input save untouched');
  assert.deepEqual(chooseCar(r.save, 'wasp').save.spikes, { front: 0, rear: 0, wheels: 0 });
  assert.equal(STARTING_CASH, defaultSave().cash);
});

test('save migration: old saves get no spikes; junk clamps; round-trips', () => {
  const old = { cash: 1234, carId: 'hammer' };
  assert.deepEqual(normalizeSave(old).spikes, { front: 0, rear: 0, wheels: 0 });
  assert.deepEqual(normalizeSave({ spikes: { front: 9, rear: -3, wheels: '1', x: 5 } }).spikes, { front: SPIKE_TIERS, rear: 0, wheels: 1 });
  assert.deepEqual(normalizeSave({ spikes: 'bad' }).spikes, { front: 0, rear: 0, wheels: 0 });
  const s = normalizeSave({ spikes: { front: 1, rear: 2, wheels: 0 } });
  assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(s))).spikes, s.spikes);
  assert.deepEqual(normalizeSpikes(null), { front: 0, rear: 0, wheels: 0 });
});

function ramDuel(spikesA, spikesB, gap = 14, speed = 30) {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  a.aiControlled = b.aiControlled = false;
  place(sim, a, 400, 0, speed); place(sim, b, 400 + gap, 0, 0);
  a.spikes = spikesA; b.spikes = spikesB;
  const hits = [], sp = [];
  sim.events.on('hit', (e) => hits.push(e)); sim.events.on('spikeHit', (e) => sp.push(e));
  for (let i = 0; i < 240; i++) { a.vx = Math.cos(a.heading) * speed; a.vy = Math.sin(a.heading) * speed; b.vx = b.vy = 0; sim.step({ throttle: 0, brake: 0, steer: 0, fire: false }); if (hits.length) break; }
  return { sim, a, b, hits, sp };
}

test('sim: front spikes deal extra credited damage on a head-on ram, spark event fires, and protect the owner', () => {
  const plain = ramDuel(null, null);
  const spiked = ramDuel({ front: 2, rear: 0, wheels: 0 }, null);
  const dmgTo = (r, id) => r.hits.filter((h) => h.carId === id).reduce((n, h) => n + h.dmg, 0);
  assert.ok(plain.hits.length >= 1 && plain.sp.length === 0);
  assert.ok(spiked.sp.length >= 1 && spiked.sp[0].byId === 0 && spiked.sp[0].zone === 'front');
  assert.ok(dmgTo(spiked, 1) > dmgTo(plain, 1) * 1.3, `${dmgTo(spiked, 1)} vs ${dmgTo(plain, 1)}`);
  assert.ok(spiked.hits.some((h) => h.weaponId === 'spikes' && h.byId === 0), 'spike damage is attributed to the spiked car');
  const owner = ramDuel({ front: 2, rear: 0, wheels: 0 }, null), bare = ramDuel(null, null);
  assert.ok(dmgTo(owner, 0) < dmgTo(bare, 0) && dmgTo(owner, 0) > 0, 'owner takes less ram damage but not zero');
});

test('sim: spikes on the wrong side do nothing; rear spikes bite a car that ramps into the tail', () => {
  const wrong = ramDuel({ front: 0, rear: 2, wheels: 2 }, null);
  assert.equal(wrong.sp.filter((e) => e.byId === 0).length, 0);
  const tail = ramDuel(null, { front: 0, rear: 2, wheels: 0 });   // victim's rear is struck by A's nose
  assert.ok(tail.sp.some((e) => e.byId === 1 && e.zone === 'rear' && e.carId === 0), 'B rear spikes bite A');
});

test('kill feed credits spikes', () => {
  const names = ['YOU', 'Vex'];
  assert.equal(feedLine({ type: 'wreck', carId: 1, byId: 0, weaponId: 'spikes' }, names), 'YOU ✕ Vex · SPIKES');
});

test('roster spike label and rivals: ram-focused drivers carry spikes, others few', async () => {
  const { spikeLabel } = await import('../../src/ui/screens/roster.js');
  const { DRIVERS } = await import('../../src/data/drivers.js');
  const dol = DRIVERS.find((d) => d.id === 'dolores'), vex = DRIVERS.find((d) => d.id === 'vex');
  assert.equal(spikeLabel(dol), 'SPIKES F2 R2 W1'); assert.equal(spikeLabel(vex), '');
  const full = DRIVERS.filter((d) => { const s = normalizeSpikes(d.spikes); return s.front && s.rear && s.wheels; }).map((d) => d.id);
  assert.ok(full.includes('dolores') && full.includes('kane'));
});
