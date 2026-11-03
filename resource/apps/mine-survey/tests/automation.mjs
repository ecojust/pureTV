// Snapshot-only policy: visible clues and the declared count are the only evidence.
import assert from'node:assert/strict';import R from'./reference.cjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});const clone=x=>structuredClone(x),neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){assert.equal(s.cells.length,s.width*s.height);assert.equal(s.flagsUsed,s.flags.filter(Boolean).length);assert.ok(s.flagsUsed<=s.mineCount);assert.equal(s.revealedSafe,s.cells.filter(v=>Number.isInteger(v)&&v>=0).length);assert.ok(s.cells.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=8||s.phase==='lost'&&v===-1));}
export function createPilot({policy='solve',flagLimit=0}={}){
 assert.ok(['solve','lose'].includes(policy));let identity=null,lastCalls=-1,pending=null,issued=[],acknowledged=[],proofs=[],cacheKey=null,deduction=null;
 function reset(s){identity=s.seed+':'+s.level;lastCalls=s.calls;pending=null;issued=[];acknowledged=[];proofs=[];cacheKey=null;deduction=null;}
 function infer(s){const key=s.cells.join(',');if(key!==cacheKey){deduction=R.infer(s);cacheKey=key;}return deduction;}
 function issue(s,key,target=null,kind='cursor'){pending={key,target,kind,call:s.calls,cursor:s.cursor,reveals:s.reveals,flagChanges:s.flagChanges,oldCell:target===null?null:s.cells[target],oldFlag:target===null?false:s.flags[target]};issued.push(clone(pending));return[key];}
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return[];if(identity!==s.seed+':'+s.level||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
  if(pending){const p=pending,accepted=p.key==='Space'?s.reveals>p.reveals||s.phase==='lost':p.key==='b'?s.flagChanges===p.flagChanges+1:s.cursor!==p.cursor;if(!accepted){assert.ok(s.phase==='playing'&&s.calls-p.call<180,'Ordinary input must receive an actual response');return[p.key];}
   if(p.key==='Space'){assert.equal(p.oldCell,null);if(p.kind==='mine'){assert.equal(s.phase,'lost');assert.equal(s.exploded,p.target);}else{assert.ok(s.cells[p.target]>=0&&s.cells[p.target]!==null);assert.notEqual(s.phase,'lost');}}
   if(p.key==='b')assert.equal(s.flags[p.target],!p.oldFlag);acknowledged.push({key:p.key,target:p.target,kind:p.kind,call:s.calls,revealedSafe:s.revealedSafe,flagsUsed:s.flagsUsed,phase:s.phase});pending=null;return[];
  }
  if(q.phase!=='playing'||s.phase!=='playing'||!neutral(s))return[];
  const p=infer(s);let target,kind,key='Space';
  if(policy==='lose'&&p.mines.length){target=R.nearest(p.mines.filter(c=>!s.flags[c]),s.cursor,s.width);kind='mine';}
  else if(s.flagsUsed<flagLimit&&p.mines.some(c=>!s.flags[c])){target=R.nearest(p.mines.filter(c=>!s.flags[c]),s.cursor,s.width);kind='flag';key='b';}
  else{assert.ok(p.safe.length,'Every safe reveal requires a deduction; guessing is forbidden');target=R.nearest(p.safe,s.cursor,s.width);kind='safe';if(s.flags[target]){kind='unflag';key='b';}}
  assert.ok(Number.isInteger(target));if(s.cursor!==target){const row=Math.floor(s.cursor/s.width),col=s.cursor%s.width,tr=Math.floor(target/s.width),tc=target%s.width;return issue(s,row!==tr?(row<tr?'ArrowDown':'ArrowUp'):(col<tc?'ArrowRight':'ArrowLeft'));}
  proofs.push({target,kind,worlds:p.worlds,searchNodes:p.nodes,safe:p.safe.slice(),mines:p.mines.slice()});return issue(s,key,target,kind);
 };pilot.diagnostics=()=>clone({policy,flagLimit,issued,acknowledged,pending,proofs});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,release=false;
export function keys(q,meta={}){if(meta.mode!==lastMode){lastMode=meta.mode;pilot=createPilot({flagLimit:meta.mode==='record'?1:0});terminalAt=null;release=false;}if(meta.mode==='record'&&q.phase==='won'){if(q.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];if(release){release=false;return[];}release=true;return[q.level===q.model.level+1?'Enter':'ArrowRight'];}terminalAt=null;release=false;return pilot(q);}
export function assertProgress({before,after,trace},a){const s=after.model;observe(s);a.equal(after.phase,'won');a.equal(s.phase,'won');a.equal(s.score,100);a.equal(s.revealedSafe,s.safeTotal);a.ok(s.reveals>before.model.reveals);a.ok(trace.some(t=>t.state.model.revealedSafe>before.model.revealedSafe&&t.state.phase==='playing'),'Actual intermediate safe openings are required');a.ok(trace.every(t=>t.state.model.phase!=='lost'),'A proof-driven route cannot hit a mine');}
export function assertRetry({after,initial},a){for(const key of['width','height','mineCount','cells','flags','cursor','flagsUsed','revealedSafe','safeTotal','reveals','flagChanges','exploded','phase','reason','score'])a.deepEqual(after.model[key],initial.model[key],'Fresh retry restores '+key);}
