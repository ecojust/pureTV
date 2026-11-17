// Independent visible-board search and ordinary-key controller. No production
// Model/solver imports, authored solutions, private-field reads or state writes.
export const budgets={maxWebGLDrawCalls:3};
const DIRECTIONS=[{letter:'N',key:'ArrowUp',dc:0,dr:-1,entry:'S'},{letter:'E',key:'ArrowRight',dc:1,dr:0,entry:'W'},{letter:'S',key:'ArrowDown',dc:0,dr:1,entry:'N'},{letter:'W',key:'ArrowLeft',dc:-1,dr:0,entry:'E'}];
const now=()=>performance.now();
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const prefix=(symbols,target)=>{let length=0;while(length<symbols.length&&length<target.length&&symbols[length]===target[length])length++;return length};

function boardContext(model){
 const {cols,rows}=model.grid;if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols*rows>25||cols<1||rows<1)throw new Error('Expected a bounded public grid');
 if(model.cells.length!==cols*rows||model.visited.length!==cols*rows)throw new Error('Incomplete public grid');
 const byId=new Map(model.cells.map(cell=>[cell.id,cell]));
 if(byId.size!==model.cells.length||model.cells.some(cell=>cell.id!==cell.row*cols+cell.col))throw new Error('Inconsistent public cell coordinates');
 if(model.target.some(symbol=>!DIRECTIONS.some(d=>d.letter===symbol)))throw new Error('Unknown public target glyph');
 return{cols,rows,byId,start:model.start.id,exit:model.exit.id,target:[...model.target]};
}
function neighbor(context,id,dir){const cell=context.byId.get(id),col=cell.col+dir.dc,row=cell.row+dir.dr;if(col<0||row<0||col>=context.cols||row>=context.rows)return null;const next=context.byId.get(row*context.cols+col);return next.type==='floor'?next:null}
function emitted(cell,entry){return cell.rune&&(cell.rune.enterFrom===null||cell.rune.enterFrom===entry)?cell.rune.symbol:null}
function occupancy(model){return model.visited.reduce((mask,value,id)=>value?mask|(1<<id):mask,0)}
function legal(context,id,mask){return DIRECTIONS.map(dir=>({dir,cell:neighbor(context,id,dir)})).filter(item=>item.cell&&!(mask&(1<<item.cell.id)))}
export function publicRouteSignature(model){return JSON.stringify({player:model.player.cellId,path:model.path.map(item=>item.cellId),symbols:model.symbols,visited:model.visited,routeStatus:model.routeStatus,clears:model.clears,mistakes:model.mistakes})}

export function predictVisibleMove(model,letter){
 const context=boardContext(model),dir=DIRECTIONS.find(item=>item.letter===letter);if(!dir)throw new Error('Unknown ordinary direction');
 if(model.phase!=='playing'||model.routeStatus!=='drawing')return{valid:false,reason:'route-locked'};
 const cell=neighbor(context,model.player.cellId,dir);if(!cell)return{valid:false,reason:'boundary-or-wall'};
 if(model.visited[cell.id])return{valid:false,reason:'already-visited'};
 const symbol=emitted(cell,dir.entry),symbols=symbol===null?[...model.symbols]:[...model.symbols,symbol],mask=occupancy(model)|(1<<cell.id),dead=cell.id!==context.exit&&legal(context,cell.id,mask).length===0;
 const conditional=!!(cell.rune&&cell.rune.enterFrom!==null),conditionalResult=conditional?(symbol===null?'skipped':'active'):null;
 return{valid:true,direction:letter,key:dir.key,toCellId:cell.id,enteredFrom:dir.entry,emitted:symbol,conditionalResult,pathIds:[...model.path.map(item=>item.cellId),cell.id],symbols,conditionHits:model.conditionHits+(conditionalResult==='active'?1:0),conditionSkips:model.conditionSkips+(conditionalResult==='skipped'?1:0),routeStatus:cell.id===context.exit?'at-exit':dead?'rejected':'drawing',mistakes:model.mistakes+(dead?1:0),prefixLength:prefix(symbols,context.target),sequenceMatches:equal(symbols,context.target)};
}

export function planVisibleState(model,options={}){
 const context=boardContext(model),goal=options.goal||'match';if(!['match','reject'].includes(goal))throw new Error('Unknown public search goal');
 const maxExpanded=options.maxExpanded??50000,maxQueued=options.maxQueued??100000,maxMilliseconds=options.maxMilliseconds??1500;
 if(!Number.isInteger(maxExpanded)||maxExpanded<1||!Number.isInteger(maxQueued)||maxQueued<1||!Number.isFinite(maxMilliseconds)||maxMilliseconds<=0)throw new Error('Search caps must be positive finite bounds');
 const started=now(),deadline=started+maxMilliseconds;
 if(model.phase!=='playing'||model.routeStatus==='rejected')return{found:false,reason:'route-locked',expanded:0,queued:0};
 const initialPrefix=prefix(model.symbols,context.target),initialBad=initialPrefix!==model.symbols.length;
 if(goal==='match'&&initialBad)return{found:false,reason:'current-symbols-not-target-prefix',expanded:0,queued:0};
 const queue=[{id:model.player.cellId,mask:occupancy(model),index:initialPrefix,bad:initialBad,parent:-1,dir:null}],seen=new Set();
 const key=node=>`${node.id}:${node.mask}:${node.index}:${node.bad?1:0}`;seen.add(key(queue[0]));let head=0,expanded=0,fallback=-1,limited=null;
 function finish(index,terminal){const directions=[],cells=[];for(let item=queue[index];item.parent>=0;item=queue[item.parent]){directions.push(item.dir);cells.push(item.id)}directions.reverse();cells.reverse();return{found:true,directions,cellIds:cells,terminal,expanded,queued:queue.length,milliseconds:now()-started,limited}}
 while(head<queue.length){
  if(now()>deadline){limited='time-cap';break}if(expanded>=maxExpanded){limited='expansion-cap';break}
  const index=head++,node=queue[index];expanded++;
  if(node.id===context.exit){if((goal==='match'&&!node.bad&&node.index===context.target.length)||(goal==='reject'&&(node.bad||node.index!==context.target.length)))return finish(index,'exit');continue}
  const moves=legal(context,node.id,node.mask);
  if(!moves.length){if(goal==='reject'&&node.parent>=0&&fallback<0)fallback=index;continue}
  for(const{dir,cell}of moves){
   if(now()>deadline){limited='time-cap';break}
   const symbol=emitted(cell,dir.entry);let matchIndex=node.index,bad=node.bad;
   if(symbol!==null&&!bad){if(matchIndex>=context.target.length||symbol!==context.target[matchIndex])bad=true;else matchIndex++}
   if(goal==='match'&&bad)continue;
   const child={id:cell.id,mask:node.mask|(1<<cell.id),index:matchIndex,bad,parent:index,dir:dir.letter},signature=key(child);if(seen.has(signature))continue;
   if(queue.length>=maxQueued){limited='queue-cap';break}seen.add(signature);queue.push(child);
  }
  if(limited)break;
 }
 if(goal==='reject'&&fallback>=0)return finish(fallback,'dead-end');
 return{found:false,reason:limited||'no-public-route',expanded,queued:queue.length,milliseconds:now()-started};
}

export function createPilot(){
 let lastElapsed=null,stage=null,record=false,pending=null,due=0,neutralTick=-1;
 const diagnostics=[];const note=(kind,data)=>{if(diagnostics.length<300)diagnostics.push({kind,...data})};
 function reset(){stage=null;pending=null;due=0;neutralTick=-1;diagnostics.length=0}
 function issue(model,kind,keys,extra={}){pending={kind,releaseNext:true,issuedAt:model.elapsed,beforeSignature:publicRouteSignature(model),beforeClears:model.clears,beforeMistakes:model.mistakes,...extra};note('ordinary-input',{elapsed:model.elapsed,kind,keys});return keys}
 function pilot(state,options={}){
  if(state.phase!=='playing'||state.paused)return[];
  const m=state.model;if(lastElapsed!==null&&m.elapsed<lastElapsed)reset();lastElapsed=m.elapsed;
  if(stage===null){record=options.mode==='record';stage=record&&m.path.length===1&&m.mistakes===0?'trial':'solution';due=m.elapsed+(record?2.5:1.5);note('observed-round',{elapsed:m.elapsed,level:m.level,stage});}
  if(pending){
   if(pending.releaseNext){pending.releaseNext=false;neutralTick=m.tick;return[]}
   if(m.tick<=neutralTick)return[];
   if(pending.kind==='move'){
    const expected=pending.expected;
    if(equal(m.path.map(item=>item.cellId),expected.pathIds)){
     for(const key of['symbols','conditionHits','conditionSkips','routeStatus','mistakes','prefixLength','sequenceMatches'])if(!equal(m[key],expected[key]))throw new Error('Actual ordinary move disagrees with independent public prediction: '+key);
     note('observed-move',{elapsed:m.elapsed,cellId:m.player.cellId,enteredFrom:m.player.enteredFrom,emitted:expected.emitted,conditionalResult:expected.conditionalResult});pending=null;due=m.elapsed+(stage==='trial'?.7:record?1.05:1.25);
    }else if(publicRouteSignature(m)!==pending.beforeSignature){note('observed-repeat-replan',{elapsed:m.elapsed,cellId:m.player.cellId,pathLength:m.path.length});pending=null;due=m.elapsed+.3}
    else if(m.elapsed-pending.issuedAt>1){note('unobserved-input-retry',{elapsed:m.elapsed,kind:pending.kind});pending=null;due=m.elapsed+.2}
    else return[];
   }else if(pending.kind==='clear'){
    if(m.clears===pending.beforeClears+1){
     if(m.path.length!==1||m.player.cellId!==m.start.id||m.symbols.length||m.emissions.length||m.visited.filter(Boolean).length!==1||m.mistakes!==pending.beforeMistakes||m.rejection!==null||m.routeStatus!=='drawing')throw new Error('B did not restore the complete route without refunding failures');
     note('observed-clear',{elapsed:m.elapsed,clears:m.clears,mistakes:m.mistakes,path:m.path.map(item=>item.cellId),symbols:[...m.symbols]});pending=null;stage='solution';due=m.elapsed+3.2;
    }else if(m.clears!==pending.beforeClears)throw new Error('Unexpected repeated clear');
    else if(m.elapsed-pending.issuedAt>1){pending=null;due=m.elapsed+.2}else return[];
   }else if(pending.kind==='submit'){
    if(m.routeStatus==='rejected'){pending=null;stage='rejected';due=m.elapsed+4.5;note('observed-rejection',{elapsed:m.elapsed,mistakes:m.mistakes,rejection:m.rejection});}
    else if(m.elapsed-pending.issuedAt>1){pending=null;due=m.elapsed+.2}else return[];
   }
  }
  if(m.routeStatus==='rejected'&&stage!=='rejected'){stage='rejected';due=m.elapsed+4.5;note('observed-rejection',{elapsed:m.elapsed,mistakes:m.mistakes,rejection:m.rejection});}
  if(m.elapsed<due)return[];
  if(stage==='rejected')return issue(m,'clear',['b']);
  if(m.routeStatus==='at-exit'){
   if(stage==='trial'&&m.sequenceMatches)throw new Error('Trial route unexpectedly matches; never invent a failure');
   if(stage==='solution'&&!m.sequenceMatches){note('wrong-observed-exit-clear',{elapsed:m.elapsed});return issue(m,'clear',['b']);}
   const wait=stage==='trial'?2.2:Math.max(2.2,30-m.elapsed);
   if(!pending&&stage!=='submit-trial'&&stage!=='submit-solution'){stage=stage==='trial'?'submit-trial':'submit-solution';due=m.elapsed+wait;return[]}
  }
  if(stage==='submit-trial'||stage==='submit-solution')return issue(m,'submit',['Space']);
  const plan=planVisibleState(m,{goal:stage==='trial'?'reject':'match'});
  note('public-search',{elapsed:m.elapsed,goal:stage==='trial'?'reject':'match',found:plan.found,expanded:plan.expanded,queued:plan.queued});
  if(!plan.found){if(stage==='solution'&&m.path.length>1){note('no-route-clear',{elapsed:m.elapsed,reason:plan.reason});return issue(m,'clear',['b'])}throw new Error('Public search found no playable route: '+plan.reason)}
  if(!plan.directions.length)throw new Error('Public route search returned no actionable step');
  const direction=plan.directions[0],expected=predictVisibleMove(m,direction);if(!expected.valid)throw new Error('Planned public move is not legal');
  return issue(m,'move',[expected.key],{expected});
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();export function keys(state,options){return defaultPilot(state,options)}

export function assertPublicRoute(model,assert){
 const context=boardContext(model),ids=model.path.map(item=>item.cellId);assert.equal(ids[0],context.start);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.length<=context.cols*context.rows);assert.equal(model.moves,ids.length-1);assert.equal(model.player.cellId,ids.at(-1));
 const symbols=[],emissions=[];let hits=0,skips=0;
 for(let index=0;index<model.path.length;index++){
  const item=model.path[index],cell=context.byId.get(item.cellId);assert.equal(cell.type,'floor');assert.equal(item.col,cell.col);assert.equal(item.row,cell.row);assert.equal(item.x,cell.x);assert.equal(item.y,cell.y);
  if(!index){assert.equal(item.enteredFrom,null);assert.equal(item.emitted,null);continue}
  const before=context.byId.get(ids[index-1]),dir=DIRECTIONS.find(d=>before.col+d.dc===cell.col&&before.row+d.dr===cell.row);assert.ok(dir,'orthogonal actual path');const symbol=emitted(cell,dir.entry);assert.equal(item.enteredFrom,dir.entry);assert.equal(item.emitted,symbol);
  if(cell.rune&&cell.rune.enterFrom!==null){if(symbol===null)skips++;else hits++}
  if(symbol!==null){symbols.push(symbol);emissions.push({cellId:cell.id,symbol,enteredFrom:dir.entry,pathIndex:index})}
 }
 assert.deepEqual(model.symbols,symbols);assert.deepEqual(model.emissions,emissions);assert.equal(model.conditionHits,hits);assert.equal(model.conditionSkips,skips);assert.equal(model.prefixLength,prefix(symbols,context.target));assert.equal(model.sequenceMatches,equal(symbols,context.target));
 for(const cell of model.cells){const index=ids.indexOf(cell.id);assert.equal(model.visited[cell.id],index>=0);assert.equal(cell.visited,index>=0);assert.equal(cell.visitIndex,index<0?null:index)}
 const current=context.byId.get(ids.at(-1));for(const key of['col','row','x','y'])assert.equal(model.player[key],current[key]);assert.equal(model.player.enteredFrom,model.path.at(-1).enteredFrom);
 assert.deepEqual(model.availableMoves,model.phase==='playing'&&model.routeStatus==='drawing'?legal(context,model.player.cellId,occupancy(model)).map(item=>item.dir.letter):[]);
 assert.equal(model.mistakes,model.rejections.length);assert.equal(model.score,model.prefixLength*100+(model.phase==='won'?1000+Math.floor(model.remaining)*5+(model.maxMistakes-model.mistakes)*100:0));
}
export function assertProgress({after,trace},assert){const m=after.model;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.player.cellId,m.exit.id);assert.equal(m.sequenceMatches,true);assert.deepEqual(m.symbols,m.target);assert.equal(m.lostReason,null);assert.ok(m.submissions>=1);assert.ok(m.conditionHits>0);assert.ok(m.conditionSkips>0);assert.ok(m.elapsed>=30&&m.elapsed<90);assertPublicRoute(m,assert);for(const item of trace)assertPublicRoute(item.state.model,assert);}
export function assertRetry({after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.level,initial.model.level);assert.equal(m.routeStatus,'drawing');assert.equal(m.path.length,1);assert.equal(m.player.cellId,m.start.id);assert.equal(m.moves,0);assert.equal(m.totalMoves,0);assert.equal(m.clears,0);assert.equal(m.submissions,0);assert.equal(m.blockedMoves,0);assert.equal(m.mistakes,0);assert.deepEqual(m.rejections,[]);assert.equal(m.rejection,null);assert.equal(m.lastMove,null);assert.equal(m.lostReason,null);assert.ok(m.elapsed<2);for(const key of['grid','start','exit','target','cells','visited','path','symbols','emissions'])assert.deepEqual(m[key],initial.model[key]);assertPublicRoute(m,assert);}
