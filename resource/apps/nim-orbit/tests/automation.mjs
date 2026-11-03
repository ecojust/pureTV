// Independent recursive take-away outcomes, visible snapshots and normal keys.
import {solveVisible} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot(options={}){
 let level=null,lastCalls=-1,route=[],pending=null,log=[],nextMoveAt=0;
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];nextMoveAt=0;}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='pile'?s.selected!==pending.selected:pending.kind==='amount'?s.amount!==pending.amount:s.playerMoves===pending.moves+1;
   if(!changed){need(s.calls-pending.call<120,'Normal take-away command was not acknowledged');return[pending.key];}
   if(pending.kind==='move'){for(const k of ['piles','remaining','totalMoves','phase','reason','lastPlayerMove','lastAiMove','lastRound'])need(JSON.stringify(s[k])===JSON.stringify(route[0].expected[k]),'Independent take-away mismatch: '+k);need(s.remaining+s.playerRemoved+s.aiRemoved===s.initialTotal,'Stone conservation must hold');route.shift();nextMoveAt=s.elapsed+(options.minMoveGap||0);}
   log.push({key:pending.key,call:s.calls,selected:s.selected,amount:s.amount,remaining:s.remaining,playerMoves:s.playerMoves});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(s.elapsed<nextMoveAt)return[];
  if(!route.length)route=solveVisible(s,options).route;const target=route[0];need(target,'Unfinished piles need a move');let key,kind;
  if(s.selected!==target.pile){key=(target.pile-s.selected+s.piles.length)%s.piles.length<=s.piles.length/2?'ArrowRight':'ArrowLeft';kind='pile';}
  else if(s.amount!==target.amount){key=s.amount<target.amount?'ArrowUp':'ArrowDown';kind='amount';}else{key='Space';kind='move';}
  pending={key,kind,call:s.calls,selected:s.selected,amount:s.amount,moves:s.playerMoves};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot(meta.mode==='record'?{minMoveGap:1}:{});mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.5)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.equal(s.remaining,0);assert.ok(s.piles.every(v=>v===0));assert.equal(s.playerRemoved+s.aiRemoved,s.initialTotal);assert.ok(s.playerMoves>=3);assert.equal(s.reason,s.misere?'opponent-last':'player-last');assert.ok(trace.some(t=>t.state.model.playerMoves>before.model.playerMoves));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','piles','selected','amount','remaining','playerMoves','aiMoves','totalMoves','playerRemoved','aiRemoved','lastPlayerMove','lastAiMove','lastRound','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
