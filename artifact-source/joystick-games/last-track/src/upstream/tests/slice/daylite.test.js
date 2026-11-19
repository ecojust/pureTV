import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildTrack } from '../../src/core/trackModel.js';
import { GAME_TRACKS } from '../../src/data/tracks/index.js';
import { buildPbrTrack, buildPbrTrackGeometry } from '../../src/render/pbr/pbrTrack.js';
import { MANHATTAN_KIT, libertyStatue, createDustFx } from '../../src/render/pbr/manhattan.js';
import { buildEnvData, DUST_SUN_ELEV } from '../../src/render/pbr/env.js';

const DAYLITE = GAME_TRACKS.find((t) => t.id === 'daylite');

test('daylite declares the manhattan kit, the hazy daylight sky and a low afternoon sun', () => {
  assert.equal(GAME_TRACKS[2], DAYLITE, 'unlocks after Foundry Run');
  assert.equal(DAYLITE.look.kit, 'manhattan');
  assert.equal(DAYLITE.look.env, 'dust');
  assert.equal(DAYLITE.look.sunElev, DUST_SUN_ELEV);
  assert.ok(DAYLITE.look.fogDensity > 0 && DAYLITE.look.fog !== undefined, 'hazy distance');
  assert.ok(DAYLITE.surfaces.dirt.length >= 1 && DAYLITE.surfaces.dirt.every((z) => z.side === 1 || z.side === -1), 'red dust across a kerb');
});

test('daylite geometry: towers on the land side, a quay, a harbour past it, the Lady on her island, dust motes', () => {
  const g = buildPbrTrackGeometry(buildTrack(DAYLITE), { seed: DAYLITE.look.seed });
  assert.equal(g.billboardSet, MANHATTAN_KIT.billboards);
  assert.ok(g.billboardSet.some(([text]) => text === 'LIBERTY'), 'a LIBERTY sign');
  assert.deepEqual(g.steam, MANHATTAN_KIT.steam, 'dust banks tinted red');
  assert.equal(g.plumes.length, 0, 'no stacks: this is not the steelworks');
  assert.ok(g.lamps.length >= 15, `lamps ${g.lamps.length}`);
  assert.ok(g.towers.triCount > 4000 && g.towerGlow.triCount > 20000, `skyline ${g.towers.triCount} / lit panes ${g.towerGlow.triCount}`);
  assert.ok(g.water && g.water.w > 0 && g.water.cx - g.water.w / 2 > g.bounds.maxX, 'the harbour starts past the quay');
  assert.ok(g.statue, 'the statue is placed');
  assert.ok(Math.abs(g.statue.x - g.water.cx) < g.water.w / 2 && Math.abs(g.statue.z - g.water.cz) < g.water.h / 2, 'the island sits in the harbour');
  assert.ok(g.statue.x > g.bounds.maxX + 150, 'the statue stands out past the quay');
  assert.ok(g.statue.x - g.bounds.maxX < 260, 'close enough to read through the haze from the circuit');
  assert.ok(g.motes.count >= 1000 && g.motes.wind[0] > 0, 'dust motes drift downwind');
});

test('the Statue of Liberty: a 47 m pedestal under a 46 m statue, torch tip at 93 m, built on the island', () => {
  const s = libertyStatue();
  let minY = Infinity, maxY = -Infinity;
  for (const B of [s.lit, s.glow]) for (let i = 1; i < B.p.length; i += 3) { minY = Math.min(minY, B.p[i]); maxY = Math.max(maxY, B.p[i]); }
  assert.ok(minY > -0.01 && minY < 0.5, `base on the island (${minY})`);
  assert.ok(maxY > 92 && maxY < 94, `torch tip (${maxY})`);
  assert.ok(s.height > 92 && s.height < 94, `height ${s.height}`);
  assert.ok(s.lit.triCount > 400, 'the statue is built, not a stub');
  assert.ok(s.glow.triCount > 0, 'the torch burns');
});

test('dust sky: a bright hazy daylight band above the skyline, a clear blue zenith, and a sun disc', () => {
  const w = 256, h = 128, d = buildEnvData('dust', w, h, 9);
  for (let i = 0; i < d.length; i++) assert.ok(Number.isFinite(d[i]), 'finite radiance');
  const px = (y) => { const out = []; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; out.push([d[i], d[i + 1], d[i + 2]]); } return out; };
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const band = px(h / 2 - 8);
  const bright = band.filter((p) => lum(p) > 0.6).length;
  assert.ok(bright > w * 0.7, `bright daylight band (${bright}px)`);
  assert.ok(px(2).every((p) => p[2] > p[0] && lum(p) > 0.3), 'the zenith is a clear sky blue, not dark');
  let peak = 0; for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, d[i]);
  assert.ok(peak > 20, `the sun disc is bright (${peak})`);
});

test('dust motes drift on the wind, wrap inside their box, stay above the road and hide on low quality', () => {
  const group = new THREE.Group(), cam = new THREE.PerspectiveCamera();
  const fx = createDustFx(group, { center: [0, 0], span: [900, 900], count: 200, wind: [1.3, 0.4] });
  const pts = group.children.find((c) => c.name === 'dust');
  fx.update(1 / 60, cam, 2);
  const a = Array.from(pts.geometry.attributes.position.array);
  fx.update(1 / 60, cam, 9);
  const b = pts.geometry.attributes.position.array;
  assert.notDeepEqual(a, Array.from(b), 'the motes move');
  for (let i = 0; i < b.length; i += 3) {
    assert.ok(Math.abs(b[i]) <= 450 && Math.abs(b[i + 2]) <= 450, 'inside the box');
    assert.ok(b[i + 1] > 0 && b[i + 1] < 40, `above the road, below the haze (${b[i + 1]})`);
  }
  fx.setQuality({ name: 'low' });
  assert.equal(pts.visible, false, 'hidden on low quality');
  fx.dispose();
});

test('daylite builds and animates end to end (harbour, dust, quality, dispose) without a GL context', () => {
  const track = buildTrack(DAYLITE), api = buildPbrTrack(track, { seed: DAYLITE.look.seed }), cam = new THREE.PerspectiveCamera();
  for (let f = 0; f < 3; f++) api.update(1 / 60, cam, { x: track.samples[f].x, z: track.samples[f].y });
  api.setQuality({ name: 'low' });
  api.setQuality({ name: 'high' });
  assert.ok(api.group.children.some((c) => c.name === 'harbour'), 'harbour plane');
  assert.ok(api.group.children.some((c) => c.name === 'dust'), 'dust motes');
  api.dispose();
});
