// Candidate planning consumes only public feedback. No secret generator/store access.
import {publicLayouts,feedback,planFromPublic} from './puzzle-tools.mjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
export const neutral=s=>s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';
export function observe(s){const l=publicLayouts[s.level];need(s.guess.length===4&&s.guess.every(x=>x===null||(Number.isInteger(x)&&x>=0&&x<l.symbols)),'Four public guess slots');need(s.history.length===s.attemptsUsed&&s.attemptsUsed+s.attemptsRemaining===l.attemptLimit,'Attempt conservation');if(s.phase==='playing')need(s.reveal===null,'No playing secret reveal');for(const row of s.history)need(row.guess.length===4&&row.exact>=0&&row.misplaced>=0&&row.exact+row.misplaced<=4,'Bounded aggregate feedback');}
export function symbolKey(current,target,symbols){
 if(current===target)return null;
 if(current===null)return target+1<=symbols-target?'ArrowUp':'ArrowDown';
 return (target-current+symbols)%symbols<=(current-target+symbols)%symbols?'ArrowUp':'ArrowDown';
}
export function createPilot({repeatGuess=null}={}){
 let identity=null,lastCalls=-1,pending=null,plan=null,plannedHistory=-1,actions=[],plans=[];
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return [];const id=`${s.seed}:${s.level}`;
  if(id!==identity||s.calls<lastCalls){identity=id;pending=null;plan=null;plannedHistory=-1;actions=[];plans=[];}lastCalls=s.calls;observe(s);
  if(pending){const p=pending;let done;if(p.key==='Space')done=s.attemptsUsed===p.attempts+1;else if(p.key==='ArrowUp'||p.key==='ArrowDown')done=s.guess[p.cursor]!==p.value;else done=s.cursor!==p.cursor;
   if(!done){need(s.phase==='playing'&&s.calls-p.call<160,'Code input acknowledgment timeout');return [p.key];}
   if(p.key==='Space'){const row=s.history.at(-1);need(JSON.stringify(row.guess)===JSON.stringify(p.guess),'Submitted guess is copied intact');need(s.attemptsRemaining===p.remaining-1,'Only a complete A spends one attempt');plan=null;}
   actions.push({key:p.key,call:s.calls,cursor:s.cursor,guess:s.guess.slice(),attempts:s.attemptsUsed});pending=null;return [];
  }
  if(q.phase!=='playing'||!neutral(s))return [];
  if(!plan||plannedHistory!==s.history.length){plan=repeatGuess?{guess:repeatGuess.slice(),candidateCount:null}:planFromPublic(s);plannedHistory=s.history.length;plans.push({historyLength:plannedHistory,...structuredClone(plan)});}
  const mismatch=plan.guess.findIndex((x,i)=>s.guess[i]!==x);let key;
  if(mismatch<0)key='Space';else if(s.cursor!==mismatch)key=mismatch>s.cursor?'ArrowRight':'ArrowLeft';else key=symbolKey(s.guess[mismatch],plan.guess[mismatch],publicLayouts[s.level].symbols);
  pending={key,call:s.calls,cursor:s.cursor,value:s.guess[s.cursor],guess:s.guess.slice(),attempts:s.attemptsUsed,remaining:s.attemptsRemaining};return [key];
 };
 pilot.diagnostics=()=>structuredClone({plans,actions,pending,repeatGuess});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){
 if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}
 if(meta.mode==='record'&&q.phase==='won'){
  if(q.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.1)return [];
  if(menuRelease){menuRelease=false;return [];}menuRelease=true;return [q.level===q.model.level+1?'Enter':'ArrowRight'];
 }terminalAt=null;menuRelease=false;return pilot(q);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.deepEqual(s.reveal,s.guess);assert.ok(s.attemptsUsed>before.model.attemptsUsed);assert.equal(s.history.at(-1).exact,4);assert.equal(s.history.at(-1).misplaced,0);assert.ok(trace.some(t=>t.state.phase==='playing'&&t.state.model.history.length>0),'Public intermediate feedback actually observed');for(const t of trace)observe(t.state.model);for(const row of s.history)assert.deepEqual({exact:row.exact,misplaced:row.misplaced},feedback(s.reveal,row.guess));}
export function assertRetry({after,initial},assert){for(const k of ['phase','cursor','guess','history','attemptsUsed','attemptsRemaining','reveal','edits','clears','score'])assert.deepEqual(after.model[k],initial.model[k]);}
