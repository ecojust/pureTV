import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {layouts,conflicts,solutions,nextCursorKey} from './puzzle-tools.mjs';
const M=createRequire(import.meta.url)('../src/main/assets/game-model.js'),output=path.resolve(process.argv[2]||'/tmp/queen-constellation-independent');mkdirSync(output,{recursive:true});
const report={scope:'Independent public-clue DFS and attack arithmetic replayed via ordinary model input. No state mutation, browser or hardware claims.',modelSha256:createHash('sha256').update(readFileSync(new URL('../src/main/assets/game-model.js',import.meta.url))).digest('hex'),tests:[],runs:[],ordinaryChecks:0};
const input={ArrowLeft:{x:-1},ArrowRight:{x:1},ArrowUp:{y:-1},ArrowDown:{y:1},Space:{a:true},b:{b:true}};
function invariant(s){const l=layouts[s.level],count=s.queens.filter(Boolean).length;assert.equal(s.queenCount,count);assert.equal(s.movableCount,count-l.fixed.length);assert.deepEqual(s.conflicts,conflicts(s.queens,l.size));assert.ok(l.fixed.every(i=>s.queens[i]));assert.ok(l.blocked.every(i=>!s.queens[i]));assert.equal(s.canSubmit,count===l.size&&s.conflicts.length===0);assert.equal(s.submissions,3-s.checksRemaining);}
function fresh(level){const s=M.create(757,level);M.step(s,1/60,{});invariant(s);return s;}
function tap(s,key){M.step(s,1/60,{});M.step(s,1/60,input[key]);invariant(s);}
function cursor(s,to){for(let i=0;i<20&&s.cursor!==to;i++)tap(s,nextCursorKey(s.cursor,to,layouts[s.level].size));assert.equal(s.cursor,to);}
function place(s,id){cursor(s,id);const before=structuredClone(s);tap(s,'Space');assert.equal(s.queens[id],!before.queens[id]);assert.equal(s.checksRemaining,before.checksRemaining);}
function submit(s){const before=structuredClone(s),valid=before.canSubmit;tap(s,'b');assert.equal(s.checksRemaining,before.checksRemaining-1);assert.deepEqual(s.queens,before.queens);assert.equal(s.phase,valid?'won':s.checksRemaining===0?'lost':'playing');const r=s.checkReceipts.at(-1);assert.deepEqual(r.queens,s.queens);assert.deepEqual(r.conflicts,conflicts(s.queens,layouts[s.level].size));assert.equal(r.matched,valid);assert.equal(r.checksBefore,before.checksRemaining);assert.notEqual(r.queens,s.queens);report.ordinaryChecks++;}
function freeze(s){const terminal=structuredClone(s);for(const i of [{a:true},{b:true},{x:1},{cancelEpoch:4,cancelled:true}])M.step(s,.2,i);assert.deepEqual(s,terminal);}
function arrange(s,ids){for(const id of ids)if(!layouts[s.level].fixed.includes(id))place(s,id);assert.equal(s.phase,'playing');assert.equal(s.canSubmit,true);}
function test(name,fn){fn();report.tests.push({name,passed:true});}
try{
 test('fixed public clues match contract',()=>layouts.forEach((l,i)=>{for(const k of ['size','blocked','fixed'])assert.deepEqual(M.config.layouts[i][k],l[k]);}));
 for(let level=0;level<3;level++){
  const l=layouts[level],plan=solutions(l);assert.equal(plan.solutions.length,[4,2,1][level]);
  test(`level ${level+1}: every independently found solution requires and passes explicit submission`,()=>{for(const ids of plan.solutions){const s=fresh(level);arrange(s,ids);assert.equal(s.score,0);assert.equal(s.submissions,0);submit(s);assert.equal(s.phase,'won');assert.equal(s.score,100);freeze(s);}report.runs.push({level,kind:'all-solutions',solutions:plan.solutions,visited:plan.visited});});
  test(`level ${level+1}: two rejected checks then valid last check wins`,()=>{const s=fresh(level);submit(s);submit(s);assert.equal(s.phase,'playing');arrange(s,plan.solutions[0]);assert.equal(s.checksRemaining,1);submit(s);assert.equal(s.phase,'won');assert.equal(s.checksRemaining,0);freeze(s);report.runs.push({level,kind:'last-check-win',final:s});});
  test(`level ${level+1}: natural third-invalid-check loss`,()=>{const s=fresh(level);for(let i=0;i<3;i++)submit(s);assert.equal(s.phase,'lost');assert.equal(s.reason,'checks');freeze(s);report.runs.push({level,kind:'checks-exhausted',final:s});});
  test(`level ${level+1}: blocked/fixed protections, queen cap and reversible repair`,()=>{
   const s=fresh(level);for(const id of [...l.blocked,...l.fixed]){cursor(s,id);const before=s.queens.slice();tap(s,'Space');assert.deepEqual(s.queens,before);assert.equal(s.checksRemaining,3);}
   const free=Array.from({length:l.size*l.size},(_,i)=>i).filter(i=>!l.blocked.includes(i)&&!l.fixed.includes(i));for(const id of free.slice(0,l.size-l.fixed.length))place(s,id);
   assert.equal(s.queenCount,l.size);const extra=free[l.size-l.fixed.length];cursor(s,extra);const before=s.queens.slice();tap(s,'Space');assert.deepEqual(s.queens,before);assert.equal(s.events[0].reason,'queen-limit');
   place(s,free[0]);place(s,extra);assert.equal(s.queenCount,l.size);assert.equal(s.checksRemaining,3);
  });
 }
 test('all row/column/diagonal attack kinds update and removal repairs them',()=>{const s=fresh(0);for(const id of [1,2,7,8])place(s,id);assert.deepEqual(new Set(s.conflicts.map(x=>x.kind)),new Set(['row','column','diagonal']));place(s,8);assert.deepEqual(s.conflicts,conflicts(s.queens,6));assert.equal(s.checksRemaining,3);});
 test('held placement does not repeat and cancellation requires a fresh edge',()=>{const s=fresh(0);cursor(s,1);tap(s,'Space');for(let i=0;i<20;i++)M.step(s,.1,{a:true});assert.equal(s.queenCount,1);assert.equal(s.placements,1);assert.equal(s.removals,0);M.step(s,.1,{cancelEpoch:1});M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.inputArmed,false);M.step(s,.1,{cancelEpoch:2});M.step(s,.1,{a:true,cancelEpoch:2});assert.equal(s.queenCount,0);assert.equal(s.removals,1);});
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,tests:report.tests.length,ordinaryChecks:report.ordinaryChecks,failure:report.failure}));
