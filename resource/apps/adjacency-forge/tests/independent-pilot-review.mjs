#!/usr/bin/env node
// Public synthetic protocol observations, never production Model/create/step.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const args = {};
for (let i=2;i<process.argv.length;i+=2) { assert.ok(['--app','--output','--expected-pilot'].includes(process.argv[i])&&process.argv[i+1]); args[process.argv[i].slice(2)]=process.argv[i+1]; }
assert.match(args['expected-pilot']||'',/^[a-f0-9]{64}$/);
const script=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(script),'..')),output=path.resolve(args.output||path.join(path.dirname(script),'report.json'));
const files=['tests/automation.mjs','src/main/assets/game-model.js','docs/model-contract.md','tests/independent-forge-math.mjs'];
const hash=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
async function hashes(){return Object.fromEntries(await Promise.all(files.map(async name=>[name,hash(await readFile(path.join(app,name)))])));}
const before=await hashes(),scriptBefore=hash(await readFile(script));assert.equal(before[files[0]],args['expected-pilot']);
assert.equal(before[files[3]],'7211b65e1077b18a4e8a28c7066495c76a954a564b9107876e745ae9bcfd8d2d','Independent math dependency changed before review');
const pilotSource=await readFile(path.join(app,files[0]),'utf8'),modelSource=await readFile(path.join(app,files[1]),'utf8');
const privateKeys=[...new Set([...modelSource.matchAll(/\b_[A-Za-z][A-Za-z0-9_]*/g)].map(m=>m[0]).concat(['_solution','_referenceAssignment','_futureRoute','_plannedAnswer','_private']))].sort();
assert.ok(!/^\s*import\s/m.test(pilotSource)&&!/\bimport\s*\(/.test(pilotSource),'Unexpected pilot dependency');
let pilotCalls=0,exportCalls=0,factories=0,diagnosticCalls=0,privateReads=0,mutationAttempts=0,frozenObservations=0,directions=0,actionEdges=0,backEdges=0;
const checks=[],trace=[],report={kind:'independent-synthetic-public-forge-pilot-review',passed:false,sourceHashes:before,expectedPilotSha256:args['expected-pilot'],reviewScriptSha256:scriptBefore,
  productionModelImported:false,productionModelStepCalled:false,productionModelSourceReadOnlyForHashAndPrivateKeyNames:true,authoredLayoutsRead:false,normalGameWinsClaimed:0,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false,privateKeys,checks,
  scope:'Hand-constructed seven-cell disconnected geometry: two Cu/Fe/Ag triangles and one Cu leaf, with requiredCount=1 for every material. Public observations are independently derived from that synthetic board by the reviewed pure cube/heat oracle. No production model, authored board, reference assignment or model solver is executed. The reviewed public pilot and its own public planner/predictor are executed. These are synthetic observation/input-protocol fixtures, not normal gameplay, footage or device evidence.'};
const XY=[[0,0],[1,0],[0,1],[4,0],[5,0],[4,1],[2,0]],MATERIAL_IDS=['copper','iron','silver'];
const TILE_METALS=['copper','iron','silver','copper','iron','silver','copper'];
const GOAL=['T1','T2','T3','T4','T5','T6','T7'],INITIAL=['T1','T4','T5','T2','T3','T6','T7'];
const TARGET={copper:'iron',iron:'silver',silver:'copper'},HEX=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],LABELS=['E','SE','SW','W','NW','NE'];
let math;
function observation({elapsed=1,assignment=INITIAL,selectedId='C1',stage='select',heldCellId=null,history=[],undos=0,cancels=0,totalSwaps=history.length+undos,
  lastSwap=history.at(-1)??null,lastUndo=null,submissions=0,mistakes=0,phase='playing',runtimePhase=phase,paused=false}={}) {
  const raw=XY.map(([q,r])=>[Math.sqrt(3)*48*(q+r/2),72*r]),originX=320-(Math.min(...raw.map(p=>p[0]))+Math.max(...raw.map(p=>p[0])))/2,originY=250-(Math.min(...raw.map(p=>p[1]))+Math.max(...raw.map(p=>p[1])))/2;
  const cells=XY.map(([q,r],i)=>({id:'C'+(i+1),q,r,x:Math.round(raw[i][0]+originX),y:Math.round(raw[i][1]+originY),role:i===0?'source':i===1?'mold':null,tileId:assignment[i]}));
  const tiles=TILE_METALS.map((material,i)=>({id:'T'+(i+1),material,cellId:cells[assignment.indexOf('T'+(i+1))].id}));
  const materials=MATERIAL_IDS.map((id,i)=>({id,label:id,glyph:['Cu','Fe','Ag'][i],rgb:[[198,115,71],[111,129,145],[209,220,229]][i],neighborMaterial:TARGET[id],requiredCount:1,heatTarget:TARGET[id]}));
  const derived=math.deriveForge({cells,tiles,materials,sourceCellId:'C1',moldCellId:'C2'});
  const forge={id:'forge',kind:'submit',x:790,y:414},focusItems=[...cells.map(c=>({id:c.id,kind:'cell',x:c.x,y:c.y})),forge],cursor=clone(focusItems.find(c=>c.id===selectedId));
  assert.ok(cursor,'Unknown synthetic focus');
  const m={width:960,height:540,seed:1,level:1,difficulty:0,levelName:'Synthetic disconnected forge triangles',phase,
    board:{centerX:320,centerY:250,hexRadius:48,originX,originY},directions:HEX.map(([dq,dr],index)=>({index,label:LABELS[index],dq,dr})),materials,
    cells:cells.map((c,i)=>({...c,...derived.cells[i]})),tiles:derived.tiles,sourceCellId:'C1',moldCellId:'C2',materialCounts:derived.materialCounts,
    heat:derived.heat,matchedCells:derived.matchedCells,allRecipesMet:derived.allRecipesMet,goalReady:derived.goalReady,
    forge,focusItems,selectedId,cursor,stage,heldCellId:stage==='holding'?heldCellId:null,heldTileId:stage==='holding'?cells.find(c=>c.id===heldCellId).tileId:null,
    history:clone(history),historyDepth:history.length,totalSwaps,undos,cancels,lastSwap:clone(lastSwap),lastUndo:clone(lastUndo),lastAction:null,events:[],
    submissions,mistakes,maxMistakes:3,lastSubmission:null,tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,
    score:derived.matchedCells*40+(derived.heat.delivered?120:0)+(phase==='won'?1000+Math.floor(90-elapsed)*5:0),message:'Synthetic public observation',lostReason:null};
  return {phase:runtimePhase,paused,model:m};
}
function guarded(value,variant='getters') {
  const input=clone(value);
  for(const owner of [input,input.model,...input.model.cells,...input.model.tiles])for(const name of privateKeys) {
    if(variant==='getters')Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw Error('Private getter read: '+name);}});
    else owner[name]=variant==='a'?{answer:['T1','T2'],route:['C1']}:{answer:['T7','T3'],route:['C5','C2']};
  }
  function freeze(v){if(v===null||typeof v!=='object')return v;for(const key of Reflect.ownKeys(v)){const d=Object.getOwnPropertyDescriptor(v,key);if('value'in d&&d.configurable){const child=freeze(d.value);Object.defineProperty(v,key,{enumerable:d.enumerable,configurable:true,get(){if(typeof key==='string'&&key.startsWith('_'))privateReads++;return child;},set(){mutationAttempts++;throw Error('Frozen observation write');}});}}Object.freeze(v);return v;}
  const result=freeze(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model));
  for(const key of ['cells','tiles','materials','history','focusItems'])assert.ok(Object.isFrozen(result.model[key]));
  assert.ok(Object.isFrozen(result.model.cells[0])&&Object.isFrozen(result.model.tiles[0])&&Object.isFrozen(result.model.materials[0]));frozenObservations++;return result;
}
function consume(){assert.ok(pilotCalls+exportCalls+factories+diagnosticCalls<100,'Hard 100-call bound reached');}
function invoke(p,state,{variant='getters',mode='qa',label='fixture',expected}={}) {
  consume();pilotCalls++;const row={label,tick:state.model.tick,phase:state.phase,stage:state.model.stage,selectedId:state.model.selectedId,heldTileId:state.model.heldTileId,assignment:state.model.cells.map(c=>c.tileId),totalSwaps:state.model.totalSwaps,undos:state.model.undos};
  try{const keys=p(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));assert.ok(Array.isArray(keys)&&keys.length<=1&&keys.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)));if(expected!==undefined)assert.deepEqual(keys,expected,label);if(keys[0]?.startsWith('Arrow'))directions++;if(keys.includes('Space'))actionEdges++;if(keys.includes('b'))backEdges++;trace.push({...row,keys:[...keys]});return keys;}
  catch(error){trace.push({...row,error:error.message});throw error;}
}
function external(fn,m,...rest){consume();exportCalls++;return fn(guarded({phase:m.phase,paused:false,model:m}).model,...rest);}
function add(name,details={}){checks.push({name,passed:true,...details});}
function focusStep(m,key){const axes={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowUp:[0,-1]},[dx,dy]=axes[key],from=m.cursor;
  return m.focusItems.map((p,i)=>{const x=p.x-from.x,y=p.y-from.y,perpendicular=Math.abs(dx?y:x),distance=x*x+y*y;return{id:p.id,i,forward:x*dx+y*dy,cost:distance+2*perpendicular*perpendicular,distance,perpendicular};}).filter(p=>p.forward>0).sort((a,b)=>a.cost-b.cost||a.distance-b.distance||a.perpendicular-b.perpendicular||a.i-b.i)[0]?.id??m.selectedId;}
try {
  math=await import(pathToFileURL(path.join(app,files[3])).href+'?review='+before[files[3]]);
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);
  report.afterImportHashes=await hashes();assert.deepEqual(report.afterImportHashes,before);assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){consume();factories++;return api.createPilot();}
  function diagnosis(p){consume();diagnosticCalls++;return p.diagnostics();}
  add('reviewed public pilot and independent math imports remain pinned; production model is not imported');
  const initial=observation().model,goal=observation({assignment:GOAL}).model;
  assert.equal(initial.goalReady,false);assert.equal(goal.goalReady,true);
  const plan=external(api.planVisibleState,initial);assert.equal(plan.found,true);assert.equal(plan.swaps.length,2);
  const task=plan.swaps[0],a=task.aCellId,b=task.bCellId,after=[...INITIAL],ai=initial.cells.findIndex(c=>c.id===a),bi=initial.cells.findIndex(c=>c.id===b);
  [after[ai],after[bi]]=[after[bi],after[ai]];assert.equal(observation({assignment:after}).model.goalReady,false,'Record trial must remain nonwinning');
  const navState=observation({selectedId:a,stage:'holding',heldCellId:a}).model;
  const navKey=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].find(key=>focusStep(navState,key)===b);assert.ok(navKey,'This bounded fixture expects adjacent task focus in one ordinary directional input');
  const swapAt=at=>({...task,beforeTileIds:[...INITIAL],at,tick:Math.round(at*60)});
  const swap=swapAt(2.2),trialSwap=swapAt(8),repairSwap=swapAt(20.8);
  const normal=[{elapsed:1,expected:[]},{elapsed:1.5,expected:['Space']},{elapsed:1.5,expected:[]},{elapsed:1.5,expected:[]},
    {elapsed:1.6,stage:'holding',heldCellId:a,expected:[]},{elapsed:1.8,stage:'holding',heldCellId:a,expected:[navKey]},
    {elapsed:1.8,stage:'holding',heldCellId:a,expected:[]},{elapsed:1.9,stage:'holding',heldCellId:a,selectedId:b,expected:[]},
    {elapsed:2,stage:'holding',heldCellId:a,selectedId:b,expected:[]},{elapsed:2.2,stage:'holding',heldCellId:a,selectedId:b,expected:['Space']},
    {elapsed:2.2,stage:'holding',heldCellId:a,selectedId:b,expected:[]},{elapsed:2.3,selectedId:b,assignment:after,history:[swap],expected:[]}];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [i,row] of normal.entries()) {
    const outcomes=[];
    for(let j=0;j<3;j++) {
      if(i===normal.length-1&&j===2){const wrong=[...after],positions=wrong.map((id,index)=>TILE_METALS[Number(id.slice(1))-1]==='iron'?index:-1).filter(i=>i>=0);[wrong[positions[0]],wrong[positions[1]]]=[wrong[positions[1]],wrong[positions[0]]];
        assert.throws(()=>invoke(paired[j],observation({selectedId:a,...row,assignment:wrong}),{label:'negative-same-material-physical-ID-substitution'}),/Actual swap violated physical IDs/);}
      outcomes.push(invoke(paired[j],observation({selectedId:a,...row}),{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.expected}));
    }
    assert.deepEqual(outcomes[0],outcomes[1]);assert.deepEqual(outcomes[1],outcomes[2]);
  }
  const diagnostics=diagnosis(paired[2]);assert.equal(diagnostics.filter(r=>r.type==='observed-pickup').length,1);assert.equal(diagnostics.filter(r=>r.type==='observed-swap').length,1);
  const saved=clone(diagnostics);diagnostics.length=0;assert.deepEqual(diagnosis(paired[2]),saved);
  add('three separate factories produce identical keys for paired public histories with different private payloads or throwing getters',{pairedObservations:normal.length,variants:3});
  add('A edges release, stale ticks remain neutral, and observations must preserve exact physical IDs even for equal materials',{negativeFixture:'same-material ID substitution is intentionally inconsistent with the pending receipt, not ordinary play'});
  const record=factory(),undo={swap:clone(trialSwap),at:12.5,tick:750};
  const trial=[{elapsed:1,expected:[]},{elapsed:4,expected:['Space']},{elapsed:4,expected:[]},{elapsed:4.1,stage:'holding',heldCellId:a,expected:[]},
    {elapsed:5.7,stage:'holding',heldCellId:a,expected:[navKey]},{elapsed:5.7,stage:'holding',heldCellId:a,expected:[]},{elapsed:5.8,stage:'holding',heldCellId:a,selectedId:b,expected:[]},
    {elapsed:6.1,stage:'holding',heldCellId:a,selectedId:b,expected:[]},{elapsed:8,stage:'holding',heldCellId:a,selectedId:b,expected:['Space']},{elapsed:8,stage:'holding',heldCellId:a,selectedId:b,expected:[]},
    {elapsed:8.1,selectedId:b,assignment:after,history:[trialSwap],expected:[]},{elapsed:12.4,selectedId:b,assignment:after,history:[trialSwap],expected:['b']},{elapsed:12.4,selectedId:b,assignment:after,history:[trialSwap],expected:[]},
    {elapsed:12.5,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},{elapsed:16.8,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:['Space']},
    {elapsed:16.8,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},{elapsed:16.9,stage:'holding',heldCellId:a,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},
    {elapsed:18.5,stage:'holding',heldCellId:a,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[navKey]},{elapsed:18.5,stage:'holding',heldCellId:a,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},
    {elapsed:18.6,stage:'holding',heldCellId:a,selectedId:b,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},{elapsed:18.9,stage:'holding',heldCellId:a,selectedId:b,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},
    {elapsed:20.8,stage:'holding',heldCellId:a,selectedId:b,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:['Space']},{elapsed:20.8,stage:'holding',heldCellId:a,selectedId:b,undos:1,totalSwaps:1,lastSwap:trialSwap,lastUndo:undo,expected:[]},
    {elapsed:20.9,selectedId:b,assignment:after,history:[repairSwap],undos:1,totalSwaps:2,lastSwap:repairSwap,lastUndo:undo,expected:[]}];
  for(const [i,row] of trial.entries()) {
    if(i===13){const wrong=[...INITIAL];[wrong[2],wrong[3]]=[wrong[3],wrong[2]];assert.equal(TILE_METALS[Number(wrong[2].slice(1))-1],TILE_METALS[Number(wrong[3].slice(1))-1]);
      assert.throws(()=>invoke(record,observation({selectedId:a,...row,assignment:wrong}),{mode:'record',label:'negative-undo-same-material-ID-substitution'}),/Undo must restore exact ID allocation/);}
    invoke(record,observation({selectedId:a,...row}),{mode:'record',label:'record-trial-undo-repair-'+i,expected:row.expected});
  }
  const rd=diagnosis(record),observedSwaps=rd.filter(r=>r.type==='observed-swap');assert.equal(observedSwaps.length,2);
  assert.deepEqual(observedSwaps.map(r=>[r.aCellId,r.bCellId,r.aTileId,r.bTileId]),[[a,b,task.aTileId,task.bTileId],[a,b,task.aTileId,task.bTileId]]);
  assert.deepEqual(rd.find(r=>r.type==='observed-undo').assignment,INITIAL);
  add('record mode requires observed trial commit, empty-hand B undo, then the exact same physical pair repair',{syntheticObservations:trial.length,pair:[a,b],physicalIDs:[task.aTileId,task.bTileId],normalGameplayClaim:false});
  const cancel=factory(),ready=factory(),holding={elapsed:30,assignment:after,selectedId:'forge',stage:'holding',heldCellId:b,history:[trialSwap]};
  invoke(cancel,observation(holding),{label:'holding-FORGE-factory-start',expected:[]});invoke(ready,observation({elapsed:30,assignment:GOAL,selectedId:'forge'}),{label:'ready-other-factory-start',expected:[]});
  invoke(cancel,observation({...holding,elapsed:30.5}),{label:'holding-FORGE-cancels-not-submits',expected:['b']});
  invoke(ready,observation({elapsed:30.5,assignment:GOAL,selectedId:'forge'}),{label:'ready-does-not-auto-submit',expected:[]});
  invoke(cancel,observation({...holding,elapsed:30.5}),{label:'cancel-release',expected:[]});
  assert.throws(()=>invoke(cancel,observation({elapsed:30.6,selectedId:b,undos:1,totalSwaps:1,cancels:1,lastSwap:trialSwap,lastUndo:undo}),{label:'negative-cancel-that-undoes-history'}),/Cancel must not commit or undo/);
  invoke(cancel,observation({elapsed:30.6,assignment:after,selectedId:b,history:[trialSwap],cancels:1}),{label:'cancel-preserves-existing-history',expected:[]});
  invoke(ready,observation({elapsed:30.8,assignment:GOAL,selectedId:'forge'}),{label:'ready-explicit-Space-submit',expected:['Space']});
  invoke(ready,observation({elapsed:30.8,assignment:GOAL,selectedId:'forge'}),{label:'submit-release',expected:[]});
  add('interleaved factories keep independent holding versus ready tasks; FORGE while holding cancels without submitting or undoing');
  for(const change of [{paused:true},{runtimePhase:'menu'},{runtimePhase:'won'}])invoke(ready,observation({elapsed:30.8,...change}),{label:'synthetic-runtime-neutral-gate',expected:[]});
  invoke(ready,observation({elapsed:0}),{label:'retry-clock-rollback',expected:[]});
  invoke(ready,observation({elapsed:.5}),{label:'retry-fresh-navigation',expected:['ArrowRight']});
  add('paused/menu/constructed-terminal runtime gates return neutral; clock rollback begins a fresh public plan');
  const copy=external(api.publicAssignment,initial);assert.deepEqual(copy,INITIAL);copy[0]='detached';assert.equal(initial.cells[0].tileId,'T1');
  const e=external(api.evaluateBoard,initial);for(const key of ['heat','matchedCells','allRecipesMet','goalReady','materialCounts'])assert.deepEqual(e[key],initial[key]);
  for(const row of e.cells){const actual=initial.cells.find(c=>c.id===row.id);for(const key of Object.keys(row))assert.deepEqual(row[key],actual[key]);}
  const equal=external(api.predictSwap,initial,'C3','C4');assert.notEqual(equal.aTileId,equal.bTileId);assert.deepEqual(equal.after.heat,initial.heat);assert.deepEqual(equal.after.materialCounts,initial.materialCounts);
  assert.deepEqual(equal.afterTileIds,['T1','T4','T2','T5','T3','T6','T7']);
  assert.throws(()=>external(api.predictSwap,initial,'C3','C3'),/two different/);
  const bounded=external(api.planVisibleState,initial,{maxExpanded:1,maxMilliseconds:1000});assert.equal(bounded.found,false);assert.equal(bounded.reason,'node-cap');assert.equal(bounded.expanded,1);
  assert.throws(()=>external(api.planVisibleState,initial,{maxMilliseconds:Infinity}),/explicit public search goal or cap/);
  const dir={ArrowUp:'N',ArrowRight:'E',ArrowDown:'S',ArrowLeft:'W'}[navKey];assert.equal(external(api.predictFocus,navState,dir),b);
  assert.ok(external(api.focusPath,initial,'forge').length>0);
  external(api.assertPublicBoard,initial,assert);
  add('bounded public exports agree with independent cube/material facts, preserve same-material IDs, reject invalid caps, and use actual screen focus',{explicitPlannerGoal:'goal',minimumSwapsObserved:2,noAuthoredFeasibilityClaim:true});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(directions>0&&actionEdges>0&&backEdges>0);
  add('all observation inputs stay deeply frozen with zero private getter reads or writes');report.passed=true;
} catch(error) {report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;}
finally {
  report.endHashes=await hashes();report.reviewScriptEndSha256=hash(await readFile(script));report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or reviewer changed during execution'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,reviewedApiCallsIncludingFactoriesAndDiagnostics:pilotCalls+exportCalls+factories+diagnosticCalls,callLimit:100,
    factoriesCreated:factories,diagnosticCalls,deepFrozenObservations:frozenObservations,privateReads,mutationAttempts,meaningfulDirectionOutputs:directions,pickSwapSubmitEdgeOutputs:actionEdges,cancelUndoEdgeOutputs:backEdges,
    inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,calledExports:['createPilot','publicAssignment','evaluateBoard','predictSwap','planVisibleState','predictFocus','focusPath','assertPublicBoard'],
    syntheticGeometry:{axialCells:XY,sourceCellId:'C1',moldCellId:'C2',materialTotals:{copper:3,iron:2,silver:2},requiredCounts:{copper:1,iron:1,silver:1},disconnectedFootprint:true}});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,totalReviewedApiCalls:report.reviewedApiCallsIncludingFactoriesAndDiagnostics,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
