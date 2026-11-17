// Read-only observational pilot. Answers are remembered only from cues already
// displayed during listen mode; no expected pattern or private input state is read.
export const budgets={maxWebGLDrawCalls:3};
const directionKeys={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'};
export function createPilot(){
 let level,previousElapsed=-1,listenSerial,observed=[],hold=null,replaySent=false,cancelCount=0,intervals=[];const diagnostics=[];
 const observe=m=>{if(m.mode!=='listen'||!m.visibleCue)return;const c=m.visibleCue;if(!directionKeys[c.direction]||!['short','long'].includes(c.kind))throw new Error('Invalid publicly displayed cue');const prior=observed[c.index];if(prior&&(prior.direction!==c.direction||prior.kind!==c.kind))throw new Error('Displayed cue changed within the same listening pass');if(!prior){observed[c.index]={direction:c.direction,kind:c.kind};diagnostics.push({kind:'observed-cue',listenSerial:m.listenSerial,phraseIndex:m.phraseIndex,index:c.index,direction:c.direction,noteKind:c.kind,observedAt:m.elapsed})}};
 return Object.assign(function pilot(snapshot){
  const m=snapshot?.model;if(!m||snapshot.phase!=='playing'||m.phase!=='playing')return[];
  if(level!==m.level||m.elapsed+.001<previousElapsed){level=m.level;listenSerial=undefined;observed=[];hold=null;replaySent=false;cancelCount=m.cancelCount;intervals=[];diagnostics.length=0}if(previousElapsed>=0&&m.elapsed>previousElapsed){intervals.push(m.elapsed-previousElapsed);if(intervals.length>8)intervals.shift()}previousElapsed=m.elapsed;
  if(listenSerial!==m.listenSerial){listenSerial=m.listenSerial;observed=[];hold=null;replaySent=false}
  observe(m);
  if(snapshot.paused){hold=null;return[]}
  if(m.cancelCount!==cancelCount){cancelCount=m.cancelCount;hold=null;replaySent=false;diagnostics.push({kind:'observed-cancel',cancelCount,elapsed:m.elapsed})}
  if(m.requiresNeutral){hold=null;return[]}
  if(m.mode==='listen'||m.mode==='feedback'){hold=null;return[]}
  if(replaySent)return[];
  if(!['count-in','respond'].includes(m.mode))return[];
  if(hold&&hold.index!==m.answered)hold=null;
  const note=observed[m.answered];
  if(!note){
   if(m.replaysRemaining>0){replaySent=true;diagnostics.push({kind:'requested-replay-for-unobserved-cue',index:m.answered,phraseIndex:m.phraseIndex,elapsed:m.elapsed});return['b']}
   throw new Error('Current response cue was never observed and no replay remains');
  }
  const direction=directionKeys[note.direction];
  if(m.activeHold){
   if(m.activeHold.index!==m.answered)throw new Error('Public active-hold index is inconsistent');
   if(!hold)hold={index:m.answered,released:false};
   if(hold.released)return[];
   // Decide before the nominal center by half the observed polling interval.
   // This compensates only ordinary key-dispatch quantization; model timing is untouched.
   const nominal=note.kind==='short'?m.shortDuration:m.longDuration;
   const target=nominal-Math.min(.1,Math.max(0,...intervals)/2);
   if(m.activeHold.duration+1e-7>=target){hold.released=true;diagnostics.push({kind:'released-observed-hold',index:m.answered,noteKind:note.kind,actualDurationAtDecision:m.activeHold.duration,elapsed:m.elapsed});return[]}
   return[direction,'Space'];
  }
  if(hold){if(hold.released)return[];return[direction,'Space']}
  if(!Number.isFinite(m.nextOnset))return[];
  if(m.elapsed+1e-7<m.nextOnset-.035)return[];
  hold={index:m.answered,released:false};diagnostics.push({kind:'pressed-remembered-cue',index:m.answered,phraseIndex:m.phraseIndex,direction:note.direction,noteKind:note.kind,onset:m.nextOnset,elapsed:m.elapsed});return[direction,'Space'];
 },{diagnostics:()=>structuredClone(diagnostics)});
}
const defaultPilot=createPilot();export const keys=(snapshot,options)=>defaultPilot(snapshot,options);
const samples=(before,after,trace)=>[before,...(trace||[]).map(x=>x.state||x.snapshot||x),after].filter(x=>x?.model);
export function assertProgress({before,after,trace},assert){
 const list=samples(before,after,trace),m=after.model;assert.equal(after.phase,'won','observed cues must be reproduced with ordinary held input');assert.equal(m.phase,'won');assert.equal(m.level,before.model.level);assert.equal(m.litCount,m.phraseCount);assert.equal(m.litCount,3);assert.ok(m.beacons.every(b=>b.lit));assert.equal(m.correctNotes,m.phraseLength*m.phraseCount);assert.ok(m.acceptedCount>=m.correctNotes);assert.equal(m.lostReason,null);assert.ok(m.elapsed>=25&&m.elapsed<90);assert.equal(m.activeHold,null);
 assert.ok(list.some(s=>s.model.mode==='listen'&&s.model.visibleCue?.kind==='short'));assert.ok(list.some(s=>s.model.mode==='listen'&&s.model.visibleCue?.kind==='long'));assert.ok(list.some(s=>s.model.activeHold?.duration>=s.model.longMin),'a real long hold must be observed');assert.ok(list.some(s=>s.model.activeHold&&s.model.activeHold.duration>=s.model.shortMin&&s.model.activeHold.duration<=s.model.shortMax),'a real short-range hold must be observed');
 for(const{model:x}of list){assert.equal(x.litCount,x.beacons.filter(b=>b.lit).length);assert.ok(x.mistakes>=0&&x.mistakes<=x.maxMistakes);assert.equal(x.replaysRemaining,x.maxReplays-x.replayCount);assert.ok(x.replaysRemaining>=0);assert.ok(Math.abs(x.elapsed-x.tick/60)<1e-7);assert.ok(Math.abs(x.remaining-Math.max(0,x.timeLimit-x.elapsed))<1e-7);if(x.mode!=='listen')assert.equal(x.visibleCue,null,'response UI must not expose expected answers');const prefix=x.beacons[x.phraseIndex]?.lit?0:x.answered;const base=x.litCount*1000+prefix*100;assert.equal(x.correctNotes,x.litCount*x.phraseLength+prefix);assert.equal(x.score,base+(x.phase==='won'?Math.floor(x.remaining)*10+x.replaysRemaining*100+(x.maxMistakes-x.mistakes)*50:0));}
}
export function assertRetry({before,after},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.level,before.model.level);assert.ok(m.elapsed<.5&&m.elapsed<before.model.elapsed);assert.equal(m.mode,'listen');assert.equal(m.phraseIndex,0);assert.equal(m.answered,0);assert.equal(m.litCount,0);assert.equal(m.correctNotes,0);assert.equal(m.score,0);assert.equal(m.activeHold,null);assert.equal(m.lostReason,null);assert.equal(m.replaysRemaining,m.maxReplays);for(const key of['mistakes','replayCount','acceptedCount','cancelCount','resumeCount'])assert.equal(m[key],0,key+' resets');assert.ok(m.beacons.every(b=>!b.lit));}
