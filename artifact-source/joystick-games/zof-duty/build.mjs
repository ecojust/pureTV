import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('.', import.meta.url));
const files = new Map();
for (const name of ['tv.html','game.js','game.css','core.js','arena.js','targets.js']) files.set(name,join(root,'src',name));
files.set('three.js',join(root,'src/vendor/three.js'));
files.set('three-LICENSE.txt',join(root,'src/vendor/three-LICENSE.txt'));
files.set('game-LICENSE.txt',join(root,'src/vendor/game-LICENSE.txt'));
for (const name of ['input.js','controller-clients.js','standard-gamepad.js']) files.set(name,join(root,'../shared/web',name));

const out = join(root,'dist');
const check = process.argv.includes('--check');
if (check) assert.deepEqual((await readdir(out)).sort(),[...files.keys()].sort());
else await mkdir(out,{recursive:true});
for (const [name, from] of files) {
  const content = await readFile(from);
  if (check) assert.ok(content.equals(await readFile(join(out,name))), 'Stale file: ' + name);
  else await writeFile(join(out,name),content);
}
