import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {rows,windows,initial,drop,winning,legal,flatten,turn,explore,order} from './reference.mjs';
const M=createRequire(import.meta.url)('../src/main/assets/game-model.js'),output=path.resolve(process.argv[2]||'/tmp/four-in-row-independent');mkdirSync(output,{recursive:true});
const report={scope:'Independent 69-window geometry and exact public AI policy; exhaustive reachable human-turn graph replayed using normal create/step inputs, with no state writes.',modelSha256:createHash('sha256').update(readFileSync(new URL('../src/main/assets/game-model.js',import.meta.url))).digest('hex'),tests:[],proofs:[],turnsChecked:0,policyCounts:{}};
function tick(s,input={}){M.step(s,1/60,input);assert.equal(s.turnReceipts.length,s.playerDrops);assert.ok(s.aiDrops<=s.playerDrops);return s;}
function press(s,input){tick(s,input);tick(s);}
function choose(s,col){while(s.column!==col)press(s,{x:col>s.column?1:-1});}
function move(s,col){choose(s,col);press(s,{a:true});}
function fresh(level){const s=M.create(767,level);tick(s);return s;}
function replay(level,path){const s=fresh(level);for(const col of path){assert.equal(s.phase,'playing');move(s,col);}return s;}
function compare(s,result){assert.deepEqual(flatten(s.board),result.board);assert.equal(s.phase,result.phase);assert.equal(s.reason,result.reason);assert.deepEqual(s.lastPlayer,result.player);assert.deepEqual(s.lastAI,result.ai);assert.deepEqual(s.winningCells,result.winningCells);assert.equal(s.score,result.phase==='won'?100:0);assert.deepEqual(s.turnReceipts.at(-1),{turn:s.playerDrops,player:result.player,ai:result.ai,outcome:result.phase,reason:result.reason});if(result.phase!=='playing'){assert.deepEqual(s.terminalReceipt.board,s.board);assert.deepEqual(s.terminalReceipt.winningCells,s.winningCells);const frozen=structuredClone(s);for(const input of [{a:true},{x:1},{cancelled:true,cancelEpoch:8}])tick(s,input);assert.deepEqual(s,frozen);}}
function test(name,fn){fn();report.tests.push({name,passed:true});}
try{
 test('public geometry and AI settings match published rules',()=>{assert.equal(windows.length,69);assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.ai,{depth:3,tieOrder:order,terminalScore:1000000,centerWeight:6,ownWeights:[0,1,6,40],opponentWeights:[0,1,7,45]});rows.forEach((r,l)=>assert.deepEqual(M.config.layouts[l].rows,r));});
 const prefixes=JSON.parse(readFileSync(new URL('./initial-prefixes.json',import.meta.url)));
 for(let level=0;level<3;level++){
  test(`level ${level+1}: declared position is legally reachable without an earlier win`,()=>{let b=Array(42).fill(0);for(let i=0;i<prefixes[level].legalPrefix.length;i++){const d=drop(b,prefixes[level].legalPrefix[i],i%2+1);assert.ok(d);b=d.board;assert.deepEqual(winning(b,1),[]);assert.deepEqual(winning(b,2),[]);}assert.deepEqual(b,initial(level));assert.equal(b.filter(v=>v===0).length,[10,12,14][level]);assert.equal(b.filter(v=>v===1).length,b.filter(v=>v===2).length);assert.deepEqual(flatten(fresh(level).board),b);});
  test(`level ${level+1}: exhaustive independent opponent graph agrees with ordinary model inputs`,()=>{const proof=explore(level);assert.equal(proof.win.length,[4,4,6][level]);assert.ok(proof.loss);for(const edge of proof.edges){const s=replay(level,edge.prefix);move(s,edge.col);compare(s,edge.result);report.turnsChecked++;if(edge.result.policy){const k=edge.result.policy.kind;report.policyCounts[k]=(report.policyCounts[k]||0)+1;}}report.proofs.push({level,states:proof.states,edges:proof.edges.length,shortestWin:proof.win,naturalLoss:proof.loss,naturalDraw:proof.draw});});
  test(`level ${level+1}: full columns and clamped cursor actions do not trigger an AI turn`,()=>{const s=fresh(level),col=s.board[0].findIndex(v=>v!==0);choose(s,col);const board=structuredClone(s.board),before=s.blockedActions;press(s,{a:true});assert.deepEqual(s.board,board);assert.equal(s.playerDrops,0);assert.equal(s.aiDrops,0);assert.equal(s.blockedActions,before+1);choose(s,0);const block=s.blockedActions;press(s,{x:-1});assert.equal(s.column,0);assert.equal(s.blockedActions,block+1);assert.deepEqual(s.board,board);});
 }
 test('held A does not repeat; cancellation and physical release gate the next turn',()=>{const s=fresh(0);choose(s,5);tick(s,{a:true});assert.equal(s.playerDrops,1);for(let i=0;i<12;i++)tick(s,{a:true});assert.equal(s.playerDrops,1);tick(s,{cancelEpoch:1});tick(s,{a:true,cancelEpoch:2});assert.equal(s.inputArmed,false);assert.equal(s.playerDrops,1);tick(s,{a:true,cancelEpoch:2});assert.equal(s.playerDrops,1);tick(s,{cancelEpoch:2});choose(s,3);press(s,{a:true});assert.equal(s.playerDrops,2);const frozen=structuredClone(s);M.step(s,.25,{paused:true});assert.deepEqual(s,frozen);});
 test('simultaneous A and direction drops in current column; unused B does not override',()=>{const s=fresh(0);choose(s,5);const expected=turn(flatten(s.board),5);tick(s,{a:true,b:true,x:-1});compare(s,expected);assert.equal(s.column,5);});
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,tests:report.tests.length,turnsChecked:report.turnsChecked,policyCounts:report.policyCounts,proofs:report.proofs,failure:report.failure}));
