// Reproducible single-page payload for the Android and macOS native hosts.
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes('--check');
const outAt = process.argv.indexOf('--output');
const output = outAt >= 0 ? path.resolve(process.argv[outAt + 1]) : path.join(root, 'dist');
const result = await esbuild.build({
  absWorkingDir: root, entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true,
  sourcemap: false, target: ['es2020'], write: false, legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
const js = result.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8')
  .replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const files = {
  'tv.html': Buffer.from(html),
  'THIRD-PARTY-NOTICES.txt': Buffer.from(fs.readFileSync(path.join(root, 'NOTICE.md'), 'utf8') + '\n\nThree.js 0.186.0\n' + fs.readFileSync(path.join(root, 'node_modules/three/LICENSE'), 'utf8')),
};
if (check) {
  const existing = fs.readdirSync(output).sort();
  if (JSON.stringify(existing) !== JSON.stringify(Object.keys(files).sort())) throw new Error('Unexpected or missing dist files');
  for (const [name, data] of Object.entries(files)) {
    if (!data.equals(fs.readFileSync(path.join(output, name)))) throw new Error('Stale dist/' + name);
  }
  console.log('Build consistency passed: ' + Object.keys(files).join(', '));
} else {
  fs.mkdirSync(output, { recursive: true });
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(output, name), data);
  console.log('Built ' + output + '/tv.html (' + files['tv.html'].length + ' bytes)');
}
