import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible,expectedMove,directions} from './automation.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function walk(s,d){const expected=expectedMove(s,d);press(s,directions[d]);assert.equal(s.player,expected.player);assert.deepEqual(s.crates,expected.crates);assert.equal(s.pushCount,expected.pushCount);assert.equal(new Set(s.crates).size,s.crates.length);assert.ok(!s.crates.includes(s.player));}
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(752,level),plan=solveVisible(s);assert.equal(plan.pushes,[4,7,9][level]);
 for(const d of plan.route)walk(s,d);
 assert.equal(s.phase,'won');assert.equal(s.pushCount,plan.pushes);assert.equal(s.matched,s.crates.length);
 const terminal=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),terminal);
 const edge=model.create(752,level);let cursor=0;
 while(edge.pushCount===0)walk(edge,plan.route[cursor++]);
 const pushed=structuredClone(edge);press(edge,{a:true});assert.equal(edge.pushCount,1);assert.notDeepEqual(edge.crates,pushed.crates);
 for(let i=0;i<3;i++){walk(edge,plan.route[cursor-1]);press(edge,{a:true});}
 assert.equal(edge.pushCount,4);
 for(const d of plan.route.slice(cursor-1))walk(edge,d);
 assert.equal(edge.phase,'won');assert.equal(edge.pushCount,edge.pushLimit,'An ordinary final-allowance push must win');
 results.push({level,minimumPushes:plan.pushes,searchStates:plan.states,ordinaryDirections:plan.route.length,matched:s.matched,phase:s.phase,undoDoesNotRefund:true,lastAllowedWinPushes:edge.pushCount});
}
console.log(JSON.stringify({passed:true,method:'Independent push-space BFS with free worker reachability and ordinary input replay; actual transitions compared with independent walk/push rules.',layouts:results},null,2));
