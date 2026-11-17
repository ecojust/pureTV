// Independent balanced-row candidates and public binary rules, using ordinary grid input.
import {solveVisible,validate} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot({wrong=false}={}){
 let level=null,lastCalls=-1,solution=null,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;solution=null;pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='cursor'?s.cursor!==pending.cursor:pending.kind==='edit'?s.edits===pending.edits+1:s.checks===pending.checks+1;
   if(!changed){need(s.calls-pending.call<120,'Ordinary binary-grid input was not acknowledged');return[pending.key];}
   if(pending.kind==='edit'){need(s.cells[pending.cursor]===(pending.value+2)%3-1,'A must cycle blank/zero/one');need(s.lastCheck===null,'Editing must remove stale errors');}
   if(pending.kind==='check')need(JSON.stringify(s.lastCheck.errors)===JSON.stringify(validate(s)),'Submitted errors must match independent binary rule checks');
   log.push({key:pending.key,call:s.calls,cursor:s.cursor,edits:s.edits,checks:s.checks,mistakes:s.mistakes});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!solution)solution=wrong?s.cells.map((_,i)=>Object.hasOwn(s.fixedValues,i)?s.fixedValues[i]:0):solveVisible(s).solution;
  const order=Array.from({length:s.cells.length},(_,i)=>{const row=Math.floor(i/s.width),col=i%s.width;return row*s.width+(row%2?s.width-1-col:col);}),target=order.find(i=>s.cells[i]!==solution[i]);let key,kind;
  if(target===undefined){key='b';kind='check';}else{const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),tx=target%s.width,ty=Math.floor(target/s.width);if(x!==tx){key=x<tx?'ArrowRight':'ArrowLeft';kind='cursor';}else if(y!==ty){key=y<ty?'ArrowDown':'ArrowUp';kind='cursor';}else{need(!Object.hasOwn(s.fixedValues,target),'Fixed clues cannot be edited');key='Space';kind='edit';}}
  pending={key,kind,call:s.calls,cursor:s.cursor,value:s.cells[s.cursor],edits:s.edits,checks:s.checks};return[key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.deepEqual(validate(s),[]);assert.equal(s.filledCount,s.cells.length);assert.equal(s.lastCheck.valid,true);assert.ok(s.checks>=1);assert.ok(s.editableCount>=10);for(const[k,v]of Object.entries(s.fixedValues))assert.equal(s.cells[k],v);assert.ok(trace.some(t=>t.state.model.edits>before.model.edits));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','cells','cursor','filledCount','zeros','ones','edits','checks','mistakes','lastCheck','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
