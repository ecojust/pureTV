import { build } from 'vite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const output = process.argv.includes('--check') ? await mkdtemp(join(tmpdir(), 'puretv-openaero-')) : null;
async function files(path) {
  const entries = await readdir(path, {recursive: true, withFileTypes: true});
  return entries.filter(e => e.isFile()).map(e => join(e.parentPath, e.name).slice(path.length + 1)).sort();
}
const dist = join(process.cwd(), 'dist');
if (!output) {
  await build();
} else {
  try {
    await build({build: {outDir: output}});
    const expected = await files(output);
    assert.deepEqual(await files(dist), expected);
    for (const name of expected) {
      const actual = await readFile(join(dist, name));
      assert.ok(actual.equals(await readFile(join(output, name))), 'Stale ' + name);
    }
  } finally {
    await rm(output, {recursive: true, force: true});
  }
}
