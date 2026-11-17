import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {advance,solveVisible,winning} from './reference.mjs';
let ordinaryPresses=0;
function press(s,input){ordinaryPresses++;model.step(s,1/60,{});model.step(s,1/60,input);}
function remove(s,pile,amount){while(s.selected!==pile)press(s,{x:1});while(s.amount!==amount)press(s,{y:s.amount<amount?-1:1});const expected=advance(s,pile,amount),before=s.remaining;press(s,{a:true});for(const k of ['piles','remaining','totalMoves','phase','reason','lastPlayerMove','lastAiMove','lastRound'])assert.deepEqual(s[k],expected[k],k);assert.ok(s.remaining<before);assert.equal(s.remaining+s.playerRemoved+s.aiRemoved,s.initialTotal);return expected;}
function replay(s,route){for(const t of route)remove(s,t.pile,t.amount);}
const layouts=[];
for(let level=0;level<3;level++){
 const initial=model.create(776,level),s=model.create(776,level),plan=solveVisible(initial);assert.equal(winning(initial.piles,initial.misere),true);replay(s,plan.route);assert.equal(s.phase,'won');assert.equal(s.remaining,0);assert.ok(s.playerMoves>=3);const frozen=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),frozen);
 const lost=model.create(776,level),failure=solveVisible(lost,{lose:true});replay(lost,failure.route);assert.equal(lost.phase,'lost');
 // Every reachable ordinary human-turn position and outgoing move, replayed from create.
 const queue=[{state:initial,route:[]}],seen=new Set([initial.piles.join(',')]);let edges=0,allOnesEdges=0;
 for(let at=0;at<queue.length;at++){const n=queue[at];for(let pile=0;pile<n.state.piles.length;pile++)for(let amount=1;amount<=n.state.piles[pile];amount++){
  const actual=model.create(776,level);replay(actual,n.route);const expected=remove(actual,pile,amount);edges++;if(n.state.piles.every(v=>v<=1))allOnesEdges++;
  if(expected.phase==='playing'){const key=expected.piles.join(',');if(!seen.has(key)){seen.add(key);queue.push({state:expected,route:[...n.route,{pile,amount}]});}}
 }}
 layouts.push({level,misere:s.misere,minimumHumanMoves:plan.route.length,winReason:s.reason,ordinaryLossHumanMoves:lost.playerMoves,lossReason:lost.reason,reachableHumanPositions:seen.size,independentlyComparedEdges:edges,allOnesEdges});
}
console.log(JSON.stringify({passed:true,method:'Recursive finite game outcomes without XOR; independent deterministic optimal opponent and shortest-route BFS. Every reachable human-turn outgoing edge is replayed from create with normal directions/A, comparing receipts and conservation.',layouts,ordinaryPresses},null,2));
