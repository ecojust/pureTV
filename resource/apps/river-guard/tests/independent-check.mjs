import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {crossing,solveVisible} from './reference.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function select(s,i){while(s.selected!==i)press(s,{x:1});}
function cross(s,cargo){const before=s.sides.slice(),used=s.crossingsUsed,expected=crossing(s,cargo);for(const i of cargo){select(s,i);press(s,{a:true});assert.deepEqual(s.sides,before);assert.equal(s.crossingsUsed,used);}press(s,{b:true});for(const k of ['sides','farmer','cargo','crossingsUsed','phase','reason','dangerPairs','bankCounts','deliveredCount','lastCrossing'])assert.deepEqual(s[k],expected[k],k);assert.equal(s.sides.length,s.items.length);assert.equal(s.bankCounts[0]+s.bankCounts[1],s.items.length);if(s.phase!=='lost')for(const [a,b]of s.conflicts)assert.ok(s.sides[a]===s.farmer||s.sides[b]===s.farmer);}
const layouts=[];for(let level=0;level<3;level++){
 const s=model.create(773,level),plan=solveVisible(s);for(const t of plan.route)cross(s,t.cargo);assert.equal(s.phase,'won');assert.equal(s.farmer,1);assert.ok(s.sides.every(b=>b===1));const frozen=JSON.stringify(s);press(s,{b:true});assert.equal(JSON.stringify(s),frozen);
 const danger=model.create(773,level);cross(danger,[]);assert.equal(danger.reason,'danger');assert.deepEqual(danger.dangerPairs,danger.conflicts);
 const budget=model.create(773,level),shuttle=plan.route[0].cargo;while(budget.phase==='playing')cross(budget,shuttle);assert.equal(budget.reason,'crossings');assert.equal(budget.crossingsUsed,budget.crossingLimit);
 layouts.push({level,minimumCrossings:plan.route.length,searchedStates:plan.states,ordinaryWinCrossings:s.crossingsUsed,emptyReturns:plan.route.filter(t=>t.cargo.length===0).length,ordinaryDangerLoss:danger.reason,ordinaryBudgetLoss:budget.crossingsUsed,selectionPreservesBanks:true,independentReceipts:true});
}
console.log(JSON.stringify({passed:true,method:'Independent bank-partition BFS enumerates all available cargo subsets, safety and budget; ordinary A/B/direction replay compares every crossing receipt and derived state. Normal even-budget victory is unreachable by parity, not claimed.',layouts},null,2));
