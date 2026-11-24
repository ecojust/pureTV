#!/usr/bin/env node
// Official, unchanged virtual.html -> bridge.py -> joystick_sdk.py -> real production TCP receiver.
// A byte-transparent TCP observer records protocol/ACKs. Only the Android snapshot bridge is simulated.
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
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const official=path.join(root,'puretv-joystick');
const production=path.join(root,'resource/game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerServer.java');
const harness=fileURLToPath(new URL('./WifiWireHarness.java',import.meta.url)),self=fileURLToPath(import.meta.url);
const scriptFiles=[production,harness,self,fileURLToPath(new URL('./automation.mjs',import.meta.url)),...['bridge.py','joystick_sdk.py','virtual.html','README.md'].map(n=>path.join(official,n))];
const hashes=Object.fromEntries(await Promise.all(scriptFiles.map(async f=>[f,sha256(await readFile(f))])));
assert.equal(sha256(await readFile(jsonJar)),'3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed','Pinned test-only Maven org.json 20240303');
const assetHashes=await sourceHashes(assets);
for(const file of scriptFiles)await copyFile(file,path.join(output,'executed-'+path.basename(file)));
await mkdir(path.join(output,'classes'));
await run(path.join(jdk,'bin/javac'),['--release','17','-cp',jsonJar,'-d',path.join(output,'classes'),production,harness]);
const report={startedAt:new Date().toISOString(),status:'running',method:'Unmodified official virtual.html receives real browser mouse/keyboard input, calls unmodified bridge.py and joystick_sdk.py, and sends real newline JSON over TCP to production WifiControllerServer. A byte-transparent TCP observer captures both directions. Test-only read-only HTTP snapshot adapter connects actual Java receiver to unchanged browser game. Separate Chromium processes avoid tab blur. No PureGame.key, model writes or clock overrides.',physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,androidNsdTested:false,syntheticNativeBridge:true,sourceAssetHashes:assetHashes,sourceHashes:hashes,tests:[],wire:[],uiRequests:[],uiInputs:[],snapshots:[],screenshots:[],connectionCount:0};
let java,bridge,proxy,gameBrowser,padBrowser,gameContext,padContext,gameSession,padSession,game,pad;
let javaOutput='',javaError='',bridgeOutput='',bridgeError='';
const sockets=new Set(),held=new Set();
const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
const browserKeys={UP:'ArrowUp',DOWN:'ArrowDown',LEFT:'ArrowLeft',RIGHT:'ArrowRight',START:'Enter',A:'a',B:'b',X:'x',Y:'y'};
function trace(s,label){report.snapshots.push({label,wallTime:new Date().toISOString(),phase:s.phase,paused:s.paused,tick:s.tick,connection:s.connection,model:{trackId:s.model.trackId,time:s.model.time,raceTime:s.model.raceTime,countdown:s.model.countdown,player:s.model.player,stats:s.model.stats}});}
async function until(fn,timeout=10000,label='condition'){const end=performance.now()+timeout;do{const value=await fn();if(value)return value;await delay(60);}while(performance.now()<end);throw Error(label+' timed out');}
async function observe(predicate,timeout=20000,label='state'){return until(async()=>{const s=await snapshot(game);if(predicate(s)){trace(s,label);return s;}},timeout,label);}
async function test(name,fn){const item={name,status:'running'};report.tests.push(item);try{item.details=await fn();item.status='passed';}catch(e){item.status='failed';item.error=e.stack;throw e;}finally{console.log(name+': '+item.status);}}
function session(page){const s={page,errors:[],consoleErrors:[],network:[]};page.on('pageerror',e=>s.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')s.consoleErrors.push(m.text());});page.on('requestfailed',r=>s.network.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)s.network.push({url:r.url(),status:r.status()});});return s;}
function wireMessages(connection=report.connectionCount){return report.wire.filter(e=>e.connection===connection&&e.direction==='sdk-to-game').map(e=>e.message);}
async function mouseKey(key,ms=90){const button=pad.locator('[data-key="'+key+'"]');await button.hover();await pad.mouse.down();report.uiInputs.push({kind:'mouse-down',key,at:new Date().toISOString()});await delay(ms);await pad.mouse.up();report.uiInputs.push({kind:'mouse-up',key,at:new Date().toISOString()});}
async function release(){for(const key of [...held]){await pad.keyboard.up(browserKeys[key]);report.uiInputs.push({kind:'keyboard-up',key,at:new Date().toISOString()});held.delete(key);}}
async function drive({seconds=12,variant='AB'}={}){
 const before=await snapshot(game),target=before.model.raceTime+seconds,end=performance.now()+90000;
 while(performance.now()<end){
  const s=await snapshot(game);if(s.model.raceTime>=target)break;assert.equal(s.phase,'playing');assert.equal(s.paused,false);
  const map={ArrowLeft:'LEFT',ArrowRight:'RIGHT',ArrowUp:'UP',ArrowDown:'DOWN',Space:variant==='XY'?'X':'A',b:variant==='XY'?'Y':'B'};
  const next=new Set(strategy.keys(s,{mode:'qa'}).map(k=>map[k]).filter(Boolean));
  for(const key of [...held])if(!next.has(key)){await pad.keyboard.up(browserKeys[key]);held.delete(key);report.uiInputs.push({kind:'keyboard-up',key,at:new Date().toISOString()});}
  for(const key of next)if(!held.has(key)){await pad.keyboard.down(browserKeys[key]);held.add(key);report.uiInputs.push({kind:'keyboard-down',key,at:new Date().toISOString()});}
  await delay(80);
 }
 await release();const after=await snapshot(game);trace(after,'official driving '+variant);assert.ok(after.model.raceTime>=target-.2,'Reached requested game time with ordinary virtual-controller input');return {before,after};
}
try{
 java=spawn(path.join(jdk,'bin/java'),['-cp',path.join(output,'classes')+path.delimiter+jsonJar,'WifiWireHarness',assets],{stdio:['pipe','pipe','pipe']});
 java.stdout.on('data',b=>javaOutput+=b);java.stderr.on('data',b=>javaError+=b);
 await until(()=>{if(java.exitCode!==null)throw Error('Java exited: '+javaError);return javaOutput.includes('\n');},10000,'Java startup');
 const ports=JSON.parse(javaOutput.split('\n')[0]);report.ports=ports;
 // The observer forwards the original bytes unchanged. It never sends controller messages itself.
 proxy=net.createServer(client=>{
  const connection=++report.connectionCount,upstream=net.createConnection({host:'127.0.0.1',port:ports.tcpPort});
  client.setNoDelay(true);upstream.setNoDelay(true);sockets.add(client);sockets.add(upstream);
  for(const [socket,direction] of [[client,'sdk-to-game'],[upstream,'game-to-sdk']]){
   let buffer='';socket.on('data',data=>{buffer+=data.toString('utf8');let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);let message;try{message=JSON.parse(line);}catch{message={parseError:true};}report.wire.push({connection,direction,at:new Date().toISOString(),line,message});}});
   socket.on('error',error=>report.wire.push({connection,direction,socketError:error.message,at:new Date().toISOString()}));socket.on('close',()=>sockets.delete(socket));
  }
  client.pipe(upstream);upstream.pipe(client);client.on('close',()=>upstream.destroy());upstream.on('close',()=>client.destroy());
 });
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));ports.observerPort=proxy.address().port;
 bridge=spawn('python3',[path.join(official,'bridge.py'),'127.0.0.1','--port',String(ports.observerPort),'--web-port','0'],{cwd:official,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 bridge.stdout.on('data',b=>bridgeOutput+=b);bridge.stderr.on('data',b=>bridgeError+=b);
 await until(()=>{if(bridge.exitCode!==null)throw Error('Official bridge exited: '+bridgeError);return bridgeOutput.includes('\n');},10000,'Official bridge startup');
 const padUrl=bridgeOutput.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];assert.ok(padUrl);report.officialBridgeUrl=padUrl;
 gameBrowser=await launch();padBrowser=await launch();report.browser=await gameBrowser.version();
 gameContext=await gameBrowser.newContext({viewport:{width:960,height:540},locale:'zh-CN',deviceScaleFactor:1});
 await gameContext.addInitScript(({tcpPort})=>{
  let latest=null;window.__wireBridge={lastSnapshot:()=>latest};
  window.PureGameHost={getInfo(){return JSON.stringify({url:'',qr:'',addresses:['127.0.0.1'],language:'zh',wifiController:{state:'unavailable',serviceName:'Loopback SDK test; no NSD',port:tcpPort,serviceType:'_puretv._tcp',version:'1'}});},snapshot(){const r=new XMLHttpRequest();r.open('GET','/__wifi/snapshot',false);r.send();if(r.status!==200)throw Error('Test bridge snapshot failed');latest=JSON.parse(r.responseText);return r.responseText;},publish(){},exit(){}};
 },{tcpPort:ports.tcpPort});
 game=await gameContext.newPage();gameSession=session(game);await game.goto('http://127.0.0.1:'+ports.httpPort+'/',{waitUntil:'load'});await game.waitForFunction(()=>typeof PureTVQA?.snapshot==='function');
 padContext=await padBrowser.newContext({viewport:{width:760,height:640},locale:'zh-CN',deviceScaleFactor:1});
 await padContext.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
 pad=await padContext.newPage();padSession=session(pad);
 pad.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/event'))report.uiRequests.push({at:new Date().toISOString(),event:r.postDataJSON()});});
 const response=await pad.goto(padUrl,{waitUntil:'load'});assert.equal(sha256(await response.body()),hashes[path.join(official,'virtual.html')],'Official virtual.html served unchanged');
 await test('official connect click sends hello and nine sync messages; no automatic start',async()=>{
  await pad.locator('#connect').click();await pad.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('TCP 已连接'));
  await until(()=>wireMessages().length>=10,10000,'Official initial sync');const messages=wireMessages();assert.equal(messages[0].type,'hello');assert.deepEqual(messages.slice(1,10).map(m=>[m.key,m.action,m.pressed]),keys.map(k=>[k,'sync',false]));
  await observe(s=>s.connection.controllerKind==='wifi',10000,'Official SDK connected');assert.equal((await snapshot(game)).phase,'menu');
  return {controllerId:messages[0].controller_id,initialMessages:messages.slice(0,10)};
 });
 await test('official mouse nine keys generate down, long_press, long_release and START starts actual race',async()=>{
  for(const key of [...keys.filter(k=>k!=='START'),'START']){
   const start=report.wire.length;await mouseKey(key,650);
   await until(()=>report.wire.slice(start).some(e=>e.direction==='sdk-to-game'&&e.message?.key===key&&e.message.action==='long_release'),10000,'Mouse long release '+key);
   const events=report.wire.slice(start).filter(e=>e.direction==='sdk-to-game'&&e.message?.key===key).map(e=>e.message);
   assert.deepEqual(events.map(e=>e.action),['down','long_press','long_release']);assert.deepEqual(events.map(e=>e.pressed),[true,true,false]);assert.ok(events[1].duration_ms>=450);assert.ok(events[2].duration_ms>=600);
  }
  await observe(s=>s.phase==='playing'&&!s.paused,10000,'Official START starts');
  await observe(s=>s.model.countdown<=0&&s.model.player.speed>12,25000,'Race accelerates');
  return {mouseKeys:keys,longHoldMs:650,gameFocus:await game.evaluate(()=>({focused:document.hasFocus(),hidden:document.hidden}))};
 });
 await test('official keyboard A/B drives, drifts, releases mini turbo and consumes nitro',async()=>{
  const {before,after}=await drive({variant:'AB'});assert.ok(after.model.player.progress>before.model.player.progress+30);assert.ok(after.model.stats.drifts>0);assert.ok(after.model.stats.nitros>0);assert.ok(after.model.stats.miniBoosts>0);
  await mouseKey('START');await observe(s=>s.paused,10000,'Official pause');await game.screenshot({path:path.join(output,'official-game-paused.png')});await pad.screenshot({path:path.join(output,'official-virtual-controller.png')});report.screenshots.push('official-game-paused.png','official-virtual-controller.png');
  return {stats:after.model.stats,progress:after.model.player.progress};
 });
 await test('official keyboard X/Y aliases drive after ordinary race restart; periodic SDK ping stays connected',async()=>{
  await game.keyboard.press('r');await observe(s=>s.model.countdown>0&&s.model.stats.nitros===0,10000,'Ordinary R restart');await observe(s=>s.model.countdown<=0,25000,'Retry countdown');
  const {after}=await drive({variant:'XY'});assert.ok(after.model.stats.drifts>0);assert.ok(after.model.stats.nitros>0);assert.ok(after.model.stats.miniBoosts>0);assert.ok(wireMessages().some(m=>m.type==='ping'));assert.equal(report.connectionCount,1,'Periodic ping did not disconnect original SDK connection');
  return {stats:after.model.stats,pings:wireMessages().filter(m=>m.type==='ping').length};
 });
 await test('official disconnect releases held keys and freezes game; reconnect sync waits for fresh START',async()=>{
  await pad.keyboard.down('ArrowRight');held.add('RIGHT');await pad.keyboard.down('a');held.add('A');await observe(s=>s.model.player.steer>.3,10000,'Official held steering');
  const firstConnection=report.connectionCount;await pad.locator('#connect').click();held.clear();await pad.keyboard.up('ArrowRight');await pad.keyboard.up('a');
  await pad.waitForFunction(()=>document.querySelector('#status').textContent==='TCP 已断开');const paused=await observe(s=>s.paused&&s.connection.disconnected,10000,'Official disconnect pauses');
  const stable=await snapshot(game);await delay(350);assert.deepEqual((await snapshot(game)).model,stable.model);
  for(const key of ['RIGHT','A'])assert.ok(wireMessages(firstConnection).some(m=>m.key===key&&['tap','long_release'].includes(m.action)&&m.pressed===false));
  await pad.locator('#connect').click();await observe(s=>s.connection.controllerKind==='wifi'&&!s.connection.disconnected,10000,'Official reconnect');await until(()=>wireMessages().length>=10);assert.equal(report.connectionCount,2);
  const initial=wireMessages().slice(0,10);assert.equal(initial[0].type,'hello');assert.deepEqual(initial.slice(1).map(m=>[m.key,m.action,m.pressed]),keys.map(k=>[k,'sync',false]));await delay(350);assert.equal((await snapshot(game)).paused,true);assert.deepEqual((await snapshot(game)).model,stable.model);
  await mouseKey('START');const resumed=await observe(s=>!s.paused&&s.tick>paused.tick,10000,'Fresh official START resumes');assert.equal(resumed.model.stats.nitros,paused.model.stats.nitros);assert.equal(resumed.model.stats.miniBoosts,paused.model.stats.miniBoosts);
  await observe(s=>Math.abs(s.model.player.steer)<.1,10000,'Official released steering');await mouseKey('START');await observe(s=>s.paused,10000,'Final official pause');await game.screenshot({path:path.join(output,'official-reconnected.png')});report.screenshots.push('official-reconnected.png');
  return {pausedTick:paused.tick,resumedTick:resumed.tick,connectionCount:report.connectionCount};
 });
 await test('every official SDK message receives matching production ACK; sources remain unchanged',async()=>{
  await delay(250);const sent=report.wire.filter(e=>e.direction==='sdk-to-game'&&e.message),replies=report.wire.filter(e=>e.direction==='game-to-sdk'&&e.message);assert.ok(sent.length>50);assert.equal(replies.length,sent.length);
  for(const event of sent){const ack=replies.find(r=>r.connection===event.connection&&r.message.seq===event.message.seq);assert.ok(ack,'ACK for '+event.message.seq);assert.equal(ack.message.type,'ack');}
  assert.ok(!report.wire.some(e=>e.socketError));verifyErrors(gameSession);verifyErrors(padSession);assert.deepEqual(await sourceHashes(assets),assetHashes);for(const f of scriptFiles)assert.equal(sha256(await readFile(f)),hashes[f],'Source changed during test: '+f);
  return {messages:sent.length,acks:replies.length,types:[...new Set(sent.map(e=>e.message.type))],buttons:[...new Set(sent.filter(e=>e.message.type==='button').map(e=>e.message.key))]};
 });
 report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(game){report.lastSnapshot=await snapshot(game).catch(()=>null);await game.screenshot({path:path.join(output,'failure-game.png')}).catch(()=>{});}if(pad)await pad.screenshot({path:path.join(output,'failure-virtual.png')}).catch(()=>{});report.errors={game:gameSession&&{errors:gameSession.errors,console:gameSession.consoleErrors,network:gameSession.network},pad:padSession&&{errors:padSession.errors,console:padSession.consoleErrors,network:padSession.network}};}
finally{
 if(padContext)await padContext.close();if(gameContext)await gameContext.close();if(padBrowser)await padBrowser.close();if(gameBrowser)await gameBrowser.close();
 if(bridge){bridge.kill('SIGTERM');await Promise.race([once(bridge,'exit'),delay(3000)]);}for(const socket of sockets)socket.destroy();if(proxy)await new Promise(resolve=>proxy.close(resolve));
 if(java){java.stdin.end();await Promise.race([once(java,'exit'),delay(3000)]);if(java.exitCode===null)java.kill('SIGTERM');}
 report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'java-stderr.log'),javaError);await writeFile(path.join(output,'official-bridge-stdout.log'),bridgeOutput);await writeFile(path.join(output,'official-bridge-stderr.log'),bridgeError);await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Report '+path.join(output,'report.json'));
}
