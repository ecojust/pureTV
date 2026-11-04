// Independent, bounded planning from the fully displayed sheet, palette, creases
// and target. No production model import, hidden history or authored solutions.
export const budgets={maxWebGLDrawCalls:3};
const clone=v=>structuredClone(v);
const publicBoard=m=>m.cells.map(c=>c.layers.slice());
const boardKey=b=>JSON.stringify(b);
function geometryOf(m){return{cells:m.cells.map(c=>({col:c.col,row:c.row,layers:c.layers.slice()})),pieces:m.pieces.map(p=>({id:p.id,pigment:p.pigment,vertices:p.vertices.map(v=>({x:v.x,y:v.y})),face:p.face,movedFolds:p.movedFolds}))}}
export const visibleGeometrySignature=m=>JSON.stringify(geometryOf(m));
function context(m){
 const palette=new Map(m.palette.map(p=>[p.id,p.rgb.slice()])),pigments=new Map(m.pieces.map(p=>[p.id,palette.get(p.pigment)]));
 if(m.grid.cols!==4||m.grid.rows!==4||m.layerAlpha!==.5)throw new Error('Unsupported public glass geometry');
 return{cols:m.grid.cols,rows:m.grid.rows,pigments,substrate:m.substrateColor.slice(),candidates:m.candidates.map(c=>({id:c.id,axis:c.axis,at:c.at,movingSide:c.movingSide,selectorRow:c.selectorRow,selectorCol:c.selectorCol})),target:new Map(m.target.cells.map(c=>[c.row*m.grid.cols+c.col,c.color.slice()]))};
}
function color(ctx,stack){if(!stack.length)return null;let n=ctx.substrate.slice(),d=1;for(const id of stack){const rgb=ctx.pigments.get(id);if(!rgb)throw new Error('Unknown public pigment');n=n.map((x,k)=>x+rgb[k]*d);d*=2}return n.map(x=>Math.floor(x/d+.5))}
function matches(ctx,board){for(let i=0;i<board.length;i++){const target=ctx.target.get(i);if(Boolean(board[i].length)!==Boolean(target))return false;if(target){const rgb=color(ctx,board[i]);if(rgb.some((v,k)=>v!==target[k]))return false}}return true}
function foldBoard(ctx,board,c){
 const moving=[],stationary=[];
 for(let i=0;i<board.length;i++){if(!board[i].length)continue;const v=c.axis==='x'?i%ctx.cols:Math.floor(i/ctx.cols),moves=c.movingSide==='low'?v<c.at:v>=c.at;(moves?moving:stationary).push(i)}
 if(!moving.length||!stationary.length)return null;
 const destinations=[];
 for(const i of moving){let col=i%ctx.cols,row=Math.floor(i/ctx.cols);if(c.axis==='x')col=2*c.at-1-col;else row=2*c.at-1-row;if(col<0||col>=ctx.cols||row<0||row>=ctx.rows)return null;destinations.push(row*ctx.cols+col)}
 const result=board.map(x=>x.slice());for(const i of moving)result[i]=[];
 for(let n=0;n<moving.length;n++)result[destinations[n]].push(...board[moving[n]].slice().reverse());
 return{board:result,movingIds:new Set(moving.flatMap(i=>board[i]))};
}
export function predictVisibleFold(m,candidateId=m.selectedId){
 const ctx=context(m),c=ctx.candidates.find(c=>c.id===candidateId);if(!c)throw new Error('Unknown public crease');const result=foldBoard(ctx,publicBoard(m),c);if(!result)return{valid:false,signature:visibleGeometrySignature(m),foldsUsed:m.foldsUsed};
 const pieces=m.pieces.map(p=>{const moved=result.movingIds.has(p.id);return{id:p.id,pigment:p.pigment,vertices:p.vertices.map(v=>({x:moved&&c.axis==='x'?2*c.at-v.x:v.x,y:moved&&c.axis==='y'?2*c.at-v.y:v.y})),face:moved?-p.face:p.face,movedFolds:p.movedFolds+Number(moved)}});
 const cells=result.board.map((layers,i)=>({col:i%ctx.cols,row:Math.floor(i/ctx.cols),layers,depth:layers.length,color:color(ctx,layers),reverseColor:color(ctx,layers.slice().reverse())}));
 const state={cells,pieces};return{valid:true,signature:visibleGeometrySignature(state),cells,pieces,foldsUsed:m.foldsUsed+1,targetMatched:matches(ctx,result.board),movingPieceIds:[...result.movingIds]};
}
function search(ctx,start,remaining,{maxExpanded=50000,maxQueued=100000,maxMilliseconds=2000,deadline=Infinity}={}){
 const began=performance.now(),queue=[{board:start,path:[]}],seen=new Set(['0:'+boardKey(start)]);let head=0,expanded=0;
 const check=()=>{const now=performance.now();if(now-began>maxMilliseconds||now>deadline)throw new Error('Public-fold planner time cap exceeded')};
 while(head<queue.length){check();const node=queue[head++],depth=node.path.length;
  if(depth===remaining){if(matches(ctx,node.board))return{folds:node.path,expanded,queued:queue.length,milliseconds:performance.now()-began};continue}
  if(++expanded>maxExpanded)throw new Error('Public-fold planner expansion cap exceeded');
  for(const c of ctx.candidates){check();const next=foldBoard(ctx,node.board,c);if(!next)continue;const key=(depth+1)+':'+boardKey(next.board);if(seen.has(key))continue;if(queue.length>=maxQueued)throw new Error('Public-fold planner queue cap exceeded');seen.add(key);queue.push({board:next.board,path:[...node.path,c.id]})}
 }
 return null;
}
export function planVisibleState(m,limits){const result=search(context(m),publicBoard(m),m.foldLimit-m.foldsUsed,limits);if(!result)throw new Error('No public-target solution within the remaining fold budget');return result}
function demonstrationCrease(m,first,deadline){
 const ctx=context(m),board=publicBoard(m);let fallback=null;
 for(const c of ctx.candidates){if(c.id===first)continue;const predicted=foldBoard(ctx,board,c);if(!predicted||matches(ctx,predicted.board))continue;if(!fallback)fallback=c.id;const continuation=search(ctx,predicted.board,m.foldLimit-m.foldsUsed-1,{maxExpanded:20000,maxQueued:40000,maxMilliseconds:500,deadline});if(!continuation)return{id:c.id,reason:'public-target-unreachable-with-remaining-folds'}}
 return fallback?{id:fallback,reason:'alternate-public-crease-trial'}:null;
}
export function createPilot(){
 let level,modeSeen,previousElapsed=-1,stage='plan',plan=[],target=null,previewAt=null,releaseNext=false,expected=null,before=null,actionAt=0,nextAt=0,kind='solve';const diagnostics=[];
 function choose(m,mode){const deadline=performance.now()+2000,result=planVisibleState(m,{deadline});plan=result.folds;diagnostics.push({kind:'public-plan',elapsed:m.elapsed,...result});if(mode==='record'){const trial=demonstrationCrease(m,plan[0],deadline);if(trial){target=trial.id;kind='trial';diagnostics.push({kind:'planned-visible-trial',elapsed:m.elapsed,...trial});stage='select';return}}target=plan[0];kind='solve';stage='select'}
 return Object.assign(function pilot(snapshot,{mode='qa'}={}){
  const m=snapshot?.model;if(!m||snapshot.phase!=='playing'||m.phase!=='playing')return[];
  if(level!==m.level||modeSeen!==mode||m.elapsed+.001<previousElapsed){level=m.level;modeSeen=mode;stage='plan';plan=[];target=null;previewAt=null;releaseNext=false;expected=null;before=null;nextAt=0;diagnostics.length=0}previousElapsed=m.elapsed;
  if(snapshot.paused)return[];
  if(releaseNext){releaseNext=false;return[]}
  if(stage==='plan')choose(m,mode);
  if(stage==='await-fold'){
   if(m.foldsUsed===before.foldsUsed+1){if(visibleGeometrySignature(m)!==expected.signature)throw new Error('Observed fold geometry differs from the independent public predictor');if(m.mode==='folding')return[];diagnostics.push({kind:'observed-fold',candidateId:target,elapsed:m.elapsed,foldsUsed:m.foldsUsed,trial:kind==='trial'});if(kind==='trial'){stage='trial-shown';nextAt=m.elapsed+3;return[]}plan.shift();if(!plan.length)throw new Error('Planned complete public target was not accepted');target=plan[0];previewAt=null;stage='select'}
   else{if(m.foldsUsed!==before.foldsUsed||visibleGeometrySignature(m)!==before.signature)throw new Error('Unexpected observed board change while waiting for a fold edge');if(m.elapsed-actionAt>1){stage='select';previewAt=null;diagnostics.push({kind:'fold-edge-not-observed-retry',elapsed:m.elapsed})}return[]}
  }
  if(stage==='trial-shown'){if(m.elapsed<nextAt||m.mode==='folding')return[];if(!m.canUndo)throw new Error('Observed trial has no ordinary undo');stage='await-undo';actionAt=m.elapsed;releaseNext=true;return['b']}
  if(stage==='await-undo'){
   if(m.undoCount>before.undoCount){if(m.foldsUsed!==before.foldsUsed||visibleGeometrySignature(m)!==before.signature||m.selectedId!==before.selectedId)throw new Error('Ordinary B did not restore the observed pre-fold design');diagnostics.push({kind:'observed-trial-restored',elapsed:m.elapsed,undoCount:m.undoCount});stage='restored';nextAt=m.elapsed+2.2;return[]}
   if(m.elapsed-actionAt>1)throw new Error('Ordinary undo edge was not observed');return[];
  }
  if(stage==='restored'){if(m.elapsed<nextAt)return[];const result=planVisibleState(m);plan=result.folds;target=plan[0];kind='solve';previewAt=null;stage='select';diagnostics.push({kind:'public-repair-plan',elapsed:m.elapsed,...result})}
  if(stage!=='select'||m.mode==='folding')return[];
  if(m.mode==='review')throw new Error('Public plan unexpectedly reached a mismatched review');
  const desired=m.candidates.find(c=>c.id===target),selected=m.candidates[m.selectedIndex];if(!desired||!selected)throw new Error('Missing public crease selection');
  if(m.selectedId!==target){previewAt=null;const key=selected.selectorRow<desired.selectorRow?'ArrowDown':selected.selectorRow>desired.selectorRow?'ArrowUp':selected.selectorCol<desired.selectorCol?'ArrowRight':'ArrowLeft';releaseNext=true;return[key]}
  if(previewAt===null)previewAt=m.elapsed;
  const preview=kind==='trial'?3:mode==='record'?4:8;
  if(m.elapsed<previewAt+preview||kind==='solve'&&plan.length===1&&m.elapsed<(mode==='record'?32:30))return[];
  expected=predictVisibleFold(m,target);if(!expected.valid)throw new Error('Public planner selected an invalid fold');before={signature:visibleGeometrySignature(m),foldsUsed:m.foldsUsed,undoCount:m.undoCount,selectedId:m.selectedId};actionAt=m.elapsed;stage='await-fold';releaseNext=true;return['Space'];
 },{diagnostics:()=>clone(diagnostics)});
}
const defaultPilot=createPilot();let recordWonAt=null,transitionRelease=false;
export const keys=(snapshot,options={})=>{
 if(options.mode==='record'&&snapshot?.phase==='won'&&snapshot.model.level<6){
  if(recordWonAt===null)recordWonAt=options.elapsed;
  if(transitionRelease){transitionRelease=false;return[];}
  if(options.elapsed-recordWonAt<2.5)return[];
  transitionRelease=true;return[snapshot.level===snapshot.model.level?'Enter':'ArrowRight'];
 }
 if(snapshot?.phase==='playing'){recordWonAt=null;transitionRelease=false;}
 return defaultPilot(snapshot,options);
};
const samples=(before,after,trace)=>[before,...(trace||[]).map(x=>x.state||x.snapshot||x),after].filter(x=>x?.model);
export function assertProgress({before,after,trace},assert){
 const list=samples(before,after,trace),m=after.model,materialCount=before.model.pieces.length;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.level,before.model.level);assert.equal(m.foldsUsed,m.foldLimit);assert.equal(m.foldsRemaining,0);assert.equal(m.targetMatched,true);assert.equal(m.outlineMatches,true);assert.equal(m.matchedCells,m.target.occupiedCount);assert.equal(m.lostReason,null);assert.ok(m.elapsed>=30&&m.elapsed<90);assert.equal(m.lastReview.matched,true);
 assert.ok(list.some(s=>s.model.mode==='folding'&&s.model.foldAnimation),'a real public fold animation must be observed');assert.ok(list.some(s=>s.model.pieces.some(p=>p.face===-1)),'a physical reflection must flip piece faces');
 for(const{model:x}of list){const ctx=context(x);assert.equal(x.pieces.length,materialCount);assert.equal(x.materialArea,materialCount);const ids=x.cells.flatMap(c=>c.layers);assert.equal(ids.length,materialCount);assert.equal(new Set(ids).size,materialCount);assert.equal(x.foldsRemaining,x.foldLimit-x.foldsUsed);assert.equal(x.historyDepth,x.foldsUsed);assert.equal(x.canUndo,x.phase==='playing'&&x.mode!=='folding'&&x.historyDepth>0);assert.equal(x.foldCount-x.undoCount,x.foldsUsed);assert.ok(x.mismatches>=0&&x.mismatches<=x.maxMismatches);assert.ok(Math.abs(x.elapsed-x.tick/60)<1e-7);assert.ok(Math.abs(x.remaining-(90-x.elapsed))<1e-7);
  for(const cell of x.cells){assert.equal(cell.depth,cell.layers.length);assert.deepEqual(cell.color,color(ctx,cell.layers));assert.deepEqual(cell.reverseColor,color(ctx,cell.layers.slice().reverse()));for(const id of cell.layers){const piece=x.pieces.find(p=>p.id===id);assert.ok(piece);assert.equal(Math.min(...piece.vertices.map(v=>v.x)),cell.col);assert.equal(Math.max(...piece.vertices.map(v=>v.x)),cell.col+1);assert.equal(Math.min(...piece.vertices.map(v=>v.y)),cell.row);assert.equal(Math.max(...piece.vertices.map(v=>v.y)),cell.row+1);assert.ok(piece.vertices.every(v=>Number.isInteger(v.x)&&Number.isInteger(v.y)));assert.equal(Math.abs(piece.face),1)}}
  assert.equal(x.targetMatched,matches(ctx,publicBoard(x)));const bonus=x.phase==='won'?1000+Math.floor(x.remaining)*5+(x.maxMismatches-x.mismatches)*100:0;assert.equal(x.score,x.matchedCells*100+bonus);
 }
}
export function assertRetry({before,after,initial},assert){const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.level,before.model.level);assert.ok(m.elapsed<.5&&m.elapsed<before.model.elapsed);assert.equal(m.mode,'editing');assert.equal(m.foldAnimation,null);assert.equal(m.lastReview,null);assert.equal(m.foldsRemaining,m.foldLimit);assert.equal(m.canUndo,false);for(const k of['foldsUsed','foldCount','undoCount','mismatches','reviewCount','invalidFolds','historyDepth'])assert.equal(m[k],0,k+' resets');assert.equal(m.lostReason,null);assert.ok(m.pieces.every(p=>p.face===1&&p.movedFolds===0));if(initial?.model)assert.equal(visibleGeometrySignature(m),visibleGeometrySignature(initial.model))}
