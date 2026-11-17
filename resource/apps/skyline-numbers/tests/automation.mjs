// QA-only constraints over public givens and clues; normal acknowledged keyboard input.
import assert from'node:assert/strict';import R from'./reference.cjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});const clone=x=>structuredClone(x),neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){assert.equal(s.filled,s.board.filter(Boolean).length);assert.deepEqual(s.visibility,R.views(s.board,s.size));assert.equal(s.attemptsLeft,3-s.checks);assert.ok(s.givens.every((v,i)=>!v||s.board[i]===v));const conflicts=s.board.map((v,i)=>v!==0&&s.board.some((w,j)=>j!==i&&w===v&&(Math.floor(j/s.size)===Math.floor(i/s.size)||j%s.size===i%s.size)));assert.deepEqual(s.conflicts,conflicts);}
export function createPilot({policy='solve',initialRejects=0}={}){
 assert.ok(['solve','wrong-edges','incomplete'].includes(policy));let identity=null,lastCalls=-1,pending=null,goal=null,issued=[],acknowledged=[],search=null;
 function reset(s){identity=s.seed+':'+s.level;lastCalls=s.calls;pending=null;issued=[];acknowledged=[];const clues=policy==='wrong-edges'?Object.fromEntries(['top','right','bottom','left'].map(side=>[side,Array(s.size).fill(0)])):s.clues;search=R.solve({size:s.size,fixed:s.givens,clues});goal=policy==='wrong-edges'?search.solutions.find(board=>!R.valid(board,s.size,s.clues,s.givens)):search.solutions[0];assert.ok(goal);if(policy==='solve')assert.ok(search.unique);}
 function issue(s,key,target=null){pending={key,target,call:s.calls,cursor:s.cursor,edits:s.edits,checks:s.checks,oldValue:target===null?null:s.board[target]};issued.push(clone(pending));return[key];}
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return[];if(identity!==s.seed+':'+s.level||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
  if(pending){const p=pending,accepted=p.key==='Space'?s.edits===p.edits+1:p.key==='b'?s.checks===p.checks+1:s.cursor!==p.cursor;if(!accepted){assert.ok(s.phase==='playing'&&s.calls-p.call<180,'Ordinary key input needs actual acknowledgement');return[p.key];}
   if(p.key==='Space')assert.equal(s.board[p.target],(p.oldValue+1)%(s.size+1));if(p.key==='b'){assert.equal(s.attemptsLeft,3-s.checks);if(policy==='wrong-edges'&&s.board.every((v,i)=>v===goal[i])){assert.equal(s.lastCheck.complete,true);assert.equal(s.lastCheck.latin,true);assert.equal(s.lastCheck.edges,false);}}
   acknowledged.push({key:p.key,target:p.target,call:s.calls,edits:s.edits,checks:s.checks,filled:s.filled,phase:s.phase});pending=null;return[];
  }
  if(q.phase!=='playing'||s.phase!=='playing'||!neutral(s))return[];
  if(policy==='incomplete'||s.checks<initialRejects)return issue(s,'b');
  const differences=s.board.flatMap((v,i)=>v!==goal[i]?[i]:[]);if(!differences.length)return issue(s,'b');
  const distance=c=>Math.abs(c%s.size-s.cursor%s.size)+Math.abs(Math.floor(c/s.size)-Math.floor(s.cursor/s.size)),target=differences.sort((a,b)=>distance(a)-distance(b)||a-b)[0];assert.equal(s.givens[target],0);
  if(s.cursor!==target){const row=Math.floor(s.cursor/s.size),col=s.cursor%s.size,tr=Math.floor(target/s.size),tc=target%s.size;return issue(s,row!==tr?(row<tr?'ArrowDown':'ArrowUp'):(col<tc?'ArrowRight':'ArrowLeft'));}return issue(s,'Space',target);
 };pilot.diagnostics=()=>clone({policy,initialRejects,issued,acknowledged,pending,searchNodes:search?.nodes,goal});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,release=false;
export function keys(q,meta={}){if(meta.mode!==lastMode){lastMode=meta.mode;pilot=createPilot();terminalAt=null;release=false;}if(meta.mode==='record'&&q.phase==='won'){if(q.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];if(release){release=false;return[];}release=true;return[q.level===q.model.level+1?'Enter':'ArrowRight'];}terminalAt=null;release=false;return pilot(q);}
export function assertProgress({before,after,trace},a){const s=after.model;observe(s);a.equal(after.phase,'won');a.equal(s.phase,'won');a.equal(s.score,100);a.ok(R.valid(s.board,s.size,s.clues,s.givens));a.ok(s.edits>before.model.edits);a.ok(trace.some(t=>t.state.phase==='playing'&&t.state.model.filled===s.size*s.size&&R.valid(t.state.model.board,s.size,s.clues,s.givens)),'A complete valid board must remain playing before B checks it');a.ok(s.checkReceipts.some(r=>r.outcome==='won'));}
export function assertRetry({after,initial},a){for(const key of['size','board','givens','clues','cursor','attemptsLeft','checks','edits','filled','conflicts','visibility','lastCheck','checkReceipts','phase','reason','score'])a.deepEqual(after.model[key],initial.model[key],'Fresh retry restores '+key);}
