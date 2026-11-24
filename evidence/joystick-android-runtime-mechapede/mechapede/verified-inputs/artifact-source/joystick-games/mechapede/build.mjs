import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(root, name));
const { outputFiles } = await build({ absWorkingDir: root, entryPoints: ['src/main.js'], bundle: true, write: false,
  minify: true, format: 'iife', target: 'es2020', legalComments: 'eof' });
const files = { 'tv.html': read('src/index.html'), 'mechapede.js': Buffer.from(outputFiles[0].contents),
  'style.css': read('src/style.css'), 'machine-interior.png': read('src/assets/machine-interior.png'), 'favicon.svg': read('src/favicon.svg'),
  'THIRD-PARTY-NOTICES.txt': Buffer.from(['NOTICE.md', 'LICENSE', 'docs/puretv-LICENSE.txt'].map(read).join('\n\n')) };
const dist = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  if (fs.readdirSync(dist).sort().join() !== Object.keys(files).sort().join()) throw Error('Unexpected distribution inventory');
  for (const [name, data] of Object.entries(files)) if (!read('dist/' + name).equals(data)) throw Error('Stale ' + name);
} else {
  fs.mkdirSync(dist, { recursive: true });
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(dist, name), data);
}
