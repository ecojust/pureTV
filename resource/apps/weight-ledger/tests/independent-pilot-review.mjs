#!/usr/bin/env node
// Synthetic observer review only. Production model/contract are read as bytes,
// never imported or executed. Use --app APP --output REPORT.json.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert.ok(['--app', '--output'].includes(process.argv[i]), 'Unknown argument');
  assert.ok(process.argv[i + 1], 'Missing argument value');
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
const script = fileURLToPath(import.meta.url);
const app = path.resolve(args.app || path.join(path.dirname(script), '..'));
const output = path.resolve(args.output || path.join(path.dirname(script), 'report.json'));
const files = ['tests/automation.mjs', 'src/main/assets/game-model.js', 'docs/model-contract.md'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => structuredClone(value);
async function sourceHashes() {
  return Object.fromEntries(await Promise.all(files.map(async name => [name, hash(await readFile(path.join(app, name)))])));
}
const before = await sourceHashes(), scriptBefore = hash(await readFile(script));
const pilotSource = await readFile(path.join(app, files[0]), 'utf8');
const modelSource = await readFile(path.join(app, files[1]), 'utf8');
const privateKeys = [...new Set([
  ...modelSource.matchAll(/\b_[A-Za-z][A-Za-z0-9_]*/g),
].map(match => match[0]).concat(['_goldenAllocation', '_solution', '_futureInputs', '_expectedPlacement', '_private']))].sort();
assert.ok(!/^\s*import\s/m.test(pilotSource) && !/\bimport\s*\(/.test(pilotSource), 'Pilot declares an unexpected dependency');
let pilotCalls = 0, exportCalls = 0, privateReads = 0, mutationAttempts = 0, frozenObservations = 0;
let meaningfulMoves = 0, submitEdges = 0, clearEdges = 0, factories = 0;
const checks = [], trace = [];
const report = {
  kind: 'independent-synthetic-public-allocation-pilot-review', passed: false,
  sourceHashes: before, reviewScriptSha256: scriptBefore,
  productionModelImported: false, productionModelStepCalled: false,
  productionModelSourceReadOnlyForHashAndPrivateKeyNames: true,
  normalGameWinsClaimed: 0, browserExecuted: false,
  physicalTvTested: false, physicalPhoneTested: false,
  scope: 'Hand-authored small public-ledger observations, including constructed pickup, placement, cancellation, undo and terminal snapshots. These are synthetic pilot/input-protocol fixtures, not production rule tests, completed games, browser play, footage or device evidence. No production model create/step or model solver/reference route is used; the reviewed public pilot and its own planner/predictor are executed.',
  privateKeys, checks
};

// Synthetic three-weight ledger: two 2g instances (IDs 1/2) and one 4g
// instance (ID3). Public equations share trays and include a 2:1 lever.
// This is not a production level and no production state is created/advanced.
function observation({assignment=['A','bank','bank'],elapsed=0,selected=2,held=null,destination=null,
  movesUsed=0,totalMoves=movesUsed,undos=0,cancels=0,pickups=held===null?0:1,goal='normal',phase='playing',paused=false}={}) {
  const trayFacts=[['A',160,170],['B',410,170],['C',160,365],['bank',410,365]];
  const trays=trayFacts.map(([id,x,y])=>({id,label:id,x,y,width:220,height:145,capacity:6,isBank:id==='bank',weightIds:[],totalMass:0}));
  const weights=[2,2,4].map((mass,i)=>({id:i+1,mass,trayId:assignment[i]}));
  for(const tray of trays) {
    const group=weights.filter(w=>w.trayId===tray.id);
    tray.weightIds=group.map(w=>w.id);tray.totalMass=group.reduce((n,w)=>n+w.mass,0);
    group.forEach((w,slot)=>Object.assign(w,{slot,x:tray.x+(slot%3-1)*54,y:tray.y+(Math.floor(slot/3)-.5)*48+10}));
  }
  const totals=Object.fromEntries(trays.map(t=>[t.id,t.totalMass]));
  const fixed=goal==='normal'?[4,6,8]:[6,6,6];
  const facts=[[['A',1],['B',1]],[['B',1],['C',1]],[['A',2],['C',1]]];
  const scales=facts.map((terms,i)=>{
    const leftTotal=terms.reduce((n,[id,c])=>n+c*totals[id],0),rightTotal=fixed[i];
    return{id:'scale-'+(i+1),label:'Synthetic equation '+(i+1),left:{terms:terms.map(([trayId,coefficient])=>({trayId,coefficient})),constant:0},
      right:{terms:[],constant:rightTotal},leftTotal,rightTotal,delta:leftTotal-rightTotal,balanced:leftTotal===rightTotal};
  });
  const mode=held===null?'selecting':'placing',selectedTrayId=held===null?null:destination||weights.find(w=>w.id===held).trayId;
  const selectedWeightId=held===null?selected:held,selectedId=held===null?selectedWeightId:selectedTrayId;
  const inventoryIds=trays.find(t=>t.isBank).weightIds,balancedCount=scales.filter(s=>s.balanced).length,deployedCount=3-inventoryIds.length;
  const model={width:960,height:540,level:1,difficulty:0,levelName:'Synthetic three-weight ledger',phase,mode,
    weights,trays,scales,selectedWeightId,heldWeightId:held,selectedTrayId,selectedId,
    selectionItems:(held===null?weights:trays).map(p=>({kind:held===null?'weight':'tray',id:p.id,x:p.x,y:p.y})),
    inventoryIds,totalMass:8,inventoryCount:inventoryIds.length,deployedCount,allDeployed:inventoryIds.length===0,
    balancedCount,allBalanced:balancedCount===3,moveBudget:3,movesUsed,movesRemaining:3-movesUsed,
    historyDepth:movesUsed,canUndo:phase==='playing'&&held===null&&movesUsed>0,totalMoves,pickups,cancels,undos,invalidPlacements:0,
    tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,
    score:balancedCount*200+deployedCount*25,lastTransfer:null,lastAction:null,events:[],message:'Synthetic public observation',lostReason:null};
  return{phase,paused,model};
}

// Frozen accessor guards stay ordinary structured-cloneable objects, unlike
// Proxies: a legitimate pilot may retain observed allocation/history in diagnostics.
// Setters count attempted assignment; array extension/deletion remains frozen.
function guarded(value, variant='getters') {
  const input=clone(value);
  for(const owner of [input,input.model].filter(Boolean)) for(const name of privateKeys) {
    if(variant==='getters') Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw new Error('Private getter read: '+name);}});
    else owner[name]=variant==='a'?{answer:[1,2,3],secret:17}:{answer:[24,23,22],secret:987654};
  }
  function wrap(v) {
    if(v===null||typeof v!=='object')return v;
    for(const key of Reflect.ownKeys(v)) {
      const descriptor=Object.getOwnPropertyDescriptor(v,key);
      if('value' in descriptor&&descriptor.configurable) {
        const child=wrap(descriptor.value);
        Object.defineProperty(v,key,{enumerable:descriptor.enumerable,configurable:true,
          get(){if(typeof key==='string'&&key.startsWith('_'))privateReads++;return child;},
          set(){mutationAttempts++;throw new Error('Frozen snapshot write');}});
      }
    }
    Object.freeze(v);
    return v;
  }
  const result=wrap(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model));
  for(const key of ['weights','trays','scales'])assert.ok(Object.isFrozen(result.model[key])&&Object.isFrozen(result.model[key][0]),'Public '+key+' must be deeply frozen');
  frozenObservations++;return result;
}
function consume() { assert.ok(pilotCalls+exportCalls<100,'Review observation-call cap reached'); }
function invoke(pilot,state,{variant='getters',mode='qa',label='fixture',expected}={}) {
  consume();pilotCalls++;
  const result=pilot(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));
  assert.ok(Array.isArray(result)&&result.length<=1&&result.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)),'Only one ordinary action key is allowed');
  if(expected!==undefined)assert.deepEqual(result,expected,label);
  if(result[0]?.startsWith('Arrow'))meaningfulMoves++;
  if(result.includes('Space'))submitEdges++;if(result.includes('b'))clearEdges++;
  trace.push({label,tick:state.model.tick,phase:state.phase,mode:state.model.mode,heldWeightId:state.model.heldWeightId,keys:[...result]});return result;
}
function external(fn,model,...args) { consume();exportCalls++;return fn(guarded({phase:model.phase,paused:false,model}).model,...args); }
function add(name,details={}) { checks.push({name,passed:true,...details}); }

try {
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);
  report.afterImportHashes=await sourceHashes();assert.deepEqual(report.afterImportHashes,before,'Sources changed during import');assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){factories++;return api.createPilot();}
  assert.equal(typeof api.createPilot,'function');add('pilot imports without a production model dependency and its source window is pinned');

  const normal=[
    {elapsed:0,keys:[]},{elapsed:1.1,keys:['Space']},{elapsed:1.1,keys:[]},{elapsed:1.1,keys:[]},
    {elapsed:1.2,held:2,keys:[]},{elapsed:1.7,held:2,keys:['ArrowUp']},{elapsed:1.7,held:2,keys:[]},
    {elapsed:1.8,held:2,destination:'B',keys:[]},{elapsed:2,held:2,destination:'B',keys:['Space']},
    {elapsed:2,held:2,destination:'B',keys:[]},
    {elapsed:2.1,assignment:['A','B','bank'],movesUsed:1,totalMoves:1,pickups:1,keys:[]}
  ];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [i,row] of normal.entries()) {
    const state=observation(row),results=[];
    for(let j=0;j<paired.length;j++)results.push(invoke(paired[j],state,{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.keys}));
    assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
  }
  add('equal public pickup and placement histories yield identical keys for different hidden values and throwing private getters',{pairedObservations:normal.length,variants:3});
  const observed=paired[2].diagnostics();
  assert.equal(observed.filter(r=>r.type==='observed-pickup').length,1);
  const placed=observed.find(r=>r.type==='observed-placement');assert.equal(placed.weightId,2);assert.deepEqual(placed.changedScaleIds,['scale-1','scale-2']);
  const immutableDiagnostics=clone(observed);observed.length=0;assert.deepEqual(paired[2].diagnostics(),immutableDiagnostics);
  add('pickup preserves allocation and budget; a physical ID placement observes two simultaneous scale changes and diagnostics remain isolated');
  add('pick navigation and place output one ordinary key, immediately release, and require a later neutral tick');

  const recordPilot=factory();
  const trial=[
    {elapsed:0,selected:1,keys:[]},{elapsed:3,selected:1,keys:['Space']},{elapsed:3,selected:1,keys:[]},
    {elapsed:3.1,held:1,keys:[]},{elapsed:5.2,held:1,keys:['ArrowRight']},{elapsed:5.2,held:1,keys:[]},
    {elapsed:5.3,held:1,destination:'B',keys:[]},{elapsed:6,held:1,destination:'B',keys:['Space']},
    {elapsed:6,held:1,destination:'B',keys:[]},
    {elapsed:6.1,assignment:['B','bank','bank'],selected:1,movesUsed:1,totalMoves:1,pickups:1,keys:[]},
    {elapsed:10.2,assignment:['B','bank','bank'],selected:1,movesUsed:1,totalMoves:1,pickups:1,keys:[]},
    {elapsed:10.4,assignment:['B','bank','bank'],selected:1,movesUsed:1,totalMoves:1,pickups:1,keys:['b']},
    {elapsed:10.4,assignment:['B','bank','bank'],selected:1,movesUsed:1,totalMoves:1,pickups:1,keys:[]},
    {elapsed:10.4,assignment:['B','bank','bank'],selected:1,movesUsed:1,totalMoves:1,pickups:1,keys:[]},
    {elapsed:10.5,selected:1,movesUsed:0,totalMoves:1,undos:1,pickups:1,keys:[]},
    {elapsed:13.9,selected:1,movesUsed:0,totalMoves:1,undos:1,pickups:1,keys:[]},
    {elapsed:14.1,selected:1,movesUsed:0,totalMoves:1,undos:1,pickups:1,keys:['ArrowRight']}
  ];
  for(const [i,row]of trial.entries())invoke(recordPilot,observation(row),{mode:'record',label:'trial-undo-'+i,expected:row.keys});
  const recordDiagnostics=recordPilot.diagnostics();
  const transfer=recordDiagnostics.find(r=>r.type==='observed-placement');assert.equal(transfer.weightId,1);assert.deepEqual(transfer.changedScaleIds,['scale-2','scale-3']);
  const undo=recordDiagnostics.find(r=>r.type==='observed-undo');assert.equal(undo.movesUsed,0);assert.equal(undo.totalMoves,1);assert.equal(undo.undos,1);
  assert.deepEqual(undo.allocation,[{id:1,trayId:'A'},{id:2,trayId:'bank'},{id:3,trayId:'bank'}]);
  assert.ok(recordDiagnostics.some(r=>r.type==='public-allocation-search'&&r.found&&r.minimumMoves===2));
  add('record trial commits a shared-tray move then empty-hand B restores observed inventory and budget without refunding time or lifetime moves',{trialObservationCalls:trial.length,publicReplanAfterObservedUndo:true});

  const heldState=elapsed=>observation({assignment:['B','bank','bank'],elapsed,held:2,movesUsed:1,totalMoves:1,pickups:2});
  const cancelPilot=factory();
  invoke(cancelPilot,heldState(0),{label:'cancel-preview-wait',expected:[]});
  invoke(cancelPilot,heldState(1.1),{label:'cancel-preview-b',expected:['b']});
  invoke(cancelPilot,heldState(1.1),{label:'cancel-preview-release',expected:[]});
  invoke(cancelPilot,heldState(1.1),{label:'cancel-preview-same-tick',expected:[]});
  invoke(cancelPilot,observation({assignment:['B','bank','bank'],elapsed:1.2,selected:2,movesUsed:1,totalMoves:1,pickups:2,cancels:1}),{label:'cancel-preview-observed',expected:[]});
  assert.equal(cancelPilot.diagnostics().filter(r=>r.type==='observed-cancel').length,1);
  add('B with a held preview cancels only that preview and preserves the earlier committed placement');

  const badCancel=factory();
  invoke(badCancel,heldState(0),{label:'bad-cancel-wait',expected:[]});
  invoke(badCancel,heldState(1.1),{label:'bad-cancel-b',expected:['b']});
  invoke(badCancel,heldState(1.1),{label:'bad-cancel-release',expected:[]});
  assert.throws(()=>invoke(badCancel,observation({elapsed:1.2,cancels:1,totalMoves:1,undos:1}),{label:'bad-cancel-also-undid-placement'}),/unexpectedly undid/);
  const badPick=factory();
  invoke(badPick,observation(),{label:'bad-pick-wait',expected:[]});
  invoke(badPick,observation({elapsed:1.1}),{label:'bad-pick-a',expected:['Space']});
  invoke(badPick,observation({elapsed:1.1}),{label:'bad-pick-release',expected:[]});
  assert.throws(()=>invoke(badPick,observation({assignment:['A','B','bank'],elapsed:1.2,held:2}),{label:'bad-pick-inventory-moved'}),/Pickup mutated committed allocation/);
  add('malformed pickup commits and cancellation-that-also-undoes are refused instead of accepted as valid observations');

  const separate=[factory(),factory()];
  for(const [i,goal]of ['normal','swapped'].entries())invoke(separate[i],observation({goal}),{label:'factory-'+i+'-wait',expected:[]});
  for(const [i,goal]of ['normal','swapped'].entries())invoke(separate[i],observation({goal,elapsed:1.1}),{label:'factory-'+i+'-pick',expected:['Space']});
  for(const [i,goal]of ['normal','swapped'].entries())invoke(separate[i],observation({goal,elapsed:1.1}),{label:'factory-'+i+'-release',expected:[]});
  for(const [i,goal]of ['normal','swapped'].entries())invoke(separate[i],observation({goal,elapsed:1.2,held:2}),{label:'factory-'+i+'-observed',expected:[]});
  for(const [i,goal]of ['normal','swapped'].entries())invoke(separate[i],observation({goal,elapsed:1.7,held:2}),{label:'factory-'+i+'-different-destination',expected:[i?'ArrowLeft':'ArrowUp']});
  add('interleaved factories retain distinct public equations and independently choose B versus C for the same physical ID');

  const idle=factory();
  for(const state of [observation({phase:'menu'}),observation({paused:true}),observation({phase:'won'}),observation({phase:'lost'})])invoke(idle,state,{label:'inactive-'+state.phase+(state.paused?'-paused':''),expected:[]});
  invoke(paired[2],observation(),{label:'elapsed-rollback-wait',expected:[]});
  invoke(paired[2],observation({elapsed:1.1}),{label:'elapsed-rollback-pick',expected:['Space']});
  add('menu pause terminal and retry observations preserve neutral/reset input semantics');

  const model=observation().model;
  const evaluation=external(api.evaluateAllocation,model);assert.deepEqual(evaluation.trayTotals,{A:2,B:0,C:0,bank:6});
  assert.deepEqual(evaluation.scales.map(s=>s.delta),[-2,-6,-4]);assert.equal(evaluation.totalMass,8);assert.equal(evaluation.allDeployed,false);
  const relocation=external(api.predictRelocation,model,2,'B');assert.equal(relocation.weightId,2);assert.deepEqual(relocation.changedScaleIds,['scale-1','scale-2']);assert.equal(relocation.goalReached,false);
  const equalInstances=external(api.evaluateAllocation,model,[{id:1,trayId:'B'},{id:2,trayId:'A'},{id:3,trayId:'C'}]);
  assert.equal(equalInstances.allDeployed,true);assert.equal(equalInstances.allBalanced,true);assert.deepEqual(equalInstances.trayWeightIds.A,[2]);assert.deepEqual(equalInstances.trayWeightIds.B,[1]);
  assert.throws(()=>external(api.evaluateAllocation,model,[{id:1,trayId:'A'},{id:1,trayId:'B'},{id:3,trayId:'C'}]),/Every physical ID/);
  const solution=external(api.planVisibleState,model);assert.equal(solution.found,true);assert.equal(solution.minimumMoves,2);
  assert.deepEqual(solution.relocations,[{weightId:2,toTrayId:'B'},{weightId:3,toTrayId:'C'}]);
  const capped=external(api.planVisibleState,model,{maxAssignments:1,maxMilliseconds:100});assert.equal(capped.found,false);assert.equal(capped.reason,'assignment-cap');assert.equal(capped.evaluated,0);
  const full=clone(model);full.trays.find(t=>t.id==='B').capacity=0;const refused=external(api.predictRelocation,full,2,'B');assert.equal(refused.valid,false);assert.equal(refused.reason,'capacity');
  const fractional=clone(model);fractional.weights[0].mass=2.5;assert.throws(()=>external(api.evaluateAllocation,fractional),/integer weight/);
  assert.equal(external(api.predictFocus,observation({held:2}).model,'N'),'B');
  assert.deepEqual(external(api.focusPath,observation({held:2}).model,'C'),['W']);
  add('small independent integer ledger expectations preserve duplicate-mass IDs, two affected equations and exact 2:1 totals; caps/capacity/fractional masses fail closed',{exportFixtureCalls:10,noFullRuleEnumeration:true});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(meaningfulMoves>0&&submitEdges>0&&clearEdges>0);
  add('all observation objects stay deeply frozen with zero private reads and zero detected write attempts');
  report.passed=true;
} catch(error) {
  report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;
} finally {
  report.endHashes=await sourceHashes();report.reviewScriptEndSha256=hash(await readFile(script));
  report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or review script changed during review'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,observationCallLimit:100,factoriesCreated:factories,privateReads,mutationAttempts,deepFrozenObservations:frozenObservations,
    meaningfulDirectionOutputs:meaningfulMoves,pickPlaceEdgeOutputs:submitEdges,cancelUndoEdgeOutputs:clearEdges,inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,
    calledExports:['createPilot','evaluateAllocation','predictRelocation','planVisibleState','predictFocus','focusPath']});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
