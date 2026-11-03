// Public clue permutation solver; ordinary cell navigation/cycles/submission only.
import {solveVisible,validate,navigation} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot({wrong=false}={}){
 let level=null,lastCalls=-1,solution=null,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;solution=null;pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='cursor'?s.cursor!==pending.cursor:pending.kind==='edit'?s.edits===pending.edits+1:s.checks===pending.checks+1;
   if(!changed){need(s.calls-pending.call<120,'Normal sum-puzzle input was not acknowledged');return[pending.key];}
   if(pending.kind==='edit'){need(s.cells[pending.cursor]===(pending.value+1)%10,'A must cycle one visible digit');need(JSON.stringify(s.runStatus)===JSON.stringify(validate(s)),'Public run feedback must match independent sums and duplicates');}
   log.push({key:pending.key,call:s.calls,cursor:s.cursor,edits:s.edits,checks:s.checks,mistakes:s.mistakes});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!solution)solution=wrong?s.cells.map((v,i)=>v===-1?-1:Object.hasOwn(s.givens,i)?s.givens[i]:1):solveVisible(s).solution;
  const target=s.whiteCells.find(i=>s.cells[i]!==solution[i]);let key,kind;
  if(target===undefined){key='b';kind='check';}else if(s.cursor!==target){key=navigation(s,s.cursor,target)[0].key;kind='cursor';}else{need(!Object.hasOwn(s.givens,target),'Cannot edit a public fixed cell');key='Space';kind='edit';}
  pending={key,kind,call:s.calls,cursor:s.cursor,value:s.cells[s.cursor],edits:s.edits,checks:s.checks};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot();mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.ok(validate(s).every(r=>r.matched));assert.ok(s.checks>=1);assert.equal(s.lastCheck.valid,true);for(const[k,v]of Object.entries(s.givens))assert.equal(s.cells[k],v);assert.ok(trace.some(t=>t.state.model.edits>before.model.edits));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','cells','cursor','filledCount','runStatus','edits','checks','mistakes','lastCheck','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
