// Integer-interval timing oracle. Model fixtures and observed-input solutions are
// separate from browser recordings and physical-device input validation.
// Run: node resource/apps/lantern-rhythm/tests/independent-temporal-review.mjs [--out report.json]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const modelHash=sha(await readFile(modelUrl)),model=createRequire(import.meta.url)(fileURLToPath(modelUrl));
const clone=s=>structuredClone(s),axes={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0}};
const checks=[],totals={durationBoundaries:0,onsetBoundaries:0,observedVisibilityTicks:0};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
function check(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){model.step(s,1/60,{cancelEpoch:0,...input});}
function wait(s,target,input={}){assert.ok(target>=s.tick);while(s.tick<target){assert.equal(s.phase,'playing');tick(s,input);}}
function listen(s){const memory=[];let serial=s.listenSerial;while(s.mode==='listen'){
 assert.equal(s.phase,'playing');assert.equal(s.listenSerial,serial);
 if(s.visibleCue)memory[s.visibleCue.index]={direction:s.visibleCue.direction,kind:s.visibleCue.kind};
 tick(s);
 }assert.equal(memory.filter(Boolean).length,s.phraseLength);return memory;}
function pressAt(s,note,t){wait(s,t-1);tick(s,{...axes[note.direction],a:true});}
function releaseAfter(s,note,count){for(let i=1;i<count;i++)tick(s,{...axes[note.direction],a:true});tick(s,{...axes[note.direction],a:false});}
function prepared(index=0,replays=0){
 const s=model.create(19,0);for(let i=0;i<replays;i++){tick(s,{b:true});tick(s);}
 const memory=listen(s);
 for(let i=0;i<index;i++){pressAt(s,memory[i],Math.round(s.onsets[i]*60));releaseAfter(s,memory[i],memory[i].kind==='short'?18:43);}
 return {state:s,memory,note:memory[index],onsetTick:Math.round(s.onsets[index]*60)};
}
check('inclusive disjoint duration intervals agree with rational tick arithmetic',()=>{
 const ranges={short:[],long:[]};
 for(const index of [0,1]){
  const p=prepared(index),low=index===0?14:56,high=index===0?46:88;
  assert.equal(p.note.kind,index===0?'short':'long');
  for(let duration=0;duration<=60;duration++){
   const s=clone(p.state),accepted=s.acceptedCount;
   if(duration===0){wait(s,p.onsetTick-1);tick(s,{...axes[p.note.direction],aPressed:true,a:false});}
   else{pressAt(s,p.note,p.onsetTick);releaseAfter(s,p.note,duration);}
   const legal=duration*100>=low*60&&duration*100<=high*60;
   assert.equal(s.acceptedCount-accepted,Number(legal),`${p.note.kind}, ${duration} ticks`);
   assert.equal(s.mistakes,legal?0:1);if(legal)ranges[p.note.kind].push(duration);totals.durationBoundaries++;
  }
 }
 assert.deepEqual(ranges.short,Array.from({length:19},(_,i)=>i+9));assert.deepEqual(ranges.long,Array.from({length:19},(_,i)=>i+34));
 assert.ok(ranges.short.every(t=>!ranges.long.includes(t)));
 return {shortAcceptedTicks:ranges.short,longAcceptedTicks:ranges.long,gapTicks:[28,29,30,31,32,33],zeroDurationNeverEarnsANote:true};
});
check('onset windows match inclusive rational boundaries without changing hold length',()=>{
 const p=prepared(),acceptedOffsets=[];
 for(let offset=-16;offset<=16;offset++){
  const s=clone(p.state);pressAt(s,p.note,p.onsetTick+offset);releaseAfter(s,p.note,18);
  const legal=Math.abs(offset)*100<=22*60;assert.equal(s.acceptedCount,Number(legal));assert.equal(s.mistakes,legal?0:1);
  if(legal)acceptedOffsets.push(offset);totals.onsetBoundaries++;
 }
 assert.deepEqual(acceptedOffsets,Array.from({length:27},(_,i)=>i-13));return {acceptedOffsetsTicks:acceptedOffsets};
});
check('direction is latched by the actual press and held buttons cannot farm mistakes',()=>{
 const p=prepared(),s=clone(p.state);pressAt(s,p.note,p.onsetTick);
 for(let i=1;i<18;i++)tick(s,{x:1,y:0,a:true});tick(s,{x:1,y:0,a:false});assert.equal(s.acceptedCount,1);assert.equal(s.mistakes,0);
 const wrong=clone(p.state);wait(wrong,p.onsetTick-1);tick(wrong,{x:1,y:0,a:true});
 for(let i=0;i<100;i++)tick(wrong,{x:1,y:0,a:true});assert.equal(wrong.acceptedCount,0);assert.equal(wrong.mistakes,1);
 return {latchedDirection:p.note.direction,wrongHeldPressMistakes:1};
});
check('paid replay resets only unfinished progress, costs a credit and never awards',()=>{
 const p=prepared(1),s=clone(p.state);assert.equal(s.score,100);
 const before={accepted:s.acceptedCount,serial:s.listenSerial,tick:s.tick};tick(s,{a:true,b:true,...axes[p.note.direction]});
 assert.equal(s.mode,'listen');assert.equal(s.answered,0);assert.equal(s.score,0);assert.equal(s.acceptedCount,before.accepted);
 assert.equal(s.replaysRemaining,1);assert.equal(s.replayCount,1);assert.equal(s.mistakes,0);assert.equal(s.listenSerial,before.serial+1);assert.equal(s.tick,before.tick+1);
 for(let i=0;i<30;i++)tick(s,{b:true});assert.equal(s.replayCount,1);
 const noCredit=prepared(0,2);assert.equal(noCredit.state.replaysRemaining,0);wait(noCredit.state,noCredit.onsetTick-1);
 tick(noCredit.state,{...axes[noCredit.note.direction],a:true,b:true});releaseAfter(noCredit.state,noCredit.note,18);
 assert.equal(noCredit.state.acceptedCount,1);assert.equal(noCredit.state.replayCount,2);assert.equal(noCredit.state.mistakes,0);
 const feedback=clone(p.state);wait(feedback,p.onsetTick-1);tick(feedback,{x:0,y:0,a:true});assert.equal(feedback.mode,'feedback');
 tick(feedback,{b:true});assert.equal(feedback.replaysRemaining,2);assert.equal(feedback.replayCount,0);
 return {replayHasPriorityOverSimultaneousA:true,heldBOnlyOneCredit:true,unavailableReplayDoesNotSuppressValidA:true,feedbackReplayCostsNothing:true};
});
check('cancellation retains a prefix without scoring and reanchors only once per epoch',()=>{
 const p=prepared(1),s=clone(p.state);pressAt(s,p.note,p.onsetTick);for(let i=0;i<5;i++)tick(s,{...axes[p.note.direction],a:true});
 const before={answered:s.answered,score:s.score,accepted:s.acceptedCount,remaining:s.replaysRemaining,mistakes:s.mistakes,tick:s.tick};
 model.step(s,1/120,{cancelEpoch:1,cancelled:true,a:false});assert.equal(s.tick,before.tick);assert.equal(s.cancelCount,0);
 model.step(s,1/120,{cancelEpoch:1,cancelled:true,a:false});assert.equal(s.cancelCount,1);assert.equal(s.resumeCount,1);assert.equal(s.mode,'count-in');
 assert.equal(s.activeHold,null);assert.equal(s.answered,before.answered);assert.equal(s.score,before.score);assert.equal(s.acceptedCount,before.accepted);
 assert.equal(s.replaysRemaining,before.remaining);assert.equal(s.mistakes,before.mistakes);assert.equal(s.requiresNeutral,true);assert.equal(s.visibleCue,null);
 const anchored=s.nextOnset;near(anchored,s.elapsed+1.8);for(let i=s.answered;i<s.phraseLength;i++)near(s.onsets[i],anchored+(i-s.answered)*1.5);
 model.step(s,.1,{cancelEpoch:1,cancelled:true,a:false});assert.equal(s.cancelCount,1);assert.equal(s.resumeCount,1);assert.equal(s.requiresNeutral,true);assert.equal(s.nextOnset,anchored);
 tick(s,{cancelEpoch:1,a:false});assert.equal(s.requiresNeutral,false);assert.equal(s.score,before.score);assert.equal(s.acceptedCount,before.accepted);
 return {subTickCancellationRetained:true,multipleSubstepsNeverTreatSyntheticNeutralAsRelease:true,preservedAnswered:before.answered,reanchorSeconds:1.8};
});
check('listening cancellation preserves the playback clock and finite time wins priority',()=>{
 const s=model.create(19,0);tick(s);const starts=s.listenStartedAt,ends=s.listenEndsAt,serial=s.listenSerial;
 tick(s,{cancelEpoch:1,cancelled:true,a:true,b:true});assert.equal(s.listenStartedAt,starts);assert.equal(s.listenEndsAt,ends);assert.equal(s.listenSerial,serial);assert.equal(s.replayCount,0);
 let epoch=1;while(s.phase==='playing')tick(s,{cancelEpoch:++epoch,cancelled:true,a:true,b:true});
 assert.equal(s.tick,5400);assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.mistakes,0);assert.equal(s.replayCount,0);assert.equal(s.acceptedCount,0);
 const frozen=clone(s);model.step(s,.25,{a:true,b:true,cancelEpoch:++epoch});assert.deepEqual(s,frozen);
 return {repeatedCancellationCannotStop90SecondClock:true,timeoutTick:5400,terminalStateFrozen:true};
});
check('three complete solutions use only actually displayed cue memory',()=>{
 const results=[];
 for(let level=0;level<3;level++){
  const s=model.create(19,level);let serial=-1,memory=[],observations=0;const inputTrace=[];
  while(s.phase==='playing'){
   assert.ok(s.tick<=5400);if(s.listenSerial!==serial){serial=s.listenSerial;memory=[];}
   if(s.visibleCue){
    assert.equal(s.mode,'listen');const cue=s.visibleCue;memory[cue.index]={direction:cue.direction,kind:cue.kind};observations++;
    const ageTicks=s.tick-Math.round(cue.startedAt*60);assert.ok(ageTicks>=0&&ageTicks<63);
    assert.equal(cue.active,ageTicks*100<(cue.kind==='short'?30:72)*60);
   }else if(s.mode!=='listen')assert.equal(s.visibleCue,null);
   if(s.mode==='listen'){
    const t=s.tick-Math.round(s.listenStartedAt*60),index=Math.floor(t/90),offset=t-index*90;
    assert.equal(s.visibleCue!==null,t>=0&&index<s.phraseLength&&offset<63);totals.observedVisibilityTicks++;
   }
   if(s.mode==='count-in'||s.mode==='respond')assert.ok(s.onsets.every(t=>typeof t==='number'&&Number.isFinite(t)));
   const input={};
   if(!s.requiresNeutral&&(s.mode==='count-in'||s.mode==='respond')){
    const note=memory[s.answered];assert.ok(note,'No unseen answer may be synthesized');
    if(s.activeHold){assert.deepEqual(Object.keys(s.activeHold).sort(),['direction','duration','index','startedAt']);const length=note.kind==='short'?18:43;
     if(s.tick+1-Math.round(s.activeHold.startedAt*60)<length)Object.assign(input,axes[note.direction],{a:true});
    }else if(s.tick+1===Math.round(s.nextOnset*60))Object.assign(input,axes[note.direction],{a:true});
   }
   if(input.a)inputTrace.push({tick:s.tick+1,...input});tick(s,input);
   near(s.elapsed,s.tick/60);near(s.remaining,Math.max(0,90-s.elapsed));
  }
  assert.equal(s.phase,'won');assert.equal(s.litCount,3);assert.ok(s.beacons.every(b=>b.lit));assert.equal(s.mistakes,0);assert.equal(s.replayCount,0);
  assert.equal(s.correctNotes,s.phraseLength*3);assert.equal(s.acceptedCount,s.correctNotes);
  assert.equal(s.score,3000+Math.floor(s.remaining)*10+200+200);
  results.push({level:level+1,phase:s.phase,litCount:s.litCount,correctNotes:s.correctNotes,acceptedCount:s.acceptedCount,modelElapsedSeconds:s.elapsed,
   mistakes:s.mistakes,replaysRemaining:s.replaysRemaining,observedCueFrames:observations,inputTraceSha256:sha(JSON.stringify(inputTrace))});
 }
 return {observedInputSolutions:results,expectedPatternReads:false,source:'Actual visibleCue history only; direction/kind is never obtained from private patterns.'};
});
assert.equal(sha(await readFile(modelUrl)),modelHash,'Model changed during independent review');
const report={kind:'independent-integer-temporal-review',passed:true,modelSha256:modelHash,reviewScriptSha256:sha(await readFile(fileURLToPath(import.meta.url))),checks,totals,
 methodology:'Use integer rational comparisons for onset and duration boundaries, cloned normally reached states for isolated inputs, cancellation/replay counter arithmetic, and a separate observer that remembers only displayed current cues.',
 scope:{constructedInputFixtures:true,normalInputModelSolutions:3,privateExpectedPatternsRead:false,normalGameplayEvidence:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['Model timing/input fixtures are separate from real runtime cancellation tests, ordinary browser play and encoded video.']};
const out=process.argv.indexOf('--out');if(out>=0){assert.ok(process.argv[out+1]);await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
