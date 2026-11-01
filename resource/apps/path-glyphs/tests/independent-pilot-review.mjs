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
].map(match => match[0]).concat(['_goldenRoute', '_solution', '_futureInputs', '_expectedSymbols', '_private']))].sort();
assert.ok(!/^\s*import\s/m.test(pilotSource) && !/\bimport\s*\(/.test(pilotSource), 'Pilot declares an unexpected dependency');
let pilotCalls = 0, exportCalls = 0, privateReads = 0, mutationAttempts = 0, frozenObservations = 0;
let meaningfulMoves = 0, submitEdges = 0, clearEdges = 0, factories = 0;
const checks = [], trace = [];
const report = {
  kind: 'independent-synthetic-public-route-pilot-review', passed: false,
  sourceHashes: before, reviewScriptSha256: scriptBefore,
  productionModelImported: false, productionModelStepCalled: false,
  productionModelSourceReadOnlyForHashAndPrivateKeyNames: true,
  normalGameWinsClaimed: 0, browserExecuted: false,
  physicalTvTested: false, physicalPhoneTested: false,
  scope: 'Hand-authored small public-board observations, including fabricated terminal and rejection snapshots. These are synthetic pilot/input-protocol fixtures, not production rule tests, completed games, browser play, footage or device evidence. No production model create/step or model solver/reference route is used; the reviewed public pilot and its own planner/predictor are executed.',
  privateKeys, checks
};

// A small authored fixture, not a copy of any production level. The direct
// 0->1->2 exit spells N and is wrong. The alternative 0->5->6->7->2 spells EW;
// cell6 is skipped from its west side and cell7 fires from its west side.
const floorIds = new Set([0, 1, 2, 5, 6, 7]);
const runeFacts = {1:{symbol:'N',enterFrom:'W'},5:{symbol:'E',enterFrom:null},6:{symbol:'N',enterFrom:'N'},7:{symbol:'W',enterFrom:'W'}};
const dirs = [{letter:'N',dc:0,dr:-1,entry:'S'},{letter:'E',dc:1,dr:0,entry:'W'},{letter:'S',dc:0,dr:1,entry:'N'},{letter:'W',dc:-1,dr:0,entry:'E'}];
function observation({ids=[0], elapsed=0, target=['E','W'], mistakes=0, clears=0, rejected=false, phase='playing', paused=false, submissions=0}={}) {
  const cells = Array.from({length:25}, (_,id) => ({id,col:id%5,row:Math.floor(id/5),x:305+(id%5+.5)*70,y:90+(Math.floor(id/5)+.5)*70,
    type:floorIds.has(id)?'floor':'wall',role:id===0?'start':id===2?'exit':null,rune:clone(runeFacts[id]||null),visited:ids.includes(id),visitIndex:ids.includes(id)?ids.indexOf(id):null}));
  const symbols = [], emissions = [];
  let conditionHits=0, conditionSkips=0;
  const route = ids.map((id,index) => {
    const c=cells[id]; let enteredFrom=null, emitted=null;
    if(index) {
      const previous=cells[ids[index-1]], d=dirs.find(d=>previous.col+d.dc===c.col&&previous.row+d.dr===c.row);
      assert.ok(d,'Fixture path must be orthogonal'); enteredFrom=d.entry;
      if(c.rune) {
        if(c.rune.enterFrom===null||c.rune.enterFrom===enteredFrom) {
          emitted=c.rune.symbol; symbols.push(emitted); emissions.push({cellId:id,symbol:emitted,enteredFrom,pathIndex:index});
          if(c.rune.enterFrom!==null)conditionHits++;
        } else conditionSkips++;
      }
    }
    return {cellId:id,col:c.col,row:c.row,x:c.x,y:c.y,enteredFrom,emitted};
  });
  const endpoint=route.at(-1), point=id=>Object.fromEntries(['id','col','row','x','y'].map(k=>[k,cells[id][k]]));
  const routeStatus=rejected?'rejected':endpoint.cellId===2?'at-exit':'drawing';
  let prefixLength=0;while(prefixLength<symbols.length&&prefixLength<target.length&&symbols[prefixLength]===target[prefixLength])prefixLength++;
  const rejectionAt=Math.min(elapsed,7.4);
  const rejectionRecord={attempt:1,reason:'wrong-sequence',at:rejectionAt,tick:Math.round(rejectionAt*60),path:[0,1,2],symbols:['N']};
  const availableMoves=routeStatus!=='drawing'||phase!=='playing'?[]:dirs.filter(d=>{
    const col=endpoint.col+d.dc,row=endpoint.row+d.dr,id=row*5+col;
    return col>=0&&col<5&&row>=0&&row<5&&floorIds.has(id)&&!ids.includes(id);
  }).map(d=>d.letter);
  const model={width:960,height:540,grid:{cols:5,rows:5,cellSize:70,x:305,y:90},level:1,difficulty:0,levelName:'Synthetic short public graph',phase,
    start:point(0),exit:point(2),cells,player:{...endpoint},path:route,visited:cells.map(c=>c.visited),symbols,emissions,target:[...target],
    conditionHits,conditionSkips,prefixLength,sequenceMatches:symbols.length===target.length&&prefixLength===target.length,
    routeStatus,availableMoves,mistakes,maxMistakes:3,rejections:mistakes?[clone(rejectionRecord)]:[],rejection:rejected?clone(rejectionRecord):null,
    moves:ids.length-1,totalMoves:ids.length-1+(clears?2:0),clears,submissions,blockedMoves:0,lastMove:null,lastAction:null,events:[],
    tick:Math.round(elapsed*60),elapsed,timeLimit:90,remaining:90-elapsed,score:prefixLength*100,message:'Synthetic observation',lostReason:phase==='lost'?'mistakes':null};
  return {phase,paused,model};
}

// Frozen accessor guards stay ordinary structured-cloneable objects, unlike
// Proxies: a legitimate pilot may retain an observed rejection in diagnostics.
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
  const result=wrap(input);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.model)&&Object.isFrozen(result.model.cells)&&Object.isFrozen(result.model.cells[0]));
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
  trace.push({label,tick:state.model.tick,phase:state.phase,routeStatus:state.model.routeStatus,keys:[...result]});return result;
}
function external(fn,model,...args) { consume();exportCalls++;return fn(guarded({phase:model.phase,paused:false,model}).model,...args); }
function add(name,details={}) { checks.push({name,passed:true,...details}); }

try {
  const api=await import(pathToFileURL(path.join(app,files[0])).href+'?review='+before[files[0]]);
  report.afterImportHashes=await sourceHashes();assert.deepEqual(report.afterImportHashes,before,'Sources changed during import');assert.equal(hash(await readFile(script)),scriptBefore);
  function factory(){factories++;return api.createPilot();}
  assert.equal(typeof api.createPilot,'function');add('pilot imports without a production model dependency and source window stays pinned');

  const ordinary=[
    {t:0,ids:[0],keys:[]},{t:2,ids:[0],keys:['ArrowDown']},{t:2,ids:[0],keys:[]},{t:2,ids:[0],keys:[]},
    {t:2.1,ids:[0,5],keys:[]},{t:3.5,ids:[0,5],keys:['ArrowRight']},{t:3.5,ids:[0,5],keys:[]},
    {t:3.6,ids:[0,5,6],keys:[]},{t:5,ids:[0,5,6],keys:['ArrowRight']},{t:5,ids:[0,5,6],keys:[]},
    {t:5.1,ids:[0,5,6,7],keys:[]},{t:6.5,ids:[0,5,6,7],keys:['ArrowUp']},{t:6.5,ids:[0,5,6,7],keys:[]},
    {t:6.6,ids:[0,5,6,7,2],keys:[]},{t:8,ids:[0,5,6,7,2],keys:[]},
    {t:30,ids:[0,5,6,7,2],keys:['Space']},{t:30,ids:[0,5,6,7,2],keys:[]}
  ];
  const paired=[factory(),factory(),factory()],variants=['a','b','getters'];
  for(const [index,row] of ordinary.entries()) {
    const state=observation({ids:row.ids,elapsed:row.t}),results=[];
    for(let n=0;n<paired.length;n++) results.push(invoke(paired[n],state,{variant:variants[n],label:'paired-'+index+'-'+variants[n],expected:row.keys}));
    assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
  }
  add('same public observation history yields identical keys for different hidden values and throwing private getters',{pairedObservations:ordinary.length,variants:3});
  add('ordinary direction and submit edges release on the next call and wait for a later neutral tick',{directionEdgesPerVariant:4,submitEdgesPerVariant:1,sameTickNeutralObservation:true});
  const observed=paired[2].diagnostics();assert.equal(observed.filter(r=>r.kind==='observed-move').length,4);
  assert.ok(observed.some(r=>r.kind==='observed-move'&&r.conditionalResult==='skipped'));
  assert.ok(observed.some(r=>r.kind==='observed-move'&&r.conditionalResult==='active'));
  const originalDiagnostics=clone(observed);observed.length=0;assert.deepEqual(paired[2].diagnostics(),originalDiagnostics);
  add('public conditional entry and observed progression are respected; diagnostics copies do not expose mutable internal arrays');

  const isolatedA=factory(),isolatedB=factory();
  invoke(isolatedA,observation(),{label:'isolated-a-wait',expected:[]});
  invoke(isolatedB,observation({target:['N']}),{label:'isolated-b-wait',expected:[]});
  invoke(isolatedA,observation({elapsed:2}),{label:'isolated-a-move',expected:['ArrowDown']});
  invoke(isolatedB,observation({elapsed:2,target:['N']}),{label:'isolated-b-move',expected:['ArrowRight']});
  invoke(isolatedA,observation({elapsed:2}),{label:'isolated-a-release',expected:[]});
  invoke(isolatedB,observation({elapsed:2,target:['N']}),{label:'isolated-b-release',expected:[]});
  add('interleaved factories independently select different routes from their own public targets');

  const recordPilot=factory();
  const trial=[
    {t:0,ids:[0],keys:[]},{t:3,ids:[0],keys:['ArrowRight']},{t:3,ids:[0],keys:[]},
    {t:3.1,ids:[0,1],keys:[]},{t:4,ids:[0,1],keys:['ArrowRight']},{t:4,ids:[0,1],keys:[]},
    {t:4.1,ids:[0,1,2],keys:[]},{t:5,ids:[0,1,2],keys:[]},{t:7.3,ids:[0,1,2],keys:['Space']},{t:7.3,ids:[0,1,2],keys:[]},
    {t:7.4,ids:[0,1,2],rejected:true,mistakes:1,keys:[]},{t:11.8,ids:[0,1,2],rejected:true,mistakes:1,keys:[]},
    {t:12,ids:[0,1,2],rejected:true,mistakes:1,keys:['b']},{t:12,ids:[0,1,2],rejected:true,mistakes:1,keys:[]},
    {t:12,ids:[0,1,2],rejected:true,mistakes:1,keys:[]},{t:12.05,ids:[0,1,2],rejected:true,mistakes:1,keys:[]},
    {t:12.1,ids:[0],mistakes:1,clears:1,keys:[]},{t:15.2,ids:[0],mistakes:1,clears:1,keys:[]},
    {t:15.4,ids:[0],mistakes:1,clears:1,keys:['ArrowDown']}
  ];
  for(const [i,row] of trial.entries())invoke(recordPilot,observation({...row,elapsed:row.t,submissions:row.t>=7.4?1:0}),{mode:'record',label:'reject-clear-'+i,expected:row.keys});
  const diagnostics=recordPilot.diagnostics();
  assert.equal(diagnostics.filter(r=>r.kind==='observed-rejection').length,1);
  assert.equal(diagnostics.filter(r=>r.kind==='observed-clear').length,1);
  assert.equal(diagnostics.find(r=>r.kind==='observed-clear').mistakes,1);
  assert.deepEqual(diagnostics.filter(r=>r.kind==='public-search').map(r=>r.goal),['reject','reject','match']);
  add('record controller submits a visible wrong exit, waits on rejection, releases B, observes full clear without refunded mistakes, then replans from target',{syntheticObservationCalls:trial.length,rejectionHoldSeconds:4.6,clearObservedBeforeReplan:true});

  const badClear=factory(),rejected=elapsed=>observation({ids:[0,1,2],rejected:true,mistakes:1,elapsed,submissions:1});
  invoke(badClear,rejected(0),{label:'bad-clear-rejected',expected:[]});
  invoke(badClear,rejected(4.6),{label:'bad-clear-edge',expected:['b']});
  invoke(badClear,rejected(4.6),{label:'bad-clear-release',expected:[]});
  assert.throws(()=>invoke(badClear,observation({elapsed:4.7,clears:1,mistakes:0}),{label:'bad-clear-refunded-mistake'}),/without refunding failures/);
  add('fabricated clear that refunds the failure ledger is rejected instead of treated as a valid reset');

  const idle=factory();
  for(const state of [observation({phase:'menu'}),observation({paused:true}),observation({phase:'won'}),observation({phase:'lost'})])invoke(idle,state,{label:'inactive-'+state.phase+(state.paused?'-paused':''),expected:[]});
  invoke(paired[2],observation(),{label:'elapsed-rollback-fresh-wait',expected:[]});
  invoke(paired[2],observation({elapsed:2}),{label:'elapsed-rollback-fresh-route',expected:['ArrowDown']});
  add('menu pause and terminal observations are neutral; a lower elapsed fresh round resets pilot history');

  const skipped=external(api.predictVisibleMove,observation({ids:[0,5]}).model,'E');
  assert.equal(skipped.enteredFrom,'W');assert.equal(skipped.emitted,null);assert.equal(skipped.conditionalResult,'skipped');assert.deepEqual(skipped.symbols,['E']);
  const fired=external(api.predictVisibleMove,observation({ids:[0,5,6]}).model,'E');
  assert.equal(fired.enteredFrom,'W');assert.equal(fired.emitted,'W');assert.equal(fired.conditionalResult,'active');assert.deepEqual(fired.symbols,['E','W']);
  const blocked=external(api.predictVisibleMove,observation({ids:[0,5]}).model,'N');assert.equal(blocked.valid,false);assert.equal(blocked.reason,'already-visited');
  const capped=external(api.planVisibleState,observation().model,{maxExpanded:1,maxQueued:1,maxMilliseconds:100});
  assert.equal(capped.found,false);assert.equal(capped.reason,'queue-cap');assert.ok(capped.queued<=1&&capped.expanded<=1);
  add('small direct predictor fixtures respect entry-side glyphs and visited cells; an explicit one-node queue cap fails closed',{exportCalls:4,noFullRuleEnumeration:true});

  assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(meaningfulMoves>0&&submitEdges>0&&clearEdges>0);
  add('all observation objects remain deeply frozen with zero private reads and zero write attempts');
  report.passed=true;
} catch(error) {
  report.error={name:error.name,message:error.message,stack:error.stack};
  process.exitCode=1;
} finally {
  report.endHashes=await sourceHashes();report.reviewScriptEndSha256=hash(await readFile(script));
  report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.endHashes)&&scriptBefore===report.reviewScriptEndSha256;
  if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source or review script changed during review'};process.exitCode=1;}
  report.pilotCalls=pilotCalls;report.exportCalls=exportCalls;report.observationCalls=pilotCalls+exportCalls;
  report.observationCallLimit=100;report.factoriesCreated=factories;
  report.privateReads=privateReads;report.mutationAttempts=mutationAttempts;report.deepFrozenObservations=frozenObservations;
  report.meaningfulDirectionOutputs=meaningfulMoves;report.submitEdgeOutputs=submitEdges;report.clearEdgeOutputs=clearEdges;
  report.inputTraceSha256=hash(JSON.stringify(trace));report.inputTrace=trace;
  report.calledExports=['createPilot','predictVisibleMove','planVisibleState'];
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,observationCalls:report.observationCalls,privateReads,mutationAttempts,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
