// A real insecure LAN origin, a trusted HTTPS top-level popup, and a real LAN WS.
// HTTPS content is intercepted locally; browser security is never disabled.
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import {createHash,randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const source=await readFile(new URL('../src/main/assets/secure-controller.js',import.meta.url),'utf8');
const actualAssets=Object.fromEntries(await Promise.all(['controller.html','controller.css','controller.js','steering.js','secure-controller.js'].map(async name=>[name,await readFile(new URL('../src/main/assets/'+name,import.meta.url),'utf8')])));
const secure='https://ecojust.github.io/pureTV/controller/used-car/0.1.1/';
const rooms=new Map();let serial=0,passed=0;
const privateIp=Object.values(os.networkInterfaces()).flat().find(a=>a.family==='IPv4'&&!a.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address))?.address;
assert.ok(privateIp,'The bridge test needs a real private LAN address, not potentially trustworthy localhost');
function encode(value,opcode=1){const bytes=Buffer.from(typeof value==='string'?value:JSON.stringify(value));return Buffer.concat([bytes.length<126?Buffer.from([0x80|opcode,bytes.length]):Buffer.from([0x80|opcode,126,bytes.length>>8,bytes.length&255]),bytes]);}
const parentHtml=`<!doctype html><meta charset="utf-8"><button id="launch">Secure steering</button><script>window.blockBridge=false;window.addEventListener('message',e=>{if(window.blockBridge&&e.data&&e.data.kind==='puretv-used-car-bridge-v1')e.stopImmediatePropagation();});</script><script src="secure-controller.js"></script><script>
window.events=[];window.addEventListener('usedcar-secure-status',e=>events.push(e.detail));
window.UsedCarController={suspendForRelay(){window.suspended=true;if(window.localSocket)localSocket.close();},resumeFromRelay(){window.resumed=true;},getSession(){return window.memorySession||'';},setSession(value){window.memorySession=value;}};
document.getElementById('launch').onclick=()=>window.opened=UsedCarSecureSteering.open();
</script>`;
const childHtml=`<!doctype html><meta charset="utf-8"><script src="secure-controller.js"></script><script>
window.received=[];window.errors=[];window.events=[];window.addEventListener('usedcar-secure-status',e=>events.push(e.detail));
window.connectProxy=()=>{window.proxy=UsedCarTransport.createSocket('ws://should-never-be-used.example');proxy.addEventListener('open',()=>proxy.send(JSON.stringify({type:'hello',session:'wrong_session_123456'})));proxy.addEventListener('message',e=>received.push(JSON.parse(e.data)));proxy.addEventListener('error',()=>errors.push('error'));proxy.addEventListener('close',()=>window.closedCount=(window.closedCount||0)+1);};
window.seq=0;window.steer=0;window.heartbeat=true;
window.send=()=>{if(proxy&&proxy.readyState===1)proxy.send(JSON.stringify({type:'input',seq:++seq,x:steer,y:0,a:false,b:false,start:false,select:false,cancelSeq:0}));};
setInterval(()=>{if(heartbeat)send();},100);connectProxy();
</script>`;
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=url.pathname.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(actualAssets[file]||(url.searchParams.has('actual')?actualAssets['controller.html']:parentHtml));});
let origin='';
server.on('upgrade',(request,socket)=>{
 const url=new URL(request.url,'http://local'),room=rooms.get(url.searchParams.get('room'));
 if(!room||request.headers.origin!==origin){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
 const accept=createHash('sha1').update(request.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 const peer={socket,id:++serial,buffer:Buffer.alloc(0)};room.peers.add(peer);room.connections.push(peer);
 socket.on('data',chunk=>{peer.buffer=Buffer.concat([peer.buffer,chunk]);while(peer.buffer.length>=2){let n=peer.buffer[1]&127,offset=2;const opcode=peer.buffer[0]&15;if(!(peer.buffer[1]&128)){socket.destroy();return;}if(n===126){if(peer.buffer.length<4)return;n=peer.buffer.readUInt16BE(2);offset=4;}if(n===127||n>2048){socket.destroy();return;}if(peer.buffer.length<offset+4+n)return;const mask=peer.buffer.subarray(offset,offset+4),data=Buffer.from(peer.buffer.subarray(offset+4,offset+4+n));peer.buffer=peer.buffer.subarray(offset+4+n);for(let i=0;i<n;i++)data[i]^=mask[i%4];if(opcode===8){socket.end(encode('',8));return;}if(opcode!==1)continue;const frame=JSON.parse(data.toString());room.messages.push({frame,connection:peer.id});if(frame.type==='hello'){if(frame.session!==room.session&&!(room.acceptInitial&&!frame.session&&room.messages.filter(m=>m.frame.type==='hello').length===1)){socket.write(encode({type:'error',code:'session'}));continue;}socket.write(encode({type:'welcome',player:1,session:room.session}));socket.write(encode({type:'state',phase:'race',players:[{id:1,speedKmh:42}]}));}}});
 socket.on('error',()=>{});socket.on('close',()=>room.peers.delete(peer));
});
await new Promise(resolve=>server.listen(0,'0.0.0.0',resolve));origin='http://'+privateIp+':'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-proxy-server']});
async function fixture(){
 const room={token:randomBytes(16).toString('hex'),session:randomBytes(16).toString('hex'),peers:new Set(),connections:[],messages:[]};rooms.set(room.token,room);
 const context=await browser.newContext(),requests=[];
 await context.route('https://ecojust.github.io/**',route=>{requests.push(route.request().url());return route.fulfill({status:200,contentType:route.request().url().endsWith('secure-controller.js')?'text/javascript':'text/html',body:route.request().url().endsWith('secure-controller.js')?source:childHtml});});
 const page=await context.newPage();await page.goto(origin+'/?room='+room.token);await page.evaluate(({token,session})=>{sessionStorage.setItem('used-car-racing-controller:'+token,session);const open=window.open;window.open=function(url,target){window.openedUrl=url;window.openedChild=open.call(window,url,target);return window.openedChild;};},{token:room.token,session:room.session});
 const next=context.waitForEvent('page');await page.click('#launch');const child=await next;await child.waitForFunction(()=>window.received&&received.some(m=>m.type==='welcome'));
 return {room,context,page,child,requests,close:async()=>{await context.close();for(const peer of room.peers)peer.socket.destroy();rooms.delete(room.token);}};
}
async function check(name,run){await run();console.log('PASS '+(++passed)+': '+name);}
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.ok(predicate());}
try{
 await check('HTTPS popup retains a real insecure LAN opener and forwards real WS traffic under the LAN origin',async()=>{
  const f=await fixture();assert.equal(await f.page.evaluate(()=>isSecureContext),false);assert.equal(await f.child.evaluate(()=>isSecureContext),true);assert.equal(await f.child.evaluate(()=>!!opener),true);assert.equal(await f.page.evaluate(()=>suspended),true);
  assert.equal(f.room.messages[0].frame.session,f.room.session,'The LAN session is resumed instead of taking another player seat');assert.equal(await f.child.evaluate(()=>received.find(m=>m.type==='state').players[0].speedKmh),42);
  await f.child.evaluate(()=>{steer=.65;send();});await until(()=>f.room.messages.some(m=>m.frame.x===.65));assert.equal(f.room.connections.length,1);
  assert.ok(f.requests.every(url=>!url.includes(f.room.token)),'Room token stays in a fragment, never an HTTPS request');assert.equal(await f.child.evaluate(()=>location.hash),'');await f.close();
 });
 await check('Spoofed origin, source window and channel cannot inject controller frames',async()=>{
  const f=await fixture();const count=f.room.connections.length;
  await f.child.evaluate(parentOrigin=>{opener.postMessage({kind:'puretv-used-car-bridge-v1',channel:'0'.repeat(32),op:'connect',id:900},parentOrigin);},origin);
  await f.page.evaluate(()=>{const channel=new URLSearchParams(new URL(openedUrl).hash.slice(1)).get('channel');const data={kind:'puretv-used-car-bridge-v1',channel,op:'connect',id:900};window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.example',source:openedChild,data}));window.dispatchEvent(new MessageEvent('message',{origin:'https://ecojust.github.io',source:window,data}));});
  await f.child.waitForTimeout(200);assert.equal(f.room.connections.length,count);assert.equal(await f.child.evaluate(()=>proxy.readyState),1);await f.close();
 });
 await check('A proxy reconnect preserves the player session and ignores an old proxy close',async()=>{
  const f=await fixture();await f.child.evaluate(()=>{window.oldProxy=proxy;oldProxy.close();connectProxy();});await until(()=>f.room.messages.filter(m=>m.frame.type==='hello').length===2);await f.child.waitForFunction(()=>proxy.readyState===1);await f.child.evaluate(()=>{oldProxy.close();steer=-.5;send();});await until(()=>f.room.messages.some(m=>m.frame.x===-.5));assert.ok(f.room.messages.filter(m=>m.frame.type==='hello').every(m=>m.frame.session===f.room.session));await f.close();
 });
 await check('Stale queued input is rejected and closes the bridge instead of steering after a suspended opener returns',async()=>{
  const f=await fixture();await f.child.evaluate(()=>{heartbeat=false;const original=Date.now;Date.now=()=>original()-2000;steer=.99;send();Date.now=original;});await f.child.waitForFunction(()=>proxy.readyState===3);assert.ok(!f.room.messages.some(m=>m.frame.x===.99));await f.close();
 });
 await check('Missing relay acknowledgements disconnect the active proxy and do not replay held input',async()=>{
  const f=await fixture();await f.page.evaluate(()=>window.blockBridge=true);
  await f.child.waitForFunction(()=>proxy.readyState===3,null,{timeout:5000});assert.ok(await f.child.evaluate(()=>events.some(e=>e.reason==='bridge-timeout')));await f.close();
 });
 await check('Closing the secure page closes its native socket and returns control to the LAN page',async()=>{
  const f=await fixture();await f.child.evaluate(()=>UsedCarSecureSteering.close());await f.page.waitForFunction(()=>window.resumed);await until(()=>f.room.peers.size===0);await f.close();
 });
 await check('Popup blocking leaves the existing LAN controller active with a recoverable message',async()=>{
  const room={token:randomBytes(16).toString('hex')};const context=await browser.newContext(),page=await context.newPage();await page.goto(origin+'/?room='+room.token);await page.evaluate(()=>window.open=()=>null);await page.click('#launch');assert.equal(await page.evaluate(()=>opened),false);assert.equal(await page.evaluate(()=>!!window.suspended),false);assert.ok(await page.evaluate(()=>events.some(e=>e.reason==='popup-blocked')));await context.close();
 });
 await check('An unpaired secure page cannot create a network connection and protocol frames are bounded',async()=>{
  const context=await browser.newContext();await context.route('https://ecojust.github.io/**',route=>route.fulfill({status:200,contentType:route.request().url().endsWith('.js')?'text/javascript':'text/html',body:route.request().url().endsWith('.js')?source:childHtml}));
  const page=await context.newPage();await page.goto(secure+'#parent='+encodeURIComponent(origin)+'&room='+randomBytes(16).toString('hex')+'&channel='+randomBytes(16).toString('hex'));await page.waitForFunction(()=>proxy.readyState===3);assert.equal(await page.evaluate(()=>UsedCarTransport.room),'');assert.ok(await page.evaluate(()=>events.some(e=>e.reason==='bridge-unavailable')));await context.close();
  const f=await fixture();const rejected=await f.child.evaluate(()=>['{"type":"other"}','x'.repeat(3000)].map(frame=>{try{proxy.send(frame);return false;}catch(_){return true;}}));assert.deepEqual(rejected,[true,true]);await f.close();
 });
 await check('Navigating the LAN opener away tears down the native socket and active child proxy',async()=>{
  const f=await fixture();await f.page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await f.child.waitForFunction(()=>proxy.readyState===3);await until(()=>f.room.peers.size===0);await f.close();
 });
 await check('Actual controller transfers the same player to HTTPS, applies CDP gyro plus pedal input, and returns neutral with storage blocked',async()=>{
  const room={token:randomBytes(16).toString('hex'),session:randomBytes(16).toString('hex'),acceptInitial:true,peers:new Set(),connections:[],messages:[]};rooms.set(room.token,room);
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,locale:'zh-CN'}),errors=[];
  await context.addInitScript(()=>{
    Storage.prototype.getItem=function(){throw new Error('Storage intentionally blocked');};Storage.prototype.setItem=function(){throw new Error('Storage intentionally blocked');};
    if(window.DeviceOrientationEvent)window.DeviceOrientationEvent.requestPermission=()=>Promise.resolve('granted');
    Object.defineProperty(screen.orientation,'angle',{configurable:true,get:()=>90});
  });
  await context.route('https://ecojust.github.io/**',route=>{const name=new URL(route.request().url()).pathname.split('/').pop()||'controller.html';return route.fulfill({status:200,contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:actualAssets[name]||actualAssets['controller.html']});});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/?actual=1&room='+room.token);await page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
  assert.equal(await page.evaluate(()=>UsedCarController.getSession()),room.session);
  const opened=context.waitForEvent('page');await page.locator('#steering-gyro').click();const child=await opened;child.on('pageerror',e=>errors.push(e.message));await child.waitForFunction(()=>document.getElementById('controller')&&document.getElementById('controller').dataset.connected==='true');
  assert.equal(await child.evaluate(()=>isSecureContext),true);await child.locator('#steering-gyro').click();await child.waitForFunction(()=>document.getElementById('controller').dataset.steering==='gyro');
  const cdp=await context.newCDPSession(child);
  for(let i=0;i<3;i++){await cdp.send('DeviceOrientation.setDeviceOrientationOverride',{alpha:0,beta:0,gamma:45+i*.01});await child.waitForTimeout(35);}
  await child.waitForFunction(()=>document.getElementById('controller').dataset.gyroStatus==='ready');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:720,y:90,radiusX:6,radiusY:6,force:1}]});
  for(let i=0;i<10;i++){await cdp.send('DeviceOrientation.setDeviceOrientationOverride',{alpha:0,beta:-30-i*.01,gamma:45});await child.waitForTimeout(35);}
  await until(()=>room.messages.some(m=>m.frame.type==='input'&&m.frame.a&&m.frame.x>.7));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await child.locator('#steering-local').click();await page.bringToFront();await page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
  await until(()=>room.messages.filter(m=>m.frame.type==='hello').length>=3);
  const hellos=room.messages.filter(m=>m.frame.type==='hello');assert.equal(hellos[0].frame.session,undefined);assert.ok(hellos.slice(1).every(m=>m.frame.session===room.session),'Private-browser in-memory session remains the same across both transfers');
  const last=room.messages.filter(m=>m.frame.type==='input').at(-1).frame;assert.equal(last.x,0);assert.equal(last.a,false);assert.equal(last.b,false);assert.deepEqual(errors,[]);
  await context.close();for(const peer of room.peers)peer.socket.destroy();rooms.delete(room.token);
 });
 console.log(passed+' secure controller transport scenarios passed. Actual LAN origin '+origin+'; HTTPS content locally intercepted, no browser security overrides.');
}finally{await browser.close();for(const room of rooms.values())for(const peer of room.peers)peer.socket.destroy();await new Promise(resolve=>server.close(resolve));}
