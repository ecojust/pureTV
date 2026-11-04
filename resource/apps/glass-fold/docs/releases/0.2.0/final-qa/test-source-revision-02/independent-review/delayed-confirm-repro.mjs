// Synthetic delayed input observation regression. No browser or capture claim.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const repo='/workspace/pureTV', app=repo+'/resource/apps/glass-fold';
const source=app+'/tests/automation.mjs';
const module=await import(pathToFileURL(source).href+'?independent-stale-confirm');
const model=createRequire(import.meta.url)(app+'/src/main/assets/game-model.js');
const q={phase:'won',paused:false,level:3,model:{phase:'won',level:3}};
const requests=[];
for (const elapsed of [0,2.5,2.6,2.7]) requests.push({elapsed,keys:module.keys(structuredClone(q),{mode:'record',elapsed})});
assert.deepEqual(requests.map(x=>x.keys),[[],['Enter'],[],['Enter']]);
const m=model.create(1,3), snapshots=[], events=[];
const capture=()=>({phase:m.phase,paused:false,level:3,model:structuredClone(m)});
const first=module.keys(capture(),{mode:'record',elapsed:3});
assert.deepEqual(first,['ArrowLeft']);
// The previous Enter was released before a RAF used its retained pulse to start.
// A second Enter requested from a still-won snapshot arrives after that RAF.
// Runtime maps a playing confirm edge to aPressed, combined with this arrow.
model.step(m,1/60,{x:-1,aPressed:true});
assert.equal(m.foldsUsed,1);assert.equal(m.elapsed,1/60);assert.equal(m.selectedId,'x-1-low');
events.push({kind:'late-confirm-treated-as-A-with-normal-selector-input',elapsed:m.elapsed,foldsUsed:m.foldsUsed,selectedId:m.selectedId});
let requested=first,error=null;
for(let tick=1;tick<300;tick++){
 if(tick%6===0){
  try {requested=module.keys(capture(),{mode:'record',elapsed:3+tick/60});}
  catch(e){error=e.message;events.push({kind:'pilot-rejected-observed-board',elapsed:m.elapsed,foldsUsed:m.foldsUsed,selectedId:m.selectedId,error});break;}
  snapshots.push({elapsed:m.elapsed,keys:requested,foldsUsed:m.foldsUsed,selectedId:m.selectedId,mode:m.mode});
 }
 const set=new Set(requested);
 model.step(m,1/60,{x:Number(set.has('ArrowRight'))-Number(set.has('ArrowLeft')),y:Number(set.has('ArrowDown'))-Number(set.has('ArrowUp')),a:set.has('Space'),b:set.has('b')});
}
assert.equal(error,'Public planner selected an invalid fold');
const result={passed:true,kind:'synthetic-delayed-confirm-regression',scope:'Only an independently scheduled input/observation fixture. Not proof of exact browser event timing, not actual gameplay video. State advanced solely with create/step; no live state writes.',browserExecuted:false,productionChanged:false,testSourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),requests,firstNewLevelRequest:first,events,decisionSnapshots:snapshots,conclusion:'A repeated Enter emitted from stale won observations can become an unintended fold after the next game begins; the unchanged pilot then reproduces the recorded invalid-fold error.'};
await writeFile('/workspace/scratch/game-polish/glass-pilot-review/delayed-confirm-repro.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,requests,events}));
