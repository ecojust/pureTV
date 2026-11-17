import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {flood,solveVisible} from './automation.mjs';
const results=[];
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function select(s,color){for(let i=0;s.selected!==color&&i<4;i++)press(s,{x:1});assert.equal(s.selected,color);}
for(let level=0;level<3;level++){
 const s=model.create(749,level),plan=solveVisible(s);assert.equal(plan.route.length,[4,6,7][level]);
 const initial=Array(s.cells.length).fill(false);initial[0]=true;
 assert.deepEqual(s.owned,flood(s.cells,initial,s.width,s.height,s.cells[0]),'Initial territory is exactly the corner component');
 for(const color of plan.route){const expected=flood(s.cells,s.owned,s.width,s.height,color);select(s,color);press(s,{a:true});assert.deepEqual(s.owned,expected);assert.equal(s.ownedCount,expected.filter(Boolean).length);assert.ok(s.cells.every((c,i)=>!s.owned[i]||c===color));}
 assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.movesUsed,plan.route.length);
 const terminal=JSON.stringify(s);press(s,{b:true});assert.equal(JSON.stringify(s),terminal);
 const edge=model.create(749,level),initialCells=edge.cells.slice(),initialOwned=edge.owned.slice();
 for(let waste=0;waste<2;waste++){select(edge,1);press(edge,{a:true});press(edge,{b:true});assert.deepEqual(edge.cells,initialCells);assert.deepEqual(edge.owned,initialOwned);assert.equal(edge.movesUsed,waste+1);}
 for(const color of plan.route){select(edge,color);press(edge,{a:true});}
 assert.equal(edge.phase,'won');assert.equal(edge.movesUsed,edge.moveLimit,'Last permitted successful paint must win');
 results.push({level,shortestPaints:plan.route.length,searchStates:plan.states,phase:s.phase,owned:s.ownedCount,ordinaryUndoRestores:true,lastAllowedWinMoves:edge.movesUsed});
}
console.log(JSON.stringify({passed:true,method:'Independent four-neighbor flood closure and BFS over visible cells; ordinary create/step input replay; terminal undo freeze.',layouts:results},null,2));
