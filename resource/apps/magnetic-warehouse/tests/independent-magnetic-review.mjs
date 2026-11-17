// Independent exhaustive-set oracle. Constructed fixtures are not gameplay video.
// Run: node resource/apps/magnetic-warehouse/tests/independent-magnetic-review.mjs [--out report.json]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url);
const sha=body=>createHash('sha256').update(body).digest('hex');
const modelHash=sha(await readFile(modelUrl));
const model=createRequire(import.meta.url)(fileURLToPath(modelUrl));
const clone=value=>structuredClone(value),pointKey=(col,row)=>col+','+row;
const checkRows=[],totals={pulseFixtures:0,subsetCandidates:0,permutationComparisons:0};
function check(name,fn){checkRows.push({name,passed:true,...fn()});}
function tick(s,input={}){model.step(s,1/60,input);}
function positions(s){return s.crates.map(c=>({id:c.id,col:c.col,row:c.row,polarity:c.polarity})).sort((a,b)=>a.id-b.id);}
function tile(s,col,row){return s.cells.find(c=>c.col===col&&c.row===row);}
function coordinate(s,col,row){return {col,row,x:s.grid.x+(col+.5)*s.grid.cellSize,y:s.grid.y+(row+.5)*s.grid.cellSize};}

// Enumerate all movement subsets against the OLD occupancy. This intentionally
// does not use the production dependency walk / rejection fixed-point algorithm.
function oracle(s){
 const occupancy=new Map(s.crates.map(c=>[pointKey(c.col,c.row),c.id])), candidates=[];
 for(const c of s.crates){
  if(c.col!==s.player.col&&c.row!==s.player.row)continue;
  const dx=Math.sign(c.col-s.player.col),dy=Math.sign(c.row-s.player.row);if(!dx&&!dy)continue;
  let blocked=false;
  for(let x=s.player.col+dx,y=s.player.row+dy;x!==c.col||y!==c.row;x+=dx,y+=dy)if(tile(s,x,y)?.type==='wall'){blocked=true;break;}
  if(blocked)continue;
  const sense=c.polarity===s.player.polarity?1:-1,col=c.col+dx*sense,row=c.row+dy*sense,dest=tile(s,col,row);
  if(!dest||dest.type==='wall'||col===s.player.col&&row===s.player.row)continue;
  candidates.push({id:c.id,col,row,occupant:occupancy.get(pointKey(col,row)),mode:sense===1?'repel':'attract'});
 }
 // Conflicting original proposals are ALL rejected before subset enumeration.
 const contenders=new Map();for(const p of candidates){const k=pointKey(p.col,p.row);contenders.set(k,(contenders.get(k)||0)+1);}
 const eligible=candidates.filter(p=>contenders.get(pointKey(p.col,p.row))===1);
 assert.ok(eligible.length<=8,'Bound this independent exhaustive fixture oracle');
 let maximum=-1,winners=[];
 for(let mask=0;mask<2**eligible.length;mask++){
  totals.subsetCandidates++;
  const selected=eligible.filter((_,i)=>mask&(1<<i)),ids=new Set(selected.map(p=>p.id)),byId=new Map(selected.map(p=>[p.id,p]));
  if(selected.some(p=>p.occupant!==undefined&&!ids.has(p.occupant)))continue;
  let cyclic=false;
  for(const start of selected){let p=start;const visited=new Set();while(p){if(visited.has(p.id)){cyclic=true;break;}visited.add(p.id);p=byId.get(p.occupant);}if(cyclic)break;}
  if(cyclic)continue;
  if(selected.length>maximum){maximum=selected.length;winners=[selected];}else if(selected.length===maximum)winners.push(selected);
 }
 assert.equal(winners.length,1,'The simultaneous rules must have one maximum feasible movement set');
 const accepted=new Map(winners[0].map(p=>[p.id,p]));
 return {positions:s.crates.map(c=>({id:c.id,col:accepted.get(c.id)?.col??c.col,row:accepted.get(c.id)?.row??c.row,polarity:c.polarity})).sort((a,b)=>a.id-b.id),
  accepted:[...accepted.values()],scrap:winners[0].some(p=>tile(s,p.col,p.row).type==='scrap')};
}
function fixture(spec){
 const s=model.create(17,0);s.cells=[];
 for(let row=0;row<s.grid.rows;row++)for(let col=0;col<s.grid.cols;col++)s.cells.push({id:row*s.grid.cols+col,...coordinate(s,col,row),type:col===0||row===0||col===s.grid.cols-1||row===s.grid.rows-1?'wall':'floor',dockId:null});
 for(const [col,row]of spec.walls||[])tile(s,col,row).type='wall';for(const [col,row]of spec.scrap||[])tile(s,col,row).type='scrap';
 s.player={...s.player,...coordinate(s,...(spec.player||[2,4])),polarity:spec.polarity||1};
 s.crates=spec.crates.map(([col,row,polarity],i)=>({id:i+1,...coordinate(s,col,row),polarity,docked:false}));
 const occupied=new Set([pointKey(s.player.col,s.player.row),...s.crates.map(c=>pointKey(c.col,c.row))]);
 const free=s.cells.filter(c=>c.type==='floor'&&!occupied.has(pointKey(c.col,c.row))).reverse();
 s.docks=s.crates.map((c,i)=>({id:c.id,...coordinate(s,free[i].col,free[i].row),occupiedBy:null,matched:false}));
 for(const d of s.docks)tile(s,d.col,d.row).dockId=d.id;
 s.target=s.crates.length;s.matched=0;s.actionBudget=200;s.actionsUsed=0;s.actionsRemaining=200;
 return s;
}
function permutations(items){if(!items.length)return [[]];return items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(tail=>[item,...tail]));}
function comparePulse(state,permutation=true){
 const expected=oracle(state),orders=permutation?permutations(state.crates):[state.crates];
 for(const order of orders){
  const actual=clone(state);actual.crates=clone(order);tick(actual,{b:true});
  assert.deepEqual(positions(actual),expected.positions,'Pulse differs from exhaustive simultaneous-set oracle');
  assert.equal(new Set(actual.crates.map(c=>pointKey(c.col,c.row))).size,actual.crates.length,'Crates overlap');
  assert.equal(actual.actionsUsed,state.actionsUsed+1,'Each pulse costs one action');
  assert.equal(actual.pulseCount,state.pulseCount+1);
  assert.equal(actual.lostReason==='scrap',expected.scrap,'Scrap requires an accepted move into the chute');
  for(const c of actual.crates){const old=state.crates.find(x=>x.id===c.id);assert.ok(Math.abs(c.col-old.col)+Math.abs(c.row-old.row)<=1);}
  totals.permutationComparisons++;
 }
 totals.pulseFixtures++;return expected;
}

check('simultaneous chains, conflicts, swaps and rejected-occupant dependencies',()=>{
 const cases=[
  {name:'repelling chain to empty tile',crates:[[4,4,1],[5,4,1],[6,4,1]],moved:3},
  {name:'repelling chain to wall',crates:[[4,4,1],[5,4,1],[6,4,1]],walls:[[7,4]],moved:0},
  {name:'attracting chain blocked by player',crates:[[3,4,-1],[4,4,-1],[5,4,-1]],moved:0},
  {name:'attracting chain to empty tile',crates:[[4,4,-1],[5,4,-1],[6,4,-1]],moved:3},
  {name:'same destination and blocked dependent with independent mover',crates:[[4,4,1],[6,4,-1],[5,4,-1],[2,2,1]],moved:1},
  {name:'adjacent swap',crates:[[4,4,1],[5,4,-1]],moved:0},
  {name:'wall occludes distant crates',crates:[[5,4,1],[7,4,-1]],walls:[[4,4]],moved:0},
  {name:'crates do not occlude field',crates:[[4,4,1],[7,4,1]],moved:2},
  {name:'rejected scrap conflicts do not lose',crates:[[4,4,1],[6,4,-1]],scrap:[[5,4]],moved:0},
  {name:'accepted scrap and independent move commit together',crates:[[4,4,1],[2,2,1]],scrap:[[5,4]],moved:2}
 ];
 for(const c of cases){const result=comparePulse(fixture(c));assert.equal(result.accepted.length,c.moved,c.name);}
 return {cases:cases.map(c=>c.name),allCrateArrayPermutations:true,scope:'Constructed pulse fixtures; longer cycles are prohibited by the oracle, not claimed reachable in ordinary radial play.'};
});
check('four-way magnetic symmetry and both player polarities',()=>{
 let count=0;
 for(const polarity of [-1,1])for(const mode of [-1,1])for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){
  const s=fixture({player:[6,4],polarity,crates:[[6+2*dx,4+2*dy,polarity*mode]]});
  const out=comparePulse(s);assert.equal(out.accepted.length,1);
  assert.equal(out.positions[0].col,6+(2+mode)*dx);assert.equal(out.positions[0].row,4+(2+mode)*dy);count++;
 }
 return {directionAndPolarityCases:count};
});
check('deterministic scattered occupancy agrees with the independent subset oracle',()=>{
 let rng=20261102;const random=n=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng%n;};
 for(let i=0;i<240;i++){
  const player=[2+random(9),2+random(5)],used=new Set([pointKey(...player)]),crates=[];
  const count=2+random(3);
  while(crates.length<count){const alongRow=random(2)===0,col=alongRow?1+random(11):player[0],row=alongRow?player[1]:1+random(7),key=pointKey(col,row);if(used.has(key))continue;used.add(key);crates.push([col,row,random(2)?1:-1]);}
  const walls=[],scrap=[];
  for(let j=0;j<3;j++){const col=1+random(11),row=1+random(7),key=pointKey(col,row);if(!used.has(key)){used.add(key);(j===2?scrap:walls).push([col,row]);}}
  comparePulse(fixture({player,polarity:random(2)?1:-1,crates,walls,scrap}));
 }
 return {seed:20261102,cases:240,cratesPerCase:'2–4',allCrateArrayPermutations:true};
});

function setDocks(s,locations){
 for(const c of s.cells)c.dockId=null;
 s.docks=locations.map(([col,row],i)=>{const crate=s.crates.find(c=>c.col===col&&c.row===row);tile(s,col,row).dockId=i+1;return {id:i+1,...coordinate(s,col,row),occupiedBy:crate?.id??null,matched:crate?.id===i+1};});
 for(const c of s.crates)c.docked=s.docks.some(d=>d.id===c.id&&d.col===c.col&&d.row===c.row);
 s.matched=s.crates.filter(c=>c.docked).length;s.target=s.docks.length;s.score=s.matched*300;
}
check('numbered docks are exact identities and do not lock delivered crates',()=>{
 const wrong=fixture({crates:[[4,4,1],[6,4,1]]});setDocks(wrong,[[7,4],[5,4]]);tick(wrong,{b:true});
 assert.equal(wrong.matched,0);assert.equal(wrong.phase,'playing');assert.equal(wrong.score,0);
 assert.deepEqual(wrong.docks.map(d=>d.occupiedBy),[2,1]);assert.ok(wrong.crates.every(c=>!c.docked));
 const movable=fixture({crates:[[4,4,1],[6,4,1]]});setDocks(movable,[[4,4],[10,4]]);assert.equal(movable.matched,1);tick(movable,{b:true});
 assert.equal(movable.crates[0].col,5);assert.equal(movable.matched,0);assert.equal(movable.score,0);
 return {wrongNumberOccupants:[2,1],deliveredCrateRemainsMovable:true};
});
check('budget, scrap and deadline priorities terminate each atomic action',()=>{
 const make=()=>{const s=fixture({crates:[[4,4,1],[6,4,1]]});setDocks(s,[[5,4],[7,4]]);s.actionBudget=s.actionsRemaining=1;return s;};
 const last=make();tick(last,{b:true,x:1});assert.equal(last.phase,'won');assert.equal(last.actionsRemaining,0);assert.equal(last.player.col,2);assert.equal(last.moveCount,0);
 const snapshot=clone(last);model.step(last,.25,{a:true,b:true,x:1});assert.deepEqual(last,snapshot,'Terminal input must leave every field frozen');
 const order=make();tick(order,{a:true,b:true,x:1});assert.equal(order.phase,'lost');assert.equal(order.lostReason,'actions');assert.equal(order.flipCount,1);assert.equal(order.pulseCount,0);assert.equal(order.moveCount,0);
 const scrap=make();tile(scrap,5,4).type='scrap';tick(scrap,{b:true});assert.equal(scrap.matched,2);assert.equal(scrap.phase,'lost');assert.equal(scrap.lostReason,'scrap');
 const timeout=make();timeout.tick=5399;timeout.elapsed=5399/60;timeout.remaining=1/60;tick(timeout,{b:true});assert.equal(timeout.phase,'lost');assert.equal(timeout.lostReason,'timeout');assert.equal(timeout.pulseCount,0);assert.equal(timeout.actionsUsed,0);
 const empty=fixture({crates:[[4,2,1],[8,6,-1]]});tick(empty,{b:true});assert.equal(empty.actionsUsed,1);assert.equal(empty.blockedPulses,1);
 return {lastActionCanWin:true,scrapOverridesCompleteDocks:true,deadlinePrecedesPendingActions:true,flipStopsLaterPulseAndMoveAtBudgetZero:true,terminalStateFullyFrozen:true};
});
check('blocked walking is free, repeats are bounded, and button edges are cached',()=>{
 const s=fixture({player:[2,4],crates:[[7,2,1],[8,6,-1]],walls:[[3,4]]});
 for(let i=0;i<31;i++)tick(s,{x:1});assert.equal(s.blockedMoves,3);assert.equal(s.moveCount,0);assert.equal(s.actionsUsed,0);assert.equal(s.tick,31);
 tick(s,{});tick(s,{x:-1});assert.equal(s.player.col,1);assert.equal(s.actionsUsed,1);
 const edges=fixture({crates:[[4,4,1],[7,2,-1]]});model.step(edges,1/120,{a:true,b:true});assert.equal(edges.flipCount,0);assert.equal(edges.pulseCount,0);
 model.step(edges,1/120,{a:true,b:true});assert.equal(edges.flipCount,1);assert.equal(edges.pulseCount,1);assert.equal(edges.crates[0].col,3,'B must use A\'s new polarity');
 for(let i=0;i<30;i++)tick(edges,{a:true,b:true});assert.equal(edges.flipCount,1);assert.equal(edges.pulseCount,1);
 tick(edges,{});tick(edges,{a:true});assert.equal(edges.flipCount,2);
 return {blockedAttemptsOver31Ticks:3,firstRepeatTicks:20,laterRepeatTicks:10,blockedActionsSpent:0,heldButtonsDoNotRepeat:true,subTickEdgesRetained:true};
});
check('pulse origin and targets remain emission snapshots; retry arrays are independent',()=>{
 const s=fixture({crates:[[4,4,1],[7,2,-1]]});tick(s,{b:true});const pulse=clone(s.pulse);tick(s,{y:1});assert.deepEqual(s.pulse,pulse);
 for(let i=0;i<30;i++)tick(s,{});assert.equal(s.pulse,null);
 const first=model.create(17,2),fresh=model.create(17,2);tick(first,{a:true,b:true,x:1});assert.notDeepEqual(first,fresh);
 assert.deepEqual(fresh,model.create(17,2));assert.notEqual(first.cells,fresh.cells);assert.notEqual(first.crates,fresh.crates);assert.notEqual(first.docks,fresh.docks);
 return {pulseLifetimeSeconds:.45,freshCreateRestoresIndependentPublicArrays:true};
});

// These routes were derived independently from the authored public diagrams.
// They are checked by the subset oracle and executed with only create/step and
// ordinary directional/button input. They are not browser or timing evidence.
const routes=[
 [[4,5],[4,7],'A','B','B','B','B','B',[5,7],[5,4],[7,4],[7,6],[9,6],'B','B','B','B'],
 [[4,5],[4,7],'A','B',[4,6],[3,6],[3,4],'B','B',[4,4],'B',[5,4],[5,6],[9,6],[9,7],'B','B','B','B'],
 [[4,4],[4,7],'A','B',[4,6],[3,6],[3,4],'B','B',[4,4],'B',[5,4],[5,6],[9,6],[10,6],[10,3],[9,3],'A','B',[8,3],[7,3],[7,5],[10,5],[10,7],'B','B',[9,7],'A','B','B','B']
];
check('three authored puzzles have independently derived legal ordinary-input solutions',()=>{
 const completed=[];
 for(let level=0;level<3;level++){
  const s=model.create(17,level),inputs=[];
  const action=(input)=>{
   assert.equal(s.phase,'playing');const old={col:s.player.col,row:s.player.row,actions:s.actionsUsed};
   const expected=input.b?oracle(s):null;if(input.x||input.y){const col=old.col+(input.x||0),row=old.row+(input.y||0);assert.equal(tile(s,col,row)?.type,'floor');assert.ok(!s.crates.some(c=>c.col===col&&c.row===row));}
   tick(s,input);assert.equal(s.actionsUsed,old.actions+1);if(expected){assert.deepEqual(positions(s),expected.positions);assert.equal(expected.scrap,false);}
   if(input.x||input.y){assert.equal(s.player.col,old.col+(input.x||0));assert.equal(s.player.row,old.row+(input.y||0));}
   inputs.push(input);for(let i=0;i<5;i++)tick(s,{});
  };
  for(const command of routes[level]){
   if(typeof command==='string')action(command==='A'?{a:true}:{b:true});
   else {assert.ok(s.player.col===command[0]||s.player.row===command[1],'Independent waypoints must be axis-aligned');while(s.player.col!==command[0]||s.player.row!==command[1])action({x:Math.sign(command[0]-s.player.col),y:Math.sign(command[1]-s.player.row)});}
  }
  assert.equal(s.phase,'won');assert.equal(s.matched,s.target);assert.equal(s.target,[2,3,4][level]);assert.equal(s.lostReason,null);
  assert.ok(s.docks.every(d=>d.matched&&d.occupiedBy===d.id)&&s.crates.every(c=>c.docked));
  assert.ok(s.attractedMoves>0&&s.repelledMoves>0&&s.flipCount>0&&s.actionsRemaining>0&&s.remaining>0);
  assert.equal(s.score,s.target*300+500+s.actionsRemaining*10+Math.floor(s.remaining)*5);
  completed.push({level:level+1,phase:s.phase,matched:s.matched,target:s.target,actionsUsed:s.actionsUsed,actionsRemaining:s.actionsRemaining,
   flipCount:s.flipCount,pulseCount:s.pulseCount,attractedMoves:s.attractedMoves,repelledMoves:s.repelledMoves,modelElapsedSeconds:s.elapsed,
   ordinaryInputCommands:inputs.length,inputsSha256:sha(JSON.stringify(inputs))});
 }
 return {normalInputModelSolutions:completed,routeSource:'Independent manual reasoning over the fully visible authored diagrams; no production solver, pilot or state writes.'};
});

assert.equal(sha(await readFile(modelUrl)),modelHash,'Model changed during review; rerun after source stabilizes');
const report={kind:'independent-magnetic-subset-review',passed:true,modelSha256:modelHash,reviewScriptSha256:sha(await readFile(fileURLToPath(import.meta.url))),
 checks:checkRows,totals,methodology:'Compute radial proposals geometrically, reject all original shared destinations, then enumerate every movement subset with pre-pulse occupancy closure and acyclic dependencies. Compare its unique maximum against production across all crate-array permutations. Separate boundary fixtures verify terminal/input rules. Three independently derived routes use ordinary inputs with every pulse checked by the oracle.',
 scope:{constructedFixtures:true,fixtureInitialConditionsModified:true,normalInputModelRoutes:3,ordinaryRouteStateWrites:false,normalGameplayEvidence:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['Bounded fixture coverage and accelerated ordinary-input model routes are separate from real runtime gameplay and recording; modelElapsedSeconds is not recorded video duration. No continuous magnetic-force simulation is claimed.']};
const out=process.argv.indexOf('--out');if(out>=0){assert.ok(process.argv[out+1]);await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
