import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(process.env.PURETV_PACKAGE || new URL('../../../desktop/package.json', import.meta.url));
export const { chromium } = require('playwright');
export const { PNG } = require('pngjs');
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export function parseArgs(argv = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    assert.ok(argv[i].startsWith('--'), 'Expected --option, received '+argv[i]);
    const name = argv[i].slice(2);
    options[name] = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;
  }
  return options;
}
export async function sourceHashes(directory) {
  const entries = {};
  async function visit(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await visit(file);
      else if (item.isFile()) entries[path.relative(directory, file).split(path.sep).join('/')] = sha256(await readFile(file));
    }
  }
  await visit(directory);
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
}
export async function serveAssets(directory, entry = 'tv.html') {
  const root = path.resolve(directory);
  const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.wav':'audio/wav' };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      const file = path.resolve(root, pathname === '/' ? entry : '.'+pathname);
      if (!file.startsWith(root+path.sep) || !(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
      response.setHeader('content-type', types[path.extname(file)] || 'application/octet-stream');
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: 'http://127.0.0.1:'+server.address().port+'/', close: () => new Promise(resolve => server.close(resolve)) };
}
export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'] });
}
export async function preparePage(browser, url, { metrics = false, viewport = { width:1280, height:720 } } = {}) {
  const context = await browser.newContext({ viewport, locale:'zh-CN', deviceScaleFactor:1 });
  if (metrics) await context.addInitScript({ path: new URL('./render-metrics.js', import.meta.url).pathname });
  const errors = [], network = [], consoleErrors = [];
  await context.route('**/*', route => {
    const target = new URL(route.request().url());
    if (target.origin === new URL(url).origin || ['data:', 'blob:'].includes(target.protocol)) return route.continue();
    network.push({ url:target.href, error:'Unexpected external resource' });
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) network.push({ url:response.url(), status:response.status() }); });
  page.on('requestfailed', request => network.push({ url:request.url(), error:request.failure()?.errorText }));
  await page.goto(url, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.PureTVQA?.snapshot === 'function', null, { timeout:15000 });
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
  return { context, page, errors, network, consoleErrors };
}
export async function snapshot(page) {
  return page.evaluate(() => {
    const state = window.PureTVQA.snapshot();
    if (!state || typeof state !== 'object' || typeof state.phase !== 'string') throw new Error('PureTVQA.snapshot() must return a serializable object with phase');
    return JSON.parse(JSON.stringify(state));
  });
}
export async function tap(page, key, ms = 90) {
  await page.keyboard.down(key); await delay(ms); await page.keyboard.up(key);
}
export async function applyStep(page, step) {
  if (step.type === 'down') await page.keyboard.down(step.key);
  else if (step.type === 'up') await page.keyboard.up(step.key);
  else if (step.type === 'tap') await tap(page, step.key, step.holdMs || 90);
  else if (step.type === 'click') await page.mouse.click(step.x, step.y);
  else throw new Error('Only ordinary keyboard/down/up/tap and mouse/click steps are supported');
}
export async function releaseAll(page, keys) { for (const key of new Set(keys.filter(Boolean))) await page.keyboard.up(key); }
export async function applyKeys(page, requested, held) {
  assert.ok(Array.isArray(requested), 'automation.keys() must return an array of keyboard key names');
  const next = new Set(requested);
  for (const key of next) assert.ok(/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Enter|Space|Escape|[a-zA-Z])$/.test(key), 'Unsupported game key: '+key);
  const changes = [];
  for (const key of held) if (!next.has(key)) { await page.keyboard.up(key); changes.push({type:'up',key}); }
  for (const key of next) if (!held.has(key)) { await page.keyboard.down(key); changes.push({type:'down',key}); }
  held.clear(); for (const key of next) held.add(key);
  return changes;
}
export function verifyErrors(session) {
  assert.deepEqual(session.errors, [], 'Browser page errors');
  assert.deepEqual(session.consoleErrors, [], 'Browser console errors');
  assert.deepEqual(session.network, [], 'Browser network errors');
}
export async function inspectFrame(page, file, selector = 'canvas') {
  const canvas = page.locator(selector).first();
  assert.ok(await canvas.isVisible(), 'Game canvas is visible');
  const bounds = await canvas.boundingBox();
  assert.ok(bounds.width >= 200 && bounds.height >= 100, 'Game canvas has useful dimensions');
  await page.screenshot({ path:file });
  const png = PNG.sync.read(await canvas.screenshot());
  let sum = 0, squares = 0, count = 0; const colors = new Set();
  for (let i = 0; i < png.data.length; i += 4 * 13) {
    const r=png.data[i], g=png.data[i+1], b=png.data[i+2], light=(r+g+b)/3;
    sum+=light; squares+=light*light; count++; colors.add((r>>4)*256+(g>>4)*16+(b>>4));
  }
  const deviation = Math.sqrt(Math.max(0, squares/count-(sum/count)**2));
  assert.ok(colors.size >= 8 && deviation >= 3, 'Canvas appears empty or uniform: '+JSON.stringify({ colors:colors.size, deviation }));
  return { bounds, coarseColors:colors.size, luminanceDeviation:deviation, note:'Automatic blank-frame heuristic; requires separate human visual review.' };
}
export function summarize(values) {
  if (!values.length) return { count:0 };
  const sorted = values.slice().sort((a,b)=>a-b);
  return { count:sorted.length, min:sorted[0], median:sorted[Math.floor((sorted.length-1)*.5)], p95:sorted[Math.ceil((sorted.length-1)*.95)], max:sorted.at(-1), mean:values.reduce((a,b)=>a+b,0)/values.length };
}
export async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args.map(String), { stdio:['ignore','pipe','pipe'] });
    let stdout='', stderr='';
    child.stdout.on('data', chunk => stdout+=chunk); child.stderr.on('data', chunk => stderr+=chunk);
    child.on('error', reject);
    child.on('exit', code => code===0 ? resolve({ stdout, stderr }) : reject(new Error(command+' failed '+code+'\n'+stderr.slice(-6000))));
  });
}
