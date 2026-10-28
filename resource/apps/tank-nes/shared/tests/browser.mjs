// SPDX-License-Identifier: MIT
// Real packaged browser UI/core with an explicitly simulated Android bridge and
// room WebSocket. HTTP ROM uploads use real fetch/XHR against a local fixture.
// No copyrighted game ROM is downloaded, bundled or required by this test.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const localRequire = createRequire(import.meta.url);
const { controllerRom } = localRequire('./fixtures/controller-rom.cjs');
const { inspectRom } = localRequire('../src/main/assets/nes-adapter.js');
const assets = fileURLToPath(new URL('../src/main/assets/', import.meta.url));
const output = resolve(process.env.NES_UI_CAPTURE_DIR || '/tmp/puretv-nes-previews');
const token = '0123456789abcdef0123456789abcdef';
const testRom = controllerRom();
const qr = `data:image/svg+xml;base64,${(await readFile(new URL('../../../tank/tests/fixtures/room-preview.svg', import.meta.url))).toString('base64')}`;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
let info, loadedRom, activeTv, uploads = [], uploadDelay = 0, romDelayOnce = 0, romRequests = 0;
await mkdir(output, { recursive: true });

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const json = (status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body)); };
    if (url.pathname.startsWith('/api/')) {
      if (url.searchParams.get('room') !== token) return json(403, { error: 'invalid_room' });
      if (url.pathname === '/api/info' && request.method === 'GET') return json(200, info);
      if (url.pathname === '/api/rom' && request.method === 'POST') {
        const body = []; for await (const chunk of request) body.push(chunk);
        const buffer = Buffer.concat(body);
        uploads.push({ origin: request.headers.origin, type: request.headers['content-type'], filename: request.headers['x-rom-name'], bytes: buffer.length, room: url.searchParams.get('room') });
        if (request.headers.origin !== base) return json(403, { error: 'invalid_origin' });
        try { inspectRom(buffer); } catch { return json(400, { error: 'invalid_rom', message: 'Invalid fixture cartridge' }); }
        if (uploadDelay) await new Promise(resolve => setTimeout(resolve, uploadDelay));
        loadedRom = buffer;
        info.rom = { name: decodeURIComponent(request.headers['x-rom-name']), size: buffer.length, revision: String(Date.now()), url: '/rom.nes' };
        await activeTv.evaluate(info => { window.__info = info; window.NesTV.romChanged(info); }, info);
        return json(200, { ok: true, rom: info.rom });
      }
      return json(404, { error: 'not_found' });
    }
    if (url.pathname === '/rom.nes') {
      if (!loadedRom) { response.writeHead(404).end(); return; }
      const bytes = loadedRom, delay = romDelayOnce; romDelayOnce = 0; romRequests++;
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store' }).end(bytes); return;
    }
    if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
    const file = resolve(assets, url.pathname === '/' ? 'controller.html' : decodeURIComponent(url.pathname).slice(1));
    const rel = relative(assets, file);
    if (rel === '..' || rel.startsWith('..' + sep) || !mime[extname(file)]) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] }).end(await readFile(file));
  } catch (error) { response.writeHead(500).end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const failures = [];
let cases = 0;

async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(base + '/') || /^(data:|blob:)/.test(url)) return route.continue();
    failures.push(`Unexpected network request: ${url}`); return route.abort();
  });
  return ctx;
}
async function phase(page, value) {
  await page.waitForFunction(value => window.NesTV?.state.phase === value, value, { timeout: 15000 });
}
async function capture(page, path) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(image => image.offsetWidth).map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path, animations: 'disabled' });
}
async function press(page, id, pointerId = 1, coordinates = {}) {
  await page.locator('#' + id).dispatchEvent('pointerdown', { pointerId, pointerType: 'touch', button: 0, buttons: 1, ...coordinates });
}
async function release(page, id, pointerId = 1, type = 'pointerup') {
  await page.locator('#' + id).dispatchEvent(type, { pointerId, pointerType: 'touch', button: 0, buttons: 0 });
}
async function ram(page, address, expected) {
  await page.waitForFunction(({ address, expected }) => window.NesTV.adapter.nes.cpu.mem[address] === expected, { address, expected });
}
async function stableFrames(page, reason) {
  await phase(page, 'paused');
  const before = await page.evaluate(() => window.NesTV.adapter.frameCount);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.NesTV.adapter.frameCount), before, `${reason} must stop the emulator clock`);
  await page.waitForFunction(() => window.NesTV.audio.context.state === 'suspended');
  assert.equal(await page.evaluate(() => window.NesTV.audio.ring.count), 0, `${reason} must clear queued sound`);
}

try {
  for (const game of ['tank-nes', 'jackal-nes']) for (const language of ['zh', 'en']) {
    const suffix = language === 'en' ? '.en' : '';
    const title = game === 'tank-nes' ? 'Tank NES TV' : 'Jackal NES TV';
    info = { title, game, language, qr, url: `http://192.168.1.88:38291/?room=${token}`, addresses: ['192.168.1.88'], rom: null };
    loadedRom = null; uploads = []; uploadDelay = 0; romDelayOnce = 0; romRequests = 0;
    const tvContext = await context({ viewport: { width: 1280, height: 720 }, locale: language === 'zh' ? 'zh-CN' : 'en-US' });
    await tvContext.addInitScript(({ info, legacyGlobals }) => {
      // Android 8 can have an older WebView even when fetch/Web Audio work.
      // Check the app's fallback separately from syntax transpilation checks.
      if (legacyGlobals) { delete window.AbortController; delete window.globalThis; }
      window.__info = info; window.__pickCount = 0;
      window.__inputs = [1, 2].map(id => ({ id, connected: false, x: 0, y: 0, a: false, b: false, start: false, select: false }));
      window.NesNative = {
        getInfo: () => JSON.stringify(window.__info), snapshot: () => JSON.stringify({ players: window.__inputs }),
        publish: raw => { window.__lastState = JSON.parse(raw); }, pickRom: () => { window.__pickCount++; },
      };
    }, { info, legacyGlobals: game === 'jackal-nes' && language === 'en' });
    const tv = activeTv = await tvContext.newPage();
    const errors = [];
    tv.on('pageerror', error => errors.push(error.message));
    await tv.goto(base + '/tv.html');
    await phase(tv, 'empty');
    assert.equal(await tv.locator('#battlefield').getAttribute('width'), '256');
    assert.equal(await tv.locator('#battlefield').getAttribute('height'), '240');
    await tv.locator('#import-rom').click();
    assert.equal(await tv.evaluate(() => window.__pickCount), 1, 'TV import reaches SAF bridge');
    for (const viewport of [{ width: 720, height: 480 }, { width: 960, height: 540 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
      await tv.setViewportSize(viewport);
      assert.equal(await tv.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true, `${game}/${language} has no page overflow at ${JSON.stringify(viewport)}`);
      const clipped = await tv.evaluate(() => ['room-qr', 'import-rom', 'pause-game', 'restart-game', 'menu-help'].filter(id => {
        const box = document.getElementById(id).getBoundingClientRect();
        return box.x < 0 || box.y < 0 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1;
      }));
      assert.deepEqual(clipped, [], `${game}/${language} TV controls remain visible at ${JSON.stringify(viewport)}`);
    }
    await tv.setViewportSize({ width: 1280, height: 720 });
    await capture(tv, resolve(output, `${game}-tv${suffix}.png`));

    const phoneContext = await context({ viewport: { width: 844, height: 390 }, hasTouch: true, locale: language === 'zh' ? 'zh-CN' : 'en-US' });
    await phoneContext.exposeBinding('__roomMessage', async (_source, message) => tv.evaluate(message => {
      const player = window.__inputs[0];
      if (message.type === 'hello') { player.connected = true; return window.__lastState; }
      if (message.type === 'input') Object.assign(player, { connected: true, x: message.x, y: message.y, a: !!message.a, b: !!message.b, start: !!message.start, select: !!message.select });
      if (message.type === 'closed') Object.assign(player, { connected: false, x: 0, y: 0, a: false, b: false, start: false, select: false });
      return null;
    }, message));
    await phoneContext.addInitScript(() => {
      window.__sockets = []; window.__sent = []; window.__networkAvailable = true;
      class RoomSocket extends EventTarget {
        static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
        constructor(url) {
          super(); this.url = url; this.readyState = 0; this.queue = Promise.resolve(); window.__sockets.push(this);
          setTimeout(() => { if (!window.__networkAvailable) { this.close(); return; } this.readyState = 1; this.dispatchEvent(new Event('open')); }, 0);
        }
        receive(value) { if (this.readyState === 1) this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(value) })); }
        send(raw) {
          const value = JSON.parse(raw); window.__sent.push(value);
          this.queue = this.queue.then(() => window.__roomMessage(value)).then(state => {
            if (value.type === 'hello') { this.receive({ type: 'welcome', player: 1, session: 'fixture-player-1', heartbeatMs: 250 }); this.receive({ type: 'state', ...state }); }
          });
        }
        close() { if (this.readyState === 3) return; this.readyState = 3; this.queue = this.queue.then(() => window.__roomMessage({ type: 'closed' })); this.dispatchEvent(new Event('close')); }
      }
      window.WebSocket = RoomSocket;
    });
    const phone = await phoneContext.newPage();
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(base + '/?room=' + token);
    await phone.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    await phone.waitForFunction(title => document.querySelector('#app-title').textContent === title, title);
    assert.equal(await phone.evaluate(() => new URL(window.__sockets[0].url).searchParams.get('room')), token);
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 844, height: 390 }]) {
      await phone.setViewportSize(viewport);
      const clipped = await phone.evaluate(() => ['joystick', 'button-a', 'button-b', 'button-start', 'button-select', 'import-rom'].filter(id => {
        const box = document.getElementById(id).getBoundingClientRect();
        return box.x < 0 || box.y < 0 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1;
      }));
      assert.deepEqual(clipped, [], `${game}/${language} phone controls remain visible at ${JSON.stringify(viewport)}`);
    }
    await capture(phone, resolve(output, `${game}-controller${suffix}.png`));
    await phone.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', rom: { name: '<img src=x onerror=alert(1)>.nes' } }));
    assert.equal(await phone.locator('#rom-name').textContent(), '<img src=x onerror=alert(1)>.nes');
    assert.equal(await phone.locator('#rom-name img').count(), 0, 'Imported filenames remain text');

    // Real file input, XHR, progress and upload response. Invalid files preserve state.
    await phone.locator('#rom-file').setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: testRom });
    assert.equal(uploads.length, 0);
    await phone.locator('#rom-file').setInputFiles({ name: 'broken.nes', mimeType: 'application/octet-stream', buffer: Buffer.alloc(32) });
    await phone.waitForFunction(() => document.querySelector('#rom-upload').dataset.error === 'true');
    await phone.waitForTimeout(50);
    assert.equal(uploads.length, 1);
    assert.equal(info.rom, null);
    await press(phone, 'button-b', 41);
    uploadDelay = 400;
    await phone.locator('#rom-file').setInputFiles({ name: 'pureTV-authored-controller-test.nes', mimeType: 'application/octet-stream', buffer: testRom });
    await phone.waitForFunction(() => !document.querySelector('#rom-progress').hidden);
    assert.equal(await phone.locator('#button-b').isDisabled(), true, 'Uploading gates all game inputs');
    await phone.waitForFunction(() => { const input = window.__sent.filter(value => value.type === 'input').at(-1); return input && !input.a && !input.b && !input.start && !input.select && input.x === 0 && input.y === 0; });
    await phone.waitForFunction(() => document.querySelector('#rom-name').textContent === 'pureTV-authored-controller-test.nes');
    await phase(tv, 'playing');
    await ram(tv, 0x10, 0); await ram(tv, 0x11, 0);
    assert.deepEqual(uploads.at(-1), { origin: base, type: 'application/octet-stream', filename: 'pureTV-authored-controller-test.nes', bytes: testRom.length, room: token });
    await tv.waitForFunction(() => window.NesTV.adapter.frameCount > 15);
    const pixels = await tv.locator('#battlefield').evaluate(canvas => {
      const bytes = canvas.getContext('2d').getImageData(0, 0, 256, 240).data;
      const colors = new Set(); for (let i = 0; i < bytes.length; i += 4) colors.add(`${bytes[i]},${bytes[i + 1]},${bytes[i + 2]}`);
      return [...colors];
    });
    assert.ok(pixels.length >= 3, 'Real PPU renders the authored checker tiles');
    await tv.waitForFunction(() => window.NesTV.audio.context.state === 'running' && window.NesTV.audio.ring.left.some(sample => Math.abs(sample) > .001));
    assert.equal(await tv.locator('#battlefield').evaluate(canvas => getComputedStyle(canvas).imageRendering), 'pixelated');

    // Touch controls cross the phone protocol, adapter and real emulated $4016.
    await press(phone, 'button-a', 51); await ram(tv, 0x10, 0x80);
    await press(phone, 'button-start', 52); await ram(tv, 0x10, 0x90);
    await press(phone, 'button-select', 53); await ram(tv, 0x10, 0xb0);
    const stick = await phone.locator('#joystick').boundingBox();
    await press(phone, 'joystick', 54, { clientX: stick.x + stick.width, clientY: stick.y });
    await ram(tv, 0x10, 0xb9);
    await release(phone, 'button-a', 51); await release(phone, 'button-start', 52); await release(phone, 'button-select', 53); await release(phone, 'joystick', 54);
    await ram(tv, 0x10, 0);
    await tv.evaluate(() => Object.assign(window.__inputs[1], { connected: true, b: true, select: true, x: -1, y: 1 }));
    await ram(tv, 0x11, 0x66);
    await tv.evaluate(() => Object.assign(window.__inputs[1], { b: false, select: false, x: 0, y: 0 }));
    await ram(tv, 0x11, 0);

    if (game === 'tank-nes' && language === 'en') {
      await tv.evaluate(() => { const label = document.createElement('div'); label.id = 'test-label'; label.textContent = 'DIAGNOSTIC · Original pureTV test ROM · Not Battle City or Jackal'; label.style = 'position:fixed;top:0;left:0;right:0;z-index:100;background:#8d1727;color:white;text-align:center;font:16px sans-serif;padding:8px'; document.body.append(label); });
      await capture(tv, resolve(output, 'nes-diagnostic.png'));
      await tv.locator('#test-label').evaluate(element => element.remove());
    }
    await tv.locator('#pause-game').click(); await stableFrames(tv, 'Manual pause');
    await tv.locator('#pause-game').click(); await phase(tv, 'playing');
    await tv.evaluate(() => window.NesTV.suspend(true)); await stableFrames(tv, 'Native exit dialog');
    await tv.evaluate(() => window.NesTV.suspend(false)); await phase(tv, 'playing');
    await tv.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await stableFrames(tv, 'Hidden TV');
    await tv.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await phase(tv, 'playing');
    await tv.evaluate(() => { window.__inputs[1].connected = false; });
    await stableFrames(tv, 'A joined second player disconnects');
    await tv.evaluate(() => { window.__inputs[1].connected = true; }); await phase(tv, 'playing');

    // A mobile picker can hide the page and temporarily lose its WS. HTTP import
    // must still succeed after file selection, then the controller reconnects.
    await phone.evaluate(() => { window.__networkAvailable = false; window.__sockets.at(-1).close(); });
    await stableFrames(tv, 'Phone disconnect');
    uploadDelay = 0;
    await phone.locator('#rom-file').setInputFiles({ name: 'replacement.nes', mimeType: 'application/octet-stream', buffer: testRom });
    await phone.waitForFunction(() => document.querySelector('#rom-name').textContent === 'replacement.nes');
    await phone.evaluate(() => { window.__networkAvailable = true; });
    await phone.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    await phase(tv, 'playing');
    await phone.evaluate(() => window.dispatchEvent(new Event('blur')));
    await ram(tv, 0x10, 0);
    await tv.evaluate(() => window.NesTV.key('a', true)); await ram(tv, 0x10, 0x80);
    await tv.evaluate(() => window.NesTV.key('a', false)); await ram(tv, 0x10, 0);
    await tv.evaluate(() => { window.__inputs[1].connected = false; });
    await stableFrames(tv, 'P2 disconnect while P1 uses TV keys');
    await tv.evaluate(() => { window.__inputs[1].connected = true; }); await phase(tv, 'playing');

    if (game === 'tank-nes' && language === 'en') {
      // Resolve an obsolete bad ROM response after a newer valid cartridge.
      // The real runtime's abort/generation guard must keep the new cartridge.
      const before = romRequests;
      loadedRom = Buffer.alloc(32); romDelayOnce = 500;
      info.rom = { name: 'obsolete-bad.nes', size: 32, revision: 'obsolete', url: '/rom.nes' };
      await tv.evaluate(info => { window.__info = info; window.NesTV.romChanged(info); }, info);
      for (let n = 0; n < 100 && romRequests === before; n++) await new Promise(resolve => setTimeout(resolve, 10));
      assert.ok(romRequests > before, 'The obsolete fetch actually started');
      loadedRom = testRom;
      info.rom = { name: 'latest-good.nes', size: testRom.length, revision: 'latest', url: '/rom.nes' };
      await tv.evaluate(info => { window.__info = info; window.NesTV.romChanged(info); }, info);
      await phase(tv, 'playing'); await tv.waitForTimeout(600);
      assert.equal(await tv.locator('#rom-name').textContent(), 'latest-good.nes');
      assert.equal(await tv.evaluate(() => window.NesTV.state.phase), 'playing', 'Late obsolete failure cannot replace the current ROM');
    }
    await tv.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await tv.waitForFunction(() => window.NesTV.audio.closed && window.NesTV.audio.context.state === 'closed');
    const finalFrame = await tv.evaluate(() => window.NesTV.adapter.frameCount);
    await tv.waitForTimeout(120);
    assert.equal(await tv.evaluate(() => window.NesTV.adapter.frameCount), finalFrame, 'Page teardown stops RAF emulation');
    assert.equal(await tv.evaluate(() => window.NesTV.adapter.loaded), false);
    assert.deepEqual(errors, [], `${game}/${language} has no JavaScript errors`);
    await phoneContext.close(); activeTv = null; await tvContext.close();
    cases++; console.log(`PASS ${game} ${language}: import UI, HTTP upload, P1/P2 emulation, audio, pause/reconnect and teardown`);
  }
  assert.deepEqual(failures, []);
  console.log(`PASS ${cases} bilingual app scenarios; captures: ${output}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
