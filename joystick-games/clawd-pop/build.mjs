import { localizeHtml } from '../shared/web/localize-html.mjs';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { adaptRenderer } from './src/adapt-renderer.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const outArg = process.argv.indexOf('--output');
const output = outArg < 0 ? path.join(root, 'dist') : path.resolve(process.argv[outArg + 1]);
const bridge = await build({ absWorkingDir: root, entryPoints: ['src/controller.js'], bundle: true,
  format: 'iife', target: 'es2020', write: false, minify: true });
const adaptedHtml = read('src/upstream/index.html')
  .replace('data-webgl="./assets/index-k-Lt3pSE.js" data-webgpu="./assets/webgpu-Dqd78nLy.js"', 'data-webgl="webgl.js" data-webgpu="webgpu.js"')
  .replace('if(e==="webgl"||l&&', 'if(!e||e==="auto"||e==="webgl"||l&&')
  .replace('o.type="module",o.src=t', 'o.src=t')
  .replace('<script id="boot-loader"', () => '<script>' + bridge.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>') + '</script>\n  <script id="boot-loader"')
  .replace('Containment has failed. <span', '封锁失效 <span')
  .replace('Pop every specimen · reach the core', '深入实验室，抵达核心')
  .replace('>Start Run<', '>进入实验室<').replace('>Daily Lab<', '>每日挑战<').replace('>Options<', '>选项<')
  .replace('<div class="orientation-note">', '<div class="pad-controls">↑↓ 前后 · ←→ 转向 · A 射击 · B 闪避<br>X + 方向 平移 / 仰俯 · Y 奔跑 · START 暂停</div><div class="orientation-note">')
  .replace('</style>', '.pad-controls{font:12px/1.5 system-ui;color:#9ed8d6;margin-top:8px} #puretv-controller-panel[data-playing=true]{top:auto!important;bottom:12%} #puretv-controller-panel{z-index:35!important} @media(max-height:600px){.pad-controls{font-size:11px;margin-top:4px}} </style>');
const template = await localizeHtml(adaptedHtml, root);
// The upstream hashes cover the unmodified boot script and stylesheet.
// Keep scripts pinned to their exact generated content. The shared controller
// renders additional styles for its identity cards and QR panel at runtime.
const hashes = [...template.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map(([, script]) => "'sha256-" + createHash('sha256').update(script).digest('base64') + "'");
const html = template.replace(/script-src 'self' '[^']+'; style-src '[^']+'/,
  "script-src 'self' " + hashes.join(' ') + "; style-src 'unsafe-inline'; connect-src 'self'");
const files = {
  'tv.html': html, 'webgl.js': adaptRenderer(read('src/upstream/webgl.js')), 'webgpu.js': adaptRenderer(read('src/upstream/webgpu.js')),
  'THIRD-PARTY-NOTICES.txt': read('NOTICE.md') + '\n' + read('LICENSE')
};
if (process.argv.includes('--check')) {
  if (fs.readdirSync(output).sort().join() !== Object.keys(files).sort().join()) throw Error('Unexpected dist files');
  for (const [name, data] of Object.entries(files))
    if (!fs.readFileSync(path.join(output, name)).equals(Buffer.from(data))) throw Error('Stale dist/' + name);
} else {
  fs.mkdirSync(output, { recursive: true });
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(output, name), data);
}
