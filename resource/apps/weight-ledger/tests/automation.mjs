// Public integer allocation search and observed-state focus navigation only.
// No production Model/solver imports, private history, authored answers or writes.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{name:'N',key:'ArrowUp',dx:0,dy:-1},{name:'E',key:'ArrowRight',dx:1,dy:0},{name:'S',key:'ArrowDown',dx:0,dy:1},{name:'W',key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const allocation=m=>m.weights.slice().sort((a,b)=>a.id-b.id).map(w=>({id:w.id,trayId:w.trayId}));
export const publicAllocation=allocation;
function context(m){
 if(!Array.isArray(m.weights)||m.weights.length<1||m.weights.length>8||!Array.isArray(m.trays)||m.trays.length<2||m.trays.length>5)throw Error('Public allocation bounds exceeded');
 if(new Set(m.weights.map(w=>w.id)).size!==m.weights.length||new Set(m.trays.map(t=>t.id)).size!==m.trays.length)throw Error('Physical IDs must be unique');
 const trayMap=new Map(m.trays.map(t=>[t.id,t]));
 for(const w of m.weights)if(!Number.isInteger(w.id)||!Number.isInteger(w.mass)||w.mass<=0||!trayMap.has(w.trayId))throw Error('Invalid public integer weight');
 for(const t of m.trays)if(!Number.isInteger(t.capacity)||t.capacity<0)throw Error('Invalid public capacity');
 for(const s of m.scales)for(const side of[s.left,s.right]){if(!Number.isInteger(side.constant))throw Error('Invalid fixed integer load');for(const term of side.terms)if(!trayMap.has(term.trayId)||!Number.isInteger(term.coefficient)||term.coefficient<=0)throw Error('Invalid public lever coefficient')}
 return{weights:m.weights.slice().sort((a,b)=>a.id-b.id),trays:m.trays,active:m.trays.filter(t=>!t.isBank),trayMap};
}
export function evaluateAllocation(m,assigned=allocation(m)){
 const c=context(m),byId=new Map(assigned.map(a=>[a.id,a.trayId]));if(byId.size!==c.weights.length||assigned.length!==c.weights.length)throw Error('Every physical ID must be allocated once');
 const totals=Object.fromEntries(c.trays.map(t=>[t.id,0])),ids=Object.fromEntries(c.trays.map(t=>[t.id,[]]));
 for(const w of c.weights){const tray=byId.get(w.id);if(!c.trayMap.has(tray))throw Error('Unknown allocated tray');totals[tray]+=w.mass;ids[tray].push(w.id)}
 for(const t of c.trays)if(ids[t.id].length>t.capacity)throw Error('Public capacity exceeded');
 const side=s=>s.constant+s.terms.reduce((sum,t)=>sum+t.coefficient*totals[t.trayId],0);
 const scales=m.scales.map(s=>{const leftTotal=side(s.left),rightTotal=side(s.right),delta=leftTotal-rightTotal;return{id:s.id,leftTotal,rightTotal,delta,balanced:delta===0}});
 const inventoryIds=c.trays.filter(t=>t.isBank).flatMap(t=>ids[t.id]),deployedCount=c.weights.length-inventoryIds.length,balancedCount=scales.filter(s=>s.balanced).length;
 return{allocation:c.weights.map(w=>({id:w.id,trayId:byId.get(w.id)})),trayTotals:totals,trayWeightIds:ids,inventoryIds,totalMass:c.weights.reduce((a,w)=>a+w.mass,0),deployedCount,inventoryCount:inventoryIds.length,allDeployed:inventoryIds.length===0,scales,balancedCount,allBalanced:balancedCount===scales.length};
}
export function predictRelocation(m,weightId,toTrayId){
 const before=evaluateAllocation(m),weight=m.weights.find(w=>w.id===weightId),to=m.trays.find(t=>t.id===toTrayId);if(!weight||!to)throw Error('Unknown physical relocation');
 if(weight.trayId===toTrayId)return{valid:false,reason:'same-tray-free-return'};
 if(before.trayWeightIds[toTrayId].length>=to.capacity)return{valid:false,reason:'capacity'};
 const next=before.allocation.map(a=>a.id===weightId?{id:a.id,trayId:toTrayId}:a),after=evaluateAllocation(m,next),changedScaleIds=after.scales.filter((s,i)=>s.delta!==before.scales[i].delta).map(s=>s.id);
 return{valid:true,weightId,fromTrayId:weight.trayId,toTrayId,after,changedScaleIds,goalReached:after.allDeployed&&after.allBalanced,movesUsed:m.movesUsed+1};
}
export function planVisibleState(m,options={}){
 const c=context(m),maxAssignments=options.maxAssignments??10000,maxMilliseconds=options.maxMilliseconds??1000;
 if(!Number.isInteger(maxAssignments)||maxAssignments<1||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0)throw Error('Search caps must be finite positive bounds');
 const started=performance.now(),deadline=started+maxMilliseconds,required=c.active.length**c.weights.length;
 if(required>maxAssignments)return{found:false,reason:'assignment-cap',evaluated:0,required};
 const choices=c.active.map(t=>t.id),counts=Object.fromEntries(choices.map(id=>[id,0])),current=[],best={moves:Infinity,assignment:null};let evaluated=0,limited=null;
 function visit(index,moves){
  if(performance.now()>deadline){limited='time-cap';return}if(limited||moves>best.moves)return;
  if(index===c.weights.length){if(evaluated>=maxAssignments){limited='assignment-cap';return}evaluated++;const result=evaluateAllocation(m,current);if(result.allDeployed&&result.allBalanced&&moves<best.moves){best.moves=moves;best.assignment=current.map(a=>({...a}))}return}
  const weight=c.weights[index];for(const trayId of choices){if(limited)return;if(counts[trayId]>=c.trayMap.get(trayId).capacity)continue;counts[trayId]++;current.push({id:weight.id,trayId});visit(index+1,moves+(trayId!==weight.trayId?1:0));current.pop();counts[trayId]--}
 }
 visit(0,0);if(limited)return{found:false,reason:limited,evaluated,required};
 if(!best.assignment)return{found:false,reason:'no-public-integer-balance',evaluated,required};
 if(best.moves>m.movesRemaining)return{found:false,reason:'remaining-budget',minimumMoves:best.moves,evaluated,required};
 const relocations=best.assignment.filter(a=>c.weights.find(w=>w.id===a.id).trayId!==a.trayId).map(a=>({weightId:a.id,toTrayId:a.trayId}));
 return{found:true,assignment:best.assignment,relocations,minimumMoves:best.moves,evaluated,required,milliseconds:performance.now()-started};
}
function chooseFocus(items,selectedId,dir,trayOrder){
 const from=items.find(i=>i.id===selectedId);if(!from)throw Error('Current public focus is missing');
 const candidates=items.filter(i=>i.id!==selectedId).map(item=>{const dx=item.x-from.x,dy=item.y-from.y,forward=dx*dir.dx+dy*dir.dy,perp=dir.dx?dy:dx;return{item,forward,cost:forward+3*Math.abs(perp)}}).filter(c=>c.forward>0);
 candidates.sort((a,b)=>a.cost-b.cost||(a.item.kind==='weight'?a.item.id-b.item.id:trayOrder.indexOf(a.item.id)-trayOrder.indexOf(b.item.id)));
 return candidates[0]?.item.id??selectedId;
}
export function predictFocus(m,direction){const dir=DIRS.find(d=>d.name===direction);if(!dir)throw Error('Unknown cardinal direction');return chooseFocus(m.selectionItems,m.selectedId,dir,m.trays.map(t=>t.id))}
export function focusPath(m,targetId){
 if(!m.selectionItems.some(i=>i.id===targetId))throw Error('Destination is outside current public focus domain');
 const queue=[{id:m.selectedId,path:[]}],seen=new Set([m.selectedId]),order=m.trays.map(t=>t.id);
 for(let head=0;head<queue.length;head++){const n=queue[head];if(n.id===targetId)return n.path;for(const dir of DIRS){const id=chooseFocus(m.selectionItems,n.id,dir,order);if(seen.has(id))continue;seen.add(id);queue.push({id,path:[...n.path,dir.name]})}}
 throw Error('Public focus graph cannot reach selected physical item');
}
function trialMove(m){
 const solution=planVisibleState(m);if(!solution.found)throw Error('No initial public solution: '+solution.reason);
 const choices=[];for(const w of m.weights)for(const t of m.trays){const p=predictRelocation(m,w.id,t.id);if(p.valid&&!p.goalReached&&p.movesUsed<m.moveBudget&&p.changedScaleIds.length>=2){const target=solution.assignment.find(a=>a.id===w.id).trayId;choices.push({...p,preferred:(!m.trays.find(t=>t.id===w.trayId).isBank&&!t.isBank?2:0)+(target!==t.id?1:0)})}}
 choices.sort((a,b)=>b.preferred-a.preferred||a.weightId-b.weightId||m.trays.findIndex(t=>t.id===a.toTrayId)-m.trays.findIndex(t=>t.id===b.toTrayId));if(!choices.length)throw Error('No safe public shared-tray demonstration');return choices[0];
}
export function createPilot(){
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trialBefore=null,neutralTick=-1;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<400)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trialBefore=null;neutralTick=-1;diagnostics.length=0}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeMode:m.mode,beforeId:m.selectedId,beforeTotal:m.totalMoves,beforeMoves:m.movesUsed,beforeUndos:m.undos,beforeCancels:m.cancels,beforeHistory:m.historyDepth,beforeAllocation:allocation(m),...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.totalMoves===0&&m.heldWeightId===null?'trial':'solution';due=m.elapsed+(record?2.5:1);note('observed-round',{elapsed:m.elapsed,stage,level:m.level});}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}if(m.tick<=neutralTick)return[];
   let observed=false;
   if(pending.kind==='navigate'){
    if(m.mode!==pending.beforeMode)throw Error('Focus movement unexpectedly changed pickup mode');
    if(m.selectedId!==pending.beforeId){note('observed-focus',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId,repeated:m.selectedId!==pending.expectedId});observed=true;due=m.elapsed+(record?.55:.08)}
   }else if(pending.kind==='pick'){
    if(m.heldWeightId===task.weightId&&m.mode==='placing'){if(!same(allocation(m),pending.beforeAllocation)||m.movesUsed!==pending.beforeMoves||m.totalMoves!==pending.beforeTotal||m.historyDepth!==pending.beforeHistory)throw Error('Pickup mutated committed allocation');observed=true;due=m.elapsed+(record?2:.45);note('observed-pickup',{elapsed:m.elapsed,weightId:m.heldWeightId,source:m.selectedTrayId});}
   }else if(pending.kind==='place'){
    if(m.totalMoves===pending.beforeTotal+1){if(m.mode!=='selecting'||m.heldWeightId!==null||!same(allocation(m),pending.predicted.after.allocation)||m.movesUsed!==pending.beforeMoves+1||m.historyDepth!==pending.beforeHistory+1)throw Error('Placement differs from independent integer prediction');for(const expected of pending.predicted.after.scales){const actual=m.scales.find(s=>s.id===expected.id);for(const k of['leftTotal','rightTotal','delta','balanced'])if(actual[k]!==expected[k])throw Error('Shared scale did not reflect actual relocation')}
     note('observed-placement',{elapsed:m.elapsed,weightId:task.weightId,fromTrayId:pending.predicted.fromTrayId,toTrayId:task.toTrayId,changedScaleIds:pending.predicted.changedScaleIds,totalMoves:m.totalMoves,movesUsed:m.movesUsed});observed=true;task=null;
     if(stage==='trial'){stage='trial-inspect';due=m.elapsed+4.2}else due=m.elapsed+(record?2.7:.6);
    }
   }else if(pending.kind==='undo'){
    if(m.undos===pending.beforeUndos+1){if(!trialBefore||m.mode!=='selecting'||m.heldWeightId!==null||!same(allocation(m),trialBefore.allocation)||m.movesUsed!==trialBefore.movesUsed||m.historyDepth!==trialBefore.historyDepth||m.totalMoves!==pending.beforeTotal||m.elapsed<=pending.issuedAt)throw Error('B undo did not restore committed inventory and budget while retaining time/counters');observed=true;stage='solution';due=m.elapsed+3.5;note('observed-undo',{elapsed:m.elapsed,movesUsed:m.movesUsed,totalMoves:m.totalMoves,undos:m.undos,allocation:allocation(m)});}
   }else if(pending.kind==='cancel'){
    if(m.cancels===pending.beforeCancels+1&&m.heldWeightId===null){if(!same(allocation(m),pending.beforeAllocation)||m.movesUsed!==pending.beforeMoves||m.historyDepth!==pending.beforeHistory)throw Error('B cancellation unexpectedly undid a committed placement');observed=true;task=null;due=m.elapsed+.5;note('observed-cancel',{elapsed:m.elapsed,cancels:m.cancels});}
   }
   if(observed)pending=null;else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.25}else return[];
  }
  if(m.elapsed<due)return[];
  if(stage==='trial-inspect'){if(m.heldWeightId!==null||!m.canUndo)throw Error('Completed trial must be undoable without a pickup');return issue(m,'undo',['b'])}
  if(!task){
   if(m.heldWeightId!==null)return issue(m,'cancel',['b']);
   if(stage==='trial'){task=trialMove(m);trialBefore={allocation:allocation(m),movesUsed:m.movesUsed,historyDepth:m.historyDepth};note('planned-public-trial',{elapsed:m.elapsed,weightId:task.weightId,toTrayId:task.toTrayId,changedScaleIds:task.changedScaleIds});}
   else{const plan=planVisibleState(m);note('public-allocation-search',{elapsed:m.elapsed,found:plan.found,evaluated:plan.evaluated,minimumMoves:plan.minimumMoves});if(!plan.found)throw Error('Public remaining puzzle cannot be solved: '+plan.reason);if(!plan.relocations.length)throw Error('All public constraints satisfied without a model win');task=plan.relocations[0];}
  }
  const target=m.mode==='placing'?task.toTrayId:task.weightId,path=focusPath(m,target);
  if(path.length){const dir=DIRS.find(d=>d.name===path[0]);return issue(m,'navigate',[dir.key],{expectedId:predictFocus(m,dir.name)})}
  if(m.mode==='selecting')return issue(m,'pick',['Space']);
  if(m.heldWeightId!==task.weightId)throw Error('Actual carried physical ID differs from chosen task');
  const predicted=predictRelocation(m,task.weightId,task.toTrayId);if(!predicted.valid)throw Error('Chosen public relocation became invalid');return issue(m,'place',['Space'],{predicted});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options)}
export function assertPublicAllocation(m,assert){
 const expected=evaluateAllocation(m);for(const k of['totalMass','deployedCount','inventoryCount','allDeployed','balancedCount','allBalanced'])assert.equal(m[k],expected[k]);assert.deepEqual(m.inventoryIds,expected.inventoryIds);
 for(const t of m.trays){assert.equal(t.totalMass,expected.trayTotals[t.id]);assert.deepEqual(t.weightIds,expected.trayWeightIds[t.id]);assert.ok(t.weightIds.length<=t.capacity)}
 for(const s of m.scales){const e=expected.scales.find(e=>e.id===s.id);for(const k of['leftTotal','rightTotal','delta','balanced'])assert.equal(s[k],e[k]);assert.ok(Number.isInteger(s.delta))}
 for(const w of m.weights){const t=m.trays.find(t=>t.id===w.trayId),slot=t.weightIds.indexOf(w.id);assert.equal(w.slot,slot);assert.equal(w.x,t.x+(slot%3-1)*54);assert.equal(w.y,t.y+(Math.floor(slot/3)-.5)*48+10)}
 assert.equal(m.movesRemaining,m.moveBudget-m.movesUsed);assert.equal(m.historyDepth,m.movesUsed);assert.equal(m.totalMoves-m.undos,m.movesUsed);assert.ok(m.movesUsed>=0&&m.movesUsed<=m.moveBudget);assert.equal(m.mode,m.heldWeightId===null?'selecting':'placing');assert.equal(m.selectedId,m.mode==='selecting'?m.selectedWeightId:m.selectedTrayId);assert.equal(m.canUndo,m.phase==='playing'&&m.heldWeightId===null&&m.historyDepth>0);
 const points=m.mode==='selecting'?m.weights:m.trays;assert.deepEqual(m.selectionItems,points.map(p=>({kind:m.mode==='selecting'?'weight':'tray',id:p.id,x:p.x,y:p.y})));assert.ok(m.selectionItems.some(i=>i.id===m.selectedId));
 assert.equal(m.score,m.balancedCount*200+m.deployedCount*25+(m.phase==='won'?1000+m.movesRemaining*50+Math.floor(m.remaining)*5:0));
}
export function assertProgress({after,trace},assert){const m=after.model;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.allDeployed,true);assert.equal(m.allBalanced,true);assert.equal(m.heldWeightId,null);assert.equal(m.lostReason,null);assert.ok(m.movesUsed<=m.moveBudget);assert.ok(m.totalMoves>=1);assertPublicAllocation(m,assert);for(const sample of trace)assertPublicAllocation(sample.state.model,assert);const play=trace.map(t=>t.state.model);assert.ok(play.some(x=>x.mode==='placing'),'actual pickup preview observed');assert.ok(play.some((x,i)=>i&&x.scales.filter((s,j)=>s.delta!==play[i-1].scales[j].delta).length>=2),'an observed relocation updates at least two scale equations');}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.mode,'selecting');assert.equal(m.heldWeightId,null);assert.equal(m.selectedTrayId,null);assert.equal(m.lostReason,null);assert.equal(m.lastTransfer,null);assert.ok(m.elapsed<2);for(const k of['movesUsed','historyDepth','totalMoves','pickups','cancels','undos','invalidPlacements'])assert.equal(m[k],0);for(const k of['weights','trays','scales','selectionItems','selectedId','selectedWeightId','inventoryIds','totalMass','deployedCount','inventoryCount','allDeployed','balancedCount','allBalanced','moveBudget','movesRemaining'])assert.deepEqual(m[k],initial.model[k]);assertPublicAllocation(m,assert);}
