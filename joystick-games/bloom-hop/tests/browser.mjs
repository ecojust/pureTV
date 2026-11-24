import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const game = JSON.parse(fs.readFileSync(path.join(root, 'game.json'))).id;
const out = process.env.QA_OUTPUT || path.join(root, 'docs/browser');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined, args: ['--no-sandbox','--disable-dev-shm-usage'] });
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || !fs.existsSync(path.join(root,'dist',name))) { res.writeHead(404); res.end(); return; }
  const mime = { html:'text/html',js:'application/javascript',css:'text/css',jpg:'image/jpeg',png:'image/png',svg:'image/svg+xml' };
  res.writeHead(200, {'Content-Type':mime[name.split('.').pop()] || 'application/octet-stream'});
  fs.createReadStream(path.join(root,'dist',name)).pipe(res);
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const results = [];
const plan = JSON.parse(fs.readFileSync(path.join(root, 'qa-plan.json')));
const value = (state, dotted) => dotted.split('.').reduce((item, key) => item[key], state);
try {
  for (const [width,height,transport] of [[960,540,'keyboard'],[1280,720,'wifi'],[960,540,'phone'],[1280,720,'gamepad']]) {
    const page = await browser.newPage({ viewport: { width,height }, deviceScaleFactor: 1 });
    const errors = [], remote = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => { if (new URL(route.request().url()).origin === base) return route.continue(); remote.push(route.request().url()); return route.abort(); });
    await page.addInitScript(type => {
      const buttons = {};
      let connected = true;
      window.testInput = { buttons, connect: online => { connected = online; } };
      if (type === 'gamepad') Object.defineProperty(navigator, 'getGamepads', { value: () => !connected ? [] : [{
        id:'Test standard pad',index:0,connected:true,mapping:'standard',axes:[0,0],
        buttons:['A','B','X','Y','','','','','','START','','','UP','DOWN','LEFT','RIGHT'].map(key=>({pressed:!!buttons[key]})),
      }] });
      if (type === 'wifi' || type === 'phone') window.PureGameHost = {
        getInfo: () => JSON.stringify({ addresses: ['192.0.2.1'] }),
        snapshot: () => JSON.stringify({ players: !connected ? [] : [{ id: 1, connected, inputActive: true,
          transport:type, controllerId:'QA-01',session:'qa',cancelSeq:0,buttons,
          x:Number(!!buttons.RIGHT)-Number(!!buttons.LEFT),y:Number(!!buttons.DOWN)-Number(!!buttons.UP),
          a:!!buttons.A, b:!!buttons.B, start:!!buttons.START, buttonX:!!buttons.X, buttonY:!!buttons.Y,
        }] }),
        publish() {},
      };
    },transport);
    await page.goto(base + '/tv.html');
    await page.waitForFunction(() => window.JoystickGameQA?.snapshot().stage === 'menu' && window.JoystickGameQA.snapshot().frames >= 2, null, { timeout:15000 });
    const read = () => page.evaluate(() => window.JoystickGameQA.snapshot());
    const keyMap = { START:'KeyP',UP:'ArrowUp',DOWN:'ArrowDown',LEFT:'ArrowLeft',RIGHT:'ArrowRight',A:'KeyZ',B:'KeyX',X:'KeyC',Y:'KeyV' };
    async function press(key, ms=140) {
      if (transport==='keyboard') await page.keyboard.down(keyMap[key]);
      else await page.evaluate(key => { window.testInput.buttons[key] = true; }, key);
      await page.waitForFunction(key => window.JoystickGameQA.snapshot().controller.buttons[key], key, {timeout:5000});
      await page.waitForTimeout(ms);
      if (transport==='keyboard') await page.keyboard.up(keyMap[key]);
      else await page.evaluate(key => { window.testInput.buttons[key] = false; },key);
      await page.waitForFunction(key => !window.JoystickGameQA.snapshot().controller.buttons[key], key, {timeout:5000});
      await page.waitForTimeout(150);
    }
    const menuSize = await page.locator('#game').boundingBox();
    const observed = [];
    for (const action of plan.steps) {
      const before = await read();
      await press(action.keys[0], action.holdMs);
      let after = await read();
      const matches = () => action.expect.every(e => {
        const actual=value(after,e.path), old=value(before,e.path);
        return e.op==='eq' ? actual===e.value : e.op==='increased' ? actual>old : actual!==old;
      });
      for (let i=0;i<20 && !matches();i++) { await page.waitForTimeout(60); after=await read(); }
      assert.ok(matches(), JSON.stringify({action:action.name,transport,before:before.gameplay,stage:after.stage,after:after.gameplay,errors:after.errors}));
      observed.push({ action: action.name, stage: after.stage, gameplay: after.gameplay });
      if (after.paused) {
        await page.waitForTimeout(300); const still=await read();
        for (const field of plan.pauseStablePaths) assert.equal(value(still,field),value(after,field),field);
      }
    }
    await press('DOWN',180); await page.waitForTimeout(260);
    if (transport==='wifi') await page.screenshot({path:path.join(out,'gameplay-1280x720.png')});
    if (transport==='keyboard') await page.screenshot({path:path.join(out,'gameplay-960x540.png')});
    if (transport==='keyboard') {
      await page.setViewportSize({width:1280,height:720});
      await page.waitForTimeout(250);
      await page.screenshot({path:path.join(root,'thumb.png')});
      await page.setViewportSize({width,height});
      await page.waitForTimeout(250);
    }
    if (transport==='keyboard') {
      for (const key of ['DOWN','RIGHT','UP']) { await press(key); await page.waitForTimeout(300); }
      assert.equal((await read()).gameplay.fliesLeft,0);
      await press('A');
      await page.waitForFunction(()=>window.JoystickGameQA.snapshot().stage==='complete');
      await press('A');
      assert.equal((await read()).gameplay.level,2);
      observed.push({ action:'Solve First Hops and advance through the normal result screen', gameplay:(await read()).gameplay });
    }
    const active=await read();
    assert.equal(active.frames,active.controller.pollCount);
    if (transport!=='keyboard') {
      await page.evaluate(()=>window.testInput.connect(false));
      await page.waitForFunction(()=>JoystickGameQA.snapshot().paused);
      await page.evaluate(()=>window.testInput.connect(true)); await page.waitForTimeout(160);
      assert.equal((await read()).paused,true);
      await press('START'); assert.equal((await read()).stage,'playing');
    }
    const expected=await page.locator('#game').boundingBox();
    assert.deepEqual(expected,menuSize,'controller changes must not resize the playfield');
    const panel=await page.locator('#puretv-controller-panel').boundingBox();
    assert.ok(expected.x+expected.width<=panel.x+2,'connection panel overlaps playfield');
    assert.deepEqual(errors,[]); assert.deepEqual(remote,[]); assert.deepEqual((await read()).errors,[]);
    results.push({width,height,transport,board:expected,panel,observed});
    await page.close();
  }
  const payload = Object.fromEntries(fs.readdirSync(path.join(root,'dist')).sort().map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,'dist',name))).digest('hex')]));
  fs.writeFileSync(path.join(out,'verification.json'), JSON.stringify({game,engine:await browser.version(),physicalHardware:false,transportFixtures:true,payload,results},null,2)+'\n');
} finally { await browser.close(); server.close(); }
