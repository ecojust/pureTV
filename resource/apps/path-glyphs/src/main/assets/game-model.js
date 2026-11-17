(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.PureModel=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-10;
  var LAYOUTS=[{"name":"回廊初刻","start":20,"exit":4,"walls":[6,13,16],"runes":{"1":{"symbol":"N","enterFrom":"E"},"5":{"symbol":"W","enterFrom":null},"7":{"symbol":"W","enterFrom":"N"},"8":{"symbol":"N","enterFrom":"W"},"9":{"symbol":"S","enterFrom":"S"},"10":{"symbol":"E","enterFrom":"N"},"11":{"symbol":"N","enterFrom":"E"},"12":{"symbol":"W","enterFrom":"S"},"14":{"symbol":"N","enterFrom":null},"15":{"symbol":"E","enterFrom":"N"},"17":{"symbol":"W","enterFrom":"S"},"18":{"symbol":"E","enterFrom":null},"19":{"symbol":"S","enterFrom":null},"21":{"symbol":"W","enterFrom":"E"},"22":{"symbol":"E","enterFrom":"N"},"24":{"symbol":"S","enterFrom":"N"}},"target":["W","E","E","S","N","S"]},{"name":"逆向石阶","start":0,"exit":24,"walls":[7,11,18],"runes":{"1":{"symbol":"N","enterFrom":"W"},"3":{"symbol":"N","enterFrom":"W"},"6":{"symbol":"N","enterFrom":"N"},"8":{"symbol":"S","enterFrom":"N"},"9":{"symbol":"W","enterFrom":"S"},"13":{"symbol":"E","enterFrom":"N"},"14":{"symbol":"S","enterFrom":null},"15":{"symbol":"E","enterFrom":"N"},"16":{"symbol":"W","enterFrom":null},"17":{"symbol":"S","enterFrom":"N"},"19":{"symbol":"E","enterFrom":"N"},"20":{"symbol":"E","enterFrom":"E"},"22":{"symbol":"E","enterFrom":"W"},"23":{"symbol":"W","enterFrom":"W"}},"target":["N","N","E","S","W","E","W"]},{"name":"四隅回纹","start":22,"exit":2,"walls":[6,17],"runes":{"0":{"symbol":"S","enterFrom":null},"3":{"symbol":"W","enterFrom":null},"4":{"symbol":"N","enterFrom":"S"},"5":{"symbol":"S","enterFrom":"S"},"9":{"symbol":"S","enterFrom":"N"},"10":{"symbol":"S","enterFrom":null},"11":{"symbol":"E","enterFrom":null},"12":{"symbol":"N","enterFrom":null},"13":{"symbol":"S","enterFrom":"S"},"15":{"symbol":"W","enterFrom":null},"18":{"symbol":"N","enterFrom":"S"},"20":{"symbol":"E","enterFrom":"E"},"21":{"symbol":"N","enterFrom":"E"},"23":{"symbol":"W","enterFrom":"N"},"24":{"symbol":"E","enterFrom":null}},"target":["N","N","W","N","E","S","S","S"]}];
  var DIRECTIONS=[{name:'N',dx:0,dy:-1,entry:'S'},{name:'E',dx:1,dy:0,entry:'W'},
    {name:'S',dx:0,dy:1,entry:'N'},{name:'W',dx:-1,dy:0,entry:'E'}];
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function point(cell){return{id:cell.id,col:cell.col,row:cell.row,x:cell.x,y:cell.y};}
  function pathItem(cell,entry,emitted){return{cellId:cell.id,col:cell.col,row:cell.row,x:cell.x,y:cell.y,enteredFrom:entry,emitted:emitted};}
  function direction(input){
    var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);
    if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;
    if(Math.abs(x)>=Math.abs(y))return x>0?'E':'W';
    return y>0?'S':'N';
  }
  function neighbor(s,dir){
    var d=DIRECTIONS.find(function(item){return item.name===dir;});
    var x=s.player.col+d.dx,y=s.player.row+d.dy;
    if(x<0||x>=s.grid.cols||y<0||y>=s.grid.rows)return null;
    return s.cells[y*s.grid.cols+x];
  }
  function refresh(s){
    s.visited=s.cells.map(function(){return false;});
    s.cells.forEach(function(c){c.visited=false;c.visitIndex=null;});
    s.path.forEach(function(p,i){s.visited[p.cellId]=true;s.cells[p.cellId].visited=true;s.cells[p.cellId].visitIndex=i;});
    var end=s.path[s.path.length-1];
    s.player={cellId:end.cellId,col:end.col,row:end.row,x:end.x,y:end.y,enteredFrom:end.enteredFrom};
    s.moves=s.path.length-1;s.prefixLength=0;
    while(s.prefixLength<s.symbols.length&&s.prefixLength<s.target.length&&s.symbols[s.prefixLength]===s.target[s.prefixLength])s.prefixLength++;
    s.sequenceMatches=s.symbols.length===s.target.length&&s.prefixLength===s.target.length;
    if(s.routeStatus!=='rejected')s.routeStatus=end.cellId===s.exit.id?'at-exit':'drawing';
    s.availableMoves=[];
    if(s.phase==='playing'&&s.routeStatus==='drawing')DIRECTIONS.forEach(function(d){
      var c=neighbor(s,d.name);if(c&&c.type!=='wall'&&!s.visited[c.id])s.availableMoves.push(d.name);
    });
    s.score=s.prefixLength*100+(s.phase==='won'?1000+Math.floor(s.remaining)*5+(s.maxMistakes-s.mistakes)*100:0);
  }
  function action(s,type,details){
    s.lastAction=Object.assign({type:type,tick:s.tick,at:s.elapsed},details||{});
    s.events.push(copy(s.lastAction));
  }
  function finish(s,phase,reason){
    s.phase=phase;s.lostReason=reason||null;refresh(s);
    s.message=phase==='won'?'刻印准确，路径已封存':reason==='timeout'?'时间已用尽，请重新规划路径':'三次路线校验失败，请重试';
    action(s,phase,{reason:s.lostReason});
  }
  function clearRoute(s,initial){
    s.path=[pathItem(s.cells[s.start.id],null,null)];s.symbols=[];s.emissions=[];
    s.conditionHits=0;s.conditionSkips=0;s.routeStatus='drawing';s.rejection=null;s.lastMove=null;
    s._heldDirection=null;s._nextMoveTick=0;
    if(!initial)s.clears++;
    refresh(s);
    s.message=initial?'从起点延伸路径；小边刻口规定入边，大箭头是发出的符文':'整条路径已清空；时间和失败次数保留';
    if(!initial)action(s,'clear',{mistakes:s.mistakes});
  }
  function reject(s,reason){
    if(s.routeStatus==='rejected'||s.phase!=='playing')return;
    s.mistakes++;
    var record={attempt:s.mistakes,reason:reason,at:s.elapsed,tick:s.tick,
      path:s.path.map(function(p){return p.cellId;}),symbols:s.symbols.slice()};
    s.rejections.push(record);s.rejection=record;s.routeStatus='rejected';refresh(s);
    action(s,'rejected',{reason:reason,attempt:s.mistakes});
    if(s.mistakes>=s.maxMistakes)finish(s,'lost','mistakes');
    else s.message=reason==='dead-end'?'前方已无未访问邻格，路线已拒绝；按 B 清空重画':'出口刻印与目标不一致，路线已拒绝；按 B 清空重画';
  }
  function submit(s){
    if(s.routeStatus==='rejected')return;
    if(s.player.cellId!==s.exit.id){s.message='请先走到出口，再按 A 提交刻印';action(s,'submit-blocked',{reason:'not-at-exit'});return;}
    s.submissions++;refresh(s);action(s,'submit',{accepted:s.sequenceMatches});
    if(s.sequenceMatches)finish(s,'won');else reject(s,'wrong-sequence');
  }
  function move(s,dir){
    if(s.routeStatus!=='drawing')return;
    var c=neighbor(s,dir),reason=!c?'outside':c.type==='wall'?'wall':s.visited[c.id]?'visited':null;
    if(reason){s.blockedMoves++;s.message=reason==='visited'?'已访问的格子不能重入；按 B 可清空整条路径':reason==='wall'?'石墙不能穿过':'已到棋盘边缘';action(s,'blocked',{direction:dir,reason:reason});return;}
    var d=DIRECTIONS.find(function(item){return item.name===dir;}),entry=d.entry,emitted=null,conditionalResult=null;
    var from=s.player.cellId;
    if(c.rune){
      if(c.rune.enterFrom===null||c.rune.enterFrom===entry){
        emitted=c.rune.symbol;
        if(c.rune.enterFrom!==null){s.conditionHits++;conditionalResult='active';}
      }else{s.conditionSkips++;conditionalResult='skipped';}
    }
    s.path.push(pathItem(c,entry,emitted));s.totalMoves++;
    if(emitted!==null){s.symbols.push(emitted);s.emissions.push({cellId:c.id,symbol:emitted,enteredFrom:entry,pathIndex:s.path.length-1});}
    s.lastMove={fromCellId:from,toCellId:c.id,enteredFrom:entry,emitted:emitted,conditionalResult:conditionalResult,at:s.elapsed,expiresAt:s.elapsed+.6};
    refresh(s);action(s,'move',copy(s.lastMove));
    if(s.routeStatus==='at-exit')s.message='已到出口：按 A 校验完整刻印，或按 B 清空重画';
    else if(s.availableMoves.length===0)reject(s,'dead-end');
    else if(conditionalResult==='skipped')s.message='从 '+entry+' 边进入，未符合本格条件：不发出符文';
    else if(emitted!==null)s.message='已收集符文 '+emitted+'；继续规划不可重复的路径';
    else s.message='路径已延伸；先核对目标与实际刻印，再继续前进';
  }
  function tick(s,dir){
    s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS){finish(s,'lost','timeout');return;}
    if(s.lastMove&&s.elapsed>=s.lastMove.expiresAt)s.lastMove=null;
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;clearRoute(s,false);return;}
    if(s._pendingA){s._pendingA=false;submit(s);return;}
    if(s.routeStatus!=='drawing')return;
    if(s.availableMoves.length===0){reject(s,'dead-end');return;}
    if(!dir)return;
    if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;move(s,dir);}
    else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;move(s,dir);}
  }
  function create(seed,difficulty){
    var level=clamp(Math.floor(finite(difficulty,0)),0,2),layout=LAYOUTS[level];
    var grid={cols:5,rows:5,cellSize:70,x:305,y:90};
    var cells=Array.from({length:25},function(_,id){var col=id%5,row=Math.floor(id/5);return{
      id:id,col:col,row:row,x:grid.x+(col+.5)*grid.cellSize,y:grid.y+(row+.5)*grid.cellSize,
      type:layout.walls.indexOf(id)>=0?'wall':'floor',role:id===layout.start?'start':id===layout.exit?'exit':null,
      rune:layout.runes[id]?copy(layout.runes[id]):null,visited:false,visitIndex:null};});
    var s={width:960,height:540,seed:finite(seed,1),level:level+1,difficulty:level,levelName:layout.name,
      grid:grid,cells:cells,start:point(cells[layout.start]),exit:point(cells[layout.exit]),player:null,
      path:[],visited:[],symbols:[],emissions:[],target:layout.target.slice(),conditionHits:0,conditionSkips:0,
      prefixLength:0,sequenceMatches:false,routeStatus:'drawing',phase:'playing',availableMoves:[],
      mistakes:0,maxMistakes:3,rejections:[],rejection:null,moves:0,totalMoves:0,clears:0,submissions:0,blockedMoves:0,
      lastMove:null,lastAction:null,events:[],tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,message:'',lostReason:null,
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    clearRoute(s,true);return s;
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
    if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}
    else{
      if((a&&!s._lastA)||input.aPressed)s._pendingA=true;
      if((b&&!s._lastB)||input.bPressed)s._pendingB=true;
    }
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
