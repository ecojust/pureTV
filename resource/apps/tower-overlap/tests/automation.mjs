// Test-only pilot observes public geometry and sends ordinary A edges.
import {intersection} from './puzzle-tools.mjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function observe(s){
 need(s.floorsBuilt===s.floors.length-1&&s.floorsBuilt<=s.goal,'Bounded floor count');
 need(s.floors.every(f=>f.width>=16&&f.x>=-1e-8&&f.x+f.width<=600+1e-8),'Every counted floor has safe geometry');
 for(let i=1;i<s.floors.length;i++){const f=s.floors[i],p=s.floors[i-1];need(f.x>=p.x-1e-8&&f.x+f.width<=p.x+p.width+1e-8,'Retained floors nest inside previous floor');}
 if(s.lastLanding){const r=s.lastLanding,e=intersection({x:r.sourceX,width:r.sourceWidth},{x:r.previousX,width:r.previousWidth});need(Math.abs(r.width-e.width)<1e-8,'Actual landing matches independent intersection');need(r.accepted===(r.width>=16),'Count only accepted overlap');}
 if(s.phase==='playing')need(s.slab&&s.slab.width>=16&&s.slab.x>=-1e-8&&s.slab.x+s.slab.width<=600+1e-8,'Moving slab stays inside field');
}
export function createPilot(){
 let pending=null,lastCalls=-1,id=null,actions=[];
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return [];observe(s);const identity=`${s.seed}:${s.level}`;
  if(identity!==id||s.calls<lastCalls){pending=null;actions=[];id=identity;}lastCalls=s.calls;
  if(pending){if(s.drops===pending.drops){need(s.phase==='playing'&&s.calls-pending.call<150,'A must be acknowledged');return ['Space'];}need(s.drops===pending.drops+1,'One edge commits one slab');actions.push({call:s.calls,drop:s.drops,observedX:pending.x});pending=null;return [];}
  if(q.phase!=='playing'||s.mode!=='moving'||!s.inputArmed||s.lastHeld.a||s.cancelledLast)return [];
  const top=s.floors.at(-1),relative=(s.slab.x-top.x)*s.slab.direction;
  // An approaching window accounts for one normal browser input frame; no clock writes.
  const margin=Math.min(20,Math.max(5,(s.slab.width-16)/(s.goal-s.floorsBuilt+1)));
  if(relative>=-margin&&relative<=5){pending={drops:s.drops,call:s.calls,x:s.slab.x};return ['Space'];}
  return [];
 };pilot.diagnostics=()=>structuredClone({actions,pending});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){
 if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}
 if(meta.mode==='record'&&q.phase==='won'){
  if(q.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.1)return [];
  if(menuRelease){menuRelease=false;return [];}menuRelease=true;return [q.level===q.model.level+1?'Enter':'ArrowRight'];
 }terminalAt=null;menuRelease=false;return pilot(q);
}
export function assertProgress({before,after,trace},assert){assert.equal(after.phase,'won');assert.equal(after.model.floorsBuilt,after.model.goal);assert.equal(after.model.score,100);assert.ok(after.model.drops>before.model.drops);assert.ok(trace.some(t=>t.state.model.mode==='dropping'));assert.ok(trace.some(t=>t.state.model.lastLanding?.accepted));for(const t of trace)observe(t.state.model);}
export function assertRetry({after,initial},assert){for(const k of ['phase','floors','floorsBuilt','goal','drops','lastLanding','score'])assert.deepEqual(after.model[k],initial.model[k]);assert.equal(after.model.mode,'moving');}
