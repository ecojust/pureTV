import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTS, ACCENTS, DEFAULT_PAINT, getPaint, playerLivery, resolveFieldLiveries } from '../../src/data/liveries.js';
import { DECALS, ZONES, MAX_DECALS, getDecal, normalizePlacement, normalizePlacements, defaultPlacement } from '../../src/data/decals.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { defaultSave, normalizeSave, createSaveStore } from '../../src/data/saveStore.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { setPaint, setAccent, setNumber, purchaseDecal, placeDecal, updateDecal, removeDecal } from '../../src/data/economy.js';
import { createGameConfig } from '../../src/data/sliceConfig.js';
import { createRaceSim } from '../../src/sim/raceSim.js';
import { composeBodyDecals, composeRoofDecals, drawDecal, DECAL_DRAWERS, frameTransform } from '../../src/render/decalArt.js';
import { zoneFrames } from '../../src/render/pbr/carBody.js';
import { CARS } from '../../src/data/cars.js';

const rich = (extra = {}) => ({ ...defaultSave(), cash: 100000, carId: 'hammer', ...extra });

test('paint presets: 12 distinct, modern set with PBR finishes; accents; stock paint per car', () => {
  assert.equal(PAINTS.length, 12); assert.equal(new Set(PAINTS.map((p) => p.id)).size, 12); assert.equal(new Set(PAINTS.map((p) => p.hex)).size, 12);
  for (const id of ['pearl-white', 'midnight-blue', 'signal-red', 'electric-cyan', 'acid-green', 'solar-orange', 'magenta', 'graphite', 'gold', 'violet', 'stealth-black', 'chrome']) assert.ok(getPaint(id), id);
  assert.ok(getPaint('chrome').finish.metalness === 1 && getPaint('chrome').finish.roughness < 0.1 && getPaint('stealth-black').finish.roughness > 0.4);
  assert.ok(ACCENTS.length >= 6); for (const c of CARS) assert.ok(getPaint(DEFAULT_PAINT[c.id]), c.id);
  assert.equal(playerLivery({ ...defaultSave(), carId: 'wasp' }).paint, 'signal-red');
  assert.equal(playerLivery({ ...defaultSave(), carId: 'wasp', paint: 'violet' }).paint, 'violet');
});

test('rivals: 11 fixed, distinct primary liveries (paint + accent + number + decals) with a secondary', () => {
  assert.equal(DRIVERS.length, 11);
  const prim = DRIVERS.map((d) => d.liveries[0]);
  assert.equal(new Set(prim.map((l) => l.paint)).size, 11, 'primary paints are all different');
  for (const d of DRIVERS) {
    assert.equal(d.liveries.length, 2); assert.notEqual(d.liveries[0].paint, d.liveries[1].paint);
    for (const l of d.liveries) { assert.ok(getPaint(l.paint) && ACCENTS.some((a) => a.id === l.accent) && /^\d{1,2}$/.test(l.number)); assert.ok(l.decals.length >= 1 && l.decals.length <= MAX_DECALS); for (const x of l.decals) assert.ok(normalizePlacement(x), `${d.id} ${x.id}`); }
  }
  assert.equal(new Set(prim.map((l) => l.number)).size, 11, 'distinct numbers');
  assert.ok(DRIVERS.find((d) => d.id === 'vex').liveries[0].decals.some((x) => x.id === 'skull') && DRIVERS.find((d) => d.id === 'kane').liveries[0].decals.some((x) => x.id === 'bolt'));
});

test('field colour assignment: no two cars share a paint, including the player; clash -> secondary livery; then any free preset', () => {
  const six = DRIVERS.slice(0, 5);
  // no clash
  let r = resolveFieldLiveries(six, 'chrome');
  assert.deepEqual(r.map((x) => x.paint), six.map((d) => d.liveries[0].paint)); assert.ok(r.every((x) => !x.usedSecondary && !x.fallback));
  // player picks Vex's primary -> Vex switches to its secondary livery (and takes that livery's decals / accent / number)
  r = resolveFieldLiveries(six, 'solar-orange');
  const vex = r.find((x) => x.driverId === 'vex'); assert.equal(vex.paint, 'acid-green'); assert.equal(vex.usedSecondary, true); assert.equal(vex.fallback, false);
  assert.equal(vex.accent, DRIVERS[0].liveries[1].accent); assert.deepEqual(vex.decals.map((d) => d.tint), DRIVERS[0].liveries[1].decals.map((d) => d.tint));
  for (const [pid, field] of [['violet', DRIVERS], ['gold', DRIVERS.slice(2)], ['acid-green', DRIVERS.slice(0, 5)]]) {
    const out = resolveFieldLiveries(field, pid), all = [pid, ...out.map((x) => x.paint)];
    assert.equal(new Set(all).size, all.length, `unique paints with player ${pid}`);
  }
  // both livery paints taken (player took the secondary, another rival took... force it) -> falls back to a free preset
  const rigged = [{ id: 'a', liveries: [{ paint: 'gold', accent: 'cyan', number: '1', decals: [] }, { paint: 'chrome', accent: 'cyan', number: '1', decals: [] }] }, { id: 'b', liveries: [{ paint: 'gold', accent: 'red', number: '2', decals: [] }, { paint: 'chrome', accent: 'red', number: '2', decals: [] }] }, { id: 'c', liveries: [{ paint: 'gold', accent: 'amber', number: '3', decals: [] }, { paint: 'chrome', accent: 'amber', number: '3', decals: [] }] }];
  const rr = resolveFieldLiveries(rigged, 'pearl-white');
  assert.deepEqual(rr.map((x) => x.paint).slice(0, 2), ['gold', 'chrome']); assert.equal(rr[2].fallback, true); assert.equal(new Set(['pearl-white', ...rr.map((x) => x.paint)]).size, 4);
  // over many seeds, in real configs, every paint in the 6-car field is unique
  for (let seed = 1; seed <= 60; seed++) for (const car of ['wasp', 'hammer', 'bulwark']) {
    const paint = PAINTS[(seed * 5 + car.length) % 12].id, cfg = createGameConfig({ trackId: 'neonloop', save: rich({ carId: car, paint }), seed });
    const paints = [cfg.player.livery.paint, ...cfg.rivals.map((x) => x.livery.paint)];
    assert.equal(paints.length, 6); assert.equal(new Set(paints).size, 6, `seed ${seed} ${car} ${paint}: ${paints}`);
    assert.equal(cfg.player.livery.paint, paint);
  }
});

test('race sim carries liveries into the snapshot (player + rivals) for standings / 3D', () => {
  const cfg = createGameConfig({ trackId: 'neonloop', save: rich({ paint: 'violet', accent: 'lime', number: '42', decalsOwned: ['skull'], decals: [{ id: 'skull', zone: 'hood', tint: 'pearl-white', scale: 1, rot: 0, mirror: false }] }), seed: 9 });
  const snap = createRaceSim(cfg, {}).snapshot();
  assert.equal(snap.cars[0].livery.paint, 'violet'); assert.equal(snap.cars[0].livery.number, '42'); assert.equal(snap.cars[0].livery.decals[0].id, 'skull');
  assert.ok(snap.cars.slice(1).every((c) => c.livery && c.livery.paintHex > 0 && c.livery.decals.length >= 1));
});

test('decal catalogue: 15-20 designs, tiered prices $300-$2500, all drawable', () => {
  assert.ok(DECALS.length >= 15 && DECALS.length <= 20); assert.ok(DECALS.every((d) => d.price >= 300 && d.price <= 2500));
  for (const need of ['skull', 'bolt', 'flames', 'flaming-skull', 'wings', 'pistons', 'snake', 'claws', 'tribal', 'racing-stripes', 'checker', 'shark', 'radiation', 'crown', 'star', 'eye', 'barcode', 'plate']) assert.ok(getDecal(need), need);
  assert.equal(Object.keys(DECAL_DRAWERS).length, DECALS.length); assert.equal(new Set(DECALS.map((d) => d.id)).size, DECALS.length);
  assert.deepEqual(ZONES, ['hood', 'doorL', 'doorR', 'roof', 'trunk']);
});

test('economy: purchaseDecal, placement limits, update/remove are free, cosmetics setters validate', () => {
  let s = { ...defaultSave(), cash: 1000 };
  assert.equal(purchaseDecal(s, 'nope').error, 'unknown-decal'); assert.equal(purchaseDecal(s, 'flaming-skull').error, 'insufficient-cash');
  let r = purchaseDecal(s, 'skull'); assert.equal(r.ok, false); r = purchaseDecal(s, 'bolt'); assert.ok(r.ok); assert.equal(r.save.cash, 400); assert.deepEqual(r.save.decalsOwned, ['bolt']); s = r.save;
  assert.equal(purchaseDecal(s, 'bolt').error, 'already-owned');
  assert.equal(placeDecal(s, defaultPlacement('star', 'hood')).error, 'not-owned'); assert.equal(placeDecal(s, { id: 'bolt', zone: 'wing' }).error, 'bad-decal');
  s = placeDecal(s, defaultPlacement('bolt', 'doorL', 'violet')).save; assert.equal(s.decals.length, 1); assert.equal(s.cash, 400, 'placing is free');
  s = updateDecal(s, 0, { scale: 9, rot: 270, mirror: true, zone: 'roof' }).save; assert.deepEqual([s.decals[0].scale, s.decals[0].rot, s.decals[0].mirror, s.decals[0].zone], [2.2, -90, true, 'roof']);
  assert.equal(updateDecal(s, 3, {}).error, 'no-such-decal'); assert.equal(updateDecal(s, 0, { zone: 'x' }).error, 'bad-decal');
  for (let i = 0; i < MAX_DECALS - 1; i++) s = placeDecal(s, defaultPlacement('bolt', 'hood')).save;
  assert.equal(s.decals.length, MAX_DECALS); assert.equal(placeDecal(s, defaultPlacement('bolt', 'trunk')).error, 'decal-limit');
  const cash = s.cash; s = removeDecal(s, 0).save; assert.equal(s.decals.length, MAX_DECALS - 1); assert.equal(s.cash, cash, 'removing is free'); assert.equal(removeDecal(s, 99).error, 'no-such-decal');
  assert.ok(setPaint(s, 'chrome').ok && setPaint(s, 'x').error === 'unknown-paint' && setAccent(s, 'lime').ok && setAccent(s, 'x').error === 'unknown-accent');
  assert.equal(setNumber(s, '7').save.number, '7'); assert.equal(setNumber(s, '').save.number, ''); assert.equal(setNumber(s, '123').error, 'bad-number'); assert.equal(setNumber(s, 'ab').error, 'bad-number');
  assert.equal(setPaint(s, 'chrome').save.decals.length, s.decals.length, 'paint change keeps decals');
});

test('save migration: old saves get stock livery; new fields persist; junk is dropped', () => {
  const old = { version: 1, cash: 4200, carId: 'bulwark', upgrades: { armor: 1, engine: 0, tyres: 0 }, damage: 0, weapons: [], wins: 1, races: 2, kills: 0, bestTimes: {}, unlockedTracks: ['scrapyard'] };
  const m = normalizeSave(old);
  assert.equal(m.paint, null); assert.equal(m.accent, null); assert.equal(m.number, ''); assert.deepEqual(m.decalsOwned, []); assert.deepEqual(m.decals, []); assert.equal(m.cash, 4200); assert.equal(playerLivery(m).paint, 'acid-green');
  const d = normalizeSave({ ...old, paint: 'gold', accent: 'red', number: '88', decalsOwned: ['skull', 'ghost', 'skull', 5], decals: [{ id: 'skull', zone: 'hood', tint: 'chrome', scale: 1.5, rot: 400, mirror: 1 }, { id: 'bolt', zone: 'hood' }, { id: 'skull', zone: 'nowhere' }, null] });
  assert.equal(d.paint, 'gold'); assert.equal(d.accent, 'red'); assert.equal(d.number, '88'); assert.deepEqual(d.decalsOwned, ['skull']);
  assert.equal(d.decals.length, 1); assert.deepEqual([d.decals[0].rot, d.decals[0].mirror, d.decals[0].scale], [40, true, 1.5]);
  const bad = normalizeSave({ ...old, paint: 'neon-pink', accent: 7, number: '1234', decals: 'x' }); assert.equal(bad.paint, null); assert.equal(bad.accent, null); assert.equal(bad.number, ''); assert.deepEqual(bad.decals, []);
  const many = normalizeSave({ ...old, decalsOwned: ['star'], decals: Array.from({ length: 12 }, () => defaultPlacement('star', 'roof')) }); assert.equal(many.decals.length, MAX_DECALS);
  const store = createSaveStore(createMemoryStorage()); store.save(rich({ paint: 'magenta', decalsOwned: ['crown'], decals: [defaultPlacement('crown', 'trunk', 'gold')], number: '5' }));
  const back = store.load(); assert.equal(back.paint, 'magenta'); assert.equal(back.decals[0].tint, 'gold'); assert.equal(back.number, '5'); assert.deepEqual(back.decalsOwned, ['crown']);
});

test('decal baking: body frames map zones into UV space; composition draws only what is placed (fake 2D context)', () => {
  const f = zoneFrames();
  assert.ok(f.hood.u > 0.45 && f.hood.u < 0.55 && f.hood.v > 0.7, 'hood on the nose half'); assert.ok(f.trunk.v < 0.25, 'trunk at the tail');
  assert.ok(f.doorR.u < 0.35 && f.doorL.u > 0.65, 'doors on opposite flanks'); assert.ok(f.doorR.M[1][0] > 0 && f.doorL.M[1][0] < 0, 'door decals run front-to-back mirrored on the left');
  assert.ok(f.hood.M[0][0] < 0, 'hood: decal-right is -u (top of the ring runs right-to-left)');
  const calls = []; const g = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : (...a) => { calls.push(k); }), set: () => true });
  assert.equal(composeBodyDecals(g, 1024, 512, [], f, () => 0xffffff, ''), 0);
  assert.equal(composeBodyDecals(g, 1024, 512, [defaultPlacement('skull', 'hood'), defaultPlacement('bolt', 'trunk'), defaultPlacement('star', 'roof')], f, () => 0xffffff, ''), 2, 'roof decals are not baked into the body texture');
  assert.equal(composeBodyDecals(g, 1024, 512, [], f, () => 0xffffff, '7'), 2, 'number goes on both doors');
  assert.equal(composeRoofDecals(g, 256, 256, [defaultPlacement('star', 'roof'), defaultPlacement('star', 'hood')], () => 0xffffff), 1);
  for (const id of Object.keys(DECAL_DRAWERS)) assert.equal(drawDecal(g, id, '#fff'), true, id); assert.equal(drawDecal(g, 'nope'), false);
  assert.ok(calls.includes('fill') && calls.includes('setTransform'));
  const set = []; frameTransform({ setTransform: (...a) => set.push(a) }, { u: 0.5, v: 0.25, M: [[0.1, 0], [0, 0.2]] }, 100, 50); assert.deepEqual(set[0], [10, -0, 0, -10, 50, 37.5]);
});
