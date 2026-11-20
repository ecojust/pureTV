// The original games are dependency-free ES modules. Bundle their unchanged simulation
// and procedural assets with the pureTV adapter into a self-contained, offline page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function buildGame(url, esbuild) {
  const root = path.dirname(fileURLToPath(url));
  const shared = path.dirname(fileURLToPath(import.meta.url));
  const check = process.argv.includes('--check');
  const at = process.argv.indexOf('--output');
  const output = at < 0 ? path.join(root, 'dist') : path.resolve(process.argv[at + 1]);
  const bundle = await esbuild.build({ absWorkingDir: root, entryPoints: ['src/js/main.js'],
    bundle: true, format: 'iife', minify: true, write: false, target: ['es2020'], legalComments: 'inline' });
  const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = fs.existsSync(path.join(root, 'src/style.css')) ? fs.readFileSync(path.join(root, 'src/style.css'), 'utf8') : '';
  const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8')
    .replace('/*__JS__*/', () => js).replace('/*__CSS__*/', () => css)
    .replace('/*__TV_CSS__*/', () => fs.readFileSync(path.join(shared, 'tv.css'), 'utf8'));
  if (/\b(?:src|href)=["'](?:https?:|\.\.\/|icons\/|manifest\.)/i.test(html)) throw new Error('Non-local resource in bundled HTML');
  const files = { 'tv.html': Buffer.from(html), 'THIRD-PARTY-NOTICES.txt': fs.readFileSync(path.join(root, 'NOTICE.md')) };
  if (check) {
    if (JSON.stringify(fs.readdirSync(output).sort()) !== JSON.stringify(Object.keys(files).sort())) throw new Error('Unexpected dist files');
    for (const [name, data] of Object.entries(files)) if (!data.equals(fs.readFileSync(path.join(output, name)))) throw new Error('Stale dist/' + name);
    console.log('Reproducible build verified: ' + path.basename(root));
  } else {
    fs.mkdirSync(output, { recursive: true });
    for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(output, name), data);
    console.log('Built offline ' + path.basename(root) + ': ' + files['tv.html'].length + ' bytes');
  }
}
