// Exact public-card expression planning with ordinary card/operator navigation.
import {findRoute,combine,conservation,evaluateExpression,operators} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot({wrong=false,operationReviewSeconds=0}={}){
 let level=null,lastCalls=-1,route=[],pending=null,log=[],reviewTag=null,reviewAt=0;
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];reviewTag=null;}lastCalls=s.calls;
  if(pending){if(s[pending.field]===pending.before){if(!s.inputArmed||s.cancelledLast||s.cancelEpoch!==pending.cancelEpoch){pending=null;return[];}need(s.calls-pending.call<120,'Ordinary arithmetic input was not acknowledged');return[pending.key];}if(pending.field==='mergesUsed'){need(s.mergesUsed===pending.before+1,'One merge per confirm edge');need(JSON.stringify(s.terms)===JSON.stringify(pending.terms),'Exact independent terms differ after merge');conservation(s.terms);route.shift();}if(pending.kind==='reset'){need(s.history.length===0,'Fresh retry clears undo history');route=[];}log.push({key:pending.key,call:s.calls,stage:s.stage,merges:s.mergesUsed,failures:s.failures,terms:s.terms});pending=null;return[];}
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  let key,field,kind,terms;
  if(s.stage==='retry'){key='Space';field='stage';kind='reset';}
  else{if(!route.length){route=wrong?[{firstMask:s.terms[0].mask,secondMask:s.terms[1].mask,opIndex:0}]:findRoute(s.terms).route;need(route?.length,'Visible terms require a24 expression');}const target=route[0];
   if(s.stage==='first'||s.stage==='second'){const mask=s.stage==='first'?target.firstMask:target.secondMask;if(s.terms[s.cursor].mask!==mask){key='ArrowRight';field='cursor';}else{key='Space';field='stage';}}
   else if(s.opIndex!==target.opIndex){key='ArrowRight';field='opIndex';}else{const tag=[s.mergesUsed,s.firstMask,s.secondMask,s.opIndex].join(':');if(reviewTag!==tag){reviewTag=tag;reviewAt=s.elapsed;}if(s.elapsed-reviewAt<operationReviewSeconds)return[];key='Space';field='mergesUsed';const first=s.terms.find(t=>t.mask===s.firstMask),second=s.terms.find(t=>t.mask===s.secondMask),result=combine(first,second,s.opIndex);need(result,'Chosen operation must be defined');terms=s.terms.filter(t=>t.mask!==first.mask&&t.mask!==second.mask).concat(result);}
  }
  pending={key,field,before:s[field],call:s.calls,kind,terms,cancelEpoch:s.cancelEpoch};return[key];
 };pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot({operationReviewSeconds:meta.mode==='record'?3:0});mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===5)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'twenty-four');assert.equal(s.score,100);assert.equal(s.terms.length,1);assert.equal(s.terms[0].mask,15);assert.equal(s.terms[0].n,24);assert.equal(s.terms[0].d,1);assert.deepEqual(evaluateExpression(s.terms[0].expr,s.cards),s.terms[0]);const last=s.lastOperation;assert.deepEqual(combine(last.first,last.second,operators.findIndex(o=>o[0]===last.operation)),last.result);assert.ok(s.mergesUsed>=3&&s.failures<3);assert.ok(trace.some(t=>t.state.model.mergesUsed>before.model.mergesUsed));conservation(s.terms);}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','stage','terms','cursor','firstMask','secondMask','opIndex','currentAttempt','failures','attemptMerges','mergesUsed','undoTickets','history','attemptHistory','lastOperation','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
