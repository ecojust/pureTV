(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  var LAYOUTS=[{"name":"晨露花径","waterBudget":6,"markedIds":[0,5,10,15],"initialPattern":[false,true,true,false,true,false,true,false,true,true,false,false,true,false,false,true],"targetPattern":[true,false,false,true,false,true,true,false,false,true,true,false,true,false,false,true]},{"name":"花环交织","waterBudget":8,"markedIds":[0,3,5,10,12,15],"initialPattern":[false,false,false,true,true,false,true,false,true,false,true,false,false,false,false,true],"targetPattern":[true,true,true,true,true,true,false,true,true,false,true,true,true,true,true,true]},{"name":"棋畦双雨","waterBudget":10,"markedIds":[0,2,5,7,8,10,13,15],"initialPattern":[false,false,false,false,true,false,true,false,false,true,true,false,true,false,true,true],"targetPattern":[true,false,true,false,false,true,false,true,true,false,true,false,false,true,false,true]}];
  var NOZZLES=[
    {id:'cross',label:'十字喷头',offsets:[{dx:0,dy:0},{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}]},
    {id:'diagonal',label:'斜角喷头',offsets:[{dx:0,dy:0},{dx:-1,dy:-1},{dx:1,dy:-1},{dx:1,dy:1},{dx:-1,dy:1}]}
  ];
  var DIRECTIONS={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}};
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function finite(value,fallback){return Number.isFinite(value)?value:fallback;}
  function clamp(value,lo,hi){return Math.max(lo,Math.min(hi,value));}
  function affected(s){
    var center=s.cells[s.selectedId],nozzle=s.nozzles.find(function(n){return n.id===s.nozzle;}),ids=[];
    nozzle.offsets.forEach(function(offset){
      var col=center.col+offset.dx,row=center.row+offset.dy;
      if(col<0||col>=s.grid.cols||row<0||row>=s.grid.rows)return;
      var id=row*s.grid.cols+col;if(ids.indexOf(id)<0)ids.push(id);
    });
    return ids.sort(function(a,b){return a-b;});
  }
  function refresh(s){
    s.cells.forEach(function(cell){
      cell.directParity=cell.directWaterCount%2;
      cell.conditionMet=!cell.requiresEven||(cell.open&&cell.directParity===0);
      cell.matched=cell.open===cell.targetOpen;
    });
    s.targetPattern=s.cells.map(function(cell){return cell.targetOpen;});
    s.markedIds=s.cells.filter(function(cell){return cell.requiresEven;}).map(function(cell){return cell.id;});
    s.markedCount=s.markedIds.length;
    s.satisfiedMarked=s.cells.filter(function(cell){return cell.requiresEven&&cell.conditionMet;}).length;
    s.allMarkedSatisfied=s.satisfiedMarked===s.markedCount;
    s.matchedCells=s.cells.filter(function(cell){return cell.matched;}).length;
    s.patternMatched=s.matchedCells===s.cells.length;s.goalMatched=s.patternMatched&&s.allMarkedSatisfied;
    var c=s.cells[s.selectedId];s.cursor={id:c.id,col:c.col,row:c.row,x:c.x,y:c.y};
    s.previewIds=affected(s);s.waterRemaining=s.waterBudget-s.waterUsed;
    s.score=s.matchedCells*20+s.satisfiedMarked*40+(s.phase==='won'?1000+s.waterRemaining*100+Math.floor(s.remaining)*5:0);
  }
  function action(s,type,details){
    s.lastAction=Object.assign({type:type,tick:s.tick,at:s.elapsed},details||{});s.events.push(copy(s.lastAction));
  }
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'花形与标记花的开放、直浇偶数条件全部完成':reason==='timeout'?'时间已用尽，请重新规划浇水次序':'水滴已用尽，图案或标记花条件仍未完成';
    action(s,phase,{reason:s.lostReason});
  }
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');
  }
  function select(s,name){
    var c=s.cells[s.selectedId],d=DIRECTIONS[name];
    var col=clamp(c.col+d.dx,0,s.grid.cols-1),row=clamp(c.row+d.dy,0,s.grid.rows-1),id=row*s.grid.cols+col;
    if(id===s.selectedId){action(s,'select-blocked',{direction:name});return;}
    s.selectedId=id;refresh(s);action(s,'select',{cellId:id,direction:name});
    var cell=s.cells[id];
    s.message='本格直浇 '+cell.directWaterCount+' 次（'+(cell.directParity?'奇数':'偶数')+'）'+(cell.requiresEven?'；标记花需开放且直浇偶数':'；按 A 使用当前喷头浇水');
  }
  function switchNozzle(s){
    var index=s.nozzles.findIndex(function(n){return n.id===s.nozzle;});
    var next=s.nozzles[(index+1)%s.nozzles.length];s.nozzle=next.id;s.nozzleSwitches++;refresh(s);
    action(s,'nozzle',{nozzle:s.nozzle});s.message='已换为'+next.label+'；切换不退水，也不撤销';
  }
  function water(s){
    var ids=affected(s),cell=s.cells[s.selectedId],directBefore=cell.directWaterCount;
    var changes=ids.map(function(id){var c=s.cells[id],before=c.open;c.open=!c.open;return{cellId:id,beforeOpen:before,afterOpen:c.open};});
    cell.directWaterCount++;s.waterUsed++;s.totalAffectedToggles+=ids.length;
    s.lastWater={id:s.waterUsed,cellId:s.selectedId,nozzle:s.nozzle,affectedIds:ids,changes:changes,
      directBefore:directBefore,directAfter:cell.directWaterCount,at:s.elapsed,expiresAt:s.elapsed+.6};
    refresh(s);action(s,'water',copy(s.lastWater));
    if(s.goalMatched)finish(s,'won');
    else if(s.waterRemaining<=0)finish(s,'lost','water');
    else if(s.patternMatched)s.message='花形已匹配，但标记花的直浇偶数条件未完成';
    else s.message='已切换 '+ids.length+' 格花形；只有选中格的直接浇水次数加一';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.lastWater&&s.elapsed>=s.lastWater.expiresAt)s.lastWater=null;
    if(!dir){s._heldDirection=null;s._nextSelectTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;switchNozzle(s);return;}
    if(dir){
      if(dir!==s._heldDirection){s._heldDirection=dir;s._nextSelectTick=s.tick+20;select(s,dir);}
      else if(s.tick>=s._nextSelectTick){s._nextSelectTick=s.tick+10;select(s,dir);}
    }
    if(s._pendingA){s._pendingA=false;water(s);}
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[d];
    var grid={cols:4,rows:4,x:304,y:100,cellSize:78};
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:layout.name,
      grid:grid,targetView:{x:72,y:150,cellSize:40},
      cells:Array.from({length:16},function(_,id){var col=id%4,row=Math.floor(id/4);return{
        id:id,col:col,row:row,x:grid.x+(col+.5)*grid.cellSize,y:grid.y+(row+.5)*grid.cellSize,
        open:layout.initialPattern[id],targetOpen:layout.targetPattern[id],requiresEven:layout.markedIds.indexOf(id)>=0,
        directWaterCount:0,directParity:0,conditionMet:false,matched:false};}),
      targetPattern:[],markedIds:[],selectedId:5,cursor:null,nozzles:copy(NOZZLES),nozzle:'cross',previewIds:[],
      waterBudget:layout.waterBudget,waterUsed:0,waterRemaining:layout.waterBudget,nozzleSwitches:0,totalAffectedToggles:0,
      matchedCells:0,patternMatched:false,markedCount:0,satisfiedMarked:0,allMarkedSatisfied:false,goalMatched:false,
      lastWater:null,lastAction:null,events:[],phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:null,
      message:'对照目标花形；标记花还需开放且直接浇水次数为偶数',
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextSelectTick:0,_cancelEpoch:null};
    refresh(s);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;
    input=input||{};dt=clamp(finite(dt,0),0,.25);
    var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){
      if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;
      s._cancelEpoch=input.cancelEpoch;
    }
    var a=!!input.a,b=!!input.b;
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextSelectTick=0;}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;
    var dir=cancelled?null:direction(input);
    while(s._accumulator+EPS>=DT&&s.phase==='playing'){
      s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);
    }
    if(s.events.length>32)s.events=s.events.slice(-32);
    return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
