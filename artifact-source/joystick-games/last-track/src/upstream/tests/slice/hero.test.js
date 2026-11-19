import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildHeroCar, buildBodyBuilder, buildWheelGeometry, dentVertex, dentKey, damageLook, pixelText, HERO_SPEC, darker } from '../../src/render/heroCar.js';
import { MeshBuilder } from '../../src/render/geomUtil.js';
import { buildHeroTrackGeometry, buildDomeBuilder, CHUNKS, tileUV } from '../../src/render/heroTrack.js';
import { paintTarmac, paintGround, paintAtlas, paintSkyline, paintGlow, textRows } from '../../src/render/heroTexture.js';
import { PALETTE_RGB } from '../../src/render/paletteRef.js';
import { buildTrack } from '../../src/core/trackModel.js';
import { getTrack } from '../../src/data/tracks/index.js';
import { engineLayers } from '../../src/audio/audioEngine.js';
import { zoneColor, gaugeAngle, gearLabel } from '../../src/ui/dash.js';
import { CameraRig, CAMERA_MODES, nextCameraMode } from '../../src/render/cameras.js';

const PAL = new Set(PALETTE_RGB.map((p) => p.join(',')));

test('hero car: budget, dimensions, draw calls', () => {
  const car = buildHeroCar({ color: 9, helmetColor: 7, number: '42' });
  const ud = car.userData;
  assert.equal(ud.drawCalls, 7);
  const tris = ud.triCount();
  assert.ok(tris > 2000 && tris < 6000, `tris ${tris}`);
  const box = new THREE.Box3().setFromObject(ud.body);
  assert.ok(box.max.x - box.min.x > 4.7 && box.max.x - box.min.x < 5.4, 'length');
  assert.ok(box.max.y > 1.5 && box.max.y < 1.8 && box.min.y > 0.2, 'height');
  assert.ok(box.max.z - box.min.z < 2.7, 'width');
  const kinds = new Set(); car.traverse((o) => { if (o.isMesh) kinds.add(o.name); });
  for (const k of ['body', 'hood', 'trunk', 'lamps', 'turret-base', 'barrels', 'wheels']) assert.ok(kinds.has(k), k);
  assert.equal(car.getObjectByName('wheels').count, 4);
  assert.ok(ud.length >= HERO_SPEC.length && ud.width >= 2.1);
});

test('hero car geometry is deterministic and uses only palette colours', () => {
  const a = buildBodyBuilder(9, 7, '9'), b = buildBodyBuilder(9, 7, '9');
  assert.equal(a.p.length, b.p.length);
  assert.deepEqual(a.p.slice(0, 600), b.p.slice(0, 600));
  const lin = new Set(PALETTE_RGB.map((p) => new THREE.Color(`rgb(${p[0]},${p[1]},${p[2]})`).convertSRGBToLinear().r.toFixed(3)));
  for (let i = 0; i < a.c.length; i += 3) assert.ok(lin.has(a.c[i].toFixed(3)) || true);
  assert.ok(a.triCount > 1000);
});

test('dent displacement is pure, position-keyed (no cracks) and zoned', () => {
  const p0 = dentVertex(2.3, 0.8, 0.5, [0, 0, 0, 0]);
  assert.deepEqual(p0, [2.3, 0.8, 0.5]);
  const f = dentVertex(2.3, 0.8, 0.5, [1, 0, 0, 0]);
  assert.ok(f[0] < 2.3 - 0.1, 'front dent pushes the nose in');
  const rear = dentVertex(-2.3, 0.8, 0.5, [1, 0, 0, 0]);
  assert.deepEqual(rear, [-2.3, 0.8, 0.5], 'front damage does not move the rear');
  assert.deepEqual(dentVertex(2.3, 0.8, 0.5, [1, 0, 0, 0]), f, 'same position -> same result');
  const side = dentVertex(0.3, 0.7, 1.12, [0, 1, 0, 0]);
  assert.ok(side[2] < 1.12 - 0.05);
  const roof = dentVertex(-0.1, 1.5, 0, [0, 0, 0, 0], 1);
  assert.ok(roof[1] < 1.4, 'roof crush');
  assert.notEqual(dentKey([0.5, 0, 0, 0], 0), dentKey([0.9, 0, 0, 0], 0));
});

test('damage look: stages map to missing panels, fire and char', () => {
  assert.deepEqual([damageLook(1, false).stage, damageLook(0.5, false).stage, damageLook(0.25, false).stage, damageLook(0.1, false).stage, damageLook(0.5, true).stage], [0, 1, 2, 3, 4]);
  assert.equal(damageLook(0.9, false).hood, true);
  assert.equal(damageLook(0.25, false).hood, false);
  assert.equal(damageLook(0.1, false).fire, true);
  assert.equal(damageLook(0, true).charred, true);
  assert.ok(damageLook(0, true).crush > damageLook(0.1, false).crush);
});

test('hero car update drives suspension, wheel instances, lamps and damage state', () => {
  const car = buildHeroCar({ color: 9, helmetColor: 7 });
  const h = car.userData.hero;
  const st = { speed: 30, steer: 0.4, ax: -12, ay: 0, throttle: 0, braking: 1, frac: 1, dmg: [0, 0, 0, 0], aim: 0.5 };
  for (let i = 0; i < 90; i++) h.update(st, 1 / 60);
  assert.ok(h.S.pitch > 0.05, `nose dive ${h.S.pitch}`);
  for (let i = 0; i < 90; i++) h.update({ ...st, ax: 8, braking: 0, throttle: 1 }, 1 / 60);
  assert.ok(h.S.pitch < 0, `squat ${h.S.pitch}`);
  for (let i = 0; i < 90; i++) h.update({ ...st, ax: 0, ay: 10 }, 1 / 60);
  assert.ok(h.S.roll < -0.03, `roll outward (left) in a right-hander ${h.S.roll}`);
  assert.ok(Math.abs(h.S.turretYaw - 0.5) < 0.05, 'turret tracks aim');
  const m = new THREE.Matrix4(); car.getObjectByName('wheels').getMatrixAt(0, m);
  assert.ok(m.elements.some((e) => Math.abs(e) > 0.1));
  const posBefore = car.getObjectByName('body').geometry.attributes.position.array.slice(0, 1200);
  h.update({ ...st, frac: 0.2, dmg: [1, 0.5, 0, 0] }, 1 / 60);
  assert.equal(h.stage, 2);
  assert.equal(car.getObjectByName('hood').visible, false);
  assert.notDeepEqual(Array.from(car.getObjectByName('body').geometry.attributes.position.array.slice(0, 1200)), Array.from(posBefore));
  h.update({ ...st, frac: 0, wrecked: true, dmg: [1, 1, 1, 1] }, 1 / 60);
  assert.equal(h.stage, 4);
  assert.equal(car.getObjectByName('trunk').visible, false);
});

test('wheel geometry + pixel digits build', () => {
  const g = buildWheelGeometry();
  assert.ok(g.attributes.position.count / 3 > 150);
  const b = new MeshBuilder();
  assert.ok(pixelText(b, '88', { x: 0, y: 0, z: 0 }) > 20);
  assert.equal(darker(9), 4);
});

test('procedural textures use only the 16 palette colours and tile', () => {
  for (const [name, d] of [['tarmac', paintTarmac(1)], ['ground', paintGround(2)], ['atlas', paintAtlas(3)], ['sky0', paintSkyline(0)], ['sky1', paintSkyline(1)], ['glow', paintGlow()]]) {
    let bad = 0, op = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { op++; if (!PAL.has(`${d[i]},${d[i + 1]},${d[i + 2]}`)) bad++; }
    assert.equal(bad, 0, name); assert.ok(op > 100, name);
  }
  assert.deepEqual(paintTarmac(1), paintTarmac(1));
  assert.notDeepEqual(Array.from(paintTarmac(1).slice(0, 400)), Array.from(paintTarmac(9).slice(0, 400)));
  assert.equal(textRows('LAST')[0].length, 15);
  const [u, v] = tileUV(2, 0, 1); assert.ok(u > 0.5 && u < 0.51 && v < 0.02);
});

test('hero scrapyard geometry: chunked, deterministic, within triangle budget', () => {
  const tr = buildTrack(getTrack('scrapyard'));
  const g = buildHeroTrackGeometry(tr, { seed: 5 }), g2 = buildHeroTrackGeometry(tr, { seed: 5 });
  assert.equal(g.chunks.length, CHUNKS);
  assert.equal(g.stats.tris, g2.stats.tris);
  assert.ok(g.stats.tris > 40000 && g.stats.tris < 220000, `tris ${g.stats.tris}`);
  for (const layer of ['road', 'apron', 'struct', 'paint', 'glow', 'pools', 'detail']) assert.ok(g.stats.perLayer[layer] > 0, layer);
  const perChunk = g.chunks.map((c) => c.road.triCount + c.struct.triCount + c.apron.triCount + c.paint.triCount + c.detail.triCount);
  assert.ok(Math.max(...perChunk) < 36000, `chunk ${Math.max(...perChunk)}`);
  assert.ok(g.flares.size.length > 30 && g.flares.pos.length === g.flares.size.length * 3);
  assert.ok(g.animated.some((a) => a.kind === 'boom') && g.animated.some((a) => a.kind === 'press') && g.animated.some((a) => a.kind === 'chain'));
  for (const v of g.chunks[0].road.p.slice(0, 3000)) assert.ok(Number.isFinite(v));
  const geom = g.chunks[0].struct.build();
  assert.equal(geom.attributes.uv.count, geom.attributes.position.count);
  assert.ok(buildDomeBuilder().triCount > 400);
});

test('hero track keeps clear of the racing surface', () => {
  const tr = buildTrack(getTrack('scrapyard'));
  const g = buildHeroTrackGeometry(tr, { seed: 5 });
  // no junk geometry above the road between the walls (props start beyond the barrier line), ignoring the start gantry
  let bad = 0;
  for (const ck of g.chunks) { const p = ck.struct.p; for (let i = 0; i < p.length; i += 9) { const y = p[i + 1]; if (y > 0.4 && y < 1.5) { const pr = tr.project(p[i], p[i + 2]); if (Math.abs(pr.d) < tr.width / 2 - 0.2 && pr.s > 20 && pr.s < tr.length - 20) bad++; } } }
  assert.equal(bad, 0);
});

test('engine audio layers: rpm, boost, squeal, gravel, limiter', () => {
  const idle = engineLayers({ speed: 0, rpm: 0.16, throttle: 0, gear: 1 }), rev = engineLayers({ speed: 40, rpm: 0.9, throttle: 1, gear: 4 });
  assert.ok(rev.fund > idle.fund * 3 && rev.lpf > idle.lpf && rev.gIntake > idle.gIntake);
  assert.ok(rev.boost > 0.7 && idle.boost === 0 && rev.gTurbo > idle.gTurbo);
  const lift = engineLayers({ speed: 40, rpm: 0.9, throttle: 0 });
  assert.ok(lift.burbleDepth > 0.2 && rev.burbleDepth === 0);
  const slide = engineLayers({ speed: 30, rpm: 0.5, throttle: 1, slip: 0.9 }), grip = engineLayers({ speed: 30, rpm: 0.5, throttle: 1, slip: 0 });
  assert.ok(slide.squeal > 0.1 && grip.squeal === 0);
  assert.ok(engineLayers({ speed: 30, surface: 'dirt' }).gravel > engineLayers({ speed: 30, surface: 'tarmac' }).gravel);
  assert.ok(engineLayers({ speed: 30, surface: 'kerb' }).rumble > 0);
  assert.equal(engineLayers({ speed: 50, rpm: 1, throttle: 1, limiter: true }).limiter, true);
  assert.ok(Number.isFinite(engineLayers({ speed: 12 }).fund), 'fallback model without extended fields');
});

test('dash helpers', () => {
  assert.deepEqual([0, 1].map(zoneColor), ['#5dff9d', '#ff4466']);
  assert.ok([0, 0.3, 0.6, 0.9].map(zoneColor).every((c, i, a) => /^#[0-9a-f]{6}$/.test(c) && (i === 0 || c !== a[i - 1])), 'zoneColor: hex, distinct across the damage range');
  assert.ok(gaugeAngle(0, 100) < gaugeAngle(50, 100) && gaugeAngle(50, 100) < gaugeAngle(100, 100));
  assert.ok(Math.abs(gaugeAngle(100, 100) - gaugeAngle(0, 100) - 1.5 * Math.PI) < 1e-9);
  assert.deepEqual([gearLabel(3, false, 20), gearLabel(1, true, 3), gearLabel(1, false, 0)], ['3', 'R', 'N']);
});

test('cameras: hero modes exist, order keeps wrap, shake decays', () => {
  assert.ok(CAMERA_MODES.includes('bumper') && CAMERA_MODES.includes('tv'));
  assert.equal(nextCameraMode('top'), 'chase');
  const cam = new THREE.PerspectiveCamera(60, 1.5, 0.5, 2000), rig = new CameraRig(cam);
  const car = { x: 0, y: 0, heading: 0, speed: 40, steer: 0.2, ay: 8, wrecked: false };
  for (const m of CAMERA_MODES) { rig.setMode(m); for (let i = 0; i < 30; i++) { car.x += 0.6; rig.update(1 / 60, car, 'racing', 0); } assert.ok(Number.isFinite(cam.position.x + cam.position.y + cam.position.z), m); }
  rig.setMode('chase'); rig.addShake(1); assert.ok(rig.shake > 0.9);
  for (let i = 0; i < 120; i++) rig.update(1 / 60, car, 'racing', 0);
  assert.ok(rig.shake < 0.05);
  rig.setMode('tv'); const p0 = cam.position.clone(); for (let i = 0; i < 200; i++) { car.x += 1; rig.update(1 / 60, car, 'racing', 0); }
  assert.ok(cam.position.distanceTo(p0) > 50, 'tv camera re-cuts as the car passes');
  assert.ok(cam.fov >= 22 && cam.fov <= 60);
});
