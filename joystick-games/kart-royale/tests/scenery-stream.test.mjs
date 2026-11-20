import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Group, Scene } from 'three';

const root = fileURLToPath(new URL('..', import.meta.url));
const compiled = await build({
  absWorkingDir: root, entryPoints: ['src/src/world/Scenery.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { Scenery } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].contents).toString('base64'));

function sceneFixture(software) {
  const scenery = new Scenery(() => software);
  const ctx = { scene: new Scene(), bus: { on() { return () => {}; } }, frame: 0 };
  const phases = [];
  const original = Array.from({ length: 11 }, () => new Group());
  original[5].visible = false;
  // Deterministic substitutes for the expensive procedural meshes. The real
  // construction lifecycle and reveal queue run around these batches.
  scenery.buildScenery = function* () {
    phases.push('water');
    this.group.add(original[0]);
    yield;
    phases.push('village');
    for (const object of original.slice(1, 7)) this.group.add(object);
    yield;
    phases.push('crowd');
    for (const object of original.slice(7)) this.group.add(object);
  };
  scenery.init(ctx);
  return { scenery, ctx, phases, original };
}

test('hardware builds the complete authored scene before rendering', () => {
  const { scenery, phases, original } = sceneFixture(false);
  assert.deepEqual(phases, ['water', 'village', 'crowd']);
  assert.deepEqual(scenery.group.children, original);
  assert.equal(original.filter(o => o.visible).length, 10);
});

test('software builds and reveals the same objects once across stops and resumes', () => {
  const { scenery, ctx, phases, original } = sceneFixture(true);
  for (ctx.frame = 1; ctx.frame <= 8; ctx.frame++) scenery.advanceScenery(ctx);
  assert.deepEqual(phases, []);
  scenery.advanceScenery(ctx);
  assert.deepEqual(phases, ['water']);
  ctx.frame++; scenery.advanceScenery(ctx);
  assert.equal(original.slice(0, 7).filter(o => o.visible).length, 4);
  // No rendering updates occur while the app is hidden. The next frame must
  // continue the pending generator and retain its exact original object order.
  for (let i = 0; i < 10; i++) { ctx.frame++; scenery.advanceScenery(ctx); }
  assert.deepEqual(phases, ['water', 'village', 'crowd']);
  assert.deepEqual(scenery.group.children, original);
  assert.equal(original[5].visible, false);
  assert.equal(original.filter(o => o.visible).length, 10);
  assert.equal(scenery.pendingDraws.length, 0);
});
