// QA-only independent tour policy; receives read-only snapshots and returns key names.
import assert from'node:assert/strict';import R from'./reference.cjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});const clone=x=>structuredClone(x),neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){assert.equal(s.knight,s.path.at(-1));assert.equal(new Set(s.path).size,s.path.length);assert.ok(s.path.every(c=>!s.blocked.includes(c)));assert.deepEqual(s.visited,Array.from({length:s.width*s.height},(_,c)=>s.path.includes(c)));assert.deepEqual(s.legalMoves,R.legal(s));assert.equal(s.remaining,s.width*s.height-s.blocked.length-s.path.length);assert.equal(s.undoTokens,3-s.undos);}
export function createPilot({policy='solve',undoFirst=false}={}){
 assert.ok(['solve','lose'].includes(policy));let identity=null,lastCalls=-1,pending=null,route=[],returnCell=null,undoDone=!undoFirst,issued=[],acknowledged=[],searchNodes=0;
 function reset(s){identity=s.seed+':'+s.level;lastCalls=s.calls;pending=null;route=[];returnCell=null;undoDone=!undoFirst;issued=[];acknowledged=[];searchNodes=0;}
 function issue(s,key,target=null,kind='select'){pending={key,target,kind,call:s.calls,cursor:s.cursor,knight:s.knight,jumps:s.jumps,undos:s.undos,path:s.path.slice()};issued.push(clone(pending));return[key];}
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return[];if(identity!==s.seed+':'+s.level||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
  if(pending){const p=pending,accepted=p.key==='Space'?s.jumps===p.jumps+1:p.key==='b'?s.undos===p.undos+1:s.cursor!==p.cursor;if(!accepted){assert.ok(s.phase==='playing'&&s.calls-p.call<180,'Ordinary key input needs an actual response');return[p.key];}
   if(p.key==='Space'){assert.deepEqual(s.path,[...p.path,p.target]);assert.equal(s.knight,p.target);if(p.kind==='route')route.shift();if(p.kind==='return')returnCell=null;}
   if(p.key==='b'){assert.deepEqual(s.path,p.path.slice(0,-1));assert.equal(s.jumps,p.jumps);assert.equal(s.visited[p.knight],false);if(p.kind==='recover')returnCell=p.knight;else{undoDone=true;route=[];}}
   acknowledged.push({key:p.key,call:s.calls,knight:s.knight,jumps:s.jumps,undos:s.undos,remaining:s.remaining});pending=null;return[];
  }
  if(q.phase!=='playing'||s.phase!=='playing'||!neutral(s))return[];
  if(!undoDone&&s.jumps>0)return issue(s,'b',null,'undo-first');
  if(policy==='lose'&&!s.legalMoves.length){assert.ok(s.undoTokens>0&&s.path.length>1);return issue(s,'b',null,'recover');}
  let target,kind='route';if(returnCell!==null){target=returnCell;kind='return';}else{if(!route.length){if(policy==='solve'){const plan=R.solve(s);assert.ok(plan.found,'Visible partial route must admit an independently found completion');route=plan.cells;searchNodes+=plan.nodes;}else{const bad=R.badPath(s);assert.ok(bad.remaining>0,'Loss fixture must reach an incomplete dead end');route=bad.cells;}}target=route[0];}
  assert.ok(s.legalMoves.includes(target),'Chosen landing must be visibly legal');if(s.cursor!==target){const r=Math.floor(s.cursor/s.width),c=s.cursor%s.width,tr=Math.floor(target/s.width),tc=target%s.width;return issue(s,r!==tr?(r<tr?'ArrowDown':'ArrowUp'):(c<tc?'ArrowRight':'ArrowLeft'));}return issue(s,'Space',target,kind);
 };pilot.diagnostics=()=>clone({policy,undoFirst,undoDone,issued,acknowledged,pending,remainingRoute:route,returnCell,searchNodes});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,release=false;
export function keys(q,meta={}){if(meta.mode!==lastMode){lastMode=meta.mode;pilot=createPilot();terminalAt=null;release=false;}if(meta.mode==='record'&&q.phase==='won'){if(q.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];if(release){release=false;return[];}release=true;return[q.level===q.model.level+1?'Enter':'ArrowRight'];}terminalAt=null;release=false;return pilot(q);}
export function assertProgress({before,after,trace},a){const s=after.model;observe(s);a.equal(after.phase,'won');a.equal(s.phase,'won');a.equal(s.score,100);a.equal(s.remaining,0);a.equal(s.path.length,s.width*s.height-s.blocked.length);a.ok(s.jumps>before.model.jumps);a.ok(trace.some(t=>t.state.model.cursor!==t.state.model.knight),'Actual cursor selection precedes jumps');a.ok(trace.some(t=>t.state.model.path.length>2),'Actual multi-jump route required');}
export function assertRetry({after,initial},a){for(const key of['width','height','blocked','knight','cursor','path','visited','legalMoves','remaining','undoTokens','jumps','undos','lastJump','phase','reason','score'])a.deepEqual(after.model[key],initial.model[key],'Fresh retry restores '+key);}
