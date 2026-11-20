/** Headless track regression. Supply a scratch installation of @napi-rs/canvas
 * for the 2D livery textures. No packages from this fixture ship in dist.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const canvasPrefix = process.argv[2];
if (!canvasPrefix) throw Error('Usage: node tests/ai-circuit-laps.mjs <scratch npm prefix containing @napi-rs/canvas>');
const { createCanvas } = createRequire(resolve(canvasPrefix, 'package.json'))('@napi-rs/canvas');
const root = fileURLToPath(new URL('..', import.meta.url));
const { outputFiles } = await build({
  absWorkingDir: root, bundle: true, platform: 'node', format: 'esm', write: false,
  stdin: {resolveDir: root, loader: 'ts', contents: `
    export { Race } from './src/src/game/Race';
    export { Track } from './src/src/world/Track';
    export { Scene } from 'three';`},
});
const moduleURL = 'data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64');
globalThis.document = {createElement(tag) {
  assert.equal(tag, 'canvas');
  return createCanvas(256, 256);
}};
globalThis.window = globalThis;
for (const course of ['cape-crown', 'marina-esses']) {
  globalThis.location = {search: '?track=' + course};
  // Each circuit needs a fresh process-wide course selection and kart roster.
  const {Race, Track, Scene} = await import(moduleURL + '#' + course);
  const track = new Track();
  const race = new Race();
  const ctx = {race, track, scene: new Scene(), input: {state: {}}, time: 0,
    items: {held() { return {kind: 0, count: 0}; }, use() {}},
    bus: {emit() {}}, shake() {}};
  race.init(ctx);
  race.autoDrive = true;
  race.start();
  for (let frame = 0; frame < 18000 && !race.karts.every(kart => kart.finished); frame++) {
    ctx.time += 1 / 30;
    race.update(ctx, 1 / 30);
  }
  const laps = race.karts.map(kart => kart.lap);
  assert.deepEqual(laps, Array(8).fill(3));
  assert.ok(race.karts.every(kart => kart.finished));
  console.log(JSON.stringify({course, length: track.length, seconds: ctx.time, laps}));
}
