#!/usr/bin/env node
// Bounded synthetic public-observer fixtures, never production Model/create/step.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const args={};
for(let i=2;i<process.argv.length;i+=2){assert.ok(['--app','--output','--expected-pilot'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
assert.match(args['expected-pilot']||'',/^[a-f0-9]{64}$/,'Explicit stable pilot SHA required');
const script=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(script),'..'));
const output=path.resolve(args.output||path.join(path.dirname(script),'report.json'));
const files=['tests/automation.mjs','src/main/assets/game-model.js','docs/model-contract.md'];
const hash=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
async function hashes(){return Object.fromEntries(await Promise.all(files.map(async n=>[n,hash(await readFile(path.join(app,n)))])))}
const before=await hashes(),scriptBefore=hash(await readFile(script));assert.equal(before[files[0]],args['expected-pilot']);
const pilotSource=await readFile(path.join(app,files[0]),'utf8'),modelSource=await readFile(path.join(app,files[1]),'utf8');
const privateKeys=[...new Set([...modelSource.matchAll(/\b_[A-Za-z][A-Za-z0-9_]*/g)].map(m=>m[0]).concat(['_answerMask','_solution','_futureInputs','wallMask','floorMask','trueMap','referencePath','hiddenWalls']))].sort();
const cellPrivateKeys=['wall','isWall','passable','truth'];
assert.ok(!/^\s*import\s/m.test(pilotSource)&&!/\bimport\s*\(/.test(pilotSource),'Pilot declares an unexpected dependency');
let pilotCalls=0,exportCalls=0,privateReads=0,mutationAttempts=0,frozenObservations=0,factories=0,directions=0,actionEdges=0,backEdges=0;
const checks=[],trace=[];
const report={kind:'independent-synthetic-public-corridor-pilot-review',passed:false,expectedPilotSha256:args['expected-pilot'],sourceHashes:before,reviewScriptSha256:scriptBefore,
  productionModelImported:false,productionModelStepCalled:false,productionModelSourceReadOnlyForHashAndPrivateKeyNames:true,normalGameWinsClaimed:0,
  browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false,privateKeys,cellPrivateKeys,checks,
  scope:'Hand-authored public observation histories using published row clues and hypothetical probe outcomes. Constructed probe/route/terminal snapshots test observer and input protocols, not production transitions, actual games, footage or devices. No production model create/step, true layout, authoring report or reference route is used. The reviewed public pilot and its own public inference/planner are executed; the full mathematical proof remains separate.'};

// All knowledge here is explicitly supplied public observation data. There is
// no hidden map behind these fixtures, and no transition engine is implemented.
function observation({elapsed=0,selected=6,probeCursor=selected,mode='probe',route=[0],probes=[],lastProbe=null,
  modeSwitches=0,routeMoves=route.length-1,backtracks=0,phase='playing',runtimePhase=phase,paused=false,
  rowOpenCounts=[2,2,2,2],submissions=0,lastSubmission=null}={}){
  const cells=Array.from({length:16},(_,id)=>{const p=probes.find(p=>p.cellId===id);return{id,col:id%4,row:Math.floor(id/4),x:110+(id%4+.5)*84,y:106+(Math.floor(id/4)+.5)*84,
    role:id===0?'entry':id===15?'exit':null,knowledge:p?p.result:id===0||id===15?'open':'unknown',probed:!!p};});
  const point=id=>Object.fromEntries(['id','col','row','x','y'].map(k=>[k,cells[id][k]]));
  const used=probes.length,edges=route.length-1,current=mode==='route'?route.at(-1):probeCursor;
  const model={width:960,height:540,grid:{cols:4,rows:4,x:110,y:106,cellSize:84},rowClueX:480,level:1,difficulty:0,levelName:'Synthetic public survey',phase,
    cells,entry:point(0),exit:point(15),rowOpenCounts:[...rowOpenCounts],requiredDistance:6,
    mode,probeCursorId:probeCursor,selectedId:current,cursor:point(current),
    path:route.map(id=>({cellId:id,col:cells[id].col,row:cells[id].row,x:cells[id].x,y:cells[id].y})),visited:cells.map(c=>route.includes(c.id)),
    pathEdges:edges,lengthMatches:edges===6,atExit:route.at(-1)===15,
    probeBudget:3,probesUsed:used,probesRemaining:3-used,revealedCount:used+2,probeLog:clone(probes),probeAttempts:used,repeatedProbes:0,blockedProbes:0,lastProbe:clone(lastProbe),
    submissions,totalWrong:0,exhaustedStrikes:0,maxExhaustedStrikes:3,lastSubmission:clone(lastSubmission),routeMoves,backtracks,modeSwitches,
    lastAction:null,events:[],tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,
    score:used*40+Math.min(edges,6)*10+(phase==='won'?1000+(3-used)*100+Math.floor(90-elapsed)*5:0),message:'Synthetic public observation',lostReason:null};
  return{phase:runtimePhase,paused,model};
}
const log=(cellId,result,at)=>({cellId,result,at,tick:Math.round(at*60)});
const highlight=p=>({cellId:p.cellId,result:p.result,charged:true,reason:'revealed',at:p.at,expiresAt:p.at+.6});
const FIRST=log(6,'open',80/60),KNOWN=[log(6,'open',8),log(11,'open',9)];
const SAFE_ROUTE=[0,1,5,6,10,11,15]; // A publicly deduced route for the explicit two-probe history, not an authored solution.

function guarded(value,variant='getters'){
  const input=clone(value),privateOwners=new WeakMap();
  for(const [owner,names] of [[input,privateKeys],[input.model,privateKeys],...input.model.cells.map(c=>[c,cellPrivateKeys])]){
    privateOwners.set(owner,new Set(names));
    for(const name of names){
      if(variant==='getters')Object.defineProperty(owner,name,{enumerable:true,configurable:true,get(){privateReads++;throw Error('Private getter read: '+name);}});
      else owner[name]=variant==='a'?{mask:123,route:[2,3]}:{mask:54321,route:[14,13]};
    }
  }
  function wrap(v){
    if(v===null||typeof v!=='object')return v;
    for(const key of Reflect.ownKeys(v)){
      const d=Object.getOwnPropertyDescriptor(v,key);
      if('value'in d&&d.configurable){const child=wrap(d.value);Object.defineProperty(v,key,{enumerable:d.enumerable,configurable:true,
        get(){if(privateOwners.get(v)?.has(key))privateReads++;return child;},set(){mutationAttempts++;throw Error('Frozen snapshot write');}});}
    }
    Object.freeze(v);return v;
  }
  const result=wrap(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model)&&Object.isFrozen(result.model.cells)&&Object.isFrozen(result.model.cells[0]));
  assert.ok(Object.isFrozen(result.model.path)&&Object.isFrozen(result.model.probeLog)&&Object.isFrozen(result.model.grid));frozenObservations++;return result;
}
function consume(){assert.ok(pilotCalls+exportCalls<100,'Observation-call cap reached');}
function invoke(pilot,state,{variant='getters',mode='qa',label='fixture',expected}={}){
  consume();pilotCalls++;const entry={label,tick:state.model.tick,phase:state.phase,mode:state.model.mode,selectedId:state.model.selectedId,probesUsed:state.model.probesUsed,pathEdges:state.model.pathEdges};
  try{const keys=pilot(guarded(state,variant),Object.freeze({mode,elapsed:state.model.elapsed}));
    assert.ok(Array.isArray(keys)&&keys.length<=1&&keys.every(k=>['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','b'].includes(k)));
    if(expected!==undefined)assert.deepEqual(keys,expected,label);
    if(keys[0]?.startsWith('Arrow'))directions++;if(keys.includes('Space'))actionEdges++;if(keys.includes('b'))backEdges++;
    trace.push({...entry,keys:[...keys]});return keys;
  }catch(error){trace.push({...entry,error:error.message});throw error;}
}
function external(fn,model,...rest){consume();exportCalls++;return fn(guarded({phase:model.phase,paused:false,model}).model,...rest);}
function add(name,details={}){checks.push({name,passed:true,...details});}

try{
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);
  report.afterImportHashes=await hashes();assert.deepEqual(report.afterImportHashes,before);assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){factories++;return api.createPilot();}
  add('pilot import and public-source window are pinned without production model execution');
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  const history=[{elapsed:0,keys:[]},{elapsed:1.1,keys:[]},{elapsed:1.3,keys:['Space']},{elapsed:1.3,keys:[]},{elapsed:1.3,keys:[]},
    {elapsed:1.4,probes:[FIRST],lastProbe:highlight(FIRST),keys:[]}];
  for(const [i,row] of history.entries()){
    const results=paired.map((p,j)=>invoke(p,observation(row),{variant:variants[j],label:'paired-'+i+'-'+variants[j],expected:row.keys}));
    assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
  }
  const observed=paired[2].diagnostics(),gain=observed.find(r=>r.type==='observed-information-gain');
  assert.equal(gain.cellId,6);assert.equal(gain.candidatesBefore,9);assert.equal(gain.candidatesAfter,5);
  const saved=clone(observed);observed.length=0;assert.deepEqual(paired[2].diagnostics(),saved);
  add('equal public probe histories produce identical keys across private root/model/cell variants and throwing getters',{pairedObservations:history.length,variants:3});
  add('ordinary A releases immediately, waits for a later neutral tick, and records public information gain with isolated diagnostics',{candidatesBefore:9,candidatesAfter:5});

  function prime(p,label){for(const [elapsed,keys] of [[0,[]],[1.1,[]],[1.3,['Space']],[1.3,[]]])invoke(p,observation({elapsed}),{label:label+'-'+elapsed,expected:keys});}
  const delayed=log(6,'open',2),late=factory();prime(late,'late');
  invoke(late,observation({elapsed:2.7,probes:[delayed],lastProbe:null}),{label:'late-valid-charged-event',expected:[]});
  assert.equal(late.diagnostics().filter(r=>r.type==='observed-information-gain').length,1);
  add('delayed charged probe progress remains valid after feedback expiry measured from permanent log.at',{issuedAt:1.3,chargedAt:2,observedAt:2.7,lastProbe:null});
  const early=factory();prime(early,'early');
  assert.throws(()=>invoke(early,observation({elapsed:2.1,probes:[delayed]}),{label:'reject-early-null-after-delayed-charge'}),/before its highlight lifetime/);
  assert.throws(()=>invoke(early,observation({elapsed:2.2,probes:[delayed],lastProbe:{...highlight(delayed),at:1.9}}),{label:'reject-highlight-log-time-mismatch'}),/Visible probe emission disagrees/);
  const altered=observation({elapsed:2.2,probes:[delayed],lastProbe:highlight(delayed)});altered.model.cells[7].knowledge='wall';
  assert.throws(()=>invoke(early,altered,{label:'reject-free-extra-wall-revelation'}),/public observation\/resource ledger/);
  add('time since issued input cannot substitute for charged log time; mismatched feedback and uncharged extra revelations are rejected');

  const routePilot=factory();
  const routeRows=[{elapsed:10,keys:[]},{elapsed:11.1,keys:['b']},{elapsed:11.1,keys:[]},
    {elapsed:11.2,mode:'route',modeSwitches:1,keys:[]}];
  const moves=[['ArrowRight',11.5],['ArrowDown',11.8],['ArrowRight',12.1],['ArrowDown',12.4],['ArrowRight',12.7],['ArrowDown',13]];
  for(const [i,[key,time]] of moves.entries()){
    routeRows.push({elapsed:time,mode:'route',modeSwitches:1,route:SAFE_ROUTE.slice(0,i+1),keys:[key]},
      {elapsed:time,mode:'route',modeSwitches:1,route:SAFE_ROUTE.slice(0,i+1),keys:[]},
      {elapsed:Math.round((time+.1)*60)/60,mode:'route',modeSwitches:1,route:SAFE_ROUTE.slice(0,i+2),keys:[]});
  }
  routeRows.push({elapsed:13.3,mode:'route',modeSwitches:1,route:SAFE_ROUTE,keys:['Space']},{elapsed:13.3,mode:'route',modeSwitches:1,route:SAFE_ROUTE,keys:[]});
  for(const [i,row] of routeRows.entries())invoke(routePilot,observation({selected:11,probes:KNOWN,...row}),{label:'safe-public-route-'+i,expected:row.keys});
  const routeDiagnostic=routePilot.diagnostics();assert.equal(routeDiagnostic.filter(r=>r.type==='observed-route-progress').length,6);
  assert.ok(routeDiagnostic.filter(r=>r.type==='observed-route-progress').some(r=>r.unknownCellsOnRoute>0));
  assert.deepEqual(routeDiagnostic.find(r=>r.type==='observed-route-mode').route,SAFE_ROUTE);
  add('two explicit public observations yield a guaranteed route through unrevealed cells, ordinary cardinal appends and final A submission without revealing a true map',{syntheticObservations:routeRows.length,routeEdges:6,syntheticSubmissionIssued:true,normalWinClaimed:false});

  const correction=factory(),paid=[log(6,'open',4)];
  const corrections=[
    {elapsed:5,mode:'route',route:[0,4,8],modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.1,mode:'route',route:[0,4,8],modeSwitches:1,routeMoves:2,keys:['b']},
    {elapsed:6.1,mode:'route',route:[0,4,8],modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.2,mode:'route',route:[0,4],backtracks:1,modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.4,mode:'route',route:[0,4],backtracks:1,modeSwitches:1,routeMoves:2,keys:['b']},
    {elapsed:6.4,mode:'route',route:[0,4],backtracks:1,modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.5,mode:'route',route:[0],backtracks:2,modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.7,mode:'route',route:[0],backtracks:2,modeSwitches:1,routeMoves:2,keys:['b']},
    {elapsed:6.7,mode:'route',route:[0],backtracks:2,modeSwitches:1,routeMoves:2,keys:[]},
    {elapsed:6.8,mode:'probe',route:[0],backtracks:2,modeSwitches:2,routeMoves:2,keys:[]}
  ];
  for(const [i,row] of corrections.entries())invoke(correction,observation({probes:paid,...row}),{label:'B-pop-no-refund-'+i,expected:row.keys});
  assert.equal(correction.diagnostics().filter(r=>r.type==='ordinary-input'&&r.kind==='backtrack').length,2);
  assert.equal(correction.diagnostics().filter(r=>r.type==='ordinary-input'&&r.kind==='to-probe').length,1);
  add('B pops one route edge at a time then returns from entry to probe mode, preserving charged knowledge and probe budget',{syntheticObservations:corrections.length,paidProbesRetained:1});

  const isolated=[factory(),factory()];
  for(let j=0;j<2;j++)invoke(isolated[j],observation({selected:0,probes:j?KNOWN.map(p=>({...p,at:0,tick:0})):[]}),{label:'factory-start-'+j,expected:[]});
  for(let j=0;j<2;j++)invoke(isolated[j],observation({selected:0,elapsed:1.1,probes:j?KNOWN.map(p=>({...p,at:0,tick:0})):[]}),{label:'factory-public-knowledge-'+j,expected:j?['b']:['ArrowRight']});
  for(let j=0;j<2;j++)invoke(isolated[j],observation({selected:0,elapsed:1.1,probes:j?KNOWN.map(p=>({...p,at:0,tick:0})):[]}),{label:'factory-release-'+j,expected:[]});
  add('interleaved factories keep separate public knowledge: one surveys while the other enters its guaranteed route');

  const dropped=factory();prime(dropped,'dropped');
  for(const [elapsed,keys] of [[1.4,[]],[2.9,[]],[3.3,['Space']],[3.3,[]]])invoke(dropped,observation({elapsed}),{label:'dropped-key-'+elapsed,expected:keys});
  assert.equal(dropped.diagnostics().filter(r=>r.type==='unobserved-input-retry').length,1);
  assert.equal(dropped.diagnostics().filter(r=>r.type==='observed-information-gain').length,0);
  add('an externally dropped or canceled probe input is released and retried after timeout without inventing a paid observation');
  invoke(dropped,observation({runtimePhase:'menu',elapsed:3.3}),{label:'menu-neutral',expected:[]});
  invoke(dropped,observation({paused:true,elapsed:3.3}),{label:'pause-neutral',expected:[]});
  invoke(dropped,observation({runtimePhase:'won',elapsed:3.3}),{label:'synthetic-terminal-control-neutral',expected:[]});
  invoke(dropped,observation(),{label:'retry-clock-rollback',expected:[]});
  invoke(dropped,observation({elapsed:1.1}),{label:'retry-fresh-ready-delay',expected:[]});
  assert.equal(dropped.diagnostics().filter(r=>r.type==='observed-round').length,1);
  add('menu pause constructed terminal and elapsed rollback retry keep ordinary input neutral or freshly delayed');

  const model=observation().model;
  const knowledge=external(api.publicKnowledge,model);assert.equal(knowledge.length,16);knowledge[0].knowledge='wall';assert.equal(model.cells[0].knowledge,'open');
  external(api.assertPublicSurvey,model,assert);
  const inferred=external(api.inferVisibleState,model);assert.equal(inferred.found,true);assert.equal(inferred.candidateCount,9);assert.equal(inferred.evaluated,1296);assert.deepEqual(inferred.safeRoute,[]);
  const plan=external(api.planVisibleState,model);assert.equal(plan.found,true);assert.equal(plan.probe.cellId,6);assert.ok(plan.worstCaseProbes<=3&&plan.policyStates<=plan.naturalPolicyBound);
  const safe=external(api.planVisibleState,observation({probes:KNOWN,elapsed:10}).model);assert.equal(safe.found,true);assert.deepEqual(safe.safeRoute,SAFE_ROUTE);assert.equal(safe.probe,null);
  consume();exportCalls++;const longer=api.shortestPublicPath(18199,1,14);assert.equal(longer.length-1,6);
  const capped=external(api.inferVisibleState,model,{maxBoards:1});assert.equal(capped.found,false);assert.equal(capped.reason,'board-cap');assert.equal(capped.evaluated,0);
  const limited=external(api.planVisibleState,model,{maxPolicyStates:1});assert.equal(limited.found,false);assert.equal(limited.reason,'policy-cap');
  assert.throws(()=>external(api.inferVisibleState,model,{maxMilliseconds:Infinity}),/finite and positive/);
  const invalid=clone(model);invalid.cells[15].knowledge='wall';assert.throws(()=>external(api.inferVisibleState,invalid),/endpoints must be known open/);
  const impossible=external(api.inferVisibleState,observation({rowOpenCounts:[0,2,2,2]}).model);assert.equal(impossible.found,false);assert.equal(impossible.reason,'inconsistent-public-clues');
  external(api.assertPublicSurvey,observation({probes:KNOWN,elapsed:12,mode:'route',route:SAFE_ROUTE.slice(0,4)}).model,assert);
  add('public exports preserve exact-distance inference, resource ledgers and geometry while board/policy/time/domain caps fail closed',{exportFixtureCalls:12,initialCandidates:9,initialRowProductsVisited:1296,noFullRuleEnumeration:true});
  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(directions>0&&actionEdges>0&&backEdges>0);
  add('every object observation stays deeply frozen, including cells/path/log, with zero private reads or writes');
  report.passed=true;
}catch(error){report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;}
finally{
  report.endHashes=await hashes();report.reviewScriptEndSha256=hash(await readFile(script));
  report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or review changed during execution'};process.exitCode=1;}
  Object.assign(report,{pilotCalls,exportCalls,observationCalls:pilotCalls+exportCalls,observationCallLimit:100,factoriesCreated:factories,
    privateReads,mutationAttempts,deepFrozenObservations:frozenObservations,scalarGeometryCalls:1,meaningfulDirectionOutputs:directions,
    probeSubmitEdgeOutputs:actionEdges,modeBacktrackEdgeOutputs:backEdges,inputTraceSha256:hash(JSON.stringify(trace)),inputTrace:trace,
    calledExports:['createPilot','publicKnowledge','inferVisibleState','planVisibleState','shortestPublicPath','assertPublicSurvey']});
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
