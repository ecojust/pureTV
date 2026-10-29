import { assertControllerLayout, verifyBlindTouchZones, overlaps } from './controller-zones.mjs';
// Browser regression tests for the bundled modern game pages and native-room protocol.
// Screenshots are actual Chromium renders with a simulated Android bridge, not TV captures.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const { transform } = require('esbuild');
const launchOptions = () => ({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

export async function runControllerTests({ kind }) {
const assets = pathToFileURL(gameConfig(kind).assets + '/');
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
  if(process.env.MODERN_TEST_FILTER&&!new RegExp(process.env.MODERN_TEST_FILTER,'i').test(name))return;
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
  await test('START and SELECT are independent touch controls and release on cancel or disconnect', async () => {
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
    const stopped = await page.evaluate(() => {
      window.__sockets.at(-1).close();
      // Observe the closed state before the scheduled reconnect can succeed.
      return ['button-a','button-b','button-start','button-select'].map(id => {
        const button = document.getElementById(id);
        return { id, disabled: button.disabled, pressed: button.classList.contains('pressed') };
      });
    });
    for (const button of stopped) {
      assert.equal(button.disabled, true, button.id + ' is disabled on disconnect');
      assert.equal(button.pressed, false, button.id + ' is released on disconnect');
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
  await test('Real touchscreen covers the full action zones, holds independent fingers and prevents long-press selection', async () => {
    const { context, page } = await fixture();
    await verifyBlindTouchZones(page);
    await context.close();
  });
  await test('Disconnect releases held input; reconnect resumes same player with fresh sequence', async () => {
    const { context, page } = await fixture();
    await dragStick(page, 30, 150, 0);
    await press(page, 'button-a', 31);
    const stopped=await page.evaluate(()=>{window.__sockets.at(-1).close();return {disabled:document.getElementById('button-a').disabled,pressed:document.getElementById('button-a').classList.contains('pressed'),stickHidden:getComputedStyle(document.getElementById('joystick')).visibility==='hidden'||getComputedStyle(document.getElementById('joystick')).display==='none'};});
    assert.equal(stopped.disabled,true);assert.equal(stopped.pressed,false);assert.equal(stopped.stickHidden,true);
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
  await test('Localized actions, independent player state, safe text and concurrent controls', async () => {
    const {context,page}=await fixture({locale:'en-US'});
    const packet={type:'state',phase:'playing',selectedPlayers:2,players:[
      {id:1,joined:true,active:true,stageLabel:'SUNSHORE CIRCUIT',lap:2,rank:3,item:'boost',score:42,coins:42,tool:'rod',bagCount:7,bagCapacity:12},
      {id:2,joined:true,active:true,stageLabel:'P2 PLACE',lap:1,rank:8,item:'shield',score:900,coins:900,tool:'hand',bagCount:1,bagCapacity:12}]};
    await page.evaluate(packet=>window.__sockets.at(-1).receive(packet),packet);
    assert.equal(await page.locator('#stage').textContent(),'SUNSHORE CIRCUIT','Status shows the assigned player location');
    assert.equal(Number(await page.locator('#score').textContent()),kind==='coast-kart'?3:42,'Status shows the assigned player rank/coins');
    if(kind==='coast-kart'){assert.match(await page.locator('#lap').textContent(),/2/);assert.match(await page.locator('#item').textContent(),/BOOST/i);}
    else{assert.match(await page.locator('#tool').textContent(),/ROD/i);assert.match(await page.locator('#bag').textContent(),/7.*12/);}
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.doesNotMatch(await page.locator('body').innerText(),/[\u3400-\u9fff]/);
    assert.match(await page.locator('#a-caption').textContent(),kind==='coast-kart'?/ITEM/:/USE|INTERACT/);
    assert.match(await page.locator('#b-caption').textContent(),kind==='coast-kart'?/DRIFT/:/BAG/);
    for(const id of ['button-a','button-b'])assert.equal(await page.locator('#'+id).isEnabled(),true,'Both joined players retain action controls');
    await dragStick(page,201,150,0);await press(page,'button-a',202);await press(page,'button-b',203);
    await expectInput(page,{x:1,a:true,b:true});
    packet.players[1].active=true;
    await page.evaluate(packet=>window.__sockets.at(-1).receive(packet),packet);
    await expectInput(page,{x:1,a:true,b:true});
    assert.doesNotMatch(await page.locator('#play-status').innerText(),/WAITING.*TURN|YOUR TURN/);
    await release(page,'joystick-zone',201);await release(page,'button-a',202);await release(page,'button-b',203);
    packet.players[0].stageLabel='<img src=x onerror=alert(1)>';
    await page.evaluate(packet=>window.__sockets.at(-1).receive(packet),packet);
    assert.equal(await page.locator('#stage img').count(),0,'Untrusted status strings are text, not HTML');
    assert.equal(await page.locator('#stage').textContent(),packet.players[0].stageLabel);
    await context.close();
  });
  await test('Both player assignments keep joystick and A/B available during simultaneous play', async () => {
    const {context,page}=await fixture({locale:'en-US'});
    await page.evaluate(()=>{
      window.__sockets.at(-1).receive({type:'welcome',player:2,session:'resume-session-2',heartbeatMs:250});
      window.__sockets.at(-1).receive({type:'state',phase:'playing',selectedPlayers:2,players:[{id:1,joined:true,active:true},{id:2,joined:true,active:true}]});
    });
    assert.equal(await page.locator('#button-a').isEnabled(),true);
    assert.equal(await page.locator('#button-b').isEnabled(),true);
    await dragStick(page,204,-150,0);await press(page,'button-a',205);await press(page,'button-b',206);
    await expectInput(page,{x:-1,y:0,a:true,b:true});
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await expectInput(page,{x:0,y:0,a:false,b:false,start:false,select:false});await stickHidden(page);
    await page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'results',selectedPlayers:2,players:[{id:1,joined:true},{id:2,joined:true}]}));
    assert.equal(await page.locator('#button-a').isDisabled(),true);assert.equal(await page.locator('#button-b').isDisabled(),true);
    assert.equal(await page.locator('#button-start').isEnabled(),true);assert.equal(await page.locator('#button-select').isEnabled(),true);
    await press(page,'button-start',207);await expectInput(page,{start:true,a:false,b:false});await release(page,'button-start',207);
    await context.close();
  });
  await test('Portrait and small landscape controls remain in viewport without overlap or scrolling', async () => {
    for (const locale of ['zh-CN','en-US']) {
    const { context, page } = await fixture({locale});
    for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 320, height: 568 }, {width:568,height:320}, {width:1366,height:768}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await assertControllerLayout(page, viewport);
      await stickHidden(page);
      for(const label of ['STAGE 1 · GATE OF DAWN','STAGE 16 · THE VERY LONG ROYAL PALACE FINAL CHAMBER']) {
        await page.evaluate(stageLabel=>window.__sockets.at(-1).receive({type:'state',phase:'playing',selectedPlayers:2,players:[{id:1,joined:true,active:true,lap:2,rank:3,item:'boost',score:42,coins:42,tool:'rod',bagCount:7,bagCapacity:12,stageLabel}]}),label);
        assert.equal(await page.locator('#stage').getAttribute('title'),label,'Full stage remains available despite visual ellipsis');
        const statBoxes=await Promise.all(['#stage',...(kind==='coast-kart'?['#lap','#score']:['#tool','#score']),'.brand','.connection','#fullscreen'].map(selector=>page.locator(selector).boundingBox()));
        for(const box of statBoxes)assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+.5&&box.y+box.height<=viewport.height+.5,'Long stage outside viewport: '+JSON.stringify({viewport,label,box}));
        for(let i=0;i<statBoxes.length;i++)for(let j=i+1;j<statBoxes.length;j++)assert.ok(!overlaps(statBoxes[i],statBoxes[j]),'Long stage overlaps status/header: '+JSON.stringify({viewport,label,statBoxes}));
        const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
        assert.ok(overflow.width<=viewport.width&&overflow.height<=viewport.height,'Long stage causes page scrolling: '+JSON.stringify({viewport,overflow}));
      }
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
  const name={'coast-kart':'CoastKart','cozy-island':'CozyIsland'}[kind];
  assert.ok(name,'Known modern game');
  const env=kind.toUpperCase().replace(/-/g,'_');
  return {kind,name,api:name+'TV',bridge:name+'Host',
    assets:resolve(process.env[env+'_TEST_ASSETS']||fileURLToPath(new URL('../../resource/apps/'+kind+'/src/main/assets/',import.meta.url))),
    output:resolve(process.env[env+'_UI_CAPTURE_DIR']||'/tmp/puretv-'+kind+'-previews')};
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
    window.__activeIntervals=[];
    const nativeInterval=window.setInterval.bind(window),nativeClearInterval=window.clearInterval.bind(window);
    window.setInterval=(callback,delay,...args)=>{const id=nativeInterval(callback,delay,...args);window.__activeIntervals.push(id);return id;};
    window.clearInterval=id=>{window.__activeIntervals=window.__activeIntervals.filter(value=>value!==id);nativeClearInterval(id);};
    window.__animationFrames=0;
    const nativeRaf=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>nativeRaf(now=>{window.__animationFrames++;callback(now);});
    window.__audioContexts = [];
    const OriginalAudioContext = window.AudioContext;
    if (OriginalAudioContext) window.AudioContext = class extends OriginalAudioContext {
      constructor(...args) { super(...args); window.__audioContexts.push(this); }
    };
    window.__snapshotCalls = 0;
    window.__inputs = [1,2].map(id => ({id,connected:false,x:0,y:0,a:false,b:false,start:false,select:false}));
    window[bridge] = {
      getInfo: () => JSON.stringify({language,qr,url:'http://192.168.1.88:38291/?room=modern-preview-room-token'}),
      snapshot: () => { window.__snapshotCalls++; return JSON.stringify({players:window.__inputs}); },
      publish: raw => { window.__published = JSON.parse(raw); },
    };
  },{bridge:config.bridge,language,qr,legacy});
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
  const label=await page.locator('#player-status-'+id).innerText();
  assert.ok(label.trim().length>0,'Player connection/status card is readable');
  if(connected)assert.doesNotMatch(label,/等待连接|Waiting to connect/);
  else assert.match(label,/等待连接|Waiting to connect/);
}

async function addPhone(browser,tv,base,language,id,errors) {
  const context = await browser.newContext({viewport:{width:844,height:390},locale:language,hasTouch:true});
  await context.exposeBinding('__roomMessage',async(_source,message) => tv.evaluate(({message,id}) => {
    const player = window.__inputs[id-1];
    if (message.type==='hello') {player.connected=true;return window.__published;}
    if (message.type==='input') Object.assign(player,{connected:true,x:message.x,y:message.y,a:!!message.a,b:!!message.b,start:!!message.start,select:!!message.select});
    if (message.type==='closed') Object.assign(player,{connected:false,x:0,y:0,a:false,b:false,start:false,select:false});
    return window.__published;
  },{message,id}));
  await context.addInitScript(({id}) => {
    window.__networkAvailable=true;window.__sockets=[];
    class RoomSocket extends EventTarget {
      static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
      constructor(){super();this.readyState=0;this.queue=Promise.resolve();window.__sockets.push(this);setTimeout(()=>{if(!window.__networkAvailable){this.close();return;}this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
      receive(value){if(this.readyState===1)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));}
      send(raw){const message=JSON.parse(raw);this.queue=this.queue.then(()=>window.__roomMessage(message)).then(state=>{if(message.type==='hello'){this.receive({type:'welcome',player:id,session:'modern-player-'+id,heartbeatMs:250});}if(state)this.receive({type:'state',...state});});}
      close(){if(this.readyState===3)return;this.readyState=3;this.queue=this.queue.then(()=>window.__roomMessage({type:'closed'}));this.dispatchEvent(new Event('close'));}
    }
    window.WebSocket=RoomSocket;
  },{id});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/controller.html?room=modern-preview-room-token');
  await page.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
  return {context,page};
}

async function stopPhone(phone) {
  await phone.page.evaluate(async()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));await Promise.all(window.__sockets.map(socket=>socket.queue));});
}
async function reconnectPhone(phone) {
  await stopPhone(phone);await phone.page.reload();
  await phone.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
}
async function visiblePixels(page) {
  const result=await page.locator('#battlefield').evaluate(canvas=>{
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let pixels=0;const colors={};for(let i=0;i<data.length;i+=16){if(Math.max(data[i],data[i+1],data[i+2])>64)pixels++;colors[(data[i]>>4)+','+(data[i+1]>>4)+','+(data[i+2]>>4)]=true;}
    const rect=canvas.getBoundingClientRect();return {pixels,colors:Object.keys(colors).length,width:canvas.width,height:canvas.height,displayWidth:rect.width,displayHeight:rect.height,smoothing:canvas.getContext('2d').imageSmoothingEnabled};
  });
  assert.ok(result.width>=320&&result.height>=180&&Math.abs(result.width/result.height-960/540)<.012,'Canvas backing store preserves declared 960×540 logical aspect: '+JSON.stringify(result));
  assert.ok(result.pixels>10000&&result.colors>40&&result.displayWidth>200&&result.displayHeight>150,'Vivid, visible modern game canvas: '+JSON.stringify(result));
  assert.equal(result.smoothing,true,'Modern scenes retain smooth graphics');
}

async function gameState(page,config) {
  return page.evaluate(({api})=>{
    const g=window[api].game;
    return {phase:g.phase,frame:g.frame===undefined?g.tick:g.frame,selectedPlayers:g.selectedPlayers,clock:g.clock,countdown:g.countdown,time:g.time,day:g.day,pauseReason:g.pauseReason,players:JSON.parse(JSON.stringify(g.players)),status:g.status()};
  },config);
}
async function simulationState(page,config) {
  const state=await gameState(page,config);
  return {players:state.players,clock:state.clock,countdown:state.countdown,time:state.time,day:state.day};
}
async function resizeGame(page,width,height) {
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));});
  const canvas=await page.locator('#battlefield').boundingBox(),side=await page.locator('.sidebar').boundingBox();
  const scroll=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  for(const [name,rect]of [['game',canvas],['sidebar',side]])assert.ok(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+.5&&rect.y+rect.height<=height+.5,'Whole '+name+' visible: '+JSON.stringify({width,height,rect}));
  assert.ok(Math.abs(canvas.width/canvas.height-960/540)<.008,'Modern canvas preserves 16:9 aspect: '+JSON.stringify(canvas));
  assert.ok(scroll.width<=width&&scroll.height<=height,'No TV page scrolling: '+JSON.stringify({width,height,scroll}));
}
async function disconnectPhone(phone) {
  await phone.page.evaluate(()=>{window.__networkAvailable=false;window.__sockets.at(-1).close();});
}
async function verifyPauseAndReconnect(tv,phones,config) {
  await tapControl(phones[0].page,'button-start');await awaitPhase(tv,config,'paused');
  const paused=await simulationState(tv,config);await tv.waitForTimeout(180);
  assert.deepEqual(await simulationState(tv,config),paused,'START pauses the actual simulation');
  await disconnectPhone(phones[1]);await awaitCard(tv,2,false);await reconnectPhone(phones[1]);await awaitCard(tv,2,true);
  assert.equal((await gameState(tv,config)).phase,'paused','Rejoining a participant preserves a manual pause');
  await tapControl(phones[0].page,'button-start');await awaitPhase(tv,config,'playing');
  for(const id of [2,1]) {
    await disconnectPhone(phones[id-1]);await awaitCard(tv,id,false);await awaitPhase(tv,config,'paused');
    const disconnected=await simulationState(tv,config);await tv.waitForTimeout(180);
    assert.deepEqual(await simulationState(tv,config),disconnected,'Either simultaneous participant disconnect freezes gameplay');
    await reconnectPhone(phones[id-1]);await awaitCard(tv,id,true);await awaitPhase(tv,config,'playing');
    assert.ok(await phones[id-1].page.locator('#button-a').isEnabled(),'Rejoined participant can act');
  }
  await tv.evaluate(api=>window[api].suspend(true),config.api);
  const suspended=await gameState(tv,config);assert.ok(Number.isFinite(suspended.frame),'Model exposes a real finite simulation counter');
  await tv.waitForTimeout(180);assert.deepEqual(await gameState(tv,config),suspended,'Native exit confirmation freezes actual model stepping');
  await tv.evaluate(api=>window[api].suspend(false),config.api);
  await tv.waitForFunction(({api,frame})=>{const g=window[api].game;return (g.frame===undefined?g.tick:g.frame)>frame;},{api:config.api,frame:suspended.frame});
}
async function verifyCleanup(tv,phones,config) {
  await tv.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  const before=await tv.evaluate(api=>{const g=window[api].game;return{frame:g.frame===undefined?g.tick:g.frame,raf:window.__animationFrames,polls:window.__snapshotCalls,intervals:window.__activeIntervals.length};},config.api);
  assert.ok(Number.isFinite(before.frame),'Cleanup observes the real model counter');
  await tv.waitForTimeout(450);
  const after=await tv.evaluate(api=>{const g=window[api].game;return{frame:g.frame===undefined?g.tick:g.frame,raf:window.__animationFrames,polls:window.__snapshotCalls,intervals:window.__activeIntervals.length};},config.api);
  assert.deepEqual(after,before,'Pagehide stops model stepping, actual animation callbacks and native polling');
  assert.equal(after.intervals,0,'Pagehide clears every TV interval');
  assert.ok(await tv.evaluate(()=>window.__audioContexts.length>0&&window.__audioContexts.every(context=>context.state==='closed')),'Real game actions exercised audio; pagehide closes every context');
  for(const phone of phones)await stopPhone(phone);
}
async function kartNormalPlay(tv,phones,config) {
  const began=await gameState(tv,config);assert.ok(began.countdown>0,'A real race begins with a countdown');
  const before=began.players.map(p=>p.s);await tv.waitForTimeout(250);
  assert.deepEqual((await gameState(tv,config)).players.map(p=>p.s),before,'Countdown holds every racer at the starting grid');
  await tv.waitForFunction(api=>window[api].game.countdown<=0,config.api,{timeout:6000});
  await tv.waitForFunction(api=>window[api].game.players.every(p=>p.speed>100),config.api,{timeout:4000});
  const initial=(await gameState(tv,config)).players;
  await dragControl(phones[0].page,20,0);await dragControl(phones[1].page,-20,0);
  await tv.waitForFunction(({api,positions})=>{const p=window[api].game.players;return p[0].x>positions[0]+.03&&p[1].x<positions[1]-.03;},{api:config.api,positions:initial.map(p=>p.x)});
  assert.ok((await gameState(tv,config)).players.every((p,i)=>p.s>initial[i].s),'Both player karts auto accelerate at the same time');
  await releaseControl(phones[0].page,'joystick-zone',11);await releaseControl(phones[1].page,'joystick-zone',11);
  await dragControl(phones[0].page,18,0);await pressControl(phones[0].page,'button-b',13);
  await tv.waitForFunction(api=>window[api].game.players[0].drift>.67,config.api,{timeout:3000});
  await releaseControl(phones[0].page,'button-b',13);
  await tv.waitForFunction(api=>window[api].game.players[0].boost>0,config.api);
  await releaseControl(phones[0].page,'joystick-zone',11);
  const speed=(await gameState(tv,config)).players[1].speed;
  await dragControl(phones[1].page,0,120);
  await tv.waitForFunction(({api,speed})=>window[api].game.players[1].speed<speed-35,{api:config.api,speed});
  await releaseControl(phones[1].page,'joystick-zone',11);
  await tv.waitForFunction(api=>window[api].game.players[1].speed>100,config.api);
  console.log('PASS coast-kart normal phone play: countdown, concurrent auto acceleration/steering, B drift boost, down brake');
}
async function kartProgressFixture(tv,phones,config) {
  // Deliberately controlled item grant after all normal-play screenshots. A real
  // phone A press exercises the actual inventory/useItem path and effects.
  await tv.evaluate(api=>{const g=window[api].game;g.players[0].item='shield';g.players[1].item='boost';},config.api);
  await pressControl(phones[0].page,'button-a',71);await pressControl(phones[1].page,'button-a',72);
  await tv.waitForFunction(api=>{const p=window[api].game.players;return p[0].item===null&&p[0].shield>0&&p[1].item===null&&p[1].boost>0;},config.api);
  await releaseControl(phones[0].page,'button-a',71);await releaseControl(phones[1].page,'button-a',72);
  // Ordered checkpoint fixture uses the engine's movement rule; it does not set
  // lap/result flags. Keep the second player racing until both finish.
  const result=await tv.evaluate(api=>{
    const g=window[api].game;const start=g.players.map(p=>p.lap);
    g.players.forEach(p=>{while(!p.finished){const gate=p.nextCheckpoint*g.track.length/4;g.clock+=8;g.advance(p,gate-p.s+.01);}});
    return {start,laps:g.players.map(p=>p.lap),finished:g.players.map(p=>p.finished),checkpoints:g.players.map(p=>p.nextCheckpoint)};
  },config.api);
  assert.ok(result.laps.every(lap=>lap===4)&&result.finished.every(Boolean)&&result.checkpoints.every(value=>value===13),'Three ordered laps finish each human racer');
  await awaitPhase(tv,config,'results');
  const status=await gameState(tv,config);assert.ok(status.players.every(p=>p.score>0),'Results award points to both participants');
  // The fixture finishes immediately, while the phones receive published state
  // asynchronously. Let their results transition release old controls before
  // sending START, then hold it until the real TV model consumes the press.
  for(const phone of phones)await phone.page.waitForFunction(()=>document.getElementById('controller').dataset.state==='finished');
  await pressControl(phones[0].page,'button-start');
  try { await awaitPhase(tv,config,'playing'); }
  finally { await releaseControl(phones[0].page,'button-start'); }
  await tv.waitForFunction(api=>!window.__inputs[0].start&&!window[api].game.previous[1].start,config.api);
  assert.ok((await gameState(tv,config)).countdown>0,'START makes results immediately replayable');
  console.log('PASS coast-kart controlled item/checkpoint fixture: simultaneous A effects, three laps, shared results, replay');
}

export async function runCaptureTests({kind}) {
  const config=gameConfig(kind);await mkdir(config.output,{recursive:true});
  const {server,base}=await assetServer(config.assets),browser=await chromium.launch(launchOptions());let scenarios=0;
  try {
    for(const language of ['zh-CN','en-US']) {
      const suffix=language==='en-US'?'.en':'',errors=[];
      const context=await browser.newContext({viewport:{width:1280,height:720},locale:language});
      await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base+'/')||/^(data:|blob:)/.test(url))return route.continue();errors.push('External request: '+url);return route.abort();});
      await tvBridge(context,config,language);
      const tv=await context.newPage();tv.on('pageerror',error=>errors.push(error.message));tv.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
      await tv.goto(base+'/tv.html');await awaitPhase(tv,config,'title');await visiblePixels(tv);
      assert.equal(await tv.locator('#game-loading').isHidden(),true);
      await tv.screenshot({path:resolve(config.output,kind+'-title'+suffix+'.png')});
      const phones=[await addPhone(browser,tv,base,language,1,errors),await addPhone(browser,tv,base,language,2,errors)];
      await awaitCard(tv,1,true);await awaitCard(tv,2,true);
      assert.equal((await gameState(tv,config)).selectedPlayers,1,'Default title selects 1P');
      if(kind==='coast-kart')await kartTitleControls(tv,phones[0],config);
      await tapControl(phones[0].page,'button-select');await tv.waitForFunction(api=>window[api].game.selectedPlayers===2,config.api);
      await tapControl(phones[0].page,'button-start');await awaitPhase(tv,config,'playing');
      const started=await gameState(tv,config);assert.ok(started.players.every(p=>p.joined),'Both selected participants join the actual world');
      for(const phone of phones){assert.ok(await phone.page.locator('#button-a').isEnabled());assert.ok(await phone.page.locator('#button-b').isEnabled());assert.doesNotMatch(await phone.page.locator('#play-status').innerText(),/WAITING.*TURN|YOUR TURN/);}
      if(kind==='coast-kart')await kartNormalPlay(tv,phones,config);else await islandNormalPlay(tv,phones,config);
      await verifyPauseAndReconnect(tv,phones,config);
      // Validate sizes while suspended, then capture resumed ordinary gameplay
      // before granting any fixture resources or positions.
      await tv.evaluate(api=>window[api].suspend(true),config.api);
      if(language==='en-US')assert.doesNotMatch(await tv.locator('body').innerText(),/[\u3400-\u9fff]/,'English TV UI is translated');
      for(const [width,height]of [[720,480],[960,540],[1280,720],[1920,1080]]){await resizeGame(tv,width,height);await visiblePixels(tv);}
      await resizeGame(tv,1280,720);await tv.evaluate(api=>window[api].suspend(false),config.api);await awaitPhase(tv,config,'playing');
      await tv.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
      await tv.screenshot({path:resolve(config.output,kind+'-tv'+suffix+'.png'),animations:'disabled'});
      if(language==='en-US')assert.doesNotMatch(await phones[0].page.locator('body').innerText(),/[\u3400-\u9fff]/,'English phone UI is translated');
      assert.equal(await phones[0].page.locator('#joystick').isHidden(),true);
      await phones[0].page.screenshot({path:resolve(config.output,kind+'-controller'+suffix+'.png')});
      await dragControl(phones[0].page,35,-20,91);assert.equal(await phones[0].page.locator('#joystick').isVisible(),true);
      await phones[0].page.screenshot({path:resolve(config.output,kind+'-controller-active'+suffix+'.png'),animations:'disabled'});
      await releaseControl(phones[0].page,'joystick-zone',91);await tv.evaluate(api=>window[api].suspend(false),config.api);
      const saved=kind==='cozy-island'?await islandProgressFixture(tv,phones,config):null;
      if(kind==='coast-kart')await kartProgressFixture(tv,phones,config);
      await verifyCleanup(tv,phones,config);
      if(saved)await islandReload(tv,config,saved);
      assert.deepEqual(errors,[],'No runtime errors or missing bundled assets');
      for(const phone of phones)await phone.context.close();await context.close();scenarios++;
      console.log(`PASS ${kind} ${language}: 2 real simultaneous phones, game actions, pause/reconnect/suspend/exit, four TV sizes`);
    }
  }finally{await browser.close();await new Promise(done=>server.close(done));}
  console.log(`${scenarios} bilingual modern game capture scenarios passed. Screenshots: ${config.output}`);
}

export async function runCompatibilityTests({kind}) {
  const config=gameConfig(kind),html=await readFile(resolve(config.assets,'tv.html'),'utf8');
  const tvScripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(tvScripts.length>=3,'Check dependencies of the actual bundled TV page');
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
      // Local remote use before a phone joins must never mask a later physical
      // controller disconnect by leaving a synthetic P1 connection behind.
      if(!scenario.fault)await page.evaluate(api=>{window[api].key('ArrowLeft',true);window[api].key('ArrowLeft',false);},config.api);
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
        assert.deepEqual(errors,[],'Game starts without unsupported modern APIs');
      }
      for(const id of [1,2]){
        await page.evaluate(id=>{window.__inputs[id-1].connected=false;},id);
        await awaitCard(page,id,false);
        if(!scenario.fault&&id===1)await awaitPhase(page,config,'paused');
      }
      await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
      const calls=await page.evaluate(()=>window.__snapshotCalls),rafCalls=await page.evaluate(()=>window.__animationFrames);await page.waitForTimeout(450);
      assert.equal(await page.evaluate(()=>window.__animationFrames),rafCalls,'Exit cancels actual animation callbacks, even when model setup/drawing failed');
      assert.equal(await page.evaluate(()=>window.__snapshotCalls),calls,'Exit clears independent room polling');
      assert.equal(await page.evaluate(()=>window.__activeIntervals.length),0,'Exit clears every interval after startup success or failure');
      await context.close();scenarios++;
      console.log(`PASS ${kind} compatibility ${scenario.fault||scenario.language}: visible canvas/error, independent players, cleanup`);
    }
  }finally{await browser.close();await new Promise(done=>server.close(done));}
  console.log(`${scenarios} ${kind} compatibility scenarios passed against ${config.assets}`);
}

async function islandNormalPlay(tv,phones,config) {
  for(const phone of phones)await phone.page.waitForFunction(()=>/双手|hands/i.test(document.getElementById('tool').textContent));
  const initial=(await gameState(tv,config)).players;
  await dragControl(phones[0].page,120,0);await dragControl(phones[1].page,-120,0);
  await tv.waitForFunction(({api,positions})=>{const p=window[api].game.players;return p[0].x>positions[0]+.2&&p[1].x<positions[1]-.2;},{api:config.api,positions:initial.map(p=>p.x)});
  await releaseControl(phones[1].page,'joystick-zone',11);
  await tv.waitForFunction(api=>{const p=window[api].game.players[0];return Math.hypot(p.x-13.4,p.y-10.3)<1.25;},config.api,{timeout:3000});
  await releaseControl(phones[0].page,'joystick-zone',11);
  await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[0].menu&&window[api].game.players[0].menu.kind==='craft',config.api);
  assert.equal((await gameState(tv,config)).players[1].menu,null,'P1 workbench interaction does not open P2 menu');
  await tapControl(phones[0].page,'button-b');await tapControl(phones[0].page,'button-b');
  await tapControl(phones[1].page,'button-b');
  await tv.waitForFunction(api=>window[api].game.players[1].menu&&window[api].game.players[1].menu.kind==='bag',config.api);
  assert.equal((await gameState(tv,config)).players[0].menu,null,'P2 owns an independent bag menu');
  await tapControl(phones[1].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[1].menu.kind==='inventory',config.api);
  await tapControl(phones[1].page,'button-b');await tapControl(phones[1].page,'button-b');
  await tapControl(phones[0].page,'button-select');
  assert.equal((await gameState(tv,config)).players[0].tool,'rod','SELECT equips the fishing rod');
  assert.equal((await gameState(tv,config)).players[1].tool,'hand','P2 tool remains independent');
  await tapControl(phones[0].page,'button-select');
  console.log('PASS cozy-island normal phone play: simultaneous movement, reachable workbench interaction, independent bags, A confirm/B back/SELECT tools');
}
async function islandProgressFixture(tv,phones,config) {
  // Controlled positions/resources isolate economy and timing rules after the
  // untouched normal-play previews; all actions still come from real phones.
  await tv.evaluate(api=>{const g=window[api].game,p=g.players[0];p.x=5.5;p.y=9.1;p.location='island';p.tool='hand';p.inventory={};p.menu=null;},config.api);
  await tapControl(phones[0].page,'button-a');
  assert.equal((await gameState(tv,config)).players[0].inventory.fruit,2,'A gathers actual island resources');
  // One deterministic nibble exercises the new timing without a random 4–7s cast.
  await tv.evaluate(api=>{const g=window[api].game,p=g.players[0];p.x=20.2;p.y=11.2;g.random=()=>0.5;},config.api);
  await tapControl(phones[0].page,'button-select');await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>{const f=window[api].game.players[0].fishing;return f&&f.phase==='nibble';},config.api,{timeout:10000});
  assert.equal((await gameState(tv,config)).players[0].inventory.fish,undefined,'A nibble alone does not award a fish');
  await tv.waitForFunction(api=>{const f=window[api].game.players[0].fishing;return f&&f.phase==='bite';},config.api,{timeout:10000});
  await tapControl(phones[0].page,'button-a');
  assert.equal((await gameState(tv,config)).players[0].inventory.fish,1,'Phone A during the bite window catches one fish');
  assert.equal(await tv.evaluate(api=>window[api].game.fishJournal.bass.count,config.api),1,'A real phone catch is recorded in the shared fish journal');
  await tv.evaluate(api=>{window[api].game.players[0].inventory={fruit:window.CozyIslandGame.CAPACITY};},config.api);
  await tapControl(phones[0].page,'button-a');
  const full=(await gameState(tv,config)).players[0];assert.equal(full.fishing,null,'Full bag prevents starting a fishing attempt');
  assert.equal(full.inventory.fruit,24);assert.match(full.message,/满|full/i,'Full bag gives an actionable message');
  await tv.evaluate(api=>{window[api].game.players[0].inventory={fruit:23};},config.api);
  await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>{const f=window[api].game.players[0].fishing;return f&&f.phase==='bite';},config.api,{timeout:10000});
  await tv.evaluate(api=>{window[api].game.players[0].inventory={fruit:24};},config.api);
  await tapControl(phones[0].page,'button-a');
  const fullAtBite=(await gameState(tv,config)).players[0];assert.equal(fullAtBite.fishing,null);assert.deepEqual(fullAtBite.inventory,{fruit:24},'A bag filled during fishing cannot overflow when reeling in');
  assert.match(fullAtBite.message,/满|full/i,'A full bag at the bite window reports the actual reason');
  await tv.evaluate(api=>{const p=window[api].game.players[0];p.x=13.4;p.y=11.3;p.tool='hand';p.inventory={wood:4,stone:1};p.menu=null;},config.api);
  await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[0].menu&&window[api].game.players[0].menu.kind==='craft',config.api);
  await tapControl(phones[0].page,'button-a');
  assert.deepEqual((await gameState(tv,config)).players[0].inventory,{bench:1},'Crafting consumes the exact recipe and creates one bench');
  await tapControl(phones[0].page,'button-b');await tapControl(phones[0].page,'button-b');
  await tapControl(phones[0].page,'button-b');await tapControl(phones[0].page,'button-a');await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[0].menu&&window[api].game.players[0].menu.kind==='place',config.api);
  await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.decorations.length===1,config.api);
  assert.deepEqual((await gameState(tv,config)).players[0].inventory,{},'Placing a crafted decoration removes it from the bag');
  await islandHomeFixture(tv,phones,config);
  const saved=await tv.evaluate(api=>{const g=window[api].game;g.save();return {coins:g.coins,decorations:JSON.parse(JSON.stringify(g.decorations)),inventory:JSON.parse(JSON.stringify(g.players[0].inventory)),players:g.players.map(p=>({x:p.x,y:p.y,location:p.location,inventory:JSON.parse(JSON.stringify(p.inventory))}))};},config.api);
  await tv.evaluate(api=>{window[api].game.random=Math.random;},config.api);
  console.log('PASS cozy-island controlled economy fixture: gathering, nibble/bite timing, fish journal, full bag, phone crafting/decorating');
  return saved;
}
async function islandReload(tv,config,saved) {
  await tv.reload();await awaitPhase(tv,config,'title');await visiblePixels(tv);
  const restored=await tv.evaluate(api=>{const g=window[api].game;return {coins:g.coins,decorations:g.decorations,inventory:g.players[0].inventory,players:g.players.map(p=>({x:p.x,y:p.y,location:p.location,inventory:p.inventory})),recovered:g.saveRecovered};},config.api);
  assert.equal(restored.recovered,false,'Saved island passes full load validation after a real page reload');
  assert.deepEqual({coins:restored.coins,decorations:restored.decorations,inventory:restored.inventory,players:restored.players},saved,'Browser reload restores the actual saved crafting/decorating progress');
  await tv.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  const stopped=await tv.evaluate(()=>({raf:window.__animationFrames,polls:window.__snapshotCalls}));await tv.waitForTimeout(200);
  assert.deepEqual(await tv.evaluate(()=>({raf:window.__animationFrames,polls:window.__snapshotCalls})),stopped,'Reloaded title also shuts down callbacks');
  assert.equal(await tv.evaluate(()=>window.__activeIntervals.length),0);
  console.log('PASS cozy-island browser reload restores saved inventory, coins and placed furniture');
}

async function kartTitleControls(tv,phone,config) {
  for(const [dx,dy,key,value]of [[120,0,'trackIndex',1],[-120,0,'trackIndex',0],[0,120,'modeIndex',1],[0,-120,'modeIndex',0]]) {
    await dragControl(phone.page,dx,dy);
    await tv.waitForFunction(({api,key,value})=>window[api].game[key]===value,{api:config.api,key,value});
    await releaseControl(phone.page,'joystick-zone',11);await tv.waitForTimeout(280);
  }
  console.log('PASS coast-kart title phone controls: left/right course and up/down race mode');
}

async function islandHomeFixture(tv,phones,config) {
  // Only the approach position is a fixture. Phone A enters/exits the real home,
  // while the other phone keeps controlling its separate outdoor character.
  await tv.evaluate(api=>{const p=window[api].game.players[0];p.x=8.5;p.y=8.95;p.location='island';p.tool='hand';p.menu=null;},config.api);
  await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[0].location==='home',config.api);
  const outside=(await gameState(tv,config)).players[1];
  assert.equal(outside.location,'island');await dragControl(phones[1].page,-120,0);
  await tv.waitForFunction(({api,x})=>window[api].game.players[1].x<x-.12,{api:config.api,x:outside.x});
  await releaseControl(phones[1].page,'joystick-zone',11);
  assert.equal((await gameState(tv,config)).players[0].location,'home','P2 outdoor movement leaves P1 inside its home');
  const suffix=await tv.evaluate(()=>document.documentElement.lang==='en'?'.en':'');
  await visiblePixels(tv);await tv.screenshot({path:resolve(config.output,config.kind+'-home-fixture'+suffix+'.png')});
  await tapControl(phones[0].page,'button-b');
  await tv.waitForFunction(api=>window[api].game.players[0].menu&&window[api].game.players[0].menu.kind==='bag',config.api);
  await tv.screenshot({path:resolve(config.output,config.kind+'-home-menu-fixture'+suffix+'.png')});
  await tapControl(phones[0].page,'button-b');await tapControl(phones[0].page,'button-a');
  await tv.waitForFunction(api=>window[api].game.players[0].location==='island',config.api);
  console.log('PASS cozy-island home fixture: real A entry/exit, readable interior/menu, independent P2 outdoors');
}
