// Synthetic pureTV bridge acceptance. Only normal controller buttons drive gameplay.
import { chromium } from '/dev/shm/joystick-qa-deps/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.TMPDIR = '/dev/shm';
const [slug, attempt = '1'] = process.argv.slice(2);
const root = '/dev/shm/puretv-joystick-games/joystick-games';
const out = path.join(root, slug, 'docs', 'browser-attempt-' + attempt);
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(new URL(import.meta.url), path.join(out, 'executed-browser.mjs'));
const report = { game: slug, syntheticBridge: true, physicalTvTested: false, physicalPhoneTested: false, results: [], failures: [] };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, slug, 'dist', name === '/' ? 'tv.html' : name);
  try { res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/plain'); res.end(fs.readFileSync(file)); }
  catch { res.statusCode=404; res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  env: { ...process.env, TMPDIR: '/dev/shm' } });
try {
 for (const [width, height] of [[960,540], [1280,720]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', req => { if (!req.url().startsWith(base) && !req.url().startsWith('data:')) requests.push(req.url()); });
  await page.addInitScript(() => {
   const buttons = Object.fromEntries(['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'].map(k => [k,false]));
   window.__bridgeFixture = { id: 1, controllerId: 'QA-TRIPTYCH-01', session: 'QA-SESSION-1', connected: true, transport: 'wifi', inputActive: true, cancelSeq: 0, buttons, rssi: -47 };
   window.__bridgeCalls = 0;
   window.PureGameHost = {
    snapshot() { window.__bridgeCalls++; return JSON.stringify({ inputActive: true, players: [window.__bridgeFixture] }); },
    getInfo() { return JSON.stringify({ wifiController: { state:'ready', port:63485, serviceName:'pureTV browser fixture', addresses:['127.0.0.1'] } }); }
   };
  });
  await page.goto(base + '/tv.html');
  await page.waitForFunction(() => window.JoystickGameQA?.snapshot().frames > 3);
  const snap = () => page.evaluate(() => window.JoystickGameQA.snapshot());
  const press = async (keys, hold = 110) => {
   await page.evaluate(keys => { for (const k in __bridgeFixture.buttons) __bridgeFixture.buttons[k] = keys.includes(k); }, keys);
   await page.waitForFunction(keys => keys.every(k => JoystickGameQA.snapshot().controller.buttons[k]), keys);
   await page.waitForTimeout(hold);
   await page.evaluate(() => { for (const k in __bridgeFixture.buttons) __bridgeFixture.buttons[k] = false; });
   await page.waitForFunction(() => Object.values(JoystickGameQA.snapshot().controller.buttons).every(v => !v));
   await page.waitForTimeout(130);
  };
  const menu = await snap(); assert.equal(menu.stage,'menu');
  await page.screenshot({ path: path.join(out, `menu-${width}.png`) });
  await press(['START']);
  if (slug === 'phosphor-patrol') await press(['START']);
  await page.waitForFunction(() => JoystickGameQA.snapshot().stage === 'playing' && JoystickGameQA.snapshot().gameplay.phase === 'play', null, { timeout: 90000 });
  const before = await snap();
  if (slug === 'bubble-nebula') {
    await press(['RIGHT','A','B'], 1400); const after=await snap();
    assert.notEqual(after.gameplay.playerX,before.gameplay.playerX); assert.ok(after.gameplay.blown > before.gameplay.blown);
  } else if (slug === 'phosphor-patrol') {
    await press(['RIGHT','A'], 1400); const after=await snap();
    assert.notEqual(after.gameplay.playerX,before.gameplay.playerX); assert.ok(after.gameplay.shots > before.gameplay.shots);
    await press(['B']); assert.ok((await snap()).gameplay.bombs < before.gameplay.bombs);
    const hyper=await snap(); await press(['X']); assert.notEqual((await snap()).gameplay.playerX,hyper.gameplay.playerX);
  } else {
    await press(['UP','A'], 1600); const after=await snap();
    assert.notEqual(after.gameplay.playerZ,before.gameplay.playerZ); assert.ok(after.gameplay.fires > before.gameplay.fires);
    await press(['RIGHT'], 500); assert.notEqual((await snap()).gameplay.heading,after.gameplay.heading);
  }
  const gameplay = await snap();
  await page.screenshot({ path: path.join(out, `playing-${width}.png`) });
  await press(['START']); assert.equal((await snap()).stage,'paused');
  const paused = await snap(); await page.waitForTimeout(650);
  assert.deepEqual((await snap()).gameplay,paused.gameplay,'Gameplay must freeze during pause');
  await page.screenshot({ path: path.join(out, `paused-${width}.png`) });
  if (slug !== 'phosphor-patrol') {
    await press(['DOWN']); await press(['DOWN']); await press(['A']);
    assert.equal((await snap()).gameplay.screen,'settings');
    const value = await page.locator('#set-sfx').inputValue();
    await press(['LEFT']); assert.notEqual(await page.locator('#set-sfx').inputValue(),value);
    await press(['Y']); assert.equal((await snap()).gameplay.screen,'pause');
  }
  await press(['START']); assert.equal((await snap()).stage,'playing');
  // Focus loss cancels a held action without a release action, then stays paused after focus return.
  await page.evaluate(() => { __bridgeFixture.buttons.A = true; }); await page.waitForTimeout(80);
  await page.evaluate(() => { window.PureGame.focus(false); __bridgeFixture.buttons.A = false; });
  await page.waitForFunction(() => !JoystickGameQA.snapshot().controller.cancelled && Object.values(JoystickGameQA.snapshot().controller.buttons).every(v => !v)); const blurred = await snap(); assert.equal(blurred.stage,'paused');
  await page.evaluate(() => window.PureGame.focus(true)); await page.waitForTimeout(200);
  assert.deepEqual((await snap()).gameplay,blurred.gameplay); await press(['START']);
  // Disconnect and reconnect are not resume gestures.
  await page.evaluate(() => { __bridgeFixture.buttons.RIGHT = true; }); await page.waitForTimeout(80);
  await page.evaluate(() => { __bridgeFixture.connected = false; __bridgeFixture.buttons.RIGHT = false; });
  await page.waitForFunction(() => !JoystickGameQA.snapshot().controller.connected); const disconnected = await snap(); assert.equal(disconnected.stage,'paused');
  await page.evaluate(() => { __bridgeFixture.connected = true; __bridgeFixture.session = 'QA-SESSION-2'; });
  await page.waitForFunction(() => JoystickGameQA.snapshot().controller.source.includes('QA-SESSION-2')); assert.deepEqual((await snap()).gameplay,disconnected.gameplay);
  await press(['START']); assert.equal((await snap()).stage,'playing');
  const identity = await page.locator('#puretv-controller-panel').innerText(); assert.ok(identity.includes('QA-TRIPTYCH-01'));
  const layout = await page.evaluate(() => {
    const panel=document.querySelector('#puretv-controller-panel'), help=document.querySelector('#tv-controls');
    const rect = el => { const r=el.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
    return { panel:rect(panel), panelScrollHeight:panel.scrollHeight, panelClientHeight:panel.clientHeight,
      help:rect(help), documentScrollWidth:document.documentElement.scrollWidth, viewportWidth:innerWidth,
      pollCount:JoystickGameQA.snapshot().controller.pollCount, frames:JoystickGameQA.snapshot().frames, nativeReads:__bridgeCalls };
  });
  assert.equal(layout.pollCount,layout.frames); assert.equal(layout.nativeReads,layout.frames);
  assert.ok(layout.panel.right<=width && layout.help.bottom<=height); assert.equal(layout.documentScrollWidth,width);
  assert.deepEqual(errors,[]); assert.deepEqual(requests,[]);
  report.results.push({ width,height,menu,gameplay,paused,focusCancelled:true,disconnectPaused:true,reconnectPaused:true,layout,errors,externalRequests:requests });
  await context.close();
 }
} catch(e) { report.failures.push(e.stack); }
finally { await browser.close(); server.close(); fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n'); }
if(report.failures.length){ console.error(report.failures.join('\n')); process.exitCode=1; } else console.log(slug+' browser checks passed at both sizes');
