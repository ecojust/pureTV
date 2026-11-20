const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root='/dev/shm/puretv-submit',game=root+'/joystick-games/backroad-rally',out=__dirname;
const {chromium}=require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const esbuild=require(game+'/node_modules/esbuild');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixture=`
import {configurePureTv} from './src/upstream/src/puretv';
import {StageMenus} from './src/upstream/src/menu/stageMenus';
const w=window;
let paused=false;
const menus=new StageMenus({sub:'isolated menu fixture',controls:[],mode:'quick',canPause:()=>true,onPause:p=>paused=p,restart:()=>{},recover:()=>{},quit:()=>{},settings:{} as any},{warmup_min_s:1.5,warmup_max_s:6,warmup_frame_ms:25,warmup_stable_frames:45,curtain_fade_s:.6});
configurePureTv({phase:()=>menus.ready&&!menus.open?'play':'menu',ready:()=>menus.ready,pause:()=>{if(!menus.open)menus.pause()},clear:()=>{},paused:()=>paused,audio:()=> 'fixture',observe:()=>({phase:'intro',ready:menus.ready})});
let last=performance.now();
function tick(now){const frameDt=now-last;last=now;menus.frame(Math.min(frameDt/1000,.1),frameDt,false);requestAnimationFrame(tick)}requestAnimationFrame(tick);
w.fixtureRead=()=>({ready:menus.ready,paused,open:menus.open,adapter:w.PureTvBackroad.snapshot(),game:w.JoystickGameQA.snapshot()});
`;
(async()=>{
 const built=await esbuild.build({stdin:{contents:fixture,resolveDir:game,sourcefile:'navigation-cancel-fixture.ts',loader:'ts'},bundle:true,format:'iife',write:false,platform:'browser',target:'es2020',metafile:true});
 fs.writeFileSync(out+'/fixture.ts',fixture);
 const inputs=[];
 for(const name of Object.keys(built.metafile.inputs)){if(name==='navigation-cancel-fixture.ts')continue;const full=path.resolve(name);if(!fs.existsSync(full))continue;const rel=path.relative(root,full);const bytes=fs.readFileSync(full);let frozen=null;if(!rel.includes('node_modules')){const old=cp.execFileSync('git',['show','2ea1383fa59c30abac7e07df8f4b9dfae343abf9:'+rel],{cwd:root,maxBuffer:8e6});if(!bytes.equals(old))throw Error('Current source differs from original Windows source: '+rel);frozen=hash(old)}inputs.push({path:rel,bytes:bytes.length,sha256:hash(bytes),original2eaSha256:frozen})}
 const bridgePath=root+'/joystick-games/shared/windows/Web/bridge.js',bridge=fs.readFileSync(bridgePath);const originalBridge=cp.execFileSync('git',['show','2ea1383fa59c30abac7e07df8f4b9dfae343abf9:joystick-games/shared/windows/Web/bridge.js'],{cwd:root});if(!bridge.equals(originalBridge))throw Error('bridge changed');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu','--disable-webgl'],env:{...process.env,TMPDIR:'/dev/shm/racing-review-driving/tmp'}});
 const result={scope:'Actual original Windows bridge + shared input + Backroad adapter + StageMenus in isolated DOM browser. No COM/native host/TCP/game renderer/physics model loaded. Exact connected disabled cancelSeq4 document seed then connected enabled cancelSeq5, including actual wifiController.inputEnabled metadata, under three game-registration/poll orderings; late post-registration disable is separate positive control. No START emitted. Actual wall-clock RAF and original warmup constants; no clock/model overrides.',originalSourceSha:'2ea1383fa59c30abac7e07df8f4b9dfae343abf9',bridgeSha256:hash(bridge),scriptSha256:hash(fs.readFileSync(__filename)),fixtureSha256:hash(Buffer.from(fixture)),inputs,cases:[],passed:false};
 const sample=(revision,enabled,cancelSeq=4,startCount=0,held=false)=>({revision,inputEnabled:enabled,players:[{id:1,connected:true,transport:'wifi',controllerId:'Fixture-only',session:'unchanged-session',cancelSeq,buttons:{UP:false,DOWN:false,LEFT:false,RIGHT:false,START:held,A:false,B:false,X:false,Y:false},buttonCounters:{UP:0,DOWN:0,LEFT:0,RIGHT:0,START:startCount,A:7,B:3,X:0,Y:0}}]});
 try{
 for(const kind of ['enable-before-game-import','enable-after-import-before-first-poll','enable-after-first-polls','late-disabled-control']){
  const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.route('http://fixture.local/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Backroad isolated navigation cancellation</title></head><body></body></html>'}));await page.goto('http://fixture.local/tv.html?mode=quick&stage=finland&car=swift');await page.addScriptTag({content:bridge.toString()});
  const seed=sample(200,false,4),enabled=sample(201,true,5);
  const disabledInfo={platform:'windows',storageKeys:[],preferences:{},wifiController:{inputEnabled:false}};
  const enabledInfo={platform:'windows',storageKeys:[],preferences:{},wifiController:{inputEnabled:true}};
  const beforeSeed=await page.evaluate(()=>({hasGame:!!window.PureGame}));
  if(beforeSeed.hasGame)throw Error('Document-start fixture already has game callback');
  await page.evaluate(({i,s})=>window.JoystickDesktop.receive(i,s),{i:disabledInfo,s:seed});
  if(kind==='enable-before-game-import')await page.evaluate(({i,s})=>window.JoystickDesktop.receive(i,s),{i:enabledInfo,s:enabled});
  let content=built.outputFiles[0].text;
  if(kind==='enable-after-import-before-first-poll')content+='\nwindow.JoystickDesktop.receive('+JSON.stringify(enabledInfo)+','+JSON.stringify(enabled)+');';
  await page.addScriptTag({content});
  await page.waitForFunction(()=>window.fixtureRead&&window.fixtureRead().adapter.pollCount>1);
  const beforeEnable=await page.evaluate(()=>window.fixtureRead());
  if(kind==='enable-after-first-polls'||kind==='late-disabled-control')await page.evaluate(({i,s})=>window.JoystickDesktop.receive(i,s),{i:enabledInfo,s:enabled});
  await page.waitForFunction(()=>window.fixtureRead().adapter.connected);
  if(kind==='late-disabled-control'){
   await page.evaluate(({i,s})=>window.JoystickDesktop.receive(i,s),{i:disabledInfo,s:sample(202,false,6)});
   await page.waitForFunction(()=>window.fixtureRead().adapter.pendingPause);
   await page.evaluate(({i,s})=>window.JoystickDesktop.receive(i,s),{i:enabledInfo,s:sample(203,true,7)});
  }
  const early=await page.evaluate(()=>window.fixtureRead());
  await page.waitForFunction(()=>window.fixtureRead().ready,null,{timeout:15000});await page.waitForTimeout(100);
  const ready=await page.evaluate(()=>window.fixtureRead());const expectedPaused=kind==='late-disabled-control';if(ready.paused!==expectedPaused)throw Error(kind+' unexpected ready pause');
  const resumed=null;
  const compact=s=>s&&({ready:s.ready,paused:s.paused,open:s.open,pendingPause:s.adapter.pendingPause,pollCount:s.adapter.pollCount,cancelled:s.adapter.cancelled,connected:s.adapter.connected,stage:s.game.stage,menuFocus:s.game.gameplay.menuFocus,buttons:s.adapter.buttons});
  result.cases.push({kind,beforeSeed,disabledSeed:seed,enableSample:enabled,beforeEnable:compact(beforeEnable),early:compact(early),afterOriginalWarmup:compact(ready),afterOneOrdinaryStart:compact(resumed),pageErrors:errors});if(errors.length)throw Error(errors.join('\n'));await page.close();
 }
 result.passed=true;
 }finally{await browser.close();fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,cases:result.cases}));}
})().catch(e=>{console.error(e);process.exitCode=1});
