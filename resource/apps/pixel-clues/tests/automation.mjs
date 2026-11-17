// Test-only line-pattern solver. Production assets contain clues, not an answer bitmap.
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function patterns(size,clues){
 const result=[];
 function place(index,start,bits){if(index===clues.length){result.push(bits);return;}
  const remaining=clues.slice(index).reduce((a,b)=>a+b,0)+clues.length-index-1;
  for(let at=start;at<=size-remaining;at++){const next=bits.slice();for(let i=at;i<at+clues[index];i++)next[i]=true;place(index+1,at+clues[index]+1,next);}}
 place(0,0,Array(size).fill(false));return result;
}
export function solveVisible(s){
 need(s.rowClues?.length===s.size&&s.colClues?.length===s.size,'All public row and column clues must be visible');
 const rows=s.rowClues.map(c=>patterns(s.size,c)),cols=s.colClues.map(c=>patterns(s.size,c)),solutions=[];let visited=0;
 function search(row,grid,possible){if(solutions.length>=2)return;need(++visited<100000,'Clue search exceeded explicit bound');
  if(row===s.size){solutions.push(grid.flat());return;}
  for(const candidate of rows[row]){const filtered=possible.map((p,col)=>p.filter(bits=>bits[row]===candidate[col]));if(filtered.some(p=>!p.length))continue;search(row+1,[...grid,candidate],filtered);}}
 search(0,[],cols);need(solutions.length===1,'Authored clues must have exactly one independent solution');return {solution:solutions[0],solutions:solutions.length,visited};
}
export function runs(bits){const result=[];let n=0;for(const bit of [...bits,false]){if(bit)n++;else if(n){result.push(n);n=0;}}return result;}
export function createPilot(){
 let level=null,lastCalls=-1,solution=null,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;solution=null;pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='move'?s.cursor!==pending.cursor:s.marks===pending.marks+1;
   if(!changed){need(s.calls-pending.call<120,'Normal puzzle input was not acknowledged');return[pending.key];}
   if(pending.kind==='mark')need(s.cells[pending.cursor]===pending.value,'Mark must set the visible requested filled/cross state');
   log.push({key:pending.key,call:s.calls,cursor:s.cursor,marks:s.marks});pending=null;return[];}
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!solution)solution=solveVisible(s).solution;
  const order=Array.from({length:s.size*s.size},(_,i)=>{const row=Math.floor(i/s.size),col=i%s.size;return row*s.size+(row%2?s.size-1-col:col);});
  const target=order.find(i=>s.cells[i]!== (solution[i]?1:2));need(target!==undefined,'Incomplete picture needs another mark');
  const x=s.cursor%s.size,y=Math.floor(s.cursor/s.size),tx=target%s.size,ty=Math.floor(target/s.size);let key,kind,value;
  if(x!==tx){key=x<tx?'ArrowRight':'ArrowLeft';kind='move';}else if(y!==ty){key=y<ty?'ArrowDown':'ArrowUp';kind='move';}
  else{value=solution[target]?1:2;key=value===1?'Space':'b';kind='mark';}
  pending={key,kind,value,cursor:s.cursor,call:s.calls,marks:s.marks};return[key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);
 for(let r=0;r<s.size;r++)assert.deepEqual(runs(s.cells.slice(r*s.size,(r+1)*s.size).map(v=>v===1)),s.rowClues[r]);
 for(let c=0;c<s.size;c++)assert.deepEqual(runs(Array.from({length:s.size},(_,r)=>s.cells[r*s.size+c]===1)),s.colClues[c]);
 assert.ok(s.marks>before.model.marks);assert.ok(trace.some(t=>t.state.model.cells.includes(2)),'Normal play exercises cross marking as well as fills');
}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','cells','cursor','rowRuns','colRuns','rowMatched','colMatched','filledCount','marks','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
