import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, renameSync, rmSync, mkdtempSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
const here = dirname(fileURLToPath(import.meta.url)), source = join(here, 'src/upstream');
const check = process.argv.includes('--check'), scratch = check ? mkdtempSync(join(tmpdir(), 'puretv-lasttrack-check-')) : null;
const out = scratch || join(here, 'dist');
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]).sort();
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
try {
  rmSync(out, { force: true, recursive: true }); mkdirSync(out, { recursive: true });
  // The original is a static ES-module game. Retain its vendored r170 and all runtime assets.
  // Source docs/tests/trailer tools remain in src/upstream but are not runtime dependencies.
  for (const name of ['src', 'assets', 'vendor', 'styles.css', 'hud.css', 'index.html']) cpSync(join(source, name), join(out, name), { recursive: true });
  renameSync(join(out, 'index.html'), join(out, 'tv.html'));
  // Resolve the original bare Three imports to its exact vendored r170 file. Older
  // WKWebView understands ES modules but not import maps; no library upgrade occurs.
  for (const file of files(join(out, 'src')).filter(p => p.endsWith('.js'))) {
    const localThree = relative(dirname(file), join(out, 'vendor/three.module.js')).replaceAll('\\', '/');
    const before = readFileSync(file, 'utf8');
    const after = before.replace(/from (['"])three\1/g, `from '${localThree.startsWith('.') ? localThree : './' + localThree}'`);
    if (after !== before) writeFileSync(file, after);
  }
  const shared = join(out, 'src/puretv-shared'); mkdirSync(shared, { recursive: true });
  for (const name of ['input.js', 'controller-clients.js']) cpSync(join(here, '../shared/web', name), join(shared, name));
  writeFileSync(join(out, 'THIRD-PARTY-NOTICES.txt'), `Last Track — Alexander Uspenskiy\n${readFileSync(join(here, 'LICENSE'), 'utf8')}\n\nThree.js r170 — Copyright 2010-2024 Three.js Authors\n${readFileSync(join(here, 'node_modules/three/LICENSE'), 'utf8')}`);
  const manifest = Object.fromEntries(files(out).map(p => [relative(out, p).replaceAll('\\', '/'), sha(p)]));
  if (check) {
    const current = join(here, 'dist');
    const actual = existsSync(current) ? Object.fromEntries(files(current).map(p => [relative(current, p).replaceAll('\\', '/'), sha(p)])) : {};
    if (JSON.stringify(manifest) !== JSON.stringify(actual)) throw new Error('dist differs from a clean copy of the frozen sources');
    console.log(`build:check passed: ${Object.keys(manifest).length} identical files`);
  } else {
    mkdirSync(join(here, 'docs'), { recursive: true });
    writeFileSync(join(here, 'docs/dist-sha256.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Built ${Object.keys(manifest).length} local files`);
  }
} finally { if (scratch) rmSync(scratch, { force: true, recursive: true }); }
