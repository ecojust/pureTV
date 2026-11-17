// Independent bounded planning from public islands, physical pieces and bridges.
// No production model import, authored solution, private field or snapshot writes.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{name:'N',key:'ArrowUp',dx:0,dy:-1},{name:'E',key:'ArrowRight',dx:1,dy:0},{name:'S',key:'ArrowDown',dx:0,dy:1},{name:'W',key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const publicBridge=b=>({id:b.id,pieceId:b.pieceId,sourceId:b.sourceId,targetId:b.targetId,length:b.length,targetColor:b.targetColor});
export const publicNetwork=m=>m.bridges.map(publicBridge);
function context(m){
 if(!Array.isArray(m.islands)||m.islands.length<2||m.islands.length>8||!Array.isArray(m.pieces)||m.pieces.length<1||m.pieces.length>7||!Array.isArray(m.bridges))throw Error('Public network bounds exceeded');
 if(new Set(m.islands.map(i=>i.id)).size!==m.islands.length||new Set(m.pieces.map(p=>p.id)).size!==m.pieces.length)throw Error('Physical island and piece IDs must be unique');
 for(const i of m.islands)if(!Number.isInteger(i.gx)||!Number.isInteger(i.gy)||Math.abs(i.gx)>100||Math.abs(i.gy)>100)throw Error('Expected bounded integer island geometry');
 for(const p of m.pieces)if(!Number.isInteger(p.length)||p.length<1||p.length>200)throw Error('Expected bounded positive integer bridge length');
 return{islands:m.islands,pieces:m.pieces,islandMap:new Map(m.islands.map(i=>[i.id,i])),pieceMap:new Map(m.pieces.map(p=>[p.id,p]))};
}
const orientation=(a,b,c)=>(b.gx-a.gx)*(c.gy-a.gy)-(b.gy-a.gy)*(c.gx-a.gx);
const onSegment=(a,b,p)=>orientation(a,b,p)===0&&p.gx>=Math.min(a.gx,b.gx)&&p.gx<=Math.max(a.gx,b.gx)&&p.gy>=Math.min(a.gy,b.gy)&&p.gy<=Math.max(a.gy,b.gy);
function segmentsConflict(a,b,c,d){
 const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);
 const intersects=(o1===0&&onSegment(a,b,c))||(o2===0&&onSegment(a,b,d))||(o3===0&&onSegment(c,d,a))||(o4===0&&onSegment(c,d,b))||((o1<0)!==(o2<0)&&o1!==0&&o2!==0&&(o3<0)!==(o4<0)&&o3!==0&&o4!==0);
 if(!intersects)return false;
 const shared=[a,b].filter(p=>p.id===c.id||p.id===d.id);
 if(shared.length!==1)return true;
 if(o1===0&&o2===0){const axis=a.gx!==b.gx?'gx':'gy',lo=Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),hi=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]));return hi>lo}
 return false;
}
function componentData(islands,bridges){
 const parent=new Map(islands.map(i=>[i.id,i.id]));function root(id){while(parent.get(id)!==id)id=parent.get(id);return id}
 for(const b of bridges){if(!parent.has(b.sourceId)||!parent.has(b.targetId))throw Error('Unknown bridge endpoint');const a=root(b.sourceId),z=root(b.targetId);if(a!==z)parent.set(z,a)}
 const groups=[];for(const i of islands){const r=root(i.id);let group=groups.find(g=>g.root===r);if(!group){group={root:r,ids:[]};groups.push(group)}group.ids.push(i.id)}
 return{componentCount:groups.length,connected:groups.length===1,largestComponentSize:Math.max(...groups.map(g=>g.ids.length)),groups:groups.map(g=>g.ids)};
}
export function evaluateNetwork(m,bridges=publicNetwork(m)){
 const c=context(m),used=new Set(),incident=Object.fromEntries(c.islands.map(i=>[i.id,[]])),accepted=[];
 for(const b of bridges){if(used.has(b.pieceId))throw Error('Physical bridge instance used twice');const p=c.pieceMap.get(b.pieceId);if(!p||b.id!=='bridge-'+p.id||b.length!==p.length||b.targetColor!==p.targetColor)throw Error('Bridge does not preserve its physical piece');const predicted=localPlacement(c,p,b.sourceId,b.targetId,accepted);if(!predicted.valid)throw Error('Public network contains illegal bridge: '+predicted.reason);used.add(p.id);incident[b.sourceId].push(p.id);incident[b.targetId].push(p.id);accepted.push(publicBridge(b))}
 const components=componentData(c.islands,accepted),availablePieceIds=c.pieces.filter(p=>!used.has(p.id)).map(p=>p.id);
 return{bridges:accepted,availablePieceIds,placedCount:accepted.length,remainingPieces:availablePieceIds.length,incidentPieceIds:incident,...components};
}
function localPlacement(c,p,sourceId,targetId,bridges){
 const a=c.islandMap.get(sourceId),b=c.islandMap.get(targetId);if(!a||!b)throw Error('Unknown proposed island');
 const distanceSquared=(b.gx-a.gx)**2+(b.gy-a.gy)**2,base={pieceId:p.id,sourceId,targetId,length:p.length,targetColor:p.targetColor,distanceSquared,requiredSquared:p.length**2,targetColorMatches:b.color===p.targetColor};
 const reject=(reason,extra={})=>({...base,valid:false,reason,...extra});
 if(a.id===b.id)return reject('same-island');if(distanceSquared!==p.length**2)return reject('length');if(b.color!==p.targetColor)return reject('color');
 const third=c.islands.find(i=>i.id!==a.id&&i.id!==b.id&&onSegment(a,b,i));if(third)return reject('through-island',{blockingIslandId:third.id});
 const occupied=bridges.find(e=>(e.sourceId===sourceId&&e.targetId===targetId)||(e.sourceId===targetId&&e.targetId===sourceId));if(occupied)return reject('occupied',{blockingPieceId:occupied.pieceId});
 const hit=bridges.find(e=>segmentsConflict(a,b,c.islandMap.get(e.sourceId),c.islandMap.get(e.targetId)));if(hit)return reject('intersection',{blockingPieceId:hit.pieceId});
 return{...base,valid:true,reason:null,bridge:{id:'bridge-'+p.id,pieceId:p.id,sourceId,targetId,length:p.length,targetColor:p.targetColor}};
}
export function predictPlacement(m,pieceId,sourceId,targetId){const c=context(m),p=c.pieceMap.get(pieceId);if(!p)throw Error('Unknown physical piece');const before=evaluateNetwork(m);if(!before.availablePieceIds.includes(pieceId))return{valid:false,reason:'piece-unavailable'};const result=localPlacement(c,p,sourceId,targetId,before.bridges);if(!result.valid)return result;const after=evaluateNetwork(m,[...before.bridges,result.bridge]);return{...result,after,wouldFinish:after.remainingPieces===0,wouldConnectAll:after.connected,wouldLoseDisconnected:after.remainingPieces===0&&!after.connected}}
export function planVisibleState(m,options={}){
 const c=context(m),before=evaluateNetwork(m),maxExpanded=options.maxExpanded??100000,maxMilliseconds=options.maxMilliseconds??1000,goal=options.goal??'connected';
 if(!Number.isInteger(maxExpanded)||maxExpanded<1||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0||!['connected','disconnected'].includes(goal))throw Error('Search caps and goal must be explicit bounded values');
 const started=performance.now(),deadline=started+maxMilliseconds;let expanded=0,limited=null,solution=null;
 const available=c.pieces.filter(p=>before.availablePieceIds.includes(p.id)),baseCandidates=new Map();
 for(const p of available){const pairs=[];for(const a of c.islands)for(const b of c.islands){if(performance.now()>deadline)return{found:false,reason:'time-cap',expanded};const candidate=localPlacement(c,p,a.id,b.id,before.bridges);if(candidate.valid)pairs.push(candidate.bridge)}baseCandidates.set(p.id,pairs)}
 function visit(remaining,bridges,placements){
  if(limited||solution)return;if(performance.now()>deadline){limited='time-cap';return}if(expanded>=maxExpanded){limited='node-cap';return}expanded++;
  if(!remaining.length){const connected=componentData(c.islands,bridges).connected;if((goal==='connected')===connected)solution={bridges:bridges.map(publicBridge),placements:placements.map(publicBridge)};return}
  const candidates=remaining.map(p=>({p,edges:baseCandidates.get(p.id).filter(b=>localPlacement(c,p,b.sourceId,b.targetId,bridges).valid)}));if(candidates.some(g=>!g.edges.length))return;
  if(goal==='connected'){
   const current=componentData(c.islands,bridges);if(current.componentCount-1>remaining.length)return;
   // A superset of all still-compatible edges must at least be able to connect.
   if(!componentData(c.islands,[...bridges,...candidates.flatMap(g=>g.edges)]).connected)return;
  }
  candidates.sort((a,b)=>a.edges.length-b.edges.length||c.pieces.indexOf(a.p)-c.pieces.indexOf(b.p));const chosen=candidates[0],next=remaining.filter(p=>p.id!==chosen.p.id);
  for(const edge of chosen.edges){if(performance.now()>deadline){limited='time-cap';return}visit(next,[...bridges,edge],[...placements,edge]);if(limited||solution)return}
 }
 visit(available,before.bridges,[]);if(limited)return{found:false,reason:limited,expanded};if(!solution)return{found:false,reason:'no-public-'+goal+'-network',expanded};
 return{found:true,goal,...solution,expanded,milliseconds:performance.now()-started};
}
function spatialNext(items,id,dir,positionKeys){const a=items.find(i=>i.id===id);if(!a)throw Error('Unknown current public focus');const [x,y]=positionKeys,candidates=items.map((i,index)=>({i,index,dx:i[x]-a[x],dy:i[y]-a[y]})).filter(t=>t.dx*dir.dx+t.dy*dir.dy>0);candidates.sort((a,b)=>(a.dx*a.dx+a.dy*a.dy)-(b.dx*b.dx+b.dy*b.dy)||Math.abs(dir.dx?a.dy:a.dx)-Math.abs(dir.dx?b.dy:b.dx)||a.index-b.index);return candidates[0]?.i.id??id}
function focusDomain(m){return m.stage==='bank'?{items:m.pieces.filter(p=>!p.placed),start:m.selectedPieceId,positionKeys:['x','y']}:{items:m.islands,start:m.selectedIslandId,positionKeys:['gx','gy']}}
export function predictFocus(m,direction){const dir=DIRS.find(d=>d.name===direction);if(!dir)throw Error('Unknown cardinal direction');const d=focusDomain(m);return spatialNext(d.items,d.start,dir,d.positionKeys)}
export function focusPath(m,targetId){
 const d=focusDomain(m);if(!d.items.some(i=>i.id===targetId)||!d.items.some(i=>i.id===d.start))throw Error('Requested focus outside current domain');
 const queue=[{id:d.start,path:[]}],seen=new Set([d.start]);for(let i=0;i<queue.length;i++){const n=queue[i];if(n.id===targetId)return n.path;for(const dir of DIRS){const id=spatialNext(d.items,n.id,dir,d.positionKeys);if(!seen.has(id)){seen.add(id);queue.push({id,path:[...n.path,dir.name]})}}}throw Error('Public focus graph cannot reach requested island or piece');
}
export function createPilot(){
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trialBefore=null,trialBridge=null,neutralTick=-1;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<500)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trialBefore=null;trialBridge=null;neutralTick=-1;diagnostics.length=0}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeStage:m.stage,beforeSelected:m.stage==='bank'?m.selectedPieceId:m.selectedIslandId,beforeNetwork:publicNetwork(m),beforePlacements:m.totalPlacements,beforeUndos:m.undos,beforeCancels:m.cancels,beforeAttempts:m.placementAttempts,beforeFailed:m.failedCommits,...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.totalPlacements===0?'trial':'solution';due=m.elapsed+(record?2.5:.5);note('observed-round',{elapsed:m.elapsed,stage,level:m.level})}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}if(m.tick<=neutralTick)return[];let observed=false;
   if(pending.kind==='navigate'){
    if(m.stage!==pending.beforeStage||!same(publicNetwork(m),pending.beforeNetwork))throw Error('Focus input changed actual placement stage or network');const id=m.stage==='bank'?m.selectedPieceId:m.selectedIslandId;if(id!==pending.beforeSelected){observed=true;due=m.elapsed+(record?.24:.03);note('observed-focus',{elapsed:m.elapsed,id,expected:pending.expectedId,repeated:id!==pending.expectedId})}
   }else if(pending.kind==='pick'){
    if(m.stage==='source'&&m.heldPieceId===task.pieceId){if(!same(publicNetwork(m),pending.beforeNetwork)||m.totalPlacements!==pending.beforePlacements||m.placementAttempts!==pending.beforeAttempts)throw Error('Picking reserved or committed a piece');observed=true;due=m.elapsed+(record?1.1:.15);note('observed-pickup',{elapsed:m.elapsed,pieceId:task.pieceId})}
   }else if(pending.kind==='source'){
    if(m.stage==='target'&&m.sourceId===task.sourceId){if(m.heldPieceId!==task.pieceId||!same(publicNetwork(m),pending.beforeNetwork)||m.selectedIslandId!==task.sourceId)throw Error('Source selection violated public phase transition');observed=true;due=m.elapsed+(record?.8:.1);note('observed-source',{elapsed:m.elapsed,pieceId:task.pieceId,sourceId:task.sourceId})}
   }else if(pending.kind==='place'){
    if(m.totalPlacements===pending.beforePlacements+1){if(m.stage!=='bank'||m.heldPieceId!==null||!same(publicNetwork(m),pending.predicted.after.bridges)||m.placementAttempts!==pending.beforeAttempts+1||m.failedCommits!==pending.beforeFailed||m.undos!==pending.beforeUndos)throw Error('Actual placement differs from public geometry prediction');if(!m.lastPlacement?.accepted||m.lastPlacement.pieceId!==task.pieceId||m.lastPlacement.sourceId!==task.sourceId||m.lastPlacement.targetId!==task.targetId)throw Error('Placement did not preserve selected physical instance and direction');observed=true;note('observed-placement',{elapsed:m.elapsed,...publicBridge(pending.predicted.bridge),componentCount:m.componentCount,totalPlacements:m.totalPlacements,placedCount:m.placedCount});task=null;if(stage==='trial'){stage='trial-inspect';due=m.elapsed+4.2}else{stage='solution';due=m.elapsed+(record?1.6:.15)}}
   }else if(pending.kind==='undo'){
    if(m.undos===pending.beforeUndos+1){if(!trialBefore||!same(publicNetwork(m),trialBefore.bridges)||m.stage!=='bank'||m.heldPieceId!==null||m.selectedPieceId!==trialBridge.pieceId||m.totalPlacements!==pending.beforePlacements||m.placementAttempts!==pending.beforeAttempts||m.failedCommits!==pending.beforeFailed||m.elapsed<=pending.issuedAt)throw Error('Undo did not restore exact physical network while keeping lifetime ledger and time');const restored=evaluateNetwork(m);if(!same(restored.availablePieceIds,trialBefore.availablePieceIds))throw Error('Undo restored wrong inventory instance');observed=true;stage='repair';task={...trialBridge};due=m.elapsed+4.2;note('observed-undo',{elapsed:m.elapsed,pieceId:trialBridge.pieceId,bridges:publicNetwork(m),availablePieceIds:m.availablePieceIds,undos:m.undos,totalPlacements:m.totalPlacements})}
   }else if(pending.kind==='cancel'){
    if(m.cancels===pending.beforeCancels+1){if(!same(publicNetwork(m),pending.beforeNetwork)||m.totalPlacements!==pending.beforePlacements||m.undos!==pending.beforeUndos)throw Error('Phase cancellation undid a physical bridge');observed=true;due=m.elapsed+.2;note('observed-cancel',{elapsed:m.elapsed,stage:m.stage})}
   }
   if(observed)pending=null;else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.25}else return[];
  }
  if(m.elapsed<due)return[];
  if(stage==='trial-inspect'){if(m.stage!=='bank'||!m.bridges.length)throw Error('Trial must be a real bank-stage undo');return issue(m,'undo',['b'])}
  if(!task){
   if(m.stage!=='bank')return issue(m,'cancel',['b']);
   const plan=planVisibleState(m);note('public-network-search',{elapsed:m.elapsed,found:plan.found,expanded:plan.expanded});if(!plan.found||!plan.placements.length)throw Error('No remaining public connected solution: '+plan.reason);
   task={...plan.placements[0]};
   if(stage==='trial'){
    const preferred=plan.placements.find(b=>{const a=m.islands.find(i=>i.id===b.sourceId),z=m.islands.find(i=>i.id===b.targetId);return a.gx!==z.gx&&a.gy!==z.gy});if(preferred)task={...preferred};trialBefore=evaluateNetwork(m);trialBridge={...task};note('planned-public-trial',{elapsed:m.elapsed,...task});
   }
  }
  if(m.stage==='bank'&&m.pieces.find(p=>p.id===task.pieceId)?.placed)throw Error('Planned physical instance is already placed');
  if(m.stage!=='bank'&&m.heldPieceId!==task.pieceId)return issue(m,'cancel',['b']);
  if(m.stage==='target'&&m.sourceId!==task.sourceId)return issue(m,'cancel',['b']);
  const target=m.stage==='bank'?task.pieceId:m.stage==='source'?task.sourceId:task.targetId,path=focusPath(m,target);
  if(path.length){const dir=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[dir.key],{expectedId:predictFocus(m,dir.name)})}
  if(m.stage==='bank')return issue(m,'pick',['Space']);if(m.stage==='source')return issue(m,'source',['Space']);
  const predicted=predictPlacement(m,task.pieceId,task.sourceId,task.targetId);if(!predicted.valid||predicted.wouldLoseDisconnected)throw Error('Chosen bridge no longer yields legal public completion');
  if(!pending){const preview=m.preview;if(!preview||!preview.valid||preview.pieceId!==task.pieceId||preview.sourceId!==task.sourceId||preview.targetId!==task.targetId||preview.distanceSquared!==predicted.distanceSquared)throw Error('Visible preview disagrees with public prediction')}
  // Give a real preview its own interval before the A edge; time and game continue.
  if(!task.previewObservedAt){task.previewObservedAt=m.elapsed;due=m.elapsed+(record?1.7:.15);return[]}
  if(record&&predicted.wouldFinish&&m.elapsed<30.5){due=30.5;return[]}
  return issue(m,'place',['Space'],{predicted});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options)}
export function assertPublicNetwork(m,assert){
 const e=evaluateNetwork(m);for(const k of['availablePieceIds','placedCount','remainingPieces','componentCount','connected','largestComponentSize'])assert.deepEqual(m[k],e[k]);
 for(const p of m.pieces){const b=e.bridges.find(b=>b.pieceId===p.id);assert.equal(p.placed,!!b);assert.equal(p.bridgeId,b?.id??null)}
 for(const i of m.islands){assert.deepEqual(i.incidentPieceIds,e.incidentPieceIds[i.id]);assert.equal(i.degree,e.incidentPieceIds[i.id].length)}
 for(const a of m.islands)for(const b of m.islands){const together=e.groups.some(g=>g.includes(a.id)&&g.includes(b.id));assert.equal(a.componentId===b.componentId,together)}
 assert.equal(m.totalPlacements,m.placedCount+m.undos);assert.equal(m.placementAttempts,m.totalPlacements+m.failedCommits);assert.ok(m.failedCommits>=0&&m.failedCommits<=m.maxFailedCommits);assert.equal(m.maxFailedCommits,3);
 assert.equal(m.heldPieceId,m.stage==='bank'?null:m.selectedPieceId);assert.equal(m.sourceId===null,m.stage!=='target');
 if(m.stage==='bank'){assert.equal(m.preview,null);if(m.availablePieceIds.length)assert.ok(m.availablePieceIds.includes(m.selectedPieceId));else assert.equal(m.selectedPieceId,null)}
 else assert.ok(m.availablePieceIds.includes(m.heldPieceId));
 assert.equal(m.score,m.placedCount*100+(m.islands.length-m.componentCount)*40+(m.phase==='won'?1000+Math.floor(m.remaining)*5:0));assert.ok(Math.abs(m.elapsed-m.tick/60)<1e-7);assert.ok(Math.abs(m.remaining-Math.max(0,m.timeLimit-m.elapsed))<1e-7);
 if(m.phase==='won'){assert.equal(m.remainingPieces,0);assert.equal(m.connected,true);assert.equal(m.lostReason,null)}
}
export function assertProgress({before,after,trace},assert){
 assert.equal(after.phase,'won','Actual normal inputs must place a connected full network');assertPublicNetwork(after.model,assert);assert.equal(after.model.failedCommits,0);assert.equal(after.model.placedCount,after.model.pieces.length);assert.ok(trace.some(s=>s.state.model.stage==='target'&&s.state.model.preview?.valid));assert.ok(trace.some(s=>s.state.model.bridges.length>before.model.bridges.length));
 for(const sample of trace)assertPublicNetwork(sample.state.model,assert);
}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assertPublicNetwork(m,assert);for(const k of['placedCount','totalPlacements','undos','cancels','failedCommits','placementAttempts'])assert.equal(m[k],0);assert.equal(m.bridges.length,0);assert.equal(m.componentCount,m.islands.length);assert.equal(m.stage,'bank');assert.equal(m.selectedPieceId,m.pieces[0].id);assert.equal(m.heldPieceId,null);if(initial){assert.deepEqual(m.islands.map(i=>({id:i.id,gx:i.gx,gy:i.gy,color:i.color})),initial.model.islands.map(i=>({id:i.id,gx:i.gx,gy:i.gy,color:i.color})));assert.deepEqual(m.pieces.map(p=>({id:p.id,length:p.length,targetColor:p.targetColor})),initial.model.pieces.map(p=>({id:p.id,length:p.length,targetColor:p.targetColor})))}}
