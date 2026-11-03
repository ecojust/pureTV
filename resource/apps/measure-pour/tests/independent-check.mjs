// Independent public-rule arithmetic and BFS, executed through ordinary model inputs.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url),M=require('../src/main/assets/game-model.js');
const output=path.resolve(process.argv[2]||'/tmp/measure-pour-independent');mkdirSync(output,{recursive:true});
const expected=[
 {capacities:[8,5,3],initial:[8,0,0],target:[4,4,0],pourLimit:9,minimum:7},
 {capacities:[10,7,3],initial:[10,0,0],target:[5,5,0],pourLimit:11,minimum:9},
 {capacities:[12,7,5],initial:[12,0,0],target:[6,1,5],pourLimit:13,minimum:11}
];
const report={scope:'Independent BFS and public arithmetic; complete normal model-input replays, not browser/hardware execution.',modelSha256:createHash('sha256').update(readFileSync(new URL('../src/main/assets/game-model.js',import.meta.url))).digest('hex'),tests:[],runs:[],ordinaryPoursChecked:0};
function bfs(c){
 const q=[{v:c.initial.slice(),route:[]}],seen=new Set([c.initial.join(',')]);let answer=null;
 for(let k=0;k<q.length;k++){
  const n=q[k];if(n.v.every((v,i)=>v===c.target[i])){answer??=n.route;continue;}
  if(n.route.length>=c.pourLimit)continue;
  for(let from=0;from<3;from++)for(let to=0;to<3;to++)if(from!==to){
   const amount=Math.min(n.v[from],c.capacities[to]-n.v[to]);if(!amount)continue;
   const v=n.v.slice();v[from]-=amount;v[to]+=amount;const key=v.join(',');
   if(!seen.has(key)){seen.add(key);q.push({v,route:[...n.route,{from,to}]});}
  }
 }
 assert.ok(answer);return {answer,nodes:q};
}
function fresh(level){const s=M.create(750,level);M.step(s,1/60,{});return s;}
function tap(s,input){M.step(s,1/60,{});M.step(s,1/60,input);}
function select(s,jug){for(let i=0;s.selected!==jug&&i<3;i++)tap(s,{x:1});assert.equal(s.selected,jug);}
function pour(s,from,to){
 assert.equal(s.phase,'playing');select(s,from);tap(s,{a:true});
 if(s.volumes[from]===0){assert.equal(s.source,null);assert.equal(s.events[0].reason,'empty-source');return;}
 assert.equal(s.source,from);select(s,to);const before=structuredClone(s),c=expected[s.level];tap(s,{a:true});
 const amount=from===to?0:Math.min(before.volumes[from],c.capacities[to]-before.volumes[to]);
 if(!amount){assert.deepEqual(s.volumes,before.volumes);assert.equal(s.source,from);assert.equal(s.poursUsed,before.poursUsed);assert.equal(s.events[0].type,'blocked');tap(s,{b:true});return;}
 const target=before.volumes.slice();target[from]-=amount;target[to]+=amount;
 assert.deepEqual(s.volumes,target);assert.equal(s.poursUsed,before.poursUsed+1);assert.equal(s.source,null);assert.equal(s.selected,to);
 assert.equal(s.volumes.reduce((a,b)=>a+b,0),c.initial.reduce((a,b)=>a+b,0));
 assert.ok(s.volumes.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=c.capacities[i]));
 const win=target.every((v,i)=>v===c.target[i]),phase=win?'won':s.poursUsed===c.pourLimit?'lost':'playing';assert.equal(s.phase,phase);assert.equal(s.score,win?100:0);
 const r=s.pourReceipts.at(-1);assert.deepEqual(r.before,before.volumes);assert.deepEqual(r.after,target);assert.equal(r.from,from);assert.equal(r.to,to);assert.equal(r.amount,amount);assert.equal(r.outcome,phase);assert.notEqual(r.after,s.volumes);report.ordinaryPoursChecked++;
}
function replay(level,route){const s=fresh(level);for(const {from,to} of route)pour(s,from,to);return s;}
function terminalFrozen(s){const frozen=structuredClone(s);for(const input of [{a:true},{b:true},{x:1},{cancelled:true,cancelEpoch:88}])M.step(s,.2,input);assert.deepEqual(s,frozen);}
function test(name,fn){fn();report.tests.push({name,passed:true});}
try{
 test('three public layouts match contract',()=>expected.forEach((e,i)=>{for(const k of ['capacities','initial','target','pourLimit'])assert.deepEqual(M.config.layouts[i][k],e[k]);}));
 for(let level=0;level<3;level++){
  const c=expected[level],graph=bfs(c);assert.equal(graph.answer.length,c.minimum);
  test(`level ${level+1}: independent minimum route and successful final state`,()=>{const s=replay(level,graph.answer);assert.equal(s.phase,'won');terminalFrozen(s);report.runs.push({level,kind:'minimum-win',route:graph.answer,pours:s.poursUsed,final:s});});
  test(`level ${level+1}: winning on exact final allowance has priority`,()=>{const route=[{from:0,to:1},{from:1,to:0},...graph.answer],s=replay(level,route);assert.equal(s.poursUsed,c.pourLimit);assert.equal(s.phase,'won');terminalFrozen(s);report.runs.push({level,kind:'last-pour-win',route,pours:s.poursUsed,final:s});});
  test(`level ${level+1}: natural finite-budget loss`,()=>{const route=Array.from({length:c.pourLimit},(_,i)=>({from:i%2,to:1-i%2})),s=replay(level,route);assert.equal(s.phase,'lost');assert.equal(s.reason,'pours');terminalFrozen(s);report.runs.push({level,kind:'exhaustion',route,pours:s.poursUsed,final:s});});
  test(`level ${level+1}: maximal-pour arithmetic across independently reachable states`,()=>{
   let transitions=0;for(const n of graph.nodes){if(n.route.length>=c.pourLimit||n.v.every((v,i)=>v===c.target[i]))continue;
    for(let from=0;from<3;from++)for(let to=0;to<3;to++){const s=replay(level,n.route);assert.deepEqual(s.volumes,n.v);pour(s,from,to);transitions++;}}
   report.runs.push({level,kind:'reachable-state-edges',states:graph.nodes.length,transitions,minimumPours:graph.answer.length});
  });
 }
 test('free cancel preserves water and allowance; holding A never repeats',()=>{const s=fresh(0);tap(s,{a:true});const calls=s.calls;for(let i=0;i<20;i++)M.step(s,1/60,{a:true});assert.equal(s.calls,calls+20);assert.equal(s.source,0);assert.equal(s.blockedActions,0);tap(s,{b:true});assert.equal(s.source,null);assert.equal(s.poursUsed,0);assert.deepEqual(s.volumes,expected[0].initial);});
 test('cancel epoch requires later neutral and fresh edge',()=>{const s=fresh(0);M.step(s,.1,{cancelEpoch:1});tap(s,{a:true});assert.equal(s.source,0);M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.inputArmed,false);M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.blockedActions,0);M.step(s,.1,{cancelEpoch:2});assert.equal(s.inputArmed,true);M.step(s,.1,{b:true,cancelEpoch:2});assert.equal(s.source,null);assert.equal(s.poursUsed,0);});
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,tests:report.tests.length,ordinaryPoursChecked:report.ordinaryPoursChecked,output,failure:report.failure}));
