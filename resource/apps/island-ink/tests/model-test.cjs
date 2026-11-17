'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve}=require('./island-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),proofs=M.config.layouts.map(l=>solve(l,2));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(784,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function go(s,p){for(let guard=0;s.cursor!==p;guard++){assert.ok(guard<12);const x=s.cursor%s.width,tx=p%s.width;press(s,x!==tx?{x:x<tx?1:-1}:{y:s.cursor<p?1:-1});}}
function set(s,p,value){go(s,p);if(Object.hasOwn(s.fixedValues,p)){assert.equal(s.cells[p],value);return;}for(let guard=0;s.cells[p]!==value;guard++){assert.ok(guard<3);press(s,{a:true});}}
function fill(s,cells){cells.forEach((v,p)=>set(s,p,v));}
// Complete synthetic rule counterexamples isolate geometry; ordinary game wins below use create unchanged.
function fixture(width,height,seeds,cells,givenSea=[]){const s=fresh();s.width=width;s.height=height;s.seeds=copy(seeds);s.givenSea=givenSea.slice();s.fixedValues={};for(const c of seeds)s.fixedValues[c.cell]=2;for(const p of givenSea)s.fixedValues[p]=1;s.cells=cells.slice();s.cursor=0;s.editableCount=cells.length-Object.keys(s.fixedValues).length;s.targetIslandCells=seeds.reduce((n,c)=>n+c.size,0);step(s);return s;}
function types(s){return s.lastCheck.errors.map(e=>e.type);}
test('three public seed-only puzzles have exactly one independently enumerated coloring',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(proofs.map(p=>p.solutions.length),[1,1,1]);M.config.layouts.forEach((l,i)=>{assert.equal(l.width,i+4);assert.equal(l.height,i+4);assert.equal(l.givenSea.length,0);assert.ok(l.width*l.height-l.seeds.length>=10);assert.equal('solution'in l,false);assert.equal('answer'in l,false);});
});
test('immutable clues, normalized identities and detached live data',()=>{
 const a=M.create(-1,-1),b=M.create(784,0);assert.equal(a.seed,784);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.seeds[0].size=99;a.cells[0]=2;assert.equal(b.seeds[0].size,1);assert.equal(b.cells[0],0);assert.throws(()=>M.config.layouts[0].seeds[0].size=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);
});
test('all three boards solve through ordinary arrows/A and explicit B without hidden answers',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level);fill(s,p.solutions[0]);assert.equal(s.phase,'playing');assert.equal(s.mistakes,0);assert.equal(s.checks,0);assert.equal(s.filledCount,s.cells.length);assert.equal(s.islandCellCount,s.targetIslandCells);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.equal(s.checks,1);assert.equal(s.lastCheck.valid,true);assert.deepEqual(s.lastCheck.errors,[]);assert.notEqual(s.terminalReceipt.cells,s.cells);assert.notEqual(s.terminalReceipt.lastCheck,s.lastCheck);const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:9});assert.deepEqual(s,before);});
});
test('unseeded island components are invalid even with otherwise connected legal sea',()=>{
 const s=fixture(3,3,[{cell:4,size:1}],[2,1,1,1,2,1,1,1,1]);press(s,{b:true});assert.deepEqual(types(s),['unseeded-island']);assert.deepEqual(s.lastCheck.errors[0].cells,[0]);assert.equal(s.mistakes,1);
});
test('island area includes its numbered cell and must exactly equal that number',()=>{
 const cells=[1,1,1,1,2,1,1,1,1],bad=fixture(3,3,[{cell:4,size:2}],cells);press(bad,{b:true});assert.deepEqual(types(bad),['island-size']);assert.equal(bad.lastCheck.errors[0].actual,1);assert.equal(bad.lastCheck.errors[0].expected,2);
 const good=fixture(3,3,[{cell:4,size:1}],cells);press(good,{b:true});assert.equal(good.phase,'won');
});
test('orthogonal contact merges numbered islands, whereas diagonal island contact is legal',()=>{
 const s=fixture(3,3,[{cell:4,size:1},{cell:5,size:1}],[1,1,1,1,2,2,1,1,1]);press(s,{b:true});assert.deepEqual(types(s),['merged-islands']);assert.deepEqual(s.lastCheck.errors[0].seeds,[4,5]);
 const t=fixture(3,3,[{cell:0,size:1},{cell:4,size:1}],[2,1,1,1,2,1,1,1,1]);press(t,{b:true});assert.equal(t.phase,'won');assert.deepEqual(t.lastCheck.errors,[]);
});
test('sea must connect orthogonally; diagonal contact does not join separate sea components',()=>{
 const s=fixture(3,3,[{cell:4,size:3}],[1,1,1,2,2,2,1,1,1]);press(s,{b:true});assert.deepEqual(types(s),['split-sea']);assert.equal(s.lastCheck.errors[0].components,2);
 const t=fixture(2,2,[{cell:1,size:1},{cell:2,size:1}],[1,2,2,1]);press(t,{b:true});assert.deepEqual(types(t),['split-sea']);assert.equal(t.lastCheck.errors[0].components,2);
});
test('connected sea still fails every2x2 all-sea square, and a missing sea also fails',()=>{
 const s=fixture(3,3,[{cell:0,size:1}],[2,1,1,1,1,1,1,1,1]);press(s,{b:true});assert.ok(types(s).every(t=>t==='sea-square'));assert.deepEqual(s.lastCheck.errors.map(e=>e.cells),[[1,2,4,5],[3,4,6,7],[4,5,7,8]]);assert.equal(s.mistakes,1);
 const t=fixture(3,3,[{cell:4,size:9}],Array(9).fill(2));press(t,{b:true});assert.deepEqual(types(t),['missing-sea']);
});
test('fixed numbered cells and optional public sea cannot be edited; validation rejects overwritten clues',()=>{
 const s=fresh();for(const clue of s.seeds){go(s,clue.cell);press(s,{a:true});assert.equal(s.events[0].reason,'fixed');assert.equal(s.cells[clue.cell],2);}assert.equal(s.edits,0);
 const t=fixture(3,3,[{cell:4,size:1}],[1,1,1,1,2,1,1,1,1],[0]);go(t,0);press(t,{a:true});assert.equal(t.events[0].reason,'fixed');assert.equal(t.cells[0],1);
 t.cells[4]=1;press(t,{b:true});assert.equal(t.lastCheck.errors[0].type,'fixed-cell');assert.equal(t.lastCheck.errors[0].cell,4);assert.equal(t.phase,'playing');
});
test('A cycles undecided/sea/island/undecided; editing and incomplete checks spend no mistakes',()=>{
 const s=fresh(),p=s.cursor;for(const value of [1,2,0]){press(s,{a:true});assert.equal(s.cells[p],value);assert.equal(s.mistakes,0);}assert.equal(s.edits,3);for(let k=0;k<5;k++)press(s,{b:true});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.checks,0);assert.equal(s.mistakes,0);assert.equal(s.phase,'playing');
});
test('all three levels naturally lose after three complete wrong submissions, one mistake each',()=>{
 for(let level=0;level<3;level++){const s=fresh(level),wrong=s.cells.map((v,p)=>s.fixedValues[p]||1);fill(s,wrong);for(let n=1;n<=3;n++){press(s,{b:true});assert.equal(s.mistakes,n);assert.equal(s.checks,n);assert.ok(s.lastCheck.errors.length>=1);}assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');const before=copy(s);press(s,{a:true});assert.deepEqual(s,before);}
});
test('after two wrong checks ordinary edits clear stale errors and a correct third check wins',()=>{
 const s=fresh();fill(s,s.cells.map((v,p)=>s.fixedValues[p]||1));press(s,{b:true});press(s,{b:true});assert.equal(s.mistakes,2);go(s,0);press(s,{a:true});assert.equal(s.lastCheck,null);assert.equal(s.mistakes,2);fill(s,proofs[0].solutions[0]);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.checks,3);assert.equal(s.mistakes,2);
});
test('cursor clamps without wrap and simultaneous priorities consume held edges',()=>{
 const s=fresh();go(s,0);press(s,{x:-1});assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'edge');press(s,{y:-1});assert.equal(s.cursor,0);press(s,{x:1,y:1});assert.equal(s.cursor,s.width);go(s,0);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.cells[0],0);assert.equal(s.cursor,0);step(s,{a:true,x:1});assert.equal(s.cells[0],0);step(s);step(s,{a:true,x:1});assert.equal(s.cells[0],1);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.cells[0],1);assert.equal(s.cursor,0);
});
test('initial neutral and cancellation require release and retain existing ink',()=>{
 const s=M.create(784,0);step(s,{a:true});assert.equal(s.edits,0);step(s,{cancelEpoch:0});step(s,{a:true});assert.equal(s.cells[s.cursor],1);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.cells[s.cursor],2);step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.lastCommand,'none');step(s);step(s,{b:true});assert.equal(s.events[0].reason,'incomplete');
});
test('invalid dt, pause and hostile descriptors cannot partially edit or check',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.edits,0);assert.equal(reads,0);step(s,{a:true});assert.equal(s.edits,1);
});
test('diagnostic saturation imposes no deadline',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.edits=M.config.maxCounter;press(s,{b:true});press(s,{a:true});step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.edits,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,uniqueSolutionCounts:proofs.map(p=>p.solutions.length),independentSearchNodes:proofs.map(p=>p.nodes),editableCells:[13,20,30],physicalTvTested:false,physicalPhoneTested:false},null,2));
