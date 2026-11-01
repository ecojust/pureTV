// Independent public-board search and rule oracle. Constructed boundary states
// below are explicitly synthetic; only the final three rounds begin from an
// untouched authored model and use ordinary input throughout.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),contractUrl=new URL('../docs/model-contract.md',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),modelSha256=hash(await readFile(modelUrl)),contractSha256=hash(await readFile(contractUrl));
const Model=createRequire(import.meta.url)(fileURLToPath(modelUrl)),DT=1/60,clone=structuredClone;
const directions={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},opposite={N:'S',E:'W',S:'N',W:'E'};
const checks=[],totals={directionalBoundaryCases:0,exitSequenceCases:0,searchExpanded:0,ordinaryAuthoredWins:0,ordinaryMovesVerified:0};
function test(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){Model.step(s,DT,{cancelEpoch:0,...input});}
function press(s,key){const d=directions[key];tick(s,d?{x:d[0],y:d[1]}:{[key]:true});tick(s);}
function prefix(symbols,target){let n=0;while(n<symbols.length&&n<target.length&&symbols[n]===target[n])n++;return n;}
function boardOf(s){return{cols:s.grid.cols,rows:s.grid.rows,start:s.start.id,exit:s.exit.id,target:[...s.target],cells:s.cells.map(c=>({id:c.id,col:c.col,row:c.row,type:c.type,rune:clone(c.rune)}))};}
function options(board,id,mask){const c=board.cells[id];return Object.keys(directions).filter(k=>{const [dc,dr]=directions[k],col=c.col+dc,row=c.row+dr;if(col<0||row<0||col>=board.cols||row>=board.rows)return false;const n=row*board.cols+col;return board.cells[n].type==='floor'&&!(mask&(1<<n));});}
function initial(board){return{id:board.start,mask:1<<board.start,path:[board.start],symbols:[],emissions:[],hits:0,skips:0,moves:[],rejected:false};}
function advance(board,current,key){
  if(current.rejected||current.id===board.exit||!options(board,current.id,current.mask).includes(key))return null;
  const [dc,dr]=directions[key],from=board.cells[current.id],id=(from.row+dr)*board.cols+from.col+dc,c=board.cells[id],enteredFrom=opposite[key];
  const conditional=c.rune?.enterFrom!==null&&c.rune?.enterFrom!==undefined,active=Boolean(c.rune&&(!conditional||c.rune.enterFrom===enteredFrom));
  const n={id,mask:current.mask|(1<<id),path:[...current.path,id],symbols:active?[...current.symbols,c.rune.symbol]:[...current.symbols],
    emissions:active?[...current.emissions,{cellId:id,symbol:c.rune.symbol,enteredFrom,pathIndex:current.path.length}]:clone(current.emissions),
    hits:current.hits+Number(conditional&&active),skips:current.skips+Number(conditional&&!active),moves:[...current.moves,key],enteredFrom,emitted:active?c.rune.symbol:null,rejected:false};
  n.rejected=id!==board.exit&&options(board,id,n.mask).length===0;return n;
}
function solve(board){
  // Append-only output makes a mismatching prefix irreparable until CLEAR.
  // Search never consults model helpers, private state, level number or routes.
  const original=JSON.stringify(board),queue=[initial(board)],seen=new Set();let head=0,maxQueue=1;
  while(head<queue.length){
    assert.ok(head<250000&&queue.length<=500000,'Independent BFS exceeded bounded public search');
    const n=queue[head++];
    if(n.id===board.exit){if(n.symbols.length===board.target.length&&prefix(n.symbols,board.target)===board.target.length&&n.hits>0&&n.skips>0){assert.equal(JSON.stringify(board),original);totals.searchExpanded+=head;return{...n,expanded:head,maxQueue};}continue;}
    for(const key of Object.keys(directions)){
      const next=advance(board,n,key);if(!next||next.rejected||prefix(next.symbols,board.target)!==next.symbols.length)continue;
      const sig=[next.id,next.mask,next.symbols.length,Number(next.hits>0),Number(next.skips>0)].join(':');if(seen.has(sig))continue;seen.add(sig);queue.push(next);
    }
    maxQueue=Math.max(maxQueue,queue.length-head);
  }
  assert.fail('No public-board route with both active and skipped conditional entries');
}
function position(s,id){const c=s.cells[id];return{id,col:c.col,row:c.row,x:c.x,y:c.y};}
function fixture({start=12,exit=24,target=['N'],floors=null}={}){
  const s=Model.create(1701,0);
  for(const c of s.cells){c.type=!floors||floors.includes(c.id)?'floor':'wall';c.role=c.id===start?'start':c.id===exit?'exit':null;c.rune=null;c.visited=c.id===start;c.visitIndex=c.id===start?0:null;}
  s.start=position(s,start);s.exit=position(s,exit);s.player={cellId:start,col:s.start.col,row:s.start.row,x:s.start.x,y:s.start.y,enteredFrom:null};
  s.path=[{...s.player,emitted:null}];s.visited=s.cells.map(c=>c.id===start);s.symbols=[];s.emissions=[];s.target=[...target];
  s.conditionHits=s.conditionSkips=s.moves=s.totalMoves=s.clears=s.submissions=s.blockedMoves=s.mistakes=s.prefixLength=s.score=0;
  s.sequenceMatches=target.length===0;s.routeStatus='drawing';s.phase='playing';s.rejections=[];s.rejection=s.lastMove=null;s.lostReason=null;
  return s;
}
function assertRoute(s,board,n){
  assert.equal(s.player.cellId,n.id);assert.deepEqual(s.path.map(p=>p.cellId),n.path);assert.deepEqual(s.symbols,n.symbols);assert.deepEqual(s.emissions,n.emissions);
  assert.equal(s.moves,n.path.length-1);assert.equal(s.conditionHits,n.hits);assert.equal(s.conditionSkips,n.skips);
  for(let id=0;id<board.cells.length;id++){const index=n.path.indexOf(id);assert.equal(s.visited[id],index!==-1);assert.equal(s.cells[id].visited,index!==-1);assert.equal(s.cells[id].visitIndex,index<0?null:index);}
  assert.equal(s.prefixLength,prefix(n.symbols,board.target));assert.equal(s.sequenceMatches,n.symbols.length===board.target.length&&prefix(n.symbols,board.target)===board.target.length);
}

test('entry side is opposite travel; a wrong conditional entry remains consumed without output',()=>{
  for(const [key,[dc,dr]] of Object.entries(directions))for(const matching of [true,false]){
    const s=fixture(),id=(2+dr)*5+2+dc;s.cells[id].rune={symbol:'N',enterFrom:matching?opposite[key]:key};const b=boardOf(s),next=advance(b,initial(b),key);press(s,key);assertRoute(s,b,next);
    assert.equal(s.player.enteredFrom,opposite[key]);assert.equal(s.lastMove.conditionalResult,matching?'active':'skipped');assert.equal(s.lastMove.emitted,matching?'N':null);totals.directionalBoundaryCases++;
  }
  const s=fixture();s.cells[12].rune={symbol:'S',enterFrom:null};tick(s);assert.deepEqual(s.symbols,[]);press(s,'E');press(s,'W');assert.deepEqual(s.path.map(p=>p.cellId),[12,13]);assert.deepEqual(s.symbols,[]);assert.equal(s.mistakes,0);
  return{cases:8,startDoesNotEmit:true,wrongEntryDoesNotSubstitute:true,returnCannotHarvestVisitedRune:true};
});
test('walls, exterior and visited cells cannot extend path or farm prefix score',()=>{
  const s=fixture({start:0,exit:24});s.cells[1].type='wall';s.cells[5].rune={symbol:'N',enterFrom:null};press(s,'N');press(s,'W');press(s,'E');assert.equal(s.path.length,1);assert.equal(s.mistakes,0);
  press(s,'S');assert.equal(s.score,100);const path=clone(s.path),symbols=clone(s.symbols);for(let i=0;i<60;i++)tick(s,{y:-1});assert.deepEqual(s.path,path);assert.deepEqual(s.symbols,symbols);assert.equal(s.score,100);assert.equal(s.mistakes,0);
  return{blockedDirectionsDoNotReject:true,heldVisitedDirectionDoesNotDuplicate:true};
});
test('exit arrival is explicit-submit locked; incomplete, extra and reordered strings never win',()=>{
  const cases=[];
  for(const [name,target] of [['exact',['N','E']],['early',['N','E','S']],['extra',['N']],['wrong-order',['E','N']]]){
    const s=fixture({start:0,exit:2,target});s.cells[1].rune={symbol:'N',enterFrom:null};s.cells[2].rune={symbol:'E',enterFrom:null};press(s,'E');press(s,'E');
    assert.equal(s.routeStatus,'at-exit');assert.equal(s.phase,'playing');assert.equal(s.mistakes,0);const p=clone(s.path);press(s,'S');assert.deepEqual(s.path,p);assert.deepEqual(s.availableMoves,[]);press(s,'a');
    assert.equal(s.phase,name==='exact'?'won':'playing');assert.equal(s.mistakes,name==='exact'?0:1);assert.equal(s.routeStatus,name==='exact'?'at-exit':'rejected');cases.push({name,phase:s.phase,mistakes:s.mistakes});totals.exitSequenceCases++;
  }
  const s=fixture();press(s,'a');assert.equal(s.submissions,0);assert.equal(s.mistakes,0);assert.equal(s.path.length,1);return{cases,submitElsewhereNoOp:true};
});
test('wrong prefixes remain traversable and a 24-symbol route cannot pass a shorter target',()=>{
  const wrong=fixture({start:0,exit:24,target:['N']});wrong.cells[1].rune={symbol:'E',enterFrom:null};press(wrong,'E');assert.equal(wrong.routeStatus,'drawing');assert.equal(wrong.mistakes,0);assert.ok(wrong.availableMoves.length>0);press(wrong,'E');assert.equal(wrong.player.cellId,2);
  const s=fixture({start:0,exit:24,target:Array(6).fill('N')});for(const c of s.cells)if(c.id!==0)c.rune={symbol:'N',enterFrom:null};
  const route=[];for(let row=0;row<5;row++){route.push(...Array(4).fill(row%2?'W':'E'));if(row<4)route.push('S');}for(const key of route)press(s,key);
  assert.equal(s.path.length,25);assert.equal(s.symbols.length,24);assert.equal(s.prefixLength,6);assert.equal(s.sequenceMatches,false);assert.equal(s.routeStatus,'at-exit');assert.equal(s.mistakes,0);
  press(s,'a');assert.equal(s.phase,'playing');assert.equal(s.routeStatus,'rejected');assert.equal(s.mistakes,1);assert.equal(s.rejections[0].symbols.length,24);
  const ledger=clone(s.rejections);press(s,'b');assert.deepEqual(s.rejections,ledger);assert.deepEqual(s.symbols,[]);assert.equal(s.score,0);
  return{nonmatchingPrefixDoesNotAutoReject:true,actualEmittedSymbols:24,targetLength:6,oldFullSymbolHistorySurvivesClear:true};
});
test('a non-exit dead end rejects once and preserves the failed route until whole clear',()=>{
  const s=fixture({start:0,exit:24,floors:[0,1,24]});press(s,'E');assert.equal(s.routeStatus,'rejected');assert.equal(s.mistakes,1);assert.equal(s.rejection.reason,'dead-end');
  const path=clone(s.path),ledger=clone(s.rejections);for(let i=0;i<90;i++)tick(s,{a:true,aPressed:i%7===0,x:1});const before=s.tick;Model.step(s,.5,{a:true,aPressed:true,x:1,cancelEpoch:0});assert.ok(s.tick>before);assert.equal(s.mistakes,1);assert.deepEqual(s.path,path);assert.deepEqual(s.rejections,ledger);
  assert.deepEqual(s.rejections[0].path,[0,1]);assert.deepEqual(s.rejections[0].symbols,[]);assert.equal(s.rejections[0].attempt,1);return{repeatedFrames:90,requestedDtSeconds:.5,actualAdditionalTicks:s.tick-before,singleRejection:true,preservedLedger:true};
});
test('CLEAR resets route occupancy and score but never clock, failures or total counters',()=>{
  const s=fixture({start:0,exit:2,target:['N','E']});s.cells[1].rune={symbol:'N',enterFrom:'W'};s.cells[2].rune={symbol:'S',enterFrom:'N'};press(s,'E');press(s,'E');press(s,'a');
  assert.equal(s.conditionHits,1);assert.equal(s.conditionSkips,1);assert.notStrictEqual(s.rejections[0].symbols,s.symbols);assert.notStrictEqual(s.rejections[0].path,s.path);
  const before=clone(s);press(s,'b');assert.ok(s.elapsed>before.elapsed);assert.equal(s.mistakes,1);assert.deepEqual(s.rejections,before.rejections);assert.equal(s.submissions,before.submissions);assert.equal(s.totalMoves,before.totalMoves);assert.equal(s.clears,before.clears+1);
  assertRoute(s,boardOf(s),initial(boardOf(s)));assert.equal(s.routeStatus,'drawing');assert.equal(s.score,0);assert.equal(s.rejection,null);assert.equal(s.lastMove,null);
  s.path[0].col=99;assert.equal(s.rejections[0].path[0],0);return{entireRouteRestored:true,noTimeOrFailureRefund:true,historyDoesNotAliasCurrentPath:true};
});
test('third wrong exit attempt loses once and terminal steps freeze every field',()=>{
  const s=fixture({start:0,exit:1,target:['N']});for(let n=1;n<=3;n++){press(s,'E');press(s,'a');assert.equal(s.mistakes,n);assert.equal(s.rejections.length,n);if(n<3)press(s,'b');}
  assert.equal(s.phase,'lost');assert.equal(s.lostReason,'mistakes');const frozen=clone(s);for(let i=0;i<120;i++)tick(s,{x:1,a:true,aPressed:true,b:true,bPressed:true,cancelEpoch:3});assert.deepEqual(s,frozen);
  return{rejections:3,terminalFramesFrozen:120};
});
test('deadline precedes a correct exit submit and route inspection consumes active time',()=>{
  const s=fixture({start:0,exit:1,target:['N']});s.cells[1].rune={symbol:'N',enterFrom:null};press(s,'E');assert.equal(s.sequenceMatches,true);s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;tick(s,{a:true,aPressed:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.submissions,0);
  const frozen=clone(s);tick(s,{b:true});assert.deepEqual(s,frozen);
  const rejected=fixture({start:0,exit:24,floors:[0,1,24]});press(rejected,'E');const t=rejected.tick;for(let i=0;i<60;i++)tick(rejected);assert.equal(rejected.tick,t+60);assert.equal(rejected.mistakes,1);
  return{expiryWinsPriority:true,rejectedInspectionClockContinues:true};
});
test('one atomic action per tick, held edges, cancellation and movement cadence are real',()=>{
  const s=fixture();tick(s,{x:1,a:true,aPressed:true});assert.equal(s.player.cellId,12);tick(s,{x:1});assert.equal(s.player.cellId,13);
  tick(s,{b:true,bPressed:true,a:true,aPressed:true,x:1});assert.equal(s.player.cellId,12);assert.equal(s.clears,1);assert.equal(s.submissions,0);tick(s);assert.equal(s.submissions,0);
  for(let i=0;i<20;i++)tick(s,{b:true});assert.equal(s.clears,2);tick(s);tick(s,{b:true});assert.equal(s.clears,3);
  const held=fixture({start:0,exit:24});tick(held,{x:1});assert.equal(held.player.cellId,1);for(let i=0;i<19;i++)tick(held,{x:1});assert.equal(held.player.cellId,1);tick(held,{x:1});assert.equal(held.player.cellId,2);for(let i=0;i<10;i++)tick(held,{x:1});assert.equal(held.player.cellId,3);
  const cancelled=fixture();tick(cancelled,{b:true,bPressed:true,x:1,cancelled:true,cancelEpoch:1});tick(cancelled);assert.equal(cancelled.clears,0);assert.equal(cancelled.path.length,1);
  const pending=fixture();press(pending,'E');const startTick=pending.tick;Model.step(pending,0,{b:true,bPressed:true,cancelEpoch:0});assert.equal(pending.tick,startTick);assert.equal(pending.clears,0);assert.equal(pending.path.length,2);tick(pending);assert.equal(pending.clears,1);assert.equal(pending.path.length,1);
  press(pending,'E');Model.step(pending,0,{b:true,bPressed:true,cancelEpoch:0});Model.step(pending,0,{cancelled:true,cancelEpoch:1});tick(pending,{cancelEpoch:1});assert.equal(pending.clears,1);assert.equal(pending.path.length,2);
  return{deadlineThenClearThenSubmitThenMove:true,firstHeldRepeatTicks:20,laterRepeatTicks:10,cancelDoesNotQueueAction:true,zeroDtCachesWithoutActingAndCancellationDiscards:true};
});
test('independent public-board BFS solves all three authored rounds with exact per-entry evidence',()=>{
  const solutions=[];
  for(let difficulty=0;difficulty<3;difficulty++){
    const s=Model.create(713,difficulty),original=clone(s),board=boardOf(s),solution=solve(board);assert.deepEqual(s,original);let oracle=initial(board);
    for(const key of solution.moves){oracle=advance(board,oracle,key);press(s,key);assertRoute(s,board,oracle);assert.equal(s.phase,'playing');assert.equal(s.mistakes,0);totals.ordinaryMovesVerified++;
      // One second of genuine neutral model time between observed moves.
      for(let i=0;i<60;i++)tick(s);
    }
    assert.equal(s.routeStatus,'at-exit');assert.equal(s.sequenceMatches,true);assert.ok(s.conditionHits>0&&s.conditionSkips>0);press(s,'a');assert.equal(s.phase,'won');assert.equal(s.mistakes,0);
    assert.equal(s.score,s.target.length*100+1000+Math.floor(s.remaining)*5+300);const terminal=clone(s);tick(s,{b:true,x:1});assert.deepEqual(s,terminal);
    const fresh=Model.create(713,difficulty);assert.deepEqual(fresh,original);assert.notStrictEqual(fresh.cells[0],s.cells[0]);
    solutions.push({level:s.level,phase:s.phase,moves:[...solution.moves],cellPath:[...solution.path],symbols:[...s.symbols],target:[...s.target],conditionHits:s.conditionHits,conditionSkips:s.conditionSkips,elapsed:s.elapsed,score:s.score,searchExpanded:solution.expanded,maxQueue:solution.maxQueue});totals.ordinaryAuthoredWins++;
  }
  return{scope:'Fresh unmodified authored models, public-board BFS, ordinary direction/submit keys and neutral fixed ticks; not browser or video evidence',solutions};
});

assert.equal(hash(await readFile(modelUrl)),modelSha256);assert.equal(hash(await readFile(contractUrl)),contractSha256);
const report={kind:'independent-public-path-rule-review',passed:true,modelSha256,contractSha256,reviewScriptSha256:hash(await readFile(fileURLToPath(import.meta.url))),sourceUnchanged:true,checks,totals,
  methodology:'A separately written bitmask BFS over public cell facts and append-only exact target prefixes, plus an independent four-neighbor/entry-side symbol oracle. No production solver or pilot is imported.',
  scope:{syntheticBoundaryFixtures:true,ordinaryAuthoredModelRounds:3,browserExecuted:false,normalGameplayVideoEvidence:false,physicalTvTested:false,physicalPhoneTested:false}};
const out=process.argv.indexOf('--output');if(out!==-1){assert.ok(process.argv[out+1],'--output requires a JSON path');await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
