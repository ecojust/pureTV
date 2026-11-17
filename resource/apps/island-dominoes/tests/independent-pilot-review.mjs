#!/usr/bin/env node
// Hand-authored public observations only, never production Model/create/step.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const args={};for(let i=2;i<process.argv.length;i+=2){assert.ok(['--app','--output','--expected-pilot'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
assert.match(args['expected-pilot']||'',/^[a-f0-9]{64}$/);
const script=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(script),'..')),output=path.resolve(args.output||path.join(path.dirname(script),'report.json'));
const files=['tests/automation.mjs','src/main/assets/game-model.js','docs/model-contract.md'],hash=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
async function hashes(){return Object.fromEntries(await Promise.all(files.map(async n=>[n,hash(await readFile(path.join(app,n)))])))}
const before=await hashes(),scriptBefore=hash(await readFile(script));assert.equal(before[files[0]],args['expected-pilot']);
const pilotSource=await readFile(path.join(app,files[0]),'utf8'),modelSource=await readFile(path.join(app,files[1]),'utf8');
const privateKeys=[...new Set([...modelSource.matchAll(/\b_[A-Za-z][A-Za-z0-9_]*/g)].map(m=>m[0]).concat(['_solution','_goldenPlacements','_futureInputs','_expectedBridge','_private']))].sort();
assert.ok(!/^\s*import\s/m.test(pilotSource)&&!/\bimport\s*\(/.test(pilotSource),'Unexpected pilot dependency');
let pilotCalls=0,exportCalls=0,factories=0,privateReads=0,mutationAttempts=0,frozenObservations=0,directions=0,actionEdges=0,backEdges=0;
const checks=[],trace=[],report={kind:'independent-synthetic-public-island-pilot-review',passed:false,sourceHashes:before,expectedPilotSha256:args['expected-pilot'],reviewScriptSha256:scriptBefore,
  productionModelImported:false,productionModelStepCalled:false,productionModelSourceReadOnlyForHashAndPrivateKeyNames:true,normalGameWinsClaimed:0,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false,privateKeys,checks,
  scope:'Hand-authored three-island/two-equal-attribute-piece snapshots exercise public input observation, exact physical IDs and stage-specific cancellation/undo. One separate four-island triangle fixture exercises the public disconnected planner. No production model create/step, authored layout or reference placement is used. The reviewed public pilot and its own public geometry/planner are executed. These are synthetic protocol fixtures, not normal gameplay, footage or device evidence.'};
const POINTS=[{id:'A',gx:0,gy:0,color:'coral'},{id:'B',gx:1,gy:0,color:'teal'},{id:'C',gx:2,gy:0,color:'teal'}];
const PIECES=[{id:'P1',length:1,targetColor:'teal'},{id:'P2',length:1,targetColor:'teal'}];
const EDGE={id:'bridge-P1',pieceId:'P1',sourceId:'A',targetId:'B',length:1,targetColor:'teal'};
// Derive display/ledger fields from explicit fixture facts, without simulating an action.
function observation({elapsed=0,stage='bank',selectedPiece='P1',selectedIsland='A',source='A',bridges=[],undos=0,cancels=0,failedCommits=0,
  totalPlacements=bridges.length+undos,placementAttempts=totalPlacements+failedCommits,lastPlacement=undefined,lastUndo=null,
  phase='playing',runtimePhase=phase,paused=false,pointFacts=POINTS,pieceFacts=PIECES}={}){
  const incident=Object.fromEntries(pointFacts.map(p=>[p.id,[]]));for(const b of bridges){incident[b.sourceId].push(b.pieceId);incident[b.targetId].push(b.pieceId);}
  const groups=[];for(const p of pointFacts){if(groups.some(g=>g.includes(p.id)))continue;const g=[p.id];for(let i=0;i<g.length;i++)for(const b of bridges){if(b.sourceId===g[i]&&!g.includes(b.targetId))g.push(b.targetId);if(b.targetId===g[i]&&!g.includes(b.sourceId))g.push(b.sourceId);}groups.push(g);}
  const islands=pointFacts.map(p=>({...p,x:90+p.gx*58,y:110+p.gy*58,degree:incident[p.id].length,incidentPieceIds:incident[p.id],componentId:groups.find(g=>g.includes(p.id))[0]}));
  const pieces=pieceFacts.map((p,i)=>{const b=bridges.find(b=>b.pieceId===p.id);return{...p,x:748+(i%2)*112,y:150+Math.floor(i/2)*108,placed:!!b,bridgeId:b?.id??null};});
  const availablePieceIds=pieces.filter(p=>!p.placed).map(p=>p.id),selectedPieceId=availablePieceIds.length?selectedPiece:null,heldPieceId=stage==='bank'?null:selectedPieceId;
  const point=id=>islands.find(i=>i.id===id),sourceId=stage==='target'?source:null;
  let preview=null;
  if(stage==='target'){
    const p=pieces.find(p=>p.id===heldPieceId),a=point(sourceId),b=point(selectedIsland),distanceSquared=(a.gx-b.gx)**2+(a.gy-b.gy)**2;
    const occupied=bridges.find(e=>[e.sourceId,e.targetId].includes(sourceId)&&[e.sourceId,e.targetId].includes(selectedIsland));
    const reason=sourceId===selectedIsland?'same-island':distanceSquared!==p.length**2?'length':b.color!==p.targetColor?'color':occupied?'occupied':null;
    const resultingComponentCount=reason?null:groups.length-(a.componentId===b.componentId?0:1),wouldFinish=availablePieceIds.length===1;
    preview={pieceId:p.id,sourceId,targetId:selectedIsland,length:p.length,targetColor:p.targetColor,distanceSquared,requiredSquared:p.length**2,targetColorMatches:b.color===p.targetColor,
      valid:reason===null,reason,blockingPieceId:occupied?.pieceId??null,blockingIslandId:null,resultingComponentCount,wouldFinish,wouldConnectAll:resultingComponentCount===1,wouldLoseDisconnected:reason===null&&wouldFinish&&resultingComponentCount>1};
  }
  const focus=stage==='bank'?pieces.find(p=>p.id===selectedPieceId):point(selectedIsland),componentCount=groups.length;
  if(lastPlacement===undefined&&bridges.length){const b=bridges.at(-1);lastPlacement={pieceId:b.pieceId,sourceId:b.sourceId,targetId:b.targetId,accepted:true,reason:null,at:elapsed,tick:Math.round(elapsed*60)};}
  return{phase:runtimePhase,paused,model:{width:960,height:540,board:{x:90,y:110,unit:58},islandRadius:18,seed:1,level:1,difficulty:0,levelName:'Synthetic public bridge bank',phase,
    islands,pieces,bridges:clone(bridges),availablePieceIds,placedCount:bridges.length,remainingPieces:availablePieceIds.length,componentCount,connected:componentCount===1,largestComponentSize:Math.max(...groups.map(g=>g.length)),
    stage,selectedPieceId,heldPieceId,selectedIslandId:selectedIsland,sourceId,cursor:focus?{kind:stage==='bank'?'piece':'island',id:focus.id,x:focus.x,y:focus.y}:null,preview,
    totalPlacements,undos,cancels,failedCommits,placementAttempts,maxFailedCommits:3,lastPlacement:lastPlacement??null,lastUndo:clone(lastUndo),lastAction:null,events:[],
    tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,score:bridges.length*100+(islands.length-componentCount)*40+(phase==='won'?1000+Math.floor(90-elapsed)*5:0),message:'Synthetic public observation',lostReason:null}};
}
function guarded(value,variant='getters'){
  const input=clone(value);for(const owner of [input,input.model])for(const name of privateKeys){
    if(variant==='getters')Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw Error('Private getter read: '+name);}});
    else owner[name]=variant==='a'?{piece:'P1',answer:[1,2]}:{piece:'P2',answer:[9,8]};
  }
  function freeze(v){if(v===null||typeof v!=='object')return v;for(const key of Reflect.ownKeys(v)){const d=Object.getOwnPropertyDescriptor(v,key);if('value'in d&&d.configurable){const child=freeze(d.value);Object.defineProperty(v,key,{enumerable:d.enumerable,configurable:true,get(){if(typeof key==='string'&&key.startsWith('_'))privateReads++;return child;},set(){mutationAttempts++;throw Error('Frozen observation write');}});}}Object.freeze(v);return v;}
  const result=freeze(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model));for(const k of['islands','pieces','bridges'])assert.ok(Object.isFrozen(result.model[k]));assert.ok(Object.isFrozen(result.model.islands[0])&&Object.isFrozen(result.model.pieces[0]));frozenObservations++;return result;
}
function consume(){assert.ok(pilotCalls+exportCalls<100,'Observation-call cap reached');}
function invoke(p,state,{variant='getters',mode='qa',label='fixture',expected}={}){
  consume();pilotCalls++;const row={label,tick:state.model.tick,phase:state.phase,stage:state.model.stage,selectedPieceId:state.model.selectedPieceId,heldPieceId:state.model.heldPieceId,placedCount:state.model.placedCount,undos:state.model.undos};
  try{const keys=p(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));assert.ok(Array.isArray(keys)&&keys.length<=1&&keys.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)));if(expected!==undefined)assert.deepEqual(keys,expected,label);if(keys[0]?.startsWith('Arrow'))directions++;if(keys.includes('Space'))actionEdges++;if(keys.includes('b'))backEdges++;trace.push({...row,keys:[...keys]});return keys;}
  catch(error){trace.push({...row,error:error.message});throw error;}
}
function external(fn,m,...rest){consume();exportCalls++;return fn(guarded({phase:m.phase,paused:false,model:m}).model,...rest);}
function add(name,details={}){checks.push({name,passed:true,...details});}
try{
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);report.afterImportHashes=await hashes();assert.deepEqual(report.afterImportHashes,before);assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){factories++;return api.createPilot();}
  add('pilot source import and source window remain pinned without production model execution');
  const normal=[{elapsed:0,keys:[]},{elapsed:.6,keys:['Space']},{elapsed:.6,keys:[]},{elapsed:.6,keys:[]},
    {elapsed:.7,stage:'source',keys:[]},{elapsed:.9,stage:'source',keys:['Space']},{elapsed:.9,stage:'source',keys:[]},
    {elapsed:1,stage:'target',keys:[]},{elapsed:1.2,stage:'target',keys:['ArrowRight']},{elapsed:1.2,stage:'target',keys:[]},
    {elapsed:1.3,stage:'target',selectedIsland:'B',keys:[]},{elapsed:1.4,stage:'target',selectedIsland:'B',keys:[]},
    {elapsed:1.6,stage:'target',selectedIsland:'B',keys:['Space']},{elapsed:1.6,stage:'target',selectedIsland:'B',keys:[]},
    {elapsed:1.7,bridges:[EDGE],selectedPiece:'P2',selectedIsland:'B',keys:[]}];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [i,row] of normal.entries()){
    const results=[];for(let j=0;j<3;j++){
      if(i===14&&j===2){const wrong={...EDGE,id:'bridge-P2',pieceId:'P2'};assert.throws(()=>invoke(paired[j],observation({...row,bridges:[wrong],selectedPiece:'P1'}),{label:'reject-equal-attribute-wrong-physical-ID'}),/Actual placement differs/);}
      results.push(invoke(paired[j],observation(row),{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.keys}));
    }assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
  }
  const diagnosis=paired[2].diagnostics();assert.equal(diagnosis.filter(r=>r.type==='observed-pickup').length,1);assert.equal(diagnosis.filter(r=>r.type==='observed-source').length,1);assert.equal(diagnosis.find(r=>r.type==='observed-placement').pieceId,'P1');
  const saved=clone(diagnosis);diagnosis.length=0;assert.deepEqual(paired[2].diagnostics(),saved);
  add('identical full three-stage commit histories yield identical keys across private variants and throwing getters',{pairedObservations:normal.length,variants:3});
  add('A edges release and wait for genuine pickup/source/preview/placement observations; an equal-attribute wrong physical ID is rejected');

  const record=factory(),attempt={pieceId:'P1',sourceId:'A',targetId:'B',accepted:true,reason:null,at:7.5,tick:450};
  const trial=[{elapsed:0,keys:[]},{elapsed:3,keys:['Space']},{elapsed:3,keys:[]},{elapsed:3.1,stage:'source',keys:[]},
    {elapsed:4.3,stage:'source',keys:['Space']},{elapsed:4.3,stage:'source',keys:[]},{elapsed:4.4,stage:'target',keys:[]},
    {elapsed:5.3,stage:'target',keys:['ArrowRight']},{elapsed:5.3,stage:'target',keys:[]},{elapsed:5.4,stage:'target',selectedIsland:'B',keys:[]},
    {elapsed:5.7,stage:'target',selectedIsland:'B',keys:[]},{elapsed:7.5,stage:'target',selectedIsland:'B',keys:['Space']},
    {elapsed:7.5,stage:'target',selectedIsland:'B',keys:[]},{elapsed:7.6,bridges:[EDGE],selectedPiece:'P2',lastPlacement:attempt,keys:[]},
    {elapsed:11.9,bridges:[EDGE],selectedPiece:'P2',lastPlacement:attempt,keys:['b']},{elapsed:11.9,bridges:[EDGE],selectedPiece:'P2',lastPlacement:attempt,keys:[]},
    {elapsed:12,undos:1,totalPlacements:1,placementAttempts:1,lastPlacement:attempt,lastUndo:{...EDGE,at:12,tick:720},keys:[]},
    {elapsed:16.3,undos:1,totalPlacements:1,placementAttempts:1,lastPlacement:attempt,keys:['Space']},
    {elapsed:16.3,undos:1,totalPlacements:1,placementAttempts:1,lastPlacement:attempt,keys:[]},
    {elapsed:16.4,stage:'source',undos:1,totalPlacements:1,placementAttempts:1,lastPlacement:attempt,keys:[]}];
  for(const [i,row] of trial.entries()){
    if(i===16)assert.throws(()=>invoke(record,observation({...row,selectedPiece:'P2'}),{mode:'record',label:'reject-undo-selecting-equal-attribute-other-ID'}),/Undo did not restore exact physical network/);
    invoke(record,observation(row),{mode:'record',label:'record-trial-undo-'+i,expected:row.keys});
  }
  const undone=record.diagnostics().find(r=>r.type==='observed-undo');assert.equal(undone.pieceId,'P1');assert.deepEqual(undone.availablePieceIds,['P1','P2']);assert.equal(undone.totalPlacements,1);assert.equal(undone.undos,1);
  assert.equal(record.diagnostics().filter(r=>r.type==='observed-pickup').length,2);
  add('bank B restores the same physical piece and empty network while lifetime placement/time remain spent, then the pilot repicks that ID',{syntheticObservations:trial.length,exactRestoredPieceId:'P1'});

  const cancel=factory();
  const backs=[{elapsed:5,stage:'target',selectedIsland:'C',source:'B',keys:[]},{elapsed:5.6,stage:'target',selectedIsland:'C',source:'B',keys:['b']},{elapsed:5.6,stage:'target',selectedIsland:'C',source:'B',keys:[]},
    {elapsed:5.7,stage:'source',selectedIsland:'B',cancels:1,keys:[]},{elapsed:6,stage:'source',selectedIsland:'B',cancels:1,keys:['b']},{elapsed:6,stage:'source',selectedIsland:'B',cancels:1,keys:[]},
    {elapsed:6.1,stage:'bank',selectedIsland:'B',cancels:2,keys:[]}];
  for(const [i,row] of backs.entries()){
    if(i===6)assert.throws(()=>invoke(cancel,observation({...row,selectedPiece:'P2',bridges:[],totalPlacements:1,undos:1}),{label:'reject-stage-cancel-that-undoes-existing-bridge'}),/Phase cancellation undid a physical bridge/);
    invoke(cancel,observation({bridges:[EDGE],selectedPiece:'P2',...row}),{label:'distinct-stage-B-'+i,expected:row.keys});
  }
  assert.deepEqual(cancel.diagnostics().filter(r=>r.type==='observed-cancel').map(r=>r.stage),['source','bank']);
  add('target B and source B only cancel one stage; neither may undo the existing physical network');

  const isolated=[factory(),factory()];
  for(let i=0;i<2;i++)invoke(isolated[i],observation({selectedPiece:'P2',bridges:i?[EDGE]:[]}),{label:'factory-start-'+i,expected:[]});
  for(let i=0;i<2;i++)invoke(isolated[i],observation({selectedPiece:'P2',bridges:i?[EDGE]:[],elapsed:.6}),{label:'factory-separate-inventory-'+i,expected:i?['Space']:['ArrowLeft']});
  for(let i=0;i<2;i++)invoke(isolated[i],observation({selectedPiece:'P2',bridges:i?[EDGE]:[],elapsed:.6}),{label:'factory-release-'+i,expected:[]});
  add('interleaved factories retain independent bridge inventories and spatial bank decisions');
  invoke(isolated[0],observation({paused:true,elapsed:.6}),{label:'pause-neutral',expected:[]});
  invoke(isolated[0],observation({runtimePhase:'menu',elapsed:.6}),{label:'menu-neutral',expected:[]});
  invoke(isolated[0],observation({runtimePhase:'won',elapsed:.6}),{label:'constructed-terminal-control-neutral',expected:[]});
  invoke(isolated[0],observation(),{label:'retry-clock-rollback',expected:[]});
  invoke(isolated[0],observation({elapsed:.6}),{label:'retry-fresh-pick',expected:['Space']});
  assert.equal(isolated[0].diagnostics().filter(r=>r.type==='observed-round').length,1);
  add('pause menu constructed terminal and retry preserve neutral/reset input semantics');

  const initial=observation().model,partial=observation({bridges:[EDGE],selectedPiece:'P2'}).model;
  const copy=external(api.publicNetwork,partial);assert.deepEqual(copy,[EDGE]);copy[0].pieceId='changed';assert.equal(partial.bridges[0].pieceId,'P1');
  const actual=external(api.evaluateNetwork,partial);assert.deepEqual(actual.availablePieceIds,['P2']);assert.equal(actual.componentCount,2);assert.deepEqual(actual.incidentPieceIds,{A:['P1'],B:['P1'],C:[]});
  const placement=external(api.predictPlacement,partial,'P2','B','C');assert.equal(placement.valid,true);assert.equal(placement.wouldFinish,true);assert.equal(placement.wouldConnectAll,true);assert.equal(placement.bridge.pieceId,'P2');
  assert.equal(external(api.predictPlacement,partial,'P1','B','C').reason,'piece-unavailable');
  const plan=external(api.planVisibleState,initial);assert.equal(plan.found,true);assert.equal(plan.placements.length,2);assert.deepEqual(plan.placements.map(p=>p.pieceId).sort(),['P1','P2']);
  const bounded=external(api.planVisibleState,initial,{maxExpanded:1,maxMilliseconds:1000});assert.equal(bounded.found,false);assert.equal(bounded.reason,'node-cap');assert.equal(bounded.expanded,1);
  assert.throws(()=>external(api.planVisibleState,initial,{maxMilliseconds:Infinity}),/explicit bounded/);
  assert.equal(external(api.predictFocus,observation({selectedPiece:'P2'}).model,'W'),'P1');
  assert.deepEqual(external(api.focusPath,observation({stage:'source'}).model,'C'),['E','E']);
  assert.throws(()=>external(api.evaluateNetwork,initial,[EDGE,EDGE]),/instance used twice/);
  const disconnected=observation({pointFacts:[{id:'A',gx:0,gy:0,color:'gold'},{id:'B',gx:3,gy:0,color:'gold'},{id:'C',gx:0,gy:4,color:'gold'},{id:'D',gx:8,gy:5,color:'gold'}],
    pieceFacts:[{id:'P1',length:3,targetColor:'gold'},{id:'P2',length:4,targetColor:'gold'},{id:'P3',length:5,targetColor:'gold'}]}).model;
  const cycle=external(api.planVisibleState,disconnected,{goal:'disconnected'});assert.equal(cycle.found,true);assert.equal(cycle.placements.length,3);
  assert.deepEqual([...new Set(cycle.placements.flatMap(p=>[p.sourceId,p.targetId]))].sort(),['A','B','C']);
  for(const id of ['A','B','C'])assert.equal(cycle.placements.filter(p=>p.sourceId===id||p.targetId===id).length,2);
  add('bounded public exports preserve duplicate-attribute IDs, actual component effects, spatial focus and an explicit cycle-plus-isolated-island target',{exportFixtureCalls:11,disconnectedSyntheticIslandCount:4,noFullRuleEnumeration:true});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(directions>0&&actionEdges>0&&backEdges>0);add('all public observations remain deeply frozen with zero private reads or writes');
  report.passed=true;
}catch(error){report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;}
finally{
  report.endHashes=await hashes();report.reviewScriptEndSha256=hash(await readFile(script));report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or reviewer changed during execution'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,observationCallLimit:100,factoriesCreated:factories,deepFrozenObservations:frozenObservations,
    privateReads,mutationAttempts,meaningfulDirectionOutputs:directions,pickSourceCommitEdgeOutputs:actionEdges,cancelUndoEdgeOutputs:backEdges,
    inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,calledExports:['createPilot','publicNetwork','evaluateNetwork','predictPlacement','planVisibleState','predictFocus','focusPath']});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
