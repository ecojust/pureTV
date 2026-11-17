// Test-only public-clue exact cover, driven exclusively by ordinary grid inputs.
import {solveVisible,validate,rectangle} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot({wrong=false}={}){
 let level=null,lastCalls=-1,solution=null,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;solution=null;pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='cursor'?s.cursor!==pending.cursor:pending.kind==='anchor'?s.anchor!==pending.anchor:pending.kind==='place'?s.placements===pending.placements+1:pending.kind==='remove'?s.removals===pending.removals+1:s.checks===pending.checks+1;
   if(!changed){need(s.calls-pending.call<120,'Rectangle input was not acknowledged');return[pending.key];}
   if(pending.kind==='place'){need(s.anchor===null,'Successful placement clears anchor');const r=s.rectangles.find(r=>r.cells.includes(pending.anchor));need(JSON.stringify(r.cells)===JSON.stringify(rectangle(s.width,pending.anchor,pending.cursor).cells),'Placed inclusive bounds differ');}
   if(pending.kind==='check')need(JSON.stringify(s.lastCheck.errors)===JSON.stringify(validate(s)),'Public rectangle errors differ');
   log.push({key:pending.key,call:s.calls,cursor:s.cursor,anchor:s.anchor,placements:s.placements,removals:s.removals,checks:s.checks,mistakes:s.mistakes});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!solution)solution=wrong?[rectangle(s.width,0,s.width*s.height-1)]:solveVisible(s).solution;
  let target=null,key,kind;
  const unwanted=s.rectangles.find(r=>!solution.some(w=>JSON.stringify(w.cells)===JSON.stringify(r.cells)));
  if(unwanted){if(s.anchor!==null){key='b';kind='anchor';}else{target=unwanted.cells[0];kind='remove';}}
  else{const next=solution.find(r=>!s.rectangles.some(w=>JSON.stringify(w.cells)===JSON.stringify(r.cells)));if(!next){key='b';kind='check';}else{target=s.anchor===null?next.top*s.width+next.left:next.bottom*s.width+next.right;kind=s.anchor===null?'anchor':'place';}}
  if(target!==null){const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),tx=target%s.width,ty=Math.floor(target/s.width);if(x!==tx){key=x<tx?'ArrowRight':'ArrowLeft';kind='cursor';}else if(y!==ty){key=y<ty?'ArrowDown':'ArrowUp';kind='cursor';}else key='Space';}
  pending={key,kind,call:s.calls,cursor:s.cursor,anchor:s.anchor,placements:s.placements,removals:s.removals,checks:s.checks};return[key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.deepEqual(validate(s),[]);assert.equal(s.coveredCount,s.width*s.height);assert.equal(s.rectangleCount,s.seeds.length);assert.equal(s.lastCheck.valid,true);assert.ok(trace.some(t=>t.state.model.placements>before.model.placements));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','rectangles','owners','anchor','cursor','coveredCount','placements','removals','checks','mistakes','lastCheck','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
