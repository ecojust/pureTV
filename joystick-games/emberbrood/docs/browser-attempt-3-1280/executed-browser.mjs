// Synthetic pureTV bridge acceptance. Only normal controller buttons drive gameplay.
import { chromium } from '/dev/shm/joystick-qa-deps/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.TMPDIR = '/dev/shm';
const [slug, attempt = '1', viewport] = process.argv.slice(2);
const root = '/dev/shm/puretv-joystick-games/joystick-games';
const out = path.join(root, slug, 'docs', 'browser-attempt-' + attempt);
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(new URL(import.meta.url), path.join(out, 'executed-browser.mjs'));
const report = { game: slug, syntheticBridge: true, physicalTvTested: false, physicalPhoneTested: false, results: [], failures: [] };
report.browserConfiguration={engine:'Chromium',graphics:'--disable-gpu',renderer:'dom with original 2D canvas sprites'};
report.distFiles = Object.fromEntries(fs.readdirSync(path.join(root,slug,'dist')).sort().map(name=>{const data=fs.readFileSync(path.join(root,slug,'dist',name));return [name,{bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}];}));
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, slug, 'dist', name === '/' ? 'tv.html' : name);
  try { res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/plain'); res.end(fs.readFileSync(file)); }
  catch { res.statusCode=404; res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  env: { ...process.env, TMPDIR: '/dev/shm' } });
try {
 for (const [width, height] of [[960,540], [1280,720]].filter(([w]) => !viewport || w === Number(viewport))) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage(); page.setDefaultTimeout(120000);
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
  await page.waitForFunction(() => window.JoystickGameQA?.snapshot().frames > 3, null, {timeout:120000});
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

  const focusMatch=async pattern=>{for(let n=0;n<150;n++){const s=await snap();if(pattern.test(s.ui?.focus||''))return;await press(['DOWN'],35);}throw Error('Menu item unreachable: '+pattern);};
  await press(['START']);await page.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.rosterCount===1);
  await page.waitForFunction(()=>JoystickGameQA.snapshot().ui.overlay);
  await page.screenshot({path:path.join(out,`story-${width}.png`)});
  for(let n=0;n<7;n++)await press(['A'],40);
  assert.equal((await snap()).ui.overlay,false);
  const before=await snap();await press(['B']);await page.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.screen==='map');
  for(let n=0;n<3;n++)await press(['DOWN'],40);assert.match((await snap()).ui.focus,/^The Low Fields/);await page.screenshot({path:path.join(out,`map-${width}.png`)});await press(['A']);
  await page.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.node==='lowfields');assert.ok((await snap()).gameplay.steps>before.gameplay.steps);
  // Encounters retain the original random draw; explore via its visible button, never set a model/seed.
  for(let attempt=0;attempt<20&&(await snap()).gameplay.screen!=='battle';attempt++){
    if((await snap()).ui.overlay){await press(['A'],40);continue;}
    await focusMatch(/^Explore/);await press(['A'],40);
  }
  await page.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.screen==='battle');
  await page.screenshot({path:path.join(out,`battle-${width}.png`)});
  await focusMatch(/^Guard$/);await press(['A']);await focusMatch(/^Go$/);await press(['A']);
  await page.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.battle.round>=1 || JoystickGameQA.snapshot().gameplay.battle.state!=='input');
  const gameplay = await snap();
  await page.screenshot({ path: path.join(out, `playing-${width}.png`) });
  await press(['START']); assert.equal((await snap()).stage,'paused');
  const paused = await snap(); await page.waitForTimeout(650);
  assert.deepEqual((await snap()).gameplay,paused.gameplay,'Gameplay must freeze during pause');assert.equal((await snap()).timers.elapsed,paused.timers.elapsed,'Original scheduled UI/audio timers must freeze');
  await page.screenshot({ path: path.join(out, `paused-${width}.png`) });
  await press(['START']); assert.equal((await snap()).stage,'playing');
  // Focus loss cancels a held action without a release action, then stays paused after focus return.
  await page.evaluate(() => { __bridgeFixture.buttons.A = true; }); await page.waitForTimeout(80);
  const cancelFrame = await page.evaluate(() => { const n=JoystickGameQA.snapshot().frames; window.PureGame.focus(false); __bridgeFixture.buttons.A = false; return n; });
  await page.waitForFunction(n => JoystickGameQA.snapshot().frames >= n+2 && !JoystickGameQA.snapshot().controller.cancelled && Object.values(JoystickGameQA.snapshot().controller.buttons).every(v => !v), cancelFrame); const blurred = await snap(); assert.equal(blurred.stage,'paused');
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
} catch(e) { report.failures.push(e.stack); for(const context of browser.contexts())for(const page of context.pages()){try{report.failureSnapshot=await page.evaluate(()=>window.JoystickGameQA?.snapshot());await page.screenshot({path:path.join(out,'failure.png')});}catch{}} }
finally { await browser.close(); server.close(); fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n'); }
if(report.failures.length){ console.error(report.failures.join('\n')); process.exitCode=1; } else console.log(slug+' browser checks passed: '+report.results.map(r=>r.width+'x'+r.height).join(', '));
