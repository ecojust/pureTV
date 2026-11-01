// Public-only stable-segment predictor, bounded A*, and observed keyboard edges.
// Never imports the production model, author witnesses, or a private route.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{name:'N',key:'ArrowUp',dx:0,dy:-1},{name:'E',key:'ArrowRight',dx:1,dy:0},{name:'S',key:'ArrowDown',dx:0,dy:1},{name:'W',key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const publicAssignments=m=>m.cells.filter(c=>c.stoneId!==null).map(c=>({cellId:c.id,stoneId:c.stoneId}));

function context(m){
 if(!Array.isArray(m.cells)||m.cells.length!==16||!Array.isArray(m.stones)||m.stones.length<2||m.stones.length>16||!Array.isArray(m.actions)||m.actions.length!==16||!Array.isArray(m.lines)||m.lines.length!==8)throw Error('Expected public 4x4 board, physical stones and sixteen single-line actions');
 const cells=m.cells.map(c=>({id:c.id,col:c.col,row:c.row,kind:c.kind,targetHole:c.targetHole})),stones=m.stones.map(s=>({id:s.id,value:s.value})),lines=m.lines.map(l=>({id:l.id,axis:l.axis,index:l.index})),actions=m.actions.map(a=>({id:a.id,lineId:a.lineId,direction:a.direction}));
 const ci=new Map(cells.map((c,i)=>[c.id,i])),si=new Map(stones.map((s,i)=>[s.id,i+1])),li=new Map(lines.map((l,i)=>[l.id,i])),ai=new Map(actions.map((a,i)=>[a.id,i]));
 if(ci.size!==16||si.size!==stones.length||li.size!==8||ai.size!==16||stones.some(s=>!Number.isSafeInteger(s.value)))throw Error('Unique physical IDs and finite integer values are required');
 const coordinates=new Map();for(const c of cells){if(!Number.isInteger(c.col)||!Number.isInteger(c.row)||c.col<0||c.col>3||c.row<0||c.row>3||!['sand','pillar'].includes(c.kind)||typeof c.targetHole!=='boolean'||c.kind==='pillar'&&c.targetHole)throw Error('Invalid public cell geometry or hole role');coordinates.set(c.col+','+c.row,c.id)}if(coordinates.size!==16)throw Error('Distinct grid coordinates required');
 const lineKeys=new Set(),segments=lines.map(l=>{if(!['row','column'].includes(l.axis)||!Number.isInteger(l.index)||l.index<0||l.index>3||lineKeys.has(l.axis+','+l.index))throw Error('Each row and column must occur exactly once');lineKeys.add(l.axis+','+l.index);const ids=Array.from({length:4},(_,i)=>ci.get(coordinates.get(l.axis==='row'?i+','+l.index:l.index+','+i)));const runs=[];let run=[];for(const id of ids){if(cells[id].kind==='pillar'){if(run.length)runs.push(run);run=[]}else run.push(id)}if(run.length)runs.push(run);return{cellIndices:ids,segments:runs}});
 const actionKeys=new Set();for(const a of actions){const line=lines[li.get(a.lineId)];if(!line||!(line.axis==='row'?['W','E']:['N','S']).includes(a.direction)||actionKeys.has(a.lineId+','+a.direction))throw Error('Invalid or duplicate public line action');actionKeys.add(a.lineId+','+a.direction)}
 const targetSet=new Set(m.targetHoleIds);if(targetSet.size!==m.targetHoleIds.length||[...targetSet].some(id=>!ci.has(id)||cells[ci.get(id)].kind!=='sand')||cells.some(c=>c.targetHole!==targetSet.has(c.id)))throw Error('Exact public target holes do not match sand cells');
 const snake=[];for(let row=0;row<4;row++)for(let col=0;col<4;col++)snake.push(ci.get(coordinates.get((row%2?3-col:col)+','+row)));
 const pillarIndices=cells.flatMap((c,i)=>c.kind==='pillar'?[i]:[]),targetSlots=snake.filter(i=>cells[i].kind==='sand'&&!targetSet.has(cells[i].id));if(targetSlots.length!==stones.length)throw Error('Stone inventory and exact target-hole count differ');
 const sorted=stones.map((s,i)=>({value:s.value,token:i+1})).sort((a,b)=>a.value-b.value||a.token-b.token),target=Array(16).fill(0);targetSlots.forEach((slot,i)=>target[slot]=sorted[i].token);
 return{cells,stones,lines,actions,ci,si,li,ai,segments,snake,targetSet,pillarIndices,target,duplicateValues:new Set(stones.map(s=>s.value)).size!==stones.length};
}
function layoutFromAssignments(c,assignments){const board=Array(16).fill(0),used=new Set();for(const a of assignments){const id=c.ci.get(a.cellId),token=c.si.get(a.stoneId);if(id===undefined||!token||c.cells[id].kind!=='sand'||board[id]||used.has(token))throw Error('Physical stone assignment duplicates an ID or occupies a pillar');board[id]=token;used.add(token)}if(used.size!==c.stones.length)throw Error('A physical stone is missing');return board}
function assignmentsFromLayout(c,board){return c.cells.flatMap((cell,i)=>board[i]?[{cellId:cell.id,stoneId:c.stones[board[i]-1].id}]:[])}
function evaluate(c,board){
 const readIndices=c.snake.filter(i=>board[i]),readCellIds=readIndices.map(i=>c.cells[i].id),readStoneIds=readIndices.map(i=>c.stones[board[i]-1].id),readValues=readIndices.map(i=>c.stones[board[i]-1].value),orderedPairs=readValues.slice(1).filter((v,i)=>readValues[i]<v).length,orderPairCount=c.stones.length-1;
 const holeIds=c.cells.flatMap((cell,i)=>cell.kind==='sand'&&!board[i]?[cell.id]:[]),targetHoleIds=c.cells.filter(cell=>c.targetSet.has(cell.id)).map(cell=>cell.id),matchedHoleCount=holeIds.filter(id=>c.targetSet.has(id)).length;
 const strictlyIncreasing=orderedPairs===orderPairCount,holesCorrect=holeIds.length===targetHoleIds.length&&matchedHoleCount===targetHoleIds.length;
 return{physicalAssignments:assignmentsFromLayout(c,board),snakeOrder:c.snake.map(i=>c.cells[i].id),readCellIds,readStoneIds,readValues,holeIds,targetHoleIds,pillarIds:c.pillarIndices.map(i=>c.cells[i].id),stoneCount:c.stones.length,pillarCount:c.pillarIndices.length,targetHoleCount:targetHoleIds.length,orderedPairs,orderPairCount,strictlyIncreasing,matchedHoleCount,holesCorrect,goalReady:strictlyIncreasing&&holesCorrect};
}
function compact(c,board,actionIndex){const a=c.actions[actionIndex],next=board.slice(),segments=c.segments[c.li.get(a.lineId)].segments;for(const segment of segments){const tokens=segment.map(i=>board[i]).filter(Boolean),offset=['W','N'].includes(a.direction)?0:segment.length-tokens.length;segment.forEach(i=>next[i]=0);tokens.forEach((token,i)=>next[segment[offset+i]]=token)}return next}
function movesBetween(c,before,after){const from=Array(c.stones.length+1),to=Array(c.stones.length+1);before.forEach((t,i)=>{if(t)from[t]=i});after.forEach((t,i)=>{if(t)to[t]=i});return c.stones.flatMap((s,i)=>from[i+1]===to[i+1]?[]:[{stoneId:s.id,fromCellId:c.cells[from[i+1]].id,toCellId:c.cells[to[i+1]].id}])}
export function evaluateBoard(m,assignments=publicAssignments(m)){const c=context(m);return evaluate(c,layoutFromAssignments(c,assignments))}
export function predictCompaction(m,actionId=m.selectedId){const c=context(m),index=c.ai.get(actionId);if(index===undefined)throw Error('Unknown public compaction action');const before=layoutFromAssignments(c,publicAssignments(m)),after=compact(c,before,index),moves=movesBetween(c,before,after),a=c.actions[index],result=evaluate(c,after);return{actionId:a.id,lineId:a.lineId,direction:a.direction,changed:moves.length>0,movedCount:moves.length,moves,afterAssignments:result.physicalAssignments,willWin:moves.length>0&&result.goalReady,willExhaustMoves:moves.length>0&&m.movesUsed+1>=m.moveLimit&&!result.goalReady}}

export function planVisibleState(m,options={}){
 const c=context(m),goal=options.goal??'goal',maxExpanded=options.maxExpanded??100000,maxQueued=options.maxQueued??100000,maxMilliseconds=options.maxMilliseconds??2500,maxMoves=options.maxMoves??m.movesRemaining;
 if(!['goal','ordered-wrong-holes','holes-wrong-order'].includes(goal)||!Number.isInteger(maxExpanded)||maxExpanded<1||maxExpanded>1000000||!Number.isInteger(maxQueued)||maxQueued<1||maxQueued>1000000||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0||!Number.isInteger(maxMoves)||maxMoves<0||maxMoves>90)throw Error('Invalid explicit bounded public search parameters');
 if(goal!=='holes-wrong-order'&&c.duplicateValues)return{found:false,reason:'duplicate-values-cannot-be-strictly-increasing',expanded:0,visited:0};
 const started=performance.now(),deadline=started+maxMilliseconds,initial=layoutFromAssignments(c,publicAssignments(m)),targetPosition=Array(c.stones.length+1);c.target.forEach((token,i)=>{if(token)targetPosition[token]=i});let expanded=0,serial=0,limited=null,maximumQueued=0;const open=[],best=new Map();
 function heuristic(board){if(goal!=='goal')return 0;let wrongRow=0,wrongColumn=0;board.forEach((token,i)=>{if(token){const target=c.cells[targetPosition[token]],actual=c.cells[i];wrongRow+=actual.row!==target.row;wrongColumn+=actual.col!==target.col}});return Math.ceil(wrongRow/4)+Math.ceil(wrongColumn/4)}
 function priority(a,b){return a.f-b.f||a.h-b.h||a.serial-b.serial}
 function checkTime(){if(performance.now()>deadline){limited='time-cap';return false}return true}
 function push(node){if(!checkTime())return false;if(open.length>=maxQueued||(!best.has(node.key)&&best.size>=maxQueued)){limited='queue-cap';return false}best.set(node.key,node.g);open.push(node);maximumQueued=Math.max(maximumQueued,open.length);let index=open.length-1;while(index>0){const parent=(index-1)>>1;if(priority(open[parent],node)<=0)break;open[index]=open[parent];index=parent}open[index]=node;return true}
 function pop(){const result=open[0],last=open.pop();if(open.length){let index=0;while(index*2+1<open.length){let child=index*2+1;if(child+1<open.length&&priority(open[child+1],open[child])<0)child++;if(priority(last,open[child])<=0)break;open[index]=open[child];index=child}open[index]=last}return result}
 function matches(result){return goal==='goal'?result.goalReady:goal==='ordered-wrong-holes'?result.strictlyIncreasing&&!result.holesCorrect:result.holesCorrect&&!result.strictlyIncreasing}
 const h=heuristic(initial);push({board:initial,key:initial.join(','),g:0,h,f:h,parent:null,actionIndex:null,serial:serial++});
 while(open.length&&!limited){
  if(!checkTime())break;const node=pop();if(best.get(node.key)!==node.g)continue;
  if(expanded>=maxExpanded){limited='node-cap';break}expanded++;
  const result=evaluate(c,node.board);
  if(matches(result)){const path=[];for(let n=node;n.parent;n=n.parent)path.push(c.actions[n.actionIndex].id);path.reverse();return{found:true,goal,actionIds:path,steps:path.length,finalAssignments:result.physicalAssignments,evaluation:result,expanded,visited:best.size,maximumQueued,milliseconds:performance.now()-started}}
  if(node.g>=maxMoves||result.goalReady)continue;
  for(let i=0;i<c.actions.length;i++){
   if(!checkTime())break;const board=compact(c,node.board,i),key=board.join(',');if(key===node.key)continue;const g=node.g+1;if(best.has(key)&&best.get(key)<=g)continue;const nextResult=evaluate(c,board);if(goal!=='goal'&&(nextResult.goalReady||g>=m.movesRemaining))continue;const estimate=heuristic(board);if(g+estimate>maxMoves)continue;
   if(!push({board,key,g,h:estimate,f:g+estimate,parent:node,actionIndex:i,serial:serial++}))break;
  }
 }
 return{found:false,reason:limited??'no-public-solution-within-budget',expanded,visited:best.size,maximumQueued,milliseconds:performance.now()-started};
}

function nextFocus(items,id,dir){const origin=items.find(i=>i.id===id);if(!origin)throw Error('Unknown public action focus');const candidates=items.map((i,index)=>({i,index,dx:i.x-origin.x,dy:i.y-origin.y})).filter(p=>p.dx*dir.dx+p.dy*dir.dy>0),distance=p=>p.dx*p.dx+p.dy*p.dy,perp=p=>Math.abs(dir.dx?p.dy:p.dx);candidates.sort((a,b)=>(distance(a)+2*perp(a)**2)-(distance(b)+2*perp(b)**2)||distance(a)-distance(b)||perp(a)-perp(b)||a.index-b.index);return candidates[0]?.i.id??id}
function focusItems(m){const items=m.focusItems.map(i=>({id:i.id,kind:i.kind,x:i.x,y:i.y}));if(items.length!==16||new Set(items.map(i=>i.id)).size!==16||items.some(i=>i.kind!=='compact'||!Number.isFinite(i.x)||!Number.isFinite(i.y)))throw Error('Invalid finite sixteen-action focus graph');return items}
export function predictFocus(m,direction){const d=DIRS.find(d=>d.name===direction);if(!d)throw Error('Unknown cardinal direction');return nextFocus(focusItems(m),m.selectedId,d)}
export function focusPath(m,targetId){const items=focusItems(m);if(!items.some(i=>i.id===targetId))throw Error('Target is outside public focus graph');const queue=[{id:m.selectedId,path:[]}],seen=new Set([m.selectedId]);for(let i=0;i<queue.length;i++){const n=queue[i];if(n.id===targetId)return n.path;for(const d of DIRS){const id=nextFocus(items,n.id,d);if(!seen.has(id)){seen.add(id);queue.push({id,path:[...n.path,d.name]})}}}throw Error('Public arrow graph is not reachable')}

const LEDGER=['movesUsed','movesRemaining','historyDepth','undos','compactionAttempts','noOpAttempts'];
export function createPilot(){
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trial=null,neutralTick=-1;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<700)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trial=null;neutralTick=-1;diagnostics.length=0}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeSelected:m.selectedId,beforeAssignments:publicAssignments(m),beforeLedger:Object.fromEntries(LEDGER.map(k=>[k,m[k]])),...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.movesUsed===0?'trial-plan':'solution';due=m.elapsed+(record?2:.3);note('observed-round',{elapsed:m.elapsed,level:m.level,stage})}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}if(m.tick<=neutralTick)return[];let observed=false;
   if(pending.kind==='navigate'){
    if(!same(publicAssignments(m),pending.beforeAssignments)||LEDGER.some(k=>m[k]!==pending.beforeLedger[k]))throw Error('Navigation changed real stone layout or charged budget');
    if(m.selectedId!==pending.beforeSelected){observed=true;due=m.elapsed+(record?.16:.02);note('observed-focus',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId,repeated:m.selectedId!==pending.expectedId})}
   }else if(pending.kind==='compact'&&m.movesUsed===pending.beforeLedger.movesUsed+1){
    const p=pending.predicted,e=m.lastCompaction;
    if(!same(publicAssignments(m),p.afterAssignments)||m.selectedId!==p.actionId||m.movesRemaining!==pending.beforeLedger.movesRemaining-1||m.historyDepth!==pending.beforeLedger.historyDepth+1||m.compactionAttempts!==pending.beforeLedger.compactionAttempts+1||m.undos!==pending.beforeLedger.undos||m.noOpAttempts!==pending.beforeLedger.noOpAttempts)throw Error('Actual compaction lost stable IDs, charged budget or its exact action');
    if(!e||e.id!==m.movesUsed||!same(e.beforeAssignments,pending.beforeAssignments)||!same(e.afterAssignments,p.afterAssignments)||!same(e.moves,p.moves)||e.movedCount!==p.movedCount||['actionId','lineId','direction'].some(k=>e[k]!==p[k])||!same(e,m.history.at(-1)))throw Error('Successful compaction receipt differs from independent stable-segment prediction');
    observed=true;task=null;note('observed-compaction',{elapsed:m.elapsed,edit:structuredClone(e),movesUsed:m.movesUsed,movesRemaining:m.movesRemaining,undos:m.undos,orderedPairs:m.orderedPairs,matchedHoleCount:m.matchedHoleCount});
    if(stage==='trial-plan'){if(e.movedCount<2)throw Error('Record trial must move multiple actual stones');trial={edit:structuredClone(e),beforeAssignments:pending.beforeAssignments};stage='trial-inspect';due=m.elapsed+4.2}else{stage='solution';due=m.elapsed+(record?.9:.05)}
   }else if(pending.kind==='undo'&&m.undos===pending.beforeLedger.undos+1){
    if(!trial||!same(publicAssignments(m),trial.beforeAssignments)||m.selectedId!==trial.edit.actionId||m.historyDepth!==pending.beforeLedger.historyDepth-1||['movesUsed','movesRemaining','compactionAttempts','noOpAttempts'].some(k=>m[k]!==pending.beforeLedger[k])||!same(m.lastUndo?.edit,trial.edit)||m.elapsed<=pending.issuedAt)throw Error('B must restore exact pre-trial IDs and focus without refunding time or successful moves');
    observed=true;stage='solution';due=m.elapsed+4.2;note('observed-undo',{elapsed:m.elapsed,edit:structuredClone(m.lastUndo),assignments:publicAssignments(m),movesUsed:m.movesUsed,movesRemaining:m.movesRemaining,undos:m.undos});
   }
   if(observed)pending=null;else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.2}else return[];
  }
  if(m.elapsed<due)return[];
  if(stage==='trial-inspect')return issue(m,'undo',['b']);
  if(!task){
   const plan=planVisibleState(m);note('public-A-star-search',{elapsed:m.elapsed,found:plan.found,steps:plan.steps,expanded:plan.expanded,visited:plan.visited,milliseconds:plan.milliseconds});if(!plan.found)throw Error('No public budget-valid layout: '+plan.reason);if(!plan.actionIds.length)throw Error('A current ready playing state is not an authored ordinary starting board');
   let actionId=plan.actionIds[0];
   if(stage==='trial-plan'){if(plan.steps+1>m.movesRemaining)throw Error('Normal record demonstration requires one extra charged move');const first=predictCompaction(m,actionId);if(first.movedCount<2||first.willWin){const alternative=m.actions.map(a=>predictCompaction(m,a.id)).find(p=>p.changed&&p.movedCount>=2&&!p.willWin&&!p.willExhaustMoves);if(!alternative)throw Error('No meaningful public multi-stone trial within the charged budget');actionId=alternative.actionId}note('planned-public-multi-stone-trial',{elapsed:m.elapsed,actionId,chosenFromFirstSolutionStep:actionId===plan.actionIds[0]})}
   task={actionId};
  }
  const path=focusPath(m,task.actionId);if(path.length){const d=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[d.key],{expectedId:predictFocus(m,d.name)})}
  const predicted=predictCompaction(m,task.actionId);if(!predicted.changed||predicted.willExhaustMoves)throw Error('Observed public move is no longer a safe successful compaction');
  if(task.previewObservedAt===undefined){task.previewObservedAt=m.elapsed;due=m.elapsed+(record?2.5:.06);note('observed-real-preview',{elapsed:m.elapsed,...predicted});return[]}
  return issue(m,'compact',['Space'],{predicted});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options)}

export function assertPublicBoard(m,assert){
 const c=context(m),board=layoutFromAssignments(c,publicAssignments(m)),e=evaluate(c,board);for(const k of ['snakeOrder','readCellIds','readStoneIds','readValues','holeIds','targetHoleIds','pillarIds','stoneCount','pillarCount','targetHoleCount','orderedPairs','orderPairCount','strictlyIncreasing','matchedHoleCount','holesCorrect','goalReady'])assert.deepEqual(m[k],e[k]);
 for(const stone of m.stones)assert.equal(stone.cellId,e.physicalAssignments.find(a=>a.stoneId===stone.id).cellId);
 for(let i=0;i<m.lines.length;i++){const line=m.lines[i],derived=c.segments[i];assert.deepEqual(line.cellIds,derived.cellIndices.map(n=>c.cells[n].id));assert.deepEqual(line.segments,derived.segments.map(s=>s.map(n=>c.cells[n].id)))}
 assert.deepEqual(m.cursor,m.focusItems.find(f=>f.id===m.selectedId));assert.deepEqual(m.preview,predictCompaction(m));assert.equal(m.historyDepth,m.history.length);assert.equal(m.historyDepth,m.movesUsed-m.undos);assert.equal(m.compactionAttempts,m.movesUsed+m.noOpAttempts);assert.equal(m.movesRemaining,Math.max(0,m.moveLimit-m.movesUsed));assert.ok(m.movesUsed>=0&&m.movesUsed<=m.moveLimit&&m.undos>=0);
 let previousAfter=null,lastId=0;for(const h of m.history){assert.ok(h.id>lastId&&h.id<=m.movesUsed);lastId=h.id;const before=layoutFromAssignments(c,h.beforeAssignments),after=compact(c,before,c.ai.get(h.actionId)),action=c.actions[c.ai.get(h.actionId)];assert.equal(h.lineId,action.lineId);assert.equal(h.direction,action.direction);assert.deepEqual(h.afterAssignments,assignmentsFromLayout(c,after));assert.deepEqual(h.moves,movesBetween(c,before,after));assert.equal(h.movedCount,h.moves.length);assert.ok(h.movedCount>0);if(previousAfter)assert.deepEqual(h.beforeAssignments,previousAfter);previousAfter=h.afterAssignments}if(previousAfter)assert.deepEqual(previousAfter,e.physicalAssignments);
 assert.equal(m.score,m.orderedPairs*25+m.matchedHoleCount*20+(m.phase==='won'?1000+Math.floor(m.remaining)*5+m.movesRemaining*50:0));assert.ok(Math.abs(m.elapsed-m.tick/60)<1e-7);assert.ok(Math.abs(m.remaining-Math.max(0,m.timeLimit-m.elapsed))<1e-7);
 if(m.transition){assert.equal(m.phase,'playing');assert.ok(['compact','undo'].includes(m.transition.kind));assert.equal(m.transition.duration,.24);assert.ok(m.elapsed>=m.transition.startedAt&&m.elapsed<m.transition.startedAt+.24+1e-8)}
 if(m.phase==='won'){assert.equal(m.goalReady,true);assert.equal(m.strictlyIncreasing,true);assert.equal(m.holesCorrect,true);assert.equal(m.lostReason,null);assert.equal(m.transition,null)}
 if(m.phase==='lost')assert.equal(m.transition,null);
}
export function assertProgress({before,after,trace},assert){
 assert.equal(after.phase,'won','Actual stable compactions must achieve both snake order and exact holes');assertPublicBoard(after.model,assert);assert.ok(after.model.movesUsed>before.model.movesUsed);assert.equal(after.model.noOpAttempts,0);assert.equal(after.model.stones.length,before.model.stones.length);assert.deepEqual(after.model.stones.map(s=>({id:s.id,value:s.value})),before.model.stones.map(s=>({id:s.id,value:s.value})));
 assert.ok(trace.some(s=>s.state.model.movesUsed>before.model.movesUsed&&!s.state.model.goalReady),'Observe ordinary unfinished compaction progress');assert.ok(trace.some(s=>s.state.model.preview.changed&&s.state.model.preview.movedCount>=2),'Observe an actual public multi-stone preview');for(const sample of trace)assertPublicBoard(sample.state.model,assert);
}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assertPublicBoard(m,assert);for(const k of ['movesUsed','historyDepth','undos','compactionAttempts','noOpAttempts'])assert.equal(m[k],0);assert.equal(m.movesRemaining,m.moveLimit);assert.equal(m.selectedId,m.actions[0].id);assert.equal(m.lastCompaction,null);assert.equal(m.lastUndo,null);assert.equal(m.transition,null);if(initial){assert.deepEqual(publicAssignments(m),publicAssignments(initial.model));assert.deepEqual(m.stones,initial.model.stones);assert.deepEqual(m.targetHoleIds,initial.model.targetHoleIds);assert.deepEqual(m.cells.map(c=>({id:c.id,kind:c.kind,targetHole:c.targetHole})),initial.model.cells.map(c=>({id:c.id,kind:c.kind,targetHole:c.targetHole})));assert.equal(m.moveLimit,initial.model.moveLimit)}}
