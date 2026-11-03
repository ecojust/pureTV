'use strict';
// Independent QA rules. This module is outside APK assets and imports no game model.
const assert = require('node:assert/strict');
const SIDE = 6;
function flips(board, cell, side) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 36 || board[cell] !== 0) return [];
  const found = [], row = Math.floor(cell / SIDE), col = cell % SIDE, other = 3-side;
  for (const dr of [-1,0,1]) for (const dc of [-1,0,1]) {
    if (!dr && !dc) continue;
    const ray=[]; let r=row+dr,c=col+dc;
    while (r>=0&&r<SIDE&&c>=0&&c<SIDE&&board[r*SIDE+c]===other) {ray.push(r*SIDE+c);r+=dr;c+=dc;}
    if (ray.length&&r>=0&&r<SIDE&&c>=0&&c<SIDE&&board[r*SIDE+c]===side) found.push(...ray);
  }
  return found;
}
function legal(board, side) { return board.flatMap((v,cell)=>{const f=flips(board,cell,side);return f.length?[{cell,flipped:f}]:[];}); }
function counts(board) { return {player:board.filter(x=>x===1).length,opponent:board.filter(x=>x===2).length,empty:board.filter(x=>x===0).length}; }
function terminal(board) { return !legal(board,1).length&&!legal(board,2).length; }
function place(board, cell, side) { const f=flips(board,cell,side);assert.ok(f.length,'Reference placement must bracket at least one opponent');const result=board.slice();result[cell]=side;for(const i of f) result[i]=side;return result; }
function aiChoice(board) { const options=legal(board,2);options.sort((a,b)=>b.flipped.length-a.flipped.length||a.cell-b.cell);return options[0]||null; }
function round(board, cell) {
  const choices=legal(board,1);let after=board.slice();
  if(cell===null)assert.equal(choices.length,0,'Player pass only when no legal move');else after=place(board,cell,1);
  let ai=null,aiPass=false;
  if(!terminal(after)){ai=aiChoice(after);if(ai)after=place(after,ai.cell,2);else aiPass=true;}
  return {board:after,ai,aiPass,terminal:terminal(after),playerPass:cell===null};
}
function search(board, policy='max', memo=new Map()) {
  const key=board.join('')+policy;
  if(memo.has(key)) return memo.get(key);
  if(terminal(board)){const c=counts(board),r={margin:c.player-c.opponent,cell:null};memo.set(key,r);return r;}
  const cells=legal(board,1).map(x=>x.cell);if(!cells.length)cells.push(null);
  let best=null;
  for(const cell of cells){const next=round(board,cell).board;const value=search(next,policy,memo).margin;
    if(best===null||(policy==='max'?value>best.margin:value<best.margin))best={margin:value,cell};}
  memo.set(key,best);return best;
}
function route(board,policy='max') {
  const memo=new Map(),result=[],start=search(board,policy,memo);let b=board.slice();
  while(!terminal(b)){const action=search(b,policy,memo);const next=round(b,action.cell);result.push({cell:action.cell,ai:next.ai?.cell??null,playerPass:next.playerPass,aiPass:next.aiPass,board:next.board});b=next.board;assert.ok(result.length<=36);}
  return {margin:start.margin,states:memo.size,steps:result};
}
function passRoute(board) {
  const seen=new Set();
  function visit(b,path){const k=b.join('');if(seen.has(k)||terminal(b))return null;seen.add(k);const moves=legal(b,1);
    if(!moves.length) return [...path,null];
    for(const m of moves){const next=round(b,m.cell);const answer=visit(next.board,[...path,m.cell]);if(answer)return answer;}
    return null;
  }
  return {cells:visit(board,[]),searched:seen.size};
}
module.exports={flips,legal,counts,terminal,place,aiChoice,round,search,route,passRoute};
