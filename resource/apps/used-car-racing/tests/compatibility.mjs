import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, readdir} from 'node:fs/promises';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const {transform} = require('esbuild');
const assets = new URL('../src/main/assets/', import.meta.url);
const scripts = (await readdir(assets)).filter(name => name.endsWith('.js'));
for (const required of ['tracks.js', 'vehicle-models.js', 'game-model.js', 'renderer-3d.js', 'game.js', 'audio.js', 'three.min.js', 'controller.js']) {
  assert.ok(scripts.includes(required), `Missing local game script: ${required}`);
}
for (const name of scripts) {
  const source = await readFile(new URL(name, assets), 'utf8');
  const options = {minify: false, supported: {'template-literal': true}, legalComments: 'none'};
  const modern = (await transform(source, {...options, target: 'esnext'})).code;
  assert.equal((await transform(source, {...options, target: 'chrome61'})).code, modern, `${name} requires newer JavaScript syntax than Chrome 61`);
  assert.equal((await transform(source, {...options, target: 'es2017'})).code, modern, `${name} requires newer JavaScript syntax than ES2017`);
}
console.log(`PASS Used Car Racing: ${scripts.length} local scripts support Chrome 61 / ES2017 syntax; physical old-WebView performance is not inferred.`);
