import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);
const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = path === '/' ? 'controller.html' : path.substring(1);
  if (!['controller.html', 'controller.js', 'controller.css'].includes(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  response.end(await readFile(new URL(file, assets)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/?room=0123456789abcdef0123456789abcdef`;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
let passed = 0;

async function fixture(options = {}) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, locale: 'zh-CN', ...options });
  await context.addInitScript(() => {
    window.__sockets = [];
    window.__sent = [];
    window.__serverMode = 'welcome';
    class FakeSocket extends EventTarget {
      static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
      constructor(url) {
        super(); this.url = url; this.readyState = 0; window.__sockets.push(this);
        setTimeout(() => { if (this.readyState !== 0) return; this.readyState = 1; this.dispatchEvent(new Event('open')); }, 0);
      }
      receive(value) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(value) })); }
      send(raw) {
        if (this.readyState !== 1) throw new Error('socket closed');
        const data = JSON.parse(raw); window.__sent.push(data);
        if (data.type === 'hello') setTimeout(() => {
          if (window.__serverMode === 'full') this.receive({ type: 'error', code: 'room_full' });
          else this.receive({ type: 'welcome', player: 1, session: 'resume-session-1', heartbeatMs: 250 });
        }, 0);
      }
      close() { if (this.readyState === 3) return; this.readyState = 3; this.dispatchEvent(new Event('close')); }
    }
    window.WebSocket = FakeSocket;
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
  return { context, page };
}
async function input(page) { return page.evaluate(() => window.__sent.filter(frame => frame.type === 'input').at(-1)); }
async function press(page, id, pointerId, coordinates = {}) {
  await page.locator(`#${id}`).dispatchEvent('pointerdown', { pointerId, pointerType: 'touch', button: 0, buttons: 1, ...coordinates });
}
async function release(page, id, pointerId, type = 'pointerup') {
  await page.locator(`#${id}`).dispatchEvent(type, { pointerId, pointerType: 'touch', button: 0, buttons: 0 });
}
async function test(name, run) {
  await run(); passed++; console.log(`PASS ${name}`);
}

try {
  await test('Handshake, authenticated URL, remembered resume token and neutral heartbeat', async () => {
    const { context, page } = await fixture();
    const hello = await page.evaluate(() => ({ url: window.__sockets[0].url, first: window.__sent[0], saved: sessionStorage.getItem('jackal-controller:0123456789abcdef0123456789abcdef') }));
    assert.match(hello.url, /\/ws\?room=0123456789abcdef0123456789abcdef$/);
    assert.deepEqual(hello.first, { type: 'hello' });
    assert.equal(hello.saved, 'resume-session-1');
    await page.waitForTimeout(310);
    const neutral = await page.evaluate(() => window.__sent.filter(x => x.type === 'input'));
    assert.ok(neutral.length >= 2, 'Neutral input still heartbeats within stale-input timeout');
    assert.ok(neutral.every(x => x.x === 0 && x.y === 0 && !x.a && !x.b && !x.start && !x.select));
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    assert.equal(await page.evaluate(() => window.__sent[0].session), 'resume-session-1');
    await context.close();
  });
  await test('Three simultaneous touches: joystick + A + B, independently released and cancelled', async () => {
    const { context, page } = await fixture();
    const rect = await page.locator('#joystick').boundingBox();
    await press(page, 'joystick', 11, { clientX: rect.x + rect.width, clientY: rect.y + rect.height / 2 });
    await press(page, 'button-a', 12);
    await press(page, 'button-b', 13);
    assert.equal((await input(page)).x, 1); assert.equal((await input(page)).a, true); assert.equal((await input(page)).b, true);
    await release(page, 'button-a', 12);
    assert.equal((await input(page)).a, false); assert.equal((await input(page)).b, true); assert.equal((await input(page)).x, 1);
    await release(page, 'joystick', 11, 'pointercancel');
    assert.equal((await input(page)).x, 0); assert.equal((await input(page)).b, true);
    await release(page, 'button-b', 13, 'lostpointercapture');
    assert.equal((await input(page)).b, false);
    await context.close();
  });
  await test('NES START and SELECT are independent touch controls and release on cancel or disconnect', async () => {
    const { context, page } = await fixture();
    await press(page, 'button-a', 101);
    await press(page, 'button-start', 102);
    await press(page, 'button-select', 103);
    assert.equal((await input(page)).a, true);
    assert.equal((await input(page)).start, true);
    assert.equal((await input(page)).select, true);
    await release(page, 'button-start', 102, 'pointercancel');
    assert.equal((await input(page)).start, false);
    assert.equal((await input(page)).select, true);
    assert.equal((await input(page)).a, true);
    await release(page, 'button-select', 103, 'lostpointercapture');
    assert.equal((await input(page)).select, false);
    await press(page, 'button-start', 104);
    await press(page, 'button-select', 105);
    await page.evaluate(() => window.__sockets.at(-1).close());
    for (const id of ['button-a','button-b','button-start','button-select']) {
      assert.equal(await page.locator(`#${id}`).isDisabled(), true);
      assert.equal(await page.locator(`#${id}`).evaluate(el=>el.classList.contains('pressed')), false);
    }
    await page.waitForFunction(() => window.__sockets.length===2 && document.querySelector('#controller').dataset.connected==='true');
    assert.equal((await input(page)).start, false);
    assert.equal((await input(page)).select, false);
    assert.equal((await input(page)).a, false);
    await context.close();
  });
  await test('Keyboard maps Enter/Shift to START/SELECT and supports focused control buttons', async () => {
    const { context, page } = await fixture();
    await page.keyboard.down('Enter');
    assert.equal((await input(page)).start, true); assert.equal((await input(page)).a, false);
    await page.keyboard.down('Shift');
    assert.equal((await input(page)).select, true);
    await page.keyboard.up('Enter'); await page.keyboard.up('Shift');
    assert.equal((await input(page)).start, false); assert.equal((await input(page)).select, false);
    await page.locator('#button-select').focus();
    await page.keyboard.down('Enter');
    assert.equal((await input(page)).select, true); assert.equal((await input(page)).start, false);
    await page.keyboard.up('Enter');
    assert.equal((await input(page)).select, false);
    await page.locator('#button-start').focus(); await page.keyboard.down('Space');
    assert.equal((await input(page)).start, true); assert.equal((await input(page)).a, false);
    await page.locator('#button-select').focus();
    assert.equal((await input(page)).start, false);
    await page.keyboard.up('Space');
    await context.close();
  });
  await test('Joystick clamps diagonal magnitude, ignores second stick pointer and resets on blur', async () => {
    const { context, page } = await fixture();
    const rect = await page.locator('#joystick').boundingBox();
    await press(page, 'joystick', 21, { clientX: rect.x + rect.width * 4, clientY: rect.y + rect.height * 4 });
    await page.waitForTimeout(40);
    const diagonal = await input(page);
    assert.ok(Math.abs(diagonal.x - .707) < .002 && Math.abs(diagonal.y - .707) < .002);
    await press(page, 'joystick', 22, { clientX: rect.x, clientY: rect.y });
    await press(page, 'button-a', 23);
    assert.equal((await input(page)).x, diagonal.x);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.deepEqual(await input(page), { type: 'input', x: 0, y: 0, a: false, b: false, start: false, select: false, seq: (await input(page)).seq });
    await context.close();
  });
  await test('Disconnect releases held input; reconnect resumes same player with fresh sequence', async () => {
    const { context, page } = await fixture();
    await press(page, 'button-a', 31);
    await page.evaluate(() => window.__sockets.at(-1).close());
    assert.equal(await page.locator('#button-a').isDisabled(), true);
    assert.equal(await page.locator('#button-a').evaluate(el => el.classList.contains('pressed')), false);
    await page.waitForFunction(() => window.__sockets.length === 2 && document.querySelector('#controller').dataset.connected === 'true');
    const hello = await page.evaluate(() => window.__sent.filter(x => x.type === 'hello').at(-1));
    assert.equal(hello.session, 'resume-session-1');
    const current = await input(page); assert.equal(current.a, false); assert.equal(current.b, false); assert.equal(current.seq, 1);
    await context.close();
  });
  await test('Hidden page sends neutral then closes; visible page reconnects without stuck controls', async () => {
    const { context, page } = await fixture();
    await press(page, 'button-b', 41);
    await press(page, 'button-start', 42);
    await press(page, 'button-select', 43);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal((await input(page)).b, false);
    assert.equal((await input(page)).start, false);
    assert.equal((await input(page)).select, false);
    assert.equal(await page.evaluate(() => window.__sockets.at(-1).readyState), 3);
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.__sockets.length), 1);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    assert.equal((await input(page)).b, false);
    await context.close();
  });
  await test('Full room gives actionable error, disables controls and retries only on request', async () => {
    const { context, page } = await fixture();
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'error', code: 'room_full' }));
    await page.waitForTimeout(650);
    assert.match(await page.locator('#message').textContent(), /两名玩家/);
    assert.equal(await page.locator('#button-a').isDisabled(), true);
    assert.equal(await page.evaluate(() => window.__sockets.length), 1);
    await page.locator('#retry').click();
    await page.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    assert.equal(await page.evaluate(() => window.__sockets.length), 2);
    await context.close();
  });
  await test('State updates local player stats, grenade cooldown, language and safe text content', async () => {
    const { context, page } = await fixture({ locale: 'en-US' });
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', phase: 'playing', stage: 3, players: [{ id: 1, lives: 2, score: 840, grenadeCooldown: .6, passengers: 5 }, { id: 2, lives: 9, score: 9999 }] }));
    assert.equal(await page.locator('#stage').textContent(), '03');
    assert.equal(await page.locator('#score').textContent(), '0840');
    assert.equal(await page.locator('#lives').textContent(), '2');
    assert.equal(await page.locator('#cargo').textContent(), '5');
    assert.equal(await page.locator('#a-caption').textContent(), '0.6s');
    assert.equal(await page.locator('#b-caption').textContent(), 'MACHINE GUN');
    assert.equal(await page.locator('#button-a').getAttribute('data-cooling'), 'true');
    await page.evaluate(() => window.__sockets.at(-1).receive({type:'state',players:[{id:1,passengers:12,grenadeCooldown:0}]}));
    assert.equal(await page.locator('#cargo').textContent(), '12');
    assert.equal(await page.locator('#a-caption').textContent(), 'GRENADE');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await page.locator('#message').textContent(), /Use A/);
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', stage: '<img src=x onerror=alert(1)>', phase: 'unknown', players: [{ id: 1, score: '<svg onload=alert(1)>' }] }));
    assert.equal(await page.locator('#score').textContent(), '0840');
    assert.equal(await page.locator('#stage').textContent(), '03');
    await context.close();
  });
  await test('Portrait and small landscape controls remain in viewport without overlap or scrolling', async () => {
    const { context, page } = await fixture();
    for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport);
      const rectangles = await Promise.all(['joystick', 'button-a', 'button-b', 'button-start', 'button-select'].map(id => page.locator(`#${id}`).boundingBox()));
      for (const rect of rectangles) {
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, `${JSON.stringify(viewport)} control outside viewport ${JSON.stringify(rect)}`);
      }
      const [stick, a, b] = rectangles;
      const overlaps = (p, q) => p.x < q.x + q.width && p.x + p.width > q.x && p.y < q.y + q.height && p.y + p.height > q.y;
      for (let i=0;i<rectangles.length;i++) for (let j=i+1;j<rectangles.length;j++) assert.ok(!overlaps(rectangles[i],rectangles[j]), `overlap at ${JSON.stringify(viewport)} controls ${i}/${j}`);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#joystick')).touchAction), 'none');
    }
    await context.close();
  });
  await test('Invalid room URL never opens a socket', async () => {
    const { context, page } = await fixture();
    await page.goto(url.replace(/room=.*/, 'room=bad'));
    assert.equal(await page.evaluate(() => window.__sockets.length), 0);
    assert.match(await page.locator('#message').textContent(), /二维码/);
    await context.close();
  });
  console.log(`Jackal controller: ${passed} scenarios passed.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
