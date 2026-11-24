import { build } from 'esbuild';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

const stage = await mkdtemp(join(tmpdir(), 'puretv-port-'));
async function files(root, dir = '') {
  const paths = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const name = join(dir, entry.name);
    if (entry.isDirectory()) paths.push(...await files(root, name));
    else paths.push(name);
  }
  return paths.sort();
}
try {
  await build({ entryPoints: ['src/game.js'], outfile: join(stage, 'game.js'), bundle: true,
    target: 'es2020', minify: true, legalComments: 'inline' });
  for (const name of ['LICENSE','CREDITS.md','NOTICE.md']) await cp(name, join(stage, name + '.txt'));
  await cp('src/PureTV-LICENSE.txt', join(stage, 'PureTV-LICENSE.txt'));
  await cp('docs/assets.md', join(stage, 'ASSETS.txt'));
  await cp('node_modules/three/LICENSE', join(stage, 'THREE-LICENSE.txt'));
  await cp('src/tv.html', join(stage, 'tv.html'));
  const assets = join('src', 'assets');
  await cp(assets, join(stage, 'assets'), {
    recursive: true,
    filter: source => relative(assets, source).split(sep)[0] !== 'src',
  });
  if (process.argv.includes('--check')) {
    const names = await files(stage);
    assert.deepEqual(await files('dist'), names);
    for (const name of names) assert.deepEqual(await readFile(join('dist', name)), await readFile(join(stage, name)), name);
  } else {
    await rm('dist', { recursive: true, force: true });
    await cp(stage, 'dist', { recursive: true });
  }
} finally { await rm(stage, { recursive: true, force: true }); }
