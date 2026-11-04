// Synthetic observation-lag probes and ordinary model-input rehearsal, not browser evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const dir='/workspace/scratch/game-polish/glass-pilot-review', repo='/workspace/pureTV';
const file=repo+'/resource/apps/glass-fold/tests/automation.mjs';
const recipePath=repo+'/resource/apps/glass-fold/tests/recipe.json';
const recipeSource=await readFile(recipePath,'utf8');
const recipe=JSON.parse(recipeSource);assert.equal(recipe.durationSeconds,240);
const actual=await readFile(file,'utf8');
const actualHash=createHash('sha256').update(actual).digest('hex');
const fixed=await import(pathToFileURL(file).href+'?actual-stale-probe');
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
const automation=await import(pathToFileURL(file).href+'?actual-campaign');
const M=createRequire(import.meta.url)(repo+'/resource/apps/glass-fold/src/main/assets/game-model.js');
let level=0,m=M.create(1,0),phase='playing',requested=[],lastHeld=new Set(),nextDecision=0,pending=[],wins=[];
const actions=[],menuRequests=[];
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
  if(phase==='won')for(const key of now)if(!lastHeld.has(key)&&['ArrowRight','Enter'].includes(key)){pending.push({at:t+.55,key});menuRequests.push({at:t,key,fromModelLevel:m.level,selectedLevel:level});}
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
for(const win of wins){assert.equal(win.undoCount,1);assert.equal(win.targetMatched,true);}
for(let completed=1;completed<=5;completed++)assert.deepEqual(menuRequests.filter(x=>x.fromModelLevel===completed).map(x=>x.key),['ArrowRight','Enter']);
const afterHash=createHash('sha256').update(await readFile(file,'utf8')).digest('hex');assert.equal(afterHash,actualHash,'actual tracked automation unchanged during run');
const result={passed:true,executedAt:new Date().toISOString(),automationPath:file,actualPilotSha256:actualHash,actualPilotAfterSha256:afterHash,menuDelaySeconds:.55,recipePath,recipeSha256:createHash('sha256').update(recipeSource).digest('hex'),recipeDurationSeconds:recipe.durationSeconds,scope:'Synthetic stale snapshot test plus offline ordinary create/step campaign. No browser, state injection or physical-device proof.',browserExecuted:false,productionChanged:false,trace,wins,menuRequests,menuDeliveries:actions,seconds:wins.at(-1).elapsed};
await writeFile(dir+'/actual-latched-campaign-report.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,actualPilotSha256:actualHash,seconds:result.seconds,wins,menuRequests:menuRequests.length,menuDeliveries:actions.length}));
