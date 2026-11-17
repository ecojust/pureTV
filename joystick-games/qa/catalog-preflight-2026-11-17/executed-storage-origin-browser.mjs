import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {chromium} from '/dev/shm/joystick-qa-deps/node_modules/playwright/index.mjs';
const root='/dev/shm/puretv-joystick-games/joystick-games';
const bridge=fs.readFileSync(root+'/shared/macos/Web/bridge.js','utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={method:'Actual macOS JavaScript bridge in Chromium, synthetic native postMessage persistence and controller snapshots; normal gameplay inputs; two real HTTP origins',nativeMacTested:false,swiftStoreTested:false,gameStateWritten:false,bridgeSha256:hash(bridge),games:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,TMPDIR:'/dev/shm'}});
const servers=[];
try {
for(const slug of ['sugarplum-drop','starblazer-86','popgun-pip']){
 const keys=JSON.parse(fs.readFileSync(root+'/'+slug+'/game.json')).storageKeys;
 const store={},events=[],errors=[];
 const server=()=>http.createServer((req,res)=>{try{const name=req.url==='/'?'tv.html':req.url.slice(1);const p=root+'/'+slug+'/dist/'+name;res.setHeader('Content-Type',name.endsWith('.html')?'text/html':'text/javascript');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});
 const a=server(),b=server();servers.push(a,b);await new Promise(r=>a.listen(0,'127.0.0.1',r));await new Promise(r=>b.listen(0,'127.0.0.1',r));
 const origin=s=>'http://127.0.0.1:'+s.address().port;
 const context=await browser.newContext({viewport:{width:960,height:540}});
 async function open(server){
  const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.exposeFunction('__persist',m=>{if(m.type==='preference'&&keys.includes(m.key)){events.push({...m});if(m.value===null)delete store[m.key];else if(typeof m.value==='string'&&Buffer.byteLength(m.value)<=1048576)store[m.key]=m.value;}});
  await p.addInitScript({content:'window.webkit={messageHandlers:{joystickHost:{postMessage:m=>window.__persist(m)}}};\n'+bridge+'\nwindow.__nativeSample={revision:0,inputEnabled:true,players:[]};window.__nativeInfo='+JSON.stringify({storageKeys:keys,storageMaxBytes:1048576,preferences:{...store},wifiController:{state:'ready',port:63485,inputEnabled:true}})+';window.JoystickDesktop.receive(__nativeInfo,__nativeSample);'});
  await p.goto(origin(server)+'/tv.html');await p.waitForFunction(()=>JoystickGameQA.snapshot().frames>4);
  await p.evaluate(()=>{__nativeSample={revision:1,inputEnabled:true,players:[{id:1,connected:true,controllerId:'INDEPENDENT-REVIEW',session:'fresh',cancelSeq:0,buttons:{},buttonCounters:{}}]};JoystickDesktop.receive(__nativeInfo,__nativeSample);});
  return p;
 }
 const p=await open(a);let revision=1;
 async function press(keys,ms=120){
  await p.evaluate(({keys,revision})=>{const player=__nativeSample.players[0];for(const key of keys){player.buttons[key]=true;player.buttonCounters[key]=(player.buttonCounters[key]||0)+1;}__nativeSample.revision=revision;JoystickDesktop.receive(__nativeInfo,__nativeSample);},{keys,revision:++revision});
  await p.waitForTimeout(ms);
  await p.evaluate(({keys,revision})=>{for(const key of keys)__nativeSample.players[0].buttons[key]=false;__nativeSample.revision=revision;JoystickDesktop.receive(__nativeInfo,__nativeSample);},{keys,revision:++revision});await p.waitForTimeout(150);
 }
 await press(['START']);if(slug==='starblazer-86')await press(['B']);if(slug==='popgun-pip')await press(['START']);
 await p.waitForFunction(()=>JoystickGameQA.snapshot().stage==='playing');
 await press(slug==='popgun-pip'?['RIGHT','A','B']:['RIGHT','A'],420);
 await press(['START']);await p.waitForFunction(()=>JoystickGameQA.snapshot().stage==='paused');
 const paused=await p.evaluate(()=>JoystickGameQA.snapshot());await p.waitForTimeout(600);assert.deepEqual((await p.evaluate(()=>JoystickGameQA.snapshot())).gameplay,paused.gameplay);
 assert.ok(Object.keys(store).length>0);assert.ok(events.some(e=>e.value!==null));
 const storedBeforeClose={...store};await p.close();await new Promise(r=>setTimeout(r,150));const storedAfterClose={...store};
 const q=await open(b);const restored=await q.evaluate(()=>({origin:location.origin,initial:JoystickDesktop.initialStorage(),current:Object.fromEntries(JSON.parse(PureGameHost.getInfo()).storageKeys.map(k=>[k,localStorage.getItem(k)])),game:JoystickGameQA.snapshot()}));
 assert.notEqual(origin(a),restored.origin);assert.deepEqual(restored.initial,Object.fromEntries(keys.map(k=>[k,storedAfterClose[k]??null])));assert.deepEqual(errors,[]);
 report.games.push({game:slug,status:'passed',originalOrigin:origin(a),restoredOrigin:restored.origin,realWrites:events.length,storageKeys:keys,storedBeforeClose,storedAfterClose,restored,paused,errors,distSha256:hash(fs.readFileSync(root+'/'+slug+'/dist/tv.html'))});await context.close();console.log(slug+': passed actual game writes, deep pause freeze and new-origin bridge hydration');
}
report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;console.error(e.stack);process.exitCode=1;}
finally{await browser.close();for(const s of servers)s.close();fs.writeFileSync('/dev/shm/joystick-root-validation/storage-origin-browser.json',JSON.stringify(report,null,2)+'\n');}
