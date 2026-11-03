import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {positions,jumps,maskOf,legal,apply,count,search,cursorRoute,cursorNext} from './puzzle-tools.mjs';
const M=createRequire(import.meta.url)('../src/main/assets/game-model.js');
const out=path.resolve(process.argv[2]||'/tmp/triangle-pegs-independent');mkdirSync(out,{recursive:true});
const report={scope:'Independent test-only lattice/search and ordinary create/step input replays; no mutated state fixtures or hardware claims.',modelSha256:createHash('sha256').update(readFileSync(new URL('../src/main/assets/game-model.js',import.meta.url))).digest('hex'),tests:[],runs:[],jumpsChecked:0,undosChecked:0};
const inputs={ArrowLeft:{x:-1},ArrowRight:{x:1},ArrowUp:{y:-1},ArrowDown:{y:1},Space:{a:true},b:{b:true}};
function fresh(level){const s=M.create(753,level);M.step(s,1/60,{});return s;}
function tap(s,key){M.step(s,1/60,{});M.step(s,1/60,inputs[key]);}
function cursor(s,to){for(const key of cursorRoute(s.cursor,to)){const want=cursorNext(s.cursor,key);tap(s,key);assert.equal(s.cursor,want);}assert.equal(s.cursor,to);}
const sorted=rows=>rows.map(x=>`${x.from},${x.over},${x.to}`).sort();
function invariant(s){assert.equal(s.pegsRemaining,count(maskOf(s.occupied)));assert.equal(s.pegsRemaining,14-s.jumpsMade+s.undosUsed);assert.equal(s.history.length,14-s.pegsRemaining);assert.equal(s.undoRemaining,3-s.undosUsed);assert.deepEqual(sorted(s.legalJumps),sorted(legal(maskOf(s.occupied))));}
function jump(s,j){
 assert.equal(s.phase,'playing');cursor(s,j.from);tap(s,'Space');assert.equal(s.source,j.from);cursor(s,j.to);const before=structuredClone(s),mask=maskOf(s.occupied);assert.ok(legal(mask).some(x=>x.from===j.from&&x.to===j.to));tap(s,'Space');
 assert.equal(maskOf(s.occupied),apply(mask,j));assert.equal(s.pegsRemaining,before.pegsRemaining-1);assert.equal(s.jumpsMade,before.jumpsMade+1);assert.equal(s.source,null);assert.equal(s.cursor,j.to);assert.deepEqual(s.history.at(-1),j);invariant(s);
 const won=s.pegsRemaining===1,lost=!won&&!legal(maskOf(s.occupied)).length&&s.undoRemaining===0;assert.equal(s.phase,won?'won':lost?'lost':'playing');assert.equal(s.score,won?100:0);report.jumpsChecked++;
}
function undo(s){const previous=structuredClone(s),j=s.history.at(-1),mask=maskOf(s.occupied);assert.ok(j);tap(s,'b');assert.equal(maskOf(s.occupied),apply(mask,j));assert.equal(s.cursor,j.from);assert.equal(s.source,null);assert.equal(s.undoRemaining,previous.undoRemaining-1);assert.equal(s.jumpsMade,previous.jumpsMade);assert.equal(s.undosUsed,previous.undosUsed+1);invariant(s);report.undosChecked++;}
function freeze(s){const terminal=structuredClone(s);for(const input of [{a:true},{b:true},{x:1},{y:1},{cancelled:true,cancelEpoch:11}])M.step(s,.2,input);assert.deepEqual(s,terminal);}
function test(name,fn){fn();report.tests.push({name,passed:true});}
try{
 test('public triangular coordinates and 36 jumps match independent six-axis geometry',()=>{assert.equal(jumps.length,36);assert.deepEqual(sorted(M.config.jumps),sorted(jumps));assert.deepEqual(M.config.layouts.map(x=>x.blank),[0,4,7]);assert.deepEqual(M.config.positions.map(x=>({row:x.row,col:x.col})),positions);});
 for(let level=0;level<3;level++){
  test(`level ${level+1}: independent 13-jump normal-input victory`,()=>{const s=fresh(level),plan=search(maskOf(s.occupied));assert.equal(plan.route.length,13);for(const j of plan.route)jump(s,j);assert.equal(s.phase,'won');assert.equal(s.undoRemaining,3);freeze(s);report.runs.push({level,kind:'win',route:plan.route,visited:plan.visited,final:s});});
  test(`level ${level+1}: recoverable dead end then natural loss after three real undos`,()=>{
   const s=fresh(level),plan=search(maskOf(s.occupied),'dead-end');assert.ok(plan.route.length>0);for(const j of plan.route)jump(s,j);
   assert.equal(s.phase,'playing');assert.equal(s.legalJumps.length,0);assert.ok(s.pegsRemaining>1);const deadMask=maskOf(s.occupied),last=plan.route.at(-1);
   for(let i=0;i<3;i++){undo(s);assert.ok(s.legalJumps.length);jump(s,last);assert.equal(maskOf(s.occupied),deadMask);assert.equal(s.phase,i===2?'lost':'playing');}
   assert.equal(s.reason,'dead-end');assert.equal(s.undoRemaining,0);freeze(s);report.runs.push({level,kind:'recovery-exhaustion',route:plan.route,final:s});
  });
 }
 test('empty source, invalid adjacent landing and free B cancellation preserve board',()=>{const s=fresh(0),mask=maskOf(s.occupied);tap(s,'Space');assert.equal(s.events[0].reason,'empty-source');assert.equal(s.source,null);cursor(s,1);tap(s,'Space');cursor(s,0);tap(s,'Space');assert.equal(s.events[0].reason,'invalid-jump');assert.equal(s.source,1);tap(s,'b');assert.equal(s.source,null);assert.equal(maskOf(s.occupied),mask);assert.equal(s.undoRemaining,3);assert.equal(s.jumpsMade,0);});
 test('no held repeats and cancellation epoch requires real neutral sample',()=>{const s=fresh(0);cursor(s,1);tap(s,'Space');for(let i=0;i<20;i++)M.step(s,.1,{a:true});assert.equal(s.blockedActions,0);assert.equal(s.source,1);M.step(s,.1,{cancelEpoch:1});M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.inputArmed,false);M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.blockedActions,0);M.step(s,.1,{cancelEpoch:2});M.step(s,.1,{b:true,cancelEpoch:2});assert.equal(s.source,null);assert.equal(s.undoRemaining,3);});
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,tests:report.tests.length,jumpsChecked:report.jumpsChecked,undosChecked:report.undosChecked,failure:report.failure}));
