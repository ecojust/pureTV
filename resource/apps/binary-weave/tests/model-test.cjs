'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve}=require('./row-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),proofs=M.config.layouts.map(l=>solve(l));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(790,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function go(s,p){for(let guard=0;s.cursor!==p;guard++){assert.ok(guard<18);const x=s.cursor%s.width,tx=p%s.width;press(s,x!==tx?{x:x<tx?1:-1}:{y:s.cursor<p?1:-1});}}
function set(s,p,value){go(s,p);if(Object.hasOwn(s.fixedValues,p)){assert.equal(s.cells[p],value);return;}for(let guard=0;s.cells[p]!==value;guard++){assert.ok(guard<3);press(s,{a:true});}}
function fill(s,cells){cells.forEach((value,p)=>set(s,p,value));}
function wrong(s){return s.cells.map((_,p)=>Object.hasOwn(s.fixedValues,p)?s.fixedValues[p]:0);}
// These explicit full-board fixtures isolate one rule family; not ordinary puzzle routes.
function fixture(rows){const s=fresh();s.width=s.height=rows.length;s.givens=[];s.fixedValues={};s.cells=rows.flat();s.cursor=0;s.editableCount=s.cells.length;step(s);return s;}
function transpose(rows){return rows.map((_,x)=>rows.map(row=>row[x]));}
function types(s){return [...new Set(s.lastCheck.errors.map(e=>e.type))];}
const balance=[[1,1,0,0],[0,1,0,1],[0,0,1,0],[1,0,1,1]],triple=[[1,0,0,1,1,0],[1,1,1,0,0,0],[0,1,0,0,1,1],[0,0,1,1,1,0],[1,0,1,0,0,1],[0,1,0,1,0,1]],duplicate=[[1,0,1,0,1,0],[1,1,0,0,1,0],[0,0,1,1,0,1],[0,1,0,0,1,1],[1,1,0,1,0,0],[0,0,1,1,0,1]];
test('clue-only legal-pattern search proves all three grids unique with10/23/38 editable cells',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(proofs.map(p=>p.solutions.length),[1,1,1]);assert.deepEqual(M.config.layouts.map(l=>l.width*l.height-l.givens.length),[10,23,38]);
 M.config.layouts.forEach((l,i)=>{assert.equal(l.width,4+2*i);assert.equal(l.height,l.width);assert.equal('solution'in l,false);assert.equal('answer'in l,false);for(let k=0;k<l.width;k++){assert.ok(l.givens.filter(g=>Math.floor(g.cell/l.width)===k).length<l.width);assert.ok(l.givens.filter(g=>g.cell%l.width===k).length<l.width);}});
});
test('immutable public givens and independent fresh states normalize identities',()=>{
 const a=M.create(-1,-1),b=M.create(790,0);assert.equal(a.seed,790);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.givens[0].value=1;a.cells[0]=1;a.fixedValues[0]=1;assert.equal(b.givens[0].value,0);assert.equal(b.cells[0],0);assert.equal(b.fixedValues[0],0);assert.throws(()=>M.config.layouts[0].givens[0].value=1,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);
});
test('three ordinary cursor/A routes win only on explicit full B and freeze detached receipts',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level),givens=copy(s.givens);fill(s,p.solutions[0]);assert.equal(s.phase,'playing');assert.equal(s.filledCount,s.cells.length);assert.equal(s.zeros,s.cells.length/2);assert.equal(s.ones,s.cells.length/2);assert.ok(s.rowStatus.concat(s.columnStatus).every(line=>line.matched));assert.deepEqual(s.givens,givens);assert.equal(s.checks,0);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.equal(s.lastCheck.valid,true);assert.deepEqual(s.lastCheck.errors,[]);assert.notEqual(s.terminalReceipt.cells,s.cells);assert.notEqual(s.terminalReceipt.lastCheck,s.lastCheck);const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:9});assert.deepEqual(s,before);});
});
test('isolated row and column balance counterexamples reject unequal zero/one counts',()=>{
 for(const [rows,type]of [[balance,'row-balance'],[transpose(balance),'column-balance']]){const s=fixture(rows);press(s,{b:true});assert.deepEqual(types(s),[type]);assert.equal(s.mistakes,1);assert.equal(s.lastCheck.errors.length,2);assert.ok(s.lastCheck.errors.every(e=>e.expected===2&&e.zeros+e.ones===4));}
});
test('isolated row and column triple counterexamples remain invalid despite balanced distinct lines',()=>{
 for(const [rows,type]of [[triple,'row-triple'],[transpose(triple),'column-triple']]){const s=fixture(rows);press(s,{b:true});assert.deepEqual(types(s),[type]);assert.equal(s.mistakes,1);assert.deepEqual(s.lastCheck.errors.map(e=>e.start),[0,3,2]);assert.ok(s.lastCheck.errors.every(e=>e.cells.length===3));}
});
test('isolated duplicate rows/columns reject identical complete lines despite balance and no triples',()=>{
 for(const [rows,type,key]of [[duplicate,'duplicate-rows','rows'],[transpose(duplicate),'duplicate-columns','columns']]){const s=fixture(rows);press(s,{b:true});assert.deepEqual(types(s),[type]);assert.equal(s.lastCheck.errors.length,1);assert.deepEqual(s.lastCheck.errors[0][key],[2,5]);assert.equal(s.lastCheck.errors[0].cells.length,12);const status=key==='rows'?s.rowStatus:s.columnStatus;assert.deepEqual(status[2].duplicateWith,[5]);assert.deepEqual(status[5].duplicateWith,[2]);}
});
test('triple windows overlap within longer runs and incomplete lines never count as duplicates',()=>{
 const s=fixture(Array.from({length:4},()=>[0,0,0,0]));assert.deepEqual(s.rowStatus[0].triples,[0,1]);press(s,{b:true});assert.deepEqual(s.lastCheck.errors.filter(e=>e.type==='row-triple'&&e.row===0).map(e=>e.cells),[[0,1,2],[1,2,3]]);
 const t=fixture([[-1,0,1,0],[-1,0,1,0],[-1,1,0,1],[-1,1,0,1]]);assert.ok(t.rowStatus.every(line=>line.duplicateWith.length===0));assert.equal(t.columnStatus[0].complete,false);press(t,{b:true});assert.equal(t.events[0].reason,'incomplete');assert.equal(t.checks,0);
});
test('valid boards may match a row to a column and have diagonal or boundary-crossing triples',()=>{
 const s=fresh();fill(s,proofs[0].solutions[0]);assert.deepEqual(s.cells.slice(0,4),[s.cells[2],s.cells[6],s.cells[10],s.cells[14]]);press(s,{b:true});assert.equal(s.phase,'won');
 const p=[0,0,1,1,0,1,1,0],proof=solve({width:8,givens:p.map((value,cell)=>({cell,value}))},1);assert.equal(proof.solutions.length,1);const rows=Array.from({length:8},(_,y)=>proof.solutions[0].slice(y*8,y*8+8)),t=fixture(rows);assert.equal(t.cells[7],t.cells[0]);assert.equal(t.cells[0],t.cells[1]);press(t,{b:true});assert.equal(t.phase,'won');
 const largest=proofs[2].solutions[0];assert.equal(largest[0],largest[9]);assert.equal(largest[9],largest[18]);
});
test('A cycles unset/zero/one/unset and fixed zeros and ones both reject edits free',()=>{
 const s=fresh(),p=s.cells.indexOf(-1);for(const value of [0,1,-1]){set(s,p,value);assert.equal(s.cells[p],value);assert.equal(s.mistakes,0);}assert.equal(s.edits,3);for(const g of s.givens){go(s,g.cell);press(s,{a:true});assert.equal(s.events[0].reason,'fixed');assert.equal(s.cells[g.cell],g.value);}assert.equal(s.edits,3);
});
test('full defensive validation rejects overwritten givens in a labelled synthetic otherwise legal board',()=>{
 const s=fresh();s.cells=proofs[0].solutions[0].map(v=>1-v);step(s);press(s,{b:true});assert.deepEqual(types(s),['fixed-clue']);assert.equal(s.lastCheck.errors.length,s.givens.length);assert.equal(s.lastCheck.errors[0].cell,0);assert.equal(s.lastCheck.errors[0].expected,0);assert.equal(s.lastCheck.errors[0].actual,1);assert.equal(s.mistakes,1);
});
test('incomplete checks are always free, and ordinary complete wrong grids lose all three levels',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);for(let k=0;k<4;k++)press(s,{b:true});assert.equal(s.checks,0);assert.equal(s.mistakes,0);fill(s,wrong(s));for(let n=1;n<=3;n++){press(s,{b:true});assert.equal(s.mistakes,n);assert.equal(s.checks,n);assert.ok(s.lastCheck.errors.length>0);}assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');const before=copy(s);press(s,{a:true});assert.deepEqual(s,before);}
});
test('correcting through ordinary edits clears prior highlights and wins the third check after two mistakes',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level);fill(s,wrong(s));press(s,{b:true});press(s,{b:true});const previous=copy(s.lastCheck);go(s,s.cells.findIndex((v,i)=>!Object.hasOwn(s.fixedValues,i)&&v!==p.solutions[0][i]));assert.deepEqual(s.lastCheck,previous);press(s,{a:true});assert.equal(s.lastCheck,null);fill(s,p.solutions[0]);press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.checks,3);assert.equal(s.mistakes,2);});
});
test('cursor clamps without wrap, vertical ties win and B>A>direction consumes held edges',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'edge');press(s,{y:-1});assert.equal(s.cursor,0);press(s,{x:1,y:1});assert.equal(s.cursor,s.width);go(s,1);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.cells[1],-1);assert.equal(s.cursor,1);step(s,{a:true,x:1});assert.equal(s.cells[1],-1);step(s);step(s,{a:true,x:1});assert.equal(s.cells[1],0);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.cells[1],0);assert.equal(s.cursor,1);
});
test('initial neutral and epoch/cancel transitions require release and retain entered values',()=>{
 const s=M.create(790,0);step(s,{x:1,a:true});assert.equal(s.cursor,0);assert.equal(s.edits,0);step(s,{cancelEpoch:0});press(s,{x:1});step(s);step(s,{a:true});assert.equal(s.cells[1],0);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.cells[1],1);step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.lastCommand,'none');step(s);step(s,{b:true});assert.equal(s.events[0].reason,'incomplete');
});
test('invalid dt, pause, inherited flags and hostile descriptors cannot partially execute',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.edits,0);assert.equal(reads,0);press(s,{x:1});press(s,{a:true});assert.equal(s.edits,1);
});
test('diagnostic counters and active elapsed saturate without deadline or edit cap',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.edits=M.config.maxCounter;press(s,{b:true});go(s,1);press(s,{a:true});step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.edits,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,uniqueSolutionCounts:proofs.map(p=>p.solutions.length),searchNodes:proofs.map(p=>p.nodes),legalPatterns:proofs.map(p=>p.legalPatterns),editableCells:[10,23,38],physicalTvTested:false,physicalPhoneTested:false},null,2));
