import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible,legalTransfer} from './automation.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function select(s,to){for(let i=0;s.selected!==to&&i<3;i++)press(s,{x:1});assert.equal(s.selected,to);}
function transfer(s,from,to){const expected=legalTransfer(s.pegs,from,to);select(s,from);const before=JSON.stringify(s.pegs);press(s,{a:true});assert.equal(s.source,from);assert.equal(JSON.stringify(s.pegs),before);select(s,to);press(s,{a:true});assert.deepEqual(s.pegs,expected.pegs);assert.equal(s.source,null);assert.deepEqual(s.pegs.flat().sort((a,b)=>a-b),Array.from({length:s.diskCount},(_,i)=>i+1));assert.ok(s.pegs.every(p=>p.every((d,i)=>i===0||p[i-1]>d)));}
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(755,level),plan=solveVisible(s);assert.equal(plan.route.length,[7,15,31][level]);for(const a of plan.route)transfer(s,a.from,a.to);assert.equal(s.phase,'won');
 const frozen=JSON.stringify(s);press(s,{b:true});assert.equal(JSON.stringify(s),frozen);
 const edge=model.create(755,level);for(let i=0;i<[2,3,4][level];i++){transfer(edge,0,1);transfer(edge,1,0);}for(const a of plan.route)transfer(edge,a.from,a.to);
 assert.equal(edge.phase,'won');assert.equal(edge.movesUsed,edge.moveLimit);
 results.push({level,minimumTransfers:plan.route.length,searchStates:plan.states,phase:s.phase,ringConservation:true,sourceDoesNotRemoveRing:true,lastAllowedWinTransfers:edge.movesUsed});
}
console.log(JSON.stringify({passed:true,method:'Independent BFS over legal ring assignments; ordinary input replay checks conservation and top-ring ordering, including exact-budget wins.',layouts:results},null,2));
