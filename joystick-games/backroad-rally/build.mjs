import { localizeHtml } from '../shared/web/localize-html.mjs';
import { build } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, renameSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'src/upstream');
const check = process.argv.includes('--check');
const scratch = check ? mkdtempSync(join(tmpdir(), 'puretv-backroad-check-')) : null;
const out = scratch || join(here, 'dist');
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]).sort();
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');

try {
  const typed = spawnSync(process.execPath, [join(here, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', join(source, 'tsconfig.json')], { stdio: 'inherit' });
  if (typed.status !== 0) throw new Error('Original TypeScript project failed to type-check');
  const hashes = Object.fromEntries(files(join(source, 'public')).map(p => [relative(join(source, 'public'), p).replaceAll('\\', '/'), sha(p).slice(0, 10)]));
  await build({
    root: source, configFile: false, base: './',
    // Native package compression handles the exact original GLB bytes. Do not require
    // DecompressionStream in older WKWebView, or remove/transcode any original assets.
    define: { __PUBLIC_HASHES__: JSON.stringify(hashes), __GLB_GZ__: 'false' },
    build: {
      outDir: out, emptyOutDir: true, target: 'es2020', chunkSizeWarningLimit: 4500,
      rolldownOptions: { output: { codeSplitting: { groups: [
        { name: 'rapier', test: /node_modules[\\/]@dimforge/ },
        { name: 'three', test: /node_modules[\\/]three/ },
      ] } } },
    },
  });
  renameSync(join(out, 'index.html'), join(out, 'tv.html'));
  writeFileSync(join(out, 'tv.html'), await localizeHtml(readFileSync(join(out, 'tv.html'), 'utf8'), here));
  const notices = [
    ['Backroad Rally (MIT)', join(here, 'LICENSE')],
    ['Three.js (MIT)', join(here, 'node_modules/three/LICENSE')],
    ['Rapier (Apache-2.0)', join(here, 'node_modules/@dimforge/rapier3d-compat/LICENSE')],
    ['Inter fonts (OFL-1.1)', join(source, 'public/fonts/OFL.txt')],
  ].map(([label, path]) => `${label}\n${'='.repeat(label.length)}\n${readFileSync(path, 'utf8')}\n`).join('\n');
  writeFileSync(join(out, 'THIRD-PARTY-NOTICES.txt'), notices);
  const manifest = Object.fromEntries(files(out).map(p => [relative(out, p).replaceAll('\\', '/'), sha(p)]));
  if (check) {
    const current = join(here, 'dist');
    const actual = existsSync(current) ? Object.fromEntries(files(current).map(p => [relative(current, p).replaceAll('\\', '/'), sha(p)])) : {};
    if (JSON.stringify(manifest) !== JSON.stringify(actual)) throw new Error('dist differs from a clean rebuild');
    console.log(`build:check passed: ${Object.keys(manifest).length} identical files`);
  } else {
    mkdirSync(join(here, 'docs'), { recursive: true });
    writeFileSync(join(here, 'docs/dist-sha256.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Built ${Object.keys(manifest).length} local assets; all upstream public files retained`);
  }
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}
