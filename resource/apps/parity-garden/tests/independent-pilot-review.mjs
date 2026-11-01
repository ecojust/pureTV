#!/usr/bin/env node
// Synthetic observer review only: never import or step the production model.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert.ok(['--app', '--output', '--expected-pilot'].includes(process.argv[i]), 'Unknown argument');
  assert.ok(process.argv[i + 1], 'Missing argument value');
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
assert.match(args['expected-pilot'] || '', /^[a-f0-9]{64}$/, 'Explicit stable pilot SHA is required');
const script = fileURLToPath(import.meta.url);
const app = path.resolve(args.app || path.join(path.dirname(script), '..'));
const output = path.resolve(args.output || path.join(path.dirname(script), 'report.json'));
const files = ['tests/automation.mjs', 'src/main/assets/game-model.js', 'docs/model-contract.md'];
const hash = b => createHash('sha256').update(b).digest('hex'), clone = structuredClone;
async function sourceHashes() {
  return Object.fromEntries(await Promise.all(files.map(async name => [name, hash(await readFile(path.join(app, name)))])));
}
const before = await sourceHashes(), scriptBefore = hash(await readFile(script));
assert.equal(before[files[0]], args['expected-pilot'], 'Pilot differs from explicitly approved candidate');
const pilotSource = await readFile(path.join(app, files[0]), 'utf8');
const modelSource = await readFile(path.join(app, files[1]), 'utf8');
const privateKeys = [...new Set([...modelSource.matchAll(/\b_[A-Za-z][A-Za-z0-9_]*/g)].map(m => m[0])
  .concat(['_goldenActions', '_answerMask', '_solution', '_futureInputs', '_private']))].sort();
assert.ok(!/^\s*import\s/m.test(pilotSource) && !/\bimport\s*\(/.test(pilotSource), 'Pilot declares an unexpected dependency');
let pilotCalls = 0, exportCalls = 0, privateReads = 0, mutationAttempts = 0, frozenObservations = 0;
let directions = 0, waters = 0, switches = 0, factories = 0;
const checks = [], trace = [];
const report = {
  kind: 'independent-synthetic-public-parity-pilot-review', passed: false,
  expectedPilotSha256: args['expected-pilot'], sourceHashes: before, reviewScriptSha256: scriptBefore,
  productionModelImported: false, productionModelStepCalled: false,
  productionModelSourceReadOnlyForHashAndPrivateKeyNames: true,
  normalGameWinsClaimed: 0, browserExecuted: false, physicalTvTested: false, physicalPhoneTested: false,
  scope: 'Hand-authored 2x2 public gardens plus one bounded 1x16 unsigned-bit fixture. Constructed snapshots exercise input observation, double-spray water accounting, expired highlights and dropped inputs; they are not production rule tests, completed games, browser play, footage or device evidence. No production model create/step or model solver/reference route is used; the reviewed public pilot and its own public GF(2) planner/predictor are executed.',
  privateKeys, checks
};
const BASE = [true, false, false, false], PARTIAL = [false, true, false, true];
const TARGET = [true, true, false, false], FULL = [true, true, true, true];
const NOZZLES = [
  {id: 'cross', label: 'Cross', offsets: [{dx:0,dy:0},{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}]},
  {id: 'diagonal', label: 'Diagonal', offsets: [{dx:0,dy:0},{dx:-1,dy:-1},{dx:1,dy:-1},{dx:1,dy:1},{dx:-1,dy:1}]}
];
// This is a fixture constructor for explicit public facts, not a transition engine.
function observation({open=BASE, target=TARGET, direct=[0,0,0,0], marked=[0], selected=1,
  nozzle='cross', nozzleSwitches=0, elapsed=0, waterBudget=6, lastWater=null,
  cols=2, rows=2, phase='playing', runtimePhase=phase, paused=false}={}) {
  assert.equal(open.length, cols*rows); assert.equal(target.length, open.length); assert.equal(direct.length, open.length);
  const cells=open.map((v,id)=>({id,col:id%cols,row:Math.floor(id/cols),x:100+(id%cols+.5)*40,y:50+(Math.floor(id/cols)+.5)*40,
    open:v,targetOpen:target[id],requiresEven:marked.includes(id),directWaterCount:direct[id],directParity:direct[id]%2,
    conditionMet:!marked.includes(id)||(v&&direct[id]%2===0),matched:v===target[id]}));
  const waterUsed=direct.reduce((n,c)=>n+c,0), matchedCells=cells.filter(c=>c.matched).length;
  const satisfiedMarked=cells.filter(c=>c.requiresEven&&c.conditionMet).length;
  const current=cells.find(c=>c.id===selected), offsets=NOZZLES.find(n=>n.id===nozzle).offsets;
  const previewIds=cells.filter(c=>offsets.some(o=>c.col===current.col+o.dx&&c.row===current.row+o.dy)).map(c=>c.id);
  const model={width:960,height:540,level:1,difficulty:0,levelName:'Synthetic public garden',phase,
    grid:{cols,rows,x:100,y:50,cellSize:40},targetView:{x:10,y:10,cellSize:20},
    cells,targetPattern:[...target],markedIds:[...marked],selectedId:selected,
    cursor:{id:current.id,col:current.col,row:current.row,x:current.x,y:current.y},
    nozzles:clone(NOZZLES),nozzle,nozzleSwitches,previewIds,waterBudget,waterUsed,waterRemaining:waterBudget-waterUsed,
    matchedCells,patternMatched:matchedCells===cells.length,markedCount:marked.length,satisfiedMarked,
    allMarkedSatisfied:satisfiedMarked===marked.length,goalMatched:matchedCells===cells.length&&satisfiedMarked===marked.length,
    tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,
    score:matchedCells*20+satisfiedMarked*40+(phase==='won'?1000+(waterBudget-waterUsed)*100+Math.floor(90-elapsed)*5:0),
    lastWater:clone(lastWater),lostReason:null,message:'Synthetic public observation'};
  return {phase:runtimePhase,paused,model};
}
function waterEvent({id,cellId,nozzle,affectedIds,before,after,directBefore,at}) {
  return {id,cellId,nozzle,affectedIds:[...affectedIds],changes:affectedIds.map(cellId=>({cellId,beforeOpen:before[cellId],afterOpen:after[cellId]})),
    directBefore,directAfter:directBefore+1,at,expiresAt:at+.6};
}
const FIRST = waterEvent({id:1,cellId:1,nozzle:'cross',affectedIds:[0,1,3],before:BASE,after:PARTIAL,directBefore:0,at:1.3});
function guarded(value,variant='getters') {
  const input=clone(value);
  for (const owner of [input,input.model]) for (const name of privateKeys) {
    if (variant==='getters') Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw Error('Private getter read: '+name);}});
    else owner[name]=variant==='a'?{mask:13,answer:[1,2,3]}:{mask:987654,answer:[31,30,29]};
  }
  function wrap(v) {
    if(v===null||typeof v!=='object')return v;
    for(const key of Reflect.ownKeys(v)) {
      const descriptor=Object.getOwnPropertyDescriptor(v,key);
      if('value' in descriptor&&descriptor.configurable) {
        const child=wrap(descriptor.value);
        Object.defineProperty(v,key,{enumerable:descriptor.enumerable,configurable:true,
          get(){if(typeof key==='string'&&key.startsWith('_'))privateReads++;return child;},
          set(){mutationAttempts++;throw Error('Frozen snapshot write');}});
      }
    }
    Object.freeze(v);return v;
  }
  const result=wrap(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model));
  for(const key of ['cells','nozzles'])assert.ok(Object.isFrozen(result.model[key])&&Object.isFrozen(result.model[key][0]));
  assert.ok(Object.isFrozen(result.model.nozzles[0].offsets)&&Object.isFrozen(result.model.grid));
  frozenObservations++;return result;
}
function consume(){assert.ok(pilotCalls+exportCalls<100,'Observation-call cap reached');}
function invoke(pilot,state,{variant='getters',mode='qa',label='fixture',expected}={}) {
  consume();pilotCalls++;const entry={label,tick:state.model.tick,phase:state.phase,selectedId:state.model.selectedId,nozzle:state.model.nozzle,waterUsed:state.model.waterUsed};
  try {
    const result=pilot(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));
    assert.ok(Array.isArray(result)&&result.length<=1&&result.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)),'Expected one ordinary input key');
    if(expected!==undefined)assert.deepEqual(result,expected,label);
    if(result[0]?.startsWith('Arrow'))directions++;if(result.includes('Space'))waters++;if(result.includes('b'))switches++;
    trace.push({...entry,keys:[...result]});return result;
  } catch(error) {trace.push({...entry,error:error.message});throw error;}
}
function external(fn,model,...rest){consume();exportCalls++;return fn(guarded({phase:model.phase,paused:false,model}).model,...rest);}
function add(name,details={}){checks.push({name,passed:true,...details});}

try {
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);
  report.afterImportHashes=await sourceHashes();assert.deepEqual(report.afterImportHashes,before);assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){factories++;return api.createPilot();}
  add('pilot import and model/contract/pilot source window are pinned without importing the production model');

  const normal=[
    {elapsed:0,keys:[]},{elapsed:1.1,keys:[]},{elapsed:1.3,keys:['Space']},{elapsed:1.3,keys:[]},{elapsed:1.3,keys:[]},
    {elapsed:1.4,open:PARTIAL,direct:[0,1,0,0],lastWater:FIRST,keys:[]},
    {elapsed:1.8,open:PARTIAL,direct:[0,1,0,0],lastWater:FIRST,keys:['b']},
    {elapsed:1.8,open:PARTIAL,direct:[0,1,0,0],lastWater:FIRST,keys:[]},
    {elapsed:1.9,open:PARTIAL,direct:[0,1,0,0],nozzle:'diagonal',nozzleSwitches:1,keys:[]}
  ];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [i,row] of normal.entries()) {
    const state=observation(row),result=[];
    for(let j=0;j<3;j++)result.push(invoke(paired[j],state,{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.keys}));
    assert.deepEqual(result[0],result[1]);assert.deepEqual(result[1],result[2]);
  }
  add('identical public watering and switch histories produce identical keys despite different private values or throwing private getters',{pairedObservations:normal.length,variants:3});
  const saved=paired[2].diagnostics();assert.equal(saved.filter(r=>r.type==='observed-water').length,1);assert.equal(saved.filter(r=>r.type==='observed-switch').length,1);
  const savedCopy=clone(saved);saved.length=0;assert.deepEqual(paired[2].diagnostics(),savedCopy);
  add('A and B release on the next observation, wait for a later neutral tick, and expose independent diagnostic copies');

  const record=factory(), once=[false,false,false,true];
  const oneEvent=waterEvent({id:1,cellId:0,nozzle:'diagonal',affectedIds:[0,3],before:BASE,after:once,directBefore:0,at:5.8});
  const twoEvent=waterEvent({id:2,cellId:0,nozzle:'diagonal',affectedIds:[0,3],before:once,after:BASE,directBefore:1,at:11.5});
  const trial=[
    {elapsed:0,keys:[]},{elapsed:3,keys:['b']},{elapsed:3,keys:[]},
    {elapsed:3.1,nozzle:'diagonal',nozzleSwitches:1,keys:[]},
    {elapsed:4.5,nozzle:'diagonal',nozzleSwitches:1,keys:[]},
    {elapsed:5.8,nozzle:'diagonal',nozzleSwitches:1,keys:['Space']},
    {elapsed:5.8,nozzle:'diagonal',nozzleSwitches:1,keys:[]},
    {elapsed:5.9,nozzle:'diagonal',nozzleSwitches:1,open:once,direct:[1,0,0,0],lastWater:oneEvent,keys:[]},
    {elapsed:10.2,nozzle:'diagonal',nozzleSwitches:1,open:once,direct:[1,0,0,0],keys:[]},
    {elapsed:11.5,nozzle:'diagonal',nozzleSwitches:1,open:once,direct:[1,0,0,0],keys:['Space']},
    {elapsed:11.5,nozzle:'diagonal',nozzleSwitches:1,open:once,direct:[1,0,0,0],keys:[]},
    {elapsed:11.6,nozzle:'diagonal',nozzleSwitches:1,direct:[2,0,0,0],lastWater:twoEvent,keys:[]},
    {elapsed:15.9,nozzle:'diagonal',nozzleSwitches:1,direct:[2,0,0,0],keys:['b']},
    {elapsed:15.9,nozzle:'diagonal',nozzleSwitches:1,direct:[2,0,0,0],keys:[]},
    {elapsed:16,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:17.4,nozzleSwitches:2,direct:[2,0,0,0],keys:['ArrowRight']},
    {elapsed:17.4,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:17.5,selected:1,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:18,selected:1,nozzleSwitches:2,direct:[2,0,0,0],keys:['ArrowDown']},
    {elapsed:18,selected:1,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:18.1,selected:3,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:18.6,selected:3,nozzleSwitches:2,direct:[2,0,0,0],keys:[]},
    {elapsed:19.9,selected:3,nozzleSwitches:2,direct:[2,0,0,0],keys:['Space']},
    {elapsed:19.9,selected:3,nozzleSwitches:2,direct:[2,0,0,0],keys:[]}
  ];
  for(const [i,row] of trial.entries())invoke(record,observation({selected:0,target:FULL,waterBudget:3,...row}),{mode:'record',label:'double-trial-'+i,expected:row.keys});
  const rd=record.diagnostics(),restored=rd.find(r=>r.type==='observed-double-restoration');
  assert.equal(restored.cellId,0);assert.equal(restored.waterUsed,2);assert.equal(restored.waterRemaining,1);
  assert.equal(rd.filter(r=>r.type==='observed-water').length,2);assert.equal(rd.filter(r=>r.type==='observed-switch').length,2);
  assert.equal(rd.find(r=>r.type==='public-linear-search').minimumDrops,1);
  add('observed double spray restores flowers and parities but retains exact count2 and two permanently spent drops; B changes nozzle before replanning',{syntheticObservations:trial.length,waterUsedAfterRestoration:2,waterRemainingAfterRestoration:1,noSyntheticWinClaimed:true});

  function prime(p,label) {
    for(const [elapsed,keys] of [[0,[]],[1.1,[]],[1.3,['Space']],[1.3,[]]])invoke(p,observation({elapsed}),{label:label+'-'+elapsed,expected:keys});
  }
  const late=factory();prime(late,'late');
  invoke(late,observation({elapsed:2.1,open:PARTIAL,direct:[0,1,0,0],lastWater:null}),{label:'late-valid-expired-highlight',expected:[]});
  invoke(late,observation({elapsed:2.5,open:PARTIAL,direct:[0,1,0,0]}),{label:'late-resumes-public-plan',expected:['b']});
  assert.equal(late.diagnostics().filter(r=>r.type==='observed-water').length,1);
  add('a late observation confirms permanent garden/direct-count/water progress after the .6 second highlight has expired',{observedDelaySeconds:.8});

  const dropped=factory();prime(dropped,'dropped');
  for(const [elapsed,keys] of [[1.4,[]],[2.9,[]],[3.3,[]],[3.6,['Space']],[3.6,[]]])invoke(dropped,observation({elapsed}),{label:'dropped-'+elapsed,expected:keys});
  assert.equal(dropped.diagnostics().filter(r=>r.type==='unobserved-input-retry').length,1);
  assert.equal(dropped.diagnostics().filter(r=>r.type==='observed-water').length,0);
  assert.throws(()=>invoke(dropped,observation({elapsed:3.7,direct:[0,1,0,0]}),{label:'reject-water-count-without-flower-effect'}),/Actual watering differs/);
  add('an externally dropped or canceled key leaves unchanged public state, is released, and is retried only after observation timeout; count-only progress is rejected');

  const brokenSwitch=factory();
  invoke(brokenSwitch,observation({selected:0,target:FULL,waterBudget:3}),{mode:'record',expected:[]});
  invoke(brokenSwitch,observation({selected:0,target:FULL,waterBudget:3,elapsed:3}),{mode:'record',expected:['b']});
  invoke(brokenSwitch,observation({selected:0,target:FULL,waterBudget:3,elapsed:3}),{mode:'record',expected:[]});
  assert.throws(()=>invoke(brokenSwitch,observation({selected:0,target:FULL,waterBudget:3,elapsed:3.1,nozzle:'diagonal',nozzleSwitches:1,direct:[1,0,0,0]}),{mode:'record',label:'reject-B-consuming-water'}),/Nozzle switch undid or spent water/);
  add('a B switch that spends or refunds water is rejected instead of being accepted as undo');

  const isolated=[factory(),factory()],targets=[[true,true,false,true],[true,false,true,true]],expected=[['ArrowRight'],['ArrowDown']];
  for(let j=0;j<2;j++)invoke(isolated[j],observation({open:[false,false,false,false],target:targets[j],marked:[],selected:0}),{label:'factory-start-'+j,expected:[]});
  for(let j=0;j<2;j++)invoke(isolated[j],observation({open:[false,false,false,false],target:targets[j],marked:[],selected:0,elapsed:1.1}),{label:'factory-different-public-goal-'+j,expected:expected[j]});
  for(let j=0;j<2;j++)invoke(isolated[j],observation({open:[false,false,false,false],target:targets[j],marked:[],selected:0,elapsed:1.1}),{label:'factory-release-'+j,expected:[]});
  add('interleaved pilot factories retain distinct public targets and select different ordinary directions');

  invoke(late,observation({runtimePhase:'menu',elapsed:2.5}),{label:'menu-neutral',expected:[]});
  invoke(late,observation({paused:true,elapsed:2.5}),{label:'pause-neutral',expected:[]});
  invoke(late,observation({phase:'won',open:TARGET,target:TARGET,elapsed:2.5}),{label:'constructed-terminal-neutral',expected:[]});
  invoke(late,observation(),{label:'elapsed-rollback-retry',expected:[]});
  invoke(late,observation({elapsed:1.1}),{label:'retry-has-fresh-ready-delay',expected:[]});
  assert.equal(late.diagnostics().filter(r=>r.type==='observed-round').length,1);
  assert.equal(late.diagnostics().filter(r=>r.type==='observed-water').length,0);
  add('menu pause constructed terminal and elapsed rollback retry preserve neutral/fresh input semantics');

  const early=factory();prime(early,'early');
  assert.throws(()=>invoke(early,observation({elapsed:1.4,open:PARTIAL,direct:[0,1,0,0]}),{label:'reject-premature-highlight-disappearance'}),/vanished before/);
  add('the late-highlight allowance does not accept missing metadata before its documented lifetime');

  const model=observation().model;
  const publicRows=external(api.publicGarden,model);assert.deepEqual(publicRows,BASE.map((open,id)=>({id,open,directWaterCount:0,directParity:0})));
  publicRows[0].open=false;assert.equal(model.cells[0].open,true);
  external(api.assertPublicGarden,model,assert);
  const prediction=external(api.predictWater,model,0,'diagonal');
  assert.deepEqual(prediction.affectedIds,[0,3]);assert.deepEqual(prediction.cells.map(c=>c.open),[false,false,false,true]);assert.deepEqual(prediction.cells.map(c=>c.directWaterCount),[1,0,0,0]);assert.equal(prediction.waterUsed,1);assert.equal(prediction.waterRemaining,5);assert.equal(prediction.goalMatched,false);
  const planned=external(api.planVisibleState,model);assert.equal(planned.found,true);assert.equal(planned.minimumDrops,2);assert.deepEqual(planned.actions,[{cellId:1,nozzle:'cross'},{cellId:3,nozzle:'diagonal'}]);
  const capped=external(api.planVisibleState,model,{maxCandidates:1,maxMilliseconds:1000});assert.equal(capped.found,false);assert.equal(capped.reason,'nullspace-cap');assert.equal(capped.evaluated,0);
  assert.throws(()=>external(api.planVisibleState,model,{maxMilliseconds:Infinity}),/finite positive/);
  const poor=external(api.planVisibleState,observation({waterBudget:1}).model);assert.equal(poor.found,false);assert.equal(poor.reason,'remaining-water');assert.equal(poor.minimumDrops,2);
  const inconsistent=clone(model);inconsistent.cells[0].directParity=1;assert.throws(()=>external(api.predictWater,inconsistent),/Invalid public cell state/);
  const bit31Model=observation({cols:16,rows:1,open:Array(16).fill(false),target:Array.from({length:16},(_,i)=>i===15),direct:Array(16).fill(0),marked:[],selected:0,waterBudget:1}).model;
  const bit31=external(api.planVisibleState,bit31Model,{maxCandidates:65536,maxMilliseconds:1000});assert.equal(bit31.found,true);assert.equal(bit31.minimumDrops,1);assert.deepEqual(bit31.actions,[{cellId:15,nozzle:'diagonal'}]);assert.equal(bit31.evaluated,65536);
  const duplicate=clone(model);duplicate.cells[1].id=0;assert.throws(()=>external(api.planVisibleState,duplicate),/IDs must be unique/);
  external(api.assertPublicGarden,observation({target:FULL,waterBudget:3,direct:[2,0,0,0],selected:0,nozzle:'diagonal',nozzleSwitches:1,elapsed:12}).model,assert);
  assert.throws(()=>external(api.planVisibleState,model,{maxCandidates:0}),/finite positive/);
  add('bounded public exports respect direct-only counting, marked parity, minimum cost, water budget, unsigned bit31 and candidate caps',{exportFixtureCalls:12,bit31Candidates:bit31.evaluated,defaultNullspaceRequired:capped.required,noFullRuleEnumeration:true});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(directions>0&&waters>0&&switches>0);
  add('all public observations remain deeply frozen with zero private reads and zero detected mutation attempts');
  report.passed=true;
} catch(error) {
  report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;
} finally {
  report.endHashes=await sourceHashes();report.reviewScriptEndSha256=hash(await readFile(script));
  report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or review script changed during review'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,observationCallLimit:100,factoriesCreated:factories,
    privateReads,mutationAttempts,deepFrozenObservations:frozenObservations,meaningfulDirectionOutputs:directions,
    waterEdgeOutputs:waters,nozzleSwitchEdgeOutputs:switches,inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,
    calledExports:['createPilot','publicGarden','assertPublicGarden','predictWater','planVisibleState']});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
