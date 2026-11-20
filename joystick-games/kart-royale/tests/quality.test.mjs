import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const result = await build({
  absWorkingDir: root,
  stdin: {
    contents: "export { selectQuality } from './src/src/core/Settings'; export { Quality } from './src/src/types';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const { selectQuality, Quality } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));
const desktop = { handheld: false, touchPrimary: false, cores: 8, memoryGB: 8 };
const tablet = { ...desktop, touchPrimary: true };
const software = { webgl2: true, software: true, renderer: 'SwiftShader' };

test('software rendering uses the low preset and respects an explicit quality selection', () => {
  assert.equal(selectQuality(desktop, software, null), Quality.Low);
  assert.equal(selectQuality(tablet, software, null), Quality.Low);
  assert.equal(selectQuality(desktop, software, 'high'), Quality.High);
  assert.equal(selectQuality(desktop, software, 'ultra'), Quality.Ultra);
});

test('hardware keeps the original desktop and touch tiers', () => {
  const gpu = { webgl2: true, software: false, renderer: 'Intel UHD Graphics' };
  assert.equal(selectQuality(desktop, gpu, null), Quality.High);
  assert.equal(selectQuality(desktop, { ...gpu, renderer: 'Apple M2' }, null), Quality.Ultra);
  assert.equal(selectQuality(tablet, gpu, null), Quality.Medium);
  assert.equal(selectQuality({ ...tablet, handheld: true }, gpu, null), Quality.Low);
});
