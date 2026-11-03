// Independent three-peg state graph; only public snapshots and normal keys.
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function legalTransfer(pegs,from,to){
 const result=pegs.map(p=>p.slice()),disk=result[from].at(-1);
 need(disk!==undefined&&from!==to&&(!result[to].length||result[to].at(-1)>disk),'Only a smaller top ring can move onto a larger one');
 result[from].pop();result[to].push(disk);return {pegs:result,disk};
}
export function solveVisible(s){
 const key=p=>JSON.stringify(p),start={pegs:s.pegs.map(p=>p.slice()),route:[]},queue=[start],seen=new Set([key(start.pegs)]);
 for(let q=0;q<queue.length;q++){
  const n=queue[q];if(n.pegs[s.target].length===s.diskCount)return {route:n.route,states:seen.size};
  if(n.route.length>=s.moveLimit-s.movesUsed)continue;
  for(let from=0;from<3;from++)for(let to=0;to<3;to++){
   const disk=n.pegs[from].at(-1);if(disk===undefined||from===to||(n.pegs[to].length&&n.pegs[to].at(-1)<disk))continue;
   const {pegs}=legalTransfer(n.pegs,from,to),k=key(pegs);if(seen.has(k))continue;seen.add(k);queue.push({pegs,route:[...n.route,{from,to,disk}]});
  }
 }
 throw Error('Visible ring tower cannot finish within the remaining transfers');
}
export function createPilot(){
 let identity=null,lastCalls=-1,route=[],pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return [];
  if(identity!==s.level||s.calls<lastCalls){identity=s.level;route=[];pending=null;log=[];}lastCalls=s.calls;
  if(pending){
   const changed=pending.kind==='select'?s.selected!==pending.selected:pending.kind==='transfer'?s.movesUsed===pending.moves+1:s.source!==pending.source;
   if(!changed){need(s.calls-pending.call<120,'Normal key was not acknowledged');return[pending.key];}
   if(pending.kind==='transfer'){const expected=legalTransfer(pending.pegs,pending.from,pending.to);need(JSON.stringify(s.pegs)===JSON.stringify(expected.pegs),'Actual transfer must match independent top-ring movement');route.shift();}
   else if(pending.kind==='source')need(JSON.stringify(s.pegs)===JSON.stringify(pending.pegs),'Source selection cannot remove a ring');
   log.push({kind:pending.kind,call:s.calls,selected:s.selected,source:s.source,moves:s.movesUsed});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!route.length)route=solveVisible(s).route;const next=route[0];need(next,'Incomplete tower needs a transfer');
  let key,kind;
  if(s.source!==null&&s.source!==next.from){key='b';kind='cancel';}
  else{const target=s.source===null?next.from:next.to;if(s.selected!==target){key=(target-s.selected+3)%3===1?'ArrowRight':'ArrowLeft';kind='select';}else{key='Space';kind=s.source===null?'source':'transfer';}}
  pending={key,kind,call:s.calls,selected:s.selected,source:s.source,moves:s.movesUsed,pegs:s.pegs.map(p=>p.slice()),...next};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
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
export function assertProgress({before,after,trace},assert){const s=after.model;
 assert.equal(after.phase,'won');assert.equal(s.score,100);assert.equal(s.pegs[s.target].length,s.diskCount);assert.equal(s.source,null);assert.ok(s.movesUsed>0&&s.movesUsed<=s.moveLimit);
 assert.deepEqual(s.pegs.flat().sort((a,b)=>a-b),Array.from({length:s.diskCount},(_,i)=>i+1));assert.ok(trace.some(t=>t.state.model.movesUsed>before.model.movesUsed),'Normal play must transfer rings');
}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','pegs','selected','source','movesUsed','transfers','lastMove','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
