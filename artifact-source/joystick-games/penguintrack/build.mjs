import { localizeHtml } from '../shared/web/localize-html.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');
const out = path.join(root, 'dist');
const check = process.argv.includes('--check');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const walk = base => fs.readdirSync(base, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(base, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

// Keep each source module's asset/worker URL after bundling. The copied workers
// remain ordinary modules with their original relative imports and source paths.
const moduleUrls = {
  name: 'penguin-source-module-urls',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, args => {
      if (!args.path.startsWith(src + path.sep)) return;
      const relative = path.relative(src, args.path).split(path.sep).join('/');
      const text = fs.readFileSync(args.path, 'utf8');
      return {
        contents: text.replace(/\bimport\.meta\.url\b/g,
          `new URL(${JSON.stringify(relative)}, document.baseURI).href`),
        loader: 'js',
        resolveDir: path.dirname(args.path),
      };
    });
    build.onResolve({ filter: /^three(?:\/addons\/.*)?$/ }, args => ({
      path: args.path === 'three'
        ? path.join(src, 'vendor/three.module.min.js')
        : path.join(src, 'vendor/addons', args.path.slice('three/addons/'.length).split('/').at(-1)),
    }));
  },
};

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: ['src/js/main.js'],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  legalComments: 'inline',
  metafile: true,
  plugins: [moduleUrls],
});
const files = new Map();
for (const directory of ['css', 'vendor', 'js', 'models', 'tas-examples']) {
  for (const file of walk(path.join(src, directory))) {
    files.set(path.relative(src, file).split(path.sep).join('/'), fs.readFileSync(file));
  }
}
for (const name of ['favicon.svg', 'docs/AI.md']) files.set(name, fs.readFileSync(path.join(src, name)));
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace('<script type="module" src="js/main.js"></script>', '<script defer src="penguintrack.js"></script>')
  .replace(/\s*<script>\s*\/\/ Browsers too old[\s\S]*?<\/script>/, '');
files.set('tv.html', Buffer.from(await localizeHtml(html, root)));
files.set('penguintrack.js', Buffer.from(result.outputFiles[0].text));
files.set('THIRD-PARTY-NOTICES.txt', Buffer.from([
  fs.readFileSync(path.join(root, 'NOTICE.md'), 'utf8'),
  fs.readFileSync(path.join(src, 'LICENSE'), 'utf8'),
  fs.readFileSync(path.join(src, 'vendor/THREE_LICENSE'), 'utf8'),
  fs.readFileSync(path.join(src, 'vendor/fonts/OFL.txt'), 'utf8'),
].join('\n\n')));

const expected = [...files.keys()].sort();
if (check) {
  const actual = walk(out).map(file => path.relative(out, file).split(path.sep).join('/')).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Unexpected distribution inventory');
  for (const [name, bytes] of files) {
    if (!bytes.equals(fs.readFileSync(path.join(out, name)))) throw new Error('Stale distribution file: ' + name);
  }
  console.log('Verified Penguintrack distribution: ' + expected.length + ' files');
} else {
  fs.mkdirSync(out, { recursive: true });
  for (const file of walk(out)) {
    if (!files.has(path.relative(out, file).split(path.sep).join('/'))) fs.unlinkSync(file);
  }
  for (const [name, bytes] of files) {
    const file = path.join(out, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
  }
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  const inputs = Object.keys(result.metafile.inputs).sort().map(name => {
    const bytes = fs.readFileSync(path.resolve(root, name));
    return { path: name, bytes: bytes.length, sha256: sha(bytes) };
  });
  fs.writeFileSync(path.join(root, 'docs/build-inputs.json'), JSON.stringify({
    tool: 'esbuild 0.28.2',
    scope: 'Source bundle inputs; asset inventory and exact bytes verified by build:check.',
    inputs,
    distribution: [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha(bytes) })),
  }, null, 2) + '\n');
  console.log('Built Penguintrack: ' + expected.length + ' files, ' + [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0) + ' bytes');
}
