import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const file=process.argv[2],output=process.argv[3],source=fs.readFileSync(file,'utf8');
const helper=source.slice(source.indexOf('async function pauseForProtocol(){'),source.indexOf('\ntry {',source.indexOf('async function pauseForProtocol(){')));
const results=[];
async function check(name,states,expectedPresses,fail=false){
 let presses=0,reads=0;const traces=[];
 const context={assert,read:async()=>structuredClone(states[Math.min(reads++,states.length-1)]),tap:async key=>{assert.equal(key,'START');presses++;},trace:(...x)=>traces.push(x)};
 vm.createContext(context);const promise=vm.runInContext(helper+'\npauseForProtocol()',context);
 if(fail)await assert.rejects(promise,/did not reach paused after 3/);else {const out=await promise;assert.ok(out.paused||out.phase==='paused');}
 assert.equal(presses,expectedPresses);results.push({name,status:'passed',presses,reads,traces});
}
const playing={phase:'playing',paused:false},won={phase:'won',paused:false},lost={phase:'lost',paused:false},paused={phase:'playing',paused:true};
await check('ordinary playing pauses once',[playing,paused],1);
await check('won starts then pauses',[won,playing,playing,paused],2);
await check('lost starts then pauses',[lost,playing,playing,paused],2);
await check('win between read and START restarts then pauses',[playing,playing,playing,paused],2);
await check('result appears after first tap, third START pauses',[playing,won,won,playing,playing,paused],3);
await check('already paused uses no extra START',[paused],0);
await check('unpaused after three real presses fails',[playing],3,true);
fs.writeFileSync(output,JSON.stringify({scope:'QA helper control-flow regression with synthetic read snapshots; not game input evidence',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),executedTestSha256:crypto.createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'),results},null,2)+'\n');
console.log(results.map(x=>x.name+': '+x.status).join('\n'));
