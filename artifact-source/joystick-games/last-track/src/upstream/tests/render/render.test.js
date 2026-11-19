import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildCarMesh, CAR_IDS } from '../../src/render/carModel.js';
import { buildTrackGeometry, buildTrackMesh } from '../../src/render/trackMesh.js';
import { buildScenery } from '../../src/render/scenery.js';
import { buildTrack } from '../../src/core/trackModel.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { MeshBuilder } from '../../src/render/geomUtil.js';
import { portraitSpec, drawPortrait, HAIR_STYLES, PORTRAIT_SIZE } from '../../src/render/portraits.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { chasePose, chaseFov, smoothAngle, nextCameraMode, CameraRig } from '../../src/render/cameras.js';
import { computeMapTransform, createMinimap } from '../../src/render/minimap.js';
import { PALETTE, MODERN_HEX, MODERN_RGB, modernHex } from '../../src/render/paletteRef.js';
import { colorRGB } from '../../src/render/geomUtil.js';
import { createRenderHost } from '../../src/render/renderHost.js';
import { createAudioEngine, engineModel, distanceGain } from '../../src/audio/audioEngine.js';
import { createEffects } from '../../src/render/effects.js';
import { buildSky } from '../../src/render/raceController.js';

const track = buildTrack(TRACKS[0]);

test('car meshes: 5 distinct silhouettes, 4 wheels, finite geometry', () => {
  const sizes = new Set();
  for (const id of CAR_IDS) {
    const g = buildCarMesh({ carId: id, color: 8, helmetColor: 10 });
    assert.equal(g.userData.wheels.length, 4);
    assert.equal(g.userData.frontPivots.length, 2);
    assert.ok(g.userData.body.geometry.attributes.position.array.every(Number.isFinite));
    const bb = new THREE.Box3().setFromObject(g);
    sizes.add([bb.max.y.toFixed(1), (bb.max.z - bb.min.z).toFixed(1), (bb.max.x - bb.min.x).toFixed(1)].join('/'));
    assert.ok(bb.max.x > 1.5 && bb.min.x < -1.5, 'long axis is X');
  }
  assert.equal(sizes.size, CAR_IDS.length);
  assert.equal(buildCarMesh({ carId: 'hammer', wrecked: true }).userData.wrecked, true);
  assert.equal(buildCarMesh({ carId: 'nope' }).userData.carId, 'wasp');
});

test('MeshBuilder solids have outward-facing normals', () => {
  const g = new MeshBuilder().box(0, 0, 0, 2, 2, 2, 8).build();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) assert.ok(p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) + p.getZ(i) * n.getZ(i) > 0.9);
});

test('track geometry for every track is finite and non-empty', () => {
  for (const def of TRACKS) {
    const t = buildTrack(def);
    const g = buildTrackGeometry(t);
    for (const k of ['road', 'kerbs', 'walls', 'ground']) {
      const a = g[k].attributes.position.array;
      assert.ok(a.length > 0 && a.every(Number.isFinite), k);
    }
    const m = buildTrackMesh(t);
    assert.equal(m.group.children.length, 4);
    m.dispose();
  }
});

test('scenery: themed, deterministic, non-trivial', () => {
  const seen = new Set();
  for (const def of TRACKS) {
    const t = buildTrack(def);
    const a = buildScenery(t), b = buildScenery(t);
    assert.equal(a.kind, def.theme.scenery);
    assert.equal(a.tris, b.tris);
    assert.ok(a.count > 20);
    seen.add(a.kind);
  }
  assert.equal(seen.size, TRACKS.length);
});

test('sky dome builds a smooth (unbanded) gradient with a haze colour for the fog', () => {
  const s = buildSky(TRACKS[0].theme);
  const col = s.geometry.attributes.color, pos = s.geometry.attributes.position;
  assert.ok(col.count > 0);
  assert.ok(col.array.every((v) => Number.isFinite(v) && v >= 0));
  const lv = new Set();
  for (let i = 0; i < pos.count; i++) lv.add(Math.round(pos.getY(i) / 40) + ':' + col.getZ(i).toFixed(3));
  assert.ok(lv.size > 40, 'many distinct shades, not 4 bands');
  assert.equal(s.userData.haze.length, 3);
});

test('modern ramp: 16 valid hex entries, distinct, and colorRGB maps every palette index through it', () => {
  assert.equal(MODERN_HEX.length, 16);
  assert.ok(MODERN_HEX.every((h) => /^#[0-9a-f]{6}$/.test(h)));
  assert.equal(new Set(MODERN_HEX).size, 16);
  assert.equal(MODERN_RGB.length, 16);
  assert.notDeepEqual([...MODERN_HEX], [...PALETTE], 'no longer the legacy 16-colour palette');
  const tc = new THREE.Color();
  for (let i = 0; i < 16; i++) {
    tc.set(MODERN_HEX[i]);
    const c = colorRGB(i);
    assert.ok(Math.abs(c[0] - tc.r) < 1e-6 && Math.abs(c[1] - tc.g) < 1e-6 && Math.abs(c[2] - tc.b) < 1e-6, `index ${i}`);
    assert.equal(modernHex(i), MODERN_HEX[i]);
  }
  assert.deepEqual(colorRGB(17), colorRGB(1), 'indices wrap');
  assert.equal(modernHex(-1), MODERN_HEX[15]);
});

test('meshes get per-face variation and darker bottoms (no flat 16-colour fills)', () => {
  const g = new MeshBuilder().box(0, 0.6, 0, 2, 1.2, 2, 8).build();
  const col = g.attributes.color, pos = g.attributes.position;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < col.count; i++) { const v = col.getX(i); if (pos.getY(i) < 0.05) lo = Math.min(lo, v); else if (pos.getY(i) > 1.1) hi = Math.max(hi, v); }
  assert.ok(lo < hi * 0.9, 'bottom vertices darker than the top');
  const flat = new MeshBuilder({ jitter: 0, ao: 0 }).box(0, 0.6, 0, 2, 1.2, 2, 8).build().attributes.color;
  assert.ok(new Set(Array.from(flat.array, (v) => v.toFixed(4))).size <= 3, 'jitter/ao can be disabled');
  const a = new MeshBuilder({ smooth: 50 }).cyl(0, 0, 0, 1, 1, 2, 'y', 8, 8).build(), b = new MeshBuilder({ smooth: 50 }).cyl(0, 0, 0, 1, 1, 2, 'y', 8, 8).build();
  assert.deepEqual([...a.attributes.normal.array], [...b.attributes.normal.array]);
  assert.ok(a.attributes.normal.array.every(Number.isFinite));
});

test('materials are PBR (standard/physical) and shared; render host has no palette pass', () => {
  const car = buildCarMesh({ carId: 'wasp', color: 8, helmetColor: 10 });
  assert.ok(car.userData.body.material.isMeshPhysicalMaterial || car.userData.body.material.isMeshStandardMaterial);
  assert.equal(buildCarMesh({ carId: 'hammer' }).userData.body.material, car.userData.body.material, 'car material shared');
  assert.ok(car.userData.body.getObjectByName('lights'), 'emissive lights mesh');
  const t = buildTrackMesh(track);
  assert.ok(t.group.children.every((m) => m.material.isMeshStandardMaterial));
  t.dispose();
  const host = createRenderHost(null, { renderer: { setClearColor() {}, setSize() {}, dispose() {}, render() {} } });
  assert.equal(host.palettePassActive, false);
  host.setPalettePass(true);
  assert.equal(host.palettePassActive, false);
  assert.ok(host.pbr === undefined);
  host.dispose();
});

test('portraitSpec: pure, deterministic, distinct per driver, colours resolved via the modern ramp', () => {
  const specs = DRIVERS.map((d) => portraitSpec(d));
  assert.deepEqual(portraitSpec(DRIVERS[0]), specs[0]);
  assert.equal(JSON.stringify(portraitSpec(DRIVERS[3])), JSON.stringify(specs[3]));
  assert.equal(new Set(specs.map((x) => JSON.stringify(x))).size, DRIVERS.length);
  for (const sp of specs) {
    assert.ok(HAIR_STYLES.includes(sp.style));
    assert.match(sp.accent, /^#[0-9a-f]{6}$/);
    assert.match(sp.skin.base, /^#[0-9a-f]{6}$/);
    assert.match(sp.hair.base, /^#[0-9a-f]{6}$/);
    assert.ok(['none', 'goggles', 'visor'].includes(sp.visor));
  }
  assert.equal(specs[0].hair.base, MODERN_HEX[DRIVERS[0].portrait.hair]);
  assert.equal(portraitSpec(DRIVERS.find((d) => d.id === 'kane')).cyber, true, 'skill >= 0.99 gets a cybernetic jaw');
  assert.equal(specs[0].cyber, false);
  assert.ok(new Set(specs.map((x) => x.style)).size >= 4);
  assert.doesNotThrow(() => portraitSpec(null));
});

function mockCtx(size) {
  const calls = {}, tf = [], grad = { addColorStop() {} };
  const ctx = new Proxy({ canvas: { width: size, height: size } }, {
    get(t, k) { if (k in t) return t[k]; if (k === 'getContext') return undefined; if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad; return (...a) => { calls[k] = (calls[k] || 0) + 1; if (k === 'scale') tf.push(a); }; },
    set(t, k, v) { t[k] = v; return true; },
  });
  return { ctx, calls, tf };
}

test('drawPortrait paints smooth vector art in a 256 logical space at any canvas size', () => {
  for (const size of [96, 256]) {
    const { ctx, calls, tf } = mockCtx(size);
    drawPortrait(ctx, DRIVERS[0]);
    assert.deepEqual(tf[0], [size / PORTRAIT_SIZE, size / PORTRAIT_SIZE]);
    assert.ok(calls.fill > 20 && calls.stroke > 5, 'vector fills and strokes');
    assert.ok(!calls.fillRect || calls.fillRect < 30, 'no per-pixel fillRect');
    assert.equal(calls.save, calls.restore);
  }
  assert.doesNotThrow(() => drawPortrait(null, DRIVERS[0]));
  for (const d of DRIVERS) assert.doesNotThrow(() => drawPortrait(mockCtx(64).ctx, d));
});

test('cameras: pose maths and rig placement', () => {
  const o = {};
  chasePose(o, 10, 20, 0);
  assert.ok(o.px < 10 && o.lx > 10 && Math.abs(o.pz - 20) < 1e-9);
  chasePose(o, 0, 0, Math.PI / 2);
  assert.ok(o.pz < 0 && Math.abs(o.px) < 1e-9);
  assert.ok(chaseFov(60) > chaseFov(0) && chaseFov(1e6) <= 85);
  assert.ok(Math.abs(smoothAngle(3.1, -3.1, 1e3, 1) - -3.1) < 1e-3);
  assert.equal(nextCameraMode('top'), 'chase');
  const cam = new THREE.PerspectiveCamera();
  const rig = new CameraRig(cam);
  rig.update(0.016, { x: 100, y: 50, heading: 0, speed: 30 }, 'racing', 0);
  assert.ok(cam.position.x < 100 && cam.position.y > 1 && Math.abs(cam.position.z - 50) < 0.1);
  rig.update(0.016, { x: NaN, y: 0, heading: 0 }, 'racing', 0);
  assert.ok(Number.isFinite(cam.position.x));
  rig.setMode('top');
  for (let i = 0; i < 40; i++) rig.update(0.05, { x: 100, y: 50, heading: 0, speed: 0 }, 'racing', 0);
  assert.ok(cam.position.y > 50);
});

test('minimap transform fits the box; draw is a no-op without a canvas', () => {
  const t = computeMapTransform({ minX: 0, maxX: 1000, minY: 0, maxY: 500 }, 200, 200, 10);
  assert.ok(Math.abs(t.scale - 0.18) < 1e-9);
  assert.ok(t.ox >= 10 - 1e-9 && 1000 * t.scale + t.ox <= 190 + 1e-9);
  createMinimap(null, track).draw({ cars: [] });
});

test('audio engine is inert outside the browser; pure helpers behave', () => {
  const a = createAudioEngine();
  a.resume(); a.startRace(); a.update({ cars: [], events: [], phase: 'racing', countdown: 0, tick: 1 }, 0.016);
  a.setMuted(true); a.setVolume(0.3); a.stop(); a.dispose();
  assert.ok(engineModel(0).freq < engineModel(30).freq);
  assert.ok(engineModel(5).gear === 1 && engineModel(60).gear === 5);
  assert.ok(distanceGain(0) > distanceGain(100) && distanceGain(500) === 0);
});

test('effects consume a snapshot (events, projectiles, hazards) without WebGL', () => {
  const scene = new THREE.Scene();
  const fx = createEffects(scene);
  const car = { id: 0, x: 0, y: 0, heading: 0, vx: 20, vy: 8, speed: 21, wrecked: false, smoke: true, burning: true, tyresPopped: true, isPlayer: true };
  const snap = (tick) => ({
    tick, cars: [car],
    projectiles: [{ id: 1, type: 'rocket', x: 5, y: 0, heading: 0, ownerId: 0 }],
    hazards: [{ id: 2, type: 'caltrops', x: 9, y: 1, heading: 0 }, { id: 3, type: 'wreck', x: 20, y: 1, heading: 0 }],
    pickups: [{ id: 4, type: 'ammo', x: 3, y: 3, active: true }],
    events: [{ type: 'shot', carId: 0, weaponId: 'machinegun' }, { type: 'shot', carId: 0, weaponId: 'rocket' }, { type: 'explosion', x: 4, y: 4, radius: 6 },
      { type: 'wreck', carId: 0 }, { type: 'hit', carId: 0, x: 1, y: 1 }, { type: 'bump', carId: 0, strength: 1 }, { type: 'pickup', carId: 0, pickupType: 'repair' }],
  });
  for (let i = 0; i < 30; i++) { car.x = i * 0.4; fx.update(snap(i), 1 / 60); }
  assert.ok(fx.particles.active > 0);
  assert.ok(fx.skids.count > 0);
  fx.update({ ...snap(31), projectiles: [], hazards: [] }, 1 / 60);
  fx.dispose();
});
