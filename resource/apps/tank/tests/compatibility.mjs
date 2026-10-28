// Regression coverage for Android TV WebViews whose JS engine predates Chrome 80.
// This is a syntax/API compatibility simulation, not a physical-TV test. To verify
// the release package itself, unzip its assets and set TANK_TEST_ASSETS to that folder.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const { transform } = require('esbuild');
const assets = resolve(process.env.TANK_TEST_ASSETS || fileURLToPath(new URL('../src/main/assets/', import.meta.url)));
const html = await readFile(resolve(assets, 'tv.html'), 'utf8');
const tvScripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
assert.ok(tvScripts.length >= 7, 'Inspect dependencies of the actual packaged TV page');
const scripts = (await readdir(assets)).filter(name => name.endsWith('.js'));
const syntaxFailures = [];
for (const name of scripts) {
  const source = await readFile(resolve(assets, name), 'utf8');
  // esbuild lowers template literals to work around an old engine coercion bug;
  // they are nevertheless valid Chrome 61 syntax. Everything else must already
  // be executable without a build-time transform (APK assets ship verbatim).
  const options = { charset: 'utf8', supported: { 'template-literal': true } };
  const modern = await transform(source, { ...options, target: 'esnext' });
  const legacy = await transform(source, { ...options, target: 'chrome61' });
  if (modern.code !== legacy.code) syntaxFailures.push(`${name}: needs syntax lowering for Chrome 61`);
  if (tvScripts.includes(name)) {
    const es2017 = await transform(source, { ...options, target: 'es2017' });
    if (modern.code !== es2017.code) syntaxFailures.push(`${name}: contains syntax newer than ES2017`);
  }
}
assert.deepEqual(syntaxFailures, [], 'Published JavaScript must parse on the supported TV engine');
console.log(`PASS syntax: ${scripts.length} bundled JS files support Chrome 61; TV dependencies support ES2017`);

const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ogg': 'audio/ogg' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
    if (pathname === 'favicon.ico') { response.writeHead(204).end(); return; }
    const file = resolve(assets, pathname || 'tv.html');
    const path = relative(assets, file);
    if (path === '..' || path.startsWith('..' + sep) || !types[extname(file)]) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', types[extname(file)]);
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
let scenarios = 0;

async function pageFor(language, fault = '') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: language });
  const errors = [];
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (!url.startsWith(base + '/') && !/^(data:|blob:)/.test(url)) {
      errors.push('Unexpected external request: ' + url);
      return route.abort();
    }
    if (fault === 'syntax' && url === base + '/game-model.js') {
      // A script parse failure must not leave a silent black arena or stop the
      // independent native-room status polling.
      return route.fulfill({ contentType: 'application/javascript', body: 'function brokenGame( {' });
    }
    if (fault === 'draw' && url === base + '/nes-renderer.js') {
      const source = await readFile(resolve(assets, 'nes-renderer.js'), 'utf8');
      return route.fulfill({ contentType: 'application/javascript', body: source + '\nTankRenderer.prototype.draw = function () { throw new Error("compat-first-frame-failure"); };' });
    }
    return route.continue();
  });
  await context.addInitScript(({ language }) => {
    // APIs commonly available in a desktop browser but absent from older TVs.
    for (const [target, names] of [
      [Array.prototype, ['flatMap', 'flat', 'at', 'findLast', 'findLastIndex', 'toSorted', 'toReversed', 'toSpliced', 'with']],
      [String.prototype, ['replaceAll', 'at', 'matchAll', 'trimStart', 'trimEnd']],
      [Object, ['hasOwn', 'fromEntries', 'groupBy']],
      [Promise, ['allSettled', 'any', 'withResolvers']],
      [Promise.prototype, ['finally']],
    ]) for (const name of names) Object.defineProperty(target, name, { configurable: true, writable: true, value: undefined });
    // Playwright's injected locator code itself requires globalThis; retain that
    // alias here instead of pretending this is a complete legacy browser.
    for (const name of ['structuredClone', 'ResizeObserver', 'OffscreenCanvas'])
      Object.defineProperty(window, name, { configurable: true, writable: true, value: undefined });
    window.__snapshotCalls = 0;
    window.__inputs = [1, 2].map(id => ({ id, connected: false, x: 0, y: 0, a: false, b: false, start: false, select: false }));
    window.TankHost = {
      getInfo: () => JSON.stringify({ language,
        url: 'http://192.168.1.88:38291/?room=compatibility-room-token',
        qr: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Cpath fill="black" d="M0 0h10v10H0z"/%3E%3C/svg%3E',
      }),
      snapshot: () => { window.__snapshotCalls++; return JSON.stringify({ players: window.__inputs }); },
      publish: value => { window.__published = JSON.parse(value); },
    };
  }, { language });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/tv.html');
  return { context, page, errors };
}

async function connection(page, id, connected) {
  await page.evaluate(({ id, connected }) => { window.__inputs[id - 1].connected = connected; }, { id, connected });
  await page.waitForFunction(({ id, connected }) => document.getElementById('player-' + id).classList.contains('connected') === connected,
    { id, connected }, { timeout: 4000 });
  const status = await page.locator('#player-status-' + id).innerText();
  assert.match(status, connected ? /已连接|Connected|生命|LIVES/ : /等待连接|Waiting to connect/);
}

async function press(page, key, until) {
  await page.evaluate(key => { window.__inputs[0][key] = true; }, key);
  try { await page.waitForFunction(until, null, { timeout: 5000 }); }
  finally { await page.evaluate(key => { window.__inputs[0][key] = false; }, key); }
  await page.waitForTimeout(100); // The input edge must clear on at least one game tick.
}

async function pixels(page, minimum) {
  const painted = await page.locator('#battlefield').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) if (Math.max(data[i], data[i + 1], data[i + 2]) > 64) count++;
    const box = canvas.getBoundingClientRect();
    return { count, width: box.width, height: box.height };
  });
  assert.ok(painted.count > minimum, 'The arena contains rendered game pixels, not a black canvas: ' + JSON.stringify(painted));
  assert.ok(painted.width > 200 && painted.height > 200, 'The rendered canvas has visible layout bounds');
}

async function cleanupStopsPolling(page) {
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  const calls = await page.evaluate(() => window.__snapshotCalls);
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(() => window.__snapshotCalls), calls, 'Leaving the game stops room polling');
}

try {
  for (const language of ['zh-CN', 'en-US']) {
    const { context, page, errors } = await pageFor(language);
    try {
      await page.waitForFunction(() => window.TankTV && window.TankTV.game && window.__published);
      assert.equal(await page.locator('#game-loading').isHidden(), true);
      await pixels(page, 500);
      assert.equal(await page.locator('#room-qr').isVisible(), true);
      await connection(page, 1, true);
      await connection(page, 2, true);
      await press(page, 'select', () => window.TankTV.game.menuIndex === 1);
      await press(page, 'start', () => window.TankTV.game.phase === 'stageintro');
      await press(page, 'start', () => !window.TankTV.game.stageSelect);
      await page.waitForFunction(() => window.TankTV.game.phase === 'playing' && window.TankTV.game.players.every(p => p.joined && p.alive));
      await pixels(page, 1000);
      await connection(page, 2, false);
      await connection(page, 1, false);
      await page.waitForFunction(() => window.TankTV.game.phase === 'paused');
      await connection(page, 1, true);
      await page.waitForFunction(() => window.TankTV.game.phase === 'playing');
      assert.deepEqual(errors, [], 'Game must start, draw, and update players without unavailable APIs');
      await cleanupStopsPolling(page);
      scenarios++;
      console.log(`PASS ${language}: legacy APIs absent, visible title/game, both player cards, START, disconnect/reconnect, cleanup`);
    } finally { await context.close(); }
  }
  for (const fault of ['syntax', 'draw']) {
    const { context, page, errors } = await pageFor(fault === 'syntax' ? 'zh-CN' : 'en-US', fault);
    try {
      await page.waitForFunction(() => document.getElementById('game-loading').getAttribute('data-failed') === 'true');
      assert.equal(await page.locator('#game-loading').isVisible(), true, 'Startup failure is visible');
      assert.match(await page.locator('#loading-title').innerText(), /失败|could not|failed/i, 'Failure is not mislabeled as still loading');
      assert.ok((await page.locator('#loading-detail').innerText()).trim().length > 0, 'Failure includes diagnostic detail');
      const bounds = await page.locator('#game-loading').boundingBox();
      assert.ok(bounds && bounds.width > 200 && bounds.height > 200, 'The error overlay fills the visible arena');
      if (fault === 'draw') assert.match(await page.locator('#loading-detail').innerText(), /compat-first-frame-failure/);
      else assert.ok(errors.some(error => /SyntaxError|Unexpected|end of input/i.test(error)), 'A real JavaScript parse error was injected');
      await connection(page, 1, true);
      await connection(page, 2, true);
      await connection(page, 1, false);
      await connection(page, 2, false);
      await cleanupStopsPolling(page);
      scenarios++;
      console.log(`PASS ${fault} failure: visible diagnostic, room status still updates, cleanup`);
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
console.log(`${scenarios} compatibility regression scenarios passed against ${assets}`);
