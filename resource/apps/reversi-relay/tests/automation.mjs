// QA-only independent strategy; receives snapshots, never a page or live model.
import assert from 'node:assert/strict';
import R from './reference.cjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const clone=x=>structuredClone(x);
export function observe(s){
 assert.equal(s.board.length,36);assert.ok(s.board.every(v=>v===0||v===1||v===2));
 assert.deepEqual(s.counts,R.counts(s.board));
 assert.deepEqual(s.legalMoves,R.legal(s.board,1).map(m=>m.cell));
 assert.ok(Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<36);
 if(s.phase==='won'||s.phase==='lost')assert.ok(R.terminal(s.board),'Terminal board has no legal moves for either side');
}
const isNeutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function createPilot({policy='max',route=null}={}){
 assert.ok(policy==='max'||policy==='min');let identity=null,lastCalls=-1,pending=null,memo=new Map(),issued=[],acknowledged=[],routeIndex=0;
 function reset(s){identity=s.seed+':'+s.level;lastCalls=s.calls;pending=null;memo=new Map();issued=[];acknowledged=[];routeIndex=0;}
 function issue(s,key,cell){pending={key,cell,call:s.calls,cursor:s.cursor,board:s.board.slice(),playerMoves:s.playerMoves,playerPasses:s.playerPasses,aiMoves:s.aiMoves};issued.push(clone(pending));return [key];}
 const pilot=snapshot=>{
  const s=snapshot?.model;if(!s||snapshot.paused)return [];
  if(identity!==s.seed+':'+s.level||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
  if(pending){const p=pending,isAction=p.key==='Space'||p.key==='b';const accepted=isAction?s.playerMoves>p.playerMoves||s.playerPasses>p.playerPasses:s.cursor!==p.cursor;
   if(!accepted){assert.ok(s.phase==='playing'&&s.calls-p.call<180,'Ordinary browser input must receive an observable response');return [p.key];}
   if(isAction){const expected=R.round(p.board,p.cell);assert.deepEqual(s.board,expected.board,'Actual flips and deterministic AI reply must match independent rules');assert.equal(s.aiMoves-p.aiMoves,expected.ai?1:0);if(route)routeIndex++;}
   acknowledged.push({key:p.key,cell:p.cell,call:s.calls,cursor:s.cursor,playerMoves:s.playerMoves,playerPasses:s.playerPasses,aiMoves:s.aiMoves});pending=null;return [];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!isNeutral(s))return [];
  if(route&&routeIndex>=route.length)return [];
  const target=route?route[routeIndex]:R.search(s.board,policy,memo).cell;
  if(target===null){assert.equal(s.legalMoves.length,0);return issue(s,'b',null);}
  assert.ok(s.legalMoves.includes(target),'Chosen player move must be visibly legal');
  if(s.cursor!==target){const row=Math.floor(s.cursor/6),col=s.cursor%6,tr=Math.floor(target/6),tc=target%6;return issue(s,row!==tr?(row<tr?'ArrowDown':'ArrowUp'):(col<tc?'ArrowRight':'ArrowLeft'),target);}
  return issue(s,'Space',target);
 };
 pilot.diagnostics=()=>clone({policy,issued,acknowledged,pending,routeIndex,searchedStates:memo.size});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(meta.mode!==lastMode){pilot=createPilot();lastMode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return [];
  if(terminalAt===null)terminalAt=meta.elapsed;
  if(meta.elapsed-terminalAt<1.2)return [];
  if(release){release=false;return [];}
  release=true;return [snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},a){
 const s=after.model;observe(s);a.equal(after.phase,'won');a.equal(s.phase,'won');a.equal(s.score,100);
 a.ok(s.counts.player>s.counts.opponent);a.ok(s.playerMoves>before.model.playerMoves);a.ok(s.aiMoves>before.model.aiMoves);
 a.ok(trace.some(t=>t.state.model.lastPlayerMove?.flipped?.length),'Ordinary game must actually bracket and flip pieces');
 a.ok(trace.some(t=>t.state.model.lastAiMove?.flipped?.length),'Opponent must actually reply with bracketed flips');
 a.ok(s.aiPasses>0,'Authored winning routes exercise automatic opponent passes');
}
export function assertRetry({after,initial},a){
 const s=after.model,f=initial.model;
 for(const key of ['board','cursor','legalMoves','counts','lastPlayerMove','lastAiMove','playerMoves','aiMoves','playerPasses','aiPasses','movesPlayed','phase','reason','score'])a.deepEqual(s[key],f[key],'Fresh retry restores '+key);
}
