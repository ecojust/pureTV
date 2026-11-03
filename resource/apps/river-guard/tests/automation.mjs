// Independent public bank-partition planning, driven solely by normal keys.
import {solveVisible,crossing} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot(options={}){
 let level=null,lastCalls=-1,route=[],pending=null,log=[],nextCrossAt=0;
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];nextCrossAt=0;}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='select'?s.selected!==pending.selected:pending.kind==='cargo'?JSON.stringify(s.cargo)!==pending.cargo:s.crossingsUsed===pending.crossings+1;
   if(!changed){need(s.calls-pending.call<120,'Normal ferry input was not acknowledged');return[pending.key];}
   if(pending.kind==='cross'){for(const k of ['sides','farmer','cargo','crossingsUsed','phase','reason','dangerPairs','bankCounts','deliveredCount','lastCrossing'])need(JSON.stringify(s[k])===JSON.stringify(pending.expected[k]),'Independent crossing mismatch: '+k);route.shift();nextCrossAt=s.elapsed+(options.minCrossGap||0);}
   if(pending.kind==='cargo')need(JSON.stringify(s.sides)===pending.sides,'Loading choices cannot change bank membership');
   log.push({key:pending.key,call:s.calls,cargo:s.cargo,farmer:s.farmer,crossings:s.crossingsUsed});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(s.elapsed<nextCrossAt)return[];
  if(!route.length)route=solveVisible(s).route;need(route.length,'Unfinished banks require a safe crossing');const desired=route[0].cargo,extra=s.cargo.find(i=>!desired.includes(i)),missing=desired.find(i=>!s.cargo.includes(i)),target=extra!==undefined?extra:missing;
  let key,kind;if(target===undefined){key='b';kind='cross';}else if(s.selected===target){key='Space';kind='cargo';}else{key=(target-s.selected+s.items.length)%s.items.length<=s.items.length/2?'ArrowRight':'ArrowLeft';kind='select';}
  pending={key,kind,call:s.calls,selected:s.selected,cargo:JSON.stringify(s.cargo),sides:JSON.stringify(s.sides),crossings:s.crossingsUsed,expected:kind==='cross'?crossing(s,s.cargo):null};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot(meta.mode==='record'?{minCrossGap:.8}:{});mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.5)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'delivered');assert.equal(s.score,100);assert.equal(s.farmer,1);assert.ok(s.sides.every(b=>b===1));assert.equal(s.crossingsUsed%2,1);assert.ok(s.crossingsUsed<=s.crossingLimit);assert.ok(trace.some(t=>t.state.model.crossingsUsed>before.model.crossingsUsed));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','sides','farmer','selected','cargo','crossingsUsed','bankCounts','deliveredCount','dangerPairs','lastCrossing','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
