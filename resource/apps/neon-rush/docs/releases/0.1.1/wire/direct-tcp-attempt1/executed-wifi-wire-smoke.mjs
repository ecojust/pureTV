#!/usr/bin/env node
// Real TCP JSONL -> production Java receiver -> read-only HTTP bridge -> actual game.
// Desktop JVM/Chromium integration, not Android NSD discovery or physical ESP32 evidence.
import assert from 'node:assert/strict';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, writeFile, readdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs, sourceHashes, launch, snapshot, delay, sha256, run, verifyErrors } from '../../../game-kit/qa/common.mjs';
import * as strategy from './automation.mjs';

const args=parseArgs();
assert.ok(args.assets&&args.output&&args.jdk&&args['json-jar'],'--assets --output --jdk --json-jar required');
const assets=path.resolve(args.assets),output=path.resolve(args.output),jdk=path.resolve(args.jdk),jsonJar=path.resolve(args['json-jar']);
assert.ok(output!==assets&&!output.startsWith(assets+path.sep));
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Use a fresh evidence directory; keep failures');
const production=fileURLToPath(new URL('../../../game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerServer.java',import.meta.url));
const harness=fileURLToPath(new URL('./WifiWireHarness.java',import.meta.url));
const self=fileURLToPath(import.meta.url);
const scriptFiles=[production,harness,self,fileURLToPath(new URL('./automation.mjs',import.meta.url)),fileURLToPath(new URL('../source/model.mjs',import.meta.url)),fileURLToPath(new URL('../source/tracks.mjs',import.meta.url))];
const hashes=Object.fromEntries(await Promise.all(scriptFiles.map(async f=>[f,sha256(await readFile(f))])));
assert.equal(sha256(await readFile(jsonJar)),'3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed','Pinned test-only Maven org.json 20240303');
const assetHashes=await sourceHashes(assets);
await copyFile(self,path.join(output,'executed-wifi-wire-smoke.mjs'));await copyFile(harness,path.join(output,'executed-WifiWireHarness.java'));await copyFile(production,path.join(output,'executed-WifiControllerServer.java'));
await mkdir(path.join(output,'classes'));
await run(path.join(jdk,'bin/javac'),['--release','17','-cp',jsonJar,'-d',path.join(output,'classes'),production,harness]);
const report={startedAt:new Date().toISOString(),status:'running',method:'Real production WifiControllerServer on desktop JVM, actual newline JSON/ACK over loopback TCP; test-only synchronous HTTP native-bridge adapter feeds its snapshots to the actual browser game. No PureGame.key, model writes or clock overrides.',physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,androidNsdTested:false,syntheticNativeBridge:true,sourceAssetHashes:assetHashes,sourceHashes:hashes,testJsonDependency:{version:'20240303',sha256:sha256(await readFile(jsonJar)),url:'https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar'},tests:[],inputs:[],snapshots:[],screenshots:[]};
let java,browser,context,session,peer,javaOutput='',javaError='';
const held=new Set();let currentVariant='AB';
function trace(s,label){report.snapshots.push({label,wallTime:new Date().toISOString(),phase:s.phase,paused:s.paused,tick:s.tick,connection:s.connection,model:{trackId:s.model.trackId,time:s.model.time,raceTime:s.model.raceTime,countdown:s.model.countdown,player:s.model.player,stats:s.model.stats}});}
async function observe(page,predicate,timeout=20000,label='state'){
 const end=performance.now()+timeout;let s;
 do{s=await snapshot(page);if(predicate(s)){trace(s,label);return s;}await delay(80);}while(performance.now()<end);
 throw new Error(label+' timed out: '+JSON.stringify({phase:s?.phase,paused:s?.paused,tick:s?.tick,model:s?.model}));
}
async function test(name,fn){const item={name,status:'running'};report.tests.push(item);try{item.details=await fn();item.status='passed';}catch(e){item.status='failed';item.error=e.stack;throw e;}finally{console.log(name+': '+item.status);}}
async function connect(port){
 const socket=net.createConnection({host:'127.0.0.1',port});socket.setNoDelay(true);await once(socket,'connect');
 let buffer='',seq=0;const pending=new Map();
 socket.on('error',()=>{});socket.on('data',data=>{buffer+=data.toString('utf8');let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);let ack;try{ack=JSON.parse(line);}catch(e){for(const p of pending.values())p.reject(e);pending.clear();continue;}const p=pending.get(ack.seq);if(p){pending.delete(ack.seq);clearTimeout(p.timer);p.resolve(ack);}}});
 socket.on('close',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('TCP closed before ACK'));}pending.clear();});
 return {socket,async send(key,pressed,action=pressed?'down':'tap'){
   const message={type:'button',seq:seq++,controller_id:'esp32-001122334455',key,pressed,action,duration_ms:action==='down'||action==='sync'?0:400};
   const awaited=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(message.seq);reject(new Error('No ACK for '+JSON.stringify(message)));},5000);pending.set(message.seq,{resolve,reject,timer});});
   socket.write(JSON.stringify(message)+'\n');const ack=await awaited;assert.equal(ack.seq,message.seq);assert.equal(ack.type,'ack');assert.equal(ack.ok,true);report.inputs.push({sentAt:new Date().toISOString(),message,ack});return ack;
 }};
}
async function release(){for(const key of [...held]){await peer.send(key,false);held.delete(key);}}
async function wireTap(key){await peer.send(key,true);await peer.send(key,false);}
async function drive(page,{gameSeconds=12,maxWallSeconds=60,variant='AB'}={}){
 currentVariant=variant;const before=await snapshot(page);const target=before.model.raceTime+gameSeconds;const start=performance.now();
 while((performance.now()-start)/1000<maxWallSeconds){
  const state=await snapshot(page);if(state.model.raceTime>=target)break;
  assert.equal(state.phase,'playing');assert.equal(state.paused,false);
  const choices=strategy.keys(state,{mode:'qa'});const map={ArrowLeft:'LEFT',ArrowRight:'RIGHT',ArrowUp:'UP',ArrowDown:'DOWN',Space:variant==='XY'?'X':'A',b:variant==='XY'?'Y':'B'};
  const next=new Set(choices.map(k=>map[k]).filter(Boolean));
  for(const key of [...held])if(!next.has(key)){await peer.send(key,false);held.delete(key);}
  for(const key of next)if(!held.has(key)){await peer.send(key,true);held.add(key);}
  await delay(80);
 }
 await release();const after=await snapshot(page);trace(after,'drive '+variant);assert.ok(after.model.raceTime>=target-.2,'Normal driving reached target game time');return {before,after};
}
try{
 java=spawn(path.join(jdk,'bin/java'),['-cp',path.join(output,'classes')+path.delimiter+jsonJar,'WifiWireHarness',assets],{stdio:['pipe','pipe','pipe']});
 java.stdout.on('data',b=>javaOutput+=b);java.stderr.on('data',b=>javaError+=b);
 const startupEnd=performance.now()+10000;while(!javaOutput.includes('\n')&&performance.now()<startupEnd){if(java.exitCode!==null)throw new Error('Java exited: '+javaError);await delay(30);}
 const ports=JSON.parse(javaOutput.split('\n')[0]);report.ports=ports;
 const url='http://127.0.0.1:'+ports.httpPort+'/';
 browser=await launch();report.browser=await browser.version();context=await browser.newContext({viewport:{width:960,height:540},locale:'zh-CN',deviceScaleFactor:1});
 await context.addInitScript(({tcpPort})=>{
   let latest=null;
   window.__wireBridge={lastSnapshot:()=>latest};
   window.PureGameHost={
     getInfo(){return JSON.stringify({url:'',qr:'',addresses:['127.0.0.1'],language:'zh',wifiController:{state:'unavailable',serviceName:'Loopback TCP test; no NSD',port:tcpPort,serviceType:'_puretv._tcp',version:'1'}});},
     snapshot(){const request=new XMLHttpRequest();request.open('GET','/__wifi/snapshot',false);request.send();if(request.status!==200)throw Error('Test bridge snapshot failed');latest=JSON.parse(request.responseText);return request.responseText;},
     publish(){},exit(){}
   };
 },{tcpPort:ports.tcpPort});
 const page=await context.newPage();session={page,errors:[],consoleErrors:[],network:[]};
 page.on('pageerror',e=>session.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')session.consoleErrors.push(m.text());});page.on('requestfailed',r=>session.network.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)session.network.push({url:r.url(),status:r.status()});});
 await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>typeof PureTVQA?.snapshot==='function');
 peer=await connect(ports.tcpPort);
 await test('all nine keys acknowledge sync and first sync does not start',async()=>{
  for(const key of ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'])await peer.send(key,false,'sync');
  await observe(page,s=>s.connection.controllerKind==='wifi',15000,'Wi-Fi connected');
  await peer.send('START',true,'sync');await peer.send('B',true,'sync');await delay(400);
  assert.equal((await snapshot(page)).phase,'menu');await peer.send('START',false,'sync');await peer.send('B',false,'sync');
  return {acknowledgedKeys:9,phase:(await snapshot(page)).phase};
 });
 await test('TCP START starts the actual game and all directions reach the bridge',async()=>{
  await wireTap('START');await observe(page,s=>s.phase==='playing'&&!s.paused,15000,'TCP start');
  // During countdown, verify actual native snapshots without moving the car off track.
  for(const [key,field,value] of [['UP','y',-1],['DOWN','y',1],['LEFT','x',-1],['RIGHT','x',1]]){
   await peer.send(key,true);await page.waitForFunction(([field,value])=>window.__wireBridge.lastSnapshot()?.players[0]?.[field]===value,[field,value],{timeout:10000});await peer.send(key,false);
  }
  await observe(page,s=>s.model.countdown<=0&&s.model.player.speed>12,25000,'TCP race accelerates');
  return {actualPhase:(await snapshot(page)).phase};
 });
 await test('real A/B TCP driving steers, drifts, releases mini turbo and consumes nitro',async()=>{
  const {before,after}=await drive(page,{gameSeconds:12,variant:'AB'});
  assert.ok(after.model.player.progress>before.model.player.progress+30);assert.ok(after.model.stats.drifts>0);assert.ok(after.model.stats.nitros>0);assert.ok(after.model.stats.miniBoosts>0);
  await wireTap('START');await observe(page,s=>s.paused,10000,'TCP pause');await page.screenshot({path:path.join(output,'tcp-driving-paused.png')});report.screenshots.push('tcp-driving-paused.png');
  await wireTap('START');await observe(page,s=>!s.paused,10000,'TCP resume');return {stats:after.model.stats,progress:after.model.player.progress};
 });
 await test('X/Y aliases control real drift and nitro after an ordinary keyboard restart',async()=>{
  // R is the existing public whole-race restart, not a simulation setter.
  await page.keyboard.press('r');await observe(page,s=>s.model.countdown>0&&s.model.stats.nitros===0,10000,'Ordinary retry');
  await observe(page,s=>s.model.countdown<=0,25000,'Retry countdown');
  const {after}=await drive(page,{gameSeconds:12,variant:'XY'});assert.ok(after.model.stats.drifts>0);assert.ok(after.model.stats.nitros>0);assert.ok(after.model.stats.miniBoosts>0);
  return {stats:after.model.stats};
 });
 await test('disconnect cancels held input and pauses; reconnect sync cannot auto-resume or boost',async()=>{
  await peer.send('RIGHT',true);held.add('RIGHT');await peer.send('A',true);held.add('A');
  await observe(page,s=>s.model.player.steer>.3,10000,'Held TCP steering');
  const before=await snapshot(page);peer.socket.end();await once(peer.socket,'close');held.clear();
  const paused=await observe(page,s=>s.paused&&s.connection.disconnected,10000,'Disconnected pause');const stable=await snapshot(page);await delay(350);assert.deepEqual((await snapshot(page)).model,stable.model);
  peer=await connect(ports.tcpPort);await peer.send('START',true,'sync');await peer.send('B',true,'sync');await peer.send('A',true,'sync');
  await observe(page,s=>s.connection.controllerKind==='wifi'&&!s.connection.disconnected,10000,'Reconnected');await delay(350);const synced=await snapshot(page);assert.equal(synced.paused,true);assert.deepEqual(synced.model,stable.model);
  for(const key of ['START','A','B','RIGHT'])await peer.send(key,false,'sync');
  await wireTap('START');const resumed=await observe(page,s=>!s.paused&&s.tick>paused.tick,10000,'Fresh TCP resume');assert.equal(resumed.model.stats.nitros,paused.model.stats.nitros);assert.equal(resumed.model.stats.miniBoosts,paused.model.stats.miniBoosts);
  await observe(page,s=>Math.abs(s.model.player.steer)<.1,10000,'Released steering');
  await wireTap('START');await observe(page,s=>s.paused,10000,'Final pause');await page.screenshot({path:path.join(output,'tcp-reconnected.png')});report.screenshots.push('tcp-reconnected.png');
  return {beforeTick:before.tick,pausedTick:paused.tick,resumedTick:resumed.tick};
 });
 verifyErrors(session);assert.deepEqual(await sourceHashes(assets),assetHashes);for(const f of scriptFiles)assert.equal(sha256(await readFile(f)),hashes[f],'Source changed during test: '+f);
 report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(session){report.lastSnapshot=await snapshot(session.page).catch(()=>null);await session.page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});report.errors=session.errors;report.consoleErrors=session.consoleErrors;report.network=session.network;}}
finally{
 if(peer)peer.socket.destroy();if(context)await context.close();if(browser)await browser.close();if(java){java.stdin.end();await Promise.race([once(java,'exit'),delay(3000)]);if(java.exitCode===null)java.kill('SIGTERM');}
 report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'java-stderr.log'),javaError);await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Report '+path.join(output,'report.json'));
}
