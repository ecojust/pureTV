#!/usr/bin/env node
// Synthetic public observations only. Production model bytes are hashed, never parsed or executed.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const args={};for(let i=2;i<process.argv.length;i+=2){assert.ok(['--app','--output','--expected-pilot'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
assert.match(args['expected-pilot']||'',/^[a-f0-9]{64}$/);
const script=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(script),'..')),output=path.resolve(args.output||path.join(path.dirname(script),'report.json'));
const files=['tests/automation.mjs','src/main/assets/game-model.js','docs/model-contract.md','tests/independent-loop-math.mjs','tests/independent-loop-board.mjs'];
const hash=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
async function hashes(){return Object.fromEntries(await Promise.all(files.map(async name=>[name,hash(await readFile(path.join(app,name)))])));}
const before=await hashes(),scriptBefore=hash(await readFile(script));assert.equal(before[files[0]],args['expected-pilot']);
assert.equal(before[files[3]],'d108d387fd2d28293b2879dcde34d5768bccd31323ca61c413e42dff44c82667');
assert.equal(before[files[4]],'de43d289a62018f314e1369374e8d1d69d2b1caad4eb364cc75e49950afade93');
const pilotSource=await readFile(path.join(app,files[0]),'utf8');assert.ok(!/^\s*import\s/m.test(pilotSource)&&!/\bimport\s*\(/.test(pilotSource),'Unexpected pilot dependency');
const privateKeys=['_accumulator','_lastA','_lastB','_pendingA','_pendingB','_heldDirection','_nextMoveTick','_cancelEpoch','_solution','_referenceLoop','_authorWitness','_futureInputs','_private'];
let pilotCalls=0,exportCalls=0,factories=0,diagnosticCalls=0,privateReads=0,mutationAttempts=0,frozenObservations=0,directions=0,actionEdges=0,backEdges=0;
const checks=[],trace=[],report={kind:'independent-synthetic-public-loop-pilot-review',passed:false,sourceHashes:before,expectedPilotSha256:args['expected-pilot'],reviewScriptSha256:scriptBefore,
  productionModelImported:false,productionModelStepCalled:false,productionModelSourceRead:false,modelBytesHashedOnly:true,authorReferenceRoutesRead:false,normalGameWinsClaimed:0,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false,
  privateTrapNames:privateKeys,privateTrapNameSource:'Declared bookkeeping and hypothetical hidden fields; not extracted from production model source.',checks,
  harnessCorrection:{scope:'The first run stopped at a hand-written shortest-path tie expectation. E1 to E4 has two equally short routes; the public pilot BFS orders N/E/S/W and selects Right via E14, not Down via E13. Only that expected key and the next two selectedId observations were corrected; predictFocus(S)=E13 remains independently asserted.',previousScript:{file:'review-pre-navigation-fixture.mjs',sha256:'75857e6282a7476b0623f0f46dfe9409c281bfd1463f5e33bfb8ddffe18521ff'},previousReport:{file:'report-pre-navigation-fixture.json',sha256:'67d01582e1e5787c1816b8f78870a8022cdd76c56e6292f4bd28602accc6ab08',passed:false},productionChanged:false},
  scope:'A hand-constructed NW unit-square target with trees V1/V6 and flower V16, and all nine numeric boundary clues independently derived from that square. This differs from the authored partially hinted boards. Only public synthetic observations are supplied; the reviewed public pilot/planner and independent pure geometry cache derivation execute. No production Model source is read, no create/step or author witness is used, and no normal gameplay/browser/device success is claimed.'};
let core,boardMath,g,targetMask;
const edit=(kind,edgeId,pipeId,at)=>({kind,edgeId,beforePipeId:kind==='place'?null:pipeId,afterPipeId:kind==='place'?pipeId:null,at,tick:Math.round(at*60)});
function observation({elapsed=1,assignments=[],selectedId='E1',history=[],undos=0,placements=history.filter(h=>h.kind==='place').length,removals=history.filter(h=>h.kind==='remove').length,
  totalEdits=placements+removals,blockedPlacements=0,editAttempts=totalEdits+blockedPlacements,lastEdit=history.at(-1)??null,lastUndo=null,submissions=0,mistakes=0,phase='playing',runtimePhase=phase,paused=false,clues=core.boundaryCounts(targetMask)}={}) {
  const requiredTreeIds=['V1','V6'],forbiddenFlowerIds=['V16'];
  const base={grid:{cols:4,rows:4,x:156,y:102,spacing:108},pipeStock:16,requiredTreeIds,forbiddenFlowerIds,
    vertices:g.nodes.map(n=>({id:'V'+(n.id+1),col:n.x,row:n.y,x:156+n.x*108,y:102+n.y*108,role:requiredTreeIds.includes('V'+(n.id+1))?'tree':forbiddenFlowerIds.includes('V'+(n.id+1))?'flower':'junction'})),
    edges:g.edges.map(e=>{const physical=assignments.find(a=>a.edgeId==='E'+(e.id+1));return{id:'E'+(e.id+1),aId:'V'+(e.a+1),bId:'V'+(e.b+1),orientation:e.axis==='h'?'horizontal':'vertical',x:156+(g.nodes[e.a].x+g.nodes[e.b].x)*54,y:102+(g.nodes[e.a].y+g.nodes[e.b].y)*54,
      plotIds:g.faces.filter(f=>f.edgeIds.includes(e.id)).map(f=>'R'+(f.id+1)),selected:!!physical,pipeId:physical?.pipeId??null};}),
    plots:g.faces.map(f=>({id:'R'+(f.id+1),col:f.x,row:f.y,x:156+(f.x+.5)*108,y:102+(f.y+.5)*108,boundaryEdgeIds:f.edgeIds.map(id=>'E'+(id+1)),clue:clues[f.id]}))};
  assert.equal(new Set(assignments.map(a=>a.edgeId)).size,assignments.length);assert.equal(new Set(assignments.map(a=>a.pipeId)).size,assignments.length);
  const e=boardMath.evaluatePublicBoard(base),{reason,withinStock,...facts}=e.summary;
  const pipes=Array.from({length:16},(_,i)=>({id:'P'+(i+1),edgeId:assignments.find(a=>a.pipeId==='P'+(i+1))?.edgeId??null})),availablePipeIds=pipes.filter(p=>p.edgeId===null).map(p=>p.id);
  const pump={id:'pump',kind:'submit',x:790,y:414},focusItems=[...base.edges.map(e=>({id:e.id,kind:'edge',x:e.x,y:e.y})),pump],cursor=clone(focusItems.find(p=>p.id===selectedId));assert.ok(cursor);
  const m={...base,...facts,width:960,height:540,seed:1,level:1,difficulty:0,levelName:'Synthetic complete-clue NW square',phase,
    vertices:base.vertices.map((v,i)=>({...v,...e.vertices[i]})),plots:base.plots.map((p,i)=>({...p,...e.plots[i]})),pipes,availablePipeIds,pipesRemaining:16-assignments.length,components:e.components,
    pump,focusItems,selectedId,cursor,history:clone(history),historyDepth:history.length,totalEdits,placements,removals,undos,editAttempts,blockedPlacements,lastEdit:clone(lastEdit),lastUndo:clone(lastUndo),lastAction:null,events:[],
    submissions,mistakes,maxMistakes:3,lastSubmission:null,tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,
    score:e.summary.pipeCount*10+e.summary.matchedClueCount*25+e.summary.treesCovered*20+(phase==='won'?1000+Math.floor(90-elapsed)*5:0),message:'Synthetic public pipe observation',lostReason:null};
  return {phase:runtimePhase,paused,model:m};
}
function guarded(value,variant='getters') {
  const input=clone(value);
  for(const owner of [input,input.model,...input.model.edges,...input.model.pipes,...input.model.vertices])for(const name of privateKeys){
    if(variant==='getters')Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw Error('Private getter read: '+name);}});
    else owner[name]=variant==='a'?{answer:['E1'],pipes:['P1']}:{answer:['E24','E2'],pipes:['P16']};
  }
  function freeze(v){if(v===null||typeof v!=='object')return v;for(const key of Reflect.ownKeys(v)){const d=Object.getOwnPropertyDescriptor(v,key);if('value'in d&&d.configurable){const child=freeze(d.value);Object.defineProperty(v,key,{enumerable:d.enumerable,configurable:true,get(){if(typeof key==='string'&&key.startsWith('_'))privateReads++;return child;},set(){mutationAttempts++;throw Error('Frozen observation write');}});}}Object.freeze(v);return v;}
  const result=freeze(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model));for(const key of ['vertices','edges','plots','pipes','history','focusItems'])assert.ok(Object.isFrozen(result.model[key]));assert.ok(Object.isFrozen(result.model.edges[0])&&Object.isFrozen(result.model.pipes[0])&&Object.isFrozen(result.model.plots[0]));frozenObservations++;return result;
}
function consume(){assert.ok(pilotCalls+exportCalls+factories+diagnosticCalls<100,'Hard 100 reviewed-API-call limit reached');}
function invoke(p,state,{variant='getters',mode='qa',label='fixture',expected}={}) {
  consume();pilotCalls++;const row={label,tick:state.model.tick,phase:state.phase,selectedId:state.model.selectedId,assignments:state.model.edges.filter(e=>e.selected).map(e=>({edgeId:e.id,pipeId:e.pipeId})),totalEdits:state.model.totalEdits,undos:state.model.undos};
  try{const keys=p(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));assert.ok(Array.isArray(keys)&&keys.length<=1&&keys.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)));if(expected!==undefined)assert.deepEqual(keys,expected,label);if(keys[0]?.startsWith('Arrow'))directions++;if(keys.includes('Space'))actionEdges++;if(keys.includes('b'))backEdges++;trace.push({...row,keys:[...keys]});return keys;}
  catch(error){trace.push({...row,error:error.message});throw error;}
}
function external(fn,m,...rest){consume();exportCalls++;return fn(guarded({phase:m.phase,paused:false,model:m}).model,...rest);}
function add(name,details={}){checks.push({name,passed:true,...details});}
try {
  core=await import(pathToFileURL(path.join(app,files[3])).href+'?review='+before[files[3]]);boardMath=await import(pathToFileURL(path.join(app,files[4])).href+'?review='+before[files[4]]);
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);g=core.geometry();targetMask=g.faces[0].mask;
  report.afterImportHashes=await hashes();assert.deepEqual(report.afterImportHashes,before);assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){consume();factories++;return api.createPilot();}function diagnosis(p){consume();diagnosticCalls++;return p.diagnostics();}
  add('only pinned public pilot and pure independent math are imported; model bytes are hashed without source inspection');
  const first=edit('place','E1','P1',1.6),placed=[{edgeId:'E1',pipeId:'P1'}];
  const normal=[{elapsed:1,expected:[]},{elapsed:1.4,expected:[]},{elapsed:1.6,expected:['Space']},{elapsed:1.6,expected:[]},{elapsed:1.6,expected:[]},{elapsed:1.9,expected:[]},{elapsed:3.4,assignments:placed,history:[first],expected:[]}];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [i,row] of normal.entries()){
    const outcomes=[];
    for(let j=0;j<3;j++){
      if(i===6&&j===2)assert.throws(()=>invoke(paired[j],observation({...row,assignments:[{edgeId:'E1',pipeId:'P2'}],history:[edit('place','E1','P2',1.6)]}),{label:'negative-P2-while-lowest-free-P1-was-required'}),/Actual edit did not preserve exact pipe ID/);
      outcomes.push(invoke(paired[j],observation(row),{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.expected}));
    }assert.deepEqual(outcomes[0],outcomes[1]);assert.deepEqual(outcomes[1],outcomes[2]);
  }
  invoke(paired[2],observation({elapsed:3.6,assignments:placed,history:[first]}),{label:'continue-after-real-placement-direction',expected:['ArrowRight']});
  invoke(paired[2],observation({elapsed:3.6,assignments:placed,history:[first]}),{label:'navigation-release',expected:[]});
  assert.throws(()=>invoke(paired[2],observation({elapsed:3.7,selectedId:'E14'}),{label:'negative-navigation-mutated-pipe-inventory'}),/Navigation changed actual pipe inventory/);
  invoke(paired[2],observation({elapsed:3.7,selectedId:'E14',assignments:placed,history:[first]}),{label:'observed-real-navigation',expected:[]});
  const pd=diagnosis(paired[2]);assert.equal(pd.filter(r=>r.type==='observed-edit').length,1);assert.equal(pd.find(r=>r.type==='observed-edit').afterPipeId,'P1');assert.ok(!pd.some(r=>r.type==='unobserved-input-retry'));
  const copy=clone(pd);pd.length=0;assert.deepEqual(diagnosis(paired[2]),copy);
  add('three factories produce identical keys for paired public histories despite private variants; late real receipt is accepted and stale ticks release',{pairedObservations:7,variants:3,lateReceiptObservedAfterSeconds:1.8});
  add('lowest-free physical P1 and unchanged inventory during navigation are required; misleading P2 observations are rejected');
  const record=factory(),trialPlace=edit('place','E4','P1',4.5),trialRemove=edit('remove','E4','P1',9.8),one=[{edgeId:'E4',pipeId:'P1'}],undo={edit:clone(trialRemove),at:14.3,tick:858};
  const recordRows=[{elapsed:1,expected:[]},{elapsed:3.6,expected:[]},{elapsed:4.5,expected:['Space']},{elapsed:4.5,expected:[]},
    {elapsed:4.6,assignments:one,history:[trialPlace],expected:[]},{elapsed:8.9,assignments:one,history:[trialPlace],expected:[]},
    {elapsed:9.8,assignments:one,history:[trialPlace],expected:['Space']},{elapsed:9.8,assignments:one,history:[trialPlace],expected:[]},
    {elapsed:9.9,history:[trialPlace,trialRemove],expected:[]},{elapsed:14.2,history:[trialPlace,trialRemove],expected:['b']},{elapsed:14.2,history:[trialPlace,trialRemove],expected:[]},
    {elapsed:14.3,assignments:one,history:[trialPlace],placements:1,removals:1,undos:1,lastEdit:trialRemove,lastUndo:undo,expected:[]}];
  for(const [i,row] of recordRows.entries()){
    if(i===11)assert.throws(()=>invoke(record,observation({selectedId:'E4',...row,assignments:[{edgeId:'E4',pipeId:'P2'}]}),{mode:'record',label:'negative-undo-restoring-P2-instead-of-removed-P1'}),/Undo must restore the removed physical pipe/);
    invoke(record,observation({selectedId:'E4',...row}),{mode:'record',label:'record-place-remove-undo-'+i,expected:row.expected});
  }
  const rd=diagnosis(record);assert.deepEqual(rd.filter(r=>r.type==='observed-edit').map(r=>[r.kind,r.edgeId,r.beforePipeId,r.afterPipeId]),[['place','E4',null,'P1'],['remove','E4','P1',null]]);
  const restored=rd.find(r=>r.type==='observed-undo-removal');assert.equal(restored.pipeId,'P1');assert.equal(restored.totalEdits,2);assert.equal(restored.undos,1);assert.deepEqual(restored.assignments,one);
  add('record protocol observes A placement, A removal and B restoration of the same P1 and edge without refunding lifetime counts',{syntheticObservations:recordRows.length,edgeId:'E4',pipeId:'P1',notNormalGameplay:true});
  const ready=factory(),retry=factory(),targetIds=['E1','E4','E13','E14'],targetAssignments=targetIds.map((edgeId,i)=>({edgeId,pipeId:'P'+(i+1)})),targetHistory=targetIds.map((edgeId,i)=>edit('place',edgeId,'P'+(i+1),i+1));
  invoke(ready,observation({elapsed:10,assignments:targetAssignments,history:targetHistory,selectedId:'pump'}),{label:'ready-factory-start',expected:[]});
  invoke(retry,observation(),{label:'unobserved-factory-start',expected:[]});
  invoke(ready,observation({elapsed:10.4,assignments:targetAssignments,history:targetHistory,selectedId:'pump'}),{label:'ready-inspection-is-not-automatic-victory',expected:[]});
  invoke(retry,observation({elapsed:1.4}),{label:'unobserved-edit-preview',expected:[]});
  invoke(ready,observation({elapsed:10.7,assignments:targetAssignments,history:targetHistory,selectedId:'pump'}),{label:'explicit-PUMP-edge',expected:['Space']});
  invoke(retry,observation({elapsed:1.6}),{label:'unobserved-edit-edge',expected:['Space']});
  invoke(ready,observation({elapsed:10.7,assignments:targetAssignments,history:targetHistory,selectedId:'pump'}),{label:'PUMP-release',expected:[]});
  invoke(retry,observation({elapsed:1.6}),{label:'unobserved-edit-release',expected:[]});
  invoke(retry,observation({elapsed:1.6,paused:true}),{label:'pause-does-not-reemit',expected:[]});
  invoke(retry,observation({elapsed:1.7}),{label:'unchanged-observation-does-not-fabricate-placement',expected:[]});
  invoke(retry,observation({elapsed:3.3}),{label:'unobserved-edit-timeout-remains-neutral',expected:[]});
  invoke(retry,observation({elapsed:3.6}),{label:'only-same-unobserved-E1-edit-is-retried',expected:['Space']});
  for(const runtimePhase of ['menu','won'])invoke(ready,observation({elapsed:10.7,runtimePhase}),{label:'constructed-runtime-neutral-'+runtimePhase,expected:[]});
  invoke(ready,observation({elapsed:0}),{label:'fresh-retry-clock-rollback',expected:[]});
  invoke(ready,observation({elapsed:.4}),{label:'fresh-retry-preview-not-stale-PUMP',expected:[]});
  invoke(ready,observation({elapsed:.5}),{label:'fresh-retry-new-E1-placement',expected:['Space']});
  add('interleaved factories keep PUMP and unfinished-edit tasks isolated; pause/menu gates are neutral and retry cannot retain a stale submission');
  add('an unobserved or canceled transport edge never fabricates progress: after timeout it may only retry the still-missing same edit',{scope:'Unchanged synthetic observation models a lost/canceled transport action. No production cancelEpoch handling or runtime keyboard cancellation is claimed.'});
  const empty=observation().model,partial=observation({elapsed:5,assignments:[{edgeId:'E3',pipeId:'P2'}],history:[edit('place','E2','P1',1),edit('place','E3','P2',2),edit('remove','E2','P1',3)]}).model;
  const target=observation({elapsed:5,assignments:targetAssignments,history:targetHistory}).model;
  const detached=external(api.publicAssignments,partial);assert.deepEqual(detached,[{edgeId:'E3',pipeId:'P2'}]);detached[0].pipeId='changed';assert.equal(partial.edges[2].pipeId,'P2');
  const evaluated=external(api.evaluateNetwork,empty);for(const key of ['components','clueCount','matchedClueCount','allCluesMet','goalReady','treesCovered','checks'])assert.deepEqual(evaluated[key],empty[key]);assert.equal(empty.matchedClueCount,6);assert.equal(empty.score,150);
  const predicted=external(api.predictEdit,partial,'E1');assert.equal(predicted.afterPipeId,'P1');assert.equal(predicted.after.physicalAssignments.find(a=>a.edgeId==='E3').pipeId,'P2');
  const removal=external(api.predictEdit,partial,'E3');assert.equal(removal.beforePipeId,'P2');assert.equal(removal.afterPipeId,null);assert.equal(removal.after.pipesRemaining,16);
  const planned=external(api.planVisibleState,empty);assert.equal(planned.found,true);assert.deepEqual(planned.targetEdgeIds,targetIds);assert.equal(planned.evaluation.goalReady,true);
  const bounded=external(api.planVisibleState,empty,{maxExpanded:1,maxMilliseconds:1000});assert.equal(bounded.found,false);assert.equal(bounded.reason,'node-cap');assert.equal(bounded.expanded,1);
  assert.throws(()=>external(api.planVisibleState,empty,{maxMilliseconds:Infinity}),/public search goal\/caps/);
  assert.throws(()=>external(api.evaluateInventory,partial,[{edgeId:'E1',pipeId:'P1'},{edgeId:'E2',pipeId:'P1'}]),/duplicates or loses a physical instance/);
  assert.equal(external(api.predictFocus,empty,'S'),'E13');assert.ok(external(api.focusPath,empty,'pump').length>0);
  external(api.assertPublicNetwork,partial,assert);external(api.assertPublicNetwork,target,assert);
  const fullAssignments=Array.from({length:16},(_,i)=>({edgeId:'E'+(i+1),pipeId:'P'+(i+1)})),fullHistory=fullAssignments.map((a,i)=>edit('place',a.edgeId,a.pipeId,(i+1)/60));
  const full=observation({elapsed:1,assignments:fullAssignments,history:fullHistory}).model,blocked=external(api.predictEdit,full,'E17');assert.equal(blocked.accepted,false);assert.equal(blocked.reason,'stock');
  const removable=external(api.predictEdit,full,'E1');assert.equal(removable.accepted,true);assert.equal(removable.kind,'remove');assert.equal(removable.after.availablePipeIds[0],'P1');
  const nullable=observation({clues:[null,...core.boundaryCounts(targetMask).slice(1)]}).model,ne=external(api.evaluateNetwork,nullable);assert.equal(ne.clueCount,8);assert.equal(ne.matchedClueCount,6);assert.equal(ne.plots[0].matched,null);
  add('public exports preserve lowest free IDs, finite stock/removal, zero versus null clues, full public target, cap rejection and spatial focus',{exportScope:'Handmade NW-square board plus explicit full-stock and nullable-clue boundaries; no authored goal is used.'});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(directions>0&&actionEdges>0&&backEdges>0);add('every observed snapshot is deeply frozen with zero private reads or mutations');report.passed=true;
}catch(error){report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;}
finally {
  report.endHashes=await hashes();report.reviewScriptEndSha256=hash(await readFile(script));report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source/reviewer changed during execution'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,reviewedApiCallsIncludingFactoriesAndDiagnostics:pilotCalls+exportCalls+factories+diagnosticCalls,callLimit:100,factoriesCreated:factories,diagnosticCalls,deepFrozenObservations:frozenObservations,privateReads,mutationAttempts,
    meaningfulDirectionOutputs:directions,editSubmitEdgeOutputs:actionEdges,undoEdgeOutputs:backEdges,inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,
    calledExports:['createPilot','publicAssignments','evaluateNetwork','evaluateInventory','predictEdit','planVisibleState','predictFocus','focusPath','assertPublicNetwork'],
    syntheticBoard:{target:'NW unit-square loop',requiredTreeIds:['V1','V6'],forbiddenFlowerIds:['V16'],allNineClues:core?.boundaryCounts(targetMask),physicalPipeStock:16}});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,totalReviewedApiCalls:report.reviewedApiCallsIncludingFactoriesAndDiagnostics,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
