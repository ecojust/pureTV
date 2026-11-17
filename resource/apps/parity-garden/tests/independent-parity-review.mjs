// Independent integer-grid/XOR oracle. The solver enumerates two halves rather
// than importing the production rules, QA planner or any authored answer.
// Deliberately constructed deadline/last-drop states are labelled fixtures.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),contractUrl=new URL('../docs/model-contract.md',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),modelSha256=hash(await readFile(modelUrl)),contractSha256=hash(await readFile(contractUrl));
const Model=createRequire(import.meta.url)(fileURLToPath(modelUrl)),DT=1/60,clone=structuredClone;
const MODES=['cross','diagonal'],DIR={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},checks=[];
const totals={gardenChecks:0,kernelActions:0,doubleSprays:0,mitmSubsetsEnumerated:0,ordinaryAuthoredWins:0,ordinaryPatternOnlyCounterexamples:0};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
function test(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){Model.step(s,DT,{cancelEpoch:0,...input});}
function press(s,key){const d=DIR[key];tick(s,d?{x:d[0],y:d[1]}:{[key]:true});tick(s);}
function navigate(s,id){assert.ok(Number.isInteger(id)&&id>=0&&id<16);let n=0;while(s.selectedId!==id){assert.ok(n++<8);const c=s.selectedId%4,r=Math.floor(s.selectedId/4);press(s,c<id%4?'E':c>id%4?'W':r<Math.floor(id/4)?'S':'N');}}
function setMode(s,mode){assert.ok(MODES.includes(mode));if(s.nozzle!==mode)press(s,'b');assert.equal(s.nozzle,mode);}
function kernel(id,mode){const x=id%4,y=Math.floor(id/4);return Array.from({length:16},(_,i)=>i).filter(i=>{const dx=Math.abs(i%4-x),dy=Math.abs(Math.floor(i/4)-y);return mode==='cross'?dx+dy<=1:(dx===0&&dy===0)||(dx===1&&dy===1);});}
const flowers=s=>s.cells.map(c=>c.open),counts=s=>s.cells.map(c=>c.directWaterCount);
function verify(s){
  assert.equal(s.cells.length,16);assert.deepEqual(s.cells.map(c=>c.id),Array.from({length:16},(_,i)=>i));assert.equal(s.targetPattern.length,16);
  assert.deepEqual(s.grid,{cols:4,rows:4,x:304,y:100,cellSize:78});assert.deepEqual(s.targetView,{x:72,y:150,cellSize:40});
  const marked=new Set(s.markedIds);assert.equal(marked.size,s.markedIds.length);let matched=0,satisfied=0,direct=0;
  for(const c of s.cells){
    assert.equal(c.col,c.id%4);assert.equal(c.row,Math.floor(c.id/4));assert.equal(c.x,304+(c.col+.5)*78);assert.equal(c.y,100+(c.row+.5)*78);
    assert.equal(typeof c.open,'boolean');assert.equal(typeof c.targetOpen,'boolean');assert.equal(c.targetOpen,s.targetPattern[c.id]);assert.equal(c.requiresEven,marked.has(c.id));
    assert.ok(Number.isSafeInteger(c.directWaterCount)&&c.directWaterCount>=0);direct+=c.directWaterCount;assert.equal(c.directParity,c.directWaterCount%2);
    const condition=!marked.has(c.id)||(c.open&&c.directWaterCount%2===0);assert.equal(c.conditionMet,condition);assert.equal(c.matched,c.open===c.targetOpen);
    if(c.matched)matched++;if(marked.has(c.id)&&condition)satisfied++;
  }
  assert.equal(s.waterUsed,direct);assert.equal(s.waterRemaining,s.waterBudget-direct);assert.ok(s.waterRemaining>=0);
  assert.equal(s.matchedCells,matched);assert.equal(s.patternMatched,matched===16);assert.equal(s.markedCount,marked.size);assert.equal(s.satisfiedMarked,satisfied);assert.equal(s.allMarkedSatisfied,satisfied===marked.size);assert.equal(s.goalMatched,matched===16&&satisfied===marked.size);
  assert.ok(Number.isSafeInteger(s.selectedId)&&s.selectedId>=0&&s.selectedId<16);const cell=s.cells[s.selectedId];assert.deepEqual(s.cursor,{id:cell.id,col:cell.col,row:cell.row,x:cell.x,y:cell.y});
  assert.deepEqual(s.previewIds,kernel(s.selectedId,s.nozzle));assert.deepEqual(s.nozzles.map(n=>n.id),MODES);
  for(const nozzle of s.nozzles){const offsets=nozzle.offsets.map(o=>[o.dx,o.dy]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const expected=(nozzle.id==='cross'?[[0,0],[0,-1],[1,0],[0,1],[-1,0]]:[[0,0],[-1,-1],[1,-1],[1,1],[-1,1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);assert.deepEqual(offsets,expected);}
  near(s.elapsed,s.tick/60);near(s.remaining,Math.max(0,90-s.elapsed));assert.equal(s.timeLimit,90);
  assert.equal(s.score,matched*20+satisfied*40+(s.phase==='won'?1000+s.waterRemaining*100+Math.floor(s.remaining)*5:0));
  if(s.phase==='won'){assert.equal(s.goalMatched,true);assert.equal(s.lostReason,null);}else if(s.phase==='lost'){assert.ok(['water','timeout'].includes(s.lostReason));if(s.lostReason==='water'){assert.equal(s.waterRemaining,0);assert.equal(s.goalMatched,false);}else assert.equal(s.remaining,0);}else assert.equal(s.phase,'playing');
  totals.gardenChecks++;
}
function spray(s,id,mode){
  navigate(s,id);setMode(s,mode);verify(s);assert.equal(s.phase,'playing');const before=clone(s),affected=kernel(id,mode),expected=flowers(s).map((v,i)=>affected.includes(i)?!v:v),expectedCounts=counts(s);expectedCounts[id]++;
  press(s,'a');assert.deepEqual(flowers(s),expected);assert.deepEqual(counts(s),expectedCounts);assert.equal(s.waterUsed,before.waterUsed+1);assert.equal(s.waterRemaining,before.waterRemaining-1);assert.equal(s.totalAffectedToggles,before.totalAffectedToggles+affected.length);
  assert.ok(s.lastWater);assert.equal(s.lastWater.id,s.waterUsed);assert.equal(s.lastWater.cellId,id);assert.equal(s.lastWater.nozzle,mode);assert.deepEqual(s.lastWater.affectedIds,affected);assert.equal(s.lastWater.directBefore,before.cells[id].directWaterCount);assert.equal(s.lastWater.directAfter,expectedCounts[id]);
  assert.deepEqual(s.lastWater.changes,affected.map(cellId=>({cellId,beforeOpen:before.cells[cellId].open,afterOpen:expected[cellId]})));near(s.lastWater.expiresAt-s.lastWater.at,.6);verify(s);
}
function fresh(level){const s=Model.create(410+level,level-1);verify(s);assert.equal(s.waterBudget,4+level*2);assert.equal(s.waterUsed,0);assert.equal(s.nozzle,'cross');assert.equal(s.selectedId,5);assert.equal(s.markedCount,2+2*level);assert.ok(s.markedIds.every(i=>s.targetPattern[i]));assert.equal(s.goalMatched,false);return s;}
function bitPattern(values){return values.reduce((n,v,i)=>v?(n|(1<<i))>>>0:n,0);}
function vectors(s){const marked=new Set(s.markedIds);return MODES.flatMap(mode=>Array.from({length:16},(_,id)=>({id,mode}))).map(a=>({...a,effect:(kernel(a.id,a.mode).reduce((n,i)=>n|(1<<i),0)|(marked.has(a.id)?(1<<(a.id+16)):0))>>>0}));}
function targetEffect(s){return ((bitPattern(flowers(s))^bitPattern(s.targetPattern))|s.markedIds.reduce((n,id)=>s.cells[id].directWaterCount%2?n|(1<<(id+16)):n,0))>>>0;}
function halfTable(columns){
  assert.equal(columns.length,16);const effects=new Uint32Array(65536),cost=new Uint8Array(65536),best=new Map([[0,{mask:0,cost:0}]]);
  for(let mask=1;mask<65536;mask++){const low=mask&-mask,i=31-Math.clz32(low),rest=mask^low;effects[mask]=(effects[rest]^columns[i].effect)>>>0;cost[mask]=cost[rest]+1;const old=best.get(effects[mask]);if(!old||cost[mask]<old.cost)best.set(effects[mask],{mask,cost:cost[mask]});}
  totals.mitmSubsetsEnumerated+=65536;return best;
}
function algebra(s){
  const cols=vectors(s),left=halfTable(cols.slice(0,16)),right=halfTable(cols.slice(16)),goal=targetEffect(s);let combined=null,wrongParity=null;
  const groups=new Map();for(const [effect,row] of left){const key=effect&65535;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({effect,...row});}
  for(const [effect,r] of right){const l=left.get((goal^effect)>>>0);if(l&&(!combined||l.cost+r.cost<combined.cost))combined={cost:l.cost+r.cost,left:l.mask,right:r.mask};
    for(const l of groups.get((goal^effect)&65535)||[]){if(((l.effect^effect^goal)>>>16)!==0&&(!wrongParity||l.cost+r.cost<wrongParity.cost))wrongParity={cost:l.cost+r.cost,left:l.mask,right:r.mask};}}
  const actions=answer=>answer?cols.filter((_,i)=>i<16?answer.left&(1<<i):answer.right&(1<<(i-16))).map(({id,mode})=>({id,mode})):null;
  function rank(rows){const pivots=new Uint32Array(32);let n=0;for(let x of rows){x>>>=0;for(let bit=31;bit>=0&&x;bit--)if((x>>>bit)&1){if(pivots[bit])x=(x^pivots[bit])>>>0;else{pivots[bit]=x;n++;break;}}}return n;}
  return{combined:combined&&{cost:combined.cost,actions:actions(combined)},wrongParity:wrongParity&&{cost:wrongParity.cost,actions:actions(wrongParity)},crossOnlyMinimumDrops:left.get(goal)?.cost??null,diagonalOnlyMinimumDrops:right.get(goal)?.cost??null,patternRank:rank(cols.map(a=>a.effect&65535)),combinedRank:rank(cols.map(a=>a.effect)),halfUniqueEffects:[left.size,right.size]};
}
const analyses=[1,2,3].map(level=>({level,...algebra(fresh(level))}));

test('all32 independent center-distance kernels match ordinary clipped sprays and only the selected direct count increments',()=>{
  for(const mode of MODES)for(let id=0;id<16;id++){const s=fresh(3);spray(s,id,mode);assert.equal(s.phase,'playing');totals.kernelActions++;}
  return{ordinaryKernelActions:32,crossCornerSize:kernel(0,'cross').length,diagonalCornerSize:kernel(0,'diagonal').length};
});
test('same-center same-nozzle double sprays restore flowers and all parities but preserve two real drops and the exact count2',()=>{
  for(const level of [1,2,3])for(const mode of MODES){const s=fresh(level),initial=flowers(s),score=s.score,id=s.markedIds[0];spray(s,id,mode);spray(s,id,mode);assert.deepEqual(flowers(s),initial);assert.deepEqual(counts(s),Array.from({length:16},(_,i)=>i===id?2:0));assert.equal(s.waterUsed,2);assert.equal(s.waterRemaining,s.waterBudget-2);assert.equal(s.score,score);assert.equal(s.phase,'playing');totals.doubleSprays++;}return{ordinaryDoubleSprays:6};
});
test('selection clamps without wrap and free B edges change the actual neighborhood without refunding or repeated toggles',()=>{
  const s=fresh(1);navigate(s,0);press(s,'N');press(s,'W');assert.equal(s.selectedId,0);navigate(s,15);press(s,'S');press(s,'E');assert.equal(s.selectedId,15);
  const before=clone(s);for(let i=0;i<30;i++)tick(s,{b:true});assert.equal(s.nozzle,'diagonal');assert.equal(s.nozzleSwitches,before.nozzleSwitches+1);assert.deepEqual(flowers(s),flowers(before));assert.deepEqual(counts(s),counts(before));assert.equal(s.waterRemaining,before.waterRemaining);assert.notDeepEqual(s.previewIds,kernel(15,'cross'));tick(s);spray(s,15,'diagonal');return{};
});
test('a committed spray retains its actual center/nozzle/changes while the cursor and nozzle subsequently move',()=>{
  const s=fresh(2);spray(s,0,'cross');const event=clone(s.lastWater);press(s,'E');press(s,'b');assert.deepEqual(s.lastWater,event);assert.equal(s.selectedId,1);assert.equal(s.nozzle,'diagonal');for(let i=0;i<40;i++)tick(s);assert.equal(s.lastWater,null);return{};
});
test('fixed-tick input priority and cancellation cannot duplicate, move or replay a cached water action',()=>{
  const s=fresh(1);tick(s);const id=s.selectedId;tick(s,{a:true,b:true,x:1});assert.equal(s.nozzle,'diagonal');assert.equal(s.selectedId,id);assert.equal(s.waterUsed,0);tick(s,{x:1});assert.equal(s.selectedId,id+1);assert.equal(s.waterUsed,0);tick(s);
  Model.step(s,0,{a:true,cancelEpoch:0});assert.equal(s.waterUsed,0);tick(s,{cancelEpoch:1,cancelled:true,a:true});assert.equal(s.waterUsed,0);tick(s,{cancelEpoch:1});assert.equal(s.waterUsed,0);
  tick(s,{cancelEpoch:1,a:true,x:1});assert.equal(s.lastWater.cellId,id+2);assert.equal(s.waterUsed,1);for(let i=0;i<25;i++)tick(s,{cancelEpoch:1,a:true});assert.equal(s.waterUsed,1);verify(s);return{};
});
test('independent MITM discovers ordinary within-budget pattern-only solutions that remain blocked by marked direct parity',()=>{
  const examples=[];for(const a of analyses){assert.ok(a.wrongParity&&a.wrongParity.cost<4+a.level*2);const s=fresh(a.level);for(const x of a.wrongParity.actions)spray(s,x.id,x.mode);assert.equal(s.patternMatched,true);assert.equal(s.allMarkedSatisfied,false);assert.equal(s.goalMatched,false);assert.equal(s.phase,'playing');assert.ok(s.waterRemaining>0);assert.ok(s.cells.some(c=>c.requiresEven&&c.open&&c.directParity===1));totals.ordinaryPatternOnlyCounterexamples++;examples.push({level:a.level,waterUsed:s.waterUsed,waterRemaining:s.waterRemaining,phase:s.phase,patternMatched:s.patternMatched,satisfiedMarked:s.satisfiedMarked,markedCount:s.markedCount,oddMarkedIds:s.cells.filter(c=>c.requiresEven&&c.directParity===1).map(c=>c.id),publicActions:a.wrongParity.actions});}return{examples};
});
test('synthetic last-drop fixtures independently require open AND even and check the complete goal before exhausted water',()=>{
  function fixture(directBefore,selectedOpens){const s=fresh(1),id=s.markedIds[0],affected=new Set(kernel(id,'cross'));s.selectedId=id;s.waterBudget=directBefore+1;s.waterUsed=directBefore;s.waterRemaining=1;for(const c of s.cells){c.targetOpen=true;c.open=affected.has(c.id)?false:true;c.directWaterCount=c.id===id?directBefore:0;}if(!selectedOpens)s.cells[id].open=true;s.targetPattern.fill(true);press(s,'b');press(s,'b');return{s,id};}
  const odd=fixture(0,true);spray(odd.s,odd.id,'cross');assert.equal(odd.s.patternMatched,true);assert.equal(odd.s.cells[odd.id].directParity,1);assert.equal(odd.s.cells[odd.id].conditionMet,false);assert.equal(odd.s.phase,'lost');assert.equal(odd.s.lostReason,'water');
  const even=fixture(1,true);spray(even.s,even.id,'cross');assert.equal(even.s.waterRemaining,0);assert.equal(even.s.cells[even.id].directWaterCount,2);assert.equal(even.s.goalMatched,true);assert.equal(even.s.phase,'won');
  const closed=fixture(1,false);spray(closed.s,closed.id,'cross');assert.equal(closed.s.cells[closed.id].directParity,0);assert.equal(closed.s.cells[closed.id].open,false);assert.equal(closed.s.cells[closed.id].conditionMet,false);assert.equal(closed.s.phase,'lost');return{syntheticFixtures:3,ordinaryPlayClaimed:false};
});
test('synthetic deadline precedes queued A; terminal steps freeze all fields and retry recreates independent zero-count arrays',()=>{
  const s=fresh(1);s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;tick(s,{a:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.waterUsed,0);const terminal=clone(s);for(let i=0;i<30;i++)Model.step(s,.25,{a:true,b:true,x:1,cancelEpoch:7,cancelled:i%2===0});assert.deepEqual(s,terminal);
  const a=fresh(1),b=fresh(1);spray(a,0,'diagonal');assert.equal(b.waterUsed,0);assert.ok(b.cells.every(c=>c.directWaterCount===0));assert.notEqual(a.cells,b.cells);assert.notEqual(a.targetPattern,b.targetPattern);return{syntheticDeadline:true,terminalSteps:30};
});
test('public32-action MITM finds exact minimum4/6/8, independent parity ranks and ordinary last-drop wins after two real demonstration drops',()=>{
  const requiresMixed=a=>[a.crossOnlyMinimumDrops,a.diagonalOnlyMinimumDrops].every(cost=>cost===null||cost>a.combined.cost);assert.ok(analyses.some(requiresMixed),'At least one optimal authored solution must require both modes');
  const solutions=[];for(const a of analyses){assert.equal(a.combined.cost,a.level*2+2);assert.ok(a.combinedRank>a.patternRank);if(requiresMixed(a))assert.equal(new Set(a.combined.actions.map(x=>x.mode)).size,2);const s=fresh(a.level),id=s.markedIds[0];spray(s,id,'diagonal');spray(s,id,'diagonal');for(const x of a.combined.actions)spray(s,x.id,x.mode);assert.equal(s.phase,'won');assert.equal(s.waterUsed,s.waterBudget);assert.equal(s.waterRemaining,0);assert.equal(s.goalMatched,true);assert.ok(s.elapsed>0&&s.elapsed<90);totals.ordinaryAuthoredWins++;const terminal=clone(s);tick(s,{a:true,b:true,x:1});assert.deepEqual(s,terminal);solutions.push({level:a.level,minimumDrops:a.combined.cost,patternRank:a.patternRank,combinedRank:a.combinedRank,crossOnlyMinimumDrops:a.crossOnlyMinimumDrops,diagonalOnlyMinimumDrops:a.diagonalOnlyMinimumDrops,optimalSolutionRequiresBothModes:requiresMixed(a),halfUniqueEffects:a.halfUniqueEffects,publicActions:a.combined.actions,phase:s.phase,elapsed:s.elapsed,score:s.score,waterUsed:s.waterUsed,waterBudget:s.waterBudget,patternMatched:s.patternMatched,allMarkedSatisfied:s.allMarkedSatisfied,demonstrationDrops:2});}return{solutions};
});
test('ordinary sprays commute as XOR plus independent integer count additions, while every action still consumes water',()=>{
  const left=fresh(3),right=fresh(3),actions=[{id:0,mode:'cross'},{id:5,mode:'diagonal'}];for(const a of actions)spray(left,a.id,a.mode);for(const a of actions.slice().reverse())spray(right,a.id,a.mode);assert.deepEqual(flowers(left),flowers(right));assert.deepEqual(counts(left),counts(right));assert.equal(left.waterUsed,2);assert.equal(right.waterUsed,2);assert.equal(left.totalAffectedToggles,right.totalAffectedToggles);return{ordinaryOrdersCompared:2};
});
assert.equal(hash(await readFile(modelUrl)),modelSha256);assert.equal(hash(await readFile(contractUrl)),contractSha256);
const report={kind:'independent-xor-and-direct-parity-review',passed:true,modelSha256,contractSha256,reviewScriptSha256:hash(await readFile(new URL(import.meta.url))),sourceUnchanged:true,checks,totals,
  methodology:'Integer-coordinate distance kernels and direct-count arithmetic checked against ordinary model input. A separate16+16 meet-in-the-middle enumeration minimizes the32 public action columns including independent marked direct parity; no production helper, QA planner or authored answer is imported. Gaussian rank computation summarizes constraints only, not the solution search.',
  scope:{syntheticBoundaryFixtures:true,ordinaryAuthoredModelWins:3,ordinaryPatternOnlyCounterexamples:3,browserExecuted:false,normalGameplayVideoEvidence:false,physicalTvTested:false,physicalPhoneTested:false}};
const args=process.argv.slice(2);if(args.length){assert.equal(args.length,2);assert.equal(args[0],'--output');await writeFile(args[1],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,totals,output:args[1]}));}else console.log(JSON.stringify(report,null,2));
