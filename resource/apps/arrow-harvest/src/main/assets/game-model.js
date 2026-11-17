(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PureModel=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10,TURN=['N','E','S','W'];
  var DIR={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
  // Public initial arrows and cell roles only. No winning arrow assignment.
  var LEVELS=[
    {name:'环田分流',sources:[0,15],stops:[1,14],forbidden:[5,6,9,10],editable:[0,4,7,13,15],arrows:['E',null,'W','W','N',null,null,'W','S',null,null,'N','E','N',null,'W']},
    {name:'交口避让',sources:[4,9],stops:[6,11],forbidden:[5,10],editable:[1,3,4,9,13,15],arrows:['E','N','E','W','S',null,null,'W','S','W',null,null,'E','N','E','W']},
    {name:'三路归仓',sources:[0,4,10],stops:[5,7,13],forbidden:[3,12],editable:[0,1,4,9,10,11,14],arrows:['S','N','S',null,'E',null,'E',null,'E','S','N','N',null,null,'E','W']}
  ];
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function index(id){return Number(id.slice(1))-1;}
  function orderedSeeds(s){return s.seeds.slice().sort(function(a,b){return s.sourceIds.indexOf(a.sourceId)-s.sourceIds.indexOf(b.sourceId);});}
  function updateCursor(s){var c=s.cells[index(s.selectedId)];s.cursor={id:c.id,row:c.row,col:c.col,x:c.x,y:c.y,editable:c.editable,role:c.role};}
  function refreshCoverage(s){
    s.cells.forEach(function(c,i){c.coverageCount=s.coverageCounts[i];c.covered=c.coverageCount===1;c.seedIds=[];});
    orderedSeeds(s).forEach(function(seed){s.cells[index(seed.cellId)].seedIds.push(seed.id);});
    s.activeSeedCount=s.seeds.filter(function(seed){return seed.status==='active';}).length;
    s.stoppedSeedCount=s.seeds.filter(function(seed){return seed.status==='stopped';}).length;s.allSeedsStopped=s.stoppedSeedCount===s.sourceCount;
    s.coveredTargetIds=s.targetIds.filter(function(id){return s.coverageCounts[index(id)]===1;});
    s.uncoveredTargetIds=s.targetIds.filter(function(id){return s.coverageCounts[index(id)]!==1;});
    s.coveredCount=s.coveredTargetIds.length;s.remainingTargetCount=s.uncoveredTargetIds.length;s.allTargetsCovered=s.remainingTargetCount===0;
    s.goalReady=s.allTargetsCovered&&s.allSeedsStopped;s.score=s.coveredCount*40+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason,wave){
    s.phase=phase;s.mode='finished';s.lostReason=reason||null;s.nextWaveTick=null;s.waveProgress=0;refreshCoverage(s);
    if(phase==='lost'){
      var cellIds=[],seedIds=[];
      if(reason==='forbidden'||reason==='overlap'){
        var issues=wave.issues,issueCells=issues.forbiddenCellIds.concat(issues.revisitedCellIds,issues.simultaneousCellIds);
        cellIds=s.cells.filter(function(c){return issueCells.indexOf(c.id)>=0;}).map(function(c){return c.id;});
        seedIds=wave.intents.filter(function(i){return i.outside||cellIds.indexOf(i.toId)>=0;}).map(function(i){return i.seedId;});
      }
      s.failure={reason:reason,waveIndex:reason==='timeout'?null:s.waveIndex,cellIds:cellIds,seedIds:seedIds,missingTargetIds:s.uncoveredTargetIds.slice()};
    }
    s.message=phase==='won'?'全部种子归仓，每个目标田块恰好覆盖一次':reason==='forbidden'?'整拍未提交：种子将越界或进入禁地':reason==='overlap'?'整拍未提交：种子将重复覆盖或同时进入同格':reason==='incomplete'?'种子已全部归仓，但仍有目标田块未覆盖':'有效时间已用尽，本拍没有额外移动';
    action(s,phase,{reason:s.lostReason});
  }
  function direction(input){var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');}
  function navigate(s,name){
    var c=s.cells[index(s.selectedId)],d=DIR[name],row=clamp(c.row+d.y,0,3),col=clamp(c.col+d.x,0,3),id='C'+(row*4+col+1);
    if(id===s.selectedId){action(s,'select-blocked',{direction:name,id:id});return;}
    s.selectedId=id;updateCursor(s);action(s,'select',{direction:name,id:id});
    s.message=s.cursor.editable?'A 顺时针转向，B 播种并锁定全部箭头':'此格不可转向；B 播种并锁定全部箭头';
  }
  function rotate(s){
    var c=s.cells[index(s.selectedId)];
    if(!c.editable){action(s,'locked',{cellId:c.id,role:c.role});s.message='此格不可转向；只有可编辑箭头能用 A 调整';return;}
    var before=c.arrow;c.arrow=TURN[(TURN.indexOf(before)+1)%4];s.editCount++;
    s.lastEdit={id:s.editCount,cellId:c.id,before:before,after:c.arrow,at:s.elapsed,tick:s.tick};action(s,'rotate',copy(s.lastEdit));
    s.message='箭头已转向；播种前仍可调整，B 开始唯一一次播种';
  }
  function sow(s){
    s.runArrows=s.cells.map(function(c){return c.arrow;});s.launchCount=1;s.mode='propagating';s.sowingStartedAt=s.elapsed;s.sowingStartedTick=s.tick;
    s.seeds.forEach(function(seed){seed.cellId=seed.sourceId;seed.status='active';seed.steps=0;seed.stopId=null;seed.stoppedAtWave=null;});
    s.sourceIds.forEach(function(id){s.coverageCounts[index(id)]=1;});s.nextWaveTick=s.tick+s.waveIntervalTicks;s.waveProgress=0;
    s._heldDirection=null;s._nextMoveTick=0;refreshCoverage(s);
    action(s,'sow',{sourceIds:s.sourceIds.slice(),seedIds:orderedSeeds(s).map(function(seed){return seed.id;}),coveredIds:s.coveredTargetIds.slice()});
    s.message='播种已锁定布局；所有种子每拍同时前进，不能中途改箭头';
  }
  function propagate(s){
    // Phase 1: read only the same old positions, frozen arrows and coverage.
    var intents=orderedSeeds(s).filter(function(seed){return seed.status==='active';}).map(function(seed){
      var from=s.cells[index(seed.cellId)],direction=s.runArrows[index(seed.cellId)],d=DIR[direction],row=from.row+d.y,col=from.col+d.x,outside=row<0||row>=4||col<0||col>=4;
      return{seedId:seed.id,fromId:from.id,direction:direction,toId:outside?null:'C'+(row*4+col+1),toRow:row,toCol:col,outside:outside};
    });
    var grouped={};intents.forEach(function(i){if(!i.outside){if(!grouped[i.toId])grouped[i.toId]=[];grouped[i.toId].push(i.seedId);}});
    var arrivals=s.cells.filter(function(c){return!!grouped[c.id];}).map(function(c){return{cellId:c.id,seedIds:grouped[c.id].slice(),count:grouped[c.id].length,previousCoverage:s.coverageCounts[index(c.id)]};});
    var issues={outsideSeedIds:intents.filter(function(i){return i.outside;}).map(function(i){return i.seedId;}),
      forbiddenCellIds:arrivals.filter(function(a){return s.cells[index(a.cellId)].role==='forbidden';}).map(function(a){return a.cellId;}),
      revisitedCellIds:arrivals.filter(function(a){return a.previousCoverage>0;}).map(function(a){return a.cellId;}),
      simultaneousCellIds:arrivals.filter(function(a){return a.count>=2;}).map(function(a){return a.cellId;})};
    var reason=issues.outsideSeedIds.length||issues.forbiddenCellIds.length?'forbidden':issues.revisitedCellIds.length||issues.simultaneousCellIds.length?'overlap':null;
    s.waveIndex++;var wave={id:s.waveIndex,at:s.elapsed,tick:s.tick,accepted:reason===null,failureReason:reason,intents:intents,arrivals:arrivals,issues:issues,newlyCoveredIds:[],stoppedSeedIds:[]};
    // Phase 2: either commit the complete valid batch, or commit no movement.
    if(reason){s.lastWave=copy(wave);action(s,'wave',copy(wave));finish(s,'lost',reason,wave);return;}
    var bySeed={};s.seeds.forEach(function(seed){bySeed[seed.id]=seed;});
    intents.forEach(function(i){var seed=bySeed[i.seedId],cell=s.cells[index(i.toId)];seed.cellId=cell.id;seed.steps++;s.coverageCounts[index(cell.id)]=1;
      if(cell.role==='stop'){seed.status='stopped';seed.stopId=cell.id;seed.stoppedAtWave=s.waveIndex;wave.stoppedSeedIds.push(seed.id);}
    });
    wave.newlyCoveredIds=arrivals.map(function(a){return a.cellId;});s.acceptedWaves++;refreshCoverage(s);s.lastWave=copy(wave);action(s,'wave',copy(wave));
    if(s.allSeedsStopped){finish(s,s.allTargetsCovered?'won':'lost',s.allTargetsCovered?null:'incomplete',wave);return;}
    s.nextWaveTick=s.tick+s.waveIntervalTicks;s.waveProgress=0;s.message='本拍已整体提交；已归仓种子停留，其余等待下一拍';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.mode==='propagating'){
      s._pendingA=false;s._pendingB=false;
      if(s.tick>=s.nextWaveTick)propagate(s);else s.waveProgress=clamp((s.tick-(s.nextWaveTick-s.waveIntervalTicks))/s.waveIntervalTicks,0,1);
      return;
    }
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;sow(s);return;}
    if(dir){if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}}
    if(s._pendingA){s._pendingA=false;rotate(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LEVELS[d],grid={rows:4,cols:4,x:104,y:108,cellSize:84};
    var cells=layout.arrows.map(function(arrow,i){var row=Math.floor(i/4),col=i%4,role=layout.forbidden.indexOf(i)>=0?'forbidden':layout.sources.indexOf(i)>=0?'source':layout.stops.indexOf(i)>=0?'stop':'field';
      return{id:'C'+(i+1),row:row,col:col,x:grid.x+(col+.5)*grid.cellSize,y:grid.y+(row+.5)*grid.cellSize,role:role,target:role!=='forbidden',editable:layout.editable.indexOf(i)>=0,initialArrow:arrow,arrow:arrow,coverageCount:0,covered:false,seedIds:[]};});
    function ids(role){return cells.filter(function(c){return c.role===role;}).map(function(c){return c.id;});}
    var sourceIds=ids('source'),stopIds=ids('stop'),targetIds=cells.filter(function(c){return c.target;}).map(function(c){return c.id;}),editableIds=cells.filter(function(c){return c.editable;}).map(function(c){return c.id;});
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,grid:grid,cells:cells,sourceIds:sourceIds,stopIds:stopIds,targetIds:targetIds,forbiddenIds:ids('forbidden'),editableIds:editableIds,
      sourceCount:sourceIds.length,stopCount:stopIds.length,targetCount:targetIds.length,editableCount:editableIds.length,selectedId:editableIds[0],cursor:null,
      editCount:0,lastEdit:null,launchCount:0,runArrows:null,sowingStartedAt:null,sowingStartedTick:null,
      seeds:sourceIds.map(function(id,i){return{id:'S'+(i+1),sourceId:id,cellId:id,status:'waiting',steps:0,stopId:null,stoppedAtWave:null};}),activeSeedCount:0,stoppedSeedCount:0,allSeedsStopped:false,
      coverageCounts:Array(16).fill(0),coveredTargetIds:[],uncoveredTargetIds:targetIds.slice(),coveredCount:0,remainingTargetCount:targetIds.length,allTargetsCovered:false,goalReady:false,
      waveIntervalTicks:30,waveIndex:0,acceptedWaves:0,nextWaveTick:null,waveProgress:0,lastWave:null,failure:null,lastAction:null,events:[],
      phase:'playing',mode:'editing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,message:'方向选择田格，A 转动可编辑箭头，B 播种并锁定布局',lostReason:null,
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    updateCursor(s);refreshCoverage(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;input=input||{};dt=clamp(finite(dt,0),0,.25);var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;s._cancelEpoch=input.cancelEpoch;}
    var a=!!input.a,b=!!input.b;
    if(cancelled||s.mode!=='editing'){s._pendingA=false;s._pendingB=false;if(cancelled){s._heldDirection=null;s._nextMoveTick=0;}}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);}if(s.events.length>32)s.events=s.events.slice(-32);return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
