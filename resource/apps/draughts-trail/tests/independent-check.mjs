import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {solveVisible,pieceSteps,turns} from './reference.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function go(s,to){while(s.cursor!==to){const x=s.cursor%6,y=Math.floor(s.cursor/6),tx=to%6,ty=Math.floor(to/6);press(s,x!==tx?{x:x<tx?1:-1}:{y:y<ty?1:-1});}}
function replay(s,route){let chainLocks=0,promotions=0;
 for(const turn of route){const pieceCount=s.board.filter(Boolean).length,forced=s.board.flatMap((v,i)=>v>0&&pieceSteps(s.board,i,true).length?[i]:[]);assert.deepEqual(s.forcedPieces,forced);
  if(forced.length){const forbidden=s.board.findIndex((v,i)=>v>0&&!forced.includes(i));if(forbidden>=0){go(s,forbidden);const blocked=s.blockedActions;press(s,{a:true});assert.equal(s.blockedActions,blocked+1);assert.equal(s.selected,null);}}
  go(s,turn.path[0]);press(s,{a:true});assert.equal(s.selected,turn.path[0]);
  for(let j=1;j<turn.path.length;j++){go(s,turn.path[j]);press(s,{a:true});if(j<turn.path.length-1){assert.equal(s.chainActive,true);const b=structuredClone(s.board),selected=s.selected,blocked=s.blockedActions;press(s,{b:true});assert.deepEqual(s.board,b);assert.equal(s.selected,selected);assert.equal(s.blockedActions,blocked+1);chainLocks++;}}
  for(const k of ['board','halfTurns','phase','reason'])assert.deepEqual(s[k],turn.expected[k],k);assert.deepEqual(s.lastPlayerTurn.path,turn.path);assert.deepEqual(s.lastPlayerTurn.captured,turn.player.captured);assert.equal(s.lastPlayerTurn.promoted,turn.player.promoted);if(turn.player.promoted)promotions++;
  if(turn.expected.ai){assert.deepEqual(s.lastAiTurn.path,turn.expected.ai.path);assert.deepEqual(s.lastAiTurn.captured,turn.expected.ai.captured);assert.equal(s.lastAiTurn.promoted,turn.expected.ai.promoted);}
  assert.equal(s.board.filter(Boolean).length,pieceCount-turn.player.captured.length-(turn.expected.ai?.captured.length||0));
 }
 return {chainLocks,promotions};
}
const layouts=[];for(let level=0;level<3;level++){const s=model.create(768,level),p=solveVisible(s),checks=replay(s,p.route);assert.equal(s.phase,'won');assert.ok(s.playerTurns>=3);assert.ok(s.playerCaptures>0);assert.equal(s.aiPieces,0);const frozen=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),frozen);layouts.push({level,minimumHumanTurns:p.route.length,searchedStates:p.states,playerCaptures:s.playerCaptures,aiCaptures:s.aiCaptures,halfTurns:s.halfTurns,...checks});}
const loss=model.create(768,0),failure=solveVisible(loss,{lose:true});replay(loss,failure.route);assert.equal(loss.phase,'lost');
console.log(JSON.stringify({passed:true,method:'Independent full-turn enumeration, mandatory capture, promotion termination and public deterministic AI; shortest public-position BFS; ordinary cursor/A/B replay compares complete boards and receipts after every opponent turn.',layouts,naturalLoss:{humanTurns:loss.playerTurns,reason:loss.reason,searchedStates:failure.states}},null,2));
