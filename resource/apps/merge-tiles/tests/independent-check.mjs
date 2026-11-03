import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {advance,planVisible,directions,slide} from './reference.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function replay(s,route){for(const d of route){const expected=advance(s,directions[d]);assert.ok(expected);const sum=s.cells.reduce((a,b)=>a+b,0);press(s,directions[d]);for(const field of ['cells','movesUsed','points','spawnIndex','nextSpawnValue','lastSpawn','phase','reason'])assert.deepEqual(s[field],expected[field],field);assert.equal(s.cells.reduce((a,b)=>a+b,0),sum+(s.lastSpawn?.value||0));}}
const edge=slide([2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],directions[3]);assert.deepEqual(edge.cells.slice(0,4),[4,4,0,0]);
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(766,level),plan=planVisible(s);replay(s,plan.route);assert.equal(s.phase,'won');assert.ok(s.movesUsed>=11);assert.equal(s.lastSpawn,null);const terminal=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),terminal);
 const loss=model.create(766,level),failure=planVisible(loss,{lose:true});replay(loss,failure.route);assert.equal(loss.phase,'lost');
 results.push({level,ordinaryWinMoves:s.movesUsed,winSearchExpansions:plan.expanded,ordinaryLossMoves:loss.movesUsed,lossReason:loss.reason,independentSpawnAndMergeEquality:true,massConservation:true});
}
const budget=model.create(766,0),budgetPlan=planVisible(budget,{lose:true,lossReason:'moves'});replay(budget,budgetPlan.route);assert.equal(budget.reason,'moves');assert.equal(budget.movesUsed,budget.moveLimit);
const undo=model.create(766,0),initial=structuredClone(undo);press(undo,directions[3]);const first=structuredClone(undo);press(undo,{a:true});for(const k of ['cells','points','spawnIndex','lastSpawn','lastMerges'])assert.deepEqual(undo[k],initial[k]);assert.equal(undo.movesUsed,1);assert.equal(undo.undoTickets,1);press(undo,directions[3]);for(const k of ['cells','points','spawnIndex','lastSpawn','lastMerges'])assert.deepEqual(undo[k],first[k]);assert.equal(undo.movesUsed,2);
console.log(JSON.stringify({passed:true,method:'Independent line merges/public deterministic spawn and bounded beam planning; ordinary inputs compared move-by-move, including natural losses. No production transition helpers.',layouts:results,budgetLoss:{moves:budget.movesUsed,reason:budget.reason,searchExpansions:budgetPlan.expanded},undo:{ordinaryReplayExact:true,moveBudgetNotRefunded:true}},null,2));
