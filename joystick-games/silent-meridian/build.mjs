import { build } from 'esbuild';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const staging = await mkdtemp(join(tmpdir(), 'puretv-game-'));
async function inventory(root, folder = '') {
  const result = [];
  for (const item of await readdir(join(root, folder), {withFileTypes: true})) {
    const path = join(folder, item.name);
    if (item.isDirectory()) result.push(...await inventory(root, path));
    else result.push(path);
  }
  return result.sort();
}
try {
  await build({entryPoints: ['src/controls.js'], outfile: join(staging, 'controls.js'), bundle: true, target: 'es2020'});
  await cp('src/tv.html', join(staging, 'tv.html'));
  await cp('LICENSE', join(staging, 'LICENSE.txt'));
  await cp('NOTICE.md', join(staging, 'NOTICE.txt'));
  await cp('src/assets', join(staging, 'assets'), {recursive:true});
  await mkdir(join(staging, 'src'));
  await cp('src/src/style.css', join(staging, 'src/style.css'));
  await build({entryPoints:['src/src/app.js'],outfile:join(staging,'app.js'),bundle:true,target:'es2020'});
  if (process.argv.includes('--check')) {
    const files = await inventory(staging);
    assert.deepEqual(await inventory('dist'), files);
    for (const file of files) assert.deepEqual(await readFile(join(staging, file)), await readFile(join('dist', file)), file);
  } else {
    await rm('dist', {recursive: true, force: true});
    await cp(staging, 'dist', {recursive: true});
  }
} finally {
  await rm(staging, {recursive: true, force: true});
}
