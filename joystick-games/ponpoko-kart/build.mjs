import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const result = await esbuild.build({
  absWorkingDir: root, entryPoints: ['src/main.js'], outfile: 'game.js',
  bundle: true, splitting: false, format: 'iife', target: 'es2020',
  minify: true, write: false, legalComments: 'inline',
  loader: { '.ttf': 'dataurl', '.png': 'dataurl' },
});
const files = Object.fromEntries(result.outputFiles.map(f => [path.basename(f.path), Buffer.from(f.contents)]));
files['tv.html'] = fs.readFileSync(path.join(root, 'src/tv.html'));
const notices = ['NOTICE.md', 'LICENSE', 'node_modules/three/LICENSE',
  'src/fonts/delagothicone-OFL.txt', 'src/fonts/mplusrounded1c-OFL.txt', 'src/fonts/yujisyuku-OFL.txt'];
files['THIRD-PARTY-NOTICES.txt'] = Buffer.from(notices.map(p => p + '\n\n' + fs.readFileSync(path.join(root, p), 'utf8')).join('\n\n'));
const out = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  if (JSON.stringify(fs.readdirSync(out).sort()) !== JSON.stringify(Object.keys(files).sort())) throw Error('Unexpected dist inventory');
  for (const [name, bytes] of Object.entries(files)) {
    if (!bytes.equals(fs.readFileSync(path.join(out, name)))) throw Error('Stale dist/' + name);
  }
  console.log('Verified exact offline Ponpoko Kart distribution');
} else {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, bytes] of Object.entries(files)) fs.writeFileSync(path.join(out, name), bytes);
  console.log('Built offline Ponpoko Kart:', Object.fromEntries(Object.entries(files).map(([p,b]) => [p,b.length])));
}
