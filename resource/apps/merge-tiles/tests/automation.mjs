// Independent public-board planning; normal browser inputs only.
import {advance,planVisible,directions} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot(options={}){
 let level=null,lastCalls=-1,route=[],pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];}lastCalls=s.calls;
  if(pending){
   if(s.movesUsed===pending.moves){need(s.calls-pending.call<120,'Ordinary slide was not acknowledged');return[pending.key];}
   for(const field of ['cells','movesUsed','points','spawnIndex','lastSpawn','phase','reason'])need(JSON.stringify(s[field])===JSON.stringify(pending.expected[field]),'Independent slide mismatch: '+field);
   log.push({key:pending.key,call:s.calls,moves:s.movesUsed,spawn:s.lastSpawn,points:s.points});route.shift();pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!route.length)route=planVisible(s,options).route;const direction=directions[route[0]];need(direction,'Incomplete board requires a legal slide');
  pending={key:direction.key,call:s.calls,moves:s.movesUsed,expected:advance(s,direction)};need(pending.expected,'Planned slide must change board');return[direction.key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.ok(s.cells.some(v=>v>=s.target));assert.equal(s.lastSpawn,null);assert.ok(s.movesUsed>=11&&s.movesUsed<=s.moveLimit);assert.ok(s.points>0);assert.ok(trace.some(t=>t.state.model.spawnIndex>before.model.spawnIndex));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','cells','movesUsed','points','spawnIndex','nextSpawnValue','lastSpawn','lastMerges','history','undoTickets','undos','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
