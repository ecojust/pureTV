// Renders the actual packaged game/controller assets with a simulated Android bridge.
// These are browser captures, not photographs or captures from a physical television.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);
const qr = `data:image/svg+xml;base64,${(await readFile(new URL('fixtures/room-preview.svg', import.meta.url))).toString('base64')}`;
const output = resolve(process.env.JACKAL_UI_CAPTURE_DIR || '/tmp/puretv-jackal-previews');
await mkdir(output, { recursive: true });
const server = http.createServer(async (request, response) => {
  const file = new URL(request.url, 'http://localhost').pathname.substring(1);
  if (file === 'favicon.ico') { response.writeHead(204).end(); return; }
  if (!['tv.html','tv.css','nes-renderer.js','game-model.js','game.js','controller.html','controller.css','controller.js'].includes(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');
  response.end(await readFile(new URL(file,assets)));
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
let count = 0;
try {
  for (const language of ['zh','en']) {
    const context = await browser.newContext({viewport:{width:1280,height:720},locale:language==='zh'?'zh-CN':'en-US'});
    await context.addInitScript(({language,qr}) => {
      window.__inputs = [{id:1,connected:false,x:0,y:0,a:false,b:false},{id:2,connected:false,x:0,y:0,a:false,b:false}];
      window.JackalHost = {
        getInfo: () => JSON.stringify({language,qr,url:'http://192.168.1.88:38291/?room=preview-room-token-for-capture',addresses:['192.168.1.88']}),
        snapshot: () => JSON.stringify({players:window.__inputs}),
        publish: state => { window.__lastState = JSON.parse(state); }
      };
    },{language,qr});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/tv.html`);
    await page.waitForFunction(()=>window.JackalTV && window.__lastState);
    assert.equal(await page.locator('#game-overlay').isVisible(),true);
    const display=await page.locator('#battlefield').evaluate(canvas=>({
      width:canvas.width,height:canvas.height,smoothing:canvas.getContext('2d').imageSmoothingEnabled,
      rendering:getComputedStyle(canvas).imageRendering,
      worldWidth:window.JackalTV.game.map[0].length*16,worldHeight:window.JackalTV.game.map.length*16
    }));
    assert.deepEqual(display,{width:256,height:240,smoothing:false,rendering:'pixelated',worldWidth:224,worldHeight:960},'Native pixel frame and scrolling battlefield preserve their dimensions');
    await page.screenshot({path:resolve(output,`jackal-lobby${language==='en'?'.en':''}.png`)});
    await page.evaluate(()=>{window.__inputs.forEach(p=>{p.connected=true;});window.__inputs[0].a=true;});
    await page.waitForFunction(()=>window.__lastState.phase==='playing');
    await page.evaluate(()=>{window.__inputs[0].a=false;window.__inputs[0].x=1;});
    const before = await page.evaluate(()=>window.JackalTV.game.players[0].x);
    await page.waitForTimeout(230);
    assert.ok(await page.evaluate(()=>window.JackalTV.game.players[0].x)>before,'Phone joystick moves the actual game jeep');
    await page.evaluate(()=>{window.__inputs[0].x=0;window.__inputs[0].b=true;});
    await page.waitForFunction(()=>window.__lastState.players[0].grenadeCooldown>0);
    await page.evaluate(()=>{window.__inputs[0].b=false;window.JackalTV.suspend(true);});
    const suspended = await page.evaluate(()=>({time:window.JackalTV.game.time,x:window.JackalTV.game.players[0].x}));
    await page.waitForTimeout(120);
    assert.deepEqual(await page.evaluate(()=>({time:window.JackalTV.game.time,x:window.JackalTV.game.players[0].x})),suspended,'Native exit dialog freezes simulation');
    await page.evaluate(()=>{window.JackalTV.suspend(false);window.__inputs.forEach(p=>p.connected=false);});
    await page.waitForFunction(()=>window.__lastState.phase==='paused');
    const pausedPositions = await page.evaluate(()=>window.JackalTV.game.enemies.map(p=>[p.x,p.y]));
    await page.waitForTimeout(100);
    assert.deepEqual(await page.evaluate(()=>window.JackalTV.game.enemies.map(p=>[p.x,p.y])),pausedPositions,'Disconnected controllers pause enemies');
    await page.evaluate(()=>{
      window.__inputs.forEach(p=>p.connected=true);
      const game=window.JackalTV.game;
      game.start(window.__inputs);
      for(let i=0;i<240;i++) game.step(1/60,window.__inputs.map(p=>({...p,a:true,b:true,y:i<120?-1:0,x:i>=120&&i<170?(p.id===1?-1:1):0})));
      if(!game.players.every(p=>p.alive)) throw new Error('Co-op preview route must keep both jeeps alive');
    });
    await page.waitForFunction(()=>window.__lastState.phase==='playing');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#room-qr').evaluate(el=>el.complete&&el.naturalWidth>0),true);
    if(language==='en') assert.doesNotMatch(await page.locator('body').innerText(),/[\u3400-\u9fff]/,'English screenshot must contain English UI');
    for(const [width,height] of [[720,480],[960,540],[1280,720],[1920,1080]]) {
      await page.setViewportSize({width,height});
      const bounds=await page.locator('.sidebar').evaluate(el=>({bottom:el.lastElementChild.getBoundingClientRect().bottom,screen:innerHeight,scroll:document.documentElement.scrollHeight}));
      assert.ok(bounds.bottom<=height,`Sidebar fits ${width}×${height}: ${JSON.stringify(bounds)}`);
      assert.ok(bounds.scroll<=height,`No page scrolling ${width}×${height}`);
      const screen=await page.locator('#battlefield').boundingBox();
      assert.ok(Math.abs(screen.width/screen.height-256/240)<.005,`NES frame keeps its aspect ratio at ${width}×${height}`);
      assert.ok(screen.x>=0&&screen.y>=0&&screen.x+screen.width<=width+.5&&screen.y+screen.height<=height+.5,`Whole NES frame visible at ${width}×${height}`);
    }
    await page.setViewportSize({width:1280,height:720});
    await page.screenshot({path:resolve(output,`jackal-tv${language==='en'?'.en':''}.png`)});
    assert.deepEqual(errors,[]);
    await context.close();
    count++;

    const phone = await browser.newContext({viewport:{width:844,height:390},locale:language==='zh'?'zh-CN':'en-US',hasTouch:true});
    await phone.addInitScript(()=>{
      class PreviewSocket extends EventTarget {
        static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
        constructor(){super();this.readyState=0;setTimeout(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
        send(raw){if(JSON.parse(raw).type==='hello')setTimeout(()=>{
          this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'welcome',player:1,session:'preview',heartbeatMs:250})}));
          this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'state',phase:'playing',stage:1,players:[{id:1,lives:3,score:300,grenadeCooldown:0}]})}));
        },0);}
        close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
      }
      window.WebSocket=PreviewSocket;
    });
    const control=await phone.newPage();
    await control.goto(`${base}/controller.html?room=preview-room-token-for-capture`);
    await control.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
    if(language==='en')assert.doesNotMatch(await control.locator('body').innerText(),/[\u3400-\u9fff]/);
    await control.screenshot({path:resolve(output,`jackal-controller${language==='en'?'.en':''}.png`)});
    await phone.close();
    console.log(`PASS ${language}: native bridge controls, grenade, exit suspension, disconnect pause, four TV sizes and actual UI captures`);
  }
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log(`${count} bilingual game integration scenarios passed. Screenshots: ${output}`);
