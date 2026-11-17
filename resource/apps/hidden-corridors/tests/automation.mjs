// Public row-clue inference and bounded outcome lookahead only. No Model import,
// private-wall access, authored route, state restoration or privileged action.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{key:'ArrowUp',dx:0,dy:-1},{key:'ArrowRight',dx:1,dy:0},{key:'ArrowDown',dx:0,dy:1},{key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const bit=id=>1<<id;
const pathIds=m=>m.path.map(p=>p.cellId);
export const publicKnowledge=m=>m.cells.map(c=>({id:c.id,knowledge:c.knowledge,probed:c.probed}));
const popcount=x=>{let n=0;for(;x;x&=x-1)n++;return n;};
function context(m){
 if(m.grid?.cols!==4||m.grid?.rows!==4||!Array.isArray(m.cells)||m.cells.length!==16||!Array.isArray(m.rowOpenCounts)||m.rowOpenCounts.length!==4||!Number.isInteger(m.requiredDistance)||m.requiredDistance<1||m.requiredDistance>15)throw Error('Public inference requires the bounded 4 by 4 domain');
 for(let i=0;i<16;i++){const c=m.cells[i];if(c.id!==i||c.col!==i%4||c.row!==Math.floor(i/4)||!['unknown','open','wall'].includes(c.knowledge)||typeof c.probed!=='boolean')throw Error('Invalid public cell observation');}
 for(const n of m.rowOpenCounts)if(!Number.isInteger(n)||n<0||n>4)throw Error('Invalid public row count');
 for(const e of[m.entry,m.exit])if(!e||!Number.isInteger(e.id)||e.id<0||e.id>=16||m.cells[e.id].knowledge!=='open')throw Error('Public endpoints must be known open');
 if(m.entry.id===m.exit.id||!Number.isInteger(m.probesRemaining)||m.probesRemaining<0||m.probesRemaining>5)throw Error('Invalid public inference resources');
 return{open:m.cells.reduce((v,c)=>c.knowledge==='open'?v|bit(c.id):v,0),wall:m.cells.reduce((v,c)=>c.knowledge==='wall'?v|bit(c.id):v,0)};
}
export function shortestPublicPath(passableMask,entryId,exitId){
 if(!Number.isInteger(passableMask)||passableMask<0||passableMask>65535||!Number.isInteger(entryId)||!Number.isInteger(exitId)||entryId<0||entryId>=16||exitId<0||exitId>=16)throw Error('Invalid public path geometry');
 if(!(passableMask&bit(entryId))||!(passableMask&bit(exitId)))return[];
 const queue=[entryId],parents=Array(16).fill(-1);parents[entryId]=entryId;
 for(let head=0;head<queue.length;head++){const id=queue[head];if(id===exitId){const route=[];let p=id;while(p!==entryId){route.push(p);p=parents[p];}return[entryId,...route.reverse()];}const col=id%4,row=Math.floor(id/4);for(const d of DIRS){const x=col+d.dx,y=row+d.dy;if(x<0||x>=4||y<0||y>=4)continue;const next=y*4+x;if(parents[next]>=0||!(passableMask&bit(next)))continue;parents[next]=id;queue.push(next);}}
 return[];
}
function commonRoute(m,masks){let intersection=65535;for(const mask of masks)intersection&=mask;const route=shortestPublicPath(intersection,m.entry.id,m.exit.id);return route.length-1===m.requiredDistance?route:[];}
function enumerate(m,options,deadline){
 const c=context(m),choices=m.rowOpenCounts.map(n=>Array.from({length:16},(_,mask)=>mask).filter(mask=>popcount(mask)===n)),naturalBound=choices.reduce((n,row)=>n*row.length,1),cap=options.maxBoards??1296;
 if(!Number.isInteger(cap)||cap<1)throw Error('Board cap must be a positive integer');
 if(naturalBound>1296)throw Error('Four public rows exceeded their combinatorial bound');
 if(naturalBound>cap)return{found:false,reason:'board-cap',naturalBound,evaluated:0,candidateMasks:[]};
 const masks=[];let evaluated=0;
 function visit(row,mask){
  if(performance.now()>deadline)throw Error('time-cap');
  if(row===4){if(evaluated>=cap)throw Error('board-cap');evaluated++;if((mask&c.open)!==c.open||(mask&c.wall)!==0)return;const route=shortestPublicPath(mask,m.entry.id,m.exit.id);if(route.length-1===m.requiredDistance)masks.push(mask);return;}
  for(const rowMask of choices[row])visit(row+1,mask|(rowMask<<(row*4)));
 }
 try{visit(0,0);}catch(e){if(e.message==='time-cap'||e.message==='board-cap')return{found:false,reason:e.message,naturalBound,evaluated,candidateMasks:[]};throw e;}
 return{found:masks.length>0,reason:masks.length?null:'inconsistent-public-clues',naturalBound,evaluated,candidateCount:masks.length,candidateMasks:masks,safeRoute:masks.length?commonRoute(m,masks):[]};
}
export function inferVisibleState(m,options={}){const ms=options.maxMilliseconds??1000;if(!Number.isFinite(ms)||ms<=0)throw Error('Time cap must be finite and positive');return enumerate(m,options,performance.now()+ms);}
function observationBound(unknown,depth){let sum=1,choose=1;for(let i=1;i<=Math.min(unknown,depth);i++){choose=choose*(unknown-i+1)/i;sum+=choose*2**i;}return sum;}
export function planVisibleState(m,options={}){
 const ms=options.maxMilliseconds??1000;if(!Number.isFinite(ms)||ms<=0)throw Error('Time cap must be finite and positive');const start=performance.now(),deadline=start+ms,base=enumerate(m,options,deadline);if(!base.found)return base;
 const naturalPolicyBound=observationBound(m.cells.filter(c=>c.knowledge==='unknown').length,m.probesRemaining),cap=options.maxPolicyStates??naturalPolicyBound;
 if(!Number.isInteger(cap)||cap<1)throw Error('Policy cap must be a positive integer');
 const memo=new Map();let expanded=0;
 function policy(masks,depth){
  if(performance.now()>deadline)throw Error('time-cap');const key=depth+':'+masks.join(',');if(memo.has(key))return memo.get(key);
  if(expanded>=Math.min(cap,naturalPolicyBound))throw Error('policy-cap');expanded++;
  const route=commonRoute(m,masks);if(route.length){const result={safeRoute:route,probe:null,worstCaseProbes:0};memo.set(key,result);return result;}
  if(depth===0){memo.set(key,null);return null;}
  const candidates=[];for(const c of m.cells){if(c.knowledge!=='unknown')continue;const open=masks.filter(mask=>mask&bit(c.id)),wall=masks.filter(mask=>!(mask&bit(c.id)));if(!open.length||!wall.length)continue;candidates.push({cellId:c.id,open,wall,worst:Math.max(open.length,wall.length)});}
  candidates.sort((a,b)=>a.worst-b.worst||a.cellId-b.cellId);const partitions=new Set();
  for(const c of candidates){
   if(performance.now()>deadline)throw Error('time-cap');const partition=[c.open.join(','),c.wall.join(',')].sort().join('|');if(partitions.has(partition))continue;partitions.add(partition);
   const a=policy(c.open,depth-1);if(!a)continue;const b=policy(c.wall,depth-1);if(!b)continue;
   const result={safeRoute:[],probe:{cellId:c.cellId,openCandidates:c.open.length,wallCandidates:c.wall.length,worstRemainingCandidates:c.worst},worstCaseProbes:1+Math.max(a.worstCaseProbes,b.worstCaseProbes)};memo.set(key,result);return result;
  }
  memo.set(key,null);return null;
 }
 try{const result=policy(base.candidateMasks,m.probesRemaining);if(!result)return{...base,found:false,reason:'insufficient-public-probe-budget',policyStates:expanded,naturalPolicyBound};return{...base,...result,found:true,policyStates:expanded,naturalPolicyBound,milliseconds:performance.now()-start};}
 catch(e){if(e.message==='time-cap'||e.message==='policy-cap')return{...base,found:false,reason:e.message,policyStates:expanded,naturalPolicyBound};throw e;}
}
export function createPilot(){
 let previousElapsed=null,due=0,pending=null,neutralTick=-1,task=null,route=null,record=false,started=false,routeBeat=0;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<600)diagnostics.push({type,...data});};
 function reset(){due=0;pending=null;neutralTick=-1;task=null;route=null;started=false;routeBeat=0;diagnostics.length=0;}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,at:m.elapsed,beforeId:m.selectedId,beforeMode:m.mode,beforeUsed:m.probesUsed,beforeRemaining:m.probesRemaining,beforeLog:m.probeLog.map(p=>({...p})),beforeKnowledge:publicKnowledge(m),beforePath:pathIds(m),beforeMoves:m.routeMoves,beforeBacktracks:m.backtracks,beforeSwitches:m.modeSwitches,beforeSubmissions:m.submissions,...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys;}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(!started){record=options.mode==='record';started=true;due=m.elapsed+(record?2.5:1);note('observed-round',{level:m.level,elapsed:m.elapsed});}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[];}if(m.tick<=neutralTick)return[];
   let done=false;
   if(pending.kind==='cursor'&&m.selectedId!==pending.beforeId){if(m.mode!=='probe'||m.probesUsed!==pending.beforeUsed||!same(publicKnowledge(m),pending.beforeKnowledge))throw Error('Probe cursor changed knowledge or resources');done=true;due=m.elapsed+(record?.4:.05);note('observed-cursor',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId});}
   if(pending.kind==='probe'&&m.probesUsed===pending.beforeUsed+1){
    const cell=m.cells.find(c=>c.id===pending.cellId),others=publicKnowledge(m).filter(c=>c.id!==pending.cellId);if(!cell||!['open','wall'].includes(cell.knowledge)||!cell.probed||m.probesRemaining!==pending.beforeRemaining-1||!same(others,pending.beforeKnowledge.filter(c=>c.id!==pending.cellId))||m.probeLog.length!==pending.beforeLog.length+1||!same(m.probeLog.slice(0,-1),pending.beforeLog))throw Error('Paid probe did not preserve the public observation/resource ledger');
    const log=m.probeLog.at(-1);if(log.cellId!==pending.cellId||log.result!==cell.knowledge)throw Error('Probe log disagrees with its permanent observation');
    if(m.lastProbe){if(!m.lastProbe.charged||m.lastProbe.cellId!==pending.cellId||m.lastProbe.result!==cell.knowledge||m.lastProbe.reason!=='revealed'||m.lastProbe.at!==log.at||Math.abs(m.lastProbe.expiresAt-(log.at+.6))>1e-9)throw Error('Visible probe emission disagrees with the observation');}else if(m.elapsed-log.at<.6)throw Error('Probe feedback disappeared before its highlight lifetime');
    const inferred=inferVisibleState(m);if(!inferred.found||inferred.candidateCount>=pending.candidateCount)throw Error('Selected information-gaining probe failed to reduce public candidates');
    done=true;task=null;due=m.elapsed+(record?4.2:.3);note('observed-information-gain',{elapsed:m.elapsed,cellId:cell.id,result:cell.knowledge,probesUsed:m.probesUsed,candidatesBefore:pending.candidateCount,candidatesAfter:inferred.candidateCount});
   }
   if(pending.kind==='enter-route'&&m.mode==='route'){if(!same(pathIds(m),[m.entry.id])||m.probesUsed!==pending.beforeUsed||!same(publicKnowledge(m),pending.beforeKnowledge))throw Error('Entering route altered clues or failed to start at entry');done=true;due=m.elapsed+(record?1.5:.15);note('observed-route-mode',{elapsed:m.elapsed,route});}
   if(pending.kind==='append'&&m.path.length>pending.beforePath.length){const actual=pathIds(m);if(m.mode!=='route'||!route||!same(actual,route.slice(0,actual.length))||m.probesUsed!==pending.beforeUsed||!same(publicKnowledge(m),pending.beforeKnowledge))throw Error('Observed path diverged from the guaranteed public route');done=true;due=m.elapsed+(record?routeBeat:.08);note('observed-route-progress',{elapsed:m.elapsed,pathEdges:m.pathEdges,routeIds:actual,unknownCellsOnRoute:actual.filter(id=>m.cells[id].knowledge==='unknown').length});}
   if(pending.kind==='backtrack'&&m.backtracks===pending.beforeBacktracks+1){if(!same(pathIds(m),pending.beforePath.slice(0,-1))||m.probesUsed!==pending.beforeUsed||!same(publicKnowledge(m),pending.beforeKnowledge))throw Error('B did not pop one route edge without refund');done=true;due=m.elapsed+(record?.8:.1);}
   if(pending.kind==='to-probe'&&m.mode==='probe'){if(m.probesUsed!==pending.beforeUsed||!same(publicKnowledge(m),pending.beforeKnowledge))throw Error('Returning to probe changed observations');done=true;route=null;due=m.elapsed+(record?.8:.1);}
   if(pending.kind==='submit'&&m.submissions>pending.beforeSubmissions)throw Error('A route proven safe for every public candidate was rejected');
   if(done)pending=null;else if(m.elapsed-pending.at>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.25;}else return[];
  }
  if(m.elapsed<due)return[];
  if(m.mode==='probe'){
   if(!task){const plan=planVisibleState(m);note('public-candidate-inference',{elapsed:m.elapsed,found:plan.found,candidates:plan.candidateCount,boardsEvaluated:plan.evaluated,naturalBound:plan.naturalBound,policyStates:plan.policyStates,worstCaseProbes:plan.worstCaseProbes,safeRoute:plan.safeRoute,probe:plan.probe});if(!plan.found)throw Error('Public clues cannot guarantee a route within available probes: '+plan.reason);
    if(plan.safeRoute.length){route=plan.safeRoute;routeBeat=record?Math.max(1,Math.min(2.5,(34-m.elapsed)/(route.length))):0;return issue(m,'enter-route',['b']);}
    task={cellId:plan.probe.cellId,candidateCount:plan.candidateCount,ready:false};
   }
   if(m.selectedId!==task.cellId){const from=m.cells[m.selectedId],to=m.cells[task.cellId],d=to.col!==from.col?DIRS[to.col>from.col?1:3]:DIRS[to.row>from.row?2:0];return issue(m,'cursor',[d.key],{expectedId:(from.row+d.dy)*4+from.col+d.dx});}
   if(!task.ready){task.ready=true;due=m.elapsed+(record?1.2:.1);return[];}
   if(m.cells[task.cellId].knowledge!=='unknown'){task=null;return[];}return issue(m,'probe',['Space'],{cellId:task.cellId,candidateCount:task.candidateCount});
  }
  if(m.mode!=='route')throw Error('Unknown public control mode');
  if(!route){const plan=planVisibleState(m);if(!plan.found)throw Error('No bounded public route policy');if(plan.safeRoute.length){route=plan.safeRoute;routeBeat=record?Math.max(1,Math.min(2.5,(34-m.elapsed)/route.length)):0;}else{if(m.path.length>1)return issue(m,'backtrack',['b']);return issue(m,'to-probe',['b']);}}
  const actual=pathIds(m);if(!same(actual,route.slice(0,actual.length))){if(actual.length>1)return issue(m,'backtrack',['b']);route=null;return[];}
  if(actual.length===route.length){if(!m.atExit||!m.lengthMatches)throw Error('Public safe route endpoint/edge length mismatch');return issue(m,'submit',['Space']);}
  const next=m.cells[route[actual.length]],current=m.cells[actual.at(-1)],d=DIRS.find(d=>current.col+d.dx===next.col&&current.row+d.dy===next.row);if(!d)throw Error('Public inferred route is not cardinal');return issue(m,'append',[d.key]);
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options);}
export function assertPublicSurvey(m,assert){
 context(m);assert.equal(m.probesRemaining,m.probeBudget-m.probesUsed);assert.equal(m.probeLog.length,m.probesUsed);assert.equal(m.cells.filter(c=>c.probed).length,m.probesUsed);assert.equal(m.revealedCount,m.cells.filter(c=>c.knowledge!=='unknown').length);assert.equal(m.revealedCount,m.probesUsed+2);assert.ok(m.probesRemaining>=0);
 const ids=pathIds(m);assert.ok(ids.length>=1);assert.equal(ids[0],m.entry.id);assert.equal(new Set(ids).size,ids.length);assert.equal(m.pathEdges,ids.length-1);assert.equal(m.lengthMatches,m.pathEdges===m.requiredDistance);assert.equal(m.atExit,ids.at(-1)===m.exit.id);assert.deepEqual(m.visited,m.cells.map(c=>ids.includes(c.id)));for(let i=1;i<ids.length;i++){const a=m.cells[ids[i-1]],b=m.cells[ids[i]];assert.equal(Math.abs(a.col-b.col)+Math.abs(a.row-b.row),1);assert.notEqual(b.knowledge,'wall');}
 for(const entry of m.probeLog){const c=m.cells[entry.cellId];assert.equal(c.probed,true);assert.equal(c.knowledge,entry.result);assert.ok(['open','wall'].includes(entry.result));}assert.equal(new Set(m.probeLog.map(p=>p.cellId)).size,m.probeLog.length);
 const selected=m.mode==='route'?ids.at(-1):m.probeCursorId;assert.equal(m.selectedId,selected);for(const k of['id','col','row','x','y'])assert.equal(m.cursor[k],m.cells[selected][k]);assert.ok(m.exhaustedStrikes<=m.totalWrong);assert.ok(m.exhaustedStrikes<=3);assert.equal(m.score,m.probesUsed*40+Math.min(m.pathEdges,m.requiredDistance)*10+(m.phase==='won'?1000+m.probesRemaining*100+Math.floor(m.remaining)*5:0));
 if(m.lastSubmission){const s=m.lastSubmission;assert.deepEqual(Object.keys(s).sort(),['id','accepted','reason','routeIds','pathEdges','requiredDistance','probesRemaining','chargedStrike','exhaustedStrikes','at'].sort());assert.ok(['accepted','shape','endpoint','length','unsafe'].includes(s.reason));assert.equal(s.accepted,s.reason==='accepted');assert.equal(s.pathEdges,s.routeIds.length-1);assert.equal(s.requiredDistance,m.requiredDistance);}
}
export function assertProgress({after,trace},assert){const m=after.model;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.lostReason,null);assert.equal(m.atExit,true);assert.equal(m.lengthMatches,true);assert.equal(m.lastSubmission.accepted,true);assert.equal(m.totalWrong,0);assert.ok(m.probesUsed>0);assertPublicSurvey(m,assert);const inferred=inferVisibleState(m);assert.equal(inferred.found,true);assert.ok(inferred.candidateCount>=1);const ids=pathIds(m);assert.ok(inferred.candidateMasks.every(mask=>ids.every(id=>mask&bit(id))),'submitted path must be safe in every board compatible with public observations');for(const t of trace)assertPublicSurvey(t.state.model,assert);const samples=trace.map(t=>t.state.model);assert.ok(samples.some(s=>s.mode==='probe'&&s.probesUsed>0));assert.ok(samples.some(s=>s.mode==='route'&&s.pathEdges>0&&s.phase==='playing'));const initial=inferVisibleState(samples[0]);assert.equal(initial.found,true);assert.ok(initial.candidateCount>=2);assert.equal(initial.safeRoute.length,0,'initial clues must require real information');assert.ok(inferred.candidateCount<initial.candidateCount);}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.lostReason,null);assert.equal(m.mode,'probe');assert.equal(m.lastProbe,null);assert.equal(m.lastSubmission,null);assert.ok(m.elapsed<2);for(const k of['probesUsed','probeAttempts','repeatedProbes','blockedProbes','submissions','totalWrong','exhaustedStrikes','routeMoves','backtracks','modeSwitches'])assert.equal(m[k],0);for(const k of['cells','entry','exit','rowOpenCounts','requiredDistance','probeBudget','probesRemaining','revealedCount','probeCursorId','selectedId','cursor','path','visited','pathEdges','lengthMatches','atExit','probeLog'])assert.deepEqual(m[k],initial.model[k]);assertPublicSurvey(m,assert);}
