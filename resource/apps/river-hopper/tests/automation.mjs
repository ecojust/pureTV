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
export function assertRetry({before,after,initial},assert){
 const s=after.model,start=initial.model;
 for(const k of ['seed','level','phase','reason','player','homes','target','timeLimit','visited','goalCount','lives','maxLives','respawnTicks','supportId','supportLane','rideTicks','carriedDistance','jumps','deaths','lastDeath','deathHistory','arrivals','terminalReceipt','score'])assert.deepEqual(s[k],start[k],'Fresh retry restores '+k);
 // The restart snapshot is taken after real frames have already moved the lanes.
 assert.ok(Number.isInteger(s.activeTicks)&&s.activeTicks>=0&&s.activeTicks<=240,'Restart has at most two seconds of real neutral advancement');
 if(before?.model)assert.ok(s.activeTicks<before.model.activeTicks,'Active clock restarts before the completed game');
 assert.equal(s.physicsTicks,s.activeTicks);assert.ok(Number.isFinite(s.physicsRemainder)&&s.physicsRemainder>=0&&s.physicsRemainder<1/120+1e-9);
 assert.ok(Math.abs(s.timeLeft-(s.timeLimit-s.activeTicks/120))<1e-8,'Time left follows the new active ticks');
 assert.ok(Math.abs(s.elapsed-(s.activeTicks/120+s.physicsRemainder))<1e-8,'Elapsed time and fractional tick agree');
 assert.equal(s.lanes.length,start.lanes.length);const elapsedTicks=(s.activeTicks-start.activeTicks)/120;
 for(let i=0;i<s.lanes.length;i++){const lane=s.lanes[i],origin=start.lanes[i];for(const k of ['id','type','row','speed','width'])assert.deepEqual(lane[k],origin[k],'Fresh lane restores '+k);assert.equal(lane.objects.length,origin.objects.length);
  for(let j=0;j<lane.objects.length;j++){const body=lane.objects[j],first=origin.objects[j];assert.equal(body.id,first.id);assert.ok(Number.isFinite(body.x)&&body.x>=0&&body.x<420,'Lane position stays in the canonical wrap range');const expected=((first.x+lane.speed*elapsedTicks)%420+420)%420,distance=Math.abs(body.x-expected);assert.ok(Math.min(distance,420-distance)<1e-7,'Lane position follows real neutral tick advancement');}
 }
}
