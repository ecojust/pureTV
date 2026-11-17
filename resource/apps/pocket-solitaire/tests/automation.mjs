// Independent public-card planner and shortest ordinary location navigation.
import {solveVisible,transfer,cardIds,navigation} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const positions=s=>JSON.stringify([s.tableau,s.freecells,s.foundations]);
export function createPilot(){
 let level=null,lastCalls=-1,route=[],pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='cursor'?s.cursor!==pending.cursor:pending.kind==='move'?s.movesUsed===pending.moves+1:s.selectedSource!==pending.source;
   if(!changed){need(s.calls-pending.call<120,'Normal card command was not acknowledged');return[pending.key];}
   if(pending.kind==='move'){for(const k of ['tableau','freecells','foundations','movesUsed','phase','reason','lastMove','foundationCount','remaining'])need(JSON.stringify(s[k])===JSON.stringify(pending.expected[k]),'Independent card transfer mismatch: '+k);need(JSON.stringify(cardIds(s))===JSON.stringify(Array.from({length:s.cards.length},(_,i)=>i)),'Every card must remain unique');route.shift();}
   else if(pending.kind==='source'||pending.kind==='cancel')need(positions(s)===pending.positions,'Marking or cancelling a source cannot move cards');
   log.push({key:pending.key,kind:pending.kind,call:s.calls,cursor:s.cursor,source:s.selectedSource,moves:s.movesUsed,foundationCount:s.foundationCount});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!route.length)route=solveVisible(s).route;const next=route[0];need(next,'Unfinished foundations require a transfer');const wrong=s.selectedSource!==null&&s.selectedSource!==next.from,target=wrong?s.selectedSource:s.selectedSource===null?next.from:next.to;let key,kind;
  if(s.cursor!==target){key=navigation(s.cursor,target)[0].key;kind='cursor';}else{key='Space';kind=wrong?'cancel':s.selectedSource===null?'source':'move';}
  pending={key,kind,call:s.calls,cursor:s.cursor,source:s.selectedSource,moves:s.movesUsed,positions:positions(s),expected:kind==='move'?transfer(s,next.from,next.to):null};return[key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'complete');assert.equal(s.score,100);assert.equal(s.remaining,0);assert.ok(s.foundations.every(n=>n===s.maxRank));assert.ok(s.movesUsed<=s.moveLimit);assert.ok(s.movesUsed-s.cards.length>=4,'Win includes several temporary placements');assert.deepEqual(cardIds(s),Array.from({length:s.cards.length},(_,i)=>i));assert.ok(trace.some(t=>t.state.model.foundationCount>before.model.foundationCount));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','tableau','freecells','foundations','cursor','selectedSource','movesUsed','undoTickets','undosUsed','history','foundationCount','remaining','lastMove','lastUndo','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
