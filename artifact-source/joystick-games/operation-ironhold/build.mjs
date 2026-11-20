import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFile(path.join(root, name));
const bundle = await build({
  absWorkingDir: root, entryPoints: ['src/tv-input.js'], bundle: true,
  format: 'iife', target: 'es2020', write: false,
});
const notices = await Promise.all(['NOTICE.md', 'LICENSE', 'node_modules/three/LICENSE', 'src/licenses/pureTV.txt'].map(read));
const files = new Map([
  ['tv.html', await read('src/index.html')],
  ['three.min.js', await read('node_modules/three/build/three.min.js')],
  ['tv-input.js', Buffer.from(bundle.outputFiles[0].contents)],
  ['THIRD-PARTY-NOTICES.txt', Buffer.from(notices.join('\n\n'))],
]);
const dist = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  const names = (await fs.readdir(dist)).sort();
  if (JSON.stringify(names) !== JSON.stringify([...files.keys()].sort())) throw Error('Distribution inventory mismatch');
  for (const [name, bytes] of files) {
    if (!bytes.equals(await fs.readFile(path.join(dist, name)))) throw Error('Rebuild ' + name);
  }
} else {
  await fs.mkdir(dist, { recursive: true });
  for (const [name, bytes] of files) await fs.writeFile(path.join(dist, name), bytes);
}
