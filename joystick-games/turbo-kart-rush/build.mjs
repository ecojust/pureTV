import { localizeHtml } from '../shared/web/localize-html.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const result = await esbuild.build({
  absWorkingDir: root, entryPoints: ['src/main.ts'], outfile: 'game.js',
  bundle: true, splitting: false, format: 'iife', target: 'es2020',
  minify: true, write: false, legalComments: 'inline', tsconfig: 'src/tsconfig.json',
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' },
});
const files = Object.fromEntries(result.outputFiles.map(f => [path.basename(f.path), Buffer.from(f.contents)]));
files['tv.html'] = Buffer.from(await localizeHtml(fs.readFileSync(path.join(root, 'src/tv.html'), 'utf8'), root));
const notices = ['NOTICE.md', 'LICENSE', 'node_modules/three/LICENSE'];
files['THIRD-PARTY-NOTICES.txt'] = Buffer.from(notices.map(p => p + '\n\n' + fs.readFileSync(path.join(root, p), 'utf8')).join('\n\n'));
const out = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  if (JSON.stringify(fs.readdirSync(out).sort()) !== JSON.stringify(Object.keys(files).sort())) throw Error('Unexpected dist inventory');
  for (const [name, bytes] of Object.entries(files)) {
    if (!bytes.equals(fs.readFileSync(path.join(out, name)))) throw Error('Stale dist/' + name);
  }
  console.log('Verified exact offline Turbo Kart Rush distribution');
} else {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, bytes] of Object.entries(files)) fs.writeFileSync(path.join(out, name), bytes);
  console.log('Built offline Turbo Kart Rush:', Object.fromEntries(Object.entries(files).map(([p,b]) => [p,b.length])));
}
