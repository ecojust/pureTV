import { localizeHtml } from '../shared/web/localize-html.mjs';
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const result = await build({ absWorkingDir: root, entryPoints: ['src/main.js'], bundle: true,
  format: 'iife', target: 'es2020', minify: true, write: false, legalComments: 'eof',
  define: { __DEV__: 'false' } });
const [head, body] = (await read('src/template.html')).split('<!-- @@BODY@@ -->');
const html = '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  + head.trim() + '\n</head><body>\n'
  + body.trim().replace('<!-- @@SCRIPT@@ -->', '<script src="nova-lancer.js"></script>') + '\n</body></html>\n';
const notices = await Promise.all(['NOTICE.md', 'LICENSE', 'src/Three-LICENSE.txt', 'src/PureTV-LICENSE.txt'].map(read));
const files = { 'tv.html': await localizeHtml(html, root), 'nova-lancer.js': result.outputFiles[0].text,
  'THIRD-PARTY-NOTICES.txt': notices.join('\n\n') };
const dist = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  if ((await readdir(dist)).sort().join() !== Object.keys(files).sort().join()) throw Error('Unexpected distribution inventory');
  for (const [name, data] of Object.entries(files)) {
    if (await read('dist/' + name) !== data) throw Error('Stale ' + name);
  }
} else {
  await mkdir(dist, { recursive: true });
  for (const [name, data] of Object.entries(files)) await writeFile(path.join(dist, name), data);
}
