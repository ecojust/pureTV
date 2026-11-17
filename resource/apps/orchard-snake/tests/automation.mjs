// Snapshot-only controller. The route helper uses current body/food, never future spawns.
import {chooseDirection} from './route.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
export function createPilot(){
 return snapshot=>{
  const s=snapshot.model;if(!s||snapshot.phase!=='playing'||snapshot.paused||!s.inputArmed||s.cancelledLast)return[];
  if(s.queuedDirection)return[];
  const desired=chooseDirection(s);if(!desired)throw Error('No safe next cell in the visible snake state');
  if(desired.name===s.direction)return[];
  // A real finite brake can buy time when a late observed turn has <60 ms left.
  if(s.brakes>0&&s.brakeRemaining===0&&s.interval-s.moveClock<.06&&!s.lastHeld.a)return['Space'];
  return[desired.key];
 };
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.equal(s.eaten,s.goalFruit);assert.equal(s.body.length,3+s.eaten);assert.equal(new Set(s.body).size,s.body.length);assert.ok(s.body.every(p=>!s.walls[p]));assert.ok(s.moves>before.model.moves);
 assert.ok(trace.some(t=>t.state.model.eaten>before.model.eaten),'Normal timed movement must actually collect fruit and grow');
}
export function assertRetry({after,initial},assert){const s=after.model;assert.equal(s.phase,'playing');assert.equal(s.eaten,0);assert.equal(s.body.length,3);assert.equal(s.brakes,3);assert.equal(s.brakesUsed,0);assert.equal(s.score,0);assert.equal(s.level,initial.model.level);assert.ok(s.moves<=1,'Snapshot immediately after retry has at most one normal timer move');}
