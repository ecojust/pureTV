// Snapshot-only planner sending ordinary keys. No game model import/state mutation.
import {maskOf,legal,apply,count,search,cursorRoute} from './puzzle-tools.mjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
export const neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){
 need(s.occupied.length===15&&s.occupied.every(x=>typeof x==='boolean'),'Fifteen occupied-hole flags');
 need(count(maskOf(s.occupied))===s.pegsRemaining,'Actual peg count');
 need(s.pegsRemaining===14-s.jumpsMade+s.undosUsed&&s.history.length===14-s.pegsRemaining,'Jump/undo accounting');
 need(s.undoRemaining===3-s.undosUsed,'Undo credits never refunded');
}
export function createPilot({policy='solve'}={}){
 let id=null,lastCalls=-1,pending=null,route=[],searches=[],actions=[];
 const pilot=q=>{
  const s=q?.model;if(!s||q.paused)return [];const identity=`${s.seed}:${s.level}`;
  if(id!==identity||s.calls<lastCalls){id=identity;route=[];pending=null;searches=[];actions=[];}lastCalls=s.calls;observe(s);
  if(pending){const p=pending;let done;
   if(p.key==='Space')done=p.source===null?s.source!==null:s.jumpsMade===p.jumps+1;
   else if(p.key==='b')done=s.undosUsed===p.undos+1;
   else done=s.cursor!==p.cursor;
   if(!done){need(s.phase==='playing'&&s.calls-p.call<160,'Peg command acknowledgment timeout');return [p.key];}
   if(s.jumpsMade!==p.jumps){const j=legal(p.mask).find(j=>j.from===p.source&&j.to===p.cursor);need(j&&maskOf(s.occupied)===apply(p.mask,j),'Jump removes exactly source/middle and adds landing');need(s.source===null,'Jump clears selection');route.shift();}
   if(s.undosUsed!==p.undos){need(s.pegsRemaining===p.pegs+1&&s.undoRemaining===p.credits-1,'Undo restores one peg and spends one credit');route=[];}
   actions.push({key:p.key,call:s.calls,cursor:s.cursor,source:s.source,jumps:s.jumpsMade,undos:s.undosUsed,pegs:s.pegsRemaining});pending=null;return [];
  }
  if(q.phase!=='playing'||!neutral(s))return [];
  let key;if(!legal(maskOf(s.occupied)).length){need(policy==='dead-end'&&s.undoRemaining>0&&s.source===null,'Only deliberate dead-end policy uses recovery');key='b';}
  else{
   if(!route.length){const found=search(maskOf(s.occupied),policy==='solve'?'win':'dead-end');route=found.route;searches.push({call:s.calls,visited:found.visited,length:route.length});}
   const jump=route[0];need(jump,'Nonterminal board needs a jump');const wanted=s.source===null?jump.from:jump.to;
   key=s.cursor===wanted?'Space':cursorRoute(s.cursor,wanted)[0];
  }
  pending={key,call:s.calls,source:s.source,cursor:s.cursor,mask:maskOf(s.occupied),jumps:s.jumpsMade,undos:s.undosUsed,credits:s.undoRemaining,pegs:s.pegsRemaining};return [key];
 };
 pilot.diagnostics=()=>structuredClone({policy,searches,actions,pending});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){
 if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}
 if(meta.mode==='record'&&q.phase==='won'){
  if(q.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1)return [];
  if(menuRelease){menuRelease=false;return [];}menuRelease=true;return [q.level===q.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;menuRelease=false;return pilot(q);
}
export function assertProgress({before,after,trace},assert){
 assert.equal(after.phase,'won');assert.equal(after.model.score,100);assert.equal(after.model.pegsRemaining,1);assert.equal(after.model.jumpsMade,13);assert.equal(after.model.undosUsed,0);
 assert.ok(trace.some(t=>t.state.model.source!==null));assert.ok(after.model.jumpsMade>before.model.jumpsMade);for(const t of trace)observe(t.state.model);
}
export function assertRetry({after,initial},assert){for(const k of ['phase','cursor','source','occupied','pegsRemaining','history','undoRemaining','jumpsMade','undosUsed','score'])assert.deepEqual(after.model[k],initial.model[k]);}
