// Independent mathematical/fixture checks, never gameplay or capture evidence.
// Run: node resource/apps/echo-cartographer/tests/independent-echo-review.mjs [--out report.json]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const modelHash=sha(await readFile(modelUrl));
const model=require(fileURLToPath(modelUrl));
const close=(a,b,message)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,message);
const step=(state,input={})=>model.step(state,1/60,input);
const checks=[],totals={distanceComparisons:0,temporalComparisons:0,lampComparisons:0};
function check(name,fn){const details=fn();checks.push({name,passed:true,...details});}
function fixture(level){const state=model.create(71,level);state.hazards=[];return state;}
function clearFog(state){for(const cell of state.cells){cell.seen=false;cell.visible=false;cell.revealedUntil=0;}}

// All-pairs matrix relaxation is independent of the production queue/BFS.
function reference(state){
 const floors=state.cells.filter(c=>c.type==='floor'), index=new Map(floors.map((c,i)=>[c.id,i]));
 const d=floors.map((a,i)=>floors.map((b,j)=>i===j?0:Math.abs(a.col-b.col)+Math.abs(a.row-b.row)===1?state.grid.cellSize:Infinity));
 for(let k=0;k<d.length;k++)for(let i=0;i<d.length;i++)for(let j=0;j<d.length;j++)d[i][j]=Math.min(d[i][j],d[i][k]+d[k][j]);
 return (sourceId,x,y)=>{
  const source=state.cells[sourceId], offset=Math.hypot(x-source.x,y-source.y), row=d[index.get(sourceId)];
  return state.cells.map(cell=>{
   if(cell.type==='floor'){const path=row[index.get(cell.id)];return Number.isFinite(path)?cell.id===sourceId?0:path+offset:null;}
   const incoming=floors.filter(f=>Math.abs(f.col-cell.col)+Math.abs(f.row-cell.row)===1).map(f=>row[index.get(f.id)]+state.grid.cellSize+offset);
   const path=Math.min(...incoming);return Number.isFinite(path)?path:null;
  });
 };
}
function emitAt(state,cell,dx=0,dy=0){
 state.player.x=cell.x+dx;state.player.y=cell.y+dy;step(state,{a:true});
 assert.equal(state.sonarCount,1);assert.equal(state.waves.length,1);return state.waves[0];
}
check('three distinct maps connect every beacon to the entrance',()=>{
 const maps=[];
 for(let level=0;level<3;level++){
  const s=model.create(71,level), distances=reference(s)(s.entry.tileId,s.entry.x,s.entry.y);
  assert.equal(s.phase,'playing');assert.equal(s.collected,0);assert.equal(s.entry.unlocked,false);
  assert.equal(s.target,[2,3,3][level]);assert.equal(s.hazards.length,[1,2,3][level]);
  for(const beacon of s.beacons)assert.ok(distances[beacon.tileId]>0&&Number.isFinite(distances[beacon.tileId]));
  maps.push(sha(JSON.stringify(s.cells.map(c=>c.type))));
 }
 assert.equal(new Set(maps).size,3);return{levels:3,layoutSha256:maps};
});
check('scan distances match independent all-pairs floor paths, including off-center emission',()=>{
 let sources=0;
 for(let level=0;level<3;level++){
  const base=fixture(level), solve=reference(base);
  const emitters=[{id:base.entry.tileId,dx:0,dy:0},...base.beacons.map(b=>({id:b.tileId,dx:0,dy:0})),{id:base.entry.tileId,dx:7,dy:-4}];
  for(const emitter of emitters){
   const s=fixture(level), cell=s.cells[emitter.id], wave=emitAt(s,cell,emitter.dx,emitter.dy), expected=solve(cell.id,cell.x+emitter.dx,cell.y+emitter.dy);
   assert.equal(wave.originTileId,cell.id);assert.equal(wave.x,cell.x+emitter.dx);assert.equal(wave.y,cell.y+emitter.dy);
   for(let i=0;i<expected.length;i++){expected[i]===null?assert.equal(wave._distances[i],null):close(wave._distances[i],expected[i],'Wrong corridor/wall arrival distance');totals.distanceComparisons++;}
   sources++;
  }
 }
 return{levels:3,emissionFixtures:sources,comparisons:totals.distanceComparisons};
});
check('moving after a scan preserves its origin, arrival times and four-second reveal deadline',()=>{
 const s=fixture(0), origin={x:s.player.x,y:s.player.y,id:s.entry.tileId}, expected=reference(s)(origin.id,origin.x,origin.y);
 clearFog(s);const wave=emitAt(s,s.cells[origin.id]);
 const inspect=new Set([1,11,12,13,23,24,25,95,96,97,251,252,253,335,336,337]);
 const assertFrame=()=>{
  const radius=Math.min(320,s.elapsed*200);
  for(let i=0;i<s.cells.length;i++){
   const distance=expected[i], arrived=distance!==null&&distance<=320+1e-9&&distance<=radius+1e-9;
   close(s.cells[i].revealedUntil,arrived?distance/200+4:0,'Reveal was early, shifted with player, or renewed each frame');
   if(arrived)assert.equal(s.cells[i].seen,true);
   totals.temporalComparisons++;
  }
  if(s.waves.length){
   assert.equal(wave.x,origin.x);assert.equal(wave.y,origin.y);assert.equal(wave.originTileId,origin.id);
   const frontier=expected.flatMap((d,i)=>d!==null&&d<=radius+1e-9&&d<=320+1e-9&&d>radius-40-1e-9?[i]:[]);
   assert.deepEqual(wave.frontier,frontier,'Frontier crosses a hidden wall or lies ahead of the wave');
  }
 };
 assertFrame();
 while(s.tick<337){step(s,s.tick<30?{x:1}:{});if(inspect.has(s.tick))assertFrame();}
 assert.ok(s.player.x>origin.x);assert.equal(s.waves.length,0);
 const remote=s.cells.filter((c,i)=>expected[i]!==null&&expected[i]>=120&&expected[i]<=320&&Math.hypot(c.x-s.player.x,c.y-s.player.y)>48);
 assert.ok(remote.length>0);assert.ok(remote.every(c=>c.seen&&!c.visible),'Echo expiry must retain dim memory without permanent bright detail');
 return{checkedTicks:[...inspect],comparisons:totals.temporalComparisons,rememberedAfterFade:remote.length};
});

// Segment orientation + closed-edge intersections, not production slab clipping.
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-8&&c.x>=Math.min(a.x,b.x)-1e-8&&c.x<=Math.max(a.x,b.x)+1e-8&&c.y>=Math.min(a.y,b.y)-1e-8&&c.y<=Math.max(a.y,b.y)+1e-8;
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);return ((x>0&&y<0)||(x<0&&y>0))&&((u>0&&v<0)||(u<0&&v>0))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);}
function blocked(state,from,to){
 const half=state.grid.cellSize/2;
 return state.cells.some(w=>{
  if(w.type!=='wall'||w.id===to.id)return false;
  const left=w.x-half,right=w.x+half,top=w.y-half,bottom=w.y+half;
  const inside=p=>p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom;
  if(inside(from)||inside(to))return true;
  const q=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
  return q.some((p,i)=>intersects(from,to,p,q[(i+1)%4]));
 });
}
check('near light matches independent closed-wall segment intersections',()=>{
 let fixtures=0;
 for(let level=0;level<3;level++){
  const base=fixture(level), floors=base.cells.filter(c=>c.type==='floor'&&base.cells.some(w=>w.type==='wall'&&Math.abs(c.col-w.col)+Math.abs(c.row-w.row)===1));
  const origins=[base.cells[base.entry.tileId],floors[0],floors[Math.floor(floors.length/2)],floors.at(-1)];
  for(const origin of origins)for(const [dx,dy] of [[0,0],[9,9],[-9,-9]]){
   const s=fixture(level);clearFog(s);s.player.x=origin.x+dx;s.player.y=origin.y+dy;step(s);
   for(const c of s.cells){const expected=Math.hypot(c.x-s.player.x,c.y-s.player.y)<=48+1e-9&&!blocked(s,s.player,c);assert.equal(c.visible,expected,'Near light leaks through a wall/corner');assert.equal(c.seen,expected);totals.lampComparisons++;}
   fixtures++;
  }
 }
 return{positionFixtures:fixtures,comparisons:totals.lampComparisons};
});
check('a visible floor center does not expose a hazard behind a corner or beyond lamp range',()=>{
 const cases=[];
 for(const fixture of [{name:'wall-corner',px:370,py:185,hx:392,hy:145},{name:'lamp-radius',px:160,py:270,hx:219,hy:270}]){
  const s=model.create(71,0);s.hazards=s.hazards.slice(0,1);s.player.x=fixture.px;s.player.y=fixture.py;
  Object.assign(s.hazards[0],{x:fixture.hx,y:fixture.hy,_route:[],_navTarget:null});clearFog(s);step(s);
  const h=s.hazards[0], cell=s.cells[Math.floor((h.y-s.grid.y)/40)*s.grid.cols+Math.floor((h.x-s.grid.x)/40)];
  const distance=Math.hypot(h.x-s.player.x,h.y-s.player.y), occluded=blocked(s,s.player,h);
  assert.equal(cell.visible,true,'Fixture must distinguish point visibility from a visible floor center');
  assert.ok(distance>48||occluded,'Actual hazard point is not hidden in this fixture');
  assert.equal(h.visible,false,'Near light exposed an actual hazard point outside line of sight/range');
  assert.equal(s.player.shield,3);
  // Echoes illuminate a reached floor tile independently of direct near-light LOS.
  cell.revealedUntil=s.elapsed+1;step(s);assert.equal(h.visible,true,'An actual reached echo may reveal a hazard in its tile');
  cases.push({name:fixture.name,distanceBeforeEcho:distance,lineOfSightOccluded:occluded,echoRevealPassed:true});
 }
 return{pointVisibilityFixtures:cases};
});
check('quiet movement changes actual patrol alert behavior and speed',()=>{
 const noisy=model.create(71,0), quiet=model.create(71,0);
 for(const s of [noisy,quiet]){const c=s.cells.find(c=>c.col===3&&c.row===5);s.hazards[0].x=c.x;s.hazards[0].y=c.y;}
 step(noisy,{x:1});step(quiet,{x:1,b:true});
 assert.equal(noisy.hazards[0].alerted,true);assert.equal(quiet.hazards[0].alerted,false);
 assert.equal(noisy.hazards[0].speed,42);assert.equal(quiet.hazards[0].speed,22);
 assert.equal(noisy.player.noiseRadius,180);assert.equal(quiet.player.noiseRadius,35);
 close(noisy.player.x-noisy.entry.x,1,'Ordinary displacement');close(quiet.player.x-quiet.entry.x,34/60,'Quiet displacement');
 return{ordinaryNoiseRadius:180,quietNoiseRadius:35,alertedSpeed:42,patrolSpeed:22};
});
check('hearing boundaries include both endpoint offsets and actual same-cell separation',()=>{
 const cases=[];
 for(const sameCell of [true,false])for(const delta of [-.01,0,.01]){
  const s=model.create(71,0);s.hazards=s.hazards.slice(0,1);const h=s.hazards[0];
  s.player.x=sameCell?221:169;s.player.y=sameCell?270:230;
  h.x=sameCell?221+34/60+35+delta:310-delta;h.y=s.player.y;h._route=[];h._navTarget=null;
  const priorHazard={x:h.x,y:h.y};step(s,{x:1,b:sameCell});
  const tile=(x,y)=>s.cells[Math.floor((y-s.grid.y)/40)*s.grid.cols+Math.floor((x-s.grid.x)/40)];
  const pc=tile(s.player.x,s.player.y),hc=tile(priorHazard.x,priorHazard.y);
  const centerDistance=reference(s)(pc.id,pc.x,pc.y)[hc.id];
  const measured=pc.id===hc.id?Math.hypot(s.player.x-priorHazard.x,s.player.y-priorHazard.y):centerDistance+Math.hypot(s.player.x-pc.x,s.player.y-pc.y)+Math.hypot(priorHazard.x-hc.x,priorHazard.y-hc.y);
  const radius=sameCell?35:180;close(measured,radius+delta,'Incorrect hearing fixture boundary');
  assert.equal(h.alerted,measured<=radius+1e-9,'Hearing omits an endpoint offset or uses a cell center for same-cell separation');
  assert.equal(s.player.shield,3,'Boundary fixture must not include a collision');
  cases.push({metric:sameCell?'same-cell-euclidean':'floor-path-plus-both-endpoints',radius,delta,measured,alerted:h.alerted});
 }
 const separated=model.create(71,0);separated.hazards=separated.hazards.slice(0,1);
 for(const cell of separated.cells)if(cell.col===4)cell.type='wall';
 separated.player.x=240;separated.player.y=270;Object.assign(separated.hazards[0],{x:320,y:270,_route:[],_navTarget:null});
 step(separated,{y:1});assert.equal(separated.hazards[0].alerted,false,'Disconnected floors must not transmit movement noise');
 return{boundaryCases:cases,disconnectedFixturePassed:true};
});
check('scan edge and finite reserve cannot create free scans or indefinite light',()=>{
 const s=fixture(0);assert.equal(s.sonarCost,3);step(s,{a:true});close(s.battery,120-3-1.6/60,'Scan must pay once before passive drain');
 for(let n=0;n<90;n++)step(s,{a:true});assert.equal(s.sonarCount,1);
 step(s);step(s,{a:true});assert.equal(s.sonarCount,2);
 const poor=fixture(0);poor.battery=2.9;step(poor,{a:true});assert.equal(poor.sonarCount,0);close(poor.battery,2.9-1.6/60,'Rejected scan must not charge extra power');
 const dark=fixture(0);dark.battery=0;
 for(let n=0;n<599;n++)step(dark);assert.equal(dark.phase,'playing');assert.ok(dark.reserve>0);
 step(dark);assert.equal(dark.phase,'lost');assert.equal(dark.lostReason,'darkness');close(dark.reserve,0,'Reserve did not expire');
 return{heldFrames:91,reserveTicks:600};
});
check('collected beacons and physical return are separate conditions; failure takes precedence',()=>{
 const s=fixture(0);step(s);assert.equal(s.phase,'playing');
 s.beacons.forEach(b=>{b.collected=true;b.seen=true;});s.collected=s.target;s.score=s.target*500;s.player.x=s.entry.x+80;
 step(s);assert.equal(s.phase,'playing');s.player.x=s.entry.x;s.player.y=s.entry.y;step(s);assert.equal(s.phase,'won');
 assert.equal(s.score,s.target*500+500+Math.round(s.remaining*10)+s.player.shield*100);
 const frozen=JSON.stringify(s);model.step(s,.25,{x:1,a:true,b:true});assert.equal(JSON.stringify(s),frozen);
 for(const failure of ['shield','darkness']){
  const t=fixture(0);t.beacons.forEach(b=>{b.collected=true;});t.collected=t.target;t.score=t.target*500;
  if(failure==='shield')t.player.shield=0;else{t.battery=0;t.reserve=0;}
  step(t);assert.equal(t.phase,'lost');assert.equal(t.lostReason,failure);assert.equal(t.score,t.target*500);
 }
 return{winConditions:['all-beacons','physical-return'],failureCases:2};
});
assert.equal(sha(await readFile(modelUrl)),modelHash,'Model changed during review; rerun after its source is stable');
const report={kind:'independent-echo-model-review',passed:true,modelSha256:modelHash,reviewScriptSha256:sha(await readFile(fileURLToPath(import.meta.url))),checks,totals,
 methods:['Floyd-Warshall reference on the floor adjacency matrix; terminal wall arrival from neighboring floors','Independent segment-edge geometry for near-light occlusion','Bounded temporal, power, quiet-mode and terminal-priority fixtures'],
 scope:{fixturesModifyState:true,normalGameplayEvidence:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['These mathematical fixtures do not establish ordinary-play solvability or visual quality. Fresh observational pilot and browser recording are separate gates.']};
const output=process.argv.indexOf('--out');if(output>=0){assert.ok(process.argv[output+1],'Missing output file');await writeFile(process.argv[output+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
