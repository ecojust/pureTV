// Public-clue test planning, ordinary keys only; no production-model import or writes.
import {layouts,conflicts,solutions,nextCursorKey} from './puzzle-tools.mjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
export const neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){const l=layouts[s.level],number=s.queens.filter(Boolean).length;
 need(s.queens.length===l.size*l.size&&s.queens.every(v=>typeof v==='boolean'),'Boolean board of public size');need(number===s.queenCount&&number<=l.size,'Queen total and cap');
 need(l.fixed.every(i=>s.queens[i])&&l.blocked.every(i=>!s.queens[i]),'Fixed and blocked clues protected');need(JSON.stringify(conflicts(s.queens,l.size))===JSON.stringify(s.conflicts),'Visible attack pairs match independent arithmetic');
 need(s.canSubmit===(number===l.size&&s.conflicts.length===0),'Public submit eligibility');need(s.submissions===3-s.checksRemaining,'Check accounting');
}
export function createPilot({policy='solve'}={}){
 let identity=null,lastCalls=-1,pending=null,target=null,searchInfo=null,actions=[];
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return [];const id=`${s.seed}:${s.level}`;
  if(id!==identity||s.calls<lastCalls){identity=id;pending=null;target=null;searchInfo=null;actions=[];}lastCalls=s.calls;observe(s);
  if(pending){const p=pending,done=p.key==='Space'?s.queens[p.cursor]!==p.wasQueen:p.key==='b'?s.submissions===p.submissions+1:s.cursor!==p.cursor;
   if(!done){need(s.phase==='playing'&&s.calls-p.call<120,'Queen command acknowledgment timeout');return [p.key];}
   if(p.key==='Space')need(s.queenCount===p.count+(p.wasQueen?-1:1)&&s.checksRemaining===p.checks,'Only selected queen toggles without charging check');
   if(p.key==='b')need(s.checksRemaining===p.checks-1,'Each B spends exactly one check');
   actions.push({key:p.key,call:s.calls,cursor:s.cursor,queenCount:s.queenCount,conflicts:s.conflicts.length,checks:s.checksRemaining});pending=null;return [];
  }
  if(q.phase!=='playing'||!neutral(s))return [];
  let key;if(policy==='exhaust')key='b';else{
   need(policy==='solve','Known policy');if(!target){const found=solutions(layouts[s.level]);need(found.solutions.length,'Public board is solvable');target=found.solutions[0];searchInfo={solutions:found.solutions.length,visited:found.visited};}
   const remove=s.queens.findIndex((on,i)=>on&&!target.includes(i));const add=target.find(i=>!s.queens[i]);const wanted=remove>=0?remove:add;
   key=wanted===undefined?'b':nextCursorKey(s.cursor,wanted,layouts[s.level].size)||'Space';
   if(key==='b')need(s.canSubmit,'Only submit independently valid arrangement');
  }
  pending={key,call:s.calls,cursor:s.cursor,wasQueen:s.queens[s.cursor],submissions:s.submissions,count:s.queenCount,checks:s.checksRemaining};return [key];
 };
 pilot.diagnostics=()=>structuredClone({policy,searchInfo,target,actions,pending});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){
 if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}
 if(meta.mode==='record'&&q.phase==='won'){
  if(q.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return [];
  if(menuRelease){menuRelease=false;return [];}menuRelease=true;return [q.level===q.model.level+1?'Enter':'ArrowRight'];
 }terminalAt=null;menuRelease=false;return pilot(q);
}
export function assertProgress({before,after,trace},assert){const s=after.model,l=layouts[s.level];assert.equal(after.phase,'won');assert.equal(s.score,100);assert.equal(s.queenCount,l.size);assert.equal(s.conflicts.length,0);assert.equal(s.canSubmit,true);assert.ok(s.submissions>=1);assert.ok(s.placements>before.model.placements);assert.ok(trace.some(t=>t.state.phase==='playing'&&t.state.model.canSubmit),'Valid board remained playing before explicit B');for(const t of trace)observe(t.state.model);}
export function assertRetry({after,initial},assert){for(const k of ['phase','cursor','queens','queenCount','conflicts','canSubmit','checksRemaining','submissions','placements','removals','score'])assert.deepEqual(after.model[k],initial.model[k]);}
