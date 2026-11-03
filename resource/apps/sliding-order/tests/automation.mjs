// Independent QA-only 8-puzzle graph policy. Never imports the production model.
import assert from 'node:assert/strict';
import R from './reference.cjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const clone=x=>structuredClone(x),neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){assert.equal(s.board.length,9);assert.deepEqual([...s.board].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8]);assert.equal(s.blank,s.board.indexOf(0));assert.equal(s.matched,s.board.filter((v,i)=>v!==0&&v===R.goal[i]).length);assert.ok(s.movesUsed<=s.moveLimit);}
export function createPilot({policy='solve',undoFirst=false}={}){
 assert.ok(['solve','lose'].includes(policy));let identity=null,lastCalls=-1,pending=null,undoDone=!undoFirst,issued=[],acknowledged=[];
 function reset(s){identity=s.seed+':'+s.level;lastCalls=s.calls;pending=null;undoDone=!undoFirst;issued=[];acknowledged=[];}
 function issue(s,key,target,undo=false){pending={key,target,undo,call:s.calls,moves:s.movesUsed,undos:s.undos,board:s.board.slice(),blank:s.blank};issued.push(clone(pending));return [key];}
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return [];if(identity!==s.seed+':'+s.level||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
  if(pending){const p=pending,ok=p.undo?s.undos===p.undos+1:s.movesUsed===p.moves+1;if(!ok){assert.ok(s.phase==='playing'&&s.calls-p.call<180,'Ordinary input must receive actual model acknowledgement');return [p.key];}assert.deepEqual(s.board,p.target.board);assert.equal(s.blank,p.target.blank);if(p.undo){assert.equal(s.movesUsed,p.moves,'Undo cannot refund spent slide');undoDone=true;}acknowledged.push({key:p.key,call:s.calls,moves:s.movesUsed,undos:s.undos,board:s.board.slice()});pending=null;return [];}
  if(q.phase!=='playing'||s.phase!=='playing'||!neutral(s))return [];
  if(!undoDone&&s.movesUsed>0){const h=s.history.at(-1);assert.ok(h);return issue(s,'Space',clone(h),true);}
  const choices=R.neighbors(s.board);let next;
  if(policy==='solve')next=R.plan(s.board)[0];else next=choices.sort((a,b)=>R.distance(b.board)-R.distance(a.board))[0];
  assert.ok(next);return issue(s,next.key,{board:next.board,blank:next.blank});
 };pilot.diagnostics=()=>clone({policy,undoFirst,undoDone,issued,acknowledged,pending});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){if(meta.mode!==lastMode){lastMode=meta.mode;pilot=createPilot();terminalAt=null;release=false;}if(meta.mode==='record'&&snapshot.phase==='won'){if(snapshot.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return [];if(release){release=false;return [];}release=true;return [snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];}terminalAt=null;release=false;return pilot(snapshot);}
export function assertProgress({before,after,trace},a){const s=after.model;observe(s);a.equal(after.phase,'won');a.equal(s.phase,'won');a.deepEqual(s.board,R.goal);a.equal(s.score,100);a.equal(s.matched,8);a.ok(s.movesUsed>before.model.movesUsed&&s.movesUsed<=s.moveLimit);a.ok(trace.some(t=>t.state.model.blank!==before.model.blank),'Actual empty-cell movement required');}
export function assertRetry({after,initial},a){for(const key of ['board','blank','history','movesUsed','moveLimit','slides','undos','matched','lastSlide','phase','reason','score'])a.deepEqual(after.model[key],initial.model[key],'Fresh retry restores '+key);}
