import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible,runs} from './automation.mjs';
function press(s,input,dt=1/60){model.step(s,1/60,{});model.step(s,dt,input);}
function cursor(s,to){while(s.cursor%s.size!==to%s.size)press(s,{x:s.cursor%s.size<to%s.size?1:-1});while(Math.floor(s.cursor/s.size)!==Math.floor(to/s.size))press(s,{y:s.cursor<to?1:-1});}
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(758,level),solved=solveVisible(s);assert.equal(solved.solutions,1);
 for(let i=0;i<s.cells.length;i++){if(!solved.solution[i])continue;cursor(s,i);press(s,{a:true});}
 assert.equal(s.phase,'won');assert.equal(s.score,100);assert.ok(s.remaining>0);
 for(let r=0;r<s.size;r++)assert.deepEqual(runs(s.cells.slice(r*s.size,(r+1)*s.size).map(v=>v===1)),s.rowClues[r]);
 for(let c=0;c<s.size;c++)assert.deepEqual(runs(Array.from({length:s.size},(_,r)=>s.cells[r*s.size+c]===1)),s.colClues[c]);
 const frozen=JSON.stringify(s);press(s,{b:true});assert.equal(JSON.stringify(s),frozen);
 const idle=model.create(758,level);for(let i=0;i<idle.timeLimit*4;i++)model.step(idle,.25,{});assert.equal(idle.phase,'lost');assert.equal(idle.reason,'timeout');assert.equal(idle.elapsed,idle.timeLimit);
 results.push({level,uniqueSolutions:solved.solutions,searchNodes:solved.visited,ordinaryMarks:s.marks,phase:s.phase,clueEquality:true,crossesOptional:true,ordinaryIdleTimeout:true});
}
console.log(JSON.stringify({passed:true,method:'Independent complete line-pattern enumeration with row/column compatibility; only clues supplied to solver, ordinary input replay and ordinary elapsed-time timeout.',layouts:results},null,2));
