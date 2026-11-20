import * as esbuild from 'esbuild';
import fs from 'fs';

const res = await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: process.argv.includes('--dev') ? false : true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  legalComments: 'inline',
  logLevel: 'warning',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = fs.readFileSync('src/index.html', 'utf8').replace('<!--APP_SCRIPT-->', () => `<script>${js}</script>`);
const payload = {
  'dist/tv.html': html,
  'dist/THIRD-PARTY-NOTICES.txt': fs.readFileSync('NOTICE.md','utf8') + '\n\n--- Three.js 0.169.0 ---\n\n' + fs.readFileSync('THREE-LICENSE.txt','utf8'),
};
for (const [file, bytes] of Object.entries(payload)) {
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== bytes) throw new Error(file + ' differs from current sources; run npm run build');
  } else {
    fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync(file, bytes);
    console.log(file, Buffer.byteLength(bytes), 'bytes');
  }
}
if (process.argv.includes('--check')) console.log('build:check passed');
