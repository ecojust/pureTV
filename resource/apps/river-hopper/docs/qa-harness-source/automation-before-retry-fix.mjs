// Replan from visible lane centers after every real hop; never replay a timetable.
import {planVisible,geometry} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot({lose=false,allowedHomes=null}={}){
 let level=null,lastCalls=-1,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;pending=null;log=[];}lastCalls=s.calls;
  if(pending){if(s.jumps===pending.jumps){if(!s.inputArmed||s.cancelledLast||s.cancelEpoch!==pending.cancelEpoch){pending=null;return[];}need(s.calls-pending.call<120,'Ordinary hop was not acknowledged');return[pending.key];}need(s.jumps===pending.jumps+1,'Direction edge must hop once');log.push({key:pending.key,call:s.calls,jumps:s.jumps,player:s.player,goals:s.goalCount,deaths:s.deaths});pending=null;return[];}
  if(snapshot.phase!=='playing'||s.phase!=='playing'||s.respawnTicks>0||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  let action;if(lose){need(s.player.row===6,'Natural car-loss pilot waits only on safe start');action=geometry(s,{x:s.player.x,row:5},0,{margin:-12}).reason==='car'?'up':'none';}else action=planVisible(s,{allowedHomes}).action;
  if(!action||action==='none')return[];const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[action];pending={key,call:s.calls,jumps:s.jumps,cancelEpoch:s.cancelEpoch};return[key];
 };pilot.log=()=>structuredClone(log);return pilot;
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'homes');assert.equal(s.score,100);assert.equal(s.goalCount,s.target);assert.equal(new Set(s.visited).size,s.target);assert.equal(s.arrivals.length,s.target);assert.ok(s.lives>0&&s.timeLeft>0);assert.ok(s.rideTicks>0&&s.carriedDistance>0);assert.ok(s.jumps>=s.target*6);for(const a of s.arrivals){const home=s.homes.find(h=>h.id===a.home);assert.ok(Math.abs(a.x-home.x)+s.playerRadius<=24+1e-9);assert.ok(Math.abs(a.time-a.activeTicks/120)<1e-9);}assert.ok(trace.some(t=>t.state.model.player.row===1||t.state.model.player.row===2));assert.ok(trace.some(t=>t.state.model.activeTicks>before.model.activeTicks));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','player','lanes','visited','goalCount','lives','timeLeft','activeTicks','physicsTicks','physicsRemainder','respawnTicks','rideTicks','carriedDistance','jumps','deaths','deathHistory','arrivals','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
