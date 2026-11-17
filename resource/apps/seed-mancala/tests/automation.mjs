// Independent visible Kalah planning. No production helpers or state writes.
import {solveVisible} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot(options={}){
 let level=null,lastCalls=-1,route=[],pending=null,log=[],nextSowAt=0;
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];nextSowAt=0;}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='select'?s.selected!==pending.selected:s.playerSows===pending.playerSows+1;
   if(!changed){need(s.calls-pending.call<120,'Ordinary sowing command was not acknowledged');return[pending.key];}
   if(pending.kind==='sow'){for(const k of ['pits','sowCount','phase','reason','lastPlayerSow','lastAiSows','aiBurstCount','lastSow'])need(JSON.stringify(s[k])===JSON.stringify(route[0].expected[k]),'Independent sow mismatch: '+k);need(s.pits.reduce((a,b)=>a+b,0)===24,'Sowing must conserve all 24 seeds');route.shift();nextSowAt=s.elapsed+(options.minSowGap||0);}
   log.push({key:pending.key,call:s.calls,selected:s.selected,playerSows:s.playerSows,aiBurst:s.aiBurstCount});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(s.elapsed<nextSowAt)return[];
  if(!route.length)route=solveVisible(s,options).route;need(route.length,'Unfinished board must allow a planned sow');const from=route[0].from;
  const key=s.selected===from?'Space':(from-s.selected+6)%6<=3?'ArrowRight':'ArrowLeft',kind=s.selected===from?'sow':'select';pending={key,kind,selected:s.selected,playerSows:s.playerSows,call:s.calls};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot(meta.mode==='record'?{minSowGap:1.1}:{});mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.5)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'majority');assert.equal(s.score,100);assert.ok(s.playerSows>=4);assert.ok(s.playerStore>s.aiStore);assert.equal(s.playerStore+s.aiStore,24);assert.equal(s.pits.reduce((a,b)=>a+b,0),24);assert.ok(trace.some(t=>t.state.model.sowCount>before.model.sowCount));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','pits','selected','sowCount','playerSows','aiSows','playerStore','aiStore','playerCaptured','aiCaptured','playerExtraTurns','aiExtraTurns','lastPlayerSow','lastAiSows','lastSow','aiBurstCount','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
