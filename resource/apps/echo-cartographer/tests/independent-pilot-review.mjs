// Synthetic observation fixtures only; this is not a successful play/capture.
// Run: node resource/apps/echo-cartographer/tests/independent-pilot-review.mjs [--out report.json]
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pilotUrl=new URL('./automation.mjs',import.meta.url), pilotHash=sha(await readFile(pilotUrl));
const {createPilot}=await import(pilotUrl.href+'?independent='+pilotHash);
assert.equal(typeof createPilot,'function');
const times=[0,.1,2,2.1,3,4,5,7], positions=[[1,1],[1,1],[1,1],[2,1],[2,1],[2,2],[3,2],[3,2]];
const floors=new Set(['1,1','2,1','3,1','1,2','2,2','3,2']), walls=new Set(['0,1','0,2','1,0','2,0','3,0','4,1']);
const point=(col,row)=>({col,row,x:100+(col+.5)*40,y:50+(row+.5)*40,tileId:row*19+col});
function make(scenario,index,variant){
 const time=times[index], position=point(...positions[index]), returned=scenario==='return-entry'&&index>=4;
 const cells=[];
 for(let row=0;row<11;row++)for(let col=0;col<19;col++){
  const key=col+','+row, seen=floors.has(key)||walls.has(key);
  cells.push({...point(col,row),id:row*19+col,type:seen?(floors.has(key)?'floor':'wall'):((col+row+variant)%3?'floor':'wall'),seen,
   visible:seen&&scenario!=='faded-chart',revealedUntil:0});
 }
 const beacons=[0,1].map(i=>({id:'beacon-'+(i+1),...point(variant?11+i:16-i,variant?7:8),visible:false,seen:returned,collected:returned}));
 if(scenario==='beacon-memory'&&index>=2){beacons[0].seen=true;if(index===2)Object.assign(beacons[0],point(3,2),{visible:true});}
 const hazard={id:'hazard-1',...point(variant?8:16,variant?4:8),visible:false,radius:11,alerted:false,_route:[variant?9:40],_patrol:[variant?20:60],_lastHeardTileId:variant?42:17};
 if(scenario==='hazard-observation'&&index===2)Object.assign(hazard,point(3,1),{visible:true,alerted:false});
 return {phase:'playing',paused:false,level:0,model:{level:1,difficulty:0,phase:'playing',elapsed:time,tick:Math.round(time*60),
  grid:{cols:19,rows:11,cellSize:40,x:100,y:50},cells,player:{...position,radius:10,shield:3,invulnerable:0},entry:{...point(1,1),radius:18},
  beacons,hazards:[hazard],target:2,collected:returned?2:0,battery:100-time*1.6,maxBattery:120,batteryDrain:1.6,reserve:10,remaining:70,
  sonarCost:3,sonarRange:320,sonarSpeed:200,cooldown:0,revealedCount:cells.filter(c=>c.seen).length,sonarCount:index?1:0,
  waves:[{id:'fixture-wave',x:160,y:110,age:.1,radius:20,frontier:[],_distances:cells.map(c=>variant?c.id:208-c.id)}]}};
}
function publicObservation(snapshot){
 const s=snapshot.model;
 return {phase:snapshot.phase,paused:snapshot.paused,level:s.level,elapsed:s.elapsed,grid:s.grid,player:s.player,entry:s.entry,target:s.target,collected:s.collected,battery:s.battery,reserve:s.reserve,cooldown:s.cooldown,
  chart:s.cells.map(c=>c.seen?{id:c.id,col:c.col,row:c.row,x:c.x,y:c.y,type:c.type,visible:c.visible}:{id:c.id,col:c.col,row:c.row,seen:false}),
  beacons:s.beacons.map(b=>b.visible?{id:b.id,visible:true,x:b.x,y:b.y,col:b.col,row:b.row,collected:b.collected}:{id:b.id,visible:false,seen:b.seen,collected:b.seen?b.collected:undefined}),
  hazards:s.hazards.map(h=>h.visible?{id:h.id,visible:true,x:h.x,y:h.y,radius:h.radius,alerted:h.alerted}:{id:h.id,visible:false})};
}
function guard(object,keys){for(const key of keys)Object.defineProperty(object,key,{enumerable:true,configurable:false,get(){throw new Error('Pilot accessed a hidden field: '+key);}});}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const descriptor of Object.values(Object.getOwnPropertyDescriptors(value)))if('value'in descriptor)freeze(descriptor.value);Object.freeze(value);}return value;}
function forbidHidden(snapshot){
 const s=snapshot.model;
 for(const c of s.cells)if(!c.seen)guard(c,['type']);
 for(const b of s.beacons)if(!b.visible)guard(b,['x','y','col','row','tileId']);
 for(const h of s.hazards){if(!h.visible)guard(h,['x','y','col','row','tileId','radius','alerted']);guard(h,['_route','_patrol','_lastHeardTileId']);}
 for(const wave of s.waves)guard(wave,['_distances']);
 return freeze(snapshot);
}
const checks=[],allowed=new Set(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Space','b','Enter','p','r']);let calls=0,actionFrames=0;
for(const scenario of ['unseen-world','beacon-memory','hazard-observation','faded-chart','return-entry']){
 const a=createPilot(),b=createPilot(),actions=[];
 for(let index=0;index<times.length;index++){
  const left=make(scenario,index,0),right=make(scenario,index,1);
  assert.notDeepEqual(left.model.cells.filter(c=>!c.seen).map(c=>c.type),right.model.cells.filter(c=>!c.seen).map(c=>c.type));
  assert.deepEqual(publicObservation(left),publicObservation(right),'Fixture public observations differ');
  const options={elapsed:times[index],mode:'qa'}, x=a(forbidHidden(left),options),y=b(forbidHidden(right),options);
  assert.deepEqual(x,y,'Hidden world changes altered the next ordinary keys');assert.ok(Array.isArray(x)&&x.every(k=>allowed.has(k)));
  calls+=2;if(x.length)actionFrames++;actions.push(x);
 }
 assert.ok(actions.some(keys=>keys.some(k=>k.startsWith('Arrow'))),'Fixture must reach navigation decisions, not only initial scan/release');
 checks.push({name:scenario,passed:true,identicalObservationPairs:times.length,hiddenGettersBlocked:true,inputSnapshotsFrozen:true,ordinaryActionFrames:actions.filter(x=>x.length).length});
}
assert.equal(sha(await readFile(pilotUrl)),pilotHash,'Pilot changed during review; rerun after source stabilizes');
const report={kind:'independent-pilot-noninterference-review',passed:true,automationSha256:pilotHash,reviewScriptSha256:sha(await readFile(fileURLToPath(import.meta.url))),checks,
 pilotCalls:calls,pairedObservationFrames:checks.length*times.length,ordinaryActionFrames:actionFrames,
 methodology:'Independent fresh pilot pairs receive identical observations with different hidden terrain, beacon locations, patrol positions/routes and wave distance tables. Getter guards forbid hidden reads and frozen snapshots forbid writes.',
 scope:{syntheticObservations:true,normalGameplayEvidence:false,modelExecuted:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['This bounded noninterference check covers the listed observations; successful exploration and recording are separate gates.']};
const output=process.argv.indexOf('--out');if(output>=0){assert.ok(process.argv[output+1]);await writeFile(process.argv[output+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
