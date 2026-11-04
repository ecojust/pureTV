// Independent integer-center reflection/rational-color oracle. Explicit model
// fixtures are separate from six fresh ordinary-input public-target solutions.
// node resource/apps/glass-fold/tests/independent-fold-review.mjs [--out file.json]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),contractUrl=new URL('../docs/model-contract.md',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const modelHash=sha(await readFile(modelUrl)),contractHash=sha(await readFile(contractUrl));
const Model=createRequire(import.meta.url)(fileURLToPath(modelUrl));
const clone=structuredClone,checks=[],totals={searchNodes:0,searchEdges:0,comparedTransitions:0,ordinarySolutionWins:0};
const directions={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}};
const creases=Array.from({length:12},(_,index)=>({axis:index<6?'x':'y',at:index%3+1,movingSide:Math.floor(index/3)%2===0?'low':'high',selectorRow:Math.floor(index/3),selectorCol:index%3}));
function check(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){Model.step(s,1/60,{cancelEpoch:0,...input});}
function tap(s,key){tick(s,key==='A'?{a:true,aPressed:true}:key==='B'?{b:true,bPressed:true}:directions[key]);tick(s);}
function choose(s,crease){
  assert.equal(s.phase,'playing');assert.notEqual(s.mode,'folding');
  for(let guard=0;guard<8;guard++){
    const selected=s.candidates[s.selectedIndex];
    if(selected.selectorCol===crease.selectorCol&&selected.selectorRow===crease.selectorRow)return;
    tap(s,selected.selectorCol<crease.selectorCol?'right':selected.selectorCol>crease.selectorCol?'left':selected.selectorRow<crease.selectorRow?'down':'up');
  }
  assert.fail('Candidate could not be selected through ordinary directional taps');
}
function settle(s){let n=0;while(s.phase==='playing'&&s.mode==='folding'){assert.ok(n++<40);tick(s);}return n;}
function fold(s,c){choose(s,c);tick(s,{a:true,aPressed:true});settle(s);tick(s);}
function board(s){return clone({palette:s.palette,substrateColor:s.substrateColor,pieces:s.pieces,cells:s.cells});}
function rgb(b,ids){
  if(!ids.length)return null;
  const pieces=new Map(b.pieces.map(p=>[p.id,p])),pigments=new Map(b.palette.map(p=>[p.id,p.rgb]));
  let denominator=1,numerator=[...b.substrateColor];
  for(const id of ids){const color=pigments.get(pieces.get(id).pigment);assert.ok(color);numerator=numerator.map((v,k)=>v+color[k]*denominator);denominator*=2;}
  // All values are positive integers. This rounds the exact rational once;
  // it does not use or copy the model's float color accumulator.
  return numerator.map(n=>Math.floor((2*n+denominator)/(2*denominator)));
}
function refresh(b){for(const c of b.cells){c.depth=c.layers.length;c.color=rgb(b,c.layers);c.reverseColor=rgb(b,[...c.layers].reverse());}return b;}
function occupied(b){return b.cells.filter(c=>c.layers.length);}
function matches(b,target){
  const cells=occupied(b);if(cells.length!==target.cells.length)return false;
  return target.cells.every(t=>cells.some(c=>c.col===t.col&&c.row===t.row&&c.color.every((v,k)=>v===t.color[k])));
}
function signature(b){return JSON.stringify(b.cells.map(c=>c.layers));}
function oracleFold(input,c){
  const b=clone(input),moving=[],stationary=[];
  for(const cell of occupied(b)){
    // Reflect cell centers as doubled odd integers, then recover the cell.
    const coordinate=c.axis==='x'?cell.col:cell.row,center2=2*coordinate+1;
    const moves=c.movingSide==='low'?center2<2*c.at:center2>2*c.at;
    if(moves){const destination=(4*c.at-center2-1)/2;if(destination<0||destination>=4)return null;moving.push({cell,destination});}
    else stationary.push(cell);
  }
  if(!moving.length||!stationary.length)return null;
  const out=clone(b);for(const cell of out.cells)cell.layers=[];
  const at=(col,row)=>out.cells.find(cell=>cell.col===col&&cell.row===row);
  for(const cell of stationary)at(cell.col,cell.row).layers=[...cell.layers];
  const pieces=new Map(out.pieces.map(p=>[p.id,p]));
  for(const {cell,destination} of moving){
    const dest=at(c.axis==='x'?destination:cell.col,c.axis==='y'?destination:cell.row);
    dest.layers.push(...[...cell.layers].reverse());
    for(const id of cell.layers){const p=pieces.get(id);p.vertices=p.vertices.map(v=>({...v,[c.axis]:c.at-(v[c.axis]-c.at)}));p.face=-p.face;p.movedFolds++;}
  }
  return refresh(out);
}
function invariant(b){
  const ids=b.cells.flatMap(c=>c.layers);assert.equal(ids.length,b.pieces.length);assert.equal(new Set(ids).size,b.pieces.length);
  assert.deepEqual([...ids].sort(),b.pieces.map(p=>p.id).sort());
  let area=0;
  for(const p of b.pieces){
    assert.equal(p.vertices.length,4);assert.ok([1,-1].includes(p.face));assert.ok(Number.isInteger(p.movedFolds)&&p.movedFolds>=0);
    let twice=0;for(let i=0;i<4;i++){const a=p.vertices[i],z=p.vertices[(i+1)%4];assert.ok(Number.isInteger(a.x)&&Number.isInteger(a.y)&&a.x>=0&&a.x<=4&&a.y>=0&&a.y<=4);twice+=a.x*z.y-z.x*a.y;}
    assert.equal(Math.abs(twice),2);area+=Math.abs(twice)/2;
    const location=b.cells.find(c=>c.layers.includes(p.id));
    assert.equal(p.vertices.reduce((sum,v)=>sum+v.x,0),4*location.col+2);assert.equal(p.vertices.reduce((sum,v)=>sum+v.y,0),4*location.row+2);
  }
  assert.equal(area,b.pieces.length);assert.ok(occupied(b).length<=16);
  for(const c of b.cells){assert.equal(c.depth,c.layers.length);assert.deepEqual(c.color,rgb(b,c.layers));assert.deepEqual(c.reverseColor,rgb(b,[...c.layers].reverse()));}
}
function search(initial,limit,target){
  const nodes=[{board:refresh(board(initial)),path:[],depth:0}],seen=new Set(['0:'+signature(nodes[0].board)]),leaves=[],solutions=[];let edges=0;
  for(let cursor=0;cursor<nodes.length;cursor++){
    assert.ok(nodes.length<=1500,'Independent graph search exceeded its explicit bound');
    const node=nodes[cursor];if(node.depth===limit){leaves.push(node);if(matches(node.board,target))solutions.push(node);continue;}
    for(const c of creases){const next=oracleFold(node.board,c);edges++;if(!next)continue;invariant(next);const depth=node.depth+1,key=depth+':'+signature(next);if(seen.has(key))continue;seen.add(key);nodes.push({board:next,path:[...node.path,c],depth});}
  }
  return {nodes,edges,leaves,solutions};
}
const searches=[];
check('public board and exact rational composition match integer material geometry',()=>{
  for(let level=0;level<6;level++){
    const s=Model.create(91,level);assert.equal(s.phase,'playing');assert.equal(s.mode,'editing');assert.equal(s.level,level+1);assert.equal(s.foldLimit,[3,3,4,2,3,4][level]);
    assert.equal(s.cells.length,16);assert.equal(s.pieces.length,[16,16,16,12,13,16][level]);assert.equal(s.materialArea,s.pieces.length);assert.equal(s.layerAlpha,.5);assert.deepEqual(s.substrateColor,[246,244,234]);invariant(board(s));
    assert.equal(s.candidates.length,12);for(const c of creases){const actual=s.candidates.find(v=>v.selectorRow===c.selectorRow&&v.selectorCol===c.selectorCol);assert.ok(actual);for(const key of ['axis','at','movingSide'])assert.equal(actual[key],c[key]);assert.equal(actual.valid,!!oracleFold(board(s),c));}
    const graph=search(s,s.foldLimit,s.target);assert.ok(graph.solutions.length,'Authored public target has no independent bounded solution');assert.ok(graph.leaves.some(n=>!matches(n.board,s.target)),'Missing meaningful wrong construction');searches.push(graph);totals.searchNodes+=graph.nodes.length;totals.searchEdges+=graph.edges;
  }
  return {levels:6,searchNodes:totals.searchNodes,searchEdges:totals.searchEdges,solutionCounts:searches.map(g=>g.solutions.length),boundPerLevel:1500,privateHistoryReadBySearch:false};
});
check('every reachable crease transition preserves area and matches center-reflection stack oracle',()=>{
  for(let level=0;level<6;level++){
    const graph=searches[level];
    for(const node of graph.nodes.filter(n=>n.depth<[3,3,4,2,3,4][level])){
      const original=Model.create(91,level);for(const c of node.path)fold(original,c);assert.equal(original.mode,'editing');assert.deepEqual(board(original),node.board);
      for(const c of creases){
        const s=clone(original),expected=oracleFold(node.board,c);choose(s,c);const prior=board(s),used=s.foldsUsed,foldCount=s.foldCount,history=s.historyDepth;tick(s,{a:true,aPressed:true});totals.comparedTransitions++;
        if(!expected){assert.deepEqual(board(s),prior);assert.equal(s.foldsUsed,used);assert.equal(s.foldCount,foldCount);assert.equal(s.historyDepth,history);assert.equal(s.mismatches,0);continue;}
        assert.equal(s.mode,'folding');assert.deepEqual(s.foldAnimation.beforeCells,prior.cells);assert.deepEqual(s.foldAnimation.beforePieces,prior.pieces);assert.deepEqual(board(s),expected);invariant(board(s));
        assert.equal(s.foldsUsed,used+1);assert.equal(s.foldCount,foldCount+1);assert.equal(s.historyDepth,history+1);assert.equal(s.materialArea,s.pieces.length);assert.equal(s.occupiedArea,occupied(expected).length);
        settle(s);assert.deepEqual(board(s),expected);
        if(s.foldsUsed===s.foldLimit)assert.equal(s.phase==='won',matches(expected,s.target));else assert.equal(s.mode,'editing');
      }
    }
  }
  return {transitions:totals.comparedTransitions,scope:'Reachable-state model clones with ordinary directional and A inputs; these are bounded model fixtures, not browser gameplay.'};
});
check('three-layer hand-calculated color distinguishes reversal and final-only rounding',()=>{
  const s=Model.create(91,0),b=board(s),ids=b.pieces.map(p=>p.id),pigments=b.palette.slice(0,3).map(p=>p.id);
  for(let i=0;i<3;i++)b.palette[i].rgb=[[0,255,0],[255,0,0],[0,0,255]][i];
  for(const c of b.cells)c.layers=[];
  b.cells.find(c=>c.col===3&&c.row===0).layers=[ids[0]];b.cells.find(c=>c.col===0&&c.row===0).layers=[ids[1],ids[2]];b.cells.find(c=>c.col===2&&c.row===3).layers=ids.slice(3);
  for(let i=0;i<16;i++){const p=b.pieces[i],c=b.cells.find(v=>v.layers.includes(p.id));p.pigment=pigments[i<3?i:0];p.vertices=[{x:c.col,y:c.row},{x:c.col+1,y:c.row},{x:c.col+1,y:c.row+1},{x:c.col,y:c.row+1}];p.face=1;p.movedFolds=0;}
  refresh(b);Object.assign(s,clone(b));const c=creases[1],expected=oracleFold(b,c);assert.deepEqual(expected.cells.find(c=>c.col===3&&c.row===0).color,[158,62,93]);
  fold(s,c);assert.deepEqual(board(s),expected);const dest=s.cells.find(c=>c.col===3&&c.row===0);assert.deepEqual(dest.layers,[ids[0],ids[2],ids[1]]);assert.deepEqual(dest.color,[158,62,93]);assert.notDeepEqual(dest.color,[95,62,157]);invariant(board(s));
  return {scope:'Explicit synthetic 16-piece, three-pigment model fixture',expectedRgb:[158,62,93],incorrectUnreversedRgb:[95,62,157]};
});
check('exact public silhouette and RGB are necessary while invisible piece history is not a target',()=>{
  const path=searches[0].solutions[0].path;
  for(const kind of ['color','silhouette']){
    const s=Model.create(91,0);for(const c of path.slice(0,-1))fold(s,c);
    if(kind==='color')s.target.cells[0].color[0]=(s.target.cells[0].color[0]+1)%256;
    else s.target.cells.pop();
    s.target.occupiedCount=s.target.cells.length;fold(s,path.at(-1));assert.equal(s.phase,'playing');assert.equal(s.mode,'review');assert.equal(s.mismatches,1);assert.equal(s.lastReview.matched,false);
  }
  // Two geometrically different stack histories, same public footprint and
  // actual rounded RGB, must both win. All pigments equal the substrate only
  // in these explicit fixtures; authored-level solutions below stay untouched.
  const groups=new Map();for(const leaf of searches[0].leaves){const key=JSON.stringify(occupied(leaf.board).map(c=>[c.col,c.row]));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(leaf);}
  const pair=[...groups.values()].find(v=>v.length>=2);assert.ok(pair);
  for(const leaf of pair.slice(0,2)){
    const s=Model.create(91,0);for(const p of s.palette)p.rgb=[...s.substrateColor];refresh(s);
    s.target={cells:occupied(leaf.board).map(c=>({col:c.col,row:c.row,color:[...s.substrateColor]})),occupiedCount:occupied(leaf.board).length};
    for(const c of leaf.path)fold(s,c);assert.equal(s.phase,'won');assert.equal(s.targetMatched,true);
  }
  assert.notEqual(signature(pair[0].board),signature(pair[1].board));
  return {scope:'Explicit target/pigment mutation fixtures, never claimed as authored normal gameplay',wrongColorChannels:1,wrongSilhouettes:1,equivalentVisibleTargetsAccepted:2};
});
check('undo restores construction while mismatch, review, elapsed and lifetime ledgers stay spent',()=>{
  const path=searches[0].leaves.find(n=>!matches(n.board,Model.create(91,0).target)).path,s=Model.create(91,0);
  for(const c of path.slice(0,-1))fold(s,c);choose(s,path.at(-1));const before=board(s),selected=s.selectedIndex,used=s.foldsUsed;
  for(let attempt=1;attempt<=3;attempt++){
    fold(s,path.at(-1));assert.equal(s.mismatches,attempt);assert.equal(s.reviewCount,attempt);assert.equal(s.phase,attempt===3?'lost':'playing');
    const failure=clone(s.lastReview),foldCount=s.foldCount,elapsed=s.elapsed;
    if(attempt===3){const terminal=clone(s);tap(s,'B');tap(s,'A');tick(s);assert.deepEqual(s,terminal);break;}
    for(let i=0;i<4;i++)tap(s,'A');assert.equal(s.mismatches,attempt);assert.equal(s.reviewCount,attempt);
    tap(s,'B');assert.deepEqual(board(s),before);assert.equal(s.selectedIndex,selected);assert.equal(s.foldsUsed,used);assert.equal(s.foldsRemaining,s.foldLimit-used);assert.equal(s.foldCount,foldCount);assert.equal(s.undoCount,attempt);assert.equal(s.mode,'editing');assert.equal(s.mismatches,attempt);assert.equal(s.reviewCount,attempt);assert.deepEqual(s.lastReview,failure);assert.ok(s.elapsed>elapsed);
  }
  return {failedInspections:3,actualUndos:2,thirdFailureFrozen:true};
});
check('held, simultaneous, cancelled and animated inputs do not queue or spend extra folds',()=>{
  const s=Model.create(91,0);tap(s,'B');assert.equal(s.undoCount,0);const c=searches[0].solutions[0].path[0];choose(s,c);
  tick(s,{a:true,aPressed:true,cancelled:true});tick(s);assert.equal(s.foldCount,0);
  tick(s,{a:true});const geom=board(s);for(let i=0;i<40;i++)tick(s,{a:true,b:true,x:1,y:0});assert.equal(s.foldCount,1);assert.equal(s.undoCount,0);assert.deepEqual(board(s),geom);
  tick(s);const used=s.foldsUsed;tick(s,{a:true,b:true,aPressed:true,bPressed:true});assert.equal(s.foldsUsed,used-1);assert.equal(s.undoCount,1);assert.equal(s.foldCount,1);
  for(let i=0;i<40;i++)tick(s,{b:true});assert.equal(s.undoCount,1);tick(s);invariant(board(s));
  return {cancelledFoldIgnored:true,animationInputsNotQueued:true,heldButtonsDoNotRepeat:true,simultaneousUndoPriority:true};
});
check('90-second deadline precedes a same-tick final inspection; terminal and fresh rounds are isolated',()=>{
  const path=searches[0].solutions[0].path,results=[];
  for(const startTick of [5363,5364]){
    const s=Model.create(91,0);for(const c of path.slice(0,-1))fold(s,c);choose(s,path.at(-1));while(s.tick<startTick-1)tick(s);
    tick(s,{a:true,aPressed:true});assert.equal(s.tick,startTick);settle(s);results.push({startTick,finalTick:s.tick,phase:s.phase,lostReason:s.lostReason});
    assert.equal(s.phase,startTick===5363?'won':'lost');if(startTick===5364)assert.equal(s.lostReason,'timeout');
    const terminal=clone(s);for(let i=0;i<10;i++)tick(s,{a:true,b:true,x:1});assert.deepEqual(s,terminal);
  }
  const first=Model.create(91,0),fresh=Model.create(91,0),baseline=clone(fresh);fold(first,path[0]);assert.deepEqual(fresh,baseline);first.cells[0].layers.push('fixture');first.pieces[0].vertices[0].x=-999;first.candidates[0].reason='fixture';assert.deepEqual(Model.create(91,0),baseline);
  return {deadlineCases:results,freshRoundNoAliasing:true};
});
check('six fresh authored targets are solved from public geometry using only ordinary inputs',()=>{
  const solutions=[];
  for(let level=0;level<6;level++){
    const s=Model.create(91,level),route=searches[level].solutions[0].path;
    for(const c of route){fold(s,c);for(let i=0;i<120&&s.phase==='playing';i++)tick(s);}
    assert.equal(s.phase,'won');assert.equal(s.targetMatched,true);assert.equal(s.outlineMatches,true);assert.equal(s.mismatches,0);assert.equal(s.reviewCount,1);assert.equal(s.foldsUsed,s.foldLimit);assert.equal(s.foldCount,s.foldLimit);assert.equal(s.undoCount,0);assert.equal(s.matchedCells,s.target.occupiedCount);assert.ok(s.remaining>0);assert.equal(s.score,s.matchedCells*100+1000+Math.floor(s.remaining)*5+s.maxMismatches*100);invariant(board(s));
    solutions.push({level:s.level,phase:s.phase,elapsed:s.elapsed,score:s.score,foldsUsed:s.foldsUsed,foldLimit:s.foldLimit,occupiedArea:s.occupiedArea,materialArea:s.materialArea,matchedCells:s.matchedCells,targetMatched:s.targetMatched,mismatches:s.mismatches,route:route.map(c=>({axis:c.axis,at:c.at,movingSide:c.movingSide}))});totals.ordinarySolutionWins++;
  }
  return {solutions,scope:'Fresh production Model.create states; independent public-target graph search supplies only normal directional/A key inputs and idle steps. No fixture modifications or authored solution access.'};
});
assert.equal(sha(await readFile(modelUrl)),modelHash,'Model changed during independent review');assert.equal(sha(await readFile(contractUrl)),contractHash,'Contract changed during review');
const report={kind:'independent-integer-fold-review',passed:true,modelSha256:modelHash,contractSha256:contractHash,reviewScriptSha256:sha(await readFile(new URL(import.meta.url))),sourceUnchanged:true,checks,totals,
  methodology:'Independent doubled-cell-center reflection, polygon shoelace area, exact rational final-round color, public-target bounded graph search. No authored fold solution, model private history or production fold/color helper is used by the oracle.',
  scope:{syntheticModelFixtures:true,ordinaryAuthoredModelSolutions:6,normalGameplayVideoEvidence:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
  limitations:['Discrete colored-square model; no continuous origami or real glass stress simulation.','Timing and input fixtures execute the model directly; packaged browser/native/video checks are separate.']};
const index=process.argv.indexOf('--out');if(index>=0){assert.ok(process.argv[index+1]);await writeFile(process.argv[index+1],JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));
