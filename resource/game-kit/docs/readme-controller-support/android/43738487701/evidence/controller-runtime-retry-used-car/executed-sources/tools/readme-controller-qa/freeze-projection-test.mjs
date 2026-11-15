#!/usr/bin/env node
// Regression for the QA assertion projection, using a preserved Android failure.
// Controlled edits affect cloned diagnostic data only; no game/clock is executed or mutated.
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const [failureFile,beforeRun,output]=process.argv.slice(2);assert.ok(failureFile&&beforeRun&&output,'freeze-projection-test.mjs ORIGINAL_REPORT BEFORE_RUN EMPTY_OUTPUT');
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const afterRun=path.join(here,'run.mjs'),sha=b=>createHash('sha256').update(b).digest('hex'),sources={};
for(const [label,p]of[['failure',failureFile],['before',beforeRun],['after',afterRun],['test',fileURLToPath(import.meta.url)]]){const b=await readFile(p);sources[label]={file:p,sha256:sha(b)};await copyFile(p,path.join(output,label+'-'+path.basename(p)));}
async function projection(file,slug){const s=await readFile(file,'utf8'),start=s.indexOf('function modelFrozen('),end=s.indexOf('\nasync function screenshot',start);assert.ok(start>=0&&end>start);return new Function('args','return '+s.slice(start,end))({slug});}
const original=JSON.parse(await readFile(failureFile,'utf8'));assert.equal(original.slug,'cozy-island');assert.match(original.error,/sync does not award gameplay/);
assert.match(original.error,/\+\s+cancelSeq: 4/);assert.match(original.error,/-\s+cancelSeq: 3/);assert.match(original.error,/-\s+cancelSeq: 2/);
const actual=structuredClone(original.lastSnapshot),before=structuredClone(actual);
// The original driver persisted the post-failure snapshot and Node's diff,
// not the whole pre-comparison object. Reconstruct ONLY the expected transport
// values printed in that real diff, and state this evidence limit explicitly.
for(const rows of [before.model.players,before.players]){assert.equal(rows[0].connected,true);assert.equal(rows[0].cancelSeq,4);assert.equal(rows[1].cancelSeq,3);rows[0].connected=false;rows[0].cancelSeq=3;rows[1].cancelSeq=2;}
const old=await projection(beforeRun,'cozy-island'),fixed=await projection(afterRun,'cozy-island'),other=await projection(afterRun,'coast-kart');
const result={scope:'QA projection regression on cloned diagnostic data, not gameplay or Android execution',sources,expectedBeforeReconstructedFromPersistedAssertionDiff:true,fullOriginalBeforeObjectWasNotPersisted:true,tests:[]};
function test(name,fn){fn();result.tests.push({name,status:'passed'});}
try{
 test('old projection rejects the observed connection bookkeeping transition',()=>assert.throws(()=>assert.deepEqual(old(actual),old(before))));
 test('new Cozy projection accepts only the reported transport transition',()=>assert.deepEqual(fixed(actual),fixed(before)));
 const cases=[
  ['elapsed',s=>s.model.elapsed+=.1],['clock',s=>s.model.clock+=.1],['phase',s=>s.model.phase='playing'],
  ['outer position',s=>s.players[0].x+=.01],['model position',s=>s.model.players[0].y+=.01],
  ['outer inventory',s=>s.players[0].inventory.wood=1],['model inventory',s=>s.model.players[0].inventory.wood=1],
  ['tool',s=>s.model.players[0].tool='net'],['raised net',s=>s.players[0].netRaised=true],
  ['previous action',s=>s.model.players[0].previous.a=true],['active player',s=>s.players[0].active=false],
  ['joined player',s=>s.model.players[0].joined=false],['selected player count',s=>s.model.selectedPlayers=2],
  ['same-named field outside a player',s=>s.model.connected=true]
 ];
 for(const [name,mutate]of cases)test(name+' change still fails',()=>{const changed=structuredClone(actual);mutate(changed);assert.throws(()=>assert.deepEqual(fixed(changed),fixed(before)));});
 test('another game retains strict connection fields',()=>assert.throws(()=>assert.deepEqual(other(actual),other(before))));
 test('projection leaves the raw snapshot untouched',()=>assert.deepEqual(actual,original.lastSnapshot));
 for(const [label,p]of[['failure',failureFile],['before',beforeRun],['after',afterRun],['test',fileURLToPath(import.meta.url)]])assert.equal(sha(await readFile(p)),sources[label].sha256);
 result.status='passed';
}catch(e){result.status='failed';result.error=e.stack;process.exitCode=1;}
await writeFile(path.join(output,'report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,tests:result.tests.length}));
