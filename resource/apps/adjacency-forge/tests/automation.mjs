// Independent public hex/material planning and ordinary input replay.
// No production model import, private fields, authored answer or snapshot writes.
export const budgets = { maxWebGLDrawCalls: 3 };
const HEX = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const DIRS = [
 { name:'N', key:'ArrowUp', dx:0, dy:-1 }, { name:'E', key:'ArrowRight', dx:1, dy:0 },
 { name:'S', key:'ArrowDown', dx:0, dy:1 }, { name:'W', key:'ArrowLeft', dx:-1, dy:0 }
];
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export const publicAssignment = m => m.cells.map(cell => cell.tileId);

function context(m) {
 if (!Array.isArray(m.cells) || m.cells.length !== 7 || !Array.isArray(m.tiles) || m.tiles.length !== 7 || !Array.isArray(m.materials) || m.materials.length !== 3) throw Error('Expected seven public hex cells, seven physical tiles and three materials');
 const cells=m.cells.map(c=>({id:c.id,q:c.q,r:c.r,role:c.role}));
 const tiles=m.tiles.map(t=>({id:t.id,material:t.material}));
 const materials=m.materials.map(t=>({id:t.id,neighborMaterial:t.neighborMaterial,requiredCount:t.requiredCount,heatTarget:t.heatTarget}));
 if (new Set(cells.map(c=>c.id)).size!==7 || new Set(tiles.map(t=>t.id)).size!==7 || new Set(materials.map(t=>t.id)).size!==3) throw Error('Public cell, tile and material IDs must be unique');
 for (const c of cells) if (!Number.isInteger(c.q)||!Number.isInteger(c.r)||Math.abs(c.q)>100||Math.abs(c.r)>100) throw Error('Hex geometry must use bounded integer axial coordinates');
 const coordinateIndex=new Map(cells.map((c,i)=>[c.q+','+c.r,i]));
 if (coordinateIndex.size!==7) throw Error('Two physical cells cannot occupy the same hex');
 const materialIndex=new Map(materials.map((t,i)=>[t.id,i])), tileIndex=new Map(tiles.map((t,i)=>[t.id,i]));
 for (const mat of materials) if (!materialIndex.has(mat.neighborMaterial)||!materialIndex.has(mat.heatTarget)||!Number.isInteger(mat.requiredCount)||mat.requiredCount<0||mat.requiredCount>6) throw Error('Invalid public material recipe or heat target');
 for (const tile of tiles) if (!materialIndex.has(tile.material)) throw Error('Tile has an unknown material');
 if (!Array.isArray(m.directions)||m.directions.length!==6||m.directions.some((d,i)=>d.index!==i||d.dq!==HEX[i][0]||d.dr!==HEX[i][1])) throw Error('Public world heat priority does not match the hex contract');
 const source=cells.findIndex(c=>c.id===m.sourceCellId), mold=cells.findIndex(c=>c.id===m.moldCellId);
 if (source<0||mold<0||source===mold||cells[source].role!=='source'||cells[mold].role!=='mold'||cells.filter(c=>c.role==='source').length!==1||cells.filter(c=>c.role==='mold').length!==1) throw Error('Expected distinct, unique furnace and mold cells');
 const neighbors=cells.map(c=>HEX.map(([dq,dr])=>coordinateIndex.get((c.q+dq)+','+(c.r+dr))??-1));
 const counts=materials.map(mat=>tiles.filter(t=>t.material===mat.id).length);
 return {cells,tiles,materials,tileIndex,materialIndex,neighbors,counts,source,mold};
}

function checkedAssignment(c,assignment) {
 if (!Array.isArray(assignment)||assignment.length!==7||new Set(assignment).size!==7||assignment.some(id=>!c.tileIndex.has(id))) throw Error('Assignment must preserve every exact physical tile ID once');
 return assignment.map(id=>c.materialIndex.get(c.tiles[c.tileIndex.get(id)].material));
}

function evaluateMaterials(c,placement) {
 const cells=c.cells.map((cell,i)=>{
  const material=c.materials[placement[i]], neighborCounts=Object.fromEntries(c.materials.map(mat=>[mat.id,0]));
  for (const n of c.neighbors[i]) if (n>=0) neighborCounts[c.materials[placement[n]].id]++;
  const actualCount=neighborCounts[material.neighborMaterial];
  const outletDirection=i===c.mold?-1:c.neighbors[i].findIndex(n=>n>=0&&c.materials[placement[n]].id===material.heatTarget);
  return {id:cell.id,material:material.id,neighborIds:c.neighbors[i].filter(n=>n>=0).map(n=>c.cells[n].id),neighborByDirection:c.neighbors[i].map(n=>n<0?null:c.cells[n].id),neighborCounts,requiredCount:material.requiredCount,actualCount,recipeMet:actualCount===material.requiredCount,outletCellId:outletDirection<0?null:c.cells[c.neighbors[i][outletDirection]].id,outletDirection:outletDirection<0?null:outletDirection};
 });
 const visited=new Set(),pathCellIds=[],edges=[];let current=c.source,status,stopCellId;
 while (true) {
  if (visited.has(current)) {status='loop';stopCellId=c.cells[current].id;break}
  visited.add(current);pathCellIds.push(c.cells[current].id);
  if (current===c.mold) {status='delivered';stopCellId=c.cells[current].id;break}
  const dir=cells[current].outletDirection;
  if (dir===null) {status='blocked';stopCellId=c.cells[current].id;break}
  const next=c.neighbors[current][dir];edges.push({fromId:c.cells[current].id,toId:c.cells[next].id,direction:dir});current=next;
 }
 const heat={status,delivered:status==='delivered',pathCellIds,edges,stopCellId,hops:edges.length};
 const matchedCells=cells.filter(cell=>cell.recipeMet).length,allRecipesMet=matchedCells===7;
 return {cells,heat,matchedCells,allRecipesMet,goalReady:allRecipesMet&&heat.delivered};
}

export function evaluateBoard(m,assignment=publicAssignment(m)) {
 const c=context(m),placement=checkedAssignment(c,assignment),result=evaluateMaterials(c,placement);
 return {...result,assignment:[...assignment],materialCounts:Object.fromEntries(c.materials.map((mat,i)=>[mat.id,c.counts[i]])),cells:result.cells.map((cell,i)=>({...cell,tileId:assignment[i]}))};
}

export function predictSwap(m,aCellId,bCellId) {
 const c=context(m),before=publicAssignment(m);checkedAssignment(c,before);
 const a=c.cells.findIndex(cell=>cell.id===aCellId),b=c.cells.findIndex(cell=>cell.id===bCellId);
 if (a<0||b<0||a===b) throw Error('A real swap requires two different public cells');
 const after=[...before];[after[a],after[b]]=[after[b],after[a]];
 return {aCellId,bCellId,aTileId:before[a],bTileId:before[b],beforeTileIds:before,afterTileIds:after,after:evaluateBoard(m,after)};
}

function swapsTo(c,before,target) {
 const current=[...before],swaps=[];
 for (let i=0;i<7;i++) if (current[i]!==target[i]) {
  const j=current.indexOf(target[i]);if(j<0) throw Error('Target lost a physical tile');
  swaps.push({aCellId:c.cells[i].id,bCellId:c.cells[j].id,aTileId:current[i],bTileId:current[j]});
  [current[i],current[j]]=[current[j],current[i]];
 }
 if(!same(current,target)) throw Error('Public swap sequence did not reach its assignment');
 return swaps;
}

export function planVisibleState(m,options={}) {
 const c=context(m),before=publicAssignment(m),initial=checkedAssignment(c,before),goal=options.goal??'goal';
 const maxExpanded=options.maxExpanded??100000,maxMilliseconds=options.maxMilliseconds??1000;
 if (!Number.isInteger(maxExpanded)||maxExpanded<1||maxExpanded>1000000||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0||!['goal','recipes-without-heat'].includes(goal)) throw Error('Invalid explicit public search goal or cap');
 const started=performance.now(),deadline=started+maxMilliseconds;let expanded=0,limited=null,best=null,materialSolutions=0;
 const placement=Array(7).fill(-1),remaining=[...c.counts];
 function enter() {
  if(limited)return false;
  if(performance.now()>deadline){limited='time-cap';return false}
  if(expanded>=maxExpanded){limited='node-cap';return false}
  expanded++;return true;
 }
 // Exact-count lower/upper bounds use only already assigned neighboring materials
 // and the multiplicities of public materials still available for unknown cells.
 function possible() {
  for(let i=0;i<7;i++) if(placement[i]>=0) {
   const mat=c.materials[placement[i]],target=c.materialIndex.get(mat.neighborMaterial);
   let matched=0,unknown=0;
   for(const n of c.neighbors[i]) if(n>=0){if(placement[n]<0)unknown++;else if(placement[n]===target)matched++}
   if(matched>mat.requiredCount||matched+Math.min(unknown,remaining[target])<mat.requiredCount)return false;
  }
  return true;
 }
 function physicalAssignments(targetMaterials,result) {
  const target=Array(7).fill(null),used=new Set();
  // An already correctly material-placed tile can remain fixed in an optimal
  // swap assignment. Remaining interchangeable IDs are still enumerated exactly.
  for(let i=0;i<7;i++)if(initial[i]===targetMaterials[i]){target[i]=before[i];used.add(before[i])}
  function assign() {
   if(!enter())return;
   const index=target.findIndex(id=>id===null);
   if(index<0){const swaps=swapsTo(c,before,target);if(!best||swaps.length<best.swaps.length)best={assignment:[...target],swaps,evaluation:result};return}
   for(const tile of c.tiles)if(!used.has(tile.id)&&c.materialIndex.get(tile.material)===targetMaterials[index]){
    if(performance.now()>deadline){limited='time-cap';return}
    target[index]=tile.id;used.add(tile.id);assign();used.delete(tile.id);target[index]=null;if(limited)return;
   }
  }
  assign();
 }
 function search() {
  if(!enter())return;
  const unset=[];for(let i=0;i<7;i++)if(placement[i]<0)unset.push(i);
  if(!unset.length){const result=evaluateMaterials(c,placement);if(result.allRecipesMet&&(goal==='goal'?result.heat.delivered:!result.heat.delivered)){materialSolutions++;physicalAssignments([...placement],result)}return}
  // Deterministic MRV includes all already constrained neighbor counts.
  let chosen=null;
  for(const index of unset){const values=[];for(let material=0;material<3;material++)if(remaining[material]>0){placement[index]=material;remaining[material]--;if(possible())values.push(material);remaining[material]++;placement[index]=-1}
   if(!values.length)return;
   if(!chosen||values.length<chosen.values.length||(values.length===chosen.values.length&&c.neighbors[index].filter(n=>n>=0).length>c.neighbors[chosen.index].filter(n=>n>=0).length))chosen={index,values};
  }
  chosen.values.sort((a,b)=>(a===initial[chosen.index]?-1:0)-(b===initial[chosen.index]?-1:0)||a-b);
  for(const material of chosen.values){if(performance.now()>deadline){limited='time-cap';return}placement[chosen.index]=material;remaining[material]--;search();remaining[material]++;placement[chosen.index]=-1;if(limited)return}
 }
 search();
 if(limited)return{found:false,reason:limited,expanded,materialSolutions};
 if(!best)return{found:false,reason:'no-public-'+goal+'-assignment',expanded,materialSolutions};
 const verified=evaluateBoard(m,best.assignment);if(!verified.allRecipesMet||(goal==='goal'?!verified.heat.delivered:verified.heat.delivered))throw Error('Independent final public verification rejected proposed solution');
 return {found:true,goal,assignment:best.assignment,swaps:best.swaps,evaluation:verified,expanded,materialSolutions,milliseconds:performance.now()-started};
}

function nextFocus(items,id,dir) {
 const current=items.find(item=>item.id===id);if(!current)throw Error('Current public focus is missing');
 const candidates=items.map((item,index)=>({item,index,dx:item.x-current.x,dy:item.y-current.y})).filter(p=>p.dx*dir.dx+p.dy*dir.dy>0);
 const distance=p=>p.dx*p.dx+p.dy*p.dy,perpendicular=p=>Math.abs(dir.dx?p.dy:p.dx);
 candidates.sort((a,b)=>(distance(a)+2*perpendicular(a)**2)-(distance(b)+2*perpendicular(b)**2)||distance(a)-distance(b)||perpendicular(a)-perpendicular(b)||a.index-b.index);
 return candidates[0]?.item.id??id;
}
function checkedFocus(m) {
 const items=m.focusItems.map(item=>({id:item.id,kind:item.kind,x:item.x,y:item.y}));
 if(items.length!==8||new Set(items.map(i=>i.id)).size!==8||items.some(i=>!Number.isFinite(i.x)||!Number.isFinite(i.y)))throw Error('Invalid bounded public focus graph');
 return items;
}
export function predictFocus(m,direction) {const dir=DIRS.find(d=>d.name===direction);if(!dir)throw Error('Unknown cardinal direction');return nextFocus(checkedFocus(m),m.selectedId,dir)}
export function focusPath(m,targetId) {
 const items=checkedFocus(m);if(!items.some(i=>i.id===targetId))throw Error('Target is outside actual public focus graph');
 const queue=[{id:m.selectedId,path:[]}],visited=new Set([m.selectedId]);
 for(let i=0;i<queue.length;i++){const node=queue[i];if(node.id===targetId)return node.path;for(const dir of DIRS){const id=nextFocus(items,node.id,dir);if(!visited.has(id)){visited.add(id);queue.push({id,path:[...node.path,dir.name]})}}}
 throw Error('Public focus graph cannot reach requested cell or FORGE');
}

function preservedLedger(m,pending) {
 for(const key of ['totalSwaps','undos','cancels','submissions','mistakes','historyDepth'])if(m[key]!==pending.beforeLedger[key])return false;
 return true;
}
export function createPilot() {
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trial=null,neutralTick=-1;
 const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<500)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trial=null;neutralTick=-1;diagnostics.length=0}
 function issue(m,kind,keys,extra={}) {
  pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeAssignment:publicAssignment(m),beforeStage:m.stage,beforeSelected:m.selectedId,beforeHeld:m.heldTileId,beforeHeldCell:m.heldCellId,beforeLedger:Object.fromEntries(['totalSwaps','undos','cancels','submissions','mistakes','historyDepth'].map(k=>[k,m[k]])),...extra};
  note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys;
 }
 function pilot(state,options={}) {
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;
  if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.totalSwaps===0?'trial':'solution';due=m.elapsed+(record?2.5:.4);note('observed-round',{level:m.level,elapsed:m.elapsed,stage})}
  if(pending) {
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}
   if(m.tick<=neutralTick)return[];
   let observed=false;
   if(pending.kind==='navigate') {
    if(m.stage!==pending.beforeStage||m.heldTileId!==pending.beforeHeld||m.heldCellId!==pending.beforeHeldCell||!same(publicAssignment(m),pending.beforeAssignment)||!preservedLedger(m,pending))throw Error('Navigation changed assignment, pickup or lifetime ledger');
    if(m.selectedId!==pending.beforeSelected){observed=true;due=m.elapsed+(record?.25:.03);note('observed-focus',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId,repeated:m.selectedId!==pending.expectedId})}
   } else if(pending.kind==='pick') {
    if(m.stage==='holding'){
     if(m.heldCellId!==task.aCellId||m.heldTileId!==task.aTileId||!same(publicAssignment(m),pending.beforeAssignment)||!preservedLedger(m,pending))throw Error('Pickup mutated board or selected the wrong physical tile');
     observed=true;due=m.elapsed+(record?1.5:.12);note('observed-pickup',{elapsed:m.elapsed,cellId:m.heldCellId,tileId:m.heldTileId});
    }
   } else if(pending.kind==='swap') {
    if(m.totalSwaps===pending.beforeLedger.totalSwaps+1){
     if(m.stage!=='select'||m.heldTileId!==null||m.heldCellId!==null||m.selectedId!==task.bCellId||!same(publicAssignment(m),pending.predicted.afterTileIds)||m.historyDepth!==pending.beforeLedger.historyDepth+1||m.undos!==pending.beforeLedger.undos||m.cancels!==pending.beforeLedger.cancels||m.mistakes!==pending.beforeLedger.mistakes||m.submissions!==pending.beforeLedger.submissions)throw Error('Actual swap violated physical IDs or history/lifetime ledger');
     for(const key of ['aCellId','bCellId','aTileId','bTileId','beforeTileIds'])if(!same(m.lastSwap?.[key],pending.predicted[key]))throw Error('Last committed swap does not match the real input');
     if(!same(m.history[m.history.length-1],m.lastSwap))throw Error('Swap history differs from latest actual swap');
     const result=evaluateBoard(m);if(result.matchedCells!==m.matchedCells||!same(result.heat,m.heat))throw Error('Swap did not atomically recompute local recipes and heat');
     observed=true;note('observed-swap',{elapsed:m.elapsed,aCellId:task.aCellId,bCellId:task.bCellId,aTileId:task.aTileId,bTileId:task.bTileId,totalSwaps:m.totalSwaps,matchedCells:m.matchedCells,heatStatus:m.heat.status});
     task=null;if(stage==='trial'){stage='trial-inspect';due=m.elapsed+4.2}else{due=m.elapsed+(record?(stage==='repair'?3:2):.12);stage='solution'}
    }
   } else if(pending.kind==='undo') {
    if(m.undos===pending.beforeLedger.undos+1){
     if(!trial||m.stage!=='select'||m.heldTileId!==null||m.heldCellId!==null||m.selectedId!==trial.aCellId||!same(publicAssignment(m),trial.beforeTileIds)||m.historyDepth!==pending.beforeLedger.historyDepth-1||m.totalSwaps!==pending.beforeLedger.totalSwaps||m.mistakes!==pending.beforeLedger.mistakes||m.submissions!==pending.beforeLedger.submissions||m.cancels!==pending.beforeLedger.cancels||m.elapsed<=pending.issuedAt)throw Error('Undo must restore exact ID allocation without refunding time or lifetime counters');
     for(const key of ['aCellId','bCellId','aTileId','bTileId','beforeTileIds'])if(!same(m.lastUndo?.swap?.[key],trial[key]))throw Error('Undo restored a different physical swap');
     observed=true;stage='repair';task={aCellId:trial.aCellId,bCellId:trial.bCellId,aTileId:trial.aTileId,bTileId:trial.bTileId};due=m.elapsed+4.2;note('observed-undo',{elapsed:m.elapsed,assignment:publicAssignment(m),totalSwaps:m.totalSwaps,undos:m.undos});
    }
   } else if(pending.kind==='cancel') {
    if(m.cancels===pending.beforeLedger.cancels+1){
     if(m.stage!=='select'||m.heldTileId!==null||m.heldCellId!==null||m.selectedId!==pending.beforeHeldCell||!same(publicAssignment(m),pending.beforeAssignment)||m.historyDepth!==pending.beforeLedger.historyDepth||m.totalSwaps!==pending.beforeLedger.totalSwaps||m.undos!==pending.beforeLedger.undos||m.submissions!==pending.beforeLedger.submissions||m.mistakes!==pending.beforeLedger.mistakes)throw Error('Cancel must not commit or undo a physical swap');
     observed=true;due=m.elapsed+.2;note('observed-cancel',{elapsed:m.elapsed});
    }
   } else if(pending.kind==='submit') {
    if(m.submissions!==pending.beforeLedger.submissions)throw Error('Public goal submission did not produce actual terminal victory');
   }
   if(observed)pending=null;
   else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.25}
   else return[];
  }
  if(m.elapsed<due)return[];
  if(stage==='trial-inspect') {
   if(m.stage!=='select'||!m.historyDepth)throw Error('Trial requires a real empty-hand history undo');
   return issue(m,'undo',['b']);
  }
  if(!task) {
   if(m.stage!=='select')return issue(m,'cancel',['b']);
   const plan=planVisibleState(m);note('public-material-search',{elapsed:m.elapsed,found:plan.found,expanded:plan.expanded,materialSolutions:plan.materialSolutions});
   if(!plan.found)throw Error('No public recipe-and-heat solution: '+plan.reason);
   if(!plan.swaps.length) {
    if(!evaluateBoard(m).goalReady||!m.goalReady)throw Error('Ready layout must satisfy every local recipe and actual heat route');
    const path=focusPath(m,'forge');
    if(path.length){const dir=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[dir.key],{expectedId:predictFocus(m,dir.name)})}
    if(stage!=='ready-inspect'){stage='ready-inspect';due=m.elapsed+(record?3.2:.2);note('observed-ready-before-explicit-submit',{elapsed:m.elapsed,submissions:m.submissions});return[]}
    return issue(m,'submit',['Space']);
   }
   task={...plan.swaps[0]};
   if(stage==='trial') {
    const choices=[];
    for(let a=0;a<m.cells.length;a++)for(let b=a+1;b<m.cells.length;b++)if(m.cells[a].material!==m.cells[b].material){const prediction=predictSwap(m,m.cells[a].id,m.cells[b].id);if(!prediction.after.goalReady)choices.push(prediction)}
    const first=choices.find(p=>p.aCellId===task.aCellId&&p.bCellId===task.bCellId);
    const chosen=first??choices.sort((a,b)=>Number(!same(b.after.heat,m.heat))-Number(!same(a.after.heat,m.heat))||Math.abs(b.after.matchedCells-m.matchedCells)-Math.abs(a.after.matchedCells-m.matchedCells))[0];
    if(!chosen)throw Error('No public nonwinning different-material trial swap');
    trial=chosen;task={aCellId:chosen.aCellId,bCellId:chosen.bCellId,aTileId:chosen.aTileId,bTileId:chosen.bTileId};note('planned-public-trial',{elapsed:m.elapsed,...task});
   }
  }
  if(m.stage==='holding'&&(m.heldCellId!==task.aCellId||m.heldTileId!==task.aTileId))return issue(m,'cancel',['b']);
  const target=m.stage==='select'?task.aCellId:task.bCellId,path=focusPath(m,target);
  if(path.length){const dir=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[dir.key],{expectedId:predictFocus(m,dir.name)})}
  if(m.stage==='select') {
   const actual=m.cells.find(cell=>cell.id===task.aCellId);if(actual.tileId!==task.aTileId)throw Error('Planned pickup physical ID no longer occupies its origin');
   return issue(m,'pick',['Space']);
  }
  const predicted=predictSwap(m,task.aCellId,task.bCellId);
  if(predicted.aTileId!==task.aTileId||predicted.bTileId!==task.bTileId)throw Error('Planned swap IDs no longer match observed board');
  if(task.previewObservedAt===undefined){task.previewObservedAt=m.elapsed;due=m.elapsed+(record?1.8:.12);return[]}
  return issue(m,'swap',['Space'],{predicted});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();
export function keys(state,options){return defaultPilot(state,options)}

export function assertPublicBoard(m,assert) {
 const e=evaluateBoard(m);
 assert.deepEqual(m.materialCounts,e.materialCounts);assert.deepEqual(m.heat,e.heat);
 for(const key of ['matchedCells','allRecipesMet','goalReady'])assert.equal(m[key],e[key]);
 for(const expected of e.cells){const actual=m.cells.find(c=>c.id===expected.id);for(const key of ['tileId','material','neighborIds','neighborByDirection','neighborCounts','requiredCount','actualCount','recipeMet','outletCellId','outletDirection'])assert.deepEqual(actual[key],expected[key]);}
 for(const tile of m.tiles)assert.equal(tile.cellId,m.cells.find(c=>c.tileId===tile.id).id);
 assert.equal(m.historyDepth,m.history.length);assert.equal(m.totalSwaps,m.historyDepth+m.undos);assert.ok(m.submissions>=m.mistakes);assert.ok(m.mistakes>=0&&m.mistakes<=m.maxMistakes);assert.equal(m.maxMistakes,3);
 for(const h of m.history){assert.equal(new Set(h.beforeTileIds).size,7);assert.equal(h.beforeTileIds.length,7);assert.ok(h.beforeTileIds.every(id=>m.tiles.some(t=>t.id===id)));assert.notEqual(h.aCellId,h.bCellId);assert.equal(h.aTileId,h.beforeTileIds[m.cells.findIndex(c=>c.id===h.aCellId)]);assert.equal(h.bTileId,h.beforeTileIds[m.cells.findIndex(c=>c.id===h.bCellId)]);}
 if(m.stage==='select'){assert.equal(m.heldTileId,null);assert.equal(m.heldCellId,null)}else{assert.equal(m.stage,'holding');assert.equal(m.cells.find(c=>c.id===m.heldCellId).tileId,m.heldTileId)}
 assert.ok(m.focusItems.some(i=>i.id===m.selectedId));assert.deepEqual(m.cursor,m.focusItems.find(i=>i.id===m.selectedId));
 assert.equal(m.score,m.matchedCells*40+(m.heat.delivered?120:0)+(m.phase==='won'?1000+Math.floor(m.remaining)*5:0));
 assert.ok(Math.abs(m.elapsed-m.tick/60)<1e-7);assert.ok(Math.abs(m.remaining-Math.max(0,m.timeLimit-m.elapsed))<1e-7);
 if(m.lastSubmission){assert.equal(m.lastSubmission.id,m.submissions);assert.ok(Number.isInteger(m.lastSubmission.id)&&m.lastSubmission.id>0)}
 if(m.phase==='won'){assert.equal(m.goalReady,true);assert.equal(m.lastSubmission.accepted,true);assert.equal(m.lastSubmission.reason,'accepted');assert.equal(m.lostReason,null);assert.deepEqual(m.lastSubmission.assignment,m.cells.map(c=>({cellId:c.id,tileId:c.tileId})));}
}
export function assertProgress({before,after,trace},assert) {
 assert.equal(after.phase,'won','Normal keys must explicitly submit a board satisfying local recipes and heat');
 assertPublicBoard(after.model,assert);assert.equal(after.model.mistakes,0);assert.equal(after.model.submissions,1);assert.ok(after.model.totalSwaps>before.model.totalSwaps);
 assert.ok(trace.some(s=>s.state.model.stage==='holding'),'Observe a real physical tile pickup');
 assert.ok(trace.some(s=>s.state.phase==='playing'&&s.state.model.goalReady&&s.state.model.submissions===0),'Ready board remains playing until explicit FORGE submission');
 for(const sample of trace)assertPublicBoard(sample.state.model,assert);
}
export function assertRetry({after,initial},assert) {
 const m=after.model;assert.equal(after.phase,'playing');assertPublicBoard(m,assert);
 for(const key of ['historyDepth','totalSwaps','undos','cancels','submissions','mistakes'])assert.equal(m[key],0);
 assert.equal(m.history.length,0);assert.equal(m.stage,'select');assert.equal(m.selectedId,m.cells[0].id);assert.equal(m.heldTileId,null);assert.equal(m.heldCellId,null);assert.equal(m.lastSwap,null);assert.equal(m.lastUndo,null);assert.equal(m.lastSubmission,null);
 if(initial){assert.deepEqual(publicAssignment(m),publicAssignment(initial.model));assert.deepEqual(m.cells.map(c=>({id:c.id,q:c.q,r:c.r,role:c.role})),initial.model.cells.map(c=>({id:c.id,q:c.q,r:c.r,role:c.role})));assert.deepEqual(m.tiles.map(t=>({id:t.id,material:t.material})),initial.model.tiles.map(t=>({id:t.id,material:t.material})));assert.deepEqual(m.materials,initial.model.materials);assert.equal(m.sourceCellId,initial.model.sourceCellId);assert.equal(m.moldCellId,initial.model.moldCellId);}
}
