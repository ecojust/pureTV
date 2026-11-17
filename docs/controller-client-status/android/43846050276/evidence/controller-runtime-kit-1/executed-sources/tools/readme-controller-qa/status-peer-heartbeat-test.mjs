#!/usr/bin/env node
// Real original-SDK traffic against the production JVM receiver, not Android/gameplay.
import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {mkdir,readdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {run,delay,sha256} from '../../resource/game-kit/qa/common.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const [outputArgument,jdk,jsonJar]=process.argv.slice(2),output=path.resolve(outputArgument);
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const sources=['tools/readme-controller-qa/status-peer-heartbeat-test.mjs','tools/readme-controller-qa/sdk-peer.py','tools/readme-controller-qa/WifiWireHarness.java','puretv-joystick/joystick_sdk.py','resource/game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerServer.java'];
const hashes={};for(const name of sources){hashes[name]=sha256(await readFile(path.join(root,name)));await copyFile(path.join(root,name),path.join(output,'executed-'+path.basename(name)));}
assert.equal(sha256(await readFile(jsonJar)),'3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed');
const report={scope:'Original SDK optional-heartbeat fixture with a real production JVM TCP receiver; no Android or game acceptance',status:'running',sourceHashes:hashes,wire:[],modelWrites:false,clockOverrides:false,physicalTvTested:false,physicalEsp32Tested:false};
let java,javaStdout='',javaStderr='',proxy,connections=0;const sockets=new Set(),peers=[];
async function waitFor(predicate,label,timeout=10000){const end=performance.now()+timeout;while(performance.now()<end){const value=await predicate();if(value)return value;await delay(50);}throw Error(label+' timed out');}
try{
 const classes=path.join(output,'classes');await mkdir(classes);
 await run(path.join(jdk,'bin/javac'),['--release','17','-cp',jsonJar,'-d',classes,path.join(root,sources[4]),path.join(root,sources[2])]);
 java=spawn(path.join(jdk,'bin/java'),['-cp',classes+path.delimiter+jsonJar,'WifiWireHarness',output,'2','true'],{stdio:['pipe','pipe','pipe']});
 java.stdout.on('data',b=>javaStdout+=b);java.stderr.on('data',b=>javaStderr+=b);await waitFor(()=>javaStdout.includes('\n'),'receiver startup');
 const ports=JSON.parse(javaStdout.split('\n')[0]);report.receiverPorts=ports;
 proxy=net.createServer(client=>{const upstream=net.createConnection({host:'127.0.0.1',port:ports.tcpPort}),connection=++connections;
  for(const [socket,direction]of[[client,'sdk-to-game'],[upstream,'game-to-sdk']]){sockets.add(socket);let buffer='';socket.on('data',b=>{buffer+=b;let i;while((i=buffer.indexOf('\n'))>=0){const value=buffer.slice(0,i);buffer=buffer.slice(i+1);report.wire.push({connection,direction,message:JSON.parse(value),at:new Date().toISOString()});}});socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});}
  client.pipe(upstream);upstream.pipe(client);
 });await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
 async function peer(heartbeat){
  const child=spawn('python3',[path.join(root,'tools/readme-controller-qa/sdk-peer.py'),String(proxy.address().port),...(heartbeat?['--heartbeat']:[])],{stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});let stdout='',stderr='',reply;
  child.stdout.on('data',b=>{stdout+=b;let i;while((i=stdout.indexOf('\n'))>=0){const value=JSON.parse(stdout.slice(0,i));stdout=stdout.slice(i+1);if(reply){reply(value);reply=null;}}});child.stderr.on('data',b=>stderr+=b);
  const object={heartbeat,child,stderr:()=>stderr,command:async value=>{const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('peer command timeout')),5000);reply=row=>{clearTimeout(timer);resolve(row);};child.stdin.write(JSON.stringify(value)+'\n');});assert.equal(result.ok,true,result.error);return result;}};
  peers.push(object);return object;
 }
 const baseline=await peer(false),active=await peer(true),first=await baseline.command({command:'connect'}),second=await active.command({command:'connect'});report.identities={default:first.identity,heartbeat:second.identity};
 const snapshot=async()=>{const response=await fetch('http://127.0.0.1:'+ports.httpPort+'/__wifi/snapshot');assert.equal(response.status,200);return response.json();};
 report.before=await waitFor(async()=>{const value=await snapshot();return value.players.filter(p=>p.connected).length===2?value:false;},'two receiver connections');
 const started=performance.now();await delay(22500);report.elapsedWaitMs=performance.now()-started;report.after=await snapshot();
 assert.ok(report.elapsedWaitMs>=22500);
 assert.ok(!report.after.players.some(p=>p.connected&&p.controllerId===first.identity),'Default command-only peer expires after native 20s idle timeout');
 assert.ok(report.after.players.some(p=>p.connected&&p.controllerId===second.identity),'Optional original-SDK heartbeats retain the connection');
 const pings=report.wire.filter(e=>e.direction==='sdk-to-game'&&e.message.type==='ping');
 assert.ok(pings.length>=20,'Real heartbeat traffic spans the idle period');assert.ok(pings.every(e=>e.message.controller_id===second.identity),'Default peer sends no automatic ping');
 await waitFor(()=>pings.every(message=>report.wire.some(ack=>ack.connection===message.connection&&ack.direction==='game-to-sdk'&&ack.message.type==='ack'&&ack.message.seq===message.message.seq)),'real heartbeat ACKs');
 await active.command({command:'disconnect'});await waitFor(async()=>!(await snapshot()).players.some(p=>p.connected),'explicit disconnect clears active seat');
 for(const item of peers){item.child.stdin.end();await once(item.child,'exit');assert.equal(item.stderr(),'');}
 for(const name of sources)assert.equal(sha256(await readFile(path.join(root,name))),hashes[name],'Fixture source changed during execution');
 report.status='passed';report.pingsAcknowledged=pings.length;
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}
finally{
 for(const item of peers)if(item.child.exitCode===null)item.child.kill('SIGTERM');
 for(const socket of sockets)socket.destroy();if(proxy)proxy.close();
 if(java){java.stdin.end();await Promise.race([once(java,'exit'),delay(1500)]);if(java.exitCode===null)java.kill('SIGTERM');}
 await writeFile(path.join(output,'java-stderr.txt'),javaStderr);await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,pingsAcknowledged:report.pingsAcknowledged,elapsedWaitMs:report.elapsedWaitMs}));
}
