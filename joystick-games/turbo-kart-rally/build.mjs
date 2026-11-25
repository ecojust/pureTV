import { localizeHtml } from '../shared/web/localize-html.mjs';
import { build } from 'esbuild';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.js'],
  outfile: 'game.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  loader: { '.woff2': 'dataurl' },
  write: false
});
const assets = new Map(result.outputFiles.map(file => [basename(file.path), Buffer.from(file.contents)]));
assets.set('tv.html', Buffer.from(await localizeHtml(readFileSync(join(root, 'src/tv.html'), 'utf8'), root)));
const notices = ['NOTICE.md', 'LICENSE', 'node_modules/three/LICENSE', 'node_modules/@fontsource/lilita-one/LICENSE', 'node_modules/@fontsource/nunito/LICENSE'];
assets.set('THIRD-PARTY-NOTICES.txt', Buffer.from(notices.map(path => path + '\n\n' + readFileSync(join(root, path), 'utf8')).join('\n\n')));
const out = join(root, 'dist');
if (process.argv.includes('--check')) {
  if (JSON.stringify(readdirSync(out).sort()) !== JSON.stringify([...assets.keys()].sort())) throw Error('Unexpected distribution inventory');
  for (const [name, bytes] of assets) {
    if (!bytes.equals(readFileSync(join(out, name)))) throw Error('Stale dist/' + name);
  }
  console.log('Offline distribution matches the clean build.');
} else {
  mkdirSync(out, { recursive: true });
  for (const [name, bytes] of assets) writeFileSync(join(out, name), bytes);
}
