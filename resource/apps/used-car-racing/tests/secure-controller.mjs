// Actual HTTP → trusted local HTTPS/WSS, with the bundled phone controller.
// A unique test CA is temporarily installed in Chromium's NSS user trust store
// and removed in finally. No certificate-error bypass, intercepted TLS page,
// public host, popup relay, or modification of HOME is used.
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import {join} from 'node:path';
import {createHash,randomBytes,X509Certificate} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,rm,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const assetRoot=new URL('../src/main/assets/',import.meta.url);
const actualAssets=Object.fromEntries(await Promise.all(['controller.html','controller.css','controller.js','steering.js','secure-controller.js'].map(async name=>[name,await readFile(new URL(name,assetRoot))])));
const privateIp=Object.values(os.networkInterfaces()).flat().find(a=>a.family==='IPv4'&&!a.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address))?.address;
assert.ok(privateIp,'A real private LAN address is required; localhost would hide the insecure HTTP constraint');
const taskDirectory=await mkdtemp(join(os.tmpdir(),'puretv-lan-controller-test-'));
const trustDirectory=join(os.homedir(),'.pki','nssdb');
const trustNickname='pureTV temporary controller test '+randomBytes(16).toString('hex');
const browserOptions={headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-proxy-server']};
const part=process.env.USED_CAR_TLS_PART||'all';assert.ok(['all','setup'].includes(part),'Unknown local TLS test selection');if(part==='setup')assert.ok(process.env.USED_CAR_UI_CAPTURE_DIR,'Setup-only checks require a capture output directory');
const rooms=new Map(),sockets=new Set();
let browser,plainServer,tlsServer,untrustedServer,trusted=false,passed=0,serial=0,plainOrigin='',secureOrigin='',untrustedOrigin='',certificateDer,certificateFingerprint;
function run(program,args){if((program==='java'||program==='javac')&&process.env.JAVA_HOME)program=join(process.env.JAVA_HOME,'bin',program);return execFileSync(program,args,{stdio:['ignore','pipe','pipe']});}
async function exists(path){try{await access(path);return true;}catch(_){return false;}}
async function prepareCertificateGenerator(){
 // Exercise the exact certificate templates shipped by the Android application.
 // Only fresh test keys are exported; no Android Keystore or release key is used.
 const source=join(taskDirectory,'BrowserTlsCertificates.java');
 await writeFile(source,`package com.ecojust.usedcartv;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.*;
public final class BrowserTlsCertificates {
 private static void pem(Path file,String type,byte[] bytes)throws Exception {
  String text="-----BEGIN "+type+"-----\\n"+Base64.getMimeEncoder(64,new byte[]{10}).encodeToString(bytes)+"\\n-----END "+type+"-----\\n";
  Files.write(file,text.getBytes(StandardCharsets.US_ASCII));
 }
 public static void main(String[] args)throws Exception {
  Path folder=Paths.get(args[0]);String prefix=args[1];
  KeyPairGenerator generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048);
  KeyPair caKeys=generator.generateKeyPair(),serverKeys=generator.generateKeyPair();Date now=new Date();
  X509Certificate ca=LanCertificates.createAuthority(caKeys,now);
  X509Certificate server=LanCertificates.createServer(ca,caKeys.getPrivate(),serverKeys.getPublic(),Collections.singletonList(args[2]),now);
  Files.write(folder.resolve(prefix+"-ca.der"),ca.getEncoded());
  pem(folder.resolve(prefix+"-server.pem"),"CERTIFICATE",server.getEncoded());
  Path key=folder.resolve(prefix+"-server.key");pem(key,"PRIVATE KEY",serverKeys.getPrivate().getEncoded());
  Files.setPosixFilePermissions(key,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
 }
}`);
 run('javac',['-d',taskDirectory,fileURLToPath(new URL('../src/main/java/com/ecojust/usedcartv/LanCertificates.java',import.meta.url)),source]);
}
async function createCertificate(prefix){
 run('java',['-cp',taskDirectory,'com.ecojust.usedcartv.BrowserTlsCertificates',taskDirectory,prefix,privateIp]);
 const file=name=>join(taskDirectory,prefix+'-'+name);
 return {caPath:file('ca.der'),ca:await readFile(file('ca.der')),key:await readFile(file('server.key')),cert:await readFile(file('server.pem'))};
}
function encode(value,opcode=1){const data=Buffer.from(typeof value==='string'?value:JSON.stringify(value));return Buffer.concat([data.length<126?Buffer.from([0x80|opcode,data.length]):Buffer.from([0x80|opcode,126,data.length>>8,data.length&255]),data]);}
function neutral(frame){return frame&&frame.x===0&&frame.y===0&&!frame.a&&!frame.b&&!frame.start&&!frame.select;}
function lastInput(room){return room.messages.filter(item=>item.frame.type==='input').at(-1)?.frame;}
async function until(predicate,message='Timed out waiting for local controller input') {for(let i=0;i<150;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.ok(predicate(),message);}
async function check(name,body){if(part==='setup'&&!name.startsWith('Local certificate setup'))return;await body();console.log('PASS '+(++passed)+': '+name);}
function config(room,secure){
 const requestOrigin=secure?secureOrigin:plainOrigin;
 const value={room:room.token,secureUrl:secureOrigin+'/?room='+room.token,localUrl:plainOrigin+'/?room='+room.token,certificateUrl:requestOrigin+'/ca.crt?room='+room.token,profileUrl:requestOrigin+'/ca.mobileconfig?room='+room.token,certificateSha256:certificateFingerprint,certificateName:'pureTV Test Living Room'};
 return room.changeConfig?room.changeConfig(value):value;
}
function serve(secure){return async(request,response)=>{
 const origin=secure?secureOrigin:plainOrigin,url=new URL(request.url,origin),room=rooms.get(url.searchParams.get('room'));
 const file=url.pathname==='/'?'controller.html':url.pathname.slice(1);
 response.setHeader('Cache-Control','no-store');response.setHeader('Referrer-Policy','no-referrer');response.setHeader('X-Content-Type-Options','nosniff');
 response.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self' "+(secure?'wss://':'ws://')+new URL(origin).host+"; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 response.setHeader('Permissions-Policy','accelerometer=(self), gyroscope=(self), magnetometer=(self)');
 if(url.pathname==='/connection.json'){
  if(!room){response.writeHead(403).end();return;}
  room.configRequests++;response.setHeader('Content-Type','application/json');response.end(JSON.stringify(config(room,secure)));return;
 }
 if(url.pathname==='/ca.crt'||url.pathname==='/ca.mobileconfig'){
  if(!room){response.writeHead(403).end();return;}
  room.downloads.push(url.pathname);
  response.setHeader('Content-Disposition','attachment; filename="'+(url.pathname==='/ca.crt'?'puretv-lan-ca.crt':'puretv-lan-ca.mobileconfig')+'"');
  if(url.pathname==='/ca.crt'){response.setHeader('Content-Type','application/x-x509-ca-cert');response.end(certificateDer);}
  else {response.setHeader('Content-Type','application/x-apple-aspen-config');response.end('<plist><dict><key>PayloadType</key><string>com.apple.security.root</string><key>PayloadContent</key><data>'+certificateDer.toString('base64')+'</data></dict></plist>');}
  return;
 }
 if(!actualAssets[file]||(file==='controller.html'&&!room)){response.writeHead(404).end();return;}
 room?.requests.push({secure,url:request.url});response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');response.end(actualAssets[file]);
};}
function upgrades(server,secure){server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});});server.on('upgrade',(request,socket)=>{
 const origin=secure?secureOrigin:plainOrigin,url=new URL(request.url,origin),room=rooms.get(url.searchParams.get('room'));
 if(url.pathname!=='/ws'||!room||request.headers.origin!==origin){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
 const accept=createHash('sha1').update(request.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 const peer={socket,id:++serial,secure,welcomed:false,buffer:Buffer.alloc(0)};room.peers.add(peer);room.connections.push(peer);
 socket.on('data',chunk=>{peer.buffer=Buffer.concat([peer.buffer,chunk]);while(peer.buffer.length>=2){
  let length=peer.buffer[1]&127,offset=2;const opcode=peer.buffer[0]&15;
  if(!(peer.buffer[1]&128)){socket.destroy();return;}
  if(length===126){if(peer.buffer.length<4)return;length=peer.buffer.readUInt16BE(2);offset=4;}
  if(length===127||length>2048){socket.destroy();return;}if(peer.buffer.length<offset+4+length)return;
  const mask=peer.buffer.subarray(offset,offset+4),data=Buffer.from(peer.buffer.subarray(offset+4,offset+4+length));peer.buffer=peer.buffer.subarray(offset+4+length);for(let i=0;i<length;i++)data[i]^=mask[i%4];
  if(opcode===8){socket.end(encode('',8));return;}if(opcode===9){socket.write(encode(data.toString(),10));continue;}if(opcode!==1)continue;
  let frame;try{frame=JSON.parse(data.toString());}catch(_){socket.destroy();return;}room.messages.push({frame,connection:peer.id,secure});
  if(frame.type==='hello'){
   const first=room.messages.filter(item=>item.frame.type==='hello').length===1;
   if(frame.session!==room.session&&!(first&&!frame.session)){socket.write(encode({type:'error',code:'room_full'}));continue;}
   peer.welcomed=true;socket.write(encode({type:'welcome',player:1,session:room.session}));socket.write(encode({type:'state',phase:'race',trackName:'本地测试赛道',trackNameEn:'Local test circuit',players:[{id:1,speedKmh:42,gear:'D',lap:1,rank:1,brakeForce:0}]}));
  }
 }});
 socket.on('close',()=>room.peers.delete(peer));socket.on('error',()=>{});
});}
async function fixture({locale='zh-CN',storageBlocked=false,changeConfig=null,secure=false}={}){
 const room={token:randomBytes(16).toString('hex'),session:randomBytes(16).toString('hex'),peers:new Set(),connections:[],messages:[],requests:[],downloads:[],configRequests:0,changeConfig};rooms.set(room.token,room);
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,locale}),requests=[],errors=[],websockets=[];
 await context.addInitScript(({storageBlocked})=>{
  window.__permissionCalls=0;
  if(window.DeviceOrientationEvent)window.DeviceOrientationEvent.requestPermission=()=>{window.__permissionCalls++;return Promise.resolve('granted');};
  Object.defineProperty(screen.orientation,'angle',{configurable:true,get:()=>90});
  if(storageBlocked){Storage.prototype.getItem=function(){throw new Error('Test: storage unavailable');};Storage.prototype.setItem=function(){throw new Error('Test: storage unavailable');};}
 },{storageBlocked});
 const page=await context.newPage();page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));page.on('websocket',ws=>websockets.push(ws.url()));
 await page.goto((secure?secureOrigin:plainOrigin)+'/?room='+room.token);await page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
 return {room,context,page,requests,errors,websockets,close:async()=>{await context.close();for(const peer of room.peers)peer.socket.destroy();rooms.delete(room.token);}};
}
async function setup(f){await f.page.locator('#steering-gyro').click();await f.page.locator('#tls-setup').waitFor({state:'visible'});await f.page.waitForFunction(()=>!document.getElementById('tls-continue').disabled);}
async function continueToTls(f){const nav=f.page.waitForURL(secureOrigin+'/**');await f.page.locator('#tls-continue').click();await nav;await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');}
async function touch(cdp,type,points){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:6,radiusY:6,force:1}))});}
async function gyroReady(f,cdp){await f.page.locator('#steering-gyro').click();await f.page.waitForFunction(()=>document.getElementById('controller').dataset.steering==='gyro');for(let n=0;n<3;n++){await cdp.send('DeviceOrientation.setDeviceOrientationOverride',{alpha:0,beta:0,gamma:45+n*.01});await f.page.waitForTimeout(35);}await f.page.waitForFunction(()=>document.getElementById('controller').dataset.gyroStatus==='ready');}
function onlyLocal(f){assert.ok(f.requests.every(url=>[plainOrigin,secureOrigin].includes(new URL(url).origin)),'No public network requests');assert.ok(f.websockets.every(url=>url.startsWith('ws://'+new URL(plainOrigin).host+'/')||url.startsWith('wss://'+new URL(secureOrigin).host+'/')),'Every socket connects directly to this TV fixture');assert.deepEqual(f.errors,[]);}
try{
 await prepareCertificateGenerator();
 const certificate=await createCertificate('trusted'),unrelated=await createCertificate('unrelated');certificateDer=new X509Certificate(certificate.ca).raw;certificateFingerprint=createHash('sha256').update(certificateDer).digest('hex');
 plainServer=http.createServer(serve(false));tlsServer=https.createServer({key:certificate.key,cert:certificate.cert,minVersion:'TLSv1.2'},serve(true));untrustedServer=https.createServer({key:unrelated.key,cert:unrelated.cert,minVersion:'TLSv1.2'},(_,response)=>response.end('Untrusted'));
 upgrades(plainServer,false);upgrades(tlsServer,true);
 await Promise.all([plainServer,tlsServer,untrustedServer].map(server=>new Promise(resolve=>server.listen(0,'0.0.0.0',resolve))));
 plainOrigin='http://'+privateIp+':'+plainServer.address().port;secureOrigin='https://'+privateIp+':'+tlsServer.address().port;untrustedOrigin='https://'+privateIp+':'+untrustedServer.address().port;
 await check('A TV certificate is rejected before its CA is installed; no certificate bypass is enabled',async()=>{
  const untrustedBrowser=await chromium.launch(browserOptions);
  try{const page=await untrustedBrowser.newPage();await assert.rejects(page.goto(secureOrigin),/ERR_CERT_AUTHORITY_INVALID/);}finally{await untrustedBrowser.close();}
 });
 await mkdir(trustDirectory,{recursive:true});if(!await exists(join(trustDirectory,'cert9.db')))run('certutil',['-N','-d','sql:'+trustDirectory,'--empty-password']);
 run('certutil',['-A','-d','sql:'+trustDirectory,'-n',trustNickname,'-t','C,,','-i',certificate.caPath]);trusted=true;
 browser=await chromium.launch(browserOptions);
 await check('Installing only the TV test CA enables actual HTTPS and WSS; another CA remains untrusted',async()=>{
  const f=await fixture({secure:true});assert.equal(await f.page.evaluate(()=>isSecureContext),true);assert.equal(await f.page.evaluate(()=>typeof DeviceOrientationEvent),'function');assert.ok(f.room.connections.every(peer=>peer.secure));onlyLocal(f);await f.close();
  const page=await browser.newPage();try{await assert.rejects(page.goto(untrustedOrigin),/ERR_CERT_AUTHORITY_INVALID/);}finally{await page.close();}
 });
 await check('HTTP setup releases held inputs, identifies the TV certificate, downloads it, and returns to a working stick',async()=>{
  const f=await fixture();assert.equal(await f.page.evaluate(()=>isSecureContext),false);const cdp=await f.context.newCDPSession(f.page);
  await touch(cdp,'touchStart',[[1,170,230]]);await touch(cdp,'touchMove',[[1,330,230]]);await touch(cdp,'touchStart',[[1,330,230],[2,720,90]]);await until(()=>lastInput(f.room)?.x>.9&&lastInput(f.room)?.a);
  await f.page.locator('#steering-gyro').evaluate(button=>button.click());await f.page.locator('#tls-setup').waitFor({state:'visible'});await f.page.waitForFunction(()=>!document.getElementById('tls-continue').disabled);await until(()=>neutral(lastInput(f.room)));await touch(cdp,'touchEnd',[]);
  assert.equal((await f.page.locator('#tls-fingerprint').innerText()).replace(/[^0-9a-f]/gi,'').toLowerCase(),certificateFingerprint);
  assert.match(await f.page.locator('#tls-setup').innerText(),/系统|证书/);assert.match(await f.page.locator('#tls-setup').innerText(),/完整信任/);
  for(const [selector,expectedPath] of [['#tls-android','/ca.crt'],['#tls-ios','/ca.mobileconfig']]){
   const downloadEvent=f.page.waitForEvent('download');await f.page.locator(selector).click();const download=await downloadEvent;assert.equal(await download.failure(),null);const contents=await readFile(await download.path());if(expectedPath==='/ca.crt')assert.deepEqual(contents,certificateDer);else assert.ok(contents.includes(Buffer.from(certificateDer.toString('base64'))));assert.ok(f.room.downloads.includes(expectedPath));
  }
  await f.page.locator('#tls-close').click();await f.page.locator('#tls-setup').waitFor({state:'hidden'});await touch(cdp,'touchStart',[[1,170,230]]);await touch(cdp,'touchMove',[[1,330,230]]);await until(()=>lastInput(f.room)?.x>.9);await touch(cdp,'touchEnd',[]);await until(()=>neutral(lastInput(f.room)));onlyLocal(f);await f.close();
 });
 await check('Same-tab HTTPS handoff preserves the driving seat even when browser storage is blocked',async()=>{
  const f=await fixture({storageBlocked:true});assert.equal(await f.page.evaluate(()=>UsedCarController.getSession()),f.room.session);await setup(f);await continueToTls(f);
  assert.equal(f.context.pages().length,1,'No popup or background opener is needed');assert.equal(await f.page.evaluate(()=>isSecureContext),true);assert.equal(await f.page.evaluate(()=>location.hash),'');assert.equal(await f.page.evaluate(()=>UsedCarController.getSession()),f.room.session);
  const hellos=f.room.messages.filter(item=>item.frame.type==='hello');assert.equal(hellos.length,2);assert.equal(hellos[0].frame.session,undefined);assert.equal(hellos[1].frame.session,f.room.session);assert.equal(hellos[1].secure,true);assert.ok(f.room.requests.every(request=>!request.url.includes(f.room.session)),'Handoff session never enters an HTTP request');await until(()=>neutral(lastInput(f.room)));assert.equal(await f.page.evaluate(()=>__permissionCalls),0,'Motion permission still requires a user gesture');onlyLocal(f);await f.close();
 });
 await check('Trusted HTTPS uses phone gyro with pedals and switches to a usable virtual stick on the same page',async()=>{
  const f=await fixture();await setup(f);await continueToTls(f);const cdp=await f.context.newCDPSession(f.page);await gyroReady(f,cdp);assert.equal(await f.page.evaluate(()=>__permissionCalls),1);
  await touch(cdp,'touchStart',[[1,720,90]]);for(let n=0;n<10;n++){await cdp.send('DeviceOrientation.setDeviceOrientationOverride',{alpha:0,beta:-35-n*.01,gamma:45});await f.page.waitForTimeout(35);}await until(()=>lastInput(f.room)?.a&&lastInput(f.room)?.x>.7);
  const connections=f.room.connections.length;await f.page.locator('#steering-stick').evaluate(button=>button.click());await until(()=>neutral(lastInput(f.room)));await touch(cdp,'touchEnd',[]);assert.equal(await f.page.locator('#steering-stick').getAttribute('aria-pressed'),'true');
  await touch(cdp,'touchStart',[[1,150,230]]);await touch(cdp,'touchMove',[[1,330,230]]);await until(()=>lastInput(f.room)?.x>.9);await touch(cdp,'touchEnd',[]);await until(()=>neutral(lastInput(f.room)));
  await gyroReady(f,cdp);assert.equal(await f.page.locator('#steering-gyro').getAttribute('aria-pressed'),'true');assert.equal(f.room.connections.length,connections,'Switching modes keeps the existing WSS connection');assert.equal(f.context.pages().length,1);onlyLocal(f);await f.close();
 });
 await check('Setup rejects external, wrong-room, credentialed, and non-HTTPS navigation targets',async()=>{
  const mutations=[value=>({...value,secureUrl:'https://example.com/?room='+value.room}),value=>({...value,secureUrl:value.secureUrl.replace('https:','http:')}),value=>({...value,secureUrl:value.secureUrl.replace(privateIp,'127.0.0.1')}),value=>({...value,secureUrl:value.secureUrl.replace(value.room,'f'.repeat(32))}),value=>({...value,secureUrl:value.secureUrl.replace('https://','https://user:password@')}),value=>({...value,certificateUrl:'https://example.com/ca.crt?room='+value.room}),value=>({...value,certificateSha256:'not-a-fingerprint'})];
  for(const changeConfig of mutations){const f=await fixture({changeConfig});await f.page.locator('#steering-gyro').click();await f.page.locator('#tls-setup').waitFor({state:'visible'});await until(()=>f.room.configRequests>0);await f.page.waitForTimeout(150);assert.equal(await f.page.locator('#tls-continue').isDisabled(),true);assert.equal(new URL(f.page.url()).origin,plainOrigin);assert.equal(f.context.pages().length,1);await f.page.locator('#tls-cancel').click();await f.page.keyboard.down('ArrowRight');await until(()=>lastInput(f.room)?.x===1);await f.page.keyboard.up('ArrowRight');onlyLocal(f);await f.close();}
 });
 await check('HTTPS consumes only a bounded valid session handoff and removes its fragment from the address',async()=>{
  const f=await fixture({secure:true});await f.page.goto(secureOrigin+'/?room='+f.room.token+'#session=not-valid!&steering=gyro');await f.page.reload();await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');assert.equal(await f.page.evaluate(()=>location.hash),'');assert.equal(await f.page.evaluate(()=>UsedCarController.getSession()),f.room.session);const hello=f.room.messages.filter(item=>item.frame.type==='hello').at(-1);assert.equal(hello.frame.session,f.room.session,'Invalid fragment must not replace the stored, valid driving session');onlyLocal(f);await f.close();
 });
 const capture=process.env.USED_CAR_UI_CAPTURE_DIR;
 if(capture){
  await mkdir(capture,{recursive:true});
  for(const locale of ['zh-CN','en-US'])await check('Local certificate setup is readable in '+locale+' and captured from the actual page',async()=>{
   const f=await fixture({locale});await setup(f);const viewport=f.page.viewportSize();
   // Use a taller real viewport for the published guide, so certificate details,
   // both platform instructions and the final action remain in one capture.
   await f.page.setViewportSize({width:844,height:1000});
   await f.page.locator('#tls-setup').evaluate(panel=>{panel.scrollTop=0;});
   for(const id of ['tls-title','tls-fingerprint','tls-android','tls-ios','tls-trust-note','tls-next-note','tls-continue','tls-cancel']){
    assert.ok(await f.page.locator('#'+id).evaluate(element=>{const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),id+' must be entirely visible in the setup guide');
   }
   await f.page.screenshot({path:join(capture,'used-car-racing-controller-setup'+(locale==='en-US'?'.en':'')+'.png')});
   await f.page.setViewportSize(viewport);onlyLocal(f);await f.close();
  });
 }
 console.log(passed+' trusted local HTTPS controller scenarios passed. HTTP '+plainOrigin+' → HTTPS '+secureOrigin+'; certificate validation stayed enabled throughout.');
 }finally{
 try{if(browser)await browser.close();}
 finally{
  for(const socket of sockets)socket.destroy();for(const room of rooms.values())for(const peer of room.peers)peer.socket.destroy();
  const servers=[plainServer,tlsServer,untrustedServer].filter(Boolean);
  try{for(const server of servers)server.closeAllConnections();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));}
  finally{try{if(trusted)run('certutil',['-D','-d','sql:'+trustDirectory,'-n',trustNickname]);}finally{await rm(taskDirectory,{recursive:true,force:true});}}
 }
}
