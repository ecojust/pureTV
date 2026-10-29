import { assertControllerLayout, verifyBlindTouchZones } from './controller-zones.mjs';
// Browser regression tests for the bundled puzzle pages and native-room protocol.
// Screenshots are actual Chromium renders with a simulated Android bridge, not TV captures.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const { transform } = require('esbuild');
const launchOptions = () => ({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

export async function runControllerTests({ kind }) {
const assets = new URL('../../resource/apps/' + kind + '/src/main/assets/', import.meta.url);
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
    const hello = await page.evaluate(controllerKey => ({ url: window.__sockets[0].url, first: window.__sent[0], saved: sessionStorage.getItem(controllerKey) }), kind + '-controller:0123456789abcdef0123456789abcdef');
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
    const disconnectedButtons = await page.evaluate(() => ['button-a','button-b','button-start','button-select'].map(id => {
      const button=document.getElementById(id); return {disabled:button.disabled,pressed:button.classList.contains('pressed')};
    }));
    assert.ok(disconnectedButtons.every(button=>button.disabled&&!button.pressed));
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
  await test('Real touchscreen covers the full action zones, holds independent fingers and prevents long-press selection', async () => {
    const { context, page } = await fixture();
    await verifyBlindTouchZones(page);
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
  await test('Player level/cleared/score, game-specific A/B semantics, English and safe text', async () => {
    const { context, page } = await fixture({ locale: 'en-US' });
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', phase: 'playing', players: [{ id: 1, level: 3, cleared: 12, score: 840 }, { id: 2, level: 9, cleared: 99, score: 9999 }] }));
    assert.equal(Number(await page.locator('#level').textContent()), 3);
    assert.equal(Number(await page.locator('#score').textContent()), 840);
    assert.equal(Number(await page.locator('#cleared').textContent()), 12);
    if (kind === 'jewel') {
      assert.match(await page.locator('#a-caption').textContent(), /CYCLE/i);
      assert.match(await page.locator('#b-caption').textContent(), /CYCLE/i);
    } else {
      assert.match(await page.locator('#a-caption').textContent(), /CW/);
      assert.match(await page.locator('#b-caption').textContent(), /CCW/);
    }
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.doesNotMatch(await page.locator('body').innerText(), /[\u3400-\u9fff]/);
    await page.evaluate(() => window.__sockets.at(-1).receive({ type: 'state', phase: 'unknown', players: [{ id: 1, level: '<img src=x>', cleared: '<svg>', score: '<svg onload=alert(1)>' }] }));
    assert.equal(Number(await page.locator('#score').textContent()), 840);
    assert.equal(Number(await page.locator('#cleared').textContent()), 12);
    assert.equal(Number(await page.locator('#level').textContent()), 3);
    await context.close();
  });
  await test('Portrait and small landscape controls remain in viewport without overlap or scrolling', async () => {
    for (const locale of ['zh-CN','en-US']) {
    const { context, page } = await fixture({locale});
    for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 320, height: 568 }, {width:1366,height:768}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await assertControllerLayout(page, viewport);
      await stickHidden(page);
    }
    await context.close();
    }
  });
  await test('Invalid room URL never opens a socket', async () => {
    const { context, page } = await fixture();
    await page.goto(url.replace(/room=.*/, 'room=bad'));
    assert.equal(await page.evaluate(() => window.__sockets.length), 0);
    assert.match(await page.locator('#message').textContent(), /二维码/);
    await context.close();
  });
  console.log(`${kind} controller: ${passed} scenarios passed.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

}

function gameConfig(kind) {
  assert.ok(['jewel', 'tetris'].includes(kind));
  const name = kind === 'jewel' ? 'Jewel' : 'Tetris';
  return { kind, name, api: name + 'TV', bridge: name + 'Host',
    assets: resolve(process.env[kind.toUpperCase() + '_TEST_ASSETS'] || fileURLToPath(new URL('../../resource/apps/' + kind + '/src/main/assets/', import.meta.url))),
    output: resolve(process.env[kind.toUpperCase() + '_UI_CAPTURE_DIR'] || '/tmp/puretv-' + kind + '-previews') };
}

async function assetServer(assets) {
  const types = { '.js':'application/javascript', '.css':'text/css', '.html':'text/html', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ogg':'audio/ogg', '.wav':'audio/wav' };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
      if (pathname === 'favicon.ico') { response.writeHead(204).end(); return; }
      const file = resolve(assets, pathname || 'controller.html'), path = relative(assets, file);
      if (path === '..' || path.startsWith('..' + sep) || !types[extname(file)]) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', types[extname(file)]);
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  return { server, base: 'http://127.0.0.1:' + server.address().port };
}

async function tvBridge(context, config, language, legacy = false) {
  const qr = 'data:image/svg+xml;base64,' + (await readFile(new URL('../../resource/apps/tank/tests/fixtures/room-preview.svg', import.meta.url))).toString('base64');
  await context.addInitScript(({ bridge, language, qr, legacy }) => {
    if (legacy) {
      for (const [target,names] of [
        [Array.prototype,['flatMap','flat','at','findLast','findLastIndex','toSorted','toReversed','toSpliced','with']],
        [String.prototype,['replaceAll','at','matchAll','trimStart','trimEnd']],
        [Object,['hasOwn','fromEntries','groupBy']],
        [Promise,['allSettled','any','withResolvers']], [Promise.prototype,['finally']],
      ]) for (const name of names) Object.defineProperty(target,name,{configurable:true,writable:true,value:undefined});
      // Playwright itself requires globalThis. This is an API simulation, not an old browser.
      for (const name of ['structuredClone','ResizeObserver','OffscreenCanvas'])
        Object.defineProperty(window,name,{configurable:true,writable:true,value:undefined});
    }
    window.__audioContexts = [];
    const OriginalAudioContext = window.AudioContext;
    if (OriginalAudioContext) window.AudioContext = class extends OriginalAudioContext {
      constructor(...args) { super(...args); window.__audioContexts.push(this); }
    };
    window.__snapshotCalls = 0;
    window.__inputs = [1,2].map(id => ({id,connected:false,x:0,y:0,a:false,b:false,start:false,select:false}));
    window[bridge] = {
      getInfo: () => JSON.stringify({language,qr,url:'http://192.168.1.88:38291/?room=puzzle-preview-room-token'}),
      snapshot: () => { window.__snapshotCalls++; return JSON.stringify({players:window.__inputs}); },
      publish: raw => { window.__published = JSON.parse(raw); },
    };
  },{bridge:config.bridge,language,qr,legacy});
}

async function visiblePixels(page, minimum = 500) {
  const result = await page.locator('#battlefield').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let pixels = 0; for (let i=0;i<data.length;i+=4) if (Math.max(data[i],data[i+1],data[i+2])>64) pixels++;
    const bounds = canvas.getBoundingClientRect();
    return {pixels,width:canvas.width,height:canvas.height,displayWidth:bounds.width,displayHeight:bounds.height};
  });
  assert.equal(result.width,256); assert.equal(result.height,240);
  assert.ok(result.pixels>minimum && result.displayWidth>200 && result.displayHeight>200, 'Visible puzzle canvas: ' + JSON.stringify(result));
}

async function gameState(page, config) {
  return page.evaluate(({api,kind}) => {
    const game = window[api].game;
    return {phase:game.phase,frame:game.frame,selectedPlayers:game.selectedPlayers,players:game.players.map(player => ({
      id:player.id,joined:player.joined,alive:player.alive,connected:player.connected,
      score:player.score,level:player.level,cleared:player.cleared,board:player.board,
      piece:kind==='jewel'?player.active:player.piece,next:kind==='jewel'?player.next:player.nextType,seq:player.seq,
    }))};
  },config);
}

async function pressControl(page,id,pointerId=1,coordinates={}) {
  await page.locator('#'+id).dispatchEvent('pointerdown',{pointerId,pointerType:'touch',button:0,buttons:1,...coordinates});
}
async function releaseControl(page,id,pointerId=1) {
  await page.locator('#'+id).dispatchEvent('pointerup',{pointerId,pointerType:'touch',button:0,buttons:0});
}
async function tapControl(page,id) {
  await pressControl(page,id); await page.waitForTimeout(90); await releaseControl(page,id); await page.waitForTimeout(90);
}
async function dragControl(page,dx,dy,pointerId=11) {
  const box = await page.locator('#joystick-zone').boundingBox();
  const point = {clientX:box.x+box.width*.45,clientY:box.y+box.height*.55};
  await pressControl(page,'joystick-zone',pointerId,point);
  await page.waitForTimeout(40);
  await page.locator('#joystick-zone').dispatchEvent('pointermove',{pointerId,pointerType:'touch',button:0,buttons:1,clientX:point.clientX+dx,clientY:point.clientY+dy});
}
async function awaitPhase(page,config,phase) {
  await page.waitForFunction(({api,phase}) => window[api] && window[api].game && window[api].game.phase===phase,{api:config.api,phase},{timeout:15000});
}
async function awaitCard(page,id,connected) {
  await page.waitForFunction(({id,connected}) => document.getElementById('player-'+id).classList.contains('connected')===connected,{id,connected},{timeout:4000});
  assert.match(await page.locator('#player-status-'+id).innerText(), connected?/已连接|Connected|分|SCORE|Score|级|LEVEL|Level/:/等待连接|Waiting to connect/);
}

async function addPhone(browser,tv,base,language,id,errors) {
  const context = await browser.newContext({viewport:{width:844,height:390},locale:language,hasTouch:true});
  await context.exposeBinding('__roomMessage',async(_source,message) => tv.evaluate(({message,id}) => {
    const player = window.__inputs[id-1];
    if (message.type==='hello') {player.connected=true;return window.__published;}
    if (message.type==='input') Object.assign(player,{connected:true,x:message.x,y:message.y,a:!!message.a,b:!!message.b,start:!!message.start,select:!!message.select});
    if (message.type==='closed') Object.assign(player,{connected:false,x:0,y:0,a:false,b:false,start:false,select:false});
    return null;
  },{message,id}));
  await context.addInitScript(({id}) => {
    window.__networkAvailable=true;window.__sockets=[];
    class RoomSocket extends EventTarget {
      static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
      constructor(){super();this.readyState=0;this.queue=Promise.resolve();window.__sockets.push(this);setTimeout(()=>{if(!window.__networkAvailable){this.close();return;}this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
      receive(value){if(this.readyState===1)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));}
      send(raw){const message=JSON.parse(raw);this.queue=this.queue.then(()=>window.__roomMessage(message)).then(state=>{if(message.type==='hello'){this.receive({type:'welcome',player:id,session:'puzzle-player-'+id,heartbeatMs:250});this.receive({type:'state',...state});}});}
      close(){if(this.readyState===3)return;this.readyState=3;this.queue=this.queue.then(()=>window.__roomMessage({type:'closed'}));this.dispatchEvent(new Event('close'));}
    }
    window.WebSocket=RoomSocket;
  },{id});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/controller.html?room=puzzle-preview-room-token');
  await page.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
  return {context,page};
}

async function resizePuzzle(page,width,height) {
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));});
  await page.waitForFunction(({width,height})=>{
    const canvas=document.getElementById('battlefield'),panel=canvas.parentElement.parentElement;
    const scale=Math.min(panel.clientWidth/canvas.width,panel.clientHeight/canvas.height);
    return innerWidth===width&&innerHeight===height&&canvas.style.width===Math.floor(canvas.width*scale)+'px'&&canvas.style.height===Math.floor(canvas.height*scale)+'px';
  },{width,height},{timeout:5000});
  const frame=await page.locator('#battlefield').boundingBox();
  const side=await page.locator('.sidebar').boundingBox();
  const scroll=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  assert.ok(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=width+.5&&frame.y+frame.height<=height+.5,'Whole game frame visible: '+JSON.stringify({width,height,frame}));
  assert.ok(Math.abs(frame.width/frame.height-256/240)<.005,'NES aspect ratio: '+JSON.stringify(frame));
  assert.ok(side.x>=0&&side.y>=0&&side.x+side.width<=width+.5&&side.y+side.height<=height+.5,'Sidebar visible: '+JSON.stringify(side));
  assert.ok(scroll.width<=width&&scroll.height<=height,'No page scrolling: '+JSON.stringify({width,height,scroll}));
}

async function softDrop(page,phone,config,id=1) {
  const before=(await gameState(page,config)).players[id-1];
  await dragControl(phone,0,120);
  try {
    await page.waitForFunction(({api,kind,id,board,seq})=>{
      const player=window[api].game.players[id-1];
      return kind==='jewel'?player.seq>seq:JSON.stringify(player.board)!==board;
    },{...config,id,board:JSON.stringify(before.board),seq:before.seq},{timeout:15000});
  } finally {
    await releaseControl(phone,'joystick-zone',11);
    await page.waitForFunction(id=>window.__inputs[id-1].x===0&&window.__inputs[id-1].y===0,id);
    assert.equal(await phone.locator('#joystick').isHidden(),true,'Releasing the gesture stops soft drop and hides the stick');
  }
  await page.waitForFunction(({api,kind,id})=>{
    const player=window[api].game.players[id-1];return player.alive&&(kind==='jewel'?player.active:player.piece);
  },{...config,id},{timeout:5000});
}

export async function runCaptureTests({kind}) {
  const config=gameConfig(kind);await mkdir(config.output,{recursive:true});
  const {server,base}=await assetServer(config.assets),browser=await chromium.launch(launchOptions());
  let scenarios=0;
  try {
    for(const language of ['zh-CN','en-US']) {
      const suffix=language==='en-US'?'.en':'',errors=[];
      const context=await browser.newContext({viewport:{width:1280,height:720},locale:language});
      await context.route('**/*',route=>route.request().url().startsWith(base+'/')||/^(data:|blob:)/.test(route.request().url())?route.continue():route.abort());
      await tvBridge(context,config,language);
      const tv=await context.newPage();tv.on('pageerror',error=>errors.push(error.message));
      tv.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
      await tv.goto(base+'/tv.html');await awaitPhase(tv,config,'title');await visiblePixels(tv);
      assert.equal(await tv.locator('#game-loading').isHidden(),true);
      await tv.screenshot({path:resolve(config.output,kind+'-title'+suffix+'.png')});
      const phone1=await addPhone(browser,tv,base,language,1,errors),phone2=await addPhone(browser,tv,base,language,2,errors);
      await awaitCard(tv,1,true);await awaitCard(tv,2,true);
      await tapControl(phone1.page,'button-select');
      await tv.waitForFunction(api=>window[api].game.selectedPlayers===2,config.api);
      await tapControl(phone1.page,'button-start');await awaitPhase(tv,config,'playing');
      const first=await gameState(tv,config);
      assert.ok(first.players.every(player=>player.joined&&player.alive&&player.piece),'Both players have independent active boards');
      assert.deepEqual(first.players[0].board,first.players[1].board,'Both empty fields start equally');
      assert.notEqual(await tv.evaluate(api=>window[api].game.players[0].board===window[api].game.players[1].board,config.api),true,'The players must not share board storage');
      assert.deepEqual(kind==='jewel'?first.players[0].piece.colors:first.players[0].piece.type,kind==='jewel'?first.players[1].piece.colors:first.players[1].piece.type,'Fair first piece');
      assert.deepEqual(first.players[0].next,first.players[1].next,'Fair next piece');
      const originalX=first.players[0].piece.x;
      await dragControl(phone1.page,-120,0);
      await tv.waitForFunction(({api,kind,x})=>{const player=window[api].game.players[0];return(kind==='jewel'?player.active:player.piece).x<x;},{...config,x:originalX});
      await releaseControl(phone1.page,'joystick-zone',11);
      assert.equal((await gameState(tv,config)).players[1].piece.x,first.players[1].piece.x,'Player one movement cannot move player two');
      await dragControl(phone1.page,120,0);
      await tv.waitForFunction(({api,kind,x})=>{const player=window[api].game.players[0];return(kind==='jewel'?player.active:player.piece).x>=x;},{...config,x:originalX});
      await releaseControl(phone1.page,'joystick-zone',11);
      // Choose a naturally spawned piece with a visible ordering/orientation to
      // exercise both action buttons without injecting a board or changing RNG.
      for(let attempt=0;attempt<8;attempt++){
        const p=(await gameState(tv,config)).players[0].piece;
        const observable=kind==='jewel'?new Set(p.colors).size>1:p.type!=='O'&&p.type!==3;
        if(observable)break;
        await softDrop(tv,phone1.page,config);
      }
      const beforeTurn=(await gameState(tv,config)).players[0].piece;
      const signature=piece=>JSON.stringify(kind==='jewel'?piece.colors:piece.rotation);
      await tapControl(phone1.page,'button-a');
      const afterA=(await gameState(tv,config)).players[0].piece;
      assert.notEqual(signature(afterA),signature(beforeTurn),'A visibly changes jewel order or piece orientation');
      await tapControl(phone1.page,kind==='jewel'?'button-a':'button-b');
      const afterB=(await gameState(tv,config)).players[0].piece;
      assert.notEqual(signature(afterB),signature(afterA),'The next action changes jewel order or piece orientation');
      if(kind==='jewel'){
        assert.deepEqual([...afterA.colors].sort(),[...beforeTurn.colors].sort(),'Cycling preserves jewels');
        await tapControl(phone1.page,'button-a');
      }
      assert.equal(signature((await gameState(tv,config)).players[0].piece),signature(beforeTurn),'The documented sequence restores the initial orientation/order');
      // Lock pieces through the phone's down gesture, proving input reaches the
      // actual board; screenshots show normal play, not synthetic board states.
      for(let n=0;n<2;n++){await softDrop(tv,phone1.page,config,1);await softDrop(tv,phone2.page,config,2);}
      assert.ok((await gameState(tv,config)).players.every(p=>p.board.some(row=>row.some(value=>value!==0))),'Soft drop leaves locked pieces on both fields');
      await tapControl(phone1.page,'button-start');await awaitPhase(tv,config,'paused');
      const paused=(await gameState(tv,config)).players;await tv.waitForTimeout(200);
      assert.deepEqual((await gameState(tv,config)).players,paused,'START pauses both puzzle simulations');
      await tapControl(phone1.page,'button-start');await awaitPhase(tv,config,'playing');
      await phone2.page.evaluate(()=>{window.__networkAvailable=false;window.__sockets.at(-1).close();});
      await awaitPhase(tv,config,'paused');await awaitCard(tv,1,true);await awaitCard(tv,2,false);
      const partnerLost=(await gameState(tv,config)).players;await tv.waitForTimeout(200);
      assert.deepEqual((await gameState(tv,config)).players,partnerLost,'One missing active player pauses both boards for a fair match');
      await phone2.page.reload();await phone2.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
      await awaitPhase(tv,config,'playing');await awaitCard(tv,2,true);
      for(const phone of [phone1,phone2])await phone.page.evaluate(()=>{window.__networkAvailable=false;window.__sockets.at(-1).close();});
      await awaitPhase(tv,config,'paused');await awaitCard(tv,1,false);await awaitCard(tv,2,false);
      const disconnected=(await gameState(tv,config)).players;await tv.waitForTimeout(150);
      assert.deepEqual((await gameState(tv,config)).players,disconnected,'Losing both phones pauses their boards');
      for(const phone of [phone1,phone2]){await phone.page.reload();await phone.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');}
      await awaitPhase(tv,config,'playing');await awaitCard(tv,1,true);await awaitCard(tv,2,true);
      await tv.evaluate(api=>window[api].suspend(true),config.api);
      const exitPending=(await gameState(tv,config)).players;await tv.waitForTimeout(150);
      assert.deepEqual((await gameState(tv,config)).players,exitPending,'Native exit confirmation freezes both fields');
      await tv.evaluate(api=>window[api].suspend(false),config.api);
      if(language==='en-US')assert.doesNotMatch(await tv.locator('body').innerText(),/[\u3400-\u9fff]/,'English TV UI is fully translated');
      for(const [width,height] of [[720,480],[960,540],[1280,720],[1920,1080]]){
        await resizePuzzle(tv,width,height);await visiblePixels(tv);
      }
      await resizePuzzle(tv,1280,720);
      await tv.screenshot({path:resolve(config.output,kind+'-tv'+suffix+'.png'),animations:'disabled'});
      for(const phone of [phone1,phone2])await phone.page.evaluate(state=>window.__sockets.at(-1).receive({type:'state',...state}),await tv.evaluate(()=>window.__published));
      if(language==='en-US')assert.doesNotMatch(await phone1.page.locator('body').innerText(),/[\u3400-\u9fff]/,'English controller is fully translated');
      assert.equal(await phone1.page.locator('#joystick').isHidden(),true);
      await phone1.page.screenshot({path:resolve(config.output,kind+'-controller'+suffix+'.png')});
      await dragControl(phone1.page,35,-20,91);
      assert.equal(await phone1.page.locator('#joystick').isVisible(),true);
      await phone1.page.screenshot({path:resolve(config.output,kind+'-controller-active'+suffix+'.png'),animations:'disabled'});
      await releaseControl(phone1.page,'joystick-zone',91);
      for(const phone of [phone1,phone2])await phone.page.evaluate(async()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));await Promise.all(window.__sockets.map(socket=>socket.queue));});
      await tv.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
      const frame=(await gameState(tv,config)).frame,calls=await tv.evaluate(()=>window.__snapshotCalls);
      await tv.waitForTimeout(450);
      assert.equal((await gameState(tv,config)).frame,frame,'Exit stops the game loop');
      assert.equal(await tv.evaluate(()=>window.__snapshotCalls),calls,'Exit stops native-room polling');
      assert.ok(await tv.evaluate(()=>window.__audioContexts.length>0&&window.__audioContexts.every(context=>context.state==='closed')),'Game audio was exercised and exit closes all contexts');
      assert.deepEqual(errors,[],'No runtime errors or missing bundled assets');
      await phone1.context.close();await phone2.context.close();await context.close();
      scenarios++;console.log(`PASS ${kind} ${language}: two real phone pages, fair independent boards, movement, A/B, soft drop, pause/reconnect/exit, four TV sizes`);
    }
  } finally {await browser.close();await new Promise(done=>server.close(done));}
  console.log(`${scenarios} bilingual puzzle capture scenarios passed. Screenshots: ${config.output}`);
}

export async function runCompatibilityTests({kind}) {
  const config=gameConfig(kind),html=await readFile(resolve(config.assets,'tv.html'),'utf8');
  const tvScripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(tvScripts.length>=4,'Check dependencies of the actual bundled TV page');
  const scripts=(await readdir(config.assets)).filter(name=>name.endsWith('.js')),syntaxFailures=[];
  for(const name of scripts){
    const source=await readFile(resolve(config.assets,name),'utf8');
    // Chrome 61 supports template literals; esbuild otherwise rewrites them for
    // an old coercion bug. Remaining target rewrites indicate unsupported syntax.
    const options={charset:'utf8',supported:{'template-literal':true}};
    const modern=await transform(source,{...options,target:'esnext'});
    if(modern.code!==(await transform(source,{...options,target:'chrome61'})).code)syntaxFailures.push(name+': Chrome 61 syntax');
    if(tvScripts.includes(name)&&modern.code!==(await transform(source,{...options,target:'es2017'})).code)syntaxFailures.push(name+': ES2017 syntax');
  }
  assert.deepEqual(syntaxFailures,[],'APK scripts must execute without a build-time transpiler');
  console.log(`PASS ${kind} syntax: ${scripts.length} JavaScript files support Chrome 61; TV dependencies support ES2017`);
  const {server,base}=await assetServer(config.assets),browser=await chromium.launch(launchOptions());
  let scenarios=0;
  try{
    for(const scenario of [{language:'zh-CN'},{language:'en-US'},{language:'zh-CN',fault:'syntax'},{language:'en-US',fault:'draw'}]){
      const context=await browser.newContext({viewport:{width:1280,height:720},locale:scenario.language}),errors=[];
      await tvBridge(context,config,scenario.language,true);
      await context.route('**/*',async route=>{
        const url=route.request().url();
        if(!url.startsWith(base+'/')&&!/^(data:|blob:)/.test(url)){errors.push('External request: '+url);return route.abort();}
        if(scenario.fault==='syntax'&&url===base+'/game-model.js')return route.fulfill({contentType:'application/javascript',body:'function brokenGame( {'});
        if(scenario.fault==='draw'&&url===base+'/renderer.js')return route.fulfill({contentType:'application/javascript',body:await readFile(resolve(config.assets,'renderer.js'),'utf8')+'\n'+config.name+'Renderer.prototype.draw=function(){throw new Error("compat-first-frame-failure");};'});
        return route.continue();
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/tv.html');
      if(scenario.fault){
        await page.waitForFunction(()=>document.getElementById('game-loading').getAttribute('data-failed')==='true');
        assert.equal(await page.locator('#game-loading').isVisible(),true,'Failure must not leave a silent black screen');
        assert.match(await page.locator('#loading-title').innerText(),/失败|could not|failed/i,'Failure must not still say loading');
        assert.ok((await page.locator('#loading-detail').innerText()).trim().length>0);
        const box=await page.locator('#game-loading').boundingBox();
        assert.ok(box.width>200&&box.height>200,'Failure panel fills the visible canvas');
        if(scenario.fault==='draw')assert.match(await page.locator('#loading-detail').innerText(),/compat-first-frame-failure/);
        else assert.ok(errors.some(error=>/SyntaxError|Unexpected|end of input/i.test(error)),'A real script parser failure was injected');
      }else{
        await awaitPhase(page,config,'title');await visiblePixels(page);
        assert.equal(await page.locator('#game-loading').isHidden(),true);
      }
      // These connections are intentionally tested even when the game model or
      // first frame failed: room status must not depend on the game animation.
      for(const id of [1,2]){
        await page.evaluate(id=>{window.__inputs[id-1].connected=true;},id);
        await awaitCard(page,id,true);
      }
      if(!scenario.fault){
        const players=scenario.language==='zh-CN'?1:2;
        if(players===2){
          await page.evaluate(()=>{window.__inputs[0].select=true;});
          await page.waitForFunction(api=>window[api].game.selectedPlayers===2,config.api);
          await page.evaluate(()=>{window.__inputs[0].select=false;});await page.waitForTimeout(80);
        }
        await page.evaluate(()=>{window.__inputs[0].start=true;});await awaitPhase(page,config,'playing');
        await page.evaluate(()=>{window.__inputs[0].start=false;});
        const started=(await gameState(page,config)).players;
        assert.ok(started[0].joined&&started[0].alive);
        assert.equal(started[1].joined,players===2,'Only selected players participate, even if two phones are connected');
        if(players===2)assert.ok(started[1].alive);
        await visiblePixels(page);
        assert.deepEqual(errors,[],'Both boards start without unsupported modern APIs');
      }
      for(const id of [1,2]){
        await page.evaluate(id=>{window.__inputs[id-1].connected=false;},id);
        await awaitCard(page,id,false);
      }
      await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
      const calls=await page.evaluate(()=>window.__snapshotCalls);await page.waitForTimeout(450);
      assert.equal(await page.evaluate(()=>window.__snapshotCalls),calls,'Exit clears independent room polling');
      await context.close();scenarios++;
      console.log(`PASS ${kind} compatibility ${scenario.fault||scenario.language}: visible canvas/error, independent players, cleanup`);
    }
  }finally{await browser.close();await new Promise(done=>server.close(done));}
  console.log(`${scenarios} ${kind} compatibility scenarios passed against ${config.assets}`);
}
