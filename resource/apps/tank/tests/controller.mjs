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
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, locale: 'zh-CN', hasTouch: true, ...options });
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
async function zonePoint(page, x = .5, y = .5) {
  const rect = await page.locator('#joystick-zone').boundingBox();
  return { clientX: rect.x + rect.width * x, clientY: rect.y + rect.height * y };
}
async function moveStick(page, pointerId, point) {
  // Movement packets are intentionally throttled; advance past that interval.
  await page.waitForTimeout(40);
  await page.locator('#joystick-zone').dispatchEvent('pointermove', { pointerId, pointerType: 'touch', button: 0, buttons: 1, ...point });
}
async function dragStick(page, pointerId, dx, dy, origin) {
  origin = origin || await zonePoint(page);
  await press(page, 'joystick-zone', pointerId, origin);
  await moveStick(page, pointerId, { clientX: origin.clientX + dx, clientY: origin.clientY + dy });
  return origin;
}
async function stickHidden(page) {
  assert.equal(await page.locator('#joystick').isHidden(), true, 'Floating joystick is hidden when not held');
  assert.equal(await page.locator('#joystick-zone').getAttribute('data-active'), 'false');
}
async function stickCenter(page, origin) {
  const rect = await page.locator('#joystick').boundingBox();
  assert.ok(rect && Math.abs(rect.x + rect.width / 2 - origin.clientX) < 1
    && Math.abs(rect.y + rect.height / 2 - origin.clientY) < 1,
  'Floating joystick center matches the original touch point: ' + JSON.stringify({ rect, origin }));
}
async function expectInput(page, expected) {
  await page.waitForFunction(expected => {
    const frame = window.__sent.filter(value => value.type === 'input').at(-1);
    return frame && Object.entries(expected).every(([key, value]) => frame[key] === value);
  }, expected, { timeout: 3000 });
}
async function test(name, run) {
  await run(); passed++; console.log(`PASS ${name}`);
}

try {
  await test('Handshake, authenticated URL, remembered resume token and neutral heartbeat', async () => {
    const { context, page } = await fixture();
    const hello = await page.evaluate(() => ({ url: window.__sockets[0].url, first: window.__sent[0], saved: sessionStorage.getItem('tank-controller:0123456789abcdef0123456789abcdef') }));
    assert.match(hello.url, /\/ws\?room=0123456789abcdef0123456789abcdef$/);
    assert.deepEqual(hello.first, { type: 'hello' });
    assert.equal(hello.saved, 'resume-session-1');
    await stickHidden(page);
    for (const id of ['joystick', 'joystick-thumb'])
      assert.equal(await page.locator('#' + id).evaluate(element => getComputedStyle(element).pointerEvents), 'none', 'Joystick art must not intercept touches');
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
    await dragStick(page, 11, 150, 0);
    await press(page, 'button-a', 12);
    await press(page, 'button-b', 13);
    assert.equal((await input(page)).x, 1); assert.equal((await input(page)).a, true); assert.equal((await input(page)).b, true);
    await release(page, 'button-a', 12);
    assert.equal((await input(page)).a, false); assert.equal((await input(page)).b, true); assert.equal((await input(page)).x, 1);
    await release(page, 'joystick-zone', 11, 'pointercancel');
    assert.equal((await input(page)).x, 0); assert.equal((await input(page)).b, true);
    await stickHidden(page);
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
    const origin = await dragStick(page, 21, 200, 200, await zonePoint(page, .3, .4));
    const diagonal = await input(page);
    assert.ok(Math.abs(diagonal.x - .707) < .002 && Math.abs(diagonal.y - .707) < .002);
    await press(page, 'joystick-zone', 22, await zonePoint(page, .8, .7));
    await moveStick(page, 22, await zonePoint(page, .05, .05));
    await release(page, 'joystick-zone', 22);
    await press(page, 'button-a', 23);
    assert.equal((await input(page)).x, diagonal.x);
    assert.equal((await input(page)).y, diagonal.y);
    await stickCenter(page, origin);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.deepEqual(await input(page), { type: 'input', x: 0, y: 0, a: false, b: false, start: false, select: false, seq: (await input(page)).seq });
    await stickHidden(page);
    await context.close();
  });
  await test('Each touch establishes a neutral center; four directions, deadzone, release and lost capture', async () => {
    const { context, page } = await fixture();
    let pointerId = 60;
    for (const [dx, dy, x, y, fx, fy] of [[180,0,1,0,.15,.25],[-180,0,-1,0,.85,.75],[0,-180,0,-1,.25,.8],[0,180,0,1,.8,.2]]) {
      const origin = await zonePoint(page, fx, fy);
      await press(page, 'joystick-zone', ++pointerId, origin);
      await expectInput(page, { x: 0, y: 0 });
      await stickCenter(page, origin);
      await moveStick(page, pointerId, { clientX: origin.clientX + 1, clientY: origin.clientY + 1 });
      await expectInput(page, { x: 0, y: 0 });
      await moveStick(page, pointerId, { clientX: origin.clientX + dx, clientY: origin.clientY + dy });
      await expectInput(page, { x, y });
      await release(page, 'joystick-zone', pointerId, pointerId % 2 ? 'lostpointercapture' : 'pointerup');
      await expectInput(page, { x: 0, y: 0 });
      await stickHidden(page);
    }
    await context.close();
  });
  await test('Real touchscreen hits the edge of the zone, captures dragging outside, and keeps A/B independent', async () => {
    const { context, page } = await fixture();
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => {
      window.__pointerEvents = [];
      for (const type of ['pointerdown', 'pointermove', 'pointerup'])
        document.addEventListener(type, event => window.__pointerEvents.push({ type, target: event.target.id, trusted: event.isTrusted, pointerId: event.pointerId }), true);
    });
    const touches = new Map();
    async function touch(type, id, x, y) {
      if (type === 'touchEnd') {
        const point = touches.get(id);
        await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [point] });
        touches.delete(id);
      } else {
        touches.set(id, { id, x, y, radiusX: 4, radiusY: 4, force: 1 });
        await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...touches.values()] });
      }
    }
    const zone = await page.locator('#joystick-zone').boundingBox();
    const origin = { clientX: zone.x + 3, clientY: zone.y + zone.height * .55 };
    assert.equal(await page.evaluate(({clientX,clientY}) => document.elementFromPoint(clientX,clientY).id, origin), 'joystick-zone');
    await touch('touchStart', 1, origin.clientX, origin.clientY);
    await expectInput(page, { x: 0, y: 0 });
    await stickCenter(page, origin);
    await touch('touchMove', 1, origin.clientX + 130, origin.clientY);
    await expectInput(page, { x: 1, y: 0 });
    for (const [id, name] of [[2,'button-a'],[3,'button-b']]) {
      const box = await page.locator('#' + name).boundingBox();
      await touch('touchStart', id, box.x + box.width / 2, box.y + box.height / 2);
    }
    await expectInput(page, { x: 1, y: 0, a: true, b: true });
    await touch('touchEnd', 2);
    await expectInput(page, { x: 1, a: false, b: true });
    await touch('touchStart', 4, zone.x + zone.width * .75, zone.y + zone.height * .25);
    await touch('touchMove', 4, zone.x + zone.width * .5, zone.y + zone.height * .15);
    await stickCenter(page, origin);
    await expectInput(page, { x: 1, y: 0, b: true });
    const pointerId = await page.evaluate(() => window.__pointerEvents.find(event => event.type === 'pointerdown' && event.target === 'joystick-zone').pointerId);
    assert.equal(await page.locator('#joystick-zone').evaluate((element,id) => element.hasPointerCapture(id), pointerId), true, 'Real browser pointer capture owns the active stick touch');
    await touch('touchMove', 1, zone.x + zone.width + 40, Math.min(380, zone.y + zone.height + 20));
    await touch('touchEnd', 1);
    await expectInput(page, { x: 0, y: 0, a: false, b: true });
    await stickHidden(page);
    await touch('touchEnd', 3);
    await touch('touchEnd', 4);
    await expectInput(page, { x: 0, y: 0, a: false, b: false });
    const events = await page.evaluate(() => window.__pointerEvents);
    assert.ok(events.length && events.every(event => event.trusted), 'Touch events are browser-generated, not dispatchEvent simulations');
    assert.ok(events.some(event => event.type === 'pointerup' && event.target === 'joystick-zone' && event.pointerId === pointerId), 'Captured release returns to the joystick after leaving its region');
    await cdp.detach();
    await context.close();
  });
  await test('Disconnect releases held input; reconnect resumes same player with fresh sequence', async () => {
    const { context, page } = await fixture();
    await dragStick(page, 30, 150, 0);
    await press(page, 'button-a', 31);
    await page.evaluate(() => window.__sockets.at(-1).close());
    assert.equal(await page.locator('#button-a').isDisabled(), true);
    assert.equal(await page.locator('#button-a').evaluate(el => el.classList.contains('pressed')), false);
    await stickHidden(page);
    await page.waitForFunction(() => window.__sockets.length === 2 && document.querySelector('#controller').dataset.connected === 'true');
    const hello = await page.evaluate(() => window.__sent.filter(x => x.type === 'hello').at(-1));
    assert.equal(hello.session, 'resume-session-1');
    const current = await input(page); assert.equal(current.a, false); assert.equal(current.b, false); assert.equal(current.x, 0); assert.equal(current.y, 0); assert.equal(current.seq, 1);
    await context.close();
  });
  await test('Hidden page sends neutral then closes; visible page reconnects without stuck controls', async () => {
    const { context, page } = await fixture();
    await dragStick(page, 40, 0, -150);
    await press(page, 'button-b', 41);
    await press(page, 'button-start', 42);
    await press(page, 'button-select', 43);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal((await input(page)).b, false);
    assert.equal((await input(page)).start, false);
    assert.equal((await input(page)).select, false);
    assert.equal((await input(page)).x, 0); assert.equal((await input(page)).y, 0);
    await stickHidden(page);
    assert.equal(await page.evaluate(() => window.__sockets.at(-1).readyState), 3);
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.__sockets.length), 1);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => document.querySelector('#controller').dataset.connected === 'true');
    assert.equal((await input(page)).b, false);
    await context.close();
  });
  await test('Resizing during a gesture clears the floating center and the next touch starts neutral', async () => {
    const { context, page } = await fixture();
    await dragStick(page, 71, -150, 0);
    await expectInput(page, { x: -1, y: 0 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectInput(page, { x: 0, y: 0 });
    await stickHidden(page);
    const origin = await zonePoint(page, .75, .65);
    await press(page, 'joystick-zone', 72, origin);
    await expectInput(page, { x: 0, y: 0 });
    await stickCenter(page, origin);
    await release(page, 'joystick-zone', 72);
    await stickHidden(page);
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
  await test('State updates local player stats, fire labels, language and safe text content', async () => {
    const { context, page } = await fixture({ locale: 'en-US' });
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', phase: 'playing', stage: 3, players: [{ id: 1, lives: 2, score: 840, shieldCooldown: 2.6 }, { id: 2, lives: 9, score: 9999 }] }));
    assert.equal(await page.locator('#stage').textContent(), '03');
    assert.equal(await page.locator('#score').textContent(), '0840');
    assert.equal(await page.locator('#lives').textContent(), '2');
    assert.equal(await page.locator('#a-caption').textContent(), 'FIRE');
    assert.equal(await page.locator('#b-caption').textContent(), 'FIRE');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await page.locator('#message').textContent(), /Defend the base/);
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', stage: '<img src=x onerror=alert(1)>', phase: 'unknown', players: [{ id: 1, score: '<svg onload=alert(1)>' }] }));
    assert.equal(await page.locator('#score').textContent(), '0840');
    assert.equal(await page.locator('#stage').textContent(), '03');
    await context.close();
  });
  await test('Portrait and small landscape controls remain in viewport without overlap or scrolling', async () => {
    const { context, page } = await fixture();
    for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const rectangles = await Promise.all(['joystick-zone', 'button-a', 'button-b', 'button-start', 'button-select'].map(id => page.locator(`#${id}`).boundingBox()));
      for (const rect of rectangles) {
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, `${JSON.stringify(viewport)} control outside viewport ${JSON.stringify(rect)}`);
      }
      const overlaps = (p, q) => p.x < q.x + q.width && p.x + p.width > q.x && p.y < q.y + q.height && p.y + p.height > q.y;
      for (let i=0;i<rectangles.length;i++) for (let j=i+1;j<rectangles.length;j++) assert.ok(!overlaps(rectangles[i],rectangles[j]), `overlap at ${JSON.stringify(viewport)} controls ${i}/${j}`);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#joystick-zone')).touchAction), 'none');
      assert.ok(rectangles[0].width >= 100 && rectangles[0].height >= 100, 'The floating joystick has a usable touch region');
      await stickHidden(page);
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
  console.log(`Tank controller: ${passed} scenarios passed.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
