import { build } from 'esbuild';
import fs from 'node:fs';
import { localizeHtml } from '../shared/web/localize-html.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(root, name));
const files = new Map();
async function bundle(entry) {
  const built = await build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
    minify: true, format: 'iife', target: 'es2020', legalComments: 'eof' });
  return Buffer.from(built.outputFiles[0].contents);
}
const audio = {};
function collect(dir) {
  for (const name of fs.readdirSync(path.join(root, dir)).sort()) {
    const file = dir + '/' + name;
    if (fs.statSync(path.join(root, file)).isDirectory()) collect(file);
    else if (name.endsWith('.mp3')) audio[file.slice(4)] = 'data:audio/mpeg;base64,' + read(file).toString('base64');
    else if (/\.(png|jpg)$/.test(name)) {
      if (files.has(name)) throw Error('Duplicate asset filename ' + name);
      files.set(name, read(file));
    }
  }
}
collect('src/assets');
files.set('audio-bank.js', Buffer.from('window.BloomAudio=Object.freeze(' + JSON.stringify(audio) + ');\n'));
const font = 'data:font/ttf;base64,' + read('src/fonts/Fredoka.ttf').toString('base64');
const html = read('src/index.html').toString().replace('fonts/Fredoka.ttf', font);
files.set('tv.html', Buffer.from(await localizeHtml(html, root)));
files.set('bloom-hop.js', await bundle('src/main.js'));
files.set('hint-worker.js', await bundle('src/solve-worker.js'));
files.set('THIRD-PARTY-NOTICES.txt', Buffer.from(['NOTICE.md', 'LICENSE', 'src/fonts/OFL.txt', 'docs/puretv-LICENSE.txt'].map(read).join('\n\n')));
const dist = path.join(root, 'dist');
if (process.argv.includes('--check')) {
  if (fs.readdirSync(dist).sort().join() !== [...files.keys()].sort().join()) throw Error('Unexpected distribution inventory');
  for (const [name, data] of files) if (!read('dist/' + name).equals(data)) throw Error('Stale ' + name);
} else {
  fs.mkdirSync(dist, { recursive: true });
  for (const [name, data] of files) fs.writeFileSync(path.join(dist, name), data);
}
