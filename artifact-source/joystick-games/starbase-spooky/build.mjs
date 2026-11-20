import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const argument = process.argv.indexOf('--output');
const output = argument < 0 ? path.join(root, 'dist') : path.resolve(process.argv[argument + 1]);
const check = process.argv.includes('--check');

async function paths(directory, prefix = '') {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await paths(path.join(directory, entry.name), name + '/'));
    else if (entry.isFile()) result.push(name);
    else throw new Error('Unsupported file: ' + name);
  }
  return result.sort();
}

const js = await build({ absWorkingDir: root, entryPoints: ['src/js/main.js'],
  bundle: true, write: false, minify: true, target: 'es2020', format: 'iife', legalComments: 'inline' });
const template = await fs.readFile(path.join(root, 'src/index.html'), 'utf8');
const css = await fs.readFile(path.join(root, 'src/style.css'), 'utf8');
const html = template.replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
const files = new Map([['tv.html', Buffer.from(html)],
  ['THIRD-PARTY-NOTICES.txt', await fs.readFile(path.join(root, 'NOTICE.md'))]]);
for (const dir of ['art', 'audio']) {
  for (const name of await paths(path.join(root, 'src', dir))) {
    if (!/\.(webp|mp3)$/.test(name)) continue;
    files.set(dir + '/' + name, await fs.readFile(path.join(root, 'src', dir, name)));
  }
}
if (check) {
  const actual = await paths(output);
  if (JSON.stringify(actual) !== JSON.stringify([...files.keys()].sort())) throw new Error('Unexpected dist tree');
}
for (const [name, data] of files) {
  const dest = path.join(output, name);
  if (check) {
    if (!(await fs.readFile(dest)).equals(data)) throw new Error('Stale dist/' + name);
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
  }
}
console.log((check ? 'Verified ' : 'Built ') + files.size + ' offline files');
