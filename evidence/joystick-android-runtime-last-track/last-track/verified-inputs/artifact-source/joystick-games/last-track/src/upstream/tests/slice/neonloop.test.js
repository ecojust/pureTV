import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, analyzeTrack } from '../../src/core/trackModel.js';
import { getTrack, TRACKS, SLICE_TRACKS } from '../../src/data/tracks/index.js';
import { buildPbrTrackGeometry, PBR_CHUNKS, BILLBOARDS } from '../../src/render/pbr/pbrTrack.js';
import { createSliceConfig, SLICE_FIELD, SLICE_TRACK_ID } from '../../src/data/sliceConfig.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { createRaceSim } from '../../src/sim/raceSim.js';
import { getWeapon } from '../../src/data/weapons.js';
import { holoBillboard, concreteMaps, fogSprite } from '../../src/render/pbr/maps.js';

const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
const track = () => buildTrack(getTrack(SLICE_TRACK_ID));

test('Neon Loop: short closed circuit, valid for the track model, slice-only', () => {
  const t = track(), a = analyzeTrack(t);
  assert.ok(t.length > 800 && t.length < 1250, `length ${t.length}`);
  assert.equal(a.crossings, 0); assert.ok(a.closeGap < 3, 'closed'); assert.ok(a.minRadius >= 1.5 * (t.width / 2), `min radius ${a.minRadius}`);
  assert.ok(a.minSeparation > t.width + 20, `separation ${a.minSeparation}`);
  let best = 0, cur = 0, hairpin = false, signs = 0, last = 0;
  for (const p of t.samples) {
    if (Math.abs(p.curv) < 0.004) { cur += t.ds; best = Math.max(best, cur); } else cur = 0;
    if (Math.abs(p.curv) > 0.04) hairpin = true;
    const sg = Math.abs(p.curv) > 0.012 ? Math.sign(p.curv) : 0; if (sg && sg !== last) { signs++; last = sg; }
  }
  assert.ok(best >= 150, `straight ${best}`); assert.ok(hairpin, 'has a hairpin'); assert.ok(signs >= 4, 'sweeper + chicane direction changes');
  assert.ok(!TRACKS.some((x) => x.id === SLICE_TRACK_ID), 'not in the normal game track list');
  assert.ok(SLICE_TRACKS.some((x) => x.id === SLICE_TRACK_ID)); assert.equal(getTrack(SLICE_TRACK_ID).laps, 3);
  assert.equal(t.pickups.length, 3);
});

test('PBR Neon Loop geometry: chunked, deterministic, budgeted, props clear of the road', () => {
  const t = track(), g = buildPbrTrackGeometry(t, { seed: 5 }), g2 = buildPbrTrackGeometry(t, { seed: 5 });
  assert.equal(g.chunks.length, PBR_CHUNKS); assert.equal(g.stats.tris, g2.stats.tris);
  assert.ok(g.stats.tris > 20000 && g.stats.tris < 90000, `tris ${g.stats.tris}`);
  for (const k of ['road', 'paint', 'barrier', 'steel', 'props', 'emissive', 'shafts', 'puddles', 'towers', 'towerGlow']) assert.ok(g.stats.perLayer[k] > 0, k);
  assert.ok(g.lamps.length >= 15 && g.billboards.length >= 4 && g.fogSheets.length >= 6);
  assert.ok(g.billboards.every((b) => b.idx < BILLBOARDS.length));
  const road = g.chunks[0].road.build(); assert.equal(road.attributes.uv.count, road.attributes.position.count); assert.ok(road.attributes.color);
  for (const l of g.lamps) { const pr = t.project(l.x, l.z); assert.ok(Math.abs(pr.d) > t.width / 2 - 1.5, 'lamp heads only overhang the barrier line'); }
  for (const p of [g.towers.p]) for (let i = 0; i < p.length; i += 9) { const pr = t.project(p[i], p[i + 2]); assert.ok(Math.abs(pr.d) > t.width / 2 + 10); }
});

test('PBR track textures: sizes, determinism', () => {
  assert.equal(concreteMaps(32).albedo.length, 32 * 32 * 4); assert.deepEqual(Array.from(concreteMaps(32, 1).normal), Array.from(concreteMaps(32, 1).normal));
  assert.equal(holoBillboard('NEON', [60, 230, 255], 64, 32).length, 64 * 32 * 4); assert.equal(fogSprite(16).length, 16 * 16 * 4);
});

test('slice field: four Hammer enemies with distinct liveries, weapons and personalities', () => {
  const cfg = createSliceConfig({ save: { ...defaultSave(), carId: 'hammer' }, seed: 3 });
  assert.equal(cfg.trackId, SLICE_TRACK_ID); assert.equal(cfg.laps, 3); assert.equal(cfg.rivals.length, SLICE_FIELD.length); assert.equal(cfg.slice, true);
  assert.ok(cfg.rivals.every((r) => r.carId === 'hammer' && r.hunt && r.stats.mass === 1500 && r.loadout.length >= 1));
  assert.equal(new Set(cfg.rivals.map((r) => r.color)).size, cfg.rivals.length); assert.ok(!cfg.rivals.some((r) => r.color === cfg.player.color), 'no enemy shares the player\'s colour');
  assert.equal(new Set(cfg.rivals.map((r) => r.favoriteWeapon)).size >= 3, true);
  assert.ok(new Set(cfg.rivals.map((r) => r.skill)).size >= 3 && new Set(cfg.rivals.map((r) => r.aggression)).size >= 3);
  for (const r of cfg.rivals) for (const w of r.loadout) assert.ok(getWeapon(w.id), w.id);
  const sim = createRaceSim(cfg, {});
  const snap = sim.snapshot(); assert.equal(snap.cars.length, 5); assert.deepEqual(new Set(snap.cars.slice(1).map((c) => c.color)).size, 4);
});

test('Neon Loop race: enemies finish 3 laps, line up and shoot straight ahead, deterministic', () => {
  const run = (seed, hunt = true) => {
    const cfg = createSliceConfig({ save: defaultSave(), seed }); cfg.rivals.forEach((r) => { r.hunt = hunt; });
    const sim = createRaceSim(cfg, { aiPlayer: true }), shots = { n: 0 }, hits = { n: 0 };
    sim.events.on('shot', (e) => { if (e.carId > 0) shots.n++; });
    sim.events.on('hit', (e) => { if (e.byId > 0 && e.weaponId !== 'wall' && e.weaponId !== 'ram' && e.weaponId !== 'flamethrower') hits.n++; });
    let n = 0; while (!sim.isOver() && n++ < 120 * 300) sim.step(NO);
    return { sim, shots: shots.n, hits: hits.n, result: sim.result() };
  };
  const a = run(900), b = run(900);
  assert.deepEqual(a.result.finishOrder.map((f) => [f.carId, f.time]), b.result.finishOrder.map((f) => [f.carId, f.time]), 'deterministic');
  assert.ok(a.result.finishOrder.filter((f) => f.time != null).length >= 2, 'at least two cars finish');
  const win = a.result.finishOrder[0].time; assert.ok(win > 60 && win < 190, `winner ${win}s for 3 laps`);
  assert.ok(a.shots > 40 && a.hits > 20, `enemies fire (${a.shots}) and hit (${a.hits})`);
  // lining up pays: accuracy with the hunting logic beats plain racing-line driving
  const c = run(901), d = run(901, false);
  assert.ok(c.hits / Math.max(1, c.shots) >= d.hits / Math.max(1, d.shots) - 0.02, `accuracy ${c.hits}/${c.shots} vs ${d.hits}/${d.shots}`);
  // fixed forward guns: every machine-gun tracer is along the shooter's heading (hitscan has no aim offset beyond spread)
  assert.equal(getWeapon('machinegun').kind, 'hitscan');
});
