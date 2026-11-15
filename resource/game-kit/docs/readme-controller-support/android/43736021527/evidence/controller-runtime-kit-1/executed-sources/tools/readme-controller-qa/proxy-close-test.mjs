#!/usr/bin/env node
// Tests only the QA transport fixture with real sockets and the unchanged SDK.
// The receiver and EOF-closes-both relay are controlled fixtures, not Android/game evidence.
import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const [beforeFile,output]=process.argv.slice(2);assert.ok(beforeFile&&output,'proxy-close-test.mjs BEFORE_RUN.mjs EMPTY_OUTPUT');
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const afterFile=path.join(here,'run.mjs'),sdkFile=path.resolve(here,'../../puretv-joystick/joystick_sdk.py');
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources={};
for(const [label,p]of[['before',beforeFile],['after',afterFile],['sdk',sdkFile],['test',fileURLToPath(import.meta.url)]]){const b=await readFile(p);sources[label]={file:p,sha256:sha(b)};await copyFile(p,path.join(output,label+'-'+path.basename(p)));}
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function listen(server){await new Promise(r=>server.listen(0,'127.0.0.1',r));return server.address().port;}
async function exercise(file,dropLast){
 const source=await readFile(file,'utf8'),start=source.indexOf(' proxy=net.createServer('),end=source.indexOf('\n bridge=spawn',start);assert.ok(start>=0&&end>start);
 const tracked=new Set(),fixtureEvents=[],received=[];let proxy;
 const track=s=>{tracked.add(s);s.on('close',()=>tracked.delete(s));s.on('error',()=>{});return s;};
 const receiver=net.createServer(s=>{
  track(s);let buffer='';
  s.on('data',data=>{buffer+=data;let i;while((i=buffer.indexOf('\n'))>=0){const message=JSON.parse(buffer.slice(0,i));buffer=buffer.slice(i+1);received.push(message);
   setTimeout(()=>{if(!s.destroyed&&!(dropLast&&message.key==='A'&&message.action==='tap'))s.write(JSON.stringify({type:'ack',seq:message.seq})+'\n');},120);
  }});
 });
 const targetPort=await listen(receiver);
 const relay=net.createServer(local=>{
  track(local);const remote=track(net.createConnection({host:'127.0.0.1',port:targetPort}));
  local.pipe(remote);remote.pipe(local);
  local.on('end',()=>{fixtureEvents.push({event:'forwarded-eof-closes-entire-target',at:new Date().toISOString()});remote.destroy();local.destroy();});
  remote.on('close',()=>local.destroy());
 });
 const relayPort=await listen(relay),report={wire:[],transportErrors:[],connectionEvents:[]},sockets=new Set(),ports={tcpPort:relayPort};
 try{
  proxy=await new AsyncFunction('net','ports','report','sockets','let connection=0,proxy;'+source.slice(start,end)+';return proxy;')(net,ports,report,sockets);
  const peer=spawn('python3',[path.join(here,'sdk-peer.py'),String(ports.observerPort)],{stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  let stdout='',stderr='';peer.stdout.on('data',b=>stdout+=b);peer.stderr.on('data',b=>stderr+=b);
  const commands=[{command:'connect'},{command:'button',key:'RIGHT',action:'down'},{command:'button',key:'A',action:'down'},{command:'button',key:'RIGHT',action:'tap',duration:10},{command:'button',key:'A',action:'tap',duration:10},{command:'disconnect'}];
  peer.stdin.end(commands.map(row=>JSON.stringify(row)).join('\n')+'\n');const [code]=await once(peer,'close');assert.equal(code,0,stderr);assert.ok(stdout.trim().split('\n').map(JSON.parse).every(r=>r.ok));
  await delay(dropLast?2300:450);
  const sent=report.wire.filter(e=>e.direction==='sdk-to-game'),acks=report.wire.filter(e=>e.direction==='game-to-sdk'&&e.message.type==='ack');
  const missing=sent.filter(m=>!acks.some(a=>a.connection===m.connection&&a.message.seq===m.message.seq)).map(e=>e.message.seq);
  assert.equal(sent.length,14,'Original SDK hello, nine syncs and four button messages');
  return {receivedByFixture:received.length,sent:sent.length,acks:acks.length,missing,fixtureEvents,report,stdout,stderr};
 }finally{for(const s of sockets)s.destroy();for(const s of tracked)s.destroy();if(proxy)await new Promise(r=>proxy.close(r));await new Promise(r=>relay.close(r));await new Promise(r=>receiver.close(r));}
}
const result={scope:'QA EOF/ACK fixture only; controlled echo receiver and ADB-style EOF relay; no Android or gameplay claim',sources,cases:{}};
try{
 result.cases.before=await exercise(beforeFile,false);assert.ok(result.cases.before.missing.length>0,'Old proxy must reproduce reply truncation');
 result.cases.after=await exercise(afterFile,false);assert.deepEqual(result.cases.after.missing,[]);assert.equal(result.cases.after.acks,14);assert.ok(result.cases.after.report.connectionEvents.some(e=>e.event==='forward-fin'&&e.reason==='all-acked'&&e.pendingSeq.length===0));
 result.cases.withheldAck=await exercise(afterFile,true);assert.deepEqual(result.cases.withheldAck.missing,[14]);assert.ok(result.cases.withheldAck.report.connectionEvents.some(e=>e.event==='forward-fin'&&e.reason==='ack-timeout'&&e.pendingSeq.includes(14)));
 for(const [label,p]of[['before',beforeFile],['after',afterFile],['sdk',sdkFile],['test',fileURLToPath(import.meta.url)]])assert.equal(sha(await readFile(p)),sources[label].sha256);
 result.status='passed';
}catch(e){result.status='failed';result.error=e.stack;process.exitCode=1;}
await writeFile(path.join(output,'report.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,cases:Object.fromEntries(Object.entries(result.cases).map(([k,v])=>[k,{sent:v.sent,acks:v.acks,missing:v.missing}]))}));
