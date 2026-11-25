import { localizeHtml } from '../shared/web/localize-html.mjs';
import {build} from 'esbuild';
import {cp, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';

async function inventory(root, directory = '') {
  const files = [];
  for (const entry of await readdir(join(root, directory), {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(root, path));
    else files.push(path);
  }
  return files.sort();
}
const output = await mkdtemp(join(tmpdir(), 'kaboom-build-'));
try {
  await build({entryPoints:['src/game/main.js'], outfile:join(output,'arena.js'),
    bundle:true, minify:true, target:'es2020', charset:'utf8',
    alias:{three:resolve('src/game/vendor/three.module.min.js'), 'three/addons':resolve('src/game/vendor/three-addons')}});
  await writeFile(join(output,'tv.html'), await localizeHtml(await readFile('src/tv.html', 'utf8'), resolve('.')));
  await cp('src/portraits', join(output,'portraits'), {recursive:true});
  await cp('src/game/vendor/press-start-2p.woff2', join(output,'press-start-2p.woff2'));
  await cp('LICENSE', join(output,'LICENSE.txt'));
  await cp('NOTICE.md', join(output,'NOTICE.txt'));
  for (const file of ['THREE_LICENSE','PRESS_START_2P_LICENSE','QRCODE_LICENSE','ACTIONCABLE_LICENSE']) await cp('src/game/vendor/'+file,join(output,file+'.txt'));
  if (process.argv.includes('--check')) {
    const files = await inventory(output); assert.deepEqual(files, await inventory('dist'));
    for (const file of files) assert.deepEqual(await readFile(join(output,file)), await readFile(join('dist',file)), file);
  } else {
    await rm('dist', {recursive:true,force:true});
    await cp(output, 'dist', {recursive:true});
  }
} finally { await rm(output,{recursive:true,force:true}); }
