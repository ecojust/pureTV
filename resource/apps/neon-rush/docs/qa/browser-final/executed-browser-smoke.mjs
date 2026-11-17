#!/usr/bin/env node
// Independent Neon Rush acceptance: ordinary inputs, actual wall time, no state writes.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs, sourceHashes, serveAssets, launch, preparePage, snapshot, tap,
  applyKeys, releaseAll, verifyErrors, inspectFrame, summarize, delay, sha256 } from '../../../game-kit/qa/common.mjs';
import * as automation from './automation.mjs';

const args = parseArgs();
assert.ok(args.assets && args.output, 'Usage: node browser-smoke.mjs --assets /extracted/assets --output /empty/result-dir [--track 0|1|2 | --tracks 1,2] [--seconds 300] [--skip-touch]');
const assets = path.resolve(args.assets), output = path.resolve(args.output);
assert.ok(output !== assets && !output.startsWith(assets + path.sep));
await mkdir(output, { recursive:true });
assert.equal((await readdir(output)).length, 0, 'Keep failed reports: use an empty output directory for each run');
const assetHashes = await sourceHashes(assets);
const config = JSON.parse(await readFile(path.join(assets, 'game-config.json'), 'utf8'));
const source = fileURLToPath(import.meta.url);
const strategySources = ['../source/model.mjs','../source/tracks.mjs','./automation.mjs'];
const strategySourceHashes = Object.fromEntries(await Promise.all(strategySources.map(async name=>[name,sha256(await readFile(new URL(name,import.meta.url)))])));
function compact(state) {
  return {phase:state.phase,paused:state.paused,tick:state.tick,level:state.level,renderer:state.renderer,model:{...state.model,cars:state.model.cars.map(c=>({id:c.id,x:c.x,y:c.y,z:c.z,speed:c.speed,progress:c.progress,lap:c.lap,finished:c.finished})),player:{...state.model.player}}};
}
const report = { startedAt:new Date().toISOString(), status:'running', sourceAssetHashes:assetHashes,
  scriptSha256:sha256(await readFile(source)), strategySourceHashes, traceFormat:'Compact copies of actual snapshots (no rolling frameTimes array); player/stats/checkpoints retained', automationSha256:sha256(await readFile(new URL('./automation.mjs', import.meta.url))),
  environment:{renderer:'ANGLE SwiftShader',physicalTvTested:false,physicalPhoneTested:false},
  inputMethod:'Ordinary Playwright keyboard/mouse and CDP touch input; readonly deep-copy snapshots; no time override or state setters',
  tests:[], races:[], screenshots:[], visualReviewCompleted:false };
await writeFile(path.join(output,'executed-browser-smoke.mjs'),await readFile(source));
await writeFile(path.join(output,'executed-automation.mjs'),await readFile(new URL('./automation.mjs',import.meta.url)));
const server = await serveAssets(assets, args.entry || 'tv.html'), browser = await launch();
report.environment.browser = await browser.version();
let session, stopRequested=false;
process.on('SIGINT',()=>{stopRequested=true;console.log('Stop requested; preserving the current actual-input trace.');});
async function test(name, action) {
  const began = performance.now(), item = { name, status:'running' };report.tests.push(item);
  try { item.details = await action();item.status = 'passed'; }
  catch (e) { item.status = 'failed';item.error = e.stack;throw e; }
  finally { item.wallSeconds = (performance.now() - began) / 1000;console.log(JSON.stringify(item)); }
}
async function screenshot(page, name) {
  const file = path.join(output, name + '.png'); report.screenshots.push(path.basename(file));
  return inspectFrame(page, file, '#game');
}
async function checkLayout(page, width, height) {
  await page.setViewportSize({ width, height });await delay(250);
  const measured = await page.evaluate(() => {
    const box = el => { const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
    const result={viewport:{width:innerWidth,height:innerHeight},body:{scrollWidth:document.body.scrollWidth,scrollHeight:document.body.scrollHeight},elements:{},texts:[]};
    for(const id of ['game','overlay','primary','dialog-title','difficulty-controls','title','hud']) {
      const el=document.getElementById(id);if(el)result.elements[id]={box:box(el),visible:!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden',text:el.textContent};
    }
    const aside=document.querySelector('aside');
    if(aside&&getComputedStyle(aside).display!=='none')result.sidebar={box:box(aside),clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,clientWidth:aside.clientWidth,scrollWidth:aside.scrollWidth};
    for(const selector of ['#title','#dialog-title','#dialog-copy','#primary','#dialog-help','#tip','#room-address','.control p'])for(const el of document.querySelectorAll(selector)) {
      if(!el.getClientRects().length||getComputedStyle(el).display==='none')continue;
      const range=document.createRange();range.selectNodeContents(el);result.texts.push({selector,text:el.textContent,box:box(el),rects:[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}))});
    }
    return result;
  });
  assert.ok(measured.elements.game.visible && measured.elements.game.box.width>=200 && measured.elements.game.box.height>=100, 'Usable canvas');
  assert.ok(measured.body.scrollWidth<=width+1 && measured.body.scrollHeight<=height+1, 'No page overflow');
  if (measured.elements.overlay.visible) {
    for(const id of ['primary','difficulty-controls','dialog-title']) {
      const e=measured.elements[id];assert.ok(e?.visible, 'Visible '+id);assert.ok(e.box.left>=-1&&e.box.right<=width+1&&e.box.top>=-1&&e.box.bottom<=height+1, 'Unclipped '+id);
    }
  }
  if(measured.sidebar)assert.ok(measured.sidebar.scrollHeight<=measured.sidebar.clientHeight+1&&measured.sidebar.scrollWidth<=measured.sidebar.clientWidth+1,'Sidebar fits');
  for(const t of measured.texts) for(const r of t.rects) assert.ok(r.left>=-1&&r.right<=width+1&&r.top>=-1&&r.bottom<=height+1,'Visible text: '+t.selector+' '+t.text);
  return measured;
}
async function observeUntil(page, predicate, timeout, description) {
  const end=performance.now()+timeout;let state;
  do{state=await snapshot(page);if(predicate(state))return state;await delay(80);}while(performance.now()<end);
  throw new Error(description+'; last snapshot '+JSON.stringify(state));
}
try {
  session = await preparePage(browser, server.url, { metrics:true });
  const page = session.page;
  await test('menu loads version, 3 track choices and a real 3D renderer', async () => {
    await page.waitForFunction(v=>document.querySelector('#version').textContent===v,config.version);
    const s=await snapshot(page);assert.equal(s.phase,'menu');assert.equal(await page.locator('[data-level]').count(),3);
    assert.equal(s.renderer.renderer,'three-webgl');assert.ok(s.renderer.drawCalls>0,'Actual draw submissions');
    report.environment.webgl=await page.evaluate(()=>{const gl=document.querySelector('#game').getContext('webgl2');const info=gl.getExtension('WEBGL_debug_renderer_info');return {version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(info?info.UNMASKED_RENDERER_WEBGL:gl.RENDERER),vendor:gl.getParameter(info?info.UNMASKED_VENDOR_WEBGL:gl.VENDOR)};});
    const cloned=await page.evaluate(()=>{const a=PureTVQA.snapshot();a.model.player.x=999999;return PureTVQA.snapshot().model.player.x!==999999;});assert.ok(cloned);
    await screenshot(page,'01-menu');return s;
  });
  await test('menus fit desktop and compact TV viewports', async () => {
    const layouts=[];for(const [w,h] of [[960,540],[1280,720]]){layouts.push(await checkLayout(page,w,h));await screenshot(page,'menu-'+w);}
    return layouts;
  });
  await test('ordinary Phone panel expansion fits both TV viewports',async()=>{
    const panel=page.locator('aside'),button=page.locator('#rush-phone-button'),layouts=[];
    assert.ok(await button.isVisible(),'Browser Phone button');
    await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');assert.ok(await panel.isVisible(),'Expanded controller instructions');
    for(const [w,h] of [[960,540],[1280,720]]){const measurement=await checkLayout(page,w,h);assert.ok(measurement.sidebar,'Expanded sidebar present');const b=measurement.sidebar.box;assert.ok(b.left>=-1&&b.top>=-1&&b.right<=w+1&&b.bottom<=h+1,'Phone sidebar inside viewport');layouts.push(measurement);await screenshot(page,'phone-panel-'+w);}
    await button.click();assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await panel.isVisible(),false,'Phone panel closes through normal click');return layouts;
  });
  await test('ordinary start, pause, resume and retry', async () => {
    await tap(page,'Enter');await observeUntil(page,s=>s.phase==='playing'&&s.model.countdown<=0&&s.model.player.speed>10,40000,'Playable countdown');
    await tap(page,'p');await observeUntil(page,s=>s.paused,5000,'Pause');const a=await snapshot(page);await delay(350);const b=await snapshot(page);assert.equal(a.tick,b.tick);assert.deepEqual(a.model,b.model);
    await screenshot(page,'02-paused');await tap(page,'p');await observeUntil(page,s=>!s.paused&&s.tick>b.tick,8000,'Resume');
    report.tests.push({name:'Real operating-system blur',status:'unsupported',details:'Headless Chromium tab activation did not generate window blur in preserved attempt 1. Native focus loss requires device/headful validation; shared lifecycle protocol has separate synthetic regression coverage.'});
    await tap(page,'r');await observeUntil(page,s=>s.model.countdown>0&&!s.paused,8000,'Ordinary retry');
    const reset=await snapshot(page);automation.assertRetry({after:reset},assert);return {pausedTick:a.tick,retry:reset};
  });
  await session.context.close();session=null;
  assert.ok(!(args.track!==undefined&&args.tracks!==undefined),'Use either --track or --tracks');
  const tracks=args.tracks!==undefined?String(args.tracks).split(',').map(Number):args.track===undefined?[0,1,2]:[Number(args.track)];assert.equal(new Set(tracks).size,tracks.length);assert.ok(tracks.every(x=>Number.isInteger(x)&&x>=0&&x<3));report.requestedTracks=tracks;report.touchControlsRequested=!args['skip-touch'];
  const maximumSeconds=Number(args.seconds||300);assert.ok(maximumSeconds>=30&&maximumSeconds<=600);
  for(const level of tracks) {
    session=await preparePage(browser,server.url,{metrics:true});const page=session.page;
    const race={trackIndex:level,status:'running',trace:[],inputs:[],gameplayCaptures:[]};report.races.push(race);
    await test('complete two real laps on track '+level,async()=>{
      await page.locator('[data-level="'+level+'"]').click();const menu=await snapshot(page);assert.equal(menu.level,level);
      await tap(page,'Enter');await observeUntil(page,s=>s.phase==='playing',10000,'Ordinary start reaches the next rendered frame');const started=performance.now(),held=new Set(),pendingCaptures=[];let last;
      try{
        while((performance.now()-started)/1000<maximumSeconds){
          last=await snapshot(page);const elapsed=(performance.now()-started)/1000;race.trace.push({elapsed,state:compact(last)});
          for(const at of [8,20])if(last.phase==='playing'&&last.model.raceTime>=at&&!race.gameplayCaptures.some(x=>x.targetSeconds===at)){
            const file='race-'+level+'-playing-'+at;
            const capture={targetSeconds:at,requestedRaceTime:last.model.raceTime,actualScreenshot:file+'.png'};
            race.gameplayCaptures.push(capture);report.screenshots.push(file+'.png');
            // Capturing pixels must not freeze the driver's held steering key.
            // This read-only request runs while ordinary keyboard feedback continues.
            pendingCaptures.push(page.screenshot({path:path.join(output,file+'.png')}).then(async()=>{
              const observed=await snapshot(page);capture.completedRaceTime=observed.model.raceTime;
              console.log(JSON.stringify({event:'gameplay-capture',level,elapsed,raceTime:observed.model.raceTime,completedLaps:observed.model.player.completedLaps,stats:observed.model.stats,file:file+'.png'}));
            }).catch(error=>{capture.error=String(error);race.captureError=String(error);}));
          }
          assert.equal(stopRequested,false,'Run manually interrupted; actual trace retained');
          if(last.phase==='won'||last.phase==='lost')break;
          assert.equal(last.phase,'playing');assert.equal(last.paused,false);
          const requested=automation.keys(last,{elapsed,mode:'race'});
          for(const change of await applyKeys(page,requested,held))race.inputs.push({...change,elapsed});
          await delay(80);
        }
      }finally{await releaseAll(page,[...held]);await Promise.all(pendingCaptures);}
      race.wallSeconds=(performance.now()-started)/1000;race.final=await snapshot(page);assert.equal(race.captureError,undefined,'Gameplay screenshots captured while driver remained active');
      await screenshot(page,'race-'+level+'-final');
      const samples=(await page.evaluate(()=>PureTVRenderMetrics.snapshot())).samples;
      race.performance={rafIntervalMs:summarize(samples.map(x=>x.rafIntervalMs)),drawCalls:summarize(samples.map(x=>x.webglDrawCalls)),note:'Instrumented Chromium/SwiftShader; not device frame rate'};
      assert.equal(race.final.phase,'won','Finish by driving through checkpoints, not by timeout');
      assert.equal(race.final.model.player.completedLaps,2);assert.equal(race.final.model.player.finished,true);
      automation.assertProgress({before:menu,after:race.final,trace:race.trace},assert);
      assert.ok(race.final.model.stats.miniBoosts>0,'Actual drift-release mini boost');
      if(level===2)assert.ok(race.final.model.stats.jumps>0,'Actual canyon jump');
      assert.ok(race.performance.drawCalls.max<=automation.budgets.maxWebGLDrawCalls,'3D submission budget');
      verifyErrors(session);race.status='passed';return {trackId:race.final.model.trackId,wallSeconds:race.wallSeconds,raceTime:race.final.model.raceTime,rank:race.final.model.rank,stats:race.final.model.stats,performance:race.performance};
    });
    await writeFile(path.join(output,'race-'+level+'.json'),JSON.stringify(race,null,2)+'\n');
    await session.context.close();session=null;
  }
  if(!args['skip-touch'])await test('narrow landscape touch controls and pointer cancellation',async()=>{
    session=await preparePage(browser,server.url+'?touch=1',{viewport:{width:844,height:390}});const page=session.page;
    await page.locator('#primary').click();await observeUntil(page,s=>s.model.countdown<=0&&s.model.player.speed>14,40000,'Touch countdown and acceleration');
    const selector=n=>'[data-rush-control="'+n+'"]';
    for(const n of ['left','right','brake','drift','nitro'])assert.ok(await page.locator(selector(n)).isVisible(),'Touch button '+n);
    const cdp=await session.context.newCDPSession(page);const bounds=await page.locator(selector('right')).boundingBox();const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
    const drift=await page.locator(selector('drift')).boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1},{x:drift.x+drift.width/2,y:drift.y+drift.height/2,id:2}]});await delay(650);const held=await snapshot(page);
    assert.ok(held.model.player.steer>0.1,'Real touch steers right');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    const cancelled=await observeUntil(page,s=>s.paused,5000,'Touch cancellation pauses safely');
    assert.equal(cancelled.model.stats.miniBoosts,held.model.stats.miniBoosts,'Cancellation is not a rewarded drift release');
    await tap(page,'p');await observeUntil(page,s=>!s.paused&&s.tick>cancelled.tick,8000,'Explicit resume after touch cancellation');
    await delay(450);const released=await snapshot(page);
    assert.ok(Math.abs(released.model.player.steer)<Math.abs(held.model.player.steer),'Cancellation releases touch steering');
    assert.equal(released.model.stats.miniBoosts,held.model.stats.miniBoosts,'No stale drift action after resume');
    await screenshot(page,'touch-landscape');verifyErrors(session);await session.context.close();session=null;
    return {heldSteer:held.model.player.steer,releasedSteer:released.model.player.steer};
  });
  assert.deepEqual(await sourceHashes(assets),assetHashes,'Tested assets remain unchanged');
  for(const [name,hash] of Object.entries(strategySourceHashes))assert.equal(sha256(await readFile(new URL(name,import.meta.url))),hash,'Strategy source changed: '+name);
  report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;
  if(report.races.at(-1)?.status==='running'){report.races.at(-1).status='failed';report.races.at(-1).error=error.stack;}
  if(session){await session.page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});report.lastSnapshot=await snapshot(session.page).catch(()=>null);report.browserErrors={page:session.errors,console:session.consoleErrors,network:session.network};}
}finally{
  if(session)await session.context.close();await browser.close();await server.close();report.finishedAt=new Date().toISOString();
  report.allThreeTracksCompleted=report.races.length===3&&report.races.every(r=>r.status==='passed');
  report.touchControlsVerified=report.tests.some(t=>t.name==='narrow landscape touch controls and pointer cancellation'&&t.status==='passed');
  for(const race of report.races)await writeFile(path.join(output,'race-'+race.trackIndex+'.json'),JSON.stringify(race,null,2)+'\n');
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Report: '+path.join(output,'report.json'));
}
