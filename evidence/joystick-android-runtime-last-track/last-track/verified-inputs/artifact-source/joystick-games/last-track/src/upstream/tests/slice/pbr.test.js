import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildHeroCarPBR, damageLook, dentKey, stepHeat, wingAngle, PBR_SPEC } from '../../src/render/pbr/heroCarPBR.js';
import { buildBodyGeometries, orientTriangles, buildCanopy, buildRoofPanel, dentPoint, carveArches, sectionAt, halfSection, NJ, WHEELS, RING } from '../../src/render/pbr/carBody.js';
import { flakeNormal, carbonMaps, treadNormal, brushedMaps, asphaltMaps, glowSprite, heightToNormal } from '../../src/render/pbr/maps.js';
import { buildEnvData, sunDir } from '../../src/render/pbr/env.js';
import { QUALITY, resolveQuality, nextQuality, readQuality } from '../../src/render/pbr/quality.js';
import { bloomLevels } from '../../src/render/pbr/post.js';
import { mergeGeo, roundedBox, ribbon, spline, keyInterp, triCount } from '../../src/render/pbr/geo.js';
import { PBR_PALETTE } from '../../src/render/pbr/paints.js';

test('PBR hero car: parts, materials, budget, dimensions', () => {
  const car = buildHeroCarPBR({ color: 0xc8501a });
  const ud = car.userData;
  assert.equal(ud.pbr, true);
  const tris = ud.triCount();
  assert.ok(tris > 20000 && tris < 80000, `tris ${tris}`);
  assert.ok(ud.drawCalls <= 30, `calls ${ud.drawCalls}`);
  const names = new Set(); car.traverse((o) => { if (o.isMesh) names.add(o.name); });
  for (const n of ['body', 'hood', 'glass', 'aero', 'wing-flap', 'armour', 'interior', 'headlights', 'taillights', 'underglow', 'turret-base', 'barrels', 'tyres', 'rims', 'discs', 'calipers']) assert.ok(names.has(n), n);
  assert.equal(car.getObjectByName('tyres').count, 4);
  const paint = car.getObjectByName('body').material;
  assert.ok(paint.isMeshPhysicalMaterial && paint.clearcoat === 1 && paint.normalMap, 'clearcoat flake paint');
  assert.ok(car.getObjectByName('armour').material.anisotropy > 0 && car.getObjectByName('armour').material.metalness === 1, 'brushed metal');
  assert.ok(car.getObjectByName('aero').material.map && car.getObjectByName('aero').material.normalMap, 'carbon');
  assert.ok(car.getObjectByName('glass').material.transparent, 'glass');
  assert.ok(car.getObjectByName('tyres').material.normalMap, 'tread normals');
  assert.ok(car.getObjectByName('headlights').material.color.r > 1, 'HDR emissive lights');
  const box = new THREE.Box3().setFromObject(car.getObjectByName('body'));
  assert.ok(box.max.x - box.min.x > 5 && box.max.x - box.min.x < 5.4, 'length');
  assert.ok(box.max.z - box.min.z > 2.1 && box.max.z - box.min.z < 2.6, 'width');
  assert.ok(box.max.y > 1.05 && box.max.y < 1.3 && box.min.y > 0.2, 'height');
  assert.ok(PBR_SPEC.length > 5);
});

test('body surface: smooth normals point outward, arches are carved, hood is a separate panel', () => {
  const { body, hood } = buildBodyGeometries();
  assert.ok(triCount(body) > 6000 && triCount(hood) > 300);
  const p = body.attributes.position, n = body.attributes.normal;
  let tops = 0, topsUp = 0, sides = 0, sidesOut = 0;
  for (let i = 0; i < p.count; i++) {
    assert.ok(Number.isFinite(n.getX(i) + n.getY(i) + n.getZ(i)));
    if (Math.abs(p.getZ(i)) < 0.05 && p.getY(i) > 0.9 && Math.abs(p.getX(i)) < 2) { tops++; if (n.getY(i) > 0.5) topsUp++; }
    if (p.getZ(i) > 1.0 && Math.abs(p.getY(i) - 0.65) < 0.1 && Math.abs(p.getX(i)) < 1) { sides++; if (n.getZ(i) > 0.5) sidesOut++; }
  }
  assert.ok(topsUp >= tops * 0.95 && tops > 20, 'top normals up'); assert.ok(sidesOut >= sides * 0.95 && sides > 20, 'flank normals out');
  // arch carve: a point on the flank at the wheel centre is pushed inside the wheel
  const c = carveArches([WHEELS.front, 0.5, 1.1]);
  assert.ok(Math.abs(c[2]) < 0.7, `carved z ${c[2]}`);
  const far = carveArches([0.2, 0.7, 1.1]); assert.equal(far[2], 1.1);
  // hood panel lives on top of the bonnet only
  const hp = hood.attributes.position; for (let i = 0; i < hp.count; i++) { assert.ok(hp.getX(i) >= 0.7 && hp.getX(i) <= 2.3); assert.ok(hp.getY(i) > 0.6); }
  assert.ok(sectionAt(0).hw > 1 && sectionAt(2.58).hw < 0.8 && halfSection(sectionAt(0)).length === NJ && RING === 2 * NJ - 2);
});

test('canopy and roof panel', () => {
  const c = buildCanopy(), r = buildRoofPanel(c);
  const box = new THREE.Box3().setFromBufferAttribute(c.attributes.position);
  assert.ok(box.max.y > 1.4 && box.max.y < 1.7);
  assert.ok(triCount(r) > 200 && triCount(r) < triCount(c));
});

test('dents: pure, zoned, bounded; heat/wing/look models', () => {
  assert.deepEqual(dentPoint(2.3, 0.8, 0.5, [0, 0, 0, 0]), [2.3, 0.8, 0.5]);
  const f = dentPoint(2.3, 0.8, 0.5, [1, 0, 0, 0]);
  assert.ok(f[0] < 2.3 - 0.08 && f[0] > 2.3 - 0.5);
  assert.deepEqual(dentPoint(-2.3, 0.8, 0.5, [1, 0, 0, 0]), [-2.3, 0.8, 0.5]);
  assert.deepEqual(dentPoint(1, 0.8, 1.1, [1, 0, 0, 0]), dentPoint(1, 0.8, 1.1, [1, 0, 0, 0]));
  assert.ok(dentPoint(0, 1.4, 0, [0, 0, 0, 0], 1)[1] < 1.3);
  assert.notEqual(dentKey([0.5, 0, 0, 0], 0), dentKey([1, 0, 0, 0], 0));
  assert.deepEqual([1, 0.5, 0.25, 0.1].map((x) => damageLook(x, false).stage), [0, 1, 2, 3]);
  assert.equal(damageLook(0.4, true).charred, true);
  assert.equal(damageLook(0.25, false).hood, false);
  let h = 0; for (let i = 0; i < 120; i++) h = stepHeat(h, 1, 40, 1 / 60);
  assert.ok(h > 0.5 && h <= 1); let c = h; for (let i = 0; i < 600; i++) c = stepHeat(c, 0, 40, 1 / 60); assert.ok(c < h * 0.3);
  assert.ok(wingAngle(50, 1, 0) > wingAngle(50, 0, 0) + 0.5 && wingAngle(10, 0, 0) > wingAngle(60, 0, 0));
});

test('PBR car update: suspension, heat glow, lights, damage stages, dents, wet/dirt uniforms', () => {
  const car = buildHeroCarPBR({}), h = car.userData.hero;
  const base = { speed: 35, steer: 0.3, ax: -12, ay: 0, throttle: 0, braking: 1, frac: 1, dmg: [0, 0, 0, 0], aim: 0.4 };
  for (let i = 0; i < 90; i++) h.update(base, 1 / 60);
  assert.ok(h.S.pitch > 0.05, 'dive'); assert.ok(h.S.heat > 0.4 && h.mats.disc.emissiveIntensity > 1, 'brake heat glow');
  assert.ok(h.mats.tail.color.r > 2, 'brake light');
  for (let i = 0; i < 90; i++) h.update({ ...base, ax: 7, braking: 0, throttle: 1 }, 1 / 60);
  assert.ok(h.S.pitch < 0, 'squat'); assert.ok(h.S.flap < 0.4, 'wing flap flattens when not braking');
  for (let i = 0; i < 90; i++) h.update({ ...base, ax: 0, braking: 0, ay: 11 }, 1 / 60);
  assert.ok(h.S.roll < -0.03, 'roll'); assert.equal(h.S.turretYaw, 0, 'turret is fixed, never tracks'); assert.equal(car.getObjectByName('barrels').parent.rotation.y, 0);
  const before = car.getObjectByName('body').geometry.attributes.position.array.slice(-900);
  h.update({ ...base, braking: 0, frac: 0.25, dmg: [1, 0.3, 0, 0] }, 1 / 60);
  assert.equal(h.stage, 2); assert.equal(car.getObjectByName('hood').visible, false);
  assert.notDeepEqual(Array.from(car.getObjectByName('body').geometry.attributes.position.array.slice(-900)), Array.from(before));
  h.update({ ...base, braking: 0, frac: 0.1, dmg: [1, 0.3, 0, 0] }, 1 / 60);
  assert.equal(h.stage, 3); assert.equal(car.getObjectByName('armour').visible, false);
  h.update({ ...base, frac: 0, wrecked: true, dmg: [1, 1, 1, 1] }, 1 / 60);
  assert.equal(h.stage, 4); assert.ok(h.mats.paint.clearcoat === 0, 'charred paint');
  for (let i = 0; i < 300; i++) h.update({ ...base, frac: 1, wet: 1, dirt: 1, dmg: [0, 0, 0, 0] }, 1 / 30);
  assert.equal(h.stage, 0); assert.ok(h.uniforms.uWet.value > 0.9 && h.uniforms.uDirt.value > 0.8);
  assert.equal(h.mats.paint.clearcoat, 1);
});

test('procedural PBR maps are deterministic, correctly sized, and sensible', () => {
  assert.equal(flakeNormal(64, 1).length, 64 * 64 * 4);
  assert.deepEqual(Array.from(flakeNormal(32, 3)), Array.from(flakeNormal(32, 3)));
  const n = flakeNormal(64, 1); let flat = 0; for (let i = 0; i < n.length; i += 4) if (n[i + 2] > 140) flat++; assert.ok(flat > 64 * 64 * 0.5, 'mostly facing up');
  const c = carbonMaps(64); assert.equal(c.albedo.length, 64 * 64 * 4); assert.ok(c.albedo[0] < 120 && c.normal.length === c.roughness.length);
  assert.equal(treadNormal(64, 32).length, 64 * 32 * 4);
  assert.equal(brushedMaps(32).roughness.length, 32 * 32 * 4);
  const a = asphaltMaps(64); assert.ok(a.albedo[0] < 140);
  assert.equal(glowSprite(16)[3 + (8 * 16 + 8) * 4] > 200, true);
  const flatN = heightToNormal(new Float32Array(16), 4, 4); assert.ok(flatN[2] > 250 && Math.abs(flatN[0] - 128) < 2);
});

test('HDR environments: finite, high dynamic range, sun + softboxes', () => {
  for (const kind of ['dusk', 'showroom']) {
    const d = buildEnvData(kind, 128, 64); let mx = 0, bad = 0;
    for (let i = 0; i < d.length; i++) { if (!Number.isFinite(d[i])) bad++; if (i % 4 < 3) mx = Math.max(mx, d[i]); }
    assert.equal(bad, 0); assert.ok(mx > 10, `${kind} peak ${mx}`);
  }
  const s = sunDir(); assert.ok(Math.abs(Math.hypot(...s) - 1) < 1e-6 && s[1] > 0);
});

test('quality presets and post helpers', () => {
  assert.equal(QUALITY.low.post, false); assert.ok(QUALITY.med.bloom && !QUALITY.med.ssao); assert.ok(QUALITY.high.ssao && QUALITY.high.motionBlur && QUALITY.high.msaa > 0);
  assert.ok(QUALITY.low.shadowMap <= QUALITY.med.shadowMap && QUALITY.low.dpr <= QUALITY.high.dpr);
  assert.equal(resolveQuality('nope').name, 'med'); assert.equal(nextQuality('high'), 'low');
  assert.equal(readQuality('?slice=1&q=high'), 'high'); assert.equal(readQuality('?x=1', { getItem: () => 'low' }), 'low'); assert.equal(readQuality(''), 'med');
  const lv = bloomLevels(1920, 1080); assert.equal(lv[0][0], 960); assert.ok(lv.length >= 4 && lv.every(([w, h], i) => i === 0 || w < lv[i - 1][0]));
});

test('geometry helpers', () => {
  const g = mergeGeo([roundedBox(1, 1, 1, 0.1, 3), roundedBox(1, 1, 1, 0.1, 3)]);
  assert.equal(triCount(g), 2 * triCount(roundedBox(1, 1, 1, 0.1, 3)));
  assert.ok(Math.abs(g.attributes.normal.getX(0) ** 2 + g.attributes.normal.getY(0) ** 2 + g.attributes.normal.getZ(0) ** 2 - 1) < 1e-3);
  assert.equal(triCount(ribbon([[0, 0, 0], [1, 0, 0], [2, 0, 0]], 0.1)), 4);
  assert.equal(spline([[0, 0], [1, 1], [2, 0]], 9).length, 9);
  assert.deepEqual(keyInterp([[0, 1], [1, 3]], -5), [1]); assert.ok(Math.abs(keyInterp([[0, 0], [1, 1], [2, 2]], 1)[0] - 1) < 1e-9);
  assert.equal(PBR_PALETTE(9), 0xc8501a);
});

test('solid body: every triangle faces outward, caps closed, opaque materials, internals present', () => {
  const { body, hood } = buildBodyGeometries();
  assert.equal(orientTriangles(body), 0, 'no inward-facing body triangles (was see-through at nose/tail)');
  assert.equal(orientTriangles(hood), 0);
  // nose and tail caps exist: triangles whose vertices all sit at the end stations
  const p = body.attributes.position; let nose = 0, tail = 0;
  for (let i = 0; i < p.count; i++) { if (p.getX(i) > 2.55) nose++; if (p.getX(i) < -2.59) tail++; }
  assert.ok(nose > 40 && tail > 40, `caps ${nose}/${tail}`);
  const car = buildHeroCarPBR({}); const seen = [];
  car.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material)) seen.push(o); });
  for (const o of seen) {
    if (['glass', 'underglow-decal', 'wing-flap'].includes(o.name) || o.material.blending === THREE.AdditiveBlending) continue;
    if (o.isInstancedMesh || /flame|fire|flash/.test(o.name)) continue;
    assert.ok(!o.material.transparent, `${o.name} must be opaque`);
  }
  const glass = car.getObjectByName('glass').material; assert.ok(glass.transparent && glass.opacity >= 0.6, 'tinted glass');
  for (const n of ['internals-dark', 'internals-metal']) assert.ok(car.getObjectByName(n), n);
  const inner = car.getObjectByName('internals-metal').geometry; inner.computeBoundingBox();
  assert.ok(inner.boundingBox.min.x < -1.5 && inner.boundingBox.max.x > 2.4, 'engine at the front, tank/diff at the rear');
  const dark = car.getObjectByName('internals-dark').geometry; assert.ok(triCount(dark) > 300);
  assert.equal(car.getObjectByName('body').material.side, THREE.DoubleSide);
});
