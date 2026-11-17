// Public board and documented AI policy only. Solver remains outside APK assets.
import {explore,flatten,turn,winning} from './reference.mjs';
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function observe(s){need(s.board.length===6&&s.board.every(r=>r.length===7&&r.every(v=>v===0||v===1||v===2)),'Board geometry');need(s.turnReceipts.length===s.playerDrops&&s.aiDrops<=s.playerDrops&&s.playerDrops<=7,'Bounded receipts');for(let c=0;c<7;c++){let filled=false;for(let r=0;r<6;r++){if(s.board[r][c])filled=true;else need(!filled,'No floating tokens');}}if(s.phase==='won')need(winning(flatten(s.board),1).length>0&&s.lastAI===null,'Human win stops AI response');}
export function createPilot({outcome='win'}={}){
 let id=null,lastCalls=-1,pending=null,route=[],index=0,actions=[];
 const pilot=q=>{const s=q?.model;if(!s||q.paused)return [];observe(s);const identity=`${s.seed}:${s.level}`;
  if(identity!==id||s.calls<lastCalls){id=identity;pending=null;route=explore(s.level)[outcome];need(route,'Public board has requested route');index=0;actions=[];}lastCalls=s.calls;
  if(pending){const p=pending,done=p.key==='Space'?s.playerDrops===p.turn+1:s.column!==p.column;if(!done){need(s.phase==='playing'&&s.calls-p.call<150,'Input acknowledgement');return [p.key];}if(p.key==='Space'){const e=p.expected;need(JSON.stringify(flatten(s.board))===JSON.stringify(e.board),'Ordinary turn matches independent AI');need(s.phase===e.phase&&s.reason===e.reason,'Terminal order matches reference');index++;}actions.push({key:p.key,call:s.calls,turn:s.playerDrops,column:s.column});pending=null;return [];}
  if(q.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.direction!=='none')return [];
  const col=route[index];need(col!==undefined,'Playable route remains');const key=s.column===col?'Space':s.column<col?'ArrowRight':'ArrowLeft';pending={key,call:s.calls,column:s.column,turn:s.playerDrops,expected:key==='Space'?turn(flatten(s.board),col):null};return [key];
 };pilot.diagnostics=()=>structuredClone({route,index,actions,pending});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}if(meta.mode==='record'&&q.phase==='won'){if(q.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.1)return [];if(menuRelease){menuRelease=false;return [];}menuRelease=true;return [q.level===q.model.level+1?'Enter':'ArrowRight'];}terminalAt=null;menuRelease=false;return pilot(q);}
export function assertProgress({before,after,trace},assert){assert.equal(after.phase,'won');assert.equal(after.model.score,100);assert.equal(after.model.lastAI,null);assert.equal(after.model.playerDrops,after.model.aiDrops+1);assert.ok(after.model.playerDrops>before.model.playerDrops);assert.ok(trace.some(t=>t.state.model.playerDrops>0&&t.state.phase==='playing'));for(const t of trace)observe(t.state.model);assert.deepEqual(after.model.winningCells,winning(flatten(after.model.board),1));}
export function assertRetry({after,initial},assert){for(const k of ['phase','board','column','playerDrops','aiDrops','lastPlayer','lastAI','winningCells','turnReceipts','score'])assert.deepEqual(after.model[k],initial.model[k]);}
