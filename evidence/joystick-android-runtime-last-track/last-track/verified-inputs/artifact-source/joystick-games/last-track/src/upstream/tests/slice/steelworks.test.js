import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildTrack } from '../../src/core/trackModel.js';
import { GAME_TRACKS } from '../../src/data/tracks/index.js';
import { buildPbrTrack, buildPbrTrackGeometry, BILLBOARDS } from '../../src/render/pbr/pbrTrack.js';
import { STEELWORKS_KIT, createSteelworksFx } from '../../src/render/pbr/steelworks.js';
import { buildEnvData, FORGE_SUN_ELEV } from '../../src/render/pbr/env.js';
import { makeKeyLight } from '../../src/render/pbr/pbrHost.js';

const [NEON, FOUNDRY] = GAME_TRACKS;

test('foundry run declares the steelworks kit, the forge sky and a low sun', () => {
  assert.equal(FOUNDRY.look.kit, 'steelworks');
  assert.equal(FOUNDRY.look.env, 'forge');
  assert.equal(FOUNDRY.look.sunElev, FORGE_SUN_ELEV);
  assert.equal(NEON.look, undefined, 'neon loop keeps its look');
});

test('foundry run geometry: furnace stacks with smoke and sparks, a gantry, steelworks signage', () => {
  const g = buildPbrTrackGeometry(buildTrack(FOUNDRY), { seed: FOUNDRY.look.seed });
  assert.ok(g.plumes.length >= 4, `stacks ${g.plumes.length}`);
  assert.equal(g.embers.length, g.plumes.length * 10, 'ten mouth sparks per stack');
  assert.ok(g.gantries >= 1, 'gantry over the road');
  assert.equal(g.billboardSet, STEELWORKS_KIT.billboards);
  assert.ok(g.billboardSet.some(([text]) => text === 'FOUNDRY'));
  assert.deepEqual(g.billboardTex, STEELWORKS_KIT.billboardTex);
  assert.ok(g.stats.tris > 20000 && g.lamps.length >= 15, `tris ${g.stats.tris}`);
});

test('neon loop geometry is untouched by the kit', () => {
  const g = buildPbrTrackGeometry(buildTrack(NEON), { seed: 77 });
  assert.equal(g.plumes.length, 0);
  assert.equal(g.embers.length, 0);
  assert.equal(g.gantries, 0);
  assert.equal(g.steam, null);
  assert.equal(g.billboardSet, BILLBOARDS);
  assert.deepEqual(g.billboardTex, { w: 128, h: 64, fit: false });
});

test('forge sky: a furnace-orange band on the horizon under a smoke-dark zenith', () => {
  const w = 256, h = 128, d = buildEnvData('forge', w, h, 9);
  const row = (y) => {
    const px = [];
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; px.push([d[i], d[i + 1], d[i + 2]]); }
    return px;
  };
  const glow = row(h / 2 - 1).filter((p) => p[0] > 1);
  assert.ok(glow.length > w / 4, `furnace glow covers the horizon (${glow.length}px)`);
  assert.ok(glow.every((p) => p[2] < 0.3 * p[0]), 'the glow is orange, not white');
  assert.ok(row(2).every((p) => p[0] < 0.2), 'the zenith stays smoke-dark');
});

test('key light: an elevation gives a true low sun; the default key is unchanged', () => {
  const q = { shadowMap: 512, shadowSoft: false };
  const low = makeKeyLight(q, { elev: FORGE_SUN_ELEV });
  assert.ok(Math.abs(low.userData.dir.y - Math.sin(FORGE_SUN_ELEV)) < 1e-9, 'sun sits at the elevation');
  const high = makeKeyLight(q);
  assert.ok(high.userData.dir.y > 0.3, 'default key stays high');
});

test('foundry run builds and animates end to end (update, quality, dispose) without a GL context', () => {
  const track = buildTrack(FOUNDRY), api = buildPbrTrack(track, { seed: FOUNDRY.look.seed }), cam = new THREE.PerspectiveCamera();
  for (let f = 0; f < 3; f++) api.update(1 / 60, cam, { x: track.samples[f].x, z: track.samples[f].y });
  api.setQuality({ name: 'low' });
  api.setQuality({ name: 'high' });
  assert.ok(api.group.children.some((c) => c.name === 'smoke'), 'smoke mesh present');
  api.dispose();
});

test('steelworks fx: smoke and sparks update without a GL context and dispose cleanly', () => {
  const group = new THREE.Group(), cam = new THREE.PerspectiveCamera();
  const fx = createSteelworksFx(group, { plumes: [{ x: 0, y: 50, z: 0, r: 5 }], embers: [{ x: 0, y: 50, z: 0 }] });
  fx.update(1 / 60, cam, 3.7);
  assert.equal(fx.stats.puffs, 9);
  assert.equal(fx.stats.sparks, 1);
  assert.equal(group.children.length, 2);
  fx.setQuality({ name: 'low' });
  assert.equal(group.children.every((c) => c.visible === false), true, 'hidden on low quality');
  fx.dispose();
});
