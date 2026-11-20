import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const bundle = await build({
  absWorkingDir: root, entryPoints: ['src/main.ts'], outfile: 'dist/lumenrift.js',
  bundle: true, format: 'iife', target: 'es2020', write: false, minify: true, legalComments: 'inline',
});
const files = new Map(bundle.outputFiles.map(f => [basename(f.path), Buffer.from(f.contents)]));
files.set('tv.html', await readFile(join(root, 'src/index.html')));
files.set('NOTICE.txt', Buffer.concat(await Promise.all(['NOTICE.md', 'LICENSE'].map(name => readFile(join(root, name))))));
if (process.argv.includes('--check')) {
  assert.deepEqual((await readdir(dist)).sort(), [...files.keys()].sort());
  for (const [name, data] of files) assert.deepEqual(await readFile(join(dist, name)), data, name);
} else {
  await mkdir(dist, { recursive: true });
  for (const [name, data] of files) await writeFile(join(dist, name), data);
}
console.log(`${files.size} offline files verified for Lumenrift`);
