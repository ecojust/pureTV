// Bundled TV runtime and real WebGL, with an explicitly simulated Android LAN room.
// Level showcase fixtures render actual game state; they do not claim a human playthrough.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const assets=new URL('../src/main/assets/',import.meta.url);
const output=process.env.ALIEN_SHOOTER_UI_CAPTURE_DIR||'/tmp/puretv-alien-shooter-previews';
await mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'tv.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':'text/html');res.end(await readFile(new URL(name,assets)));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:'+server.address().port;
const part=process.env.ALIEN_SHOOTER_TEST_PART||'all';
let checks=0;const renderEvidence=[];
function pass(message){console.log('PASS '+(++checks)+': '+message);}
async function fixture(language='zh',options={}){
  const context=await browser.newContext({viewport:{width:1280,height:720},locale:language==='en'?'en-US':'zh-CN'});
  await context.addInitScript(({language,options})=>{
    window.__players=[1,2].map(id=>({id,connected:id===1,x:0,y:0,aimX:0,aimY:0,a:false,b:false,start:false,select:false,cancelSeq:0}));
    window.__published=[];window.__snapshots=0;
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#e7e7d8"/><g fill="none" stroke="#17292c" stroke-width="8"><rect x="12" y="12" width="35" height="35"/><rect x="113" y="12" width="35" height="35"/><rect x="12" y="113" width="35" height="35"/></g><text x="80" y="88" text-anchor="middle" font-family="monospace" font-size="18" fill="#17292c">DEMO</text></svg>';
    window.__roomInfo={language,url:'http://192.168.1.8:34123/?room=demo',qr:'data:image/svg+xml;base64,'+btoa(svg)};
    window.AlienShooterHost={getInfo:()=>JSON.stringify(__roomInfo),snapshot:()=>{__snapshots++;return JSON.stringify({players:__players});},publish:raw=>{__published.push(JSON.parse(raw));if(__published.length>100)__published.shift();},exit:()=>{window.__exit=true;}};
    if(options.noWebgl){const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};}
    if(options.legacy){window.ResizeObserver=undefined;window.structuredClone=undefined;CanvasRenderingContext2D.prototype.roundRect=undefined;}
  },{language,options});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  if(!options.noWebgl)await page.waitForFunction(()=>window.AlienShooterTV?.game&&AlienShooterTV.renderer?.active&&AlienShooterTV.renderer.stats.frames>2&&document.getElementById('game-loading').hidden,null,{timeout:30000});
  return {context,page,errors};
}
async function input(page,id,value){await page.evaluate(({id,value})=>Object.assign(__players.find(p=>p.id===id),value),{id,value});}
async function pulse(page,id,key,phase){
  await input(page,id,{[key]:true});
  try{if(phase)await page.waitForFunction(phase=>AlienShooterTV.game.phase===phase,phase);else await page.waitForFunction(({id,key})=>AlienShooterTV.game._inputs.some(p=>p.id===id&&p[key]),{id,key});}
  catch(error){console.error('Input timeout',await page.evaluate(()=>({phase:AlienShooterTV.game.phase,reason:AlienShooterTV.game.pausedReason,inputs:AlienShooterTV.game._inputs,controls:AlienShooterTV.game._controls,frames:AlienShooterTV.renderer.stats.frames,raw:__players})));throw error;}
  await input(page,id,{[key]:false});await page.waitForFunction(({id,key})=>AlienShooterTV.game._inputs.some(p=>p.id===id&&!p[key]),{id,key});
}
async function neutral(page){await page.evaluate(()=>__players.forEach(p=>Object.assign(p,{x:0,y:0,aimX:0,aimY:0,a:false,b:false,start:false,select:false})));await page.waitForFunction(()=>AlienShooterTV.game._inputs.every(p=>!p.a&&!p.b&&!p.start&&!p.select&&!p.x&&!p.y));}
try{
  for(const language of (part==='all'||part==='layout'?['zh','en']:[])){
    const {context,page,errors}=await fixture(language,{legacy:language==='en'});
    assert.equal(await page.locator('html').getAttribute('lang'),language==='en'?'en':'zh-CN');
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'title');
    assert.ok(await page.locator('#room-panel').isVisible());
    await page.screenshot({path:output+'/alien-shooter-title'+(language==='en'?'.en':'')+'.png'});
    await pulse(page,1,'start','playing');
    const initial=await page.evaluate(()=>({x:AlienShooterTV.game.players[0].x,y:AlienShooterTV.game.players[0].y}));
    await input(page,1,{x:1});await page.waitForFunction(x=>AlienShooterTV.game.players[0].x>x+1.4,initial.x);await neutral(page);
    const moved=await page.evaluate(()=>({x:AlienShooterTV.game.players[0].x,y:AlienShooterTV.game.players[0].y}));
    assert.ok(moved.x>initial.x+1.4);assert.ok(Math.abs(moved.y-initial.y)<.05);
    const axes=await page.evaluate(()=>{const r=AlienShooterTV.renderer;return {left:r.screenToWorld(.2,.5),right:r.screenToWorld(.8,.5),up:r.screenToWorld(.5,.2),down:r.screenToWorld(.5,.8)};});
    assert.ok(axes.right.x>axes.left.x);assert.ok(axes.down.y>axes.up.y);
    await input(page,1,{a:true,aimX:0,aimY:-1});await page.waitForFunction(()=>AlienShooterTV.game.events.some(e=>e.kind==='shot'));
    assert.ok(await page.evaluate(()=>Math.abs(AlienShooterTV.game.players[0].angle+Math.PI/2)<.01));
    await input(page,1,{aimX:0,aimY:0});await page.waitForTimeout(900);
    const grenades=await page.evaluate(()=>AlienShooterTV.game.players[0].grenades);
    await input(page,1,{b:true});await page.waitForFunction(n=>AlienShooterTV.game.players[0].grenades===n-1,grenades);await page.waitForTimeout(350);
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.players[0].grenades),grenades-1);
    await input(page,1,{b:false});await page.waitForFunction(()=>AlienShooterTV.game.elapsed>=5.5,null,{timeout:60000});
    assert.ok(await page.locator('#hud').isVisible());assert.ok(await page.locator('#room-panel').isHidden());
    const stats=await page.evaluate(()=>AlienShooterTV.renderer.stats);assert.ok(stats.calls>5&&stats.calls<110,JSON.stringify(stats));assert.ok(stats.triangles>5000);renderEvidence.push({language,scene:'normal gameplay',...stats});
    await page.screenshot({path:output+'/alien-shooter-tv'+(language==='en'?'.en':'')+'.png'});
    await neutral(page);await pulse(page,1,'start','paused');
    const frozen=await page.evaluate(()=>AlienShooterTV.game.elapsed);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>AlienShooterTV.game.elapsed),frozen);
    assert.ok(await page.locator('#menu-layer').isVisible());
    assert.match(await page.locator('#menu-layer').evaluate(el=>getComputedStyle(el).backdropFilter),/blur/);
    await page.screenshot({path:output+'/alien-shooter-paused'+(language==='en'?'.en':'')+'.png'});
    await pulse(page,1,'start','playing');
    await input(page,1,{connected:false,a:true,x:1});await page.waitForFunction(()=>AlienShooterTV.game.phase==='paused');
    await input(page,1,{connected:true,a:false,x:0});await page.waitForFunction(()=>AlienShooterTV.game.players[0].connected);assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'paused');
    await pulse(page,1,'start','playing');
    await page.evaluate(()=>AlienShooterTV.suspend(true));await page.waitForFunction(()=>AlienShooterTV.game.phase==='paused');await page.evaluate(()=>AlienShooterTV.suspend(false));
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'paused');
    assert.ok(await page.evaluate(()=>__published.some(s=>s.phase==='playing'&&s.players?.length)));
    assert.deepEqual(errors,[]);await context.close();pass(language+': real WebGL and native-room loop, screen-aligned movement/aim/fire, one grenade per hold, blurred pause and safe reconnect/suspend');
  }
  if(part==='all'||part==='coop'){
    const {context,page,errors}=await fixture();await input(page,2,{connected:true});await pulse(page,1,'select');
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.selectedPlayers),2);
    await page.evaluate(()=>__players.forEach(p=>p.start=true));await page.waitForFunction(()=>AlienShooterTV.game.phase==='playing');await neutral(page);
    await input(page,1,{x:-1,a:true});await input(page,2,{x:1,a:true});const original=await page.evaluate(()=>AlienShooterTV.game.players.map(p=>p.x));
    await page.waitForFunction(xs=>AlienShooterTV.game.players[0].x<xs[0]-.8&&AlienShooterTV.game.players[1].x>xs[1]+.8,original);
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.players.filter(p=>p.active).length),2);await neutral(page);
    await page.screenshot({path:output+'/alien-shooter-coop.png'});
    await input(page,2,{connected:false});await page.waitForFunction(()=>AlienShooterTV.game.phase==='paused');
    await input(page,2,{connected:true});await page.waitForTimeout(100);await pulse(page,1,'start','playing');
    assert.deepEqual(errors,[]);await context.close();pass('two simultaneous controllers move and fire independently; participant disconnect pauses the shared battle');
  }
  if(part==='all'||part==='slot2'){
    const {context,page,errors}=await fixture();
    await page.evaluate(()=>{__players[0].connected=false;__players[1].connected=true;});
    await page.waitForFunction(()=>AlienShooterTV.game._inputs.find(p=>p.id===2)?.connected&&!AlienShooterTV.game._inputs.find(p=>p.id===1)?.connected);
    await page.locator('#start-button').click();
    try{await page.waitForFunction(()=>AlienShooterTV.game.phase==='playing');}
    catch(error){console.error('Slot2 start timeout',await page.evaluate(()=>({phase:AlienShooterTV.game.phase,inputs:AlienShooterTV.game._inputs,controls:AlienShooterTV.game._controls,notice:AlienShooterTV.game.notice,raw:__players})));throw error;}
    assert.deepEqual(await page.evaluate(()=>AlienShooterTV.game.players.filter(p=>p.active).map(p=>p.id)),[2]);
    const x=await page.evaluate(()=>AlienShooterTV.game.players[1].x);await input(page,2,{x:1,a:true});await page.waitForFunction(x=>AlienShooterTV.game.players[1].x>x+.8,x);await neutral(page);
    await input(page,1,{connected:true,start:true,select:true});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'playing');
    assert.deepEqual(errors,[]);await context.close();pass('a lone phone in slot two remains the active player when TV start is clicked; late spectators cannot pause the battle');
  }
  if(part==='all'||part==='scenes'){
    const {context,page,errors}=await fixture('en');await pulse(page,1,'start','playing');
    for(const stage of [0,1,2]){
      await page.evaluate(stage=>{const g=AlienShooterTV.game;g.loadStage(stage);g.players[0].invulnerable=999;g.players[0].owned=['pistol','smg','shotgun','minigun','plasma'];g.players[0].weapon=stage===2?'plasma':'minigun';g.players[0].ammo[g.players[0].weapon]=500;for(let n=0;n<24;n++)g.spawnEnemy(['crawler','runner','spitter','brute'][n%4],0);},stage);
      await input(page,1,{a:true});await page.waitForFunction(()=>AlienShooterTV.game.stageElapsed>1.25);const stats=await page.evaluate(()=>AlienShooterTV.renderer.stats);assert.ok(stats.calls<110,JSON.stringify(stats));renderEvidence.push({scene:'controlled populated stage',stage,...stats});
      await page.screenshot({path:output+'/alien-shooter-stage-'+(stage+1)+'.png'});await neutral(page);
    }
    await page.evaluate(()=>{const g=AlienShooterTV.game;g.phase='shop';g.credits=1000;});await page.waitForFunction(()=>document.getElementById('game-shell').dataset.phase==='shop');
    await page.screenshot({path:output+'/alien-shooter-shop.png'});
    const before=await page.evaluate(()=>AlienShooterTV.game.credits);await pulse(page,1,'a');assert.ok(await page.evaluate(before=>AlienShooterTV.game.credits<before,before));
    await page.evaluate(()=>{AlienShooterTV.dispose();AlienShooterTV.dispose();});assert.equal(await page.evaluate(()=>AlienShooterTV.renderer.disposed),true);
    assert.deepEqual(errors,[]);await context.close();pass('three actual populated level renderers stay within draw-call budget; shop purchase and idempotent graphics disposal');
  }
  if(part==='all'||part==='graphics'){
    const {context,page,errors}=await fixture('en');
    await page.evaluate(()=>AlienShooterTV.key('Enter',true));await page.waitForFunction(()=>AlienShooterTV.game.phase==='playing');await page.evaluate(()=>AlienShooterTV.key('Enter',false));
    await page.waitForFunction(()=>!AlienShooterTV.game._inputs[0].start&&!AlienShooterTV.game._inputs[0].a);
    await page.evaluate(()=>AlienShooterTV.key('Enter',true));await page.waitForFunction(()=>AlienShooterTV.game.events.some(e=>e.kind==='shot'));assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'playing');await page.evaluate(()=>AlienShooterTV.key('Enter',false));
    const grenades=await page.evaluate(()=>AlienShooterTV.game.players[0].grenades);await page.evaluate(()=>AlienShooterTV.key('b',true));await page.waitForFunction(n=>AlienShooterTV.game.players[0].grenades===n-1,grenades);await page.evaluate(()=>AlienShooterTV.key('b',false));
    await page.evaluate(()=>{window.__glLoss=AlienShooterTV.renderer.renderer.getContext().getExtension('WEBGL_lose_context');if(!__glLoss)throw new Error('Context-loss extension unavailable in test browser');__glLoss.loseContext();});
    await page.waitForFunction(()=>AlienShooterTV.renderer.contextLost&&AlienShooterTV.game.phase==='paused');
    const elapsed=await page.evaluate(()=>AlienShooterTV.game.elapsed);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>AlienShooterTV.game.elapsed),elapsed);
    const frames=await page.evaluate(()=>AlienShooterTV.renderer.stats.frames);await page.evaluate(()=>__glLoss.restoreContext());await page.waitForFunction(n=>!AlienShooterTV.renderer.contextLost&&AlienShooterTV.renderer.active&&AlienShooterTV.renderer.stats.frames>n,frames);
    assert.equal(await page.evaluate(()=>AlienShooterTV.game.phase),'paused');await pulse(page,1,'start','playing');
    assert.deepEqual(errors,[]);await context.close();pass('native remote confirm fires instead of pausing, B throws; genuine WebGL loss freezes combat and restored graphics wait for explicit resume');
  }
  if(part==='all'||part==='graphics'){
    const {context,page,errors}=await fixture('en',{noWebgl:true});await page.waitForFunction(()=>document.getElementById('loading-detail').textContent.trim().length>0);
    assert.ok(await page.locator('#game-loading').isVisible());assert.deepEqual(errors,[]);await context.close();pass('missing WebGL produces a visible startup diagnosis rather than a blank or frozen game');
  }
  await writeFile(output+'/rendering-evidence.json',JSON.stringify({physicalTvTested:false,source:'Bundled game in Chromium; simulated native LAN bridge. Three stage showcases use controlled game state.',checks,scenes:renderEvidence},null,2)+'\n');
  console.log(`PASS ${checks} TV integration scenarios; captures at ${output}`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
