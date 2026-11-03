import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible} from './reference.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function select(s,from){while(s.selected!==from)press(s,{x:1});}
function replay(s,route){let extraTurns=0,maxAiBurst=0,captured=0;
 for(const turn of route){select(s,turn.from);const before=s.sowCount;press(s,{a:true});for(const k of ['pits','sowCount','phase','reason','lastPlayerSow','lastAiSows','aiBurstCount','lastSow'])assert.deepEqual(s[k],turn.expected[k],k);
  assert.equal(s.pits.reduce((a,b)=>a+b,0),24);assert.equal(s.sowCount,before+1+s.lastAiSows.length);maxAiBurst=Math.max(maxAiBurst,s.aiBurstCount);captured+=s.lastPlayerSow.captured;
  for(const receipt of [s.lastPlayerSow,...s.lastAiSows]){assert.equal(receipt.path.length,receipt.seeds);assert.ok(!receipt.path.includes(receipt.side==='player'?13:6));}
  if(s.lastPlayerSow.extraTurn&&s.phase==='playing'){assert.equal(s.lastAiSows.length,0);extraTurns++;}
 }
 return {extraTurns,maxAiBurst,captured};
}
const layouts=[];for(let level=0;level<3;level++){const s=model.create(770,level),p=solveVisible(s),checks=replay(s,p.route);assert.equal(s.phase,'won');assert.ok(s.playerSows>=4);assert.equal(s.playerStore+s.aiStore,24);assert.ok(s.playerStore>s.aiStore);const frozen=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),frozen);
 const loss=model.create(770,level),failure=solveVisible(loss,{lose:true});replay(loss,failure.route);assert.equal(loss.phase,'lost');assert.equal(loss.reason,'minority');layouts.push({level,minimumHumanSows:p.route.length,searchedStates:p.states,totalSows:s.sowCount,finalStores:[s.playerStore,s.aiStore],ordinaryLosingHumanSows:loss.playerSows,...checks});}
console.log(JSON.stringify({passed:true,method:'Independent seed-by-seed sowing, capture, sweep, opponent comparator and full synchronous response; shortest public-position BFS with sow count; ordinary cursor/A replay compares every receipt and resulting compartment counts.',layouts},null,2));
