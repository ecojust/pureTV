#!/usr/bin/env node
// Public-clue mathematics only. No application, model, true map or route import.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC_CLUES = Object.freeze([
  Object.freeze({level:1,rowOpenCounts:Object.freeze([2,2,2,2]),entry:0,exit:15,requiredDistance:6,probeBudget:3}),
  Object.freeze({level:2,rowOpenCounts:Object.freeze([3,2,2,3]),entry:0,exit:12,requiredDistance:5,probeBudget:4}),
  Object.freeze({level:3,rowOpenCounts:Object.freeze([2,3,3,2]),entry:1,exit:14,requiredDistance:4,probeBudget:5})
]);
const NEIGHBORS = Array.from({length:16},(_,id)=>[id-4,id+1,id+4,id-1].filter((next,i)=>
  i===0?id>=4:i===1?id%4<3:i===2?id<12:id%4>0));
const invariant=(condition,message)=>{if(!condition)throw Error(message);};
const popcount=x=>{let n=0;for(x>>>=0;x;x&=x-1)n++;return n;};
const sha=b=>createHash('sha256').update(b).digest('hex');
const encoded=x=>JSON.stringify(x,null,2)+'\n';

export function validateClue(clue) {
  invariant(clue&&Array.isArray(clue.rowOpenCounts)&&clue.rowOpenCounts.length===4,'Four public row counts required');
  invariant(clue.rowOpenCounts.every(n=>Number.isInteger(n)&&n>=0&&n<=4),'Invalid row count');
  invariant(['entry','exit'].every(k=>Number.isInteger(clue[k])&&clue[k]>=0&&clue[k]<16)&&clue.entry!==clue.exit,'Invalid endpoints');
  invariant(Number.isInteger(clue.requiredDistance)&&clue.requiredDistance>=1&&clue.requiredDistance<=15,'Invalid exact shortest distance');
  invariant(Number.isInteger(clue.probeBudget)&&clue.probeBudget>=0&&clue.probeBudget<=16,'Invalid probe budget');
}

// Independent edge-count BFS over the entire 4x4 mask, with an explicit queue.
export function shortestPath(mask,entry,exit) {
  invariant(Number.isInteger(mask)&&mask>=0&&mask<=65535,'Invalid floor mask');
  invariant(Number.isInteger(entry)&&entry>=0&&entry<16&&Number.isInteger(exit)&&exit>=0&&exit<16,'Invalid BFS endpoints');
  if(!(mask&(1<<entry))||!(mask&(1<<exit)))return null;
  const parent=new Int8Array(16).fill(-1),queue=new Uint8Array(16);let head=0,tail=1;
  queue[0]=entry;parent[entry]=entry;
  while(head<tail){
    const id=queue[head++];
    if(id===exit){const route=[id];while(route.at(-1)!==entry)route.push(parent[route.at(-1)]);return route.reverse();}
    for(const next of NEIGHBORS[id])if((mask&(1<<next))&&parent[next]===-1){parent[next]=id;queue[tail++]=next;}
  }
  return null;
}

export function enumerateCandidates(clue) {
  validateClue(clue);
  const candidates=[],counts={allMasksVisited:0,rowCountsMatched:0,endpointsMatched:0,exactDistanceMatched:0};
  for(let mask=0;mask<65536;mask++){
    counts.allMasksVisited++;
    if(!clue.rowOpenCounts.every((n,row)=>popcount((mask>>>(4*row))&15)===n))continue;
    counts.rowCountsMatched++;
    if(!(mask&(1<<clue.entry))||!(mask&(1<<clue.exit)))continue;
    counts.endpointsMatched++;
    const route=shortestPath(mask,clue.entry,clue.exit);
    if(route&&route.length-1===clue.requiredDistance){candidates.push(mask);counts.exactDistanceMatched++;}
  }
  return {candidates,counts};
}
export function intersectionMask(candidates) {
  invariant(candidates.length>0,'Empty candidate world set');
  return candidates.reduce((n,mask)=>n&mask,65535);
}
export function ambiguousCells(candidates) {
  const intersection=intersectionMask(candidates),union=candidates.reduce((n,mask)=>n|mask,0);
  return Array.from({length:16},(_,id)=>id).filter(id=>(union^intersection)&(1<<id));
}
export function requiredLengthRoute(mask,clue) {
  const route=shortestPath(mask,clue.entry,clue.exit);
  return route&&route.length-1===clue.requiredDistance?route:null;
}
function filterKnown(candidates,known) {
  invariant(Array.isArray(known)&&known.length===16&&known.every(v=>v===null||typeof v==='boolean'),'known must contain sixteen null/boolean public observations');
  return candidates.filter(mask=>known.every((v,id)=>v===null||Boolean(mask&(1<<id))===v));
}

// Convenience public-observation interface. known has exactly sixteen entries:
// null = unknown, true = publicly observed floor, false = publicly observed wall.
// Probe policy branches are named open/blocked, and leaves contain a safe route.
export function analyze(publicClues,options={}) {
  const clue={rowOpenCounts:publicClues.rowOpenCounts,entry:publicClues.entryId,exit:publicClues.exitId,
    requiredDistance:publicClues.requiredDistance,probeBudget:publicClues.probeBudget};
  const enumeration=enumerateCandidates(clue),known=publicClues.known??Array(16).fill(null);
  const candidates=filterKnown(enumeration.candidates,known);
  invariant(candidates.length>0,'Public observations contradict the public clues');
  const commonRoute=requiredLengthRoute(intersectionMask(candidates),clue),proof=solveMinimax(clue,candidates,options);
  return {clue,known:[...known],candidates,enumeration:enumeration.counts,commonRoute,minDepth:proof.minimumDepth,policy:proof.strategy,proof};
}

class SearchLimit extends Error {}

// A decision at depth d succeeds iff some useful probe has BOTH outcomes
// solved at d-1. Iterative deepening proves minimal worst-case probe count.
// Failure records contain a failing branch for EVERY useful probe; a separate
// verifier can check the resulting lower-bound DAG without rerunning search.
export function solveMinimax(clue,candidates,options={}) {
  validateClue(clue);invariant(candidates.length>0&&new Set(candidates).size===candidates.length,'Distinct candidate worlds required');
  const maxStates=options.maxStates??250000,maxMilliseconds=options.maxMilliseconds??20000;
  invariant(Number.isInteger(maxStates)&&maxStates>0&&Number.isFinite(maxMilliseconds)&&maxMilliseconds>0,'Invalid search limits');
  const initialAmbiguous=ambiguousCells(candidates),maxDepth=options.maxDepth??initialAmbiguous.length;
  invariant(Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=16,'Invalid maximum decision depth');
  const started=performance.now(),full=(1n<<BigInt(candidates.length))-1n;
  const openSets=Array.from({length:16},(_,id)=>candidates.reduce((s,m,i)=>m&(1<<id)?s|(1n<<BigInt(i)):s,0n));
  const subsetCache=new Map(),memo=new Map(),failed=new Map(),completedDepths=[];
  const stats={recursiveCalls:0,decisionStates:0,cacheHits:0,subsetStates:0,safeSubsets:0,probeSplitsExamined:0};
  function inspect(subset){
    const key=subset.toString(16);if(subsetCache.has(key))return subsetCache.get(key);
    let common=65535,count=0,bits=subset;
    for(let i=0;bits;i++,bits>>=1n)if(bits&1n){common&=candidates[i];count++;}
    invariant(count>0,'Search created an empty subset');
    // Removing floor cells may lengthen a shortest path. Such an intersection
    // remains unresolved even though it is connected: the route must have D edges.
    const route=requiredLengthRoute(common,clue);
    const info={key,common,count,route};subsetCache.set(key,info);stats.subsetStates++;if(route)stats.safeSubsets++;return info;
  }
  function attempt(subset,depth){
    stats.recursiveCalls++;
    if((stats.recursiveCalls&63)===1&&performance.now()-started>maxMilliseconds)throw new SearchLimit('time-cap');
    const stateKey=depth+':'+subset.toString(16);
    if(memo.has(stateKey)){stats.cacheHits++;return memo.get(stateKey);}
    if(stats.decisionStates>=maxStates)throw new SearchLimit('state-cap');stats.decisionStates++;
    const info=inspect(subset);
    if(info.route){const leaf={kind:'safe-route',candidateCount:info.count,intersectionMask:info.common,route:info.route};memo.set(stateKey,leaf);return leaf;}
    if(depth===0){memo.set(stateKey,null);failed.set(stateKey,{remainingDepth:depth,subsetHex:info.key,candidateCount:info.count,choices:[]});return null;}
    const choices=[];
    for(let cell=0;cell<16;cell++){
      const open=subset&openSets[cell],blocked=subset^open;if(!open||!blocked)continue;
      const openCount=inspect(open).count,blockedCount=info.count-openCount;
      choices.push({cell,open,blocked,balance:Math.max(openCount,blockedCount),openCount,blockedCount});
    }
    choices.sort((a,b)=>a.balance-b.balance||a.cell-b.cell);
    invariant(choices.length>0,'Unresolved subset has no ambiguous cell');
    const reasons=[];
    for(const split of choices){
      stats.probeSplitsExamined++;
      const firstOpen=split.openCount>=split.blockedCount,first=firstOpen?split.open:split.blocked,second=firstOpen?split.blocked:split.open;
      const firstTree=attempt(first,depth-1);
      if(!firstTree){reasons.push({cell:split.cell,outcomeOpen:firstOpen,childKey:(depth-1)+':'+first.toString(16)});continue;}
      const secondTree=attempt(second,depth-1);
      if(!secondTree){reasons.push({cell:split.cell,outcomeOpen:!firstOpen,childKey:(depth-1)+':'+second.toString(16)});continue;}
      const tree={kind:'probe',candidateCount:info.count,cell:split.cell,open:firstOpen?firstTree:secondTree,blocked:firstOpen?secondTree:firstTree};
      memo.set(stateKey,tree);return tree;
    }
    memo.set(stateKey,null);failed.set(stateKey,{remainingDepth:depth,subsetHex:info.key,candidateCount:info.count,choices:reasons});return null;
  }
  function lowerCertificate(depth){
    if(depth<0)return null;
    const keys=new Map(),nodes=[];
    function collect(key){
      if(keys.has(key))return keys.get(key);
      const row=failed.get(key);invariant(row,'Missing completed failure proof');const id=nodes.length;keys.set(key,id);nodes.push(null);
      const choices=row.choices.map(({cell,outcomeOpen,childKey})=>({cell,outcomeOpen,child:collect(childKey)}));
      nodes[id]={id,remainingDepth:row.remainingDepth,subsetHex:row.subsetHex,candidateCount:row.candidateCount,choices};return id;
    }
    return {failedDepth:depth,root:collect(depth+':'+full.toString(16)),nodes};
  }
  let strategy=null,minimumDepth=null,lastFailed=-1,stopReason=null;
  for(let depth=0;depth<=maxDepth;depth++){
    const prior=stats.decisionStates;
    try{
      strategy=attempt(full,depth);completedDepths.push({depth,solvable:!!strategy,newDecisionStates:stats.decisionStates-prior});
      if(strategy){minimumDepth=depth;break;}lastFailed=depth;
    }catch(error){if(!(error instanceof SearchLimit))throw error;stopReason=error.message;break;}
  }
  if(minimumDepth===null&&!stopReason)stopReason='depth-cap';
  return {status:minimumDepth===null?'bounded':'exact',minimumDepth,lowerBound:minimumDepth??lastFailed+1,
    upperBound:minimumDepth??initialAmbiguous.length,withinProbeBudget:minimumDepth!==null?minimumDepth<=clue.probeBudget:lastFailed>=clue.probeBudget?false:null,
    upperBoundMethod:minimumDepth===null?'Probe every initially ambiguous cell; every public candidate has the required route.':'Verified full strategy tree.',
    stopReason,limits:{maxStates,maxMilliseconds,maxDepth},elapsedMilliseconds:performance.now()-started,stats,completedDepths,
    strategy,lowerBoundCertificate:lowerCertificate(minimumDepth===null?lastFailed:minimumDepth-1)};
}

// Certificate verification deliberately uses arrays of candidate worlds, not
// the search's BigInt subset operations, memo table or decision recursion.
export function verifyCertificate(certificate) {
  const {clue,candidateMasks,strategy,lowerBoundCertificate}=certificate;
  const enumeration=enumerateCandidates(clue);
  const expected=filterKnown(enumeration.candidates,certificate.known??Array(16).fill(null));
  invariant(JSON.stringify(expected)===JSON.stringify(candidateMasks),'Certificate does not contain ALL worlds consistent with public clues and observations');
  let strategyNodes=0,leaves=0,coveredWorlds=0,maxDepth=0,worstBranch=null;
  function verifyPath(route,worlds){
    invariant(Array.isArray(route)&&route.length===clue.requiredDistance+1&&route[0]===clue.entry&&route.at(-1)===clue.exit,'Invalid safe route endpoints/length');
    invariant(new Set(route).size===route.length,'Safe route repeats a cell');
    for(let i=0;i<route.length;i++){
      const id=route[i];invariant(Number.isInteger(id)&&id>=0&&id<16,'Invalid route cell');
      if(i){const previous=route[i-1];invariant(Math.abs(id%4-previous%4)+Math.abs(Math.floor(id/4)-Math.floor(previous/4))===1,'Non-cardinal safe-route edge');}
      invariant(worlds.every(mask=>mask&(1<<id)),'Leaf route is not safe in every remaining world');
    }
  }
  function tree(node,worlds,history){
    strategyNodes++;invariant(worlds.length===node.candidateCount&&worlds.length>0,'Strategy world count differs');
    if(node.kind==='safe-route'){
      invariant(node.intersectionMask===intersectionMask(worlds),'Leaf intersection differs');verifyPath(node.route,worlds);
      leaves++;coveredWorlds+=worlds.length;
      if(worstBranch===null||history.length>maxDepth){maxDepth=history.length;worstBranch={probes:history,remainingCandidateCount:worlds.length,safeRoute:node.route};}return;
    }
    invariant(node.kind==='probe'&&Number.isInteger(node.cell)&&node.cell>=0&&node.cell<16,'Invalid strategy probe');
    invariant(!history.some(r=>r.cell===node.cell),'Repeated probe gives no new information');
    const open=worlds.filter(mask=>mask&(1<<node.cell)),blocked=worlds.filter(mask=>!(mask&(1<<node.cell)));
    invariant(open.length>0&&blocked.length>0,'Strategy uses a non-ambiguous probe');
    tree(node.open,open,[...history,{cell:node.cell,open:true}]);tree(node.blocked,blocked,[...history,{cell:node.cell,open:false}]);
  }
  if(strategy){tree(strategy,candidateMasks,[]);invariant(coveredWorlds===candidateMasks.length,'Strategy does not cover every world');}
  const verifiedFailure=new Map();
  function failure(id,worlds,depth){
    const proof=lowerBoundCertificate.nodes[id];invariant(proof&&proof.id===id&&proof.remainingDepth===depth,'Invalid failure proof node');
    const indices=new Set(worlds);let subset=0n;candidateMasks.forEach((mask,i)=>{if(indices.has(mask))subset|=1n<<BigInt(i);});
    invariant(proof.subsetHex===subset.toString(16)&&proof.candidateCount===worlds.length&&worlds.length>0,'Failure proof world set differs');
    const expectedKey=depth+':'+worlds.join(',');
    if(verifiedFailure.has(id)){invariant(verifiedFailure.get(id)===expectedKey,'Failure node reused for different worlds');return;}
    verifiedFailure.set(id,expectedKey);
    invariant(requiredLengthRoute(intersectionMask(worlds),clue)===null,'Failure proof contains an already safe required-length route');
    if(depth===0){invariant(proof.choices.length===0,'Depth-zero failure must not probe');return;}
    const cells=ambiguousCells(worlds),actual=proof.choices.map(c=>c.cell).sort((a,b)=>a-b);
    invariant(JSON.stringify(cells)===JSON.stringify(actual),'Failure proof omits a possible useful probe');
    for(const choice of proof.choices){
      invariant(typeof choice.outcomeOpen==='boolean','Failure branch outcome must be boolean');
      const branch=worlds.filter(mask=>Boolean(mask&(1<<choice.cell))===choice.outcomeOpen);
      invariant(branch.length>0&&branch.length<worlds.length,'Failure branch is not a genuine split');failure(choice.child,branch,depth-1);
    }
  }
  if(lowerBoundCertificate){failure(lowerBoundCertificate.root,candidateMasks,lowerBoundCertificate.failedDepth);invariant(verifiedFailure.size===lowerBoundCertificate.nodes.length,'Unreachable failure proof nodes');}
  const provedLowerBound=lowerBoundCertificate?lowerBoundCertificate.failedDepth+1:0;
  if(strategy)invariant(maxDepth>=provedLowerBound,'Inconsistent upper/lower certificates');
  return {passed:true,candidateEnumerationMasksChecked:enumeration.counts.allMasksVisited,candidateWorlds:candidateMasks.length,
    strategyNodes,leaves,coveredWorlds,strategyWorstDepth:strategy?maxDepth:null,worstBranch,
    lowerBoundProofNodes:verifiedFailure.size,provedLowerBound,exactMinimum:strategy&&maxDepth===provedLowerBound?maxDepth:null};
}

async function main(){
  const args={};for(let i=2;i<process.argv.length;i+=2){invariant(['--output','--max-states','--max-ms'].includes(process.argv[i])&&process.argv[i+1],'Invalid CLI arguments');args[process.argv[i].slice(2)]=process.argv[i+1];}
  const output=path.resolve(args.output||path.join(path.dirname(fileURLToPath(import.meta.url)),'report.json'));
  const options={maxStates:Number(args['max-states']??250000),maxMilliseconds:Number(args['max-ms']??20000)};
  const scriptSha256=sha(await readFile(fileURLToPath(import.meta.url))),levels=[];
  await mkdir(path.dirname(output),{recursive:true});
  for(const clue of PUBLIC_CLUES){
    const enumeration=enumerateCandidates(clue),candidates=enumeration.candidates;
    invariant(candidates.length>=2,'Initial clues uniquely identify a world or have no solution');
    const intersection=intersectionMask(candidates),initialRoute=requiredLengthRoute(intersection,clue);
    invariant(initialRoute===null,'Initial universally safe route already exists');
    const result=solveMinimax(clue,candidates,options);
    const certificate={schema:1,kind:'public-clue-minimax-certificate',clue,candidateMasks:candidates,strategy:result.strategy,lowerBoundCertificate:result.lowerBoundCertificate};
    const verification=verifyCertificate(certificate);
    if(result.status==='exact')invariant(verification.exactMinimum===result.minimumDepth,'Minimax depth not independently certified');
    const certificateBody=encoded(certificate),file='level-'+clue.level+'-certificate.json';
    await writeFile(path.join(path.dirname(output),file),certificateBody);
    const {strategy,lowerBoundCertificate,...compact}=result;
    levels.push({clue,enumeration:enumeration.counts,candidateCount:candidates.length,candidateMasksSha256:sha(JSON.stringify(candidates)),
      initialIntersectionMask:intersection,initialIntersectionShortestDistance:shortestPath(intersection,clue.entry,clue.exit)?.length-1||null,
      initialSafeRoute:initialRoute,initialAmbiguousCells:ambiguousCells(candidates),minimax:compact,
      certificate:{file,sha256:sha(certificateBody),bytes:Buffer.byteLength(certificateBody),...verification}});
    console.log(JSON.stringify({level:clue.level,candidates:candidates.length,status:result.status,minimumDepth:result.minimumDepth,bounds:[result.lowerBound,result.upperBound],certificateBytes:Buffer.byteLength(certificateBody),decisionStates:result.stats.decisionStates}));
  }
  // Synthetic public-observation fixture, not an authored world or a game run.
  // The two worlds each have distance4, but their common floor path has distance6.
  const syntheticClue={rowOpenCounts:[3,2,3,1],entry:1,exit:14,requiredDistance:4,probeBudget:1};
  const syntheticMasks=[18231,18263],common=intersectionMask(syntheticMasks),union=syntheticMasks[0]|syntheticMasks[1];
  const known=Array.from({length:16},(_,id)=>(union^common)&(1<<id)?null:Boolean(common&(1<<id)));
  const synthetic=analyze({...syntheticClue,entryId:syntheticClue.entry,exitId:syntheticClue.exit,known},options);
  invariant(JSON.stringify(synthetic.candidates)===JSON.stringify(syntheticMasks),'Synthetic public observations did not isolate the declared pair');
  const individualDistances=syntheticMasks.map(mask=>shortestPath(mask,syntheticClue.entry,syntheticClue.exit).length-1);
  const longer=shortestPath(common,syntheticClue.entry,syntheticClue.exit);
  invariant(individualDistances.every(d=>d===4)&&longer.length-1===6,'Synthetic distance counterexample changed');
  invariant(synthetic.commonRoute===null&&synthetic.minDepth===1,'Longer common path was accepted as solved or caused a failure');
  const syntheticCertificate={schema:1,kind:'synthetic-public-clue-minimax-certificate',clue:syntheticClue,known,candidateMasks:syntheticMasks,
    strategy:synthetic.policy,lowerBoundCertificate:synthetic.proof.lowerBoundCertificate};
  const syntheticVerification=verifyCertificate(syntheticCertificate);
  invariant(syntheticVerification.exactMinimum===1,'Synthetic lower-depth proof was not verified');
  let rejectedLongerLeaf=false;
  try{verifyCertificate({...syntheticCertificate,strategy:{kind:'safe-route',candidateCount:2,intersectionMask:common,route:longer}});}
  catch(error){invariant(error.message==='Invalid safe route endpoints/length','Unexpected negative-certificate failure');rejectedLongerLeaf=true;}
  invariant(rejectedLongerLeaf,'Verifier accepted a longer-than-required solved leaf');
  const syntheticFile='synthetic-longer-intersection-certificate.json',syntheticBody=encoded(syntheticCertificate);
  await writeFile(path.join(path.dirname(output),syntheticFile),syntheticBody);
  const syntheticBoundaryFixtures=[{name:'connected intersection can have a longer shortest route than every candidate world',passed:true,
    scope:'Synthetic public-clue/knowledge fixture only; no selected map or production state.',candidateMasks:syntheticMasks,individualDistances,
    intersectionMask:common,intersectionShortestDistance:longer.length-1,requiredDistance:syntheticClue.requiredDistance,
    commonRequiredLengthRoute:synthetic.commonRoute,minimumAdditionalProbes:synthetic.minDepth,rejectedLongerLeaf,
    certificate:{file:syntheticFile,sha256:sha(syntheticBody),bytes:Buffer.byteLength(syntheticBody),...syntheticVerification}}];
  const endSha=sha(await readFile(fileURLToPath(import.meta.url)));invariant(scriptSha256===endSha,'Solver source changed during proof');
  const report={schema:1,kind:'independent-public-clue-minimax-proof',passed:levels.every(r=>r.certificate.passed),
    allMinimumDepthsExact:levels.every(r=>r.minimax.status==='exact'),allWithinAdvertisedProbeBudgets:levels.every(r=>r.minimax.withinProbeBudget===true),
    solverSha256:scriptSha256,solverEndSha256:endSha,sourceUnchanged:true,levels,syntheticBoundaryFixtures,
    method:'Visit every integer mask0..65535; filter public row counts/endpoints and independent queue-BFS exact shortest edge length. Search all ambiguous probes with both outcomes required, iterative depth and memoization. Array-based verification re-enumerates all worlds, verifies every upper-bound strategy branch, and checks a lower-bound DAG rejecting every useful probe at one less depth.',
    scope:{publicCluesOnly:true,selectedTrueMapsRead:false,applicationOrModelImported:false,authoredLayoutsOrRoutesRead:false,productionRulesExecuted:false,
      normalGameplayWinsClaimed:0,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false}};
  await writeFile(output,encoded(report));console.log(JSON.stringify({passed:report.passed,allMinimumDepthsExact:report.allMinimumDepthsExact,allWithinAdvertisedProbeBudgets:report.allWithinAdvertisedProbeBudgets,output}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
