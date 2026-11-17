// Independent complete-turn public-board search; keyboard input only.
import {solveVisible} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function createPilot(options={}){
 let level=null,lastCalls=-1,route=[],step=1,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];step=1;pending=null;log=[];}lastCalls=s.calls;
  if(pending){const changed=pending.kind==='cursor'?s.cursor!==pending.cursor:pending.kind==='select'?s.selected!==pending.selected:JSON.stringify(s.board)!==pending.board;
   if(!changed){need(s.calls-pending.call<120,'Normal draughts command was not acknowledged');return[pending.key];}
   if(pending.kind==='jump'){
    if(s.halfTurns>pending.halfTurns){const turn=route[0];for(const k of ['board','halfTurns','phase','reason'])need(JSON.stringify(s[k])===JSON.stringify(turn.expected[k]),'Independent round mismatch: '+k);need(JSON.stringify(s.lastPlayerTurn.path)===JSON.stringify(turn.path),'Human path must match normal jumps');if(turn.expected.ai)need(JSON.stringify(s.lastAiTurn.path)===JSON.stringify(turn.expected.ai.path),'Opponent uses documented public tie-break');route.shift();step=1;}
    else{need(s.chainActive&&s.selected===route[0].path[step],'A continuing capture must keep its piece selected');step++;}
   }
   log.push({key:pending.key,kind:pending.kind,call:s.calls,halfTurns:s.halfTurns,cursor:s.cursor,selected:s.selected});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!route.length)route=solveVisible(s,options).route;need(route.length,'A playing position requires a turn');
  const target=s.selected===null?route[0].path[0]:route[0].path[step],x=s.cursor%6,y=Math.floor(s.cursor/6),tx=target%6,ty=Math.floor(target/6);let key,kind;
  if(x!==tx){key=x<tx?'ArrowRight':'ArrowLeft';kind='cursor';}else if(y!==ty){key=y<ty?'ArrowDown':'ArrowUp';kind='cursor';}else{key='Space';kind=s.selected===null?'select':'jump';}
  pending={key,kind,call:s.calls,cursor:s.cursor,selected:s.selected,board:JSON.stringify(s.board),halfTurns:s.halfTurns};return[key];
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.ok(s.reason.startsWith('opponent-'));assert.ok(s.playerTurns>=3);assert.ok(s.playerCaptures>0);assert.equal(s.selected,null);assert.equal(s.chainActive,false);assert.ok(trace.some(t=>t.state.model.playerTurns>before.model.playerTurns));}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','board','cursor','selected','chainActive','halfTurns','playerTurns','aiTurns','playerCaptures','aiCaptures','pendingPath','pendingCaptured','lastPlayerTurn','lastAiTurn','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
