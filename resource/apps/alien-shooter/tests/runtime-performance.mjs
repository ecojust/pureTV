// Real bundled runtime/WebGL with a deterministic RAF clock and simulated LAN bridge.
// These are work/behavior assertions, not claims about physical-TV frame rate.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const assets=new URL('../src/main/assets/',import.meta.url);
const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'tv.html';
  if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}
  try {res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/html');res.end(await readFile(new URL(name,assets)));}
  catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:'+server.address().port;
let checks=0;
const pass=message=>console.log(`PASS ${++checks}: ${message}`);
async function fixture(options={}) {
  const context=await browser.newContext({viewport:{width:960,height:540}});
  await context.addInitScript(options=>{
    window.__players=[{id:1,connected:true,x:0,y:0,aimX:0,aimY:0,a:false,b:false,start:false,select:false,cancelSeq:0}];
    window.__snapshots=0;window.__published=[];window.__now=1000;window.__callbacks=new Map();window.__rafId=0;
    window.requestAnimationFrame=callback=>{const id=++__rafId;__callbacks.set(id,callback);return id;};
    window.cancelAnimationFrame=id=>__callbacks.delete(id);
    window.__tick=count=>{for(let n=0;n<count;n++){__now+=1000/60;const callbacks=[...__callbacks.values()];__callbacks.clear();callbacks.forEach(callback=>callback(__now));}};
    window.AlienShooterHost={getInfo:()=>JSON.stringify({language:'en',url:'',qr:''}),snapshot:()=>{__snapshots++;return JSON.stringify({players:__players});},publish:value=>__published.push(JSON.parse(value)),exit:()=>{}};
    if(options.legacyDecode)Object.defineProperty(HTMLImageElement.prototype,'decode',{value:undefined,configurable:true});
    if(options.noWebgl){const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};}
  },options);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let release, requested;
  const requestReady=new Promise(resolve=>{requested=resolve;});
  if(options.broken)await page.route('**/baked-atlas.png',route=>route.fulfill({status:404,body:'missing'}));
  if(options.delay)await page.route('**/baked-atlas.png',async route=>{await new Promise(resolve=>{release=resolve;requested();});await route.fulfill({status:200,contentType:'image/png',body:await readFile(new URL('baked-atlas.png',assets))});});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  return {context,page,errors,release:async()=>{await requestReady;release();}};
}
const ready=page=>page.waitForFunction(()=>window.AlienShooterTV?.renderer?.active&&document.getElementById('game-loading').hidden,null,{polling:50,timeout:30000});
const tick=(page,count=1)=>page.evaluate(count=>__tick(count),count);
async function tap(page,key,count=3) {
  await page.evaluate(key=>{AlienShooterTV.key(key,true);AlienShooterTV.key(key,false);},key);
  await tick(page,count);
}
const snapshot=page=>page.evaluate(()=>({phase:AlienShooterTV.game.phase,frames:AlienShooterTV.renderer.stats.frames,stats:{...AlienShooterTV.runtimeStats},snapshots:__snapshots,published:__published.length}));
try {
  {
    const f=await fixture({delay:true});
    await f.page.waitForFunction(()=>window.AlienShooterBakedLoader?.status==='loading',null,{polling:50});
    assert.equal(await f.page.evaluate(()=>!!window.AlienShooterTV),false,'No renderer is constructed before baked assets are decoded');
    assert.ok(await f.page.locator('#game-loading').isVisible());
    await f.release();await ready(f.page);
    const loaded=await f.page.evaluate(()=>({status:AlienShooterBakedLoader.status,images:Object.values(AlienShooterBaked.images).map(image=>({complete:image.complete,width:image.naturalWidth,height:image.naturalHeight})),samePromise:AlienShooterBakedLoader.load()===AlienShooterBakedLoader.load()}));
    assert.equal(loaded.status,'ready');assert.equal(loaded.images.length,5);assert.ok(loaded.images.every(image=>image.complete&&image.width>0&&image.height>0));assert.equal(loaded.samePromise,true);
    assert.equal((await snapshot(f.page)).stats.minimapDraws,0);
    await tick(f.page,15);assert.equal((await snapshot(f.page)).stats.minimapDraws,0,'Hidden title HUD never repaints the minimap');
    await f.page.evaluate(()=>AlienShooterTV.suspend(true));await tick(f.page,2);const suspendedTitle=await snapshot(f.page);
    await tick(f.page,20);assert.equal((await snapshot(f.page)).frames,suspendedTitle.frames,'Native suspension also stops title animation work');
    await f.page.evaluate(()=>AlienShooterTV.suspend(false));await tick(f.page,2);assert.ok((await snapshot(f.page)).frames>suspendedTitle.frames);
    assert.deepEqual(f.errors,[]);await f.context.close();pass('texture preload gates renderer startup, decodes exactly five deduplicated images, and hidden title HUD does no minimap work');
  }
  {
    const f=await fixture({legacyDecode:true});await ready(f.page);
    await tap(f.page,'Start');await tick(f.page,9);
    assert.equal((await snapshot(f.page)).phase,'playing');
    await f.page.evaluate(()=>{const g=AlienShooterTV.game;g.players[0].invulnerable=999;g.noticeTime=0;window.__playerHud=document.querySelector('.player-hud');});
    const initial=await snapshot(f.page);assert.equal(initial.stats.minimapStaticBuilds,1);
    await tick(f.page,12);const moving=await snapshot(f.page);
    assert.equal(moving.stats.minimapStaticBuilds,1,'Grid and solid geometry are cached for the map');assert.ok(moving.stats.minimapDraws>initial.stats.minimapDraws);
    await f.page.evaluate(()=>{const p=AlienShooterTV.game.players[0];p.hp=57;p.armor=19;p.weapon='smg';p.owned=['pistol','smg'];p.ammo.smg=73;});
    await tick(f.page,8);
    assert.equal(await f.page.evaluate(()=>document.querySelector('.player-hud')===__playerHud),true,'Changing health/ammo preserves the HUD nodes');
    assert.match(await f.page.locator('.health-line b').innerText(),/^57\//);assert.equal(await f.page.locator('.ammo-count').innerText(),'73');
    await tap(f.page,'Start');await tick(f.page,18);const paused=await snapshot(f.page);assert.equal(paused.phase,'paused');
    await tick(f.page,60);const idle=await snapshot(f.page);
    assert.equal(idle.frames,paused.frames,'Paused scene performs no redundant WebGL submissions');
    assert.equal(idle.stats.domWrites,paused.stats.domWrites,'Unchanged UI makes no DOM writes');
    assert.equal(idle.stats.minimapDraws,paused.stats.minimapDraws,'Paused tactical map is unchanged');
    assert.equal(idle.published,paused.published,'Unchanged phone state does not cross the Java bridge repeatedly');
    assert.ok(idle.snapshots>paused.snapshots,'Controller snapshots still run while rendering is idle');
    await tap(f.page,'Start');assert.equal((await snapshot(f.page)).phase,'playing');
    const grenades=await f.page.evaluate(()=>AlienShooterTV.game.players[0].grenades);
    await tap(f.page,'b');assert.equal(await f.page.evaluate(()=>AlienShooterTV.game.players[0].grenades),grenades-1,'A sub-frame local press survives until one simulation read');
    await tick(f.page,10);assert.equal(await f.page.evaluate(()=>AlienShooterTV.game.players[0].grenades),grenades-1,'The short tap is consumed only once');
    await f.page.evaluate(()=>{AlienShooterTV.key('b',true);AlienShooterTV.key('b',false);AlienShooterTV.suspend(true);AlienShooterTV.suspend(false);});
    await tap(f.page,'Start');assert.equal(await f.page.evaluate(()=>AlienShooterTV.game.players[0].grenades),grenades-1,'Suspend cancels an unconsumed press');
    assert.deepEqual(f.errors,[]);await f.context.close();pass('legacy image loading, stable HUD nodes, cached minimap, idle rendering/bridge work and short-tap/suspend semantics');
  }
  {
    const f=await fixture();await ready(f.page);await tap(f.page,'Start');await tick(f.page,8);
    const previous=await snapshot(f.page);
    await f.page.evaluate(()=>{const g=AlienShooterTV.game;g.loadStage(1);g.players[0].invulnerable=999;});await tick(f.page,8);
    assert.equal((await snapshot(f.page)).stats.minimapStaticBuilds,previous.stats.minimapStaticBuilds+1,'Changing maps rebuilds the static minimap exactly once');
    const sampleDoor=()=>{const g=AlienShooterTV.game,d=g.map.doors[0],c=document.getElementById('tactical-map');return [...c.getContext('2d').getImageData(Math.floor((d.x+d.w/2)*c.width/g.map.width),Math.floor((d.y+d.h/2)*c.height/g.map.height),1,1).data];};
    const doorClosed=await f.page.evaluate(sampleDoor);await f.page.evaluate(()=>{AlienShooterTV.game.map.doors[0].open=true;});await tick(f.page,8);
    assert.notDeepEqual(await f.page.evaluate(sampleDoor),doorClosed,'Door state remains dynamic over the cached background');
    await f.page.evaluate(()=>{const g=AlienShooterTV.game;g.phase='shop';g.credits=1000;g.noticeTime=0;});await tick(f.page,15);
    const shop=await snapshot(f.page);await tick(f.page,20);assert.equal((await snapshot(f.page)).frames,shop.frames);
    assert.equal(await f.page.evaluate(()=>AlienShooterTV.game.buy(0)),true);await tick(f.page,2);
    assert.equal((await snapshot(f.page)).frames,shop.frames+1,'A shop purchase invalidates the frozen scene');
    const bought=await snapshot(f.page);await tick(f.page,12);assert.equal((await snapshot(f.page)).frames,bought.frames);
    assert.equal((await snapshot(f.page)).stats.minimapDraws,shop.stats.minimapDraws,'Hidden shop HUD does not draw');
    await f.page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick(f.page,2);assert.equal((await snapshot(f.page)).frames,bought.frames+1,'Resize redraws a frozen scene once');
    await f.page.evaluate(()=>{AlienShooterTV.game.phase='playing';});await tick(f.page,2);
    await f.page.evaluate(()=>{window.__loss=AlienShooterTV.renderer.renderer.getContext().getExtension('WEBGL_lose_context');if(!__loss)throw new Error('Test browser lacks context-loss extension');__loss.loseContext();});
    await f.page.waitForFunction(()=>AlienShooterTV.renderer.contextLost,null,{polling:50});await tick(f.page,2);
    const lost=await snapshot(f.page);assert.equal(lost.phase,'paused');await tick(f.page,10);assert.equal((await snapshot(f.page)).frames,lost.frames);
    await f.page.evaluate(()=>__loss.restoreContext());await f.page.waitForFunction(()=>!AlienShooterTV.renderer.contextLost,null,{polling:50});await tick(f.page,2);
    assert.ok((await snapshot(f.page)).frames>lost.frames,'Restoration redraws the paused scene');assert.equal((await snapshot(f.page)).phase,'paused','Graphics restoration does not resume combat');
    await tap(f.page,'Start');assert.equal((await snapshot(f.page)).phase,'playing');
    await f.page.evaluate(()=>{AlienShooterTV.dispose();AlienShooterTV.dispose();});const disposed=await snapshot(f.page);await tick(f.page,10);assert.equal((await snapshot(f.page)).frames,disposed.frames);assert.equal(await f.page.evaluate(()=>__callbacks.size),0);
    assert.deepEqual(f.errors,[]);await f.context.close();pass('map and door invalidation, frozen shop purchase/resize redraw, genuine graphics restoration and clean disposal');
  }
  for(const options of [{broken:true},{noWebgl:true}]) {
    const f=await fixture(options);await f.page.locator('#game-loading[data-failed="true"]').waitFor({state:'visible'});
    assert.ok((await f.page.locator('#loading-detail').innerText()).length>0);
    if(options.broken){assert.equal(await f.page.evaluate(()=>AlienShooterBakedLoader.status),'failed');assert.equal(await f.page.evaluate(()=>!!window.AlienShooterTV),false);assert.match(await f.page.locator('#loading-detail').innerText(),/baked-atlas\.png/);}
    else assert.equal(await f.page.evaluate(()=>AlienShooterBakedLoader.status),'ready');
    assert.deepEqual(f.errors,[]);await f.context.close();pass(options.broken?'Missing baked assets produce a visible startup error, with no partial renderer':'Missing WebGL remains a visible startup error after successful offline preload');
  }
  console.log(`PASS ${checks} runtime performance and startup scenarios`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
