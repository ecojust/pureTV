import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildTrack, analyzeTrack } from '../../src/core/trackModel.js';
import { getTrack, GAME_TRACKS, TRACKS } from '../../src/data/tracks/index.js';
import { createGameConfig, FIELD_ENEMIES } from '../../src/data/sliceConfig.js';
import { pickDrivers, assignLiveries } from '../../src/data/fieldPick.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { createSaveStore } from '../../src/data/saveStore.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { applyRaceResult } from '../../src/data/economy.js';
import { createRaceSim } from '../../src/sim/raceSim.js';
import { buildHeroCarPBR, carMuzzle, VARIANTS } from '../../src/render/pbr/heroCarPBR.js';
import { buildPbrTrackGeometry } from '../../src/render/pbr/pbrTrack.js';
import { CARS } from '../../src/data/cars.js';

const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };

test('game tracks: Neon Loop, Foundry Run and Daylite are valid circuits with prizes and surfaces', () => {
  assert.deepEqual(GAME_TRACKS.map((t) => t.id), ['neonloop', 'foundry', 'daylite']);
  for (const def of GAME_TRACKS) {
    const t = buildTrack(def), a = analyzeTrack(t);
    assert.ok(t.length > 900 && t.length < 1500, `${def.id} length ${t.length}`);
    assert.equal(a.crossings, 0, def.id); assert.ok(a.minRadius >= 1.5 * (t.width / 2), `${def.id} radius ${a.minRadius}`); assert.ok(a.closeGap < 3);
    assert.ok(def.prize >= 4000 && def.laps === 3 && def.surfaces.puddles.length >= 2);
    assert.equal(getTrack(def.id), def);
    const g = buildPbrTrackGeometry(t, { seed: def.look?.seed || 77 }); assert.ok(g.stats.tris > 20000 && g.lamps.length >= 15, def.id);
  }
  assert.ok(!TRACKS.some((t) => GAME_TRACKS.includes(t)), 'legacy list untouched');
  assert.notEqual(GAME_TRACKS[1].look.fog, undefined);
});

test('economy: a top-three finish without a wreck passes the game track; saves keep game-track ids', () => {
  const save = { ...defaultSave(), carId: 'hammer' };
  const res = { trackId: 'neonloop', laps: 3, finishOrder: [], player: { position: 1, time: 100, kills: 1, wrecked: false, damageFraction: 0.2, ammoLeft: [], pickupCash: 0 } };
  const out = applyRaceResult(save, res, { mode: 'race', nCars: 6 });
  assert.equal(out.passedTrack, 'neonloop'); assert.ok(out.save.passedTracks.includes('neonloop')); assert.equal(out.prize, 4000); assert.equal(out.killBonus, 500);
  const store = createSaveStore(createMemoryStorage()); store.save(out.save);
  assert.ok(store.load().passedTracks.includes('neonloop')); assert.equal(store.load().bestTimes.neonloop, 100);
});

test('field picker: seeded, five distinct drivers, all three cars show up over time, distinct liveries', () => {
  assert.deepEqual(pickDrivers(5), pickDrivers(5));
  const seen = new Set(), carsSeen = new Set(), sets = new Set();
  for (let s = 0; s < 40; s++) { const f = pickDrivers(s); assert.equal(f.length, 5); assert.equal(new Set(f).size, 5); f.forEach((id) => { seen.add(id); carsSeen.add(DRIVERS.find((d) => d.id === id).carId); }); sets.add(f.join(',')); assert.ok(new Set(f.map((id) => DRIVERS.find((d) => d.id === id).carId)).size >= 2); }
  assert.equal(seen.size, DRIVERS.length, 'every driver appears'); assert.equal(carsSeen.size, CARS.length, 'every car is driven by someone'); assert.ok(sets.size > 8, 'fields vary per race');
  const cols = assignLiveries([9, 9, 8, 12], 9, [12, 11, 2, 8, 14, 13]);
  assert.equal(new Set([...cols, 9]).size, 5);
});

test('game config: player car from the save + 5 enemies with their own cars/weapons, hunting AI, PBR flags', () => {
  for (const car of CARS) {
    const save = { ...defaultSave(), carId: car.id, weapons: car.startWeapons.map((w) => ({ ...w })) };
    const cfg = createGameConfig({ trackId: 'foundry', save, seed: 11 });
    assert.equal(cfg.rivals.length, FIELD_ENEMIES); assert.equal(cfg.player.carId, car.id); assert.equal(cfg.trackId, 'foundry');
    assert.equal(cfg.hero, true); assert.equal(cfg.heroStyle, 'pbr');
    assert.ok(cfg.rivals.every((r) => r.hunt && r.loadout.length >= 1 && CARS.some((c) => c.id === r.carId) && r.stats.mass === CARS.find((c) => c.id === r.carId).base.mass));
    assert.equal(new Set([...cfg.rivals.map((r) => r.color), cfg.player.color]).size, 6, 'six distinct liveries');
    assert.equal(new Set(cfg.rivals.map((r) => r.number)).size >= 4, true);
    const sim = createRaceSim(cfg, {}); assert.equal(sim.snapshot().cars.length, 6);
  }
  const prac = createGameConfig({ mode: 'practice', trackId: 'neonloop', save: defaultSave(), seed: 1 }); assert.equal(prac.rivals.length, 0);
  assert.equal(createGameConfig({ mode: 'practice', trackId: 'neonloop', save: defaultSave(), seed: 1, practiceRivals: true }).rivals.length, 5);
});

test('PBR cars: three distinct, solid, opaque builds with fixed forward weapons and damage stages', () => {
  const dims = {};
  for (const id of ['wasp', 'hammer', 'bulwark']) {
    const car = buildHeroCarPBR({ carId: id, color: 0xaa3322 }), ud = car.userData, h = ud.hero;
    assert.equal(ud.carId, id); assert.equal(h.variant, id); assert.ok(ud.triCount() > 25000 && ud.triCount() < 80000, `${id} tris ${ud.triCount()}`); assert.ok(ud.drawCalls <= 36, `${id} calls ${ud.drawCalls}`);
    car.updateMatrixWorld(true);
    const box = new THREE.Box3(); car.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.name !== 'underglow-decal' && !/flame|fire/.test(o.name) && o.visible) box.expandByObject(o); });
    const size = box.getSize(new THREE.Vector3()); dims[id] = size;
    for (const o of [car.getObjectByName('body'), car.getObjectByName('hood')]) assert.equal(o.material.side, THREE.DoubleSide);
    car.traverse((o) => { if (o.isMesh && o.name === 'barrels') assert.equal(o.parent.rotation.y, 0); });
    for (const f of [1, 0.25, 0.1, 0]) { h.update({ speed: 30, frac: f, wrecked: f === 0, dmg: [1, 0.3, 0.2, 0.1], firing: true, throttle: 1 }, 1 / 60); }
    assert.equal(h.stage, 4);
    const m = carMuzzle(id); assert.equal(m.zs.length, id === 'hammer' ? 2 : id === 'wasp' ? 1 : 2); assert.ok(m.x > 0.8 && m.y > 0.9);
  }
  assert.ok(dims.wasp.y < dims.hammer.y * 0.85, 'interceptor is lower'); assert.ok(dims.bulwark.y > dims.hammer.y * 1.25, 'juggernaut is taller');
  assert.ok(dims.wasp.z > dims.hammer.z && dims.bulwark.z > dims.hammer.z, 'both are wider');
  assert.ok(VARIANTS.wasp.turrets.length === 1 && VARIANTS.bulwark.turrets.length === 2, 'weapon slots: 1 / 2');
  assert.ok(buildHeroCarPBR({ carId: 'wasp' }).getObjectByName('extras-blades') && buildHeroCarPBR({ carId: 'bulwark' }).getObjectByName('extras-armour'));
});

test('6-car races on both tracks: every player car can race; enemies shoot, hit and finish', () => {
  for (const [tid, car] of [['neonloop', 'wasp'], ['foundry', 'bulwark']]) {
    const c = CARS.find((x) => x.id === car), save = { ...defaultSave(), carId: car, weapons: c.startWeapons.map((w) => ({ ...w })) };
    const sim = createRaceSim(createGameConfig({ trackId: tid, save, seed: 31 }), { aiPlayer: true });
    let shots = 0, hits = 0; sim.events.on('shot', (e) => { if (e.carId > 0) shots++; }); sim.events.on('hit', (e) => { if (e.byId > 0 && e.weaponId !== 'wall' && e.weaponId !== 'ram' && e.weaponId !== 'flamethrower') hits++; });
    let n = 0; while (!sim.isOver() && n++ < 120 * 400) sim.step(NO);
    const r = sim.result(); assert.equal(r.finishOrder.length, 6);
    assert.ok(r.finishOrder.filter((f) => f.time != null).length >= 2, `${tid}/${car} finishers`); assert.ok(shots > 40 && hits > 15, `${tid} shots ${shots} hits ${hits}`);
    assert.ok(r.finishOrder[0].time > 80 && r.finishOrder[0].time < 220, `${tid} winner ${r.finishOrder[0].time}`);
  }
});
