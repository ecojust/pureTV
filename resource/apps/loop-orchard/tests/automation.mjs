// Public endpoint geometry, canonical-cycle search and ordinary edge/PUMP keys.
// No production model import, hidden witness, private field or snapshot write.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{name:'N',key:'ArrowUp',dx:0,dy:-1},{name:'E',key:'ArrowRight',dx:1,dy:0},{name:'S',key:'ArrowDown',dx:0,dy:1},{name:'W',key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const publicAssignments=m=>m.edges.filter(e=>e.selected).map(e=>({edgeId:e.id,pipeId:e.pipeId}));
export const selectedEdgeIds=m=>m.edges.filter(e=>e.selected).map(e=>e.id);

function context(m){
 if(!Array.isArray(m.vertices)||m.vertices.length!==16||!Array.isArray(m.edges)||m.edges.length!==24||!Array.isArray(m.plots)||m.plots.length!==9||!Array.isArray(m.pipes)||m.pipes.length!==16)throw Error('Expected bounded 4x4 public grid, 24 edges, nine plots and 16 physical pipes');
 const vertices=m.vertices.map(v=>({id:v.id,col:v.col,row:v.row,role:v.role})),edges=m.edges.map(e=>({id:e.id,aId:e.aId,bId:e.bId,orientation:e.orientation})),plots=m.plots.map(p=>({id:p.id,col:p.col,row:p.row,clue:p.clue})),pipes=m.pipes.map(p=>({id:p.id}));
 const vi=new Map(vertices.map((v,i)=>[v.id,i])),ei=new Map(edges.map((e,i)=>[e.id,i]));
 if(vi.size!==16||ei.size!==24||new Set(plots.map(p=>p.id)).size!==9||new Set(pipes.map(p=>p.id)).size!==16)throw Error('Public vertex, edge, plot and pipe IDs must be unique');
 const coordinates=new Map();for(const v of vertices){if(!Number.isInteger(v.col)||!Number.isInteger(v.row)||v.col<0||v.col>3||v.row<0||v.row>3||!['junction','tree','flower'].includes(v.role))throw Error('Invalid public vertex geometry or role');coordinates.set(v.col+','+v.row,v.id)}if(coordinates.size!==16)throw Error('Every grid vertex must have a distinct coordinate');
 const pairIndex=new Map(),adjacent=vertices.map(()=>[]),endpoints=[];
 for(let i=0;i<edges.length;i++){const e=edges[i],a=vi.get(e.aId),b=vi.get(e.bId);if(a===undefined||b===undefined)throw Error('Unknown public endpoint');const av=vertices[a],bv=vertices[b];if(Math.abs(av.col-bv.col)+Math.abs(av.row-bv.row)!==1)throw Error('Only adjacent unit grid edges are valid');if(e.orientation!==(av.row===bv.row?'horizontal':'vertical'))throw Error('Incorrect public unit-edge orientation');const pair=[a,b].sort((x,y)=>x-y).join(',');if(pairIndex.has(pair))throw Error('Duplicate physical edge');pairIndex.set(pair,i);endpoints.push([a,b]);adjacent[a].push({vertex:b,edge:i});adjacent[b].push({vertex:a,edge:i})}
 for(const list of adjacent)list.sort((a,b)=>a.vertex-b.vertex||a.edge-b.edge);
 const plotCoordinates=new Set(),boundaries=plots.map(p=>{
  if(!Number.isInteger(p.col)||!Number.isInteger(p.row)||p.col<0||p.col>2||p.row<0||p.row>2||(p.clue!==null&&(!Number.isInteger(p.clue)||p.clue<0||p.clue>4)))throw Error('Numeric plot clues must be 0..4; null means unhinted');plotCoordinates.add(p.col+','+p.row);
  const ids=[[p.col,p.row],[p.col+1,p.row],[p.col+1,p.row+1],[p.col,p.row+1]].map(([x,y])=>vi.get(coordinates.get(x+','+y)));
  return ids.map((id,i)=>{const edge=pairIndex.get([id,ids[(i+1)%4]].sort((a,b)=>a-b).join(','));if(edge===undefined)throw Error('Missing public plot boundary');return edge});
 });if(plotCoordinates.size!==9)throw Error('Every unit plot must occur once');
 return{vertices,edges,plots,pipes,vi,ei,adjacent,endpoints,boundaries};
}

function graph(c,ids){
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!c.ei.has(id)))throw Error('Selected public edges must be unique and known');
 const selected=new Set(ids),incident=c.vertices.map(()=>[]),neighbors=c.vertices.map(()=>[]);
 for(let i=0;i<c.edges.length;i++)if(selected.has(c.edges[i].id)){const[a,b]=c.endpoints[i];incident[a].push(c.edges[i].id);incident[b].push(c.edges[i].id);neighbors[a].push(b);neighbors[b].push(a)}
 const degrees=incident.map(x=>x.length),seen=new Set(),components=[];
 for(let i=0;i<16;i++)if(degrees[i]>0&&!seen.has(i)){const reached=new Set(),queue=[i];while(queue.length){const n=queue.pop();if(reached.has(n))continue;reached.add(n);seen.add(n);queue.push(...neighbors[n].filter(k=>!reached.has(k)))}const vertexIds=c.vertices.filter((v,n)=>reached.has(n)).map(v=>v.id),edgeIds=c.edges.filter((e,n)=>selected.has(e.id)&&reached.has(c.endpoints[n][0])).map(e=>e.id);components.push({id:c.vertices[i].id,vertexIds,edgeIds})}
 const activeVertexCount=degrees.filter(x=>x>0).length,degreeTwo=activeVertexCount>0&&degrees.every(d=>d===0||d===2),singleLoop=degreeTwo&&components.length===1;
 const requiredTreeIds=c.vertices.filter(v=>v.role==='tree').map(v=>v.id),forbiddenFlowerIds=c.vertices.filter(v=>v.role==='flower').map(v=>v.id),treesCovered=requiredTreeIds.filter(id=>degrees[c.vi.get(id)]>0).length,flowerTouchedIds=forbiddenFlowerIds.filter(id=>degrees[c.vi.get(id)]>0);
 const plots=c.plots.map((p,i)=>{const selectedCount=c.boundaries[i].filter(e=>selected.has(c.edges[e].id)).length;return{id:p.id,boundaryEdgeIds:c.boundaries[i].map(e=>c.edges[e].id),clue:p.clue,selectedCount,matched:p.clue===null?null:selectedCount===p.clue}});
 const clueCount=plots.filter(p=>p.clue!==null).length,matchedClueCount=plots.filter(p=>p.matched===true).length,allCluesMet=clueCount===matchedClueCount,allTreesCovered=treesCovered===requiredTreeIds.length,flowersAvoided=flowerTouchedIds.length===0;
 const checks={hasPipes:ids.length>0,degreeTwo,singleLoop,trees:allTreesCovered,flowers:flowersAvoided,clues:allCluesMet};
 const leakIds=c.vertices.filter((v,i)=>degrees[i]===1).map(v=>v.id),branchIds=c.vertices.filter((v,i)=>degrees[i]>=3).map(v=>v.id);
 const reason=!checks.hasPipes?'empty':branchIds.length?'branch':leakIds.length?'leak':components.length>1?'multiple-loops':!allTreesCovered?'trees':!flowersAvoided?'flower':!allCluesMet?'clues':'accepted';
 return{selectedEdgeIds:c.edges.filter(e=>selected.has(e.id)).map(e=>e.id),pipeCount:ids.length,vertices:c.vertices.map((v,i)=>({id:v.id,degree:degrees[i],incidentEdgeIds:incident[i],componentId:components.find(g=>g.vertexIds.includes(v.id))?.id??null,onPipe:degrees[i]>0})),plots,components,activeVertexCount,componentCount:components.length,leakIds,branchIds,degreeTwo,singleLoop,requiredTreeIds,forbiddenFlowerIds,treesCovered,allTreesCovered,flowerTouchedIds,flowersAvoided,clueCount,matchedClueCount,allCluesMet,goalReady:singleLoop&&allTreesCovered&&flowersAvoided&&allCluesMet,checks,reason};
}
export function evaluateNetwork(m,ids=selectedEdgeIds(m)){return graph(context(m),ids)}
export function evaluateInventory(m,assignments=publicAssignments(m)){
 const c=context(m),pipeIds=new Set(c.pipes.map(p=>p.id)),used=new Set(),edges=new Set();
 for(const a of assignments){if(!c.ei.has(a.edgeId)||!pipeIds.has(a.pipeId)||used.has(a.pipeId)||edges.has(a.edgeId))throw Error('Pipe assignment duplicates or loses a physical instance');used.add(a.pipeId);edges.add(a.edgeId)}
 const physicalAssignments=c.edges.filter(e=>edges.has(e.id)).map(e=>({edgeId:e.id,pipeId:assignments.find(a=>a.edgeId===e.id).pipeId}));
 return{...graph(c,[...edges]),physicalAssignments,availablePipeIds:c.pipes.filter(p=>!used.has(p.id)).map(p=>p.id),pipesRemaining:16-used.size,pipeStock:16};
}
export function predictEdit(m,edgeId){
 const c=context(m);if(!c.ei.has(edgeId))throw Error('Unknown public edge');const before=evaluateInventory(m),existing=before.physicalAssignments.find(a=>a.edgeId===edgeId);
 if(!existing&&!before.availablePipeIds.length)return{accepted:false,reason:'stock',edgeId,before};
 const pipeId=existing?.pipeId??before.availablePipeIds[0],kind=existing?'remove':'place',assignments=existing?before.physicalAssignments.filter(a=>a.edgeId!==edgeId):[...before.physicalAssignments,{edgeId,pipeId}];
 return{accepted:true,edgeId,kind,beforePipeId:existing?pipeId:null,afterPipeId:existing?null:pipeId,before,after:evaluateInventory(m,assignments)};
}

export function planVisibleState(m,options={}){
 const c=context(m),maxExpanded=options.maxExpanded??100000,maxMilliseconds=options.maxMilliseconds??1000,goal=options.goal??'single-loop';
 if(!Number.isInteger(maxExpanded)||maxExpanded<1||maxExpanded>1000000||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0||!['single-loop','multiple-loops'].includes(goal))throw Error('Explicit public search goal/caps are invalid');
 const started=performance.now(),deadline=started+maxMilliseconds;let expanded=0,limited=null,best=null;const cycles=[],forbidden=new Set(c.vertices.flatMap((v,i)=>v.role==='flower'?[i]:[]));
 function enter(){if(limited)return false;if(performance.now()>deadline){limited='time-cap';return false}if(expanded>=maxExpanded){limited='node-cap';return false}expanded++;return true}
 function numericUpper(mask){return c.plots.every((p,i)=>p.clue===null||c.boundaries[i].filter(e=>mask&(1<<e)).length<=p.clue)}
 for(let start=0;start<16&&!limited;start++){
  if(forbidden.has(start))continue;
  function extend(path,vertexMask,edgeMask){
   if(!enter())return;const last=path[path.length-1];
   for(const next of c.adjacent[last]){
    if(performance.now()>deadline){limited='time-cap';return}
    if(next.vertex===start){if(path.length>=4&&path[1]<last){const mask=edgeMask|(1<<next.edge);if(numericUpper(mask))cycles.push({mask,vertexMask,length:path.length})}continue}
    if(next.vertex<start||forbidden.has(next.vertex)||(vertexMask&(1<<next.vertex))||path.length>=16)continue;
    const mask=edgeMask|(1<<next.edge);if(!numericUpper(mask))continue;
    extend([...path,next.vertex],vertexMask|(1<<next.vertex),mask);if(limited)return;
   }
  }
  extend([start],1<<start,0);
 }
 const actual=new Set(selectedEdgeIds(m));
 function consider(mask){
  if(!enter())return;const ids=c.edges.filter((e,i)=>mask&(1<<i)).map(e=>e.id);if(ids.length>m.pipeStock)return;const evaluated=graph(c,ids);
  if(!evaluated.allCluesMet||!evaluated.allTreesCovered||!evaluated.flowersAvoided||!evaluated.degreeTwo||(goal==='single-loop'?evaluated.componentCount!==1:evaluated.componentCount<2))return;
  const target=new Set(ids),edits=[...c.edges.filter(e=>actual.has(e.id)&&!target.has(e.id)).map(e=>({edgeId:e.id,kind:'remove'})),...c.edges.filter(e=>!actual.has(e.id)&&target.has(e.id)).map(e=>({edgeId:e.id,kind:'place'}))];
  if(!best||edits.length<best.edits.length||(edits.length===best.edits.length&&ids.length<best.targetEdgeIds.length))best={targetEdgeIds:ids,edits,evaluation:evaluated};
 }
 if(!limited&&goal==='single-loop'){for(const cycle of cycles){consider(cycle.mask);if(limited)break}}
 if(!limited&&goal==='multiple-loops'){
  function combine(index,mask,vertices,length,count){if(!enter())return;if(count>=2)consider(mask);for(let i=index;i<cycles.length&&!limited;i++){const cycle=cycles[i];if((vertices&cycle.vertexMask)||length+cycle.length>m.pipeStock)continue;const next=mask|cycle.mask;if(!numericUpper(next))continue;combine(i+1,next,vertices|cycle.vertexMask,length+cycle.length,count+1)}}
  combine(0,0,0,0,0);
 }
 if(limited)return{found:false,reason:limited,expanded,canonicalCycles:cycles.length};
 if(!best)return{found:false,reason:'no-public-'+goal,expanded,canonicalCycles:cycles.length};
 return{found:true,goal,...best,expanded,canonicalCycles:cycles.length,milliseconds:performance.now()-started};
}

function nextFocus(items,id,dir){const origin=items.find(i=>i.id===id);if(!origin)throw Error('Unknown public focus');const candidates=items.map((i,index)=>({i,index,dx:i.x-origin.x,dy:i.y-origin.y})).filter(p=>p.dx*dir.dx+p.dy*dir.dy>0),distance=p=>p.dx*p.dx+p.dy*p.dy,perp=p=>Math.abs(dir.dx?p.dy:p.dx);candidates.sort((a,b)=>(distance(a)+2*perp(a)**2)-(distance(b)+2*perp(b)**2)||distance(a)-distance(b)||perp(a)-perp(b)||a.index-b.index);return candidates[0]?.i.id??id}
function focusItems(m){const items=m.focusItems.map(i=>({id:i.id,kind:i.kind,x:i.x,y:i.y}));if(items.length!==25||new Set(items.map(i=>i.id)).size!==25||items.some(i=>!Number.isFinite(i.x)||!Number.isFinite(i.y)))throw Error('Invalid finite edge/PUMP focus graph');return items}
export function predictFocus(m,direction){const d=DIRS.find(d=>d.name===direction);if(!d)throw Error('Unknown cardinal direction');return nextFocus(focusItems(m),m.selectedId,d)}
export function focusPath(m,targetId){const items=focusItems(m);if(!items.some(i=>i.id===targetId))throw Error('Target is outside public focus graph');const queue=[{id:m.selectedId,path:[]}],seen=new Set([m.selectedId]);for(let i=0;i<queue.length;i++){const n=queue[i];if(n.id===targetId)return n.path;for(const d of DIRS){const id=nextFocus(items,n.id,d);if(!seen.has(id)){seen.add(id);queue.push({id,path:[...n.path,d.name]})}}}throw Error('Public edge/PUMP focus graph is not reachable')}

const LEDGER=['historyDepth','totalEdits','placements','removals','undos','editAttempts','blockedPlacements','submissions','mistakes'];
export function createPilot(){
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trial=null,neutralTick=-1;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<700)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trial=null;neutralTick=-1;diagnostics.length=0}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeSelected:m.selectedId,beforeAssignments:publicAssignments(m),beforeLedger:Object.fromEntries(LEDGER.map(k=>[k,m[k]])),...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.totalEdits===0?'trial-place':'solution';due=m.elapsed+(record?2.5:.35);note('observed-round',{elapsed:m.elapsed,level:m.level,stage})}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}if(m.tick<=neutralTick)return[];let observed=false;
   if(pending.kind==='navigate'){
    if(!same(publicAssignments(m),pending.beforeAssignments)||LEDGER.some(k=>m[k]!==pending.beforeLedger[k]))throw Error('Navigation changed actual pipe inventory or edit ledger');
    if(m.selectedId!==pending.beforeSelected){observed=true;due=m.elapsed+(record?.2:.02);note('observed-focus',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId,repeated:m.selectedId!==pending.expectedId})}
   }else if(pending.kind==='edit'){
    if(m.totalEdits===pending.beforeLedger.totalEdits+1){const p=pending.predicted;
     if(!same(publicAssignments(m),p.after.physicalAssignments)||m.selectedId!==p.edgeId||m.historyDepth!==pending.beforeLedger.historyDepth+1||m.editAttempts!==pending.beforeLedger.editAttempts+1||m.placements!==pending.beforeLedger.placements+(p.kind==='place'?1:0)||m.removals!==pending.beforeLedger.removals+(p.kind==='remove'?1:0)||['undos','blockedPlacements','submissions','mistakes'].some(k=>m[k]!==pending.beforeLedger[k]))throw Error('Actual edit did not preserve exact pipe ID, inventory or counters');
     for(const key of ['kind','edgeId','beforePipeId','afterPipeId'])if(m.lastEdit?.[key]!==p[key])throw Error('Edit receipt differs from observed action');if(!same(m.history.at(-1),m.lastEdit))throw Error('History differs from actual last edit');
     const e=evaluateInventory(m);if(!same(e.components,m.components)||!same(e.availablePipeIds,m.availablePipeIds)||e.matchedClueCount!==m.matchedClueCount)throw Error('Edit did not refresh actual graph, stock and clues');
     observed=true;note('observed-edit',{elapsed:m.elapsed,kind:p.kind,edgeId:p.edgeId,beforePipeId:p.beforePipeId,afterPipeId:p.afterPipeId,pipeCount:m.pipeCount,pipesRemaining:m.pipesRemaining,totalEdits:m.totalEdits,matchedClueCount:m.matchedClueCount,componentCount:m.componentCount});task=null;
     if(stage==='trial-place'){trial={edgeId:p.edgeId,pipeId:p.afterPipeId,placedAssignments:publicAssignments(m),placeReceipt:{...m.lastEdit}};stage='trial-place-inspect';due=m.elapsed+4.2}
     else if(stage==='trial-remove'){if(p.beforePipeId!==trial.pipeId||m.pipeCount!==0)throw Error('Trial removal did not return the exact original pipe');trial.removeReceipt={...m.lastEdit};stage='trial-remove-inspect';due=m.elapsed+4.2}
     else{stage='solution';due=m.elapsed+(record?.65:.05)}
    }
   }else if(pending.kind==='undo'){
    if(m.undos===pending.beforeLedger.undos+1){
     if(!trial||!same(publicAssignments(m),trial.placedAssignments)||m.selectedId!==trial.edgeId||m.historyDepth!==pending.beforeLedger.historyDepth-1||['totalEdits','placements','removals','editAttempts','blockedPlacements','submissions','mistakes'].some(k=>m[k]!==pending.beforeLedger[k])||m.elapsed<=pending.issuedAt||!same(m.lastUndo?.edit,trial.removeReceipt))throw Error('Undo must restore the removed physical pipe without refunding time or lifetime counters');
     observed=true;stage='solution';due=m.elapsed+3.2;note('observed-undo-removal',{elapsed:m.elapsed,edgeId:trial.edgeId,pipeId:trial.pipeId,assignments:publicAssignments(m),availablePipeIds:m.availablePipeIds,totalEdits:m.totalEdits,undos:m.undos});
    }
   }else if(pending.kind==='submit'&&m.submissions!==pending.beforeLedger.submissions)throw Error('Public valid loop did not win on explicit PUMP input');
   if(observed)pending=null;else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.2}else return[];
  }
  if(m.elapsed<due)return[];
  if(stage==='trial-place-inspect'){stage='trial-remove';task={edgeId:trial.edgeId,kind:'remove'}}
  if(stage==='trial-remove-inspect'){if(m.historyDepth!==2||m.pipeCount!==0)throw Error('Trial undo requires the actual removal history');return issue(m,'undo',['b'])}
  if(!task){
   const plan=planVisibleState(m);note('public-loop-search',{elapsed:m.elapsed,found:plan.found,expanded:plan.expanded,canonicalCycles:plan.canonicalCycles});if(!plan.found)throw Error('No public single-loop solution: '+plan.reason);
   if(!plan.edits.length){
    if(!evaluateNetwork(m).goalReady||!m.goalReady)throw Error('Ready loop must pass topology, roles and numeric clues');const path=focusPath(m,'pump');if(path.length){const d=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[d.key],{expectedId:predictFocus(m,d.name)})}
    if(stage!=='ready-inspect'){stage='ready-inspect';due=m.elapsed+(record?3.2:.2);note('observed-ready-before-PUMP',{elapsed:m.elapsed,submissions:m.submissions,pipesRemaining:m.pipesRemaining});return[]}
    return issue(m,'submit',['Space']);
   }
   task={...plan.edits[0]};
   if(stage==='trial-place'){const preferred=plan.targetEdgeIds.find(id=>m.edges.find(e=>e.id===id).plotIds.length===2)??plan.targetEdgeIds[0];task={edgeId:preferred,kind:'place'};note('planned-public-trial',{elapsed:m.elapsed,edgeId:preferred})}
  }
  const path=focusPath(m,task.edgeId);if(path.length){const d=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[d.key],{expectedId:predictFocus(m,d.name)})}
  const predicted=predictEdit(m,task.edgeId);if(!predicted.accepted||predicted.kind!==task.kind)throw Error('Observed edge state or stock no longer permits the planned edit');
  if(task.previewObservedAt===undefined){task.previewObservedAt=m.elapsed;due=m.elapsed+(record?.85:.06);return[]}
  return issue(m,'edit',['Space'],{predicted});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options)}

export function assertPublicNetwork(m,assert){
 const e=evaluateInventory(m),c=context(m);for(const k of ['availablePipeIds','pipeCount','pipeStock','pipesRemaining','components','activeVertexCount','componentCount','leakIds','branchIds','degreeTwo','singleLoop','requiredTreeIds','forbiddenFlowerIds','treesCovered','allTreesCovered','flowerTouchedIds','flowersAvoided','clueCount','matchedClueCount','allCluesMet','goalReady','checks'])assert.deepEqual(m[k],e[k]);
 for(const v of e.vertices){const actual=m.vertices.find(x=>x.id===v.id);for(const k of ['degree','incidentEdgeIds','componentId','onPipe'])assert.deepEqual(actual[k],v[k])}
 for(const p of e.plots){const actual=m.plots.find(x=>x.id===p.id);for(const k of ['boundaryEdgeIds','selectedCount','matched'])assert.deepEqual(actual[k],p[k]);if(p.clue===null)assert.equal(actual.matched,null)}
 for(let i=0;i<m.edges.length;i++){const edge=m.edges[i],physical=e.physicalAssignments.find(a=>a.edgeId===edge.id);assert.equal(edge.selected,!!physical);assert.equal(edge.pipeId,physical?.pipeId??null);assert.deepEqual(edge.plotIds,c.plots.filter((p,n)=>c.boundaries[n].includes(i)).map(p=>p.id))}
 for(const p of m.pipes)assert.equal(p.edgeId,e.physicalAssignments.find(a=>a.pipeId===p.id)?.edgeId??null);
 assert.equal(m.historyDepth,m.history.length);assert.equal(m.totalEdits,m.placements+m.removals);assert.equal(m.totalEdits,m.historyDepth+m.undos);assert.equal(m.editAttempts,m.totalEdits+m.blockedPlacements);assert.equal(m.maxMistakes,3);assert.ok(m.mistakes>=0&&m.mistakes<=3&&m.submissions>=m.mistakes);
 for(const h of m.history){assert.ok(c.ei.has(h.edgeId));assert.ok(['place','remove'].includes(h.kind));assert.equal(h.beforePipeId===null,h.kind==='place');assert.equal(h.afterPipeId===null,h.kind==='remove');assert.ok(m.pipes.some(p=>p.id===(h.beforePipeId??h.afterPipeId)))}
 assert.deepEqual(m.cursor,m.focusItems.find(i=>i.id===m.selectedId));assert.equal(m.score,m.pipeCount*10+m.matchedClueCount*25+m.treesCovered*20+(m.phase==='won'?1000+Math.floor(m.remaining)*5:0));assert.ok(Math.abs(m.elapsed-m.tick/60)<1e-7);assert.ok(Math.abs(m.remaining-Math.max(0,m.timeLimit-m.elapsed))<1e-7);
 if(m.lastSubmission){assert.equal(m.lastSubmission.id,m.submissions);assert.ok(Number.isInteger(m.lastSubmission.id)&&m.lastSubmission.id>0)}
 if(m.phase==='won'){assert.equal(m.goalReady,true);assert.equal(m.lastSubmission.accepted,true);assert.equal(m.lastSubmission.reason,'accepted');assert.equal(m.lostReason,null);assert.deepEqual(m.lastSubmission.selectedEdgeIds,e.selectedEdgeIds);assert.deepEqual(m.lastSubmission.pipeAssignments,e.physicalAssignments);assert.deepEqual(m.lastSubmission.checks,e.checks)}
}
export function assertProgress({before,after,trace},assert){
 assert.equal(after.phase,'won','Normal edge editing must explicitly submit one connected valid cycle');assertPublicNetwork(after.model,assert);assert.equal(after.model.submissions,1);assert.equal(after.model.mistakes,0);assert.ok(after.model.totalEdits>before.model.totalEdits);assert.ok(after.model.pipesRemaining>0,'Authored winning route legitimately leaves unused stock');
 assert.ok(trace.some(s=>s.state.model.pipeCount>0&&!s.state.model.singleLoop),'Observe a real unfinished pipe drawing');assert.ok(trace.some(s=>s.state.phase==='playing'&&s.state.model.goalReady&&s.state.model.submissions===0),'Goal readiness alone must not win');for(const sample of trace)assertPublicNetwork(sample.state.model,assert);
}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assertPublicNetwork(m,assert);for(const k of ['pipeCount','historyDepth','totalEdits','placements','removals','undos','editAttempts','blockedPlacements','submissions','mistakes'])assert.equal(m[k],0);assert.equal(m.pipesRemaining,16);assert.equal(m.selectedId,m.edges[0].id);assert.equal(m.lastEdit,null);assert.equal(m.lastUndo,null);assert.equal(m.lastSubmission,null);if(initial){assert.deepEqual(m.vertices.map(v=>({id:v.id,col:v.col,row:v.row,role:v.role})),initial.model.vertices.map(v=>({id:v.id,col:v.col,row:v.row,role:v.role})));assert.deepEqual(m.plots.map(p=>({id:p.id,clue:p.clue})),initial.model.plots.map(p=>({id:p.id,clue:p.clue})));assert.deepEqual(m.pipes.map(p=>p.id),initial.model.pipes.map(p=>p.id));assert.deepEqual(publicAssignments(m),publicAssignments(initial.model));}}
