import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible,validate,navigation} from './reference.mjs';
let ordinaryPresses=0;
function press(s,input){ordinaryPresses++;model.step(s,1/60,{});model.step(s,1/60,input);}
function go(s,to){for(const d of navigation(s,s.cursor,to)){press(s,d);assert.equal(s.cursor,d.cell);}}
function enter(s,target){for(const cell of s.whiteCells){go(s,cell);if(Object.hasOwn(s.givens,cell)){assert.equal(s.cells[cell],target[cell]);continue;}while(s.cells[cell]!==target[cell])press(s,{a:true});assert.deepEqual(s.runStatus,validate(s));}}
const layouts=[];for(let level=0;level<3;level++){
 const s=model.create(782,level),proof=solveVisible(s),black=s.cells.flatMap((v,i)=>v===-1?[i]:[]);for(const c of s.whiteCells)assert.equal(s.runs.filter(r=>r.cells.includes(c)).length,2);press(s,{b:true});assert.equal(s.checks,0);assert.equal(s.mistakes,0);
 enter(s,proof.solution);assert.equal(s.phase,'playing');assert.equal(s.checks,0);assert.ok(validate(s).every(r=>r.matched));press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.checks,1);assert.ok(black.every(i=>s.cells[i]===-1));const frozen=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),frozen);
 const bad=model.create(782,level),wrong=bad.cells.map((v,i)=>v===-1?-1:Object.hasOwn(bad.givens,i)?bad.givens[i]:1);enter(bad,wrong);assert.ok(validate(bad).some(r=>!r.matched));for(let n=1;n<=3;n++){press(bad,{b:true});assert.equal(bad.mistakes,n);assert.equal(bad.checks,n);}assert.equal(bad.phase,'lost');assert.equal(bad.reason,'mistakes');
 const third=model.create(782,level);enter(third,wrong);press(third,{b:true});press(third,{b:true});enter(third,proof.solution);assert.equal(third.lastCheck,null);assert.equal(third.phase,'playing');press(third,{b:true});assert.equal(third.phase,'won');assert.equal(third.checks,3);assert.equal(third.mistakes,2);
 layouts.push({level,uniqueSolutions:proof.solutions,searchNodes:proof.nodes,runPermutationCounts:proof.initialPermutations,whiteCells:s.whiteCells.length,ordinarySolutionEdits:s.edits,normalExplicitSubmitWin:true,naturalThreeErrorLoss:true,ordinaryThirdCheckWin:true,blackCellsPreserved:true});
}
console.log(JSON.stringify({passed:true,method:'Independent distinct-digit sum permutations, fixed-point intersection and complete uniqueness branch search from clues/givens only; ordinary cycle/navigation/B replay compares all public run statuses, wins, third-check wins and natural losses.',layouts,ordinaryPresses},null,2));
