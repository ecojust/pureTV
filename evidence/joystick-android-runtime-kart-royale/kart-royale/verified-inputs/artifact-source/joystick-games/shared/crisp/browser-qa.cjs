/* Real keyboard gameplay + separately labelled synthetic connection transport.
 * No production model, clock or random seed is changed by this test. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const slug = process.argv[2], attempt = process.argv[3] || 'attempt-1';
const root = process.env.JOYSTICK_GAMES_ROOT || path.resolve(__dirname, '../..'), game = path.join(root,slug);
const output = path.join(game,'docs/browser-qa',attempt);
fs.mkdirSync(output,{recursive:true});
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const config = JSON.parse(fs.readFileSync(path.join(game,'src/config.json')));
const plan = JSON.parse(fs.readFileSync(path.join(game,'qa-plan.json')));
const report = {game:slug,attempt,startedAt:new Date().toISOString(),physicalTvTested:false,physicalPhoneTested:false,
  environment:'Linux Chromium; actual keyboard input; separately labelled synthetic native transport for cancellation and identity UI',
  sourceFiles:Object.fromEntries(['game.json','upstream.json','qa-plan.json','src/game.js','src/config.json',...fs.readdirSync(path.join(game,'dist')).map(f=>'dist/'+f)].map(f=>[f,hash(path.join(game,f))])),
  testScriptSha256:hash(__filename),cases:[],passed:false};
fs.copyFileSync(__filename,path.join(output,'executed-browser-qa.cjs'));
const get = (value,p) => p.split('.').reduce((o,key)=>o[key],value);
const read = page => page.evaluate(()=>window.JoystickGameQA.snapshot());
async function until(page,stage) { await page.waitForFunction(stage=>window.JoystickGameQA?.snapshot().stage===stage,stage,{timeout:5000}); }
async function tap(page,key) {
  const action={p:'START',b:'B',Enter:'A',ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT'}[key];
  const previousStage=(await read(page)).stage;
  await page.keyboard.down(key);
  await page.waitForFunction(({action,previousStage})=>{const s=window.JoystickGameQA.snapshot();return s.controller.buttons[action]||s.stage!==previousStage;},{action,previousStage},{timeout:8000});
  await page.keyboard.up(key);
  await page.waitForFunction(action=>!window.JoystickGameQA.snapshot().controller.buttons[action],action,{timeout:8000});
}
async function frozen(page,record) {
  const first=await read(page); await page.waitForTimeout(250);
  await page.waitForFunction(frames=>window.JoystickGameQA.snapshot().frames>frames,first.frames,{timeout:8000});const second=await read(page);
  for(const field of config.stateFields) assert.deepEqual(first.gameplay[field],second.gameplay[field],'paused '+field);
  assert.equal(first.gameplay.ticks,second.gameplay.ticks); assert.equal(first.gameplay.score,second.gameplay.score);
  assert.equal(second.input.held,false);assert.equal(second.input.released,false);
  assert.ok(second.frames>first.frames);assert.equal(second.frames,second.controller.pollCount);
  record.pause={before:first,after:second};
}
async function layout(page) {
  return page.evaluate(()=> {
    const bounds = element => {const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};};
    return {viewport:{width:innerWidth,height:innerHeight},body:bounds(document.body),sidebar:bounds(document.getElementById('sidebar')),board:bounds(document.getElementById('game-board')),panel:bounds(document.getElementById('puretv-controller-panel')),text:[...document.querySelectorAll('#sidebar h1,#sidebar p,#menu button,.ptv-client-id')].filter(e=>!e.hidden&&e.getBoundingClientRect().height>0).map(e=>({text:e.textContent,bounds:bounds(e),fontSize:getComputedStyle(e).fontSize}))};
  });
}
(async()=> {
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,TMPDIR:'/dev/shm'}});
    for(const [width,height] of [[960,540],[1280,720]]) {
      const record={width,height,pageErrors:[],networkFailures:[],externalRequests:[],passed:false};report.cases.push(record);
      const page=await browser.newPage({viewport:{width,height}});
      page.on('pageerror',e=>record.pageErrors.push(e.message));
      page.on('requestfailed',r=>record.networkFailures.push({url:r.url(),error:r.failure()?.errorText}));
      page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(process.env.BASE_URL||'http://127.0.0.1:8768'))record.externalRequests.push(r.url());});
      await page.addInitScript(()=> {
        const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
        window.__qaTransport={connected:true,session:'browser-identity',cancelSeq:0,calls:0,buttons:Object.fromEntries(keys.map(k=>[k,false]))};
        window.PureGameHost={getInfo:()=>JSON.stringify({wifiController:{state:'listening',serviceName:'pureTV 浏览器合成桥接测试',addresses:['192.0.2.15'],port:63485}}),snapshot:()=>{
          const t=window.__qaTransport;t.calls++;
          return JSON.stringify({inputActive:true,players:[{id:1,transport:'wifi',connected:t.connected,controllerId:'ESP32-CONTROLLER-0123456789-ABCDEF-0123456789',session:t.session,cancelSeq:t.cancelSeq,buttons:t.buttons}]});
        }};
      });
      await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768')+'/joystick-games/'+slug+'/dist/tv.html');
      await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>=3);
      await page.waitForTimeout(100);
      record.menu=await read(page);record.menuLayout=await layout(page);
      assert.equal(record.menu.stage,'menu');assert.equal(record.menu.frames,record.menu.controller.pollCount);
      assert.ok((plan.compatibleRenderers||[plan.renderer]).includes(record.menu.renderer),'actual rendering context matches the declared plan');
      assert.equal(record.menuLayout.sidebar.scrollHeight,record.menuLayout.sidebar.clientHeight,'menu sidebar must fit without scrolling');
      assert.ok(record.menuLayout.panel.scrollWidth<=record.menuLayout.panel.clientWidth,'controller ID wraps');
      assert.ok(record.menuLayout.board.right<record.menuLayout.panel.x,'board clear of identity panel');
      for (const name of ['sidebar','board','panel']) {
        const box=record.menuLayout[name];
        assert.ok(box.x>=0 && box.y>=0 && box.right<=width && box.bottom<=height,'menu '+name+' fully on screen');
      }
      await page.screenshot({path:path.join(output,width+'x'+height+'-menu.png')});
      await tap(page,'ArrowRight'); assert.equal((await read(page)).menu.difficulty,'进阶');
      await tap(page,'ArrowLeft'); assert.equal((await read(page)).menu.difficulty,'标准');
      await tap(page,'ArrowDown'); await tap(page,'ArrowDown'); await tap(page,'Enter'); assert.equal((await read(page)).menu.help,true);
      record.helpLayout=await layout(page);
      assert.equal(record.helpLayout.sidebar.scrollHeight,record.helpLayout.sidebar.clientHeight,'help must be readable without pointer scrolling');
      await page.screenshot({path:path.join(output,width+'x'+height+'-help.png')});
      await tap(page,'b');assert.equal((await read(page)).menu.help,false);
      await tap(page,'p');await until(page,'playing');
      record.beforeAction=await read(page);
      await page.keyboard.down('Enter');
      await page.waitForFunction(()=>window.JoystickGameQA.snapshot().input.held,null,{timeout:8000});
      await page.waitForTimeout(180);record.held=await read(page);
      assert.equal(record.held.input.held,true);
      await page.keyboard.up('Enter');await page.waitForTimeout(120);record.afterAction=await read(page);
      assert.equal(record.afterAction.stage,'playing');
      const corePath=plan.steps[1].expect[1].path;
      assert.notDeepEqual(get(record.beforeAction,corePath),get(record.afterAction,corePath),'original gameplay changed: '+corePath);
      record.actionObservation=corePath;
      record.playingLayout=await layout(page);
      for (const name of ['sidebar','board','panel']) {
        const box=record.playingLayout[name];
        assert.ok(box.x>=0 && box.y>=0 && box.right<=width && box.bottom<=height,'playing '+name+' fully on screen');
      }
      await page.screenshot({path:path.join(output,width+'x'+height+'-playing.png')});
      await tap(page,'p');await until(page,'paused');await frozen(page,record);
      await page.screenshot({path:path.join(output,width+'x'+height+'-paused.png')});
      // Disconnect while held: the only writes are to this test's transport object.
      await tap(page,'p');await until(page,'playing');await page.keyboard.down('Enter');await page.waitForTimeout(80);
      await page.evaluate(()=>{window.__qaTransport.connected=false;});await until(page,'paused');
      await page.keyboard.up('Enter');const cancelled=await read(page);
      await page.evaluate(()=>{window.__qaTransport.connected=true;window.__qaTransport.session='reconnected';});
      await page.waitForTimeout(170);const reconnected=await read(page);
      assert.equal(reconnected.stage,'paused');assert.equal(cancelled.gameplay.ticks,reconnected.gameplay.ticks);assert.equal(reconnected.input.released,false);
      record.cancellation={cancelled,reconnected};
      await tap(page,'p');await until(page,'playing');await page.waitForTimeout(80);
      assert.equal((await read(page)).input.released,false,'cancel must not produce rewarded release after resume');
      await page.evaluate(()=>window.PureGame.focus(false));await until(page,'paused');
      const blur=await read(page);await page.evaluate(()=>window.PureGame.focus(true));await page.waitForTimeout(100);assert.equal((await read(page)).gameplay.ticks,blur.gameplay.ticks);
      await tap(page,'b');await until(page,'menu');await tap(page,'p');await until(page,'playing');
      const restart=await read(page);assert.ok(restart.gameplay.ticks<20,'restart starts a fresh original clock');
      record.final=restart;
      if(width===960 && slug==='tectonic-tether') {
        await page.keyboard.down('Enter');
        await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.chargePower>=1.2,null,{timeout:8000});
        await page.evaluate(()=>window.PureGame.focus(false));await until(page,'paused');await page.keyboard.up('Enter');
        const charged=await read(page);assert.ok(charged.gameplay.chargePower>=1.2);
        await page.waitForTimeout(180);assert.equal((await read(page)).gameplay.extensionBoost,charged.gameplay.extensionBoost);
        await tap(page,'p');await until(page,'playing');await page.waitForTimeout(60);
        const resumed=await read(page);assert.equal(resumed.gameplay.extensionBoost,0,'cancellation must not spend charge as a release boost');
        await page.keyboard.down('Enter');await page.waitForTimeout(80);await page.keyboard.up('Enter');await page.waitForTimeout(60);
        const released=await read(page);assert.ok(released.gameplay.extensionBoost>0,'intentional release still launches the original boost');
        record.chargedCancellation={charged,resumed,released};
      }
      if(width===960 && slug==='switchboard') {
        await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.cursor.currentPlugIndex===2,null,{timeout:8000});
        await page.keyboard.down('Enter');await page.waitForTimeout(50);
        assert.equal((await read(page)).gameplay.connectionLine.startPlugId,3);
        await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.cursor.currentPlugIndex===6,null,{timeout:8000});
        await page.evaluate(()=>window.PureGame.focus(false));await until(page,'paused');await page.keyboard.up('Enter');
        const cancelled=await read(page);assert.equal(cancelled.gameplay.score,0);
        await page.waitForTimeout(160);assert.equal((await read(page)).gameplay.activeConnections.length,0,'cancel is not a completed call');
        await tap(page,'p');await until(page,'playing');await page.keyboard.down('Enter');
        await page.waitForTimeout(40);
        await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.cursor.currentPlugIndex===6,null,{timeout:8000});
        await page.keyboard.up('Enter');
        await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.score>0,null,{timeout:2000});
        record.intentionalConnection={cancelled,completed:await read(page)};
      }
      record.pollAudit=await page.evaluate(()=>{const before=window.__qaTransport.calls;for(let i=0;i<20;i++)window.JoystickGameQA.snapshot();return {before,after:window.__qaTransport.calls,frames:window.JoystickGameQA.snapshot().frames,polls:window.JoystickGameQA.snapshot().controller.pollCount};});
      assert.equal(record.pollAudit.before,record.pollAudit.after,'read-only QA must not consume input');assert.equal(record.pollAudit.frames,record.pollAudit.polls);assert.equal(record.pollAudit.after,record.pollAudit.polls);
      assert.deepEqual(record.pageErrors,[]);assert.deepEqual(record.externalRequests,[]);assert.deepEqual(record.networkFailures,[]);assert.deepEqual(restart.errors,[]);
      record.passed=true;await page.close();
      console.log(slug,width+'x'+height,'passed');
    }
    report.passed=true;
  } catch(error) { report.error={message:error.message,stack:error.stack};process.exitCode=1;console.error(slug,error.message); }
  finally {if(browser)await browser.close();report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
})();
