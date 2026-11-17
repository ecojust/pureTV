'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve}=require('./rectangle-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),proofs=M.config.layouts.map(l=>solve(l));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(788,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function go(s,p){for(let guard=0;s.cursor!==p;guard++){assert.ok(guard<14);const x=s.cursor%s.width,tx=p%s.width;press(s,x!==tx?{x:x<tx?1:-1}:{y:s.cursor<p?1:-1});}}
function draw(s,a,b){go(s,a);press(s,{a:true});go(s,b);press(s,{a:true});}
function paintSolution(s){for(const r of proofs[s.level].solutions[0])draw(s,r.top*s.width+r.left,r.bottom*s.width+r.right);}
function whole(s){draw(s,0,s.width*s.height-1);}
function types(s){return s.lastCheck.errors.map(e=>e.type);}
test('public clue-only exact cover proves three unique rectangular partitions',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(proofs.map(p=>p.solutions.length),[1,1,1]);
 M.config.layouts.forEach((l,i)=>{assert.equal(l.width,i+4);assert.equal(l.height,i+4);assert.equal(l.seeds.length,i+4);assert.equal(l.seeds.reduce((n,s)=>n+s.area,0),l.width*l.height);assert.equal('solution'in l,false);assert.equal('answer'in l,false);
  const rs=proofs[i].solutions[0];assert.equal(rs.length,l.seeds.length);assert.ok(rs.some(r=>(r.right===r.left||r.bottom===r.top)&&r.area>=3));assert.ok(rs.some(r=>r.right-r.left===r.bottom-r.top&&r.area>1));
 });
});
test('configuration is deeply frozen and new states contain independent clue/owner arrays',()=>{
 const a=M.create(-1,-1),b=M.create(788,0);assert.equal(a.seed,788);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.seeds[0].area=99;a.owners[0]=99;assert.equal(b.seeds[0].area,2);assert.equal(b.owners[0],0);assert.throws(()=>M.config.layouts[0].seeds[0].area=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);
});
test('three ordinary two-corner routes win only after full B, preserving clues and terminal freeze',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level),seeds=copy(s.seeds);paintSolution(s);assert.equal(s.phase,'playing');assert.equal(s.coveredCount,s.width*s.height);assert.equal(s.rectangleCount,s.seeds.length);assert.equal(s.checks,0);assert.deepEqual(s.overlapCells,[]);assert.deepEqual(s.seeds,seeds);assert.equal(s.rectangles.flatMap(r=>r.cells).length,s.owners.length);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.equal(s.lastCheck.valid,true);assert.deepEqual(s.lastCheck.errors,[]);assert.notEqual(s.terminalReceipt.rectangles,s.rectangles);assert.notEqual(s.terminalReceipt.lastCheck,s.lastCheck);const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:9});assert.deepEqual(s,before);});
});
test('both corners are inclusive and normalized in all four orientations; one-cell rectangles work',()=>{
 for(const [a,b]of [[0,5],[5,0],[1,4],[4,1]]){const s=fresh();draw(s,a,b);assert.deepEqual(s.rectangles[0],{id:1,left:0,top:0,right:1,bottom:1,area:4,cells:[0,1,4,5]});}
 const s=fresh();draw(s,6,6);assert.equal(s.rectangles[0].area,1);assert.deepEqual(s.rectangles[0].cells,[6]);
});
test('occupied-cell A removes the whole rectangle and reuses the lowest free ID',()=>{
 const s=fresh();draw(s,0,1);draw(s,2,3);go(s,1);press(s,{a:true});assert.equal(s.removals,1);assert.equal(s.coveredCount,2);assert.deepEqual(s.owners.slice(0,4),[0,0,2,2]);assert.equal(s.anchor,null);draw(s,4,5);assert.deepEqual(s.rectangles.map(r=>r.id),[1,2]);assert.equal(s.rectangles[0].cells[0],4);assert.equal(s.edits,4);assert.equal(s.mistakes,0);
});
test('overlapping geometry is rejected without edits or mistakes and leaves its anchor adjustable',()=>{
 const s=fresh();draw(s,0,1);go(s,4);press(s,{a:true});go(s,1);assert.equal(s.candidate.overlap,true);assert.equal(s.candidate.area,4);assert.equal(s.candidate.seedCount,1);press(s,{a:true});assert.equal(s.events[0].reason,'overlap');assert.equal(s.anchor,4);assert.equal(s.edits,1);assert.equal(s.placements,1);assert.equal(s.mistakes,0);go(s,5);assert.equal(s.candidate.overlap,false);press(s,{a:true});assert.equal(s.anchor,null);assert.equal(s.edits,2);assert.deepEqual(s.overlapCells,[]);
});
test('B first cancels an anchor and only full unanchored submissions spend a check',()=>{
 const s=fresh();press(s,{a:true});go(s,5);press(s,{b:true});assert.equal(s.anchor,null);assert.equal(s.candidate,null);assert.equal(s.events[0].type,'cancel');assert.equal(s.edits,0);for(let i=0;i<5;i++)press(s,{b:true});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.checks,0);assert.equal(s.mistakes,0);assert.equal(s.phase,'playing');
});
test('full one-cell tiling independently exposes zero-number and wrong-area errors in stable region order',()=>{
 const s=fresh();for(let p=0;p<s.owners.length;p++)draw(s,p,p);press(s,{b:true});assert.equal(s.mistakes,1);assert.equal(s.checks,1);assert.equal(s.lastCheck.errors.length,16);assert.equal(types(s).filter(t=>t==='wrong-area').length,4);assert.equal(types(s).filter(t=>t==='missing-number').length,12);assert.deepEqual(s.lastCheck.errors[0],{type:'wrong-area',rect:1,cells:[0],seed:0,expected:2,actual:1});assert.deepEqual(s.lastCheck.errors[1],{type:'missing-number',rect:2,cells:[1]});
});
test('full single-region tiling exposes multiple-number errors and naturally loses all three levels',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);whole(s);for(let n=1;n<=3;n++){press(s,{b:true});assert.equal(s.mistakes,n);assert.equal(s.checks,n);assert.deepEqual(types(s),['multiple-numbers']);assert.deepEqual(s.lastCheck.errors[0].seeds,s.seeds.map(c=>c.cell));}assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');const before=copy(s);press(s,{a:true});assert.deepEqual(s,before);}
});
test('ordinary removal clears stale errors and a valid third check wins with two prior mistakes',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);whole(s);press(s,{b:true});press(s,{b:true});assert.equal(s.mistakes,2);const prior=copy(s.lastCheck);go(s,0);assert.deepEqual(s.lastCheck,prior);press(s,{a:true});assert.equal(s.lastCheck,null);assert.equal(s.coveredCount,0);paintSolution(s);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.checks,3);assert.equal(s.mistakes,2);}
});
test('labelled synthetic corrupted overlap is rejected even with full nominal coverage',()=>{
 const s=fresh();paintSolution(s);const clone=copy(s.rectangles[0]);clone.id=20;s.rectangles.push(clone);step(s);assert.deepEqual(s.overlapCells,clone.cells);press(s,{b:true});assert.equal(s.phase,'playing');assert.equal(s.lastCheck.errors[0].type,'overlap');assert.deepEqual(s.lastCheck.errors[0].cells,clone.cells);assert.equal(s.mistakes,1);
});
test('candidate diagnostics are only geometry and last-check data is preserved by navigation/cancel',()=>{
 const s=fresh();whole(s);press(s,{b:true});const checked=copy(s.lastCheck);go(s,0);assert.deepEqual(s.lastCheck,checked);press(s,{a:true});assert.equal(s.lastCheck,null);press(s,{a:true});go(s,3);assert.deepEqual(s.candidate,{left:0,top:0,right:3,bottom:0,area:4,cells:[0,1,2,3],overlap:false,seedCount:2});press(s,{b:true});assert.equal(s.candidate,null);assert.equal(s.rectangles.length,0);
});
test('cursor clamps with no wrap, vertical ties win and B>A>direction consumes suppressed edges',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'edge');press(s,{y:-1});assert.equal(s.cursor,0);press(s,{x:1,y:1});assert.equal(s.cursor,s.width);go(s,0);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.anchor,null);assert.equal(s.cursor,0);step(s,{a:true,x:1});assert.equal(s.anchor,null);step(s);step(s,{a:true,x:1});assert.equal(s.anchor,0);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.placements,0);assert.equal(s.cursor,0);
});
test('initial neutral and cancellation quarantine release without discarding the first corner',()=>{
 const s=M.create(788,0);step(s,{a:true});assert.equal(s.anchor,null);step(s,{cancelEpoch:0});step(s,{a:true});assert.equal(s.anchor,0);step(s,{a:true,cancelEpoch:1});assert.equal(s.placements,0);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.anchor,0);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.placements,1);step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.lastCommand,'none');step(s);step(s,{b:true});assert.equal(s.events[0].reason,'incomplete');
});
test('invalid dt, paused calls and hostile input descriptors cannot partially execute commands',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.anchor,null);assert.equal(reads,0);step(s,{a:true});assert.equal(s.anchor,0);
});
test('elapsed and diagnostic limits saturate without imposing a hidden deadline or edit limit',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.edits=M.config.maxCounter;s.placements=M.config.maxCounter;press(s,{b:true});draw(s,0,1);step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.edits,M.config.maxCounter);assert.equal(s.placements,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,uniqueSolutionCounts:proofs.map(p=>p.solutions.length),searchNodes:proofs.map(p=>p.nodes),physicalTvTested:false,physicalPhoneTested:false},null,2));
