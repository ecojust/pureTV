import { localizeHtml } from '../shared/web/localize-html.mjs';
import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
process.chdir(fileURLToPath(root));
const result = await build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife',
  target: 'es2020', legalComments: 'none', write: false,
  // The shared adapter also exports CommonJS when tested directly in Node.
  logOverride: { 'commonjs-variable-in-esm': 'silent' },
});
const files = new Map([
  ['tv.html', Buffer.from(await localizeHtml(await readFile('src/tv.html', 'utf8'), fileURLToPath(root)))],
  ['nerd-of-duty.js', result.outputFiles[0].contents],
  ['THIRD-PARTY-NOTICES.txt', Buffer.from(
    'Nerd of Duty / Claude of Duty\n' + await readFile('LICENSE', 'utf8') +
    '\nThree.js\n' + await readFile('src/Three-LICENSE.txt', 'utf8') +
    '\npureTV\n' + await readFile('src/PureTV-LICENSE.txt', 'utf8'))],
]);
if (process.argv.includes('--check')) {
  const actual = (await readdir('dist')).sort();
  if (actual.join() !== [...files.keys()].sort().join()) throw Error('Unexpected dist files');
  for (const [name, bytes] of files)
    if (!(await readFile('dist/' + name)).equals(bytes)) throw Error('Stale dist/' + name);
} else {
  await mkdir('dist', { recursive: true });
  for (const [name, bytes] of files) await writeFile('dist/' + name, bytes);
}
