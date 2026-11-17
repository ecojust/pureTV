(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  // Public starting boards and hole requirements only: no solution routes.
  var LAYOUTS=[
    {name:'风纹初序',values:[0,1,0,2,0,-1,3,0,6,5,-1,0,0,0,0,4],holes:[0,2,3,4,6,8,9,14],limit:6},
    {name:'岩隙回排',values:[1,-1,2,0,0,3,-1,0,4,0,5,6,-1,0,0,7],holes:[2,4,7,10,14,15],limit:7},
    {name:'双向沙阵',values:[1,0,2,3,-1,5,-1,0,0,0,4,0,8,-1,7,6],holes:[0,9,10,14,15],limit:8}
  ];
  var SNAKE=[0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12];
  var NAV={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function assignments(s){return s.cells.filter(function(c){return c.kind==='sand'&&c.stoneId!==null;}).map(function(c){return{cellId:c.id,stoneId:c.stoneId};});}
  function assignmentMap(list){var map={};list.forEach(function(p){map[p.cellId]=p.stoneId;});return map;}
  function applyAssignments(s,list){
    var map=assignmentMap(list);s.cells.forEach(function(c){c.stoneId=c.kind==='sand'?(map[c.id]||null):null;});
  }
  function lines(s){
    var result=[];
    ['row','column'].forEach(function(axis){for(var index=0;index<4;index++){
      var cells=s.cells.filter(function(c){return axis==='row'?c.row===index:c.col===index;});
      cells.sort(function(a,b){return axis==='row'?a.col-b.col:a.row-b.row;});
      var segments=[],segment=[];
      cells.forEach(function(c){if(c.kind==='pillar'){if(segment.length)segments.push(segment);segment=[];}else segment.push(c.id);});
      if(segment.length)segments.push(segment);
      result.push({id:axis+(index+1),axis:axis,index:index,cellIds:cells.map(function(c){return c.id;}),segments:segments});
    }});return result;
  }
  function analyze(s,map){
    var byCell={},byStone={};s.cells.forEach(function(c){byCell[c.id]=c;});s.stones.forEach(function(p){byStone[p.id]=p;});
    var holeIds=s.cells.filter(function(c){return c.kind==='sand'&&!map[c.id];}).map(function(c){return c.id;});
    var readCellIds=s.snakeOrder.filter(function(id){return byCell[id].kind==='sand'&&!!map[id];});
    var readStoneIds=readCellIds.map(function(id){return map[id];}),readValues=readStoneIds.map(function(id){return byStone[id].value;});
    var orderedPairs=0;for(var i=1;i<readValues.length;i++)if(readValues[i-1]<readValues[i])orderedPairs++;
    var distinct={};readStoneIds.forEach(function(id){distinct[id]=true;});
    var strictlyIncreasing=readValues.length===s.stones.length&&readValues.length>0&&Object.keys(distinct).length===s.stones.length&&orderedPairs===s.stones.length-1;
    var matchedHoleCount=s.targetHoleIds.filter(function(id){return holeIds.indexOf(id)>=0;}).length;
    var holesCorrect=holeIds.length===s.targetHoleIds.length&&matchedHoleCount===s.targetHoleIds.length;
    return{holeIds:holeIds,readCellIds:readCellIds,readStoneIds:readStoneIds,readValues:readValues,
      orderedPairs:orderedPairs,orderPairCount:Math.max(0,s.stones.length-1),strictlyIncreasing:strictlyIncreasing,
      matchedHoleCount:matchedHoleCount,holesCorrect:holesCorrect,goalReady:strictlyIncreasing&&holesCorrect};
  }
  function predict(s,action){
    var before=assignments(s),map=assignmentMap(before),line=s.lines.find(function(l){return l.id===action.lineId;});
    var towardStart=action.direction==='W'||action.direction==='N';
    line.segments.forEach(function(segment){
      var ids=segment.map(function(id){return map[id];}).filter(Boolean);
      segment.forEach(function(id){delete map[id];});
      var offset=towardStart?0:segment.length-ids.length;
      ids.forEach(function(id,index){map[segment[offset+index]]=id;});
    });
    var after=s.cells.filter(function(c){return!!map[c.id];}).map(function(c){return{cellId:c.id,stoneId:map[c.id]};});
    var beforePosition={},afterPosition={};before.forEach(function(p){beforePosition[p.stoneId]=p.cellId;});after.forEach(function(p){afterPosition[p.stoneId]=p.cellId;});
    var moves=s.stones.filter(function(p){return beforePosition[p.id]!==afterPosition[p.id];}).map(function(p){return{stoneId:p.id,fromCellId:beforePosition[p.id],toCellId:afterPosition[p.id]};});
    var changed=moves.length>0,willWin=changed&&analyze(s,map).goalReady;
    return{actionId:action.id,lineId:action.lineId,direction:action.direction,changed:changed,movedCount:moves.length,moves:moves,
      afterAssignments:after,willWin:willWin,willExhaustMoves:changed&&s.movesUsed+1>=s.moveLimit&&!willWin};
  }
  function refresh(s){
    var list=assignments(s),position={};list.forEach(function(p){position[p.stoneId]=p.cellId;});
    s.stones.forEach(function(p){p.cellId=position[p.id];});s.lines=lines(s);
    s.stoneCount=s.stones.length;s.pillarIds=s.cells.filter(function(c){return c.kind==='pillar';}).map(function(c){return c.id;});s.pillarCount=s.pillarIds.length;
    s.targetHoleIds=s.cells.filter(function(c){return c.targetHole;}).map(function(c){return c.id;});s.targetHoleCount=s.targetHoleIds.length;
    Object.assign(s,analyze(s,assignmentMap(list)));s.movesRemaining=Math.max(0,s.moveLimit-s.movesUsed);s.historyDepth=s.history.length;
    s.focusItems=s.actions.map(function(a){return{id:a.id,kind:'compact',x:a.x,y:a.y};});
    var selected=s.focusItems.find(function(f){return f.id===s.selectedId;})||s.focusItems[0];s.selectedId=selected.id;s.cursor=copy(selected);
    s.preview=predict(s,s.actions.find(function(a){return a.id===s.selectedId;}));
    s.score=s.orderedPairs*25+s.matchedHoleCount*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5+s.movesRemaining*50:0);
  }
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;s.transition=null;refresh(s);
    s.message=phase==='won'?'蛇形数列严格递增，目标空洞完全吻合':reason==='timeout'?'规划时间已用尽，请重新尝试':'压实步数已用尽；撤销不会返还已用步数';
    action(s,phase,{reason:s.lostReason});
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function navigate(s,name){
    var from=s.cursor,d=NAV[name],best=null;
    s.focusItems.forEach(function(item,index){
      var dx=item.x-from.x,dy=item.y-from.y;if(dx*d.dx+dy*d.dy<=0)return;
      var distance=dx*dx+dy*dy,perpendicular=Math.abs(dx*d.dy-dy*d.dx);
      var candidate={id:item.id,cost:distance+2*perpendicular*perpendicular,distance:distance,perpendicular:perpendicular,index:index};
      if(!best||candidate.cost<best.cost||candidate.cost===best.cost&&(candidate.distance<best.distance||candidate.distance===best.distance&&
        (candidate.perpendicular<best.perpendicular||candidate.perpendicular===best.perpendicular&&candidate.index<best.index)))best=candidate;
    });
    if(!best){action(s,'select-blocked',{direction:name});return;}
    s.selectedId=best.id;refresh(s);action(s,'select',{direction:name,id:s.selectedId});
    s.message=s.preview.changed?'A 压实所选行或列；B 撤销但不退步数':'所选方向已压实；空操作不耗步数';
  }
  function compact(s){
    s.compactionAttempts++;var p=s.preview;
    if(!p.changed){s.noOpAttempts++;action(s,'no-op',{actionId:p.actionId});s.message='所选方向已压实；未消耗步数，也不增加撤销记录';return;}
    var before=assignments(s);s.movesUsed++;
    var edit={id:s.movesUsed,actionId:p.actionId,lineId:p.lineId,direction:p.direction,beforeAssignments:before,
      afterAssignments:copy(p.afterAssignments),moves:copy(p.moves),movedCount:p.movedCount,at:s.elapsed,tick:s.tick};
    applyAssignments(s,edit.afterAssignments);s.history.push(copy(edit));s.lastCompaction=copy(edit);
    s.transition={kind:'compact',actionId:p.actionId,startedAt:s.elapsed,duration:.24,moves:copy(edit.moves)};
    refresh(s);action(s,'compact',copy(edit));
    if(s.goalReady){finish(s,'won');return;}
    if(s.movesUsed>=s.moveLimit){finish(s,'lost','moves');return;}
    s.message='已压实，段内顺序保持不变；数字石不会合并';
  }
  function undo(s){
    if(!s.history.length){action(s,'undo-empty');s.message='没有可撤销的成功压实；已用步数不会返还';return;}
    var edit=s.history.pop();applyAssignments(s,edit.beforeAssignments);s.selectedId=edit.actionId;s.undos++;
    s.lastUndo={edit:copy(edit),at:s.elapsed,tick:s.tick};
    s.transition={kind:'undo',actionId:edit.actionId,startedAt:s.elapsed,duration:.24,moves:edit.moves.map(function(m){return{stoneId:m.stoneId,fromCellId:m.toCellId,toCellId:m.fromCellId};})};
    refresh(s);action(s,'undo',copy(s.lastUndo));s.message='原石与原格已恢复；压实步数和时间不会返还';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.transition&&s.elapsed+EPS>=s.transition.startedAt+s.transition.duration)s.transition=null;
    refresh(s);
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;undo(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}
      else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;compact(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d],grid={cols:4,rows:4,x:180,y:136,cellSize:72};
    var cells=layout.values.map(function(v,index){var col=index%4,row=Math.floor(index/4);return{id:'C'+(index+1),col:col,row:row,x:grid.x+(col+.5)*grid.cellSize,y:grid.y+(row+.5)*grid.cellSize,kind:v<0?'pillar':'sand',stoneId:v>0?'S'+v:null,targetHole:layout.holes.indexOf(index)>=0};});
    var values=layout.values.filter(function(v){return v>0;}).sort(function(a,b){return a-b;});
    var stones=values.map(function(v){return{id:'S'+v,value:v,cellId:'C'+(layout.values.indexOf(v)+1)};}),actions=[];
    for(var row=0;row<4;row++)['W','E'].forEach(function(dir){actions.push({id:'R'+(row+1)+dir,lineId:'row'+(row+1),direction:dir,x:dir==='W'?140:508,y:grid.y+(row+.5)*grid.cellSize});});
    for(var col=0;col<4;col++)['N','S'].forEach(function(dir){actions.push({id:'C'+(col+1)+dir,lineId:'column'+(col+1),direction:dir,x:grid.x+(col+.5)*grid.cellSize,y:dir==='N'?96:464});});
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,grid:grid,cells:cells,stones:stones,lines:[],actions:actions,
      focusItems:[],selectedId:'R1W',cursor:null,preview:null,pillarIds:[],targetHoleIds:[],holeIds:[],stoneCount:stones.length,pillarCount:0,targetHoleCount:0,
      snakeOrder:SNAKE.map(function(i){return'C'+(i+1);}),readCellIds:[],readStoneIds:[],readValues:[],orderedPairs:0,orderPairCount:stones.length-1,strictlyIncreasing:false,matchedHoleCount:0,holesCorrect:false,goalReady:false,
      moveLimit:layout.limit,movesUsed:0,movesRemaining:layout.limit,compactionAttempts:0,noOpAttempts:0,undos:0,history:[],historyDepth:0,lastCompaction:null,lastUndo:null,transition:null,lastAction:null,events:[],
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'方向选择行列箭头，A 压实；B 撤销但不退步数；蛇序与空洞须同时正确',
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;
    input=input||{};dt=clamp(finite(dt,0),0,.25);var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;s._cancelEpoch=input.cancelEpoch;}
    var a=!!input.a,b=!!input.b;
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);}
    if(s.events.length>32)s.events=s.events.slice(-32);return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
