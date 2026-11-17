// Fully public GF(2) constraints, independent of production Model and authored answers.
// Only ordinary keyboard edges; every action is observed before releasing/replanning.
export const budgets={maxWebGLDrawCalls:3};
const DIRS=[{key:'ArrowUp',dx:0,dy:-1},{key:'ArrowRight',dx:1,dy:0},{key:'ArrowDown',dx:0,dy:1},{key:'ArrowLeft',dx:-1,dy:0}];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const garden=m=>m.cells.map(c=>({id:c.id,open:c.open,directWaterCount:c.directWaterCount,directParity:c.directParity}));
export const publicGarden=garden;
function context(m){
 if(!m.grid||!Number.isInteger(m.grid.cols)||!Number.isInteger(m.grid.rows)||m.grid.cols<1||m.grid.rows<1||m.grid.cols*m.grid.rows>16||!Array.isArray(m.cells)||m.cells.length!==m.grid.cols*m.grid.rows||!Array.isArray(m.nozzles)||m.nozzles.length!==2)throw Error('Public garden bounds exceeded');
 const byId=new Map(m.cells.map(c=>[c.id,c])),byPosition=new Map(m.cells.map(c=>[`${c.col},${c.row}`,c]));
 if(byId.size!==m.cells.length||byPosition.size!==m.cells.length||new Set(m.nozzles.map(n=>n.id)).size!==2)throw Error('Public garden IDs must be unique');
 for(const c of m.cells)if(!Number.isInteger(c.id)||!Number.isInteger(c.col)||!Number.isInteger(c.row)||c.col<0||c.col>=m.grid.cols||c.row<0||c.row>=m.grid.rows||typeof c.open!=='boolean'||typeof c.targetOpen!=='boolean'||typeof c.requiresEven!=='boolean'||!Number.isInteger(c.directWaterCount)||c.directWaterCount<0||c.directParity!==c.directWaterCount%2)throw Error('Invalid public cell state');
 for(const n of m.nozzles){if(!Array.isArray(n.offsets)||!n.offsets.length||n.offsets.length>9||n.offsets.some(o=>!Number.isInteger(o.dx)||!Number.isInteger(o.dy)))throw Error('Invalid public spray offsets');if(!n.offsets.some(o=>o.dx===0&&o.dy===0))throw Error('Spray must include its public center');}
 const marked=m.cells.filter(c=>c.requiresEven);if(marked.some(c=>!c.targetOpen))throw Error('Marked open/even condition contradicts target');
 return{byId,byPosition,marked};
}
function affected(m,ctx,cellId,nozzle){const cell=ctx.byId.get(cellId),n=m.nozzles.find(n=>n.id===nozzle);if(!cell||!n)throw Error('Unknown public watering action');return [...new Set(n.offsets.map(o=>ctx.byPosition.get(`${cell.col+o.dx},${cell.row+o.dy}`)?.id).filter(id=>id!==undefined))].sort((a,b)=>a-b);}
export function predictWater(m,cellId=m.selectedId,nozzle=m.nozzle){
 const ctx=context(m),affectedIds=affected(m,ctx,cellId,nozzle),set=new Set(affectedIds);
 const cells=m.cells.map(c=>{const open=set.has(c.id)?!c.open:c.open,directWaterCount=c.directWaterCount+(c.id===cellId?1:0),directParity=directWaterCount%2;return{id:c.id,open,directWaterCount,directParity,conditionMet:!c.requiresEven||(open&&directParity===0),matched:open===c.targetOpen}});
 const matchedCells=cells.filter(c=>c.matched).length,satisfiedMarked=cells.filter(c=>ctx.byId.get(c.id).requiresEven&&c.conditionMet).length;
 return{cellId,nozzle,affectedIds,cells,matchedCells,satisfiedMarked,goalMatched:matchedCells===m.cells.length&&satisfiedMarked===ctx.marked.length,waterUsed:m.waterUsed+1,waterRemaining:m.waterRemaining-1};
}
const popcount=x=>{x=x-((x>>>1)&0x55555555);x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0f0f0f0f)*0x01010101)>>>24};
export function planVisibleState(m,options={}){
 const ctx=context(m),maxCandidates=options.maxCandidates??65536,maxMilliseconds=options.maxMilliseconds??1000;
 if(!Number.isInteger(maxCandidates)||maxCandidates<1||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0)throw Error('Search caps must be finite positive bounds');
 const started=performance.now(),deadline=started+maxMilliseconds,actions=m.nozzles.flatMap(n=>m.cells.map(c=>({cellId:c.id,nozzle:n.id,affectedIds:affected(m,ctx,c.id,n.id)}))),rows=[];
 if(actions.length>32)throw Error('Binary action dimension exceeds 32');
 for(const cell of m.cells)rows.push({mask:actions.reduce((v,a,i)=>a.affectedIds.includes(cell.id)?(v|(1<<i))>>>0:v,0),rhs:Number(cell.open!==cell.targetOpen)});
 for(const cell of ctx.marked)rows.push({mask:actions.reduce((v,a,i)=>a.cellId===cell.id?(v|(1<<i))>>>0:v,0),rhs:cell.directParity});
 const pivots=[];let rank=0;
 for(let col=0;col<actions.length;col++){if(performance.now()>deadline)return{found:false,reason:'time-cap',evaluated:0};const index=rows.findIndex((r,i)=>i>=rank&&Boolean(r.mask&(1<<col)));if(index<0)continue;[rows[rank],rows[index]]=[rows[index],rows[rank]];for(let r=0;r<rows.length;r++)if(r!==rank&&(rows[r].mask&(1<<col))){rows[r].mask=(rows[r].mask^rows[rank].mask)>>>0;rows[r].rhs^=rows[rank].rhs;}pivots.push(col);rank++;}
 if(rows.some(r=>r.mask===0&&r.rhs))return{found:false,reason:'inconsistent-public-constraints',evaluated:0,rank};
 const free=actions.map((_,i)=>i).filter(i=>!pivots.includes(i)),count=2**free.length;
 if(count>maxCandidates)return{found:false,reason:'nullspace-cap',evaluated:0,rank,nullity:free.length,required:count};
 let particular=0;for(let r=0;r<rank;r++)if(rows[r].rhs)particular=(particular|(1<<pivots[r]))>>>0;
 const basis=free.map(f=>{let b=(1<<f)>>>0;for(let r=0;r<rank;r++)if(rows[r].mask&(1<<f))b=(b|(1<<pivots[r]))>>>0;return b;});
 let current=particular,best=current,minimum=popcount(current),evaluated=0;
 for(let i=0;i<count;i++){if(performance.now()>deadline)return{found:false,reason:'time-cap',evaluated,rank,nullity:free.length};if(i){const changed=31-Math.clz32((i&-i)>>>0);current=(current^basis[changed])>>>0;}evaluated++;const cost=popcount(current);if(cost<minimum||(cost===minimum&&current<best)){best=current;minimum=cost;}}
 if(minimum>m.waterRemaining)return{found:false,reason:'remaining-water',minimumDrops:minimum,evaluated,rank,nullity:free.length};
 const selected=actions.filter((_,i)=>Boolean(best&(1<<i))).map(({cellId,nozzle})=>({cellId,nozzle}));
 selected.sort((a,b)=>(a.nozzle===m.nozzle?0:1)-(b.nozzle===m.nozzle?0:1)||m.nozzles.findIndex(n=>n.id===a.nozzle)-m.nozzles.findIndex(n=>n.id===b.nozzle)||a.cellId-b.cellId);
 return{found:true,actions:selected,minimumDrops:minimum,rank,nullity:free.length,evaluated,milliseconds:performance.now()-started};
}
function trialAction(m){
 const plan=planVisibleState(m);if(!plan.found||plan.minimumDrops+2>m.waterRemaining)throw Error('Two real trial drops leave insufficient public solution budget');
 const alternate=m.nozzles.find(n=>n.id!==m.nozzle).id,current=m.cells.find(c=>c.id===m.selectedId);
 const choices=m.cells.filter(c=>c.requiresEven).slice().sort((a,b)=>Number(b.open)-Number(a.open)||Math.abs(a.col-current.col)+Math.abs(a.row-current.row)-Math.abs(b.col-current.col)-Math.abs(b.row-current.row)||a.id-b.id);
 const cell=choices.find(c=>!predictWater(m,c.id,alternate).goalMatched);if(!cell)throw Error('No safe marked-cell double-watering demonstration');return{cellId:cell.id,nozzle:alternate};
}
export function createPilot(){
 let previousElapsed=null,stage=null,record=false,due=0,pending=null,task=null,trialBefore=null,neutralTick=-1,ready=false;const diagnostics=[];
 const note=(type,data={})=>{if(diagnostics.length<500)diagnostics.push({type,...data})};
 function reset(){stage=null;due=0;pending=null;task=null;trialBefore=null;neutralTick=-1;ready=false;diagnostics.length=0;}
 function issue(m,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:m.elapsed,beforeId:m.selectedId,beforeNozzle:m.nozzle,beforeSwitches:m.nozzleSwitches,beforeUsed:m.waterUsed,beforeRemaining:m.waterRemaining,beforeGarden:garden(m),...extra};note('ordinary-input',{kind,elapsed:m.elapsed,keys});return keys;}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];const m=state.model;if(previousElapsed!==null&&m.elapsed<previousElapsed)reset();previousElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.waterUsed===0?'trial-first':'solution';due=m.elapsed+(record?2.5:1);note('observed-round',{elapsed:m.elapsed,stage,level:m.level});}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[];}if(m.tick<=neutralTick)return[];
   let observed=false;
   if(pending.kind==='navigate'&&m.selectedId!==pending.beforeId){if(m.waterUsed!==pending.beforeUsed||m.nozzle!==pending.beforeNozzle||!same(garden(m),pending.beforeGarden))throw Error('Cursor navigation mutated garden');observed=true;due=m.elapsed+(record?.4:.05);ready=false;note('observed-focus',{elapsed:m.elapsed,id:m.selectedId,expected:pending.expectedId,repeated:m.selectedId!==pending.expectedId});}
   if(pending.kind==='switch'&&m.nozzleSwitches===pending.beforeSwitches+1){if(m.nozzle===pending.beforeNozzle||m.waterUsed!==pending.beforeUsed||m.waterRemaining!==pending.beforeRemaining||!same(garden(m),pending.beforeGarden))throw Error('Nozzle switch undid or spent water');observed=true;due=m.elapsed+(record?1.3:.2);ready=false;note('observed-switch',{elapsed:m.elapsed,nozzle:m.nozzle,waterUsed:m.waterUsed});}
   if(pending.kind==='water'&&m.waterUsed===pending.beforeUsed+1){
    const e=pending.predicted;if(m.waterRemaining!==e.waterRemaining||!same(garden(m),e.cells.map(c=>({id:c.id,open:c.open,directWaterCount:c.directWaterCount,directParity:c.directParity})))||m.matchedCells!==e.matchedCells||m.satisfiedMarked!==e.satisfiedMarked||m.goalMatched!==e.goalMatched)throw Error('Actual watering differs from independent XOR/direct-parity prediction');
    // The .6-second spray highlight may legitimately expire during a slow read.
    // No input besides release has been issued while this one action is pending;
    // permanent cells, direct counts and water usage above remain mandatory.
    if(m.lastWater){if(m.lastWater.id!==m.waterUsed||!same(m.lastWater.affectedIds,e.affectedIds)||m.lastWater.cellId!==task.cellId||m.lastWater.nozzle!==task.nozzle)throw Error('Observed spray metadata differs from the actual watering action');}
    else if(m.elapsed-pending.issuedAt<.6)throw Error('Spray metadata vanished before its public highlight lifetime');
    observed=true;ready=false;note('observed-water',{elapsed:m.elapsed,cellId:task.cellId,nozzle:task.nozzle,waterUsed:m.waterUsed,affectedIds:e.affectedIds,directWaterCount:m.cells.find(c=>c.id===task.cellId).directWaterCount});
    if(stage==='trial-first'){stage='trial-second';due=m.elapsed+4.2;}
    else if(stage==='trial-second'){
     if(!trialBefore||m.waterUsed!==trialBefore.used+2||m.waterRemaining!==trialBefore.remaining-2||m.cells.some(c=>{const b=trialBefore.cells.find(b=>b.id===c.id);return c.open!==b.open||c.directParity!==b.directParity||c.directWaterCount!==b.directWaterCount+(c.id===task.cellId?2:0);}))throw Error('Two identical sprays failed to restore pattern/parity with permanent water cost');
     note('observed-double-restoration',{elapsed:m.elapsed,cellId:task.cellId,nozzle:task.nozzle,waterUsed:m.waterUsed,waterRemaining:m.waterRemaining});stage='solution';task=null;due=m.elapsed+4.2;
    }else{task=null;due=m.elapsed+(record?2.5:.35);}
   }
   if(observed)pending=null;else if(m.elapsed-pending.issuedAt>1.5){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.25;ready=false;}else return[];
  }
  if(m.elapsed<due)return[];
  if(!task){if(stage==='trial-first'){task=trialAction(m);trialBefore={cells:garden(m),used:m.waterUsed,remaining:m.waterRemaining};note('planned-public-trial',{elapsed:m.elapsed,...task});}else{const plan=planVisibleState(m);note('public-linear-search',{elapsed:m.elapsed,found:plan.found,minimumDrops:plan.minimumDrops,rank:plan.rank,nullity:plan.nullity,evaluated:plan.evaluated});if(!plan.found)throw Error('Public remaining garden cannot be solved: '+plan.reason);if(!plan.actions.length)throw Error('All public constraints satisfied without model win');task=plan.actions[0];}ready=false;}
  if(m.nozzle!==task.nozzle)return issue(m,'switch',['b']);
  if(m.selectedId!==task.cellId){const from=m.cells.find(c=>c.id===m.selectedId),to=m.cells.find(c=>c.id===task.cellId),dir=to.col!==from.col?DIRS[to.col>from.col?1:3]:DIRS[to.row>from.row?2:0],next=m.cells.find(c=>c.col===from.col+dir.dx&&c.row===from.row+dir.dy);return issue(m,'navigate',[dir.key],{expectedId:next.id});}
  if(!ready){ready=true;due=m.elapsed+(record?1.2:.15);return[];}
  return issue(m,'water',['Space'],{predicted:predictWater(m,task.cellId,task.nozzle)});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options);}
export function assertPublicGarden(m,assert){
 const ctx=context(m),marked=ctx.marked,matched=m.cells.filter(c=>c.open===c.targetOpen).length,satisfied=marked.filter(c=>c.open&&c.directWaterCount%2===0).length;
 assert.deepEqual(m.targetPattern,m.cells.map(c=>c.targetOpen));assert.deepEqual(m.markedIds,marked.map(c=>c.id));assert.equal(m.matchedCells,matched);assert.equal(m.markedCount,marked.length);assert.equal(m.satisfiedMarked,satisfied);assert.equal(m.patternMatched,matched===m.cells.length);assert.equal(m.allMarkedSatisfied,satisfied===marked.length);assert.equal(m.goalMatched,m.patternMatched&&m.allMarkedSatisfied);
 for(const c of m.cells){assert.equal(c.directParity,c.directWaterCount%2);assert.equal(c.conditionMet,!c.requiresEven||(c.open&&c.directParity===0));assert.equal(c.matched,c.open===c.targetOpen);}
 assert.equal(m.waterRemaining,m.waterBudget-m.waterUsed);assert.equal(m.waterUsed,m.cells.reduce((n,c)=>n+c.directWaterCount,0));assert.ok(m.waterRemaining>=0);assert.deepEqual(m.previewIds,affected(m,ctx,m.selectedId,m.nozzle));const cursor=ctx.byId.get(m.selectedId);for(const k of['id','col','row','x','y'])assert.equal(m.cursor[k],cursor[k]);
 assert.equal(m.score,matched*20+satisfied*40+(m.phase==='won'?1000+m.waterRemaining*100+Math.floor(m.remaining)*5:0));
 if(m.lastWater){const w=m.lastWater;assert.equal(w.id,m.waterUsed);assert.deepEqual(w.affectedIds,affected(m,ctx,w.cellId,w.nozzle));assert.equal(w.directAfter,w.directBefore+1);assert.deepEqual(w.changes.map(c=>c.cellId),w.affectedIds);for(const c of w.changes)assert.equal(c.afterOpen,!c.beforeOpen);}
}
export function assertProgress({after,trace},assert){const m=after.model;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.goalMatched,true);assert.equal(m.patternMatched,true);assert.equal(m.allMarkedSatisfied,true);assert.equal(m.lostReason,null);assert.ok(m.waterUsed>=1);assertPublicGarden(m,assert);for(const sample of trace)assertPublicGarden(sample.state.model,assert);const play=trace.map(s=>s.state.model);assert.ok(play.some(s=>s.waterUsed>0&&s.phase==='playing'),'actual committed watering observed before completion');assert.ok(play.some(s=>s.lastWater&&s.lastWater.affectedIds.some(id=>id!==s.lastWater.cellId)),'actual neighboring flowers toggled');}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.lostReason,null);assert.equal(m.lastWater,null);assert.ok(m.elapsed<2);for(const k of['waterUsed','nozzleSwitches','totalAffectedToggles'])assert.equal(m[k],0);for(const c of m.cells){assert.equal(c.directWaterCount,0);assert.equal(c.directParity,0);}for(const k of['cells','targetPattern','markedIds','selectedId','cursor','nozzles','nozzle','previewIds','waterBudget','waterRemaining','matchedCells','markedCount','satisfiedMarked','patternMatched','allMarkedSatisfied','goalMatched'])assert.deepEqual(m[k],initial.model[k]);assertPublicGarden(m,assert);}
