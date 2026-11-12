// Synthetic bridge protocol fixtures. Real shared runtime + Neon Rush model;
// manual RAF makes cancellation boundaries deterministic. Not TCP, DNS-SD,
// physical hardware, actual gameplay footage, or performance evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { mkdtemp, copyFile, writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { launch, serveAssets, sha256 } from '../../../game-kit/qa/common.mjs';

const kit=fileURLToPath(new URL('../../../game-kit/web/',import.meta.url));
const game=fileURLToPath(new URL('../src/main/assets/game-model.js',import.meta.url));
const fixtureGame=`window.lastUi=null;window.GameDef={id:'neon-rush-wifi-probe',title:'Wi-Fi input protocol fixture',description:'Synthetic bridge',tip:'Not a device test',controls:{move:'Move',a:'Drift',b:'Nitro'},holdConfirmAsA:true,hud:()=>[],result:()=>'',createRenderer(){return{begin(){},end(){},draw(){},dispose(){},metrics:{renderer:'protocol-fixture'}};},render(){},afterUI(s,ui){window.lastUi=JSON.parse(JSON.stringify(ui));}};`;

test('Wi-Fi controller snapshots integrate with the real racing rules', {timeout:90000},async t=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'neon-rush-wifi-protocol-'));
  const report={scope:'Synthetic bridge with manual RAF; actual shared runtime and racing model. No real TCP/mDNS or hardware claims.',physicalTvTested:false,physicalControllerTested:false,passed:false,tests:[],sourceHashes:{'runtime.js':sha256(await readFile(path.join(kit,'runtime.js'))),'game-model.js':sha256(await readFile(game)),'test':sha256(await readFile(fileURLToPath(import.meta.url)))}};
  let browser,server;
  try{
    for(const name of ['runtime.js','renderer.js','tv.html','tv.css'])await copyFile(path.join(kit,name),path.join(temporary,name));
    await copyFile(game,path.join(temporary,'game-model.js'));
    await writeFile(path.join(temporary,'game.js'),fixtureGame);
    await writeFile(path.join(temporary,'game-config.json'),JSON.stringify({version:'0.1.1'}));
    server=await serveAssets(temporary);browser=await launch();
    async function open(){
      const context=await browser.newContext({viewport:{width:960,height:540}});
      await context.addInitScript(()=>{
        window.__queue=[];window.requestAnimationFrame=f=>{window.__queue.push(f);return window.__queue.length;};
        window.__players=[];window.__info={wifiController:{state:'available',serviceName:'霓虹飞车',port:8765,serviceType:'_puretv._tcp',version:'1'}};
        window.PureGameHost={getInfo:()=>JSON.stringify(window.__info),snapshot:()=>JSON.stringify({players:window.__players}),publish(){}};
      });
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(server.url);await page.waitForFunction(()=>!!window.PureTVQA);let time=100;
      const frame=async(delta=20)=>{time+=delta;await page.evaluate(now=>{const q=window.__queue.splice(0);for(const f of q)f(now);},time);};
      const pump=async(n=1)=>{for(let i=0;i<n;i++)await frame();};
      const put=async(p={},kind='wifi')=>page.evaluate(({p,kind})=>{window.__players=p===null?[]:[{id:1,session:'first',controllerId:'esp32-test',transport:kind,connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0,...p}];},{p,kind});
      const snap=()=>page.evaluate(()=>PureTVQA.snapshot());
      const start=async(kind='wifi')=>{await put({},kind);await pump(2);await put({start:true},kind);await pump(3);await put({},kind);await pump(230);assert.equal((await snap()).phase,'playing');assert.equal((await snap()).paused,false);};
      return {context,page,errors,put,pump,snap,start};
    }
    async function run(name,fn){await t.test(name,async()=>{const s=await open();try{await fn(s);assert.deepEqual(s.errors,[]);report.tests.push({name,passed:true});}catch(e){report.tests.push({name,passed:false,error:e.stack});throw e;}finally{await s.context.close();}});}
    await run('Wi-Fi START, steering, drift release and nitro reach actual model',async s=>{
      await s.start();const initial=await s.snap();assert.ok(initial.model.player.speed>10);
      await s.put({x:.55,a:true});await s.pump(55);const drift=await s.snap();assert.ok(drift.model.player.steer>.2);assert.ok(drift.model.stats.drifts>0);assert.equal(drift.connection.controllerKind,'wifi');
      await s.put({x:.2});await s.pump(8);assert.ok((await s.snap()).model.stats.miniBoosts>0);
      await s.put({b:true});await s.pump(2);await s.put({});await s.pump(3);assert.equal((await s.snap()).model.stats.nitros,1);
      await s.pump(6);assert.match(await s.page.locator('#connection').textContent(),/Wi-Fi/);
      const ui=await s.page.evaluate(()=>lastUi);assert.equal(ui.controllerKind,'wifi');assert.equal(ui.wifiController.port,8765);
    });
    await run('Disconnect freezes race; stale reconnect actions cannot resume or earn a boost',async s=>{
      await s.start();await s.put({x:.5,a:true});await s.pump(50);const before=await s.snap();
      await s.put(null);await s.pump(2);const paused=await s.snap();assert.equal(paused.paused,true);
      await s.pump(10);assert.deepEqual((await s.snap()).model,paused.model);
      await s.put({session:'reconnected',a:true,b:true,start:true,select:true,x:1});await s.pump(12);
      const reconnected=await s.snap();assert.equal(reconnected.paused,true);assert.equal(reconnected.tick,paused.tick);assert.equal(reconnected.model.stats.nitros,before.model.stats.nitros);assert.equal(reconnected.model.stats.miniBoosts,before.model.stats.miniBoosts);
      await s.put({session:'reconnected'});await s.pump(3);await s.put({session:'reconnected',start:true});await s.pump(3);await s.put({session:'reconnected'});await s.pump(8);
      const resumed=await s.snap();assert.equal(resumed.paused,false);assert.ok(resumed.tick>paused.tick);assert.equal(resumed.model.stats.miniBoosts,before.model.stats.miniBoosts);assert.equal(resumed.model.stats.nitros,before.model.stats.nitros);
    });
    await run('Phone and Wi-Fi source switches pause even with identical seat/session values',async s=>{
      await s.start('phone');await s.put({x:-1,a:true},'phone');await s.pump(8);
      await s.put({x:1,b:true,start:true},'wifi');await s.pump(3);let state=await s.snap();assert.equal(state.paused,true);assert.equal(state.connection.controllerKind,'wifi');
      await s.put({},'wifi');await s.pump(2);await s.put({start:true},'wifi');await s.pump(2);await s.put({},'wifi');await s.pump(4);assert.equal((await s.snap()).paused,false);
      await s.put({x:-1,a:true,start:true},'phone');await s.pump(4);state=await s.snap();assert.equal(state.paused,true);assert.equal(state.connection.controllerKind,'phone');await s.pump(6);assert.match(await s.page.locator('#connection').textContent(),/扫码/);
    });
    await run('A cancellation sequence clears drift without an implicit controller switch pause',async s=>{
      await s.start();await s.put({x:.5,a:true});await s.pump(45);const before=await s.snap();
      await s.put({cancelSeq:1});await s.pump(5);const after=await s.snap();assert.equal(after.paused,false);assert.equal(after.model.stats.miniBoosts,before.model.stats.miniBoosts);assert.equal(after.model.player.drifting,false);
    });
    report.passed=report.tests.every(t=>t.passed)&&report.tests.length===4;
  }finally{
    if(browser)await browser.close();if(server)await server.close();await rm(temporary,{recursive:true,force:true});
    if(process.env.NEON_RUSH_WIFI_RUNTIME_OUTPUT){const output=path.resolve(process.env.NEON_RUSH_WIFI_RUNTIME_OUTPUT);await mkdir(output,{recursive:true});await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
  }
});
