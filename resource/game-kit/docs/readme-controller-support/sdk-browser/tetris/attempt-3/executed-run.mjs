#!/usr/bin/env node
// Exact official controller page + SDK over real TCP; only browser-mode native bridge is simulated.
import assert from 'node:assert/strict';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs,sourceHashes,launch,delay,sha256,run} from '../../resource/game-kit/qa/common.mjs';
import {gameplay} from './cases.mjs';
const args=parseArgs(),root=fileURLToPath(new URL('../../',import.meta.url)),here=path.dirname(fileURLToPath(import.meta.url));
assert.ok(args.slug&&args.output&&['android','browser'].includes(args.mode),'--slug --output --mode android|browser');
const inventory=JSON.parse(await readFile(path.join(here,'baseline-inventory.json'),'utf8'));
const entry=inventory.games.find(g=>g.slug===args.slug);assert.ok(entry,'Game must be in root README');
const kit=entry.engine==='game-kit',output=path.resolve(args.output);await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Keep previous evidence; use empty output');
const official=path.join(root,'puretv-joystick'),production=path.join(root,'resource/game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerServer.java');
const inputs=[fileURLToPath(import.meta.url),path.join(here,'cases.mjs'),path.join(here,'WifiWireHarness.java'),production,...['bridge.py','joystick_sdk.py','virtual.html'].map(n=>path.join(official,n))];
const hashes={};for(const p of inputs){hashes[path.relative(root,p)]=sha256(await readFile(p));await copyFile(p,path.join(output,'executed-'+path.basename(p)));}
const report={slug:args.slug,mode:args.mode,startedAt:new Date().toISOString(),status:'running',sourceHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,androidAppTested:args.mode==='android',syntheticNativeBridge:args.mode==='browser',modelWrites:false,clockOverrides:false,tests:[],observations:[],wire:[],screenshots:[],limitations:args.mode==='browser'?['Desktop JVM and Chromium; Android lifecycle/NSD not exercised.']:['Android TV emulator, not physical TV or ESP32; NSD registration is observed via host diagnostics, not ESP32 discovery.']};
let java,bridge,proxy,gameBrowser,padBrowser,gameContext,padContext,game,pad,ports={},javaOutput='',javaError='',bridgeOutput='',bridgeError='';let connection=0;const sockets=new Set(),held=new Set();
const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
const keyCodes={UP:'ArrowUp',DOWN:'ArrowDown',LEFT:'ArrowLeft',RIGHT:'ArrowRight',START:'Enter',A:'a',B:'b',X:'x',Y:'y'};
async function waitFor(fn,label,timeout=15000){const end=performance.now()+timeout;let last;do{last=await fn();if(last)return last;await delay(60);}while(performance.now()<end);throw Error(label+' timed out');}
async function read(){
 if(args.mode==='android'){const r=await fetch(args.diagnostics+'/snapshot');assert.equal(r.status,200);const value=await r.json();assert.ok(value.game,'Actual target WebView QA snapshot must exist');return {...value.game,document:value.page,nativeInfo:value.info,activityState:value.activityState};}
 return game.evaluate(()=>({...window.PureTVQA.snapshot(),document:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},nativeInfo:window.__qaNative.getInfoObject(),receiver:window.__qaNative.last}));
}
async function until(predicate,label,timeout=15000){return waitFor(async()=>{const s=await read();return predicate(s)?s:null;},label,timeout);}
const trace=(label,before,after)=>report.observations.push({label,before,after});
async function test(name,fn){const t={name,status:'running'};report.tests.push(t);try{t.result=await fn();t.status='passed';}catch(e){t.status='failed';t.error=e.stack;throw e;}finally{console.log(args.slug+' '+name+': '+t.status);}}
async function down(key){await pad.keyboard.down(keyCodes[key]);held.add(key);}
async function up(key){await pad.keyboard.up(keyCodes[key]);held.delete(key);}
async function tap(key){await down(key);await until(s=>(s.receiver?.players||controllers(s)).some(p=>p.connected&&p.buttons?.[key]),'actual frame reads '+key,12000);await up(key);await until(s=>(s.receiver?.players||controllers(s)).some(p=>p.connected&&p.buttons?.[key]===false),'actual release '+key,12000);await delay(80);}
async function hold(key,ms,inspect){await down(key);await delay(ms);if(inspect)await inspect();await up(key);await delay(90);}
async function release(){for(const key of [...held])await up(key);}
function modelFrozen(s){return {model:s.model,players:s.players};}
async function screenshot(name){const filename=name+'.png';if(args.mode==='android'){assert.ok(args.adb&&args.serial);const child=spawn(args.adb,['-s',args.serial,'exec-out','screencap','-p']);const chunks=[];child.stdout.on('data',x=>chunks.push(x));const [code]=await once(child,'exit');assert.equal(code,0);await writeFile(path.join(output,filename),Buffer.concat(chunks));}else await game.screenshot({path:path.join(output,filename)});report.screenshots.push(filename);}
function controllers(s){return Array.isArray(s.controllers)?s.controllers:s.controllers?.players||s.connection?.players||[];}
try {
 if(args.mode==='browser'){
  assert.ok(args.assets&&args.jdk&&args['json-jar']);const assets=path.resolve(args.assets);report.assetHashes=await sourceHashes(assets);
  assert.equal(sha256(await readFile(args['json-jar'])),'3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed');
  await mkdir(path.join(output,'classes'));await run(path.join(args.jdk,'bin/javac'),['--release','17','-cp',args['json-jar'],'-d',path.join(output,'classes'),production,path.join(here,'WifiWireHarness.java')]);
  java=spawn(path.join(args.jdk,'bin/java'),['-cp',path.join(output,'classes')+path.delimiter+args['json-jar'],'WifiWireHarness',assets,kit||args.slug==='alien-shooter'?'1':'2',String(!kit)],{stdio:['pipe','pipe','pipe']});java.stdout.on('data',b=>javaOutput+=b);java.stderr.on('data',b=>javaError+=b);
  await waitFor(()=>{if(java.exitCode!==null)throw Error(javaError);return javaOutput.includes('\n');},'receiver startup');ports=JSON.parse(javaOutput.split('\n')[0]);
  gameBrowser=await launch();gameContext=await gameBrowser.newContext({viewport:{width:960,height:540},locale:'zh-CN',recordVideo:{dir:path.join(output,'video'),size:{width:960,height:540}}});
  await gameContext.addInitScript(({tcpPort})=>{
   const info={language:'zh',url:'http://127.0.0.1:1/',qr:'',addresses:['127.0.0.1'],wifiController:{state:'available',serviceName:'Desktop QA receiver; no Android NSD',port:tcpPort,serviceType:'_puretv._tcp',version:'1',addresses:['127.0.0.1'],inputActive:true}};
   const bridge={getInfo:()=>JSON.stringify(info),snapshot(){const r=new XMLHttpRequest();r.open('GET','/__wifi/snapshot',false);r.send();if(r.status!==200)throw Error('Receiver snapshot');window.__qaNative.last=JSON.parse(r.responseText);return r.responseText;},publish(){},exit(){},setLanguage(){}};
   window.__qaNative={getInfoObject:()=>JSON.parse(JSON.stringify(info)),last:null};
   for(const n of ['PureGameHost','MarioHost','BombJackHost','AdventureHost','TetrisHost','JewelHost','JackalHost','TankHost','CozyIslandHost','CoastKartHost','AlienShooterHost','UsedCarHost'])window[n]=bridge;
  },{tcpPort:ports.tcpPort});
  game=await gameContext.newPage();report.pageErrors=[];game.on('pageerror',e=>report.pageErrors.push(e.message));await game.goto('http://127.0.0.1:'+ports.httpPort+'/',{waitUntil:'load'});await game.waitForFunction(()=>window.PureTVQA?.snapshot);
 } else {assert.ok(args.diagnostics&&args['tcp-port']);ports.tcpPort=Number(args['tcp-port']);await until(s=>s.phase&&s.phase!=='loading','actual Android game ready',60000);}
 report.ports=ports;
 proxy=net.createServer(client=>{const id=++connection,upstream=net.createConnection({host:'127.0.0.1',port:ports.tcpPort});for(const [sock,direction]of[[client,'sdk-to-game'],[upstream,'game-to-sdk']]){sockets.add(sock);let buffer='';sock.on('data',data=>{buffer+=data;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);report.wire.push({connection:id,direction,at:new Date().toISOString(),message:JSON.parse(line)});}});sock.on('close',()=>sockets.delete(sock));sock.on('error',e=>report.wire.push({connection:id,direction,error:e.message}));}client.pipe(upstream);upstream.pipe(client);client.on('close',()=>upstream.destroy());upstream.on('close',()=>client.destroy());});await new Promise(r=>proxy.listen(0,'127.0.0.1',r));ports.observerPort=proxy.address().port;
 bridge=spawn('python3',[path.join(official,'bridge.py'),'127.0.0.1','--port',String(ports.observerPort),'--web-port','0'],{cwd:official,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});bridge.stdout.on('data',b=>bridgeOutput+=b);bridge.stderr.on('data',b=>bridgeError+=b);
 await waitFor(()=>{if(bridge.exitCode!==null)throw Error(bridgeError);return bridgeOutput.includes('\n');},'official bridge');const padUrl=bridgeOutput.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];assert.ok(padUrl);
 padBrowser=await launch();padContext=await padBrowser.newContext({viewport:{width:760,height:640}});pad=await padContext.newPage();const response=await pad.goto(padUrl);assert.equal(sha256(await response.body()),hashes['puretv-joystick/virtual.html']);
 await test('menu layout and service address',async()=>{
  for(const size of args.mode==='browser'?[[960,540],[1280,720]]:[null]){
   if(size){await game.setViewportSize({width:size[0],height:size[1]});await delay(180);}
   const s=await read();assert.ok(s.document.scrollWidth<=s.document.width+1,'No horizontal overflow');assert.ok(s.document.scrollHeight<=s.document.height+1,'No vertical overflow');assert.equal(s.nativeInfo.wifiController.port,args.mode==='android'?63485:ports.tcpPort);await screenshot('menu-'+(size?size[0]:'android'));trace('menu',null,s);
  }
 });
 await test('official hello and nine sync messages leave menu unchanged',async()=>{
  const before=await read();await pad.locator('#connect').click();await pad.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('TCP 已连接'));await waitFor(()=>report.wire.filter(x=>x.direction==='sdk-to-game').length>=10,'initial SDK sync');await delay(250);
  const msgs=report.wire.filter(x=>x.direction==='sdk-to-game').map(x=>x.message);assert.equal(msgs[0].type,'hello');assert.deepEqual(msgs.slice(1,10).map(x=>[x.key,x.action,x.pressed]),keys.map(k=>[k,'sync',false]));assert.equal((await read()).phase,before.phase);return {keys:9};
 });
 await test('START begins actual game',async()=>{
  await tap('START');let s=await read();if(args.slug==='tank'){await tap('START');}
  s=await until(s=>['playing','race','countdown'].includes(s.phase)&&!s.paused,'playing phase',45000);if(s.phase==='countdown')s=await until(s=>s.phase!=='countdown','countdown ends',45000);trace('started',null,s);
 });
 await test('direction and game-specific action affect actual model',async()=>{await gameplay(args.slug,{read,tap,hold,until,record:trace});await screenshot('gameplay');});
 await test('START pause freezes game, fresh START resumes',async()=>{
  await release();await tap('START');await until(s=>s.paused||s.phase==='paused','manual pause');await delay(180);const before=await read();await delay(300);const after=await read();assert.deepEqual(modelFrozen(after),modelFrozen(before),'Paused actual model frozen');await screenshot('paused');await tap('START');await until(s=>!s.paused&&s.phase!=='paused','manual resume');trace('pause-freeze',before,after);
 });
 await test('disconnect clears held input, reconnect sync requires fresh START',async()=>{
  await down('RIGHT');await down('A');await delay(120);await pad.locator('#disconnect').click();held.clear();await until(s=>s.paused||s.phase==='paused','disconnect pauses');await delay(180);const before=await read();await delay(250);assert.deepEqual(modelFrozen(await read()),modelFrozen(before));await pad.keyboard.up('ArrowRight');await pad.keyboard.up('a');await pad.locator('#connect').click();await pad.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('TCP 已连接'));await delay(300);const after=await read();assert.ok(after.paused||after.phase==='paused','sync does not resume');assert.deepEqual(modelFrozen(after),modelFrozen(before),'sync does not award gameplay');await tap('START');await until(s=>!s.paused&&s.phase!=='paused','fresh reconnect START');await screenshot('reconnected');trace('reconnect',before,after);
 });
 await test('same-sequence ACK for every original SDK message',async()=>{await release();await delay(180);const sent=report.wire.filter(x=>x.direction==='sdk-to-game'),acks=report.wire.filter(x=>x.direction==='game-to-sdk');for(const m of sent)assert.ok(acks.some(a=>a.connection===m.connection&&a.message.type==='ack'&&a.message.seq===m.message.seq),'ACK '+m.message.seq);return {messages:sent.length,acks:acks.length,connections:connection};});
 assert.deepEqual(report.pageErrors||[],[]);for(const p of inputs)assert.equal(sha256(await readFile(p)),hashes[path.relative(root,p)],'Source changed during execution');if(args.mode==='browser')assert.deepEqual(await sourceHashes(args.assets),report.assetHashes);
 report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;report.lastSnapshot=await read().catch(()=>null);await screenshot('failure').catch(()=>{});}
finally{await release().catch(()=>{});for(const s of sockets)s.destroy();if(proxy)proxy.close();if(bridge)bridge.kill('SIGTERM');if(java){java.stdin.end();await Promise.race([once(java,'exit'),delay(1500)]);if(java.exitCode===null)java.kill('SIGTERM');}if(gameContext)await gameContext.close();if(gameBrowser)await gameBrowser.close();if(padContext)await padContext.close();if(padBrowser)await padBrowser.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'java-stderr.txt'),javaError);await writeFile(path.join(output,'bridge-stderr.txt'),bridgeError);await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Report '+output+'/report.json');}
