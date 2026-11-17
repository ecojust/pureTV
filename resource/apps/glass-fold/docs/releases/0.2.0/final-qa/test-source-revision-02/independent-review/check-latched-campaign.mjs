// Synthetic observation-lag probes and ordinary model-input rehearsal, not browser evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const dir='/workspace/scratch/game-polish/glass-pilot-review', repo='/workspace/pureTV';
const file=repo+'/resource/apps/glass-fold/tests/automation.mjs';
let text=await readFile(file,'utf8');
const original=text;
text=text.replace('let recordWonAt=null,transitionRelease=false;','let recordWonAt=null,transitionRelease=false,recordMoveRequested=false,recordStartRequested=false;');
text=text.replace("transitionRelease=true;return[snapshot.level===snapshot.model.level?'Enter':'ArrowRight'];", "if(snapshot.level!==snapshot.model.level){if(recordMoveRequested)return[];recordMoveRequested=true;transitionRelease=true;return['ArrowRight'];}\n  if(recordStartRequested)return[];recordStartRequested=true;transitionRelease=true;return['Enter'];");
text=text.replace("if(snapshot?.phase==='playing'){recordWonAt=null;transitionRelease=false;}","if(snapshot?.phase==='playing'){recordWonAt=null;transitionRelease=false;recordMoveRequested=false;recordStartRequested=false;}");
assert.notEqual(text,original);await writeFile(dir+'/automation-latched.mjs',text);
const fixed=await import(pathToFileURL(dir+'/automation-latched.mjs').href+'?stale-probe');
const q={phase:'won',paused:false,level:2,model:{phase:'won',level:3}};
const trace=[];
for(const t of [0,2.5,2.6,2.7,2.8,3,3.5])trace.push({t,selected:2,keys:fixed.keys(structuredClone(q),{mode:'record',elapsed:t})});
for(const t of [3.6,3.7,3.8,4,4.5,5])trace.push({t,selected:3,keys:fixed.keys({...structuredClone(q),level:3},{mode:'record',elapsed:t})});
assert.equal(trace.filter(x=>x.keys.includes('ArrowRight')).length,1);
assert.equal(trace.filter(x=>x.keys.includes('Enter')).length,1);
assert.ok(trace.filter(x=>x.t>3.6).every(x=>x.keys.length===0));
// A separate synthetic campaign delays each requested menu action by 0.55 s.
// Production model state is advanced with create/step only. The menu shim is
// test scheduling, not a substitute for the final normal-keyboard browser run.
const automation=await import(pathToFileURL(dir+'/automation-latched.mjs').href+'?campaign');
const M=createRequire(import.meta.url)(repo+'/resource/apps/glass-fold/src/main/assets/game-model.js');
let level=0,m=M.create(1,0),phase='playing',requested=[],lastHeld=new Set(),nextDecision=0,pending=[],wins=[];
const actions=[],publicSnapshots=[];
function applyMenu(item,t){
 if(item.key==='ArrowRight'){assert.equal(phase,'won');level=(level+1)%6;}
 if(item.key==='Enter'){assert.equal(phase,'won');m=M.create(1,level);phase='playing';requested=[];lastHeld.clear();}
 actions.push({at:t,key:item.key,kind:'delayed-menu-delivery',level});
}
for(let tick=0;tick<18000;tick++){
 const t=tick/60;
 while(pending.length&&pending[0].at<=t+1e-9)applyMenu(pending.shift(),t);
 if(t+1e-9>=nextDecision){
  const q={phase,paused:false,level,model:structuredClone(m)};
  requested=automation.keys(q,{mode:'record',elapsed:t});
  const now=new Set(requested);
  if(phase==='won')for(const key of now)if(!lastHeld.has(key)&&['ArrowRight','Enter'].includes(key))pending.push({at:t+.55,key});
  lastHeld=now;nextDecision=t+.1;
 }
 if(phase==='playing'){
  const keys=new Set(requested);
  M.step(m,1/60,{x:Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),y:Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp')),a:keys.has('Space')||keys.has('Enter'),b:keys.has('b')});
  if(m.phase!=='playing'){
   phase=m.phase;assert.equal(phase,'won');wins.push({difficulty:m.difficulty,level:m.level,elapsed:t,targetMatched:m.targetMatched,foldCount:m.foldCount,undoCount:m.undoCount});
   if(wins.length===6)break;
  }
 }
}
assert.deepEqual(wins.map(x=>x.difficulty),[0,1,2,3,4,5]);
assert.equal(actions.filter(x=>x.key==='ArrowRight').length,5);assert.equal(actions.filter(x=>x.key==='Enter').length,5);
const result={passed:true,scope:'Synthetic stale snapshot test plus offline ordinary create/step campaign. No browser, state injection or physical-device proof.',browserExecuted:false,productionChanged:false,originalPilotSha256:createHash('sha256').update(original).digest('hex'),patchedPilotSha256:createHash('sha256').update(text).digest('hex'),trace,wins,menuDeliveries:actions,seconds:wins.at(-1).elapsed};
await writeFile(dir+'/latched-campaign-report.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,seconds:result.seconds,wins,menuActions:actions.length}));
